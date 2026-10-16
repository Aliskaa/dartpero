# CLAUDE.md — Dartpéro

Contexte permanent du projet pour Claude. **À lire en début de session.**

| Fichier | Rôle |
| ------- | ---- |
| **`CLAUDE.md`** (ici) | Le résumé opérationnel et les **décisions gravées**. En cas de désaccord, c'est lui qui gagne. |
| [`README.md`](README.md) | La vitrine : ce que fait l'app, ses captures, comment la lancer. |
| [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) | Le plan détaillé, lot par lot, avec ce qui reste. |
| [`docs/CHARTE_GRAPHIQUE.md`](docs/CHARTE_GRAPHIQUE.md) | Le référentiel design : tokens, thèmes, composants, ce qu'il ne faut pas faire. |
| [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md) | Le manuel du déploiement : Firebase Hosting, en-têtes de cache, service worker, contexte sécurisé en dev, icônes, installation (§ Installation et manifeste), politique et `assetlinks.json` (§ Confidentialité et Digital Asset Links). |
| [`.claude/CONVENTIONS.md`](.claude/CONVENTIONS.md) | Le **comment** : les patterns de code concrets (Value Objects, use cases, ports, hooks, tests…) extraits en relisant `src/` et `tests/` — complète les décisions d'ici, ne les redécide jamais. |
| [`.claude/README.md`](.claude/README.md) | Le **workflow agentique** : `/intake`, `/orchestrate <id> [high\|light]`, `/audit`, `/refresh-architecture`, leurs agents et les **surfaces gravées** qui forcent le niveau `high`. Règles de travail courtes dans [`.claude/rules/`](.claude/rules/README.md). |
| [`.ai/architecture-context.md`](.ai/architecture-context.md) | **Index** généré, lu **en premier** par les agents de phase : il dit où lire, pas ce que disent les sources. **Pas une source de vérité** : à régénérer (`/refresh-architecture`) dès qu'une décision est gravée ici. |
| `docs/captures/` | Les captures du README (390 × 844). Refaites à la main : `playwright-core` pilote Chrome sur `vite preview`, une base de démonstration est semée dans IndexedDB, puis `sharp` réduit les PNG. Les journaux semés sont **simulés à travers les vraies règles** — un journal écrit à la main décalerait l'attribution des volées. |

> Claude maintient ce fichier : le mettre à jour dès qu'une décision durable est prise
> (nouvelle convention, choix de package, décision ouverte tranchée…).
> Il ne garde que le résumé opérationnel, les décisions gravées et les pièges vitaux : l'état,
> le journal et le manuel vivent dans les fichiers de la table ci-dessus, et l'on y renvoie.

---

## Le projet en une phrase

PWA mobile (iPhone + Android) : **compteur de parties de fléchettes** entre potes — X01
(501 / 301 / 701), saisie fléchette par fléchette, suggestions de checkout, stats et
historique. **100 % local, hors ligne, sans compte.**

Nom affiché : **Dartpéro** (fléchettes + apéro). Slug technique : `dartpero`.

> **Contexte d'usage (dicte tout le design)** : le téléphone est **posé** — contre un mur, sur
> une table, sur une étagère — pendant que plusieurs joueurs se relaient à la ligne de lancer
> (l'*oche*). Un joueur tape les scores à 30 cm, les autres lisent le tableau à **2-3 mètres**.
> Souvent dans un garage ou une cave mal éclairés, **sans réseau**.
> → **lisibilité à distance** et **zéro friction au démarrage** priment sur tout le reste.

---

## Décisions structurantes (NE PAS recontredire sans demander)

- **PWA**, pas d'app native — installable sur iPhone + Android via « Ajouter à l'écran
d'accueil ». Pas de passage par les stores.
- **Backend = architecture hexagonale (Ports & Adapters) + SOLID.** Exigence forte de
l'utilisateur, à respecter strictement.
- **PAS de Firebase DANS L'APP, PAS d'authentification, PAS de réseau.** Décidé. Une partie se
joue hors ligne, autour d'un seul téléphone : un écran de login serait rédhibitoire. Toute la
persistance passe par **Dexie (IndexedDB)** derrière les ports `MatchRepository` /
`PlayerRepository`. Une éventuelle sync cloud serait **un adapter de plus**, jamais une
dépendance du cœur.
⚠️ **Firebase *Hosting* est une exception qui n'en est pas une** (voir § Déploiement) : c'est
un serveur de fichiers statiques, il ne met pas un octet de SDK dans le bundle. Aucun
`import` de `firebase` dans `src/`, jamais — ni Auth, ni Firestore, ni Functions.
⚠️ **La politique publique `/confidentialite` affirme ce « pas de réseau »** (URL donnée à la Play Console, texte
dans `SECTIONS_CONFIDENTIALITE`, `src/ui/labels.ts`). Toute capacité réseau, permission, cookie
ou donnée stockée nouvelle se livre **avec** la mise à jour de ce texte et de sa date. Seul le
réseau a un fil-piège (`tests/architecture/reseauBoundary.test.ts`) ; le reste, c'est la relecture.
- **Les joueurs sont des profils LOCAUX**, pas des comptes : pseudo + couleur, créés en 2
secondes, portant leurs stats **sur cet appareil**. Filet de sécurité obligatoire :
**export / import JSON** de toute la base (lot 4).
- **Le match est une liste d'événements** (`MatchEvent[]`), l'état affiché est une
**projection** rejouée depuis ces événements. C'est le choix qui rend l'**annulation**
triviale et fiable (on se trompe de saisie très souvent en pleine partie).
- **Saisie fléchette par fléchette, et elle seule** (grille 1-20 + 25, bascule S/D/T
**momentanée** — elle retombe sur Simple après chaque fléchette) : c'est la **condition
technique** des stats de doubles et de l'entraînement.
⚠️ **La « saisie hybride » n'existe plus.** Le mode « rapide » (un score de volée 0-180 au
lieu de trois fléchettes) était une décision de cadrage ; l'utilisateur l'a **retiré après
plusieurs parties réelles, faute de s'en servir**. Décision renversée en connaissance de
cause, pas par oubli — ne pas la « restaurer » en croyant réparer un accident (voir
l'incident `61b60ac` plus bas, qui lui en était un). Tout le code est parti avec :
`PaveRapide`, le port `BuildVisitFromScore`, son use case, `x01/scoring.ts` (`composeVisit`)
et `findExactScore`. Récupérable dans l'historique à `d531a7e` si l'envie revenait.
- **Modes de jeu : X01 et Tour du monde** (lot 5a), **entraînement solo** (lot 5b), puis
**Cricket** (lot 5c). Killer et Shanghai restent **hors périmètre v1** — la couture
`GameMode` (`src/core/domain/games/index.ts`) les accueillera sans refonte, elle l'a
maintenant prouvé deux fois.
- **Réglages X01 proposés à la création** (étape 2 de Nouvelle partie, mémorisés par
`usePreference`) : **501**, **2 manches à gagner**, **1 set** (pas de sets), **double out
désactivé**, **double in** désactivé.
⚠️ **Double out : décoché à l'écran, activé dans le domaine, à dessein.** L'utilisateur a
choisi la sortie libre par défaut (`577dc5f`, entériné au lot `nouvelle-partie-en-etapes`) ;
l'écran passe **toujours** `doubleOut` à `X01Config.create`. Le défaut du domaine reste
`doubleOut: true` : c'est la règle standard, les tests de règles s'y adossent, et
`backupSchema` en complète une sauvegarde qui n'aurait pas le champ. Ne pas « aligner » l'un
sur l'autre.
⚠️ **On ne dit plus « best of N ».** C'est une convention à **deux** joueurs : elle compte
les legs *joués*, et ne tient que parce qu'à deux, « premier à 2 » ne peut pas dépasser 3
legs. À trois ou quatre, la même partie peut en durer six — le libellé mentait. Le domaine
a toujours stocké `legsToWin` (« premier à N ») : c'est ce que l'UI affiche (« premier à N
manches »), via `libelleLegs` / `libelleLegsCourt` (`src/ui/labels.ts`).
`X01Config.legsForBestOf` survit pour le défaut et ses tests, mais **plus aucun écran ne
l'appelle**.
- **À l'écran, on dit « manche », jamais « leg »** (lot `nouvelle-partie-en-etapes`) ; « leg »
reviendra avec une éventuelle version anglaise. Le code garde `Leg`, `legsToWin`, `LegWon`,
`libelleLegs`… et les clés persistées ne se renomment pas (`partie:legs`). « Set » reste
« set ». Ce vocabulaire vit dans `src/ui/labels.ts`, annonces vocales comprises.
- **Nouvelle partie en étapes** : le jeu, puis les joueurs et réglages, puis l'ordre de jeu
(dès 2 joueurs). ⚠️ **Chaque étape est une route** (`/nouvelle-partie`,
`/nouvelle-partie/:jeu`, `…/ordre`, `…/joueurs`), jamais un état interne : c'est ce qui fait
que le retour du téléphone ramène à l'étape précédente. L'entraînement est une carte de
l'étape 1 (`/entrainement` ne fait plus que rediriger) ; l'onglet Joueurs a quitté la barre
du bas (Réglages, puis Joueurs).
- **Thème clair / sombre / système**, dans les Réglages. ⚠️ Le défaut reste **sombre**, pas
« système » : le cadrage est un garage mal éclairé, le sombre *est* l'app et le clair est une
option. Le thème clair est la **même feuille de match** — encre sur papier plutôt que craie sur
feutre — obtenu en redéfinissant les **valeurs** des tokens sous `html[data-theme="clair"]`,
sans toucher une seule classe de `src/ui`.
- **TypeScript partout.**
- **Stack frontend figée** : React 19 + TS + **Vite** (`vite-plugin-pwa`), **React Router**,
**TanStack Query**, **Tailwind CSS v4** + design system maison dans
`src/ui/composants/commun/`, **Dexie.js**, **Vitest** + Testing Library, **lucide-react**.
- ⚠️ **TanStack Query n'orchestre PAS le match en cours.** Query sert à l'historique, aux
profils et aux stats (lecture async). Le match en cours est un **état local synchrone**
ultra-réactif (tap → score) : `useReducer` + Context dans `src/ui/hooks/useMatch.ts`, qui
appelle les use cases. **Zustand seulement si** ce reducer déborde — pas avant.
- **Outillage : Biome** (lint + format). **JAMAIS ESLint ni Prettier.** Frontière hexagonale
via `override` Biome sur `src/core/**` + `noRestrictedImports` (bannir `dexie`, `react`,
et les API navigateur).
- **Wake Lock obligatoire dès le lot 3** : l'écran ne doit pas s'éteindre pendant une partie,
sinon l'app est inutilisable en conditions réelles.
- **Stockage persistant demandé au démarrage** (lot `stockage-persistant`) : port driven
`PersistentStorage` (`Services.devices`, même exception que `screenLock`), seul l'adapter lit
`navigator.storage`. L'état se lit dans Réglages → Sauvegarde, jamais ailleurs (zéro friction).
⚠️ **« Protégé » n'est pas une sauvegarde** : désinstallation, effacement du site ou perte du
téléphone vident la base quand même — le rappel d'exporter s'affiche dans **les trois** états.
- **Invitation à installer** (lot `installation-guidee`) : port driven `AppInstallation`
(`Services.devices`, même exception que `screenLock`) ; seul l'adapter lit `beforeinstallprompt`,
`appinstalled`, `display-mode` et `navigator.standalone`. ⚠️ Les services naissent dans
`src/main.tsx`, **avant** `createRoot`. Ligne discrète sur l'Accueil (« Plus tard » mémorisé,
Accueil seulement), entrée complète dans Réglages → À propos. Jamais sur un écran de partie,
jamais ouverte d'elle-même.
- **Nom de partie** (lot `nom-de-partie`) : seul un nom **tapé** s'écrit — champ facultatif
`name` de l'événement d'ouverture des quatre modes, 30 caractères au plus, espaces autour
retirés (`MatchName.of`). Le nom par défaut (« Dimanche soir » ; nuit de 0 h à 5 h, au nom
du jour du calendrier : dimanche 1 h → « Dimanche nuit ») est un **libellé recalculé à
l'affichage** depuis `createdAt` (`labels.ts`) : ne jamais l'écrire, ni « compléter » les
anciennes parties. L'UI lit l'heure par `services.clock` (même exception que `devices`),
jamais par `Date.now()` — garde `tests/architecture/horlogeBoundary.test.ts`.
⚠️ **Le champ du nom est à l'étape 2** (« Nom de la partie · facultatif », sous la fiche de
réglages), plus à l'étape 1 (lot `nouvelle-partie-parcours`) ; la règle ci-dessus est inchangée.
- **Parcours Nouvelle partie, habillage** (lot `nouvelle-partie-parcours`) : une **barre d'étapes**
(`BarreEtapes`, `1 · JEU`, `2 · JOUEURS`, `3 · ORDRE` ; deux segments à l'entraînement ; Ordre
grisé seul en piste) en tête de chaque étape, **non interactive** (on revient par le retour) ;
étape 1 en tuiles 2 × 2 ; étape 2 en fiche de réglages par jeu. ⚠️ **« Tirer au sort » est un
mélange visible** à l'étape Ordre : port driving `ShuffleOrder` (`ShuffleOrderUseCase`, même
`RandomSource` que les lancements), vrai hasard (le tirage peut redonner l'ordre d'avant, aucune
relance), bref mouvement de la feuille, ordre écrit dans `partie:joueurs` comme un déplacement à
la main. L'interrupteur « Ordre aléatoire » n'existe plus ; le flag `shuffle` des commandes de
lancement reste, sans appelant UI (dette), et la clé `partie:ordre-aleatoire` reste orpheline.
- **Accueil en parties récentes** (lot `accueil-parties-recentes`) : cartes « Aujourd'hui » puis
« Cette semaine » ; la partie en cours, épinglée en tête, est seule à porter « Reprendre ».
⚠️ **« Abandonnée » est dérivée, jamais écrite** : `matchStatus`, et lui seul, la calcule contre
la partie en cours **globale** (`GetOngoingMatch`), jamais contre une liste filtrée par mode —
même statut à l'Accueil et dans Parties. La mise en page de l'Accueil, elle, n'est pas gravée.
- **Règles au livre ouvert** (lot `regles-du-jeu`) : un livre (`LivreRegles`, 48 px) à droite de
l'en-tête de l'étape 2 et du bandeau de match des quatre modes ouvre une feuille de règles
**par-dessus** l'écran (`FeuilleRegles`, `<dialog>` natif), **jamais une route** : la volée en
cours survit. ⚠️ **Même mécanisme que la `Modale` des Statistiques, et lui seul** :
`useModaleAuRetour` (clé `regles`) pour l'état, une entrée d'historique sur la même URL qu'on
dépile pour fermer, et `useDialogueNatif` pour le `<dialog>` ; pièges : CONVENTIONS § 9.
Fermée par la croix, Échap, le retour ou un appui à côté. Le premier retour ferme la
feuille, le second fait ce qu'il faisait. Le texte décrit **les règles que Dartpéro applique**,
suit les réglages de la partie (la règle de ce soir en entier, l'autre en gris) et vit dans
`labels.ts` (`reglesX01`…) ; **un lot qui change une règle met à jour sa rubrique**, dans le
même lot. « Les règles en entier » de la fiche n'existe plus.

---

## Règle d'architecture (la plus importante)

Les dépendances pointent **vers l'intérieur** :

```
ui / infrastructure  ───►  application (ports + use cases)  ───►  domain
```

- `src/core/domain/` : **0 import externe** (ni React, ni Dexie, ni API navigateur, ni `Date`
ni `Math.random` — ils passent par les ports `Clock` / `IdGenerator`).
- `src/core/application/` : importe uniquement `domain`. Définit les **ports**.
- `src/infrastructure/` & `src/ui/` : implémentent / consomment les ports.
- Le câblage ports → adapters se fait **uniquement** dans `src/composition/container.ts`
(composition root).

Si on me demande d'ajouter une capacité externe (voix, vibration, cloud, capteur…), c'est
**un nouvel adapter derrière un port**, jamais une dépendance dans le cœur.

---

## Règles du Tour du monde (référence — NE PAS improviser)

Le jeu de groupe de l'utilisateur, ajouté au lot 5a. **Ce n'est pas un exercice solo** : c'est
un mode de jeu à part entière, au même titre que X01.

- **Parcours** : on part du **20**, on descend 19, 18… jusqu'au **1**, puis on finit sur la
**bulle** — 21 cibles. La liste vit dans la config, donc dans le journal : une partie ancienne
reste rejouable même si le parcours par défaut change un jour.
- **Toucher, c'est atteindre le secteur.** Simple, double ou triple : aucune différence. La
bulle est validée aussi bien par l'anneau à 25 que par le centre à 50. Une fléchette hors
cible (`MISS`) ne vaut jamais.
- Une volée fait **3 fléchettes**, et l'on avance à **chaque** touche : on peut donc valider
trois cibles dans la même volée. La volée s'arrête sur la fléchette qui boucle le tour, comme
une volée de checkout au X01.
- ⚠️ **On finit le tour de table.** Quand un joueur boucle, la partie ne s'arrête pas : les
autres jouent leur volée, pour que tout le monde ait joué le même nombre de **volées**. Sans ça,
celui qui commence part avec une longueur d'avance imméritée.
- **Départage** : parmi ceux qui ont bouclé, celui qui y a mis le **moins de fléchettes**.
À égalité parfaite, **match nul** — on ne départage ni au hasard ni à l'ordre de passage.
- Il n'y a ni leg, ni set, ni bust : la partie tient en un seul parcours.

---

## Règles du Cricket (référence — NE PAS improviser)

Quatrième mode, ajouté au lot 5c. Le jeu tactique du lot : on n'y court pas après un score,
on ferme des cibles avant les autres.

- **Sept cibles** : **20, 19, 18, 17, 16, 15 et la bulle**. Comme pour le Tour du monde, la
liste vit dans la config, donc dans le journal — une partie ancienne reste rejouable si la
liste par défaut change un jour.
- **Trois marques ferment une cible.** Un simple vaut 1 marque, un double 2, un triple 3 :
un T20 ferme le 20 d'un coup. Les marques d'une même volée se cumulent normalement.
- **Le surplus marque des points**, mais **seulement si la cible est encore ouverte chez au
moins un adversaire**. Fermer le 20 avec un T20+T20 quand tout le monde l'a fermé ne
rapporte rien : c'est du gaspillage, et c'est voulu.
- ⚠️ **Une fléchette hors des sept cibles ne vaut rien** — ni marque, ni point. Le 12 n'existe
pas au Cricket.
- **Il n'y a pas de bust** : une volée ne peut jamais faire reculer. La volée fait toujours
3 fléchettes, sauf celle qui gagne la partie.
- **Victoire (variante standard)** : le premier joueur qui a **fermé les sept cibles** ET qui
possède **un score supérieur ou égal** à celui de chaque adversaire. Fermer tout en étant
mené ne gagne pas — il faut d'abord rattraper les points.
- ⚠️ **Variante « cut-throat » : les points s'ajoutent aux ADVERSAIRES**, pas à soi. Marquer
devient une punition qu'on distribue, et **le plus petit score gagne** : on l'emporte en
ayant fermé les sept cibles avec un score **inférieur ou égal** à chacun. C'est la seule
règle du projet où le sens de la comparaison s'inverse — elle est testée des deux côtés.
- La partie tient en **un seul tour de table** : ni leg, ni set. À la différence du Tour du
monde, **on ne finit pas le tour de table** : la condition de victoire du Cricket exige déjà
d'être devant aux points, donc celui qui la remplit a mérité son avance.

---

## Règles de l'entraînement (référence — NE PAS improviser)

Le mode solo du lot 5b (`checkout-practice`), gravé au lot `regles-du-jeu` d'après le code
(`checkout-practice/config.ts`, `rules.ts`, `PlayCheckoutPracticeUseCase.ts`).

- Une séance compte **N manches** (`rounds`) : **5, 10 ou 20** au choix, 10 par défaut. Un
joueur, seul. À l'écran, ce nombre se choisit et se résume en **sorties** (étape 2, cartes,
« Ce soir », « Sortie 8 » à l'Accueil) ; la séance en cours compte en **manches**
(« Manche 3/10 », cartouche « Manche »).
- Chaque manche, un **reste est tiré au sort** parmi les restes **jouables de 41 à 170**
(plage non réglable). Jouable = sortable en 3 fléchettes sur un double : les bogey numbers
s'excluent d'eux-mêmes, **calculés**, jamais tabulés (`playableTargets`).
- ⚠️ **Le reste tiré est écrit dans le journal** (`RoundStarted`) : annuler une volée redonne le
même reste, jamais un nouveau tirage.
- **Une seule volée par manche** (3 fléchettes au plus) : sortie, bust ou trois fléchettes sans
finir, on passe à la suivante.
- **Toujours sur un double** : la résolution est celle du X01 (`resolveVisit`, partagé), en
`double out` sans `double in` — bust à reste `< 0`, `== 1`, ou `== 0` sans double.
- Résultat : le **taux de réussite** = manches réussies ÷ manches jouées. Pendant la volée, la
route conseillée suit chaque fléchette.
- **Hors statistiques** des joueurs (seul le X01 est cumulé). « On remet ça » relance une
séance identique, avec de **nouveaux** tirages.

---

## Règles du jeu X01 (référence — NE PAS improviser)

C'est ici que 90 % des compteurs amateurs se trompent. Ces règles sont la spécification du
domaine, elles doivent être couvertes par des tests.

**Fléchette**

- Segments : `1..20`, `BULL_SIMPLE` (25), `BULL_DOUBLE` (50).
- Multiplicateurs : simple / double / triple.
- **Le triple est interdit sur le bull.** Le `BULL_DOUBLE` (50) **compte comme un double**
pour la sortie.
- Une volée (*visit*) = **3 fléchettes maximum**. Elle s'arrête avant si le joueur sort
(checkout) ou si elle est annulée (bust).

**Bust — la volée entière est annulée, le score revient à sa valeur d'avant la visite :**

- reste `< 0`, **ou**
- reste `== 1` (impossible à finir sur un double, quand `double out` est actif), **ou**
- reste `== 0` sans que la **dernière** fléchette soit un double (quand `double out` est actif).

**Options**

- `double out` : quand il est actif, finir un leg exige un double. **Défaut du domaine :
activé** ; **proposé désactivé à la création** (voir § Décisions structurantes). Sans double
out, toute fléchette qui amène à 0 pile gagne le leg.
- `double in` : désactivé par défaut. Si activé, le score ne décompte qu'à partir de la
première fléchette qui touche un double.

**Checkouts** — ils suivent la sortie de la partie (lot `regles-du-jeu`, `checkoutRange`) :

- **Sur un double** : checkout **maximum = 170** (T20 · T20 · Bull). **Bogey numbers** — pas
de finish possible en 3 fléchettes, l'app affiche « Pas de finish » et **jamais** une
suggestion bidon : **169, 168, 166, 165, 163, 162, 159**. Suggestion dès que le reste est
`≥ 2` et `≤ 170` (1 est un bust).
- **Sortie libre** : maximum = **180** (T20 · T20 · T20). Pas de finish en 3 fléchettes :
**179, 178, 176, 175, 173, 172, 169, 166, 163**. Suggestion dès que le reste est `≥ 1`
(à 1, **S1**) et `≤ 180`.
- « Pas de finish » à l'écran X01 suit la même borne (170 ou 180), lue par le port
`GetCheckoutRange`, jamais en dur.
- Les deux listes (`BOGEY_NUMBERS`, `FREE_OUT_NO_FINISH`) sont des **références de test** :
l'algorithme ne les lit pas, il les redécouvre, et `checkout.test.ts` vérifie l'accord.

**Legs & sets**

- Un leg (« manche » à l'écran) est gagné par le joueur qui atteint **exactement 0**, sur un
double si `double out` est actif.
- Le joueur qui commence **alterne à chaque leg**.
- Premier à N legs (`legsToWin`, défaut 2), éventuellement groupés en sets : premier à S sets
(`setsToWin`, défaut 1, soit pas de sets) ; un set se gagne au premier à N legs.

**Statistiques**

- **Moyenne 3 fléchettes** = `(points marqués ÷ fléchettes lancées) × 3`.
⚠️ Une volée *busted* marque **0 point** mais ses fléchettes **sont comptées**.
- **First 9** = moyenne sur les **3 premières volées** de chaque leg (9 fléchettes, moins si
une volée s'arrête avant, `x01/stats.ts`).
- **% doubles (checkout %)** = doubles gagnants réussis ÷ tentatives de double.
- Compteurs : nombre de **180**, **140+**, **100+**, **60+**.
- **Meilleur leg** (« meilleure manche » à l'écran) = plus petit nombre de fléchettes pour
finir un leg.
- **Plus haut checkout** du match / du joueur.

---

## Charte graphique — « pub anglais / oche »

Référentiel complet : [docs/CHARTE_GRAPHIQUE.md](docs/CHARTE_GRAPHIQUE.md) — palette (sombre
**et** clair), typographie, vocabulaire de classes, composants communs, mouvement, disposition
de l'écran de match. **À consulter avant d'ajouter un écran ou un composant.**

Ce qui ne s'y discute pas :

- **Principe** : le décor n'est plus une matière, c'est une **structure** — la fiche de ligue
punaisée derrière le bar. Zéro dégradé de décor, zéro biseau, zéro angle arrondi.
⚠️ **Angle vif : un point de contrôle unique.** Les tokens `--radius-*` valent `0` dans
`@theme`, et les classes `rounded-*` ont été retirées de tout `src/ui`. Remettre un rayon dans
le `@theme` les rallumerait toutes d'un coup.
- **Écran de match** : deux zones nettement séparées — lecture (chiffres géants, lue à
2-3 m) et saisie (cibles ≥ 48 px, tapée à 30 cm) — jamais empilées en paysage. Maquette et
détail complet dans la charte graphique.

---

## Arborescence (cible)

```
src/core/domain/games/<mode>/  ← UN DOSSIER PAR MODE DE JEU ; games/index.ts = la couture
src/core/domain/services/      ⚠️ TRANSVERSES : un mode n'importe jamais un autre mode
src/core/application/          ports/driving · ports/driven · use-cases (+ backupSchema.ts)
src/infrastructure/            dexie/ · device/ · memory/ · system/
src/composition/               container.ts   ← seul point de câblage
src/ui/ecrans/games/           ← MÊME DÉCOUPAGE QUE LE DOMAINE (PartieEcran aiguille)
```
→ détail : l'arbre complet (ports, hooks, écrans, tests) dans [CONVENTIONS](.claude/CONVENTIONS.md) § 14.

---

## Conventions de code

- Ports petits et ciblés (ISP) : lecture séparée de l'écriture quand pertinent.
- Langue : nommage **UI en français** (`composants/`, `ecrans/`), **cœur technique en
anglais** (`core/`, `infrastructure/`).
- **UI → use cases UNIQUEMENT.** Un composant n'accède jamais à Dexie directement (ça
court-circuiterait les ports). Use cases fournis par un Context (`useServices()`) alimenté
par le composition root.
- → détail : Value Objects, branded types, use cases, fakes, 48 px : [CONVENTIONS](.claude/CONVENTIONS.md)
  § 1, 4, 5, 7, 11, `rules/typescript.md`, `rules/testing.md`, charte § Les trois planchers.

---

## État d'avancement

- [ ] **Lot 6** — *(optionnel, si un jour)* sync / classement — un adapter, zéro refonte
- → détail : [PROJECT_PLAN](docs/PROJECT_PLAN.md) § 0 (où l'on en est), § 4 (chaque lot, « Fait — N tests »), § 6 (journal).

---

## Notes techniques

- ⚠️ **L'incident `61b60ac`** : ce commit (react-router 7.18 → 8.x) a aussi supprimé **par accident**
  le mode rapide, restauré depuis `cc8faf7` avant son retrait **volontaire** (`PROJECT_PLAN` § 4).
- → détail : versions → `PROJECT_PLAN` § 4, Lot 0 ; TypeScript 7 → `rules/typescript.md` ; Biome 2.5
  → `rules/biome.md` ; `tests/setup.ts` → `CONVENTIONS` § 11 ; `vitest/config` → § 12 ; Wake Lock → § 5 ;
  polices → charte § Typographie ; dev, iOS, icônes, Rolldown → [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

---

## Journal des décisions, lot par lot

Le détail de chaque lot livré — le pourquoi de chaque choix, les pièges rencontrés, les
incidents corrigés — vit dans [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) § 6. Ce qui devait
rester gravé en est déjà remonté plus haut dans ce fichier (décisions structurantes, règles du
jeu). Le pattern « comment ajouter un mode de jeu » (la couture `GameMode`) vit dans
[.claude/CONVENTIONS.md](.claude/CONVENTIONS.md) § 13.

---

## Décisions ouvertes

1. ~~**Alfa Slab One** conservée ou remplacée par Oswald 700 pour l'enseigne.~~ **Tranchée au
   lot 3 bis** : conservée, mais réservée à l'enseigne et au nom du vainqueur.
2. ~~**Mode paysage « tableau »** (téléphone à plat sur une table).~~ **Tranchée au lot 5c** :
   la bascule est automatique, portée par `DispositionPartie`, et conditionnée à la hauteur
   plutôt qu'à la seule orientation.
3. ~~**Cricket**~~ **livré au lot 5c.** Restent les autres jeux fun (Around the Clock, Killer,
   Shanghai) — hors v1, la couture `GameMode` les accueillera.
4. **Sync cloud / classement entre potes** — hors v1 (lot 6 hypothétique). L'export/import
   JSON du lot 4 est le palliatif.
5. **i18n** : FR seul pour l'instant (aucun besoin identifié).

---

## Déploiement — Firebase Hosting

L'app est en ligne sur **https://dartpero.web.app** (projet Firebase `dartpero`). Une seule
commande : `npm run firebase:deploy` (= `build` + `smoke` + `firebase deploy --only hosting`).
- ⚠️ **Les en-têtes de cache ne sont PAS un détail.** Firebase pose `max-age=3600` sur *tout*
  par défaut, `index.html` et `sw.js` compris — donc une PWA en `registerType: 'autoUpdate'`
  peut servir l'ancienne version **pendant une heure** après un déploiement.
- **La dernière règle `headers` qui matche l'emporte** (vérifié en vrai avec `curl -I` après
  déploiement, pas déduit de la doc) : c'est pourquoi le fourre-tout `**` est écrit **en
  premier** et les règles précises après. Inverser l'ordre casserait le cache long des assets.
- ⚠️ **`id: '/'` ne se change jamais** — c'est l'identité déjà calculée des installations
  existantes. Captures du manifeste exclues du précache (`globIgnores`). `npm run smoke` vérifie
  les deux sur `dist/`.
- ⚠️ **`ignore` de `firebase.json` : jamais de motif `!`** (no-op silencieux sous glob 10 /
  firebase-tools 15, filtre inversé sous glob 7). `/.well-known/` passe par les extglobs
  `**/.!(well-known)` + `**/.!(well-known)/**`, a sa règle `headers` **après** le fourre-tout, et
  reste hors repli de navigation et hors précache du service worker. Garde : `firebaseHosting.test.ts`.
- ⚠️ **`npm run smoke` refuse tout `dist/` qui contient `REMPLIR`** (mention légale inconnue),
  donc tout déploiement, même un correctif. **Aucun contournement, à dessein** — n'en ajoutez
  pas. Un `firebase deploy` lancé à la main saute le smoke : ne passer que par `firebase:deploy`.
- → détail : réécriture SPA, en-têtes, service worker, iOS, manifeste, confidentialité et
  `assetlinks.json` : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

---

## Environnement

- OS : Windows 11. Shell par défaut PowerShell (outil Bash dispo aussi).
- Dossier : `c:\Users\kevin\Documents\Flechettes`. Repo **git initialisé** (branche `main`,
  historique par lots, **une branche `lot/<id>` par lot** fusionnée en `--ff-only` après
  accord — voir `.claude/skills/orchestrate/SKILL.md`, pas de remote — le déploiement passe par la CLI Firebase, pas par CI).
- Fins de ligne **LF** imposées par `.gitattributes` (`autocrlf=true` réécrivait les sources en
  CRLF au `switch` / `merge` et cassait `biome check`).
- Échelle : usage perso + potes. Parc **mixte iPhone + Android**.
- Dév & test principal sur un **appareil Android** (Chrome → DevTools / remote debug faciles).
  Tester sur un vrai iPhone avant de considérer le projet fini.

