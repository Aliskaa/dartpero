# Lot `killer` — orchestration

## Objectif

Ajouter le **Killer**, cinquième mode de jeu de Dartpéro, par la couture `GameMode` : chaque joueur (2 à 6)
a un numéro de 1 à 20 (bulle exclue, tirage écrit dans le journal, modifiable à la main avant le
lancement) et des vies (3, ou 5) ; on devient killer en touchant le double de son numéro (les fléchettes
suivantes de la volée comptent tout de suite), puis on retire 1 / 2 / 3 vies aux adversaires (simple /
double / triple) ; élimination à 0 vie, joueur sauté ; dernier survivant gagnant, volée arrêtée sur la
fléchette qui élimine le dernier adversaire, `BoiteConfirmation` « Valider la sortie » ; classement par
ordre d'élimination ; hors statistiques de carrière ; variante « son propre numéro coûte des vies »
(désactivée par défaut). Domaine, application, persistance (`MatchEvent`, `backupSchema`), UI (hook
`useKiller` branché sur `useVoleeEnCours`, écran, résumé, carte, tuile à l'étape 1, réglages et
attribution des numéros à l'étape 2, feuille de règles, voix), documentation. Détail et règles validées :
`request.md` (snapshot de `docs/request/killer.md`). Planche validée, suivie à l'identique :
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\killer\killer.html` (captures PNG dans le même dossier).

**Hors périmètre :** statistiques de carrière ; solo, bulle comme numéro, numéro partagé ; autre barème,
« un simple suffit », transfert de vies ; Shanghai ; nouveau mécanisme d'ordre ; nouvelle table Dexie (le
journal suffit). **Élargissements du 2026-10-20, dans le périmètre à la demande de l'utilisateur** : la mention
« Éliminé par … » du résumé (déduite du journal) et le **genre du profil** (accord « éliminé / éliminée »).

## Niveau

`high`. Surfaces gravées : `src/core/domain/` (règles, événements), couture `GameMode`, format persisté
(`MatchEvent`, `backupSchema`), décisions de `CLAUDE.md` (« Killer hors périmètre v1 » levé ; règles du
jeu à graver).

high

## Branche

`lot/killer` — créée depuis `main` (`40ccd65`) avant l'Architecture, fusionnée en `--ff-only` après
accord.

## Provenance

Intake validé : source `docs/request/killer.md` (statut Validé, 2026-10-19, niveau `high`, commande exacte
`/orchestrate killer high`, toutes les sections de `docs/request/README.md` présentes). Snapshot
`docs/lots/killer/request.md` copié le 2026-10-19, octet pour octet (SHA-256 `4BD7087E…412F`, identique à
la source).

**Révision du 2026-10-20** : la demande a été révisée et revalidée par l'utilisateur (`/intake killer`,
confirmation explicite) : règles 13 (genre du profil) et 14 (« Éliminé par … »), réponses aux quinze questions
de l'architecte, planche `genre-profil`. Le snapshot `request.md` a été **remplacé** par la version révisée
(SHA-256 `D3FBB5B3…DD62`, identique à la source) ; la version d'origine est gardée telle quelle dans
`request-2026-10-19.md` (SHA-256 `4BD7087E…412F`). Ce remplacement a l'accord de l'utilisateur (la règle
« ne jamais écraser un snapshot » vise un conflit de provenance non voulu).

Points de la demande d'origine lus comme **périmés** (corrigés par la révision), sans conséquence (notés, pas corrigés : le snapshot reste
octet pour octet) : § Dépendances dit `volee-partielle` « en cours » et `phrases-victoire` « non fusionné »
— les deux sont fusionnés dans `main` ; § Questions bloquantes garde un paragraphe de gabarit (« Reste la
confirmation explicite… ») alors que l'en-tête est `Validé` et que la liste est vide (« Aucune »).

## Architecture — chaîne

Surface gravée annoncée par l'intake : la chaîne démarre à `archi-authority` (scout et designer sautés,
`orchestrate` § Chaîne d'architecture).

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée (domaine, couture, format persisté) |
| 2 | `archi-designer` | Sauté | Surface gravée |
| 3 | `archi-authority` | PASS | Rapport rendu dans le plafond (65 appels d'outils) ; non vérifié listé dans `01-architecture.md` |

Agent retenu : `archi-authority`

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite (Révision 1 PASS + 10 réponses de l'utilisateur) ; attend le go de l'arrêt Archi → Dev | `archi-authority` (scout, designer sautés) | `01-architecture.md` |
| Dev | Faite (passes 1, 2a, 2b ; 1912 tests verts ; docs par l'Orchestrator en cours) | `dev` | `02-dev-notes.md` |
| Test | Faite (GO avec réserves : aucun bug d'implémentation ; problèmes de test à combler, mutations à faire) | `test` | `03-plan-de-test.md` |
| Sécurité | Faite (GO ; C1 texte, R1-R4 à signer) | `sec` | `04-revue-securite.md` |
| Revue | Faite (NO-GO conditionnel : points à signer ; go de fusion donné par l'utilisateur, voir journal) | `review` | `05-revue.md` |
| Échanges | Faite | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| Brouillon de volée à Killer (`useKiller` comme cinquième hook) | `request.md`, non bloquante | `archi-authority` | Close : oui, `useVoleeEnCours` (`01`) |
| Clé de préférence `partie:killer-*`, forme de l'événement d'ouverture / de volée, version `backupSchema` | `request.md`, non bloquante | `archi-authority`, puis Revue | Close (`01`) ; Revue relit |
| Forme du classement (résumé, `rankPlayers`) | `request.md`, non bloquante | `archi-authority` | Close : `KillerRules.ranking` (`01`) |
| Texte et date de `/confidentialite` (seulement si une donnée stockée hors journal apparaît) | `request.md`, non bloquante | `archi-authority`, puis Revue | Close par la Révision 1 : **mis à jour** (genre, date du 21 octobre 2026, lignes 438 / 448 / 457), relu par `sec` et la Revue |
| **Questions produit 1 à 15** du rapport d'architecture (accord éliminé / éliminée, « Éliminé par », « On remet ça », sélection de joueurs, étape 1, rangée « Ou un autre jeu », filtre de Parties, textes des cartes, mini tableau, « −N », voix, résumé, étape 2, `rouge-touche`, découpage) | `01-architecture.md` § Questions | **Utilisateur**, à l'arrêt Archi → Dev | 14 sur 15 closes le 2026-10-20 (voir `01-architecture.md` § Réponses). **Reste ouverte** : la conséquence de la réponse 1 (genre du profil) et de la réponse 2 (« Éliminé par »), qui élargissent le périmètre au-delà de la demande validée |
| Genre du profil (valeurs, défaut, où se choisit, import ancien, politique `/confidentialite`, planche de l'écran joueur) et « Éliminé par … » : changement de périmètre | `01-architecture.md` § Réponses 1 et 2 | **Utilisateur** : révision de la demande (`/intake killer`) + planche, puis Révision de `01` | Close : demande révisée (2026-10-20), Révision 1 de `01-architecture.md` PASS (pas de `db.version`, `BACKUP_VERSION` 1, politique mise à jour, `genreBoundary`, deux passes `dev` listées), 10 questions produit tranchées le 2026-10-21 (`01` § Réponses à la Révision 1) |
| `Rejouer` : numéros re-tirés ou repris | `request.md`, non bloquante | Close par la planche : « Rejouer : nouveau tirage des numéros » | Close (planche) |
| Précisions déduites des règles (simple / triple de son numéro avant killer, numéro non attribué, plancher à 0, bulle : sans effet) | `request.md`, non bloquante, « validation rapide » | Critères d'acceptation 4, 5, 7 de la demande validée | Close (critères) |
| Perte de vie en rouge : `--rouge-texte` réservé à la feuille de règles ; proposition `rouge-touche` (jeton général) | planche, non tranché | Utilisateur | Close le 2026-10-20 : `rouge-touche` (réponse 14) |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-19 | Index d'architecture jugé à jour, non régénéré | Horodatage du dernier commit de l'index égal à celui de `CLAUDE.md` et `CONVENTIONS` ; aucune source modifiée dans l'arbre (seuls `.claude/settings.json` et `.claude/hooks/` de l'utilisateur, hors sources) |
| 2026-10-19 | Chaîne démarrée à `archi-authority`, `dev` / `test` / `sec` en `opus` | Surfaces gravées multiples, `orchestrate` § Monter en gamme |
| 2026-10-19 | Lot mené dans le dépôt principal, sans worktree | Aucun autre lot en cours |
| 2026-10-19 | Brief d'`archi-authority` : budget de tours borné, rapport à rendre avant le plafond de 40 tours | `archi-authority`, `sec` et `review` ont atteint leur plafond sans rapport sur `volee-partielle` |

| 2026-10-20 | `archi-authority` : 1 lancement, opus / max (frontmatter), PASS dans le plafond. Réponses de l'utilisateur à 14 des 15 questions (en 3 séries) ; réponse 1 « accord de la planche » → « ajouter un genre au profil, dans ce lot » ; réponse 2 « Éliminé par » : oui | Voir `01` § Réponses. Les deux élargissent le périmètre : l'Orchestrator ne les tranche pas, il les remonte |

| 2026-10-20 | `/intake killer` (révision) : planche `genre-profil` produite par l'Orchestrator (publiée, validée : piste B, « Masculin · Féminin · Non précisé », aide telle quelle) ; demande révisée et confirmée ; snapshot remplacé, ancien gardé. `archi-authority` relancé pour la Révision de `01-architecture.md` (boucle Archi ouverte par l'utilisateur, avant Dev) | Changement de périmètre voulu par l'utilisateur : second format persisté (profil), politique `/confidentialite`, écran joueur |

| 2026-10-21 | `archi-authority` (Révision 1) : 1 lancement, opus / max, PASS dans le plafond (60 appels d'outils). 10 questions tranchées par l'utilisateur ; deux réponses s'écartent des recommandations : coupe **écrite** de la sélection de joueurs (R1.4) et **dessin exact** du choix du genre (R1.5, composant dédié) | Réponses de l'utilisateur ; le comportement ouvert de la ligne Genre n'a pas été tranché explicitement (relecture à l'écran) |

| 2026-10-21 | Passe 1 `dev` : opus, 1 lancement + 1 relance pour le rapport ; plafond de 100 tours atteint sans rapport (267 appels), arbre vérifié par l'Orchestrator (vert) puis rapport obtenu ; palier d atteint, tests de cartes et jauge `vies` reportés à la passe 2 | Voir `02-dev-notes.md` |

| 2026-10-21 | Passe 2 découpée par l'Orchestrator en 2a (écran de jeu) et 2b (parcours, genre, Rejouer) : `dev` opus, 2 lancements, rapports rendus dans le plafond ; l'utilisateur avait dit oui à « la passe 2 » ; décision de la réponse Rejouer : variante sur la ligne quand elle est activée. Contrôles relancés par l'Orchestrator à chaque passe : 1846 → 1874 → 1912 tests verts, build OK | Voir `02-dev-notes.md` |

| 2026-10-21 | Phase Test : `test` opus, 1 lancement, GO avec réserves. Phase Sécurité : `sec` opus, 1 lancement, GO. Passage `dev` (3e type : correctifs de Test + C1 + mutations) : opus, 1 lancement, 134 appels, **rien refusé** ; 18 mutations sur 19 rouges, 1 mutant équivalent ; 1912 → 1929 tests | Voir `03`, `04` |

| 2026-10-21 | Phase Revue : `review` opus, 1 lancement, NO-GO conditionnel (11 points ouverts à signer, retouches de docs 2 à 5 faites). Index : `architecture-context` sonnet / medium, 1 lancement, 133 lignes, 13 289 octets (22e passe) | Voir `05` |
| 2026-10-21 | **Go de l'utilisateur** : « OK tu peux commit et fusionner dans main », donné après la Revue. L'Orchestrator **n'en déduit pas** l'acceptation des résiduels R1 à R4, de Q1, du constat #11 ni de la relecture téléphone : ils restent **non signés**, listés dans `05-revue.md` et dans `PROJECT_PLAN` ; la fusion se fait sur ce go | Règle : un risque n'est accepté que signé explicitement |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | Test → Dev (boucle 1, problèmes de test, aucun bug d'implémentation) | `test` → `dev` | Trous T1-T5, garde `hexagonalBoundary` à vide, garde `Rejouer`, critère 14, mutations, constat C1 de Sécurité | Fait (1912 → 1929 tests, 18 mutations sur 19 rouges, 1 mutant équivalent) |
| 2 | Revue (docs) | Orchestrator | Phrases périmées de `CLAUDE.md`, `PROJECT_PLAN`, index, `00` | Fait, sans relancer le code |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
