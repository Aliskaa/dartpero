import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { CHEMIN_MIROIR, CHEMIN_PARTAGE, cheminNouvellePartie } from '@/ui/chemins'
import { Spinner } from '@/ui/composants/commun/Etats'
import { LayoutPrincipal } from '@/ui/composants/commun/LayoutPrincipal'
import { AccueilEcran } from '@/ui/ecrans/AccueilEcran'
import { useThemeSysteme } from '@/ui/hooks/useAppareil'
import { useDemandeStockageAuDemarrage } from '@/ui/hooks/useStockagePersistant'

// Seul `AccueilEcran` reste statique : `start_url`, route par défaut et `*` (lazy = cascade inutile).
const JoueursEcran = lazy(() =>
  import('@/ui/ecrans/JoueursEcran').then((m) => ({ default: m.JoueursEcran })),
)
const StatistiquesEcran = lazy(() =>
  import('@/ui/ecrans/StatistiquesEcran').then((m) => ({ default: m.StatistiquesEcran })),
)
const HistoriqueEcran = lazy(() =>
  import('@/ui/ecrans/HistoriqueEcran').then((m) => ({ default: m.HistoriqueEcran })),
)
const ReglagesEcran = lazy(() =>
  import('@/ui/ecrans/ReglagesEcran').then((m) => ({ default: m.ReglagesEcran })),
)
const ConfidentialiteEcran = lazy(() =>
  import('@/ui/ecrans/ConfidentialiteEcran').then((m) => ({ default: m.ConfidentialiteEcran })),
)
// Les étapes de « Nouvelle partie » vivent derrière ce seul `lazy()` (routes `/nouvelle-partie/*`).
const NouvellePartieEcran = lazy(() =>
  import('@/ui/ecrans/nouvelle-partie/NouvellePartieEcran').then((m) => ({
    default: m.NouvellePartieEcran,
  })),
)
const PartieEcran = lazy(() =>
  import('@/ui/ecrans/games/PartieEcran').then((m) => ({ default: m.PartieEcran })),
)
const ResumePartieEcran = lazy(() =>
  import('@/ui/ecrans/games/PartieEcran').then((m) => ({ default: m.ResumePartieEcran })),
) // Écran miroir : deux écrans pleins, hors de la barre du bas.
const PartageEcran = lazy(() =>
  import('@/ui/ecrans/miroir/PartageEcran').then((m) => ({ default: m.PartageEcran })),
)
const MiroirEcran = lazy(() =>
  import('@/ui/ecrans/miroir/MiroirEcran').then((m) => ({ default: m.MiroirEcran })),
)

/** Écrans de navigation (barre du bas) et écrans de partie en plein écran ; le thème est posé ici, à la racine. */
export default function App() {
  useThemeSysteme()
  useDemandeStockageAuDemarrage()

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<LayoutPrincipal />}>
          <Route path="/" element={<AccueilEcran />} />
          <Route path="/joueurs" element={<JoueursEcran />} />
          <Route path="/statistiques" element={<StatistiquesEcran />} />
          <Route path="/historique" element={<HistoriqueEcran />} />
          <Route path="/reglages" element={<ReglagesEcran />} />
          {/* URL publique de la politique (Play Console) : sous la barre de navigation. */}
          <Route path="/confidentialite" element={<ConfidentialiteEcran />} />
          <Route path="*" element={<AccueilEcran />} />
        </Route>

        <Route path="/nouvelle-partie/*" element={<NouvellePartieEcran />} />
        {/* L'ancien écran de lancement de l'entraînement : un lien profond vers
            lui mène désormais à la carte Entraînement du parcours. */}
        <Route
          path="/entrainement"
          element={<Navigate to={cheminNouvellePartie('CHECKOUT_PRACTICE')} replace />}
        />
        {/* Une seule URL par partie : c'est son mode qui décide de l'écran. */}
        <Route path="/partie/:matchId" element={<PartieEcran />} />
        <Route path="/partie/:matchId/resume" element={<ResumePartieEcran />} />
        <Route path={CHEMIN_PARTAGE} element={<PartageEcran />} />
        <Route path={CHEMIN_MIROIR} element={<MiroirEcran />} />
      </Routes>
    </Suspense>
  )
}
