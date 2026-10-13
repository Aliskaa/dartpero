# Lot `nom-de-partie` — orchestration

## Objectif

Donner un nom à chaque partie, pour les quatre jeux (X01, Tour du monde, Cricket,
entraînement). Le nom proposé dépend du moment de la journée (« Dimanche soir » ; nuit rattachée
à la veille selon l'intake — **amendé le 2026-10-12 par l'utilisateur : la nuit prend le nom du
jour du calendrier**, voir le journal et `01-architecture.md` Révision 1), il se remplace dans un champ en haut de l'étape 1 de Nouvelle partie, et seul un
nom **tapé** est enregistré — champ facultatif de l'événement d'ouverture (sous réserve
d'Archi), lu par `backupSchema`. Le nom s'affiche dans l'Historique, en tête du résumé de fin et
en petit dans le bandeau du haut pendant la partie. Détail, critères d'acceptation et questions
non bloquantes : [`request.md`](request.md), copié tel quel de l'intake. Source de l'idée :
`docs/prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md`, lot n° 2 retenu.

**Hors périmètre :** renommer une partie après sa création ; le nom sur l'Accueil / « Reprendre »
(lot `accueil-parties-recentes`) ; recherche et tri par nom ; le nom dans les statistiques ;
tout changement de règle de jeu.

## Niveau

`high` — demandé par l'intake, et imposé : le lot touche un format persisté (événements
d'ouverture, `backupSchema`) et `src/core/domain/`.

high

## Branche

`lot/nom-de-partie` — créée depuis `main` (`6145677`) le 2026-10-12, avant l'Architecture,
fusionnée en `--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/nom-de-partie.md` (statut `Validé`, 2026-10-12, niveau
`high`, commande `/orchestrate nom-de-partie high`, toutes les sections de
`docs/request/README.md`, questions bloquantes : aucune). Copié octet pour octet (hash
identique vérifié) vers [`request.md`](request.md) le 2026-10-12. Quatre questions non
bloquantes, avec owner (archi-authority × 2, sec, dev / utilisateur).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée annoncée par l'intake (format persisté, domaine) |
| 2 | `archi-designer` | Sauté | Idem |
| 3 | `archi-authority` | PASS | — |

Agent retenu : authority

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | `archi-authority` (scout et designer sautés) | `01-architecture.md` |
| Dev | Faite | `dev` (opus) ×4 (initial + tours 1, 2, 3) | `02-dev-notes.md` |
| Test | Faite | `test` (opus) ×4 | `03-plan-de-test.md` |
| Sécurité | Faite | `sec` (opus) ×3 | `04-revue-securite.md` |
| Revue | Faite | `review` (opus / max) ×2 | `05-revue.md` |
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
| 2026-10-12 | `.ai/architecture-context.md` jugé à jour, pas de régénération | Dernier commit de l'index (`%ct` 1791825125) égal à celui de `CLAUDE.md`, `CONVENTIONS.md`, `rules/`, charte ; `DEPLOIEMENT.md` plus ancien ; aucune source modifiée dans l'arbre |
| 2026-10-12 | Chaîne d'architecture démarrée à `archi-authority` (opus / max) | Surface gravée annoncée par l'intake |
| 2026-10-12 | `dev`, `test`, `sec` lancés avec `model: "opus"` | § Monter en gamme : surface gravée |
| 2026-10-12 | `archi-authority` lancé une fois (opus / max, frontmatter) → `Architecture result: PASS` | — |
| 2026-10-12 | Q1 intake → nom dans l'événement d'ouverture (`name?: MatchName`) ; Q2 intake → `Services.clock` exposé à l'UI ; nouveau port driving `GetMatchName` ; `BACKUP_VERSION` reste 1 | Rapport authority, `01-architecture.md` |
| 2026-10-12 | Gate Architecture passé | Q6 (lecture de la nuit) close par le critère 2 ; Q7 (garde horloge) retenue pour Test ; Q8 close (ajustements attendus) ; Q1, Q2, Q9 assignées à Dev ; Q3, Q4, Q5 (politique, caractères de contrôle, `BACKUP_VERSION`) assignées à Sécurité — se closent dans leurs phases, comme au lot `nouvelle-partie-en-etapes` |
| 2026-10-12 | Go utilisateur pour Dev ; `dev` lancé une fois (`model: opus`, effort `medium` du frontmatter, `maxTurns` non atteint) | Arrêt obligatoire Archi → Dev |
| 2026-10-12 | Gate Dev passé | Rapport : lint, typecheck verts, 650 / 650 tests. Q1 archi (bandeau) close côté Dev, reste à la relecture utilisateur (D5) ; Q2, Q9 closes ; D1-D3 (= Q3-Q5 archi) → Sécurité ; D4 (message générique au-delà de 30) → Test. Trois écarts, tous classés *Ajustement* |
| 2026-10-12 | `test` lancé une fois (`model: opus`, effort `high`) ; n'a disposé que de Read / Grep / Glob, n'a rien exécuté | Lint, typecheck et `npm test` exécutés par l'Orchestrator : verts, 650 / 650 |
| 2026-10-12 | Gate Test : T4 close par l'utilisateur (« Changer les règles » repart de la proposition, voulu) ; D4 close par Test (acceptable) ; T1 → relecture à l'écran sur iPhone (point 5), puis décision utilisateur ; T2, T3 et P1-P5 → passe de correction des tests demandée par l'utilisateur (tour 1) avant Sécurité, puis Test rejoué | Réponses utilisateur du 2026-10-12 |
| 2026-10-12 | `dev` relancé (tour 1, `model: opus`) sur les tests seuls ; checks revérifiés par l'Orchestrator : 686 / 686 | — |
| 2026-10-12 | Q-D1 tranchée par l'Orchestrator : **non**, la garde n'est pas élargie à `performance.now()` / `Temporal.Now` | Aucune occurrence ; `performance.now()` ne donne pas une date calendaire, et `Temporal` n'est pas utilisé dans le projet ; à reconsidérer s'il entre |
| 2026-10-12 | Q-D2 tranchée par l'Orchestrator : **oui**, `rules/testing.md` mentionnera le fuseau `Europe/Paris` fixé dans `vite.config.ts` et la précondition d'heure d'été, avec la doc de fin de lot | Convention de test nouvelle et durable |
| 2026-10-12 | `test` rejoué (`model: opus`) : P1-P5 levés, aucun bug ; N1, N2 (problèmes de test, très basse / basse) non corrigés, assumés par l'Orchestrator et consignés | N1 couvert ailleurs ; N2 sans occurrence dans `src/` ; un tour de boucle ne se justifie pas |
| 2026-10-12 | Gate Test passé | T2, T3, T4, D4 closes ; T1 → relecture iPhone (non bloquante) ; D1-D3 → Sécurité |
| 2026-10-12 | `sec` lancé (`model: opus`, effort `high`) : 1 constat (politique, bug d'implémentation) ; D1 oui (texte et date fournis), D2 non, D3 confirmé | Rapport sec |
| 2026-10-12 | S2 exécutée par l'Orchestrator : diff `backupSchema` conforme ; `npm audit` 0 en prod, 8 en dev préexistantes (hors lot) ; `npm run build` vert | `sec` sans outil d'exécution |
| 2026-10-12 | Boucle 2 (auto) : `dev` relancé (`model: opus`) pour la politique + S1 ; tour 2 / 5 | Constat sec n° 1 |
| 2026-10-12 | Tour 2 corrigé (688 / 688) ; `test` rejoué (opus) : aucun constat ; diff `labels.ts` vérifié par l'Orchestrator (seules l. 273, 295 retirées dans la politique) ; `sec` rejoué (opus) : constat n° 1 levé, aucun nouveau | Rapports de rejeu |
| 2026-10-12 | Gate Sécurité passé | D1, S1, S2 closes ; D2 (pas de refus des caractères invisibles) et D3 (`BACKUP_VERSION = 1`) tranchées ; résiduels pour information (bidi bas ; audit dev préexistant), **aucun risque accepté**. Total : 2 tours de boucle sur 5 |
| 2026-10-12 | `review` lancé (opus / max du frontmatter, pas de surcharge) | Phase Revue |
| 2026-10-12 | Revue : **GO**, aucune boucle (2 / 5) ; conditions : gravure de la doc (liste corrigée), index régénéré, contrôles, acceptations utilisateur | `05-revue.md` |
| 2026-10-12 | `06-echanges.md` écrit ; arrêt pour le go final | Séquence, étape 8 |
| 2026-10-12 | **Amendement de l'intake par l'utilisateur (confirmé deux fois, avec exemple concret)** : la nuit (0 h-5 h) prend le nom du **jour du calendrier**, sans rattachement à la veille — samedi 1 h → « Samedi nuit », dimanche 1 h → « Dimanche nuit ». Remplace la décision d'intake « nuit rattachée à la veille » et le critère 2 pour 4 h 59 et 0 h (→ nuit du jour même). `request.md` (snapshot) reste inchangé ; l'amendement fait foi | Question Q6 / revue § 9 ; réponse utilisateur |
| 2026-10-12 | Classement : changement de spécification d'un **libellé** (`labels.ts`), pas une refonte : l'approche d'`01-architecture.md` (tables, pas de `Intl`, date de création) tient ; noté en Révision 1 d'`01-architecture.md` sans relancer la chaîne d'architecture (aucune couche, port ni format touché) | Décision de l'Orchestrator |
| 2026-10-12 | Revue constats 3 et 4 : micro-passe de tests demandée par l'utilisateur | Réponse utilisateur |
| 2026-10-12 | Résiduel D2 (caractères invisibles / bidi dans un nom importé) : **risque accepté, signé par l'utilisateur** | Réponse utilisateur |
| 2026-10-12 | Constat 6 (champ prérempli à effacer) : décision renvoyée à la relecture à l'écran | Réponse utilisateur |
| 2026-10-12 | Tour 3 (boucle 5, Revue → Dev, auto + demande utilisateur) : `dev` (opus) — libellé de la nuit + constats 3 et 4 ; Test, Sécurité, Revue à rejouer | 3 / 5 |
| 2026-10-12 | `test` rejoué après tour 3 (opus) : aucun bug, N1 levé ; R1-R4 problèmes de test non bloquants | `03-plan-de-test.md` |
| 2026-10-12 | R1, R2 **non corrigés, décision utilisateur** : inscrits dans `CONVENTIONS` § 13 (R1) et § 11 (R2) avec la doc de fin de lot ; R3, R4 → futur audit | Économiser un tour de boucle (4 / 5) pour deux lignes de test chacun |
| 2026-10-12 | `sec` rejoué après tour 3 (`model: opus`) | Boucle 5 : Test + Sécurité + Revue |
| 2026-10-12 | Sécurité après tour 3 : aucun constat ; `review` rejoué (opus / max) | `04-revue-securite.md` |
| 2026-10-12 | Revue après tour 3 : **GO**, aucune boucle (3 / 5) ; Révision 1 jugée bien classée ; constats 9-12 non bloquants ; liste finale de documentation dans `05-revue.md` ; constat 10 traité (Objectif annoté, Statut recompté, `06-echanges.md` régénéré) | `05-revue.md` § Rejeu après tour 3 |
| 2026-10-12 | Arrêt pour le go final (étape 8) ; gravure de la doc et `/refresh-architecture` après le go, avant le commit | Séquence |
| 2026-10-13 | **Go final de l'utilisateur** (« oui, go, grave la doc et prépare le commit ») ; relecture à l'écran, T1, D5, constat 6 restent à faire par l'utilisateur, inscrits en `PROJECT_PLAN` § 0 | Étape 8 |
| 2026-10-13 | Doc gravée par l'Orchestrator selon la liste finale de `05-revue.md` : `CLAUDE.md` § DS, `CONVENTIONS` § 7, 11, 12, 13, 14 (21 ports driving, 10 hooks, recomptés sur `src/`), règles `testing`, `frontend-react`, `persistence`, `glossary`, charte (bandeau, `TableauHonneur`), `PROJECT_PLAN` § 0, 1.1, 1.3, 2, 3, 4, 6, `README` (689 tests, ligne « nom de partie »), agents `dev.md`, `audit.md`. Options (étude `PARTIAL`, brief `intake`) non faites, faute de demande | Constat 1 et liste finale de la Revue |
| 2026-10-13 | `/refresh-architecture` : brief lu sur disque passé à l'agent `architecture-context` (sonnet / high du frontmatter), index à 143 lignes et 13 277 octets (vérifiés) ; 8 constats reportés, 0 retiré ; #2 recoté Moyenne → Basse par l'agent, **confirmé par l'Orchestrator** (`horlogeBoundary` couvre l'heure dans `src/core` ; aucun `Math.random`, `window`, `navigator` hors commentaires, `git grep`) | Constat 1 de la Revue |
| 2026-10-13 | Contrôles avant commit : lint 240 fichiers sans correction, typecheck 0 erreur, 689 / 689 (48 fichiers), build vert (precache 48 entrées) ; `git status` : rien hors du lot | Étape 9 |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 (assimilée) | Test → Dev | Problèmes de test P1-P5 (`03-plan-de-test.md`), aucun bug d'implémentation ; correction demandée par l'utilisateur avant Sécurité. Passe limitée aux tests | Corrigé (686 / 686, `src/` intact) ; Test rejoué, puis Sécurité |
| 2 | 2 | Sécurité → Dev | Constat sec n° 1 (bug d'implémentation) : politique `/confidentialite` non mise à jour (texte `labels.ts:295`, date `:273`, test) ; + S1 (test `__proto__`) | Corrigé (688 / 688) ; Test + Sécurité rejoués |
| 3 | 5 | Revue → Dev | Amendement utilisateur de la nuit (jour du calendrier) ; constats de revue 3 (`MODES` de `lancerPartie.ts` → `GAME_MODE_IDS`) et 4 (N1 : nom par défaut lu sur `createdAt`) | Corrigé (689 / 689) ; Test, Sécurité, Revue rejoués |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
