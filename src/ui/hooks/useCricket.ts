import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { CricketVisitResult } from '@/core/application/ports/driving/PlayCricket'
import type { CricketState } from '@/core/domain/games/cricket/rules'
import { type Dart, Dart as DartVO, type Multiplier } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import {
  annonceCricket,
  annonceFinDeVolee,
  libelleAnnulation,
  nomJoueur,
  phraseVictoire,
  TEXTE_CONFIRMATION_CRICKET,
  titreConfirmationCricket,
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
 * L'état d'une partie de Cricket, côté écran.
 *
 * Même principe qu'ailleurs : TanStack Query sert de **cache**, la volée
 * enregistrée renvoie déjà le nouvel état, qu'on injecte directement.
 *
 * Comme au X01 et au Tour du monde, la volée en cours est « prévue » par un
 * port : au Cricket il n'y a ni bust ni sortie, mais une volée s'arrête sur la
 * fléchette qui gagne la partie, et l'écran ne peut pas le deviner seul.
 * En revanche le multiplicateur compte ici (il vaut une, deux ou trois
 * marques), donc la bascule S/D/T du X01 revient — **momentanée**, elle aussi.
 *
 * La volée en cours reste hors du journal, doublée du brouillon de volée
 * (`useVoleeEnCours`, lot `volee-partielle`) qui la fait survivre à un rechargement.
 */
export const useCricket = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()
  const { enPause, armer, ecoulee } = usePauseAnnulation()

  // Les pseudos, pour appeler le joueur suivant par son nom. Gardés dans une
  // ref : la Map est reconstruite à chaque rendu.
  const profils = useProfils()
  const profilsRef = useRef(profils)
  profilsRef.current = profils

  const requete = useQuery({
    queryKey: ['cricket', matchId],
    queryFn: () => services.playCricket.getState(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const state = requete.data ?? null

  /**
   * La volée est close à trois fléchettes — ou dès celle qui gagne la partie,
   * qui attend *Valider*. Lu sur `PreviewCricketVisit`, jamais recopié.
   */
  const evaluer = useCallback(
    (base: CricketState, darts: readonly Dart[]): EtatVolee => {
      const evaluation = services.previewCricketVisit.execute({ state: base, darts })
      if (!evaluation.complete) return 'ouverte'
      if (evaluation.state.finished) return 'en-attente'
      return 'close'
    },
    [services],
  )
  const volee = useVoleeEnCours(matchId, state, evaluer)
  const dartsEnCours = volee.darts
  const poser = volee.poser

  const [multiplicateur, setMultiplicateur] = useState<Multiplier>('SIMPLE')
  const [derniereVolee, setDerniereVolee] = useState<CricketVisitResult | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const joueurCourant = state?.players[state.currentPlayerIndex] ?? null
  const termine = state?.finished ?? false

  /**
   * Le tableau **tel qu'il doit s'afficher** : marques et points suivent chaque
   * fléchette, avant même que la volée ne soit enregistrée. Le calcul vient du
   * port, jamais d'un comptage recopié ici — une divergence sur la valeur d'une
   * marque serait invisible jusqu'à ce qu'elle fausse une partie.
   */
  const apercu = useMemo(() => {
    if (!state || termine) return null
    return services.previewCricketVisit.execute({ state, darts: dartsEnCours })
  }, [services, state, termine, dartsEnCours])

  const affiche = apercu?.state ?? state

  const enregistrer = useCallback(
    async (darts: readonly Dart[]) => {
      setOccupe(true)
      setErreur(null)
      try {
        const resultat = await services.playCricket.recordVisit(matchId, darts)
        queryClient.setQueryData(['cricket', matchId], resultat.state)
        poser([], resultat.state)
        setDerniereVolee(resultat)

        const gagnee = resultat.milestones.some((jalon) => jalon.type === 'MatchFinished')
        if (gagnee || resultat.visit.closed.length > 0) services.devices.haptics.success()

        const annonce = annonceCricket({
          points: resultat.visit.points,
          fermees: resultat.visit.closed.length,
          gagnee,
          cutThroat: resultat.state.config.variant === 'CUT_THROAT',
        })
        // Une volée blanche ne se commente pas, mais elle passe quand même la
        // main : sans l'appel, personne ne saurait que c'est à lui.
        // La victoire (cut-throat compris) ajoute la phrase du résumé, même énoncé.
        dire(
          annonceFinDeVolee(
            annonce,
            prochainJoueur(resultat.state, profilsRef.current),
            gagnee ? phraseVictoire(matchId) : undefined,
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
   * La fléchette qui gagne la partie attend sa confirmation (lot
   * `annulation-volee`) : lue sur l'aperçu, jamais sur une règle recopiée.
   */
  const sortieEnAttente = dartsEnCours.length > 0 && (apercu?.state.finished ?? false)

  /**
   * « Kevin gagne sur T20 ? ». En cut-throat, une fléchette de Julien peut faire
   * gagner Kevin : le nom est celui du **gagnant** de l'aperçu.
   */
  const confirmation = useMemo(() => {
    const flechette = dartsEnCours.at(-1)
    const gagnant = apercu?.state.winnerId ?? null
    if (!sortieEnAttente || !flechette || gagnant === null) return null
    return {
      titre: titreConfirmationCricket(
        nomJoueur(profils.get(gagnant)?.name ?? null),
        DartVO.label(flechette),
      ),
      texte: TEXTE_CONFIRMATION_CRICKET,
    }
  }, [sortieEnAttente, dartsEnCours, apercu, profils])

  /** Retire la dernière fléchette en cours ; la dernière partie, la pause s'arme. */
  const retirerFlechette = useCallback(() => {
    if (dartsEnCours.length === 0 || !state) return
    services.devices.haptics.tap()
    poser(dartsEnCours.slice(0, -1), state)
    if (dartsEnCours.length === 1) armer()
  }, [services, dartsEnCours, state, poser, armer])

  /** Rend `true` quand la fléchette gagne la partie : l'écran demande confirmation. */
  const ajouterFlechette = useCallback(
    (dart: Dart): boolean => {
      if (!state || occupe || termine || sortieEnAttente) return false

      const suite = [...dartsEnCours, dart]
      services.devices.haptics.tap()
      poser(suite, state)
      setDerniereVolee(null)

      // Le multiplicateur retombe sur SIMPLE après chaque fléchette : il ne
      // reste jamais armé à l'insu du joueur. La règle vit dans le hook, pas
      // dans le pavé, pour tenir quelle que soit la façon de saisir.
      setMultiplicateur('SIMPLE')

      // La volée est close à trois fléchettes — ou dès celle qui gagne la
      // partie : réclamer les deux suivantes n'aurait aucun sens. Celle-là
      // attend *Valider* avant d'être écrite.
      switch (evaluer(state, suite)) {
        case 'ouverte':
          return false
        case 'en-attente':
          return true
        case 'close':
          void enregistrer(suite)
          return false
      }
    },
    [services, state, occupe, termine, sortieEnAttente, dartsEnCours, poser, evaluer, enregistrer],
  )

  /** *Corriger* : la fléchette gagnante est retirée, la volée reprend. */
  const corrigerSortie = useCallback(() => {
    if (!sortieEnAttente || occupe) return
    retirerFlechette()
  }, [sortieEnAttente, occupe, retirerFlechette])

  /** *Valider la sortie* : la volée part au journal ; voix et haptique suivent. */
  const validerSortie = useCallback(() => {
    if (!sortieEnAttente || occupe) return
    void enregistrer(dartsEnCours)
  }, [sortieEnAttente, occupe, enregistrer, dartsEnCours])

  /**
   * Une fléchette par appui : la dernière en cours, sinon la dernière de la
   * volée enregistrée juste avant, qui se rouvre (voir `useX01`).
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
      const { state: revenu, darts } = await services.playCricket.undoLastVisit(matchId)
      queryClient.setQueryData(['cricket', matchId], revenu)
      poser(darts, revenu)
      setDerniereVolee(null)
      services.devices.haptics.tap()
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

  /** Ce que le bouton va retirer, écrit dessus — voir `libelleAnnulation`. */
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
    /** Le tableau à afficher : l'état réel augmenté de la volée en cours. */
    affiche,
    // La partie est là, mais sa volée en cours n'a pas encore été relue.
    chargement: requete.isPending || (state !== null && !volee.pret),
    /** Le brouillon de volée a été relu : `useConfirmationSortie` peut rouvrir la boîte. */
    pret: volee.pret,
    erreurChargement: requete.error,
    joueurCourant,
    termine,
    dartsEnCours,
    multiplicateur,
    setMultiplicateur,
    derniereVolee,
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
