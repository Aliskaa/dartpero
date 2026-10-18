# Lot `annulation-volee` — plan de test

> Rapport de `test` (opus, 1 lancement, **sans shell** : lecture seule), complété par les commandes
> rejouées par l'Orchestrator après chaque état du code.

## Stratégie

- **Domaine** : rien ne change (aucune règle, aucun événement) — hors périmètre.
- **Use cases** (`tests/use-cases/annulationVolee.test.ts`, `tourDuMonde.test.ts` pour `completesTour`,
  tests adaptés `matchLifecycle`, `cricket`, `checkoutPractice`) : volée rouverte, troncature,
  projection, rejeu à froid — là est le risque le plus coûteux.
- **Invariant transverse** : `describe.each(GAME_MODE_IDS)`, la volée rouverte n'est jamais complète
  (garde contre un test vide : ≥ 3 réouvertures).
- **Hooks / UI** (`annulationVolee.test.tsx`, `annulationDoubleTap.test.tsx`) : touche, boîte,
  historique, voix, pause d'1 s.
- **Architecture** : `hexagonalBoundary`, `themeBoundary`, `typographieBoundary`, `appuiBoundary`.
- **Hors périmètre** : format persisté, `backupSchema`, Dexie (rien n'y change), réseau et
  confidentialité (aucune capacité nouvelle).
- **Angle mort assumé : le rendu** (voir § Angles morts).

## Couverture des cas T6 / T7

Tous les cas de `01-architecture.md` T6 / T7 sont couverts : volée rouverte, volée d'une fléchette, bust
défait, manche / set / partie défaits, deux joueurs, cut-throat (recalculé à la main contre
`CLAUDE.md` § Cricket : 57 ≤ 57 ≤ 60, tout fermé, gagne), Tour du monde au dernier tour, entraînement
(même reste, `RoundStarted` final retiré, y compris la dernière manche), rien à retirer
(`DomainError`, journal inchangé) dans les quatre modes, rejeu à froid, invariant, `completesTour`,
touche 384 → 441 → 501, nom accessible, grisée, pause 1 s dans les quatre modes, boîte à chaque manche
X01 / Cricket / Tour du monde, jamais sur bust ni à l'entraînement, Corriger / Valider dans les trois
modes, voix muette avant Valider, retour / Échap / voile = Corriger, rechargement, arrivée au résumé
sans entrée orpheline, fléchette refusée tant qu'une sortie attend, journal identique en profondeur,
double appui sur Valider, entrée héritée sous `StrictMode`.

## Résultats

| Commande | Premier état (après Dev) | Après le tour de correction |
|---|---|---|
| `npm run lint` | OK, 317 fichiers | OK, 317 fichiers |
| `npm run typecheck` | OK | OK |
| `npx vitest run` | 82 fichiers, **1534** verts | 82 fichiers, **1545** verts |
| `npm run build` | OK, PWA 51 entrées | OK |

Toutes rejouées par l'Orchestrator (l'agent Test n'avait pas d'outil d'exécution). Contre-épreuve de
Dev sur le test `StrictMode` : retirer la garde fait échouer le test.

## Bugs et défauts trouvés, classés

| # | Constat | Classe | Résolution |
|---|---|---|---|
| I-1 | `useConfirmationSortie` dépile l'entrée héritée depuis un effet : sous `StrictMode` (dev, port 5202), deux `navigate(-1)` et l'on quitte la partie | Bug d'implémentation (boucle 1, tour 1) | Corrigé (ref `depilee`), test `StrictMode` ajouté |
| T-1 | Le test « journal qui ne se rejoue pas » ne prouve que « journal illisible → rien d'écrit » | Problème de test | Intitulé renommé |
| C-1 | « Rien à retirer » non couvert au Tour du monde | Problème de test | Ajouté |
| C-2 | Aucune vraie frontière de set | Problème de test | Ajouté (`setsToWin: 2`, `legsToWin: 1`) |
| C-3 | Fléchette refusée tant qu'une sortie attend, non couvert | Problème de test | Ajouté (X01, Cricket) |
| C-4 | Corriger / retour du téléphone en Cricket et Tour du monde non couverts | Problème de test | Ajouté |
| C-5 | Entraînement : dernière manche défaite sans vérifier le reste | Problème de test | Ajouté |
| C-6 | Journal identique en profondeur, double appui sur Valider | Problème de test | Ajouté |
| N-1 | Écriture en échec après *Valider* : historique déjà dépilé, fléchette en attente, boîte non rouverte, nouvelles fléchettes refusées, seule « Annuler » la retire | **Bord non spécifié** — pas de bug | Remonté à l'utilisateur (non bloquant) |

## Angles morts — relecture à l'écran (port 5202)

Portrait et paysage, thèmes sombre et clair, 360 px : titre `text-xl` en capitales Oswald et retour à la
ligne ; « Valider la sortie » en `text-xs` sur deux colonnes ; voile à 65 % ; contraste de
`disabled:opacity-40` pendant `occupe` ; appui fantôme après fermeture de la boîte (R3) ; focus à la
fermeture sous Safari (pas de `retour` passé à `useDialogueNatif`) ; pavé réellement inerte derrière
`showModal()` ; libellé « Annuler T20 » dans les quatre modes sans rognure en paysage ; rechargement avec
la boîte ouverte sur le serveur de dev. Note : `Dart.label` écrit « BULL » pour la bulle double, donc le
titre X01 peut dire « Kevin sort sur BULL ? » (libellé déjà en place dans l'app).

## Addendum — relecture à l'écran (agents `ecran` puis généraliste avec shell)

L'agent `ecran` n'avait pas de shell : aucune capture (`Ecran result: ECARTS` sans rien voir). Relecture
refaite par un agent généraliste (Chrome via `playwright-core`, `vite preview` sur **5202**, vraies
parties jouées par l'UI, X01 / Cricket / Tour du monde / entraînement, sombre et clair, 390×844,
844×390, 360×740) : `Ecran result: ECARTS`, deux points à corriger, les autres acceptés par
l'utilisateur.

| Constat | Résolution |
|---|---|
| Appui fantôme : double appui sur *Corriger* à 360×740 / 390×700 enregistrait un S2 (R3) | Corrigé (garde 500 ms). Re-vérifié dans Chrome : les 8 combinaisons (0/120/250/400 ms × 2 tailles) donnent l'état de référence ; un appui ~1,5 s après est pris ; *Valider* suivi d'un appui immédiat n'était pas bloqué **à ce moment-là** : comportement changé à la boucle 4 (garde étendue à *Valider*, décision de l'utilisateur), couvert par deux tests (1551 → 1552) mais **non re-vérifié dans Chrome** |
| Voile en clair : ~5 % d'atténuation | Corrigé (`voile`). Re-vérifié : atténuation hors boîte 37 % en clair (3 tailles), 54 % en sombre ; la boîte se détache en clair |
| Boîte centrée masquant la ligne du joueur en paysage ; appui hors boîte = *Corriger* | Acceptés par l'utilisateur |
| Inertie du pavé, double clic sur *Valider*, rechargement boîte ouverte, cibles ≥ 48 px, « Annuler T19 / S10 / 25 / D1 » sans rognure, touche grisée, pas de boîte à l'entraînement | Conformes (vus à l'écran) |

**Remarques non traitées** (hors décision) : la touche dit « Annuler 0 » quand la dernière fléchette est un
HORS ; le titre Tour du monde en portrait laisse « 25 ? » seul sur une ligne ; « moy 0,0 » pendant une
volée rouverte (U7, accepté) ; « MANCHE1/10 » et « RÉUSSIES0 » sans espace à l'entraînement (préexistant,
hors lot).

**Angles morts restants** : vrai téléphone (appuis fantômes réels), Safari / iOS (focus sans `retour`,
écart 4), VoiceOver / TalkBack, lumière de garage, noms de joueur longs, Cricket cut-throat et
entraînement avec bust à l'écran, parties à 3-4 joueurs.

Résultats rejoués par l'Orchestrator après la boucle 3 : lint OK, typecheck OK, **1551 tests verts**,
build OK (Dev) puis build du préview (agent).
