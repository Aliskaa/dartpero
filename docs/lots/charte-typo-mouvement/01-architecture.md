# Lot `charte-typo-mouvement` — architecture

> Écrit par l'Orchestrator depuis le rapport `PASS` d'`archi-scout` (sonnet / low), tentative 1.
> Limites déclarées par le scout : `request.md`, la charte, `Avatar.tsx`, `LigneJoueur.tsx` et
> `Tableau.tsx` non relus en entier ; appui sur `00-orchestration.md`, `A-affiner.css`
> (l. 22-66), `themeBoundary.test.ts`, `theme-colors.md` et des greps. Le rapport reste conforme
> à la demande ; les points où il s'en écartait sont tranchés en § Questions ouvertes.

Architecture result: PASS

## Problème

Mettre le code en accord avec la maquette « A · Affiner », en cinq volets : échelle typographique
(44 `text-[…rem]` en dur, dont 32 sous 0,75 rem), mouvement (animations longues, avec rebond, en
boucle), halos (aucun ne reste), dégradés (tapis, enseigne, `eclat`), gardes et docs. Aucune
surface gravée : le lot applique « zéro dégradé de décor » (`CLAUDE.md` § Charte) sans changer la
règle. `light` confirmé.

## Approche retenue

Tokens dans `@theme` de `src/index.css` ; les composants consomment des classes `text-*` et
`animate-*`. Édition à la main, fichier par fichier ; grep de contrôle à la fin.

### 1. Échelle typographique

- `--text-etiquette: 0.75rem` — le plancher ; absorbe 0,5 / 0,55 / 0,6 / 0,62 / 0,65 / 0,7 rem
  (comme la maquette : tout monte à 0,75 rem).
- Grands chiffres à leur valeur actuelle : `--text-score-xl: 4.25rem`, `--text-score-l: 3.25rem`,
  `--text-score-m: 2.5rem`, `--text-score-solo: 4.5rem` (`Cartouche`, `ResumeEntrainementEcran`).
- Correspondance : `LigneJoueur` l. 25-27 → `text-score-xl` / `-l` / `-m` ; `Cartouche` l. 48 et
  `ResumeEntrainementEcran` l. 66 → `text-score-solo` ; toutes les autres → `text-etiquette`.
- `.entete-colonne` : `font-size: var(--text-etiquette)`.
- **Interlettrage resserré**, au plus 0,06 em comme la maquette, là où 0,75 rem déborderait :
  `.entete-colonne` du tableau X01 (colonne « Manches », 44 px), en-têtes de `TableauCricket`,
  libellés de `NavigationBasse` (l. 50), badges étroits de `Tableau` l. 113. Dev relève le
  tracking actuel de chaque occurrence touchée.
- **`Avatar` xs** : voir § Questions ouvertes, Q2.

### 2. Mouvement

- Tokens : `--duration-vif: 100ms`, `--duration-normal: 180ms`, `--duration-lent: 240ms`,
  `--ease-sec: cubic-bezier(0.2, 0, 0, 1)` (décélération, aucun paramètre > 1).
- `pop-score` : 200 ms, `--ease-sec`, keyframes `scale(1.06) → 1`, sans rebond.
- `secousse` : ≈ 260 ms, trois allers-retours de 4 px.
- `monter` : `--duration-lent`, `--ease-sec`, `both` ; `craie` : `--duration-lent`, `ease-out`.
- Logo : `tourner-lent` infini remplacé par `--animate-tour-logo` (un tour, ≈ 1,2 s, `1 forwards`,
  `--ease-sec`) ; `tourner-lent` supprimé ; `Logo.tsx` l. 30 prend le nouveau nom.
- `respirer` supprimé ; `TourDuMondeEcran` l. 110 perd `animate-respirer` (badge fixe).
- `eclat` supprimé (token, keyframes, deux usages).
- Intacts : `defiler` (`chargement-balai`) et le `animate-spin` de chargement d'`Etats.tsx`
  (états d'attente).
- **Filet vert qui se trace** (remplace `eclat`) : `<span aria-hidden>` en `absolute inset-0`,
  bordure 2 px, animation `trace-filet` (240 à 400 ms) `clip-path: inset(0 100% 0 0) → inset(0)`,
  le filet se révèle de gauche à droite ; ni dégradé ni halo. `MomentCelebratif` : `vert-cible` ;
  `TableauHonneur` : `accent-mode`. Les deux perdent leur `<div>` à dégradé.
- `prefers-reduced-motion` : le bloc existant (hors couche) neutralise tout ; le filet doit finir
  dans son état visible (`both`).

### 3. Halos

À retirer (les quatre vrais halos, `shadow-[0_0_…]`) :

- `Etats.tsx` l. 47 ; `MomentCelebratif.tsx` l. 62 ; `TableauHonneur.tsx` l. 81 ;
  `ChoixJoueursExistants.tsx` l. 108.

`trace-craie` : gardé **seulement** sur le reste du joueur actif (`LigneJoueur` l. 225,
`LigneCible` l. 70, `TableauCricket` l. 186, déjà conditionnels depuis le lot 2) ; **retiré** de
`Cartouche` l. 48 et `ResumeEntrainementEcran` l. 66 (pas le reste d'un lanceur ; résumé compris
dans « halos retirés partout »). Seule exception nommée dans la charte et dans la garde.

Ombres portées : voir § Questions ouvertes, Q1 et Q3.

### 4. Dégradés

- Tapis uni : supprimer `--tapis-image` (sombre l. 106-108, clair l. 192-194) et son usage dans
  `.feutre-tapis` (l. 360), avec le `background-attachment` qui l'accompagne ; garder
  `background-color`.
- Garder `--voile-cible` (opacité de la cible du logo) et `--voile-trace` (lié à `trace-craie`) :
  ce ne sont pas des dégradés.
- `Logo.tsx` l. 11 : `bg-gradient-to-b … bg-clip-text` (et le `text-transparent` éventuel)
  remplacé par `text-laiton` plein, comme `A-affiner.css`.
- `eclat` supprimé (§ 2). Seule exception : `.chargement-balai` (l. 514).

### 5. Gardes

Nouveau `tests/architecture/typographieBoundary.test.ts`, calqué sur `themeBoundary` (même
parcours de `src/ui`).

- **(a) Pas de taille arbitraire** : `/\btext-\[[0-9.]+(?:rem|px|em)\]/g` sur `src/ui`, plancher
  `> 40` fichiers ; chaînes synthétiques (attrape `text-[0.6rem]`, `sm:text-[12px]` ; laisse
  passer `text-etiquette`, `text-score-xl`, `text-sm`).
- **(b) Pas de dégradé** : `/gradient/` sur `src/ui` (`.ts`, `.tsx`) et `src/index.css`, le bloc
  `.chargement-balai { … }` excepté ; plancher : au moins un `gradient` dans ce bloc (sinon la
  garde a perdu sa cible) ; contre-épreuve synthétique (dégradé hors du bloc attrapé, bloc seul
  accepté).
- **(c) Pas de halo** : `/shadow-\[0_0_/` interdit dans `src/ui` ; `text-shadow` à flou non nul
  autorisé dans `index.css` pour `.trace-craie` seulement ; chaînes synthétiques
  (`shadow-[0_0_20px_x]` attrapé, `shadow-[0_3px_0_x]` et `drop-shadow-[0_3px_0_x]` acceptés).
- Contre-épreuve réelle pour chaque garde (casser, voir rouge, restaurer par édition).

### 6. Docs

- `docs/CHARTE_GRAPHIQUE.md` : § Typographie (échelle, plancher 0,75 rem, règle d'interlettrage) ;
  § Mouvement (tokens, nouvelles valeurs, filet vert, logo un tour, badge fixe) ; dégradés et
  halos (« zéro dégradé de décor » avec l'exception `chargement-balai`, ombres portées autorisées,
  `trace-craie` réservé au reste du lanceur).
- `.claude/rules/theme-colors.md` : l'énumération des alphas interdits alignée sur
  `text-craie*/NN` (constat #18 de l'index) ; mention des gardes.
- `docs/PROJECT_PLAN.md` § 6 : entrée du lot au format des entrées existantes (sans combler le
  retard des lots 1 et 2, constat #17).
- `CLAUDE.md` inchangé.

### 7. Tests et risques

- Gardes (a), (b), (c) ; grep préalable dans `tests/` des noms `eclat`, `respirer`,
  `tourner-lent`, `animate-` ; tests de `MomentCelebratif` / `TableauHonneur` relancés et adaptés
  s'ils visaient l'élément `eclat`.
- `npx biome check --write src tests` seulement ; `npm run lint`, `npm run typecheck`,
  `npx vitest run`, `npm run build`.
- Relecture à l'écran : portrait / paysage, sombre / clair ; X01 (colonne « Manches »,
  en-têtes), Cricket, Tour du monde, entraînement (`Cartouche`, résumé), Accueil, Nouvelle
  partie, Joueurs, Réglages, barre du bas (police système au maximum) ; un `Avatar` xs ; le filet
  vert en fin de manche et de partie.
- Risques : troncatures à 0,75 rem (« Manches », barre du bas, `Avatar` xs, `LigneCible`) ; diff
  large (≈ 30 fichiers, à la main, grep final à zéro `text-\[…rem\]`) ; interlettrage ≤ 0,06 em ;
  `clip-path` animé et `overflow-hidden` du parent (`TableauHonneur` l'a déjà).

## Décisions du contexte concernées

`CLAUDE.md` § Charte (« zéro dégradé de décor » appliqué, « angle vif » intact) ;
`rules/theme-colors.md` ; `rules/frontend-react.md` (`prefers-reduced-motion`, lisibilité à
2-3 m) ; `themeBoundary` comme modèle de garde. Hors périmètre : scores et repère (lot 5),
pictogrammes (lot 4), `chargement-balai`.

## Baseline sécu

Ni réseau, ni HTML brut, ni entrée non fiable, ni donnée stockée : risque nul ;
`/confidentialite` non concernée.

## Questions ouvertes

| # | Question (scout) | Résolution (Orchestrator) |
|---|---|---|
| 1 | Garder les ombres dures `drop-shadow-[0_3px_0_…]` de l'enseigne et du nom du vainqueur ? | **Close** : gardées. `A-affiner.css` ne retire que `shadow-[0_0_…]` (les halos) ; l'utilisateur veut « ce qu'il a vu sur la maquette ». À consigner dans la charte comme ombre portée, autorisée |
| 2 | `Avatar` xs : une ou deux initiales ? | **Close** : deux (`initiales(nom)`, `Avatar.tsx:45`) en `font-bold uppercase tracking-wide`, dans un carré `size-5` (20 px). À 0,75 rem, deux capitales Oswald débordent. Décision : xs passe à `size-6` (24 px) et `tracking-normal`, texte `text-etiquette`. Jugé à l'écran |
| 3 | Retirer aussi `drop-shadow-[0_2px_2px…]` de la médaille (`TableauHonneur` l. 85) et le `drop-shadow` du `Check` (`JoueursEcran` l. 40) ? | **Close** : gardés. Ce sont des ombres portées, pas des halos ; la maquette n'y touchait pas. Le scout les retirait « par prudence » : écart à la maquette refusé |
| 4 | Valeurs exactes des keyframes de `pop-score`, `secousse`, et durée du tour du logo | **Close** : valeurs du § 2 retenues ; ajustées à l'écran si besoin, sans changer les tokens |
| 5 | Nom du palier `etiquette` | **Close** : retenu ; Dev peut le renommer tant que la garde (a) reste verte |
