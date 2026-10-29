<div align="center">

# 🎯 Dartpéro

**Le compteur de fléchettes entre potes.**
Le **X01** (301 / 501 / 701) joué comme au pub : saisie fléchette par fléchette,
suggestions de checkout, stats de carrière et historique.
Et, quand on veut changer : Tour du monde, Cricket, Killer, entraînement au checkout.

**100 % local · hors ligne · sans compte · sans pub**

[**▶ Ouvrir l'app**](https://dartpero.web.app) · [Charte graphique](docs/CHARTE_GRAPHIQUE.md) · [Plan détaillé](docs/PROJECT_PLAN.md) · [Déploiement](docs/DEPLOIEMENT.md) · [Décisions gravées](CLAUDE.md)

<img src="docs/captures/partie-x01.png" alt="L'écran de partie X01 : le tableau en haut, le pavé de saisie en bas" width="330">

</div>

---

## Le contexte qui explique tout le reste

Le téléphone est **posé** — contre un mur, sur une table, sur une étagère — pendant que
plusieurs joueurs se relaient à la ligne de lancer. Un joueur tape les scores à 30 cm, **les
autres lisent le tableau à 2 ou 3 mètres**. Souvent dans un garage ou une cave mal éclairés,
**sans réseau**.

Tout le design en découle : des chiffres énormes en craie sur feutre, des cibles tactiles qui
ne descendent jamais sous 48 px, aucun écran de connexion, et une app qui marche avec l'avion
activé.

---

## Ce que ça fait

### Le X01 d'abord, quatre autres modes

| | Mode | Ce que c'est |
| --- | ---- | ------------ |
| 🎯 | **X01** | **Le mode principal.** 301 / 501 / 701, premier à N manches, sets en option, double in et double out en option (checkout libre par défaut). Suggestion de checkout, moyenne, first 9, % de doubles, carte des impacts, courbe d'évolution : tout ce que l'app calcule est pensé pour lui. |
| 🌍 | **Tour du monde** | Du 20 à la bulle, 21 cibles. On finit le tour de table, et le moins de fléchettes gagne. |
| ✖️ | **Cricket** | Sept cibles à fermer, variantes **standard** et **cut-throat** (où le plus petit score gagne). |
| 🔫 | **Killer** | 2 à 6 joueurs, un numéro et des vies chacun : on devient killer sur le double de son numéro, puis on retire les vies des autres. Le dernier en vie gagne. |
| 🎓 | **Entraînement** | Un reste tiré au sort entre 41 et 170, trois fléchettes pour faire le checkout. En solo, 5, 10 ou 20 checkouts. |

### Pendant la partie

- **Saisie fléchette par fléchette** — la grille 1-20 + 25, et une bascule S/D/T qui **retombe
  sur Simple après chaque fléchette**. Un multiplicateur resté armé sans qu'on le voie, c'est
  trois T20 comptés là où il y avait trois simples.
- **Suggestion de checkout** qui suit le checkout de la partie : jusqu'à 170 sur un double, jusqu'à
  180 en checkout libre — et « pas de finish » sur les restes impossibles, jamais une route bidon.
- **Les règles au livre ouvert** : un appui sur le livre, à la création de partie ou en plein
  match, ouvre les règles du jeu par-dessus l'écran — celles que l'app applique, avec les
  réglages de ce soir. La volée en cours ne bouge pas.
- **Annulation fléchette par fléchette** : chaque appui sur « Annuler » retire la **dernière
  fléchette jouée**, même si la volée était déjà enregistrée — et même si elle avait gagné une
  manche. Une fléchette qui **gagne** (checkout X01, victoire au Cricket ou au Killer, Tour du
  monde bouclé) n'est écrite qu'après un **« Valider la sortie »** : on se trompe de case plus
  souvent qu'on ne le croit.
- **La volée en cours survit** à un rechargement ou à un retour du téléphone : ses fléchettes
  sont gardées à part du journal, et reprises sans bruit.
- **L'écran ne s'éteint pas** (Wake Lock), le téléphone **vibre** à la validation, et une
  **voix française** annonce le score puis appelle le joueur suivant — « checkout » et « bust » en
  anglais au milieu de la phrase, comme à la table.
- **Mode paysage** automatique quand on couche le téléphone : lecture à gauche, pavé à droite.
- **Rejouer en un tap** : l'écran de choix du jeu propose les trois configurations les plus
  récentes (mode, réglages, joueurs), lues sur l'historique ; « On remet ça » relance la partie
  qui vient de finir.
- **Un nom pour chaque partie** — « Finale des potes », ou à défaut « Dimanche soir » : on la
  retrouve dans l'historique, en tête du résumé et sous le bandeau.

### Un second téléphone en miroir

« Partager la partie » sur le téléphone de saisie, « Servir de miroir » sur un second : il affiche
la partie **en grand, en lecture seule et muet**, pour qu'on la lise du fond de la pièce pendant
que l'autre reste dans la main. Le lien passe **directement entre les deux téléphones du même
réseau local** (WebRTC, aucun serveur) et se jumelle en scannant **deux QR** ; la caméra ne
s'ouvre que sur un bouton. Le miroir ne stocke rien.

### Après la partie

- **La feuille de match** : joueurs en colonnes, statistiques en lignes, et le meneur de chaque
  ligne en laiton. Moyenne 3 fléchettes, first 9, % de doubles, 180 / 140+ / 100+, meilleure
  manche, plus haut checkout.
- **La carte des impacts** — où les fléchettes se sont réellement plantées, dessinée sur un
  plateau. L'échelle est propre à chaque joueur : on compare des **formes**, pas des volumes.
- **L'accueil en parties récentes** — celles d'aujourd'hui puis de la semaine, en cartes, la
  partie en cours épinglée en tête ; une partie laissée en plan est marquée « Abandonnée »,
  mais se reprend toujours d'un tap.
- **Statistiques de carrière** filtrables par période, historique filtrable par mode — et une
  **courbe d'évolution** de la moyenne, partie après partie, avec sa tendance.
- **Export / import JSON** de toute la base — le seul moyen de changer de téléphone sans tout
  perdre, puisqu'il n'y a pas de serveur. Les Réglages rappellent la **date du dernier export**
  et demandent au navigateur de **protéger** la base (ce qui n'est pas une sauvegarde).

---

## Les écrans

### Le X01

<table>
<tr>
<td width="33%" align="center"><img src="docs/captures/partie-x01.png" alt="Partie de X01 en cours : trois joueurs, suggestion de checkout" width="240"><br><sub><b>La partie</b><br>Chiffres géants, checkout suggéré</sub></td>
<td width="33%" align="center"><img src="docs/captures/resume-x01.png" alt="Résumé d'une partie X01" width="240"><br><sub><b>Le résumé</b><br>La feuille transposée, meneur par ligne</sub></td>
<td width="33%" align="center"><img src="docs/captures/impacts.png" alt="Carte des impacts sur un plateau" width="240"><br><sub><b>Les impacts</b><br>Le plateau réduit à sa structure</sub></td>
</tr>
<tr>
<td align="center"><img src="docs/captures/evolution.png" alt="Carte Évolution : la moyenne de chaque partie" width="240"><br><sub><b>Évolution</b><br>La moyenne partie après partie</sub></td>
<td align="center"><img src="docs/captures/accueil.png" alt="Écran d'accueil" width="240"><br><sub><b>L'accueil</b><br>La partie en cours en tête, puis celles de la semaine</sub></td>
<td align="center"><img src="docs/captures/historique.png" alt="Historique des parties" width="240"><br><sub><b>Historique</b><br>Filtrable par mode</sub></td>
</tr>
</table>

### Les autres modes

<table>
<tr>
<td width="25%" align="center"><img src="docs/captures/cricket.png" alt="Partie de Cricket en cours" width="190"><br><sub><b>Cricket</b><br>Sept cibles, marques et points</sub></td>
<td width="25%" align="center"><img src="docs/captures/tour-du-monde.png" alt="Tour du monde" width="190"><br><sub><b>Tour du monde</b><br>Départagé aux fléchettes</sub></td>
<td width="25%" align="center"><img src="docs/captures/killer.png" alt="Partie de Killer en cours" width="190"><br><sub><b>Killer</b><br>Numéros, vies, statut</sub></td>
<td width="25%" align="center"><img src="docs/captures/entrainement.png" alt="Entraînement au checkout" width="190"><br><sub><b>Entraînement</b><br>Jamais un reste impossible</sub></td>
</tr>
</table>

**Le téléphone couché** bascule en deux colonnes — ce qui lui manque, c'est la hauteur, pas la
largeur :

<div align="center"><img src="docs/captures/paysage.png" alt="L'écran de partie en mode paysage" width="620"></div>

**Le thème clair** est la *même* feuille de match — encre sur papier plutôt que craie sur
feutre. Le sombre reste le défaut : le cadrage, c'est un garage mal éclairé.

<table>
<tr>
<td width="33%" align="center"><img src="docs/captures/accueil-clair.png" alt="L'accueil en thème clair" width="240"><br><sub><b>Thème clair</b></sub></td>
<td width="33%" align="center"><img src="docs/captures/reglages.png" alt="Écran des réglages" width="240"><br><sub><b>Réglages</b></sub></td>
<td width="33%" align="center"><img src="docs/captures/miroir.png" alt="Écran miroir : le QR à scanner sur l'autre téléphone" width="240"><br><sub><b>Écran miroir</b><br>Un QR, la partie en grand</sub></td>
</tr>
</table>

---

## Installer

Il n'y a rien à installer depuis un store : c'est une **PWA**.

| Appareil | Comment |
| -------- | ------- |
| **Android** | Ouvrir [dartpero.web.app](https://dartpero.web.app) dans Chrome → menu → *Ajouter à l'écran d'accueil*. |
| **iPhone** | Ouvrir dans **Safari** (et non Chrome, qui ne sait pas installer de PWA sur iOS) → Partager → *Sur l'écran d'accueil*. |

L'Accueil et les Réglages proposent l'installation (« Installer » sur Android, un guide pas à pas
sur iPhone), sans jamais s'inviter pendant une partie.

Une fois installée, elle fonctionne **entièrement hors ligne**. Les parties, les profils et les
statistiques vivent dans l'IndexedDB du téléphone — rien ne part sur un serveur, il n'y a pas
de compte à créer. **Seule exception**, et seulement si on la demande : le lien local de
l'écran miroir, de téléphone à téléphone sur le même réseau. La
[politique de confidentialité](https://dartpero.web.app/confidentialite) le dit noir sur blanc.

⚠️ **Corollaire assumé** : perdre le téléphone, c'est perdre l'historique. D'où l'export JSON
dans les Réglages, qui est le filet de sécurité.

---

## Développer

```bash
npm install
npm run dev          # http://localhost:5173
```

`localhost` **est** un contexte sécurisé : le Wake Lock, la vibration et le service worker y
fonctionnent déjà, sans avertissement de certificat.

Pour tester depuis un vrai téléphone sur le même WiFi :

```bash
npm run dev:mobile   # https://<IP-du-PC>:5173 — accepter le certificat auto-signé
```

| Commande | Ce qu'elle fait |
| -------- | --------------- |
| `npm test` | La suite Vitest — **2116 tests** |
| `npm run test:watch` | La même, en continu |
| `npm run lint` | Biome (lint + format). **Jamais ESLint ni Prettier.** |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Typecheck puis build de production |
| `npm run smoke` | Vérifie `dist/` (identité du manifeste, mentions légales, chunks du démarrage) |
| `npm run icons` | Régénère les icônes PWA depuis `scripts/icon.svg` |
| `npm run firebase:deploy` | Build + smoke test + déploiement sur Firebase Hosting |

**Stack** : React 19 · TypeScript 7 · Vite 8 · Tailwind CSS 4 · React Router 8 · TanStack Query ·
Dexie (IndexedDB) · Vitest + Testing Library · Biome · `vite-plugin-pwa` · `@nuintun/qrcode`
(chargé à la demande, pour l'écran miroir).

---

## L'architecture, en une image

Le cœur est en **architecture hexagonale** (ports & adapters). Les dépendances pointent
**toujours vers l'intérieur** :

```
   ui / infrastructure  ──►  application (ports + use cases)  ──►  domain
   React, Dexie,             ce que l'app sait faire,              les règles,
   Wake Lock, voix, WebRTC    et ce dont elle a besoin              pures et testables
```

- **`src/core/domain/`** — zéro import externe. Ni React, ni Dexie, ni API navigateur, **ni
  `Date.now()` ni `Math.random()`** : ils passent par les ports `Clock` et `IdGenerator`, ce qui
  rend les tests déterministes.
- **`src/core/application/`** — les ports (ce que l'UI peut demander, ce dont le cœur a besoin)
  et les use cases qui les implémentent.
- **`src/infrastructure/`** — les adapters : Dexie, Wake Lock, vibration, `localStorage`,
  synthèse vocale, lien WebRTC, lecture de QR. Chacun a une doublure in-memory pour les tests.
- **`src/composition/container.ts`** — le **seul** point de câblage ports → adapters.

Trois garde-fous vérifient que ça tient : un `override` **Biome** sur `src/core/**` qui refuse
les imports externes dans l'éditeur, et un **test d'architecture** qui lit les imports réels de
`src/` et attrape ce que la liste de paquets bannis n'avait pas prévu. Le troisième garde le réseau : WebRTC
et la caméra n'existent chacun que dans **un seul fichier**, et aucun `import` de `firebase` n'entre
jamais dans `src/` (Firebase Hosting ne sert que des fichiers statiques).

### Le choix qui structure tout : le match est un journal

Une partie n'est pas un état qu'on modifie, c'est une **liste d'événements** ; ce qu'on affiche
en est la **projection**, rejouée à chaque fois.

```
MatchStarted { config, playerIds, startingPlayerIndex }
VisitRecorded { darts: [T20, T20, S20] }
VisitRecorded { darts: [S1, D20] }
…
```

Annuler, c'est donc `project(events.slice(0, -1))` — **rien d'autre**. Pas d'état à défaire à
la main, donc aucun bug de restauration de score, alors qu'on se trompe de saisie très souvent
en pleine partie. Deux conséquences volontaires :

- **les legs gagnés, les sets et la fin de partie ne sont jamais stockés**, ils se déduisent.
  Sinon annuler voudrait dire « retirer la dernière volée **et** les événements qu'elle a
  déclenchés » — exactement la classe de bug qu'on cherche à éliminer ;
- **`VisitRecorded` ne porte pas de `playerId`** : à qui est le tour se déduit de la projection,
  donc le journal ne peut pas être en désaccord avec les règles.

### Ajouter un mode de jeu

Chaque mode a son **propre** événement d'ouverture, ses règles et son état complets. Rien n'est
mis en facteur artificiellement : `domain/games/index.ts` ne fait qu'**aiguiller** sur le
discriminant `mode`, et TypeScript garantit qu'aucun cas n'est oublié.

Le prix a été mesuré quatre fois (Tour du monde, entraînement, Cricket, Killer) et il ne bouge pas : un
dossier `games/<mode>/`, un événement d'ouverture, trois lignes dans chaque aiguillage, un
dossier de composants et un écran.

⚠️ **Le mode se lit sur le premier événement du journal**, jamais sur un champ `mode` : c'est ce
qui rend une partie enregistrée avant l'arrivée du deuxième mode rejouable **pour toujours**,
sans migration ni valeur par défaut à deviner.

```
src/
├─ core/
│  ├─ domain/          games/ (un dossier par mode) · value-objects/ · entities/
│  │                   events/ · services/ (transverses : checkout, bust, impacts)
│  └─ application/     ports/driving · ports/driven · use-cases/
├─ infrastructure/     dexie/ · device/ · memory/ · system/ · peer/ · qr/
├─ composition/        container.ts   ← seul point de câblage
└─ ui/                 composants/ · ecrans/ · hooks/ · theme.ts · labels.ts
tests/                 domain/ · use-cases/ · infrastructure/ · architecture/ · ui/
```

---

## Les règles, prises au sérieux

C'est là que la plupart des compteurs amateurs se trompent, donc chaque règle ci-dessous est
couverte par des tests.

- **Bust** — la volée entière est annulée et le score revient à sa valeur d'avant : reste
  `< 0` ; et, **quand le double out est actif**, reste `== 1` (impossible à finir sur un double)
  ou reste `== 0` sans que la **dernière** fléchette soit un double. L'écran propose le checkout
  libre par défaut ; le double out se coche à la création de partie.
- **Le triple bull n'existe pas** — `Dart.of('BULL', 'TRIPLE')` est refusé par le domaine. Le
  bullseye à 50 **compte comme un double** pour le checkout.
- **Les restes sans checkout** affichent « pas de finish ». Sur un double, ce sont les 7 *bogey
  numbers* (169, 168, 166, 165, 163, 162, 159), au-delà de 170 rien n'est proposé ; en checkout
  libre, la borne monte à 180 et la liste devient 179, 178, 176, 175, 173, 172, 169, 166, 163
  (un reste de 1 se sort d'un simple 1). Ces listes ne sont **pas consultées par l'algorithme** :
  elles tombent d'une recherche exhaustive, et un test vérifie que *tous* les restes ont une
  route correcte ou sont exactement l'un de ceux-là.
- **Une volée *busted* marque 0 point mais ses fléchettes sont comptées** dans la moyenne.
- **Les moyennes de carrière se recalculent depuis les totaux bruts**, jamais en moyennant des
  moyennes — ce qui serait faux dès que les parties n'ont pas la même longueur, et elles n'en
  ont jamais.
- **Un tiret, jamais « 0 % », quand rien n'est terminé** : « 0 % » veut dire « il a tout
  perdu », « rien » veut dire « on ne sait pas encore ».

---

## Ce que l'usage a fait retirer

Deux fonctionnalités livrées puis **supprimées après des soirées réelles**, et c'est
volontairement documenté ici :

- **Le mode rapide** (saisir un total de volée 0-180 au lieu de trois fléchettes) n'a jamais
  servi. La saisie 3-taps tient très bien, et c'était elle la condition technique des stats de
  doubles. Parti avec son pavé, son port, son use case et ses tests.
- **Le « best of N »** ne voulait plus rien dire à trois ou quatre joueurs, où la partie peut
  durer plus de legs que le format n'en annonce. Remplacé par **« premier à N manches »**
  (« manche » à l'écran, *leg* dans le code), qui est d'ailleurs ce que le domaine stockait
  depuis le début.

---

## Licence & état

Projet **personnel**, pour jouer entre potes. Pas de licence publiée, pas de contribution
attendue — mais le code est lisible et les décisions sont écrites.

Il reste une chose que les 2116 tests ne peuvent pas couvrir : **la validation sur vrai
matériel** — la lisibilité à 3 mètres dans un vrai garage, le confort des cibles au pouce
debout, la tenue du wake lock sur une partie entière, et un passage sur un vrai iPhone — notamment pour le lien de l'écran miroir.

<div align="center"><sub>Fait pour un garage, une cible et quelques bières.</sub></div>
