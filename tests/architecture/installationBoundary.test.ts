import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// ⚠️ L'adapter écoute `beforeinstallprompt` dès sa construction : les services naissent avant `createRoot`.
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

const API_INSTALLATION = ['beforeinstallprompt', 'appinstalled', 'display-mode', '.standalone']

describe('Frontière de l’installation', () => {
  it('seul l’adapter cite les API d’installation du navigateur', () => {
    const tous = fichiers(SRC)
    expect(tous.length).toBeGreaterThan(40)

    const adapter = tous.find((fichier) => enSrc(fichier) === ADAPTER)
    expect(adapter, `${ADAPTER} introuvable`).toBeDefined()
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

  it('src/main.tsx crée les services avant createRoot, et les injecte', () => {
    const source = readFileSync(resolve(SRC, 'main.tsx'), 'utf8')
    const creation = source.search(/createBrowserServices\(\)/)
    const racine = source.search(/createRoot\(/)

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
