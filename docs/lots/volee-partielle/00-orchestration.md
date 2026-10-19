# Lot `volee-partielle` — orchestration

## Objectif

Les fléchettes déjà saisies dans la volée en cours survivent à un rechargement (Android qui tue la
PWA, iOS qui la recharge). Aujourd'hui `dartsEnCours` est un `useState` des quatre hooks de mode et
elles disparaissent sans message. Solution tranchée à l'intake : un **brouillon de volée** (une ligne
par partie, table Dexie dédiée, `db.version(3)`), écrit à chaque fléchette, lu à l'ouverture de la
partie, effacé à l'enregistrement de la volée ; les **quatre modes** ; **jamais exporté** (`backupSchema`
et `BACKUP_VERSION` inchangés) ; reprise **silencieuse** ; la volée rouverte par « Annuler » (lot
`annulation-volee`) devient durable. Détail : `request.md` (snapshot de `docs/request/volee-partielle.md`).

Origine : constat hors charte de `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`
(lot 13).

**Hors périmètre :** événement de journal par fléchette ; `backupSchema` / export du brouillon ;
`localStorage` ; bandeau ou message à la reprise (donc pas de planche) ; brouillon multiple par
partie ; synchronisation.

## Niveau

`high`. Surface gravée : schéma Dexie et migration (format persisté), et décision gravée du lot
`annulation-volee` (volée rouverte « non persistée ») que ce lot renverse.

high

## Branche

`lot/volee-partielle` — créée depuis `main` (`a4b19b9`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/volee-partielle.md` (statut Validé, 2026-10-19, niveau `high`,
commande exacte, zéro question bloquante, toutes les sections présentes). Snapshot
`docs/lots/volee-partielle/request.md` copié le 2026-10-19, octet pour octet (SHA-256
`59C4C1B8…E32B`, identique à la source).

## Architecture — chaîne

Surface gravée annoncée par l'intake : la chaîne démarre à `archi-authority` (scout et designer
sautés, `orchestrate` § Chaîne d'architecture).

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée (format persisté) |
| 2 | `archi-designer` | Sauté | Surface gravée (format persisté) |
| 3 | `archi-authority` | PASS | Plafond de 40 tours atteint sans rapport ; rapport rendu après relance, sans nouvelle lecture. Non vérifié : voir `01-architecture.md` |

Agent retenu : `archi-authority`

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | `archi-authority` (scout, designer sautés) | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite (GO ; trous T1-T6 comblés, 1685 tests verts ; mutations manuelles non faites, voir `03`) | `test` | `03-plan-de-test.md` |
| Sécurité | Faite (GO ; Q-T2 à l'utilisateur) | `sec` | `04-revue-securite.md` |
| Revue | Faite (NO-GO conditionnel : Q-T2, signatures, passage doc ; voir `05`) | `review` | `05-revue.md` |
| Échanges | Faite | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| Clé de cohérence du brouillon (longueur du journal ou dernier événement) | `request.md`, non bloquante | `archi-authority` | Close : `visitCount` de l'état affiché (`01-architecture.md`) |
| Texte et date de `SECTIONS_CONFIDENTIALITE` à mettre à jour ? | `request.md`, non bloquante | `archi-authority`, puis Revue | Close en option A (inchangés) ; Revue relit chaque phrase |
| **Q1** : « restaurer » fusionne, il ne remplace pas la base. A : effacer seulement le brouillon des parties remplacées ; B : effacer tous les brouillons à chaque import (politique à changer) | `01-architecture.md` (F1) | **Utilisateur**, à l'arrêt Archi → Dev | Close le 2026-10-19 : **option A** (seul le brouillon d'une partie remplacée est effacé ; politique inchangée) |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-19 | Index d'architecture jugé à jour, non régénéré | Horodatage du dernier commit de l'index égal à celui de `CLAUDE.md` et `CONVENTIONS` ; aucune source modifiée dans l'arbre. Son texte parle encore du lot E comme non fusionné : à lire avec ce recul, ne pas le suivre |
| 2026-10-19 | Chaîne démarrée à `archi-authority`, `dev` / `test` / `sec` en `opus` | Format persisté (surface gravée), `orchestrate` § Monter en gamme |
| 2026-10-19 | Lot mené dans le dépôt principal, sans worktree | Aucun autre lot en cours |
| 2026-10-19 | `archi-authority` lancé en opus / effort max (frontmatter), 2 invocations (plafond de 40 tours, puis relance pour le rapport) | Surface gravée |
| 2026-10-19 | Q1 tranchée par l'utilisateur : option A. Sa réponse (« A ») a été prise pour le go de l'arrêt Archi → Dev, la question posée contenant « puis-je lancer Dev ? » | Politique `/confidentialite` inchangée |

| 2026-10-19 | Phase Dev : `dev` opus, 1 lancement. Phase Test : `test` opus, 1 lancement, verdict GO, aucun bug d'implémentation | Surface gravée |
| 2026-10-19 | Trous de test T1-T6 et préconditions comblés par un 2e lancement `dev` (opus) limité à `tests/`, **lancé en parallèle de `sec`** (qui lit le code source, pas les tests) | T1 (échec de lecture → spinner sans fin) et T2 (N-1) recommandés avant fusion par Test ; ce n'est pas une boucle 1 (aucun bug d'implémentation) |

| 2026-10-19 | Phase Sécurité : `sec` opus, 2 lancements (plafond de 30 tours, puis rapport). Phase Revue : `review` opus, 2 lancements (plafond de 40 tours, puis rapport) ; verdict NO-GO conditionnel, aucun renvoi Archi ni Sécurité | Voir `04`, `05` |
| 2026-10-19 | **Décisions de l'utilisateur** à l'arrêt de fin : Q-T2 → garder l'ordre actuel (refuser plutôt qu'avaler) ; R1, R3 et C1 **acceptés par l'utilisateur** ; mutations T1-T6 acceptées non faites ; correctifs de la Revue (C2, N-1 dans trois modes, `MODES` typée, test de Q-T2) à faire avant fusion | Réponses aux quatre questions posées |

## Historique des corrections

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | Revue → Dev / Test (facultative, validée par l'utilisateur) | `review` → `dev` (3e lancement) | Constats 2, 3, 4, 6 de `05-revue.md` | Fait : C2 (`try/catch/finally` dans `useVoleeEnCours.ts`), Q-T2 figée par deux tests, N-1 dans Cricket, Tour du monde et entraînement, `MODES` typée sur `GameModeId`. Mutations **faites et remises en place** par `dev` (C2, ordre Q-T2, effacement avant l'`await` dans trois hooks). Orchestrator : lint, typecheck propres, **1691 tests verts**, build OK, grep d'accents RAS |

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| — | — | — | — | — |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
