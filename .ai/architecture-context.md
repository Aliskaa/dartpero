# Contexte d'architecture
> **Index** : il dit où lire ; règle, décision ou convention se lit **à sa source, sur disque**.
> Pas une source de vérité (désaccord : code récent, puis `CLAUDE.md`, puis le reste).
> **DS** = `CLAUDE.md` § Décisions structurantes. **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-13 (4e passe ; lot `nom-de-partie` **non committé**, branche
  `lot/nom-de-partie`), scope `all`.
- **Lus sur disque** : `CLAUDE.md`, `CONVENTIONS`, `rules/` (persistence, testing, frontend-react,
  glossary), `orchestrate` § Niveaux, `sec.md`, PLAN (§ 0, 2, 4, 6 ciblés), charte (titres, l. 75,
  382), `README.md`, l'ancien index (constats). **Code** : `biome.json`, `container.ts`,
  `MatchEvent.ts`, `vite.config.ts`, `checkout.ts`, `x01/`, `backupSchema`, `ManageBackupUseCase`,
  gardes d'architecture.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports ; Hosting seul ; politique `/confidentialite` tenue à jour **et datée** | en vigueur | CLAUDE § DS, § Règle d'architecture |
| `firebase.json` ; `smoke` refuse `REMPLIR` ; seule `firebase:deploy` | en vigueur | CLAUDE § Déploiement |
| Profils locaux + export / import JSON ; match = `MatchEvent[]` (état = projection) ; saisie fléchette par fléchette **seule** | en vigueur | CLAUDE § DS |
| « Saisie hybride » / mode rapide | **renversée** : retirée après usage réel (`d531a7e`) | CLAUDE § DS, § Notes techniques |
| « Best of N » legs | **renversée** : « premier à N » (`legsToWin`) | CLAUDE § DS ; glossary |
| Réglages X01 proposés ≠ défauts du domaine (double out) ; « manche » à l'écran, `Leg` dans le code | en vigueur | CLAUDE § DS ; glossary |
| Nouvelle partie en étapes : **une route par étape**, jamais un état interne | en vigueur | CLAUDE § DS ; PLAN § 6 |
| **Nom de partie** : seul un nom tapé s'écrit (`name?` d'ouverture) ; défaut recalculé, jamais écrit | en vigueur | CLAUDE § DS ; PLAN § 6 `nom-de-partie` |
| Modes X01, Tour du monde, entraînement, Cricket (Killer, Shanghai hors v1) | en vigueur | CLAUDE § DS |
| Stack figée ; Query n'orchestre **pas** le match en cours ; Biome seul ; Wake Lock | en vigueur | CLAUDE § DS |
| `PersistentStorage`, `AppInstallation` (services créés dans `main.tsx` **avant** `createRoot`) ; `id: '/'` jamais changé | en vigueur | CLAUDE § DS, § Déploiement |
| Thème défaut **sombre** ; angle vif ; zones lecture / saisie | en vigueur | CLAUDE § DS, § Charte |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Produit et usage
- PWA 100 % locale, sans compte ; téléphone **posé**, lu à 2-3 m. CLAUDE § Le projet.
### Architecture
- Dépendances vers l'intérieur ; `domain` sans import externe ni `Date` / `Math.random` ; câblage
  **uniquement** dans `container.ts` ; capacité externe nouvelle = **adapter derrière un port**.
  CLAUDE § Règle d'architecture ; CONVENTIONS § 7.
- **UI → use cases uniquement** (`useServices()`) ; **l'heure par `services.clock`**, jamais
  `Date.now()`. CLAUDE § Conventions de code, § DS ; rules/frontend-react.
- Couture `GameMode` : un mode n'importe jamais un autre, le mode se lit sur le **premier
  événement**, plus d'écran de lancement. Ce que TypeScript signale ou non à l'ajout d'un mode ou
  du `name?` d'ouverture : CONVENTIONS § 13 ; arbre : § 14.
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust, double in / out, checkout, bogey
  numbers, legs et sets, statistiques (moyenne, First 9, % doubles).
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat,
  pas de fin de tour de table.
- **Entraînement** : **non gravé** dans `CLAUDE.md` ; PLAN § 4 / § 6 lot 5b.
- Jamais d'improvisation : source, ou on demande (rules/response-policy).
### Persistance et journal
- Événements ajoutés seulement, tirage **écrit**, valeur persistée jamais renommée, facultatif
  absent = **clé absente**, migration + test, `backupSchema` dans le même lot. rules/persistence.
### Sécurité
- Sans réseau, compte ni secret : aucun import de `firebase` dans `src/` ; politique
  `/confidentialite` à tenir vraie. CLAUDE § Décisions structurantes.
- Seule entrée non fiable : l'import JSON (`backupSchema`). rules/persistence.md.
- Hosting, cache, SW, manifeste, `/.well-known/` : docs/DEPLOIEMENT.md.
- Checklist : `.claude/agents/sec.md` § Checklist Dartpéro.
### Conventions, front, déploiement, pièges
- Fakes, jamais de mocks (rules/testing) ; rules/biome, commit ; tokens de couleur en paires
  (rules/theme-colors) ; routes lazy ; tout le français dans `labels.ts`.
- Pièges : `61b60ac` (CLAUDE § Notes techniques) ; `max-age`, `headers`, `id: '/'`, `ignore`,
  `REMPLIR` (CLAUDE § Déploiement) ; Rolldown (DEPLOIEMENT) ; `<StrictMode>`, `partie:mode`,
  `rangVise`, `sansCommentaires` (PLAN § 6) ; faux `<dialog>` ;
  **`test.env.TZ`** : changement d'heure vert à vide sous UTC (CONVENTIONS § 11-12).
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu (X01, Tour du monde, Cricket) |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil ; horloge ; nouveau mode | CLAUDE § DS ; CONVENTIONS § 5, 7 ; § 13, 14 |
| Écran, composant, route ; Nouvelle partie | rules/frontend-react ; CHARTE ; CONVENTIONS § 9, 10, 13 ; `src/ui/chemins.ts` ; PLAN § 3 |
| Nom de partie | CLAUDE § DS ; glossary ; CONVENTIONS § 11, 13 ; CHARTE § Composants, Écran de match ; PLAN § 2, 6 |
| Couleur, thème ; test | rules/theme-colors, CHARTE § Palette ; rules/testing, CONVENTIONS § 11-12 |
| Libellé ; politique (réseau, permission, stockage neufs) | glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE`, date) |
| Build, déploiement, SW, manifeste | docs/DEPLOIEMENT ; CLAUDE § Déploiement |
| État, pourquoi d'une décision | PLAN § 0, 4, 6 |

## Surfaces gravées
Un lot qui en touche une : **pas de `light`**, `high`, départ à `archi-authority` (`orchestrate`
§ Niveaux fait foi ; liste condensée) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (`name?` compris), schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé (PLAN § 6
   `installation-guidee`), `orchestrate` ne le nomme pas.
5. Une décision de `CLAUDE.md` § DS (stockage, installation, politique, parcours Nouvelle partie,
   double out, **nom de partie**, **`Services.clock`**), § Règles du jeu, ou § Charte « ce qui ne
   s'y discute pas ». (Entraînement : voir Constats.)

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée** :
un écart du code est alors un défaut. rules/README.

**Exceptions délibérées, à ne pas « corriger »** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` | pas de couleur en dur | rules/theme-colors § Exceptions |
| `Services.devices` : `screenLock`, `haptics`, `preferences`, `announcer`, **`persistentStorage`**, **`appInstallation`** | UI → use cases | `container.ts:75-88,102-107` ; CONVENTIONS § 5 |
| **`Services.clock`** : même instance que les use cases, lue par l'UI | UI → use cases ; garde `horlogeBoundary` | `container.ts:136-143` ; CLAUDE § DS ; CONVENTIONS § 7 |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee` ; clés `partie:*` | valeur persistée jamais renommée | `MatchEvent.ts:27-37` |
| **Double out : décoché à l'écran, `true` dans le domaine** (`X01Config.create` reçoit toujours `doubleOut`) | ne pas aligner | CLAUDE § DS ; `x01/config.ts:68` ; `useNouvellePartie.ts:221,293` |
| **Nom par défaut jamais écrit** (anciennes parties jamais « complétées »), clé `name` absente, jamais `undefined` | un défaut se persiste | CLAUDE § DS ; `MatchEvent.ts:121-150` |
| Firebase **Hosting** seul ; **`.well-known`** seule entrée cachée publiée (`assetlinks.json` = `[]`) | « pas de Firebase » ; `ignore` | CLAUDE § DS, § Déploiement |
| **Garde `REMPLIR` sans contournement**, aucun `predeploy` | — | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `nouvelle-partie/*` sous un seul `lazy()` | routes lazy | `App.tsx:6,10,28-31` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé | ports ; `data-theme` | PLAN § 2, 6 |
| `legsForBestOf` survit ; variables locales françaises dans `core` ; progression garde son `0` | best of N ; cœur anglais ; `pourcent()` | CLAUDE § DS ; CONVENTIONS § 1, 9 |

## Décisions ouvertes
1. Sync cloud / classement (lot 6, un adapter) ; export JSON = palliatif. CLAUDE § Décisions ouvertes 4.
2. i18n : FR seul (n° 5). Jeux restants : Around the Clock, Killer, Shanghai (n° 3).
3. Lot 5b : un seul exercice, pas de suivi de progression. PLAN § 0 n° 2.
4. `/historique/:id`, `/joueurs/:id` jamais faits (PLAN § 0 n° 3) ; vrai iPhone, `persist()`,
   installation sur appareil réel (R1, R2, R5, R6) : PLAN § 0.
5. Voix : `SpeechAnnouncer` ignore `localService` (PLAN § 6) ; lot 4 `play-store-twa` : remplit
   `assetlinks.json`, relit la politique (DEPLOIEMENT).
6. Lot `nouvelle-partie-en-etapes` : relecture à l'écran, glisser / retour Android, `<dialog>`
   iPhone, captures du README. PLAN § 0.
7. Lot `nom-de-partie` (PLAN § 0, 6) : relecture à l'écran de `03-plan-de-test.md` ; **T1** iPhone
   (`maxlength` vs `MatchName.of`) ; **D5** ligne du nom dans le bandeau ; **constat 6** champ
   prérempli ; captures du README. Prochain audit : R2, R3, R4, N2 (laissés par l'utilisateur).
8. Lot « sortie libre » : **reporté**, sans renvoi dans `CLAUDE.md` ; règles à écrire avec
   l'utilisateur. PLAN § 0 n° 4 (constat 12).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 12 | Moyenne | **Report décidé par l'utilisateur.** Sans double out (**défaut de l'écran**), le code suggère jusqu'à 180 ; `CLAUDE.md` § Checkouts et glossaire ne décrivent que le double out | `checkout.ts:84` vs `CLAUDE.md:244-249` ; `glossary.md:17-18` ; PLAN `:66-71` | Règle muette sur le chemin par défaut |
| 3 | Moyenne | Règles de l'entraînement absentes de `CLAUDE.md` ; « 41 à 170 » non confirmée | PLAN `:441-459` | Hors surface gravée 5 à la lettre |
| 11 | Moyenne | Import : persistence « validé entièrement avant la moindre écriture », sec « pas d'écrasement silencieux » ; le code valide **dans la boucle d'écriture**, écrase un même identifiant sans confirmation. À joindre : `createdAt` importé sans borne haute (PLAN § 0) | `ManageBackupUseCase.ts:42-73` ; `persistence.md:27-28` ; `sec.md:62-65` ; PLAN `:883` | À trancher (politique : « remplacés », `labels.ts:306`) |
| 2 | Basse | **Partiellement couvert** : `Date` / heure gardés (`core`, `ui`, racine) par `horlogeBoundary`. Reste : `noRestrictedImports` « bannit les API navigateur » = 7 paquets, `hexagonalBoundary` lit les imports seulement ; `window`, `navigator`, `Math.random` du cœur sans garde (0 occurrence) | `CLAUDE.md:117-119` ; `biome.json:50-61` ; `hexagonalBoundary.test.ts:40-57` | Globaux du cœur : relecture |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (devenu `useX01.ts`) ; PLAN § 2 oublie `PreviewTourDuMondeVisit` ; PLAN § 6 lot 1 « QUE `MatchStarted` et `VisitRecorded` » périmé | `CLAUDE.md:115` ; PLAN `:194-201,698` | Doc périmée |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:263` ; `stats.ts:14,133-137` | Équivalent sauf volée courte |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:75,382` | Charte incomplète |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Défaut disparu |

## Questions et limites
- Rien de gravé sacrifié. #2 re-coté Moyenne → Basse par cet index (garde `Date` livrée) :
  l'Orchestrator confirme. Entraînement, #12, #11 : intention non tranchée.
- Non relus : PLAN § 6 hors lots 1, 5b, Play Store, deux derniers ; `docs/lots/*` ; DEPLOIEMENT,
  charte hors titres ; tests `nomDePartie*`.
- PLAN `:1735-1737`, **non revérifiés** : « Manche N » numérotée sur la partie ; résumé X01 sans
  sets ; boutons retour de 44 px ; `npm audit` : 8 vulnérabilités de dev.
- Connus (revérifiés) : `successPercent` sans garde « — » (`ApercuPartie.tsx:108`,
  `ResumeEntrainementEcran.tsx:50`) ; aucun `ErrorBoundary`.

## Traçabilité
- **Reportés** (revérifiés, lignes à jour) : 2 (réduit), 3, 4, 5, 7, 10, 11, 12. **Retirés** :
  aucun cette passe ; avant : #6 (README dit 689, comme PLAN :19), #13, #1, #8, #9.
- Régénérer : `/refresh-architecture`.
