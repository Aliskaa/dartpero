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
- **Saisie fléchette par fléchette, et elle seule** (grille 1-20 + 25, bascule S/D/T
**momentanée** — elle retombe sur Simple après chaque fléchette) : c'est la **condition
technique** des stats de doubles et de l'entraînement.
⚠️ **La « saisie hybride » n'existe plus.** Le mode « rapide » (un score de volée 0-180 au
lieu de trois fléchettes) était une décision de cadrage ; l'utilisateur l'a **retiré après
plusieurs parties réelles, faute de s'en servir**. Décision renversée en connaissance de
cause, pas par oubli — ne pas la « restaurer » en croyant réparer un accident (voir
l'incident `61b60ac` plus bas, qui lui en était un). Tout le code est parti avec :
`PaveRapide`, le port `BuildVisitFromScore`, son use case, `x01/scoring.ts` (`composeVisit`)
et `findExactScore`. Récupérable dans l'historique à `d531a7e` si l'envie revenait.
- **Modes de jeu : X01 et Tour du monde** (lot 5a), **entraînement solo** (lot 5b), puis
**Cricket** (lot 5c). Killer et Shanghai restent **hors périmètre v1** — la couture
`GameMode` (`src/core/domain/games/index.ts`) les accueillera sans refonte, elle l'a
maintenant prouvé deux fois.
- **Réglages X01 par défaut** : **501**, **2 legs à gagner**, **double out** activé,
**double in** désactivé. Tous modifiables à la création de partie.
⚠️ **On ne dit plus « best of N ».** C'est une convention à **deux** joueurs : elle compte
les legs *joués*, et ne tient que parce qu'à deux, « premier à 2 » ne peut pas dépasser 3
legs. À trois ou quatre, la même partie peut en durer six — le libellé mentait. Le domaine
a toujours stocké `legsToWin` (« premier à N ») : c'est désormais ce que l'UI affiche, via
`libelleLegs` / `libelleLegsCourt` (`src/ui/labels.ts`). `X01Config.legsForBestOf` survit
pour le défaut et ses tests, mais **plus aucun écran ne l'appelle**.
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

## Règles du Cricket (référence — NE PAS improviser)

Quatrième mode, ajouté au lot 5c. Le jeu tactique du lot : on n'y court pas après un score,
on ferme des cibles avant les autres.

- **Sept cibles** : **20, 19, 18, 17, 16, 15 et la bulle**. Comme pour le Tour du monde, la
liste vit dans la config, donc dans le journal — une partie ancienne reste rejouable si la
liste par défaut change un jour.
- **Trois marques ferment une cible.** Un simple vaut 1 marque, un double 2, un triple 3 :
un T20 ferme le 20 d'un coup. Les marques d'une même volée se cumulent normalement.
- **Le surplus marque des points**, mais **seulement si la cible est encore ouverte chez au
moins un adversaire**. Fermer le 20 avec un T20+T20 quand tout le monde l'a fermé ne
rapporte rien : c'est du gaspillage, et c'est voulu.
- ⚠️ **Une fléchette hors des sept cibles ne vaut rien** — ni marque, ni point. Le 12 n'existe
pas au Cricket.
- **Il n'y a pas de bust** : une volée ne peut jamais faire reculer. La volée fait toujours
3 fléchettes, sauf celle qui gagne la partie.
- **Victoire (variante standard)** : le premier joueur qui a **fermé les sept cibles** ET qui
possède **un score supérieur ou égal** à celui de chaque adversaire. Fermer tout en étant
mené ne gagne pas — il faut d'abord rattraper les points.
- ⚠️ **Variante « cut-throat » : les points s'ajoutent aux ADVERSAIRES**, pas à soi. Marquer
devient une punition qu'on distribue, et **le plus petit score gagne** : on l'emporte en
ayant fermé les sept cibles avec un score **inférieur ou égal** à chacun. C'est la seule
règle du projet où le sens de la comparaison s'inverse — elle est testée des deux côtés.
- La partie tient en **un seul tour de table** : ni leg, ni set. À la différence du Tour du
monde, **on ne finit pas le tour de table** : la condition de victoire du Cricket exige déjà
d'être devant aux points, donc celui qui la remplit a mérité son avance.

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

**Principe directeur : « la feuille de match ».** *(piste E, lot visuel)*
Le décor n'est plus une matière, c'est une **structure** : la fiche de ligue punaisée derrière
le bar. Des colonnes, des filets épais, des cases qu'on remplit. **Zéro dégradé, zéro biseau,
zéro angle arrondi.** Bois, laiton et feutre restent la palette, mais ils ne modèlent plus
rien : le laiton ne sert qu'à marquer la ligne de celui qui lance, le bois se replie sur les
cadres. Les nombres lus à 3 mètres sont en craie quasi-blanche sur feutre sombre.

⚠️ **Angle vif partout.** Les tokens `--radius-*` valent **0** dans `@theme`, et les classes
`rounded-*` ont été retirées de tout `src/ui`. Remettre un rayon dans le `@theme` les
rallumerait toutes d'un coup — c'est le point de contrôle unique.

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


**Vocabulaire de la feuille** (classes de `@layer components` dans `src/index.css`) — aucune
image, tout est CSS ou SVG inline :
`.feutre-tapis` (le sol) · **`.feuille`** (le conteneur : ardoise cerclée d'un filet de craie
de 3 px) · **`.bandeau-feuille`** (en-tête **en inversion** : craie pleine, texte sombre —
réservé aux en-têtes de colonnes) · **`.bandeau-match`** (bandeau de partie, sombre, refermé
par un filet de 3 px) · **`.bandeau-bas`** (la nav) · **`.entete-colonne`** (libellé de
colonne) · `.ligne-tableau` (une ligne : un filet, rien d'autre) · **`.au-lancer`** (filet de
laiton **dans** la marge + voile — remplace le halo) · **`.filet-colonne`** ·
**`.ligne-saisie`** (la ligne sur laquelle une fléchette est « écrite ») · `.cadre-bois`
(encadrement plat) · `.ardoise-craie` (panneau) · `.laiton-poli` (laiton **plein et plat**,
tranche franche de 4 px) · `.touche` (filet de craie, tranche de 2 px, **s'inverse** à
l'appui) · `.chiffres` · `.trace-craie` · `.grave` · `.filet-laiton` · `.chargement-balai`.

⚠️ **`.bois-veine` et l'animation `halo` ont été supprimées** : le veinage tirait l'œil vers
le décor, et une fiche ne rayonne pas. Le joueur au lancer se signale par `.au-lancer`.

**Composants réutilisables** dans `src/ui/composants/commun/` — toujours réutiliser, ne jamais
dupliquer de variante ad hoc : `Button` (primaire laiton / secondaire cadre bois / discret /
danger, tailles `md` et `lg`), `Avatar` (pastille couleur + initiales), `Cible` (plateau de
fléchettes en SVG génératif), `Enseigne` + `LogoHero`, `Panneau` (ardoise dans un cadre bois,
bandeau `titre` en `<h2>` **ou** `enTete` libre), `StatTile`, `EmptyState`, `Skeleton`,
`Spinner` / `SpinnerLigne`, `MessageErreur`, `EcranErreur`, `ChoixSegmente` (le rail à
curseur de laiton, tailles `md` et `sm`), `CarteImpacts` (la carte de chaleur du plateau).
La géométrie du plateau — ordre des secteurs, rayons des anneaux — vit dans
`geometrieCible.ts`, partagée par `Cible` et `CarteImpacts` : deux copies de ces rayons
finiraient par ne plus se superposer.
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
│ ← LEG 2 | 501 · PREMIER À 2 [DO] │  bandeau de match
├──────────────────────────────────┤
│ JOUEUR          │ VOLÉE │  RESTE │  en-têtes EN INVERSION (craie pleine)
│▌■ KEVIN         │  140  │    361 │  ZONE LECTURE — une ligne par joueur
│  T20  T20  S20  │moy 140│  ‖ 3 f │  ▌ = filet de laiton : c'est son tour
│ ■ JULIEN        │   83  │    418 │  ■ = carré à la couleur du profil
│  T19  S19  S7   │moy 83 │  ‖ 3 f │  fléchettes écrites sur leur ligne
│ ⌖ SORTIE   T20   T7   D20        │  dernière ligne, filet vert, ≤ 170
├──────────────────────────────────┤
│   1⁶⁰ 2  3  4  5                 │  ZONE SAISIE
│   6  7  8  9 10                  │  cibles ≥ 48 px, touches en relief
│  11 12 13 14 15                  │  valeur réelle en exposant hors simple
│  16 17 18 19 20                  │
│  [25] [0] [   ↶ Annuler   ]      │  pas de touche BULL : c'est DOUBLE + 25
│  [SIMPLE][DOUBLE][TRIPLE]        │  rangée du pouce ; retombe sur SIMPLE
└──────────────────────────────────┘             après chaque fléchette
```

**Une ligne par joueur, toujours** — la disposition ne change pas avec le nombre de joueurs,
seule l'**échelle** du reste suit (2 joueurs → `4.25rem`, 3 → `3.25rem`, 4 → `2.5rem`). Les
deux dernières colonnes sont à **largeur fixe** (`GRILLE_LIGNE`, exportée par `LigneJoueur` et
réutilisée par la ligne d'en-têtes) : c'est en alignant les chiffres d'une ligne à l'autre
qu'on les compare, et il faut pour ça que les colonnes existent vraiment.

**Portrait** par défaut (téléphone posé contre un mur). **Paysage** (téléphone couché) : les
deux zones passent **côte à côte**, lecture à gauche et pavé à droite — empiler en paysage
écraserait les deux, le tableau deviendrait illisible à 3 mètres et les touches passeraient
sous le seuil des 48 px. La bascule est portée par `DispositionPartie` et vaut pour les quatre
modes. ⚠️ Elle dépend de la **hauteur** autant que de l'orientation (variante `paysage`,
définie dans `src/index.css`) : ce qui manque au téléphone couché, c'est la hauteur — une
tablette et un navigateur de bureau gardent la disposition normale.

---



## Arborescence (cible)

```
src/
├─ core/
│  ├─ domain/
│  │  ├─ games/           ← UN DOSSIER PAR MODE DE JEU
│  │  │  ├─ index.ts      la couture : GameModeId, AnyMatchState, GameModes
│  │  │  ├─ x01/          config · rules · stats · career
│  │  │  ├─ tour-du-monde/     config · rules
│  │  │  ├─ cricket/           config · rules
│  │  │  └─ checkout-practice/ config · rules      (solo)
│  │  ├─ value-objects/   Dart, Segment, Multiplier, Score, PlayerColor, ids
│  │  ├─ entities/        Visit, Player          (transverses aux modes)
│  │  ├─ events/          MatchEvent : X01Started | TourDuMondeStarted |
│  │  │                   CricketStarted | CheckoutPracticeStarted |
│  │  │                   RoundStarted | VisitRecorded
│  │  └─ services/        dartSearch · checkout · visitOutcome · dartboardHits
│  │                      ⚠️ TRANSVERSES : un mode n'importe jamais un autre mode
│  └─ application/
│     ├─ ports/driving/   StartMatch, RestartMatch, RecordVisit, UndoLastVisit,
│  │                   PreviewVisit,
│     │                   GetMatchState, GetCheckoutSuggestion,
│     │                   GetMatchStats, GetMatchHistory, GetMatchMode,
│     │                   GetOngoingMatch, GetPlayerStats, DeleteMatch,
│     │                   ManagePlayers, ManageBackup, PlayTourDuMonde,
│     │                   PlayCricket, PreviewCricketVisit, PlayCheckoutPractice
│     ├─ ports/driven/    MatchRepository, PlayerRepository, Clock, IdGenerator,
│     │                   Haptics, ScreenLock, Preferences, RandomSource, Announcer
│     └─ use-cases/       + backupSchema.ts (validation d'un JSON importé)
├─ infrastructure/        dexie/ · device/ · memory/ · system/
├─ composition/           container.ts   ← seul point de câblage
├─ ui/
│  ├─ composants/         commun/ (dont ApercuPartie, qui ouvre l'union des modes,
│  │                      et DispositionPartie, l'ossature portrait/paysage)
│  │                      x01/ · tour-du-monde/ · cricket/ · checkout-practice/
│  ├─ ecrans/             games/ ← MÊME DÉCOUPAGE QUE LE DOMAINE
│  │                        PartieEcran (aiguillage) · x01/ · tour-du-monde/ ·
│  │                        cricket/ · checkout-practice/
│  │                      + les écrans transverses : Accueil, Joueurs,
│  │                        NouvellePartie, Historique, Statistiques, Réglages
│  ├─ hooks/              useX01 · useTourDuMonde · useCricket ·
│  │                      useCheckoutPractice · useJoueurs ·
│  │                      useAppareil (wake lock, préférences, voix)
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
  règles de sortie rendues transverses. **201 tests verts.**
- [x] **Lot 5c** — **Cricket** (quatrième mode, variantes standard et cut-throat) et **mode
  paysage** pendant une partie, porté par `DispositionPartie` pour les quatre écrans de jeu.
  Deux bugs antérieurs corrigés au passage : `backupSchema` et `GetOngoingMatch` ne
  connaissaient que le X01. **248 tests verts.**
- [x] **Lot UX** — cinq frictions d'usage corrigées avant toute refonte visuelle : la voix
  qui appelle le joueur suivant, « On remet ça », les réglages de partie mémorisés, l'ordre de
  passage réordonnable, et le bouton « Annuler » qui dit ce qu'il va défaire. Nouveau port
  `RestartMatch`. **263 tests verts.**
- [x] **Lot visuel — piste E, « La feuille de match »** : colonnes réelles avec en-têtes en
  inversion, filets épais, bâtons de comptage, **angle vif partout** (tokens de rayon à 0,
  `rounded-*` retirées de tout `src/ui`). Vérifié à l'écran, pas seulement en tests.
  **263 tests verts, aucun modifié.**
- [x] **Lot « ce que l'usage a tranché »** — deux décisions de cadrage renversées **par la
  pratique**, pas par le code : le **« best of N » remplacé par « premier à N legs »** (il ne
  voulait plus rien dire à trois ou quatre joueurs, où la partie peut durer plus de legs que
  le format n'en annonce), et le **mode rapide retiré** après plusieurs soirées sans jamais
  s'en servir — pavé, port, use case, `composeVisit` et `findExactScore` compris.
  **255 tests verts** (−7 sur `composeVisit`, −2 sur la saisie rapide, +1 qui interdit son
  retour discret).
- [x] **Lot « ce qu'on regarde après la partie »** — deux idées reprises à une app du Play
  Store (captures fournies par l'utilisateur, **hors dépôt**) : la **carte des impacts** (où les fléchettes se
  plantent, dessinée sur un plateau) et le **filtre de période** (Aujourd'hui / 7 j / 30 j /
  Tout) sur l'écran Statistiques. Nouveau service transverse `dartboardHits`, port
  `GetPlayerStats` qui prend une fenêtre de temps, `ChoixSegmente` remonté dans `commun/`.
  **275 tests verts**, relu à l'écran — trois défauts n'auraient pas été vus autrement.
- [ ] **Lot 6** — *(optionnel, si un jour)* sync / classement — un adapter, zéro refonte

**Écarté de ce lot, en attente d'arbitrage** (proposé le même jour, non retenu pour l'instant) :
le filtre de mode sur l'historique, l'ordre de passage aléatoire au lancement, et
`legsPlayed` dans `CareerStats` (« 12 legs gagnés » ne dit rien sans son dénominateur).

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
- ~~**Le mode rapide fabrique des fléchettes synthétiques** (`composeVisit`)~~ et ~~**sur une
sortie, l'app demande le nombre de fléchettes utilisées**~~ — **caduc** : le mode rapide a été
retiré du projet (voir § Décisions structurantes). Ce qu'il faut en retenir, parce que la
technique resservira : les 9 totaux impossibles en 3 fléchettes (179, 178, 176, 175, 173, 172,
169, 166, 163) n'étaient **jamais codés en dur** — ils tombaient tout seuls de la même
recherche que les checkouts, qui rendait `null` sur un total hors d'atteinte.
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
- **L'écran de match a enfin un en-tête** : leg/set en cours, score de départ, format
(« premier à N »), badges DI/DO, et surtout un **bouton retour** — il n'existait aucun moyen
de quitter une partie en cours.
- ~~**Le mode rapide projette le reste avant validation**~~ — **caduc**, le mode a été retiré.
- **Les icônes sont toujours `aria-hidden`.** Sans ça elles entreraient dans le nom accessible
des boutons (« ↶ Annuler » au lieu de « Annuler ») et casseraient les requêtes par rôle.
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
- **Le pavé de saisie est celui du X01** — à l'époque avec `rapide`/`onRapide` rendus
optionnels, puisqu'une manche d'entraînement dure une seule volée. Ces deux props ont depuis
disparu avec le mode rapide : le pavé n'a plus qu'une forme, pour les quatre modes.

### Décisions du lot 5c (Cricket, mode paysage)

**Le quatrième mode a coûté le même prix que le troisième** : un dossier `games/cricket/`, un
événement d'ouverture, trois lignes dans chaque aiguillage. La couture tient toujours.

- ⚠️ **Le Cricket a demandé DEUX ports, pas un** : `PlayCricket` et **`PreviewCricketVisit`**.
C'est le premier mode où la partie peut se gagner **sur la deuxième fléchette d'une volée** ;
sans un port de prévisualisation synchrone, l'écran attendrait une troisième fléchette qui ne
viendra jamais avant d'annoncer le vainqueur. Même raison qu'au lot 3 pour `PreviewVisit`, et
même règle : l'UI ne réimplémente jamais les règles, elle les interroge.
- ⚠️ **La victoire est vérifiée pour TOUS les joueurs à la fin d'une volée**, pas seulement
pour le lanceur. C'est le cas tordu du cut-throat : un joueur qui a tout fermé ne reçoit plus
de points, tandis que ceux des autres montent — il peut donc devenir le plus bas **pendant le
tour de quelqu'un d'autre**. Sans cette vérification, la partie continuerait alors qu'elle est
gagnée, et personne ne comprendrait pourquoi.
- **Les marques sont posées une par une**, pas trois d'un coup : un triple peut à la fois
finir de fermer une cible **et** marquer des points avec ce qui dépasse. Compter le triple en
bloc perdrait ce reliquat.
- **Le pavé du Cricket n'a que les sept cibles**, plus `0` et `Annuler`. Afficher les vingt
secteurs alors que dix-neuf d'entre eux ne valent rien serait un piège. La bascule S/D/T y
est en revanche essentielle — c'est elle qui dit combien de marques la fléchette pose — et
elle **retombe sur Simple** après chaque fléchette, comme au X01.
- **La variante se choisit à la création de partie** (standard / cut-throat) et vit dans la
config, donc dans le journal : une partie ancienne se rejoue avec la variante sous laquelle
elle a été jouée.
- **Les statistiques de carrière restent au X01**, comme pour le Tour du monde : la moyenne 3
fléchettes n'a pas de sens quand dix-neuf secteurs sur vingt valent zéro.

**Le mode paysage n'est pas un écran de plus, c'est une bascule de disposition.**

- **`DispositionPartie` porte l'ossature des quatre écrans de jeu** (bandeau, zone lecture,
zone saisie). Elle vivait recopiée dans chaque mode ; c'est le paysage qui a imposé de la
remonter — quatre copies d'une disposition, c'est trois occasions de l'oublier.
- ⚠️ **La bascule dépend de la HAUTEUR autant que de l'orientation** :
`@custom-variant paysage (@media (orientation: landscape) and (max-height: 34rem))`. Ce qui
manque au téléphone couché, c'est la hauteur, pas la largeur — une tablette en paysage a la
place de garder la disposition normale, et un navigateur de bureau aussi. Écrire la condition
sur la seule orientation aurait cassé l'affichage partout ailleurs.
- **Pas de bouton de rotation, pas de préférence** : l'app suit le téléphone. Un réglage de
plus à trouver pour une chose que le geste dit déjà serait de la friction — et le cadrage dit
« zéro friction ».
- **`orientation: 'any'` dans le manifeste PWA** (elle valait `'portrait'`) : sans ça, l'app
installée resterait bloquée en portrait et la bascule ne servirait à rien sur le seul mode
d'usage qui compte.
- **Les pavés se compactent en paysage** (`paysage:` sur les hauteurs et les tailles de
texte), mais **les cibles restent ≥ 48 px** : c'est un plancher, pas une variable
d'ajustement. (Le pavé du mode rapide était le seul à pouvoir encore demander un défilement —
il n'existe plus, plus aucun pavé ne défile.)
- **Aucun test n'a changé** en remontant les quatre écrans dans `DispositionPartie`, ce qui
valide au passage que la refonte n'a touché à aucun comportement.

**Deux bugs antérieurs découverts en chemin**, tous deux invisibles tant qu'on ne sortait pas
du X01 — la leçon : *ce qui aiguille sur le mode doit tout aiguiller*.

- **`backupSchema` ne validait que `MatchStarted` et `VisitRecorded`** : une sauvegarde JSON
perdait silencieusement les parties de Tour du monde et d'entraînement à la réimportation.
Le test de sauvegarde exporte désormais **une partie de chaque mode**, puis les relit.
- **`GetOngoingMatchUseCase` projetait avec `X01Rules`** au lieu de la couture : l'accueil ne
proposait jamais de reprendre une partie qui n'était pas un X01.

### Décisions du lot visuel (piste E, « la feuille de match »)

Trois pistes avaient été proposées (« La Cible », « La Feuille de match », « Le Boîtier »).
L'utilisateur a tranché pour **E**, la plus sobre et la plus lisible — celle qui remplace le
décor par de la **structure**.

- ⚠️ **L'angle vif a un point de contrôle unique** : les tokens `--radius-*` à 0 dans
`@theme`. Les classes `rounded-*` ont été retirées de `src/ui` par-dessus, pour qu'on ne lise
pas dans le code une intention que le CSS annule. Les deux ensemble, pas l'un ou l'autre.
- **Le tableau est un vrai tableau** : une ligne d'en-têtes (`Joueur` / `Volée` / `Reste`) en
inversion craie, puis une ligne par joueur sur la même grille. `GRILLE_LIGNE` est exportée par
`LigneJoueur` et consommée par `Tableau` — une seule définition de colonnes, donc aucun
désalignement possible entre l'en-tête et les lignes.
- ⚠️ **Le halo qui respire est mort, remplacé par `.au-lancer`** : un filet de laiton dans la
marge et un voile. Une fiche ne rayonne pas, et un `box-shadow` animé en continu coûte un
repaint par image sur un vieux téléphone. Les quatre modes ont suivi.
- **Les legs se comptent en bâtons** (`Batons`), quatre traits barrés par un cinquième. Volé à
la piste B, comme annoncé : à trois mètres l'œil reconnaît un paquet de cinq sans compter, là
où il devait dénombrer des losanges.
- **Les fléchettes sont écrites sur une ligne** (`.ligne-saisie`), comme sur une feuille qu'on
remplirait au stylo — et non dans des pastilles. Les trois emplacements restent toujours
présents : c'est ce qui garde l'alignement d'une ligne à l'autre.
- **La suggestion de sortie est devenue la dernière ligne de la feuille**, filet vert et
cibles alignées sous les colonnes de fléchettes. Elle ne flotte plus au-dessus du tableau.
- **La touche s'inverse à l'appui** (craie pleine, texte sombre) au lieu de s'enfoncer dans un
dégradé : c'est le signal le plus fort possible, et il ne coûte pas un pixel de relief.
- **`StatTile` réserve deux lignes au libellé.** Sans cette hauteur fixe, « Plus haut
checkout » repoussait son chiffre bien plus bas que celui de « 180 » et la rangée cessait
d'être comparable — or on ne la lit que pour comparer.
- **L'accueil devient la feuille du soir** : une liste numérotée des joueurs plutôt que des
pastilles superposées. La cible qui tourne recule à 12 % d'opacité — sur une fiche, le décor
ne concurrence pas le nom.
- **Vérifié à l'écran.** Le lot a été relu sur captures (Chrome piloté par `playwright-core`,
390 × 844) et non seulement au vert des tests : trois défauts n'auraient pas été vus autrement
— la feuille qui flottait en haut d'une zone vide, l'ordre affiché qui contredisait les
numéros d'ordre de passage, et deux touches restées bordées de vert et de marron.

⚠️ **Incident à connaître** : le commit `61b60ac` (mise à jour de dépendances, hors lot) a
**supprimé `PaveRapide.tsx`**, le bloc ⚡ de `PaveFlechettes` et la ligne de test qui les
couvrait — laissant deux tests rouges. Il a été restauré depuis `cc8faf7`. À surveiller si
d'autres commits « de dépendances » touchent `src/ui`.
**Épilogue** : le mode rapide a finalement été retiré **volontairement** par l'utilisateur
(lot « saisie unique »), après l'avoir gardé plusieurs parties sans jamais s'en servir. Ne
pas confondre les deux disparitions : la première était un accident, la seconde un verdict
d'usage.

### Décisions du lot UX (l'usage avant la peinture)

Cinq frictions relevées **dans le code**, pas d'impression : trois d'entre elles ne faisaient
que brancher des choses déjà écrites et jamais appelées.

- ⚠️ **`annonceTour` (« À toi, Julien ») existait depuis le lot 5b et n'était appelée nulle
part.** La voix disait « 80 » sans dire pour qui ni à qui c'était le tour — alors que le
téléphone est posé à deux mètres du lanceur et que la voix est le seul canal qui porte
jusque-là. Corrigé pour les trois modes de groupe.
- ⚠️ **Une seule phrase par volée, jamais deux appels.** `SpeechAnnouncer.say` commence par
`speechSynthesis.cancel()` (une annonce en retard vaut moins que le silence) : dire le score
puis le tour ferait taire le score. D'où `annonceFinDeVolee(resultat, prochain)`, qui compose
« 180. À toi, Julien » en un énoncé. `resultat` peut être `null` — une volée blanche au
Cricket ne se commente pas, mais elle passe quand même la main, et **ça**, il faut le dire.
- **On n'appelle personne en fin de partie ni en solo** : `prochainJoueur` rend `null`. Le
helper vit dans `ui/hooks/tourDeTable.ts` et son paramètre est **structurel**, pas l'union des
états : importer les trois modes ferait de lui un endroit qui les connaît tous, rôle réservé
à la couture `GameModes`.
- ⚠️ **`RestartMatch` rappelle les lancements existants, il ne recopie PAS l'événement
d'ouverture** dans un journal neuf. C'est la seule façon qu'une relance passe par exactement
les mêmes contrôles qu'un premier départ : profil supprimé entre-temps, validation des règles,
et le tirage d'une nouvelle cible en entraînement. Recopier l'ouverture aurait dupliqué ces
trois décisions, donc créé trois occasions de diverger. Le use case est donc un **composeur** :
ses dépendances sont les quatre ports de lancement, injectés par le composition root.
- **Corollaire assumé** : un entraînement relancé **retire ses cibles**. On refait le même
exercice, pas la même série — rejouer des restes qu'on connaît déjà n'entraînerait personne.
- **`ActionsFinDePartie` sert les quatre résumés.** « On remet ça » passe en action principale,
« Changer les règles » en secondaire, « Accueil » en discret. Avant, la seule action offerte
renvoyait sur un formulaire **remis à zéro** : une dizaine de taps entre deux parties, alors
qu'on en enchaîne quatre ou cinq par soirée.
- **Les réglages de partie passent par le port `Preferences`**, qui servait déjà à la voix.
⚠️ La sélection de joueurs mémorisée est **dérivée et filtrée** sur les profils
qui existent encore, jamais stockée en état : un profil supprimé depuis resterait sinon coché
en fantôme et ferait échouer le lancement sur un joueur inconnu.
- **L'ordre de passage était déjà l'ordre des taps** — il fallait tout décocher pour
intervertir deux joueurs. Deux chevrons de **48 px** (le plancher tactile, pas une variable
d'ajustement) et une ligne qui nomme celui qui commence.
- ⚠️ **Le bouton « Annuler » a deux étiquettes, pas une.** Une touche fait une demi-largeur
d'écran : « Annuler la volée de Julien » n'y tient pas. `libelleAnnulation` rend donc un
`{ court, complet }` — le court s'affiche, le complet est le nom accessible. Comme le court
est contenu mot pour mot dans le complet, la règle « label in name » (WCAG 2.5.3) tient. Ce
qui lève l'ambiguïté, c'est le **changement visible** : « Annuler T20 » dès qu'une fléchette
est plantée, « Annuler » tout court signifiant désormais « la dernière volée ».
- **L'auteur de la dernière volée se lit sur `Visit.playerId`**, dans la projection. L'UI ne
rejoue aucune règle pour savoir à qui était le tour d'avant.
- **Écarté du lot** : la touche T20 dédiée. Proposée puis retirée par l'utilisateur — la
bascule momentanée reste le seul chemin vers un triple.

~~⚠️ **`npm run lint` est rouge sur ~20 fichiers pour cause de CRLF**~~ — **réglé depuis** :
`biome check .` passe sur les 181 fichiers. Il n'y a toujours **pas de `.gitattributes`** :
si des CRLF reviennent après un clone frais sous Windows (`core.autocrlf`), c'est là qu'il
faudra les arrêter (`* text eol=lf`), suivi d'un `biome check --write` dans un commit dédié.

- **`npm audit`** : 1 vulnérabilité « high » sur **react-router 7.12→8.2**
(*RSC Mode CSRF Bypass*, GHSA-qwww-vcr4-c8h2). **Non exploitable ici** : elle vise le mode
**RSC** (React Server Components) et l'exécution d'actions serveur — Dartpéro est une SPA
100 % cliente, sans serveur ni RSC. Le seul « correctif » proposé est un retour en 7.11.0.
Décision : **on reste en 7.18**, à réévaluer si un correctif sort dans la branche 7.12+.

---

### Décisions du lot « ce qu'on regarde après la partie »

Deux idées prises à une app du Play Store (captures fournies par l'utilisateur, **hors
dépôt** — `docs/exemples/` est ignoré), et **seulement
deux** : le reste de cette app a été écarté explicitement — « Sauver / Ne sauvez pas » en fin
de partie, l'annulation posée sur l'écran de résumé, un pavé à sept colonnes sous le plancher
des 48 px, et un « Double % » qui mesure la longueur du leg plutôt que l'adresse.

**La carte des impacts** — la seule statistique du projet qui mesure le bras.

- ⚠️ **`dartboardHits` est TRANSVERSE** (`domain/services/`), comme `visitOutcome` et
`checkout` : une fléchette dans le triple 20 est le même geste qu'on décompte un 501 ou qu'on
ferme une cible. Le service ne connaît donc **aucun mode**, seulement des fléchettes — c'est
ce qui lui permet de vivre là sans qu'un mode ait à en importer un autre.
- **Mais le cumul reste au X01**, comme le reste de l'écran. Ce n'est pas une hésitation :
mélanger un Tour du monde à la carte montrerait **l'itinéraire imposé** (20, puis 19, puis
18…) et non la visée. Le service est transverse, son alimentation ne l'est pas encore ; le
jour où l'écran gagnera un filtre de mode, il n'y aura rien à réécrire.
- **La carte voyage dans `PlayerCareer`, pas derrière un port à part.** Elle se calcule sur
**exactement** les mêmes projections que les moyennes ; l'exposer séparément obligerait à
rejouer tous les journaux une deuxième fois.
- ⚠️ **L'attribution des fléchettes passe par la projection, jamais par le journal.**
`VisitRecorded` ne porte pas de `playerId` (décision du lot 1) : c'est `state.history` qui
dit à qui était la volée. Un test le vérifie explicitement, parce que c'est exactement le
genre de raccourci qu'on serait tenté de prendre.
- **Une fléchette qui fait bust compte dans la carte** : elle a bien touché le plateau. Même
convention que la moyenne 3 fléchettes, et pour la même raison.
- ⚠️ **Ce n'est PAS la `Cible` décorative avec un calque par-dessus.** Sur un plateau déjà
rouge, vert, crème et noir, une couche de chaleur ne se lit pas — on ne sait plus si le rouge
est la cible ou la donnée. Le plateau est donc réduit à sa **structure** (des cases, des fils,
vingt numéros) et la seule couleur de l'image est la donnée. C'est la feuille de match
appliquée à un graphique. Un dégradé d'opacité piloté par les données n'est pas le « zéro
dégradé » de la charte : c'est de la donnée, pas du décor.
- **L'échelle est relative à chaque joueur** : la case la plus touchée est toujours à fond. On
compare des **formes** (« je dérive vers le 5 »), pas des volumes — le volume se lit dans le
tableau des moyennes, à sa place.
- **À égalité, la case qui vaut le plus passe devant** dans le classement des cases. Sans ce
départage, trois cases à trois touches s'annonçaient « S2, S3, S7 » : l'ordre de rangement du
plateau, pas un résultat.

**Le filtre de période** — « qui est chaud ce soir » plutôt que « qui est bon depuis toujours ».

- **Le port prend un identifiant, pas une date** (`TODAY` / `LAST_7_DAYS` / `LAST_30_DAYS` /
`ALL_TIME`), et c'est le **use case** qui le résout avec le port `Clock`. Faire calculer la
borne par l'UI aurait remis un `Date.now()` dans l'application et rendu le filtre intestable.
- ⚠️ **`Date` est utilisée dans le use case comme CALENDRIER, jamais comme horloge.** L'instant
courant vient de `Clock` ; `Date` ne sert qu'à savoir où tombe **minuit local**, ce qu'aucune
arithmétique en millisecondes ne sait faire (une journée fait 23 ou 25 heures deux fois par
an, et `setDate` gère ce décalage tout seul). Les tests construisent leurs bornes en heure
locale pour la même raison : écrites en UTC, ils dépendraient du fuseau de la machine.
- ⚠️ **Une partie appartient à la soirée où elle a COMMENCÉ** (`createdAt`), pas à celle où on
l'a touchée en dernier. Celle qu'on finit à 00h10 s'est bien jouée ce soir-là ; la couper en
deux ne rendrait service à personne. Testé.
- **« Tout » par défaut, jamais « Aujourd'hui ».** Un jour sans partie ouvrirait l'écran sur
du vide et l'app aurait l'air d'avoir tout perdu. La période n'est pas mémorisée non plus :
un « Aujourd'hui » retenu de la semaine dernière ferait exactement le même effet.
- ⚠️ **Deux écrans vides, pas un.** « Aucune partie au compteur » appelle à jouer ; « Rien sur
cette période » invite à élargir la fenêtre. Les confondre ferait croire à une base effacée —
c'est la pire chose que cet écran puisse dire. Testé des deux côtés.
- **La période fait partie de la `queryKey`** : chaque fenêtre garde son cache, revenir sur
« Tout » est instantané.

**Ce que la relecture à l'écran a rattrapé** (Chrome piloté par `playwright-core`, 390 × 844,
base semée directement dans IndexedDB — les tests étaient verts pendant ce temps) :

- le **« 20 » rogné en haut de chaque plateau** : les numéros vivent à 48,6 du centre, donc le
haut du glyphe sortait d'une `viewBox` calée à 100. Aucune requête par rôle ne dit qu'un
glyphe est coupé. Corrigé par une `viewBox` qui déborde de 4 unités. ⚠️ **`Cible` a le même
défaut latent** (`fontSize` 4,6 à 48,6) — invisible tant qu'elle reste à 12 % d'opacité sur
l'accueil, à corriger si elle sert un jour en grand ;
- **les cases chaudes fusionnaient en un disque doré** chez un joueur qui arrose : quinze
secteurs voisins à la même intensité, et plus ni secteur ni anneau distinguable. Les fils de
craie ne suffisent pas, ils s'effacent sous le laiton — chaque case allumée est donc **cernée
du fond**. C'est le traitement habituel d'une carte choroplèthe, et il ne coûte rien.

**Au passage** : `ChoixSegmente` (le rail à curseur de laiton) vivait recopié dans
`NouvellePartieEcran` ; il est remonté dans `commun/` avec une taille `sm`, plutôt que d'en
écrire une deuxième variante pour le filtre. Et `fakeServices` accepte désormais des
surcharges de dépendances — `SettableClock` était impossible à injecter sans ça, donc tout
filtre daté était intestable.

## Décisions ouvertes

1. ~~**Alfa Slab One** conservée ou remplacée par Oswald 700 pour l'enseigne.~~ **Tranchée au
   lot 3 bis** : conservée, mais réservée à l'enseigne et au nom du vainqueur.
2. ~~**Mode paysage « tableau »** (téléphone à plat sur une table).~~ **Tranchée au lot 5c** :
   la bascule est automatique, portée par `DispositionPartie`, et conditionnée à la hauteur
   plutôt qu'à la seule orientation.
3. ~~**Cricket**~~ **livré au lot 5c.** Restent les autres jeux fun (Around the Clock, Killer,
   Shanghai) — hors v1, la couture `GameMode` les accueillera.
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

