# Lot `pave-unifie` — plan de test

## Tentative 2 (après boucle 1) — PASS

> Rapport du sous-agent `test` (sonnet / high), lecture seule.

- **N5 clos** : rang du premier en `text-laiton-clair` (`ResumeCricketEcran.tsx:90`,
  `ResumeTourDuMondeEcran.tsx:96`), `#614a08` ≥ 4,84:1 en clair. `text-laiton` gardé à bon
  droit sur le nom du vainqueur X01 (24 px gras), « Partie en cours » (30 px) et les marques SVG
  du Cricket (graphisme, et la forme distingue la marque fermée).
- **N3 clos** : exposant « ×2 » de la Bulle au Cricket (absent en Simple et Triple) et ordre
  grille → rangée dans les trois jeux ; tests non tautologiques (cassent sans la branche
  `facteur > 1`, sans la garde `choisi !== 'TRIPLE'`, ou si un élément s'intercale).
- Aucune régression. Contrôles relancés par l'Orchestrator : 979 tests verts.

| # | Question | Résolution |
|---|---|---|
| T2-1 | Les liens « Retour… » en `text-sm text-laiton` préexistaient-ils ? | **Close (Orchestrator)** : `git diff main -- src/ui` ne compte que cinq `text-laiton` ajoutés (les deux rangs corrigés, le vainqueur X01, « Partie en cours », les marques). Les liens, l'Accueil, `Panneau`… sont sur `main` : constat hors lot, consigné dans `06-echanges.md`. |
| T2-2 | Une garde « petit texte + `text-laiton` » ? | **Close** : hors périmètre, notée en dette avec le constat hors lot. |

---

## Tentative 1

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high, lecture
> seule, sans shell) ; contrôles relancés par l'Orchestrator. Verdict du Test : **PASS**.

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Non | `src/core` intact : aucune règle, aucun format, `Dart.label` inchangé |
| Use cases | Non | Le pavé envoie les mêmes `Dart` |
| Infrastructure | Non | Rien de persisté ne bouge |
| UI | Oui | `paveUnifie` (nouveau), `matchX01`, `x01`, `cricket`, `tourDuMonde`, `feuilleCommune`, `accueilPartiesRecentes`, `nomDePartieEcrans` |
| Architecture (gardes) | Oui | `appuiBoundary`, `accentBoundary` (nouveaux), `themeBoundary` (adapté, non affaibli) |

**Hors périmètre :** bust, égalité, rejeu à froid, joueur supprimé, base vide — aucun journal
ni règle touchés ; les tests portent sur les fléchettes reçues (`toEqual`).

**Angles morts assumés :** glyphe rogné, position de l'exposant dans le coin, contraste au
repos de Hors et de la Bulle en clair, Accueil, choix du jeu et les quatre résumés (non
capturés), `laiton-clair` sur fond sombre en clair (`EtapeOrdre`, `StatTile`, en-têtes
inversés), coexistence du laiton du repère et de l'état armé hors X01, état armé de la Bulle
au repos (captures en Simple), iPhone réel.

## Cas de test — matrice des critères

| # | Critère | Couverture | Résultat |
|---|---|---|---|
| 1 | Structure commune, mêmes x / largeurs, rail pleine largeur dessous | `paveUnifie` « Structure commune » (`it.each` 3 jeux) + Chrome (x 12 / 160,8 / 235,2 ; y 716, 780 au Tour du monde ; rail 366 px) | Couvert |
| 2 | X01 / entraînement : Bulle / Hors, Bulle désactivée en Triple | `paveUnifie`, `matchX01` (exposant 25 → 50 → rien), `x01` | Couvert |
| 3 | Cricket 3 × 2, multiplicateur gradué, exposants | `paveUnifie` (ordre, `grid-cols-3`, « ×2 » / « ×3 », Bulle « ×2 » en Double — ajouté en boucle 1) | Couvert |
| 4 | Tour du monde sans rail ni « S » | `paveUnifie` (absence de rail, « Annuler 16 », « 16—— »), `libelleFlechetteTourDuMonde` ; `Dart.label` = `S17` inchangé | Couvert |
| 5 | Appui lisible, enfoncement inchangé | `appuiBoundary` (planchers, contre-épreuves) + Chrome 14,70:1 / 10,25:1 | Couvert |
| 6 | Aucun accent par mode, laiton partout, titre ≥ 4,5:1 en clair | `accentBoundary`, `accueilPartiesRecentes` (`it.each(GAME_MODE_IDS)`), `#614a08` relevé | Couvert ; rendu des résumés et d'`EtapeJeu` non capturé |
| 7 | Touches ≥ 48 px, paysage calé en bas | Classes `min-h-[3.25rem] paysage:min-h-12`, `paysage:self-end` + Chrome (bas à 382, aucun défilement) | Couvert |
| 8 | Libellés, tokens, ni halo / dégradé / arrondi | Lecture + Grep + gardes | Couvert |
| §§ 10-16 | Conformité à la planche (exposants, Annuler 12 px, écarts 6 / 4 px, rail, Bulle armée, Bulle grisée, style `.touche`) | Lecture de `PaveSaisie.tsx` / `index.css` + Chrome | Couvert ; écarts mesurés seulement |
| — | Ordre grille → rangée → rail | DOM + test dans les 3 jeux (ajouté en boucle 1 pour X01 et Tour du monde) | Couvert |

## Résultats

| Commande | Résultat |
|---|---|
| `npm run lint` | 264 fichiers, aucun problème |
| `npm run typecheck` | propre |
| `npx vitest run` | 62 fichiers, **979 tests** verts (après boucle 1 ; 975 avant) |
| `npm run build` | vert |
| Grep `Ã` / `Â` / `�` (`src`, `tests`) | 0 |

## Bugs trouvés

| # | Bug | Classement | Renvoi |
|---|---|---|---|
| N5 | Rang du premier en `text-laiton` (`text-sm`) dans les résumés Cricket et Tour du monde : ≈ 3,5:1 en clair, hérité du remplacement mécanique d'un accent plus foncé | Bug d'implémentation | Dev, boucle 1 → `text-laiton-clair` ; corrigé |
| N3 | Exposant « ×2 » de la Bulle au Cricket et ordre grille → rangée hors Cricket non vérifiés | Problème de test (couverture) | Dev, boucle 1 ; tests ajoutés |
| N1 | `appuiBoundary` ne voit qu'une partie de la classe de bug (pas les `bg-*`, ni `text-feutre`, `text-sur-laiton`, `text-rouge-*` sur une `.touche`) | Non bloquant | Dette, notée |

## Questions ouvertes

| # | Question | Résolution |
|---|---|---|
| 1 | N2 : rail en 0,1 em ou 0,04 em comme la planche ? | **Close (Orchestrator)** : dans la planche, `.seg` vaut 0,1 em ; le 0,04 em ne vaut que pour `.s3 .seg`, le rail étroit d'un autre placement. Le placement b retenu est conforme. |
| 2 | N5 : lisibilité de `text-laiton` en clair dans les résumés | **Close** : petit texte ajouté par le lot passé en `text-laiton-clair` (boucle 1). Nom du vainqueur X01 (24 px gras), « Partie en cours » (`text-3xl`) et marques SVG gardés : grand texte / graphisme. Les liens « Retour à l'accueil » et autres `text-sm text-laiton` de l'Accueil, des Statistiques, de `Panneau`… **préexistaient** sur `main` : constat hors lot, consigné dans `06-echanges.md`. |
| 3 | Cricket à plus de six cibles numérotées | **Close** : non spécifié par les règles, comportement inchangé par rapport à l'ancien pavé ; pas d'invention. |
| 4 | Élargir `appuiBoundary` (N1) dans ce lot ? | **Close** : non, laissé en dette (le défaut visé, P1, est couvert). |
