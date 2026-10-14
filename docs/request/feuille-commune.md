# Demande — feuille-commune

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-14
- **Niveau** : light
- **Commande manuelle** : `/orchestrate feuille-commune light`

## Objectif

Poser le Cricket et le Tour du monde sur la feuille du X01 livrée au lot 5 (`match-x01`) : même
feuille cerclée, en-têtes inversés, un filet par ligne, colonnes réelles, repère unique qui glisse,
bandeau en trois zones avec pictogramme, moment superposé. Les trois jeux se lisent alors de la
même façon à 3 m, et le Tour du monde à 4 joueurs tient enfin en portrait (865 px de page
aujourd'hui pour 844).

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 6 du § Découpage en
lots et sous-section « Lot 6 — découpage et pavé ». Référence visuelle (privée), planche du lot :
<https://claude.ai/artifact/2vma9boCLRDEjzdJMNu4fZ> (écrans 1 à 8, tableau des mesures, section
« À trancher », tranchée ci-dessous). Maquette Cricket validée antérieurement :
`5-cricket-sombre-B-feuille-commune.png` (direction B de l'étude).

## Périmètre

**Commun au Cricket et au Tour du monde**

1. **Feuille du X01** : cadre de craie, en-têtes de colonnes en inversion (`aria-hidden`), un filet
   par ligne, lignes de hauteur strictement égale (`repeat(n, 1fr)`).
2. **Repère unique qui glisse** (`translateY(index × 100 %)`, tokens de mouvement, neutralisé par
   `prefers-reduced-motion`), comme au X01 ; il remplace `.au-lancer`. `aria-current` reste l'état
   accessible, le repère est `aria-hidden`.
3. **Couleur du joueur : le carré de 12 px du X01** devant le nom (pas le liseré de la maquette).
   Noms entiers jusqu'à 4 joueurs (« MAXENCE » compris).
4. **Bandeau en trois zones**, même structure que le X01 : flèche de retour, pictogramme du jeu en
   24 px (`aria-hidden`), titre et sous-titre, zone droite ; nom de partie sur sa ligne en
   portrait, masqué en paysage ; une seule rangée en paysage.
5. **Paysage 844 × 390** : rien de coupé, touches ≥ 48 px, zones jamais empilées.

**Cricket**

6. Colonnes : JOUEUR · une colonne par cible (en-tête « B » pour la bulle) · PTS. Marques à la
   taille de la planche ; cible morte (fermée partout) marquée comme sur la planche.
7. Bandeau : titre « Cricket », sous-titre « Standard · 7 cibles » ou « Cut-throat · 7 cibles » ;
   à droite « Ferme + mène » / « Le plus bas gagne » en petites capitales de craie, **sans
   cadre** (le badge rouge du cut-throat disparaît). Le Cricket n'a ni manche ni set : rien
   d'autre à droite.
8. **Volée en cours sur une dernière ligne de la feuille** : « VOLÉE · NOM » et trois cases (à la
   place des encoches au-dessus du pavé). Avant la première fléchette, elle montre la volée du
   joueur précédent, avec son nom.

**Tour du monde**

9. Colonnes : JOUEUR (nom + volée en 3 cases sur la ligne, comme au X01) · PARCOURS 6,5 rem
   (« n/21 », barre, légende « N fléchettes » en `craie-3`) · CIBLE 7 rem, chiffre géant à
   droite (à la place du RESTE du X01).
10. Cible à 4,5 rem jusqu'à 2 joueurs, 4,05 rem à 3 et 4, 3,25 rem en paysage. La bulle comme
    cible : glyphe de cible plein + légende « BULLE ».
11. Bandeau : titre « Tour du monde » ; à droite, vide en jeu, badge « Dernier tour » quand l'état
    le dit (`lastRound`, déjà fourni par le domaine).
12. Les fléchettes qui n'avancent pas ne sont **pas** grisées.

**Moment célébré (les trois jeux, X01 compris)**

13. `MomentCelebratif` sur **une seule rangée de 44 px** (« FERMÉE ! · 19 », « 180 »…), toujours
    superposé au bas de la feuille, pour ne plus masquer la ligne du joueur qui lance (76 px
    aujourd'hui, dont 29 px sur la dernière ligne).

**Entraînement**

14. Bandeau seulement, même structure : sous-titre « 10 sorties · 41 à 170 » (plage de
    `reglesEntrainement`), « Manche 3/10 » à droite (ses `rounds`). Son cartouche ne change pas.

15. **Charte** : § Écran de match (feuille commune aux trois jeux, bandeau, moment d'une rangée).

## Hors périmètre

- Les pavés de saisie (Bulle / Hors partout, Annuler à la même place), le contraste de l'appui
  (P1) et les accents désalignés des couleurs de profil : lot 6b `pave-unifie`.
- « 601 » en paysage à 2 joueurs (N6, X01).
- Les règles au bandeau (lot 11), la volée perdue au rechargement (lot 13).
- Toute règle de jeu, tout format persisté, `CLAUDE.md`.

## Comportement visible

- **Portrait, lu à 3 m** : les trois jeux ont la même feuille ; le filet laiton glisse d'une ligne
  à l'autre ; au Tour du monde la cible géante est à droite, comme le reste au X01 ; au Cricket la
  volée s'écrit sur la dernière ligne ; le bandeau dit le jeu par son pictogramme.
- **Tour du monde à 4 joueurs** : tout tient en 390 × 844 sans défilement.
- **Moment** : une rangée sur le bas de la feuille ; la ligne du joueur qui lance reste lisible.
- **Paysage 844 × 390** : rien de coupé, bandeau sur une rangée, touches ≥ 48 px.
- **Tapé à 30 cm** : rien ne change (pavés intacts).

## Critères d'acceptation

1. Cricket et Tour du monde sur la feuille commune ; repère unique, `aria-current` sur la ligne du
   joueur actif ; `.au-lancer` n'a plus d'emploi.
2. Carré de couleur de 12 px devant chaque nom, dans les trois jeux.
3. Aucun nom rogné jusqu'à 4 joueurs (« MAXENCE ») ; aucun chiffre rogné (cible, points).
4. Tour du monde à 4 joueurs en portrait 390 × 844 : hauteur de page ≤ 844.
5. Paysage 844 × 390 : rien de coupé dans les trois jeux, cibles ≥ 48 px, bandeau sur une rangée.
6. Volée du Cricket sur la dernière ligne, avec le nom du joueur dont c'est la volée (testé :
   avant la première fléchette, joueur précédent).
7. « Dernier tour » affiché si et seulement si `lastRound` (testé).
8. Bandeau Cricket sans cadre à droite, variante selon standard / cut-throat (testé).
9. `MomentCelebratif` haut de 44 px, superposé, ne change ni la hauteur ni la position du tableau ;
   reste `pointer-events-none`, `role="status"`, `aria-live="polite"`.
10. Tout libellé nouveau dans `labels.ts` ; tokens seulement ; gardes (`themeBoundary`,
    `typographieBoundary`, `pictogrammesBoundary`), lint, typecheck, tests, build verts.

## Contraintes

- Tokens seulement, ni dégradé ni halo, angle vif ; texte français dans `labels.ts`.
- Zones lecture / saisie jamais empilées en paysage (`DispositionPartie`).
- Aucune règle de jeu touchée : l'UI lit l'état (`lastRound`, marques, points, cible courante),
  elle ne recalcule rien.
- Fakes, jamais de mocks ; `lint:fix` limité à `src tests`.

## Dépendances

Lot 5 `match-x01` (feuille, repère, bandeau, moment superposé), fusionné dans `main` (`bcb4369`).

## Risques

- Le moment d'une rangée change aussi le X01 déjà livré : relecture X01 à refaire.
- La dernière ligne « VOLÉE » ajoute de la hauteur au Cricket : vérifier le paysage à 4 joueurs.
- Lignes de hauteur égale exigées par le repère : une ligne plus haute casserait le glissement.
- Rendu (rognage, contraste, paysage) invisible en test.

## Zones impactées

`src/ui/composants/cricket/TableauCricket.tsx` ; `src/ui/composants/tour-du-monde/LigneCible.tsx`
(et le tableau du Tour du monde) ; `src/ui/composants/commun/MomentCelebratif.tsx` et le bandeau
commun ; `src/ui/ecrans/games/cricket/CricketEcran.tsx`, `tour-du-monde/TourDuMondeEcran.tsx`,
l'écran d'entraînement (bandeau) ; `src/index.css` ; `src/ui/labels.ts` ;
`docs/CHARTE_GRAPHIQUE.md`. Les pavés (`PaveCricket`, `PaveCibles`) ne bougent que pour perdre les
encoches de volée du Cricket.

## Attentes de validation

- Tests : repère et `aria-current` ; carré de couleur ; volée Cricket (nom, joueur précédent) ;
  « Dernier tour » selon `lastRound` ; bandeau Cricket standard / cut-throat ; moment hors du flux.
- **Relecture à l'écran obligatoire** : Cricket 2 et 4 joueurs, Tour du monde 4 joueurs, portrait
  et paysage (844 × 390), sombre et clair ; un moment au Cricket, au Tour du monde **et au X01** ;
  un changement de joueur (repère qui glisse) ; une fin de parcours (« Dernier tour »).

## Questions bloquantes

Aucune.

## Questions non bloquantes

| Question | Owner |
| --- | --- |
| Au Tour du monde (sans ruban), le moment de 44 px recouvre-t-il encore la dernière ligne ? Sinon, le poser sur le vide sous la feuille en portrait | Architecture, mesuré par le Dev, confirmé à la relecture |
| Composant de bandeau commun ou trois bandeaux de même structure | Architecture |
| Hauteur exacte de la ligne « VOLÉE » en paysage à 4 joueurs | Architecture / Dev |

## Décisions prises pendant l'intake

- Maquettes d'abord, puis deux lots : 6a `feuille-commune` (ce lot), 6b `pave-unifie`
  (utilisateur).
- Carré de couleur du X01 plutôt que le liseré de la maquette Cricket validée — **écart
  volontaire** avec cette maquette, pour la cohérence des trois jeux (utilisateur).
- Volée du Cricket sur une dernière ligne « VOLÉE · NOM » (utilisateur).
- Moment sur une seule rangée de 44 px, X01 compris (utilisateur).
- Le reste de la section « À trancher » comme proposé : colonnes du Tour du monde, légende
  « N fléchettes », droite des bandeaux, échelle de la cible, bulle en glyphe, fléchettes perdues
  non grisées (utilisateur).
- « Bulle » / « Hors » partout et correction de P1 : lot 6b (utilisateur).
- Niveau `light` : aucune surface gravée (UI seule, aucune règle ni format persisté).
