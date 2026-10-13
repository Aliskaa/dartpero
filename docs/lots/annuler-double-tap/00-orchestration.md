# Lot `annuler-double-tap` — orchestration

## Objectif

Un double appui réflexe sur « Annuler » ne doit jamais défaire la volée d'un autre joueur ni une
manche gagnée, alors qu'on voulait seulement retirer une fléchette. Dans les quatre hooks de mode
(`useX01`, `useCricket`, `useTourDuMonde`, `useCheckoutPractice`) : pause de 1 s après un appui
qui retire la **dernière** fléchette de la volée en cours, pendant laquelle aucune volée
enregistrée ne s'annule ; et garde dans le hook contre une annulation pendant une écriture
(`occupe`). Détail et critères : [request.md](./request.md).

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, § Constats hors charte
et lot 1 du § Découpage en lots.

**Hors périmètre :** confirmation avant d'annuler une volée enregistrée ; remise en saisie des
fléchettes d'une volée annulée ; domaine et journal (`undoLastVisit` inchangé).

## Niveau

`light` — seuls des hooks de l'UI changent ; aucune surface gravée (domaine, couture GameMode,
format persisté, service worker, décision gravée).

light

## Branche

`lot/annuler-double-tap` — créée depuis `main` (`7fc27ea`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/annuler-double-tap.md` (validé le 2026-10-13), copié octet
pour octet vers `docs/lots/annuler-double-tap/request.md` le 2026-10-13 (empreintes identiques).
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
| 2026-10-13 | `.ai/architecture-context.md` jugé à jour | Dernier commit des sources (`CLAUDE.md`, `CONVENTIONS`, `rules/`, charte) au même horodatage que l'index ; `DEPLOIEMENT` plus ancien ; aucune source modifiée dans l'arbre |
| 2026-10-13 | Niveau `light` confirmé | Intake `light`, aucune surface gravée touchée |
| 2026-10-13 | Architecture : `archi-scout` (sonnet / low, frontmatter), PASS en 1 tentative | Hook commun `usePauseAnnulation`, garde par `services.clock`, minuteur pour l'affichage seulement |
| 2026-10-13 | Gate Architecture : 4 questions closes dans `01-architecture.md` | Q3 vérifiée par grep ; Q1, Q2, Q4 confiées à Dev avec obligation de noter tout écart |
| 2026-10-13 | Arrêt Archi → Dev : go de l'utilisateur (« oui ») | Arrêt obligatoire |
| 2026-10-13 | Dev : `dev` (sonnet / medium, maxTurns 100, frontmatter), 1 passe | 803 tests verts revérifiés par l'Orchestrator ; diff limité aux 4 hooks + 2 fichiers créés |
| 2026-10-13 | Gate Dev : les 2 questions de `02-dev-notes.md` sont adressées à Test, qui doit les clore | Questions de forme des tests, sans effet sur le code |
| 2026-10-13 | Test passe 1 : `test` (sonnet / high, frontmatter), sans shell — GO avec T1 renvoyé ; les 2 questions de Dev closes (fichier unique, temps réel gardés) | T1 = règle `testing.md` ; renvoi décidé par l'Orchestrator dans ce lot (correction mécanique) |
| 2026-10-13 | Boucle 1, tour 1 : `dev` (sonnet / medium) | T1 + O1, fichier de test seul |
| 2026-10-13 | Test passe 2 : `test` (sonnet / high), sans shell — GO | T1 et O1 corrigés ; reste la relecture à l'écran, pour l'utilisateur à l'arrêt de fin de lot |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | T1 : liste de modes recopiée au lieu de `GAME_MODE_IDS` (`rules/testing.md`) ; O1 joint (assertion X01 « manche gagnée » renforcée) | Corrigé : `Record<GameModeId, Mode>` + `describe.each(GAME_MODE_IDS)` (contre-épreuve : clé retirée → TS2353 au typecheck) ; X01 vérifie `legsWonInSet` et `legNumber` via `getMatchState`. Seul le fichier de test modifié. Revérifié : lint OK, typecheck OK, 803 verts |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
