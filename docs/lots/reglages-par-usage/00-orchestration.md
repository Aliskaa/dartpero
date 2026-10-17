# Lot `reglages-par-usage` — orchestration

## Objectif

Lot 12 de la refonte (étude `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`,
§ Découpage et § Réglages) : l'écran Réglages en une page rangée par usage, deux voyants en tête
(Dernière sauvegarde, avec la date du dernier export gardée sur l'appareil ; Application), thème
en trois vignettes, sauvegarde resserrée, joueurs et appli en lignes. Détail : `request.md`.
Planche validée : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\derniers\derniers.html`
(`#rg4`, deux voyants).

**Hors périmètre :** voir `request.md` § Hors périmètre (pages par sujet, nouvelles routes,
voyants écartés, format de sauvegarde).

**Lot en parallèle** (§ Lots en parallèle) : worktree
`C:\Users\kevin\Documents\Flechettes-reglages-par-usage`, en même temps que `rejouer`
(`..\Flechettes-rejouer`, port 5202). Port réservé aux captures du Dev : **5201**.

## Niveau

high — surface gravée : politique `/confidentialite` (nouvelle clé `localStorage`), décisions
« stockage persistant » et « installation » de `CLAUDE.md` § Décisions structurantes.

## Branche

`lot/reglages-par-usage` — créée depuis `main` avant l'Architecture, fusionnée en `--ff-only` après
accord.

## Provenance

Intake validé : source `docs/request/reglages-par-usage.md`, copié octet pour octet (empreinte
SHA-256 identique) vers `request.md` le 2026-10-16. Validation : en-tête, statut `Validé`, date,
niveau `high` = niveau demandé, commande exacte, sections complètes, zéro question bloquante —
conforme.

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
| Architecture | Faite | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite | `test` | `03-plan-de-test.md` |
| Sécurité | Faite | `sec` | `04-revue-securite.md` |
| Revue | Faite (GO passe 2) | `review` | `05-revue.md` |
| Échanges | Faite | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| U1-U10 (01-architecture.md § Questions pour l'utilisateur) : points produit non dessinés | Architecture | Utilisateur, à l'arrêt Archi → Dev | Closes 2026-10-17 (défauts acceptés, `01-architecture.md` § Réponses) |
| Gravure proposée « date du dernier export » dans `CLAUDE.md` | Architecture | Utilisateur | Close : acceptée |
| Revue 1 et 2 : valeur des voyants non grasse ; duo à 48 px au lieu de 56 (écarts à la planche non tranchés) | Revue passe 1 | Utilisateur (corriger ou accepter) | Tranchée 2026-10-17 : **corriger** les deux → boucle 5 |
| Revue 3 et 4 : index non régénéré ; PLAN et étude restés à la phase Dev | Revue passe 1 | Orchestrator, avant commit | Closes : 4 (boucle 5), 3 (index régénéré après la session 8, 150 lignes) |
| Q-d : « DERNIÈRE SAUVEGARDE » sur deux lignes à 125 % / 360 px | Dev session 6 (A1 de Test passe 3) | Utilisateur | Close : étiquette « Dernier export » |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-16 | Index `.ai/architecture-context.md` jugé à jour (sources au même commit `2fa21d5`, rien de modifié dans l'arbre) | Prérequis de la skill |
| 2026-10-16 | Chaîne démarrée à `archi-authority` (opus / max, frontmatter) | Surface gravée annoncée par l'intake (politique publique, décisions stockage / installation) |
| 2026-10-16 | `dev`, `test`, `sec` à lancer en `model: opus` | § Monter en gamme |
| 2026-10-16 | Port 5201 réservé aux captures du Dev | Lot en parallèle de `rejouer` (port 5202) |
| 2026-10-17 | Arrêt Archi → Dev : U1-U10 et gravure acceptés (défauts) ; Dev lancé `dev` en `model: opus` (effort medium, maxTurns 100, frontmatter) | Go utilisateur |
| 2026-10-17 | `dev` arrêté à `maxTurns` 100 sans rapport (17 fichiers modifiés, 11 créés, rien vérifié) ; **repris** par message (même contexte, pas relancé à l'identique) pour finir vérifications et rapport | Skill § Modèles : `maxTurns` atteint = lot à moitié fait ; le lot n'est pas à couper, il restait la fin |
| 2026-10-17 | Gate Dev : Q-a (gardé) et Q-b (bloc Système à 40 %) tranchés par l'utilisateur ; Q-b appliqué par `dev` (session 3) ; Q-c (test faible) confié à Test | Questions produit → utilisateur ; Q-c technique, rôle de Test |
| 2026-10-17 | Test lancé : `test` en `model: opus` (effort high, frontmatter) | § Monter en gamme |
| 2026-10-17 | Test passe 1 sans shell : boucle 1 vers `dev` (B1, B2, T1-T7) ; Q1 close par l'Orchestrator (contrat `Preferences` inchangé) | Constats classés par Test |
| 2026-10-17 | Commandes et 2 contre-épreuves rejouées par l'Orchestrator (PowerShell) ; Test passe 2 (opus) : tout clos ; D1, N1 en dette, N2 accepté | Gate Test |
| 2026-10-17 | Sécurité lancée : `sec` en `model: opus` (effort high, frontmatter) | § Monter en gamme |
| 2026-10-17 | Sécurité PASS ; six commandes exécutées par l'Orchestrator, conformes (audit 0, smoke OK) | Gate Sécurité : aucune question |
| 2026-10-17 | Revue lancée : `review` (opus / max, frontmatter) | Séquence `high` |
| 2026-10-17 | Revue passe 1 NO-GO ; constats 1 (gras) et 2 (duo 56 px) : **corriger** (utilisateur) → boucle 5, `dev` session 5 (opus, medium, même contexte) | Écarts à la planche → utilisateur |
| 2026-10-17 | Commandes rejouées par l'Orchestrator (1429 verts, smoke OK) ; `test` passe 3 et `sec` passe 2 lancés en parallèle (opus, high) : prêt / PASS | Boucle 5 : rejouer Test + Sécurité + Revue |
| 2026-10-17 | A1 (Test passe 3) : `dev` session 6 remesure 360 px → « DERNIÈRE SAUVEGARDE » sur deux lignes à 125 % ; Q-d posée à l'utilisateur : **raccourcir en « Dernier export »** ; `dev` session 7 l'applique ; commandes rejouées (1429 verts, smoke OK) | Question produit → utilisateur |
| 2026-10-17 | `review` passe 2 (opus / max) : **GO** ; reste index, journal, retouches de texte (constats 2, 4, 6) → `dev` session 8 (texte seulement, boucle 5 tour 2) ; index régénéré par l'agent `architecture-context` (sonnet / high, brief lu sur disque, appliqué sans invoquer la skill) après les retouches | Gate Revue |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | B1 (horodatage hors plage → « NaN mois »), B2, T1-T7 (`03-plan-de-test.md` passe 1) | Corrigé ; passe 2 : tout clos, commandes rejouées (1428 verts) |
| 2 | 5 | Revue → Dev | Revue 1 (gras), 2 (duo 56 px) tranchés par l'utilisateur ; + 4, 5, 6 (docs, commentaires), 7 facultatif (`05-revue.md`). Puis, dans le même tour : mesure 360 px après le gras (A1 de Test passe 3, session 6) et Q-d → « Dernier export » (session 7) | Corrigé ; Test passe 3, Sécurité passe 2 PASS, Revue passe 2 **GO** ; 1429 verts |
| 3 | 5 | Revue → Dev | Retouches de texte de la Revue passe 2 (constats 2 et 4 ; 6 côté PLAN), aucun comportement | Fait (`dev` session 8) : lint 0, typecheck OK, 1429 verts — 2e et dernier tour de la boucle 5 (plafond 2) ; 3 / 5 au total |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
