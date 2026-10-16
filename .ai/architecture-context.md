# Contexte d'architecture
> **Index**, pas une source de vérité (désaccord : code récent, puis `CLAUDE.md`, puis le reste).
> **DS** = `CLAUDE.md` § Décisions structurantes ; **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-16 (13e passe), scope `all`, branche `lot/statistiques-podium` (lot 8,
  `11ffb99`, sur `main` à `5644892` = lot 9 ; PLAN § 0 modifié, **non committé**).
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte, DEPLOIEMENT et `orchestrate` (titres),
  PLAN § 0 / § 4 / § 6 (fin), étude de refonte, Revue du lot 8, ancien index ; code, `git log`.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; ni Firebase dans l'app, ni auth, ni réseau ; Dexie derrière les ports ; `/confidentialite` datée ; profils locaux + export JSON ; match = `MatchEvent[]` ; saisie fléchette par fléchette | en vigueur | DS |
| « Saisie hybride » / mode rapide (retirée après usage, `d531a7e`) | renversée | DS ; Notes |
| « Best of N » → « premier à N » (`legsToWin`) | renversée | DS ; glossary |
| Accent par mode (`--accent-*`) → laiton unique (`pave-unifie`) | renversée | CHARTE § Un seul accent |
| Interrupteur « Ordre aléatoire » → « Tirer au sort », mélange visible (`ShuffleOrder`, lot 9) | renversée | DS ; CHARTE § Parcours |
| Double out écran ≠ domaine ; « manche » ; Nouvelle partie : route par étape, `BarreEtapes` non interactive ; nom de partie (champ à l'étape 2) ; « Abandonnée » dérivée | en vigueur | DS ; glossary |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query hors match ; Biome seul ; `PersistentStorage`, `AppInstallation` ; `id: '/'` ; `smoke` | en vigueur | DS ; § Déploiement |
| Thème défaut sombre ; angle vif ; zones lecture / saisie ; charte (plancher `craie-3`, feuille, `PaveSaisie`, parcours, cartes) ; **Statistiques en podium** (`CartePodium`, `Modale`, `statistiques:joueur`) | en vigueur | DS ; CHARTE § Composants |
| Modale refermée par le retour du téléphone | en vigueur (convention) | CONV. § 9 |
| Refonte visuelle (13 lots) | étude ; **1-9 faits**, 10-12 à cadrer, 13 `high` | étude § Découpage ; `git log` |
| Lots en parallèle (worktrees) ; planches dans `docs/maquettes/` du dépôt principal | expérimental | `orchestrate` § Lots en parallèle |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **uniquement** dans `container.ts` ; capacité externe =
  **adapter derrière un port** (CLAUDE § Règle d'architecture). **UI → use cases**
  (`useServices()`). `GameMode` : jamais d'import entre modes (CONV. § 13-14).
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust, double in / out, checkout, bogey
  numbers, legs et sets, First 9, % doubles.
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat.
- **Entraînement** : **non gravé** ; PLAN § 4 / § 6 lot 5b. « Les règles en entier »
  (`labels.ts`) n'est **pas** une source : #25.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, persisté jamais renommé, facultatif absent = **clé
  absente**, migration + test, `backupSchema` au même lot (rules/persistence). Jamais écrits :
  « Abandonnée », `legsPlayed`, nom par défaut, classement.
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; `/confidentialite` tenue vraie
  (CLAUDE § Décisions structurantes). Clé `localStorage` ou donnée nouvelle : texte **et date** de
  `SECTIONS_CONFIDENTIALITE` au même lot. Seule entrée non fiable : l'import JSON
  (rules/persistence.md). Hosting, cache, SW : docs/DEPLOIEMENT.md. Checklist : `agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` (rules/theme-colors). Gardes :
  `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `accentBoundary`,
  `appuiBoundary`. Français dans `labels.ts` ; routes lazy ; cibles ≥ 48 px.
- Match : briques de `composants/commun/` ; `.repere-lancer`, jamais `.au-lancer`. Cartes :
  `vueCarte` (`ui/cartesPartie.ts`) **seul** à ouvrir `MatchSummary` ; une carte = **une cible**.
- Statistiques : logique pure dans `ui/podium.ts` (comme `cartesPartie.ts`, sans React) ; briques
  `CartePodium`, `CompteBatons` (≠ `Batons`), `PlateauImpacts`, `Modale`. Ex æquo jugés sur le
  chiffre **affiché**. Modale : `useModaleAuRetour` (CONV. § 9), `<dialog>` jamais `flex`/`grid`.
- Parcours : tirage par `services.shuffleOrder`, jamais `Math.random` ; solo testé en dur (CONV. § 13).
- Planche validée suivie **à l'identique** ; worktrees : rebase **avec accord**, index
  **régénéré** (`orchestrate`). Fakes, pas de mocks ; `lint:fix` sur `src tests`.
- Pièges : `61b60ac` (CLAUDE § Notes) ; cache, `id: '/'`, `ignore`, `REMPLIR` (CLAUDE
  § Déploiement) ; `<StrictMode>`, `partie:mode` (PLAN § 6) ; `test.env.TZ` ; police max.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil, horloge, mode | DS ; CONVENTIONS § 5, 7, 13, 14 |
| Écran, route | rules/frontend-react ; CHARTE ; CONV. § 8-10, 13 |
| Nouvelle partie ; cartes de partie | DS ; CHARTE § Parcours, § Composants ; CONV. § 9, 13 ; `docs/lots/<lot>/` |
| Statistiques, modale | CHARTE § Composants, § carte des impacts ; CONV. § 9, 14 ; `docs/lots/statistiques-podium/` |
| Match, feuille, pavé | CHARTE § Écran de match, § Saisie ; `docs/lots/<lot>/` |
| Couleur, thème, texte | rules/theme-colors ; CHARTE § Palette, Un seul accent, Typographie |
| Nom ; politique ; worktrees | DS ; glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE`) ; `orchestrate` |
| Test, lint ; build ; état | rules/testing, biome ; DEPLOIEMENT ; PLAN § 0, 4 |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ à `archi-authority` (`orchestrate` § Niveaux) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (`name?` compris), schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé.
5. Une décision de DS (stockage, installation, **politique** et toute clé `localStorage` qu'elle
   cite, dont `statistiques:joueur`, Nouvelle partie, double out, **nom de partie**,
   **`Services.clock`**, **« Abandonnée »**), § Règles du jeu, ou § Charte « ce qui ne s'y
   discute pas » (zéro dégradé de décor, angle vif, deux zones). Reste de la charte : `light`.

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée**
(écart = défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` seuls ; `craie-decor` | couleur en dur ; plancher | `themeBoundary.test.ts:36` |
| Titre `laiton` du podium et de la `Modale` en clair (4,40:1) ; bascules à 48 px en hauteur seule : **acceptés** (U4, Q3) | plancher ; 48 px | CHARTE `:329-340` |
| `.chargement-balai` seul dégradé | zéro dégradé | CHARTE § Principe |
| `Services.devices` ; `Services.clock` (même instance que les use cases) | UI → use cases | `container.ts:95-110,139-147` |
| `matchStatus`, `rankPlayers`, `leadingPlayers` : seules fonctions de `use-cases/` importées par l'UI | UI → use cases | `summarize.ts:33` ; `cartesPartie.ts:2` |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee`, `statistiques:joueur`, `partie:*` | persisté jamais renommé | `MatchEvent.ts:29-38` ; `StatistiquesEcran.tsx:89` |
| `partie:ordre-aleatoire` orpheline ; flag `shuffle` sans appelant UI | dette assumée | `useNouvellePartie.ts:45` |
| `DialogueNouveauJoueur` : `<dialog>` hors historique | modale au retour | `DialogueNouveauJoueur.tsx:71` |
| Double out : décoché à l'écran, `true` dans le domaine | ne pas aligner | `x01/config.ts:68` |
| Nom par défaut jamais écrit, clé `name` absente, jamais `undefined` | un défaut se persiste | `MatchEvent.ts:124-125` |
| Firebase Hosting seul ; `.well-known` publié ; `REMPLIR` sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `docs/maquettes/` hors git (`.gitignore:19`) et hors lint | routes lazy ; lint | `App.tsx:6,10-35` ; `biome.json:18` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé ; `legsForBestOf` survit ; progression garde `0` ; moment `ancrage="sous"` | ports ; thème ; best of N ; `pourcent()` | PLAN § 2, 6 ; CONV. § 9 |

## Décisions ouvertes
1. Sync cloud ; i18n ; jeux restants (CLAUDE § Décisions ouvertes 3-5).
2. Lot 5b sans suivi ; `/historique/:id`, `/joueurs/:id` jamais faits ; iPhone (PLAN § 0).
3. **Refonte** : 10-12 à cadrer (le 11 validera #25) ; 13 : `high`. Relectures à l'écran en
   attente : lots 1-9, trois lots de finition (PLAN § 0).
4. **Lot 8, acceptées après le lot** (PLAN § 0) : **T19** (retour réel qui ferme la modale :
   Chrome, Firefox, iPhone, PWA) et **Q3 de `sec`** (modale restaurée sans entrée d'historique :
   bloquée) ; angles morts d'appareil ; relecture à l'écran (U4, police max). Dette
   `DialogueNouveauJoueur`.
5. Prochain audit : R2-R4, N2, **R7**, exports de `backupSchema.ts`, erreurs de listes ;
   « sortie libre » **reporté** (PLAN § 0 n° 4).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 12 | Moyenne | Report décidé. Sortie libre (défaut de l'écran) : suggestion jusqu'à 180 ; docs muettes | `checkout.ts:84` ; `CLAUDE.md:252-257` | Muette |
| 25 | Moyenne | « Les règles en entier » : règles réécrites dans l'UI, X01 « à valider » | `labels.ts:1067-1106` ; PLAN `:1950` | Paraphrasée |
| 3 | Moyenne | Entraînement absent de `CLAUDE.md` ; plage 41-170 dans PLAN et code | PLAN `:483-500` | Non gravé |
| 11 | Moyenne | Import : docs « validé avant écriture », code : dans la boucle ; `createdAt` sans borne haute | `ManageBackupUseCase.ts:50-73` ; `backupSchema.ts:33-38` | À trancher |
| 21 | Moyenne | `text-laiton` en clair : 3,5:1 (Test) ou 4,4:1 (charte). **Titres du podium et de la `Modale` : accepté (U4)** ; pas accepté : liens `text-sm`, `Panneau`, `DialogueNouveauJoueur` | `AccueilEcran.tsx:163,171` ; `Panneau.tsx:32` ; `CartePodium.tsx:50` ; `Modale.tsx:132` ; `CHARTE:329-334` | Plancher 4,5:1 |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » | `CLAUDE.md:117-119` ; `biome.json:59-70` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` sans `*UseCase` » (R7) | `CONVENTIONS.md:144-149` | Non détecté |
| 16, 19, 26 | Basse | CONV. § 14 périmée : `usePauseAnnulation.ts` absent (« 10 hooks » = 12 + `tourDeTable.ts`) ; « 21 ports driving » sans `ShuffleOrder` (22) ; `Pictogramme`, `FeuilleMatch`, `BandeauMatch`, `NomJoueurFeuille`, `CasesVolee` absents | `CONVENTIONS.md:368-369,391-399,412-435` | Périmée |
| 17 | Basse | PLAN § 0 « 765 tests » (lot 9 : 1091 ; lot 8 : 1233) | PLAN `:19,708` | Périmée |
| 20 | Basse | Titres des moments (« Partie ! ») et `Cartouche` hors `labels.ts` | `momentVolee.ts:20` ; `CricketEcran.tsx:69` ; `Cartouche.tsx:43` | Convention |
| 24 | Basse | Résumés Cricket / Tour du monde : tri à la main, hors `rankPlayers` (T2) | `ResumeCricketEcran.tsx:58` ; `ResumeTourDuMondeEcran.tsx:51` | Deux tris |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (→ `useX01.ts`) ; PLAN § 2 sans `PreviewTourDuMondeVisit` | `CLAUDE.md:115` | Périmée |
| 5 | Basse | First 9 : « 9 fléchettes » vs code « 3 premières volées » | `CLAUDE.md:279` ; `stats.ts:133-137` | Volée courte |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:86,617` | Incomplet |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Périmé |

## Questions et limites
- Rien de gravé sacrifié. Entraînement, #12, #11, #25 : intention non tranchée. Charte (`light`) :
  **interprétation**. Le lot 8 (`high`, politique) ne grave rien dans `CLAUDE.md`.
- Planches, captures, contrastes, PLAN § 6 hors lots 8-9, DEPLOIEMENT (titres) non lus. Connus :
  `successPercent` sans « — » (`ResumeEntrainementEcran.tsx:50`) ; pas d'`ErrorBoundary` ; Revue
  lot 8, constat 10 (N2, TM-7, TM-8, TM-b, T12). Tests non relancés.

## Traçabilité
- **Reportés** (revérifiés) : 2-5, 7, 10-12, 14, 16, 17, 19-21, 24-26. **#21 étendu** (podium,
  `Modale`, U4) ; **#16, #26** précisés ; **retiré** : #27 (coquille de PLAN § 0, corrigée avant commit). Retirés avant :
  #1, #6, #8, #9, #13, #15, #18, #22, #23.
