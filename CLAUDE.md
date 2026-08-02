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
- **PAS de Firebase, PAS d'authentification, PAS de réseau.** Décidé. Une partie se joue hors
ligne, autour d'un seul téléphone : un écran de login serait rédhibitoire. Toute la
persistance passe par **Dexie (IndexedDB)** derrière les ports `MatchRepository` /
`PlayerRepository`. Une éventuelle sync cloud serait **un adapter de plus**, jamais une
dépendance du cœur.
- **Les joueurs sont des profils LOCAUX**, pas des comptes : pseudo + couleur, créés en 2
secondes, portant leurs stats **sur cet appareil**. Filet de sécurité obligatoire :
**export / import JSON** de toute la base (lot 4).
- **Le match est une liste d'événements** (`MatchEvent[]`), l'état affiché est une
**projection** rejouée depuis ces événements. C'est le choix qui rend l'**annulation**
triviale et fiable (on se trompe de saisie très souvent en pleine partie).
- **Saisie hybride** : fléchette par fléchette par défaut (grille 1-20 + bull, bascule S/D/T
persistante) — c'est la **condition technique** des stats de doubles et de l'entraînement —
**plus** un mode « rapide » (score de volée 0-180) basculable.
- **Modes v1 : X01 uniquement**, puis **entraînement solo** (lot 5). Cricket et jeux fun
(Around the Clock, Killer, Shanghai) sont **hors périmètre v1** — mais la couture
`GameMode` existe pour les accueillir sans refonte.
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


**Matières** (classes utilitaires dans `src/index.css`)
`.feutre-tapis` (texture feutre, bruit SVG inline — 0 image à charger) ·
`.cadre-bois` (`border-image` 9-slice) · `.laiton-poli` (dégradé métallique des boutons
primaires) · `.ardoise-craie` (fond tableau noir pour les stats secondaires).

**Composants réutilisables** dans `src/ui/composants/commun/` — toujours réutiliser, ne jamais
dupliquer de variante ad hoc : `Button` (primaire laiton / secondaire contour bois),
`ScoreTile` (chiffre géant), `SegmentGrid` (pavé S/D/T), `PlayerCard`, `Avatar` (pastille
couleur + initiales), `StatTile`, `EmptyState`, `Skeleton`, `Spinner`.

Icônes : **lucide-react**. Icône PWA générée par `npm run icons` depuis `scripts/icon.svg`
(cible stylisée, triple 20 en laiton, une fléchette plantée).

---



## Écran de match — disposition imposée

Deux zones nettement séparées, parce qu'on lit à 3 m et qu'on tape à 30 cm :

```
┌──────────────────────────────────┐
│  KEVIN  ●            JULIEN      │  ZONE LECTURE
│    141                 286       │  chiffres énormes (font-score),
│  ● ● ○   T20 20 —      moy 58.4  │  joueur actif = halo laiton
│  → T20 · T11 · D24               │  checkout dès reste ≤ 170
├──────────────────────────────────┤
│  [SIMPLE] [DOUBLE] [TRIPLE]      │  ZONE SAISIE
│   1  2  3  4  5                  │  compacte, atteignable au pouce
│   6  7  8  9 10                  │  cibles ≥ 48 px
│  11 12 13 14 15                  │
│  16 17 18 19 20                  │
│      [25]  [BULL]  [0]           │
│  ↶ Annuler          ⚡ Rapide     │
└──────────────────────────────────┘
```

**Portrait** par défaut (téléphone posé contre un mur). Un mode paysage « tableau » reste une
décision ouverte.

---



## Arborescence (cible)

```
src/
├─ core/
│  ├─ domain/
│  │  ├─ value-objects/   Dart, Segment, Multiplier, Score, MatchId, PlayerId, LegId
│  │  ├─ entities/        Visit, Leg, Set, Match, Player
│  │  ├─ events/          MatchEvent (VisitRecorded, LegWon, MatchFinished…)
│  │  └─ services/        x01Rules, checkout, matchStats, gameModes/
│  └─ application/
│     ├─ ports/driving/   StartMatch, RecordVisit, UndoLastVisit, GetMatchState,
│     │                   GetCheckoutSuggestion, GetPlayerStats, GetMatchHistory
│     ├─ ports/driven/    MatchRepository, PlayerRepository, Clock, IdGenerator,
│     │                   Announcer, Haptics, ScreenLock, Preferences
│     └─ use-cases/
├─ infrastructure/        dexie/ · speech/ · haptics/ · wakelock/ · system/
├─ composition/           container.ts   ← seul point de câblage
├─ ui/                    composants/ (+ commun/) · ecrans/ · hooks/ · providers/
└─ data/                  checkouts.json (table de finishes)
tests/                    domain/ · use-cases/ · fakes/ · ui/
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
- [ ] **Lot 3** — Écran match : saisie hybride, undo, checkout, wake lock, haptique
- [ ] **Lot 4** — Profils joueurs, historique, stats, export/import JSON, charte graphique
- [ ] **Lot 5** — Entraînement solo + annonce vocale
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

- **`npm audit`** : 1 vulnérabilité « high » sur **react-router 7.12→8.2**
(*RSC Mode CSRF Bypass*, GHSA-qwww-vcr4-c8h2). **Non exploitable ici** : elle vise le mode
**RSC** (React Server Components) et l'exécution d'actions serveur — Dartpéro est une SPA
100 % cliente, sans serveur ni RSC. Le seul « correctif » proposé est un retour en 7.11.0.
Décision : **on reste en 7.18**, à réévaluer si un correctif sort dans la branche 7.12+.

---

## Décisions ouvertes

1. **Alfa Slab One** conservée ou remplacée par Oswald 700 pour l'enseigne — à trancher **sur
   pièce** au lot 3, une fois l'écran de match à l'écran.
2. **Mode paysage « tableau »** (téléphone à plat sur une table) — après le lot 3 si le besoin
   se confirme.
3. **Cricket / jeux fun** (Around the Clock, Killer, Shanghai) — hors v1, la couture
   `GameMode` les accueillera.
4. **Sync cloud / classement entre potes** — hors v1 (lot 6 hypothétique). L'export/import
   JSON du lot 4 est le palliatif.
5. **i18n** : FR seul pour l'instant (aucun besoin identifié).

---

## Environnement

- OS : Windows 11. Shell par défaut PowerShell (outil Bash dispo aussi).
- Dossier : `c:\Users\kevin\Documents\Flechettes`. Repo **git initialisé** (branche `main`,
  pas encore de commit, pas de remote).
- Échelle : usage perso + potes. Parc **mixte iPhone + Android**.
- Dév & test principal sur un **appareil Android** (Chrome → DevTools / remote debug faciles).
  Tester sur un vrai iPhone avant de considérer le projet fini.

