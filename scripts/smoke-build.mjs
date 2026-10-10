/**
 * Smoke test du bundle de production : sert `dist/`, ouvre la page d'accueil
 * puis la politique de confidentialité, échoue si le root reste vide, si une
 * erreur JS remonte ou si la page part chercher quoi que ce soit hors de
 * `dist/`.
 *
 * Trois temps :
 *
 * 1. **Avant Chromium**, des contrôles statiques sur le build lui-même —
 *    des propriétés qui ne se vérifient que sur `dist/` :
 *    - le manifeste garde l'identité des installations existantes (`id: '/'`)
 *      et porte ses captures, avec leurs vraies dimensions ;
 *    - le précache du service worker contient l'essentiel, et AUCUNE capture
 *      ni rien de `.well-known` ;
 *    - `.well-known/assetlinks.json` existe et contient un tableau JSON ;
 *    - aucune autre entrée cachée (nom en `.…`) ne traîne dans `dist/` ;
 *    - le repli de navigation du service worker exclut `/.well-known/`, et
 *      seulement lui (échec fermé si le `denylist` est absent ou illisible).
 * 2. **Chromium** : `/` puis `/confidentialite` en accès direct, sans erreur
 *    JS, et sans aucune requête hors du serveur local.
 * 3. **Garde de publication** : aucun `REMPLIR` ne doit rester dans `dist/`
 *    (les mentions légales à compléter dans `src/ui/labels.ts`). Elle passe
 *    APRÈS Chromium pour que le reste du smoke s'exécute quand même, et n'a
 *    volontairement aucun contournement.
 *
 * Usage : `npm run build && npm run smoke`
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, relative, sep } from 'node:path'
import { chromium } from 'playwright-core'

const PORT = 4179
const ORIGINE = `http://127.0.0.1:${PORT}`
const ROOT = join(process.cwd(), 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
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

/** Chemins de `dist/`, relatifs et en `/`, dossiers à point compris. */
const entreesDist = (dossier = ROOT) =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name)
    const relatif = relative(ROOT, chemin).split(sep).join('/')
    return entree.isDirectory()
      ? [{ relatif, dossier: true }, ...entreesDist(chemin)]
      : [{ relatif, dossier: false }]
  })

/** Largeur × hauteur d'un PNG, lues dans l'en-tête IHDR (octets 16-23, big-endian). */
const dimensionsPng = (fichier) => {
  const octets = readFileSync(fichier)
  const signature = '89504e470d0a1a0a'
  if (octets.length < 24 || octets.subarray(0, 8).toString('hex') !== signature) return null
  return `${octets.readUInt32BE(16)}x${octets.readUInt32BE(20)}`
}

/** Les seules entrées cachées admises dans `dist/` (Digital Asset Links). */
const ENTREES_CACHEES_PERMISES = new Set(['.well-known', '.well-known/assetlinks.json'])

/** Ce que le repli de navigation doit exclure, et ce qu'il ne doit jamais exclure. */
const URL_HORS_REPLI = '/.well-known/assetlinks.json'
const ROUTES_APP = ['/', '/confidentialite', '/reglages', '/partie/x']

/**
 * Lit les littéraux regex du `denylist:[…]` de la `NavigationRoute` de `sw.js`.
 * Rend `null` si le tableau est absent ou ne se lit pas : l'appelant échoue
 * alors fermé — un repli sans exclusion servirait `index.html` à la place
 * d'`assetlinks.json`.
 */
const lireDenylist = (sw) => {
  const route = sw.indexOf('NavigationRoute(')
  if (route === -1) return null
  const debut = sw.indexOf('denylist:[', route)
  if (debut === -1) return null
  const regexes = []
  let i = debut + 'denylist:['.length
  for (;;) {
    if (sw[i] === ']') return regexes
    if (sw[i] !== '/') return null
    // Corps de la regex : échappements et classes `[...]` (qui peuvent contenir `/`).
    let j = i + 1
    let classe = false
    let corps = ''
    for (; j < sw.length; j += 1) {
      const c = sw[j]
      if (c === '\\') {
        corps += c + sw[j + 1]
        j += 1
        continue
      }
      if (c === '[') classe = true
      else if (c === ']') classe = false
      else if (c === '/' && !classe) break
      else if (c === '\n') return null
      corps += c
    }
    if (j >= sw.length) return null
    j += 1
    let drapeaux = ''
    while (/[dgimsuvy]/.test(sw[j] ?? '')) drapeaux += sw[j++]
    try {
      regexes.push(new RegExp(corps, drapeaux))
    } catch {
      return null
    }
    if (sw[j] === ',') j += 1
    else if (sw[j] !== ']') return null
    i = j
  }
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

  // --- Digital Asset Links ---
  // Le type seul est vérifié, pas `[]` : le lot 4 (TWA) remplira le tableau.
  const cheminAssetlinks = join(ROOT, '.well-known', 'assetlinks.json')
  if (!existsSync(cheminAssetlinks)) {
    fautes.push('assetlinks : dist/.well-known/assetlinks.json absent (public/.well-known/ ?)')
  } else {
    try {
      const contenu = JSON.parse(readFileSync(cheminAssetlinks, 'utf8'))
      if (!Array.isArray(contenu)) fautes.push('assetlinks : le contenu n’est pas un tableau JSON')
    } catch {
      fautes.push('assetlinks : JSON illisible')
    }
  }

  // --- Entrées cachées : liste blanche ---
  // `firebase.json` n'exclut que les entrées à point autres que `.well-known` ;
  // le build ne doit rien produire d'autre de caché.
  const cachees = entreesDist()
    .map((entree) => entree.relatif)
    .filter((relatif) => relatif.split('/').some((segment) => segment.startsWith('.')))
    .filter((relatif) => !ENTREES_CACHEES_PERMISES.has(relatif))
  if (cachees.length > 0) fautes.push(`entrées cachées non permises : ${cachees.join(', ')}`)

  // --- Précache du service worker ---
  const sw = readFileSync(cheminSw, 'utf8')
  const urls = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1])
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
  const wellKnownPrecache = urls.filter((url) => url.includes('.well-known'))
  if (wellKnownPrecache.length > 0) {
    fautes.push(`précache : .well-known présent : ${wellKnownPrecache.join(', ')}`)
  }

  // --- Repli de navigation du service worker ---
  const denylist = lireDenylist(sw)
  if (denylist === null) {
    fautes.push(
      'service worker : aucun denylist lisible sur la NavigationRoute (navigateFallbackDenylist ?)',
    )
  } else {
    if (!denylist.some((regex) => regex.test(URL_HORS_REPLI)))
      fautes.push(`service worker : le denylist ne couvre pas ${URL_HORS_REPLI}`)
    const routesCouvertes = ROUTES_APP.filter((route) =>
      denylist.some((regex) => regex.test(route)),
    )
    if (routesCouvertes.length > 0)
      fautes.push(
        `service worker : le denylist couvre une route de l’app : ${routesCouvertes.join(', ')}`,
      )
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
  'Contrôles statiques OK — manifeste, précache (sans capture ni .well-known), assetlinks, entrées cachées, denylist du SW',
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

/**
 * Ouvre `chemin` dans un contexte vierge (sans service worker ni cache hérité :
 * c'est l'accès direct d'un visiteur), et relève erreurs JS et requêtes hors
 * du serveur local.
 */
const ouvrir = async (chemin) => {
  const contexte = await browser.newContext()
  const page = await contexte.newPage()
  const errors = []
  const externes = []
  page.on('pageerror', (error) => errors.push(error.stack ?? String(error)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('request', (requete) => {
    const url = requete.url()
    if (url.startsWith('data:') || url.startsWith('blob:')) return
    if (url !== ORIGINE && !url.startsWith(`${ORIGINE}/`)) externes.push(url)
  })
  await page.goto(`${ORIGINE}${chemin}`, { waitUntil: 'networkidle', timeout: 20_000 })
  return { contexte, page, errors, externes }
}

try {
  // --- Accueil ---
  const accueil = await ouvrir('/')
  try {
    await accueil.page.waitForFunction(
      () => (document.getElementById('root')?.innerHTML?.length ?? 0) > 0,
      { timeout: 10_000 },
    )
    const rootLen = await accueil.page.evaluate(
      () => document.getElementById('root')?.innerHTML?.length ?? 0,
    )
    const titre = await accueil.page.title()
    const { errors, externes } = accueil

    if (errors.length > 0 || externes.length > 0 || rootLen === 0 || !titre.includes('Dartpéro')) {
      console.error('Smoke test ÉCHOUÉ — /')
      console.error(JSON.stringify({ titre, rootLen, errors, requetesExternes: externes }, null, 2))
      process.exitCode = 1
    } else {
      console.log(
        `Smoke test OK — / : #root ${rootLen} octets, « ${titre} », aucune requête externe`,
      )
    }
  } finally {
    await accueil.contexte.close()
  }

  // --- Politique de confidentialité, en accès direct (réécriture SPA) ---
  const politique = await ouvrir('/confidentialite')
  try {
    const titreH1 = await politique.page
      .waitForFunction(
        () =>
          [...document.querySelectorAll('h1')].some((h1) =>
            (h1.textContent ?? '').includes('Confidentialité'),
          ),
        { timeout: 10_000 },
      )
      .then(() => true)
      .catch(() => false)
    const { errors, externes } = politique

    if (!titreH1 || errors.length > 0 || externes.length > 0) {
      console.error('Smoke test ÉCHOUÉ — /confidentialite')
      console.error(
        JSON.stringify({ h1Confidentialite: titreH1, errors, requetesExternes: externes }, null, 2),
      )
      process.exitCode = 1
    } else {
      console.log('Smoke test OK — /confidentialite en accès direct, aucune requête externe')
    }
  } finally {
    await politique.contexte.close()
  }
} finally {
  await browser.close()
  server.close()
}

// --- Garde de publication : les mentions légales à compléter ---
// `REMPLIR` en ASCII, sensible à la casse — pas « À REMPLIR », qu'un « À »
// échappé ou décomposé ferait rater. Aucun contournement, à dessein : tant
// qu'il en reste un, `npm run firebase:deploy` s'arrête ici.
const MARQUEUR = 'REMPLIR'
const TEMOIN = 'Mentions légales'
const textes = entreesDist()
  .filter((entree) => !entree.dossier)
  .map((entree) => ({ relatif: entree.relatif, octets: readFileSync(join(ROOT, entree.relatif)) }))
  // Non binaire = sans octet nul (PNG, polices… en ont toujours).
  .filter(({ octets }) => !octets.includes(0))
  .map(({ relatif, octets }) => ({ relatif, texte: octets.toString('utf8') }))

const fautesPublication = []
// Plancher : un parcours cassé rendrait la garde verte à vide.
const lus = textes.map(({ relatif }) => relatif)
if (lus.length < 10 || !lus.includes('index.html') || !lus.some((r) => /^assets\/.+\.js$/.test(r)))
  fautesPublication.push(
    `scanner aveugle : ${lus.length} fichiers texte lus (attendu ≥ 10, dont index.html et un assets/*.js)`,
  )
if (!textes.some(({ texte }) => texte.includes(TEMOIN)))
  fautesPublication.push(`scanner aveugle : le témoin « ${TEMOIN} » est introuvable dans dist/`)
for (const { relatif, texte } of textes) {
  const occurrences = texte.split(MARQUEUR).length - 1
  if (occurrences > 0)
    fautesPublication.push(`${relatif} : ${occurrences} « ${MARQUEUR} » (voir src/ui/labels.ts)`)
}

if (fautesPublication.length > 0) {
  console.error('Smoke test ÉCHOUÉ — garde de publication : dist/ ne peut pas partir en ligne')
  for (const faute of fautesPublication) console.error(`  - ${faute}`)
  process.exitCode = 1
} else {
  console.log(`Garde de publication OK — aucun « ${MARQUEUR} » dans ${lus.length} fichiers texte`)
}
