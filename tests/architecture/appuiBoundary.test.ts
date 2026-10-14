import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const UI = resolve(RACINE, 'src/ui')

const fichiers = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name)
    if (entree.isDirectory()) return fichiers(chemin)
    return /\.tsx$/.test(entree.name) ? [chemin] : []
  })

/**
 * Toutes les expressions `className=…` d'un source : `className="…"` ou
 * `className={…}` (accolades équilibrées, tableaux et gabarits compris — les
 * classes d'un bouton sont souvent éclatées en plusieurs chaînes).
 */
const expressionsClassName = (source: string): string[] => {
  const trouvees: string[] = []
  for (const debut of source.matchAll(/className=/g)) {
    const depart = (debut.index ?? 0) + debut[0].length
    if (source[depart] === '"') {
      trouvees.push(source.slice(depart, source.indexOf('"', depart + 1) + 1))
    } else if (source[depart] === '{') {
      let profondeur = 0
      for (let i = depart; i < source.length; i++) {
        if (source[i] === '{') profondeur++
        if (source[i] === '}' && --profondeur === 0) {
          trouvees.push(source.slice(depart, i + 1))
          break
        }
      }
    }
  }
  return trouvees
}

/** Un `className` qui pose la classe `touche` ET une couleur de texte directe. */
const POSE_TOUCHE = /(?<![\w-])touche(?![\w-])/
const COULEUR_DE_TEXTE = /(?<![\w-])text-(?:craie|laiton)(?:-[a-z0-9]+)?(?![\w-])/

const mauvaisesTouches = (source: string): string[] =>
  expressionsClassName(source).filter(
    (expression) => POSE_TOUCHE.test(expression) && COULEUR_DE_TEXTE.test(expression),
  )

/**
 * P1 (relevé au lot 5) : `.touche:active` inversait le fond mais pas le texte,
 * parce que l'utilitaire `text-craie-vive` (couche `utilities`) battait la règle
 * de `index.css` (couche `components`). La couleur de repos vit désormais dans
 * `.touche` (`--texte-touche`) ; un bouton ne la pose que par cette variable.
 */
describe('Frontière de l’appui (P1)', () => {
  it('aucune .touche ne porte text-craie* / text-laiton* : la couleur passe par --texte-touche', () => {
    const tous = fichiers(UI)
    // Garde-fou : un test vert à vide ne vérifie rien.
    expect(tous.length).toBeGreaterThan(40)

    const touches = tous.flatMap((fichier) => {
      const source = readFileSync(fichier, 'utf8')
      return expressionsClassName(source).filter((expression) => POSE_TOUCHE.test(expression))
    })
    // Au moins le pavé commun (cibles, Bulle, Hors, Annuler) et JoueursEcran.
    expect(touches.length).toBeGreaterThanOrEqual(5)

    const fautes = tous.flatMap((fichier) =>
      mauvaisesTouches(readFileSync(fichier, 'utf8')).map(
        (expression) => `${relative(UI, fichier).replaceAll('\\', '/')} → ${expression}`,
      ),
    )
    expect(fautes).toEqual([])
  })

  it('le détecteur attrape bien le défaut (contre-épreuve sur des sources fautifs)', () => {
    expect(mauvaisesTouches('<button className="touche flex text-craie-vive">')).toHaveLength(1)
    expect(
      mauvaisesTouches(
        `<button className={['touche col-span-2', 'font-score uppercase', 'text-craie'].join(' ')}>`,
      ),
    ).toHaveLength(1)
    expect(
      mauvaisesTouches('<button className={`touche $' + '{a} text-laiton-clair`}>'),
    ).toHaveLength(1)
    // Les cas sains : la variable, les autres classes `touche-*`, un bouton qui n'est pas une touche.
    expect(
      mauvaisesTouches('<b className="touche [--texte-touche:var(--color-craie-3)]">'),
    ).toEqual([])
    expect(mauvaisesTouches('<b className="touche touche-armee exposant-touche">')).toEqual([])
    expect(mauvaisesTouches('<b className="relative text-craie-2">')).toEqual([])
  })

  it('index.css : la couleur de repos de .touche est une variable, l’appui l’inverse', () => {
    const css = readFileSync(resolve(RACINE, 'src/index.css'), 'utf8')

    const bloc = (selecteur: string) => {
      const debut = css.indexOf(`${selecteur} {`)
      expect(debut, `${selecteur} introuvable`).toBeGreaterThan(-1)
      return css.slice(debut, css.indexOf('}', debut))
    }

    expect(bloc('  .touche')).toMatch(/color:\s*var\(--texte-touche,/)
    expect(bloc('  .touche:active:not(:disabled)')).toMatch(/color:\s*var\(--color-feutre\)/)
    expect(bloc('  .exposant-touche')).toMatch(/color:\s*var\(--color-laiton-clair\)/)
    // À l'appui, l'exposant suit le texte (sinon : laiton clair sur craie).
    expect(css).toMatch(
      /\.touche:active:not\(:disabled\) \.exposant-touche[^{]*\{\s*color:\s*inherit/,
    )
  })
})
