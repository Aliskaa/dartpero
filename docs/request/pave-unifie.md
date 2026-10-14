# Demande — pave-unifie

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-14
- **Niveau** : light
- **Commande manuelle** : `/orchestrate pave-unifie light`

## Objectif

Un seul pavé de saisie pour les quatre jeux (X01, entraînement, Cricket, Tour du monde) : mêmes
mots (« Bulle », « Hors »), mêmes tailles, Annuler au même endroit. La mémoire musculaire ne
change plus d'un jeu à l'autre. Avec lui :
- l'inversion à l'appui redevient lisible (P1, relevé au lot 5) ;
- les jeux n'ont plus de couleur à eux, qui se confondait avec celle d'un profil ; tout passe au
  laiton.

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 6 du § Découpage en
lots (6b) et § Lot 6. Référence visuelle (privée), planche du lot :
<https://claude.ai/artifact/PcAQwsEnY122TUjp9GCqgu> (§ 1 à 10, mesures, « À trancher » tranché
ci-dessous). Maquette X01 validée antérieurement : écrans de jeu, colonne « A · Affiner »
(<https://claude.ai/artifact/12w6D81HCF2AM834RX6zSi>).

## Périmètre

**Pavé commun** (placement **b** de la planche, celui de la maquette X01 validée)

1. **Disposition**, de haut en bas :
   - la grille des cibles ;
   - une rangée **Bulle · Hors · Annuler** (Bulle sur 2 colonnes, Hors sur 1, Annuler sur 2, sur
     le module 5 colonnes) ;
   - le rail **Simple / Double / Triple en pleine largeur**.

   Au Tour du monde (sans rail), la rangée Bulle · Hors · Annuler est la dernière ; Annuler y est
   donc 64 px plus bas qu'ailleurs, ce qui est accepté.
2. **X01 et entraînement** (même composant) :
   - grille 5 × 4 (1 à 20) inchangée ;
   - les touches « 25 » et « 0 » deviennent **Bulle** et **Hors** (même fléchette enregistrée
     qu'aujourd'hui) ;
   - la Bulle porte un petit « 25 » en `craie-3` en Simple, « 50 » en Double, et elle est
     **grisée** (désactivée, sans trait) en Triple.
3. **Cricket** :
   - six cibles en grille **3 × 2** dans l'ordre de la feuille (20 19 18 / 17 16 15) ;
   - Bulle et Hors dans la rangée commune ;
   - chiffres en 20 px comme ailleurs (24 aujourd'hui) ;
   - le Cricket prend le **multiplicateur gradué** du X01 (filet laiton en Double, filet + fond
     `--teinte-triple` en Triple, sur les cibles et la Bulle) ; l'exposant dit les marques
     (« ×2 », « ×3 ») en laiton.
4. **Tour du monde** :
   - grille 5 × 4 (1 à 20), pas de rail ;
   - Bulle · Hors · Annuler en dernière rangée ;
   - aucune touche armée.
5. **Mêmes tailles partout** :
   - touches de 52 px (48 en paysage), texte 20 px (18 en paysage) ;
   - mots (Bulle, Hors) en 16 px majuscules ;
   - la Bulle garde son rouge, Hors est en `craie-3`.
6. **Paysage** : le pavé est **calé en bas** (aujourd'hui centré verticalement), pour qu'Annuler
   garde sa place d'un jeu à l'autre. Zones lecture et saisie toujours côte à côte.
7. **Tour du monde, sans « S »** : les cases de volée écrivent « 17 · 16 » et non « S17 · S16 »,
   et Annuler dit « Annuler 16 ». C'est un libellé d'affichage propre au Tour du monde
   (`labels.ts`), sans toucher `Dart.label`. Un manqué reste « 0 » sur la feuille, dans tous les
   jeux.

**Appui (P1)**

8. À l'appui, le chiffre et l'exposant s'inversent lisiblement : ≥ 4,5:1 dans les deux thèmes
   (planche : 14,7:1 en sombre, 10,25:1 en clair), sur toutes les touches des pavés, Bulle, Hors
   et Annuler compris, et partout où `.touche` est employée (`JoueursEcran` compris).
   - **Cause** : l'utilitaire `text-craie-vive` (couche `utilities`) bat `.touche:active`
     (couche `components`).
   - **Seule la couleur change** : ni l'enfoncement ni sa durée.

**Accents : laiton unique, partout**

9. **Plus aucune teinte par jeu.** Le X01, le Cricket, le Tour du monde et l'entraînement
   utilisent tous le laiton, là où un accent de mode sert aujourd'hui :
   - bandeau (pictogramme, titre) ;
   - repère du joueur actif ;
   - marques fermées du Cricket ;
   - barre de parcours du Tour du monde ;
   - badges ;
   - résumés et tableau d'honneur ;
   - liseré de `CartePartie` ;
   - cartes du choix du jeu (`EtapeJeu`).

   Le jeu se dit par son pictogramme et son titre. Le mécanisme d'accent par mode
   (`accents.ts`, `--accent-*`) est simplifié ou retiré, au choix de l'Architecture.
10. **Titre du bandeau en clair ≥ 4,5:1** sur `feutre-nuit` : la planche mesure 4,25:1 pour le
    laiton actuel.
11. **Charte** : § Écran de match (pavé commun, placement, appui), palette (accents par mode
    retirés), § Composants.

## Hors périmètre

- Les feuilles du 6a (sauf le « S » du Tour du monde et la couleur des accents).
- « Hors » à la place de « 0 » sur la feuille, et « BULL » / « 25 » de `Dart.label` : inchangés.
- L'écart de durée de l'appui (90 ms dans `index.css`, 100 ms dans le tableau du mouvement) :
  préexistant, non touché.
- La refonte des cartes de partie (lot 7), les pictogrammes eux-mêmes.
- Toute règle de jeu, tout format persisté, `CLAUDE.md`.

## Comportement visible

- **Tapé à 30 cm** :
  - dans les quatre jeux, Bulle, Hors et Annuler sont sur la même rangée, aux mêmes colonnes ;
  - le rail est en pleine largeur dessous (sauf au Tour du monde) ;
  - un appui inverse la touche : chiffre foncé sur craie, lisible ;
  - au Cricket, Double et Triple armés se voient comme au X01.
- **Lu à 3 m** :
  - le repère du joueur actif, les marques fermées et la barre de parcours sont en laiton, et
    jamais de la couleur d'un joueur ;
  - au Tour du monde, les volées s'écrivent sans « S ».
- **Paysage 844 × 390** : pavé calé en bas, touches ≥ 48 px, rien de coupé.
- **Accueil et Nouvelle partie** : le liseré des cartes et les cartes du choix du jeu passent au
  laiton.

## Critères d'acceptation

1. Les quatre pavés partagent la même structure. Bulle, Hors et Annuler ont les mêmes x et
   largeurs dans les quatre jeux, et le même y dans les trois jeux à rail (mesuré). Le rail est
   en pleine largeur sous la rangée Bulle · Hors · Annuler.
2. X01 / entraînement : plus de touche « 25 » ni « 0 ». Bulle enregistre `BULL_SIMPLE` en Simple,
   `BULL_DOUBLE` en Double, et elle est désactivée en Triple. Hors enregistre `MISS` (testé, par
   les fléchettes enregistrées).
3. Cricket : six cibles en 3 × 2, Bulle et Hors dans la rangée commune ; filet / fond armés selon
   le multiplicateur (testé par l'état, pas la couleur) ; exposant des marques ; les marques
   enregistrées sont inchangées (testé).
4. Tour du monde : pas de rail ; cases de volée et Annuler sans « S » (testé).
5. Appui : le chiffre ne garde plus `text-craie-vive` à l'appui (testé par la structure CSS ou la
   classe). Contraste ≥ 4,5:1 mesuré dans les deux thèmes, enfoncement inchangé.
6. Aucun accent par mode restant (garde ou test). Le repère, les marques fermées, la barre de
   parcours, les cartes et les bandeaux sont en laiton. Titre du bandeau ≥ 4,5:1 en clair.
7. Toutes les cibles ≥ 48 px, portrait et paysage ; en paysage, pavé calé en bas.
8. Libellés dans `labels.ts` ; tokens seulement, ni halo ni dégradé, angle vif ; gardes, lint,
   typecheck, tests, build verts.

## Contraintes

- Aucune règle de jeu touchée : le pavé envoie les mêmes fléchettes qu'aujourd'hui (« Bulle » =
  25 / 50, « Hors » = `MISS`), et aucun calcul n'est fait dans l'UI.
- Tokens seulement ; une nouvelle valeur claire (titre du bandeau) se vérifie dans les deux
  thèmes.
- Fakes, jamais de mocks ; `lint:fix` limité à `src tests` ; aucune réécriture de fichiers en
  masse.

## Dépendances

Lots 5 `match-x01` (multiplicateur gradué, `--teinte-triple`) et 6a `feuille-commune` (feuilles,
bandeau, repère), fusionnés dans `main` (`9620984`).

## Risques

- **Mémoire musculaire** : « 0 » et « 25 » changent de place et de nom au X01, que les joueurs
  connaissent par cœur.
- **Annuler quitte la rangée du pouce** dans les trois jeux à rail : le rail en pleine largeur
  garde le bord bas. Au Tour du monde, Annuler est 64 px plus bas qu'ailleurs.
- **Retirer les accents** touche des écrans hors partie (Accueil, Nouvelle partie, résumés) :
  relecture plus large.
- Le laiton du repère et celui de l'état armé coexistent sur l'écran : à relire.
- Rendu (contraste, alignements, paysage) invisible en test.

## Zones impactées

- **Pavés** :
  - `src/ui/composants/x01/PaveFlechettes.tsx`, `cricket/PaveCricket.tsx`,
    `tour-du-monde/PaveCibles.tsx` ;
  - un éventuel composant commun dans `composants/commun/`.
- **Disposition et accents** :
  - `DispositionPartie.tsx` (paysage calé en bas) ;
  - `src/ui/accents.ts`, `src/index.css` (`.touche`, `--accent-*`, titre clair) ;
  - `CartePartie.tsx`, `EtapeJeu.tsx`, `TableauHonneur.tsx`, `TableauJoueurs.tsx`, les résumés,
    `BandeauMatch.tsx`, `TableauCricket.tsx`, `LigneCible.tsx`.
- **Libellés et doc** :
  - `TourDuMondeEcran.tsx` (libellé sans « S ») ;
  - `src/ui/labels.ts` ;
  - `docs/CHARTE_GRAPHIQUE.md`.

## Attentes de validation

- **Tests** :
  - fléchettes enregistrées par Bulle et Hors dans chaque jeu ;
  - Bulle désactivée en Triple ;
  - Cricket armé (état) et marques inchangées ;
  - Tour du monde sans « S » ;
  - structure commune des pavés ;
  - absence d'accent par mode ;
  - correction de l'appui (structure).
- **Relecture à l'écran obligatoire** :
  - les quatre jeux en portrait et en paysage (844 × 390), sombre et clair ;
  - un appui sur chaque type de touche ;
  - Double et Triple armés au X01 et au Cricket ;
  - Accueil (cartes) et Nouvelle partie (choix du jeu) ;
  - un résumé.

## Questions bloquantes

Aucune.

## Questions non bloquantes

| Question | Owner |
| --- | --- |
| Un composant de pavé commun, ou trois pavés qui partagent leurs rangées ? | Architecture |
| `accents.ts` et `--accent-*` : retirés, ou ramenés à une seule valeur ? | Architecture |
| Valeur claire du titre du bandeau (≥ 4,5:1) : faut-il un nouveau token ou foncer `laiton-clair` en clair ? Vérifier l'effet sur ses autres emplois | Architecture, contraste calculé |
| Où vit la correction de l'appui (une seule couche, ou une variante `active:`) ? | Architecture |

## Décisions prises pendant l'intake

- **Maquettes d'abord** (planche du lot 6b), les deux pistes d'accents montrées côte à côte
  (utilisateur).
- **Placement b**, celui de la maquette X01 validée, plutôt que a (Annuler à côté du rail) ou c
  (rail au-dessus) (utilisateur).
- **Piste A, laiton unique**, appliquée **partout**, hors écrans de partie compris (utilisateur).
  La recherche d'une teinte par jeu n'a trouvé qu'une pervenche et un anis faible.
- **Cricket comme la planche** (3 × 2, 20 px, multiplicateur gradué) : **écart volontaire** avec la
  maquette Cricket B (4 colonnes, 24 px) (utilisateur).
- **Tour du monde sans rail** (utilisateur).
- **Le reste comme proposé par la planche** (utilisateur) :
  - pavé calé en bas en paysage ;
  - Bulle 2 colonnes, Hors 1, Annuler 2 ; ordre Bulle · Hors · Annuler ;
  - « 25 » sur la Bulle en Simple ;
  - Bulle grisée en Triple ;
  - « 0 » gardé sur la feuille ;
  - « Annuler 16 ».
- « Bulle » / « Hors » partout et correction de P1 dans ce lot : décidés le 2026-10-14 au
  cadrage du lot 6.
- **Niveau `light`** : UI et tokens seulement, aucune surface gravée.
