# `.claude/` — workflow agentique

Source unique du workflow pour Claude Code et Cursor. Les décisions
produit restent dans `CLAUDE.md` ; ce dossier dit **comment** les
agents travaillent. Repris du workflow de `xxs_planning`, adapté à un
projet sans serveur, sans compte et sans ADR.

## Commandes

| Commande | Rôle |
| --- | --- |
| `/intake <id>` | Cadrage interactif → `docs/request/<id>.md`. N'orchestre pas. |
| `/orchestrate <id> [high\|light]` | Chaîne de lot. Reprend une session existante. |
| `/refresh-architecture` | Régénère `.ai/architecture-context.md`. |
| `/audit` | Audit lecture seule, six dimensions. |

## Agents

| Agent | Phase | Coût |
| --- | --- | --- |
| `archi-scout` | Architecture, 1er passage | sonnet / low |
| `archi-designer` | Architecture, 2e passage | sonnet / high |
| `archi-authority` | Architecture, dernier recours ou surface gravée | opus / max |
| `archi` | Invocation directe = authority | opus / max |
| `dev` | Implémentation | sonnet / medium |
| `test` | Plan + exécution | sonnet / high |
| `sec` | Revue sécu (niveau `high`) | sonnet / high (opus sur surface gravée) |
| `review` | Go / no-go (niveau `high`) | opus / max |
| `audit` | Une dimension d'audit | sonnet / high (opus pour `archi` et `domaine`) |
| `intake` | Brief du cadrage | sonnet / high |
| `architecture-context` | Compactage des décisions | sonnet / high |

## Où vit quoi

| Chemin | Rôle |
| --- | --- |
| `CLAUDE.md` | Décisions gravées, règles du jeu. Gagne toujours. |
| `.claude/CONVENTIONS.md` | Forme concrète du code. |
| `.claude/rules/` | Règles de travail courtes, par zone. |
| `.ai/architecture-context.md` | Compactage lu en premier par les agents. **Pas une source de vérité.** |
| `docs/request/` | Demandes validées par `/intake`. |
| `docs/lots/<id>/` | Une session `/orchestrate` : `00` à `06`. |
| `docs/audits/` | Rapports `/audit`, lots candidats avec statut. |

## Surfaces gravées

Un lot qui touche l'une d'elles est en `high`, et sa chaîne
d'architecture démarre à `archi-authority` : `src/core/domain/`, la
couture `GameMode`, un format persisté (`MatchEvent`, Dexie,
`backupSchema`), le service worker ou `firebase.json`, une décision
gravée de `CLAUDE.md`.

## Ce que ce workflow ne fait pas

- Pas de worktree ni de branche par lot.
- Pas de commit par phase. Un commit par lot, après le go, et après
  accord explicite (`rules/commit.md`).
- Pas de pipeline à quatre agents pour régénérer le contexte :
  un passage suffit.
- `.ai/architecture-context.md` n'est pas une source de vérité.
- Les lots antérieurs à ce workflow (`04-revue.md`, pas de Sécurité)
  gardent leur numérotation.
