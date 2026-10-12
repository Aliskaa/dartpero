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
