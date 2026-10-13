# Lot `charte-contraste` — graphe d'échanges

> Documentation de ce qui s'est **réellement** passé. Écrit par l'Orchestrator, pas par un
> sous-agent. N'invente rien.

## Origine

Lot 2 du découpage de l'étude `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`
(§ Ce qui freine 1 et 2). Cadré par `/intake charte-contraste` dans la même session : quatre
choix de l'utilisateur (tri texte / décor, nom inactif atténué, garde de test, niveau `light`),
puis alignement sur la maquette validée (valeurs claires, halo des inactifs retiré).

## Légende

- Trait plein : phase exécutée, rapport écrit.
- Trait pointillé : confirmation utilisateur, gate, ou boucle de retour.

## Graphe

```mermaid
flowchart TD
  U([Utilisateur]) -->|/intake charte-contraste| I[request.md validé]
  U -->|/orchestrate charte-contraste light| O[Orchestrator]
  I --> O
  O --> S[archi-scout : PASS]
  S --> A[01-architecture.md]
  A -.->|gate : Q2, Q3 closes par l'Orchestrator| A
  A -.->|arrêt Archi → Dev : onglet actif validé, go| U2([Utilisateur])
  U2 -.-> D1[dev : 49 fichiers]
  D1 --> V1[Orchestrator : lint, typecheck, vitest 805 verts, périmètre, accents]
  V1 --> DN[02-dev-notes.md]
  DN -.->|gate : 3 questions pour Test| T1[test passe 1 : GO + renvoi O1, O3]
  T1 -.->|boucle 1, tour 1| D2[dev : garde élargi + 2 docs]
  D2 --> V2[Orchestrator : lint, vitest 805 verts, encodage]
  V2 --> T2[test passe 2 : GO]
  T2 --> TP[03-plan-de-test.md]
  TP --> E[06-echanges.md]
  E -.->|arrêt fin de lot : relecture à l'écran| U3([Utilisateur])
  SD[archi-designer / archi-authority] -.-x|non lancés : scout PASS| S
  SR[sec / review] -.-x|hors niveau light| O
```

## Agents, skills, règles et commandes utilisés

> Relevé vérifié dans la session (appels `Skill`, `Agent` et `subagent_type`, shell).

**Skills** (`.claude/skills/`)

| Skill | Déclenchée par | Usage |
|---|---|---|
| `intake` | Utilisateur (`/intake charte-contraste`) | Cadrage, `docs/request/charte-contraste.md` |
| `orchestrate` | Utilisateur (`/orchestrate charte-contraste light`) | Pilotage du lot |

`refresh-architecture` non nécessaire au démarrage (index à jour). `audit/SKILL.md` n'a pas été
invoquée : une ligne y a été **modifiée** (règle de plancher).

**Sous-agents** (`.claude/agents/`)

| Agent | Modèle / effort | Lancements | Pour quoi |
|---|---|---|---|
| `archi-scout` | sonnet / low (frontmatter) | 1 | Architecture → PASS |
| `archi-designer` | — | 0 | Non nécessaire : scout en PASS |
| `archi-authority` | — | 0 | Non nécessaire : aucune surface gravée |
| `dev` | sonnet / medium, maxTurns 100 (frontmatter) | 2 | Implémentation ; boucle 1 (garde + docs) |
| `test` | sonnet / high (frontmatter) | 2 | Passe 1 (GO + renvoi), passe 2 (GO) — sans shell les deux fois |
| `sec`, `review` | — | 0 | Hors niveau `light` |

**Règles** (`.claude/rules/`)

| Règle | Rôle dans le lot |
|---|---|
| `theme-colors.md` | **Modifiée** : plancher en tokens (`craie-3`), alpha de texte interdit, `craie-decor` réservé à l'`aria-hidden` ; appliquée (paires de rôle, valeur claire de chaque token) |
| `testing.md` | Appliquée : garde falsifiable (plancher, chaînes synthétiques, contre-épreuves) |
| `biome.md` | Appliquée : `lint:fix` limité à `src tests` |
| `frontend-react.md` | Appliquée : « un ratio sans occasion s'affiche — » → les « — » sont une information (Q3) |
| `persistence.md` | Vérifiée sans objet |
| `commit.md` | Appliquée : branche `lot/charte-contraste`, accord avant commit |

**Commandes shell**

| Commande | Lancée par | Usage |
|---|---|---|
| `git log -1 --format=%ct`, `git status`, `git switch -c lot/charte-contraste` | Orchestrator | Fraîcheur de l'index, préconditions, branche |
| Copie de `request.md` + comparaison d'empreintes | Orchestrator | Snapshot octet pour octet |
| Script `node` de calcul WCAG (fichier temporaire hors dépôt) | Orchestrator | Contrastes de l'intake, puis recalcul du tableau de l'architecture (Q2) |
| `npx biome check --write src tests`, `npm run lint`, `npm run typecheck`, `npx vitest run`, greps, contre-épreuves | Dev (deux passes) | Vérifications |
| `git status`, `git diff --stat`, recherche d'alphas restants et d'accents cassés, `npm run lint`, `npm run typecheck`, `npx vitest run` | Orchestrator | Vérification après Dev puis après la boucle 1 (805 verts) |

## Rapports

- [request.md](./request.md)
- [00-orchestration.md](./00-orchestration.md)
- [01-architecture.md](./01-architecture.md)
- [02-dev-notes.md](./02-dev-notes.md)
- [03-plan-de-test.md](./03-plan-de-test.md)
- `04-revue-securite.md`, `05-revue.md` : hors niveau `light`, gabarits non remplis

## Statut final

Terminé côté pipeline (Test GO, 805 tests verts, 1 tour de boucle sur 5). En attente de la
relecture à l'écran par l'utilisateur, puis de son accord pour le commit et la fusion.
