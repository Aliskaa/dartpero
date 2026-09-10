# Lot `bundle-par-route` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev`.

## Ce qui a été implémenté

- **`src/App.tsx`** — 8 des 9 routes passées en `lazy()` (`JoueursEcran`, `StatistiquesEcran`,
  `HistoriqueEcran`, `ReglagesEcran`, `NouvellePartieEcran`, `LancerEntrainementEcran`,
  `PartieEcran`, `ResumePartieEcran`), toutes déclarées au niveau module avec la forme
  `lazy(() => import('...').then((m) => ({ default: m.X })))` requise par l'export nommé des
  écrans. `AccueilEcran` reste statique, avec un commentaire qui explique pourquoi (`start_url`
  + route par défaut + fourre-tout `*`). `<Routes>` enveloppé dans
  `<Suspense fallback={<Spinner />}>`.
- **`src/ui/ecrans/games/PartieEcran.tsx`** — les 8 écrans de mode (X01/Tour du monde/
  Cricket/Entraînement, jeu + résumé) passés en `lazy()` au niveau module, même forme.
  `Aiguillage` enveloppe son rendu dans `<Suspense fallback={<SpinnerLigne />}>`.
- **`src/ui/composants/commun/LayoutPrincipal.tsx`** — `<Outlet />` enveloppé dans
  `<Suspense fallback={<SpinnerLigne />}>` (pas `Spinner`, pour ne pas faire sauter
  `NavigationBasse`).
- **`vite.config.ts`** — groupe vendor via `build.rollupOptions.output.codeSplitting.groups`
  (API Rolldown de Vite 8, pas `manualChunks` qui y est déprécié), avec un commentaire qui
  explique le choix.
- **`src/main.tsx`** — écouteur `vite:preloadError` ajouté : rechargement unique garanti par
  une clé `sessionStorage` (`dartpero:preload-error-reload`), commenté sur le risque qu'il
  couvre (chunk disparu après déploiement sous SW `autoUpdate`).

Aucun changement dans `core/`, `application/`, `infrastructure/`, `composition/`,
`firebase.json` — conforme au périmètre.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Un **troisième** `<Suspense>` a été ajouté, dans `Aiguillage` (`src/ui/ecrans/games/PartieEcran.tsx`), en plus des deux prévus (`App.tsx`, `LayoutPrincipal.tsx`) | Ajustement | Relevé par la Revue (2ᵉ passage, constat 4) — initialement documenté à tort comme « aucun écart ». `01-architecture.md` ne l'interdisait pas explicitement (« aucune restructuration de l'aiguilleur », pas « aucun `Suspense` supplémentaire ») ; sans lui, la suspension des écrans de mode serait remontée jusqu'au `Suspense` d'`App.tsx`, avec le même fallback plein écran que le chargement de `PartieEcran` lui-même. Effet secondaire assumé : c'est ce qui produit la séquence à 3 fallbacks du cas n°9 de `03-plan-de-test.md`, avec un saut visuel entre le `Spinner` plein écran et le `SpinnerLigne` compact — cosmétique, non corrigé (voir points non résolus de `00-orchestration.md`). |
| Options B + C conservées telles quelles par ailleurs | — | Le groupe vendor n'a rien cassé au smoke test (Q3 résolue favorablement, pas de repli nécessaire). |

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | Vert — 198 fichiers, 0 erreur (revérifié indépendamment par l'Orchestrator) |
| `npm run typecheck` | Vert (revérifié indépendamment par l'Orchestrator) |
| `npm test` | Vert — **334/334 tests, 32 fichiers** (revérifié indépendamment par l'Orchestrator) |
| `npm run build` | Vert — avertissement Vite `>500 kB` **disparu** |
| `npm run smoke` | Vert avec le groupe vendor actif — pas de retour du bug « deux React » |

`git status`/`git diff --stat` revérifiés par l'Orchestrator après coup : exactement les 5
fichiers attendus (`src/App.tsx`, `src/main.tsx`,
`src/ui/composants/commun/LayoutPrincipal.tsx`, `src/ui/ecrans/games/PartieEcran.tsx`,
`vite.config.ts`), 127 insertions / 42 suppressions, aucun fichier hors périmètre touché.

### Q1 — vérifié en premier, avant de dérouler les 16 `lazy()`

Une route (`JoueursEcran`) passée en lazy seule → `npx vitest run tests/ui` → 9 fichiers / 89
tests verts. Le pool `vmForks` du projet supporte les imports dynamiques sans blocage —
aucune escalade nécessaire.

### Q2 — table des chunks, avant / après

**Avant** (baseline, chunk unique) :

| Fichier | kB minifié | kB gzip |
|---|---|---|
| `index-*.js` | 515,00 | 154,28 |

Avertissement Vite natif présent (*« Some chunks are larger than 500 kB after minification »*).

**Après** (27 chunks JS dans `dist/assets/`, extrait — liste complète dans le rapport `dev`) :

| Chunk | kB min | kB gzip |
|---|---|---|
| `vendor-*.js` | 362,63 | 116,03 |
| `index-*.js` (shell + `src/core` + composition) | 61,06 | 17,98 |
| `X01Ecran-*.js` | 12,21 | 4,40 |
| `CricketEcran-*.js` | 10,95 | 4,16 |
| `NouvellePartieEcran-*.js` | 10,85 | 3,90 |
| `TourDuMondeEcran-*.js` | 8,78 | 3,35 |
| … 20 autres chunks, chacun < 6,1 kB min | — | — |

Chunk d'entrée : **515 kB → 61 kB minifié** (÷ 8,4), **154 kB → 18 kB gzip**. Le vendor
(362 kB — React, React Router, TanStack Query, Dexie) est isolé dans un chunk qui ne bougera
qu'aux montées de version, pas à chaque libellé changé dans `labels.ts`. Objectif du lot
démontré par la mesure, pas seulement par le code.

### Q3 — groupe vendor

`npm run smoke` vert avec le groupe actif : pas de conflit avec les alias anti-« deux React »
du build. Option C conservée, aucun repli sur B seul nécessaire.

### Q8 — manifeste `dist/sw.js`, invariant hors ligne

Les 27 chunks `assets/*.js` figurent tous dans le précache workbox (vérifié par script côté
`dev`, 0 manquant) — 47 entrées précachées, 771,56 KiB au total. L'invariant tient au niveau du
manifeste ; la relecture visuelle réelle (`npm run preview` + DevTools hors ligne) reste à
faire par Test, comme prévu dans `01-architecture.md`.

### Q10 — doublons `includeAssets`/`globPatterns`

Constatés en passant (`favicon.svg`, `apple-touch-icon.png` chacun 2 fois dans `dist/sw.js`),
**non corrigés** — confirmé hors périmètre, candidat séparé de l'audit.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Q6 (01-architecture.md) : les 9 fichiers de tests UI passent sans modification — vérifié par Dev, à revérifier indépendamment par Test selon son propre plan. | Test |
| 2 | Q7 (01-architecture.md) : le test d'architecture garde (imports statiques interdits dans `App.tsx`/`PartieEcran.tsx`, plancher `lazy()` ≥ 8 par fichier) n'a pas été écrit par Dev — assigné explicitement à Test. | Test |
| 3 | Q8/Q9 (01-architecture.md) : relecture à l'écran (`npm run preview`, DevTools hors ligne) sur les 4 modes + statistiques + historique, y compris un mode jamais visité, et vérification visuelle du fallback (pas de saut de layout, pas de double état de chargement) — pas faite par Dev. | Test |
| 4 | Les 3 notes à graver dans `CLAUDE.md`/`CONVENTIONS.md` (§ « À graver à la fin du lot » de `01-architecture.md`) n'ont pas été ajoutées par Dev — à faire par l'Orchestrator avant la proposition de commit, pas une question bloquante. | Orchestrator |

## Limites connues et TODO assumés

- Le rechargement automatique sur `vite:preloadError` n'a pas pu être testé en conditions
  réelles de déploiement (nécessiterait deux versions de build servies successivement) —
  implémenté selon la forme standard recommandée par Vite, vérifié par lecture du code
  uniquement (relu et confirmé conforme par l'Orchestrator).
