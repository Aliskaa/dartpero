# Lot `pave-unifie` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent `archi-scout` (sonnet / low,
> frontmatter), tentative 1, retenu. Le sous-agent est en lecture seule ; il déclare n'avoir pas
> lu la planche HTML : la section « Conformité à la planche » (§§ 10 et suivants) est ajoutée par
> l'Orchestrator à l'arrêt Archi → Dev, d'après sa propre lecture de la planche.

Architecture result: PASS

Niveau `light` confirmé : aucune surface gravée. Les mêmes fléchettes partent (Bulle =
`BULL_SIMPLE` / `BULL_DOUBLE`, Hors = `MISS`) ; `Dart.label` intact. Lot dimensionné pour un seul
passage, ordonné en 4 étapes.

## Problème

Trois pavés divergents :
- X01 : 25 / 0 / Annuler sur 4 colonnes ;
- Cricket : 4 colonnes, 24 px, Hors dans la grille, Annuler à côté du rail ;
- Tour du monde : Bulle / Hors / Annuler en flex.

À cela s'ajoutent :
- P1, l'inversion à l'appui, cassée ;
- quatre accents par mode qui se confondent avec les couleurs de profil.

## Cause P1 (vérifiée sur le code)

`.touche:active:not(:disabled)` (`src/index.css` l. 500, couche `components`) pose
`color: var(--color-feutre)`. Mais chaque bouton porte un utilitaire de couleur qui bat la couche
`components` :
- `text-craie-vive` (1-20, 25) ;
- `text-craie-3` (0 / Hors) ;
- `text-craie` (Annuler) ;
- l'exposant `text-laiton-clair`.

Seul le fond s'inverse. `JoueursEcran.tsx` l. 85 (`touche … text-craie-2`) a le même défaut.

## Q4 — où vit la correction : une seule couche, dans `index.css`

- **Pas de variante `active:`** sur chaque bouton : un oubli serait garanti.
- **Couleur de repos portée par `.touche`** : `color: var(--texte-touche, var(--color-craie-vive))`.
  - Les boutons ne portent plus d'utilitaire de couleur.
  - Hors, Annuler et `JoueursEcran` posent seulement la variable
    (`[--texte-touche:var(--color-craie-3)]`…).
  - Une variable n'est pas une propriété `color` : elle ne bat pas `:active`.
- **`:active`** garde `color: var(--color-feutre)`. Seule la couleur change : l'enfoncement et les
  90 ms restent intacts.
- **Exposant** :
  - classe `.exposant-touche { color: var(--color-laiton-clair) }` ;
  - plus `.touche:active:not(:disabled) .exposant-touche { color: inherit }` ;
  - plus aucun `text-laiton-clair` sur un exposant.
- **Contraste d'appui** : `feutre` sur `craie` (planche : 14,7:1 en sombre, 10,25:1 en clair), à
  remesurer.

## Q1 — un composant commun

`src/ui/composants/commun/PaveSaisie.tsx`, un seul fichier. Trois pavés qui « partageraient leurs
rangées » recréeraient la divergence.

**Props**
- `cibles`, `colonnes: 5 | 3` ;
- `multiplicateur?`, `onMultiplicateur?` ;
- `onFlechette`, `onAnnuler`, `peutAnnuler`, `annulation`, `libelleCible?`.

**Structure, de haut en bas**
1. La grille des cibles.
2. La rangée `grid-cols-5` : Bulle `col-span-2`, Hors `col-span-1`, Annuler `col-span-2`.
3. Le rail pleine largeur `grid-cols-3`, seulement si `multiplicateur` est fourni. Sans rail (Tour
   du monde), la rangée vient en dernier.

**Grille et rangée**
- `<section data-multiplicateur>` est conservé : il commande `.touche-armee`. Au Tour du monde,
  pas d'attribut, donc aucune touche armée.
- La grille des cibles et la rangée sont deux conteneurs distincts : `grid-cols-5` ou
  `grid-cols-3` pour la grille, `grid-cols-5` pour la rangée. Les x et largeurs de Bulle, Hors et
  Annuler viennent de la seule rangée : ils sont identiques par construction (critère 1).

**Bulle**
- Classes `touche touche-armee`.
- Exposant : « 25 » / « 50 ».
- `disabled` en Triple ; le texte « il n'existe pas de triple bull » va dans `labels.ts`.
- Cricket : exposant « ×2 » / « ×3 ».
- Tour du monde : `Dart.bull()`, comme aujourd'hui.

**Hors**
- `onFlechette(Dart.miss())`, sans `touche-armee`.

**Tailles**
- Touche : `min-h-[3.25rem] paysage:min-h-12`.
- Chiffres : `text-xl paysage:text-lg`.
- Mots : `text-base`, majuscules, `font-score`.
- Bulle : `border-rouge-cible/70 bg-rouge-cible/25`.
- Hors : `--texte-touche` à `craie-3`.

**Fichiers existants**
- Ils deviennent de fins enrobages, avec les mêmes noms :
  - `PaveFlechettes` (X01 et entraînement, 5 colonnes, rail) ;
  - `PaveCricket` (3 colonnes, six cibles hors bulle, rail, exposant en marques) ;
  - `PaveCibles` (sans rail).
- Le filtrage `cible !== 'BULL'` du Cricket reste dans son enrobage ; aucune règle n'est ajoutée.
- Les textes (Bulle, Hors, libellés du rail, `aria-label` de section) vont dans `labels.ts`.

## Q2 — `accents.ts` / `--accent-*` : retirés

**Ce qu'on supprime**
- `src/ui/accents.ts` ;
- `--accent-*` (sombre l. 167-174, clair l. 230-239) ;
- `--color-accent-mode*` (l. 46-49, 216-217).

**Par quoi on le remplace : le laiton existant**
- `text-accent-mode` → `text-laiton` ;
- `text-accent-mode-clair` → `text-laiton-clair` ;
- `bg-accent-mode` → `bg-laiton` ;
- `border-accent-mode/50` → `border-laiton/50` ;
- `.repere-lancer` : `--color-laiton`.

**`style={variablesAccent(mode)}` retiré de**
- `DispositionPartie` ;
- `TableauHonneur` ;
- `ResumeX01Ecran`, `ResumeCricketEcran`, `ResumeTourDuMondeEcran`.

**Fichiers d'emploi à reprendre**
- `CartePartie` (liseré) ;
- `EtapeJeu` (`ACCENTS_MODE`) ;
- `TableauHonneur`, `TableauJoueurs` (l. 85) ;
- `BandeauMatch` (l. 11, 50, 53) ;
- `TableauCricket` (l. 52), `LigneCible` (l. 142) ;
- les trois résumés.

**Tests existants à mettre à jour**
- `accueilPartiesRecentes.test.tsx` l. 306-320 : « liseré en laiton » ;
- `feuilleCommune.test.tsx` l. 279 ;
- `matchX01.test.tsx` l. 247 ;
- `themeBoundary.test.ts` l. 114-126 : retirer la partie `accent-*` sans affaiblir les `color-*`.

## Q3 — contraste du titre du bandeau en clair

- **Mesure** : `laiton-clair` en clair vaut `#6b5209`, soit 4,25:1 sur `feutre-nuit` `#d1c3a4`
  (recalculé).
- **Proposition** : foncer `--color-laiton-clair` en clair à `#614a08`, soit 4,84:1 (calculé), sans
  nouveau token.
- **Effet sur ses autres emplois** : c'est du texte laiton sur fond clair, qui gagne en contraste.
- **Risque** : un emploi sur un fond sombre en thème clair (`EtapeOrdre`, `TableauJoueurs`,
  `StatTile`, en-têtes inversés), à relire. Repli : un token dédié `--color-laiton-titre`.
- **À mettre à jour** : le commentaire l. 226-227 (exposant sur `--teinte-triple`).

## Paysage calé en bas

`DispositionPartie` :
- `paysage:self-center` → `paysage:self-end` sur le conteneur de saisie ;
- `paysage:items-stretch` et `paysage:w-[46%]` gardés ;
- zones jamais empilées.

## Tour du monde sans « S »

- **`labels.ts`** : `libelleFlechetteTourDuMonde(dart)`.
  - Simple → `String(segment)` (« 17 ») ;
  - bulle → libellé existant ;
  - manqué → « 0 » ;
  - sinon → `Dart.label`.
- **Consommateurs** :
  - `useTourDuMonde.ts` l. 156 (`annulation`, qui donne « Annuler 16 ») ;
  - `CasesVolee.tsx`, qui gagne un prop `libelle?: (dart) => string`, passé par la feuille du Tour
    du monde. Les autres jeux gardent `Dart.label`.

## Plan fichier par fichier (étapes ordonnées, ≈ 60-80 tours Dev)

1. **CSS et P1**
   - `index.css` :
     - `.touche` par variable, `:active`, `.exposant-touche` ;
     - `laiton-clair` en clair ;
     - suppression des `--accent-*` et `--color-accent-mode*` ;
     - `.repere-lancer`.
   - `JoueursEcran.tsx`.
2. **Accents**
   - Supprimer `accents.ts` et nettoyer les fichiers d'emploi.
   - Mettre à jour les tests.
   - `npm run typecheck` avant l'étape 3.
3. **Pavé commun**
   - `commun/PaveSaisie.tsx` et les 3 enrobages.
   - `DispositionPartie` (calé en bas).
   - `labels.ts`, `CasesVolee.tsx`, `useTourDuMonde.ts`.
   - Vérifier le pavé de l'entraînement.
4. **Charte et gardes**
   - `docs/CHARTE_GRAPHIQUE.md` : écran de match, palette, composants.
   - Tests.
   - Lint, typecheck, tests, build.

## Tests à écrire (`renderWithServices`, fakes)

- **Critère 2 : `PaveFlechettes`** (X01 et entraînement).
  - Plus de bouton « 25 » ni « 0 ».
  - Bulle → `BULL_SIMPLE` en Simple, `BULL_DOUBLE` en Double, `disabled` en Triple.
  - Hors → `MISS`.
  - Les assertions portent sur les fléchettes reçues.
- **Critère 3 : Cricket**
  - Six boutons dans l'ordre 20 19 18 17 16 15 ; Bulle et Hors dans la rangée.
  - `data-multiplicateur` suit la bascule ; exposant « ×2 » / « ×3 ».
  - Les fléchettes envoyées ne changent pas.
- **Critère 4 : Tour du monde**
  - Pas de rail, pas de `data-multiplicateur`.
  - Cases « 17 », bouton « Annuler 16 ».
  - Test unitaire de `libelleFlechetteTourDuMonde`.
  - `Dart.label(Dart.single(17))` reste « S17 ».
- **Critère 1 : structure**
  - `it.each` sur les 4 jeux : ordre DOM Bulle · Hors · Annuler dans la même rangée, classes
    `col-span-2/1/2`, rail après la rangée sauf au Tour du monde.
  - Les positions se mesurent en Chrome.
- **Critère 5 : nouvelle garde `tests/architecture/appuiBoundary.test.ts`**
  - Aucun `className` n'associe `touche` à `text-craie*` ou `text-laiton*`.
  - `index.css` définit `.touche:active { color }` et `.exposant-touche`.
  - Plancher de fichiers lus, plus un cas fautif volontaire qui doit être détecté.
- **Critère 6 : garde d'absence**
  - Plus de `accent-mode`, `--accent-`, `ACCENTS_MODE`, `variablesAccent` dans `src/`, avec un
    plancher de fichiers lus.
  - `CartePartie` et `EtapeJeu` en laiton.
- **Critère 7** : classes `min-h-[3.25rem] paysage:min-h-12` ; conteneur de saisie
  `paysage:self-end`.
- **Critère 8** : `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary` verts.

## Mesures Chrome pour le Dev

- **Portrait 390 × 844, 4 jeux** : `getBoundingClientRect()` de Bulle, Hors, Annuler.
  - Mêmes x et largeurs partout.
  - Même y au X01, au Cricket et à l'entraînement ; Tour du monde 64 px plus bas.
  - Rail en pleine largeur sous la rangée.
- **Taille des touches** : toutes ≥ 48 px, en portrait comme en 844 × 390.
- **Paysage 844 × 390** : pavé calé en bas, rien de coupé.
- **Appui** sur un chiffre, Bulle, Hors, Annuler, l'exposant et `JoueursEcran` :
  - ratio ≥ 4,5:1 dans les deux thèmes ;
  - enfoncement de 2 px inchangé.
- **Double et Triple armés** au X01 et au Cricket ; Bulle grisée en Triple.
- **Thème clair** : titre du bandeau ≥ 4,5:1 ; autres emplois de `laiton-clair`.
- **Accueil, Nouvelle partie, un résumé par jeu** : tout en laiton ; le repère et l'état armé
  restent lisibles ensemble.

## Décisions du contexte concernées

- Hexagonale intacte (UI seulement).
- Textes dans `labels.ts`.
- Angle vif, tokens seulement, ni dégradé ni halo.
- Cibles ≥ 48 px ; lecture et saisie côte à côte en paysage.
- Routes lazy ; `Dart.label` et `domain/` non touchés.

## Baseline sécu

Aucune entrée non fiable, aucun réseau, aucun HTML brut. Rien à signaler.

## Risques

- **Mémoire musculaire au X01** : accepté par la demande.
- **Suppression d'`accents.ts`** : beaucoup de fichiers ; `typecheck` à chaque étape. Le prop
  `mode` de `DispositionPartie` peut devenir mort.
- **`laiton-clair` foncé en clair** : voir Q3.
- **Rendu invisible en test** : relevé Chrome obligatoire.
- **Garde contre le retour de P1** : ne jamais remettre d'utilitaire de couleur sur une `.touche`.

## Conformité à la planche (ajouté par l'Orchestrator à l'arrêt Archi → Dev)

Relecture du plan contre la planche (`scratchpad\pave\pave.html`, CSS l. 162-201, § 4 variante b,
§ 7). Ces points **priment** sur les tailles indicatives ci-dessus.

10. **Exposant de la Bulle** : « 25 » en **`craie-3`** en Simple (`.expo-neutre`), « 50 » en
    laiton en Double ; rien en Triple (touche grisée). Au Cricket, « ×2 » / « ×3 » en laiton ;
    rien en Simple.
11. **Annuler en 12 px** majuscules, interlettrage 0,1em, `craie`, icône 16 px avant le libellé.
    Seuls Bulle et Hors sont en mots de 16 px (majuscules, 0,1em). Annuler a la même hauteur que
    les autres touches de la rangée (52 px, 48 en paysage).
12. **Écarts** de 6 px entre touches et entre rangées (4 px en paysage), dans la grille, la
    rangée et autour du rail.
13. **Rail** : son dessin actuel est gardé (cadre `chene`, curseur `laiton`, segments 48 px,
    14 px gras, `craie-2`, `sur-laiton` pour le segment actif) ; seule sa largeur change (pleine
    largeur, segments ≈ 118 px).
14. **Bulle armée** : le filet laiton du Double se pose **sur** son fond rouge, qui est gardé.
    Hors et Annuler ignorent la bascule (ni filet ni exposant).
15. **Bulle en Triple** : grisée à 30 % comme une touche `disabled` aujourd'hui, **sans trait**.
16. **Touche** : bordure `craie/34`, tranche `craie/18` de 2 px dessous (l'existant de
    `.touche`) ; chiffres Oswald 700, `tabular-nums`.

## Questions ouvertes (rapport du scout)

| # | Question | Résolution |
|---|---|---|
| Q1 | Pavé commun ou rangées partagées | **Close** : `PaveSaisie` commun |
| Q2 | Sort de `accents.ts` / `--accent-*` | **Close** : retirés, laiton existant |
| Q3 | Valeur claire du titre du bandeau | **Close** : `laiton-clair` clair → `#614a08` (4,84:1), vérification Chrome, repli token dédié |
| Q4 | Où vit la correction de l'appui | **Close** : une couche, variable `--texte-touche` |
| Qa | Prop `mode` de `DispositionPartie` : retrait ou conservation | Dev, à l'édition (sans décision produit) |
| Qb | `#614a08` suffisant sur les quatre surfaces claires | Dev, mesure Chrome |
| Qc | Emploi réel de `CasesVolee` dans la feuille du Tour du monde | Dev, à l'édition |
