# Contexte d'architecture
> **Index** : il dit où lire, pas ce que disent les sources ; règle, décision ou convention du lot
> se lit **à sa source, sur disque**. Pas une source de vérité (désaccord : code récent, puis
> `CLAUDE.md`, puis le reste). **DS** = `CLAUDE.md` § Décisions structurantes. **PLAN** =
> `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-10 (lot `confidentialite-assetlinks` **non committé**), scope `all`.
- **Lus sur disque** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte, `DEPLOIEMENT`, PLAN (§ 0, 2-6
  ciblés), `orchestrate` § Niveaux, `agents/sec.md`, l'ancien index (constats seulement).
  **Code vérifié** (ponctuel) : `biome.json`, garde hexagonal, `hooks/`, `stats.ts`, `App.tsx`,
  `container.ts`, `MatchEvent.ts`, `x01/config.ts`, `NouvellePartieEcran`, `ManageBackupUseCase`.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal (Ports & Adapters) + SOLID | en vigueur | CLAUDE § DS, § Règle d'architecture |
| Pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports ; Hosting seul (zéro SDK) | en vigueur | CLAUDE § DS, § Déploiement |
| Politique `/confidentialite` : réseau, permission, cookie ou donnée stockée nouvelle = texte **et date** à jour ; seul le réseau a un fil-piège (`reseauBoundary`) | en vigueur | CLAUDE § DS ; DEPLOIEMENT § Confidentialité |
| `firebase.json` : `ignore` sans `!` (extglobs), `headers` assetlinks après le fourre-tout, `/.well-known/` hors repli et précache ; `smoke` refuse `REMPLIR` ; seule commande `firebase:deploy` | en vigueur | CLAUDE § Déploiement ; DEPLOIEMENT § Mettre en ligne, § Confidentialité |
| Profils locaux + export / import JSON ; match = `MatchEvent[]`, état = projection ; saisie fléchette par fléchette **seule** | en vigueur | CLAUDE § DS |
| « Saisie hybride » / mode rapide | **renversée** : retirée après usage réel, remplacée par la saisie fléchette par fléchette seule (`d531a7e`) | CLAUDE § DS, § Notes techniques |
| « Best of N » legs | **renversée** : remplacée par « premier à N legs » (`legsToWin`) | CLAUDE § DS ; rules/glossary |
| Modes X01, Tour du monde, entraînement, Cricket (Killer, Shanghai hors v1) ; défauts X01 | en vigueur | CLAUDE § DS |
| Stack figée ; Query n'orchestre **pas** le match en cours ; Biome seul ; Wake Lock | en vigueur | CLAUDE § DS ; CONVENTIONS § 5, 10 |
| `PersistentStorage` (« protégé » ≠ sauvegarde) ; `AppInstallation`, services créés dans `main.tsx` **avant** `createRoot` ; manifeste `id: '/'` jamais changé | en vigueur | CLAUDE § DS, § Déploiement ; DEPLOIEMENT § Stockage, § Installation |
| Thème clair / sombre / système, défaut **sombre** ; charte : angle vif, zones lecture / saisie | en vigueur | CLAUDE § DS, § Charte ; CHARTE § Les deux thèmes, § Les trois planchers |
| Alfa Slab One ; paysage `DispositionPartie` ; Cricket | tranchées (lots 3 bis, 5c) | CLAUDE § Décisions ouvertes n° 1-3 |

## Guidage opérationnel
### Produit et usage
- PWA de fléchettes, 100 % local, hors ligne, sans compte ; téléphone **posé**, lu à 2-3 m :
  lisibilité et zéro friction priment. CLAUDE § Le projet.
### Architecture
- Dépendances vers l'intérieur ; `domain` sans import externe ni `Date` / `Math.random` (ports) ;
  câblage **uniquement** dans `container.ts` ; capacité externe nouvelle = **adapter derrière un
  port**. CLAUDE § Règle d'architecture ; CONVENTIONS § 7.
- **UI → use cases uniquement** (`useServices()`) ; jamais de règle de jeu dans l'UI. CLAUDE §
  Conventions de code ; rules/frontend-react ; CONVENTIONS § 4.
- Couture `GameMode` ; un mode n'importe jamais un autre ; le mode se lit sur le **premier
  événement** du journal. CONVENTIONS § 13 ; arbre : § 14 ; VO, ports, adapters : § 1, 2, 5, 6.
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust, double in / out, checkout, bogey
  numbers, legs et sets, statistiques (moyenne, First 9, % doubles).
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
- Pas de document dédié. Sans réseau, compte ni secret : aucun import de `firebase` dans `src/`.
  CLAUDE § DS (politique `/confidentialite` comprise, à tenir vraie).
- Seule entrée non fiable : l'import JSON (`backupSchema`). rules/persistence.
- Hosting, cache, `ignore`, service worker, manifeste, `/.well-known/`, garde `REMPLIR`, `sharp` :
  docs/DEPLOIEMENT (§ Confidentialité et Digital Asset Links).
- Checklist du lot : `.claude/agents/sec.md` § Checklist Dartpéro.
### Conventions, front, déploiement, pièges
- Fakes, jamais de mocks (rules/testing) ; rules/biome ; rules/commit ; couleurs : tokens en paires
  de rôle (rules/theme-colors) ; routes lazy sauf `AccueilEcran` (rules/frontend-react).
- Pièges : `61b60ac` (CLAUDE § Notes techniques) ; `max-age`, `headers` (dernière règle gagnante),
  `id: '/'`, `ignore` sans `!`, `REMPLIR` (CLAUDE § Déploiement) ; Vite 8 / Rolldown (DEPLOIEMENT) ;
  `<StrictMode>` sous `renderWithServices` (PLAN § 6 `stockage-persistant`).
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu (X01, Tour du monde, Cricket) |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil ; nouveau mode | CLAUDE § DS ; CONVENTIONS § 5, 7 ; § 13, 14 |
| Écran, composant, route | rules/frontend-react ; CHARTE ; CONVENTIONS § 9, § 10 ; PLAN § 3 |
| Couleur, thème ; test | rules/theme-colors, CHARTE § Palette ; rules/testing, CONVENTIONS § 11 |
| Build, déploiement, SW, manifeste, `firebase.json` | docs/DEPLOIEMENT ; CLAUDE § Déploiement |
| Politique ; réseau, permission, cookie, stockage neufs | `labels.ts` `SECTIONS_CONFIDENTIALITE` + date ; DEPLOIEMENT § Confidentialité (R5) |
| État, nombre de tests, pourquoi d'une décision | PLAN § 0, § 4 ; PLAN § 6 |

## Surfaces gravées
Un lot qui en touche une : **pas de `light`**, `high`, départ à `archi-authority` (`orchestrate`
§ Niveaux, qui fait foi ; liste condensée) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent`, schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste (`vite.config.ts`) y
   est rangé par PLAN § 6 `installation-guidee` (`orchestrate` ne le nomme pas).
5. Une décision de `CLAUDE.md` § DS (stockage, installation, politique compris), § Règles du jeu,
   ou § Charte « ce qui ne s'y discute pas ». (Entraînement : voir Constats.)

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée** :
un écart du code est alors un défaut. rules/README ; rules/response-policy.

**Exceptions délibérées, à ne pas « corriger »** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` | pas de couleur en dur (`themeBoundary`) | rules/theme-colors § Exceptions |
| `Services.devices` : `screenLock`, `haptics`, `preferences`, `announcer`, **`persistentStorage`**, **`appInstallation`** | UI → use cases | `container.ts:67-85` ; CONVENTIONS § 5 |
| `'MatchStarted'` persisté sous `X01Started` ; clé `installation:ecartee` | valeur persistée jamais renommée | `MatchEvent.ts:29` ; rules/persistence ; DEPLOIEMENT § Installation |
| Firebase **Hosting** seul | « pas de Firebase » | CLAUDE § DS |
| **`.well-known` : seule entrée cachée publiée** (`assetlinks.json` = `[]` jusqu'au lot 4) | `ignore` des entrées à point | CLAUDE § Déploiement ; DEPLOIEMENT § Confidentialité |
| **Garde `REMPLIR` sans contournement**, aucun `predeploy` : bloque même un correctif ; ne pas ajouter d'option | — | CLAUDE § Déploiement ; DEPLOIEMENT § Mettre en ligne (R-a) |
| `AccueilEcran` importé statiquement | routes lazy | `App.tsx:5` ; rules/frontend-react |
| Fichier, `Blob`, `matchMedia` dans l'UI ; amorçage `index.html`, `theme_color` figé | ports ; un seul écrivain de `data-theme` | PLAN § 2, § 6 lot thème clair ; CHARTE § Les deux thèmes |
| `legsForBestOf` survit ; variables françaises locales dans `core` ; progression garde son `0` | best of N ; cœur anglais ; `pourcent()` | CLAUDE § DS ; CONVENTIONS § 1, 9 |

Nouvelle exception de couleur : dans le garde **et** `rules/theme-colors.md`.
**Hors périmètre** : sync, compte, réseau ; Killer, Shanghai, Around the Clock ; i18n ; carrière hors X01.

## Décisions ouvertes
1. Sync cloud / classement (lot 6, un adapter) ; export JSON = palliatif. CLAUDE § Décisions ouvertes n° 4.
2. i18n : FR seul (n° 5). Jeux restants : Around the Clock, Killer, Shanghai (n° 3).
3. Lot 5b : un seul exercice, pas de suivi de progression, à finir ou réduire. PLAN § 0 n° 2.
4. `/historique/:id`, `/joueurs/:id` jamais faits (PLAN § 0 n° 3) ; vrai iPhone, `persist()`,
   installation sur appareil réel (R1, R2, R5, R6) : PLAN § 0, DEPLOIEMENT.
5. Voix : `SpeechAnnouncer` ignore `localService` (pseudo possiblement synthétisé en ligne) ; lot
   `localService` éventuel, non planifié (R-d accepté). PLAN § 6 `confidentialite-assetlinks`.
6. Lot 4 `play-store-twa` : remplit `assetlinks.json`, relit la politique ; V4 à refaire à chaque
   version majeure de firebase-tools. DEPLOIEMENT § Confidentialité.

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 1 | Moyenne | X01 : « Best-of N legs (défaut 3) » ; renversé : « premier à N », défaut 2 | `CLAUDE.md:228` vs `:78-85` | Réintroduit « best of N » |
| 2 | Moyenne | `noRestrictedImports` « bannit les API navigateur » : 7 paquets seulement ; le garde ne lit que les imports | `CLAUDE.md:99-101` ; `biome.json:50-62` ; `hexagonalBoundary.test.ts:40-57` | `Date`, API navigateur : relecture |
| 3 | Moyenne | Règles de l'entraînement absentes de `CLAUDE.md` ; plage « 41 à 170 » non confirmée | `PROJECT_PLAN.md:398-424` | Hors surface gravée 5 à la lettre |
| 9 | Moyenne | « double out activé » par défaut (gravé, domaine) ; l'écran de création le préselectionne **désactivé** (inversé en `577dc5f`, non documenté) | `CLAUDE.md:78-79` ; `x01/config.ts:60` vs `NouvellePartieEcran.tsx:204` | Défaut gravé non tenu |
| 11 | Moyenne | Import : persistence « validé entièrement avant la moindre écriture », sec « pas d'écrasement silencieux » ; le code valide chaque entrée **dans la boucle d'écriture**, écrase un même identifiant sans confirmation (« entièrement » = enveloppe ?) | `ManageBackupUseCase.ts:43-73` ; `agents/sec.md:64-65` | À trancher (politique : « remplacés », `labels.ts:306`) |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (devenu `useX01.ts`) ; PLAN § 2 oublie `PreviewTourDuMondeVisit` ; PLAN § 6 lot 1 « QUE `MatchStarted` et `VisitRecorded` » périmé | `CLAUDE.md:97` ; `PROJECT_PLAN.md:184-205,639` | Doc périmée |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:234` ; `stats.ts:14,133-138` | Équivalent sauf volée courte |
| 6 | Basse | README : 318 tests, PLAN § 0 : 456 | `README.md:142,270` ; `PROJECT_PLAN.md:19` | Chiffre périmé |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:75,373` vs rules/theme-colors | Charte incomplète |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `skills/audit/SKILL.md:44` | Défaut disparu cherché |
| 8 | Info | Sets : domaine et affichage présents, aucun sélecteur de création | `Tableau.tsx:154` ; `grep setsToWin src/ui` | Exposition non tranchée |

## Questions et limites
- Plafond mesuré en LF ; rien de gravé sacrifié. `rules/persistence.md` ne cite pas la politique.
- Entraînement, sets, double out (#9), import (#11) : intention non tranchée, ne pas la déduire.
- Non relus : PLAN § 6 hors lots 1, 5b et Play Store ; `docs/lots/*` ; `ConfidentialiteEcran`,
  tests de garde ; texte de la politique non recontrôlé.
- Connus (revérifiés) : `successPercent` sans garde « — » (`ApercuPartie.tsx:101`), aucun
  `ErrorBoundary`. Non revérifiés : `Cible` (`fontSize`), avis `nanoid` (transitif).
- Garde réseau partiel (R-c) : ni URL sans schéma ni assemblée ; le reste : relecture.

## Traçabilité
- **Reportés** (revérifiés, lignes mises à jour) : 1-10. **Ajouté** : #11. Aucun retiré.
- Régénérer : `/refresh-architecture`.
