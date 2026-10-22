import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// ⚠️ La dernière règle `headers` qui correspond l'emporte, et un `!` dans `ignore` est un no-op silencieux sous glob 10.
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

type RegleEnTetes = {
  readonly source: string
  readonly headers: readonly { readonly key: string; readonly value: string }[]
}

type Hosting = {
  readonly ignore: readonly string[]
  readonly rewrites: readonly { readonly source: string; readonly destination: string }[]
  readonly headers: readonly RegleEnTetes[]
}

const hosting = (): Hosting =>
  (JSON.parse(readFileSync(resolve(RACINE, 'firebase.json'), 'utf8')) as { hosting: Hosting })
    .hosting

const ASSETLINKS = '/.well-known/assetlinks.json'

const indexDe = (regles: readonly RegleEnTetes[], source: string) =>
  regles.findIndex((regle) => regle.source === source)

const valeur = (regle: RegleEnTetes | undefined, cle: string) =>
  regle?.headers.find((entete) => entete.key.toLowerCase() === cle.toLowerCase())?.value

describe('firebase.json — en-têtes', () => {
  it('le fourre-tout ** est la première règle', () => {
    const { headers } = hosting()
    expect(headers.length).toBeGreaterThanOrEqual(5)
    expect(headers[0]?.source).toBe('**')
    expect(valeur(headers[0], 'Cache-Control')).toBe('no-cache')
  })

  it('les règles de cache long passent après le fourre-tout', () => {
    const { headers } = hosting()
    const immuables = headers
      .map((regle, index) => ({ regle, index }))
      .filter(({ regle }) => (valeur(regle, 'Cache-Control') ?? '').includes('immutable'))

    expect(immuables.length).toBeGreaterThanOrEqual(2)
    for (const { index } of immuables) expect(index).toBeGreaterThan(0)
  })

  it('assetlinks.json : règle dédiée, après le fourre-tout, en JSON et sans cache', () => {
    const { headers } = hosting()
    const index = indexDe(headers, ASSETLINKS)

    expect(index).toBeGreaterThan(indexDe(headers, '**'))
    expect(valeur(headers[index], 'Content-Type')).toBe('application/json')
    expect(valeur(headers[index], 'Cache-Control')).toBe('no-cache')
  })
})

describe('firebase.json — fichiers publiés', () => {
  it('aucun motif ignore ne commence par « ! »', () => {
    const { ignore } = hosting()
    expect(ignore.length).toBeGreaterThan(0)
    expect(ignore.filter((motif) => motif.trim().startsWith('!'))).toEqual([])
  })

  it('les autres entrées cachées restent exclues, .well-known excepté', () => {
    const { ignore } = hosting()

    expect(ignore).toContain('**/.!(well-known)')
    expect(ignore).toContain('**/.!(well-known)/**')
    expect(ignore).not.toContain('**/.*')
    expect(ignore).toContain('firebase.json')
    expect(ignore).toContain('**/node_modules/**')
  })

  it('la réécriture SPA est intacte', () => {
    expect(hosting().rewrites).toEqual([{ source: '**', destination: '/index.html' }])
  })
})
