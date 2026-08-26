import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { TourDuMondeVisitResult } from '@/core/application/ports/driving/PlayTourDuMonde'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { annonceFinDeVolee, libelleAnnulation, nomJoueur } from '@/ui/labels'
import { useServices } from '../providers/ServicesProvider'
import { prochainJoueur } from './tourDeTable'
import { useVoix } from './useAppareil'
import { useProfils } from './useJoueurs'

const message = (erreur: unknown): string =>
  erreur instanceof Error ? erreur.message : 'Volée refusée'

/**
 * L'état d'une partie de Tour du monde, côté écran.
 *
 * Même principe qu'au X01 : TanStack Query sert de **cache**, la volée
 * enregistrée renvoie déjà le nouvel état, qu'on injecte directement.
 *
 * Différence notable : ici la volée en cours n'a pas besoin d'être « prévue »
 * par un port. Toucher une cible ou non est immédiat et sans conséquence
 * cachée — pas de bust, pas de double à surveiller. On accumule donc les
 * fléchettes localement et on enregistre quand la volée est complète.
 */
export const useTourDuMonde = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()

  // Les pseudos, pour appeler le joueur suivant par son nom. Gardés dans une
  // ref : la Map est reconstruite à chaque rendu.
  const profils = useProfils()
  const profilsRef = useRef(profils)
  profilsRef.current = profils

  const requete = useQuery({
    queryKey: ['tourDuMonde', matchId],
    queryFn: () => services.playTourDuMonde.getState(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const state = requete.data ?? null
  const [dartsEnCours, setDartsEnCours] = useState<readonly Dart[]>([])
  const [derniereVolee, setDerniereVolee] = useState<TourDuMondeVisitResult | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const joueurCourant = state?.players[state.currentPlayerIndex] ?? null
  const termine = state?.finished ?? false

  const enregistrer = useCallback(
    async (darts: readonly Dart[]) => {
      setOccupe(true)
      setErreur(null)
      try {
        const resultat = await services.playTourDuMonde.recordVisit(matchId, darts)
        queryClient.setQueryData(['tourDuMonde', matchId], resultat.state)
        setDartsEnCours([])
        setDerniereVolee(resultat)

        const boucle = resultat.milestones.some((jalon) => jalon.type === 'TourCompleted')
        if (boucle) services.devices.haptics.success()

        // Le résultat, puis à qui c'est le tour. Une volée sans touche ne se
        // commente pas, mais elle passe quand même la main.
        const touches = resultat.visit.hits
        dire(
          annonceFinDeVolee(
            boucle
              ? 'Tour bouclé !'
              : touches > 0
                ? `${touches} touché${touches > 1 ? 's' : ''}`
                : null,
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
      if (!state || occupe || termine) return

      const suite = [...dartsEnCours, dart]
      services.devices.haptics.tap()
      setDartsEnCours(suite)
      setDerniereVolee(null)

      // Trois fléchettes : la volée est close. Le domaine tronquera lui-même si
      // le tour a été bouclé avant la troisième.
      if (suite.length >= 3) void enregistrer(suite)
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
      const revenu = await services.playTourDuMonde.undoLastVisit(matchId)
      queryClient.setQueryData(['tourDuMonde', matchId], revenu)
      setDerniereVolee(null)
      services.devices.haptics.tap()
    } catch (cause) {
      setErreur(message(cause))
    } finally {
      setOccupe(false)
    }
  }, [services, state, matchId, dartsEnCours.length, queryClient])

  /**
   * La progression **affichée** du joueur courant : elle suit chaque fléchette
   * saisie, avant même que la volée ne soit enregistrée. C'est le seul calcul
   * de règle recopié ici — toucher, c'est atteindre le secteur — et il reste
   * volontairement local à l'aperçu : l'état qui fait foi vient du domaine.
   */
  const apercu = (() => {
    if (!state || !joueurCourant) return { validees: 0, cible: null }

    let index = joueurCourant.targetIndex
    for (const dart of dartsEnCours) {
      if (index >= state.config.targets.length) break
      if (dart.segment === state.config.targets[index]) index += 1
    }
    return { validees: index, cible: state.config.targets[index] ?? null }
  })()

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
    chargement: requete.isPending,
    erreurChargement: requete.error,
    joueurCourant,
    termine,
    dartsEnCours,
    apercu,
    derniereVolee,
    ajouterFlechette,
    annuler,
    annulation,
    peutAnnuler: dartsEnCours.length > 0 || (state?.history.length ?? 0) > 0,
    occupe,
    erreur,
  }
}
