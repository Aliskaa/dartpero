# Contexte d'architecture
> **Index**, pas une source de vérité. **DS** = `CLAUDE.md` § Décisions structurantes ; **PLAN** =
> `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-19 (21e passe), scope `all`, branche `lot/volee-partielle` (ni commité ni
  fusionné : accord requis ; `main` = `a4b19b9`, lots B et E fusionnés).
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, `DEPLOIEMENT`, PLAN, ancien index ; code vérifié.
  Tests non relancés (PLAN § 4 : 1685).

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; ni Firebase (app), auth, réseau ; Dexie ; `/confidentialite` ; profils locaux + export JSON ; `MatchEvent[]` ; fléchette par fléchette | en vigueur | DS |
| « Saisie hybride » / mode rapide (`d531a7e`) ; « Best of N » → « premier à N » ; accent par mode → laiton ; « Ordre aléatoire » → « Tirer au sort » ; « Règles en entier » → livre ; **volée rouverte « non persistée »** → brouillon | renversées | DS ; glossary |
| **Brouillon de volée** (`volee-partielle`) : `visitDrafts` (Dexie v3), **hors journal, jamais exporté**, `useVoleeEnCours`, reprise **silencieuse**, boîte de sortie rouverte | en vigueur | DS ; CONV. § 9-11 |
| **Annulation fléchette par fléchette, sortie confirmée** : `BoiteConfirmation` avant toute écriture au **journal**, voix ou célébration ; fléchette en attente **déjà au brouillon** (ne pas « réparer ») ; jamais sur un bust ni à l'entraînement | en vigueur (révisée) | DS ; CONV. |
| **Phrase de victoire à la voix** : celle du résumé, rien de stocké, **même `say`**, victoire du **match** seule | en vigueur | DS ; CONV. § 5 |
| **Livre de règles** (`<dialog>`, jamais une route) ; **Rejouer** (lu sur l'historique, **nom jamais repris**) ; **stockage persistant** jamais en voyant ; `sauvegarde:dernier-export` | en vigueur | DS ; CONV. § 9 |
| **Vocabulaire** : « checkout » jamais « sortie » à l'écran ; « bust », « checkout » en `en-US` ; « manche » | en vigueur | DS ; glossary |
| Checkouts **sur un double / libre** (`checkoutRange`) ; règles de l'**entraînement** | gravées | CLAUDE § Règles du jeu |
| Double out écran ≠ domaine ; route par étape ; nom (étape 2) ; « Abandonnée » dérivée ; quatre modes (Killer, Shanghai hors v1) ; stack figée ; Query hors match ; Biome seul ; `AppInstallation` ; `id: '/'` ; thème sombre par défaut ; angle vif ; `craie-3` | en vigueur | DS ; CHARTE ; Déploiement |
| Alfa Slab One ; paysage ; Cricket | tranchées | CLAUDE § Décisions ouvertes |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **seul** dans `container.ts` ; capacité externe = **adapter
  derrière un port** ; **UI → use cases** ; aucun import entre modes (CLAUDE § Règle d'architecture).
### Règles de jeu : pointées, jamais énoncées
- **X01** : § Règles du jeu X01. Délicats : bust, double in / out, checkouts, bogey numbers, legs et
  sets, First 9, % doubles. **Tour du monde** : fin du tour de table, départage. **Cricket** : surplus,
  cibles ignorées, victoire, cut-throat. **Entraînement** : plage, tirage écrit, une volée par manche,
  hors statistiques (§ Règles de chaque mode ; la feuille `regles*` n'est pas une source).
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, persisté jamais renommé, facultatif absent = **clé
  absente**, `backupSchema` au même lot (rules/persistence). Jamais écrits : « Abandonnée »,
  `legsPlayed`, nom par défaut, classement, configuration rejouable, **phrase**. **Brouillon** : hors
  journal et `backupSchema`, **jamais exporté**, jamais `localStorage` ; effacé à l'enregistrement, à
  la suppression, à l'import qui **remplace** la partie (DEPLOIEMENT § Mise à jour du schéma Dexie).
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; `/confidentialite` tenue vraie
  (DS) : clé `localStorage` ou donnée nouvelle = texte **et date** de `SECTIONS_CONFIDENTIALITE`
  (brouillon : inchangée, PLAN § 4). Seule entrée non fiable : l'import JSON (rules/persistence).
  Hosting, SW : DEPLOIEMENT. Checklist : `.claude/agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` ; **trois familles de jetons
  réservés**, **quatre entrées** de garde ; `rouge-touche` **général** (rules/theme-colors). Gardes
  `*Boundary` ; ≥ 48 px.
- **Annuler / confirmer** (CONV. § 10) : `annuler()` rend `ReopenedVisit` ; `sortieEnAttente`
  **dérivé**. **Volée en cours** : **jamais un `useState` de fléchettes** dans un hook de mode,
  seulement `useVoleeEnCours` ; `poser` hors d'un updater (`StrictMode`) ; effacement **après**
  enregistrement réussi. **Voix** (CONV. § 5) : un seul `say` par fin de volée.
- Boîte par-dessus l'écran : `useModaleAuRetour` + `useDialogueNatif`, `<dialog>` jamais `flex`/`grid`.
  **Confirmation** (CONV. § 9) : 500 ms après **toute** fermeture ; au rechargement, réconciliée
  **une fois, à `pret`**. Un mode nouveau : sa feuille + la prop `regles`.
- Tests (CONV. § 11) : rechargement = **mêmes services, nouveau `QueryClient`**. Planche **à
  l'identique** ; rebase **avec accord**. Pièges : `61b60ac` ; `id: '/'`, `ignore`, `REMPLIR` ;
  `<StrictMode>`, `partie:mode`, `TZ`.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat ; tests, lint | CLAUDE § Règles du jeu ; rules/testing, biome |
| Événement, Dexie, sauvegarde, brouillon | rules/persistence ; CONV. § 13 ; DEPLOIEMENT § Dexie |
| Port d'appareil, horloge ; Réglages, installation | DS ; CONV. § 5, 7 ; CHARTE § Réglages ; DEPLOIEMENT |
| Écran ; couleur ; vocabulaire | rules/frontend-react, theme-colors, glossary ; CHARTE § Palette |
| Annulation, confirmation, volée en cours ; voix | DS ; CONV. § 5, 9-11 ; CHARTE § Saisie ; PLAN § 4, 6 |
| Nouvelle partie ; Rejouer ; cartes ; livre ; statistiques ; politique | DS ; CHARTE § Parcours, Composants, Écran de match ; CONV. § 9, 13 |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ `archi-authority` :
1. `src/core/domain/` : règles de jeu, événements, Value Objects (`checkout.ts` compris).
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent`, schéma Dexie et migrations (**`visitDrafts`** v3 : `matchId`,
   `visitCount`, `darts`), `backupSchema`, ports `VisitDraftRepository` / `ManageVisitDraft`.
4. Le service worker (`vite-plugin-pwa`), `firebase.json`, le manifeste.
5. Une décision de DS (stockage, installation, **politique** et ses clés `localStorage`, Nouvelle
   partie, double out, nom, `Services.clock`, « Abandonnée », livre de règles, Rejouer, « checkout » /
   « manche », voix en-US, **annulation et sortie confirmée**, **phrase de victoire**, **brouillon
   de volée**), § Règles du jeu, ou § Charte « ce qui ne s'y discute pas ». Reste de la charte : `light`.

## Préséance et exceptions
**Préséance** : code récent, `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée** (écart
= défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` ; `craie-decor` ; jetons réservés **constants à dessein** | couleur en dur ; plancher ; jeton général | `themeBoundary.test.ts:36` ; rules/theme-colors |
| Titre `laiton` podium, `Modale` en clair (4,40:1) ; bascules 48 px en hauteur ; `.chargement-balai` seul dégradé | plancher ; 48 px ; zéro dégradé | CHARTE |
| `Services.devices`, `Services.clock` ; `matchStatus`, `rankPlayers`, `leadingPlayers` | UI → use cases | `container.ts:116` ; CONV. § 8 |
| `useConfirmationSortie` au-dessus des retours de chargement ; **`demander()` depuis un effet** après rechargement | `<dialog>` hors chargement ; « seulement dans un clic » | CONV. § 9 |
| `'MatchStarted'` ; `installation:ecartee`, `statistiques:joueur`, `sauvegarde:dernier-export`, `partie:*`, `entrainement:sorties` ; **`visitDrafts`, `matchId`, `visitCount`, `darts`** | persisté jamais renommé | `MatchEvent.ts:37-45` ; DS |
| `partie:ordre-aleatoire` orpheline ; flag `shuffle` sans appelant ; `DialogueNouveauJoueur` | dette ; boîte au retour | `useNouvellePartie.ts` ; CONV. § 9 |
| Double out : décoché à l'écran, `true` au domaine ; nom par défaut jamais écrit | ne pas aligner | `x01/config.ts` ; `nameField.ts` |
| Brouillon : sortie en attente écrite avant *Valider* ; écriture en échec jamais bloquante ; effacement en échec (import, suppression) **refuse** | « rien avant Valider » (journal seul) | DS |
| Firebase Hosting ; `.well-known` ; `REMPLIR` sans contournement | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `Blob`, `matchMedia` dans l'UI ; `theme_color` figé ; `legsForBestOf` ; `0` de progression | lazy ; ports ; thème ; best of N ; `pourcent` | PLAN § 6 |

## Décisions ouvertes
1. Sync cloud ; i18n ; jeux restants (CLAUDE § Décisions ouvertes 3-5). `/historique/:id`,
   `/joueurs/:id` non faits.
2. **`volee-partielle`** : implémenté, PLAN § 4. **Acceptés** : R1 (ABA de `visitCount`), R3
   (deux onglets), C1, mutations T1-T6 non faites. **Reste, téléphone** : R2 (Chrome saute l'entrée
   empilée), `history.state` d'iOS, bref spinner. Voulu : la volée survit à un aller-retour par
   l'Accueil ; fléchettes seules en cours : « Abandonnée » possible.
3. **`phrases-victoire`** fusionné. **Reste, téléphone** : écoute de « — », « ? », « . » après un
   segment `en`, durée après « Checkout » (PLAN § 6).
4. **Refonte** visuelle (lot 13 `high`, étude « règles façon DartsOn » attendue), lots en parallèle
   (worktrees) : expérimentaux. **Suite de `rejouer`** : #11 ; lot `high` à proposer (Q5).
5. **Acceptées** (PLAN § 0) : T19, Q3, R1, R2, U1, U2, iPhone, 360 px, `annulation-volee`, `rejouer`,
   `reglages-par-usage` : **vérifiées sur téléphone le 19 octobre**. Restent : dette
   `DialogueNouveauJoueur` ; « N fois » ≤ 50 parties ; lecture de la base **non mesurée**.
   `annulation-volee` : **N-1** (échec d'écriture après *Valider* : seule « Annuler » débloque) ; reste
   **re-tiré** à l'entraînement ; boîte masquant la ligne en paysage ; « perdues si l'app se ferme » **levée**.

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 35 | Moyenne | DS : « checkout » **jamais « sortie »** ; la boîte dit « Valider la sortie » (DS le nomme) | `labels.ts:127` | À trancher |
| 11 | Moyenne | Import : docs « validé avant écriture », code : dans la boucle (brouillon effacé là aussi) ; `createdAt` sans borne ; `MISS`, doublons ; `doubleOut` non typé ; journal non projetable : lecture en échec | `ManageBackupUseCase.ts:73-84` ; `backupSchema.ts:33` | À trancher |
| 21 | Moyenne | `text-laiton` en clair : 3,5:1 ou 4,4:1. **Podium, `Modale` : accepté (U4)** ; non : liens `text-sm`, `Panneau`, dialogue joueur | `AccueilEcran.tsx:163` | 4,5:1 requis |
| 2, 7 | Basse | Docs trop fortes : `noRestrictedImports` = 7 paquets, pas « les API navigateur » (2) ; charte « hex hors `index.css` / `couleurs.ts` », 3 exceptions (7) | `CLAUDE.md:122-124` ; `biome.json:59` ; `CHARTE:88` | Relecture |
| 4, 10, 17, 32, 36 | Basse | Docs périmées : `useMatch.ts` absent (4) ; `.gitattributes` « absent » (10) ; « 765 tests » orphelin (17) ; `reglages.png`, garde d'aperçu en liste noire, `useDernierExport` sans test (32) ; « lot E reste à fusionner », rien pour `hors-statistique`, § 6 sans `volee-partielle` (36) | `CLAUDE.md:120` ; `audit/SKILL.md:44` ; PLAN `:67, :2311, :822` | Périmée |
| 14, 28, 31 | Basse | Gardes absentes : `src/ui` sans `*UseCase` (14) ; jetons `border-s/e-` (28) ; Rejouer sans `GAME_MODE_IDS` ni `never` (31) | `CONVENTIONS.md:156` ; `themeBoundary.test.ts:115` ; `useNouvellePartie.ts:327` | Non détecté |
| 20, 24, 26 | Basse | « Partie ! », « Manche » hors `labels.ts` (20) ; résumés Cricket / Tour du monde : tri hors `rankPlayers` (24) ; CONV. § 14 omet `Pictogramme`, `FeuilleMatch`, `NomJoueurFeuille`, `CasesVolee`, `ManageVisitDraft`, `VisitDraftRepository` (26) | `momentVolee.ts:20` ; `ResumeCricketEcran.tsx:58` ; `CONVENTIONS.md:497-519` | Convention |

## Questions et limites
- Rien de gravé sacrifié. #11, #35 non tranchés. Charte : **interprétation**. Non lus : planches,
  captures, `docs/lots/*` sauf `volee-partielle/05-revue.md` (**périmée** : Q-T2 tranchée « refuse »
  en DS ; C2 corrigé, `useVoleeEnCours.ts:104`). Connus : `successPercent` sans « — » ; pas
  d'`ErrorBoundary`. Voix, phrases : jamais entendues. CONV. § 13 non relue.

## Traçabilité
- **Reportés** (revérifiés) : 2, 4, 7, 10, 11, 14, 17, 20, 21, 24, 26, 28, 31, 32, 35 ; **ajouté** :
  36. **Retirés** : « volée rouverte non persistée », « perdues si l'app se ferme » (levées) ; « reste,
  vrai téléphone » d'`annulation-volee` (PLAN § 0 : fait) ; « lot E non fusionné ».
