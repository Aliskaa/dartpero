# Lot `<id-du-lot>` — orchestration

## Objectif

<Ce que le lot doit livrer, en quelques lignes. Rempli par l'Orchestrator à partir du contexte
d'architecture, de docs/PROJECT_PLAN.md et de la demande. Si un intake existe : s'appuyer sur
request.md sans le réécrire. Si le lot vient d'un audit : citer docs/audits/<AAAA-MM-JJ>.md et
la ligne « Lots candidats » (ex. « § 1 »). Ne demander à l'utilisateur que si le périmètre
reste ambigu.>

**Hors périmètre :** <ce qu'on ne fait délibérément pas dans ce lot>

## Niveau

<`high` (défaut) ou `light`. `light` interdit sur une surface gravée : domaine, couture
GameMode, format persisté (MatchEvent, Dexie, backupSchema), service worker / firebase.json,
règle gravée de CLAUDE.md.>

high

## Provenance

<Intake validé (`request.md`, source, date de copie) ou « orchestration directe, pas d'intake ».>

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | — | — |
| 2 | `archi-designer` | — | — |
| 3 | `archi-authority` | — | — |

Agent retenu : <scout / designer / authority>

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Pas commencée | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Pas commencée | `dev` | `02-dev-notes.md` |
| Test | Pas commencée | `test` | `03-plan-de-test.md` |
| Sécurité | Pas commencée | `sec` | `04-revue-securite.md` |
| Revue | Pas commencée | `review` | `05-revue.md` |
| Échanges | Pas commencée | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| — | — | — | — |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| — | — | — |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| — | — | — | — | — |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
