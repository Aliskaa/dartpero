# Lot `nouvelle-partie-parcours` — orchestration

## Objectif

Lot 9 de la refonte (étude `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`
§ Découpage, § Nouvelle partie) : piste « Trois étapes, au propre » et fiche de réglages par jeu
— barre d'étapes, tuiles 2 × 2, nom de partie à l'étape 2, fiche de réglages par jeu (X01
« Plus de réglages », Cricket en deux cartes, Tour du monde résumé, entraînement), ordre en
feuille numérotée, « Tirer au sort » en mélange visible via un use case. Routes inchangées.
Détail : [`request.md`](request.md).

Planches validées (chemins absolus, hors git) :
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\derniers\derniers.html` (piste 1) et
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\reglages-jeux\reglages-jeux.html`.

**Hors périmètre :** « Rejouer » (lot 10), livre des règles (lot 11), plage réglable de
l'entraînement, toute règle ou option nouvelle, domaine / événements / Dexie / `backupSchema`.

## Niveau

`light` — confirmé : aucune surface gravée (routes et trois étapes inchangées, domaine et
formats persistés intacts ; le use case de tirage vit dans `application`, hors liste gravée).

light

## Branche

`lot/nouvelle-partie-parcours` — créée depuis `main` (`6109013`) avant l'Architecture, fusionnée en `--ff-only` après
accord.

**Lot en parallèle (worktree)** : `C:\Users\kevin\Documents\Flechettes-nouvelle-partie-parcours`,
en même temps que `statistiques-podium` (`..\Flechettes-statistiques-podium`). Port réservé
aux captures du Dev : **5202**.

## Provenance

Intake validé : source `docs/request/nouvelle-partie-parcours.md` (validée le 2026-10-15),
snapshot `docs/lots/nouvelle-partie-parcours/request.md` copié octet pour octet le 2026-10-15
(empreintes SHA-256 identiques). Validation : en-tête, statut `Validé`, date, niveau `light` =
niveau demandé, commande exacte, toutes les sections, zéro question bloquante — **OK**.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | Planches lues (HTML), écarts tranchés respectés, 9 questions produit listées sans être tranchées |
| 2 | `archi-designer` | non lancé | Scout en PASS |
| 3 | `archi-authority` | non lancé | Scout en PASS |

Agent retenu : scout

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite | `test` | `03-plan-de-test.md` |
| Sécurité | Hors niveau | — | — |
| Revue | Hors niveau | — | — |
| Échanges | Faite | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| Q1 — Tirage qui redonne le même ordre ; retour visible du tirage ? | `01-architecture.md` | Utilisateur | Close : vrai hasard + bref mouvement |
| Q2 — Forme, position et libellé du × des pastilles | `01-architecture.md` | Utilisateur | Close : comme aujourd'hui |
| Q3 — Sous-titre de l'étape Ordre pour Cricket et Tour du monde | `01-architecture.md` | Utilisateur | Close : jeu · réglage principal |
| Q4 — Pseudo long sous une pastille (troncature / retour à la ligne) | `01-architecture.md` | Utilisateur | Close : tronqué « … » |
| D1 — Paragraphe X01 des règles en entier | `02-dev-notes.md` | Utilisateur | Close : gardé |
| D2 — Ligne de règles cut-throat | `02-dev-notes.md` | Utilisateur | Close : validée |
| D3 — « Sans » / « premier à N sets » | `02-dev-notes.md` | Orchestrator | Close : demande + convention « premier à N » |
| D4 — Capitales par CSS | `02-dev-notes.md` | Orchestrator | Close : pattern existant |
| Écart — « Commencer » de l'Ordre en bas d'écran | `02-dev-notes.md` | Utilisateur | Close : gardé en bas |
| Écart — chevron pivotant au lieu de « › » | `02-dev-notes.md` | Utilisateur | Close : validé |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-15 | Index `.ai/architecture-context.md` jugé à jour, non régénéré | Aucune source plus récente que son dernier commit, aucune modifiée dans l'arbre |
| 2026-10-15 | Port 5202 réservé aux captures du Dev | Lot en parallèle de `statistiques-podium` (§ Lots en parallèle, point 3) |
| 2026-10-15 | Chaîne d'architecture démarrée au scout | Aucune surface gravée annoncée par l'intake |
| 2026-10-15 | `archi-scout` lancé (sonnet / low, frontmatter) → PASS, retenu | Rapport complet, planche suivie |
| 2026-10-15 | Q1-Q4 tranchées par l'utilisateur ; gate Architecture passé (aucune question ouverte, T8 reportée à la relecture à l'écran) | Arrêt Archi → Dev |
| 2026-10-15 | `dev` lancé (sonnet / medium, frontmatter, maxTurns 100 non atteint) → implémenté, 1091 tests d'après lui | Phase Dev |
| 2026-10-15 | D1, D2 et deux écarts tranchés par l'utilisateur sans changement de code ; D3, D4 closes par l'Orchestrator ; gate Dev passé | Arrêt après Dev |
| 2026-10-15 | `test` lancé (sonnet / high, frontmatter) | Phase Test |
| 2026-10-15 | L'agent `test` n'avait pas de shell : l'Orchestrator relance lint, typecheck, vitest, build à chaque tour | Aucun résultat d'exécution inventé |
| 2026-10-15 | Boucle 1 (tour 1) : `dev` relancé (sonnet / medium) pour T1-T7 + Q-A ; `test` relancé (sonnet / high), tour 2 sans constat ; gate Test passé | Trous de test classés par Test |
| 2026-10-15 | Index `.ai/architecture-context.md` à régénérer (`CLAUDE.md`, CONVENTIONS, charte modifiés par le lot) | Responsabilité de l'Orchestrator avant commit |
| 2026-10-15 | `architecture-context` lancé (sonnet / high, brief lu sur disque) → 149 lignes / 13 289 octets ; nouveaux constats #25, #26 | Régénération avant commit |
| 2026-10-15 | `06-echanges.md` écrit ; arrêt de fin de lot | Séquence, étape 8 |
| 2026-10-15 | Go de fin de lot de l'utilisateur (« C'est tout bon ») : relecture à l'écran faite, niveau `light` maintenu malgré la puce ajoutée à `CLAUDE.md`, constat #26 (`CONVENTIONS.md` § 14, `ShuffleOrder`) laissé en dette | Arrêt de fin de lot |
| 2026-10-15 | T1-T7 et Q9 closes par l'Orchestrator ; Q5-Q8 closes par la demande / la planche ; T8 reportée à la relecture à l'écran | Techniques sur preuve (`01-architecture.md` § Résolution) ; produit déjà tranché par écrit |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | Trous de test T1-T7 + Q-A (`03-plan-de-test.md`, tour 1) | Comblés ; Test tour 2 sans constat (1104 tests verts) |

Tours consommés : 1 / 5.

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
