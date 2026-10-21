# Demande — killer

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-19
- **Niveau** : high
- **Commande manuelle** : `/orchestrate killer high`

> Demande validée le 2026-10-19 : planche validée, puis confirmation explicite de l'utilisateur (lot
> `killer`, `docs/request/killer.md`). À lancer **après la fusion de `volee-partielle`**, depuis `main`.

## Objectif

Ajouter le **Killer**, cinquième mode de jeu de Dartpéro, pour jouer à plusieurs autour d'un seul
téléphone : chaque joueur a un numéro et des vies, il devient « killer » en touchant le double de son
numéro, puis retire les vies de ses adversaires jusqu'à ce qu'il n'en reste qu'un. L'utilisateur ne
connaissait pas le jeu : les règles ci-dessous sont la version « la plus courante », proposée puis
validée par lui. Elles sont la spécification du lot — aucune n'est à improviser.

## Règles validées par l'utilisateur

1. **Joueurs** : 2 à 6, pas de solo.
2. **Numéros** : un numéro de 1 à 20 par joueur, tous différents, **bulle exclue**. Choisis avant la
   partie : l'app les **tire au sort**, avec la possibilité de les changer à la main.
3. **Vies** : 3 par défaut, réglable à 5.
4. **Devenir killer** : toucher le **double de son propre numéro**. Les fléchettes suivantes de la même
   volée comptent **tout de suite** (la fléchette qui rend killer n'est pas « perdue » pour la suite de
   la volée).
5. **Frapper un adversaire** : seulement une fois killer, en touchant le numéro de l'adversaire.
   Simple = 1 vie, double = 2 vies, triple = 3 vies (règle la plus courante, choisie par l'utilisateur).
   Un `MISS` ne fait rien.
6. **Son propre numéro, une fois killer** : sans effet (par défaut — voir la variante ci-dessous).
7. **Élimination** à 0 vie. Le joueur éliminé est **sauté** au tour de table, et son numéro ne vaut plus
   rien.
8. **Victoire** : le **dernier survivant**. La volée s'arrête sur la fléchette qui élimine le dernier
   adversaire ; elle ouvre la `BoiteConfirmation` « Valider la sortie », comme au Cricket (rien d'écrit,
   dit ni célébré avant). **Pas de nul.**
9. **Classement** : par ordre d'élimination, le dernier éliminé est 2e.
10. **Hors statistiques de carrière** (comme le Cricket et le Tour du monde).
11. **Écran** : une ligne par joueur, numéro en grand, vies, badge killer. **Voix** : « devient killer »,
    « est éliminé », phrase de victoire (lot `phrases-victoire`), **muette jusqu'à « Valider la
    sortie »**.
12. **Variante, demandée par l'utilisateur, réglable à l'étape 2, désactivée par défaut** : un killer qui
    touche **son propre numéro perd des vies**, **au même barème que pour un adversaire** (simple 1,
    double 2, triple 3, plancher à 0). Si ce coup l'amène à 0 vie, il est **éliminé** et sa **volée
    s'arrête**. S'il ne restait que lui et un adversaire, l'**adversaire gagne** (une fléchette ne touche
    qu'un numéro : il n'y a pas de double élimination par un même coup, donc pas de nul). Classement : à
    l'ordre d'élimination, comme les autres. Tranché par l'utilisateur le 2026-10-19.

## Périmètre

- Un mode de jeu complet, à côté de X01, Tour du monde, Cricket et l'entraînement, **par la couture
  `GameMode`** : dossier `src/core/domain/games/killer/` (config, règles, état), événement d'ouverture
  propre, `GAME_MODE_IDS`, `AnyMatchState`, `modeOf`, aiguillages de `games/index.ts`.
- Application : use cases et ports du mode (lancement, volée, annulation, relecture), câblés dans
  `src/composition/container.ts`. Le tirage des numéros passe par `RandomSource` et est **écrit dans le
  journal** (un tirage se rejoue à l'identique, comme le reste à l'entraînement).
- Format persisté : événement(s) du mode, lecture dans `backupSchema` au **même lot** (export / import).
  Pas de nouvelle table Dexie prévue : le journal suffit.
- UI : hook de mode (`useKiller`), écran de partie `ecrans/games/killer/`, résumé de fin de partie,
  carte de partie (`vueCarte`), tuile à l'étape 1 de Nouvelle partie, réglages et attribution des
  numéros à l'étape 2, feuille de règles (`reglesKiller` dans `labels.ts` + prop `regles`), annonces
  vocales.
- Nouvelle partie : cinquième tuile de l'étape 1 (la grille 2 × 2 passe à 5 jeux), `Rejouer` (les
  configurations Killer sont rejouables), Parties / Accueil (filtre et cartes par mode).
- La **variante** « un killer qui touche son propre numéro perd des vies », interrupteur à l'étape 2,
  désactivé par défaut, mémorisé par `usePreference` comme les autres réglages.
- Mise à jour de la documentation dans le même lot (voir Zones impactées).

## Hors périmètre

- Aucune statistique de carrière pour le Killer (rien dans `statistiques:joueur`).
- Pas de solo, pas de bulle comme numéro, pas de numéro partagé.
- Pas d'autre barème que celui validé (simple 1 / double 2 / triple 3) ; pas de variante « un simple
  suffit à devenir killer », pas de transfert de vies.
- Shanghai et les autres jeux restent hors v1.
- Aucun réseau, aucun compte : rien ne touche `/confidentialite` sauf si une donnée nouvelle est
  stockée hors journal (à vérifier par l'architecte).
- L'ordre de jeu garde les mécanismes existants (étape Ordre, « Tirer au sort ») : pas de nouveau
  mécanisme d'ordre.

## Comportement visible

À l'écran (planche à produire et valider avant le lot, voir Questions bloquantes) :

- **Lecture à 2-3 m** : une ligne par joueur, de 2 à 6 lignes. Le **numéro** de chaque joueur est géant
  (c'est ce qu'on lit de loin pour savoir qui cibler), les **vies** sont lisibles à distance, le
  **badge killer** distingue qui peut frapper. Le joueur à la ligne de lancer est repéré comme dans les
  autres modes. Un éliminé reste visible, nettement éteint, son numéro barré ou grisé : il ne vaut plus
  rien. À 6 joueurs en paysage, les lignes tiennent sans défilement.
- **Saisie à 30 cm** : le pavé fléchette par fléchette du projet (grille 1-20 + 25, bascule S/D/T
  momentanée), cibles ≥ 48 px. Aucun pavé nouveau.
- **Portrait et paysage** : lecture et saisie dans deux zones nettement séparées, jamais empilées en
  paysage (`DispositionPartie`).
- **Pendant la volée** : la fléchette qui rend killer, celle qui retire des vies et celle qui élimine
  sont visibles tout de suite dans la ligne concernée ; l'état affiché inclut la volée en cours.
- **Fin de partie** : la fléchette qui élimine le dernier adversaire ouvre « Valider la sortie » (nom du
  **gagnant**) ; fermer sans choisir vaut *Corriger*. Puis résumé avec le classement par ordre
  d'élimination.
- **Annuler** : retire la dernière fléchette jouée, quel que soit le joueur, et restitue vies, statut
  killer et éliminations (état dérivé du journal et de la volée rouverte, `ReopenedVisit`).
- **Voix** : un seul `say` par fin de volée ; « devient killer » et « est éliminé » dits **après** la
  volée validée, jamais fléchette par fléchette ; phrase de victoire (`phraseVictoire(matchId)`) dans le
  même `say` que le résultat ; rien avant « Valider la sortie ».
- **Étape 2 de Nouvelle partie** : fiche de réglages (vies 3 / 5, variante désactivée), attribution des
  numéros (tirage + modification à la main), règle des numéros tous différents appliquée sans erreur
  possible.

## Critères d'acceptation

1. Une partie Killer se crée avec 2 à 6 joueurs ; 1 joueur est refusé ; chaque joueur reçoit un numéro
   de 1 à 20, tous différents ; la bulle n'est jamais un numéro.
2. Le tirage des numéros est écrit dans le journal : relire la partie redonne les mêmes numéros ;
   changer un numéro à la main est possible avant le lancement, sans doublon.
3. Les vies valent 3 par défaut, 5 si choisi ; la valeur est dans le journal.
4. Un joueur n'est killer qu'après avoir touché le **double** de son numéro ; un simple ou un triple de
   son numéro ne le rend pas killer. Les fléchettes suivantes de la même volée comptent tout de suite.
5. Un non-killer qui touche le numéro d'un adversaire ne lui retire aucune vie.
6. Un killer qui touche le numéro d'un adversaire lui retire 1 (simple), 2 (double) ou 3 (triple) vies,
   sans descendre sous 0.
7. Un `MISS`, la bulle, un numéro non attribué et le numéro d'un éliminé ne produisent aucun effet.
8. Un joueur à 0 vie est éliminé, sauté au tour de table, et ne peut plus être frappé.
9. Le dernier survivant gagne ; la volée s'arrête sur la fléchette qui élimine le dernier adversaire ;
   « Valider la sortie » s'ouvre ; rien n'est écrit, dit ni célébré avant.
10. Le classement est l'ordre d'élimination inversé : le gagnant 1er, le dernier éliminé 2e.
11. Le mode ne produit aucune statistique de carrière et n'apparaît pas dans les statistiques des
    joueurs.
12. « Annuler » restitue exactement l'état d'avant la dernière fléchette (vie, killer, élimination,
    joueur courant), y compris à travers une élimination et la fléchette gagnante.
13. Variante désactivée : un killer qui touche son propre numéro n'a aucun effet. Variante activée :
    un killer qui touche son propre numéro perd 1 (simple), 2 (double) ou 3 (triple) vies, sans descendre
    sous 0 ; à 0 vie il est éliminé, sa volée s'arrête, et s'il ne reste que lui et un adversaire,
    l'adversaire gagne (« Valider la sortie » s'ouvre à son nom).
14. Les voix « devient killer », « est éliminé » et la phrase de victoire ne sont dites qu'après la
    validation de la volée ; rien à l'entraînement ni sur une volée annulée.
15. Une sauvegarde exportée contenant une partie Killer s'importe à l'identique ; une ancienne
    sauvegarde (sans Killer) s'importe toujours ; un journal Killer incohérent est refusé sans planter.
16. La feuille de règles Killer décrit **exactement** les règles appliquées, la variante en gris quand
    elle est désactivée (comme les autres règles de la partie).
17. L'écran de partie est lisible en portrait et en paysage de 2 à 6 joueurs, cibles ≥ 48 px, sans
    texte sous le plancher de contraste de la charte, thèmes sombre et clair.
18. Une partie Killer apparaît dans l'Accueil (cartes, « Reprendre »), Parties et « Rejouer » ;
    « Abandonnée » reste dérivée ; le nom de partie (facultatif) fonctionne comme pour les autres modes.
19. Lint, types et toute la suite de tests passent ; les règles ont des tests des deux côtés des cas
    limites (voir Attentes de validation).

## Contraintes

- Architecture hexagonale : `src/core/domain/` sans import externe ; le mode ne dépend d'aucun autre
  mode (`games/killer/` n'importe jamais `x01/`, `cricket/`…) ; services transverses uniquement.
- Aucun `Date`, `Math.random`, `localStorage` dans le cœur ; le tirage passe par `RandomSource`.
- Journal en ajout seul, tirage écrit, facultatif absent = clé absente, clés persistées jamais
  renommées, `backupSchema` mis à jour dans le même lot (`rules/persistence.md`).
- L'état affiché est une **projection** rejouée depuis le journal + la volée en cours ; pas d'état
  caché.
- Vocabulaire : « vies », « killer », « éliminé » en français à l'écran ; « manche » jamais « leg » ; le
  code reste en anglais (`rules/glossary.md`).
- Charte : planche suivie à l'identique, tokens en paires de rôle, zéro rayon, zéro dégradé, cibles
  ≥ 48 px, plancher de contraste (CHARTE § Palette, § Les trois planchers).
- Le thème et la disposition portrait / paysage passent par `DispositionPartie` ; aucune règle de jeu
  improvisée par l'architecte ou le développeur.
- Biome seul ; TypeScript strict ; tests avec fakes, pas de mocks.

## Dépendances

- **Ordre avec `volee-partielle`** (tranché le 2026-10-19) : Killer vient **après** la fusion de
  `volee-partielle` (branche `lot/volee-partielle`, en cours dans un autre terminal), part de `main` et
  se branche sur le brouillon de volée des quatre modes : `useKiller` en est le cinquième hook.
- Les lots `annulation-volee` (`ReopenedVisit`, `sortieEnAttente` dérivé, `BoiteConfirmation`) et
  `phrases-victoire` sont des acquis (le second sur la branche courante, non fusionné — à vérifier avant
  de partir).
- Une planche (maquette) validée de l'écran de partie et de l'étape d'attribution des numéros.

## Risques

- **Surface gravée multiple** : domaine, couture `GameMode`, format persisté (`MatchEvent`,
  `backupSchema`), décisions de `CLAUDE.md` → niveau `high`, `light` interdit.
- `CLAUDE.md` dit « Killer et Shanghai restent **hors périmètre v1** » : ce lot lève cette réserve pour
  Killer, en connaissance de cause (la couture « les accueillera sans refonte » est testée une troisième
  fois). À mettre à jour dans le même lot.
- **Volée en cours dans la projection** : « les fléchettes suivantes comptent tout de suite » oblige à
  projeter la volée non enregistrée dans l'état affiché (killer, vies), comme le Cricket le fait pour
  ses marques ; risque de divergence entre l'état affiché et l'état rejoué depuis le journal.
- **Annulation à travers une élimination** (réapparition d'un joueur sauté, ordre de passage rétabli,
  classement recalculé) et à travers la fléchette gagnante.
- **Attribution des numéros** : unicité garantie même après un changement à la main, y compris quand le
  nombre de joueurs change ou qu'on réordonne ; tirage sur 6 joueurs parmi 20 sans doublon.
- **Lisibilité à 2-3 m** de 6 lignes en paysage téléphone (numéro, vies, badge, état éliminé) : à
  trancher sur la planche, pas à l'écran.
- **Rejouer** : la configuration est mode + réglages + ensemble de joueurs ; les numéros tirés ne sont
  pas dans la configuration (nouveau tirage ou numéros repris ?). Non fixé par les règles validées.
- **Garde absente** : le test de `Rejouer` n'a pas de `GAME_MODE_IDS` ni de `switch` exhaustif
  (constat #31 de l'index) : le cinquième mode risque d'y passer inaperçu — l'ajouter dans le lot.
- Politique `/confidentialite` : à relire seulement si une donnée nouvelle est stockée hors journal.

## Zones impactées

- `src/core/domain/games/killer/` (nouveau), `src/core/domain/games/index.ts` (couture),
  `src/core/domain/events/MatchEvent.ts` (événement d'ouverture et de volée du mode).
- `src/core/application/` : ports et use cases du mode ; `backupSchema.ts` ; use cases de lecture
  touchés par un nouveau mode (cartes, résumés, `GetReplayableConfigurations`, `matchStatus`).
- `src/composition/container.ts` (câblage).
- `src/ui/` : `useKiller`, `ecrans/games/killer/`, résumé, `PartieEcran` (aiguillage), Nouvelle partie
  (étape 1, étape 2, attribution des numéros), `labels.ts` (libellés, règles, annonces vocales, phrases),
  cartes de l'Accueil et de Parties, composants communs éventuels de la charte.
- `tests/` : domaine (règles), application, ui, architecture (gardes de modes), `backupSchema`.
- Documentation : `CLAUDE.md` (décision « modes de jeu », règles du Killer, « hors v1 »),
  `.claude/CONVENTIONS.md` § 13 (« comment ajouter un mode » : vérifier le pattern avec cette
  troisième preuve) et §§ 5, 9, 10 si touchés, `docs/PROJECT_PLAN.md`, `docs/CHARTE_GRAPHIQUE.md`
  (écran de match Killer), `.claude/rules/glossary.md` (killer, vie, éliminé), index
  `.ai/architecture-context.md` (à régénérer par `/refresh-architecture`).

## Attentes de validation

- **Tests de règles** (domaine, avec fakes) des deux côtés de chaque cas limite : double de son numéro
  vs simple / triple ; avant / après killer ; 1 / 2 / 3 vies retirées ; plancher à 0 ; élimination, joueur
  sauté, numéro d'un éliminé inerte ; bulle, `MISS`, numéro non attribué ; dernier survivant ; arrêt de
  la volée à la fléchette gagnante ; classement par ordre d'élimination ; fléchette suivante comptée
  tout de suite après le double ; 2, 3, 6 joueurs ; vies 3 et 5 ; variante activée / désactivée.
- Tests d'annulation fléchette par fléchette à travers killer, élimination et fléchette gagnante.
- Tests de tirage des numéros (`RandomSource` fake) : unicité, plage 1-20, bulle exclue, modification à
  la main.
- Tests d'export / import : partie Killer, ancienne sauvegarde, journal incohérent.
- Tests UI : parcours Nouvelle partie (tuile, réglages, numéros), écran de partie, confirmation de
  sortie, voix muette avant validation, cartes, Rejouer, garde exhaustive des modes.
- **Relecture à l'écran, sur téléphone** (obligatoire : le rendu change) : portrait et paysage, 2 et 6
  joueurs, thèmes sombre et clair, lisibilité des numéros et des vies à 2-3 m, cibles ≥ 48 px ; une
  partie complète jusqu'à « Valider la sortie » ; « Annuler » à travers une élimination.
- Suite complète verte (lint, types, tests) ; documentation mise à jour dans le même lot.

## Questions bloquantes

Rien ne peut être implémenté tant que ce point n'est pas levé. **Le statut ne passe pas à `Validé`
tant que cette liste n'est pas vide.**

Tranchées par l'utilisateur le 2026-10-19 : barème de la variante (même barème que pour un adversaire),
auto-élimination (éliminé, volée stoppée, l'adversaire gagne ; pas de double élimination par un même
coup), ordre avec `volee-partielle` (Killer après sa fusion).

Aucune : la planche est produite et ses choix sont arrêtés (voir « Planche » ci-dessous). Reste la
confirmation explicite de l'utilisateur (nom du lot + chemin exact) pour passer le statut à `Validé`.

## Planche

Planche : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\killer\killer.html` (captures PNG dans le
même dossier ; `verif.cjs` les relance). Les architectes la suivent à l'identique. Choix de l'utilisateur
(2026-10-19) :

- Libellé de la variante : **« Son propre numéro coûte des vies »**, avec la phrase d'aide de la planche.
- Pictogramme : **viseur** (nouveau tracé à ajouter à `Pictogramme`).
- Attribution des numéros : **sur l'étape 2**, sous la fiche de réglages ; tirage déjà fait à l'arrivée ;
  seuls les numéros libres sont choisissables.
- Bouton de tirage : **« Tirer au sort »**.
- Ajout / retrait d'un joueur : les numéros sont gardés ; le nouveau joueur reçoit un numéro libre tiré
  au sort ; le joueur retiré libère le sien ; pas d'échange en touchant un numéro pris.
- Bandeau : compteur **« N en vie »** et mention **« VISE D14 »**.
- Taille du numéro à 5-6 joueurs : **38 px en portrait, 32 px en paysage** (sous l'échelle X01 de la
  charte, acceptée ; à confirmer à 2-3 m sur téléphone en relecture).
- Boîte de sortie : **« Kevin gagne sur D8 ? »**, bouton **« Valider la sortie »**.
- Tuile de l'étape 1 : **option B** (Entraînement en pleine largeur).
- Cartes terminées : **le rang**. « Rejouer » : nouveau tirage des numéros.

Points de la planche **non tranchés** par l'utilisateur, à ne pas décider à sa place :
- Résumé : la mention « Éliminé par … » exigerait de garder cette information dans le journal. **Hors
  lot tant que l'utilisateur ne la demande pas** (par défaut : absente du résumé).
- Perte de vie en rouge : la planche emploie `--rouge-texte`, réservé à la feuille de règles. Proposition
  de l'agent : `rouge-touche` (même valeur, jeton général). À confirmer en Revue de la charte.

## Questions non bloquantes

- **Brouillon de volée à Killer** : le hook `useKiller` doit-il écrire un brouillon de volée comme les
  quatre autres modes ? Réponse attendue : oui, par cohérence (« un seul mécanisme, le même dans tous les
  hooks »). Propriétaire : architecte du lot, avec la réponse à la question bloquante 5.
- **Rejouer** : les numéros sont-ils retirés au sort à nouveau ou repris ? Propriétaire : utilisateur,
  à trancher sur la planche ; défaut proposé : nouveau tirage, comme le reste à l'entraînement.
- **Précisions des règles par défaut, déduites des règles 4, 5 et 7 sans être dites explicitement** :
  un simple ou un triple de son propre numéro avant d'être killer ne fait rien ; un numéro non attribué
  (moins de 6 joueurs) ne fait rien ; la vie ne descend jamais sous 0 ; la bulle ne fait rien. Une
  validation rapide de l'utilisateur suffit. Propriétaire : utilisateur.
- **Nom de l'interrupteur de la variante** à l'écran (libellé, phrase d'aide) : propriétaire :
  utilisateur sur la planche, puis `labels.ts`.
- **Clé de préférence** des réglages Killer (`partie:killer-*`) et forme exacte de l'événement
  d'ouverture / de volée (contenu du journal, version `backupSchema`) : architecte du lot, puis Revue.
- **Forme du classement dans le résumé et dans `rankPlayers`** (ordre d'élimination, égalités
  impossibles) : architecte du lot.
- **Texte et date de `/confidentialite`** : à relire seulement si une donnée stockée hors journal
  apparaît. Propriétaire : architecte, puis Revue.
- **Mise à jour de la documentation** (`CLAUDE.md`, `CONVENTIONS` § 13, `PROJECT_PLAN`, charte,
  glossaire, index d'architecture) : travail du lot, relu en Revue ; l'index se régénère après fusion.

## Décisions prises pendant l'intake

Le 2026-10-19, l'utilisateur, qui ne connaissait pas le Killer, a validé « la règle la plus courante »
proposée, sans rien modifier, et a demandé la variante en plus :

- Joueurs 2 à 6, pas de solo ; un numéro de 1 à 20 par joueur, tous différents, bulle exclue, tiré au
  sort avec modification à la main.
- Vies : 3 par défaut, réglable à 5.
- On devient killer en touchant le **double** de son propre numéro ; les fléchettes suivantes de la même
  volée comptent tout de suite.
- Frapper un adversaire (killers seulement) : simple 1 vie, double 2, triple 3 ; `MISS` : rien. Son
  propre numéro, une fois killer : sans effet par défaut.
- Élimination à 0 vie, joueur sauté, numéro de l'éliminé sans valeur.
- Victoire au dernier survivant, volée arrêtée sur la fléchette qui élimine le dernier adversaire,
  `BoiteConfirmation` « Valider la sortie » comme au Cricket ; pas de nul.
- Classement par ordre d'élimination, dernier éliminé 2e.
- Hors statistiques de carrière.
- Écran en une ligne par joueur (numéro en grand, vies, badge killer) ; voix « devient killer »,
  « est éliminé », phrase de victoire, muette jusqu'à « Valider la sortie ».
- **Variante** « un killer qui touche son propre numéro perd des vies » : réglable à l'étape 2,
  désactivée par défaut ; même barème que pour un adversaire (simple 1, double 2, triple 3) ; à 0 vie,
  le killer est éliminé et sa volée s'arrête, l'adversaire restant gagne.
- Killer passe **après** la fusion de `volee-partielle`. Une planche de l'écran est demandée avant le lot.
- Niveau `high` : couture `GameMode`, format persisté, décisions gravées de `CLAUDE.md`
  (« Killer hors périmètre v1 » levé pour ce mode).
