# Lot `volee-partielle` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (opus, effort high d'après son
> frontmatter, 1 lancement, sans shell). Lint, typecheck, `npx vitest run`, build et contrôle d'accents ont
> été relancés par l'Orchestrator (voir `02-dev-notes.md`). **Verdict : GO.**

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Sans objet | Le domaine ne change pas (commentaire seul dans `MatchEvent.ts`) |
| Use cases | Oui | `tests/use-cases/brouillonVolee.test.ts` (42, `it.each(GAME_MODE_IDS)`) : aller-retour, périmé, incohérent, effacé, `save` qui ne relit pas le journal ; `backup.test.ts:456-566` : export, import qui fusionne, sauvegarde v1 écrite à la main |
| Infrastructure | Oui | `dexieRepositories.test.ts:140-175, 218-267` : aller-retour de l'adapter, migration v2 → v3 sur fake-indexeddb |
| UI | Oui | `voleePartielle.test.tsx` (21), `feuilleCommune.test.tsx:628-656`, `annulationVolee.test.tsx:310-325, 459-482` ; « rechargement » = démonter puis rendre à neuf avec les mêmes services et un nouveau `QueryClient` |
| Architecture (gardes) | Sans objet | Aucune frontière nouvelle ; aucun `vi.mock` / `vi.fn` / `vi.spyOn` dans les tests du lot |

**Hors périmètre :** deux onglets (R3) et vieil onglet face à `versionchange` (R4), owner Sécurité.
**Angles morts assumés** (seul le téléphone les montre) : portrait et paysage, R2 (Chrome qui saute
l'entrée empilée), `history.state` d'iOS au rechargement, bref spinner en revenant sur une partie en cache,
latence réelle d'IndexedDB (critère 6 « ne ralentit pas »). La relecture sur appareil prévue par la demande
reste obligatoire.

## Cas de test — critères d'acceptation

| # | Critère | Test(s) | Verdict |
|---|---|---|---|
| 1 | 1 ou 2 fléchettes restituées, 4 modes | UI `voleePartielle:143-165` (2 fléchettes, 4 modes ; précondition `attendreBrouillon`) ; 1 fléchette en X01 à l'UI (l.169-185), 4 modes au use case (`brouillonVolee:92-111`) | Couvert |
| 2 | Volée rouverte qui survit | X01 `voleePartielle:232-251` ; Cricket `feuilleCommune:628-656` ; entraînement `voleePartielle:254-279` ; use case 4 modes `brouillonVolee:130-148` | Couvert, sauf Tour du monde au niveau du hook (T3) |
| 3 | Effacé à l'enregistrement | X01 (3 fléchettes, bust, sortie validée) `voleePartielle:187-230` ; sortie validée Cricket et Tour du monde (l.394) ; file d'écriture l.467-490 | Couvert ; clôture d'une manche d'entraînement non testée (T4) |
| 4 | Périmé ou incohérent écarté sans erreur | Use case `brouillonVolee:178-270` ; UI `voleePartielle:398-443` | Couvert ; échec de **lecture** non testé (T1) |
| 5 | Export sans brouillon ; ancienne sauvegarde importable | `backup.test.ts:474-565` | Couvert ; la dernière assertion (l.564) est tautologique |
| 6 | Pavé non grisé | `voleePartielle:447-479` (dépôt en panne, écritures suspendues) | Couvert en X01 (mécanisme commun) |
| 7 | Migration v2 → v3 et import, avec des fakes | `dexieRepositories:218-267` ; fakes `BrouillonsEnPanne`, `BrouillonsSuspendus`, `DepotCompteur` (`tests/fakes/index.ts:201-265`) | Couvert |

## Cas de bord non couverts

| # | Cas | Gravité |
|---|---|---|
| T1 | Le dépôt rejette `findById` : la partie doit s'ouvrir et le pavé être actif. Gestionnaire `useVoleeEnCours.ts:106-109` ; s'il casse, `pret` reste faux : **spinner sans fin, partie injouable** | **Recommandé avant fusion** |
| T2 | Écriture du brouillon réussie puis échec de l'enregistrement (N-1) : brouillon gardé, boîte revenue au rechargement si une sortie attendait, sinon volée close écartée | **Recommandé avant fusion** |
| T3 | Tour du monde, volée rouverte puis rechargement, au niveau du hook (`poser(darts, state)` à `useTourDuMonde.ts:224` resterait vert) | Moyenne |
| T4 | Entraînement : brouillon effacé à la clôture d'une manche | Faible (la clé le rend périmé) |
| T5 | Bascule S/D/T non gardée : test vert à vide (`voleePartielle:180-183`) ; armer « Triple » sans lancer, recharger, vérifier | Faible |
| T6 | `delete` qui rejette pendant `restore` ; journal illisible ; préfixe illégal en Cricket / Tour du monde | Faible |
| T7 | `ManageBackup` et `DeleteMatch` quand l'effacement du brouillon échoue : comportement non figé | Voir Q-T2 |

Préconditions absentes (`brouillonVolee.test.ts:113-128, 183-197, 211-219, 221-232, 234-243, 308-318` ;
`voleePartielle.test.tsx:187-215`) : à ajouter, l'architecture les exige. Commentaire I-1 de
`annulationVolee.test.tsx:455-457` trompeur : la protection vient de « `pret` est faux au montage », pas de
la garde.

## Résultats

| Commande | Résultat |
|---|---|
| `npm run lint` | propre (Orchestrator) |
| `npm run typecheck` | propre (Orchestrator) |
| `npx vitest run` | 88 fichiers, 1672 tests verts (Orchestrator) |
| `npm run build` | passe (Orchestrator) |
| Grep `Ã|Â|�` | RAS (« BÂTONS » légitime) |

## Bugs trouvés

| # | Bug | Classement | Renvoi |
|---|---|---|---|
| — | Aucun bug d'implémentation : ordre des écritures, estampille de l'état rouvert (4 hooks), une seule lecture sous StrictMode, effacement après succès seulement, entraînement, bascule non gardée, `ManageBackup` relus et conformes | — | — |
| 1 | T1 à T6, préconditions absentes, assertion tautologique `backup.test.ts:564`, commentaire I-1 | Problème de test | Test (comblé par un passage `dev` limité aux tests, voir `00-orchestration.md`) |

## Comblement des trous (2e passage `dev`, `tests/` seulement)

Ajoutés : T1 (`voleePartielle.test.tsx:561`, 4 modes, `BrouillonsIllisibles`), T2 (l.576-637 : volée close et
sortie en attente, `DepotEnPanne`), T3 (l.330), T4 (l.311), T5 (l.189), T6 (`PREFIXES_ILLEGAUX` l.518-559 ;
`brouillonVolee.test.ts:276, 292` avec `BrouillonsIndelebiles`), préconditions `findById` non nul (l.120, 195,
218, 231, 243, 350 ; `voleePartielle` l.211), précondition d'écriture dans le test v1 de `backup.test.ts`,
commentaire I-1 réécrit. Fakes ajoutés : `DepotEnPanne`, `BrouillonsIllisibles`, `BrouillonsIndelebiles`.
Aucun test ne fige Q-T2. Aucun fichier de `src/` touché. **Relancés par l'Orchestrator : biome, lint,
typecheck propres ; `npx vitest run` : 88 fichiers, 1685 tests verts** (1672 avant, +13).

**Mise à jour (3e passage `dev`, après la Revue) : 1691 tests verts.** Le passage de correction a fait des
mutations manuelles sur ses propres tests (C2, ordre de Q-T2, effacement avant l'`await` dans
`useCricket`, `useTourDuMonde`, `useCheckoutPractice`), toutes remises en place ; les mutations de T1-T6
ci-dessous restent **non faites**, acceptées telles par l'utilisateur le 2026-10-19.

⚠️ **Mutations manuelles de T1-T6 non faites** : l'auto-mode a refusé à `dev` toute édition temporaire de `src/` et tout
lancement de commande. Les dix mutations prévues (voir son rapport : T1 sans `setPretPour`, `poser([])` avant
l'`await`, `legale` toujours vraie, `poser(darts, state)` au Tour du monde, etc.) restent à exécuter : seul
l'utilisateur peut les autoriser ou les lancer. Sans elles, T1 à T6 sont lus mais pas prouvés capables
d'échouer.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| Q-T1 | Ajouter T1 et T2 avant la fusion | Fermée : oui, en plus de T3 à T6 et des préconditions (tests seuls) |
| Q-T2 | Quand l'effacement du brouillon échoue pendant un import ou une suppression, l'avaler et écrire / supprimer quand même, ou garder le refus actuel (partie non importée, comptée comme écartée ; partie non supprimée) ? Figer le choix par un test | Sécurité, Revue (Archi si changement) |
| Q-T3 | Garder la ref `reconciliee` telle quelle (inobservable avec les appelants actuels : `pret` est faux au montage ; non remise à zéro au changement de `matchId`, cas inatteignable) ou ajouter un test `renderHook` | Revue |
