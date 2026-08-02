import { beforeEach, describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import { DomainError } from '@/core/domain/DomainError'
import { PlayerId } from '@/core/domain/value-objects/ids'
import { fakeServices } from '../fakes'

describe('ManagePlayers', () => {
  let services: Services

  beforeEach(() => {
    services = fakeServices().services
  })

  it('crée un profil local depuis un simple pseudo', async () => {
    const kevin = await services.managePlayers.create('Kevin')

    expect(kevin.name).toBe('Kevin')
    expect(await services.managePlayers.listAll()).toEqual([kevin])
  })

  it('nettoie les espaces autour du pseudo et refuse le vide', async () => {
    expect((await services.managePlayers.create('  Kevin  ')).name).toBe('Kevin')
    await expect(services.managePlayers.create('   ')).rejects.toThrow(DomainError)
  })

  it('renomme sans changer l’identifiant', async () => {
    const kevin = await services.managePlayers.create('Kevin')
    const renomme = await services.managePlayers.rename(kevin.id, 'Kéké')

    expect(renomme.id).toBe(kevin.id)
    expect(renomme.name).toBe('Kéké')
    expect(await services.managePlayers.listAll()).toEqual([renomme])
  })

  it('refuse de renommer un profil inconnu', async () => {
    await expect(services.managePlayers.rename(PlayerId.of('fantome'), 'X')).rejects.toThrow(
      DomainError,
    )
  })

  it('supprime un profil', async () => {
    const kevin = await services.managePlayers.create('Kevin')
    await services.managePlayers.remove(kevin.id)

    expect(await services.managePlayers.listAll()).toEqual([])
  })
})
