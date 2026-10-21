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
  (`NullHaptics`, `NullScreenLock`, `NullAnnouncer`, `NullPersistentStorage`,
  `NullAppInstallation`) pour les plateformes qui n'ont pas la
  capacité — jamais un `if (haptics)` disséminé dans l'appelant.
- Un port d'appareil **qui peut refuser** (`PersistentStorage`) renvoie un **état** plutôt que de
  lever : `status()` / `request()` ne rejettent jamais, l'adapter enveloppe tout en `try/catch`
  et reçoit son objet navigateur (`StorageManager`) par le constructeur pour se tester sans
  global. Comme `screenLock`, il est consommé via `Services.devices` (exception assumée).
- Un port d'appareil **dont l'état change en cours de session** (`AppInstallation`) est
  **synchrone avec abonnement** : `state()` (ne lève jamais, même valeur tant que rien ne
  change), `subscribe(onChange)` qui rend le désabonnement, et l'action (`prompt()`, qui ne
  rejette jamais). L'UI le lit par `useSyncExternalStore` (`useInstallation`), jamais par
  `useState` + `useEffect` qui raterait un changement entre rendu et abonnement. L'adapter pose
  ses écouteurs dans son constructeur, enveloppé de `try/catch`, et reçoit son `window` par le
  constructeur ; la garde `installationBoundary` interdit ses API ailleurs.
- **Annonces vocales** (`Announcer`) : `say(Annonce)` reçoit des segments `{ texte, langue }` déjà
  écrits (`Annonce`, `Langue`, `fr()` / `en()` de `labels.ts`) ; le port ne traduit rien. **Un seul
  `say` par fin de volée** (l'adapter coupe l'énoncé en cours) : `annonceFinDeVolee(resultat,
  prochain, phrase?)` compose résultat, tour, puis la phrase de victoire. Lot `phrases-victoire` : la
  phrase (`phraseVictoire(matchId)`, même graine que le résumé, rien de stocké) n'est donnée que par
  `enregistrer` du hook de mode, sur le jalon de victoire (X01 `MatchFinished`, jamais `LegWon` /
  `SetWon` ; Cricket `gagnee` ; Tour du monde `MatchFinished` à `winnerId` non nul) — donc après
  *Valider la sortie*, jamais sur un bust ni à l'entraînement.
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
  plus `devices` et `clock`) sont deux types distincts.
- `Services.clock` (lot `nom-de-partie`) est **la même instance** que celle des use cases :
  l'UI lit l'heure courante par elle, jamais par `Date.now()` — `Date` n'y sert que de
  calendrier sur un instant donné. Garde : `tests/architecture/horlogeBoundary.test.ts`.
- `createServices(deps)` est pure et injectable — c'est elle que `fakeServices()` appelle dans
  les tests, jamais une réimplémentation du câblage.
- `createBrowserDependencies()` / `createBrowserServices()` sont les **seules** fonctions du
  projet qui touchent une vraie API navigateur.
- `createBrowserServices()` est appelé **une seule fois**, au niveau du module de
  `src/main.tsx`, **avant** `createRoot` : un jeu de services par page, et des adapters qui
  écoutent avant le premier rendu (lot `installation-guidee`). `ServicesProvider` reçoit
  `services` en prop **obligatoire** et ne crée plus rien — un `useMemo` rejoué par
  `StrictMode` aurait créé deux jeux d'adapters.

## 8 · Imports

- Dans `src/core/**` : **toujours relatifs** (`../../domain/...`), jamais `@/...` — vérifié par
  `tests/architecture/hexagonalBoundary.test.ts`, pas seulement une convention déclarative.
- Partout ailleurs (`ui/`, `infrastructure/`, `composition/`, `tests/`) : l'alias `@/` depuis
  `src/`.
- `organizeImports` de Biome trie à l'enregistrement / au `lint:fix` — ne pas trier à la main.
- **Ce que l'UI importe du cœur** : des types, des constantes (`GAME_MODE_IDS`, `STATS_PERIODS`)
  et des **fonctions pures** (`X01Config.create`, `matchStatus`, `rankPlayers`). `matchStatus`
  (`use-cases/summarize.ts`, lot `accueil-parties-recentes`) et `rankPlayers` / `leadingPlayers`
  (`use-cases/rankPlayers.ts`, lot `cartes-partie`) sont les seules fonctions de
  `use-cases/` importées hors du composition root. **Jamais** une classe `*UseCase` ni un port
  driven : toute I/O passe par `useServices()`.

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
  se lit « il a tout raté ». Un seul appelant depuis le lot `statistiques-podium` : le
  pourcentage de doubles (résumé X01, carte Finitions) — les victoires se disent en « 9 / 16 »
  sur chaque ligne, et les manches ont quitté Statistiques (Révision 1). ⚠️ Un pourcentage de
  **progression** (`LigneCible.tsx`) garde son `0` : là, zéro est un vrai zéro, pas une absence.
- **Une carte, une seule cible** (`CartePartie`, lot `accueil-parties-recentes`) : toute la
  carte est un lien ; « Reprendre » n'en est que le visuel, jamais un second élément focalisable.
  Une action propre (la suppression de l'onglet Parties) passe par `actions`, **hors** du lien.
  L'appelant choisit le niveau du titre (`niveauTitre`) pour qu'il n'y ait **aucun saut** de
  niveau — au besoin un `h2` `sr-only` (le titre invisible de la partie épinglée à l'Accueil).
- **Le français d'un composant qui ouvre une union** (les règles courtes d'une carte) vit dans
  `labels.ts` sous forme de **constructeurs sur primitives** (`reglesCarteX01`,
  `reglesCarteTourDuMonde`, `detailCarte*`, `parle*`…) ; le `switch` exhaustif vit dans
  `src/ui/cartesPartie.ts` (`vueCarte`), seul endroit qui ouvre l'union pour une carte.
  Même patron pour **la feuille de règles** (lot `regles-du-jeu`) : `reglesX01`, `reglesCricket`,
  `reglesTourDuMonde`, `reglesEntrainement` dans `labels.ts` rendent un `ContenuRegles` en
  **segments typés** (`{ fort }`, lignes `autre`, blocs discriminés) — jamais de HTML ni de
  `dangerouslySetInnerHTML` ; `src/ui/reglesDuJeu.ts` (`contenuRegles`) est le seul `switch` sur
  `ReglesDeLaPartie`, construite depuis la fiche (`reglesDeLaFiche`) ou la config d'une partie
  (`reglesDeLaConfig*`). Les bornes de sortie passent par le port `GetCheckoutRange`.
- **Une boîte par-dessus un écran se ferme au retour du téléphone** — `Modale` des
  Statistiques (lot `statistiques-podium`) et feuille de règles (lot `regles-du-jeu`), un seul
  mécanisme. **L'état vit dans l'historique** (`useModaleAuRetour`) : l'ouverture empile une
  entrée **sur la même URL** (`location.state[cle]`, validé contre une liste fermée ; clés en
  usage `parcours`, `liste`, `regles`, `confirmation`), **seulement dans un gestionnaire de clic** (jamais dans
  un effet, jamais `<Link>` vers l'emplacement courant, qui remplace ; **une seule exception**, la
  réouverture de la boîte de sortie après un rechargement, ci-dessous) ; la fermeture — ✕, Échap,
  retour, appui à côté — recule **toujours** par `navigate(-1)`, jamais par un état local remis à
  faux (entrée orpheline) ni par `replace`. Garde « en vol » en `useRef` contre les doubles
  reculs. Jamais `window.history`. **La boîte suit `useDialogueNatif`** : le `<dialog>` est
  **monté en permanence** (hors des branches de chargement de l'écran), son contenu seulement
  ouvert ; un seul effet, **aucun nettoyage qui ferme** (StrictMode) ; `cancel` annulé puis
  relayé, `close` relayé seulement ouvert ; focus sur ✕, rendu à `retour` (Safari) ou à
  l'origine ; appui à côté = `pointerdown` et `click` hors de la boîte. **Jamais `flex` ni `grid`
  sur le `<dialog>`** (il s'afficherait fermé) : la mise en page vit dans un conteneur intérieur.
  Une tête de boîte est un `<div>`, jamais un `<header>` (le bandeau en est déjà un). Dette :
  `DialogueNouveauJoueur` ne suit pas encore ce modèle.
- **La confirmation de la sortie** (lot `annulation-volee`, `BoiteConfirmation` +
  `useConfirmationSortie`) suit le même mécanisme, clé `confirmation`, valeur `sortie`. En plus :
  `demander()` est appelé **dans le gestionnaire de la fléchette**, quand `ajouterFlechette` rend
  `true` ; la boîte s'affiche quand l'entrée est là **et** qu'une sortie attend (dérivé du hook
  du mode) ; **toute fermeture sans choix vaut *Corriger*** — Échap et voile par `onCorriger`, le
  retour du téléphone détecté au passage `'sortie'` → `null` tant qu'une sortie attend et que
  *Valider* n'a pas été choisi (une ref) ; **après un rechargement**, le hook se réconcilie **une
  seule fois, quand `pret`** (le brouillon de volée est relu, asynchrone ; une ref contre le double
  effet de `StrictMode`) : entrée héritée sans sortie en attente → dépilée ; entrée héritée avec
  sortie en attente → rien, la boîte s'affiche ; **pas d'entrée mais une sortie en attente →
  `demander()` depuis l'effet** (exception au « seulement dans un clic », appelée une fois, gardée
  par la ref et `enVol`). Résiduel R2 : Chrome peut sauter une entrée empilée sans geste préalable,
  le retour quitte alors la partie au lieu de *Corriger* (rien n'est écrit, la boîte revient à la
  réouverture) ; l'écran n'envoie
  au résumé que `termine && auRepos` (aucune entrée `confirmation`), sinon le `replace`
  écraserait l'entrée de la boîte. Pas de ✕ : la référence `croix` de `useDialogueNatif` porte le
  focus sur *Corriger*. Après **toute** fermeture de la boîte (*Corriger*, *Valider*, retour, Échap,
  voile), `pavePret()` est faux pendant `GARDE_APRES_FERMETURE_MS` (500 ms, `services.clock`) :
  l'écran l'interroge en tête de `onFlechette` seulement (bascule S/D/T et Annuler non concernés).
  Les deux boutons recouvrent le pavé, quelle que soit l'orientation : le second appui d'un double
  tap y poserait une fléchette fantôme ; le joueur suivant, lui, ne lance pas en 500 ms. **Exception assumée** à « hors des branches de chargement » : le hook est
  appelé au-dessus des retours de chargement, mais `<BoiteConfirmation>` vit dans la branche
  chargée de l'écran. Sans risque d'entrée orpheline : la boîte ne s'ouvre que sur l'appui d'une
  fléchette ou après la lecture du brouillon (`pret`), donc partie chargée (`staleTime` infini,
  l'état ne repasse jamais en chargement), et une entrée héritée d'un rechargement est réconciliée
  par le hook, au-dessus des retours.
- Les listes que l'étape 2 propose (`SCORES`, `LEGS`, `SETS`, `SORTIES`) et les bornes de joueurs
  (`MAX_JOUEURS`, `JOUEURS_ENTRAINEMENT`) vivent dans `src/ui/reglagesPossibles.ts`, module neutre
  lu par la fiche, le hook du parcours, la feuille et le filtre « Rejouer » (`ui/rejouer.ts`).

## 10 · Hooks (`ui/hooks/use<Mode>.ts`)

- Un hook par mode de jeu, qui prend `matchId` et rend **un seul objet plat** (état + valeurs
  dérivées + actions) — les composants déstructurent ce qu'il leur faut, jamais deux hooks de
  mode appelés côte à côte.
- TanStack Query sert de **cache uniquement** : `staleTime: Infinity`,
  `queryKey: ['match', matchId]`, et chaque mutation appelle
  `queryClient.setQueryData(...)` avec l'état renvoyé par le use case, jamais un
  `invalidateQueries` qui redéclenche un fetch. ⚠️ Cette règle vaut pour le **cache d'un hook de
  mode** ; les **listes** (historique, Accueil, partie en cours), elles, s'invalident.
- **Clés de requête partagées** : `src/ui/clesRequetes.ts` — `CLE_HISTORIQUE`, préfixe de toute
  lecture d'historique (l'Accueil lit `[...CLE_HISTORIQUE, 'accueil']`), `CLE_REJOUER`
  (`[...CLE_HISTORIQUE, 'rejouer']` : les configurations de « Rejouer », rafraîchies avec
  l'historique), `CLE_MATCH_EN_COURS`, et `CLE_CONTENU_APPAREIL` (le compte des Réglages,
  rafraîchi au montage et par l'invalidation globale de l'import).
  Le lancement (`useNouvellePartie`), « On remet ça » (`ActionsFinDePartie`) et la suppression
  (`HistoriqueEcran`) invalident les deux ; l'import (`ReglagesEcran`) invalide tout. ⚠️ Jamais
  une clé déclarée dans un écran chargé à la demande : l'Accueil, importé statiquement,
  l'importerait et le ferait revenir dans le chunk commun. `CLE_JOUEURS` reste dans `useJoueurs`.
- **Annuler, une fléchette par appui** (lot `annulation-volee`) : sans fléchette en cours,
  `annuler()` garde ses gardes (`occupe`, rien à retirer, `ecoulee()` de la pause), appelle le
  use case d'annulation, qui rend un `ReopenedVisit` `{ state, darts }` ; le hook injecte
  `state` dans le cache et **rend `darts` à la saisie** (`poser(darts, revenu)`, estampillé avec
  l'état **rouvert**, jamais l'ancien), puis `armer()` si
  la volée rouverte est vide. Le libellé (`libelleAnnulation(flechette, joueur)`) lit la
  dernière fléchette en cours, sinon la dernière de la dernière volée **projetée** et son
  `playerId` — jamais recalculé.
- **La sortie en attente** (X01, Cricket, Tour du monde) : `sortieEnAttente` est **dérivé** de
  l'aperçu des fléchettes en cours (X01 `outcome === 'CHECKOUT'`, Cricket `state.finished`, Tour
  du monde `completesTour`), jamais stocké. `ajouterFlechette` rend `true` quand la fléchette la
  met en attente (rien n'est envoyé) et refuse toute fléchette tant qu'elle attend ;
  `corrigerSortie()` retire la fléchette (même chemin que le retrait d'une fléchette en cours) ;
  `validerSortie()` appelle `enregistrer` — voix, haptique et célébration y vivent déjà, donc
  arrivent après *Valider*. Le hook rend aussi `confirmation` `{ titre, texte }` (`labels.ts`).
- **La volée en cours survit à un rechargement** (lot `volee-partielle`, `useVoleeEnCours`) :
  chaque hook de mode (X01, Cricket, Tour du monde, entraînement) range ses fléchettes par ce
  mécanisme unique, jamais par un `useState` à lui. `useVoleeEnCours(matchId, state, evaluer)` rend
  `{ darts, poser, pret }` ; `evaluer(state, darts)` rend `'ouverte' | 'en-attente' | 'close'` (la
  même fonction sert la saisie et le jugement d'un brouillon relu) ; `poser(darts, base)` met à jour
  la saisie **et** écrit le brouillon (jamais dans un updater : `StrictMode` le doublerait) ;
  `pret` passe à vrai une fois le brouillon lu, et `chargement` l'attend. Les écritures passent
  par **une file** par instance (ordre garanti, échecs avalés : la saisie ne grise jamais le
  pavé). Le brouillon n'est effacé qu'**après** un enregistrement réussi (`poser([], resultat.state)`).
  Port `ManageVisitDraft` ; la clé de cohérence est le `visitCount` de l'état affiché.
  Un mode nouveau (CONVENTIONS § 13) l'utilise et passe `pret` à `useConfirmationSortie`.
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
- **Simuler un rechargement** (lot `volee-partielle`) : démonter l'écran, puis le rendre à neuf avec
  **les mêmes services** et un **nouveau `QueryClient`** — c'est la base (donc le brouillon) qui
  survit, pas le cache. Fakes de panne, sous-classes de test : `BrouillonsEnPanne`,
  `BrouillonsSuspendus`, `BrouillonsIllisibles`, `BrouillonsIndelebiles`, `DepotEnPanne`,
  `DepotCompteur`. Tout test d'absence affirme d'abord sa précondition (le brouillon existe).
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
- `tests/setup.ts` charge `@testing-library/jest-dom/vitest` et `fake-indexeddb/auto`, et fait
  un `cleanup()` après chaque test. Il pose aussi, **seulement s'ils manquent**, deux faux pour
  ce que jsdom 29 n'implémente pas : `HTMLDialogElement.prototype.showModal` / `close` (pose et
  retire `open`, émet `close`) et la capture de pointeur (`setPointerCapture` et consorts, sans
  effet). Ils rendent `<dialog>` et le glisser utilisables en test, ils ne les valident pas.
- **Le retour du téléphone** se simule par `retourTelephone()` (`tests/ui/gestes.ts`) : un
  `navigate(-1)` (POP d'historique) capturé par `SondeHistorique`, que `renderWithServices`
  monte à côté de l'écran — jamais en cliquant un bouton de l'écran. La même sonde expose
  `locationCourante()` (URL et état d'historique), et `renderWithServices(…, { historique: [...] })`
  ouvre plusieurs entrées (la dernière active) pour prouver qu'un retour **ne quitte pas** l'écran
  (lot `regles-du-jeu`) ; une entrée peut porter un état (`{ pathname, state }`), pour une
  boîte rouverte au rechargement. Une fermeture native de `<dialog>` se simule par
  `dialog.close()` ; Échap, par un `cancel` **annulable** (`new Event('cancel', { cancelable:
  true })`), dont on vérifie `defaultPrevented` ; un appui à côté, par `pointerDown` puis
  `click` sur le `<dialog>` après avoir posé son `getBoundingClientRect`.
- **Le fuseau des tests est fixé** à `Europe/Paris` (`test.env.TZ`, § 12). Un test daté
  construit ses bornes en heure **locale** (`new Date(2026, 9, 11, 1, 0)`), et un test qui
  passe un changement d'heure vérifie d'abord sa **précondition** — la durée du jour (23 h ou
  25 h) — sur le modèle de `tests/ui/nomDePartie.test.ts:88-98`. ⚠️ Sous un fuseau UTC, un
  tel test serait vert partout sans rien prouver.
- **`horlogeBoundary`** lit `src/ui/**`, `src/core/**` et la racine de `src` (`App.tsx`,
  `main.tsx`), commentaires retirés par un petit lecteur qui respecte chaînes, gabarits et
  regex, et refuse `Date.now` (appelé ou passé en référence), `new Date` sans argument et
  `Date(…)` appelé en fonction. `new Date(horodatage)` reste permis : c'est un calendrier.
  `performance.now()` et `Temporal.Now` n'y sont pas, à dessein (Q-D1 : aucune occurrence, pas
  de date calendaire) — à reconsidérer s'ils entrent. Limites connues (N2), absentes de `src/`
  aujourd'hui : `new globalThis.Date()`, `Date?.now()`, `const { now } = Date`,
  `Intl.DateTimeFormat().format()` sans argument, un `//` ou `/*` dans du texte JSX.
- **Une règle commune aux quatre modes se teste par `it.each(GAME_MODE_IDS)`**, jamais par une
  liste recopiée : un mode ajouté entre de lui-même dans le test. `tests/use-cases/lancerPartie.ts`
  lance une partie de n'importe quel mode (`switch` sur `GameModeId`) ; c'est une **aide de
  scénario**, pas un fake — d'où sa place hors de `tests/fakes/`.
- Pour prouver qu'une date vient de `createdAt` et non de `updatedAt`, **avancer l'horloge et
  enregistrer un événement** avant de lire : sans second événement, les deux se confondent.
  ⚠️ Trou connu (R2, laissé par décision utilisateur) : le test `getMatchName`
  (`tests/use-cases/nomDePartie.test.ts:52-66`) ne le fait pas encore — le code est juste
  (`GetMatchNameUseCase.ts`), mais rien ne le prouve.
- **Prouver une invalidation** (lot `accueil-parties-recentes`) : un **seul** `QueryClient`,
  partagé et en `staleTime: Infinity`, passé par `renderWithServices(…, { queryClient })` ; on
  navigue d'un écran à l'autre dans le même rendu. Sans cela, l'écran rouvert recharge au
  remontage et le test passe **à vide** — démonter puis rendre à neuf ne prouve qu'un chargement
  à froid. Le **comportement réel** (reprendre une partie abandonnée inverse les statuts) se
  prouve, lui, sur le client par défaut, comme en production.
- **Deux valeurs qui doivent rester égales** sans source commune possible (le `calc` de la
  hauteur de la barre du bas et celui du décalage du bouton fixé de l'Accueil) : un test
  structurel les extrait et les compare, et casse bruyamment si l'une disparaît
  (`accueilPartiesRecentes.test.tsx`).

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
- `vite.config.ts` importe `defineConfig` depuis **`vitest/config`** (pour le bloc `test`).
- Le bloc `test` fixe `env.TZ = 'Europe/Paris'` (lot `nom-de-partie`) : les noms par défaut et
  leurs tests de changement d'heure dépendent du fuseau (§ 11). Le build n'en est pas affecté.

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
score restant, un X01 n'a pas de cible courante. `src/ui/cartesPartie.ts`
(`vueCarte`, lot `cartes-partie`) est le **seul** endroit de l'UI qui ouvre cette union pour une
carte ; `CartePartie` et `MiniTableauPartie` n'affichent que sa vue, pour ne pas la disperser
entre l'accueil et l'historique.
- **Une seule URL par partie** (`/partie/:id`) : `PartieEcran` lit le mode et rend l'écran
correspondant. Un lien d'historique reste valable quel que soit le jeu, et l'utilisateur n'a
pas à savoir dans quel mode il reprend. Chaque mode a son **propre** écran plutôt qu'un écran
truffé de conditions — les deux zones de saisie n'ont rien en commun.
- **Le pavé du Tour du monde n'a pas de bascule S/D/T** : elle ne changerait rien, et un
contrôle sans effet induit en erreur. Les fléchettes enregistrées sont donc des simples.
- **Les statistiques de carrière restent au X01.** Moyenne 3 fléchettes, 180, pourcentage de
doubles : ces mesures n'ont pas de sens au Tour du monde ni au Cricket, qui sont écartés du
cumul plutôt que d'y injecter des zéros trompeurs.

**Pour ajouter un mode futur** (Shanghai, Around the Clock — hors périmètre v1, voir
`CLAUDE.md` § Décisions ouvertes) : un dossier `domain/games/<mode>/`, un événement
d'ouverture, un module de règles avec son `mode` discriminant, trois lignes dans chaque
aiguillage de `games/index.ts`, un dossier `ui/composants/<mode>/`, un écran de jeu et un
résumé. Rien d'autre ne bouge — vérifié quatre fois de suite (Tour du monde, Cricket,
entraînement, Killer).

⚠️ **Depuis le lot « killer »** (quatre pièges, trouvés en le branchant) : (1) `GameModes.project`,
`isFinished` et `currentPlayerId` finissent par un `default` **typé `never`** : un mode non listé n'est plus
rejoué par le X01 ; **`PartieEcran.tsx` aussi** (son `switch` finissait par `default: return x01` : un journal
d'un mode non câblé ouvrait l'écran X01) ; (2) le **maximum de joueurs est propre au mode** :
`useNouvellePartie.max(mode)` et `rejouer.maxJoueurs` sont des `switch` exhaustifs (le Killer va à 6), sinon
« Rejouer » écarte en silence toute configuration au-delà de 4 ; le `switch` de `rejouer` de
`useNouvellePartie` a un `default` typé `never` ; (3) `tests/use-cases/lancerPartie.ts` lance un mode à son
**minimum de joueurs** (2 pour le Killer : pas de solo), et `tests/domain/matchName.test.ts` liste à la main
les ouvertures (`OUVERTURES`) ; (4) la garde `hexagonalBoundary` lit les vrais dossiers de
`src/core/domain/games` et `src/ui/composants` (plancher de 5 modes) et résout les imports **relatifs** : un
import `../x01/…` depuis un autre mode la fait échouer. Une donnée **par joueur** de la partie (les numéros du
Killer) se range dans l'événement d'ouverture, indexée comme `playerIds`, **hors de la config** (sinon elle
entre dans la configuration rejouable) ; l'état de chaque joueur au fil des fléchettes est **déduit** du journal,
jamais stocké, et un « qui a éliminé qui » se lit sur le rejeu (`KillerState.eliminations`).

⚠️ **Depuis le lot « volee-partielle »**, le hook du mode range ses fléchettes en cours par
`useVoleeEnCours` (§ 10), avec son `evaluer` (`'ouverte' | 'en-attente' | 'close'`), et passe `pret` à
`useConfirmationSortie` s'il confirme une sortie. `tests/ui/voleePartielle.test.tsx` type sa liste de modes
par `satisfies Record<GameModeId, …>` : un mode nouveau fait échouer la compilation tant qu'il n'y a pas
son entrée.

⚠️ **Depuis le lot « cartes-partie »**, un mode doit aussi aux cartes : ses constructeurs
`reglesCarte*` / `detailCarte*` / `parle*` dans `labels.ts`, sa branche dans `vueCarte`
(`src/ui/cartesPartie.ts` : détail, unité, règles, jauge, chiffre, phrase) et dans
`rankPlayers` (le classement). Les `switch` au `default` typé `never` et les
`it.each(GAME_MODE_IDS)` le signalent ; les textes sont testés dans `tests/ui/cartesPartie.test.tsx`.

⚠️ **Depuis le lot « bundle-par-route »** : un mode ajoute aussi son écran de jeu et son écran
de résumé à la liste des `lazy()` de `src/ui/ecrans/games/PartieEcran.tsx` — sinon il revient
discrètement dans le chunk commun, sans qu'aucun test ne le signale
(`tests/architecture/lazyRoutes.test.ts` ne connaît que les écrans déjà listés au moment où il
a été écrit).

⚠️ **Depuis le lot « nouvelle-partie-en-etapes »**, un mode n'a **plus d'écran de lancement** :
il se lance depuis le parcours Nouvelle partie. Il y ajoute sa carte (`EtapeJeu`), ses réglages
(`ReglagesJeu`, `switch` exhaustif) et sa branche de `demarrer` (`useNouvellePartie`, idem),
plus son slug dans `SLUG_MODE` (`src/ui/chemins.ts`). TypeScript signale presque tout :
`SLUG_MODE`, les icônes et `LIBELLE_MODE` sont des `Record<GameModeId, …>`, les règles des
cartes et le récapitulatif des `switch` exhaustifs. Lui échappent la liste `JEUX` de l'étape 1
(la carte elle-même) et **tout ce qui distingue le solo du groupe** : `CHECKOUT_PRACTICE` est
testé en dur dans le hook (`max`, `selection`, mais aussi `ajouter` / `retirer`, qui écrivent
`entrainement:joueur` au lieu de `partie:joueurs`), dans `GardeOrdre`
(`NouvellePartieEcran`) et dans `versOrdre` (`EtapeJoueurs`). Un nouveau mode y est traité en jeu
de groupe — juste pour Killer ou Shanghai, faux pour un deuxième exercice solo.

⚠️ **Depuis le lot « regles-du-jeu »**, un mode doit aussi sa **feuille de règles** : un
constructeur `regles<Mode>` dans `labels.ts` (même plan : Ce soir, En bref, Marquer, Gagner, Cas
particuliers, Un exemple, Questions fréquentes, Ce que l'app compte, Les réglages possibles), une
branche dans `ReglesDeLaPartie`, `contenuRegles`, `reglesDeLaFiche` et un `reglesDeLaConfig<Mode>`
(`src/ui/reglesDuJeu.ts`), son titre dans `TITRE_REGLES`, et la prop **obligatoire** `regles` de
`BandeauMatch` sur son écran. TypeScript signale les `switch` et le `Record` ; le texte, lui, ne
s'écrit que d'après `CLAUDE.md` § Règles du jeu, jamais improvisé.

⚠️ **Depuis le lot « nom-de-partie »**, l'événement d'ouverture d'un mode porte le champ
facultatif `name?: MatchName`. TypeScript signale : la branche de `nameOf` (`switch` au
`default` typé `never`), la prop `nomPartie` de `DispositionPartie` et `TableauHonneur`,
`lancer` de `tests/use-cases/lancerPartie.ts` et la `CARTE` de `tests/ui/nomDePartieEcrans.test.tsx`
(des `switch` / `Record<GameModeId, …>`). Il **ne signale pas** :
oublier `name?` sur l'ouverture ou l'appel à `nameField` dans le use case de lancement, le
`...name` de `lancer` dans `useNouvellePartie`, le `name: ouverture.name` de `RestartMatch`, le
`...versOuverture(...)` de `backupSchema` — tous attrapés par les `it.each(GAME_MODE_IDS)`.
Reste hors de tout filet (R1) : la liste `OUVERTURES` de `tests/domain/matchName.test.ts`, à
compléter à la main.

## 14 · Arborescence

L'arbre de `src/` et `tests/`, déplacé de `CLAUDE.md` § Arborescence (qui n'en garde que les
invariants). Vérifié contre `src/` (`ls`) au lot « nom-de-partie », inchangé au lot
« accueil-parties-recentes » ; lot « regles-du-jeu » : 23 ports driving (`ShuffleOrder`,
`GetCheckoutRange`) ; lot « rejouer » : 24 (`GetReplayableConfigurations`) ; lot
« reglages-par-usage » : 25 (`GetDeviceContents`) ; lot « annulation-volee » : toujours 25, 27 fichiers
(hors `MatchSummary.ts` et `ReopenedVisit.ts`, deux types), 11 driven, 14 hooks (plus `tourDeTable.ts`, un utilitaire ;
`useConfirmationSortie` au lot « annulation-volee ») ; lot « volee-partielle » : 26 ports driving
(`ManageVisitDraft`), 12 driven (`VisitDraftRepository`), 15 hooks (`useVoleeEnCours`) ; lot « killer » :
29 ports driving (`PlayKiller`, `PreviewKillerVisit`, `DrawKillerNumbers`), 12 driven, 16 hooks (`useKiller`),
`PlayerGender` (value object), 5 modes, 4 services transverses.

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
│  │  ├─ value-objects/   Dart, Segment, Multiplier, Score, PlayerColor, ids,
│  │  │                   MatchName (nom tapé, ≤ 30)
│  │  ├─ entities/        Visit, Player          (transverses aux modes)
│  │  ├─ events/          MatchEvent : X01Started | TourDuMondeStarted |
│  │  │                   CricketStarted | CheckoutPracticeStarted |
│  │  │                   RoundStarted | VisitRecorded
│  │  │                   (+ nameOf : le nom de l'ouverture, `name?`)
│  │  └─ services/        dartSearch · checkout · visitOutcome · dartboardHits
│  │                      ⚠️ TRANSVERSES : un mode n'importe jamais un autre mode
│  └─ application/
│     ├─ ports/driving/   StartMatch, RestartMatch, RecordVisit, UndoLastVisit,
│     │                   PreviewVisit,
│     │                   GetMatchState, GetCheckoutSuggestion, GetCheckoutRange,
│     │                   GetMatchStats, GetMatchHistory, GetMatchMode, GetMatchName,
│     │                   GetOngoingMatch, GetPlayerStats, DeleteMatch,
│     │                   ManagePlayers, ManageBackup, PlayTourDuMonde,
│     │                   PlayCricket, PreviewCricketVisit, PreviewTourDuMondeVisit,
│     │                   PlayCheckoutPractice, ShuffleOrder,
│     │                   GetReplayableConfigurations,
│     │                   GetDeviceContents (compte des parties et profils)
│     ├─ ports/driven/    MatchRepository, PlayerRepository, Clock, IdGenerator,
│     │                   Haptics, ScreenLock, Preferences, RandomSource, Announcer,
│     │                   PersistentStorage, AppInstallation
│     └─ use-cases/       + backupSchema.ts (validation d'un JSON importé)
│                         + summarize.ts (summarize, nameIndex, matchStatus — fonction
│                           pure de use-cases/ importée par l'UI)
│                         + rankPlayers.ts (rankPlayers, leadingPlayers — idem : le
│                           classement des joueurs d'une carte, jamais recalculé dans l'UI)
│                         + nameField.ts (`{}` ou `{ name }` : jamais `name: undefined`)
├─ infrastructure/        dexie/ · device/ · memory/ · system/
├─ composition/           container.ts   ← seul point de câblage
├─ ui/
│  ├─ composants/         commun/ (dont CartePartie, la ligne de feuille, MiniTableauPartie, FeuillePartie ; `ui/cartesPartie.ts` ouvre l'union ; et DispositionPartie,
│  │                      l'ossature portrait/paysage ; CartePodium, CompteBatons et
│  │                      Modale, la boîte refermée par le retour du téléphone ;
│  │                      LivreRegles et FeuilleRegles, la feuille de règles ;
│  │                      BoiteConfirmation, la confirmation de la sortie ;
│  │                      Phrase, une phrase de labels.ts en segments typés ;
│  │                      Voyant, VignetteTheme, ListeReglages / LigneReglage, les
│  │                      briques des Réglages ;
│  │                      `ui/reglesDuJeu.ts` ouvre ReglesDeLaPartie)
│  │                      x01/ · tour-du-monde/ · cricket/ · checkout-practice/
│  ├─ ecrans/             games/ ← MÊME DÉCOUPAGE QUE LE DOMAINE
│  │                        PartieEcran (aiguillage) · x01/ · tour-du-monde/ ·
│  │                        cricket/ · checkout-practice/
│  │                      nouvelle-partie/ ← le parcours en étapes (une route par
│  │                        étape : EtapeJeu (« Rejouer » + rangée, ou tuiles), EtapeJoueurs (rangée, fiche
│  │                        ReglagesJeu, ChampNom), EtapeOrdre (feuille, « Tirer au
│  │                        sort » via le port ShuffleOrder / ShuffleOrderUseCase),
│  │                        BarreEtapes (non interactive, posée par EnTeteEtape),
│  │                        ChoixJoueursExistants… et ordre.ts, pur)
│  │                      + les écrans transverses : Accueil, Joueurs,
│  │                        Historique, Statistiques, Réglages, Confidentialité
│  ├─ hooks/              useX01 · useTourDuMonde · useCricket ·
│  │                      useCheckoutPractice · useJoueurs ·
│  │                      useNouvellePartie (réglages mémorisés, nom, démarrage) ·
│  │                      useNomDePartie (le nom affiché d'une partie) ·
│  │                      useAppareil (wake lock, préférences, voix, date du dernier
│  │                        export validée : useDernierExport) ·
│  │                      useStockagePersistant (protection des données) ·
│  │                      useInstallation (invitation à installer) ·
│  │                      usePauseAnnulation (la pause après le retrait de la dernière
│  │                        fléchette d'un joueur) ·
│  │                      useModaleAuRetour (une boîte que le retour ferme : Modale,
│  │                        feuille de règles, confirmation de la sortie) ·
│  │                      useConfirmationSortie (la boîte « Kevin sort sur D10 ? » :
│  │                        demander, Corriger, Valider, retour = Corriger) ·
│  │                      useKiller (cinquième mode : numéros, vies, killer, éliminés) ·
│  │                      useVoleeEnCours (la volée en cours gardée dans le brouillon :
│  │                        poser, pret, file d'écriture ; commun aux quatre modes) ·
│  │                      useDialogueNatif (la discipline du <dialog>, partagée)
│  └─ couleurs.ts (teintes) · labels.ts (tout le français, annonces comprises) ·
│     theme.ts (clair / sombre / système) ·
│     chemins.ts (slugs et URL du parcours Nouvelle partie) ·
│     clesRequetes.ts (clés TanStack Query partagées) ·
│     jourCalendaire.ts (« Aujourd'hui » / « Cette semaine », bornes locales,
│       joursCalendairesEntre) ·
│     voyants.ts (les deux voyants des Réglages : durée depuis l'export, seuils
│       30 / 60, état d'installation, guide #installer — pur, sans React) ·
│     podium.ts (Statistiques : classement d'une carte, largeurs, ex æquo sur le
│       chiffre affiché, coupure « N premiers » (apercuPodium), joueur de la cible,
│       recadrage du ruban d'onglets (defilementPourMontrer) — pur, sans React) ·
│     reglagesPossibles.ts (SCORES, LEGS, SETS, SORTIES, MAX_JOUEURS,
       JOUEURS_ENTRAINEMENT) · rejouer.ts (« Rejouer » : filtre « reproductible », les trois
       lignes — pur, sans React) · reglesDuJeu.ts
tests/                    domain/ · use-cases/ · infrastructure/ · architecture/ ·
                          fakes/ · ui/ (+ gestes.ts)
```
