# Lot `allegement-docs` — graphe d'échanges

> Documentation de ce qui s'est **réellement** passé. Écrit par l'Orchestrator, pas par un
> sous-agent. N'invente rien.

## Légende

- Trait plein : phase exécutée, rapport écrit.
- Trait pointillé : confirmation utilisateur, gate, ou boucle de retour.

## Graphe

```mermaid
flowchart TD
  O["Orchestrator<br/>branche lot/allegement-docs<br/>pas d'intake"] -.->|surface gravée| S["archi-scout, archi-designer : sautés"]
  O --> AA["archi-authority opus/max : PASS"]
  AA --> F1["01-architecture.md"]
  F1 -.->|"Arrêt Archi → Dev"| U1(("Utilisateur<br/>Q1 : ≈ 335 l., plafond 340<br/>go Dev"))
  U1 -.-> D["dev opus<br/>destinations, CLAUDE.md, briefs"]
  D --> OR1["Orchestrator<br/>compactage → index (2 fichiers)"]
  OR1 --> G["architecture-context sonnet/high<br/>brief lu sur disque<br/>146 l. / 12 246 o."]
  G --> F2["02-dev-notes.md"]
  F2 --> T["test opus<br/>T1-T10 PASS, D1-D4"]
  T --> F3["03-plan-de-test.md"]
  T -.->|"boucle 1, tour 1 : D1-D3"| D2["dev opus<br/>.ai retouché : 12 279 o."]
  T -.->|D4| OR2["Orchestrator corrige 02"]
  D2 --> T2["test opus : rejeu PASS"]
  OR2 --> T2
  T2 -.->|"marge 9 o."| U2(("Utilisateur<br/>plafond 160 l. / 13 312 o."))
  U2 -.-> OR3["Orchestrator : plafond dans 4 fichiers"]
  OR3 --> SEC["sec opus : RAS sécu"]
  SEC --> F4["04-revue-securite.md"]
  F4 --> R["review opus/max<br/>GO, 2 mineurs, 9 infos"]
  R --> F5["05-revue.md"]
  R -.->|"constats 1, 2, 3, 7"| OR4["Orchestrator corrige PLAN § 6, 00, 02"]
  F5 --> E["06-echanges.md"]
  OR4 --> E
  E -.->|"Arrêt fin de lot"| U3(("Utilisateur : go ?"))
```

## Rapports

- [00-orchestration.md](./00-orchestration.md)
- [01-architecture.md](./01-architecture.md)
- [02-dev-notes.md](./02-dev-notes.md)
- [03-plan-de-test.md](./03-plan-de-test.md)
- [04-revue-securite.md](./04-revue-securite.md)
- [05-revue.md](./05-revue.md)

## Statut final

**Terminé côté phases** (Revue : GO), en attente du go utilisateur de fin de lot, puis du commit
sur `lot/allegement-docs` et de la fusion `--ff-only` dans `main` — chacun soumis à accord.
Boucles : 1 tour sur 5 (boucle 1).
