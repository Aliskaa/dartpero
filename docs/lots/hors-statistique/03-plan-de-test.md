# Lot `hors-statistique` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet, effort high, lecture
> seule : il n'avait pas d'outil d'exécution) et des commandes lancées par l'Orchestrator.

## Stratégie

| Niveau | Couvert | Détail |
|---|---|---|
| Domaine, use cases, infrastructure | Non touchés | `src/core` intact ; `missed` et `matchesPlayed` existaient déjà dans `PlayerCareer` |
| UI, helper | Oui | `tests/ui/horsCibleParPartie.test.ts` (nouveau) |
| UI, rendu | Oui | `statistiquesPodium.test.tsx` (colonne, ligne, singulier, période) ; `paveUnifie.test.tsx` (classe `touche-hors` sur le bouton Hors, pas sur la Bulle) |
| Architecture | Oui | `themeBoundary` : jeton dans les deux thèmes, `.touche-hors` pose `border-color` et jamais `background` ; `appuiBoundary` : aucun `text-*` sur la touche |

Hors périmètre : résumé de partie (`CarteImpacts`) ; rendu CSS réel (jsdom n'applique pas la
cascade `@layer`).

## Cas de test

- Helper : 41/16 → « 2,6 » ; 0/16 → « 0,0 » ; (0,0) et (7,0) → « 0,0 » ; 1/3, 2/3, 5/2 ; 9/1 →
  « 9,0 » ; trois morceaux ; « sur 1 partie » ; « sur 0 partie » documenté (cas non atteint) ;
  2500/1000 avec séparateur de milliers.
- Rendu : colonne « 0hors cible » à zéro (et non le mot « Hors ») ; ligne « 0,0 sur 1 partie » /
  « 9,0 sur 1 partie ».
- Période : « Tout » 4/3 → « 1,3 sur 3 parties » ; « Aujourd'hui » 1/2 → « 0,5 sur 2 parties »
  (numérateur et dénominateur filtrés ensemble ; échouerait sinon).
- Gardes : `rouge-touche` à `#ff8a8f` (sombre) et `#a81f25` (clair) ; bouton Hors porteur de
  `touche-hors` ; `.touche-hors` sans `background`.
- Contrastes recalculés par Test depuis `src/index.css` (fond réel du pavé = `feutre`) : sombre
  7,89:1, clair 5,19:1 (Dev : 7,90 / 5,18) ; clair sur `feutre-nuit` 4,17:1 (surface non utilisée).

## Résultats (commandes lancées par l'Orchestrator, après correction)

| Commande | Résultat |
|---|---|
| `npm run lint` | OK, 320 fichiers, aucun correctif |
| `npm run typecheck` | OK |
| `npx vitest run` | 85 fichiers, **1583 tests verts** (les « Not implemented: navigation » de jsdom préexistent) |
| `npm run build` | OK, PWA 51 entrées précachées |

## Bugs trouvés, classés

| # | Bug | Classement | Résultat |
|---|---|---|---|
| 1 | `CHARTE_GRAPHIQUE.md:673` disait « Hors » en `craie-3` ; ligne Statistiques sans la moyenne | Bug d'implémentation (doc) | Corrigé (boucle 1, tour 1) |
| 2 | Commentaire périmé `statistiquesPodium.test.tsx:95` | Problème de test | Corrigé |
| 3 | Garde `themeBoundary` trop souple (`toContain`, motif `[^}]*`) ; pas de test de rendu de `touche-hors` | Problème de test | Corrigé |
| 4 | Arrondi à mi-chemin (x,x5) non testé | Spec non tranchée | Ouvert, non bloquant (voir ci-dessous) |

## Angles morts (à voir à l'écran seulement)

1. Rouge réel de la touche et distinction avec la Bulle (fond rouge à 25 %).
2. **Bordure rouge sur le fond `craie` inversé à l'appui** : ~1,9:1 en sombre, ~2,0:1 en clair.
   Bordure de 1 px, éphémère (90 ms), sans texte dessus, mais sous 3:1.
3. Ligne de moyenne à 390 px et 360 px : trois morceaux en `justify-between`, sans `flex-wrap`,
   cas le plus long « HORS CIBLE PAR PARTIE · 12,5 · SUR 1 000 PARTIES » — risque non mesuré.
4. Lisibilité à distance dans un garage mal éclairé ; paysage.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Arrondi à mi-chemin (0,25 → « 0,3 » ?) : à figer par un test ? Le comportement dépend d'ICU, la demande ne le spécifie pas. Non bloquant | Utilisateur |
| 2 | Bordure rouge à l'appui sous 3:1 : acceptable ? À trancher à la relecture visuelle | Utilisateur |
| 3 | « 0 partie » à `parties = 0` : cas non atteint, documenté par un test | Dev (clos : gardé tel quel) |
