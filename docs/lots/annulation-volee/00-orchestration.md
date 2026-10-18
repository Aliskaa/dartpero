# Lot `annulation-volee` — orchestration

## Objectif

Retours 8 et 3 des beta-testeurs (`docs/prospective/2026-10-17-NEW-retours-beta-testeurs.md`, lots C
et D fondus ; détail dans `request.md`) :

- **Annuler une fléchette à la fois** : un appui retire la dernière fléchette jouée, quel que soit le
  joueur ; la volée enregistrée se rouvre (bust défait, manche gagnée défaite, deux joueurs). Quatre
  modes. Touche « Annuler S5 », joueur dans le nom accessible seulement ; pause anti-réflexe conservée.
- **Confirmer la sortie** (forme B, boîte « Kevin sort sur D10 ? », *Corriger* / *Valider la sortie*) :
  X01 à chaque manche gagnée, Cricket à la fléchette qui gagne, Tour du monde à la fléchette qui boucle
  le parcours ; **pas** à l'entraînement ; **jamais** sur un bust.

Planche à suivre à l'identique :
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\annulation\annulation.html`
(<https://claude.ai/artifact/6kxertheaGd44qgbRidnsv>).

**Hors périmètre :** toute règle de jeu ; phrases de victoire (E), vocabulaire (A), « Hors » (B) ;
la forme A de la planche.

## Niveau

high — surfaces gravées : `UndoLastVisit`, journal d'événements (`VisitRecorded`), fin de partie.

## Branche

`lot/annulation-volee` — worktree `C:\Users\kevin\Documents\Flechettes-annulation-volee`, créée depuis
`main`, fusionnée en `--ff-only` après accord. **Lot en parallèle** (mode worktrees, PARALLELE.md) ;
**port de capture réservé : 5202**.

## Provenance

Intake validé : source `docs/request/annulation-volee.md` (Validé, 2026-10-17, niveau `high`, commande
conforme, zéro question bloquante, toutes sections présentes) ; snapshot copié octet pour octet vers
`docs/lots/annulation-volee/request.md` le 2026-10-17 (empreintes identiques).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée annoncée par l'intake |
| 2 | `archi-designer` | Sauté | Idem |
| 3 | `archi-authority` | PASS | 1er passage : `maxTurns` (40) atteint sans rapport ; relancé par message, rapport rendu |

Agent retenu : `archi-authority` (opus / max)

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite | `test` | `03-plan-de-test.md` |
| Sécurité | Faite | `sec` | `04-revue-securite.md` |
| Revue | Faite | `review` | `05-revue.md` |
| Échanges | Faite | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| U1 : textes de la boîte au Cricket et au Tour du monde | `01-architecture.md` | Utilisateur | Close (2026-10-17) |
| U2 : cut-throat, la boîte s'ouvre-t-elle et quel nom | `01-architecture.md` | Utilisateur | Close : nom du gagnant |
| U3 : fermer la boîte sans choisir (retour, Échap, voile) | `01-architecture.md` | Utilisateur | Close : comme *Corriger* |
| U4-U10 : défauts proposés (non bloquants) | `01-architecture.md` | Utilisateur | Close : tous confirmés |
| N-1 : échec d'écriture après *Valider* (fléchette en attente, boîte non rouverte) | `03-plan-de-test.md`, `04-revue-securite.md` | Utilisateur | Close (2026-10-18) : accepté tel quel |
| Garde de 500 ms absente après *Valider* (appui fantôme sur le joueur suivant) | `05-revue.md` (2e passe) | Utilisateur | Close (2026-10-18) : garde étendue à *Valider* (boucle 4) |
| Q1-Q4 : textes de la boîte (bulle du Tour du monde, texte Cricket, X01 hors manche simple, Tour du monde dernier joueur) | `02-dev-notes.md` | Utilisateur | Close (2026-10-17) : les quatre défauts de Dev confirmés tels quels (« sur 25 », texte Cricket, X01 identique, TdM tel quel) |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-17 | `.ai/architecture-context.md` jugé à jour (même commit que ses sources, arbre propre) | Prérequis de la skill |
| 2026-10-17 | Chaîne démarrée à `archi-authority` (opus / max) ; `dev`, `test`, `sec` en opus | Surface gravée annoncée (« Monter en gamme ») |
| 2026-10-17 | Phase Test : `test` (opus, 1 lancement) sans outil d'exécution ; lint / typecheck / vitest / build rejoués par l'Orchestrator. Dev relancé une fois (boucle 1) | Constats I-1, C-1..C-6, T-1 ; N-1 remonté à l'utilisateur |
| 2026-10-17 | Phase Sécurité : `sec` (opus, effort du frontmatter high, 1 lancement + 1 relance après `maxTurns`) sans shell ; verdict RAS sécu ; `git diff`, `npm audit` (0 vulnérabilité) et grep de `dist/` faits par l'Orchestrator | N-1 reste une question de comportement pour l'utilisateur |
| 2026-10-17 | `01-architecture.md` écrit ; statut Bloquée sur U1-U3 puis close | Questions produit absentes de la demande et de la planche : jamais tranchées par l'Orchestrator |
| 2026-10-17 | CLAUDE.md (puce gravée) et PROJECT_PLAN § 4 / § 6 mis à jour, index régénéré (`architecture-context`, sonnet, 18e passe) avant la Revue | Exigence de la skill et de la Revue |
| 2026-10-18 | Revue, 1re passe (`review`, opus, 1 lancement + 1 relance après `maxTurns`, sans shell) : no-go conditionnel (N-1 et relecture à l'écran), constats 2-5 documentation | Boucle 5, tour 1 |
| 2026-10-18 | Index régénéré une 2e fois (19e passe) après les changements de CONVENTIONS / rules / charte | Index périmé par les boucles 5 et 3 |
| 2026-10-18 | Revue, 3e passe (`review`, opus, sans shell), ciblée sur la boucle 4 puis verdict final : **go** ; retouches mineures (commentaires des écrans, vocabulaire « entrée à part », annotation de `03`) faites par l'Orchestrator ; `05-revue.md` et `06-echanges.md` écrits | Plafond de boucles : 4 sur 5 utilisés |
| 2026-10-18 | Revue, 2e passe (`review`, opus, sans shell) : no-go conditionnel sur la garde absente après *Valider* ; l'utilisateur décide d'étendre la garde (restriction « pas après Valider » venue du brief de l'Orchestrator, pas de l'utilisateur) | Boucle 4, tour 4 sur 5 |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | I-1 : double dépilage de l'entrée `confirmation` sous `StrictMode` (+ couvertures C-1 à C-6, T-1) | Corrigé ; 1545 tests verts, rejoué par l'Orchestrateur |
| 2 | 5 | Revue → Dev | Constats 2-5 : écart 6 non justifié, clé `confirmation` et § 14 de CONVENTIONS, `rules/frontend-react.md`, PLAN § 0, commentaires (documentation seule) | Corrigé ; 1545 tests verts |
| 3 | 3-bis | Relecture à l'écran → Dev | Appui fantôme sur le pavé après *Corriger* (360×740) ; voile beige sur beige en clair (décisions de l'utilisateur) | Corrigé et re-vérifié à l'écran ; 1551 tests verts |
| 4 | 5 | Revue (2e passe) → Dev | Garde de 500 ms absente après *Valider* (constat 1), retouches de documentation (constats 3, 4) | Corrigé ; 1552 tests verts ; 3e passe de Revue : go |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
