# Lot `phrases-victoire` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet, effort medium —
> frontmatter).

## Ce qui a été implémenté

- **`src/ui/labels.ts`** : 5 phrases ajoutées après les 4 existantes (9 au total) ; commentaire de
  `PHRASE_VICTOIRE` mis à jour (affichée au résumé **et** dite) ; `annonceFinDeVolee(resultat,
  prochain, phrase?)` : sans `phrase`, comportement identique ; avec, `[...annonce, fr('. ' +
  phrase)]` (ou `[fr(phrase)]` si l'annonce est vide) — point et espace dans le segment `fr`.
- **`useX01`** : phrase si `milestones` contient `MatchFinished` (jamais `LegWon` / `SetWon`).
- **`useCricket`** : phrase si `gagnee`, cut-throat compris.
- **`useTourDuMonde`** : phrase si `MatchFinished` a un `winnerId` non nul ; « Tour bouclé ! » gardé
  à la fléchette qui boucle ; le dernier du tour de table qui boucle et gagne dit « Tour bouclé ! »
  puis la phrase.
- **Graine** : `matchId` dans les trois hooks, la même que `identifiant` des résumés. Entraînement,
  domaine, application, infrastructure : non touchés.
- **Tests** : `tests/ui/annonces.test.ts` (+1 cas) ; nouveau `tests/ui/phrasesVictoire.test.tsx`
  (9 phrases distinctes et atteignables, tirage stable ; X01 match / manche / set / bust / avant
  *Valider* ; égalité voix-résumé X01 et Cricket ; Cricket victoire et cut-throat ; Tour du monde
  bouclage seul, fin de partie, dernier qui boucle et gagne, nul ; entraînement).
- **Docs** : `.claude/CONVENTIONS.md` § 5 (puce « Annonces vocales ») ; `CLAUDE.md` (puce « Phrase de
  victoire à la voix », après la puce Annulation). `PROJECT_PLAN.md` et `.ai/` : à la charge de
  l'Orchestrator en fin de lot.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Tests regroupés dans `phrasesVictoire.test.tsx` au lieu d'être ventilés dans `x01.test.tsx`, `cricket.test.tsx`, etc. | Ajustement | Plus lisible ; même couverture |
| Égalité voix-résumé testée au X01 et au Cricket seulement (pas au Tour du monde) | Ajustement | Même graine `matchId` dans les trois ; à regarder au Test |

Aucune refonte nécessaire.

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | Vert (d'après le rapport Dev) |
| `npm run typecheck` | Vert (d'après le rapport Dev) |
| `npm test` (`npx vitest run`) | Vert : 85 fichiers, 1585 tests (d'après le rapport Dev) |
| `npm run build` | Non lancé par Dev |

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Questions 1 à 3 de `01-architecture.md` : closes (ordre TdM testé ; `MatchFinished` dans `X01Milestone`, émis une fois à `rules.ts:142` ; suite existante verte) | — |
| 2 | La voix reçoit « Partie gagnée !. Phrase » / « Tour bouclé !. … » (le « . » joint suit le « ! ») : cosmétique à l'écrit, jamais entendu | Utilisateur (écoute sur appareil, avec le « — » et le « ? » de « Bien joué — on remet ça ? ») |
| 3 | Build à lancer | Test |

## Limites connues et TODO assumés

- Ponctuation « !. » dans le texte envoyé à la synthèse : à écouter ; correctif simple si gênant
  (ne pas ajouter de « . » après un « ! » ou un « ? »).
- Cricket « partie gagnée » avec un `prochain` non nul n'existe pas ; l'ordre résultat, tour,
  phrase reste géré par `annonceFinDeVolee`.
