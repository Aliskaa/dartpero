# CLAUDE.md — Dartpéro

Contexte permanent du projet pour Claude. **À lire en début de session.**
Le plan détaillé vit dans [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) — ce fichier en est le
résumé opérationnel.

> Claude maintient ce fichier : le mettre à jour dès qu'une décision durable est prise
> (nouvelle convention, choix de package, décision ouverte tranchée…).

---

## Le projet en une phrase

PWA mobile (iPhone + Android) : **compteur de parties de fléchettes** entre potes — X01
(501 / 301 / 701), saisie fléchette par fléchette, suggestions de checkout, stats et
historique. **100 % local, hors ligne, sans compte.**

Nom affiché : **Dartpéro** (fléchettes + apéro). Slug technique : `dartpero`.

> **Contexte d'usage (dicte tout le design)** : le téléphone est **posé** — contre un mur, sur
> une table, sur une étagère — pendant que plusieurs joueurs se relaient à la ligne de lancer
> (l'*oche*). Un joueur tape les scores à 30 cm, les autres lisent le tableau à **2-3 mètres**.
> Souvent dans un garage ou une cave mal éclairés, **sans réseau**.
> → **lisibilité à distance** et **zéro friction au démarrage** priment sur tout le reste.

---



## Décisions structurantes (NE PAS recontredire sans demander)

- **PWA**, pas d'app native — installable sur iPhone + Android via « Ajouter à l'écran
d'accueil ». Pas de passage par les stores.
- **Backend = architecture hexagonale (Ports & Adapters) + SOLID.** Exigence forte de
l'utilisateur, à respecter strictement.
- **PAS de Firebase DANS L'APP, PAS d'authentification, PAS de réseau.** Décidé. Une partie se
joue hors ligne, autour d'un seul téléphone : un écran de login serait rédhibitoire. Toute la
persistance passe par **Dexie (IndexedDB)** derrière les ports `MatchRepository` /
`PlayerRepository`. Une éventuelle sync cloud serait **un adapter de plus**, jamais une
dépendance du cœur.
⚠️ **Firebase *Hosting* est une exception qui n'en est pas une** (voir § Déploiement) : c'est
un serveur de fichiers statiques, il ne met pas un octet de SDK dans le bundle. Aucun
`import` de `firebase` dans `src/`, jamais — ni Auth, ni Firestore, ni Functions.
- **Les joueurs sont des profils LOCAUX**, pas des comptes : pseudo + couleur, créés en 2
secondes, portant leurs stats **sur cet appareil**. Filet de sécurité obligatoire :
**export / import JSON** de toute la base (lot 4).
- **Le match est une liste d'événements** (`MatchEvent[]`), l'état affiché est une
**projection** rejouée depuis ces événements. C'est le choix qui rend l'**annulation**
triviale et fiable (on se trompe de saisie très souvent en pleine partie).
- **Saisie hybride** : fléchette par fléchette par défaut (grille 1-20 + 25, bascule S/D/T
**momentanée** — elle retombe sur Simple après chaque fléchette) — c'est la **condition
technique** des stats de doubles et de l'entraînement — **plus** un mode « rapide » (score de
volée 0-180) basculable.
- **Modes de jeu : X01 et Tour du monde** (lot 5a), puis **entraînement solo** (lot 5b).
Cricket, Killer et Shanghai restent **hors périmètre v1** — mais la couture `GameMode`
existe désormais **pour de vrai** (`src/core/domain/services/gameModes.ts`) et les
accueillera sans refonte.
- **Réglages X01 par défaut** : **501**, **best-of 3 legs**, **double out** activé,
**double in** désactivé. Tous modifiables à la création de partie.
- **TypeScript partout.**
- **Stack frontend figée** : React 19 + TS + **Vite** (`vite-plugin-pwa`), **React Router**,
**TanStack Query**, **Tailwind CSS v4** + design system maison dans
`src/ui/composants/commun/`, **Dexie.js**, **Vitest** + Testing Library, **lucide-react**.
- ⚠️ **TanStack Query n'orchestre PAS le match en cours.** Query sert à l'historique, aux
profils et aux stats (lecture async). Le match en cours est un **état local synchrone**
ultra-réactif (tap → score) : `useReducer` + Context dans `src/ui/hooks/useMatch.ts`, qui
appelle les use cases. **Zustand seulement si** ce reducer déborde — pas avant.
- **Outillage : Biome** (lint + format). **JAMAIS ESLint ni Prettier.** Frontière hexagonale
via `override` Biome sur `src/core/**` + `noRestrictedImports` (bannir `dexie`, `react`,
et les API navigateur).
- **Wake Lock obligatoire dès le lot 3** : l'écran ne doit pas s'éteindre pendant une partie,
sinon l'app est inutilisable en conditions réelles.

---



## Règle d'architecture (la plus importante)

Les dépendances pointent **vers l'intérieur** :

```
ui / infrastructure  ───►  application (ports + use cases)  ───►  domain
```

- `src/core/domain/` : **0 import externe** (ni React, ni Dexie, ni API navigateur, ni `Date`
ni `Math.random` — ils passent par les ports `Clock` / `IdGenerator`).
- `src/core/application/` : importe uniquement `domain`. Définit les **ports**.
- `src/infrastructure/` & `src/ui/` : implémentent / consomment les ports.
- Le câblage ports → adapters se fait **uniquement** dans `src/composition/container.ts`
(composition root).

Si on me demande d'ajouter une capacité externe (voix, vibration, cloud, capteur…), c'est
**un nouvel adapter derrière un port**, jamais une dépendance dans le cœur.

---



## Règles du Tour du monde (référence — NE PAS improviser)

Le jeu de groupe de l'utilisateur, ajouté au lot 5a. **Ce n'est pas un exercice solo** : c'est
un mode de jeu à part entière, au même titre que X01.

- **Parcours** : on part du **20**, on descend 19, 18… jusqu'au **1**, puis on finit sur la
**bulle** — 21 cibles. La liste vit dans la config, donc dans le journal : une partie ancienne
reste rejouable même si le parcours par défaut change un jour.
- **Toucher, c'est atteindre le secteur.** Simple, double ou triple : aucune différence. La
bulle est validée aussi bien par l'anneau à 25 que par le centre à 50. Une fléchette hors
cible (`MISS`) ne vaut jamais.
- Une volée fait **3 fléchettes**, et l'on avance à **chaque** touche : on peut donc valider
trois cibles dans la même volée. La volée s'arrête sur la fléchette qui boucle le tour, comme
une volée de checkout au X01.
- ⚠️ **On finit le tour de table.** Quand un joueur boucle, la partie ne s'arrête pas : les
autres jouent leur volée, pour que tout le monde ait eu le même nombre de fléchettes. Sans ça,
celui qui commence part avec une longueur d'avance imméritée.
- **Départage** : parmi ceux qui ont bouclé, celui qui y a mis le **moins de fléchettes**.
À égalité parfaite, **match nul** — on ne départage ni au hasard ni à l'ordre de passage.
- Il n'y a ni leg, ni set, ni bust : la partie tient en un seul parcours.

---

## Règles du jeu X01 (référence — NE PAS improviser)

C'est ici que 90 % des compteurs amateurs se trompent. Ces règles sont la spécification du
domaine, elles doivent être couvertes par des tests.

**Fléchette**

- Segments : `1..20`, `BULL_SIMPLE` (25), `BULL_DOUBLE` (50).
- Multiplicateurs : simple / double / triple.
- **Le triple est interdit sur le bull.** Le `BULL_DOUBLE` (50) **compte comme un double**
pour la sortie.
- Une volée (*visit*) = **3 fléchettes maximum**. Elle s'arrête avant si le joueur sort
(checkout) ou si elle est annulée (bust).

**Bust — la volée entière est annulée, le score revient à sa valeur d'avant la visite :**

- reste `< 0`, **ou**
- reste `== 1` (impossible à finir sur un double), **ou**
- reste `== 0` sans que la **dernière** fléchette soit un double (quand `double out` est actif).

**Options**

- `double out` : activé par défaut, obligatoire pour finir un leg.
- `double in` : désactivé par défaut. Si activé, le score ne décompte qu'à partir de la
première fléchette qui touche un double.

**Checkouts**

- Checkout **maximum = 170** (T20 · T20 · Bull).
- **Bogey numbers** — pas de finish possible en 3 fléchettes, l'app affiche « pas de finish »
et **jamais** une suggestion bidon : **169, 168, 166, 165, 163, 162, 159**.
- La suggestion s'affiche dès que le reste est `≤ 170`.

**Legs & sets**

- Un leg est gagné par le joueur qui atteint **exactement 0** avec un double.
- Le joueur qui commence **alterne à chaque leg**.
- Best-of N legs (défaut 3), éventuellement groupés en sets.

**Statistiques**

- **Moyenne 3 fléchettes** = `(points marqués ÷ fléchettes lancées) × 3`.
⚠️ Une volée *busted* marque **0 point** mais ses fléchettes **sont comptées**.
- **First 9** = moyenne sur les 9 premières fléchettes d'un leg.
- **% doubles (checkout %)** = doubles gagnants réussis ÷ tentatives de double.
- Compteurs : nombre de **180**, **140+**, **100+**, **60+**.
- **Meilleur leg** = plus petit nombre de fléchettes pour finir un leg.
- **Plus haut checkout** du match / du joueur.

---



## Charte graphique — « pub anglais / oche »

**Principe directeur : le décor est un pub, le tableau reste un tableau.**
Bois, laiton et feutre habillent le *chrome* (bordures, en-têtes, boutons, fonds). Ils ne
passent **jamais** derrière un chiffre de score : les nombres lus à 3 mètres sont en craie
quasi-blanche sur feutre sombre.

**Palette** (tokens `@theme` dans `src/index.css`)


| Rôle                                               | Token         | Hex       |
| -------------------------------------------------- | ------------- | --------- |
| Fond principal (tapis)                             | `feutre`      | `#0E1A13` |
| Surfaces (cartes, panneaux)                        | `ardoise`     | `#16241B` |
| Bois (bordures, cadres, en-tête)                   | `chene`       | `#5A3E24` |
| **Accent principal** (joueur actif, boutons, halo) | `laiton`      | `#C9A227` |
| Texte courant                                      | `craie`       | `#F2E8D5` |
| **Chiffres du tableau uniquement**                 | `craie-vive`  | `#FFFFFF` |
| Alerte / bust                                      | `rouge-cible` | `#C1272D` |
| Succès / checkout / leg gagné                      | `vert-cible`  | `#2E7D4F` |


⚠️ **Plancher de lisibilité : aucun texte sous** `craie/60`**.** Garage mal éclairé + téléphone
en luminosité basse.

**Typographie** (via `@fontsource`, embarquée pour l'offline)


| Token          | Police                  | Rôle                                                                                                             |
| -------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `font-display` | **Alfa Slab One** (400) | L'enseigne : logo « Dartpéro », titres d'écran.                                                                  |
| `font-score`   | **Oswald** (500/700)    | **Tous les chiffres du tableau.** Condensé + `tabular-nums` (les chiffres ne dansent pas quand le score change). |
| `font-sans`    | **Barlow** (400/600)    | Corps, boutons, listes, stats.                                                                                   |


**Matières** (classes de `@layer components` dans `src/index.css`) — aucune image, tout est
CSS ou SVG inline :
`.feutre-tapis` (dégradé + vignette + grain) · `.cadre-bois` (encadrement de chêne, technique
double-`background` peinte dans la bordure) · `.bois-veine` (bandeau d'en-tête veiné) ·
`.laiton-poli` (métal biseauté, reflet spéculaire, s'enfonce à l'appui) · `.ardoise-craie`
(panneau) · `.touche` (touche de pavé avec épaisseur et enfoncement) · `.chiffres`
(tabular-nums) · `.trace-craie` (halo de poudre sous les grands chiffres) · `.grave` (texte
gravé dans le bois) · `.filet-laiton` · `.chargement-balai`.

**Composants réutilisables** dans `src/ui/composants/commun/` — toujours réutiliser, ne jamais
dupliquer de variante ad hoc : `Button` (primaire laiton / secondaire cadre bois / discret /
danger, tailles `md` et `lg`), `Avatar` (pastille couleur + initiales), `Cible` (plateau de
fléchettes en SVG génératif), `Enseigne` + `LogoHero`, `Panneau` (ardoise dans un cadre bois,
bandeau `titre` en `<h2>` **ou** `enTete` libre), `StatTile`, `EmptyState`, `Skeleton`,
`Spinner` / `SpinnerLigne`, `MessageErreur`, `EcranErreur`.
Côté match : `CarteJoueur` (dans `composants/match/`) porte le score géant, les jetons de legs
et la volée en cours.

Icônes : **lucide-react**, toujours en `aria-hidden` — elles ne doivent jamais entrer dans le
nom accessible d'un bouton. ⚠️ En v1 `Home` s'appelle **`House`**.
Icône PWA générée par `npm run icons` depuis `scripts/icon.svg` (cible stylisée, triple 20 en
laiton, une fléchette plantée).

**Mouvement** (tokens `--animate-*` du `@theme`, keyframes au niveau racine) : `pop-score`
(le score qui change), `secousse` (bust), `halo` (le joueur actif respire), `monter`, `craie`,
`eclat`, `tourner-lent` (la cible de l'accueil), `respirer`, `defiler`.

---



## Écran de match — disposition imposée

Deux zones nettement séparées, parce qu'on lit à 3 m et qu'on tape à 30 cm :

```
┌──────────────────────────────────┐
│ ←  LEG 2 | 501 · BO3       [DO]  │  bandeau de chêne veiné
├──────────────────────────────────┤
│ ▌ 141  │T20│ 20│ · │ ◆◇  ➤ 6     │  ZONE LECTURE — une ligne par joueur
│   KEVIN│      80     │ moy 58,4  │  score géant + volée en cours + total
│ ▌ 286  │D25│ 19│ 18│ ◇◇  ➤ 6     │  liseré = couleur du profil
│   JULIEN│     87     │ moy 94,5  │  actif = halo laiton qui respire
│  ⌖ SORTIE  T20 · T11 · D24       │  ruban vert dès reste ≤ 170
├──────────────────────────────────┤
│   1⁶⁰ 2  3  4  5                 │  ZONE SAISIE
│   6  7  8  9 10                  │  cibles ≥ 48 px, touches en relief
│  11 12 13 14 15                  │  valeur réelle en exposant hors simple
│  16 17 18 19 20                  │
│  [25] [0] [   ↶ Annuler   ]      │  pas de touche BULL : c'est DOUBLE + 25
│  [SIMPLE][DOUBLE][TRIPLE] [⚡]    │  rangée du pouce ; retombe sur SIMPLE
└──────────────────────────────────┘             après chaque fléchette
```

**Une ligne par joueur, toujours** — la disposition ne change pas avec le nombre de joueurs,
seule l'**échelle** du score suit (2 joueurs → `4rem`, 3 → `3rem`, 4 → `2.5rem`). Les colonnes
sont à largeur fixe : c'est en alignant les scores d'une ligne à l'autre qu'on les compare.

**Portrait** par défaut (téléphone posé contre un mur). Un mode paysage « tableau » reste une
décision ouverte.

---



## Arborescence (cible)

```
src/
├─ core/
│  ├─ domain/
│  │  ├─ games/           ← UN DOSSIER PAR MODE DE JEU
│  │  │  ├─ index.ts      la couture : GameModeId, AnyMatchState, GameModes
│  │  │  ├─ x01/          config · rules · scoring · stats · career
│  │  │  ├─ tour-du-monde/     config · rules
│  │  │  └─ checkout-practice/ config · rules      (solo)
│  │  ├─ value-objects/   Dart, Segment, Multiplier, Score, PlayerColor, ids
│  │  ├─ entities/        Visit, Player          (transverses aux modes)
│  │  ├─ events/          MatchEvent : X01Started | TourDuMondeStarted |
│  │  │                   CheckoutPracticeStarted | RoundStarted | VisitRecorded
│  │  └─ services/        dartSearch · checkout · visitOutcome
│  │                      ⚠️ TRANSVERSES : un mode n'importe jamais un autre mode
│  └─ application/
│     ├─ ports/driving/   StartMatch, RecordVisit, UndoLastVisit, PreviewVisit,
│     │                   BuildVisitFromScore, GetMatchState, GetCheckoutSuggestion,
│     │                   GetMatchStats, GetMatchHistory, GetMatchMode,
│     │                   GetOngoingMatch, GetPlayerStats, DeleteMatch,
│     │                   ManagePlayers, ManageBackup, PlayTourDuMonde
│     ├─ ports/driven/    MatchRepository, PlayerRepository, Clock, IdGenerator,
│     │                   Haptics, ScreenLock, Preferences, RandomSource, Announcer
│     └─ use-cases/       + backupSchema.ts (validation d'un JSON importé)
├─ infrastructure/        dexie/ · device/ · memory/ · system/
├─ composition/           container.ts   ← seul point de câblage
├─ ui/
│  ├─ composants/         commun/ (dont ApercuPartie, qui ouvre l'union des modes)
│  │                      x01/ · tour-du-monde/ · checkout-practice/
│  ├─ ecrans/             games/ ← MÊME DÉCOUPAGE QUE LE DOMAINE
│  │                        PartieEcran (aiguillage) · x01/ · tour-du-monde/ ·
│  │                        checkout-practice/
│  │                      + les écrans transverses : Accueil, Joueurs,
│  │                        NouvellePartie, Historique, Statistiques, Réglages
│  ├─ hooks/              useX01 · useTourDuMonde · useCheckoutPractice ·
│  │                      useJoueurs · useAppareil (wake lock, préférences, voix)
│  └─ couleurs.ts (teintes) · labels.ts (tout le français, annonces comprises)
tests/                    domain/ · use-cases/ · infrastructure/ · architecture/ ·
                          fakes/ · ui/ (+ gestes.ts)
```

---



## Conventions de code

- Value Objects avec **factory validante** (`Dart.of(segment, multiplier)` rejette un triple
bull ; `Score.of(n)` rejette un négatif) et champs `readonly`.
- Identifiants en **branded types** (`MatchId`, `PlayerId`, `LegId`).
- Use cases = classes implémentant un driving port, dépendances **injectées par constructeur**
(jamais de `new Dexie…` dans un use case).
- Ports petits et ciblés (ISP) : lecture séparée de l'écriture quand pertinent.
- Tests domaine / use-cases avec **fakes in-memory** (pas de Dexie en test unitaire).
- **Aucun** `Date.now()` **ni** `Math.random()` **dans le domaine** → ports `Clock` et `IdGenerator`,
ce qui rend les tests déterministes.
- Langue : nommage **UI en français** (`composants/`, `ecrans/`), **cœur technique en
anglais** (`core/`, `infrastructure/`).
- **UI → use cases UNIQUEMENT.** Un composant n'accède jamais à Dexie directement (ça
court-circuiterait les ports). Use cases fournis par un Context (`useServices()`) alimenté
par le composition root.
- Cibles tactiles **≥ 48 px** partout (on tape debout, une fléchette dans l'autre main).

---



## État d'avancement

- [x] **Débrief** : nom, ambiance, modes, saisie, persistance, usage — tout tranché
- [x] **Lot D** — `CLAUDE.md` + [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)
- [x] **Lot 0** — Scaffold : Vite 8 + React 19 + TS 7 + Tailwind 4 + Biome 2.5 + Vitest 4 +
  `vite-plugin-pwa`. Tokens de la charte dans `src/index.css` (`@theme`), 3 polices
  `@fontsource` (sous-ensemble latin), icônes PWA générées, frontière hexagonale **vérifiée**
  par Biome. `dev` / `test` / `lint` / `typecheck` / `build` verts.
- [x] **Lot 1** — Domaine X01 pur + tests. `Dart`/`Score`/ids, `Visit`/`Player`/`X01Config`,
  journal d'événements, `x01Rules` (bust, double in/out, legs/sets, annulation), `checkout`
  (suggestion + bogey numbers), `matchStats`. **60 tests verts**, `src/core/` sans le moindre
  import externe. Aucune UI, aucune persistance.
- [x] **Lot 2** — Ports driving/driven, 9 use cases, adapters **Dexie** + **in-memory**,
  composition root (`src/composition/container.ts`) et `ServicesProvider` injectable.
  **86 tests verts**, dont une partie de 501 en BO3 jouée de bout en bout via les use cases,
  un test des adapters Dexie sur `fake-indexeddb`, et un **test d'architecture**.
- [x] **Lot 3** — Écran match : accueil, configuration de partie, tableau + saisie hybride
  (fléchette par fléchette **et** mode rapide), annulation, suggestion de checkout, wake lock,
  haptique, écran de résumé. Routage React Router, `QueryClient` + `ServicesProvider` câblés.
  **100 tests verts**, dont un parcours complet accueil → partie → résumé.
- [x] **Lot 3 bis** — Refonte visuelle : la charte « pub anglais » réellement exécutée
  (matières, relief, cible SVG, avatars, animations ciblées + `prefers-reduced-motion`),
  socle de composants communs, en-tête de match avec bouton retour, valeur réelle des touches
  hors simple, mode rapide qui projette le reste. **100 tests toujours verts, aucun modifié.**
- [x] **Lot 4** — Profils joueurs (pseudo, **couleur choisie**, ancienneté), historique des
  parties avec statut et suppression, statistiques de carrière en tableaux comparatifs classés,
  **export / import JSON** de toute la base, écran Réglages, barre de navigation basse.
  Migration Dexie **v1 → v2** testée. **135 tests verts.**
- [x] **Lot 5a** — **Tour du monde**, deuxième mode de jeu, et la **couture `GameMode`** qui
  l'accueille : événement d'ouverture propre au mode, états discriminés, aiguillage des
  règles comme des écrans. **167 tests verts.**
- [x] **Lot 5b** — **Checkout Practice** (entraînement solo, troisième mode) + **annonce
  vocale** française désactivable (port `Announcer`). Ports `RandomSource` et `Announcer`,
  règles de sortie rendues transverses. **192 tests verts.**
- [ ] **Lot 6** — *(optionnel, si un jour)* sync / classement — un adapter, zéro refonte

---



## Notes techniques

**Versions installées au lot 0 (août 2026)** : vite **8.2** · vitest **4.1** · TypeScript
**7.0** · Biome **2.5.6** · Tailwind **4.3** · React **19.2** · react-router **7.18** ·
Dexie **4.4**. Une **seule copie de vite** (deduped partout) — l'ancien conflit
vitest v2 / vite@5 n'existe plus, aucune précaution à prendre de ce côté.

- **TypeScript 7 a supprimé `baseUrl`.** L'alias `@/*` est déclaré en chemin **relatif** :
`"paths": { "@/*": ["./src/*"] }`, doublé de `resolve.alias` dans `vite.config.ts`.
- `vite.config.ts` importe `defineConfig` depuis **`vitest/config`** (pour le bloc `test`).
- **Biome 2.5** : `linter.rules.recommended` est déprécié → `linter.rules.preset`. Les motifs
d'exclusion de dossier ne prennent **plus** le `/**` final (`!**/dist`, pas `!**/dist/**`).
Le CSS Tailwind (`@theme`, `@layer`) exige `css.parser.tailwindDirectives: true`, sinon
Biome refuse de parser `src/index.css`.
- **Frontière hexagonale vérifiée** : l'`override` Biome sur `src/core/**` rejette bien les
imports de `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `lucide-react`,
`dexie` et `sharp`, avec un message d'erreur explicite. Testé au lot 0 puis retiré.
- Tests en environnement **jsdom** ; `tests/setup.ts` charge `@testing-library/jest-dom/vitest`
et fait un `cleanup()` après chaque test. Les tests vivent dans `tests/**/*.test.{ts,tsx}`.
- **Polices : sous-ensemble `latin` uniquement** (`@fontsource/<police>/latin-<poids>.css`).
Importer les CSS complets embarquait le cyrillique + le vietnamien : précache workbox de
**542 Kio → 406 Kio**. L'app est en français, ces sous-ensembles ne servent à rien.
- **Deux modes de dev** :
`npm run dev` → `http://localhost:5173` (localhost **est** un contexte sécurisé : Wake Lock,
vibration et PWA y marchent déjà, sans avertissement de certificat) ;
`npm run dev:mobile` → `vite --mode mobile`, active `@vitejs/plugin-basic-ssl` +
`server.host` → `https://<IP-PC>:5173` pour tester depuis le téléphone sur le même WiFi
(accepter l'avertissement de certificat auto-signé).
- Sur **iOS**, l'installation PWA passe **uniquement par Safari « Ajouter à l'écran
d'accueil »** (Chrome iOS ne peut pas installer de PWA).
- **Wake Lock API** : indisponible sur certains navigateurs → le port `ScreenLock` doit avoir
un **null-object** qui ne casse rien.
- **Icônes** : `npm run icons` (sharp) génère `public/icons/*` + `apple-touch-icon.png` +
`favicon.svg` depuis `scripts/icon.svg`. `sharp` est une **devDependency**, hors bundle client.
### Décisions du domaine (lot 1) — à ne pas défaire sans raison

- **Le journal ne stocke QUE `MatchStarted` et `VisitRecorded`.** `LegWon` / `SetWon` /
`MatchFinished` sont **déduits** par les règles et exposés en `MatchMilestone`, jamais
persistés. Sinon annuler voudrait dire « retirer la dernière volée **et** les événements
qu'elle a déclenchés » — exactement la classe de bug qu'on veut éliminer. Annuler = 
`X01Rules.project(events.slice(0, -1))`, point.
- **`VisitRecorded` ne porte pas de `playerId`** : à qui est le tour se déduit de la
projection. Le journal ne peut donc pas être en désaccord avec les règles.
- **`Visit` n'est pas stockée**, c'est un artefact de projection (issue, points marqués,
restes avant/après recalculés à chaque rejeu).
- **Le dossier `gameModes/` n'existe pas encore** : X01 est le seul mode de la v1, on ne
généralise pas avant d'avoir un 2ᵉ mode réel (entraînement, lot 5). YAGNI assumé.
- **Un bust annule aussi l'ouverture du `double in`** : la visite entière est annulée, donc
le double d'ouverture aussi. Lecture délibérée, testée.
- **Suggestion de checkout = heuristique, pas la table PDC.** La route proposée est toujours
**valide et la plus courte**, et laisse un double usuel, mais elle peut différer de la table
professionnelle (99 → `T20 S7 D16` chez nous, `T19 S10 D16` en table). Un test exhaustif
vérifie que **tous** les restes de 2 à 170 hors bogey numbers ont une route correcte, et que
les 7 bogey numbers sont exactement les bons.
- **Conventions de stats** (choisies, documentées, testées) : les paliers sont **cumulatifs**
(un 180 compte aussi en 140+/100+/60+) ; la moyenne *first 9* porte sur les **3 premières
volées** de chaque leg ; une **tentative de double** = toute fléchette lancée depuis un reste
qu'une seule fléchette peut clore (pair ≤ 40, ou 50).

### Décisions de la couche application (lot 2)

- **`MatchRecord` ne persiste que le journal** (`id`, `createdAt`, `updatedAt`, `events`).
Le vainqueur, les scores, les legs gagnés ne sont **jamais** stockés : ils se rejouent. Seules
les dates échappent au journal, elles viennent du port `Clock`.
- **Les règles sont appliquées AVANT d'écrire.** `RecordVisitUseCase` projette, applique
`X01Rules.applyVisit`, et n'ajoute l'événement que si ça passe : une volée illégale ne laisse
aucune trace. Testé explicitement.
- **`MatchSummaryPlayer.name` vaut `null`** quand le profil local a été supprimé. Le cœur ne
fabrique pas de libellé français ; c'est l'UI qui décide d'afficher « Joueur supprimé ».
- **Un port n'est créé qu'avec son premier consommateur.** Lot 2 = `MatchRepository`,
`PlayerRepository`, `Clock`, `IdGenerator`. `ScreenLock` / `Haptics` / `Preferences` arrivent
au **lot 3**, `Announcer` au **lot 5** — écrire un port sans appelant, c'est du code non testé
qui vieillit.
- **Test d'architecture** (`tests/architecture/hexagonalBoundary.test.ts`) : il lit les imports
réels de `src/` et vérifie que le cœur n'importe que lui-même (en relatif), que `src/ui` ne
touche aucun adapter, et qu'aucun adapter ne remonte vers l'UI. Plus robuste que la liste de
paquets bannis de Biome, qui ne peut interdire que ce qu'on a pensé à y mettre. Les deux
cohabitent : Biome donne l'erreur dans l'éditeur, le test attrape le reste. **Un garde-fou
interne vérifie que le test n'est pas vert à vide** (nombre de fichiers et d'imports analysés).
- **`fake-indexeddb`** (devDep) est chargé dans `tests/setup.ts` : jsdom n'a pas d'IndexedDB,
sans quoi les adapters Dexie seraient les seuls du projet à n'être jamais exécutés en test.
- **`createDatabase()` est une fonction, pas une sous-classe de Dexie** : avec
`useDefineForClassFields`, des champs de classe écraseraient les tables installées par Dexie.

### Décisions de l'écran de match (lot 3)

- **La volée en cours n'est PAS persistée.** Elle vit en état local ; le port driving
`PreviewVisit` (synchrone, pur) l'évalue à chaque fléchette pour faire suivre le score affiché
et détecter qu'elle est close (3 fléchettes, bust ou sortie). Elle n'est envoyée à
`RecordVisit` qu'à ce moment-là. Sans ce port, l'UI devrait réimplémenter les règles.
- **TanStack Query sert de cache, pas d'orchestrateur.** `RecordVisit` renvoie déjà le nouvel
état, injecté via `setQueryData` : aucun rechargement entre le tap et le score affiché.
- **Un seul bouton « Annuler »**, qui fait ce qu'on attend : il retire la fléchette qu'on vient
de taper si la volée est en cours, sinon il annule la dernière volée **enregistrée** (même si
elle avait gagné un leg).
- **Le mode rapide fabrique des fléchettes synthétiques** (`composeVisit`) : le total et le
nombre de fléchettes sont exacts — donc scores, legs et moyennes aussi — mais le détail
« quelle fléchette a touché quoi » est inventé. C'est le marché assumé du mode rapide. Il
rejette les 9 totaux impossibles en 3 fléchettes (179, 178, 176, 175, 173, 172, 169, 166, 163),
découverts par la même recherche que les checkouts, sans liste codée en dur.
- **Sur une sortie en mode rapide, l'app demande le nombre de fléchettes utilisées** : c'est la
seule information que le total ne porte pas, et elle change la moyenne comme le « meilleur leg ».
- **`Services.devices`** (`screenLock`, `haptics`, `preferences`) est une **exception assumée**
à la règle « UI → use cases uniquement » : ce sont des ports *driven* consommés par la coquille
UI. Ils ne portent aucune règle métier, les emballer dans des use cases serait de la cérémonie.
- **Le Wake Lock se ré-acquiert sur `visibilitychange`** : le navigateur relâche le verrou dès
que l'onglet passe en arrière-plan. Sans cette reprise, l'écran se rendort dès qu'on a répondu
à un message pendant la partie.
- **Accessibilité** : les scores et la volée en cours sont des `<output>`, pas des `<p>` —
`aria-label` n'est pas supporté sur un paragraphe (Biome le refuse, à juste titre).

### Décisions de la refonte visuelle (lot 3 bis)

La charte était écrite mais quasiment pas exécutée (`.cadre-bois` n'existait pas, aucun des
composants annoncés non plus, zéro animation, zéro icône). Refonte de `src/index.css` et de
tout `src/ui/` — **aucun test modifié, les 100 tests restent verts**, ce qui valide au passage
que la refonte n'a touché à aucun comportement.

- **On pousse la charte « pub anglais », on ne la remplace pas.** Décision de l'utilisateur :
le problème n'était pas la direction mais son absence d'exécution. Matière, relief, biseaux
et mouvement partout sur le chrome ; les chiffres du tableau restent en craie sur feutre.
- **Le mouvement est généreux mais ciblé**, et `prefers-reduced-motion` coupe tout. ⚠️ Le bloc
`@media (prefers-reduced-motion)` est **volontairement hors de toute `@layer`** : le CSS sans
couche l'emporte sur n'importe quelle couche, donc il neutralise les `animate-*` de Tailwind
(couche `utilities`) **sans un seul `!important`** — que Biome refuse par ailleurs.
- **La cible est dessinée en SVG génératif** (`Cible`), à partir de l'ordre officiel des 20
secteurs et des rayons d'un plateau réel. Zéro image, donc zéro octet de plus au précache, et
net à toutes les tailles. Toujours `aria-hidden` : elle est décorative.
- **La couleur de joueur est dérivée de son `PlayerId`** (`src/ui/couleurs.ts`, hash + palette
de 8 teintes). C'est **provisoire et purement UI** : le jour où `Player` porte une couleur
choisie (lot 4), il n'y a qu'à la préférer à cet endroit. Le domaine n'a pas bougé.
- **Le pavé affiche la valeur réelle de la touche dès qu'on quitte le simple** (le « 20 »
porte un « 60 » en exposant en mode triple). C'est la faute de saisie n° 1, et le badge est
`aria-hidden` — le nom accessible du bouton reste « 20 », donc les tests aussi.
- **L'écran de match a enfin un en-tête** : leg/set en cours, score de départ, best-of,
badges DI/DO, et surtout un **bouton retour** — il n'existait aucun moyen de quitter une
partie en cours.
- **Le mode rapide projette le reste avant validation** et annonce « Bust » ou « Sortie » : on
tape un total de tête, une erreur de dizaine est vite arrivée.
- **Les icônes sont toujours `aria-hidden`.** Sans ça elles entreraient dans le nom accessible
des boutons (« ⚡ Rapide » au lieu de « Rapide ») et casseraient les requêtes par rôle.
- **Un `<h2>` de panneau ne doit jamais reprendre un nom déjà porté par un `<h1>`** : dans le
résumé, la carte de stats d'un joueur utilise `Panneau enTete=` (contenu libre) et non
`titre=`, sinon `getByRole('heading', { name: 'Kevin' })` trouve deux éléments.
- **Décision ouverte n° 1 tranchée** : **Alfa Slab One est conservée**, mais cantonnée à
l'enseigne (« Dartpéro », nom du vainqueur). Tout le reste — titres de panneaux, libellés,
chiffres — est en Oswald. Vue sur pièce, la Alfa Slab ne tient que sur 2 ou 3 mots.

### Écran de match, seconde passe — d'après une app de référence

Quatre idées reprises à une app Android de comptage (captures fournies par l'utilisateur),
retenues pour leur ergonomie, **pas** pour leur esthétique (Material vert sur blanc, franglais :
écartés). Décisions tranchées par l'utilisateur.

- **Une ligne par joueur, dans tous les cas** — pas de grille, pas de disposition alternative
au-delà de 2 joueurs. Une grille 2 colonnes s'étrangle à 4 joueurs ; la ligne encaisse. Le
coût assumé est un score plus petit à 2 joueurs, compensé par l'**échelle** qui respire selon
le nombre de joueurs — une seule règle de layout, pas deux composants.
- **Chaque joueur affiche en permanence sa dernière volée détaillée et son total** (`T20 20 ·`
puis `80`). C'est la question qui revient le plus autour d'une cible — « t'as mis quoi, là ? ».
La volée montrée est celle **en cours** dès la première fléchette plantée, la **dernière
enregistrée** sinon : sans cette bascule, un bust en solo ne serait jamais annoncé, la main ne
passant à personne.
- **Le bandeau « ce qui vient de se passer » a disparu** : chaque ligne porte déjà l'info.
Seul le **bust** garde un signal fort — la ligne passe au rouge, ses fléchettes sont barrées,
elle encaisse la secousse. C'est le seul cas où l'app doit annoncer que des points ont été
retirés.
- **Il n'y a plus de touche « Bull » : le bullseye, c'est `DOUBLE` + `25`** — ce que dit la
règle. Ça supprime une exception du pavé. En `TRIPLE` la touche 25 se **grise** plutôt que de
refuser le coup après l'avoir accepté : il n'existe pas de triple bull.
⚠️ Cette touche vise le segment `BULL`, pas le nombre 25 (`Dart.of('BULL', multiplicateur)`).
Le badge affiche toujours `BULL`, pas `D25` : `Dart.label` vit dans le domaine et un test le
couvre — on ne modifie pas le cœur pour une préférence d'affichage.
- **Les modificateurs et « Annuler » sont passés EN BAS**, dans le pavé lui-même. Le haut de
l'écran est la zone la plus difficile à atteindre au pouce ; y placer la bascule S/D/T, qu'on
actionne des dizaines de fois par partie, était une erreur. La rangée du pouce est **identique
dans les deux modes de saisie**.
- ⚠️ **La bascule S/D/T n'est plus persistante : elle retombe sur Simple après chaque
fléchette.** Décision de l'utilisateur, qui **renverse** celle du cadrage initial. Un
multiplicateur qui reste armé sans qu'on le voie est la faute n° 1 — trois T20 comptés là où
il y avait trois simples, et il faut ensuite retrouver *où* le score a dérapé. Un clic de plus
par triple coûte moins cher qu'un score faux. La remise à zéro vit dans **`useMatch`**, pas
dans le pavé, pour tenir quelle que soit la façon de saisir ; le curseur de laiton qui revient
tout seul rend la chose visible plutôt que silencieuse.
- Côté tests, `tests/ui/gestes.ts` expose `flechette(utilisateur, cible, multiplicateur?)` :
les tests re-sélectionnent le triple à chaque fléchette, comme un vrai joueur.
- **La touche `0` ignore le multiplicateur** : une fléchette manquée n'a ni double ni triple
(`Dart.of('MISS', 'DOUBLE')` lève une `DomainError`).
- **Le total de la volée en cours se déduit de `remaining - resteAffiche`**, jamais d'une somme
recalculée dans l'UI : le reste projeté vient déjà du port `PreviewVisit`, donc aucune règle
n'est réimplémentée côté écran.
- **Retenu pour le lot 4** : barre de navigation basse (Début / Joueurs / Statistiques /
Historique / Réglages), historique avec statut *en cours* / *terminée*, et surtout des stats
en **tableau comparatif classé** plutôt qu'en cartes empilées — vaut aussi pour l'écran de
résumé, où comparer quatre panneaux superposés est pénible.

### Décisions du lot 4 (profils, historique, stats, sauvegarde)

- **La couleur d'un profil est une teinte *symbolique*, pas un hex.** `PlayerColor` est un
ensemble **fermé** de 8 noms (`brique`, `sapin`, `lagon`…) dans le domaine ; la traduction en
pixels vit dans `src/ui/couleurs.ts`, et **là seulement**. Changer la charte ne touche donc
aucune donnée persistée. Ensemble fermé volontairement : avec un sélecteur libre, deux joueurs
choisissent deux bleus voisins qu'on ne distingue plus à 3 mètres.
- **Sans couleur choisie, on prend la première libre** : créer quatre joueurs d'affilée donne
quatre couleurs distinctes sans rien demander — « zéro friction au démarrage ».
- **`Player` porte `createdAt`, qui vient du port `Clock`.** Jamais `Date.now()` : le domaine
reste déterministe.
- ⚠️ **Migration Dexie v1 → v2, et son test.** Les profils déjà en base n'ont ni couleur ni
date ; sans migration `Player.create` les refuse à la lecture et l'utilisateur ouvre l'app mise
à jour pour découvrir qu'il n'a plus personne. La migration leur distribue une couleur en
tourniquet. `tests/infrastructure/dexieRepositories.test.ts` ouvre une **vraie base v1** puis la
relit en v2 — c'est le genre de bug qui ne se voit qu'en production.
- **`ManagePlayers.rename` est devenu `update(id, { name?, color? })`** (ISP : un seul point
d'édition partielle). `createdAt` n'est jamais modifiable : c'est l'ancienneté, pas la dernière
retouche.
- ⚠️ **Les moyennes de carrière se recalculent depuis les totaux bruts, jamais en moyennant des
moyennes** — faux dès que les parties n'ont pas la même longueur, et elles n'en ont jamais.
C'est pourquoi `PlayerStats` expose désormais `first9Points` / `first9Darts` : sans les données
brutes, l'agrégation serait condamnée à être fausse. `legsWon` (tout le match) s'ajoute à
`legsWonInSet` (le set en cours).
- **Une partie en cours compte dans les statistiques.** Ses fléchettes ont été lancées ;
attendre la fin d'un leg pour voir sa moyenne bouger serait frustrant. Seul `matchesWon`
distingue les parties terminées.
- **L'import JSON fusionne, il ne remplace jamais** : un identifiant connu est écrasé, un
inconnu s'ajoute, rien n'est effacé. Se tromper de fichier ne doit pas coûter une soirée de
parties.
- **Une entrée illisible est comptée puis ignorée**, pas propagée en exception : un fichier à
moitié abîmé restaure quand même les cinquante parties saines. Les compteurs remontent dans
`ImportReport` pour que l'UI le dise franchement.
- **La validation de l'import passe par les fabriques du domaine** (`Dart.of`,
`X01Config.create`, `PlayerColor.of`…). `backupSchema.ts` ne réécrit aucune règle, il traduit :
un triple bull dans un fichier trafiqué est refusé par la même ligne de code que dans une
partie.
- **Lire et écrire un fichier reste dans l'UI, ce n'est pas un port.** `ManageBackup` ne
manipule que des objets JavaScript — donc il est testable sans navigateur. Le `Blob`, le
`URL.createObjectURL` et l'`<input type="file">` sont du DOM, au même titre qu'un `<input>` de
formulaire, et vivent dans `ReglagesEcran`.
- **La barre de navigation n'apparaît pas pendant une partie** (ni sur l'écran de
configuration) : chaque pixel sert à jouer, et un onglet mal visé en pleine volée ferait perdre
la saisie en cours. Elle est posée par un `LayoutPrincipal` sur les routes concernées.
- **Chaque tableau de statistiques a son propre classement**, sur sa première colonne : on ne
consulte pas ses stats entre potes, on regarde qui est devant — et le meilleur aux 180 n'est
pas forcément celui qui finit le mieux. Le **meilleur leg** est le seul classement où *petit*
vaut mieux que *grand*, et un joueur sans leg gagné n'a **pas** « 0 fléchette » : il n'a rien,
sinon il serait premier.
- **Suppression en deux temps** (profil comme partie) : un premier appui demande confirmation,
un second agit. Pas de fenêtre modale, mais rien ne s'efface d'un doigt qui glisse. Supprimer
un profil ne supprime pas ses parties — elles affichent « Joueur supprimé », comme décidé au
lot 2.

### La couture `GameMode` (lot 5a) — comment ajouter un mode

Annoncée dès le lot 1, écrite seulement au lot 5a, quand un **deuxième mode réel** est arrivé.
Généraliser plus tôt aurait été inventer une abstraction sans savoir ce qu'elle abstrait.

**Le principe : aucun dénominateur commun artificiel.** Chaque mode garde ses règles et son
état complets et lisibles ; `services/gameModes.ts` ne fait qu'**aiguiller** sur le
discriminant `mode` que porte chaque état, et TypeScript garantit qu'aucun cas n'est oublié.

- ⚠️ **Le mode se lit sur le PREMIER ÉVÉNEMENT du journal**, via un événement d'ouverture qui
lui est propre (`MatchStarted` pour X01, `TourDuMondeStarted` pour le Tour du monde) — et
**non** via un champ `mode` ajouté à `MatchStarted`. C'est ce qui rend les parties d'avant le
lot 5a rejouables **pour toujours** en X01, sans migration ni valeur par défaut à deviner. Un
test le vérifie explicitement.
- **`VisitRecorded` est partagé par tous les modes** : une volée, c'est 1 à 3 fléchettes, que
l'on décompte un 501 ou que l'on remonte le plateau. Seule l'interprétation change.
- **`MatchSummary` est une union discriminée**, pas un type mou : un Tour du monde n'a pas de
score restant, un X01 n'a pas de cible courante. `ApercuPartie` est le **seul** endroit de
l'UI qui ouvre cette union, pour ne pas la disperser entre l'accueil et l'historique.
- **Une seule URL par partie** (`/partie/:id`) : `PartieEcran` lit le mode et rend l'écran
correspondant. Un lien d'historique reste valable quel que soit le jeu, et l'utilisateur n'a
pas à savoir dans quel mode il reprend. Chaque mode a son **propre** écran plutôt qu'un écran
truffé de conditions — les deux zones de saisie n'ont rien en commun.
- **Le pavé du Tour du monde n'a pas de bascule S/D/T** : elle ne changerait rien, et un
contrôle sans effet induit en erreur. Les fléchettes enregistrées sont donc des simples.
- **Les statistiques de carrière restent au X01.** Moyenne 3 fléchettes, 180, pourcentage de
doubles : ces mesures n'ont pas de sens au Tour du monde, qui est écarté du cumul plutôt que
d'y injecter des zéros trompeurs.

**Pour ajouter le Cricket un jour** : un dossier `games/cricket/`, un événement d'ouverture, un
module de règles avec son `mode` discriminant, trois lignes dans chaque aiguillage de
`games/index.ts`, un dossier `ui/composants/cricket/`, un écran de jeu et un résumé. Rien
d'autre ne bouge.

### Nommage : un mode se nomme, toujours (réagencement post-lot 5a)

Tant que X01 était le seul jeu, ses types s'appelaient `Match*` — et le Tour du monde arrivé,
`MatchStarted` voulait en réalité dire « X01 démarré » pendant que le nouveau venu annonçait
clairement la couleur. Le plus ancien était le plus mal nommé. Corrigé en un commit dédié,
juste après le lot 5a.

- **Ce qui a été renommé** : ce qui décrit l'**état et les règles d'un mode**.
`MatchState` → `X01State`, `PlayerMatchState` → `X01PlayerState`, `MatchStats` → `X01Stats`,
`PlayerStats` → `X01PlayerStats`, `MatchMilestone` → `X01Milestone`, `MatchStarted` →
`X01Started`, `computeMatchStats` → `computeX01Stats`. Côté écrans : `MatchEcran` →
`X01Ecran`, `ResumeEcran` → `ResumeX01Ecran`, `useMatch` → `useX01`.
- **Ce qui NE devait PAS l'être** : `MatchId`, `MatchRecord`, `MatchRepository`,
`MatchSummary`, `MatchEvent`. Ceux-là désignent bien **une partie, tous modes confondus**.
Tout ce qui s'appelle `Match` n'est pas fautif — seul l'est ce qui prétend être générique en
ne parlant que du X01.
- ⚠️ **`X01Started.type` vaut toujours `'MatchStarted'`.** Cette chaîne est une **donnée
persistée**, présente dans IndexedDB et dans les sauvegardes JSON déjà exportées : la
renommer invaliderait toutes les parties antérieures. On corrige le nom du **type**, jamais
la valeur sur le disque. Si un jour ça gêne vraiment, il faudra une migration — pas un
rechercher-remplacer.
- **Deux gardes ajoutées au test d'architecture** : un mode n'importe jamais un autre mode
(ni côté domaine, ni côté composants). Seul `games/index.ts` les connaît tous, c'est son rôle.
Ce qui est réellement partagé descend dans `commun/`.
- **Reste à faire, si l'asymétrie regêne** : les *ports* X01 gardent des noms génériques
(`StartMatch`, `RecordVisit`, `GetMatchState`…) face à `PlayTourDuMonde`. Leurs **types de
retour** disent désormais `X01State`, ce qui lève l'ambiguïté à la lecture ; renommer les
ports eux-mêmes serait le prolongement naturel mais n'était pas dans le périmètre.

### Décisions du lot 5b (entraînement au checkout, annonce vocale)

**Le troisième mode a coûté ce qui était annoncé** : un dossier `games/checkout-practice/`,
un événement d'ouverture, trois lignes dans chaque aiguillage. La couture tient.

- **L'entraînement est un mode de jeu, pas une catégorie à part.** Une session solo passe par
`MatchRepository`, apparaît dans l'historique, se supprime et se sauvegarde comme le reste.
Un exercice, c'est une partie à un joueur — lui inventer un dépôt séparé aurait dupliqué la
moitié du lot 4 pour rien.
- ⚠️ **La cible tirée est ÉCRITE dans le journal** (`RoundStarted`), jamais retirée au rejeu.
L'aléa vient du port `RandomSource`, consulté une seule fois quand la manche s'ouvre. Sans ça,
annuler une volée redistribuerait les cartes — et deviendrait un moyen de retomber sur un
reste plus facile. Testé des deux côtés.
- **Les restes jouables sont calculés, pas tabulés** : on garde ceux qu'une route de trois
fléchettes peut clore, donc les bogey numbers s'excluent tout seuls. Même principe qu'au lot 3
pour les totaux impossibles du mode rapide — aucune liste codée en dur à maintenir.
- ⚠️ **`resolveVisit` et `checkout` sont devenus TRANSVERSES** (`domain/services/`), parce que
la garde d'architecture du réagencement interdit à un mode d'en importer un autre — à juste
titre. L'entraînement juge donc une manche avec **exactement la même fonction** que le X01 :
une divergence sur la règle de bust serait le pire bug possible, invisible jusqu'à ce qu'un
joueur perde une partie dessus. Leurs signatures ne dépendent plus que de
`{ doubleIn, doubleOut }`, pas d'un `X01Config` complet.
- **L'annonce vocale reçoit du texte déjà en français.** Le cœur ne fabrique aucun libellé
(décision du lot 2) : `labels.ts` compose la phrase, l'adapter la prononce. ⚠️ Les nombres
partent **en chiffres** (« 180 ») — la voix française les lit correctement, alors qu'écrire
« cent quatre-vingts » ferait buter les voix qui épellent.
- **La préférence de voix est relue à chaque annonce**, pas capturée au montage : sinon la
couper depuis les réglages n'aurait d'effet qu'à la partie suivante.
- **Un bouton « Essayer la voix » dans les réglages** : toutes les voix françaises ne sont pas
installées partout, et mieux vaut découvrir le silence là qu'en pleine partie.
- **`ui/ecrans/games/{x01,tour-du-monde,checkout-practice}/`** — les écrans suivent le même
découpage que le domaine et les composants. Les noms de dossiers reprennent ceux du domaine
(anglais) plutôt que d'être francisés : c'est la correspondance immédiate qui compte, et le
`CLAUDE.md` réserve le français aux libellés, pas aux identifiants techniques.
- **Le pavé de saisie est celui du X01**, `rapide`/`onRapide` devenus optionnels : une manche
d'entraînement dure une seule volée, un mode rapide n'y accélérerait rien.

- **`npm audit`** : 1 vulnérabilité « high » sur **react-router 7.12→8.2**
(*RSC Mode CSRF Bypass*, GHSA-qwww-vcr4-c8h2). **Non exploitable ici** : elle vise le mode
**RSC** (React Server Components) et l'exécution d'actions serveur — Dartpéro est une SPA
100 % cliente, sans serveur ni RSC. Le seul « correctif » proposé est un retour en 7.11.0.
Décision : **on reste en 7.18**, à réévaluer si un correctif sort dans la branche 7.12+.

---

## Décisions ouvertes

1. ~~**Alfa Slab One** conservée ou remplacée par Oswald 700 pour l'enseigne.~~ **Tranchée au
   lot 3 bis** : conservée, mais réservée à l'enseigne et au nom du vainqueur.
2. **Mode paysage « tableau »** (téléphone à plat sur une table) — après le lot 3 si le besoin
   se confirme.
3. **Cricket / jeux fun** (Around the Clock, Killer, Shanghai) — hors v1, la couture
   `GameMode` les accueillera.
4. **Sync cloud / classement entre potes** — hors v1 (lot 6 hypothétique). L'export/import
   JSON du lot 4 est le palliatif.
5. **i18n** : FR seul pour l'instant (aucun besoin identifié).

---

## Déploiement — Firebase Hosting

L'app est en ligne sur **https://dartpero.web.app** (projet Firebase `dartpero`, même compte
que Pokegypte). Une seule commande : `npm run firebase:deploy` (= `build` + `firebase deploy
--only hosting`).

- **Hosting et rien d'autre.** `firebase.json` ne déclare **que** le bloc `hosting` : ni
  Firestore, ni Storage, ni Functions, ni règles de sécurité — il n'y a pas de données côté
  serveur, elles vivent dans l'IndexedDB du téléphone. La CLI (`firebase-tools`) est
  **globale**, volontairement absente du `package.json` : c'est un outil de poste de travail,
  pas une dépendance du projet.
- **Le `rewrite ** → /index.html` est obligatoire** : sans lui, ouvrir directement
  `/historique` ou `/partie/<id>` renverrait un 404 Firebase au lieu de laisser React Router
  faire son travail. Les vrais fichiers gagnent toujours sur la réécriture, donc `sw.js` reste
  bien servi comme du JavaScript.
- ⚠️ **Les en-têtes de cache ne sont PAS un détail.** Firebase pose `max-age=3600` sur *tout*
  par défaut, `index.html` et `sw.js` compris — donc une PWA en `registerType: 'autoUpdate'`
  peut servir l'ancienne version **pendant une heure** après un déploiement, y compris à
  quelqu'un qui recharge en boucle. Le bloc `headers` corrige ça :
  - `/assets/**` et `/workbox-*.js` → `max-age=31536000, immutable` (noms hachés par Vite,
    ils ne changent jamais de contenu) ;
  - `/icons/**` → 7 jours (noms **non** hachés, une semaine est le compromis) ;
  - tout le reste → `no-cache`, c'est-à-dire « revalide avant de servir » : `index.html`,
    `sw.js`, `registerSW.js`, `manifest.webmanifest` et les routes SPA. La mise à jour est
    donc vue au premier rechargement.
- **La dernière règle `headers` qui matche l'emporte** (vérifié en vrai avec `curl -I` après
  déploiement, pas déduit de la doc) : c'est pourquoi le fourre-tout `**` est écrit **en
  premier** et les règles précises après. Inverser l'ordre casserait le cache long des assets.
- **Les en-têtes s'appliquent au chemin DEMANDÉ, pas à la cible de la réécriture** : `/partie/x`
  ne matche pas `/index.html`. C'est la deuxième raison d'avoir un `**` fourre-tout.
- **iOS** : l'installation passe toujours par Safari → « Ajouter à l'écran d'accueil ». Le HTTPS
  de Firebase règle en revanche la question du contexte sécurisé — Wake Lock, vibration et
  service worker fonctionnent sur le domaine, sans le certificat auto-signé de `dev:mobile`.

---

## Environnement

- OS : Windows 11. Shell par défaut PowerShell (outil Bash dispo aussi).
- Dossier : `c:\Users\kevin\Documents\Flechettes`. Repo **git initialisé** (branche `main`,
  historique par lots, pas de remote — le déploiement passe par la CLI Firebase, pas par CI).
- Échelle : usage perso + potes. Parc **mixte iPhone + Android**.
- Dév & test principal sur un **appareil Android** (Chrome → DevTools / remote debug faciles).
  Tester sur un vrai iPhone avant de considérer le projet fini.

