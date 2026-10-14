# Contexte d'architecture
> **Index**, pas une source de vérité (désaccord : code récent, puis `CLAUDE.md`, puis le reste).
> **DS** = `CLAUDE.md` § Décisions structurantes. **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-14 (9e passe), scope `all`, branche `lot/pave-unifie` (de `main` à
  `9620984`, **non committé**). Lot 6b `pave-unifie` (`light`) : Dev, Test faits ; relecture à
  l'écran en attente (`docs/lots/pave-unifie/`).
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte, étude, PLAN (§ 0, § 2, fin de § 6),
  titres de DEPLOIEMENT, `orchestrate`, `sec.md`, lot, ancien index ; code vérifié.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports ; politique `/confidentialite` **datée** | en vigueur | DS |
| Profils locaux + export / import JSON ; match = `MatchEvent[]` ; saisie fléchette par fléchette **seule** | en vigueur | DS |
| « Saisie hybride » / mode rapide | **renversée** (retirée après usage, `d531a7e`) | DS ; § Notes |
| « Best of N » legs | **renversée** : « premier à N » (`legsToWin`) | DS ; glossary |
| Accent **par mode** (`accents.ts`, `--accent-*`) | **renversée** (`pave-unifie`) : laiton unique, le jeu se dit par pictogramme et titre | CHARTE § Un seul accent |
| Double out écran ≠ domaine ; « manche » ; Nouvelle partie : **route par étape** | en vigueur | DS ; glossary |
| **Nom de partie** (seul un nom tapé s'écrit) ; « Abandonnée » **dérivée, jamais écrite** | en vigueur | DS |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query n'orchestre **pas** le match ; Biome seul | en vigueur | DS |
| `PersistentStorage`, `AppInstallation` ; `id: '/'` figé ; `smoke` refuse `REMPLIR` | en vigueur | DS ; § Déploiement |
| Thème défaut **sombre** ; angle vif ; zones lecture / saisie | en vigueur | DS ; § Charte |
| **Charte seule** : plancher `craie-3`, échelle, mouvement, ni halo ni dégradé, pictogrammes, feuille commune (6a) | en vigueur | CHARTE |
| **Pavé commun `PaveSaisie`**, appui via `--texte-touche`, `laiton-clair` clair `#614a08` | en vigueur **dans l'arbre** (6b non committé) | CHARTE § Saisie |
| Refonte visuelle (13 lots) | **étude** ; 1-6a faits, **6b en cours**, 13 `high` | étude § Découpage |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **uniquement** dans `container.ts` ; capacité externe =
  **adapter derrière un port** (CLAUDE § Règle d'architecture). **UI → use cases**
  (`useServices()`) ; heure par `services.clock` (CONVENTIONS § 8). Couture `GameMode` : jamais
  d'import entre modes ; mode lu sur le **premier événement** (§ 13 ; arbre : § 14).
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust, double in / out, checkout, bogey
  numbers, legs et sets, statistiques (moyenne, First 9, % doubles).
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat.
- **Entraînement** : **non gravé** ; PLAN § 4 / § 6 lot 5b.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, valeur persistée jamais renommée, facultatif absent =
  **clé absente**, migration + test, `backupSchema` au même lot (rules/persistence).
  « Abandonnée », `legsPlayed`, nom par défaut : **dérivés**.
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; politique `/confidentialite`
  tenue vraie (CLAUDE § Décisions structurantes). Seule entrée non fiable : l'import JSON
  (rules/persistence.md). Hosting, cache, SW : docs/DEPLOIEMENT.md. Checklist :
  `.claude/agents/sec.md` § Checklist Dartpéro.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` (rules/theme-colors ; CHARTE
  § Palette). Gardes : `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`,
  `accentBoundary` (aucun accent par mode), `appuiBoundary` (couleur d'une `.touche` par
  `--texte-touche`). Français dans `labels.ts` ; routes lazy ; cibles ≥ 48 px. Étude = état,
  charte = règle **actuelle**.
- Écran de match : briques de `composants/commun/` (`FeuilleMatch`, `NomJoueurFeuille`,
  `CasesVolee`, `BandeauMatch`, `MomentCelebratif`, `PaveSaisie`) ; lignes de **hauteur égale** ;
  `.repere-lancer`, jamais `.au-lancer` ; plus de prop `mode` (`DispositionPartie`, `TableauHonneur`).
- Fakes, jamais de mocks ; `lint:fix` sur `src tests` seulement (rules/).
- Pièges : `61b60ac` (CLAUDE § Notes) ; `max-age`, `headers`, `id: '/'`, `ignore`, `REMPLIR`
  (CLAUDE § Déploiement) ; Rolldown (DEPLOIEMENT) ; `<StrictMode>`, `partie:mode` (PLAN § 6) ;
  `test.env.TZ` (CONVENTIONS § 11-12) ; pause d'annulation (`usePauseAnnulation.ts`, non gravée) ;
  barre du bas à police max **avant déploiement**.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil, horloge, mode | DS ; CONVENTIONS § 5, 7, 13, 14 |
| Écran, route, Nouvelle partie, `CartePartie` | rules/frontend-react ; CHARTE ; CONVENTIONS § 8-10, 13 |
| Écran de match, feuille, bandeau, moment, pavé | CHARTE § Écran de match, § Saisie, § Moments ; `docs/lots/feuille-commune/`, `pave-unifie/` |
| Couleur, thème, accent, texte, mouvement, pictogramme | rules/theme-colors ; CHARTE § Palette, § Un seul accent, § Typographie, § Mouvement |
| Nom de partie ; politique | DS ; glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE`) |
| Test, lint ; build, SW ; état | rules/testing, biome ; DEPLOIEMENT ; PLAN § 0, 4, 6 |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ à `archi-authority` (`orchestrate` § Niveaux) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (`name?` compris), schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé.
5. Une décision de DS (stockage, installation, politique, Nouvelle partie, double out, **nom de
   partie**, **`Services.clock`**, **« Abandonnée » dérivée**), § Règles du jeu, ou § Charte
   « ce qui ne s'y discute pas » (zéro dégradé de décor, angle vif, deux zones lecture / saisie).
   Plancher `craie-3`, échelle, mouvement, pictogrammes, feuille, pavé, laiton unique : `light`.

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée**
(écart = défaut). **Exceptions délibérées, à ne pas corriger** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` (les seules) ; `craie-decor` | couleur en dur ; plancher | `themeBoundary.test.ts:36` |
| `.chargement-balai` seul dégradé ; ombres portées | zéro dégradé / halo | CHARTE § Principe |
| `Services.devices` (dont **`persistentStorage`**, **`appInstallation`**) ; **`Services.clock`**, même instance que les use cases | UI → use cases ; `horlogeBoundary` | `container.ts:93-107,135-143` |
| **`matchStatus`** : seul import de `use-cases/` par l'UI, pure | UI → use cases | `summarize.ts:33` ; `AccueilEcran.tsx:5` |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee` ; clés `partie:*` | valeur persistée jamais renommée | `MatchEvent.ts:29-38` |
| **Double out : décoché à l'écran, `true` dans le domaine** | ne pas aligner | `x01/config.ts:68` ; `useNouvellePartie.ts:104,222` |
| **Nom par défaut jamais écrit**, clé `name` absente, jamais `undefined` | un défaut se persiste | `MatchEvent.ts:44-75,124` |
| Firebase **Hosting** seul ; **`.well-known`** publié ; **`REMPLIR`** sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `nouvelle-partie/*` sous un `lazy()` | routes lazy | `App.tsx:6,10-35` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé | ports ; thème | PLAN § 2, 6 |
| `legsForBestOf` survit ; noms français privés dans `core` ; progression garde `0` | best of N ; cœur anglais ; `pourcent()` | DS ; CONV. § 1, 9 |
| Moment du Tour du monde : `ancrage="sous"` (portrait) | moment superposé | `TourDuMondeEcran.tsx:146` |

## Décisions ouvertes
1. Sync cloud ; i18n ; jeux restants. CLAUDE § Décisions ouvertes 3-5.
2. Lot 5b sans suivi ; `/historique/:id`, `/joueurs/:id` jamais faits ; vrai iPhone ; voix. PLAN § 0.
3. **Refonte** : TQ1-TQ3 (6a) **closes**. Lot 6b : relecture à l'écran ; N1 (`appuiBoundary`
   partiel, dette, `pave-unifie/03-plan-de-test`). Lots 7-12 à cadrer ; 13 `volee-partielle` : `high`.
4. Relectures à l'écran en attente (PLAN § 0) : `nouvelle-partie-en-etapes`, `nom-de-partie`,
   `accueil-parties-recentes` ; lots 1-6b.
5. Prochain audit : R2-R4, N2, **T1, R7**, exports français de `backupSchema.ts`, erreurs de
   listes, « 1 sorties » (PLAN § 0). « Sortie libre » : **reporté** (PLAN § 0 n° 4).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 12 | Moyenne | **Report décidé.** Sortie libre (**défaut de l'écran**) : suggestion jusqu'à 180 ; docs : double out seul | `checkout.ts:84` ; `CLAUDE.md:249-254` ; `glossary.md:17-18` | Règle muette |
| 3 | Moyenne | Entraînement absent de `CLAUDE.md` ; plage 41-170 dans PLAN et code seulement | PLAN `:469` | Non gravé |
| 11 | Moyenne | Import : docs « validé avant écriture », « pas d'écrasement » ; code : validation dans la boucle d'écriture, identifiant connu écrasé ; `createdAt` sans borne haute | `ManageBackupUseCase.ts:42-73` ; `persistence.md:27` ; `backupSchema.ts:33-36` | À trancher |
| 21 | Moyenne | **Nouveau.** Petit `text-sm text-laiton` (Accueil, retours des écrans de jeu) : ≈ 3,5:1 en clair (Test) ou 4,4:1 (charte) ; non recalculé | `AccueilEcran.tsx:169` ; `X01Ecran.tsx:95` ; `CHARTE:106` | Plancher 4,5:1 |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » ; `window`, `Math.random` hors garde | `CLAUDE.md:117-119` ; `biome.json:62-68` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` sans classe `*UseCase` » (R7) | `CONVENTIONS.md:144-148` | Non détecté |
| 15 | Basse | T1 : règles courtes des cartes sans test | `CONVENTIONS.md:316-320` | Choix utilisateur |
| 16 | Basse | `usePauseAnnulation.ts` absent de l'arbre et de « 10 hooks » (en fait 11) | `CONVENTIONS.md:356,409-415` | Doc périmée |
| 17 | Basse | PLAN § 0 « 765 tests » (6b : 979) ; § 6 sans les lots 1, 2, 4, 5, 6a de la refonte | PLAN `:19,1876` | Doc périmée |
| 19 | Basse | `Pictogramme`, `FeuilleMatch`, `BandeauMatch`, `NomJoueurFeuille`, `CasesVolee` absents de CONVENTIONS § 14 et du tableau de la charte | `CONVENTIONS.md:397-400` ; `CHARTE:296-316` | Doc périmée |
| 20 | Basse | Titres des moments (« Partie ! », « Bouclé ! »…), `Cartouche` : hors `labels.ts` | `CricketEcran.tsx:69,75` ; `TourDuMondeEcran.tsx:74` ; `Cartouche.tsx:61` | Convention |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (→ `useX01.ts`) ; PLAN § 2 sans `PreviewTourDuMondeVisit` ; § 6 lot 1 « QUE `MatchStarted` » | `CLAUDE.md:115` ; PLAN `:205-233,732` | Doc périmée |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:268` ; `stats.ts:133-137` | Volée courte |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:86,576` | Incomplet |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Périmé |

## Questions et limites
- Rien de gravé sacrifié. Entraînement, #12, #11 : intention non tranchée. Accueil : non gravé.
  Plancher, échelle, feuille, pavé, laiton unique, `light` du 6b : **interprétation**.
- Planches (privées), captures, contrastes (#21) non lus ni refaits. Non committé : la charte décrit
  un arbre absent de `main`. Non relus : PLAN § 6 (sauf lots 1, 5b, derniers) ; DEPLOIEMENT hors
  titres. Connus : `successPercent` sans « — » (`ResumeEntrainementEcran.tsx:50`) ; aucun `ErrorBoundary`.

## Traçabilité
- **Reportés** (revérifiés) : 2-5, 7, 10-12, 14-17, 19, 20 ; 3 réduit (« 41 à 170 » est à PLAN
  `:469`), 19 et 20 étendus. **Nouveau** : 21. **Retirés** : 22, 23 (CONVENTIONS § 13 et
  CHARTE:63 corrigés par l'Orchestrator dans le lot 6b).
- Accents par mode : **renversés** ; ne survivent que dans le journal de PLAN § 6
  (`:648,1402-1419`).
- Retirés avant : #1, #6, #8, #9, #13, #18.
