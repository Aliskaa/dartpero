/**
 * Smoke test du bundle de production : sert `dist/`, ouvre la page d'accueil,
 * échoue si le root reste vide ou si une erreur JS remonte.
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
