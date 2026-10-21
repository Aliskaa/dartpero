import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Services } from '@/composition/container'
import type { MatchSummary } from '@/core/application/ports/driving/MatchSummary'
import { KillerConfig } from '@/core/domain/games/killer/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { vueCarte } from '@/ui/cartesPartie'
import { MiniTableauPartie } from '@/ui/composants/commun/MiniTableauPartie'
import { fakeServices } from '../fakes'

/**
 * Lot `killer`, les cartes (réponses 8 et 9) : « 3 vies » seulement, ni tirage
 * ni variante ; en cours, les vies de chacun, classées par `rank` (vies
 * décroissantes, ex æquo dans l'ordre de jeu, éliminés en bas), sans teinte de
 * la ligne de tête ; finie, le rang. Les résumés viennent du vrai journal.
 */

const partie = async (config = KillerConfig.create()) => {
  const { services } = fakeServices()
  const ids = []
  for (const nom of ['Kevin', 'Julien', 'Sarah']) {
    ids.push((await services.managePlayers.create(nom)).id)
  }
  const id = await services.playKiller.start({ playerIds: ids, config, numbers: [17, 8, 12] })
  // Kevin devient killer et élimine Julien (3 vies, un triple) ; Sarah ne fait rien.
  await services.playKiller.recordVisit(id, [Dart.double(17), Dart.triple(8), Dart.single(1)])
  await services.playKiller.recordVisit(id, [Dart.single(1), Dart.single(1), Dart.single(1)])
  return { services, id }
}

const resume = async (services: Services, id: MatchId): Promise<MatchSummary> => {
  const trouve = (await services.getMatchHistory.execute()).find((carte) => carte.id === id)
  if (!trouve) throw new Error('partie absente de l’historique')
  return trouve
}

describe('vueCarte — Killer', () => {
  it('la colonne et les règles : « 3 vies » seulement, la variante n’apparaît pas', async () => {
    const { services, id } = await partie(KillerConfig.create({ selfHitCostsLives: true }))
    const vue = vueCarte(await resume(services, id))
    expect(vue.pictogramme).toBe('killer')
    expect(vue.detail).toBe('3 vies')
    expect(vue.unite).toBe('vies')
    expect(vue.regles).toBe('3 vies')
    expect(vue.regles).not.toMatch(/tirage|petit|numéro/i)
  })

  it('en cours : vies de chacun, éliminé en bas, aucune teinte, « 2 en vie »', async () => {
    const { services, id } = await partie()
    const vue = vueCarte(await resume(services, id))
    expect(vue.etat).toBe('2 en vie')
    expect(vue.joueurs.map((joueur) => joueur.nom)).toEqual(['Kevin', 'Sarah', 'Julien'])
    expect(vue.joueurs.map((joueur) => joueur.chiffre.valeur)).toEqual(['3', '3', '0'])
    expect(vue.joueurs.map((joueur) => joueur.elimine)).toEqual([false, false, true])
    expect(vue.joueurs.some((joueur) => joueur.enTeteDuClassement || joueur.premier)).toBe(false)
    expect(vue.joueurs[2]?.jauge).toEqual({ type: 'vies', restantes: 0, total: 3 })
  })

  it('finie : le rang, le gagnant premier', async () => {
    const { services, id } = await partie()
    await services.playKiller.recordVisit(id, [Dart.triple(12)])
    const vue = vueCarte(await resume(services, id))
    expect(vue.joueurs.map((joueur) => [joueur.nom, joueur.valeur])).toEqual([
      ['Kevin', '1'],
      ['Sarah', '2'],
      ['Julien', '3'],
    ])
    expect(vue.joueurs.map((joueur) => joueur.premier)).toEqual([true, false, false])
  })

  it('le mini tableau : carrés de vie, éliminé barré', async () => {
    const { services, id } = await partie()
    render(
      <MemoryRouter>
        <ul>
          <MiniTableauPartie
            partie={await resume(services, id)}
            profils={new Map()}
            quand="21 h 40"
          />
        </ul>
      </MemoryRouter>,
    )
    expect(screen.getByText('2 en vie')).toBeInTheDocument()
    expect(screen.getByText('Julien')).toHaveClass('line-through')
    expect(screen.getByText('Kevin')).not.toHaveClass('line-through')
  })
})
