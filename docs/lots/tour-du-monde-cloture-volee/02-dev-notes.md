# Lot `tour-du-monde-cloture-volee` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (modèle `opus`, voir
> journal des décisions dans `00-orchestration.md`).

## Ce qui a été implémenté

**`core/application`** — deux fichiers créés :

- `src/core/application/ports/driving/PreviewTourDuMondeVisit.ts` : le port
  `PreviewTourDuMondeVisit` et le type `TourDuMondePreview { state, complete }`, imports du
  domaine en relatif, doc calquée sur `PreviewCricketVisit` avec l'avertissement « qui joue se
  lit sur l'état réel ».
- `src/core/application/use-cases/PreviewTourDuMondeVisitUseCase.ts` : aucune dépendance de
  constructeur. Court-circuit `darts.length === 0` avant tout appel au domaine, puis
  `TourDuMondeRules.applyVisit`, `volee !== undefined` explicite
  (`noUncheckedIndexedAccess`), puis :
  ```ts
  const boucle = volee !== undefined && volee.targetIndexAfter >= state.config.targets.length
  return { state: apres, complete: boucle || darts.length >= 3 }
  ```
  Commentaire gravant la distinction centrale du lot : `apres.finished` n'entre pas dans la
  formule, parce qu'au Tour du monde on finit le tour de table.

**`composition`** — `src/composition/container.ts` : +2 imports, clé
`previewTourDuMondeVisit: PreviewTourDuMondeVisit` insérée entre `previewVisit` et
`previewCricketVisit` dans `Services`, instanciation `new PreviewTourDuMondeVisitUseCase()`.

**`ui`** :

- `src/ui/hooks/useTourDuMonde.ts` — commentaire d'en-tête réécrit (il affirmait qu'aucun port
  n'était nécessaire) ; `apercu` devient un `useMemo` appelant le port, gardé par
  `if (!state || termine) return null` ; `affiche = apercu?.state ?? state` ; l'ancien calcul
  local de progression (qui recopiait « toucher, c'est atteindre le secteur ») supprimé ;
  `ajouterFlechette` teste `.complete` d'un second appel au port sur `suite` au lieu de
  `suite.length >= 3` ; le hook retourne `affiche` au lieu de `apercu`. `annuler`,
  `annulation`, `peutAnnuler`, `enregistrer` : code inchangé.
- `src/ui/ecrans/games/tour-du-monde/TourDuMondeEcran.tsx` — le `.map` itère sur
  `affiche.players` ; `validees = joueur.targetIndex`, `cible =
  state.config.targets[joueur.targetIndex] ?? null`, `flechettes = joueur.dartsThrown` (plus
  d'addition manuelle, plus de ternaire `actif ? … : …`). Restent sur `state` : `actif`,
  `vainqueur`, `total`, `compact`, `state.lastRound`, la navigation sur `termine`.
- `src/ui/hooks/useCricket.ts` — commentaire d'en-tête corrigé (Q8 de `01-architecture.md`),
  4 lignes, zéro changement de comportement.

**Non touchés, conformément au périmètre** : `core/domain/games/tour-du-monde/rules.ts`,
`ServicesProvider`, `tests/fakes/index.ts`, `games/index.ts` (la couture),
`tests/architecture/hexagonalBoundary.test.ts`, tout fichier X01 ou entraînement.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| `TourDuMondeEcran.tsx` : la garde d'existence en tête de composant inclut aussi `!affiche` (pas seulement `!state`), au lieu du `?? state` que la Q9 écartait explicitement | Ajustement | `affiche` sort du hook typé `TourDuMondeState \| null` (`apercu?.state ?? state`, avec `state` nullable) ; destructuré en tête de composant, il n'est pas narrowé par la garde existante. Ajouter `!affiche` à la garde satisfait TypeScript sans réintroduire le `?? state` mort de `CricketEcran.tsx:75` que la Q9 voulait précisément éviter — `affiche` est en pratique toujours défini dès que `state` l'est, donc la condition ne change aucun comportement observable, au même titre que le `volee !== undefined` du use case. |

*Refonte nécessaire* = arrêt, confirmation utilisateur, retour Archi (boucle 2). **Non
déclenché** : l'écart est un détail de typage, pas une remise en cause de la conception.

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | ✅ `biome check .` — 197 fichiers, 0 erreur |
| `npm run typecheck` | ✅ `tsc --noEmit` — 0 erreur |
| `npm test` | ✅ 31 fichiers, **318 tests verts** — aucun test ajouté ni modifié ; les 6 cas de `tests/ui/tourDuMonde.test.tsx` passent tels quels, y compris le bouclage pile sur la 3ᵉ fléchette (non-régression Q1 de `01-architecture.md` tenue) |

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| — | Aucune. Les 11 questions de `01-architecture.md` couvraient tous les points de décision réels rencontrés en codant. | — |

## Limites connues et TODO assumés

- La micro-fenêtre entre le tap et le re-rendu (le pavé ne se désactive qu'au rendu suivant,
  via `occupe`) existe à l'identique au X01 et au Cricket — non traitée ici, explicitement
  hors périmètre (§ Objectif de `00-orchestration.md`).
- **Pour la phase Test** : le cas Q2 de `01-architecture.md` (bouclage sur la 1ʳᵉ fléchette,
  2 joueurs) est celui qui distingue la formule retenue (`targetIndexAfter`) d'un
  copier-coller du Cricket (`apres.finished`) — avec ce dernier, `complete` resterait `false`
  tant que le tour de table n'est pas fini, et le correctif ne corrigerait rien. Aucun test
  existant ne couvre ce chemin ; c'est le test qui, à lui seul, valide le lot.
