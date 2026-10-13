# Contexte d'architecture
> **Index** : il dit où lire ; règle, décision ou convention se lit **à sa source, sur disque**.
> Pas une source de vérité (désaccord : code récent, puis `CLAUDE.md`, puis le reste).
> **DS** = `CLAUDE.md` § Décisions structurantes. **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-13 (6e passe), scope `all`, branche `lot/charte-typo-mouvement` (en
  cours, non suivi). Intégrés : `1e882b9` (`annuler-double-tap`), `dd935d1` (`charte-contraste`).
- **Lus sur disque** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, `sec.md`, `orchestrate`, charte,
  étude `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, PLAN (ciblé), titres de
  DEPLOIEMENT, ancien index. **Code** : `biome.json`, `container.ts`, `MatchEvent.ts`,
  `ManageBackupUseCase`, `checkout.ts`, `themeBoundary.test.ts`, hooks.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; pas de Firebase **dans l'app**, ni auth, ni réseau ; Dexie derrière les ports ; Hosting seul ; politique `/confidentialite` **datée** | en vigueur | DS |
| Profils locaux + export / import JSON ; match = `MatchEvent[]` ; saisie fléchette par fléchette **seule** | en vigueur | DS |
| « Saisie hybride » / mode rapide | **renversée** (retirée après usage, `d531a7e`) | DS ; § Notes techniques |
| « Best of N » legs | **renversée** : « premier à N » (`legsToWin`) | DS ; glossary |
| Réglages X01 proposés ≠ défauts du domaine (double out) ; « manche » à l'écran ; Nouvelle partie : **route par étape** | en vigueur | DS ; glossary |
| **Nom de partie** (seul un nom tapé s'écrit) ; « Abandonnée » **dérivée, jamais écrite** (`matchStatus`, partie en cours **globale**) | en vigueur | DS ; PLAN § 6 |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query n'orchestre **pas** le match ; Biome seul | en vigueur | DS |
| `PersistentStorage`, `AppInstallation` ; `id: '/'` figé ; `smoke` refuse `REMPLIR` | en vigueur | DS ; § Déploiement |
| Thème défaut **sombre** ; angle vif (`--radius-*` = 0) ; zones lecture / saisie | en vigueur | DS ; § Charte |
| **Plancher de lisibilité** : texte secondaire en `craie-2` / `craie-3` pleins (≥ 4,5:1), alpha de texte interdit, `craie-decor` pour glyphes `aria-hidden` seuls. **Charte et rules seulement**, pas `CLAUDE.md` | en vigueur (`charte-contraste`) | CHARTE § Les trois planchers, § Palette ; rules/theme-colors |
| Refonte visuelle (A puis B, 13 lots) | **étude, rien de gravé** ; lots 1-2 faits, 3 en cours | étude prospective |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **uniquement** dans `container.ts` ; capacité externe =
  **adapter derrière un port**. CLAUDE § Règle d'architecture.
- **UI → use cases** (`useServices()`) ; heure par `services.clock` ; seule fonction pure de
  `use-cases/` importable : `matchStatus`. CONVENTIONS § 8.
- Couture `GameMode` : un mode n'importe jamais un autre ; mode lu sur le **premier événement**.
  Ajout d'un mode (angles morts de TypeScript) : CONVENTIONS § 13 ; arbre : § 14.
### Règles de jeu : pointées, jamais énoncées
- **X01** : `CLAUDE.md` § Règles du jeu X01. Délicats : bust, double in / out, checkout, bogey
  numbers, legs et sets, statistiques (moyenne, First 9, % doubles).
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat,
  pas de fin de tour de table.
- **Entraînement** : **non gravé** ; PLAN § 4 / § 6 lot 5b.
### Persistance et journal
- Événements ajoutés seulement, tirage **écrit**, valeur persistée jamais renommée, facultatif
  absent = **clé absente**, migration + test, `backupSchema` au même lot. rules/persistence.
  « Abandonnée », `legsPlayed`, nom par défaut : **dérivés**.
### Sécurité
- Sans réseau, compte ni secret : aucun import de `firebase` dans `src/` ; politique
  `/confidentialite` tenue vraie. CLAUDE § Décisions structurantes.
- Seule entrée non fiable : l'import JSON (`backupSchema`). rules/persistence.md.
- Hosting, cache, SW : docs/DEPLOIEMENT.md. Checklist : `.claude/agents/sec.md` § Checklist.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle** ; texte secondaire `craie-2` / `craie-3`, jamais
  `text-craie*/NN`. rules/theme-colors ; CHARTE § Palette. Garde `themeBoundary` (couleur en dur,
  `ALPHA_TEXTE`, parité des thèmes). Français dans `labels.ts` ; routes lazy ; cibles ≥ 48 px.
- Refonte : l'étude = l'état, la charte = la règle **actuelle** (choix « validés » non gravés).
- Fakes, jamais de mocks ; `lint:fix` sur `src tests` seulement (rules/testing, biome) ;
  test d'invalidation : un seul `QueryClient` (CONVENTIONS § 11).
- Pièges : `61b60ac` (CLAUDE § Notes) ; `max-age`, `headers`, `id: '/'`, `ignore`, `REMPLIR`
  (CLAUDE § Déploiement) ; Rolldown (DEPLOIEMENT) ; `<StrictMode>`, `partie:mode` (PLAN § 6) ;
  `test.env.TZ` (CONVENTIONS § 11-12). Barre du bas : police système max **avant `firebase:deploy`**.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat | CLAUDE § Règles du jeu |
| Événement, Dexie, sauvegarde | rules/persistence ; CONVENTIONS § 13 ; PLAN § 1.3 |
| Port d'appareil ; horloge ; nouveau mode | DS ; CONVENTIONS § 5, 7, 13, 14 |
| Écran, route, Nouvelle partie, `CartePartie` | rules/frontend-react ; CHARTE ; CONVENTIONS § 8-10, 13 ; `chemins.ts` |
| Couleur, texte secondaire, thème | rules/theme-colors ; CHARTE § Palette ; `themeBoundary.test.ts` |
| Typo, mouvement, refonte | CHARTE § Typographie, § Mouvement ; étude ; `docs/request/charte-typo-mouvement.md` |
| Annulation (pause de 1 s, non gravée) | `usePauseAnnulation.ts` ; `docs/lots/annuler-double-tap/` |
| Nom de partie ; libellé, politique | DS ; glossary ; `labels.ts` (`SECTIONS_CONFIDENTIALITE`) |
| Test ; lint ; build, SW ; état | rules/testing, biome ; CONVENTIONS § 11-12 ; DEPLOIEMENT ; PLAN § 0, 4, 6 |

## Surfaces gravées
Un lot qui en touche une : **pas de `light`**, `high`, départ à `archi-authority` (`orchestrate`
§ Niveaux fait foi) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects.
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (`name?` compris), schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé.
5. Une décision de DS (stockage, installation, politique, Nouvelle partie, double out, **nom de
   partie**, **`Services.clock`**, **« Abandonnée » dérivée**), § Règles du jeu, ou § Charte
   « ce qui ne s'y discute pas ». Plancher `craie-3` : non listé (lots `light`).

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée**
(écart du code = défaut). **Exceptions délibérées, à ne pas « corriger »** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` (les seules) ; `craie-decor` sans contraste | couleur en dur ; plancher | `themeBoundary.test.ts:36` ; CHARTE § Palette |
| `Services.devices` (dont **`persistentStorage`**, **`appInstallation`**) | UI → use cases | `container.ts:81-107` |
| **`Services.clock`** : même instance que les use cases, lue par l'UI | garde `horlogeBoundary` | `container.ts:135-143` |
| **`matchStatus`** : seul import de `use-cases/` par l'UI, pure | UI → use cases | `summarize.ts:33` ; `AccueilEcran.tsx:5` |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee` ; clés `partie:*` | valeur persistée jamais renommée | `MatchEvent.ts:30-38` |
| **Double out : décoché à l'écran, `true` dans le domaine** | ne pas aligner | `x01/config.ts:68` ; `useNouvellePartie.ts:222,296` |
| **Nom par défaut jamais écrit**, clé `name` absente, jamais `undefined` | un défaut se persiste | `MatchEvent.ts:44-85,132-138` |
| Firebase **Hosting** seul ; **`.well-known`** publié ; **`REMPLIR`** sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `nouvelle-partie/*` sous un seul `lazy()` | routes lazy | `App.tsx:6,10,28-31` |
| Fichier, `Blob`, `matchMedia` dans l'UI ; `theme_color` figé | ports ; `data-theme` | PLAN § 2, 6 |
| `legsForBestOf` survit ; locales françaises dans `core` ; progression garde `0` | best of N ; cœur anglais ; `pourcent()` | DS ; CONVENTIONS § 1, 9 |

## Décisions ouvertes
1. Sync cloud / classement (lot 6) ; i18n FR seul ; jeux restants. CLAUDE § Décisions ouvertes 3-5.
2. Lot 5b : un exercice, pas de suivi. `/historique/:id`, `/joueurs/:id` jamais faits ; vrai
   iPhone, `persist()`, installation ; voix ; `play-store-twa`. PLAN § 0, 6 ; DEPLOIEMENT.
3. **Refonte visuelle** (étude, 13 lots) : lots 1 `annuler-double-tap` et 2 `charte-contraste`
   faits ; 3 `charte-typo-mouvement` cadré (intake `Validé`, Architecture non commencée) ; 4-13
   à cadrer. Halos, dégradé de l'enseigne, tapis : le lot 3 les retire, **non gravé** avant
   livraison. Lot 13 `volee-partielle` (volée perdue au rechargement, `dartsEnCours` en
   `useState`) : `high`, non décidé.
4. Relectures à l'écran en attente (PLAN § 0) : `nouvelle-partie-en-etapes`, `nom-de-partie`,
   `accueil-parties-recentes` (barre à police max). `annuler-double-tap`, `charte-contraste` :
   demandée, tenue non écrite.
5. Prochain audit : R2, R3, R4, N2, **T1, R7**, exports français de `backupSchema.ts`, erreurs
   de listes, « 1 sorties ». PLAN § 0.
6. Lot « sortie libre » : **reporté**, sans renvoi dans `CLAUDE.md` ; l'étude vise le 180 au
   lot 11. PLAN § 0 n° 4 (constat 12).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 12 | Moyenne | **Report décidé.** Sans double out (**défaut de l'écran**), suggestion jusqu'à 180, rien sous 2 ; `CLAUDE.md`, glossaire : double out seul | `checkout.ts:83-84` ; `CLAUDE.md:243-254` ; `glossary.md:17-18` ; PLAN `:81-86` | Règle muette |
| 3 | Moyenne | Règles de l'entraînement absentes de `CLAUDE.md` ; « 41 à 170 » non confirmée | PLAN `:466-492` | Hors surface 5 |
| 11 | Moyenne | Import : persistence « validé entièrement avant la moindre écriture », sec « pas d'écrasement silencieux » ; code : validation **dans la boucle d'écriture**, écrase un identifiant connu ; `createdAt` sans borne | `ManageBackupUseCase.ts:42-73` ; `persistence.md:27-28` ; `sec.md:62-65` ; PLAN `:34` | À trancher |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » ; `window`, `Math.random` du cœur sans garde (0 en code) | `CLAUDE.md:117-119` ; `biome.json:58-68` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` n'importe aucune classe `*UseCase` » (R7) | `CONVENTIONS.md:144-148` ; `hexagonalBoundary.test.ts:59-72` | Non détecté |
| 15 | Basse | T1 : texte des règles courtes des cartes sans test | `CONVENTIONS.md:319-320` ; `labels.ts:481-490` | Choix utilisateur |
| 16 | Basse | **Nouveau.** `usePauseAnnulation.ts` absent de l'arbre et de « 10 hooks » ; `frontend-react.md` | `CONVENTIONS.md:355,409-415` | Doc périmée |
| 17 | Basse | **Nouveau.** PLAN § 0 « 765 tests », § 6 sans journal de `annuler-double-tap` (803) ni `charte-contraste` (805) | PLAN `:19` | Doc périmée |
| 18 | Basse | **Nouveau.** `theme-colors.md` ne cite que `text-craie/NN` et `-vive/NN` ; le garde attrape aussi `-2`, `-3`, `-decor` | `theme-colors.md:16` ; `themeBoundary.test.ts:69` | Plus étroit que le garde |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (→ `useX01.ts`) ; PLAN § 2 sans `PreviewTourDuMondeVisit` ; PLAN § 6 lot 1 « QUE `MatchStarted` » | `CLAUDE.md:115` ; PLAN `:207-241,732,875` | Doc périmée |
| 5 | Basse | First 9 : « 9 premières fléchettes » vs code « 3 premières volées » | `CLAUDE.md:268` ; `stats.ts:14,133-137` | Sauf volée courte |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:75,413` | Incomplète |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Défaut disparu |

## Questions et limites
- Rien de gravé sacrifié. Entraînement, #12, #11 : intention non tranchée. Accueil (mise en page)
  **non gravé**. Plancher `craie-3` hors surfaces : **interprétation**.
- Étude « minimum 0,7 rem », lot 3 « 0,75 rem » : le lot fera foi. Charte non confrontée à
  `index.css` (contrastes non recalculés).
- Non relus : PLAN § 6 hors lots 1, 5b, Play Store, trois derniers ; `docs/lots/*` (hors
  `06-echanges`) ; DEPLOIEMENT hors titres ; PLAN `:1770-1772` non revérifiés.
- Connus : `successPercent` sans garde « — » (`ResumeEntrainementEcran.tsx:50`) ; aucun
  `ErrorBoundary` dans `src/`.

## Traçabilité
- **Reportés** (revérifiés, lignes à jour) : 2, 3, 4, 5, 7, 10, 11, 12, 14, 15. **Nouveaux** : 16,
  17, 18. **Retiré** : aucun (antérieurs : #1, #6, #8, #9, #13). `/refresh-architecture`.
