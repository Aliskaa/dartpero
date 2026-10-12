# Lot `nouvelle-partie-en-etapes` — graphe d'échanges

> Documentation de ce qui s'est **réellement** passé. Écrit par l'Orchestrator, pas par un
> sous-agent. N'invente rien.

## Version 2 (2026-10-11) — après la Revue v3

### Légende

- Trait plein : phase exécutée, rapport écrit.
- Trait pointillé : confirmation utilisateur, gate, ou boucle de retour.

### Graphe

```mermaid
flowchart TD
  U([Utilisateur]) -.->|/intake validé| R[request.md]
  R --> O[Orchestrator]
  O -->|index à jour| AC[(architecture-context)]
  O --> S1[archi-scout : sauté]
  O --> S2[archi-designer : sauté]
  O -->|surface gravée| AA[archi-authority : PASS]
  AA --> A01[01-architecture.md]
  A01 -.->|⏸ go utilisateur| D1[dev, opus : 489 tests]
  D1 -.->|gate Dev : D1 clos| T1[test, opus]
  T1 -.->|pas de shell : commandes et contre-épreuve par l'Orchestrator| O
  T1 -.->|boucle 1, tour 1 : B1, O1, O2, T1-T6| D2[dev, opus]
  D2 --> T2[test rejoué : conforme, 503 tests]
  T2 -.->|gate Test| S[sec, opus : RAS]
  S -.->|gate Sécurité| DOC[Orchestrator : CLAUDE.md, glossaire, CONVENTIONS, charte, PLAN]
  DOC --> AC2[/refresh-architecture n° 1/]
  AC2 --> RV1[review, opus : NO-GO]
  RV1 -.->|bug du glisser vérifié par l'Orchestrator| O
  RV1 -.->|boucle 5, tour 2 : glisser, T8, T9| D3[dev, opus]
  D3 --> T3[test rejoué : 517 tests, contre-épreuve 13 échecs]
  T3 --> S3[sec rejouée : RAS]
  S3 --> AC3[/refresh-architecture n° 2/]
  AC3 --> RV2[review, opus : GO conditionnel]
  RV2 -.->|⏸ quatre accords| U
  U -.->|report sortie libre ; corriger T10 / T11 ; relecture avant commit ; README| O
  O -.->|boucle 5, tour 3 : commentaires de test| D4[dev, opus : 517 tests]
  D4 --> AC4[/refresh-architecture n° 3/]
  AC4 --> RV3[review, opus : GO sous réserve de la relecture]
  RV3 -.->|⏸ relecture A à F, puis commit et fusion sur accord| U
```

### Agents, skills et commandes utilisés

> Relevé vérifié dans le transcript de la session (appels `Skill`, commandes slash, appels
> `Agent` et leur `subagent_type`).

**Skills** (`.claude/skills/`)

| Skill | Déclenchée par | Usage |
|---|---|---|
| `intake` | Utilisateur (`/intake nouvelle-partie-en-etapes`) | Cadrage, 4 questions, écriture de `docs/request/…` |
| `orchestrate` | Utilisateur (`/orchestrate nouvelle-partie-en-etapes high`) | Pilotage du lot : chaîne d'agents, gates, boucles, ce dossier |

`refresh-architecture` n'a **pas** été invoquée comme skill : l'Orchestrator a lancé directement
l'agent `architecture-context` (3 fois), comme le prévoit la skill `orchestrate`.

**Règles** (`.claude/rules/`)

Une règle ne s'invoque pas : Claude Code charge les onze fichiers dans le contexte de chaque
session, et les sous-agents y sont renvoyés par leur brief et par `.ai/architecture-context.md`.
Le tableau dit donc lesquelles ont **pesé** sur ce lot, pas lesquelles ont été « lancées ».

| Règle | Rôle dans le lot |
|---|---|
| `frontend-react.md` | Tout le parcours : use cases via `useServices()`, routes lazy, 48 px, `labels.ts` ; **modifiée** (une route par étape, « manche ») |
| `glossary.md` | Vocabulaire « manche » / « set » à l'écran ; **modifiée** (lignes manche / set et manche d'entraînement) |
| `theme-colors.md` | Aucune couleur en dur dans les nouveaux écrans ; contraste à relire en clair |
| `testing.md` | Fakes, `renderWithServices`, gestes ; « un test d'absence doit pouvoir échouer » → contre-épreuves de mutation |
| `typescript.md` | Imports `@/`, unions exhaustives (`ReglagesJeu`, `demarrer`) |
| `biome.md` | `npm run lint` à chaque tour |
| `persistence.md` | Vérifiée **non touchée** : aucun événement, schéma ni `backupSchema` ; préférences seules en `localStorage`, `partie:legs` jamais renommée |
| `response-policy.md` | Aucune règle de jeu improvisée : la sortie libre reportée à un lot de règles plutôt que tranchée ici |
| `documentation-language.md` | Toute la doc du lot en français |
| `prospective.md` | L'étude DartsOn dans `docs/prospective/`, sans toucher au code |
| `commit.md` | Accord avant commit, branche du lot, `git status` relu, puis fusion `--ff-only` sur second accord |

**Autre commande slash**

| Commande | Lancée par | Usage |
|---|---|---|
| `/ultrareview` | Utilisateur | Sans objet : aucun changement à relire à ce moment |

**Sous-agents** (`.claude/agents/`)

| Agent | Modèle / effort | Lancements | Pour quoi |
|---|---|---|---|
| `archi-scout`, `archi-designer` | — | 0 | Sautés : surface gravée |
| `archi-authority` | opus / max | 1 | Architecture, PASS |
| `dev` | opus / medium | 4 | Implémentation, puis tours de correction 1, 2, 3 |
| `test` | opus / high | 3 | Plan de test, rejeux après les tours 1 et 2 |
| `sec` | opus / high | 2 | Revue sécurité, rejeu après le tour 2 |
| `review` | opus / max | 3 | Revues v1 (NO-GO), v2 (GO conditionnel), v3 (GO) |
| `architecture-context` | sonnet / high | 3 | Index d'architecture |

**Commandes shell** (lancées par l'Orchestrator, `test`, `sec` et `review` n'ayant pas de shell
dans cet environnement)

| Commande | Usage |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm test` | Après chaque tour de Dev et avant le commit |
| `npm run build`, `npm run smoke` | Quand `src/` changeait |
| `npm audit --omit=dev`, `git diff` des manifestes npm | Phase Sécurité (0 vulnérabilité, aucune dépendance ajoutée) |
| Contre-épreuves de mutation (source cassée, tests relancés, source restaurée) | Prouver que les tests du glisser et de « leg » peuvent échouer |
| `git status`, `git log`, `git switch`, `git commit`, `git merge --ff-only` | Branche, commit `0893aa2`, fusion dans `main` |
| `npm run preview` | Relecture A à F, par l'utilisateur |

### Rapports

- [00-orchestration.md](./00-orchestration.md) — journal, tours de boucle (3 / 5 au total)
- [request.md](./request.md) — demande validée par l'intake
- [01-architecture.md](./01-architecture.md) — `archi-authority`, PASS ; annotations en § Révisions
- [02-dev-notes.md](./02-dev-notes.md) — implémentation et trois tours de correction
- [03-plan-de-test.md](./03-plan-de-test.md) — stratégie, plan de relecture à l'écran, deux rejeux
- [04-revue-securite.md](./04-revue-securite.md) — RAS, puis rejeu RAS
- [05-revue.md](./05-revue.md) — v1 NO-GO, v2 GO conditionnel, v3 GO

### Statut final

**Terminé** : GO de la Revue v3 ; relecture A à F faite par l'utilisateur, qui a donné son
accord au commit sur `lot/nouvelle-partie-en-etapes` et à la fusion dans `main` (2026-10-12).
Relecture G (Android) et H (iPhone) après le commit.

---

## Version 1 (2026-10-11) — après la Revue v2 (historique)

Graphe arrêté à « review : GO conditionnel → ⏸ accords utilisateur avant commit » ; tours de
boucle 2 / 5. Remplacé par la version 2 ci-dessus, qui le prolonge.
