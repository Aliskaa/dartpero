# Contexte d'architecture
> **Index**, pas une source de vérité. **DS** = `CLAUDE.md` § Décisions structurantes ; **PLAN** =
> `docs/PROJECT_PLAN.md`.

## Objet et périmètre
- **Généré le** 2026-10-22 (23e passe), scope `all`, branche `main` = `150d43b` (`killer`, `courbe`
  fusionnés). Worktrees : `lot/courbe` (même commit que `main`, à retirer), `lot/shanghai` (`c8623f0`,
  **en cours**). Non suivis : `docs/request/shanghai.md`, `tour-du-monde-sens.md`, `.claude/hooks/`.
- **Lus** : `CLAUDE.md`, `CONVENTIONS`, `rules/`, PLAN § 0, 4, 6, ancien index ; code vérifié par recherche.
  Tests non relancés.

## Inventaire
| Décision | Statut | Source |
| --- | --- | --- |
| PWA ; hexagonal + SOLID ; ni Firebase (app), auth, réseau ; Dexie ; profils locaux + export ; `MatchEvent[]` ; fléchette par fléchette | en vigueur | DS |
| « Saisie hybride » / mode rapide (`d531a7e`) ; « Best of N » → « premier à N » ; accent par mode → laiton ; « Ordre aléatoire » → « Tirer au sort » ; « Règles en entier » → livre ; volée « non persistée » → brouillon ; « Killer hors v1 » ; `/confidentialite` « inchangée » → mise à jour du 21 octobre 2026 | renversées | DS ; PLAN § 6 |
| **Killer** : `KillerStarted` ; **numéros dans l'ouverture, jamais dans la config** ; tirage à l'étape 2 ; `partie:killer-vies`, `partie:killer-variante` ; **sélection de joueurs coupée et écrite** ; `useKiller` 5e utilisateur de `useVoleeEnCours` ; **import qui projette tous les modes** | en vigueur | DS ; CONV. § 13 |
| **Genre du profil** : clé absente = non précisé ; lu **seulement** par les textes du Killer (`genreBoundary`) ; pas de `db.version` | en vigueur | DS ; rules/persistence |
| **Carte Évolution** (lot `courbe`) : appui seul, **mesure jamais mémorisée**, rien de stocké ; axe ≈ 10 px = écart connu | en vigueur | DS ; CHARTE § Composants |
| **Brouillon de volée** : `visitDrafts` (Dexie v3), **hors journal, jamais exporté**, reprise **silencieuse** | en vigueur | DS ; CONV. § 9-11 |
| **Annulation fléchette par fléchette, sortie confirmée** (`BoiteConfirmation`) ; **phrase de victoire** (**même `say`**) ; livre de règles (jamais une route) ; Rejouer (**nom jamais repris**) ; stockage persistant | en vigueur | DS ; CONV. § 5, 9 |
| **Vocabulaire** : « checkout » jamais « sortie » ; « bust » en `en-US` ; « manche » ; checkouts **double / libre** ; règles de l'**entraînement** | en vigueur | DS ; glossary |
| Double out écran ≠ domaine ; route par étape ; nom (étape 2) ; « Abandonnée » dérivée ; cinq modes ; stack figée ; Query hors match ; Biome seul ; `AppInstallation` ; `id: '/'` ; thème sombre ; angle vif | en vigueur | DS ; CHARTE ; Déploiement |
| Alfa Slab One ; paysage ; Cricket ; Killer | tranchées | CLAUDE § Décisions ouvertes |

## Guidage opérationnel
### Architecture
- Dépendances vers l'intérieur ; câblage **seul** dans `container.ts` ; capacité externe = **adapter** ;
  **UI → use cases** ; aucun import entre modes (CLAUDE § Règle d'architecture).
### Règles de jeu : pointées, jamais énoncées
- **X01** : § Règles du jeu. Délicats : bust, double in / out, checkouts, bogey numbers, legs et sets,
  First 9, % doubles, **Évolution** (tendance, meilleure volée). **Tour du monde** : fin du tour de table,
  départage. **Cricket** : surplus, cibles ignorées, victoire, cut-throat. **Killer** : § Règles du Killer ;
  devenir killer, frappe, variante du propre numéro, élimination, victoire, classement. **Entraînement** :
  plage, tirage écrit, une volée par manche. La feuille `regles*` n'est pas source.
### Persistance et journal
- Journal en ajout seul, tirage **écrit**, persisté jamais renommé, facultatif absent = **clé
  absente**, `backupSchema` au même lot (rules/persistence). **Jamais écrits** : « Abandonnée »,
  `legsPlayed`, nom par défaut, classement, configuration rejouable, phrase, **courbe** ; **numéros du
  Killer hors config**. **Champ de profil facultatif** (`gender`) : non indexé, sans `db.version`.
  **Brouillon** : hors journal, jamais `localStorage` ni exporté.
### Sécurité
- Sans réseau ni compte : aucun import de `firebase` dans `src/` ; `/confidentialite` tenue vraie (DS) :
  donnée stockée nouvelle = texte **et date** de `SECTIONS_CONFIDENTIALITE`. Seule entrée non fiable :
  l'import JSON (rules/persistence). Hosting, SW : DEPLOIEMENT. Checklist : `agents/sec.md`.
### Front, charte, pièges
- Couleur : tokens **en paires de rôle**, jamais `text-craie*/NN` ; **trois familles de jetons réservés**,
  **quatre entrées** de garde ; `rouge-touche` **général**, sert aussi `FeuilleKiller` (rules/theme-colors).
  Gardes `*Boundary` ; ≥ 48 px.
- **Annuler / confirmer** (CONV. § 10) : `sortieEnAttente` **dérivé**. **Volée en cours** : **jamais un
  `useState` de fléchettes**, seulement `useVoleeEnCours` ; `poser` hors d'un updater ; effacement **après**
  enregistrement. **Voix** (§ 5) : un seul `say` par fin de volée.
- Boîte par-dessus l'écran : `useModaleAuRetour` + `useDialogueNatif`, `<dialog>` jamais `flex`/`grid`
  (CONV. § 9). Un mode nouveau : sa feuille + `regles`.
- **Un mode nouveau, quatre pièges du lot `killer`** (CONV. § 13) : `default` typé `never` de la couture
  **et de `PartieEcran`** ; **maximum de joueurs par mode** (`max`, `rejouer.maxJoueurs`) ;
  `lancerPartie` à **2 joueurs** ; `hexagonalBoundary` lit les vrais dossiers. `lot/shanghai` les rencontre.
- Tests (CONV. § 11) : rechargement = **mêmes services, nouveau `QueryClient`**. Pièges : `61b60ac`,
  `id: '/'`, `ignore`, `REMPLIR`, `TZ`.
### Où lire quoi
| Le lot touche… | Lire |
| --- | --- |
| Règle de jeu, stat ; tests, lint | CLAUDE § Règles du jeu ; rules/testing, biome |
| Événement, Dexie, sauvegarde, brouillon, profil | rules/persistence ; CONV. § 13 ; DEPLOIEMENT § Dexie |
| Port d'appareil, horloge ; installation | DS ; CONV. § 5, 7 ; DEPLOIEMENT |
| Écran ; couleur ; vocabulaire | rules/frontend-react, theme-colors, glossary ; CHARTE |
| Annulation, confirmation, volée, voix ; livre ; cartes | DS ; CONV. § 5, 9-11 ; CHARTE § Saisie |
| Nouveau mode ; Killer, genre ; Nouvelle partie, Rejouer | DS ; CONV. § 13, 14 ; CHARTE § Killer, Parcours ; PLAN § 6 |
| Statistiques, Évolution | CLAUDE § Règles du jeu X01 (Statistiques) ; DS ; CHARTE § Composants |

## Surfaces gravées
Un lot qui en touche une : **`high`**, départ `archi-authority`.
1. `src/core/domain/` : règles de jeu, événements, Value Objects (`checkout.ts`, `PlayerGender`).
2. La couture `GameMode` : `src/core/domain/games/index.ts`.
3. Un format **persisté** : `MatchEvent` (dont `KillerStarted`), **profil** (`Player.gender`), schéma Dexie
   (`visitDrafts` v3), `backupSchema`, ports `VisitDraftRepository` / `ManageVisitDraft`.
4. Le service worker (`vite-plugin-pwa`), `firebase.json`, le manifeste.
5. Une décision de DS (stockage, installation, **politique** et ses clés `localStorage`, Nouvelle partie,
   double out, nom, `Services.clock`, « Abandonnée », livre, Rejouer, vocabulaire, voix, annulation,
   brouillon, **Killer**, **genre**, **Évolution**), § Règles du jeu, ou § Charte « ce qui ne s'y discute
   pas ». Reste de la charte : `light`.

## Préséance et exceptions
**Préséance** : code récent, `CLAUDE.md`, `CONVENTIONS`, `rules/` ; sauf décision **gravée** (écart
= défaut). **Exceptions** :
| Exception | Règle contournée | Source |
| --- | --- | --- |
| `couleurs.ts`, `Cible.tsx`, `theme.ts` ; `craie-decor` ; jetons réservés **constants à dessein** | couleur en dur ; plancher ; jeton général | `themeBoundary.test.ts:36` ; rules/theme-colors |
| Titre `laiton` podium, `Modale` en clair (4,40:1) ; `.chargement-balai` seul dégradé | plancher ; zéro dégradé | CHARTE |
| `Services.devices`, `Services.clock` ; `matchStatus`, `rankPlayers`, `leadingPlayers` | UI → use cases | `container.ts:124` ; CONV. § 8 |
| `useConfirmationSortie` au-dessus du chargement ; **`demander()` depuis un effet** | `<dialog>` hors chargement ; « dans un clic » | CONV. § 9 |
| `'MatchStarted'`, `KillerStarted` ; `installation:ecartee`, `statistiques:joueur`, `sauvegarde:dernier-export`, `partie:*` (dont `partie:killer-*`), `entrainement:sorties` ; `MASCULINE`, `FEMININE` ; `visitDrafts`, `matchId`, `visitCount`, `darts` | persisté jamais renommé | `MatchEvent.ts:38-46` ; DS |
| `partie:ordre-aleatoire` orpheline ; flag `shuffle` sans appelant ; `DialogueNouveauJoueur` ; double out décoché à l'écran, `true` au domaine | dette ; boîte au retour ; ne pas aligner | `useNouvellePartie.ts` ; `x01/config.ts` ; CONV. § 9 |
| Brouillon : sortie en attente écrite avant *Valider* ; effacement en échec (import, suppression) **refuse** | « rien avant Valider » (journal seul) | DS |
| Genre lu hors des textes du Killer = défaut ; sélection coupée **écrite** (5e, 6e joueurs perdus au X01) | liste fermée de fichiers ; « ne rien perdre » | `genreBoundary.test.ts` ; DS |
| Firebase Hosting ; `.well-known` ; `REMPLIR` | « pas de Firebase » ; `ignore` | CLAUDE § Déploiement |
| `AccueilEcran` statique ; `Blob`, `matchMedia` dans l'UI ; `theme_color` figé ; `legsForBestOf` | lazy ; ports ; thème ; best of N | PLAN § 6 |

## Décisions ouvertes
1. Sync cloud ; i18n ; Around the Clock (CLAUDE § Décisions ouvertes 3-5). **Shanghai** : demande validée le
   2026-10-20, lot `high` dans `lot/shanghai`, hors `main` ; CLAUDE dit encore « Shanghai hors v1 » : à
   graver à la fusion. `tour-du-monde-sens` : brouillon **à valider**. `/historique/:id`, `/joueurs/:id`
   non faits ; `nouveaux-modes` (PLAN § 4) à cadrer par `/intake`.
2. **`killer`** : fusionné, relecture **téléphone** à faire (numéro à 2-3 m, 6 lignes en paysage, 360 px,
   `rouge-touche`, ligne « Genre » ; PLAN § 6).
3. **`volee-partielle`**, **`phrases-victoire`**, **`courbe`** fusionnés. **Acceptés** : R1, R3, C1.
   **Reste, téléphone** : R2 (Chrome saute l'entrée empilée), `history.state` d'iOS ; écoute de « — »,
   « ? », « . » ; relecture de `courbe` non constatée.
4. **Refonte** visuelle (lot 13 `high`) : expérimentaux. **Suite de `rejouer`** : #11 ; lot `high` à proposer.
5. **Acceptées** (PLAN § 0, 19 octobre) : T19, Q3, R1, R2, U1, U2. Restent : dette `DialogueNouveauJoueur` ;
   lecture de la base **non mesurée** ; `annulation-volee` : **N-1**, reste **re-tiré**, boîte masquant la ligne.

## Constats de cohérence
| # | Sév. | Constat | Preuve | Impact |
| - | --- | --- | --- | --- |
| 35 | Moyenne | DS : « checkout » **jamais « sortie »** ; la boîte dit « Valider la sortie » (DS la nomme) | `labels.ts:128` | À trancher |
| 11 | Moyenne | Import : rules « validé avant écriture », code : entrée par entrée. Restent atomicité entre parties, `createdAt` sans borne haute, `MISS` et doublons de parcours, `doubleOut` non typé | `ManageBackupUseCase.ts:77-84` ; `use-cases/backupSchema.ts:42, 156, 268` | À trancher |
| 21 | Moyenne | `text-laiton` en clair : 3,5:1 ou 4,4:1. **Podium, `Modale` : accepté (U4)** ; non : liens `text-sm`, `Panneau`, dialogue joueur | `AccueilEcran.tsx:163, 171` | 4,5:1 requis |
| 37 | Basse | `rules/persistence.md` cible `src/core/application/backupSchema.ts` ; le fichier est dans `use-cases/` : la règle ne se charge pas pour lui | `persistence.md:5` ; `use-cases/backupSchema.ts` | Règle non appliquée |
| 2, 7 | Basse | Docs trop fortes : `noRestrictedImports` = 7 paquets, pas « les API navigateur » (2) ; charte « hex hors `index.css` / `couleurs.ts` », 3 exceptions (7) | `CLAUDE.md:134` ; `biome.json:59` ; `CHARTE:88` | Relecture |
| 4, 10, 17, 32, 36 | Basse | Docs périmées : `useMatch.ts` absent (4) ; PLAN « pas de `.gitattributes` » alors qu'il existe (10) ; « 765 tests » (17) ; `useDernierExport` sans test, garde d'aperçu en liste noire (32) ; PLAN § 0 sans `volee-partielle`, `phrases-victoire`, `courbe`, `hors-statistique` ; § 4 sans `phrases-victoire`, `courbe` (36) | `CLAUDE.md:131` ; PLAN `:1349, :71, :46, :40` | Périmée |
| 14, 28 | Basse | Gardes absentes : `src/ui` sans `*UseCase` (14) ; `border-s-` / `border-e-` hors regex (28) | `CONVENTIONS.md:153` ; `themeBoundary.test.ts:115` | Non détecté |
| 20, 24, 26 | Basse | « Partie ! » hors `labels.ts` (20) ; résumé Cricket : tri hors `rankPlayers` (24) ; CONV. § 14 : arbre sans `killer/`, `KillerStarted`, `PlayKiller`, `Pictogramme`, `FeuilleMatch`, `ManageVisitDraft`, `VisitDraftRepository` (26) | `momentVolee.ts:20`, `CricketEcran.tsx:91`, `KillerEcran.tsx:140` ; `ResumeCricketEcran.tsx:58` ; `CONVENTIONS.md:504-540` | Convention |

## Questions et limites
- Rien de gravé sacrifié. #11, #35 non tranchés. Charte : **interprétation**. Non lus : planches, captures,
  `docs/lots/*`, worktree `shanghai`. Connu : pas d'`ErrorBoundary`.

## Traçabilité
- **Reportés** (revérifiés) : 2, 4, 7, 10, 11 (chemin corrigé), 14, 17, 20 (élargi à Cricket), 21, 24, 26, 28
  (reste `s`, `e`), 32 (réduit), 35, 36 (réécrit). **Ajouté** : 37. **Retirés** : de #32 `reglages.png`
  (fichier présent) ; de #36 « Killer restent », « lot E à fusionner », `killer` « 🟡 ».
