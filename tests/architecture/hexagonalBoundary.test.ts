import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

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

const enSrc = (chemin: string) => relative(SRC, chemin).replaceAll('\\', '/')

describe('Frontière hexagonale', () => {
  /**
   * La règle la plus importante du projet, vérifiée sur le vrai contenu des
   * fichiers plutôt que sur une liste de paquets bannis : le cœur ne peut rien
   * importer d'autre que lui-même. Ni React, ni Dexie, ni une API navigateur,
   * ni même un paquet npm qu'on n'aurait pas pensé à interdire.
   */
  it('analyse réellement les imports du projet', () => {
    // Garde-fou : sans ça, une regex cassée rendrait tous les tests suivants
    // verts pour de mauvaises raisons.
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

    // L'UI passe par les use cases, câblés dans le composition root.
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
})
