import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import type { X01Summary } from '@/core/application/ports/driving/MatchSummary'
import { DomainError } from '@/core/domain/DomainError'
import { GAME_MODE_IDS, type GameModeId } from '@/core/domain/games'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import { CricketConfig } from '@/core/domain/games/cricket/config'
import { TourDuMondeConfig } from '@/core/domain/games/tour-du-monde/config'
import { X01Config } from '@/core/domain/games/x01/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import { MatchId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'
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
    // Le journal part en entier : c'est lui qui porte toute la partie.
    expect(sauvegarde.matches[0]?.events).toHaveLength(2)
  })

  /** Le vrai scénario du lot 4 : changer de téléphone sans rien perdre. */
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

    // Les scores se rejouent depuis le journal restauré, pas depuis un cache.
    const historique = await neuf.getMatchHistory.execute()
    expect(historique).toHaveLength(1)

    const partie = historique[0]
    expect(partie?.mode).toBe('X01')
    const x01 = partie as X01Summary
    expect(x01.players[0]?.name).toBe('Kevin')
    expect(x01.players[0]?.remaining).toBe(321)
  })

  /**
   * ⚠️ Le piège : la sauvegarde emporte **toutes** les parties, mais seul le
   * X01 savait revenir. Une partie d'un autre mode repartait bien du téléphone
   * et était refusée au retour — on ne s'en apercevait qu'en changeant
   * d'appareil, c'est-à-dire au pire moment.
   */
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

    // La variante, elle aussi, doit survivre au voyage : elle décide du vainqueur.
    const restaure = await neuf.playCricket.getState(cricket)
    expect(restaure.config.variant).toBe('CUT_THROAT')
    expect(restaure.players[1]?.score).toBe(60)
  })

  it('fusionne sans jamais effacer ce qui était déjà là', async () => {
    await services.managePlayers.create('Paul')

    // Une sauvegarde venue d'un autre téléphone : ses identifiants n'ont rien
    // à voir avec ceux d'ici.
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

  /**
   * Le pendant de la fusion : un identifiant déjà connu est bien écrasé. C'est
   * ce qui permet de restaurer par-dessus une base à jour sans se retrouver
   * avec deux fois le même joueur.
   */
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

  /**
   * Le point qui fait la différence entre « j'ai tout perdu » et « il manque
   * une partie » : une entrée abîmée n'emporte pas le fichier avec elle.
   */
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
            // Le triple bull n'existe pas sur une cible : `Dart.of` le refuse,
            // et c'est la même règle qui protège l'import.
            { type: 'VisitRecorded', darts: [{ segment: 'BULL', multiplier: 'TRIPLE' }] },
          ],
        },
      ],
    })

    expect(rapport.matchesImported).toBe(0)
    expect(rapport.matchesSkipped).toBe(1)
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

  /** Critère 8 : une sauvegarde d'avant le lot, écrite à la main, sans aucune clé `name`. */
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

  /**
   * Le refus d'un nom invalide vaut pour **chaque** ouverture, pas seulement
   * `MatchStarted` : le fichier part d'un vrai export, dont on abîme le nom
   * d'une des deux parties.
   */
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

  /**
   * Un fichier hostile qui glisse un `name` par la chaîne de prototypes. Le
   * texte passe par un vrai `JSON.parse` : c'est lui qui fait de `"__proto__"`
   * une clé **propre** (un littéral JS, lui, changerait le prototype). Si
   * l'import recopiait un jour l'objet lu par affectation (`Object.assign`,
   * `obj[clé] = …`), le setter `__proto__` ferait hériter `name: 'Pirate'` et
   * la partie s'importerait nommée — ce test le verrait.
   */
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
    // Garde-fou du test lui-même : la clé est bien propre, le prototype intact.
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
