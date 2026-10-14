# Lot `feuille-commune` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high,
> frontmatter). Le sous-agent n'avait ni shell ni exécution : lecture statique, jugement des
> tests « verts à vide » par raisonnement de mutation ; les chiffres d'exécution sont ceux
> relancés par l'Orchestrator (lint, typecheck, 933 tests, build).

## Tentative 2 (après boucle 1) — `test` (sonnet / high)

**Verdict : PASS.** Lecture statique ; contrôles relancés par l'Orchestrator : **946 tests**
(`feuilleCommune.test.tsx` : 48), lint, typecheck, build verts, encodage propre.

| Constat T1 | État |
|---|---|
| 1 | Clos : `ETIQUETTE_VOLEE_EN_COURS`, `etiquetteDerniereVoleeDe`, `etiquetteVoleeLigne` dans `labels.ts`, utilisés par `LigneJoueur` et `TourDuMondeEcran` ; plus aucun littéral hors `labels.ts` (sauf `Cartouche.tsx:61`, préexistant) |
| 2 | Clos : cible morte (vraies fléchettes, `sr-only`, `opacity-30`, en-tête barré) et contre-test « fermée par un seul joueur » |
| 3 | Clos : annulation d'une volée, de la 1ʳᵉ fléchette, rejeu à froid (écran remonté depuis le dépôt), joueur supprimé |
| 4 | Clos : `repeat(2, 1fr)` asserté ; pictogramme du bandeau (Cricket, Tour du monde, Entraînement) ; carré = `couleurJoueur(…).fond` sur 3 profils distincts |

`CricketEcran.tsx` (incident d'encodage réparé pendant la boucle) relu : conforme à l'intention du
lot, chaînes françaises intactes, aucune règle réimplémentée.

| # | Nouveau constat | Classement | Suite |
|---|---|---|---|
| N1 | Test du pictogramme : forme vérifiée, pas le glyphe ; X01 absent du test | Sans suite (`pictogrammesBoundary`, relecture) | — |
| N2 | `gridTemplateRows` avec repli sur l'attribut `style` | Sans suite | — |
| N3 | Annulation sur la 2ᵉ / 3ᵉ fléchette, joueur supprimé courant | Sans suite, faible (même chemin) | — |
| N4 | `Cartouche.tsx:61` « Volée en cours » en dur | Préexistant hors périmètre | — |
| N5 | Chiffres de la tentative 1 et de `02-dev-notes.md` (933 / 35) | Documentation | Historique conservé ; chiffres à jour ici |
| N6 | Index cite `.au-lancer` | D5 | Index régénéré avant commit |

Questions ouvertes : TQ1 à TQ3 (D1, D2, marques en paysage) **closes par l'utilisateur** à l'arrêt
de fin de lot : recouvrement du moment au Tour du monde en paysage à 4 joueurs acceptable, noms
du Cricket à 15 px acceptés, marques à 28 / 26 px en paysage acceptées.

## Tentative 1 — `test` (sonnet / high)

**Verdict : PASS**, avec un bug mineur (constat 1) et trois manques de test (2 à 4), renvoyés au
Dev en boucle 1.

## Stratégie

| Niveau | Couverture |
|---|---|
| Domaine, use cases, infrastructure | Hors périmètre : aucune règle, aucun format, aucun port ; l'UI lit `lastRound`, `history`, `dartsEnCours`, `targetIndex`, `dartsThrown` |
| UI (Testing Library, fakes) | `tests/ui/feuilleCommune.test.tsx` (35 tests) ; suites adaptées `cricket`, `tourDuMonde`, `matchX01`, `vainqueurLecteurEcran` |
| Gardes d'architecture | `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `lazyRoutes`, `horlogeBoundary` vertes |
| Angle mort | Rendu : rognage, contraste, hauteur, recouvrement du moment, paysage — mesures et captures du Dev, puis relecture |

## Matrice critères → tests

| Critère | Couverture | Jugement |
|---|---|---|
| 1. Feuille, repère, `aria-current`, plus de `.au-lancer` | `describe.each` sur 3 jeux ; `FeuilleMatch` ; test d'absence `.au-lancer` avec contre-assertion | OK ; `repeat(n, 1fr)` non asserté (4) |
| 2. Carré 12 px | `span.size-3[aria-hidden]` coloré, 3 jeux, liseré absent | OK ; couleur non comparée au profil (4) |
| 3. Rien de rogné | — | Angle mort (7,1 px d'air au plus serré) |
| 4. Tour du monde 4 j. ≤ 844 | — | Angle mort (844 pile) |
| 5. Paysage | — | Angle mort |
| 6. Volée du Cricket | 4 tests (joueur précédent, en cours, début, encoches retirées) | OK ; cible morte non testée (2), bords annulation / rejeu / joueur supprimé (3) |
| 7. « Dernier tour » ssi `lastRound` | Présence / absence, style ; annulation puis rejeu à froid (`tourDuMonde`) | Bon |
| 8. Bandeau Cricket | Textes, aucun `border` / `bg-`, empilement, « Pts ↓ », filets exacts | Fort |
| 9. Moment | `h-11`, `absolute`, `aria-live`, dernier enfant d'un `relative`, ancrage `sous` / `bottom` | OK structurellement |
| 10. Libellés, tokens, gardes | Gardes vertes, grep propre | OK sauf constat 1 |
| Entraînement, cible, cases, couronne | Sous-titre, « Manche N/total », tailles par classe, bulle, cases, `vainqueurLecteurEcran` | OK |

Conformité aux §§ 10-19 relue contre le code : conforme (§ 14 « /21 » à 14 px au lieu de 13,
imperceptible ; § 15 décalage 18 px, justifié ; § 13 noms à 15 px, D2).

## Constats

| # | Constat | Classement | Suite (Orchestrator) |
|---|---|---|---|
| 1 | `TourDuMondeEcran.tsx:138` : « Volée en cours » et « Dernière volée de … » écrits en dur (critère 10) ; mêmes littéraux au X01 (`LigneJoueur.tsx:149`, lot 5) | Bug d'implémentation, mineur | Boucle 1 → Dev (partagés via `labels.ts`) |
| 2 | Cible morte du Cricket sans test (`sr-only`, colonne à 30 %, en-tête barré) | Manque de test | Boucle 1 → Dev |
| 3 | Volée du Cricket : annulation d'une volée, de la 1ʳᵉ fléchette, rejeu à froid, joueur supprimé non testés | Manque de test | Boucle 1 → Dev (classe de bug la plus coûteuse du projet) |
| 4 | `gridTemplateRows` non asserté ; pictogramme du bandeau vérifié au seul X01 ; couleur du carré non comparée au profil | Manque de test, faible | Boucle 1 → Dev |
| 5 | D1 (moment Tour du monde paysage 4 j.) ; écran < 844 px : le moment « sous » recouvrirait le haut du pavé ; 844 pile sans marge | Angle mort relecture | Relecture utilisateur |
| 6 | Contrastes : en-tête de cible morte `text-feutre/45` (hors garde) ; titre vert du moment sur fond vert | Angle mort relecture | Relecture utilisateur |
| 7 | Marques du Cricket en paysage 28 / 26 px, la planche dit 32 | Sans suite (conforme au § 12) | Relecture |
| 8 | Sortie de `<table>` : rôles perdus, compensés par `sr-only` et `aria-current` comme au X01 | Sans suite | — |
| 9 | `describe.each(JEUX)` en liste manuelle (l'entraînement n'a pas de feuille) | Sans suite | — |
| 10 | Tests existants adaptés : aucun affaiblissement constaté | Sans suite | — |
| 11 | D3 (= N6), D4 (intitulés des moments en dur), `'Hors'`, « Bust » / « Sortie » littéraux, index à régénérer (D5) | Préexistant hors périmètre | D5 avant commit |

## Relecture à l'écran à faire

1. Cricket 2 et 4 joueurs, portrait et paysage, sombre et clair : « MAXENCE », marques, PTS,
   cible morte, ligne VOLÉE, bandeau en paysage.
2. Cricket cut-throat : « Le plus bas / gagne », « Pts ↓ ».
3. Tour du monde 4 joueurs : 844 px, moment sous la feuille ; paysage (D1) ; bulle ; « Dernier
   tour ».
4. Un moment par jeu, X01 compris ; contraste du titre vert.
5. Changement de joueur : le repère glisse.
6. Tour du monde sur un écran plus court (≈ 667 px) : moment « sous ».
7. Entraînement : bandeau.
8. X01 2 et 3 joueurs : aucune régression.

## Questions ouvertes

| # | Question | Résolution |
|---|---|---|
| TQ1 | D1 : accepter le recouvrement au Tour du monde paysage 4 j. ? | Utilisateur, à l'arrêt de fin de lot |
| TQ2 | D2 : noms du Cricket à 15 px | Utilisateur, relecture |
| TQ3 | Marques en paysage 28 / 26 px au lieu de 32 | Utilisateur, relecture |
| TQ4 | Constat 1 et tests 2-4 dans ce lot ? | **Close** par l'Orchestrator : oui, boucle 1 (petits, et le 3 couvre annulation et rejeu) |
