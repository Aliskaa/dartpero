# Demande — charte-typo-mouvement

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-13
- **Niveau** : light
- **Commande manuelle** : `/orchestrate charte-typo-mouvement light`

## Objectif

Finir la direction A de l'étude `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`
(lot 3 du découpage), telle que la montre la maquette validée « A · Affiner » (`A-affiner.css`,
visuels <https://claude.ai/artifact/12w6D81HCF2AM834RX6zSi>) :

- une **échelle typographique** en tokens, sans micro-tailles ;
- des **tokens de mouvement**, et les animations existantes ramenées au tableau du mouvement
  validé (étude, § Validé par l'utilisateur) ;
- le code mis **en accord** avec la règle gravée « zéro dégradé de décor » et avec « une fiche ne
  rayonne pas » (charte) : plus de dégradé de décor, plus de halo.

Constat de départ : 44 `text-[…rem]` en dur dans `src/ui`, dont 32 sous 0,75 rem (jusqu'à
0,5 rem) ; cinq halos `shadow-[0_0_…]` ; dégradés du tapis (radiaux + grain), de l'enseigne
(`Logo.tsx`) et des reflets `eclat`.

## Périmètre

- **Échelle typographique**
  - Tokens de taille dans `@theme` ; **minimum 0,75 rem** pour tout texte.
  - Les 44 `text-[…rem]` de `src/ui` passent sur l'échelle ; les grands chiffres de score
    deviennent des tokens nommés **à leur valeur actuelle** (le lot 5 les agrandira).
  - `.entete-colonne` (0,62 rem) passe à 0,75 rem.
  - **Interlettrage resserré** là où 0,75 rem ferait déborder une colonne étroite (ex. 0,06 em
    sur les en-têtes de la colonne « Manches », comme sur la maquette).
- **Tokens de mouvement**
  - Trois durées (≈ 100 / 180 / 240 ms) et une courbe sans dépassement pour ce qui se répète.
  - `pop-score` : ≈ 200 ms, sans rebond.
  - `secousse` (bust) : plus courte et plus sèche ; le mot BUST reste écrit.
  - `eclat` **retiré** ; les moments de victoire (`MomentCelebratif`, `TableauHonneur`) tracent
    à la place **un filet vert** autour de la ligne / de la plaque gagnante.
  - Logo de l'Accueil : **un seul tour** à l'ouverture (fini `tourner-lent` infini).
  - Badge du Tour du monde (`respirer`) : fixe.
  - Enfoncement des touches : inchangé.
- **Halos : retirés partout, résumé de fin de partie compris** (sélection d'un joueur, message
  d'erreur, moment célébratif, avatar et reflet du tableau d'honneur).
- **Souffle de craie (`trace-craie`) gardé sous le reste du joueur qui lance**, comme sur la
  maquette (le lot 2 l'a retiré aux inactifs).
- **Dégradés : aucun.**
  - Tapis en **feutre uni** (plus de dégradés radiaux ni de grain).
  - **Enseigne « Dartpéro » en laiton plein**, avec son ombre de plaque.
  - Seul `chargement-balai` reste (indicateur d'attente, pas un décor), exception écrite dans la
    charte.
- **Documentation** : `docs/CHARTE_GRAPHIQUE.md` (§ Typographie : l'échelle ; § Mouvement : le
  tableau et les tokens ; dégradés et halos, avec l'exception `chargement-balai`) ;
  `.claude/rules/theme-colors.md` (aligner sur `text-craie*/NN`, laissé par le lot 2) ; journal
  du lot dans `docs/PROJECT_PLAN.md` § 6. **`CLAUDE.md` inchangé.**

## Hors périmètre

- Repère laiton qui glisse vers le joueur suivant, fondu du filet Double / Triple : lot 5
  (`match-x01`).
- Taille des scores (agrandie au lot 5), multiplicateur gradué : lot 5.
- Pictogrammes : lot 4.
- `chargement-balai` : gardé.

## Comportement visible

- **Partout** : plus de petites capitales minuscules — étiquettes, en-têtes de colonnes,
  sous-titres d'au moins 0,75 rem ; tapis uni ; aucun halo, nulle part.
- **Pendant une partie** (portrait et paysage) : le reste qui change « pulse » brièvement, sans
  rebond ; le bust secoue plus court ; une manche gagnée trace un filet vert au lieu du reflet
  qui balaie ; le chiffre du lanceur garde son léger souffle de craie.
- **Accueil** : enseigne en laiton plein ; la cible derrière fait un tour puis s'arrête.
- **Résumé de fin de partie** : plus de halo ni de reflet ; un filet vert autour du vainqueur.
- « Réduire les animations » du téléphone coupe tout, comme aujourd'hui.

## Critères d'acceptation

1. Aucune taille de texte sous 0,75 rem dans `src/ui` et plus aucun `text-[…rem]` en dur ; un
   garde de test l'interdit (contre-épreuve).
2. Durées et courbes issues des tokens de mouvement ; `pop-score` sans dépassement ; `eclat`
   n'existe plus.
3. Plus aucun `shadow-[0_0_…]` nulle part ; `trace-craie` seulement sur le reste du lanceur.
4. Plus aucun `gradient` dans `src/ui` ni `src/index.css`, à une exception écrite près
   (`chargement-balai`) ; un garde l'interdit.
5. Charte et `theme-colors.md` à jour ; `CLAUDE.md` inchangé (la règle gravée est respectée, pas
   modifiée).
6. Lint, typecheck et suite complète verts ; `prefers-reduced-motion` respecté.

## Contraintes

- Le thème clair ne redéfinit que des valeurs ; aucune classe ne connaît le thème.
- Angle vif ; couleurs en tokens (`.claude/rules/theme-colors.md`).
- Pas de script qui réécrit les fichiers (encodage des accents) ; `lint:fix` sur `src tests`
  seulement.

## Dépendances

Lot 2 (`charte-contraste`), fusionné (`dd935d1`).

## Risques

- Les micro-tailles montées à 0,75 rem élargissent des colonnes étroites (en-têtes du tableau
  X01, avatars, barre du bas) : troncatures possibles, visibles seulement à l'écran.
- Diff large : relecture à l'écran obligatoire.
- L'index `.ai/architecture-context.md` sera régénéré au démarrage (charte et `rules/` modifiées
  par le lot 2).

## Zones impactées

`src/index.css` ; environ 30 fichiers de `src/ui` (dont `Logo`, `TableauHonneur`,
`MomentCelebratif`, `Etats`, `ChoixJoueursExistants`, lignes de joueurs, écrans de jeu, `Avatar`,
`NavigationBasse`) ; `tests/architecture/` (gardes) ; `docs/CHARTE_GRAPHIQUE.md` ;
`.claude/rules/theme-colors.md` ; `docs/PROJECT_PLAN.md`.

## Attentes de validation

- Gardes de test (tailles, dégradés) avec contre-épreuves.
- **Relecture à l'écran obligatoire**, portrait et paysage, sombre et clair, tous les écrans :
  colonnes étroites et avatars ; animations (`pop-score`, bust, manche gagnée, logo) ; barre du
  bas avec la police système au maximum.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Paliers exacts de l'échelle et leurs noms — owner : architecture.
- `Avatar` xs (0,5 rem dans un carré de 22 px) : monter à 0,75 rem ou agrandir le carré — owner :
  architecture, jugé à l'écran.
- Forme exacte du filet vert — owner : architecture.

## Décisions prises pendant l'intake

- Comme sur la maquette validée, choix explicite de l'utilisateur : enseigne en laiton plein ;
  halos retirés partout, résumé compris ; souffle gardé sous le reste du lanceur ; interlettrage
  resserré dans les colonnes étroites. (Un premier brouillon gardait le dégradé de l'enseigne et
  les halos du résumé, et retirait le souffle : corrigé à la relecture contre la maquette.)
- Tapis en feutre uni. Choix de l'utilisateur.
- Taille minimale 0,75 rem, comme la maquette. Choix de l'utilisateur.
- Repère qui glisse et fondu du multiplicateur au lot 5. Choix de l'utilisateur.
- Filet vert à la place de l'éclat et autres mouvements : tableau du mouvement validé (non
  visible sur les captures).
- `chargement-balai` gardé : indicateur fonctionnel, pas un décor.
- Niveau `light` : aucune surface gravée modifiée ; la règle « zéro dégradé de décor » est
  respectée.
