# Lot `volee-partielle` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu (`archi-authority`, opus, effort
> max ; scout et designer sautés : surface gravée). Le rapport source commence par
> `Architecture result: PASS`. Il a atteint son plafond de 40 tours sans rapport, puis l'a rendu après
> une relance sans nouvelle lecture ; ce qu'il n'a pas vérifié est listé en fin de fichier.

## Problème

La volée en cours (0 à 3 fléchettes, fléchette de sortie en attente comprise) n'existe que dans l'état
React des quatre hooks. Il faut la garder **hors du journal**, la rendre telle quelle à la réouverture,
et ne jamais l'appliquer si le journal a bougé entre-temps, sans ralentir la saisie et sans rien dire ni
célébrer.

### Trois faits qui corrigent la demande (vérifiés par l'architecte)

- **F1. La restauration ne remplace pas la base, elle fusionne** (`ManageBackupUseCase.ts:42-49`,
  `ManageBackup.ts:60-65`, politique `labels.ts:446`). La phrase de la demande « effacé quand une
  restauration remplace la base » ne correspond à aucun cas réel : voir question Q1.
- **F2. Le mécanisme actuel de la boîte ne peut pas la rouvrir après un rechargement.**
  `useConfirmationSortie.ts:66-76` dépile l'entrée `confirmation` au montage si aucune sortie n'attend ;
  le brouillon se lit en asynchrone, donc l'entrée serait dépilée à tort ; sans entrée héritée,
  `demander()` n'est appelé que dans le gestionnaire de la fléchette. Le mécanisme change (§ Réouverture
  de la boîte).
- **F3. Aujourd'hui, quitter l'écran de match perd déjà la volée en cours**, même sans rechargement
  (`dartsEnCours` est démonté avec l'écran). Puisque le brouillon se lit à l'ouverture de la partie, la
  volée survivra aussi à un aller-retour par l'Accueil (« Reprendre ») : conséquence directe de la
  demande, pas une décision nouvelle.

## Options considérées

| Sujet | Option | Pour | Contre | Retenu |
|---|---|---|---|---|
| Clé de cohérence | `events.length` relu à l'écriture | simple | une écriture lancée avant l'enregistrement peut relire le journal d'après et estampiller les anciennes fléchettes avec la nouvelle version : rendues **au joueur suivant** | non |
| Clé de cohérence | dernier événement | voit un nouveau tirage à l'entraînement | indisponible côté UI : relecture à l'écriture, même course ; ne voit pas une double annulation | non |
| Clé de cohérence | `updatedAt` | change à chaque écriture | inconnu de l'UI, dépend de l'horloge | non |
| Clé de cohérence | **`visitCount` de l'état affiché** (`GameModes.visitCount`) | aucune lecture à l'écriture : toute écriture en vol devient périmée dès que le journal avance ; commun aux 4 modes | même nombre de volées avec un autre journal (ABA), après ≥ 2 échecs d'écriture consécutifs | **oui** |
| Qui efface à l'enregistrement | les use cases d'enregistrement et d'annulation (5 classes) | invariant tenu dans le cœur | 5 constructeurs touchés, écritures non ordonnées avec celles de l'UI | non |
| Qui efface à l'enregistrement | **le mécanisme partagé de l'UI**, une file par hook | une file ordonne toutes les écritures du brouillon ; un seul mécanisme | dépend de l'appel de l'UI (un oubli reste sans danger grâce à la clé) | **oui** |
| Réouverture de la boîte | boîte dérivée, sans entrée d'historique | aucun `navigate` hors clic | casse « même mécanisme que la Modale » et « retour vaut *Corriger* » (décision gravée) | non |
| Réouverture de la boîte | **empiler l'entrée une fois, après la lecture du brouillon** (exception documentée au piège 3) | garde le mécanisme unique et le retour = *Corriger* | Chrome peut sauter l'entrée sans geste préalable (résiduel R2) | **oui** |

## Approche retenue

### Format persisté (`src/infrastructure/dexie/database.ts`)

- `StoredVisitDraft = { matchId: string; visitCount: number; darts: Dart[] }` ; `DartperoDatabase`
  gagne `visitDrafts: EntityTable<StoredVisitDraft, 'matchId'>`.
- `db.version(3).stores({ visitDrafts: 'matchId' })`, **sans `upgrade`** : la table naît vide, rien
  n'est transformé, `matches` et `players` ne sont pas redéclarées. Un commentaire dit pourquoi.
- Clé primaire `matchId` : une ligne par partie, `put` écrase. Pas d'index. **Aucun horodatage**
  (minimisation, pas d'expiration). `darts` a la forme de `VisitRecorded.darts`.

### Ports et use case

- **Port driven** `ports/driven/VisitDraftRepository.ts` : `VisitDraft = { matchId, visitCount, darts }` ;
  `save(draft)` (écrase), `findById(matchId)` (`null` si absent), `delete(matchId)` (sans effet si absent).
- **Port driving** `ports/driving/ManageVisitDraft.ts` : `save({ matchId, base: AnyMatchState, darts })`
  (`[]` efface ; peut rejeter) et `restore({ matchId, base })` (rend `[]` si absent, périmé ou
  incohérent, et efface alors).
- **`ManageVisitDraftUseCase(matches, drafts)`**
  - `save` : aucune fléchette → `drafts.delete` ; plus de 3 → `DomainError` ; sinon
    `drafts.save({ matchId, visitCount: GameModes.visitCount(base), darts })`. ⚠️ Aucune lecture du
    journal, aucun `await` avant l'appel au dépôt (JSDoc : c'est la raison de la clé).
  - `restore` : cohérent seulement si 1 à 3 fléchettes revalidées avec la validation de l'import
    (`versDart` de `backupSchema.ts`, à exporter ou extraire), la partie existe et se projette
    (`GameModes.project`, sous `try`), n'est pas terminée, et
    `draft.visitCount === visitCount(journal) === visitCount(base)` avec le même `mode`. Sinon
    `drafts.delete` au mieux, puis `[]`.
- **`DeleteMatchUseCase(matches, drafts)`** : `drafts.delete(id)` puis `matches.delete(id)`.
- **`ManageBackupUseCase(matches, players, drafts, clock)`** : dans le `try` de chaque partie,
  `record = versMatchRecord(brut)` (validation d'abord), puis `drafts.delete(record.id)`, puis
  `matches.save(record)`. Une entrée invalide garde son brouillon. Portée selon Q1 (A : ce delete par
  partie remplacée ; B : un `clear()` au port avant la boucle). Commentaires de `ManageBackup.ts` à
  nuancer (« rien n'est effacé » : sauf le brouillon d'une partie remplacée).

### Fake mémoire et adapter

- `InMemoryVisitDraftRepository` (une `Map`) ; dans `tests/fakes/index.ts`, des sous-classes de test
  (fakes, pas mocks) : `BrouillonsEnPanne` (`save` et `delete` rejettent) et `BrouillonsSuspendus`
  (`suspendre()` / `liberer()`, compteur d'écritures).
- `DexieVisitDraftRepository` : `put` / `get` / `delete`, mapper `versDraft` (`MatchId.of`), aucune clé
  `undefined`.

### Câblage (`container.ts`)

`Dependencies.visitDrafts` ; `Services.manageVisitDraft` ; `manageVisitDraft`, `deleteMatch` et
`manageBackup` câblés avec `visitDrafts` ; `createBrowserDependencies` (même `db`) et `fakeDependencies`.

### Mécanisme partagé `src/ui/hooks/useVoleeEnCours.ts`

`useVoleeEnCours(matchId, state, evaluer) → { darts, poser, pret }`, avec
`EtatVolee = 'ouverte' | 'en-attente' | 'close'`.

- **État** : `{ matchId, darts }` (une volée d'une autre partie n'est jamais rendue) et
  `pretPour: MatchId | null`.
- **Lecture, une fois par ouverture** : dès que `state` est là et que `pretPour !== matchId`, appel à
  `restore`, drapeau `actif` remis à faux au nettoyage (StrictMode). La volée est acceptée si chaque
  préfixe strict vaut `'ouverte'` et la volée entière n'est pas `'close'` ; acceptée = posée **sans
  écriture, sans haptique, sans voix** ; refusée = `ecrire([], base)`. Dans tous les cas
  `setPretPour(matchId)`, y compris sur rejet.
- **`ecrire(darts, base)`** : une **file** par instance
  (`file = file.then(() => save(...)).catch(() => {})`), ordre des appels respecté, échec avalé (ni
  `erreur`, ni `occupe`).
- **`poser(darts, base)`** : `setSaisie` puis `ecrire`, jamais dans un updater (StrictMode).

### Intégration dans les quatre hooks

`evaluer` est factorisée depuis l'actuel `ajouterFlechette` (aucune règle nouvelle) :

| Mode | `'ouverte'` | `'en-attente'` | `'close'` |
|---|---|---|---|
| X01 (`previewVisit`) | `!complete` | `outcome === 'CHECKOUT' && dartsUsed === darts.length` | sinon |
| Cricket (`previewCricketVisit`) | `!complete` | `state.finished` | sinon |
| Tour du monde (`previewTourDuMondeVisit`) | sinon | `completesTour` | `complete` |
| Entraînement | sinon | jamais | `cible === null`, `length ≥ 3` ou `reste ≤ 1` |

- `ajouterFlechette` : `poser(suite, state)` puis selon `evaluer` : `'ouverte'` → `false` ;
  `'en-attente'` → `true` (la boîte s'ouvre) ; `'close'` → `void enregistrer(suite)`. Comportement
  identique à aujourd'hui, tests existants verts.
- `enregistrer` après succès : `poser([], resultat.state)`. `retirerFlechette` (*Corriger* comprise) :
  `poser(dartsEnCours.slice(0, -1), state)`. `annuler` après succès : `poser(darts, revenu)` estampillé
  avec l'état **rouvert**.
- `chargement` devient `requete.isPending || (state !== null && !volee.pret)` ; le hook rend `pret`.
  Les en-têtes des hooks (« n'est pas persistée ») sont corrigés.

### Réouverture de la boîte (`useConfirmationSortie`)

Nouvelle entrée `pret` (les écrans X01, Cricket, Tour du monde passent `match.pret`). L'effet « au
montage » devient « une fois, quand `pret` » (ref `reconciliee`, contre StrictMode) :

| Entrée `confirmation` | Sortie en attente | Action |
|---|---|---|
| présente | non | `fermer()`, comme aujourd'hui |
| présente | oui | rien : la boîte s'affiche |
| absente | oui | `demander()` : exception documentée au piège 3, une seule fois après la lecture asynchrone, gardée par la ref et par `enVol` |

Rien n'est dit, vibré ni célébré : tout cela vit dans `enregistrer`, que seul *Valider* appelle.

### Moments d'écriture et d'effacement

| Moment | Brouillon |
|---|---|
| Fléchette posée, volée ouverte | écrit `{visitCount(state), suite}` |
| Fléchette qui met une sortie en attente | écrit, fléchette en attente comprise |
| Fléchette qui clôt la volée (3e, bust, entraînement reste ≤ 1) | écrit, puis effacé après l'enregistrement réussi (la file garantit l'ordre) |
| Volée enregistrée (3 fléchettes, bust, sortie validée, fin de partie) | effacé après succès |
| Échec d'enregistrement (N-1) | inchangé ; au rechargement : boîte si sortie en attente, sinon volée close écartée |
| *Corriger*, Annuler une fléchette en cours | réécrit sans elle, effacé si vide |
| Annuler une volée enregistrée | écrit `{visitCount(revenu), restantes}`, effacé si vide |
| Ouverture (rechargement, « Reprendre ») | lu une fois ; cohérent : rendu ; sinon effacé |
| Partie abandonnée (dérivée) | rien : gardé, rendu à la reprise |
| Suppression de la partie | effacé (`DeleteMatch`) |
| Import qui remplace la partie | effacé (`ManageBackup`, portée selon Q1) |
| Export, « On remet ça », « Rejouer » | rien |
| Bascule S/D/T | jamais gardée : retombe sur Simple à la reprise (décision gravée) |

### Politique `/confidentialite` (question non bloquante tranchée)

**Rien ne devient faux : texte et date inchangés** (« Mise à jour le 17 octobre 2026 », `labels.ts:413`),
**à condition de l'option A de Q1**. `labels.ts:435` devient plus exact qu'aujourd'hui ; `:445` (export) et
`:447` (suppression) restent vraies ; `:446` (import, « le reste de la base n'est pas touché ») est vraie
en A, **fausse en B** (texte et date à changer). La Revue relit chaque phrase contre le diff.

### Cas de bord

- Brouillon périmé, partie terminée, inconnue ou supprimée : `[]`, effacé, sans erreur.
- Restauration = fusion (F1) : brouillon d'une partie remplacée effacé **avant** l'écriture de son
  journal ; entrée invalide = brouillon gardé. Réimporter son propre export de la partie en cours efface
  ses ≤ 3 fléchettes en cours. Après l'import, `invalidateQueries()` peut laisser un état en cache
  périmé : la triple égalité empêche d'y poser des fléchettes.
- Ancienne sauvegarde : format, `backupSchema` et `BACKUP_VERSION = 1` inchangés ; elle s'importe comme
  avant.
- Entraînement : le reste tiré reste au journal (`RoundStarted`) ; le brouillon est rattaché à
  `roundsPlayed` : même cible après rechargement, aucun nouveau tirage. Jamais de boîte.
- Sortie en attente au rechargement : fléchette rendue, `sortieEnAttente` re-dérivé, boîte rouverte,
  rien dit avant *Valider* ; le cas N-1 s'améliore.
- Échec d'écriture : avalé, pavé jamais grisé, aucun message.
- Course écriture / enregistrement : estampille de l'état affiché, file ordonnée, triple vérification à
  la lecture.
- StrictMode : lecture protégée par `actif`, écritures hors updaters, réconciliation par ref.
- Deux onglets : le dernier qui écrit gagne (R3). Vieil onglet à la mise à jour v3 : échoue jusqu'au
  rechargement (R4, à vérifier).
- Accueil : une volée non enregistrée ne touche pas `updatedAt` ; une partie abandonnée reprise avec
  seulement des fléchettes en cours reste « Abandonnée » si le rechargement ramène à l'Accueil.
- Bref spinner en revenant sur une partie en cache (lecture IndexedDB) : à relire sur téléphone.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | Aucun changement (`games/index.ts`, `MatchEvent`, `BACKUP_VERSION` non touchés) ; commentaires seuls dans `MatchEvent.ts:22-24` |
| `core/application/` | créer `ports/driven/VisitDraftRepository.ts`, `ports/driving/ManageVisitDraft.ts`, `use-cases/ManageVisitDraftUseCase.ts` ; modifier `DeleteMatchUseCase.ts`, `ManageBackupUseCase.ts` (+ commentaires de `ManageBackup.ts`), `backupSchema.ts` (exporter/extraire la validation d'une fléchette), commentaire de `ReopenedVisit.ts` | Port, use case, effacement à la suppression et à l'import |
| `infrastructure/` | créer `dexie/DexieVisitDraftRepository.ts`, `memory/InMemoryVisitDraftRepository.ts` ; modifier `dexie/database.ts` | Table `visitDrafts`, `db.version(3)` sans `upgrade` |
| `ui/` | créer `hooks/useVoleeEnCours.ts` ; modifier `useX01.ts`, `useCricket.ts`, `useTourDuMonde.ts`, `useCheckoutPractice.ts`, `useConfirmationSortie.ts`, `X01Ecran.tsx`, `CricketEcran.tsx`, `TourDuMondeEcran.tsx` | Mécanisme partagé, `pret`, réouverture de la boîte |
| `composition/` | `container.ts` | `visitDrafts`, `manageVisitDraft`, câblage de `deleteMatch` et `manageBackup` |
| `tests/` | créer `use-cases/brouillonVolee.test.ts`, `ui/voleePartielle.test.tsx` ; modifier `fakes/index.ts`, `infrastructure/dexieRepositories.test.ts`, `use-cases/backup.test.ts`, `ui/annulationVolee.test.tsx` (intitulés « au montage » à reprendre) | Voir plan de tests |

**Sens des dépendances vérifié :** `ui`/`infrastructure` → `application` → `domain`. UI → `ManageVisitDraft`
par `useServices()`, types seulement depuis le domaine ; câblage dans `container.ts` seulement.
**Nouveau port ?** Oui, deux : `ManageVisitDraft` (driving, premier consommateur `useVoleeEnCours`) et
`VisitDraftRepository` (driven, consommé par `ManageVisitDraftUseCase`, `DeleteMatchUseCase` et
`ManageBackupUseCase`).

### Plan de tests (fakes, aucun mock)

- **Use cases** (`it.each(GAME_MODE_IDS)`) : aller-retour ; effacé après volée enregistrée ; volée rouverte
  rendue après annulation ; partie terminée / inconnue / `visitCount` différent / 4 fléchettes / fléchette
  invalide : `[]` et ligne effacée ; `save([])` efface ; `save` de 4 fléchettes lève `DomainError` ; `save`
  ne lit pas les parties (fake compteur) ; `DeleteMatch` efface le brouillon.
- **Sauvegarde** : export identique à celui d'avant (hors `exportedAt`) malgré un brouillon présent ; un
  import qui remplace une partie efface son brouillon, une partie absente du fichier garde le sien
  (option A) ; entrée invalide garde son brouillon ; sauvegarde v1 écrite à la main s'importe avec les
  mêmes compteurs.
- **Infrastructure** (`fake-indexeddb`) : aller-retour de l'adapter (une ligne par partie, aucune clé
  `undefined`) ; **migration v2 → v3** (base brute v2 avec joueur et partie, `verno` 3, données
  identiques, `visitDrafts` vide puis aller-retour) ; le test v1 → v2 existant reste vert.
- **UI** (« rechargement » = démonter puis rendre à neuf avec mêmes services et nouveau `QueryClient`) :
  quatre modes, 1 à 2 fléchettes rendues, pavé actif, aucune voix ; sortie en attente en X01, Cricket et
  Tour du monde (boîte revenue avec et sans entrée héritée, retour = *Corriger*, rien dit avant
  *Valider*) ; volée rouverte après rechargement, entraînement compris, `RandomSource` non consulté ;
  brouillon vide après 3 fléchettes, bust et sortie validée ; périmé et incohérent écartés sans message ;
  dépôt en panne : saisie continue, pavé jamais grisé ; file (écriture suspendue puis libérée, dépôt
  finit vide) ; StrictMode (une seule lecture, un seul empilage).
- Chaque test d'absence affirme d'abord sa précondition. Angles morts (saut d'entrée de Chrome, iOS au
  rechargement, spinner) : seul le téléphone les montre.

## Décisions de `CLAUDE.md` concernées

- **À réviser** : § Décisions structurantes « Annulation fléchette par fléchette, sortie confirmée » :
  « non persistées comme toute volée en cours » devient « comme toute volée en cours, dans le brouillon de
  volée, hors journal : aucun événement nouveau ».
- **À graver** : nouvelle décision « **Brouillon de volée** (lot `volee-partielle`) » : table `visitDrafts`
  (Dexie v3), une ligne par partie, clé `visitCount`, jamais exporté, effacé à l'enregistrement, à la
  suppression et à l'import qui remplace la partie, incohérent donc écarté et effacé, reprise silencieuse,
  boîte rouverte, bascule non gardée.
- Autres documents : `CONVENTIONS` § 9, 10, 11, 14 ; `rules/persistence.md`, `rules/frontend-react.md`,
  `rules/glossary.md` (ligne « volée en cours (brouillon) / `VisitDraft` ») ; `PROJECT_PLAN` § 0, § 4,
  § 2 « Ports » (contenu non vérifié), § 5, § 6 (dont la limite « perdues si l'app se ferme » du lot
  `annulation-volee`, levée) ; index régénéré après `CLAUDE.md`.

## Baseline sécurité

- Zéro réseau, aucune dépendance, service worker et en-têtes intacts, aucun `localStorage`, aucun
  nouveau rendu de saisie. Seule entrée non fiable : l'import, validation inchangée et faite avant toute
  écriture ; l'effacement du brouillon passe après la validation, partie par partie.
- Données au repos : la même IndexedDB, aucune donnée personnelle nouvelle, jamais exportée. Intégrité :
  brouillon revalidé (forme, nombre, `visitCount`, journal, légalité par préfixes), jamais écrit au
  journal sans un geste.
- Résiduels : **R1** ABA de `visitCount` après ≥ 2 échecs d'écriture (effet borné : fléchettes légales,
  visibles, retirables ; owner Sécurité, Revue) ; **R2** Chrome peut sauter l'entrée empilée sans geste
  préalable : le retour quitte la partie au lieu de *Corriger*, rien n'est écrit, la boîte revient à la
  réouverture (relecture sur Android) ; **R3** deux onglets (accepté) ; **R4** `versionchange` (Sécurité,
  avec `docs/DEPLOIEMENT.md`).

## Conformité à la planche

Sans objet : aucune planche citée, rien de nouveau ne s'affiche. Conséquences visibles déduites de la
demande ou de `CLAUDE.md`, sans question : reprise après un aller-retour par l'Accueil (F3), bascule S/D/T
qui revient à Simple, « partie en cours » de l'Accueil inchangée tant qu'aucune volée n'est enregistrée.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| Q1 | **« Restaurer » fusionne, il ne remplace pas la base (F1).** Deux lectures de « effacé quand une restauration remplace la base » : **(A)** seul le brouillon des parties que le fichier remplace est effacé, une partie absente du fichier garde ses fléchettes en cours, la politique reste vraie telle quelle ; **(B)** tout brouillon est effacé à chaque import, la phrase publique « le reste de la base n'est pas touché » devient fausse : texte et date à changer dans le lot, plus un `clear()` au port. À trancher de préférence avant Dev. | **Utilisateur** (arrêt Archi → Dev) |
| 2 | Le test de migration confirme que Dexie 4 garde les tables non redéclarées ; exporter ou extraire la validation d'une fléchette ; noms (`ManageVisitDraft`, `useVoleeEnCours`) ajustables | Dev |
| 3 | Simulation de rechargement ; scénarios UI par mode (le pavé du Tour du monde n'a pas de bascule) | Test |
| 4 | R1 à R4 ; relire la politique, inchangée en A, changée en B | Sécurité |

**Q1 close le 2026-10-19 par l'utilisateur : option A.** Le `ManageBackupUseCase` n'efface que le
brouillon des parties remplacées, pas de `clear()` au port, texte et date de la politique inchangés.

Clôturées par ce rapport : clé de cohérence du brouillon (`visitCount` de l'état affiché) ; texte et date
de la politique (inchangés en A).

### Non vérifié par l'architecte (faute de tours)

Contenu de `PROJECT_PLAN` § 2 ; les écrans de résumé (s'ils réutilisent les hooks de mode, la lecture s'y
fait sans effet : partie terminée) ; `useDialogueNatif`, `BoiteConfirmation`, `HistoriqueEcran` au-delà de
l'appel de suppression, `tests/use-cases/annulationVolee.test.ts` ; de mémoire : héritage du schéma
Dexie, création synchrone des transactions, fermeture au `versionchange`, intervention de Chrome sur
l'historique, `history.state` d'iOS au rechargement.

### Erratum (2026-10-19, vérifié par `sec`, `04-revue-securite.md` R4)

La mention « Vieil onglet à la mise à jour v3 : échoue jusqu'au rechargement » (§ Cas de bord) est
**fausse** : Dexie 4.4.4 laisse le vieil onglet fonctionner (il rouvre la base à sa prochaine opération,
`verifyInstalledSchema` ignore une table en trop). Voir `docs/DEPLOIEMENT.md` § Mise à jour du schéma Dexie.

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
