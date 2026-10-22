# Lot `courbe` — architecture

> Écrit par l'Orchestrator à partir du rapport de `archi-authority` (opus, effort max ; scout et
> designer sautés : surface gravée). Le rapport source commence par `Architecture result: PASS`.
> Lecture de l'agent : planche locale lue en entier ; artifact non ouvert (pas d'outil web) ;
> `labels.ts` lu en partie, CONVENTIONS § 13-14, `tests/fakes`, `ChoixSegmente`, `Etats`,
> `EnTeteEcran` non lus.

## Problème

L'écran Statistiques ne répond pas à « est-ce que je progresse ? ». Le lot ajoute une série par partie
X01 pour le joueur du sélecteur, sur la période choisie : valeur de chaque partie, tendance sur
3 parties, moyenne de la période. Rien n'est stocké. Trois invariants par construction :

- pas de moyenne de moyennes (tendance et ligne pointillée depuis les totaux, critère 3) ;
- accord avec le podium (dernier point de Moyenne = carte Moyenne sur une période d'une partie,
  critère 7) ;
- mêmes parties que le reste de l'écran (même filtre de période, X01 seul).

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| Étendre `PlayerCareer` | Une seule lecture de la base | La demande fige `GetPlayerStats` / `CareerStats` ; contraire à l'ISP (`ChoixJoueursExistants` lit `GetPlayerStats`) ; touche les tests du podium. **Écartée** |
| Port dédié par joueur | Calcule le strict nécessaire | Une requête à chaque changement d'onglet : clignotement. **Écartée** |
| **Port dédié par période (tous les joueurs)** | Contrat du podium intact ; changer d'onglet instantané | Seconde lecture complète de la base par période (R1). **Retenue** |
| Série calculée dans l'UI | Rien dans le cœur | `PlayerCareer` est cumulé, sans détail par partie ; l'UI réimplémenterait une règle. **Écartée** |
| Recopier le filtre de période | Ne touche pas `GetPlayerStatsUseCase` | Deux définitions de « aujourd'hui » qui peuvent diverger. **Écartée** (extraction) |

## Approche retenue

### Domaine — `src/core/domain/games/x01/progress.ts` (nouveau, à côté de `career.ts`)

Exports : `DatedX01Stats = { matchId, createdAt, stats }`, `ProgressMeasures = { average3,
first9Average, highestVisit }`, `ProgressPoint = { matchId, createdAt, number, value, trend |
null, trendDelta | null }` (`number` = rang vrai dans la période, dès 1), `PlayerProgress =
{ playerId, total, points, reference: { average3, first9Average } }`, `PROGRESS_WINDOW = 30`,
`TREND_SPAN = 3`, `computeProgress(matches)`.

1. Tri **explicite** par `createdAt` croissant puis `matchId` (`listAll()` rend `updatedAt`
   décroissant, `DexieMatchRepository.ts:35`).
2. Un point par partie où le joueur a `dartsThrown > 0`. Une volée compte 1 à 3 fléchettes
   (`x01/rules.ts:79`, `backupSchema.ts:188`) : les trois mesures existent toujours sur un point, « — »
   est impossible. À documenter (⚠️) et tester.
3. Valeur d'un point : champs de `X01PlayerStats` déjà calculés.
4. Tendance au rang N ≥ 3 sur les parties N-2..N : `computeCareerStats(fenêtre)` (même fonction que le
   podium) → Σ points ÷ Σ fléchettes × 3, idem First 9. Jamais de moyenne d'`average3`. Meilleure
   volée : voir U3.
5. Référence (ligne pointillée) : `computeCareerStats` sur toute la période = `GetPlayerStats`.
6. Tendance calculée **avant** de couper aux 30 derniers ; `number` et `total` restent vrais.
7. `trendDelta` = tendance du point − tendance au rang 3 (base de la planche ; sous plafond : U4).

### Application

- `src/core/application/use-cases/x01StatsInPeriod.ts` : reprend `JOURS_EN_ARRIERE`, `debutDePeriode`,
  filtre `modeOf === 'X01'` et `createdAt >= début`, projection → `DatedX01Stats[]`.
  `GetPlayerStatsUseCase` l'appelle (contrat inchangé ; `tests/use-cases/playerStats.test.ts` = filet).
- Port `ports/driving/GetPlayerProgress.ts` : `execute(period?: StatsPeriod)`.
- `GetPlayerProgressUseCase(matches, clock)` : `computeProgress(x01StatsInPeriod(await listAll(), …))`.
  Pas de `PlayerRepository` (nom et couleur déjà dans le `PlayerCareer` choisi).

### Composition

`Services.getPlayerProgress` + câblage dans `container.ts` ; `fakeServices()` le reçoit.

### UI

- `src/ui/evolution.ts` (pur, comme `podium.ts`) : mesure → champ (`MESURES_MOYENNE`), géométrie de la
  planche (W 320, H 190, L 30, R 10, T 10, B 24), point le plus proche
  `round((x − L) / (W − L − R) × (n − 1))` borné, indices de dates, bornes de l'axe (U7), états,
  mention du plafond.
- `src/ui/composants/commun/CarteEvolution.tsx` (précédent `CartePodium`) : `<section aria-labelledby>`,
  `<h2>`, `Pictogramme evolution` 20 px, bascules (U2), lecture dans un `<output>` (aria-live implicite),
  SVG `role="img"` nommé, tokens (`stroke-laiton`, `fill-craie`, `fill-laiton-clair`, `fill-craie-3`),
  points en `<rect>`, `touch-pan-y`, `pointerdown` + `pointermove` bouton enfoncé + `setPointerCapture`,
  jamais d'`innerHTML` ni de `dangerouslySetInnerHTML`, jamais d'alpha sur un texte SVG.
  Clavier / lecteur d'écran : `<input type="range">` natif masqué synchronisé avec la sélection, anneau
  de focus par `focus-within`.
  Sélection en état local ; clé `playerId|période` pour remonter la carte (remise à zéro) ; changement
  de **mesure** remis à zéro dans le gestionnaire, sans remonter la carte (le bouton focalisé survit).
- `StatistiquesEcran.tsx` : `mesureEvolution` en `useState<MesureMoyenne>('MOYENNE')` au-dessus du
  chargement ; requête `['evolutionJoueurs', periode]` ; spinner tant que `stats` ou `evolution` est en
  attente ; carte entre `BlocCible` et `CARTES_PODIUM`, seulement si ≥ 1 point ; corriger le commentaire
  « ne pilote que la cible » de `OngletsJoueurs`. L'import invalide déjà tout (`ReglagesEcran.tsx:286`).
- `labels.ts` : tout le français, même formateur `moyenne()` / `nombre()` que le podium ; signe de l'écart
  « + » / « − » (U+2212) posé à la main ; « 3<sup>e</sup> » en `<sup>` par segments (le caractère U+1D49
  de la demande serait probablement absent du sous-ensemble `latin` des polices — à vérifier à l'écran).
- `Pictogramme.tsx` : 13e pictogramme `evolution` ; adapter `tests/ui/Pictogramme.test.tsx` (12 → 13) et
  `tests/ui/tracesPictogrammes.ts`.

### Réponses aux questions non bloquantes de la demande

- Q1 : **port dédié** `GetPlayerProgress`, calcul à côté de `career.ts`, accord garanti par le réemploi de
  `computeCareerStats` et du filtre partagé.
- Q2 (année dans les dates) : point produit, devenu **U5(b)**.

### Test du critère 3

Parties : 180 pts en 3 fléchettes, 0 en 3, 300 en 30 → pondéré 480 ÷ 36 × 3 = 40 ; moyenne de moyennes 70.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | `src/core/domain/games/x01/progress.ts` | Nouveau (`career.ts`, `stats.ts` inchangés) |
| `core/application/` | `ports/driving/GetPlayerProgress.ts`, `use-cases/GetPlayerProgressUseCase.ts`, `use-cases/x01StatsInPeriod.ts` ; `GetPlayerStatsUseCase.ts` | Nouveaux ; extraction interne, contrat inchangé |
| `infrastructure/` | — | Rien |
| `ui/` | `src/ui/evolution.ts`, `composants/commun/CarteEvolution.tsx` ; `ecrans/StatistiquesEcran.tsx`, `Pictogramme.tsx`, `labels.ts` | Nouveaux ; modifiés |
| `composition/` | `src/composition/container.ts` | `Services` et câblage |
| `tests/` | `tests/domain/progress.test.ts`, `tests/use-cases/playerProgress.test.ts`, `tests/ui/evolution.test.ts`, `tests/ui/statistiquesEvolution.test.tsx` ; adaptés : `Pictogramme.test.tsx`, `tracesPictogrammes.ts` | Voir couverture ci-dessous |
| docs | `docs/CHARTE_GRAPHIQUE.md` (§ Composants ; § Identité, treize pictogrammes ; § La carte des impacts « le sélecteur ne pilote que la cible » ; § Fichiers de référence « douze »), `.claude/CONVENTIONS.md` § 14, PLAN | Fin de lot |

Couverture des tests : `progress.test.ts` — ordre par `createdAt` sur entrée mélangée, partie sans
fléchette ignorée, 14 parties → 14 points et tendance dès la 3ᵉ, pondéré ≠ moyenne de moyennes, First 9,
plafond (31 parties → 30 points numérotés 2 à 31, total 31), tendance du premier point tracé avec ses
prédécesseurs, référence = `computeCareerStats`, égalités de date. `playerProgress.test.ts` — mêmes
périodes que `GetPlayerStats`, lecture sur `createdAt`, X01 seul, en cours et abandonnées comptées,
profil supprimé, accord exact (`toBe`) avec le podium. `evolution.test.ts` — géométrie.
`statistiquesEvolution.test.tsx` — trois bascules, toucher (`getBoundingClientRect` posé), clavier,
remises à zéro (joueur / période / mesure), 0, 1, 2, 3 et 31 parties, un seul joueur, `role="img"`.

**Sens des dépendances vérifié :** `progress.ts` n'importe que `./stats`, `./career`,
`../../value-objects/ids` (relatifs) ; application → domaine ; UI → types et constantes + `useServices()`.
Gardes : `hexagonalBoundary`, `horlogeBoundary`, `lazyRoutes`.
**Nouveau port ?** `GetPlayerProgress` (driving), premier consommateur : `StatistiquesEcran`.

## Décisions de `CLAUDE.md` concernées

Appliquées : hexagonal, UI → use cases, câblage dans `container.ts`, rien de stocké, TanStack Query pour
les stats, règles X01 § Statistiques, politique de confidentialité inchangée, charte (angle vif, zéro
dégradé, tokens), vocabulaire dans `labels.ts`.
**À graver en fin de lot (avec accord)** : une ligne § Règles X01, Statistiques — tendance de la carte
Évolution sur les 3 dernières parties, recalculée depuis les totaux, jamais une moyenne de moyennes ;
un point par partie X01 avec ≥ 1 fléchette, rangée par `createdAt` ; en cours et abandonnées comprises ;
rien de stocké. Puis `/refresh-architecture`.

## Baseline sécurité

Aucune frontière nouvelle : ni import JSON, ni format persisté, ni Dexie, ni `backupSchema`, aucune clé
`localStorage` (mesure non mémorisée), pas de réseau, service worker et en-têtes inchangés, aucune
dépendance d'exécution (SVG à la main ; une bibliothèque de graphiques serait un bloqueur). Pseudo rendu
en texte ; l'`innerHTML` de la planche n'est pas transposé.
- **R1** : double lecture complète de la base à chaque changement de période, non mesurée. Mitigation :
  cache par période. Owner : Test (mesure sur téléphone, base de 300-500 parties X01), acceptation par
  l'utilisateur.
- **R2** : « Partie N sur M » compte les parties avec fléchette, « Hors cible par partie, sur N
  parties » compte `matchesPlayed` ; les deux peuvent différer (ex. partie en cours avant la première
  volée du joueur). Conséquence de la règle validée « pas de point sans fléchette ». Owner : utilisateur,
  à informer.

## Conformité à la planche

Planche `C:\Users\kevin\Documents\Flechettes\docs\maquettes\courbe\courbe.html` (piste A) lue en entier.
Ordre, carte, bascules, grand chiffre, écart, SVG, ligne pointillée, tracés, lecture au doigt, légende,
état « peu de parties », mention « 30 dernières parties » (hors planche, acté par la demande) : suivis à
l'identique **sauf** les points posés en questions U1-U12.
Écarts imposés par la charte et `typographieBoundary` (posés en U8) : 0,62 / 0,64 / 0,72 rem →
`text-etiquette` (0,75 rem) ; 0,78 → 0,75 rem ; 1,1 rem → `text-lg` ; 2,9 rem → `text-5xl` ; hex de la
planche → tokens de l'app ; `--filet` → jeton général avec alpha.

## Questions ouvertes

### Pour l'utilisateur (points produit — aucune n'est tranchée)

**Avant le Dev du domaine**
- **U3. Tendance de Meilleure volée** : (a) moyenne arithmétique des 3 meilleures volées (planche) ;
  (b) le maximum des 3 (record sur « les totaux recalculés »).
- **U4. Au-delà de 30 parties** : l'écart « depuis les 3 premières parties » part-il des parties 1-3 de la
  période (non tracées) ou des 3 premières tracées ? Confirmer aussi : tendance tracée dès le premier point
  visible (avec ses vrais prédécesseurs), ligne pointillée = moyenne de toute la période.

**Avant le Dev de l'UI**
- **U1. Habillage** : (a) planche (filet haut laiton, titre craie-vive) ; (b) `CartePodium` réelle (filet
  craie, titre laiton).
- **U2. En-tête trop large** (~345 px estimés pour 300-330 disponibles) : (a) libellés courts du podium
  « Moy. · F9 · Volée » ; (b) bascules sur une seconde ligne ; (c) retour à la ligne si besoin. Puces
  jointives (planche) ou espacées (podium) ?
- **U5. Dates** : (a) « 21 oct » ou « 21 oct. » ; (b) année : (i) seulement au changement d'année,
  (ii) dès qu'elle diffère de l'année en cours, (iii) jamais ; et où (axe et/ou « Partie N sur M · date »).
- **U6. État « peu de parties »** : (a) tel que la planche (Moyenne seule, rien à sélectionner) ;
  (b) garder bascule et sélection. À une partie : place du point, dates affichées, seconde phrase
  « Encore une partie pour la tracer. » fausse à une partie, nom de la courbe (« …, une partie »),
  élision « d' ».
- **U7. Axe vertical** : règle proposée — pas de 5 (Moyenne, First 9) ou 40 (Meilleure volée), bornes au
  multiple du pas encadrant points, tendances et pointillé, un pas de marge en bas (sauf Meilleure
  volée), pas doublé au-delà de 6 intervalles.
- **U8. Tailles** : confirmer la correspondance aux tokens ; texte des axes ~10 px, sous le plancher
  de 12 px : (a) comme la planche ; (b) monter à 12 px.
- **U9. Trait du pictogramme** : (a) planche (2,5 px, bouts plats) ; (b) famille de la charte (2 sur
  grille 24, bouts carrés).
- **U10. Mention « 30 dernières parties »** : position (entre courbe et légende, ou après) et style.

**Peuvent attendre la revue**
- **U11.** Libellés accessibles du curseur clavier (le Dev les liste) ; garder ou renommer « Joueur de la
  cible », qui pilote aussi Évolution.
- **U12.** Écart arrondi à zéro (« −0,0 ») : garder ? Transition 0,2 s de la tendance : animer ou non ?

### Techniques

- **Dev** : règles a11y de Biome sur un SVG `role="img"` à gestionnaires de pointeur (sinon conteneur ou
  `biome-ignore` justifié) ; utilitaires `stroke-*` / `fill-*` sur tokens (sinon `var(--color-…)` comme
  `CarteImpacts`) ; Grep avant d'ajouter des icônes lucide à `REMPLACEES`.
- **Test** : double annonce possible (`aria-valuetext` + `<output>`) à écouter sous TalkBack ;
  `getBoundingClientRect` vaut 0 sous jsdom ; mesurer R1 ; largeur d'en-tête à 360 / 390 px ; thème clair,
  paysage (carte bornée `max-w-sm`), glyphe « e » en exposant : à l'écran.
- **Sécurité** : confirmer aucune dépendance, aucun `innerHTML`, politique inchangée.
- Note hors lot : la liste `MODES` de `hexagonalBoundary` omet `cricket` et `checkout-practice` (dette).

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.

### Révision 1 — décisions de l'utilisateur (2026-10-21), avant le Dev

Réponses de l'utilisateur aux questions ci-dessus :

- **U3 → (a)** : tendance de Meilleure volée = moyenne arithmétique des 3 meilleures volées (planche).
- **U4 → changement de périmètre** : plus de plafond de 30 parties. Citation : « Est-ce qu'on peut afficher seulement la période sélectionnée (aujourd'hui, 7 jours, 30 jours, Tous) et scroller la courbe si trop de valeurs pour la même période. Ça permettrait de ne pas avoir que les 30 dernières parties. » La courbe trace donc **toutes** les parties de la période et défile quand elle est trop longue. Cela **remplace** le périmètre 6 et le critère d'acceptation 4 de `request.md` (plafond de 30, mention « 30 dernières parties », U10 sans objet). Le snapshot `request.md` reste tel quel (provenance) ; cette révision fait foi. Questions U4 (base de l'écart sous plafond) devenue sans objet, remplacée par la mécanique de défilement (à instruire par la chaîne d'architecture).
- **U1, U2, U5-U10 → « Planche partout »**, soit : U1(a) habillage de la planche ; U2(a) libellés courts du podium « Moy. · F9 · Volée » ; U5(a) « 21 oct » sans point, année seulement si la courbe franchit un changement d'année (U5b-i), dans l'axe et/ou la lecture comme la planche ; U6(a) état « peu de parties » tel que la planche ; U7 règle d'axe proposée ; U8(b) écarts de tokens imposés par la charte ; U9(a) trait de la planche ; U10 sans objet (plus de mention). ⚠️ Libellé proposé à l'utilisateur pour U2 et U5 : « libellés courts », « 21 oct sans année sauf changement d'année » — à reconfirmer au besoin. Cas que la planche ne dessine pas (une seule partie : place du point, dates, seconde phrase, nom de la courbe, élision « d' ») : **non tranchés, restent questions pour l'utilisateur**. U8 : taille du texte des axes (10 px vs plancher 12 px) non tranchée (aucune option « planche » n'est compatible avec le plancher) : question restante. U11, U12 : restent ouvertes, peuvent attendre la revue.

### Révision 1 — rapport d'`archi-authority` (PASS, relancé par message)

⚠️ `request.md` reste tel quel ; pour le périmètre 6 et le critère 4, **cette révision fait foi** (Test et Revue s'y réfèrent). Le premier rapport tient sans changement hors ce qui suit.

**Domaine (progress.ts)** — peut partir en Dev dès maintenant.
- PROGRESS_WINDOW supprimé : points = toutes les parties de la période avec ≥ 1 fléchette, de la plus ancienne à la plus récente. `total` retiré (= points.length). « Partie N sur M » : N = `number`, M = nombre de points.
- Tendance au rang N ≥ 3 sur les parties N-2..N. Moyenne et First 9 : computeCareerStats (totaux). **Meilleure volée (U3 a) : moyenne arithmétique des trois highestVisit**, seul calcul arithmétique de la série — commentaire ⚠️ et test qui l'épingle (60, 140, 100 → 100, pas 140).
- Base de l'écart = tendance au rang 3 (3 premières parties de la période), même à 80 parties : `trendDelta` = trend(N) − trend(3). Référence pointillée inchangée (computeCareerStats sur la période). L'écart de Meilleure volée peut n'être pas entier : arrondir avant formatage (0 décimale).
- Application et composition inchangées.

**Défilement (UI)**
- Deux SVG à la même échelle dans grid-cols-[25fr_minmax(0,295fr)] : **gouttière** (25 unités, `aria-hidden`, valeurs de l'axe) + **fenêtre** overflow-x-auto overscroll-x-contain contenant le SVG tracé (`role="img"`). Largeur du SVG tracé = 100 × largeurContenu / 295 %, viewBox de hauteur 190, hauteur `auto` : pas de ResizeObserver. Si n ≤ K : contenu de 295 unités, points de x 30 à 310, planche à l'identique, sans défilement (l'état « peu de parties » ne défile jamais). Au-delà de K : pas u = 280 / (K − 1) par point, contenu = 5 + (n − 1)·u + 10.
- Bornes de l'axe vertical sur toute la courbe (points, tendances, pointillé) ; stable pendant le défilement (à confirmer N3).
- Ouverture : useLayoutEffect pose scrollLeft = scrollWidth − clientWidth au montage (clé joueur|période) et au changement de mesure ; instantané (jamais smooth / scrollIntoView), idempotent sous StrictMode. Clavier : défilement minimal via defilementPourMontrer de podium.ts.
- <input type="range"> masqué **hors** de la fenêtre (son focus la ferait défiler) ; gouttière `aria-hidden` ; <output> inchangé ; anneau `focus-within`.
- Risque « pas de défilement horizontal de page » : minmax(0, …), min-w-0 sur la section et ancêtres flex, seule la fenêtre porte overflow-x, overscroll-x-contain. À vérifier en Playwright (360 × 800, 390 × 844, 844 × 390, ~150 parties : documentElement.scrollWidth === clientWidth).
- Décisions appliquées : U1(a) habillage planche ; U2(a) libellés courts « Moy. · F9 · Volée », puces jointives (32 px visibles, appui 48 px), variante de BasculesPodium ; U5 « 21 oct » via table de mois dans labels.ts, année seulement si la courbe entière franchit un changement d'année ; U6(a) planche C ; U7 règle d'axe ; U8(b) tokens ; U9(a) <path d="M2.4 19.2 L8.4 12 L13.2 15.6 L21.6 4.8" strokeWidth={3} strokeLinecap="butt" /> ; U10 sans objet.

**Tests** : progress.test.ts (retrait des tests du plafond ; 80 parties → 80 points numérotés 1..80 ; base de l'écart au rang 3 ; Meilleure volée 100 ; pondéré 40) ; evolution.test.ts (pas et largeur selon n ≤ K / n > K, pourcentage, index depuis la position avec scrollLeft, défilement minimal, bornes sur toute la courbe, dates selon N4) ; statistiquesEvolution.test.tsx (scrollWidth/clientWidth/getBoundingClientRect posés ; ouverture en fin de courbe avec la dernière partie sélectionnée ; clavier fait suivre scrollLeft ; toucher selon N1 ; remises à zéro ; 1 ou 2 parties sans curseur ni fenêtre ; plus aucune mention de plafond). **Critère 4 réécrit** : « N parties donnent N points ; au-delà de K, la courbe défile ; à l'ouverture, la dernière partie est visible et sélectionnée ; numérotation de 1 à N ».

**Charte / docs** : § Composants CarteEvolution (habillage propre, bascules courtes jointives, lecture, gouttière et fenêtre, pas et seuil K, position initiale, geste N1, indicateur N5, état 1-2 parties) ; variante jointive de BasculesPodium ; § Identité treize pictogrammes (evolution : trait 3, bouts plats = exception documentée) ; § carte des impacts (sélecteur pilote cible **et** Évolution) ; § Mouvement (défilement programmé instantané) ; pas de fondu en dégradé au bord. Gravure proposée dans CLAUDE.md : « Meilleure volée : tendance = moyenne arithmétique des 3 meilleures volées (décision de l'utilisateur) ».

**Questions restantes pour l'utilisateur (avant le Dev de l'UI)**
- **N1** glissé sur courbe longue : (a) le glissé fait défiler, l'appui sélectionne (le « glissé qui sélectionne » disparaît quand ça défile ; garder le glissé-sélection quand la courbe tient ? la sélection reste-t-elle sur sa partie, hors de vue ?) ; (b) le glissé sélectionne comme la planche, la vue suit près d'un bord, pas de défilement libre au doigt ; (c) la courbe défile sous un repère fixe, la partie sous le repère est lue (écart à la planche).
- **N2** parties visibles d'un coup : 14 (≈ 20 px/partie, vue A de la planche identique), 20 ou 30 (≈ 9 px, carrés presque jointifs).
- **N3** axe vertical : fixe à gauche pendant le défilement, ou qui défile (valeurs hors de vue à l'ouverture) ; bornes sur toute la courbe, échelle fixe.
- **N4** dates quand ça défile : (a) trois dates de la partie visible, mises à jour ; (b) dates attachées à intervalle régulier qui défilent ; (c) début / milieu / fin de toute la courbe. Quand ça tient : planche.
- **N5** indiquer le défilement : (a) barre native ; (b) rien ; (c) phrase sous la courbe. Fondu exclu.
- **C1** « Planche partout » = libellés complets ne tenant pas au plancher 0,75 rem : retenu libellés courts sur puces jointives — à confirmer. **C2** table de mois (janv, févr, mars, avr, mai, juin, juil, août, sept, oct, nov, déc) et année dans l'axe et dans la lecture — à confirmer.
- **U6** cas d'une seule partie (place du point, dates, seconde phrase, nom de la courbe, élision « d' ») ; **U8** texte d'axe ≈ 10 px (planche) ou ≥ 12 px ; **U11**, **U12** (+ retour instantané en fin de courbe) : peuvent attendre la revue.

Techniques : Dev — boucle de défilement au bord si N1(b) (faux temps), règles a11y Biome sur gestionnaires de pointeur, stroke-* / `fill-*`. Test — débordement de page, gestes système Android / iPhone, TalkBack, fluidité avec ≥ 300 parties, R1. Non vérifiés : `touch-action` sous iOS dans une fenêtre qui défile, comportement du pointercancel (à valider sur téléphone).

### Révision 1 bis — réponses de l'utilisateur (2026-10-22)

- **N1 → (a)** : sur une courbe qui défile, le glissé fait défiler (natif), l'appui sélectionne (pointerup non annulé ; pointercancel = défilement, rien n'est sélectionné). Le glissé-sélection de la demande disparaît quand la courbe défile ; sous-questions (garder le glissé-sélection quand la courbe tient ; sélection hors de vue après défilement) : **non tranchées → à poser (voir plus bas)**.
- **N2 → 14** parties visibles d'un coup (≈ 20 px par partie) : K = 14. Au-delà de 14, la courbe défile.
- **N3 → axe vertical fixe à gauche** (gouttière), bornes sur toute la courbe.
- **N4 → (a)** trois dates (début, milieu, fin) de la portion visible, mises à jour pendant le défilement ; quand la courbe tient : planche.
- **N5 → (a)** barre de défilement native.
- **C1 / C2 → confirmés** : libellés courts « Moy. · F9 · Volée » sur puces jointives ; mois courts (janv, févr, mars, avr, mai, juin, juil, août, sept, oct, nov, déc) ; année dans l'axe et la lecture seulement si la courbe franchit un changement d'année.
- **U6 → point centré, sans 2ᵉ phrase** pour une seule partie : carré au centre, son chiffre et sa date, nom « Courbe de X, une partie », seule la phrase « La tendance apparaît à la 3ᵉ partie ». Élision « d' » et dates du cas 2 parties : suivent la planche (reste à confirmer en revue si elle diverge).
- **U8 → ≈ 10 px comme la planche** pour le texte des axes. ⚠️ **En contradiction avec le plancher de 12 px de la charte et le critère 8 (`typographieBoundary`)** : Dev vérifie si la garde accepte (texte SVG en unités de viewBox) ; si elle refuse ou si la charte l'interdit explicitement, **retour à l'utilisateur**, pas de contournement de la garde.
- **N1 (suite) → appui seul partout** : le glissé ne sélectionne jamais (ni quand la courbe tient), seuls l'appui et le clavier sélectionnent ; le navigateur gère le défilement (`touch-action` par défaut) ; pas de boucle de bord.
- **N1 (suite) → la sélection reste** sur sa partie même hors de vue après un défilement.
- **U11 / U12 → valeurs sobres** : sélecteur renommé « Joueur » si besoin (Dev liste les libellés accessibles dans `02-dev-notes`), écart arrondi à zéro affiché « 0 » sans signe, aucune transition de 0,2 s.

**Gate Architecture : toutes les questions ont une résolution écrite** (U1-U12, N1-N5, C1, C2). Seul point conditionnel : U8 vs `typographieBoundary` (Dev vérifie, retour à l'utilisateur en cas de refus de la garde).
