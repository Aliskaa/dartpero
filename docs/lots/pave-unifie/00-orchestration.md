# Lot `pave-unifie` — orchestration

## Objectif

Un pavé de saisie commun aux quatre jeux (placement b de la planche, celui de la maquette X01
validée) :
- grille, puis une rangée Bulle · Hors · Annuler, puis le rail Simple / Double / Triple en
  pleine largeur ; pas de rail au Tour du monde ;
- X01 : « 25 » / « 0 » deviennent Bulle / Hors ;
- Cricket : grille 3 × 2 et multiplicateur gradué ;
- Tour du monde : volées et Annuler sans « S » ;
- paysage calé en bas.

Inversion à l'appui corrigée (P1). Accents par mode retirés : laiton unique partout (écrans de
partie, résumés, cartes, choix du jeu), titre du bandeau ≥ 4,5:1 en clair. Charte mise à jour.
Détail et critères 1 à 8 : [request.md](./request.md) ; planche :
<https://claude.ai/artifact/PcAQwsEnY122TUjp9GCqgu>.

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 6 (6b) du
§ Découpage en lots et § Lot 6.

**Hors périmètre :**
- « Hors » sur la feuille et `Dart.label` ;
- la durée de l'appui (90 / 100 ms) ;
- les cartes de partie (lot 7) ;
- les règles de jeu, les formats persistés, `CLAUDE.md`.

## Niveau

`light` — aucune surface gravée (UI et tokens ; le pavé envoie les mêmes fléchettes).

light

## Branche

`lot/pave-unifie` — créée depuis `main` (`9620984`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/pave-unifie.md` (validé le 2026-10-14), copié octet pour
octet vers `docs/lots/pave-unifie/request.md` le 2026-10-14 (empreintes SHA-256 identiques).
Validation : en-tête, statut `Validé`, date, niveau `light` = niveau demandé, commande exacte,
toutes les sections, zéro question bloquante — conforme. Une première invocation
(`pave-unifie light*`) a été refusée : niveau invalide.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | — |
| 2 | `archi-designer` | non lancé | scout en PASS (planche non lue : compensé par la relecture de l'Orchestrator, §§ 10-16) |
| 3 | `archi-authority` | non lancé | aucune surface gravée |

Agent retenu : scout

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
| 2026-10-14 | Invocation `/orchestrate pave-unifie light*` refusée, relancée en `light` par l'utilisateur | Niveau hors de `high` / `light` |
| 2026-10-14 | Index `.ai/architecture-context.md` à jour, non régénéré | Aucune source plus récente que son dernier commit |
| 2026-10-14 | Niveau `light` confirmé | Intake `light`, aucune surface gravée |
| 2026-10-14 | La modification de l'étude (choix du lot 6b) voyage avec la branche | Faite pendant l'intake de ce lot |
| 2026-10-14 | Architecture : `archi-scout` (sonnet / low, frontmatter), PASS en 1 tentative | `PaveSaisie` commun, P1 par variable `--texte-touche` en une couche, accents retirés, `laiton-clair` clair `#614a08` ; 4 étapes |
| 2026-10-14 | Orchestrator : §§ 10-16 « Conformité à la planche » ajoutés à `01-architecture.md` | Le scout n'a pas lu la planche ; préférence de l'utilisateur (relecture contre les maquettes) |
| 2026-10-14 | Gate Architecture : Q1-Q4 closes ; Qa-Qc laissées au Dev (sans décision produit) | En attente du go |
| 2026-10-14 | Go de l'utilisateur (« oui vas y pour le dev ») ; Architecture passée à Faite | Arrêt Archi → Dev levé |
| 2026-10-14 | Dev : `dev` (sonnet / medium, maxTurns 100, frontmatter) | Plan en 4 étapes |
| 2026-10-14 | Dev terminé en 1 lancement ; contrôles relancés par l'Orchestrator : lint, typecheck, 975 tests, build verts, encodage propre | Qa-Qc répondues dans `02-dev-notes.md`, 3 ajustements, aucune refonte |
| 2026-10-14 | Test : `test` (sonnet / high, frontmatter) | Gate Dev passé, aucune question ouverte |
| 2026-10-14 | Test PASS ; boucle 1 sur N5 / N3 ; Q1-Q4 closes dans `03-plan-de-test.md` | N2 conforme à la planche (0,04 em = autre placement), N1 en dette, `text-laiton` petit texte préexistant consigné hors lot |
| 2026-10-14 | Test #2 (sonnet / high) PASS ; T2-1, T2-2 closes | `git diff main` : liens « Retour… » préexistants |
| 2026-10-14 | Index régénéré (`architecture-context`, sonnet / high) ; #22 (CONVENTIONS § 13) et #23 (CHARTE:63) corrigés à la source par l'Orchestrator, retirés de l'index : 148 lignes, 13 000 octets | Charte modifiée par le lot |
| 2026-10-14 | `06-echanges.md` écrit ; arrêt de fin de lot | En attente du go |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | N5 : `text-laiton` (#8a6d12 en clair, ≈ 3,5:1) sur du petit texte des résumés, hérité du remplacement mécanique de `text-accent-mode` (Tour du monde et Cricket avaient un accent plus foncé) ; trous de couverture N3 | Corrigé (même agent `dev`, repris par SendMessage) : 2 rangs en `text-laiton-clair`, tests ajoutés ; 979 tests verts, contrôles relancés par l'Orchestrator |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
