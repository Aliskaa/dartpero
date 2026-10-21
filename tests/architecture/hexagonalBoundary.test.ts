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

/** Les sous-dossiers réels : un mode ajouté entre dans la garde sans la relire. */
const dossiersDe = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true })
    .filter((entree) => entree.isDirectory())
    .map((entree) => entree.name)

/**
 * Le chemin visé par un import, qu'il soit relatif (`../x01/rules`) ou en alias
 * (`@/ui/composants/x01/…`) : comparer des chaînes laisserait passer le relatif.
 */
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

  /**
   * La couture `GameMode` ne tient que si les modes s'ignorent : c'est ce qui
   * permet d'en ajouter un sans relire les autres. Seul `games/index.ts` les
   * connaît tous — c'est précisément son rôle d'aiguilleur.
   */
  it('un mode de jeu n’importe jamais un autre mode', () => {
    const MODES = dossiersDe(resolve(SRC, 'core/domain/games'))
    // Plancher : une lecture vide rendrait la garde verte à vide.
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

    // Ce qui est vraiment partagé vit dans `composants/commun/`.
    expect(fautes).toEqual([])
  })
})
