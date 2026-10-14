# Lot `match-x01` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium, maxTurns 100,
> frontmatter), une passe, 174 appels d'outils. Contrôles relancés par l'Orchestrator.

## Ce qui a été implémenté

Tout le cahier des charges, §§ 1 à 12, questions 1 à 5. UI seule : aucun fichier de `src/core/`.

| Fichier | Changement |
|---|---|
| `src/index.css` | Tokens `--text-score-xl/l/m-portrait` (4,5 / 4,05 / 3,1 rem), `--text-multiplicateur` (0,8 rem), `--teinte-triple` (laiton 22 % sombre, 14 % clair) ; classes `.repere-lancer` et `.touche-armee` (règles sur `section[data-multiplicateur]`) |
| `commun/MomentCelebratif.tsx` | Conteneur `absolute inset-x-0 bottom-0 z-10`, sous-couche opaque `bg-ardoise` ; `role="status"`, `aria-live`, `pointer-events-none` gardés |
| `commun/DispositionPartie.tsx` | `justify-center` retiré ; ligne du nom `paysage:hidden` |
| `commun/Batons.tsx` | Restants en tirets `border-dashed border-craie/55` 2 px, trait barré compris ; acquis pleins |
| `x01/PaveFlechettes.tsx` | Prop `desactive` retirée ; `data-multiplicateur`, `touche-armee` sur les 21 touches de score ; exposant `text-multiplicateur` ; `paysage:gap-1`, rail par `--rail-p` |
| `x01/LigneJoueur.tsx` | Reste portrait / paysage ; `paysage:py-2` (`compact` : `paysage:py-1`) ; `au-lancer` retiré ; reste `craie-vive` si actif ou vainqueur, sinon `craie` |
| `x01/Tableau.tsx` | Lignes en grille `repeat(n, 1fr)` ; repère unique `aria-hidden` en `translateY(index × 100 %)`, retiré à la victoire |
| `x01/X01Ecran.tsx` | `EnTeteManche` en trois zones, une rangée en paysage ; tableau + moment dans un `div.relative` |
| `labels.ts` | `TITRE_BANDEAU_X01`, `sousTitreBandeauX01`, `libelleSetEnCours` |
| `cricket/PaveCricket.tsx`, `tour-du-monde/PaveCibles.tsx` | `desactive` retiré ; `paysage:gap-1` ; rail Cricket par `--rail-p` |
| `CricketEcran.tsx`, `TourDuMondeEcran.tsx` | Enveloppe `relative` tableau + moment ; `desactive` et `justify-center` retirés |
| `EntrainementEcran.tsx` | `desactive` retiré |
| `tour-du-monde/LigneCible.tsx` | Lignes resserrées en paysage (écart 3) |
| `docs/CHARTE_GRAPHIQUE.md` | § Typographie, Vocabulaire, Moments, Mouvement, Écran de match |
| `tests/ui/matchX01.test.tsx` | Nouveau, 21 tests |

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Reste portrait 1-2 joueurs à **4,5 rem**, pas 5,1 | Ajustement (procédure Q1) | 5,1 rem : « 501 » = 120 px dans 108 ; 4,5 rem = 106 px, plus grande taille qui tient. +6 % sur 4,25 au lieu de +20 % |
| Exposant armé en `laiton-clair` au lieu de `laiton` | Ajustement | `laiton` ≈ 2,8:1 sur le Triple clair, `laiton-clair` 4,54:1 |
| Paysage resserré aussi sur les pavés Cricket / Tour du monde et `LigneCible` | Ajustement (critère 2) | Sans ça, le Tour du monde à 4 faisait 501 px de page dans 390 |
| `HAUTEUR.compact` en `paysage:py-1` | Ajustement prévu au § 3 | X01 à 4 : 408 px avec `py-2`, 390 avec `py-1` ; touches à 48 px |
| Sous-titre par `libelleLegs` (« premier à 2 manches ») et non `libelleLegsCourt` | Ajustement | Texte exact de la planche ; `libelleLegsCourt` n'est plus appelée que par ses tests |
| Hauteur du repère `${100/n}%` au lieu de `calc(100%/n)` | Ajustement | jsdom normalise `calc`, test fragile |
| `.au-lancer` conservée | Ajustement | Encore employée par Cricket et Tour du monde (lot 6) |
| Reste du vainqueur en `craie-vive` | Ajustement prévu au § 10 | Sa ligne n'est plus active et perd le repère ; l'écran part aussitôt au résumé |

Aucune refonte nécessaire.

## Mesures (Chrome réel, playwright-core sur `vite dev`)

**Q1 — largeur en Oswald 700, colonne RESTE 108 px (107 utiles hors filet)**

| Taille | « 701 » | « 501 » | « 301 » |
|---|---|---|---|
| 5,1 rem | 114,6 | 120,3 | 120,7 |
| 4,5 rem (retenu) | 101,1 | 106,1 | 106,5 |
| 4,25 rem (avant) | 95,5 | 100,2 | 100,6 |
| 4,05 rem | 91,0 | 95,5 | 95,8 |
| 3,1 rem | 69,6 | 73,1 | 73,4 |

Chiffres larges (« 600 », « 660 ») : ≈ 120 px à 4,5 rem, débordaient déjà de ~5 px à 4,25 rem
(≈ 113). Colonne non élargie, comme prévu.

**Q2 — contraste sur le fond Triple** : `craie-vive` 12,07:1 (sombre, 22 %) et 11,38:1 (clair,
14 %) ; exposant `laiton-clair` 8,93:1 (sombre) et 4,54:1 (clair).

**§ 11 / Q3 — bandeau X01** : portrait 73 → 87 px ; paysage 65 → **49 px**. Portrait avec Set, DI,
DO et 701 : rien de rogné ni renvoyé à la ligne.

**Q4** : grille `1fr`, pas de repli `offsetTop`.

**Paysage 844 × 390, hauteur de page avant → après** : X01 à 2 : 409 → 390 ; X01 à 4 : 440 →
390 ; entraînement : 409 → 390 ; Tour du monde à 4 : 501 → 390.

**Moment superposé (X01)** : feuille et pavé immobiles (haut de feuille 99, hauteur 282,9, haut
du pavé 484, avant et après) ; le moment recouvre 76 px au bas de la feuille.

**Q5** : `typographieBoundary` vert ; les trois autres écrans compilent sans `desactive`.

## Contrôles (relancés par l'Orchestrator)

| Commande | Résultat |
|---|---|
| `npm run lint` | 256 fichiers, propre |
| `npm run typecheck` | propre |
| `npx vitest run` | **891 tests**, 58 fichiers, verts (870 avant, +21) |
| `npm run build` | OK, 49 entrées précachées |
| Grep `Ã` / `Â` / `�` sur `src`, `tests`, charte, dossier du lot | 0 |
| `git worktree list` | worktree temporaire du Dev bien supprimé |

## Questions ouvertes

| # | Question | Pour qui | Résolution (Orchestrator) |
|---|---|---|---|
| D1 | 4,5 rem convient-il pour le reste à 1-2 joueurs, ou élargir RESTE aux dépens de JOUEUR ? | Utilisateur | **Close, procédure Q1** : 4,5 rem livré ; la question est posée à la relecture à l'écran, l'élargissement serait un lot ou une boucle à part |
| D2 | Tour du monde à 4 en portrait : 865 px dans 844 (21 px de défilement), identique avant le lot | Utilisateur | **Close** : préexistant, hors périmètre ; renvoyé au lot 6 `feuille-commune` |

## Boucle 1 (Test → Dev) — `dev` (sonnet / medium)

| Point | Fait | Preuve qu'il peut échouer |
|---|---|---|
| T1 | Test du bandeau : `svg:not(.lucide)[width="24"]` + `aria-hidden` | Rouge sans `<Pictogramme nom="x01">`, rouge à `taille={20}` |
| M3 | Exposant : rien en Simple ; Double 40 / 2 / 50 ; Triple 60 / 3, rien sur le 25 | Rouge avec `{numero}` au lieu de `{numero * facteur}` |
| M2 | `describe.each` Cricket / Tour du monde : pavé jamais `disabled` pendant l'écriture, un seul enregistrement, volée en cours vidée ; `DepotSuspendu` factorisé dans `tests/fakes/index.ts` | Rouge avec `disabled` sur une touche de `PaveCibles`, rouge sans `occupe ||` dans `useTourDuMonde` |
| M1 | `describe.each` Cricket (« Fermée ! ») / Tour du monde (« Bouclé ! ») : moment superposé, provoqué par de vraies fléchettes sur des cibles réduites en config | Rouge sans `relative` dans `CricketEcran` |
| O1 | `.touche-armee` : bordure à 1 px, 2ᵉ pixel par `inset 0 0 0 1px laiton` ; même forme d'ombre au repos (sinon pas d'interpolation) ; fond 90 ms à l'appui, `--duration-normal` hors `:active` | Chrome : rectangle de la touche identique en Simple / Double (68,41 × 52), mi-fondu à 70 ms |
| R1 | Mesure seule : à 4,5 rem dans 108 px, 600 / 606 / 666 / 688 rognés de 1,5 à 3,6 px ; à 4,25 rem, 600 touche le bord | Captures `scratchpad/match-x01/r1-*.png` |

Contrôles relancés par l'Orchestrator : lint, typecheck, **896 tests**, build verts ; encodage 0.

## Révision 1 (Dev → Archi, utilisateur) — `dev` (sonnet / medium)

Décision de l'utilisateur après R1 : élargir RESTE en portrait aux dépens de JOUEUR. Remplace la
clause « pas d'élargissement » de Q1 et la question D1.

- `GRILLE_LIGNE` : RESTE **8.25rem (132 px) en portrait**, `paysage:` 6.75rem ; JOUEUR portrait
  148 → 124 px. Cases de fléchettes en `gap-1` partout. Tailles de reste inchangées
  (4,5 / 4,05 / 3,1 rem portrait). Commentaires (`GRILLE_LIGNE`, `index.css`) et charte à jour ;
  la charte corrige aussi « les deux dernières colonnes » en « les trois ».
- Test : classe de grille de la ligne et de l'en-tête (portrait + `paysage:`) ; rouge si 8.25 →
  6.75.

| Reste, 2 joueurs, 4,5 rem | Largeur | Air G / D dans la colonne |
|---|---|---|
| 600 | 120,1 | 5,4 / 5,5 |
| 606 | 119,2 | 5,9 / 5,9 |
| 666 | 118,4 | 6,3 / 6,3 |
| 688 | 115,9 | 7,5 / 7,5 |
| 206 | 117,5 | 6,7 / 6,8 |
| 501 | 106,1 | 12,4 / 12,4 |
| 701 | 101,1 | 15,0 / 15,0 |

- « BULL » : cases de 30,7 px pour 29,4 px de texte (marge 1,3 px), à 2, 3 et 4 joueurs.
- « JULIEN » entier ; ligne du vainqueur avec pictogramme non tronquée (`px-2` inutile).
- 3 joueurs : air 16,8 à 19,1 px ; 4 joueurs : 28,2 à 30 px.
- Paysage 2 / 3 / 4 joueurs : page 390 × 844, aucun rognage ni pseudo tronqué ; JOUEUR y mesure
  262 px (l'estimation « ~122 px » de la révision était fausse, sans conséquence).
- Préexistant, hors révision : en paysage à 2 joueurs, « 601 » à 4,25 rem n'a que 2,4 px d'air.
- Captures : `scratchpad/match-x01/rev1-*.png`.

Contrôles relancés par l'Orchestrator : lint, typecheck, **897 tests**, build verts ; encodage 0 ;
aucun worktree.

## Limites connues et TODO assumés

- Repère qui glisse et fondu du filet vus en instantanés seulement ; X01 complet en clair non capturé.
- Moments de Cricket et du Tour du monde ni déclenchés ni testés en superposition.
- Zones de sécurité (encoche) non simulées pour le bandeau paysage.
- `libelleLegsCourt` n'a plus d'appelant hors tests (nettoyage possible plus tard).
