import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { TourDuMondeVisitResult } from '@/core/application/ports/driving/PlayTourDuMonde'
import type { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import {
  annonceFinDeVolee,
  libelleAnnulation,
  libelleFlechetteTourDuMonde,
  nomJoueur,
} from '@/ui/labels'
import { useServices } from '../providers/ServicesProvider'
import { prochainJoueur } from './tourDeTable'
import { useVoix } from './useAppareil'
import { useProfils } from './useJoueurs'
import { usePauseAnnulation } from './usePauseAnnulation'

const message = (erreur: unknown): string =>
  erreur instanceof Error ? erreur.message : 'Volée refusée'

/**
 * L'état d'une partie de Tour du monde, côté écran.
 *
 * Même principe qu'au X01 : TanStack Query sert de **cache**, la volée
 * enregistrée renvoie déjà le nouvel état, qu'on injecte directement.
 *
 * La volée en cours passe par le port `PreviewTourDuMondeVisit` : la progression
 * affichée suit chaque fléchette sans que l'écran recopie la règle « toucher,
 * c'est atteindre le secteur », et la volée se clôt dès la fléchette qui boucle
 * le parcours — réclamer les suivantes fausserait le départage, qui se joue au
 * nombre de fléchettes.
 */
export const useTourDuMonde = (matchId: MatchId) => {
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

  /**
   * Le tableau **tel qu'il doit s'afficher** : progression, cible courante et
   * compteur de fléchettes suivent chaque fléchette, avant même que la volée ne
   * soit enregistrée. Le calcul vient du port, jamais d'une règle recopiée ici.
   */
  const apercu = useMemo(() => {
    if (!state || termine) return null
    return services.previewTourDuMondeVisit.execute({ state, darts: dartsEnCours })
  }, [services, state, termine, dartsEnCours])

  const affiche = apercu?.state ?? state

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

      // La volée est close à trois fléchettes — ou dès celle qui boucle le
      // parcours : les suivantes n'auraient plus de cible.
      if (services.previewTourDuMondeVisit.execute({ state, darts: suite }).complete) {
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
    if (occupe) return
    setErreur(null)

    if (dartsEnCours.length > 0) {
      services.devices.haptics.tap()
      setDartsEnCours((darts) => darts.slice(0, -1))
      // La dernière fléchette vient de partir : un second appui réflexe ne doit
      // pas défaire la volée d'un autre joueur (voir `usePauseAnnulation`).
      if (dartsEnCours.length === 1) armer()
      return
    }
    if (!ecoulee()) return
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
  }, [services, state, matchId, dartsEnCours.length, queryClient, occupe, armer, ecoulee])

  /** Ce que le bouton va défaire, écrit dessus — voir `libelleAnnulation`. */
  const annulation = useMemo(() => {
    const derniereFlechette = dartsEnCours.at(-1)
    if (derniereFlechette)
      return libelleAnnulation(libelleFlechetteTourDuMonde(derniereFlechette), null)

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
    derniereVolee,
    ajouterFlechette,
    annuler,
    annulation,
    peutAnnuler: dartsEnCours.length > 0 || (!enPause && (state?.history.length ?? 0) > 0),
    occupe,
    erreur,
  }
}
