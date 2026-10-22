import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { ReplayableConfiguration } from '@/core/application/ports/driving/GetReplayableConfigurations'
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
import { KillerConfig } from '@/core/domain/games/killer/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import type { SegmentNumber } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import type { PlayerGender } from '@/core/domain/value-objects/PlayerGender'
import { cheminOrdre, ETAT_PARCOURS } from '@/ui/chemins'
import { CLE_HISTORIQUE, CLE_MATCH_EN_COURS } from '@/ui/clesRequetes'
import { ERREUR_DEMARRAGE, nomParDefaut } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import {
  JOUEURS_ENTRAINEMENT,
  JOUEURS_KILLER,
  LEGS,
  MAX_JOUEURS,
  SCORES,
  SETS,
  SORTIES,
  VIES,
} from '@/ui/reglagesPossibles'
import { usePreference } from './useAppareil'
import { CLE_JOUEURS, useJoueurs } from './useJoueurs'

// ⚠️ Clés des réglages mémorisés : ne se renomment pas ; `partie:mode` est abandonnée, ne pas la réutiliser.
const CLE_VARIANTE = 'partie:variante-cricket'
const CLE_SCORE = 'partie:score'
// ⚠️ Pas `partie:best-of` : l'ancienne clé stockait un best-of, pas un nombre de manches à gagner.
const CLE_LEGS = 'partie:legs'
const CLE_SETS = 'partie:sets'
const CLE_DOUBLE_OUT = 'partie:double-out'
const CLE_DOUBLE_IN = 'partie:double-in'
const CLE_SELECTION = 'partie:joueurs'
// ⚠️ `partie:ordre-aleatoire` est abandonnée : ne pas la réutiliser.
// L'entraînement a son propre joueur : la sélection de groupe reste intacte.
const CLE_ENTRAINEMENT_JOUEUR = 'entrainement:joueur'
const CLE_ENTRAINEMENT_SORTIES = 'entrainement:sorties'
const CLE_KILLER_VIES = 'partie:killer-vies'
const CLE_KILLER_VARIANTE = 'partie:killer-variante'

/** Les numéros de Killer choisis à l'étape 2, par joueur. Jamais mémorisés d'une partie à l'autre. */
export type NumerosKiller = ReadonlyMap<PlayerId, SegmentNumber>

/** Une valeur mémorisée hors de la liste (vieille version, stockage abîmé) retombe sur le défaut. */
const dansLaListe = <T>(liste: readonly T[], valeur: unknown, defaut: T): T =>
  (liste as readonly unknown[]).includes(valeur) ? (valeur as T) : defaut

const booleen = (valeur: unknown, defaut: boolean): boolean =>
  typeof valeur === 'boolean' ? valeur : defaut

/** Le nom **tapé** ou rien. ⚠️ Écrire la proposition figerait un libellé dans le journal. */
export const nomTape = (saisie: string, proposition: string): { readonly name?: string } => {
  const propre = saisie.trim()
  return propre === '' || propre === proposition ? {} : { name: propre }
}

/** Ce qu'il faut pour lancer une partie : les joueurs dans l'ordre, les réglages, le nom tapé (ou rien). */
type Lancement = {
  playerIds: readonly PlayerId[]
  score: number
  legs: number
  sets: number
  doubleOut: boolean
  doubleIn: boolean
  variante: CricketVariant
  sorties: number
  vies: number
  varianteKiller: boolean
  numeros: NumerosKiller
  name: { readonly name?: string }
}

/** ⚠️ Appelé une seule fois, par `NouvellePartieEcran` : deux `usePreference` sur la même clé divergeraient. */
export const useNouvellePartie = () => {
  const services = useServices()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const joueurs = useJoueurs()

  const [memoriseeBrute, setMemorisee] = usePreference<readonly PlayerId[]>(CLE_SELECTION, [])
  const memorisee = Array.isArray(memoriseeBrute) ? memoriseeBrute : []
  // Repli sur le premier joueur de la dernière partie, seulement si la clé est absente (un × écrit `null`).
  const [joueurEntrainement, setJoueurEntrainement] = usePreference<PlayerId | null>(
    CLE_ENTRAINEMENT_JOUEUR,
    memorisee[0] ?? null,
  )

  const [varianteBrute, setVariante] = usePreference<CricketVariant>(CLE_VARIANTE, 'STANDARD')
  const [scoreBrut, setScore] = usePreference<(typeof SCORES)[number]>(CLE_SCORE, 501)
  const [legsBruts, setLegs] = usePreference<(typeof LEGS)[number]>(CLE_LEGS, 2)
  const [setsBruts, setSets] = usePreference<(typeof SETS)[number]>(CLE_SETS, 1)
  // ⚠️ Double out décoché à l'écran alors que le domaine le garde activé : voulu.
  const [doubleOutBrut, setDoubleOut] = usePreference(CLE_DOUBLE_OUT, false)
  const [doubleInBrut, setDoubleIn] = usePreference(CLE_DOUBLE_IN, false)
  const [sortiesBrutes, setSorties] = usePreference<(typeof SORTIES)[number]>(
    CLE_ENTRAINEMENT_SORTIES,
    DEFAUT_ENTRAINEMENT.rounds as (typeof SORTIES)[number],
  )

  const [viesBrutes, setVies] = usePreference<(typeof VIES)[number]>(CLE_KILLER_VIES, 3)
  const [varianteKillerBrute, setVarianteKiller] = usePreference(CLE_KILLER_VARIANTE, false)

  const variante = dansLaListe(CRICKET_VARIANTS, varianteBrute, 'STANDARD')
  const vies = dansLaListe(VIES, viesBrutes, 3)
  const varianteKiller = booleen(varianteKillerBrute, false)
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

  // Nom proposé calculé une fois (horloge lue en initialiseur) ; le nom tapé n'est jamais une préférence.
  const [proposition] = useState(() => nomParDefaut(services.clock.now()))
  const [saisieNom, setSaisieNom] = useState(proposition)

  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  // Numéros de Killer : état du parcours, jamais une préférence (nouveau passage, nouveau tirage).
  const [numeros, setNumeros] = useState<NumerosKiller>(() => new Map())

  // Un échec de démarrage s'efface au changement d'étape.
  const { pathname } = useLocation()
  // biome-ignore lint/correctness/useExhaustiveDependencies: on efface à chaque changement d'étape.
  useEffect(() => {
    setErreur(null)
  }, [pathname])

  const profils: readonly Player[] = joueurs.data ?? []
  const existe = (id: PlayerId) => profils.some((profil) => profil.id === id)

  // ⚠️ Sélection filtrée sur les profils existants : un joueur supprimé resterait en fantôme. Vaut `[]` avant l'arrivée des profils.
  const selectionGroupe = joueurs.data ? memorisee.filter(existe) : []
  const selectionEntrainement =
    joueurs.data && joueurEntrainement !== null && existe(joueurEntrainement)
      ? [joueurEntrainement]
      : []

  const max = (mode: GameModeId): number => {
    switch (mode) {
      case 'X01':
      case 'CRICKET':
      case 'TOUR_DU_MONDE':
        return MAX_JOUEURS
      case 'KILLER':
        return JOUEURS_KILLER
      case 'CHECKOUT_PRACTICE':
        return JOUEURS_ENTRAINEMENT
      default: {
        const jamais: never = mode
        return jamais
      }
    }
  }

  /** La sélection du jeu, coupée à sa limite (la coupe est aussi écrite par `couperSelection`). */
  const selection = (mode: GameModeId): readonly PlayerId[] =>
    mode === 'CHECKOUT_PRACTICE' ? selectionEntrainement : selectionGroupe.slice(0, max(mode))

  /** Écrit la coupe à la limite du jeu ; idempotente, attend les profils. */
  const couperSelection = (mode: GameModeId): void => {
    if (mode === 'CHECKOUT_PRACTICE' || !joueurs.data) return
    if (selectionGroupe.length > max(mode)) setMemorisee(selectionGroupe.slice(0, max(mode)))
  }

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
    } else setMemorisee(selection(mode).filter((autre) => autre !== id))
  }

  const basculer = (mode: GameModeId, id: PlayerId) => {
    if (selection(mode).includes(id)) retirer(mode, id)
    else ajouter(mode, id)
  }

  const reordonner = (ordre: readonly PlayerId[]) => setMemorisee(ordre)

  /** Crée le profil puis l'ajoute à la partie s'il reste une place ; lève l'erreur du domaine. */
  const creerJoueur = async (
    mode: GameModeId,
    nom: string,
    genre?: PlayerGender,
  ): Promise<void> => {
    const base = selection(mode)
    // Sans genre choisi, la clé reste absente.
    const joueur = genre
      ? await services.managePlayers.create(nom, undefined, genre)
      : await services.managePlayers.create(nom)
    await queryClient.invalidateQueries({ queryKey: CLE_JOUEURS })
    ajouter(mode, joueur.id, base)
  }

  /** « Tirer au sort » : rend le nouvel ordre. ⚠️ À appeler depuis un geste : `StrictMode` le jouerait deux fois. */
  const tirerAuSort = (mode: GameModeId): readonly PlayerId[] => {
    const ordre = services.shuffleOrder.execute(selection(mode))
    reordonner(ordre)
    return ordre
  }

  /** Numérote les joueurs sans numéro (ou en doublon) parmi les libres ; rend la même table si rien ne manque. */
  const completer = (table: NumerosKiller, ids: readonly PlayerId[]): NumerosKiller => {
    const pris = new Set<SegmentNumber>()
    const manquants: PlayerId[] = []
    for (const id of ids) {
      const numero = table.get(id)
      if (numero !== undefined && !pris.has(numero)) pris.add(numero)
      else manquants.push(id)
    }
    if (manquants.length === 0) return table
    const tires = services.drawKillerNumbers.execute({
      count: manquants.length,
      excluded: [...pris],
    })
    const suite = new Map(table)
    manquants.forEach((id, rang) => {
      const numero = tires[rang]
      if (numero !== undefined) suite.set(id, numero)
    })
    return suite
  }

  /** Appelé depuis un effet : idempotent (tous numérotés, tous différents). */
  const completerNumeros = (): void => {
    const suite = completer(numeros, selection('KILLER'))
    if (suite !== numeros) setNumeros(suite)
  }

  /** « Tirer au sort » : un nouveau tirage pour tous les joueurs retenus. À appeler depuis un geste. */
  const tirerNumeros = (ids: readonly PlayerId[] = selection('KILLER')): NumerosKiller => {
    const tires = services.drawKillerNumbers.execute({ count: ids.length })
    const suite = new Map(numeros)
    ids.forEach((id, rang) => {
      const numero = tires[rang]
      if (numero !== undefined) suite.set(id, numero)
    })
    setNumeros(suite)
    return suite
  }

  /** Change le numéro d'un joueur. Un numéro déjà pris par un autre joueur retenu est ignoré. */
  const choisirNumero = (id: PlayerId, numero: SegmentNumber): void => {
    const pris = selection('KILLER').some((autre) => autre !== id && numeros.get(autre) === numero)
    if (pris) return
    const suite = new Map(numeros)
    suite.set(id, numero)
    setNumeros(suite)
  }

  /** Le numéro d'un joueur retenu, ou `undefined` avant la complétion. */
  const numeroDe = (id: PlayerId): SegmentNumber | undefined => numeros.get(id)

  /** Les valeurs de la partie à lancer : celles du rendu courant, ou celles d'une configuration rejouée. */
  const courants = (mode: GameModeId): Lancement => ({
    playerIds: selection(mode),
    score,
    legs,
    sets,
    doubleOut,
    doubleIn,
    variante,
    sorties,
    vies,
    varianteKiller,
    numeros,
    name: nomTape(saisieNom, proposition),
  })

  /** ⚠️ Le seul chemin de lancement ; « Rejouer » passe `valeurs`, un `setX` ne se lit qu'au rendu suivant. */
  const lancer = (mode: GameModeId, valeurs: Lancement = courants(mode)): Promise<MatchId> => {
    const { playerIds, name } = valeurs
    switch (mode) {
      case 'X01':
        return services.startMatch.execute({
          playerIds,
          config: X01Config.create({
            startingScore: valeurs.score,
            legsToWin: valeurs.legs,
            setsToWin: valeurs.sets,
            doubleOut: valeurs.doubleOut,
            doubleIn: valeurs.doubleIn,
          }),
          ...name,
        })
      case 'CRICKET':
        return services.playCricket.start({
          playerIds,
          config: CricketConfig.create({ variant: valeurs.variante }),
          ...name,
        })
      case 'TOUR_DU_MONDE':
        return services.playTourDuMonde.start({
          playerIds,
          config: TourDuMondeConfig.create(),
          ...name,
        })
      case 'KILLER': {
        // Un joueur sans numéro (lien profond) en reçoit un libre ici.
        const table = completer(valeurs.numeros, playerIds)
        const numbers = playerIds.flatMap((id) => {
          const numero = table.get(id)
          return numero === undefined ? [] : [numero]
        })
        return services.playKiller.start({
          playerIds,
          config: KillerConfig.create({
            startingLives: valeurs.vies,
            selfHitCostsLives: valeurs.varianteKiller,
          }),
          numbers,
          ...name,
        })
      }
      case 'CHECKOUT_PRACTICE': {
        const [playerId] = playerIds
        if (!playerId) return Promise.reject(new Error('No player selected'))
        return services.playCheckoutPractice.start({
          playerId,
          config: CheckoutPracticeConfig.create({ rounds: valeurs.sorties }),
          ...name,
        })
      }
      default: {
        const jamais: never = mode
        return Promise.reject(new Error(`Unknown mode ${String(jamais)}`))
      }
    }
  }

  const demarrer = async (mode: GameModeId, valeurs?: Lancement): Promise<void> => {
    setErreur(null)
    setOccupe(true)
    try {
      const matchId = await lancer(mode, valeurs)
      await queryClient.invalidateQueries({ queryKey: CLE_MATCH_EN_COURS })
      await queryClient.invalidateQueries({ queryKey: CLE_HISTORIQUE })
      navigate(`/partie/${matchId}`)
    } catch {
      setErreur(ERREUR_DEMARRAGE)
      setOccupe(false)
    }
  }

  /** ▶ de « Rejouer » : préremplit les réglages mémorisés, puis lance (solo) ou ouvre l'Ordre. ⚠️ Le nom n'est jamais repris. */
  const rejouer = (configuration: ReplayableConfiguration): void => {
    const { mode, playerIds } = configuration
    let valeurs: Lancement = { ...courants(mode), playerIds, name: {} }
    switch (configuration.mode) {
      case 'X01': {
        const {
          startingScore,
          legsToWin,
          setsToWin,
          doubleOut: sortie,
          doubleIn: entree,
        } = configuration.config
        setScore(startingScore as (typeof SCORES)[number])
        setLegs(legsToWin as (typeof LEGS)[number])
        setSets(setsToWin as (typeof SETS)[number])
        setDoubleOut(sortie)
        setDoubleIn(entree)
        valeurs = {
          ...valeurs,
          score: startingScore,
          legs: legsToWin,
          sets: setsToWin,
          doubleOut: sortie,
          doubleIn: entree,
        }
        break
      }
      case 'CRICKET':
        setVariante(configuration.config.variant)
        valeurs = { ...valeurs, variante: configuration.config.variant }
        break
      case 'CHECKOUT_PRACTICE':
        setSorties(configuration.config.rounds as (typeof SORTIES)[number])
        valeurs = { ...valeurs, sorties: configuration.config.rounds }
        break
      case 'TOUR_DU_MONDE':
        break
      case 'KILLER': {
        const { startingLives, selfHitCostsLives } = configuration.config
        setVies(startingLives)
        setVarianteKiller(selfHitCostsLives)
        // Nouveau tirage des numéros, jamais ceux d'avant.
        const tirage = tirerNumeros(playerIds)
        valeurs = {
          ...valeurs,
          vies: startingLives,
          varianteKiller: selfHitCostsLives,
          numeros: tirage,
        }
        break
      }
      default: {
        // Un mode oublié ne compile pas.
        const jamais: never = configuration
        throw new Error(`Unknown mode ${String(jamais)}`)
      }
    }

    if (mode === 'CHECKOUT_PRACTICE') setJoueurEntrainement(playerIds[0] ?? null)
    else setMemorisee(playerIds)
    setSaisieNom(proposition)

    if (mode === 'CHECKOUT_PRACTICE' || playerIds.length === 1) {
      void demarrer(mode, valeurs)
    } else {
      navigate(cheminOrdre(mode), { state: ETAT_PARCOURS })
    }
  }

  return {
    profils,
    rejouer,
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
    couperSelection,
    numeros: {
      numeroDe,
      completer: completerNumeros,
      tirer: () => void tirerNumeros(),
      choisir: choisirNumero,
    },
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
      vies,
      setVies,
      varianteKiller,
      setVarianteKiller,
    },
  } as const
}

export type NouvellePartie = ReturnType<typeof useNouvellePartie>
export type ReglagesNouvellePartie = NouvellePartie['reglages']
export type NomPartieSaisi = NouvellePartie['nom']
