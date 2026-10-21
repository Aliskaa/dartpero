# Lot `killer` — notes de dev

> Écrit par l'Orchestrator à partir des rapports du sous-agent `dev` (opus, effort medium d'après son
> frontmatter). Deux passes sur la même branche, un seul commit final. Contrôles relancés par l'Orchestrator.

## Passe 1 sur 2 (2026-10-21) — cœur, persistance, sauvegarde, politique, branches imposées

`dev` a atteint son plafond de **100 tours sans rendre de rapport** (267 appels d'outils) ; l'Orchestrator a
vérifié l'arbre (typecheck, lint, tests), puis relancé `dev` pour qu'il livre son rapport sans nouvelle édition.
La passe est **arrêtée sur un palier vert**, non terminée au sens de la liste de la Révision 1 (voir
« Reste à faire »).

### Ce qui a été implémenté (paliers atteints)

- **a — genre du profil : atteint.** `PlayerGender` (`MASCULINE` / `FEMININE`, clé absente = non précisé),
  `Player.create(…, gender?)`, `ManagePlayers.create(name, color?, gender?)` et `PlayerChanges.gender?: … | null`,
  `StoredPlayer.gender?`, `DexiePlayerRepository` (étalement conditionnel, lecteur à littéral validé),
  `backupSchema.versPlayer` (valeur invalide : profil ignoré et compté, sans planter), export, `BACKUP_VERSION`
  inchangé, politique `/confidentialite` (lignes 435, 445 et mention à la ligne 454, date **« Mise à jour le
  21 octobre 2026 »** suivie par `confidentialite.test.tsx`), garde `genreBoundary`.
- **b — domaine Killer et couture : atteint.** `games/killer/{config,rules}.ts` (règles 1 à 14, `eliminations
  { playerId, by }`), `KillerStarted` dans `MatchEvent`, `games/index.ts` (`'KILLER'` avant `'CHECKOUT_PRACTICE'`,
  `default` typé `never`).
- **c — application : atteint.** Ports `PlayKiller`, `PreviewKillerVisit`, `DrawKillerNumbers`, use cases,
  `summarize`, `MatchSummary`, `rankPlayers`, `GetReplayableConfigurations(+UseCase)`, `RestartMatchUseCase`
  (nouveau tirage), `backupSchema` (projection du journal à l'import pour **tous les modes**), `container.ts`.
- **d — branches d'UI imposées par `tsc` : atteint, avec des branches provisoires** (marqueurs plus bas).

### Fichiers

- **Créés (`src`)** : `PlayerGender.ts`, `games/killer/{config,rules}.ts`, `ports/driving/{PlayKiller,
  PreviewKillerVisit,DrawKillerNumbers}.ts`, `use-cases/{drawKillerNumbers,DrawKillerNumbersUseCase,
  PreviewKillerVisitUseCase,PlayKillerUseCase}.ts`.
- **Modifiés (`src`)** : cœur et persistance (`Player`, `MatchEvent`, `games/index`, `ManagePlayers`,
  `ManageBackup`, `MatchSummary`, `GetReplayableConfigurations`, `ManagePlayersUseCase`, `ManageBackupUseCase`,
  `backupSchema`, `summarize`, `rankPlayers`, `GetReplayableConfigurationsUseCase`, `RestartMatchUseCase`,
  `database`, `DexiePlayerRepository`, `container`) ; UI (`labels`, `chemins`, `cartesPartie`, `reglesDuJeu`,
  `rejouer`, `Pictogramme`, `PartieEcran`, `ReglagesJeu`, `useNouvellePartie`).
- **Tests créés** : `domain/playerGender`, `domain/killer/{helpers,config.test,rules.test,ranking.test}`,
  `use-cases/{playKiller,drawKillerNumbers,previewKillerVisit}.test.ts`, `architecture/genreBoundary.test.ts`,
  `ui/modesAvecEcran.ts` (temporaire). **Modifiés** : `managePlayers`, `backup`, `rejouer`, `lancerPartie`,
  `annulationVolee`, `brouillonVolee`, `contenuAppareil`, `matchName`, `dexieRepositories`,
  `pictogrammesBoundary`, `confidentialite`, `Pictogramme`, `tracesPictogrammes`, `voleePartielle`,
  `annulationDoubleTap`, `nomDePartieEcrans`, `reglesDuJeu`, `nouvellePartie`, `accueilPartiesRecentes`.

### Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Projection du journal à l'import pour **tous les modes** (`GameModes.project` dans `versMatchRecord`) | Ajustement | Option recommandée par l'architecte ; touche le constat #11 : à relire par Sécurité et Revue ; suite verte |
| `PlayKillerUseCase.recordVisit` écrit au journal la volée **tronquée** (`visit.darts`), alors que le Cricket écrit les fléchettes brutes | Ajustement | Le journal ne garde que les fléchettes jouées ; rejeu identique |
| `KillerRules.ranking` : ordre de jeu = ordre de `playerIds`, pas une rotation depuis `startingPlayerIndex` | Ajustement | `rankPlayers` (tri stable par `rank`) reste cohérent avec le domaine |
| Ajouts du domaine non prévus : `KillerConfig.isValid` (revalide la config dans `start`), `KillerRules.aliveCount` (« N en vie ») | Ajustement | Journal relu ; compteur du bandeau |
| `src/ui/rejouer.ts` touché en passe 1 (la Révision 1 le plaçait en passe 2) | Ajustement | `tsc` l'exige |
| Le test « renvoie un jeu inconnu à l'étape 1 » utilise `/nouvelle-partie/shanghai` au lieu de `/nouvelle-partie/killer` | Ajustement | **Conséquence** : `/nouvelle-partie/killer` tapé à la main ouvre une étape 2 provisoire ; la partie lancée par ce chemin ouvre l'écran d'erreur marqué ; aucune tuile n'y mène (Killer pas strictement inaccessible par URL entre les deux passes, sans effet : un seul commit) |
| `contenuAppareil.test.ts` lance le Killer avec 2 joueurs | Ajustement | Pas de solo au Killer |
| `Crosshair` (lucide) ajouté aux icônes remplacées de `pictogrammesBoundary` ; `Pictogramme.test` compte 13 pictogrammes | Ajustement | Viseur |
| **Libellés écrits par `dev`, non tirés de la planche, à relire en passe 2 et à la Revue** : `UNITE_CARTE.KILLER = 'vies'` ; détail et règles de carte « 3 vies » ; `MESSAGE_KILLER_INDISPONIBLE` ; `ceSoir` de `reglesKiller` (« 3 vies · son propre numéro sans effet ») et **tout le texte de `reglesKiller`** (écrit d'après les règles 1 à 12, sans exemple ni questions fréquentes) ; libellés « Non / Oui » de la variante dans « Les réglages possibles » ; libellé « Vies » du réglage | Ajustement | Le critère 16 exige que la feuille décrive **exactement** les règles appliquées : le texte de `reglesKiller` est à relire par l'utilisateur |

### Marqueurs `KILLER-PASSE-2` (relevés par l'Orchestrator : 10 occurrences)

- `src/ui/cartesPartie.ts:277` — jauge de vies en carrés, éliminés barrés, « N en vie »
- `src/ui/rejouer.ts:41` — maximum de joueurs par mode (6 au Killer), vies ; `case 'KILLER': return false` (Killer écarté de Rejouer)
- `src/ui/reglesDuJeu.ts:110` — `reglesDeLaFiche` : défauts du domaine (réglages de la fiche à venir)
- `src/ui/labels.ts:1227` — libellés de la ligne Rejouer (la variante n'y figure pas encore)
- `src/ui/labels.ts:2464` — `MESSAGE_KILLER_INDISPONIBLE` (l'écran Killer n'existe pas encore)
- `src/ui/labels.ts:2607` — `sousTitreOrdre` : « Killer » seul (déjà conforme à R1.10 ; marqueur à retirer)
- `src/ui/hooks/useNouvellePartie.ts:284` — `lancer` : vies et variante mémorisées, numéros à l'étape 2
- `src/ui/ecrans/nouvelle-partie/ReglagesJeu.tsx:257` — récapitulatif, choix 3 / 5 vies, bascule de la variante
- `src/ui/ecrans/games/PartieEcran.tsx:106` — `EcranErreur` : la paire `lazy()` Killer et sa prop
- `tests/ui/modesAvecEcran.ts:4` — aide temporaire à supprimer en fin de passe 2

### Contrôles

Relancés par l'Orchestrator après le rapport de `dev` (qui ne les avait pas relancés lui-même après ses
dernières éditions) :

| Commande | Résultat |
|---|---|
| `npm run lint` | 349 fichiers, aucune correction |
| `npm run typecheck` | aucune erreur |
| `npx vitest run` | 96 fichiers, **1846 tests verts** (1691 avant le lot) |
| `npm run build` | passe |
| Grep `Ã|Â|�` | `src` : « BÂTONS » légitime (`CompteBatons.tsx:4`) ; `tests` : aucune |

### Reste à faire (à intégrer à la passe 2 ou au passage Test)

- `tests/ui/killerCartes.test.tsx` **non créé** : aucun test ne vérifie la branche Killer de `vueCarte`
  (pictogramme, « 3 vies », ordre par rang, rang une fois finie, pas de teinte en cours) ni les ajouts Killer de
  `cartesPartie.test.tsx`.
- `MiniTableauPartie.tsx` et `CartePartie.tsx` **non touchés** (`tsc` ne l'exigeait pas) : la branche Killer de
  `vueCarte` réutilise la jauge `barre` existante ; la jauge `vies` (carrés) et les éliminés barrés restent à faire.
- `restartMatch.test.ts` et `rankPlayers.test.ts` non modifiés : la relance avec nouveau tirage et
  `rankPlayers` / `leadingPlayers` sont testés dans `playKiller.test.ts` (« Killer — résumé, classement, relance »).
- `hexagonalBoundary.test.ts` : liste de modes en dur ou non, **non vérifié** (suite verte).

## Passe 2 sur 2 — découpée en 2a (écran de jeu) et 2b (parcours, genre, Rejouer)

Découpage en deux livraisons décidé par l'Orchestrator pour éviter un plafond de tours sans rapport ; un seul
commit final.

### Passe 2a (2026-10-21) — écran de jeu et ses suites : faite, verte

`dev` (opus, 128 appels d'outils, rapport rendu dans le plafond). Contrôles relancés par l'Orchestrator :
lint propre, typecheck propre, **99 fichiers, 1874 tests verts** (1846 en fin de passe 1), build OK, grep
d'accents RAS (« BÂTONS » légitime).

- **Créés** : `useKiller.ts` (cinquième utilisateur de `useVoleeEnCours`, un seul `say`, « À toi » après une
  volée non finale, phrase de victoire seule à la victoire), `composants/killer/FeuilleKiller.tsx` (sur la
  feuille commune `FeuilleMatch`), `games/killer/KillerEcran.tsx`, `ResumeKillerEcran.tsx` ; tests
  `killerEcran.test.tsx` (11), `accordKiller.test.ts`, `killerCartes.test.tsx`.
- **Modifiés** : `labels.ts` (accord, boîte accordée, annonces, bandeau, « Vise D14 », « N en vie » ;
  `MESSAGE_KILLER_INDISPONIBLE` supprimé), `PartieEcran.tsx` (paire `lazy()` et prop `killer`), `cartesPartie.ts`
  (jauge `vies`, `JoueurCarte.elimine`), `MiniTableauPartie.tsx` (carrés de 12 px, éliminés barrés),
  `NomJoueurFeuille.tsx` (prop `elimine`), `index.css` (jetons `--text-numero-m/s/xs`), `voleePartielle.test.tsx`
  (Killer, `satisfies Record<GameModeId, Mode>`), `accueilPartiesRecentes.test.tsx`.

**Écarts (ajustements, à relire à l'écran)** :

| Écart | Justification |
|---|---|
| Texte `reglesKiller` corrigé : « la partie tient en un seul tour de table » était faux au Killer, devient « Ni manche, ni set, ni bust : on joue jusqu'au dernier survivant. » ; « De 2 à 6 joueurs. » ajouté | Critère 16 ; **à relire par l'utilisateur** |
| Tailles du numéro arrondies aux paliers existants (65 → 64,8 px, 50 → 49,6 px ; 42, 38 et 32 px par trois jetons `numero-*` ; petites tailles de la planche en `text-lg`, `text-nom-serre`, `text-xl`, `text-3xl`, `text-2xl`, `text-sm`) | `typographieBoundary` interdit `text-[…]` ; écart d'au plus 2 px |
| Repère de la ligne active = celui de la feuille commune (`repere-lancer`, laiton 12 %, filet de 5 px), pas 14 % / 4 px de la planche | Cohérence avec les autres modes |
| Résumé : classement dans le `Panneau` « Classement » comme au Cricket (la planche n'a pas de titre) ; `TableauHonneur` sans ligne de détail (« Dernier en vie · N vies » est sur la ligne 1) ; surtitre « Killer · 3 vies » | Cohérence avec le Cricket |
| `CartePartie` non modifiée (rang par `vueCarte` déjà affiché) ; la planche ne barre pas les éliminés sur la carte terminée | — |
| Phrase des lecteurs d'écran des cartes : « 0 vie », pas « éliminé » | `cartesPartie.ts` est interdit au genre par `genreBoundary` : impossible d'y accorder le mot |
| Moment célébré : seulement « Partie ! » à la victoire, rien à une élimination | La planche ne dessine rien d'autre |

**Contrastes mesurés** (`--repere` = laiton 12 % sur `ardoise`), sombre / clair : `rouge-touche` sur la ligne
active 5,81 / 5,63:1 ; sur `ardoise` 7,13 / 6,51:1 ; `craie-3` sur la ligne active 4,66 / 6,30:1 — tous ≥ 4,5:1,
non mesurés sur un écran réel.

**Non vérifié** : tout rendu (5 carrés de vie dans la colonne VIES à 2 joueurs en portrait, troncatures des
effets, lisibilité de 38 / 32 px à 2-3 m, 6 lignes en paysage) ; que Tailwind v4 génère les classes
fractionnaires `min-h-10.75` et `min-h-22.5` (les tests ne le voient pas) → **relecture sur téléphone
obligatoire**.

**Marqueurs `KILLER-PASSE-2` restants** (tous 2b) : `rejouer.ts:41`, `reglesDuJeu.ts:110`, `labels.ts:1228`,
`useNouvellePartie.ts:284`, `ReglagesJeu.tsx:257`, `tests/ui/modesAvecEcran.ts:4`.

### Passe 2b (2026-10-21) — parcours, Rejouer, genre, nettoyage : faite, verte

`dev` (opus, 186 appels d'outils, rapport rendu dans le plafond, aucune commande refusée). Contrôles relancés
par l'Orchestrator : lint propre (359 fichiers), typecheck propre, **101 fichiers, 1912 tests verts** (1874 en
fin de 2a), build OK, grep d'accents RAS, **plus aucun marqueur `KILLER-PASSE-2` dans `src/` ni `tests/`**.

- **Créés** : `NumerosKiller.tsx`, `composants/commun/ChoixGenre.tsx` (dessiné comme la planche, jointif, sans
  `ChoixSegmente`), `tests/ui/killerParcours.test.tsx` (14), `tests/ui/genreProfil.test.tsx` (9).
  **Supprimé** : `tests/ui/modesAvecEcran.ts`.
- **Modifiés** : `reglagesPossibles` (`VIES`, `JOUEURS_KILLER`), `useNouvellePartie` (préférences
  `partie:killer-vies` / `partie:killer-variante`, `max(mode)` exhaustif, `selection(mode)` et **coupe écrite** dans
  `partie:joueurs`, numéros en `useState<Map<PlayerId, SegmentNumber>>`, `lancer` et `rejouer` Killer, `creerJoueur`
  avec genre), `reglesDuJeu`, `rejouer.ts` (maximum par mode, `default` typé `never`), `labels.ts` (Rejouer avec
  la variante quand activée, fiche, numéros, consigne, genre), `ReglagesJeu`, `EtapeJoueurs`, `EtapeJeu`,
  `DialogueNouveauJoueur` (`LigneGenre`, remise à zéro), `ChoixJoueursExistants`, `NouvellePartieEcran`,
  `JoueursEcran` (genre en édition, carte au repos et champ en ligne inchangés) ; tests : `annulationDoubleTap`,
  `nomDePartieEcrans`, `nouvellePartie`, `reglesDuJeu` (retour à `GAME_MODE_IDS`), `rejouer.test.tsx` et
  `pictogrammesEmplacements.test.tsx` (5 tuiles), `lazyRoutes` (10 écrans), `genreBoundary` (plancher 9 → 18).

**Écarts (ajustements, à relire à l'écran)** :

| Écart | Justification |
|---|---|
| `HistoriqueEcran.tsx` non modifié | Le filtre suit déjà `[TOUS, ...GAME_MODE_IDS]` : Killer est déjà avant Solo |
| `genreBoundary` : chemin de `DialogueNouveauJoueur` corrigé (`ecrans/nouvelle-partie/`) | La liste de la Révision 1 le plaçait dans `composants/commun/` |
| **Comportement ouvert de la ligne Genre** (non dessiné) : suit le dépliant de l'étape 2 (en-tête gardé qui montre la valeur choisie, ligne ouverte après un choix) ; la légende « Genre » de `ChoixGenre` n'est lue que par le lecteur d'écran (`legendeVisible={false}`) | **À valider à la relecture à l'écran** |
| Sous 2 joueurs, « Continuer » **affiché et désactivé** (comme la planche), pas « Commencer » | Planche |
| **Consigne copiée mot pour mot de la planche** (« … Ajoutez au moins un joueur : … »), la même à 0 et à 1 joueur (réponse 13) ; à 0 joueur « au moins un » est inexact | **Point de texte à relire par l'utilisateur** |
| Ligne Rejouer : vies dans le titre (« Killer · 5 vies »), variante dans le résumé (« son propre numéro coûte · hier · … ») ; lus ensemble : « Killer · 3 vies · son propre numéro coûte » | Décision de l'utilisateur (variante affichée quand activée) |
| Bascule de la variante : `LigneReglage` (bascule 46 × 26 des Réglages) dans un `<ul>` `-mx-3 -mb-3`, aide en `craie-3` | Réutilisation d'un composant existant |
| Tuile de numéro sans ombre portée `0 2px 0` de la planche ; tuile ouverte en `ring-1 ring-inset ring-laiton` | Éviter une valeur en dur |
| Grille des numéros : un numéro pris est un `span role="img"` (« 8, pris par Julien »), le numéro actuel un bouton `aria-pressed` avec le mot « actuel » | Accessibilité |
| Un `if` du hook gère « lancer » quand Killer passe par Ordre ; `lancer` complète les numéros manquants (lien profond) | Robustesse |

**Non vérifié (rendu uniquement)** : rangée compacte à 5 colonnes à 360 px (« Tour du monde » sur deux lignes ?),
entraînement en pleine largeur, « Non précisé » sur deux lignes dans les cases du genre, tuiles de 72 × 48 et
grille ≥ 52 px (`min-h-13`, `w-18` : classes Tailwind v4 supposées générées), thème clair de `bg-ardoise-claire`
sous la grille, bascule dans la fiche. **Relecture sur téléphone obligatoire** (portrait, paysage, deux thèmes).

**Libellés écrits par `dev` à relire** : `ARIA_TIRER_NUMEROS`, `ariaTuileNumero`, `ariaNumeroPris`, la note des
numéros (tirée de la planche), la consigne ci-dessus.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | **Rejouer** : la ligne Killer ne montre pas la variante alors qu'elle fait partie de la clé de groupe : deux lignes « Killer · 3 vies » pourraient paraître identiques. Faut-il afficher la variante sur la ligne ? (la réponse 8 sur les cartes ne le couvre pas) | **Utilisateur** (point produit) |
| 2 | `/nouvelle-partie/killer` joignable par URL tapée entre les deux passes : à laisser (aucune tuile n'y mène, un seul commit) | Orchestrator : laissé, noté |
| 3 | Texte de `reglesKiller` et libellés non tirés de la planche : relecture | Utilisateur, Revue |

## Limites connues et TODO assumés

- Rien n'est committé ; la branche n'a pas changé.
- La projection du journal à l'import pour tous les modes touche le constat #11 de l'index : `sec` et Revue.
- Rendu à l'écran : aucun (Killer sans écran en passe 1).
