# Lot `nouvelle-partie-parcours` — plan de test

## Tour 1 (2026-10-15)

> Source : rapport de l'agent `test` (sonnet / high, lecture statique : **il n'avait ni shell ni
> Bash** dans cette session), commandes relancées par l'Orchestrator.

### Commandes (Orchestrator)

| Commande | Résultat |
|---|---|
| `npm run lint` (`biome check .`) | 275 fichiers, aucune correction — vert |
| `npm run typecheck` (`tsc --noEmit`) | vert |
| `npx vitest run` | **65 fichiers, 1091 tests**, tous verts (1065 avant le lot) |
| `npm run build` | vert (précache 47 entrées) |

### Stratégie

- Use case : `tests/use-cases/shuffleOrder.test.ts` (6 tests) ; `ordreAleatoire.test.ts` gardé
  pour le flag `shuffle`.
- UI (Testing Library, `renderWithServices`, `fakeServices()`, rôles, `retourTelephone`) :
  `nouvellePartie`, `nomDePartieEcrans`, `pictogrammesEmplacements`, `cricket`, `tourDuMonde`,
  `parcours`, `manches`.
- Architecture : gardes existantes (`themeBoundary`, `accentBoundary`, `pictogrammesBoundary`,
  `appuiBoundary`, `lazyRoutes`, `hexagonalBoundary`, `horlogeBoundary`), planchers et
  contre-épreuves en place.
- Hors périmètre à juste titre : domaine, événements, `backupSchema`, Dexie (aucun fichier touché).

### Couverture par critère

| # | Couvert par | Prouve ? |
|---|---|---|
| 1 | `nouvellePartie` (retour téléphone / bouton, lien profond) ; `nomDePartieEcrans` (nom gardé au retour depuis l'étape 3) | Oui |
| 2 | Barre : étape 1 sans rien de touchable ; Ordre grisé sous deux joueurs ; entraînement 2 segments | Oui, trou T3 |
| 3 | Tuiles 2 × 2 sans champ nom ; `it.each` tuile ↔ pictogramme contre `TRACES_ATTENDUS` en dur, distincts | Oui (échoue si deux entrées sont permutées) |
| 4 | Pas de champ à l'étape 1 ; proposition, facultatif, sans focus, 30 caractères ; nom tapé écrit sur 4 modes ; clé absente (intact / vide / espaces) | Oui, trou T4 (lancement depuis l'Ordre) |
| 5 | Replié par défaut, récap à jour ; double out `false` par défaut ; sets ; replié au retour ; dernière formule relue | Oui, **sauf `doubleOut: true`** (T1) |
| 6 | Cut-throat dans le journal ; variante mémorisée | Oui |
| 7 | `it.each` 4 jeux : `aria-expanded`, titre inchangé, 7 cibles / 21 cases seulement dépliées | Oui pour les cases, trou T2 |
| 8 | Tirage : feuille rebattue, annonce, lancement dans cet ordre ; même ordre accepté et mouvement rejoué ; réordonner après tirage | Oui (fake rejoué à la main par Test) |
| 9 | Gardes | Vertes (run Orchestrator) |
| 10 | `manches.test.tsx` `sansLeg` à l'étape 2 X01 | **Partiel** (T5) |

### Tests d'absence

Interrupteur absent, champ nom absent de l'étape 1, pictogramme ↔ mode : peuvent échouer.
Couleur par mode : portée par `accentBoundary` (plancher 100 fichiers). **Vert à vide** :
`tourDuMonde.test.tsx:399` (`/double out/i`, l'écran ne le dit plus) → T6.

### Hygiène vérifiée (lecture)

Aucun `Math.random` dans `src/ui` (commentaire seul, `useNouvellePartie.ts:204`) ;
`ShuffleOrderUseCase` en imports relatifs ; câblage `container.ts:194` ; plus aucun `shuffle:`
dans `src/` ; nom en clé absente ; `doubleOut` toujours passé (l. 230) ; ni `text-craie*/NN`, ni
`rounded-*`, ni couleur en dur ; ni « leg » ni « best of » dans `labels.ts` 782-1070 ; cibles
≥ 48 px par les classes ; `animate-monter` + `prefers-reduced-motion` global ; annonce depuis un
`onClick`. Docs cohérentes avec le code (`CLAUDE.md` 140-150, charte 326-341, CONVENTIONS § 14,
PLAN). Aucun mojibake dans les fichiers du lot.

### Captures (lues par Test)

Sombre portrait 01, 04, 08, 11 ; clair paysage 04, 11 ; clair portrait 05, 09 : rien de cassé
(barre, laiton unique, × non rogné, fiche X01 dépliée en clair, cartes Cricket, plage, feuille
d'ordre ; paysage qui défile).

### Angles morts (relecture à l'écran)

Aucune capture à police max (barre, pseudos, « Sur un double » à 360 px) ; contraste réel ; en
clair, « grisé » et « à venir » ne diffèrent que par le trait ; mouvement du tirage ; paysages non
relus un à un ; vrai iPhone. Grand vide de l'étape Ordre : écart validé par l'utilisateur.

### Constats

**Bugs d'implémentation : aucun.**

Trous de test (renvoi Dev, boucle 1) :

- **T1 (moyen)** — `doubleOut: true` jamais asserté dans la config lancée par l'UI.
- **T2** — « Les règles en entier » : le paragraphe X01 et entraînement n'est pas asserté.
- **T3** — `aria-current="step"` non testé à l'étape Ordre ni à « 2 · Réglages » ; état
  `fait` non asserté.
- **T4** — `sousTitreOrdre` sans test (X01 · 501, Cricket · Cut-throat, Tour du monde) ; nom tapé
  non vérifié dans le journal depuis l'étape Ordre.
- **T5** — `sansLeg` ne balaie que la page X01 repliée.
- **T6** — `tourDuMonde.test.tsx:399` vert à vide.
- **T7 (bas)** — « Commencer » désactivé à 0 joueur : aucun test visible.

Question technique :

- **Q-A** — `ReglagesJeu` importe `PICTOGRAMME_PAR_MODE` depuis le fichier frère `EtapeJeu.tsx`.

### Résolution (Orchestrator)

- Commandes : relancées, vertes (ci-dessus). Question 1 de Test close.
- **T1-T7** : renvoyés au Dev (boucle 1, tour 1) — petits ajouts de test, aucune décision produit.
- **Q-A** — Close (technique) : déplacer `PICTOGRAMME_PAR_MODE` dans
  `src/ui/composants/commun/Pictogramme.tsx` (le design system, déjà importé par les deux
  écrans) et mettre à jour les imports, test compris.
- Angles morts : reportés à la relecture à l'écran par l'utilisateur.

## Tour 2 (2026-10-15, après la boucle 1)

> Source : rapport de l'agent `test` (sonnet / high, 2e lancement, lecture statique — toujours sans
> shell). Commandes relancées par l'Orchestrator après la boucle : lint (275 fichiers), typecheck,
> **65 fichiers / 1104 tests**, build — verts. `git diff` de `Pictogramme.tsx` relu par
> l'Orchestrator : seul l'export `PICTOGRAMME_PAR_MODE` et son `import type` ajoutés.

| Constat | Verdict |
|---|---|
| T1 `doubleOut: true` | Comblé ; avec le test du défaut `false`, verrouille `useNouvellePartie.ts:230` |
| T2 paragraphes X01 / entraînement | Comblé (absent replié, présent déplié, absent re-replié) |
| T3 `aria-current` / `fait` | Comblé (Ordre, « 2 · Réglages », grisé ≠ à venir) |
| T4 sous-titres, nom depuis l'Ordre | Comblé |
| T5 `sansLeg` élargi | Comblé, témoin positif par page ; dépliage prouvé |
| T6 assertion vide | Comblé, trois assertions qui peuvent échouer |
| T7 « Commencer » à 0 joueur | Comblé |
| Q-A | Close : imports à jour, pas de cycle (`import type`), `pictogrammesBoundary` pertinent |

Comptage recoupé : +13 tests (T3 1, T4 5, T5 6, T7 1 ; T1, T2, T6 modifient l'existant). Helper
`texteAffiche` (`TreeWalker`) correct, n'affaiblit aucun `sansLeg` préexistant.

**Bugs : aucun. Trous de test : aucun. Questions ouvertes : aucune.** Sans action : contre-épreuve
non faite du cas entraînement de T2 (symétrique au X01, risque bas).

Angles morts (relecture à l'écran par l'utilisateur) : police max à 360 px (barre, pseudos,
« Sur un double »), contraste réel, « grisé » / « à venir » en clair, mouvement du tirage,
paysages, vrai iPhone.