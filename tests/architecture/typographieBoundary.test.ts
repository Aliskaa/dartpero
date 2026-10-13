import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const UI = resolve(RACINE, 'src/ui')
const CSS = readFileSync(resolve(RACINE, 'src/index.css'), 'utf8')

const fichiers = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name)
    if (entree.isDirectory()) return fichiers(chemin)
    return /\.tsx?$/.test(entree.name) ? [chemin] : []
  })

const enUi = (chemin: string) => relative(UI, chemin).replaceAll('\\', '/')

/** Retire d'un CSS le bloc `selecteur { … }` (premier `}` en début de ligne indentée de 2). */
const sansBloc = (css: string, selecteur: string): string => {
  const debut = css.indexOf(`${selecteur} {`)
  if (debut === -1) return css
  const fin = css.indexOf('\n  }', debut)
  return css.slice(0, debut) + css.slice(fin === -1 ? css.length : fin + 4)
}

const sources = () =>
  fichiers(UI).map((fichier) => ({ chemin: enUi(fichier), texte: readFileSync(fichier, 'utf8') }))

describe('Échelle typographique', () => {
  /**
   * Aucune taille en dur dans `src/ui` : le plancher est `text-etiquette`
   * (0,75 rem), les grands chiffres sont des paliers `text-score-*`. Une
   * taille arbitraire rouvrirait la porte aux 0,5 rem illisibles à distance.
   */
  const TAILLE_ARBITRAIRE = /\btext-\[[0-9.]+(?:rem|px|em)\]/g

  it('aucune taille arbitraire text-[…] dans src/ui', () => {
    const tous = sources()
    // Garde-fou : un test vert à vide ne vérifie rien.
    expect(tous.length).toBeGreaterThan(40)

    const fautes = tous.flatMap(({ chemin, texte }) =>
      (texte.match(TAILLE_ARBITRAIRE) ?? []).map((classe) => `${chemin} → ${classe}`),
    )

    expect(fautes).toEqual([])
  })

  it('le motif attrape les tailles en dur et laisse passer les paliers', () => {
    const attrape = (chaine: string) => chaine.match(TAILLE_ARBITRAIRE) !== null

    for (const dur of ['text-[0.6rem]', 'sm:text-[12px]', 'text-[4.25rem]', 'text-[1.1em]']) {
      expect(attrape(dur), dur).toBe(true)
    }
    for (const palier of ['text-etiquette', 'text-score-xl', 'text-sm', 'text-craie-3']) {
      expect(attrape(palier), palier).toBe(false)
    }
  })
})

describe('Zéro dégradé de décor', () => {
  /** Seul exception : le balayage de chargement, un état d'attente. */
  const DEGRADE = /gradient|\bbg-(?:linear|radial|conic)\b/g

  it('aucun dégradé dans src/ui ni dans index.css, hors .chargement-balai', () => {
    const tous = sources()
    expect(tous.length).toBeGreaterThan(40)

    const fautes = [
      ...tous.flatMap(({ chemin, texte }) =>
        (texte.match(DEGRADE) ?? []).map(() => `${chemin} → gradient`),
      ),
      ...(sansBloc(CSS, '.chargement-balai').match(DEGRADE) ?? []).map(
        () => 'index.css → gradient',
      ),
    ]

    expect(fautes).toEqual([])
  })

  it('l’exception existe encore, sinon la garde a perdu sa cible', () => {
    const bloc = CSS.slice(CSS.indexOf('.chargement-balai {'))
    expect(CSS.indexOf('.chargement-balai {')).toBeGreaterThan(-1)
    expect(bloc.slice(0, bloc.indexOf('\n  }')).match(DEGRADE)?.length ?? 0).toBeGreaterThan(0)
  })

  it('le motif attrape les dégradés Tailwind v4 et laisse passer les aplats', () => {
    const attrape = (chaine: string) => chaine.match(DEGRADE) !== null

    for (const degrade of [
      'bg-linear-to-b',
      'sm:bg-linear-45',
      'bg-radial',
      'bg-conic',
      'bg-gradient-to-r',
      'bg-[linear-gradient(red,blue)]',
    ]) {
      expect(attrape(degrade), degrade).toBe(true)
    }
    for (const aplat of ['bg-feutre', 'bg-laiton', 'bg-vert-cible/12', 'border-craie']) {
      expect(attrape(aplat), aplat).toBe(false)
    }
  })

  it('le retrait du bloc attrape un dégradé ailleurs et accepte le bloc seul', () => {
    const seul = '  .chargement-balai {\n    background-image: linear-gradient(red, blue);\n  }\n'
    const ailleurs = `${seul}  .tapis {\n    background-image: radial-gradient(red, blue);\n  }\n`

    expect(sansBloc(seul, '.chargement-balai').match(DEGRADE)).toBeNull()
    expect(sansBloc(ailleurs, '.chargement-balai').match(DEGRADE)).not.toBeNull()
  })
})

describe('Zéro halo', () => {
  /**
   * Un halo est une lueur sans décalage (`shadow-[0_0_…]`). Les ombres PORTÉES
   * (`drop-shadow-[0_3px_0_…]`, `0_2px_2px`) restent permises : elles posent une
   * plaque sur un mur, elles ne rayonnent pas.
   */
  const HALO = /shadow-\[0_0_/g

  /** Un `text-shadow` à flou non nul (un souffle) : seul `.trace-craie` en a le droit. */
  const souffles = (css: string) =>
    [...css.matchAll(/text-shadow:\s*([^;]+);/g)]
      .map((m) => (m[1] ?? '').trim().split(/\s+/))
      .filter((jetons) => /^\d/.test(jetons[2] ?? '') && Number.parseFloat(jetons[2] ?? '0') > 0)

  it('aucun shadow-[0_0_…] dans src/ui', () => {
    const tous = sources()
    expect(tous.length).toBeGreaterThan(40)

    const fautes = tous.flatMap(({ chemin, texte }) =>
      (texte.match(HALO) ?? []).map((classe) => `${chemin} → ${classe}`),
    )

    expect(fautes).toEqual([])
  })

  it('le motif attrape les halos et laisse passer les ombres portées', () => {
    const attrape = (chaine: string) => chaine.match(HALO) !== null

    for (const halo of [
      'shadow-[0_0_20px_x]',
      'drop-shadow-[0_0_8px_x]',
      'sm:shadow-[0_0_4px_x]',
    ]) {
      expect(attrape(halo), halo).toBe(true)
    }
    for (const portee of [
      'shadow-[0_3px_0_x]',
      'drop-shadow-[0_3px_0_x]',
      'drop-shadow-[0_2px_2px_x]',
    ]) {
      expect(attrape(portee), portee).toBe(false)
    }
  })

  it('seul .trace-craie a un text-shadow à flou non nul dans index.css', () => {
    // Le plancher : la règle réservée existe bien, et elle seule souffle.
    expect(souffles(CSS).length).toBeGreaterThan(0)
    expect(souffles(sansBloc(CSS, '.trace-craie'))).toEqual([])
  })

  it('le détecteur de souffle distingue flou et relief', () => {
    expect(souffles('text-shadow: 0 0 10px red;')).toHaveLength(1)
    expect(souffles('text-shadow: 0 1px 0 var(--teinte-relief);')).toHaveLength(0)
  })
})
