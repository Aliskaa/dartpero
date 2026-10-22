import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { createBrowserServices } from '@/composition/container'
import { ServicesProvider } from '@/ui/providers/ServicesProvider'

// Polices embarquées (hors ligne), sous-ensemble `latin` seulement.
import '@fontsource/alfa-slab-one/latin-400.css'
import '@fontsource/oswald/latin-500.css'
import '@fontsource/oswald/latin-700.css'
import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-600.css'

import App from './App'
import './index.css'

const racine = document.getElementById('root')
if (!racine) throw new Error('Élément #root introuvable dans index.html')

// Un déploiement purge le précache : un `import()` lazy peut échouer. On recharge une seule fois
// (garde-fou `sessionStorage` contre la boucle).
window.addEventListener('vite:preloadError', () => {
  const cle = 'dartpero:preload-error-reload'
  try {
    if (sessionStorage.getItem(cle)) return
    sessionStorage.setItem(cle, '1')
  } catch {
    // Navigation privée : sessionStorage peut lever à la lecture.
  }
  window.location.reload()
})

// Tout est local : rien à revalider au retour de l'onglet.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false },
  },
})

// ⚠️ Les services naissent ici, avant `createRoot` : dans le provider ils seraient trop tard (et doublés sous StrictMode).
const services = createBrowserServices()

createRoot(racine).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ServicesProvider services={services}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ServicesProvider>
    </QueryClientProvider>
  </StrictMode>,
)
