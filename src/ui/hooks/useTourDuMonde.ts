import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { TourDuMondeVisitResult } from '@/core/application/ports/driving/PlayTourDuMonde'
import type { TourDuMondeState } from '@/core/domain/games/tour-du-monde/rules'
import type { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import {
  annonceFinDeVolee,
  fr,
  libelleAnnulation,
  libelleFlechetteTourDuMonde,
  nomJoueur,
  phraseVictoire,
  TEXTE_CONFIRMATION_TOUR_DU_MONDE,
  titreConfirmationTourDuMonde,
} from '@/ui/labels'
import { useServices } from '../providers/ServicesProvider'
import { prochainJoueur } from './tourDeTable'
import { useVoix } from './useAppareil'
import { useProfils } from './useJoueurs'
import { usePauseAnnulation } from './usePauseAnnulation'
import { type EtatVolee, useVoleeEnCours } from './useVoleeEnCours'

const message = (erreur: unknown): string =>
  erreur instanceof Error ? erreur.message : 'Volée refusée'

/** L'état d'une partie de Tour du monde : la volée en cours est prévue par `PreviewTourDuMondeVisit`, hors journal. */
export const useTourDuMonde = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()
  const { enPause, armer, ecoulee } = usePauseAnnulation()

  // Pseudos en ref : la Map est reconstruite à chaque rendu.
  const profils = useProfils()
  const profilsRef = useRef(profils)
  profilsRef.current = profils

  const requete = useQuery({
    queryKey: ['tourDuMonde', matchId],
    queryFn: () => services.playTourDuMonde.getState(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const state = requete.data ?? null

  /** Close à trois fléchettes ou à celle qui boucle le parcours (elle attend *Valider*). */
  const evaluer = useCallback(
    (base: TourDuMondeState, darts: readonly Dart[]): EtatVolee => {
      const evaluation = services.previewTourDuMondeVisit.execute({ state: base, darts })
      if (evaluation.completesTour) return 'en-attente'
      if (evaluation.complete) return 'close'
      return 'ouverte'
    },
    [services],
  )
  const volee = useVoleeEnCours(matchId, state, evaluer)
  const dartsEnCours = volee.darts
  const poser = volee.poser

  const [derniereVolee, setDerniereVolee] = useState<TourDuMondeVisitResult | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const joueurCourant = state?.players[state.currentPlayerIndex] ?? null
  const termine = state?.finished ?? false

  /** Le tableau tel qu'il s'affiche, calculé par le port avant l'enregistrement de la volée. */
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
        poser([], resultat.state)
        setDerniereVolee(resultat)

        const boucle = resultat.milestones.some((jalon) => jalon.type === 'TourCompleted')
        if (boucle) services.devices.haptics.success()

        // Une volée sans touche passe quand même la main.
        const touches = resultat.visit.hits
        // La phrase suit la fin de partie, pas la fléchette qui boucle ; un nul n'en a pas.
        const gagnee = resultat.milestones.some(
          (jalon) => jalon.type === 'MatchFinished' && jalon.winnerId !== null,
        )
        dire(
          annonceFinDeVolee(
            boucle
              ? [fr('Tour bouclé !')]
              : touches > 0
                ? [fr(`${touches} touché${touches > 1 ? 's' : ''}`)]
                : null,
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

  /** ⚠️ Lue sur `completesTour`, jamais sur `state.finished` : la fin du tour de table ne se confirme pas. */
  const sortieEnAttente = dartsEnCours.length > 0 && (apercu?.completesTour ?? false)

  /** « Kevin boucle le parcours sur 25 ? » — la partie, elle, continue. */
  const confirmation = useMemo(() => {
    const flechette = dartsEnCours.at(-1)
    if (!sortieEnAttente || !joueurCourant || !flechette) return null
    return {
      titre: titreConfirmationTourDuMonde(
        nomJoueur(profils.get(joueurCourant.playerId)?.name ?? null),
        libelleFlechetteTourDuMonde(flechette),
      ),
      texte: TEXTE_CONFIRMATION_TOUR_DU_MONDE,
    }
  }, [sortieEnAttente, joueurCourant, dartsEnCours, profils])

  /** Retire la dernière fléchette en cours ; la dernière partie, la pause s'arme. */
  const retirerFlechette = useCallback(() => {
    if (dartsEnCours.length === 0 || !state) return
    services.devices.haptics.tap()
    poser(dartsEnCours.slice(0, -1), state)
    if (dartsEnCours.length === 1) armer()
  }, [services, dartsEnCours, state, poser, armer])

  /** Rend `true` quand la fléchette boucle le parcours : l'écran demande confirmation. */
  const ajouterFlechette = useCallback(
    (dart: Dart): boolean => {
      if (!state || occupe || termine || sortieEnAttente) return false

      const suite = [...dartsEnCours, dart]
      services.devices.haptics.tap()
      poser(suite, state)
      setDerniereVolee(null)

      // Close à trois fléchettes ou à celle qui boucle le parcours, qui attend *Valider*.
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

  /** *Corriger* : la fléchette qui bouclait est retirée, la volée reprend. */
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
      const { state: revenu, darts } = await services.playTourDuMonde.undoLastVisit(matchId)
      queryClient.setQueryData(['tourDuMonde', matchId], revenu)
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
        libelleFlechetteTourDuMonde(derniereFlechette),
        nomJoueur(profils.get(joueurCourant.playerId)?.name ?? null),
      )
    }

    const volee = state?.history.at(-1)
    const flechette = volee?.darts.at(-1)
    if (!volee || !flechette) return libelleAnnulation(null, null)
    return libelleAnnulation(
      libelleFlechetteTourDuMonde(flechette),
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
