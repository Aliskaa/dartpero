# Lot `volee-partielle` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (opus, effort xhigh d'après son
> frontmatter, 2 lancements : plafond de 40 tours atteint sans rapport, puis relance pour le rapport). `review`
> n'avait pas de shell : elle a lu les fichiers sur disque, sans `git diff`.

## Résumé

Le lot livre ce que demandent `01-architecture.md` et la demande : les fléchettes de la volée en cours vont
dans la table Dexie `visitDrafts` (`database.ts:88`, `db.version(3)` sans `upgrade`), derrière un port driven
`VisitDraftRepository` et un port driving `ManageVisitDraft` (`ManageVisitDraftUseCase`). Les quatre modes
partagent `useVoleeEnCours`. La boîte de sortie se rouvre une seule fois, quand le brouillon est relu
(`useConfirmationSortie.ts:93-98`). Le brouillon est effacé à la suppression (`DeleteMatchUseCase.ts:13-16`)
et à un import qui remplace la partie (`ManageBackupUseCase.ts:77-79`, option A). Les décisions de
l'utilisateur sont tenues (brouillon à part, quatre modes, jamais exporté, reprise silencieuse, Q1 = A) et le
hors-périmètre est respecté (discriminants de `MatchEvent` intacts, `BACKUP_VERSION = 1`, aucun
`localStorage`, aucun bandeau, `labels.ts` inchangé). **Aucun bug dans le code.**

## Constats

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| 1 | Majeur | `CLAUDE.md:191-193` : deux phrases fausses (« non persistées » ; « Rien n'est écrit… avant Valider », alors que la fléchette en attente est écrite au brouillon, `useX01.ts:209`). Nouvelle décision non gravée, index non régénéré | Passage doc de l'Orchestrator, **bloquant pour le commit** |
| 2 | Majeur | **Q-T2** non tranchée (effacement du brouillon qui échoue à l'import ou à la suppression) ; aucun test ne fige le comportement | Utilisateur, puis Test (T7) |
| 3 | Mineur | C2 : `useVoleeEnCours.ts:97-105`, pas de `try` autour du traitement de la lecture : si `legale` ou `evaluer` levait, `setPretPour` ne serait jamais appelé, spinner à chaque ouverture. Impossible aujourd'hui ; un mode futur pourrait le rendre possible. Correctif de quelques lignes (`try/finally`) | Dev (recommandé avant fusion) |
| 4 | Mineur | N-1 testé en X01 seulement : l'effacement avant l'`await` resterait vert dans `useCricket`, `useTourDuMonde`, `useCheckoutPractice` | Test |
| 5 | Mineur | Mutations de T1-T6 non faites. À la lecture, T1 (`voleePartielle:561-574`, 4 modes) et T2 (`:576-637`, X01) échoueraient si le code cassait ; non prouvé | Test si l'utilisateur autorise, sinon à accepter |
| 6 | Mineur | La liste `MODES` de `voleePartielle.test.tsx:73-143` est recopiée au lieu de s'appuyer sur `GameModeId` (`rules/testing.md`) ; avec Killer en attente, un `satisfies Record<GameModeId, …>` est recommandé | Test |
| 7 | Info | `01-architecture.md:182-183` : le vieil onglet R4 ne « échoue » pas, il continue de fonctionner (erratum ; mention dans `docs/DEPLOIEMENT.md`) | Aucun |
| 8 | Info | R1, R3 et C1 attendent la signature de l'utilisateur ; R2, iOS `history.state` et le spinner attendent la relecture sur téléphone | Utilisateur |
| 9 | Info | Q-T3 close par la Revue : on garde la ref `reconciliee` (aucun mal, protège un futur appelant où `pret` serait vrai au montage) | Aucun |
| 10 | Info | Entraînement : `reste <= 1` calculé côté UI (`useCheckoutPractice.ts:51-52`) sert aussi à juger un brouillon relu ; supposé repris de l'ancien `ajouterFlechette`, non confirmé sans diff | Aucun |

### Questions ouvertes — état

Closes : clé de cohérence ; texte et date de `/confidentialite` (option A, phrases relues
`labels.ts:435, 445-447`) ; Q1 (option A) ; questions 2 et 3 de `01` ; liste « non vérifié » de `01` pour les
écrans de résumé (aucun ne réutilise un hook de mode) ; Q-T3 ; R4 (vérifié par `sec` et par le test de
migration) ; les `useEffect` des écrans (voir ci-dessous). **Ouvertes** : Q-T2, C1, C2, R1, R2, R3, angles
morts téléphone.

### `useEffect` des écrans de match (comble le « non vérifié » de `04`)

Aucun n'enregistre, ne dit ni ne célèbre sur un état restauré. Ils ne font que
`navigate(résumé, { replace: true })` sur `termine && auRepos` (`X01Ecran.tsx:105-107`,
`CricketEcran.tsx:56-58`, `TourDuMondeEcran.tsx:61-63`) ou `termine` (`EntrainementEcran.tsx:28-30`) ;
`termine` vient de l'état projeté du journal, jamais du brouillon ; `restore` refuse toute partie terminée ;
`MomentCelebratif` dépend de `derniereVolee`, rempli dans `enregistrer` seulement.

## Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) : ports et use case n'importent que domaine et `application`, UI par `useServices`, câblage `container.ts:215-218, 237` | Oui |
| Aucun mode de jeu n'en importe un autre ; domaine non touché | Oui |
| Aucune couleur en dur dans `src/ui`, aucun `rounded-*` (aucun rendu nouveau) | Oui |
| Aucune règle de jeu réimplémentée dans l'UI | Oui, avec réserve (constat 10) |
| Aucune valeur persistée renommée | Oui |
| Sec a parcouru le diff (pas seulement les notes) | Oui : `fichier:ligne`, sans shell ; le trou des écrans est comblé ici |
| `CLAUDE.md` à jour des décisions durables du lot | **Non** (constat 1) |
| `.ai/architecture-context.md` régénéré | **Non** (constat 1) |

## Ce que l'utilisateur verra changer

Aller-retour par l'Accueil : la volée en cours survit à « Reprendre » (voulu, F3). Bascule S/D/T : retombe sur
Simple après un rechargement. « Partie en cours » de l'Accueil : le brouillon ne touche pas `updatedAt`, une
partie n'ayant que des fléchettes en cours peut s'afficher « Abandonnée » (reprenable, avec ses fléchettes).
Spinner : chaque ouverture attend la lecture IndexedDB, à relire sur téléphone. Import : réimporter son
propre export efface les ≤ 3 fléchettes en cours de la partie remplacée. Cas N-1 : après un *Valider* refusé
par le disque, la boîte revient au rechargement (amélioration). R2 : sur Android, le retour peut quitter la
partie au lieu de corriger.

## Go / no-go

**Verdict :** **NO-GO en l'état, conditionnel** : aucun renvoi vers Archi ni Sécurité, aucun bug de code.
**Justification :** le code est conforme au design ; il reste (1) Q-T2 à trancher par l'utilisateur, puis un
test qui la fige ; (2) la signature de l'utilisateur sur R1, R3, C1 et l'acceptation des mutations non
faites ; (3) le passage doc de l'Orchestrator (`CLAUDE.md` deux phrases fausses + nouvelle décision,
`CONVENTIONS` § 9, 10, 11, 13, 14, `rules/persistence`, `frontend-react`, `glossary`, `PROJECT_PLAN`,
`DEPLOIEMENT` pour R4, index régénéré, erratum de `01`) ; (4) recommandés sans bloquer : C2 (Dev), N-1 dans
les trois autres modes et `MODES` (Test). Boucles : Dev 1 (facultative), Test 1.

## Points non résolus après le lot

- R2, iOS `history.state` et le spinner : relecture sur téléphone (trois scénarios de la demande).
- R3 deux onglets, R1 ABA de `visitCount`, C1 fenêtre d'échec à l'import : signature de l'utilisateur.
- Non vérifié par la Revue : `git diff` lui-même ; `feuilleCommune.test.tsx` ; `annulationVolee.test.ts` ;
  `useDialogueNatif`, `BoiteConfirmation` ; `PROJECT_PLAN` § 2 ; remontage de l'écran d'une partie à une
  autre.
