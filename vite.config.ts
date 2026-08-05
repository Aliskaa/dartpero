import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// `npm run dev`        → http://localhost:5173 (localhost est un contexte sécurisé :
//                        Wake Lock, vibration et PWA y fonctionnent déjà).
// `npm run dev:mobile` → https://<IP-PC>:5173, requis pour tester depuis le téléphone
//                        sur le même WiFi (certificat auto-signé à accepter).
export default defineConfig(({ mode }) => {
  const mobile = mode === 'mobile'

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
      // Deux pièges Rolldown / package exports qui noircissent l'écran en prod :
      // 1. deux copies de React → `useMemo` sur dispatcher null ;
      // 2. react-router@7 résout `dist/development` même en build, et le chunk
      //    est embarqué deux fois → deux NavigationContext → « useLocation()
      //    may be used only in the context of a <Router> ».
      dedupe: ['react', 'react-dom', 'react-router', '@tanstack/react-query'],
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        react: fileURLToPath(new URL('./node_modules/react', import.meta.url)),
        'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url)),
        'react/jsx-runtime': fileURLToPath(
          new URL('./node_modules/react/jsx-runtime.js', import.meta.url),
        ),
        'react/jsx-dev-runtime': fileURLToPath(
          new URL('./node_modules/react/jsx-dev-runtime.js', import.meta.url),
        ),
        'react-router': fileURLToPath(
          new URL(
            mode === 'production'
              ? './node_modules/react-router/dist/production/index.mjs'
              : './node_modules/react-router/dist/development/index.mjs',
            import.meta.url,
          ),
        ),
        '@tanstack/react-query': fileURLToPath(
          new URL('./node_modules/@tanstack/react-query/build/modern/index.js', import.meta.url),
        ),
      },
    },
    server: {
      host: mobile,
      port: 5173,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
      css: true,
    },
  }
})
