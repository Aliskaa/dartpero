# Lot `allegement-docs` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (opus, effort medium,
> maxTurns 100 — 64 appels d'outils, plafond non atteint) et du rapport du générateur
> `architecture-context` (sonnet / high). 2026-10-01.

> ⚠️ **Mise à jour après boucle 1 et Revue** (constat 3) : ce fichier décrit l'état **avant** la
> boucle 1. Depuis : `.ai` a été **retouché à la main par `dev`** (D1-D3), ce qui s'écarte de
> `01-architecture.md` § 4 (« `dev` ne l'écrit pas à la main ») — écart accepté pour trois
> corrections ponctuelles, journalisé dans `00-orchestration.md` ; taille finale **146 l. /
> 12 279 o.** ; plafond relevé par l'utilisateur à **≤ 160 l. / ≤ 13 312 o.** (les valeurs
> « 12 288 » et « 12 246 » ci-dessous sont celles du moment). Q2 ci-dessous : tranchée par
> l'utilisateur (plafond relevé). Q3 : laisser (P1).

## Ce qui a été implémenté

Lot de documentation pur : `git diff --stat main` ne liste que des `.md` (20 fichiers modifiés
+ `docs/DEPLOIEMENT.md` créé). Rien sous `src/`, `tests/`, `scripts/`, ni `firebase.json`,
`vite.config.ts`, `package.json`, `biome.json`, `tsconfig.json`. Ordre P1 respecté :
destinations, puis réduction de `CLAUDE.md`, puis briefs. Numéros de ligne de l'archi revérifiés
sur disque à `main` : exacts pour `CLAUDE.md`.

| Fichier | Nature du changement |
|---|---|
| `CLAUDE.md` | 5 sections réduites (Arborescence, Conventions de code, État d'avancement, Notes techniques, Déploiement). En-tête : ligne `docs/DEPLOIEMENT.md`, ligne `.ai` → « **Index** généré… il dit où lire », 2 lignes de note (§ 6). Lignes vides superflues après chaque `---` retirées (16, toutes hors blocs intacts). 15 titres `##` gardés dans l'ordre |
| `docs/DEPLOIEMENT.md` | **Créé** : bandeau de renvoi à la décision gravée + Mettre en ligne, Réécriture SPA, En-têtes de cache, Service worker et bundle, Contexte sécurisé (dev, téléphone, iOS), Icônes. Coupé mot pour mot ; seule correction : la commande (`+ smoke`, `package.json` l. 19) |
| `.claude/CONVENTIONS.md` | § 14 « Arborescence » (arbre mot pour mot, glyphe l. 273 réparé) ; § 11 +2 l. (`tests/setup.ts`, `fake-indexeddb/auto`) ; § 12 +1 l. (`vitest/config`) |
| `docs/PROJECT_PLAN.md` | § 0 : 3 lots post-audit + **339 tests**. § 4 : « Débrief et Lot D », « Fait » du Lot 0 (versions, « Testé au lot 0 puis retiré »), fragments Lot 2 et Lot 3, entrée Lot 3 bis, « relu à l'écran à 2 et 4 joueurs ». L. 287 → charte § Écran de match. § 6 : « Décisions du lot « allegement-docs » » |
| `docs/CHARTE_GRAPHIQUE.md` | § Typographie +1 l. (motif `@fontsource/<police>/latin-<poids>.css`, 542 → 406 Kio) |
| `.claude/rules/biome.md` l. 13, `rules/typescript.md` l. 6-7 | Citation : `CLAUDE.md` § Notes techniques → `biome.json` / `tsconfig.json` + `vite.config.ts` |
| `.claude/agents/architecture-context.md` | Réécrit (§ 3 archi) : pointer, jamais recopier ni résumer une règle de jeu, lecture sur disque, report des constats, plafond ≤ 150 l. / ≤ 12 288 o. mesuré, budgets, « jamais sacrifiés », 10 sections + `### Sécurité`, sources + `DEPLOIEMENT.md` et `CONVENTIONS` § 14 |
| `.claude/agents/{archi-scout,archi-designer,archi-authority,dev,test,sec,review,intake}.md` | Phrase canonique ; « source compactée » → « l'index, lu en premier ». `test.md` : lire la règle à sa source avant une assertion de bord. `review.md` : puce sur la croissance de `CLAUDE.md` (sinon constat **Dev**). `sec.md` : un seul bloc (`@@ -16,2 +16,5 @@`), checklist intacte |
| `.claude/skills/orchestrate/SKILL.md` | § Prérequis : phrase canonique, critère de péremption `git log -1 --format=%ct`, brief passé lu sur disque |
| `.claude/skills/refresh-architecture/SKILL.md` | « index », phrase canonique, plafond, brief lu sur disque |
| `.claude/skills/audit/SKILL.md` | L. 41 → `PROJECT_PLAN` § 0 / § 4 ; l. 44 → vraies sources ; l. 25 « compactage » → « index » |
| `.ai/README.md` | Réécrit : index, phrase canonique, sources, plafond |
| `.claude/README.md` | L. 31, 40 « Index » ; + ligne `docs/DEPLOIEMENT.md` ; mention § 14 |
| `.claude/rules/README.md` l. 5, `.claude/agents/audit.md` l. 23 | **Orchestrator** (questions dev 1 et 2, tranchées) : « compactage » → « index ». Correction de vocabulaire, pas de contenu nouveau : compatible P3 |
| `.ai/architecture-context.md` | **Régénéré par le générateur**, pas par `dev` (§ 4 archi) |

### Régénération de `.ai` (Q4)

- Le générateur a reçu **le brief lu sur disque, recopié dans le prompt** (la définition chargée
  en session pouvait être l'ancienne), avec obligation de lire les sources sur disque.
- **Plafond tenu au deuxième essai, dans le même passage** : premier jet 187 l. / 13 405 o.,
  final **146 lignes / 12 246 octets** (mesuré `wc -l -c` par l'Orchestrator). ⚠️ Marge de
  **42 octets** — cf. question 2.
- 10 sections + `### Sécurité` + table « Où lire quoi » ; 5 surfaces gravées reprises à
  l'identique d'`orchestrate` § Niveaux ; exceptions conservées (3 lignes fusionnées, contenu
  gardé) ; `grep` des énoncés interdits (`== 1`, `169, 168`, `supérieur ou égal`, `inférieur ou
  égal`, `moins de fléchettes`) : aucun résultat.
- Constats : **8** (3 moyenne, 4 basse, 1 info), revérifiés sur disque. Retirés (devenus faux) :
  « `CLAUDE.md` coche le 5b `[x]` » et « `CLAUDE.md` annonce 318 tests » — raisons en § Traçabilité.
- Charte et `PROJECT_PLAN` lus **par extraits** ; pièges `successPercent`, `ErrorBoundary`,
  `.gitattributes`, `Cible`, `nanoid` reportés **sans revérification** (dit en § Questions et
  limites de l'index).

## Table de correspondance

Lignes d'origine à `main` (`a00e9a8`), destinations au disque actuel.

**En-tête (1-17)**

| Origine | Destination | Nature | Preuve | Phrase-clé exacte |
|---|---|---|---|---|
| l. 1-12, 14-17 | `CLAUDE.md` en-tête | resté | `CLAUDE.md:1-10,12-13,15-18` (l. 11 est nouvelle — corrigé, D4) | `Contexte permanent du projet pour Claude.` |
| l. 13 (ligne `.ai`) | `CLAUDE.md` l. 14 | reformulé (§ 2-A archi) | `CLAUDE.md:14` | `**Index** généré, lu **en premier** par les agents de phase` |
| — (ajout) | `CLAUDE.md` l. 11 | nouvelle ligne de table | `CLAUDE.md:11` | `Le manuel du déploiement : Firebase Hosting` |
| — (ajout, § 6) | `CLAUDE.md` l. 19-20 | phrase gravée | `CLAUDE.md:19` | `Il ne garde que le résumé opérationnel, les décisions gravées et les pièges vitaux` |

**Arborescence (252-301)** — l. 252 (titre) resté ; l. 254-301 déplacées mot pour mot vers
`.claude/CONVENTIONS.md` l. 247-294 (une ligne d'origine → une ligne de destination, décalage
constant −7), sauf l. 273 : glyphe réparé (`│  │` → `│     │`, `PreviewVisit,`). Invariants
restés dans `CLAUDE.md` § Arborescence : `games/` + `index.ts` couture (l. 258-259),
`⚠️ TRANSVERSES : un mode n'importe jamais un autre mode` (l. 270, seule occurrence),
`container.ts   ← seul point de câblage` (l. 284), `games/ ← MÊME DÉCOUPAGE QUE LE DOMAINE`
(l. 289) ; rappels `backupSchema.ts` (l. 282), `dexie/ · device/ · memory/ · system/` (l. 283),
`PartieEcran` aiguille (l. 290).

| Origine | Destination | Phrase-clé exacte |
|---|---|---|
| 254 / 301 | CONV:247 / 294 | fence ` ``` ` |
| 255-257 | CONV:248-250 | `src/` · `core/` · `domain/` |
| 258 | CONV:251 | `games/           ← UN DOSSIER PAR MODE DE JEU` |
| 259 | CONV:252 | `index.ts      la couture : GameModeId, AnyMatchState, GameModes` |
| 260-263 | CONV:253-256 | `x01/          config · rules · stats · career` … `checkout-practice/ config · rules      (solo)` |
| 264-265 | CONV:257-258 | `value-objects/   Dart, Segment, Multiplier, Score, PlayerColor, ids` / `entities/        Visit, Player          (transverses aux modes)` |
| 266-268 | CONV:259-261 | `events/          MatchEvent : X01Started` · `CricketStarted` · `RoundStarted` / `VisitRecorded` |
| 269-270 | CONV:262-263 | `services/        dartSearch · checkout · visitOutcome · dartboardHits` / `⚠️ TRANSVERSES` |
| 271-272 | CONV:264-265 | `application/` / `ports/driving/   StartMatch, RestartMatch, RecordVisit, UndoLastVisit,` |
| 273 | CONV:266 | `PreviewVisit,` (glyphe réparé) |
| 274-279 | CONV:267-272 | `GetMatchState, GetCheckoutSuggestion,` … `PlayCheckoutPractice` |
| 280-282 | CONV:273-275 | `ports/driven/    MatchRepository, PlayerRepository, Clock, IdGenerator,` · `Haptics, ScreenLock, Preferences, RandomSource, Announcer` · `use-cases/       + backupSchema.ts (validation d'un JSON importé)` |
| 283-284 | CONV:276-277 | `dexie/ · device/ · memory/ · system/` / `container.ts   ← seul point de câblage` |
| 285-293 | CONV:278-286 | `ui/` … `NouvellePartie, Historique, Statistiques, Réglages` |
| 294-298 | CONV:287-291 | `hooks/              useX01 · useTourDuMonde · useCricket ·` … `theme.ts (clair / sombre / système) · accents.ts` |
| 299-300 | CONV:292-293 | `tests/                    domain/ · use-cases/ · infrastructure/ · architecture/ ·` / `fakes/ · ui/ (+ gestes.ts)` |

**Conventions de code (307-323)**

| Origine | Destination | Nature | Preuve | Phrase-clé exacte |
|---|---|---|---|---|
| l. 309-310 VO, `Dart.of`, `Score.of`, `readonly` | CONVENTIONS § 1 ; `rules/typescript` ; PLAN § 1.1 | doublon existant | `.claude/CONVENTIONS.md:33-36` ; `.claude/rules/typescript.md:10-11` ; `docs/PROJECT_PLAN.md:55-56` | `Une seule factory validante` / `Triple sur BULL interdit.` / `Rejette les négatifs.` |
| l. 311 branded | CONVENTIONS § 1 ; `rules/typescript` | doublon existant | `.claude/CONVENTIONS.md:37` ; `.claude/rules/typescript.md:12-13` | `Identifiants en **branded types**` |
| l. 312-313 use cases, pas de `new Dexie` | CONVENTIONS § 4, § 7 | doublon existant | `.claude/CONVENTIONS.md:74-75, 109` | `Le constructeur ne prend que les ports **driven**` / `**Seul fichier** qui a le droit de \`new\` un adapter.` |
| l. 314 ports ISP | `CLAUDE.md` § Conventions | resté | 1re puce | `Ports petits et ciblés (ISP)` |
| l. 315 fakes | `rules/testing` ; CONVENTIONS § 11 | doublon existant | `.claude/rules/testing.md:8-10` ; `.claude/CONVENTIONS.md:160` | `**Fakes, jamais de mocks**` |
| l. 316-317 `Date.now` / `Math.random` | `CLAUDE.md` § Règle d'architecture | doublon (bloc intact) | `CLAUDE.md` l. 112-113 à `main` | `` ni `Math.random` — ils passent par les ports `Clock` / `IdGenerator` `` |
| l. 318-319 langue | `CLAUDE.md` § Conventions | resté | 2e puce | `Langue : nommage **UI en français**` |
| l. 320-322 UI → use cases | `CLAUDE.md` § Conventions | resté | 3e puce | `**UI → use cases UNIQUEMENT.**` |
| l. 323 48 px | charte § Les trois planchers | doublon existant | `docs/CHARTE_GRAPHIQUE.md:36` | `**≥ 48 px** partout (\`min-h-12\`)` |
| — renvoi | `CLAUDE.md` | ajouté | dernière puce | `- → détail : Value Objects, branded types, use cases, fakes, 48 px` |

**État d'avancement (329-401)**

| Origine | Destination | Nature | Preuve | Phrase-clé exacte |
|---|---|---|---|---|
| l. 331 Débrief | PLAN § 4 « Débrief et Lot D » | déplacé mot pour mot | `docs/PROJECT_PLAN.md:224` | `nom, ambiance, modes, saisie, persistance, usage — tout tranché` |
| l. 332 Lot D | PLAN § 4 | déplacé mot pour mot | `docs/PROJECT_PLAN.md:225` | `✅ **Lot D** — \`CLAUDE.md\` +` |
| l. 333-336 Lot 0 | PLAN § 4 Lot 0 « Fait » | déplacé mot pour mot | `docs/PROJECT_PLAN.md:240-243` | `Scaffold : Vite 8 + React 19 + TS 7 + Tailwind 4 + Biome 2.5 + Vitest 4 +` |
| l. 337-340 Lot 1 | PLAN § 4 Lot 1 | doublon (`matchStats` renommé `computeX01Stats`, PLAN l. 831) | `docs/PROJECT_PLAN.md:258-259, 276, 278` | `✅ **Fait — 60 tests verts.**` |
| l. 341-344 Lot 2 | PLAN § 4 Lot 2 | doublon + fragment déplacé | `docs/PROJECT_PLAN.md:290-300` | `Livré : ports driving/driven, 9 use cases, adapters **Dexie** + **in-memory**` |
| l. 345-348 Lot 3 | PLAN § 4 Lot 3 | doublon + fragment déplacé | `docs/PROJECT_PLAN.md:324, 331` | `Routage React Router, \`QueryClient\` + \`ServicesProvider\` câblés.` |
| l. 349-352 Lot 3 bis | PLAN § 4 « Lot 3 bis » (nouveau) | déplacé mot pour mot | `docs/PROJECT_PLAN.md:335-341` (corrigé, D4) | `(matières, relief, cible SVG, avatars, animations ciblées + \`prefers-reduced-motion\`),` |
| l. 353-356 Lot 4 | PLAN § 4, § 6, § 3 | doublon | `docs/PROJECT_PLAN.md:347, 355-357, 755, 777, 198-201` (corrigé, D4) | `Migration Dexie **v1 → v2**` |
| l. 357-359 Lot 5a | PLAN § 4 | doublon | `docs/PROJECT_PLAN.md:369` | `✅ **Fait — 167 tests verts.**` |
| l. 360-362 Lot 5b | PLAN § 4, § 6 | doublon, **statut non tranché** (PLAN seul fait foi : 🟡) | `docs/PROJECT_PLAN.md:391, 866` | `🟡 **Livré à moitié — 201 tests verts.**` |
| l. 363-366 Lot 5c | PLAN § 4 | doublon | `docs/PROJECT_PLAN.md:414, 428-432` | `✅ **Fait — 248 tests verts**` |
| l. 367-370 Lot UX | PLAN § 4 | doublon | `docs/PROJECT_PLAN.md:445-449` | `S'y ajoutent « On remet ça » (nouveau port \`RestartMatch\`)` |
| l. 371-374 Lot visuel | PLAN § 4 | doublon | `docs/PROJECT_PLAN.md:464-471` | `✅ **Fait — 263 tests verts, aucun modifié**` |
| l. 375-381 usage a tranché | PLAN § 4 | doublon | `docs/PROJECT_PLAN.md:480-484` | `(−7 sur \`composeVisit\`, −2 sur la saisie rapide` |
| l. 382-387 après la partie | PLAN § 4, § 6 | doublon | `docs/PROJECT_PLAN.md:497-500, 1122` | `✅ **Fait — 275 tests verts.**` |
| l. 388-391 trois finitions | PLAN § 4, § 6 | doublon | `docs/PROJECT_PLAN.md:534-536, 1199` | `✅ **Fait — 301 tests verts.**` |
| l. 392-395 résumé feuille | PLAN § 4 | doublon + fragment déplacé | `docs/PROJECT_PLAN.md:516-518` | `à 2 et 4 joueurs.` |
| l. 396-400 thème clair | PLAN § 4, § 6 | doublon | `docs/PROJECT_PLAN.md:553, 559, 1277, 1319` | `✅ **Fait — 318 tests verts.**` / `1,84:1` |
| l. 401 Lot 6 | `CLAUDE.md` § État | resté | 1re puce | `un adapter, zéro refonte` |
| — renvoi | `CLAUDE.md` | ajouté | 2e puce | `- → détail : [PROJECT_PLAN](docs/PROJECT_PLAN.md) § 0` |

**Notes techniques (407-446)**

| Origine | Destination | Nature | Preuve | Phrase-clé exacte |
|---|---|---|---|---|
| l. 409-412 versions | PLAN § 4 Lot 0 | déplacé mot pour mot | `docs/PROJECT_PLAN.md:245-248` | `**Versions installées au lot 0 (août 2026)**` |
| l. 411 ancre `61b60ac` | `CLAUDE.md` § Notes ; PLAN § 4 | resté (composé, vérifié `git show --stat`) | 1re puce | `**L'incident \`61b60ac\`**` |
| l. 414-415 TS 7 | `rules/typescript` | doublon | `.claude/rules/typescript.md:5-7` | `pas de \`baseUrl\`` |
| l. 416 `vitest/config` | CONVENTIONS § 12 | déplacé mot pour mot | `.claude/CONVENTIONS.md:197` | `importe \`defineConfig\` depuis **\`vitest/config\`**` |
| l. 417-420 Biome 2.5 | `rules/biome` | doublon | `.claude/rules/biome.md:11-13` | `\`linter.rules.preset\` (pas \`recommended\`)` |
| l. 421-423 frontière | `rules/biome` + PLAN § 4 Lot 0 | doublon + historique | `.claude/rules/biome.md:14-19` ; `docs/PROJECT_PLAN.md:250-252` | `Testé au lot 0 puis retiré.` |
| l. 424-425 jsdom, `setup.ts` | `rules/testing` + CONVENTIONS § 11 | doublon + déplacé (complété d'après `tests/setup.ts` l. 2) | `.claude/rules/testing.md:6-7` ; `.claude/CONVENTIONS.md:182-183` | `\`cleanup()\` après chaque test` |
| l. 426-428 polices | charte § Typographie | doublon + ligne déplacée | `docs/CHARTE_GRAPHIQUE.md:148-150` | `**542 Kio → 406 Kio**` |
| l. 429-434 modes de dev | `DEPLOIEMENT.md` § Contexte sécurisé | déplacé mot pour mot | `docs/DEPLOIEMENT.md:67-72` | `localhost **est** un contexte sécurisé` |
| l. 435-436 iOS Safari | `DEPLOIEMENT.md` § Contexte sécurisé | déplacé mot pour mot | `docs/DEPLOIEMENT.md:73-74` | `Chrome iOS ne peut pas installer de PWA` |
| l. 437-438 Wake Lock | CONVENTIONS § 5 ; PLAN § 2 | doublon | `.claude/CONVENTIONS.md:91-93` ; `docs/PROJECT_PLAN.md:181` | `\`NullScreenLock\`` |
| l. 439-440 icônes, `sharp` | `DEPLOIEMENT.md` § Icônes | déplacé mot pour mot | `docs/DEPLOIEMENT.md:81-82` | `\`sharp\` est une **devDependency**, hors bundle client` |
| l. 441-446 Rolldown | `DEPLOIEMENT.md` § Service worker et bundle | déplacé mot pour mot | `docs/DEPLOIEMENT.md:58-63` | `\`vite:preloadError\`` |
| — renvoi | `CLAUDE.md` | ajouté | 2e puce | `- → détail : versions → \`PROJECT_PLAN\` § 4, Lot 0` |

**Déploiement (476-517)**

| Origine | Destination | Nature | Preuve | Phrase-clé exacte |
|---|---|---|---|---|
| l. 478-480 URL + commande | `DEPLOIEMENT.md` § Mettre en ligne ; `CLAUDE.md` | **corrigé d'après le code** + resté | `package.json:19` ; `docs/DEPLOIEMENT.md:12-14` | `(= \`build\` + \`smoke\` + \`firebase` |
| l. 482-486 Hosting seul | `DEPLOIEMENT.md` | déplacé mot pour mot | `docs/DEPLOIEMENT.md:16-20` | `**Hosting et rien d'autre.**` |
| l. 487-490 rewrite | `DEPLOIEMENT.md` § Réécriture SPA | déplacé mot pour mot | `docs/DEPLOIEMENT.md:24-27` | `est obligatoire** : sans lui` |
| l. 491-494 `max-age=3600` | `DEPLOIEMENT.md` ; `CLAUDE.md` (par coupe) | déplacé + resté | `docs/DEPLOIEMENT.md:31-34` | `Firebase pose \`max-age=3600\` sur *tout*` |
| l. 495-496 immutable | `DEPLOIEMENT.md` | déplacé mot pour mot | `docs/DEPLOIEMENT.md:35-36` | `\`max-age=31536000, immutable\`` |
| l. 497 `/icons/**` | `DEPLOIEMENT.md` | déplacé mot pour mot | `docs/DEPLOIEMENT.md:37` | `une semaine est le compromis` |
| l. 498-500 `no-cache` | `DEPLOIEMENT.md` | déplacé mot pour mot | `docs/DEPLOIEMENT.md:38-40` | `« revalide avant de servir »` |
| l. 501-503 dernière règle | `DEPLOIEMENT.md` ; `CLAUDE.md` | déplacé + resté mot pour mot | `docs/DEPLOIEMENT.md:41-43` | `**La dernière règle \`headers\` qui matche l'emporte**` |
| l. 504-505 chemin DEMANDÉ | `DEPLOIEMENT.md` | déplacé mot pour mot | `docs/DEPLOIEMENT.md:44-45` | `pas à la cible de la réécriture` |
| l. 506-508 iOS + HTTPS | `DEPLOIEMENT.md` § Contexte sécurisé | déplacé mot pour mot | `docs/DEPLOIEMENT.md:75-77` | `de Firebase règle en revanche` |
| l. 509-517 bundle par route | `DEPLOIEMENT.md` § Service worker et bundle | déplacé mot pour mot | `docs/DEPLOIEMENT.md:49-57` | `**Un écran ne se réimporte jamais` |
| — renvoi | `CLAUDE.md` | ajouté | dernière puce | `- → détail : réécriture SPA, en-têtes, service worker, iOS` |

### Tailles mesurées

- **`CLAUDE.md` : 338 lignes, 20 315 octets** (à `main` : 530 l., 34 092 o.) — plafond 340 tenu.
- **`.ai/architecture-context.md` : 146 lignes, 12 246 octets** (avant : 519 l., 42 270 o.).

| Section réduite | Taille (titre compris) | Budget | Respecté |
|---|---|---|---|
| Arborescence | 11 l. | ≤ 12 | oui |
| Conventions de code | 9 l. sous le titre | ≤ 9 | oui |
| État d'avancement | 4 l. | ≤ 5 | oui |
| Notes techniques | 7 l. | ≤ 8 | oui |
| Déploiement | 10 l. sous le titre | ≤ 10 | oui |

T2 vérifié par `dev` (`git diff -U0 main -- CLAUDE.md`) : aucun bloc modifié ne recoupe les blocs
intacts ; seules les lignes vides 37-38, 102-103, 124-125, 230-231, 251, 460 et les sections
réduites sont touchées.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Commande de déploiement corrigée (`+ smoke`, `smoke` = `node scripts/smoke-build.mjs`) dans `DEPLOIEMENT.md` et `CLAUDE.md` | Ajustement | Prévu par l'archi (constat 5) ; `package.json` l. 11, 19 |
| CONVENTIONS § 11 cite aussi `fake-indexeddb/auto` | Ajustement | Prévu par l'archi ; `tests/setup.ts` l. 2 |
| Fragment unique en plus : « relu à l'écran à 2 et 4 joueurs » → PLAN § 4 | Ajustement | Absent de PLAN, aurait été perdu |
| Lignes vides superflues entre sections retirées pour tenir 340 | Ajustement | `---` conservés (Q1) ; hors blocs intacts |
| `.claude/README.md` : + ligne `DEPLOIEMENT.md` et mention § 14 | Ajustement | Cohérence de la table « Où vit quoi » |
| Archi : « `Dart.of`/`Score.of` PLAN l. 53-54 » → en réalité **l. 55-56** | Ajustement | Q3 : vérifié à la ligne, l'erreur était dans l'archi |
| `.claude/rules/README.md` l. 5 et `agents/audit.md` l. 23 : « compactage » → « index » | Ajustement (Orchestrator) | Questions dev 1-2, tranchées : vocabulaire, aucun contenu ajouté à `rules/` |

Aucune *Refonte nécessaire*.

**Q2** — `git show --stat 61b60ac` : react-router 7.18.2 → 8.3.0 (`package.json`) **et**
suppression de `src/ui/composants/x01/PaveRapide.tsx` (−217 l.). L'ancre ne dit que ce que disent
`CLAUDE.md` l. 411 (`main`) et PLAN (« par accident », « restauré depuis `cc8faf7` »). Le renvoi
« l'incident `61b60ac` plus bas » des Décisions structurantes tient. **Close.**

**Q3** — Chaque doublon ouvert à la ligne citée ; seule erreur : PLAN l. 55-56 (cf. écarts).
**Close.**

**Q4** — Consigné ci-dessus (brief passé lu sur disque ; plafond au 2e essai du même passage).
**Close.**

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | Vert — « Checked 200 files… No fixes applied. » |
| `npm run typecheck` | Vert |
| `npm test` | Vert — **33 fichiers, 339 tests** (= PLAN § 0) |

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Statut du lot 5b (`[x]` jadis dans `CLAUDE.md` vs 🟡 PLAN) : non tranché, PLAN seul fait foi désormais. À confirmer que rien d'autre ne le contredit. | Test |
| 2 | `.ai` tient à **42 octets** du plafond : une régénération future débordera probablement. Faut-il relever le plafond (ex. 13 Ko / 160 l.) ou l'accepter tel quel ? | Revue / Utilisateur |
| 3 | `docs/DEPLOIEMENT.md` l. 73-77 contient deux puces iOS voisines (l'une venue de § Notes techniques, l'autre de § Déploiement) — fidèle aux deux origines, mais redondant. Fusionner ou laisser ? | Revue |
| 4 | Exécuter T1-T10 de `01-architecture.md` § 5 sur disque et rapporter les tailles. | Test |
