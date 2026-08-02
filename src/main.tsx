import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

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

createRoot(racine).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
