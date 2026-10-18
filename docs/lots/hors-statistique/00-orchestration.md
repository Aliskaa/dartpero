# Lot `hors-statistique` — orchestration

## Objectif

Lot B des retours beta-testeurs (retours 2 et 4) : la touche « Hors » du pavé de saisie passe en
rouge (texte et bordure), et Statistiques affiche, sous la colonne « hors cible », une ligne
« Hors cible par partie 2,6 sur 16 parties » (`hits.missed ÷ matchesPlayed`, calcul dans un
helper pur de `src/ui`). Total à zéro : colonne « 0 », ligne « 0,0 par partie ». Détail :
`request.md`.

**Hors périmètre :** résumé de partie (`CarteImpacts`), autres statistiques, tri des joueurs,
format persisté, tout `src/core/` (aucun champ ajouté à `CareerStats`), phrases de victoire (lot E).

## Niveau

light

## Branche

`lot/hors-statistique` — créée depuis `main` avant l'Architecture (déjà présente à la reprise de
session, `git switch` inutile), fusionnée en `--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/hors-statistique.md` (statut Validé, 2026-10-18, niveau
`light`, commande conforme, toutes les sections, zéro question bloquante), snapshot copié octet
pour octet vers `request.md` le 2026-10-18 (SHA-256 identique, `7FE49BC7…6063`). Planche validée :
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\hors\hors.html`
(<https://claude.ai/artifact/3NiEtCXcC6xaFmEFd1qFkB>), à passer à chaque agent d'architecture.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | Planche lue, aucune surface gravée, aucune décision produit prise |
| 2 | `archi-designer` | Non lancé | Scout PASS |
| 3 | `archi-authority` | Non lancé | Scout PASS |

Agent retenu : `archi-scout` (sonnet, effort low d'après son frontmatter)

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite (question 1 reportée au Dev, voir journal) | chaîne scout → designer → authority | `01-architecture.md` |
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
| Jeton rouge de la touche : nouveau jeton général ou élargissement de la garde de `rouge-texte` | Demande (non bloquante) | Architecture | Close : jeton général `rouge-touche` (`01-architecture.md`) |
| Rouge de touche en thème clair légèrement plus foncé que `#a81f25` de la planche, si le contraste ≥ 4,5:1 l'exige | `01-architecture.md` question 1 (produit) | Utilisateur | Close par la mesure du Dev : `#a81f25` tient 5,18:1 sur `feutre`, valeur de la planche gardée, aucun écart (`02-dev-notes.md`) |

| Arrondi à mi-chemin (0,25 → « 0,3 » ?) à figer par un test ou non | `03-plan-de-test.md` question 1 | Utilisateur | Ouverte, **non bloquante** (comportement ICU, hors critères de la demande) |
| Bordure rouge à l'appui sous 3:1 (~1,9–2,0:1) | `03-plan-de-test.md` question 2 | Utilisateur | Ouverte, **non bloquante**, à trancher à la relecture à l'écran |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-18 | Niveau `light` confirmé ; aucune surface gravée (UI seule, `src/core` intact). Chaîne démarrée au scout. | Demande validée, option A (division dans l'UI). |
| 2026-10-18 | Go Dev de l'utilisateur (« dev ») sans réponse à la question 1 (rouge clair plus foncé). Le Dev mesure le fond réel : `#a81f25` si ≥ 4,5:1 ; sinon il s'arrête et remonte la mesure, **sans choisir une teinte** (point produit). | Une question produit ne se tranche pas à la place de l'utilisateur. |
| 2026-10-18 | Dev lancé : `dev`, sonnet, effort medium (frontmatter). | Lot `light`, aucune surface gravée. |
| 2026-10-18 | Test : `test`, sonnet, effort high, **lecture seule sans outil d'exécution** ; lint, typecheck, vitest, build relancés par l'Orchestrator (verts). | Le sous-agent n'avait que Read/Grep/Glob. |
| 2026-10-18 | Boucle 1 tour 1 : `dev` (sonnet, medium) relancé sur 3 défauts mineurs de Test ; contrôles relancés par l'Orchestrator, verts. | Charte périmée, commentaire, garde souple. |
| 2026-10-18 | `.ai/architecture-context.md` non périmé (aucune source plus récente, arbre propre hors la demande). | Comparaison des `git log -1 --format=%ct`. |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | Charte périmée (« Hors » en `craie-3`), commentaire de test périmé, garde `themeBoundary` trop souple | Corrigé ; lint, typecheck, 1583 tests, build verts (relancés par l'Orchestrator) |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
