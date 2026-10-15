import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { Player } from '@/core/domain/entities/Player'
import type { GameModeId } from '@/core/domain/games'
import {
  CheckoutPracticeConfig,
  DEFAUT as DEFAUT_ENTRAINEMENT,
} from '@/core/domain/games/checkout-practice/config'
import {
  CRICKET_VARIANTS,
  CricketConfig,
  type CricketVariant,
} from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { CLE_HISTORIQUE, CLE_MATCH_EN_COURS } from '@/ui/clesRequetes'
import { ERREUR_DEMARRAGE, nomParDefaut } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import { usePreference } from './useAppareil'
import { CLE_JOUEURS, useJoueurs } from './useJoueurs'

/**
 * Les réglages de la dernière partie, relus au prochain lancement.
 *
 * Entre potes on enchaîne quatre ou cinq parties avec la même formule : les
 * re-choisir à chaque fois était une dizaine de taps pour rien.
 *
 * ⚠️ Les clés existantes ne se renomment pas. `partie:mode` est **abandonnée**
 * (le jeu vit désormais dans l'URL) : plus lue ni écrite, jamais réutilisée.
 */
const CLE_VARIANTE = 'partie:variante-cricket'
const CLE_SCORE = 'partie:score'
/**
 * ⚠️ Pas `partie:best-of` : l'ancienne clé contenait un best-of (3, 5, 7), qui
 * relu comme un nombre de manches à gagner ferait jouer des parties deux fois
 * plus longues sans prévenir.
 */
const CLE_LEGS = 'partie:legs'
const CLE_SETS = 'partie:sets'
const CLE_DOUBLE_OUT = 'partie:double-out'
const CLE_DOUBLE_IN = 'partie:double-in'
const CLE_SELECTION = 'partie:joueurs'
// ⚠️ `partie:ordre-aleatoire` (l'ancien interrupteur) est **abandonnée** : plus lue
// ni écrite, jamais réutilisée. « Tirer au sort » mélange l'ordre sur l'écran et
// l'écrit dans `partie:joueurs`, comme un réordonnancement à la main.
/** Un joueur à part pour l'entraînement : il se joue seul, la sélection de groupe reste intacte. */
const CLE_ENTRAINEMENT_JOUEUR = 'entrainement:joueur'
const CLE_ENTRAINEMENT_SORTIES = 'entrainement:sorties'

export const SCORES = [301, 501, 701] as const
/** Le nombre de manches à **gagner** — les anciens BO1 / BO3 / BO5 / BO7. */
export const LEGS = [1, 2, 3, 4] as const
export const SETS = [1, 2, 3] as const
export const SORTIES = [5, 10, 20] as const
export const MAX_JOUEURS = 4

/** Une valeur mémorisée hors de la liste (vieille version, stockage abîmé) retombe sur le défaut. */
const dansLaListe = <T>(liste: readonly T[], valeur: unknown, defaut: T): T =>
  (liste as readonly unknown[]).includes(valeur) ? (valeur as T) : defaut

const booleen = (valeur: unknown, defaut: boolean): boolean =>
  typeof valeur === 'boolean' ? valeur : defaut

/**
 * Ce qui part dans la commande de lancement : le nom **tapé**, ou rien.
 *
 * Un champ vide, fait d'espaces, ou resté sur la proposition n'est pas un nom
 * tapé : rien n'est écrit, et la partie affichera le nom de sa propre date de
 * création. ⚠️ Écrire la proposition figerait un libellé dans le journal.
 */
export const nomTape = (saisie: string, proposition: string): { readonly name?: string } => {
  const propre = saisie.trim()
  return propre === '' || propre === proposition ? {} : { name: propre }
}

/**
 * L'état partagé des trois étapes de « Nouvelle partie ».
 *
 * ⚠️ Appelé **une seule fois**, par `NouvellePartieEcran`, qui reste monté d'une
 * étape à l'autre et passe les valeurs en props : deux `usePreference` sur la
 * même clé dans deux composants montés en même temps divergeraient.
 */
export const useNouvellePartie = () => {
  const services = useServices()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const joueurs = useJoueurs()

  const [memoriseeBrute, setMemorisee] = usePreference<readonly PlayerId[]>(CLE_SELECTION, [])
  const memorisee = Array.isArray(memoriseeBrute) ? memoriseeBrute : []
  // Première lecture : repli sur le premier joueur de la dernière partie, mais
  // seulement si la clé est absente — un × écrit `null`, qui doit rester `null`.
  const [joueurEntrainement, setJoueurEntrainement] = usePreference<PlayerId | null>(
    CLE_ENTRAINEMENT_JOUEUR,
    memorisee[0] ?? null,
  )

  const [varianteBrute, setVariante] = usePreference<CricketVariant>(CLE_VARIANTE, 'STANDARD')
  const [scoreBrut, setScore] = usePreference<(typeof SCORES)[number]>(CLE_SCORE, 501)
  const [legsBruts, setLegs] = usePreference<(typeof LEGS)[number]>(CLE_LEGS, 2)
  const [setsBruts, setSets] = usePreference<(typeof SETS)[number]>(CLE_SETS, 1)
  // ⚠️ Double out DÉCOCHÉ par défaut à l'écran, alors que le domaine le garde
  // activé : c'est voulu (`x01/config.ts`). La valeur est toujours passée.
  const [doubleOutBrut, setDoubleOut] = usePreference(CLE_DOUBLE_OUT, false)
  const [doubleInBrut, setDoubleIn] = usePreference(CLE_DOUBLE_IN, false)
  const [sortiesBrutes, setSorties] = usePreference<(typeof SORTIES)[number]>(
    CLE_ENTRAINEMENT_SORTIES,
    DEFAUT_ENTRAINEMENT.rounds as (typeof SORTIES)[number],
  )

  const variante = dansLaListe(CRICKET_VARIANTS, varianteBrute, 'STANDARD')
  const score = dansLaListe(SCORES, scoreBrut, 501)
  const legs = dansLaListe(LEGS, legsBruts, 2)
  const sets = dansLaListe(SETS, setsBruts, 1)
  const doubleOut = booleen(doubleOutBrut, false)
  const doubleIn = booleen(doubleInBrut, false)
  const sorties = dansLaListe(
    SORTIES,
    sortiesBrutes,
    DEFAUT_ENTRAINEMENT.rounds as (typeof SORTIES)[number],
  )

  /**
   * Le nom proposé (« Dimanche soir »), calculé **une seule fois** par passage
   * dans le parcours : l'horloge est lue dans un initialiseur paresseux, jamais
   * à chaque rendu. Le nom tapé vit ici, à la racine du parcours, pour suivre
   * de l'étape 2 à l'étape 3 et survivre au retour du téléphone — jamais dans une
   * préférence : il ne se mémorise pas d'une partie à l'autre.
   */
  const [proposition] = useState(() => nomParDefaut(services.clock.now()))
  const [saisieNom, setSaisieNom] = useState(proposition)

  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  // L'échec d'un démarrage ne concerne que l'étape où il a eu lieu : changer
  // d'étape (retour, autre jeu) l'efface, sans quoi il suivrait le joueur.
  const { pathname } = useLocation()
  // biome-ignore lint/correctness/useExhaustiveDependencies: on efface à chaque changement d'étape.
  useEffect(() => {
    setErreur(null)
  }, [pathname])

  const profils: readonly Player[] = joueurs.data ?? []
  const existe = (id: PlayerId) => profils.some((profil) => profil.id === id)

  /**
   * ⚠️ La sélection mémorisée est **filtrée sur les profils qui existent
   * encore** : un joueur supprimé resterait sinon en fantôme, et le lancement
   * échouerait sur un profil inconnu. Dérivée plutôt que stockée en état, elle
   * se répare toute seule dès que la liste des profils arrive — et vaut `[]`
   * tant qu'elle n'est pas arrivée.
   */
  const selectionGroupe = joueurs.data ? memorisee.filter(existe) : []
  const selectionEntrainement =
    joueurs.data && joueurEntrainement !== null && existe(joueurEntrainement)
      ? [joueurEntrainement]
      : []

  const selection = (mode: GameModeId): readonly PlayerId[] =>
    mode === 'CHECKOUT_PRACTICE' ? selectionEntrainement : selectionGroupe

  const max = (mode: GameModeId): number => (mode === 'CHECKOUT_PRACTICE' ? 1 : MAX_JOUEURS)

  /** Les profils retenus, dans l'ordre de passage. */
  const joueursRetenus = (mode: GameModeId): readonly Player[] =>
    selection(mode).flatMap((id) => profils.filter((profil) => profil.id === id))

  const ajouter = (mode: GameModeId, id: PlayerId, base = selection(mode)) => {
    if (base.includes(id) || base.length >= max(mode)) return
    if (mode === 'CHECKOUT_PRACTICE') setJoueurEntrainement(id)
    else setMemorisee([...base, id])
  }

  /** Retire de la **partie**, jamais de la base : le profil reste sur le téléphone. */
  const retirer = (mode: GameModeId, id: PlayerId) => {
    if (mode === 'CHECKOUT_PRACTICE') {
      if (joueurEntrainement === id) setJoueurEntrainement(null)
    } else setMemorisee(selectionGroupe.filter((autre) => autre !== id))
  }

  const basculer = (mode: GameModeId, id: PlayerId) => {
    if (selection(mode).includes(id)) retirer(mode, id)
    else ajouter(mode, id)
  }

  const reordonner = (ordre: readonly PlayerId[]) => setMemorisee(ordre)

  /**
   * Crée le profil, rafraîchit la liste, puis l'ajoute à la partie s'il reste
   * une place. Lève l'erreur du domaine (pseudo pris, vide…) : la boîte de
   * dialogue la traduit et reste ouverte.
   */
  const creerJoueur = async (mode: GameModeId, nom: string): Promise<void> => {
    const base = selection(mode)
    const joueur = await services.managePlayers.create(nom)
    await queryClient.invalidateQueries({ queryKey: CLE_JOUEURS })
    ajouter(mode, joueur.id, base)
  }

  /**
   * « Tirer au sort » : l'aléa passe par le use case, jamais par `Math.random`.
   * L'ordre obtenu s'écrit comme un réordonnancement à la main — il peut être
   * l'ordre d'avant, c'est un vrai tirage. Rend le nouvel ordre, pour l'annoncer.
   *
   * ⚠️ À appeler depuis un geste, jamais depuis un effet ni un rendu : le
   * `StrictMode` le jouerait deux fois.
   */
  const tirerAuSort = (mode: GameModeId): readonly PlayerId[] => {
    const ordre = services.shuffleOrder.execute(selection(mode))
    reordonner(ordre)
    return ordre
  }

  /** Un mode, un use case : l'aiguillage de la couture `GameMode`, côté départ. */
  const lancer = (mode: GameModeId): Promise<MatchId> => {
    // L'ordre part tel quel dans le journal : le tirage a déjà eu lieu à l'écran.
    const playerIds = selection(mode)
    const name = nomTape(saisieNom, proposition)
    switch (mode) {
      case 'X01':
        return services.startMatch.execute({
          playerIds,
          config: X01Config.create({
            startingScore: score,
            legsToWin: legs,
            setsToWin: sets,
            doubleOut,
            doubleIn,
          }),
          ...name,
        })
      case 'CRICKET':
        return services.playCricket.start({
          playerIds,
          config: CricketConfig.create({ variant: variante }),
          ...name,
        })
      case 'TOUR_DU_MONDE':
        return services.playTourDuMonde.start({
          playerIds,
          config: TourDuMondeConfig.create(),
          ...name,
        })
      case 'CHECKOUT_PRACTICE': {
        const [playerId] = playerIds
        if (!playerId) return Promise.reject(new Error('No player selected'))
        return services.playCheckoutPractice.start({
          playerId,
          config: CheckoutPracticeConfig.create({ rounds: sorties }),
          ...name,
        })
      }
      default: {
        const jamais: never = mode
        return Promise.reject(new Error(`Unknown mode ${String(jamais)}`))
      }
    }
  }

  const demarrer = async (mode: GameModeId): Promise<void> => {
    setErreur(null)
    setOccupe(true)
    try {
      const matchId = await lancer(mode)
      await queryClient.invalidateQueries({ queryKey: CLE_MATCH_EN_COURS })
      // La nouvelle partie est une carte de plus à l'Accueil et à l'Historique.
      await queryClient.invalidateQueries({ queryKey: CLE_HISTORIQUE })
      navigate(`/partie/${matchId}`)
    } catch {
      setErreur(ERREUR_DEMARRAGE)
      setOccupe(false)
    }
  }

  return {
    profils,
    chargement: joueurs.isPending,
    selection,
    joueursRetenus,
    max,
    ajouter: (mode: GameModeId, id: PlayerId) => ajouter(mode, id),
    retirer,
    basculer,
    reordonner,
    creerJoueur,
    tirerAuSort,
    demarrer,
    erreur,
    occupe,
    nom: { saisie: saisieNom, setSaisie: setSaisieNom, proposition },
    reglages: {
      score,
      setScore,
      legs,
      setLegs,
      sets,
      setSets,
      doubleOut,
      setDoubleOut,
      doubleIn,
      setDoubleIn,
      variante,
      setVariante,
      sorties,
      setSorties,
    },
  } as const
}

export type NouvellePartie = ReturnType<typeof useNouvellePartie>
export type ReglagesNouvellePartie = NouvellePartie['reglages']
export type NomPartieSaisi = NouvellePartie['nom']
