# Contexte d'architecture
> **Index**, pas une source de vérité. **DS** = `CLAUDE.md` § Décisions structurantes ;
> **PLAN** = `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-18 (19e passe), scope `all`, branche `lot/annulation-volee` rebasée sur
  `main` = `f545419` (`vocabulaire-anglais`) : les deux lots y sont.
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte, PLAN § 0 / 4 / 6, ancien index ; code
  vérifié par recherche. Tests non relancés (PLAN : 1571).

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; ni Firebase (app), auth, réseau ; Dexie ; `/confidentialite` ; profils locaux + export JSON ; `MatchEvent[]` ; fléchette par fléchette | en vigueur | DS |
| « Saisie hybride » / mode rapide (retirée après usage, `d531a7e`) ; « Best of N » → « premier à N » ; accent par mode → laiton unique ; « Ordre aléatoire » → « Tirer au sort » ; « Les règles en entier » → livre | renversées | DS ; Notes ; glossary |
| **Annulation fléchette par fléchette, sortie confirmée** (`annulation-volee`) : `ReopenedVisit`, volée rouverte **non persistée** ; `BoiteConfirmation` avant toute écriture, voix ou célébration ; jamais sur un bust ni à l'entraînement ; fermer = *Corriger* | en vigueur | DS ; CONV. |
| **Règles au livre ouvert** : `<dialog>` par-dessus l'écran, jamais une route ; règle changée = rubrique mise à jour | en vigueur | DS ; CONV. § 9, 13 |
| **Rejouer** : 3 configurations **lues sur l'historique, rien de stocké** ; **nom jamais repris** | en vigueur | DS |
| **Stockage persistant** en une phrase, **jamais en voyant** ; **dernier export** `sauvegarde:dernier-export` | en vigueur | DS ; CHARTE § Les Réglages |
| **Vocabulaire** : « checkout » jamais « sortie » à l'écran ; « bust », « checkout » dits en `en-US` (`Announcer.say(Annonce)`, segments par `Langue` composés dans `labels.ts`) ; identifiants `sortie*` inchangés | en vigueur | DS ; glossary |
| Checkouts **sur un double / libre** (`checkoutRange`) ; règles de l'**entraînement** | gravées | CLAUDE § Règles du jeu |
| Double out écran ≠ domaine ; « manche » ; route par étape ; nom de partie (étape 2) ; « Abandonnée » dérivée | en vigueur | DS ; glossary |
| Quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query hors match ; Biome seul ; `AppInstallation` ; `id: '/'` | en vigueur | DS ; Déploiement |
| Thème défaut sombre ; angle vif ; zones lecture / saisie ; plancher `craie-3` | en vigueur | DS ; CHARTE |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes 1-3 |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **uniquement** dans `container.ts` ; capacité externe =
  **adapter derrière un port** ; **UI → use cases** ; aucun import entre modes (CLAUDE § Règle
  d'architecture ; CONV. § 13-14).
### Règles de jeu : pointées, jamais énoncées
- **X01** : § Règles du jeu X01. Délicats : bust, double in / out, checkouts, bogey numbers, legs et
  sets, First 9, % doubles.
- **Tour du monde** : § Règles du Tour du monde. Délicats : fin du tour de table, départage, nul.
- **Cricket** : § Règles du Cricket. Délicats : surplus, cibles ignorées, victoire, cut-throat.
- **Entraînement** : § Règles de l'entraînement. Délicats : plage, tirage écrit, une volée par
  manche, hors statistiques. La feuille (`regles*`) n'est pas une source.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, persisté jamais renommé, facultatif absent = **clé
  absente**, `backupSchema` au même lot (rules/persistence). Jamais écrits :
  « Abandonnée », `legsPlayed`, nom par défaut, classement, configuration rejouable, **volée
  rouverte**.
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; `/confidentialite` tenue vraie
  (DS) : clé `localStorage` ou donnée nouvelle = texte **et date** de `SECTIONS_CONFIDENTIALITE`.
  Seule entrée non fiable : l'import JSON (rules/persistence). Hosting, SW : DEPLOIEMENT.
  Checklist : `.claude/agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` ; **trois familles de jetons
  réservés**, **quatre entrées** de garde : neuf à `FeuilleRegles` / `LivreRegles` (sauf `voile`,
  à part : `FeuilleRegles` + `BoiteConfirmation`), `vert-etat` à `Voyant`, `apercu-*` à
  `VignetteTheme` (rules/theme-colors). Gardes `tests/architecture/*Boundary` ; français dans
  `labels.ts` ; routes lazy ; cibles ≥ 48 px.
- **Annuler / confirmer** (CONV. § 10) : `annuler()` rend `ReopenedVisit` ; `sortieEnAttente`
  **dérivé** de l'aperçu, jamais stocké.
- Boîte par-dessus l'écran : `useModaleAuRetour` (clés `parcours`, `liste`, `regles`,
  `confirmation`) + `useDialogueNatif`, `<dialog>` jamais `flex`/`grid`. **Confirmation**
  (CONV. § 9) : `GARDE_APRES_FERMETURE_MS` = 500 ms après **toute** fermeture (`pavePret()`,
  `services.clock`). Un mode nouveau doit sa feuille et la prop `regles`.
- Parcours : solo testé en dur (CONV. § 13). **Rejouer** : `lancer(mode, valeurs)` seul chemin ;
  `CLE_REJOUER` sous `CLE_HISTORIQUE` (CONV. § 10).
- Planche suivie **à l'identique** ; rebase **avec accord**. Pièges : `61b60ac` (CLAUDE § Notes) ;
  cache, `id: '/'`, `ignore`, `REMPLIR` (§ Déploiement) ; `<StrictMode>`, `partie:mode`, `TZ`.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat ; tests, lint | CLAUDE § Règles du jeu ; rules/testing, biome |
| Événement, Dexie, sauvegarde | rules/persistence ; CONV. § 13 |
| Port d'appareil, horloge ; Réglages, installation | DS ; CONV. § 5, 7 ; CHARTE § Les Réglages ; DEPLOIEMENT |
| Écran ; couleur ; vocabulaire | rules/frontend-react, theme-colors, glossary ; CHARTE § Palette ; CONV. § 8-10 |
| Annulation, confirmation, pavé | DS ; CONV. § 9, 10 ; CHARTE § Saisie, § Palette ; PLAN § 6 |
| Nouvelle partie ; Rejouer ; cartes (`vueCarte` seul) ; livre | DS ; CHARTE § Parcours, § Composants ; CONV. § 9, 10, 13 |
| Statistiques ; match ; nom ; politique ; état | CHARTE § Écran de match ; DS ; `SECTIONS_CONFIDENTIALITE` ; PLAN § 0 |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ `archi-authority` (`orchestrate` § Niveaux) :
1. `src/core/domain/` : règles de jeu, événements, Value Objects (`checkout.ts` compris).
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent`, schéma Dexie et migrations, `backupSchema`.
4. Le service worker (`vite-plugin-pwa`), `firebase.json`, le manifeste.
5. Une décision de DS (stockage, installation, **politique** et ses clés `localStorage`, Nouvelle
   partie, double out, nom de partie, `Services.clock`, « Abandonnée », règles au livre ouvert,
   Rejouer, vocabulaire « checkout » / « manche », voix en-US, **annulation fléchette par fléchette
   et sortie confirmée**), § Règles du jeu (quatre modes, Checkouts, entraînement), ou § Charte
   « ce qui ne s'y discute pas ». Reste de la charte : `light`.

## Préséance et exceptions
**Préséance** : code récent, `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée** (écart
= défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` ; `craie-decor` | couleur en dur ; plancher | `themeBoundary.test.ts:36` |
| Jetons réservés (neuf, `voile`, `vert-etat`, `apercu-*`), **constants à dessein** | jeton général ; thème | rules/theme-colors |
| Titre `laiton` podium, `Modale` en clair (4,40:1) ; bascules 48 px en hauteur : **acceptés** | plancher ; 48 px | CHARTE § Composants |
| `.chargement-balai` seul dégradé | zéro dégradé | CHARTE § Principe |
| `Services.devices`, `Services.clock` | UI → use cases | `container.ts:104-159` |
| `useConfirmationSortie` au-dessus des retours de chargement | `<dialog>` hors chargement | CONV. § 9 |
| `matchStatus`, `rankPlayers`, `leadingPlayers` | UI → use cases | `summarize.ts:33` |
| `'MatchStarted'` ; `installation:ecartee`, `statistiques:joueur`, `sauvegarde:dernier-export`, `partie:*`, `entrainement:sorties` | persisté jamais renommé | `MatchEvent.ts:36-44` ; DS |
| `partie:ordre-aleatoire` orpheline ; flag `shuffle` sans appelant | dette assumée | `useNouvellePartie.ts:55` |
| `DialogueNouveauJoueur` hors historique | boîte au retour | `DialogueNouveauJoueur.tsx:29` |
| Double out : décoché à l'écran, `true` au domaine ; nom par défaut jamais écrit, `name` absent | ne pas aligner ; défaut persisté | `x01/config.ts` ; `nameField.ts` |
| Firebase Hosting ; `.well-known` ; `REMPLIR` sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `docs/maquettes/` hors git ; `Blob`, `matchMedia` dans l'UI ; `theme_color` figé ; `legsForBestOf` ; `0` de progression | lazy ; lint ; ports ; thème ; best of N ; `pourcent()` | PLAN § 2, 6 |

## Décisions ouvertes
1. Sync cloud ; i18n (la voix par langue l'anticipe) ; jeux restants (CLAUDE § Décisions ouvertes 3-5).
2. Lot 5b sans suivi ; `/historique/:id`, `/joueurs/:id` non faits ; lot E (`phrases-victoire`) à fusionner.
3. **Refonte** visuelle (étude, 13 lots ; lot 13 `high`, étude « règles façon DartsOn » attendue) et
   lots en parallèle (worktrees, `orchestrate`) : expérimentaux ; relectures lots 1-12 (PLAN § 0).
4. **Acceptées** (PLAN § 0) : T19, Q3, R1, R2, U1, U2, iPhone, 360 px, police max ; dette
   `DialogueNouveauJoueur` ; « N fois » ≤ 50 parties ; lecture de la base non mesurée.
5. **`annulation-volee`, acceptés** (PLAN § 6) : **N-1** (échec d'écriture après *Valider* : sortie
   en attente, seule « Annuler » débloque, rien perdu) ; volée rouverte et fléchette en attente
   **perdues si l'app se ferme** ; reste suivant **re-tiré** à l'entraînement après correction ;
   boîte masquant la ligne en paysage ; appui hors boîte = *Corriger*. **Reste, vrai téléphone**
   (relu dans Chrome seulement) : noms longs, 3-4 joueurs, cut-throat, bust d'entraînement, double
   tap en paysage, Safari, VoiceOver.
6. **Suite de `rejouer`** : #11 ; lot `high` à proposer (Q5). Prochain audit : PLAN § 0.

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 35 | Moyenne | DS : « checkout » **jamais « sortie »** à l'écran ; la boîte dit « Valider la sortie » (DS le nomme tel quel) | `labels.ts:113` | À trancher |
| 11 | Moyenne | Import : docs « validé avant écriture », code : dans la boucle ; `createdAt` sans borne ; `MISS`, doublons ; `doubleOut` non typé ; journal non projetable : lecture en échec | `ManageBackupUseCase.ts:50-73` ; `backupSchema.ts:33,132` | À trancher |
| 21 | Moyenne | `text-laiton` en clair : 3,5:1 ou 4,4:1. **Podium, `Modale` : accepté (U4)** ; non : liens `text-sm`, `Panneau`, `DialogueNouveauJoueur` | `AccueilEcran.tsx:163` ; `Panneau.tsx:32` | Plancher 4,5:1 |
| 2 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » | `CLAUDE.md:123` ; `biome.json:59` | Relecture |
| 14 | Basse | Aucune garde « `src/ui` sans `*UseCase` » (R7) | `CONVENTIONS.md:144` | Non détecté |
| 26 | Basse | CONV. § 14 : `commun/` omet `Pictogramme`, `FeuilleMatch`, `NomJoueurFeuille`, `CasesVolee` | `CONVENTIONS.md:485` | Partiel |
| 31 | Basse | Rejouer vs 5e mode : test sans `GAME_MODE_IDS`, `switch` sans `never` | `rejouer.test.ts` ; `useNouvellePartie.ts:327` | Non détecté |
| 17 | Basse | PLAN § 0 : « 765 tests verts » orphelin (§ 4 : 1571) | PLAN `:70,764` | Périmée |
| 20 | Basse | « Partie ! », « Manche » (`Cartouche`) hors `labels.ts` | `momentVolee.ts:20` ; `Cartouche.tsx:110` | Convention |
| 24 | Basse | Résumés Cricket / Tour du monde : tri hors `rankPlayers` | `ResumeCricketEcran.tsx:58` ; `ResumeTourDuMondeEcran.tsx:51` | Deux tris |
| 4 | Basse | `CLAUDE.md` cite `useMatch.ts` (→ `useX01.ts`) ; PLAN § 2 sans `ShuffleOrder` | `CLAUDE.md:120` | Périmée |
| 7 | Basse | Charte : « hex hors `index.css` / `couleurs.ts` » ; 3 exceptions | `CHARTE:733` | Incomplet |
| 10 | Basse | Audit `dette` : « absence de `.gitattributes` » ; il existe | `audit/SKILL.md:44` | Périmé |
| 28 | Basse | Garde des jetons : faux négatifs (`border-s/e-`…) | `themeBoundary.test.ts:115` | Non vu |
| 32 | Basse | `captures/reglages.png` périmée ; garde de l'aperçu en liste noire ; `useDernierExport` sans test isolé | PLAN § 0 (D1, N1) | Périmée |
| 33 | Basse | CONV. § 5 muet sur `Annonce` / `Langue` | `CONVENTIONS.md:86` | Non tracé |

## Questions et limites
- Rien de gravé sacrifié. #11, #35 non tranchés. Charte (`light`) : **interprétation**. Non lus :
  planches, captures, contrastes, `docs/lots/*`. Connus : `successPercent` sans « — » ; pas
  d'`ErrorBoundary`. Rejouer, Réglages, voix `en-US` : jamais vus ni entendus sur appareil.

## Traçabilité
- **Reportés** : 2, 4, 7, 10, 11, 14, 17, 20, 21, 24, 26, 28, 31, 32, 33 (#33 réduit à CONV. § 5 :
  l'entrée PLAN existe). **Nouveau** : #35. **Retiré** : #34 (`labels.ts:631` dit « checkouts »).
