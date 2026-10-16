# Contexte d'architecture
> **Index**, pas une source de vérité (désaccord : code récent, puis `CLAUDE.md`, puis le reste).
> **DS** = `CLAUDE.md` § Décisions structurantes ; **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-16 (14e passe), scope `all`, branche `lot/regles-du-jeu` (lot 11, `high`,
  sur `main` `26a39fb` = lot 8 ; fin de cycle, **non committé**). Refonte : lots 1-9 et 11
  faits ; 10, 12 à cadrer ; 13 `high` ; étude « règles façon DartsOn » attendue.
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte, DEPLOIEMENT (titres), PLAN § 0 / § 4 /
  § 6, étude de refonte, Revue du lot (passes 1-2), ancien index ; code.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; ni Firebase dans l'app, auth ou réseau ; Dexie derrière les ports ; `/confidentialite` datée ; profils locaux + export JSON ; match = `MatchEvent[]` ; fléchette par fléchette | en vigueur | DS |
| « Saisie hybride » / mode rapide (retirée après usage, `d531a7e`) | renversée | DS ; Notes |
| « Best of N » → « premier à N » (`legsToWin`) | renversée | DS ; glossary |
| Accent par mode (`--accent-*`) → laiton unique (`pave-unifie`) | renversée | CHARTE § Un seul accent |
| Interrupteur « Ordre aléatoire » → « Tirer au sort » (`ShuffleOrder`) | renversée | DS ; CHARTE § Parcours |
| « Les règles en entier » (étape 2) → feuille de règles par le livre | renversée | DS « Règles au livre ouvert » |
| **Règles au livre ouvert** : feuille `<dialog>` par-dessus l'écran, jamais une route ; **un seul mécanisme avec la `Modale`** (`useModaleAuRetour` clé `regles`, `useDialogueNatif`) ; un lot qui change une règle met sa rubrique à jour | en vigueur | DS ; CONV. § 9, 13 |
| Checkouts : **deux sorties** (`checkoutRange`, port `GetCheckoutRange`) ; règles de l'**entraînement** | en vigueur (gravées) | CLAUDE § Règles du jeu |
| Double out écran ≠ domaine ; « manche » ; Nouvelle partie : route par étape, `BarreEtapes` non interactive ; nom de partie (étape 2) ; « Abandonnée » dérivée | en vigueur | DS ; glossary |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query hors match ; Biome seul ; `PersistentStorage`, `AppInstallation` ; `id: '/'` ; `smoke` | en vigueur | DS ; Déploiement |
| Thème défaut sombre ; angle vif ; zones lecture / saisie ; charte (plancher `craie-3`, feuille, parcours, cartes, podium) ; **jetons réservés** à la feuille | en vigueur | DS ; CHARTE ; rules/theme-colors |
| Refonte visuelle (13 lots) ; lots en parallèle (worktrees), planches dans `docs/maquettes/` du dépôt principal | étude ; expérimental | étude § Découpage ; `orchestrate` |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **uniquement** dans `container.ts` ; capacité externe =
  **adapter derrière un port** (CLAUDE § Règle d'architecture). **UI → use cases**
  (`useServices()`). Jamais d'import entre modes (CONV. § 13-14).
### Règles de jeu : pointées, jamais énoncées
- **X01** : § Règles du jeu X01. Délicats : bust, double in / out, checkouts (deux sorties),
  bogey numbers, legs et sets, First 9, % doubles.
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat.
- **Entraînement** : § Règles de l'entraînement. Délicats : plage, tirage écrit au journal, une
  volée par manche, hors statistiques. Le texte de la feuille (`labels.ts`, `regles*`) n'est **pas**
  une source : il suit ces sections.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, persisté jamais renommé, facultatif absent = **clé
  absente**, migration + test, `backupSchema` au même lot (rules/persistence). Jamais écrits :
  « Abandonnée », `legsPlayed`, nom par défaut, classement. Clé d'historique `regles` :
  `location.state`, pas une donnée de partie.
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; `/confidentialite` tenue vraie
  (CLAUDE § Décisions structurantes). Clé `localStorage` ou donnée nouvelle : texte **et date** de
  `SECTIONS_CONFIDENTIALITE` au même lot. Seule entrée non fiable : l'import JSON
  (rules/persistence.md). Hosting, cache, SW : DEPLOIEMENT. Checklist : `.claude/agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` ; neuf jetons réservés à
  `FeuilleRegles` / `LivreRegles` (rules/theme-colors). Gardes : `themeBoundary`,
  `typographieBoundary`, `pictogrammesBoundary`, `accentBoundary`, `appuiBoundary`. Français dans
  `labels.ts` ; routes lazy ; cibles ≥ 48 px.
- Match : briques de `composants/commun/` ; `.repere-lancer`, jamais `.au-lancer`. Cartes :
  `vueCarte` **seul** à ouvrir `MatchSummary` ; une carte = **une cible**.
- Boîte par-dessus l'écran : `useModaleAuRetour` + `useDialogueNatif`, ouverture au clic,
  fermeture `navigate(-1)`, `<dialog>` jamais `flex`/`grid` (CONV. § 9). Un mode nouveau doit sa
  feuille et la prop `regles` de `BandeauMatch` (CONV. § 13). Statistiques : `ui/podium.ts`.
- Parcours : tirage par `services.shuffleOrder` ; solo testé en dur (CONV. § 13).
- Planche validée suivie **à l'identique** ; rebase **avec accord**, index **régénéré**
  (`orchestrate`). Fakes, pas de mocks ; `lint:fix` sur `src tests`.
- Pièges : `61b60ac` (CLAUDE § Notes) ; cache, `id: '/'`, `ignore`, `REMPLIR` (§ Déploiement) ;
  `<StrictMode>`, `partie:mode` (PLAN § 6) ; `test.env.TZ` ; police max.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat, checkout | CLAUDE § Règles du jeu ; glossary |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil, horloge, mode | DS ; CONV. § 5, 7, 13, 14 |
| Écran, route | rules/frontend-react ; CHARTE ; CONV. § 8-10, 13 |
| Nouvelle partie ; cartes ; livre de règles | DS ; CHARTE § Parcours, § Composants ; CONV. § 9, 13 |
| Statistiques, modale | CHARTE § Composants, § carte des impacts ; CONV. § 9, 14 |
| Match, feuille, pavé | CHARTE § Écran de match, § Saisie ; `docs/lots/<lot>/` |
| Couleur, thème, texte | rules/theme-colors ; CHARTE § Palette, Un seul accent, Typographie |
| Nom ; politique ; worktrees | DS ; glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE`) ; `orchestrate` |
| Test, lint, build ; état | rules/testing, biome ; DEPLOIEMENT ; PLAN § 0, 4 |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ à `archi-authority` (`orchestrate` § Niveaux) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects (`checkout.ts` compris).
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (`name?` compris), schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé.
5. Une décision de DS (stockage, installation, **politique** et toute clé `localStorage` qu'elle
   cite, dont `statistiques:joueur`, Nouvelle partie, double out, **nom de partie**,
   **`Services.clock`**, **« Abandonnée »**, **règles au livre ouvert**), § Règles du jeu (quatre
   modes, Checkouts, entraînement), ou § Charte « ce qui ne s'y discute pas » (zéro dégradé de
   décor, angle vif, deux zones). Reste de la charte : `light`.

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée**
(écart = défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` seuls ; `craie-decor` | couleur en dur ; plancher | `themeBoundary.test.ts:36` |
| Neuf jetons réservés à la feuille (contraste vérifié sur ses surfaces seulement) | jeton général | rules/theme-colors |
| Titre `laiton` du podium et de la `Modale` en clair (4,40:1) ; bascules à 48 px en hauteur seule : **acceptés** (U4, Q3) | plancher ; 48 px | CHARTE § Composants (« Écart connu ») |
| `.chargement-balai` seul dégradé | zéro dégradé | CHARTE § Principe |
| `Services.devices` ; `Services.clock` (même instance que les use cases) | UI → use cases | `container.ts:97-106,143-151` |
| `matchStatus`, `rankPlayers`, `leadingPlayers` : seules fonctions de `use-cases/` importées par l'UI | UI → use cases | `summarize.ts:33` |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee`, `statistiques:joueur`, `partie:*` | persisté jamais renommé | `MatchEvent.ts:30-38` |
| `partie:ordre-aleatoire` orpheline ; flag `shuffle` sans appelant UI | dette assumée | `useNouvellePartie.ts:46` |
| `DialogueNouveauJoueur` : `<dialog>` hors historique | boîte au retour | `DialogueNouveauJoueur.tsx:71` |
| Double out : décoché à l'écran, `true` dans le domaine | ne pas aligner | `x01/config.ts:68` |
| Nom par défaut jamais écrit, clé `name` absente, jamais `undefined` | un défaut se persiste | `MatchEvent.ts:124` |
| Firebase Hosting seul ; `.well-known` publié ; `REMPLIR` sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `docs/maquettes/` hors git et hors lint | routes lazy ; lint | `App.tsx:6` ; `biome.json:18` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé ; `legsForBestOf` survit ; progression garde `0` | ports ; thème ; best of N ; `pourcent()` | PLAN § 2, 6 ; CONV. § 9 |

## Décisions ouvertes
1. Sync cloud ; i18n ; jeux restants (CLAUDE § Décisions ouvertes 3-5).
2. Lot 5b sans suivi ; `/historique/:id`, `/joueurs/:id` jamais faits (PLAN § 0).
3. **Refonte** : 10, 12 à cadrer ; 13 : `high` ; étude « règles façon DartsOn » attendue (rien
   n'est gravé). Relectures à l'écran en attente : lots 1-9, 11 (PLAN § 0).
4. **Acceptées après lots 8 et 11** (PLAN § 0) : T19, Q3 de `sec`, R1, R2, U1, U2, iPhone, textes
   non dessinés, 360 px, police max. Dette `DialogueNouveauJoueur`.
5. Prochain audit : R2-R4, N2, **R7**, exports de `backupSchema.ts`, erreurs de listes, garde des
   jetons (#28), parcours importé à doublons / `MISS` (#11).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 11 | Moyenne | Import : docs « validé avant écriture », code : dans la boucle ; `createdAt` sans borne haute ; parcours importé : `MISS` et doublons acceptés (`<li key>` en double) | `ManageBackupUseCase.ts:50-73` ; `backupSchema.ts:33-38` | À trancher |
| 21 | Moyenne | `text-laiton` en clair : 3,5:1 (Test) ou 4,4:1 (charte). **Podium, `Modale` : accepté (U4)** ; pas accepté : liens `text-sm`, `Panneau`, `DialogueNouveauJoueur` | `AccueilEcran.tsx:163,171` ; `Panneau.tsx:32` ; `Modale.tsx:77` | Plancher 4,5:1 |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » | `CLAUDE.md:117-119` ; `biome.json:59-70` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` sans `*UseCase` » (R7) | `CONVENTIONS.md:144-149` | Non détecté |
| 26 | Basse | CONV. § 14 : la liste « dont » de `commun/` omet `Pictogramme`, `FeuilleMatch`, `BandeauMatch`, `NomJoueurFeuille`, `CasesVolee` | `CONVENTIONS.md:444-449` | Partielle |
| 17 | Basse | PLAN § 0 : « 765 tests verts » orphelin (courant : 1340) | PLAN `:20,45` | Périmée |
| 20 | Basse | « Partie ! », libellé « Manche » du `Cartouche` hors `labels.ts` | `momentVolee.ts:20` ; `Cartouche.tsx:110` | Convention |
| 24 | Basse | Résumés Cricket / Tour du monde : tri à la main, hors `rankPlayers` | `ResumeCricketEcran.tsx:58` ; `ResumeTourDuMondeEcran.tsx:51` | Deux tris |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (→ `useX01.ts`) ; PLAN § 2 sans `PreviewTourDuMondeVisit` | `CLAUDE.md:115` | Périmée |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:86,649` | Incomplet |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Périmé |
| 28 | Basse | Garde des jetons : faux négatifs (`border-s/e-`, `ring-offset-`, valeurs arbitraires) | `themeBoundary.test.ts:124` | Non détecté |

## Questions et limites
- Rien de gravé sacrifié. #11 : non tranché. Charte (`light`) : **interprétation**.
- **Écart du brief** : `agents/architecture-context.md` dit l'entraînement « non gravé » ; périmé
  (`CLAUDE.md` § Règles de l'entraînement). Brief non édité : à corriger.
- Planches, captures, contrastes, PLAN § 6 hors lot 11, DEPLOIEMENT (titres) non lus. Connus :
  `successPercent` sans « — » (`ResumeEntrainementEcran.tsx:50`) ; pas d'`ErrorBoundary`. Tests non relancés.

## Traçabilité
- **Reportés** (revérifiés) : 2, 4, 7, 10, 11, 14, 17, 20, 21, 24, 26. **#11 étendu** (R2-9) ;
  **#26 réduit** ; **#28** nouveau (R2-8). **Retirés, résolus** : #3 (entraînement gravé), #5
  (`CLAUDE.md` : « 3 premières volées »), #12 (deux sorties gravées), #25 (« Les règles en entier »
  retiré), #16, #19 (§ 14 : 13 hooks, 23 ports driving, comptés sur disque). Avant : 10 autres.
