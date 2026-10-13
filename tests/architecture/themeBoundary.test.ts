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
    return /\.tsx?$/.test(entree.name) ? [chemin] : []
  })

const enUi = (chemin: string) => relative(UI, chemin).replaceAll('\\', '/')

/**
 * Une couleur écrite en dur ne suit aucun thème. Le noir et le blanc de
 * Tailwind non plus — `bg-black/40` reste noir sur du papier.
 */
const EN_DUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bbg-(?:black|white)\b/g

/**
 * Les trois seuls endroits où une couleur littérale est légitime, parce
 * qu'aucun des trois ne décrit une surface de l'app :
 *
 * - `couleurs.ts` : la palette des profils. Ce sont des teintes **symboliques**
 *   (`brique`, `sapin`…) posées sur leur propre pastille — elles portent leur
 *   fond avec elles, donc les deux thèmes les rendent pareil.
 * - `Cible.tsx` : un vrai plateau de fléchettes. Le rouge du double 20 est la
 *   couleur de l'objet, pas celle du décor ; il ne s'éclaircit pas le jour.
 * - `theme.ts` : les deux teintes de barre système — une par thème, par
 *   définition.
 */
const EXCEPTIONS = ['couleurs.ts', 'composants/commun/Cible.tsx', 'theme.ts']

describe('Frontière des thèmes', () => {
  /**
   * Le lot du thème clair a coûté ce qu'il a coûté à cause d'une trentaine de
   * couleurs écrites en dur, disséminées et invisibles au vert des tests.
   * Cette garde évite d'en réintroduire une : tout ce qui peint une surface
   * doit passer par un token, donc suivre `html[data-theme]`.
   */
  it('aucune couleur en dur dans src/ui, hors palettes d’objets', () => {
    const tous = fichiers(UI)

    // Garde-fou : un test vert à vide ne vérifie rien.
    expect(tous.length).toBeGreaterThan(40)

    const fautes = tous.flatMap((fichier) => {
      const chemin = enUi(fichier)
      if (EXCEPTIONS.some((exception) => chemin.endsWith(exception))) return []
      const trouvees = readFileSync(fichier, 'utf8').match(EN_DUR) ?? []
      return trouvees.map((couleur) => `${chemin} → ${couleur}`)
    })

    expect(fautes).toEqual([])
  })

  /**
   * Le texte secondaire s'écrit en couleur PLEINE (`text-craie-2`,
   * `text-craie-3`), jamais en alpha : sur papier, l'encre transparente tombe
   * sous 4,5:1. Le motif vise `text-craie` et toutes ses variantes
   * (`-2`, `-3`, `-decor`, `-vive`…) suivies d'une barre : il laisse passer
   * `border-craie/25` et `bg-craie/…`, dont l'alpha est un filet ou un fond,
   * pas un texte.
   */
  const ALPHA_TEXTE = /\btext-craie(?:-[a-z0-9]+)?\/(?:\d+|\[)/g

  it('aucun texte en alpha (text-craie/NN) dans src/ui', () => {
    const tous = fichiers(UI)
    expect(tous.length).toBeGreaterThan(40)

    const fautes = tous.flatMap((fichier) =>
      (readFileSync(fichier, 'utf8').match(ALPHA_TEXTE) ?? []).map(
        (classe) => `${enUi(fichier)} → ${classe}`,
      ),
    )

    expect(fautes).toEqual([])
  })

  it('le motif d’alpha attrape le texte en alpha et laisse passer le reste', () => {
    const attrape = (chaine: string) => chaine.match(ALPHA_TEXTE) !== null

    for (const alpha of [
      'text-craie/60',
      'text-craie-vive/80',
      'hover:text-craie/5',
      'text-craie/[.6]',
      'text-craie-2/60',
      'text-craie-3/50',
      'text-craie-decor/40',
      'text-craie-vive/[.8]',
    ]) {
      expect(attrape(alpha), alpha).toBe(true)
    }
    for (const plein of ['text-craie-2', 'text-craie', 'border-craie/25', 'text-craie-decor']) {
      expect(attrape(plein), plein).toBe(false)
    }
  })

  /** Le CSS a le droit d'écrire des couleurs : c'est lui qui les définit. Mais
   *  les deux thèmes doivent définir EXACTEMENT les mêmes tokens, sinon l'un
   *  des deux hérite silencieusement d'une valeur de l'autre. */
  it('le thème clair redéfinit tous les tokens de couleur du thème sombre', () => {
    const css = readFileSync(resolve(RACINE, 'src/index.css'), 'utf8')

    const bloc = (depuis: string) => {
      const debut = css.indexOf(depuis)
      expect(debut).toBeGreaterThan(-1)
      const fin = css.indexOf('\n}', debut)
      return [...css.slice(debut, fin).matchAll(/--(color-[a-z0-9-]+|accent-[a-z0-9-]+):/g)].map(
        (correspondance) => correspondance[1] ?? '',
      )
    }

    const sombre = bloc('@theme {')
    const clair = bloc('html[data-theme="clair"] {')

    // Les accents vivent hors de `@theme` : ils partent dans un `style=`.
    const accentsSombre = bloc(':root {').filter((token) => token.startsWith('accent-'))

    expect(sombre.length).toBeGreaterThan(10)
    expect([...sombre, ...accentsSombre].filter((token) => !clair.includes(token))).toEqual([])
  })
})
