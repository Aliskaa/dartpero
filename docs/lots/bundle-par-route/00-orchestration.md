# Lot `bundle-par-route` — orchestration

## Objectif

Découper le bundle unique en chargement par route, pour que le premier chargement de l'app
n'embarque pas systématiquement les quatre modes de jeu (X01, Tour du monde, Cricket,
entraînement) et les écrans de consultation (historique, statistiques, réglages).

**Le défaut** : `src/App.tsx:1-43` importe tous les écrans en statique — aucun `lazy()` ni
`import()` dynamique dans `src/` — et `vite.config.ts` ne définit aucun `manualChunks`. Le
build produit un **chunk unique de 514,89 kB minifié / 154,33 kB gzip**, au-delà du seuil
d'avertissement natif de Vite (500 kB).

**Ce que ça coûte** : premier chargement plus lourd qu'utile pour un cadrage qui valorise
« zéro friction au démarrage » (`CLAUDE.md`, contexte d'usage). Effet de bord documenté sur le
cache Firebase (`CLAUDE.md` § Déploiement) : le nom de fichier étant un hash du bundle entier,
**tout** déploiement — même d'un seul écran — invalide et refait retélécharger les 514 kB en
entier pour chaque visiteur, y compris ceux qui ne rejouent jamais telle ou telle partie.

**Périmètre attendu** (à confirmer/affiner par Archi) : passer les écrans de jeu — a minima
les quatre modes — en `React.lazy()` / `import()` dynamique dans le routage
(`src/App.tsx`), et vérifier l'effet sur :
- le précache workbox (`vite-plugin-pwa`, `globPatterns` dans `vite.config.ts`) ;
- le cache Firebase `immutable` sur `/assets/**` (`CLAUDE.md` § Déploiement) — les nouveaux
  chunks doivent rester des noms hachés par Vite pour bénéficier du même cache long.

**Hors périmètre :** aucun changement de règle de jeu, aucun changement de comportement
fonctionnel. Pas de `manualChunks` manuel sophistiqué si le découpage par route suffit à faire
passer le chunk principal sous le seuil d'avertissement — à trancher par Archi. Le constat 7·3
de l'audit (doublons dans `includeAssets`/`globPatterns`) reste un défaut séparé, pas traité
ici sauf si Archi juge qu'il faut le toucher pour vérifier le précache.

**Source :** `docs/audits/2026-09-10.md`, lot candidat 6 (« Découper le bundle par route »),
type Amélioration, sévérité moyenne, taille moyenne, dimension perf.

## Statut

| Phase | Statut | Fichier |
|---|---|---|
| Architecture | Faite | `01-architecture.md` |
| Dev | Faite | `02-dev-notes.md` |
| Test | Faite | `03-plan-de-test.md` |
| Revue | Faite | `04-revue.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite*.
Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| — | — | — | — |

## Journal des décisions

| Date | Décision | Raison |
|---|---|---|
| 2026-09-10 | Lot choisi : candidat 6 de `docs/audits/2026-09-10.md` (« Découper le bundle par route »), désigné explicitement en argument de `/orchestrate`. Identifiant retenu : `bundle-par-route`. | Demande explicite de l'utilisateur (`/orchestrate @docs/audits/2026-09-10.md 6`) — pas de choix à arbitrer parmi les 7 candidats. |
| 2026-09-10 | Lot classé « standard » (pas de montée en gamme opus pour Dev/Test) : il touche le routage (`src/App.tsx`) et la config de build, ni `src/core/domain/`, ni la couture `GameMode`, ni une règle de jeu de `CLAUDE.md`. | Critère explicite de la skill `/orchestrate` § « Monter en gamme pour un lot difficile » — aucun des trois déclencheurs ne s'applique ici. |
| 2026-09-10 | Architecture (`archi`, opus/max, défaut) : approche retenue B + C — `React.lazy()` sur les 8 routes de `App.tsx` (hors `AccueilEcran`) et sur les 8 écrans de mode de `PartieEcran.tsx`, combiné à un groupe vendor (`build.rollupOptions.output.codeSplitting.groups`, API Rolldown de Vite 8 — `manualChunks` est déprécié). Fallbacks : composants `Spinner`/`SpinnerLigne` déjà existants, aucun composant nouveau. Écouteur `vite:preloadError` ajouté dans `src/main.tsx` pour couvrir le risque de chunk disparu après déploiement sous SW `autoUpdate`. | Le critère du Goal (« vendor splitting seulement si le découpage par route ne suffit pas ») mesurait l'avertissement Vite, pas le vrai défaut (retéléchargement intégral à chaque déploiement) — écarté par Archi, confirmé par l'Orchestrator. |
| 2026-09-10 | Gate check Architecture : 10 questions, aucune bloquante — toutes résolues par l'Orchestrator sans recours à l'utilisateur (voir tableau dans `01-architecture.md`). Notables : l'écouteur `vite:preloadError` retenu dans le périmètre (conséquence directe et nécessaire du découpage sous SW `autoUpdate`, invariant hors-ligne de `CLAUDE.md`) ; le doublon `includeAssets`/`globPatterns` (candidat 7 de l'audit) confirmé hors périmètre s'il est croisé en route. Statut Architecture → Faite. | Toutes évidentes au vu du rapport `archi` — questions techniques tranchables sur pièces, pas des choix de produit. |
| 2026-09-10 | Arrêt n°1 (Archi → Dev) validé par l'utilisateur : « Go — lancer Dev ». Phase Dev lancée avec les réglages par défaut (sonnet/medium/maxTurns 60). | Lot standard (§ décision ci-dessus) — aucun critère de montée en gamme. |
| 2026-09-10 | Dev livré sans écart : plan de `01-architecture.md` suivi trait pour trait (options B+C conservées, groupe vendor sans repli nécessaire). Diff conforme — exactement les 5 fichiers attendus (`App.tsx`, `main.tsx`, `LayoutPrincipal.tsx`, `PartieEcran.tsx`, `vite.config.ts`), 127 insertions/42 suppressions. Chunk d'entrée 515 kB → 61 kB minifié (÷8,4), avertissement Vite `>500 kB` disparu. Revérifié directement par l'Orchestrator, pas seulement pris sur la foi du rapport : `git status`/`git diff --stat`, relecture des 3 fichiers clés (`App.tsx`, `main.tsx`, `vite.config.ts`), et `npm run lint`/`npm run typecheck`/`npm test` (334/334) relancés indépendamment. | La mémoire « commit à la fin de chaque lot » et le précédent du lot `pourcentage-doubles-tiret` exigent une vérification indépendante, pas seulement la foi du rapport du sous-agent. |
| 2026-09-10 | Gate check Dev : 4 questions produites (3 assignées à Test — garde d'architecture Q7, relecture à l'écran Q8/Q9, revérification Q6 — et 1 assignée à l'Orchestrator — graver les 3 notes dans `CLAUDE.md`/`CONVENTIONS.md` avant le commit). Aucune bloquante : ce sont des directives d'exécution pour la phase suivante, pas des choix en attente. Statut Dev → Faite, phase Test lancée avec les réglages par défaut (sonnet/high). | Rien ne nécessitait l'utilisateur — assignations déjà écrites dans `01-architecture.md` au gate check précédent. |
| 2026-09-10 | Test a livré : garde d'architecture `tests/architecture/lazyRoutes.test.ts` (5 cas, mutation-testée — preuve qu'elle échoue si un import statique revient), vérification du manifeste `dist/sw.js` (47 entrées précache, 27 chunks, 0 manquant), et relecture à l'écran pilotée par `playwright-core` : pas de saut de la barre de navigation, pas de double état de chargement, et **invariant hors ligne vérifié en conditions réelles** (SW actif, réseau coupé, 3 modes jamais ouverts avant la coupure restent jouables). 339/339 tests verts. Un incident de méthode signalé par Test lui-même (`git checkout --` a temporairement écrasé le patch non commité de Dev pendant la mutation, rattrapé par une sauvegarde manuelle) — **revérifié directement par l'Orchestrator après coup** : `git status`/`git diff --stat` identique à la mesure prise après Dev (mêmes 5 fichiers, 127/42), lecture de `App.tsx`, `npm test` relancé indépendamment (339/339). Aucune perte. | La mémoire « commit à la fin de chaque lot » exige une vérification indépendante — d'autant plus after un incident signalé par la phase elle-même, pas seulement pris sur sa parole. |
| 2026-09-10 | Gate check Test : aucune question ouverte restante (Q6-Q9 toutes traitées avec résultat écrit dans `03-plan-de-test.md`). Seul point non bloquant : le compte exact des doublons de précache (5 paires, pas 2 comme rapporté par Dev) — confirmé hors périmètre, versé au candidat 7 de l'audit existant, pas un défaut de ce lot. Statut Test → Faite, phase Revue lancée avec les réglages par défaut (opus/max). | Aucune question ne nécessitait l'utilisateur. |
| 2026-09-10 | Revue (1ᵉʳ passage) : **verdict Go**, chiffres de Dev/Test reproduits à l'octet par Revue elle-même (build, manifeste, run Playwright hors ligne indépendant). 5 constats : 3 mineurs avec renvoi (Dev : `try`/`catch` manquant autour de `sessionStorage` dans `main.tsx`, absent du pattern maison déjà écrit dans `LocalStoragePreferences.ts` ; Test : plancher manquant sur une des deux regex de `lazyRoutes.test.ts`, et le cas n°9 de `03-plan-de-test.md` affirme un résultat contredit par le code — le premier fallback d'un lien profond sur `/partie/:id` est `Spinner` plein écran, pas `SpinnerLigne`), 1 moyen renvoi Aucun (liste « à graver » d'Archi incomplète — oublie `docs/PROJECT_PLAN.md` § 6, assigné à l'Orchestrator), 1 information renvoi Aucun (absence d'`ErrorBoundary` dans tout le projet, fenêtre d'installation du SW, note `CONVENTIONS.md` § 7 déjà approximative). | — |
| 2026-09-10 | Boucles 3 et 4 déclenchées (auto, non bloquant pour l'utilisateur — cf. tableau des boucles de la skill) : constat 1 (Dev) et constats 2+3 (Test) renvoyés dans le même tour. Tour 1/5 global, 1/2 pour chaque boucle. Phase Dev relancée pour le seul correctif signalé, puis Test rejoué (fixes propres + revérification complète), puis Revue rejouée. | Toutes classées « mineur » par Revue elle-même, avec verdict Go déjà posé — mais la skill ne distingue pas par sévérité : un renvoi non-Aucun relance la phase visée. Corrections suffisamment petites (< 10 lignes cumulées) pour ne pas justifier de consulter l'utilisateur avant de les appliquer. |
| 2026-09-10 | Revue (2ᵉ passage, ciblé) : les 3 retouches confirmées livrées et saines, revérifiées empiriquement (mutation de la garde de test, lecture du diff `main.tsx`). Deux imprécisions documentaires supplémentaires relevées (constat 3bis : cellule du cas n°9 se contredisant elle-même sur le saut de mise en page ; constat 4 : `02-dev-notes.md` disait « aucun écart » alors qu'un 3ᵉ `Suspense` non prévu par l'architecture a été ajouté dans `PartieEcran.tsx`) — toutes deux **corrigées directement par l'Orchestrator** (renvoi « Aucun », pas de nouvelle boucle), avec la justification de l'écart documentée. Verdict **Go**, conditionné à graver les 3 notes de `01-architecture.md` avant le commit (constat 5, moyen). | Corrections de documentation pures, sans toucher au code ni aux tests déjà vérifiés — aucune justification à relancer Dev/Test/Revue pour ça, conforme à la classification « Renvoi : Aucun » du rapport de Revue lui-même. |
| 2026-09-10 | Gravage fait avant le commit : `CLAUDE.md` § Déploiement (chunks hachés + précache automatique) et § Notes techniques (API Rolldown `codeSplitting.groups`, écouteur `vite:preloadError`) ; `.claude/CONVENTIONS.md` § 13 (un mode ajoute aussi son `lazy()` dans `PartieEcran`) ; `docs/PROJECT_PLAN.md` § 6, nouvelle sous-section « Décisions du lot « bundle-par-route » », même format que les deux lots post-audit précédents. Pas de puce dans § État d'avancement de `CLAUDE.md` ni de mise à jour de `docs/audits/2026-09-10.md` — coutume déjà établie par les deux lots post-audit précédents (vérifiée explicitement par Revue au 1ᵉʳ passage), suivie à l'identique. `04-revue.md` écrit, consolidant les deux passages. Statut Revue → Faite. | Textes rédigés par l'Orchestrator à partir des constats écrits par `archi` (§ « À graver ») et `review` (constat 5), pas improvisés. |
| 2026-09-10 | Second arrêt (fin de Revue) validé par l'utilisateur : « Go — proposer le commit ». Commit proposé (message + liste exacte des 14 fichiers) puis confirmé explicitement : « Oui, committer ». **Commit `eba30b3`** — chemins explicites (jamais `-A`) : 5 fichiers `src/`, 1 nouveau test, 3 fichiers de doc gravée (`CLAUDE.md`, `.claude/CONVENTIONS.md`, `docs/PROJECT_PLAN.md`), 5 fichiers `docs/lots/bundle-par-route/`. `git status` propre après coup. Lot considéré **terminé**. | Accord explicite de l'utilisateur à deux reprises (fin de Revue, puis message de commit) ; working tree vérifié propre avant et après. |

## Historique des corrections

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 3 | Revue → Dev | `try`/`catch` manquant autour des deux accès `sessionStorage` dans `src/main.tsx` (`vite:preloadError`) — le projet a déjà payé pour ce piège (`LocalStoragePreferences.ts`) et ne l'a pas réappliqué ici. | Corrigé — vérifié par l'Orchestrator (`git diff` : 4 lignes ajoutées, `try`/`catch` avec repli silencieux, `window.location.reload()` hors bloc protégé). `lint`/`typecheck`/`test` (339/339) verts. |
| 1 | 4 | Revue → Test | Plancher manquant sur `IMPORT_STATIQUE` dans `lazyRoutes.test.ts` (risque de vert à vide) ; cas n°9 de `03-plan-de-test.md` affirme un résultat contredit par le code (premier fallback d'un lien profond sur `/partie/:id`). | Corrigé — vérifié par l'Orchestrator (nouveau plancher `toContain('AccueilEcran')`, mutation-restauration sans `git checkout --` cette fois, cas n°9 réécrit avec la séquence réelle à 3 fallbacks). `lint`/`typecheck`/`test` (339/339) revérifiés indépendamment. Correctif Dev du tour 3 confirmé sain au passage. |

Boucles 3 et 4 closes en un seul tour chacune (1/2 chacune, 3/5 au global). Aucune n'a atteint
son plafond, aucune escalade nécessaire.

Plafond global : 5 tours tous types confondus, puis escalade.
