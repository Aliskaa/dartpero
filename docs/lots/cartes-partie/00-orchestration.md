# Lot `cartes-partie` — orchestration

## Objectif

Les cartes de partie, à l'Accueil et dans Parties, en **mélange 1 + 2** :
- la partie en cours de l'Accueil en **mini tableau** (une ligne par joueur, classée, jauge de son
  jeu, « Reprendre ») ;
- toutes les autres en **lignes de feuille** (colonne pictogramme · détail · unité, titre pour un
  nom tapé seulement, joueurs classés, grille 2 × 2 à 4 joueurs, premier en laiton) ;
- un **classement** des joueurs calculé hors de l'UI (fonction pure de `src/core/application`),
  d'après `CLAUDE.md` § Règles du jeu, cut-throat compris.

Charte mise à jour. Détail et critères 1 à 8 : [request.md](./request.md) ; planche :
<https://claude.ai/artifact/XH8i1UvuqNNSgC4cexEGMd>.

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 7 du § Découpage en
lots et § Cartes de partie.

**Hors périmètre :**
- badges de moments ;
- tout nouveau champ de `MatchSummary`, le domaine, les formats persistés, les règles de jeu ;
- le petit texte `text-laiton` préexistant (#21 de l'index) ;
- le groupement de Parties, le plafond de l'Accueil, `matchStatus`.

## Niveau

`light` — aucune surface gravée (UI, fonction pure d'`application`). Si l'Architecture place le
classement dans `src/core/domain/` : arrêt, retour utilisateur, passage en `high`.

light

## Branche

`lot/cartes-partie` — créée depuis `main` (`e206bc9`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/cartes-partie.md` (validé le 2026-10-15), copié octet pour
octet vers `docs/lots/cartes-partie/request.md` le 2026-10-15 (empreintes SHA-256 identiques).
Validation : en-tête, statut `Validé`, date, niveau `light` = niveau demandé, commande exacte,
toutes les sections, zéro question bloquante — conforme.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS, puis écarté | prenait des décisions produit (avec les §§ 10-11 de l'Orchestrator) ; briefs mis à jour à la demande de l'utilisateur |
| 1 bis | `archi-scout` (brief mis à jour) | PASS | planche lue, technique seul, 14 questions pour l'utilisateur |
| 2 | `archi-designer` | non lancé | scout en PASS (planche lue) |
| 3 | `archi-authority` | non lancé | aucune surface gravée |

Agent retenu : scout

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite | `test` | `03-plan-de-test.md` |
| Sécurité | Hors niveau | `sec` | `04-revue-securite.md` |
| Revue | Hors niveau | `review` | `05-revue.md` |
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
| 2026-10-15 | Index `.ai/architecture-context.md` à jour, non régénéré | Aucune source plus récente que son dernier commit ni modifiée |
| 2026-10-15 | Niveau `light` confirmé | Intake `light`, aucune surface gravée annoncée |
| 2026-10-15 | La modification de l'étude (choix du lot 7) voyage avec la branche | Faite pendant l'intake de ce lot |
| 2026-10-15 | Architecture : `archi-scout` (sonnet / low, frontmatter), avec consigne de lire la planche | Leçon du lot 6b (scout sans planche) |
| 2026-10-15 | Scout PASS en 1 tentative : classement en `application/use-cases/rankPlayers.ts`, deux composants, 6 étapes, § Conformité à la planche | Lot reste `light` |
| 2026-10-15 | Orchestrator : §§ 10-11 ajoutés (état Cricket au tour de table ; Q1-Q4 closes, exception `use-cases/` étendue) | Relecture contre la planche |
| 2026-10-15 | Gate Architecture : aucune question ouverte | En attente du go |
| 2026-10-15 | Avant le go, l'utilisateur fait mettre à jour les architectes : planche validée suivie à l'identique, aucune décision produit (`.claude/agents/archi-scout.md`, `archi-designer.md`, `archi-authority.md`, `archi.md`, et `orchestrate/SKILL.md` : chaîne et gate) | Tentative 1 et §§ 10-11 de l'Orchestrator tranchaient des points produit |
| 2026-10-15 | Architecture relancée : `archi-scout` tentative 2 (sonnet / low) sous le brief mis à jour ; les points produit de la tentative 1 doivent revenir en questions pour l'utilisateur | Nouvelle règle |
| 2026-10-15 | Scout tentative 2 : PASS, « Écarts : aucun », Q1-Q14 posées ; l'utilisateur les tranche (R1-R11 dans `01-architecture.md`) ; `01-architecture.md` réécrit depuis ce rapport | Aucune décision produit prise par un agent ni par l'Orchestrator |
| 2026-10-15 | Gate Architecture : questions utilisateur closes ; T1-T3 techniques laissées au Dev / à la relecture | En attente du go |
| 2026-10-15 | Go de l'utilisateur (« ok », interprétation des ex æquo acceptée) ; Dev : `dev` (sonnet / medium, maxTurns 100, frontmatter) | Plan en 6 étapes |
| 2026-10-15 | Dev terminé en 1 lancement ; contrôles relancés par l'Orchestrator : lint, typecheck, 1057 tests, build verts, encodage propre | `02-dev-notes.md` |
| 2026-10-15 | Écarts et points produit du Dev soumis à l'utilisateur (D1) : 3 corrections demandées, le reste accepté ; même agent `dev` repris par message | Aucune décision produit par l'Orchestrator |
| 2026-10-15 | Corrections D1 faites ; contrôles relancés : 1059 tests verts ; gate Dev passé (D1 close) ; Test : `test` (sonnet / high) | — |
| 2026-10-15 | Test #1 PASS (Q-A, Q-B à l'utilisateur) → boucle 1 ; Test #2 PASS (4 questions à l'utilisateur, phrases validées) → boucle 2 ; Test #3 PASS, aucune question | 2 tours sur 5 ; N1 en dette |
| 2026-10-15 | Index régénéré (charte et CONVENTIONS modifiées) avant `06-echanges.md` | Sources modifiées dans l'arbre |
| 2026-10-15 | Index : `architecture-context` (sonnet / high), 153 lignes, 13 283 octets ; #15 retiré, #24 nouveau (Basse) ; `06-echanges.md` écrit ; arrêt de fin de lot | En attente du go |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | Décisions utilisateur Q-A (pas de teinte si tous égaux) et Q-B (« — » au lieu de « 0/0 ») ; NB1, NB4 (tests), NB7 (docs) ; captures à refaire | Fait (même agent `dev`, repris par message) : Q-A, Q-B (« — », phrase « Kevin aucune sortie jouée »), NB1, NB4, NB7 ; captures refaites ; 1063 tests verts, contrôles relancés par l'Orchestrator |
| 2 | 1 | Test → Dev | Test #2 PASS ; décisions utilisateur : corbeille « Sûr ? » remplacée par l'icône seule à 48 px fixe ; « Kevin, aucune sortie jouée » ; solo sans teinte confirmé (test) ; troncature du titre à sets tolérée ; doc `CONVENTIONS.md:298-300` | Fait (même agent) : corbeille `w-12` dans les deux états, phrase avec virgule, test solo, doc ; capture v3 : noms entiers ; 1065 tests verts, contrôles relancés par l'Orchestrator |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
