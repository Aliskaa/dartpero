# Lot `accueil-parties-recentes` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high,
> frontmatter). Il n'avait que Read / Grep / Glob : son jugement vient de la lecture ligne à
> ligne du code et des tests. **L'Orchestrator a lancé les contrôles et les contre-épreuves**
> (§ Contre-épreuves).

## Stratégie

| Niveau | Couvert par | Verdict |
|---|---|---|
| Domaine | Rien n'y est touché ; `legsPlayed` se lit sur `X01State.milestones` | Hors périmètre, justifié |
| Use cases | `tests/use-cases/statutDePartie.test.ts` : `legsPlayed` (:27-73), `statutDePartie` (:75-143) avec `describe.each(GAME_MODE_IDS)` (:94) | Bon ; lacunes C3 et C4 |
| UI pure | `tests/ui/jourCalendaire.test.ts` : groupement, `heureCourte`, `libelleQuand` | Solide : bornes locales, `TZ`, préconditions de durée du jour (:46, :66) |
| UI écran | `tests/ui/accueilPartiesRecentes.test.tsx` (Accueil et Historique), avec `fakeServices`, `SettableClock` et `lancer()`, sans mock | Conforme ; lacunes C1 et C5 |
| Architecture | Gardes existantes, inchangées ; `jourCalendaire.ts` ne fait que des `new Date(…)` avec arguments, permis par `horlogeBoundary` | Rien à ajouter |
| Rendu | Non testable en jsdom | **Angle mort** : checklist ci-dessous |

## Critères d'acceptation

| # | Couverture réelle | Verdict |
|---|---|---|
| 1 | UI :74-91 (J-6 présent, J-7 absent, témoin positif) ; unit :26-33 ; partie en cours de plus de 7 jours :153-171 (en tête, « Reprendre », pas de doublon) | OK |
| 2 | Unit :19-24 ; UI :110-125 ; jours de 25 h (:45-61) et de 23 h (:63-73) | OK, jamais vert à vide (contre-épreuve M1) |
| 3 | `statutDePartie.test.ts:28-72` ; UI :221-241 | OK ; C4 |
| 4 | UI :201-216 (`it.each` des 4 modes), :243-313, :525-546 (Historique filtré) ; unit :115-141 | OK ; C5 |
| 5 | :335-357 ; résumé pour les 4 modes (:305-312) ; reprise en X01 | OK |
| 6 | :422-435 : seulement les classes `sticky` et `--hauteur-nav-basse` | **Non prouvable en jsdom** : relecture |
| 7 | :375-406 | OK |
| 8 | :201 et `statutDePartie.test.ts:94` | OK |
| 9 | Voir C1 | **Couverture mince** |

## Assertions retirées des 5 tests adaptés

| Test | Perdu | Verdict |
|---|---|---|
| `parcours.test.tsx:85-87` | « Reprendre » devient un lien ; le panneau « Partie en cours » disparaît | Voulu (`request.md` § Ce qui part) |
| `manches.test.tsx:95-97` | Rien ; « jamais leg » est gardé avec témoin positif ; « 1 manche jouée » est ajouté | OK |
| `lot4.test.tsx:136-139` | Le détail par joueur de l'Historique | Voulu (résolution 2 du gate) |
| `cricket.test.tsx:177-193` | « 1/3 » et les points à l'Historique | Voulu ; **le titre ment** (C8) ; la donnée reste testée au use case (`tests/use-cases/cricket.test.ts:116-117`) |
| `tourDuMonde.test.tsx:340-366` | La progression « 1/3 » | Voulu ; titre périmé (C8) |

**Aucune règle de jeu n'est devenue invérifiée.** Mais voir C6.

## Constats

| # | Classe | Sév. | Constat | Preuve |
|---|---|---|---|---|
| C1 | Problème de test | **Moyenne** | **Critère 9 mal couvert.** Fin de partie : aucun test (`ActionsFinDePartie.tsx:51-52`). Import : aucun test (`ReglagesEcran.tsx:285`). Suppression : seul l'Historique est vérifié, pas l'Accueil. Le test « sans rechargement » (:510-520) fait `unmount()` puis un nouveau `renderWithServices`, donc un **nouveau `QueryClient`** (`renderWithServices.tsx:18`) : il prouve un chargement à froid, pas une invalidation | **Confirmé par l'Orchestrator** (lecture de :510-520 et de `renderWithServices.tsx:18`) |
| C2 | Bug d'implémentation, à confirmer à l'écran | Basse | Le décalage du bouton fixé (`--hauteur-nav-basse` + safe-area) ignore la `border-top: 3px` de `.bandeau-bas` (`index.css:376-379`). Le fond `bg-feutre` passe 3 px sous la barre, et une police système agrandie fausse le décalage | `AccueilEcran.tsx:202`, `NavigationBasse.tsx:30,39`, `index.css:111,376` |
| C3 | Problème de test | Basse | La limite des 20 (résolution 6) n'a pas de test d'intégration : 21 parties, dont une non terminée plus ancienne ; on attend personne d'épinglé, « Abandonnée » dans la fenêtre, et rien au-delà de 7 jours | `GetOngoingMatchUseCase.ts:9` |
| C4 | Problème de test | Basse | `legsPlayed` : aucune annulation de la volée gagnante, aucun cas à deux joueurs gagnant chacun une manche | `statutDePartie.test.ts:12-25` |
| C5 | Problème de test | Basse | Règles de carte sans test : (a) pas de « En cours » à côté de « Abandonnée » ; (b) « En cours » de l'entraînement et du Cricket à l'Accueil ; (c) le ✓ et son absence ; (d) le liseré par mode ; (e) la branche « Terminée » du Cricket, jugée inatteignable | **Mutations S1 et S2 survivantes** (§ Contre-épreuves) |
| C6 | Question utilisateur | Basse | **Champs morts du port** : aucune UI ne lit plus `remaining`, `legsWonInSet`, `setsWon`, `targetIndex`, `finishedInDarts`, `closedTargets`, `score`, `successPercent` ni `totalVisits` du `MatchSummary`. Quatre d'entre eux ne sont plus testés au niveau du résumé. À garder, à retirer ou à documenter ? | `summarize.ts:84-119`, `MatchSummary.ts:14-31` |
| C7 | Question utilisateur | Basse | Un X01 terminé n'affiche que « N manches jouées » et le ✓, pas le vainqueur. C'est conforme à `request.md`, mais l'Historique perd « qui a gagné » (l'info reste dans le résumé). Même remarque pour « 0 / 1 sorties » | `CartePartie.tsx:72-73,160`, `labels.ts:461-462` |
| C8 | Problème de test | Basse | Titres qui promettent plus qu'ils ne vérifient : `cricket.test.tsx:177`, `tourDuMonde.test.tsx:340`, `accueilPartiesRecentes.test.tsx:397` et :510 | — |
| C9 | Pour la Revue | Basse | (a) L'UI importe une fonction pure de `use-cases/` (`statutDePartie`) : c'est un premier précédent, dans le bon sens de dépendance. (b) `libelleRegles` garde du français hors de `labels.ts` (`CartePartie.tsx:30-45`) et est exporté sans usage. (c) Des `h3` sans `h2` avant eux à l'Accueil (`AccueilEcran.tsx:175`). (d) Une erreur de requête s'affiche comme « Pas de partie cette semaine » (:150), sans test. (e) La doc cite encore `ApercuPartie` (charte :236, `CONVENTIONS` :266, :357, index :147) | — |

Remarques sans action : l'Accueil trie par `createdAt`, l'Historique par `updatedAt` (voulu). L'Accueil peut montrer jusqu'à 31 cartes (30 plus la partie épinglée). Une vieille partie reprise récemment occupe une des 30 places sans entrer dans la fenêtre.

## Contre-épreuves (Orchestrator, 2026-10-13)

Chaque mutation est appliquée, `npx vitest run` tourne sur toute la suite, puis le fichier est
restauré ; les empreintes `Get-FileHash` sont identiques avant et après. Script :
`scratchpad/mutations.ps1`, hors dépôt.

| Mutation | Attendu | Résultat |
|---|---|---|
| M1 : borne J-6 en `86 400 000 × N` | Rouge | **2 échecs** |
| M2 : fenêtre à 7 jours précédents | Rouge | **4 échecs** |
| M4 : Historique, `enCoursId` pris dans la liste filtrée | Rouge | **1 échec** |
| M7 : retrait du dédoublonnage de la partie en cours | Rouge | **14 échecs** |
| S1 : `sansVainqueur` constant (« En cours » à côté de « Abandonnée ») | Survivant prévu (C5) | **744 verts : survit** |
| S2 : ✓ des parties terminées supprimé | Survivant prévu (C5) | **744 verts : survit** |

Déjà fait par le Dev : sans `invalidateQueries(CLE_HISTORIQUE)` dans `useNouvellePartie`, :507
échoue.

## Relecture à l'écran (checklist)

Portrait et paysage, thème sombre et thème clair, avec 0, 1 et 15 parties :

1. **Bouton fixé** :
   - au-dessus de la barre, sans trou ni recouvrement (C2) ;
   - safe-area sur iPhone ;
   - en paysage peu haut, environ 150 px pris par la barre et le bouton : la dernière carte
     reste atteignable, le bouton garde ses 48 px.
2. Fond uni `bg-feutre` du bouton contre le tapis, dans les deux thèmes.
3. Lisibilité en thème clair : le badge « Abandonnée » (`border-craie/40`, `craie/80`), le ✓
   `text-laiton`, le texte `craie/70`, les règles en 10,4 px.
4. Le liseré d'accent de chaque mode.
5. L'avatar neutre d'un joueur supprimé.
6. Les noms de partie longs, la carte avec « Reprendre », la carte à 4 avatars.
7. L'Historique sans scores par joueur, avec sa poubelle de 48 px.
8. Les heures « 21 h 04 » / « mardi 21 h 10 » à l'Accueil, contre `dateHeure` à l'Historique.
9. L'invitation d'installation au-dessus du bouton fixé ; l'écran vide et son lien.

## Résolutions du gate Test (utilisateur, 2026-10-13)

| # | Résolution |
|---|---|
| C1, C3, C4, C5, C8 | **Renforcer maintenant** : passe Dev limitée aux tests (tour 1, boucle 1), puis Test rejoué |
| C2 | **Corriger dans la même passe** : intégrer la bordure de la barre au décalage, et le rendre robuste à une police agrandie ; rendu vérifié à la relecture |
| C6 | **Garder les champs, documentés** : le commentaire du port est corrigé, rien n'est retiré |
| C7 | **Ajouter le vainqueur au X01 terminé** : « Julien gagne · 5 manches ». Amendement de la demande par l'utilisateur ; `request.md` reste inchangé (snapshot de provenance) |
| C9 | Renvoyé à la Revue |

## Rejeu après tour 1 (2026-10-13)

> `test` sonnet / high, Read / Grep / Glob (plus la lecture de `dist/assets/*.css`).
> Contrôles et contre-épreuves de l'Orchestrator : 761 / 761 ; M1, M2, M4, M7, S1, S2 rouges.

**Verdict : livrable sur les tests**, à un bug près (N1), introduit par la correction de C2.

| # | Verdict |
|---|---|
| C1 | **Levé.** Client partagé (`renderWithServices.tsx:19`, tests :583, :606, :644), `staleTime` infini justifié, tests capables d'échouer. Trous résiduels N2 et N3 |
| C2 | **Levé par construction** : le `bottom` du bouton et la `height` de la barre sont le même `calc` (vérifié dans le CSS construit). Effet de bord : N1 |
| C3, C4, C8 | Levés (`:225-258` ; `statutDePartie.test.ts:63-114` ; titres) |
| C5 | Levé (:202-222, :265-294) ; la branche « Terminée » du Cricket reste non testée, car inatteignable |
| C6 | Conforme ; imprécision N5 |
| C7 | **Conforme à l'amendement** (`CartePartie.tsx:73-76`, `labels.ts:462-463`, tests :296-333 et :778) |

**Rognage des libellés de la barre** avec une police agrandie : risque **faible**. Tout est en
`rem`, et la marge est d'environ 5,6 px à l'échelle 1 (estimation, `line-height` non vérifié).
C'est une question de relecture (130 % et 200 %), pas une régression avérée. Les autres écrans à
barre perdent 3 px de barre (59 → 56 px), sans casse connue.

| # | Classe | Sév. | Constat | Preuve |
|---|---|---|---|---|
| N1 | **Bug d'implémentation** (accessibilité, WCAG 2.4.7), introduit par C2 | Basse à moyenne | L'anneau de focus clavier des onglets (`outline-offset: 2px`) est **rogné** par l'`overflow-hidden` de la barre : en haut, aux deux bords, et en bas sans safe-area | `NavigationBasse.tsx:30` ; `index.css:325-328`, **vérifié par l'Orchestrator** |
| N2 | Problème de test | Basse | L'invalidation de `CLE_MATCH_EN_COURS` au lancement (`useNouvellePartie.ts:263`) n'est testée nulle part. Correctif : une ligne dans le test :706-728 | — |
| N3 | Problème de test | Basse | L'invalidation de `['historique']` par `ActionsFinDePartie` n'est pas prouvée seule. Scénario : l'onglet Parties à cache chaud, puis « On remet ça », puis deux retours ; on attend 2 parties | `ActionsFinDePartie.tsx:52` |
| N4 | Problème de test (fragile, jamais faux vert) | Basse | Une assertion négative synchrone après `findByText('Reprendre')` : elle ne passe que si le refetch finit pendant les awaits | `accueilPartiesRecentes.test.tsx:637-641` |
| N5 | Documentation | Basse | Le commentaire de `MatchSummary` oublie `targetsTotal`, `id`, `createdAt` et `updatedAt` | `MatchSummary.ts:90-95` |
| N6 | Documentation | Basse | Une classe citée dans `02-dev-notes.md` générait une règle CSS morte (Tailwind scanne les `.md`) | **Corrigé par l'Orchestrator** (reformulation) |
| N7 | Angle mort assumé | Basse | Rien ne vérifie que les deux `calc` restent identiques ; un test structurel est possible | :549-551 |

**Classement par l'Orchestrator** : N1 → **boucle 1 (tour 2), automatique**. N2, N3, N4 et N5
sont joints à la même passe : correctifs courts, dans les fichiers déjà touchés, et ils évitent
un tour de plus. N7 : facultatif, laissé au Dev. Rognage → relecture à l'écran (utilisateur).

**Checklist de relecture : ajouts**
- la barre du bas avec la police système à 130 % et 200 % : libellés non rognés ;
- le focus clavier ou TalkBack sur les 4 onglets : anneau laiton entier, bords et coins compris
  (après la correction de N1) ;
- le bouton fixé contigu à la barre, filet de 3 px compris ;
- « Kevin gagne · 3 manches » sur une carte à 4 avatars.

## Rejeu après tour 2 (2026-10-13)

> `test` sonnet / high, lecture seule. Contrôles de l'Orchestrator : 763 / 763 ; mutation N3 :
> 1 échec.

**Verdict : N1, N2, N3, N4, N5 et N7 sont levés. Aucun bug d'implémentation ouvert. Test passe
à Sécurité.**

- **N1.** `outline-offset: -2px` (`NavigationBasse.tsx:42`) l'emporte sur la règle de base,
  à la fois par l'ordre des couches et par la spécificité (vérifié dans le CSS construit).
  L'anneau reste dans la boîte du lien sur ses quatre bords, avec ou sans safe-area.
  Point esthétique **à voir à l'écran** : sur l'onglet actif, l'anneau et le trait laiton
  sont à environ 1 px l'un de l'autre (estimation).
- **N2.** Le test :765 / :773 passe de non invalidée à invalidée ; seule
  `useNouvellePartie.ts:263` invalide cette clé.
- **N3.** Le test :625-646 a fait échouer la mutation.
- **N4.** Le test :681-685 discrimine : sans invalidation, le `waitFor` expire.
- **N5.** Le commentaire est cohérent avec la carte.
- **N7.** Le test :555-567 casse bruyamment (`toMatch` sur `undefined`), jamais à vide.
- **Nouveau, très bas.** `ActionsFinDePartie.tsx:51-52` garde des clés littérales au lieu de
  `clesRequetes.ts`. C'est le **D2** de `02-dev-notes.md`, déjà laissé à la Revue.

## Rejeu après tour 3 (2026-10-13)

> `test` sonnet / high, lecture seule. Vérifications de l'Orchestrator : `biome check src tests`
> 0 ; typecheck 0 ; 765 / 765 ; build vert. Après l'exclusion de `.claude/skills` décidée par
> l'utilisateur (`biome.json`), `npm run lint` est vert sur 246 fichiers.

**Verdict : Test passe**, avec une réserve (T1).

- **R3** (renommage `matchStatus`) : propre ; aucune assertion affaiblie ; le filtre de mode
  est couvert (`matchStatus.test.ts:168`).
- **R5** : le test :175-189 peut échouer.
- **R10** : le test :706-729 est robuste, sur le client par défaut (`staleTime` 0, comme en
  production) ; il n'est pas vert à vide.
- **Texte des règles (R1)** : **identique** à l'ancien `libelleRegles`. L'Orchestrator a
  comparé `git show HEAD:src/ui/composants/commun/ApercuPartie.tsx` à `labels.ts:462-483` et à
  `CartePartie.tsx:30-48`, pour les quatre modes, avec double out puis double in.

| # | Classe | Sév. | Constat |
|---|---|---|---|
| T1 | Problème de test | Basse | **Aucun test ne garde le texte des règles** des cartes. Seuls `parcours.test.tsx:87` (`'X01 · 501'`, en sous-chaîne) et `libelleFormat` le touchent. Mutation T1 (`cibles` → `cible`) : **survit** (765 verts). Correctif : un test sur les chaînes exactes (X01 avec double in / out et sets, Tour du monde, Cricket dans les deux variantes, entraînement à 1 et 10 sorties) |
| T2 | Info | — | « 1 sorties » sans accord (`labels.ts:469`) : **antérieur au lot**, même texte dans l'ancien `libelleRegles`. Aucune action dans ce lot |

**Contre-épreuves de l'Orchestrator** (`scratchpad/mutations2.ps1`, fichiers restaurés à
l'identique) :

| Mutation | Résultat |
|---|---|
| M4 : `enCoursId` pris dans la liste filtrée | 1 échec |
| S1 : `sansVainqueur` constant (motif `'ABANDONED'`) | 3 échecs |
| N3 : retrait de l'invalidation `CLE_HISTORIQUE` dans `ActionsFinDePartie` | 1 échec |
| R5 : retrait du `h2` invisible | 1 échec |
| T1 : « cibles » → « cible » dans `reglesCricket` | **survit** (confirme T1) |

**Résolution de T1 (utilisateur, 2026-10-13)** : **dette pour le prochain audit**, inscrite en
PLAN § 0. Le texte est vérifié juste à la main, et le dernier tour de marge est gardé pour la
Revue rejouée.

## Questions ouvertes à la fin de Test

| # | Question | Pour qui |
|---|---|---|
| C1, C3, C4, C5, C8 | Renforcer les tests avant Sécurité (passe Dev limitée aux tests), ou laisser ? | Utilisateur |
| C2 | Corriger le décalage maintenant, ou attendre la relecture à l'écran ? | Utilisateur |
| C6 | Champs morts du `MatchSummary` : garder, retirer ou documenter ? | Utilisateur |
| C7 | X01 terminé sans vainqueur sur la carte : voulu ? | Utilisateur |
| C9 | Points de conception | Revue |
