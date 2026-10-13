# Contexte d'architecture
> **Index** : il dit où lire ; règle, décision ou convention se lit **à sa source, sur disque**.
> Pas une source de vérité (désaccord : code récent, puis `CLAUDE.md`, puis le reste).
> **DS** = `CLAUDE.md` § Décisions structurantes. **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-13 (5e passe ; lot `accueil-parties-recentes` **non committé**, branche
  `lot/accueil-parties-recentes`), scope `all`.
- **Lus sur disque** : `CLAUDE.md`, `CONVENTIONS`, `rules/` (biome, frontend-react, glossary,
  persistence), `orchestrate`, `sec.md`, PLAN (§ 0, 2, 3, 4, 6 ciblés), charte (titres, l. 75, 373,
  383), l'ancien index. **Code** : `biome.json`, `container.ts`, `MatchEvent.ts`, `summarize.ts`,
  `ManageBackupUseCase`, `App.tsx`, gardes d'architecture.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports ; Hosting seul ; politique `/confidentialite` à jour **et datée** | en vigueur | DS ; § Règle d'architecture |
| `firebase.json` ; `smoke` refuse `REMPLIR` ; seule `firebase:deploy` | en vigueur | CLAUDE § Déploiement |
| Profils locaux + export / import JSON ; match = `MatchEvent[]` ; saisie fléchette par fléchette **seule** | en vigueur | DS |
| « Saisie hybride » / mode rapide | **renversée** : retirée après usage réel (`d531a7e`) | DS ; § Notes techniques |
| « Best of N » legs | **renversée** : « premier à N » (`legsToWin`) | DS ; glossary |
| Réglages X01 proposés ≠ défauts du domaine (double out) ; « manche » à l'écran, `Leg` dans le code ; Nouvelle partie : **une route par étape** | en vigueur | DS ; glossary |
| **Nom de partie** : seul un nom tapé s'écrit (`name?` d'ouverture) ; défaut recalculé | en vigueur | DS ; PLAN § 6 |
| **Accueil en parties récentes** : « Abandonnée » **dérivée, jamais écrite** (`matchStatus` seul, contre la partie en cours **globale**, jamais une liste filtrée) ; mise en page **non gravée** | en vigueur | DS ; PLAN § 6 |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query n'orchestre **pas** le match en cours ; Biome seul ; Wake Lock | en vigueur | DS |
| `PersistentStorage`, `AppInstallation` (services créés dans `main.tsx` **avant** `createRoot`) ; `id: '/'` jamais changé | en vigueur | DS ; CLAUDE § Déploiement |
| Thème défaut **sombre** ; angle vif ; zones lecture / saisie | en vigueur | DS ; CLAUDE § Charte |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Produit et usage
- PWA 100 % locale, sans compte ; téléphone **posé**, lu à 2-3 m. CLAUDE § Le projet.
### Architecture
- Dépendances vers l'intérieur ; `domain` sans import externe ; câblage **uniquement** dans
  `container.ts` ; capacité externe = **adapter derrière un port**. CLAUDE § Règle d'architecture.
- **UI → use cases uniquement** (`useServices()`) ; heure par `services.clock` ; seule fonction
  pure de `use-cases/` importable : `matchStatus`, jamais une classe `*UseCase`. CONVENTIONS § 8.
- Couture `GameMode` : un mode n'importe jamais un autre, le mode se lit sur le **premier
  événement**. Ce que TypeScript ne signale pas à l'ajout d'un mode, de `name?` ou de
  `CartePartie` : CONVENTIONS § 13 ; arbre : § 14.
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust, double in / out, checkout, bogey
  numbers, legs et sets, statistiques (moyenne, First 9, % doubles).
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat,
  pas de fin de tour de table.
- **Entraînement** : **non gravé** ; PLAN § 4 / § 6 lot 5b. Jamais d'improvisation (response-policy).
### Persistance et journal
- Événements ajoutés seulement, tirage **écrit**, valeur persistée jamais renommée, facultatif
  absent = **clé absente**, migration + test, `backupSchema` dans le même lot. rules/persistence.
  « Abandonnée », `legsPlayed`, nom par défaut : **dérivés**, rien d'écrit.
### Sécurité
- Sans réseau, compte ni secret : aucun import de `firebase` dans `src/` ; politique
  `/confidentialite` à tenir vraie. CLAUDE § Décisions structurantes.
- Seule entrée non fiable : l'import JSON (`backupSchema`). rules/persistence.md.
- Hosting, cache, SW, manifeste : docs/DEPLOIEMENT.md. Checklist : `.claude/agents/sec.md` § Checklist.
### Conventions, front, déploiement, pièges
- Fakes, jamais de mocks (rules/testing) ; tokens de couleur en paires (rules/theme-colors) ;
  routes lazy ; tout le français dans `labels.ts`.
- Pièges : `61b60ac` (CLAUDE § Notes techniques) ; `max-age`, `headers`, `id: '/'`, `ignore`,
  `REMPLIR` (CLAUDE § Déploiement) ; Rolldown (DEPLOIEMENT) ; `<StrictMode>`, `partie:mode`,
  `rangVise`, `sansCommentaires` (PLAN § 6) ; faux `<dialog>` ; `test.env.TZ` (CONVENTIONS § 11-12).
- **`lint:fix` global interdit** (il a réécrit un skill tiers non suivi) ; `.claude/skills` et
  `.agents` exclus de Biome. rules/biome.
- **Test d'invalidation** : un seul `QueryClient` partagé, sinon vert à vide ; clés dans
  `clesRequetes.ts`, hors écran lazy. CONVENTIONS § 10-11.
- **Barre du bas à hauteur fixe** (même `calc` que le bouton fixé) : police système au maximum
  **avant tout `firebase:deploy`**. PLAN § 0 ; charte.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu (X01, Tour du monde, Cricket) |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil ; horloge ; nouveau mode | DS ; CONVENTIONS § 5, 7, 13, 14 |
| Écran, composant, route ; Nouvelle partie | rules/frontend-react ; CHARTE ; CONVENTIONS § 9, 10, 13 ; `src/ui/chemins.ts` ; PLAN § 3 |
| Nom de partie | DS ; glossary ; CONVENTIONS § 11, 13 ; PLAN § 6 |
| Accueil, `CartePartie`, « Abandonnée » | DS ; glossary ; CONVENTIONS § 8-10, 13 ; CHARTE § Composants ; PLAN § 0, 3, 6 |
| Couleur, thème ; test | rules/theme-colors, CHARTE § Palette ; rules/testing, CONVENTIONS § 11-12 |
| Libellé ; politique (réseau, stockage) | glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE`) |
| Lint ; build, SW ; état | rules/biome ; DEPLOIEMENT ; PLAN § 0, 4, 6 |

## Surfaces gravées
Un lot qui en touche une : **pas de `light`**, `high`, départ à `archi-authority` (`orchestrate`
§ Niveaux fait foi) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (`name?` compris), schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé (PLAN § 6
   `installation-guidee`).
5. Une décision de DS (stockage, installation, politique, parcours Nouvelle partie, double out,
   **nom de partie**, **`Services.clock`**, **« Abandonnée » dérivée**), § Règles du jeu, ou
   § Charte « ce qui ne s'y discute pas ». (Entraînement : voir Constats.)

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée** :
un écart du code est alors un défaut. rules/README.

**Exceptions délibérées, à ne pas « corriger »** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` | pas de couleur en dur | rules/theme-colors |
| `Services.devices` (dont **`persistentStorage`**, **`appInstallation`**) | UI → use cases | `container.ts:75-88,102-107` |
| **`Services.clock`** : même instance que les use cases, lue par l'UI | UI → use cases ; garde `horlogeBoundary` | `container.ts:136-143` |
| **`matchStatus`** (+ type `MatchStatus`) : seul import de `use-cases/` par l'UI, pure | UI → use cases | `summarize.ts:33` ; `AccueilEcran.tsx:5` ; `HistoriqueEcran.tsx:4` |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee` ; clés `partie:*` | valeur persistée jamais renommée | `MatchEvent.ts:27-37` |
| **Double out : décoché à l'écran, `true` dans le domaine** | ne pas aligner | `x01/config.ts:68` ; `useNouvellePartie.ts:222,296` |
| **Nom par défaut jamais écrit**, clé `name` absente, jamais `undefined` | un défaut se persiste | `MatchEvent.ts:44-85,132` |
| Firebase **Hosting** seul ; **`.well-known`** seule entrée cachée publiée | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| **Garde `REMPLIR` sans contournement**, aucun `predeploy` | — | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `nouvelle-partie/*` sous un seul `lazy()` | routes lazy | `App.tsx:6,10,28-31` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé | ports ; `data-theme` | PLAN § 2, 6 |
| `legsForBestOf` survit ; locales françaises dans `core` ; progression garde son `0` | best of N ; cœur anglais ; `pourcent()` | DS ; CONVENTIONS § 1, 9 |

## Décisions ouvertes
1. Sync cloud / classement (lot 6, un adapter) ; export JSON = palliatif. CLAUDE § Déc. ouvertes 4.
2. i18n : FR seul (n° 5). Jeux restants : Around the Clock, Killer, Shanghai (n° 3).
3. Lot 5b : un seul exercice, pas de suivi. `/historique/:id`, `/joueurs/:id` jamais faits ; vrai
   iPhone, `persist()`, installation réelle (R1, R2, R5, R6). PLAN § 0.
4. Voix (`localService` ignoré) ; `play-store-twa` : remplit `assetlinks.json`, relit la
   politique. PLAN § 6 ; DEPLOIEMENT.
5. Relectures à l'écran (PLAN § 0) : `nouvelle-partie-en-etapes`, `nom-de-partie`, **et
   `accueil-parties-recentes`** (portrait / paysage, deux thèmes, 0 / 1 / 15 parties, safe-area
   iPhone, **barre avec police maximale avant `firebase:deploy`**, anneau de focus, badge, captures).
6. Prochain audit (laissé par l'utilisateur) : R2, R3, R4, N2, **T1, R7**, exports français de
   `backupSchema.ts`, états d'erreur des listes, « 1 sorties ». PLAN § 0.
7. Lot « sortie libre » : **reporté**, sans renvoi dans `CLAUDE.md`. PLAN § 0 n° 4 (constat 12).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 12 | Moyenne | **Report décidé par l'utilisateur.** Sans double out (**défaut de l'écran**), le code suggère jusqu'à 180 ; `CLAUDE.md` et glossaire ne décrivent que le double out | `checkout.ts:84` ; `CLAUDE.md:243-254` ; `glossary.md:17-18` ; PLAN `:81-86` | Règle muette par défaut |
| 3 | Moyenne | Règles de l'entraînement absentes de `CLAUDE.md` ; « 41 à 170 » non confirmée | PLAN `:468-484` | Hors surface gravée 5 |
| 11 | Moyenne | Import : persistence « validé entièrement avant la moindre écriture », sec « pas d'écrasement silencieux » ; le code valide **dans la boucle d'écriture**, écrase un même identifiant. Joindre : `createdAt` importé sans borne haute | `ManageBackupUseCase.ts:42-73` ; `persistence.md:27-28` ; `sec.md:62-65` ; PLAN `:34` | À trancher |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » ; `window`, `navigator`, `Math.random` du cœur sans garde (0 occurrence) | `CLAUDE.md:117-119` ; `biome.json:61-69` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` n'importe aucune classe `*UseCase` » (R7) | `CONVENTIONS.md:144-148` ; `hexagonalBoundary.test.ts:59-64` | Écart non détecté |
| 15 | Basse | T1 : texte des règles courtes des cartes sans test | `CONVENTIONS.md:319-320` ; `labels.ts:462-471` | Choix de l'utilisateur |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (devenu `useX01.ts`) ; PLAN § 2 oublie `PreviewTourDuMondeVisit` ; PLAN § 6 lot 1 « QUE `MatchStarted` et… » périmé | `CLAUDE.md:115` ; PLAN `:209-212,732` | Doc périmée |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:268` ; `stats.ts:14,133-137` | Équivalent sauf volée courte |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:75,383` | Incomplète |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Défaut disparu |

## Questions et limites
- Rien de gravé sacrifié. Entraînement, #12, #11 : intention non tranchée. Mise en page de
  l'Accueil **non gravée** (DS) ; barre à hauteur fixe : charte et PLAN seulement.
- Non relus : PLAN § 6 hors lots 1, 5b, Play Store, trois derniers ; `docs/lots/*` (hors verdicts
  `04` / `05`) ; DEPLOIEMENT ; charte hors titres ; tests du lot.
- PLAN `:1770-1772`, **non revérifiés** : « Manche N » numérotée sur la partie ; résumé X01 sans
  sets ; boutons retour de 44 px ; `npm audit` (8 vulnérabilités de dev).
- Connus (revérifiés) : `successPercent` sans garde « — » (`ResumeEntrainementEcran.tsx:50`) ;
  aucun `ErrorBoundary`.

## Traçabilité
- **Reportés** (revérifiés, lignes à jour) : 2, 3, 4, 5, 7, 10, 11, 12. **Nouveaux** : 14, 15.
- **Retiré** : `ApercuPartie.tsx:108` (`successPercent`) : fichier supprimé, `CartePartie` ne le lit
  pas. Avant : #6, #13, #1, #8, #9. Régénérer : `/refresh-architecture`.
