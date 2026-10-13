import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import type { MatchRecord } from '@/core/application/ports/driven/MatchRepository'
import { GAME_MODE_IDS } from '@/core/domain/games'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { MatchName } from '@/core/domain/value-objects/MatchName'
import { PLAYER_COLORS } from '@/core/domain/value-objects/PlayerColor'
import { DexieMatchRepository } from '@/infrastructure/dexie/DexieMatchRepository'
import { DexiePlayerRepository } from '@/infrastructure/dexie/DexiePlayerRepository'
import { createDatabase, type DartperoDatabase } from '@/infrastructure/dexie/database'
import { fakeServices } from '../fakes'
import { lancer, ouverture } from '../use-cases/lancerPartie'

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

    /** Lot `nom-de-partie` : le nom tapé vit dans l'ouverture, sans migration. */
    it('fait traverser la base au nom tapé de l’ouverture', async () => {
      const repository = new DexieMatchRepository(db)
      const sansNom = record('anonyme', 2000)
      const [ouverture, ...suite] = sansNom.events
      if (ouverture?.type !== 'MatchStarted') throw new Error('ouverture X01 attendue')
      const nomme: MatchRecord = {
        ...record('nomme', 2000),
        events: [{ ...ouverture, name: MatchName.of('Finale des potes') as MatchName }, ...suite],
      }

      await repository.save(nomme)

      expect(await repository.findById(nomme.id)).toEqual(nomme)
    })

    /**
     * Les **vrais** lancements, sur la vraie base : IndexedDB garde une clé
     * `name: undefined` (clonage structuré). Un lancement sans nom qui la
     * poserait se verrait donc ici, une fois relu depuis la base.
     */
    it.each(GAME_MODE_IDS)(
      '%s : un lancement sans nom n’écrit aucune clé `name` en base',
      async (mode) => {
        const { services, dependencies } = fakeServices({ matches: new DexieMatchRepository(db) })
        const kevin = (await services.managePlayers.create('Kevin')).id
        const julien = (await services.managePlayers.create('Julien')).id
        const joueurs = mode === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien]

        const anonyme = await lancer(services, mode, joueurs)
        const nommee = await lancer(services, mode, joueurs, 'Finale des potes')

        expect('name' in (await ouverture(dependencies, anonyme))).toBe(false)
        expect(await ouverture(dependencies, nommee)).toMatchObject({ name: 'Finale des potes' })
      },
    )

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
      const kevin = { id: KEVIN, name: 'Kevin', color: 'brique', createdAt: 1000 } as const
      const julien = { id: JULIEN, name: 'Julien', color: 'sapin', createdAt: 2000 } as const

      await repository.save(kevin)
      await repository.save(julien)

      // La couleur et l'ancienneté font le tour complet, sinon changer de
      // téléphone repeindrait tous les profils.
      expect(await repository.findById(KEVIN)).toEqual(kevin)
      expect((await repository.listAll()).map((p) => p.name)).toEqual(['Julien', 'Kevin'])

      await repository.delete(KEVIN)
      expect(await repository.findById(KEVIN)).toBeNull()
      expect(await repository.listAll()).toHaveLength(1)
    })
  })

  /**
   * Le moment où l'on casse tout sans s'en rendre compte : la mise à jour de
   * l'application sur un téléphone qui a déjà des profils. Sans migration, ces
   * profils n'ont ni couleur ni date, `Player.create` les refuse à la lecture,
   * et l'utilisateur ouvre l'app pour découvrir qu'il n'a plus personne.
   */
  describe('Migration v1 → v2', () => {
    it('donne une couleur et une date aux profils déjà en base', async () => {
      const nom = `dartpero-migration-${compteurBase}`

      // Une base telle que la laissait le lot 2 : ni couleur, ni createdAt.
      const ancienne = new Dexie(nom)
      ancienne.version(1).stores({ matches: 'id, updatedAt', players: 'id, name' })
      await ancienne.open()
      await ancienne.table('players').bulkAdd([
        { id: 'kevin', name: 'Kevin' },
        { id: 'julien', name: 'Julien' },
      ])
      ancienne.close()

      const migree = createDatabase(nom)
      const profils = await new DexiePlayerRepository(migree).listAll()

      expect(profils).toHaveLength(2)
      for (const profil of profils) {
        expect(PLAYER_COLORS).toContain(profil.color)
        expect(profil.createdAt).toBeGreaterThan(0)
      }
      // Deux joueurs, deux couleurs : personne ne se retrouve en double.
      expect(new Set(profils.map((profil) => profil.color)).size).toBe(2)

      migree.close()
    })
  })
})
