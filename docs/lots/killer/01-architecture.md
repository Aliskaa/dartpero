# Lot `killer` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu (`archi-authority`, opus, effort max,
> 1 lancement, 65 appels d'outils, rapport rendu dans le plafond ; scout et designer sautés : surfaces
> gravées). Le rapport source commence par `Architecture result: PASS`. Ce fichier en reprend la
> substance ; le détail des classes de tailles et des phrases de la planche reste à lire dans
> `C:\Users\kevin\Documents\Flechettes\docs\maquettes\killer\killer.html`.

## Lu / non vérifié par l'architecte

**Lu** : demande, `00-orchestration.md`, index, planche `killer.html` entière (571 lignes) et 3 PNG,
`CLAUDE.md` sur disque, `CONVENTIONS` § 4 à 13, `rules/*`, le code de la couture, de `MatchEvent`, du Cricket
(règles, use case, hook, écran), `backupSchema`, `summarize`, `rankPlayers`, `GetReplayableConfigurations`,
`RestartMatchUseCase`, `container`, `useNouvellePartie`, étapes 1 et 2, `rejouer.ts`, `cartesPartie.ts`,
`tourDeTable.ts`, extraits de `labels.ts`.
**Non vérifié** : `PROJECT_PLAN` § 6 et le texte de `CHARTE_GRAPHIQUE.md` (vus à travers la planche et les
règles) ; détail de `MiniTableauPartie`, `CartePartie`, `useConfirmationSortie` ; si la liste de modes de
`hexagonalBoundary.test.ts:93` est dynamique ; les autres PNG ; aucun test lancé.

## Problème

Un cinquième mode avec : un **tirage de numéros** fait avant la partie, modifiable à la main, à écrire dans le
journal ; un état par joueur (vies, killer, éliminé) qui change à **chaque fléchette** et que l'écran montre
avant l'enregistrement de la volée ; un tour de table qui **saute** les éliminés ; un classement par **ordre
d'élimination**. Le tout doit tenir dans le journal, l'annulation, le brouillon de volée, la boîte de sortie,
la sauvegarde, Rejouer et les cartes, sans import entre modes.

## Options considérées

| Sujet | Option | Pour | Contre | Retenu |
|---|---|---|---|---|
| Où écrire les numéros | Dans `config` | Un seul objet | Faux pour Rejouer (config = mode + réglages + ensemble de joueurs, sans les numéros) : à exclure partout | non |
| | Événement séparé `NumbersDrawn` | Calqué sur `RoundStarted` | Complique l'annulation (`events.length <= 1`) | non |
| | **Champ `numbers` de l'ouverture, indexé comme `playerIds`** | Même statut que `playerIds` / `startingPlayerIndex` ; hors config donc hors configuration rejouable | Deux tableaux parallèles à valider ensemble | **oui** |
| Où tirer | Au lancement seulement | Simple | La planche veut le tirage déjà fait à l'arrivée de l'étape 2 | non |
| | **Port driving synchrone `DrawKillerNumbers` pour l'étape 2 + repli dans `PlayKiller.start` si `numbers` absent** | Précédent `ShuffleOrder` ; une seule fonction de tirage | Deux appelants | **oui** |
| Où garder les numéros pendant le parcours | `localStorage` | Survit au rechargement | Donnée nouvelle (politique) ; persisterait d'une partie à l'autre | non |
| | `history.state` | Survit au rechargement | Complexe, contraire au mécanisme des étapes | non |
| | **`useState` dans `useNouvellePartie`**, comme le nom tapé | Zéro donnée stockée ; survit aux allers-retours entre étapes | Perdu au rechargement (tirés au lancement) | **oui** |
| Classement | Comparateur dans `rankPlayers` + ordre d'élimination dans le résumé | Patron existant | Le résumé recalcule : travers du constat #24 | non |
| | **`KillerRules.ranking(state)` (domaine)** ; `summarize` en tire `rank`, `rankPlayers` trie par `rank` | Une seule implémentation de la règle 9 | — | **oui** |
| Journal incohérent à l'import | Valider seulement l'ouverture | Périmètre minimal | Ne refuse pas une volée après la fin, ni un `RoundStarted` dans un journal Killer | non |
| | **Rejouer le journal (`GameModes.project`) dans `versMatchRecord`, tous modes** (repli acceptable : Killer seul) | Couvre tout le critère 15 | Touche le constat #11 (« à trancher ») : à signaler à `sec` et à la Revue | recommandé |

## Approche retenue

Un dossier `games/killer/` pur ; l'ouverture `KillerStarted` porte `numbers` ; les volées utilisent
`VisitRecorded`, partagé ; un module de règles séquentiel, stable par préfixe, avec aperçu synchrone ; port
`PlayKiller` regroupé comme `PlayCricket`, plus `PreviewKillerVisit` et `DrawKillerNumbers` ; `useKiller` en
cinquième utilisateur de `useVoleeEnCours` ; numéros en mémoire pendant le parcours ; aucune table Dexie,
aucun format nouveau hors journal, `BACKUP_VERSION` inchangé (1).

### Domaine (`src/core/domain/games/killer/`)

- **`config.ts`** : `KILLER_NUMBERS` 1-20 (bulle exclue) ; `KILLER_LIVES = [3, 5] as const` (liste fermée dans
  le domaine : borne aussi ce qu'un fichier importé peut demander d'afficher) ; `KILLER_MIN_PLAYERS = 2`,
  `KILLER_MAX_PLAYERS = 6` ; `KillerConfig { startingLives, selfHitCostsLives }`, `create({ startingLives = 3,
  selfHitCostsLives = false } = {})` refuse une valeur hors liste et un booléen mal typé (leçon du constat #11).
- **Événement** (`MatchEvent.ts`) : `KillerStarted { type, config, playerIds (2 à 6, différents), numbers
  (numbers[i] = numéro de playerIds[i], entiers 1-20 différents), startingPlayerIndex, name? (clé absente sans
  nom tapé) }`, ajouté à l'union et à `nameOf` (`default` typé `never`). Aucun autre événement : effets,
  éliminations et jalons sont **déduits**, jamais stockés.
- **`rules.ts`** : types `KillerPlayerState`, `KillerDartEffect` (`NONE` | `BECAME_KILLER` | `HIT` avec
  `livesLost` réel après plancher ; un tir sur son propre numéro, variante, est un `HIT` sur le lanceur),
  `KillerVisit { playerId, darts (tronquée à la fléchette qui gagne ou élimine le lanceur), effects }`,
  `KillerMilestone` (`BecameKiller`, `PlayerEliminated`, `MatchFinished`), `KillerState { mode:'KILLER', config,
  players, currentPlayerIndex, startingPlayerIndex, winnerId, finished, eliminations, history, milestones }`.
  - `start(event)` refuse : < 2 ou > 6 joueurs, joueur en double, longueurs différentes, numéro non entier,
    hors 1-20 ou en double, `startingPlayerIndex` hors bornes.
  - `applyVisit(state, darts)` (1 à 3 fléchettes, `DomainError` si finie), fléchette par fléchette, arrêt dès
    qu'un arrêt survient : segment hors 1-20 (`MISS`, bulle) → `NONE` ; propriétaire absent ou éliminé →
    `NONE` ; propriétaire = lanceur : pas killer → un **double** le rend killer (jalon), simple / triple rien ;
    killer, variante désactivée → `NONE` ; killer, variante activée → `HIT` sur lui-même (S1/D2/T3, plancher),
    à 0 vie éliminé et **volée arrêtée** ; propriétaire = adversaire : lanceur non killer → `NONE`, killer →
    `HIT` de `min(multiplicateur, vies)`, élimine à 0. Après chaque fléchette, un seul joueur en vie → vainqueur,
    partie finie, arrêt. Une fléchette ne touche qu'un numéro : toujours au moins un joueur en vie, ni nul ni
    `winnerId` nul. Le statut killer change **dans la boucle** (règle 4). Partie non finie : prochain joueur
    **en vie** après le lanceur, en tournant.
  - `project(events)` (aussi l'annulation : `project(events.slice(0, -1))`), `currentPlayer`, `isFinished`,
    `visitIsOver(state, darts)` (finie, 3 fléchettes ou lanceur éliminé : seule source de `complete`),
    `livesLostIn(visit, playerId)` (pour le « −N »), `ranking(state)` (gagnant ; puis vivants par vies
    décroissantes, l'ordre de jeu départageant, ex æquo à rang partagé en cours de partie ; puis éliminés dans
    l'ordre inverse d'élimination ; partie finie : rangs 1 à n distincts).
  - **Pas de divergence affichage / rejeu** : aperçu, enregistrement et jugement du brouillon relu appellent la
    **même** `applyVisit` ; l'effet de la fléchette k ne dépend que de la base et des fléchettes 1 à k ; un test
    de propriété le prouve.
- **Couture `games/index.ts`** : `'KILLER'` dans `GAME_MODE_IDS`, `KillerState` dans `AnyMatchState`, `case
  'KillerStarted'` dans `modeOf`, branches de `project`, `isFinished`, `currentPlayerId` ; `visitCount` =
  `history.length` ; `isSolo` inchangé. ⚠️ **Piège** : `project` envoie aujourd'hui tout mode non listé dans un
  `default` X01 (TypeScript ne verrait pas l'oubli, un journal Killer irait dans `X01Rules`) : le remplacer par
  des `case` explicites et un `default` typé `never`, pareil pour `isFinished` et `currentPlayerId`. `killer/`
  n'importe aucun autre mode.

### Application

- **Ports driving** : `PlayKiller` (`start`, `getState`, `recordVisit` → `{ state, visit, milestones }`,
  `undoLastVisit` → `ReopenedVisit<KillerState>` ; `StartKillerCommand { playerIds, config, numbers?,
  startingPlayerIndex?, name? }`, pas de `shuffle`) ; `PreviewKillerVisit` (synchrone et pur, `{ state,
  complete, visit | null }`) ; `DrawKillerNumbers` (synchrone, `execute({ count, excluded })`, `DomainError` s'il
  n'y a pas assez de numéros).
- **Use cases** : `drawKillerNumbers.ts` (fonction pure sur `RandomSource.nextInt`, modèle `shufflePlayers.ts`),
  `DrawKillerNumbersUseCase`, `PreviewKillerVisitUseCase`, `PlayKillerUseCase(matches, players, clock, ids,
  random)` (nom par `nameField`, numéros tirés et **écrits** si absents, profils inconnus refusés,
  `KillerRules.start` avant toute écriture, projection avant sauvegarde à l'annulation), branche
  `KillerStarted` de `RestartMatchUseCase` (numéros repris ou nouveau tirage selon la question 3), `container.ts`
  (`playKiller`, `previewKillerVisit`, `drawKillerNumbers`).
- **Résumés, classement, Rejouer** : `MatchSummary` (`KillerSummaryPlayer`, `KillerSummary`), `summarize`
  (`rank` lu sur `KillerRules.ranking`), `rankPlayers` (`a.rank - b.rank` ; `leadingPlayers` : ex æquo de tête
  en cours, seul gagnant en fin), `matchStatus` inchangé, `GetReplayableConfigurations` (branche KILLER,
  `groupKey = ['KILLER', startingLives, selfHitCostsLives, joueurs triés]`, ni numéros, ni ordre, ni nom).
  Statistiques : `GetPlayerStatsUseCase.ts:62` filtre déjà `modeOf === 'X01'` : Killer exclu sans rien faire.
- **`backupSchema.ts`** : `'KillerStarted'` dans `OUVERTURES` ; `KillerConfig.create(...)`, `numbers` = liste
  d'entiers, `versOuverture`, puis `KillerRules.start(event)` (refuse 1 joueur, 7, doublon, 0, 21, `'BULL'`,
  longueurs différentes, `startingLives: 4`, booléen mal typé) ; recommandé : `GameModes.project(events)` dans
  `versMatchRecord` (partie refusée comptée dans `matchesSkipped`, sans planter) ; `BACKUP_VERSION` reste 1
  (précédent des trois modes).

### UI

- **`useKiller`** (calqué sur `useCricket`) : requête `['killer', matchId]`, `staleTime: Infinity` ; `evaluer`
  lit `previewKillerVisit` (incomplet → `'ouverte'`, complet et finie → `'en-attente'`, sinon `'close'` : une
  auto-élimination qui ne finit pas la partie s'enregistre tout de suite, sans boîte, comme un bust) ; fléchettes
  par `useVoleeEnCours` (jamais un `useState`), `pret` passé à `useConfirmationSortie` ; `affiche` = aperçu ou
  état réel, le joueur repéré reste le `currentPlayer` de l'état **réel** ; `sortieEnAttente` **dérivé**
  (`darts.length > 0 && apercu.state.finished`) ; `confirmation` au nom du **gagnant** de l'aperçu (forme
  « variante » de la planche si le dernier effet est un `HIT` sur le lanceur) ; `enregistrer` : cache, puis
  `poser([], resultat.state)`, haptique sur jalon ou victoire, **un seul** `say` =
  `annonceFinDeVolee(annonceKiller(jalons), prochainJoueur, finie ? phraseVictoire(matchId) : undefined)`, rien
  avant *Valider la sortie* ; `annuler`, `corrigerSortie`, `validerSortie`, `annulation`, `peutAnnuler`
  identiques au Cricket ; bascule S/D/T momentanée.
- **Écran** `ecrans/games/killer/KillerEcran.tsx` (aiguillé par `PartieEcran`, `lazy()`) : `DispositionPartie`,
  `BandeauMatch` (`pictogramme='killer'`, « Killer », sous-titre « 3 vies · 6 joueurs » sans mention de la
  variante, comme la planche, `droite` = « N en vie » en `<output aria-label>`, `regles=reglesDeLaConfigKiller`),
  `FeuilleKiller` (`ui/composants/killer/`), `PaveSaisie` inchangé (1-20, 5 colonnes, bulle 25/50),
  `BoiteConfirmation`, moment de victoire existant.
- **Résumé** `ResumeKillerEcran.tsx` : `TableauHonneur`, classement par `KillerRules.ranking` (rang laiton pour
  le 1er, avatar, nom, sous-ligne, « Numéro »), `ActionsFinDePartie`.
- **Parcours** : `reglagesPossibles.ts` (`VIES`, `JOUEURS_KILLER`) ; `useNouvellePartie` (préférences
  `partie:killer-vies` et `partie:killer-variante`, `max(mode)` exhaustif, `useState` des numéros par `PlayerId`,
  `completerNumeros`, `tirerNumeros`, `choisirNumero`, branche `lancer` qui complète les manquants, branche
  `rejouer` : préférences, **nouveau tirage**, Ordre ; ⚠️ le `switch` de `rejouer` n'a pas de `default` typé
  `never` : oubli silencieux, à ajouter) ; `NumerosKiller.tsx` (complétion dans un effet idempotent, invariants
  sous `StrictMode`) ; `EtapeJoueurs` (bloc numéros entre `ReglagesJeu` et `ChampNom`, consigne et « Continuer »
  désactivé sous 2 joueurs) ; `ReglagesJeu` (`case 'KILLER'` : récapitulatif, choix 3/5, bascule, `REGLE_KILLER`) ;
  `EtapeJeu` (`JEUX` = X01, Cricket, Tour du monde, Killer, puis l'entraînement en pleine largeur, option B) ;
  `rejouer.ts` (`estReproductible` avec maximum **par mode** : aujourd'hui `> MAX_JOUEURS` (4) écarterait tout
  Killer à 5 ou 6 joueurs) ; `chemins.ts` (`SLUG_MODE.KILLER = 'killer'`).
- **Cartes, règles, pictogramme** : `vueCarte` KILLER (pictogramme, « 3 vies », « 6 j. », vies, rang si terminée,
  jauge `{ type:'vies', restantes, total }`, `JoueurCarte.elimine`, « 4 en vie »), `MiniTableauPartie` et
  `CartePartie` (jauge et éliminé), `Pictogramme` `'killer'` (viseur, tracé exact de la planche), `labels.ts`
  (libellés de mode, tuile, règles `reglesKiller` avec la variante en gris, `annonceKiller`, confirmation,
  effets, « Vise D14 », « Éliminé », « N en vie », étape 2, `aria`, Rejouer), `reglesDuJeu.ts`.
- **Couleurs et tailles** : Killer `laiton` / `sur-laiton` ; éliminé fond `feutre`, `craie-3` barré,
  `grayscale` ; vies perdues tirets `craie-3` ; perte de vie et « éliminé » **`rouge-touche` proposé, en
  attente** (`rouge-texte` reste réservé à la feuille de règles) ; contraste sur `ardoise` 7,1:1 sombre / 6,5:1
  clair comme la planche, **sur le repère de la ligne active à mesurer**. Tailles de la planche (classes
  statiques) : numéro portrait 72/65/50/42/38 px et paysage 68/52/42/36/32 px pour 2/3/4/5/6 joueurs ; ligne
  portrait 108/84/70/56/50, paysage 90/70/58/50/43 ; colonnes `104px 84px 1fr 80px` portrait,
  `128px 84px 1fr 92px` paysage ; ligne de volée 56 / 46 px ; carrés de vie 15 px (12 au mini tableau) ; tuile
  de numéro 72 × 48 ; grille de choix ≥ 52 px. 38 et 32 px sont sous l'échelle X01, écart accepté par
  l'utilisateur, à confirmer sur téléphone.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | créer `games/killer/{config,rules}.ts` ; modifier `games/index.ts`, `events/MatchEvent.ts` | Mode complet, `KillerStarted`, couture (`default` typé `never`) |
| `core/application/` | créer `ports/driving/{PlayKiller,PreviewKillerVisit,DrawKillerNumbers}.ts`, `use-cases/{PlayKiller,PreviewKillerVisit,DrawKillerNumbers}UseCase.ts`, `drawKillerNumbers.ts` ; modifier `MatchSummary`, `summarize`, `rankPlayers`, `GetReplayableConfigurations(+UseCase)`, `RestartMatchUseCase`, `backupSchema` | Ports, use cases, résumé, classement, Rejouer, sauvegarde |
| `infrastructure/` | — | Aucun changement (pas de table Dexie) |
| `ui/` | créer `hooks/useKiller.ts`, `ecrans/games/killer/{KillerEcran,ResumeKillerEcran}.tsx`, `composants/killer/FeuilleKiller.tsx`, `ecrans/nouvelle-partie/NumerosKiller.tsx` ; modifier `PartieEcran`, `labels.ts`, `cartesPartie.ts`, `MiniTableauPartie`, `CartePartie`, `Pictogramme`, `chemins.ts`, `reglagesPossibles.ts`, `rejouer.ts`, `reglesDuJeu.ts`, `useNouvellePartie`, `EtapeJeu`, `EtapeJoueurs`, `ReglagesJeu` | Hook, écran, résumé, parcours, cartes |
| `composition/` | `container.ts` | `playKiller`, `previewKillerVisit`, `drawKillerNumbers`, `RestartMatchUseCase` |
| `tests/` | créer `domain/killer/{helpers,rules.test,config.test,ranking.test}`, `use-cases/{playKiller,drawKillerNumbers,previewKillerVisit}.test`, `ui/{killerEcran,killerParcours,killerCartes}.test.tsx` ; modifier `use-cases/lancerPartie.ts` (⚠️ 2 joueurs au moins pour KILLER, sinon tout `it.each(GAME_MODE_IDS)` en solo casse), `ui/voleePartielle.test.tsx` (`satisfies Record`), `ui/rejouer.test.ts` (garde `it.each(GAME_MODE_IDS)`, constat #31), `ui/nomDePartieEcrans.test.tsx`, `domain/matchName.test.ts` (`OUVERTURES`), `architecture/lazyRoutes.test.ts`, tests de sauvegarde / cartes / `rankPlayers` / relance, `hexagonalBoundary` si sa liste est en dur (non vérifié) | Voir plan de tests |

Environ **70 fichiers** (16 créés en `src`, 7 à 9 en tests, ~26 modifiés en `src`, ~11 en tests, ~8 docs).

**Sens des dépendances vérifié :** `killer/` n'importe que les objets valeur et `DomainError` ; `application`
importe le domaine ; l'UI importe des types, constantes, `KillerConfig.create`, `KillerRules.ranking` (pure) et
`rankPlayers`, tout le reste par `useServices()` ; câblage dans `container.ts` seulement ; aucun `Math.random`
ni `Date` (tirage par `RandomSource.nextInt`).
**Nouveau port ?** Oui, trois : `PlayKiller` (consommateur `useKiller`, `RestartMatchUseCase`),
`PreviewKillerVisit` (`useKiller`), `DrawKillerNumbers` (étape 2).

### Plan de tests (fakes, jamais de mocks)

- **Domaine**, chaque cas limite des deux côtés : double de son numéro contre simple / triple ; avant / après
  killer ; fléchette suivante comptée tout de suite ; 1, 2, 3 vies ; plancher ; élimination ; joueur sauté ;
  numéro d'un éliminé inerte ; bulle 25 et 50, `MISS`, numéro non attribué ; dernier survivant ; volée
  tronquée ; classement en cours et fini ; 2, 3, 6 joueurs ; vies 3 et 5 ; variante désactivée / activée
  (propre numéro, auto-élimination qui arrête la volée, adversaire vainqueur, D de son numéro sans perte avant
  d'être killer) ; toutes les validations de `start` ; propriété de préfixe ; annulation = projection du
  journal privé de sa dernière volée ; `modeOf`.
- **Application** : tirage (`CyclingRandomSource` : unicité, plage, jamais la bulle, `excluded`, épuisement) ;
  lancement avec et sans `numbers` ; règles avant écriture ; `ReopenedVisit` ; relance ; résumé, `rankPlayers`,
  `leadingPlayers` ; `groupKey` sans numéros, configuration à 6 joueurs gardée ; sauvegarde : aller-retour
  identique, ancienne sauvegarde, chaque journal incohérent refusé et compté ; `GAME_MODE_IDS` partout.
- **UI** : tuile ; fiche et préférences ; numéros (tirés à l'arrivée, grille, ajout, retrait, réordre,
  « Tirer au sort », moins de 2 joueurs) ; Rejouer (nouveau tirage, Ordre) ; écran (effets par fléchette, vies
  et killer pendant la volée) ; boîte au nom du gagnant, forme variante ; Corriger / Échap / voile ; rien
  d'écrit avant *Valider* (`DepotCompteur`) ; voix muette avant validation puis un seul `say` ; rechargement
  (mêmes services, nouveau `QueryClient`) ; cartes ; `themeBoundary`.
- Relecture sur téléphone : obligatoire.

## Décisions de `CLAUDE.md` concernées

**Concernées** : hexagonal ; journal et tirage écrit ; saisie fléchette par fléchette ; modes de jeu (à lever
pour Killer) ; Nouvelle partie en routes ; habillage du parcours (« tuiles 2 × 2 » devient l'option B) ;
Rejouer (config sans numéros, nouveau tirage, nom jamais repris) ; livre de règles ; annulation / sortie
confirmée (ajouter Killer, nom du **gagnant**, auto-élimination comprise) ; phrase de victoire ; brouillon de
volée (cinq hooks) ; hors statistiques ; charte.
**À graver dans ce lot** : section « Règles du Killer (référence — NE PAS improviser) » (12 règles validées +
précisions des critères 4, 5, 7) ; ligne de Décisions structurantes (numéros dans `KillerStarted.numbers` hors
config, tirés à l'étape 2 par `DrawKillerNumbers`, Rejouer = nouveau tirage, `partie:killer-vies` et
`partie:killer-variante` jamais renommées, 2 à 6 joueurs) ; « Killer et Shanghai hors v1 » devient « Shanghai
hors v1 » et Décision ouverte n° 3 à mettre à jour ; `CONVENTIONS` § 9, 10, 13 (« vérifié quatre fois » + pièges
du lot : maximum de joueurs par mode, `default` de `project`, `switch` de `rejouer`, `lancerPartie` à 2
joueurs), § 14 ; `PROJECT_PLAN` ; `CHARTE` (écran de match Killer) ; `glossary` (killer, vie, éliminé, numéro) ;
`rules/frontend-react.md` (cinq hooks) ; `rules/theme-colors.md` si `rouge-touche` est confirmé ; `README.md`
(liste des modes) ; index régénéré après `CLAUDE.md`.

## Baseline sécurité

Seule entrée non fiable : l'import JSON. `KillerStarted` validé strictement (liste fermée des vies : borne le
nombre de carrés rendus, un fichier ne peut pas figer l'affichage ; 2 à 6 joueurs ; numéros entiers 1-20
uniques de même longueur ; booléen typé ; fléchettes par `versDart`) ; projection du journal recommandée ;
partie refusée sans planter ; brouillon d'une partie remplacée effacé (existant). Aucun réseau, aucune
dépendance, service worker et en-têtes intacts, pseudos rendus en texte. **Résiduels** : #11 (écriture non
atomique entre parties, `createdAt` non borné ; inchangé, non aggravé) ; contraste de `rouge-touche` sur la
ligne active en thème clair, à mesurer (Dev, Revue) ; lisibilité du numéro à 38 / 32 px (utilisateur, sur
téléphone).

## Conformité à la planche

Tous les éléments listés (bandeau, feuille à 4 colonnes, ligne active, éliminé, badges, carrés de vie, ligne de
volée, échelles, pavé, boîtes « gagne sur D8 ? » et « gagne ? », résumé, étape 2 : joueurs, fiche, bloc
Numéros, consigne sous 2 joueurs, étape 1 option B, mini tableau, carte terminée, viseur) ont une
implémentation prévue. **Aucun écart posé par le plan.** Divergences entre planche et code, ou cas non dessinés :
questions ci-dessous. Fait à noter : la demande dit que « Éliminé par … » exigerait de garder une information
dans le journal ; l'architecte constate que c'est **faux** (le lanceur de la fléchette `HIT` éliminante se
déduit du journal) ; le choix de l'ajouter reste celui de l'utilisateur.

## Questions ouvertes

### Clôturées par ce rapport

| Blocage | Décision |
|---|---|
| Brouillon de volée à Killer | **Oui** : `useKiller` passe par `useVoleeEnCours` (décision gravée « un seul mécanisme »). Aucune table ni format nouveau |
| Clés, événement, `backupSchema` | `partie:killer-vies` (3 ou 5, défaut 3), `partie:killer-variante` (booléen, défaut false), jamais renommées ; `KillerStarted`, volées en `VisitRecorded` ; `BACKUP_VERSION` reste 1 |
| Forme du classement | `KillerRules.ranking` ; `rank` dans le résumé ; `rankPlayers` trie par `rank` |
| `/confidentialite` | **Inchangée** (texte et date) : les deux préférences entrent dans « les réglages de la dernière partie » (`labels.ts:436`), les numéros restent en mémoire. À confirmer en Revue, et à revoir si la question 4 mène à une sélection Killer séparée |

### Questions pour l'utilisateur (aucune tranchée par l'architecte ; elles bloquent seulement la partie UI concernée)

| # | Question | Pour qui |
|---|---|---|
| 1 | Accord « éliminé / éliminée » : les profils n'ont pas de genre ; la planche écrit « Sarah éliminée » et « Éliminée par Julien », la demande fait dire « est éliminé ». Quelle forme partout (cases de volée, boîte, résumé, voix) ? | Utilisateur |
| 2 | « Éliminé par … » au résumé : hors lot par défaut, la ligne devient « Éliminé ». Confirmé ? (ajoutable sans rien stocker) | Utilisateur |
| 3 | « On remet ça » : mêmes numéros ou nouveau tirage ? | Utilisateur |
| 4 | Sélection de joueurs partagée `partie:joueurs` : après un Killer à 5-6 joueurs elle dépasse les 4 des autres modes. Couper, garder, ou sélection Killer à part ? | Utilisateur |
| 5 | Étape 1 : la planche ajoute une ligne « plage de joueurs » sur toutes les tuiles, d'autres phrases pour X01, Cricket et Entraînement, l'étiquette « Quel jeu ? », « Cricket 2 à 4 joueurs » (le code accepte 1), la carte X01 « 0 ✓ ». Aligner l'existant sur la planche, ou seulement la tuile Killer et la grille B ? | Utilisateur |
| 6 | Rangée « Ou un autre jeu » (4 colonnes) avec 5 jeux : non dessinée | Utilisateur |
| 7 | Filtre de Parties : 6 entrées (Tous + 5 jeux), ordre et mise en page non dessinés | Utilisateur |
| 8 | Textes des cartes : « 3 vies · tirage aléatoire » (non déductible du journal si numéros changés à la main) ; « Le plus petit gagne · 3 vies » sur la carte terminée (formule du cut-throat) ; variante nulle part ; chiffre d'une carte en cours / abandonnée : rang ou vies ? ; libellés de la ligne Rejouer | Utilisateur |
| 9 | Mini tableau en cours : tri par vies décroissantes, éliminés en bas, ex æquo dans l'ordre de jeu (planche) ; la règle existante teinte la ligne de tête, la planche non. Laquelle ? | Utilisateur |
| 10 | « −N » rouge quand le coup dépasse les vies (triple sur 1 vie) : vies réellement perdues (−1) ou barème (−3) ? | Utilisateur |
| 11 | Voix : à la victoire, seulement « Julien est éliminé » puis la phrase, ou aussi « Partie gagnée ! » comme au Cricket ? Garder « À toi, X » après chaque volée ? | Utilisateur |
| 12 | « Dernier en vie · 3 vies » au résumé : vies restantes ou de départ ? | Utilisateur |
| 13 | Étape 2, cas non dessinés : consigne à 0 joueur ; la grille se referme-t-elle après un choix ? ; retour du téléphone grille ouverte : rien (comme les dépliants) ? ; griser « Ordre » sous 2 joueurs (décision gravée « grisé seul en piste ») ? | Utilisateur |
| 14 | Rouge de perte de vie : confirmer `rouge-touche` (jeton général) à la place de `rouge-texte` (réservé) | Utilisateur |
| 15 | **Découpage** : environ 70 fichiers, au-delà des 100 tours de `dev`. Recommandation : deux passes de `dev` sur la même branche `lot/killer` — passe 1 domaine, application, sauvegarde, `container` et les branches UI qu'impose la compilation (Killer **inaccessible** : pas de tuile, un Killer importé affiche une erreur) ; passe 2 hook, écran, résumé, parcours, Rejouer, voix — avec un point d'accord entre les deux. Fusionner la passe 1 seule laisserait un mode inaccessible sur `main` : à ne faire qu'avec votre accord | Utilisateur |

### Réponses de l'utilisateur (2026-10-20), à l'arrêt Archi → Dev

| # | Réponse |
|---|---|
| 15 | **Deux passes `dev` sur la même branche `lot/killer`**, un seul commit, une seule fusion |
| 1 | **Suivre la planche : accord au féminin pour un joueur féminin** (« Sarah éliminée »). Constat posé à l'utilisateur : Dartpéro ne connaît pas le genre d'un profil et ne le devine pas d'après le prénom → il a choisi **d'ajouter un genre au profil, dans ce lot** (voir « Conséquence » ci-dessous) |
| 2 | **Oui : « Éliminé par … » au résumé** (déduit du journal, sans stockage) — **élargit le lot** par rapport à la demande validée |
| 3 | « On remet ça » : **nouveau tirage** des numéros |
| 4 | Sélection de joueurs : **couper à la limite du jeu** quand on change de jeu (aucune clé nouvelle) |
| 5 | Étape 1 : **seulement la tuile Killer et la grille B** ; les tuiles existantes gardent leurs textes |
| 6, 7 | **Mises en page existantes, une entrée de plus** (ordre X01, Cricket, Tour du monde, Killer, Entraînement) ; écart à relire sur téléphone |
| 8 | Carte : **« 3 vies » seulement**, ni « tirage aléatoire » ni « Le plus petit gagne » ; la variante n'apparaît pas ; chiffre d'une carte en cours / abandonnée : **les vies du joueur en tête** ; rang pour une partie terminée |
| 9 | Mini tableau en cours : **la planche** (tri par vies décroissantes, éliminés en bas, ex æquo dans l'ordre de jeu, **pas de teinte** de la ligne de tête) |
| 10 | « −N » rouge : **vies réellement perdues** (−1 pour un triple sur 1 vie) |
| 11 | Voix à la victoire : « X est éliminé » puis la phrase, **sans « À toi »** ni « Partie gagnée ! » |
| 12 | « Dernier en vie · N vies » : **vies restantes** |
| 13 | Étape 2 : la grille **se referme** après un choix ; retour du téléphone **sans effet** ; même consigne à 0 joueur ; **Ordre grisé** sous 2 joueurs |
| 14 | Rouge de perte de vie : **`rouge-touche`** confirmé |

**Conséquence de la réponse 1 (changement de périmètre, à instruire avant Dev).** Un genre par profil est une
donnée nouvelle qui n'est **ni dans la demande validée ni dans la planche**, et qui touche des surfaces
gravées : le **profil** (format persisté, `backupSchema`, `Player`), la **politique `/confidentialite`**
(donnée stockée nouvelle : texte et date, `CLAUDE.md` § Décisions structurantes), et un **écran** de création /
modification d'un joueur qu'aucune planche ne dessine (règle « les architectes suivent la planche » : aucun point
produit n'est tranché par un agent ni par l'Orchestrator). Restent des points produit non tranchés : les valeurs
du genre (deux, trois, « non précisé » ?) et le libellé du choix ; la valeur par défaut des profils existants
et ce que dit l'app pour eux ; où se choisit le genre (création, modification, les deux) ; le sort du genre à
l'import d'une ancienne sauvegarde ; si l'accord s'applique à d'autres textes que le Killer. Ces points relèvent
d'une **révision de la demande** (`/intake killer`, que seul l'utilisateur peut lancer) et d'une **planche**, puis
d'une **Révision de ce fichier** (boucle Archi, utilisateur d'abord). Avec la réponse 2, la demande validée doit
aussi acter le « Éliminé par … ».

### Questions techniques

- **Dev** : pièges à éviter : `default` de `GameModes.project` ; `switch` de `rejouer` ; maximum par mode de
  `estReproductible` ; `lancerPartie` à 2 joueurs ; `lazyRoutes` ; `OUVERTURES` de `matchName`.
- **Test** : propriété de préfixe ; double effet de `StrictMode` à la complétion (invariants, pas valeurs
  exactes) ; garde exhaustive de Rejouer.
- **Sécurité** : projeter le journal à l'import pour tous les modes (touche le constat #11) ou pour Killer
  seul ? Mesurer les contrastes.

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.

### Révision 1 (2026-10-20) — genre du profil, « Éliminé par … », réponses du 2026-10-20

> Rapport `archi-authority` (opus / max, 1 lancement, `Architecture result: PASS`), delta seul : tout ce qui
> n'est pas cité reste tel que la version précédente. Déclencheur : la demande révisée (règles 13 et 14,
> planche `genre-profil`, piste B). **Lu** : index, `01`, `request.md` révisée, planche `genre-profil` entière,
> parties de `killer.html`, `Player`, `PlayerColor`, `database`, `DexiePlayerRepository`, `backupSchema`,
> `ManageBackupUseCase`, `ManagePlayers(+UseCase)`, `rules/persistence.md`, `DialogueNouveauJoueur`,
> `JoueursEcran`, `useJoueurs`, `useNouvellePartie` (l.95-234), `labels.ts` (l.395-470, 2452-2475),
> `ChoixSegmente`, `ReglagesJeu` (`Depliant`), `EtapeJeu`, `PartieEcran`, `MatchSummary`, `summarize`,
> `ResumeCricketEcran`, `confidentialite.test.tsx`. **Non vérifié** : `CartePartie.tsx` et `UNITE_CARTE`, forme
> du port `GetReplayableConfigurations`, liste de `hexagonalBoundary.test.ts`, aides par mode de plusieurs
> tests, `DEPLOIEMENT.md` § Dexie, valeur de `--repere`, documentation Dexie (preuve par le code). Aucun test
> lancé.

**Options (delta).** « Non précisé » : valeur écrite `'UNSPECIFIED'` (non : contraire à « clé absente ») ou **liste
fermée `['MASCULINE','FEMININE']`, clé absente = non précisé** (oui, aucune migration). Création :
**paramètre final facultatif** `create(name, color?, gender?)` (oui, sans casser ~200 appels de test).
Modification : **`PlayerChanges.gender?: PlayerGender | null`** (absent = inchangé, `null` = non précisé).
Dexie : **pas de `db.version(4)`** (champ non indexé ; preuve : `color` et `createdAt` sont écrits sans figurer
dans un `.stores()`, la v2 n'avait pas de `.stores()`, un profil sans `gender` est valide donc rien à
compléter ; à prouver par test sur une ligne brute). Acheminement vers le Killer : **`useProfils()` côté UI**,
comme le pseudo et la couleur, avec une garde `genreBoundary` (pas dans `SummaryPlayer`, ni dans
`PlayKiller` / `KillerState`). « Éliminé par » : **`KillerState.eliminations: { playerId, by }[]` déduit au
rejeu** (pas de champ dans `KillerSummaryPlayer` : le résumé lit `playKiller.getState`, précédent
`ResumeCricketEcran`).

**Genre du profil.** Domaine : `src/core/domain/value-objects/PlayerGender.ts` calqué sur `PlayerColor`
(`PLAYER_GENDERS = ['MASCULINE','FEMININE'] as const`, `PlayerGender.of`), valeurs **persistées, jamais
renommées** ; `Player.gender?`, `create(id, name, color, createdAt, gender?)` avec étalement conditionnel
(⚠️ `exactOptionalPropertyTypes` non activé : `gender: undefined` n'est pas refusé par le compilateur, seuls
l'étalement et des tests `'gender' in x === false` le garantissent). Application : `ManagePlayers.create(name,
color?, gender?)`, `PlayerChanges.gender`, `ManagePlayersUseCase.update` (`createdAt` ne bouge pas), aucun port
nouveau, `container.ts` inchangé pour le genre. Dexie : `StoredPlayer.gender?: string`, `save` par `put` avec
étalement (repasser à « non précisé » retire la clé), lecteur à littéral validé par `PlayerGender.of`.
Sauvegarde : `versPlayer` lit `gender` (`texte` puis `PlayerGender.of`), valeur invalide (`'X'`, `42`, `null`,
`'feminine'`) refusée sans planter, clé absente = non précisé ; **`BACKUP_VERSION` reste 1** ; export
(`ManageBackupUseCase.exportAll`, `BackupPlayer`) ajoute le genre ; importer une vieille sauvegarde qui contient
un profil existant le remet à « non précisé » (l'import remplace). Fakes : `InMemoryPlayerRepository` inchangé.

**Politique `/confidentialite`** (décision « inchangée » **renversée**) : `labels.ts:413` date → « Mise à jour le
20 octobre 2026 » ; `:435` ajoute « et, si vous l'avez choisi, le genre — masculin ou féminin — qui sert
seulement à accorder « éliminé / éliminée » au Killer » ; `:445` « profils (pseudos, couleurs et genres
choisis) » ; `:454` (voix en ligne) inchangée dans le plan, question 7 ; `confidentialite.test.tsx:84` passe à
« 20 octobre 2026 » et un `it` vérifie que `:435` et `:445` citent le genre ; la date reste une relecture
(Sécurité, Revue).

**Accord dans le Killer.** `accordElimine(genre)` dans `labels.ts` (entrée = genre du joueur **éliminé**,
« éliminée » seulement pour `FEMININE`) ; constructeurs `pastilleElimine(genre)` (`FeuilleKiller`),
`effetElimination(nom, genre)` (« Sarah éliminée », `rouge-touche`), `sousLigneElimination(genre, par)`
(« Éliminée par Julien », ou « Éliminée » seul si `par === null`, `ResumeKillerEcran`), voix dans
`annonceKiller(jalons)` avec `{ type:'ELIMINE', nom, genre }` (`useKiller`). « Éliminé par Julien » ne reçoit
jamais le genre de Julien. Garde **`tests/architecture/genreBoundary.test.ts`** : le mot `gender` n'apparaît
que dans une liste fermée de fichiers (cœur / persistance : `PlayerGender`, `Player`, `ManagePlayers(+UseCase)`,
`ManageBackup(+UseCase)`, `backupSchema`, `database`, `DexiePlayerRepository` ; UI : `labels`, `useKiller`,
`FeuilleKiller`, `KillerEcran`, `ResumeKillerEcran`, `ChoixGenre`, `DialogueNouveauJoueur`, `JoueursEcran`,
`useNouvellePartie`), plancher, et absence dans `games/**`, `GetPlayerStatsUseCase`, `rankPlayers`,
`summarize`, `cartesPartie`, `StatistiquesEcran`.

**« Éliminé par … ».** `KillerElimination = { playerId, by }`, ordre d'élimination ; `by` = lanceur de la volée
au `HIT` éliminant, `by === playerId` pour une auto-élimination ; jalon `PlayerEliminated { playerId, by }` ;
rien de stocké, l'annulation le retire d'elle-même ; ni `MatchEvent`, ni `backupSchema`, ni `summarize` ne
changent. `ResumeKillerEcran` lit `playKiller.getState` et résout `par` par `profils.get(by)`.

**UI du genre.** `src/ui/composants/commun/ChoixGenre.tsx` enveloppe `ChoixSegmente` (valeurs UI
`MASCULINE | FEMININE | NON_PRECISE`, `NON_PRECISE` converti en `undefined` à la sortie ; prop
`legendeMasquee` à ajouter à `ChoixSegmente`). Libellés : `LEGENDE_GENRE`, `LIBELLE_GENRE`, `AIDE_GENRE`,
`LIBELLE_MODIFIER`. `DialogueNouveauJoueur` (piste B) : étiquette « Genre », ligne repliée `LigneGenre`
(bouton 48 px, `aria-expanded`), ouverte = `ChoixGenre` ; **réinitialisation à chaque ouverture** (genre
`undefined`, replié) ; `onCreer(nom, genre)` propagé par `EtapeJoueurs`, `NouvellePartieEcran`,
`ChoixJoueursExistants`, `useNouvellePartie.creerJoueur(mode, nom, genre)` → `managePlayers.create(nom,
undefined, genre)`. `JoueursEcran` (`CarteProfil`) : `useState(joueur.gender)` réinitialisé dans `ouvrir()`,
`ChoixGenre` entre `ChoixCouleur` et les boutons, `update(id, { name, color, gender: gender ?? null })` ;
**au repos : rien ne change**.

**Réponses du 2026-10-20 : changements du plan précédent, fichier par fichier.**
`rules.ts` : `eliminations { playerId, by }` ; « −N » = `livesLostIn` (vies réellement perdues).
`games/index.ts` : `'KILLER'` inséré **avant** `'CHECKOUT_PRACTICE'` dans `GAME_MODE_IDS` (aujourd'hui
`['X01','TOUR_DU_MONDE','CRICKET','CHECKOUT_PRACTICE']`). `PartieEcran.tsx` (**constat nouveau**) : `default:
return x01` (l.100-101) ouvrirait l'écran X01 pour un journal Killer : passe 1 `case 'KILLER'` → `EcranErreur` et
`default` typé `never`, passe 2 `lazy()` et prop. `RestartMatchUseCase` : relance **sans** `numbers` (nouveau
tirage). `useNouvellePartie` : `max(mode)` en `switch` exhaustif (4 ; KILLER 6 ; entraînement 1),
`selection(mode) = selectionGroupe.slice(0, max(mode))` (dérivée, aucune clé nouvelle ; ⚠️ `retirer` doit
partir de `selection(mode)`). `EtapeJeu` : `JEUX` = X01, Cricket, Tour du monde, Killer, puis l'entraînement en
pleine largeur ; ligne « 2 à 6 joueurs » **sur la seule tuile Killer** ; phrase « Un numéro, des vies : le
dernier en vie gagne. ». `HistoriqueEcran` : le filtre suit `[TOUS, ...GAME_MODE_IDS]`. `cartesPartie` : « 3
vies » seulement ; chiffre en cours / abandonnée = vies du joueur en tête, rang à la fin ;
`enTeteDuClassement: false` pour Killer en cours ; ordre = `rank`. `MiniTableauPartie` : jauge `vies`, éliminés
barrés. `useKiller` : `annonceFinDeVolee(annonceKiller(jalons), finie ? null : prochain, finie ?
phraseVictoire(matchId) : undefined)` (pas de « À toi » à la victoire, jamais « Partie gagnée ! »).
`FeuilleKiller` : `text-rouge-touche` pour « −N » et l'effet d'élimination ; pastille `craie-3`.
`ResumeKillerEcran` : « Éliminé(e) par X » / « Éliminé(e) » ; « Dernier en vie · N vies » = vies restantes.
`NumerosKiller` : la grille se referme après un choix, aucune entrée d'historique. `EtapeJoueurs` : même
consigne à 0 et 1 joueur, « Continuer » désactivé ; Ordre grisé **déjà** par `grisees={n < 2 ? 1 : 0}` (un test
à écrire). `rules/theme-colors.md` : `rouge-touche` gagne `FeuilleKiller` ; contraste sur `ardoise` 7,1 / 6,5:1,
**à mesurer sur `--repere`**.

**Découpage en deux passes `dev`** (une branche, aucun commit entre les passes, un seul commit final). Règle des
coutures : un fichier d'UI n'est touché en passe 1 que si `npm run typecheck` l'exige ; branche finale quand
elle se réduit à une table de correspondance, sinon branche provisoire marquée `// KILLER-PASSE-2` ; les tests
d'UI qui ouvrent un écran, l'étape 2 ou le résumé passent par **une seule** aide temporaire
`tests/ui/modesAvecEcran.ts` (`MODES_AVEC_ECRAN`, `ModeAvecEcran`, marquée `KILLER-PASSE-2`) ; les tests de use
case gardent `GAME_MODE_IDS`, Killer compris.

- **Passe 1 — cœur, persistance, sauvegarde, politique, branches imposées** (Killer inaccessible, pas de tuile ;
  ordre interne : genre, domaine Killer, application, couture et branches d'UI, chaque palier vert).
  *À créer (`src`)* : `PlayerGender.ts` ; `games/killer/{config,rules}.ts` ; `ports/driving/{PlayKiller,
  PreviewKillerVisit,DrawKillerNumbers}.ts` ; `use-cases/{drawKillerNumbers,DrawKillerNumbersUseCase,
  PreviewKillerVisitUseCase,PlayKillerUseCase}.ts`. *À modifier* : `Player.ts`, `MatchEvent.ts`,
  `games/index.ts`, `ManagePlayers.ts`, `ManageBackup.ts`, `MatchSummary.ts`, `GetReplayableConfigurations.ts`
  (si le type liste les modes), `ManagePlayersUseCase`, `ManageBackupUseCase`, `backupSchema`, `summarize`,
  `rankPlayers`, `GetReplayableConfigurationsUseCase`, `RestartMatchUseCase`, `database.ts` (type et commentaire),
  `DexiePlayerRepository`, `container.ts`, et côté UI imposé : `labels.ts` (`LIBELLE_MODE`, `LIBELLE_MODE_COURT`,
  `UNITE_CARTE`, `PHRASE_TUILE`, `TITRE_REGLES`, `reglesKiller`, `sousTitreOrdre` marqué, politique l.413/435/445),
  `chemins.ts`, `cartesPartie.ts`, `Pictogramme.tsx` (viseur, tracé exact, garde `pictogrammesBoundary`),
  `MiniTableauPartie.tsx`, `CartePartie.tsx` (si requis), `reglesDuJeu.ts`, `useNouvellePartie.ts` (seul `case
  'KILLER'` marqué), `ReglagesJeu.tsx` (idem), `PartieEcran.tsx`, tout autre fichier signalé par `tsc` (listé
  dans `02-dev-notes.md`). *Tests à créer* : `domain/playerGender.test.ts`, `domain/killer/{helpers,config.test,
  rules.test,ranking.test}`, `use-cases/{playKiller,drawKillerNumbers,previewKillerVisit}.test.ts`,
  `ui/killerCartes.test.tsx`, `architecture/genreBoundary.test.ts`, `ui/modesAvecEcran.ts` (temporaire).
  *Tests à modifier* : `managePlayers`, `backup`, `restartMatch`, `rankPlayers`, `rejouer`, `lancerPartie.ts`
  (KILLER à 2 joueurs), `dexieRepositories`, `confidentialite`, `matchName` (`OUVERTURES`), les aides par mode
  (`matchStatus`, `brouillonVolee`, `annulationVolee`, `nomDePartie`, `contenuAppareil`), passage à
  `MODES_AVEC_ECRAN` dans `annulationDoubleTap`, `nomDePartieEcrans`, `nouvellePartie`, `reglesDuJeu`,
  `voleePartielle`, `accueilPartiesRecentes` (si un écran s'ouvre), `hexagonalBoundary` si liste en dur. Aucune
  doc en passe 1.
  **Point d'accord entre les passes** : lint, typecheck, `npm test` verts ; `git status` relu ; `rg
  "KILLER-PASSE-2" src tests` recopié dans `02-dev-notes.md` § Passe 1 ; l'Orchestrator montre le résultat à
  l'utilisateur et attend son feu vert ; pas de commit. Si la passe 1 approche le plafond, elle s'arrête sur un
  palier **vert** et le rapporte (environ 36 fichiers `src`, 25 de tests).
- **Passe 2 — hook, écran, résumé, parcours, Rejouer, voix, UI du genre, docs.** *À créer* : `useKiller.ts`,
  `games/killer/{KillerEcran,ResumeKillerEcran}.tsx`, `composants/killer/FeuilleKiller.tsx`,
  `nouvelle-partie/NumerosKiller.tsx`, `commun/ChoixGenre.tsx`. *À modifier* : `PartieEcran`, `labels.ts`
  (accord, `annonceKiller`, boîte, effets, « Vise D », « N en vie », étape 2, genre, résumé, tuile, marqueur
  `sousTitreOrdre` remplacé), `useNouvellePartie`, `reglagesPossibles`, `rejouer.ts`, `EtapeJeu`, `EtapeJoueurs`,
  `ReglagesJeu`, `ChoixJoueursExistants`, `NouvellePartieEcran`, `DialogueNouveauJoueur`, `ChoixSegmente`
  (`legendeMasquee`), `JoueursEcran`, `HistoriqueEcran` (selon la question 8). *Tests* : créer `killerEcran`,
  `killerParcours`, `genreProfil`, `accordKiller` ; **supprimer** `modesAvecEcran.ts` (appelants revenus à
  `GAME_MODE_IDS`) ; modifier `lazyRoutes`, `rejouer.test.tsx`, `genreBoundary` (plancher relevé). *Docs* :
  `CLAUDE.md`, `glossary`, `persistence`, `frontend-react`, `theme-colors`, `CONVENTIONS` § 9, 10, 13, 14,
  `CHARTE_GRAPHIQUE`, `PROJECT_PLAN`, `README.md`, `DEPLOIEMENT.md` § Dexie (si besoin). **Fin de passe 2** : les
  trois commandes vertes, `rg "KILLER-PASSE-2"` vide, l'aide temporaire supprimée.

**Plan de tests (delta).** Domaine : `PlayerGender.of` accepte `MASCULINE`, `FEMININE`, refuse `''`, `'feminine'`,
`'UNSPECIFIED'`, `'NON_PRECISE'` ; `Player.create` sans genre n'a pas de clé ; Killer : `by` et auto-élimination,
ordre, annulation de la fléchette éliminante, propriété de préfixe avec `eliminations`. Application : création,
modification (`FEMININE`, puis `null` retire la clé, `{ name }` seul garde le genre, `createdAt` fixe), export
(clé seulement si posée), aller-retour, vieille sauvegarde, genre invalide (`playersSkipped: 1`, les autres
profils importés), relance Killer (nouveaux numéros). Dexie (`fake-indexeddb`) : ligne brute sans `gender` relue
sans clé, écriture `FEMININE`, retour à « non précisé » retire la clé. UI : boîte (ligne repliée, créer sans y
toucher, ouvrir, choisir, réinitialisation à la réouverture), carte (repos sans les trois mots, édition
présélectionnée, rechargement), Killer (pastille, case, résumé, auto-élimination, voix à un seul `say`, Ordre
grisé à 0 et 1 joueur, grille qui se referme, sélection coupée), `accordKiller.test.ts`, `confidentialite`,
`genreBoundary`. Angles morts : hauteur réelle des boutons, « Non précisé » sur deux lignes à 360 px, contraste
du rouge sur `--repere`.

**Docs et décisions de `CLAUDE.md`.** Puce « profils LOCAUX » : « pseudo + couleur (+ un **genre** facultatif, lot
`killer`) » avec un ⚠️ : `MASCULINE` / `FEMININE` jamais renommés, clé absente = non précisé (forme masculine,
tout profil ancien), choisi à la création (ligne repliée) et à la modification, ne sert **qu'à** accorder « éliminé /
éliminée » au Killer, jamais lu ailleurs (garde `genreBoundary`), jamais montré au repos, pas de `db.version`,
`BACKUP_VERSION` inchangé, politique mise à jour le 20 octobre 2026 ; dans les règles du Killer, la règle 14.
`glossary` (joueur / profil, genre), `persistence` (champ non indexé sans `db.version`, preuve v2). L'index se
régénère après la fusion.

**Baseline sécurité (delta).** Import : `texte` puis `PlayerGender.of` (liste fermée), valeur invalide ignorée et
comptée sans planter, `null` refusé, rendu en texte React. Zéro réseau, aucune dépendance, service worker et
en-têtes intacts. Résiduels : un genre corrompu dans IndexedDB fait échouer la lecture des profils comme une
couleur corrompue (accepté, `sec`) ; la voix synthétisée en ligne reçoit le mot accordé, donc révèle
implicitement le genre (atténué par la phrase existante et par l'option qui coupe la voix ; `sec`,
utilisateur, question 7) ; une ancienne version de l'app qui importe un fichier récent perd le genre en silence
(accepté, Revue) ; constat #11 inchangé ; contraste du rouge sur `--repere` (Dev, Revue).

**Conformité à la planche `genre-profil`** : boîte, étiquette, ligne repliée « NON PRÉCISÉ · Modifier ▾ » (48 px),
trois boutons ≥ 48 px laiton plein, aide, carte en édition (genre sous la palette, avant Enregistrer / ✕ / ⌫),
carte au repos inchangée, tableau d'accord : tous implémentés (`DialogueNouveauJoueur`/`LigneGenre`,
`ChoixGenre`, `CarteProfil`, § accord). **Aucun écart posé par le plan.** Divergences planche / code ou cas non
dessinés : questions 1 et 5.

#### Questions pour l'utilisateur (Révision 1, aucune tranchée par l'architecte)

| # | Question | Bloque |
|---|---|---|
| R1.1 | **Création depuis l'onglet Joueurs** : la planche dit que la boîte « Nouveau joueur » y existe ; le code n'y a qu'un champ en ligne avec « Ajouter » (`JoueursEcran.tsx:217-236`). (a) pas de genre à cette création, il se choisit ensuite par la carte ; (b) une ligne Genre dans ce champ ; (c) remplacer le champ par la boîte | Passe 2, `JoueursEcran` |
| R1.2 | **Portée de l'accord** : accorder aussi (a) la boîte de sortie (« Julien est éliminé. » ; variante « … et est éliminé. ») ? (b) les textes des lecteurs d'écran d'une ligne éliminée ? (c) « Dernier en vie » / « est le dernier en vie » pour une gagnante (la règle 13 dit « uniquement éliminé / éliminée » : non, à confirmer) | Passe 2, `labels.ts` |
| R1.3 | **Profil supprimé** : l'éliminé supprimé s'affiche « Joueur supprimé » : quelle forme d'« éliminé » ? Un lanceur supprimé donne-t-il « Éliminé par Joueur supprimé » ? | Passe 2 |
| R1.4 | **Sélection coupée** : coupe dérivée (les 5e et 6e reviennent en revenant au Killer sans rien modifier) ou coupe écrite au changement de jeu (perdus) ? | Passe 2, `useNouvellePartie` |
| R1.5 | **Rendu du choix** : (a) la planche dessine des cases jointives (texte `craie-vive`, aide `craie-2`) alors qu'elle dit « le même motif que le choix des vies » (`ChoixSegmente` : rail `feutre/70`, curseur laiton qui glisse, texte `craie-2`, aide `craie-3`) : composant réel ou dessin exact ? (b) état ouvert de la ligne repliée, non dessiné : suivre le dépliant de l'étape 2 (en-tête gardé qui montre la valeur choisie, ligne qui reste ouverte après un choix) ? | Passe 2 |
| R1.6 | **Import d'un genre invalide** (critère 21 « refusé ») : le profil est ignoré (précédent de la couleur) ou seule la valeur tombe et le profil est importé « non précisé » ? | Passe 1, `backupSchema` |
| R1.7 | **Politique** : valider les phrases proposées (l.435 et 445) ; dire, l.454, que la voix accorde selon le genre choisi ? | Passe 1, `labels.ts` |
| R1.8 | **Ordre du filtre de Parties** : aujourd'hui Tous, X01, Tour du monde, Cricket, Solo ; la réponse 6-7 dit « X01, Cricket, Tour du monde, Killer, Entraînement » (inverse Cricket et Tour du monde) : réordonner ou seulement insérer Killer avant Solo ? | Passes 1 et 2 |
| R1.9 | **Voix après une volée ordinaire** : garder « À toi, X » après une volée Killer non finale (comme les quatre autres modes), ou le retirer ? | Passe 2, `useKiller` |
| R1.10 | **Sous-titre de l'étape Ordre** (`sousTitreOrdre`, non dessiné) : « Killer » seul ou « Killer · 3 vies » ? | Passe 1 provisoire, passe 2 final |

#### Réponses de l'utilisateur à la Révision 1 (2026-10-21)

| # | Réponse |
|---|---|
| R1.1 | **Pas de genre à la création depuis l'onglet Joueurs** (le champ en ligne reste un champ) ; le genre s'y choisit ensuite par la carte du profil. La création depuis l'étape 2 a la ligne Genre repliée |
| R1.2 | **« Éliminé(e) » accordé partout où le mot apparaît** : les quatre endroits de la règle 13, **plus la boîte de sortie et les textes des lecteurs d'écran** ; « dernier en vie » n'est **pas** accordé |
| R1.3 | Profil supprimé : « Éliminé » (forme masculine) et « Éliminé par Joueur supprimé » |
| R1.4 | Sélection de joueurs : **coupe écrite** au changement de jeu (les 5e et 6e sont perdus) — réponse **différente** de la recommandation de l'architecte (coupe dérivée) ; `retirer` et les écrans la lisent donc telle qu'écrite |
| R1.5 | Rendu du choix : **dessin exact de la planche (cases jointives)**, pas `ChoixSegmente` : un composant de plus (`ChoixGenre` dessiné à part, `ChoixSegmente` inchangé, plus de prop `legendeMasquee`). Le comportement **ouvert** de la ligne repliée n'a pas été dessiné ni tranché explicitement : par défaut le dev suit le dépliant de l'étape 2 (en-tête gardé qui montre la valeur, ligne ouverte après un choix) — **à valider à la relecture à l'écran** |
| R1.6 | Import d'un genre invalide : **profil ignoré et compté** (`playersSkipped`), sans planter |
| R1.7 | Politique : phrases des lignes 435 et 445 **validées** ; **mention ajoutée à la ligne 454** (la voix en ligne reçoit le mot accordé). La date est celle du jour de la livraison du lot (le plan disait « 20 octobre 2026 », il est désormais le 21 : le dev écrit la date du jour de sa passe et le test la suit) |
| R1.8 | Filtre de Parties : **seulement insérer Killer avant Solo** (ordre existant gardé : X01, Tour du monde, Cricket, Killer, Solo) ; l'étape 1 suit son propre ordre |
| R1.9 | Voix : **« À toi, X » gardé** après une volée Killer non finale ; pas de « À toi » à la victoire |
| R1.10 | Sous-titre de l'étape Ordre : **« Killer » seul** |

Aucune question produit ouverte. Les points à valider à la relecture à l'écran sur téléphone : le comportement
ouvert de la ligne Genre, l'écart planche / code des tuiles, « Non précisé » sur deux lignes à 360 px, le
contraste du rouge sur `--repere`.
