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

⚠️ **Zéro dégradé de décor, zéro biseau, zéro angle arrondi.**

### Contexte d'usage (dicte tout le design)

Le téléphone est **posé** — contre un mur, sur une table, sur une étagère — pendant que
plusieurs joueurs se relaient à l'oche. Un joueur tape les scores à 30 cm, les autres lisent le
tableau à **2–3 mètres**. Souvent dans un garage ou une cave mal éclairés, **sans réseau**.

→ **Lisibilité à distance** et **zéro friction au démarrage** priment sur tout le reste.

### Les trois planchers

| Plancher | Règle | Pourquoi |
| -------- | ----- | -------- |
| Lisibilité | Aucun texte sous **`craie/60`** | Garage mal éclairé + téléphone en luminosité basse |
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
| Icônes UI | **lucide-react**, toujours en `aria-hidden` — elles n'entrent jamais dans le nom accessible. En v1, `Home` s'appelle **`House`**. |

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
| **Chiffres du tableau** | `craie-vive` | `#FFFFFF` | `#0C1512` | Scores géants |
| Texte sur laiton | `sur-laiton` | `#1A1206` | `#FBF7EC` | Étiquette d'un bouton primaire |
| Alerte / bust | `rouge-cible` | `#C1272D` | `#A81F25` | Bust, danger |
| Succès / sortie | `vert-cible` | `#2E7D4F` | `#1F6B41` | Ligne de sortie, leg gagné |

Nuances (`feutre-nuit`, `ardoise-claire`, `chene-clair`, `chene-sombre`, `laiton-clair`,
`laiton-sombre`) : elles servent aux tranches et aux fonds d'appui, plus à modeler des reliefs.

⚠️ **Le point critique du thème clair, c'est le laiton.** Le laiton vif fait **1,84:1** sur du
papier : le filet de `.au-lancer`, qui dit **qui est en train de lancer**, y deviendrait
invisible — l'information la plus lue de l'app. Il passe donc en laiton foncé (4,4:1), et
`laiton-clair` y veut dire « plus lisible sur le fond », donc **plus foncé** (6,6:1). C'est le
**rôle** qui s'inverse, pas la teinte.

### Ce qui n'est pas une couleur

Déclarés hors de `@theme` (qui ne fabrique que des utilitaires), et redéfinis eux aussi en
thème clair : `--tapis-image` (le fond), `--teinte-relief` (le filet de `.grave` : noir sous de
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

### Accent par mode

Le laiton reste la couleur de l'**app**. Chaque mode pose une teinte secondaire sur la ligne du
joueur actif, le titre du bandeau et les pastilles de sélection — jamais derrière un chiffre.

| Mode | Accent | Sombre | Clair |
| ---- | ------ | ------ | ----- |
| X01 | Laiton | `#C9A227` | `#8A6D12` |
| Tour du monde | Lagon | `#2C6E9B` | `#245A80` |
| Cricket | Cuivre | `#C1720F` | `#9A5A0B` |
| Entraînement | Prune | `#8A4FA8` | `#6E3C87` |

⚠️ **Les teintes ne vivent pas dans `accents.ts` mais dans `index.css`**, en `--accent-*`.
`accents.ts` n'en distribue que des `var()`, parce que ces valeurs partent dans un `style=`
inline **qu'aucune règle CSS ne peut retourner** : codées en dur, le jaune du X01 rendrait le
filet « c'est ton tour » invisible en thème clair. Un `var()` se résout au rendu, donc dans le
bon thème.

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

| Classe | Effet |
| ------ | ----- |
| `.chiffres` | Oswald + `tabular-nums` — les chiffres ne dansent pas quand le score change |
| `.trace-craie` | Souffle de craie sous les grands chiffres (**disparaît en thème clair**) |
| `.grave` | Filet de relief sous les petits textes |

---

## Le vocabulaire de la feuille

Classes de `@layer components` dans `src/index.css`. **Aucune image bitmap** : tout est CSS ou
SVG inline.

| Classe | Effet | Où |
| ------ | ----- | --- |
| `.feutre-tapis` | Le sol : `--tapis-image` + grain | Fond d'écran |
| **`.feuille`** | Le conteneur : ardoise cerclée d'un filet de craie de 3 px | Tableau de match, panneaux de résumé |
| **`.bandeau-feuille`** | En-tête **en inversion** : craie pleine, texte sombre | En-têtes de colonnes uniquement |
| **`.bandeau-match`** | Bandeau de partie, sombre, refermé par un filet de 3 px | Haut des écrans de jeu |
| **`.bandeau-bas`** | La barre de navigation | `NavigationBasse` |
| **`.entete-colonne`** | Libellé de colonne | Ligne d'en-têtes |
| `.ligne-tableau` | Une ligne : un filet, rien d'autre | Lignes de score |
| **`.au-lancer`** | Filet de laiton **dans** la marge + voile | Le joueur dont c'est le tour |
| **`.filet-colonne`** | Séparateur vertical | Entre deux colonnes |
| **`.ligne-saisie`** | La ligne sur laquelle une fléchette est « écrite » | Volée en cours |
| `.cadre-bois` | Encadrement plat | Chrome rare |
| `.ardoise-craie` | Panneau | Surfaces secondaires |
| `.laiton-poli` | Laiton **plein et plat**, tranche franche de 4 px | CTA primaire |
| `.laiton-plat` | Laiton sans tranche | Curseurs, pastilles, S/D/T |
| `.touche` | Filet de craie, tranche de 2 px, **s'inverse à l'appui** | Pavé de saisie |
| `.filet-laiton` | Séparateur horizontal discret | Entre zones |
| `.chargement-balai` | Lueur qui balaie | Skeletons |

⚠️ **`.bois-veine` et l'animation `halo` ont été supprimées.** Le veinage tirait l'œil vers le
décor, et **une fiche ne rayonne pas** — un `box-shadow` animé en continu coûtait en plus un
repaint par image sur un vieux téléphone. Le joueur au lancer se signale par `.au-lancer`.

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

- **`MomentCelebratif`** : bandeau vert éphémère (leg / set / sortie / tour bouclé / cible
  fermée), `pointer-events-none`, ~2,2 s.
- **`TableauHonneur`** : le podium des résumés (avatar, couronne, phrase d'ambiance), à l'accent
  du mode. Phrase tirée de `phraseVictoire(matchId)` — **déterministe**, pas de `Math.random`.

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
| `Batons` | Les legs comptés en bâtons, quatre traits barrés par un cinquième |
| `ChoixSegmente` | Le rail à curseur de laiton · tailles `md` et `sm` |
| `TableauJoueurs` | La feuille **transposée** : joueurs en colonnes, statistiques en lignes |
| `CarteImpacts` / `PanneauImpacts` | La carte de chaleur du plateau, et les cartes côte à côte |
| `TableauHonneur` / `MomentCelebratif` | Podium de résumé · bandeau de célébration |
| `ApercuPartie` | **Le seul endroit** de l'UI qui ouvre l'union `MatchSummary` |
| `ActionsFinDePartie` | « On remet ça » / « Changer les règles » / « Accueil » — les 4 résumés |
| `DispositionPartie` | Ossature portrait / paysage des écrans de jeu, et l'accent du mode |
| `LayoutPrincipal` / `NavigationBasse` | Coquille des écrans hors partie |
| `Etats` | `EmptyState` · `Skeleton` · `Spinner` / `SpinnerLigne` · `MessageErreur` · `EcranErreur` |
| `CarteJoueur` (`composants/match/`) | Score géant, jetons de legs, volée en cours |

La géométrie du plateau — ordre des secteurs, rayons des anneaux — vit dans `geometrieCible.ts`,
partagée par `Cible` et `CarteImpacts` : **deux copies de ces rayons finiraient par ne plus se
superposer.**

⚠️ Un `<h2>` de panneau ne doit **jamais** reprendre un nom déjà porté par un `<h1>` : utiliser
`enTete=` (contenu libre) plutôt que `titre=`, sinon `getByRole('heading')` trouve deux éléments.

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

---

## Mouvement

Tokens `--animate-*` du `@theme`, keyframes au niveau racine. Généreux mais **ciblé** : le
mouvement crée la présence (qui joue, bust, score qui change), pas le bruit.

| Animation | Durée | Rôle |
| --------- | ----- | ---- |
| `pop-score` | 360 ms | Le score qui change (lisible depuis l'oche) |
| `secousse` | 440 ms | Bust — la ligne encaisse le coup |
| `monter` | 280 ms | Entrée d'élément |
| `craie` | 340 ms | Texte qui s'écrit (flou → net) |
| `eclat` | 900 ms | Sortie réussie |
| `tourner-lent` | 120 s ∞ | La cible de l'accueil |
| `respirer` | 3,4 s ∞ | Pulsation douce |
| `defiler` | 1,4 s ∞ | Balayage de chargement |

⚠️ `prefers-reduced-motion: reduce` coupe **tout** (animations + transitions). Le bloc vit
**hors de toute `@layer`** : le CSS sans couche l'emporte sur n'importe quelle couche, donc il
neutralise les `animate-*` de Tailwind (couche `utilities`) **sans un seul `!important`** — que
Biome refuse par ailleurs.

---

## Écran de match — disposition imposée

Deux zones nettement séparées, parce qu'on lit à 3 m et qu'on tape à 30 cm :

```
┌──────────────────────────────────┐
│ ← LEG 2 | 501 · PREMIER À 2 [DO] │  bandeau de match
├──────────────────────────────────┤
│ JOUEUR          │ VOLÉE │  RESTE │  en-têtes EN INVERSION (craie pleine)
│▌■ KEVIN         │  140  │    361 │  ZONE LECTURE — une ligne par joueur
│  T20  T20  S20  │moy 140│  ‖ 3 f │  ▌ = filet de laiton : c'est son tour
│ ■ JULIEN        │   83  │    418 │  ■ = carré à la couleur du profil
│  T19  S19  S7   │moy 83 │  ‖ 3 f │  fléchettes écrites sur leur ligne
│ ⌖ SORTIE   T20   T7   D20        │  dernière ligne, filet vert, ≤ 170
├──────────────────────────────────┤
│   1⁶⁰ 2  3  4  5                 │  ZONE SAISIE
│   6  7  8  9 10                  │  cibles ≥ 48 px
│  11 12 13 14 15                  │  valeur réelle en exposant hors simple
│  16 17 18 19 20                  │
│  [25] [0] [   ↶ Annuler   ]      │  pas de touche BULL : c'est DOUBLE + 25
│  [SIMPLE][DOUBLE][TRIPLE]        │  rangée du pouce ; retombe sur SIMPLE
└──────────────────────────────────┘             après chaque fléchette
```

### Règles de layout

- **Une ligne par joueur, toujours** — pas de grille, pas de disposition alternative. Seule
  l'**échelle** du reste suit le nombre de joueurs : 2 → `4.25rem`, 3 → `3.25rem`,
  4 → `2.5rem`.
- Les deux dernières colonnes sont à **largeur fixe** : `GRILLE_LIGNE` est exportée par
  `LigneJoueur` et consommée par la ligne d'en-têtes — **une seule définition de colonnes**,
  donc aucun désalignement possible. C'est en alignant les chiffres d'une ligne à l'autre qu'on
  les compare, et il faut pour ça que les colonnes existent vraiment.
- **Les legs se comptent en bâtons** (`Batons`) : à trois mètres l'œil reconnaît un paquet de
  cinq sans compter, là où il devait dénombrer des losanges.
- **Les fléchettes sont écrites sur une ligne** (`.ligne-saisie`), comme au stylo — et non dans
  des pastilles. Les trois emplacements restent **toujours présents** : c'est ce qui garde
  l'alignement d'une ligne à l'autre.
- **La suggestion de sortie est la dernière ligne de la feuille**, filet vert, cibles alignées
  sous les colonnes de fléchettes. Elle ne flotte plus au-dessus du tableau.
- **Portrait** par défaut. **Paysage** (téléphone couché) : lecture à gauche, pavé à droite —
  porté par `DispositionPartie` pour les quatre modes.
- ⚠️ Variante `paysage` : `@media (orientation: landscape) and (max-height: 34rem)` —
  conditionnée à la **hauteur** autant qu'à l'orientation. Ce qui manque au téléphone couché,
  c'est la hauteur, pas la largeur : une tablette et un navigateur de bureau gardent la
  disposition normale.
- Les pavés se **compactent** en paysage (`paysage:` sur les hauteurs et les tailles), mais les
  cibles restent **≥ 48 px** : c'est un plancher, pas une variable d'ajustement.
- Barre de navigation basse : **absente** pendant une partie et sur l'écran de configuration.

### Saisie

- Bascule S/D/T **momentanée** : elle retombe sur Simple après chaque fléchette. Un
  multiplicateur resté armé sans qu'on le voie compte trois T20 là où il y avait trois simples —
  un clic de plus par triple coûte moins cher qu'un score faux.
- Touche `25` = segment `BULL` ; **pas de touche « Bull » séparée** (le bullseye, c'est
  `DOUBLE` + `25`). En `TRIPLE`, la touche 25 se **grise** plutôt que de refuser le coup après
  l'avoir accepté.
- Touche `0` : ignore le multiplicateur (un miss n'a ni double ni triple).
- Valeur réelle en exposant hors simple (le « 20 » porte un « 60 » en mode triple) — badge
  `aria-hidden`, le nom accessible du bouton reste « 20 ».
- Le pavé du **Cricket** n'a que les sept cibles ; celui du **Tour du monde** n'a pas de bascule
  S/D/T (elle ne changerait rien, et un contrôle sans effet induit en erreur).
- ⚠️ **Le bouton « Annuler » a deux étiquettes** : `libelleAnnulation` rend un
  `{ court, complet }` — le court s'affiche (« Annuler T20 »), le complet est le nom accessible
  (« Annuler la volée de Julien »). Le court étant contenu mot pour mot dans le complet, la
  règle « label in name » (WCAG 2.5.3) tient.

---

## Focus, sélection, tactile

| Élément | Règle |
| ------- | ----- |
| `:focus-visible` | Contour `laiton` 2 px, offset 2 px |
| `::selection` | Fond laiton semi-transparent, texte `craie-vive` |
| Body | `touch-action: manipulation`, pas de tap-highlight bleu, pas d'overscroll vertical |
| Contrôles natifs | `color-scheme` suit le thème — sinon une barre de défilement blanche longe une page en feutre |

---

## Ce qu'il ne faut pas faire

1. Poser du bois / laiton / grain **derrière un chiffre de score**.
2. Utiliser un hex hors `index.css` / `couleurs.ts` — **et en particulier une teinte d'accent
   dans un `style=` inline** : elle ne suivrait pas le thème.
3. Descendre sous `craie/60` pour du texte utile.
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
| `src/ui/accents.ts` | L'accent de chaque mode, en `var()` |
| `src/ui/couleurs.ts` | Palette joueurs → pixels |
| `src/ui/labels.ts` | Tout le français, annonces vocales comprises |
| `src/ui/composants/commun/` | Design system React |
| `scripts/icon.svg` | Source de l'icône PWA |
| `../CLAUDE.md` | Résumé opérationnel + décisions structurantes |
