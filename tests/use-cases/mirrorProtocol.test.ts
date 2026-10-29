import { describe, expect, it } from 'vitest'
import type { MatchRecord } from '@/core/application/ports/driven/MatchRepository'
import { MIRROR_MESSAGE_MAX, MirrorProtocol } from '@/core/application/use-cases/mirrorProtocol'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { Dart } from '@/core/domain/value-objects/Dart'
import { MatchId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'
import { lancer } from './lancerPartie'

const partie = async (mode: GameModeId, genre = true) => {
  const { services, dependencies } = fakeServices()
  const lea = await services.managePlayers.create('Léa 🎯', 'lagon', genre ? 'FEMININE' : undefined)
  const tom = await services.managePlayers.create('Tom', 'brique', 'MASCULINE')
  const joueurs = mode === 'CHECKOUT_PRACTICE' ? [lea.id] : [lea.id, tom.id]
  const id = await lancer(services, mode, joueurs)
  const record = (await dependencies.matches.findById(id)) as MatchRecord
  return { record, lea, tom, joueurs: [lea, tom].filter((j) => joueurs.includes(j.id)) }
}

const enveloppe = (corps: Record<string, unknown>) =>
  JSON.stringify({ app: 'dartpero-miroir', v: 1, ...corps })

describe('Protocole du miroir, v1', () => {
  it.each(GAME_MODE_IDS)('%s : un journal et ses joueurs font l’aller-retour', async (mode) => {
    const { record, joueurs } = await partie(mode)
    const message = MirrorProtocol.encodeMatch(
      record,
      joueurs.map((j) => MirrorProtocol.playerOf(j, record)),
    )
    const lu = MirrorProtocol.decode(message)

    expect(lu.kind).toBe('match')
    if (lu.kind !== 'match') return
    expect(lu.record).toEqual(record)
    expect(lu.players.map((j) => j.name)).toEqual(joueurs.map((j) => j.name))
  })

  it('le genre ne voyage qu’avec une ouverture de Killer', async () => {
    const killer = await partie('KILLER')
    const x01 = await partie('X01')

    expect(MirrorProtocol.playerOf(killer.lea, killer.record).gender).toBe('FEMININE')
    expect('gender' in MirrorProtocol.playerOf(x01.lea, x01.record)).toBe(false)

    // Même envoyé, un genre hors Killer est ignoré à la lecture ; non précisé = clé absente.
    const force = MirrorProtocol.decode(
      enveloppe({
        type: 'partie',
        record: x01.record,
        players: [{ id: x01.lea.id, name: 'Léa', color: 'lagon', gender: 'FEMININE' }],
      }),
    )
    expect(force.kind === 'match' && 'gender' in (force.players[0] ?? {})).toBe(false)

    const sansGenre = await partie('KILLER', false)
    expect('gender' in MirrorProtocol.playerOf(sansGenre.lea, sansGenre.record)).toBe(false)
  })

  it('un genre inconnu au Killer refuse le message entier', async () => {
    const { record, lea } = await partie('KILLER')
    const lu = MirrorProtocol.decode(
      enveloppe({
        type: 'partie',
        record,
        players: [{ id: lea.id, name: 'Léa', color: 'lagon', gender: 'NEUTRE' }],
      }),
    )
    expect(lu.kind).toBe('invalid')
  })

  it('une autre version est incompatible, refusée proprement', async () => {
    const { record } = await partie('X01')
    const message = MirrorProtocol.encodeMatch(record, []).replace('"v":1', '"v":2')
    expect(MirrorProtocol.decode(message)).toEqual({ kind: 'incompatible' })
    expect(MirrorProtocol.decode(enveloppe({ type: 'arret' }).replace('"v":1', '"v":"1"'))).toEqual(
      { kind: 'incompatible' },
    )
  })

  it('un message malformé, étranger ou trop gros est invalide, sans jamais lever', async () => {
    const { record } = await partie('X01')
    const invalides = [
      'pas du json',
      '[]',
      'null',
      JSON.stringify({ app: 'autre', v: 1, type: 'arret' }),
      enveloppe({ type: 'inconnu' }),
      enveloppe({ type: 'partie', record: { ...record, events: [] }, players: [] }),
      enveloppe({ type: 'partie', record: { ...record, events: [{ type: 'VisitRecorded' }] } }),
      enveloppe({ type: 'volee', matchId: record.id, visitCount: -1, darts: [] }),
      enveloppe({ type: 'volee', matchId: record.id, visitCount: 0, darts: [{}, {}, {}, {}] }),
      enveloppe({
        type: 'volee',
        matchId: record.id,
        visitCount: 0,
        darts: [{ segment: 'BULL', multiplier: 'TRIPLE' }],
      }),
      `${enveloppe({ type: 'arret' })}${' '.repeat(MIRROR_MESSAGE_MAX)}`,
    ]
    for (const message of invalides)
      expect(MirrorProtocol.decode(message), message.slice(0, 60)).toEqual({ kind: 'invalid' })
  })

  it('joueurs : six au plus, tous inscrits à la partie, sans doublon', async () => {
    const { record, lea, tom } = await partie('X01')
    const joueur = (id: string) => ({ id, name: 'X', color: 'olive' })
    const essai = (players: unknown) =>
      MirrorProtocol.decode(enveloppe({ type: 'partie', record, players })).kind

    expect(essai([joueur(lea.id), joueur(tom.id)])).toBe('match')
    expect(essai([joueur(lea.id), joueur(lea.id)])).toBe('invalid')
    expect(essai([joueur('etranger')])).toBe('invalid')
    expect(essai(Array.from({ length: 7 }, () => joueur(lea.id)))).toBe('invalid')
    expect(
      essai([{ id: lea.id, name: 'Un pseudo bien trop long pour tenir', color: 'olive' }]),
    ).toBe('invalid')
    expect(essai([{ id: lea.id, name: 'Léa', color: '#ff0000' }])).toBe('invalid')
    // Profil supprimé : simplement absent.
    expect(essai([joueur(tom.id)])).toBe('match')
  })

  it('`__proto__` n’a aucun effet : les objets sont reconstruits champ par champ', async () => {
    const { record, lea } = await partie('X01')
    const message = enveloppe({ type: 'partie', record, players: [] }).replace(
      '"players":[]',
      `"players":[{"id":"${lea.id}","name":"Léa","color":"lagon","__proto__":{"pollue":true},"extra":1}]`,
    )
    const lu = MirrorProtocol.decode(message)

    expect(lu.kind).toBe('match')
    if (lu.kind !== 'match') return
    expect(Object.keys(lu.players[0] ?? {})).toEqual(['id', 'name', 'color'])
    expect(({} as Record<string, unknown>).pollue).toBeUndefined()
    expect(Object.getPrototypeOf(lu.players[0])).toBe(Object.prototype)
  })

  it('une volée en cours fait l’aller-retour, et l’arrêt aussi', () => {
    const matchId = MatchId.of('m-1')
    const darts = [Dart.single(20), Dart.of(20, 'TRIPLE')]
    expect(MirrorProtocol.decode(MirrorProtocol.encodeVisit(matchId, 4, darts))).toEqual({
      kind: 'visit',
      matchId,
      visitCount: 4,
      darts,
    })
    expect(MirrorProtocol.decode(MirrorProtocol.encodeVisit(matchId, 0, [])).kind).toBe('visit')
    expect(MirrorProtocol.decode(MirrorProtocol.encodeStop())).toEqual({ kind: 'stop' })
  })
})
