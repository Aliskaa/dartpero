# Lot `nouvelle-partie-en-etapes` — orchestration

## Objectif

Remplacer la page unique « Nouvelle partie » par un parcours en trois étapes (jeu → joueurs et
réglages → ordre de jeu), sur le modèle de DartsOn, en gardant la charte « pub anglais ». Le
détail du périmètre, des critères d'acceptation et des décisions vit dans
[`request.md`](request.md) (intake validé) — il n'est pas réécrit ici. Étude source :
[`docs/prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md`](../../prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md).

**Hors périmètre :** nom de partie, Accueil en parties récentes, « Rejouer la même », nouveaux
jeux, bots, lancer vers la bulle, roue, finir le tour, tours max, recherche de joueurs, tout
changement de règle de jeu, d'événement persisté ou de `backupSchema`.

## Niveau

high

## Branche

`lot/nouvelle-partie-en-etapes` — créée depuis `main` (`6bf9c76`) avant l'Architecture,
fusionnée en `--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/nouvelle-partie-en-etapes.md` (validé le 2026-10-11),
copié octet pour octet vers `request.md` le 2026-10-11 (empreintes identiques). Validation :
en-tête, statut `Validé`, date, niveau `high` identique, commande manuelle exacte, toutes les
sections du contrat, zéro question bloquante — conforme.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée annoncée par l'intake |
| 2 | `archi-designer` | Sauté | Surface gravée annoncée par l'intake |
| 3 | `archi-authority` | PASS | — |

Agent retenu : authority

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | `archi-authority` (scout et designer sautés) | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite | `test` | `03-plan-de-test.md` |
| Sécurité | Faite | `sec` | `04-revue-securite.md` |
| Revue | Faite (v3 : GO, sous réserve de la relecture A à F) | `review` | `05-revue.md` |
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
| 2026-10-11 | `.ai/architecture-context.md` jugé à jour | Aucune source commitée après lui, aucune modifiée dans l'arbre |
| 2026-10-11 | Chaîne d'architecture démarrée à `archi-authority` (opus, effort max) | L'intake annonce une surface gravée : décisions de `CLAUDE.md` § DS et § Règles du jeu X01 (défaut du double out, vocabulaire « leg » → « manche ») |
| 2026-10-11 | `dev`, `test`, `sec` à lancer en `model: "opus"` | Monter en gamme : surface gravée |
| 2026-10-11 | Architecture : `archi-authority` (opus, effort max) rend PASS ; `01-architecture.md` écrit depuis ce rapport | — |
| 2026-10-11 | Gate Architecture passé | Aucune question de conception ouverte. Les trois questions non bloquantes de l'intake sont tranchées dans `01-architecture.md` § 8 (dernier jeu non mis en avant, redirection `/entrainement` gardée, défaut domaine `doubleOut: true` conservé). Les trois « vérifications » restantes sont assignées à Dev, Test, Sécurité et se closent dans leurs phases |
| 2026-10-11 | Dev : `dev` lancé en `model: "opus"` (effort medium et `maxTurns` 100 du frontmatter, plafond non atteint) ; 489 tests, lint, typecheck, build, smoke verts | — |
| 2026-10-11 | Écart Dev n° 1 clos par l'Orchestrator : « Sélectionner un joueur existant » reste accessible à l'entraînement (max 1) | Évident : la demande veut une étape 2 solo avec choix du joueur ; rediriger la sélection rendrait le choix d'un profil existant impossible après un × |
| 2026-10-11 | Gate Dev passé | D1 clos ; D2 (panneau `hidden`) assignée à la relecture planifiée par Test |
| 2026-10-11 | Test : `test` lancé en `model: "opus"` (effort high) ; sans shell, l'Orchestrator a lancé les commandes et la contre-épreuve n° 2 | Le sous-agent n'a que Read / Grep / Glob dans cet environnement |
| 2026-10-11 | Boucle 1 (tour 1 / 5) : Test → Dev pour B1, O1, O2 et tests T1-T6 ; `dev` en opus ; puis Test rejoué (opus) | Bugs d'implémentation classés par Test |
| 2026-10-11 | T8 (O1 sans test) et T9 (commentaire de T2) acceptés comme dette | Correctif relu et conforme, aucun critère en jeu ; un tour de boucle de plus n'apporterait qu'un test de confort |
| 2026-10-11 | Gate Test passé | Q1 → relecture utilisateur (point D) ; Q2 → relecture (point A) ; Q3, Q4, Q5, Q-R1, Q-R2 closes ; Q-R3 → relecture utilisateur |
| 2026-10-11 | Sécurité : `sec` en `model: "opus"` (effort high), sans shell ; RAS ; l'Orchestrator a lancé `git diff` des manifestes npm (vide) et `npm audit --omit=dev` (0 vulnérabilité) | — |
| 2026-10-11 | Gate Sécurité passé | Aucune question ouverte |
| 2026-10-11 | Documentation du lot mise à jour par l'Orchestrator avant la Revue (CLAUDE.md, glossaire, CONVENTIONS, frontend-react, charte, PLAN), puis `/refresh-architecture` (`architecture-context`, sonnet / high du frontmatter : 147 lignes, 13 293 octets ; constats 1, 8, 9 retirés, 12 et 13 ajoutés) | La Revue doit pouvoir juger ce qui est gravé |
| 2026-10-11 | Revue : `review` (opus, effort max) rend **NO-GO** | Constat n° 1 bloquant (borne / seuil du glisser), vérifié par l'Orchestrator dans `ListeOrdonnable.tsx:101-112` et `ordre.ts:27-36` |
| 2026-10-11 | Boucle 5 (tour 2 / 5) : Revue → Dev pour n° 1 et n° 3 (T8, T9 traités au lieu d'être une dette non signée) ; à rejouer : Test (avec n° 2), Sécurité, Revue | Classement par la Revue ; l'acceptation de dette par l'Orchestrator retirée |
| 2026-10-11 | Tour 2 : `dev` (opus) corrige `rangVise` (seuil à mi-chemin), T8, T9 ; 517 verts ; contre-épreuve Orchestrator : 13 échecs sur l'ancien seuil ; Test rejoué (opus) conforme, R1 réécrit ; Sécurité rejouée (opus) RAS | — |
| 2026-10-11 | T10 (commentaire de `tests/setup.ts`) et T11 (titre d'`it.each` « n°0 ») laissés tels quels | Cosmétiques, tests seulement, aucun critère ; pas de boucle pour deux commentaires |
| 2026-10-11 | Documentation recalée après la Revue v1 (n° 5, 6, 7, 9 partiel) : annotation en `01` § Révisions, CONVENTIONS § 13 et § 14 (9 hooks), charte l. 337, PLAN (517 tests, deux boucles, piège de `rangVise`, plus de « dette acceptée ») ; puis `/refresh-architecture` | CONVENTIONS modifié après l'index |
| 2026-10-11 | Revue v2 : `review` (opus, effort max) rend **GO conditionnel** à quatre accords de l'utilisateur ; constat n° 12 (CONVENTIONS § 13 incomplet) corrigé par l'Orchestrator ; n° 13 (index) au prochain `/refresh-architecture` | — |
| 2026-10-11 | `06-echanges.md` écrit ; ⏸ arrêt de fin de lot | Accords explicites de l'utilisateur requis avant le commit |
| 2026-10-11 | **Accords de l'utilisateur** : n° 4 → **report** à un lot de règles « sortie libre », inscrit au PLAN § 0 (n° 4) ; n° 10 / 11 → **corriger** ; relecture A à F → **avant le commit** ; README → **corriger le texte** (captures à refaire à la main) | Réponses explicites de l'utilisateur |
| 2026-10-11 | Boucle 5, tour 3 (tour 3 / 5 au total, dernier tour de la boucle 5) : `dev` (opus) corrige le commentaire de `tests/setup.ts` et le titre de l'`it.each` (tests seulement) ; 517 verts, lint, typecheck OK (mesurés par l'Orchestrator) ; README corrigé par l'Orchestrator (« manche », 517 tests) | Demandé par l'utilisateur |
| 2026-10-11 | `/refresh-architecture`, 3e passe (`architecture-context`, sonnet / high du frontmatter) : 160 lignes physiques (149 non vides), 13 312 octets — au plafond ; `<StrictMode>` resitué au lot `stockage-persistant`, constat n° 6 retiré, n° 12 « report décidé par l'utilisateur » | CONVENTIONS modifié après la 2e passe |
| 2026-10-11 | Revue v3 (`review`, opus, effort max), limitée au diff du tour 3 : **GO** sous réserve de la relecture A à F ; constats n° 14 à 18 (documentation) traités par l'Orchestrator sans boucle | Recommandé par la Revue avant le commit |
| 2026-10-12 | Relecture A à F faite par l'utilisateur ; accord explicite pour le commit et la fusion `--ff-only` dans `main` | « OK vas y commit et fusionne » |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | B1 (saut au relâcher du glisser), O1 (erreur de démarrage persistante), O2 (« set » / « manche » hors `labels.ts`) ; tests T1-T6 à écrire par Dev (Test n'édite pas) | Corrigé (+14 tests, 503 verts) ; Test rejoué : conforme |
| 2 | 5 | Revue → Dev | Revue NO-GO : n° 1 (glisser au doigt : jamais en première / dernière place, rien à 2 joueurs — confirmé par l'Orchestrator) ; n° 3 (T8 test d'O1, T9 commentaire) | Corrigé (seuil à mi-chemin, +14 tests, 517 verts, contre-épreuve 13 échecs) ; Test rejoué : conforme |
| 3 | 5 | Revue → Dev | Revue v2, n° 10 / 11 (commentaire de `tests/setup.ts`, titre d'`it.each`), sur demande de l'utilisateur | Corrigé (517 verts, tests seulement) ; Revue v3 : GO |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
