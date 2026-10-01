# Contexte d'architecture
> **Index** généré : il dit où lire, pas ce que disent les sources. Une règle de jeu, une décision
> gravée ou une convention que le lot touche se lit **à sa source, sur disque**, à la section
> indiquée. Pas une source de vérité : désaccord = code récent, puis `CLAUDE.md`, puis le reste.

## Objet et périmètre
- **Généré le** 2026-10-01. **Scope** : `all` (produit, domaine, persistance, UI, déploiement).
- **Lus sur disque** : `CLAUDE.md`, `.claude/CONVENTIONS.md`, les 11 `.claude/rules/*.md`,
  `docs/CHARTE_GRAPHIQUE.md`, `docs/DEPLOIEMENT.md`, `docs/PROJECT_PLAN.md` (§ 0, 2, 4 lot 5b, 6),
  `skills/orchestrate/SKILL.md`, `agents/sec.md`, l'ancien index (constats seulement).
- **Code vérifié** (ponctuel) : `biome.json`, `hexagonalBoundary.test.ts`, `src/ui/hooks/`,
  `stats.ts`, `config.ts`, `package.json`, `App.tsx`, `container.ts`.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA, pas d'app native ; hexagonal (Ports & Adapters) + SOLID | en vigueur | CLAUDE § Décisions structurantes, § Règle d'architecture |
| Pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports | en vigueur | CLAUDE § Décisions structurantes |
| Firebase **Hosting** seul (statique, zéro SDK) | en vigueur (exception) | CLAUDE § Décisions structurantes, § Déploiement |
| Joueurs = profils locaux ; export / import JSON | en vigueur | CLAUDE § Décisions structurantes |
| Match = `MatchEvent[]`, état = projection ; annuler = rejouer | en vigueur | CLAUDE § Décisions structurantes |
| Saisie fléchette par fléchette **seule** | en vigueur | CLAUDE § Décisions structurantes |
| « Saisie hybride » / mode rapide | **renversée** : retirée après usage réel, remplacée par la saisie fléchette par fléchette seule (incident `61b60ac`, historique `d531a7e`) | CLAUDE § Décisions structurantes, § Notes techniques |
| « Best of N » legs | **renversée** : remplacée par « premier à N legs » (`legsToWin`, `libelleLegs`) | CLAUDE § Décisions structurantes ; rules/glossary |
| Modes X01, Tour du monde, entraînement, Cricket (Killer / Shanghai hors v1) ; défauts X01 | en vigueur | CLAUDE § Décisions structurantes |
| Thème clair / sombre / système, défaut **sombre** | en vigueur | CLAUDE § Décisions structurantes ; CHARTE § Les deux thèmes |
| Stack figée ; Query n'orchestre **pas** le match en cours ; Biome seul | en vigueur | CLAUDE § Décisions structurantes ; CONVENTIONS § 10 |
| Wake Lock obligatoire pendant une partie | en vigueur | CLAUDE § Décisions structurantes ; CONVENTIONS § 5 |
| Charte « feuille de match » : angle vif, 2 zones lecture / saisie | en vigueur | CLAUDE § Charte ; CHARTE § Les trois planchers |
| Alfa Slab One (enseigne, vainqueur) ; paysage `DispositionPartie` ; Cricket livré | tranchées (lots 3 bis, 5c) | CLAUDE § Décisions ouvertes n° 1-3 |
| Bundle découpé par route (`React.lazy`) | en vigueur | docs/DEPLOIEMENT § Service worker et bundle |

## Guidage opérationnel
### Produit et usage
- PWA de compteur de fléchettes, 100 % local, hors ligne, sans compte ; téléphone **posé**, lu à
  2-3 m, saisi à 30 cm : lisibilité et zéro friction priment. CLAUDE § Le projet ; CHARTE § Contexte.
- Capacité externe nouvelle = **un adapter derrière un port**, jamais dans le cœur. CLAUDE § Règle
  d'architecture.
### Architecture
- Dépendances vers l'intérieur ; `domain` sans import externe ni `Date` / `Math.random` (ports
  `Clock`, `IdGenerator`, `RandomSource`) ; câblage **uniquement** dans `container.ts`.
  CLAUDE § Règle d'architecture ; CONVENTIONS § 7.
- **UI → use cases uniquement** (`useServices()`) ; règle de jeu jamais réimplémentée dans l'UI :
  port de prévisualisation. CLAUDE § Conventions de code ; rules/frontend-react ; CONVENTIONS § 4.
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
### Sécurité
- Pas de document dédié ; l'index renvoie aux sources. App sans réseau, compte ni secret : aucun
  import de `firebase` dans `src/`. CLAUDE § Décisions structurantes.
- Seule entrée non fiable : l'import JSON. rules/persistence ; `backupSchema`.
- Hosting, en-têtes de cache, service worker, `sharp` en devDependency : docs/DEPLOIEMENT.
- Checklist du lot : `.claude/agents/sec.md` § Checklist Dartpéro (la phase `sec` la porte).
### Conventions, front, déploiement, pièges
- Tests : fakes, jamais de mocks ; une absence vérifiée doit pouvoir échouer. rules/testing ;
  CONVENTIONS § 11. Outillage : rules/biome ; § 12. Commits : rules/commit.
- Couleurs : tokens seulement, en paires de rôle. rules/theme-colors ; CHARTE § Les deux thèmes.
- Routes lazy (`App.tsx`, `PartieEcran.tsx`, sauf `AccueilEcran`) : rules/frontend-react.
- Déploiement : `CLAUDE.md` § Déploiement (cache) ; manuel `docs/DEPLOIEMENT.md`.
- Pièges : `61b60ac` (CLAUDE § Notes techniques) ; `max-age`, dernière règle `headers` gagnante
  (CLAUDE § Déploiement) ; Vite 8 / Rolldown (DEPLOIEMENT § Service worker et bundle).
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu (X01, Tour du monde, Cricket) |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Nouveau mode | CONVENTIONS § 13, § 14 |
| Écran, composant | rules/frontend-react ; CHARTE ; CONVENTIONS § 9, § 10 |
| Couleur, thème | rules/theme-colors ; CHARTE § Palette |
| Test | rules/testing ; CONVENTIONS § 11 |
| Build, déploiement, SW | docs/DEPLOIEMENT ; CLAUDE § Déploiement |
| État, nombre de tests, pourquoi d'une décision | PLAN § 0, § 4 ; PLAN § 6 |

## Surfaces gravées
Un lot qui en touche une est **interdit en `light`**, passe en `high`, démarre à `archi-authority`
(`orchestrate` § Niveaux, § Monter en gamme). Liste condensée ; `orchestrate` fait foi :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent`, schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json`.
5. Une décision de `CLAUDE.md` § Décisions structurantes, § Règles du jeu, ou § Charte « ce qui
   ne s'y discute pas ». (L'entraînement n'y figure pas : voir Constats.)

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, puis `CONVENTIONS`, puis `rules/`. Exception : une
décision **gravée** : un écart du code est un défaut. rules/README ; rules/response-policy.

**Exceptions délibérées, à ne pas « corriger »** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` | pas de couleur en dur (`themeBoundary`) | rules/theme-colors § Exceptions |
| `Services.devices` (ports driven consommés par l'UI) | UI → use cases | `container.ts:88` ; PLAN § 6 lot 3 |
| Discriminant persisté `'MatchStarted'` sous le type `X01Started` | valeur persistée jamais renommée | `MatchEvent.ts:29` ; rules/persistence |
| Firebase **Hosting** seul | « pas de Firebase » | CLAUDE § Décisions structurantes |
| `AccueilEcran` importé statiquement | routes lazy | `App.tsx:8` ; rules/frontend-react |
| Fichier, `Blob`, `matchMedia` dans l'UI | logique via ports | PLAN § 2 ; § 6 lot thème clair |
| Script d'amorçage `index.html` ; `theme_color` figé | un seul écrivain de `data-theme` ; thème suivi | CHARTE § Les deux thèmes ; PLAN § 6 lot thème clair |
| `legsForBestOf` survit ; variables locales françaises dans `core` ; progression garde son `0` | best of N ; cœur en anglais ; `pourcent()` | CLAUDE § Décisions structurantes ; CONVENTIONS § 1, § 9 |

Nouvelle exception de couleur : dans le garde **et** `rules/theme-colors.md`, même lot.
**Hors périmètre** : sync cloud, compte, réseau ; Killer / Shanghai / Around the Clock ; i18n ; carrière hors X01 (PLAN:397).

## Décisions ouvertes
1. Sync cloud / classement (lot 6, un adapter) ; export JSON = palliatif. CLAUDE § Décisions ouvertes n° 4.
2. i18n : FR seul (n° 5). Jeux restants : Around the Clock, Killer, Shanghai (n° 3).
3. Lot 5b : un seul exercice, pas de suivi de progression, à finir ou réduire. PLAN § 0 n° 2.
4. `/historique/:id`, `/joueurs/:id` jamais faits (PLAN § 0 n° 3) ; vrai iPhone (PLAN § 0 n° 1).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 1 | Moyenne | X01 dit « Best-of N legs (défaut 3) » ; décision renversée : « premier à N », défaut 2 | `CLAUDE.md:213` vs `:74-81` | Réintroduit « best of N » ; suivre la décision |
| 2 | Moyenne | `noRestrictedImports` « bannit les API navigateur » : il ne bannit que 7 paquets ; le garde ne lit que les imports | `CLAUDE.md:95-97` ; `biome.json:54-60` ; `hexagonalBoundary.test.ts:36-52` | `Date` / API navigateur dans le cœur : relecture seule |
| 3 | Moyenne | Règles de l'entraînement absentes de `CLAUDE.md` ; plage « 41 à 170 » non confirmée | `PROJECT_PLAN.md:381-407` | Hors 5e surface gravée à la lettre |
| 4 | Basse | `CLAUDE.md` cite `hooks/useMatch.ts` (devenu `useX01.ts`) ; PLAN § 2 oublie `PreviewTourDuMondeVisit` ; PLAN § 6 lot 1 « QUE `MatchStarted` et `VisitRecorded` » périmé | `CLAUDE.md:93` ; `PROJECT_PLAN.md:150-151,602` | Chemin / liste / format faux |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:219` ; `stats.ts:132-138` | Équivalent sauf volée courte |
| 6 | Basse | README annonce 318 tests, PLAN § 0 dit 339 | `README.md:142,270` ; `PROJECT_PLAN.md:19` | Chiffre périmé |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions réelles | `CHARTE:75,373` vs rules/theme-colors | Charte incomplète |
| 8 | Info | Sets : domaine et affichage présents, aucun sélecteur de création dans `src/ui` | `Tableau.tsx:154` ; `grep setsToWin src/ui` | Exposition réelle non tranchée |

## Questions et limites
- Tout tient sous le plafond, sans sacrifier surface, exception, décision ni constat ≥ moyenne.
- Entraînement, sets : règle ou exposition non tranchée ; ne pas la déduire.
- Non relus : `PROJECT_PLAN` § 6 hors lots 1, 5b, allègement ; code hors fichiers cités.
- Connus, non revérifiés : `successPercent` peut afficher « 0 % » (`ApercuPartie.tsx:101`), aucun
  `ErrorBoundary`, pas de `.gitattributes`, `Cible` (`fontSize`), `nanoid` (PLAN § 6 lot UX).

## Traçabilité
- **Retirés** : « `CLAUDE.md` coche 5b `[x]` » et « `CLAUDE.md` à 318 tests » : ces passages ont
  quitté `CLAUDE.md` (renvoi PLAN § 0 / § 4, qui dit 339) ; le 5b reste en Décisions ouvertes.
- **Reportés** (revérifiés) : best-of, entraînement, First 9, PLAN lot 1, charte, sets, README 318.
  **Nouveaux** : `noRestrictedImports`, `useMatch`, PLAN § 2.
- Sources par section : Inventaire = CLAUDE ; Guidage = CONVENTIONS, rules/, CHARTE, DEPLOIEMENT ;
  Surfaces = orchestrate § Niveaux ; Constats = lignes citées.
- Régénérer : `/refresh-architecture` (brief `.claude/agents/architecture-context.md`).
