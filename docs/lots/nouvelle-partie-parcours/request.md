# Demande — nouvelle-partie-parcours

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-15
- **Niveau** : light
- **Commande manuelle** : `/orchestrate nouvelle-partie-parcours light`

## Objectif

Lot 9 de la refonte (étude `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`
§ Découpage, § Nouvelle partie). Appliquer la piste « Trois étapes, au propre » et la fiche de
réglages par jeu : on sait à quelle étape on est, l'étape 1 se lit d'un coup d'œil, chaque jeu
montre ses réglages en grand, et le tirage au sort devient un geste visible. **Les routes ne
changent pas.**

## Périmètre

1. **Barre d'étapes** en haut de chaque étape : `1 · JEU`, `2 · JOUEURS`, `3 · ORDRE` (étapes
   faites en craie, étape courante en laiton, étape à venir grisée). À l'entraînement :
   `1 · JEU`, `2 · RÉGLAGES`. **Avec un seul joueur** (X01, Cricket, Tour du monde) : les trois
   étapes restent, Ordre grisé, et le bouton dit « Commencer ». La barre ne se touche pas (on
   revient par le retour).
2. **Étape 1** : les quatre jeux en **tuiles 2 × 2** (pictogramme, titre, une seule phrase),
   ordre fixe X01 · Cricket · Tour du monde · Entraînement. Phrases de la planche :
   « Décompter 301, 501 ou 701 jusqu'à zéro pile. », « Fermer du 20 au 15 et la bulle avant les
   autres. », « Du 20 au 1, puis la bulle. », « Seul : sortir un reste tiré au sort. ». Le champ
   du nom **quitte** l'étape 1.
3. **Étape 2** : joueurs en rangée compacte (pastilles + « Ajouter », compteur `n / max`),
   **× conservé** pour retirer (écart à la planche, assumé), puis la **fiche de réglages** du
   jeu, puis le **nom de la partie** (« Nom de la partie · facultatif »), puis Continuer /
   Commencer. Le récapitulatif en petit au-dessus du bouton disparaît : il monte en tête de la
   fiche.
4. **Fiche de réglages** (`ReglagesJeu.tsx`), principe commun : pictogramme + **récapitulatif
   en grand**, mis à jour à chaque appui ; réglages en choix segmentés avec leur effet en une
   ligne ; une ligne de règles ; « Les règles en entier » **déplie** le paragraphe actuel sur
   place.
   - **X01** : score de départ et manches à gagner en évidence ; **« Plus de réglages · sortie,
     entrée, sets »**, replié à chaque ouverture, contient Sortie « Libre | Sur un double »,
     Entrée « Libre | Sur un double », Sets à gagner « Sans | 2 | 3 ». Le récap affiche
     **toujours** sortie, entrée et sets (« 501 · premier à 2 manches » / « SORTIE LIBRE ·
     ENTRÉE LIBRE · SANS SETS »).
   - **Cricket** : « Comptage » en deux cartes, Standard (« Les points sont pour soi. » /
     « Tout fermer, sans être derrière ») et Cut-throat (« Les points vont aux adversaires. » /
     « Tout fermer, le plus petit score ») ; récap « Cricket standard » / « 7 cibles · 20 à 15
     et la bulle » ; les sept cibles passent dans « Les règles en entier ».
   - **Tour du monde** : rien à régler ; récap « 20 → 1, puis la bulle » / « 21 cibles · rien à
     régler » et la ligne de règles ; le parcours en 21 cases passe dans « Les règles en
     entier ».
   - **Entraînement** : « Qui s'entraîne » (1 / 1), nombre de sorties 5 / 10 / 20, **plage
     41 – 170 en barre, « non réglable »** (place réservée au futur réglage), Commencer
     directement.
5. **Étape Ordre** : **feuille numérotée** (grand rang 1, 2, 3…, pastille, nom, poignée) ; le
   premier en laiton, liseré à gauche et « COMMENCE » sous son nom ; sous-titre « X01 · 501 »
   (le jeu et son réglage principal). Bouton secondaire **« Tirer au sort »** au-dessus de
   « Commencer ».
6. **« Tirer au sort » = mélange visible** : un appui rebat la feuille tout de suite ; on voit
   qui commence, on peut encore réordonner. L'aléa passe par un **use case** (port driving,
   `RandomSource` existant, câblé dans `container.ts`) — jamais `Math.random` dans l'UI.
   L'ordre obtenu est mémorisé comme un ordre réordonné à la main, et part dans le journal tel
   quel au lancement.
7. **Laiton unique** partout (tuiles, pictogrammes, fiche, barre de plage) : seul écart de
   couleur à la planche, dicté par le lot 6b.

## Hors périmètre

- « Rejouer » en tête de l'étape 1 (lot 10 `rejouer`), et l'ordre « de la dernière fois ».
- Le livre ouvert des règles et leur texte complet par jeu (lot 11 `regles-du-jeu`) : ce lot
  garde le dépliant actuel.
- Plage des restes réglable à l'entraînement (lot à part, plus tard).
- Toute option ou règle de jeu nouvelle ; le domaine, les événements, `backupSchema`, Dexie.
- La piste « Joueurs et ordre ensemble » (écartée : touchait les trois étapes gravées).

## Comportement visible

Portrait d'abord (écrans de préparation, tapés à 30 cm). Paysage : la grille de tuiles garde
2 colonnes et la page défile ; rien n'est coupé. Sombre et clair. Cibles ≥ 48 px partout
(tuiles, segments, poignées, ×, « Tirer au sort »). Le nom n'a jamais d'`autoFocus`.

## Critères d'acceptation

1. Les quatre routes `/nouvelle-partie`, `/:jeu`, `/:jeu/ordre`, `/:jeu/joueurs` sont
   inchangées ; le retour du téléphone ramène à l'étape précédente ; les choix et le nom tapé
   survivent au retour.
2. La barre d'étapes marque l'étape courante (accessible : `aria-current="step"`) ; 2 segments
   à l'entraînement ; 3 avec Ordre grisé pour un seul joueur.
3. Étape 1 : 4 tuiles 2 × 2, chacune un seul lien, **le bon pictogramme pour le bon mode**
   (dette P3-1 du lot `pictogrammes` levée par un test d'association).
4. Le nom de partie est à l'étape 2, et seulement là ; règle gravée intacte (seul un nom tapé
   s'écrit, clé absente sinon).
5. X01 : sortie / entrée / sets repliés par défaut, et le récap les affiche toujours ; changer
   un réglage met le récap à jour ; double out toujours passé à `X01Config.create`, défaut
   écran « Libre ».
6. Cricket : choisir une carte sélectionne la variante (mémorisée comme aujourd'hui).
7. « Les règles en entier » déplie / replie le paragraphe sur place, sans changer de route.
8. « Tirer au sort » change l'ordre affiché avec une source aléatoire fake déterministe en
   test ; « COMMENCE » suit le premier ; « Commencer » lance la partie dans cet ordre (vérifié
   dans le journal) ; plus d'interrupteur « Ordre aléatoire ».
9. Aucune couleur par mode ; gardes `themeBoundary`, `accentBoundary`, `pictogrammesBoundary`,
   `appuiBoundary`, `lazyRoutes` verts.
10. Tout le français dans `labels.ts` ; « manche », jamais « leg » ni « best of ».

## Contraintes

- Planche suivie **à l'identique** sauf les écarts tranchés ici (×, laiton, barre solo) ;
  aucun point produit tranché par un agent.
- UI → use cases ; heure par `services.clock` ; hexagonal : le tirage vit dans `application`,
  pas dans l'UI.
- Biome seul ; `lint:fix` sur `src tests`.

## Dépendances

Lots 4 `pictogrammes`, 6b `pave-unifie` (laiton unique), 7 `cartes-partie` — livrés.

## Risques

- Le flag `shuffle` des commandes `StartMatch` / `PlayCricket` / `PlayTourDuMonde` n'est plus
  utilisé par l'UI : il est **conservé** (rien ne casse, tests existants), dette à noter. La clé
  `partie:ordre-aleatoire` reste orpheline dans `localStorage` (préférence d'appareil, sans
  effet).
- « Plus de réglages » replié : un double out mémorisé pourrait surprendre — le récap toujours
  visible est la parade.
- Rendu (barre, tuiles, troncature de phrases à police max) : invisible en test.

## Zones impactées

`src/ui/ecrans/nouvelle-partie/*` (`EtapeJeu`, `EtapeJoueurs`, `EtapeOrdre`, `ReglagesJeu`,
`RangeeJoueurs`, `ListeOrdonnable`, `EnTeteEtape`, `Bascule` peut-être retirée),
`src/ui/hooks/useNouvellePartie.ts`, `src/ui/labels.ts`, un port driving + use case de tirage
dans `src/core/application/`, `src/composition/container.ts`, tests UI et use case ; charte
(§ Composants : barre d'étapes, fiche de réglages, feuille numérotée) et `CLAUDE.md` (nom à
l'étape 2, « Tirer au sort ») mis à jour par le lot.

## Attentes de validation

Tests Vitest + Testing Library pour chaque critère ; test du use case de tirage avec
`RandomSource` fake ; relecture à l'écran des quatre jeux à l'étape 2, X01 déplié, étapes 1 et
Ordre, en **portrait et paysage, sombre et clair**, à 1, 2 et 4 joueurs.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Suppression du flag `shuffle` des commandes de lancement : un lot de dette plus tard —
  owner : utilisateur.
- Trait et proportions de la barre d'étapes sur un vrai téléphone — owner : utilisateur, à la
  relecture.

## Décisions prises pendant l'intake

- Planches : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\derniers\derniers.html`
  (piste 1 ; <https://claude.ai/artifact/7sCiB2f4JSbVKUCdpjZH16>) et
  `C:\Users\kevin\Documents\Flechettes\docs\maquettes\reglages-jeux\reglages-jeux.html`
  (<https://claude.ai/artifact/SA1SE4NJMvh7o4y6pPg9wW>).
- « Tirer au sort » : **mélange visible** via un use case, pas un tirage au lancement.
- Retrait d'un joueur : **× conservé** à l'étape 2.
- Barre à un joueur : **trois étapes, Ordre grisé**.
- Couleurs : **laiton unique** (lot 6b), pas les couleurs de mode de la planche.
- Niveau **light** : aucune surface gravée touchée (routes et trois étapes inchangées, domaine
  et formats persistés intacts ; le nouveau use case est en `application`, hors liste gravée).
