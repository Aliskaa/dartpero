# Lot `confidentialite-assetlinks` — orchestration

## Objectif

Lot 3 de la feuille de route Play Store (`docs/prospective/2026-10-01-NEW-feuille-de-route-play-store.md`).
Livrer : un écran `/confidentialite` (politique de confidentialité + mentions légales, éditeur et
contact en `À REMPLIR`), un lien depuis Réglages → À propos, `public/.well-known/assetlinks.json`
valant `[]` servi par Firebase Hosting (exception à `**/.*`, hors repli et hors précache du
service worker), des contrôles `smoke` (fichier, précache, `À REMPLIR` bloquant), la section
`docs/DEPLOIEMENT.md`. Détail : `request.md`, sans le réécrire.

**Hors périmètre :** contenu réel d'`assetlinks.json` (nom de package, empreinte), clé de signature, Bubblewrap, formulaire « Sécurité des données », page HTML statique, bannière de consentement, anglais.

## Niveau

<`high` (défaut) ou `light`. `light` interdit sur une surface gravée : domaine, couture
GameMode, format persisté (MatchEvent, Dexie, backupSchema), service worker / firebase.json,
règle gravée de CLAUDE.md.>

high

## Branche

`lot/confidentialite-assetlinks` — créée depuis `main` avant l'Architecture, fusionnée en `--ff-only` après
accord.

## Provenance

Intake validé : source `docs/request/confidentialite-assetlinks.md` (statut Validé, 2026-10-03, niveau `high`, zéro question bloquante, toutes les sections présentes). Copié octet pour octet vers `request.md` le 2026-10-03 (`cmp` OK).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée annoncée par l'intake (`firebase.json`, service worker) |
| 2 | `archi-designer` | Sauté | Idem |
| 3 | `archi-authority` (opus / max) | `PASS` | — |

Agent retenu : authority

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite | `test` | `03-plan-de-test.md` |
| Sécurité | Faite | `sec` | `04-revue-securite.md` |
| Revue | Faite (v1 GO sous conditions ; v2 ciblée : GO après tenue des documents et réponse utilisateur) | `review` | `05-revue.md` |
| Échanges | Faite | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| `hosting.predeploy` contre R-a (si oui : révision Archi) | Sécurité R-a, Revue constat 8 | Utilisateur | **Close** : non, documenter (utilisateur, 2026-10-10) |
| Signature des résiduels R-a à R-g (dont R-d = Q5 voix `localService`, R-e = Q6 `persist()` Firefox, R-g = R1 robot sans JS) | Sécurité v3, Revue constat 3 | Utilisateur | **Close** : tous acceptés et signés par l'utilisateur (2026-10-10) |
| Q2 sous sa forme réelle : 4 `MENTION_*` à remplir (éditeur, contact, entité et adresse de l'hébergeur) + date | Revue constat 2 | Utilisateur | **Close** : valeurs fournies par l'utilisateur et intégrées (éditeur « Dartpéro, particulier non professionnel », contact `roulandzanellakevin@gmail.com`, Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande ; date 10 octobre 2026 ; pas de téléphone) — 2026-10-10 |
| Durcissement facultatif : cookies / permissions dans `reseauBoundary` (constat 5) | Revue | Utilisateur | **Close** : non, documentation seulement (utilisateur, 2026-10-10) |
| Formulations « ni serveur ni compte », « sur ce téléphone seulement » ; tiers droit vide en paysage (C5) ; éditeur = nom de l'appli ; contact public (spam) | Revue constat 7, Test C5 / T4, Sécurité v4 | Utilisateur | **Close** : « oui commit » (utilisateur, 2026-10-10) — formulations gardées, C5 accepté, éditeur et contact public confirmés |
| Commentaires `lazyRoutes.test.ts:8` et `labels.ts:256` | Revue constat 4 | Orchestrator → `dev` | **Close** : corrigés (2026-10-10) |
| Documentation durable (checklist `05-revue.md`) + `/refresh-architecture` | Revue C1 | Orchestrator | **Close** : écrite le 2026-10-10, relue par la revue ciblée (`05-revue.md` v2) ; CONVENTIONS § 14, N2, N4 corrigés |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-03 | Niveau `high`, chaîne démarrée à `archi-authority` (opus / max) ; `dev`, `test`, `sec` en `model: opus` | Surface gravée : `firebase.json` et service worker |
| 2026-10-03 | Architecture PASS (authority) : extglob `**/.!(well-known)` au lieu de `!` (no-op en glob 10), `navigateFallbackDenylist`, garde `REMPLIR` dans le smoke, barre de navigation visible | Rapport `01-architecture.md` ; gate : Q1-Q3, Q5, Q6 résolues dans le fichier, Q4 posée à l'utilisateur |
| 2026-10-03 | Q4 close : `installation-guidee` déjà déployé (réponse utilisateur) ; go Dev. `dev` lancé en `model: opus` (effort medium, maxTurns 100 du frontmatter) | Surface gravée |
| 2026-10-03 | Dev fait : 454 tests, smoke rouge sur la seule garde `REMPLIR`, V4 confirme D1, S1/S2 non déclenchées. Gate : Q4 dev tranchée (hors périmètre) ; Q1 → utilisateur (déjà différée par l'intake), Q2 → Test, Q3 → Sécurité. `test` lancé en `model: opus` (effort high du frontmatter) | Surface gravée |
| 2026-10-03 | Test PASS, aucune boucle. Gate : C2/C3 tranchés hors périmètre ; C1, AM1, Q3 dev → Sécurité ; Q1/Q2 utilisateur. `sec` lancé en `model: opus` (effort high du frontmatter) | Surface gravée |
| 2026-10-03 | Sécurité PASS (v3) après 2 tours de boucle 2 (total 2 / 5). Gate : questions de Test et Sécurité tranchées dans leurs fichiers ; `hosting.predeploy` (R-a) et les résiduels R-a à R-g posés à l'utilisateur à l'arrêt final. `review` lancé (opus / max du frontmatter) | Surface gravée |
| 2026-10-10 | Décisions utilisateur : pas de `predeploy` (documenté) ; résiduels R-a à R-g signés ; mentions fournies par l'utilisateur et intégrées au lot ; pas de durcissement cookies / permissions (doc seulement) | Arrêt final, réponses explicites |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 2 | Sécurité → Dev | S1 (import « n'efface rien » faux), S2 (absolu « n'envoie rien » démenti) dans `labels.ts` ; + durcissement `reseauBoundary` (P5) et texte d'import de `ReglagesEcran.tsx:343-345` (décision Orchestrator) | Corrigé (456 tests) ; rejeu Test PASS, Sécurité → S3 |
| 2 | 2 | Sécurité → Dev | S3 (« ne quitte le téléphone que si vous le partagez » trop absolu) + exception `w3.org` restreinte aux URI exactes | Corrigé (456 tests) ; rejeu Test + Sécurité ciblés, lancés en parallèle (indépendants, changement d'une phrase + un garde) → Test PASS, Sécurité PASS |
| — | Hors boucle (demande utilisateur, ne compte pas dans les 5 tours) | Arrêt final → Dev | Intégrer les 4 mentions et la date fournies par l'utilisateur + commentaires du constat 4 de Revue | Fait (456 tests, smoke vert) ; rejeu Test PASS, Sécurité PASS (v4) ; revue ciblée v2 : GO sous réserve de la tenue des documents et de la réponse utilisateur |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
