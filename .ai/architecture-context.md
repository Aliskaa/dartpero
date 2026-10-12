# Contexte d'architecture
> **Index** : il dit où lire, pas ce que disent les sources ; règle, décision ou convention du lot
> se lit **à sa source, sur disque**. Pas une source de vérité (désaccord : code récent, puis
> `CLAUDE.md`, puis le reste). **DS** = `CLAUDE.md` § Décisions structurantes. **PLAN** =
> `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-11 (3e passe ; lot `nouvelle-partie-en-etapes` **non committé**, arbre de
  travail, branche `lot/nouvelle-partie-en-etapes`), scope `all`.
- **Lus sur disque** : `CLAUDE.md`, `CONVENTIONS` (§ 13, 14), `rules/`, `orchestrate` § Niveaux,
  `sec.md`, PLAN (§ 0, 2, 4, 6 ciblés), charte (l. 75, 374), `README.md`, l'ancien index (constats
  seulement). **Code vérifié** : `biome.json`, `App.tsx`, `container.ts`, `checkout.ts`,
  `x01/config.ts`, `x01/stats.ts`, `useNouvellePartie`, `ManageBackupUseCase`.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID | en vigueur | CLAUDE § DS, § Règle d'architecture |
| Pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports ; Hosting seul | en vigueur | CLAUDE § DS, § Déploiement |
| Politique `/confidentialite` : capacité, permission, cookie ou donnée nouvelle = texte **et date** | en vigueur | CLAUDE § DS |
| `firebase.json` (`ignore`, `headers`, `/.well-known/`) ; `smoke` refuse `REMPLIR` ; seule `firebase:deploy` | en vigueur | CLAUDE § Déploiement |
| Profils locaux + export / import JSON ; match = `MatchEvent[]`, état = projection ; saisie fléchette par fléchette **seule** | en vigueur | CLAUDE § DS |
| « Saisie hybride » / mode rapide | **renversée** : retirée après usage réel (`d531a7e`) | CLAUDE § DS, § Notes techniques |
| « Best of N » legs | **renversée** : « premier à N » (`legsToWin`) | CLAUDE § DS ; rules/glossary |
| Réglages X01 proposés à l'écran ≠ défauts du domaine (double out) ; sets exposés | en vigueur | CLAUDE § DS |
| « Manche » à l'écran, `Leg` dans le code ; clés persistées non renommées | en vigueur | CLAUDE § DS ; rules/glossary |
| Nouvelle partie en étapes : **une route par étape**, jamais un état interne | en vigueur | CLAUDE § DS ; PLAN § 6 |
| Modes X01, Tour du monde, entraînement, Cricket (Killer, Shanghai hors v1) | en vigueur | CLAUDE § DS |
| Stack figée ; Query n'orchestre **pas** le match en cours ; Biome seul ; Wake Lock | en vigueur | CLAUDE § DS |
| `PersistentStorage`, `AppInstallation` (services créés dans `main.tsx` **avant** `createRoot`) ; manifeste `id: '/'` jamais changé | en vigueur | CLAUDE § DS, § Déploiement |
| Thème clair / sombre / système, défaut **sombre** ; angle vif ; zones lecture / saisie | en vigueur | CLAUDE § DS, § Charte |
| Alfa Slab One ; paysage `DispositionPartie` ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Produit et usage
- PWA 100 % locale, sans compte ; téléphone **posé**, lu à 2-3 m : lisibilité, zéro friction.
  CLAUDE § Le projet.
### Architecture
- Dépendances vers l'intérieur ; `domain` sans import externe ni `Date` / `Math.random` ; câblage
  **uniquement** dans `container.ts` ; capacité externe nouvelle = **adapter derrière un port**.
  CLAUDE § Règle d'architecture ; CONVENTIONS § 7.
- **UI → use cases uniquement** (`useServices()`) ; jamais de règle de jeu dans l'UI. CLAUDE §
  Conventions de code ; rules/frontend-react ; CONVENTIONS § 4.
- Couture `GameMode` ; un mode n'importe jamais un autre ; le mode se lit sur le **premier
  événement**. Un mode n'a **plus d'écran de lancement**. Ce que TypeScript signale ou non à
  l'ajout d'un mode (**tout ce qui distingue le solo du groupe** lui échappe : `CHECKOUT_PRACTICE`
  en dur, `GardeOrdre`, `versOrdre`) : CONVENTIONS § 13 ; arbre : § 14.
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust (selon double out), double in / out,
  checkout, bogey numbers, legs et sets, statistiques (moyenne, First 9, % doubles).
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat
  (sens de comparaison inversé), pas de fin de tour de table.
- **Entraînement** : **non gravé** dans `CLAUDE.md` ; PLAN § 4 / § 6 lot 5b.
- Jamais d'improvisation : source, ou on demande (rules/response-policy).
### Persistance et journal
- Événements ajoutés seulement, tirage **écrit** au journal, valeur persistée jamais renommée,
  migration + test, `backupSchema` dans le même lot, `localStorage` = préférences d'appareil
  seulement. rules/persistence.
### Sécurité
- Sans réseau, compte ni secret : aucun import de `firebase` dans `src/` ; politique
  `/confidentialite` à tenir vraie. CLAUDE § DS.
- Seule entrée non fiable : l'import JSON (`backupSchema`). rules/persistence.
- Hosting, cache, SW, manifeste, `/.well-known/`, `REMPLIR` : docs/DEPLOIEMENT.
- Checklist : `.claude/agents/sec.md` § Checklist Dartpéro.
### Conventions, front, déploiement, pièges
- Fakes, jamais de mocks (rules/testing) ; rules/biome, commit ; tokens de couleur en paires
  (rules/theme-colors) ; routes lazy sauf `AccueilEcran` ; tout le français dans `labels.ts`.
- Pièges : `61b60ac` (CLAUDE § Notes techniques) ; `max-age`, `headers`, `id: '/'`, `ignore`,
  `REMPLIR` (CLAUDE § Déploiement) ; Rolldown (DEPLOIEMENT) ; `<StrictMode>` sous
  `renderWithServices` (PLAN § 6 lot `stockage-persistant`) ; `partie:mode` jamais réutilisée,
  `rangVise` du glisser (PLAN § 6 lot `nouvelle-partie-en-etapes`) ; faux `<dialog>`
  (`tests/setup.ts`).
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu (X01, Tour du monde, Cricket) |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil ; nouveau mode | CLAUDE § DS ; CONVENTIONS § 5, 7 ; § 13, 14 |
| Écran, composant, route | rules/frontend-react ; CHARTE ; CONVENTIONS § 9, 10 ; PLAN § 3 |
| Nouvelle partie (étapes) | CLAUDE § DS ; `src/ui/chemins.ts` ; CONVENTIONS § 13 ; CHARTE (barre basse) |
| Couleur, thème ; test | rules/theme-colors, CHARTE § Palette ; rules/testing, CONVENTIONS § 11 |
| Libellé ; politique (réseau, permission, stockage neufs) | rules/glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE` + date) |
| Build, déploiement, SW, manifeste | docs/DEPLOIEMENT ; CLAUDE § Déploiement |
| État, tests, pourquoi d'une décision | PLAN § 0, § 4, § 6 |

## Surfaces gravées
Un lot qui en touche une : **pas de `light`**, `high`, départ à `archi-authority` (`orchestrate`
§ Niveaux, qui fait foi ; liste condensée) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent`, schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé par PLAN §
   6 `installation-guidee` (`orchestrate` ne le nomme pas).
5. Une décision de `CLAUDE.md` § DS (stockage, installation, politique, **parcours Nouvelle partie,
   double out écran / domaine** compris), § Règles du jeu, ou § Charte « ce qui ne s'y discute
   pas ». (Entraînement : voir Constats.)

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée** :
un écart du code est alors un défaut. rules/README ; rules/response-policy.

**Exceptions délibérées, à ne pas « corriger »** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` | pas de couleur en dur | rules/theme-colors § Exceptions |
| `Services.devices` : `screenLock`, `haptics`, `preferences`, `announcer`, **`persistentStorage`**, **`appInstallation`** | UI → use cases | `container.ts:73-86` ; CONVENTIONS § 5 |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee` ; clés `partie:*` (`partie:legs`) | valeur persistée jamais renommée | `MatchEvent.ts:28-37` ; rules/persistence |
| **Double out : décoché à l'écran, `true` dans le domaine** (`X01Config.create` reçoit toujours `doubleOut`) | ne pas aligner l'un sur l'autre | CLAUDE § DS ; `x01/config.ts:68` ; `useNouvellePartie.ts:91,198` |
| Firebase **Hosting** seul | « pas de Firebase » | CLAUDE § DS |
| **`.well-known`** seule entrée cachée publiée (`assetlinks.json` = `[]` jusqu'au lot 4) | `ignore` des entrées à point | CLAUDE § Déploiement ; DEPLOIEMENT |
| **Garde `REMPLIR` sans contournement**, aucun `predeploy` | — | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `nouvelle-partie/*` derrière un seul `lazy()` | routes lazy | `App.tsx:6,28-34` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé | ports ; un seul écrivain de `data-theme` | PLAN § 2, § 6 |
| `legsForBestOf` survit ; variables françaises locales dans `core` ; progression garde son `0` | best of N ; cœur anglais ; `pourcent()` | CLAUDE § DS ; CONVENTIONS § 1, 9 |

**Hors périmètre** : sync, compte, réseau ; Killer, Shanghai, Around the Clock ; i18n.

## Décisions ouvertes
1. Sync cloud / classement (lot 6, un adapter) ; export JSON = palliatif. CLAUDE § Décisions ouvertes n° 4.
2. i18n : FR seul (n° 5). Jeux restants : Around the Clock, Killer, Shanghai (n° 3).
3. Lot 5b : un seul exercice, pas de suivi de progression. PLAN § 0 n° 2.
4. `/historique/:id`, `/joueurs/:id` jamais faits (PLAN § 0 n° 3) ; vrai iPhone, `persist()`,
   installation sur appareil réel (R1, R2, R5, R6) : PLAN § 0.
5. Voix : `SpeechAnnouncer` ignore `localService` ; lot non planifié. PLAN § 6.
6. Lot 4 `play-store-twa` : remplit `assetlinks.json`, relit la politique. DEPLOIEMENT.
7. Lot `nouvelle-partie-en-etapes` : relecture à l'écran, glisser / retour matériel Android,
   `<dialog>` iPhone, captures du README. PLAN § 0.
8. Lot « sortie libre » : **reporté** par l'utilisateur, sans renvoi dans `CLAUDE.md` ; règles à
   écrire avec lui. PLAN § 0 n° 4 (constat 12).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 12 | Moyenne | **Report décidé par l'utilisateur** (PLAN § 0 n° 4). Sans double out (**défaut de l'écran**), le code suggère un checkout jusqu'à 180 ; `CLAUDE.md` § Checkouts et glossaire ne décrivent que le double out ; bogeys sans double out non établis | `services/checkout.ts:84` vs `CLAUDE.md:237-242` ; `glossary.md:17-18` ; PLAN `:52-57,1699-1701` | Règle gravée muette sur le chemin par défaut |
| 2 | Moyenne | `noRestrictedImports` « bannit les API navigateur » : 7 paquets ; le garde ne lit que les imports | `CLAUDE.md:117-119` ; `biome.json:50-61` ; `hexagonalBoundary.test.ts:40-57` | `Date`, API navigateur : relecture |
| 3 | Moyenne | Règles de l'entraînement absentes de `CLAUDE.md` ; « 41 à 170 » non confirmée | `PROJECT_PLAN.md:413-425` | Hors surface gravée 5 à la lettre |
| 11 | Moyenne | Import : persistence « validé entièrement avant la moindre écriture », sec « pas d'écrasement silencieux » ; le code valide **dans la boucle d'écriture**, écrase un même identifiant sans confirmation | `ManageBackupUseCase.ts:50-73` ; `sec.md:64-65` ; PLAN `:1663` | À trancher (politique : « remplacés », `labels.ts:306`) |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (devenu `useX01.ts`) ; PLAN § 2 oublie `PreviewTourDuMondeVisit` ; PLAN § 6 lot 1 « QUE `MatchStarted` et `VisitRecorded` » périmé | `CLAUDE.md:115` ; `PROJECT_PLAN.md:175-181,662` | Doc périmée |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:256` ; `x01/stats.ts:14,133-137` | Équivalent sauf volée courte |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:75,374` | Charte incomplète |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `skills/audit/SKILL.md:44` | Défaut disparu cherché |

## Questions et limites
- Plafond mesuré en LF ; rien de gravé sacrifié.
- Entraînement, sortie libre (#12), import (#11) : intention non tranchée.
- Non relus : PLAN § 6 hors lots 1, 5b, Play Store, `nouvelle-partie-en-etapes` ; `docs/lots/*` ;
  DEPLOIEMENT, texte de la politique, charte hors l. 75, 374.
- Relevés par PLAN `:1699-1701`, **non revérifiés** : « Manche N » numérotée sur la partie, pas
  dans le set ; résumé X01 sans sets ; boutons retour de 44 px (plancher 48).
- Connus (revérifiés) : `successPercent` sans garde « — » (`ApercuPartie.tsx:108`,
  `ResumeEntrainementEcran.tsx:48`), aucun `ErrorBoundary`. Non revérifié : `Cible`.

## Traçabilité
- **Reportés** (revérifiés, lignes mises à jour) : 2-5, 7, 10, 11, 12.
- **Retirés** (faux à la source) : #6 « README 318 tests » (`README.md:142,270` dit 517, comme
  PLAN `:19`) ; #13 « 8 hooks » ; avant : #1, #8, #9.
- **Corrigé** : piège `<StrictMode>` = PLAN § 6 lot `stockage-persistant` (`:1566-1569`), pas
  `nouvelle-partie-en-etapes`.
- Régénérer : `/refresh-architecture`.
