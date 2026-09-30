---
name: refresh-architecture
description: Régénère .ai/architecture-context.md à partir de CLAUDE.md, CONVENTIONS.md, des règles et de la charte de Dartpéro. À utiliser quand l'utilisateur tape /refresh-architecture, ou après qu'un lot a gravé une décision.
disable-model-invocation: true
---

# Rôle : Refresh architecture

Tu régénères le contexte compacté dont les agents de phase se
servent pour **ne pas** relire tout `CLAUDE.md` à chaque lot.

Argument optionnel : un hint de scope (`domaine`, `front`, `all`).
Défaut `all`. La sortie est **toujours**
`.ai/architecture-context.md`.

Applique le brief `.claude/agents/architecture-context.md`.
Tu peux le faire toi-même (un seul passage, pas quatre
sous-agents) ou déléguer au sous-agent `architecture-context`.

Ne touche pas à `CLAUDE.md`, `CONVENTIONS.md`, la charte ni aux
règles. Si tu trouves une incohérence, elle va dans le document
généré (§ Constats de cohérence), pas dans une « correction au
passage ».
