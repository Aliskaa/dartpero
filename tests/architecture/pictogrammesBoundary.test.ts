import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// ⚠️ Un mode ou un moment se dit par son pictogramme maison, pas par une icône `lucide-react` générique.
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const UI = resolve(RACINE, 'src/ui')

const fichiers = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name)
    if (entree.isDirectory()) return fichiers(chemin)
    return /\.tsx?$/.test(entree.name) ? [chemin] : []
  })

const enUi = (chemin: string) => relative(UI, chemin).replaceAll('\\', '/')

const REMPLACEES = [
  'Crown',
  'Handshake',
  'Target',
  'ChevronsDown',
  'Grid3x3',
  'Globe2',
  'Crosshair',
  'TrendingUp',
  'ChartLine',
]

const IMPORT_LUCIDE = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]lucide-react['"]/g

const importsRemplaces = (source: string): string[] =>
  [...source.matchAll(IMPORT_LUCIDE)].flatMap((correspondance) =>
    (correspondance[1] ?? '')
      .split(',')
      .map((nom) => (nom.trim().split(/\s+as\s+/)[0] ?? '').trim())
      .filter((nom) => REMPLACEES.includes(nom)),
  )

describe('Pictogrammes maison', () => {
  it('aucune icône lucide-react remplacée par un pictogramme ne revient dans src/ui', () => {
    const tous = fichiers(UI)
    expect(tous.length).toBeGreaterThan(40)

    const fautes = tous.flatMap((fichier) =>
      importsRemplaces(readFileSync(fichier, 'utf8')).map((nom) => `${enUi(fichier)} → ${nom}`),
    )

    expect(fautes).toEqual([])
  })

  it('le motif attrape les imports remplacés et laisse passer les autres', () => {
    for (const fautif of [
      "import { Crown } from 'lucide-react'",
      "import { CircleOff, Target } from 'lucide-react'",
      "import { ChevronRight, ChevronsDown, Globe2 } from 'lucide-react'",
      'import {\n  Flag,\n  Handshake,\n} from "lucide-react"',
      "import { Grid3x3 as Grille } from 'lucide-react'",
    ]) {
      expect(importsRemplaces(fautif).length, fautif).toBeGreaterThan(0)
    }
    for (const permis of [
      "import { CircleOff, Flag } from 'lucide-react'",
      "import { ChevronRight } from 'lucide-react'",
      "import { TargetClosed } from 'lucide-react'",
      "import { Target } from './cible'",
    ]) {
      expect(importsRemplaces(permis), permis).toEqual([])
    }
  })
})
