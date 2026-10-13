# Lot `accueil-parties-recentes` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu, `archi-scout` (sonnet /
> low, 1er essai). Le rapport source commence par `Architecture result: PASS`. Points vérifiés
> par l'Orchestrator dans le code : `X01State.milestones` et `LegWon` (`x01/rules.ts:32,119`),
> `PROFONDEUR = 20` (`GetOngoingMatchUseCase.ts:9`), `ApercuPartie` utilisé par l'Accueil et
> l'Historique seulement.

**Aucune surface gravée.** `MatchSummary` est un type de port driving, pas un format persisté ;
`summarize` vit en `application` ; `Services.clock` est seulement lu. Ni événement, ni schéma
Dexie, ni `backupSchema`, ni service worker, ni `firebase.json`. Pas de réseau, pas de donnée
stockée neuve : la politique `/confidentialite` ne change pas.

## Problème

Refaire l'Accueil en cartes de parties récentes, groupées par jour. La règle « Abandonnée »
doit être unique et partagée avec l'Historique, même filtré par mode. Il faut aussi un champ
dérivé « manches jouées » et un bouton « Nouvelle partie » fixé, sans lire toute la base.

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| **Manches jouées = nombre de `LegWon` dans `milestones` (retenue)** | Juste en cours comme terminée, avec ou sans sets | — |
| Manches jouées depuis `legNumber` | Déjà là | Compté à partir de 0 et pas incrémenté à la manche finale : `legNumber` en cours, `+ 1` une fois terminée, d'où un cas particulier |
| **« Abandonnée » = fonction pure partagée `statutDePartie(partie, enCoursId)` (retenue)** | Une source ; même `enCoursId` global aux deux écrans | L'Historique ajoute la requête `['matchEnCours']` |
| Champ « abandonnée » calculé dans `GetMatchHistory` | Prêt à afficher | **Faux sous filtre de mode** : il donnerait la plus récente non terminée *de ce mode* |
| Calcul côté UI, par écran | — | Deux calculs qui divergeraient (risque cité par l'intake) |
| **`getMatchHistory.execute(30)` + filtre de date en mémoire (retenue)** | Port existant, `listRecent` sans tout désérialiser ; plafond de 30 cartes | Au-delà de 30 parties en 7 jours, les plus anciennes de la fenêtre sortent de l'Accueil |
| Nouveau port `GetRecentMatches(depuis)` | Filtre exact | Sur-architecture pour un filtre pur ; aucun index par date dans Dexie |

## Approche retenue

1. **`legsPlayed: number`** sur `X01Summary`. Dans `summarize.ts` (branche X01), c'est le compte
   des `milestones` de type `'LegWon'`. Aucun changement de domaine.
2. **`statutDePartie(partie, enCoursId): 'TERMINEE' | 'EN_COURS' | 'ABANDONNEE'`**, fonction
   pure exportée de `src/core/application/use-cases/summarize.ts`, avec son type.
   - « Abandonnée » = non terminée et `id !== enCoursId`, où `enCoursId` vient de
     `getOngoingMatch` (global, jamais filtré par mode).
   - L'Accueil et l'Historique l'appellent tous deux avec le même `enCoursId`.
   - ⚠️ **Limite à documenter** : `GetOngoingMatchUseCase` ne regarde que les 20 parties les plus
     récentes. Si aucune non terminée ne s'y trouve, `enCoursId = null` : toute non terminée est
     alors « Abandonnée », et aucune n'est épinglée en tête de l'Accueil. C'est cohérent avec le
     commentaire existant (« au-delà, abandonné »).
3. **Récupération.**
   - L'Accueil appelle `getMatchHistory.execute(30)`, puis filtre en mémoire sur la fenêtre de
     7 jours. Le plafond est de 30 cartes ; au-delà, l'onglet Parties prend le relais.
   - La partie en cours vient de `getOngoingMatch`. Si elle sort de la fenêtre, elle est ajoutée
     **en tête**, sans doublon d'`id`.
4. **Jour calendaire : fonction pure côté UI**, par exemple `groupeDeJour(createdAt, maintenant):
   'AUJOURDHUI' | 'CETTE_SEMAINE' | null`, avec `maintenant = services.clock.now()`.
   - Minuit local se construit par composantes (`new Date(a, m, j)`, `new Date(a, m, j - 6)`),
     **jamais** par soustraction de `86 400 000 × N`, à cause des jours de 23 h et 25 h.
   - Le fuseau est une affaire d'affichage, comme pour `nomParDefaut`.
   - Un `createdAt` dans le futur (import, constat #11 de l'index) : comportement à choisir **et
     tester** par le Dev ; il ne doit jamais casser le groupement.
5. **Carte commune `src/ui/composants/commun/CartePartie.tsx`.**
   - Elle remplace `ApercuPartie` et devient le seul endroit qui ouvre l'union `MatchSummary`.
   - La `CartePartie` locale de l'Historique disparaît.
   - Un `switch` exhaustif (`never`) donne le statut, les règles courtes (reprise de
     `libelleRegles`) et les avatars. Le nom vient de `nomDePartie`. Tokens seuls ; liseré et ✓
     via `ACCENTS_MODE`.
   - Props : `partie`, `statut`, `profils`, `reprise?` (bouton laiton « Reprendre », carte en
     cours seulement), `actions?` (suppression à l'Historique).
   - **Toute la carte est une seule cible** (≥ 48 px). Terminée → `/partie/:id/resume`, sinon
     `/partie/:id`. Sur la carte en cours, « Reprendre » est le visuel de la même action, pas un
     second élément focalisable.
   - Statut : vainqueur par `winnerId`. Match nul : `finished && winnerId === null && mode ===
     'TOUR_DU_MONDE'`. Entraînement : `roundsWon / roundsPlayed`, ou « En cours ».
   - Tous les libellés dans `labels.ts` : « N manches jouées », « Abandonnée », « X gagne »,
     « Match nul », « N / M sorties », « En cours », « Aujourd'hui », « Cette semaine »,
     « Pas de partie cette semaine », « Reprendre », et les heures « 21 h 04 » / « mardi
     21 h 10 ».
6. **Bouton fixé.**
   - `NavigationBasse` est déjà `sticky bottom-0` et porte `env(safe-area-inset-bottom)` : ne
     pas la redoubler.
   - Deux voies au choix du Dev : `sticky` avec un décalage égal à la hauteur de la barre, ou un
     `main` à hauteur bornée, avec la liste en `flex-1 overflow-y-auto` et le bouton en
     `shrink-0`.
   - En paysage, le bouton garde ses 48 px et la liste a un padding bas pour ne pas masquer la
     dernière carte. **À valider à l'écran** : angle mort des tests.
7. **Requêtes TanStack Query.**
   - `['matchEnCours']` est conservée (Accueil, et Historique pour le statut).
   - L'Accueil prend la clé `[...CLE_HISTORIQUE, 'accueil']` : elle est invalidée gratuitement
     par le préfixe `['historique']` qu'invalide déjà `ActionsFinDePartie`.
   - À ajouter :
     - à la suppression (`HistoriqueEcran.supprimer`, qui ne fait que `refetch()`), invalider
       `['historique']` et `['matchEnCours']` ;
     - au lancement d'une partie (`useNouvellePartie`), invalider aussi `['historique']`.
   - L'import est déjà couvert (`invalidateQueries()` global dans `ReglagesEcran`).
8. **État vide** (rien dans la fenêtre, et pas de partie en cours) : la ligne « Pas de partie
   cette semaine », plus le lien « Créer un joueur » (`/joueurs`) seulement si `useProfils()` est
   vide. `SignalAccueil` et « Ce soir à l'oche » partent. `InvitationInstallation` ne change pas.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | Aucun |
| `core/application/` | `ports/driving/MatchSummary.ts`, `use-cases/summarize.ts` | `legsPlayed` ; `statutDePartie` et son type |
| `infrastructure/` | — | Aucun |
| `ui/` | `composants/commun/CartePartie.tsx` (nouveau), `ApercuPartie.tsx` (retiré ou remplacé), `ecrans/AccueilEcran.tsx`, `ecrans/HistoriqueEcran.tsx`, `labels.ts`, `hooks/useNouvellePartie.ts` (invalidation), module du jour calendaire | Carte commune, Accueil, statut à l'Historique, libellés, groupement |
| `composition/` | — | Aucun |
| `tests/` | `summarize` / use cases, groupement par jour, Accueil, Historique | Voir ci-dessous |
| doc | `docs/CHARTE_GRAPHIQUE.md` | Carte de partie, bouton fixé |

**Sens des dépendances vérifié :** `ui` → `application` → `domain`.
**Nouveau port ?** Non. `GetMatchHistory` et `GetOngoingMatch` suffisent.

**Tests attendus**
- `legsPlayed` : 0 au départ, N en cours, N une fois terminée, avec plusieurs sets.
- `statutDePartie` : en cours, abandonnée et terminée, pour les quatre modes, avec
  `it.each(GAME_MODE_IDS)`.
- Groupement : 23 h 50 puis 0 h 10, J-6, J-7, changement d'heure avec sa précondition, et une
  date future.
- Accueil :
  - les deux groupes ;
  - la partie en cours de plus de 7 jours, en tête ;
  - l'état vide, avec et sans profil ;
  - le tap qui mène au résumé ou reprend la partie ;
  - la mise à jour après une fin de partie, une suppression et un lancement.
- Historique filtré par mode : le statut est le même qu'à l'Accueil.

## Décisions de `CLAUDE.md` concernées

- Hexagonal : le calcul reste en `application`, et l'UI n'utilise que des use cases.
  `Services.clock` est lu par l'UI selon l'exception documentée (garde `horlogeBoundary`).
- Nom de partie : le défaut est recalculé (`nomDePartie`), jamais écrit.
- Query n'orchestre pas le match en cours : elle ne sert que les résumés.
- `AccueilEcran` reste statique (exception de `lazyRoutes`). Charte : angle vif, tokens seuls,
  cibles d'au moins 48 px, aucun texte sous `craie/60`, icônes `aria-hidden`, « manche » à
  l'écran.
- **À graver en fin de lot** (Revue à confirmer) :
  - `CLAUDE.md` § DS pour l'Accueil en parties récentes et la règle « Abandonnée » ;
  - la charte (carte de partie, bouton fixé) ;
  - `CONVENTIONS` § 13 et 14 (`CartePartie` remplace `ApercuPartie`) ;
  - le glossaire (« abandonnée ») ;
  - `PROJECT_PLAN`.

## Baseline sécurité

- Aucune nouvelle entrée. L'import JSON reste la seule entrée non fiable, et il ne change pas.
- Noms de partie et pseudos : nœuds texte React, jamais `dangerouslySetInnerHTML` ;
  `truncate` / `break-words` pour les noms longs.
- Aucun réseau, aucune permission, aucun stockage neuf.
- Résiduel : un `createdAt` importé absurde (constat #11 de l'index) ne doit pas casser le
  groupement. Le Dev choisit le comportement et le teste.
- Ne remplace pas `sec`.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Plafond de 30 cartes à l'Accueil (au-delà, onglet Parties) | Utilisateur (owner fixé par l'intake : Architecture, qui propose 30) |
| 2 | L'Historique garde-t-il le détail des scores par joueur (ancien `ApercuPartie`), ou passe-t-il à la carte commune et à son statut ? | Utilisateur |
| 3 | Forme de « Abandonnée » (texte ou icône) | Utilisateur, à la relecture à l'écran (fixé par l'intake) |
| 4 | Un Accueil laissé ouvert à travers minuit ne rebascule pas seul ses groupes : acceptable ? | Utilisateur |
| 5 | Bouton fixé : `sticky` avec décalage, ou hauteur bornée ? | Dev, puis relecture sur appareil réel |
| 6 | Partie en cours introuvable au-delà des 20 plus récentes (`PROFONDEUR`) : toute non terminée devient « Abandonnée », et rien n'est épinglé. Cela précise la décision de l'intake « la partie en cours reste première carte même au-delà de 7 jours » | Utilisateur |

### Résolutions du gate Architecture (2026-10-13)

| # | Résolution | Par |
|---|---|---|
| 1 | **30 au plus**, puis l'onglet Parties | Utilisateur |
| 2 | **L'Historique passe à la carte commune avec son statut**, plus le bouton de suppression ; le détail par joueur reste dans le résumé de la partie. `ApercuPartie` peut être retiré | Utilisateur |
| 3 | Relecture à l'écran (intake) | Utilisateur, plus tard |
| 4 | **Acceptable** : pas de minuteur, recalcul à la navigation suivante. À noter dans les notes de dev | Utilisateur |
| 5 | Au choix du Dev, justifié dans `02-dev-notes.md` ; validé à la relecture sur appareil réel | Orchestrator (délégation prévue par l'architecture) |
| 6 | **On garde les 20** (`PROFONDEUR`, comportement actuel) : la décision de l'intake s'entend « dans la limite de `GetOngoingMatch` » | Utilisateur |

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
