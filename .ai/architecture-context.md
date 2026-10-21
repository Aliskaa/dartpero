# Contexte d'architecture
> **Index**, pas une source de vérité. **DS** = `CLAUDE.md` § Décisions structurantes ; **PLAN** =
> `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-21 (22e passe), scope `all`, branche `lot/killer` (terminé, ni commité ni
  fusionné : accord requis ; `main` = `40ccd65` avec `volee-partielle`, `phrases-victoire`,
  `hors-statistique`).
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, PLAN, charte § Killer, ancien index ; code vérifié.
  Tests non relancés (PLAN : 1929).

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; ni Firebase (app), auth, réseau ; Dexie ; profils locaux + export ; `MatchEvent[]` ; fléchette par fléchette | en vigueur | DS |
| « Saisie hybride » / mode rapide (`d531a7e`) ; « Best of N » → « premier à N » ; accent par mode → laiton ; « Ordre aléatoire » → « Tirer au sort » ; « Règles en entier » → livre ; volée « non persistée » → brouillon ; **« Killer hors v1 »** (Shanghai reste) ; **`/confidentialite` « inchangée »** → mise à jour du 21 octobre 2026 | renversées | DS ; PLAN § 6 |
| **Killer** : `KillerStarted` ; **numéros dans l'ouverture, jamais dans la config** (« Rejouer », « On remet ça » re-tirent) ; tirage à l'étape 2 ; `partie:killer-vies`, `partie:killer-variante` ; **sélection de joueurs coupée et écrite** ; `useKiller` 5e utilisateur de `useVoleeEnCours` ; **import qui projette tous les modes** ; tuile « 2 à 6 joueurs » | en vigueur | DS ; CONV. § 13 |
| **Genre du profil** : `MASCULINE` / `FEMININE`, clé absente = non précisé ; lu **seulement** par les textes du Killer (`genreBoundary`) ; pas de `db.version` | en vigueur | DS ; rules/persistence |
| **Brouillon de volée** : `visitDrafts` (Dexie v3), **hors journal, jamais exporté**, `useVoleeEnCours`, reprise **silencieuse** | en vigueur | DS ; CONV. § 9-11 |
| **Annulation fléchette par fléchette, sortie confirmée** (`BoiteConfirmation` avant toute écriture au **journal**, voix ou célébration) ; **phrase de victoire à la voix** (**même `say`**) ; livre de règles (`<dialog>`, jamais une route) ; Rejouer (**nom jamais repris**) ; stockage persistant | en vigueur | DS ; CONV. § 5, 9 |
| **Vocabulaire** : « checkout » jamais « sortie » ; « bust », « checkout » en `en-US` ; « manche » | en vigueur | DS ; glossary |
| Checkouts **sur un double / libre** (`checkoutRange`) ; règles de l'**entraînement** | gravées | CLAUDE § Règles du jeu |
| Double out écran ≠ domaine ; route par étape ; nom (étape 2) ; « Abandonnée » dérivée ; cinq modes ; stack figée ; Query hors match ; Biome seul ; `AppInstallation` ; `id: '/'` ; thème sombre ; angle vif | en vigueur | DS ; CHARTE ; Déploiement |
| Alfa Slab One ; paysage ; Cricket ; Killer | tranchées | CLAUDE § Décisions ouvertes |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **seul** dans `container.ts` ; capacité externe = **adapter** ;
  **UI → use cases** ; aucun import entre modes (CLAUDE § Règle d'architecture).
### Règles de jeu : pointées, jamais énoncées
- **X01** : § Règles du jeu. Délicats : bust, double in / out, checkouts, bogey numbers, legs et sets,
  First 9, % doubles. **Tour du monde** : fin du tour de table, départage. **Cricket** : surplus, cibles
  ignorées, victoire, cut-throat. **Killer** : § Règles du Killer ; devenir killer, frappe, variante du
  propre numéro, élimination, victoire, classement. **Entraînement** : plage, tirage écrit, une volée par
  manche. La feuille `regles*` n'est pas source.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, persisté jamais renommé, facultatif absent = **clé
  absente**, `backupSchema` au même lot (rules/persistence). **Jamais écrits** : « Abandonnée »,
  `legsPlayed`, nom par défaut, classement, configuration rejouable, phrase ; **numéros du Killer hors
  config**. **Champ de profil facultatif** (`gender`) : non indexé, sans `db.version`. **Brouillon** :
  hors journal, jamais `localStorage` ni exporté.
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; `/confidentialite` tenue vraie (DS) :
  donnée stockée nouvelle (le **genre**) = texte **et date** de `SECTIONS_CONFIDENTIALITE`. Seule entrée
  non fiable : l'import JSON (rules/persistence). Hosting, SW : DEPLOIEMENT. Checklist : `agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` ; **trois familles de jetons réservés**,
  **quatre entrées** de garde ; `rouge-touche` **général**, sert aussi `FeuilleKiller` (rules/theme-colors).
  Gardes `*Boundary` ; ≥ 48 px.
- **Annuler / confirmer** (CONV. § 10) : `sortieEnAttente` **dérivé**. **Volée en cours** : **jamais un
  `useState` de fléchettes** dans un hook de mode, seulement `useVoleeEnCours` ; `poser` hors d'un
  updater (`StrictMode`) ; effacement **après** enregistrement. **Voix** (§ 5) : un seul `say` par fin de volée.
- Boîte par-dessus l'écran : `useModaleAuRetour` + `useDialogueNatif`, `<dialog>` jamais `flex`/`grid`
  (CONV. § 9). Un mode nouveau : sa feuille + `regles`.
- **Un mode nouveau, quatre pièges du lot `killer`** (CONV. § 13) : `default` typé `never` de la couture
  **et de `PartieEcran`** ; **maximum de joueurs par mode** (`max`, `rejouer.maxJoueurs`) ;
  `lancerPartie` à **2 joueurs** ; `hexagonalBoundary` lit les vrais dossiers.
- Tests (CONV. § 11) : rechargement = **mêmes services, nouveau `QueryClient`**. Pièges : `61b60ac`,
  `id: '/'`, `ignore`, `REMPLIR`, `<StrictMode>`, `TZ`.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat ; tests, lint | CLAUDE § Règles du jeu ; rules/testing, biome |
| Événement, Dexie, sauvegarde, brouillon, profil | rules/persistence ; CONV. § 13 ; DEPLOIEMENT § Dexie |
| Port d'appareil, horloge ; installation | DS ; CONV. § 5, 7 ; DEPLOIEMENT |
| Écran ; couleur ; vocabulaire | rules/frontend-react, theme-colors, glossary ; CHARTE |
| Annulation, confirmation, volée, voix ; livre ; cartes | DS ; CONV. § 5, 9-11 ; CHARTE § Saisie |
| Nouveau mode ; Killer, genre ; Nouvelle partie, Rejouer | DS ; CONV. § 13, 14 ; CHARTE § Killer, Parcours ; PLAN § 6 |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ `archi-authority`.
1. `src/core/domain/` : règles de jeu, événements, Value Objects (`checkout.ts`, `PlayerGender`).
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (dont `KillerStarted`), **profil** (`Player.gender`), schéma Dexie
   (`visitDrafts` v3), `backupSchema`, ports `VisitDraftRepository` / `ManageVisitDraft`.
4. Le service worker (`vite-plugin-pwa`), `firebase.json`, le manifeste.
5. Une décision de DS (stockage, installation, **politique** et ses clés `localStorage`, Nouvelle partie,
   double out, nom, `Services.clock`, « Abandonnée », livre, Rejouer, vocabulaire, voix, annulation,
   brouillon, **Killer**, **genre**), § Règles du jeu, ou § Charte « ce qui ne s'y discute pas ». Reste
   de la charte : `light`.

## Préséance et exceptions
**Préséance** : code récent, `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée** (écart
= défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` ; `craie-decor` ; jetons réservés **constants à dessein** | couleur en dur ; plancher ; jeton général | `themeBoundary.test.ts:36` ; rules/theme-colors |
| Titre `laiton` podium, `Modale` en clair (4,40:1) ; `.chargement-balai` seul dégradé | plancher ; zéro dégradé | CHARTE |
| `Services.devices`, `Services.clock` ; `matchStatus`, `rankPlayers`, `leadingPlayers` | UI → use cases | `container.ts:116` ; CONV. § 8 |
| `useConfirmationSortie` au-dessus du chargement ; **`demander()` depuis un effet** après rechargement | `<dialog>` hors chargement ; « seulement dans un clic » | CONV. § 9 |
| `'MatchStarted'`, **`KillerStarted`** ; `installation:ecartee`, `statistiques:joueur`, `sauvegarde:dernier-export`, `partie:*` (dont **`partie:killer-*`**), `entrainement:sorties` ; **`MASCULINE`, `FEMININE`** ; `visitDrafts`, `matchId`, `visitCount`, `darts` | persisté jamais renommé | `MatchEvent.ts:38-46` ; DS |
| `partie:ordre-aleatoire` orpheline ; flag `shuffle` sans appelant ; `DialogueNouveauJoueur` ; double out décoché à l'écran, `true` au domaine ; nom par défaut jamais écrit | dette ; boîte au retour ; ne pas aligner | `useNouvellePartie.ts` ; `x01/config.ts` ; CONV. § 9 |
| Brouillon : sortie en attente écrite avant *Valider* ; effacement en échec (import, suppression) **refuse** | « rien avant Valider » (journal seul) | DS |
| Genre lu hors des textes du Killer = défaut ; sélection coupée **écrite** (5e, 6e joueurs perdus au X01) | liste fermée de fichiers ; « ne rien perdre » | `genreBoundary.test.ts` ; DS |
| Firebase Hosting ; `.well-known` ; `REMPLIR` | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `Blob`, `matchMedia` dans l'UI ; `theme_color` figé ; `legsForBestOf` ; `0` de progression | lazy ; ports ; thème ; best of N ; `pourcent` | PLAN § 6 |

## Décisions ouvertes
1. Sync cloud ; i18n ; jeux restants (Shanghai, Around the Clock ; CLAUDE § Décisions ouvertes 3-5).
   `/historique/:id`, `/joueurs/:id` non faits ; `nouveaux-modes` (PLAN § 4) à cadrer par `/intake`.
2. **`killer`** : terminé, relecture **téléphone** à faire : numéro à 38 / 32 px à 2-3 m, 6 lignes en
   paysage, rangée à 5 colonnes à 360 px, `rouge-touche` sur le repère, ligne « Genre » ouverte
   (PLAN § 6). Acceptés : `docs/lots/killer/`.
3. **`volee-partielle`**, **`phrases-victoire`** fusionnés. **Acceptés** : R1, R3, C1. **Reste,
   téléphone** : R2 (Chrome saute l'entrée empilée), `history.state` d'iOS ; écoute de « — », « ? », « . ».
4. **Refonte** visuelle (lot 13 `high`), lots en parallèle : expérimentaux. **Suite de `rejouer`** :
   #11 ; lot `high` à proposer.
5. **Acceptées** (PLAN § 0, téléphone le 19 octobre) : T19, Q3, R1, R2, U1, U2. Restent : dette
   `DialogueNouveauJoueur` ; « N fois » ≤ 50 parties ; lecture de la base **non mesurée** ;
   `annulation-volee` : **N-1**, reste **re-tiré** à l'entraînement, boîte masquant la ligne (paysage).

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 35 | Moyenne | DS : « checkout » **jamais « sortie »** ; la boîte dit « Valider la sortie » (DS la nomme) | `labels.ts:128` | À trancher |
| 11 | Moyenne | Import : rules « validé avant écriture », code : entrée par entrée. Projection de tous les modes **faite** ; restent atomicité entre parties, `createdAt` sans borne haute, `MISS` et doublons de parcours, `doubleOut` non typé | `ManageBackupUseCase.ts:77-84` ; `backupSchema.ts:42, 156, 264` | À trancher |
| 21 | Moyenne | `text-laiton` en clair : 3,5:1 ou 4,4:1. **Podium, `Modale` : accepté (U4)** ; non : liens `text-sm`, `Panneau`, dialogue joueur | `AccueilEcran.tsx:163` | 4,5:1 requis |
| 2, 7 | Basse | Docs trop fortes : `noRestrictedImports` = 7 paquets, pas « les API navigateur » (2) ; charte « hex hors `index.css` / `couleurs.ts` », 3 exceptions (7) | `CLAUDE.md:133` ; `biome.json:59` ; `CHARTE:88` | Relecture |
| 4, 10, 17, 32, 36 | Basse | Docs périmées : `useMatch.ts` absent (4) ; « pas de `.gitattributes` » (10) ; « 765 tests » (17) ; `reglages.png`, garde d'aperçu en liste noire, `useDernierExport` sans test (32) ; PLAN § 0 sans `killer`, `volee-partielle`, `phrases-victoire`, « Killer restent », « lot E à fusionner », rien pour `hors-statistique` (36) | `CLAUDE.md:131` ; PLAN `:1345, :67, :2266, :41, :150, :2325` | Périmée |
| 14, 28 | Basse | Gardes absentes : `src/ui` sans `*UseCase` (14) ; jetons `border-s/e-` (28) | `CONVENTIONS.md:152` ; `themeBoundary.test.ts:115` | Non détecté |
| 20, 24, 26 | Basse | « Partie ! » hors `labels.ts` (20) ; résumés Cricket / Tour du monde : tri hors `rankPlayers` (24) ; CONV. § 14 : arbre sans `killer/`, `KillerStarted`, `Pictogramme`, `FeuilleMatch`, `NomJoueurFeuille`, `CasesVolee`, `ManageVisitDraft`, `VisitDraftRepository` (26) | `momentVolee.ts:20`, `KillerEcran.tsx:140` ; `ResumeCricketEcran.tsx:58` ; `CONVENTIONS.md:499` | Convention |

## Questions et limites
- Rien de gravé sacrifié. #11, #35 non tranchés. Charte : **interprétation**. Non lus : planches, captures,
  `docs/lots/*` (sauf `killer/` par recherche). Connus : `successPercent` sans « — » ; pas
  d'`ErrorBoundary`. Voix, phrases, Killer : jamais sur téléphone.

## Traçabilité
- **Reportés** (revérifiés) : 2, 4, 7, 10, 11 (précisé), 14, 17, 20 (réduit), 21, 24, 26 (élargi), 28, 32,
  35, 36 (réécrit). **Retirés** : **31** garde de Rejouer (`rejouer.ts:25-89`, `never` aux
  `useNouvellePartie.ts:215`) ; garde « un mode n'importe jamais un autre »
  (`hexagonalBoundary.test.ts:116`) ; de #11 « journal non projetable » ; de #20 « Manche » ; de #36
  « § 6 sans `volee-partielle` ».
