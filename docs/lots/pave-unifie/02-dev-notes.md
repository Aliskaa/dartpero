# Lot `pave-unifie` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium, un seul
> lancement, terminé sous le plafond de 100 tours), contrôles relancés par l'Orchestrator.

## Ce qui a été implémenté

### Étape 1 — CSS et P1 (`src/index.css`, `JoueursEcran.tsx`)

- `.touche` porte sa couleur de repos par `color: var(--texte-touche, var(--color-craie-vive))` ;
  `:active` inverse fond **et** texte (feutre), enfoncement 2 px et 90 ms inchangés.
- Nouvelles classes `.exposant-touche`, `.exposant-touche-neutre` (héritent du texte à
  l'appui) et `.touche-bulle` (rouge de la Bulle en couche `components`, pour que l'appui
  l'inverse aussi).
- Supprimés : `--color-accent-mode*` et `--accent-*` des deux thèmes. `.repere-lancer` en
  `--color-laiton`. `--color-laiton-clair` en clair : `#6b5209` → `#614a08`.
- `JoueursEcran` : `[--texte-touche:var(--color-craie-2)]` au lieu de `text-craie-2`.

### Étape 2 — accents

- `src/ui/accents.ts` supprimé. Laiton (`text-laiton`, `text-laiton-clair`, `border-laiton`,
  `bg-laiton`) dans `BandeauMatch`, `CartePartie`, `EtapeJeu`, `TableauHonneur`,
  `TableauJoueurs`, `TableauCricket`, `LigneCible` et les quatre résumés.
- Prop `mode` retiré de `DispositionPartie` et de `TableauHonneur` (et de leurs appelants).

### Étape 3 — pavé commun

- `src/ui/composants/commun/PaveSaisie.tsx` créé ; `PaveFlechettes`, `PaveCricket`,
  `PaveCibles` en deviennent de fins enrobages (le filtrage de la bulle du Cricket reste dans
  `PaveCricket`).
- `DispositionPartie` : `paysage:self-center` → `paysage:self-end`.
- `labels.ts` : `LIBELLE_HORS`, `LIBELLE_SAISIE_FLECHETTE`, `LIBELLE_SAISIE_CIBLES`,
  `LIBELLE_PAS_DE_TRIPLE_BULLE`, `LIBELLE_MULTIPLICATEUR`, `libelleFlechetteTourDuMonde`.
- `CasesVolee` : prop `libelle`, que `LigneCible` alimente ; `useTourDuMonde` : « Annuler 16 »
  sans « S ». `Dart.label` et `src/core/` intacts.

### Étape 4 — charte et gardes

- `docs/CHARTE_GRAPHIQUE.md` : « Un seul accent : le laiton », `laiton-clair` clair avec ses
  contrastes, `.touche` / `.touche-bulle` / `.exposant-touche` / `.touche-armee`,
  `PaveSaisie`, `DispositionPartie`, maquette ASCII du pavé, § Saisie réécrit.
- Nouveaux tests : `tests/architecture/appuiBoundary.test.ts`,
  `tests/architecture/accentBoundary.test.ts`, `tests/ui/paveUnifie.test.tsx`.
- Tests adaptés : `accueilPartiesRecentes`, `feuilleCommune`, `matchX01`, `nomDePartieEcrans`,
  `x01`, `themeBoundary` (partie `accent-*` retirée sans affaiblir les `color-*`).

## Réponses aux questions laissées au Dev

| # | Question | Réponse |
|---|---|---|
| Qa | Prop `mode` de `DispositionPartie` | Retiré, ainsi que celui de `TableauHonneur`, devenu mort. |
| Qb | `#614a08` sur les quatre surfaces claires | Calcul WCAG : `feutre` 6,01:1, `feutre-nuit` 4,84:1, `ardoise` 7,55:1, `ardoise-claire` 8,28:1, fond du Triple 5,18:1. Aucun token dédié. |
| Qc | Emploi réel de `CasesVolee` au Tour du monde | Employé par `LigneCible` : le prop `libelle` est réel. Les autres jeux gardent `Dart.label`. |

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Rouge de la Bulle dans `.touche-bulle` (couche `components`) au lieu d'utilitaires | Ajustement | Un utilitaire `bg-rouge-cible/25` aurait battu l'inversion à l'appui (même cause que P1). Dessin identique à la planche. |
| Prop `mode` de `TableauHonneur` retiré aussi | Ajustement | Devenu mort avec la suppression des accents. |
| `col-span-1` explicite sur Hors | Ajustement | Lisible par le test de structure 2 · 1 · 2. |

Aucune refonte d'architecture.

## Contre-épreuves des gardes (rapport Dev)

- `appuiBoundary` : `text-craie-3` ajouté sur Hors → casse en nommant `PaveSaisie.tsx`. Remis.
- `accentBoundary` : `text-accent-mode-clair` réintroduit dans `TableauJoueurs` → casse. Remis.
- Planchers de fichiers lus (> 40 et > 100) et cas fautifs volontaires détectés.

## Contrôles (relancés par l'Orchestrator)

| Commande | Résultat |
|---|---|
| `npm run lint` | 264 fichiers, aucun problème |
| `npm run typecheck` | propre |
| `npx vitest run` | 62 fichiers, **975 tests** verts (945 avant le lot) |
| `npm run build` | vert, précache 48 entrées (811 Kio) |
| Grep `Ã` / `Â` / `�` (`src`, `tests`, charte) | 0 |

## Relevé Chrome (rapport Dev)

Captures et mesures dans `scratchpad\pave-unifie\` (16 captures jeu × orientation × thème,
8 captures d'appui, `mesures.json`). Portrait : Bulle / Hors / Annuler aux mêmes x et largeurs
dans les 4 jeux, même y (716) sauf Tour du monde (780, +64 px prévu), rail 366 px. Paysage :
touches 48 px, bord bas du pavé à 382 dans les 4 jeux, aucun défilement. Appui en Double :
14,70:1 sombre, 10,25:1 clair, exposants compris.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| — | Aucune bloquante | — |

## Limites connues et TODO assumés

- Non capturés : Accueil (liseré des cartes), choix du jeu, les 4 résumés, emplois de
  `laiton-clair` sur fond sombre en thème clair (`EtapeOrdre`, `StatTile`, en-têtes inversés).
- Pas d'iPhone réel.
- `docs/PROJECT_PLAN.md`, `.claude/CONVENTIONS.md` § 14 et `.ai/architecture-context.md` citent
  encore `accents.ts` et l'ancien pavé : à reprendre en fin de lot (index régénéré).
