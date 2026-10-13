# Lot `charte-contraste` — orchestration

## Objectif

Que le plancher de lisibilité tienne dans les deux thèmes. Texte secondaire en **tokens pleins
par thème** (`craie-2`, `craie-3`, plus un token « décor » pour les seuls glyphes `aria-hidden`)
au lieu des 121 `text-craie/NN` de `src/ui` ; valeurs du thème clair fixées par la maquette
validée (`craie-2` = `#354137`, `craie-3` = `#485249`). Lignes des joueurs inactifs sans
`opacity` : nom en `craie-2`, reste en encre pleine et sans `trace-craie`. Onglet actif de la
barre du bas lisible en clair. Garde `themeBoundary` contre les alphas de texte. Charte, règle
`theme-colors.md` et commentaire de `index.css` mis à jour. Détail et critères 1 à 6 :
[request.md](./request.md).

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, § Ce qui freine 1 et 2,
lot 2 du § Découpage en lots.

**Hors périmètre :** alphas qui ne sont pas du texte (bordures, fonds, filets) ; éléments
désactivés ; cibles « mortes » du Cricket (lot 6) ; autres halos, typo, mouvement (lot 3) ;
accents de mode (lot 6).

## Niveau

`light` — aucune surface gravée : le thème clair reste une redéfinition de valeurs de tokens
(décision structurante respectée, non modifiée).

light

## Branche

`lot/charte-contraste` — créée depuis `main` (`1e882b9`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/charte-contraste.md` (validé le 2026-10-13), copié octet
pour octet vers `docs/lots/charte-contraste/request.md` le 2026-10-13 (empreintes identiques).
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
| Onglet actif de la barre du bas en `craie-vive` (blanc en sombre) plutôt qu'en laiton, l'identité laiton portée par le trait sous l'onglet ? | `01-architecture.md` Q1 | Utilisateur | Close : validé (« oui go ») |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-13 | `.ai/architecture-context.md` jugé à jour | Sources au même horodatage que l'index (`DEPLOIEMENT` plus ancien), aucune modifiée dans l'arbre |
| 2026-10-13 | Niveau `light` confirmé | Intake `light`, aucune surface gravée |
| 2026-10-13 | Architecture : `archi-scout` (sonnet / low, frontmatter), PASS en 1 tentative | Tokens `craie-2` / `craie-3` / `craie-decor`, garde `ALPHA_TEXTE` |
| 2026-10-13 | Gate Architecture : Q2 et Q3 closes par l'Orchestrator ; Q1 à l'utilisateur | Q2 : contrastes recalculés (min 4,88 sombre, 4,67 clair) ; Q3 : règle « — = information » tirée de `frontend-react.md` |
| 2026-10-13 | Arrêt Archi → Dev : Q1 validée et go de l'utilisateur (« oui go ») | Arrêt obligatoire |
| 2026-10-13 | Dev : `dev` (sonnet / medium, maxTurns 100, frontmatter), 1 passe | 805 verts revérifiés ; périmètre conforme |
| 2026-10-13 | Gate Dev : 3 questions de `02-dev-notes.md` adressées à Test (code) ; leur part visuelle ira à la relecture à l'écran | Questions de rendu |
| 2026-10-13 | Test passe 1 : `test` (sonnet / high), sans shell — GO ; O1 (garde) et O3 (docs périmées) renvoyés par l'Orchestrator | Corrections d'une ligne, dans l'esprit du critère 2 |
| 2026-10-13 | Boucle 1, tour 1 : `dev` (sonnet / medium) | O1 + O3 |
| 2026-10-13 | Test passe 2 : `test` (sonnet / high), sans shell — GO | P2-1 laissée au lot 3 (même règle réécrite), sans nouveau tour |
| 2026-10-13 | Index `.ai/architecture-context.md` non régénéré dans ce lot | La charte et `rules/` changent : le contrôle de fraîcheur du prochain `/orchestrate` le régénérera. Aucune décision de `CLAUDE.md` modifiée |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | O1 : garde élargi aux alphas de toute variante `craie-*` ; O3 : `.claude/agents/dev.md:51` et `.claude/skills/audit/SKILL.md:42` alignés sur la nouvelle règle | Corrigé : `ALPHA_TEXTE` = `/\btext-craie(?:-[a-z0-9]+)?\/(?:\d+|\[)/g`, 4 positifs ajoutés (contre-épreuve : `text-craie-2/60` dans `TableauJoueurs.tsx` → garde rouge) ; une ligne chacun dans `dev.md` et `audit/SKILL.md`. Revérifié : lint OK, 805 verts, encodage UTF-8 sain (0 `Ã`/`Â`/`�` en lecture UTF-8) |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
