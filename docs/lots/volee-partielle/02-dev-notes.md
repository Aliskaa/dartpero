# Lot `volee-partielle` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (opus, effort medium d'après son
> frontmatter, 1 lancement, 179 appels d'outils). Contrôles relancés par l'Orchestrator.

## Ce qui a été implémenté

Selon `01-architecture.md`, option A de Q1.

- **Application** : ports `VisitDraftRepository` (driven) et `ManageVisitDraft` (driving) ;
  `ManageVisitDraftUseCase(matches, drafts)` (`save` estampillé `GameModes.visitCount(base)` sans lecture
  ni `await` avant le dépôt ; `restore` à triple égalité de `visitCount`, fléchettes revalidées par
  `versDart`, partie existante, non terminée, même mode, sinon effacé et `[]`) ; `DeleteMatchUseCase`
  efface le brouillon puis la partie ; `ManageBackupUseCase` : validation, puis `drafts.delete`, puis
  `matches.save`, sans `clear()` ; `versDart` exporté de `backupSchema.ts` (format inchangé) ; commentaires
  de `ManageBackup.ts`, `ReopenedVisit.ts`, `MatchEvent.ts`.
- **Infrastructure** : table `visitDrafts` et `db.version(3)` sans `upgrade` (`database.ts`) ;
  `DexieVisitDraftRepository` ; `InMemoryVisitDraftRepository`.
- **Composition** : `Dependencies.visitDrafts`, `Services.manageVisitDraft`, `deleteMatch` et
  `manageBackup` câblés avec `visitDrafts`.
- **UI** : `useVoleeEnCours(matchId, state, evaluer) → { darts, poser, pret }` (lecture une fois par
  ouverture, partagée sous StrictMode, file d'écriture, échecs avalés) ; `evaluer` et `poser` dans
  `useX01`, `useCricket`, `useTourDuMonde`, `useCheckoutPractice` (qui rend aussi `pret`) ;
  `useConfirmationSortie` : réconciliation unique quand `pret` (entrée absente + sortie en attente →
  `demander()`) ; les trois écrans passent `pret`.
- **Tests** : `brouillonVolee.test.ts` (42), `voleePartielle.test.tsx` (21), 4 tests dans `backup.test.ts`,
  migration v2 → v3 et aller-retour de l'adapter dans `dexieRepositories.test.ts`, fakes `BrouillonsEnPanne`,
  `BrouillonsSuspendus`, `DepotCompteur`, getter `tirages` de `CyclingRandomSource`. Mutations faites à la
  main par `dev` (retrait de `demander()`, lecture StrictMode non partagée, 3e égalité de `visitCount`,
  `delete` à l'import) : chacune fait échouer un test.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| `tests/ui/feuilleCommune.test.tsx` modifié (non listé) | Ajustement | Son test « rejeu à froid » vérifiait la limite U9 (la volée rouverte disparaît au remontage), que le lot lève ; dernière assertion remplacée (« Volée de Julien » montre `S17S16—`), attente de l'écriture du brouillon avant de démonter |
| `restore` laisse remonter un rejet de `drafts.findById` | Ajustement | Le hook le traite comme « pas de brouillon » (`pret` passe à vrai) ; les autres incohérences sont avalées dans le use case |
| `useCheckoutPractice` rend aussi `pret` | Ajustement | Symétrie avec les trois autres hooks ; aucune boîte à l'entraînement |

## Contrôles

Relancés par l'Orchestrator après le rapport de `dev`.

| Commande | Résultat |
|---|---|
| `npm run lint` | 329 fichiers, aucune correction |
| `npm run typecheck` | aucune erreur |
| `npx vitest run` | 88 fichiers, **1672 tests verts** (1602 avant le lot) |
| `npm run build` | passe (PWA, 51 entrées de précache) |
| Grep `Ã|Â|�` | `src` : 1 occurrence, « BÂTONS » légitime (`CompteBatons.tsx:4`) ; `tests` : aucune |

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | La ref `reconciliee` n'est pas observable en test (`pret` est toujours faux au montage, donc le double effet StrictMode ne la sollicite pas) ; une mutation qui la retire reste verte. Gardée comme garde de sécurité, comme demandé | Test, Revue |
| 2 | `ManageBackup` : si l'effacement du brouillon échoue pendant un import, la partie est comptée comme écartée et son journal n'est pas écrit. C'est l'ordre demandé (effacer avant d'écrire) ; choix à relire | Sécurité, Revue |
| 3 | R4 : un vieil onglet face à `versionchange` en v3 n'est pas vérifié | Sécurité |

## Limites connues et TODO assumés

- Dans les hooks de mode, `enregistrer` ne liste pas `state` dans les dépendances de son `useCallback` : un
  futur correctif qui lirait `state` y lirait une valeur ancienne. Le code actuel n'utilise que
  `resultat.state` (remarque du 3e passage `dev`).

- Angles morts que seul un vrai téléphone montre : R2 (Chrome qui saute l'entrée empilée sans geste),
  `history.state` d'iOS au rechargement, bref spinner en revenant sur une partie en cache.
- Documentation (`CLAUDE.md`, `CONVENTIONS`, `rules/`, `PROJECT_PLAN`, index) non touchée : à faire par
  l'Orchestrator en fin de lot.
- Fichiers modifiés dans l'arbre **qui ne sont pas le fruit du lot** : `.claude/settings.json`,
  `.claude/hooks/`, `docs/PROJECT_PLAN.md` (relectures sur appareil du 19 octobre), `docs/request/killer.md`.
  À ne pas indexer au commit.
