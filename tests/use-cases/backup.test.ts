import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import type { X01Summary } from '@/core/application/ports/driving/MatchSummary'
import { DomainError } from '@/core/domain/DomainError'
import { X01Config } from '@/core/domain/entities/Match'
import { Dart } from '@/core/domain/value-objects/Dart'
import { fakeServices } from '../fakes'

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
