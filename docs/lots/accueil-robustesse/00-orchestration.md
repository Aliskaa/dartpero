# Lot `accueil-robustesse` — orchestration

## Objectif

Corriger les défauts de robustesse et d'accessibilité de l'Accueil livré au lot
`accueil-parties-recentes` (`cc3a211`), relevés par une critique `/impeccable critique`
du 2026-10-13 (rapport en conversation, non archivé dans le dépôt). Défauts, pas choix de
design : la mise en page de l'Accueil ne bouge pas.

1. **Erreur de lecture** — `AccueilEcran.tsx:150` ne teste que `isPending` : si
   `getOngoingMatch`, `getMatchHistory` ou la lecture des joueurs échoue, l'écran affiche
   « Pas de partie cette semaine » et fait croire à une perte de données. Ajouter une branche
   d'erreur qui rend `MessageErreur` (`role="alert"`, `Etats.tsx`), libellé dans `labels.ts`.
2. **État vide** — distinguer « jamais joué » (aucune partie dans l'historique) de « semaine
   calme » (des parties existent, mais aucune cette semaine ni en cours). Libellés dans
   `labels.ts`.
3. **Fin de liste** — un lien « Toutes les parties » vers l'écran Parties (historique) quand
   des parties existent hors de ce que l'Accueil montre (plus anciennes que la semaine, ou au-delà
   de `PLAFOND_CARTES`), et dans l'état « semaine calme ». Sur le modèle du lien « Créer un
   joueur » (`min-h-12`, `font-score`, `text-laiton`).
4. **Accessibilité / libellés** — chargement annoncé (`aria-busy` ou statut équivalent) ; la
   flèche « → » du lien « Créer un joueur » hors du nom accessible ; « Début », « Navigation
   principale » (`NavigationBasse.tsx:12,29`) et « Compteur de fléchettes » (`Logo.tsx:34`)
   ramenés dans `labels.ts` (règle `frontend-react.md` : tout le français affiché y vit).

**Hors périmètre :** titres de carte (`nomDePartie`), tailles de texte des cartes, double
bouton laiton, mots « Abandonnée » et « N manches jouées », refonte « fiche de ligue » — réservés
à un futur lot passé par `/intake` (la réouverture d'« Abandonnée » touche une décision gravée).
Aucun changement de domaine, de port, de format persisté.

## Niveau

`light` — le lot ne touche que `src/ui/` (écran, composants communs, libellés) et ses tests :
ni domaine, ni couture GameMode, ni format persisté, ni service worker, ni décision gravée.

light

## Branche

`lot/accueil-robustesse` — créée depuis `main` (`cc3a211`) avant l'Architecture, fusionnée en
`--ff-only` après accord.

## Provenance

Orchestration directe, pas d'intake validé. Périmètre issu de la critique impeccable du
2026-10-13 et validé par l'utilisateur en conversation (« Lance le point 1 »).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | Rapport complet (sections du contrat présentes) |
| 2 | `archi-designer` | Non lancé | Scout en PASS |
| 3 | `archi-authority` | Non lancé | Scout en PASS, aucune surface gravée |

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
| Bouton « Réessayer » sur l'erreur ? | `01-architecture.md` Q1 | Utilisateur | Close : non (2026-10-13) |
| Lien « Toutes les parties » à exactement 30 parties toutes visibles : accepté ? | `01-architecture.md` Q2 | Utilisateur | Close : accepté (2026-10-13) |
| Relecture à l'écran (erreur, états vides, portrait / paysage, sombre / clair) | `01-architecture.md` Q3 | Utilisateur | Reportée à l'arrêt de fin de lot (ne bloque pas Dev) |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-13 | Niveau `light` accepté | Lot purement UI, aucune surface gravée touchée. |
| 2026-10-13 | `.ai/architecture-context.md` jugé à jour | Dernier commit de l'index = dernier commit de ses sources (`cc3a211`), aucune source modifiée dans l'arbre. |
| 2026-10-13 | Fichiers non suivis `.claude/skills/emil-design-eng/`, `.claude/skills/impeccable/`, `skills-lock.json` laissés hors lot | Skills tiers installés hors de tout lot ; ne pas les indexer avec ce lot. |
| 2026-10-13 | Architecture : `archi-scout` (sonnet / low, frontmatter) → PASS, retenu | Designer et authority non nécessaires. |
| 2026-10-13 | Pas de bouton « Réessayer » ; lien à 30 parties accepté ; go Dev | Réponses de l'utilisateur à l'arrêt Archi → Dev. |
| 2026-10-13 | Dev : agent `dev` (sonnet / medium, maxTurns 100, frontmatter) | Lot UI sans surface gravée : pas de montée en opus. |
| 2026-10-13 | Gate Dev → Test : questions de `02-dev-notes.md` (contre-épreuves, combinaisons d'erreur, `<output>`) adressées à Test, qui les clôt ; Q3 Archi reste reportée en fin de lot | Questions pour la phase suivante, pas bloquantes pour la démarrer. |
| 2026-10-13 | Test : agent `test` (sonnet / high, frontmatter) | — |
| 2026-10-13 | Test passe 1 : renvoi Dev (boucle 1, tour 1) pour T1-T3 ; T3 inclus malgré sa priorité basse | Même fichier, même remède que T2 (cache pré-rempli). Le sous-agent n'avait pas de shell : l'Orchestrator relancera lint / typecheck / tests en passe 2. |
| 2026-10-13 | Boucle 1 : agent `dev` (sonnet / medium) sur les tests seuls ; Orchestrator relance lint / typecheck / vitest (778 verts) ; Test passe 2 (`test`, sonnet / high) → GO | Gate : seule question restante = relecture à l'écran, reportée à l'arrêt de fin de lot. 1 tour de boucle sur 5. |
| 2026-10-13 | Rien à graver dans `CLAUDE.md` ; pas de `/refresh-architecture` | Le lot corrige des défauts sans décision durable. |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | T1 (partie en cours seule hors fenêtre non testée), T2 (clauses d'erreur non isolées), T3 (`joueurs.isPending` non testé seul) — tests seulement, code jugé correct | Corrigé : 4 tests ajoutés / 1 remplacé, `src/` inchangé ; Test passe 2 GO, 778 verts |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
