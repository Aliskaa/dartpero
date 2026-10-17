# Lot `vocabulaire-anglais` — orchestration

## Objectif

Mots de darts à l'anglaise (lot A de `docs/prospective/2026-10-17-NEW-retours-beta-testeurs.md`,
retours 1, 5, 6) : « bust » et « checkout » dits en `en-US` à la voix (annonces en segments typés
par langue, anticipation i18n) ; « Sortie » devient « Checkout » partout à l'écran ; « 0 » devient
« Hors » dans les statistiques (affichage seul). Détail : `request.md`.

**Hors périmètre :** traduction / choix de langue (i18n), moyenne de « Hors » par partie (lot B),
phrases de victoire (lot E), règle de jeu, événement, format persisté, identifiant de code.

## Niveau

light

## Branche

`lot/vocabulaire-anglais` — créée depuis `main` avant l'Architecture, fusionnée en `--ff-only` après
accord. **Lot en parallèle** : worktree `C:\Users\kevin\Documents\Flechettes-vocabulaire-anglais`,
port réservé aux captures du Dev : **5201**.

## Provenance

Intake validé le 2026-10-17. Source `docs/request/vocabulaire-anglais.md`, copiée octet pour octet
vers `docs/lots/vocabulaire-anglais/request.md` (hachages identiques, 2026-10-17). Validation : en-tête,
statut `Validé`, niveau `light` = niveau demandé, commande manuelle exacte, sections complètes, zéro
question bloquante. Index d'architecture à jour (aucune source plus récente).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | Rapport complet, light confirmé |
| 2 | `archi-designer` | — | — |
| 3 | `archi-authority` | — | — |

Agent retenu : `archi-scout` (sonnet, effort bas)

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite | `test` | `03-plan-de-test.md` |
| Sécurité | Hors niveau | `sec` | `04-revue-securite.md` |
| Revue | Hors niveau | `review` | `05-revue.md` |
| Échanges | Faite | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| 5 questions produit (formulation « Checkout libre », pluriel, `BlocCible` « Hors », phrase d'essai, `AIDE_ANNONCER_VOLEES`) | `01-architecture.md` | Utilisateur | Close (réponses du 2026-10-17, `01-architecture.md`) |
| Dev Q1-Q3 : aria-label « Reste à finir » ; boutons « Libre / Sur un double » ; puce ajoutée à `CLAUDE.md` | `02-dev-notes.md` | Utilisateur | Close (2026-10-17 : checkout partout, puce validée) |
| Test Q4 : « le premier qui sort » (`aideManches`) → « fait le checkout » ? | `03-plan-de-test.md` | Utilisateur | Close (2026-10-17 : « le premier qui fait le checkout », `aideManches` corrigé) |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-17 | Niveau `light` | Aucune surface gravée annoncée (port `Announcer` côté application, libellés, adapter). À requalifier en `high` si l'architecture touche le domaine ou un format persisté. |
| 2026-10-17 | Architecture : `archi-scout` (sonnet, effort bas) PASS ; 5 questions produit closes par l'utilisateur | Rapport complet, aucune surface gravée |
| 2026-10-17 | Dev : `dev` (sonnet, medium) ×2 (implémentation, correctifs Q1-Q2) ; Q1-Q3 closes | Réponses de l'utilisateur |
| 2026-10-17 | Q4 : « le premier qui fait le checkout » ; relecture à l'écran : `ecran` sans shell, refaite par `general-purpose` ; débordements corrigés (option A, tracking) par `dev` ×4 au total | Réponses de l'utilisateur |
| 2026-10-17 | Port 5201 réservé aux captures du Dev | Lot mené en parallèle (worktree) |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| — | — | — | — | — |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
