---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.css"
  - "biome.json"
---

# Biome

**Quand :** lint, format, `biome.json`, sources TS / TSX / CSS.

- **Seul** outil de lint et de format. JAMAIS ESLint ni Prettier —
  `CLAUDE.md` § Décisions structurantes.
- Source de vérité : `biome.json`. Réglages résumés dans `CONVENTIONS`
  § 12 — ne pas reformater à la main contre eux.
- `organizeImports` trie au `lint:fix` — ne pas trier à la main.
- `npm run lint` = `biome check .` ; `npm run lint:fix` écrit.
- **Exclus du lint** (`files.includes` de `biome.json`) : `.claude/skills` et
  `.agents`, où s'installent des skills tiers (lot `accueil-parties-recentes`).
  ⚠️ L'exclusion couvre aussi **nos** skills (`intake`, `orchestrate`…) : du
  Markdown aujourd'hui, mais un script ajouté là ne serait jamais linté.
  Exclu aussi : `docs/maquettes` (planches HTML et scripts de capture,
  archives de conception ignorées par git, pas du code de l'app).
- ⚠️ **`lint:fix` sur les chemins du lot** (`npx biome check --write src
  tests`), jamais sur tout le dépôt sans avoir lu `git status` : un `lint:fix`
  global a réécrit des scripts d'un skill tiers non suivi par git,
  irrécupérables autrement qu'en réinstallant.
- Biome 2.5 : `linter.rules.preset` (pas `recommended`), motifs
  d'exclusion sans `/**` final, `css.parser.tailwindDirectives: true`
  obligatoire pour `src/index.css` (voir `biome.json`).
- **Frontière hexagonale** : l'override `noRestrictedImports` sur
  `src/core/**` bannit `react`, `react-dom`, `react-router`,
  `@tanstack/react-query`, `lucide-react`, `dexie`, `sharp`, chacun avec
  un message qui dit **pourquoi**. Pour bannir un nouvel import du cœur,
  suivre ce modèle — le garde `tests/architecture/hexagonalBoundary.test.ts`
  le vérifie aussi côté tests.
