# Lot `feuille-commune` — orchestration

## Objectif

Cricket et Tour du monde posés sur la feuille du X01 (lot 5) : feuille cerclée, en-têtes inversés,
un filet par ligne, colonnes réelles, repère unique qui glisse, carré de couleur de 12 px, bandeau
en trois zones avec pictogramme (entraînement compris). Cricket : volée sur une dernière ligne
« VOLÉE · NOM », rappel de variante sans cadre. Tour du monde : JOUEUR · PARCOURS · CIBLE géante à
droite, « Dernier tour » d'après `lastRound`, tient à 4 joueurs en portrait. `MomentCelebratif` sur
une rangée de 44 px, X01 compris. Charte § Écran de match. Détail et critères 1 à 10 :
[request.md](./request.md) ; planche : <https://claude.ai/artifact/2vma9boCLRDEjzdJMNu4fZ>.

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 6 du § Découpage en
lots (6a).

**Hors périmètre :** pavés de saisie, contraste à l'appui (P1), accents des jeux (lot 6b
`pave-unifie`) ; N6 ; règles au bandeau (lot 11) ; volée perdue (lot 13) ; règles de jeu, formats
persistés, `CLAUDE.md`.

## Niveau

`light` — aucune surface gravée (UI seule, l'état est lu tel que le domaine le fournit).

light

## Branche

`lot/feuille-commune` — créée depuis `main` (`bcb4369`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/feuille-commune.md` (validé le 2026-10-14), copié octet pour
octet vers `docs/lots/feuille-commune/request.md` le 2026-10-14 (empreintes SHA-256 identiques).
Validation : en-tête, statut `Validé`, date, niveau `light` = niveau demandé, commande exacte,
toutes les sections, zéro question bloquante — conforme.

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
| 2026-10-14 | Index `.ai/architecture-context.md` à jour, non régénéré | Aucune source plus récente que son dernier commit, aucune modifiée dans l'arbre |
| 2026-10-14 | Niveau `light` confirmé | Intake `light`, aucune surface gravée |
| 2026-10-14 | La modification de l'étude (`docs/prospective/…revision-charte-graphique.md`, choix du lot 6) voyage avec la branche | Faite pendant l'intake de ce lot |
| 2026-10-14 | Architecture : `archi-scout` (sonnet / low, frontmatter), PASS en 1 tentative | Quatre briques communes (`BandeauMatch`, `FeuilleMatch`, `NomJoueurFeuille`, `CasesVolee`) ; Cricket hors de `<table>` ; ligne VOLÉE en pied de feuille ; moment `h-11` |
| 2026-10-14 | Gate Architecture : Q2 close ; Q1, Q3, Q4 closes par procédure de mesure écrite ; Q5 (« Pts ↓ ») et Q6 remises à l'utilisateur à l'arrêt Archi → Dev | En attente du go |
| 2026-10-14 | Arrêt Archi → Dev : l'utilisateur garde « Pts ↓ » (Q5 close), fait relire le plan contre la planche et ajouter §§ 10-19 « Conformité à la planche » à `01-architecture.md`, puis donne le go | Détails dessinés par la planche, absents du plan (hauteurs, filets, marques 28 px, typo, parcours, ruban VOLÉE, badge) |
| 2026-10-14 | Gate Architecture : toutes les questions closes ou à procédure écrite (Q1, Q3, Q4 par mesure ; Q6 conforme à la demande) | Phase Architecture Faite |
| 2026-10-14 | Dev : `dev` (sonnet / medium, maxTurns 100, frontmatter) arrêté à sa limite de 100 tours sans rapport ; code largement écrit (4 composants communs, écrans, tests). Repris par message (même agent, contexte conservé) pour finir, contrôler, mesurer et rapporter | Pas relancé à l'identique ; le plafond n'est pas relevé tant que la reprise suffit |
| 2026-10-14 | Dev terminé après reprise (rapport rendu) ; contrôles relancés par l'Orchestrator : lint, typecheck, 933 tests, build, encodage verts | — |
| 2026-10-14 | Gate Dev : D1, D2 renvoyées à la relecture utilisateur (procédure) ; D3 = N6 hors périmètre ; D4 préexistant hors périmètre ; D5 : index à régénérer avant commit | Phase Dev Faite |
| 2026-10-14 | Test : `test` (sonnet / high, frontmatter), tentative 1 : PASS avec constat 1 (bug mineur) et 2-4 (tests manquants) | Boucle 1 (tour 1) → nouveau `dev` (sonnet / medium) : le premier a consommé ses tours |
| 2026-10-14 | Test : `test` (sonnet / high), tentative 2 : PASS, constats 1-4 clos, N1-N6 sans suite / documentation | — |
| 2026-10-14 | Gate Test : TQ4 close ; TQ1-TQ3 (D1, D2, marques en paysage) remises à l'utilisateur à l'arrêt de fin de lot ; 1 tour de boucle sur 5 | Phase Test Faite |
| 2026-10-14 | Index `.ai/architecture-context.md` régénéré (agent `architecture-context`, sonnet / high, frontmatter ; brief lu sur disque) : 150 lignes, 13 295 octets, 14 constats (1 nouveau, #20), aucun retiré | Charte modifiée par le lot ; l'ancien index ne citait pas `.au-lancer` (D5 corrigée) |
| 2026-10-14 | Arrêt de fin de lot : l'utilisateur accepte TQ1 (moment du Tour du monde en paysage à 4 j.), TQ2 (noms à 15 px), TQ3 (marques 28 / 26 px) ; le « S » des cases de volée du Tour du monde (« S2 » au lieu de « 2 ») est reporté au lot 6b ; go « Commit et fusionne » ; relecture à l'écran sur téléphone non notée (captures du Dev et de l'Orchestrator) | Commit sur `lot/feuille-commune`, puis fusion `--ff-only` |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | Constat 1 (libellés de volée en dur), constats 2-4 (tests : cible morte, bords de la volée Cricket, `gridTemplateRows`, pictogramme du bandeau, couleur du carré) | Fait : 946 tests (+13), contrôles relancés verts ; incident d'encodage de `CricketEcran.tsx` pendant une mutation (script PowerShell en ANSI), réparé par le Dev, vérifié par l'Orchestrator (accents intacts, sans BOM, LF) |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
