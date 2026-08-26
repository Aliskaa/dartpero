import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { CricketVisitResult } from '@/core/application/ports/driving/PlayCricket'
import { type Dart, Dart as DartVO, type Multiplier } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { annonceCricket, annonceFinDeVolee, libelleAnnulation, nomJoueur } from '@/ui/labels'
import { useServices } from '../providers/ServicesProvider'
import { prochainJoueur } from './tourDeTable'
import { useVoix } from './useAppareil'
import { useProfils } from './useJoueurs'

const message = (erreur: unknown): string =>
  erreur instanceof Error ? erreur.message : 'Volée refusée'

/**
 * L'état d'une partie de Cricket, côté écran.
 *
 * Même principe qu'ailleurs : TanStack Query sert de **cache**, la volée
 * enregistrée renvoie déjà le nouvel état, qu'on injecte directement.
 *
 * Comme au Tour du monde, la volée en cours n'a pas besoin d'être « prévue »
 * par un port : au Cricket il n'y a ni bust ni sortie, une volée fait toujours
 * trois fléchettes — sauf celle qui gagne, et c'est le domaine qui la tronque.
 * En revanche le multiplicateur compte ici (il vaut une, deux ou trois
 * marques), donc la bascule S/D/T du X01 revient — **momentanée**, elle aussi.
 */
export const useCricket = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()

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
  const [dartsEnCours, setDartsEnCours] = useState<readonly Dart[]>([])
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
        setDartsEnCours([])
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
        dire(annonceFinDeVolee(annonce, prochainJoueur(resultat.state, profilsRef.current)))
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
      if (!state || occupe || termine) return

      const suite = [...dartsEnCours, dart]
      services.devices.haptics.tap()
      setDartsEnCours(suite)
      setDerniereVolee(null)

      // Le multiplicateur retombe sur SIMPLE après chaque fléchette : il ne
      // reste jamais armé à l'insu du joueur. La règle vit dans le hook, pas
      // dans le pavé, pour tenir quelle que soit la façon de saisir.
      setMultiplicateur('SIMPLE')

      // La volée est close à trois fléchettes — ou dès celle qui gagne la
      // partie : réclamer les deux suivantes n'aurait aucun sens.
      if (services.previewCricketVisit.execute({ state, darts: suite }).complete) {
        void enregistrer(suite)
      }
    },
    [services, state, occupe, termine, dartsEnCours, enregistrer],
  )

  /**
   * Un seul bouton, qui fait ce qu'on attend : retirer la fléchette qu'on vient
   * de taper si la volée est en cours, sinon annuler la dernière volée
   * enregistrée.
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
      const revenu = await services.playCricket.undoLastVisit(matchId)
      queryClient.setQueryData(['cricket', matchId], revenu)
      setDerniereVolee(null)
      services.devices.haptics.tap()
    } catch (cause) {
      setErreur(message(cause))
    } finally {
      setOccupe(false)
    }
  }, [services, state, matchId, dartsEnCours.length, queryClient])

  /** Ce que le bouton va défaire, écrit dessus — voir `libelleAnnulation`. */
  const annulation = useMemo(() => {
    const derniereFlechette = dartsEnCours.at(-1)
    if (derniereFlechette) return libelleAnnulation(DartVO.label(derniereFlechette), null)

    const volee = state?.history.at(-1)
    if (!volee) return libelleAnnulation(null, null)
    return libelleAnnulation(null, nomJoueur(profils.get(volee.playerId)?.name ?? null))
  }, [dartsEnCours, state, profils])

  return {
    state,
    /** Le tableau à afficher : l'état réel augmenté de la volée en cours. */
    affiche,
    chargement: requete.isPending,
    erreurChargement: requete.error,
    joueurCourant,
    termine,
    dartsEnCours,
    multiplicateur,
    setMultiplicateur,
    derniereVolee,
    ajouterFlechette,
    annuler,
    annulation,
    peutAnnuler: dartsEnCours.length > 0 || (state?.history.length ?? 0) > 0,
    occupe,
    erreur,
  }
}
