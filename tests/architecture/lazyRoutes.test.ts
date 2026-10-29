import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// ⚠️ Les écrans passés en `lazy()` ne doivent jamais redevenir des imports statiques, sous peine de regrossir le chunk commun.
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const APP = resolve(RACINE, 'src/App.tsx')
const PARTIE_ECRAN = resolve(RACINE, 'src/ui/ecrans/games/PartieEcran.tsx')
const MIROIR_ECRAN = resolve(RACINE, 'src/ui/ecrans/miroir/MiroirEcran.tsx')

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

const ECRANS_ROUTES = [
  'JoueursEcran',
  'StatistiquesEcran',
  'HistoriqueEcran',
  'ReglagesEcran',
  'ConfidentialiteEcran',
  'NouvellePartieEcran',
  'PartieEcran',
  'ResumePartieEcran',
  'PartageEcran',
  'MiroirEcran',
]

const ECRANS_MODE = [
  'X01Ecran',
  'ResumeX01Ecran',
  'TourDuMondeEcran',
  'ResumeTourDuMondeEcran',
  'CricketEcran',
  'ResumeCricketEcran',
  'KillerEcran',
  'ResumeKillerEcran',
  'EntrainementEcran',
  'ResumeEntrainementEcran',
]

// Une vue miroir par mode, chacune dans son chunk (lot `ecran-miroir`).
const VUES_MIROIR = [
  'MiroirX01',
  'MiroirTourDuMonde',
  'MiroirCricket',
  'MiroirKiller',
  'MiroirEntrainement',
]

describe('Découpage par route (bundle-par-route)', () => {
  it('analyse réellement les fichiers vérifiés', () => {
    const appSource = readFileSync(APP, 'utf8')
    const partieSource = readFileSync(PARTIE_ECRAN, 'utf8')

    expect(appSource.length).toBeGreaterThan(500)
    expect(partieSource.length).toBeGreaterThan(500)
    expect(nombreDeLazy(appSource)).toBeGreaterThan(0)
    expect(nombreDeLazy(partieSource)).toBeGreaterThan(0)
    expect(nomsImportesStatiquement(appSource)).toContain('AccueilEcran')
  })

  it('src/App.tsx n’importe jamais statiquement un des 10 écrans de route', () => {
    const source = readFileSync(APP, 'utf8')
    const noms = nomsImportesStatiquement(source)
    const fautes = ECRANS_ROUTES.filter((ecran) => noms.includes(ecran))

    expect(fautes).toEqual([])
  })

  it('src/App.tsx déclare au moins 10 lazy(() => import(', () => {
    const source = readFileSync(APP, 'utf8')

    expect(nombreDeLazy(source)).toBeGreaterThanOrEqual(10)
  })

  it('PartieEcran.tsx n’importe jamais statiquement un des 10 écrans de mode', () => {
    const source = readFileSync(PARTIE_ECRAN, 'utf8')
    const noms = nomsImportesStatiquement(source)
    const fautes = ECRANS_MODE.filter((ecran) => noms.includes(ecran))

    expect(fautes).toEqual([])
  })

  it('PartieEcran.tsx déclare au moins 10 lazy(() => import(', () => {
    const source = readFileSync(PARTIE_ECRAN, 'utf8')

    expect(nombreDeLazy(source)).toBeGreaterThanOrEqual(10)
  })

  it('MiroirEcran.tsx n’importe jamais statiquement une des 5 vues miroir', () => {
    const source = readFileSync(MIROIR_ECRAN, 'utf8')
    const noms = nomsImportesStatiquement(source)

    expect(source.length).toBeGreaterThan(500)
    expect(VUES_MIROIR.filter((vue) => noms.includes(vue))).toEqual([])
    expect(nombreDeLazy(source)).toBeGreaterThanOrEqual(VUES_MIROIR.length)
  })
})
