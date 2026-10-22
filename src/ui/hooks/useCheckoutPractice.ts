import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import type { CheckoutPracticeState } from '@/core/domain/games/checkout-practice/rules'
import { type Dart, Dart as DartVO, type Multiplier } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { annonceIssue, libelleAnnulation, nomJoueur } from '@/ui/labels'
import { useServices } from '../providers/ServicesProvider'
import { useVoix } from './useAppareil'
import { useProfils } from './useJoueurs'
import { usePauseAnnulation } from './usePauseAnnulation'
import { type EtatVolee, useVoleeEnCours } from './useVoleeEnCours'

const message = (erreur: unknown): string =>
  erreur instanceof Error ? erreur.message : 'Volée refusée'

/** Une session d'entraînement au checkout : une manche = une volée, hors journal jusqu'à sa clôture. */
export const useCheckoutPractice = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()
  const { enPause, armer, ecoulee } = usePauseAnnulation()
  const profils = useProfils()

  const requete = useQuery({
    queryKey: ['checkoutPractice', matchId],
    queryFn: () => services.playCheckoutPractice.getState(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const state = requete.data ?? null

  /** Close à la sortie, au bust ou à la 3e fléchette ; jamais `en-attente` à l'entraînement. */
  const evaluer = useCallback((base: CheckoutPracticeState, darts: readonly Dart[]): EtatVolee => {
    const cibleDeLaManche = base.current?.target ?? null
    if (cibleDeLaManche === null) return 'close'
    const reste = darts.reduce((total, lancee) => total - DartVO.points(lancee), cibleDeLaManche)
    return darts.length >= 3 || reste <= 1 ? 'close' : 'ouverte'
  }, [])
  const volee = useVoleeEnCours(matchId, state, evaluer)
  const dartsEnCours = volee.darts
  const poser = volee.poser

  const [multiplicateur, setMultiplicateur] = useState<Multiplier>('SIMPLE')
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const cible = state?.current?.target ?? null
  const termine = state?.finished ?? false

  /** Le reste affiché suit chaque fléchette, sans consulter le domaine. */
  const resteAffiche =
    cible === null ? 0 : dartsEnCours.reduce((reste, dart) => reste - DartVO.points(dart), cible)

  const enregistrer = useCallback(
    async (darts: readonly Dart[]) => {
      setOccupe(true)
      setErreur(null)
      try {
        const resultat = await services.playCheckoutPractice.recordVisit(matchId, darts)
        queryClient.setQueryData(['checkoutPractice', matchId], resultat.state)
        poser([], resultat.state)

        if (resultat.outcome === 'CHECKOUT') services.devices.haptics.success()
        else if (resultat.outcome === 'BUSTED') services.devices.haptics.error()
        dire(annonceIssue(resultat.outcome))
      } catch (cause) {
        setErreur(message(cause))
      } finally {
        setOccupe(false)
      }
    },
    [services, matchId, queryClient, dire, poser],
  )

  const ajouterFlechette = useCallback(
    (dart: Dart) => {
      if (!state || occupe || termine || cible === null) return

      const suite = [...dartsEnCours, dart]
      services.devices.haptics.tap()
      poser(suite, state)
      // Le multiplicateur retombe sur Simple, comme partout dans l'app.
      setMultiplicateur('SIMPLE')

      // La manche se clôt à la sortie, au bust, ou à la troisième fléchette.
      if (evaluer(state, suite) === 'close') void enregistrer(suite)
    },
    [services, state, occupe, termine, cible, dartsEnCours, poser, evaluer, enregistrer],
  )

  const annuler = useCallback(async () => {
    if (occupe) return
    setErreur(null)

    if (dartsEnCours.length > 0) {
      if (!state) return
      services.devices.haptics.tap()
      poser(dartsEnCours.slice(0, -1), state)
      // Un second appui réflexe ne doit pas défaire la manche précédente (`usePauseAnnulation`).
      if (dartsEnCours.length === 1) armer()
      return
    }
    if (!ecoulee()) return
    if (!state || state.roundsPlayed === 0) return

    // La manche se rouvre : même reste à viser, fléchettes restantes en saisie.
    setOccupe(true)
    try {
      const { state: revenu, darts } = await services.playCheckoutPractice.undoLastVisit(matchId)
      queryClient.setQueryData(['checkoutPractice', matchId], revenu)
      // Estampillée avec l'état rouvert : la manche rouverte survit à un rechargement.
      poser(darts, revenu)
      services.devices.haptics.tap()
      if (darts.length === 0) armer()
    } catch (cause) {
      setErreur(message(cause))
    } finally {
      setOccupe(false)
    }
  }, [services, state, matchId, dartsEnCours, queryClient, occupe, armer, ecoulee, poser])

  /** Ce que le bouton va retirer, voir `libelleAnnulation`. */
  const annulation = useMemo(() => {
    const joueur = state ? nomJoueur(profils.get(state.playerId)?.name ?? null) : null
    const flechette =
      dartsEnCours.at(-1) ??
      state?.rounds
        .filter((round) => round.outcome !== null)
        .at(-1)
        ?.darts.at(-1)
    return libelleAnnulation(flechette ? DartVO.label(flechette) : null, joueur)
  }, [dartsEnCours, state, profils])

  return {
    state,
    // La séance est là, mais sa volée en cours n'a pas encore été relue.
    chargement: requete.isPending || (state !== null && !volee.pret),
    /** Le brouillon de volée a été relu (jamais de boîte à l'entraînement, rendu par symétrie). */
    pret: volee.pret,
    erreurChargement: requete.error,
    cible,
    resteAffiche,
    termine,
    dartsEnCours,
    multiplicateur,
    setMultiplicateur,
    ajouterFlechette,
    annuler,
    annulation,
    peutAnnuler: dartsEnCours.length > 0 || (!enPause && (state?.roundsPlayed ?? 0) > 0),
    occupe,
    erreur,
  }
}
