# Lot `statistiques-podium` — orchestration

## Objectif

Lot 8 de l'étude `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md` (§ Découpage,
§ Écran Statistiques). Refaire l'écran Statistiques en « podium, cible en tête », sans nouvelle
statistique : sélecteur de joueurs qui ne pilote que la cible ; cible du joueur en grand, avec ses
trois zones favorites et ses fléchettes hors cible ; dernier joueur consulté mémorisé
(`usePreference`) avec deux replis ; cartes du podium (Moyenne · First 9 · Meilleure volée,
Victoires, Grosses volées en bâtons de craie plafonnés à 10 groupes, Finitions à trois bascules)
avec pictogrammes en tête ; politique de confidentialité enrichie de la nouvelle clé locale et
redatée. Détail complet et critères : [`request.md`](request.md).

Planche validée : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\stats\stats.html` (écran
« Retenue · 13 octobre », rendu `verif-ecran4.png`) ;
<https://claude.ai/artifact/UcmyFeC4SdDRnrFASvuGEP>.

**Hors périmètre :** toute statistique nouvelle (`GetPlayerStats`, `CareerStats`, domaine
inchangés) ; le résumé de fin de partie ; la fiche joueur complète et la cible partagée ; les
statistiques des autres modes.

## Niveau

high — la politique publique `/confidentialite` change (nouvelle donnée en localStorage) :
décision gravée de `CLAUDE.md` § Décisions structurantes (surface gravée n° 5 de l'index).

## Branche

`lot/statistiques-podium` — créée depuis `main` (`6109013`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

**Lot en parallèle** (§ Lots en parallèle, expérimental) : worktree
`C:\Users\kevin\Documents\Flechettes-statistiques-podium`, en même temps que
`nouvelle-partie-parcours` (`..\Flechettes-nouvelle-partie-parcours`). Port réservé aux
captures du Dev : **5201** (5202 est pris par l'autre lot).

## Provenance

Intake validé : `docs/request/statistiques-podium.md` (validé le 2026-10-15), copié octet pour
octet vers `docs/lots/statistiques-podium/request.md` le 2026-10-15 (empreintes identiques).
Validation : en-tête, statut `Validé`, date, niveau `high` = niveau demandé, commande exacte,
toutes les sections, zéro question bloquante — conforme.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée annoncée par l'intake (politique) |
| 2 | `archi-designer` | Sauté | Idem |
| 3 | `archi-authority` | PASS | Rapport complet, planche lue, points produit posés en U0-U10 |

Agent retenu : authority

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite (Révision 1) | `archi-authority` (départ direct) | `01-architecture.md` |
| Dev | Faite (Révision 1) | `dev` | `02-dev-notes.md` |
| Test | Faite (Révision 1) | `test` | `03-plan-de-test.md` |
| Sécurité | Faite | `sec` | `04-revue-securite.md` |
| Revue | Faite (GO) | `review` | `05-revue.md` |
| Échanges | Faite (à compléter après le rebase) | Orchestrator | `06-echanges.md` |

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
| 2026-10-15 | Index `.ai/architecture-context.md` jugé à jour, non régénéré | Aucune source plus récente que son dernier commit, aucune modifiée dans l'arbre |
| 2026-10-15 | Chaîne d'architecture démarrée à `archi-authority` (opus / max) | Surface gravée annoncée par l'intake |
| 2026-10-15 | `dev`, `test`, `sec` lancés avec `model: "opus"` | § Monter en gamme (surface gravée) |
| 2026-10-15 | Port 5201 réservé aux captures du Dev | Lot en parallèle de `nouvelle-partie-parcours` (port 5202) |
| 2026-10-15 | `archi-authority` lancé (opus / max, frontmatter) : `PASS` | Rapport recopié dans `01-architecture.md` |
| 2026-10-15 | U0 clos par l'Orchestrator : artifact lu via l'outil Artifact, identique à `stats.html` | Vérification, pas un choix produit |
| 2026-10-15 | U1-U10 tranchées par l'utilisateur (`01-architecture.md` § Résolutions) ; U4 = **risque accepté** (titre `laiton` à 4,40:1 en clair) | Gate Architecture : toutes les questions ont une résolution écrite |
| 2026-10-15 | T1-T9 transmises aux phases désignées | Questions techniques de leurs phases |
| 2026-10-15 | `dev` lancé (opus, effort frontmatter medium) : 1116 tests verts, relecture écran faite ; 3 questions produit | Go utilisateur après l'arrêt Archi → Dev |
| 2026-10-15 | 3 questions du Dev tranchées par l'utilisateur (nom accessible court + complet ; joueur seul doré ; égalité non nulle dorée) ; reprise du même `dev` par message (même phase, pas une boucle) → 1118 tests | Gate Dev |
| 2026-10-15 | Joueur seul à 0 : non doré — lecture de l'Orchestrator (réponse 3, plus spécifique), à signaler à l'utilisateur en fin de lot | Conséquence directe des réponses, pas un nouveau choix |
| 2026-10-15 | T1-T5 closes dans `02-dev-notes.md` ; gate Dev passé | — |
| 2026-10-15 | `test` lancé (opus, effort frontmatter high) : passe en lecture seule faute de shell ; commandes et contre-épreuves a-e exécutées par l'Orchestrator (toutes conformes ; e confirme T-M1) | Le rapport le demandait ; travail mécanique, pas de conception |
| 2026-10-15 | Q1-Q3 de Test tranchées par l'utilisateur ; boucle 1 tour 1 vers `dev` (même agent, par message) | Gate Test |
| 2026-10-15 | Test rejoué (`test`, opus, lecture seule) : aucun bug ; contre-épreuves CE-1 à CE-7 exécutées par l'Orchestrator (CE-6 non exécutée, 2 occurrences ; CE-7 confirme TM-d) ; TM-a à TM-d mineurs, non bloquants | Rejeu de la boucle 1 |
| 2026-10-15 | Nouvelle demande de l'utilisateur en cours de lot : « N premiers + bouton qui ouvre la liste complète » ; Orchestrator recommande un lot à part ; **Sécurité suspendue** en attendant sa réponse | Ajout de périmètre à une demande validée |
| 2026-10-15 | Utilisateur : **dans ce lot** ; points tranchés (seuil N + 1, ex aequo à la coupure, bascule des grosses volées, plus de détail Victoires ni de pied Finitions, modal fermé par le retour). Révision 1 écrite dans `docs/request/` (historique conservé ; snapshot `request.md` inchangé). Révision d'architecture : chaîne relancée à `archi-authority` (surface gravée déjà établie) ; Dev / Test remis à *Pas commencée* | § Boucles, 3-4-7 : révision ajoutée à `01-architecture.md` |
| 2026-10-15 | `archi-authority` (opus / max) : Révision 1 `PASS`, recopiée dans `01-architecture.md` ; R1-Q1 à Q9 tranchées par l'utilisateur (Q8 close par sa réponse antérieure) | Gate Architecture (Révision 1) |
| 2026-10-15 | `dev` (opus, repris par message) : Révision 1 + précisions de l'utilisateur pendant le Dev (taille du modal, « Moyenne 3 fl. », fermeture au voile, espacement de la liste) → 1180 tests, rejoués par l'Orchestrator ; Q-B close par l'Orchestrator (technique) | Gate Dev (Révision 1) |
| 2026-10-15 | `test` (opus) rejoué sur la Révision 1 ; CE-16 à CE-22 exécutées par l'Orchestrator ; QO-1 à l'utilisateur, QO-2 close (TM-1 à TM-6 + TM-d exigés) ; boucle 1 tour 3 ; rejeu mécanique par l'Orchestrator (1187 tests, CE-16 à CE-21 → 1 échec chacune) | Gate Test (Révision 1) |
| 2026-10-15 | `sec` (opus, effort frontmatter high) : RAS bloquant, T8 / T17 clos ; `git diff HEAD` des surfaces vide et `npm audit` 0 vulnérabilité (Orchestrator) | Gate Sécurité |
| 2026-10-15 | **`main` a avancé** (`5644892`, lot `nouvelle-partie-parcours` fusionné) : rebase de `lot/statistiques-podium` nécessaire avant fusion, avec accord | § Lots en parallèle, point 6 |
| 2026-10-15 | `review` (opus, effort frontmatter max) : **GO sous réserve** ; utilisateur : T19 / Q3 de `sec` acceptées après le lot, constat 3 corrigé dans ce lot (boucle 5, tour 4), « fl. » sur la grande ligne seule, valeurs chiffrées validées | Gate Revue |
| 2026-10-16 | Commit `33880e9` (accord) ; rebase sur `main` `5644892` (accord) → `11ffb99`, conflits résolus en gardant les deux apports ; 1233 tests ; index régénéré (`architecture-context`, sonnet / high) ; commit amendé | § Lots en parallèle, point 6 |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | Résolutions Q1 (pas de dorure à zéro), Q2 (grand chiffre `craie-vive` sans premier) ; tests manquants T-M1 à T-M6 ; Q3 (écart d'appui) dans la charte | Fait : 1136 tests verts (rejoués par l'Orchestrator) ; Test puis Sécurité rejoués |
| 2 | 4 (assimilée : → Archi, utilisateur d'abord) | Utilisateur → Archi | Ajout de périmètre « N premiers + tout voir » (Révision 1 de `docs/request/statistiques-podium.md`), choisi dans ce lot par l'utilisateur | Fait : Révision 1 `PASS`, Dev / Test / Sécurité rejoués |
| 3 | 1 | Test → Dev | Révision 1 : tests manquants TM-1 à TM-6 et TM-d (CE-16 à CE-21 à 0 échec) ; QO-1 (nom accessible « Moyenne 3 fl., Moyenne 3 fléchettes », choix de l'utilisateur) | Fait : 1187 tests ; CE-16 à CE-21 → 1 échec chacune (rejouées par l'Orchestrator) |
| 4 | 5 | Revue → Dev | Constat 3 (onglet actif ramené dans la vue, choix de l'utilisateur) ; constats 6, 7 (docs) | Fait : 1193 tests ; Test et Sécurité rejoués (Orchestrator, mécanique) ; Revue rejouée sur le delta : GO sous réserve (constat 11) |
| 5 | 6 (assimilée : Revue → Test, test écrit par `dev`) | Revue → Dev | Constat 11 : recadrage au changement de période sans test (contre-épreuve `[actif]` de l'Orchestrator : 88 tests verts) ; date de la politique portée au 16 octobre 2026 (le lot se clôt ce jour) ; constat 13 (CONVENTIONS § 14) | Fait : 1194 tests ; contre-épreuve 1 échec (rejouée par l'Orchestrator) ; Revue → **GO** |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
