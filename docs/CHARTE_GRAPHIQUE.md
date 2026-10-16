# Charte graphique — Dartpéro

> Ambiance **« pub anglais / oche »**, exécutée en **« feuille de match »**.
> Source de vérité runtime : `src/index.css` (`@theme` + `@layer components`).
> Ce document est le référentiel design : à consulter avant d'ajouter un écran ou un composant.
> Le résumé opérationnel et les décisions gravées vivent dans [../CLAUDE.md](../CLAUDE.md) —
> **ce document ne le contredit jamais**.

---

## Principe directeur

**Le décor n'est pas une matière, c'est une structure.**

Ce n'est plus un pub qu'on dessine, c'est **la fiche de ligue punaisée derrière le bar** :
des colonnes, des filets épais, des cases qu'on remplit. Bois, laiton et feutre restent la
palette, mais ils ne modèlent plus rien — le laiton ne sert qu'à marquer la ligne de celui qui
lance, le bois se replie sur les cadres. Les nombres lus à 3 mètres sont en craie quasi-blanche
sur feutre sombre.

⚠️ **Zéro dégradé de décor, zéro halo, zéro biseau, zéro angle arrondi.** Une seule exception
de dégradé : `.chargement-balai` (le balayage d'un skeleton, un état d'attente). Les **ombres
portées** restent permises (`drop-shadow-[0_3px_0_var(--ombre-plaque)]` de l'enseigne et du
nom du vainqueur, `drop-shadow-[0_2px_2px_…]` de la médaille, `drop-shadow` du `Check` de
`JoueursEcran`, ombre de la ligne qu'on fait glisser dans `ListeOrdonnable`) : elles posent une
plaque sur un mur, elles ne rayonnent pas. Un **halo** est
une lueur sans décalage (`shadow-[0_0_…]`) : il n'y en a plus. `.trace-craie` (le souffle de
craie) est **réservé au reste du joueur qui lance** : les lignes actives du tableau
(`LigneJoueur`, `LigneCible`, `TableauCricket`) et le grand chiffre de la `Cartouche`
d'entraînement (joueur seul, qui lance toujours) ; **jamais** sur un résumé. Gardes :
`tests/architecture/typographieBoundary.test.ts` (dégradés, halos, `text-shadow` à flou).

### Contexte d'usage (dicte tout le design)

Le téléphone est **posé** — contre un mur, sur une table, sur une étagère — pendant que
plusieurs joueurs se relaient à l'oche. Un joueur tape les scores à 30 cm, les autres lisent le
tableau à **2–3 mètres**. Souvent dans un garage ou une cave mal éclairés, **sans réseau**.

→ **Lisibilité à distance** et **zéro friction au démarrage** priment sur tout le reste.

### Les trois planchers

| Plancher | Règle | Pourquoi |
| -------- | ----- | -------- |
| Lisibilité | Aucun texte sous **`craie-3`**, en couleur pleine (jamais `text-craie/NN`) : **≥ 4,5:1** sur les 4 surfaces, dans les 2 thèmes | Garage mal éclairé + téléphone en luminosité basse ; l'encre transparente tombe sous 4,5:1 sur papier |
| Tactile | **≥ 48 px** partout (`min-h-12`) | On tape debout, une fléchette dans l'autre main |
| Angle | **`--radius-*` = 0** dans `@theme` | Point de contrôle unique de l'angle vif (voir plus bas) |

⚠️ **L'angle vif a un point de contrôle unique** : les tokens `--radius-*` valent `0` dans
`@theme`. Les classes `rounded-*` ont en plus été retirées de tout `src/ui`, pour qu'on ne lise
pas dans le code une intention que le CSS annule. **Les deux ensemble, pas l'un ou l'autre** :
remettre un rayon dans le `@theme` rallumerait tout d'un coup.

---

## Identité

| Élément | Valeur |
| ------- | ------ |
| Nom affiché | **Dartpéro** (fléchettes + apéro) |
| Slug technique | `dartpero` |
| Icône PWA | Générée par `npm run icons` depuis `scripts/icon.svg` (cible stylisée, triple 20 en laiton, une fléchette plantée) |
| Pictogrammes maison | Douze, dans un seul composant (`Pictogramme`) : quatre **modes** (`x01`, `cricket`, `tour-du-monde`, `entrainement`) et huit **moments** (`180`, `bust`, `sortie`, `victoire`, `moyenne`, `grosses-volees`, `meilleure-manche`, `nul`) ; le mode se reconnaît à sa forme, plus seulement à sa couleur. Dessin : grille 24, trait de 2 px, extrémités et jonctions vives (`square` / `miter`), couleur du texte (`currentColor`) — jamais une couleur en dur. Toujours `aria-hidden`. Couleurs d'emploi : un mode est en laiton (§ Un seul accent : le laiton), `victoire` est en `laiton-clair` dans tous les jeux, `sortie` en `vert-cible`, `nul` en `craie`. **Exception, en tête des cartes du podium (Statistiques)** : `moyenne`, `victoire`, `grosses-volees` et `sortie` à 20 px, à gauche du titre et **de la couleur du titre** (`laiton`), pour les quatre (lot `statistiques-podium`, U3). **Un pictogramme dit quelque chose, il ne le dit pas seul** : un texte voisin (ou réservé aux lecteurs d'écran) porte toujours le sens. Tailles permises : 20, 24, 32, 40 et 64 px (`TaillePictogramme`), **jamais moins de 20 px**. |
| Icônes d'action | **lucide-react**, toujours en `aria-hidden` — elles n'entrent jamais dans le nom accessible. Réservées aux actions (retour, annuler, corbeille, navigation…) et aux cas sans équivalent maison (`CircleOff`, `Flag`). En v1, `Home` s'appelle **`House`**. |

---

## Les deux thèmes

**Un seul jeu de tokens, deux jeux de valeurs.** `@theme` déclare la palette **sombre**, le
défaut ; `html[data-theme="clair"]` n'en redéfinit que les **valeurs**. Aucune classe de
`src/ui` ne connaît le thème.

⚠️ **Le défaut est « sombre », pas « système ».** Le cadrage est un garage mal éclairé : le
sombre *est* l'app, le clair est une option. Ouvrir la mise à jour sur un fond blanc parce que
le téléphone est en clair serait un changement qu'on n'a pas demandé.

Le thème vit dans `src/ui/theme.ts` (`sombre` / `clair` / `systeme`), qui est **le seul endroit
qui écrit `data-theme`**. Un script d'amorçage dans `index.html` pose l'attribut **avant** le
bundle, sinon la page flashe en sombre avant de virer au clair — c'est un doublon assumé, la
clé (`dartpero:theme`) et les deux teintes de barre doivent rester d'accord avec `theme.ts`.

### Palette

Tokens `@theme` dans `src/index.css`. Utiliser les classes Tailwind (`bg-feutre`,
`text-laiton`…) — **jamais un hex en dur** hors de `index.css` / `couleurs.ts`.

| Rôle | Token | Sombre | Clair | Usage |
| ---- | ----- | ------ | ----- | ----- |
| Fond principal | `feutre` | `#0E1A13` | `#E3D9C1` | Le tapis / le sous-main |
| Surfaces | `ardoise` | `#16241B` | `#F7F2E6` | Panneaux, feuilles, listes |
| Bois | `chene` | `#5A3E24` | `#5A3E24` | Cadres — **le bois ne change pas de bois** |
| **Accent principal** | `laiton` | `#C9A227` | `#8A6D12` | Ligne au lancer, CTA, focus |
| Texte courant | `craie` | `#F2E8D5` | `#1F2D24` | Corps, libellés |
| Texte secondaire | `craie-2` | `#BCB8A8` | `#354137` | Texte courant atténué, noms des joueurs inactifs |
| Légendes, en-têtes | `craie-3` | `#9B9B8A` | `#485249` | Le plancher : rien de lisible en dessous |
| Décor | `craie-decor` | `#52584D` | `#A8A592` | Séparateurs « · », « \| », glyphes `aria-hidden` seulement — aucune contrainte de contraste |
| **Chiffres du tableau** | `craie-vive` | `#FFFFFF` | `#0C1512` | Scores géants |
| Texte sur laiton | `sur-laiton` | `#1A1206` | `#FBF7EC` | Étiquette d'un bouton primaire |
| Alerte / bust | `rouge-cible` | `#C1272D` | `#A81F25` | Bust, danger |
| Succès / sortie | `vert-cible` | `#2E7D4F` | `#1F6B41` | Ligne de sortie, manche gagnée |

Nuances (`feutre-nuit`, `ardoise-claire`, `chene-clair`, `chene-sombre`, `laiton-clair`,
`laiton-sombre`) : elles servent aux tranches et aux fonds d'appui, plus à modeler des reliefs.

**Feuille de règles** (lot `regles-du-jeu`) : les couleurs de la planche `regles-rubriques.html`,
au pixel, devenues des tokens — **réservés à la feuille de règles et à son livre** (garde `themeBoundary`, `rules/theme-colors.md` § Jetons réservés) :

| Rôle | Token | Sombre | Clair | Usage |
| ---- | ----- | ------ | ----- | ----- |
| Texte courant de la feuille | `craie-2-regles` | `#D6CCB9` | `#354137` | Corps des rubriques |
| Légendes de la feuille | `craie-3-regles` | `#AAA292` | `#485249` | Lignes grises (l'autre réglage), en-têtes du tableau d'exemple, termes des réglages |
| Petits libellés laiton | `laiton-texte` | `#C9A227` | `#614A08` | « CE SOIR », « EN BREF », titres de rubrique, numéros |
| Rouge en texte | `rouge-texte` | `#FF8A8F` | `#A81F25` | Restes sans finish de ce soir, « bust » de l'exemple |
| Vert en texte | `vert-texte` | `#5BB27E` | `#1F6B41` | Succès de l'exemple |
| Filets | `filet` / `filet-doux` | `#3A4A3F` / `#24332A` | `#C2BBA6` / `#E0D9C7` | Séparateurs de rubriques, tableau, questions |
| Cadre de la croix | `chene-doux` | `#4A3825` | `#A38D6F` | Bordure du bouton « Fermer » |
| Voile | `voile` | `rgb(4 8 5 / .62)` | `rgb(47 30 16 / .45)` | `::backdrop` en portrait (transparent en paysage) |

⚠️ `rouge-cible` / `vert-cible` restent des **fonds et des filets** : en texte sur l'ardoise
sombre ils tombent à 2,8:1 et 3,2:1. Contrastes des tokens de texte (sur `feutre` · `feutre-nuit`
· `ardoise` · `ardoise-claire`) — sombre : `craie-2-regles` 11,2 · 12,1 · 10,1 · 8,7 ;
`craie-3-regles` 7,1 · 7,6 · 6,4 · 5,4 ; `laiton-texte` 7,4 · 7,9 · 6,7 · 5,7 ; `rouge-texte`
7,9 · 8,5 · 7,1 · 6,1 ; `vert-texte` 6,9 · 7,4 · 6,2 · 5,3. Clair : `craie-3-regles` 5,8 · 4,7 ·
7,3 · 8,0 ; `laiton-texte` 6,0 · 4,8 · 7,6 · 8,3 ; `rouge-texte` 5,2 · **4,2** · 6,5 · 7,2 ;
`vert-texte` 4,6 · **3,7** · 5,8 · 6,4 — rouge et vert ne se posent que sur l'`ardoise` de la
feuille, jamais sur son en-tête `feutre-nuit`.

⚠️ **Le point critique du thème clair, c'est le laiton.** Le laiton vif fait **1,84:1** sur du
papier : le filet de `.repere-lancer`, qui dit **qui est en train de lancer**, y deviendrait
invisible — l'information la plus lue de l'app. Il passe donc en laiton foncé (4,4:1), et
`laiton-clair` y veut dire « plus lisible sur le fond », donc **plus foncé**. C'est le
**rôle** qui s'inverse, pas la teinte.

⚠️ **`laiton-clair` en clair vaut `#614a08`** (lot `pave-unifie`), et non plus `#6b5209` : le titre
du bandeau (`feutre-nuit` `#d1c3a4`) ne tenait que **4,25:1**. Calculé : **6,01:1** sur `feutre`,
**4,84:1** sur `feutre-nuit`, **7,55:1** sur `ardoise`, **8,28:1** sur `ardoise-claire` (et 5,18:1
sur le fond du Triple) — ≥ 4,5:1 sur les quatre surfaces. Aucun nouveau token : c'est le même,
plus foncé.

**Le texte secondaire est en couleur pleine, jamais en alpha.** `text-craie/60` posait de l'encre
transparente sur le papier : en clair, le rapport tombait sous 4,5:1. Désormais `craie-2`
(ancien 75-85 %) et `craie-3` (ancien 55-70 %) ; `craie-decor` n'est réservé qu'aux glyphes
`aria-hidden`. Un « — » qui tient la place d'une valeur absente est une **information** : il
prend `craie-3`. `text-craie/NN` et `text-craie-vive/NN` sont interdits (garde
`themeBoundary`) ; l'alpha reste permis pour les bordures et les fonds (`border-craie/25`).

**Contrastes WCAG** (sRGB linéarisé : `c ≤ 0,03928 ? c/12,92 : ((c+0,055)/1,055)^2,4`,
`L = 0,2126 R + 0,7152 G + 0,0722 B`, rapport `(L1+0,05)/(L2+0,05)`) :

| Token | Thème | `feutre` | `feutre-nuit` | `ardoise` | `ardoise-claire` |
| ----- | ----- | -------- | ------------- | --------- | ---------------- |
| `craie` | sombre | 14,70 | 15,79 | 13,27 | 11,33 |
| `craie-2` | sombre | 8,98 | 9,65 | 8,11 | 6,92 |
| `craie-3` | sombre | 6,34 | 6,81 | 5,72 | **4,88** |
| `craie` | clair | 10,25 | 8,26 | 12,88 | 14,14 |
| `craie-2` | clair | 7,62 | 6,14 | 9,58 | 10,51 |
| `craie-3` | clair | 5,80 | **4,67** | 7,29 | 8,00 |

**Onglet actif de `NavigationBasse`** : texte `craie-vive` (19,19:1 en sombre, 10,65:1 en clair
sur `feutre-nuit`), inactif `craie-3`. Le `laiton-clair` ne tenait que 4,25:1 en clair ; l'identité
laiton reste portée par le trait `bg-laiton` de 3 px sous l'onglet.

**Lignes de joueurs inactives** : plus d'`opacity-70` (il grisait aussi les chiffres et faisait
retomber le contraste) ; l'inactif se distingue par le nom en `craie-2` et l'absence de
repère et de `trace-craie`.

### Ce qui n'est pas une couleur

Déclarés hors de `@theme` (qui ne fabrique que des utilitaires), et redéfinis eux aussi en
thème clair : `--teinte-relief` (le filet de `.grave` : noir sous de
la craie, **blanc** sous de l'encre), `--ombre-plaque` (l'ombre de l'enseigne : du brun de bois
en clair, jamais du blanc, qui ferait un contour et non une ombre), `--voile-cible`,
`--voile-trace` (**transparent** en clair : l'encre ne rayonne pas) et `--eclat-balai`.

### Couleurs de profil joueur

Teintes **symboliques** (domaine : `PlayerColor`), traduites en pixels uniquement dans
`src/ui/couleurs.ts`, et **identiques dans les deux thèmes**. Ensemble **fermé** de 8 : avec un
sélecteur libre, deux joueurs choisissent deux bleus voisins qu'on ne distingue plus à 3 mètres.

| Nom | Fond | Bord | Texte |
| --- | ---- | ---- | ----- |
| Brique | `#C1272D` | `#E4585E` | `#FFF1F1` |
| Sapin | `#2E7D4F` | `#5BB27E` | `#EFFBF3` |
| Lagon | `#2C6E9B` | `#5FA6D1` | `#EFF7FD` |
| Prune | `#8A4FA8` | `#B683CE` | `#F8F0FD` |
| Cuivre | `#C1720F` | `#E7A248` | `#FFF6EA` |
| Turquoise | `#1F8B8B` | `#4FBFBF` | `#EEFBFB` |
| Grenat | `#A32B63` | `#D4699B` | `#FDEFF6` |
| Olive | `#5A6E23` | `#93AB4E` | `#F5FAE8` |

Profil supprimé (parties encore visibles) : teinte bois `#5A3E24` / `#8B6238` / `#F2E8D5`.
Sans couleur choisie à la création : **première libre** en tourniquet — zéro friction.

### Un seul accent : le laiton (lot `pave-unifie`)

**Il n'y a plus d'accent par mode.** Le laiton est la seule teinte de l'app : le repère du joueur
actif, le titre et le pictogramme du bandeau, les badges, les marques fermées du Cricket, la barre
de parcours du Tour du monde, les résumés et le tableau d'honneur, le pictogramme et le premier de `CartePartie` et
des cartes du choix du jeu (`EtapeJeu`). **Le jeu se dit par son pictogramme et son titre**, pas par
une couleur. Les quatre teintes d'avant (laiton, lagon, cuivre, prune) se confondaient avec les
couleurs d'un profil — le lagon et la prune sont des couleurs de joueur — et le cuivre avec le
laiton à 3 m.

`accents.ts`, `--accent-*` et `--color-accent-mode*` sont **supprimés** ; `DispositionPartie` et
`TableauHonneur` n'ont plus de prop `mode`. Le texte laiton s'écrit `text-laiton` /
`text-laiton-clair`, le filet `border-laiton/50`, le fond `bg-laiton`. Garde :
`tests/architecture/accentBoundary.test.ts` (aucun `accent-mode`, `--accent-`, `ACCENTS_MODE`,
`variablesAccent` dans `src/`). Ne pas en ressusciter un par jeu sans trancher à nouveau.

---

## Typographie

Polices embarquées via `@fontsource`, **sous-ensemble `latin` uniquement** (le cyrillique et le
vietnamien pesaient 136 Kio de précache pour rien — l'app est en français).
Import par `@fontsource/<police>/latin-<poids>.css` : précache workbox de **542 Kio → 406 Kio**.

| Token | Police | Poids | Rôle |
| ----- | ------ | ----- | ---- |
| `font-display` | **Alfa Slab One** | 400 | L'enseigne : logo « Dartpéro », nom du vainqueur. **2–3 mots max.** |
| `font-score` | **Oswald** | 500 / 700 | **Tous les chiffres du tableau**, titres, boutons (uppercase). Condensé + `tabular-nums`. |
| `font-sans` | **Barlow** | 400 / 600 | Corps, listes, stats, libellés courants. |

**Échelle de tailles** (tokens `--text-*` du `@theme`) : aucune taille sous **0,75 rem**, et
aucune taille arbitraire `text-[…rem]` dans `src/ui` (garde `typographieBoundary`).

| Classe | Taille | Usage |
| ------ | ------ | ----- |
| `text-etiquette` | 0,75 rem | Le plancher : légendes, badges, en-têtes de colonnes, exposants du pavé |
| `text-score-xl` / `-l` / `-m` | 4,25 / 3,25 / 2,5 rem | Le reste X01 selon le nombre de joueurs, **en paysage** |
| `text-score-xl-portrait` / `-l-portrait` / `-m-portrait` | **4,5** / 4,05 / 3,1 rem | Le reste X01 selon le nombre de joueurs, **en portrait** (lot `match-x01`) |
| `text-multiplicateur` | 0,8 rem | La valeur réelle dans le coin d'une touche armée (Double, Triple) |
| `text-score-solo` | 4,5 rem | Le reste de l'entraînement (`Cartouche`, résumé) |

**Interlettrage** : large (jusqu'à `0.42em`) là où la place existe ; **resserré à 0,06 em au
plus** là où 0,75 rem déborderait — `.bandeau-feuille .entete-colonne` (le tableau X01, colonne
« Manches » de 44 px en `tracking-normal`), en-têtes de `TableauCricket`, libellés de
`NavigationBasse`, `Avatar` xs (`size-6`, deux initiales).

| Classe | Effet |
| ------ | ----- |
| `.chiffres` | Oswald + `tabular-nums` — les chiffres ne dansent pas quand le score change |
| `.trace-craie` | Souffle de craie sous les grands chiffres **du joueur actif seulement** (**disparaît en thème clair**) |
| `.grave` | Filet de relief sous les petits textes |

---

## Le vocabulaire de la feuille

Classes de `@layer components` dans `src/index.css`. **Aucune image bitmap** : tout est CSS ou
SVG inline.

| Classe | Effet | Où |
| ------ | ----- | --- |
| `.feutre-tapis` | Le sol : feutre **uni** (plus d'image de fond) | Fond d'écran |
| **`.feuille`** | Le conteneur : ardoise cerclée d'un filet de craie de 3 px | Tableau de match, panneaux de résumé |
| **`.bandeau-feuille`** | En-tête **en inversion** : craie pleine, texte sombre | En-têtes de colonnes uniquement |
| **`.bandeau-match`** | Bandeau de partie, sombre, refermé par un filet de 3 px | Haut des écrans de jeu |
| **`.bandeau-bas`** | La barre de navigation | `NavigationBasse` |
| **`.entete-colonne`** | Libellé de colonne | Ligne d'en-têtes |
| `.ligne-tableau` | Une ligne : un filet, rien d'autre | Lignes de score |
| **`.repere-lancer`** | Filet de laiton **dans** la marge + voile de 12 %, porté par **un seul élément qui glisse** d'une ligne à l'autre | Le joueur dont c'est le tour, **dans les trois jeux** (`FeuilleMatch`). `.au-lancer`, qui le posait ligne par ligne au Cricket et au Tour du monde, a disparu (lot `feuille-commune`) |
| **`.touche-armee`** | Désigne les touches (cibles et Bulle) qui prennent le filet de laiton quand Double ou Triple est armé ; le fondu au retour à Simple | `PaveSaisie` (X01, entraînement, Cricket ; pas au Tour du monde) |
| **`.touche-bulle`** | Le rouge de la Bulle (fond `rouge-cible` 25 %, bordure 70 %), en couche `components` pour que l'appui puisse l'inverser | `PaveSaisie` |
| **`.exposant-touche`** / `-neutre` | La petite valeur dans le coin d'une touche : `laiton-clair` (« 50 », « ×2 ») ou `craie-3` (le « 25 » de la Bulle en Simple) ; à l'appui, elle **hérite** du texte | `PaveSaisie` |
| **`.filet-colonne`** | Séparateur vertical (`.filet-colonne-entete` : le même, dans l'en-tête inversé) | Entre deux colonnes |
| **`.ligne-saisie`** | La ligne sur laquelle une fléchette est « écrite » | Volée en cours |
| `.cadre-bois` | Encadrement plat | Chrome rare |
| `.ardoise-craie` | Panneau | Surfaces secondaires |
| `.laiton-poli` | Laiton **plein et plat**, tranche franche de 4 px | CTA primaire |
| `.laiton-plat` | Laiton sans tranche | Curseurs, pastilles, S/D/T |
| `.touche` | Filet de craie, tranche de 2 px, **s'inverse à l'appui** (fond **et** texte). ⚠️ La couleur de repos est portée par `.touche` (`color: var(--texte-touche, craie-vive)`) : un bouton ne pose **jamais** `text-craie*` / `text-laiton*`, il pose la variable (`[--texte-touche:var(--color-craie-3)]`). Un utilitaire (couche `utilities`) bat `.touche:active` (couche `components`) : c'était P1. Garde `appuiBoundary` | Pavé de saisie, `JoueursEcran` |
| `.filet-laiton` | Séparateur horizontal discret | Entre zones |
| `.chargement-balai` | Lueur qui balaie — **seule exception au zéro dégradé** | Skeletons |

⚠️ **`.bois-veine` et l'animation `halo` ont été supprimées.** Le veinage tirait l'œil vers le
décor, et **une fiche ne rayonne pas** — un `box-shadow` animé en continu coûtait en plus un
repaint par image sur un vieux téléphone. Le joueur au lancer se signale par `.repere-lancer`.

### Règles d'emploi

- **Bois / laiton** : chrome (bandeau, nav, CTA). Jamais derrière un score, jamais sur chaque chip.
- **Lignes de joueur** : `.ligne-tableau` + carré à la couleur du profil — pas de `.cadre-bois`.
- **`.bandeau-feuille`** est réservé aux **en-têtes de colonnes**. Un panneau ordinaire porte un
  bandeau sombre, pas une inversion : tout inverser ne hiérarchise plus rien.
- **Alfa Slab** : enseigne + vainqueur uniquement. Titres d'écran = Oswald (`font-score`).
- **Hiérarchie d'une ligne X01** : (1) le reste à 3 m · (2) la volée à 1 m · (3) moyenne et
  fléchettes à 30 cm.

### Moments de célébration

Hors saisie uniquement — jamais pendant qu'on tape une volée :

- **`MomentCelebratif`** : bandeau vert éphémère (manche / set / sortie / tour bouclé / cible
  fermée), `pointer-events-none`, ~2,2 s. ⚠️ **Hors du flux** (lot `match-x01`) : il est `absolute`
  au bas de son ancêtre `relative` — l'écran enveloppe son tableau et le moment dans un
  `div.relative`, le moment en dernier enfant. ⚠️ **Une seule rangée de 44 px** (`h-11`, lot
  `feuille-commune`), titre puis détail (« FERMÉE ! · 19 »), pour les trois jeux : il recouvre
  exactement le pied de la feuille (X01 : le ruban de sortie ; Cricket : la ligne de volée), ne
  décale rien, ne touche jamais le pavé. Fond **opaque** (`bg-ardoise`) sous la teinte verte :
  sans lui le pied transparaîtrait. **Tour du monde** (prop `ancrage="sous"`) : la feuille n'a pas
  de pied, 44 px sur la dernière ligne en masquaient la cible et la volée (mesuré à quatre joueurs :
  41 px sur 80) ; en **portrait** le moment se pose donc **sous** la feuille, sur le vide qui la
  sépare du pavé (108 px à quatre joueurs), et en **paysage** — où ce vide n'existe pas (30 px) —
  il recouvre le bas de la feuille pendant ses 2,2 s.
- **`TableauHonneur`** : le podium des résumés (avatar, couronne, phrase d'ambiance), en laiton.
  Phrase tirée de `phraseVictoire(matchId)` — **déterministe**, pas de `Math.random`.
  Le **nom de la partie** s'affiche en tête (prop obligatoire `nomPartie`), dans un `<p>` —
  **jamais un second `<h1>`** : l'écran en porte déjà un.

---

## Composants réutilisables

Toujours réutiliser `src/ui/composants/commun/` — **ne jamais** dupliquer une variante ad hoc.

| Composant | Rôle |
| --------- | ---- |
| `Button` | Primaire laiton / secondaire cadre bois / discret / danger · tailles `md` et `lg` |
| `Avatar` | Pastille couleur + initiales (2 lettres max) |
| `Cible` | Plateau SVG génératif (décoratif, `aria-hidden`) |
| `Enseigne` / `LogoHero` | Marque Dartpéro |
| `Panneau` | Ardoise dans un cadre · `titre` (`<h2>`) **ou** `enTete` libre |
| `EnTeteEcran` | Titre d'écran + sous-titre |
| `StatTile` | Tuile de statistique — **deux lignes réservées au libellé** |
| `Batons` | Les manches comptées en bâtons, quatre traits barrés par un cinquième — **gagnées sur requises** (traits acquis, tirets à gagner), en CSS, sur la feuille de match |
| `CompteBatons` | Un **total** compté en bâtons de craie (carte Grosses volées) — à ne pas confondre avec `Batons`. SVG d'après la planche : groupe de k traits = 5k + 4 de large, 16 de haut, trait 1,8, barre de (0, 13) à (5k + 4, 3). **Au plus 10 groupes (50 bâtons)**, puis le nombre exact (`decompteBatons`). Nombre toujours écrit dès 1 (`craie`), « — » `craie-3` à 0. Teinte des traits par seuil, en tokens **pleins** : 180 `laiton`, 140+ `craie`, 100+ `craie-2` (jamais d'alpha). Traits `aria-hidden` |
| `CartePodium` / `BasculesPodium` / `ClassementPodium` (`GrandeLignePodium`, `BarresPodium`, `BoutonToutVoir`) | Les cartes du podium de Statistiques (lot `statistiques-podium`). **Carte** : région nommée par son `<h2>` (titre de Moyenne abrégé en « Moyenne 3 fl. » : à 360 px, « Moyenne 3 fléchettes » était tronqué à côté des bascules ; nom accessible de la carte, du dialogue et de « Tout voir » = court **puis** complet, « Moyenne 3 fl., Moyenne 3 fléchettes », par un `aria-label` sur le `<h2>`, QO-1), `bg-ardoise`, filet haut 3 px `craie`, pictogramme 20 px et titre `entete-colonne` gras en `laiton` (écart connu, voir sous la table), à droite les bascules. **Bascules** : puces `text-etiquette`, bordure `craie/25` texte `craie-2`, active bordure `laiton` texte `laiton-clair` ; libellé **court** à l'écran (« Moy. · F9 · Volée », « 180 · 140+ · 100+ », « % dbl · Haut · Manche »), nom accessible = court **puis** complet (« F9, First 9 », `nomBascule` ; le court seul quand ils se confondent : « 180 ») ; visuel de la planche, zone d'appui de 48 px en hauteur (écart connu). **Classement** : le premier en grand (`GrandeLignePodium` : avatar 34 px, nom `craie-vive`, chiffre `text-5xl` `laiton-clair`, complément `text-sm` `craie-3` : « / 16 », « fl. »), puis une `<ol>` de barres (`BarresPodium` : avatar 24 px, nom, piste `craie/8`, barre `craie/72` ou `laiton` pour les ex æquo en tête — un joueur seul ou tous à égalité à une valeur non nulle (tous à 180) : **tous en tête** ; **jamais de dorure à zéro** (un « 0 % » devant des « — » n'est pas doré ; les sans occasion ne comptent pas) — différent de `MiniTableauPartie`. Sans premier doré, le grand chiffre passe en `craie-vive`), valeur `text-nom-serre` ; **Victoires** : « / j » (parties de **ce** joueur) après la valeur sur chaque barre, `text-etiquette` `craie-3`, colonne des valeurs de 72 px au lieu de 44 — colonnes **fixes**, pour que toutes les pistes d'une carte aient la même longueur. Ni ligne de détail ni ligne de bas (Révision 1). Sans occasion : « — » `craie-3`, barre vide, dernier rang. **N premiers, puis « Tout voir »** (Révision 1) : 5 / 5 / 3 / 5 lignes (Moyenne, Victoires, Grosses volées, Finitions) ; jusqu'à N + 1 joueurs, tout est montré ; deux ex æquo exactement à la coupure : N + 1 ; plus de deux : coupe net à N (`apercuPodium`). « Tout voir » (`BoutonToutVoir`) : sous la liste, pleine largeur, 48 px, bordure `craie/25`, texte `craie-3` en majuscules, `aria-haspopup="dialog"`, nom « Tout voir, <titre> » ; il ouvre une `Modale` (tête : pictogramme, titre qui suit la bascule, ✕ ; bascules partagées avec la carte ; tous les joueurs au même dessin, sans grande ligne). **Grosses volées** classées sur le seuil de la bascule (« 180 » au départ ; ex æquo dans l'ordre de la moyenne), titre fixe, trois rangées par joueur. Classement, coupure, largeurs et ex æquo (jugés sur le **chiffre affiché**) : `ui/podium.ts` |
| `Modale` (+ `hooks/useModaleAuRetour`) | Une boîte modale **refermée par le retour du téléphone** sans quitter l'écran (lot `statistiques-podium`, Révision 1). `<dialog>` natif (`showModal()`), **monté en permanence**, contenu rendu seulement ouvert ; boîte centrée `bg-ardoise`, `border-2 border-craie/35`, voile `backdrop:bg-feutre-nuit/80` ; **largeur de l'écran moins 2 × 16 px**, bornée à `max-w-lg` (32 rem) ; **hauteur au plus 90 % de la hauteur visible** (`90dvh`) ; tête fixe (pictogramme 20 px `laiton`, `<h2>` `entete-colonne` `laiton`, ✕ 48 px `craie-2` nommé « Fermer », bascules dessous), liste qui défile (`overflow-y-auto overscroll-contain`). Discipline du `<dialog>` dans `useDialogueNatif`, partagée avec `FeuilleRegles`. Fermée par ✕, Échap, retour **ou un appui sur le voile** (décision de l'utilisateur, renverse R1-Q5 sur ce point) : l'appui doit commencer (pointerdown) et finir (click) hors de la boîte, cible = le `<dialog>` lui-même et coordonnées hors de son `getBoundingClientRect()` — un appui sur la bordure ou un glisser parti de la liste ne ferme pas. Liste plus aérée que la carte : 14 px entre deux barres (8 dans la carte), 18 px entre deux joueurs de Grosses volées (10 dans la carte), prop `espacement`. Focus sur ✕ à l'ouverture, rendu à l'élément d'origine à la fermeture. ⚠️ **Jamais `flex` ni `grid` sur le `<dialog>`** (il s'afficherait fermé) : la mise en page vit dans un conteneur intérieur. Aucune animation. L'ouverture empile une entrée d'historique sur la même URL (`location.state`), la fermeture recule toujours d'une entrée (`navigate(-1)`) : voir CONVENTIONS § 9. Dette : `DialogueNouveauJoueur` (Nouvelle partie) ne passe pas encore par là |
| `ChoixSegmente` | Le rail à curseur de laiton · tailles `md` et `sm` |
| `TableauJoueurs` | La feuille **transposée** : joueurs en colonnes, statistiques en lignes |
| `PlateauImpacts` / `CarteImpacts` / `PanneauImpacts` | Le plateau seul (`role="img"` nommé), le plateau avec sa légende, et les cartes côte à côte du résumé de partie |
| `TableauHonneur` / `MomentCelebratif` | Podium de résumé · bandeau de célébration |
| `CartePartie` | **Ligne de feuille** (lot `cartes-partie`), à l'Accueil et dans Parties, posée dans une `FeuillePartie` (filet 3 px `craie`, fond `ardoise`, filets 1 px `craie/22`, une feuille par période). Colonne de 56 px : `Pictogramme` 20 px `laiton-clair`, détail (501, STD, CT, 20→B, 41-170), unité (reste, pts, fl., sorties). Titre : le nom **tapé** seulement, sinon les règles en petites capitales sans le nom du jeu ; heure à droite. Joueurs **classés** (`rankPlayers`) : avatar + chiffre en rangée à 1-3, grille 2 × 2 avec noms à 4 ; partie finie : le premier (tous les ex æquo) en `laiton-clair` avec ✓, jamais à l'entraînement. Étiquettes « Abandonnée » (bordure `craie/40`) et, dans Parties, « En cours » (`laiton`). **Une seule cible** (lien `min-h-16`), corbeille sœur du lien (`actions`). Visuel `aria-hidden` + phrase `sr-only` (« Sarah gagne, 86 points ; Kevin 61 ; Julien 22 ») |
| `MiniTableauPartie` | La partie en cours de l'Accueil, seule : bordure 1 px `laiton`, tête (pictogramme 24 px, titre = nom tapé ou nom du jeu, règles, heure, état « Manche 3 », « Set 2 · manche 4 », « Dernier tour », « Sortie 8 », « En cours »), une ligne par joueur classé (avatar 28 px, nom, jauge, chiffre ; les ex æquo en tête teintés `laiton/12` et chiffre `laiton-clair`, **seulement s'il reste quelqu'un derrière eux** : au départ, tous égaux, aucune teinte), « Reprendre » 48 px, visuel de l'unique lien. Jauges : X01 carrés de manches + traits de sets (jusqu'à 5, au-delà « 3/10 »), Cricket cases, Tour du monde barre (`vert-cible` une fois bouclé), entraînement barre. `ui/cartesPartie.ts` est **le seul endroit** de l'UI qui ouvre l'union `MatchSummary` pour une carte |
| `ActionsFinDePartie` | « On remet ça » / « Changer les règles » / « Accueil » — les 4 résumés |
| `DispositionPartie` | Ossature portrait / paysage des écrans de jeu ; en paysage le pavé est **calé en bas** (`self-end`) |
| `PaveSaisie` | **Le** pavé de saisie des quatre jeux (`PaveFlechettes`, `PaveCricket`, `PaveCibles` n'en sont que de fins enrobages) : grille de cibles, rangée **Bulle · Hors · Annuler** (2 · 1 · 2 sur 5 colonnes), rail S/D/T en pleine largeur sauf au Tour du monde |
| `LayoutPrincipal` / `NavigationBasse` | Coquille des écrans hors partie. Onglet actif en `craie-vive` souligné du trait `bg-laiton`. La barre a une hauteur **fixe** (`--hauteur-nav-basse`, 3,5 rem, filet du haut compris, plus la safe-area), jamais une hauteur minimale ; le bouton « Nouvelle partie » de l'Accueil se cale en `sticky` sur **le même `calc`** (un test le vérifie). ⚠️ Compromis : avec une police système très agrandie, un libellé d'onglet serait **rogné** plutôt que de faire grandir la barre — à vérifier sur appareil réel ; repli possible : un conteneur `sticky` unique dans `LayoutPrincipal` pour la barre et le bouton |
| `Etats` | `EmptyState` · `Skeleton` · `Spinner` / `SpinnerLigne` · `MessageErreur` · `EcranErreur` |
| `LivreRegles` | Le livre ouvert (lot `regles-du-jeu`) : bouton 48 px, `BookOpen` 22 px `aria-hidden`, bordure `laiton-sombre`, icône `laiton-clair` ; **actif** (feuille ouverte) : fond `laiton`, icône `sur-laiton`. Nom accessible « Règles du <jeu> », `aria-haspopup="dialog"`, `aria-expanded`. Même mécanisme que la `Modale`, et lui seul : état dans l'historique par `useModaleAuRetour` (clé `regles`), boîte par `useDialogueNatif`, qui rend le focus au livre à la fermeture (même sans focus préalable, Safari). À droite de l'en-tête de l'étape 2 (`EnTeteEtape` `action`) et à l'extrême droite de `BandeauMatch` (prop **obligatoire** `regles`), hors `.grave` et hors capitales, en marges négatives (la rangée du bandeau reste à 40 px en portrait) |
| `FeuilleRegles` | La feuille de règles : `<dialog>` natif (`showModal`), nommé par son titre, **monté en permanence** (contenu rendu seulement ouvert), aucune classe de `display` sur le `<dialog>` (la colonne vit dans un conteneur intérieur), discipline de `useDialogueNatif` partagée avec la `Modale`. Fermée par la croix, Échap, le retour **ou un appui à côté** (voile en portrait sur le match ; partie gauche, sous un voile transparent, en paysage) — ajout hors planche, décision de l'utilisateur (Révision 1, U1). Tête en `<div>` (jamais un `<header>` dans celui du bandeau), `feutre-nuit` (pictogramme 24 px `laiton-clair`, « RÈGLES DU X01 », « TELLES QUE DARTPÉRO LES APPLIQUE », croix 48 px `chene-doux`) ; corps qui défile (`overscroll-contain`), sans bande « Défiler pour la suite » : encadré « Ce soir » (`laiton-sombre`), « 1 En bref » toujours ouverts, puis rubriques repliables numérotées dès 2 (lignes de 48 px sous un `h3`, chevron, `aria-expanded`, **toutes repliées à chaque ouverture**, plusieurs ouvrables). Blocs : liste (lignes grises = l'autre réglage), paragraphe, pastilles (`rouge-texte` ce soir, `filet` / `craie-3-regles` l'autre), tableau d'exemple, questions, `dl` des réglages (ce soir en `laiton-clair`), grille du parcours. Disposition : étape 2 pleine hauteur (paysage : côté droit, 52 %) ; match à 210 px du haut, filet craie 3 px, voile `voile` (paysage : sous le bandeau, largeur de la colonne du pavé, filet gauche 3 px, sans voile). Tokens : § Palette, feuille de règles |
| `CarteJoueur` (`composants/match/`) | Score géant, jetons de manches, volée en cours |

La géométrie du plateau — ordre des secteurs, rayons des anneaux — vit dans `geometrieCible.ts`,
partagée par `Cible` et `CarteImpacts` : **deux copies de ces rayons finiraient par ne plus se
superposer.**

⚠️ Un `<h2>` de panneau ne doit **jamais** reprendre un nom déjà porté par un `<h1>` : utiliser
`enTete=` (contenu libre) plutôt que `titre=`, sinon `getByRole('heading')` trouve deux éléments.

⚠️ **Écart connu — titre des cartes du podium en `laiton`** (lot `statistiques-podium`, U4) :
comme la planche. En thème clair, le `laiton` (`#8A6D12`) fait **4,40:1** sur `ardoise`, sous le
plancher de 4,5:1 — le même défaut que les titres de `Panneau` (constat n° 21 de l'index).
**Risque accepté par l'utilisateur.** `laiton-clair` tiendrait le plancher (7,55:1), au prix
d'un or pâle en sombre ; ne pas « corriger » sans trancher à nouveau. L'écart couvre aussi le
titre `laiton` de la `Modale` « Tout voir » (même titre, même pictogramme, sur le même `ardoise`).

⚠️ **Écart connu — zone d'appui des bascules du podium : 48 px en hauteur seulement** (lot
`statistiques-podium`, Q3 du plan de test). Le pseudo-élément déborde de 14 px au-dessus et
au-dessous ; en largeur, la puce garde celle de la planche (« F9 » ≈ 29 px). L'élargir ferait
chevaucher les puces voisines. **Écart accepté par l'utilisateur.** Il vaut aussi pour les puces
« 180 · 140+ · 100+ » de Grosses volées et pour les bascules reprises dans la `Modale`.

### Le parcours Nouvelle partie (lot `nouvelle-partie-parcours`)

Laiton unique : **aucune couleur par mode** (la planche en proposait quatre ; seul écart assumé).

- **Barre d'étapes** (`BarreEtapes`) : un trait de 3 px par étape, `1 · JEU`, `2 · JOUEURS`,
  `3 · ORDRE`. Faite : craie ; courante : laiton, `aria-current="step"` ; à venir : `craie-3` (un
  cran plus pâle de trait quand l'étape n'aura pas lieu : Ordre seul en piste). **Non interactive.**
- **Tuile de jeu** : `<ul>` 2 colonnes, un seul lien par tuile (pictogramme 40, titre, une phrase),
  `min-h` 150 px, liseré haut laiton, fond `ardoise`.
- **Fiche de réglages** (`ReglagesJeu`) : filet haut craie 3 px sur `ardoise` ; tête = pictogramme 32 +
  récap en grand (principal en `font-score`, secondaire en capitales) dans un `<output>` ; réglages en
  `ChoixSegmente` (cartes à `aria-pressed` pour le comptage du Cricket) ; ligne de règles ; dépliant
  (`aria-expanded`, replié à chaque ouverture) « Plus de réglages ». « Les règles en entier » n'existe
  plus (lot `regles-du-jeu`) : les règles complètes, sept cibles du Cricket et parcours en 21 cases
  compris, sont dans la feuille de règles, derrière le **livre** à droite du titre de l'étape 2.
- **Feuille d'ordre numérotée** : grand rang, pastille, nom, poignée ≥ 48 px ; le premier en
  `bg-laiton/10` avec liseré gauche laiton et « COMMENCE ». « Tirer au sort » : bouton secondaire ;
  la feuille rejoue `animate-monter` (court, sans rebond), coupé sous `prefers-reduced-motion`.

### La carte des impacts

⚠️ **Ce n'est pas la `Cible` décorative avec un calque par-dessus.** Sur un plateau déjà rouge,
vert, crème et noir, une couche de chaleur ne se lit pas — on ne sait plus si le rouge est la
cible ou la donnée. Le plateau est donc réduit à sa **structure** (des cases, des fils, vingt
numéros) et **la seule couleur de l'image est la donnée**. C'est la feuille de match appliquée
à un graphique ; un dégradé d'opacité piloté par les données n'est pas le « zéro dégradé » de la
charte, c'est de la donnée.

- **L'échelle est relative à chaque joueur** : la case la plus touchée est toujours à fond. On
  compare des **formes** (« je dérive vers le 5 »), pas des volumes.
- **Chaque case allumée est cernée du fond** : les fils de craie s'effacent sous le laiton, et
  quinze secteurs voisins à la même intensité fusionnaient en un disque doré.
- **La `viewBox` déborde de 4 unités** : les numéros vivent à 48,6 du centre, donc le haut du
  « 20 » sortait d'une `viewBox` calée à 100.
- **Deux emplois, deux choix** (lot `statistiques-podium`). Au **résumé de partie**, les cartes
  restent côte à côte (`PanneauImpacts`) : « lui il vise, moi j'arrose » se voit d'un coup. Dans
  **Statistiques**, une seule cible en grand (`PlateauImpacts`, bornée à `max-w-sm`) derrière
  des onglets de joueurs, puis une rangée de cases : les trois zones favorites (« S20 / 160 fois »,
  la bulle en toutes lettres : « Bulle 25 », « Bulle 50 ») et le hors cible (`craie`). La
  comparaison y est portée par les cartes du podium. Le sélecteur ne pilote **que** la cible ;
  le dernier joueur consulté est mémorisé (`statistiques:joueur`, cité par la politique).

---

## Mouvement

Tokens `--animate-*` du `@theme`, keyframes au niveau racine. Court, sec, **sans rebond** (aucun
paramètre de courbe > 1) : le mouvement crée la présence (qui joue, bust, score qui change), pas
le bruit. Durées : `--duration-vif` 100 ms, `--duration-normal` 180 ms, `--duration-lent`
240 ms ; courbe `--ease-sec` (`cubic-bezier(0.2, 0, 0, 1)`, décélération).

| Animation | Durée | Rôle |
| --------- | ----- | ---- |
| `pop-score` | 200 ms | Le score qui change : `scale(1.06)` → 1, sans rebond |
| `secousse` | 260 ms | Bust — trois allers-retours de 4 px |
| `monter` | 240 ms | Entrée d'élément ; l'ouverture de la feuille de règles |
| `craie` | 240 ms | Texte qui s'écrit (flou → net) |
| `tour-logo` | 1,2 s, une fois | La cible de l'accueil fait un tour puis se pose |
| `trace-filet` | 360 ms | Fin de manche / de partie : un filet de 2 px se trace de gauche à droite (`clip-path`), `vert-cible` partout (`MomentCelebratif` et `TableauHonneur`) — ni dégradé ni halo |
| `defiler` | 1,4 s ∞ | Balayage de chargement (état d'attente) |

Deux mouvements ne sont pas des `@keyframes` mais des **transitions** (lot `match-x01`) :

| Transition | Durée | Rôle |
| ---------- | ----- | ---- |
| **Repère qui glisse** (`.repere-lancer`) | `--duration-lent`, `--ease-sec` | Dans les trois jeux, quand la main passe, le filet de laiton **glisse** d'une ligne à l'autre (`translateY(index × 100 %)`) au lieu de s'éteindre ici et de s'allumer là. Un seul élément `aria-hidden` ; `aria-current` reste l'état accessible. Exige des lignes de **hauteur strictement égale** : la grille `1fr` de `FeuilleMatch` le garantit, et chaque jeu fixe la même hauteur minimale à toutes ses lignes |
| **Fondu du filet** (`.touche-armee`) | `--duration-normal`, `--ease-sec` | Au retour à Simple, le filet de laiton et le fond Triple s'effacent en fondu (`border-color`, `box-shadow`, `background-color`). La bordure reste à **1 px** (jamais de `border-width`, non animable, qui décalerait la touche) : le 2ᵉ pixel est un anneau `inset 0 0 0 1px` en première couche de `box-shadow`, transparent au repos, pour que l'ombre fonde au lieu de basculer. **L'inversion de l'appui reste à 90 ms** : c'est l'état d'arrivée qui choisit la durée (`:active` → 90 ms, retour → `--duration-normal`). Le curseur du rail garde son glissement |

Le chevron d'une rubrique de la feuille de règles tourne de 90° en 150 ms (`motion-safe:`), comme
celui du dépliant « Plus de réglages ».

Supprimées : `eclat` (remplacé par `trace-filet`), `tourner-lent` (boucle de 120 s) et
`respirer` (le badge du Tour du monde est fixe).

⚠️ `prefers-reduced-motion: reduce` coupe **tout** (animations + transitions). Le bloc vit
**hors de toute `@layer`** : le CSS sans couche l'emporte sur n'importe quelle couche, donc il
neutralise les `animate-*` de Tailwind (couche `utilities`) **sans un seul `!important`** — que
Biome refuse par ailleurs.

---

## Écran de match — disposition imposée

Deux zones nettement séparées, parce qu'on lit à 3 m et qu'on tape à 30 cm :

```
┌──────────────────────────────────┐
│ ← ◔ X01           MANCHE 2  [▯▯] │  bandeau de match X01 : pictogramme, titre,
│     501 · PREMIER À 2 MANCHES    │  sous-titre, DI / DO dessous ; manche (et set), puis le livre des règles
│     Dimanche soir                │  nom de la partie : ligne à part, tronquée (masquée en paysage)
├──────────────────────────────────┤
│ JOUEUR          │ VOLÉE │  RESTE │  en-têtes EN INVERSION (craie pleine)
│▌■ KEVIN         │  140  │    361 │  ZONE LECTURE — une ligne par joueur
│  T20  T20  S20  │moy 140│  ‖ 3 f │  ▌ = filet de laiton : c'est son tour
│ ■ JULIEN        │   83  │    418 │  ■ = carré à la couleur du profil
│  T19  S19  S7   │moy 83 │  ‖ 3 f │  fléchettes écrites sur leur ligne
│ ⌖ SORTIE   T20   T7   D20        │  dernière ligne, filet vert, ≤ 170 (180 en sortie libre)
├──────────────────────────────────┤
│   1⁶⁰ 2  3  4  5                 │  ZONE SAISIE
│   6  7  8  9 10                  │  cibles ≥ 48 px
│  11 12 13 14 15                  │  valeur réelle en exposant hors simple
│  16 17 18 19 20                  │
│  [ BULLE ²⁵ ][HORS][↶ ANNULER]   │  rangée commune aux 4 jeux : 2 · 1 · 2 colonnes
│  [SIMPLE][DOUBLE][TRIPLE]        │  rail pleine largeur ; retombe sur SIMPLE
└──────────────────────────────────┘             après chaque fléchette (absent au Tour du monde)
```

### Règles de layout

- **Une ligne par joueur, toujours** — pas de grille, pas de disposition alternative. Seule
  l'**échelle** du reste suit le nombre de joueurs, et elle dépend de l'orientation :

  | Joueurs | Portrait | Paysage |
  | ------- | -------- | ------- |
  | 1-2 | `text-score-xl-portrait` (**4,5 rem**) | `text-score-xl` (4,25 rem) |
  | 3 | `text-score-l-portrait` (4,05 rem) | `text-score-l` (3,25 rem) |
  | 4 | `text-score-m-portrait` (3,1 rem) | `text-score-m` (2,5 rem) |

  ⚠️ **4,5 rem et non 5,1 rem au premier palier** (la maquette l'agrandissait de 25 %, mais ne
  montrait que trois joueurs). Oswald 700 met « 301 » à **120,7 px à 5,1 rem**. **La colonne RESTE
  fait 132 px en portrait (`8.25rem`) et 108 px en paysage** (`GRILLE_LIGNE`, variante `paysage:`) :
  à 108 px, « 600 », « 606 », « 666 » et « 688 » étaient rognés de 1,5 à 3,6 px par le bord de la
  feuille. Les 24 px pris à JOUEUR (148 → 124 px en portrait) ne coûtent rien : les cases de
  fléchettes passent en `gap-1` (« BULL » tient, 30,7 px de case pour 29,4) et « JULIEN » reste
  entier, y compris sur la ligne du vainqueur avec son pictogramme. Mesuré au navigateur, 4,5 rem :
  « 600 » 120,1 px, « 606 » 119,2, « 666 » 118,4, « 206 » 117,5, « 688 » 115,9, « 501 » 106,1,
  « 701 » 101,1 — au moins **5,4 px d'air** de chaque côté entre les filets. Les paliers 4,05 et
  3,1 rem tiennent sans souci. En paysage, JOUEUR vit déjà large : la colonne n'a pas bougé.
- **Le reste du joueur qui ne lance pas est en `craie`**, celui du joueur actif en `craie-vive`
  (avec `trace-craie`) : l'œil va au repère, pas à toute la colonne. Le vainqueur garde la
  `craie-vive`.
- **Le repère de celui qui lance glisse** (`.repere-lancer`, voir § Mouvement) : un seul élément
  derrière les lignes, qui prend leur hauteur égale (`1fr`).
- **La zone de lecture est collée en haut** (plus de `justify-center` dans `DispositionPartie`),
  pour les quatre modes : le vide éventuel tombe entre la feuille et le pavé.
- Les trois dernières colonnes sont à **largeur fixe** : `GRILLE_LIGNE` est exportée par
  `LigneJoueur` et consommée par la ligne d'en-têtes — **une seule définition de colonnes**,
  donc aucun désalignement possible. C'est en alignant les chiffres d'une ligne à l'autre qu'on
  les compare, et il faut pour ça que les colonnes existent vraiment.
- **Les manches se comptent en bâtons** (`Batons`) : à trois mètres l'œil reconnaît un paquet de
  cinq sans compter, là où il devait dénombrer des losanges. Les bâtons **acquis** sont pleins ;
  ceux qui **restent** sont en **tirets** de craie à 55 % (`border-dashed border-craie/55`, 2 px —
  le trait barré compris) : l'ancien trait à 25 % disparaissait à 3 m.
- **Le bandeau X01** (`EnTeteManche`) : flèche de retour · pictogramme `x01` (**24 px**,
  `text-laiton-clair`, `aria-hidden`) · titre « X01 » (Oswald gras, majuscules) · sous-titre
  « 501 · premier à 2 manches » (`text-etiquette`, `text-craie-2`) · DI / DO **sous le
  sous-titre** · à droite « Manche N », et « Set M » dessous quand il y a des sets, en **craie**
  (`text-craie-2`, petites capitales) : le laiton ne reste qu'au repère et au rail. En **paysage**
  le bloc central tient sur **une rangée** (pictogramme, titre, sous-titre, DI, DO) et « Manche N
  · Set M » à droite sur la même hauteur. Mesuré (Chrome, 390 × 844 / 844 × 390, hors zone de
  sécurité) : **portrait 73 → 87 px**, **paysage 65 → 49 px** (la ligne du nom y disparaît). Depuis
  le lot `feuille-commune`, ce bandeau est un composant commun (`BandeauMatch`) : le Cricket, le
  Tour du monde et l'entraînement l'adoptent, avec leur pictogramme. Depuis le lot `regles-du-jeu`,
  le livre (`LivreRegles`) ferme la rangée à droite : rangée en `gap-2` en portrait (`gap-3` en
  paysage), livre en marges négatives `-my-1 -mr-1 paysage:-mb-0.5` ; bandeau paysage 49 → 51 px.
- **Les fléchettes sont écrites sur une ligne** (`.ligne-saisie`), comme au stylo — et non dans
  des pastilles. Les trois emplacements restent **toujours présents** : c'est ce qui garde
  l'alignement d'une ligne à l'autre.
- **La suggestion de sortie est la dernière ligne de la feuille**, filet vert, cibles alignées
  sous les colonnes de fléchettes. Elle ne flotte plus au-dessus du tableau.
- **Portrait** par défaut. **Paysage** (téléphone couché) : lecture à gauche, pavé à droite —
  porté par `DispositionPartie` pour les quatre modes.
- **Le nom de la partie** (lot `nom-de-partie`) occupe sa propre ligne sous la rangée du bandeau,
  dans le même `<header>` (`h-4 truncate pl-11 text-craie-3` : 44 px = flèche de retour de 40 px tirée de 4 px (`-ml-1`) + écart portrait `gap-2`, hauteur réservée même vide, prop obligatoire `nomPartie` de `DispositionPartie`) —
  **masquée en paysage** (`paysage:hidden`, lot `match-x01`) :
  lu à 30 cm, il ne prend rien à la zone de lecture et ne pousse pas le bandeau. Forme
  **à confirmer à la relecture à l'écran** (D5), cas le plus serré : X01 en sets, double in et
  double out, téléphone peu haut.
- ⚠️ Variante `paysage` : `@media (orientation: landscape) and (max-height: 34rem)` —
  conditionnée à la **hauteur** autant qu'à l'orientation. Ce qui manque au téléphone couché,
  c'est la hauteur, pas la largeur : une tablette et un navigateur de bureau gardent la
  disposition normale.
- Les pavés se **compactent** en paysage (`paysage:` sur les hauteurs et les tailles), mais les
  cibles restent **≥ 48 px** : c'est un plancher, pas une variable d'ajustement. Ce qui cède :
  la ligne du nom, les espacements des pavés (`gap-1`), le padding du rail S/D/T (`--rail-p`,
  0,125 rem : le curseur en suit la valeur) et le padding vertical des lignes du tableau
  (`py-2`, `py-1` à quatre joueurs). Mesuré en 844 × 390 : plus aucun défilement à 2, 3 ou 4
  joueurs au X01 (409 → 390 px de page à deux ; 440 → 390 à quatre), au Cricket, à l'entraînement
  et au Tour du monde à quatre (501 → 390).
- Barre de navigation basse : **absente** pendant une partie et sur toutes les étapes de Nouvelle
  partie (jeu, joueurs et réglages, ordre de jeu, sélection de joueurs).

### La feuille commune aux trois jeux (lot `feuille-commune`)

X01, Cricket et Tour du monde se lisent de la même façon : `FeuilleMatch` (cadre de craie, en-têtes
inversés `aria-hidden`, un filet par ligne, repère unique), `NomJoueurFeuille` (carré de 12 px à la
couleur du profil — jamais le liseré de la maquette —, nom en Oswald gras, `craie-2` au repos,
`craie-vive` pour qui lance), `CasesVolee` (les trois fléchettes sur leur ligne, libellé de
`Dart.label`, **jamais grisées** : une fléchette qui n'avance pas se lit quand même), `BandeauMatch`.

- **Hauteur des lignes** (minimum, la même pour toutes) — Cricket : 88 px à 2 joueurs, 62 à 3, 54
  à 4, 50 en paysage ; Tour du monde : 104 / 88 / 80 px, 62 en paysage. Nom à 16 px, 15 px dès
  3 joueurs (`text-nom-serre`) ; au Cricket toujours 15 px pour que « MAXENCE » tienne.
- **Cricket** : colonnes JOUEUR (6,25 rem, 7,5 en paysage) · sept cibles · PTS (4 rem, 4,5 en
  paysage), `--nb-cibles` venu de la config ; un filet de colonne **seulement** avant la première
  cible et avant PTS. Marques à **28 px** (26 à quatre joueurs), cible fermée en `laiton`,
  en cours en `craie-vive`, **morte** (fermée par tous) en `craie-decor` sur une colonne à 30 %
  d'opacité, en-tête barré. PTS 36 px (30 à 4 joueurs et en paysage). En-tête « Pts ↓ » en
  cut-throat. **Dernière ligne « VOLÉE · NOM »** (hors de la grille des lignes) : la volée en
  cours, sinon celle du joueur précédent avec son nom, trois cases de 48 px poussées à droite,
  44 px de haut (40 en paysage). Bandeau : « Standard · 7 cibles » ; à droite « Ferme + mène » ou
  « Le plus bas / gagne » (deux lignes), **sans cadre**.
- **Tour du monde** : JOUEUR (nom + volée sous le nom) · PARCOURS 6,5 rem (« 20/21 », barre de
  8 px en laiton puis `vert-cible` une fois bouclé, « N fléchettes » en `craie-3`) · CIBLE 7 rem, le
  chiffre à droite comme le RESTE du X01 : 4,5 rem jusqu'à 2 joueurs, 4,05 rem à 3 et 4, 3,25 rem
  en paysage ; la bulle en glyphe plein + « BULLE ». « Dernier tour » : badge sans fond, au style de
  DI / DO.
- **Mesuré** (Chrome, 390 × 844 et 844 × 390, sombre et clair) : plus aucun défilement (page = 844
  ou 390) à 2, 3 et 4 joueurs dans les trois jeux ; le Tour du monde à quatre joueurs tient
  (865 → 844 px) ; touches ≥ 48 px ; « MAXENCE » entier, 7 px d'air au plus serré (Cricket).

### Saisie

- Bascule S/D/T **momentanée** : elle retombe sur Simple après chaque fléchette. Un
  multiplicateur resté armé sans qu'on le voie compte trois T20 là où il y avait trois simples —
  un clic de plus par triple coûte moins cher qu'un score faux.
- **Un seul pavé, `PaveSaisie`, pour les quatre jeux** (lot `pave-unifie`) : mêmes mots, mêmes
  tailles, Annuler au même endroit — la mémoire musculaire ne change pas d'un jeu à l'autre.
  De haut en bas : la grille des cibles (5 × 4 au X01, à l'entraînement et au Tour du monde ; 3 × 2
  au Cricket, dans l'ordre de la feuille), la rangée **Bulle · Hors · Annuler** (`grid-cols-5` :
  2 · 1 · 2 colonnes — les x et largeurs viennent de ce seul conteneur, identiques par construction),
  puis le rail Simple / Double / Triple en **pleine largeur** (segments ≈ 118 px, même dessin).
  Au Tour du monde, sans rail, la rangée est la dernière : Annuler y est **64 px plus bas**
  qu'ailleurs, accepté.
- **Tailles** : touches `min-h-[3.25rem]` (52 px), `paysage:min-h-12` (48) ; chiffres 20 px
  (`text-xl`, 18 px en paysage) ; **mots** (Bulle, Hors) en 16 px majuscules, interlettrage 0,1 em ;
  **Annuler en 12 px** (`text-etiquette`) majuscules, icône 16 px, `craie`. Écarts de 6 px (4 en
  paysage). La Bulle garde son rouge ; « Hors » est en `craie-3`.
- **Bulle** (plus de touche « 25 », plus de touche « Bull » séparée) : `BULL_SIMPLE` en Simple,
  `BULL_DOUBLE` en Double, **grisée** en Triple (opacité des `disabled`, sans trait) plutôt que de
  refuser le coup après l'avoir accepté. Exposant : « 25 » en `craie-3` en Simple (X01,
  entraînement), « 50 » en laiton en Double ; au Cricket « ×2 » en laiton, rien en Simple.
- **Hors** : `MISS`, ignore le multiplicateur (un miss n'a ni double ni triple), ni filet ni exposant ;
  Annuler non plus.
- **L'appui s'inverse lisiblement** (fond `craie`, texte et exposant `feutre`) sur toutes les
  touches, Bulle, Hors et Annuler comprises : 14,7:1 en sombre, 10,25:1 en clair. Seule la couleur
  change, l'enfoncement (2 px) et sa durée (90 ms) sont ceux d'avant. Voir `.touche` plus haut.
- **En paysage le pavé est calé en bas** (`paysage:self-end`) : Annuler garde sa place d'un jeu à
  l'autre, que la feuille soit haute ou basse.
- **Tour du monde, sans « S »** : les cases de volée écrivent « 17 · 16 » et Annuler « Annuler 16 »
  (`libelleFlechetteTourDuMonde`, `labels.ts`, via le prop `libelle` de `CasesVolee`). C'est un
  libellé d'affichage de ce mode : `Dart.label` reste « S17 » et les autres jeux l'emploient.
- Valeur réelle en exposant hors simple (le « 20 » porte un « 60 » en mode triple) — badge
  `aria-hidden` en `text-multiplicateur` (0,8 rem, `exposant-touche`), le nom accessible du
  bouton reste « 20 ».
- **Le multiplicateur armé est gradué** (X01, entraînement **et Cricket**) : la `<section>` du pavé
  porte `data-multiplicateur="simple|double|triple"` (absent au Tour du monde) et les cibles et la
  Bulle (classe `touche-armee`, ni « Hors » ni « Annuler ») changent d'état. **Double** : filet de laiton de 2 px (bordure 1 px + anneau intérieur 1 px) et tranche de
  `laiton-sombre`. **Triple** : le même, **plus** un fond teinté par le token `--teinte-triple`
  (laiton 22 % en sombre, 14 % en clair, valeur claire sous `html[data-theme="clair"]`).
  Contraste de `craie-vive` sur le fond composé du Triple : **12,1:1 en sombre, 11,4:1 en clair**
  (≥ 4,5:1) ; l'exposant `laiton-clair` y tient 8,9:1 / 4,5:1. Au retour à Simple, le filet
  **fond** (voir § Mouvement). La Bulle grisée en Triple garde son `opacity` : c'est une règle. Le
  filet de laiton de l'état armé se pose **sur** le fond rouge de la Bulle.
- ⚠️ **Le pavé ne se grise jamais pendant l'écriture d'une volée** (il clignotait à la 3ᵉ
  fléchette). La garde reste dans les hooks (`if (occupe) return`) : un appui pendant l'écriture
  n'enregistre rien. Seules désactivations visuelles : la Bulle en Triple, « Annuler » sans rien à
  annuler.
- Le pavé du **Cricket** n'a que les sept cibles (six numéros + la Bulle) ; celui du **Tour du
  monde** n'a pas de bascule S/D/T (elle ne changerait rien, et un contrôle sans effet induit en
  erreur).
- ⚠️ **Le bouton « Annuler » a deux étiquettes** : `libelleAnnulation` rend un
  `{ court, complet }` — le court s'affiche (« Annuler T20 »), le complet est le nom accessible
  (« Annuler la volée de Julien »). Le court étant contenu mot pour mot dans le complet, la
  règle « label in name » (WCAG 2.5.3) tient.

---

## Focus, sélection, tactile

| Élément | Règle |
| ------- | ----- |
| `:focus-visible` | Contour `laiton` 2 px, offset 2 px — sauf les onglets de `NavigationBasse` : offset **−2 px** (anneau intérieur), car la barre coupe ce qui déborde |
| `::selection` | Fond laiton semi-transparent, texte `craie-vive` |
| Body | `touch-action: manipulation`, pas de tap-highlight bleu, pas d'overscroll vertical |
| Contrôles natifs | `color-scheme` suit le thème — sinon une barre de défilement blanche longe une page en feutre |

---

## Ce qu'il ne faut pas faire

1. Poser du bois / laiton / grain **derrière un chiffre de score**.
2. Utiliser un hex hors `index.css` / `couleurs.ts` — **et en particulier une teinte dans un
   `style=` inline** : elle ne suivrait pas le thème. Ni une teinte « par jeu » : le laiton est le
   seul accent.
3. Descendre sous `craie-3` pour du texte utile, ou écrire un texte en alpha (`text-craie/NN`).
4. Remettre un rayon dans les tokens `--radius-*` (ou une classe `rounded-*` dans `src/ui`).
5. Créer une variante de bouton / panneau ad hoc hors des composants communs.
6. Laisser une icône lucide sans `aria-hidden`.
7. Mettre Alfa Slab One ailleurs que sur l'enseigne / le vainqueur.
8. Conditionner le paysage à la seule `orientation` (oublier `max-height`).
9. Afficher la barre de navigation pendant une partie.
10. Écrire une couleur **uniquement** dans le bloc `html[data-theme="clair"]` : un token doit
    toujours avoir sa valeur sombre dans `@theme`.

---

## Vérifier à l'écran, pas seulement au vert des tests

Trois lots de suite ont trouvé des défauts qu'**aucune requête par rôle ne peut voir** : une
feuille qui flottait en haut d'une zone vide, un « 20 » rogné en haut de chaque plateau, deux
touches restées bordées de vert et de marron, des badges d'ordre de passage qui survivaient au
tirage au sort, une ligne d'aide tronquée.

La relecture se fait sur captures (Chrome piloté par `playwright-core`, **390 × 844**, base semée
directement dans IndexedDB). Les captures du README sont produites de cette façon —
`docs/captures/`.

⚠️ **`Cible` a un défaut latent connu** : `fontSize` 4,6 à un rayon de 48,6, comme `CarteImpacts`
avant correction. Invisible tant qu'elle reste à 12 % d'opacité sur l'accueil, **à corriger si
elle sert un jour en grand**.

---

## Fichiers de référence

| Fichier | Contenu |
| ------- | ------- |
| `src/index.css` | Tokens, thème clair, matières, animations, `prefers-reduced-motion` |
| `src/ui/theme.ts` | `sombre` / `clair` / `systeme` — le seul écrivain de `data-theme` |
| `src/ui/couleurs.ts` | Palette joueurs → pixels |
| `src/ui/labels.ts` | Tout le français, annonces vocales comprises |
| `src/ui/composants/commun/` | Design system React |
| `src/ui/composants/commun/Pictogramme.tsx` | Les douze pictogrammes maison (tracés fixes, grille 24) |
| `scripts/icon.svg` | Source de l'icône PWA |
| `../CLAUDE.md` | Résumé opérationnel + décisions structurantes |
