# Contexte d'architecture
> **Index** : il dit où lire ; tout se lit **à sa source, sur disque**. Pas une source de vérité
> (désaccord : code récent, puis `CLAUDE.md`, puis le reste).
> **DS** = `CLAUDE.md` § Décisions structurantes. **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-14 (8e passe), scope `all`, branche `lot/feuille-commune` (de `main` à
  `bcb4369`, **non committé**). Lot 6a `feuille-commune` (`light`) : Dev, Test faits ; relecture à
  l'écran en attente (`docs/lots/feuille-commune/`).
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte, étude, PLAN (§ 0, fin de § 6), titres de
  DEPLOIEMENT, `orchestrate`, `sec.md`, dossier du lot, ancien index ; code vérifié.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports ; Hosting seul ; politique `/confidentialite` **datée** | en vigueur | DS |
| Profils locaux + export / import JSON ; match = `MatchEvent[]` ; saisie fléchette par fléchette **seule** | en vigueur | DS |
| « Saisie hybride » / mode rapide | **renversée** (retirée après usage, `d531a7e`) | DS ; § Notes |
| « Best of N » legs | **renversée** : « premier à N » (`legsToWin`) | DS ; glossary |
| Réglages X01 proposés ≠ défauts du domaine (double out) ; « manche » ; Nouvelle partie : **route par étape** | en vigueur | DS ; glossary |
| **Nom de partie** (seul un nom tapé s'écrit) ; « Abandonnée » **dérivée, jamais écrite** (`matchStatus`) | en vigueur | DS |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query n'orchestre **pas** le match ; Biome seul | en vigueur | DS |
| `PersistentStorage`, `AppInstallation` ; `id: '/'` figé ; `smoke` refuse `REMPLIR` | en vigueur | DS ; CLAUDE § Déploiement |
| Thème défaut **sombre** ; angle vif ; zones lecture / saisie | en vigueur | DS ; § Charte |
| **Charte seule** : plancher `craie-3`, échelle de texte, mouvement, ni halo ni dégradé, pictogrammes, écran X01 | en vigueur | CHARTE |
| **Feuille commune** aux trois jeux : `.repere-lancer` unique (`.au-lancer` retiré), bandeau, moment d'une rangée | en vigueur **dans l'arbre** (6a non committé) | CHARTE § Écran de match |
| Refonte visuelle (13 lots) | **étude** ; 1-5 faits, **6a en cours**, 6b et 7-12 à cadrer, 13 `high` | étude § Découpage |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **uniquement** dans `container.ts` ; capacité externe =
  **adapter derrière un port** (CLAUDE § Règle d'architecture). **UI → use cases**
  (`useServices()`) ; heure par `services.clock` (CONVENTIONS § 8).
- Couture `GameMode` : un mode n'importe jamais un autre ; mode lu sur le **premier événement**
  (CONVENTIONS § 13 ; arbre : § 14).
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
  § Palette). Gardes : `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`. Français
  dans `labels.ts` ; routes lazy ; cibles ≥ 48 px. Refonte : étude = état, charte = règle **actuelle**.
- Écran de match : briques de `composants/commun/` (`FeuilleMatch`, `NomJoueurFeuille`,
  `CasesVolee`, `BandeauMatch`, `MomentCelebratif`) ; lignes de **hauteur égale** ;
  `.repere-lancer`, jamais `.au-lancer` (CHARTE § Écran de match).
- Fakes, jamais de mocks ; `lint:fix` sur `src tests` seulement ; un seul `QueryClient` pour
  prouver une invalidation (rules/testing, biome).
- Pièges : `61b60ac` (CLAUDE § Notes) ; `max-age`, `headers`, `id: '/'`, `ignore`, `REMPLIR`
  (CLAUDE § Déploiement) ; Rolldown (DEPLOIEMENT) ; `<StrictMode>`, `partie:mode` (PLAN § 6) ;
  `test.env.TZ` (CONVENTIONS § 11-12) ; barre du bas à police max **avant déploiement**.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil, horloge, mode | DS ; CONVENTIONS § 5, 7, 13, 14 |
| Écran, route, Nouvelle partie, `CartePartie` | rules/frontend-react ; CHARTE ; CONVENTIONS § 8-10, 13 |
| Écran de match, feuille, bandeau, moment, pavé | CHARTE § Écran de match, § Moments ; `docs/lots/feuille-commune/` |
| Couleur, thème, texte, mouvement, pictogramme | rules/theme-colors ; CHARTE § Palette, § Typographie, § Mouvement, § Identité ; gardes `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary` |
| Annulation (pause 1 s, non gravée) | `usePauseAnnulation.ts` ; `docs/lots/annuler-double-tap/` |
| Nom de partie ; politique | DS ; glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE`) |
| Test, lint ; build, SW ; état | rules/testing, biome ; DEPLOIEMENT ; PLAN § 0, 4, 6 |

## Surfaces gravées
Un lot qui en touche une : **pas de `light`**, `high`, départ à `archi-authority` (`orchestrate`
§ Niveaux) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (`name?` compris), schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé.
5. Une décision de DS (stockage, installation, politique, Nouvelle partie, double out, **nom de
   partie**, **`Services.clock`**, **« Abandonnée » dérivée**), § Règles du jeu, ou § Charte
   « ce qui ne s'y discute pas » (zéro dégradé de décor, angle vif, deux zones lecture / saisie).
   Plancher `craie-3`, échelle, mouvement, pictogrammes, feuille commune : non listés (`light`).

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée**
(écart = défaut). **Exceptions délibérées, à ne pas corriger** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` (les seules) ; `craie-decor` | couleur en dur ; plancher | `themeBoundary.test.ts:36` ; CHARTE § Palette |
| `.chargement-balai` seul dégradé ; ombres portées gardées | zéro dégradé / halo | CHARTE § Principe |
| `Services.devices` (dont **`persistentStorage`**, **`appInstallation`**) ; **`Services.clock`**, même instance que les use cases | UI → use cases ; `horlogeBoundary` | `container.ts:96-107,135-143` |
| **`matchStatus`** : seul import de `use-cases/` par l'UI, pure | UI → use cases | `summarize.ts:33` ; `AccueilEcran.tsx:5` |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee` ; clés `partie:*` | valeur persistée jamais renommée | `MatchEvent.ts:30-38` |
| **Double out : décoché à l'écran, `true` dans le domaine** | ne pas aligner | `x01/config.ts:68` ; `useNouvellePartie.ts:222,296` |
| **Nom par défaut jamais écrit**, clé `name` absente, jamais `undefined` | un défaut se persiste | `MatchEvent.ts:44-75` |
| Firebase **Hosting** seul ; **`.well-known`** publié ; **`REMPLIR`** sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `nouvelle-partie/*` sous un `lazy()` | routes lazy | `App.tsx:6,28-31` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé | ports ; thème | PLAN § 2, 6 |
| `legsForBestOf` survit ; locales françaises dans `core` ; progression garde `0` | best of N ; cœur anglais ; `pourcent()` | DS ; CONVENTIONS § 1, 9 |
| Moment du Tour du monde : `ancrage="sous"` (portrait) | moment superposé | CHARTE § Moments |

## Décisions ouvertes
1. Sync cloud ; i18n ; jeux restants. CLAUDE § Décisions ouvertes 3-5.
2. Lot 5b sans suivi ; `/historique/:id`, `/joueurs/:id` jamais faits ; vrai iPhone ; voix. PLAN § 0.
3. **Refonte** : lot 6a, à l'utilisateur : TQ1 (moment du Tour du monde en paysage à 4 joueurs),
   TQ2 (noms du Cricket à 15 px), TQ3 (marques en paysage). 6b `pave-unifie` à cadrer ; lot 13
   `volee-partielle` : `high`. Questions du lot 5 : tranchées (charte).
4. Relectures à l'écran en attente (PLAN § 0) : `nouvelle-partie-en-etapes`, `nom-de-partie`,
   `accueil-parties-recentes` ; lots 1-6a de la refonte (`03-plan-de-test.md`).
5. Prochain audit : R2, R3, R4, N2, **T1, R7**, exports français de `backupSchema.ts`, erreurs
   de listes, « 1 sorties » (PLAN § 0). Lot « sortie libre » : **reporté** (PLAN § 0 n° 4).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 12 | Moyenne | **Report décidé.** Sans double out (**défaut de l'écran**), suggestion jusqu'à 180 ; `CLAUDE.md`, glossaire : double out seul | `checkout.ts:84` ; `CLAUDE.md:249-254` ; `glossary.md:15,18` ; PLAN `:81-86` | Règle muette |
| 3 | Moyenne | Règles de l'entraînement absentes de `CLAUDE.md` ; « 41 à 170 » absente de PLAN | PLAN `:466-493` | Non gravé |
| 11 | Moyenne | Import : règles « validé avant écriture », « pas d'écrasement silencieux » ; code : validation **dans la boucle d'écriture**, écrase un identifiant connu ; `createdAt` sans borne haute | `ManageBackupUseCase.ts:42-73` ; `persistence.md:28` ; `sec.md:62-65` ; `backupSchema.ts:33-36` | À trancher |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » ; `window`, `Math.random` sans garde | `CLAUDE.md:117-119` ; `biome.json:62-68` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` sans classe `*UseCase` » (R7) | `CONVENTIONS.md:144-148` ; `hexagonalBoundary.test.ts:59` | Non détecté |
| 15 | Basse | T1 : texte des règles courtes des cartes sans test | `CONVENTIONS.md:319-320` | Choix utilisateur |
| 16 | Basse | `usePauseAnnulation.ts` absent de l'arbre et de « 10 hooks » (11 + `tourDeTable`) | `CONVENTIONS.md:356,409-415` | Doc périmée |
| 17 | Basse | PLAN § 0 « 765 tests » ; § 6 : lot 3 de la refonte seul, pas les lots 1, 2, 4, 5 | PLAN `:19,1900` | Doc périmée |
| 19 | Basse | `Pictogramme` et, **nouveau**, `FeuilleMatch`, `BandeauMatch`, `NomJoueurFeuille`, `CasesVolee` absents de CONVENTIONS § 14 et du tableau des composants de la charte | `CONVENTIONS.md:359-423` ; `CHARTE:291-310` | Doc périmée |
| 20 | Basse | **Nouveau.** Intitulés des moments (« Partie ! », « Fermée ! »…), `Cartouche` « Volée en cours » : en dur, hors `labels.ts` | `CricketEcran.tsx:69,75` ; `TourDuMondeEcran.tsx:74` ; `Cartouche.tsx:61` | Convention |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (→ `useX01.ts`) ; PLAN § 2 sans `PreviewTourDuMondeVisit` ; PLAN § 6 lot 1 « QUE `MatchStarted` » | `CLAUDE.md:115` ; PLAN `:205-241,732` | Doc périmée |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:268` ; `stats.ts:133-137` | Volée courte |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:86,546` | Incomplète |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Disparu |

## Questions et limites
- Rien de gravé sacrifié. Entraînement, #12, #11 : intention non tranchée. Accueil : **non gravé**.
  Plancher `craie-3`, échelle, feuille commune : **interprétation**.
- Lot 6a `light` : UI seule — **interprétation** (un format le ferait `high`). Planche (privée) et
  captures non lues. Non committé : la charte décrit un arbre absent de `main`.
- Charte confrontée à `index.css` (`.repere-lancer`) ; contrastes, mesures non refaits.
- Non relus : PLAN § 6 (sauf lots 1, 5b, derniers) ; DEPLOIEMENT hors titres.
- Connus : `successPercent` sans « — » (`ResumeEntrainementEcran.tsx:50`) ; aucun `ErrorBoundary`.

## Traçabilité
- **Reportés** (revérifiés) : 2, 3, 4, 5, 7, 10, 11, 12, 14, 15, 16, 17, 19 (étendu). **Nouveau** :
  20. **Retiré** : aucun ; preuves de 7, 11, 12, 15 mises à jour.
- Brief et lot (D5) : l'ancien index citait `.au-lancer` ; relu, **aucune occurrence**. PLAN § 6
  et `docs/lots/*` la citent comme **historique**.
- Antérieurs retirés : #1, #6, #8, #9, #13, #18 (`theme-colors.md:16`).
