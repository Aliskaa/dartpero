# Lot `courbe` — plan de test

> Écrit par l'Orchestrator à partir des rapports de Test : un premier passage (`test`, opus, sans
> shell exploitable : analyse statique, verdict non concluant, bug B1), puis un second passage
> (agent généraliste opus avec shell : mutations réelles et mesure R1). Les commandes ont été
> rejouées par l'Orchestrator après la boucle 1.

## Verdict : PASS (après boucle 1, tour 1/3)

## Commandes (sorties réelles, Orchestrator, après correctif B1)

| Commande | Résultat |
|---|---|
| `npm run lint` | `Checked 339 files … No fixes applied.` |
| `npm run typecheck` | aucune erreur |
| `npm test` | `Test Files 92 passed (92)`, `Tests 1767 passed (1767)` ; gardes (`themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `lazyRoutes`, `horlogeBoundary`) comprises, verts |
| `npm run build` | `✓ built`, `precache 51 entries (909.00 KiB)` |

## Stratégie

Domaine (`tests/domain/progress.test.ts`), use cases (`tests/use-cases/playerProgress.test.ts`, filet
`playerStats.test.ts`), UI pure (`tests/ui/evolution.test.ts`), Testing Library
(`tests/ui/statistiquesEvolution.test.tsx` et adaptations de `statistiquesPodium`,
`pictogrammesEmplacements`, `Pictogramme`), gardes d'architecture. Déterminisme : horloges fakes, dates
locales. Angle mort assumé : le rendu (jsdom sans mise en page, dimensions posées par les tests).

## Critères d'acceptation (critère 4 réécrit par la Révision 1)

| # | Couvert par | État |
|---|---|---|
| 1 | `progress.test` (14 parties → 14 points, tendance dès la 3ᵉ) ; UI à 14 / 15 parties (ajout boucle 1) | Couvert |
| 2 | `statistiquesEvolution` remises à zéro joueur / période / mesure ; B1 (cache périmé) | Couvert |
| 3 | `progress.test` (40 et non 70 ; First 9 à 54) ; `playerProgress` pointillé = podium (`toBe`) | Couvert |
| 4 (réécrit) | 80 points au domaine ; UI 31 parties (défile, fin, Partie 31 sur 31) ; seuil 14 / 15 ; B1 | Couvert |
| 5 | UI 0, 1, 2 parties, joueur sans fléchette | Couvert |
| 6 | `<output>`, `aria-label` du tracé, `aria-valuetext` ; vraies touches (boucle 1) | Couvert (double annonce TalkBack : à l'écran) |
| 7 | `playerProgress` (`toBe`) ; UI « 70,5 » dans les deux cartes | Couvert |
| 8 | gardes vertes | Couvert |

## Contre-épreuves (mutations réelles, restauration prouvée par hash, aucun `git stash`)

| Mutation | Tests qui tombent |
|---|---|
| Tendance en moyenne de moyennes (Moyenne+First 9 ; variantes) | 2 (1 par variante) |
| Meilleure volée en `Math.max` | 2 |
| Tri par `createdAt` supprimé | 15 |
| Départage par `matchId` supprimé | 1 |
| `createdAt` → `updatedAt` (`x01StatsInPeriod`, variantes) | 2 / 2 / 1 |
| Seuil de glissé neutralisé | 2 |
| Clé de remontée sans nombre de points ni dernière partie (B1) | 2 |

Aucun trou de couverture : chaque mutation fait tomber au moins un test. Sources restaurées à
l'identique (hash avant / après sur 32 fichiers, `git status` identique).

## R1 (500 parties X01, 2 joueurs, 12 volées, vrai `createServices`, poste de bureau)

`getPlayerStats` 6,8 ms (médiane) ; `getPlayerProgress` 15,9 ms ; `computeProgress` seul 6,6 ms. Sur
téléphone avec Dexie : estimé 3 à 5 × (estimation, non mesurée), sous 100 ms. **À mesurer sur téléphone**
(spinner au changement de période, fluidité du défilement au-delà de 150 points).

## Constats et classement

| # | Constat | Classement | Suite |
|---|---|---|---|
| B1 | Cache TanStack périmé : sélection et vue non remises à la fin | Bug d'implémentation | Corrigé (clé enrichie), testé, mutation (e) tombe |
| A1 | Bascule déjà active appelait `changerMesure` | Ajustement | Corrigé + test |
| A2 | `axeVertical` : boucle infinie sur NaN / Infinity | Ajustement | Corrigé + tests |
| A5 | Couverture mince (14 / 15 parties, année, bouton non principal, glissé vertical, flèches) | Ajustement | Complétée ; `onKeyDown` ajouté au curseur (`user-event` sans flèches sur `range`) |
| A3 | `themeBoundary` laisserait passer `fill-craie-3/50` sur un `<text>` SVG | Ajustement de garde | Hors lot |
| A4 | Geste `appuyer` local au fichier de test | Ajustement de test | Si un second écran l'utilise |
| A6 | Élision « d' » ignore le h muet (« de Hélène »), nom accessible seulement | Hors périmètre | Revue |
| R2 | « Partie N sur M » ≠ `matchesPlayed` du podium | Connu | Utilisateur informé |
| — | Commentaire d'en-tête de `CarteEvolution.tsx` décrivait l'ancienne clé | Ajustement | Corrigé par l'Orchestrator (commentaire seul) |

Vérifié sans constat : aucun `dangerouslySetInnerHTML` / `innerHTML` dans `src` ; aucune clé
`localStorage` ni `usePreference` nouvelle (politique de confidentialité inchangée) ; `progress.ts`
n'importe que du domaine en relatif ; `x01StatsInPeriod` seule définition de la période ; aucune
dépendance ajoutée.

## À vérifier à l'écran (relecture humaine)

Portrait / paysage 844 × 390, sombre / clair, 1 / 3 / 6 joueurs, 360 / 390 px ; aucun défilement
horizontal de page (`documentElement.scrollWidth === clientWidth`, ~150 parties) ; carte bornée
`max-w-sm` ; en-tête « Évolution » et puces jointives sur une ligne à 360 px ; appui sélectionne, glissé
défile (`pointercancel` Chrome Android et Safari iOS, `touch-action` iOS, gestes de bord système) ;
barre native visible ; ouverture en fin de courbe sans saut ; dates qui suivent défilement et rotation ;
texte d'axe ≈ 10 px (U8, sous le plancher de la charte, choix de l'utilisateur) en `craie-3` dans les deux
thèmes ; glyphe `<sup>e</sup>` ; « 31 déc 2025 » sans chevauchement ; TalkBack / VoiceOver (double annonce
`aria-valuetext` + `<output>`) ; focus clavier (la fenêtre qui défile peut devenir un arrêt de tabulation) ;
contraste des carrés, de la tendance et de la grille `craie/12` en thème clair.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | La remontée de la carte à la relecture en fond efface une sélection faite pendant la relecture (conforme au critère 4 réécrit) : acceptable ? | Revue / Utilisateur |
| 2 | R1 sur téléphone avec une base de 300-500 parties X01 | Utilisateur (relecture) |
| 3 | U8 (axes ≈ 10 px) à confirmer à l'écran | Utilisateur |
