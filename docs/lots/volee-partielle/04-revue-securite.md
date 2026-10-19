# Lot `volee-partielle` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport du sous-agent `sec` (opus, effort high d'après son
> frontmatter, 2 lancements : plafond de 30 tours atteint sans rapport, puis relance pour le rapport). `sec`
> n'avait pas de shell : l'Orchestrator a vérifié lui-même `npm audit` et le diff de `versDart`. **Verdict :
> GO.**

## Menaces considérées

- Le joueur qui tape les scores : un brouillon qui écrirait au journal sans geste, qui parlerait, ou qui
  ferait tourner l'écran en boucle.
- Un brouillon corrompu ou forgé dans IndexedDB.
- Un fichier de sauvegarde reçu d'un pote, éventuellement édité à la main.
- Un vieil onglet ou un vieux bundle encore en v2 au moment de la migration v3.
- Dépendances, service worker, déploiement.

## Surfaces vérifiées sur le diff

| Surface | Touchée par le lot ? | Vérifié |
|---|---|---|
| Zéro réseau (`fetch`, SDK `firebase`) | Non | Grep `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, import `firebase` sur `src/` : aucune occurrence |
| Import JSON / `backupSchema` | Oui | Enveloppe validée avant toute écriture (`backupSchema.ts:230-248`) ; par partie : `versMatchRecord` (`ManageBackupUseCase.ts:77`), puis `drafts.delete` (`:78`), puis `matches.save` (`:79`). Un id hostile n'efface que le brouillon de la partie qu'il écrase déjà. Un rejet de `drafts.delete` tombe dans le `try` : partie écartée, pas de plantage. `versDart` : **seul changement = `export` et une JSDoc** (diff relu par l'Orchestrator) ; `BACKUP_VERSION = 1` inchangé |
| Rendu d'une saisie | Non nouveau | Fléchettes revalidées, rendues en texte React (`Dart.label`) |
| Format persisté (Dexie, `MatchEvent`) | Oui | `db.version(3).stores({ visitDrafts: 'matchId' })` sans `upgrade` (`database.ts:88`), `matches` / `players` non redéclarées, prouvé par le test de migration sur fake-indexeddb (`dexieRepositories.test.ts:218-266`) ; aucune clé `undefined` (`DexieVisitDraftRepository.ts:23-27`) ; le brouillon n'est jamais exporté (`exportAll` ne lit que `players` et `matches`) ; aucune valeur renommée |
| Service worker / `firebase.json` / manifeste | Non | Absents de `git status` |
| Permissions navigateur | Non | Rien de nouveau |
| Dépendances (`npm audit`) | Non | `package.json` et lockfile inchangés. `npm audit --omit=dev` (Orchestrator) : **0 vulnérabilité en production** ; `npm audit` complet : 8 dépendances de développement (`brace-expansion`, `@vitest/mocker`…), antérieures au lot et hors de son périmètre |
| Secrets | Non | Rien dans les fichiers nouveaux |
| `localStorage` / `sessionStorage` | Non | Aucune clé nouvelle |

**Intégrité d'un brouillon lu** (`ManageVisitDraftUseCase.ts:68-86`) : 1 à 3 fléchettes repassées par
`versDart`, partie existante, projetable, non terminée, même mode, `visitCount` strictement égal à trois
endroits (une valeur forgée `"3"` ou `NaN` est rejetée). Un incohérent est effacé au mieux. Un rejet de
`findById` (même un `MatchId.of` qui lève) ouvre la partie sans volée (`useVoleeEnCours.ts:106-109`), donc
sans spinner sans fin. Légalité vérifiée préfixe par préfixe (`useVoleeEnCours.ts:25-34`). Une volée
acceptée passe par `setSaisie` seul : ni écriture, ni voix, ni vibration. Le journal n'est écrit que par
`enregistrer`. Pas de boucle (lecture une fois par partie, réconciliation de la boîte une fois). Pas de XSS.

## Constats

| # | Sévérité | `fichier:ligne` | Scénario | Classement |
|---|---|---|---|---|
| C1 | Faible | `ManageBackupUseCase.ts:78-79` | Le brouillon est effacé, puis `matches.save` échoue : on perd au plus 3 fléchettes en cours d'une partie finalement non remplacée, et la phrase « le reste de la base n'est pas touché » (`labels.ts:446`) est inexacte dans ce seul cas. Rendre les deux écritures atomiques demanderait une transaction sur deux tables, donc un changement de port | Résiduel, owner Revue, aucune action requise |
| C2 | Info (durcissement) | `useVoleeEnCours.ts:97-105` | Si `legale` ou `evaluer` levait dans le `then`, `setPretPour` ne serait pas appelé : spinner sans fin. Non atteignable aujourd'hui (fléchettes revalidées, 1 à 3, partie non terminée) | Résiduel, owner Revue (`try` facultatif) |

Aucun bug d'implémentation, aucune faille de design.

## Résiduels

- **R1** ABA de `visitCount` (même nombre de volées, autre journal, après ≥ 2 échecs d'écriture) : effet borné,
  fléchettes légales, visibles, retirables ; rien n'entre au journal sans geste. Owner Revue.
- **R2** Chrome peut sauter l'entrée d'historique empilée : invérifiable dans le code ; rien n'est écrit, la
  boîte revient à la réouverture. Owner : relecture sur Android.
- **R3** Deux onglets : le dernier qui écrit gagne, mêmes contrôles à la relecture. Aucune signature de
  l'utilisateur : laissé en résiduel, pas accepté par `sec`.
- **R4** Vieil onglet face à la mise à jour v3 — **vérifié dans `node_modules/dexie` 4.4.4** : au
  `versionchange` l'ancienne connexion se ferme (`disableAutoOpen: false`) et ne bloque pas l'ouverture en
  v3 ; à la prochaine opération le vieil onglet rouvre la base ; `verifyInstalledSchema` ignore une table en
  trop. **Il n'échoue donc pas, il continue de fonctionner** : `01-architecture.md` disait « échoue jusqu'au
  rechargement », ce qui est à corriger dans la documentation du lot. Conséquences bornées : une partie
  supprimée depuis le vieil onglet laisse un brouillon orphelin (jamais relu) ; un import depuis le vieil
  onglet laisse un brouillon périmé, rendu seulement si `visitCount` coïncide (garde-fous de R1). Owner :
  Sécurité, avec une mention dans `docs/DEPLOIEMENT.md`.

## Q-T2 — instruction (non tranchée, revient à l'utilisateur)

Quand l'effacement du brouillon échoue : **à l'import**, la partie est comptée écartée et son journal n'est
pas écrit ; **à la suppression**, la partie n'est pas supprimée. L'échec se voit dans les deux cas
(compteur « écartées », message « Cette partie n'a pas pu être supprimée. »).

`drafts.delete` écrit dans la même base que `matches` : il n'échoue en pratique que si IndexedDB est en
panne, et `matches.save` / `matches.delete` échouerait alors aussi. Pire scénario, théorique : une table de
brouillons cassée bloquerait toute restauration et toute suppression ; rien n'est perdu, on peut réessayer.
Alternative (avaler l'échec puis écrire ou supprimer quand même) : à la suppression, brouillon orphelin pour
toujours, ce qui contredit « supprimer une partie » (`labels.ts:447`) ; à l'import, brouillon périmé sur un
journal remplacé (une forme d'ABA).

**Recommandation de `sec` : garder l'ordre actuel** (refuser plutôt que laisser un état incohérent) et le
figer par un test. Un changement passerait par Archi et l'utilisateur.

## Vie privée — `/confidentialite`, phrase par phrase (option A)

`labels.ts:427-429`, `:435` (couvre le brouillon, sans date ni nom), `:436`, `:437`, `:438`, `:439`,
`:445` (le brouillon est exclu de l'export), `:446` (vraie en A, sauf la fenêtre d'échec de C1), `:447` (le
brouillon part avec la partie ; exception : le vieil onglet de R4), `:453-454` : toutes restent vraies.
**Texte et date (17 octobre 2026, `labels.ts:413`) inchangés.**

## Mitigations

Revalidation complète du brouillon à la lecture, estampille `visitCount` de l'état affiché, file d'écriture
ordonnée, échecs avalés côté saisie, effacement après validation côté import. Aucune mitigation
supplémentaire requise.

## Risques acceptés

Aucun, signé par l'utilisateur ou non : `sec` n'en accepte aucun lui-même.

## Non vérifié

- Les `useEffect` des trois écrans de match (`X01Ecran.tsx:105`, `CricketEcran.tsx:56`,
  `TourDuMondeEcran.tsx:61`) : `sec` ne peut pas affirmer qu'aucun n'enregistre sur un état restauré ; risque
  faible, `restore` écarte les parties terminées. À relire en Revue.
- Le code de fusion des schémas dans `Version.stores` de Dexie (le test de migration le prouve à sa place).
- R2 et le comportement d'iOS : relecture sur téléphone.
