# Lot `regles-du-jeu` — plan de test

## Passe 1 (2026-10-16)

Sous-agent `test` lancé en **opus** (effort `high` du frontmatter). ⚠️ Il n'a pas eu de shell
dans sa session (Read, Grep, Glob seulement) : analyse **statique**. Les commandes et les
contre-épreuves ont été lancées ensuite **par l'Orchestrator**, résultats ci-dessous.

### Commandes (Orchestrator)

| Commande | Résultat |
|---|---|
| `npm run lint` | 284 fichiers, aucune correction, 0 erreur |
| `npm run typecheck` | 0 erreur |
| `npx vitest run` | **67 fichiers, 1158 tests verts** |
| `npm run build` | OK, précache 49 entrées (855,82 KiB) |

### Contre-épreuves (Orchestrator)

Script : modification, test ciblé, restauration **octet pour octet** ; `git diff` identique avant
et après (vérifié).

| Mutation | Test | Résultat |
|---|---|---|
| M1 `checkout.ts` garde → `remaining < 2` | `checkout.test.ts` | **Rouge** (4 échecs) |
| M2 `FREE_OUT_NO_FINISH` sans 163 | `checkout.test.ts`, `reglesDuJeu.test.tsx` | **Rouge** (2) |
| M3 `Tableau.tsx` → `resteAffiche <= 170` | `reglesDuJeu.test.tsx` | **Rouge** (6) |
| M4 `useX01.ts` borne → `180` en dur | `reglesDuJeu.test.tsx` | **Rouge** (3) |
| M7 `useFeuilleRegles.ts` ouverture en `replace: true` | `reglesDuJeu.test.tsx` | **Rouge** (6) |
| M5 `useFeuilleRegles.ts` fermeture → `navigate(location, { replace: true })` | `reglesDuJeu.test.tsx` | **Rouge** (2) — ⚠️ peut échouer par `location` hors de portée plutôt que par le fantôme |

Non lancées, prévues **vertes à tort** par le Test (trous C2, C3) : M8 (inverser `doubleOut` /
`doubleIn` dans `reglesDuJeu.ts`), M9 (retirer `text-craie-3-regles` dans `FeuilleRegles`). M6
(retirer `onClose`) : rouge à la dernière assertion seulement.

### Traçabilité critère → tests

| # | Tests | Trou |
|---|---|---|
| 1 | `nouvellePartie.test.tsx:1077` (4 jeux, absence de « Les règles en entier » `:1088`) ; `reglesDuJeu.test.tsx:377` `it.each(GAME_MODE_IDS)` | — |
| 2 | `reglesDuJeu.test.tsx:377` (URL) ; `:393` (volée 481 → 461, croix et retour) ; `:510` (étape 2) | Volée au X01 seulement (faible) |
| 3 | `:415` (retour ferme, second quitte) ; `:429` (pas de fantôme après la croix) ; `:442` (fermeture native) | Match seulement, pas l'étape 2 (C4) |
| 4 | `:470` ; `manches.test.tsx:107` | — |
| 5 | Unitaires `contenuRegles` `:101`, `:131`, `:138`, `:152`, `:169`, `:191`, `:216` ; intégration `:510` (X01 sortie) | Câblage `reglesDeLaConfig*` / `reglesDeLaFiche` non vérifié à l'écran (C2) |
| 6 | `:101`, `:122` (Q1), `:191`, `:256` (ni « leg » ni « best of »), exemples rejoués `:277-341` | Pas de comparaison intégrale à la planche (C5) ; comparaison manuelle du Test : identique hors Q1 |
| 7 | `checkout.test.ts:98`, `:102`, `:106` ; `checkoutRange.test.ts:22` ; `checkoutPractice.test.ts:44` | `null` sur un double vert même sans la garde (C8, info) |
| 8 | `checkout.test.ts:112` (1-180), `:71` (2-170) ; `reglesDuJeu.test.tsx:535`, `:541`, `:549` ; `x01.test.tsx:169` | — |
| 9 | `:387`, `:457` | — |
| 10 | Commandes ci-dessus | — |

Vérifié en statique par le Test : S1 (`checkout.ts:107`) ; `BOGEY_NUMBERS` inchangé ;
`FREE_OUT_NO_FINISH` recalculé à la main, identique ; entraînement inchangé ; D10 (`:185`) ; Q1
(`labels.ts:1163`, `:1294`, `:1326`) ; DV4 (`labels.ts:1524`, test `:212-213`). Réécriture de
`CLAUDE.md` § Règles du jeu fidèle au code, aucune règle changée hors périmètre.

### Constats

| # | Sév. | Classe | Constat | Preuve | Renvoi |
|---|---|---|---|---|---|
| C1 | Basse | **Bug d'implémentation** | `enFermeture` n'est remis à `false` que dans `ouvrir()` : après retour puis « suivant » (ou glissé avant iOS), la croix ne fait plus rien ; Échap ferme la boîte mais la location garde le drapeau (boîte montée fermée, livre bloqué actif). | `useFeuilleRegles.ts:40,45,51` | **Dev** (boucle 1) : remise à zéro sur changement de `location.key` ou à l'entrée en état ouvert + test « suivant puis croix » |
| C2 | Moy.-basse | Trou de test | Câblage `reglesDeLaConfig*` / `reglesDeLaFiche` (Cricket, entraînement, Tour du monde) non vérifié par le texte affiché ; M8 survivrait | `reglesDuJeu.ts:87-147` | **Dev** (écrit les tests) |
| C3 | Basse | Trou de test | Gris / laiton / rouge vérifiés sur les drapeaux de données, jamais par classe dans le DOM ; M9 survivrait | `FeuilleRegles.tsx:59-60,72,80,92-94,166` | **Dev** |
| C4 | Basse | Trou de test | Critère 3 à l'étape 2 (retour ferme, second ramène à l'étape 1) non testé | `reglesDuJeu.test.tsx:509-531` | **Dev** |
| C5 | Basse | Trou de test | « Mot pour mot » vérifié par extraits ; rien n'empêche une dérive | `labels.ts:1118-1374`, `:1398-1615` | **Dev** : texte de la planche recopié dans le test |
| C6 | Info | Écart de documentation | `CLAUDE.md` : First 9 « 9 premières fléchettes » (code : 3 premières volées) ; Tour du monde « même nombre de fléchettes » (feuille et code : volées) | `CLAUDE.md:320`, `:205` ; `stats.ts:133` ; `labels.ts:1681,1744` | **Utilisateur → tranché** : aligner `CLAUDE.md` sur le code (Dev) |
| C7 | Basse | Revue / a11y | `<header>` imbriqué : la boîte vit dans le DOM du bandeau / de `EnTeteEtape` ; mesure paysage par `closest('header')` | `FeuilleRegles.tsx:332` ; `DispositionPartie.tsx:57` ; `EnTeteEtape.tsx:47` ; `LivreRegles.tsx:44` | Revue |
| C8 | Info | — | La garde `< 2` sur un double n'est pas protégée en propre (comportement protégé) | `checkout.ts:107` ; `checkout.test.ts:102` | — |
| C9 | Basse | Revue | Tour du monde « En bref » écrit le parcours en dur, « Ce soir » et la grille lisent `config.targets` | `labels.ts:1639-1649` | Revue |
| C10 | Basse | Test / env. | `gestes.ts` garde `location` / `naviguer` au niveau du module : une sonde oubliée lirait la location du test précédent | `tests/ui/gestes.ts:23-42` | **Dev** |

DV6 (contraste, calcul à la main) : clair — `rouge-texte` ≈ 6,5:1 sur ardoise, 4,2:1 sur
`feutre-nuit` ; `vert-texte` ≈ 5,8 / 3,7:1 ; `laiton-texte` ≈ 7,5 / 4,8:1 ; `craie-3-regles` ≈
4,7:1 sur `feutre-nuit`. Sombre — rouge ≈ 7,1, vert ≈ 6,2, `craie-3-regles` ≈ 6,4:1. Rouge et
vert ne sont posés que dans le corps (`bg-ardoise`) : **aucune violation**, mais aucune garde ne
l'empêcherait demain.

### Angles morts (relecture à l'écran)

Retour Android réel (CloseWatcher, R1), entrée sautée par Chrome (R2), iOS (glissés retour et
avant, PWA installée) ; `top-[210px]` sur petit téléphone ; paysage 46 % / 21 rem et mesure du bas
du bandeau (une seule fois, pas au redimensionnement) ; styles `dialog:modal` ; zones de sécurité ;
`overscroll-contain` sous iOS ; **troncature à 360 px** (sous-titre X01 à 164/164 px à 390, sans
marge ; titre `h1` de l'étape 2 « TOUR DU MONDE », « ENTRAÎNEMENT ») ; contraste réel ; mouvement
sous `prefers-reduced-motion` ; lecteur d'écran.

### Questions ouvertes

- Sécurité (DV7) : `history.state` ne porte que `regles: true` en plus de l'état existant
  (`useFeuilleRegles.ts:46-47`) ; aucun `dangerouslySetInnerHTML` dans `src/ui`.
- Revue : C7, C9, DV8.
- Utilisateur : C6 → **tranché** (aligner `CLAUDE.md`).

### Gate

C1 (bug) et C2-C5, C10 (tests) → **boucle 1, Test → Dev, tour 1**, avec l'alignement C6.

## Passe 2 — après la boucle 1, tour 1 (2026-10-16)

Le Dev a corrigé C1 (`useFeuilleRegles.ts` : `enFermeture` remis à `false` à chaque changement de
`location.key`), ajouté 14 tests (C1 à C5), corrigé C10 (`oublierSonde()` dans `afterEach`,
`avancerTelephone()` dans `gestes.ts`) et aligné `CLAUDE.md` (C6 : Tour du monde « même nombre de
volées », First 9 « 3 premières volées de chaque leg »). Détail dans `02-dev-notes.md`.

Rejoué par l'Orchestrator (vérification exécutée ; l'agent `test` n'avait pas de shell) :

| Commande | Résultat |
|---|---|
| `npm run lint` | 284 fichiers, 0 erreur |
| `npm run typecheck` | 0 erreur |
| `npx vitest run` | **67 fichiers, 1172 tests verts** |
| `npm run build` | OK, précache 49 entrées (855,87 KiB) |

Contre-épreuves (restauration octet pour octet, `git diff` identique, vérifié) :

| Mutation | Résultat | Constat fermé |
|---|---|---|
| M8 inverser `doubleOut` / `doubleIn` dans `reglesDeLaConfigX01` | **Rouge** (2) | C2 |
| M9 retirer `text-craie-3-regles` des lignes `autre` | **Rouge** (1) | C3 |
| C1 neutraliser la remise à zéro sur `location.key` | **Rouge** (2) | C1 |

C4 (retour à l'étape 2), C5 (texte intégral de la planche) et C10 : tests ajoutés, verts. C6 :
`CLAUDE.md` aligné. C7, C9 et DV8 restent pour la Revue ; C8 info.

### Gate

Toutes les questions de Test ont une résolution écrite. Restent pour les phases suivantes :
Sécurité (DV7), Revue (C7, C9, DV8), relecture à l'écran (angles morts). Test **Faite**.

## Passe 3 — après la Révision 1, boucle 7 (2026-10-16)

Sous-agent `test` (opus, effort `high`), analyse statique ; commandes et 10 contre-épreuves déjà
lancées par l'Orchestrator (`02-dev-notes.md` § Session 5 : 1329 tests verts).

**Verdict : un bug d'implémentation → Dev** (P3-1), trous de test bas, cas non spécifiés.

### Traçabilité (résumé)

Critères 1-10 tenus (`reglesDuJeu.test.tsx` `:380`, `:396`, `:418`, `:432`, `:445`, `:473`,
`:513`, `:538-552`, `:582`, `:600`, `:622-694`, `:750`, `:775`, `:833`, `:890`, `:906`, `:923`,
`:965`, `:982`, `:996`, `:1019`, `:1034`, `:1049`, `:1064` ; `nouvellePartie.test.tsx:1079`,
`:1087` ; `checkout.test.ts`). Tests attendus (1)-(9) de la Révision 1 présents
(`dialogueNatif.test.tsx` :57 à :137 ; `themeBoundary.test.ts:132`, `:150`). U1 (`:965`, `:982`,
`:996`) et U2 (`:1019`, `:1034`) couverts. Critères tenus avant la Révision (historique, C1,
volée, rubriques repliées, focus, texte mot pour mot, Q1, DV4, D10) : toujours tenus.
`Modale` : comparée ligne à ligne avec `main`, comportement identique ; ses trois fichiers de
tests non modifiés.

### Constats

| # | Sév. | Classe | Constat | Preuve | Renvoi |
|---|---|---|---|---|---|
| **P3-1** | **Moyenne** | **Bug** | `pl-11font-score` (espace manquante) : le nom de partie perd son retrait **et** `font-score` sur les quatre écrans de match en portrait — régression introduite par la correction du constat 2 ; invisible au lint, au build, aux tests. Confirmé par l'Orchestrator | `DispositionPartie.tsx:72` (main `:65` `truncate pl-12 font-score`) | **Dev** + assertion de classe |
| P3-2 | Basse | Trou de test | Glisser parti du voile, lâché dans la feuille : non testé (M-R7 survivrait) | `useDialogueNatif.ts:99-104` | Dev |
| P3-3 | Basse | Trou de test | Le test « sans `display` » ne retire que `open:` ; `paysage:flex` survivrait | `reglesDuJeu.test.tsx:901-903` | Dev |
| P3-4 | Basse | Trou de test | `--haut-feuille` vaut `0px` sous jsdom ; `.top` au lieu de `.bottom` ou `resize` retiré survivraient | `:945` ; `LivreRegles.tsx:47-52` | Dev (stub de `getBoundingClientRect`) |
| P3-5 | Basse | Trou de test | U2 testé sur une pile irréaliste (`['/', partie+regles]`) : le retour ferme en quittant | `:1019-1032` | Dev (pile à trois entrées) |
| P3-6 | Basse | Trou de test / angle mort | `Phrase` : `<strong>` et `classeFort` non vérifiés | `Phrase.tsx:21` | Dev |
| P3-7 | Info | Non spécifié | C9, parcours importés : `['MISS']` → « Une seule cible : . », `[20, 'MISS', 19]` incohérent avec « Ce soir », cible unique dans « Ce soir », `[20, 'BULL']` ; M-R13 survivrait | `labels.ts:1762-1809` | **Utilisateur → tranché** : phrase neutre qui ne casse jamais, cohérente avec « Ce soir » ; relue en DV5 ; refuser `MISS` à l'import reste pour l'audit #11 |
| P3-8 | Info | Garde | Faux négatifs de la garde des jetons (`from-` / `via-` / `to-`, `border-s/e-`, valeurs arbitraires, `index.css`) ; suggestion : `opacity-[var(--voile-cible)]` en voisin témoin | `themeBoundary.test.ts:123-126` | Revue, facultatif |
| P3-9 | Info | Angle mort | U1 au paysage du match et transparence réelle du voile | — | Relecture |

Mutations proposées : M-R1 à M-R15, M-T1, M-T2 (liste dans le rapport ; attendus rouges sauf
M-R7, M-R11, M-R12, M-R13, M-R14 — trous P3-2 à P3-7 — et M-R9, M-R15, équivalents).

### Gate

P3-1 (bug) et P3-2 à P3-7 → **boucle 1, Test → Dev, tour 3**. P3-8 → Revue ; P3-9 → relecture.

## Passe 4 — après la boucle 1, tour 3 (2026-10-16)

Le Dev (agent de la Révision 1 repris) a corrigé P3-1 (`pl-11 font-score`, grep : aucun autre
collage dans `src/ui`) et ajouté les tests P3-2 à P3-6. P3-7 : `motCible`, `parcoursDescendant`
dans `labels.ts` ; « En bref » et « Ce soir » partagent la détection de la forme du domaine ;
tout autre parcours en liste neutre (« Le parcours de cette partie : ‹liste›. Celui qui boucle le
tour avec le moins de fléchettes gagne. »), `MISS` et bulle par les libellés existants. Écart
signalé : `legendeParcours` passe par `pluriel` et compte les cases de la grille sans `MISS`
(« 1 case » ; « 0 case » pour `['MISS']`, à relire). Contre-épreuves du Dev : 5 rouges.

Rejoué par l'Orchestrator :

| Commande | Résultat |
|---|---|
| `npm run lint` | 297 fichiers, 0 erreur |
| `npm run typecheck` | 0 erreur |
| `npx vitest run` | **74 fichiers, 1340 tests verts** |
| `npm run build` | OK, précache 50 entrées (871,58 KiB) |

Contre-épreuves (restauration vérifiée, `git diff` identique) : `paysage:flex` sur le `<dialog>`
**rouge** (P3-3, non lancée par le Dev) ; `pl-11font-score` **rouge** (P3-1).

### Gate

P3-1 à P3-6 fermés ; P3-7 tranché et fait, textes à relire (DV5). P3-8 → Revue ; P3-9 →
relecture. Test **Faite** (passe 4).
