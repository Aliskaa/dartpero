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
/** Killer : les vies de départ (3 ou 5) et la variante (booléen). Jamais renommées. */
const CLE_KILLER_VIES = 'partie:killer-vies'
const CLE_KILLER_VARIANTE = 'partie:killer-variante'

/** Les numéros de Killer choisis à l'étape 2, par joueur. Jamais mémorisés d'une partie à l'autre. */
export type NumerosKiller = ReadonlyMap<PlayerId, SegmentNumber>

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

  /**
   * Les numéros de Killer, par joueur : un état du parcours, jamais une
   * préférence (un nouveau passage, un nouveau tirage). Un joueur retiré garde
   * son entrée, mais seule compte celle des joueurs retenus.
   */
  const [numeros, setNumeros] = useState<NumerosKiller>(() => new Map())

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

  /**
   * La sélection du jeu, jamais au-delà de sa limite. La coupe est aussi
   * **écrite** à l'arrivée à l'étape 2 (`couperSelection`, réponse R1.4) : un
   * Killer à 6 suivi d'un X01 perd les 5e et 6e joueurs. La tranche ici ne sert
   * qu'au rendu qui précède cette écriture.
   */
  const selection = (mode: GameModeId): readonly PlayerId[] =>
    mode === 'CHECKOUT_PRACTICE' ? selectionEntrainement : selectionGroupe.slice(0, max(mode))

  /**
   * Écrit la coupe de la sélection de groupe à la limite du jeu. Idempotente :
   * rien n'est écrit si la sélection tient déjà (sûr sous `StrictMode`).
   * Attend les profils, sans quoi la sélection dérivée vaut `[]`.
   */
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

  /**
   * Crée le profil, rafraîchit la liste, puis l'ajoute à la partie s'il reste
   * une place. Lève l'erreur du domaine (pseudo pris, vide…) : la boîte de
   * dialogue la traduit et reste ouverte.
   */
  const creerJoueur = async (
    mode: GameModeId,
    nom: string,
    genre?: PlayerGender,
  ): Promise<void> => {
    const base = selection(mode)
    // Sans genre choisi, rien ne part : la clé reste absente (« non précisé »).
    const joueur = genre
      ? await services.managePlayers.create(nom, undefined, genre)
      : await services.managePlayers.create(nom)
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

  /**
   * Donne un numéro à chaque joueur retenu qui n'en a pas (ou dont le numéro est
   * déjà pris par un joueur placé avant lui), tiré parmi les numéros libres.
   * Rend la **même** table si rien ne manque : l'appelant n'écrit alors rien.
   */
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

  /**
   * À l'arrivée à l'étape 2 et à chaque joueur ajouté : le tirage est déjà fait.
   * Appelé depuis un effet : idempotent (sous `StrictMode`, le second passage
   * peut retirer, mais les invariants tiennent — tous numérotés, tous différents).
   */
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

  /**
   * Un mode, un use case : l'aiguillage de la couture `GameMode`, côté départ.
   *
   * ⚠️ **Le seul chemin de lancement.** `valeurs` vaut par défaut celles du rendu
   * courant ; « Rejouer » les passe en argument, parce qu'un `setX` de
   * `usePreference` ne se lit qu'au rendu suivant — relire `score` juste après
   * `setScore` lancerait la partie d'avant.
   */
  const lancer = (mode: GameModeId, valeurs: Lancement = courants(mode)): Promise<MatchId> => {
    // L'ordre part tel quel dans le journal : le tirage a déjà eu lieu à l'écran.
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
        // Les numéros choisis à l'étape 2 ; un joueur sans numéro (arrivé par un
        // lien profond, par exemple) en reçoit un libre ici.
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
      // La nouvelle partie est une carte de plus à l'Accueil et à l'Historique.
      await queryClient.invalidateQueries({ queryKey: CLE_HISTORIQUE })
      navigate(`/partie/${matchId}`)
    } catch {
      setErreur(ERREUR_DEMARRAGE)
      setOccupe(false)
    }
  }

  /**
   * ▶ de « Rejouer » : la configuration devient **les réglages mémorisés**, comme
   * si elle avait été choisie à la main, puis solo → on lance, à deux ou plus →
   * on ouvre l'Ordre (avec « Tirer au sort » et « Commencer »).
   *
   * ⚠️ Le **nom n'est jamais repris** : `{}` explicite, et la saisie revient à la
   * proposition — un nom tapé avant un retour fuirait sinon dans la nouvelle partie.
   * ⚠️ Les valeurs partent **en argument** de `lancer` (la lecture des préférences
   * serait périmée), mais s'écrivent aussi, pour l'étape 2 et la prochaine partie.
   */
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
        // Reproductible (`estReproductible`) : les valeurs sont dans les listes de l'étape 2.
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
        // Rejouer = **nouveau tirage** des numéros (réponse 3), jamais ceux d'avant.
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
