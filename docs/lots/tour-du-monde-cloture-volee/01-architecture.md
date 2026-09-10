# Lot `tour-du-monde-cloture-volee` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent `archi`.

## Problème

Le domaine du Tour du monde sait déjà s'arrêter au bon endroit : `applyVisit`
(`src/core/domain/games/tour-du-monde/rules.ts:112-158`) sort de sa boucle sur la fléchette
qui boucle le parcours, ne compte que les fléchettes réellement utilisées (`dartsUsed`), et
n'écrit dans `history` que la volée tronquée.

L'écran, lui, ne le sait pas. `useTourDuMonde` décide seul qu'une volée est finie « à trois
fléchettes » et rien d'autre (`useTourDuMonde.ts:98`). Entre la fléchette qui boucle et la
3ᵉ fléchette tapée, il y a un trou que le joueur doit combler avec des fléchettes fantômes.
Pendant ce trou, le compteur affiché est faux — sur le chiffre qui départage le mode.

Ce n'est pas un défaut de règle, c'est un défaut de **consommation** de la règle : l'UI ne
pose pas la question au domaine, elle devine — et là où elle devine bien (le suivi de
progression, lignes 137-146), elle recopie la règle « toucher, c'est atteindre le secteur »,
ce que `CLAUDE.md` interdit explicitement. Le X01 (lot 3, `PreviewVisit`) et le Cricket
(lot 5c, `PreviewCricketVisit`) ont déjà résolu exactement ce besoin. Le Tour du monde est le
seul mode multi-fléchettes resté sans port de prévisualisation.

**Précision qui change la conception, vérifiée par `archi`** : au Cricket, `complete` se
déduit de `state.finished` parce que la fléchette qui clôt la volée est la même que celle qui
clôt la partie. Au Tour du monde, les deux sont **structurellement disjointes** — « on finit
le tour de table » (`CLAUDE.md`) : quand un joueur boucle, la partie continue tant que le tour
de table n'est pas complet. Recopier la formule du Cricket (`apres.finished`) produirait un
correctif qui ne corrige rien dans le cas le plus fréquent.

## Options considérées

| # | Option | Pour | Contre | Verdict |
|---|---|---|---|---|
| A | Port `PreviewTourDuMondeVisit` (synchrone, pur), miroir de `PreviewCricketVisit` | Patron déjà appliqué deux fois ; supprime la règle recopiée du hook ; compteur/progression/clôture d'une seule source | 2 fichiers + 3 lignes de câblage | **Retenue** |
| B | Condition de clôture ajoutée en local dans `useTourDuMonde` | Diff minimal | Double la règle recopiée au lieu de la supprimer ; diverge des 2 autres modes ; interdit par `CLAUDE.md` (« UI → use cases uniquement ») | Rejetée |
| C | Appeler `TourDuMondeRules.applyVisit` directement depuis le hook | Aucun fichier nouveau | L'UI appellerait un moteur de règles sans passer par un use case — hors frontière | Rejetée |
| D | Appeler `recordVisit` à chaque fléchette, laisser le domaine trancher | Supprime la notion de volée en cours côté UI | Casse `tourDeTableComplet = history.length % players.length === 0` (rules.ts:164), qui suppose une entrée d'historique par tour de jeu — ferait tourner la main à chaque tap | Rejetée — piège du correctif naïf, signalé au Dev |
| E | Étendre `PlayTourDuMonde` d'une méthode `preview()` | Un port de moins | Mélangerait un port async (dépôt) et un calcul pur (ISP). Le Cricket a tranché l'inverse | Rejetée |

**Forme du type de retour** : `{ state, complete }`, à l'identique du Cricket. `validees` /
`cible` restent dans `state` (vocabulaire d'écran, pas d'application) ; `dartsUsed` n'a plus
de consommateur une fois la volée close au bon moment.

## Approche retenue

### Le port et son use case

`src/core/application/ports/driving/PreviewTourDuMondeVisit.ts` :

```ts
export type TourDuMondePreview = {
  readonly state: TourDuMondeState
  readonly complete: boolean
}
export interface PreviewTourDuMondeVisit {
  execute(input: { readonly state: TourDuMondeState; readonly darts: readonly Dart[] }): TourDuMondePreview
}
```

`src/core/application/use-cases/PreviewTourDuMondeVisitUseCase.ts` — aucune dépendance de
constructeur, comme ses deux aînés :

- `darts.length === 0` → `{ state, complete: false }` **avant tout appel au domaine** (sinon
  `DomainError`, `applyVisit` refuse une volée vide) ;
- sinon `const apres = TourDuMondeRules.applyVisit(state, darts)`, puis :

```ts
const volee = apres.history.at(-1)
const boucle = volee !== undefined && volee.targetIndexAfter >= state.config.targets.length
return { state: apres, complete: boucle || darts.length >= 3 }
```

⚠️ **`apres.finished` n'entre PAS dans la formule** — c'est le cœur du lot. La volée se clôt
parce que **ce joueur n'a plus de cible**, pas parce que la partie s'arrête. Un commentaire
doit graver cette distinction dans le fichier : c'est la ligne qu'un copier-coller depuis
`PreviewCricketVisitUseCase` réintroduirait par réflexe.

`volee !== undefined` est imposé par `noUncheckedIndexedAccess` — branche morte en pratique
(`applyVisit` ajoute toujours une entrée) mais doit être écrite.

Cas limite vérifié : un joueur qui aurait déjà bouclé et rejouerait (garde-fou
`rules.ts:129`) donne `dartsUsed: 0`, `targetIndexAfter >= length` → `complete: true` —
correct, et de toute façon inatteignable (`finished` devient vrai à la fin du tour de table).

### Câblage

`src/composition/container.ts` : import du port + du use case, clé
`previewTourDuMondeVisit: PreviewTourDuMondeVisit` dans `Services` (à ranger avec
`previewVisit` / `previewCricketVisit`), instanciation
`new PreviewTourDuMondeVisitUseCase()`. Rien d'autre — ni `ServicesProvider`, ni
`tests/fakes/index.ts` (qui appelle le vrai `createServices`), ni la couture
`games/index.ts` (les ports d'aperçu n'y figurent pas, `PreviewCricketVisit` non plus).

### `useTourDuMonde.ts`

Miroir de `useCricket.ts` :

- `apercu` (lignes 137-146, calcul local) **disparaît**, remplacé par :
  ```ts
  const apercu = useMemo(() => {
    if (!state || termine) return null
    return services.previewTourDuMondeVisit.execute({ state, darts: dartsEnCours })
  }, [services, state, termine, dartsEnCours])
  const affiche = apercu?.state ?? state
  ```
  Le garde `termine` est obligatoire (`applyVisit` lève sur une partie finie) — même ligne que
  `useCricket.ts:61`, pas une précaution décorative.
- `ajouterFlechette` : `if (suite.length >= 3)` devient
  `if (services.previewTourDuMondeVisit.execute({ state, darts: suite }).complete) void enregistrer(suite)`
  — second appel au port (le mémo porte sur `dartsEnCours`, pas sur `suite`), exactement
  `useCricket.ts:114`.
- Le hook expose `affiche` au lieu de `apercu` (objet `{ validees, cible }`). Vérifié par
  grep : seul `TourDuMondeEcran.tsx` (lignes 136, 138) lisait `partie.apercu`.
- Le commentaire d'en-tête du hook (lignes 21-24, « la volée en cours n'a pas besoin d'être
  prévue par un port ») doit être réécrit — il affirme le contraire de ce que le lot établit.
- `annuler`, `annulation`, `peutAnnuler` : **aucune modification de code**, vérifié ligne à
  ligne (ils lisent `dartsEnCours.at(-1)` et `state.history.at(-1)`, jamais l'aperçu). Leur
  **comportement observable change** en revanche, et c'est voulu : après un bouclage sur la
  1ʳᵉ fléchette, le bouton passe aussitôt de « Annuler Bulle » à « Annuler la volée de
  Kevin » — cohérent avec le X01 après une sortie et le Cricket après une victoire.

### `TourDuMondeEcran.tsx`

Le `map` passe de `state.players` à `affiche.players` (miroir de `CricketEcran.tsx:154-165`),
ce qui règle d'un coup les lignes 136, 138-139 et 149 :

- `validees` → `joueur.targetIndex` (plus de ternaire `actif ? … : …`) ;
- `cible` → `state.config.targets[joueur.targetIndex] ?? null` ;
- `flechettes` → `joueur.dartsThrown`, plus d'addition faite à l'écran.

⚠️ **Reste sur l'état réel** (`state`, pas `affiche`) : `actif`
(`index === state.currentPlayerIndex && !state.finished`), `vainqueur` (`state.winnerId`),
`state.lastRound`, `total`, `compact`, la navigation sur `termine`. L'aperçu a déjà fait
tourner la main — le lire pour savoir qui joue ferait sauter le filet de laiton au joueur
suivant dès la première fléchette.

**Sur le symptôme du compteur** : une fois la clôture anticipée en place,
`dartsEnCours` ne peut plus contenir de fléchette que le domaine tronquerait — donc l'ancienne
somme deviendrait, *par ricochet*, exacte dans tous les cas atteignables. Passer par `affiche`
ne change donc **aucun affichage observable** : c'est un choix de robustesse (ne pas garder
une seconde source qui n'est juste que tant qu'un invariant maintenu ailleurs tient), pas un
correctif supplémentaire. **Aucun test ne distingue les deux implémentations** — le test du
compteur est en réalité un test du point de clôture.

### Le pavé — rien à écrire

La désactivation est une conséquence automatique de la clôture anticipée : `enregistrer`
appelle `setOccupe(true)` avant son premier `await`, dans le même lot de rendu que
`setDartsEnCours(suite)` ; `PaveCibles` reçoit déjà `desactive={partie.occupe}`. Aucun prop à
ajouter. La micro-fenêtre entre le tap et le re-rendu existe de façon identique au X01 et au
Cricket — hors périmètre de ce lot, ne pas y toucher.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | **Aucun.** `games/tour-du-monde/rules.ts` tronque déjà correctement, testé (`tests/domain/tourDuMonde.test.ts:143-158`). | — |
| `core/application/` | Créer `ports/driving/PreviewTourDuMondeVisit.ts` + `use-cases/PreviewTourDuMondeVisitUseCase.ts` | Nouveau port + use case, sans dépendance |
| `infrastructure/` | Aucun | Pas d'adapter : calcul pur |
| `composition/` | `container.ts` | +2 imports, +1 clé `Services`, +1 instanciation |
| `ui/` | `hooks/useTourDuMonde.ts` (apercu→port, ajouterFlechette, retour du hook, commentaire) ; `ecrans/games/tour-du-monde/TourDuMondeEcran.tsx` (map sur `affiche.players`) | Modification, pas de nouveau composant |
| `tests/` | `tests/ui/tourDuMonde.test.tsx` (nouveaux cas) ; `tests/use-cases/tourDuMonde.test.ts` (nouveau fichier, optionnel — voir Q6) | Ajout, aucune assertion existante modifiée |

**Sens des dépendances vérifié :**

```
ui (useTourDuMonde, TourDuMondeEcran)
   └─► composition (container : Services)
          └─► application (PreviewTourDuMondeVisit + use case)
                 └─► domain (TourDuMondeRules, TourDuMondeState, Dart)
```

Le port et le use case importent le domaine en chemins **relatifs**. L'UI n'accède au port que
via `useServices()`. Aucun mode n'importe un autre (les deux fichiers nouveaux vivent hors du
périmètre surveillé `core/domain/games/<mode>` / `ui/composants/<mode>`). `infrastructure/`
n'est pas touchée.

**Nouveau port ?** Oui : `PreviewTourDuMondeVisit`. Premier et seul consommateur, livré dans
ce même lot : `src/ui/hooks/useTourDuMonde.ts`. C'est la troisième occurrence du même besoin
(X01 lot 3, Cricket lot 5c) — le patron est établi, l'écarter pour ce seul mode créerait une
exception à justifier à chaque relecture.

## Décisions de `CLAUDE.md` concernées

**Invoquées, non modifiées :** § *Règles du Tour du monde* (« on finit le tour de table »,
départage au nombre de fléchettes, « la volée s'arrête sur la fléchette qui boucle le tour,
comme une volée de checkout au X01 » — déjà la spec de ce lot) ; § *Décisions du lot 5c*
(justification des deux ports du Cricket : « l'UI ne réimplémente jamais les règles, elle les
interroge ») ; § *Décisions de l'écran de match (lot 3)* (rôle de `PreviewVisit`) ;
§ *Conventions* (« UI → use cases UNIQUEMENT », ISP, « un port n'est créé qu'avec son premier
consommateur ») ; § *Couture `GameMode`* — inchangée.

**À graver dans `CLAUDE.md` avant de proposer le commit** (l'Orchestrator le fera à la fin du
lot, pas maintenant) :

> **Le Tour du monde a lui aussi son port de prévisualisation** (`PreviewTourDuMondeVisit`),
> pour la même raison que le Cricket : la volée s'arrête sur la fléchette qui boucle le
> parcours, et l'écran ne peut pas le deviner sans recopier la règle.
> ⚠️ **Différence avec le Cricket, à ne pas effacer par copier-coller** : `complete` ne se
> déduit **pas** de `state.finished`. Au Tour du monde on finit le tour de table, donc la
> partie continue après un bouclage. `complete` se lit sur la volée que l'aperçu vient
> d'ajouter à `history` (`targetIndexAfter >= config.targets.length`), ou sur les trois
> fléchettes.
> **Corollaire** : progression, cible courante et compteur de fléchettes viennent tous de
> l'état projeté par l'aperçu. Ce qui dit qui joue (`currentPlayerIndex`, `finished`,
> `winnerId`, `lastRound`) continue de se lire sur l'état réel.

Et une ligne d'entretien : ajouter `PreviewTourDuMondeVisit` à la liste des `ports/driving/`
du § *Arborescence (cible)*.

## Questions ouvertes — résolues au gate check

> Numérotées par `archi`. Résolution tranchée par l'Orchestrator (évidentes) ou reportée avec
> justification explicite (ce qui constitue déjà une réponse au sens du gate check).

| # | Question | Pour | Résolution |
|---|---|---|---|
| 1 | Non-régression dure : les 6 cas existants de `tests/ui/tourDuMonde.test.tsx` ne doivent perdre aucune assertion | Test | **Contrainte actée**, non négociable. Si un cas existant doit changer, Test remonte le blocage à l'Orchestrator plutôt que d'ajuster silencieusement l'assertion. |
| 2 | Cas décisif : bouclage à la 1ʳᵉ fléchette (2 joueurs) — seul cas qui distingue la bonne formule (`targetIndexAfter`) d'un copier-coller du Cricket (`apres.finished`) | Test | **Obligatoire** dans `03-plan-de-test.md`. Montage suggéré par `archi` : Kevin `[20, 19, miss]` puis Julien 3× `miss` via `recordVisit`, puis un seul clic « Bulle ». |
| 3 | Cas intermédiaire : bouclage à la 2ᵉ fléchette | Test | **Obligatoire**, même logique que Q2. |
| 4 | Le compteur de départage affiche le vrai nombre juste après une clôture anticipée | Test | **Obligatoire** — c'est le test du symptôme n° 2 de l'audit. |
| 5 | 3-4 joueurs : la main va au bon joueur, le tour de table se conclut au bon moment après une clôture anticipée | Test | **Obligatoire** — garde-fou contre l'option D rejetée (casserait `history.length % players.length`, silencieusement à 2 joueurs, visiblement à 3). |
| 6 | Test dédié au use case (`tests/use-cases/tourDuMonde.test.ts`), sachant que ni `PreviewVisit` ni `PreviewCricketVisit` n'en ont | Test | **Laissé à l'appréciation de Test.** L'assertion « `complete === true` alors que `apres.finished === false` » est plus directe en use case qu'en UI — un petit fichier à 4 cas (0 fléchette, 1 sans bouclage, la fléchette qui boucle, 3 fléchettes) est recommandé sans être imposé. Si Test l'écrit, il vit dans `tests/use-cases/`, pas `tests/domain/`. |
| 7 | Verrouiller par un test le changement de libellé du bouton Annuler après clôture anticipée | Test | **Non obligatoire.** Cheap et bienvenu si Test a le temps, mais ce n'est pas un comportement nouveau du code (mécanique déjà partagée avec X01/Cricket) — seulement un nouveau chemin pour l'atteindre. |
| 8 | Corriger le commentaire de `useCricket.ts:21-25` (« Comme au Tour du monde, la volée en cours n'a pas besoin d'être prévue par un port » — devient doublement faux) | Dev | **Autorisé, à faire.** Écart mineur et documenté par rapport au « ne pas toucher aux hooks des autres modes » du § Objectif : c'est un commentaire, zéro changement de comportement, et il mentirait sur le fichier qu'il ouvre si on le laissait. Dev le corrige en 2 lignes et le note dans `02-dev-notes.md`. |
| 9 | Ne pas reproduire le `partie.affiche ?? state` mort de `CricketEcran.tsx:75` (`affiche` y est déjà non-nul par construction) | Dev | **Acté.** Côté Tour du monde, `affiche` sort du hook non-nul (`?? state` dans le hook lui-même) ; l'écran le consomme tel quel, sans `??` supplémentaire. Ne pas corriger la scorie existante du Cricket : hors périmètre, sujet séparé. |
| 10 | Rappel `noUncheckedIndexedAccess` (tsconfig.json:20) sur `history.at(-1)` et l'indexation de `affiche.players` | Dev | **Acté comme consigne d'implémentation** : garder `volee !== undefined` explicite côté use case, et `affiche.players.map((joueur, index) => …)` côté écran plutôt qu'une indexation manuelle. |
| 11 | Ne pas étendre `MODES` de `hexagonalBoundary.test.ts`, ne pas renommer `PreviewVisit`→`PreviewX01Visit` en passant | Dev | **Confirmé hors périmètre** — déjà écrit dans `00-orchestration.md` § Objectif (« Hors périmètre »). Ce sont respectivement le candidat 5 de l'audit et un chantier de nommage séparé. |

Toutes les questions produites par cette phase ont une résolution écrite ci-dessus : statut
Architecture → **Faite**, aucun blocage ouvert.

## Révisions

> Ajoutées par les boucles 2 et 5. Ne jamais effacer la version précédente.

Aucune à ce stade.
