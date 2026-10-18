# Lot `annulation-volee` — notes de Dev

> Rapport de `dev` (opus / effort du frontmatter : medium, 1 lancement), écrit par l'Orchestrator.
> Rien n'est commité ; la branche est restée `lot/annulation-volee`.

## Résultats des commandes (dernier passage, d'après le rapport de Dev)

| Commande | Résultat |
|---|---|
| `npx biome check --write src tests` | 306 fichiers, aucune correction |
| `npm run lint` | 317 fichiers, aucune erreur |
| `npm run typecheck` | OK |
| `npx vitest run` | 82 fichiers, 1534 tests verts (1497 dans l'index) |
| `npm run build` | OK, PWA générée (51 entrées en précache) |

À rejouer indépendamment par la phase Test.

## Implémenté

### Application
- `ports/driving/ReopenedVisit.ts` (nouveau) : `ReopenedVisit<S> = { state, darts }` (T1 : fichier à part,
  noms `undoLastVisit` / `UndoLastVisit` gardés).
- Ports `UndoLastVisit`, `PlayCricket`, `PlayTourDuMonde`, `PlayCheckoutPractice` : rendent
  `Promise<ReopenedVisit<État>>`.
- `UndoLastVisitUseCase`, `PlayCricketUseCase`, `PlayTourDuMondeUseCase` : dernière volée projetée
  (sinon `DomainError`), `slice(0, -1)`, projection **avant** l'écriture, une seule `save`, retour
  `{ state, darts: derniere.darts.slice(0, -1) }`.
- `PlayCheckoutPracticeUseCase.undoLastVisit` : dernière manche close, retrait du `RoundStarted` final
  puis du `VisitRecorded`, projection avant écriture.
- `PreviewTourDuMondeVisit` : `completesTour: boolean` (`boucle` ; `false` sans fléchette).

### Labels (`src/ui/labels.ts`)
`libelleAnnulation(flechette, joueur)` (« Annuler S5 » / « Annuler S5 de Kevin » / `ANNULATION_NEUTRE`) ;
« Annuler la volée de … » supprimé ; `LIBELLE_CORRIGER`, `LIBELLE_VALIDER_SORTIE`,
`titreConfirmationX01` + `texteConfirmationX01`, `titreConfirmationCricket` +
`TEXTE_CONFIRMATION_CRICKET`, `titreConfirmationTourDuMonde` + `TEXTE_CONFIRMATION_TOUR_DU_MONDE`.

### Hooks
- `useX01`, `useCricket`, `useTourDuMonde` : `sortieEnAttente` dérivé de l'aperçu ; `ajouterFlechette`
  rend un booléen ; `corrigerSortie()` (chemin commun `retirerFlechette()`) ; `validerSortie()` →
  `enregistrer` ; `confirmation: { titre, texte } | null` ; Cricket : nom = `apercu.state.winnerId`
  (U2) ; `annuler()` utilise `{ state, darts }`.
- `useCheckoutPractice` : manche rouverte, expose `annulation`, pas de confirmation.
- `usePauseAnnulation` : commentaire seulement.
- `useConfirmationSortie` (nouveau) : `useModaleAuRetour('confirmation', ['sortie'])`, `demander()` dans
  `onFlechette`, `surCorriger` (Corriger, Échap, voile), `surValider`, retour du téléphone = Corriger
  (U3, T4), entrée héritée dépilée au montage seulement (T3).

### UI
- `BoiteConfirmation` (nouveau, `composants/commun/`) : `<dialog>` monté en permanence, ni `flex` ni
  `grid`, pas de ✕, focus d'ouverture sur *Corriger*, `bg-ardoise`, filet haut 3 px `craie`,
  `max-w-[32rem]`, voile `backdrop:bg-feutre-nuit/65`, boutons 52 px, désactivés pendant `occupe`.
- `X01Ecran`, `CricketEcran`, `TourDuMondeEcran` : hook au-dessus des retours de chargement, résumé
  attendu sur `termine && auRepos` (T2). `EntrainementEcran` passe `annulation`.

### Docs
CHARTE § Saisie et § Composants ; CONVENTIONS § 9 et § 10 ; commentaires `UndoLastVisit.ts`,
`MatchEvent.ts`, `usePauseAnnulation.ts`. `CLAUDE.md` et `.ai/` non touchés (gravure en fin de lot).

### Tests
- Nouveaux : `tests/use-cases/annulationVolee.test.ts` (quatre modes, bust, manche / set / partie
  défaits, deux joueurs, rien à retirer, journal corrompu, rejeu à froid, cut-throat, Tour du monde,
  entraînement, invariant `describe.each(GAME_MODE_IDS)` avec garde ≥ 3 réouvertures) ; trois tests
  `completesTour` dans `tourDuMonde.test.ts` ; `tests/ui/annulationVolee.test.tsx` (17 tests) ;
  helpers `validerSortie` et `flechetteDeSortie` dans `tests/ui/gestes.ts`.
- Adaptés (T7), aucun supprimé : `x01`, `tourDuMonde`, `paveUnifie`, `reglesDuJeu`,
  `annulationDoubleTap`, `feuilleCommune`, `matchX01` (Tour du monde à `targets: [20, 19]`), `cricket`,
  `manches`, `parcours`, `matchLifecycle`, `cricket` / `tourDuMonde` / `checkoutPractice` (use cases).

## Écarts — tous classés Ajustement

1. Tailles de texte : la garde `typographieBoundary` interdit `text-[…]` ; titre `text-xl` (1,25 rem
   pour 1,2 rem de la planche), texte `text-sm`, boutons `text-xs`.
2. Voile à `bg-feutre-nuit/65` (planche : ~66 %), sans le jeton réservé `voile`.
3. Boutons de la boîte sans `Button` commun (relief `laiton-poli`, 56 px, filet 2 px incompatibles avec
   la planche : plats, 52 px, filet 1 px) ; désactivés en `opacity-40`.
4. Pas de `retour` passé à `useDialogueNatif` (T5) : le focus revient à l'élément d'origine ; Safari à
   vérifier à l'écran.
5. `parcours.test.tsx` : délai porté à 15 s (4 s seul, > 5 s sous charge).
6. `BoiteConfirmation` dans la branche chargée de l'écran (le hook est au-dessus des retours de
   chargement).

## Questions ouvertes

| # | Question | Nature | Pour qui |
|---|---|---|---|
| Q1 | Titre du Tour du monde sur la bulle : l'exemple « sur S25 » n'existe pas dans l'app (`libelleFlechetteTourDuMonde` donne « 25 » / « BULL »). Écrit : « Kevin boucle le parcours sur 25 ? » | Produit (texte à l'écran) | Utilisateur |
| Q2 | Texte de la boîte Cricket : U1 ne donnait que le titre. Écrit : « La partie est gagnée dès que vous validez. » | Produit (texte à l'écran) | Utilisateur |
| Q3 | Texte X01 « La manche est gagnée dès que vous validez. » aussi affiché pour la manche qui gagne un set ou la partie (texte de la planche, non varié) | Produit | Utilisateur |
| Q4 | Tour du monde : si le joueur qui boucle est le dernier du tour de table, la partie s'arrête juste après validation ; « La partie continue jusqu'à la fin du tour de table. » reste vrai à la lettre mais peut surprendre | Produit | Utilisateur |

## Limites connues

- Volée rouverte et fléchette de sortie en attente en mémoire seulement (U9, R1 acceptés).
- Entraînement : reste de la manche suivante re-tiré après correction (U8).
- R3 (appui fantôme après fermeture de la boîte) non couvert par un test : à vérifier à l'écran.
- Dans jsdom le pavé derrière la boîte n'est pas inerte ; la garde `sortieEnAttente` refuse quand même.
- T10 (relecture à l'écran, port 5202) non faite par Dev.
- Dette T8 inchangée (`useCheckoutPractice` recalcule reste et fin de manche sans port).
- Derrière la boîte, le tableau Cricket ne marque aucune ligne gagnante (`vainqueur` lit `state`, pas
  l'aperçu) : voulu.

## Tours de correction suivants (Dev relancé 3 fois par message, même agent)

- **Boucle 1 (Test → Dev)** : voir `03-plan-de-test.md` (I-1 `StrictMode`, C-1 à C-6, T-1). 1545 tests.
- **Boucle 5 (Revue → Dev)** : documentation seule. L'écart 6 est **justifié et documenté** (CONVENTIONS
  § 9 : la boîte ne s'ouvre que sur un appui, donc après le chargement, et le hook est au-dessus des
  retours) plutôt que corrigé ; `confirmation` ajoutée aux clés de § 9 ; § 14 (14 hooks, 27 fichiers de
  ports, `BoiteConfirmation`, `useConfirmationSortie`, `ReopenedVisit`) ; `rules/frontend-react.md` ;
  PLAN § 0 ; commentaires corrigés (Cricket, Tour du monde, `MatchEvent.ts`, un test).
- **Boucle 3 (relecture à l'écran → Dev)**, décisions de l'utilisateur :
  1. **Appui fantôme (R3)** : `GARDE_APRES_CORRECTION_MS = 500` (renommée `GARDE_APRES_FERMETURE_MS` à la boucle 4) dans `useConfirmationSortie`, mesuré sur
     `services.clock` ; armée par *Corriger*, Échap, voile et retour du téléphone (puis aussi par *Valider*, boucle 4 : voir ci-dessous) ;
     `pavePret()` interrogé en tête de `onFlechette` dans les trois écrans (appui ignoré sans bruit).
     4 tests échouent sans la garde.
  2. **Voile en clair** : `backdrop:bg-voile` (rgb(47 30 16 / .45) clair, rgb(4 8 5 / .62) sombre) au
     lieu de `feutre-nuit/65` (beige sur beige) ; `voile` devient une **famille à part** de la garde
     `themeBoundary` (« voile des boîtes du match » : `FeuilleRegles.tsx` + `BoiteConfirmation.tsx`) ;
     `rules/theme-colors.md`, CHARTE (Palette, `BoiteConfirmation`) et CONVENTIONS § 9 mis à jour.
     L'écart 2 (voile 65 %) de la liste ci-dessus est donc **caduc**.
  3. **Acceptés** : boîte centrée qui masque la ligne du joueur en paysage ; appui sur le pavé hors de la
     boîte = *Corriger* sans enregistrer la touche.
- **N-1 tranché par l'utilisateur : accepté tel quel** (aucun code).

- **Boucle 4 (Revue 2e passe → Dev)** : la Revue a relevé que la garde manquait après *Valider* (un double appui pouvait poser une fléchette fantôme au joueur suivant ; en paysage *Valider* est le bouton qui recouvre le pavé). La restriction « pas après Valider » venait du **brief de l'Orchestrator**, non d'une décision de l'utilisateur ; l'utilisateur a décidé d'**étendre la garde à *Valider***. `GARDE_APRES_FERMETURE_MS` ; test inversé + test Tour du monde (partie qui continue) ; au Cricket et à la manche finale du X01, `termine` refuse déjà l'appui. Retouches de documentation (theme-colors, commentaires, PLAN).

Dernier état : lint OK, typecheck OK, **1552 tests verts**, build OK (rejoués par l'Orchestrator).
