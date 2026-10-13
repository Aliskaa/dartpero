# Lot `charte-typo-mouvement` — orchestration

## Objectif

Finir la direction A telle que la montre la maquette validée « A · Affiner » : échelle
typographique en tokens (minimum 0,75 rem, plus aucun `text-[…rem]` en dur, interlettrage
resserré dans les colonnes étroites) ; tokens de mouvement et animations ramenées au tableau
validé (`pop-score` court sans rebond, `secousse` plus sèche, `eclat` remplacé par un filet vert,
logo un seul tour, badge fixe) ; plus aucun halo, nulle part ; plus aucun dégradé de décor (tapis
uni, enseigne en laiton plein), seule exception `chargement-balai` ; souffle `trace-craie` gardé
sous le reste du lanceur. Charte, `theme-colors.md` et journal du lot à jour. Détail et critères
1 à 6 : [request.md](./request.md).

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 3 du § Découpage en
lots.

**Hors périmètre :** repère qui glisse et fondu du multiplicateur, taille des scores (lot 5) ;
pictogrammes (lot 4) ; `chargement-balai` gardé ; `CLAUDE.md` inchangé.

## Niveau

`light` — aucune surface gravée modifiée : le lot met le code en accord avec « zéro dégradé de
décor » (`CLAUDE.md` § Charte) sans changer la règle.

light

## Branche

`lot/charte-typo-mouvement` — créée depuis `main` (`dd935d1`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/charte-typo-mouvement.md` (validé le 2026-10-13), copié
octet pour octet vers `docs/lots/charte-typo-mouvement/request.md` le 2026-10-13 (empreintes
identiques). Validation : en-tête, statut `Validé`, date, niveau `light` = niveau demandé,
commande exacte, toutes les sections, zéro question bloquante — conforme.

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | Limites de lecture déclarées ; écarts à la maquette tranchés au gate |
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
| 2026-10-13 | `.ai/architecture-context.md` **périmé** → brief `architecture-context` appliqué (agent lancé directement, brief relu sur disque, sonnet / high frontmatter) | Charte et `rules/` commitées après l'index (`dd935d1`) |
| 2026-10-13 | Index régénéré : 151 lignes, 13 279 octets (plafond respecté) ; 13 constats (3 Moyenne, 10 Basse), dont 3 nouveaux (#16 `usePauseAnnulation` absent de CONVENTIONS § 14 ; #17 PLAN § 0 / § 6 sans les lots 1 et 2 ; #18 `theme-colors.md:16`, dans le périmètre de ce lot) | Brief `architecture-context` |
| 2026-10-13 | Niveau `light` confirmé | Intake `light`, aucune surface gravée modifiée |
| 2026-10-13 | Architecture : `archi-scout` (sonnet / low, frontmatter), PASS en 1 tentative | Tokens `text-etiquette` / `text-score-*`, tokens de mouvement, filet vert en `clip-path`, gardes (a)(b)(c) |
| 2026-10-13 | Gate Architecture : 5 questions closes par l'Orchestrator | Q1 et Q3 tranchées par fidélité à `A-affiner.css` (seuls les `shadow-[0_0_…]` partent) ; Q2 vérifiée dans `Avatar.tsx` |
| 2026-10-13 | Arrêt Archi → Dev : go de l'utilisateur (« oui go ») | Arrêt obligatoire |
| 2026-10-13 | Dev : `dev` (sonnet / medium, maxTurns 100, frontmatter), 1 passe | 814 verts et build OK revérifiés ; 2 alertes d'encodage = faux positifs de la console |
| 2026-10-13 | Gate Dev : 2 questions de `02-dev-notes.md` adressées à Test | Rendu des en-têtes ; forme de la charte |
| 2026-10-13 | Test passe 1 : `test` (sonnet / high), sans shell — GO sous réserve ; E1 et E2 tranchés par l'utilisateur (filet vert partout ; souffle gardé sur `Cartouche`) | Écarts à la lettre de la demande |
| 2026-10-13 | Boucle 1, tour 1 : `dev` (sonnet / medium) | B1, E1, E2, G2, D1, D2, C1, tokens dans la charte |
| 2026-10-13 | Test passe 2 : `test` (sonnet / high), sans shell — GO | P2-1 close par un encart de révision dans `02-dev-notes.md` |
| 2026-10-13 | `CLAUDE.md` inchangé ; index régénéré en début de lot | La règle gravée est appliquée, pas modifiée ; la charte et `rules/` changent : le prochain `/orchestrate` régénérera l'index |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | B1 (charte `--tapis-image`), E1 (filet du résumé en vert, choix utilisateur), E2 (souffle rendu à `Cartouche`, choix utilisateur), G2 (garde dégradés : Tailwind v4), charte en tokens `text-score-*`, D1, D2, commentaires périmés | Corrigé : filet `border-vert-cible` (`TableauHonneur.tsx:56`), `trace-craie` sur `Cartouche.tsx:48`, charte et journal alignés, `DEGRADE = /gradient|\bbg-(?:linear|radial|conic)\b/g` (contre-épreuve `bg-linear-to-b` → rouge). Revérifié : lint OK, typecheck OK, 815 verts, build OK, encodage UTF-8 sain |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
