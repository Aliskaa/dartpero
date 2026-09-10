# Lot `bundle-par-route` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test`, revérifié directement
> (`git status`/`git diff --stat`, `npm test`, lecture du test de garde créé).

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Non applicable | Aucune ligne de `core/` modifiée — lot de build/routage pur |
| Use cases | Non applicable | Idem |
| Infrastructure | Non applicable | Idem |
| UI | Oui, indirectement | Les 9 suites `tests/ui/` existantes valident déjà que le rendu ne change pas de comportement sous `Suspense` — non modifiées, toutes vertes |
| Architecture (gardes) | Oui, nouvelle garde | `tests/architecture/lazyRoutes.test.ts` (5 cas) — voir détail ci-dessous |

**Hors périmètre :** aucun changement de règle de jeu (rien à tester à ce niveau). Le doublon
`includeAssets`/`globPatterns` du manifeste (candidat 7 de l'audit) n'est pas corrigé, seulement
reconstaté avec un chiffre plus précis que Dev (5 paires, pas 2 — voir Bugs trouvés).

**Angles morts assumés :** le rechargement automatique sur `vite:preloadError` n'a pas été
testé en conditions réelles de déploiement (nécessiterait deux versions de build servies
successivement sous le même service worker) — vérifié par lecture de code uniquement, par Dev
et par Test. Pas de test sur iPhone/Safari réel ni sur réseau mobile réel (hors périmètre du
lot).

## Cas de test

| # | Cas | Type | Résultat |
|---|---|---|---|
| 1 | `npm run lint` / `npm run typecheck` / `npm test` revérifiés indépendamment | non-régression | Verts — 339/339 tests, 33 fichiers |
| 2 | Garde d'architecture : aucun des 8 écrans de route importé statiquement dans `App.tsx` | bord | Vert |
| 3 | Garde d'architecture : ≥ 8 `lazy(() => import(` dans `App.tsx` | bord | Vert |
| 4 | Garde d'architecture : aucun des 8 écrans de mode importé statiquement dans `PartieEcran.tsx` | bord | Vert |
| 5 | Garde d'architecture : ≥ 8 `lazy(() => import(` dans `PartieEcran.tsx` | bord | Vert |
| 6 | Mutation : réintroduction d'un import statique (`JoueursEcran`, `X01Ecran`) → la garde échoue bien | preuve « pas vert à vide » | Échec confirmé, puis restauration vérifiée |
| 7 | Manifeste `dist/sw.js` après build : tous les chunks `assets/*.js` précachés | chemin heureux | 47 entrées précache, 27 chunks, 0 manquant |
| 8 | Navigation vers un écran jamais chargé (`/statistiques`) : pas de saut de la barre de navigation basse | à l'écran | Position `<nav>` identique avant/pendant/après |
| 9 | Chunk ralenti artificiellement : pas de double état de chargement visible | à l'écran | Navigation client : aucun fallback (React garde l'écran précédent). Lien profond (`/partie/:id`, route hors `LayoutPrincipal`) : **trois fallbacks en séquence**, pas un seul — `Spinner` plein écran (chunk `PartieEcran`, Suspense d'`App.tsx`) → `Spinner` « Chargement de la partie… » (le `useMode` interne en attente) → `SpinnerLigne` (chunk du mode) → l'écran. Revérifié par un test déterministe (mock différé du chunk `X01Ecran` via `vi.hoisted`, sans dépendre d'un délai réel) : chaque étape isolée et distinguée par sa classe (`min-h-dvh` vs `py-8`) et son libellé. **Aucun flash blanc** (fond `--color-feutre` constant), mais **il y a bien un saut visuel** entre l'étape 2 et l'étape 3 — le `Spinner` plein écran (`min-h-dvh`, centré) cède la place au `SpinnerLigne` compact (`py-8`, en haut de la zone de contenu), un déplacement d'environ 380 px sur un écran de 844 px. Cosmétique en usage réel (chunk précaché, transition de l'ordre de 100 ms), mais l'affirmation initiale « aucun saut de mise en page » était fausse pour ce cas précis — relevé par la Revue (2ᵉ passage, constat 3), corrigé ici le 2026-09-10 au lieu d'être reformulée sans être vérifiée une seconde fois |
| 10 | Hors ligne réel (SW actif, `context.setOffline(true)`) : Statistiques + Historique + 3 modes jamais ouverts (Tour du monde, Cricket, Entraînement) accessibles et fonctionnels via l'UI | invariant central du projet | Tous fonctionnels, écriture IndexedDB offline confirmée, 0 erreur JS/console |
| 11 | X01 vérifié en ligne en complément | chemin heureux | OK |

Le cas n°10 est le plus important du lot : c'est la preuve directe qu'un chunk jamais
téléchargé par le navigateur avant la coupure réseau est bien servi par le précache workbox —
l'invariant « 100 % local, hors ligne » que ce lot aurait pu casser silencieusement.

## Résultats (revérifiés directement par l'Orchestrator)

| Commande | Résultat |
|---|---|
| `npm run lint` | Vert — 199 fichiers (198 + le nouveau test), 0 erreur |
| `npm run typecheck` | Vert |
| `npm test` | Vert — **339/339 tests, 33 fichiers** (334 + 5 nouveaux, revérifié indépendamment par l'Orchestrator) |
| `npm run build` | Vert — chunk d'entrée 61,06 kB (confirmé), `vendor` 362,63 kB isolé |

`git status`/`git diff --stat` revérifiés par l'Orchestrator **après** l'incident de mutation
de Test (voir ci-dessous) : diff identique à celui vérifié après Dev (127 insertions/42
suppressions sur les 5 mêmes fichiers `src/` à ce moment-là — passé à 133/42 après le correctif
`try`/`catch` de `src/main.tsx`, tour de boucle suivant), plus le nouveau fichier
`tests/architecture/lazyRoutes.test.ts` non suivi. Aucune perte, aucune dérive.

Fichier créé par `test` : `tests/architecture/lazyRoutes.test.ts` (+5 tests). Aucun fichier
`src/` touché par Test.

## Incident de méthode (non un bug produit)

Pendant la mutation de preuve (cas n°6), `test` a restauré `src/App.tsx` via
`git checkout -- src/App.tsx`, ce qui a écrasé le patch **non commité** de Dev (retour à HEAD,
donc à l'état pré-lot). Rattrapé immédiatement via une sauvegarde manuelle prise par précaution
avant la mutation. **Revérifié par l'Orchestrator** : `git diff --stat` après coup identique à
la mesure prise juste après la phase Dev, et lecture des 20 premières lignes de `App.tsx`
conforme. Aucune perte finale. Noté ici pour que la méthode ne se répète pas : sur un lot dont
les fichiers ne sont pas encore commités, une restauration après mutation de test doit passer
par une sauvegarde manuelle, jamais par `git checkout --` (qui reviendrait au dernier commit,
pas à l'état du lot en cours).

## Bugs trouvés

| # | Bug | Classement | Renvoi |
|---|---|---|---|
| 1 | Doublons de précache dans `dist/sw.js` : 5 paires (favicon, apple-touch-icon, 3 icônes), un chiffre plus précis que les 2 rapportées par Dev | Hors périmètre confirmé (candidat 7 de l'audit, pas de ce lot) | Aucun — à verser au vivier d'audit existant |

Aucun bug d'implémentation trouvé dans le périmètre de ce lot.

## Questions ouvertes

Aucune — Q6, Q7, Q8, Q9 (assignées par `01-architecture.md`/`02-dev-notes.md`) toutes traitées
avec un résultat écrit ci-dessus.

## Retour Revue (2026-09-10) — deux renvois Test + revérification du correctif Dev

La Revue a renvoyé deux constats directement à Test (verdict global : Go, 3 retouches
mineures), et Dev a livré séparément un correctif sur `src/main.tsx`. Les trois ont été
revérifiés dans cette même passe.

**Constat 2 — plancher manquant sur `IMPORT_STATIQUE`.** L'en-tête du test affirmait un
plancher contre une regex cassée, mais il ne portait que sur `LAZY_IMPORT`
(`nombreDeLazy > 0`) : si `IMPORT_STATIQUE` se cassait, `nomsImportesStatiquement` renvoyait
toujours `[]`, et les deux tests « n'importe jamais statiquement » passaient au vert à vide.
Corrigé en ajoutant, dans le test « analyse réellement les fichiers vérifiés »,
`expect(nomsImportesStatiquement(appSource)).toContain('AccueilEcran')` — le seul écran resté
volontairement statique dans `App.tsx`, donc un témoin garanti présent.

Preuve (mutation-restauration, **sans `git checkout --`** cette fois — sauvegarde manuelle du
fichier avant mutation, restauration depuis cette copie, vérifiée par `diff`) :
- Regex `IMPORT_STATIQUE` cassée (remplacée par un motif qui ne matche jamais) → le nouveau
  test échoue bien (`AssertionError: expected [] to include 'AccueilEcran'`), **et** les deux
  tests « n'importe jamais statiquement » restent verts pendant ce temps — la preuve directe du
  vert-à-vide que le plancher corrige.
- Restauration depuis la sauvegarde manuelle → `diff` contre la copie pré-mutation montre
  **uniquement** l'ajout de l'assertion, rien perdu.
- Suite complète revérifiée après restauration : lint / typecheck / `npm test` verts,
  **339/339** (aucun test supplémentaire, c'est une assertion ajoutée à un test existant).

**Constat 3 — cas n°9 du plan de test était faux sur le lien profond.** Le plan affirmait « un
seul fallback continu (`SpinnerLigne`) » sur `/partie/:id`. Faux : cette route est hors
`LayoutPrincipal`, donc le `<Suspense fallback={<Spinner />}>` plein écran d'`App.tsx`
s'affiche en premier (chunk `PartieEcran`), puis le `useMode` interne (React Query, en
attente dès le premier rendu) affiche un second `Spinner` plein écran avec le libellé
« Chargement de la partie… », et seulement ensuite le `SpinnerLigne` du chunk de mode.

Revérifié par un test déterministe (non conservé dans le dépôt — vérification ponctuelle,
pas une garde permanente) : le chunk `x01/X01Ecran` est mocké via `vi.mock` + `vi.hoisted`
pour retenir sa résolution sur une promesse contrôlée à la main (pas un délai réel — évite la
fragilité d'un test chronométré). Trois étapes distinguées sans ambiguïté par leur classe
(`min-h-dvh` = `Spinner` plein écran vs `py-8` = `SpinnerLigne`) et leur libellé :
1. Juste après `render()`, avant tout microtask : `.min-h-dvh` présent, libellé « Chargement
   de la partie… » absent → c'est bien le `Spinner` générique d'`App.tsx`, pas encore
   `Aiguillage`.
2. Après résolution du chunk `PartieEcran` : libellé « Chargement de la partie… » présent,
   `.min-h-dvh` toujours présent, `.py-8` absent → toujours un `Spinner` plein écran, pas
   `SpinnerLigne`.
3. Après résolution du `useMode` (mode X01 connu) mais chunk `X01Ecran` toujours retenu :
   `.py-8` présent, `.min-h-dvh` absent, libellé « Chargement de la partie… » absent → bien
   `SpinnerLigne`, pas le `Spinner` plein écran.
4. Promesse relâchée → l'écran final apparaît (`Score restant de Kevin` = 501).

Séquence confirmée exactement conforme à ce que la Revue décrivait. Le cas n°9 dans le tableau
ci-dessus a été réécrit en conséquence. Aucun saut de mise en page ni flash blanc entre les
trois étapes (confirmé au tour précédent, non remis en cause par la Revue) — ce point reste
valable : chaque étape est un remplacement complet du contenu, pas une superposition.

**Correctif Dev — `try`/`catch` autour de `sessionStorage` dans `src/main.tsx`.** Diff
revérifié caractère pour caractère contre le fichier réel : identique à celui annoncé. Le pire
cas si `sessionStorage` lève à la lecture (navigation privée sur certains navigateurs) devient
une boucle de rechargement au lieu d'une exception non interceptée qui bloquerait le filet
`vite:preloadError` — cohérent avec le commentaire ajouté. `git diff --stat` confirme que
**seul** `src/main.tsx` a changé par rapport à l'état connu au tour précédent (`App.tsx`,
`LayoutPrincipal.tsx`, `PartieEcran.tsx`, `vite.config.ts` inchangés depuis). Sain.

**Revérification complète** : `npm run lint` (199 fichiers, 0 erreur), `npm run typecheck`
(vert), `npm test` (**339/339 tests, 33 fichiers**, revérifié deux fois dans cette passe — une
fois avant les corrections, une fois après).
