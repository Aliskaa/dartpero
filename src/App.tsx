import { Route, Routes } from 'react-router'
import { LayoutPrincipal } from '@/ui/composants/commun/LayoutPrincipal'
import { AccueilEcran } from '@/ui/ecrans/AccueilEcran'
import { HistoriqueEcran } from '@/ui/ecrans/HistoriqueEcran'
import { JoueursEcran } from '@/ui/ecrans/JoueursEcran'
import { MatchEcran } from '@/ui/ecrans/MatchEcran'
import { NouvellePartieEcran } from '@/ui/ecrans/NouvellePartieEcran'
import { ReglagesEcran } from '@/ui/ecrans/ReglagesEcran'
import { ResumeEcran } from '@/ui/ecrans/ResumeEcran'
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
      <Route path="/partie/:matchId" element={<MatchEcran />} />
      <Route path="/partie/:matchId/resume" element={<ResumeEcran />} />
    </Routes>
  )
}
