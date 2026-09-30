# Lot `<id-du-lot>` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu (`archi-scout` /
> `archi-designer` / `archi-authority`). Le rapport source commence par
> `Architecture result: PASS`.

## Problème

<Reformulé, pas recopié de l'objectif.>

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| — | — | — |

## Approche retenue

<Et pourquoi celle-ci.>

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | — |
| `core/application/` | — | — |
| `infrastructure/` | — | — |
| `ui/` | — | — |
| `composition/` | — | — |
| `tests/` | — | — |

**Sens des dépendances vérifié :** `ui`/`infrastructure` → `application` → `domain`.
**Nouveau port ?** <lequel, et quel est son premier consommateur>

## Décisions de `CLAUDE.md` concernées

<Celles qui s'appliquent, et celles qu'il faudra graver à la fin du lot.>

## Baseline sécurité

<Frontières touchées (import JSON, format persisté, rendu d'une saisie, dépendance, service
worker), risques, mitigations, résiduels + owner. Ne remplace pas `04-revue-securite.md`.>

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | — | Dev / Test / Sécurité |

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
