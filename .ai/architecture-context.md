# Contexte d'architecture
> **Index**, pas une source de vérité. **DS** = `CLAUDE.md` § Décisions structurantes ;
> **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-17 (18e passe), scope `all`, branche `lot/refresh-architecture-checkout` ;
  `main` = `ccf919b` (`vocabulaire-anglais`, `reglages-par-usage` fusionnés).
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte, DEPLOIEMENT, PLAN § 0 / 2 / 6, ancien index ;
  code ; 1516 tests relancés.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; ni Firebase (app), auth, réseau ; Dexie derrière les ports ; `/confidentialite` ; profils locaux + export JSON ; `MatchEvent[]` ; fléchette par fléchette | en vigueur | DS |
| « Saisie hybride » / mode rapide (retirée après usage, `d531a7e`) ; « Best of N » → « premier à N » ; accent par mode → laiton unique ; « Ordre aléatoire » → « Tirer au sort » ; « Les règles en entier » → feuille par le livre | renversées | DS ; Notes ; glossary ; CHARTE |
| **Règles au livre ouvert** : `<dialog>` par-dessus l'écran, jamais une route ; règle changée = rubrique mise à jour | en vigueur | DS ; CONV. § 9, 13 |
| **Rejouer** (étape 1) : 3 configurations **lues sur l'historique, rien de stocké** ; **nom jamais repris** ; profil supprimé ou non reproductible : écartée | en vigueur | DS ; CHARTE § Rejouer |
| **Stockage persistant** en une phrase, **jamais en voyant** ; **dernier export** : `sauvegarde:dernier-export` (export réussi seul) ; voyants, guide `#installer` | en vigueur | DS ; CHARTE § Les Réglages |
| **Vocabulaire** : « checkout » jamais « sortie » à l'écran ; « bust », « checkout » dits en `en-US` (segments typés, port `Announcer`) ; identifiants `sortie*` inchangés | en vigueur | DS ; glossary |
| Checkouts : **sur un double / libre** (`checkoutRange`, `GetCheckoutRange`) ; règles de l'**entraînement** | en vigueur (gravées) | CLAUDE § Règles du jeu |
| Double out écran ≠ domaine ; « manche » ; route par étape, `BarreEtapes` non interactive ; nom de partie (étape 2) ; « Abandonnée » dérivée | en vigueur | DS ; glossary |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query hors match ; Biome seul ; `AppInstallation` ; `id: '/'` | en vigueur | DS ; Déploiement |
| Thème défaut sombre ; angle vif ; zones lecture / saisie ; plancher `craie-3` ; **trois familles de jetons** | en vigueur | DS ; CHARTE ; theme-colors |
| Refonte visuelle (13 lots) ; lots en parallèle (worktrees) | étude ; expérimental | étude ; `orchestrate` |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **uniquement** dans `container.ts` ; capacité externe =
  **adapter derrière un port** ; **UI → use cases** ; aucun import entre modes (CLAUDE § Règle
  d'architecture ; CONV. § 13-14).
### Règles de jeu : pointées, jamais énoncées
- **X01** : § Règles du jeu X01. Délicats : bust, double in / out, checkouts (sur un double / libre),
  bogey numbers, legs et sets, First 9, % doubles.
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat.
- **Entraînement** : § Règles de l'entraînement. Délicats : plage, tirage écrit au journal, une
  volée par manche, hors statistiques. La feuille (`regles*`) n'est pas une source.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, persisté jamais renommé, facultatif absent = **clé
  absente**, migration + test, `backupSchema` au même lot (rules/persistence). Jamais écrits :
  « Abandonnée », `legsPlayed`, nom par défaut, classement, configuration rejouable.
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; `/confidentialite` tenue vraie
  (DS) : clé `localStorage` ou donnée nouvelle = texte **et date** de `SECTIONS_CONFIDENTIALITE`
  au même lot. Seule entrée non fiable : l'import JSON (rules/persistence). Hosting, SW :
  DEPLOIEMENT. Checklist : `.claude/agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` ; **trois familles de jetons
  réservés** : neuf à `FeuilleRegles` / `LivreRegles`, `vert-etat` à `Voyant`, `apercu-*` à
  `VignetteTheme` (rules/theme-colors). Gardes : `tests/architecture/*Boundary`. Français :
  `labels.ts` ; routes lazy ; cibles ≥ 48 px.
- Voix : `Announcer.say(Annonce)` reçoit des segments par `Langue`, composés dans `labels.ts`
  (`fr()` / `en()`, `LANGUE_DE_BASE`), jamais par le cœur.
- Cartes : `vueCarte` **seul** à ouvrir `MatchSummary` ; une carte = une cible (CONV. § 9).
- Boîte par-dessus l'écran : `useModaleAuRetour` + `useDialogueNatif`, `<dialog>` jamais
  `flex`/`grid` ; un mode nouveau doit sa feuille et la prop `regles` de `BandeauMatch` (CONV. § 9, 13).
- Parcours : tirage par `services.shuffleOrder` ; solo testé en dur (CONV. § 13). **Rejouer** :
  `lancer(mode, valeurs)` seul chemin ; `CLE_REJOUER` sous `CLE_HISTORIQUE` (CONV. § 10).
- Planche suivie **à l'identique** ; rebase **avec accord**. Pièges : `61b60ac` (CLAUDE § Notes) ;
  cache, `id: '/'`, `ignore`, `REMPLIR` (§ Déploiement) ; `<StrictMode>`, `partie:mode`, `TZ`.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat, checkout ; tests, lint | CLAUDE § Règles du jeu ; rules/testing, biome |
| Événement, Dexie, sauvegarde | rules/persistence ; CONV. § 13 ; PLAN § 1.3 |
| Port d'appareil (voix), horloge, mode ; Réglages, installation | DS ; CONV. § 5, 7, 10, 13, 14 ; CHARTE § Les Réglages ; DEPLOIEMENT § Stockage, § Installation |
| Écran, route ; couleur ; vocabulaire | rules/frontend-react, theme-colors, glossary ; CHARTE § Palette ; CONV. § 8-10, 13 |
| Nouvelle partie ; Rejouer ; cartes ; livre | DS ; CHARTE § Parcours, § Composants ; CONV. § 9, 10, 13 |
| Statistiques ; match | CHARTE § Composants, § carte des impacts, § Écran de match, § Saisie ; CONV. § 9 |
| Nom ; politique ; worktrees ; état | DS ; `SECTIONS_CONFIDENTIALITE` ; `orchestrate` ; DEPLOIEMENT ; PLAN § 0 |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ à `archi-authority` (`orchestrate` § Niveaux) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects (`checkout.ts` compris).
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (`name?` compris), schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`) ou `firebase.json` ; le manifeste y est rangé.
5. Une décision de DS (stockage, installation, **politique** et toute clé `localStorage` qu'elle
   cite, Nouvelle partie, double out, nom de partie, `Services.clock`, « Abandonnée », règles au
   livre ouvert, Rejouer, **vocabulaire « checkout » / « manche », voix en-US**), § Règles du jeu
   (quatre modes, Checkouts, entraînement), ou § Charte « ce qui ne s'y discute pas ». Reste de
   la charte : `light`.

## Préséance et exceptions
**Préséance** : code récent, puis `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée**
(écart = défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` seuls ; `craie-decor` | couleur en dur ; plancher | `themeBoundary.test.ts:36` |
| Jetons réservés : neuf (feuille), `vert-etat`, `apercu-*` (**constants à dessein**) | jeton général ; thème | rules/theme-colors |
| Titre `laiton` podium / `Modale` en clair (4,40:1) ; bascules à 48 px en hauteur : **acceptés** | plancher ; 48 px | CHARTE § Composants |
| `.chargement-balai` seul dégradé | zéro dégradé | CHARTE § Principe |
| `Services.devices` ; `Services.clock` (même instance) | UI → use cases | `container.ts:107-112,152-159` |
| `matchStatus`, `rankPlayers`, `leadingPlayers` : seules fonctions de `use-cases/` importées | UI → use cases | `summarize.ts:33` |
| `'MatchStarted'` sous `X01Started` ; `installation:ecartee`, `statistiques:joueur`, `sauvegarde:dernier-export`, `partie:*`, `entrainement:sorties` | persisté jamais renommé | `MatchEvent.ts:29-38` ; DS |
| `partie:ordre-aleatoire` orpheline ; flag `shuffle` sans appelant UI | dette assumée | `useNouvellePartie.ts:55` |
| `DialogueNouveauJoueur` : `<dialog>` hors historique | boîte au retour | `DialogueNouveauJoueur.tsx:29` |
| Double out : décoché à l'écran, `true` dans le domaine | ne pas aligner | `x01/config.ts:68` |
| Nom par défaut jamais écrit ; clé `name` absente, jamais `undefined` | défaut persisté | `MatchEvent.ts:123` |
| Firebase Hosting seul ; `.well-known` publié ; `REMPLIR` sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `docs/maquettes/` hors git et lint | routes lazy ; lint | `App.tsx:6` ; `biome.json:18` |
| `Blob`, `matchMedia` dans l'UI ; `theme_color` figé ; `legsForBestOf` survit ; `0` de progression | ports ; thème ; best of N ; `pourcent()` | PLAN § 2, 6 ; CONV. § 9 |

## Décisions ouvertes
1. Sync cloud ; i18n (la voix par langue l'anticipe) ; jeux restants (CLAUDE § Décisions ouvertes 3-5).
2. Lot 5b sans suivi ; `/historique/:id`, `/joueurs/:id` non faits.
3. **Refonte** : lot 13 `high` ; étude « règles façon DartsOn » attendue ; relectures à l'écran
   lots 1-12 en attente (PLAN § 0).
4. **Acceptées** (PLAN § 0) : T19, Q3, R1, R2, U1, U2, iPhone, textes non dessinés, 360 px,
   police max ; dette `DialogueNouveauJoueur` ; « N fois » limité à 50 parties. **Lot 12, sur
   appareil** : 360 px, contrastes, iPhone ; lecture de la base non mesurée.
5. **Suite de `rejouer`** : #11 ; lot `high` à proposer (Q5). Prochain audit : R2-R4, N2, **R7**,
   exports de `backupSchema.ts`, erreurs de listes, #11, #28, #31, #32.

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 11 | Moyenne | Import : docs « validé avant écriture », code : dans la boucle ; `createdAt` sans borne ; `MISS`, doublons ; `doubleOut` / `doubleIn` non typés ; journal non projetable : lecture en échec | `ManageBackupUseCase.ts:50-73` ; `use-cases/backupSchema.ts:33-38,132-133` | À trancher |
| 21 | Moyenne | `text-laiton` en clair : 3,5:1 ou 4,4:1. **Podium, `Modale` : accepté (U4)** ; non : liens `text-sm`, `Panneau`, `DialogueNouveauJoueur` | `AccueilEcran.tsx:163,171` ; `Panneau.tsx:32` | Plancher 4,5:1 |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » | `CLAUDE.md:122-124` ; `biome.json:59-70` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` sans `*UseCase` » (R7) | `CONVENTIONS.md:144-149` | Non détecté |
| 26 | Basse | CONV. § 14 : `commun/` omet `Pictogramme`, `FeuilleMatch`, `BandeauMatch`, `NomJoueurFeuille`, `CasesVolee` | `CONVENTIONS.md:451-458` | Partielle |
| 31 | Basse | Rejouer vs 5e mode : test sans `GAME_MODE_IDS`, `switch` sans `never`, CONV. § 13 muet | `rejouer.test.ts:119-139` ; `useNouvellePartie.ts:327` | Non détecté |
| 17 | Basse | PLAN § 0 : « 765 tests verts » orphelin (1516 relancés) | PLAN `:64,758` | Périmée |
| 20 | Basse | « Partie ! », « Manche » (`Cartouche`) hors `labels.ts` | `momentVolee.ts:20` ; `Cartouche.tsx:110` | Convention |
| 24 | Basse | Résumés Cricket / Tour du monde : tri à la main, hors `rankPlayers` | `ResumeCricketEcran.tsx:58` ; `ResumeTourDuMondeEcran.tsx:51` | Deux tris |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (→ `useX01.ts`) ; PLAN § 2 sans `PreviewTourDuMondeVisit`, `ShuffleOrder` | `CLAUDE.md:120` ; PLAN `:270-283` | Périmée |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:88` ; `theme-colors.md:76-80` | Incomplet |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Périmé |
| 28 | Basse | Garde des jetons : faux négatifs (`border-s/e-`, `ring-offset-`…) | `themeBoundary.test.ts:114` | Non détecté |
| 32 | Basse | Lot 12 : `captures/reglages.png` périmée ; garde de l'aperçu en liste noire ; `useDernierExport` sans test isolé | PLAN `:2207,37-39` ; `themeBoundary.test.ts:204` | Périmée ; non détecté |
| 33 | Basse | `vocabulaire-anglais` : aucune entrée PLAN ; CONV. § 5 muet sur `Annonce` / `Langue` | PLAN ; `CONVENTIONS.md:92` | Non tracé |
| 34 | Basse | Charte : unité de carte « sorties » (l'écran dit « checkouts ») | `CHARTE:355` ; `labels.ts:634` | Périmée |

## Questions et limites
- Rien de gravé sacrifié. #11 non tranché. Charte (`light`) : **interprétation**. Non lus : planches,
  captures, contrastes, `docs/lots/*` (`vocabulaire-anglais/05-revue.md` : gabarit vide). Connus :
  `successPercent` sans « — » (`ResumeEntrainementEcran.tsx:50`) ; pas d'`ErrorBoundary`. Rejouer,
  Réglages, voix `en-US` jamais vus ni entendus sur appareil (PLAN muet).

## Traçabilité
- **Reportés** : 2, 4, 7, 10, 11, 14, 17, 20, 21, 24, 26, 28, 31, 32 ; recalés : #2, #4, #11, #17.
  **Nouveaux** : #33, #34. **Retirés** : aucun.
