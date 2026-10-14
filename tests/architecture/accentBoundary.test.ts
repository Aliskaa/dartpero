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
    return /\.(tsx?|css)$/.test(entree.name) ? [chemin] : []
  })

/**
 * Ce qui faisait une teinte par jeu : le module `accents.ts`, ses variables CSS
 * (`--accent-*`, `--color-accent-mode*`) et les classes `*-accent-mode*`.
 */
const ACCENT_PAR_MODE =
  /accent-mode|--accent-|ACCENTS_MODE|variablesAccent|ui\/accents|accent-(?:x01|cricket|tour-du-monde|checkout-practice)/

const accentsRestants = (source: string): boolean => ACCENT_PAR_MODE.test(source)

/**
 * Lot `pave-unifie` : le jeu se dit par son pictogramme et son titre, jamais par
 * une couleur. Un accent par jeu se confondait avec la couleur d'un profil. Tout
 * passe au laiton ; le retirer d'un écran sans retirer le mécanisme le
 * ramènerait au prochain lot.
 */
describe('Frontière des accents : le laiton est la seule teinte de l’app', () => {
  it('plus aucun accent par mode dans src/', () => {
    const tous = fichiers(SRC)
    // Garde-fou : un test vert à vide ne vérifie rien (`index.css` compris).
    expect(tous.length).toBeGreaterThan(100)
    expect(tous.some((fichier) => fichier.endsWith('index.css'))).toBe(true)

    const fautes = tous
      .filter((fichier) => accentsRestants(readFileSync(fichier, 'utf8')))
      .map((fichier) => relative(SRC, fichier).replaceAll('\\', '/'))
    expect(fautes).toEqual([])
  })

  it('le détecteur attrape bien le défaut (contre-épreuve)', () => {
    for (const fautif of [
      'className="text-accent-mode"',
      '--accent-x01: #c9a227;',
      "import { ACCENTS_MODE } from '@/ui/accents'",
      'style={variablesAccent(mode)}',
      '--color-accent-mode-clair: #6b5209;',
    ]) {
      expect(accentsRestants(fautif), fautif).toBe(true)
    }
    expect(accentsRestants('className="text-laiton-clair border-laiton/50"')).toBe(false)
  })

  it('le module accents.ts n’existe plus', () => {
    expect(() => readFileSync(resolve(SRC, 'ui/accents.ts'), 'utf8')).toThrow()
  })
})
