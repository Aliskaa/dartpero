# Contexte d'architecture

> Document **généré**, compactage de sources. Ce n'est **pas** une source de vérité :
> en cas de désaccord, code récent, puis `CLAUDE.md`, puis `CONVENTIONS`, puis `rules/`
> (`rules/README.md`). S'il diverge : on le régénère (`/refresh-architecture`), on ne le suit pas.

## Objet et périmètre

- **Date de génération** : 2026-09-30.
- **Hint de scope** : `all` (produit, domaine, persistance, UI/charte, déploiement, outillage).
- **Sources lues intégralement** : `CLAUDE.md`, `.claude/CONVENTIONS.md`, les 12 fichiers de
  `.claude/rules/` (README, response-policy, documentation-language, glossary, prospective,
  commit, biome, typescript, testing, persistence, frontend-react, theme-colors),
  `docs/CHARTE_GRAPHIQUE.md`, `.claude/skills/orchestrate/SKILL.md` (pour les surfaces gravées).
- **Sources partielles** : `docs/PROJECT_PLAN.md` (§ 0, § 1.3-1.4, lots 5a/5b, § 6 : lot 1, 2, 3, 4,
  5b, 5c, UX, thème clair, trois lots post-audit). Il donne l'historique, **pas** les décisions.
- **Code** : seul `src/infrastructure/dexie/database.ts` a été consulté (`grep version(`) ;
  rien d'autre. Ce document décrit donc la **doc**, pas le code vérifié.
- **Fichiers du working tree non commités au moment de la lecture** (`git status` : `CLAUDE.md`,
  `CONVENTIONS`, `.claude/**` modifiés). Lu tel quel sur disque.

## Inventaire

Statuts : **en vigueur** · **renversée** (décision prise puis retirée, ne plus l'appliquer) ·
**tranchée** (décision ouverte résolue).

| # | Décision | Statut | Source |
| - | -------- | ------ | ------ |
| 1 | PWA, pas d'app native (iPhone + Android, « Ajouter à l'écran d'accueil ») | en vigueur | CLAUDE.md § Décisions structurantes |
| 2 | Hexagonal (Ports & Adapters) + SOLID, exigence forte | en vigueur | CLAUDE.md § Décisions structurantes, § Règle d'architecture |
| 3 | Pas de Firebase **dans l'app**, pas d'auth, pas de réseau ; persistance Dexie derrière `MatchRepository` / `PlayerRepository` | en vigueur | CLAUDE.md § Décisions structurantes |
| 4 | Firebase **Hosting** seul, comme serveur de fichiers statiques | en vigueur (exception déclarée) | CLAUDE.md § Décisions structurantes, § Déploiement |
| 5 | Joueurs = profils locaux (pseudo + couleur), pas des comptes ; export/import JSON | en vigueur | CLAUDE.md § Décisions structurantes |
| 6 | Match = liste d'événements `MatchEvent[]`, état = projection rejouée ; annulation = rejeu sans le dernier | en vigueur | CLAUDE.md § Décisions structurantes ; PLAN § 1.3 |
| 7 | Saisie fléchette par fléchette **et elle seule**, bascule S/D/T momentanée | en vigueur | CLAUDE.md § Décisions structurantes |
| 8 | « Saisie hybride » / **mode rapide** (score de volée 0-180) | **renversée** — retirée après usage réel ; remplacée par la saisie fléchette par fléchette seule | CLAUDE.md § Décisions structurantes (incident `61b60ac`, récupérable à `d531a7e`) |
| 9 | « Best of N » legs | **renversée** — remplacée par « premier à N legs » (`legsToWin`, `libelleLegs` / `libelleLegsCourt`) | CLAUDE.md § Décisions structurantes ; rules/glossary |
| 10 | Modes : X01, Tour du monde, entraînement solo (checkout), Cricket ; Killer / Shanghai hors v1 | en vigueur | CLAUDE.md § Décisions structurantes |
| 11 | X01 par défaut : 501, 2 legs à gagner, double out actif, double in inactif (modifiables) | en vigueur | CLAUDE.md § Décisions structurantes |
| 12 | Thème clair / sombre / système ; défaut **sombre** | en vigueur | CLAUDE.md § Décisions structurantes ; CHARTE § Les deux thèmes |
| 13 | TypeScript partout ; stack figée (React 19, Vite, React Router, TanStack Query, Tailwind v4, Dexie, Vitest, lucide-react) | en vigueur | CLAUDE.md § Décisions structurantes |
| 14 | TanStack Query n'orchestre **pas** le match en cours (état local synchrone, `useReducer` + Context) | en vigueur | CLAUDE.md § Décisions structurantes ; CONVENTIONS § 10 |
| 15 | Biome seul (jamais ESLint ni Prettier) | en vigueur | CLAUDE.md § Décisions structurantes ; rules/biome |
| 16 | Wake Lock obligatoire pendant une partie (null-object si indisponible) | en vigueur | CLAUDE.md § Décisions structurantes, § Notes techniques |
| 17 | Charte « feuille de match » : angle vif, zéro dégradé de décor, 2 zones (lecture / saisie) | en vigueur | CLAUDE.md § Charte ; CHARTE § Principe directeur |
| 18 | Alfa Slab One conservée mais réservée à l'enseigne et au vainqueur | tranchée (lot 3 bis) | CLAUDE.md § Décisions ouvertes n° 1 |
| 19 | Mode paysage automatique, conditionné à la hauteur (`DispositionPartie`) | tranchée (lot 5c) | CLAUDE.md § Décisions ouvertes n° 2 |
| 20 | Cricket | tranchée (livré lot 5c) | CLAUDE.md § Décisions ouvertes n° 3 |
| 21 | Bundle découpé par route (`React.lazy`), groupe vendor | en vigueur | CLAUDE.md § Déploiement ; CONVENTIONS § 13 |
| 22 | Sync cloud / classement ; i18n ; autres jeux fun | **ouvertes** | CLAUDE.md § Décisions ouvertes n° 3-5 |

## Guidage opérationnel

### Produit et contexte d'usage

- PWA mobile, **compteur de parties de fléchettes entre potes**, 100 % local, hors ligne, sans
  compte. Nom affiché **Dartpéro**, slug `dartpero`. (CLAUDE.md § Le projet en une phrase)
- Le téléphone est **posé** ; un joueur tape à 30 cm, les autres lisent à **2-3 m**, souvent en
  garage ou cave mal éclairés, sans réseau. **Lisibilité à distance** et **zéro friction au
  démarrage** priment sur tout. (CLAUDE.md § Le projet ; CHARTE § Contexte d'usage)
- Échelle : usage perso + potes, parc mixte iPhone + Android ; test réel sur iPhone avant de
  considérer le projet fini. (CLAUDE.md § Environnement)
- Une capacité externe nouvelle (voix, vibration, cloud, capteur) = **un nouvel adapter derrière
  un port**, jamais une dépendance du cœur. (CLAUDE.md § Règle d'architecture)

### Architecture

- Dépendances vers l'intérieur : `ui / infrastructure → application (ports + use cases) →
  domain`. (CLAUDE.md § Règle d'architecture)
- `src/core/domain/` : **0 import externe** — ni React, ni Dexie, ni API navigateur, ni `Date`,
  ni `Math.random` (ports `Clock` / `IdGenerator` / `RandomSource`).
- `src/core/application/` : importe uniquement `domain`, définit les ports.
- `src/infrastructure/` et `src/ui/` implémentent / consomment les ports. Câblage **uniquement**
  dans `src/composition/container.ts`, seul fichier autorisé à `new` un adapter.
  (CONVENTIONS § 7)
- Dans `src/core/**` : imports **toujours relatifs** ; ailleurs, alias `@/` depuis `src/`.
  Vérifié par `tests/architecture/hexagonalBoundary.test.ts`. (CONVENTIONS § 8 ; rules/typescript)
- **UI → use cases uniquement**, via `useServices()`. Jamais Dexie, jamais une règle de jeu
  réimplémentée : pour anticiper, un port de prévisualisation synchrone et pur (`PreviewVisit`,
  `PreviewCricketVisit`, `PreviewTourDuMondeVisit`). (CLAUDE.md § Conventions de code ;
  rules/frontend-react ; CONVENTIONS § 4)
- **La couture `GameMode`** (`src/core/domain/games/index.ts`) : aucun dénominateur commun
  artificiel ; elle ne fait qu'aiguiller sur le discriminant `mode`, TypeScript garantit
  l'exhaustivité. Un mode = un dossier `domain/games/<mode>/`, un événement d'ouverture, un module
  de règles, trois lignes par aiguillage, un dossier `ui/composants/<mode>/`, un écran de jeu et un
  résumé, **plus** leurs `lazy()` dans `PartieEcran.tsx` (et `App.tsx` pour un écran de lancement).
  (CONVENTIONS § 13)
- **Un mode n'importe jamais un autre mode** (domaine comme composants) : d'où les services
  **transverses** `resolveVisit`, `suggestCheckout`, `dartSearch`, `dartboardHits` dans
  `domain/services/`. Garde d'architecture. (CLAUDE.md § Arborescence ; PLAN lot 5a / 5b)
- **Le mode se lit sur le PREMIER événement du journal**, via un événement d'ouverture propre
  (`MatchStarted` pour X01, `TourDuMondeStarted`, `CricketStarted`, `CheckoutPracticeStarted`),
  **jamais** via un champ `mode` : les parties d'avant le lot 5a restent rejouables pour toujours
  en X01. `VisitRecorded` est **partagé** par tous les modes. `MatchSummary` est une union
  discriminée, ouverte **uniquement** par `ApercuPartie`. (CONVENTIONS § 13)
- Une seule URL par partie (`/partie/:id`) ; `PartieEcran` aiguille vers l'écran du mode.
  (CONVENTIONS § 13)
- Use cases : une classe par fichier, `implements <PortDriving>`, dépendances injectées par
  constructeur (dépôts, puis `Clock`, puis `IdGenerator` / `RandomSource`), **une** méthode
  `execute` toujours `async`. **Règles avant écriture** : projeter, appliquer les règles (qui
  lèvent si illégal), **seulement alors** ajouter l'événement et sauver. (CONVENTIONS § 4)
- Ports : petits et ciblés (ISP), lecture séparée de l'écriture ; port driven = une capacité ;
  certains ont un **null-object** (`NullHaptics`, `NullScreenLock`, `NullAnnouncer`).
  Une modification de profil est toujours **partielle** (`PlayerChanges`). (CONVENTIONS § 5)
- Adapters Dexie : prennent `db` par constructeur, traduisent via un mapper privé `versX`, noms
  de méthode identiques à ceux du port. (CONVENTIONS § 6)
- `DomainError` = usage **impossible** ; un bust ou un checkout sont des **données**
  (`VisitOutcome`), jamais des exceptions. (CONVENTIONS § 2)
- Value Objects : un `type` et un `const` du même nom, une factory validante qui **rejette**
  (`Dart.of`, `Score.of`), `readonly` partout, ids en **branded types**, listes fermées `as const`.
  (CLAUDE.md § Conventions de code ; CONVENTIONS § 1 ; rules/typescript)
- Nommage : UI en français (`composants/`, `ecrans/`, props), cœur en anglais sur la **surface
  exportée** (les privées / locales peuvent être françaises). (CONVENTIONS § 1)

### Règles de jeu

Spécification du domaine : **ne jamais improviser une règle** ; elle est écrite ici ou elle
n'existe pas et on demande. (CLAUDE.md § Règles du jeu ; rules/response-policy) Elles doivent être
couvertes par des tests.

#### Fléchette (commun)

- Segments : `1..20`, `BULL_SIMPLE` (25), `BULL_DOUBLE` (50). Multiplicateurs : simple / double /
  triple. **Le triple est interdit sur le bull.** Le `BULL_DOUBLE` (50) **compte comme un double**
  pour la sortie. (CLAUDE.md § Règles du jeu X01)
- Une volée (*visit*) = **3 fléchettes maximum**, stoppée avant si le joueur sort (checkout) ou si
  la volée est annulée (bust). (CLAUDE.md § Règles du jeu X01)
- Touche `0` du pavé = `MISS` : un miss n'a ni double ni triple. Pas de touche « Bull » : c'est
  DOUBLE + 25 ; en TRIPLE la touche 25 se grise. (CHARTE § Saisie)

#### X01 (501 / 301 / 701) — CLAUDE.md § Règles du jeu X01

- **Bust — la volée entière est annulée, le score revient à sa valeur d'avant la visite** quand :
  reste `< 0`, **ou** reste `== 1` (impossible à finir sur un double), **ou** reste `== 0` sans que
  la **dernière** fléchette soit un double (quand `double out` est actif).
- **`double out`** : actif par défaut, obligatoire pour finir un leg.
- **`double in`** : inactif par défaut. S'il est actif, le score ne décompte qu'à partir de la
  première fléchette qui touche un double. Un bust annule **aussi** l'ouverture du double in (la
  volée entière est annulée) — lecture délibérée, testée. (PLAN § 6 lot 1)
- **Checkout maximum = 170** (T20 · T20 · Bull). **Bogey numbers** (aucun finish en 3
  fléchettes) : **169, 168, 166, 165, 163, 162, 159** — l'app affiche « pas de finish » et
  **jamais** une suggestion bidon. La suggestion s'affiche dès que le reste est `≤ 170`.
  La route proposée est valide et la plus courte, mais **heuristique** : elle peut différer de la
  table PDC (99 → `T20 S7 D16`, en table `T19 S10 D16`). (PLAN § 6 lot 1)
- **Leg** gagné par celui qui atteint **exactement 0** avec un double (double out actif). Le
  joueur qui commence **alterne à chaque leg**. Un match se gagne au « **premier à N legs** »
  (`legsToWin`, défaut 2) — jamais « best of N » (décision renversée, voir Inventaire n° 9) ;
  éventuellement groupés en sets. (CLAUDE.md § Décisions structurantes et § Règles du jeu)
- **Statistiques** :
  - **Moyenne 3 fléchettes** = `(points marqués ÷ fléchettes lancées) × 3`. ⚠️ Une volée *busted*
    marque **0 point** mais ses fléchettes **sont comptées**.
  - **First 9** = moyenne sur les 9 premières fléchettes d'un leg (le PLAN § 6 lot 1 dit « les 3
    premières volées » — voir Constats).
  - **% doubles (checkout %)** = doubles gagnants réussis ÷ tentatives de double. Une tentative =
    toute fléchette lancée depuis un reste qu'une seule fléchette peut clore (pair ≤ 40, ou 50)
    (PLAN § 6 lot 1). En `doubleOut: false`, `doubleAttempts` vaut 0 pour tous.
  - Compteurs **180, 140+, 100+, 60+** — cumulatifs (un 180 compte aussi en 140+/100+/60+, PLAN).
  - **Meilleur leg** = plus petit nombre de fléchettes pour finir un leg ; **plus haut checkout**
    du match / du joueur.
  - Moyennes de carrière recalculées depuis les **totaux bruts**, jamais une moyenne de moyennes.
    (PLAN § 6 lot 4)
  - Les stats de carrière **restent au X01** : Tour du monde et Cricket en sont écartés plutôt que
    d'y injecter des zéros trompeurs. (CONVENTIONS § 13)

#### Tour du monde — CLAUDE.md § Règles du Tour du monde

- **Parcours** : on part du **20**, on descend 19, 18… jusqu'au **1**, puis la **bulle** — 21
  cibles. La liste vit dans la config, donc dans le journal.
- **Toucher, c'est atteindre le secteur** : simple, double ou triple, aucune différence. La bulle
  est validée **aussi bien** par l'anneau à 25 que par le centre à 50. Un `MISS` ne vaut jamais.
- Une volée fait **3 fléchettes** ; on avance à **chaque** touche (trois cibles possibles dans la
  même volée). La volée **s'arrête sur la fléchette qui boucle le tour**, comme une volée de
  checkout au X01.
- ⚠️ **On finit le tour de table** : quand un joueur boucle, la partie ne s'arrête pas ; les autres
  jouent leur volée pour que tout le monde ait eu le même nombre de fléchettes.
- **Départage** : parmi ceux qui ont bouclé, celui qui y a mis le **moins de fléchettes**. À
  égalité parfaite, **match nul** — pas de départage au hasard ni à l'ordre de passage.
- Ni leg, ni set, ni bust : un seul parcours.
- Le pavé n'a **pas** de bascule S/D/T (les fléchettes enregistrées sont des simples).
  (CONVENTIONS § 13)
- Pièges documentés : `PreviewTourDuMondeVisit` lit `complete` sur la volée que l'aperçu vient
  d'ajouter (`targetIndexAfter >= config.targets.length`), **jamais** sur `state.finished` (la
  formule du Cricket ferait perdre deux fléchettes au dernier tour de table). (PLAN § 6 lot
  « tour-du-monde-cloture-volee »)

#### Cricket — CLAUDE.md § Règles du Cricket

- **Sept cibles** : **20, 19, 18, 17, 16, 15 et la bulle** ; liste dans la config (donc le journal).
- **Trois marques ferment une cible** : simple = 1, double = 2, triple = 3 (un T20 ferme le 20 d'un
  coup). Les marques d'une même volée se cumulent. Elles sont posées **une par une** : un triple
  peut finir de fermer une cible **et** marquer avec le surplus. (PLAN § 6 lot 5c)
- **Le surplus marque des points, mais seulement si la cible est encore ouverte chez au moins un
  adversaire.** Fermer le 20 avec T20+T20 quand tout le monde l'a fermé ne rapporte rien (voulu).
- ⚠️ **Une fléchette hors des sept cibles ne vaut rien** — ni marque, ni point (le 12 n'existe pas).
- **Pas de bust** ; la volée fait toujours 3 fléchettes, sauf celle qui gagne la partie.
- **Victoire (standard)** : le premier joueur qui a **fermé les sept cibles** ET possède un score
  **supérieur ou égal** à celui de chaque adversaire. Fermer tout en étant mené ne gagne pas.
- ⚠️ **Variante cut-throat** : les points s'ajoutent aux **ADVERSAIRES**, pas à soi ; **le plus
  petit score gagne** : on l'emporte en ayant fermé les sept cibles avec un score **inférieur ou
  égal** à chacun. C'est la seule règle où le sens de la comparaison s'inverse (testée des deux
  côtés).
- Un seul tour de table : ni leg, ni set. **On ne finit PAS le tour de table** (contrairement au
  Tour du monde) : la condition de victoire exige déjà d'être devant aux points.
- La victoire est vérifiée pour **tous** les joueurs à la fin d'une volée, pas seulement le
  lanceur (cut-throat : on peut devenir le plus bas pendant le tour d'un autre). La variante est
  choisie à la création et vit dans la config. Pavé : les sept cibles + `0` + `Annuler`, bascule
  S/D/T conservée. (PLAN § 6 lot 5c)

#### Entraînement au checkout (solo) — **peu spécifié dans CLAUDE.md**

CLAUDE.md ne contient **pas** de section de règles pour ce mode. Ce qui est documenté ailleurs
(PLAN § 6 lot 5b, CONVENTIONS § 4, glossary) :

- Mode solo d'entraînement à la sortie, `checkout-practice` ; une manche = **une seule volée**.
- Le reste à finir est **tiré au hasard** via le port `RandomSource` et **écrit dans le journal**
  (`RoundStarted { target }`), **jamais retiré au rejeu** : annuler une volée ne doit pas pouvoir
  redistribuer un reste plus facile. Un entraînement relancé **retire** ses cibles.
- Les restes jouables sont **calculés** (ceux qu'une route de 3 fléchettes peut clore), donc les
  bogey numbers s'excluent seuls, sans liste codée en dur. (La plage « 41 à 170 » n'apparaît que
  dans l'énoncé de planification du lot 5b : **non confirmée** comme règle finale.)
- La manche est jugée par **exactement la même fonction** `resolveVisit` que le X01 (mêmes
  règles de bust, double out). C'est une partie comme une autre : même dépôt, historique,
  sauvegarde.

### Persistance et journal

- Dexie derrière `MatchRepository` / `PlayerRepository`, **nulle part ailleurs**. (rules/persistence)
- **Journal = faits bruts** : `X01Started` (discriminant persisté `'MatchStarted'`),
  `TourDuMondeStarted`, `CricketStarted`, `CheckoutPracticeStarted`, `RoundStarted`,
  `VisitRecorded`. `LegWon` / `SetWon` / `MatchFinished` sont **déduits** (`X01Milestone`), jamais
  persistés. `VisitRecorded` ne porte pas de `playerId`. `Visit` n'est pas stockée. (PLAN § 1.3)
- **On ajoute un événement, on ne réécrit pas le passé.** Ce qui est tiré au sort est **écrit**,
  jamais recalculé au rejeu. (rules/persistence)
- ⚠️ **Une valeur persistée ne se renomme pas** : on corrige le nom du **type** (`X01Started`),
  jamais la valeur sur disque (`'MatchStarted'`). (rules/persistence ; PLAN § 1.3)
- `MatchRecord` ne persiste que `id`, `createdAt`, `updatedAt`, `events` ; vainqueur et scores se
  rejouent. Dates via `Clock`. (PLAN § 6 lot 2)
- Changement de schéma = nouvelle `db.version(N)` avec son `upgrade` (`database.ts`) **et** un
  test de migration (v1 → v2 en modèle, sur vraie base v1). Une migration ne jette pas de données
  sans filet. (rules/persistence) — le code contient bien `version(1)` et `version(2)`.
- Changement de format d'événement ou de profil = `backupSchema` mis à jour **dans le même lot** ;
  une sauvegarde antérieure doit toujours s'importer. Le test de sauvegarde exporte **une partie de
  chaque mode** puis les relit. (rules/persistence ; PLAN lot 5c)
- **L'import JSON** est la **seule entrée non fiable** : validé entièrement avant toute écriture,
  via les fabriques du domaine (un triple bull trafiqué est refusé), il **fusionne** (jamais ne
  remplace), ignore-et-compte les entrées illisibles (`ImportReport`). Lire/écrire le fichier
  reste dans l'UI (`ReglagesEcran`), ce n'est pas un port. (rules/persistence ; PLAN lot 4)
- `localStorage` : **préférences d'appareil seulement** (`LocalStoragePreferences`, amorçage du
  thème). Jamais une donnée de partie ou de joueur. Tout accès `localStorage` / `sessionStorage`
  est enveloppé de `try`/`catch` (navigation privée). (rules/persistence ; PLAN lot bundle)
- La volée **en cours** n'est pas persistée : état local, envoyée à `RecordVisit` à sa clôture.
  (PLAN lot 3)
- Un profil supprimé ne supprime pas ses parties (`name: null`, l'UI affiche « Joueur
  supprimé »). Suppression en deux temps (profil comme partie). (PLAN lots 2, 4)
- La couleur de profil est une teinte **symbolique** (`PlayerColor`, 8 noms fermés) ; la
  traduction en pixels vit seulement dans `src/ui/couleurs.ts`. (PLAN lot 4 ; CHARTE)

### Sécurité

Pas de document de sécurité dédié dans les sources lues ; ce qui suit est ce qu'elles posent :

- **Aucun réseau, aucun compte, aucun secret** dans l'app ; aucun `import` de `firebase` dans
  `src/`, jamais. (CLAUDE.md § Décisions structurantes)
- **Seule entrée non fiable : l'import JSON** ; validation complète avant écriture.
  (rules/persistence)
- Frontière hexagonale imposée par Biome (`noRestrictedImports` sur `src/core/**` : `react`,
  `react-dom`, `react-router`, `@tanstack/react-query`, `lucide-react`, `dexie`, `sharp`) **et** par
  `tests/architecture/hexagonalBoundary.test.ts`. (rules/biome)
- `npm audit` : nanoid < 3.3.18, tirée par `vite → postcss`, **hors bundle client**. (PLAN § 4 lot UX)
- `sharp` et `firebase-tools` ne sont pas des dépendances du bundle (`sharp` devDep ;
  `firebase-tools` globale). (CLAUDE.md § Notes techniques, § Déploiement)
- Rappel : la baseline sécu des agents d'architecture ne remplace pas la phase `sec`.
  (orchestrate § Ce que tu ne refais pas)

### Conventions

- **Fakes, jamais de mocks** (`tests/fakes/index.ts` : `TickingClock`, `SettableClock`,
  `SequentialIdGenerator`, `CyclingRandomSource`, `fakeServices` qui enveloppe le **vrai**
  `createServices`). Vitest + jsdom, `tests/**/*.test.{ts,tsx}`. (CONVENTIONS § 11 ; rules/testing)
- `describe` / `it` **en français**, au plus près de la règle de CLAUDE.md. Tests UI : `getByRole`,
  `tests/ui/gestes.ts`, `renderWithServices`. (CONVENTIONS § 11)
- ⚠️ **Un test qui vérifie une absence doit pouvoir échouer** (plancher de fichiers/imports).
  Cas de bord attendus : bust (<0, =1, =0 sans double), bogey numbers, annulation + rejeu à froid
  (le tirage survit), égalité / match nul, joueur supprimé, base vide, vieille sauvegarde.
  (rules/testing)
- ⚠️ Ce qui ne se voit qu'à l'écran (glyphe rogné, contraste, troncature) **ne se voit pas en
  test** : le dire comme angle mort. (rules/testing ; CHARTE § Vérifier à l'écran)
- Commentaires : le **pourquoi**, jamais le quoi ; `⚠️` pour un piège ; densité à **préserver**.
  (CONVENTIONS § 3)
- Tailwind : classes **statiques**, composées via `Record<Variante, string>`. (CONVENTIONS § 9)
- Biome : guillemets simples (doubles en JSX), pas de `;` (`asNeeded`), virgules finales, 100
  colonnes ; `organizeImports` au `lint:fix`. `npm run lint`, `typecheck`, `npm test` verts = plancher.
  (CONVENTIONS § 12 ; rules/biome)
- TypeScript 7 : **pas de `baseUrl`**, alias `@/*` relatif `"./src/*"` doublé dans `vite.config.ts`
  (qui importe `defineConfig` de `vitest/config`). (CLAUDE.md § Notes techniques)
- Documentation en **français** ; identifiants, commandes, chemins inchangés. (rules/documentation-language)
- Glossaire : « premier à N legs », jamais « best of N » ; 50 = double ; `oche` = contexte d'usage,
  pas un objet du code. (rules/glossary)
- **Commits** : **demander l'accord** avant de committer ; **un commit par lot** ; `git status`
  avant d'indexer, jamais `git add -A` à l'aveugle (`docs/exemples/` est hors dépôt) ; Conventional
  Commits `type(scope): sujet` en français, < 72 car., sans point final ; pas de push (pas de
  remote). (rules/commit)
- Prospective : étude sans implémentation = fichiers **uniquement** dans `docs/prospective/`,
  nommage `YYYY-MM-DD-{NEW|PARTIAL|DONE}-titre-kebab.md`. (rules/prospective)
- Incertitude : il est acceptable de ne pas savoir, ne rien inventer. (rules/response-policy)

### Front et charte

- **Décor = structure** (la fiche de ligue), **zéro dégradé de décor, zéro biseau, zéro angle
  arrondi**. Point de contrôle unique de l'angle vif : tokens `--radius-*` = `0` dans `@theme` **et**
  aucune classe `rounded-*` dans `src/ui` (les deux ensemble). (CLAUDE.md § Charte ; CHARTE § Principe)
- **Trois planchers** : aucun texte sous `craie/60` ; cibles tactiles **≥ 48 px** (`min-h-12`),
  y compris en paysage ; `--radius-*` = 0. (CHARTE § Les trois planchers)
- **Écran de match** : deux zones séparées (lecture géante / saisie), **jamais empilées en
  paysage**. Une ligne par joueur, toujours ; `GRILLE_LIGNE` = définition unique de colonnes.
  Barre de navigation **absente** pendant une partie et sur la configuration. (CHARTE § Écran de
  match)
- **Paysage** : `@custom-variant paysage (@media (orientation: landscape) and (max-height: 34rem))` —
  hauteur **et** orientation ; porté par `DispositionPartie` pour les 4 modes ; `orientation: 'any'`
  dans le manifeste ; pas de bouton de rotation. (CHARTE ; PLAN lot 5c)
- **Couleurs : tokens uniquement** (`text-craie`, `bg-laiton`…) ; hex interdit dans `src/ui`
  (`tests/architecture/themeBoundary.test.ts`). Les tokens s'emploient **en paires de rôle** ; le
  thème clair ne redéfinit que les **valeurs** sous `html[data-theme="clair"]`, **sans toucher une
  classe**. Un token a toujours sa valeur sombre dans `@theme`. Nouvelle couleur : token **avec sa
  valeur claire**, contraste vérifié dans **les deux** thèmes (laiton à 1,84:1 sur papier avant
  correction). Les accents de mode vivent en `--accent-*` dans `index.css` ; `accents.ts` ne
  distribue que des `var()`. (rules/theme-colors ; CHARTE)
- **Thème** : `src/ui/theme.ts` est **le seul écrivain de `data-theme`** ; script d'amorçage dans
  `index.html` = doublon assumé (clé `dartpero:theme` et teintes à garder d'accord à la main) ; la
  préférence est relue à chaque bascule système. Le `theme_color` du manifeste reste figé (limite du
  format). (CHARTE ; PLAN lot thème clair)
- **Typographie** : Alfa Slab One = enseigne + vainqueur (2-3 mots), Oswald = chiffres / titres /
  boutons, Barlow = corps. Polices `@fontsource`, sous-ensemble **latin** uniquement.
- **Saisie** : bascule S/D/T **momentanée**, retombe sur Simple après chaque fléchette. Bouton
  « Annuler » à deux étiquettes `{ court, complet }` (le court contenu dans le complet, WCAG 2.5.3).
  Valeur réelle en exposant (badge `aria-hidden`). (CHARTE § Saisie)
- **Accessibilité** : un chiffre qui change vit dans un `<output aria-label>` ; icônes `lucide-react`
  toujours `aria-hidden` ; `prefers-reduced-motion` coupe tout (bloc hors de toute `@layer`).
  (CONVENTIONS § 9 ; CHARTE § Mouvement)
- Un ratio sans occasion s'affiche `—` (U+2014) via `pourcent()` (`labels.ts`), jamais « 0 % » ;
  exception : une progression (`LigneCible.tsx`) garde son 0. (CONVENTIONS § 9)
- `labels.ts` porte **tout** le français affiché, annonces vocales comprises ; le cœur ne fabrique
  aucun libellé (`name: null` → l'UI décide). Annonce vocale : chiffres en chiffres, une seule
  phrase par volée (`annonceFinDeVolee`), préférence relue à chaque annonce. (PLAN lots 2, 5b, UX)
- Composants : réutiliser `src/ui/composants/commun/`, **ne jamais** dupliquer une variante ad hoc.
  `ApercuPartie` = seul endroit qui ouvre `MatchSummary`. Un `<h2>` de panneau ne reprend jamais le
  nom d'un `<h1>` (`enTete=` plutôt que `titre=`). (CHARTE § Composants)
- Hooks : un par mode, un seul objet plat ; TanStack Query = cache seul (`staleTime: Infinity`,
  `queryKey: ['match', matchId]`, `setQueryData`, jamais `invalidateQueries`). (CONVENTIONS § 10)
- **Changement de rendu** : relecture à l'écran (portrait **et** paysage, sombre **et** clair) en
  plus des tests. (rules/frontend-react ; CHARTE § Vérifier à l'écran)
- **Routes lazy** : un écran ne se réimporte **jamais** statiquement dans `App.tsx` ou
  `PartieEcran.tsx` (sauf `AccueilEcran`), `tests/architecture/lazyRoutes.test.ts`.
  (CLAUDE.md § Déploiement)
- Interdits de la charte : décor derrière un chiffre de score ; hex hors `index.css` / `couleurs.ts`
  (et teinte d'accent en `style=` inline) ; texte sous `craie/60` ; rayon ; variante ad hoc ; icône
  sans `aria-hidden` ; Alfa Slab ailleurs ; paysage sur la seule orientation ; nav pendant une
  partie ; couleur écrite **uniquement** dans le bloc clair. (CHARTE § Ce qu'il ne faut pas faire)

### Déploiement

- En ligne sur `https://dartpero.web.app` (projet Firebase `dartpero`) ; commande :
  `npm run firebase:deploy` (= `build` + `firebase deploy --only hosting`). (CLAUDE.md § Déploiement)
- **Hosting et rien d'autre** : `firebase.json` ne déclare que le bloc `hosting` (ni Firestore,
  Storage, Functions, règles). `firebase-tools` est global, absent du `package.json`.
- **`rewrite ** → /index.html` obligatoire** (sinon 404 sur `/historique`, `/partie/<id>`).
- ⚠️ **En-têtes de cache** : Firebase pose `max-age=3600` partout par défaut, ce qui ferait servir
  l'ancienne PWA (`autoUpdate`) une heure. `/assets/**` et `/workbox-*.js` → `max-age=31536000,
  immutable` ; `/icons/**` → 7 jours ; le reste → `no-cache`. **La dernière règle `headers` qui
  matche l'emporte** : le fourre-tout `**` est écrit **en premier**. Les en-têtes s'appliquent au
  chemin **demandé**, pas à la cible de la réécriture. (CLAUDE.md § Déploiement)
- Service worker `autoUpdate` : `vite:preloadError` dans `src/main.tsx` recharge **une fois**
  (garde-fou `sessionStorage` avec `try`/`catch`). `globPatterns` précache tous les chunks, donc
  un mode jamais visité marche hors ligne. Vite 8 = Rolldown : grouper les chunks via
  `build.rollupOptions.output.codeSplitting.groups` (`manualChunks` déprécié).
- iOS : installation **uniquement** par Safari « Ajouter à l'écran d'accueil ».

### Pièges techniques

- Biome 2.5 : `linter.rules.preset` (pas `recommended`) ; exclusions sans `/**` final ;
  `css.parser.tailwindDirectives: true` obligatoire pour `src/index.css`. (rules/biome)
- Polices : sous-ensemble `latin` (`@fontsource/<police>/latin-<poids>.css`). (CLAUDE.md § Notes techniques)
- Icônes : `npm run icons` (sharp) depuis `scripts/icon.svg`. Deux modes de dev : `npm run dev`
  (localhost = contexte sécurisé) et `npm run dev:mobile` (HTTPS auto-signé).
- Wake Lock : se ré-acquiert sur `visibilitychange` ; null-object si indisponible. (PLAN lot 3)
- `createDatabase()` est une fonction, pas une sous-classe de Dexie (`useDefineForClassFields`).
  `fake-indexeddb` est chargé dans `tests/setup.ts`. (PLAN lot 2)
- Pas de `.gitattributes` : si des CRLF reviennent sous Windows, c'est là qu'il faudra
  `* text eol=lf`. (PLAN lot UX)
- Aucun `ErrorBoundary` dans le projet (si le rechargement unique échoue, écran blanc). (PLAN lot
  bundle-par-route, point non résolu)
- `Cible` a un défaut latent connu (`fontSize` 4,6 à un rayon de 48,6) : à corriger si elle sert un
  jour en grand. (CHARTE § Vérifier à l'écran)
- `successPercent` (entraînement) a encore le défaut « 0 % sans occasion » : non traité. (PLAN lot
  pourcentage-doubles-tiret)
- La validation sur vrai matériel (3 m, pouce debout, wake lock, paysage réel, **vrai iPhone**)
  n'est pas couverte par les tests. (PLAN § 0)

## Surfaces gravées

Un lot qui touche l'une d'elles est **interdit en `light`**, passe en `high`, démarre la chaîne
d'architecture à `archi-authority`, et monte `dev` et `test` en `opus`
(orchestrate § Niveaux, § Chaîne d'architecture, § Monter en gamme) :

1. `src/core/domain/` — règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent`, schéma Dexie et ses migrations (`database.ts`),
   `backupSchema` (export / import JSON). (rules/persistence le confirme : « un lot qui touche ici
   est en niveau `high` »)
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json`.
5. Une décision de `CLAUDE.md` § Décisions structurantes, § Règles du jeu (X01, Tour du monde,
   Cricket), ou § Charte « ce qui ne s'y discute pas » (point 2 zones, angle vif / `--radius-*`).

Cohérence avec `.claude/skills/orchestrate/SKILL.md` : **la liste ci-dessus est identique** à celle
de la skill (5 puces). `rules/persistence.md` ne dit « surface gravée » que pour la persistance,
ce qui est un sous-ensemble cohérent. Écart noté : les règles de l'**entraînement** ne sont pas
dans CLAUDE.md § Règles du jeu, donc hors de la 5e puce à la lettre (voir Constats).

## Préséance et exceptions

**Ordre de préséance** : code récent, puis `CLAUDE.md`, puis `CONVENTIONS`, puis `rules/`.
(rules/README ; rules/response-policy ; CONVENTIONS en-tête.) Précisions :

- `CLAUDE.md` gagne sur `CONVENTIONS` et sur la charte (qui « ne le contredit jamais »).
- **Exception à « le code fait foi »** : une décision **gravée** de CLAUDE.md — là, un écart du
  code est un défaut, pas une nouvelle convention. (rules/response-policy)
- `PROJECT_PLAN.md` n'est pas une source de décisions ; il ne contredit jamais CLAUDE.md.
- Ce document n'est jamais une source.

**Exceptions délibérées (à conserver, ne pas « corriger »)** :

| Exception | Règle normale qu'elle contourne | Source |
| --------- | ------------------------------- | ------ |
| `src/ui/couleurs.ts` — palette des profils, teintes symboliques | pas de couleur en dur dans `src/ui` (`themeBoundary`) | rules/theme-colors ; PLAN lot thème clair |
| `src/ui/composants/commun/Cible.tsx` — un vrai plateau (le rouge du double 20 ne s'éclaircit pas le jour) | idem | idem |
| `src/ui/theme.ts` — les deux teintes de barre système, une par thème | idem | idem |
| `Services.devices` (`screenLock`, `haptics`, `preferences`) : ports **driven** consommés directement par la coquille UI | « UI → use cases uniquement » | PLAN § 6 lot 3 ; CONVENTIONS § 7 |
| Discriminant persisté `'MatchStarted'` sous le type `X01Started` | nommage cohérent ; une valeur persistée ne se renomme pas | PLAN § 1.3 ; rules/persistence |
| Firebase **Hosting** (et seulement lui) | « pas de Firebase » | CLAUDE.md § Décisions structurantes, § Déploiement |
| `AccueilEcran` importé statiquement | routes lazy | CLAUDE.md § Déploiement ; rules/frontend-react |
| Lecture/écriture de fichier, `matchMedia`, `Blob` dans l'UI (pas de port) | logique via ports | PLAN § 6 lots 4 et thème clair |
| Script d'amorçage de `index.html`, doublon assumé de `theme.ts` | un seul écrivain de `data-theme` | CHARTE § Les deux thèmes |
| `X01Config.legsForBestOf` survit (défaut + tests), plus aucun écran ne l'appelle | « on ne dit plus best of N » | CLAUDE.md § Décisions structurantes |
| Variables locales en français dans `src/core/**` (privées / use cases / hooks) | cœur en anglais | CONVENTIONS § 1 |
| `theme_color` du manifeste figé | thème suivi au runtime | PLAN lot thème clair |
| Un pourcentage de **progression** garde son `0` | `pourcent()` → `—` | CONVENTIONS § 9 |

Toute **nouvelle** exception à `themeBoundary` se documente dans le garde **et** dans
`rules/theme-colors.md`, dans le même lot.

**Limites de scope** : pas de sync cloud, pas de compte, pas de réseau ; Killer / Shanghai / Around
the Clock hors v1 ; statistiques de carrière limitées au X01 ; i18n FR seul.

## Décisions ouvertes

1. **Sync cloud / classement entre potes** — hors v1 (lot 6 hypothétique, *un adapter de plus*) ;
   l'export/import JSON est le palliatif. (CLAUDE.md § Décisions ouvertes n° 4)
2. **i18n** : FR seul, aucun besoin identifié. (n° 5)
3. **Jeux fun restants** (Around the Clock, Killer, Shanghai) : hors v1, la couture `GameMode`
   les accueillera. (n° 3)
4. Lot 5b : **un seul exercice** jouable et **aucun suivi de progression** ; à trancher (second
   exercice + écran de progression, ou réduire officiellement le lot). (PLAN § 0 et lot 5b —
   CLAUDE.md marque pourtant le lot `[x]`, voir Constats)
5. Écrans du plan jamais faits : `/historique/:id` et `/joueurs/:id` — à implémenter ou retirer
   du plan. (PLAN § 0 n° 3)
6. Validation sur vrai matériel, dont un vrai iPhone. (PLAN § 0 n° 1)

## Constats de cohérence

| # | Sévérité | Constat | Preuve | Impact |
| - | -------- | ------- | ------ | ------ |
| 1 | Moyenne | CLAUDE.md § Règles du jeu X01 dit toujours « **Best-of N legs (défaut 3)** » alors que § Décisions structurantes l'a renversé (« premier à N », défaut 2 legs) | CLAUDE.md § Règles du jeu X01 « Legs & sets » vs § Décisions structurantes « Réglages X01 par défaut » | Un agent qui lit la règle sans la décision réintroduirait « best of N ». Ce document suit la décision. À corriger dans CLAUDE.md (non fait ici) |
| 2 | Moyenne | Les règles de l'**entraînement au checkout** ne figurent pas dans CLAUDE.md § Règles du jeu (seuls X01, Tour du monde, Cricket y sont) ; elles ne vivent que dans PLAN § 6 lot 5b (qui n'est pas une source de décisions) | CLAUDE.md § Règles (3 sections) ; PLAN lot 5b | Règle de jeu hors « surface gravée » à la lettre ; plage du reste (« 41 à 170 ») non confirmée |
| 3 | Basse | **First 9** : CLAUDE.md dit « 9 premières fléchettes », PLAN § 6 lot 1 dit « 3 premières volées » | CLAUDE.md § Statistiques vs PLAN lot 1 « Conventions de stats » | Équivalents sauf volée courte (sortie / bust) ; interprétation non tranchée ici, à lever dans `src/core/domain/games/x01/stats` |
| 4 | Basse | CLAUDE.md § État d'avancement s'arrête à 318 tests et omet les 3 lots post-audit (tour-du-monde-cloture-volee 330, pourcentage-doubles-tiret 334, bundle-par-route 339) ; PLAN § 0 dit aussi 318 | CLAUDE.md § État d'avancement ; PLAN § 0 vs § 6 | Chiffres périmés (les décisions de ces lots ont toutefois été remontées ailleurs dans CLAUDE.md) |
| 5 | Basse | CLAUDE.md coche le lot 5b `[x]` ; PLAN § 0 et lot 5b le disent « livré à moitié », critère non atteint | CLAUDE.md § État d'avancement vs PLAN lot 5b | Statut d'avancement ambigu ; voir Décisions ouvertes n° 4 |
| 6 | Basse | PLAN § 6 lot 1 : « Le journal ne stocke QUE `MatchStarted` et `VisitRecorded` » — périmé depuis le lot 5 (PLAN § 1.3 le dit lui-même, `RoundStarted` etc.) | PLAN § 6 lot 1 vs § 1.3, CLAUDE.md § Arborescence | Lecture trompeuse de l'historique ; le format actuel est celui de § 1.3 |
| 7 | Basse | La charte § Ce qu'il ne faut pas faire n° 2 / § Palette dit « hex hors `index.css` / `couleurs.ts` » ; `rules/theme-colors` (et le garde) listent **trois** exceptions (+ `Cible.tsx`, `theme.ts`) | CHARTE § Palette, § Ce qu'il ne faut pas faire vs rules/theme-colors § Exceptions | Charte incomplète ; ce document suit `rules/theme-colors` (3 exceptions) |
| 8 | Info | Les sets : CLAUDE.md dit « éventuellement groupés en sets » ; aucune source lue ne dit si l'UI les expose encore (le glossaire ne cite que `legsToWin`) | CLAUDE.md § Règles X01 ; rules/glossary | Non vérifié dans le code |

Aucune contradiction trouvée entre la liste des surfaces gravées de `orchestrate` et les sources
(CLAUDE.md, `rules/persistence`). Les constats décrivent des écarts de doc, pas du code.

## Questions et limites

- **Code non relu** (hors `database.ts`) : tout ce qui est dit sur les tests d'architecture
  (`hexagonalBoundary`, `themeBoundary`, `lazyRoutes`), sur `Services.devices`, sur le nombre de
  tests ou sur les versions de dépendances vient de la doc, pas du code.
- **`docs/PROJECT_PLAN.md` lu en partie** (1 409 lignes) : les lots visuel, « ce qu'on regarde
  après la partie », « trois finitions », « résumé transposé » (§ 6) n'ont pas été relus ici ; des
  décisions fines y figurent peut-être (filtre de période, `legsPlayed`, ordre de passage tiré au
  sort, stockage du tirage). Elles ne sont **pas** reprises ici.
- **Règles de l'entraînement** : incomplètes (Constat 2). Ne pas les compléter par déduction.
- **Sécurité** : aucun document de menace ; la section ci-dessus est un regroupement de faits
  épars, pas un modèle de sécurité. Les agents `sec` et `archi-*` (non lus) peuvent avoir leurs
  propres baselines.
- **Fichiers non lus** : `.claude/agents/*` (sauf `architecture-context.md`), `README.md`,
  `biome.json`, `firebase.json`, `vite.config.ts`. Le nombre exact de lots candidats d'audit et
  les mémoires utilisateur (MEMORY.md) ne sont pas utilisés.
- Les valeurs chiffrées (contrastes 1,84:1 / 4,4:1 / 6,6:1, durées d'animation, largeurs de
  colonnes) sont dans CHARTE, non recopiées ici : y aller si un lot les touche.

## Traçabilité

| Section de ce document | Sources principales |
| ---------------------- | ------------------- |
| Inventaire | CLAUDE.md § Décisions structurantes, § Décisions ouvertes |
| Produit, architecture | CLAUDE.md § Le projet, § Règle d'architecture, § Conventions de code ; CONVENTIONS § 1-8, 13 |
| Règles de jeu | CLAUDE.md § Règles du jeu X01 / Tour du monde / Cricket ; PLAN § 1.4 et § 6 (lots 1, 5b, 5c, tour-du-monde-cloture-volee) ; CHARTE § Saisie ; rules/glossary |
| Persistance | rules/persistence ; PLAN § 1.3, § 6 lots 2 et 4 ; `src/infrastructure/dexie/database.ts` (versions) |
| Sécurité | CLAUDE.md § Décisions structurantes ; rules/persistence, rules/biome ; orchestrate |
| Conventions | CONVENTIONS § 1-12 ; rules/testing, typescript, biome, commit, prospective, documentation-language, response-policy, glossary |
| Front et charte | CHARTE (entière) ; CONVENTIONS § 9-10 ; rules/frontend-react, theme-colors ; PLAN lot 5c et thème clair |
| Déploiement, pièges | CLAUDE.md § Déploiement, § Notes techniques ; PLAN § 6 lot bundle-par-route |
| Surfaces gravées | orchestrate § Niveaux, § Monter en gamme ; rules/persistence |
| Préséance et exceptions | rules/README, rules/response-policy, rules/theme-colors ; CONVENTIONS en-tête |

Régénération : `/refresh-architecture` (brief `.claude/agents/architecture-context.md`), à
relancer dès qu'un lot grave une décision dans `CLAUDE.md`, `CONVENTIONS` ou `rules/`.
