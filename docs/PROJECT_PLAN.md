# Dartpéro — Plan détaillé

Plan de construction, lot par lot. Le résumé opérationnel et les décisions gravées vivent
dans [../CLAUDE.md](../CLAUDE.md) — **ce document ne le contredit jamais**.

Principe de travail : **un lot à la fois**, chacun se termine par un livrable vérifiable
(tests verts ou écran utilisable). On ne démarre pas le lot N+1 tant que le lot N n'est pas
validé.

---

## 0. Où l'on en est

**Lots 0 à 5c livrés**, plus **sept lots de finition** (détaillés en fin de § 4) : UX, refonte
visuelle « feuille de match », retraits décidés par l'usage, statistiques d'après-partie,
résumé transposé, trois finitions, thème clair. Puis **trois lots post-audit 2026-09-10**
(détaillés en fin de § 6) : `tour-du-monde-cloture-volee`, `pourcentage-doubles-tiret`,
`bundle-par-route`. App déployée sur https://dartpero.web.app.
Lot `regles-du-jeu` (lot 11 de la refonte : règles au livre ouvert, sortie libre gravée, voir
§ 4 et § 6), rebasé sur `statistiques-podium` puis Révision 1 : **1340 tests verts**.
Lot `rejouer` (lot 10 de la refonte : « Rejouer » à l'étape 1 de Nouvelle partie, voir § 4 et § 6) :
**fait, 1408 tests verts** ; relecture à l'écran (portrait, paysage, 360 px, deux thèmes) **faite sur téléphone** (19 octobre 2026).
**Suites hors lot** : (1) `backupSchema` ne contrôle pas le type de `doubleOut` / `doubleIn` d'une partie
importée (le filtre de « Rejouer » les écarte côté UI, mais l'import les laisse entrer) ; (2) un journal
importé non projetable fait échouer la lecture de l'historique (constat 11 de l'index).
Lot `reglages-par-usage` (lot 12 de la refonte : Réglages en une page, deux voyants, date du
dernier export, voir § 4 et § 6) : passé par Test (boucle 1), Sécurité (PASS) et Revue (NO-GO en passe 1,
boucle 5 : valeur de voyant en gras, duo à 56 px ; GO en passe 2) — **1429 tests verts**, **1497** après rebase sur `rejouer`.
**Vérifications sur appareil faites** (19 octobre 2026) : relecture à l'écran (portrait, paysage, sombre,
clair), 360 px et police système au maximum, contraste des vignettes de thème et du vert `vert-etat`,
iPhone réel (« Comment ? », guide `#installer`, export). Reste, sans échéance : **mesure** de la lecture
de toute la base à l'ouverture des Réglages (01, Baseline : « Dev mesure »), **non faite** ; repli
`count()` dans les dépôts si une lenteur se voit.
Lot `annulation-volee` (retours 8 et 3 des beta-testeurs : une fléchette par appui sur
« Annuler », confirmation de la sortie, voir § 4 et § 6). **Relecture à l'écran faite dans
Chrome** (port 5202 : portrait et paysage, sombre et clair, quatre modes, boîte à 360 px). Les
angles morts de `03-plan-de-test.md` (noms longs, parties à 3-4 joueurs, cut-throat et bust
d'entraînement, appui fantôme en paysage, focus sous **Safari**, **VoiceOver**) ont été **vérifiés sur
vrai téléphone** (19 octobre 2026).
Dettes du lot `reglages-par-usage` (`03-plan-de-test.md`) : **D1** — `useDernierExport` sans test du hook isolé
(`renderHook` si un second lecteur apparaît) ; **N1** — garde de l'aperçu en liste noire (une
couleur Tailwind par défaut passerait ; durcir en « toute couleur d'`Apercu` est `apercu-*` »).
Vérifications **acceptées à la relecture** par l'utilisateur (`docs/lots/regles-du-jeu/05-revue.md`,
passe 2), **toutes faites sur son téléphone le 19 octobre 2026** (liste gardée pour mémoire) :
- **défilement du corps de la feuille** (colonne `flex h-full flex-col`, nouvelle depuis la
  Révision 1) : la dernière rubrique atteignable à l'étape 2, sur le match en portrait (210 px)
  et en paysage ;
- **R1** Android : retour feuille ouverte avec une volée de 1-2 fléchettes, second retour, croix
  puis retour, Échap ; **R2** l'entrée n'est pas sautée par Chrome ; **U1** voile en portrait,
  appui sur les scores en paysage (ferme, voulu), glisser dans la feuille (ne ferme pas) ; **U2**
  rechargement feuille ouverte ; dans la même séance que le **T19** du lot 8, et « Tout voir »
  des Statistiques (✕, Échap, retour, voile) puisque la `Modale` passe par le hook commun ;
- **iPhone** : glissé retour avec une volée en cours, PWA (croix et voile seulement), livre à
  8 px du bord en paysage sans marge d'encoche ;
- nom de partie en `pl-11` dans les quatre modes ; 360 px (sous-titre X01 à 164/164 px à 390,
  titres `h1` de l'étape 2) ; sous-titre de la feuille sur deux lignes en paysage ;
- **textes non dessinés** (DV5) : X01 sur un double, entrée sur un double, sets, premier à
  1 manche, Cricket cut-throat, Tour du monde, entraînement ; parcours importé (phrase neutre
  P3-7, « 0 case » pour `['MISS']`) ;
- sombre et clair (neuf jetons, rouge et vert sur l'ardoise seulement) ; `top-[210px]` sur petit
  téléphone ; paysage 46 % / 21 rem ; rotation feuille ouverte ; `::backdrop` avant Safari 17.4 /
  Chrome 122 ; mouvement réduit ; police au maximum.
Pour le **prochain audit** : la garde des jetons réservés a des faux négatifs (`border-s/e-`,
`ring-offset-`, valeurs arbitraires, `index.css` ; passer à `border(?:-[trblxyse])?`) ; un
parcours importé avec doublons donne deux `<li key>` identiques — à traiter avec le constat 11 de
l'index (refuser `MISS` et les doublons à l'import).
**765 tests verts** (dont 76 du lot `accueil-parties-recentes`), `lint`, `typecheck` et `build` verts.
Lot `accueil-parties-recentes` livré (l'Accueil en parties récentes, « Abandonnée », voir § 6) —
vérifications restantes : la **relecture à l'écran** de `03-plan-de-test.md`
(`docs/lots/accueil-parties-recentes/`) en portrait et paysage, deux thèmes, avec 0, 1 et 15
parties ; sur vrai téléphone, le bouton « Nouvelle partie » fixé contre la barre et la
safe-area d'iPhone ; ⚠️ **la barre du bas avec la police système au maximum, avant tout
`firebase:deploy`** (taille système et zoom de Chrome sur Android, taille du texte sur iPhone :
un libellé d'onglet rogné appellerait le repli de la charte) ; l'anneau de focus sur l'onglet
actif ; la forme du badge « Abandonnée » ; « Kevin gagne · 3 manches » sur une carte à
4 avatars ; le temps d'affichage de l'Accueil (deux lectures, 20 + 30 journaux) ; captures du
README à refaire (`accueil.png`, `accueil-clair.png`, `historique.png`). Pour le **prochain
audit** : **T1** (aucun test ne garde le texte des règles des cartes), une garde « `src/ui`
n'importe aucune classe `*UseCase` » (R7), les exports en français de `backupSchema.ts`, la
double lecture 20 + 30 de l'Accueil, les états d'erreur des listes (une erreur s'affiche comme
« Pas de partie cette semaine » ; aucun `ErrorBoundary`), « 1 sorties » sans accord ; un
`createdAt` importé absurde affiche aussi « Invalid Date » dans Parties (constat 11 de l'index).
Lot `nom-de-partie` livré (un nom pour chaque partie, quatre modes, voir § 6) — vérifications
restantes : la **relecture à l'écran** de `03-plan-de-test.md` (`docs/lots/nom-de-partie/`) ;
**T1** sur iPhone (plus de 16 emoji tapés : `maxlength` de Safari compte-t-il comme
`MatchName.of` ? Si le lancement échoue, petit lot pour un message clair) ; **D5** la forme de
la ligne du nom dans le bandeau (cas serré : X01 en sets, double in / out, téléphone peu
haut) ; **constat 6** faut-il effacer « Dimanche soir » avant de taper un nom ; captures du
README à refaire avec un nom. Pour le **prochain audit** : R2 (aucun test ne distingue
`createdAt` de `updatedAt` pour le nom par défaut, `CONVENTIONS` § 11), R3 (`joueurs(mode)`
teste `'CHECKOUT_PRACTICE'` en dur dans 5 fichiers de test au lieu de `GameModes.isSolo`), R4
(antérieur : `hexagonalBoundary.test.ts` ne contrôle l'import entre modes que pour `x01` et
`tour-du-monde`), N2 (limites connues de `horlogeBoundary`, `CONVENTIONS` § 11) ;
`npm audit` : 8 vulnérabilités, toutes en dépendances de dev (vitest, sharp), 0 en production ;
« undefined nuit » sur un `createdAt` importé absurde (constat 8 de la Revue) à joindre au
constat 11 de l'index (borne haute de `horodatage` à l'import).
Lot `nouvelle-partie-en-etapes` livré (Nouvelle partie en trois étapes, « manche » à l'écran,
voir § 6) — vérifications restantes : la **relecture à l'écran** de `03-plan-de-test.md`
(`docs/lots/nouvelle-partie-en-etapes/`), le **glisser au doigt** et le **retour matériel** sur
un vrai Android, `<dialog>` et glisser sur iPhone ; les captures du README et
`public/screenshots/partie-x01.png` montrent encore « LEG » et l'ancien écran — à refaire à la
main.
Trois lots de la feuille de route Play Store livrés : `stockage-persistant`, `installation-guidee`
et `confidentialite-assetlinks` (voir § 6) — vérifications restantes :
- `confidentialite-assetlinks`, après déploiement : `curl.exe -I` et `curl.exe -s` sur
  `/.well-known/assetlinks.json` (200, `application/json`, `no-cache`, corps `[]`), puis
  `/confidentialite` en navigation privée (DEPLOIEMENT § Confidentialité) ; rendu sur appareil
  réel ;
- `stockage-persistant` : Android installé, iPhone ;
- `installation-guidee`, après déploiement (non bloquant) : **R1** vraie fenêtre d'installation de
  Chrome avec captures, et **aucune seconde icône** sur l'Android déjà installé (DevTools →
  Manifest → « Computed App ID » identique avant / après) ; **R2** détection iOS sur un vrai
  iPhone (iPad si possible : Safari, Chrome iOS, navigateur intégré) ; **R5** raccourci
  « Nouvelle partie » à l'appui long, qui n'arrive qu'à la mise à jour de la WebAPK (⚠️ ne jamais
  désinstaller pour tester sans exporter d'abord) ; **R6** sur iOS ≥ 16.4, un navigateur tiers
  propose-t-il lui-même « Sur l'écran d'accueil » ? Si oui, seul un libellé change.

Lot `statistiques-podium` livré (lot 8 de la refonte : Statistiques en podium, cible en tête,
« Tout voir » en modale, voir § 6) — **1233 tests verts** après rebase sur
`nouvelle-partie-parcours`. Vérifications **acceptées après le
lot** par l'utilisateur (`docs/lots/statistiques-podium/05-revue.md`), sur son téléphone, au
plus tard au prochain déploiement :
- **T19** le retour réel referme la modale sans quitter Statistiques : Chrome Android (chemin
  `cancel`), Firefox / Samsung Internet (`popstate`), iPhone en onglet (glisser du bord), PWA
  iPhone (✕ et voile seulement) ; **Q3 de `sec`** une modale restaurée sans entrée d'historique
  dessous resterait bloquée (✕, Échap, voile sans effet) — repli à écrire si ça se reproduit ;
- le voile `::backdrop` sur iOS ancien (propriétés personnalisées avant Safari 17.4), `dvh`,
  `fieldset` en flex et défilement du ruban d'onglets sur iOS ; recadrage du ruban à la rotation
  ou avec la police agrandie (non prévu) ;
- **relecture à l'écran** : titre `laiton` des cartes et de la modale en clair (écart U4 accepté,
  4,40:1), taille de la modale, espacements de la liste, étiquette « 100+ » centrée sur deux
  rangées de bâtons, Victoires avec « 100 / 120 », police au maximum.
Dette : `DialogueNouveauJoueur` ne passe pas par l'historique (CONVENTIONS § 9).

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
4. ~~**Un lot de règles « sortie libre »**~~ **Fait au lot `regles-du-jeu`** : `CLAUDE.md`
   § Checkouts, le glossaire, le README et l'écran (« Pas de finish » jusqu'à 180, S1 à 1)
   décrivent les deux sorties. Reste, sans règle à écrire : « % doubles » s'affiche « — » pour
   toute partie en sortie libre (aucune tentative de double comptée), ce qui est exact.
5. **Les décisions ouvertes** listées dans `CLAUDE.md` : les jeux fun restants (Killer,
   Shanghai, Around the Clock), sync cloud (lot 6), i18n. Aucune n'est bloquante — le mode
   paysage, le Cricket et le thème clair sont tranchés et livrés.

⚠️ **Ce que les sept lots de finition ont appris**, et qui vaut pour la suite : la moitié des
décisions de cadrage qui sont tombées l'ont été **par la pratique**, pas par le code — le mode
rapide retiré faute de s'en servir, le « best of N » qui mentait à trois joueurs. Et à chaque
lot, la **relecture à l'écran** a rattrapé des défauts qu'aucune requête par rôle ne pouvait
voir. Les tests verts ne sont pas la fin d'un lot.

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
| `MatchName` | branded `string` (lot `nom-de-partie`) | `MatchName.of` retire les espaces autour ; vide → `null` (pas de nom) ; plus de 30 caractères → erreur. |

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

Les quatre ouvertures portent aussi un champ **facultatif** `name?: MatchName` (lot
`nom-de-partie`) : **clé absente** quand rien n'a été tapé, jamais `name: undefined`. `nameOf(events)`
le lit (`switch` exhaustif sur l'ouverture). Le nom par défaut n'est jamais écrit.

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
| `suggestCheckout(reste, dartsRestantes, sortie)` | Chemin conseillé. Retourne **« pas de finish »** (`null`) sur les restes sans sortie en 3 fléchettes et au-delà de la borne : sur un double, bogey numbers **169, 168, 166, 165, 163, 162, 159**, borne 170, rien sous 2 ; en sortie libre, **179, 178, 176, 175, 173, 172, 169, 166, 163**, borne 180, **S1** à un reste de 1 (lot `regles-du-jeu`). |
| `checkoutRange(sortie)` | `{ max, noFinish }` : 170 + `BOGEY_NUMBERS` sur un double, 180 + `FREE_OUT_NO_FINISH` en sortie libre (références de test, l'algorithme ne les lit pas). |
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
`GetCheckoutSuggestion` · **`GetCheckoutRange`** (lot `regles-du-jeu` : borne et listes « pas de
finish » de la sortie, pour l'écran X01 et la feuille de règles) · `GetPlayerStats` ·
`ManagePlayers` · `ManageBackup` ·
**`GetReplayableConfigurations`** (lot `rejouer` : les configurations distinctes des 50 dernières
parties, pour « Rejouer ») ·
**`RestartMatch`** (lot UX) · **`GetMatchName`** (lot `nom-de-partie` : `{ name, createdAt }`,
de quoi afficher le nom tapé ou recalculer le nom par défaut) ·
**`GetDeviceContents`** (lot `reglages-par-usage` : `{ matches, players }`, le compte de toute la
base pour « N parties · M joueurs sur ce téléphone » et « Gérer les joueurs »)

Lot `accueil-parties-recentes` : `X01Summary.legsPlayed` (manches jouées, tous sets confondus,
dérivé des `LegWon`) ; `matchStatus(summary, ongoingId)` (`use-cases/summarize.ts`), fonction
pure qui rend `'FINISHED' | 'ONGOING' | 'ABANDONED'`, **importée directement par l'UI** — la
seule de `use-cases/`. `GetOngoingMatch` sert désormais aussi de **référence globale** à
« Abandonnée », à l'Accueil comme dans Parties. Aucun port nouveau.

⚠️ **L'horloge est exposée à l'UI** (`Services.clock`, lot `nom-de-partie`) : la même instance que
celle des use cases, pour proposer « Dimanche soir » à l'étape 1 sans `Date.now()`. Exception de
même nature que `devices` ; garde `tests/architecture/horlogeBoundary.test.ts`.

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
| `PersistentStorage` | `navigator.storage.persist()` | `FakePersistentStorage` (espion) | **lot `stockage-persistant`** ✅ |
| `AppInstallation` | `beforeinstallprompt`, `appinstalled`, `display-mode`, `navigator.standalone` | `NullAppInstallation` ; `FakeAppInstallation` (état réglable, espion) | **lot `installation-guidee`** ✅ |

---

## 3. Écrans & routes

| Route | Écran | Lot |
| --- | --- | --- |
| `/` | Accueil — les parties récentes en cartes (« Aujourd'hui », « Cette semaine », 30 au plus), la partie en cours épinglée en tête avec *Reprendre*, *Nouvelle partie* fixé au-dessus de la barre ; invitation à installer, écartable (*Plus tard*) | 3 ✅ · cartes : `accueil-parties-recentes` ✅ |
| `/nouvelle-partie` | Étape 1 : le jeu en tuiles 2 × 2 (X01, Cricket, Tour du monde, Entraînement), barre d'étapes | `nouvelle-partie-en-etapes` ✅ · habillage : `nouvelle-partie-parcours` ✅ |
| `/nouvelle-partie/:jeu` | Étape 2 : joueurs (rangée compacte, menu « + »), fiche de réglages du jeu (récap en grand, « Plus de réglages » replié au X01, « Les règles en entier ») et **nom de la partie** facultatif (prérempli « Dimanche soir », 30 caractères au plus) | `nouvelle-partie-en-etapes` ✅ · nom : `nom-de-partie` ✅ · fiche : `nouvelle-partie-parcours` ✅ |
| `/nouvelle-partie/:jeu/ordre` | Étape 3 : ordre de jeu (feuille numérotée, glisser-déposer, « Tirer au sort » = mélange visible), dès 2 joueurs | `nouvelle-partie-en-etapes` ✅ · `nouvelle-partie-parcours` ✅ |
| `/nouvelle-partie/:jeu/joueurs` | Sélectionner un joueur existant | `nouvelle-partie-en-etapes` ✅ |
| `/partie/:id` | **Écran de partie** — le cœur de l'app | 3 ✅ |
| `/partie/:id/resume` | Résumé de fin : vainqueur, stats du match, rejouer | 3 ✅ |
| `/entrainement` | Redirige vers `/nouvelle-partie/entrainement` (l'écran de lancement a disparu) | `nouvelle-partie-en-etapes` ✅ |
| `/historique` | Liste des parties jouées, tous modes, avec statut et suppression — même carte que l'Accueil (`CartePartie`), même statut « Abandonnée », sans détail par joueur (il reste dans le résumé) | 4 ✅ · carte : `accueil-parties-recentes` ✅ |
| `/joueurs` | Profils locaux (créer, renommer, couleur, supprimer) — atteint depuis Réglages → Joueurs et appli → Gérer les joueurs (plus d'onglet) | 4 ✅ |
| `/statistiques` | Carrière : tableaux comparatifs classés | 4 ✅ |
| `/reglages` | Une page rangée par usage : voyants Dernier export et Application, compte de la base, guide d'installation (ancre `#installer`), Affichage (**thème clair / sombre / système** en vignettes, voix), Sauvegarde (export / import JSON, protection), Joueurs et appli (lien Joueurs, Confidentialité) | 4 ✅ · `reglages-par-usage` ✅ |
| `/confidentialite` | Politique de confidentialité et mentions légales — URL donnée à la Play Console | `confidentialite-assetlinks` ✅ |
| `/historique/:id` | Détail d'une partie | **jamais fait** |
| `/joueurs/:id` | Stats cumulées d'un joueur | **jamais fait** |

⚠️ **Une seule URL par partie**, quel que soit le mode : `PartieEcran` lit le mode sur le
journal et rend l'écran correspondant. Un lien d'historique reste donc valable pour toujours.

Le **nom de la partie** (lot `nom-de-partie`) se lit à quatre endroits : le titre de sa carte
dans l'historique (`<h2>`) et à l'Accueil (`<h3>`, lot `accueil-parties-recentes`), la tête des
quatre résumés (`TableauHonneur`, un `<p>`), et une ligne à part sous la rangée du bandeau des
quatre écrans de jeu (`DispositionPartie`).

Les deux dernières lignes sont **une décision en suspens, pas un oubli** : l'écran
`/statistiques` (lot 4) donne déjà les tableaux comparatifs classés, et l'historique porte
déjà l'essentiel de chaque partie. À trancher : les écrans de détail apportent-ils assez pour
exister, ou disparaissent-ils de ce plan ?

Navigation basse : **Début · Stats · Parties · Réglages** — quatre entrées depuis le lot
`nouvelle-partie-en-etapes` (Joueurs est passé dans Réglages ; l'écran de statistiques avait
gagné sa place au lot 4). Icônes lucide `aria-hidden`, cibles ≥ 48 px,
`env(safe-area-inset-bottom)`. Hauteur **fixe** depuis le lot `accueil-parties-recentes` (le
bouton fixé de l'Accueil s'y cale ; charte § Composants). Elle **n'apparaît pas** pendant une partie ni
sur l'écran de configuration.

---

## 4. Les lots

### Débrief et Lot D

✅ **Débrief** : nom, ambiance, modes, saisie, persistance, usage — tout tranché.
✅ **Lot D** — `CLAUDE.md` + [docs/PROJECT_PLAN.md](PROJECT_PLAN.md).

---

### Lot 0 — Scaffold

**Contenu** : Vite + React 19 + TS · Tailwind v4 (`@theme` avec les tokens de la charte) ·
Biome (avec l'`override` qui interdit les imports externes dans `src/core/**`) · Vitest v3 +
Testing Library + jsdom · `vite-plugin-pwa` (manifest « Dartpéro ») ·
`@vitejs/plugin-basic-ssl` + `server.host: true` pour le test sur téléphone ·
`@fontsource` (Alfa Slab One, Oswald, Barlow) · scripts npm.

**Fini quand** : `npm run dev`, `npm test`, `npm run lint` et `npm run typecheck` passent,
et une page « Dartpéro » s'affiche aux couleurs de la charte.

✅ **Fait.** Scaffold : Vite 8 + React 19 + TS 7 + Tailwind 4 + Biome 2.5 + Vitest 4 +
`vite-plugin-pwa`. Tokens de la charte dans `src/index.css` (`@theme`), 3 polices
`@fontsource` (sous-ensemble latin), icônes PWA générées, frontière hexagonale **vérifiée**
par Biome. `dev` / `test` / `lint` / `typecheck` / `build` verts.

**Versions installées au lot 0 (août 2026)** : vite **8.2** · vitest **4.1** · TypeScript
**7.0** · Biome **2.5.6** · Tailwind **4.3** · React **19.2** · react-router **8.3**
(passé de 7.18 à 8.x au commit `61b60ac`) · Dexie **4.4** · vite-plugin-pwa **1.3**. Une **seule copie de vite** (deduped partout) — l'ancien conflit
vitest v2 / vite@5 n'existe plus, aucune précaution à prendre de ce côté.

**Frontière hexagonale vérifiée** : l'`override` Biome sur `src/core/**` rejette bien les
imports de `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `lucide-react`,
`dexie` et `sharp`, avec un message d'erreur explicite. Testé au lot 0 puis retiré.

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
double usuel), pas la table PDC — voir « Décisions du domaine (lot 1) » au § 6.

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
Livré : ports driving/driven, 9 use cases, adapters **Dexie** + **in-memory**, composition
root (`src/composition/container.ts`) et `ServicesProvider` injectable.

---

### Lot 3 — Écran match ⭐

Le lot qui rend l'app réellement utilisable.

**Contenu** :
- Accueil + configuration de partie.
- **Écran match** : zone lecture (chiffres géants, joueur actif en halo laiton, moyenne en
  direct) + zone saisie (grille S/D/T) — voir la maquette dans
  [CHARTE_GRAPHIQUE.md](CHARTE_GRAPHIQUE.md) § Écran de match — disposition imposée.
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
Routage React Router, `QueryClient` + `ServicesProvider` câblés.

---

### Lot 3 bis — Refonte visuelle

✅ **Fait** — Refonte visuelle : la charte « pub anglais » réellement exécutée
(matières, relief, cible SVG, avatars, animations ciblées + `prefers-reduced-motion`),
socle de composants communs, en-tête de match avec bouton retour, valeur réelle des touches
hors simple, mode rapide qui projette le reste. **100 tests toujours verts, aucun modifié.**
Le détail : § 6, « Décisions de la refonte visuelle (lot 3 bis) ».

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
ouverte au seul endroit de l'UI qui en a besoin (`ApercuPartie`, devenu `CartePartie` au lot
`accueil-parties-recentes`).
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

### Lot UX — l'usage avant la peinture

Cinq frictions relevées **dans le code**, pas d'impression — et trois d'entre elles ne faisaient
que **brancher des choses déjà écrites et jamais appelées**.

✅ **Fait — 263 tests verts.** `annonceTour` (« À toi, Julien ») existait depuis le lot 5b sans
un seul appelant : la voix disait « 80 » sans dire à qui c'était le tour, alors qu'elle est le
seul canal qui porte jusqu'à l'oche. S'y ajoutent « On remet ça » (nouveau port `RestartMatch`),
les réglages de partie mémorisés via `Preferences`, l'ordre de passage réordonnable, et un
bouton « Annuler » qui dit ce qu'il va défaire.

⚠️ **Une seule phrase par volée, jamais deux appels** : `SpeechAnnouncer.say` commence par
`speechSynthesis.cancel()`, donc dire le score puis le tour ferait taire le score. D'où
`annonceFinDeVolee(resultat, prochain)`, qui compose « 180. À toi, Julien » en un énoncé.
⚠️ **`RestartMatch` rappelle les lancements existants, il ne recopie pas l'ouverture** : c'est
la seule façon qu'une relance passe par exactement les mêmes contrôles qu'un premier départ.

---

### Lot visuel — piste E, « la feuille de match »

Trois pistes proposées (« La Cible », « La Feuille de match », « Le Boîtier ») ; l'utilisateur a
tranché pour **E**, celle qui remplace le décor par de la **structure**.

✅ **Fait — 263 tests verts, aucun modifié**, ce qui valide au passage qu'une refonte visuelle
complète n'a touché à aucun comportement. Colonnes réelles avec en-têtes en inversion, filets
épais, legs en bâtons, fléchettes écrites sur une ligne, **angle vif partout** (tokens de rayon
à 0 **et** `rounded-*` retirées de tout `src/ui`). Le halo qui respire est mort, remplacé par
`.au-lancer`.

⚠️ **Vérifié à l'écran, pas seulement au vert des tests** : trois défauts n'auraient pas été vus
autrement — la feuille qui flottait en haut d'une zone vide, l'ordre affiché qui contredisait
les numéros de passage, et deux touches restées bordées de vert et de marron.

---

### Lot « ce que l'usage a tranché »

Deux décisions de cadrage **renversées par la pratique**, pas par le code.

✅ **Fait — 255 tests verts** (−7 sur `composeVisit`, −2 sur la saisie rapide, **+1 qui interdit
son retour discret**). Le **« best of N » devient « premier à N legs »** : à deux joueurs la
convention tenait, à quatre la même partie peut durer plus de legs que le format n'en annonce —
le libellé mentait. Et le **mode rapide est retiré** après plusieurs soirées sans jamais s'en
servir : pavé, port `BuildVisitFromScore`, use case, `composeVisit` et `findExactScore` compris.

⚠️ **Ne pas confondre les deux disparitions du mode rapide** : le commit `61b60ac` l'avait
supprimé **par accident** (restauré depuis `cc8faf7`) ; ce lot-ci l'a retiré **volontairement**.
Récupérable dans l'historique à `d531a7e` si l'envie revenait.

---

### Lot « ce qu'on regarde après la partie »

Deux idées reprises à une app du Play Store (captures fournies, **hors dépôt**), et **seulement
deux** — le reste a été écarté explicitement.

✅ **Fait — 275 tests verts.** La **carte des impacts** (où les fléchettes se plantent, dessinée
sur un plateau réduit à sa structure) et le **filtre de période** (Aujourd'hui / 7 j / 30 j /
Tout). Nouveau service transverse `dartboardHits`, `GetPlayerStats` qui prend une fenêtre de
temps, `ChoixSegmente` remonté dans `commun/`.

⚠️ **Le port prend un identifiant de période, pas une date** : c'est le use case qui la résout
avec `Clock`. Faire calculer la borne par l'UI aurait remis un `Date.now()` dans l'application
et rendu le filtre intestable. `Date` n'y sert que de **calendrier** (où tombe minuit local),
jamais d'horloge.
⚠️ **Deux écrans vides, pas un** : « aucune partie » appelle à jouer, « rien sur cette période »
invite à élargir la fenêtre. Les confondre ferait croire à une base effacée.

---

### Lot « le résumé devient une feuille »

La dette notée au lot 4 : « des stats en tableau comparatif classé plutôt qu'en cartes empilées
— **vaut aussi pour l'écran de résumé** ». Elle est payée.

✅ **Fait — 309 tests verts.** Le résumé X01 passe à un tableau **transposé** (joueurs en
colonnes, statistiques en lignes) et reçoit la carte des impacts de la partie. Relu à l'écran
à 2 et 4 joueurs.

⚠️ **Le résumé n'a pas repris la disposition de l'écran Statistiques, et c'est délibéré** : une
carrière, c'est beaucoup de joueurs × peu de chiffres → une ligne par joueur ; un match, c'est
2 à 4 joueurs × dix chiffres → transposé. Copier littéralement l'autre écran aurait donné trois
tableaux de deux lignes sur un tête-à-tête : on aurait déplacé le défilement, pas supprimé.
⚠️ **Les impacts descendent dans `X01PlayerStats`** : la carrière additionne les cartes de
chaque partie au lieu de tout recompter — **une seule façon de compter**, donc aucune chance que
le résumé d'une soirée et le cumul de carrière se contredisent.

---

### Lot « les trois finitions »

Les trois idées mises de côté au lot précédent, reprises telles quelles.

✅ **Fait — 301 tests verts.** Filtre de mode sur l'historique, ordre de passage **tiré au sort**
au lancement, et **`legsPlayed`** — le dénominateur qui manquait aux legs, avec son tableau à
part et les pourcentages de victoires.

⚠️ **Le filtre s'applique avant la coupe à `limit`, jamais après** : chercher « les Cricket »
dans les vingt parties les plus récentes n'en rendrait aucune le soir où l'on vient d'enchaîner
vingt X01. Corollaire assumé : filtrer coûte un `listAll()`.
⚠️ **Le tirage a lieu dans le use case, et son résultat est écrit dans l'ouverture** — même
règle que les cibles d'entraînement : ce qui est tiré est écrit, jamais rejoué. Mélanger à la
projection redistribuerait les joueurs à chaque annulation.
⚠️ **Un tiret, jamais « 0 % », quand rien n'est terminé** : « 0 % » veut dire « il a tout
perdu », « rien » veut dire « on ne sait pas encore ».

---

### Lot « thème clair »

La dernière ligne de la charte qui n'avait jamais été exécutée.

✅ **Fait — 318 tests verts.** Thème **sombre / clair / système** dans les Réglages. Le clair est
la **même feuille de match** — encre sur papier plutôt que craie sur feutre — obtenu en
redéfinissant les **valeurs** des tokens sous `html[data-theme="clair"]`, **sans toucher une
seule classe de `src/ui`**.

⚠️ **Le défaut reste « sombre », pas « système »** : le cadrage est un garage mal éclairé.
⚠️ **Le point critique, c'est le laiton** : à `#C9A227` il fait 1,84:1 sur du papier, donc le
filet « c'est ton tour » — l'information la plus lue de l'app — y serait invisible. D'où un
laiton foncé en clair, et un `laiton-clair` qui veut dire « plus lisible sur le fond », donc
**plus foncé**. Le rôle s'inverse, pas la teinte.
⚠️ **Les accents de mode ont dû descendre dans `index.css`** en `--accent-*` : ils partent dans
un `style=` inline qu'aucune règle CSS ne peut retourner, donc un hex y serait figé au mauvais
thème. Un test d'architecture (`themeBoundary`) verrouille la frontière.
⚠️ Un script d'amorçage dans `index.html` pose `data-theme` **avant** le bundle, sinon la page
flashe. C'est un **doublon assumé** de `theme.ts` : il ne peut pas l'importer.

---

### Lot « installation-guidee » (feuille de route Play Store, lot 2)

✅ **Fait — 437 tests verts** (+71). Invitation à installer : ligne discrète sur l'Accueil
(« Installer » / « Plus tard », mémorisé), entrée complète dans Réglages → À propos (bouton,
guide iOS en trois gestes, « Ouvrez dans Safari », « installé »), et le refus de « Redemander »
prolongé vers l'installation. Manifeste enrichi (`id: '/'`, `categories`, raccourci
« Nouvelle partie », trois captures hors précache), contrôlé par `npm run smoke`. Détail § 6 ;
vérifications sur appareil en § 0.

### Lot « confidentialite-assetlinks » (feuille de route Play Store, lot 3)

✅ **Fait — 456 tests verts** (+19). Écran `/confidentialite` (politique + mentions légales, lien
depuis Réglages → À propos), `/.well-known/assetlinks.json` (`[]`, rempli au lot 4) servi par
Firebase Hosting hors repli et hors précache du service worker, `ignore` réécrit (fuite des
dossiers cachés fermée), smoke étendu (assetlinks, entrées cachées, `denylist`, aucune requête
externe, garde `REMPLIR`). Détail § 6 ; vérification après déploiement en § 0.

### Lot « nouvelle-partie-en-etapes »

✅ **Fait — 517 tests verts** (+61). Nouvelle partie en trois étapes, une route chacune (le jeu ;
joueurs et réglages ; ordre de jeu dès 2 joueurs), sur le modèle de DartsOn mais dans la charte.
Rangée d'avatars avec ×, menu « + » (nouveau joueur en `<dialog>`, joueurs existants), ordre par
glisser-déposer natif et clavier, sets exposés, entraînement en carte de l'étape 1, « manche » à
l'écran, onglet Joueurs déplacé dans Réglages. Détail § 6 ; relecture sur appareil en § 0.

### Lot « nom-de-partie »

✅ **Fait — 689 tests verts** (+172). Un nom pour chaque partie, dans les quatre modes : champ
« Nom de la partie » à l'étape 1, prérempli d'un nom par défaut (« Dimanche soir ») ; seul un
nom tapé s'écrit (30 caractères au plus, champ facultatif de l'ouverture). Le nom s'affiche
dans l'historique, en tête des résumés et sous le bandeau de jeu ; « Rejouer » le garde,
`backupSchema` le transporte. Détail § 6 ; relecture sur appareil en § 0.

### Lot « accueil-parties-recentes »

✅ **Fait — 765 tests verts** (+76). L'Accueil montre les parties récentes en cartes,
« Aujourd'hui » puis « Cette semaine » (30 au plus), la partie en cours épinglée en tête avec
« Reprendre », et un seul appel, « Nouvelle partie », fixé au-dessus de la barre. « Abandonnée »
est dérivée, la même à l'Accueil et dans Parties, qui passe à la même carte. Le X01 gagne
« manches jouées » ; un X01 terminé affiche « Kevin gagne · 3 manches ». Détail § 6 ;
relecture sur appareil en § 0.

### Lot « nouvelle-partie-parcours »

✅ **Fait — 1091 tests verts** (+26). Barre d'étapes (non interactive), étape 1 en tuiles 2 × 2
(le nom de la partie descend à l'étape 2), fiche de réglages par jeu (récap en grand, « Plus de
réglages » replié au X01, « Les règles en entier »), feuille d'ordre numérotée et « Tirer au
sort » en mélange visible (`ShuffleOrder`). Dettes : le flag `shuffle` des commandes de lancement
n'a plus d'appelant UI ; la clé `partie:ordre-aleatoire` reste orpheline dans `localStorage`.
Détail § 6.

### Lot « statistiques-podium » (lot 8 de la refonte de la charte)

✅ **Fait — 1233 tests verts** (1194 sur sa branche, 1233 après rebase). Statistiques en « podium, cible en tête » : le joueur consulté
(mémorisé) en grande cible avec ses trois zones favorites, puis quatre cartes en barres (Moyenne
/ First 9 / Meilleure volée, Victoires « v / j », Grosses volées en bâtons de craie, Finitions),
les N premiers puis « Tout voir » dans une modale refermée par le retour du téléphone. Politique
de confidentialité mise à jour. Détail § 6 ; vérifications sur appareil en § 0.

### Lot « regles-du-jeu »

✅ **Fait — 1340 tests verts** après rebase sur `statistiques-podium`, Révision 1 et tour 3 (1158 à la passe 1).
Livre ouvert (`LivreRegles`) à l'étape 2 et dans le bandeau des quatre matchs ; feuille de règles
par-dessus (`FeuilleRegles`, `<dialog>`), même mécanisme que la `Modale` des Statistiques
(`useModaleAuRetour`, clé `regles` ; `useDialogueNatif`, partagé) ; texte des quatre jeux dans `labels.ts`, qui
suit les réglages ; « Les règles en entier » retiré de la fiche. Domaine : `checkoutRange`
(170 / 180), `FREE_OUT_NO_FINISH`, S1 à 1 en sortie libre ; port `GetCheckoutRange` ;
« Pas de finish » borné par la sortie. Reste : relecture à l'écran (textes non dessinés, retour
Android par CloseWatcher, iPhone). Détail § 6.

### Lot « rejouer » (lot 10 de la refonte de la charte)

✅ **Fait — 1408 tests verts** (+68). Section « Rejouer » en tête de l'étape 1 de Nouvelle partie :
les trois configurations distinctes récentes (mode + réglages + ensemble de joueurs), fusionnées
avec « N fois », relancées par ▶ (Ordre à deux joueurs ou plus, lancement direct en solo),
« Ou un autre jeu » en rangée compacte. Port `GetReplayableConfigurations` + use case lus sur
l'historique, rien de stocké. Reste : relecture à l'écran (portrait, paysage, 360 px, deux
thèmes). Détail § 6.
### Lot « reglages-par-usage » (lot 12 de la refonte de la charte)

✅ **Fait — 1429 tests verts** (Test boucle 1 : 1428 ; Sécurité PASS ; Revue : NO-GO en passe 1, boucle 5, GO en passe 2). Réglages en une page (planche `derniers.html` `#rg4`) :
deux voyants (`Voyant`) en tête, ligne « N parties · M joueurs » (port `GetDeviceContents`),
guide `#installer` sous la ligne, puis Affichage (`VignetteTheme`, `LigneReglage`), Sauvegarde
(duo, phrase de protection, « Demander la protection »), Joueurs et appli, pied. Date du dernier
export : préférence `sauvegarde:dernier-export`, citée par la politique (mise à jour le
17 octobre 2026). Jetons `vert-etat` et `apercu-*` réservés. Reste : vérifications sur appareil (§ 0).
Détail § 6.
### Lot « annulation-volee » (retours 8 et 3 des beta-testeurs)

✅ **Fait — 1571 tests verts après rebase sur `vocabulaire-anglais`** (1552 avant ; Test boucle 1 : 1534 → 1545 ; relecture à l'écran : 1551 ; garde après Valider : 1552 ; Sécurité RAS sécu ; Revue : voir `docs/lots/annulation-volee/05-revue.md`). Annuler retire **une fléchette à la fois**, la dernière,
quel que soit le joueur : la volée rouverte quitte le journal et ses fléchettes restantes reviennent
en saisie (`ReopenedVisit`, quatre modes). La fléchette qui sort / gagne / boucle ouvre la boîte
`BoiteConfirmation` (*Corriger* / *Valider la sortie*) avant toute écriture, voix et célébration.
Aucun format persisté. Relecture à l'écran faite dans Chrome ; reste le vrai téléphone (§ 0). Détail § 6.

### Lot « nouveaux-modes » — *à cadrer* (proposé le 19 octobre 2026)

Cinq modes de plus derrière la couture `GameMode` (`src/core/domain/games/index.ts`) :
**Killer**, **Shanghai**, **Around the Clock**, **Baseball**, **entraînement au scoring**
(volées libres sur le triple 20, moyenne par séance).

⚠️ **Aucune règle n'est écrite ici, à dessein** : `rules/response-policy.md` interdit d'improviser une
règle de jeu. Chaque mode passe par `/intake`, qui fixe ses règles avec l'utilisateur avant que
`CLAUDE.md` ne les grave (§ Règles de…). Killer et Shanghai étaient jusqu'ici « hors périmètre v1 » :
`CLAUDE.md` § Décisions structurantes et § Décisions ouvertes 3 sont à mettre à jour à la validation.

Points à trancher à l'`/intake` :
- **Un lot ou plusieurs** : cinq modes dans un seul lot, c'est un commit unique et une revue très large
  (un dossier, un événement d'ouverture et l'aiguillage par mode, plus `backupSchema` et le test de
  sauvegarde « une partie de chaque mode »). Découpage conseillé : un lot par mode, ou deux (jeux de
  groupe d'abord, entraînement ensuite).
- **Around the Clock** recoupe le Tour du monde : mode distinct ou variante de réglage de l'existant.
- **Entraînement au scoring** : hors statistiques comme l'entraînement au checkout, ou cumulé.
- Pour chacun : joueurs min/max, fin de partie, départage, écran de match (portrait et paysage),
  rubrique de la feuille de règles (`labels.ts`), annonces vocales.

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
| La politique `/confidentialite` devient fausse (réseau, permission, cookie, donnée stockée nouvelle) | Le lot qui l'ajoute met `SECTIONS_CONFIDENTIALITE` et sa date à jour (`CLAUDE.md` § DS) ; seul le réseau a un fil-piège (`reseauBoundary`) |

---

## 6. Journal des décisions, lot par lot

Le détail — le pourquoi de chaque choix, les pièges rencontrés, les incidents corrigés — pour
chaque lot livré. `CLAUDE.md` ne garde que les décisions structurantes qui en découlent ; ce
qui suit est l'historique complet.

---

### Décisions du domaine (lot 1) — à ne pas défaire sans raison

- **Le journal ne stocke QUE `MatchStarted` et `VisitRecorded`.** `LegWon` / `SetWon` /
`MatchFinished` sont **déduits** par les règles et exposés en `MatchMilestone`, jamais
persistés. Sinon annuler voudrait dire « retirer la dernière volée **et** les événements
qu'elle a déclenchés » — exactement la classe de bug qu'on veut éliminer. Annuler = 
`X01Rules.project(events.slice(0, -1))`, point.
- **`VisitRecorded` ne porte pas de `playerId`** : à qui est le tour se déduit de la
projection. Le journal ne peut donc pas être en désaccord avec les règles.
- **`Visit` n'est pas stockée**, c'est un artefact de projection (issue, points marqués,
restes avant/après recalculés à chaque rejeu).
- **Le dossier `gameModes/` n'existe pas encore** : X01 est le seul mode de la v1, on ne
généralise pas avant d'avoir un 2ᵉ mode réel (entraînement, lot 5). YAGNI assumé.
- **Un bust annule aussi l'ouverture du `double in`** : la visite entière est annulée, donc
le double d'ouverture aussi. Lecture délibérée, testée.
- **Suggestion de checkout = heuristique, pas la table PDC.** La route proposée est toujours
**valide et la plus courte**, et laisse un double usuel, mais elle peut différer de la table
professionnelle (99 → `T20 S7 D16` chez nous, `T19 S10 D16` en table). Un test exhaustif
vérifie que **tous** les restes de 2 à 170 hors bogey numbers ont une route correcte, et que
les 7 bogey numbers sont exactement les bons.
- **Conventions de stats** (choisies, documentées, testées) : les paliers sont **cumulatifs**
(un 180 compte aussi en 140+/100+/60+) ; la moyenne *first 9* porte sur les **3 premières
volées** de chaque leg ; une **tentative de double** = toute fléchette lancée depuis un reste
qu'une seule fléchette peut clore (pair ≤ 40, ou 50).

### Décisions de la couche application (lot 2)

- **`MatchRecord` ne persiste que le journal** (`id`, `createdAt`, `updatedAt`, `events`).
Le vainqueur, les scores, les legs gagnés ne sont **jamais** stockés : ils se rejouent. Seules
les dates échappent au journal, elles viennent du port `Clock`.
- **Les règles sont appliquées AVANT d'écrire.** `RecordVisitUseCase` projette, applique
`X01Rules.applyVisit`, et n'ajoute l'événement que si ça passe : une volée illégale ne laisse
aucune trace. Testé explicitement.
- **`MatchSummaryPlayer.name` vaut `null`** quand le profil local a été supprimé. Le cœur ne
fabrique pas de libellé français ; c'est l'UI qui décide d'afficher « Joueur supprimé ».
- **Un port n'est créé qu'avec son premier consommateur.** Lot 2 = `MatchRepository`,
`PlayerRepository`, `Clock`, `IdGenerator`. `ScreenLock` / `Haptics` / `Preferences` arrivent
au **lot 3**, `Announcer` au **lot 5** — écrire un port sans appelant, c'est du code non testé
qui vieillit.
- **Test d'architecture** (`tests/architecture/hexagonalBoundary.test.ts`) : il lit les imports
réels de `src/` et vérifie que le cœur n'importe que lui-même (en relatif), que `src/ui` ne
touche aucun adapter, et qu'aucun adapter ne remonte vers l'UI. Plus robuste que la liste de
paquets bannis de Biome, qui ne peut interdire que ce qu'on a pensé à y mettre. Les deux
cohabitent : Biome donne l'erreur dans l'éditeur, le test attrape le reste. **Un garde-fou
interne vérifie que le test n'est pas vert à vide** (nombre de fichiers et d'imports analysés).
- **`fake-indexeddb`** (devDep) est chargé dans `tests/setup.ts` : jsdom n'a pas d'IndexedDB,
sans quoi les adapters Dexie seraient les seuls du projet à n'être jamais exécutés en test.
- **`createDatabase()` est une fonction, pas une sous-classe de Dexie** : avec
`useDefineForClassFields`, des champs de classe écraseraient les tables installées par Dexie.

### Décisions de l'écran de match (lot 3)

- **La volée en cours n'est PAS persistée.** Elle vit en état local ; le port driving
`PreviewVisit` (synchrone, pur) l'évalue à chaque fléchette pour faire suivre le score affiché
et détecter qu'elle est close (3 fléchettes, bust ou sortie). Elle n'est envoyée à
`RecordVisit` qu'à ce moment-là. Sans ce port, l'UI devrait réimplémenter les règles.
- **TanStack Query sert de cache, pas d'orchestrateur.** `RecordVisit` renvoie déjà le nouvel
état, injecté via `setQueryData` : aucun rechargement entre le tap et le score affiché.
- **Un seul bouton « Annuler »**, qui fait ce qu'on attend : il retire la fléchette qu'on vient
de taper si la volée est en cours, sinon il annule la dernière volée **enregistrée** (même si
elle avait gagné un leg).
- ~~**Le mode rapide fabrique des fléchettes synthétiques** (`composeVisit`)~~ et ~~**sur une
sortie, l'app demande le nombre de fléchettes utilisées**~~ — **caduc** : le mode rapide a été
retiré du projet (voir § Décisions structurantes). Ce qu'il faut en retenir, parce que la
technique resservira : les 9 totaux impossibles en 3 fléchettes (179, 178, 176, 175, 173, 172,
169, 166, 163) n'étaient **jamais codés en dur** — ils tombaient tout seuls de la même
recherche que les checkouts, qui rendait `null` sur un total hors d'atteinte.
- **`Services.devices`** (`screenLock`, `haptics`, `preferences`) est une **exception assumée**
à la règle « UI → use cases uniquement » : ce sont des ports *driven* consommés par la coquille
UI. Ils ne portent aucune règle métier, les emballer dans des use cases serait de la cérémonie.
- **Le Wake Lock se ré-acquiert sur `visibilitychange`** : le navigateur relâche le verrou dès
que l'onglet passe en arrière-plan. Sans cette reprise, l'écran se rendort dès qu'on a répondu
à un message pendant la partie.
- **Accessibilité** : les scores et la volée en cours sont des `<output>`, pas des `<p>` —
`aria-label` n'est pas supporté sur un paragraphe (Biome le refuse, à juste titre).

### Décisions de la refonte visuelle (lot 3 bis)

La charte était écrite mais quasiment pas exécutée (`.cadre-bois` n'existait pas, aucun des
composants annoncés non plus, zéro animation, zéro icône). Refonte de `src/index.css` et de
tout `src/ui/` — **aucun test modifié, les 100 tests restent verts**, ce qui valide au passage
que la refonte n'a touché à aucun comportement.

- **On pousse la charte « pub anglais », on ne la remplace pas.** Décision de l'utilisateur :
le problème n'était pas la direction mais son absence d'exécution. Matière, relief, biseaux
et mouvement partout sur le chrome ; les chiffres du tableau restent en craie sur feutre.
- **Le mouvement est généreux mais ciblé**, et `prefers-reduced-motion` coupe tout. ⚠️ Le bloc
`@media (prefers-reduced-motion)` est **volontairement hors de toute `@layer`** : le CSS sans
couche l'emporte sur n'importe quelle couche, donc il neutralise les `animate-*` de Tailwind
(couche `utilities`) **sans un seul `!important`** — que Biome refuse par ailleurs.
- **La cible est dessinée en SVG génératif** (`Cible`), à partir de l'ordre officiel des 20
secteurs et des rayons d'un plateau réel. Zéro image, donc zéro octet de plus au précache, et
net à toutes les tailles. Toujours `aria-hidden` : elle est décorative.
- **La couleur de joueur est dérivée de son `PlayerId`** (`src/ui/couleurs.ts`, hash + palette
de 8 teintes). C'est **provisoire et purement UI** : le jour où `Player` porte une couleur
choisie (lot 4), il n'y a qu'à la préférer à cet endroit. Le domaine n'a pas bougé.
- **Le pavé affiche la valeur réelle de la touche dès qu'on quitte le simple** (le « 20 »
porte un « 60 » en exposant en mode triple). C'est la faute de saisie n° 1, et le badge est
`aria-hidden` — le nom accessible du bouton reste « 20 », donc les tests aussi.
- **L'écran de match a enfin un en-tête** : leg/set en cours, score de départ, format
(« premier à N »), badges DI/DO, et surtout un **bouton retour** — il n'existait aucun moyen
de quitter une partie en cours.
- ~~**Le mode rapide projette le reste avant validation**~~ — **caduc**, le mode a été retiré.
- **Les icônes sont toujours `aria-hidden`.** Sans ça elles entreraient dans le nom accessible
des boutons (« ↶ Annuler » au lieu de « Annuler ») et casseraient les requêtes par rôle.
- **Un `<h2>` de panneau ne doit jamais reprendre un nom déjà porté par un `<h1>`** : dans le
résumé, la carte de stats d'un joueur utilise `Panneau enTete=` (contenu libre) et non
`titre=`, sinon `getByRole('heading', { name: 'Kevin' })` trouve deux éléments.
- **Décision ouverte n° 1 tranchée** : **Alfa Slab One est conservée**, mais cantonnée à
l'enseigne (« Dartpéro », nom du vainqueur). Tout le reste — titres de panneaux, libellés,
chiffres — est en Oswald. Vue sur pièce, la Alfa Slab ne tient que sur 2 ou 3 mots.

### Écran de match, seconde passe — d'après une app de référence

Quatre idées reprises à une app Android de comptage (captures fournies par l'utilisateur),
retenues pour leur ergonomie, **pas** pour leur esthétique (Material vert sur blanc, franglais :
écartés). Décisions tranchées par l'utilisateur.

- **Une ligne par joueur, dans tous les cas** — pas de grille, pas de disposition alternative
au-delà de 2 joueurs. Une grille 2 colonnes s'étrangle à 4 joueurs ; la ligne encaisse. Le
coût assumé est un score plus petit à 2 joueurs, compensé par l'**échelle** qui respire selon
le nombre de joueurs — une seule règle de layout, pas deux composants.
- **Chaque joueur affiche en permanence sa dernière volée détaillée et son total** (`T20 20 ·`
puis `80`). C'est la question qui revient le plus autour d'une cible — « t'as mis quoi, là ? ».
La volée montrée est celle **en cours** dès la première fléchette plantée, la **dernière
enregistrée** sinon : sans cette bascule, un bust en solo ne serait jamais annoncé, la main ne
passant à personne.
- **Le bandeau « ce qui vient de se passer » a disparu** : chaque ligne porte déjà l'info.
Seul le **bust** garde un signal fort — la ligne passe au rouge, ses fléchettes sont barrées,
elle encaisse la secousse. C'est le seul cas où l'app doit annoncer que des points ont été
retirés.
- **Il n'y a plus de touche « Bull » : le bullseye, c'est `DOUBLE` + `25`** — ce que dit la
règle. Ça supprime une exception du pavé. En `TRIPLE` la touche 25 se **grise** plutôt que de
refuser le coup après l'avoir accepté : il n'existe pas de triple bull.
⚠️ Cette touche vise le segment `BULL`, pas le nombre 25 (`Dart.of('BULL', multiplicateur)`).
Le badge affiche toujours `BULL`, pas `D25` : `Dart.label` vit dans le domaine et un test le
couvre — on ne modifie pas le cœur pour une préférence d'affichage.
- **Les modificateurs et « Annuler » sont passés EN BAS**, dans le pavé lui-même. Le haut de
l'écran est la zone la plus difficile à atteindre au pouce ; y placer la bascule S/D/T, qu'on
actionne des dizaines de fois par partie, était une erreur. La rangée du pouce est **identique
dans les deux modes de saisie**.
- ⚠️ **La bascule S/D/T n'est plus persistante : elle retombe sur Simple après chaque
fléchette.** Décision de l'utilisateur, qui **renverse** celle du cadrage initial. Un
multiplicateur qui reste armé sans qu'on le voie est la faute n° 1 — trois T20 comptés là où
il y avait trois simples, et il faut ensuite retrouver *où* le score a dérapé. Un clic de plus
par triple coûte moins cher qu'un score faux. La remise à zéro vit dans **`useMatch`**, pas
dans le pavé, pour tenir quelle que soit la façon de saisir ; le curseur de laiton qui revient
tout seul rend la chose visible plutôt que silencieuse.
- Côté tests, `tests/ui/gestes.ts` expose `flechette(utilisateur, cible, multiplicateur?)` :
les tests re-sélectionnent le triple à chaque fléchette, comme un vrai joueur.
- **La touche `0` ignore le multiplicateur** : une fléchette manquée n'a ni double ni triple
(`Dart.of('MISS', 'DOUBLE')` lève une `DomainError`).
- **Le total de la volée en cours se déduit de `remaining - resteAffiche`**, jamais d'une somme
recalculée dans l'UI : le reste projeté vient déjà du port `PreviewVisit`, donc aucune règle
n'est réimplémentée côté écran.
- **Retenu pour le lot 4** : barre de navigation basse (Début / Joueurs / Statistiques /
Historique / Réglages), historique avec statut *en cours* / *terminée*, et surtout des stats
en **tableau comparatif classé** plutôt qu'en cartes empilées — vaut aussi pour l'écran de
résumé, où comparer quatre panneaux superposés est pénible.

### Décisions du lot 4 (profils, historique, stats, sauvegarde)

- **La couleur d'un profil est une teinte *symbolique*, pas un hex.** `PlayerColor` est un
ensemble **fermé** de 8 noms (`brique`, `sapin`, `lagon`…) dans le domaine ; la traduction en
pixels vit dans `src/ui/couleurs.ts`, et **là seulement**. Changer la charte ne touche donc
aucune donnée persistée. Ensemble fermé volontairement : avec un sélecteur libre, deux joueurs
choisissent deux bleus voisins qu'on ne distingue plus à 3 mètres.
- **Sans couleur choisie, on prend la première libre** : créer quatre joueurs d'affilée donne
quatre couleurs distinctes sans rien demander — « zéro friction au démarrage ».
- **`Player` porte `createdAt`, qui vient du port `Clock`.** Jamais `Date.now()` : le domaine
reste déterministe.
- ⚠️ **Migration Dexie v1 → v2, et son test.** Les profils déjà en base n'ont ni couleur ni
date ; sans migration `Player.create` les refuse à la lecture et l'utilisateur ouvre l'app mise
à jour pour découvrir qu'il n'a plus personne. La migration leur distribue une couleur en
tourniquet. `tests/infrastructure/dexieRepositories.test.ts` ouvre une **vraie base v1** puis la
relit en v2 — c'est le genre de bug qui ne se voit qu'en production.
- **`ManagePlayers.rename` est devenu `update(id, { name?, color? })`** (ISP : un seul point
d'édition partielle). `createdAt` n'est jamais modifiable : c'est l'ancienneté, pas la dernière
retouche.
- ⚠️ **Les moyennes de carrière se recalculent depuis les totaux bruts, jamais en moyennant des
moyennes** — faux dès que les parties n'ont pas la même longueur, et elles n'en ont jamais.
C'est pourquoi `PlayerStats` expose désormais `first9Points` / `first9Darts` : sans les données
brutes, l'agrégation serait condamnée à être fausse. `legsWon` (tout le match) s'ajoute à
`legsWonInSet` (le set en cours).
- **Une partie en cours compte dans les statistiques.** Ses fléchettes ont été lancées ;
attendre la fin d'un leg pour voir sa moyenne bouger serait frustrant. Seul `matchesWon`
distingue les parties terminées.
- **L'import JSON fusionne, il ne remplace jamais** : un identifiant connu est écrasé, un
inconnu s'ajoute, rien n'est effacé. Se tromper de fichier ne doit pas coûter une soirée de
parties.
- **Une entrée illisible est comptée puis ignorée**, pas propagée en exception : un fichier à
moitié abîmé restaure quand même les cinquante parties saines. Les compteurs remontent dans
`ImportReport` pour que l'UI le dise franchement.
- **La validation de l'import passe par les fabriques du domaine** (`Dart.of`,
`X01Config.create`, `PlayerColor.of`…). `backupSchema.ts` ne réécrit aucune règle, il traduit :
un triple bull dans un fichier trafiqué est refusé par la même ligne de code que dans une
partie.
- **Lire et écrire un fichier reste dans l'UI, ce n'est pas un port.** `ManageBackup` ne
manipule que des objets JavaScript — donc il est testable sans navigateur. Le `Blob`, le
`URL.createObjectURL` et l'`<input type="file">` sont du DOM, au même titre qu'un `<input>` de
formulaire, et vivent dans `ReglagesEcran`.
- **La barre de navigation n'apparaît pas pendant une partie** (ni sur l'écran de
configuration) : chaque pixel sert à jouer, et un onglet mal visé en pleine volée ferait perdre
la saisie en cours. Elle est posée par un `LayoutPrincipal` sur les routes concernées.
- **Chaque tableau de statistiques a son propre classement**, sur sa première colonne : on ne
consulte pas ses stats entre potes, on regarde qui est devant — et le meilleur aux 180 n'est
pas forcément celui qui finit le mieux. Le **meilleur leg** est le seul classement où *petit*
vaut mieux que *grand*, et un joueur sans leg gagné n'a **pas** « 0 fléchette » : il n'a rien,
sinon il serait premier.
- **Suppression en deux temps** (profil comme partie) : un premier appui demande confirmation,
un second agit. Pas de fenêtre modale, mais rien ne s'efface d'un doigt qui glisse. Supprimer
un profil ne supprime pas ses parties — elles affichent « Joueur supprimé », comme décidé au
lot 2.


*(La couture `GameMode` — comment ajouter un mode de jeu — a été déplacée dans
[.claude/CONVENTIONS.md](../.claude/CONVENTIONS.md) § 13, aux côtés des autres patterns de
code.)*

---

### Nommage : un mode se nomme, toujours (réagencement post-lot 5a)

Tant que X01 était le seul jeu, ses types s'appelaient `Match*` — et le Tour du monde arrivé,
`MatchStarted` voulait en réalité dire « X01 démarré » pendant que le nouveau venu annonçait
clairement la couleur. Le plus ancien était le plus mal nommé. Corrigé en un commit dédié,
juste après le lot 5a.

- **Ce qui a été renommé** : ce qui décrit l'**état et les règles d'un mode**.
`MatchState` → `X01State`, `PlayerMatchState` → `X01PlayerState`, `MatchStats` → `X01Stats`,
`PlayerStats` → `X01PlayerStats`, `MatchMilestone` → `X01Milestone`, `MatchStarted` →
`X01Started`, `computeMatchStats` → `computeX01Stats`. Côté écrans : `MatchEcran` →
`X01Ecran`, `ResumeEcran` → `ResumeX01Ecran`, `useMatch` → `useX01`.
- **Ce qui NE devait PAS l'être** : `MatchId`, `MatchRecord`, `MatchRepository`,
`MatchSummary`, `MatchEvent`. Ceux-là désignent bien **une partie, tous modes confondus**.
Tout ce qui s'appelle `Match` n'est pas fautif — seul l'est ce qui prétend être générique en
ne parlant que du X01.
- ⚠️ **`X01Started.type` vaut toujours `'MatchStarted'`.** Cette chaîne est une **donnée
persistée**, présente dans IndexedDB et dans les sauvegardes JSON déjà exportées : la
renommer invaliderait toutes les parties antérieures. On corrige le nom du **type**, jamais
la valeur sur le disque. Si un jour ça gêne vraiment, il faudra une migration — pas un
rechercher-remplacer.
- **Deux gardes ajoutées au test d'architecture** : un mode n'importe jamais un autre mode
(ni côté domaine, ni côté composants). Seul `games/index.ts` les connaît tous, c'est son rôle.
Ce qui est réellement partagé descend dans `commun/`.
- **Reste à faire, si l'asymétrie regêne** : les *ports* X01 gardent des noms génériques
(`StartMatch`, `RecordVisit`, `GetMatchState`…) face à `PlayTourDuMonde`. Leurs **types de
retour** disent désormais `X01State`, ce qui lève l'ambiguïté à la lecture ; renommer les
ports eux-mêmes serait le prolongement naturel mais n'était pas dans le périmètre.

### Décisions du lot 5b (entraînement au checkout, annonce vocale)

**Le troisième mode a coûté ce qui était annoncé** : un dossier `games/checkout-practice/`,
un événement d'ouverture, trois lignes dans chaque aiguillage. La couture tient.

- **L'entraînement est un mode de jeu, pas une catégorie à part.** Une session solo passe par
`MatchRepository`, apparaît dans l'historique, se supprime et se sauvegarde comme le reste.
Un exercice, c'est une partie à un joueur — lui inventer un dépôt séparé aurait dupliqué la
moitié du lot 4 pour rien.
- ⚠️ **La cible tirée est ÉCRITE dans le journal** (`RoundStarted`), jamais retirée au rejeu.
L'aléa vient du port `RandomSource`, consulté une seule fois quand la manche s'ouvre. Sans ça,
annuler une volée redistribuerait les cartes — et deviendrait un moyen de retomber sur un
reste plus facile. Testé des deux côtés.
- **Les restes jouables sont calculés, pas tabulés** : on garde ceux qu'une route de trois
fléchettes peut clore, donc les bogey numbers s'excluent tout seuls. Même principe qu'au lot 3
pour les totaux impossibles du mode rapide — aucune liste codée en dur à maintenir.
- ⚠️ **`resolveVisit` et `checkout` sont devenus TRANSVERSES** (`domain/services/`), parce que
la garde d'architecture du réagencement interdit à un mode d'en importer un autre — à juste
titre. L'entraînement juge donc une manche avec **exactement la même fonction** que le X01 :
une divergence sur la règle de bust serait le pire bug possible, invisible jusqu'à ce qu'un
joueur perde une partie dessus. Leurs signatures ne dépendent plus que de
`{ doubleIn, doubleOut }`, pas d'un `X01Config` complet.
- **L'annonce vocale reçoit du texte déjà en français.** Le cœur ne fabrique aucun libellé
(décision du lot 2) : `labels.ts` compose la phrase, l'adapter la prononce. ⚠️ Les nombres
partent **en chiffres** (« 180 ») — la voix française les lit correctement, alors qu'écrire
« cent quatre-vingts » ferait buter les voix qui épellent.
- **La préférence de voix est relue à chaque annonce**, pas capturée au montage : sinon la
couper depuis les réglages n'aurait d'effet qu'à la partie suivante.
- **Un bouton « Essayer la voix » dans les réglages** : toutes les voix françaises ne sont pas
installées partout, et mieux vaut découvrir le silence là qu'en pleine partie.
- **`ui/ecrans/games/{x01,tour-du-monde,checkout-practice}/`** — les écrans suivent le même
découpage que le domaine et les composants. Les noms de dossiers reprennent ceux du domaine
(anglais) plutôt que d'être francisés : c'est la correspondance immédiate qui compte, et le
`CLAUDE.md` réserve le français aux libellés, pas aux identifiants techniques.
- **Le pavé de saisie est celui du X01** — à l'époque avec `rapide`/`onRapide` rendus
optionnels, puisqu'une manche d'entraînement dure une seule volée. Ces deux props ont depuis
disparu avec le mode rapide : le pavé n'a plus qu'une forme, pour les quatre modes.

### Décisions du lot 5c (Cricket, mode paysage)

**Le quatrième mode a coûté le même prix que le troisième** : un dossier `games/cricket/`, un
événement d'ouverture, trois lignes dans chaque aiguillage. La couture tient toujours.

- ⚠️ **Le Cricket a demandé DEUX ports, pas un** : `PlayCricket` et **`PreviewCricketVisit`**.
C'est le premier mode où la partie peut se gagner **sur la deuxième fléchette d'une volée** ;
sans un port de prévisualisation synchrone, l'écran attendrait une troisième fléchette qui ne
viendra jamais avant d'annoncer le vainqueur. Même raison qu'au lot 3 pour `PreviewVisit`, et
même règle : l'UI ne réimplémente jamais les règles, elle les interroge.
- ⚠️ **La victoire est vérifiée pour TOUS les joueurs à la fin d'une volée**, pas seulement
pour le lanceur. C'est le cas tordu du cut-throat : un joueur qui a tout fermé ne reçoit plus
de points, tandis que ceux des autres montent — il peut donc devenir le plus bas **pendant le
tour de quelqu'un d'autre**. Sans cette vérification, la partie continuerait alors qu'elle est
gagnée, et personne ne comprendrait pourquoi.
- **Les marques sont posées une par une**, pas trois d'un coup : un triple peut à la fois
finir de fermer une cible **et** marquer des points avec ce qui dépasse. Compter le triple en
bloc perdrait ce reliquat.
- **Le pavé du Cricket n'a que les sept cibles**, plus `0` et `Annuler`. Afficher les vingt
secteurs alors que dix-neuf d'entre eux ne valent rien serait un piège. La bascule S/D/T y
est en revanche essentielle — c'est elle qui dit combien de marques la fléchette pose — et
elle **retombe sur Simple** après chaque fléchette, comme au X01.
- **La variante se choisit à la création de partie** (standard / cut-throat) et vit dans la
config, donc dans le journal : une partie ancienne se rejoue avec la variante sous laquelle
elle a été jouée.
- **Les statistiques de carrière restent au X01**, comme pour le Tour du monde : la moyenne 3
fléchettes n'a pas de sens quand dix-neuf secteurs sur vingt valent zéro.

**Le mode paysage n'est pas un écran de plus, c'est une bascule de disposition.**

- **`DispositionPartie` porte l'ossature des quatre écrans de jeu** (bandeau, zone lecture,
zone saisie). Elle vivait recopiée dans chaque mode ; c'est le paysage qui a imposé de la
remonter — quatre copies d'une disposition, c'est trois occasions de l'oublier.
- ⚠️ **La bascule dépend de la HAUTEUR autant que de l'orientation** :
`@custom-variant paysage (@media (orientation: landscape) and (max-height: 34rem))`. Ce qui
manque au téléphone couché, c'est la hauteur, pas la largeur — une tablette en paysage a la
place de garder la disposition normale, et un navigateur de bureau aussi. Écrire la condition
sur la seule orientation aurait cassé l'affichage partout ailleurs.
- **Pas de bouton de rotation, pas de préférence** : l'app suit le téléphone. Un réglage de
plus à trouver pour une chose que le geste dit déjà serait de la friction — et le cadrage dit
« zéro friction ».
- **`orientation: 'any'` dans le manifeste PWA** (elle valait `'portrait'`) : sans ça, l'app
installée resterait bloquée en portrait et la bascule ne servirait à rien sur le seul mode
d'usage qui compte.
- **Les pavés se compactent en paysage** (`paysage:` sur les hauteurs et les tailles de
texte), mais **les cibles restent ≥ 48 px** : c'est un plancher, pas une variable
d'ajustement. (Le pavé du mode rapide était le seul à pouvoir encore demander un défilement —
il n'existe plus, plus aucun pavé ne défile.)
- **Aucun test n'a changé** en remontant les quatre écrans dans `DispositionPartie`, ce qui
valide au passage que la refonte n'a touché à aucun comportement.

**Deux bugs antérieurs découverts en chemin**, tous deux invisibles tant qu'on ne sortait pas
du X01 — la leçon : *ce qui aiguille sur le mode doit tout aiguiller*.

- **`backupSchema` ne validait que `MatchStarted` et `VisitRecorded`** : une sauvegarde JSON
perdait silencieusement les parties de Tour du monde et d'entraînement à la réimportation.
Le test de sauvegarde exporte désormais **une partie de chaque mode**, puis les relit.
- **`GetOngoingMatchUseCase` projetait avec `X01Rules`** au lieu de la couture : l'accueil ne
proposait jamais de reprendre une partie qui n'était pas un X01.

### Décisions du lot visuel (piste E, « la feuille de match »)

Trois pistes avaient été proposées (« La Cible », « La Feuille de match », « Le Boîtier »).
L'utilisateur a tranché pour **E**, la plus sobre et la plus lisible — celle qui remplace le
décor par de la **structure**.

- ⚠️ **L'angle vif a un point de contrôle unique** : les tokens `--radius-*` à 0 dans
`@theme`. Les classes `rounded-*` ont été retirées de `src/ui` par-dessus, pour qu'on ne lise
pas dans le code une intention que le CSS annule. Les deux ensemble, pas l'un ou l'autre.
- **Le tableau est un vrai tableau** : une ligne d'en-têtes (`Joueur` / `Volée` / `Reste`) en
inversion craie, puis une ligne par joueur sur la même grille. `GRILLE_LIGNE` est exportée par
`LigneJoueur` et consommée par `Tableau` — une seule définition de colonnes, donc aucun
désalignement possible entre l'en-tête et les lignes.
- ⚠️ **Le halo qui respire est mort, remplacé par `.au-lancer`** : un filet de laiton dans la
marge et un voile. Une fiche ne rayonne pas, et un `box-shadow` animé en continu coûte un
repaint par image sur un vieux téléphone. Les quatre modes ont suivi.
- **Les legs se comptent en bâtons** (`Batons`), quatre traits barrés par un cinquième. Volé à
la piste B, comme annoncé : à trois mètres l'œil reconnaît un paquet de cinq sans compter, là
où il devait dénombrer des losanges.
- **Les fléchettes sont écrites sur une ligne** (`.ligne-saisie`), comme sur une feuille qu'on
remplirait au stylo — et non dans des pastilles. Les trois emplacements restent toujours
présents : c'est ce qui garde l'alignement d'une ligne à l'autre.
- **La suggestion de sortie est devenue la dernière ligne de la feuille**, filet vert et
cibles alignées sous les colonnes de fléchettes. Elle ne flotte plus au-dessus du tableau.
- **La touche s'inverse à l'appui** (craie pleine, texte sombre) au lieu de s'enfoncer dans un
dégradé : c'est le signal le plus fort possible, et il ne coûte pas un pixel de relief.
- **`StatTile` réserve deux lignes au libellé.** Sans cette hauteur fixe, « Plus haut
checkout » repoussait son chiffre bien plus bas que celui de « 180 » et la rangée cessait
d'être comparable — or on ne la lit que pour comparer.
- **L'accueil devient la feuille du soir** : une liste numérotée des joueurs plutôt que des
pastilles superposées. La cible qui tourne recule à 12 % d'opacité — sur une fiche, le décor
ne concurrence pas le nom.
- **Vérifié à l'écran.** Le lot a été relu sur captures (Chrome piloté par `playwright-core`,
390 × 844) et non seulement au vert des tests : trois défauts n'auraient pas été vus autrement
— la feuille qui flottait en haut d'une zone vide, l'ordre affiché qui contredisait les
numéros d'ordre de passage, et deux touches restées bordées de vert et de marron.

⚠️ **Incident à connaître** : le commit `61b60ac` (mise à jour de dépendances, hors lot) a
**supprimé `PaveRapide.tsx`**, le bloc ⚡ de `PaveFlechettes` et la ligne de test qui les
couvrait — laissant deux tests rouges. Il a été restauré depuis `cc8faf7`. À surveiller si
d'autres commits « de dépendances » touchent `src/ui`.
**Épilogue** : le mode rapide a finalement été retiré **volontairement** par l'utilisateur
(lot « saisie unique »), après l'avoir gardé plusieurs parties sans jamais s'en servir. Ne
pas confondre les deux disparitions : la première était un accident, la seconde un verdict
d'usage.

### Décisions du lot UX (l'usage avant la peinture)

Cinq frictions relevées **dans le code**, pas d'impression : trois d'entre elles ne faisaient
que brancher des choses déjà écrites et jamais appelées.

- ⚠️ **`annonceTour` (« À toi, Julien ») existait depuis le lot 5b et n'était appelée nulle
part.** La voix disait « 80 » sans dire pour qui ni à qui c'était le tour — alors que le
téléphone est posé à deux mètres du lanceur et que la voix est le seul canal qui porte
jusque-là. Corrigé pour les trois modes de groupe.
- ⚠️ **Une seule phrase par volée, jamais deux appels.** `SpeechAnnouncer.say` commence par
`speechSynthesis.cancel()` (une annonce en retard vaut moins que le silence) : dire le score
puis le tour ferait taire le score. D'où `annonceFinDeVolee(resultat, prochain)`, qui compose
« 180. À toi, Julien » en un énoncé. `resultat` peut être `null` — une volée blanche au
Cricket ne se commente pas, mais elle passe quand même la main, et **ça**, il faut le dire.
- **On n'appelle personne en fin de partie ni en solo** : `prochainJoueur` rend `null`. Le
helper vit dans `ui/hooks/tourDeTable.ts` et son paramètre est **structurel**, pas l'union des
états : importer les trois modes ferait de lui un endroit qui les connaît tous, rôle réservé
à la couture `GameModes`.
- ⚠️ **`RestartMatch` rappelle les lancements existants, il ne recopie PAS l'événement
d'ouverture** dans un journal neuf. C'est la seule façon qu'une relance passe par exactement
les mêmes contrôles qu'un premier départ : profil supprimé entre-temps, validation des règles,
et le tirage d'une nouvelle cible en entraînement. Recopier l'ouverture aurait dupliqué ces
trois décisions, donc créé trois occasions de diverger. Le use case est donc un **composeur** :
ses dépendances sont les quatre ports de lancement, injectés par le composition root.
- **Corollaire assumé** : un entraînement relancé **retire ses cibles**. On refait le même
exercice, pas la même série — rejouer des restes qu'on connaît déjà n'entraînerait personne.
- **`ActionsFinDePartie` sert les quatre résumés.** « On remet ça » passe en action principale,
« Changer les règles » en secondaire, « Accueil » en discret. Avant, la seule action offerte
renvoyait sur un formulaire **remis à zéro** : une dizaine de taps entre deux parties, alors
qu'on en enchaîne quatre ou cinq par soirée.
- **Les réglages de partie passent par le port `Preferences`**, qui servait déjà à la voix.
⚠️ La sélection de joueurs mémorisée est **dérivée et filtrée** sur les profils
qui existent encore, jamais stockée en état : un profil supprimé depuis resterait sinon coché
en fantôme et ferait échouer le lancement sur un joueur inconnu.
- **L'ordre de passage était déjà l'ordre des taps** — il fallait tout décocher pour
intervertir deux joueurs. Deux chevrons de **48 px** (le plancher tactile, pas une variable
d'ajustement) et une ligne qui nomme celui qui commence.
- ⚠️ **Le bouton « Annuler » a deux étiquettes, pas une.** Une touche fait une demi-largeur
d'écran : « Annuler la volée de Julien » n'y tient pas. `libelleAnnulation` rend donc un
`{ court, complet }` — le court s'affiche, le complet est le nom accessible. Comme le court
est contenu mot pour mot dans le complet, la règle « label in name » (WCAG 2.5.3) tient. Ce
qui lève l'ambiguïté, c'est le **changement visible** : « Annuler T20 » dès qu'une fléchette
est plantée, « Annuler » tout court signifiant désormais « la dernière volée ».
- **L'auteur de la dernière volée se lit sur `Visit.playerId`**, dans la projection. L'UI ne
rejoue aucune règle pour savoir à qui était le tour d'avant.
- **Écarté du lot** : la touche T20 dédiée. Proposée puis retirée par l'utilisateur — la
bascule momentanée reste le seul chemin vers un triple.

~~⚠️ **`npm run lint` est rouge sur ~20 fichiers pour cause de CRLF**~~ — **réglé depuis** :
`biome check .` passe sur les 181 fichiers. Il n'y a toujours **pas de `.gitattributes`** :
si des CRLF reviennent après un clone frais sous Windows (`core.autocrlf`), c'est là qu'il
faudra les arrêter (`* text eol=lf`), suivi d'un `biome check --write` dans un commit dédié.

- **`npm audit`** : 1 vulnérabilité « high » sur **nanoid < 3.3.18**
(*boucle infinie sur une taille nulle*, GHSA-2v37-7h3g-55p8), tirée par
`vite → postcss → nanoid`. **Hors du bundle client** : postcss ne tourne qu'à la
construction, et rien dans `src/` n'appelle nanoid. `npm audit fix` la règle si l'on veut le
rapport vert. ⚠️ L'ancienne alerte **react-router** (*RSC Mode CSRF Bypass*,
GHSA-qwww-vcr4-c8h2) **n'a plus lieu d'être** : elle visait la plage 7.12→8.2, et le projet est
en **8.3**. Elle ne concernait de toute façon que le mode RSC, que cette SPA n'utilise pas.

---

### Décisions du lot « ce qu'on regarde après la partie »

Deux idées prises à une app du Play Store (captures fournies par l'utilisateur, **hors
dépôt** — `docs/exemples/` est ignoré), et **seulement
deux** : le reste de cette app a été écarté explicitement — « Sauver / Ne sauvez pas » en fin
de partie, l'annulation posée sur l'écran de résumé, un pavé à sept colonnes sous le plancher
des 48 px, et un « Double % » qui mesure la longueur du leg plutôt que l'adresse.

**La carte des impacts** — la seule statistique du projet qui mesure le bras.

- ⚠️ **`dartboardHits` est TRANSVERSE** (`domain/services/`), comme `visitOutcome` et
`checkout` : une fléchette dans le triple 20 est le même geste qu'on décompte un 501 ou qu'on
ferme une cible. Le service ne connaît donc **aucun mode**, seulement des fléchettes — c'est
ce qui lui permet de vivre là sans qu'un mode ait à en importer un autre.
- **Mais le cumul reste au X01**, comme le reste de l'écran. Ce n'est pas une hésitation :
mélanger un Tour du monde à la carte montrerait **l'itinéraire imposé** (20, puis 19, puis
18…) et non la visée. Le service est transverse, son alimentation ne l'est pas encore ; le
jour où l'écran gagnera un filtre de mode, il n'y aura rien à réécrire.
- ~~**La carte voyage dans `PlayerCareer`**~~ — **déplacée depuis** : elle vit dans
`X01PlayerStats`, donc dans les stats **d'un match**, et la carrière additionne les cartes de
chaque partie (`DartboardHits.merge`). C'est le résumé de partie qui l'a exigé (lot suivant),
et c'est mieux ainsi : une seule façon de compter, donc aucune chance que le résumé d'une
soirée et le cumul de carrière se contredisent. Le use case des statistiques y a perdu la
collecte de fléchettes qu'il faisait à la main.
- ⚠️ **L'attribution des fléchettes passe par la projection, jamais par le journal.**
`VisitRecorded` ne porte pas de `playerId` (décision du lot 1) : c'est `state.history` qui
dit à qui était la volée. Un test le vérifie explicitement, parce que c'est exactement le
genre de raccourci qu'on serait tenté de prendre.
- **Une fléchette qui fait bust compte dans la carte** : elle a bien touché le plateau. Même
convention que la moyenne 3 fléchettes, et pour la même raison.
- ⚠️ **Ce n'est PAS la `Cible` décorative avec un calque par-dessus.** Sur un plateau déjà
rouge, vert, crème et noir, une couche de chaleur ne se lit pas — on ne sait plus si le rouge
est la cible ou la donnée. Le plateau est donc réduit à sa **structure** (des cases, des fils,
vingt numéros) et la seule couleur de l'image est la donnée. C'est la feuille de match
appliquée à un graphique. Un dégradé d'opacité piloté par les données n'est pas le « zéro
dégradé » de la charte : c'est de la donnée, pas du décor.
- **L'échelle est relative à chaque joueur** : la case la plus touchée est toujours à fond. On
compare des **formes** (« je dérive vers le 5 »), pas des volumes — le volume se lit dans le
tableau des moyennes, à sa place.
- **À égalité, la case qui vaut le plus passe devant** dans le classement des cases. Sans ce
départage, trois cases à trois touches s'annonçaient « S2, S3, S7 » : l'ordre de rangement du
plateau, pas un résultat.

**Le filtre de période** — « qui est chaud ce soir » plutôt que « qui est bon depuis toujours ».

- **Le port prend un identifiant, pas une date** (`TODAY` / `LAST_7_DAYS` / `LAST_30_DAYS` /
`ALL_TIME`), et c'est le **use case** qui le résout avec le port `Clock`. Faire calculer la
borne par l'UI aurait remis un `Date.now()` dans l'application et rendu le filtre intestable.
- ⚠️ **`Date` est utilisée dans le use case comme CALENDRIER, jamais comme horloge.** L'instant
courant vient de `Clock` ; `Date` ne sert qu'à savoir où tombe **minuit local**, ce qu'aucune
arithmétique en millisecondes ne sait faire (une journée fait 23 ou 25 heures deux fois par
an, et `setDate` gère ce décalage tout seul). Les tests construisent leurs bornes en heure
locale pour la même raison : écrites en UTC, ils dépendraient du fuseau de la machine.
- ⚠️ **Une partie appartient à la soirée où elle a COMMENCÉ** (`createdAt`), pas à celle où on
l'a touchée en dernier. Celle qu'on finit à 00h10 s'est bien jouée ce soir-là ; la couper en
deux ne rendrait service à personne. Testé.
- **« Tout » par défaut, jamais « Aujourd'hui ».** Un jour sans partie ouvrirait l'écran sur
du vide et l'app aurait l'air d'avoir tout perdu. La période n'est pas mémorisée non plus :
un « Aujourd'hui » retenu de la semaine dernière ferait exactement le même effet.
- ⚠️ **Deux écrans vides, pas un.** « Aucune partie au compteur » appelle à jouer ; « Rien sur
cette période » invite à élargir la fenêtre. Les confondre ferait croire à une base effacée —
c'est la pire chose que cet écran puisse dire. Testé des deux côtés.
- **La période fait partie de la `queryKey`** : chaque fenêtre garde son cache, revenir sur
« Tout » est instantané.

**Ce que la relecture à l'écran a rattrapé** (Chrome piloté par `playwright-core`, 390 × 844,
base semée directement dans IndexedDB — les tests étaient verts pendant ce temps) :

- le **« 20 » rogné en haut de chaque plateau** : les numéros vivent à 48,6 du centre, donc le
haut du glyphe sortait d'une `viewBox` calée à 100. Aucune requête par rôle ne dit qu'un
glyphe est coupé. Corrigé par une `viewBox` qui déborde de 4 unités. ⚠️ **`Cible` a le même
défaut latent** (`fontSize` 4,6 à 48,6) — invisible tant qu'elle reste à 12 % d'opacité sur
l'accueil, à corriger si elle sert un jour en grand ;
- **les cases chaudes fusionnaient en un disque doré** chez un joueur qui arrose : quinze
secteurs voisins à la même intensité, et plus ni secteur ni anneau distinguable. Les fils de
craie ne suffisent pas, ils s'effacent sous le laiton — chaque case allumée est donc **cernée
du fond**. C'est le traitement habituel d'une carte choroplèthe, et il ne coûte rien.

**Au passage** : `ChoixSegmente` (le rail à curseur de laiton) vivait recopié dans
`NouvellePartieEcran` ; il est remonté dans `commun/` avec une taille `sm`, plutôt que d'en
écrire une deuxième variante pour le filtre. Et `fakeServices` accepte désormais des
surcharges de dépendances — `SettableClock` était impossible à injecter sans ça, donc tout
filtre daté était intestable.

### Décisions du lot « les trois finitions »

Les trois idées mises de côté au lot précédent, reprises telles quelles.

**Le filtre de mode sur l'historique.**

- ⚠️ **Le filtre s'applique AVANT la coupe à `limit`, jamais après.** Chercher « les Cricket »
dans les vingt parties les plus récentes n'en rendrait aucune le soir où l'on vient
d'enchaîner vingt X01 : ce n'est plus un filtre, c'est une coïncidence. Testé explicitement.
- **Corollaire assumé** : filtrer coûte un `listAll()`, parce que le mode se lit sur le
**premier événement du journal** et qu'aucun index ne peut le connaître. Sans filtre on garde
donc le chemin court (`listRecent`), et le surcoût ne se paie que quand on filtre.
- **`'TOUS'` n'est pas un mode** : c'est l'absence de filtre, et il vit dans l'UI. Le port
prend un `GameModeId` ou rien — « rien » est déjà la façon de tout demander.
- ⚠️ **Deux écrans vides, encore** : « Rien au tableau » (base vide) et « Aucune partie de
Cricket » (filtre sans résultat). Même règle qu'aux statistiques, même raison.
- **Les libellés du rail sont courts** (`Monde`, `Solo`) parce que cinq cases sur 350 px font
70 px chacune — « Tour du monde » n'y entre pas. Le nom complet reste dans le sous-titre de
l'écran, qui dit « 1 partie · Entraînement » : le rail n'a qu'à être distinct, pas explicite.

**L'ordre de passage tiré au sort.**

- ⚠️ **Le tirage a lieu dans le USE CASE et son résultat est écrit dans l'événement
d'ouverture.** Mélanger côté UI aurait demandé un `Math.random()` dans l'écran, donc un
lancement intestable ; mélanger à la projection redistribuerait les joueurs **à chaque
annulation**. C'est exactement la règle des cibles d'entraînement du lot 5b : ce qui est tiré
est écrit, jamais rejoué. Testé sur l'annulation ET sur le rejeu à froid.
- **`shufflePlayers` fait un Fisher-Yates**, pas un tri sur clé aléatoire : la version qu'on
écrit d'instinct ne donne pas des permutations équiprobables.
- **Trois use cases sur quatre** reçoivent `RandomSource` : l'entraînement est solo, il n'y a
rien à rebattre.
- ⚠️ **« On remet ça » NE rebat PAS les cartes.** Le journal ne dit pas si l'ordre avait été
tiré ou choisi à la main — le redistribuer serait deviner. Et l'ordre qui vient de jouer est
un ordre que tout le monde a accepté.
- **Le tirage ne s'applique qu'à partir de deux joueurs**, mais **le réglage reste coché** :
le décocher tout seul parce qu'on vient de retirer un joueur ferait perdre une préférence
sans le dire.
- ⚠️ **Sous tirage, l'écran retire tout ce qui prétend connaître l'ordre** : les flèches de
réordonnancement, la ligne « X commence », et **les badges `n°1 / n°2`**. Ce dernier point
n'a été vu qu'à l'écran (voir plus bas) — c'était la même faute que les flèches, en beaucoup
plus discrète.

**`legsPlayed`, le dénominateur qui manquait.**

- ⚠️ **Legs TERMINÉS, pas commencés.** Un leg en cours n'est ni gagné ni perdu ; l'inclure
ferait plafonner tout le monde sous 100 % sans raison. La valeur est donc la même pour tous
les joueurs d'un match — c'est ce qui la rend comparable d'une ligne à l'autre.
- **Les legs ont leur propre tableau.** Les entasser dans « Palmarès » aurait fait cinq
colonnes chiffrées sur 358 px, donc un tableau qui défile — or on ne le lit que pour comparer
des lignes entre elles.
- **`matchWinPercent` et `legWinPercent` se calculent depuis les totaux bruts**, comme les
moyennes et pour la même raison : moyenner les pourcentages de chaque partie serait faux dès
qu'elles n'ont pas la même longueur.
- ⚠️ **Un tiret, jamais « 0 % », quand rien n'est terminé.** « 0 % » veut dire « il a tout
perdu » ; « rien » veut dire « on ne sait pas encore ». Les confondre est le genre de détail
qui fait douter de tout le tableau. Le premier jet du helper faisait exactement cette faute —
il déduisait le dénominateur de la valeur elle-même, donc un vrai 0 % s'affichait « — ».

**Ce que la relecture à l'écran a rattrapé** (mêmes conditions que le lot précédent) :

- **les badges `n°1 / n°2 / n°3` survivaient au tirage**, juste sous la ligne « tiré au sort
au lancement ». L'écran annonçait donc un ordre et son contraire. Remplacés par une coche —
« retenu », sans rien promettre sur la place. Un test le verrouille désormais ;
- **l'aide de la bascule était tronquée** (« pas la discus… ») : `Bascule` pose un `truncate`
sur sa ligne d'aide, et le texte était trop long. Raccourci plutôt que d'enlever le
`truncate`, qui protège les autres bascules.

### Décisions du lot « le résumé devient une feuille »

Une dette notée depuis le lot 4 : « des stats en tableau comparatif classé plutôt qu'en cartes
empilées — **vaut aussi pour l'écran de résumé**, où comparer quatre panneaux superposés est
pénible ». Elle est payée.

- ⚠️ **Le résumé N'A PAS repris la disposition de l'écran Statistiques, et c'est délibéré.**
Les deux écrans ont des formes de données **opposées** :
  - une **carrière**, c'est beaucoup de joueurs × peu de chiffres par thème → une ligne par
    joueur, plusieurs tableaux thématiques, chacun classé sur sa première colonne ;
  - un **match**, c'est 2 à 4 joueurs × dix chiffres → **transposé**, tout tient dans un seul
    panneau sans défilement, même à quatre joueurs.

  Copier littéralement l'écran Statistiques aurait donné trois tableaux de deux lignes sur un
  match en tête-à-tête : on aurait déplacé le défilement, pas supprimé.
- **Le prix assumé du transposé : il ne se classe pas.** On ne trie pas des colonnes. En
échange, **chaque ligne dore son meneur**, et l'œil compare une ligne de trois nombres sans
aide. `TableauJoueurs` coexiste donc avec le tableau comparatif de l'écran Statistiques sans
en être un doublon — ce sont deux formes pour deux formes de données.
- ⚠️ **À égalité, personne n'est mis en avant.** C'est le cas le plus fréquent d'un match entre
potes : « 180 » vaut zéro pour tout le monde, et dorer le premier de la liste lui inventerait
un exploit. La ligne « Fléchettes » n'a jamais de meneur non plus — en lancer davantage n'est
pas une performance, c'est souvent le contraire.
- **Le meneur d'une ligne n'est PAS le vainqueur du match**, et les deux se voient : la
couronne marque le vainqueur en en-tête de colonne, le laiton marque le meneur de chaque
ligne. « Julien a la meilleure moyenne mais Kevin a gagné » est exactement la conversation de
comptoir qu'on veut rendre lisible.
- **Le `TableauHonneur` reste.** L'écran Statistiques est un registre froid ; le résumé est le
moment où quelqu'un a gagné. Remplacer le podium par un tableau aurait rendu l'écran juste.
- **« Fléchettes » ferme la liste** au lieu d'être relégué en coin de panneau : c'est le
**dénominateur de la moyenne**, et 60 de moyenne sur 12 fléchettes ne vaut pas la même chose
que sur 90.

**La carte des impacts descend dans les stats de match.**

- ⚠️ **`X01PlayerStats.hits` remplace la collecte à la main** que faisait
`GetPlayerStatsUseCase`. La carrière additionne les cartes de chaque partie
(`DartboardHits.merge`) au lieu de relire toutes les fléchettes de la base. **Une seule façon
de compter**, donc aucune chance que le résumé d'une soirée et le cumul de carrière se
contredisent — le genre d'écart qu'on ne remarque qu'après avoir discuté une heure au
comptoir.
- **Elle a plus de sens par match que par carrière** : « t'as tapé où ce soir » est une vraie
question, alors que six mois de parties finissent par se ressembler.
- **`PanneauImpacts` sert les deux écrans**, avec une phrase d'aide différente — c'est la
fenêtre qui change, pas le geste observé.

**Les trois autres résumés n'ont pas bougé**, sur décision explicite : Tour du monde et Cricket
ont déjà un classement d'une ligne par joueur (le problème des panneaux empilés ne les
concerne pas), et l'entraînement est solo — il n'y a personne à comparer.

⚠️ **Un piège découvert en semant des données de test** : la main tourne toute seule à la
projection, donc écrire une volée de trop dans un journal **décale l'attribution de toutes les
suivantes**. C'est la contrepartie de « `VisitRecorded` ne porte pas de `playerId` » (lot 1) —
le journal ne peut pas être en désaccord avec les règles, mais un journal fabriqué à la main
doit respecter le tour de table à la volée près.

### Décisions du lot « le thème clair papier »

Un thème clair demandé après coup, sur une charte écrite pour le sombre. La question n'était
pas « est-ce faisable » mais « qu'est-ce qui va casser ».

- ⚠️ **Le thème clair ne modifie AUCUNE classe de `src/ui`.** Il redéfinit les **valeurs** des
tokens sous `html[data-theme="clair"]`, et rien d'autre. Ça marche parce que la palette est
employée en **paires de rôle constantes** — `feutre`/`ardoise` = surfaces, `craie` = texte,
`laiton` = accent : `bg-craie text-feutre` (l'inversion des en-têtes) reste une inversion quand
les deux valeurs se retournent. Vérifié dans le CSS compilé : Tailwind 4 émet bien
`.bg-feutre{background-color:var(--color-feutre)}`.
- **Le prix assumé** : sous thème clair, le token « feutre » vaut du papier et « craie » vaut de
l'encre. **Les noms disent la matière d'origine, les tokens portent le rôle.** L'alternative —
des tokens sémantiques `--color-fond` / `--color-texte` — voulait dire réécrire 43 fichiers
pour exactement le même rendu.
- ⚠️ **Le défaut est SOMBRE, pas « système ».** Le cadrage du projet est un garage mal éclairé,
téléphone en luminosité basse. Ouvrir la mise à jour sur un fond blanc parce que le téléphone
est en clair serait un changement que personne n'a demandé. Testé.
- ⚠️ **LE point critique : le laiton vif fait 1,84:1 sur du papier.** Le filet de `.au-lancer`,
qui dit *qui est en train de lancer*, serait devenu invisible — l'information la plus lue de
l'app. Le thème clair passe donc au **laiton foncé** (`#8a6d12`, 4,4:1), et **« clair » y veut
dire « plus lisible sur le fond », donc plus foncé** (`laiton-clair` = `#6b5209`, 6,6:1). C'est
le rôle qui s'inverse, pas la teinte. Même logique pour les quatre accents de mode.
- ⚠️ **Les accents de mode ont dû quitter `accents.ts` pour `index.css`.** Ils partent dans un
`style=` inline, qu'aucune règle CSS ne peut retourner : `ACCENTS_MODE` ne contient plus que
des `var(--accent-*)`, qui se résolvent au rendu, donc dans le bon thème.
- **`Preferences` suffisait, aucun port nouveau.** Lire `matchMedia` vit dans la coquille UI, au
même titre que le `<input type="file">` de l'écran Réglages (lot 4) : aucune règle de jeu.
- ⚠️ **Un script d'amorçage dans `index.html`, doublon assumé de `theme.ts`.** Sans lui, la page
s'afficherait en sombre le temps du montage de React puis basculerait — un flash à chaque
ouverture. Il doit tourner avant le bundle, donc il ne peut pas l'importer : la clé et les deux
teintes de barre doivent rester d'accord à la main.
- ⚠️ **La préférence est RELUE à chaque bascule du système, jamais capturée en état.** Sinon
l'écouteur posé par `App` alors que le réglage valait « Système » rappliquerait ce choix au
premier coucher de soleil, écrasant le « Clair » choisi entre-temps. Même règle que `useVoix`
depuis le lot 5b. Testé — c'est le test le plus utile du lot.
- **`appliquerTheme` est le seul endroit qui écrit `data-theme`** : deux écrivains finiraient
par se contredire au retour d'un écran.
- **Deux ombres, pas une.** `--teinte-relief` (le filet de 1 px de `.grave`) s'inverse — noir
sous de la craie, blanc sous de l'encre. `--ombre-plaque` (l'enseigne, le nom du vainqueur) ne
le peut **pas** : à 3 px sous du laiton foncé, du blanc ne fait pas une ombre, il fait un
contour, et le mot a l'air mal imprimé. Elle passe au brun de bois. Vu à l'écran seulement.
- ⚠️ **Le `theme_color` du manifeste PWA reste figé.** La balise `<meta>` suit le thème au
runtime, le manifeste non : une app **installée** garde sa barre système sombre. Limite du
format, pas un oubli.
- **Une garde d'architecture nouvelle** (`tests/architecture/themeBoundary.test.ts`) : aucune
couleur en dur dans `src/ui`, et le thème clair doit redéfinir **tous** les tokens du sombre.
C'est ce qui a coûté le lot — une trentaine de hex disséminés, invisibles au vert des tests.
Trois exceptions, toutes documentées : `couleurs.ts` (teintes symboliques posées sur leur
propre pastille), `Cible.tsx` (un vrai plateau : le rouge du double 20 ne s'éclaircit pas le
jour) et `theme.ts` (les deux teintes de barre, une par thème par définition).
- **`CarteImpacts` lit des `var()` dans ses attributs SVG** plutôt que des hex : les valeurs
sombres sont identiques au pixel près, donc le thème sombre n'a pas bougé d'un cheveu.

**Ce que la relecture à l'écran a rattrapé** (Chrome piloté par `playwright-core`, 390 × 844,
neuf vues dans chaque thème — les tests étaient verts pendant ce temps) :

- **l'enseigne « Dartpéro » portait un contour blanc** au lieu d'une ombre : l'ombre partagée
avec `.grave` était devenue blanche pour le thème clair, ce qui marche sous du petit texte et
pas du tout sous une plaque de laiton. D'où la séparation en deux tokens ;
- **le plateau qui tourne derrière l'enseigne virait au pastel** : sur du feutre, ses rouges et
verts à 12 % sont un fantôme ; sur du papier, ce sont des taches roses et vertes qui
concurrencent le nom. Il descend à 7 % en clair (`--voile-cible`).

### Décisions du lot « tour-du-monde-cloture-volee » (post-audit 2026-09-10)

Pas un lot de la feuille de route : un défaut remonté par un audit (`docs/audits/2026-09-10.md`),
traité via `/orchestrate` avec ses quatre phases (`docs/lots/tour-du-monde-cloture-volee/`).
Consigné ici parce que la correction repose sur une distinction qui se recopiera facilement de
travers la prochaine fois qu'un mode aura besoin d'un port de prévisualisation.

Le Tour du monde n'enregistrait une volée qu'à la 3ᵉ fléchette, alors que le domaine
(`applyVisit`) tronque déjà la volée sur celle qui boucle le tour — comme une volée de
checkout au X01. Contrairement au X01 (`PreviewVisit`, lot 3) et au Cricket
(`PreviewCricketVisit`, lot 5c), rien côté UI ne détectait ce bouclage anticipé : un joueur qui
bouclait à la 1ʳᵉ ou 2ᵉ fléchette devait taper des fléchettes fantômes, et le compteur affiché
pendant ce délai — le critère de départage du mode — était faux.

- **Nouveau port `PreviewTourDuMondeVisit`**, troisième port de prévisualisation du projet
(après X01 et Cricket) : synchrone, pur, aucune dépendance de constructeur. Ajouté à la liste
`ports/driving/` de `CLAUDE.md` § Arborescence.
- ⚠️ **Piège du copier-coller, identifié avant d'écrire le code** : au Cricket, `complete` se
déduit de `state.finished` parce que la fléchette qui clôt la volée est la même que celle qui
clôt la partie. Au Tour du monde, les deux sont **structurellement disjointes** — « on finit
le tour de table » — et une preview vérifiée par mutation a montré que recopier la formule du
Cricket n'aurait pas seulement laissé le bug survivre : elle aurait **fait perdre deux
fléchettes au dernier tour de table** (la 1ʳᵉ fléchette du joueur suivant, en tombant sur
`history.length % players.length === 0`, aurait fait passer `finished` à vrai et clos sa volée
avant l'heure). `complete` se lit donc sur la volée que l'aperçu vient d'ajouter à `history`
(`targetIndexAfter >= config.targets.length`), jamais sur `state.finished`.
- **Corollaire** : progression, cible courante et compteur de fléchettes viennent tous de
l'état projeté par l'aperçu (`affiche`, dans `useTourDuMonde.ts`). Ce qui dit qui joue
(`currentPlayerIndex`, `finished`, `winnerId`, `lastRound`) continue de se lire sur l'état réel
— l'aperçu a déjà fait tourner la main.
- **Aucune migration** : le journal des parties déjà jouées contenait des fléchettes fantômes
que le domaine tronquait déjà à la lecture ; seules les parties futures écrivent des volées
plus courtes. `backupSchema.ts` acceptait déjà `1 à 3 fléchettes` par volée.
- **318 → 330 tests verts** (+12 : 6 dans `tests/ui/tourDuMonde.test.tsx`, 6 dans le nouveau
`tests/use-cases/tourDuMonde.test.ts`), dont deux vérifications par mutation (la formule du
Cricket, puis les fléchettes fantômes pré-lot, toutes deux rejouées et confirmées rouges) et
une couverture explicite de l'annulation + rejeu à froid juste après une clôture anticipée.
Aucune relecture à l'écran faite pour ce lot — le diff ne touche aucune classe Tailwind, aucun
token, aucune structure de balisage, seul le *moment* des transitions change.

### Décisions du lot « pourcentage-doubles-tiret » (post-audit 2026-09-10)

Candidat 2 de `docs/audits/2026-09-10.md`, traité via `/orchestrate`
(`docs/lots/pourcentage-doubles-tiret/`).

- `pourcent(valeur, occasions)` **monte de `StatistiquesEcran.tsx` (privée) vers `src/ui/labels.ts`
(exportée)** : la règle « pas d'occasion, pas de pourcentage » — déjà appliquée à
`matchWinPercent`/`legWinPercent` depuis le lot « les trois finitions » — vivait dans un fichier
d'écran, donc invisible du second écran qui en avait besoin. C'est l'obstacle structurel, pas
seulement le symptôme, qui a été corrigé.
- `checkoutPercent` y passe désormais sur les deux écrans qui l'affichent
(`StatistiquesEcran.tsx`, `ResumeX01Ecran.tsx`). **`tri` et `meilleur` restent bruts** : le
classement et le dorage sont inchangés, seul le texte de cellule change.
- Cas plus grave que l'audit ne le disait : en `doubleOut: false`, `doubleAttempts` vaut 0 pour
tout le monde (`isOnACheckoutDouble` renvoie toujours `false` dans ce cas) — la feuille de
match affichait donc « 0 % » à un joueur qui **venait de sortir son leg sur un double**. Le
défaut ne mentait pas qu'à celui qui n'avait rien tenté, il mentait aussi au vainqueur.
- **330 → 334 tests verts** (+4 : 3 dans `tests/ui/resumeX01.test.tsx`, 1 dans
`tests/ui/lot4.test.tsx`), dont le cas discriminant « tenté et tout raté → 0 %, jamais un
tiret » — sans lequel rien ne prouve que le lot n'a pas simplement remplacé tous les zéros par
des tirets. Trois mutations indépendantes en revue (dont deux non prévues par le plan de test
initial) confirment la couverture sur les deux écrans et sur le helper lui-même.
- Aucune relecture à l'écran faite pour ce lot — tranché en revue, mécanisme par mécanisme
(glyphe déjà à l'écran ailleurs dans les mêmes cellules, largeur ne pouvant que se réduire,
couleur/dorage décidés uniquement par des valeurs restées brutes) : zéro classe Tailwind, zéro
token, zéro balise nouvelle dans le diff.
- Même défaut identifié, non traité, sur `successPercent` (mode entraînement,
`ApercuPartie.tsx` — retiré depuis, la carte d'entraînement affiche « N / M sorties » —,
`ResumeEntrainementEcran.tsx`) — hors périmètre assumé, à verser à un futur
audit : cet écran n'a pas de tableau, et une phrase d'appréciation dérivée du même chiffre pose
une question ergonomique propre.

### Décisions du lot « bundle-par-route » (post-audit 2026-09-10)

Candidat 6 de `docs/audits/2026-09-10.md`, traité via `/orchestrate`
(`docs/lots/bundle-par-route/`). Lot de performance/build pur : aucune règle de jeu, aucun
comportement fonctionnel visible touché.

- Le bundle unique (515 kB minifié / 154 kB gzip, au-delà du seuil d'avertissement natif de
Vite) est **découpé par route** (`React.lazy()` sur 8 des 9 routes de `src/App.tsx`,
`AccueilEcran` restant volontairement statique) **et par mode de jeu** (les 8 écrans de
`src/ui/ecrans/games/PartieEcran.tsx` — jeu et résumé de chacun des quatre modes). Chunk
d'entrée résultant : **61 kB minifié** (÷ 8,4), mesuré, pas estimé.
- **Un groupe vendor** (`build.rollupOptions.output.codeSplitting.groups` — l'API Rolldown de
Vite 8, `manualChunks`/`advancedChunks` y sont dépréciés) isole ~360 kB de `node_modules`
(React, React Router, TanStack Query, Dexie) dans un chunk qui ne bouge qu'aux montées de
version. C'était le vrai enjeu du lot, pas seulement le premier chargement : sans lui, un
simple libellé changé dans `labels.ts` continuait de rehasher le chunk d'entrée et de faire
retélécharger l'équivalent de tout le bundle à chaque déploiement, à cause du cache
`max-age=31536000, immutable` posé sur `/assets/**` (`CLAUDE.md` § Déploiement).
- **Fallbacks** : aucun composant nouveau — `Spinner` (plein écran) et `SpinnerLigne` (barre de
navigation conservée) existaient déjà dans `src/ui/composants/commun/Etats.tsx` et sont
exactement les états que les écrans affichaient déjà pendant leurs propres requêtes.
- ⚠️ **Piège introduit par le lazy, sous un service worker `autoUpdate`** : un déploiement
pendant qu'un onglet reste ouvert purge l'ancien précache workbox sous ses pieds ; le prochain
`import()` vers un chunk qui n'existe plus échoue (écran mort). Un écouteur
`vite:preloadError` dans `src/main.tsx` recharge la page une seule fois (garde-fou
`sessionStorage`, avec repli en cas d'exception — navigation privée sur certains navigateurs).
Non testé en conditions réelles de déploiement (il faudrait deux versions de build servies
successivement sous le même SW) — vérifié par lecture de code seulement, assumé.
- **Invariant décisif, vérifié en conditions réelles et pas seulement déduit** : avec le
service worker actif et le réseau coupé (`context.setOffline(true)`), les quatre modes de jeu
et les écrans de consultation restent accessibles **y compris ceux jamais ouverts avant la
coupure** — la preuve directe que le précache workbox (`globPatterns`) couvre bien les 27
chunks issus du découpage, sans configuration supplémentaire.
- **334 → 339 tests verts** (+5, `tests/architecture/lazyRoutes.test.ts` — garde qui interdit
le retour d'un import statique des 16 écrans concernés, mutation-testée). Deux tours de revue :
un `try`/`catch` manquant autour de `sessionStorage` (le piège que le projet avait déjà payé
pour apprendre dans `LocalStoragePreferences.ts`, pas repris du premier coup) et un plancher de
garde-fou manquant sur une des deux regex du nouveau test — les deux corrigés, prouvés par
mutation.
- **Point assumé, non corrigé** : sur un lien profond vers `/partie/:id` (route hors
`LayoutPrincipal`), la séquence de chargement passe par **trois** fallbacks (`Spinner` deux
fois, puis `SpinnerLigne`), avec un vrai saut visuel entre le `Spinner` plein écran et le
`SpinnerLigne` compact — cosmétique (chunk précaché en usage réel, ~100 ms), remède connu à une
ligne si besoin un jour (donner à `Aiguillage` le même fallback `Spinner` que `App.tsx`).
- **Points non résolus, hors périmètre de ce lot** : aucun `ErrorBoundary` dans tout le projet
(si le rechargement unique échoue aussi, écran blanc sans filet) ; la fenêtre d'installation du
service worker à la toute première visite ; les doublons de précache dans `dist/sw.js`
(candidat 7 du même audit, non corrigés ici).

### Décisions du lot « allegement-docs »

Lot de documentation pur (`docs/lots/allegement-docs/`) : aucun fichier sous `src/`, `tests/`
ou `scripts/` touché, aucune règle de jeu ni décision structurante retouchée.

- **Le principe** : `CLAUDE.md` ne garde que le résumé opérationnel, les décisions gravées et
les pièges vitaux ; l'état d'avancement vit en § 0 / § 4 de ce plan, le journal ici en § 6, le
manuel dans `.claude/CONVENTIONS.md` (§ 11, § 12, § 14 « Arborescence ») et `docs/`
(`docs/DEPLOIEMENT.md`, nouveau ; charte § Typographie). Les 15 titres `##` de `CLAUDE.md`
sont gardés comme ancres : aucune référence « `CLAUDE.md` § X » ne pend.
- **`.ai/architecture-context.md` devient un index plafonné** (≤ 160 lignes, ≤ 13 312 octets —
relevé en cours de lot depuis 150 lignes / 12 288 octets : le générateur a tenu à 42 octets du
plafond, et les trois corrections de la boucle 1 ont ramené la marge à 9 octets) :
il dit où lire, il ne recopie ni ne résume plus aucune règle de jeu. Une règle résumée incite à
se passer de la source ; une règle absente de l'index force à la lire.
- **Pas de test automatique de taille** : il lierait la taille de la doc au vert du code et
pousserait à supprimer du contenu pour passer au vert. Garde-fous à la place : le plafond
auto-mesuré du brief `architecture-context`, la puce de `review.md` sur la croissance de
`CLAUDE.md`, et la note d'en-tête de `CLAUDE.md`.
- ⚠️ **`.claude/rules/` est chargé d'office** dans le contexte de chaque agent, comme
`CLAUDE.md` : y déplacer du contenu n'allège rien. Rien de nouveau n'y est entré.
- **Pourquoi pas ≈ 200 lignes** : les blocs intacts (décisions structurantes, règle
d'architecture, trois blocs de règles de jeu, charte, journal, décisions ouvertes,
environnement) en font déjà ≈ 246. `CLAUDE.md` passe de **530 lignes / 34 092 octets** à
**338 lignes / 20 315 octets** (cible ≈ 335, plafond 340, tranché par l'utilisateur),
séparateurs `---` conservés.
- **Corrigé d'après le code** : `npm run firebase:deploy` exécute aussi `npm run smoke`
(`package.json` l. 19) — `CLAUDE.md` § Déploiement ne le disait pas.
- ⚠️ **Une copie injectée d'un fichier peut être périmée** (celle de l'architecte ignorait la
règle de branche de `a00e9a8`) : Test, Sécurité, Revue et le générateur de `.ai` relisent les
sources **sur disque**. La péremption de `.ai` se juge par `git log -1 --format=%ct`
(commande `/orchestrate` § Prérequis).
- La table de correspondance ligne à ligne (origine → destination → preuve) vit dans
`docs/lots/allegement-docs/02-dev-notes.md`.

### Décisions du lot « stockage-persistant » (feuille de route Play Store, lot 1)

Traité via `/orchestrate` (`docs/lots/stockage-persistant/`), niveau `high` (persistance).
Aucune surface gravée touchée : ni domaine, ni `GameMode`, ni `MatchEvent`, ni schéma Dexie, ni
`backupSchema`, ni service worker.

- **Le problème** : sans `navigator.storage.persist()`, le navigateur peut effacer l'IndexedDB sans
prévenir (Chrome si le disque manque, Safari après ~7 jours sans ouverture si l'app n'est pas
installée). La protection est demandée au démarrage, son état se lit dans Réglages → Sauvegarde.
- **Port `PersistentStorage`** (`status()` / `request()`, ne rejettent jamais, trois états
`persisted` / `not-persisted` / `unavailable`) + `NullPersistentStorage`. Adapter
`NavigatorPersistentStorage` (seul lecteur de `navigator.storage`, `StorageManager` injectable
pour les tests). Câblé dans `Devices` : même exception assumée que `screenLock`, deux lignes sans
règle métier ne méritent pas un use case.
- **Hooks plutôt que `main.tsx`** : les services naissent dans `ServicesProvider`, `main.tsx` n'y a
pas accès. `useDemandeStockageAuDemarrage` (monté dans `App.tsx`, promesse non attendue, un
`useRef` garantit un seul appel) et `useProtectionStockage` (Réglages ; `redemander` applique la
valeur de retour de `request()`, ni rechargement ni TanStack Query).
- **Rien n'est rendu tant que `status()` n'a pas répondu** : la réponse est locale et quasi
instantanée, un texte provisoire ne ferait que clignoter. Le bouton « Redemander » n'existe que
pour « non protégé » ; « protégé » ne promet rien contre une désinstallation et ne remplace pas
l'export JSON (rappel d'exporter dans les trois états, « protégé » compris : « Ce n’est pas une
sauvegarde : exportez pour garder une copie. »).
- ⚠️ **Piège de test** : un `<StrictMode>` posé *sous* les providers de `renderWithServices` ne
rejoue pas les effets (vérifié : le garde `useRef` pouvait être supprimé sans qu'un test casse).
Le test StrictMode monte donc le `StrictMode` tout en haut, à la main ; supprimer le garde le
fait échouer (mutation vérifiée).
- **Angle mort assumé** : le comportement réel de Safari iOS hors installation et de Chrome sur un
onglet simple n'est pas vérifiable en test ; la relecture à l'écran (portrait, paysage, sombre,
clair) et la vérification sur appareil restent à faire.
- **« Redemander » refusé = un retour visible** (boucle 5, tour 3) : un refus silencieux (cas normal
  de Chrome en onglet non installé) ne produisait rien à l'écran. `useProtectionStockage` expose
  `refusee`, vrai seulement après une redemande **faite par l'utilisateur** et refusée (jamais au
  montage ni pour le refus du démarrage) ; la phrase s'affiche dans le même `<output>`
  (`role="status"`, donc annoncée), sans promettre une acceptation. +3 tests.
- **339 → 366 tests verts** (+27 : adapter sur faux `StorageManager`, démarrage, Réglages, retour après refus).

### Décisions du lot « installation-guidee » (feuille de route Play Store, lot 2)

Traité via `/orchestrate` (`docs/lots/installation-guidee/`), niveau `high` : surface gravée n° 4
(service worker / manifeste). Ni domaine, ni journal, ni Dexie, ni `backupSchema`.

- **Port `AppInstallation` synchrone avec abonnement** (`state()` / `subscribe()` / `prompt()`) +
`NullAppInstallation`, lu par `useSyncExternalStore` dans `useInstallation`. Une promesse lue une
fois (comme `PersistentStorage`) raterait l'invite arrivée tard ou l'`appinstalled` pendant que la
page est ouverte. Cinq états : `installed` > `installable` > `ios-manual` > `ios-other-browser` >
`unavailable`.
- **Adapter `BrowserAppInstallation`**, seul lecteur de `beforeinstallprompt`, `appinstalled`,
`(display-mode: standalone)` et `navigator.standalone` (garde `installationBoundary`, commentaires
compris). Écouteurs posés **dans le constructeur**, tout sous `try/catch` ; `preventDefault()` sur
l'invite, la dernière gardée ; `prompt()` retire l'invite et publie **avant toute attente**, puis
appelle `invite.prompt()` sans `await` préalable (activation utilisateur) ; un second appel rend
`unavailable` sans rouvrir. `installed` ne vient que d'`appinstalled` ou du mode autonome, jamais
d'un `accepted` ; le drapeau reste en mémoire (persisté, une désinstallation le rendrait faux).
`detectIosBrowser` : fonction pure, testée sur des UA réels (iPad en « Mac tactile » compris).
- ⚠️ **La création des services quitte le provider** : `createBrowserServices()` est appelé une
fois au niveau du module de `src/main.tsx`, **avant** `createRoot`, et `ServicesProvider` reçoit
`services` en prop obligatoire. Raison : l'invite de Chromium peut partir avant le montage de
React, et un `useMemo` rejoué par `StrictMode` aurait créé un second adapter fantôme qui garde
l'invite. Ça **invalide** la phrase « `main.tsx` n'a pas accès aux services » du lot
`stockage-persistant` ; `useDemandeStockageAuDemarrage` reste un hook (il n'a pas besoin d'être
plus tôt).
- **« Plus tard »** : préférence d'appareil `installation:ecartee` (port `Preferences` inchangé),
lue sur l'Accueil seulement — les Réglages ne la consultent jamais. Clé à ne jamais renommer.
- **Place de la ligne d'Accueil** (Q3) : entre l'aperçu (partie en cours ou « Qui joue ce soir ? »)
et le groupe d'actions poussé en bas — filet haut et bas, bouton `secondaire` et `discret`, jamais
plus lourde que « Nouvelle partie ». En paysage, une seule rangée de 66 px (sous-texte masqué).
L'ancre `#installer` des Réglages défile par `scrollIntoView` relancé à chaque navigation
(`location.key`), avec une marge haute `max(1rem, safe-area-inset-top)` pour l'encoche.
- **Manifeste** : `id: '/'` (= identité calculée aujourd'hui, à ne jamais changer), `categories`,
raccourci vers `/nouvelle-partie` (icône 192 réutilisée), trois captures copiées de
`docs/captures/` dans `public/screenshots/` et exclues du précache (`globIgnores`). `description`
réécrite : elle ne parlait que du X01 et s'affiche désormais dans la fenêtre de Chrome.
`firebase.json` inchangé.
- **Contrôles statiques en tête de `scripts/smoke-build.mjs`** plutôt qu'un test Vitest sur
`dist/` (qui dépendrait d'un build préalable : faux vert ou faux rouge). Mutation vérifiée :
sans `globIgnores`, le précache passe de 47 à 50 entrées et le smoke échoue.
- **Fins de ligne** : sept fichiers du lot précédent étaient en CRLF dans la copie de travail
(`autocrlf=true`, pas de `.gitattributes`), ce qui faisait échouer `biome check` ; ramenés en LF,
sans diff pour git. Puis `.gitattributes` (`* text=auto eol=lf`, `*.png binary`) a réglé la cause :
un `switch` / `merge` ne réécrit plus les sources en CRLF ; l'index était déjà tout en LF.
- **Libellés iOS valables sur iPad** : `ios-manual` couvre l'iPad (détecté en « Mac tactile ») ; les
textes ne disent plus « Sur iPhone » ni « en bas de l'écran » (Partager est en haut sur iPad).
- **Angles morts** : vraie fenêtre de Chrome, vrai `appinstalled`, vraie interface iOS — voir § 0.
- **366 → 437 tests verts** (+71 : adapter et `detectIosBrowser` 40, UI 28, garde 3).

### Décisions du lot « confidentialite-assetlinks » (feuille de route Play Store, lot 3)

Session complète : `docs/lots/confidentialite-assetlinks/` (architecture `archi-authority`,
deux tours de boucle Sécurité → Dev, revue GO).

- **Prémisse corrigée** : la feuille de route croyait que `**/.*` exclurait `/.well-known/`.
Faux sous firebase-tools 15 (glob 10) : le motif écarte les entrées à point, pas les fichiers
rangés **dans** un dossier à point. Vérifié en appelant la vraie `listFiles` (V4) : l'ancien
motif publiait `.cache/x.txt`, `sub/.git/config`… Le lot a fermé une fuite existante.
- **`ignore`** : extglobs `**/.!(well-known)` + `**/.!(well-known)/**`, **jamais** de `!` (no-op en
glob 10, filtre inversé en glob 7) ; garde `firebaseHosting.test.ts`. Règle `headers` dédiée
(`application/json`, `no-cache`) **après** le fourre-tout. `navigateFallbackDenylist` pour
`/.well-known/`, jamais précaché.
- **Écran dans `LayoutPrincipal`**, barre de navigation visible : un visiteur venu du store peut
entrer dans l'app. Ligne-lien Barlow + chevron `min-h-12` dans À propos (un bouton Oswald en
capitales tenait sur deux lignes).
- **Garde `REMPLIR` dans le smoke**, pas en Vitest (la suite serait restée rouge), après
Chromium, sans aucun contournement ; cherche `REMPLIR` en ASCII pour ne pas rater un « À »
échappé. Mentions fournies par l'utilisateur le 2026-10-10 ; le smoke est revenu au vert.
- **Le texte, vérifié contre le code** : `localStorage` ne contient pas que le thème (derniers
joueurs choisis), `sessionStorage` cité, voix possiblement synthétisée en ligne (pseudo compris)
avec la manière de la couper. La Sécurité a fait corriger trois phrases : l'import **remplace**
les éléments de même identifiant (S1, et le texte de Réglages → Sauvegarde qui disait « rien
n'est effacé ») ; « n'envoie rien » était un absolu démenti deux lignes plus bas (S2) ; le
fichier d'export peut être synchronisé par le système (S3).
- **`reseauBoundary.test.ts`** : `fetch`, XHR, WebSocket, EventSource, `sendBeacon`, import
`firebase`, et toute URL `https?://` en dur dans `src/` (scripts et CSS) et `index.html`, sauf
deux URI d'espace de noms exactes. Fil-piège, pas preuve.
- **Smoke Chromium dans un contexte vierge par page** : un vrai accès direct à
`/confidentialite`, sans service worker hérité de `/`.
- **Risques acceptés par l'utilisateur** (R-a à R-g, `04-revue-securite.md`) : `firebase deploy`
à la main saute le smoke (pas de `predeploy`), CLI globale non épinglée (refaire V4), garde réseau
partielle, voix en ligne (lot `localService` éventuel), `persist()` sous Firefox, assetlinks
manquant servi en HTML, robot sans JS.
- **Hors lot, relevés** : l'import écrase sans confirmation ; commentaire « Fusion, jamais
remplacement » de `ManageBackupUseCase` ; titres de `Panneau` laiton ≈ 3,94:1 en clair ;
guillemets ouvrants orphelins (aucune espace insécable dans `labels.ts`).
- **437 → 456 tests verts** (+19 : UI 9, `firebaseHosting` 6, `reseauBoundary` 4).

### Décisions du lot « nouvelle-partie-en-etapes »

Session complète : `docs/lots/nouvelle-partie-en-etapes/` (intake validé, architecture
`archi-authority`, trois tours de boucle : Test → Dev, puis deux fois Revue → Dev). Étude source :
`docs/prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md`.

- **Chaque étape est une route** sous `/nouvelle-partie/*` (routes descendantes, un seul
`lazy()`), jamais un état interne : le retour du téléphone ramène à l'étape précédente. Le hook
`useNouvellePartie` vit dans le parent (deux `usePreference` sur la même clé divergeraient).
Retour de l'écran : `navigate(-1)` si l'on vient du parcours (`ETAT_PARCOURS`), sinon `replace`
vers l'étape précédente (liens profonds).
- **Double out** : décoché à l'écran (choix de l'utilisateur, `577dc5f`), `true` dans le domaine
— la règle standard, les tests de règles et la relecture d'une vieille sauvegarde en dépendent.
Gravé dans `CLAUDE.md`.
- **« Manche » à l'écran**, « leg » dans le code ; « set » inchangé. Gravé dans `CLAUDE.md` et le
glossaire. La colonne « Manches » du tableau prend sa largeur sur VOLÉE, pas sur JOUEUR.
- **Glisser-déposer** en Pointer Events natifs, sans dépendance ; la ligne suit en `transform`,
réordonnancement au relâcher ; même `deplacer` pour le clavier (↑ / ↓). ⚠️ `rangVise` vise la
place **la plus proche** (seuil à mi-chemin de deux milieux) : la première version exigeait de
franchir le milieu de la ligne voisine, alors que la borne du geste arrête le centre pile sur
le milieu extrême — premier et dernier rang inatteignables au doigt, rien à deux joueurs.
Rattrapé par la Revue, pas par les tests ; testé depuis jusqu'au geste (mise en page simulée).
- **Boîte de dialogue**
en `<dialog>` natif ; faux de test dans `tests/setup.ts` (jsdom 29 ne les implémente pas).
- **Préférences** : nouvelles clés `partie:sets`, `entrainement:joueur`, `entrainement:sorties` ;
`partie:mode` abandonnée (jamais réutiliser la clé). Toutes dans ce que la politique déclare
déjà : ni texte ni date à changer.
- **Entraînement** : écran de lancement supprimé, `/entrainement` redirige ; « Changer les
règles » des résumés mène à l'étape 2 du même jeu.
- **Erreur de démarrage** effacée à chaque changement d'étape (effet sur `pathname` dans
`useNouvellePartie`), testée sans mock.
- **Hors lot, relevés** : § Checkouts de `CLAUDE.md` décrit le cas double out (sans double out,
`checkout.ts` suggère jusqu'à 180) ; « Manche N » du bandeau numérotée sur la partie, pas dans
le set ; le résumé X01 n'affiche pas les sets ; boutons retour de 44 px ailleurs.
- **456 → 517 tests verts** (+61).

### Décisions du lot « nom-de-partie »

Session complète : `docs/lots/nom-de-partie/` (intake validé, architecture `archi-authority`,
trois tours de boucle : Test → Dev, Sécurité → Dev, Revue → Dev).

- **Le nom vit dans l'événement d'ouverture** (`name?` sur les quatre `…Started`), ni dans
`MatchRecord` (six points de mapping, chacun capable de perdre le nom en silence) ni dans un
événement `MatchNamed` (les quatre projections refusent tout événement non-volée après
l'ouverture, l'annulation aurait pu retirer le nom, une vieille app aurait refusé la partie à
l'import). Gravé dans `CLAUDE.md` § Décisions structurantes.
- **Seul un nom tapé s'écrit.** Le nom par défaut (« Jour tranche » : matin 5-12 h, après-midi
12-18 h, soir 18-24 h, nuit 0-5 h) est un libellé recalculé à l'affichage depuis `createdAt`
(`nomParDefaut`, `labels.ts`) : jamais écrit, jamais « complété » sur les anciennes parties.
- ⚠️ **Amendement de la nuit**, décidé par l'utilisateur (deux fois confirmé) : la nuit porte le
nom du **jour du calendrier** — samedi 1 h → « Samedi nuit ». L'intake disait « rattachée à la
veille » ; `docs/request/nom-de-partie.md` et le snapshot du lot gardent cette formulation, à
dessein (provenance) : **`CLAUDE.md` fait foi**. Classé en changement de spécification d'un
libellé (Révision 1 de `01-architecture.md`), sans relance de la chaîne d'architecture.
- **`Services.clock`** : l'UI lit l'heure par la même horloge que les use cases (proposition et
`createdAt` cohérentes, test déterministe), exception de même nature que `devices`. Garde
`horlogeBoundary.test.ts`. Port driving `GetMatchName` → `{ name, createdAt }`, lu par
`useNomDePartie` (`staleTime: Infinity` : un nom ne change pas).
- **Clé absente, jamais `name: undefined`** (`nameField`, `backupSchema`) : le clonage
d'IndexedDB garderait la clé. `BACKUP_VERSION` reste à 1 : un ajout facultatif laisse les
anciennes sauvegardes valides ; un nom importé repasse par `MatchName.of`.
- **« Rejouer »** garde le nom tapé ; « Changer les règles » repart de la proposition (voulu,
décision utilisateur T4).
- **Politique `/confidentialite`** mise à jour (le nom donné aux parties est stocké), date au
12 octobre 2026. Caractères de contrôle et bidi dans un nom : pas de refus, rendu en texte
React — résiduel bas **accepté par l'utilisateur** (D2).
- **Tests datés** : fuseau fixé (`test.env.TZ = 'Europe/Paris'`), bornes locales, précondition
de durée du jour avant un changement d'heure — sans elle, un test sous UTC serait vert à vide.
Règles communes aux modes en `it.each(GAME_MODE_IDS)`.
- ⚠️ **Le premier `sansCommentaires` de la garde abîmait `src/App.tsx`** : une regex avalait la
suite de la ligne `"/nouvelle-partie/*"` comme un commentaire ouvert. Réécrit en petit lecteur
qui respecte chaînes, gabarits et regex (tour 1), avec échantillons attrapés / permis.
- **Leçon de processus (constat 11 de la Revue)** : au gate Architecture, l'Orchestrator a clos
la question de la nuit comme « évidente » alors que l'intake se contredisait (son exemple
contre son critère 2) ; l'utilisateur a tranché à l'inverse. Une question où l'intake se
contredit n'est **jamais** évidente : elle se pose.
- **Laissés, décision utilisateur** : R1 (liste `OUVERTURES` recopiée dans `matchName.test.ts`,
`CONVENTIONS` § 13), R2 (`CONVENTIONS` § 11). Au prochain audit : R3, R4, N2 (§ 0).
- **Hors lot, relevés** : `nom` de `useNouvellePartie` ambigu (`nomPartie` serait plus clair) ;
troisième copie du couple libellé + champ (composant `ChampTexte` à prévoir) ; « undefined
nuit » sur un `createdAt` importé absurde, antérieur au lot.
- **517 → 689 tests verts** (+172).

### Décisions du lot « accueil-parties-recentes »

Session complète : `docs/lots/accueil-parties-recentes/` (intake validé ; architecture
`archi-scout` en PASS au premier essai, aucune surface gravée ; trois tours de boucle : deux fois
Test → Dev, puis Revue → Dev). Étude source : `docs/prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md`,
lot n° 3 du découpage.

- **« Abandonnée » est dérivée, jamais écrite**, calculée en un seul endroit, `matchStatus`
(`use-cases/summarize.ts`), contre la partie en cours **globale** de `GetOngoingMatch`. ⚠️ Un
champ calculé dans `GetMatchHistory` aurait été **faux sous le filtre de mode** de l'onglet
Parties (il aurait pris la plus récente non terminée *de ce mode*). Gravé dans `CLAUDE.md` § DS
(la règle, pas la mise en page). `matchStatus` est la première fonction de `use-cases/` importée
par l'UI : pure, dans le bon sens de dépendance, jamais une classe `*UseCase`.
- **La partie en cours** est cherchée parmi les **20** parties les plus récentes (comportement
existant de `GetOngoingMatch`, gardé par l'utilisateur) : au-delà, personne n'est épinglé et
toute non terminée est « Abandonnée ». Elle reste épinglée en tête même si elle a plus de 7 jours.
- **Fenêtre** : aujourd'hui plus les 6 jours calendaires **locaux** précédents, bornes construites
par composantes (`new Date(a, m, j - 6)`), jamais par `86 400 000 × N` (jours de 23 h et 25 h).
Une date **future** (import absurde) est écartée de l'Accueil. Pas de minuteur à minuit : un
Accueil laissé ouvert se recalcule à la navigation suivante (accepté). Tri par `createdAt` à
l'Accueil, par `updatedAt` dans le port et l'onglet Parties.
- **30 cartes au plus** (`getMatchHistory.execute(30)`, puis filtre en mémoire) ; la partie en
cours fait partie des lectures, le maximum est donc 30, pas 31.
- **Une carte commune**, `CartePartie`, remplace `ApercuPartie` et la carte locale de
l'Historique : l'onglet Parties perd le détail par joueur (il reste dans le résumé, décision de
l'utilisateur). Les champs du `MatchSummary` qu'aucun écran ne lit plus sont **gardés**
(documentés dans le port).
- ⚠️ **Amendement de l'utilisateur (C7)** : un X01 **terminé** affiche « Kevin gagne · N manches »
(« N manches jouées » en cours). `docs/request/accueil-parties-recentes.md` et le snapshot du lot
gardent « N manches jouées », à dessein (provenance).
- **Bouton « Nouvelle partie » fixé** : `sticky`, calé sur la **hauteur fixe** de la barre du bas
(`--hauteur-nav-basse`, filet compris), le même `calc` des deux côtés, gardé par un test
structurel. Effets : la barre passe de 59 à 56 px sur tous les écrans ; `overflow-hidden`
coupait l'anneau de focus des onglets → anneau **intérieur** (−2 px). ⚠️ Compromis : avec une
police système très agrandie, un libellé d'onglet serait rogné ; repli : un conteneur `sticky`
unique dans `LayoutPrincipal` (changement de design).
- **Clés de requête** : `src/ui/clesRequetes.ts`, hors de tout écran chargé à la demande (sinon
l'Accueil, statique, l'aurait importé). La suppression et le lancement invalident désormais
l'historique et la partie en cours. Les tests d'invalidation partagent **un seul**
`QueryClient` en `staleTime: Infinity` : démonter puis rendre à neuf ne prouvait qu'un
chargement à froid (constat du Test).
- **Revue (R1 à R5)** : le français des règles courtes est sorti de la carte vers `labels.ts`
(constructeurs sur primitives) ; la surface exportée du cœur est passée en anglais
(`matchStatus`, `'FINISHED' | 'ONGOING' | 'ABANDONED'`) ; un `h2` invisible évite le saut
`h1` → `h3` à l'Accueil.
- ⚠️ **Incident d'outillage** : au tour 3, le Dev a lancé `npm run lint:fix` sur **tout** le
dépôt ; il a réécrit 7 scripts d'un skill tiers (`impeccable`) que l'utilisateur venait
d'installer dans `.claude/skills/`, non suivis par git — réinstallé par l'utilisateur.
Décision : **`.claude/skills` et `.agents` exclus de Biome** (`biome.json`) ; leçon dans
`rules/biome.md` : `lint:fix` sur les chemins du lot.
- **Dette d'audit** : T1 (aucun test ne garde le texte des règles des cartes — vérifié identique
à la main, choix de l'utilisateur pour garder un tour de marge), voir § 0.
- **689 → 765 tests verts** (+76).

### Décisions du lot « charte-typo-mouvement » (lot 3 de la refonte de la charte)

Session : `docs/lots/charte-typo-mouvement/` (niveau `light`, aucune surface gravée). Étude
source : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, maquette « A · Affiner ».

- **Échelle typographique** : `--text-etiquette` (0,75 rem, le plancher) et quatre paliers de
  grands chiffres (`text-score-xl` / `-l` / `-m` / `-solo`). Les 44 `text-[…rem]` de `src/ui`
  sont partis ; 32 d'entre eux étaient sous 0,75 rem. Interlettrage resserré (≤ 0,06 em) là où
  0,75 rem débordait ; `Avatar` xs passe à `size-6` et `tracking-normal`.
- **Mouvement** : une courbe en token (`--ease-sec`, aucun paramètre > 1) et trois durées
  déclarées (`--duration-vif` / `-normal` / `-lent`) dont seule `--duration-lent` est consommée
  (`monter`, `craie`) ; les autres durées (transitions Tailwind, keyframes) restent littérales.
  `pop-score` sans
  rebond, `secousse` à 4 px, logo en un seul tour (`tour-logo`), badge du Tour du monde fixe.
  `eclat`, `respirer`, `tourner-lent` supprimés.
- **Halos et dégradés** : les quatre `shadow-[0_0_…]` retirés ; tapis uni (`--tapis-image` supprimé) ;
  enseigne en `text-laiton` plein ; `trace-craie` réservé au reste du joueur qui lance (lignes
  actives du tableau et `Cartouche` d'entraînement), retiré du résumé d'entraînement. L'`eclat`
  est remplacé par un **filet vert qui se trace** (`trace-filet`, 2 px, `clip-path`, `vert-cible`
  dans `MomentCelebratif` comme dans `TableauHonneur`). Les ombres
  portées (enseigne, nom du vainqueur, médaille, `Check`) sont **gardées** : décision de
  l'utilisateur, la maquette n'y touchait pas.
- **Garde** `tests/architecture/typographieBoundary.test.ts` : tailles arbitraires, dégradés
  (exception `.chargement-balai`), halos et `text-shadow` à flou. Contre-épreuve réelle de
  chacune faite (casser, voir rouge, restaurer). Tests : **805 → 815** (+10, tous de la garde).
- ⚠️ **Angle mort** : troncatures à 0,75 rem (colonne « Manches », barre du bas, `Avatar` xs,
  `LigneCible`) et rendu du filet : à juger à l'écran, portrait et paysage, sombre et clair.


### Lot `nouvelle-partie-parcours`

- **Tirage** : port driving `ShuffleOrder` + `ShuffleOrderUseCase(random)` (réutilise `shufflePlayers`,
  Fisher-Yates), câblé dans `container.ts`. Vrai hasard, aucune relance si l'ordre est identique ; la
  feuille rejoue `animate-monter` à chaque tirage (`key` du `<ol>`), coupé sous `prefers-reduced-motion`.
  L'ordre s'écrit dans `partie:joueurs` ; annonce vocale dans un `<output>`.
- **Dettes** : flag `shuffle` de `StartMatch` / `PlayCricket` / `PlayTourDuMonde` sans appelant UI ;
  clé `partie:ordre-aleatoire` orpheline (aucun nettoyage).
- **Laiton unique** : aucune couleur par mode (écart à la planche, lot `pave-unifie`) ; × conservé ;
  barre à un joueur avec Ordre grisé (un cran plus pâle).
- `Bascule.tsx` supprimé (plus d'interrupteur). `aideSets`, `reglesCarteJeu`, `LIBELLE_DOUBLE_*` retirés.
- ~~Texte « Les règles en entier » du X01 : à valider (lot `regles-du-jeu`).~~ **Close** au lot
  `regles-du-jeu` : « Les règles en entier » a quitté la fiche, la feuille de règles le remplace.
- Rendu à relire sur appareil : barre et pseudos tronqués à police max sur 360 px.

### Décisions du lot « statistiques-podium » (lot 8 de la refonte de la charte)

Session : `docs/lots/statistiques-podium/` (niveau `high` : la politique publique change), mené
**en parallèle** de `nouvelle-partie-parcours` dans un worktree. Étude source :
`docs/prospective/2026-10-13-NEW-revision-charte-graphique.md` § Écran Statistiques ; planche
`docs/maquettes/stats/stats.html` (écran « Retenue », hors git).

- **UI seulement** : `GetPlayerStats`, `CareerStats` et le domaine inchangés. Logique pure dans
  `src/ui/podium.ts` (`classerPodium`, `apercuPodium`, `joueurDeLaCible`,
  `defilementPourMontrer`) ; briques communes `CartePodium` (`GrandeLignePodium`,
  `BarresPodium`, `BasculesPodium`), `CompteBatons` (distinct de `Batons`), `PlateauImpacts`
  (extrait de `CarteImpacts`), `Modale`, hook `useModaleAuRetour`.
- **Joueur de la cible mémorisé** (`statistiques:joueur`, écrit à l'appui seulement ; ⚠️ citée
  par la politique, ne se renomme pas) ; repli sur le premier de la moyenne si absent de la
  période, sans fléchette ou supprimé ; le sélecteur ne pilote que la cible. Politique : clause
  ajoutée, date du 16 octobre 2026.
- **Teinte en tête** : ex aequo sur le **chiffre affiché** ; **jamais de dorure à zéro**, les
  « — » ne comptent pas ; joueur seul doré (sauf à 0) ; égalité non nulle : tous dorés ; grand
  chiffre en `craie-vive` sans vrai premier.
- **Bascules** : libellés courts (« Moy. · F9 · Volée », « % dbl · Haut · Manche », « 180 · 140+
  · 100+ ») ; nom accessible « court, complet » ; titre « Moyenne 3 fl. » (tient à 360 px), nommé
  « Moyenne 3 fl., Moyenne 3 fléchettes ». Bascules dans l'écran, non mémorisées, survivent à la
  période.
- **Révision 1 en cours de lot** (choix de l'utilisateur, contre la recommandation d'un lot à
  part) : N premiers (5 / 5 / 3 / 5), « Tout voir » au-delà de N + 1 ; à la coupure, exactement
  deux ex aequo → les deux, plus de deux → coupe nette ; Grosses volées classées par seuil ;
  Victoires « v / j » sur chaque ligne, manches retirées de l'écran ; pieds de carte retirés.
- **Modale au retour du téléphone** (CONVENTIONS § 9) : entrée d'historique sur la même URL
  (`location.state`), ouverte **au clic seulement**, fermée **toujours** par `navigate(-1)`,
  garde `useRef` contre le double recul ; `<dialog>` natif monté en permanence, jamais `flex`
  dessus, aucun nettoyage d'effet qui le ferme (piège StrictMode). Fermée par retour, Échap, ✕ et
  appui sur le voile. Largeur écran − 2 × 16 px (`max-w-lg`), hauteur ≤ 90 `dvh`.
- **Ruban d'onglets** : l'onglet actif est ramené dans la vue (ouverture, appui, période) par le
  seul `scrollLeft` du ruban, jamais `scrollIntoView`.
- **Écarts acceptés** par l'utilisateur : titre `laiton` à 4,40:1 en clair (U4, cartes et
  modale) ; zone d'appui des bascules à 48 px en hauteur seulement (Q3).
- **Boucles** : 5 tours (plafond atteint sans escalade) — Test → Dev ×2, Révision 1, Revue →
  Dev ×2. L'agent Test n'avait pas de shell : contre-épreuves exécutées par l'Orchestrator ou le
  Dev, toutes conformes.
- **Tests : 1065 → 1194** sur la branche (base `6109013`) ; **1233** après rebase sur `5644892` (`nouvelle-partie-parcours`). Conflits du rebase : charte, PROJECT_PLAN, `pictogrammesEmplacements.test.tsx` — les deux apports gardés.

### Lot `regles-du-jeu`

- **Historique** (après la Révision 1) : la feuille de règles n'est pas une route. Le livre
  ouvre par `useModaleAuRetour('regles', ['ouverte'])` : une entrée sur la **même URL** (état
  courant conservé, `regles: 'ouverte'` validé contre une liste fermée ; l'ancien `regles: true`
  est ignoré), poussée **au clic** seulement (jamais `<Link>`, jamais dans un effet). Toute
  fermeture — croix, Échap (`cancel` annulé puis relayé), retour, appui à côté — recule par
  `navigate(-1)`, une seule fois (garde « en vol » remise à zéro à chaque `location.key`, ce qui
  tient aussi C1). Le `<dialog>` est monté en permanence, son contenu seulement ouvert
  (`useDialogueNatif`) ; le focus revient au livre par `retour`. **U2** (utilisateur) : rechargée
  feuille ouverte, la feuille se rouvre, rubriques repliées, et le retour la ferme. Résiduels :
  R1, R2, iPhone, à vérifier sur appareil (§ 0).
- **Domaine** : `suggestCheckout(1, n, libre) = [S1]` ; `checkoutRange` (170 + bogey / 180 +
  `FREE_OUT_NO_FINISH`), listes vérifiées contre l'algorithme ; entraînement inchangé (toujours
  `{ doubleOut: true }`). Port `GetCheckoutRange` : borne de « Pas de finish » (`useX01`) et
  listes de la feuille.
- **Texte** : X01 et Cricket mot pour mot depuis la planche, sauf Q1 (bust compté en fléchettes
  lancées, First 9 sur 3 volées, volée de 3 fléchettes « au plus ») ; variantes non dessinées,
  Tour du monde et entraînement écrits d'après `CLAUDE.md` et le code (Q2-A), à relire.
- **Jetons** (Q5, Q6, Q8) : `craie-2-regles`, `craie-3-regles`, `laiton-texte`, `rouge-texte`,
  `vert-texte`, `filet`, `filet-doux`, `chene-doux`, `voile` — charte § Palette.
- **Bandeau** : livre en marges négatives ; portrait 73 px (inchangé), paysage 49 → 51 px. Le
  sous-titre X01 « 501 · premier à 2 manches » se tronquait à 390 px : **DV1**, tranché par
  l'utilisateur, resserre la rangée (`gap-2` en portrait, `gap-3` en paysage) ; la ligne du nom
  suit (`pl-11` : 40 px de flèche tirés de 4 px + 8 px d'écart, constat 2 de la Revue).
- **C1** (Test) : après retour puis « suivant », la croix ne fermait plus — la garde contre le
  double recul se remet désormais à zéro à chaque entrée d'historique (`location.key`).
- **C6** (Test, tranché par l'utilisateur) : `CLAUDE.md` aligné sur le code (First 9 = 3 premières
  volées ; Tour du monde, même nombre de volées).
- **Révision 1** (Revue → Archi, rebase sur `statistiques-podium`) : convergence sur le mécanisme
  de la `Modale`. le hook propre à la feuille est supprimé ; `useModaleAuRetour('regles', ['ouverte'])` porte
  l'état ; la discipline du `<dialog>` sort de `Modale` dans `useDialogueNatif`, partagé (`Modale`
  inchangée, ses tests aussi) ; la feuille est montée en permanence, son contenu seulement ouvert ;
  un appui à côté la ferme (U1, décision de l'utilisateur) ; mesure paysage par
  `closest('.bandeau-match')` ; tête en `<div>` ; « En bref » du Tour du monde lu dans le parcours
  (C9) ; `Phrase` commune ; garde `themeBoundary` des neuf jetons réservés.
- **Tour 3** (Test → Dev, passe 3) : **P3-1**, régression de la correction du constat 2 —
  `pl-11font-score` (espace manquante) retirait au nom de partie son retrait et sa police sur les
  quatre écrans de match ; invisible au lint, au build et aux tests, trouvée en lisant le code ;
  corrigée, une assertion de classes la garde désormais. **P3-7** (tranché par l'utilisateur) :
  pour un parcours importé arbitraire, « En bref » et « Ce soir » partagent la détection de la
  forme du domaine ; tout autre parcours s'écrit en liste neutre (« Le parcours de cette
  partie : 20, hors cible et 19. ») ; `legendeParcours` compte les cases sans `MISS` (« 1 case »,
  « 0 case » pour `['MISS']`). Trous de test P3-2 à P3-6 comblés.
- **README** : suggestion de sortie et listes « pas de finish » des deux sorties, livre ouvert.
- **Dettes** : `labels.ts` chargé au démarrage (+5,2 kB gzip, ci-dessous) ; une entrée `regles`
  sans entrée dessous (ouverture directe sur l'URL) rend la croix inopérante — limite partagée avec
  la `Modale`.
- **Poids** : `labels.ts` passe en chunk partagé chargé au démarrage ; JS initial 92,1 → 107,4 kB
  (gzip 29,3 → 34,4 kB), précache 827,8 → 855,7 Kio.
- `SCORES`, `LEGS`, `SETS`, `SORTIES` déménagent dans `src/ui/reglagesPossibles.ts` (D8).
- **Tests : 1091 → 1158** (passe 1) **→ 1172** (boucle 1) ; **1329** après rebase sur `26a39fb`
  (`statistiques-podium`) et Révision 1 ; **1340** après le tour 3. Mené **en parallèle** de
  `statistiques-podium` (worktree) ; conflits du rebase : CONVENTIONS, `rules/frontend-react.md`,
  PROJECT_PLAN — les deux apports gardés, puis fusionnés par la convergence. Boucles : 3 tours sur
  5 (Test → Dev ×2, Revue → Archi ×1). Hors périmètre, préexistant : l'entraînement dit
  « Sortie 8 » à l'Accueil et « Manche 3/10 » au bandeau (vocabulaire désormais décrit dans
  `CLAUDE.md` § Entraînement).


### Lot `rejouer`

Session : `docs/lots/rejouer/` (niveau `light` à l'ouverture, **relevé à `high` en cours de lot** : une décision s'ajoute à `CLAUDE.md` § Décisions structurantes ; aucune surface gravée de code touchée). Planche
`docs/maquettes/derniers/derniers.html`, piste 2 (`np2`) ; mené **en parallèle** de
`reglages-par-usage` (worktree).

- **Lecture seule de l'historique** : port driving `GetReplayableConfigurations` +
  `GetReplayableConfigurationsUseCase(matches, players)` (fenêtre `REPLAY_WINDOW` = 50, comme
  Parties) ; câblé dans `container.ts`. Groupes clés = mode + réglages + joueurs **triés** ; les
  cibles (Cricket, Tour du monde) et la plage des restes y figurent aussi, pour qu'une partie à
  cibles non standard ne se fonde jamais dans le groupe standard. Liste **non coupée**.
- **Filtre « reproductible »** dans `src/ui/rejouer.ts` (module neutre, comme `reglagesPossibles.ts` :
  `application` ne peut pas le lire) : valeurs dans `SCORES` / `LEGS` / `SETS` / `SORTIES`, cibles et
  plage du défaut ; puis `slice(0, 3)`. Les profils absents de la liste chargée sont écartés au même
  endroit, **avant** la coupe.
- **Lancement factorisé** : `lancer(mode, valeurs = courants)` de `useNouvellePartie` reste le seul
  chemin ; `rejouer` y passe les valeurs en argument (la lecture des préférences serait périmée
  juste après un `setX`) tout en les écrivant. Nom : `{}` explicite **et** saisie remise à la
  proposition (un nom tapé avant un retour ne fuit pas). ▶ vers l'Ordre porte `ETAT_PARCOURS`.
- **`CLE_REJOUER`** sous `CLE_HISTORIQUE` : la liste est relue au montage de l'étape 1, et le
  lancement invalide `['historique']`.
- **Chargement** (arbitrage utilisateur, corrige U6) : tant que l'historique ou les profils chargent,
  **rien** sous la barre d'étapes (ni rangée, ni tuiles : pas de bascule, pas d'appui perdu). Une fois
  chargé : configurations rejouables → « Rejouer » + rangée compacte ; aucune → tuiles 2 × 2.
- **Libellés** (`labels.ts`) : `titreRejouer`, `resumeRejouer`, `libelleDateRelative` (jours
  comptés sur le calendrier local), `libelleNFois`, `ariaRejouer`.
- **S1** (Sécurité) : une sauvegarde importée peut porter `doubleOut: "oui"` (`backupSchema` ne contrôle
  pas le type) ; le filtre exige des booléens, sinon la configuration est écartée. **S2** (décision
  utilisateur) : plus de `MAX_JOUEURS` (4) joueurs = non reproductible par le parcours, écartée.
  Un entraînement à plusieurs est écarté aussi, par une branche **défensive** (C1) : le domaine
  refuse déjà un tel entraînement. Constantes `MAX_JOUEURS`, `JOUEURS_ENTRAINEMENT` dans
  `reglagesPossibles.ts`.
- **Décisions de relecture** : **Q1** pictogramme de la rangée gardé à 24 px (la planche : 28) ; **Q2**
  la date affichée et le tri sont ceux du **lancement** (`createdAt`), jamais de la dernière
  modification ; **Q3** l'entraînement se dit « Solo » dans la rangée compacte seulement (libellé
  court du filtre de Parties).
- **Suites hors lot** : contrôle de type de `doubleOut` / `doubleIn` dans `backupSchema` ; journaux
  importés non projetables qui font échouer la lecture (constat 11 de l'index).
- **Tests : 1340 → 1408** (use case aux fakes, filtre et libellés, UI de l'étape 1). Risque
  accepté : « N fois » ne compte que dans la fenêtre de 50 parties.
- **Reste** : relecture à l'écran (portrait, paysage, 360 px — quatre noms de jeu à 80 px, pastilles
  à la ligne —, thèmes sombre et clair).

### Lot `reglages-par-usage` (lot 12 de la refonte de la charte)

- **Voyants** : Dernier export (étiquette « Dernière sauvegarde » de la planche raccourcie par l'utilisateur : deux lignes à 125 % de police à 360 px ; jours du calendrier local, « Hier » = la veille ; laiton au-delà
  de 30 jours et pour « Jamais » ; « Il y a N mois » dès 60 jours, mois = jours ÷ 30 arrondi en
  dessous ; date future → « Aujourd'hui » sans alerte ; valeur illisible → « Jamais ») ;
  Application (« Installée » en `vert-etat`, « Installer » = invite native, « Comment ? » = guide
  `#installer`, rendu en `ios-manual`, `ios-other-browser`, `unavailable`). Calculs purs dans
  `ui/voyants.ts`, durée par `joursCalendairesEntre` (`jourCalendaire.ts`, composantes locales
  reportées en UTC : exact aux changements d'heure).
- **Date du dernier export** : préférence d'appareil (`useDernierExport`), écrite par l'écran
  **après** le téléchargement, à l'horodatage `exportedAt` de la sauvegarde ; jamais par
  l'import ; validée à la relecture (nombre fini, sinon « Jamais »). Gravé dans `CLAUDE.md`.
  « Export réussi » = fichier remis au navigateur sans erreur (U9).
- **Compte** : port driving `GetDeviceContents` (deux `listAll()`), une source pour la ligne et
  « Gérer les joueurs » ; rien d'affiché en chargement ni en échec, jamais un faux « 0 ». Repli
  `count()` dans les dépôts si une lenteur était mesurée.
- **Vignettes** : six jetons `apercu-*` constants (copies de `feutre`, `craie`, `laiton` de chaque
  thème, redéfinis à l'identique sous le clair) plutôt qu'un thème local : le mécanisme du thème
  reste intact. Garde d'égalité et garde de réservation (table jetons → fichiers).
- **Protection** : une phrase sous le duo, rappel d'exporter dans les trois états ; « Demander la
  protection » (ex-« Redemander ») hors de l'`<output>`, zone d'appui 48 px par pseudo-élément ;
  refus orienté vers le voyant Application (réduit si l'app est installée). Plus de bouton ni de
  lien d'installation sous la phrase.
- **`Button`** : tailles `xs` / `sm` (56 px comme le `.cta` de la planche — Revue, boucle 5 ;
  interlettrage dans la taille) pour le duo à 360 px. Valeur de voyant en gras, interligne 1,1
  (Revue, boucle 5).
- **Boucle 1 (Test)** : un horodatage hors de la plage de `Date` (`1e20`) affichait « Il y a NaN
  mois » en vert ; validé dans `useDernierExport` **et** dans `vueVoyantSauvegarde` (« Jamais »).
- **Politique** : localStorage cite « la date du dernier export » ; « Annoncer les volées » est
  dans Réglages → Affichage ; date « 17 octobre 2026 ».
- **Hors demande** : `docs/captures/reglages.png` du README montre l'ancienne page.
- **Rebase sur `rejouer`** (`63cb636`, mené en parallèle) : conflits sur CONVENTIONS (clés de
  requête, 25 ports driving), charte (les deux sections), PLAN (§ 0, § 4, § 6) — les deux apports
  gardés ; index repris de `main` puis régénéré. **1497 tests**. Préexistant sur `main` : le test
  « crée une partie depuis l'accueil… » (`parcours.test.tsx`) dépasse ses 5 s en suite complète,
  vert seul.

### Lot `vocabulaire-anglais` (lot A des retours des beta-testeurs)

- **Voix** : le port `Announcer.say` prend une `Annonce`, suite de segments `{ texte, langue }`
  (`Langue` = `'fr-FR' | 'en-US'`). « Bust » et « checkout » se disent en `en-US` au milieu d'une
  phrase française ; la langue vient de `labels.ts` (`fr()`, `en()`, `LANGUE_DE_BASE`), jamais de
  l'adapter, pour que l'i18n annoncée change la langue de base sans refaire le mécanisme.
- **`SpeechAnnouncer`** : un seul `cancel()` par annonce, un énoncé par segment dans l'ordre,
  `rate = 1.1` ; voix par `lang` exact (le `_` d'Android normalisé), puis préfixe, puis voix `fr`,
  puis `voices[0]` ; cache par langue vidé sur `voiceschanged`, liste vide jamais figée ; segments
  vides ignorés ; sans voix `en-US`, l'annonce se dit quand même.
- **Écran** : « Sortie » devient « Checkout » partout (règles, entraînement, réglages, cartes,
  récaps) ; rail X01 « Checkout libre » / « Checkout sur un double » (`LIBELLE_CHOIX_SORTIE`),
  l'Entrée garde « Libre » / « Sur un double » ; « le premier qui fait le checkout gagne ».
  Statistiques : « Hors » à la place de « 0 » (`BlocCible`, affichage seul). Identifiants et clés
  persistées inchangés (`SortieRules`, `entrainement:sorties`…). Gravé dans `CLAUDE.md`.
- **Débordements** (relecture à l'écran) : « Checkout » plus long que « Sortie » ; interlettrage
  réduit dans `LigneJoueur` et `CartePartie`, police inchangée (plancher de la charte).
- **Tests : 1497 → 1516** (adaptateur aux fausses `speechSynthesis`, annonces par langue, « Hors »).
  Préexistant sur `main` : `parcours.test.tsx` dépasse ses 5 s en suite complète, vert seul.
- **Reste** : écoute de l'accent sur vrai téléphone (Android, iPhone ; segment `. À toi, X`
  éventuellement lu « point »). Hors lot : « MANCHE1/10 » et « RÉUSSIES0 » sans espace à
  l'entraînement ; le moment « Checkout ! » est inatteignable en X01.

### Lot `annulation-volee` (retours 8 et 3 des beta-testeurs ; lots C et D de l'étude fondus)

- **Annulation** : `UndoLastVisit` et les trois `undoLastVisit` rendent `ReopenedVisit<S> = { state,
  darts }` ; le journal est tronqué comme avant (`slice(0, -1)` ; à l'entraînement, le `RoundStarted`
  final puis le `VisitRecorded`), la projection est faite **avant** l'écriture, et les fléchettes de la
  volée moins la dernière reviennent dans `dartsEnCours`. Les jalons (`LegWon`, `SetWon`,
  `MatchFinished`) sont déduits de la projection, jamais écrits : rien d'autre à retirer. Aucun format
  persisté, aucune migration, `backupSchema` intact.
- **Confirmation (forme B de la planche)** : `sortieEnAttente` est dérivé de l'aperçu (X01
  `outcome === 'CHECKOUT'` à chaque manche ; Cricket `state.finished`, nom du **gagnant**, y compris en
  cut-throat ; Tour du monde `completesTour`, ajouté à `TourDuMondePreview`).
  Jamais sur un bust, jamais à l'entraînement. `BoiteConfirmation` + `useConfirmationSortie` sur
  `useModaleAuRetour('confirmation', ['sortie'])`. Fermer sans choisir (retour, Échap, voile) = *Corriger*.
- **Libellé** : « Annuler S5 », nom accessible « Annuler S5 de Kevin » ; l'entraînement passe enfin
  `annulation` au pavé. Pause d'1 s inchangée.
- **Écarts à la planche** (Ajustements) : titre `text-xl`, texte `text-sm`, boutons `text-xs` (la garde
  `typographieBoundary` interdit `text-[…]`) ; voile : d'abord `feutre-nuit/65`, remplacé par le jeton `voile` à la relecture (voir plus bas) ; boutons plats de 52 px sans `Button`.
- **Boucle 1 (Test → Dev)** : l'entrée `confirmation` héritée d'un rechargement était dépilée deux fois
  sous `<StrictMode>` (serveur de dev) ; ref `depilee` + test sous `StrictMode`.
- **Acceptés** : volée rouverte et fléchette de sortie en attente perdues si l'app se ferme ; reste de
  la manche suivante re-tiré à l'entraînement après correction ; **N-1** (échec d'écriture après
  *Valider* : fléchette en attente, boîte non rouverte, seule « Annuler » débloque, aucune perte) accepté
  tel quel.
- **Relecture à l'écran** (port 5202, Chrome, vraies parties) : appui fantôme sur le pavé après *Corriger*
  à 360×740 → garde `GARDE_APRES_FERMETURE_MS` = 500 ms (`pavePret()`), étendue à *Valider* à la
  2e passe de Revue (fléchette fantôme au joueur suivant ; décision de l'utilisateur) ; voile beige sur beige en clair →
  jeton `voile`, entrée à part de la garde `themeBoundary`. Acceptés : boîte centrée qui masque la ligne du
  joueur en paysage ; appui hors de la boîte = *Corriger*.
- **Travail en parallèle** avec les lots A et E (worktree, port 5202). **Rebase sur `vocabulaire-anglais`** (`f545419`) : conflits sur l'index (pris de main, régénéré), PLAN § 6 (les deux entrées gardées) et manches.test.tsx (imports) ; Announcer.say prend maintenant une Annonce (banc de test adapté) ; **1571 tests**, lint, typecheck, build verts. Le lot E (phrases-victoire) reste à fusionner.

### Lot `phrases-victoire` (retour 7 des beta-testeurs ; lot E de l'étude)

✅ **Fait — 1590 tests verts** (1585 après Dev ; Test boucle 1 : +5 tests de couverture), lint, typecheck, build verts. Niveau `light` : tout en `src/ui`, aucun format persisté, `/confidentialite` inchangée.

- **La voix dit la phrase de victoire** : `phraseVictoire(matchId)` — la **même** que le résumé —, dans le
  **même `say`** que le résultat (`annonceFinDeVolee`, 3e paramètre optionnel ; le « . » joint reste dans
  le segment `fr`). 5 phrases ajoutées (9 au tirage).
- **Quand** : après *Valider la sortie*, sur le jalon `MatchFinished`. X01 : victoire du **match** seulement
  (ni `LegWon` ni `SetWon`) ; Cricket : la fléchette qui gagne, cut-throat compris ; Tour du monde : la
  **fin de partie** (`winnerId` non nul, donc jamais en nul), « Tour bouclé ! » gardé à la fléchette qui
  boucle (et dit avant la phrase si le dernier du tour boucle et gagne). Jamais sur un bust, jamais à
  l'entraînement, rien si la voix est coupée.
- **Test** : passe sans shell (relecture statique) ; commandes relancées par l'Orchestrator. Boucle 1
  (Test → Dev, tests seulement) : voix coupée, égalité voix-résumé au Tour du monde, cas entraînement
  vert à vide, *Corriger* muet.
- **Reste, vrai téléphone** : écoute du « — » et du « ? » de « Bien joué — on remet ça ? », du « . » en
  tête de segment `fr` après un segment `en`, durée de la phrase après « Checkout ».
