# Lot `nouvelle-partie-parcours` — architecture

> Source : rapport `PASS` d'`archi-scout` (tentative 1, 2026-10-15), retranscrit sans fusion
> d'autres rapports. Entrées : `.ai/architecture-context.md`, `request.md`, planches
> `C:\Users\kevin\Documents\Flechettes\docs\maquettes\derniers\derniers.html` (piste 1, `np1`) et
> `C:\Users\kevin\Documents\Flechettes\docs\maquettes\reglages-jeux\reglages-jeux.html`.

Architecture result: PASS

## Problème

Habiller le parcours Nouvelle partie (barre d'étapes, tuiles 2 × 2, fiche de réglages par jeu,
feuille d'ordre numérotée) et remplacer l'interrupteur « Ordre aléatoire » par un geste visible
« Tirer au sort ». Aucune surface gravée : routes et trois étapes inchangées ; domaine,
événements, `backupSchema` et Dexie intacts. Le nouveau use case vit en `application`. Niveau
`light` défendable.

## Approche retenue

Habillage local de `src/ui/ecrans/nouvelle-partie/*`, plus un seul ajout côté cœur : un use case
de mélange qui réutilise `shufflePlayers` (Fisher-Yates, déjà testé). Pas d'abstraction UI au-delà
de quatre petits composants.

### Use case de tirage (cœur)

- Port driving `src/core/application/ports/driving/ShuffleOrder.ts` :
  `interface ShuffleOrder { execute(playerIds: readonly PlayerId[]): readonly PlayerId[] }`.
  Synchrone : geste immédiat, sans I/O.
- Use case `src/core/application/use-cases/ShuffleOrderUseCase.ts` :
  `constructor(private readonly random: RandomSource)`, `execute` délègue à
  `shufflePlayers(playerIds, this.random)`. Imports relatifs.
- Câblage dans `src/composition/container.ts` : `Services.shuffleOrder: ShuffleOrder`,
  `new ShuffleOrderUseCase(random)` dans `createServices`, même instance `random` que les autres
  use cases.
- Fake : aucun nouveau. `CyclingRandomSource` (`tests/fakes/index.ts`) est déjà passé à
  `createServices` par `fakeServices()` ; les tests du use case peuvent passer un `RandomSource`
  littéral.
- Le flag `shuffle` des trois commandes (`StartMatch`, `PlayCricket`, `PlayTourDuMonde`) reste ;
  l'UI cesse de le passer (défaut `false`). Dette à noter dans le PLAN.

### Hook `useNouvellePartie.ts`

- Supprimer `CLE_ORDRE_ALEATOIRE`, `ordreAleatoire` / `setOrdreAleatoire` et `tirageActif` ;
  `lancer` ne passe plus `shuffle`.
- Ajouter `tirerAuSort(mode)` : `reordonner(services.shuffleOrder.execute(selection(mode)))`.
  L'ordre mélangé s'écrit dans `partie:joueurs` (`setMemorisee`), comme un réordonnancement à la
  main, et part tel quel dans le journal.
- Jamais appelé à l'entraînement (un joueur, pas d'étape Ordre).
- Clé `partie:ordre-aleatoire` orpheline, sans nettoyage (accepté par la demande).
- Étape courante et nombre de joueurs pour la barre : dérivés des props, pas d'état.

### Composants (`src/ui/ecrans/nouvelle-partie/`)

- **`BarreEtapes.tsx`** (nouveau) — props `{ etapes: readonly string[]; courante: number;
  grisees?: number }`. Une `<ol>` de segments : fait en craie, courant en laiton avec
  `aria-current="step"`, à venir en `craie-3`. Non interactive. Tokens en paires de rôle, aucun
  `/NN` sur le texte. Trait haut de 3 px (planche).
  - Étape 1 : courant 0. Étape 2 : `1 · JEU`, `2 · JOUEURS`, `3 · ORDRE`, Ordre grisé sous
    2 joueurs ; entraînement : `1 · JEU`, `2 · RÉGLAGES`. Étape Ordre : courant 2.
  - Posée par une prop facultative `barre` d'`EnTeteEtape` (préférée, pour que les trois étapes
    ne divergent pas) ; `EnTeteEtape` garde le retour 48 px.
- **`EtapeJeu.tsx`** — `ChampNom` retiré (et `MATCH_NAME_MAX_LENGTH`). `CarteJeu` → `TuileJeu` :
  `<ul>` en `grid-cols-2`, chaque tuile un seul `<Link>` (pictogramme 36, titre, une phrase),
  `min-h` ≥ 150 px, liseré laiton. Association mode → pictogramme exportée
  (`PICTOGRAMME_PAR_MODE`) pour le test d'association (critère 3). Plus de prop `nom`.
- **`EtapeJoueurs.tsx`** — barre, `RangeeJoueurs` compacte (`n / max`, × conservé), `ReglagesJeu`
  (fiche), champ nom, puis Continuer ou Commencer. Plus de `Panneau` « Réglages », plus de ligne
  récap au-dessus du bouton, plus de `recapitulatif` local.
- **`ChampNom.tsx`** — déplacé tel quel depuis `EtapeJeu`, libellé « Nom de la partie ·
  facultatif », jamais d'`autoFocus`.
- **`RangeeJoueurs.tsx`** — rangée de pastilles + « Ajouter » (≥ 48 px, × par pastille) ;
  `versExistants` et `DialogueNouveauJoueur` restent.
- **`ReglagesJeu.tsx`** — devient la fiche : `TeteFiche` (pictogramme + récap en grand +
  sous-ligne), `LigneRegles`, `ReglesEnEntier` (bouton `aria-expanded`, état local, replié à
  l'ouverture, rend le paragraphe actuel). `PlusDeReglages`, même mécanisme, contient Sortie,
  Entrée, Sets. `switch` exhaustif sur `mode` conservé. Cricket : deux cartes boutons ≥ 48 px,
  `setVariante`. Entraînement : `ChoixSegmente` sorties + `PlageRestes` (barre statique,
  « non réglable », bornes `DEFAUT.minTarget` / `maxTarget`).
- **`EtapeOrdre.tsx`** — barre, sous-titre (jeu + réglage principal), `ListeOrdonnable` en feuille
  numérotée, bouton secondaire « Tirer au sort » (icône `Shuffle`) au-dessus de « Commencer ».
  Plus de `Bascule`, ni `ORDRE_TIRE_AU_SORT`, ni `quiCommence`.
- **`ListeOrdonnable.tsx`** — prop `tirage` retirée (poignées et rang toujours là) ; premier rang
  en laiton, liseré gauche, « COMMENCE » sous son nom (index 0). Glisser-déposer, `rangVise`,
  `ordre.ts`, annonces d'accessibilité inchangés.
- **`Bascule.tsx`** — à supprimer si plus aucun import.
- **`NouvellePartieEcran.tsx`** — passe `nom` à `EtapeJoueurs` au lieu d'`EtapeJeu` ; le nom
  reste à la racine du hook et survit au retour.

### `labels.ts`

À ajouter : libellés d'étapes (`Jeu`, `Joueurs`, `Ordre`, `Réglages`, `libelleEtape(n, nom)` →
« 1 · JEU ») ; les quatre phrases de tuile de la demande ; « Nom de la partie · facultatif » ;
« Plus de réglages · sortie, entrée, sets », « Les règles en entier », « Sortie », « Entrée »,
« Sets à gagner », « Libre », « Sur un double », « Sans » ; récap X01 en deux lignes (« 501 ·
premier à 2 manches » / « SORTIE LIBRE · ENTRÉE LIBRE · SANS SETS ») ; cartes Cricket et récap
« Cricket standard » / « Cricket cut-throat » + « 7 cibles · 20 à 15 et la bulle » ; Tour du
monde « 20 → 1, puis la bulle » + « 21 cibles · rien à régler » ; entraînement « Qui
s'entraîne », « Plage des restes », « non réglable », « N sorties » + « Restes tirés entre 41 et
170 », « N restes à sortir, une volée chacun. » ; « Tirer au sort », « COMMENCE », annonce après
tirage (réutiliser `annonceOrdre`) ; `sousTitreOrdre(mode, …)`.

À retirer s'ils n'ont plus d'import (vérifié par grep, `tests/` compris) :
`LIBELLE_ORDRE_ALEATOIRE`, `AIDE_ORDRE_ALEATOIRE`, `ORDRE_TIRE_AU_SORT`, `quiCommence`,
`reglesCarteJeu`, `recapEntrainement`, `RECAP_TOUR_DU_MONDE`, `recapCricket`, `LIBELLE_DOUBLE_*`,
`AIDE_DOUBLE_*`, `SOUS_TITRE_ETAPE_JEU`, `LIBELLE_NOM_PARTIE`, `TITRE_PANNEAU_*`.

## Décisions du contexte d'architecture concernées

- Route par étape, trois étapes, double out toujours passé à `X01Config.create` (défaut écran
  « Libre » = `false`) : inchangés.
- Nom de partie : seul un nom tapé s'écrit (`nomTape`), clé `name` absente sinon ; seul
  l'emplacement du champ change.
- Laiton unique : les couleurs de mode de la planche ne sont pas reprises (écart tranché).
- Hexagonal : tirage en `application`, via `useServices()`, jamais `Math.random` dans l'UI.
- Persistance : « Tirer au sort » écrit dans `partie:joueurs` (préférence d'appareil) ; l'ordre
  final part dans l'événement d'ouverture comme avant.

## Baseline sécu

Aucune entrée non fiable nouvelle, aucun réseau, aucun HTML brut. `/confidentialite` inchangée.

## Conformité à la planche

Planches lues en entier (HTML ; captures `verif-*.png` non ouvertes par le scout — le rendu final
se relit à l'écran).

- Barre d'étapes (3 segments ; 2 à l'entraînement), tuiles `np1`, feuille d'ordre `np1`
  (sous-titre « X01 · 501 », premier en laiton avec liseré et « COMMENCE », « Tirer au sort »
  puis « Commencer »), étape 2 (`reglages-jeux` : titre, barre, joueurs `n / max`, fiche, nom,
  bouton), fiches X01 / Cricket / Tour du monde / Entraînement : suivies.
- Bouton du bas : la planche dit « Continuer → » ; Continuer / Commencer selon le nombre de
  joueurs (comportement actuel, demande).
- Écarts tranchés par la demande : × conservé, laiton unique, barre à un joueur avec Ordre grisé.

## Questions pour l'utilisateur (rapport du scout)

1. Tirage identique à l'ordre actuel (Fisher-Yates : 1 chance sur 2 à deux joueurs) : accepté,
   ou garantir un ordre différent ? Faut-il un retour (annonce, mouvement) ?
2. Le × sur les pastilles : forme, position, libellé accessible.
3. Sous-titre de l'étape Ordre pour Cricket et Tour du monde (planche : « X01 · 501 » seul).
4. Pseudo long sous une pastille à police max : troncature ou retour à la ligne ?
5. « Tirer au sort » à l'étape Ordre seulement, pas à l'étape 2 ?
6. Après un tirage, aucun état « tiré » affiché ?
7. Aides de réglage : manches (garder `aideManches`) ; Sortie « Sur un double », Entrée, Sets
   sans texte dessiné.
8. Lignes de règles par jeu : reprendre la planche mot pour mot ?
9. Accessibilité des cartes Cricket : `radiogroup` ou `aria-pressed` ?

## Tests attendus par critère

Vitest + Testing Library, fakes, `renderWithServices`, `gestes.ts`, requêtes par rôle.

1. Routes : `tests/ui/nouvellePartie.test.tsx` adapté ; retour (`ETAT_PARCOURS`) ; choix et nom
   tapé survivent au retour (nom à l'étape 2).
2. `BarreEtapes` : `aria-current="step"` ; 3 segments Ordre grisé à un joueur ; Ordre actif à
   2+ ; 2 segments à l'entraînement ; non interactive.
3. Étape 1 : 4 tuiles dans l'ordre, 4 liens, pas de champ nom ; association
   `PICTOGRAMME_PAR_MODE` par `it.each(GAME_MODE_IDS)`, noms distincts (lève P3-1) ;
   `pictogrammesEmplacements.test.tsx` mis à jour.
4. Nom : absent à l'étape 1, présent à l'étape 2 avec « facultatif » ; tapé → `name` dans
   l'ouverture ; vide ou égal à la proposition → clé absente (`nomDePartieEcrans.test.tsx`,
   `nomDePartie.test.ts` déplacés à l'étape 2).
5. X01 : « Plus de réglages » replié par défaut (`aria-expanded=false`) ; récap dit toujours
   sortie, entrée, sets et suit chaque changement ; `doubleOut` passé (défaut `false`, journal) ;
   replié à nouveau à la réouverture.
6. Cricket : carte Cut-throat → préférence relue au remontage, `CUT_THROAT` dans le journal.
7. « Les règles en entier » : `aria-expanded`, route inchangée ; sept cibles et 21 cases dans le
   dépliant seulement.
8. `ShuffleOrderUseCase` (`tests/use-cases/`) : permutation attendue pour une suite connue, entrée
   non modifiée, 0 et 1 joueur, même résultat que `shufflePlayers`. UI : « Tirer au sort » change
   l'ordre (fake déterministe), « COMMENCE » suit le premier, « Commencer » écrit `playerIds`
   dans cet ordre, plus d'interrupteur ; réordonner après un tirage fonctionne.
   `ordreAleatoire.test.ts` gardé pour le flag `shuffle`.
9. Gardes `themeBoundary`, `accentBoundary`, `pictogrammesBoundary`, `appuiBoundary`,
   `lazyRoutes` : lancés ; couverture des nouveaux composants vérifiée.
10. `labels.ts` : ni « leg » ni « best of » dans les nouveaux libellés.

Tests existants à adapter (non exhaustif) : `nouvellePartie`, `manches`, `tourDuMonde`, `cricket`,
`entrainement`, `nomDePartieEcrans`, `installation`, `accueilPartiesRecentes`, `ordre`,
`lazyRoutes`, `horlogeBoundary`.

Angles morts : rendu de la barre, troncature à police max, contrastes, portrait / paysage, sombre
/ clair — relecture à l'écran à 1, 2 et 4 joueurs.

## Mises à jour de documentation

- `docs/CHARTE_GRAPHIQUE.md` § Composants : barre d'étapes, fiche de réglages, feuille numérotée,
  tuile de jeu ; laiton unique rappelé.
- `CLAUDE.md` § Décisions structurantes, « Nouvelle partie en étapes » et « Nom de partie » : nom
  à l'étape 2 ; « Tirer au sort » mélange visible (`ShuffleOrder`) à l'étape Ordre ; barre non
  interactive.
- `.claude/CONVENTIONS.md` § 14 (et § 5 / 7 / 8-9 si cités, vérifier à la source) :
  `ShuffleOrder`, `ShuffleOrderUseCase`, `BarreEtapes`.
- `docs/PROJECT_PLAN.md` § 4 / § 6 : le lot ; dettes « flag `shuffle` sans appelant UI », « clé
  `partie:ordre-aleatoire` orpheline ».
- `.ai/architecture-context.md` : régénéré après le lot.

## Questions ouvertes techniques (Dev, Test)

- T1. `shuffle` facultatif dans les trois commandes ?
- T2. `Bascule` utilisée ailleurs (le grep l'a vue dans `PaveSaisie.tsx`) ?
- T3. `BarreEtapes` dans `EnTeteEtape` (prop) ou après lui ?
- T4. « Plus de réglages » replié après un retour depuis l'étape Ordre.
- T5. `tirerAuSort` en gestionnaire d'événement, jamais dans un effet ni un rendu (`StrictMode`).
- T6. Retirer `tirage` de `ListeOrdonnable` : `ordre.test.ts` et glisser-déposer verts.
- T7. Forme de `recapX01` en deux lignes (objet ou deux fonctions).
- T8. Barre à police max sur 360 px : à vérifier à l'écran.

## Résolution des questions (Orchestrator, 2026-10-15)

Techniques, tranchées sur preuve :

- **T1** — Close : `shuffle?: boolean` dans `StartMatch.ts:17`, `PlayCricket.ts:23`,
  `PlayTourDuMonde.ts:23`. Ne pas le passer suffit.
- **T2** — Close : `Bascule` n'est importée que par `ReglagesJeu.tsx` et `EtapeOrdre.tsx` ;
  `PaveSaisie.tsx` n'a qu'une variable `avecBascule`. Suppression du fichier.
- **T3** — Close : prop facultative `barre` d'`EnTeteEtape`, comme le propose le rapport.
- **T4** — Close : état local de l'étape 2, démonté en changeant de route → replié au retour,
  conforme à « replié à chaque ouverture ». À tester.
- **T5, T6** — Closes : consignes au Dev, vérifiées par les tests.
- **T7** — Close : au choix du Dev, deux valeurs (`principal`, `secondaire`) dans `labels.ts`.
- **T8** — Reportée à la relecture à l'écran (angle mort déclaré, risque de la demande).
- **Q9** — Close (technique, sans effet visible) : `aria-pressed`, pattern de `ChoixSegmente`.

Produit, tranchées par la demande ou la planche :

- **Q5** — Close : demande § Périmètre 5 et planche `np1` : « Tirer au sort » à l'étape Ordre
  seulement.
- **Q6** — Close : la planche `np1` ne montre aucun état « tiré » ; la demande (§ 6) dit que l'on
  peut encore réordonner. Rien à afficher.
- **Q7** — Close : la planche garde l'aide des manches (`reglages-jeux.html:138`, `:223`), et dit
  « Les textes d'aide reprennent ceux de l'app » (`:183`). Sortie : aide de la planche en Libre ;
  en « Sur un double », l'aide actuelle du double out. Entrée et Sets : sans aide, comme la
  planche (`:227-228`).
- **Q8** — Close : textes de la planche mot pour mot (`reglages-jeux.html:228`, `:241` et
  fiches Cricket / Tour du monde).

Produit, tranchées par l'utilisateur à l'arrêt Archi → Dev (2026-10-15) :

- **Q1** — **Vrai hasard + mouvement** : le tirage peut redonner le même ordre (aucune relance) ;
  la feuille fait un **bref mouvement** à chaque tirage pour dire qu'il a eu lieu, avec les
  tokens de mouvement de la charte (court, sans rebond, sans halo ni dégradé), coupé sous
  `prefers-reduced-motion`. Annonce vocale du nouvel ordre (`output`) conservée. La forme exacte
  du mouvement se valide à la relecture à l'écran.
- **Q2** — **× comme aujourd'hui** : petit carré × en coin haut-droit de la pastille, à cheval
  sur le bord ; zone d'appui ≥ 48 px ; libellé accessible « Retirer <pseudo> de la partie »
  (libellé actuel s'il existe).
- **Q3** — **Jeu · réglage principal** : « X01 · 501 », « Cricket · Standard » / « Cricket ·
  Cut-throat », « Tour du monde » seul.
- **Q4** — **Tronqué « … »** : prénom sur une ligne, coupé à la largeur de la pastille ; nom
  complet dans le libellé accessible ; hauteur de rangée constante.
