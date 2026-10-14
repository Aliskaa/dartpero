# Demande — pictogrammes

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-13
- **Niveau** : light
- **Commande manuelle** : `/orchestrate pictogrammes light`

## Objectif

Créer le **jeu de pictogrammes maison** validé sur la planche
(<https://claude.ai/artifact/CgN3pTwCt6GddUWETHde2S>) et l'employer partout où l'app a déjà une
icône équivalente : le mode de jeu se reconnaît à sa **forme**, plus seulement à sa couleur.
Origine : lot 4 du découpage de `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`
(§ Pictogrammes — validés).

## Périmètre

- **Un composant commun** dans `src/ui/composants/commun/` dessinant les 12 pictogrammes : 4 modes
  (X01, Cricket, Tour du monde, Entraînement) et 8 moments (180, bust, sortie, victoire, moyenne,
  grosses volées, meilleure manche, match nul). Grille 24, trait 2 px, extrémités et jonctions
  vives (`square` / `miter`), `fill="none"`, couleur `currentColor` seule, toujours
  `aria-hidden`.
- **Remplacements** :
  - les 4 icônes de l'étape 1 de Nouvelle partie (`EtapeJeu` : `ChevronsDown`, `Grid3x3`,
    `Globe2`, `Target`) → pictogrammes des modes, **en 40 px** (24 px aujourd'hui), à la couleur
    de leur jeu ;
  - les 5 couronnes du vainqueur (`LigneJoueur`, `LigneCible`, `TableauCricket`,
    `TableauJoueurs`, `TableauHonneur`) → « victoire », **en laiton (`text-laiton-clair`) dans tous
    les jeux** (couleur du jeu aujourd'hui) ;
  - la poignée de main du match nul (`TableauHonneur`) → « nul », **à la couleur du texte
    (craie)** (couleur du jeu aujourd'hui), taille du résumé inchangée ;
  - les 3 cibles devant une sortie (`Tableau`, `Cartouche`, `ResumeEntrainementEcran`) →
    « sortie », en vert (couleur actuelle).
- **Minimum 20 px** pour tout pictogramme : couronnes et cibles des lignes de score passent de
  14-16 px à 20 px.
- **Charte** § Identité : les pictogrammes maison (liste, dessin, couleurs, règle « un pictogramme
  dit quelque chose », minimum 20 px) ; `lucide-react` réservé aux actions.

## Hors périmètre

- Les autres usages prévus des pictogrammes, avec leurs lots : colonne de mode des lignes de
  feuille et badges « 180 » / « Sortie 121 » (lot 7), têtes de cartes des statistiques (lot 8),
  bandeau de match (lots 5 et 6), filtres de Parties, illustration de l'écran vide.
- `lucide-react` reste pour les actions (retour, annuler, corbeille, barre du bas…), pour
  `CircleOff` (« pas de finish ») et `Flag` (tour bouclé du Tour du monde) : pas d'équivalent sur
  la planche.
- Les couleurs des modes ne changent pas ici (désalignées des couleurs de profil au lot 6).

## Comportement visible

- **Nouvelle partie, étape 1** : chaque jeu montre son pictogramme **en grand (40 px)**, à la
  couleur de son jeu — cible au triple 20 (X01), marque Ⓧ (Cricket), flèche qui fait le tour
  (Tour du monde), double de sortie (entraînement).
- **Pendant une partie et dans les résumés** : le vainqueur porte la couronne maison **en laiton,
  quel que soit le jeu**, à 20 px dans les lignes ; la suggestion de sortie est précédée du
  pictogramme « sortie » en vert ; un match nul affiche « = » en craie.
- Identique en sombre et en clair (le pictogramme suit la couleur du texte), en portrait et en
  paysage.

## Critères d'acceptation

1. Les 12 pictogrammes existent dans un seul composant commun, avec la géométrie ci-dessous, en
   `currentColor`, `aria-hidden`.
2. Les 13 remplacements sont faits : plus aucun `Crown`, `Handshake` ni `Target` de
   `lucide-react` dans `src/ui`, ni `ChevronsDown`, `Grid3x3`, `Globe2` dans `EtapeJeu`.
3. Aucun pictogramme sous 20 px ; 40 px à l'étape 1.
4. Le sens ne repose jamais sur le seul pictogramme : le texte voisin ou le texte réservé aux
   lecteurs d'écran dit toujours « vainqueur », « match nul », « sortie » (ce qui l'est
   aujourd'hui le reste).
5. Le garde `themeBoundary` reste vert : aucune couleur en dur dans le composant.
6. Lint, typecheck, suite complète et build verts.
7. Couleurs de la planche : modes à la couleur de leur jeu, victoire en laiton, sortie en vert,
   nul en craie.

## Géométrie de référence (planche validée)

Grille `viewBox="0 0 24 24"`, angle 0 en haut, sens horaire ; `P(r, a)` = point au rayon `r`,
angle `a`, centre (12, 12) ; `secteur(ri, re, d, f)` = anneau de `ri` à `re`, de l'angle `d` à
`f`.

```
x01      : cercle r10 ; cercle r5 ; secteur(5,10,-20,20) plein (opacité .9) ; point r1.3 plein
cricket  : cercle r9.5 ; M7.5 7.5 L16.5 16.5 M16.5 7.5 L7.5 16.5
tdm      : arc r8.5 de 30° à 320° (grand arc, sens horaire) ; tête de flèche pleine au bout
           (triangle : bout ± 3·normale, pointe à 3,6·tangente) ; point central r2.4 plein
solo     : cercle r10 ; cercle r7 ; secteur(7,10,72,108) plein ; croix M12 9.5 V14.5 M9.5 12 H14.5 (trait 1.6)
c180     : pour x ∈ {5,12,19} : M x 21.5 V10 ; M x-2.6 3.5 L x 8 L x+2.6 3.5
bust     : cercle r9.5 ; M9 2.5 L13.5 9.5 L10 13 L15 21.5
sortie   : cercle r10 ; secteur(7,10,-24,24) plein ; M7.5 13.5 L11 17 L16.5 11
victoire : M3 18 V7 L8 12 L12 4.5 L16 12 L21 7 V18 Z ; M3 21.5 H21
moyenne  : M4 20 L15 9 ; M15 9 L20 4 M17 4 H20 V7
manche   : cercle (12,13.5) r8 ; M12 2.5 V4.5 M9.5 2.5 H14.5 M12 13.5 V9
volees   : M5 4 V20 M9 4 V20 M13 4 V20 M17 4 V20 M2.5 17 L20.5 7
nul      : M4 9 H20 M4 15 H20
```

Ajustements de proportion permis à l'écran ; trait et style inchangés.

## Contraintes

- Couleurs par tokens (`currentColor`) : aucune exception de couleur nouvelle.
- `aria-hidden` partout ; angle vif ; ni dégradé ni halo (gardes du lot 3).
- `lucide-react` reste pour les actions.
- Pas de script qui réécrit les fichiers ; `lint:fix` sur `src tests` seulement.

## Dépendances

Lot 3 (`charte-typo-mouvement`), fusionné (`6d5f56f`).

## Risques

- Couronnes et cibles de 14-16 px à 20 px : décalage possible dans les lignes de score (nom,
  compteur de manches), visible seulement à l'écran.
- Un pictogramme mal reproduit : la géométrie ci-dessus fait foi.

## Zones impactées

Nouveau composant dans `src/ui/composants/commun/` ; `EtapeJeu`, `LigneJoueur`, `LigneCible`,
`TableauCricket`, `TableauJoueurs`, `TableauHonneur`, `Tableau`, `Cartouche`,
`ResumeEntrainementEcran` ; `docs/CHARTE_GRAPHIQUE.md` ; tests UI du composant.

## Attentes de validation

- Test du composant : chacun des 12 pictogrammes se rend `aria-hidden` en `currentColor` ; un nom
  inconnu ne compile pas.
- Tests existants verts ; ceux qui cherchaient une icône `lucide` adaptés.
- **Relecture à l'écran** : étape 1, victoire dans chaque mode, match nul, suggestion de sortie,
  lignes de score avec la couronne à 20 px ; portrait et paysage, sombre et clair.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Forme de l'API (un composant `Pictogramme nom="…"`, ou un composant par pictogramme) — owner :
  architecture.
- Calcul des secteurs : réutiliser `geometrieCible.ts` (grille 100) ou des tracés fixes — owner :
  architecture.

## Décisions prises pendant l'intake

- Périmètre : composant + tout ce qui a déjà un équivalent validé (étape 1, couronnes, match nul,
  sortie) ; le reste avec ses lots. Choix de l'utilisateur.
- Minimum 20 px tenu dans les lignes de score. Choix de l'utilisateur.
- **Comme la planche validée** (choix de l'utilisateur, après relecture contre la planche) :
  40 px à l'étape 1 ; victoire en laiton dans tous les jeux ; nul en craie.
- Géométrie de la planche recopiée ici : la planche ne vit que dans un dossier temporaire de
  session.
- `CircleOff` et `Flag` restent en `lucide` (pas d'équivalent sur la planche).
- Niveau `light` : aucune surface gravée touchée.
