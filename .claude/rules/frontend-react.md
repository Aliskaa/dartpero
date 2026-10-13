# Frontend React

**Quand :** `src/ui/`. Charte complète : `docs/CHARTE_GRAPHIQUE.md`.
Patterns : `CONVENTIONS` § 9 et § 10.

## Structure

- `ecrans/` : un écran par route ; `ecrans/games/` suit le découpage du
  domaine (un dossier par mode, `PartieEcran` aiguille) ;
  `ecrans/nouvelle-partie/` : le parcours en étapes, **une route par
  étape** (URL dans `chemins.ts`) — jamais un état interne, sinon le
  retour du téléphone quitte le parcours.
- `composants/commun/` : le design system — réutiliser, ne jamais
  dupliquer une variante ad hoc.
- `composants/<mode>/` : ce qui est propre à un mode.
- `hooks/` : un hook par mode (`useX01`…), `useJoueurs`, `useAppareil`, `useStockagePersistant`, `useInstallation`, `useNouvellePartie`, `useNomDePartie`.
- `labels.ts` : **tout** le français affiché, annonces vocales comprises.
  À l'écran on dit **« manche »**, jamais « leg » (les identifiants du
  code gardent `leg`).

## Travail

- **L'UI appelle les use cases**, fournis par `useServices()`. Jamais
  Dexie, jamais une règle de jeu réimplémentée : pour anticiper, un port
  de prévisualisation (`PreviewVisit`…).
- **L'heure courante** passe par `services.clock`, jamais `Date.now()`
  ni `new Date()` sans argument (garde `horlogeBoundary`) ; `Date` ne
  sert que de calendrier sur un horodatage donné.
- **Le match en cours** = état local synchrone, porté par le hook du
  mode. TanStack Query sert l'historique, les profils, les stats — en
  cache (`CONVENTIONS` § 10).
- **Routes lazy** : un écran ne se réimporte jamais statiquement dans
  `App.tsx` ou `PartieEcran.tsx` (sauf `AccueilEcran`) —
  `tests/architecture/lazyRoutes.test.ts`.
- **Lisibilité à 2-3 m** en zone de lecture, cibles **≥ 48 px** en zone
  de saisie, jamais empilées en paysage (`DispositionPartie`).
- Angle vif : aucune classe `rounded-*`. Couleurs :
  [theme-colors.md](./theme-colors.md).
- Icônes `lucide-react` toujours `aria-hidden` ; un chiffre qui change
  vit dans un `<output aria-label>`.
- Un ratio sans occasion s'affiche `—`, jamais « 0 % » (`pourcent`).
- Animations : `prefers-reduced-motion` respecté.
- Changement de comportement : test Testing Library + Vitest. Changement
  de rendu : **relecture à l'écran** en plus — portrait et paysage,
  thème sombre et clair.
