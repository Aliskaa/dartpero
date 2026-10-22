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

/** L'état d'une partie de Cricket : la volée en cours est prévue par `PreviewCricketVisit`, hors journal. */
export const useCricket = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()
  const { enPause, armer, ecoulee } = usePauseAnnulation()

  // Pseudos en ref : la Map est reconstruite à chaque rendu.
  const profils = useProfils()
  const profilsRef = useRef(profils)
  profilsRef.current = profils

  const requete = useQuery({
    queryKey: ['cricket', matchId],
    queryFn: () => services.playCricket.getState(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const state = requete.data ?? null

  /** Close à trois fléchettes ou à celle qui gagne (elle attend *Valider*), lu sur `PreviewCricketVisit`. */
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

  /** Le tableau tel qu'il s'affiche : marques et points suivent chaque fléchette, calculés par le port. */
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
        // Une volée blanche passe quand même la main ; la victoire ajoute la phrase du résumé, même énoncé.
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

  /** La fléchette qui gagne attend sa confirmation : lue sur l'aperçu. */
  const sortieEnAttente = dartsEnCours.length > 0 && (apercu?.state.finished ?? false)

  /** « Kevin gagne sur T20 ? » : le nom est celui du gagnant (en cut-throat, Julien peut faire gagner Kevin). */
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

      // Le multiplicateur retombe sur SIMPLE après chaque fléchette.
      setMultiplicateur('SIMPLE')

      // Close à trois fléchettes ou à celle qui gagne, qui attend *Valider*.
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

  /** Une fléchette par appui, comme `useX01`. */
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
