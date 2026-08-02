import { beforeEach, describe, expect, it } from 'vitest'
import type { MatchRecord } from '@/core/application/ports/driven/MatchRepository'
import { X01Config } from '@/core/domain/entities/Match'
import { Dart } from '@/core/domain/value-objects/Dart'
import { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { DexieMatchRepository } from '@/infrastructure/dexie/DexieMatchRepository'
import { DexiePlayerRepository } from '@/infrastructure/dexie/DexiePlayerRepository'
import { createDatabase, type DartperoDatabase } from '@/infrastructure/dexie/database'

const KEVIN = PlayerId.of('kevin')
const JULIEN = PlayerId.of('julien')

let compteurBase = 0

const record = (id: string, updatedAt: number): MatchRecord => ({
  id: MatchId.of(id),
  createdAt: 1000,
  updatedAt,
  events: [
    {
      type: 'MatchStarted',
      config: X01Config.create(),
      playerIds: [KEVIN, JULIEN],
      startingPlayerIndex: 0,
    },
    { type: 'VisitRecorded', darts: [Dart.triple(20), Dart.bullseye(), Dart.miss()] },
  ],
})

describe('Adapters Dexie (IndexedDB)', () => {
  let db: DartperoDatabase

  beforeEach(() => {
    compteurBase += 1
    db = createDatabase(`dartpero-test-${compteurBase}`)
  })

  describe('DexieMatchRepository', () => {
    it('restitue un journal identique après un aller-retour en base', async () => {
      const repository = new DexieMatchRepository(db)
      const original = record('match-1', 2000)

      await repository.save(original)
      const relu = await repository.findById(original.id)

      // Le journal est ce qui fait foi : il doit survivre au stockage à l'octet près.
      expect(relu).toEqual(original)
    })

    it('renvoie null pour un match inconnu', async () => {
      expect(await new DexieMatchRepository(db).findById(MatchId.of('absent'))).toBeNull()
    })

    it('liste du plus récemment touché au plus ancien, et respecte la limite', async () => {
      const repository = new DexieMatchRepository(db)
      await repository.save(record('vieux', 1000))
      await repository.save(record('recent', 3000))
      await repository.save(record('moyen', 2000))

      expect((await repository.listRecent()).map((m) => m.id)).toEqual(['recent', 'moyen', 'vieux'])
      expect((await repository.listRecent(2)).map((m) => m.id)).toEqual(['recent', 'moyen'])
    })

    it('écrase le match existant plutôt que d’en créer un second', async () => {
      const repository = new DexieMatchRepository(db)
      await repository.save(record('match-1', 2000))
      await repository.save({ ...record('match-1', 5000), events: [] })

      const tous = await repository.listRecent()
      expect(tous).toHaveLength(1)
      expect(tous[0]?.updatedAt).toBe(5000)
    })
  })

  describe('DexiePlayerRepository', () => {
    it('enregistre, relit, liste par pseudo et supprime', async () => {
      const repository = new DexiePlayerRepository(db)
      await repository.save({ id: KEVIN, name: 'Kevin' })
      await repository.save({ id: JULIEN, name: 'Julien' })

      expect(await repository.findById(KEVIN)).toEqual({ id: KEVIN, name: 'Kevin' })
      expect((await repository.listAll()).map((p) => p.name)).toEqual(['Julien', 'Kevin'])

      await repository.delete(KEVIN)
      expect(await repository.findById(KEVIN)).toBeNull()
      expect(await repository.listAll()).toHaveLength(1)
    })
  })
})
