# Demande — tour-du-monde-sens

- **Statut de validation** : À valider
- **Date de validation** : —
- **Niveau** : high
- **Commande manuelle** : `/orchestrate tour-du-monde-sens high`

> Brouillon d'intake du 2026-10-19, **pas encore validé** : il reste une question bloquante (la planche)
> et la confirmation explicite de l'utilisateur (lot `tour-du-monde-sens`,
> `docs/request/tour-du-monde-sens.md`). Ne pas lancer `/orchestrate` avant.

## Objectif

Permettre de jouer le **Tour du monde dans l'autre sens** : à l'étape 2 de Nouvelle partie, un réglage du
**sens du parcours**, **20 → 1** (défaut, inchangé) ou **1 → 20**. La **bulle reste en dernier** dans les
deux sens, comme aujourd'hui. Ce lot vient d'une étude sur « Around the Clock » : l'utilisateur a choisi
d'en faire une **variante de réglage du Tour du monde**, pas un mode distinct (le Tour du monde l'est
déjà). La documentation qui présente encore « Around the Clock » comme un futur jeu distinct est
corrigée dans le même lot.

## Périmètre

- **Réglage du sens** à l'étape 2 de Nouvelle partie, dans une **fiche de réglages Tour du monde** qui
  n'existe pas aujourd'hui (la fiche dit « rien à régler », sans corps). Défaut mémorisé par
  `usePreference`, comme les autres réglages de l'étape 2.
- **Configuration** : le sens se traduit en `targets` de `TourDuMondeStarted` (le champ existe déjà et
  `TourDuMondeConfig.create({ targets })` accepte déjà n'importe quelle liste) : **aucun nouveau format
  persisté**. Une partie en 1 → 20 écrit simplement la liste `1, 2, … 20, BULL`.
- **Feuille de règles** (`reglesTourDuMonde`, `enBrefTourDuMonde`, `parcoursEnMots`) : une branche
  « on monte du 1 au 20, puis on finit sur la bulle » ; la ligne « Ce soir » ne dit plus « rien à
  régler » ; la rubrique **Réglages** montre le sens avec ses deux options, celle de la partie en
  clair (`ceSoir`) ; l'exemple de la rubrique **Exemple** (aujourd'hui « Sarah vise le 18 … au 17 …
  repart du 16 », écrit en dur dans le sens descendant) suit le sens de la partie.
- **Fiche de l'étape 2** : le récapitulatif en tête (`RECAP_TOUR_DU_MONDE`, aujourd'hui une constante
  « 20 → 1, puis la bulle · 21 cibles · rien à régler ») devient fonction du sens ; la phrase de
  règle (`REGLE_TOUR_DU_MONDE`) reste ou s'adapte, à voir sur la planche.
- **Rejouer** : le sens fait partie des **réglages de la configuration**. `estReproductible`
  (`src/ui/rejouer.ts`) n'accepte aujourd'hui que le parcours par défaut : il doit accepter **les deux**
  listes de cibles (20 → 1 et 1 → 20), et `rejouer` (`useNouvellePartie`) doit **préremplir** le
  sens comme il le fait pour la variante du Cricket. `GetReplayableConfigurations` distingue déjà les
  deux sens (sa clé de fusion contient `targets`) : à vérifier par un test, pas à changer.
- **Cartes de partie** : `vueCarte` lit déjà la première et la dernière cible de la config (« 1 → bulle »,
  « 1→B ») ; à vérifier par un test, sur l'Accueil et dans Parties.
- Tests, et **documentation corrigée dans le même lot** (voir Zones impactées).

## Hors périmètre

- **« Bulle finale oui / non »** : l'option figurait dans l'étude (« option B ») mais l'utilisateur ne l'a
  **pas confirmée**. Elle n'est pas dans ce lot (voir Questions non bloquantes).
- Aucun mode « Around the Clock » distinct, aucun nouveau mode, aucun changement de la couture `GameMode`.
- Aucun autre parcours (ordre aléatoire, tour rapide, cibles à choisir) : deux sens, c'est tout.
- **L'écran de partie ne change pas** (lecture, saisie, bandeau, pavé, résumé de fin de partie) : il lit déjà
  `config.targets`. Le lot **vérifie** qu'il se comporte bien en 1 → 20 (tests), sans le redessiner.
- Les **règles gravées** du Tour du monde ne changent pas : on finit le tour de table, départage au
  moins de fléchettes, nul à égalité parfaite, ni manche ni set ni bust, toucher le secteur suffit, la
  bulle se valide à 25 comme à 50.
- Aucune statistique de carrière (le Tour du monde reste hors statistiques).
- Aucun changement de réseau, de compte, de service worker, de `firebase.json`.

## Comportement visible

- **Étape 2, jeu Tour du monde** (portrait et paysage de l'étape 2 ; l'écran de partie ne change pas) :
  la fiche de réglages montre en tête le pictogramme et le récapitulatif **à jour du sens choisi**
  (« 20 → 1, puis la bulle » ou « 1 → 20, puis la bulle »), puis un **choix à deux options** pour le sens
  (même composant que les autres choix segmentés de l'étape 2), puis la phrase de règle. Tapé à 30 cm :
  chaque option ≥ 48 px. Le sens choisi est **mémorisé** pour la prochaine partie ; le défaut reste 20 → 1.
- **Pendant la partie** : rien de nouveau à l'écran. En 1 → 20, la cible courante commence à 1, monte
  jusqu'à 20, puis la bulle ; le compteur « N/21 », la barre et le « dernier tour » fonctionnent
  comme aujourd'hui. Les trois cibles d'une même volée se valident dans l'ordre du parcours choisi.
- **Feuille de règles** (livre de l'étape 2 et du bandeau de match) : en 1 → 20, « En bref » dit qu'on part
  du 1, qu'on monte jusqu'au 20 puis qu'on finit sur la bulle ; la grille du parcours (rubrique
  Marquer) liste les cibles dans l'ordre de la partie ; la rubrique Réglages met en clair le sens de la
  partie, l'autre en gris ; l'exemple suit le sens. En 20 → 1, le texte actuel est **inchangé** (mot pour
  mot), hors la mention « rien à régler » qui disparaît.
- **Cartes** (Accueil, Parties) : « 1 → bulle » (règles) et « 1→B » (détail) pour une partie en 1 → 20 ;
  « 20 → 1 » pour les autres, comme avant.
- **Rejouer** : une partie jouée en 1 → 20 apparaît dans les 3 configurations récentes, distincte d'une
  partie jouée en 20 → 1 avec les mêmes joueurs ; ▶ préremplit le sens.
- **Tuile de l'étape 1** : la phrase « Du 20 au 1, puis la bulle. » décrit le défaut ; son texte avec deux
  sens est une question non bloquante.

## Critères d'acceptation

1. L'étape 2 du Tour du monde propose le sens **20 → 1** (par défaut) ou **1 → 20** ; sans toucher au
   réglage, une partie démarre en 20 → 1 exactement comme avant (même `targets`, même journal).
2. Choisir 1 → 20 lance une partie dont `TourDuMondeStarted.config.targets` vaut `1, 2, … 20, BULL`
   (21 cibles) ; le journal ne contient aucun champ nouveau.
3. Le sens choisi est mémorisé (`usePreference`) et revient à l'ouverture suivante de l'étape 2 ; une valeur
   mémorisée inconnue retombe sur 20 → 1.
4. En 1 → 20, les règles du Tour du monde sont **identiques** à celles de 20 → 1 : toucher le secteur
   suffit, on avance à chaque touche, jusqu'à trois cibles dans une volée, la volée s'arrête à la
   fléchette qui boucle, on finit le tour de table, départage au moins de fléchettes, nul à égalité
   parfaite. Tests des deux sens, des deux côtés de chaque cas limite.
5. La bulle est la **dernière** cible dans les deux sens ; elle se valide à 25 comme à 50.
6. Annuler fléchette par fléchette, la confirmation de la fléchette qui boucle et la reprise de la volée en
   cours (brouillon) fonctionnent en 1 → 20 comme en 20 → 1.
7. La feuille de règles décrit **exactement** le sens de la partie (étape 2 : celui qui est choisi ; en
   partie : celui du journal), jamais « 20 → 1 » pour une partie en 1 → 20. La mention « rien à régler »
   a disparu de la fiche, de « Ce soir » et de la rubrique Réglages.
8. Une partie importée dont le parcours n'est ni l'un ni l'autre sens (liste arbitraire d'une sauvegarde)
   continue de se décrire en liste neutre, sans verbe de direction, et n'est pas rejouable.
9. Une sauvegarde exportée contenant une partie Tour du monde en 1 → 20 s'importe à l'identique ; une
   ancienne sauvegarde s'importe toujours (`backupSchema` inchangé ou simple test de plus).
10. Rejouer : une configuration en 1 → 20 est reproductible ; ▶ préremplit le sens et la partie démarre
    dans ce sens ; une configuration en 20 → 1 se comporte comme avant ; une configuration au parcours
    arbitraire reste écartée.
11. Les cartes de l'Accueil et de Parties disent le bon sens (« 1 → bulle », « 1→B » pour une partie en
    1 → 20).
12. Le résumé de fin de partie, le classement (`rankPlayers`) et la carte d'une partie terminée sont
    corrects en 1 → 20.
13. Documentation : `CLAUDE.md` et `CONVENTIONS` § 13 ne présentent plus « Around the Clock » comme un jeu
    futur distinct (voir Zones impactées) ; la règle du Tour du monde de `CLAUDE.md` dit que le parcours
    peut se jouer 20 → 1 (défaut) ou 1 → 20.
14. Lint, types et toute la suite de tests passent.

## Contraintes

- Architecture hexagonale : `src/core/domain/` sans import externe ; `games/tour-du-monde/` n'importe
  jamais un autre mode ; l'UI passe par les use cases (`services.playTourDuMonde.start`).
- **Aucun nouveau format persisté** : le sens est dans `targets`, déjà dans `TourDuMondeStarted` ; pas de
  champ `direction` à l'événement ; clés persistées existantes jamais renommées.
- **Préférence d'appareil** : une clé `partie:…` nouvelle, **jamais renommée ensuite** (fixée par
  l'architecte) ; relue avec repli sur le défaut si la valeur est inconnue (`dansLaListe`).
- Rejouer : le sens est un **réglage de la configuration** ; le nom n'est jamais repris, l'ordre de passage
  n'en fait pas partie (inchangé).
- Feuille de règles : « un lot qui change une règle met à jour sa rubrique, dans le même lot » ; texte dans
  `labels.ts`, vocabulaire du glossaire (« bulle », « cible », « parcours »). Le mot « parcours » désigne
  aussi le tunnel Nouvelle partie dans le code : ne pas les confondre.
- Aucune règle de jeu improvisée : les règles du Tour du monde sont celles de `CLAUDE.md`, seul le sens
  des cibles change.
- Charte : planche suivie à l'identique, tokens en paires de rôle, zéro rayon, zéro dégradé, cibles
  ≥ 48 px, plancher de contraste, thèmes sombre et clair.
- Biome seul ; TypeScript strict ; tests avec fakes, pas de mocks.

## Dépendances

- **Une planche validée** (voir Questions bloquantes) : fiche de réglages de l'étape 2 et phrase de
  règles, rien d'autre. Chemin prévu : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\tour-du-monde-sens\`
  (dépôt principal, ignoré par git).
- **Ordre avec `killer`** (demande validée le 2026-10-19, lot non encore lancé) : les deux lots touchent
  l'étape 2 de Nouvelle partie (`useNouvellePartie`, `ReglagesJeu`), `rejouer.ts`, `labels.ts` et les
  cartes. Le premier fusionné impose un rebase (avec accord) à l'autre. Ordre à trancher par
  l'utilisateur (question non bloquante).
- Acquis sur `main` : `volee-partielle` (brouillon de volée), `annulation-volee`, `phrases-victoire`,
  `rejouer`, `regles-du-jeu`.

## Risques

- **Surfaces gravées touchées** : le domaine (`tour-du-monde/config.ts` : un second parcours par défaut
  à côté de `TOUR_DU_MONDE_TARGETS`, ou une fabrique de parcours par sens), la règle gravée du Tour du
  monde dans `CLAUDE.md` (« on part du 20 »), la feuille de règles, Nouvelle partie et Rejouer
  (décisions gravées) → niveau `high`, `light` interdit.
- **Un second « parcours par défaut »** : `TourDuMondeConfig.create()` sans argument garde le 20 → 1
  (c'est le défaut du domaine, les tests s'y adossent, `estReproductible` et la carte aussi). Ne pas
  « aligner » : le sens montant est un choix explicite, jamais un défaut. Le journal d'une ancienne
  partie reste rejouable.
- **Texte de la feuille écrit en dur dans le sens descendant** : « En bref », l'exemple « Sarah vise le
  18 » (17, 16), `parcoursDescendant` (un parcours
  1 → 20 y retombe aujourd'hui sur la **liste neutre** « Le parcours de cette partie : 1, 2, … »,
  qui n'est pas la phrase voulue). Oubli = règle fausse affichée sans qu'aucun test le voie : test de
  la phrase pour chaque sens.
- **`estReproductible` compare à une liste unique** (`memesCibles(…, TourDuMondeConfig.create().targets)`) :
  oubli du second sens = une partie 1 → 20 jamais proposée dans Rejouer, sans erreur. Test exhaustif
  sur les deux sens.
- **Préférence + Rejouer** : `rejouer` écrit les préférences **et** passe les valeurs en argument de
  `lancer` (la lecture des préférences est périmée au rendu suivant) : le sens doit suivre ce même
  chemin, comme `variante`.
- **`/confidentialite`** : le texte cite « les réglages de la dernière partie » (localStorage). Une clé
  de plus rentre dans cette formule ; à confirmer par l'architecte (sinon texte et date à mettre à jour
  dans le même lot).
- Pas de nouvelle table, pas de migration, `backupSchema` accepte déjà un parcours quelconque.

## Zones impactées

- `src/core/domain/games/tour-du-monde/config.ts` (le second parcours, `TOUR_DU_MONDE_TARGETS` reste
  le défaut) ; `rules.ts` ne devrait pas bouger (il lit `config.targets` par indice) : le prouver par
  des tests.
- `src/ui/hooks/useNouvellePartie.ts` (préférence du sens, `Lancement`, `lancer`, `rejouer`) ;
  `src/ui/ecrans/nouvelle-partie/ReglagesJeu.tsx` (corps de la fiche Tour du monde, `ChoixSegmente`) ;
  `src/ui/reglesDuJeu.ts` (`reglesDeLaFiche` lit le sens du réglage au lieu de la constante) ;
  `src/ui/rejouer.ts` ; `src/ui/reglagesPossibles.ts` (si la liste des sens s'y range).
- `src/ui/labels.ts` : `RECAP_TOUR_DU_MONDE`, `REGLE_TOUR_DU_MONDE`, `PHRASE_TUILE`,
  `reglesTourDuMonde`, `enBrefTourDuMonde`, `parcoursEnMots`, `parcoursDescendant` (et son pendant
  montant), exemple de la feuille, rubrique Réglages, légende et aide du nouveau choix.
- `src/ui/cartesPartie.ts` : lecture seule (vérifier).
- `src/core/application/` : `GetReplayableConfigurationsUseCase`, `backupSchema.ts`,
  `PreviewTourDuMondeVisitUseCase` : **lecture seule** (vérifier par des tests, pas de changement attendu).
- `tests/` : domaine (règles dans les deux sens), `rejouer`, `useNouvellePartie`, étape 2, feuille de
  règles, cartes, `backupSchema`, écran de partie.
- Documentation : `CLAUDE.md` (§ Règles du Tour du monde : le parcours ; § Décisions ouvertes 3 : « Around
  the Clock » retiré de la liste des jeux restants ; au besoin une ligne de décision), `.claude/CONVENTIONS.md`
  § 13 (« Pour ajouter un mode futur (Killer, Shanghai, Around the Clock …) » : retirer Around the Clock),
  `docs/PROJECT_PLAN.md` (lot « nouveaux-modes » : « Around the Clock recoupe le Tour du monde » est
  tranché ; le lot et son § 6), `.claude/rules/glossary.md` (ligne Tour du monde « 20 → 1 puis bulle »),
  `docs/CHARTE_GRAPHIQUE.md` § Parcours si la fiche y est décrite, index `.ai/architecture-context.md`
  (à régénérer par `/refresh-architecture`).

## Attentes de validation

- **Tests de règles** (domaine, avec fakes), dans **les deux sens** : une touche valide une cible, un
  double ne vaut pas deux, `MISS` jamais, bulle à 25 comme à 50, trois cibles dans une volée, arrêt de
  la volée à la fléchette qui boucle, on finit le tour de table, départage, nul ; `TourDuMondeConfig.create()`
  par défaut reste 20 → 1.
- Tests d'annulation fléchette par fléchette et de reprise de volée (brouillon) en 1 → 20.
- Tests de `backupSchema` : partie Tour du monde 1 → 20 exportée puis importée à l'identique ; ancienne
  sauvegarde ; parcours arbitraire.
- Tests de `estReproductible` / `configurationsAffichees` : 20 → 1 oui, 1 → 20 oui, parcours arbitraire
  non ; `GetReplayableConfigurations` distingue les deux sens.
- Tests UI : fiche de l'étape 2 (choix du sens, récapitulatif, mémorisation, repli sur une valeur
  inconnue), lancement avec les bonnes `targets`, ▶ de Rejouer qui préremplit le sens, cartes, **textes
  de la feuille de règles pour chaque sens** (« En bref », exemple, rubrique Réglages), absence de
  « rien à régler ».
- **Relecture à l'écran, sur téléphone** (le rendu de l'étape 2 change) : étape 2 du Tour du monde en
  portrait et en paysage, thèmes sombre et clair, cibles ≥ 48 px ; feuille de règles ouverte dans les
  deux sens ; une partie courte en 1 → 20 jusqu'à « Valider la sortie » et la fin du tour de table ;
  carte de l'Accueil et « Rejouer » ; l'écran de partie ne doit pas avoir bougé en 20 → 1.
- Suite complète verte (lint, types, tests) ; documentation mise à jour dans le même lot.

## Questions bloquantes

Rien ne peut être implémenté tant que ce point n'est pas levé. **Le statut ne passe pas à `Validé`
tant que cette liste n'est pas vide.**

1. **Planche à produire et à valider par l'utilisateur** (rendu qui change, `rules/` : « planche suivie à
   l'identique ») : la **fiche de réglages Tour du monde de l'étape 2** (récapitulatif en tête, choix du
   sens à deux options, phrase de règle) en portrait et en paysage, thèmes sombre et clair, et la
   **phrase de règles** en 1 → 20 (« En bref », rubrique Réglages, exemple). Dossier :
   `C:\Users\kevin\Documents\Flechettes\docs\maquettes\tour-du-monde-sens\`. Propriétaire : utilisateur
   (validation), planche produite pendant l'intake. La planche tranche aussi les libellés exacts du
   réglage (voir Questions non bloquantes) sans que les architectes les inventent.

## Questions non bloquantes

- **« Bulle finale oui / non »** (option de l'étude, non confirmée) : hors lot ; à reposer plus tard si
  l'utilisateur la veut. Propriétaire : utilisateur.
- **Libellés du réglage** : légende (« Sens du parcours » ?), noms des deux options (« 20 → 1 » /
  « 1 → 20 », ou « On descend » / « On monte »), phrase d'aide. Propriétaire : utilisateur, sur la
  planche, puis `labels.ts`.
- **Phrase de la tuile de l'étape 1** (« Du 20 au 1, puis la bulle. ») : la garder, la rendre neutre
  (« Faire le tour du plateau, puis la bulle. ») ou l'adapter au dernier sens joué. Propriétaire :
  utilisateur sur la planche. Défaut proposé : inchangée (c'est le défaut du jeu).
- **Clé de préférence et forme de la valeur** (`partie:tour-du-monde-sens` ? `'DESCENDANT' | 'MONTANT'`
  ou booléen) : propriétaire : architecte du lot ; la clé ne se renomme jamais ensuite.
- **Où vit le parcours montant dans le domaine** (constante `TOUR_DU_MONDE_TARGETS_MONTANT`, fabrique de
  parcours par sens, ou construit côté UI/application) : propriétaire : architecte du lot, dans la
  couture existante (aucun import d'un autre mode).
- **Exemple de la feuille en 1 → 20** (quelle cible, quelles touches) : propriétaire : utilisateur sur la
  planche ; défaut : le même exemple transposé (« Sarah vise le 3 … au 4 … repart du 5 »).
- **Ordre avec le lot `killer`** (conflits sur l'étape 2, `rejouer.ts`, `labels.ts`) : lequel d'abord.
  Propriétaire : utilisateur ; défaut proposé : `tour-du-monde-sens` d'abord (plus petit), `killer`
  rebasé ensuite, avec accord.
- **`/confidentialite`** : confirmer que « les réglages de la dernière partie » couvre la nouvelle clé ;
  sinon mettre à jour texte et date dans le même lot. Propriétaire : architecte, puis Revue.
- **Parties déjà jouées en 20 → 1 puis Rejouer** : aucune migration (leur `targets` est déjà
  `20 … 1, BULL`) ; à confirmer par le test de `estReproductible`. Propriétaire : architecte du lot.
- **Mise à jour de la documentation** (liste de Zones impactées) : travail du lot, relu en Revue ; l'index
  se régénère après fusion.

## Décisions prises pendant l'intake

Le 2026-10-19 :

- Après une étude sur « Around the Clock », l'utilisateur a choisi l'**option B** : une **variante de
  réglage du Tour du monde**, pas un mode distinct.
- Réglage du **sens du parcours** à l'étape 2 : **20 → 1** (défaut, inchangé) ou **1 → 20** ; la **bulle
  reste en dernier** dans les deux sens.
- L'option « bulle finale oui / non » de l'étude n'est **pas** confirmée : hors lot, en question non
  bloquante.
- Aucun nouveau format persisté : `targets` existe déjà dans `TourDuMondeStarted`. Défaut mémorisé par
  `usePreference` (clé fixée par l'architecte). Nouvelle fiche de réglages Tour du monde à l'étape 2.
- Feuille de règles : une branche « on monte du 1 au 20 » ; carte et « Rejouer » : le sens fait partie des
  réglages de la configuration. L'écran de partie ne change pas.
- Les règles gravées du Tour du monde (on finit le tour de table, départage, nul) ne changent pas.
- Le doublon de documentation (« Around the Clock » listé comme futur jeu distinct dans `CLAUDE.md`
  § Décisions ouvertes 3 et `CONVENTIONS` § 13) est corrigé dans ce lot.
- **Niveau `high`**, `light` interdit : le lot touche le domaine (`src/core/domain/`), une règle gravée de
  `CLAUDE.md` (le parcours du Tour du monde) et les décisions gravées Nouvelle partie et Rejouer, la
  feuille de règles incluse.
- Planche limitée à la fiche de réglages de l'étape 2 et à la phrase de règles : **question bloquante**,
  statut « À valider » tant qu'elle n'est pas validée et confirmée.
