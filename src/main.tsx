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
