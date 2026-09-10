# Lot `bundle-par-route` — revue

> Écrit par l'Orchestrator à partir des rapports du sous-agent `review` (deux passages : un
> verdict Go avec 3 retouches mineures, puis une revue ciblée après correction).

## Résumé

Le lot découpe le bundle unique (515 kB minifié / 154 kB gzip, au-delà du seuil d'avertissement
natif de Vite) par route (`App.tsx`) et par mode de jeu (`PartieEcran.tsx`), plus un groupe
vendor isolant ~360 kB de dépendances qui ne bougent qu'aux montées de version. Chunk d'entrée
résultant : **61 kB minifié** (÷ 8,4), mesuré indépendamment par Dev, Test **et** Revue — les
trois obtiennent le même chiffre à l'octet. L'invariant qui pouvait couler le lot — un mode
jamais ouvert doit rester jouable hors ligne — a été vérifié en conditions réelles (service
worker actif, réseau coupé) par Test puis recontrôlé par Revue, sur des chunks dont Revue a
elle-même vérifié qu'ils n'avaient jamais transité par le réseau avant la coupure.

Deux passages de revue : le premier a rendu un verdict **Go** avec 3 retouches mineures
(renvoyées à Dev et Test, corrigées et revérifiées), le second a confirmé ces corrections et
relevé deux imprécisions documentaires supplémentaires (un écart non déclaré, une conclusion de
plan de test contredite par sa propre preuve) — toutes deux corrigées directement par
l'Orchestrator sans nouveau renvoi, plus la gravure des décisions dans `CLAUDE.md`,
`docs/PROJECT_PLAN.md` et `.claude/CONVENTIONS.md` que le second passage posait comme condition
du Go.

## Constats

| # | Sévérité | Constat | Renvoi vers | Issue |
|---|---|---|---|---|
| 1 | mineur | `try`/`catch` manquant autour de `sessionStorage` dans `src/main.tsx` — le pattern maison de `LocalStoragePreferences.ts` n'était pas repris | Dev | **Corrigé**, revérifié par Revue (2ᵉ passage) : couvre `getItem` et `setItem`, `reload()` hors du bloc protégé, pas de sur-ingénierie (pas de repli mémoire, qui serait effacé par le rechargement qu'il est censé compter) |
| 2 | mineur | Plancher manquant sur la regex `IMPORT_STATIQUE` de `tests/architecture/lazyRoutes.test.ts` (risque de vert à vide sur la moitié de la garde) | Test | **Corrigé**, prouvé par mutation par Test puis revérifié indépendamment par Revue (regex cassée → échec correct, restauration par sauvegarde manuelle) |
| 3 | mineur | Cas n°9 de `03-plan-de-test.md` affirmait « un seul fallback continu » sur un lien profond vers `/partie/:id` ; en réalité 3 fallbacks en séquence | Test | **Corrigé** par Test (séquence réelle décrite, revérifiée par test déterministe). Un second défaut découvert au 2ᵉ passage de Revue dans la même cellule — voir constat 3bis |
| 3bis | mineur | La cellule corrigée du cas n°9 affirmait encore « aucun saut de mise en page », contredit par sa propre preuve (`min-h-dvh` → `py-8`, ~380 px de déplacement) | Aucun (assumé) | **Corrigé directement par l'Orchestrator** dans `03-plan-de-test.md` : le saut est réel, cosmétique en usage réel (chunk précaché, ~100 ms), remède connu à une ligne non pris dans ce lot |
| 4 | mineur | `02-dev-notes.md` affirmait « aucun écart » alors que Dev a ajouté un **troisième** `Suspense` (dans `Aiguillage`, `PartieEcran.tsx`) en plus des deux prévus par `01-architecture.md` | Aucun (documentation) | **Corrigé directement par l'Orchestrator** : écart reclassé en *Ajustement* dans `02-dev-notes.md`, avec sa justification (sans lui, la suspension remonterait au `Suspense` d'`App.tsx`) — c'est cet écart qui produit la séquence à 3 fallbacks du constat 3 |
| 5 | moyen | Les 3 notes à graver identifiées par `01-architecture.md` n'étaient pas encore écrites dans `CLAUDE.md`/`docs/PROJECT_PLAN.md`/`.claude/CONVENTIONS.md`, alors que le code livré référence déjà `CONVENTIONS.md § 13` pour une règle qui n'y était pas | Aucun (Orchestrator, avant commit) | **Fait** : `CLAUDE.md` § Déploiement (chunks hachés/précache) et § Notes techniques (API Rolldown `codeSplitting.groups`, écouteur `vite:preloadError`), `.claude/CONVENTIONS.md` § 13 (un mode ajoute aussi son `lazy()`), `docs/PROJECT_PLAN.md` § 6 (sous-section dédiée, même format que les deux lots post-audit précédents) |
| 6 | info | `docs/lots/bundle-par-route/04-revue.md` encore au gabarit au moment du 2ᵉ passage de Revue ; `03-plan-de-test.md` citait un total d'insertions périmé (127 au lieu de 133) après le correctif Dev | Aucun | **Corrigé** : ce fichier (écrit après coup) et la ligne périmée de `03-plan-de-test.md` |

Aucun constat classé bloquant ou majeur sur les deux passages. Aucune question de phase laissée
ouverte sans résolution écrite — vérifié explicitement par les deux passages de Revue.

## Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) | Oui — aucun fichier `core/`, `application/`, `infrastructure/`, `composition/` touché ; un `import()` dynamique ne franchit aucune frontière que l'import statique ne franchissait pas |
| Aucun mode de jeu n'en importe un autre | Oui — le découpage renforce même la séparation (un chunk par mode) |
| Aucune couleur en dur dans `src/ui`, aucun `rounded-*` | Oui — aucune classe nouvelle hors `Spinner`/`SpinnerLigne` déjà existants |
| Aucune règle de jeu réimplémentée dans l'UI | Oui — `Aiguillage` restructuré en `ReactNode` puis enveloppé, logique de sélection de mode inchangée à l'octet près |
| Aucune valeur persistée renommée | Oui — zéro ligne de domaine, d'événement ou d'adapter touchée ; la seule clé nouvelle (`dartpero:preload-error-reload`) est en `sessionStorage`, éphémère, absente de l'export JSON |
| `CLAUDE.md` à jour des décisions durables du lot | Oui, depuis la clôture du constat 5 |

## Go / no-go

**Verdict : GO.**

**Justification :** démontré sur pièces à trois reprises indépendantes (Dev, Test, Revue
obtiennent le même chiffre de build à l'octet), invariant hors ligne — le seul point qui
pouvait couler le lot — vérifié en conditions réelles par Test et recontrôlé par Revue sur des
chunks jamais transités par le réseau avant coupure. Les 3 retouches du premier passage de
Revue sont livrées et revérifiées indépendamment, pas prises sur parole. Les deux imprécisions
documentaires relevées au second passage étaient cosmétiques (une conclusion de plan de test à
corriger, un écart à requalifier) et ont été corrigées directement, sans qu'aucune ne remette
en cause le code ni les tests déjà vérifiés. La condition posée par le second passage — graver
les 3 notes avant le commit — est remplie.

L'incident de méthode du premier tour de Test (`git checkout --` ayant temporairement écrasé un
patch non commité) ne s'est pas reproduit au tour suivant et n'a laissé aucune trace dans le
dépôt final, vérifié indépendamment par l'Orchestrator à chaque étape (`git status`/
`git diff --stat`, `npm test`).

## Points non résolus après le lot

- **`vite:preloadError` jamais exercé en conditions réelles de déploiement** — il faudrait deux
  versions de build servies successivement sous le même service worker. Vérifié par lecture de
  code uniquement, par Dev, Test et Revue.
- **Aucun `ErrorBoundary` dans tout le projet.** Si le rechargement unique du filet
  `vite:preloadError` échoue aussi, écran blanc sans filet. Préexistant en nature, élargi par ce
  lot (0 → 16 points de chargement dynamique). Bon candidat pour un prochain lot ou un futur
  audit.
- **Fenêtre d'installation du service worker** : à la toute première visite, avant la fin du
  précache, un chunk lazy peut encore réclamer le réseau.
- **Saut visuel entre `Spinner` plein écran et `SpinnerLigne`** sur un lien profond vers
  `/partie/:id` (constat 3/3bis) — cosmétique en usage réel, remède connu (un seul fallback
  `Spinner` pour `Aiguillage`) non pris dans ce lot.
- **Doublons de précache dans `dist/sw.js`** (5 paires, favicon/apple-touch-icon/icônes) — hors
  périmètre confirmé dès l'architecture, candidat 7 du vivier d'audit `docs/audits/2026-09-10.md`.
- Aucun test sur iPhone/Safari réel ni sur réseau mobile réel (hors périmètre du lot, rappelé
  par `CLAUDE.md` § Environnement : à faire avant de considérer le *projet* fini, pas ce lot).
