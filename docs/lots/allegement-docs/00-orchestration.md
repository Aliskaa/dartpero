# Lot `allegement-docs` — orchestration

## Objectif

Alléger les deux fichiers de contexte lus en permanence, **sans perdre une seule règle** :

- **`CLAUDE.md`** (530 lignes, 34 Ko, chargé à chaque session) : ne garder que son rôle de
  résumé opérationnel et de décisions gravées, cible **≈ 200 lignes**. **Déplacer** (pas
  supprimer) ce qui relève du journal ou du manuel, vers la source qui l'accueille déjà ou un
  nouveau fichier :
  - § État d'avancement (78 l.) → `docs/PROJECT_PLAN.md`, 3 lignes restantes ;
  - § Déploiement Firebase (45 l.) → nouveau `docs/DEPLOIEMENT.md`, pointeur + pièges vitaux ;
  - § Notes techniques (43 l.) → `.claude/CONVENTIONS.md` / `.claude/rules/` (Biome déjà
    dupliqué dans `rules/biome.md`) ;
  - § Arborescence (55 l.) → `CONVENTIONS.md`, ≈ 10 lignes restantes ;
  - § Conventions de code (22 l.) → renvoi (déjà dans `CONVENTIONS.md`, `rules/typescript.md`) ;
  - § Charte (20 l.) → garder l'angle vif et les deux zones de l'écran de match, le reste est
    dans `docs/CHARTE_GRAPHIQUE.md`.
- **`.ai/architecture-context.md`** (519 lignes, **42 Ko — plus gros que sa source**) : ajouter
  au brief `.claude/agents/architecture-context.md` un **plafond** (≈ 150 lignes / 12 Ko) et
  l'obligation de **pointer** (fichier + §) au lieu de recopier ; puis le régénérer.
- Livrer une **table de correspondance** section d'origine → nouvel emplacement, pour que
  l'utilisateur vérifie qu'aucune ligne ne s'est perdue.

**Hors périmètre :** les **règles du jeu** (X01, Cricket, Tour du monde), les **décisions
structurantes** et la **règle d'architecture** restent dans `CLAUDE.md`, intactes — ce sont
elles qu'aucun agent ne doit improviser. Aucune modification de `src/` ni de `tests/`. Aucune
décision nouvelle : on déplace, on ne redécide pas.

## Niveau

high — **surface gravée** : le lot touche `CLAUDE.md` (décisions structurantes, charte « ce qui ne
s'y discute pas »). Chaîne démarrée à `archi-authority`, `dev` / `test` / `sec` en opus.

## Branche

`lot/allegement-docs` — créée depuis `main` avant l'Architecture, fusionnée en `--ff-only` après
accord.

## Provenance

Orchestration directe, **pas d'intake validé** (`docs/request/allegement-docs.md` absent). Périmètre
issu de l'échange du 2026-09-30 avec l'utilisateur, qui a validé la proposition (« oui »).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sautée | Surface gravée |
| 2 | `archi-designer` | Sautée | Surface gravée |
| 3 | `archi-authority` | **PASS** | — |

Agent retenu : **authority** (opus / max)

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
| Q1 — cible de taille de `CLAUDE.md` : ≈ 200 l. impossible avec les blocs intacts ; accepter ≈ 335 l. (plafond Test 340) ? | `01-architecture.md` | Utilisateur, à l'arrêt Archi → Dev | **Close** (2026-10-01) : ≈ 335 lignes, plafond Test 340, séparateurs `---` conservés |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-09-30 | Branche `lot/allegement-docs` créée depuis `main` (`a00e9a8`), working tree propre | § Mise en place 5 |
| 2026-09-30 | Scout et designer sautés, chaîne démarrée à `archi-authority` (opus / max) | Surface gravée annoncée dans l'Objectif (`CLAUDE.md`) |
| 2026-09-30 | `archi-authority` lancé (opus / max) → `Architecture result: PASS`. Q2-Q6 adressées aux phases suivantes (elles bloquent la phase qui les porte, pas Dev), Q1 bloque Dev | Gate check |
| 2026-10-01 | Q1 tranchée par l'utilisateur : ≈ 335 l. (plafond 340). Go Dev donné | Arrêt Archi → Dev |
| 2026-10-01 | `dev` lancé en **opus** (surcharge `model`), effort / maxTurns du frontmatter (medium / 100) | Surface gravée |
| 2026-10-01 | `dev` (opus / medium / 100) : 64 appels, plafond non atteint. Lint, typecheck, 339 tests verts. `CLAUDE.md` 338 l. / 20 315 o. | Phase Dev |
| 2026-10-01 | Questions dev 1-2 tranchées par l'Orchestrator : « compactage » → « index » dans `rules/README.md` l. 5 et `agents/audit.md` l. 23 | Vocabulaire seul, compatible P3 |
| 2026-10-01 | `architecture-context` (sonnet / high) lancé avec le brief **lu sur disque recopié dans le prompt** → 146 l. / 12 246 o. (2e essai du même passage) | § 4 archi, Q4 |
| 2026-10-01 | Gate Dev → Test : dev-notes Q3 (doublon iOS dans `DEPLOIEMENT.md`) **tranchée : laisser** — P1 impose la coupe sans reformulation, les deux puces viennent de deux origines. Q2 (marge de 42 o.) **tranchée provisoirement : plafond maintenu** — le brief prévoit déjà de signaler un dépassement ; rappelée à l'utilisateur à l'arrêt de fin de lot. Q1, Q4 → Test | Gate check |
| 2026-10-01 | `test` lancé en **opus** (surcharge `model`), effort du frontmatter (high) | Surface gravée |
| 2026-10-01 | `test` (opus / high) : T1-T10 PASS ; D1-D4 bugs d'implémentation non bloquants → boucle 1 | Phase Test |
| 2026-10-01 | Gate Test : Q2 (budgets) **acceptée** — *corrigé après Revue (constat 2)* : la colonne « Reste dans `CLAUDE.md` » de l'archi compte le titre, donc Conventions de code (10 l.) et Déploiement (11 l.) dépassent leur budget d'une ligne chacune ; dépassement accepté, le plafond signé par l'utilisateur (340) est tenu à 338 ; Q3 (exemples Biome / TS perdus) **acceptée** — `rules/biome.md` l. 11-13 et `rules/typescript.md` l. 5-7 portent les mêmes contraintes, `biome.json` / `tsconfig.json` font foi ; Q4 = dev-notes Q3, déjà tranchée (laisser) ; Q5 rien à faire (P2) ; Q1 (marge) reste pour l'utilisateur à l'arrêt final | Gate check |
| 2026-10-01 | Rejeu Test (opus) après boucle 1 : D1-D4 PASS, T8 PASS, non-régression PASS (339) | Boucle 1 |
| 2026-10-01 | **Utilisateur** : plafond de `.ai` relevé à ≤ 160 l. / ≤ 13 312 o. (marge tombée à 9 o.). Remplacement mécanique par l'Orchestrator dans 4 fichiers (brief générateur, `refresh-architecture`, `.ai/README.md`, PLAN § 6) ; `.ai` lui-même ne cite pas le plafond | Décision utilisateur, Q1 dev-notes / Q1 test / R1 closes |
| 2026-10-01 | `sec` lancé en **opus** (surcharge `model`), effort high | Surface gravée |
| 2026-10-01 | `sec` (opus / high) : RAS sécu, diff parcouru (R1 mot pour mot, R2, R3), aucune question bloquante | Phase Sécurité |
| 2026-10-01 | `review` lancé avec le modèle du frontmatter (opus / max) | Phase Revue |
| 2026-10-01 | `review` (opus / max) : **GO**. Constats 1, 2 (mineurs) et 3, 7 (info) corrigés par l'Orchestrator dans ses propres formulations (PLAN § 6 l. 1458 + puce « pas de test de taille », `00` justification des budgets, note d'en-tête de `02`) ; constats 2, 8, 9 et la retouche manuelle de `.ai` présentés à l'utilisateur | Phase Revue |
| 2026-10-01 | `06-echanges.md` écrit ; arrêt de fin de lot | Phase Échanges |
| 2026-09-30 | `/refresh-architecture` préalable **non** relancé bien que `.ai/architecture-context.md` (`d32d4c0`) soit antérieur à `a00e9a8` | Seul écart : la règle « une branche par lot ». Le lot régénère ce fichier lui-même ; l'écart est signalé à l'archi |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | D1-D3 (`.ai` : ligne PLAN 601 → 602, « liste identique » trop fort, limite « carrière X01 » perdue) ; D4 (citations de `02-dev-notes.md`) corrigé par l'Orchestrator, auteur du fichier | `dev` (opus) : 3 corrections, `.ai` 146 l. / **12 279 o.** (marge 9 o.). Test rejoué (ciblé), puis Sécurité |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
