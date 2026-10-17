# Lot `reglages-par-usage` — graphe d'échanges

> Documentation de ce qui s'est **réellement** passé. Écrit par l'Orchestrator, pas par un
> sous-agent. N'invente rien.

**Lot en parallèle** (`orchestrate` § Lots en parallèle) : worktree
`C:\Users\kevin\Documents\Flechettes-reglages-par-usage`, port 5201, mené en même temps que
`rejouer` (`..\Flechettes-rejouer`, port 5202). `rejouer` a fusionné d'abord (`63cb636`) :
**rebase** sur `main` avec l'accord de l'utilisateur (TO1). Conflits : `.claude/CONVENTIONS.md`
(clés de requête, compte et arbre des ports → 25 driving), `docs/CHARTE_GRAPHIQUE.md` (sections
Rejouer et Réglages), `docs/PROJECT_PLAN.md` (§ 0, § 4, § 6) — les deux apports gardés ;
`.ai/architecture-context.md` repris de `main` puis régénéré. Fusionnés sans conflit : `labels.ts`,
`container.ts`, `clesRequetes.ts`, `CLAUDE.md`, `theme-colors.md`. Après rebase : lint, typecheck,
build, smoke OK ; **1496 / 1497** — l'échec (`parcours.test.tsx`, délai de 5 s dépassé en suite
complète) existe aussi sur `main` seul (1407 / 1408) et passe isolé : préexistant, pas du lot.

## Légende

- Trait plein : phase exécutée, rapport écrit.
- Trait pointillé : confirmation utilisateur, gate, ou boucle de retour.

## Graphe

```mermaid
flowchart TD
  U((Utilisateur)) -.->|/intake| I[Intake : request.md Validé]
  I -.->|/orchestrate high| O[Orchestrator]
  O --> X{Index à jour ?}
  X -->|oui| AA[archi-authority opus/max : PASS]
  O -.-|scout, designer sautés : surface gravée| AA
  AA -.->|U1-U10 + gravure : défauts acceptés| G1{Arrêt Archi → Dev}
  G1 -.->|go| D1[dev opus : session 1, maxTurns 100 sans rapport]
  D1 -.->|repris par message| D2[dev session 2 : rapport, 1414 verts]
  D2 -.->|Q-a gardé, Q-b 40 %| D3[dev session 3 : Q-b]
  D3 --> T1[test opus passe 1, sans shell : renvoi]
  T1 -.->|boucle 1, tour 1/5 : B1, B2, T1-T7| D4[dev session 4 : 1428 verts]
  D4 --> OC1[Orchestrator : commandes + 2 contre-épreuves]
  OC1 --> T2[test passe 2 : prêt]
  T2 --> S1[sec opus passe 1 : PASS]
  S1 --> OC2[Orchestrator : 6 commandes sécu, audit 0, smoke OK]
  OC2 --> R1[review opus/max passe 1 : NO-GO]
  R1 -.->|1 gras, 2 duo 56 px : corriger| D5[dev session 5 : boucle 5, tour 2/5]
  D5 --> OC3[Orchestrator : 1429 verts, smoke OK]
  OC3 --> T3[test passe 3 : prêt, A1]
  OC3 --> S2[sec passe 2 : PASS]
  T3 -.->|A1 : remesure| D6[dev session 6 : deux lignes à 125 %]
  D6 -.->|Q-d : « Dernier export »| D7[dev session 7]
  D7 --> OC4[Orchestrator : 1429 verts, smoke OK]
  OC4 --> R2[review passe 2 : GO]
  R2 -.->|retouches de texte, boucle 5 tour 3/5| D8[dev session 8]
  D8 --> AC[architecture-context sonnet/high : index régénéré]
  AC --> E[Échanges]
  E -.->|go fin de lot| U
```

## Agents, skills, règles et commandes utilisés

> Relevé vérifié dans la session (appels `Skill`, `Agent` et `subagent_type`, shell).

**Skills** (`.claude/skills/`)

| Skill | Déclenchée par | Usage |
|---|---|---|
| `intake` | Utilisateur (`/intake reglages-par-usage`) | Cadrage, `docs/request/reglages-par-usage.md` |
| `orchestrate` | Utilisateur (`/orchestrate reglages-par-usage high`) | Pilotage du lot |

`refresh-architecture` n'a **pas** été invoquée : son brief (`.claude/agents/architecture-context.md`,
lu sur disque) a été appliqué en lançant directement l'agent `architecture-context`.

**Sous-agents** (`.claude/agents/`)

| Agent | Modèle / effort | Lancements | Pour quoi |
|---|---|---|---|
| `archi-scout` | — | 0 | Sauté : surface gravée annoncée par l'intake |
| `archi-designer` | — | 0 | Sauté : même raison |
| `archi-authority` | opus / max | 1 | Architecture (PASS) |
| `dev` | opus / medium (maxTurns 100) | 1 lancement, repris 7 fois par message (sessions 2 à 8) | Code, tests, docs, captures ; boucles 1 et 5 ; Q-b ; Q-d ; mesures 360 px |
| `test` | opus / high | 3 (passes 1, 2, 3) | Plan de test, couverture, contre-épreuves raisonnées |
| `sec` | opus / high | 2 (passes 1, 2) | Revue sécurité (PASS) |
| `review` | opus / max | 2 (passes 1, 2) | NO-GO puis GO |
| `architecture-context` | sonnet / high | 1 | Régénération de `.ai/architecture-context.md` |

**Règles** (`.claude/rules/`)

| Règle | Rôle dans le lot |
|---|---|
| `theme-colors.md` | *Modifiée* : trois familles de jetons réservés (`vert-etat`, `apercu-*`) ; appliquée |
| `persistence.md` | *Appliquée* : `localStorage` réservé aux préférences d'appareil ; format persisté inchangé |
| `frontend-react.md` | *Appliquée* : `labels.ts`, `services.clock`, 48 px, `<output aria-label>`, relecture écran |
| `testing.md` | *Appliquée* : fakes, changements d'heure avec précondition, contre-épreuves |
| `typescript.md`, `biome.md` | *Appliquées* : `lint:fix` limité à `src tests` |
| `glossary.md`, `documentation-language.md` | *Appliquées* : docs en français |
| `prospective.md` | *Appliquée* : l'étude n'est annotée qu'au titre du lot |
| `response-policy.md` | *Appliquée* : points produit non tranchés renvoyés à l'utilisateur |
| `commit.md` | *Appliquée* : accord avant commit, branche du lot (commit non fait à ce stade) |

**Commandes shell**

| Commande | Lancée par | Usage |
|---|---|---|
| `npm run lint`, `npm run typecheck`, `npx vitest run`, `npm run build` | Dev (chaque session), puis Orchestrator (4 fois) | Vérifications ; 1414 → 1428 → 1429 verts |
| `npx biome check --write src tests` | Dev | Format limité aux chemins du lot |
| `npm run smoke` | Orchestrator (3 fois) | Aucune requête externe, aucun `REMPLIR` |
| `npm audit --omit=dev` | Orchestrator | 0 vulnérabilité, lot et `main` |
| Contre-épreuves (mutation, test ciblé, restauration vérifiée par empreinte) | Orchestrator (2), Dev (plusieurs) | Tests capables d'échouer |
| `git status` (chemins sensibles), recherches réseau / clé | Orchestrator | Commandes 1-3 de la Sécurité |
| `vite preview --port 5201` + Chrome (`playwright-core`, `shoot.cjs`) | Dev | Captures et mesures, `C:\Users\kevin\Documents\Flechettes\docs\maquettes\reglages-par-usage\` |
| `git worktree list`, `git branch --show-current`, `git log` (fraîcheur de l'index) | Orchestrator | Mise en place |

## Rapports

- [request.md](./request.md)
- [00-orchestration.md](./00-orchestration.md)
- [01-architecture.md](./01-architecture.md)
- [02-dev-notes.md](./02-dev-notes.md)
- [03-plan-de-test.md](./03-plan-de-test.md)
- [04-revue-securite.md](./04-revue-securite.md)
- [05-revue.md](./05-revue.md)

## Statut final

**Terminé côté pipeline** : Revue GO (passe 2), Sécurité PASS, 1429 tests verts, 3 tours de boucle
sur 5. En attente : go utilisateur de fin de lot, relecture sur appareil, commit puis fusion
(sur accord).
