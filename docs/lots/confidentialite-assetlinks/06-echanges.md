# Lot `confidentialite-assetlinks` — graphe d'échanges

> Documentation de ce qui s'est **réellement** passé. Écrit par l'Orchestrator, pas par un
> sous-agent. N'invente rien.

## Légende

- Trait plein : phase exécutée, rapport écrit.
- Trait pointillé : confirmation utilisateur, gate, ou boucle de retour.

## Graphe

```mermaid
flowchart TD
  I[/intake — demande validée 2026-10-03/] --> O[Orchestrator<br/>branche lot/confidentialite-assetlinks]
  O -.->|scout et designer sautés :<br/>surface gravée| A[archi-authority<br/>opus / max — PASS]
  A -.->|arrêt Archi → Dev<br/>Q4 : installation-guidee déjà déployé| D1[dev opus<br/>454 tests, smoke rouge voulu<br/>V4 confirme D1]
  D1 --> T1[test opus — PASS<br/>mutations, hors ligne, captures]
  T1 --> S1[sec opus — v1<br/>S1, S2 : textes faux]
  S1 -.->|boucle 2, tour 1| D2[dev : S1, S2, Réglages,<br/>durcissement reseauBoundary]
  D2 --> T2[test — PASS]
  T2 --> S2[sec — v2<br/>S3 : phrase trop absolue]
  S2 -.->|boucle 2, tour 2| D3[dev : S3,<br/>exception w3.org exacte]
  D3 --> T3[test — PASS]
  D3 --> S3[sec — v3 PASS<br/>résiduels R-a à R-g]
  T3 --> R1[review opus / max — v1<br/>GO sous conditions]
  S3 --> R1
  R1 -.->|arrêt : décisions utilisateur 2026-10-10<br/>pas de predeploy, résiduels signés,<br/>pas de durcissement, mentions fournies| D4[dev : mentions + constat 4<br/>smoke vert]
  X[[incident : Teleport auto-stash<br/>restauré par git stash apply]] -.-> D4
  D4 --> T4[test — PASS<br/>garde REMPLIR rebloque]
  D4 --> S4[sec — v4 PASS]
  T4 --> DOC[Orchestrator : doc durable<br/>CLAUDE.md, DEPLOIEMENT, PLAN,<br/>feuille de route, sec.md]
  S4 --> DOC
  DOC --> AC[architecture-context<br/>index régénéré 147 l. / 13 297 o.]
  AC --> R2[review — v2 ciblée<br/>NO-GO de forme]
  R2 -.->|corrections Orchestrator :<br/>CONVENTIONS § 14, N1, N2, N4,<br/>00 / 05 / 06| F{{arrêt final :<br/>réponse utilisateur<br/>puis commit}}
```

Tours de boucle comptés : **2 / 5** (boucle 2, deux fois). Le passage Dev des mentions est une
demande de l'utilisateur, hors boucle. Test et Sécurité ont été rejoués **en parallèle** après
la boucle 2 tour 2 et après les mentions (changements indépendants et minimes).

## Rapports

- [request.md](./request.md) — demande validée par `/intake`
- [00-orchestration.md](./00-orchestration.md) — statut, blocages, journal, corrections
- [01-architecture.md](./01-architecture.md) — `archi-authority`, D1 à D6, V4
- [02-dev-notes.md](./02-dev-notes.md) — passage initial, boucle 2 (tours 1 et 2), mentions
- [03-plan-de-test.md](./03-plan-de-test.md) — passage initial et trois rejeux
- [04-revue-securite.md](./04-revue-securite.md) — versions 1 à 4, résiduels
- [05-revue.md](./05-revue.md) — versions 1 et 2

## Statut final

**Terminé** le 2026-10-10 : go de l'utilisateur (« oui commit » — formulations gardées, C5
accepté, éditeur et contact public confirmés). Commit sur `lot/confidentialite-assetlinks` ;
fusion `--ff-only` dans `main` sur accord séparé. Restent à l'utilisateur : déploiement, `curl.exe`
sur `/.well-known/assetlinks.json`, relecture sur appareil réel.
