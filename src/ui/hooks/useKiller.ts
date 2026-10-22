import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { KillerVisitResult } from '@/core/application/ports/driving/PlayKiller'
import type { Player } from '@/core/domain/entities/Player'
import type { KillerMilestone, KillerState } from '@/core/domain/games/killer/rules'
import { type Dart, Dart as DartVO, type Multiplier } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import {
  annonceFinDeVolee,
  annonceKiller,
  type JalonKiller,
  libelleAnnulation,
  nomJoueur,
  phraseVictoire,
  texteConfirmationKiller,
  texteConfirmationKillerVariante,
  titreConfirmationKiller,
  titreConfirmationKillerVariante,
} from '@/ui/labels'
import { useServices } from '../providers/ServicesProvider'
import { prochainJoueur } from './tourDeTable'
import { useVoix } from './useAppareil'
import { useProfils } from './useJoueurs'
import { usePauseAnnulation } from './usePauseAnnulation'
import { type EtatVolee, useVoleeEnCours } from './useVoleeEnCours'

const message = (erreur: unknown): string =>
  erreur instanceof Error ? erreur.message : 'Volée refusée'

/** Les jalons d'une volée tels que la voix les dit ; genre de l'éliminé, masculin si le profil est supprimé. */
const jalonsDites = (
  jalons: readonly KillerMilestone[],
  profils: ReadonlyMap<PlayerId, Player>,
): JalonKiller[] =>
  jalons.flatMap((jalon): JalonKiller[] => {
    if (jalon.type === 'BecameKiller') {
      return [{ type: 'KILLER', nom: nomJoueur(profils.get(jalon.playerId)?.name ?? null) }]
    }
    if (jalon.type === 'PlayerEliminated') {
      const profil = profils.get(jalon.playerId)
      return [{ type: 'ELIMINE', nom: nomJoueur(profil?.name ?? null), genre: profil?.gender }]
    }
    return []
  })

/**
 * L'état d'une partie de Killer ; l'effet de la volée en cours se lit sur `PreviewKillerVisit`.
 * Close à trois fléchettes, à celle qui gagne (boîte), ou à l'auto-élimination (enregistrée sans boîte, sauf si elle fait gagner).
 */
export const useKiller = (matchId: MatchId) => {
  const services = useServices()
  const queryClient = useQueryClient()
  const dire = useVoix()
  const { enPause, armer, ecoulee } = usePauseAnnulation()

  // Pseudos et genres en ref : la Map est reconstruite à chaque rendu.
  const profils = useProfils()
  const profilsRef = useRef(profils)
  profilsRef.current = profils

  const requete = useQuery({
    queryKey: ['killer', matchId],
    queryFn: () => services.playKiller.getState(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const state = requete.data ?? null

  const evaluer = useCallback(
    (base: KillerState, darts: readonly Dart[]): EtatVolee => {
      const evaluation = services.previewKillerVisit.execute({ state: base, darts })
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
  const [derniereVolee, setDerniereVolee] = useState<KillerVisitResult | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Le joueur repéré se lit sur l'état RÉEL : l'aperçu a déjà passé la main.
  const joueurCourant = state?.players[state.currentPlayerIndex] ?? null
  const termine = state?.finished ?? false

  /** L'état tel qu'il doit s'afficher : vies, killer et éliminations suivent chaque fléchette. */
  const apercu = useMemo(() => {
    if (!state || termine) return null
    return services.previewKillerVisit.execute({ state, darts: dartsEnCours })
  }, [services, state, termine, dartsEnCours])

  const affiche = apercu?.state ?? state

  const enregistrer = useCallback(
    async (darts: readonly Dart[]) => {
      setOccupe(true)
      setErreur(null)
      try {
        const resultat = await services.playKiller.recordVisit(matchId, darts)
        queryClient.setQueryData(['killer', matchId], resultat.state)
        poser([], resultat.state)
        setDerniereVolee(resultat)

        const gagnee = resultat.milestones.some((jalon) => jalon.type === 'MatchFinished')
        if (gagnee || resultat.milestones.length > 0) services.devices.haptics.success()

        // Un seul énoncé : jalons puis « À toi, X » ; à la victoire, la phrase seule.
        dire(
          annonceFinDeVolee(
            annonceKiller(jalonsDites(resultat.milestones, profilsRef.current)),
            gagnee ? null : prochainJoueur(resultat.state, profilsRef.current),
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

  /** La fléchette qui gagne attend sa confirmation : lue sur l'aperçu, jamais recopiée. */
  const sortieEnAttente = dartsEnCours.length > 0 && (apercu?.state.finished ?? false)

  /** « Kevin gagne sur D8 ? » au nom du gagnant ; auto-élimination du dernier adversaire : « Kevin gagne ? ». */
  const confirmation = useMemo(() => {
    const flechette = dartsEnCours.at(-1)
    const gagnant = apercu?.state.winnerId ?? null
    const visite = apercu?.visit ?? null
    if (!sortieEnAttente || !flechette || gagnant === null || visite === null) return null

    const nomDe = (id: PlayerId) => nomJoueur(profils.get(id)?.name ?? null)
    const nomGagnant = nomDe(gagnant)
    const dernier = visite.effects.at(-1)
    const elimine = dernier?.type === 'HIT' ? dernier.targetId : null
    if (elimine === null) return null
    const genre = profils.get(elimine)?.gender

    if (elimine === visite.playerId) {
      return {
        titre: titreConfirmationKillerVariante(nomGagnant),
        texte: texteConfirmationKillerVariante(
          nomDe(elimine),
          genre,
          DartVO.label(flechette),
          nomGagnant,
        ),
      }
    }
    return {
      titre: titreConfirmationKiller(nomGagnant, DartVO.label(flechette)),
      texte: texteConfirmationKiller(nomDe(elimine), genre, nomGagnant),
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
      // Momentané : le multiplicateur retombe sur Simple après chaque fléchette.
      setMultiplicateur('SIMPLE')

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

  /** Une fléchette par appui, comme `useX01` ; vies et éliminations reviennent par projection. */
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
      const { state: revenu, darts } = await services.playKiller.undoLastVisit(matchId)
      queryClient.setQueryData(['killer', matchId], revenu)
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

    const precedente = state?.history.at(-1)
    const flechette = precedente?.darts.at(-1)
    if (!precedente || !flechette) return libelleAnnulation(null, null)
    return libelleAnnulation(
      DartVO.label(flechette),
      nomJoueur(profils.get(precedente.playerId)?.name ?? null),
    )
  }, [dartsEnCours, joueurCourant, state, profils])

  return {
    state,
    /** L'état à afficher : l'état réel augmenté de la volée en cours. */
    affiche,
    /** La volée en cours et l'effet de chaque fléchette ; `null` sans fléchette posée. */
    voleeEnCours: dartsEnCours.length > 0 ? (apercu?.visit ?? null) : null,
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
