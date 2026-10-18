# Lot `annulation-volee` — revue

> Écrit par l'Orchestrator à partir des rapports du sous-agent `review` (opus, **sans shell** : lecture
> seule ; trois passes). Les résultats d'exécution cités (lint, typecheck, vitest, build, `git diff`,
> `npm audit`) sont ceux rejoués par l'Orchestrator.

## Résumé

Le lot livre, dans les quatre modes, ce qu'`01-architecture.md` a conçu.

1. **Annuler retire une fléchette à la fois**, la dernière jouée, quel que soit le joueur. Sans fléchette
   en cours, la dernière volée projetée quitte le journal (`slice(0, -1)` ; à l'entraînement, le
   `RoundStarted` final puis le `VisitRecorded`), la projection est faite **avant** l'unique `save`, et ses
   fléchettes restantes reviennent en saisie par `ReopenedVisit<S> = { state, darts }`. Rien de nouveau
   n'est persisté. Touche « Annuler S5 », nom accessible « Annuler S5 de Kevin ».
2. **La sortie se confirme avant toute écriture.** `BoiteConfirmation` (`<dialog>` natif) et
   `useConfirmationSortie` (sur `useModaleAuRetour('confirmation', ['sortie'])`) s'ouvrent au X01 à
   chaque manche, au Cricket à la fléchette qui gagne (nom du gagnant, cut-throat compris), au Tour du
   monde à la fléchette qui boucle le parcours (`completesTour`). Rien n'est écrit, dit ou célébré avant
   *Valider la sortie* ; fermer sans choisir vaut *Corriger* ; jamais sur un bust, jamais à l'entraînement.
3. **Ajouts venus de la relecture à l'écran et des Revues** : une garde de 500 ms
   (`GARDE_APRES_FERMETURE_MS`) pendant laquelle le pavé ignore les appuis après **toute** fermeture de la
   boîte (*Corriger*, Échap, voile, retour, *Valider*) ; le jeton `voile` pour le fond de la boîte en
   thème clair (entrée à part de la garde `themeBoundary`).

Aucun format persisté ne change (`MatchEvent` : commentaire seulement ; Dexie, `backupSchema`,
`container.ts` intacts).

## Constats

### 3e passe (delta de la boucle 4 et état final)

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| 1 | mineur | Le commentaire au-dessus de `pavePret()` des trois écrans disait « Juste après une correction » alors que la garde suit toute fermeture, *Valider* compris | Aucun — **corrigé par l'Orchestrator** (commentaires seulement) |
| 2 | mineur | Vocabulaire « famille à part » / « entrée à part » : `PROJECT_PLAN.md:2253`, commentaire `themeBoundary.test.ts:132`, clé `famille: 'voile des boîtes du match'` | Aucun — **corrigé** (plan, commentaire) ; la clé `famille` de la garde reste telle quelle |
| 3 | mineur | `03-plan-de-test.md:80` affirmait au présent « *Valider* suivi d'un appui immédiat n'est pas bloqué » (faux depuis la boucle 4) | Aucun — **annoté** par l'Orchestrator |
| 4 | info | Contre-épreuve de la boucle 4 non tracée dans `02-dev-notes.md` ; établie à la lecture : les deux tests (X01 `:705-729`, Tour du monde `:736-759`) ont chacun un témoin positif et ne sont pas verts à vide ; Dev annonce la contre-épreuve exécutée | Aucun |
| 5 | info | Les autres fichiers de tests ne voient pas la garde : `fakeDependencies` utilise `TickingClock` (une seconde par lecture) ; seul le banc de `annulationVolee.test.tsx` (`SettableClock`) la met à l'épreuve | Aucun |
| 6 | info | Angle mort : après *Valider*, la garde ne couvre que `onFlechette`. Un second appui tombant sur « Annuler » rouvrirait la volée validée (`usePauseAnnulation` n'est pas armée par `enregistrer`) ; sur la bascule S/D/T il armerait un multiplicateur. Récupérable, peu probable par la géométrie | Aucun — à regarder sur vrai téléphone |
| 7 | info | Restes de documentation : constat #33 de l'index (périmé en partie) ; `02-dev-notes.md:117` « famille à part » (récit de la boucle 3) ; `01-architecture.md:176,193` (R3 « Corriger » ; « jamais le jeton `voile` ») dépassés par les décisions des boucles 3 et 4, tracées dans `00`, `02` et PLAN § 6 | Aucun — l'index se régénère au prochain `/refresh-architecture` |
| 8 | info | `00-orchestration.md`, `05-revue.md`, `06-echanges.md` à tenir à jour | Aucun — Orchestrator (fait) |

### Historique des passes précédentes

| Origine | Constat | Renvoi | Résolution (vérifiée sur disque) |
|---|---|---|---|
| Test, boucle 1 | I-1 : entrée `confirmation` dépilée deux fois sous `StrictMode` ; couvertures C-1 à C-6 ; T-1 | Dev | Corrigé : ref `depilee`, test `StrictMode` avec contre-épreuve. 1545 tests |
| Test, Sécurité | N-1 : échec d'écriture après *Valider* (fléchette en attente, boîte non rouverte) | Utilisateur | **Accepté tel quel** le 2026-10-18 |
| Revue 1re passe | No-go conditionnel : N-1 et relecture à l'écran | Utilisateur / Test | N-1 accepté ; relecture faite dans Chrome (port 5202) : deux défauts trouvés et corrigés, le reste accepté |
| Revue 1re passe, 2-5 | Écart 6 non justifié ; clé `confirmation` et § 14 de CONVENTIONS ; `rules/frontend-react.md` ; PLAN § 0 ; commentaires (documentation) | Dev | Corrigé (boucle 5) |
| Relecture à l'écran | Appui fantôme après *Corriger* à 360×740 ; voile beige sur beige en clair | Dev | Garde de 500 ms et jeton `voile`, re-vérifiés dans Chrome (boucle 3). 1551 tests |
| Revue 2e passe, 1 | Garde absente après *Valider* (fléchette fantôme au joueur suivant) ; la restriction venait du brief de l'Orchestrator | Utilisateur puis Dev | **Résolu** (boucle 4), vérifié par code et tests ; non re-vérifié dans Chrome. 1552 tests |
| Revue 2e passe, 2 | Une ressaisie légitime dans les 500 ms après *Corriger* est avalée sans retour | Aucun | Accepté avec la garde (à vérifier sur vrai téléphone) |
| Revue 2e passe, 3-4 | Vocabulaire de `theme-colors` / `index.css` / `themeBoundary` ; PLAN §§ 0, 4, 6 | Dev | Corrigé (boucle 4), reliquat soldé en 3e passe |
| Revue 2e passe, 5 | Index périmé | Orchestrator | Régénéré (20e passe) |
| Revue 2e passe, 6-8 | Garde `themeBoundary` valable ; la garde ne couvre que `onFlechette` ; fenêtre de course réduite et non aggravée | Aucun | Information |
| Revue 2e passe, 9-10 | Addendum de la revue sécurité ; journal et Blocages ouverts | Orchestrator | Fait |
| Revue 2e passe, 11 | Remarques d'écran connues de l'utilisateur (« Annuler 0 » sur un HORS, « 25 ? » orphelin, « moy 0,0 » pendant une volée rouverte, « MANCHE1/10 » préexistant) | Aucun | Information |

## Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) | OK. `ReopenedVisit.ts` n'importe que `Dart` ; l'UI consomme les ports par `useServices()` |
| Aucun mode de jeu n'en importe un autre | OK. `useConfirmationSortie` est commun et ne connaît aucun mode |
| Aucune couleur en dur dans `src/ui`, aucun `rounded-*` | OK sur les fichiers du lot ; `voile` a une valeur sombre et une claire, une entrée de garde ; garde `themeBoundary` verte |
| Aucune règle de jeu réimplémentée dans l'UI | OK. `sortieEnAttente` dérivé des ports d'aperçu (`outcome === 'CHECKOUT'`, `apercu.state.finished`, `completesTour`) |
| Aucune valeur persistée renommée | OK. `MatchEvent.ts` : commentaire seulement ; aucune clé `localStorage` nouvelle ; `confirmation` est un état d'historique non persisté |
| Sec a parcouru le diff (pas seulement les notes) | OK. `git diff` et `npm audit` (0) relayés par l'Orchestrator ; deltas des boucles 3 à 5 relus par la Revue : aucune surface de la checklist ouverte |
| `CLAUDE.md` à jour des décisions durables du lot | OK. Une puce dans § Décisions structurantes, une décision gravée |
| `.ai/architecture-context.md` régénéré si une décision a été gravée | OK (20e passe), sous réserve du constat 7 |

Scénarios fonctionnels relus pour la boucle 4 (aucun blocage introduit) : joueur suivant qui tape tôt (perd
500 ms, accepté) ; « Annuler » hors de la garde ; Cricket et manche finale du X01 (`termine` refuse déjà
l'appui) ; pendant l'écriture (`occupe`) ; *Valider* → résumé (`termine && auRepos`) ; échec d'écriture
(N-1) ; entraînement (ni boîte ni garde).

## Go / no-go

**Verdict :** go (3e passe, après un no-go conditionnel en 1re et en 2e passe).
**Justification :** le seul point bloquant de la 2e passe (garde absente après *Valider*) est corrigé comme
l'utilisateur l'a décidé, dans le hook commun donc dans les trois modes, avec deux tests qui ne sont pas verts
à vide. Aucune question n'est restée ouverte sans acceptation explicite : U1-U10, Q1-Q4, N-1 et l'extension de
la garde sont clos dans `00-orchestration.md`. Les invariants gravés tiennent. Les constats restants sont
mineurs ou informatifs. Le go ne couvre pas la vérification sur vrai téléphone.

## Points non résolus après le lot

- **Garde après *Valider* non re-vérifiée dans Chrome** : prouvée seulement en jsdom avec une horloge
  simulée. Sur téléphone : double appui sur *Valider* à 0-400 ms, en portrait et en paysage ; vérifier qu'il
  ne tombe ni sur « Annuler » ni sur la bascule S/D/T.
- **Angles morts sur vrai téléphone** : appuis fantômes réels ; Safari / iOS (focus rendu sans `retour`,
  écart 4) ; VoiceOver / TalkBack ; lumière de garage ; noms de joueur longs ; parties à 3-4 joueurs ;
  Cricket cut-throat et bust d'entraînement à l'écran.
- **Risques acceptés par l'utilisateur** : R1 et U9 (volée rouverte et fléchette en attente perdues si
  l'app se ferme) ; U8 / R2 (reste de la manche suivante re-tiré à l'entraînement) ; N-1 ; boîte centrée qui
  masque la ligne du joueur en paysage ; appui hors de la boîte = *Corriger* ; moyenne pendant une volée
  rouverte (U7) ; 500 ms d'appuis ignorés après toute fermeture.
- **Remarques d'écran jamais posées comme questions** : « Annuler 0 » après un HORS (vocabulaire, lot A) ;
  « 25 ? » seul sur une ligne du titre Tour du monde en portrait ; « MANCHE1/10 » et « RÉUSSIES0 » sans
  espace (préexistant, hors lot).
- **Dettes** : T8 (`useCheckoutPractice` recalcule le reste sans port) ; `DialogueNouveauJoueur` hors du
  modèle `<dialog>` ; retouches de documentation du constat 7.
- **Fusion** : lot mené en parallèle des lots A et E ; `main` a probablement avancé depuis `27c57e0`.
  Rebase probable **avec accord**, conflits attendus sur `labels.ts`, la charte, CONVENTIONS, l'index ;
  relancer lint, typecheck, `vitest`, build, et régénérer l'index après le rebase.
