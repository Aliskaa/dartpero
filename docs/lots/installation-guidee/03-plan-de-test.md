# Lot `installation-guidee` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (opus, effort high du
> frontmatter). Le rapport source commence par `Test result: PASS`.

**Verdict : PASS.** Aucun bug d'implémentation ; une lacune optionnelle (L1) et trois
lacunes optionnelles mineures. Test n'a rien modifié dans le dépôt (seul `dist/` reconstruit).

## Commandes (relancées par Test)

| Commande | Résultat réel |
|---|---|
| `npm run lint` | `Checked 211 files … No fixes applied.`, sortie 0 |
| `npm run typecheck` | `tsc --noEmit`, sortie 0 |
| `npm test` | 38 fichiers, **437 tests** verts (8,39 s) |
| `npm run build` | sortie 0, `precache 47 entries (782.16 KiB)` |
| `npm run smoke` | `Contrôles statiques OK — manifeste (id, raccourci, 3 captures) et précache sans capture`, puis `Smoke test OK — #root 20071 octets, « Dartpéro »` |

Gardes et suites proches : `hexagonalBoundary` 6, `installationBoundary` 3, `lazyRoutes` 5,
`themeBoundary` 2, `BrowserAppInstallation.test.ts` 40, `NavigatorPersistentStorage.test.ts` 13,
`stockagePersistant.test.tsx` 14.

**`dist/` inspecté** : manifeste `"id":"/"`, `"start_url":"/"`, `"scope":"/"`, `categories`
`["games","sports","entertainment"]`, raccourci « Nouvelle partie » → `/nouvelle-partie`
(`icons/icon-192.png`), 3 captures (`accueil` et `partie-x01` 780x1688 `narrow`, `paysage`
1000x462 `wide`, `label` français). `sw.js` : 42 URL distinctes dont `index.html`,
`manifest.webmanifest`, icônes ; `grep -c screenshots dist/sw.js` = 0. `dist/screenshots/` :
3 PNG (≈ 425 ko), servis mais non précachés.

## Mutations (copie jetable, aucune source du dépôt touchée)

| # | Mutation | Résultat |
|---|---|---|
| M1 | Le hook appelle `prompt()` deux fois par clic | **28/28 verts : non détectée** (L1) |
| M2 | « Plus tard » en `useState` au lieu de la préférence | 1 échec |
| M3 | Les Réglages consultent `installation:ecartee` | 1 échec |
| M4 | Accueil affiché aussi en `unavailable` | 4 échecs |
| M5 | Invite non retirée dans `prompt()` | 3 échecs |
| M6 | `preventDefault()` retiré | 1 échec |
| M7 | Mac à 0 point tactile détecté iOS | 2 échecs |
| M8 | Safari iOS prioritaire sur « installée » | 3 échecs |
| M9 | Action d'installation affichée sans refus | 3 échecs |
| M10 | `navigator?.standalone` dans `labels.ts` | garde `installationBoundary` échoue |
| M11 | `prompt()` au montage si `installable` | 11 échecs |
| M12 | Pas de désabonnement | 1 échec |
| S1 | `globIgnores` retiré | smoke échoue (captures présentes) |
| S2 | `id: '/app'` | smoke échoue (`id vaut "/app", attendu "/"`) |
| S3 | `sizes: '1000x460'` | smoke échoue (dimensions réelles 1000x462) |
| S4 | `public/screenshots/paysage.png` retiré | smoke échoue (capture absente de `dist/`) |

## Matrice critères → tests

`BAI` = `tests/infrastructure/device/BrowserAppInstallation.test.ts`, `UI` =
`tests/ui/installation.test.tsx`, `GARDE` = `tests/architecture/installationBoundary.test.ts`,
`SMOKE` = `scripts/smoke-build.mjs`.

| AC | Exigence | Couverture | Où |
|---|---|---|---|
| 1 | Invite captée → `installable` | Couvert | BAI:122, 149, 159 |
| 1 | `prompt()` une fois, invite jamais réutilisée | Couvert (adapter), **partiel (UI)** | BAI:172, 187 ; UI:77, 179 (ne détectent pas un double appel — L1) |
| 2 | `appinstalled` / `standalone` → installée ; Accueil masqué ; Réglages « installé » | Couvert | BAI:209, 237, 255, 261, 276 ; UI:70, 102, 215, 233 |
| 3 | Safari iOS → guide ; Chrome / Firefox iOS → « Ouvrez dans Safari » | Couvert | BAI:98-117 (table d'UA), 283-305 ; UI:55, 151, 193, 205 |
| 4 | « Plus tard » tient au rechargement, Accueil seulement | Couvert | UI:112 (remontage, M2), UI:130 (M3) |
| 5 | API absente / erreur → `indisponible`, rien ne casse | Couvert | BAI:223-233, 332, 342, 351, 364, 374 ; UI:70, 224 ; SMOKE:156 (`pageerror`) |
| 6 | Manifeste construit ; aucune capture précachée | Couvert (smoke, mutations S1-S4) | SMOKE:57, 61, 63-74, 79, 102, 107 |
| 7 | Aucune API d'installation hors adapter | Couvert, avec plancher | GARDE:28-49 (M10) ; grep du dépôt sans autre occurrence |
| 8 | Tests, Biome, gardes, smoke | Couvert | § Commandes |

Tous les cas de § Testabilité de `01-architecture.md` sont couverts (faux `window` / fausse
invite conformes, priorités BAI:310-328, désabonnement BAI:389 et UI:161, adapter qui
n'appelle jamais `prompt()` BAI:139, App montée sans invite UI:141, refus × état UI:297-337,
`#installer` UI:251-267, garde (b) GARDE:56, provider GARDE:68).

## Qualité

- Fakes, pas de mocks ; seule entorse documentée : `scrollIntoView` remplacé par une fonction
  enregistreuse restaurée en `afterEach` (jsdom ne l'implémente pas) — acceptable.
- Déterministe (ni horloge, ni hasard, ni réseau ; UA figés).
- Tests d'absence avec planchers, vérifiés par mutation (M10, M11, S1).
- **Tests préexistants non affaiblis** : `stockagePersistant.test.tsx` et
  `NavigatorPersistentStorage.test.ts` identiques à `HEAD` hors fins de ligne (md5 sans CR) ;
  `renderWithServices.tsx` : commentaire seul ; les 14 tests de stockage verts, dont celui
  sous `StrictMode`.
- Cas de bord de `rules/testing.md` propres au jeu (bust, bogey, rejeu, joueur supprimé…) :
  hors sujet (ni domaine, ni journal, ni Dexie).

## Constats classés

### Bugs d'implémentation

Aucun.

### Lacunes de test (toutes optionnelles selon Test)

- **L1** — le « une fois » côté UI est vert à vide : `FakeAppInstallation.prompt()` ne compte
  qu'en `installable` puis passe à `unavailable`, donc un double appel dans le même clic n'est
  pas vu (M1). Sans impact en production (l'adapter refuse lui-même, BAI:172 / M5). Correctif
  suggéré : compter tous les appels dans le fake et vérifier `=== 1` (UI:84, UI:188).
- **L2** — aucun test n'instancie `BrowserAppInstallation` avec le `window` global par défaut,
  ni `createBrowserDependencies()` avec `appInstallation` (couvert par le smoke en Chromium).
- **L3** — le lien « Voir comment installer » depuis `/reglages` n'est pas cliqué en test
  (seul le `href` est vérifié, UI:309).
- **L4** — pas de test UI de l'installation sous `StrictMode` (risque faible).

### Observations

- **O1** — `MediaQueryList.addEventListener` absent (Safari iOS ≤ 13) fait lever le
  constructeur → tout `unavailable` : repli prévu par AC 5, version obsolète.
- **O2** — `ETAT_INSTALLATION['ios-manual']` dit « Sur iPhone… » alors que l'état couvre
  l'iPad : libellé, rattaché à Q1.
- **O3** — contrôle `main.tsx` de la garde textuel (un commentaire pourrait le satisfaire) ;
  juste aujourd'hui.
- **O4** — l'extraction du précache dépend de la forme minifiée `url:"…"` ; protégée par le
  plancher et les 3 URL essentielles.
- **O5** — `createBrowserServices()` qui lèverait au module empêcherait tout rendu ; avant le
  lot, l'échec avait lieu au rendu sans `ErrorBoundary` non plus : pas une régression.
- **O6** — après une erreur du constructeur, `appinstalled` est ignoré ; le suivi `change` n'a
  pas la même garde mais reste sans effet sans abonné.

## Angles morts

- **Rendu** : ligne d'Accueil et entrée À propos, portrait / paysage, sombre / clair —
  glyphes, troncature, contraste `craie/70` / `craie/75`, hauteur réelle des cibles 48 px
  (bouton `discret` via `min-h-12`, non vérifié à l'œil), saut sous l'encoche. 5 captures sur
  16 relues par le Dev : relecture utilisateur due.
- **Chromium réel** : vraie fenêtre avec captures, heuristique d'engagement, vrai
  `appinstalled`, pas de seconde icône (R1). Pas de `beforeinstallprompt` en headless.
- **iOS réel** : guide Safari, place de Partager, Chrome iOS, iPad (R2, R6).
- **Raccourci** après mise à jour de la WebAPK (R5). **Hors ligne** : fenêtre sans captures
  (R3, accepté).

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Traiter L1 maintenant ou l'accepter (l'adapter protège déjà) ? | Orchestrator, puis Dev si retenu |
| 2 | Libellé `ios-manual` « Sur iPhone » alors que l'iPad est couvert (O2) | Utilisateur, avec Q1 en fin de lot |
| 3 | Relecture à l'écran complète | Utilisateur, en fin de lot |
| 4 | R1, R2, R5, R6 sur appareil | Utilisateur, après déploiement |

## Résolutions de l'Orchestrator (gate Test)

- **Q1** : **L1 acceptée sans boucle.** Classée optionnelle par Test ; le contrat « une
  invite ne sert qu'une fois » est tenu et testé là où il vit, dans l'adapter (BAI:172, M5
  détectée). Le test UI vérifie que le clic atteint le port, pas l'unicité. L2-L4 acceptées
  de même. La Revue peut renvoyer si elle juge autrement.
- **Q2** : rattachée à la validation des libellés à l'arrêt de fin de lot.
- **Q3** : rattachée à l'arrêt de fin de lot (relecture à l'écran obligatoire, skill § Séquence
  étape 8).
- **Q4** : hors lot, déjà dans PLAN § 0.

## Rejeu — boucle 5, tour 1 (2026-10-01)

> `test` relancé (opus, effort high du frontmatter). Rapport : `Test result: PASS`.

| Commande | Résultat réel |
|---|---|
| `npm run lint` | 211 fichiers, aucune correction |
| `npm run typecheck` | sortie 0 |
| `npm test` | 38 fichiers, **437** verts |
| `npm run build` | sortie 0, 47 entrées (782.16 KiB) |
| `npm run smoke` | contrôles statiques OK, smoke OK |

- **L1 close** : `FakeAppInstallation.prompt()` compte chaque appel (`tests/fakes/index.ts:144-149`),
  issue toujours fidèle à l'adapter. Les 6 usages de `promptCalls` de
  `tests/ui/installation.test.tsx` relus (l. 52, 85, 123, 149, 190, 308) : les trois `toBe(0)`
  deviennent plus stricts, les trois `toBe(1)` détectent un double appel. Aucun test affaibli.
- **Mutation M1 refaite** (copie jetable) : 3 échecs sur 28 (`expected 2 to be 1`), contre 0
  avant la boucle ; copie non mutée 28/28 ; dépôt intact.
- **Doc (n° 1, n° 11)** : aucun test, garde ou script ne lit ces fichiers ; contenus conformes
  (`CLAUDE.md:11` → `DEPLOIEMENT.md:100` ; `frontend-react.md:13` ; `PROJECT_PLAN.md`
  l. 205, 213 ; `CLAUDE.md:224`).
- **Constats** : aucun bug, aucune lacune nouvelle. Observation : les autres numéros de ligne
  de la feuille de route l. 50 (74-81, 93, 95-97) non revérifiés par Test.

**Résolution de l'Orchestrator (gate Test, rejeu)** : question close — l'Orchestrator les a
revérifiés sur disque pendant ce tour (`CLAUDE.md:76-79` « best of N » / « premier à N »,
`:93` `useMatch.ts`, `:97` « et les API navigateur ») : toujours justes.

## Rejeu — boucle 5, tour 2 (2026-10-02)

> `test` relancé (opus, effort high du frontmatter). Rapport : `Test result: PASS`.

| Commande | Résultat réel |
|---|---|
| `npm run lint` | 211 fichiers, aucune correction |
| `npm run typecheck` | sortie 0 |
| `npm test` | 38 fichiers, **437** verts |
| `npm run build` | 47 entrées (782.16 KiB) |
| `npm run smoke` | contrôles statiques OK, smoke OK |

- **Libellés `ios-manual`** (`labels.ts:230`, `:241-245`) : plus aucun « en bas de l'écran » dans
  `src/`. Les tests restent porteurs : `installation.test.tsx:195-205` (statut « Safari » + liste de
  exactement 3 `listitem` dans l'ordre « Partager », « Sur l’écran d’accueil », « Ajouter »,
  rendue seulement en `ios-manual`) et `:207-215` (liste absente en `ios-other-browser`) ; iPad →
  `ios-manual` verrouillé côté adapter (BAI:100-101, 288).
- **`.gitattributes`** : `git ls-files --eol` 287 `i/lf w/lf` + 17 `i/-text w/-text` (`.png`) ;
  `check-attr` : `.png` `binary`, `.ts` `text: auto` / `eol: lf` ; aucun CR dans `src`, `tests`,
  `scripts`, config racine ; lint vert.
- **Lacune optionnelle** : aucun test ne verrouille « iPad » dans la phrase d'état ni l'absence
  de « en bas » à l'étape 1.
- **Observation** : `00-orchestration.md` (non suivi) en CRLF dans la copie de travail —
  normalisé par `git add`, sans effet.

**Résolutions de l'Orchestrator (gate Test, rejeu tour 2)** :

- Lacune optionnelle **acceptée sans boucle** : choix de formulation (pas une règle de
  `CLAUDE.md`), les tests du projet vérifient des sous-chaînes et non des textes figés ; la
  validation réelle du libellé passe par un iPad (R2, PLAN § 0).
- Observation : cause trouvée (scripts d'écriture de l'Orchestrator en fins de ligne Windows) ;
  `00-orchestration.md` repassé en LF par l'Orchestrator.
