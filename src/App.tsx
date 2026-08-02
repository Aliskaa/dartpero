import { Route, Routes } from 'react-router'
import { AccueilEcran } from '@/ui/ecrans/AccueilEcran'
import { MatchEcran } from '@/ui/ecrans/MatchEcran'
import { NouvellePartieEcran } from '@/ui/ecrans/NouvellePartieEcran'
import { ResumeEcran } from '@/ui/ecrans/ResumeEcran'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AccueilEcran />} />
      <Route path="/nouvelle-partie" element={<NouvellePartieEcran />} />
      <Route path="/partie/:matchId" element={<MatchEcran />} />
      <Route path="/partie/:matchId/resume" element={<ResumeEcran />} />
      <Route path="*" element={<AccueilEcran />} />
    </Routes>
  )
}
