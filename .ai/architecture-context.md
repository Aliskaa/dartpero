# Contexte d'architecture
> **Index** généré : il dit où lire, pas ce que disent les sources. Règle de jeu, décision gravée
> ou convention que le lot touche : se lit **à sa source, sur disque**, à la section indiquée. Pas
> une source de vérité : désaccord = code récent, puis `CLAUDE.md`, puis le reste.
> **DS** = `CLAUDE.md` § Décisions structurantes.

## Objet et périmètre
- **Généré le** 2026-10-02 (lot `installation-guidee` **non committé**, boucle 5, tour 2).
  **Scope** : `all`.
- **Lus sur disque** : `CLAUDE.md`, `.claude/CONVENTIONS.md`, `.claude/rules/*.md`, charte,
  `docs/DEPLOIEMENT.md`, `docs/PROJECT_PLAN.md` (§ 0, 2, 3, 4 lot 5b, 6), `skills/orchestrate/SKILL.md`,
  `agents/sec.md`, l'ancien index (constats seulement).
- **Code vérifié** (ponctuel) : `biome.json`, garde hexagonal, `hooks/`, `stats.ts`, `src/App.tsx`,
  `main.tsx`, `container.ts`, `MatchEvent.ts`, `x01/config.ts`, `NouvellePartieEcran`.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA, pas d'app native ; hexagonal (Ports & Adapters) + SOLID | en vigueur | CLAUDE § DS, § Règle d'architecture |
| Pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports | en vigueur | CLAUDE § DS |
| Firebase **Hosting** seul (statique, zéro SDK) | en vigueur (exception) | CLAUDE § DS, § Déploiement |
| Joueurs = profils locaux ; export / import JSON | en vigueur | CLAUDE § DS |
| Match = `MatchEvent[]`, état = projection ; annuler = rejouer | en vigueur | CLAUDE § DS |
| Saisie fléchette par fléchette **seule** | en vigueur | CLAUDE § DS |
| « Saisie hybride » / mode rapide | **renversée** : retirée après usage réel, remplacée par la saisie fléchette par fléchette seule (incident `61b60ac`, historique `d531a7e`) | CLAUDE § DS, § Notes techniques |
| « Best of N » legs | **renversée** : remplacée par « premier à N legs » (`legsToWin`, `libelleLegs`) | CLAUDE § DS ; rules/glossary |
| Modes X01, Tour du monde, entraînement, Cricket (Killer / Shanghai hors v1) ; défauts X01 | en vigueur | CLAUDE § DS |
| Thème clair / sombre / système, défaut **sombre** | en vigueur | CLAUDE § DS ; CHARTE § Les deux thèmes |
| Stack figée ; Query n'orchestre **pas** le match en cours ; Biome seul | en vigueur | CLAUDE § DS ; CONVENTIONS § 10 |
| Wake Lock obligatoire pendant une partie | en vigueur | CLAUDE § DS ; CONVENTIONS § 5 |
| Stockage persistant demandé au démarrage (`PersistentStorage`) ; « protégé » n'est **pas** une sauvegarde | en vigueur | CLAUDE § DS ; DEPLOIEMENT § Stockage persistant |
| Invitation à installer (`AppInstallation`), services créés dans `main.tsx` **avant** `createRoot` ; manifeste `id: '/'` jamais changé, captures hors précache, `smoke` | en vigueur | CLAUDE § DS, § Déploiement ; DEPLOIEMENT § Installation et manifeste ; CONVENTIONS § 5, § 7 |
| Charte « feuille de match » : angle vif, 2 zones lecture / saisie | en vigueur | CLAUDE § Charte ; CHARTE § Les trois planchers |
| Alfa Slab One ; paysage `DispositionPartie` ; Cricket livré | tranchées (lots 3 bis, 5c) | CLAUDE § Décisions ouvertes n° 1-3 |

## Guidage opérationnel
### Produit et usage
- PWA de compteur de fléchettes, 100 % local, hors ligne, sans compte ; téléphone **posé**, lu à
  2-3 m, saisi à 30 cm : lisibilité et zéro friction priment. CLAUDE § Le projet.
### Architecture
- Dépendances vers l'intérieur ; `domain` sans import externe ni `Date` / `Math.random` (ports
  `Clock`, `IdGenerator`, `RandomSource`) ; câblage **uniquement** dans `container.ts`.
  Capacité externe nouvelle = **adapter derrière un port**. CLAUDE § Règle d'architecture ; CONVENTIONS § 7.
- **UI → use cases uniquement** (`useServices()`) ; règle de jeu jamais réimplémentée dans l'UI :
  port de prévisualisation. CLAUDE § Conventions de code ; rules/frontend-react ; CONVENTIONS § 4.
- Services créés **une fois** dans `src/main.tsx`, avant `createRoot` ; `ServicesProvider` les
  reçoit en prop. CONVENTIONS § 7.
- Couture `GameMode` ; un mode n'importe jamais un autre mode ; le mode se lit sur le **premier
  événement** du journal. CONVENTIONS § 13 ; arbre : § 14. VO, ports, adapters : § 1, 2, 5, 6.
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust, double in / out, checkout et bogey
  numbers, legs et sets, statistiques (moyenne, First 9, % doubles).
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat
  (sens de comparaison inversé), pas de fin de tour de table.
- **Entraînement** : **non gravé** dans `CLAUDE.md` ; `PROJECT_PLAN` § 4 / § 6 lot 5b.
- Ne jamais improviser une règle : elle est à la source ou on demande. rules/response-policy.
### Persistance et journal
- Dexie derrière les ports, ajout d'événements seulement, tirage **écrit** au journal, valeur
  persistée jamais renommée, migration + test, `backupSchema` dans le même lot, import JSON validé
  avant écriture, `localStorage` = préférences d'appareil. rules/persistence.
- `PersistentStorage`, `AppInstallation` : aucun effet sur journal ni schéma ; ne remplacent pas
  l'export JSON. CLAUDE § DS.
### Sécurité
- Pas de document dédié. App sans réseau, compte ni secret : aucun import de `firebase` dans
  `src/`. CLAUDE § DS.
- Seule entrée non fiable : l'import JSON. rules/persistence ; `backupSchema`.
- Hosting, cache, service worker, manifeste, `sharp` en devDependency : docs/DEPLOIEMENT.
- Checklist du lot : `.claude/agents/sec.md` § Checklist Dartpéro (la phase `sec` la porte).
### Conventions, front, déploiement, pièges
- Tests : fakes, jamais de mocks (rules/testing). Outillage : rules/biome. Commits : rules/commit.
- Couleurs : tokens seulement, en paires de rôle. rules/theme-colors.
- Routes lazy (sauf `AccueilEcran`) : rules/frontend-react ; DEPLOIEMENT § Service worker et bundle.
- Pièges : `61b60ac` (CLAUDE § Notes techniques) ; `max-age`, dernière règle `headers` gagnante,
  `id: '/'` (CLAUDE § Déploiement ; manuel DEPLOIEMENT) ; Vite 8 / Rolldown (DEPLOIEMENT § Service worker et bundle) ;
  `<StrictMode>` sous `renderWithServices` : PLAN § 6 `stockage-persistant` ;
  fins de ligne LF : `.gitattributes`, CLAUDE § Environnement.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu (X01, Tour du monde, Cricket) |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil (stockage, installation) | CLAUDE § DS ; CONVENTIONS § 5, § 7 |
| Nouveau mode | CONVENTIONS § 13, § 14 |
| Écran, composant, route | rules/frontend-react ; CHARTE ; CONVENTIONS § 9, § 10 ; PLAN § 3 |
| Couleur, thème | rules/theme-colors ; CHARTE § Palette |
| Test | rules/testing ; CONVENTIONS § 11 |
| Build, déploiement, SW, manifeste | docs/DEPLOIEMENT ; CLAUDE § Déploiement |
| État, nombre de tests, pourquoi d'une décision | PLAN § 0, § 4 ; PLAN § 6 |

## Surfaces gravées
Un lot qui en touche une est **interdit en `light`**, passe en `high`, démarre à `archi-authority`
(`orchestrate` § Niveaux). Liste condensée ; `orchestrate` fait foi :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent`, schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste (`vite.config.ts`) y
   est rangé par PLAN § 6 `installation-guidee`, `orchestrate` ne le nomme pas.
5. Une décision de `CLAUDE.md` § DS (stockage, installation compris), § Règles
   du jeu, ou § Charte « ce qui ne s'y discute pas ». (Entraînement : voir Constats.)

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, puis `CONVENTIONS`, puis `rules/`. Exception : une
décision **gravée** : un écart du code est un défaut. rules/README ; rules/response-policy.

**Exceptions délibérées, à ne pas « corriger »** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` | pas de couleur en dur (`themeBoundary`) | rules/theme-colors § Exceptions |
| `Services.devices` (ports driven lus par l'UI) : `screenLock`, `haptics`, `preferences`, `announcer`, **`persistentStorage`**, **`appInstallation`** | UI → use cases | `container.ts:74-85,100-102` ; CONVENTIONS § 5 |
| Discriminant persisté `'MatchStarted'` sous le type `X01Started` ; clé `installation:ecartee` | valeur persistée jamais renommée | `MatchEvent.ts:29` ; rules/persistence ; DEPLOIEMENT § Installation |
| Firebase **Hosting** seul | « pas de Firebase » | CLAUDE § DS |
| `AccueilEcran` importé statiquement | routes lazy | `App.tsx:5` ; rules/frontend-react |
| Fichier, `Blob`, `matchMedia` dans l'UI ; script d'amorçage `index.html`, `theme_color` figé | logique via ports ; un seul écrivain de `data-theme` | PLAN § 2, § 6 lot thème clair ; CHARTE § Les deux thèmes |
| `legsForBestOf` survit ; variables locales françaises dans `core` ; progression garde son `0` | best of N ; cœur en anglais ; `pourcent()` | CLAUDE § DS ; CONVENTIONS § 1, § 9 |

Nouvelle exception de couleur : dans le garde **et** `rules/theme-colors.md`, même lot.
**Hors périmètre** : sync, compte, réseau ; Killer / Shanghai / Around the Clock ; i18n ; carrière hors X01.

## Décisions ouvertes
1. Sync cloud / classement (lot 6, un adapter) ; export JSON = palliatif. CLAUDE § Décisions ouvertes n° 4.
2. i18n : FR seul (n° 5). Jeux restants : Around the Clock, Killer, Shanghai (n° 3).
3. Lot 5b : un seul exercice, pas de suivi de progression, à finir ou réduire. PLAN § 0 n° 2.
4. `/historique/:id`, `/joueurs/:id` jamais faits (PLAN § 0 n° 3) ; vrai iPhone (n° 1) ; `persist()`
   et installation sur appareil réel (R1, R2, R5, R6) : PLAN § 0, DEPLOIEMENT.

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 1 | Moyenne | X01 dit « Best-of N legs (défaut 3) » ; renversé : « premier à N », défaut 2 | `CLAUDE.md:224` vs `:74-81` | Réintroduit « best of N » |
| 2 | Moyenne | `noRestrictedImports` « bannit les API navigateur » : il ne bannit que 7 paquets ; le garde ne lit que les imports | `CLAUDE.md:95-97` ; `biome.json:54-60` ; `hexagonalBoundary.test.ts:36-52` | `Date` / API navigateur : relecture seule |
| 3 | Moyenne | Règles de l'entraînement absentes de `CLAUDE.md` ; plage « 41 à 170 » non confirmée | `PROJECT_PLAN.md:393-419` | Hors 5e surface gravée à la lettre |
| 9 | Moyenne | « double out activé » par défaut (gravé, domaine), mais l'écran de création le préselectionne **désactivé** (inversé en `577dc5f`, non documenté) | `CLAUDE.md:74-75` ; `x01/config.ts:60` vs `NouvellePartieEcran.tsx:204` | Défaut gravé non tenu ; intention non tranchée |
| 4 | Basse | `CLAUDE.md` cite `hooks/useMatch.ts` (devenu `useX01.ts`) ; PLAN § 2 oublie `PreviewTourDuMondeVisit` ; PLAN § 6 lot 1 « QUE `MatchStarted` et `VisitRecorded` » périmé | `CLAUDE.md:93` ; `PROJECT_PLAN.md:161-162,625` | Chemin / liste / format faux |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:230` ; `stats.ts:133-138` | Équivalent sauf volée courte |
| 6 | Basse | README annonce 318 tests, PLAN § 0 dit 437 | `README.md:142,270` ; `PROJECT_PLAN.md:19` | Chiffre périmé |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions réelles | `CHARTE:75,373` vs rules/theme-colors | Charte incomplète |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `skills/audit/SKILL.md:44` | Défaut disparu cherché |
| 8 | Info | Sets : domaine et affichage présents, aucun sélecteur de création dans `src/ui` | `Tableau.tsx:154` ; `grep setsToWin src/ui` | Exposition réelle non tranchée |

## Questions et limites
- Plafond mesuré en LF, tenu aussi en CRLF (+1 octet / ligne) : rien sacrifié.
- Entraînement, sets, double out à l'écran (#9) : règle ou intention non tranchée ; ne pas la déduire.
- `rules/persistence.md` ne cite ni protection du stockage ni `installation:ecartee` : sans conflit.
- Non relus : PLAN § 6 hors lots 1, 5b, `stockage-persistant`, `installation-guidee` ; autre code.
- Connus (revérifiés) : `successPercent` sans garde « — » (`ApercuPartie.tsx:101`), aucun
  `ErrorBoundary`. Non revérifiés : rendu de `Cible` (`fontSize`), avis `nanoid` (transitif).

## Traçabilité
- **Reportés** (revérifiés, lignes inchangées) : constats 1-9 (#9 : `git show 577dc5f`,
  `true` → `false`). **Ajouté** : #10.
- **Retiré** : limite « pas de `.gitattributes` » (créé, CLAUDE § Environnement) ; `PLAN:1066`
  (journal daté) la dit encore : historique.
- Régénérer : `/refresh-architecture` (brief `agents/architecture-context.md`).
