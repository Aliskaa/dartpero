import { DomainError } from '../../domain/DomainError'
import { X01Config } from '../../domain/entities/Match'
import { Player } from '../../domain/entities/Player'
import type { MatchEvent } from '../../domain/events/MatchEvent'
import { Dart, type Multiplier, type Segment } from '../../domain/value-objects/Dart'
import { MatchId, PlayerId } from '../../domain/value-objects/ids'
import { PlayerColor } from '../../domain/value-objects/PlayerColor'
import type { MatchRecord } from '../ports/driven/MatchRepository'
import { BACKUP_FORMAT, BACKUP_VERSION } from '../ports/driving/ManageBackup'

/**
 * La frontière entre un fichier venu de nulle part et le domaine.
 *
 * Un JSON importé n'est **rien** tant qu'il n'a pas été validé : ni un backup,
 * ni même un objet. Tout passe donc par les fabriques du domaine (`Dart.of`,
 * `X01Config.create`, `PlayerColor.of`…), qui savent déjà refuser un triple
 * bull ou un score de départ absurde. On ne réécrit aucune règle ici, on ne
 * fait que traduire.
 */

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

const versDart = (valeur: unknown): Dart => {
  if (!estObjet(valeur)) throw new DomainError('dart must be an object')

  const { segment, multiplier } = valeur
  const estSegment =
    segment === 'BULL' || segment === 'MISS' || (typeof segment === 'number' && segment >= 1)
  if (!estSegment) throw new DomainError(`invalid dart segment: ${String(segment)}`)

  if (!MULTIPLICATEURS.includes(multiplier as Multiplier)) {
    throw new DomainError(`invalid dart multiplier: ${String(multiplier)}`)
  }

  // `Dart.of` refuse le triple bull et les secteurs hors 1-20 : la règle vit là,
  // pas ici.
  return Dart.of(segment as Segment, multiplier as Multiplier)
}

const versEvenement = (valeur: unknown): MatchEvent => {
  if (!estObjet(valeur)) throw new DomainError('event must be an object')

  if (valeur.type === 'MatchStarted') {
    const config = estObjet(valeur.config) ? valeur.config : {}
    const playerIds = liste(valeur.playerIds, 'playerIds').map((id) =>
      PlayerId.of(texte(id, 'playerId')),
    )
    if (playerIds.length === 0) throw new DomainError('MatchStarted needs at least one player')

    const index = valeur.startingPlayerIndex
    if (
      !Number.isInteger(index) ||
      (index as number) < 0 ||
      (index as number) >= playerIds.length
    ) {
      throw new DomainError(`invalid startingPlayerIndex: ${String(index)}`)
    }

    return {
      type: 'MatchStarted',
      // `X01Config.create` valide le score de départ, les legs et les sets.
      config: X01Config.create({
        startingScore: config.startingScore as number | undefined,
        legsToWin: config.legsToWin as number | undefined,
        setsToWin: config.setsToWin as number | undefined,
        doubleIn: config.doubleIn as boolean | undefined,
        doubleOut: config.doubleOut as boolean | undefined,
      }),
      playerIds,
      startingPlayerIndex: index as number,
    }
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

export const versPlayer = (valeur: unknown): Player => {
  if (!estObjet(valeur)) throw new DomainError('player must be an object')

  return Player.create(
    PlayerId.of(texte(valeur.id, 'player.id')),
    texte(valeur.name, 'player.name'),
    PlayerColor.of(texte(valeur.color, 'player.color')),
    horodatage(valeur.createdAt, 'player.createdAt'),
  )
}

export const versMatchRecord = (valeur: unknown): MatchRecord => {
  if (!estObjet(valeur)) throw new DomainError('match must be an object')

  const events = liste(valeur.events, 'match.events').map(versEvenement)
  if (events[0]?.type !== 'MatchStarted') {
    throw new DomainError('a match journal must open with MatchStarted')
  }

  return {
    id: MatchId.of(texte(valeur.id, 'match.id')),
    createdAt: horodatage(valeur.createdAt, 'match.createdAt'),
    updatedAt: horodatage(valeur.updatedAt, 'match.updatedAt'),
    events,
  }
}

/**
 * Vérifie l'enveloppe du fichier et rend ses deux listes **encore brutes** :
 * chaque entrée est validée une par une par l'appelant, pour qu'une partie
 * abîmée n'emporte pas tout le fichier avec elle.
 */
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
