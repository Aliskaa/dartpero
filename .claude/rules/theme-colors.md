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
- **Interdits** : `text-craie/NN` et `text-craie-vive/NN` (l'encre transparente
  tombe sous 4,5:1 sur papier) — garde `themeBoundary`. L'alpha reste permis
  pour les bordures et les fonds (`border-craie/25`).
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

## Exceptions (documentées dans le garde lui-même)

- `src/ui/couleurs.ts` — palette des profils, teintes symboliques.
- `src/ui/composants/commun/Cible.tsx` — un vrai plateau de fléchettes.
- `src/ui/theme.ts` — les teintes de barre système, une par thème.

Aucune autre. Une nouvelle exception se documente dans le garde **et**
ici, dans le même lot.
