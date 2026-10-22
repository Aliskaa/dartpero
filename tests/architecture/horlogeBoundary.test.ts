import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// ⚠️ L'heure passe par `Clock` / `services.clock` : `Date.now()` rendrait l'UI intestable et pourrait diverger de `createdAt`.
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const estSource = (nom: string): boolean => /\.tsx?$/.test(nom) && !nom.endsWith('.d.ts')

/** Les sources d'un dossier ; `recursif: false` pour la racine de `src` seule. */
const fichiers = (dossier: string, recursif = true): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name)
    if (entree.isDirectory()) return recursif ? fichiers(chemin) : []
    return estSource(entree.name) ? [chemin] : []
  })

const HORLOGE =
  /\bDate\s*\.\s*now\b|\bnew\s+Date\b(?!\s*\((?!\s*\)))|(?<![.\w$]|\bnew\s+)Date\s*\(/g

/** Après ces caractères, un `/` ouvre une expression régulière, pas une division. */
const AVANT_REGEX = new Set([
  '',
  '(',
  ',',
  '=',
  ':',
  '[',
  '!',
  '&',
  '|',
  '?',
  '{',
  '}',
  ';',
  '+',
  '-',
  '*',
  '%',
  '<',
  '>',
  '~',
  '^',
])

const sansCommentaires = (source: string): string => {
  let sortie = ''
  let precedent = '' // dernier caractère significatif hors espaces
  let i = 0
  const recopierJusqua = (fermeture: string, debut: number): number => {
    let j = debut + 1
    let classe = false // `[…]` dans une regex : un `/` n'y ferme rien
    while (j < source.length) {
      const c = source[j]
      if (c === '\\') {
        j += 2
        continue
      }
      if (fermeture === '/' && c === '[') classe = true
      else if (fermeture === '/' && c === ']') classe = false
      else if (c === fermeture && !classe) return j + 1
      else if (fermeture !== '`' && c === '\n') return j // chaîne ou regex non fermée
      j += 1
    }
    return j
  }

  while (i < source.length) {
    const c = source[i] ?? ''
    const suivant = source[i + 1] ?? ''
    if (c === '/' && suivant === '*') {
      const fin = source.indexOf('*/', i + 2)
      i = fin === -1 ? source.length : fin + 2
      sortie += ' '
      continue
    }
    if (c === '/' && suivant === '/') {
      const fin = source.indexOf('\n', i)
      i = fin === -1 ? source.length : fin
      continue
    }
    if (c === "'" || c === '"' || c === '`' || (c === '/' && AVANT_REGEX.has(precedent))) {
      const fin = recopierJusqua(c, i)
      sortie += source.slice(i, fin)
      precedent = c
      i = fin
      continue
    }
    sortie += c
    if (!/\s/.test(c)) precedent = c
    i += 1
  }
  return sortie
}

const fautesDans = (fichiersLus: readonly string[]): string[] =>
  fichiersLus.flatMap((fichier) => {
    const trouvees = sansCommentaires(readFileSync(fichier, 'utf8')).match(HORLOGE) ?? []
    const chemin = relative(RACINE, fichier).replaceAll('\\', '/')
    return trouvees.map((appel) => `${chemin} → ${appel}`)
  })

describe('Frontière de l’horloge', () => {
  it.each([
    ['src/ui', 40],
    ['src/core', 40],
  ])('aucune lecture directe de l’heure dans %s', (dossier, plancher) => {
    const tous = fichiers(resolve(RACINE, dossier))

    expect(tous.length).toBeGreaterThan(plancher)
    expect(fautesDans(tous)).toEqual([])
  })

  /** `App.tsx` et `main.tsx` montent l'UI : même règle, hors `composition/` et `infrastructure/`. */
  it('aucune lecture directe de l’heure à la racine de src', () => {
    const racine = fichiers(resolve(RACINE, 'src'), false)
    const noms = racine.map((fichier) => relative(RACINE, fichier).replaceAll('\\', '/'))

    expect(noms).toEqual(expect.arrayContaining(['src/App.tsx', 'src/main.tsx']))
    expect(fautesDans(racine)).toEqual([])
  })

  /** ⚠️ Une garde qui ne peut pas échouer ne garde rien : elle doit attraper chacun de ces appels. */
  it.each([
    'const maintenant = Date.now()',
    'const maintenant = new Date()',
    'const texte = Date()',
    'const t = Date . now ()',
    'const [maintenant] = useState(Date.now)',
    'const horloge = Date.now',
    'const maintenant = new Date',
    'const maintenant = new Date;',
    'const texte = Date(0)',
    "const route = '/nouvelle-partie/*'\nconst t = Date.now()",
    'const route = "/nouvelle-partie/*"; const t = Date.now()',
    'const route = `/partie/*`; const t = new Date()',
    "const url = 'https://exemple.fr'; const t = Date.now()",
    'const motif = /\\/\\//; const t = Date.now()',
    'const motif = /[/*]/; const t = Date.now()',
  ])('la garde attrape « %s »', (fautif) => {
    expect(sansCommentaires(fautif).match(HORLOGE)).not.toBeNull()
  })

  it.each([
    'new Date(horodatage).getDay()',
    'new Date(annee, mois, jour)',
    'new Date( horodatage )',
    'Date.UTC(2026, 9, 11)',
    'const d: Date = calendrier',
    'valeur instanceof Date',
    'agenda.Date()',
    '// on n’appelle jamais Date.now() ici',
    '/** `new Date()` est interdit */',
    'const nomParDefaut = (horodatage: number) => horodatage',
    "const url = 'https://exemple.fr' // Date.now()",
    "const route = '/nouvelle-partie/*' // Date.now()",
    'const moitie = total / 2 // Date.now()',
  ])('la garde laisse passer « %s »', (permis) => {
    expect(sansCommentaires(permis).match(HORLOGE)).toBeNull()
  })

  /** Les limites documentées de `sansCommentaires` : elles gardent du texte, n'en retirent pas. */
  it('limite assumée : une chaîne qui cite `Date.now()` est signalée (faux positif, jamais l’inverse)', () => {
    expect(sansCommentaires("const aide = 'Date.now()'").match(HORLOGE)).not.toBeNull()
  })
})
