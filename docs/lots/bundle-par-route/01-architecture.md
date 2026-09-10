# Lot `bundle-par-route` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent `archi`.

## Problème

Le build produit **un seul fichier JavaScript** (514,89 kB minifié / 154,33 kB gzip, au-delà du
seuil d'avertissement natif de Vite). Deux conséquences distinctes, qui ne se règlent pas avec
le même geste :

- **Poids au premier chargement** : ouvrir Dartpéro pour un 501 télécharge aussi le Cricket, le
  Tour du monde, l'entraînement, les statistiques de carrière et la carte des impacts —
  contraire au « zéro friction au démarrage » du cadrage.
- **Invalidation totale à chaque déploiement** : le nom de fichier est un hash de *tout* le
  contenu. Un simple libellé changé dans `src/ui/labels.ts` rehash le fichier entier → le
  cache `max-age=31536000, immutable` posé sur `/assets/**` (`CLAUDE.md` § Déploiement) ne
  protège plus rien, et chaque visiteur retélécharge 515 kB après chaque lot, pas seulement
  après une refonte.

**Ce que ce lot ne peut pas réparer** : `ServicesProvider` appelle `createBrowserServices()` dès
le montage, donc `src/composition/container.ts` et tout `src/core`/Dexie chargent dès la
première ligne — légitime, la page d'accueil doit pouvoir proposer « reprendre la partie »
immédiatement. Le découpage par route ne déplace donc que du `src/ui` (~4 500 lignes sur
7 200). Estimation d'`archi`, non mesurée : 60-90 kB quittent l'entrée, sous le seuil des
500 kB mais de peu — la mesure réelle est renvoyée à Dev (Q2 ci-dessous).

## Options considérées

| # | Option | Pour | Contre | Verdict |
|---|---|---|---|---|
| A | `React.lazy()` par écran de route, dans `src/App.tsx` seulement | 15 lignes, un seul fichier, zéro risque architectural | Les 4 modes de jeu restent groupés dans le chunk de `PartieEcran` (ouvrir un 501 charge le Cricket) ; ne règle qu'à moitié l'invalidation, le chunk d'entrée garde vendor + `src/core` | Insuffisante seule |
| B | A + découpage par mode dans `PartieEcran.tsx` | Épouse la couture `GameMode` — chaque mode a déjà son écran, il gagne son chunk ; toucher Cricket n'invalide plus le X01 | 8 `lazy()` de plus, un `Suspense` de plus dans l'aiguilleur | **Retenue** |
| C | `manualChunks` / vendor splitting seul | Isole ~350-400 kB de `node_modules` qui ne bougent qu'aux montées de version — règle le vrai coût du retéléchargement à chaque déploiement | Ne réduit pas le premier chargement, n'isole pas les modes entre eux | **Retenue, combinée à B** |
| D | Migrer vers `createBrowserRouter` + la propriété `lazy` des routes React Router | Voie native RR, `useNavigation` pour un vrai état de navigation | Refonte de `src/main.tsx` et de `tests/ui/renderWithServices.tsx` (`MemoryRouter` → `createMemoryRouter`), donc de la façon dont tous les tests UI montent l'app — pour un gain de découpage identique à B | **Rejetée** |
| E | Relever `build.chunkSizeWarningLimit` | Fait taire l'avertissement | Ne règle rien du défaut réel (poids, invalidation) | **Rejetée explicitement**, pour qu'elle ne revienne pas par la petite porte |

A, B et C se combinent sans se recouvrir : B/A agissent sur *ce qu'on télécharge la première
fois*, C sur *ce qu'on retélécharge à chaque déploiement*.

## Approche retenue

**B + C.** Le Goal suggérait de ne garder un vendor splitting que si le découpage par route ne
suffisait pas à faire passer le chunk principal sous le seuil d'avertissement de Vite ;
`archi` écarte ce critère parce qu'il mesure l'avertissement, pas le défaut décrit — B seul ne
règle pas le retéléchargement intégral à chaque déploiement (le chunk d'entrée contient encore
vendor + `src/core`, et rehash à la moindre correction de libellé). C n'ajoute qu'un groupe et
quatre lignes de config : ce n'est pas le « `manualChunks` manuel sophistiqué » que le Goal
écarte. Si Dev constate un conflit avec l'alias anti-« deux React » du `vite.config.ts`
existant, il retire C et garde B seul (voir Q3).

### Frontières lazy

**`src/App.tsx`** — 8 des 9 routes passent en `lazy()` ; `AccueilEcran` reste statique (c'est
le `start_url` du manifeste, la route par défaut **et** le fourre-tout `*` — la rendre lazy
ajouterait une cascade sur le geste le plus fréquent de l'app pour ~3 kB) :
`JoueursEcran`, `StatistiquesEcran`, `HistoriqueEcran`, `ReglagesEcran`, `NouvellePartieEcran`,
`LancerEntrainementEcran`, `PartieEcran`, `ResumePartieEcran`.

**`src/ui/ecrans/games/PartieEcran.tsx`** — les 8 écrans de mode passent en `lazy()`, un chunk
par mode : `X01Ecran`/`ResumeX01Ecran`, `TourDuMondeEcran`/`ResumeTourDuMondeEcran`,
`CricketEcran`/`ResumeCricketEcran`, `EntrainementEcran`/`ResumeEntrainementEcran`. La forme
actuelle de `Aiguillage` (écrans passés en `ReactNode`) reste valable telle quelle :
`React.lazy` ne déclenche l'`import()` qu'au rendu effectif, pas à la création de l'élément —
aucune restructuration de l'aiguilleur.

⚠️ Piège vérifié par `archi` : `React.lazy` attend un module à export **default**, et tous les
écrans du projet exportent en **nommé**. Forme obligatoire, déclarée au niveau module (jamais
dans le corps d'un composant) :

```ts
const X01Ecran = lazy(() => import('./x01/X01Ecran').then((m) => ({ default: m.X01Ecran })))
```

### Suspense et fallback

Aucun nouveau composant : `src/ui/composants/commun/Etats.tsx` a déjà `Spinner` et
`SpinnerLigne`, et ce sont précisément les états que les écrans affichent déjà pendant leurs
propres requêtes — la coupure lazy ne s'ajoutera pas visuellement à un état de chargement déjà
là.

- `src/App.tsx` : `<Suspense fallback={<Spinner />}>` autour de `<Routes>`.
- `src/ui/composants/commun/LayoutPrincipal.tsx` : `<Suspense fallback={<SpinnerLigne />}>`
  autour de `<Outlet />` — **pas** `Spinner` ici, son `min-h-dvh` pousserait
  `NavigationBasse` puis la ferait remonter d'un coup.

`react-router@8` enveloppe ses navigations dans `React.startTransition`, donc React garde
l'écran précédent affiché pendant qu'un chunk arrive : le fallback n'apparaît qu'au premier
rendu d'une URL ouverte directement (lien profond, PWA relancée sur `/partie/x`) — cas déjà
suivi du même visuel, aucun clignotement à craindre. Contrepartie assumée : sur un chunk non
encore en cache, le tap peut sembler sans effet quelques centaines de ms sans indicateur — en
usage réel (PWA installée, tout précaché), c'est une lecture de Cache Storage. Point à
regarder à l'écran (Q9), pas à corriger par anticipation.

### Précache workbox et hors ligne

`globPatterns: ['**/*.{js,css,html,svg,png,woff2}']` balaie `dist/` : les nouveaux chunks sont
précachés **automatiquement**, sans changement de config. L'app doit rester utilisable hors
ligne dès la première visite, y compris sur un mode jamais ouvert — invariant central du
projet, seul point qui pourrait invalider le lot s'il tombait. **À vérifier sur le manifeste
réel après build, pas déduit** (Q8).

### Cache Firebase

`chunkFileNames` vaut par défaut `assets/[name]-[hash].js` : les chunks lazy sont hachés et
tombent dans `/assets/`, donc sous la règle `immutable` existante. **Aucun changement dans
`firebase.json`.**

### Le piège introduit par le lazy : SW `autoUpdate` + chunk disparu

Aujourd'hui, un déploiement pendant qu'une page reste ouverte est inoffensif (tout le JS est
déjà en mémoire). Avec des routes lazy, `dist/sw.js` fait `skipWaiting()` + `clientsClaim()` +
`cleanupOutdatedCaches()`, et `dist/registerSW.js` ne recharge pas la page : après un
déploiement, le nouveau SW purge l'ancien précache sous un onglet resté ouvert sur l'ancien
code, et le prochain `import()` vers un chunk qui n'existe plus ni en cache ni sur Firebase
échoue (`Failed to fetch dynamically imported module`) — écran mort. Mitigation retenue dans le
périmètre (Q4) : un écouteur `vite:preloadError` dans `src/main.tsx`, qui recharge une seule
fois (garde-fou en `sessionStorage` pour ne pas boucler si le rechargement échoue aussi).

### Le groupe vendor (Vite 8 / Rolldown)

⚠️ Vite 8 tourne sur Rolldown : `manualChunks` et `advancedChunks` y sont **dépréciés**.
L'option vivante, dans `vite.config.ts` :

```ts
build: {
  rollupOptions: {
    output: {
      codeSplitting: { groups: [{ name: 'vendor', test: /node_modules/ }] },
    },
  },
},
```

Effet attendu (non mesuré, Q2) : un `vendor-<hash>.js` de ~350-400 kB qui ne change qu'aux
montées de version, et un chunk d'entrée réduit au shell + `src/core`. Si le groupe pose
problème (Q3), repli sur B seul.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | Aucun | — |
| `core/application/` | Aucun | — |
| `infrastructure/` | Aucun | — |
| `ui/` | `src/App.tsx`, `src/ui/ecrans/games/PartieEcran.tsx`, `src/ui/composants/commun/LayoutPrincipal.tsx` | Imports statiques → `lazy()` (16 écrans au total) + 2 `<Suspense>` avec les fallbacks existants (`Spinner`, `SpinnerLigne`) |
| `composition/` | Aucun | — |
| amorçage | `src/main.tsx` | Écouteur `vite:preloadError` (rechargement unique, garde-fou `sessionStorage`) |
| build | `vite.config.ts` | `build.rollupOptions.output.codeSplitting.groups` (vendor) — API Rolldown, pas `manualChunks` |
| `tests/` | `tests/architecture/` (nouveau test ou extension) | Garde anti-régression : aucun import statique d'écran dans `App.tsx`/`PartieEcran.tsx`, plancher de `lazy()` |

**Sens des dépendances vérifié :** `ui`/`infrastructure` → `application` → `domain`, inchangé —
un `import()` dynamique ne franchit aucune frontière que l'import statique ne franchissait pas.
**Nouveau port ?** Aucun — lot entièrement en périphérie (routage, build), aucune capacité
externe nouvelle.

⚠️ Pour Test : `tests/architecture/hexagonalBoundary.test.ts` lit les imports par regex sur
`from '…'` — un `lazy(() => import('…'))` n'y est pas vu par la regex existante. Sans
conséquence sur ce test (les écrans n'importent pas d'adapters), mais la nouvelle garde (Q7)
doit être écrite spécifiquement pour ce lot, pas supposée couverte par la garde existante.

## Décisions de `CLAUDE.md` concernées

**Invoquées, respectées sans modification** : stack frontend figée (React 19 + Vite, aucune
dépendance ajoutée) ; PWA 100 % locale et hors ligne (invariant à prouver, pas seulement
préserver — critère de refus du lot s'il tombe) ; § Déploiement, en-têtes de cache (validé sans
toucher `firebase.json`) ; Wake Lock (non touché, les écrans de jeu restent montés pareil).

**À graver à la fin du lot** (pas une décision structurante — ne contraint ni le produit ni le
domaine — mais trois notes courtes, sinon invisibles) :
1. `CLAUDE.md` § Déploiement : le bundle est découpé par route, chunks lazy hachés donc
   couverts par `/assets/**` et précachés par `globPatterns` ; un écran ne se réimporte jamais
   statiquement dans `App.tsx`.
2. `CLAUDE.md` § Notes techniques : en Vite 8 / Rolldown, `manualChunks`/`advancedChunks` sont
   dépréciés, l'option est `output.codeSplitting.groups`.
3. `.claude/CONVENTIONS.md` § 13 (ajouter un mode de jeu) : un mode ajoute aussi son `lazy()`
   dans `PartieEcran` — sinon il revient discrètement dans le chunk commun.

Si l'écouteur `vite:preloadError` est conservé (Q4, retenu), une ligne de plus en Notes
techniques expliquant pourquoi (SW `autoUpdate` qui purge les anciens chunks sous un onglet
ouvert).

## Questions ouvertes — résolues au gate check

| # | Question | Origine | Résolution |
|---|---|---|---|
| 1 | `vitest` tourne en `pool: 'vmForks'` (contournement d'un bug Vite 8/Windows) — les `import()` dynamiques y fonctionnent-ils ? | Archi | **Assigné à Dev, premier geste avant de dérouler les 16 `lazy()`** : une seule route lazy, lancer les tests UI ciblés, valider avant de continuer. Si ça bloque : remonter avant de poursuivre (pourrait déclencher la boucle Dev→Archi si le pool vitest ne supporte pas les imports dynamiques — refonte nécessaire), pas à contourner en désactivant des tests. |
| 2 | Mesure avant/après de la taille des chunks | Archi | **Assigné à Dev** : reporter dans `02-dev-notes.md` la table des chunks (nom, kB min, kB gzip) avant/après, et si l'avertissement Vite (>500 kB) a disparu. Sans ce chiffre le lot n'est pas démontré — **Test revérifiera indépendamment** (repris en plan de test). |
| 3 | Le groupe vendor (option C) peut-il raviver le bug « deux React » que les alias de build corrigent ? | Archi | **Repli déjà écrit dans l'approche retenue** : `npm run smoke` existant est le filet. S'il échoue avec le groupe vendor, Dev retire le groupe et garde le découpage par route seul (option B) — le lot reste valable, à documenter dans les écarts si ça arrive. Non bloquant. |
| 4 | L'écouteur `vite:preloadError` (mitigation SW `autoUpdate` + chunk disparu) est-il dans le périmètre du lot ? | Archi | **Retenu dans le périmètre**, tranché par l'Orchestrator : c'est la conséquence directe et nécessaire du découpage en routes lazy sous un SW `autoUpdate` — l'écarter laisserait un risque d'écran mort après déploiement, contraire à l'invariant « hors ligne fiable » de `CLAUDE.md`. Quatre lignes, dans `src/main.tsx`. |
| 5 | `AccueilEcran` reste-t-il statique ? | Archi | **Confirmé** par l'Orchestrator, suit la recommandation d'Archi (route par défaut + fourre-tout `*`, poids marginal). Si Dev mesure un poids plus élevé que prévu au build, le signaler comme écart — pas un blocage a priori. |
| 6 | Les 9 fichiers de tests UI existants passent-ils sans modification ? | Archi | **Repris tel quel pour Test** (§ plan de test) — c'est le vrai critère de non-régression. Si un test doit être retouché, Test le documente comme signal, pas comme formalité. |
| 7 | Garde anti-régression contre le retour d'un import statique d'écran | Archi | **Repris tel quel pour Test** : nouveau test d'architecture, imports statiques d'écrans interdits dans `App.tsx`/`PartieEcran.tsx`, plancher de `lazy()` (≥ 8 par fichier) pour éviter une regex cassée qui rendrait le test vert à vide (réflexe de `CONVENTIONS.md` § 11). |
| 8 | Vérification de l'invariant hors ligne après le découpage | Archi | **Repris tel quel pour Test** : manifeste `dist/sw.js` doit lister chaque `assets/*.js` après build ; puis relecture à l'écran (`npm run preview`, DevTools hors ligne) sur les 4 modes + statistiques + historique, y compris un mode jamais visité avant la coupure. |
| 9 | Relecture à l'écran du chargement (fallback plein écran vs en ligne, pas de saut de layout, pas de double état de chargement visible) | Archi | **Actée**, à faire par Test (ou délégué à Revue) avant le second arrêt — dans la continuité de Q8, mêmes gestes à l'écran. |
| 10 | Doublons `includeAssets`/`globPatterns` (candidat 7 de l'audit), visibles en lisant le manifeste | Archi | **Confirmé hors périmètre.** Si Dev le croise en lisant le manifeste pour Q8, le constater sans corriger — reste un candidat d'audit séparé. |

Toutes les questions produites par cette phase ont une résolution écrite ci-dessus : statut
Architecture → **Faite**, aucun blocage ouvert. Aucune n'a nécessité l'utilisateur — toutes
techniques et tranchables sur la base du rapport `archi`.

## Révisions

> Ajoutées par les boucles 2 et 5. Ne jamais effacer la version précédente.

Aucune à ce stade.
