# Lot `feuille-commune` — notes de développement

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium, maxTurns
> 100, frontmatter). Premier passage arrêté à la limite de 100 tours sans rapport, code largement
> écrit ; repris par message (même agent, contexte conservé) pour finir, contrôler, mesurer et
> rapporter.

## Contrôles relancés par l'Orchestrator

`npm run lint` (261 fichiers), `npm run typecheck`, `npx vitest run` (**59 fichiers, 933 tests**),
`npm run build` : verts. Grep `Ã` / `Â` / `�` sur `src`, `tests`, la charte et le dossier du lot :
aucun. `git status` : seuls les fichiers du lot (plus l'étude, modifiée à l'intake).

## Fichiers

**Créés** — `src/ui/composants/commun/` : `BandeauMatch.tsx` (exporte aussi `BadgeBandeau` : DI,
DO, « Dernier tour »), `FeuilleMatch.tsx`, `NomJoueurFeuille.tsx`, `CasesVolee.tsx` (variantes
`ligne` et `ruban`) ; `tests/ui/feuilleCommune.test.tsx` (35 tests).

**Modifiés** — `src/index.css` (`.au-lancer` retiré ; `.repere-lancer` pour les trois jeux ;
`.filet-colonne-entete` ; token `--text-nom-serre` 0,9375 rem, car `text-[…]` est refusé par
`typographieBoundary`) ; `src/ui/labels.ts` ; `MomentCelebratif.tsx` (une rangée `h-11`, prop
`ancrage`) ; `TableauCricket.tsx` (réécrit hors `<table>`) ; `LigneCible.tsx` (réécrit) ;
`x01/Tableau.tsx`, `x01/LigneJoueur.tsx` (adoptent les briques communes) ; `X01Ecran`,
`CricketEcran`, `TourDuMondeEcran`, `EntrainementEcran` (`BandeauMatch` ; `VoleeEnCours` du Cricket
et du Tour du monde supprimés) ; `docs/CHARTE_GRAPHIQUE.md`. Tests adaptés : `cricket`,
`tourDuMonde`, `matchX01`, `vainqueurLecteurEcran` (« N fléchettes » en deux éléments →
`toHaveTextContent` ; « Le plus bas / gagne » sur deux lignes ; plus de `rowheader` ; « encoches
en cours » → « aucune volée en cours, la volée écrite est celle enregistrée »).

## Décisions dans les marges du plan

1. **Q1 — moment du Tour du monde : `ancrage="sous"`** en portrait. Posé sur le bas de la feuille
   à 4 joueurs, il masquait 41 px sur 80 de la dernière ligne ; il se pose sur le vide de 108 px
   avant le pavé. En paysage (30 px libres), il recouvre (repli écrit). Cricket et X01 : ancrage
   bas.
2. **Cricket : noms à 15 px dès 2 joueurs** (16 px faisait déborder « MAXENCE ») ; JOUEUR
   6,25 rem (5,75 sur la planche, avec liseré) pour garder des cellules de cible de 28 px ;
   marques 28 px (`size-7`), 26 à 4 joueurs comme la planche ; PTS 36 / 30 px.
3. **Décalage des cases du Tour du monde : 18 px** (carré 12 + espace 6), et non 11 (planche à
   liseré de 5 px).
4. **Sous-titre de l'entraînement : `recapEntrainement`** (« 10 sorties · 41 à 170 ») ;
   `reglesEntrainement` aurait préfixé « Entraînement · ».
5. `TableauCricket` prend une prop `volee` obligatoire ; `LigneCible` remplace `compact` par
   `nbJoueurs`, `volee`, `etiquetteVolee`.
6. Colonnes de cibles du Cricket dynamiques (`--nb-cibles`, prop `style` de `FeuilleMatch`) : la
   liste des cibles vit dans la config.
7. Bulle du Tour du monde : SVG local (anneau plein), lucide `Target` refusé par la garde.
8. Carré de 12 px, pas de liseré, dans les trois jeux ; « Pts ↓ » conservé ; droite cut-throat sur
   deux lignes, sans cadre.

## Mesures (Chrome, sombre et clair identiques)

| Mesure | Résultat |
|---|---|
| Hauteur de page | 844 / 844 en portrait, 390 / 390 en paysage, partout ; Tour du monde 4 j. : 844 (865 avant) |
| Plus petite touche | 48 px (Cricket, X01), 52 px (Tour du monde portrait) |
| Bandeau | 73 px portrait (87 au X01), 49 px en paysage, une rangée dans les 4 jeux |
| Lignes Cricket | 88 / 62 / 54, 50 en paysage |
| Lignes Tour du monde | 104 / 88 / 80, ≈ 67 en paysage |
| « MAXENCE » | entier : 7,1 px d'air (Cricket 2 et 4 j. portrait), 27 (Cricket paysage), 43 (Tour du monde 4 j.) |
| Marques, PTS | non rognés, PTS ≥ 25 px de marge |
| Cible du Tour du monde | « 20 » et bulle à 4,5 / 4,05 / 3,25 rem dans 7 rem (6,5 en paysage) |
| Moment | 44 px effectifs ; « Bouclé ! · Kevin · 21 fléchettes » tient |
| Recouvrement du moment | Cricket portrait 0 ; Cricket paysage 4 j. 1 px sans contenu ; X01 0 ; Tour du monde portrait 0 (sous la feuille) ; **Tour du monde paysage 4 j. : 41 px de la dernière ligne, 8 éléments masqués pendant 2,2 s** |
| Ligne VOLÉE | 44 px portrait, 40 paysage ; aucun repli à `h-9` nécessaire |

Captures (52 PNG, sombre et clair) :
`C:\Users\kevin\AppData\Local\Temp\claude\C--Users-kevin-Documents-Flechettes\74293054-add0-486a-9ab8-62982af84d70\scratchpad\feuille-commune\`
— Cricket 2 / 4 joueurs, début, cut-throat, paysage ; Tour du monde 2 / 3 / 4 joueurs, dernier
tour, bulle, paysage ; X01 2 / 3 joueurs et paysage ; entraînement ; moments Cricket, Tour du
monde (portrait et paysage) et X01. Le Dev n'a relu à l'œil qu'une partie des captures.

## Écarts, limites et questions

| # | Point | Suite (Orchestrator) |
|---|---|---|
| D1 | Tour du monde en paysage à 4 joueurs : le moment masque la dernière ligne 2,2 s (repli écrit au plan) | Relecture utilisateur à l'arrêt de fin de lot |
| D2 | Cricket : noms à 15 px dès 2 joueurs, au lieu de 16 | Relecture utilisateur |
| D3 | X01 paysage 2 joueurs : marge du reste −2,2 px, non modifié par le lot | = N6 du lot 5, hors périmètre (demande § Hors périmètre) |
| D4 | Intitulés des moments (« Fermée ! », « Bouclé ! », « Partie ! ») en dur dans les écrans, préexistant | Hors périmètre ; signalé |
| D5 | `.ai/architecture-context.md` cite `.au-lancer`, retiré | Index régénéré avant le commit (charte modifiée par le lot). Le générateur a relu l'ancien index : il **ne citait pas** `.au-lancer` — l'affirmation du Dev était inexacte |
