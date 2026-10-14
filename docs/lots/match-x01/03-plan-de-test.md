# Lot `match-x01` — plan de test

## Tentative 3 (après boucle 3) — `test` (sonnet / high)

**Verdict : PASS.** Lecture statique ; contrôles relancés par l'Orchestrator : **898 tests**,
lint, typecheck, build verts, encodage propre.

| Constat | État |
|---|---|
| N1 | Clos : commentaire `GRILLE_LIGNE` à ~262 px mesuré en paysage |
| N2 | Clos : exemple des chiffres larges (« 600 » ≈ 136 px à 5,1 rem dans 123 px utiles) |
| N4 | Clos pour le CSS : `color` et fond en `--duration-normal` hors appui, 90 ms à l'appui ; ordre et spécificité intacts, aucun halo. Partie `color` vraisemblablement inerte (voir P1) |
| N5 | Clos : test `gap-1`, ≥ 2 sorties trouvées, jeton exact |

| # | Constat | Classement | Suite |
|---|---|---|---|
| P1 | À l'appui, les touches gardent leur couleur de texte (`text-craie-vive`, couche `utilities`) qui bat `.touche:active { color: feutre }` (couche `components`) : chiffre ≈ 1,2:1 (sombre) / 1,3:1 (clair) tant que la touche est enfoncée. Pavés X01, Cricket, Tour du monde, « 0 », « Annuler », `JoueursEcran` | Préexistant, hors périmètre (confirmé par l'Orchestrator : `text-craie-vive` déjà sur `main`, `PaveFlechettes.tsx`) | Décision utilisateur à l'arrêt de fin de lot |
| P2 | Le fond des 21 touches armables se relâche en 180 ms, contre 90 ms pour « 0 », « Annuler » et les pavés non armables | Sans suite | Relecture |

Questions ouvertes de la phase, toutes résolues par écrit : TQ1 (R1) close par la Révision 1 ;
N6 et P1 remis à l'utilisateur à l'arrêt de fin de lot (relecture, hors périmètre).

## Tentative 2 (après boucle 1 et Révision 1) — `test` (sonnet / high)

**Verdict : PASS.** Lecture statique (pas d'outil d'exécution) ; contrôles relancés par
l'Orchestrator : 897 tests, lint, typecheck, build verts.

| Constat T1 | État |
|---|---|
| T1 | Clos : `svg:not(.lucide)[width="24"]` + `aria-hidden` ; seul svg non lucide du bandeau |
| R1 | Clos par la Révision 1 (RESTE 132 px portrait, ≥ 5,4 px d'air) ; relecture |
| M1 | Clos : moment superposé testé au Cricket (`targets [20, 19]`) et au Tour du monde (`targets [20]`), configs valides, vraies fléchettes |
| M2 | Clos : garde `occupe` et pavé non grisé testés au Cricket et au Tour du monde |
| M3 | Clos : exposant testé (Simple / Double / Triple, 25) |
| M4 | Non retenu |
| O1 | Clos (bordure 1 px + anneau inset, même forme d'ombre, appui 90 ms, aucun halo) ; réserve N4 |
| S1 | Clos : `DepotSuspendu` factorisé dans `tests/fakes/` |

Critères mis à jour : 3 et 4 couverts aux écrans concernés ; 5 couvert, exposant compris ; 9
pictogramme protégé (taille, `aria-hidden`). Le texte du critère 7 (« colonne de 108 px ») est
périmé depuis la Révision 1 : la colonne fait 132 px en portrait.

| # | Nouveau constat | Classement | Suite (Orchestrator) |
|---|---|---|---|
| N1 | `LigneJoueur.tsx:61` : JOUEUR paysage « ~122 px », mesuré 262 | Bug (commentaire) | Boucle 1 → Dev |
| N2 | `index.css:79-81` : exemple « 301 rogné à 5,1 rem » faux | Bug (commentaire) | Boucle 1 → Dev |
| N3 | Le test accepte tout pictogramme de 24 px, pas seulement `x01` | Manque de test, optionnel | Non retenu |
| N4 | À la relâche, texte en 90 ms et fond en 180 ms : texte clair sur fond encore clair, sur les 21 touches | Angle mort relecture | **Tranché** : corrigé en boucle (régression du lot à chaque fléchette) |
| N5 | `gap-1` des cases (plancher de BULL) non protégé | Manque de test | Boucle 1 → Dev |
| N6 | Paysage à 2 : « 601 » à 4,25 rem, 2,4 px d'air, préexistant | Angle mort relecture | Question à l'utilisateur à la relecture |

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high, frontmatter),
> tentative 1. Le sous-agent n'avait ni shell ni exécution : lecture statique ; les chiffres
> d'exécution sont ceux relancés par l'Orchestrator.

## Verdict (tentative 1)

**FAIL léger, sur les tests** : aucun bug d'implémentation établi, mais un test vert à vide (T1).
Retour Dev, boucle 1 (voir `00-orchestration.md` § Historique des corrections).

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine / use cases / infrastructure | Non concernés | Lot UI seul, aucun fichier de `src/core/`, aucun format persisté |
| UI (Testing Library) | Oui | `tests/ui/matchX01.test.tsx`, 21 tests sur des états (attributs, classes, ordre DOM, libellés) |
| Gardes d'architecture | Oui, inchangées | `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `lazyRoutes`, `horlogeBoundary` ; grep sans écart |
| Rendu | Angle mort | Hauteur, largeur, couleur, mouvement : mesures Chrome du Dev, puis relecture à l'écran |

## Matrice critères → tests

| Critère | Couverture | Verdict |
|---|---|---|
| 1. Lecture non centrée | `Disposition commune › ne centre plus la zone de lecture…` (composant commun aux quatre écrans) | Couvert indirectement |
| 2. Paysage 844 × 390 | Classe `paysage:hidden` du nom ; reste mesuré par le Dev | Angle mort (coupe, 48 px) |
| 3. Moment hors du flux | `Moment célébré › se superpose au bas du tableau…` (X01) | X01 couvert ; **M1** Cricket / Tour du monde |
| 4. Pavé non grisé, garde `occupe` | `Pavé X01 › fin du clignotement` (dépôt suspendu, fake) — bon test | X01 et entraînement couverts ; **M2** Cricket / Tour du monde |
| 5. Multiplicateur gradué | `data-multiplicateur` ×3 ; `touche-armee` sur exactement 21 touches ×3 ; retombée ; 25 en Triple | Couvert ; **M3** exposant, M4 sélecteur CSS |
| 6. Bâtons en tirets | `Bâtons › …` ×2 | Couvert |
| 7. Reste, aucun chiffre rogné | Classes en échelle `large` ; mesures Dev | Angle mort ; **R1** |
| 8. Repère et fondu en tokens | Aucun test de transition ; `prefers-reduced-motion` global les couvre | Angle mort ; **O1** |
| 9. Bandeau conforme | Titre, sous-titre, Manche en craie, Set seulement avec sets, DI / DO | **T1** : pictogramme non protégé |
| 10. Gardes, lint, typecheck, tests, build | Relancés par l'Orchestrator : verts | Couvert |

§§ 10 (reste craie) et 12 (Manche en craie) testés ; § 11 (bandeau une rangée en paysage) angle
mort, 49 px mesurés par le Dev.

## Constats

| # | Constat | Classement (phase Test) | Suite donnée (Orchestrator) |
|---|---|---|---|
| T1 | `matchX01.test.tsx:218` : `svg[width="24"]` trouve la flèche lucide (`width=24` par défaut) — vert même sans pictogramme | Manque de test | Boucle 1 → Dev |
| R1 | Restes à chiffres larges (600, 666…) ≈ 120 px à 4,5 rem, contre ≈ 113 à 4,25 : débordement de ~13 px au lieu de ~5 | Angle mort relecture | Boucle 1 : le Dev **mesure et capture** (sans changer la taille) ; décision à l'utilisateur |
| M1 | Moment superposé de Cricket et du Tour du monde non testé | Manque de test | Boucle 1 → Dev |
| M2 | Pavés Cricket / Tour du monde non grisés pendant l'écriture non testés | Manque de test | Boucle 1 → Dev |
| M3 | Valeur de l'exposant (2×, 3×, 50 sur le 25, rien en Simple) non testée | Manque de test | Boucle 1 → Dev |
| M4 | Sélecteurs CSS du filet armé non protégés | Manque de test, optionnel | Non retenu (classe testée ; relecture) |
| O1 | `.touche-armee` passe `background-color` à 180 ms pour toutes les touches de score (inversion à l'appui ralentie) ; `border-width` 1 → 2 px non animé (fondu partiel, décalage de 1 px) | Angle mort relecture | **Tranché par l'Orchestrator** : retour Dev — l'inversion à 90 ms est un signal existant que le lot ne doit pas dégrader, et le critère 8 demande un fondu du filet |
| S1 | `DepotSuspendu` recopié de `annulationDoubleTap.test.tsx` | Sans suite | — |
| S2 | `libelleLegsCourt` sans appelant hors tests | Sans suite | Nettoyage ultérieur |
| S3 | Lien de retour à 40 px, préexistant, hors zone de saisie | Sans suite | — |
| S4 | Nom de partie hors de l'arbre d'accessibilité en paysage | Sans suite | Choix du lot |

## Relecture à l'écran à faire

Portrait et paysage 844 × 390, sombre et clair, quatre écrans :

1. Reste X01 à 2 joueurs (501, 701, et un reste à chiffres larges : 600, 666), puis 3 et 4 joueurs.
2. Paysage : rien de coupé, rail entier, touches ≥ 48 px, nom masqué, bandeau X01 sur une rangée.
3. Portrait 390 px avec Set, DI, DO et 701 : bandeau sans rognage.
4. Double et Triple armés : filet sur 1-20 et 25, rien sur « 0 » / « Annuler », fond Triple, exposant en clair.
5. Fondu du filet au retour à Simple ; ressenti de l'appui.
6. Repère qui glisse ; `prefers-reduced-motion` : il saute.
7. Moment superposé : X01, Cricket, Tour du monde ; tableau et pavé immobiles, fond opaque.
8. Bâtons en tirets à 3 m.
9. Pavé qui ne clignote plus à la 3ᵉ fléchette.
10. Pictogramme `x01` 24 px, titre, « MANCHE N » en craie.

## Questions ouvertes

| # | Question | Résolution |
|---|---|---|
| TQ1 | R1 : rognage à 4,5 rem acceptable, ou retour à 4,25 ? | Mesure et captures en boucle 1, puis décision utilisateur à la relecture (avec D1) |
| TQ2 | O1 à corriger ? | **Close** : oui, boucle 1 |
| TQ3 | M1 / M2 dans ce lot ou au lot 6 ? | **Close** : dans ce lot (critères 3 et 4 visent les quatre écrans) |
| TQ4 | Repère entre la dernière fléchette d'une manche gagnée et la manche suivante | **Close** : le repère suit `currentPlayerIndex` que donne le domaine ; aucun attendu nouveau, rien n'est inventé |
