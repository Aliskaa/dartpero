# Contexte d'architecture
> **Index**, pas une source de vérité. **DS** = `CLAUDE.md` § Décisions structurantes ; **PLAN** =
> `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-24 (25e), scope `all`, branche `lot/ecran-miroir` (`cc8e1ec`), lot **non committé** :
  sources modifiées lues sur disque. Worktree
  `lot/shanghai` (`c8623f0`, en cours, hors `main`).
- **Lus** : `CLAUDE.md`, `rules/persistence`, `rules/theme-colors`, `agents/sec.md`, ancien index ;
  `CONVENTIONS`, charte, DEPLOIEMENT par recherche (miroir) ; code par recherche.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; ni Firebase (app), auth, serveur ; Dexie ; profils locaux + export ; `MatchEvent[]` ; fléchette par fléchette | en vigueur | DS |
| **« Pas de réseau » rouvert puis regravé** : une seule exception, le **lien local** de l'écran miroir (WebRTC sans serveur ni STUN/TURN, deux QR, caméra sur bouton) ; aucun `firebase` dans `src/` | regravée | DS ; DEPLOIEMENT § Confidentialité |
| **Écran miroir** : lecture seule, muet ; `watchMatch` **sans dépôt** ; jeton **opaque** ; protocole v1 **jamais persisté** ; un mode nouveau **apporte sa vue miroir** ; `@nuintun/qrcode` par `import()` seul | en vigueur | DS ; CONV. § 5, 13 ; CHARTE |
| « Saisie hybride » / mode rapide (`d531a7e`) ; « Best of N » → « premier à N » ; accent par mode → laiton ; « Ordre aléatoire » → « Tirer au sort » ; « Règles en entier » → livre ; volée « non persistée » → brouillon ; « Killer hors v1 » | renversées | DS ; PLAN § 6 |
| **Killer** : `KillerStarted` ; **numéros dans l'ouverture, jamais dans la config** ; sélection de joueurs coupée et écrite ; import qui projette tous les modes | en vigueur | DS ; CONV. § 13 |
| **Genre du profil** : clé absente = non précisé ; lu **seulement** par les textes du Killer, **et transporté au miroir au Killer seulement** (`genreBoundary`) | en vigueur | DS ; rules/persistence |
| **Carte Évolution** : appui seul, **mesure jamais mémorisée** ; axe ≈ 10 px = écart connu | en vigueur | DS ; CHARTE § Composants |
| **Brouillon de volée** : `visitDrafts` (Dexie v3), **hors journal, jamais exporté**, reprise **silencieuse** | en vigueur | DS ; CONV. § 9-11 |
| **Annulation fléchette par fléchette, sortie confirmée** ; **phrase de victoire** ; livre de règles (jamais une route) ; Rejouer (**nom jamais repris**) ; stockage persistant ; **vocabulaire** (« checkout », « manche ») ; **commentaires** courts | en vigueur | DS ; CONV. § 3, 5, 9 ; glossary |
| Double out écran ≠ domaine ; route par étape ; nom (étape 2) ; « Abandonnée » dérivée ; cinq modes ; stack figée ; Query hors match ; Biome seul ; `AppInstallation` ; `id: '/'` ; thème sombre ; angle vif | en vigueur | DS ; CHARTE |
| Alfa Slab One ; paysage ; Cricket ; Killer | tranchées | CLAUDE § Décisions ouvertes |

## Guidage opérationnel
### Architecture
- CLAUDE § Règle d'architecture : câblage **seul** dans `container.ts`, capacité externe = **adapter**,
  **UI → use cases**, aucun import inter-modes.
- **Écran miroir** (CONV. § 5, 7, 13, 14) : ports `PeerLinks`, `QrScanner`, `QrEncoder` ; **un fichier par
  capacité** ; **ne jamais nommer** WebRTC ni caméra ailleurs, commentaires compris (`reseauBoundary`) ;
  construire un adapter n'ouvre rien (`miroirBoundary`) ; pas de `ui/composants/miroir/`.
### Règles de jeu : pointées, jamais énoncées
- **X01** : § Règles du jeu. Délicats : bust, double in / out, checkouts, bogey numbers, legs et sets,
  First 9, % doubles, **Évolution**. **Tour du monde** : fin du tour de table, départage. **Cricket** :
  surplus, cibles ignorées, victoire, cut-throat. **Killer** : § Règles du Killer ; killer, frappe, variante,
  élimination, victoire, classement. **Entraînement** : § Règles de l'entraînement ; plage, tirage écrit.
  La feuille `regles*` n'est pas source.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, persisté jamais renommé, facultatif absent = **clé
  absente**, `backupSchema` au même lot (rules/persistence). **Jamais écrits** : « Abandonnée »,
  `legsPlayed`, nom par défaut, classement, configuration rejouable, phrase, **courbe**. **Brouillon** :
  hors journal, jamais exporté. **Miroir : rien de persisté** (protocole, jeton, préférence).
### Sécurité
- Sans compte ni serveur (CLAUDE.md § Décisions structurantes) : aucun import de `firebase` dans `src/` ;
  seule exception réseau, le lien local du miroir. `/confidentialite` tenue vraie : donnée, réseau, permission
  ou cookie nouveaux = texte **et date** (`SECTIONS_CONFIDENTIALITE`). Entrées non fiables : l'import JSON
  **et** jetons scannés / messages du miroir (`rules/persistence.md`). Hosting, SW : `docs/DEPLOIEMENT.md`.
  Checklist : `.claude/agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` ; jetons réservés par familles,
  **six entrées** de garde (le miroir en ajoute deux) ; `rouge-touche` **général** (rules/theme-colors).
  ≥ 48 px.
- **Annuler / confirmer** (CONV. § 10) : `sortieEnAttente` **dérivé**. **Volée en cours** : **jamais un
  `useState` de fléchettes**, seulement `useVoleeEnCours` (**un seul** effet nourrit `shareMatch`) ;
  effacement **après** enregistrement. **Voix** (§ 5) : un seul `say` par fin de volée. Boîte par-dessus
  l'écran : `useModaleAuRetour` + `useDialogueNatif`, `<dialog>` jamais `flex`/`grid` (§ 9).
- **Un mode nouveau** (CONV. § 13) : `default` typé `never` de la couture, de `PartieEcran` **et de
  `MiroirEcran`** ; maximum de joueurs ; `lancerPartie` à **2 joueurs** ; `hexagonalBoundary` ; vue miroir.
- Tests (CONV. § 11) : rechargement = **mêmes services, nouveau `QueryClient`**. Pièges : `61b60ac`, `TZ`.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat ; tests, lint | CLAUDE § Règles du jeu ; rules/testing, biome |
| Événement, Dexie, sauvegarde, brouillon, profil | rules/persistence ; CONV. § 13 ; DEPLOIEMENT § Stockage persistant |
| Port d'appareil, horloge ; installation | DS ; CONV. § 5, 7 ; DEPLOIEMENT § Installation |
| Écran ; couleur ; vocabulaire | rules/frontend-react, theme-colors, glossary ; CHARTE |
| Annulation, confirmation, volée, voix ; livre | DS ; CONV. § 5, 9-11 ; CHARTE § Saisie |
| Nouveau mode ; Killer ; Nouvelle partie, Rejouer | DS ; CONV. § 13, 14 ; CHARTE § Killer, Parcours |
| Écran miroir, jumelage, QR | DS ; CONV. § 5, 7, 13 ; CHARTE § Écran miroir |
| Statistiques, Évolution | CLAUDE § Règles du jeu X01 ; DS ; CHARTE § Composants |
| Réseau, caméra, politique, service worker | DS ; DEPLOIEMENT § Service worker, Confidentialité ; `agents/sec.md` |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ `archi-authority`.
1. `src/core/domain/` : règles de jeu, événements, Value Objects (`checkout.ts`, `PlayerGender`).
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (dont `KillerStarted`), **profil** (`Player.gender`), schéma Dexie
   (`visitDrafts` v3), `backupSchema`, ports `VisitDraftRepository` / `ManageVisitDraft`.
4. Le service worker (`vite-plugin-pwa`, dont le groupe `qr`), `firebase.json`, le manifeste.
5. Une décision de DS (**réseau / Firebase**, **écran miroir** et son protocole, stockage, installation,
   **politique** et ses clés `localStorage`, Nouvelle partie, double out, nom, `Services.clock`,
   « Abandonnée », livre, Rejouer, vocabulaire, voix, annulation, brouillon, **Killer**, **genre**,
   **Évolution**), § Règles du jeu, ou § Charte « ne s'y discute pas ». Reste de la charte : `light`.

## Préséance et exceptions
**Préséance** : code récent, `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée** (écart
= défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` ; `craie-decor` ; jetons réservés **constants à dessein** (aperçus, `qr-*`, `sur-rouge`) | couleur en dur ; plancher ; jeton général | `themeBoundary.test.ts` ; rules/theme-colors |
| Titre `laiton` podium, `Modale` en clair ; `.chargement-balai` seul dégradé | plancher ; zéro dégradé | CHARTE |
| `Services.devices` (dont `qrScanner`, `qrEncoder`), `Services.clock` ; `matchStatus`, `rankPlayers`, `leadingPlayers` | UI → use cases | `container.ts` ; CONV. § 7, 8 |
| **Lien WebRTC local et caméra** (`WebRtcPeerLinks.ts`, `CameraQrScanner.ts`) | « pas de réseau » | DS ; `reseauBoundary.test.ts` |
| `useConfirmationSortie` au-dessus du chargement ; **`demander()` depuis un effet** | `<dialog>` hors chargement ; « dans un clic » | CONV. § 9 |
| `'MatchStarted'`, `KillerStarted` ; `installation:ecartee`, `statistiques:joueur`, `sauvegarde:dernier-export`, `partie:*`, `entrainement:sorties` ; `MASCULINE`, `FEMININE` ; `visitDrafts`, `matchId`, `visitCount`, `darts` | persisté jamais renommé | `MatchEvent.ts` ; DS |
| `partie:ordre-aleatoire` orpheline ; flag `shuffle` sans appelant ; `DialogueNouveauJoueur` ; double out décoché à l'écran, `true` au domaine | dette ; boîte au retour ; ne pas aligner | `x01/config.ts` ; CONV. § 9 |
| Brouillon : sortie en attente écrite avant *Valider* ; effacement en échec **refuse** | « rien avant Valider » | DS |
| Genre lu hors Killer = défaut, **sauf** `mirrorProtocol.ts`, `WatchMatch.ts`, `MiroirKiller.tsx` ; sélection coupée **écrite** | fichiers fermés ; « ne rien perdre » | `genreBoundary.test.ts` ; DS |
| Firebase Hosting ; `.well-known` ; `REMPLIR` | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `Blob`, `matchMedia` dans l'UI ; `theme_color` figé ; `legsForBestOf` | lazy ; ports ; thème ; best of N | PLAN § 6 |

## Décisions ouvertes
1. Sync cloud ; i18n ; Around the Clock (CLAUDE § Décisions ouvertes 3-5). **Shanghai** : lot `high` dans
   `lot/shanghai`, hors `main` ; CLAUDE dit encore « Shanghai hors v1 » : à graver à la fusion.
   `tour-du-monde-sens` : demande **à valider**.
2. **`ecran-miroir`** : décision **regravée** (non committée) ; planche acceptée le 2026-10-24. À la
   livraison : politique datée du 24 octobre 2026 (à vérifier dans `labels.ts`), `npm run smoke`
   (chunk `qr-*`), relecture **téléphone** sur deux appareils réels.
3. **`killer`**, **`volee-partielle`**, **`phrases-victoire`**, **`courbe`** fusionnés ; relecture
   **téléphone** à faire (PLAN § 0).
4. **Refonte** visuelle (lot 13 `high`). **Suite de `rejouer`** : lot `high` à proposer.
5. Restent : dette `DialogueNouveauJoueur` ; lecture de la base **non mesurée** ; `annulation-volee` : **N-1**.

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 35 | Moyenne | DS : « checkout » **jamais « sortie »** ; la boîte dit « Valider la sortie » (DS la nomme) | `labels.ts:92` | À trancher |
| 11 | Moyenne | Import : rules « validé avant écriture », code : entrée par entrée. Restent atomicité entre parties, `createdAt` sans borne haute, `MISS` et doublons de parcours, `doubleOut` non typé | `ManageBackupUseCase.ts:51-63` ; `backupSchema.ts:54, 65, 125, 226` | À trancher |
| 21 | Moyenne | `text-laiton` en clair : 3,5:1 ou 4,4:1. **Podium, `Modale` : accepté (U4)** ; non : liens `text-sm`, `Panneau`, dialogue joueur | `AccueilEcran.tsx:151, 159` | 4,5:1 requis |
| 37 | Basse | `rules/persistence.md` cible `src/core/application/backupSchema.ts` ; le fichier est dans `use-cases/` : la règle ne s'y charge pas | `persistence.md:5` | Règle non appliquée |
| 38 | Basse | `theme-colors.md` dit « quatre familles » de jetons réservés, n'en décrit que trois sections | `theme-colors.md:57` | Relecture |
| 2, 7 | Basse | `noRestrictedImports` = 7 paquets, pas « les API navigateur » (2) ; charte « hex hors `index.css` / `couleurs.ts` » : 3 exceptions (7) | `CLAUDE.md:152-154` ; `biome.json:59` ; `CHARTE:88` | Relecture |
| 4, 10, 17, 32, 36 | Basse | Périmé : `useMatch.ts` absent (4) ; PLAN « pas de `.gitattributes` » (10) ; « 765 tests » (17) ; `useDernierExport` sans test (32) ; PLAN § 0 sans lots récents (36) | `CLAUDE.md:150` ; PLAN `:1349, :71, :44, :12-71` | Périmée |
| 14, 28 | Basse | Gardes absentes : `src/ui` sans `*UseCase` (14) ; `border-s-` / `border-e-` (28) | `CONVENTIONS.md:157` ; `themeBoundary.test.ts:76, 161` | Non détecté |
| 20, 24 | Basse | « Partie ! » en dur (20) ; résumé Cricket : tri hors `rankPlayers` (24) | `momentVolee.ts:17` ; `ResumeCricketEcran.tsx:54` | Convention |

## Questions et limites
- Rien de gravé sacrifié. #11, #35 non tranchés. `CONVENTIONS`, charte,
  DEPLOIEMENT lus par recherche (miroir) ; non lus : planches, `docs/lots/*`, worktree `shanghai` ;
  tests non relancés. Lignes de #11, #14, #24, #28 non revérifiées.

## Traçabilité
- **Reportés** : 2, 4, 7, 10, 11, 14, 17, 20, 21, 24, 28, 32, 35, 36, 37. **Retirés** : #26 (CONV. § 14 cite
  désormais `killer/`, `ManageVisitDraft`, `VisitDraftRepository`, `PlayKiller`). **Ajoutés** : #38 ;
  écran miroir.
