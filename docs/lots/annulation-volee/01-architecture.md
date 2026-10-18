# Lot `annulation-volee` — architecture

> Écrit par l'Orchestrator à partir du rapport de `archi-authority` (opus / max), qui commence par
> `Architecture result: PASS`. Chaîne démarrée à l'authority (surface gravée annoncée). Le rapport a
> été rendu après une relance : le premier passage a atteint `maxTurns` (40) sans rapport.

## Problème

Aujourd'hui, quand aucune fléchette n'est en cours, « Annuler » retire **toute** la dernière volée
enregistrée (`events.slice(0, -1)` dans `UndoLastVisitUseCase` et les trois `undoLastVisit`). La
fléchette qui sort, gagne ou boucle enregistre la volée tout de suite, voix et célébration comprises.

Le lot doit : (1) retirer **une fléchette** par appui, la dernière jouée, quel que soit le joueur, la
volée enregistrée se rouvrant, sans format persisté nouveau, dans quatre modes ; (2) ouvrir une boîte
*Corriger* / *Valider la sortie* **avant toute écriture** (X01 à chaque manche, Cricket à la victoire,
Tour du monde au bouclage, jamais sur un bust, jamais à l'entraînement).

**Correction du brief** : le journal ne contient ni `LegWon`, ni `SetWon`, ni `MatchFinished` : ce sont
des jalons déduits par la projection (`MatchEvent.ts:9-24`, `X01Milestone`). Retirer le dernier
`VisitRecorded` suffit donc à défaire une manche, un set ou une fin de partie. Seul l'entraînement
écrit un événement après la volée (`RoundStarted` de la manche suivante), que le code retire déjà
(`PlayCheckoutPracticeUseCase.ts:107-120`).

## Options considérées

### Annulation

| Option | Pour | Contre |
|---|---|---|
| **A (retenue)** Tronquer le journal, rouvrir la volée en saisie locale ; le use case rend l'état projeté **et** les fléchettes restantes | Aucun format nouveau ; la projection recalcule tout ; testable au niveau des use cases ; une seule source de vérité | La volée rouverte ne vit qu'en mémoire, comme une volée en cours |
| B Tout dans l'UI (hook lit la dernière volée, remet `darts.slice(0, -1)`) | Aucun port ne change | Logique copiée dans quatre hooks, hors tests de use cases ; cache pouvant diverger du journal |
| C Événement nouveau (`DartUndone`, volée « ouverte » persistée) | La volée survit à une fermeture | Format persisté nouveau, migration Dexie, `backupSchema`, quatre projections ; un `VisitRecorded` de 2 fléchettes serait lu comme complet. Exclu par la demande |
| D Troncature différée | Rien de perdu à la fermeture | Projection « virtuelle » multi-volées + nouveau port d'état : disproportionné |

### Confirmation

| Option | Pour | Contre |
|---|---|---|
| **E (retenue)** Fléchette de sortie en saisie locale ; la boîte s'ouvre dans le gestionnaire de clic ; décision lue sur les ports d'aperçu | Rien n'est écrit avant *Valider* ; voix, haptique, célébration et résumé restent dans `enregistrer` | La fléchette en attente n'est pas persistée (acceptée par la demande) |
| F Enregistrer puis défaire sur *Corriger* | Réutilise l'annulation | Écrit le journal, voix, célébration et résumé avant validation : interdit |

## Approche retenue

### 1. Retirer une fléchette d'une volée enregistrée (quatre modes)

Les quatre use cases d'annulation suivent le même algorithme :

1. Charger la partie, projeter l'état `avant`.
2. Lire la dernière volée **projetée** (`avant.history.at(-1)` ; à l'entraînement, la dernière manche
   close de `avant.rounds`) ; ses fléchettes sont déjà coupées à celle qui a conclu.
3. Tronquer : X01, Cricket, Tour du monde `events.slice(0, -1)` ; entraînement : retirer le
   `RoundStarted` final s'il existe, puis le `VisitRecorded`.
4. Projeter `apres` **avant** d'écrire (CONVENTIONS § 4 ; le code actuel sauvegarde puis projette).
5. Sauvegarder en une fois, `updatedAt` à `clock.now()`.
6. Rendre `{ state: apres, darts: derniere.darts.slice(0, -1) }`.

Signatures : `UndoLastVisit.execute`, `PlayCricket.undoLastVisit`, `PlayTourDuMonde.undoLastVisit`,
`PlayCheckoutPractice.undoLastVisit` rendent `Promise<ReopenedVisit<État>>`, avec
`type ReopenedVisit<S> = { readonly state: S; readonly darts: readonly Dart[] }`. Les noms de méthodes
restent ; aucun port ni use case nouveau, `container.ts` inchangé.

Hooks : sans fléchette en cours, `annuler()` garde ses contrôles (`ecoulee()`, rien à retirer,
`occupe`), appelle le use case, puis `setQueryData(state)`, `setDartsEnCours(result.darts)`,
`setDerniereVolee(null)`, et `armer()` si `result.darts` est vide. Le chemin « fléchettes en cours »
ne change pas.

Pourquoi la projection rejoue juste : bust défait (la volée privée de sa dernière fléchette ne conclut
jamais) ; manche gagnée défaite (`legNumber`, `legsWonInSet`, `setsWon`, `winnerId`, départ alterné,
`currentPlayerIndex` recalculés) ; deux joueurs (chemin local puis pause) ; Tour du monde
(`finishedInDarts`, `lastRound`, `finished` recalculés) ; Cricket (marques et points de tous les
joueurs, cut-throat compris) ; entraînement (`RoundStarted` de la manche rouverte conservé : même
reste ; le reste de la manche **suivante**, déjà tiré, part avec la volée — comportement actuel).
**Invariant à tester dans les quatre modes** : l'aperçu de `result.darts` n'est jamais `complete`.

### 2. Confirmation de la sortie

Détection sans règle réécrite dans l'UI :
- **X01** : `previewVisit` suffit, `outcome === 'CHECKOUT'` (chaque manche). `BUSTED` s'enregistre
  directement.
- **Cricket** : `previewCricketVisit` suffit, avec `state.finished`.
- **Tour du monde** : le port **ne suffit pas** (`complete` mêle « 3 fléchettes » et « bouclage »,
  `PreviewTourDuMondeVisitUseCase.ts:21-29`). Ajouter `completesTour: boolean` à `TourDuMondePreview`
  (même expression ; ajout sur un port driving, rien de persisté). Ne jamais se fier à
  `state.finished` (fin du tour de table, sans autre boîte).
- **Entraînement** : inchangé.

Hooks (X01, Cricket, Tour du monde) : `sortieEnAttente` **dérivé** de l'aperçu des fléchettes en cours ;
`ajouterFlechette(dart)` rend `true` quand elle met une sortie en attente (volée non envoyée, toute
nouvelle fléchette refusée tant qu'elle attend) ; `corrigerSortie()` suit le chemin du retrait d'une
fléchette en cours (la pause s'arme s'il ne reste rien) ; `validerSortie()` appelle
`enregistrer(dartsEnCours)` (voix, haptique `success` et célébration y sont déjà : elles arrivent après
*Valider*).

Écran : nouveau hook commun `useConfirmationSortie` et composant commun `BoiteConfirmation` (noms au
choix du Dev), sur `useModaleAuRetour('confirmation', ['sortie'])` + `useDialogueNatif` (CONVENTIONS § 9).
`ouvrir('sortie')` **synchrone dans le `onFlechette`** quand `ajouterFlechette` rend `true`, jamais
depuis un effet (piège 3). Boîte ouverte quand `ouverte === 'sortie' && sortieEnAttente`. *Corriger* =
`corrigerSortie()` puis `fermer()` ; *Valider la sortie* = `validerSortie()` puis `fermer()`, garde
`occupe`. Hook et `<dialog>` hors des branches de chargement (comme `StatistiquesEcran.tsx:473-475`),
jamais `flex`/`grid` sur le `<dialog>`. Focus à l'ouverture sur *Corriger* ; pas de ✕ (réf. `croix`
de `useDialogueNatif`). Une entrée `confirmation` héritée d'un rechargement est dépilée au montage
seulement. Navigation vers le résumé : attendre `termine && ouverte === null` dans les trois écrans.

### 3. Pause, libellé, touche grisée

- `usePauseAnnulation` ne change pas (1 s, `ecoulee()` fait autorité) ; elle s'arme quand un appui
  laisse le joueur sans fléchette. `peutAnnuler` ne change pas.
- `libelleAnnulation(flechette, joueur)` : court « Annuler S5 », nom accessible « Annuler S5 de Kevin »
  (court contenu dans le complet, WCAG 2.5.3), neutre « Annuler » quand rien à retirer.
- Source : fléchette en cours (dernière, joueur courant) sinon dernière fléchette de la dernière volée
  **projetée** et son `playerId` ; entraînement : dernière manche close et `state.playerId` ; Tour du
  monde : `libelleFlechetteTourDuMonde`. « Annuler la volée de Kevin » disparaît.
- Entraînement : `EntrainementEcran.tsx:87-93` ne passe pas `annulation` aujourd'hui ; il doit la passer.

### 4. Format persisté

Rien ne change : `MatchEvent`, schéma Dexie, migrations, `backupSchema`, `BACKUP_VERSION`. Aucune clé
`localStorage` ni donnée nouvelle ; `/confidentialite` reste vraie. Seul état nouveau : la clé
d'historique `confirmation` (`location.state`, liste fermée, jamais affichée), comme `regles`.

### 5. Découpage pour Dev

1. Application : `ReopenedVisit`, les quatre use cases (projection avant écriture), `completesTour` ;
   tests des use cases.
2. `labels.ts` : `libelleAnnulation` ; textes de la boîte X01 d'après la planche ; textes Cricket et
   Tour du monde **après** les réponses à U1 et U2.
3. Hooks : réouverture, libellé, sortie en attente, *Corriger* / *Valider*, entraînement.
4. UI : `BoiteConfirmation`, `useConfirmationSortie`, câblage des trois écrans, garde du résumé.
5. Tests existants à adapter (T7), puis docs.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | Aucun (ni règle, ni événement, ni `games/index.ts`) |
| `core/application/` | `ports/driving/ReopenedVisit.ts` (ou dans `UndoLastVisit.ts`) ; ports `UndoLastVisit`, `PlayCricket`, `PlayTourDuMonde`, `PlayCheckoutPractice`, `PreviewTourDuMondeVisit` ; use cases `UndoLastVisitUseCase`, `PlayCricketUseCase`, `PlayTourDuMondeUseCase`, `PlayCheckoutPracticeUseCase`, `PreviewTourDuMondeVisitUseCase` | Type de retour `ReopenedVisit`, projection avant écriture, `completesTour` |
| `infrastructure/` | — | Aucun |
| `ui/` | hooks `useX01`, `useCricket`, `useTourDuMonde`, `useCheckoutPractice` ; `usePauseAnnulation` (commentaire) ; nouveaux `hooks/useConfirmationSortie.ts`, `composants/commun/BoiteConfirmation.tsx` ; écrans `X01Ecran`, `CricketEcran`, `TourDuMondeEcran`, `EntrainementEcran` ; `labels.ts` | Réouverture, sortie en attente, boîte, libellé ; `PaveSaisie` / `PaveFlechettes` inchangés |
| `composition/` | — | Aucun (`container.ts` inchangé) |
| `tests/` | use cases, hooks, écrans, invariants (T6), adaptations (T7) | Voir ci-dessous |
| docs | CHARTE § Saisie (`:699-702`) et § Composants ; CONVENTIONS § 9 et § 10 ; commentaires de `UndoLastVisit.ts` et `MatchEvent.ts:17-20` | Mises à jour |

**Sens des dépendances vérifié :** `ui` → `application` → `domain`. `ReopenedVisit` n'importe que `Dart`
et les types d'état du domaine ; aucun mode n'en importe un autre ; l'UI ne voit que des ports.
**Nouveau port ?** Non. Un champ ajouté (`completesTour`) à un port d'aperçu existant.

## Décisions de `CLAUDE.md` concernées

Appliquées : journal d'événements et projection ; tirage écrit (la manche rouverte garde son reste) ;
l'UI ne réimplémente aucune règle (ports d'aperçu) ; boîte par-dessus l'écran par `useModaleAuRetour` +
`useDialogueNatif` ; Query hors match ; français dans `labels.ts`, « manche » ; charte (angle vif, paires
de rôle, ≥ 48 px).

**À graver en fin de lot** (Décisions structurantes) :

> **Annulation fléchette par fléchette, sortie confirmée** (lot `annulation-volee`) : un appui retire la
> dernière fléchette jouée, quel que soit le joueur. La volée rouverte quitte le journal et ses
> fléchettes restantes reviennent en saisie, non persistées comme toute volée en cours ; aucun format
> nouveau. Confirmation forme B : X01 à chaque manche, Cricket à la victoire, Tour du monde au bouclage,
> jamais sur un bust ni à l'entraînement. Rien n'est écrit, dit ni célébré avant *Valider*.

Selon U8, une ligne de plus au § Règles de l'entraînement. Puis `/refresh-architecture`. La question de
la feuille de règles de l'entraînement (`labels.ts:2307-2310`) reste exacte, sauf si U8 change.

## Baseline sécurité

- Import JSON non touché (aucun format nouveau) ; l'annulation reste une seule `save`, atomique.
- Zéro réseau, aucune dépendance runtime, service worker / `firebase.json` / en-têtes non touchés.
- Pseudo rendu en texte JSX, jamais en HTML (titre et nom accessible de la boîte et de la touche).
- État d'historique `confirmation` validé contre une liste fermée, jamais affiché.

| # | Risque résiduel | Mitigation | Owner |
|---|---|---|---|
| R1 | Volée rouverte et fléchette de sortie en attente perdues si l'app se ferme | Le journal reste cohérent | Utilisateur : accepté pour la sortie (`request.md` § Risques) ; U9 pour la volée rouverte |
| R2 | Entraînement : reste de la manche suivante re-tiré après correction | Comportement actuel inchangé | Utilisateur (U8) |
| R3 | Appui fantôme après fermeture de la boîte (double tap sur *Corriger*) | Partielle : la pause protège Annuler, pas la grille | Test, à l'écran |
| R4 | Course entre `navigate(-1)` de la boîte et `replace` vers le résumé | Garde `termine && ouverte === null` | Test |

Ne remplace pas `04-revue-securite.md`.

## Conformité à la planche

Planche lue en entier (`C:\Users\kevin\Documents\Flechettes\docs\maquettes\annulation\annulation.html`) ;
seule la forme B est retenue.

| Élément de la planche | Où le plan l'implémente |
|---|---|
| § 1 « Demain » 1-3 : Kevin actif, 384 → 441 → 501, « Annuler T19 » / « Annuler T20 » / « Annuler » grisée | Réouverture (use case + hook) ; rendu actuel de `Tableau` ; `libelleAnnulation` ; `ANNULATION_NEUTRE` + `disabled` |
| Notes : une fléchette par appui, « Annuler S5 » / « … de Kevin », tour rendu, touche grisée, pause 1 s, quatre modes | §§ 1 et 3 ; quatre hooks, entraînement compris |
| § 2 Bust, Sortie, Deux joueurs | Réouverture à travers la frontière de manche ; chemin local puis pause |
| § 3 forme B : titre « Kevin sort sur D10 ? », texte « 40 → 0. La manche est gagnée dès que vous validez. » | `BoiteConfirmation`, textes dans `labels.ts` (« 40 » = reste projeté, « D10 » = `Dart.label`) |
| Boutons *Corriger* (filet `craie/45`) et *Valider la sortie* (`laiton` / `sur-laiton`), 2 colonnes, 52 px | `BoiteConfirmation` |
| Boîte `ardoise`, filet haut 3 px `craie`, titre Oswald 1,2 rem `craie-vive`, centrée, largeur − 2 × 16 px, voile ~66 % | `backdrop:bg-feutre-nuit/…` (jamais le jeton réservé `voile`) ; « c80 » → `craie-2` |
| « Après validation » : manche comme aujourd'hui, voix après validation, retour arrière fléchette par fléchette | `validerSortie` → `enregistrer` ; `MomentCelebratif` actuel |
| Forme A | Non implémentée |
| Paysage inchangé ; thème clair par les valeurs | Aucune disposition modifiée ; tokens en paires de rôle |

**Écarts, tous posés en questions :** libellé « Annuler » dessiné (U4) ; notes, bandeau d'état et bloc
« Manche gagnée » que l'écran actuel n'a pas (U5) ; marques derrière la boîte (U6) ; valeurs « moy »
(U7) ; boîte en paysage et taille du titre (U10).

## Questions ouvertes

### Pour l'utilisateur (produit)

**Bloquantes, pour l'étape concernée :**

| # | Question |
|---|---|
| U1 | Cricket et Tour du monde : quels titre, texte et bouton de validation (la planche ne dessine que le X01) ? Tour du monde au bouclage, sans laisser croire que la partie s'arrête. Garde-t-on « Valider la sortie » partout ? |
| U2 | Cricket cut-throat : une fléchette de Julien peut faire gagner Kevin (`cricket/rules.ts:198-207`). La boîte s'ouvre-t-elle, et quel nom affiche-t-elle ? |
| U3 | Fermer la boîte sans choisir (retour du téléphone, Échap, appui à côté) : comme *Corriger* (fléchette retirée), ou la boîte se ferme et la fléchette reste en attente (seule « Annuler » la retire) ? Le retour ne peut être empêché. |

**Non bloquantes** (le plan suit la demande par défaut) :

| # | Question | Défaut du plan |
|---|---|---|
| U4 | Libellé de la touche derrière la boîte et après une manche gagnée | « Annuler <dernière fléchette> » dès qu'il y en a une (« Annuler D10 ») |
| U5 | Notes sous le reste, bandeau « Volée perdue », bloc « Manche gagnée » dessinés par la planche | Rien d'ajouté, affichage actuel (`MomentCelebratif`, bust dans la colonne Volée) |
| U6 | Marques derrière la boîte (case laiton, reste en laiton + « sortie », pavé éteint) | Rendu d'une volée en cours ; pavé inerte, pas grisé |
| U7 | Moyenne pendant une volée rouverte (Kevin à 0,0, la planche affiche 117,0 puis 60,0) | Calcul actuel sur les volées enregistrées |
| U8 | Entraînement : reste de la manche suivante re-tiré après correction | Identique à aujourd'hui (le garder demanderait un format persisté) |
| U9 | Volée rouverte perdue si l'app se ferme | Accepté, comme la fléchette de sortie |
| U10 | Boîte en paysage ; taille du titre (1,2 rem de la planche vs lecture à 2-3 m) | Centrée, bornée comme la `Modale` (32 rem) ; taille de la planche |

### Réponses de l'utilisateur (2026-10-17, arrêt Archi → Dev)

| # | Réponse |
|---|---|
| U1 | Titres adaptés, **bouton unique** « Valider la sortie » partout. Cricket : « Kevin gagne sur T20 ? ». Tour du monde : « Kevin boucle le parcours sur S25 ? », texte « La partie continue jusqu'à la fin du tour de table. » |
| U2 | Oui, la boîte s'ouvre quand la fléchette met fin à la partie, et affiche le **nom du gagnant** |
| U3 | Fermer sans choisir (retour, Échap, voile) = **comme *Corriger*** : la fléchette de sortie est retirée |
| U4-U10 | **Défauts du plan confirmés tous** (U4 « Annuler D10 » ; U5 rien d'ajouté sous le reste ; U6 pavé inerte, pas grisé ; U7 moyenne sur volées enregistrées ; U8 reste suivant re-tiré à l'entraînement ; U9 volée rouverte perdue à la fermeture ; U10 boîte centrée 32 rem, titre 1,2 rem) |

Toutes les questions pour l'utilisateur sont closes. Texte exact du titre Cricket / Tour du monde : les
exemples ci-dessus, adaptés au joueur et à la fléchette ; le reste des libellés suit la planche.

### Techniques

- **T1 (Dev)** Où ranger `ReopenedVisit` ; garder le nom `undoLastVisit` ou le renommer partout.
- **T2 (Dev, Test)** Valider la manche qui gagne la partie : garde `termine && ouverte === null` ; test
  d'arrivée au résumé sans entrée `confirmation` orpheline.
- **T3 (Dev, Test)** Entrée `confirmation` dépilée **au montage seulement** (un rendu peut voir la
  nouvelle `location` avant le nouveau `dartsEnCours`) ; test avec `renderWithServices(…, { historique:
  [{ pathname, state: { confirmation: 'sortie' } }] })`.
- **T4 (Dev)** Si U3 = *Corriger* : fermeture détectée au passage `'sortie'` → `null` tant qu'une sortie
  attend et que `occupe` est faux ; `occupe` posé dans le même gestionnaire que le `fermer()` de *Valider*.
- **T5 (Dev)** Élément passé en `retour` à `useDialogueNatif` (focus sous Safari) : touche Annuler ou
  section du pavé.
- **T6 (Test)** Use cases des quatre modes (volée rouverte, bust défait, manche / set / partie défaits,
  deux joueurs, cut-throat, Tour du monde au dernier tour, entraînement même `target` et `RoundStarted`
  retiré, rien à retirer → `DomainError`, rien d'écrit si la projection lève) ; invariant en
  `it.each(GAME_MODE_IDS)` ; rejeu à froid ; `completesTour` (vrai au bouclage, faux à 3 fléchettes sans
  boucler, faux sur la volée qui ne fait que finir le tour de table) ; Testing Library : touche
  (384 → 441 → 501, nom accessible, grisée, pause) et boîte (chaque manche X01, Cricket, Tour du monde ;
  jamais bust ni entraînement ; Corriger / Valider ; voix muette avant Valider ; retour / Échap / voile
  selon U3 ; rechargement).
- **T7 (Test, Dev)** Tests existants à adapter : « Annuler la volée de Kevin » (`x01.test.tsx:142`,
  `tourDuMonde.test.tsx:269,296`) ; `annulationDoubleTap.test.tsx` (critères 2 et 4, critère hook 1) ;
  tests qui sortent / gagnent / bouclent par le pavé et passeront par la boîte (`manches.test.tsx:138`,
  `cricket.test.tsx:108-130`, probablement `matchX01`, `feuilleCommune`, `tourDuMonde`, `parcours`,
  `nomDePartieEcrans` — non vérifiés un à un) ; tests qui lisent l'état rendu par `undoLastVisit` et
  passent à `.state` (`matchLifecycle`, `cricket`, `tourDuMonde`, `checkoutPractice`, `matchStatus`,
  `ordreAleatoire`, `nomDePartie`).
- **T8 (Dev)** `useCheckoutPractice.ts:42-44,78-79` recalcule reste et fin de manche sans port : dette
  existante hors lot ; couverte par l'invariant.
- **T9 (Sécurité)** Pseudo rendu en texte dans la boîte ; journal identique tant que la boîte est ouverte.
- **T10 (Test, à l'écran)** Port 5202 : portrait et paysage, sombre et clair, quatre modes, boîte à
  360 px, touches ≥ 48 px, appui fantôme après fermeture (R3).

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
