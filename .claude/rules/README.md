# Règles de travail — `.claude/rules/`

**Elles ne redécident pas `CLAUDE.md`.** En cas de désaccord : code récent,
puis `CLAUDE.md`, puis `.claude/CONVENTIONS.md`, puis ce dossier.
`.ai/architecture-context.md` est un compactage, pas une voix de plus —
s'il diverge, on le régénère (`/refresh-architecture`), on ne le suit pas.

Ces fichiers sont **courts** et renvoient à `CONVENTIONS.md` pour le
détail des patterns : ils disent *quand* une règle s'applique et ce qu'il
ne faut surtout pas faire. Les agents et skills citent le fichier
concerné plutôt que de le recopier.

| Fichier | Quand |
| --- | --- |
| [response-policy.md](./response-policy.md) | Toujours — incertitude, pas d'invention |
| [documentation-language.md](./documentation-language.md) | Tout Markdown du repo |
| [glossary.md](./glossary.md) | Docs, libellés, noms métier |
| [prospective.md](./prospective.md) | Étude / comparaison / exploration |
| [commit.md](./commit.md) | Création d'un commit |
| [biome.md](./biome.md) | Lint / format |
| [typescript.md](./typescript.md) | Sources TS / TSX |
| [testing.md](./testing.md) | Tests, Vitest |
| [persistence.md](./persistence.md) | Dexie, journal d'événements, export / import |
| [frontend-react.md](./frontend-react.md) | `src/ui/` |
| [theme-colors.md](./theme-colors.md) | Couleurs, thème clair / sombre |
