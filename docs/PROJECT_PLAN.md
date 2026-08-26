# Dartpéro — Plan détaillé

Plan de construction, lot par lot. Le résumé opérationnel et les décisions gravées vivent
dans [../CLAUDE.md](../CLAUDE.md) — **ce document ne le contredit jamais**.

Principe de travail : **un lot à la fois**, chacun se termine par un livrable vérifiable
(tests verts ou écran utilisable). On ne démarre pas le lot N+1 tant que le lot N n'est pas
validé.

---

## 0. Où l'on en est

**Lots 0 à 5c livrés**, app déployée sur https://dartpero.web.app. **248 tests verts**, `lint`
et `typecheck` verts.

Ce qu'il reste, par ordre de ce qui coûterait le plus cher à découvrir tard :

1. **La validation sur vrai matériel** — le seul critère que les tests ne couvrent pas :
   lisibilité des scores à 3 mètres dans un garage, confort des cibles au pouce debout, tenue
   du wake lock sur une partie entière, **la bascule paysage sur un vrai téléphone couché**, et
   un passage sur un **vrai iPhone** (installation par Safari « Ajouter à l'écran d'accueil »,
   safe-area, disponibilité d'une voix française).
2. **Le lot 5b, à finir ou à réduire** : un seul exercice solo au lieu de deux, et aucun suivi
   de progression (voir le lot 5b).
3. **Deux écrans du plan jamais faits** — `/historique/:id` et `/joueurs/:id` — à implémenter
   ou à retirer de ce document (voir § 3).
4. **Les décisions ouvertes** listées dans `CLAUDE.md` : les jeux fun restants (Killer,
   Shanghai, Around the Clock), sync cloud (lot 6), i18n. Aucune n'est bloquante — le mode
   paysage et le Cricket sont tranchés et livrés au lot 5c.

---

## 1. Modèle de domaine

Tout ce qui suit est **pur** : aucun import de React, Dexie, ni API navigateur. Pas de
`Date.now()` ni de `Math.random()` (→ ports `Clock` / `IdGenerator`).

### 1.1 Value objects

| Type | Contenu | Invariants (factory validante) |
| --- | --- | --- |
| `Segment` | `1..20 \| 'BULL'` | Rien d'autre n'existe sur une cible. |
| `Multiplier` | `SIMPLE \| DOUBLE \| TRIPLE` | — |
| `Dart` | `{ segment, multiplier }` → `points` | **Triple sur BULL interdit.** `SIMPLE BULL` = 25, `DOUBLE BULL` = 50. `isDouble` vrai pour tout double **y compris** le bull 50. |
| `Score` | entier ≥ 0 | Rejette les négatifs. |
| `MatchId` / `PlayerId` / `LegId` | branded types | Générés par `IdGenerator`. |

Cas particulier : la **fléchette hors cible** (« manqué ») est un `Dart` à 0 point —
modélisée explicitement, car elle compte dans la moyenne et dans les tentatives de double.

### 1.2 Entités

- **`Visit`** — 1 à 3 `Dart`, l'identité du lanceur, un statut (`SCORED` | `BUSTED` |
  `CHECKOUT`). Une visite s'arrête avant 3 fléchettes si checkout ou bust.
- **`Leg`** — la suite des visites, le score de départ, l'ordre des joueurs, le vainqueur.
- **`Set`** — un groupe de legs (optionnel selon la config).
- **`Match`** — la configuration + la liste d'événements + les joueurs.
- **`Player`** — profil **local** : pseudo, couleur, date de création.

### 1.3 Événements (le cœur du choix d'architecture)

Le match **est** une liste d'événements ; l'état affiché en est la **projection**.

**Le journal ne contient que des faits bruts** — décision prise au lot 1, étendue aux autres
modes au lot 5 :

```
X01Started                { config, playerIds[], startingPlayerIndex }
TourDuMondeStarted        { config, playerIds[], startingPlayerIndex }
CricketStarted            { config, playerIds[], startingPlayerIndex }
CheckoutPracticeStarted   { config, playerIds[], startingPlayerIndex }
RoundStarted              { target }          ← entraînement : le tirage est STOCKÉ
VisitRecorded             { darts[] }         ← partagé par tous les modes
```

⚠️ **Le mode se lit sur le premier événement du journal**, via un événement d'ouverture qui lui
est propre — jamais via un champ `mode`. C'est ce qui rend les parties d'avant le lot 5a
rejouables pour toujours en X01, sans migration.
⚠️ Le type s'appelle `X01Started` mais son discriminant vaut toujours **`'MatchStarted'`** :
cette chaîne est une donnée persistée, présente dans IndexedDB et dans les sauvegardes JSON
déjà exportées. On corrige le nom du type, jamais la valeur sur le disque.

Tout le reste est **déduit** et exposé en `X01Milestone`, jamais persisté :

```
LegWon         { playerId, legNumber, dartsUsed }
SetWon         { playerId, setNumber }
MatchFinished  { winnerId }
```

Deux conséquences volontaires :
- annuler, c'est `project(events.slice(0, -1))` — rien d'autre. Si le journal contenait
  aussi les conséquences, il faudrait retirer « la dernière volée **et** ce qu'elle a
  déclenché », soit précisément la classe de bug qu'on cherche à éliminer ;
- `VisitRecorded` **ne porte pas de `playerId`** : à qui est le tour se déduit de la
  projection, donc le journal ne peut pas contredire les règles.

Bénéfices directs :
- **Undo** = retirer le dernier `VisitRecorded` et rejouer la projection. Aucun état à
  « défaire » à la main, donc aucun bug de restauration de score.
- **Reprise** d'une partie interrompue : on persiste les événements, on rejoue.
- **Rejouabilité** pour les tests : un scénario = un tableau d'événements.

### 1.4 Services purs

**Transverses** (`domain/services/`) — ils n'appartiennent à aucun mode :

| Service | Rôle |
| --- | --- |
| `resolveVisit(...)` | Juge une volée : décompte, détecte **bust** (reste < 0, reste == 1, reste == 0 sans double) et **checkout**. Ne dépend que de `{ doubleIn, doubleOut }`. |
| `suggestCheckout(reste, dartsRestantes)` | Chemin conseillé. Retourne **« pas de finish »** sur les bogey numbers **169, 168, 166, 165, 163, 162, 159** et au-dessus de 170. |
| `dartSearch` | L'espace de recherche (`SETUP_DARTS`) dont vivent les checkouts et les restes jouables de l'entraînement — aucune liste codée en dur. Sa recherche exacte (`findExactScore`) est partie avec le mode rapide. |

⚠️ `resolveVisit` et `suggestCheckout` étaient au X01 jusqu'au lot 5b ; ils en sont sortis
parce qu'un mode n'a pas le droit d'en importer un autre. L'entraînement juge donc une manche
avec **exactement la même fonction** que le X01 — une divergence sur la règle de bust serait
le pire bug possible.

**Par mode** (`domain/games/<mode>/`) :

| Service | Rôle |
| --- | --- |
| `x01Rules.applyVisit` / `.project` | Applique une volée, rejoue les événements → état courant (scores restants, joueur actif, legs/sets gagnés). |
| `computeX01Stats(events)` | Moyenne 3 fléchettes, first 9, % doubles, 180/140+/100+/60+, meilleur leg, plus haut checkout. |
| `x01/career.ts` | Cumul de carrière depuis les **totaux bruts** (jamais une moyenne de moyennes). |
| `tourDuMondeRules` · `cricketRules` · `checkoutPracticeRules` | Idem pour les trois autres modes. |
| `games/index.ts` | La couture `GameMode` — **écrite au lot 5a**, quand un 2ᵉ mode réel est arrivé : `GameModeId`, `AnyMatchState`, et l'aiguillage sur le discriminant `mode`. Seul ce fichier connaît tous les modes. |

⚠️ Rappel de spécification : dans la moyenne, une volée *busted* marque **0 point** mais ses
fléchettes **sont comptées**.

---

## 2. Ports

### Driving (ce que l'UI peut demander)

**Partie X01** : `StartMatch` · `RecordVisit` · `UndoLastVisit` · `GetMatchState` ·
`GetMatchStats` · `PreviewVisit`
**Autres modes** : `PlayTourDuMonde` · `PlayCricket` + `PreviewCricketVisit` ·
`PlayCheckoutPractice`
**Transverses** : `GetMatchMode` · `GetMatchHistory` · `GetOngoingMatch` · `DeleteMatch` ·
`GetCheckoutSuggestion` · `GetPlayerStats` · `ManagePlayers` · `ManageBackup`

- `PreviewVisit` est né au lot 3 pour que l'UI ne réimplémente jamais les règles : il évalue
  la volée en cours de saisie, qui n'est pas persistée. ⚠️ Il avait un jumeau,
  `BuildVisitFromScore`, qui traduisait un total de volée en fléchettes pour le mode rapide —
  **tous deux retirés avec ce mode**.
  `PreviewCricketVisit` (lot 5c) est le même service rendu au Cricket : sans lui, l'écran ne
  saurait pas qu'une partie est gagnée avant la troisième fléchette.
- `ManageBackup` remplace les `ExportData` / `ImportData` du cadrage : il ne manipule que des
  objets JavaScript, donc il se teste sans navigateur. Le `Blob` et l'`<input type="file">`
  restent dans l'UI — lire un fichier n'est pas un port.
- ⚠️ Les ports X01 gardent des noms génériques (`StartMatch`, `RecordVisit`…) face à
  `PlayTourDuMonde`. Leurs **types de retour** disent `X01State`, ce qui lève l'ambiguïté ;
  les renommer reste à faire **si** l'asymétrie regêne.

### Driven (ce dont le cœur a besoin)

Un port n'est créé **qu'avec son premier consommateur** — pas avant. Écrire un port sans
use case ni écran qui l'appelle, c'est du code non testé qui vieillit en attendant.

| Port | Adapter | Doublure de test | Créé au |
| --- | --- | --- | --- |
| `MatchRepository` | Dexie | in-memory | **lot 2** ✅ |
| `PlayerRepository` | Dexie | in-memory | **lot 2** ✅ |
| `Clock` | horloge système | horloge qui avance d'un pas | **lot 2** ✅ |
| `IdGenerator` | `crypto.randomUUID` | séquentiel (`id-1`, `id-2`…) | **lot 2** ✅ |
| `ScreenLock` | Wake Lock API | null-object (API absente ailleurs) | **lot 3** ✅ |
| `Haptics` | Vibration API | null-object | **lot 3** ✅ |
| `Preferences` | localStorage | in-memory | **lot 3** ✅ |
| `RandomSource` | `crypto.getRandomValues` | tirage prévisible | **lot 5b** ✅ |
| `Announcer` | Web Speech API | null-object | **lot 5b** ✅ |

---

## 3. Écrans & routes

| Route | Écran | Lot |
| --- | --- | --- |
| `/` | Accueil — *Reprendre la partie* (si une partie est en cours), *Nouvelle partie*, accès rapide | 3 ✅ |
| `/nouvelle-partie` | Configuration : mode de jeu, joueurs, legs à gagner, double in/out | 3 ✅ |
| `/partie/:id` | **Écran de partie** — le cœur de l'app | 3 ✅ |
| `/partie/:id/resume` | Résumé de fin : vainqueur, stats du match, rejouer | 3 ✅ |
| `/entrainement` | Lancement d'une session d'entraînement solo | 5b ✅ |
| `/historique` | Liste des parties jouées, tous modes, avec statut et suppression | 4 ✅ |
| `/joueurs` | Profils locaux (créer, renommer, couleur, supprimer) | 4 ✅ |
| `/statistiques` | Carrière : tableaux comparatifs classés | 4 ✅ |
| `/reglages` | Préférences (voix, haptique), export / import JSON, à propos | 4 ✅ |
| `/historique/:id` | Détail d'une partie | **jamais fait** |
| `/joueurs/:id` | Stats cumulées d'un joueur | **jamais fait** |

⚠️ **Une seule URL par partie**, quel que soit le mode : `PartieEcran` lit le mode sur le
journal et rend l'écran correspondant. Un lien d'historique reste donc valable pour toujours.

Les deux dernières lignes sont **une décision en suspens, pas un oubli** : l'écran
`/statistiques` (lot 4) donne déjà les tableaux comparatifs classés, et l'historique porte
déjà l'essentiel de chaque partie. À trancher : les écrans de détail apportent-ils assez pour
exister, ou disparaissent-ils de ce plan ?

Navigation basse : **Début · Joueurs · Stats · Parties · Réglages** — cinq entrées et non
quatre, l'écran de statistiques ayant gagné sa place au lot 4. Icônes lucide `aria-hidden`,
cibles ≥ 48 px, `env(safe-area-inset-bottom)`. Elle **n'apparaît pas** pendant une partie ni
sur l'écran de configuration.

---

## 4. Les lots

### Lot 0 — Scaffold

**Contenu** : Vite + React 19 + TS · Tailwind v4 (`@theme` avec les tokens de la charte) ·
Biome (avec l'`override` qui interdit les imports externes dans `src/core/**`) · Vitest v3 +
Testing Library + jsdom · `vite-plugin-pwa` (manifest « Dartpéro ») ·
`@vitejs/plugin-basic-ssl` + `server.host: true` pour le test sur téléphone ·
`@fontsource` (Alfa Slab One, Oswald, Barlow) · scripts npm.

**Fini quand** : `npm run dev`, `npm test`, `npm run lint` et `npm run typecheck` passent,
et une page « Dartpéro » s'affiche aux couleurs de la charte.

---

### Lot 1 — Domaine X01 (le vrai morceau)

**Contenu** : tous les value objects, entités, événements et services purs de la section 1.
**Zéro UI, zéro persistance.**

**Tests à écrire** (la liste fait office de spécification) :
- `Dart` : points corrects sur les 3 multiplicateurs ; triple bull **rejeté** ; bull 50 =
  double ; fléchette manquée = 0.
- Bust : reste `< 0` · reste `== 1` · reste `== 0` sans double → **le score revient exactement
  à sa valeur d'avant la visite**.
- Double out : un leg ne se gagne que sur un double (bull 50 inclus).
- Double in : tant qu'aucun double n'a été touché, rien ne décompte.
- Checkout : 170 = T20·T20·Bull · les **7 bogey numbers** renvoient « pas de finish » ·
  suggestion cohérente avec les fléchettes restantes (ex. 40 avec 1 fléchette → D20).
- Legs/sets : alternance du joueur qui commence à chaque leg · « premier à 2 legs » s'arrête
  au deuxième leg gagné, quel que soit le nombre de joueurs.
- Undo : rejouer `events.slice(0, -1)` restaure **exactement** l'état précédent.
- Stats : moyenne 3 fléchettes avec une volée *busted* dans le lot · first 9 · % doubles ·
  meilleur leg.

**Fini quand** : ~40 tests verts, `src/core/domain/` sans le moindre import externe.

✅ **Fait — 60 tests verts.** Le test le plus utile du lot balaie **tous les restes de 2 à
170** : il vérifie que chaque route proposée fait exactement le compte, tient en ≤ 3
fléchettes, finit sur un double, et que la liste des restes sans solution est **exactement**
les 7 bogey numbers. La suggestion reste une heuristique (route valide la plus courte,
double usuel), pas la table PDC — voir les décisions du domaine dans `CLAUDE.md`.

---

### Lot 2 — Application & persistance

**Contenu** : les ports (section 2), les use cases correspondants, les adapters **Dexie** et
**in-memory**, le composition root `src/composition/container.ts`, le `ServicesProvider`
React (injectable, pour les tests UI).

**Fini quand** : un test d'intégration joue **une partie complète de 501 en BO3** de bout en
bout via les use cases, avec le repository Dexie fake — sans une ligne d'UI.

✅ **Fait — 86 tests verts.** La partie complète est jouée à travers le vrai composition root,
seuls les adapters changent. S'y ajoutent : un test d'architecture qui lit les imports réels
de `src/` (le cœur ne peut rien importer d'autre que lui-même, l'UI ne touche pas un adapter,
un adapter ne remonte pas vers l'UI), et un test des adapters Dexie sur une vraie IndexedDB
via `fake-indexeddb`.

---

### Lot 3 — Écran match ⭐

Le lot qui rend l'app réellement utilisable.

**Contenu** :
- Accueil + configuration de partie.
- **Écran match** : zone lecture (chiffres géants, joueur actif en halo laiton, moyenne en
  direct) + zone saisie (grille S/D/T) — voir la maquette dans `CLAUDE.md`.
- ~~**Mode rapide** basculable (pavé 0-180 + raccourcis 26/41/45/60/100/140/180).~~ Livré au
  lot 3, puis **retiré** : plusieurs soirées sans jamais s'en servir.
- **Suggestion de checkout** dès reste ≤ 170, écran de sortie dédié sous 100.
- **Annulation** (bouton visible en permanence, pas caché dans un menu).
- **Wake Lock** + **vibration** à la validation.
- Écran de résumé de fin de partie.

**Fini quand** : une vraie partie à 2 joueurs se joue du début à la fin sur un téléphone
Android, écran allumé, hors ligne. **C'est le jalon « utilisable ».**

✅ **Construit — 100 tests verts**, dont un parcours de bout en bout dans l'UI : création d'un
joueur, configuration, leg de 501 gagné en 9 fléchettes, arrivée automatique sur le résumé.
Deux ports driving ont été ajoutés pour que l'UI ne réimplémente jamais les règles :
`PreviewVisit` (évalue la volée en cours de saisie) et `BuildVisitFromScore` (traduit un score
de volée en fléchettes pour le mode rapide — **retiré depuis, avec son mode**).
⚠️ **Reste à valider sur un vrai téléphone** — c'est le seul critère que les tests ne couvrent
pas : lisibilité à 3 m, confort des cibles au pouce, tenue du wake lock en conditions réelles.

---

### Lot 4 — Profils, historique, stats

**Contenu** : profils locaux (pseudo, couleur, avatar à initiales) · historique des parties ·
stats cumulées par joueur · **export / import JSON** de toute la base · réglages · finition
graphique complète (matières `.feutre-tapis`, `.cadre-bois`, `.laiton-poli`) · états vides et
skeletons.

**Fini quand** : on retrouve ses parties passées, ses moyennes progressent dans le temps, et
la base peut être sauvegardée puis restaurée sur un autre téléphone.

✅ **Fait — 135 tests verts.** La couleur d'un profil est une teinte **symbolique** (8 noms
fermés dans le domaine, traduits en pixels dans `ui/couleurs.ts` seulement), et sans choix on
prend la première libre. Migration Dexie **v1 → v2** pour les profils d'avant, testée en
ouvrant une vraie base v1 avant de la relire en v2. L'import JSON **fusionne** et ne remplace
jamais ; une entrée illisible est comptée puis ignorée plutôt que de faire échouer tout le
fichier. Les stats sont des **tableaux comparatifs classés**, chacun sur sa première colonne.

---

### Lot 5a — Tour du monde & la couture `GameMode`

**Contenu** : le deuxième mode de jeu réel, et avec lui l'aiguillage annoncé depuis le lot 1 —
événement d'ouverture propre au mode, états discriminés, règles et écrans aiguillés.

✅ **Fait — 167 tests verts.** Aucun dénominateur commun artificiel : chaque mode garde ses
règles et son état complets, `games/index.ts` ne fait qu'aiguiller sur le discriminant `mode`,
et TypeScript garantit qu'aucun cas n'est oublié. `MatchSummary` est une union discriminée,
ouverte au seul endroit de l'UI qui en a besoin (`ApercuPartie`).
Suivi d'un commit de **renommage** : ce qui décrit l'état et les règles d'un mode dit
maintenant son nom (`MatchState` → `X01State`, `useMatch` → `useX01`…), tandis que ce qui
désigne une partie tous modes confondus (`MatchId`, `MatchRepository`, `MatchEvent`) ne bouge
pas. Deux gardes ajoutées au test d'architecture : **un mode n'importe jamais un autre mode**,
ni dans le domaine ni dans les composants.

---

### Lot 5b — Entraînement solo & voix

**Contenu** : `GameMode` d'entraînement — short-list arbitrée à ce moment-là :
*Round the Doubles* (D1→D20 + bull), *Checkout Practice* (reste tiré au sort entre 41 et 170),
*Scoring Drill* (10 volées, maximiser), *Bob's 27*. Plus l'**annonce vocale** (Web Speech API,
port `Announcer`, désactivable).

**Fini quand** : au moins deux exercices sont jouables et leur progression est suivie dans le
temps.

🟡 **Livré à moitié — 201 tests verts.** **Checkout Practice** est jouable de bout en bout, et
le troisième mode a coûté exactement ce qui était annoncé : un dossier, un événement
d'ouverture, trois lignes dans chaque aiguillage. L'annonce vocale est là, en français,
coupable depuis les réglages (avec un bouton « Essayer la voix », parce que toutes les voix
françaises ne sont pas installées partout).
**Le critère n'est pas atteint** : il n'y a **qu'un** exercice, et aucun suivi de progression
— les statistiques de carrière restent volontairement au X01. À trancher : ajouter un second
exercice de la short-list **plus** un écran de progression, ou réduire officiellement
l'ambition du lot à un exercice unique.

⚠️ La cible tirée est **écrite dans le journal** (`RoundStarted`), jamais retirée au rejeu :
sans ça, annuler une volée redistribuerait les cartes et deviendrait un moyen de retomber sur
un reste plus facile. Une session solo est **une partie comme une autre** : même dépôt, même
historique, même sauvegarde.

---

### Lot 5c — Cricket & mode paysage

**Contenu** : le **Cricket**, quatrième mode et premier des « jeux fun » du cadrage — donc le
test grandeur nature de la couture. Plus le **mode paysage** pendant une partie, décision
ouverte n° 2 depuis le lot 3.

✅ **Fait — 248 tests verts** (37 pour le domaine et les use cases du Cricket, 9 pour son
écran). Le mode a coûté le prix annoncé : un dossier `games/cricket/`, un événement
d'ouverture, trois lignes dans chaque aiguillage. Le Cricket a en revanche demandé **deux**
ports plutôt qu'un (`PlayCricket` et `PreviewCricketVisit`) : c'est le premier mode où la
partie peut se gagner **sur la deuxième fléchette d'une volée**, et l'écran doit le savoir
sans attendre la troisième.

**Le paysage n'est pas un écran de plus, c'est une bascule de disposition** :
`DispositionPartie` porte désormais l'ossature des quatre écrans de partie (bandeau, zone
lecture, zone saisie) et passe en deux colonnes quand le téléphone est couché. La condition
porte sur la **hauteur** autant que sur l'orientation (`@custom-variant paysage`) : ce qui
manque au téléphone couché, c'est la hauteur, pas la largeur — une tablette garde donc la
disposition normale.

**Deux bugs antérieurs découverts en chemin**, tous deux invisibles jusqu'à ce qu'un mode
non-X01 passe par là :
- `backupSchema` ne validait que `MatchStarted` et `VisitRecorded` — une sauvegarde JSON
  perdait silencieusement les parties de Tour du monde et d'entraînement à la réimportation ;
- `GetOngoingMatchUseCase` projetait avec `X01Rules` au lieu de la couture — l'accueil ne
  proposait jamais de reprendre une partie qui n'était pas un X01.

**Reste à valider sur un vrai téléphone** : la bascule paysage en conditions réelles. (Le
pavé du mode rapide était le seul assez haut pour demander un défilement — il n'existe plus.)

---

### Lot 6 — *(optionnel, si un jour)* Sync & classement

Un adapter `MatchRepository` distant + une identité de joueur. **Zéro refonte** du cœur —
c'est précisément ce que l'architecture hexagonale achète ici.

---

## 5. Risques identifiés

| Risque | Parade |
| --- | --- |
| La saisie 3-taps ralentit la partie et agace | Parade prévue : mode rapide dès le lot 3 et raccourcis de score fréquents. ⚠️ **Le risque ne s'est pas matérialisé** : après plusieurs soirées, le mode rapide n'avait jamais servi — il a été retiré. La saisie 3-taps tient très bien. ⚠️ La bascule S/D/T devait être **persistante** ; le lot 3 bis a **renversé** cette décision — elle retombe sur Simple après chaque fléchette. Un multiplicateur resté armé sans qu'on le voie compte trois T20 là où il y avait trois simples, et il faut ensuite retrouver *où* le score a dérapé : un clic de plus par triple coûte moins cher qu'un score faux |
| Erreur de saisie en pleine partie | Undo illimité **et fiable** grâce à la projection d'événements — bouton toujours visible |
| Écran qui s'éteint pendant une partie | Wake Lock dès le lot 3, avec null-object si l'API manque |
| Perte du téléphone = perte de tout l'historique | Export / import JSON au lot 4 |
| Sur-ingénierie des modes de jeu | Couture `GameMode` **légère**, écrite au lot 5a seulement, quand un 2ᵉ mode réel est arrivé. Les 3ᵉ et 4ᵉ modes (lots 5b et 5c) ont confirmé le prix annoncé : un dossier, un événement d'ouverture, trois lignes d'aiguillage |
| Un mode ajouté après coup oublié par le code transverse | Ce qui aiguille sur le mode doit **tout** aiguiller. Le lot 5c a trouvé deux endroits qui parlaient encore X01 en cachette (`backupSchema`, `GetOngoingMatch`) — d'où un test de sauvegarde qui exporte puis réimporte **une partie de chaque mode**, et non plus un X01 seul |
| Règles X01 mal implémentées (bust, doubles) | La section 1 de ce plan **est** la suite de tests du lot 1 |
