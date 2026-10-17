# Lot `rejouer` — orchestration

## Objectif

Lot 10 de la refonte (`docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, § Découpage
n° 10 et § Nouvelle partie — « Rejouer d'abord »). En tête de l'étape 1 de Nouvelle partie, les
3 configurations distinctes les plus récentes (mode + réglages + ensemble de joueurs), fusionnées
avec « N fois », profil supprimé écarté ; ▶ préremplit le parcours et mène à l'Ordre (≥ 2
joueurs) ou lance directement (solo). Les 4 jeux passent en rangée compacte sous la section.
Détail : [`request.md`](request.md).

**Hors périmètre :** édition / suppression d'une configuration, configuration « sans le joueur
supprimé », « On remet ça », reprise du nom, flag `shuffle`, toute règle, tout événement, tout
format persisté.

## Niveau

Démarré en `light` (intake : aucune surface gravée de code). **Relevé en `high` le 2026-10-17**
par l'utilisateur : le lot ajoute une décision à `CLAUDE.md` § Décisions structurantes (constat
#30 de l'index). La demande (`request.md`) garde « light », snapshot non réécrit.

high

## Branche

`lot/rejouer` — créée depuis `main` (`2fa21d5`) dans un **worktree** (lots en parallèle), fusionnée
en `--ff-only` depuis le dépôt principal après accord.

- Worktree : `C:\Users\kevin\Documents\Flechettes-rejouer`
- Port réservé aux captures du Dev : **5202**
- Lot parallèle : `reglages-par-usage` (`C:\Users\kevin\Documents\Flechettes-reglages-par-usage`)

## Provenance

Intake validé : `docs/request/rejouer.md` (Validé, 2026-10-16, `light`, zéro question
bloquante), copié octet pour octet vers `docs/lots/rejouer/request.md` le 2026-10-16 (hachés
identiques). Planche :
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\derniers\derniers.html` (piste 2,
`verif-np2.png`).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | Rapport complet, planche lue, points produit posés en questions |
| 2 | `archi-designer` | Non lancé | Scout PASS |
| 3 | `archi-authority` | Non lancé | Scout PASS |

Agent retenu : scout

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
| — | — | — | — |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-16 | `.ai/architecture-context.md` jugé à jour (commit ≥ toutes ses sources, aucune modifiée) | Prérequis |
| 2026-10-16 | Dossier créé depuis `_template`, demande copiée | Mise en place |
| 2026-10-16 | `archi-scout` lancé (sonnet / low) → PASS ; `01-architecture.md` écrit | Chaîne d'architecture |
| 2026-10-16 | Arrêt Archi → Dev : U1-U6 tranchées par l'utilisateur (`01-architecture.md` § Réponses) ; T1-T6 techniques confiées au Dev / Test ; go Dev | Gate check |
| 2026-10-16 | `dev` lancé (sonnet / medium, frontmatter), port 5202 | Phase Dev |
| 2026-10-17 | Gate Dev : D1 (bascule au chargement) et D2 (rien à rejouer) posés à l'utilisateur ; D1 → rien sous la barre pendant le chargement (corrige U6), D2 confirmé | Questions produit ajoutées par Dev |
| 2026-10-17 | `dev` repris (même agent, sonnet / medium) pour D1 → 1389 tests verts, 9 tests existants ramenés à l'état du dépôt | Arbitrage dans la phase Dev, pas une boucle |
| 2026-10-17 | Dev **Faite** ; `test` lancé (sonnet / high, frontmatter) | Gate check : aucune question ouverte |
| 2026-10-17 | `test` passe 1 : aucun bug d'implémentation, F1-F6 ; agent sans outil d'exécution → Orchestrator relance lint, typecheck, vitest (1389), build : OK | Réserve 1 du Test levée |
| 2026-10-17 | Boucle 1, tour 1 : F1-F6 → `dev` (repris, sonnet / medium) | `test` ne modifie pas les sources ; F1 = test vert à vide |
| 2026-10-17 | Orchestrator : lint, typecheck, vitest (1397), build OK ; `src/core` sans résidu ; `test` passe 2 (sonnet / high) → Faite | Gate Test : aucune question ouverte |
| 2026-10-17 | `CLAUDE.md` a gagné la puce « Rejouer » → `architecture-context` lancé (sonnet / high, brief lu sur disque) ; `06-echanges.md` écrit | Décision gravée → index à régénérer avant commit |
| 2026-10-17 | Index régénéré (147 lignes / 13 304 octets) ; constat #30 : `light` alors que le lot ajoute une décision au § Décisions structurantes ; #29 (CONVENTIONS § 14, 23 → 24 ports) laissé en constat connu | Rapport `architecture-context` |
| 2026-10-17 | **Niveau relevé `light` → `high`** par l'utilisateur. Sécurité et Revue ajoutées ; `sec` lancé en **opus** (montée en gamme). Architecture **non rejouée** (aucun code de surface gravée — domaine, événements, persistance — touché ; la Revue peut renvoyer à Archi, boucle 7). Les tours Dev et passes Test **postérieurs** ont tourné en sonnet : la montée en gamme n'a touché que `sec` (rectifié après le constat R11 de la Revue) | Lecture stricte de `orchestrate` § Niveaux (#30) |
| 2026-10-17 | `sec` passe 1 (opus) → PASS, S1 bug Basse, S2 question ; Orchestrator : `git diff --stat main`, fichiers sensibles hors diff ; S2 tranchée par l'utilisateur (écarter > 4 joueurs) ; boucle 2 tour 2 → `dev` repris (sonnet / medium) | `04-revue-securite.md` |
| 2026-10-17 | Orchestrator : 1403 tests, lint, typecheck, build OK ; `sec` passe 2 (opus) → PASS ; `test` passe 3 (sonnet / high) → S1, S2 clos, C1, C2, nit ; `doubleIn` présent depuis le lot 1 (`8469f55`, `git log -S`) → aucune partie X01 légitime écartée | Gate |
| 2026-10-17 | C1 tranché par l'Orchestrator : entraînement ≠ 1 joueur écarté — application directe de la décision utilisateur S2 (« non reproductible par le parcours ⇒ écarté ») et du critère 9, pas un nouveau choix produit ; boucle 1, tour 3 → `dev` | Gate check |
| 2026-10-17 | Orchestrator : 1405 tests, lint, typecheck, build OK ; `test` passe 4 (sonnet / high) et `sec` passe 3 (opus) en parallèle → clos, PASS ; virgule de la puce `CLAUDE.md` corrigée ; Sécurité **Faite** ; `review` lancé (opus / max, frontmatter) | Gate : aucune question ouverte |
| 2026-10-17 | `review` passe 1 (opus / max) → **NO-GO** sans défaut fonctionnel : R1-R6 → Dev, R7-R12 info ; questions Q1-Q4 tranchées par l'utilisateur (picto 24 px gardé, date = lancement, « Solo » dans la rangée compacte, montée en gamme partielle **acceptée et signée**) ; Q5 (lot `high` pour `backupSchema` et journaux non projetables) à proposer en fin de lot ; R11 rectifié (entrée ci-dessus) | `05-revue.md` |
| 2026-10-17 | Boucle 5, tour 4 / 5 → `dev` (repris, sonnet / medium) : R1-R6, R8 (doc), R9 (test), Q3, R12 | Plafond : 1 tour restant |
| 2026-10-17 | Orchestrator : 1408 tests, lint, typecheck, build OK, aucun résidu de mutation ; `test` passe 5 (sonnet / high) et `sec` passe 4 (opus) en parallèle → clos, PASS ; `review` passe 2 (opus / max) → **GO**, N1 (dette 5e mode) assumée sans boucle, N2-N3 info | Gate Revue : aucune question ouverte |
| 2026-10-17 | Orchestrator corrige deux imprécisions N2 (doc seule) : `CLAUDE.md:160` « port », PLAN § 6 (entraînement à plusieurs = C1) ; `architecture-context` relancé (sonnet / high), `06-echanges.md` à régénérer | Conditions avant commit de la Revue |
| 2026-10-17 | Index régénéré (16e passe, 148 lignes / 13 301 octets ; #29, #30 retirés ; #31 = N1) ; `06-echanges.md` v2 écrit ; arrêt de fin de lot : go, relecture écran, commit demandés à l'utilisateur | Séquence, étape 8 |
| 2026-10-17 | Go utilisateur pour le commit et la fusion ; relecture à l'écran **non faite** au commit, laissée « en attente » au PLAN § 0 ; suites Q5 + N1 au PLAN § 0 | Séquence, étapes 9-10 |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | F1 test vert à vide (Moyenne), F2-F4 tests manquants, F5 code mort, F6 doc (03 passe 1) | Corrigé, 1397 tests ; Test passe 2 : F1-F6 clos |
| 2 | 2 | Sécurité → Dev | S1 `doubleOut` / `doubleIn` non booléens importés passent le filtre (Basse) ; S2 > 4 joueurs écartés (décision utilisateur) | Corrigé, 1403 tests ; Test passe 3 et Sécurité passe 2 : S1, S2 clos |
| 3 | 1 | Test → Dev | C1 entraînement importé à 2-4 joueurs passe le filtre (application de la décision S2, tranchée par l'Orchestrator) ; nit `MAX_JOUEURS` vers `reglagesPossibles.ts` ; C2 test bout en bout optionnel | Corrigé, 1405 tests ; Test passe 4 et Sécurité passe 3 : clos, PASS. **C1 était impossible** (Revue R7) : branche défensive gardée |
| 4 | 5 | Revue → Dev | R1 identifiants du cœur en français ; R2-R4 docs (`CLAUDE.md`, CONVENTIONS, PLAN) ; R5-R6 tests ; R9 test de date ; Q3 « Solo » ; R8, R12 | Corrigé, 1408 tests ; Test passe 5, Sécurité passe 4 : clos, PASS ; Revue passe 2 : **GO** |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
