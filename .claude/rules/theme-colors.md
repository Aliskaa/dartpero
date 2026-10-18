---
paths:
  - "src/ui/**"
  - "src/index.css"
---

# Couleurs — les tokens, et seulement eux

**Quand :** `src/ui/`, `src/index.css`, thème clair / sombre.
Palette et rôles : `docs/CHARTE_GRAPHIQUE.md`.

## Règle

- **Interdit** dans `src/ui` : une couleur écrite en dur (`#…`, `rgb(…)`,
  `hsl(…)`…). Vérifié par `tests/architecture/themeBoundary.test.ts`.
- **Obligatoire** : les classes de tokens (`text-craie`, `bg-laiton`…),
  définies dans `@theme` de `src/index.css`.
- Le texte secondaire s'écrit en **couleur pleine** : `text-craie-2` (courant
  atténué) ou `text-craie-3` (légendes, en-têtes — le plancher). Aucun texte
  sous `craie-3` (garage mal éclairé, luminosité basse), ≥ 4,5:1 sur les
  quatre surfaces dans les deux thèmes.
- **Interdits** : `text-craie*/NN` — toute variante (`-2`, `-3`, `-decor`,
  `-vive`…) suivie d'un alpha (l'encre transparente tombe sous 4,5:1 sur
  papier) — garde `themeBoundary`. L'alpha reste permis pour les bordures et
  les fonds (`border-craie/25`).
- **Pas de dégradé ni de halo** (`shadow-[0_0_…]`) : garde
  `typographieBoundary` (seule exception de dégradé : `.chargement-balai`).
  Les ombres portées (`drop-shadow-[0_3px_0_…]`) restent permises.
- `text-craie-decor` : **uniquement** pour un glyphe purement décoratif
  `aria-hidden` (séparateurs « · », « | »). Un « — » qui remplace une valeur
  absente est une information : `craie-3`.
- Les tokens s'emploient **en paires de rôle** : c'est ce qui permet au
  thème clair de n'être qu'une redéfinition des **valeurs** sous
  `html[data-theme="clair"]`, sans toucher une classe. Une couleur
  employée hors de sa paire casse le thème clair sans casser un test.

## Nouvelle couleur

1. Ajouter le token dans `src/index.css`, **avec sa valeur claire**.
2. Vérifier le contraste dans les **deux** thèmes (le laiton était à
   1,84:1 sur papier avant correction).
3. Consommer le token depuis le composant — jamais l'inverse.

## Jeton général récent : `rouge-touche`

Lot `hors-statistique` : le rouge de la touche « Hors » (texte via `--texte-touche`, bordure via
`.touche-hors`, jamais un fond). Jeton **général**, hors garde des réservés. Sombre `#ff8a8f`,
clair `#a81f25`, mesurés sur `feutre` (fond réel du pavé) : 7,9 / 5,2:1. Sur `feutre-nuit` en
clair il tombe à 4,2:1 : ne pas l'y poser. `rouge-texte` reste réservé à la feuille de règles.
Garde : `themeBoundary` (défini dans les deux blocs, consommé par `PaveSaisie`).

## Jetons réservés

Trois familles de sens, chacune à ses fichiers ; **quatre entrées** dans la garde (le `voile` a la sienne depuis le lot `annulation-volee`) ; la garde est une table
jetons → fichiers (`themeBoundary.test.ts`, « les jetons réservés … ne
servent qu'à leurs fichiers »), un témoin par entrée (quatre).

### La feuille de règles

Neuf jetons (lot `regles-du-jeu`) ne servent **qu'à** `FeuilleRegles.tsx`
et `LivreRegles.tsx` — sauf `voile`, que la garde autorise à `FeuilleRegles.tsx` et `BoiteConfirmation.tsx` et **plus** à `LivreRegles.tsx` (voir plus bas) : `craie-2-regles`, `craie-3-regles`, `laiton-texte`,
`rouge-texte`, `vert-texte`, `filet`, `filet-doux`, `chene-doux`, `voile`
(`src/index.css`, charte § Palette).

- Leurs noms sont génériques, leurs valeurs ne le sont pas : contraste
  vérifié sur les surfaces de la feuille seulement (`rouge-texte` /
  `vert-texte` tombent à 4,2 / 3,7:1 sur `feutre-nuit` en clair).
- Ailleurs, prendre le jeton général (`craie-2`, `craie-3`, `laiton`,
  `border-craie/25`…). Les élargir = vérifier le contraste dans les deux
  thèmes sur la nouvelle surface, puis élargir la garde.
- ⚠️ **`voile` est élargi** (lot `annulation-volee`, relecture à l'écran) :
  il sert aussi le `::backdrop` de `BoiteConfirmation.tsx` — en clair,
  `feutre-nuit/65` faisait un beige sur beige. Entrée à part dans la garde
  (« voile des boîtes du match » : `FeuilleRegles.tsx` + `BoiteConfirmation.tsx`,
  témoin `FeuilleRegles`). Aucun texte ne se pose sur le voile : le texte de
  la boîte reste sur son `ardoise` (contrastes vérifiés : craie-vive 16,1 / 16,6:1,
  `craie-2` 8,1 / 9,6:1, `craie` 13,3 / 12,9:1, `sur-laiton` sur `laiton` 7,7 / 4,6:1,
  sombre / clair).

### Le voyant et les aperçus de thème (lot `reglages-par-usage`)

- `vert-etat` : « Installée » en texte vert, **seulement** dans `Voyant.tsx`
  (contraste vérifié sur l'`ardoise` : 8,5 / 5,8:1 ; 4,6:1 sur `feutre`
  en clair). Le filet reste `vert-cible`.
- `apercu-{sombre,clair}-{fond,encre,accent}` : **seulement** dans
  `VignetteTheme.tsx`. ⚠️ Constants à dessein — redéfinis **à l'identique**
  sous `html[data-theme="clair"]` : ce sont des copies de `feutre`, `craie`,
  `laiton` de chaque thème. Une seconde garde vérifie l'égalité avec le
  jeton montré, dans les deux blocs. Changer une valeur de palette =
  changer son aperçu dans les deux blocs.

## Exceptions (documentées dans le garde lui-même)

- `src/ui/couleurs.ts` — palette des profils, teintes symboliques.
- `src/ui/composants/commun/Cible.tsx` — un vrai plateau de fléchettes.
- `src/ui/theme.ts` — les teintes de barre système, une par thème.

Aucune autre. Une nouvelle exception se documente dans le garde **et**
ici, dans le même lot.
