import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CameraQrScanner } from '@/infrastructure/device/CameraQrScanner'
import { WebRtcPeerLinks } from '@/infrastructure/peer/WebRtcPeerLinks'
import { LibraryQrEncoder } from '@/infrastructure/qr/LibraryQrEncoder'
import { FakePeerLinks, FakeQrEncoder, FakeQrScanner, fakeServices } from '../fakes'

// ⚠️ Rien ne s'ouvre seul : ni lien, ni caméra, ni bibliothèque QR tant que l'utilisateur n'a rien demandé.
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SRC = resolve(RACINE, 'src')
const SEUL_CHARGEUR = 'infrastructure/qr/bibliothequeQr.ts'

const fichiers = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name)
    if (entree.isDirectory()) return fichiers(chemin)
    return /\.tsx?$/.test(entree.name) ? [chemin] : []
  })

const enSrc = (chemin: string) => relative(SRC, chemin).replaceAll('\\', '/')

const BIBLIOTHEQUE = /['"]@nuintun\/qrcode(?:\/[^'"]*)?['"]/
const IMPORT_STATIQUE = /\b(?:from|import)\s+['"]@nuintun\/qrcode/
const IMPORT_DYNAMIQUE = /\bimport\s*\(\s*['"]@nuintun\/qrcode['"]\s*\)/

describe('Frontière de l’écran miroir', () => {
  it('le détecteur de la bibliothèque QR distingue l’import statique de l’import dynamique', () => {
    expect(IMPORT_STATIQUE.test("import { Encoder } from '@nuintun/qrcode'")).toBe(true)
    expect(IMPORT_STATIQUE.test("import '@nuintun/qrcode'")).toBe(true)
    expect(IMPORT_STATIQUE.test("await import('@nuintun/qrcode')")).toBe(false)
    expect(IMPORT_DYNAMIQUE.test("await import('@nuintun/qrcode')")).toBe(true)
    expect(BIBLIOTHEQUE.test("export * from '@nuintun/qrcode/esm'")).toBe(true)
  })

  it('un seul fichier de src/ cite la bibliothèque QR, et seulement par import()', () => {
    const tous = fichiers(SRC)
    expect(tous.length).toBeGreaterThan(40)

    const lecteurs = tous.filter((fichier) => BIBLIOTHEQUE.test(readFileSync(fichier, 'utf8')))
    expect(lecteurs.map(enSrc)).toEqual([SEUL_CHARGEUR])

    const source = readFileSync(lecteurs[0] as string, 'utf8')
    expect(source).toMatch(IMPORT_DYNAMIQUE)
    expect(source).not.toMatch(IMPORT_STATIQUE)
  })

  it('le cœur interdit la bibliothèque QR par Biome, avec la raison hexagonale', () => {
    const biome = JSON.parse(readFileSync(resolve(RACINE, 'biome.json'), 'utf8'))
    const coeur = biome.overrides.find((o: { includes: string[] }) =>
      o.includes.includes('src/core/**'),
    )
    const chemins = coeur.linter.rules.style.noRestrictedImports.options.paths
    expect(chemins['@nuintun/qrcode']).toMatch(/Frontière hexagonale/)
  })

  it('construire les adapters n’ouvre ni lien, ni caméra, ni bibliothèque', () => {
    const appels = { lien: 0, camera: 0, bibliotheque: 0 }
    new WebRtcPeerLinks(() => {
      appels.lien += 1
      throw new Error('jamais à la construction')
    })
    new CameraQrScanner(
      {
        getUserMedia: () => {
          appels.camera += 1
          return Promise.reject(new Error('jamais à la construction'))
        },
      },
      () => {
        appels.bibliotheque += 1
        return Promise.reject(new Error('jamais à la construction'))
      },
    )
    new LibraryQrEncoder(() => {
      appels.bibliotheque += 1
      return Promise.reject(new Error('jamais à la construction'))
    })
    expect(appels).toEqual({ lien: 0, camera: 0, bibliotheque: 0 })
  })

  it('les sessions naissent au repos : aucune offre, aucune réponse, aucun scan, aucun QR', async () => {
    const liens = new FakePeerLinks()
    const scanner = new FakeQrScanner()
    const encodeur = new FakeQrEncoder()
    const { services, dependencies } = fakeServices({ peerLinks: liens })
    const avecAppareils = fakeServices({
      peerLinks: liens,
      devices: { ...dependencies.devices, qrScanner: scanner, qrEncoder: encodeur },
    }).services

    for (const s of [services, avecAppareils]) {
      expect(s.shareMatch.state()).toEqual({ status: 'idle' })
      expect(s.watchMatch.state()).toEqual({ status: 'idle' })
    }
    expect(liens.offresFaites + liens.reponsesFaites).toBe(0)
    expect(scanner.demarrages).toBe(0)
    expect(encodeur.textes).toEqual([])
  })
})
