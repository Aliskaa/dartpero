# Lot `phrases-victoire` — orchestration

## Objectif

Retour 7 des beta-testeurs (lot E de `docs/prospective/2026-10-17-NEW-retours-beta-testeurs.md`) :
la voix **dit une phrase de victoire** à la victoire. Détail dans `request.md` (snapshot de l'intake).

- 5 phrases ajoutées à `PHRASE_VICTOIRE` (9 au total) ;
- dite après *Valider la sortie*, en **un seul `say`** avec l'annonce existante ;
- X01 : victoire du **match** seulement ; Cricket : fléchette gagnante ; Tour du monde : **fin de
  partie** (pas de phrase en match nul) ; entraînement : aucune ;
- même phrase que le résumé (`phraseVictoire(identifiant de la partie)`), rien de stocké.

**Hors périmètre :** règle de jeu, format persisté, nouvelle préférence, nom du vainqueur dans la
phrase, phrases en anglais.

## Niveau

light

Ni `src/core/domain/`, ni couture `GameMode`, ni format persisté, ni service worker : `light`
autorisé (confirmé à l'intake).

## Branche

`lot/phrases-victoire` — worktree `Flechettes-phrases-victoire` (lot en parallèle), fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/phrases-victoire.md` (2026-10-18), copié octet pour octet vers
`docs/lots/phrases-victoire/request.md` le 2026-10-18 (SHA-256 identique, en-tête, statut `Validé`,
niveau `light` = `validated_level`, commande manuelle exacte, sections complètes, zéro question
bloquante). Index d'architecture à jour (aucune source plus récente).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | Rapport complet, aucune surface gravée, aucune question produit |
| 2 | `archi-designer` | Non lancé | Scout en PASS |
| 3 | `archi-authority` | Non lancé | Scout en PASS |

Agent retenu : `archi-scout` (sonnet, effort bas — frontmatter)

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
| — | — | — | — |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-18 | Session ouverte en `light`, sur la branche `lot/phrases-victoire` déjà présente (worktree) | Intake validé ; aucune surface gravée touchée |
| 2026-10-18 | Architecture : `archi-scout` (sonnet, low) → PASS ; designer et authority non lancés | Aucune surface gravée, aucune question produit |
| 2026-10-18 | Arrêt Archi → Dev : l'utilisateur a demandé `dev` | Confirmation reçue |
| 2026-10-18 | Dev : `dev` (sonnet, medium) ; Orchestrator : questions 1 à 3 de l'architecture closes (02-dev-notes) | Ordre « Tour bouclé ! » puis phrase testé |
| 2026-10-18 | Test : `test` (sonnet, high) sans outil d'exécution ; commandes lancées par l'Orchestrator | Le sous-agent n'a que Read, Grep, Glob malgré son brief |
| 2026-10-18 | Lacunes T1-T4 classées « problème de test » → boucle 1 vers Dev (tests seuls) | Couverture : voix coupée, résumé TdM, entraînement à vide, *Corriger* |
| 2026-10-18 | Index d'architecture régénéré (`architecture-context`, sonnet, high) | `CLAUDE.md` et `CONVENTIONS` modifiés par le lot |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | Lacunes de couverture T1-T4 (aucun bug d'implémentation) | Corrigé : 5 tests ajoutés, 1590 verts |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
