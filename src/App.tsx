import { Route, Routes } from 'react-router'
import { LayoutPrincipal } from '@/ui/composants/commun/LayoutPrincipal'
import { AccueilEcran } from '@/ui/ecrans/AccueilEcran'
import { HistoriqueEcran } from '@/ui/ecrans/HistoriqueEcran'
import { JoueursEcran } from '@/ui/ecrans/JoueursEcran'
import { NouvellePartieEcran } from '@/ui/ecrans/NouvellePartieEcran'
import { PartieEcran, ResumePartieEcran } from '@/ui/ecrans/PartieEcran'
import { ReglagesEcran } from '@/ui/ecrans/ReglagesEcran'
import { StatistiquesEcran } from '@/ui/ecrans/StatistiquesEcran'

/**
 * Deux familles d'écrans :
 *
 * - ceux de **navigation**, qui partagent la barre du bas ;
 * - ceux de **partie** (configuration, match, résumé), en plein écran. Pendant
 *   une volée, chaque pixel sert à jouer et un onglet mal visé ferait perdre la
 *   saisie en cours.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<LayoutPrincipal />}>
        <Route path="/" element={<AccueilEcran />} />
        <Route path="/joueurs" element={<JoueursEcran />} />
        <Route path="/statistiques" element={<StatistiquesEcran />} />
        <Route path="/historique" element={<HistoriqueEcran />} />
        <Route path="/reglages" element={<ReglagesEcran />} />
        <Route path="*" element={<AccueilEcran />} />
      </Route>

      <Route path="/nouvelle-partie" element={<NouvellePartieEcran />} />
      {/* Une seule URL par partie : c'est son mode qui décide de l'écran. */}
      <Route path="/partie/:matchId" element={<PartieEcran />} />
      <Route path="/partie/:matchId/resume" element={<ResumePartieEcran />} />
    </Routes>
  )
}
