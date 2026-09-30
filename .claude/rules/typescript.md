# TypeScript

**Quand :** sources sous `src/` et `tests/`.

- TypeScript **7** : pas de `baseUrl` ; l'alias `@/*` est relatif
  (`"./src/*"`), doublé dans `vite.config.ts` (`CLAUDE.md` § Notes
  techniques).
- Imports **relatifs** dans `src/core/**`, `@/` partout ailleurs
  (`CONVENTIONS` § 8).
- Value Object = un `type` et un `const` du même nom, une factory
  validante, `readonly` partout (`CONVENTIONS` § 1).
- Identifiants en **branded types** (`MatchId`, `PlayerId`, `LegId`) —
  jamais un `string` nu.
- Listes fermées en `as const`, type dérivé de la constante.
- Unions **discriminées** plutôt que types mous (`AnyMatchState`,
  `MatchSummary`) : un `switch` exhaustif, et TypeScript signale le cas
  oublié.
- Pas de `any` aux frontières publiques ; une erreur `unknown` se
  normalise une fois (`CONVENTIONS` § 10).
- Nommage : UI en français (`composants/`, `ecrans/`, props), cœur en
  anglais sur sa **surface exportée** (`CONVENTIONS` § 1).
