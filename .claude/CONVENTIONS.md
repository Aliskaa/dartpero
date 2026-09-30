# CONVENTIONS.md — patterns de code (Dartpéro)

Ce que `CLAUDE.md` tranche (règles de jeu, architecture, décisions gravées) est le **quoi**.
Ce fichier est le **comment** : la forme concrète que prend le code une fois ces décisions
appliquées, extraite en relisant `src/` et `tests/` tels qu'ils sont réellement écrits — pas
inventée, pas aspirationnelle.

⚠️ **En cas de désaccord entre ce fichier et le code réel, c'est le code qui gagne.** Ce
fichier documente un état ; s'il dérive du code (une nouvelle forme prise ailleurs sans qu'on
revienne ici), c'est ce fichier qu'il faut corriger, pas le code qu'il faut aligner de force.
En cas de désaccord avec `CLAUDE.md` (une décision gravée), c'est `CLAUDE.md` qui gagne — voir
son propre tableau en tête de fichier.

Les agents de `.claude/agents/`, les skills de `.claude/skills/` et les règles de
`.claude/rules/` peuvent citer ce fichier plutôt que réénoncer ces patterns dans leur prompt.

---

## 1 · Value Objects & entités — le pattern « type + espace de noms »

Un Value Object est **un `type` et un `const` du même nom**, l'un décrit la forme, l'autre
porte les fonctions :

```ts
export type Dart = { readonly segment: Segment; readonly multiplier: Multiplier }
export const Dart = {
  of(segment, multiplier): Dart { /* factory validante, unique point d'entrée */ },
  single: (segment) => Dart.of(segment, 'SIMPLE'),
  points(dart): number { /* … */ },
}
```

- **Une seule factory validante** (`of`, parfois `create` pour une entité), qui **rejette** ce
  qui n'existe pas sur une vraie cible plutôt que de le corriger silencieusement. Le message de
  `DomainError` cite la valeur fautive (`` `Segment must be between 1 and 20, got ${segment}` ``).
- **`readonly` partout**, y compris dans les tableaux (`readonly Dart[]`).
- **Identifiants en branded types** via `Branded<T, 'Tag'>` (`src/core/domain/value-objects/ids.ts`),
  chacun avec son propre `of()` — jamais un `string` nu qui se glisserait où un autre id est
  attendu.
- **Constantes fermées** déclarées `as const`, avec le type dérivé de la constante plutôt que
  l'inverse (`SEGMENT_NUMBERS`, `GAME_MODE_IDS`) : une seule source de vérité pour la liste et
  son type.
- Les **fonctions privées non exportées** peuvent être nommées en français même dans
  `src/core/` (`estSegmentNumerote`, `nonVide`, `cloturee`) : la règle « cœur technique en
  anglais » de `CLAUDE.md` porte sur la **surface exportée** (types, propriétés, noms de
  factory), pas sur chaque variable locale d'une fonction. Les use cases et les hooks vont plus
  loin encore : leurs variables locales sont couramment en français (`avant`, `apres`, `suite`,
  `courant`) — voir § 4 et § 10.

## 2 · Erreurs

`DomainError` signale un **usage impossible** (fléchette inexistante, config absurde, volée
déjà close) — jamais un résultat de jeu normal. Un bust ou un checkout sont des **données**
(`VisitOutcome`), pas des exceptions : voir le commentaire en tête de `DomainError.ts`.

## 3 · Commentaires — le « pourquoi », jamais le « quoi »

Ce projet documente **plus** que le réflexe habituel « pas de commentaire si le code est
lisible ». Sur un symbole exporté ou un choix contre-intuitif, un court JSDoc explique la
raison — souvent en citant explicitement la décision de `CLAUDE.md` dont il découle.

- **`⚠️`** signale un piège : quelque chose qui a l'air cassé ou corrigeable, et qui ne l'est
  pas — ou l'inverse, un endroit où « corriger » casserait une garantie voisine.
- Côté UI, les commentaires portent des **chiffres mesurés** (largeurs en pixels, contrastes,
  budgets de colonnes — voir `LigneJoueur.tsx`), pas une description vague. Le lecteur doit
  pouvoir vérifier l'affirmation, pas seulement la croire.
- En éditant ce code : **préserver cette densité** sur le code exporté ou non-évident plutôt
  que l'élaguer par réflexe. Ce n'est pas une invitation à commenter ce qui est déjà lisible —
  la barre reste « la raison n'est pas déductible du code », seulement posée plus souvent ici
  qu'ailleurs.

## 4 · Use cases (`core/application/use-cases/`)

- Une classe par fichier, même nom que le fichier, `implements <PortDriving>`.
- Le constructeur ne prend que les ports **driven** nécessaires, en `private readonly`, dans un
  ordre stable : dépôts d'abord, puis `Clock`, puis `IdGenerator`/`RandomSource`.
- Une seule méthode publique `execute(...)`, toujours `async` — même sans `await` interne,
  pour rester cohérent avec le contrat `Promise` du port.
- **Règles avant écriture** : projeter l'état, appliquer les règles du domaine (qui lèvent si
  c'est illégal), et **seulement alors** ajouter l'événement et sauver. Voir
  `RecordVisitUseCase` : `X01Rules.applyVisit` tourne avant tout `matches.save`.
- Les ports de **prévisualisation** (`PreviewVisit`, `PreviewCricketVisit`,
  `PreviewTourDuMondeVisit`) sont **synchrones et sans dépendance** : le use case délègue
  directement à une fonction pure du domaine, sans constructeur à alimenter.

## 5 · Ports (`core/application/ports/`)

- Un port **driving** = un fichier qui porte les types `Command`/`Result`/`Query` (champs
  `readonly`) **et** l'interface, nommés d'après le use case qu'ils décrivent.
- Un port **driven** = une interface étroite, une seule capacité (`Clock`, `IdGenerator`,
  `RandomSource`…). Certains exposent un **null-object** à côté de l'interface
  (`NullHaptics`, `NullScreenLock`, `NullAnnouncer`) pour les plateformes qui n'ont pas la
  capacité — jamais un `if (haptics)` disséminé dans l'appelant.
- Les ports ISP à plusieurs opérations (`ManagePlayers`, `ManageBackup`) ne regroupent que ce
  qui est vraiment une seule responsabilité ; une modification est toujours **partielle**
  (`PlayerChanges` aux champs tous optionnels), jamais un remplacement complet.

## 6 · Adapters d'infrastructure

- Implémentent l'interface du port, rien de plus.
- Les adapters Dexie prennent `db: DartperoDatabase` par le constructeur et traduisent via un
  mapper privé `versX` (`versRecord`) — jamais de champ Dexie qui fuite tel quel vers le
  domaine.
- Les noms de méthode reprennent exactement ceux du port (`save`, `findById`, `listRecent`,
  `listAll`, `delete`).

## 7 · Composition root (`src/composition/container.ts`)

- **Seul fichier** qui a le droit de `new` un adapter.
- `Dependencies` (les ports driven) et `Services` (les ports driving que l'UI peut appeler,
  plus `devices`) sont deux types distincts.
- `createServices(deps)` est pure et injectable — c'est elle que `fakeServices()` appelle dans
  les tests, jamais une réimplémentation du câblage.
- `createBrowserDependencies()` / `createBrowserServices()` sont les **seules** fonctions du
  projet qui touchent une vraie API navigateur.

## 8 · Imports

- Dans `src/core/**` : **toujours relatifs** (`../../domain/...`), jamais `@/...` — vérifié par
  `tests/architecture/hexagonalBoundary.test.ts`, pas seulement une convention déclarative.
- Partout ailleurs (`ui/`, `infrastructure/`, `composition/`, `tests/`) : l'alias `@/` depuis
  `src/`.
- `organizeImports` de Biome trie à l'enregistrement / au `lint:fix` — ne pas trier à la main.

## 9 · Composants UI

- `Props` déclaré juste au-dessus du composant, champs `readonly`, noms en français
  (`nom`, `couleur`, `reste`, `actif`, `vainqueur`…).
- Les classes Tailwind se composent via de petites fonctions pures et des
  `Record<Variante, string>` (`classesBouton`, `VARIANTES`, `TAILLES`) plutôt qu'une chaîne de
  ternaires en ligne : ça garde les classes **statiques** (Tailwind ne détecte pas les classes
  construites dynamiquement) et la liste des variantes exhaustive.
- Accessibilité : un chiffre qui change vit dans un `<output aria-label="…">`, jamais un
  `<p>` ; les icônes `lucide-react` sont toujours `aria-hidden` ; le libellé visible d'un
  contrôle reste un sous-texte de son nom accessible (WCAG 2.5.3) — voir
  `Annulation { court, complet }` dans `labels.ts`.
- Pas de `rounded-*`, pas de couleur en dur — seulement les tokens (`text-craie`,
  `bg-laiton`…), vérifié par `tests/architecture/themeBoundary.test.ts`.
- Un ratio dont le dénominateur peut valoir zéro s'affiche via `pourcent(valeur, occasions)`
  (`src/ui/labels.ts`) : sans occasion, un tiret **cadratin** `—` (U+2014), jamais « 0 % » — qui
  se lit « il a tout raté ». Trois appelants : matchs, legs, doubles. ⚠️ Un pourcentage de
  **progression** (`LigneCible.tsx`) garde son `0` : là, zéro est un vrai zéro, pas une absence.

## 10 · Hooks (`ui/hooks/use<Mode>.ts`)

- Un hook par mode de jeu, qui prend `matchId` et rend **un seul objet plat** (état + valeurs
  dérivées + actions) — les composants déstructurent ce qu'il leur faut, jamais deux hooks de
  mode appelés côte à côte.
- TanStack Query sert de **cache uniquement** : `staleTime: Infinity`,
  `queryKey: ['match', matchId]`, et chaque mutation appelle
  `queryClient.setQueryData(...)` avec l'état renvoyé par le use case, jamais un
  `invalidateQueries` qui redéclenche un fetch.
- Une valeur qui doit survivre aux rendus sans réarmer un callback passe par une **ref**
  resynchronisée à chaque rendu (`profilsRef.current = profils`) plutôt que par une dépendance.
- Les erreurs `unknown` sont normalisées une seule fois, via un petit `message(erreur: unknown):
  string` en tête de fichier.

## 11 · Tests

- **Fakes, jamais de mocks.** Tout vit dans `tests/fakes/index.ts` : horloges déterministes
  (`TickingClock`, `SettableClock`), `SequentialIdGenerator`, et **`CyclingRandomSource` qui
  boucle sur les valeurs plutôt que d'en renvoyer une fixe** — un aléa figé masquerait un bug de
  tirage. `fakeServices(surcharges)` enveloppe le **vrai** `createServices` autour d'adapters en
  mémoire : ne jamais réimplémenter le composition root dans un test.
- Chaque suite de domaine a son `helpers.ts` (`tests/domain/helpers.ts`) avec des verbes
  français courts qui s'appuient sur la vraie projection : `journal(...)` construit le journal,
  `jouer(...)` le projette, `joueur(state, id)`, `derniereVolee(state)`, `courant(state)`. Le
  test se lit comme la règle qu'il vérifie, pas comme de la plomberie.
- Fixtures réutilisées dans toute une suite : `KEVIN`/`JULIEN` (`PlayerId`), `T20`/`S20`/`D20`
  (`Dart`).
- Les intitulés `describe`/`it` énoncent la règle en français, souvent au mot près de
  `CLAUDE.md` : un test qui échoue nomme la règle cassée, pas juste une assertion.
- Les tests UI interrogent **uniquement par rôle/nom accessible** (`getByRole`), interagissent
  via `tests/ui/gestes.ts` (`flechette(utilisateur, cible, multiplicateur?)` — qui re-sélectionne
  la bascule momentanée à chaque appel, comme un vrai joueur), et rendent via
  `renderWithServices(ui, { services })` plutôt qu'un `render` avec des providers montés à la
  main.
- Les tests d'architecture lisent les imports **réels** par regex plutôt qu'une liste de
  paquets bannis, et vérifient un **plancher** de fichiers/imports trouvés pour qu'une regex
  cassée ne rende pas tout vert silencieusement. Reproduire ce réflexe « se garder d'un test vert
  à vide » pour tout test dont le rôle est de vérifier une **absence**.

## 12 · Outillage

- **Biome, jamais ESLint ni Prettier.** `npm run lint` / `npm run lint:fix`. Formatage fixé par
  `biome.json` : guillemets simples (doubles en JSX), pas de point-virgule sauf nécessité
  (`asNeeded`), virgules finales partout, 100 colonnes — ne pas reformater à la main contre ces
  réglages.
- `src/core/**` porte un override Biome `noRestrictedImports` qui échoue avec un message
  expliquant **la raison hexagonale**, pas juste « interdit ». Pour interdire un nouvel import
  dans le cœur, suivre ce modèle plutôt qu'ajouter une règle muette.
- `npm run lint`, `npm run typecheck`, `npm test` verts est le plancher avant de considérer
  quoi que ce soit fini — ce que `dev.md` et `test.md` exigent déjà, répété ici parce que
  c'est aussi un pattern de code, pas seulement un gate de process.

## 13 · Ajouter un mode de jeu (la couture `GameMode`)

Annoncée dès le lot 1, écrite seulement au lot 5a, quand un **deuxième mode réel** est arrivé.
Généraliser plus tôt aurait été inventer une abstraction sans savoir ce qu'elle abstrait.

**Le principe : aucun dénominateur commun artificiel.** Chaque mode garde ses règles et son
état complets et lisibles ; `src/core/domain/games/index.ts` ne fait qu'**aiguiller** sur le
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
doubles : ces mesures n'ont pas de sens au Tour du monde ni au Cricket, qui sont écartés du
cumul plutôt que d'y injecter des zéros trompeurs.

**Pour ajouter un mode futur** (Killer, Shanghai, Around the Clock — hors périmètre v1, voir
`CLAUDE.md` § Décisions ouvertes) : un dossier `domain/games/<mode>/`, un événement
d'ouverture, un module de règles avec son `mode` discriminant, trois lignes dans chaque
aiguillage de `games/index.ts`, un dossier `ui/composants/<mode>/`, un écran de jeu et un
résumé. Rien d'autre ne bouge — vérifié trois fois de suite (Tour du monde, Cricket,
entraînement).

⚠️ **Depuis le lot « bundle-par-route »** : un mode ajoute aussi son écran de jeu et son écran
de résumé à la liste des `lazy()` de `src/ui/ecrans/games/PartieEcran.tsx` (et son écran de
lancement, s'il en a un, à `src/App.tsx`) — sinon il revient discrètement dans le chunk
commun, sans qu'aucun test ne le signale (`tests/architecture/lazyRoutes.test.ts` ne connaît
que les écrans déjà listés au moment où il a été écrit).
