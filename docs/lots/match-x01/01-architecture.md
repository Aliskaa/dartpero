# Lot `match-x01` — architecture

> Écrit par l'Orchestrator depuis le rapport `PASS` d'`archi-scout` (sonnet / low), tentative 1.
> Non relus par le scout : écrans Cricket / Tour du monde / entraînement, hooks de ces trois
> modes, `typographieBoundary` — le Dev les vérifie (question 5).

Architecture result: PASS

## Problème

Lot UI seul, aucune surface gravée (ni domaine, ni `GameMode`, ni format persisté, ni service
worker). Appliquer la maquette à l'écran X01 et corriger la disposition commune des quatre jeux.
Preuves lues : `request.md`, `DispositionPartie`, `MomentCelebratif`, `PaveFlechettes`, `Tableau`,
`LigneJoueur`, `Batons`, `X01Ecran`, `index.css` (l. 395-540), garde `occupe` de `useX01`
(l. 113, 143).

## Approche retenue (plus petite viable, `src/ui` et `index.css`)

### 1. Moment hors du flux (API commune)

- `MomentCelebratif` rend lui-même un conteneur `absolute inset-x-0 bottom-0 z-10` ; garde
  `pointer-events-none`, `role="status"`, `aria-live="polite"`.
- Chaque écran enveloppe son tableau et le moment dans un `div.relative`, le moment en **dernier
  enfant** : X01 (`Tableau` + moment), Cricket, Tour du monde (même enveloppe autour de leur
  tableau). Pas de portail, pas de prop nouvelle sur `DispositionPartie`.
- Le moment recouvre le bas de la feuille (le ruban de sortie au X01), jamais le pavé, et
  n'ajoute aucune hauteur. Le `min-h-11` du ruban reste.
- **Fond opaque** sous la teinte verte (couche `bg-ardoise` ou équivalent, sous
  `bg-vert-cible/18`) : sinon le ruban transparaît.

### 2. Fin du clignotement

- Retirer la prop `desactive` de `PaveFlechettes` (et des pavés des autres modes s'ils la
  répercutent sur les touches) : la compilation signale chaque écran qui passe encore `…occupe`.
- Seules désactivations visuelles restantes : le 25 en Triple, « Annuler » sans `peutAnnuler`.
- La garde reste dans les hooks (`if (occupe) return`, déjà là).
- Test : port d'écriture fake qui se résout à la demande ; deux appuis rapprochés n'enregistrent
  qu'une fléchette, aucune touche `disabled` pendant ce temps.

### 3. Paysage

- `DispositionPartie` : `justify-center` supprimé ; ligne du nom `paysage:hidden` (sa hauteur
  `h-4` disparaît avec elle).
- Pavé X01 : `paysage:gap-1` (section et grilles) ; rail S/D/T `paysage:p-0.5`.
- `LigneJoueur` : `HAUTEUR` reçoit `paysage:py-2`.
- Reste aux tailles d'origine en paysage (point 4).
- Si le X01 à quatre joueurs ne tient pas en 844 × 390 : réduire `HAUTEUR.compact` en paysage,
  jamais les touches (plancher 48 px). Zones jamais empilées.

### 4. Reste portrait / paysage

- Valeurs actuelles `--text-score-xl/l/m` gardées pour le paysage ; trois tokens portrait dans
  `@theme` : `--text-score-xl-portrait: 5.1rem`, `--text-score-l-portrait: 4.05rem`,
  `--text-score-m-portrait: 3.1rem` (ou renommage symétrique `-paysage`).
- `RESTE` : `text-score-xl-portrait paysage:text-score-xl`, etc.
- ⚠️ **Rognage probable** : la colonne RESTE fait 6,75 rem = 108 px (`GRILLE_LIGNE`) ; à 5,1 rem,
  trois chiffres Oswald dépassent vraisemblablement 108 px à deux joueurs (estimation du scout,
  à mesurer). Voir question 1.

### 5. Multiplicateur gradué

- État sur la `<section>` du pavé : `data-multiplicateur="simple|double|triple"`.
- Classe `touche-armee` sur les touches 1-20 et 25 **seulement** (pas « 0 », pas « Annuler »).
- CSS en `@layer components` :
  - `.touche-armee` : transition `border-color, box-shadow, background-color` sur
    `var(--duration-normal)` `var(--ease-sec)` — c'est le **fondu** au retour à Simple
    (la transition de `.touche` est étendue en conséquence) ;
  - `section[data-multiplicateur='double'|'triple'] .touche-armee:not(:disabled)` : bordure 2 px
    laiton + `box-shadow: 0 2px 0 var(--color-laiton-sombre)` ;
  - `…'triple'` seulement : fond par un **token dédié** (`--teinte-triple`, valeur claire sous
    `html[data-theme="clair"]`), point de départ `color-mix` laiton 22 % ;
  - `.touche:active` doit continuer à gagner (ordre des règles ou `:not(:active)`).
- Exposant : token `--text-multiplicateur: 0.8rem` (relire `typographieBoundary` avant).
- Le 25 désactivé en Triple garde `opacity 0.3` : voulu (règle, pas `occupe`).
- Tests : `data-multiplicateur` de la section ; `touche-armee` sur 21 touches et absente de « 0 »
  et « Annuler », en Simple / Double / Triple. Aucun test de couleur.

### 6. Repère qui glisse

- Dans `Tableau`, un **seul** élément absolu `aria-hidden` (filet 5 px + voile 12 % de l'accent,
  ce que fait `.au-lancer`) dans un conteneur `relative` des lignes :
  `height: calc(100% / n)`, `transform: translateY(index * 100%)`,
  `transition: transform var(--duration-lent) var(--ease-sec)`.
- Prérequis : lignes de hauteur **strictement égale** (grille `grid-rows-[repeat(n,1fr)]` ou
  `flex-1`). Repli si une ligne peut grandir : mesure `offsetTop` (`useLayoutEffect` + ref).
- `.au-lancer` ne porte plus le filet par ligne ; `aria-current` reste l'état accessible ; le
  `trace-craie` du reste actif est inchangé.
- `prefers-reduced-motion` : la règle globale suffit.
- Test jsdom : le repère existe, son `translateY` change avec `currentPlayerIndex`.

### 7. Bandeau X01

- `EnTeteManche` en trois zones : flèche de retour ; bloc central (`Pictogramme nom="x01"
  taille={24}` couleur du jeu, titre « X01 » `font-score` gras majuscule, sous-titre « 501 ·
  premier à 2 manches » en `text-etiquette`, puis DI / DO **sous le sous-titre**) ; bloc droit
  (« Manche N », « Set M » dessous si `setsToWin > 1`).
- Paysage : DI / DO peuvent passer sur la ligne du sous-titre pour ne pas perdre de hauteur.
- Libellés dans `labels.ts` (titre, sous-titre via `libelleLegsCourt`, « Set N » par fonction).
- Nom de partie : inchangé, dans `DispositionPartie`, masqué en paysage.

### 8. Bâtons en tirets

- Trait vertical restant : `w-0 border-l-2 border-dashed border-craie/55` au lieu de
  `bg-craie/25` ; trait barré restant : `h-0 border-t-2 border-dashed border-craie/55`.
- Acquis inchangés (`bg-craie`). `title`, `aria-hidden` inchangés. Usages relevés au Dev.

### 9. Tests, gardes, charte

- Tests : multiplicateur (5) ; pavé non désactivé et garde effective (2) ; moment `absolute`, et
  tableau inchangé quand il s'affiche (pas de mesure de hauteur en jsdom : angle mort) ; bâtons
  (`border-dashed` restants, absent des acquis) ; bandeau (pictogramme 24, titre, manche à
  droite, Set seulement avec sets) ; repère (6).
- Gardes vertes : `themeBoundary`, `typographieBoundary` (alphas de fond et de bordure permis),
  `pictogrammesBoundary`, `lazyRoutes`, `horlogeBoundary`.
- Charte : § Écran de match (bandeau, multiplicateur gradué, moment superposé, paysage, tailles
  du reste) ; § Mouvement (repère qui glisse, fondu du filet).

## Couches et chemins

`src/index.css` ; `src/ui/composants/commun/DispositionPartie.tsx`, `MomentCelebratif.tsx`,
`Batons.tsx` ; `src/ui/composants/x01/PaveFlechettes.tsx`, `LigneJoueur.tsx`, `Tableau.tsx` ;
`src/ui/ecrans/games/x01/X01Ecran.tsx` ; `CricketEcran`, `TourDuMondeEcran`, `EntrainementEcran`
et leurs pavés si concernés ; `src/ui/labels.ts` ; `docs/CHARTE_GRAPHIQUE.md` ; tests sous
`tests/ui/`. Aucun port, use case ni domaine.

## Décisions du contexte concernées

Zones lecture / saisie jamais empilées en paysage (respecté) ; angle vif, ni dégradé ni halo
(`box-shadow` décalé sans flou) ; tokens seulement, chaque nouveau token avec sa valeur claire ;
match en cours = état local synchrone, garde `occupe` inchangée ; libellés dans `labels.ts`,
« manche » jamais « leg ».

## Baseline sécu

Aucune entrée non fiable, aucun réseau, aucun HTML brut ; rien de stocké ni de capacité nouvelle :
politique de confidentialité inchangée.

## Questions ouvertes

| # | Question (scout) | Résolution (Orchestrator) |
|---|---|---|
| 1 | Taille du reste portrait : 5,1 rem rogne probablement dans 108 px à deux joueurs | **Close, procédure** : le Dev mesure la largeur réelle de « 701 » (Oswald, `tabular-nums`) à chaque échelle ; il retient la plus grande taille qui tient dans la colonne actuelle de 108 px, et note l'écart avec la maquette (qui ne montrait que 3 joueurs, à 4,05 rem). **Pas d'élargissement de la colonne RESTE** dans ce lot : il prendrait sur JOUEUR, dont le plancher est documenté (`GRILLE_LIGNE`) — à proposer à l'utilisateur à la relecture si l'écart déçoit |
| 2 | Alpha du fond Triple, contraste de `craie-vive` | **Close** : token dédié `--teinte-triple` avec valeur claire ; le Dev calcule le contraste de `craie-vive` sur le fond composé dans les deux thèmes (≥ 4,5:1) et ajuste l'alpha ; chiffres dans `02-dev-notes.md` |
| 3 | Hauteur du bandeau X01 avec Set + DI + DO | **Close** : disposition du § 7 retenue ; confirmation à la relecture à l'écran (angle mort des tests) |
| 4 | Hauteur égale des lignes, prérequis du repère | **Close** : le Dev garantit l'égalité par la grille (`1fr`) ; s'il ne le peut pas sans changer le rendu, repli par mesure `offsetTop`, noté dans `02-dev-notes.md` |
| 5 | Écrans et hooks Cricket / Tour du monde / entraînement, `typographieBoundary` non relus | **Close** : vérification à la charge du Dev, écarts notés dans `02-dev-notes.md` |

## Compléments après relecture contre les maquettes (utilisateur, 2026-10-14)

Ajoutés par l'Orchestrator à l'arrêt Archi → Dev, à la demande de l'utilisateur, après comparaison
avec les maquettes A (`1-x01-sombre`, `2-x01-clair`, `3-x01-paysage`, `4-x01-double-arme`) et la
planche « Bandeau de match ». Pas une révision de design : trois points que la maquette montrait
et que la demande n'avait pas repris.

### 10. Reste des joueurs qui ne lancent pas, en craie

- Maquette A (CSS point 2) : seul le reste du joueur **actif** est en `craie-vive` (avec
  `trace-craie`, déjà conditionné) ; les autres sont en `craie` plein.
- `LigneJoueur` (`output` du reste) : `text-craie-vive` si `actif`, sinon `text-craie`. Le
  vainqueur (ligne non active en fin de partie) suit la même règle, sauf si le Dev constate que
  la ligne du vainqueur perdrait sa mise en avant : il le note alors.
- Couleur pleine, aucun alpha (garde `themeBoundary`) ; `craie` est déjà une paire de rôle des
  deux thèmes.
- Test : la classe du reste diffère entre ligne active et ligne inactive (état, pas couleur).

### 11. Bandeau X01 sur une seule ligne en paysage

- Maquette paysage 844 × 390 : bandeau d'une ligne, pavé à ~7 px du bas ; les touches sont au
  plancher de 48 px, le pavé ne peut plus céder de hauteur.
- Remplace la phrase « Paysage : DI / DO peuvent passer sur la ligne du sous-titre » du § 7 :
  en `paysage:`, le bloc central passe en **une rangée** (pictogramme, « X01 », sous-titre,
  DI / DO côte à côte) et « Manche N » / « Set M » à droite tiennent sur la même hauteur.
- Contrainte : la hauteur du bandeau en paysage **n'excède pas celle d'aujourd'hui** (mesurer
  avant / après au navigateur, chiffres dans `02-dev-notes.md`). Si elle l'excède, réduire
  l'espacement vertical du bandeau, jamais les touches.
- Aucune maquette ne dessine ce bandeau en paysage : à confirmer à la relecture.

### 12. « Manche N » en craie

- Planche : « MANCHE 3 » en petites capitales craie, plus en laiton. Couleur de texte secondaire
  pleine (`text-craie-2`), même casse et interlettrage que la planche ; « Set M » dessous, même
  style. Le laiton reste au repère du joueur actif et au rail.

## Révision 1 — colonne RESTE élargie en portrait (utilisateur, 2026-10-14)

Boucle 4 (Dev → Archi), décidée par l'utilisateur après la mesure R1 de la boucle 1 : à 4,5 rem,
« 600 », « 666 », « 688 », « 606 » sont rognés de 1,5 à 3,6 px par le bord de la feuille ; même à
4,25 rem, un reste comme « 206 » touche les filets, ce que l'utilisateur ne trouve « vraiment pas
joli ». Décision : **réduire un peu la colonne JOUEUR pour donner de l'air à RESTE.** Elle
**remplace** la clause « Pas d'élargissement de la colonne RESTE » de la question 1.

- **Portrait seulement.** `GRILLE_LIGNE` (`LigneJoueur.tsx`) prend une largeur RESTE plus grande
  en portrait ; en `paysage:` la grille actuelle (`6.75rem`) reste, avec les tailles de reste
  d'avant (paysage : JOUEUR y vit déjà sur ~122 px, il n'a rien à céder). Les en-têtes du
  bandeau de `Tableau` partagent `GRILLE_LIGNE` et suivent d'eux-mêmes.
- **Taille du reste 1-2 joueurs : 4,5 rem gardé** (`--text-score-xl-portrait`) ; 3 et 4 joueurs
  inchangés (4,05 / 3,1 rem).
- **Largeur retenue** : la plus petite qui laisse le reste **le plus large** possible à 3 chiffres
  (« 600 », ~120 px à 4,5 rem) avec un **air visible d'au moins 4 px** de chaque côté, entre les
  filets de colonne et le bord de la feuille. Le Dev la mesure en Chrome et l'exprime en rem
  (point de départ indicatif : `8.25rem` ≈ 132 px, soit ~24 px pris à JOUEUR).
- **Plancher de JOUEUR, à tenir et à mesurer** en portrait 390 px :
  - les trois cases de fléchettes affichent « BULL » sans rognage (≥ 29,4 px chacune). Si la
    place manque, resserrer d'abord ce qui n'est pas lu à 3 m : l'écart entre cases
    (`gap-1.5` → `gap-1` en portrait) puis le padding latéral de la colonne (`px-3` → `px-2`) ;
  - un pseudo de 6 lettres (« JULIEN ») reste entier ; au-delà, la troncature `truncate`
    existante fait foi ;
  - la colonne VOLÉE (« 177 », « moy 178,5 ») et MANCHES (en-tête « Manches ») ne bougent pas.
- **Commentaire de `GRILLE_LIGNE`** mis à jour : il documente le plancher de JOUEUR et le compte
  des colonnes ; il doit dire la nouvelle répartition portrait / paysage et pourquoi.
- **Charte** § Écran de match : largeur de la colonne RESTE et sa raison.
- **Tests** : la classe de grille porte la largeur portrait et la variante `paysage:` (état, pas
  mesure) ; mesures (reste le plus large, BULL, JULIEN) dans `02-dev-notes.md`, captures dans le
  scratchpad du lot.
- À rejouer : Dev, puis Test.

### Chaîne de la Révision 1

`archi-scout` (sonnet / low), tentative 1 : **PASS**. Approche validée :

- `GRILLE_LIGNE` = `'grid grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_8.25rem] paysage:grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_6.75rem]'`,
  écrite en littéral complet (scan Tailwind) ; seuls usages : `LigneJoueur` et l'en-tête de
  `Tableau`, qui suit seul.
- Calcul : « 600 » ≈ 120 px + 2 × 4 px d'air + 1 px de filet = 129 px → `8.25rem` (132 px).
  JOUEUR portrait : 148 → **124 px** (≈ le paysage actuel, ~122 px, où il tient déjà).
- « BULL » : avec `gap-1.5`, 0,2 px de trop → **`gap-1` obligatoire** sur les cases de
  fléchettes (3,8 px de marge avec `px-3`).
- Commentaires à jour : `GRILLE_LIGNE` (nouvelle répartition, phrase « 212 px / ~148 px »
  retirée) et `index.css` l. 77-82 (colonne de 108 px).
- Test d'état sur la classe de grille de l'article et de l'en-tête (jsdom n'évalue pas les médias).

**Questions du scout, closes par l'Orchestrator :**

| # | Question | Résolution |
|---|---|---|
| R1-1 | `8.25rem` ou `8.5rem` ? | Le Dev mesure le reste le plus large (« 600 », « 606 », « 688 ») en Chrome : `8.25rem` si l'air est ≥ 4 px de chaque côté, sinon `8.5rem` ; chiffres dans `02-dev-notes.md` |
| R1-2 | Ligne du vainqueur : pseudo de 6 lettres + pictogramme victoire (~108-114 px dans 100) tronqué ? | Le Dev mesure. `px-2` en portrait est permis s'il suffit (en-tête « Joueur » de `Tableau` aligné). Sinon, troncature acceptée et notée : la ligne du vainqueur ne vit qu'un instant avant le résumé, et le plancher de la révision vise le pseudo hors vainqueur |
| R1-3 | Rognage et « BULL » invisibles en jsdom | Mesures Chrome par le Dev, puis relecture à l'écran (portrait, sombre et clair) |
