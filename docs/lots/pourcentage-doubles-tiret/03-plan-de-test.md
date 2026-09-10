# Lot `pourcentage-doubles-tiret` — plan de test

> Écrit par l'Orchestrator à partir du compte-rendu du sous-agent `test`, revérifié directement
> (`git diff`, `npm test`).

## Stratégie

Lot purement UI (aucune ligne de `core/` modifiée par Dev) : le niveau pertinent est le test
d'écran, par rôle accessible, sur les deux écrans concernés. Pas de test domaine/use-case
supplémentaire — `checkoutPercent`/`doubleAttempts` sont déjà couverts ailleurs et leur calcul
n'a pas changé, seule leur mise en texte a changé.

## Cas couverts

Tous dans `describe` dédiés, par rôle accessible (`getByRole`), via `renderWithServices`.

| # | Cas | Fichier | Résultat attendu |
|---|---|---|---|
| 1 | Résumé X01, `doubleOut: false` (fixture `partieJouee()` existante) : tiret pour les **deux** joueurs, y compris le vainqueur qui a gagné sur un double | `tests/ui/resumeX01.test.tsx` | `—` / `—` |
| 2 | Résumé X01, `doubleOut` actif, un joueur avec tentative(s) et une réussite, l'autre sans tentative | `tests/ui/resumeX01.test.tsx` (nouveau `describe`) | `33 %` / `—` |
| 3 | **Cas discriminant** : tentative(s) sans aucune réussite → `0 %`, jamais un tiret | `tests/ui/resumeX01.test.tsx` | `0 %` (et `not.toHaveTextContent('—')`) / `—` pour l'adversaire sans tentative |
| 4 | Écran Statistiques (carrière), même trio tiret / pourcentage / zéro réel, 3 joueurs | `tests/ui/lot4.test.tsx` | `33 %` / `0 %` / `—` |
| 5 | Non-régression : les deux tests historiques `matchWinPercent`/`legWinPercent` de `lot4.test.tsx` | `tests/ui/lot4.test.tsx` (préexistants) | Verts, **aucune assertion modifiée** |

**Fixtures vérifiées par calcul direct** (reste 40, double-eligible dès le départ) :
- `[miss, miss, double(20)]` : `isOnACheckoutDouble(40)` vrai aux 3 fléchettes (reste ne bouge
  qu'à la 3ᵉ) → 3 tentatives, 1 réussite (checkout) → **33 %**.
- `[miss, miss, miss]` : reste inchangé (pas de bust), 3 tentatives, 0 réussite → **0 %**.

Le cas n°3 est celui qui donne son sens au lot : sans lui, rien ne prouve que `pourcent()` n'a
pas simplement remplacé tous les zéros par des tirets sans distinguer « jamais tenté » de
« tenté et raté ».

## Pièges de sélecteur identifiés et vérifiés

- **Feuille de match X01** (`ResumeX01Ecran.tsx`) : structure transposée — l'intitulé de ligne
  est un `rowheader`, les valeurs des `cell`. Ciblage : `getByRole('row', { name: /% doubles/ })`
  puis `getAllByRole('cell')`.
- **Tableau Statistiques** (`StatistiquesEcran.tsx`) : un joueur sans tentative peut produire
  plusieurs tirets sur la même ligne (« % doubles », « Plus haut checkout », « Meilleur leg »),
  donc un `getByText('—')` générique lèverait une erreur « multiple elements ». Ciblage par
  ligne trouvée par nom puis `getAllByRole('cell')[1]` (première colonne chiffrée du tableau
  « Finitions »).

## Mutation — preuve que le cas décisif n'est pas vert à vide

`test` a remplacé temporairement, dans `ResumeX01Ecran.tsx`, l'appel à `pourcent(...)` par le
code brut d'avant le lot (`` `${Math.round(j.checkoutPercent)} %` ``), puis relancé
`tests/ui/resumeX01.test.tsx` :

```
× écrit un tiret pour « % doubles »… même pour le vainqueur du leg
× affiche un pourcentage arrondi pour un joueur qui a tenté, un tiret pour celui qui n'a rien tenté
× affiche « 0 % », jamais un tiret, pour un joueur qui a tenté un double et raté toutes ses tentatives
Tests  3 failed | 9 passed (12)
```

Les trois tests neufs échouent correctement (tiret attendu, `0 %`/`33 %` brut reçu). Fichier
restauré ensuite — vérifié par l'Orchestrator (`git diff` : le code source ne contient que les
modifications de Dev décrites dans `02-dev-notes.md`, rien de plus).

## Résultats (revérifiés directement par l'Orchestrator)

| Commande | Résultat |
|---|---|
| `npm run lint` | Vert — 198 fichiers, aucun correctif appliqué |
| `npm run typecheck` | Vert |
| `npm test` | Vert — **334/334 tests**, 32 fichiers (330 avant ce lot + 4 nouveaux) |

Fichiers modifiés par `test` : `tests/ui/resumeX01.test.tsx` (+3 tests), `tests/ui/lot4.test.tsx`
(+1 test). Aucun fichier sous `src/` touché — confirmé par `git diff --stat`.

## Défauts trouvés

Aucun. Le comportement correspond exactement à l'architecture sur les trois cas de bord
(tiret / pourcentage / zéro réel), y compris le cas le plus piégeux (vainqueur en
`doubleOut: false`).

## Questions ouvertes

Aucune.
