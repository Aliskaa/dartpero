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
    expect((await services.managePlayers.create('Jean   Michel')).name).toBe('Jean Michel')
    await expect(services.managePlayers.create('   ')).rejects.toThrow(DomainError)
    await expect(services.managePlayers.create('K'.repeat(21))).rejects.toThrow(DomainError)
  })

  it('refuse un pseudo déjà pris, même en changeant la casse', async () => {
    await services.managePlayers.create('Diego')
    await expect(services.managePlayers.create('diego')).rejects.toThrow(DomainError)
    await expect(services.managePlayers.create('Diego')).rejects.toThrow(DomainError)
  })

  it('refuse de renommer vers un pseudo déjà pris', async () => {
    const diego = await services.managePlayers.create('Diego')
    await services.managePlayers.create('Lucky')
    await expect(services.managePlayers.update(diego.id, { name: 'lucky' })).rejects.toThrow(
      DomainError,
    )
    // Garder son propre pseudo (ou seulement changer la casse affichée) reste OK.
    await expect(services.managePlayers.update(diego.id, { name: 'Diego' })).resolves.toMatchObject(
      {
        name: 'Diego',
      },
    )
  })

  it('donne une couleur distincte à chaque nouveau profil', async () => {
    const noms = ['Kevin', 'Julien', 'Paul', 'Marc']
    const couleurs: string[] = []
    for (const nom of noms) couleurs.push((await services.managePlayers.create(nom)).color)

    expect(new Set(couleurs).size).toBe(noms.length)
  })

  it('renomme sans changer l’identifiant, la couleur ni l’ancienneté', async () => {
    const kevin = await services.managePlayers.create('Kevin')
    const renomme = await services.managePlayers.update(kevin.id, { name: 'Kéké' })

    expect(renomme.id).toBe(kevin.id)
    expect(renomme.name).toBe('Kéké')
    expect(renomme.color).toBe(kevin.color)
    expect(renomme.createdAt).toBe(kevin.createdAt)
    expect(await services.managePlayers.listAll()).toEqual([renomme])
  })

  it('change la couleur sans toucher au pseudo', async () => {
    const kevin = await services.managePlayers.create('Kevin', 'brique')
    const repeint = await services.managePlayers.update(kevin.id, { color: 'prune' })

    expect(repeint.color).toBe('prune')
    expect(repeint.name).toBe('Kevin')
  })

  it('refuse de modifier un profil inconnu', async () => {
    await expect(
      services.managePlayers.update(PlayerId.of('fantome'), { name: 'X' }),
    ).rejects.toThrow(DomainError)
  })

  it('supprime un profil', async () => {
    const kevin = await services.managePlayers.create('Kevin')
    await services.managePlayers.remove(kevin.id)

    expect(await services.managePlayers.listAll()).toEqual([])
  })
})
