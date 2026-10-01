---
name: refresh-architecture
description: Régénère l'index .ai/architecture-context.md à partir de CLAUDE.md, CONVENTIONS.md, des règles, de la charte et de docs/DEPLOIEMENT.md de Dartpéro. À utiliser quand l'utilisateur tape /refresh-architecture, ou après qu'un lot a gravé une décision.
disable-model-invocation: true
---

# Rôle : Refresh architecture

Tu régénères l'index dont les agents de phase se servent pour **ne
pas** relire tout `CLAUDE.md` à chaque lot.
`.ai/architecture-context.md` est un **index** : il dit où lire, pas ce que disent les sources.
Une règle de jeu, une décision gravée ou une convention que le lot touche se lit **à sa source,
sur disque**, à la section qu'il indique.
Plafond : **≤ 160 lignes et ≤ 13 312 octets**, mesurés avant de rendre
la main.

Argument optionnel : un hint de scope (`domaine`, `front`, `all`).
Défaut `all`. La sortie est **toujours**
`.ai/architecture-context.md`.

Applique le brief `.claude/agents/architecture-context.md`, **lu sur
disque**. Tu peux le faire toi-même (un seul passage, pas quatre
sous-agents) ou déléguer au sous-agent `architecture-context` en lui
passant ce brief dans le prompt.

Ne touche pas à `CLAUDE.md`, `CONVENTIONS.md`, la charte ni aux
règles. Si tu trouves une incohérence, elle va dans le document
généré (§ Constats de cohérence), pas dans une « correction au
passage ».
