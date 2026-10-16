# Lot `regles-du-jeu` — notes de dev

## Session 1 — arrêt au plafond de tours (2026-10-16)

⚠️ Le sous-agent `dev` (opus, effort du frontmatter `medium`, `maxTurns` 100) s'est arrêté à sa
**limite de 100 tours** (193 appels d'outils, ~27 min), **sans rapport**. Le lot est donc à moitié
implémenté à cet instant.

État constaté par l'Orchestrator (`git status`, `git diff --stat`) : 22 fichiers suivis modifiés
(+1334 / −192) et 11 nouveaux, dont :

- domaine et application : `checkout.ts`, `GetCheckoutRange.ts`, `GetCheckoutRangeUseCase.ts`,
  `container.ts` ;
- UI : `FeuilleRegles.tsx`, `LivreRegles.tsx`, `useFeuilleRegles.ts`, `reglesDuJeu.ts`,
  `reglagesPossibles.ts`, `labels.ts`, `BandeauMatch.tsx`, les quatre écrans de match,
  `EtapeJoueurs.tsx`, `ReglagesJeu.tsx`, `useNouvellePartie.ts`, `useX01.ts`, `Tableau.tsx`,
  `index.css` ;
- tests : `checkout.test.ts`, `checkoutRange.test.ts`, `reglesDuJeu.test.tsx`, `gestes.ts`,
  `renderWithServices.tsx`, `manches.test.tsx`, `nouvellePartie.test.tsx` ;
- docs : `CLAUDE.md` (§ Checkouts, § Règles de l'entraînement, décision « Règles au livre
  ouvert »), `CONVENTIONS.md`, charte.

Décision : le lot ne se coupe plus proprement à ce stade (domaine, UI et docs déjà entamés).
Le **même** agent est **repris** (contexte conservé, pas relancé à l'identique) avec la consigne
de finir, lancer les vérifications et rendre son rapport. Les notes définitives suivent.

## Session 2 — reprise et rapport (2026-10-16)

Le même agent, repris par `SendMessage`, a fini et rendu son rapport. Résumé fidèle ci-dessous.

### Fait

- **Domaine** (`checkout.ts`) : `MAX_CHECKOUT_FREE_OUT = 180`, `FREE_OUT_NO_FINISH` (référence de
  test), `CheckoutRange`, `checkoutRange(config)` ; `suggestCheckout` : `remaining < (doubleOut ?
  2 : 1)` → `null`, borne haute par `checkoutRange` ; S1 à 1 en sortie libre ; double et
  entraînement inchangés.
- **Application** : port `GetCheckoutRange`, `GetCheckoutRangeUseCase`, `Services.getCheckoutRange`.
- **UI, créés** : `useFeuilleRegles.ts` (état dans `location.state.regles`, même URL, état
  conservé, `navigate` au clic, fermeture `navigate(-1)` unique via `enFermeture`) ;
  `LivreRegles.tsx` (48 px, `aria-haspopup="dialog"`, `aria-expanded`, focus rendu, mesure du bas
  du bandeau pour le paysage) ; `FeuilleRegles.tsx` (`<dialog>` + `showModal()`, pas de `close()`
  en nettoyage, `close` natif → `fermer`, rubriques sous `h3`, blocs typés) ; `reglesDuJeu.ts`
  (union `ReglesDeLaPartie`, `contenuRegles`, `reglesDeLaFiche`, `reglesDeLaConfig*`) ;
  `reglagesPossibles.ts` (`SCORES`, `LEGS`, `SETS`, `SORTIES`, consigne D8).
- **UI, modifiés** : `labels.ts` (textes des quatre jeux, `TITRE_REGLES`, rubriques,
  `LIBELLE_PAS_DE_FINISH` ; retirés `LIBELLE_REGLES_EN_ENTIER`, `PARAGRAPHE_X01`,
  `PARAGRAPHE_TOUR_DU_MONDE`, `paragrapheCricket`, `paragrapheEntrainement`,
  `LEGENDE_CIBLES_CRICKET` ; `LEGENDE_PARCOURS` → `legendeParcours(n)`) ; `index.css` (neuf jetons
  avec valeur claire) ; `BandeauMatch.tsx` (prop obligatoire `regles`, livre hors `.grave`, marges
  négatives `-my-1 paysage:-mb-0.5`) ; `EtapeJoueurs.tsx` ; `ReglagesJeu.tsx` (dépliant,
  paragraphes et `CasesCibles` retirés) ; quatre écrans de match ; `useX01.ts` (`sortieMax` par le
  port) ; `x01/Tableau.tsx` (`resteAffiche <= sortieMax`).
- **Tests** : `checkout.test.ts` (S1 à 1-3 fléchettes, `null` sur un double, liste libre contre
  l'algorithme sur 1-180, `checkoutRange`) ; nouveau `use-cases/checkoutRange.test.ts` ; nouveau
  `ui/reglesDuJeu.test.tsx` (41 tests : texte selon les réglages, phrases Q1, D10, exemples rejoués
  par les vraies règles, livre sur les quatre matchs, URL inchangée, volée conservée après croix et
  retour, premier / second retour, pas de fantôme, fermeture native, focus, rubriques repliées,
  « Ce soir » à l'étape 2, « Pas de finish » 172-179 et routes à 174, 177, 180) ; `gestes.ts`
  (`locationCourante()`), `renderWithServices.tsx` (option `historique`) ; `manches.test.tsx`,
  `nouvellePartie.test.tsx` adaptés.
- **Docs** : `CLAUDE.md` (§ Checkouts, § Règles de l'entraînement, décision « Règles au livre
  ouvert ») ; charte (palette et contrastes, composants, parcours, mouvement, bandeau) ;
  CONVENTIONS § 9, 11, 13, 14 ; `rules/glossary.md`, `rules/frontend-react.md` ; `PROJECT_PLAN.md`
  § 0, 4, 6. Index non régénéré (Orchestrator).

### Écarts au plan et à la planche (ajustements, aucune refonte)

1. Marges négatives sur le livre du bandeau (D6, après mesure) : la rangée ne grandit pas.
2. Paysage à l'étape 2 : **52 %** (planche) ; au match : colonne du pavé, 46 % plafonné à 21 rem +
   zone de sécurité (344 px sur 844) — Q3 ne visait que le match.
3. Feuille du match en portrait : `top-[210px]` fixe (valeur de la planche).
4. Premier `<b>` d'une cellule « bust » en `craie-vive` (règle `.rub-corps b` de la planche).
5. `labels.ts` devient un chunk séparé (Rolldown), chargé au démarrage avec `index`.
6. `animate-monter` à l'ouverture (prévu), coupé sous `prefers-reduced-motion`, absent des captures.

### Commandes (dernière passe, rapportées par le Dev)

- `npx biome check --write src tests` : « No fixes applied » ; `npm run lint` : 284 fichiers, 0 erreur.
- `npm run typecheck` : 0 erreur.
- `npx vitest run` : **67 fichiers, 1158 tests verts** (1091 avant).
- `npm run build` : OK, précache 49 entrées (855,75 KiB) ; `npm run smoke` (premier build) : OK.
- Encodage : ni mojibake ni BOM.

### Mesures

| | Avant | Après |
|---|---|---|
| `dist` total | 1 380 201 o | ≈ 1 408 750 o (+28,5 ko) |
| Précache | 827,78 KiB | 855,75 KiB |
| JS initial | `index` 92,07 kB (gzip 29,25) | `index` 74,67 + `labels` 32,67 = 107,3 kB (gzip 34,42 ; +5,2 kB gzip) |
| CSS | 66,2 kB | 69,35 kB |

Chunk différé `LivreRegles` 9,6 kB ; `NouvellePartieEcran` 25,0 → 24,1 kB.

Bandeau (`apres-mesures.json`) : portrait courant 73 px avant et après (rangée 40, grâce aux marges
négatives ; 81 sans) ; 4 joueurs + sets + DI/DO 87 px ; paysage 49 → 51 px (rangée 42). Aucun
défilement en paysage à 3 ou 4 joueurs. ⚠️ Portrait 390 px : sous-titre X01 tronqué (« 501 ·
premier à 2 manches » 152/164 px ; « 701 · premier à 3 manches » 152/163) ; Cricket, Tour du
monde, entraînement non tronqués.

Feuille : portrait y 210 → 844 (634 px) ; paysage sous le bandeau, x 500, y 51, 344 × 339 px,
lecture entière visible.

Captures : 72 fichiers dans
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\regles\captures-dev\` (`apres-*` étape 2 et
match, portrait / paysage, sombre / clair ; `apres-texte-<jeu>.png` toutes rubriques dépliées ;
`avant-mesures.json`, `apres-mesures.json`). Serveur 5203 arrêté.

### Textes non dessinés (Q2, à relire à l'écran)

- **X01 sur un double** : « En bref » « … pile à zéro sur un double… » ; « Les sorties » « dès
  qu'il reste 170 ou moins (T20 · T20 · centre) », ligne grise « Sortie libre : 180 au plus… » ;
  fin d'exemple « Sur un double, même une troisième fléchette à 5 aurait fait bust : le zéro doit
  tomber sur un double. » ; ligne « sortie libre » des cas particuliers en gris.
- **Entrée sur un double** : la ligne de la planche en entier ; **pas** de ligne grise « entrée
  libre » (non dessinée).
- **Sets** : « Le premier à N manches gagne le set, et le premier à S sets gagne la partie. » ;
  « … un set peut en durer plus de 2N−1. » ; ligne grise « Sans sets, la partie se gagne au
  premier à N manches. »
- **Premier à 1 manche** : « Le premier à 1 manche gagne la partie. » ; ligne « À 3 ou 4
  joueurs… » retirée.
- **Cricket cut-throat** : « En bref » « … sans être devant au score : le plus petit score
  gagne. » ; « Marquer » « … à chaque adversaire qui ne l'a pas fermée » ; « Gagner » ligne
  standard en gris, ligne cut-throat complétée ; exemple « +60 pour Julien » (vert) ; questions 1-3
  inversées.
- **Tour du monde** : toutes les rubriques (plan § 6) ; exemple Sarah D18 · 3 · T17 (deux cibles,
  reste au 16), rejoué en test ; réglages « 20 → 1, puis la bulle, toujours ».
- **Entraînement** : toutes les rubriques ; exemple 81 = T19 · D12, rejoué en test ; réglages
  Sorties 5 · 10 · 20, Restes « Entre 41 et 170, toujours », Sortie « Sur un double, toujours ».

### Questions ouvertes (rapportées par le Dev)

| # | Question | Pour qui |
|---|---|---|
| DV1 | Q4 : accepter la troncature du sous-titre X01 en portrait à 390 px, ou réduire l'espacement du bandeau ? | Utilisateur |
| DV2 | Paysage 344 px : sous-titre de l'en-tête de la feuille sur deux lignes (« TELLES QUE DARTPÉRO LES / APPLIQUE ») — acceptable ? | Utilisateur |
| DV3 | Ligne grise « Entrée libre » quand l'entrée sur un double est activée ? | Utilisateur |
| DV4 | « +60 pour Julien » (cut-throat, points donnés à l'adversaire) reste-t-il en vert ? | Utilisateur |
| DV5 | Relecture des textes non dessinés | Utilisateur (relecture à l'écran) |
| DV6 | Retour Android réel (CloseWatcher) et iOS ; contraste et défilement à l'écran ; rouge / vert de la feuille à 4,2 et 3,7:1 sur `feutre-nuit` en clair (jamais posés sur l'en-tête) | Test |
| DV7 | `history.state` : un booléen de plus ; aucun HTML brut ; aucune dépendance ; `/confidentialite` inchangée | Sécurité |
| DV8 | `rules/theme-colors.md` non mis à jour ; nouveaux jetons documentés dans la charte et `index.css` seulement | Revue |

### Réponses de l'utilisateur (gate Dev, 2026-10-16)

| # | Réponse |
|---|---|
| DV1 | **Resserrer le bandeau** pour que le sous-titre X01 tienne en portrait 390 px, cible de 48 px du livre gardée → retouche Dev |
| DV2 | Sous-titre de la feuille sur **deux lignes** en paysage : accepté, rien à faire |
| DV3 | **Pas** de ligne grise « Entrée libre » (comme la planche) : rien à faire |
| DV4 | « +60 pour Julien » en **rouge** en cut-throat, vert en standard → retouche Dev |
| DV5 | Relecture à l'écran en fin de lot |
| DV6-DV8 | Transmises à Test, Sécurité, Revue |

## Session 3 — retouches DV1 et DV4 (2026-10-16)

- **DV1** : `DispositionPartie.tsx` — rangée du bandeau `gap-3` → `gap-2 paysage:gap-3` (8 px en
  portrait, 12 px en paysage), commentaire à l'appui ; `BandeauMatch.tsx` — conteneur du livre
  `-mr-1` en plus de `-my-1 paysage:-mb-0.5` (cible 48 px gardée, 8 px jusqu'au bord). ⚠️ Touche
  la rangée du bandeau des quatre modes. Sous-titre X01 en portrait 390 px : « 501 · premier à 2
  manches » 152/164 → 164/164 ; « 701 · premier à 3 manches » 152/163 → 163/163. Hauteurs
  inchangées (portrait 73 / 87 px, rangée 40 ; paysage 51, rangée 42) ; aucune troncature (Cricket
  122/122, Tour du monde 150/150, entraînement 135/135) ; aucun défilement. Mesures :
  `captures-dev\dv1-mesures.json`, captures `dv1-match-*.png`.
- **DV4** : `labels.ts` — case « +60 pour Julien » de l'exemple cut-throat en ton `bust`
  (`text-rouge-texte`) ; standard reste `ok` (vert). `reglesDuJeu.test.tsx` : assertion `'ok'` /
  `'bust'` ajoutée.
- Commandes : `biome check --write src tests` « No fixes applied » ; `npm run lint` 284 fichiers,
  0 erreur ; `npm run typecheck` 0 erreur ; `npx vitest run` 67 fichiers, 1158 tests verts ;
  `npm run build` OK, précache 49 entrées (855,82 KiB).

## Session 4 — boucle 1, tour 1, Test → Dev (2026-10-16)

Même agent repris. **C1** : `useFeuilleRegles.ts` — `enFermeture` remis à `false` à chaque
changement de `location.key` (`useEffect`), plus seulement dans `ouvrir()` ; neutralisé, les deux
tests C1 rougissent. **C10** : `tests/ui/gestes.ts` `oublierSonde()` (appelé dans `afterEach` de
`tests/setup.ts`) et `avancerTelephone()` (`navigate(1)`). **C2-C5** : 14 tests dans
`reglesDuJeu.test.tsx` (« Ce soir » lit la config : Cricket cut-throat, Tour du monde,
entraînement de 5, X01 sortie ≠ entrée, étape 2 Cricket / entraînement / X01 ; couleurs de rôle
par classe dans le DOM ; retour à l'étape 2 ; texte X01 et Cricket comparé en entier à la planche,
Q1 marquées). **C6** : `CLAUDE.md` Tour du monde « même nombre de volées », First 9 « 3 premières
volées de chaque leg » ; aucune autre occurrence à aligner. Commandes rapportées : lint 284
fichiers, typecheck 0, **1172 tests**, build OK (855,87 KiB). Non documenté alors (constat 9 de la
Revue) : un écouteur `resize` dans `LivreRegles.tsx` recalcule la mesure du bas du bandeau.

## Session 5 — Révision 1, boucle 7 (2026-10-16)

Agent `dev` **neuf** (opus, effort `medium`, `maxTurns` 100 du frontmatter), sur la branche
rebasée (`wip` `9dff1a4` sur `26a39fb`), cahier des charges = `01-architecture.md` § Révision 1.
115 appels d'outils, rapport rendu dans le plafond.

### Fait

- **Convergence** : nouveau `src/ui/hooks/useDialogueNatif.ts` (`useDialogueNatif(ouvert,
  onFermer, retour?)` → `{ boite, croix, surAnnulation, surFermeture, surAppui, surClic }`) ;
  `Modale.tsx` passe par lui sans changement de comportement (`biome-ignore` conservé) ;
  `FeuilleRegles.tsx` : `<dialog>` toujours rendu, prop `contenu: ContenuRegles | null` (ouverte
  si non nul), prop `retour`, aucune classe de `display` sur le `<dialog>` (conteneur
  `flex h-full flex-col`), tête en `<div>`, voile partagé (U1) ; `LivreRegles.tsx` :
  `useModaleAuRetour('regles', ['ouverte'] as const)`, `contenuRegles` calculé seulement ouvert,
  `retour={bouton}`, mesure par `closest('.bandeau-match')` ; **`useFeuilleRegles.ts` supprimé**
  (aucune occurrence hors `docs/lots/`) ; un seul `LIBELLE_FERMER` (celui de `main`).
- **Constats** : 2 (`DispositionPartie.tsx` `pl-11`, calcul en commentaire, repère
  `.bandeau-match` commenté) ; 4 / C9 (`enBrefTourDuMonde(cibles)` dans `labels.ts`) ; 5
  (`CLAUDE.md` § Entraînement) ; 6 (`rules/theme-colors.md` « Jetons réservés », garde dans
  `themeBoundary.test.ts` avec témoin) ; 7 (PROJECT_PLAN § 0, § 4, § 6, note close) ; 8 (tests) ;
  12 (`Phrase` commune `composants/commun/Phrase.tsx`, `PhraseFiche` dans `ReglagesJeu.tsx`,
  CONVENTIONS § 14 « 13 hooks », `it.each(GAME_MODE_IDS)`).
- **Docs** : `CLAUDE.md` « Règles au livre ouvert » (même mécanisme que la `Modale`, « Fermée par
  la croix, Échap, le retour ou un appui à côté ») ; CONVENTIONS § 9 (une puce, U1 = b, marques
  « À FUSIONNER » retirées), § 11, § 14 ; `rules/frontend-react.md` ; charte § Palette,
  § Composants, § Écran de match.
- **Tests** : `tests/ui/dialogueNatif.test.tsx` (9 tests : focus au montage fermé, ✕ à
  l'ouverture, `retour` même sans focus, `retour` prioritaire, sans `retour` → origine, `cancel`
  relayé une fois, `close` relayé seulement ouvert, appui à côté, StrictMode) ;
  `reglesDuJeu.test.tsx` (test 599-611 adapté « rien ne reste ouvert » ; discipline de la `Modale`,
  U1 voile portrait et paysage, appui dans la feuille / bordure / glisser sans fermeture, U2
  réouverture et ancien format `regles: true` sans effet, constat 8, C9) ;
  `themeBoundary.test.ts` (garde + motif) ; `nouvellePartie.test.tsx` ; `renderWithServices.tsx`
  (entrée d'historique avec état, pour U2). `modale.test.tsx`, `modaleAuRetour.test.tsx`,
  `statistiquesPodium.test.tsx` **non modifiés**, verts.

### Écarts au plan (ajustements)

1. `useDialogueNatif` renvoie aussi `surAppui` / `surClic` (U1) ; le `biome-ignore` reste sur
   chaque `<dialog>` (il porte sur le JSX).
2. « Contenu seulement ouvert » par la prop `contenu: ContenuRegles | null` au lieu d'`ouverte`.
3. **Repli C9, écrit sous Q2-A, à relire** : « On valide les cibles dans l'ordre : **1, 2 et 3**. »
   ou « Une seule cible : **la bulle**. », puis « Celui qui boucle le tour avec le moins de
   fléchettes gagne. » ; un parcours descendant de 1 en 1 garde la phrase de la planche (nombres
   lus dans `cibles`, « puis on finit sur la bulle » seulement s'il finit sur la bulle).
4. `renderWithServices` accepte une entrée avec état (rétrocompatible).
5. Charte bandeau : « paysage 49 → 51 px » repris de la Revue ; portrait non re-mesuré.

### Vérifié par l'Orchestrator

| Commande | Résultat |
|---|---|
| `npm run lint` | 297 fichiers, 0 erreur |
| `npm run typecheck` | 0 erreur (doublon `LIBELLE_FERMER` résolu) |
| `npx vitest run` | **74 fichiers, 1329 tests verts** |
| `npm run build` | OK, précache 50 entrées (871,34 KiB) |

Contre-épreuves (restauration octet pour octet, `git diff` identique vérifié) : `surAnnulation`
sans `preventDefault` **rouge** (3) ; `retour` ignoré **rouge** (3) ; `close` relayé sans
condition **rouge** (2) ; `closest` sur un sélecteur inexistant **rouge** (1) ; `sets` de la
config → 1 **rouge** (1) ; `sets` de la fiche → 1 **rouge** (1) ; `score` → 501 **rouge** (1) ;
« En bref » du Tour du monde sur le parcours par défaut en dur **rouge** (4) ; `open:flex` sur le
`<dialog>` **rouge** (1). Non lancée : `<header>` remis (la balise fermante rendrait le JSX
invalide ; test « pas de `header` » présent).

### Questions ouvertes

- Repli C9 (écart 3) : relecture par l'utilisateur → ajouté à la relecture à l'écran (DV5).
- Compte « 13 hooks » (CONVENTIONS § 14) et clés en usage `parcours`, `liste`, `regles` (§ 9) :
  **vérifié par l'Orchestrator** — 13 fichiers `use*.ts` dans `src/ui/hooks` (+ `tourDeTable.ts`) ;
  clés : `ETAT_PARCOURS` (`chemins.ts:47`), `CLE_LISTE` (`StatistiquesEcran.tsx:475`),
  `CLE_REGLES` (`LivreRegles.tsx:35`) — liste exhaustive.
- Captures avant / après **non faites** (port 5203 jamais ouvert) : relecture à l'écran.
- Angles morts : conteneur `flex h-full flex-col` (défilement du corps), `animate-monter` qui
  rejoue, voile transparent en paysage qui ferme sur un appui sur les scores, `pl-11` dans les
  quatre modes, R1, R2, iPhone.

## Session 6 — boucle 1, tour 3, Test → Dev (2026-10-16)

Agent de la Révision 1 repris, sur `03-plan-de-test.md` § Passe 3.

- **P3-1** : `DispositionPartie.tsx:72` `pl-11font-score` → `pl-11 font-score` (l'espace avait
  été perdue à la correction du constat 2) ; grep de `src/ui` : aucun autre collage ; test
  « P3-1 : le nom de la partie garde son retrait et sa police »
  (`toHaveClass('pl-11', 'font-score', 'truncate')`).
- **P3-2** : glisser parti du voile et lâché dans la boîte (bordure, contenu) — tests dans
  `dialogueNatif.test.tsx` et `reglesDuJeu.test.tsx`.
- **P3-3** : test « sans `display` » qui retire toute variante.
- **P3-4** : stub de `getBoundingClientRect` du `.bandeau-match` → `--haut-feuille` `51px`, puis
  `60px` après `resize` (remplace l'assertion `0px`).
- **P3-5** : U2 sur la pile `['/', partie, partie + regles]`.
- **P3-6** : `<strong>` et `classeFort` de `Phrase` vérifiés dans la feuille et dans la fiche.
- **P3-7** (tranché par l'utilisateur) : `motCible`, `parcoursDescendant` dans `labels.ts` ;
  « En bref » et « Ce soir » partagent la détection de la forme du domaine (descente de 1 en 1 sur
  au moins deux nombres, bulle facultative à la fin) ; tout autre parcours : « Le parcours de cette
  partie : **‹liste›**. Celui qui boucle le tour avec le **moins de fléchettes** gagne. » ; `MISS`
  et bulle par les libellés existants ; `it.each` sur six parcours (`[1, 2, 3]`, `['BULL']`,
  `['MISS']`, `[20, 'MISS', 19]`, `[20, 'BULL']`, `[7]`), aucun texte avec `undefined`, `MISS` ni
  « on descend ». **Écart signalé** : `legendeParcours` passe par `pluriel` et compte les cases de
  la grille sans `MISS` (« 1 case » ; « 0 case » pour `['MISS']`, à relire).
- Contre-épreuves du Dev (sources restaurées) : `pl-11font-score`, second `surLeVoile` retiré,
  `>= 2` → `>= 1`, écouteur `resize` retiré, `.bottom` → `.top` — toutes rouges.
- Commandes : lint 297 fichiers 0 erreur ; typecheck 0 ; **74 fichiers, 1340 tests** ; build OK
  (précache 50 entrées, 871,58 KiB) ; encodage propre. Revérifié par l'Orchestrator
  (`03-plan-de-test.md` passe 4), contre-épreuves P3-3 et P3-1 rouges.

Reste : régénérer `.ai/architecture-context.md` (Orchestrator), relecture à l'écran ; captures du
README non refaites (hors périmètre).
