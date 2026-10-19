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

/**
 * Une session d'entraînement au checkout, côté écran.
 *
 * La volée s'accumule localement puis part d'un coup : contrairement au X01,
 * inutile de prévoir le reste à chaque fléchette, puisqu'une manche se joue en
 * une seule volée. On s'arrête dès que la sortie tombe — poursuivre n'aurait
 * aucun sens.
 *
 * La volée en cours reste hors du journal, doublée du brouillon de volée
 * (`useVoleeEnCours`, lot `volee-partielle`), rattaché au nombre de manches
 * jouées : après un rechargement, même reste à viser (il est au journal,
 * `RoundStarted`), aucun nouveau tirage.
 */
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

  /**
   * La manche se clôt à la sortie, au bust, ou à la troisième fléchette — et
   * jamais de confirmation à l'entraînement : rien n'est `en-attente`.
   */
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
      // La dernière fléchette vient de partir : un second appui réflexe ne doit
      // pas défaire la manche précédente (voir `usePauseAnnulation`).
      if (dartsEnCours.length === 1) armer()
      return
    }
    if (!ecoulee()) return
    if (!state || state.roundsPlayed === 0) return

    // La manche se rouvre (lot `annulation-volee`) : même reste à viser, ses
    // fléchettes restantes reviennent en saisie. Pas de confirmation ici.
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

  /**
   * Ce que le bouton va retirer, écrit dessus — voir `libelleAnnulation`. Seul,
   * le joueur est toujours le même : celui de la séance.
   */
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
