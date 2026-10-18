# Lot `hors-statistique` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport du sous-agent `sec`. Niveau `high` seulement.

## Menaces considérées

<Quoi, pour qui : le joueur qui tape les scores / un fichier de sauvegarde reçu d'un pote /
une dépendance / un déploiement.>

## Surfaces vérifiées sur le diff

| Surface | Touchée par le lot ? | Vérifié |
|---|---|---|
| Zéro réseau (`fetch`, SDK `firebase`) | — | — |
| Import JSON / `backupSchema` | — | — |
| Rendu d'une saisie (pseudo, fichier) | — | — |
| Format persisté (Dexie, `MatchEvent`) | — | — |
| Service worker / `firebase.json` | — | — |
| Permissions navigateur | — | — |
| Dépendances (`npm audit`) | — | — |
| Secrets | — | — |

## Constats

| # | Sévérité | `fichier:ligne` | Scénario | Classement |
|---|---|---|---|---|
| 1 | — | — | — | Bug d'implémentation / Faille de design |

## Mitigations

<Ou confirmation d'absence de risque significatif.>

## Risques acceptés

<Uniquement ceux déjà signés explicitement par l'utilisateur — jamais auto-attribués.>

<!-- Si le lot ne touche aucune surface : écrire « RAS sécu » et dire ce qui a été vérifié. -->
