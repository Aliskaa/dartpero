# Lot `feuille-commune` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent `archi-scout` (sonnet / low,
> frontmatter), tentative 1, retenu. Le sous-agent est en lecture seule.

Architecture result: PASS

## Problème

Le Cricket (`<table>` avec `.au-lancer`) et le Tour du monde (articles empilés, liseré,
`.au-lancer`) n'ont pas la feuille du lot 5 ; le moment fait deux rangées (76 px) ; le Tour du
monde à 4 joueurs fait 865 px de page pour 844. UI seule, aucune surface gravée : `lastRound`,
`history`, `dartsThrown`, `targetIndex` sont déjà fournis par les hooks et l'état, aucune donnée
ne manque, le domaine n'est pas touché.

## Approche retenue

Extraire de `Tableau` et `LigneJoueur` (X01) quatre briques réutilisées par les trois jeux, plutôt
que de recopier trois fois le repère et le bandeau. Question non bloquante « bandeau commun ou
trois bandeaux » : **un composant commun** `BandeauMatch` (structure identique, lien de retour
recopié 4 fois aujourd'hui ; les différences passent par des slots).

### Nouveaux composants (`src/ui/composants/commun/`)

1. **`BandeauMatch.tsx`** — props `pictogramme: PictogrammeNom`, `titre`, `sousTitre`,
   `complement?: ReactNode` (DI / DO du X01), `droite?: ReactNode`. Reprend le JSX de
   `EnTeteManche` (`X01Ecran`) : `Link` de retour, `Pictogramme` 24 px, classes `paysage:flex-row`
   du lot 5. Remplace les 4 en-têtes inline.
2. **`FeuilleMatch.tsx`** — props `grille: string` (littéral complet, scan Tailwind), `entetes:
   ReactNode` (dans `.bandeau-feuille`, `aria-hidden`), `nbLignes`, `indexActif: number | null`,
   `pied?: ReactNode`, `children` (lignes). Rend `section.feuille` (`aria-label="Tableau des
   scores"`), l'en-tête, puis un `relative grid` en `gridTemplateRows: repeat(n, 1fr)`. Le repère
   est le premier enfant : `span.repere-lancer` `aria-hidden`, `translateY(index × 100 %)`,
   `height: 100/n %` — code actuel de `Tableau`, déplacé tel quel ; rendu seulement si
   `indexActif !== null`. `Tableau` X01 l'adopte (`pied` = ruban de sortie), sans changement
   visuel.
3. **`NomJoueurFeuille.tsx`** — carré `size-3` en `teinte.fond`, nom `truncate`, pictogramme de
   victoire et `sr-only` vainqueur ; prop `alerte?` pour le carré rouge du bust X01. `LigneJoueur`
   l'adopte.
4. **`CasesVolee.tsx`** — les 3 cases extraites de `LigneJoueur`
   (`grid-cols-[repeat(3,minmax(0,2.75rem))] gap-1`, `ligne-saisie`, `text-sm`). Props `darts`,
   `aria-label`, `bust?`. Libellé par `Dart.label`, jamais grisé (§ 12 de la demande). Le Dev
   vérifie que le libellé d'un `MISS` ne déborde pas (« Hors » relève du lot 6b).

### Fichier par fichier

- **`src/index.css`** : retirer `.au-lancer` (plus d'emploi), mettre à jour le commentaire
  l. 191 ; le commentaire de `.repere-lancer` ne dit plus « (X01) ». Cible : tokens existants
  `text-score-xl-portrait` (4,5 rem), `text-score-l-portrait` (4,05 rem) ; 3,25 rem en paysage :
  token existant si la valeur correspond, sinon un token de taille (pas de valeur claire).
- **`MomentCelebratif.tsx`** : garder `absolute inset-x-0 bottom-0 z-10`, `bg-ardoise`,
  `pointer-events-none`, `role="status"`, `aria-live="polite"`, filet animé, couche verte. Une
  rangée : `h-11 flex items-center justify-center gap-3 px-3`, titre `shrink-0`, détail
  `truncate` précédé d'un « · » `aria-hidden`. `data` (`titre`, `detail`) inchangées : écrans et
  `momentDepuisVoleeX01` intacts. Prop `ancrage?: 'bas' | 'sous'` seulement si la mesure 3
  l'impose.
- **`TableauCricket.tsx`** : sortir de `<table>` (le repère exige des lignes égales).
  `FeuilleMatch` avec `GRILLE_CRICKET` littéral ; la planche donne
  `5.75rem repeat(7,minmax(0,1fr)) 4rem` (portrait) et `7.5rem repeat(7,…) 4.5rem` (paysage), mais
  avec un liseré : le Dev élargit JOUEUR au minimum pour le carré de 12 px et « MAXENCE » entier ;
  si les cibles se serrent, il réduit d'abord les marques (`size-8` / `size-10`), jamais le nom.
  Ligne = `<article aria-current>` ; marques SVG et `sr-only` d'état inchangés ; PTS en `output`.
  En-têtes `aria-hidden` « Joueur », cibles (« B »), « Pts ». Cible morte : `opacity-30` et
  en-tête barré, comme aujourd'hui. **Ligne VOLÉE dans `pied`**, hors de la grille des lignes
  (n'affecte ni `1fr` ni repère) ; prop `volee: { nom; darts }` ; « VOLÉE · NOM » + `CasesVolee` ;
  `min-h-11` (44 px) en portrait, soit la hauteur du moment, qui la recouvre sans toucher un
  joueur ; `h-9` / `h-10` en paysage si le 4 joueurs l'exige. Tests existants sur les rôles
  `table` / `row` à adapter.
- **`CricketEcran.tsx`** : `BandeauMatch` — « Cricket », sous-titre « Standard · 7 cibles » /
  « Cut-throat · 7 cibles », droite en texte seul `font-score text-etiquette uppercase
  tracking-wider text-craie-2`, sans bordure ni fond (le badge rouge disparaît). Supprimer
  `VoleeEnCours` de la saisie ; `PaveCricket` inchangé. `volee` depuis `state.history` et
  `partie.dartsEnCours` (aucune règle) : `dartsEnCours` non vide → joueur courant ; sinon →
  `history.at(-1)` avec le nom du joueur précédent ; sinon (début) → joueur courant, cases vides.
- **`LigneCible.tsx`, `TourDuMondeEcran.tsx`** : `FeuilleMatch`, grille
  `minmax(0,1fr)_6.5rem_7rem` (paysage `minmax(0,1fr)_7.5rem_6.5rem` de la planche, à confirmer) ;
  en-têtes « Joueur », « Parcours », « Cible ». Col. 1 : `NomJoueurFeuille` + `CasesVolee` (volée
  en cours si actif et `dartsEnCours` non vide, sinon dernière volée du joueur par
  `history.findLast(playerId)`, motif `dernieresVolees` du X01). Col. 2 : « n/21 », barre
  existante, « N fléchettes » en `text-craie-3` (`pluriel`). Col. 3 : cible à droite, 4,5 rem
  jusqu'à 2 joueurs, 4,05 à 3-4, 3,25 en `paysage:` ; bulle : glyphe plein + « BULLE » (SVG local
  si lucide `Target` est refusé par `pictogrammesBoundary`) ; drapeau de fin conservé.
  `VoleeEnCours` supprimée de l'écran ; `PaveCibles` intact. Bandeau : « Tour du monde »,
  sous-titre « 21 cibles », droite = badge « Dernier tour » si et seulement si `state.lastRound`.
- **`EntrainementEcran.tsx`** : `BandeauMatch`, pictogramme `entrainement`, « Entraînement »,
  sous-titre `reglesEntrainement(rounds, minTarget, maxTarget)` (existant), droite « Manche
  N/total » (`Math.min(roundsPlayed + 1, rounds)`). Cartouche inchangé.
- **`X01Ecran.tsx`** : `EnTeteManche` → `BandeauMatch` (DI / DO en `complement`, Manche / Set en
  `droite`). Aucun changement visuel attendu, hors moment d'une rangée.
- **`labels.ts`** : titres de bandeau, `sousTitreBandeauCricket`, `LIBELLE_CONDITION_CRICKET`,
  `LIBELLE_DERNIER_TOUR`, `libelleMancheSurTotal`, en-têtes (« Pts », « Parcours », « Cible »),
  « VOLÉE », « BULLE » ; « Joueur » et « Reste », aujourd'hui écrits dans `Tableau`, y sont
  déplacés. Vérifier que `LIBELLE_VARIANTE_CRICKET` (l. 128) donne « Standard » / « Cut-throat ».
- **`docs/CHARTE_GRAPHIQUE.md`** : § Écran de match (feuille commune, repère, carré 12 px,
  bandeau, moment d'une rangée, cible du Tour du monde) ; § Mouvement (repère sur les trois jeux).

## Tests (fakes, Testing Library, `renderWithServices`)

- Repère et `aria-current` (critère 1) : `it.each` sur les trois feuilles ; `translateY` suit
  l'index, `aria-current` sur la bonne ligne, repère `aria-hidden`, absent si `indexActif ===
  null`. Plus aucun `.au-lancer` : test d'absence qui peut échouer.
- Carré `size-3` coloré dans les trois jeux (2).
- Volée du Cricket (6) : avant la 1ʳᵉ fléchette de B, « VOLÉE · A » avec les fléchettes de A ;
  après une fléchette, « VOLÉE · B » ; début de partie, joueur courant et cases vides.
- « Dernier tour » (7) : présent si `lastRound`, absent sinon.
- Bandeau Cricket (8) : standard / cut-throat, textes de droite, aucune classe `border-*`.
- Moment (9) : `absolute`, `h-11`, `pointer-events-none`, `role="status"`, `aria-live="polite"`.
  Angle mort : jsdom ne mesure pas ; vérifié par la structure (dernier enfant d'un `relative`).
- Entraînement : sous-titre et « Manche N/total ».
- Gardes `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `lazyRoutes`,
  `horlogeBoundary`, lint, typecheck, build.

## Mesures pour le Dev

Chrome, 390 × 844 et 844 × 390, sombre et clair ; chiffres dans `02-dev-notes.md`.

1. Paysage, Cricket 4 joueurs avec la ligne VOLÉE : page ≤ 390, touches ≥ 48 px, bandeau sur une
   rangée. Si débordement : réduire la ligne VOLÉE (jusqu'à `h-9`), puis les lignes, jamais les
   touches.
2. Cricket 4 joueurs portrait : « MAXENCE » entier, marques et PTS non rognés.
3. Tour du monde 4 joueurs portrait : page ≤ 844. Moment de 44 px sur la dernière ligne : si la
   cible ou la volée de cette ligne est masquée, poser le moment sous la feuille en portrait
   (`ancrage='sous'`, `top-full`, sur le vide du `mt-auto`), le laisser recouvrir en paysage.
4. Cibles du Tour du monde (« 20 », bulle glyphe + légende) à 4,5 / 4,05 / 3,25 rem dans 7 rem,
   sans rognage.
5. Moment : 44 px effectifs ; « BOUCLÉ ! · MAXENCE · 21 FLÉCHETTES » tient (sinon `truncate`).
6. X01 : relecture complète après `BandeauMatch`, `FeuilleMatch` et le moment d'une rangée.
7. Relecture : repère qui glisse, « Dernier tour », moments Cricket, Tour du monde, X01.

## Conformité à la planche (ajouté à l'arrêt Archi → Dev, demande de l'utilisateur)

Relecture du plan contre le CSS et les écrans de la planche
(`scratchpad\feuille\feuille.html`, valeurs citées en px de la planche). Ces points **priment** sur
les tailles indicatives des sections précédentes ; tokens et classes existants seulement.

10. **Hauteur des lignes** (minimum, toujours égales entre elles pour le repère) — Cricket : 88 px
    à 2 joueurs, 62 à 3, 54 à 4, 50 en paysage. Tour du monde : 104 / 88 / 80 px, 62 en paysage.
11. **Filets de colonne** : au Cricket, un filet (`filet-colonne`) **seulement** avant la première
    cible et avant PTS, jamais entre les cibles ; même chose dans l'en-tête. Au Tour du monde,
    avant PARCOURS et avant CIBLE.
12. **Marques du Cricket à 28 px** (au lieu de `size-8` / `size-10`). Couleurs : cible fermée en
    `accent-mode`, marques en cours en `craie-vive`, cible morte en `craie-decor` sur une colonne à
    30 % d'opacité, en-tête barré (2 px).
13. **Typographie des lignes** : nom Oswald 700, 16 px, 15 px dès 3 joueurs ; `craie-2` au repos,
    `craie-vive` pour le joueur qui lance. PTS du Cricket 36 px, 30 px à 4 joueurs et en paysage,
    `craie` au repos, `craie-vive` pour le joueur qui lance.
14. **Parcours du Tour du monde** : « 20 » en 20 px gras `craie`, « /21 » en 13 px `craie-3` ;
    barre de 8 px (filet `craie` à 30 %) remplie en `accent-mode`, en `vert-cible` une fois le
    parcours bouclé ; cible bouclée en `vert-cible`, drapeau conservé ; « N » de « N fléchettes »
    en `craie-2` semi-gras, le mot en `craie-3`.
15. **Volée du Tour du monde** : cases sous le nom, décalées de 11 px pour s'aligner sur le nom
    (après le carré de 12 px et son espace).
16. **Cut-throat** : la droite du bandeau s'écrit sur deux lignes, « Le plus bas » / « gagne »
    (même empilement que « Manche » / « Set » au X01 ; une rangée en paysage).
17. **Badge « Dernier tour »** : même style que DI / DO du X01 (`border-accent-mode/50`, **sans
    fond**, `text-accent-mode-clair`, `text-etiquette`), à la place du badge actuel à fond.
18. **Ligne « VOLÉE · NOM » du Cricket** : filet supérieur `craie` à 25 % ; « VOLÉE » 12 px
    `craie-3` très espacé ; nom 12 px gras `craie-2` ; les trois cases **poussées à droite**
    (`ml-auto`), **48 px** de large minimum, chiffres 16 px gras `craie-vive`, écart de 8 px,
    trait de saisie dessous ; case vide « — » en `craie-3`. Hauteur 44 px en portrait, 40 px en
    paysage. `CasesVolee` prend une variante (« ruban ») pour cela, ou la ligne a ses propres
    cases : au choix du Dev, sans dupliquer le libellé des fléchettes.
19. **En cut-throat, l'en-tête PTS reste « Pts ↓ »** (Q5, utilisateur).

## Décisions du contexte concernées

Zones lecture / saisie jamais empilées en paysage (`DispositionPartie` inchangé) ; angle vif, ni
dégradé ni halo, tokens seulement (repère : voile à 12 % et `inset-shadow` sans flou) ; pavés
intacts (lot 6b) ; match en cours en état local synchrone, aucune règle recalculée dans l'UI ;
texte français dans `labels.ts`, « manche » jamais « leg » ; `lazyRoutes` respectée (composants
dans `commun/`, aucun écran ajouté).

## Baseline sécu

Aucune entrée non fiable ajoutée ; import JSON intact ; aucun réseau ; le pseudo passe par
`nomJoueur` et le JSX, pas de HTML brut ; rien de nouveau n'est stocké, la politique de
confidentialité reste exacte.

## Questions ouvertes

Aucune bloquante.

| # | Question | Résolution |
|---|---|---|
| Q1 | Le moment de 44 px masque-t-il la dernière ligne du Tour du monde ? (non bloquante de la demande) | Procédure écrite : mesure 3, règle de repli `ancrage='sous'` en portrait ; confirmé à la relecture |
| Q2 | Bandeau commun ou trois bandeaux (non bloquante de la demande) | **Close** : composant commun `BandeauMatch` |
| Q3 | Hauteur de la ligne VOLÉE en paysage à 4 joueurs (non bloquante de la demande) | Procédure écrite : mesure 1, repli jusqu'à `h-9`, jamais les touches |
| Q4 | Colonnes du Cricket avec carré 12 px et « MAXENCE » entier | Procédure écrite : mesure 2, marques réduites avant le nom |
| Q5 | En cut-throat, l'en-tête « Pts ↓ » devient « Pts » (la variante est dite par le bandeau) | **Close par l'utilisateur** (arrêt Archi → Dev) : on **garde « Pts ↓ »** en cut-throat |
| Q6 | La volée du Tour du monde quitte le dessus du pavé pour la colonne JOUEUR | Conforme à la demande (§ 9) ; signalé à l'utilisateur |
