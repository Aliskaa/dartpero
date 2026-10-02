/**
 * Smoke test du bundle de production : sert `dist/`, ouvre la page d'accueil,
 * échoue si le root reste vide ou si une erreur JS remonte.
 *
 * Avant Chromium, des contrôles statiques sur le build lui-même — deux
 * propriétés qui ne se vérifient que sur `dist/` :
 * - le manifeste garde l'identité des installations existantes (`id: '/'`)
 *   et porte ses captures, avec leurs vraies dimensions ;
 * - le précache du service worker contient l'essentiel, et AUCUNE capture.
 *
 * Usage : `npm run build && npm run smoke`
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright-core'

const PORT = 4179
const ROOT = join(process.cwd(), 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json',
}

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error('dist/index.html introuvable — lance `npm run build` d’abord.')
  process.exit(1)
}

/** Largeur × hauteur d'un PNG, lues dans l'en-tête IHDR (octets 16-23, big-endian). */
const dimensionsPng = (fichier) => {
  const octets = readFileSync(fichier)
  const signature = '89504e470d0a1a0a'
  if (octets.length < 24 || octets.subarray(0, 8).toString('hex') !== signature) return null
  return `${octets.readUInt32BE(16)}x${octets.readUInt32BE(20)}`
}

/** Les contrôles statiques de `dist/`. Rend la liste des fautes, vide si tout va bien. */
const controlerBuild = () => {
  const fautes = []
  const cheminManifeste = join(ROOT, 'manifest.webmanifest')
  const cheminSw = join(ROOT, 'sw.js')
  if (!existsSync(cheminManifeste)) return ['dist/manifest.webmanifest introuvable']
  if (!existsSync(cheminSw)) return ['dist/sw.js introuvable']

  // --- Manifeste ---
  const manifeste = JSON.parse(readFileSync(cheminManifeste, 'utf8'))
  // ⚠️ L'identité des installations existantes : ne jamais la changer.
  for (const champ of ['id', 'start_url', 'scope']) {
    if (manifeste[champ] !== '/')
      fautes.push(`manifeste : ${champ} vaut ${JSON.stringify(manifeste[champ])}, attendu "/"`)
  }
  if (!manifeste.categories?.includes('games')) fautes.push('manifeste : categories sans "games"')

  const raccourci = manifeste.shortcuts?.find((r) => r.url === '/nouvelle-partie')
  if (!raccourci) {
    fautes.push('manifeste : aucun raccourci vers /nouvelle-partie')
  } else {
    const icones = (raccourci.icons ?? []).filter((icone) => {
      const fichier = join(ROOT, icone.src)
      const taille = existsSync(fichier) ? dimensionsPng(fichier) : null
      return taille !== null && taille === icone.sizes && Number(taille.split('x')[0]) >= 96
    })
    if (icones.length === 0)
      fautes.push('manifeste : le raccourci n’a aucune icône présente de 96 px ou plus')
  }

  const captures = manifeste.screenshots ?? []
  const etroites = captures.filter((c) => c.form_factor === 'narrow').length
  const larges = captures.filter((c) => c.form_factor === 'wide').length
  if (captures.length !== 3 || etroites !== 2 || larges !== 1) {
    fautes.push(
      `manifeste : ${captures.length} captures (${etroites} narrow, ${larges} wide), attendu 3 (2 narrow, 1 wide)`,
    )
  }
  for (const capture of captures) {
    const fichier = join(ROOT, capture.src)
    // Absente, Firebase servirait `index.html` en 200 à sa place.
    if (!existsSync(fichier)) {
      fautes.push(`capture absente de dist/ : ${capture.src}`)
      continue
    }
    const taille = dimensionsPng(fichier)
    if (taille !== capture.sizes)
      fautes.push(
        `capture ${capture.src} : ${taille ?? 'PNG illisible'}, le manifeste dit ${capture.sizes}`,
      )
    if (!capture.label) fautes.push(`capture ${capture.src} sans label`)
  }

  // --- Précache du service worker ---
  const urls = [...readFileSync(cheminSw, 'utf8').matchAll(/url:"([^"]+)"/g)].map((m) => m[1])
  // Plancher : une extraction cassée rendrait le contrôle suivant vert à vide.
  if (urls.length < 10)
    fautes.push(`précache : ${urls.length} URL extraites de sw.js, attendu au moins 10`)
  for (const essentielle of ['index.html', 'manifest.webmanifest', 'icons/icon-192.png']) {
    if (!urls.includes(essentielle)) fautes.push(`précache : ${essentielle} manquant`)
  }
  const capturesPrecachees = urls.filter((url) => url.startsWith('screenshots/'))
  if (capturesPrecachees.length > 0) {
    fautes.push(`précache : captures présentes (globIgnores ?) : ${capturesPrecachees.join(', ')}`)
  }

  return fautes
}

const fautesBuild = controlerBuild()
if (fautesBuild.length > 0) {
  console.error('Smoke test ÉCHOUÉ — contrôles statiques de dist/')
  for (const faute of fautesBuild) console.error(`  - ${faute}`)
  process.exit(1)
}
console.log(
  'Contrôles statiques OK — manifeste (id, raccourci, 3 captures) et précache sans capture',
)

const server = createServer((req, res) => {
  let path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
  if (path === '/') path = '/index.html'
  const file = normalize(join(ROOT, path))
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end()
    return
  }
  if (existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, {
      'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    })
    res.end(readFileSync(file))
    return
  }
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(readFileSync(join(ROOT, 'index.html')))
})

await new Promise((resolve, reject) => {
  server.listen(PORT, '127.0.0.1', resolve)
  server.on('error', reject)
})

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.stack ?? String(error)))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})

try {
  await page.goto(`http://127.0.0.1:${PORT}/`, {
    waitUntil: 'networkidle',
    timeout: 20_000,
  })
  await page.waitForFunction(() => (document.getElementById('root')?.innerHTML?.length ?? 0) > 0, {
    timeout: 10_000,
  })
  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length ?? 0)
  const titre = await page.title()

  if (errors.length > 0 || rootLen === 0 || !titre.includes('Dartpéro')) {
    console.error('Smoke test ÉCHOUÉ')
    console.error(JSON.stringify({ titre, rootLen, errors }, null, 2))
    process.exitCode = 1
  } else {
    console.log(`Smoke test OK — #root ${rootLen} octets, « ${titre} »`)
  }
} finally {
  await browser.close()
  server.close()
}
