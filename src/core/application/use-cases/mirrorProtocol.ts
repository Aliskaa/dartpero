import { DomainError } from '../../domain/DomainError'
import { Player } from '../../domain/entities/Player'
import type { Dart } from '../../domain/value-objects/Dart'
import { MatchId, PlayerId } from '../../domain/value-objects/ids'
import { PlayerColor } from '../../domain/value-objects/PlayerColor'
import { PlayerGender } from '../../domain/value-objects/PlayerGender'
import type { MatchRecord } from '../ports/driven/MatchRepository'
import type { MirrorPlayer } from '../ports/driving/WatchMatch'
import { versDart, versMatchRecord } from './backupSchema'

// Protocole du miroir, saisie → miroir seulement : jamais persisté ni exporté.
export const MIRROR_APP = 'dartpero-miroir'
export const MIRROR_PROTOCOL_VERSION = 1
/** Plafond d'un message réassemblé, vérifié avant toute analyse. */
export const MIRROR_MESSAGE_MAX = 4 * 1024 * 1024
const MAX_JOUEURS = 6
const MAX_FLECHETTES = 3

export type MirrorMessage =
  | {
      readonly kind: 'match'
      readonly record: MatchRecord
      readonly players: readonly MirrorPlayer[]
    }
  | {
      readonly kind: 'visit'
      readonly matchId: MatchId
      readonly visitCount: number
      readonly darts: readonly Dart[]
    }
  | { readonly kind: 'stop' }

export type DecodedMirrorMessage =
  | MirrorMessage
  | { readonly kind: 'incompatible' }
  | { readonly kind: 'invalid' }

const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
  typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)

const enveloppe = (type: string, corps: Record<string, unknown>): string =>
  JSON.stringify({ app: MIRROR_APP, v: MIRROR_PROTOCOL_VERSION, type, ...corps })

const texte = (valeur: unknown, champ: string): string => {
  if (typeof valeur !== 'string') throw new DomainError(`${champ} must be a string`)
  return valeur
}

// Le genre ne voyage qu'avec une ouverture de Killer : il n'accorde que « éliminé / éliminée ».
const versJoueurs = (valeur: unknown, record: MatchRecord): readonly MirrorPlayer[] => {
  if (!Array.isArray(valeur) || valeur.length > MAX_JOUEURS) {
    throw new DomainError('players must be an array of at most 6')
  }
  const ouverture = record.events[0]
  const inscrits: readonly PlayerId[] =
    ouverture !== undefined && 'playerIds' in ouverture ? ouverture.playerIds : []
  const killer = ouverture?.type === 'KillerStarted'

  const vus = new Set<string>()
  return valeur.map((brut): MirrorPlayer => {
    if (!estObjet(brut)) throw new DomainError('player must be an object')
    const id = PlayerId.of(texte(brut.id, 'player.id'))
    if (!inscrits.includes(id) || vus.has(id)) {
      throw new DomainError(`unexpected player: ${id}`)
    }
    vus.add(id)
    const joueur = {
      id,
      name: Player.cleanName(texte(brut.name, 'player.name')),
      color: PlayerColor.of(texte(brut.color, 'player.color')),
    }
    if (!killer || brut.gender === undefined) return joueur
    return { ...joueur, gender: PlayerGender.of(texte(brut.gender, 'player.gender')) }
  })
}

const versVolee = (corps: Record<string, unknown>): MirrorMessage => {
  const { visitCount } = corps
  if (!Number.isInteger(visitCount) || (visitCount as number) < 0) {
    throw new DomainError(`invalid visitCount: ${String(visitCount)}`)
  }
  if (!Array.isArray(corps.darts) || corps.darts.length > MAX_FLECHETTES) {
    throw new DomainError('darts must be an array of at most 3')
  }
  return {
    kind: 'visit',
    matchId: MatchId.of(texte(corps.matchId, 'matchId')),
    visitCount: visitCount as number,
    darts: corps.darts.map(versDart),
  }
}

export const MirrorProtocol = {
  /** Profils de la partie ; le genre n'est copié que si l'ouverture est un Killer. */
  playerOf(player: Player, record: MatchRecord): MirrorPlayer {
    const joueur = { id: player.id, name: player.name, color: player.color }
    const killer = record.events[0]?.type === 'KillerStarted'
    return killer && player.gender !== undefined ? { ...joueur, gender: player.gender } : joueur
  },

  encodeMatch(record: MatchRecord, players: readonly MirrorPlayer[]): string {
    return enveloppe('partie', {
      record: {
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        events: record.events,
      },
      players,
    })
  },

  encodeVisit(matchId: MatchId, visitCount: number, darts: readonly Dart[]): string {
    return enveloppe('volee', { matchId, visitCount, darts })
  },

  encodeStop(): string {
    return enveloppe('arret', {})
  },

  /** Ne lève jamais : un message illisible est `invalid`, une autre version `incompatible`. */
  decode(message: string): DecodedMirrorMessage {
    if (typeof message !== 'string' || message.length > MIRROR_MESSAGE_MAX) {
      return { kind: 'invalid' }
    }
    try {
      const corps: unknown = JSON.parse(message)
      if (!estObjet(corps) || corps.app !== MIRROR_APP) return { kind: 'invalid' }
      if (corps.v !== MIRROR_PROTOCOL_VERSION) return { kind: 'incompatible' }

      if (corps.type === 'partie') {
        const record = versMatchRecord(corps.record)
        return { kind: 'match', record, players: versJoueurs(corps.players, record) }
      }
      if (corps.type === 'volee') return versVolee(corps)
      if (corps.type === 'arret') return { kind: 'stop' }
      return { kind: 'invalid' }
    } catch {
      return { kind: 'invalid' }
    }
  },
}
