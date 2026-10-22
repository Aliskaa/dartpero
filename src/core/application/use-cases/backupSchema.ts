import { DomainError } from '../../domain/DomainError'
import { Player } from '../../domain/entities/Player'
import type { KillerStarted, MatchEvent } from '../../domain/events/MatchEvent'
import { GameModes } from '../../domain/games'
import { CheckoutPracticeConfig } from '../../domain/games/checkout-practice/config'
import { CricketConfig, type CricketVariant } from '../../domain/games/cricket/config'
import { KillerConfig } from '../../domain/games/killer/config'
import { KillerRules } from '../../domain/games/killer/rules'
import { TourDuMondeConfig } from '../../domain/games/tour-du-monde/config'
import { X01Config } from '../../domain/games/x01/config'
import {
  Dart,
  type Multiplier,
  type Segment,
  type SegmentNumber,
} from '../../domain/value-objects/Dart'
import { MatchId, PlayerId } from '../../domain/value-objects/ids'
import { MatchName } from '../../domain/value-objects/MatchName'
import { PlayerColor } from '../../domain/value-objects/PlayerColor'
import { PlayerGender } from '../../domain/value-objects/PlayerGender'
import type { MatchRecord } from '../ports/driven/MatchRepository'
import { BACKUP_FORMAT, BACKUP_VERSION } from '../ports/driving/ManageBackup'

// Un JSON importé n'est rien tant qu'il n'est pas validé : tout passe par les fabriques du domaine.

const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
  typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)

const texte = (valeur: unknown, champ: string): string => {
  if (typeof valeur !== 'string') throw new DomainError(`${champ} must be a string`)
  return valeur
}

const horodatage = (valeur: unknown, champ: string): number => {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur) || valeur < 0) {
    throw new DomainError(`${champ} must be a positive timestamp`)
  }
  return valeur
}

const liste = (valeur: unknown, champ: string): readonly unknown[] => {
  if (!Array.isArray(valeur)) throw new DomainError(`${champ} must be an array`)
  return valeur
}

const MULTIPLICATEURS: readonly Multiplier[] = ['SIMPLE', 'DOUBLE', 'TRIPLE']

/** Une fléchette venue du disque, revalidée (partagée avec le brouillon de volée). */
export const versDart = (valeur: unknown): Dart => {
  if (!estObjet(valeur)) throw new DomainError('dart must be an object')

  const { segment, multiplier } = valeur
  const estSegment =
    segment === 'BULL' || segment === 'MISS' || (typeof segment === 'number' && segment >= 1)
  if (!estSegment) throw new DomainError(`invalid dart segment: ${String(segment)}`)

  if (!MULTIPLICATEURS.includes(multiplier as Multiplier)) {
    throw new DomainError(`invalid dart multiplier: ${String(multiplier)}`)
  }

  return Dart.of(segment as Segment, multiplier as Multiplier)
}

const versSegment = (valeur: unknown): Segment => {
  if (valeur === 'BULL' || valeur === 'MISS') return valeur
  if (typeof valeur === 'number' && Number.isInteger(valeur) && valeur >= 1 && valeur <= 20) {
    return valeur as Segment
  }
  throw new DomainError(`invalid segment: ${String(valeur)}`)
}

const versNumeroKiller = (valeur: unknown): SegmentNumber => {
  if (typeof valeur === 'number' && Number.isInteger(valeur) && valeur >= 1 && valeur <= 20) {
    return valeur as SegmentNumber
  }
  throw new DomainError(`invalid Killer number: ${String(valeur)}`)
}

// Le nom est facultatif ; un nom vide revient à « pas de nom » (clé absente), un nom trop long est refusé.
const versOuverture = (
  valeur: Record<string, unknown>,
  type: string,
): { playerIds: readonly PlayerId[]; startingPlayerIndex: number; name?: MatchName } => {
  const playerIds = liste(valeur.playerIds, 'playerIds').map((id) =>
    PlayerId.of(texte(id, 'playerId')),
  )
  if (playerIds.length === 0) throw new DomainError(`${type} needs at least one player`)

  const index = valeur.startingPlayerIndex
  if (!Number.isInteger(index) || (index as number) < 0 || (index as number) >= playerIds.length) {
    throw new DomainError(`invalid startingPlayerIndex: ${String(index)}`)
  }

  const name = valeur.name === undefined ? null : MatchName.of(texte(valeur.name, 'name'))

  return {
    playerIds,
    startingPlayerIndex: index as number,
    ...(name === null ? {} : { name }),
  }
}

// ⚠️ Un mode absent d'ici est impossible à réimporter : ajouter un mode, c'est ajouter sa ligne ici.
const OUVERTURES = [
  'MatchStarted',
  'TourDuMondeStarted',
  'CricketStarted',
  'CheckoutPracticeStarted',
  'KillerStarted',
]

const versEvenement = (valeur: unknown): MatchEvent => {
  if (!estObjet(valeur)) throw new DomainError('event must be an object')

  const config = estObjet(valeur.config) ? valeur.config : {}

  if (valeur.type === 'MatchStarted') {
    return {
      type: 'MatchStarted',
      config: X01Config.create({
        startingScore: config.startingScore as number | undefined,
        legsToWin: config.legsToWin as number | undefined,
        setsToWin: config.setsToWin as number | undefined,
        doubleIn: config.doubleIn as boolean | undefined,
        doubleOut: config.doubleOut as boolean | undefined,
      }),
      ...versOuverture(valeur, 'MatchStarted'),
    }
  }

  if (valeur.type === 'TourDuMondeStarted') {
    return {
      type: 'TourDuMondeStarted',
      config: TourDuMondeConfig.create({
        targets: liste(config.targets, 'config.targets').map(versSegment),
      }),
      ...versOuverture(valeur, 'TourDuMondeStarted'),
    }
  }

  if (valeur.type === 'CricketStarted') {
    return {
      type: 'CricketStarted',
      config: CricketConfig.create({
        targets: liste(config.targets, 'config.targets').map(versSegment),
        variant: config.variant as CricketVariant | undefined,
      }),
      ...versOuverture(valeur, 'CricketStarted'),
    }
  }

  if (valeur.type === 'CheckoutPracticeStarted') {
    return {
      type: 'CheckoutPracticeStarted',
      config: CheckoutPracticeConfig.create({
        rounds: config.rounds as number | undefined,
        minTarget: config.minTarget as number | undefined,
        maxTarget: config.maxTarget as number | undefined,
      }),
      ...versOuverture(valeur, 'CheckoutPracticeStarted'),
    }
  }

  if (valeur.type === 'KillerStarted') {
    const event: KillerStarted = {
      type: 'KillerStarted',
      config: KillerConfig.create({
        startingLives: config.startingLives as number | undefined,
        selfHitCostsLives: config.selfHitCostsLives as boolean | undefined,
      }),
      numbers: liste(valeur.numbers, 'numbers').map(versNumeroKiller),
      ...versOuverture(valeur, 'KillerStarted'),
    }
    KillerRules.start(event)
    return event
  }

  if (valeur.type === 'RoundStarted') {
    const target = valeur.target
    if (!Number.isInteger(target) || (target as number) < 2) {
      throw new DomainError(`invalid round target: ${String(target)}`)
    }
    return { type: 'RoundStarted', target: target as number }
  }

  if (valeur.type === 'VisitRecorded') {
    const darts = liste(valeur.darts, 'darts').map(versDart)
    if (darts.length < 1 || darts.length > 3) {
      throw new DomainError(`a visit holds 1 to 3 darts, got ${darts.length}`)
    }
    return { type: 'VisitRecorded', darts }
  }

  throw new DomainError(`unknown event type: ${String(valeur.type)}`)
}

// Genre facultatif (clé absente = « non précisé ») ; un genre invalide refuse le profil.
export const versPlayer = (valeur: unknown): Player => {
  if (!estObjet(valeur)) throw new DomainError('player must be an object')

  const gender =
    valeur.gender === undefined ? undefined : PlayerGender.of(texte(valeur.gender, 'player.gender'))

  return Player.create(
    PlayerId.of(texte(valeur.id, 'player.id')),
    texte(valeur.name, 'player.name'),
    PlayerColor.of(texte(valeur.color, 'player.color')),
    horodatage(valeur.createdAt, 'player.createdAt'),
    gender,
  )
}

export const versMatchRecord = (valeur: unknown): MatchRecord => {
  if (!estObjet(valeur)) throw new DomainError('match must be an object')

  const events = liste(valeur.events, 'match.events').map(versEvenement)
  const ouverture = events[0]?.type
  if (ouverture === undefined || !OUVERTURES.includes(ouverture)) {
    throw new DomainError(`a match journal must open with one of: ${OUVERTURES.join(', ')}`)
  }
  // Le journal entier doit se rejouer, sinon la partie est refusée (comptée dans `matchesSkipped`).
  GameModes.project(events)

  return {
    id: MatchId.of(texte(valeur.id, 'match.id')),
    createdAt: horodatage(valeur.createdAt, 'match.createdAt'),
    updatedAt: horodatage(valeur.updatedAt, 'match.updatedAt'),
    events,
  }
}

/** Vérifie l'enveloppe et rend les deux listes brutes : l'appelant valide entrée par entrée. */
export const ouvrirEnveloppe = (
  contenu: unknown,
): { players: readonly unknown[]; matches: readonly unknown[] } => {
  if (!estObjet(contenu)) throw new DomainError('Ce fichier ne contient pas de sauvegarde.')

  if (contenu.format !== BACKUP_FORMAT) {
    throw new DomainError('Ce fichier n’est pas une sauvegarde Dartpéro.')
  }

  const version = contenu.version
  if (typeof version !== 'number' || version > BACKUP_VERSION) {
    throw new DomainError('Cette sauvegarde vient d’une version plus récente de l’application.')
  }

  return {
    players: liste(contenu.players, 'players'),
    matches: liste(contenu.matches, 'matches'),
  }
}
