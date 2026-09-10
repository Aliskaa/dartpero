import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Garde du lot `bundle-par-route` (voir docs/lots/bundle-par-route/01-architecture.md,
 * Q7) : les 16 écrans passés en `lazy()` ne doivent jamais redevenir des imports
 * statiques dans les deux fichiers qui les aiguillent, sous peine de revenir
 * discrètement dans le chunk commun.
 *
 * Même réflexe que `hexagonalBoundary.test.ts` : les imports sont lus par regex
 * sur le contenu réel des fichiers, avec un plancher pour qu'une regex cassée ne
 * rende pas ce test vert à vide.
 */

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const APP = resolve(RACINE, 'src/App.tsx')
const PARTIE_ECRAN = resolve(RACINE, 'src/ui/ecrans/games/PartieEcran.tsx')

const IMPORT_STATIQUE = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]+['"]/g
const LAZY_IMPORT = /\blazy\(\s*\(\)\s*=>\s*import\(/g

/** Les noms réellement importés statiquement (nommés), tels qu'utilisables dans le fichier. */
const nomsImportesStatiquement = (source: string): string[] =>
  [...source.matchAll(IMPORT_STATIQUE)].flatMap((correspondance) =>
    (correspondance[1] ?? '')
      .split(',')
      .map((specifier) => specifier.trim())
      .filter(Boolean)
      .map((specifier) =>
        specifier
          .replace(/^type\s+/, '')
          .split(/\s+as\s+/)[0]
          ?.trim(),
      )
      .filter((nom): nom is string => Boolean(nom)),
  )

const nombreDeLazy = (source: string): number => [...source.matchAll(LAZY_IMPORT)].length

// Les 8 routes de src/App.tsx passées en lazy() — AccueilEcran reste statique
// volontairement (start_url, route par défaut, fourre-tout `*`), il n'y figure pas.
const ECRANS_ROUTES = [
  'JoueursEcran',
  'StatistiquesEcran',
  'HistoriqueEcran',
  'ReglagesEcran',
  'NouvellePartieEcran',
  'LancerEntrainementEcran',
  'PartieEcran',
  'ResumePartieEcran',
]

// Les 8 écrans de mode de PartieEcran.tsx — un par mode, jeu + résumé.
const ECRANS_MODE = [
  'X01Ecran',
  'ResumeX01Ecran',
  'TourDuMondeEcran',
  'ResumeTourDuMondeEcran',
  'CricketEcran',
  'ResumeCricketEcran',
  'EntrainementEcran',
  'ResumeEntrainementEcran',
]

describe('Découpage par route (bundle-par-route)', () => {
  it('analyse réellement les fichiers vérifiés', () => {
    // Garde-fou : sans ça, une regex cassée rendrait les tests suivants verts
    // pour de mauvaises raisons (cf. CONVENTIONS.md § 11).
    const appSource = readFileSync(APP, 'utf8')
    const partieSource = readFileSync(PARTIE_ECRAN, 'utf8')

    expect(appSource.length).toBeGreaterThan(500)
    expect(partieSource.length).toBeGreaterThan(500)
    expect(nombreDeLazy(appSource)).toBeGreaterThan(0)
    expect(nombreDeLazy(partieSource)).toBeGreaterThan(0)
    // Plancher pour IMPORT_STATIQUE (symétrique à celui sur nombreDeLazy
    // ci-dessus) : sans lui, une regex cassée renverrait toujours [] et les
    // tests « n'importe jamais statiquement » passeraient au vert à vide.
    // AccueilEcran est le seul écran resté statique dans App.tsx, il sert
    // de témoin garanti présent.
    expect(nomsImportesStatiquement(appSource)).toContain('AccueilEcran')
  })

  it('src/App.tsx n’importe jamais statiquement un des 8 écrans de route', () => {
    const source = readFileSync(APP, 'utf8')
    const noms = nomsImportesStatiquement(source)
    const fautes = ECRANS_ROUTES.filter((ecran) => noms.includes(ecran))

    expect(fautes).toEqual([])
  })

  it('src/App.tsx déclare au moins 8 lazy(() => import(', () => {
    const source = readFileSync(APP, 'utf8')

    expect(nombreDeLazy(source)).toBeGreaterThanOrEqual(8)
  })

  it('PartieEcran.tsx n’importe jamais statiquement un des 8 écrans de mode', () => {
    const source = readFileSync(PARTIE_ECRAN, 'utf8')
    const noms = nomsImportesStatiquement(source)
    const fautes = ECRANS_MODE.filter((ecran) => noms.includes(ecran))

    expect(fautes).toEqual([])
  })

  it('PartieEcran.tsx déclare au moins 8 lazy(() => import(', () => {
    const source = readFileSync(PARTIE_ECRAN, 'utf8')

    expect(nombreDeLazy(source)).toBeGreaterThanOrEqual(8)
  })
})
