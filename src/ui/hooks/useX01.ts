import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { RecordVisitResult } from '@/core/application/ports/driving/RecordVisit'
import type { X01State } from '@/core/domain/games/x01/rules'
import { type Dart, Dart as DartVO, type Multiplier } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import {
  annonceFinDeVolee,
  annonceVolee,
  libelleAnnulation,
  nomJoueur,
  phraseVictoire,
  texteConfirmationX01,
  titreConfirmationX01,
} from '@/ui/labels'
import { useServices } from '../providers/ServicesProvider'
import { prochainJoueur } from './tourDeTable'
import { useVoix } from './useAppareil'
import { useProfils } from './useJoueurs'
import { usePauseAnnulation } from './usePauseAnnulation'
import { type EtatVolee, useVoleeEnCours } from './useVoleeEnCours'

const message = (erreur: unknown): string =>
  erreur instanceof Error ? erreur.message : 'Volée refusée'

/**
 * L'état d'un match en cours, côté écran.
 *
 * ⚠️ TanStack Query sert ici de **cache**, pas d'orchestrateur : chaque volée
 * enregistrée renvoie déjà le nouvel état, qu'on injecte directement dans le
 * cache. Aucun aller-retour de rechargement entre le tap et le score affiché.
 *
 * La volée **en cours de saisie** n'entre pas au journal : elle vit en état
 * local, doublée du brouillon de volée (`useVoleeEnCours`, lot
 * `volee-partielle`) qui la fait survivre à un rechargement, et n'est envoyée
 * au use case qu'une fois complète (3 fléchettes, bust ou sortie) — c'est le
 * port `PreviewVisit` qui le détermine.
 */
export const useX01 = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()
  const { enPause, armer, ecoulee } = usePauseAnnulation()

  // Les pseudos, pour appeler le joueur suivant par son nom. Gardés dans une
  // ref : la Map est reconstruite à chaque rendu, la mettre en dépendance
  // recréerait tous les callbacks du hook pour rien.
  const profils = useProfils()
  const profilsRef = useRef(profils)
  profilsRef.current = profils

  const requete = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => services.getMatchState.execute(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const state = requete.data ?? null

  /**
   * Où en est une volée, d'après `PreviewVisit` (aucune règle recopiée) : la
   * sortie attend *Valider* quand sa fléchette est la dernière de la volée.
   */
  const evaluer = useCallback(
    (base: X01State, darts: readonly Dart[]): EtatVolee => {
      const joueur = base.players[base.currentPlayerIndex]
      if (!joueur) return 'close'
      const evaluation = services.previewVisit.execute({
        config: base.config,
        remaining: joueur.remaining,
        hasOpened: joueur.hasOpened,
        darts,
      })
      if (!evaluation.complete) return 'ouverte'
      if (evaluation.outcome === 'CHECKOUT' && evaluation.dartsUsed === darts.length) {
        return 'en-attente'
      }
      return 'close'
    },
    [services],
  )
  const volee = useVoleeEnCours(matchId, state, evaluer)
  const dartsEnCours = volee.darts
  const poser = volee.poser

  const [multiplicateur, setMultiplicateur] = useState<Multiplier>('SIMPLE')
  const [derniereVolee, setDerniereVolee] = useState<RecordVisitResult | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const joueurCourant = state?.players[state.currentPlayerIndex] ?? null
  const termine = state?.winnerId != null

  const apercu = useMemo(() => {
    if (!state || !joueurCourant) return null
    return services.previewVisit.execute({
      config: state.config,
      remaining: joueurCourant.remaining,
      hasOpened: joueurCourant.hasOpened,
      darts: dartsEnCours,
    })
  }, [services, state, joueurCourant, dartsEnCours])

  /** Le reste tel qu'il doit s'afficher : il suit chaque fléchette saisie. */
  const resteAffiche =
    apercu && apercu.outcome !== 'BUSTED' ? apercu.remainingAfter : (joueurCourant?.remaining ?? 0)

  const suggestion = useMemo(() => {
    if (!state || termine || apercu?.outcome === 'BUSTED') return null
    const flechettesRestantes = 3 - dartsEnCours.length
    if (flechettesRestantes < 1) return null
    return services.getCheckoutSuggestion.execute({
      remaining: resteAffiche,
      dartsLeft: flechettesRestantes,
      config: state.config,
    })
  }, [services, state, termine, apercu, dartsEnCours.length, resteAffiche])

  /**
   * Jusqu'où une sortie existe ce soir : 170 sur un double, 180 en sortie libre.
   * Au-delà, le tableau n'affiche ni route ni « Pas de finish ». Lue par le port,
   * jamais en dur dans l'écran.
   */
  const doubleOut = state?.config.doubleOut ?? null
  const sortieMax = useMemo(
    () => (doubleOut === null ? 0 : services.getCheckoutRange.execute({ doubleOut }).max),
    [services, doubleOut],
  )

  const enregistrer = useCallback(
    async (darts: readonly Dart[]) => {
      setOccupe(true)
      setErreur(null)
      try {
        const resultat = await services.recordVisit.execute({ matchId, darts })
        queryClient.setQueryData(['match', matchId], resultat.state)
        // La volée est au journal : son brouillon s'efface, après sa dernière écriture (file).
        poser([], resultat.state)
        setDerniereVolee(resultat)

        if (resultat.visit.outcome === 'BUSTED') services.devices.haptics.error()
        else if (resultat.visit.outcome === 'CHECKOUT') services.devices.haptics.success()

        // Le score, puis à qui c'est le tour : le téléphone est posé à deux
        // mètres du lanceur, la voix est le seul canal qui porte jusque-là.
        // À la victoire du match seulement (`MatchFinished`, jamais `LegWon` ni
        // `SetWon`) : la phrase du résumé, dans le même énoncé.
        const matchGagne = resultat.milestones.some((jalon) => jalon.type === 'MatchFinished')
        dire(
          annonceFinDeVolee(
            annonceVolee(resultat.visit.scored, resultat.visit.outcome),
            prochainJoueur(resultat.state, profilsRef.current),
            matchGagne ? phraseVictoire(matchId) : undefined,
          ),
        )
      } catch (cause) {
        setErreur(message(cause))
      } finally {
        setOccupe(false)
      }
    },
    [services, matchId, queryClient, dire, poser],
  )

  /**
   * La fléchette qui sort attend sa confirmation (lot `annulation-volee`) :
   * l'aperçu des fléchettes en cours est une sortie, et rien n'est encore écrit,
   * dit ni célébré. Dérivé, jamais stocké : retirer la fléchette suffit à
   * l'éteindre.
   */
  const sortieEnAttente = !termine && dartsEnCours.length > 0 && apercu?.outcome === 'CHECKOUT'

  /** Ce que la boîte demande : « Kevin sort sur D10 ? », « 40 → 0. … ». */
  const confirmation = useMemo(() => {
    const flechette = dartsEnCours.at(-1)
    if (!sortieEnAttente || !joueurCourant || !flechette) return null
    return {
      titre: titreConfirmationX01(
        nomJoueur(profils.get(joueurCourant.playerId)?.name ?? null),
        DartVO.label(flechette),
      ),
      texte: texteConfirmationX01(joueurCourant.remaining),
    }
  }, [sortieEnAttente, joueurCourant, dartsEnCours, profils])

  /**
   * Retire la dernière fléchette en cours. La dernière partie, la pause s'arme :
   * un second appui réflexe ne doit pas défaire la volée d'un autre joueur
   * (voir `usePauseAnnulation`).
   */
  const retirerFlechette = useCallback(() => {
    if (dartsEnCours.length === 0 || !state) return
    services.devices.haptics.tap()
    poser(dartsEnCours.slice(0, -1), state)
    if (dartsEnCours.length === 1) armer()
  }, [services, dartsEnCours, state, poser, armer])

  /**
   * Ajoute une fléchette ; rend `true` quand elle **met une sortie en attente** :
   * la volée n'est pas envoyée, l'écran ouvre la boîte de confirmation. Toute
   * nouvelle fléchette est refusée tant que la sortie attend.
   */
  const ajouterFlechette = useCallback(
    (dart: Dart): boolean => {
      if (!state || !joueurCourant || occupe || termine || sortieEnAttente) return false

      const suite = [...dartsEnCours, dart]
      services.devices.haptics.tap()
      poser(suite, state)
      // La célébration du leg précédent ne doit pas survivre à la reprise du jeu.
      setDerniereVolee(null)

      // Le multiplicateur retombe sur SIMPLE après chaque fléchette : il ne
      // reste jamais armé à l'insu du joueur. C'est ici et pas dans le pavé,
      // pour que la règle tienne quelle que soit la façon de saisir.
      setMultiplicateur('SIMPLE')

      switch (evaluer(state, suite)) {
        case 'ouverte':
          return false
        // La sortie attend *Valider* : ni journal, ni voix, ni célébration avant.
        case 'en-attente':
          return true
        // Le bust, lui, n'est jamais confirmé.
        case 'close':
          void enregistrer(suite)
          return false
      }
    },
    [
      services,
      state,
      joueurCourant,
      occupe,
      termine,
      sortieEnAttente,
      dartsEnCours,
      poser,
      evaluer,
      enregistrer,
    ],
  )

  /** *Corriger* : la fléchette de sortie est retirée, la volée reprend. */
  const corrigerSortie = useCallback(() => {
    if (!sortieEnAttente || occupe) return
    retirerFlechette()
  }, [sortieEnAttente, occupe, retirerFlechette])

  /** *Valider la sortie* : la volée part au journal ; voix et célébration suivent. */
  const validerSortie = useCallback(() => {
    if (!sortieEnAttente || occupe) return
    void enregistrer(dartsEnCours)
  }, [sortieEnAttente, occupe, enregistrer, dartsEnCours])

  /**
   * Un seul bouton d'annulation, une fléchette par appui (lot
   * `annulation-volee`) : la dernière en cours, sinon la dernière de la volée
   * enregistrée juste avant — même si elle avait gagné une manche. Cette volée
   * quitte le journal et se rouvre : ses fléchettes restantes reviennent en
   * saisie, le reste les suit.
   */
  const annuler = useCallback(async () => {
    if (occupe) return
    setErreur(null)

    if (dartsEnCours.length > 0) {
      retirerFlechette()
      return
    }
    if (!ecoulee()) return
    if (!state || state.history.length === 0) return

    setOccupe(true)
    try {
      const { state: revenu, darts } = await services.undoLastVisit.execute(matchId)
      queryClient.setQueryData(['match', matchId], revenu)
      // Estampillée avec l'état **rouvert** : la volée rouverte survit à un rechargement.
      poser(darts, revenu)
      setDerniereVolee(null)
      services.devices.haptics.tap()
      // Plus rien en main : la pause protège la volée du joueur d'avant.
      if (darts.length === 0) armer()
    } catch (cause) {
      setErreur(message(cause))
    } finally {
      setOccupe(false)
    }
  }, [
    services,
    state,
    matchId,
    dartsEnCours.length,
    queryClient,
    occupe,
    armer,
    ecoulee,
    retirerFlechette,
    poser,
  ])

  /**
   * Ce que le bouton va retirer, écrit dessus : la fléchette, et son joueur
   * dans le nom accessible. L'auteur de la dernière volée se lit sur la
   * **projection** (`Visit.playerId`), jamais recalculé ici.
   */
  const annulation = useMemo(() => {
    const derniereFlechette = dartsEnCours.at(-1)
    if (derniereFlechette && joueurCourant) {
      return libelleAnnulation(
        DartVO.label(derniereFlechette),
        nomJoueur(profils.get(joueurCourant.playerId)?.name ?? null),
      )
    }

    const volee = state?.history.at(-1)
    const flechette = volee?.darts.at(-1)
    if (!volee || !flechette) return libelleAnnulation(null, null)
    return libelleAnnulation(
      DartVO.label(flechette),
      nomJoueur(profils.get(volee.playerId)?.name ?? null),
    )
  }, [dartsEnCours, joueurCourant, state, profils])

  return {
    state,
    // La partie est là, mais sa volée en cours n'a pas encore été relue.
    chargement: requete.isPending || (state !== null && !volee.pret),
    /** Le brouillon de volée a été relu : `useConfirmationSortie` peut rouvrir la boîte. */
    pret: volee.pret,
    erreurChargement: requete.error,
    joueurCourant,
    termine,
    dartsEnCours,
    resteAffiche,
    apercu,
    suggestion,
    sortieMax,
    derniereVolee,
    multiplicateur,
    setMultiplicateur,
    ajouterFlechette,
    sortieEnAttente,
    confirmation,
    corrigerSortie,
    validerSortie,
    annuler,
    annulation,
    peutAnnuler: dartsEnCours.length > 0 || (!enPause && (state?.history.length ?? 0) > 0),
    occupe,
    erreur,
  }
}

export type SaisieX01 = ReturnType<typeof useX01>
