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
          name: 'Dartpéro',
          short_name: 'Dartpéro',
          description: 'Compteur de parties de fléchettes — X01, checkouts et stats.',
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
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        },
      }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router', '@tanstack/react-query'],
      alias,
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
