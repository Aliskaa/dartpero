import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SRC = resolve(RACINE, 'src')
const ADAPTER = 'infrastructure/device/BrowserAppInstallation.ts'

const fichiers = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name)
    if (entree.isDirectory()) return fichiers(chemin)
    return /\.tsx?$/.test(entree.name) ? [chemin] : []
  })

const enSrc = (chemin: string) => relative(SRC, chemin).replaceAll('\\', '/')

/**
 * Les API d'installation, propres au navigateur (et pour la moitié propres à
 * Chromium ou à Safari iOS). Cherchées dans le texte brut, commentaires
 * compris : un commentaire qui les cite est souvent le premier pas vers un
 * appel posé au mauvais endroit.
 */
const API_INSTALLATION = ['beforeinstallprompt', 'appinstalled', 'display-mode', '.standalone']

describe('Frontière de l’installation', () => {
  it('seul l’adapter cite les API d’installation du navigateur', () => {
    const tous = fichiers(SRC)
    // Garde-fou : un test vert à vide ne vérifie rien.
    expect(tous.length).toBeGreaterThan(40)

    const adapter = tous.find((fichier) => enSrc(fichier) === ADAPTER)
    expect(adapter, `${ADAPTER} introuvable`).toBeDefined()
    // Plancher : l'adapter les contient toutes, sinon la recherche ne prouve rien.
    const sourceAdapter = readFileSync(adapter as string, 'utf8')
    for (const api of API_INSTALLATION) expect(sourceAdapter, api).toContain(api)

    const fautes = tous.flatMap((fichier) => {
      const chemin = enSrc(fichier)
      if (chemin === ADAPTER) return []
      const source = readFileSync(fichier, 'utf8')
      return API_INSTALLATION.filter((api) => source.includes(api)).map(
        (api) => `${chemin} → ${api}`,
      )
    })

    expect(fautes).toEqual([])
  })

  /**
   * L'adapter écoute dès sa construction : l'invite de Chromium peut partir
   * avant le montage de React. Les services doivent donc naître dans le
   * module d'entrée, AVANT `createRoot`, et être injectés au provider.
   */
  it('src/main.tsx crée les services avant createRoot, et les injecte', () => {
    const source = readFileSync(resolve(SRC, 'main.tsx'), 'utf8')
    const creation = source.search(/createBrowserServices\(\)/)
    const racine = source.search(/createRoot\(/)

    // Plancher : les deux appels sont bien trouvés.
    expect(creation).toBeGreaterThanOrEqual(0)
    expect(racine).toBeGreaterThanOrEqual(0)
    expect(creation).toBeLessThan(racine)
    expect(source).toMatch(/<ServicesProvider\s+services=\{services\}>/)
  })

  it('le provider ne crée plus de services lui-même', () => {
    const source = readFileSync(resolve(SRC, 'ui/providers/ServicesProvider.tsx'), 'utf8')
    expect(source).toContain('ServicesContext.Provider')
    expect(source).not.toMatch(/createBrowserServices|createServices/)
  })
})
