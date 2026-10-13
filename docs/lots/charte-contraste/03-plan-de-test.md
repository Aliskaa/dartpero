# Lot `charte-contraste` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high, frontmatter).

## Passe 2 — GO (après boucle 1, tour 1)

Sans shell : jugement sur disque et par grep. Revérifié par l'Orchestrator : lint OK, 805 verts,
encodage UTF-8 sain.

| # | Statut | Justification (Test) |
|---|---|---|
| O1 | Corrigé | `ALPHA_TEXTE` (`themeBoundary.test.ts:69`) couvre `craie`, `-2`, `-3`, `-decor`, `-vive`, alpha numérique ou entre crochets ; 4 positifs ajoutés (l. 92-95), négatifs inchangés (l. 99), plancher > 40 conservé. Pas de faux positif : `text-craie-decor` / `text-craie-2` sans `/`, `border-` / `bg-craie/…`, `text-craie-vive` suivi d'un autre utilitaire ne correspondent pas. Grep sur `src` : 0 |
| O3 | Corrigé | `.claude/agents/dev.md:51` et `.claude/skills/audit/SKILL.md:42` alignés ; plus de `craie/60` ; cohérents avec `theme-colors.md` l. 12-21 |

### Observations

| # | Constat | Suite |
|---|---|---|
| P2-1 | `theme-colors.md:16` n'énumère que `text-craie/NN` et `text-craie-vive/NN`, alors que le garde et les deux autres docs disent `text-craie*/NN` | **Close (Orchestrator)** : non bloquant, pas de nouveau tour ; le texte n'est pas faux, il est moins large que le garde. À aligner par le lot 3 (`charte-typo-mouvement`), qui réécrit la même règle |
| P2-2 | Alpha sur une autre famille de texte (`text-laiton/NN`, `text-feutre/NN`) hors garde | Sans action (la règle ne vise que la craie ; O5 connu) |
| P2-3 | Syntaxe `text-craie/(--var)` non couverte | Sans action (inutilisée) |

O2, O4, O5, O6 inchangées, sans action.

### Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Relecture à l'écran : « · » encapsulé, `VolumeX`, colonne morte du Cricket, hiérarchie `craie-2` / `craie-3` en clair, onglet actif blanc en sombre, « — » de `LigneJoueur`, restes inactifs à 2-3 m, portrait / paysage, luminosité basse | Utilisateur, arrêt de fin de lot |

---

## Passe 1 — GO, renvoi Dev non bloquant

Le sous-agent `test` n'avait pas de shell (ni `git diff`, ni vitest) : jugement sur le code sur
disque et par grep. Chiffres revérifiés par l'Orchestrator (`02-dev-notes.md` § Contrôles) : lint
OK, typecheck OK, 805 verts, 0 alpha de texte, aucun accent cassé.

### Greps et calculs (Test)

- `text-craie(-vive)?/` dans `src` : 0. Restent des `border-` / `bg-` / `active:bg-` (hors
  périmètre) et 4 `text-feutre/70` (`Tableau.tsx:109-116`, en-têtes `aria-hidden` sur bande craie
  inversée, ≈ 5,8:1, antérieurs au lot).
- `opacity-70` et `transition-opacity` dans `src/ui` : 0. `craie-decor` : 9 occurrences, la liste
  de Dev. `trace-craie` conditionnel sur les trois lignes.
- Trois cellules du tableau de contrastes recalculées : 4,68 / 4,88 / 6,15 (consignées 4,67 /
  4,88 / 6,14) — tableau fiable.

### Couverture par critère

| # | Critère | Vérifié par | Protégé par un test ? |
|---|---|---|---|
| 1 | Tokens ≥ 4,5:1, 4 surfaces, 2 thèmes ; clair imposé | `index.css` (`@theme` l. 34-36, clair l. 179-181) ; tableau dans la charte (l. 111-118) ; 3 cellules recalculées ; min 4,67 / 4,88 | Non (seule la présence des tokens dans les deux blocs est gardée) |
| 2 | Plus d'alpha `craie` / `craie-vive` ; le garde échoue | Grep 0 ; `ALPHA_TEXTE` sur tous les `.ts(x)` de `src/ui`, plancher > 40 ; chaînes synthétiques sur la même constante ; préfixes `hover:`, `placeholder:`, `md:`, `!` et valeurs `[…]` attrapés | Oui |
| 3 | Lignes inactives sans `opacity`, reste plein sans `trace-craie` | `LigneJoueur.tsx:123-125, 137, 225` ; `LigneCible.tsx:55, 70, 85, 98-100` ; `TableauCricket.tsx:125, 146, 185-186` | Non |
| 4 | Onglet actif ≥ 4,5:1 | `NavigationBasse.tsx:51` (actif `craie-vive` ≈ 19 / ≈ 10,5 ; inactif `craie-3` ≥ 4,67), trait laiton l. 62 | Non |
| 5 | `craie-decor` seulement en `aria-hidden` | Les 9 relus un par un : tous sous `aria-hidden` | Non |
| 6 | Lint, typecheck, suite verts | Orchestrator | n/a |

### Règle de correspondance

Échantillons 75-85 % → `craie-2` et 55-70 % → `craie-3` cohérents. Les 22 cas sous 55 % relus :
aucune information classée décor, aucun décor classé information. Cas limite
`TableauCricket:40` : marque de cible morte en `craie-decor` + `opacity-30` (hors périmètre, lot
6), information portée par le `sr-only` — équivalent à l'avant.

### Docs

Charte (§ Les trois planchers, § Palette, tableau des contrastes et méthode, onglet actif, lignes
inactives) et `theme-colors.md` cohérentes avec le code. Doc périmée **hors zone du lot** :
`.claude/agents/dev.md:51` et `.claude/skills/audit/SKILL.md:42` (« craie/60 »).

### Réponses aux questions de `02-dev-notes.md`

1. **`<span aria-hidden>` des cases vides** : pas de décalage par le code (item flex équivalent,
   aucune classe propre). Rendu au pixel : écran.
2. **`VolumeX` / `CircleOff` en `craie-3`** : bon choix pour `VolumeX` (porte l'état ;
   `craie-decor` clair ≈ 2:1, sous les 3:1 des composants porteurs de sens) ; `CircleOff`,
   redondant avec « Pas de finish », est conforme dans les deux lectures. « Trop présent » :
   écran.
3. **En-tête de colonne morte du Cricket** : distinguée surtout par le `line-through` (signal non
   coloré) ; l'extinction est moins prononcée qu'avant ; `sr-only` intact. Suffisance : écran,
   surtout en clair.

### Bugs et observations

| # | Constat | Classement | Suite |
|---|---|---|---|
| — | Aucun bug d'implémentation, aucun problème de test bloquant | — | — |
| O1 | `ALPHA_TEXTE` ne vise que `craie` / `craie-vive` : `text-craie-2/60`, `text-craie-3/50`, `text-craie-decor/40` repasseraient | Problème de test (non bloquant, recommandé) | **Renvoi Dev** (boucle 1) |
| O2 | Critères 1, 3, 4, 5 sans protection automatique | Observation | Sans action (rendu jugé à l'écran ; test de contraste possible plus tard) |
| O3 | Doc périmée : `.claude/agents/dev.md:51`, `.claude/skills/audit/SKILL.md:42` | Observation | **Joint au renvoi** (alignement sur la nouvelle règle) |
| O4 | `<span className="text-craie-3">/{total}</span>` dans un parent déjà `craie-3` | Observation | Sans action (inoffensif) |
| O5 | `text-feutre/70` en en-têtes de `Tableau.tsx` | Observation | Sans action (≈ 5,8:1, `aria-hidden`, antérieur) |
| O6 | `JoueursEcran:85` : `text-craie-2` sur une `.touche` reste en `craie-2` pendant l'appui (fond craie) | Observation | Sans action ici (même effet avec l'ancien alpha) ; à regarder à l'écran |

### Angles morts (écran)

« · » encapsulé ; `Pts ↓`, `fl.` en `craie-3` ; titres tronqués ; hiérarchie `craie-2` /
`craie-3` en clair ; onglet actif blanc en sombre ; sombre décalé d'une nuance ; « — » de
`LigneJoueur` plus visibles ; colonne morte du Cricket ; `VolumeX` ; restes inactifs lus à 2-3 m,
portrait et paysage, luminosité basse.

### Questions ouvertes

| # | Question | Résolution |
|---|---|---|
| 1 | Élargir la regex du garde (O1) ? | **Close (Orchestrator)** : oui, dans ce lot — une ligne et une contre-épreuve, et c'est l'esprit du critère 2. Boucle 1, tour 1 |
| 2 | Mettre à jour `dev.md:51` et `audit/SKILL.md:42` (O3) ? | **Close (Orchestrator)** : oui, joint au même renvoi (règle modifiée par le lot) |
| 3 | Relecture à l'écran (Q1-Q3, hiérarchie en clair) | Utilisateur, arrêt de fin de lot |
