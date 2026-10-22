# Lot `courbe` — notes de dev

> Écrit par l'Orchestrator à partir des deux rapports du sous-agent `dev` (opus, deux lancements :
> partie 1 domaine / application / composition, partie 2 UI / charte / tests UI). Aucun commit.

## Ce qui a été implémenté

**Domaine** — `src/core/domain/games/x01/progress.ts` : `computeProgress`, `DatedX01Stats`,
`ProgressMeasures`, `ProgressPoint`, `PlayerProgress { playerId, points, reference }`, `TREND_SPAN = 3`.
Pas de plafond. Tri par `createdAt` puis `matchId` ; un point par partie avec ≥ 1 fléchette ; tendance
depuis les totaux via `computeCareerStats` (Meilleure volée : moyenne arithmétique des 3, U3 a, ⚠️
commenté et épinglé par test) ; `trendDelta` = tendance(N) − tendance(rang 3), `null` avant ; référence =
`computeCareerStats` sur toute la période. Un joueur sans point est absent du résultat.

**Application** — `x01StatsInPeriod.ts` (filtre de période extrait, partagé avec
`GetPlayerStatsUseCase`, contrat inchangé), port `GetPlayerProgress`, `GetPlayerProgressUseCase`.
**Composition** — `Services.getPlayerProgress` dans `container.ts`.

**UI** — `src/ui/evolution.ts` (pur : géométrie, `PARTIES_VISIBLES = 14`, pas, largeur, index, dates
visibles, axe U7, défilement minimal) ; `CarteEvolution.tsx` (gouttière fixe + fenêtre qui défile,
curseur natif masqué hors fenêtre, `<output>`, appui seul, état 1-2 parties) ; `StatistiquesEcran.tsx`
(requête `['evolutionJoueurs', periode]`, mesure en `useState`, carte entre cible et podium, clé
`joueur|période`) ; `labels.ts` ; `BasculesPodium` reçoit une prop `disposition` (variante jointive) ;
pictogramme `evolution` (13ᵉ, trait 3, bouts plats) ; `TrendingUp` et `ChartLine` ajoutés à `REMPLACEES`.

**Docs** — `docs/CHARTE_GRAPHIQUE.md` (Composants, bascules jointives, Identité treize pictogrammes,
carte des impacts, Mouvement, « Écart connu » U8, Fichiers de référence) ; `.claude/CONVENTIONS.md` § 14.
`CLAUDE.md` non touché (gravure en fin de lot, avec accord).

**Tests** — `tests/domain/progress.test.ts` (13), `tests/use-cases/playerProgress.test.ts` (12),
`tests/ui/evolution.test.ts`, `tests/ui/statistiquesEvolution.test.tsx` ; adaptés : `Pictogramme.test.tsx`
(12 → 13), `tracesPictogrammes.ts`, `pictogrammesEmplacements.test.tsx` (4 → 5), `statistiquesPodium.test.tsx`,
`pictogrammesBoundary.test.ts`.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| `trendDelta : ProgressMeasures \| null` (type non précisé) | Ajustement | Trois mesures, écart de Meilleure volée arrondi côté UI |
| Joueur sans point absent de `PlayerProgress[]` | Ajustement | Cohérent avec « carte seulement si ≥ 1 point » ; l'UI cherche par `playerId` |
| Bas de l'axe jamais sous 0 ; jamais d'axe plat (une seule valeur multiple du pas gagne un pas en haut) | Ajustement | Hors règle U7 telle qu'écrite : à confirmer en revue |
| Aucune écriture de `scrollLeft` quand n ≤ 14 | Ajustement | Trois tests du ruban d'onglets exigent que rien d'autre ne défile à l'ouverture |
| Glissé = plus de 10 px entre appui et lâcher (`SEUIL_GLISSE_PX`), en plus du `pointercancel`, bouton principal seul | Ajustement | Garantit « le glissé ne sélectionne jamais » même sans défilement (N1) |
| Dates posées dans le SVG qui défile sur 1ʳᵉ / médiane / dernière partie visibles, recalculées à `onScroll` ; écouteur `resize` ajouté | Ajustement | N4 a ; suit une rotation, sans `ResizeObserver` |
| Préfixe masqué « Moyenne : » etc. dans l'`<output>` | Ajustement | Lecture intelligible ; rien ne change à l'écran |
| Interlettrage des puces 0,08 em (celui de `BasculesPodium`) au lieu de 0,06 em | Ajustement, **repris** | Revue + utilisateur (« respecte la planche ») : 0,06 em pour la disposition `jointives`, 0,08 em gardé pour `espacees` (podium) |
| Écart arrondi à zéro affiché « 0 » | Ajustement | U12 |
| Une seule partie : carré à x = 145 de la fenêtre (centre du tracé), date centrée | Ajustement | U6 |

Aucune *refonte nécessaire*.

## Contrôles (rapports de `dev`, à rejouer par Test)

| Commande | Résultat |
|---|---|
| `npm run lint` | `Checked 339 files … No fixes applied.` |
| `npm run typecheck` | aucune erreur |
| `npm test` | 92 fichiers, 1756 tests passés ; 11 fichiers de gardes verts |
| `npm run build` | `✓ built`, PWA precache 51 entries (908.67 KiB) |

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | **U8** : la garde `typographieBoundary` laisse passer le texte d'axe à ≈ 10 px (elle ne lit que `text-[…]`), mais la charte § Typographie dit « aucune taille sous 0,75 rem ». Choisi par l'utilisateur en connaissance (option « ≈ 10 px comme la planche », libellée « sous le plancher de 12 px »), documenté « Écart connu » dans la charte. Passer à 12 px = la constante `TEXTE_AXE` de `CarteEvolution.tsx`. L'Orchestrator le considère clos par la réponse de l'utilisateur ; Revue le rappelle, la relecture à l'écran tranche. | Revue / Utilisateur |
| 2 | Axe : bas jamais sous 0 (écart à U7) — acceptable ? | Revue |
| 3 | R1 (double lecture de la base par période), R2 (« sur M parties » ≠ `matchesPlayed`) | Test / Utilisateur |

## Limites connues et TODO assumés

- jsdom sans mise en page : tests posent `clientWidth`, `scrollWidth`, `scrollLeft`, `getBoundingClientRect`.
  Rendu réel, gestes (`pointercancel`, `touch-action` iOS), barre native, thème clair, paysage, 360 / 390 px,
  glyphe `<sup>e</sup>`, TalkBack (double annonce `aria-valuetext` + `<output>`), fluidité ≥ 300 parties :
  relecture à l'écran.
- Trois avertissements jsdom « Not implemented: navigation » dans le journal des tests (non vérifié s'ils existaient avant).
- Gravure `CLAUDE.md` (tendance sur 3 parties, Meilleure volée en moyenne arithmétique, rien de stocké) à faire en fin de lot, avec accord.
