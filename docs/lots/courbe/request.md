# Demande — courbe

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-21
- **Niveau** : high
- **Commande manuelle** : `/orchestrate courbe high`

## Objectif

Ajouter à l'écran Statistiques une carte **Évolution** : la moyenne de chaque partie dans le
temps, pour le joueur du sélecteur. Elle répond à « est-ce que je progresse ? », ce que le podium
(une comparaison entre joueurs) ne dit pas.

**Niveau `high`** : la série se calcule à côté de `career.ts`, donc dans `src/core/domain/`, une
surface gravée. `light` est interdit.

## Périmètre

1. **Carte Évolution** sous la cible et ses 4 cases, avant les cartes du podium. Elle suit le
   joueur du sélecteur et la période, comme la cible. Les cartes du podium ne changent pas.
2. **Un point par partie X01**, du plus ancien au plus récent, la dernière sélectionnée par
   défaut. Les parties en cours et abandonnées comptent, comme dans le cumul
   (`computeCareerStats`) : le dernier point se retrouve dans la carte Moyenne du podium. Classées
   par `createdAt`, comme le filtre de période.
3. **Trois mesures** par bascule, avec les libellés du podium : **Moyenne** (premier choix à
   chaque ouverture, non mémorisée), **First 9**, **Meilleure volée**.
4. **Tendance sur 3 parties** en laiton, visible dès la 3ᵉ partie. Une ligne pointillée donne la
   moyenne du joueur sur la période (Moyenne et First 9 seulement, pas Meilleure volée).
5. **Lecture au doigt** : un appui ou un glissé sur la courbe sélectionne la partie la plus
   proche. Le chiffre, « Partie N sur M · date » et l'écart de tendance suivent. Les flèches du
   clavier déplacent aussi la sélection ; la lecture est dans une zone `aria-live`.
6. **Plafond de 30 parties** : au-delà, seules les 30 dernières sont tracées et la mention
   « 30 dernières parties » apparaît sous la courbe. La numérotation reste vraie
   (« Partie 80 sur 80 »).
7. **Peu de parties** : avec 1 ou 2 parties, les points et leur chiffre seulement, sans tendance
   ni ligne pointillée, plus la phrase « La tendance apparaît à la 3ᵉ partie ». Sans aucune partie
   sur la période, la carte n'existe pas : l'écran garde « Rien sur cette période ».
8. **Pictogramme `evolution`** (20 px, `aria-hidden`) en tête de carte, dessiné d'après la planche,
   avec les gardes de `pictogrammesBoundary`.
9. **Charte** (§ Composants) : la carte Évolution est documentée. **Politique de confidentialité
   inchangée** : aucune clé `localStorage` ni donnée nouvelle.

## Hors périmètre

- La piste B (courbes de tous les joueurs sur un même axe) — écartée à l'intake.
- La mémorisation de la mesure choisie.
- Cricket, Tour du monde, entraînement (l'écran reste X01).
- Toute statistique nouvelle : `GetPlayerStats` et `CareerStats` ne changent pas.
- Le résumé de fin de partie, l'export de la courbe, la fiche joueur complète.

## Comportement visible

- Écran de consultation, lu à 30 cm, pas à 2-3 m. Portrait de référence ; en paysage (844 × 390),
  l'écran défile, aucun défilement horizontal de page, et la carte garde la largeur bornée de la
  cible.
- Changer de joueur, de période ou de mesure redessine la carte et remet la sélection sur la
  dernière partie.
- Une partie où le joueur n'a lancé aucune fléchette ne donne pas de point ; une mesure sans
  occasion s'affiche « — », jamais « 0 ». Meilleure volée ignore une partie sans volée enregistrée.
- Les points sont des carrés (angle vif). Le texte des axes reste en `craie-3`.
- Un seul joueur : pas de sélecteur, la carte s'affiche quand même.
- Dates au format court (« 21 oct »), lues sur `createdAt`.

## Critères d'acceptation

1. Un joueur à 14 parties donne 14 points, et la tendance part de la 3ᵉ.
2. Changer de joueur, de période ou de mesure redessine la carte et remet la sélection sur la
   dernière partie.
3. La tendance et la ligne pointillée égalent les totaux recalculés (points ÷ fléchettes × 3), pas
   une moyenne de moyennes. Un test de série où les deux diffèrent passe sur la pondérée.
4. À 31 parties et plus, seules les 30 dernières sont tracées, avec la mention ; la numérotation
   reste vraie.
5. Avec 0, 1 ou 2 points, le rendu suit l'état « peu de parties » décrit au périmètre.
6. Chaque valeur se lit en texte, y compris pour un lecteur d'écran ; la courbe elle-même porte un
   nom accessible (`role="img"`).
7. Le dernier point de la mesure Moyenne se retrouve dans la carte Moyenne du podium pour une
   période d'une seule partie.
8. Gardes verts : `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `lazyRoutes`,
   `horlogeBoundary`.

## Contraintes

- Rien n'est stocké : tout se rejoue depuis le journal, comme les statistiques existantes.
- UI → use cases uniquement, via un port driving fourni par `useServices()`.
- Tokens en paires de rôle, jamais d'alpha sur le texte, plancher `craie-3`, angle vif.
- Tout le français dans `labels.ts` (« manche », jamais « leg »).
- Les dates se lisent sur `createdAt` comme calendrier ; jamais `Date.now()` dans l'UI.
- Planche suivie **à l'identique**, hors écarts listés ci-dessous :
  `C:\Users\kevin\Documents\Flechettes\docs\maquettes\courbe\courbe.html` (piste A), et
  <https://claude.ai/artifact/2yDppJ3rzCZbAeLzMDBJZv>.
  - Les données de la planche sont inventées et sa moyenne est arithmétique ; l'app recalcule depuis
    les totaux, donc les chiffres affichés diffèrent légèrement.
  - La mention « 30 dernières parties » est ajoutée par ce lot, hors planche.

## Dépendances

Aucune.

## Risques

- Une surface gravée touchée (`src/core/domain/`), raison du niveau `high`.
- Une partie en cours bouge en direct et reste bruyante tant qu'elle a peu de volées : choix
  assumé, pour que la courbe reste d'accord avec le podium.
- Lecture de la base non mesurée (comme aujourd'hui) : la série relit tous les journaux.
- Rendu en thème clair et lecture au doigt : visibles à l'écran seulement.

## Zones impactées

`src/core/domain/games/x01/` (série par partie, à côté de `career.ts`) ; un port driving et son
use case dans `src/core/application/` ; `src/composition/container.ts` ;
`src/ui/ecrans/StatistiquesEcran.tsx` et la nouvelle carte (`composants/commun/` si réutilisable) ;
`Pictogramme` ; `src/ui/labels.ts` ; `docs/CHARTE_GRAPHIQUE.md` ; tests domaine, application et UI.

## Attentes de validation

- Tests de la série : ordre par `createdAt`, pondération, parties sans fléchette ignorées, plafond
  de 30, parties en cours et abandonnées comptées.
- Tests Testing Library : trois bascules, sélection au toucher et au clavier, remise à zéro de la
  sélection au changement de joueur, de période et de mesure, états « peu de parties » et plafond.
- Relecture à l'écran : portrait et paysage, sombre et clair, avec 1, 3 et 6 joueurs.

## Questions bloquantes

Aucune.

## Questions non bloquantes

| # | Question | Owner |
| - | --- | --- |
| 1 | Où loger la série : étendre `PlayerCareer` ou créer un port dédié | architecte |
| 2 | Année dans les dates si la courbe franchit un changement d'année (proposition : l'ajouter dans ce seul cas) | architecte |

## Décisions prises pendant l'intake

- **Piste A** : la courbe du joueur choisi ; la piste B est écartée (planche du 2026-10-21).
- **Suit la période** de l'écran, avec l'état « peu de parties » pour les périodes courtes.
- **Trois mesures** : Moyenne · First 9 · Meilleure volée, comme la carte du podium.
- **Tendance dès 3 parties**, sur 3 parties.
- **Mesure non mémorisée** : aucune clé de plus, donc politique de confidentialité inchangée.
- **Mêmes parties que le reste de l'écran** : en cours et abandonnées comprises.
- **Plafond de 30 parties**, avec mention et numérotation vraie.
- **Défauts proposés et validés** : sélection aux flèches du clavier, zone `aria-live`, pictogramme
  `evolution`, points carrés, niveau `high`.
