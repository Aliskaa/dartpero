# Demande — shanghai

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-20
- **Niveau** : high
- **Commande manuelle** : `/orchestrate shanghai high`

> Écrite le 2026-10-19 après intake : règles validées par l'utilisateur (un seul point modifié par
> rapport aux défauts proposés : **7 tours fixes**, pas de réglage à 20). Validée le 2026-10-20 (planche
> retenue, puis confirmation explicite du lot `shanghai`, `docs/request/shanghai.md`). Décision du
> 2026-10-20 : **lancé en parallèle du lot `killer`**, dans un worktree (`.claude/skills/orchestrate/
> PARALLELE.md`), depuis `main` sans Killer. Conflits attendus au rebase avec `killer` (`games/index.ts`,
> `MatchEvent`, `backupSchema`, `labels.ts`, `container.ts`, étape 1 à 6 tuiles) : garder les deux apports.

## Objectif

Ajouter le **Shanghai**, sixième mode de jeu de Dartpéro, pour jouer à plusieurs autour d'un seul
téléphone : sept tours, une cible par tour (1, 2, 3… jusqu'à 7), tout le monde vise la même ; on cumule
des points, et on gagne soit à l'éclair en réussissant un « Shanghai » (simple + double + triple du
numéro du tour dans la même volée), soit au plus haut score après le tour 7. Les règles ci-dessous sont
la version proposée puis validée par l'utilisateur. Elles sont la spécification du lot — aucune n'est à
improviser.

## Règles validées par l'utilisateur

1. **Joueurs** : 2 à 6, pas de solo.
2. **Tours** : **7 tours fixes**, du tour 1 au tour 7, dans l'ordre. Pas de réglage (ni 20 tours, ni
   autre durée). Tous les joueurs jouent la **même cible** à chaque tour : le numéro du tour.
3. **Points** : seul le numéro du tour compte. Simple = N, double = 2N, triple = 3N (N = numéro du tour).
   La bulle, tout autre segment et un `MISS` valent 0.
4. **Score** : cumulé sur les tours. **Jamais de bust** : une volée ne fait jamais reculer.
5. **Volée** : toujours 3 fléchettes (rien ne l'arrête avant, puisqu'un Shanghai se réalise à la 3e
   fléchette).
6. **Shanghai** : un joueur qui touche, dans une même volée, le **simple, le double et le triple** du
   numéro du tour, **dans n'importe quel ordre**, gagne **immédiatement la partie**, à **n'importe quel
   tour**. La fléchette qui le réalise ouvre la `BoiteConfirmation` « Valider la sortie » à son nom ;
   rien n'est écrit, dit ni célébré avant (acquis du lot `annulation-volee`).
7. **Fin normale** : après la volée du dernier joueur au tour 7, **le score le plus haut gagne**. La
   fléchette qui termine la partie ouvre aussi la boîte de confirmation.
8. **Égalité en tête** : **match nul**. La boîte de confirmation porte alors un libellé « Égalité ? »
   (libellé exact à valider sur la planche). **Pas de phrase de victoire en nul.**
9. **Classement** : le joueur au Shanghai est 1er, puis les autres par score décroissant ; **égalités
   possibles** (deux joueurs au même score ont le même rang).
10. **Hors statistiques de carrière** (comme le Cricket, le Tour du monde et le Killer).
11. **Saisie** : le pavé fléchette par fléchette standard du projet, avec la bascule S/D/T momentanée
    (indispensable : le Shanghai exige simple, double et triple). Aucun pavé nouveau.
12. **Voix** : un seul `say` après « Valider la sortie » / validation de la volée : les points de la
    volée, « Shanghai ! » le cas échéant, puis la phrase de victoire (lot `phrases-victoire`,
    `phraseVictoire(matchId)`) **hors nul**.
13. **Rejouer** : configuration = mode + joueurs (aucun réglage à reprendre) ; le nom n'est jamais repris.

## Périmètre

- Un mode de jeu complet, à côté de X01, Tour du monde, Cricket, Killer et l'entraînement, **par la
  couture `GameMode`** : dossier `src/core/domain/games/shanghai/` (config, règles, état), événement
  d'ouverture propre, `GAME_MODE_IDS`, `AnyMatchState`, `modeOf`, aiguillages de `games/index.ts`. Ce
  sera la quatrième preuve que la couture accueille un mode sans refonte.
- Application : use cases et ports du mode (lancement, volée, annulation, relecture), câblés dans
  `src/composition/container.ts`.
- Format persisté : événement(s) du mode, lecture dans `backupSchema` au **même lot** (export / import).
  Pas de nouvelle table Dexie prévue : le journal suffit.
- UI : hook de mode (`useShanghai`), écran de partie `ecrans/games/shanghai/`, résumé de fin de partie,
  carte de partie (`vueCarte`), tuile à l'étape 1 de Nouvelle partie, étape 2 (joueurs et nom, sans
  réglage de durée), feuille de règles (`reglesShanghai` dans `labels.ts` + prop `regles`), annonces
  vocales.
- Nouvelle partie : sixième tuile de l'étape 1 (la grille passe à 6 tuiles avec l'entraînement, à
  re-maquetter après `killer`), `Rejouer` (les configurations Shanghai sont rejouables), Parties /
  Accueil (filtre et cartes par mode).
- Mise à jour de la documentation dans le même lot (voir Zones impactées).

## Hors périmètre

- Aucune statistique de carrière pour le Shanghai (rien dans `statistiques:joueur`).
- Pas de solo, pas de durée réglable (20 tours ou autre), pas de variante de score (bulle comptée,
  doublage, « triple ruiné »…), pas de handicap.
- Pas de mécanisme d'ordre nouveau : étape Ordre et « Tirer au sort » existants.
- Les autres jeux (Around the Clock, etc.) restent hors v1.
- Aucun réseau, aucun compte : rien ne touche `/confidentialite` sauf si une donnée nouvelle est
  stockée hors journal (à vérifier par l'architecte).

## Comportement visible

À l'écran (planche à produire et valider avant le lot, voir Questions bloquantes) :

- **Lecture à 2-3 m** : le **numéro du tour** (cible commune) est géant, avec l'indication du tour
  (« Tour 3/7 ») ; une ligne par joueur, de 2 à 6, avec son **score** lisible à distance, le joueur à la
  ligne de lancer repéré comme dans les autres modes. À 6 joueurs en paysage, les lignes tiennent sans
  défilement.
- **Saisie à 30 cm** : le pavé fléchette par fléchette du projet, cibles ≥ 48 px, bascule S/D/T
  momentanée. Aucun pavé nouveau.
- **Portrait et paysage** : lecture et saisie dans deux zones nettement séparées, jamais empilées en
  paysage (`DispositionPartie`).
- **Pendant la volée** : l'état affiché inclut la volée en cours (points marqués, progression vers le
  Shanghai : quelles parties du numéro — simple, double, triple — sont déjà touchées).
- **Fin de partie** : la fléchette qui réalise le Shanghai, ou celle qui boucle le tour 7, ouvre
  « Valider la sortie » (nom du **gagnant**) ou « Égalité ? » en nul ; fermer sans choisir vaut
  *Corriger*. Puis résumé avec le classement.
- **Annuler** : retire la dernière fléchette jouée, quel que soit le joueur, y compris à travers un
  changement de tour et la fléchette qui boucle (état dérivé du journal et de la volée rouverte,
  `ReopenedVisit`).
- **Voix** : un seul `say` par fin de volée ; phrase de victoire dans le même `say` que le résultat, hors
  nul ; rien avant « Valider la sortie ».
- **Étape 2 de Nouvelle partie** : joueurs et nom de la partie (facultatif) ; aucune fiche de réglages
  de durée (mise en page de l'étape à trancher sur la planche).

## Critères d'acceptation

1. Une partie Shanghai se crée avec 2 à 6 joueurs ; 1 joueur est refusé.
2. La partie compte 7 tours ; au tour N, tous les joueurs ciblent N, dans l'ordre de passage.
3. Simple, double, triple du numéro du tour valent N, 2N, 3N ; la bulle, tout autre segment et `MISS`
   valent 0 ; le score est cumulé et ne recule jamais.
4. Une volée compte toujours 3 fléchettes ; il n'y a pas de bust.
5. Simple + double + triple du numéro du tour dans une même volée, dans n'importe quel ordre, déclare un
   Shanghai ; deux seulement des trois, ou le même type répété, n'en font pas un (tests des deux côtés).
6. Un Shanghai gagne immédiatement, à n'importe quel tour y compris le 7e ; il prime sur le score ; la
   fléchette qui le réalise ouvre « Valider la sortie » à son nom ; rien n'est écrit, dit ni célébré
   avant.
7. Sans Shanghai, la partie se termine après la volée du dernier joueur au tour 7 : le score le plus haut
   gagne ; la fléchette qui termine la partie ouvre la boîte de confirmation.
8. Une égalité en tête donne un match nul ; la boîte porte le libellé d'égalité validé sur la planche ;
   aucune phrase de victoire en nul.
9. Le classement place le joueur au Shanghai 1er puis les autres par score décroissant ; deux joueurs au
   même score ont le même rang.
10. Le mode ne produit aucune statistique de carrière et n'apparaît pas dans les statistiques des
    joueurs.
11. « Annuler » restitue exactement l'état d'avant la dernière fléchette (score, tour, joueur courant,
    progression du Shanghai), y compris à travers un changement de tour, la fléchette du Shanghai et la
    fléchette qui boucle le tour 7.
12. La voix (points de la volée, « Shanghai ! », phrase de victoire hors nul) n'est dite qu'après la
    validation, en un seul `say` ; rien à l'entraînement ni sur une volée annulée.
13. Une sauvegarde exportée contenant une partie Shanghai s'importe à l'identique ; une ancienne
    sauvegarde (sans Shanghai) s'importe toujours ; un journal Shanghai incohérent est refusé sans
    planter.
14. La feuille de règles Shanghai décrit **exactement** les règles appliquées.
15. L'écran de partie est lisible en portrait et en paysage de 2 à 6 joueurs, cibles ≥ 48 px, sans texte
    sous le plancher de contraste de la charte, thèmes sombre et clair.
16. Une partie Shanghai apparaît dans l'Accueil (cartes, « Reprendre »), Parties et « Rejouer » ;
    « Abandonnée » reste dérivée ; le nom de partie (facultatif) fonctionne comme pour les autres modes ;
    la configuration rejouée est mode + joueurs, sans le nom.
17. Lint, types et toute la suite de tests passent ; les règles ont des tests des deux côtés des cas
    limites (voir Attentes de validation).

## Contraintes

- Architecture hexagonale : `src/core/domain/` sans import externe ; `games/shanghai/` n'importe jamais
  un autre mode ; services transverses uniquement.
- Aucun `Date`, `Math.random`, `localStorage` dans le cœur.
- Journal en ajout seul, facultatif absent = clé absente, clés persistées jamais renommées,
  `backupSchema` mis à jour dans le même lot (`rules/persistence.md`).
- L'état affiché est une **projection** rejouée depuis le journal + la volée en cours ; pas d'état
  caché.
- Vocabulaire : « tour », « Shanghai », « score » en français à l'écran ; le code reste en anglais
  (`rules/glossary.md`).
- Charte : planche suivie à l'identique, tokens en paires de rôle, zéro rayon, zéro dégradé, cibles
  ≥ 48 px, plancher de contraste (CHARTE § Palette, § Les trois planchers).
- Le thème et la disposition portrait / paysage passent par `DispositionPartie` ; aucune règle de jeu
  improvisée par l'architecte ou le développeur.
- Biome seul ; TypeScript strict ; tests avec fakes, pas de mocks.

## Dépendances

- **Ordre avec `killer`** : Shanghai vient **après la fusion du lot `killer`** (mêmes fichiers touchés :
  `games/index.ts`, `MatchEvent`, `backupSchema`, `container.ts`, `labels.ts`, étape 1 de Nouvelle
  partie, `Pictogramme`, `PartieEcran`). Il part de `main` et se branche sur le brouillon de volée
  (`volee-partielle`, à vérifier fusionné) : `useShanghai` en est un hook de plus. À l'écriture de cette
  demande, `killer` n'est pas encore lancé (demande seule, pas de branche `lot/killer`).
- Les lots `annulation-volee` (`ReopenedVisit`, `sortieEnAttente` dérivé, `BoiteConfirmation`) et
  `phrases-victoire` sont des acquis (à vérifier fusionnés avant de partir).
- Une planche (maquette) validée de l'écran de partie et de l'étape 2.

## Risques

- **Surface gravée multiple** : domaine, couture `GameMode`, format persisté (`MatchEvent`,
  `backupSchema`), décisions de `CLAUDE.md` → niveau `high`, `light` interdit.
- `CLAUDE.md` dit « Killer et Shanghai restent **hors périmètre v1** » : ce lot lève cette réserve pour
  Shanghai, en connaissance de cause. À mettre à jour dans le même lot (la phrase aura déjà été
  retouchée par `killer` : relire avant d'éditer).
- **Détection du Shanghai dans la volée en cours** : simple + double + triple du même numéro, ordre
  libre, à partir de la volée non enregistrée ; risque de divergence entre l'état affiché et l'état
  rejoué depuis le journal. Une volée de 3 fléchettes ne peut réaliser un Shanghai qu'à la 3e : vérifier
  qu'aucune fléchette « tardive » ne reste à saisir.
- **Deux fins possibles** (Shanghai à n'importe quel tour, fin au tour 7) et un **nul** : la boîte de
  confirmation a trois formes (gagnant au Shanghai, gagnant au score, égalité) ; l'annulation doit
  traverser les trois.
- **Classement à score inégal en volées jouées** : un Shanghai précoce laisse les autres joueurs à un
  nombre de volées différent (le tour en cours n'est pas fini) ; le classement des autres suit leur
  score tel quel, à afficher sans trompe-l'œil. Détail à fixer sur la planche.
- **Étape 1 à 6 tuiles** (5 jeux + entraînement) : la grille issue de `killer` (option B,
  entraînement pleine largeur) est à re-maquetter ; risque de défilement sur petit écran.
- **Lisibilité à 2-3 m** de 6 lignes en paysage téléphone avec le numéro du tour géant : à trancher sur
  la planche, pas à l'écran.
- **Garde absente** : le test de `Rejouer` n'a pas de `GAME_MODE_IDS` ni de `switch` exhaustif
  (constat #31 de l'index) ; `killer` doit l'avoir ajouté, vérifier que Shanghai y passe.
- Politique `/confidentialite` : à relire seulement si une donnée nouvelle est stockée hors journal.

## Zones impactées

- `src/core/domain/games/shanghai/` (nouveau), `src/core/domain/games/index.ts` (couture),
  `src/core/domain/events/MatchEvent.ts` (événement d'ouverture et de volée du mode).
- `src/core/application/` : ports et use cases du mode ; `backupSchema.ts` ; use cases de lecture
  touchés par un nouveau mode (cartes, résumés, `GetReplayableConfigurations`, `matchStatus`).
- `src/composition/container.ts` (câblage).
- `src/ui/` : `useShanghai`, `ecrans/games/shanghai/`, résumé, `PartieEcran` (aiguillage), Nouvelle
  partie (étape 1, étape 2), `labels.ts` (libellés, règles, annonces vocales, phrases), `Pictogramme`
  (tracé du mode), cartes de l'Accueil et de Parties, composants communs éventuels de la charte.
- `tests/` : domaine (règles), application, ui, architecture (gardes de modes), `backupSchema`.
- Documentation : `CLAUDE.md` (décision « modes de jeu », règles du Shanghai, « hors v1 »),
  `.claude/CONVENTIONS.md` § 13 (« comment ajouter un mode » : quatrième preuve) et §§ 5, 9, 10 si
  touchés, `docs/PROJECT_PLAN.md`, `docs/CHARTE_GRAPHIQUE.md` (écran de match Shanghai),
  `.claude/rules/glossary.md` (Shanghai, tour), index `.ai/architecture-context.md` (à régénérer par
  `/refresh-architecture`).

## Attentes de validation

- **Tests de règles** (domaine, avec fakes) des deux côtés de chaque cas limite : simple / double /
  triple du numéro du tour vs autre numéro, bulle, `MISS` ; Shanghai complet (les six ordres possibles)
  vs deux sur trois vs même type répété ; Shanghai à la 3e fléchette ; Shanghai au tour 1, au tour 7 ;
  Shanghai qui prime sur un score plus haut ; fin au tour 7 sans Shanghai ; égalité en tête (nul) vs
  victoire d'un point ; classement avec égalités ; 2, 3, 6 joueurs ; score cumulé sans recul.
- Tests d'annulation fléchette par fléchette à travers un changement de tour, la fléchette du Shanghai et
  la fléchette qui boucle le tour 7 (gagnant et nul).
- Tests d'export / import : partie Shanghai, ancienne sauvegarde, journal incohérent.
- Tests UI : parcours Nouvelle partie (tuile, étape 2 sans réglage de durée), écran de partie,
  confirmation de sortie (trois formes), voix muette avant validation et sans phrase de victoire en nul,
  cartes, Rejouer (mode + joueurs, nom non repris), garde exhaustive des modes.
- **Relecture à l'écran, sur téléphone** (obligatoire : le rendu change) : portrait et paysage, 2 et 6
  joueurs, thèmes sombre et clair, lisibilité du numéro du tour et des scores à 2-3 m, cibles ≥ 48 px ;
  une partie complète jusqu'à « Valider la sortie » (par Shanghai, par le score, en nul) ; « Annuler » à
  travers un changement de tour.
- Suite complète verte (lint, types, tests) ; documentation mise à jour dans le même lot.

## Questions bloquantes

Aucune : la planche est produite et validée (voir « Planche » ci-dessous).

## Planche

Planche : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\shanghai\shanghai.html` (captures PNG dans
le même dossier ; `verif.cjs` les relance ; dépôt principal, ignoré par git). Les architectes la suivent
à l'identique. Choix de l'utilisateur (2026-10-20), qui a retenu les recommandations de la planche :

- Boîte d'égalité : **« Égalité ? »** (« Kevin et Sarah finissent à 98 points. C'est un match nul dès
  que vous validez. »), bouton **« Valider la sortie »** aux trois formes.
- Pictogramme : **escalier de 3 marches**, la dernière pleine (S, D, T).
- Classement après un Shanghai précoce : score tel quel, rang selon la règle 9, avec la mention
  **« Tour 4 non joué »** sous les noms et la ligne « Partie arrêtée au tour 4 : les scores sont ceux du
  moment ».
- Étape 1 à 6 jeux : **option B** (X01, Cricket, Tour du monde, Killer en 2 × 2, puis Shanghai et
  Entraînement chacun en pleine largeur).
- Textes de la planche (tuile « Sept tours, une cible par tour : visez le Shanghai. », « 2 à 6 joueurs »,
  sous-titre de l'étape 2 « Du tour 1 au tour 7 ») et tailles (cible 67 px en portrait, 42 px en
  paysage ; scores à 6 joueurs 38 px au maximum en portrait, 30 à 60 px en paysage ; S · D · T de
  32 × 30 px, indicateurs non tapables) : **tels que dessinés**.
- Écart de charte accepté : cible et scores sous l'échelle X01 ; aucun nouveau jeton de couleur.

## Questions non bloquantes

- **Libellé de la boîte « Égalité ? »** et pictogramme du mode : propriétaire : utilisateur, sur la
  planche.
- **Affichage du classement après un Shanghai précoce** (les autres joueurs n'ont pas tous fini le
  tour) : propriétaire : utilisateur, sur la planche ; défaut : leur score tel quel, rang selon la règle
  9.
- **Précisions des règles par défaut, déduites sans être dites explicitement** : le Shanghai est
  vérifié sur le numéro du tour courant uniquement ; le score du tour du Shanghai compte (6N) mais ne
  change pas l'issue ; une volée « Shanghai » ne peut pas être commencée par un joueur déjà éliminé
  (sans objet, pas d'élimination). Une validation rapide suffit. Propriétaire : utilisateur.
- **Forme du journal** : les 7 tours (ou la liste des cibles) vivent-ils dans l'événement d'ouverture,
  comme les cibles du Tour du monde et du Cricket (« la liste vit dans la config, donc dans le
  journal ») ? Défaut proposé : oui, 7 cibles écrites, même sans réglage. Clés de préférence éventuelles
  (aucun réglage prévu), forme de l'événement de volée, version `backupSchema` : propriétaire :
  architecte du lot, puis Revue.
- **Brouillon de volée** : `useShanghai` écrit un brouillon comme les autres hooks (« un seul
  mécanisme, le même dans tous les hooks »). Propriétaire : architecte du lot.
- **Forme du classement dans le résumé et dans `rankPlayers`** (égalités possibles, nul en tête) :
  propriétaire : architecte du lot.
- **Texte et date de `/confidentialite`** : à relire seulement si une donnée stockée hors journal
  apparaît. Propriétaire : architecte, puis Revue.
- **Mise à jour de la documentation** (`CLAUDE.md`, `CONVENTIONS` § 13, `PROJECT_PLAN`, charte,
  glossaire, index d'architecture) : travail du lot, relu en Revue ; l'index se régénère après fusion.
  Propriétaire : architecte du lot.

## Décisions prises pendant l'intake

Le 2026-10-19, l'utilisateur a validé les règles par défaut proposées, en ne changeant qu'un point :

- **7 tours fixes** (pas de réglage de la durée, pas de 20 tours).
- Tours 1 à 7 dans l'ordre ; tous les joueurs jouent la même cible par tour ; seul le numéro du tour
  compte (simple N, double 2N, triple 3N ; bulle, autres segments et `MISS` = 0) ; score cumulé, jamais de
  bust ; volée de toujours 3 fléchettes.
- « Shanghai » = simple + double + triple du numéro du tour dans une même volée, dans n'importe quel
  ordre : victoire immédiate à n'importe quel tour, avec `BoiteConfirmation` « Valider la sortie » à son
  nom (rien d'écrit, dit ni célébré avant).
- Fin normale après la volée du dernier joueur au tour 7 : le score le plus haut gagne, boîte de
  confirmation aussi ; égalité en tête = nul (boîte « Égalité ? », libellé à valider sur la planche),
  sans phrase de victoire en nul.
- Classement : Shanghai 1er puis score décroissant, égalités possibles.
- 2 à 6 joueurs, pas de solo ; hors statistiques de carrière.
- Pavé standard avec bascule S/D/T ; voix en un seul `say` après validation (points de la volée,
  « Shanghai ! », phrase de victoire hors nul).
- Rejouer = mode + joueurs ; le nom n'est jamais repris.
- Lancement conseillé **après la fusion de `killer`** (mêmes fichiers touchés ; l'étape 1 passera à 6
  tuiles, grille à re-maquetter).
- Niveau `high` forcé : couture `GameMode`, format persisté, décisions gravées de `CLAUDE.md`
  (« Shanghai hors périmètre v1 » levé pour ce mode).
