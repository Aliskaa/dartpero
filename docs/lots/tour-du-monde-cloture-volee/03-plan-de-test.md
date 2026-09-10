# Lot `tour-du-monde-cloture-volee` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (modèle `opus`) et de son
> complément, demandé au gate check pour couvrir l'annulation + le rejeu à froid.

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine (`games/tour-du-monde/rules.ts`) | Hors périmètre | Le lot ne touche pas une ligne du domaine ; la troncature est déjà couverte par `tests/domain/tourDuMonde.test.ts`. Re-tester aurait dupliqué sans rien protéger de neuf. |
| Use case / port (`PreviewTourDuMondeVisitUseCase`) | **Oui — nouveau fichier `tests/use-cases/tourDuMonde.test.ts`** | C'est là que la formule décisive du lot (`targetIndexAfter`, jamais `finished`) s'assèche en une assertion directe. |
| Infrastructure | Hors périmètre | Aucun adapter : le port est un calcul pur, sans dépendance de constructeur. |
| UI / écran (`tests/ui/tourDuMonde.test.tsx`) | **Oui — 7 cas ajoutés** | Le défaut est un défaut d'usage réel : nombre de clics, main qui passe, compteur de départage, annulation, rejeu. |
| Architecture (`tests/architecture/`) | **Oui — rejouées** | Nouveau port ⇒ nouveaux fichiers sous `src/core`, soumis à la garde « le cœur n'importe que lui-même, en relatif ». |

**Hors périmètre assumé** : X01, Cricket, entraînement (aucune assertion ajoutée ou modifiée) ;
`MODES` incomplet de `hexagonalBoundary.test.ts` (candidat 5 de l'audit, lot séparé) ; la
micro-fenêtre tap → re-rendu du pavé (identique au X01 et au Cricket, non testable en jsdom,
hors lot).

**Angles morts assumés** :

1. ⚠️ **Aucune relecture à l'écran n'a été faite.** Ce lot change ce que le joueur voit après
   une fléchette qui boucle : le pavé se grise, l'étiquette du bouton Annuler change, le
   bandeau « Dernier tour » apparaît. Trois lots du projet ont déjà été rattrapés uniquement
   en relecture visuelle (glyphe rogné, bandeau flottant, badges survivant au tirage) —
   aucune requête par rôle ne dit qu'un glyphe est coupé ou qu'un bandeau clignote mal. La
   séquence 390 × 844 (thème clair **et** sombre) reste à faire, idéalement avant de proposer
   le commit.
2. La micro-fenêtre entre le tap et le re-rendu du pavé n'est pas testable en jsdom
   (`userEvent.click` sérialise déjà les rendus) — inchangée par rapport au X01/Cricket.
3. Rien ne vérifie l'annonce vocale après une clôture anticipée (« Tour bouclé ! À toi,
   Julien »). Le chemin de code est inchangé (`enregistrer`), seulement atteint plus tôt.
4. Le seul cas volontairement laissé de côté : Annuler **pendant** une volée en cours après
   une clôture anticipée à 2 fléchettes (ex. annuler juste après la 1ʳᵉ touche d'une volée qui
   en prendra 2). Couvert par généralisation via le cas existant « retire la dernière
   fléchette saisie quand on annule », qui exerce le même chemin de code
   (`dartsEnCours.length > 0`).

## Cas de test

`tests/ui/tourDuMonde.test.tsx` (+192 lignes, **0 suppression** — non-régression prouvée
mécaniquement par `git diff --numstat`) :

| # | Cas | Type | Résultat |
|---|---|---|---|
| 1 | Les 6 `it` existants, intacts | non-régression | ✅ |
| 2 | Clôt la volée dès la 1ʳᵉ fléchette quand c'est elle qui boucle (2 joueurs) | bord — **le cas décisif du lot** | ✅ |
| 3 | Clôt la volée sur la 2ᵉ fléchette | bord | ✅ |
| 4 | Compte les fléchettes réellement lancées après une clôture anticipée | bord | ✅ |
| 5 | Rend la main au joueur suivant, et à lui seul, à trois joueurs | bord | ✅ |
| 6 | Bascule le bouton d'annulation sur la volée dès le bouclage | bord | ✅ |
| 7 | Annule la volée close sur la 1ʳᵉ fléchette, le rejeu (remount sans cache) confirme | bord — **annulation + rejeu** | ✅ |

`tests/use-cases/tourDuMonde.test.ts` (nouveau fichier) :

| # | Cas | Type | Résultat |
|---|---|---|---|
| 8 | 0 fléchette → `complete: false`, référence d'état inchangée (domaine jamais appelé) | bord | ✅ |
| 9 | 1 fléchette sans bouclage → `complete: false` | chemin heureux | ✅ |
| 10 | La fléchette qui boucle → `complete: true` **et** `state.finished === false` **et** `lastRound === true` | **le cas qui asseche la formule du lot** | ✅ |
| 11 | 3 fléchettes sans bouclage → `complete: true` | bord | ✅ |
| 12 | L'aperçu n'écrit rien (`getState().history` inchangé après `execute`) | bord | ✅ |
| 13 | Annule une volée close sur la 1ʳᵉ fléchette et se rejoue à froid (journal 1 fléchette, `undoLastVisit` restaure l'état exact, `project()` neuf `toEqual` l'état d'avant et l'état retourné) | bord — **annulation + rejeu, niveau use case** | ✅ |

## Résultats

| Commande | Résultat |
|---|---|
| `npm test` | ✅ **32 fichiers, 330 tests verts** (318 avant le lot → +12 : 7 UI + 5 use-case, une fois consolidé — le compte final inclut le cas 7/13 ajouté au gate check) |
| `npm run lint` | ✅ `biome check .` — 198 fichiers, 0 erreur |
| `npm run typecheck` | ✅ `tsc --noEmit` — 0 erreur |
| `npx vitest run tests/architecture` | ✅ 2 fichiers, 8 tests — les nouveaux fichiers `src/core/application/**` sont bien balayés par la garde de frontière hexagonale |

## Vert à vide ? Vérifié par mutation, pas seulement affirmé

Deux vérifications empiriques distinctes, sans toucher à `src/`, fichiers jetables supprimés
après coup :

1. **Le cas décisif (n° 2/10)** : formule remplacée par celle du Cricket
   (`apres.finished || darts.length >= 3`) et par l'ancien comportement
   (`darts.length >= 3`) → **les deux échouent** (« Cible de Julien » n'obtient jamais
   `aria-current` ; le port reste bloqué en attente d'une 2ᵉ/3ᵉ fléchette qui n'a plus de
   cible). Seule la formule livrée (`targetIndexAfter >= config.targets.length`) passe.
   **Mécanisme confirmé** : dans le montage du cas 2, la volée de Kevin est la 3ᵉ entrée
   d'historique d'une partie à 2 joueurs (`3 % 2 = 1 ≠ 0`), donc `finished` reste `false` —
   une formule fondée dessus laisserait `complete` à `false` indéfiniment.
2. **Le cas d'annulation (n° 7/13)** : rejoué avec 2 fléchettes fantômes réintroduites
   (`[Dart.bull(), Dart.miss(), Dart.miss()]`, le comportement pré-lot). Résultat instructif :
   **seule** l'assertion sur le contenu du journal échoue (3 fléchettes au lieu d'1) ; les
   assertions d'undo et de rejeu à froid **restent vertes** dans les deux cas. Conclusion
   correctement établie par Test : l'assertion sur le journal est **spécifique au lot**, les
   assertions d'undo/rejeu sont un **garde-fou générique** sur un chemin nouvellement
   atteignable (une volée d'1 fléchette), pas une preuve du fix en elles-mêmes. Documenté pour
   qu'une relecture future ne s'y trompe pas.

Le cas n° 4 (compteur) a été **renforcé pendant l'écriture** : sa première version aurait été
verte avant le lot (l'ancien écran affichait aussi « 4 » après un clic, par addition manuelle
`dartsThrown + dartsEnCours.length`). Deux assertions discriminantes ajoutées : la volée doit
être **close** (Kevin n'est plus `aria-current`) et la valeur doit être **persistée**
(`dartsThrown: 4`, `finishedInDarts: 4`, pas seulement affichée). Autocorrigé par Test avant
livraison — pas un bug, pas un retour Dev.

## Bugs trouvés

**Aucun.** Les 13 cas passent contre le code livré au premier essai, y compris le cas décisif.
Aucun retour vers Dev, aucun retour vers Archi.

## Points signalés, non classés comme bugs

| Constat | Statut | Décision |
|---|---|---|
| Couverture undo + rejeu à froid après clôture anticipée manquante dans le rapport initial | Signalé par Test (« droit de ne pas savoir »), pas inventé | **Résolu au gate check** : demandé en complément à Test (le même sous-agent, repris via `SendMessage`), qui l'a couvert aux deux niveaux (cas 7 et 13) sans trouver d'ambiguïté — le bouton Annuler tombe dans la branche déjà spécifiée au lot 3 (« annule la dernière volée enregistrée »), identique au X01 après une sortie et au Cricket après une victoire. |
| Annuler **pendant** une volée en cours après une clôture à 2 fléchettes, spécifiquement | Non couvert par un cas dédié | **Accepté sans nouveau test** : généralisé par le cas existant « retire la dernière fléchette saisie quand on annule », qui exerce exactement la même branche de code (`dartsEnCours.length > 0`), indépendamment du nombre de cibles restantes. |
| Aucune relecture à l'écran | Angle mort assumé (§ Stratégie) | À faire avant de proposer le commit, si le temps le permet — non bloquant pour la phase Revue, qui juge le code et la tenue du design, pas le rendu visuel pixel par pixel. |

## Questions ouvertes

Aucune restante. Statut Test → **Faite**.
