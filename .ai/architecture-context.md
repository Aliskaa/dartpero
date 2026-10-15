# Contexte d'architecture
> **Index**, pas une source de vérité (désaccord : code récent, puis `CLAUDE.md`, puis le reste).
> **DS** = `CLAUDE.md` § Décisions structurantes ; **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-15 (12e passe), scope `all`, branche `lot/nouvelle-partie-parcours` (de `main`
  à `6109013`, **non committé**) : lot 9 de la refonte, `light`. Le lot 8 `statistiques-podium`
  tourne dans un autre worktree, hors périmètre.
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte et DEPLOIEMENT (titres), PLAN § 0 et
  fin de § 4 / § 6, `orchestrate`, ancien index ; code vérifié.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; pas de Firebase dans l'app, ni auth, ni réseau ; Dexie derrière les ports ; `/confidentialite` datée ; profils locaux + export JSON ; match = `MatchEvent[]` ; saisie fléchette par fléchette | en vigueur | DS |
| « Saisie hybride » / mode rapide | renversée (retirée après usage, `d531a7e`) | DS ; Notes |
| « Best of N » legs | renversée : « premier à N » (`legsToWin`) | DS ; glossary |
| Accent par mode (`--accent-*`) | renversée (`pave-unifie`) : laiton unique | CHARTE § Un seul accent |
| Interrupteur « Ordre aléatoire » | renversée (lot 9) : « Tirer au sort » = mélange visible (`ShuffleOrder`) | DS ; CHARTE § Parcours |
| Double out écran ≠ domaine ; « manche » ; Nouvelle partie : route par étape ; `BarreEtapes` non interactive | en vigueur | DS ; glossary |
| Nom de partie (seul un nom tapé s'écrit ; champ à l'étape 2) ; « Abandonnée » dérivée | en vigueur | DS |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query hors match ; Biome seul | en vigueur | DS |
| `PersistentStorage`, `AppInstallation` ; `id: '/'` figé ; `smoke` refuse `REMPLIR` | en vigueur | DS ; § Déploiement |
| Thème défaut sombre ; angle vif ; zones lecture / saisie | en vigueur | DS |
| Charte seule : plancher `craie-3`, échelle, mouvement, ni halo ni dégradé, pictogrammes, feuille, `PaveSaisie`, parcours ; cartes (`rankPlayers`, `vueCarte`) | en vigueur | CHARTE ; CONV. § 9, 13 |
| Refonte visuelle (13 lots) | étude ; 1-7, 9 faits (9 non committé), 8 en parallèle, 10-12 à cadrer, 13 `high` | étude § Découpage |
| Lots en parallèle (un worktree par lot) ; planches dans `docs/maquettes/` du dépôt principal | expérimental ; en vigueur | `orchestrate` § Lots en parallèle ; `maquettes/LISEZMOI.md` |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **uniquement** dans `container.ts` ; capacité externe =
  **adapter derrière un port** (CLAUDE § Règle d'architecture). **UI → use cases**
  (`useServices()`). Couture `GameMode` : jamais d'import entre modes (CONVENTIONS § 13 ; § 14).
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust, double in / out, checkout, bogey
  numbers, legs et sets, statistiques (First 9, % doubles).
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat.
- **Entraînement** : **non gravé** ; PLAN § 4 / § 6 lot 5b. Les textes de règles de l'UI
  (« Les règles en entier », `labels.ts`) ne sont **pas** une source : #25.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, valeur persistée jamais renommée, facultatif absent =
  **clé absente**, migration + test, `backupSchema` au même lot (rules/persistence). Dérivés,
  jamais écrits : « Abandonnée », `legsPlayed`, nom par défaut, classement.
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; `/confidentialite` tenue vraie
  (CLAUDE § Décisions structurantes). Seule entrée non fiable : l'import JSON
  (rules/persistence.md). Hosting, cache, SW : docs/DEPLOIEMENT.md. Checklist : `agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` (rules/theme-colors). Gardes :
  `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `accentBoundary`,
  `appuiBoundary`. Français dans `labels.ts` ; routes lazy ; cibles ≥ 48 px.
- Écran de match : briques de `composants/commun/` (`FeuilleMatch`, `BandeauMatch`,
  `PaveSaisie`…) ; lignes de **hauteur égale** ; `.repere-lancer`, jamais `.au-lancer`.
  Cartes : `vueCarte` (`ui/cartesPartie.ts`) **seul** à ouvrir `MatchSummary` ; une carte = **une cible**.
- Parcours : tirage par `services.shuffleOrder`, jamais `Math.random` ; solo testé en dur (CONV. § 13).
- Planche validée : suivie **à l'identique** (`orchestrate` § Planche validée) ; worktrees : rebase
  **avec accord**, index **régénéré**. Fakes, jamais de mocks ; `lint:fix` sur `src tests`.
- Pièges : `61b60ac` (CLAUDE § Notes) ; `max-age`, `headers`, `id: '/'`, `ignore`, `REMPLIR`
  (CLAUDE § Déploiement) ; Rolldown (DEPLOIEMENT) ; `<StrictMode>`, `partie:mode` (PLAN § 6) ;
  `test.env.TZ` (CONV. § 11-12) ; police max **avant déploiement**.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil, horloge, mode | DS ; CONVENTIONS § 5, 7, 13, 14 |
| Écran, route | rules/frontend-react ; CHARTE ; CONVENTIONS § 8-10, 13 |
| Nouvelle partie (étapes, réglages, ordre) | DS ; CHARTE § Parcours ; CONV. § 13-14 ; `docs/lots/nouvelle-partie-parcours/` |
| Cartes de partie, classement | CHARTE § Composants ; CONV. § 9, 13 ; `docs/lots/cartes-partie/` |
| Écran de match, feuille, moment, pavé | CHARTE § Écran de match, § Saisie ; `docs/lots/feuille-commune/`, `pave-unifie/` |
| Couleur, thème, accent, texte | rules/theme-colors ; CHARTE § Palette, Un seul accent, Typographie |
| Nom de partie ; politique ; planche, worktrees | DS ; glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE`) ; `maquettes/LISEZMOI.md` ; `orchestrate` |
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
   Plancher, échelle, mouvement, pictogrammes, feuille, pavé, laiton, cartes : `light`.

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée**
(écart = défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` seuls ; `craie-decor` | couleur en dur ; plancher | `themeBoundary.test.ts:36` |
| `.chargement-balai` seul dégradé | zéro dégradé / halo | CHARTE § Principe |
| `Services.devices` (stockage, installation) ; `Services.clock`, même instance que les use cases | UI → use cases ; `horlogeBoundary` | `container.ts:95-110,139-147` |
| `matchStatus`, `rankPlayers`, `leadingPlayers` : seules fonctions de `use-cases/` importées par l'UI | UI → use cases | `summarize.ts:33` ; `cartesPartie.ts:2` |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee` ; clés `partie:*` | valeur persistée jamais renommée | `MatchEvent.ts:29-38` |
| `partie:ordre-aleatoire` orpheline ; flag `shuffle` des commandes sans appelant UI | dette assumée | DS ; `useNouvellePartie.ts:45` |
| Double out : décoché à l'écran, `true` dans le domaine | ne pas aligner | `x01/config.ts:68` |
| Nom par défaut jamais écrit, clé `name` absente, jamais `undefined` | un défaut se persiste | `MatchEvent.ts:124-125` |
| Firebase Hosting seul ; `.well-known` publié ; `REMPLIR` sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `nouvelle-partie/*` sous un `lazy()` | routes lazy | `App.tsx:6,10-35` |
| `docs/maquettes/` : hors git (`.gitignore:19`), hors lint | versionnement ; lint | `biome.json:18` ; `rules/biome.md` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé | ports ; thème | PLAN § 2, 6 |
| `legsForBestOf` survit ; noms français privés dans `core` ; progression garde `0` | best of N ; cœur anglais ; `pourcent()` | DS ; CONV. § 1, 9 |
| Tour du monde : moment `ancrage="sous"` | moment superposé | `TourDuMondeEcran.tsx:146` |

## Décisions ouvertes
1. Sync cloud ; i18n ; jeux restants (CLAUDE § Décisions ouvertes 3-5).
2. Lot 5b sans suivi ; `/historique/:id`, `/joueurs/:id` jamais faits ; vrai iPhone (PLAN § 0).
3. **Refonte** : 10-12 à cadrer (le 11 `regles-du-jeu` validera #25) ; 13 : `high`. Relectures
   à l'écran en attente : lots 1-7 et 9, trois lots de finition (PLAN § 0).
4. Prochain audit : R2-R4, N2, **R7**, exports de `backupSchema.ts`, erreurs de listes ;
   « sortie libre » **reporté** (PLAN § 0 n° 4).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 12 | Moyenne | Report décidé. Sortie libre (défaut de l'écran) : suggestion jusqu'à 180 ; docs : double out seul | `checkout.ts:84` ; `CLAUDE.md:252-257` | Règle muette |
| 25 | Moyenne | Nouveau. « Les règles en entier » : règles réécrites dans l'UI, X01 « à valider », entraînement non gravé | `labels.ts:925-964` ; PLAN `:1926` | Règle paraphrasée |
| 3 | Moyenne | Entraînement absent de `CLAUDE.md` ; plage 41-170 dans PLAN et code seulement | PLAN `:466-476` | Non gravé |
| 11 | Moyenne | Import : docs « validé avant écriture », code : dans la boucle ; `createdAt` sans borne haute | `ManageBackupUseCase.ts:50-73` ; `backupSchema.ts:33-38` | À trancher |
| 21 | Moyenne | Petit `text-sm text-laiton` : 3,5:1 (Test) ou 4,4:1 (charte) en clair | `AccueilEcran.tsx:163,171` ; `X01Ecran.tsx:95` ; `CHARTE:106-110` | Plancher 4,5:1 |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » | `CLAUDE.md:117-119` ; `biome.json:63-69` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` sans classe `*UseCase` » (R7) | `CONVENTIONS.md:144-149` | Non détecté |
| 16 | Basse | `usePauseAnnulation.ts` absent de l'arbre et de « 10 hooks » (en fait 11) | `CONVENTIONS.md:359,416-422` | Périmée |
| 26 | Basse | Nouveau. § 14 : « 21 ports driving », liste sans `ShuffleOrder` (22 fichiers hors `MatchSummary`) | `CONVENTIONS.md:358,382-389` | Périmée |
| 17 | Basse | PLAN § 0 « 765 tests » (lot 9 : 1091), sans lot 9 ni lots 4-7 | PLAN `:19,698-705` | Périmée |
| 19 | Basse | `Pictogramme`, `FeuilleMatch`, `BandeauMatch`, `NomJoueurFeuille`, `CasesVolee` absents de CONV. § 14 | `CONVENTIONS.md:402-404` | Périmée |
| 20 | Basse | Titres des moments (« Partie ! »…) et `Cartouche` (« Sortie demandée ») hors `labels.ts` | `x01/momentVolee.ts:20` ; `CricketEcran.tsx:69` ; `Cartouche.tsx:43` | Convention |
| 24 | Basse | Résumés Cricket / Tour du monde : tri à la main, hors `rankPlayers` (dette T2) | `ResumeCricketEcran.tsx:58` ; `ResumeTourDuMondeEcran.tsx:51` | Deux tris |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (→ `useX01.ts`) ; PLAN § 2 sans `PreviewTourDuMondeVisit` | `CLAUDE.md:115` ; PLAN `:205-233` | Périmée |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:279` ; `stats.ts:136-137` | Volée courte |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:86,594` | Incomplet |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Périmé |

## Questions et limites
- Rien de gravé sacrifié. Entraînement, #12, #11, #25 : intention non tranchée. Plancher, échelle,
  feuille, pavé, laiton unique, cartes, parcours (`light`) : **interprétation**. Le lot 9 est
  `light` (confirmé : routes, étapes, domaine intacts) mais **grave** une puce de DS : à noter.
- Planches, captures, contrastes (#21) non lus. Lot 8 en parallèle : conflits attendus
  (CONVENTIONS, charte, `labels.ts`, cet index). Non lus : PLAN § 6, DEPLOIEMENT (titres).
  Connus : `successPercent` sans « — » (`ResumeEntrainementEcran.tsx:50`) ; pas
  d'`ErrorBoundary`. Tests non relancés.

## Traçabilité
- **Reportés** (revérifiés) : 2-5, 7, 10-12, 14, 16, 17, 19-21, 24 ; lignes mises à jour.
  **#19 réduit** (la charte cite les composants, pas § 14). **Nouveaux** : #25, #26. **Retiré** : aucun.
- Retirés avant : #1, #6, #8, #9, #13, #15, #18, #22, #23 (numéros non réutilisés).
