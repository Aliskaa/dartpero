# Lot `courbe` — orchestration

## Objectif

Carte **Évolution** à l'écran Statistiques : la moyenne de chaque partie X01 dans le temps pour le joueur du sélecteur (3 mesures : Moyenne, First 9, Meilleure volée ; tendance sur 3 parties ; lecture au doigt et au clavier ; plafond de 30 parties ; état « peu de parties » ; pictogramme evolution). Série calculée à côté de `career.ts` (domaine), port driving + use case, câblage au container, carte UI, libellés dans `labels.ts`, charte documentée. Détail : `request.md`. Planche à suivre à l'identique : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\courbe\courbe.html` (+ https://claude.ai/artifact/2yDppJ3rzCZbAeLzMDBJZv). Pas d'audit d'origine.

**Hors périmètre :** piste B (courbes de tous les joueurs), mémorisation de la mesure, Cricket / Tour du monde / entraînement, toute statistique nouvelle (`GetPlayerStats`, `CareerStats` inchangés), résumé de fin, export de la courbe, fiche joueur.

## Niveau

<`high` (défaut) ou `light`. `light` interdit sur une surface gravée : domaine, couture
GameMode, format persisté (MatchEvent, Dexie, backupSchema), service worker / firebase.json,
règle gravée de CLAUDE.md.>

high — imposé : le lot touche src/core/domain/ (surface gravée).

## Branche

`lot/courbe` — créée depuis `main` avant l'Architecture, fusionnée en `--ff-only` après
accord.

## Provenance

Intake validé : source `docs/request/courbe.md` (validé 2026-10-21, niveau high, zéro question bloquante, toutes sections présentes) copié octet pour octet vers `docs/lots/courbe/request.md` le 2026-10-21 (hash identique). Index `.ai/architecture-context.md` à jour (commit plus récent que ses sources, arbre propre).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée (domaine) annoncée par la demande |
| 2 | `archi-designer` | Sauté | idem |
| 3 | `archi-authority` | PASS | 1re passe arrêtée à `maxTurns` 40 sans rapport ; reprise par message, rapport rendu |

Agent retenu : authority

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite | `test` | `03-plan-de-test.md` |
| Sécurité | Faite | `sec` | `04-revue-securite.md` |
| Revue | Faite | `review` | `05-revue.md` |
| Échanges | En cours | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| U1-U12, N1-N5, C1, C2 | `01-architecture.md` | Utilisateur | Close (Révisions 1 et 1 bis, 2026-10-21/22). Condition : U8 vs `typographieBoundary`, vérifiée par Dev |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-21 | Branche `lot/courbe` déjà créée et courante, arbre propre hors la demande d'intake | Reprise de l'état existant |
| 2026-10-21 | Chaîne démarrée à `archi-authority` (opus, effort max d'après le frontmatter) ; `dev`, `test`, `sec` passés en `model: opus` | Surface gravée : § Monter en gamme |
| 2026-10-21 | Révision 1 : plafond de 30 supprimé, courbe défilante (demande de l'utilisateur) ; `archi-authority` relancé par message (opus, effort max) | `request.md` inchangé, la Révision fait foi pour périmètre 6 et critère 4 |
| 2026-10-22 | Questions produit closes par l'utilisateur (AskUserQuestion) | Gate Architecture ; U8 : 10 px choisi contre le plancher de 12 px de la charte, à vérifier |

| 2026-10-22 | Dev en deux lancements `dev` (opus ; effort du frontmatter) : partie 1 domaine/application, partie 2 UI | Coupé pour rester sous `maxTurns` 100 ; 44 puis 95 appels d'outils, plafond non atteint |
| 2026-10-22 | Gate Dev : U8 (texte d'axe 10 px) tenu pour clos par la réponse de l'utilisateur, rappelé à Revue ; écart d'axe (bas ≥ 0) renvoyé à Revue | Choix explicite de l'utilisateur ; ajustement technique |
| 2026-10-22 | Test (`test`, opus) lancé sans shell exploitable : analyse statique, verdict non concluant, 1 bug (B1) | Boucle 1 vers Dev ; sorties réelles à obtenir après correction |
| 2026-10-22 | Test rejoué par un agent généraliste opus avec shell (mutations réelles, R1) ; commandes rejouées par l'Orchestrator | L'agent `test` n'a pas de shell dans cette session |
| 2026-10-22 | Sécurité (`sec`, opus, sans shell) : PASS ; preuves `git diff --stat` vide et `npm audit` 0 vulnérabilité ajoutées par l'Orchestrator | Gate : R1 et O1 résiduels, non signés, portés à Revue |
| 2026-10-22 | Revue (`review`, opus) : 1re passe arrêtée à `maxTurns` 40 sans rapport ; rapport rendu après relance par message. Verdict NO-GO levable : branche en retard sur `main` (lot Killer `2168c23`), acceptations R1 / R2 / O1 / remontée / interlettrage, gravure `CLAUDE.md` | Voir `05-revue.md` |

| 2026-10-22 | Accords de l'utilisateur : R1, R2, remontée de la carte, O1, rebase ; interlettrage « respecte la planche » (0,06 em) | NO-GO de la Revue levé, voir `05-revue.md` § Levée du NO-GO |
| 2026-10-22 | Rebase de `lot/courbe` sur `main` (`2168c23`) via un commit WIP temporaire, défait ensuite (`reset --soft`) ; commandes `git add` / `commit` / `rebase --continue` lancées par l'utilisateur (refusées à l'agent) | Un seul commit de lot à venir, sur accord |
| 2026-10-22 | Gravure `CLAUDE.md` (deux entrées) et correctifs de doc faits ; `/refresh-architecture` encore à lancer | Index `.ai/` à régénérer après le commit |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| — | — | — | — | — |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
