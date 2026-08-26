import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { RecordVisitResult } from '@/core/application/ports/driving/RecordVisit'
import { type Dart, Dart as DartVO, type Multiplier } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { annonceFinDeVolee, annonceVolee, libelleAnnulation, nomJoueur } from '@/ui/labels'
import { useServices } from '../providers/ServicesProvider'
import { prochainJoueur } from './tourDeTable'
import { useVoix } from './useAppareil'
import { useProfils } from './useJoueurs'

const message = (erreur: unknown): string =>
  erreur instanceof Error ? erreur.message : 'Volée refusée'

/**
 * L'état d'un match en cours, côté écran.
 *
 * ⚠️ TanStack Query sert ici de **cache**, pas d'orchestrateur : chaque volée
 * enregistrée renvoie déjà le nouvel état, qu'on injecte directement dans le
 * cache. Aucun aller-retour de rechargement entre le tap et le score affiché.
 *
 * La volée **en cours de saisie** n'est pas persistée : elle vit en état local
 * et n'est envoyée au use case qu'une fois complète (3 fléchettes, bust ou
 * sortie) — c'est le port `PreviewVisit` qui le détermine.
 */
export const useX01 = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()

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
  const [dartsEnCours, setDartsEnCours] = useState<readonly Dart[]>([])
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

  const enregistrer = useCallback(
    async (darts: readonly Dart[]) => {
      setOccupe(true)
      setErreur(null)
      try {
        const resultat = await services.recordVisit.execute({ matchId, darts })
        queryClient.setQueryData(['match', matchId], resultat.state)
        setDartsEnCours([])
        setDerniereVolee(resultat)

        if (resultat.visit.outcome === 'BUSTED') services.devices.haptics.error()
        else if (resultat.visit.outcome === 'CHECKOUT') services.devices.haptics.success()

        // Le score, puis à qui c'est le tour : le téléphone est posé à deux
        // mètres du lanceur, la voix est le seul canal qui porte jusque-là.
        dire(
          annonceFinDeVolee(
            annonceVolee(resultat.visit.scored, resultat.visit.outcome),
            prochainJoueur(resultat.state, profilsRef.current),
          ),
        )
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
      if (!state || !joueurCourant || occupe || termine) return

      const suite = [...dartsEnCours, dart]
      services.devices.haptics.tap()
      setDartsEnCours(suite)
      // La célébration du leg précédent ne doit pas survivre à la reprise du jeu.
      setDerniereVolee(null)

      // Le multiplicateur retombe sur SIMPLE après chaque fléchette : il ne
      // reste jamais armé à l'insu du joueur. C'est ici et pas dans le pavé,
      // pour que la règle tienne quelle que soit la façon de saisir.
      setMultiplicateur('SIMPLE')

      const evaluation = services.previewVisit.execute({
        config: state.config,
        remaining: joueurCourant.remaining,
        hasOpened: joueurCourant.hasOpened,
        darts: suite,
      })
      if (evaluation.complete) void enregistrer(suite)
    },
    [services, state, joueurCourant, occupe, termine, dartsEnCours, enregistrer],
  )

  /** Saisie rapide : un score de volée plutôt que trois fléchettes. */
  const enregistrerScore = useCallback(
    async (total: number, dartsUsed: number) => {
      if (!state || !joueurCourant || occupe || termine) return

      setDerniereVolee(null)

      const sortie = state.config.doubleOut && joueurCourant.remaining - total === 0
      const darts = services.buildVisitFromScore.execute({
        config: state.config,
        total,
        dartsUsed,
        finishOnDouble: sortie,
      })

      if (!darts) {
        services.devices.haptics.error()
        setErreur(`${total} est impossible en ${dartsUsed} fléchette${dartsUsed > 1 ? 's' : ''}.`)
        return
      }
      await enregistrer(darts)
    },
    [services, state, joueurCourant, occupe, termine, enregistrer],
  )

  /**
   * Un seul bouton d'annulation, qui fait ce qu'on attend : retirer la
   * fléchette qu'on vient de taper si la volée est en cours, sinon annuler la
   * dernière volée enregistrée (même si elle avait gagné un leg).
   */
  const annuler = useCallback(async () => {
    setErreur(null)

    if (dartsEnCours.length > 0) {
      services.devices.haptics.tap()
      setDartsEnCours((darts) => darts.slice(0, -1))
      return
    }
    if (!state || state.history.length === 0) return

    setOccupe(true)
    try {
      const revenu = await services.undoLastVisit.execute(matchId)
      queryClient.setQueryData(['match', matchId], revenu)
      setDerniereVolee(null)
      services.devices.haptics.tap()
    } catch (cause) {
      setErreur(message(cause))
    } finally {
      setOccupe(false)
    }
  }, [services, state, matchId, dartsEnCours.length, queryClient])

  /**
   * Ce que le bouton va défaire, écrit dessus. L'auteur de la dernière volée
   * se lit sur la **projection** (`Visit.playerId`), jamais recalculé ici :
   * l'UI ne rejoue aucune règle, elle lit ce que le domaine a déduit.
   */
  const annulation = useMemo(() => {
    const derniereFlechette = dartsEnCours.at(-1)
    if (derniereFlechette) return libelleAnnulation(DartVO.label(derniereFlechette), null)

    const volee = state?.history.at(-1)
    if (!volee) return libelleAnnulation(null, null)
    return libelleAnnulation(null, nomJoueur(profils.get(volee.playerId)?.name ?? null))
  }, [dartsEnCours, state, profils])

  return {
    state,
    chargement: requete.isPending,
    erreurChargement: requete.error,
    joueurCourant,
    termine,
    dartsEnCours,
    resteAffiche,
    apercu,
    suggestion,
    derniereVolee,
    multiplicateur,
    setMultiplicateur,
    ajouterFlechette,
    enregistrerScore,
    annuler,
    annulation,
    peutAnnuler: dartsEnCours.length > 0 || (state?.history.length ?? 0) > 0,
    occupe,
    erreur,
  }
}

export type SaisieX01 = ReturnType<typeof useX01>
