import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const srcAlias = fileURLToPath(new URL('./src', import.meta.url))

// `npm run dev`        → http://localhost:5173 (localhost est un contexte sécurisé :
//                        Wake Lock, vibration et PWA y fonctionnent déjà).
// `npm run dev:mobile` → https://<IP-PC>:5173, requis pour tester depuis le téléphone
//                        sur le même WiFi (certificat auto-signé à accepter).
export default defineConfig(({ mode, command }) => {
  const mobile = mode === 'mobile'

  // Alias absolus : uniquement au `vite build`. En test / dev ils recréent
  // le bug (deux React) qu'ils corrigent dans le bundle Rolldown.
  const alias: Record<string, string> = { '@': srcAlias }
  if (command === 'build') {
    alias.react = fileURLToPath(new URL('./node_modules/react', import.meta.url))
    alias['react-dom'] = fileURLToPath(new URL('./node_modules/react-dom', import.meta.url))
    alias['react/jsx-runtime'] = fileURLToPath(
      new URL('./node_modules/react/jsx-runtime.js', import.meta.url),
    )
    alias['react/jsx-dev-runtime'] = fileURLToPath(
      new URL('./node_modules/react/jsx-dev-runtime.js', import.meta.url),
    )
    alias['react-router'] = fileURLToPath(
      new URL('./node_modules/react-router/dist/production/index.js', import.meta.url),
    )
    alias['@tanstack/react-query'] = fileURLToPath(
      new URL('./node_modules/@tanstack/react-query/build/modern/index.js', import.meta.url),
    )
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(mobile ? [basicSsl()] : []),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          // ⚠️ NE JAMAIS CHANGER. C'est l'identité des installations existantes :
          // sans `id`, le navigateur la calculait depuis `start_url` résolu
          // (`https://dartpero.web.app/`), et `'/'` la reproduit à l'identique.
          // Toute autre valeur ferait apparaître une seconde icône.
          id: '/',
          name: 'Dartpéro',
          short_name: 'Dartpéro',
          description:
            'Compteur de fléchettes entre potes — X01, Tour du monde, Cricket et entraînement au checkout. Hors ligne, sans compte.',
          lang: 'fr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          // ⚠️ PAS 'portrait' : une PWA installée obéit au manifeste, la
          // rotation y était donc purement et simplement ignorée. Les écrans
          // de partie ont une vraie disposition paysage (variante `paysage`
          // dans `index.css`) ; il n'existe aucun moyen de n'ouvrir
          // l'orientation que sur certaines routes.
          orientation: 'any',
          background_color: '#0E1A13',
          theme_color: '#0E1A13',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          categories: ['games', 'sports', 'entertainment'],
          // Appui long sur l'icône (Android). L'icône 192 est réutilisée :
          // ≥ 96 px, et déjà précachée.
          shortcuts: [
            {
              name: 'Nouvelle partie',
              url: '/nouvelle-partie',
              icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
          // Copies à l'identique de `docs/captures/` : à recopier si elles sont
          // refaites (`sizes` = dimensions réelles, contrôlées par `npm run smoke`).
          screenshots: [
            {
              src: 'screenshots/accueil.png',
              sizes: '780x1688',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'L’accueil : la partie en cours se reprend d’un doigt',
            },
            {
              src: 'screenshots/partie-x01.png',
              sizes: '780x1688',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Une partie de X01 : le tableau lu de loin, la saisie fléchette par fléchette',
            },
            {
              src: 'screenshots/paysage.png',
              sizes: '1000x462',
              type: 'image/png',
              form_factor: 'wide',
              label: 'En paysage, le tableau et la saisie côte à côte',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // Les captures ne servent qu'à la fenêtre d'installation, en ligne :
          // hors précache (≈ 425 ko de moins hors ligne). `**/*.png` les
          // prendrait sinon — vite-plugin-pwa ne pose aucun `globIgnores` par
          // défaut, d'où le premier motif, repris de workbox-build.
          globIgnores: ['**/node_modules/**/*', 'screenshots/**'],
          // ⚠️ `/.well-known/` (Digital Asset Links) doit toujours venir du
          // réseau : sans cette exclusion, le repli de navigation servirait
          // `index.html` à sa place. Le fichier n'est jamais précaché non plus
          // (`json` hors `globPatterns`, glob sans `dot`) — `npm run smoke`
          // vérifie les deux sur `dist/sw.js`.
          navigateFallbackDenylist: [/^\/\.well-known\//],
        },
      }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router', '@tanstack/react-query'],
      alias,
    },
    build: {
      rollupOptions: {
        output: {
          // API Rolldown de Vite 8 : `manualChunks`/`advancedChunks` sont
          // dépréciés. Isole ~350-400 kB de `node_modules` qui ne bougent
          // qu'aux montées de version, hors du hash de chaque déploiement.
          codeSplitting: { groups: [{ name: 'vendor', test: /node_modules/ }] },
        },
      },
    },
    server: {
      host: mobile,
      port: 5173,
    },
    test: {
      // `threads` (défaut) casse la collecte des suites sous Vite 8 / Windows :
      // describe lit `runner.config` alors que le runner n'est pas injecté.
      // `vmForks` isole correctement chaque fichier.
      pool: 'vmForks',
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
      css: true,
    },
  }
})
