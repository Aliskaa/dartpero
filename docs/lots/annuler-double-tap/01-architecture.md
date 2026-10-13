# Lot `annuler-double-tap` — architecture

> Écrit par l'Orchestrator depuis le rapport `PASS` d'`archi-scout` (sonnet / low), tentative 1.

Architecture result: PASS

## Problème

Dans les quatre hooks de mode, `annuler` retire la dernière fléchette en cours si
`dartsEnCours.length > 0`, sinon annule la dernière volée enregistrée. Un double appui réflexe sur
« Annuler T20 » retire donc la fléchette, puis défait la volée d'un autre joueur, ou une manche
gagnée. Le bouton n'est désactivé que par `desactive={occupe}` et `!peutAnnuler`, ce qui ne couvre
pas ce cas.

## Approche retenue

### 1. Un hook commun, pas quatre copies

Nouveau `src/ui/hooks/usePauseAnnulation.ts`, partagé par les quatre modes : la règle (1 s, au
passage « volée vide ») est identique partout, et quatre copies exposent à l'oubli d'un mode. Ni
port ni use case : c'est du comportement d'écran.

Signature proposée : `usePauseAnnulation(): { enPause: boolean; armer(): void; ecoulee(): boolean }`.

- Le hook lit `useServices().clock` (comme `useNouvellePartie` avec `services.clock.now()`).
- `useRef<number | null>` pour l'instant du retrait : la garde lit la valeur la plus récente entre
  deux rendus.
- `useState` `enPause` pour le rendu.
- Constante exportée `PAUSE_ANNULATION_MS = 1000`.
- Un `useEffect` nettoie le minuteur au démontage.

Dans chaque hook : quand `dartsEnCours.length === 1` (passage de 1 à 0 fléchette), retirer la
fléchette puis `pause.armer()`. Avec 2 fléchettes ou plus, aucune pause (critère 3). Dans la
branche « volée vide », `if (occupe || !pause.ecoulee()) return` avant l'annulation de volée.

### 2. Mesure du temps sans `Date.now()`

- `armer()` enregistre `clock.now()` dans la ref et passe `enPause` à `true`.
- Un `setTimeout(PAUSE_ANNULATION_MS)` repasse `enPause` à `false` : il ne sert qu'à réactiver le
  bouton à l'écran.
- La garde de `annuler` fait autorité : `ecoulee()` vaut
  `ref === null || clock.now() - ref >= PAUSE_ANNULATION_MS`. Elle ne dépend pas du minuteur
  (onglet en arrière-plan : l'horloge tranche).
- Garde `horlogeBoundary` : la regex ne cible que `Date.now`, `new Date` sans argument et
  `Date(...)` ; `services.clock.now()` et `setTimeout` passent.
- Tests : `SettableClock` de `tests/fakes/index.ts` (méthode `regler(instant)`), déjà employée
  par `accueilPartiesRecentes.test.tsx` et `nomDePartieEcrans.test.tsx`. **Pas** `TickingClock`,
  la valeur par défaut de `fakeServices`, qui avance d'une seconde à chaque lecture. Chaque test
  de pause passe `fakeServices({ clock: new SettableClock(...) })`.
- Visuel (bouton réactivé) : `vi.useFakeTimers()` et `act(() => vi.advanceTimersByTime(1000))`,
  ou `waitFor` avec un `timeout` en temps réel. Vérifier que les faux minuteurs ne bloquent pas les
  `findBy*` de TanStack Query (sinon `shouldAdvanceTime: true`).

### 3. Bouton grisé sans toucher aux composants

Les pavés (`PaveFlechettes`, `PaveCricket`, `PaveCibles`, pavé de l'entraînement) font déjà
`disabled={desactive || !peutAnnuler}`. Seul `peutAnnuler` change dans chaque hook :
`dartsEnCours.length > 0 || (!pause.enPause && history.length > 0)` ; à l'entraînement,
`roundsPlayed > 0`. Aucun composant, écran ni `labels.ts` modifié ; nom accessible et étiquette
(`annulation`) inchangés ; même aspect grisé que pendant une écriture, en portrait comme en
paysage.

### 4. Garde `occupe`

`if (occupe) return` en tête de `annuler`, avant `setErreur(null)`, et `occupe` dans les
dépendances du `useCallback`. Le retrait de fléchette est bloqué aussi pendant l'écriture,
cohérent avec `ajouterFlechette`. Pas de changement visible : le bouton est déjà désactivé
pendant l'écriture.

### 5. Plan de tests

Quatre fichiers : `tests/ui/x01.test.tsx`, `cricket.test.tsx`, `tourDuMonde.test.tsx`, et le test
de l'entraînement. Scénario de base : une volée complète enregistrée, le joueur suivant tape une
fléchette, `SettableClock`.

| Critère | Test |
|---|---|
| 1 | Une fléchette en cours, deux appuis au même instant : la fléchette disparaît, la volée enregistrée reste intacte (historique / `roundsPlayed`, joueur courant, reste), le bouton est `disabled` |
| 2 | `clock.regler(+1000)` et avance du minuteur : bouton actif, un appui annule la volée. Variante X01 : la volée avait gagné une manche (`legsToWin` à 1), elle est défaite quand même |
| 3 | Deux fléchettes en cours, deux appuis sans avancer l'horloge : les deux disparaissent, bouton actif entre les deux |
| 4 | Aucune fléchette en cours, historique non vide : un appui annule, sans attente |
| 5 | Au niveau du hook (`renderHook` avec le wrapper de `renderWithServices`) : le bouton désactivé empêche de le prouver par clic. `annuler()` deux fois sans re-rendu, dépôt fake dont l'écriture est suspendue par une promesse ; un seul appel (compteur sur le fake, pas de mock) |
| 6 | Les critères 1 à 5 dans les quatre fichiers ; à l'entraînement, « volée enregistrée » = dernière manche jouée |

Contre-épreuves, exécutées une fois et consignées : `PAUSE_ANNULATION_MS = 0` (ou `armer()` vide)
fait échouer le critère 1 dans les quatre modes ; sans la garde `occupe`, le critère 5 échoue.

Angle mort : le bouton grisé puis réactivé, et le vrai double appui sur Chrome Android, ne se
voient qu'à l'écran.

## Couches / chemins

- Nouveau : `src/ui/hooks/usePauseAnnulation.ts`.
- Modifiés : `src/ui/hooks/useX01.ts`, `useCricket.ts`, `useTourDuMonde.ts`,
  `useCheckoutPractice.ts`.
- Tests : les quatre fichiers ci-dessus, éventuellement `tests/ui/usePauseAnnulation.test.tsx`.
- Rien dans `src/core`, `src/infrastructure`, `src/composition`, ni `labels.ts`.

## Décisions du contexte concernées

- `rules/frontend-react.md` : l'heure passe par `services.clock` ; le match en cours reste un état
  local synchrone porté par le hook du mode.
- `CLAUDE.md` : saisie fléchette par fléchette inchangée ; `undoLastVisit` et journal inchangés.
- Aucune surface gravée touchée.

## Baseline sécu

Aucune entrée non fiable, aucun réseau, aucun rendu HTML de pseudo, aucune permission ni donnée
stockée nouvelle (`/confidentialite` inchangée). Seul risque : un minuteur oublié après
démontage, mitigé par le nettoyage dans l'effet.

## Questions ouvertes

| # | Question (scout) | Résolution (Orchestrator) |
|---|---|---|
| 1 | La signature de `usePauseAnnulation` est une proposition | **Close** : Dev peut l'ajuster sans changer le contrat (garde par l'horloge, `enPause` pour le rendu, armement au passage 1 → 0), et le note dans `02-dev-notes.md` |
| 2 | `tests/ui/gestes.ts`, le test de l'entraînement et `renderWithServices` non lus | **Close** : Dev lit ces fichiers avant d'écrire les tests ; le plan ci-dessus reste le contrat, les écarts se notent dans `02-dev-notes.md` |
| 3 | `useCricket` et `useTourDuMonde` non lus en entier | **Close** : vérifié par l'Orchestrator (grep) — même structure `annuler` (`useCricket.ts:126-138`, `useTourDuMonde.ts:123-135`) et `peutAnnuler` (`:174`, `:169`) que `useX01` |
| 4 | Critère 5 testé au niveau du hook | **Close** : retenu. Si c'est impraticable sans mock, Dev le dit dans `02-dev-notes.md` au lieu de contourner ; Test jugera |
