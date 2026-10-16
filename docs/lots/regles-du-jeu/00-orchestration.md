# Lot `regles-du-jeu` — orchestration

## Objectif

Lot 11 de la refonte (`docs/prospective/2026-10-13-NEW-revision-charte-graphique.md` § Découpage).
Demande validée : [`request.md`](request.md), à lire sans la réécrire. En bref :

- un **livre ouvert** à l'étape 2 et dans le bandeau du match des quatre modes ouvre une **feuille
  de règles par-dessus** l'écran (jamais de changement de route ; le retour du téléphone la ferme) ;
- la feuille : « Ce soir » et « En bref » toujours ouverts, puis des **rubriques repliables** sur le
  plan de DartsOn ; texte X01 et Cricket **mot pour mot** celui de la planche, texte qui suit les
  réglages ; « Les règles en entier » disparaît ;
- **domaine** : S1 proposé à un reste de 1 en sortie libre (`checkout.ts`) ; **écran X01** :
  « Pas de finish » suit la sortie (180 en sortie libre) ;
- `CLAUDE.md` : § Checkouts précisé (deux listes), nouveau § Règles de l'entraînement.

Planche validée, à suivre à l'identique :
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\regles\regles-rubriques.html` —
<https://claude.ai/artifact/86bxSsA98uZQpkp6GWZ7pb> (reprend `regles.html` du même dossier pour
le livre, la feuille par-dessus, la fermeture et le paysage).

**Hors périmètre :** les 14 changements de règles façon DartsOn (étude puis un lot `high` chacun),
le texte de DartsOn lui-même, les règles hors étape 2 et match, le lot 13 `volee-partielle`.

## Niveau

high — surfaces gravées : `src/core/domain/services/checkout.ts`, `CLAUDE.md` § Règles du jeu
(Checkouts) et nouveau § Règles de l'entraînement.

## Branche

`lot/regles-du-jeu` — créée depuis `main` (`5644892`) avant l'intake, dans le worktree
`C:\Users\kevin\Documents\Flechettes-regles-du-jeu` (mode lots en parallèle). Port réservé aux
captures du Dev : **5203** (5201 est pris par `statistiques-podium`, 5202 a servi à
`nouvelle-partie-parcours`). Fusion en `--ff-only` dans le dépôt principal après accord.

## Provenance

Intake validé : `docs/request/regles-du-jeu.md` (2026-10-15), copié octet pour octet vers
`docs/lots/regles-du-jeu/request.md` le 2026-10-15 (empreintes SHA-256 identiques). Validation :
en-tête, statut `Validé`, date, niveau `high` = niveau demandé, commande exacte, toutes les
sections de `docs/request/README.md`, zéro question bloquante — conforme.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée annoncée par l'intake |
| 2 | `archi-designer` | Sauté | Surface gravée annoncée par l'intake |
| 3 | `archi-authority` | PASS | Rapport complet ; planche lue ; 10 questions pour l'utilisateur, aucun point produit tranché |

Agent retenu : authority

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite (Révision 1) | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Faite (Révision 1) | `dev` | `02-dev-notes.md` |
| Test | Faite (passes 3-4, Révision 1) | `test` | `03-plan-de-test.md` |
| Sécurité | Faite (passe 2) | `sec` | `04-revue-securite.md` |
| Revue | Faite (passe 2 : GO conditionné aux docs, faites) | `review` | `05-revue.md` |
| Échanges | Faite | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| Q1-Q10 (texte X01, textes non dessinés, largeur paysage, livre au bandeau, rouge / vert, laiton, pictogramme, traduction en jetons, pastilles Cricket, grille Tour du monde) | `01-architecture.md` § Questions ouvertes | Utilisateur | Close — `01-architecture.md` § Réponses de l'utilisateur |
| D1-D10, T1-T6, S1 | `01-architecture.md` § Techniques | Dev / Test / Sécurité (consignes de phase) | Transmises à la phase concernée |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-15 | Niveau `high` confirmé | Domaine (`checkout.ts`) et règles gravées de `CLAUDE.md` |
| 2026-10-15 | Index `.ai/architecture-context.md` jugé à jour | Même commit (`5644892`) que `CLAUDE.md`, CONVENTIONS et charte ; rules et DEPLOIEMENT plus anciens ; arbre propre |
| 2026-10-15 | Chaîne démarrée à `archi-authority` (opus / max) ; `dev`, `test`, `sec` lancés en `opus` | § Monter en gamme : surface gravée |
| 2026-10-15 | `archi-authority` (opus / max, frontmatter) → PASS, 115 appels d'outils ; `01-architecture.md` écrit depuis ce rapport | Arrêt Archi → Dev : Q1-Q10 posées à l'utilisateur |
| 2026-10-15 | Gate Archi : Q1-Q10 closes par l'utilisateur (réponses dans `01-architecture.md`) ; Q8 : « pixels exacts » ramené, avec son accord, à « exact sauf les tailles sous le plancher 0,75 rem » (décision `charte-typo-mouvement`, garde `typographieBoundary`) ; D/T/S transmises aux phases | Toutes les questions ont une résolution écrite |
| 2026-10-16 | `dev` lancé en **opus** (effort `medium` et `maxTurns` 100 du frontmatter) ; arrêt au plafond de 100 tours sans rapport, lot à moitié fait (constat dans `02-dev-notes.md`) | Lot trop entamé pour être coupé : le même agent est repris par `SendMessage` (contexte conservé) pour finir et rendre son rapport |
| 2026-10-16 | `dev` repris → rapport complet (1158 tests verts, build OK) ; gate Dev : DV1-DV4 tranchées par l'utilisateur (bandeau resserré, deux lignes acceptées, pas de ligne « Entrée libre », +60 cut-throat en rouge) ; DV5 → relecture à l'écran ; DV6-DV8 → Test, Sécurité, Revue | Questions produit à l'utilisateur, techniques transmises |
| 2026-10-16 | `dev` repris une 2e fois pour DV1 et DV4 → fait, 1158 tests verts, build OK ; Dev **Faite** | Toutes les questions du Dev ont une résolution écrite (`02-dev-notes.md`) |
| 2026-10-16 | `test` lancé en **opus** (effort `high`) : analyse statique seulement (pas de shell dans sa session) ; l'Orchestrator lance lint, typecheck, `vitest` (1158 verts), build et 6 contre-épreuves (toutes rouges, restauration vérifiée) | Vérification exécutée faute de shell chez l'agent ; pas de raisonnement de phase refait |
| 2026-10-16 | Gate Test : C6 tranché par l'utilisateur (aligner `CLAUDE.md` sur le code) ; C1, C2-C5, C10 → boucle 1 tour 1 vers Dev ; C7, C9 → Revue | Bug et trous classés par la phase |
| 2026-10-16 | Boucle 1 tour 1 : `dev` repris (3e reprise) → C1-C6, C10 faits ; Orchestrator : lint, typecheck, 1172 tests, build, contre-épreuves M8 / M9 / C1 rouges ; Test **Faite** (passe 2 dans `03-plan-de-test.md`) | Tour de boucle 1/5 consommé |
| 2026-10-16 | `sec` lancé en **opus** (effort `high`) | § Monter en gamme |
| 2026-10-16 | `sec` → PASS, RAS ; sans shell : l'Orchestrator lance `git diff` sensibles (vide), bornes de `labels.ts` (`SECTIONS_CONFIDENTIALITE` intacte), `npm audit` (8 vulnérabilités préexistantes, lockfile inchangé) ; question `/confidentialite` tranchée par l'utilisateur (rien à ajouter) ; Sécurité **Faite** | Gate : toutes les questions ont une résolution écrite |
| 2026-10-16 | `review` lancé (opus / max, frontmatter) | Phase Revue |
| 2026-10-16 | `review` → **NO-GO** (constat 1 majeur : `main` a reçu `Modale` + `useModaleAuRetour`, même patron ; constats 2-8 mineurs) ; `05-revue.md` écrit | Phase Revue |
| 2026-10-16 | Utilisateur : **converger** sur `useModaleAuRetour` (boucle 7, Revue → Archi) ; **rebaser maintenant** ; corriger C9 ; vérifications sur appareil (R1, R2, iPhone) acceptées **à la relecture** | Questions de Revue closes par l'utilisateur |
| 2026-10-16 | Commit temporaire `wip(regles-du-jeu)` (accord de l'utilisateur), `git rebase main` (`26a39fb`) → `9dff1a4`. Conflits : CONVENTIONS § 9 et § 14, `rules/frontend-react.md`, PROJECT_PLAN § 4 et § 6 — **les deux apports gardés**, doublons marqués « ⚠️ À FUSIONNER » pour la convergence. Typecheck rouge attendu : `LIBELLE_FERMER` déclaré deux fois (`labels.ts:919`, `:1165`) | § Lots en parallèle, point 6 ; le commit du lot remplacera le WIP |
| 2026-10-16 | Boucle 7 : Révision 1 de `01-architecture.md` ; chaîne relancée à `archi-authority` (surface gravée déjà établie) ; Dev, Test, Sécurité, Revue remis à *Pas commencée* | Plafond : tour 2/5 |
| 2026-10-16 | `archi-authority` (opus / max) → PASS, Révision 1 : convergence (`useModaleAuRetour` + nouveau `useDialogueNatif` partagé avec `Modale`, `useFeuilleRegles` supprimé, `<dialog>` permanent, contenu seulement ouvert), constats 2-8, tri du 12 ; U1 → utilisateur **(b) appui à côté ferme** ; U2 → **(a) se rouvre** ; garde des jetons retenue (technique) | Gate Archi : toutes les questions closes ; arrêt Archi → Dev |
| 2026-10-16 | Go utilisateur ; `dev` **neuf** lancé en opus (effort `medium`, `maxTurns` 100) → Révision 1 faite dans le plafond ; Orchestrator : lint, typecheck, **1329 tests**, build, 10 contre-épreuves rouges, clés et hooks vérifiés ; Dev **Faite** | Repli C9 et captures → relecture à l'écran |
| 2026-10-16 | `test` lancé en opus (passe 3, Révision 1) | Boucle 7 : rejouer Test, Sécurité, Revue |
| 2026-10-16 | `test` passe 3 → bug P3-1 (confirmé par Grep) + trous P3-2 à P3-6 ; P3-7 tranché par l'utilisateur (phrase neutre) ; boucle 1 tour 3 → `dev` (agent de la Révision 1 repris) | Tour 3/5 |
| 2026-10-16 | Tour 3 fait ; Orchestrator : lint, typecheck, **1340 tests**, build, contre-épreuves P3-1 / P3-3 rouges ; Test **Faite** ; `sec` passe 2 lancé en opus | Boucle 7 : rejouer Sécurité |
| 2026-10-16 | `sec` passe 2 → PASS, RAS ; Orchestrator : `git diff` sensibles vide, `src/core` = domaine du lot seulement, `SECTIONS_CONFIDENTIALITE` intacte, `npm audit` inchangé ; Sécurité **Faite** ; `review` passe 2 lancé (opus / max) | Boucle 7 : rejouer Revue |
| 2026-10-16 | `review` passe 2 → **GO** conditionné aux docs ; README corrigé (choix de l'utilisateur) ; Orchestrator : PROJECT_PLAN (§ 0, 1.4, 2, 4, 6), `02-dev-notes.md` session 6, étude, `05-revue.md` passe 2, `06-echanges.md` ; `architecture-context` (sonnet / high, brief lu sur disque) lancé | Gravures avant commit ; R2-10 à R2-13 laissés (facultatifs) |
| 2026-10-16 | Index régénéré (14e passe) : 150 lignes, 13 299 octets ; #3, #5, #12, #16, #19, #25 retirés (revérifiés), #28 nouveau (garde des jetons), #11 étendu ; écart signalé : le brief `architecture-context.md` dit encore l'entraînement « non gravé ». Vérification finale Orchestrator : lint, typecheck, **1340 tests**, build, aucun mojibake ; `git status` = fichiers du lot seulement | Arrêt de fin de lot : go utilisateur |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | C1 (croix inopérante après « suivant ») ; trous de test C2, C3, C4, C5, C10 ; alignement `CLAUDE.md` C6 (tranché par l'utilisateur) | Fait : 1172 tests verts ; contre-épreuves M8, M9, C1 rouges |
| 2 | 7 | Revue → Archi | Constat 1 : converger sur `useModaleAuRetour` (choix de l'utilisateur) ; constats 2-8 dans le même tour | Faite (Révision 1 : 1329 tests, 10 contre-épreuves rouges) |
| 3 | 1 | Test → Dev | P3-1 (`pl-11font-score`) ; trous P3-2 à P3-6 ; P3-7 phrase neutre (tranché par l'utilisateur) | Fait : 1340 tests ; contre-épreuves P3-1, P3-3 rouges |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
