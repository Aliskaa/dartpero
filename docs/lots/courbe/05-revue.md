# Lot `courbe` — revue

> Écrit par l'Orchestrator à partir du rapport de `review` (opus, lecture seule, sans shell). Sa
> première passe a atteint `maxTurns` (40) sans rapport ; le rapport a été rendu après relance par
> message. Le retard sur `main` (constat 1) a été **vérifié par l'Orchestrator** :
> `git merge-base main HEAD` = `40ccd65`, `main` = `2168c23` (lot Killer).

## Verdict : NO-GO en l'état, levable sans toucher au design

Aucun bug bloquant dans le code. Le design, la planche et toutes les décisions de l'utilisateur
(U3, N1-N5, C1, C2, U6, U8, U11, U12, U1a, U9a) sont tenus. Ce qui bloque :

1. la branche ne peut pas être fusionnée en `--ff-only` (retard sur `main`) ;
2. R1, R2, O1 et deux points d'acceptation ne sont pas signés ;
3. la gravure `CLAUDE.md` reste à faire (sur le `CLAUDE.md` de `main`, après rebase).

## Constats

| # | Sév. | Constat | Renvoi |
|---|---|---|---|
| 1 | **Majeur** | Le lot part de `40ccd65` ; `main` a reçu le lot Killer (`2168c23`) qui touche les mêmes fichiers. Conflits certains : `Pictogramme.tsx` (Killer et `evolution` sont chacun le 13ᵉ : passer à **14**), `Pictogramme.test.tsx`, `tracesPictogrammes.ts`, `REMPLACEES` de `pictogrammesBoundary` (`Crosshair` vs `TrendingUp` / `ChartLine`), `labels.ts`, `container.ts`, charte § Identité (« Treize… quatre modes » → « Quatorze… cinq modes »), CONVENTIONS § 14. Test probablement cassé après rebase : `tests/use-cases/playerProgress.test.ts:96` parcourt `GAME_MODE_IDS` sans X01, donc inclura `KILLER`, lancé en solo alors que `lancerPartie.ts` de `main` dit « Pas de solo au Killer ». | Rebase **avec l'accord de l'utilisateur**, Dev puis Test |
| 2 | Mineur | Charte § Typographie (« aucune taille sous 0,75 rem ») ne renvoie pas à l'« Écart connu » U8 ; la mention « jamais plat » de l'axe manque. | Dev (doc) |
| 3 | Mineur | CONVENTIONS § 14 ne cite pas `use-cases/x01StatsInPeriod.ts`. | Dev (doc) |
| 4 | Mineur | `PARTIES_POUR_TENDANCE = 3` (`evolution.ts:260`) recopie `TREND_SPAN` du cœur : mieux `= TREND_SPAN`. | Dev |
| 5 | Mineur | Interlettrage des puces 0,08 em (celui de `BasculesPodium`) au lieu de 0,06 em (planche) : écart à la planche non tranché côté produit. | Utilisateur |
| 6 | Mineur | Caractères de contrôle dans les notes de lot (`00-orchestration.md`, `01-architecture.md`). | **Corrigé par l'Orchestrator** (relu : plus aucun caractère de contrôle) |
| 7 | Info | Axe « jamais sous 0 / jamais plat » : acceptable (sinon `haut === bas`, division par zéro dans `ordonnee`) ; axes de la planche reproduits exactement ; commenté ⚠️ et documenté. | — |
| 8 | Info | Remontée de la carte à la relecture en fond : acceptable (fenêtre ~16 ms, conforme au critère 4 réécrit ; une partie en cours qui gagne une volée ne remonte pas la carte). | Acceptation en une ligne |
| 9 | Info | O1 (`Math.min(...)` / `Math.max(...)` dans `evolution.ts:218-219`) pas exigé ; puisque Dev repasse pour le rebase, un `reduce` (3 lignes + un test) ne coûte presque rien. | Utilisateur (choix) |
| 10 | Info | Clé `['evolutionJoueurs', periode]` déclarée dans l'écran : conforme à CONVENTIONS § 10. | — |
| 11 | Info | A3 (`themeBoundary` laisserait passer `fill-craie-3/50` sur un texte SVG) : trou de garde hors lot, à porter à l'index. | — |

Vérifié par la Revue dans le code : pondération (`computeCareerStats`), Meilleure volée seule moyenne
arithmétique (⚠️ commentée, test 100 ≠ 140), tri par `createdAt` puis identifiant sur copie, filtre de
période sur `createdAt`, rien de stocké, pas de `Date.now()`, dépendances (domaine → rien d'externe),
charte (aucune couleur en dur ni `rounded-*`, texte SVG en couleur pleine, alpha seulement sur la grille).
Limites : pas de shell ; `Pictogramme.test.tsx`, `tracesPictogrammes.ts`, détail de
`statistiquesPodium.test.tsx` non lus.

## Levée du NO-GO (2026-10-22, accords de l'utilisateur)

| # | Décision | Fait |
|---|---|---|
| 1 | Rebase sur `main` (Killer `2168c23`) accordé | Fait : conflits résolus (`Pictogramme.tsx` et son test, `pictogrammesBoundary`, CONVENTIONS § 14) ; 14 pictogrammes, 5 modes ; `playerProgress.test.ts` donne 2 joueurs au Killer |
| 2 | R1 accepté | Mesure sur téléphone (300-500 parties) encore à faire avant déploiement |
| 3 | R2 accepté | « Partie N sur M » compte les parties avec fléchette |
| 4 | O1 accepté | `reduce` dans `axeVertical` + test sur 200 000 valeurs ; `PARTIES_POUR_TENDANCE = TREND_SPAN` |
| 5 | Remontée de la carte à la relecture en fond acceptée | — |
| 6 | Interlettrage : « respecte la planche » | 0,06 em pour les puces jointives (Évolution), 0,08 em gardé au podium |
| 7 | Constats 2 et 3 (docs) | Charte § Typographie renvoie à l'écart U8 ; CONVENTIONS § 14 cite `x01StatsInPeriod` |
| 8 | Gravure `CLAUDE.md` | Faite sur le `CLAUDE.md` de `main` (§ Décisions structurantes et § Statistiques X01) |

Après rebase : `biome check`, `tsc --noEmit` et `vitest run` verts (2007 tests). Reste hors
d'atteinte du shell : la relecture à l'écran (liste ci-dessous), A6 (élision « d' » devant h muet,
nom accessible seulement) et U8 (axes ≈ 10 px) à confirmer à l'écran.

## Questions encore ouvertes

| # | Question | Qui la clôt |
|---|---|---|
| 1 | Rebase de `lot/courbe` sur `main` (Killer) et résolution des conflits | Utilisateur (accord), puis Dev et Test |
| 2 | R1 : double lecture complète de la base par période ; mesure sur téléphone (300-500 parties) puis accepter ou demander une lecture unique | Utilisateur |
| 3 | R2 : « Partie N sur M » (parties avec fléchette) ≠ « sur N parties » du podium ; acceptation écrite | Utilisateur |
| 4 | O1 : `reduce` dans ce lot ou dette | Utilisateur |
| 5 | Remontée de la carte à la relecture en fond : acceptée ? | Utilisateur |
| 6 | Interlettrage 0,08 ou 0,06 em | Utilisateur |
| 7 | A6 : élision « d' » ignore le h muet (nom accessible seulement) : accepter ou lot futur | Utilisateur |
| 8 | U8 (axes ≈ 10 px) à confirmer à l'écran (déjà choisi) | Utilisateur, relecture |
| 9 | Gravure dans `CLAUDE.md` puis `/refresh-architecture` | Orchestrator, avec accord |

## À vérifier à l'écran seulement

Portrait 360 / 390 px et paysage 844 × 390, sombre et clair, 1 / 3 / 6 joueurs ;
`documentElement.scrollWidth === clientWidth` avec ~150 parties ; carte bornée `max-w-sm` ; titre et
trois puces sur une ligne à 360 px ; alignement des valeurs de la gouttière sur les lignes de la fenêtre
(deux SVG) ; appui qui sélectionne et glissé qui défile (`pointercancel` Chrome Android et Safari iOS,
gestes de bord) ; barre native ; ouverture en fin de courbe sans saut ; dates qui suivent défilement et
rotation, « 31 déc 2025 » sans chevauchement ; texte d'axe ≈ 10 px en `craie-3` dans les deux thèmes ;
glyphe `<sup>e</sup>` ; contraste carrés / tendance / grille `craie/12` en clair ; TalkBack / VoiceOver
(double annonce, arrêt de tabulation de la fenêtre) ; fluidité au-delà de 300 points (chaque `scroll`
redessine le SVG) et spinner au changement de période (R1).

## Gravure proposée pour `CLAUDE.md` (à appliquer sur celui de `main`, après rebase)

1. § Règles du jeu X01 › Statistiques, après « Plus haut checkout » :

```
- **Évolution** (carte de Statistiques, lot `courbe`) : un point par partie X01 où le joueur a
  lancé **au moins une fléchette**, rangé par `createdAt` (puis identifiant), parties en cours
  et abandonnées comprises — les mêmes parties que le cumul, par le même filtre de période
  (`x01StatsInPeriod`). **Tendance** au rang N ≥ 3, sur les parties N-2..N : Moyenne et First 9
  **recalculées depuis les totaux** (`computeCareerStats`), jamais une moyenne de moyennes.
  ⚠️ **Meilleure volée : moyenne arithmétique des 3 meilleures volées** (décision de
  l'utilisateur), seule moyenne arithmétique de la série. Écart = tendance(N) − tendance(3) ;
  ligne pointillée = la moyenne de la période, celle du podium. **Rien n'est stocké**
  (`computeProgress`, `x01/progress.ts`).
```

2. § Décisions structurantes :

```
- **Carte Évolution** (lot `courbe`) : sous la cible, elle suit le joueur du sélecteur et la
  période ; aucun plafond (au-delà de 14 parties la courbe défile, axe fixe) ; **appui seul**
  (un glissé ne sélectionne jamais) ; mesure **jamais mémorisée** (aucune clé, politique
  inchangée). ⚠️ Texte d'axe ≈ 10 px : écart connu de la charte, réservé à cet écran de
  consultation. Détail : CHARTE § Composants.
```
