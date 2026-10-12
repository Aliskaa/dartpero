import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { cheminNouvellePartie } from '@/ui/chemins'
import { Spinner } from '@/ui/composants/commun/Etats'
import { LayoutPrincipal } from '@/ui/composants/commun/LayoutPrincipal'
import { AccueilEcran } from '@/ui/ecrans/AccueilEcran'
import { useThemeSysteme } from '@/ui/hooks/useAppareil'
import { useDemandeStockageAuDemarrage } from '@/ui/hooks/useStockagePersistant'

// Seul `AccueilEcran` reste statique : `start_url` du manifeste, route par
// défaut ET fourre-tout `*` — le rendre lazy ajouterait une cascade sur le
// geste le plus fréquent de l'app, pour ~3 kB (voir 01-architecture.md).
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
// Les trois étapes de « Nouvelle partie » vivent derrière ce seul `lazy()` :
// ce sont des routes descendantes de `/nouvelle-partie/*`.
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
)

/**
 * Deux familles d'écrans :
 *
 * - ceux de **navigation**, qui partagent la barre du bas ;
 * - ceux de **partie** (configuration, match, résumé), en plein écran. Pendant
 *   une volée, chaque pixel sert à jouer et un onglet mal visé ferait perdre la
 *   saisie en cours.
 *
 * Le thème est posé ici, à la racine : `useThemeSysteme` rattrape le script
 * d'amorçage et reste branché sur le réglage du téléphone.
 */
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
      </Routes>
    </Suspense>
  )
}
