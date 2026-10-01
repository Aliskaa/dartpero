# Lot `stockage-persistant` — orchestration

## Objectif

Demander au navigateur de ne jamais effacer la base IndexedDB (`navigator.storage.persist()`),
derrière un port driven + adapter navigateur exposé via `Services.devices`. Demande automatique
au démarrage (sans bloquer le rendu, aucun appel si déjà protégé), état affiché dans le panneau
« Sauvegarde » des Réglages (protégé / non protégé / indisponible) avec un bouton « Redemander »
quand non accordé. Détail : [request.md](request.md). Lot 1 de la
[feuille de route Play Store](../../prospective/2026-10-01-NEW-feuille-de-route-play-store.md).

**Hors périmètre :** alerte hors des Réglages, `storage.estimate()`, tout changement de schéma Dexie / `MatchEvent` / `backupSchema`, sauvegarde automatique, installation guidée.

## Niveau

high

## Branche

`lot/stockage-persistant` — créée depuis `main` avant l'Architecture, fusionnée en `--ff-only` après
accord.

## Provenance

Intake validé : source `docs/request/stockage-persistant.md`, copié octet pour octet (`cmp` OK) vers [request.md](request.md) le 2026-10-01. Validation : en-tête, statut `Validé`, date, niveau `high` = niveau demandé, commande manuelle exacte, toutes les sections présentes, questions bloquantes « Aucune ».

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` (sonnet / low) | `PASS` | Rapport complet, sections exigées présentes |
| 2 | `archi-designer` | Non lancé | Scout en PASS |
| 3 | `archi-authority` | Non lancé | Scout en PASS |

Agent retenu : **scout**

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
| 2026-10-01 | Index `.ai/architecture-context.md` jugé à jour (aucune source plus récente ni modifiée) | Prérequis de la skill |
| 2026-10-01 | Chaîne d'architecture démarrée au **scout** | L'intake ne touche aucune surface gravée à la lettre (ni domaine, ni GameMode, ni format persisté, ni SW / `firebase.json`) ; `high` choisi par prudence, pas imposé |
| 2026-10-01 | Architecture : `archi-scout` lancé (sonnet / low, réglages du frontmatter), PASS retenu | Hook dans `App.tsx` plutôt que `main.tsx` : vérifié, `ServicesProvider` enveloppe `App` dans `main.tsx` |
| 2026-10-01 | Gate Architecture : 5 questions, toutes closes dans `01-architecture.md` ; Q5 (rendu pendant le chargement) tranchée par l'Orchestrator : rien n'est rendu tant que `status()` n'a pas répondu | Évite un clignotement ; réponse locale |
| 2026-10-01 | ⏸ Arrêt Architecture → Dev : confirmation explicite de l'utilisateur (« oui lance Dev ») | Arrêt obligatoire (`orchestrate` § Séquence, étape 2) — journalisé a posteriori sur constat n° 7 de la Revue |
| 2026-10-01 | Dev : `dev` lancé (sonnet / medium, frontmatter ; pas de montée en opus — aucune surface gravée). 3 ajustements, aucune refonte ; 363 tests verts | Gate Dev : 3 questions, toutes closes dans `02-dev-notes.md` |
| 2026-10-01 | Test : `test` lancé (sonnet / high, frontmatter). PASS, aucun bug ; 5 observations, 3 lacunes optionnelles | Gate Test : Q1 (désactiver Redemander) et Q2 (garde `navigator.storage`) tranchées « non » par l'Orchestrator, Q3 rattachée à l'arrêt de fin de lot |
| 2026-10-01 | Sécurité : `sec` lancé (sonnet / high, frontmatter). 1 constat basse (bug d'implémentation, libellé `persisted`) → boucle 2 automatique, tour 1/5 | Classement fait par la phase |
| 2026-10-01 | Boucle 2 tour 1 : `dev` (sonnet / medium) corrige le libellé ; `test` (sonnet / high) et `sec` (sonnet / high) rejoués, PASS. Observation `textContent` concaténé tranchée « non-défaut » par l'Orchestrator (`03-plan-de-test.md` § Rejeu) | Gate Sécurité : aucune question ouverte non résolue |
| 2026-10-01 | `CLAUDE.md` : puce « Stockage persistant demandé au démarrage » ajoutée en § Décisions structurantes ; `/refresh-architecture` lancé (agent `architecture-context`, sonnet / high) → 154 l. / 13 265 o. | Le lot grave une décision durable (avant Revue, pour qu'elle le vérifie) |
| 2026-10-01 | Revue : `review` lancé (opus / max, frontmatter). **No-go** sur constat n° 1 (mineur, renvoi Dev) → boucle 5 automatique, tour 2/5. Inclus dans le même tour : n° 2 (chronologie PLAN) et n° 4 (type `string` qui fait tenir la décision gravée par TypeScript) | n° 2 et n° 4 sont triviaux et Test / Sécu / Revue sont rejoués de toute façon ; n° 3, 5, 6, 8 restent « Aucun » (n° 5 : décision utilisateur ; n° 9 : traité au prochain refresh) |
| 2026-10-01 | Boucle 5 tour 2 : `dev` (sonnet / medium) corrige n° 1, 2, 4 ; `test` (sonnet / high) rejoué PASS ; `/refresh-architecture` (sonnet / high) → 150 l. / 13 118 o. LF (13 268 en CRLF, plafond tenu) ; ancien constat n° 8 retiré | — |
| 2026-10-01 | L'index relève un nouveau n° 8 (basse) : en-tête de CONVENTIONS § 14 « 9 driven, 6 hooks » devenu 10 / 7 par ce lot. **Corrigé par l'Orchestrator** (une ligne de doc, comptes vérifiés par `ls` : 20 driving hors `MatchSummary`, 10 driven, 7 hooks), puis nouveau `/refresh-architecture` | Compteur documentaire, pas du design ni du code ; évite un tour de boucle de plus pour un chiffre |
| 2026-10-01 | Refresh final : 150 l. / 13 045 o. LF (13 195 CRLF), n° 8 retiré. `sec` rejoué (sonnet / high) : RAS. Son affirmation « pas d'invite Firefox » contredit l'intake et la Revue (MDN) : fait secondaire, sans effet sur les conclusions → retenu : Firefox peut demander, pas de blocage | Gate Sécurité : aucune question ouverte |
| 2026-10-01 | Revue rejouée (opus / max) : **GO**. Constats v1 n° 1, 2, 4, 7, 9 clos ; nouveaux n° 10-15, tous info sans renvoi. Correction du compteur par l'Orchestrator acceptée (légitime sur le fond, hors lettre de la skill — à réserver au mécanique) ; parallélisme refresh / Test noté (n° 12) | Fin des phases ; 2 tours de boucle sur 5 |
| 2026-10-01 | ⏸ Arrêt de fin de lot : l'utilisateur constate que « Redemander » ne fait rien de visible (refus silencieux de Chrome en onglet). Option A choisie par l'utilisateur : afficher un retour après refus, dans ce lot | Point non résolu de `05-revue.md` (« Redemander refusé sans retour visible ») promu par l'utilisateur ; change le comportement validé à l'intake → boucle 5 (Revue → Dev), tour 3/5 (2/2 pour la boucle 5) |
| 2026-10-01 | Tour 3 : `dev` (sonnet / medium) livre `refusee` + `REFUS_REDEMANDE_STOCKAGE`, 366 tests. Orchestrator : compteurs de tests de `PROJECT_PLAN` § 0 / § 6 passés de 363 à 366 (mécanique). `test` rejoué (sonnet / high) : 0 bug ; Q1 (véracité de la phrase) tranchée par l'Orchestrator : formule prudente, appuyée sur `DEPLOIEMENT.md` — **à valider** par l'utilisateur, qui n'a pas encore vu la phrase livrée (correction sur constat n° 18 de la Revue v3) | Gate Test : aucune question ouverte |
| 2026-10-01 | `/refresh-architecture` (sonnet / high) : constat n° 6 mis à jour (366), 150 l. / 13 106 o. LF (13 256 CRLF). `sec` rejoué (sonnet / high) : RAS, Firefox non contredit | Gate Sécurité : aucune question ouverte |
| 2026-10-01 | Revue rejouée (opus / max) : **GO**. Nouveaux n° 16-19, tous info. `06-echanges.md` régénéré (v2 en tête) | Fin des phases ; 3 tours sur 5 |
| 2026-10-01 | ⏸ Go de fin de lot de l'utilisateur (« go pour le commit et merge dans main ») : libellés et comportement acceptés. Statut au commit : lot « fait », vérification sur appareil restante (PLAN § 0, feuille de route). Capture `reglages.png`, `sec.md:77` et constat n° 19 laissés en suspens | Accord explicite pour le commit et la fusion `--ff-only` |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 2 | Sécurité → Dev | `04-revue-securite.md` constat 1 (basse, bug d'implémentation) : l'état `persisted` promet « ne les effacera pas » sans rappel d'exporter — fausse assurance, contredit la mitigation de `01-architecture.md` | Corrigé (`labels.ts`) ; Test rejoué PASS, Sécurité rejouée : constat clos, aucun nouveau |
| 2 | 5 | Revue → Dev | `05-revue.md` v1 constat n° 1 (mineur) : CONVENTIONS § 14 et `rules/frontend-react.md` ne listent ni `PersistentStorage` ni `useStockagePersistant` ; + n° 2 (chronologie PLAN), n° 4 (type `string`) | Corrigé ; Test, Sécurité et Revue rejoués → **GO** |
| 3 | 5 | Revue → Dev (décision utilisateur) | Retour visible après un refus de « Redemander » (`05-revue.md` v2, points non résolus) | Corrigé ; Test, Sécurité et Revue rejoués → **GO**. Boucle 5 au plafond (2/2) : toute nouvelle modification de code = escalade |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
