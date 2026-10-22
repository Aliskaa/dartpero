import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import type { X01Summary } from '@/core/application/ports/driving/MatchSummary'
import { DomainError } from '@/core/domain/DomainError'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { KillerConfig } from '@/core/domain/games/killer/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { MatchId } from '@/core/domain/value-objects/ids'
import { BrouillonsIndelebiles, fakeServices } from '../fakes'
import { lancer, ouverture } from './lancerPartie'

/** Une base peuplée : deux joueurs, une partie entamée. */
const baseGarnie = async (services: Services) => {
  const kevin = await services.managePlayers.create('Kevin', 'brique')
  const julien = await services.managePlayers.create('Julien', 'sapin')
  const matchId = await services.startMatch.execute({
    playerIds: [kevin.id, julien.id],
    config: X01Config.create(),
  })
  await services.recordVisit.execute({
    matchId,
    darts: [Dart.triple(20), Dart.triple(20), Dart.triple(20)],
  })
  return { kevin, julien, matchId }
}

describe('Sauvegarde JSON', () => {
  let services: Services

  beforeEach(() => {
    services = fakeServices().services
  })

  it('exporte toute la base, journaux compris', async () => {
    const { kevin, matchId } = await baseGarnie(services)
    const sauvegarde = await services.manageBackup.exportAll()

    expect(sauvegarde.format).toBe('dartpero-backup')
    expect(sauvegarde.players).toHaveLength(2)
    expect(sauvegarde.matches).toHaveLength(1)

    expect(sauvegarde.players).toContainEqual({
      id: kevin.id,
      name: 'Kevin',
      color: 'brique',
      createdAt: kevin.createdAt,
    })
    expect(sauvegarde.matches[0]?.id).toBe(matchId)
    expect(sauvegarde.matches[0]?.events).toHaveLength(2)
  })

  it('se restaure à l’identique sur un appareil vierge', async () => {
    await baseGarnie(services)
    const sauvegarde = await services.manageBackup.exportAll()

    const neuf = fakeServices().services
    const rapport = await neuf.manageBackup.importFrom(JSON.parse(JSON.stringify(sauvegarde)))

    expect(rapport).toEqual({
      playersImported: 2,
      matchesImported: 1,
      playersSkipped: 0,
      matchesSkipped: 0,
    })

    const historique = await neuf.getMatchHistory.execute()
    expect(historique).toHaveLength(1)

    const partie = historique[0]
    expect(partie?.mode).toBe('X01')
    const x01 = partie as X01Summary
    expect(x01.players[0]?.name).toBe('Kevin')
    expect(x01.players[0]?.remaining).toBe(321)
  })

  it('restaure aussi les parties qui ne sont pas du X01', async () => {
    const kevin = await services.managePlayers.create('Kevin')
    const julien = await services.managePlayers.create('Julien')

    const cricket = await services.playCricket.start({
      playerIds: [kevin.id, julien.id],
      config: CricketConfig.create({ variant: 'CUT_THROAT' }),
    })
    await services.playCricket.recordVisit(cricket, [Dart.triple(20), Dart.triple(20)])

    const tour = await services.playTourDuMonde.start({
      playerIds: [kevin.id, julien.id],
      config: TourDuMondeConfig.create(),
    })
    await services.playTourDuMonde.recordVisit(tour, [Dart.single(20)])

    const entrainement = await services.playCheckoutPractice.start({
      playerId: kevin.id,
      config: CheckoutPracticeConfig.create({ rounds: 2 }),
    })
    await services.playCheckoutPractice.recordVisit(entrainement, [Dart.miss()])

    const neuf = fakeServices().services
    const rapport = await neuf.manageBackup.importFrom(
      JSON.parse(JSON.stringify(await services.manageBackup.exportAll())),
    )

    expect(rapport.matchesImported).toBe(3)
    expect(rapport.matchesSkipped).toBe(0)

    const modes = (await neuf.getMatchHistory.execute()).map((partie) => partie.mode).sort()
    expect(modes).toEqual(['CHECKOUT_PRACTICE', 'CRICKET', 'TOUR_DU_MONDE'])

    const restaure = await neuf.playCricket.getState(cricket)
    expect(restaure.config.variant).toBe('CUT_THROAT')
    expect(restaure.players[1]?.score).toBe(60)
  })

  it('fusionne sans jamais effacer ce qui était déjà là', async () => {
    await services.managePlayers.create('Paul')

    await services.manageBackup.importFrom({
      format: 'dartpero-backup',
      version: 1,
      exportedAt: 1,
      players: [{ id: 'ailleurs-1', name: 'Kevin', color: 'brique', createdAt: 1 }],
      matches: [],
    })

    const noms = (await services.managePlayers.listAll()).map((joueur) => joueur.name).sort()
    expect(noms).toEqual(['Kevin', 'Paul'])
  })

  it('écrase un profil dont l’identifiant est déjà connu', async () => {
    const paul = await services.managePlayers.create('Paul')

    await services.manageBackup.importFrom({
      format: 'dartpero-backup',
      version: 1,
      exportedAt: 1,
      players: [{ id: paul.id, name: 'Paulo', color: 'prune', createdAt: paul.createdAt }],
      matches: [],
    })

    const profils = await services.managePlayers.listAll()
    expect(profils).toHaveLength(1)
    expect(profils[0]?.name).toBe('Paulo')
    expect(profils[0]?.color).toBe('prune')
  })

  it('réimporter deux fois ne duplique rien', async () => {
    await baseGarnie(services)
    const sauvegarde = await services.manageBackup.exportAll()

    await services.manageBackup.importFrom(sauvegarde)
    await services.manageBackup.importFrom(sauvegarde)

    expect(await services.managePlayers.listAll()).toHaveLength(2)
    expect(await services.getMatchHistory.execute()).toHaveLength(1)
  })

  it('refuse un fichier qui n’est pas une sauvegarde Dartpéro', async () => {
    await expect(services.manageBackup.importFrom(null)).rejects.toThrow(DomainError)
    await expect(services.manageBackup.importFrom({ hello: 'world' })).rejects.toThrow(DomainError)
    await expect(
      services.manageBackup.importFrom({ format: 'autre-app', version: 1 }),
    ).rejects.toThrow(DomainError)
  })

  it('refuse une sauvegarde venue d’une version plus récente', async () => {
    const sauvegarde = await services.manageBackup.exportAll()

    await expect(services.manageBackup.importFrom({ ...sauvegarde, version: 99 })).rejects.toThrow(
      DomainError,
    )
  })

  it('importe ce qui est lisible et compte ce qui ne l’est pas', async () => {
    await baseGarnie(services)
    const sauvegarde = await services.manageBackup.exportAll()

    const abime = {
      ...sauvegarde,
      players: [...sauvegarde.players, { id: 'x', name: '', color: 'brique', createdAt: 1 }],
      matches: [
        ...sauvegarde.matches,
        { id: 'corrompu', createdAt: 1, updatedAt: 2, events: [{ type: 'NImporteQuoi' }] },
      ],
    }

    const neuf = fakeServices().services
    const rapport = await neuf.manageBackup.importFrom(abime)

    expect(rapport.playersImported).toBe(2)
    expect(rapport.playersSkipped).toBe(1)
    expect(rapport.matchesImported).toBe(1)
    expect(rapport.matchesSkipped).toBe(1)
    expect(await neuf.getMatchHistory.execute()).toHaveLength(1)
  })

  it('rejette une fléchette impossible plutôt que de l’accepter', async () => {
    const sauvegarde = await services.manageBackup.exportAll()
    const neuf = fakeServices().services

    const rapport = await neuf.manageBackup.importFrom({
      ...sauvegarde,
      matches: [
        {
          id: 'triche',
          createdAt: 1,
          updatedAt: 2,
          events: [
            {
              type: 'MatchStarted',
              config: X01Config.create(),
              playerIds: ['kevin'],
              startingPlayerIndex: 0,
            },
            { type: 'VisitRecorded', darts: [{ segment: 'BULL', multiplier: 'TRIPLE' }] },
          ],
        },
      ],
    })

    expect(rapport.matchesImported).toBe(0)
    expect(rapport.matchesSkipped).toBe(1)
  })
})

describe('Sauvegarde JSON — le Killer', () => {
  const killer = (surcharge: Record<string, unknown> = {}, volees: unknown[] = []) => ({
    format: 'dartpero-backup',
    version: 1,
    exportedAt: 1,
    players: [],
    matches: [
      {
        id: 'k',
        createdAt: 1,
        updatedAt: 2,
        events: [
          {
            type: 'KillerStarted',
            config: { startingLives: 3, selfHitCostsLives: false },
            playerIds: ['kevin', 'julien'],
            numbers: [8, 14],
            startingPlayerIndex: 0,
            ...surcharge,
          },
          ...volees.map((darts) => ({ type: 'VisitRecorded', darts })),
        ],
      },
    ],
  })

  it('s’exporte et s’importe à l’identique, numéros et variante compris', async () => {
    const { services } = fakeServices()
    const kevin = (await services.managePlayers.create('Kevin')).id
    const julien = (await services.managePlayers.create('Julien')).id
    const id = await services.playKiller.start({
      playerIds: [kevin, julien],
      config: KillerConfig.create({ startingLives: 5, selfHitCostsLives: true }),
      numbers: [8, 14],
    })
    await services.playKiller.recordVisit(id, [Dart.double(8), Dart.single(14)])

    const neuf = fakeServices().services
    const rapport = await neuf.manageBackup.importFrom(
      JSON.parse(JSON.stringify(await services.manageBackup.exportAll())),
    )

    expect(rapport.matchesImported).toBe(1)
    expect(await neuf.playKiller.getState(id)).toEqual(await services.playKiller.getState(id))
  })

  it('accepte un journal Killer cohérent', async () => {
    const rapport = await fakeServices().services.manageBackup.importFrom(
      killer({}, [[{ segment: 8, multiplier: 'DOUBLE' }]]),
    )
    expect(rapport).toMatchObject({ matchesImported: 1, matchesSkipped: 0 })
  })

  it.each([
    ['un seul joueur', { playerIds: ['kevin'], numbers: [8] }],
    [
      'sept joueurs',
      { playerIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], numbers: [1, 2, 3, 4, 5, 6, 7] },
    ],
    ['un joueur en double', { playerIds: ['kevin', 'kevin'] }],
    ['un numéro en double', { numbers: [8, 8] }],
    ['le numéro 0', { numbers: [0, 14] }],
    ['le numéro 21', { numbers: [8, 21] }],
    ['la bulle comme numéro', { numbers: ['BULL', 14] }],
    ['un numéro décimal', { numbers: [8.5, 14] }],
    ['des longueurs différentes', { numbers: [8] }],
    ['pas de numéros', { numbers: undefined }],
    ['4 vies', { config: { startingLives: 4, selfHitCostsLives: false } }],
    ['une variante mal typée', { config: { startingLives: 3, selfHitCostsLives: 'oui' } }],
  ])('refuse sans planter : %s', async (_, surcharge) => {
    const rapport = await fakeServices().services.manageBackup.importFrom(killer(surcharge))
    expect(rapport).toMatchObject({ matchesImported: 0, matchesSkipped: 1 })
  })

  it('refuse un journal qui ne se rejoue pas : une volée après la fin, un RoundStarted', async () => {
    const { services } = fakeServices()
    const finie = killer({}, [
      [
        { segment: 8, multiplier: 'DOUBLE' },
        { segment: 14, multiplier: 'TRIPLE' },
      ],
      [{ segment: 'MISS', multiplier: 'SIMPLE' }],
    ])
    expect(await services.manageBackup.importFrom(finie)).toMatchObject({ matchesSkipped: 1 })

    const avecManche = killer()
    avecManche.matches[0]?.events.push({ type: 'RoundStarted', target: 40 } as never)
    expect(await services.manageBackup.importFrom(avecManche)).toMatchObject({
      matchesSkipped: 1,
    })
  })
})

describe('Sauvegarde JSON — le genre du profil', () => {
  const fichier = (players: readonly Record<string, unknown>[]) => ({
    format: 'dartpero-backup',
    version: 1,
    exportedAt: 1,
    players,
    matches: [],
  })

  it('n’exporte la clé `gender` que si le genre a été choisi', async () => {
    const { services } = fakeServices()
    await services.managePlayers.create('Kevin')
    await services.managePlayers.create('Sarah', undefined, 'FEMININE')

    const sauvegarde = await services.manageBackup.exportAll()
    const kevin = sauvegarde.players.find((p) => p.name === 'Kevin')
    const sarah = sauvegarde.players.find((p) => p.name === 'Sarah')

    expect(sauvegarde.version).toBe(1)
    expect('gender' in (kevin ?? {})).toBe(false)
    expect(sarah?.gender).toBe('FEMININE')
  })

  it('fait l’aller-retour à l’identique', async () => {
    const { services } = fakeServices()
    await services.managePlayers.create('Sarah', undefined, 'FEMININE')
    await services.managePlayers.create('Julien', undefined, 'MASCULINE')
    await services.managePlayers.create('Kevin')

    const neuf = fakeServices().services
    await neuf.manageBackup.importFrom(
      JSON.parse(JSON.stringify(await services.manageBackup.exportAll())),
    )

    expect(await neuf.managePlayers.listAll()).toEqual(await services.managePlayers.listAll())
  })

  it('une vieille sauvegarde sans genre s’importe en « non précisé »', async () => {
    const { services } = fakeServices()
    const rapport = await services.manageBackup.importFrom(
      fichier([{ id: 'k', name: 'Kevin', color: 'brique', createdAt: 1 }]),
    )

    expect(rapport.playersImported).toBe(1)
    expect('gender' in ((await services.managePlayers.listAll())[0] ?? {})).toBe(false)
  })

  it('refuse un genre invalide sans planter : le profil est ignoré et compté', async () => {
    const { services } = fakeServices()
    const rapport = await services.manageBackup.importFrom(
      fichier([
        { id: 'a', name: 'A', color: 'brique', createdAt: 1, gender: 'X' },
        { id: 'b', name: 'B', color: 'brique', createdAt: 1, gender: 42 },
        { id: 'c', name: 'C', color: 'brique', createdAt: 1, gender: null },
        { id: 'd', name: 'D', color: 'brique', createdAt: 1, gender: 'feminine' },
        { id: 'e', name: 'E', color: 'brique', createdAt: 1, gender: 'UNSPECIFIED' },
        { id: 'f', name: 'F', color: 'brique', createdAt: 1, gender: 'FEMININE' },
      ]),
    )

    expect(rapport.playersSkipped).toBe(5)
    expect(rapport.playersImported).toBe(1)
    expect((await services.managePlayers.listAll()).map((p) => p.name)).toEqual(['F'])
  })

  it('réimporter un vieux fichier remet un profil existant à « non précisé »', async () => {
    const { services } = fakeServices()
    const sarah = await services.managePlayers.create('Sarah', undefined, 'FEMININE')

    await services.manageBackup.importFrom(
      fichier([{ id: sarah.id, name: 'Sarah', color: sarah.color, createdAt: sarah.createdAt }]),
    )

    expect('gender' in ((await services.managePlayers.listAll())[0] ?? {})).toBe(false)
  })
})

describe('Sauvegarde JSON — le nom de partie', () => {
  /** Une ouverture X01 telle qu'un fichier la porte, avec ce qu'on veut en `name`. */
  const fichier = (ouvertures: readonly Record<string, unknown>[]) => ({
    format: 'dartpero-backup',
    version: 1,
    exportedAt: 1,
    players: [{ id: 'kevin', name: 'Kevin', color: 'brique', createdAt: 1 }],
    matches: ouvertures.map((extra, rang) => ({
      id: `partie-${rang}`,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
      events: [
        {
          type: 'MatchStarted',
          config: {
            startingScore: 501,
            legsToWin: 2,
            setsToWin: 1,
            doubleIn: false,
            doubleOut: true,
          },
          playerIds: ['kevin'],
          startingPlayerIndex: 0,
          ...extra,
        },
      ],
    })),
  })

  it('importe une sauvegarde d’avant le lot, sans nom', async () => {
    const neuf = fakeServices()
    const rapport = await neuf.services.manageBackup.importFrom(fichier([{}]))

    expect(rapport.matchesImported).toBe(1)
    const [partie] = await neuf.services.getMatchHistory.execute()
    expect(partie?.name).toBeNull()
    expect('name' in (await ouverture(neuf.dependencies, MatchId.of('partie-0')))).toBe(false)
  })

  it.each(GAME_MODE_IDS)(
    '%s : un aller-retour export → import restitue le nom tapé',
    async (mode) => {
      const { services } = fakeServices()
      const kevin = (await services.managePlayers.create('Kevin')).id
      const julien = (await services.managePlayers.create('Julien')).id
      const joueurs = (m: GameModeId) => (m === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien])
      const nommee = await lancer(services, mode, joueurs(mode), 'Finale des potes')
      const anonyme = await lancer(services, mode, joueurs(mode))

      const sauvegarde = JSON.parse(JSON.stringify(await services.manageBackup.exportAll()))
      const neuf = fakeServices()
      const rapport = await neuf.services.manageBackup.importFrom(sauvegarde)

      expect(rapport.matchesSkipped).toBe(0)
      expect(await ouverture(neuf.dependencies, nommee)).toMatchObject({ name: 'Finale des potes' })
      expect('name' in (await ouverture(neuf.dependencies, anonyme))).toBe(false)
    },
  )

  it.each([
    ['un nombre', 42],
    ['null', null],
    ['un booléen', true],
    ['un objet', {}],
    ['un tableau', []],
    ['31 caractères', 'x'.repeat(31)],
  ] as const)('écarte une partie dont le nom est %s, et importe le reste', async (_, name) => {
    const neuf = fakeServices().services
    const rapport = await neuf.manageBackup.importFrom(fichier([{ name }, {}]))

    expect(rapport.matchesSkipped).toBe(1)
    expect(rapport.matchesImported).toBe(1)
    expect(await neuf.getMatchHistory.execute()).toHaveLength(1)
  })

  it('nettoie un nom importé, et ignore un nom vide', async () => {
    const neuf = fakeServices()
    await neuf.services.manageBackup.importFrom(fichier([{ name: '  Finale  ' }, { name: '   ' }]))

    expect(await ouverture(neuf.dependencies, MatchId.of('partie-0'))).toMatchObject({
      name: 'Finale',
    })
    expect('name' in (await ouverture(neuf.dependencies, MatchId.of('partie-1')))).toBe(false)
  })

  it.each(
    GAME_MODE_IDS.filter((mode) => mode !== 'X01').flatMap((mode) =>
      (
        [
          ['un nombre', 42],
          ['31 caractères', 'x'.repeat(31)],
        ] as const
      ).map(([cas, name]) => [mode, cas, name] as const),
    ),
  )('%s : écarte une ouverture dont le nom est %s', async (mode, _, name) => {
    const { services } = fakeServices()
    const kevin = (await services.managePlayers.create('Kevin')).id
    const julien = (await services.managePlayers.create('Julien')).id
    const joueurs = mode === 'CHECKOUT_PRACTICE' ? [kevin] : [kevin, julien]
    const abimee = await lancer(services, mode, joueurs)
    await lancer(services, mode, joueurs)

    const sauvegarde = JSON.parse(JSON.stringify(await services.manageBackup.exportAll()))
    const cible = sauvegarde.matches.find((partie: { id: string }) => partie.id === abimee)
    cible.events[0].name = name

    const neuf = fakeServices().services
    const rapport = await neuf.manageBackup.importFrom(sauvegarde)

    expect(rapport.matchesSkipped).toBe(1)
    expect(rapport.matchesImported).toBe(1)
  })

  it('ignore un `name` posé sur une volée importée : seule l’ouverture nomme la partie', async () => {
    const sauvegarde = fichier([{}])
    const [partie] = sauvegarde.matches
    if (!partie) throw new Error('partie attendue')
    const abimee = {
      ...sauvegarde,
      matches: [
        {
          ...partie,
          events: [
            ...partie.events,
            {
              type: 'VisitRecorded',
              darts: [{ segment: 20, multiplier: 'SIMPLE' }],
              name: 'Pirate',
            },
          ],
        },
      ],
    }

    const neuf = fakeServices()
    const rapport = await neuf.services.manageBackup.importFrom(abimee)

    expect(rapport.matchesImported).toBe(1)
    const record = await neuf.dependencies.matches.findById(MatchId.of('partie-0'))
    expect(record?.events).toHaveLength(2)
    expect(record?.events.some((evenement) => 'name' in evenement)).toBe(false)
    const [resume] = await neuf.services.getMatchHistory.execute()
    expect(resume?.name).toBeNull()
  })

  it('ne lit pas un nom glissé par `__proto__` dans le fichier', async () => {
    const texte = `{
      "format": "dartpero-backup",
      "version": 1,
      "exportedAt": 1,
      "players": [{ "id": "kevin", "name": "Kevin", "color": "brique", "createdAt": 1 }],
      "matches": [{
        "id": "partie-0",
        "createdAt": 1700000000000,
        "updatedAt": 1700000000000,
        "__proto__": { "name": "Pirate" },
        "events": [{
          "type": "MatchStarted",
          "config": { "startingScore": 501, "legsToWin": 2, "setsToWin": 1, "doubleIn": false, "doubleOut": true },
          "playerIds": ["kevin"],
          "startingPlayerIndex": 0,
          "__proto__": { "name": "Pirate" }
        }]
      }]
    }`
    const fichierHostile = JSON.parse(texte)
    expect(Object.hasOwn(fichierHostile.matches[0].events[0], '__proto__')).toBe(true)
    expect(fichierHostile.matches[0].events[0].name).toBeUndefined()

    const neuf = fakeServices()
    const rapport = await neuf.services.manageBackup.importFrom(fichierHostile)

    expect(rapport.matchesImported).toBe(1)
    expect(rapport.matchesSkipped).toBe(0)
    const importee = await ouverture(neuf.dependencies, MatchId.of('partie-0'))
    expect('name' in importee).toBe(false)
    expect(Object.getPrototypeOf(importee)).toBe(Object.prototype)
    const [resume] = await neuf.services.getMatchHistory.execute()
    expect(resume?.name).toBeNull()
  })

  it('exporte toujours en version 1 : le nom est un ajout facultatif', async () => {
    const { services } = fakeServices()
    const kevin = (await services.managePlayers.create('Kevin')).id
    await lancer(services, 'X01', [kevin], 'Finale')

    expect((await services.manageBackup.exportAll()).version).toBe(1)
  })
})

describe('Sauvegarde JSON — le brouillon de volée', () => {
  const S1 = Dart.single(1)

  /** Une partie entamée avec deux fléchettes en cours. */
  const avecBrouillon = async () => {
    const outils = fakeServices()
    const { matchId } = await baseGarnie(outils.services)
    const base = await outils.services.getMatchState.execute(matchId)
    await outils.services.manageVisitDraft.save({ matchId, base, darts: [S1, S1] })
    expect(await outils.dependencies.visitDrafts.findById(matchId)).not.toBeNull()
    return { ...outils, matchId }
  }

  it('l’export est identique avec ou sans brouillon : il n’en contient aucun', async () => {
    const { services, dependencies, matchId } = await avecBrouillon()
    const avec = await services.manageBackup.exportAll()
    await dependencies.visitDrafts.delete(matchId)
    const sans = await services.manageBackup.exportAll()

    const { exportedAt: _a, ...corpsAvec } = avec
    const { exportedAt: _b, ...corpsSans } = sans
    expect(corpsAvec).toEqual(corpsSans)
    expect(Object.keys(avec).sort()).toEqual([
      'exportedAt',
      'format',
      'matches',
      'players',
      'version',
    ])
    expect(JSON.stringify(avec)).not.toContain('visitCount')
  })

  it('un import qui remplace la partie efface son brouillon ; une partie absente du fichier garde le sien', async () => {
    const { services, dependencies, matchId } = await avecBrouillon()
    const sauvegarde = JSON.parse(JSON.stringify(await services.manageBackup.exportAll()))
    const kevin = (await services.managePlayers.create('Marie')).id
    const autre = await lancer(services, 'X01', [kevin])
    const baseAutre = await services.getMatchState.execute(autre)
    await services.manageVisitDraft.save({ matchId: autre, base: baseAutre, darts: [S1] })

    const rapport = await services.manageBackup.importFrom(sauvegarde)

    expect(rapport.matchesImported).toBe(1)
    expect(await dependencies.visitDrafts.findById(matchId)).toBeNull()
    expect(await dependencies.visitDrafts.findById(autre)).toEqual({
      matchId: autre,
      visitCount: 0,
      darts: [S1],
    })
  })

  it('une entrée invalide du fichier garde le brouillon de sa partie', async () => {
    const { services, dependencies, matchId } = await avecBrouillon()
    const sauvegarde = JSON.parse(JSON.stringify(await services.manageBackup.exportAll()))
    sauvegarde.matches[0].events.push({
      type: 'VisitRecorded',
      darts: [{ segment: 'BULL', multiplier: 'TRIPLE' }],
    })

    const rapport = await services.manageBackup.importFrom(sauvegarde)

    expect(rapport.matchesSkipped).toBe(1)
    expect((await dependencies.visitDrafts.findById(matchId))?.darts).toEqual([S1, S1])
  })

  it('un brouillon impossible à effacer : la partie est écartée, son journal n’est pas écrit', async () => {
    const { services, dependencies } = fakeServices({ visitDrafts: new BrouillonsIndelebiles() })
    const { matchId } = await baseGarnie(services)
    const sauvegarde = JSON.parse(JSON.stringify(await services.manageBackup.exportAll()))
    await services.recordVisit.execute({ matchId, darts: [S1, S1, S1] })
    const avant = await dependencies.matches.findById(matchId)
    expect(avant?.events).toHaveLength(sauvegarde.matches[0].events.length + 1)

    const rapport = await services.manageBackup.importFrom(sauvegarde)

    expect(rapport).toMatchObject({ matchesImported: 0, matchesSkipped: 1 })
    expect(await dependencies.matches.findById(matchId)).toEqual(avant)
  })

  it('une sauvegarde v1 écrite à la main s’importe avec les mêmes compteurs', async () => {
    const neuf = fakeServices()
    const remplacee = MatchId.of('partie-0')
    await neuf.dependencies.visitDrafts.save({ matchId: remplacee, visitCount: 0, darts: [S1] })
    expect(await neuf.dependencies.visitDrafts.findById(remplacee)).not.toBeNull()

    const rapport = await neuf.services.manageBackup.importFrom({
      format: 'dartpero-backup',
      version: 1,
      exportedAt: 1,
      players: [{ id: 'kevin', name: 'Kevin', color: 'brique', createdAt: 1 }],
      matches: [
        {
          id: 'partie-0',
          createdAt: 1_700_000_000_000,
          updatedAt: 1_700_000_000_000,
          events: [
            {
              type: 'MatchStarted',
              config: {
                startingScore: 501,
                legsToWin: 2,
                setsToWin: 1,
                doubleIn: false,
                doubleOut: true,
              },
              playerIds: ['kevin'],
              startingPlayerIndex: 0,
            },
            { type: 'VisitRecorded', darts: [{ segment: 20, multiplier: 'TRIPLE' }] },
          ],
        },
      ],
    })

    expect(rapport).toEqual({
      playersImported: 1,
      matchesImported: 1,
      playersSkipped: 0,
      matchesSkipped: 0,
    })
    expect(await neuf.dependencies.visitDrafts.findById(remplacee)).toBeNull()
  })
})
