# `.ai/` — index généré, pas une source de vérité

`.ai/architecture-context.md` est un **index** : il dit où lire, pas ce que disent les sources.
Une règle de jeu, une décision gravée ou une convention que le lot touche se lit **à sa source,
sur disque**, à la section qu'il indique.

Il est généré depuis `CLAUDE.md`, `.claude/CONVENTIONS.md`, `.claude/rules/`,
`docs/CHARTE_GRAPHIQUE.md` et `docs/DEPLOIEMENT.md`. Les agents de phase le
lisent en premier pour éviter de relire `CLAUDE.md` en entier à chaque lot.
Plafond : **≤ 160 lignes et ≤ 13 312 octets**.

En cas de désaccord : **code récent**, puis `CLAUDE.md`, puis
`CONVENTIONS.md`. Jamais ce dossier.

Régénérer : `/refresh-architecture`.
Un lot qui grave une décision doit le relancer avant le commit.
