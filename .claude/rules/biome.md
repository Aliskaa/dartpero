# Biome

**Quand :** lint, format, `biome.json`, sources TS / TSX / CSS.

- **Seul** outil de lint et de format. JAMAIS ESLint ni Prettier —
  `CLAUDE.md` § Décisions structurantes.
- Source de vérité : `biome.json`. Réglages résumés dans `CONVENTIONS`
  § 12 — ne pas reformater à la main contre eux.
- `organizeImports` trie au `lint:fix` — ne pas trier à la main.
- `npm run lint` = `biome check .` ; `npm run lint:fix` écrit.
- Biome 2.5 : `linter.rules.preset` (pas `recommended`), motifs
  d'exclusion sans `/**` final, `css.parser.tailwindDirectives: true`
  obligatoire pour `src/index.css` (voir `biome.json`).
- **Frontière hexagonale** : l'override `noRestrictedImports` sur
  `src/core/**` bannit `react`, `react-dom`, `react-router`,
  `@tanstack/react-query`, `lucide-react`, `dexie`, `sharp`, chacun avec
  un message qui dit **pourquoi**. Pour bannir un nouvel import du cœur,
  suivre ce modèle — le garde `tests/architecture/hexagonalBoundary.test.ts`
  le vérifie aussi côté tests.
