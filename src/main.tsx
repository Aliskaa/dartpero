import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { ServicesProvider } from '@/ui/providers/ServicesProvider'

// Polices embarquées (offline-first) — voir la charte dans CLAUDE.md.
// Sous-ensemble `latin` uniquement : l'app est en français, inutile de précacher
// le cyrillique et le vietnamien (÷ 3 sur le poids des polices).
import '@fontsource/alfa-slab-one/latin-400.css'
import '@fontsource/oswald/latin-500.css'
import '@fontsource/oswald/latin-700.css'
import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-600.css'

import App from './App'
import './index.css'

const racine = document.getElementById('root')
if (!racine) throw new Error('Élément #root introuvable dans index.html')

// Filet pour le découpage par route : un déploiement pendant qu'un onglet
// reste ouvert purge l'ancien précache workbox (SW `autoUpdate`), et le
// prochain `import()` vers un chunk lazy qui n'existe plus échoue. On
// recharge une seule fois — le garde-fou en `sessionStorage` évite de
// boucler si le rechargement retombe sur la même erreur.
window.addEventListener('vite:preloadError', () => {
  const cle = 'dartpero:preload-error-reload'
  try {
    if (sessionStorage.getItem(cle)) return
    sessionStorage.setItem(cle, '1')
  } catch {
    // Navigation privée sur certains navigateurs : sessionStorage peut lever
    // à la simple lecture. Le pire cas acceptable est une boucle de
    // rechargement, jamais l'absence totale de filet.
  }
  window.location.reload()
})

// Tout est local : rien à revalider au retour de l'onglet, aucune requête réseau.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false },
  },
})

createRoot(racine).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ServicesProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ServicesProvider>
    </QueryClientProvider>
  </StrictMode>,
)
