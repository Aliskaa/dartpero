# Charte graphique — Dartpéro

> Ambiance **« pub anglais / oche »**.  
> Source de vérité runtime : `src/index.css` (`@theme` + `@layer components`).  
> Ce document est le référentiel design : à consulter avant d’ajouter un écran ou un composant.

---

## Principe directeur

**Le décor est un pub, le tableau reste un tableau.**

Bois, laiton et feutre habillent le *chrome* (bordures, en-têtes, boutons, fonds). Ils ne passent **jamais** derrière un chiffre de score : les nombres lus à 3 mètres sont en craie quasi-blanche sur feutre sombre.

### Contexte d’usage (dicte tout le design)

Le téléphone est **posé** — contre un mur, sur une table, sur une étagère — pendant que plusieurs joueurs se relaient à l’oche. Un joueur tape les scores à 30 cm, les autres lisent le tableau à **2–3 mètres**. Souvent dans un garage ou une cave mal éclairés, **sans réseau**.

→ **Lisibilité à distance** et **zéro friction au démarrage** priment sur tout le reste.

### Plancher de lisibilité

Aucun texte sous **`craie/60`**. Garage mal éclairé + téléphone en luminosité basse.

### Cibles tactiles

**≥ 48 px** partout (`min-h-12`). On tape debout, une fléchette dans l’autre main.

---

## Identité

| Élément | Valeur |
| ------- | ------ |
| Nom affiché | **Dartpéro** (fléchettes + apéro) |
| Slug technique | `dartpero` |
| Icône PWA | Générée par `npm run icons` depuis `scripts/icon.svg` (cible stylisée, triple 20 en laiton, une fléchette plantée) |
| Icônes UI | **lucide-react**, toujours en `aria-hidden` — elles n’entrent jamais dans le nom accessible. En v1, `Home` s’appelle **`House`**. |

---

## Palette

Tokens `@theme` dans `src/index.css`. Utiliser les classes Tailwind (`bg-feutre`, `text-laiton`…) — jamais un hex en dur hors de ce fichier / `couleurs.ts`.

### Couleurs principales

| Rôle | Token | Hex | Usage |
| ---- | ----- | --- | ----- |
| Fond principal (tapis) | `feutre` | `#0E1A13` | Fond d’app, zone lecture |
| Surfaces (cartes, panneaux) | `ardoise` | `#16241B` | Panneaux, listes |
| Bois (bordures, cadres, en-tête) | `chene` | `#5A3E24` | Cadres, bandeaux |
| **Accent principal** | `laiton` | `#C9A227` | Joueur actif, boutons primaires, halo, focus |
| Texte courant | `craie` | `#F2E8D5` | Corps, libellés |
| **Chiffres du tableau uniquement** | `craie-vive` | `#FFFFFF` | Scores géants |
| Alerte / bust | `rouge-cible` | `#C1272D` | Bust, danger |
| Succès / checkout / leg gagné | `vert-cible` | `#2E7D4F` | Ruban de sortie, succès |

### Nuances (dégradés et matières)

Un laiton plat n’est pas du laiton : clair et sombre sont nécessaires aux dégradés.

| Token | Hex |
| ----- | --- |
| `feutre-nuit` | `#081109` |
| `ardoise-claire` | `#1E3128` |
| `chene-clair` | `#8B6238` |
| `chene-sombre` | `#2F1E10` |
| `laiton-clair` | `#F2DD93` |
| `laiton-sombre` | `#6F5410` |

### Couleurs de profil joueur

Teintes **symboliques** (domaine : `PlayerColor`), traduites en pixels uniquement dans `src/ui/couleurs.ts`. Ensemble fermé de 8 — assez distinctes à 3 mètres, sans concurrencer le laiton.

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

---

## Typographie

Polices embarquées via `@fontsource` (sous-ensemble **latin** uniquement, pour l’offline et le précache PWA).

| Token | Police | Poids | Rôle |
| ----- | ------ | ----- | ---- |
| `font-display` | **Alfa Slab One** | 400 | L’enseigne : logo « Dartpéro », nom du vainqueur. **2–3 mots max.** |
| `font-score` | **Oswald** | 500 / 700 | **Tous les chiffres du tableau**, titres de panneaux, boutons (uppercase). Condensé + `tabular-nums`. |
| `font-sans` | **Barlow** | 400 / 600 | Corps, listes, stats, libellés courants. |

### Classes typographiques

| Classe | Effet |
| ------ | ----- |
| `.chiffres` | Oswald + `tabular-nums` — les chiffres ne dansent pas quand le score change |
| `.trace-craie` | Halo de poudre sous les grands chiffres (lisibilité à distance) |
| `.grave` | Texte gravé dans le bois / l’ardoise (`text-shadow` sombre) |

---

## Matières (classes CSS)

Aucune image bitmap : tout est CSS ou SVG inline. Ces classes **habillent le chrome**, jamais un chiffre de score.

| Classe | Effet | Où |
| ------ | ----- | --- |
| `.feutre-tapis` | Dégradé + vignette + grain | Fond d’écran |
| `.cadre-bois` | Encadrement chêne (double-`background` dans la bordure) | Chrome rare (hors lignes de score) |
| `.bois-veine` | Bandeau d’en-tête veiné | Header de match, nav basse |
| `.laiton-poli` | Métal biseauté, reflet spéculaire, s’enfonce à l’appui | **CTA primaire uniquement** |
| `.laiton-plat` | Laiton sans relief | Curseurs de sélection, pastilles, S/D/T |
| `.ligne-tableau` | Ardoise + bordure légère | Lignes de score (X01, TDM, Cricket) |
| `.ardoise-craie` | Panneau ardoise | Surfaces secondaires |
| `.touche` | Touche de pavé avec épaisseur et enfoncement | Pavé de saisie |
| `.filet-laiton` | Séparateur horizontal discret | Entre zones |
| `.chargement-balai` | Lueur qui balaie (skeleton) | États de chargement |

### Règle « tableau de score » (refonte)

- **Bois / laiton poli** : chrome (bandeau match, nav, CTA). Jamais derrière un score, jamais sur chaque chip.
- **Lignes de joueur** : `.ligne-tableau` + liseré couleur — pas de `.cadre-bois`.
- **Panneaux** : ardoise + filet, sans bandeau `bois-veine` systématique.
- **Alfa Slab** : enseigne + vainqueur uniquement. Titres d’écran = Oswald (`font-score`).
- **Hiérarchie ligne X01** : (1) reste à 3 m · (2) volée à 1 m · (3) moy / fléchettes à 30 cm.

### Accent par mode

Le laiton reste la couleur de l’**app**. Chaque mode pose une teinte secondaire (`--color-accent-mode`), via `DispositionPartie` + `src/ui/accents.ts` :

| Mode | Accent | Hex |
| ---- | ------ | --- |
| X01 | Laiton | `#C9A227` |
| Tour du monde | Lagon | `#2C6E9B` |
| Cricket | Cuivre | `#C1720F` |
| Entraînement | Prune | `#8A4FA8` |

Usage : halo du joueur actif, titre du bandeau, jetons / marques / encoches de volée, cartes de sélection de mode. **Jamais** derrière un chiffre de score.

---

## Composants réutilisables

Toujours réutiliser `src/ui/composants/commun/` — **ne jamais** dupliquer une variante ad hoc.

| Composant | Rôle |
| --------- | ---- |
| `Button` | Primaire laiton / secondaire cadre bois / discret / danger · tailles `md` et `lg` |
| `Avatar` | Pastille couleur + initiales (2 lettres max) |
| `Cible` | Plateau SVG génératif (décoratif, `aria-hidden`) |
| `Enseigne` / `LogoHero` | Marque Dartpéro |
| `Panneau` | Ardoise dans cadre bois · `titre` (`<h2>`) **ou** `enTete` libre |
| `StatTile` | Tuile de statistique |
| `EmptyState` | État vide |
| `Skeleton` / `Spinner` / `SpinnerLigne` | Chargement |
| `MessageErreur` / `EcranErreur` | Erreurs |
| `DispositionPartie` | Ossature portrait / paysage des écrans de jeu |
| `CarteJoueur` (`composants/match/`) | Score géant, jetons de legs, volée en cours |

⚠️ Un `<h2>` de panneau ne doit **jamais** reprendre un nom déjà porté par un `<h1>` : utiliser `enTete=` (contenu libre) plutôt que `titre=` si besoin.

---

## Mouvement

Tokens `--animate-*` du `@theme`. Généreux mais **ciblé** : le mouvement crée la présence (qui joue, bust, score qui change), pas le bruit.

| Animation | Durée | Rôle |
| --------- | ----- | ---- |
| `pop-score` | 360 ms | Le score qui change (lisible depuis l’oche) |
| `secousse` | 440 ms | Bust — la carte encaisse le coup |
| `halo` | 2,8 s ∞ | Joueur actif qui respire |
| `monter` | 280 ms | Entrée d’élément |
| `craie` | 340 ms | Texte qui s’écrit (flou → net) |
| `eclat` | 900 ms | Sortie réussie (bandeau vert) |
| `tourner-lent` | 120 s ∞ | Cible de l’accueil |
| `respirer` | 3,4 s ∞ | Pulsation douce |
| `defiler` | 1,4 s ∞ | Balayage de chargement |

### Accessibilité mouvement

`prefers-reduced-motion: reduce` coupe **tout** (animations + transitions). Le bloc vit **hors de toute `@layer`** pour l’emporter sur les utilities Tailwind sans `!important`.

---

## Écran de match — disposition imposée

Deux zones nettement séparées (lecture à 3 m / saisie à 30 cm) :

```
┌──────────────────────────────────┐
│ ← LEG 2 | 501 · BO3 [DO] │ bandeau de chêne veiné
├──────────────────────────────────┤
│ ▌ 141 │T20│ 20│ · │ ◆◇ ➤ 6 │ ZONE LECTURE — une ligne par joueur
│ KEVIN│ 80 │ moy 58,4 │ score géant + volée + total
│ ▌ 286 │D25│ 19│ 18│ ◇◇ ➤ 6 │ liseré = couleur du profil
│ JULIEN│ 87 │ moy 94,5 │ actif = halo laiton
│ ⌖ SORTIE T20 · T11 · D24 │ ruban vert dès reste ≤ 170
├──────────────────────────────────┤
│ 1⁶⁰ 2 3 4 5 │ ZONE SAISIE
│ … │ cibles ≥ 48 px, touches en relief
│ [25] [0] [ ↶ Annuler ] │ pas de touche BULL : DOUBLE + 25
│ [SIMPLE][DOUBLE][TRIPLE] [⚡] │ rangée du pouce ; retombe sur SIMPLE
└──────────────────────────────────┘
```

### Règles de layout

- **Une ligne par joueur, toujours** — pas de grille. Seule l’échelle du score suit le nombre de joueurs : 2 → `4rem`, 3 → `3rem`, 4 → `2.5rem`.
- Colonnes à **largeur fixe** : on compare les scores en les alignant d’une ligne à l’autre.
- **Portrait** par défaut. **Paysage** (téléphone couché) : lecture à gauche, pavé à droite — porté par `DispositionPartie`.
- Variante `paysage` : `@media (orientation: landscape) and (max-height: 34rem)` — conditionnée à la **hauteur**, pas seulement à l’orientation (tablette / bureau gardent le portrait).
- Barre de navigation basse : **absente** pendant une partie et sur l’écran de configuration.

### Saisie

- Bascule S/D/T **momentanée** : retombe sur Simple après chaque fléchette.
- Touche `25` = segment `BULL` ; pas de touche « Bull » séparée. En `TRIPLE`, la touche 25 se grise.
- Touche `0` ignore le multiplicateur (un miss n’a ni double ni triple).
- Valeur réelle en exposant hors simple (le « 20 » porte un « 60 » en mode triple) — badge `aria-hidden`.

---

## Focus, sélection, tactile

| Élément | Règle |
| ------- | ----- |
| `:focus-visible` | Contour `laiton` 2 px, offset 2 px |
| `::selection` | Fond laiton semi-transparent, texte `craie-vive` |
| Body | `touch-action: manipulation`, pas de tap-highlight bleu, pas d’overscroll vertical |

---

## Ce qu’il ne faut pas faire

1. Poser du bois / laiton / grain **derrière un chiffre de score**.
2. Utiliser un hex hors `index.css` / `couleurs.ts`.
3. Descendre sous `craie/60` pour du texte utile.
4. Créer une variante de bouton / panneau ad hoc hors des composants communs.
5. Laisser une icône lucide sans `aria-hidden`.
6. Mettre Alfa Slab One ailleurs que sur l’enseigne / le vainqueur.
7. Conditionner le paysage à la seule `orientation` (oublier `max-height`).
8. Afficher la barre de navigation pendant une partie.

---

## Fichiers de référence

| Fichier | Contenu |
| ------- | ------- |
| `src/index.css` | Tokens, matières, animations, `prefers-reduced-motion` |
| `src/ui/couleurs.ts` | Palette joueurs → pixels |
| `src/ui/composants/commun/` | Design system React |
| `scripts/icon.svg` | Source de l’icône PWA |
| `CLAUDE.md` | Résumé opérationnel + décisions structurantes |
