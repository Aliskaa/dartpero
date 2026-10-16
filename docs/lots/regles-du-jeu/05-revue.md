# Lot `regles-du-jeu` — revue

## Passe 1 (2026-10-16)

Sous-agent `review` (opus / max, frontmatter). Sans shell : lecture sur disque de chaque fichier
du `git status`, comparaison avec le dépôt principal, journaux git lus dans `.git`. S'appuie sur
les commandes de l'Orchestrator (lint, typecheck, 1172 tests, build, contre-épreuves).

**Verdict : NO-GO en l'état.** Le design d'Archi est livré (domaine `checkoutRange` + S1, port
`GetCheckoutRange`, livre et feuille par-dessus, texte des quatre jeux, neuf jetons, « Pas de
finish » par le port, « Les règles en entier » retiré) ; aucun défaut de domaine, de sécurité ni
de design propre au lot. Le NO-GO tient à :

1. l'intégration avec `main`, qui a bougé (constat 1) : choix de l'utilisateur requis ;
2. un tour court Revue → Dev pour des mineurs (constats 2 à 8) ;
3. des vérifications sur appareil sans acceptation écrite (R1, R2, iPhone).

Vérifié par l'Orchestrator : `main` = `26a39fb` (« statistiques en podium… »), la branche part de
`5644892` ; fichiers modifiés des deux côtés : `labels.ts`, `CONVENTIONS.md`,
`rules/frontend-react.md`, `CHARTE_GRAPHIQUE.md`.

### Constats

| # | Sév. | Constat | Preuve | Renvoi |
|---|---|---|---|---|
| 1 | **Majeur** | `main` apporte `Modale` + `useModaleAuRetour`, même mécanisme que `useFeuilleRegles` (entrée sur la même URL, `navigate(-1)`, remise à zéro sur `location.key`, push au clic ; garde du double appui `enVol` en plus). Un rebase « garder les deux » donnerait deux hooks pour un patron, CONVENTIONS § 9 contradictoire (main `:186` « le `<dialog>` reste monté » / lot `:188` « monté seulement ouvert »), conflit sur `frontend-react.md:16`, `LIBELLE_FERMER` déclaré deux fois (main `labels.ts:918`, lot `:1023` → typecheck rouge), voile qui ferme la modale des stats mais pas la feuille. Choix : **(a) converger** sur `useModaleAuRetour('regles', …)` et la discipline de `Modale` ; **(b) deux mécanismes**, une règle unique non contradictoire dans CONVENTIONS § 9 | `C:\Users\kevin\Documents\Flechettes\src\ui\hooks\useModaleAuRetour.ts:51-61` ; `useFeuilleRegles.ts:50-56` | **Archi, boucle 7, utilisateur d'abord** (au rebase) |
| 2 | Mineur | Régression DV1 : `gap-2` en portrait non répercuté sur la ligne du nom ; `pl-12` (`:67`) et son commentaire (`:66`) supposent 48 px, c'est 44 : nom de la partie décalé de 4 px dans les quatre modes ; charte `:505` | `DispositionPartie.tsx:65-67` | Dev : `pl-11`, commentaire, charte |
| 3 | Mineur | C7 : `<header>` de la feuille dans un `<header>` (interdit par le modèle de contenu HTML ; landmark `banner` possible dans le dialogue) ; mesure `closest('header')` couplée au balisage | `FeuilleRegles.tsx:332` ; `DispositionPartie.tsx:57` ; `EnTeteEtape.tsx:47` ; `LivreRegles.tsx:44` | Dev : `<div>` ; facultatif : cibler `.bandeau-match` |
| 4 | Mineur | C9 : « En bref » du Tour du monde écrit 20, 1 et la bulle en dur, alors que « Ce soir », la grille et les réglages lisent `cibles` (D9 à moitié) | `labels.ts:1639-1649` (vs `:1638`, `:1671`, `:1780`) | Dev, ou acceptation écrite + dette au PROJECT_PLAN |
| 5 | Mineur (texte gravé) | `CLAUDE.md:248` « N manches (« sorties » à l'écran) » ; l'écran dit « Manche 3/10 », cartouche « Manche », glossaire `:25` | `labels.ts:751-752` ; `EntrainementEcran.tsx:76-79` ; `Cartouche.tsx:110` | Dev (doc) : dire où l'on dit « sorties » et où « Manche N/T » |
| 6 | Mineur | DV8 : `rules/theme-colors.md` muet sur les neuf jetons ; réservation à la feuille seulement en charte (`:106-107`) et `index.css:46-48`, sans garde ; noms génériques ; `rouge-texte` / `vert-texte` à 4,2 / 3,7:1 sur `feutre-nuit` en clair | `rules/theme-colors.md` | Dev (doc) ; garde `themeBoundary` facultative |
| 7 | Mineur (doc) | `PROJECT_PLAN.md` périmé : « 1158 tests » (`:19`, `:712`), troncature X01 « à trancher » (`:21`, `:1959-1961`), DV1 / C1 / C6 absents du § 6, note « à valider (lot `regles-du-jeu`) » non close (`:1938-1939`) | `docs/PROJECT_PLAN.md` | Dev ou Orchestrator |
| 8 | Mineur | Critère 5 « sets (X01) » : câblage sets / départ / manches vers « Ce soir » vérifié seulement sur défauts ou par regex ; `sets: reglages.sets` → `1` (`reglesDuJeu.ts:97`) ou `sets: config.setsToWin` → `1` (`:126`) survivrait | `reglesDuJeu.test.tsx:519-531`, `:650-658`, `:687-697` | Test, écrit par le Dev dans le même tour (+ contre-épreuve) |
| 9 | Info | `02-dev-notes.md` s'arrête à la session 3 (boucle 1 absente) ; écouteur `resize` de `LivreRegles.tsx:39-50` non documenté | — | Orchestrator |
| 10 | Info | Index `.ai/architecture-context.md` non régénéré (#3, #5, #12, #25, #26 à retirer ; « Les règles en entier » `:41`, `:120`) | — | Orchestrator, après le rebase |
| 11 | Info | Étude périmée : lot 11 donné `light` (`:168`) ; correctif S1 « après le lot 13 » (`:177-178`) | `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md` | Orchestrator |
| 12 | Info | Dettes : `Phrase` dupliquée (`ReglagesJeu.tsx:45`, `FeuilleRegles.tsx:23`) ; « 10 hooks » (`CONVENTIONS.md:385`, il y en a 12) ; liste des modes recopiée (`nouvellePartie.test.tsx:1077`) ; `labels.ts` au démarrage +5,2 kB gzip, non arbitré ; entrée `regles` sans entrée dessous → croix inopérante (quasi inatteignable) | — | Aucun |

### Invariants

Sens des dépendances OK ; aucun mode n'en importe un autre ; ni couleur en dur ni `rounded-*` ;
aucune règle réimplémentée dans l'UI ; aucune valeur persistée renommée ; routes lazy OK
(`LivreRegles` chunk différé) ; couture `GameMode` OK (`Record`, `switch` `never`, prop
obligatoire, `it.each(GAME_MODE_IDS)`) ; `CLAUDE.md` à jour sauf constat 5 ; index non régénéré.

### Clôture des questions

Q1-Q10, DV1-DV4, C1-C6, C10, question 1 de `sec` : closes par l'utilisateur ou par un fichier de
lot. D1-D10, T1-T6, S1 tenues (D9 à moitié → constat 4). DV5 : relecture en fin de lot. DV6 close
(Test), DV7 close (Sécurité), DV8 → constat 6. **Ouvertes : question 2 de `sec`, R1, R2** —
vérifications sur appareil sans acceptation écrite.

### Relecture à l'écran (owner : utilisateur)

R1 Android (retour avec volée de 1-2 fléchettes, second retour, croix puis retour, Échap) ; R2
(entrée non sautée par Chrome) ; iPhone (glissé retour en Safari, croix seule en PWA ; paysage :
livre à 8 px du bord, `<header>` sans `safe-area-inset-left/right`) ; 360 px (sous-titre X01 à
~26 px près, autres modes, `h1` de l'étape 2) ; textes non dessinés ; sombre / clair ;
`top-[210px]` sur petit téléphone ; paysage 46 % / 21 rem ; rotation ; `::backdrop` avant
Safari 17.4 / Chrome 122 ; mouvement réduit.

### À graver avant commit, puis au rebase

Constats 2 à 8 ; charte (`pl-11`, `gap-2` portrait, bandeau paysage 49 → 51 px, `:494`) ;
`02-dev-notes.md` (boucle 1) ; étude. Au rebase (accord requis), de préférence **avant** le tour
correctif si (a) : un seul `LIBELLE_FERMER`, CONVENTIONS § 9 unique, `frontend-react.md:16`
fusionné, charte § Composants avec `Modale` et le livre, PROJECT_PLAN, index (version de `main`
puis régénération), lint / typecheck / vitest / build / Grep d'encodage, `06-echanges.md`.

## Passe 2 (2026-10-16)

Sous-agent `review` (opus / max), sans shell ; comparaison avec le checkout `main` (`26a39fb`) ;
`9dff1a4` a pour seul parent `26a39fb`, aucun rebase en cours : `--ff-only` passera.

**Verdict : GO**, conditionné aux gravures documentaires ci-dessous (aucun code, aucun tour de
boucle : 2 tours restent). Révision 1 livrée telle que conçue ; aucun défaut de code, de test, de
sécurité ni de design.

### Constats de la passe 1

| # | État |
|---|---|
| 1 | **Résolu** : `useModaleAuRetour('regles', ['ouverte'])` (`LivreRegles.tsx:35`), `useDialogueNatif` partagé, `Modale` identique en logique, tests de `main` intacts, `useFeuilleRegles` absent |
| 2 | **Résolu** : `pl-11 font-score` (`DispositionPartie.tsx:72`), assertion (`reglesDuJeu.test.tsx:968`), charte `:530` |
| 3 | **Résolu** : tête en `<div>`, `closest('.bandeau-match')` + commentaire miroir, test `:939` |
| 4 (C9) | **Résolu** : `enBrefTourDuMonde(cibles)` ; P3-7 phrase neutre, testée |
| 5 | **Résolu** : `CLAUDE.md:248-251`, conforme à `labels.ts:545`, `:754` |
| 6 | **Résolu** : `rules/theme-colors.md` + garde `themeBoundary.test.ts:132` |
| 7 | Partiel → R2-2 |
| 8 | **Résolu** : tests `:1133`, `:1148`, contre-épreuves rouges |
| 9 | Résolu, suite → R2-4 |
| 10 | Ouvert → R2-1 |
| 11 | Ouvert → R2-5 |
| 12 | Résolu / consigné en dette (PROJECT_PLAN § 6) |

### Constats de la passe 2

| # | Sév. | Constat | Renvoi | Bloque le commit |
|---|---|---|---|---|
| R2-1 | Mineur | Index non régénéré (#3, #5, #12, #25, #16, #19 à fermer, #26 réduit, ligne « Les règles en entier », clé `regles`) | Orchestrator, `/refresh-architecture` | Oui |
| R2-2 | Mineur | PROJECT_PLAN : 1329 → 1340 ; § 6 sans tour 3 ni U2, « Historique » d'avant la Révision ; § 0 n° 4 périmé ; § 1.4 `suggestCheckout` « au-dessus de 170 » et `checkoutRange` / `GetCheckoutRange` absents ; liste de relecture du § 0 trop courte | Orchestrator | Oui |
| R2-3 | Mineur | README : « sous 170 », 7 bogey seulement | Utilisateur : corriger ou consigner | Non si consigné |
| R2-4 | Info | `02-dev-notes.md` sans session 6 (tour 3) | Orchestrator | Oui |
| R2-5 | Info | Étude périmée (`light`, S1 « après le lot 13 », `:398-403`) | Orchestrator | Oui |
| R2-6 | Info | `06-echanges.md` encore gabarit (lots en parallèle, rebase, conflits) | Orchestrator | Oui |
| R2-7 | Info | `--amend` : indexer `Phrase.tsx`, `useDialogueNatif.ts`, `dialogueNatif.test.tsx` et la suppression de `useFeuilleRegles.ts` ; pas de `git add -A` | Orchestrator | Oui |
| R2-8 | Info, dette | Faux négatifs de la garde des jetons (P3-8) | Prochain audit | Non |
| R2-9 | Info, dette | Doublons de parcours importé → `<li key>` en double (remarque `sec`) | Prochain audit, avec #11 | Non |
| R2-10 | Info | JSDoc de `useModaleAuRetour.ts` non retouchée (prévue en Révision 1) | Facultatif | Non |
| R2-11 | Info | CONVENTIONS § 9 « hors des branches de chargement » : sur le match, le livre vit dans la branche chargée ; sans effet | Facultatif | Non |
| R2-12 | Info | Glossaire « manche (entraînement) » sans le choix en « sorties » | Facultatif | Non |
| R2-13 | Info | « Blocages ouverts » de `00` ne liste pas DV, C, P3, U1/U2, R1-* (clôture tracée au journal) | Facultatif | Non |

Convergence, U1, U2 conformes et documentés ; **aucune question ouverte** ; invariants tenus.
Relecture à l'écran (10 points) reportée au PROJECT_PLAN § 0.

### Suites données par l'Orchestrator

- **R2-2** : PROJECT_PLAN § 0 (lot, 1340 tests, relecture complète, prochain audit), § 0 n° 4
  (fait), § 1.4 (`suggestCheckout` deux sorties, `checkoutRange`), § 2 (`GetCheckoutRange`),
  § 4 (1340), § 6 (« Historique » réécrit, U2, tour 3, README, tests et rebase).
- **R2-3** : **corrigé, choix de l'utilisateur** — README, suggestion et listes des deux sorties,
  livre ouvert.
- **R2-4** : `02-dev-notes.md` § Session 6. **R2-5** : étude (lot 11 fait, `high`, S1 corrigé,
  `:398-403` close, changements « façon DartsOn » renvoyés à une étude). **R2-8, R2-9** :
  consignés au PROJECT_PLAN § 0 « prochain audit ».
- **R2-6** : phase Échanges. **R2-1** : régénération de l'index. **R2-7** : à l'`--amend`, après
  accord. R2-10 à R2-13 : laissés (facultatifs).
