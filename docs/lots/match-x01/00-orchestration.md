# Lot `match-x01` — orchestration

## Objectif

Écran de match X01 selon les maquettes validées : zone de lecture collée en haut et paysage
réparé (quatre jeux, via `DispositionPartie`), `MomentCelebratif` superposé au bas du tableau,
fin du clignotement du pavé pendant `occupe`, bâtons restants en tirets ; au X01 seulement :
reste agrandi d'environ 25 % en portrait, multiplicateur armé gradué (Double : filet ; Triple :
filet + fond ; numéros et 25 seulement), repère laiton qui glisse, fondu du filet, bandeau de la
planche (pictogramme 24 px, titre, sous-titre, manche à droite). Charte § Écran de match et
§ Mouvement. Détail et critères 1 à 10 : [request.md](./request.md).

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 5 du § Découpage en
lots.

**Hors périmètre :** feuille, pavé et bandeau de Cricket et du Tour du monde (lot 6) ; règles au
bandeau (lot 11) ; volée perdue au rechargement (lot 13) ; suggestion à un reste de 1 en sortie
libre ; règles de jeu, formats persistés, `CLAUDE.md`.

## Niveau

`light` — aucune surface gravée (UI seule, aucune règle ni format persisté).

light

## Branche

`lot/match-x01` — créée depuis `main` (`2d35d28`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/match-x01.md` (validé le 2026-10-14), copié octet pour octet
vers `docs/lots/match-x01/request.md` le 2026-10-14 (empreintes SHA-256 identiques). Validation :
en-tête, statut `Validé`, date, niveau `light` = niveau demandé, commande exacte, toutes les
sections, zéro question bloquante — conforme.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | — |
| 2 | `archi-designer` | non lancé | scout en PASS |
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
| 2026-10-14 | Index `.ai/architecture-context.md` périmé, régénéré (agent `architecture-context`, sonnet / high, frontmatter) | Charte commitée (`2d35d28`) après le dernier commit de l'index. Résultat : 149 lignes, 13 265 octets ; constats reportés 12, nouveau #19, retiré #18 |
| 2026-10-14 | Niveau `light` confirmé | Intake `light`, aucune surface gravée |
| 2026-10-14 | Architecture : `archi-scout` (sonnet / low, frontmatter), PASS en 1 tentative | Moment en `absolute` dans une enveloppe `relative` ; `desactive` retiré des pavés ; tokens de reste portrait ; `data-multiplicateur` + `touche-armee` ; repère unique translaté ; bandeau en trois zones |
| 2026-10-14 | Arrêt Archi → Dev : relecture contre les maquettes A et la planche ; l'utilisateur fait ajouter les §§ 10 à 12 à `01-architecture.md` (reste inactif en craie, bandeau sur une ligne en paysage, « Manche » en craie), puis donne le go | Points montrés par la maquette, absents de la demande |
| 2026-10-14 | Gate Architecture : 5 questions closes dans `01-architecture.md` | Q1 : plus grande taille qui tient dans 108 px, colonne non élargie ; Q2 : token `--teinte-triple`, contraste calculé ; Q3 : relecture ; Q4 : grille `1fr` ou repli `offsetTop` ; Q5 : vérifications Dev |

| 2026-10-14 | Dev : `dev` (sonnet / medium, maxTurns 100, frontmatter), une passe | 8 ajustements, aucune refonte ; reste portrait 4,5 rem (5,1 rogne : 120 px dans 108) |
| 2026-10-14 | Gate Dev : contrôles relancés (lint, typecheck, 891 tests, build, encodage) ; D1 close par procédure Q1 (relecture), D2 renvoyée au lot 6 | Tout vert |
| 2026-10-14 | Test : `test` (sonnet / high, frontmatter), tentative 1 : FAIL léger (T1 test vert à vide ; M1-M3 ; O1 ; R1) | Boucle 1 → Dev (sonnet / medium) |
| 2026-10-14 | R1 tranché par l'utilisateur : élargir RESTE en réduisant JOUEUR | Révision 1, boucle 4 ; `archi-scout` (sonnet / low) PASS ; `dev` (sonnet / medium) |
| 2026-10-14 | Test : `test` (sonnet / high), tentative 2 : PASS avec N1, N2, N4, N5 | Boucle 1 (tour 3) → `dev` (sonnet / medium) |
| 2026-10-14 | Test : `test` (sonnet / high), tentative 3 : PASS | Constat préexistant P1 (inversion à l'appui inopérante, `text-craie-vive` bat `.touche:active`) et N6 remis à l'utilisateur, hors périmètre |
| 2026-10-14 | Gate Test : toutes les questions résolues par écrit ; 3 tours de boucle sur 5 | Phase Test Faite |
| 2026-10-14 | Arrêt de fin de lot : go de l'utilisateur (« ok commit et fusionne ») ; relecture à l'écran non notée (captures du Dev fournies) ; P1 et N6 non retenus dans ce lot | Commit sur `lot/match-x01`, puis fusion `--ff-only` |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | T1 (test du pictogramme vert à vide), M1, M2, M3 (tests manquants), O1 (transition du filet armé, tranché par l'Orchestrator), R1 (mesure des restes à chiffres larges) | Fait : 896 tests, contrôles relancés verts ; R1 : 600 / 666 / 688 / 606 rognés à 4,5 rem |
| 2 | 4 | Dev → Archi | Utilisateur : « 206 touche les bords, pas joli » ; réduire JOUEUR pour élargir RESTE → Révision 1 de `01-architecture.md` | Scout PASS ; Dev fait (RESTE 8.25rem portrait, 897 tests, contrôles relancés verts) ; Test tentative 2 PASS |
| 3 | 1 | Test → Dev | Test tentative 2 PASS avec N1, N2 (commentaires faux), N4 (retour de couleur à la relâche, tranché par l'Orchestrator), N5 (test de `gap-1`) | Fait : 898 tests, contrôles relancés verts ; Test tentative 3 PASS |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
