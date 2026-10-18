import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { TourDuMondeVisitResult } from '@/core/application/ports/driving/PlayTourDuMonde'
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
        // La phrase suit la **fin de partie** (une fois le tour de table fini),
        // pas la fléchette qui boucle ; un nul (`winnerId` nul) n'en a pas.
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
    [services, matchId, queryClient, dire],
  )

  /**
   * La fléchette qui **boucle le parcours** attend sa confirmation (lot
   * `annulation-volee`). Lue sur `completesTour`, jamais sur `state.finished` :
   * la fin du tour de table, elle, ne se confirme pas.
   */
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
    if (dartsEnCours.length === 0) return
    services.devices.haptics.tap()
    setDartsEnCours((darts) => darts.slice(0, -1))
    if (dartsEnCours.length === 1) armer()
  }, [services, dartsEnCours.length, armer])

  /** Rend `true` quand la fléchette boucle le parcours : l'écran demande confirmation. */
  const ajouterFlechette = useCallback(
    (dart: Dart): boolean => {
      if (!state || occupe || termine || sortieEnAttente) return false

      const suite = [...dartsEnCours, dart]
      services.devices.haptics.tap()
      setDartsEnCours(suite)
      setDerniereVolee(null)

      // La volée est close à trois fléchettes — ou dès celle qui boucle le
      // parcours : les suivantes n'auraient plus de cible. Celle-là attend
      // *Valider* avant d'être écrite.
      const evaluation = services.previewTourDuMondeVisit.execute({ state, darts: suite })
      if (evaluation.completesTour) return true
      if (evaluation.complete) void enregistrer(suite)
      return false
    },
    [services, state, occupe, termine, sortieEnAttente, dartsEnCours, enregistrer],
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
      const { state: revenu, darts } = await services.playTourDuMonde.undoLastVisit(matchId)
      queryClient.setQueryData(['tourDuMonde', matchId], revenu)
      setDartsEnCours(darts)
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
    chargement: requete.isPending,
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
