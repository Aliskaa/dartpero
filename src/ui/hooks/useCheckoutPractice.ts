import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { type Dart, Dart as DartVO, type Multiplier } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { annonceIssue } from '@/ui/labels'
import { useServices } from '../providers/ServicesProvider'
import { useVoix } from './useAppareil'
import { usePauseAnnulation } from './usePauseAnnulation'

const message = (erreur: unknown): string =>
  erreur instanceof Error ? erreur.message : 'Volée refusée'

/**
 * Une session d'entraînement au checkout, côté écran.
 *
 * La volée s'accumule localement puis part d'un coup : contrairement au X01,
 * inutile de prévoir le reste à chaque fléchette, puisqu'une manche se joue en
 * une seule volée. On s'arrête dès que la sortie tombe — poursuivre n'aurait
 * aucun sens.
 */
export const useCheckoutPractice = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()
  const { enPause, armer, ecoulee } = usePauseAnnulation()

  const requete = useQuery({
    queryKey: ['checkoutPractice', matchId],
    queryFn: () => services.playCheckoutPractice.getState(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const state = requete.data ?? null
  const [dartsEnCours, setDartsEnCours] = useState<readonly Dart[]>([])
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
        setDartsEnCours([])

        if (resultat.outcome === 'CHECKOUT') services.devices.haptics.success()
        else if (resultat.outcome === 'BUSTED') services.devices.haptics.error()
        dire(annonceIssue(resultat.outcome))
      } catch (cause) {
        setErreur(message(cause))
      } finally {
        setOccupe(false)
      }
    },
    [services, matchId, queryClient, dire],
  )

  const ajouterFlechette = useCallback(
    (dart: Dart) => {
      if (!state || occupe || termine || cible === null) return

      const suite = [...dartsEnCours, dart]
      services.devices.haptics.tap()
      setDartsEnCours(suite)
      // Le multiplicateur retombe sur Simple, comme partout dans l'app.
      setMultiplicateur('SIMPLE')

      // La manche se clôt à la sortie, au bust, ou à la troisième fléchette.
      const reste = suite.reduce((total, lancee) => total - DartVO.points(lancee), cible)
      if (suite.length >= 3 || reste <= 1) void enregistrer(suite)
    },
    [services, state, occupe, termine, cible, dartsEnCours, enregistrer],
  )

  const annuler = useCallback(async () => {
    if (occupe) return
    setErreur(null)

    if (dartsEnCours.length > 0) {
      services.devices.haptics.tap()
      setDartsEnCours((darts) => darts.slice(0, -1))
      // La dernière fléchette vient de partir : un second appui réflexe ne doit
      // pas défaire la manche précédente (voir `usePauseAnnulation`).
      if (dartsEnCours.length === 1) armer()
      return
    }
    if (!ecoulee()) return
    if (!state || state.roundsPlayed === 0) return

    setOccupe(true)
    try {
      const revenu = await services.playCheckoutPractice.undoLastVisit(matchId)
      queryClient.setQueryData(['checkoutPractice', matchId], revenu)
      services.devices.haptics.tap()
    } catch (cause) {
      setErreur(message(cause))
    } finally {
      setOccupe(false)
    }
  }, [services, state, matchId, dartsEnCours.length, queryClient, occupe, armer, ecoulee])

  return {
    state,
    chargement: requete.isPending,
    erreurChargement: requete.error,
    cible,
    resteAffiche,
    termine,
    dartsEnCours,
    multiplicateur,
    setMultiplicateur,
    ajouterFlechette,
    annuler,
    peutAnnuler: dartsEnCours.length > 0 || (!enPause && (state?.roundsPlayed ?? 0) > 0),
    occupe,
    erreur,
  }
}
