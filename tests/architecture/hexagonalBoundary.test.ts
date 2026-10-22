import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// ⚠️ Le cœur n'importe rien d'autre que lui-même, et les modes de jeu s'ignorent entre eux (seul `games/index.ts` les connaît).
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SRC = resolve(RACINE, 'src')

const fichiers = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name)
    if (entree.isDirectory()) return fichiers(chemin)
    return /\.tsx?$/.test(entree.name) ? [chemin] : []
  })

const IMPORT = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]/g

const importsDe = (fichier: string): string[] => {
  const source = readFileSync(fichier, 'utf8')
  return [...source.matchAll(IMPORT)].map((correspondance) => correspondance[1] ?? '')
}

/** Les sous-dossiers réels : un mode ajouté entre dans la garde sans la relire. */
const dossiersDe = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true })
    .filter((entree) => entree.isDirectory())
    .map((entree) => entree.name)

const cibleDe = (fichier: string, specifier: string): string | null => {
  if (specifier.startsWith('.')) return resolve(dirname(fichier), specifier)
  if (specifier.startsWith('@/')) return resolve(SRC, specifier.slice(2))
  return null
}

const dansDossier = (cible: string | null, dossier: string): boolean => {
  if (cible === null) return false
  const chemin = relative(dossier, cible)
  return chemin === '' || !(chemin.startsWith('..') || resolve(chemin) === chemin)
}

const enSrc = (chemin: string) => relative(SRC, chemin).replaceAll('\\', '/')

describe('Frontière hexagonale', () => {
  it('analyse réellement les imports du projet', () => {
    const tous = fichiers(SRC).flatMap(importsDe)
    expect(fichiers(SRC).length).toBeGreaterThan(20)
    expect(tous.length).toBeGreaterThan(40)
  })

  it('src/core n’importe que src/core, en chemins relatifs', () => {
    const fautes: string[] = []

    for (const fichier of fichiers(resolve(SRC, 'core'))) {
      for (const specifier of importsDe(fichier)) {
        if (!specifier.startsWith('.')) {
          fautes.push(`${enSrc(fichier)} → ${specifier} (import externe)`)
          continue
        }
        const cible = resolve(dirname(fichier), specifier)
        if (relative(resolve(SRC, 'core'), cible).startsWith('..')) {
          fautes.push(`${enSrc(fichier)} → ${specifier} (sort de src/core)`)
        }
      }
    }

    expect(fautes).toEqual([])
  })

  it('src/ui ne touche jamais un adapter directement', () => {
    const fautes: string[] = []

    for (const fichier of fichiers(resolve(SRC, 'ui'))) {
      for (const specifier of importsDe(fichier)) {
        if (specifier.startsWith('@/infrastructure') || specifier.includes('/infrastructure/')) {
          fautes.push(`${enSrc(fichier)} → ${specifier}`)
        }
      }
    }

    expect(fautes).toEqual([])
  })

  it('les adapters ne remontent jamais vers l’UI', () => {
    const fautes: string[] = []

    for (const fichier of fichiers(resolve(SRC, 'infrastructure'))) {
      for (const specifier of importsDe(fichier)) {
        if (specifier.startsWith('@/ui') || specifier.startsWith('@/composition')) {
          fautes.push(`${enSrc(fichier)} → ${specifier}`)
        }
      }
    }

    expect(fautes).toEqual([])
  })

  it('un mode de jeu n’importe jamais un autre mode', () => {
    const MODES = dossiersDe(resolve(SRC, 'core/domain/games'))
    expect(MODES.length).toBeGreaterThanOrEqual(5)
    expect(MODES).toContain('killer')
    const fautes: string[] = []

    for (const mode of MODES) {
      const autres = MODES.filter((autre) => autre !== mode)

      for (const fichier of fichiers(resolve(SRC, 'core/domain/games', mode))) {
        for (const specifier of importsDe(fichier)) {
          const cible = cibleDe(fichier, specifier)
          if (
            autres.some((autre) => dansDossier(cible, resolve(SRC, 'core/domain/games', autre)))
          ) {
            fautes.push(`${enSrc(fichier)} → ${specifier}`)
          }
        }
      }
    }

    expect(fautes).toEqual([])
  })

  it('les écrans d’un mode n’empruntent pas les composants d’un autre', () => {
    const MODES = dossiersDe(resolve(SRC, 'ui/composants')).filter(
      (dossier) => dossier !== 'commun',
    )
    expect(MODES.length).toBeGreaterThanOrEqual(5)
    expect(MODES).toContain('killer')
    const fautes: string[] = []

    for (const mode of MODES) {
      const autres = MODES.filter((autre) => autre !== mode)

      for (const fichier of fichiers(resolve(SRC, 'ui/composants', mode))) {
        for (const specifier of importsDe(fichier)) {
          const cible = cibleDe(fichier, specifier)
          if (autres.some((autre) => dansDossier(cible, resolve(SRC, 'ui/composants', autre)))) {
            fautes.push(`${enSrc(fichier)} → ${specifier}`)
          }
        }
      }
    }

    expect(fautes).toEqual([])
  })
})
