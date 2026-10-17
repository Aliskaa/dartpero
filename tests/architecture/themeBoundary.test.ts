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

  /**
   * Les neuf jetons de la feuille de règles (lot `regles-du-jeu`, constat 6 de
   * la Revue) sont **réservés** à la feuille : leurs noms sont génériques
   * (`filet`, `voile`, `rouge-texte`…), mais leurs valeurs n'ont été vérifiées
   * que sur les surfaces de la feuille — `rouge-texte` / `vert-texte` tombent
   * à 4,2 / 3,7:1 sur `feutre-nuit` en clair. `rules/theme-colors.md`
   * § Jetons réservés.
   */
  const utilitaires = (jetons: readonly string[]) =>
    new RegExp(
      `\\b(?:text|bg|border(?:-[trblxy])?|outline|ring|divide|fill|stroke|decoration|shadow|accent|caret)-(?:${jetons.join('|')})(?![\\w-])`,
      'g',
    )

  const JETONS_FEUILLE = [
    'craie-2-regles',
    'craie-3-regles',
    'laiton-texte',
    'rouge-texte',
    'vert-texte',
    'filet-doux',
    'filet',
    'chene-doux',
    'voile',
  ]
  const UTILITAIRE_FEUILLE = utilitaires(JETONS_FEUILLE)

  /**
   * Les jetons réservés, famille par famille : ceux de la feuille de règles,
   * le vert de « Installée » (contraste vérifié sur l'ardoise seulement) et les
   * aperçus de thème, CONSTANTS à dessein (lot `reglages-par-usage`) — employés
   * ailleurs, ils ne suivraient pas le thème. Chaque famille a son témoin : le
   * fichier qui l'emploie, et le nombre d'emplois au moins attendus.
   */
  const RESERVES = [
    {
      famille: 'feuille de règles',
      motif: UTILITAIRE_FEUILLE,
      fichiers: ['composants/commun/FeuilleRegles.tsx', 'composants/commun/LivreRegles.tsx'],
      temoin: 6,
    },
    {
      famille: 'vert du voyant',
      motif: utilitaires(['vert-etat']),
      fichiers: ['composants/commun/Voyant.tsx'],
      temoin: 1,
    },
    {
      famille: 'aperçus de thème',
      motif: utilitaires(['apercu-[a-z-]+']),
      fichiers: ['composants/commun/VignetteTheme.tsx'],
      temoin: 6,
    },
  ] as const

  it.each(RESERVES)(
    'les jetons réservés « $famille » ne servent qu’à leurs fichiers',
    ({ motif, fichiers: reserves, temoin }) => {
      const tous = fichiers(UI)
      expect(tous.length).toBeGreaterThan(40)

      // Témoin : le premier fichier emploie bien ces jetons, le motif les trouve.
      const premier = readFileSync(resolve(UI, reserves[0]), 'utf8')
      expect((premier.match(motif) ?? []).length).toBeGreaterThanOrEqual(temoin)

      const fautes = tous.flatMap((fichier) => {
        const chemin = enUi(fichier)
        if ((reserves as readonly string[]).includes(chemin)) return []
        return (readFileSync(fichier, 'utf8').match(motif) ?? []).map(
          (classe) => `${chemin} → ${classe}`,
        )
      })
      expect(fautes).toEqual([])
    },
  )

  it('le motif des aperçus et du vert attrape leurs utilitaires et laisse passer les voisins', () => {
    const apercus = utilitaires(['apercu-[a-z-]+'])
    const vert = utilitaires(['vert-etat'])
    for (const reserve of [
      'bg-apercu-sombre-fond',
      'bg-apercu-clair-encre/60',
      'border-apercu-x',
    ]) {
      expect(reserve.match(apercus), reserve).not.toBeNull()
    }
    expect('text-vert-etat'.match(vert)).not.toBeNull()
    for (const voisin of ['bg-feutre', 'text-vert-texte', 'text-vert-cible', 'border-vert-cible']) {
      expect(voisin.match(apercus), voisin).toBeNull()
      expect(voisin.match(vert), voisin).toBeNull()
    }
  })

  /**
   * L'aperçu d'une vignette ne peint QU'AVEC des `apercu-*` : un `bg-feutre`
   * suivrait le thème courant, et la vignette « Clair » virerait au sombre.
   * Le cadre de la vignette (`border-laiton`, `border-craie/25`) et son libellé
   * vivent hors du composant `Apercu` et ne sont pas visés.
   */
  const COULEUR_DE_TOKEN =
    /\b(?:bg|text|border(?:-[trblxy])?|fill|stroke|outline|ring)-(?:feutre|ardoise|chene|laiton|craie|rouge|vert|sur-laiton|apercu)[\w-]*(?:\/\d+)?/g
  const couleursHorsApercu = (source: string): string[] =>
    (source.match(COULEUR_DE_TOKEN) ?? []).filter((classe) => !/-apercu-/.test(classe))
  const corpsApercu = (source: string): string => {
    const debut = source.indexOf('const Apercu')
    const fin = source.indexOf('\ntype Props', debut)
    expect(debut).toBeGreaterThan(-1)
    expect(fin).toBeGreaterThan(debut)
    return source.slice(debut, fin)
  }

  it('l’aperçu d’une vignette ne peint qu’avec les jetons apercu-*', () => {
    const source = readFileSync(resolve(UI, 'composants/commun/VignetteTheme.tsx'), 'utf8')
    const apercu = corpsApercu(source)

    // Témoin : l'aperçu emploie bien des couleurs, le motif les voit.
    expect((apercu.match(COULEUR_DE_TOKEN) ?? []).length).toBeGreaterThanOrEqual(6)
    expect(couleursHorsApercu(apercu)).toEqual([])
    // Le cadre permis existe bien, hors de l'aperçu.
    expect(source).toContain('border-laiton')
    expect(source).toContain('border-craie/25')
  })

  it('le motif de l’aperçu attrape une couleur qui suit le thème', () => {
    const fautif =
      'const Apercu = () => <span className="bg-feutre text-craie-vive bg-apercu-clair-fond border-laiton/40" />\ntype Props'
    expect(couleursHorsApercu(corpsApercu(fautif))).toEqual([
      'bg-feutre',
      'text-craie-vive',
      'border-laiton/40',
    ])
  })

  /**
   * Les aperçus de thème sont des COPIES : chacun doit valoir exactement le
   * jeton qu'il montre (feutre, craie, laiton du thème montré), et la même
   * valeur dans les deux blocs — sinon la vignette « Clair » changerait de
   * couleur avec le thème courant, ou mentirait sur le thème qu'elle montre.
   */
  it('chaque aperçu de thème vaut le jeton qu’il montre, à l’identique dans les deux blocs', () => {
    const css = readFileSync(resolve(RACINE, 'src/index.css'), 'utf8')
    const valeurs = (depuis: string): Map<string, string> => {
      const debut = css.indexOf(depuis)
      expect(debut).toBeGreaterThan(-1)
      const fin = css.indexOf('\n}', debut)
      return new Map(
        [...css.slice(debut, fin).matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)].map(
          (correspondance) => [correspondance[1] ?? '', (correspondance[2] ?? '').trim()],
        ),
      )
    }
    const sombre = valeurs('@theme {')
    const clair = valeurs('html[data-theme="clair"] {')

    const COPIES = [
      ['apercu-sombre-fond', sombre, 'feutre'],
      ['apercu-sombre-encre', sombre, 'craie'],
      ['apercu-sombre-accent', sombre, 'laiton'],
      ['apercu-clair-fond', clair, 'feutre'],
      ['apercu-clair-encre', clair, 'craie'],
      ['apercu-clair-accent', clair, 'laiton'],
    ] as const

    for (const [apercu, theme, source] of COPIES) {
      const attendu = theme.get(source)
      expect(attendu, source).toBeDefined()
      expect(sombre.get(apercu), `${apercu} (sombre)`).toBe(attendu)
      expect(clair.get(apercu), `${apercu} (clair)`).toBe(attendu)
    }
  })

  it('le motif des jetons réservés attrape leurs utilitaires et laisse passer les voisins', () => {
    const attrape = (chaine: string) => chaine.match(UTILITAIRE_FEUILLE) !== null
    for (const reserve of [
      'text-rouge-texte',
      'border-filet',
      'border-b border-filet-doux',
      'backdrop:bg-voile',
      'text-laiton-texte',
      'border-chene-doux',
      'text-craie-3-regles',
      'border-t-filet/50',
    ]) {
      expect(attrape(reserve), reserve).toBe(true)
    }
    for (const voisin of [
      'filet-colonne',
      'filet-laiton',
      'animate-trace-filet',
      'text-craie-2',
      'text-laiton',
      'bg-feutre-nuit',
      'text-rouge-cible',
    ]) {
      expect(attrape(voisin), voisin).toBe(false)
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
      return [...css.slice(debut, fin).matchAll(/--(color-[a-z0-9-]+):/g)].map(
        (correspondance) => correspondance[1] ?? '',
      )
    }

    const sombre = bloc('@theme {')
    const clair = bloc('html[data-theme="clair"] {')

    expect(sombre.length).toBeGreaterThan(10)
    expect(sombre.filter((token) => !clair.includes(token))).toEqual([])
  })
})
