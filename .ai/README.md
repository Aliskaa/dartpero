# `.ai/` — contexte généré, pas une source de vérité

`.ai/architecture-context.md` est un **compactage** de `CLAUDE.md`,
`.claude/CONVENTIONS.md`, `.claude/rules/` et
`docs/CHARTE_GRAPHIQUE.md`. Les agents de phase le lisent en priorité
pour éviter de relire `CLAUDE.md` en entier à chaque lot.

En cas de désaccord : **code récent**, puis `CLAUDE.md`, puis
`CONVENTIONS.md`. Jamais ce dossier.

Régénérer : `/refresh-architecture`.
Un lot qui grave une décision doit le relancer avant le commit.
