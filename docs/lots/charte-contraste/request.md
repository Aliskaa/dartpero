# Demande — charte-contraste

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-13
- **Niveau** : light
- **Commande manuelle** : `/orchestrate charte-contraste light`

## Objectif

Que le plancher de lisibilité tienne **dans les deux thèmes**. Le texte secondaire est écrit en
alpha (`text-craie/60`, `/70`…) ; une encre transparente sur papier perd bien plus qu'une craie
sur feutre. Contrastes WCAG calculés sur les tokens de `src/index.css` :

| Alpha | Sombre (pire surface) | Clair (pire surface : `feutre-nuit`) |
|---|---|---|
| 80 % | 7,81 | 5,21 |
| 75 % | 7,06 | 4,59 |
| 70 % | 6,36 | **4,10** |
| 60 % | 5,11 | **3,24** |

Et le joueur suivant lit son reste grisé (`opacity-70` sur toute la ligne inactive).

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, § Ce qui freine 1 et 2,
lot 2 du découpage ; maquette validée « A · Affiner » (`A-affiner.css`, visuels
<https://claude.ai/artifact/12w6D81HCF2AM834RX6zSi>).

## Périmètre

- **Tokens de texte pleins, une valeur par thème** dans `src/index.css` :
  - `craie` (texte principal, inchangé) ;
  - **`craie-2`** (secondaire) ;
  - **`craie-3`** (tertiaire, le plancher) ;
  - **un token « décor »** réservé aux glyphes décoratifs `aria-hidden`.
- Valeurs en **thème clair**, fixées par la maquette validée : **`craie-2` = `#354137`**,
  **`craie-3` = `#485249`**. En **sombre**, l'architecture les choisit pour reproduire les alphas
  actuels (≈ 75 % et ≈ 60 %).
- **Remplacement des 121 `text-craie/NN`** (45 fichiers de `src/ui`) :
  - 75 à 85 % → `craie-2` ;
  - 55 à 70 % → `craie-3` ;
  - sous 55 % : `craie-3` si le texte se lit (entêtes, compteurs, aides), token décor s'il est
    décoratif et `aria-hidden`.
- **Lignes des joueurs qui ne lancent pas** (`LigneJoueur`, `LigneCible`, `TableauCricket`) :
  - plus d'`opacity-70` ;
  - le nom passe en `craie-2` ;
  - le reste, les marques et les points restent en encre pleine ;
  - le halo de craie (`trace-craie`) est retiré sous leur reste. Le lanceur garde le sien.
- **Onglet actif de la barre du bas en thème clair** : laiton à 2,82:1 sur `feutre-nuit`, à
  porter à au moins 4,5:1.
- **Garde** : `tests/architecture/themeBoundary.test.ts` interdit tout `text-craie/NN` et
  `text-craie-vive/NN` dans `src/ui`.
- **Documentation** : charte § Palette et § Les trois planchers (le plancher s'exprime en
  tokens, plus en pourcentage) ; `.claude/rules/theme-colors.md` ; commentaire faux de
  `index.css:168-169`.

## Hors périmètre

- Alphas qui ne sont pas du texte : bordures (`border-craie/25`), fonds, filets.
- Éléments désactivés (`disabled:opacity-40`) : pas de contrainte de contraste.
- Cibles « mortes » du Cricket (`opacity-30`) : information d'état, à revoir au lot 6
  (`feuille-commune`).
- Halos autres que celui du reste des joueurs inactifs, échelle typographique, micro-tailles,
  mouvement : lot 3 (`charte-typo-mouvement`).
- Accents de mode : lot 6.

## Comportement visible

- **Sombre** : presque inchangé, les valeurs pleines reproduisent les alphas actuels.
- **Clair** : le texte secondaire fonce nettement (noms de partie, aides, entêtes de colonnes,
  sous-titres) ; l'onglet actif de la barre du bas devient lisible.
- **Pendant une partie** (portrait et paysage) : le reste des joueurs qui ne lancent pas est aussi
  net que celui du lanceur, sans halo ; lu à 2-3 m. Le lanceur reste distingué par son filet, son
  fond d'accent et son halo. Les noms des inactifs sont un peu atténués.

## Critères d'acceptation

1. Chaque token de texte (`craie`, `craie-2`, `craie-3`) atteint **au moins 4,5:1** sur
   `feutre`, `feutre-nuit`, `ardoise` et `ardoise-claire`, dans les deux thèmes ; en clair,
   `#354137` et `#485249` tels quels (6,1:1 et 4,7:1 sur `feutre-nuit`). Calcul WCAG consigné.
2. Plus aucun `text-craie/NN` ni `text-craie-vive/NN` dans `src/ui` ; le garde échoue si on en
   réintroduit un (contre-épreuve).
3. Plus aucune `opacity` sur les lignes inactives ; leur reste est en encre pleine et sans
   `trace-craie`, alors que le lanceur garde le sien.
4. L'onglet actif de la barre du bas atteint au moins 4,5:1 dans les deux thèmes.
5. Le token décor ne sert qu'à des éléments `aria-hidden` ; leur liste est consignée.
6. Lint, typecheck et suite complète verts.

## Contraintes

- Le thème clair ne fait que **redéfinir des valeurs** sous `html[data-theme="clair"]` ; aucune
  classe ne connaît le thème (`CLAUDE.md` § Décisions structurantes, thème).
- Tout token de couleur a sa valeur claire et s'emploie dans sa paire de rôle
  (`.claude/rules/theme-colors.md`).
- `lint:fix` sur `src tests` seulement. Pas de script qui réécrit les fichiers (un lot précédent
  a cassé l'encodage des accents ainsi).

## Dépendances

Aucune. Le lot 3 (typo et mouvement) viendra par-dessus.

## Risques

- Diff large (45 fichiers) : un glyphe mal classé texte / décor peut passer. D'où la liste
  consignée (critère 5) et la relecture à l'écran.
- En clair, les niveaux 2 et 3 se rapprochent (il faut 4,5:1 sur le papier le plus foncé) : la
  hiérarchie y repose davantage sur la taille et la graisse.

## Zones impactées

`src/index.css` ; environ 45 fichiers de `src/ui` (écrans, composants communs, composants de
mode) ; `tests/architecture/themeBoundary.test.ts` ; `docs/CHARTE_GRAPHIQUE.md` ;
`.claude/rules/theme-colors.md`.

## Attentes de validation

- Garde de test avec contre-épreuve.
- Tableau des contrastes calculés, par token, par surface et par thème.
- **Relecture à l'écran obligatoire**, portrait et paysage, sombre et clair : Accueil, Nouvelle
  partie, les quatre écrans de jeu, les résumés, Statistiques, Parties, Réglages ; sur un vrai
  téléphone en luminosité basse.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Valeurs de `craie-2` / `craie-3` en thème sombre — owner : architecture, sous la contrainte du
  critère 1.
- Nom du token décor — owner : architecture.

## Décisions prises pendant l'intake

- Tokens pleins par thème plutôt qu'alphas (direction A validée dans l'étude).
- Valeurs du thème clair reprises de la maquette validée (`A-affiner.css`).
- Sous le plancher : tri texte / décor ; le décor `aria-hidden` garde un token assumé, le reste
  remonte. Choix de l'utilisateur.
- Joueurs inactifs : nom atténué en `craie-2` (écart volontaire à la maquette, qui ne l'atténuait
  pas), reste plein. Choix de l'utilisateur.
- Halo retiré sous le reste des joueurs inactifs, comme sur la maquette. Choix de l'utilisateur.
- Onglet actif de la barre du bas ajouté (relevé par l'étude, absent de la maquette) : même
  défaut de contraste.
- Garde de test contre les alphas de texte. Choix de l'utilisateur.
- Niveau `light` : aucune surface gravée ; changement mécanique protégé par le garde, rendu jugé
  à l'écran. Choix de l'utilisateur.
