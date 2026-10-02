# Lot `installation-guidee` — orchestration

## Objectif

Inviter à installer Dartpéro : port driven d'installation + adapter navigateur (capte
`beforeinstallprompt`, détecte `standalone`, Safari iOS / autre navigateur iOS), exposé via
`Services.devices`. Ligne discrète sur l'Accueil (« Installer » / « Plus tard » mémorisé),
entrée complète dans Réglages → À propos (bouton, guide iPhone en étapes, état installé),
refus de « Redemander » qui renvoie vers l'installation. Manifeste enrichi (`id: '/'`,
`categories`, `shortcuts` « Nouvelle partie », `screenshots` étroites + large) et captures
exclues du précache du service worker. Détail : [request.md](request.md). Lot 2 de la
[feuille de route Play Store](../../prospective/2026-10-01-NEW-feuille-de-route-play-store.md).

**Hors périmètre :** fiche Play Store, TWA, `assetlinks.json`, confidentialité, aide / premier lancement guidé, invitation sur les écrans de partie, captures refaites, tout changement de `MatchEvent` / Dexie / `backupSchema`.

## Niveau

high — forcé : le lot touche le service worker (`globIgnores` Workbox) et le manifeste PWA (surface gravée n° 4).

## Branche

`lot/installation-guidee` — créée depuis `main` avant l'Architecture, fusionnée en `--ff-only` après
accord.

## Provenance

Intake validé : source `docs/request/installation-guidee.md`, copié octet pour octet (`cmp` OK) vers [request.md](request.md) le 2026-10-01. Validation : en-tête, statut `Validé`, date, niveau `high` = niveau demandé, commande manuelle exacte, toutes les sections présentes, questions bloquantes « Aucune ».

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Non lancé | Surface gravée annoncée par l'intake (service worker) : chaîne démarrée à authority |
| 2 | `archi-designer` | Non lancé | Idem |
| 3 | `archi-authority` (opus / max) | `PASS` | Rapport complet, sections exigées présentes |

Agent retenu : **authority**

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
| 2026-10-01 | Index `.ai/architecture-context.md` jugé à jour, non régénéré | Dernier commit de l'index = dernier commit de ses sources ; aucune source modifiée dans l'arbre |
| 2026-10-01 | Chaîne démarrée à `archi-authority` (opus / max) ; `dev`, `test`, `sec` lancés en `model: opus` | Surface gravée : service worker + manifeste (skill § Monter en gamme) |
| 2026-10-01 | Architecture : `archi-authority` lancé (opus / max, frontmatter), `PASS` retenu. Option D : services créés une fois dans `main.tsx` avant `createRoot` ; port synchrone `state` / `subscribe` / `prompt` ; contrôles du build dans `smoke-build.mjs` | Capter `beforeinstallprompt` avant tout rendu ; `useSyncExternalStore` |
| 2026-10-01 | Gate Architecture : 5 questions. Q2 close (dimensions mesurées à l'intake) ; Q1 et Q3 renvoyées au Dev, validées à l'arrêt de fin de lot ; Q4 hors lot (PLAN § 0) ; Q5 rattachée à Sécurité. Résolutions écrites dans `01-architecture.md` | Aucune ne bloque le Dev |
| 2026-10-01 | Constat hors périmètre remonté par l'architecture : défaut double out à `false` dans `NouvellePartieEcran.tsx:204`, contraire à `CLAUDE.md`. Signalé à l'utilisateur, non traité dans ce lot | Hors périmètre de l'intake |
| 2026-10-01 | ⏸ Arrêt Architecture → Dev : confirmation explicite de l'utilisateur (« go dev ») | Arrêt obligatoire (étape 2) |
| 2026-10-01 | Dev : `dev` lancé (**opus**, effort medium / `maxTurns` 100 du frontmatter, non atteint). 4 ajustements, aucune refonte ; 437 tests verts, build + smoke verts, 3 mutations vérifiées ; docs du § 8 écrites par le Dev | Gate Dev : 5 questions, toutes résolues dans `02-dev-notes.md` § Résolutions (Q1 → fin de lot, Q2 → PLAN § 0, Q3 → Sécurité, Q4 → refresh avant Revue, Q5 `.gitattributes` → utilisateur, hors lot) |
| 2026-10-01 | Test : `test` lancé (**opus**, effort high du frontmatter). PASS, aucun bug ; 12 mutations UI/adapter + 4 mutations smoke ; L1 (double appel non vu en UI) et L2-L4 optionnelles | Gate Test : L1 acceptée sans boucle (unicité testée dans l'adapter, M5 détectée) ; O2 / relecture → fin de lot ; R → PLAN § 0. Résolutions dans `03-plan-de-test.md` |
| 2026-10-01 | Sécurité : `sec` lancé (**opus**, effort high du frontmatter). PASS ; Q5 de l'architecture close (4 points conformes) ; 3 observations ; R1, R5 résiduels | Gate Sécurité : R3 / R4 « acceptés » par l'architecture mais non signés → à signer par l'utilisateur à l'arrêt de fin de lot (`04-revue-securite.md` § Résolutions) |
| 2026-10-01 | `/refresh-architecture` (agent `architecture-context`, sonnet / high, brief lu sur disque) → 153 l. / 13 090 o. LF (13 243 CRLF). `Services.devices` cite `appInstallation` ; nouveau constat n° 9 (moyenne) : double out `false` dans `NouvellePartieEcran.tsx:204`, introduit par `577dc5f` (« ce que l'usage a tranché »), non enregistré dans `CLAUDE.md` | Le lot grave une décision durable (avant Revue, pour qu'elle le vérifie) |
| 2026-10-01 | Revue v1 : `review` lancé (opus / max, frontmatter). **No-go** sur constat n° 1 (mineur, renvoi Dev : `rules/frontend-react.md:13` sans `useInstallation`) → boucle 5 automatique, tour 1/5. Inclus dans le même tour : n° 2 (fake qui compte chaque appel, revérifié par M1) et n° 11 (dérives de doc). n° 12 corrigé par l'Orchestrator dans `01` (référence de commit) | n° 2 et n° 11 triviaux, Test / Sécu / Revue rejoués de toute façon ; n° 3-10 sans renvoi (étape 8 ou hors lot) |
| 2026-10-01 | Boucle 5 tour 1 : `dev` (opus / medium) corrige n° 1, 2, 11 (437 tests, mutation M1 détectée). `/refresh-architecture` (sonnet / high) → 153 l. / 13 102 o. LF (13 255 CRLF). `test` rejoué (opus / high) : PASS, L1 close. Question « autres lignes de la feuille de route » close par l'Orchestrator (revérifiées) | Gate Test : aucune question ouverte |
| 2026-10-01 | `sec` rejoué (opus / high) : PASS, aucune surface ouverte. Nouveau résiduel : prénoms « Kevin » / « Julien » publiés via les captures (première publication, pas de remote) ; prémisse « déjà publiques » corrigée par l'Orchestrator dans `04` | Gate Sécurité : résiduel à signer à l'étape 8 avec R3 / R4 |
| 2026-10-01 | Revue rejouée (opus / max) : **GO** (v2). n° 1, 2, 8, 11, 12 clos ; nouveaux n° 13 (mineur, prénoms → étape 8), 14, 15 (info) ; corrections directes de l'Orchestrator jugées légitimes | Fin des phases ; 1 tour de boucle sur 5 |
| 2026-10-01 | `06-echanges.md` écrit (v1) ; ⏸ arrêt de fin de lot | Étape 8 |
| 2026-10-02 | ⏸ Arrêt de fin de lot — réponses explicites de l'utilisateur : **R3 et R4 signés** (« J'accepte les deux ») ; **prénoms « Kevin » / « Julien » signés** (« Oui, ça me va ») ; **`.gitattributes` (`eol=lf`) dans ce lot** ; libellés : **« Corriger iPad d'abord »** | Les signatures closent `04` Q1 / Q2 et le constat n° 3 / n° 13 de la Revue. La correction des libellés et le `.gitattributes` changent le livrable → boucle 5 (Revue → Dev), tour 2/5 (2/2 pour la boucle 5) |
| 2026-10-02 | Tour 2 : `dev` (opus / medium) livre libellés iPad + `.gitattributes` + ligne `CLAUDE.md` § Environnement ; 437 tests ; état git vérifié par l'Orchestrator (17 fichiers modifiés, tout en LF) | Gate Dev : aucune question ouverte |
| 2026-10-02 | `/refresh-architecture` (sonnet / high) → 154 l. / 13 132 o. LF ; limite « pas de `.gitattributes` » retirée, constat n° 10 (basse) ajouté : `skills/audit/SKILL.md:44` cite encore son absence. `test` rejoué (opus / high) : PASS ; lacune optionnelle (verrou de libellé) acceptée sans boucle ; `00` repassé en LF | Gate Test : aucune question ouverte |
| 2026-10-02 | `sec` rejoué (opus / high) : PASS, aucun constat ; `.gitattributes` sûr pour les binaires ; rien de perdu par le `git checkout --` | Gate Sécurité : aucune question ouverte |
| 2026-10-02 | Revue rejouée (opus / max) : **GO** (v3). n° 3, 6, 7, 13 clos ; nouveaux n° 16 (mineur : `git checkout --` du Dev hors mandat, sans dommage), 17-19 (info). `06-echanges.md` v2 en tête ; ⏸ arrêt : go final de l'utilisateur | Fin des phases ; 2 tours de boucle sur 5, boucle 5 au plafond (2/2) |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 5 | Revue → Dev | Constat n° 1 (+ n° 2, n° 11 embarqués) | Corrigé ; Test, Sécu, Revue rejoués PASS / PASS / GO |
| 2 | 5 | Revue (arrêt de fin de lot) → Dev | Décision utilisateur : libellés iPad + `.gitattributes` | Livré ; Test, Sécu, Revue rejoués PASS / PASS / GO |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
