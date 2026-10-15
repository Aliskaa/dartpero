# Contexte d'architecture
> **Index**, pas une source de vérité (désaccord : code récent, puis `CLAUDE.md`, puis le reste).
> **DS** = `CLAUDE.md` § Décisions structurantes ; **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-15 (11e passe), scope `all`, branche `lot/worktrees-paralleles` (de `main`
  à `b7bf667`, **non committé**) : chore workflow. Lot 7 `cartes-partie` **fusionné** (`b7bf667`).
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte et DEPLOIEMENT (titres), PLAN § 0,
  `orchestrate`, `intake`, `maquettes/LISEZMOI.md`, ancien index ; code vérifié.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports ; `/confidentialite` **datée** ; profils locaux + export / import JSON ; match = `MatchEvent[]` ; saisie fléchette par fléchette **seule** | en vigueur | DS |
| « Saisie hybride » / mode rapide | **renversée** (retirée après usage, `d531a7e`) | DS ; Notes |
| « Best of N » legs | **renversée** : « premier à N » (`legsToWin`) | DS ; glossary |
| Accent **par mode** (`--accent-*`) | **renversée** (`pave-unifie`) : laiton unique, pictogramme par jeu | CHARTE § Un seul accent |
| Double out écran ≠ domaine ; « manche » ; Nouvelle partie : **route par étape** | en vigueur | DS ; glossary |
| **Nom de partie** (seul un nom tapé s'écrit) ; « Abandonnée » **dérivée, jamais écrite** | en vigueur | DS |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query hors match ; Biome seul | en vigueur | DS |
| `PersistentStorage`, `AppInstallation` ; `id: '/'` figé ; `smoke` refuse `REMPLIR` | en vigueur | DS ; § Déploiement |
| Thème défaut **sombre** ; angle vif ; zones lecture / saisie | en vigueur | DS |
| **Charte seule** : plancher `craie-3`, échelle, mouvement, ni halo ni dégradé, pictogrammes, feuille, `PaveSaisie` | en vigueur | CHARTE |
| **Cartes de partie** : ligne de feuille, mini tableau, `rankPlayers`, `vueCarte` | en vigueur | CHARTE § Composants ; CONV. § 9, 13 |
| Refonte visuelle (13 lots) | **étude** ; 1-7 faits, 8-12 à cadrer, 13 `high` | étude § Découpage |
| **Lots en parallèle** (un worktree par lot) | **expérimental**, sur demande | `orchestrate` § Lots en parallèle |
| **Planches** : `docs/maquettes/` du dépôt principal, **ignoré par git** (chemin absolu) | en vigueur | `maquettes/LISEZMOI.md` ; `intake` § Planches |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **uniquement** dans `container.ts` ; capacité externe =
  **adapter derrière un port** (CLAUDE § Règle d'architecture). **UI → use cases**
  (`useServices()`) ; heure par `services.clock`. Couture `GameMode` : jamais d'import entre
  modes ; mode lu sur le **premier événement** (CONVENTIONS § 13, qui dit aussi ce qu'un mode
  doit aux cartes ; arbre : § 14).
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust, double in / out, checkout, bogey
  numbers, legs et sets, statistiques (First 9, % doubles).
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat.
- **Entraînement** : **non gravé** ; PLAN § 4 / § 6 lot 5b.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, valeur persistée jamais renommée, facultatif absent =
  **clé absente**, migration + test, `backupSchema` au même lot (rules/persistence). Dérivés,
  jamais écrits : « Abandonnée », `legsPlayed`, nom par défaut, classement.
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; `/confidentialite` tenue vraie
  (CLAUDE § Décisions structurantes). Seule entrée non fiable : l'import JSON
  (rules/persistence.md). Hosting, cache, SW : docs/DEPLOIEMENT.md. Checklist :
  `.claude/agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` (rules/theme-colors). Gardes :
  `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `accentBoundary`,
  `appuiBoundary`. Français dans `labels.ts` ; routes lazy ; cibles ≥ 48 px.
- Écran de match : briques de `composants/commun/` (`FeuilleMatch`, `BandeauMatch`,
  `PaveSaisie`…) ; lignes de **hauteur égale** ; `.repere-lancer`, jamais `.au-lancer`.
  Cartes : `vueCarte` (`ui/cartesPartie.ts`) **seul** à ouvrir `MatchSummary` ; une carte =
  **une cible**, corbeille sœur (CONV. § 9).
- Planche validée : suivie **à l'identique**, aucune décision produit par un agent
  (`orchestrate` § Planche validée) ; citée par son **chemin absolu**, jamais le scratchpad.
- Worktrees : un port par lot ; fusion depuis le dépôt principal ; rebase du second **avec
  accord**, index **régénéré** (`orchestrate` § Lots en parallèle).
- Fakes, jamais de mocks ; `lint:fix` sur `src tests` seul.
- Pièges : `61b60ac` (CLAUDE § Notes) ; `max-age`, `headers`, `id: '/'`, `ignore`, `REMPLIR`
  (CLAUDE § Déploiement) ; Rolldown (DEPLOIEMENT) ; `<StrictMode>`, `partie:mode` (PLAN § 6) ;
  `test.env.TZ` (CONV. § 11-12) ; barre du bas à police max **avant déploiement**.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil, horloge, mode | DS ; CONVENTIONS § 5, 7, 13, 14 |
| Écran, route, Nouvelle partie | rules/frontend-react ; CHARTE ; CONVENTIONS § 8-10, 13 |
| Cartes de partie, classement | CHARTE § Composants ; CONV. § 9, 13 ; `docs/lots/cartes-partie/` |
| Écran de match, feuille, moment, pavé | CHARTE § Écran de match, § Saisie ; `docs/lots/feuille-commune/`, `pave-unifie/` |
| Couleur, thème, accent, texte, mouvement | rules/theme-colors ; CHARTE § Palette, Un seul accent, Typographie |
| Nom de partie ; politique | DS ; glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE`) |
| Planche (hors git) ; worktrees | `maquettes/LISEZMOI.md` ; `orchestrate` § Lots en parallèle |
| Test, lint ; build, SW ; état | rules/testing, biome ; DEPLOIEMENT ; PLAN § 0, 4 |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ à `archi-authority` (`orchestrate` § Niveaux) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (`name?` compris), schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé.
5. Une décision de DS (stockage, installation, politique, Nouvelle partie, double out, **nom de
   partie**, **`Services.clock`**, **« Abandonnée » dérivée**), § Règles du jeu, ou § Charte
   « ce qui ne s'y discute pas » (zéro dégradé de décor, angle vif, deux zones lecture / saisie).
   Plancher, échelle, mouvement, pictogrammes, feuille, pavé, laiton unique, cartes,
   `rankPlayers` : `light`.

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée**
(écart = défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` seuls ; `craie-decor` | couleur en dur ; plancher | `themeBoundary.test.ts:36` |
| `.chargement-balai` seul dégradé | zéro dégradé / halo | CHARTE § Principe |
| `Services.devices` (stockage, installation) ; **`Services.clock`**, même instance que les use cases | UI → use cases ; `horlogeBoundary` | `container.ts:93-107,135-143` |
| **`matchStatus`**, **`rankPlayers`**, **`leadingPlayers`** : seules fonctions de `use-cases/` importées par l'UI | UI → use cases | `summarize.ts:33` ; `cartesPartie.ts:2` |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee` ; clés `partie:*` | valeur persistée jamais renommée | `MatchEvent.ts:29-38` |
| **Double out : décoché à l'écran, `true` dans le domaine** | ne pas aligner | `x01/config.ts:68` |
| **Nom par défaut jamais écrit**, clé `name` absente, jamais `undefined` | un défaut se persiste | `MatchEvent.ts:122-125` |
| Firebase **Hosting** seul ; **`.well-known`** publié ; **`REMPLIR`** sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `nouvelle-partie/*` sous un `lazy()` | routes lazy | `App.tsx:6,10-35` |
| `docs/maquettes/` : **hors git** (`.gitignore:19`), **hors lint** ; archive de conception | versionnement ; lint | `biome.json:18` ; `rules/biome.md` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé | ports ; thème | PLAN § 2, 6 |
| `legsForBestOf` survit ; noms français privés dans `core` ; progression garde `0` | best of N ; cœur anglais ; `pourcent()` | DS ; CONV. § 1, 9 |
| Tour du monde : moment `ancrage="sous"` | moment superposé | `TourDuMondeEcran.tsx:146` |

## Décisions ouvertes
1. Sync cloud ; i18n ; jeux restants (CLAUDE § Décisions ouvertes 3-5).
2. Lot 5b sans suivi ; `/historique/:id`, `/joueurs/:id` jamais faits ; vrai iPhone (PLAN § 0).
3. **Refonte** : 8-12 à cadrer ; 13 `volee-partielle` : `high`. Lot 7 : relecture à l'écran (T3),
   dette N1 (`docs/lots/cartes-partie/`).
4. Relectures à l'écran en attente : trois lots de finition, lots 1-7 de la refonte (PLAN § 0).
5. Prochain audit : R2-R4, N2, **R7**, exports de `backupSchema.ts`, erreurs de listes ;
   « sortie libre » **reporté** (PLAN § 0 n° 4).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 12 | Moyenne | **Report décidé.** Sortie libre (**défaut de l'écran**) : suggestion jusqu'à 180 ; docs : double out seul | `checkout.ts:84` ; `CLAUDE.md:249-254` | Règle muette |
| 3 | Moyenne | Entraînement absent de `CLAUDE.md` ; plage 41-170 dans PLAN et code seulement | PLAN `:469` | Non gravé |
| 11 | Moyenne | Import : docs « validé avant écriture » ; code : validé dans la boucle d'écriture ; `createdAt` sans borne haute | `ManageBackupUseCase.ts:42-73` ; `backupSchema.ts:33-36` | À trancher |
| 21 | Moyenne | Petit `text-sm text-laiton` (Accueil, retours) : 3,5:1 (Test) ou 4,4:1 (charte) en clair ; non recalculé | `AccueilEcran.tsx:163,171` ; `X01Ecran.tsx:95` ; `CHARTE:106-110` | Plancher 4,5:1 |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » | `CLAUDE.md:117-119` ; `biome.json:61-68` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` sans classe `*UseCase` » (R7) | `CONVENTIONS.md:144-149` ; `tests/architecture/` | Non détecté |
| 16 | Basse | `usePauseAnnulation.ts` absent de l'arbre et de « 10 hooks » (en fait 11) | `CONVENTIONS.md:359,413-419` | Doc périmée |
| 17 | Basse | PLAN § 0 « 765 tests » (lot 7 : 1065), liste T1 (réglé) ; § 6 s'arrête au lot 3 de la refonte | PLAN `:19,30,1876` | Doc périmée |
| 19 | Basse | `Pictogramme`, `FeuilleMatch`, `BandeauMatch`, `NomJoueurFeuille`, `CasesVolee` absents de CONV. § 14 et de la charte | `CONVENTIONS.md:402-404` ; `CHARTE:296-317` | Doc périmée |
| 20 | Basse | Titres des moments (« Partie ! »…), `Cartouche` (« Sortie demandée ») hors `labels.ts` | `x01/momentVolee.ts:20` ; `CricketEcran.tsx:69` ; `Cartouche.tsx:40-61` | Convention |
| 24 | Basse | Résumés Cricket / Tour du monde : tri à la main (cut-throat compris), hors `rankPlayers` (dette T2) | `ResumeCricketEcran.tsx:58` ; `ResumeTourDuMondeEcran.tsx:51` ; `rankPlayers.ts:50-71` | Deux tris |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (→ `useX01.ts`) ; PLAN § 2 sans `PreviewTourDuMondeVisit` ; § 6 « QUE `MatchStarted` » | `CLAUDE.md:115` ; PLAN `:205-233,732` | Doc périmée |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:268` ; `stats.ts:133-137` | Volée courte |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:86,577` | Incomplet |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Périmé |

## Questions et limites
- Rien de gravé sacrifié. Entraînement, #12, #11 : intention non tranchée. Plancher, échelle,
  feuille, pavé, laiton unique, cartes (`light`) : **interprétation**.
- Planches, captures, contrastes (#21) non lus ; `docs/maquettes/` lu par son `LISEZMOI.md`
  seul, absent d'un clone neuf et des worktrees. Worktrees : mode jamais éprouvé jusqu'au rebase
  (conflits attendus, `orchestrate`). Non committé : workflow, `biome.json`, `.gitignore`. Non
  relus : PLAN § 6, DEPLOIEMENT. Connus : `successPercent` sans « — »
  (`ResumeEntrainementEcran.tsx:50`) ; aucun `ErrorBoundary`. Tests non relancés.

## Traçabilité
- **Reportés** (revérifiés) : 2-5, 7, 10-12, 14, 16, 17, 19-21, 24 ; chemins de #20 corrigés.
  **Nouveau** et **retiré** : aucun (« non committé » ôté de #24, #21, #17).
- Retirés avant : #1, #6, #8, #9, #13, #15, #18, #22, #23 (numéros non réutilisés).
