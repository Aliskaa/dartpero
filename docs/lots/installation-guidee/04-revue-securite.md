# Lot `installation-guidee` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport du sous-agent `sec` (opus, effort high du
> frontmatter). Le rapport source commence par `Security result: PASS`.

**Verdict : PASS.** Aucun bug d'implémentation, aucune faille de design ; 3 observations,
2 résiduels. `sec` n'a rien modifié (`git status --short` identique avant / après ; seuls
`npm run build` et `npm run smoke` ont écrit, dans `dist/`).

## Périmètre lu

- `.ai/architecture-context.md` § Sécurité ; `00` à `03` du lot (Baseline, R1-R6, Q5).
- `git diff` sur `src/`, `vite.config.ts`, `scripts/smoke-build.mjs`, `CLAUDE.md`,
  `docs/DEPLOIEMENT.md` ; nouveaux fichiers lus en entier (`AppInstallation.ts`,
  `BrowserAppInstallation.ts`, `useInstallation.ts`) ; `main.tsx`, `Button.tsx`.
- Fichiers à fins de ligne seules (contenu inchangé) identifiés.
- `npm run build` (47 entrées, 782,16 KiB) ; `npm run smoke` vert ; `dist/manifest.webmanifest`
  et `dist/sw.js` inspectés.

## Checklist Dartpéro

| Surface | Touchée ? | Verdict et preuve |
|---|---|---|
| Zéro réseau | Non | Aucun `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `firebase` ni URL `http(s)` ajoutés dans `src/` (grep). Captures chargées par le navigateur, même origine |
| Import JSON / `backupSchema` | Non | Aucun fichier `backup*`, `dexie/`, `events/` dans le diff |
| Rendu d'une saisie | Non | Aucun `dangerouslySetInnerHTML` / `innerHTML` / `outerHTML` / `insertAdjacentHTML`. Texte depuis `labels.ts`. UA jamais rendu ; `#installer` seulement comparé à une constante (`ReglagesEcran.tsx:186`) |
| Format persisté | Non | Ni `MatchEvent`, ni Dexie, ni migration |
| Service worker / `firebase.json` | **Oui** (surface n° 4) | Voir Q5 ; précache intact, `firebase.json` inchangé, `vite:preloadError` inchangé (`main.tsx:28-39`) |
| Permissions navigateur | Non | Toujours vibration (`VibrationHaptics.ts:8`) et Wake Lock (`WakeLockScreenLock.ts:31`) seulement. La fenêtre d'installation n'est pas une permission, et ne s'ouvre que sur un clic |
| Stockage local | Oui, minime | `installation:ecartee` via `usePreference` (`AccueilEcran.tsx:103`) → `LocalStoragePreferences` (préfixe `dartpero:`) : préférence d'appareil, conforme. « Installée » en mémoire seulement (`BrowserAppInstallation.ts:111-113`) |
| Dépendances | Non | `package.json` / lock inchangés ; `npm audit --omit=dev` : 0 vulnérabilité ; ni `sharp` ni `playwright` dans `dist/assets/*.js` ; icônes lucide déjà présentes |
| Secrets | Non | Les 3 PNG n'ont que `IHDR PLTE pHYs IDAT IEND` (pas de `tEXt`/`iTXt`/`zTXt`/`eXIf`) ; copies identiques de `docs/captures/` — **publiées pour la première fois** sous `dartpero.web.app/screenshots/` (pas de remote ; prémisse « déjà publiques » corrigée au rejeu, voir plus bas) |

### Points complémentaires

- **`id: '/'`** (`vite.config.ts:50`) : `start_url` / `scope` à `/` depuis `5e89f39`, seule
  valeur jamais livrée (`git log -S"start_url"`) ; identité calculée inchangée. Le smoke bloque
  toute dérive (mutation S2 de Test). Confirmation sur appareil : R1.
- **User agent** : lu une fois (`BrowserAppInstallation.ts:87`), réduit par la fonction pure
  `detectIosBrowser` à `'safari' | 'other' | null` ; ni stocké, ni rendu, ni persisté.
- **Services créés au module** (`main.tsx:53`, O5 de Test) : **pas une régression** — avant,
  une exception dans le `useMemo` de `ServicesProvider` (sans `ErrorBoundary`) donnait déjà un
  écran vide. Constructeur du nouvel adapter sous `try/catch` (`:81-123`) ; `vite:preloadError`
  posé **avant** la création des services ; plus de double création sous `StrictMode`.

## Réponse à la question 5 de l'architecture — close, conforme

1. **Aucun `prompt()` hors clic** : seul appel dans `installer` (`useInstallation.ts:41-43`,
   `useCallback`, ni effet ni rendu), branché sur des `onClick` uniquement
   (`AccueilEcran.tsx:125`, `ReglagesEcran.tsx:150`, `:214`) ; `Button` transmet `onClick` sans
   intermédiaire (`Button.tsx:46-48`) ; le seul `useEffect` du lot fait `scrollIntoView`
   (`ReglagesEcran.tsx:184-187`). Dans l'adapter, `invite.prompt()` seulement dans `prompt()`
   (`:151`), sans `await` préalable ; les écouteurs (`:100-116`) ne font que `preventDefault`
   et garder l'invite. Test : `promptCalls === 0` au montage, M11 casse 11 tests.
2. **`globIgnores`** (`vite.config.ts:119`) = défaut de workbox-build (`**/node_modules/**/*`,
   vérifié dans `GenerateSWOptions.json`) + `screenshots/**`. `globPatterns` inchangé. Hors
   précache : 3 captures, `sw.js`, `workbox-*.js`, 5 `.woff` (déjà exclus avant le lot). Dans
   le précache : `index.html`, `manifest.webmanifest`, `registerSW.js`, icônes, 5 `woff2`,
   2 CSS, tous les chunks lazy. Aucune URL précachée absente de `dist/`. `sw.js` garde
   `NavigationRoute`, `createHandlerBoundToURL("index.html")`, `cleanupOutdatedCaches`,
   `skipWaiting`, `clientsClaim`.
3. **`firebase.json` inchangé** (`git diff --quiet HEAD -- firebase.json`). `/screenshots/*.png`
   et `/manifest.webmanifest` ne matchent que `**` → `no-cache` ; `/icons/**` `max-age=604800` ;
   `/assets/**`, `/workbox-*.js` `immutable`. Capture absente → `index.html` 200 : couvert par
   le smoke (S3, S4).
4. **Aucun réseau / `firebase` / CDN ajouté.**

## Constats classés

- **Bugs d'implémentation** : aucun.
- **Failles de design** : aucune.
- **Observations** :
  - **S-O1** — `BrowserAppInstallation.ts:94-97` : l'écouteur `change` de `display-mode` ne
    vérifie pas `this.hs`. Si le constructeur lève après l'avoir posé, l'état peut passer à
    `installed` sans abonné : au pire, l'invitation est masquée. Pas de sécurité (O6 de Test).
  - **S-O2** — `:104` : `preventDefault()` sur chaque `beforeinstallprompt` : la mini-barre
    native de Chrome ne s'affiche plus jamais, même après « Plus tard ». Voulu (architecture
    § 3) ; les Réglages gardent l'entrée.
  - **S-O3** — Hors ligne, les captures échouent au réseau (aucune route ne les sert) : R3,
    rien ne casse.

## Résiduels

| # | Résiduel | Mitigation | Owner |
|---|---|---|---|
| R1 | Identité réelle après déploiement (pas de seconde icône) | Smoke sur `id` / `start_url` / `scope` ; historique de `start_url` vérifié | Utilisateur : DevTools → Manifest → « Computed App ID » avant / après |
| R5 | Raccourci visible seulement après mise à jour de la WebAPK | Documenté dans `DEPLOIEMENT.md` (« ne jamais désinstaller sans exporter ») | Utilisateur |

R3 et R4 sont marqués « accepté » dans `01-architecture.md` : `sec` ne les reprend pas comme
risques acceptés — signature utilisateur requise. R2 et R6 relèvent de l'expérience, pas de la
sécurité.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | R3 (captures absentes hors ligne) et R4 (installée mais ouverte dans un onglet → `unavailable`) sont-ils signés par l'utilisateur ? | Orchestrator → utilisateur |

## Résolutions de l'Orchestrator (gate Sécurité)

- **Q1** : non signés à ce jour (« accepté » vient de l'architecture, pas de l'utilisateur).
  Rattachés à l'arrêt de fin de lot comme résiduels **à signer** ; aucun ne change le code. La
  Revue peut démarrer.

## Rejeu — boucle 5, tour 1 (2026-10-01)

> `sec` relancé (opus, effort high du frontmatter). Rapport : `Security result: PASS`.

- **Périmètre du tour** (isolé par mtime, rien n'étant committé) : `tests/fakes/index.ts`,
  `tests/ui/installation.test.tsx`, `.claude/rules/frontend-react.md`, `CLAUDE.md`,
  `docs/PROJECT_PLAN.md`, feuille de route, `.ai/architecture-context.md`, fichiers du lot ;
  plus `src/ui/hooks/useInstallation.ts` (mtime de la mutation du Dev, annulée) — relu : un
  seul `void installation.prompt()` (`:41-43`), aucun changement net. Aucun changement de
  `vite.config.ts`, `firebase.json`, dépendances, smoke ni `public/screenshots/`. Aucun réseau
  ni `innerHTML` ajouté. **Le tour n'ouvre aucune surface.**
- **Ligne « Secrets » réévaluée** (constat n° 8 de la Revue v1) : les PNG, versionnés dans
  `docs/captures/` (`ae9f933`), n'ont jamais été publiés ; le déploiement les publiera sous
  `https://dartpero.web.app/screenshots/` (et Android peut les montrer dans sa fenêtre
  d'installation). Toujours identiques (md5) et sans bloc de métadonnées. Contenu : base de
  démonstration, partie X01 entre « Kevin » et « Julien » — prénoms et scores seulement.

### Constats

1. **Résiduel, à signer par l'utilisateur** (ni bug, ni faille de design) : deux prénoms de la
   base de démonstration publiés sur un site public. Risque très faible (prénoms courants,
   aucune autre donnée), mais « Kevin » ressemble au prénom réel de l'utilisateur et « Julien »
   est peut-être un ami réel. Non inscrit en risque accepté par `sec`. Si refus : nouvelles
   captures (procédure `CLAUDE.md`, ligne `docs/captures/`, README compris) **avant le
   déploiement**, pas avant la fusion.

### Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 2 | Accepter « Kevin » et « Julien » dans les captures publiques ? | Utilisateur, étape 8 |
| 3 | Corriger « déjà publiques » dans la ligne « Secrets » | Orchestrator |

### Résolutions de l'Orchestrator (gate Sécurité, rejeu)

- **Q2** : rattachée à l'arrêt de fin de lot, avec R3 / R4 (résiduels à signer).
- **Q3** : **close** — ligne « Secrets » corrigée ci-dessus.

## Signatures de l'utilisateur — 2026-10-02 (arrêt de fin de lot)

- **R3** (captures absentes hors ligne) et **R4** (installée mais ouverte dans un onglet) :
  **acceptés** par l'utilisateur (« J'accepte les deux »). `04` Q1 close ; `DEPLOIEMENT.md:121`,
  `:139` désormais exacts.
- **Prénoms « Kevin » / « Julien » publiés** via les captures : **accepté** (« Oui, ça me
  va »). `04` Q2 close.

## Rejeu — boucle 5, tour 2 (2026-10-02)

> `sec` relancé (opus, effort high du frontmatter). Rapport : `Security result: PASS`.

- **Aucune nouvelle surface** : `labels.ts` (chaînes et JSDoc seulement, import de type),
  `.gitattributes`, `CLAUDE.md` (une ligne § Environnement), `PROJECT_PLAN.md`, index, `.md`
  repassés en LF. `firebase.json`, `package*.json`, `vite.config.ts`, smoke inchangés dans le tour.
- **`.gitattributes` sans risque pour les binaires** : 17 `.png` suivis en `-text` ; 3 PNG non
  suivis de `public/screenshots/` en `binary: set` / `text: unset`, signature
  `89 50 4E 47 0D 0A 1A 0A` intacte ; aucune police ni `.ico` dans le dépôt ; SVG en texte LF ;
  287 fichiers texte `i/lf w/lf`, aucun CR.
- **Build et précache inchangés** : 47 entrées (782.16 KiB), smoke OK, aucune `screenshots`
  dans `dist/sw.js`, `dist/screenshots/*.png` identiques aux sources (`cmp`).
- **`git checkout --` sur 42 fichiers : rien de perdu** — `git diff --stat` toujours 17 fichiers,
  10 nouveaux fichiers toujours non suivis, `git stash list` vide, index et copie de travail en LF.
- **Constats** : aucun. Remarque : un futur binaire autre que `.png` (police, `.ico`, `.jpg`) ne
  serait couvert que par la détection de `text=auto` — ajouter une ligne `binary` le jour venu.
- **Risques acceptés** : uniquement ceux signés le 2026-10-02 (R3, R4, prénoms).
- **Questions ouvertes** : aucune.
