# Lot `pictogrammes` — orchestration

## Objectif

Créer le jeu de 12 pictogrammes maison validé sur la planche (4 modes, 8 moments) dans un
composant commun en `currentColor`, `aria-hidden`, minimum 20 px ; l'employer là où l'app a déjà
une icône équivalente : les 4 modes de l'étape 1 de Nouvelle partie (40 px), les 5 couronnes du
vainqueur (« victoire » en laiton dans tous les jeux), la poignée de main du match nul (« nul » en
craie), les 3 cibles devant une sortie (« sortie » en vert). Charte § Identité. Géométrie de
référence dans la demande. Détail et critères 1 à 7 : [request.md](./request.md).

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 4 du § Découpage en
lots.

**Hors périmètre :** autres usages des pictogrammes (lignes de feuille, badges, stats, bandeau,
filtres, écran vide) ; `CircleOff` et `Flag` restent en `lucide` ; couleurs des modes (lot 6).

## Niveau

`light` — aucune surface gravée.

light

## Branche

`lot/pictogrammes` — créée depuis `main` (`6d5f56f`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/pictogrammes.md` (validé le 2026-10-13), copié octet pour
octet vers `docs/lots/pictogrammes/request.md` le 2026-10-13 (empreintes identiques). Validation :
en-tête, statut `Validé`, date, niveau `light` = niveau demandé, commande exacte, toutes les
sections, zéro question bloquante — conforme.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | — |
| 2 | `archi-designer` | non lancé | scout en PASS |
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
| 2026-10-13 | `.ai/architecture-context.md` jugé à jour selon la règle | Commité dans le même commit (`6d5f56f`) que la charte et `rules/`. Son contenu date du début du lot 3 : les agents lisent la charte (§ Typographie, § Mouvement, § Identité) à la source |
| 2026-10-13 | Niveau `light` confirmé | Intake `light`, aucune surface gravée |
| 2026-10-13 | Architecture : `archi-scout` (sonnet / low, frontmatter), PASS en 1 tentative | Composant `Pictogramme` (`nom`, `taille` fermée ≥ 20), tracés fixes en grille 24, garde `pictogrammesBoundary` |
| 2026-10-13 | Gate Architecture : 1 question close (fillOpacity 0,9 conservé, géométrie de la planche) | — |
| 2026-10-13 | Arrêt Archi → Dev : go de l'utilisateur (« oui ») | Arrêt obligatoire |
| 2026-10-13 | Dev : `dev` (sonnet / medium, maxTurns 100, frontmatter), 1 passe | 849 verts, build OK revérifiés ; tracés comparés à la planche par l'Orchestrator (écart d'arrondi de 0,01) |
| 2026-10-13 | Gate Dev : 2 questions de `02-dev-notes.md` adressées à Test | Fidélité visuelle ; mot « vainqueur » des couronnes de ligne |
| 2026-10-13 | Test passe 1 : `test` (sonnet / high), sans shell — GO ; Q2, O-Q1, O1 renvoyés par l'Orchestrator | `sr-only` plutôt qu'adoucir la charte ; tests peu coûteux qui figent la planche |
| 2026-10-13 | Boucle 1, tour 1 : `dev` (sonnet / medium) | Q2, O-Q1, O1 |
| 2026-10-14 | Test passe 2 : `test` (sonnet / high), sans shell — GO ; P2-1 à P2-4 renvoyés | Q2 protégée sur 1 couronne sur 4 seulement |
| 2026-10-14 | Boucle 1, tour 2 : `dev` (sonnet / medium) | Tests et deux commentaires, aucun comportement changé |
| 2026-10-14 | Test passe 3 : `test` (sonnet / high), sans shell — GO ; P3-1 laissée en dette (lot 9) | Non exigée, visible à l'écran |
| 2026-10-14 | `CLAUDE.md` inchangé ; index non régénéré dans ce lot | La charte change (§ Identité) : le prochain `/orchestrate` le régénérera |
| 2026-10-14 | Arrêt fin de lot : go de l'utilisateur (« Oui commit et fusionne ») | Commit sur `lot/pictogrammes` puis fusion `--ff-only` ; relecture à l'écran non notée |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | Q2 : `sr-only` « vainqueur » sur les 4 couronnes de ligne ; O-Q1 : tracés figés par un test ; O1 : tests de rendu (étape 1 en 40 px, couronne et nul du résumé) | Corrigé : `LIBELLE_VAINQUEUR = 'vainqueur'` (minuscule : « Vainqueur » faisait matcher les `findByText` du résumé) en `sr-only` « , vainqueur » sur les 4 couronnes ; `resumeX01.test.tsx` adapté (en-tête de colonne « Kevin, vainqueur ») ; tracés figés par `innerHTML` attendu (contre-épreuve : `bust` modifié → rouge) ; nouveau `pictogrammesEmplacements.test.tsx`. Revérifié : lint OK, typecheck OK, 864 verts, build OK |
| 2 | 1 | Test → Dev | Test passe 2 (GO) : P2-1 (`sr-only` testé sur les 3 autres lignes), P2-2 (emplacements identifiés par le tracé), P2-3 (racine du `<svg>` assertée), P2-4 (commentaires) | Corrigé : `vainqueurLecteurEcran.test.tsx` (6 tests ; contre-épreuve : `sr-only` retiré de `LigneCible` → rouge) ; `tracesPictogrammes.ts` (module de test commun) ; emplacements identifiés par leur tracé ; racine `fill="none"` / `stroke-width="2"` assertée ; 2 commentaires. Revérifié : lint OK, typecheck OK, 870 verts, build OK, encodage sain |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
