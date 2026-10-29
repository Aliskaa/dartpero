# Lot `ecran-miroir` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu : `archi-authority` (opus, effort max
> d'après son frontmatter ; scout et designer sautés, surface gravée annoncée). Le rapport source commence par
> `Architecture result: PASS`. Premier passage arrêté à `maxTurns` (40) sans rapport ; second passage (relance
> du même agent) a rendu le rapport ci-dessous.
>
> **Portée du PASS** : le design technique tient, **sous trois conditions** : (a) vérification de la
> bibliothèque QR (étape 0) puis **mesure sur deux vrais téléphones** (étape 1) **avant** tout travail d'UI —
> le critère 2 rend le lot non livrable si la mesure échoue ; (b) une **planche validée** avant les étapes UI
> (5 et suivantes) ; (c) les « Questions pour l'utilisateur » (§ Questions ouvertes) tranchées à cette planche.
> Aucune planche validée n'existe (`docs/maquettes/ecran-miroir/` absent).

## Problème

Un second téléphone doit afficher, en lecture seule et en très grand, la partie qu'un premier téléphone saisit,
sans serveur ni Internet.

- **Ce qui voyage** : le journal, les profils de la partie et la volée en cours (hors journal), par un
  `RTCDataChannel` local.
- **Le jumelage** : deux QR scannés.
- **Ce qui reste intact** : l'hexagone (aucune API WebRTC ni caméra hors de leur adapter), les formats
  persistés, le jeu hors ligne.
- **Ce qui change** : la politique publique doit rester vraie ; « pas de réseau » est rouverte pour ce seul
  usage.
- **Le risque principal n'est pas dans le code** : densité du QR, mDNS, isolation de clients, scan en lumière
  faible. Il ne se lève que sur deux appareils réels.

## Options considérées

| Sujet | Option | Pour | Contre | Retenue |
|---|---|---|---|---|
| Signalisation | A. Port `Signaling` + adapter QR (proposé par la demande) | Prépare le lot Firebase | Avec le QR, « envoyer » = afficher un QR dans React, « recevoir » = scanner. L'adapter serait un passe-plat, sa forme dictée par un lot 2 non écrit. CONVENTIONS § 13 : « Généraliser plus tôt aurait été inventer une abstraction sans savoir ce qu'elle abstrait » | **Non** |
| | B. **Jeton de jumelage opaque** produit et lu par le port du lien ; le QR n'est qu'un porteur (UI + port caméra) | Lien et protocole inchangés au lot 2 : il ajoutera un porteur, conçu face à deux implémentations réelles | Écart à la lettre de la demande (qui autorisait l'architecte à le dire) | **Oui** |
| Où vit le partage | A. Provider React + reducer | Proche de l'UI | Règles d'ordre / renvoi / validation prises dans React, testables seulement par l'UI | Non |
| | B. Décorateur de `MatchRepository` | Aucun câblage UI | Implicite ; touche le câblage de la persistance ; voit imports et suppressions | Non |
| | C. **Deux sessions applicatives** (`ShareMatch`, `WatchMatch`) : état synchrone avec abonnement, actions | Logique dans le cœur, testable sur fakes (CONVENTIONS § 5) | Nouveau motif de port driving, à documenter | **Oui** |
| Messages | A. Instantané complet à chaque fléchette | Idempotent | Relit / rejoue le journal entier à chaque appui | Non |
| | B. Deltas d'événements | Léger | Désynchronisation à détecter, reprise complexe | Non |
| | C. **Deux messages** : `partie` (journal complet, à chaque changement de journal) et `volee` (0 à 3 fléchettes, clé `visitCount`) | Calqué sur journal / brouillon ; idempotent ; reprise triviale | Journal renvoyé à chaque volée : O(n) octets, acceptable en local | **Oui** |
| Rendu miroir | A. Réutiliser les écrans de jeu en lecture seule | Moins de vues | Hooks de mode liés au dépôt, au brouillon, à la voix, à l'haptique, à la saisie | Non |
| | B. **Une vue miroir par mode**, nourrie par une projection validée | Lecture seule et muet par construction | Cinq vues (selon la planche) | **Oui** |
| Hors ligne de la lib QR | A. Cache à l'exécution | Précache plus léger | Le **premier** jumelage hors ligne échoue si le chunk n'a jamais été chargé en ligne (contre critère 1) | Non |
| | B. **Précache, chunk séparé, hors démarrage** | Jumelage hors ligne dès l'installation | Précache plus lourd (à mesurer) | **Oui** |

## Approche retenue

### 3.1 Pas de port de signalisation dans ce lot (décision déléguée par la demande)

Anticipation jugée **spéculative** pour un seul adapter. La frontière stable est le **jeton** : une chaîne
opaque, produite et lue **uniquement** par l'adapter WebRTC. Le QR en est une représentation dans l'UI
(`CodeQr`, via le port `QrEncoder`), lue en retour par le port caméra (`QrScanner`). Le lot 2 ajoutera un port
porteur (Firebase) et un chemin de plus dans les sessions ; `PeerLinks`, le protocole et les vues miroir ne
changeront pas.

### 3.2 Ports nouveaux (noms indicatifs, invariants impératifs)

- **`core/application/ports/driven/PeerLinks.ts`** (consommé par les deux sessions) : `offer()` rend
  `{ token, link, accept(answerToken) }` ou un échec typé ; `answer(offerToken)` rend `{ token, link }` ou un
  échec. `PeerLink` expose `state()` (`connecting | open | lost | closed`), `subscribe`, `send(text)` (texte
  livré entier et dans l'ordre), `onMessage`, `close()`. **Ne lève ni ne rejette jamais** (CONVENTIONS § 5).
  Échecs typés : `unavailable | unreadable | incompatible | no-local-candidate | failed`. Null-object
  `NullPeerLinks` (tout `unavailable`).
- **`core/application/ports/driven/QrScanner.ts`**, **générique sur le viseur** : `QrScanner<Viewfinder>`, avec
  `state()`, `subscribe`, `start(viewfinder)`, `stop()`. États : `idle | starting | scanning | read(text) |
  denied | absent | failed`. Le premier QR lu **arrête la caméra**. Le cœur reste sans type DOM ;
  `container.ts` lie `QrScanner<HTMLVideoElement>`. **L'adapter attache le flux au viseur** : le flux ne sort
  jamais de l'adapter. Null-object : `absent`.
- **`core/application/ports/driven/QrEncoder.ts`** : `encode(text)` rend `Promise<QrMatrix | null>`. L'adapter
  choisit mode alphanumérique et niveau de correction. Null-object : `null`.
- **Ports driving `ShareMatch` et `WatchMatch`** (§ 3.3).

### 3.3 Sessions (application, sans React, sans timer, sans `Date`)

**`ShareMatchUseCase`** (téléphone de saisie). Dépendances : `MatchRepository` et `PlayerRepository` (lecture
seule), `PeerLinks`.
- États : `idle → offering(token) → connecting → connected ⇄ lost`, `failed(reason)`.
- Actions : `start()`, `acceptAnswer(token)`, `stop()`, `publish({ matchId, base, darts })` synchrone, `void`,
  ne lève jamais.
- **Inactive, elle ne fait que retenir le dernier appel** : aucune lecture, aucun coût (critère 3).
- Connectée : un `base` nouveau ou une partie nouvelle déclenche relecture du `MatchRecord` et des profils,
  puis envoi de `partie` ; ensuite `volee` (clé `GameModes.visitCount(base)`).
- **Fusion « le dernier gagne »** par chaîne de promesses : au plus un `partie` et un `volee` en attente,
  `partie` toujours avant `volee`. À **chaque** passage à `open`, instantané complet renvoyé.
- **N'écoute aucun message entrant** : le miroir ne peut rien écrire chez elle. Un seul lien à la fois.

**`WatchMatchUseCase`** (miroir). Seule dépendance : **`PeerLinks`**, aucun dépôt : il **ne peut rien écrire**
par construction.
- États : `idle → answering(token) → connected(view | null) ⇄ lost(view)`, `failed(reason)`, `incompatible`.
- Valide chaque message (§ 3.4), projette, garde la dernière vue valide. Message invalide ignoré : dernière
  image gardée, jamais de plantage.

### 3.4 Protocole v1 (format de protocole, **jamais persisté ni exporté**)

```
{ "app":"dartpero-miroir", "v":1, "type":"partie",
  "record":{ "id","createdAt","updatedAt","events":[…] },
  "players":[{ "id","name","color","gender"? }] }
{ "app":"dartpero-miroir", "v":1, "type":"volee", "matchId","visitCount","darts":[…] }
```

- **Sens unique**, saisie → miroir. `v` doit valoir exactement 1 ; toute autre valeur → `incompatible` (refus
  propre, testé). La version est aussi portée par le jeton (incompatibilité visible dès le scan).
- **Validation calquée sur l'import JSON**, en réutilisant le code existant sans le modifier : `record` par
  `versMatchRecord` (`backupSchema.ts:213-230`), fléchettes par `versDart` (`backupSchema.ts:49-62`), joueurs
  par `PlayerId.of`, `Player.cleanName` (20 car. max) et `PlayerColor.of`, plus `PlayerGender.of`
  **seulement si l'ouverture est `KillerStarted`** (sinon clé ignorée).
- Joueurs : 6 au plus, tous dans les `playerIds` de l'ouverture, sans doublon. Profil supprimé = absent du
  message, le miroir affiche `nomJoueur(null)`.
- Objets reconstruits champ par champ (`__proto__` sans effet). Plafond 4 Mo sur un message réassemblé. Les
  messages d'erreur du cœur ne s'affichent jamais bruts : l'UI traduit chaque raison par `labels.ts`.
- **Découpage** dans l'adapter : trames ≤ 16 Kio, réassemblées. Ne jamais couper une paire de substitution
  (pseudo avec emoji, testé), ou échapper le JSON en ASCII avant découpage. Dev choisit.

### 3.5 Jeton de jumelage, QR, plan de mesure (rien n'est mesuré à ce jour)

**Format v1** (module pur `infrastructure/peer/jetonDeJumelage.ts`, sans nom d'API RTC) : octet de format,
octet de version de protocole ; rôle et `setup` ; `ufrag` et `pwd` préfixés par leur longueur ; empreinte
**sha-256 seulement** (32 octets, autre algorithme refusé) ; au plus 4 candidats **UDP host** (type IPv4 / IPv6
/ nom mDNS UUID 16 octets / nom `.local`, plus port). Encodé en **base45 (RFC 9285)** pour que le QR passe en
mode alphanumérique.

**Filtre « réseau local »**, à l'encodage **et** au décodage : seules passent les IPv4 privées (RFC 1918), les
ULA et adresses de lien IPv6, et les `.local` ; les adresses publiques sont écartées (aucune vérification ICE
vers Internet). Au décodage, texte plafonné (≈ 400 car.) avant analyse. Le SDP est reconstruit par gabarit
(`m=application … UDP/DTLS/SCTP webrtc-datachannel`, `sctp-port`, `mid`, `BUNDLE`). ICE sans trickle : on attend
la fin de la collecte (ou un délai, à mesurer).

**Estimation (savoir général, non mesuré)** : ≈ 100-150 octets, soit 150-225 caractères alphanumériques ;
d'après les tables de capacité QR (de mémoire, à revérifier), version 7 à 9 en correction M, 45-53 modules de
côté (17 + 4 × version, calcul exact). Un SDP brut ferait plusieurs centaines d'octets, version 15+ : la
réduction est indispensable.

**Plan de mesure** : (1) tests unitaires du codec sur des SDP réels capturés à l'étape 1 (Chrome Android,
Safari iOS ; offre et réponse ; avec et sans permission caméra) ; (2) sur appareils, journaliser longueur et
version pour chaque jumelage réel du critère 2 ; (3) cible version ≤ 10, correction M ; (4) en cas de
dépassement, dans l'ordre : retirer l'IPv6, limiter à 2 candidats, correction L. Une suite de plusieurs QR
n'est envisagée qu'**après discussion avec l'utilisateur**.

**Contrainte technique pour la planche** : modules **sombres sur fond clair dans les deux thèmes**, zone de
silence ≥ 4 modules. En sombre, `craie-vive` = `#FFFFFF` sur `feutre` `#0E1A13` (CHARTE:92, :100) : ces jetons
donneraient un QR inversé. D'où **deux jetons réservés constants** (motif des `apercu-*`) consommés par
`CodeQr` seul, avec une entrée de garde dans `themeBoundary`. Teintes exactes décidées à la planche.

**Hypothèses non vérifiées (savoir général)** : Chrome et Safari masquent les adresses hôtes derrière des
noms mDNS, sauf peut-être une fois la permission caméra accordée ; le miroir ouvre sa caméra **avant** de créer
son lien (candidats plus probablement en clair), la saisie crée son offre **avant** de scanner (candidats
probablement mDNS) ; il suffit qu'un côté soit joignable (candidats « prflx » appris). Si la preuve échoue sur
ce point, option à rouvrir avec l'utilisateur : garder le flux caméra du miroir ouvert jusqu'à la fin de sa
collecte ICE. **Par défaut, la caméra s'arrête dès la lecture.**

### 3.6 Bibliothèque QR et disponibilité hors ligne (décision déléguée)

- **Critères** : une seule dépendance qui **encode et décode** ; JS/TS pur (**sans WASM**, chargé par défaut
  depuis un CDN, et `wasm` absent de `globPatterns`) ; ESM ; sans accès caméra ni réseau internes ; décodage
  depuis pixels/luminance (testable dans Node, aller-retour encodage→décodage) ; mode alphanumérique et niveau
  de correction réglables ; licence permissive ; maintenue.
- **Candidat 1** `@nuintun/qrcode` ; **candidat 2** `@zxing/library`. Savoir général, **rien de vérifié** :
  aucun paquet QR n'est installé.
- **Écartés** : `zxing-wasm` et le polyfill `barcode-detector` (WASM, CDN, poids) ; `qr-scanner` et
  `html5-qrcode` (pilotent eux-mêmes la caméra, ne génèrent pas) ; le couple `qrcode-generator` + `jsQR`
  (deux dépendances, contraire à « une bibliothèque » validée — **à ne rouvrir qu'avec l'utilisateur**).
- **Un seul chemin de décodage partout** (pas de `BarcodeDetector`, même sur Android).
- **Porte V1-V7 avant installation** : licence ; `npm view` (date de la dernière version) ; recherche dans le
  `dist` de `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, `getUserMedia`, `eval`, `new Function` ;
  ESM ; aller-retour Node ; mode alphanumérique ; poids gzip mesuré au build. Candidat 1 échoue → candidat 2.
  **Les deux échouent : arrêt et retour à l'utilisateur.**
- **Hors ligne : précache** (`globPatterns: ['**/*.{js,…}']`, `vite.config.ts:113-119`, précache déjà tout
  chunk JS). La bibliothèque n'est importée **que par `import()`**, depuis un seul module d'infrastructure.
- ⚠️ **Non vérifié** : la règle `codeSplitting.groups [{ name: 'vendor', test: /node_modules/ }]`
  (`vite.config.ts:136-140`) risque d'aspirer la bibliothèque dans le chunk `vendor` chargé au démarrage. La
  sémantique de Rolldown n'est pas vérifiée : groupe dédié prioritaire, ou exclusion du motif `vendor`.
  **Mesurer** : le smoke vérifie que le chunk QR est dans le précache **et** absent de l'entrée et des
  `modulepreload` d'`index.html`. Écart de poids (démarrage et précache) noté dans `02-dev-notes`.

### 3.7 Projection côté miroir, `default` typé `never`

- **Projection** : `versMatchRecord` rejoue le journal avec `GameModes.project` (`games/index.ts:54-70`).
- **Fléchettes en cours** : appliquées seulement si `matchId` et `visitCount` concordent avec
  `GameModes.visitCount(state)` et que la partie n'est pas finie (règle de cohérence du brouillon recopiée dans
  le protocole **sans toucher** `ManageVisitDraftUseCase` ; modèle `ManageVisitDraftUseCase.ts:48-72`). On garde
  le **dernier** `volee` et on le réévalue à chaque nouveau journal.
- Aperçu par **les mêmes ports** que la saisie (`previewVisit`, `previewCricketVisit`,
  `previewTourDuMondeVisit`, `previewKillerVisit`), sous `try/catch` : fléchettes illégales = volée vide.
- **Fin, vainqueur, classement : du journal projeté seulement, jamais de l'aperçu** (« rien avant Valider »).
- Entraînement : le reste affiché est calculé dans le hook (`useCheckoutPractice.ts:33-38, 50-52`) ; il est
  **extrait** en fonction partagée, jamais recopié. Principe : toute valeur affichée par la saisie et le miroir
  passe par une seule fonction.
- **Aiguillage** : `MiroirEcran` fait un `switch (view.state.mode)` finissant par `const jamais: never`
  (modèle `PartieEcran.tsx:88-107`), plus un `lazy()` par mode. Un mode sans vue miroir **ne compile pas**
  (critère 5) : Shanghai devra apporter la sienne.
- **Noms et couleurs viennent du message**, jamais de `useProfils()` du miroir. Les composants de
  `ui/composants/` reçoivent leurs données par props (aucun `useProfils` dedans) : réutilisables.

### 3.8 Reprise

- **Saisie rechargée** : le lien meurt, rien n'est mémorisé ; partie et brouillon reprennent comme aujourd'hui,
  la session revient à `idle`, on refait le QR. **Miroir rechargé** : retour au jumelage, la saisie passe à
  `lost`.
- **Lien perdu** : `lost` sur `disconnected`, `failed`, `closed`, ou fermeture du canal ; le miroir fige sa
  dernière vue. **Rétablissement** : un `connected` retrouvé sans nouveau QR repasse à `open`, instantané
  renvoyé (affichage : question produit). **Nouveau jumelage** : nouveau lien, ancien fermé, instantané
  complet. Délais de détection dépendants du navigateur, non vérifiés : à mesurer.

### 3.9 Point unique côté saisie

`useVoleeEnCours` (`useVoleeEnCours.ts:29-109`), utilisé par les cinq hooks de mode, ajoute **un effet** sur
`[matchId, state, darts, pret]` appelant `services.shareMatch.publish({ matchId, base: state, darts })` une fois
`pret`. Aucun autre hook touché. Contrat du brouillon inchangé ; les tests `volee-partielle` restent verts.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | **aucun** | — |
| `core/application/` | `ports/driven/PeerLinks.ts`, `QrScanner.ts`, `QrEncoder.ts` ; `ports/driving/ShareMatch.ts`, `WatchMatch.ts` ; `use-cases/mirrorProtocol.ts` (codec + validation, réutilise `versMatchRecord` et `versDart`) ; `use-cases/ShareMatchUseCase.ts`, `WatchMatchUseCase.ts` | Ports, null-objects, sessions, protocole v1 |
| `infrastructure/` | `peer/WebRtcPeerLinks.ts` (**seul** fichier WebRTC ; `iceServers: []` explicite ; fabrique injectée par défaut de paramètre, comme `BrowserAppInstallation`) ; `peer/jetonDeJumelage.ts`, `peer/trames.ts` (purs) ; `device/CameraQrScanner.ts` (**seul** fichier caméra : `mediaDevices` injecté, `facingMode: environment`, arrêt des pistes à la lecture, à `stop`, au masquage de l'onglet) ; `qr/bibliothequeQr.ts` (**seul** import, dynamique, de la lib) ; `qr/LibraryQrEncoder.ts` | Adapters |
| `composition/` | `container.ts` : `Dependencies.peerLinks`, `devices.qrScanner` (`QrScanner<HTMLVideoElement>`), `devices.qrEncoder` ; `Services.shareMatch`, `watchMatch` | Câblage seul ; aucun `RTCPeerConnection` créé à la construction |
| `ui/` | `hooks/useVoleeEnCours.ts` (un effet) ; `hooks/usePartage.ts`, `useMiroir.ts` (`useSyncExternalStore`) ; `composants/commun/CodeQr.tsx`, `Viseur.tsx` (vidéo `playsInline muted`), `VoyantMiroir.tsx` (posé une fois dans un composant commun aux cinq écrans selon la planche) ; `ecrans/miroir/PartageEcran.tsx`, `MiroirEcran.tsx` (routes `lazy`) ; `ecrans/games/<mode>/Miroir<Mode>.tsx` ×5 ; `App.tsx`, `chemins.ts`, `labels.ts` (tous textes, politique, date), `index.css` (jetons QR) ; entrées Réglages et partie selon la planche | ⚠️ **Ne pas créer `ui/composants/miroir/`** : `hexagonalBoundary.test.ts:122-144` y verrait un mode empruntant les composants des autres |
| `tests/` | `fakes/index.ts` : `FakePeerLinks` (réseau en mémoire partagé par deux `fakeServices`, coupure simulée, jeton illisible), `FakeQrScanner`, `FakeQrEncoder` ; `use-cases/mirrorProtocol.test.ts`, `partageMiroir.test.ts` ; `infrastructure/peer/*.test.ts`, `device/CameraQrScanner.test.ts`, `qr/*.test.ts` ; `ui/miroir*.test.tsx` ; gardes (§ Gardes) ; `scripts/smoke-build.mjs` | — |

**Sens des dépendances vérifié :** `ui` → ports driving (`shareMatch`, `watchMatch`) et `devices` (`qrScanner`,
`qrEncoder`), exception assumée de `container.ts:109` ; `ui` n'importe jamais `infrastructure` (garde
`hexagonalBoundary.test.ts:70-82`). `infrastructure` → ports seulement. Sessions → domaine (`GameModes`) et
`backupSchema` (application). Cœur sans type DOM (`QrScanner` générique) ni import externe ; la bibliothèque
est ajoutée au `noRestrictedImports` de `src/core/**` (`biome.json:53-76`). Sessions sans timer ni `Date` : le
délai de collecte ICE vit dans l'adapter.
**Nouveau port ?** Oui : `PeerLinks` (premier consommateur : `ShareMatch` / `WatchMatch`), `QrScanner`,
`QrEncoder`. **Pas** de port de signalisation (§ 3.1).

### Confirmations, preuves lues sur disque

- **Aucun fichier de `src/core/domain/` modifié.** `GameModes.project`, `isFinished`, `visitCount`
  (`games/index.ts:51-110`), aperçus purs (`PreviewKillerVisitUseCase.ts:6-23`, ports `PreviewCricketVisit.ts`,
  `PreviewTourDuMondeVisit.ts`), validation/projection d'un journal (`backupSchema.ts:213-230`) existent déjà.
  La couture `games/index.ts` n'est pas touchée.
- **Aucun format persisté modifié** : `MatchEvent.ts` inchangé ; pas de table Dexie ni `db.version` ; miroir
  sans dépôt ; `backupSchema` importé jamais modifié ; `visitDrafts`, `ManageVisitDraft`,
  `VisitDraftRepository` non touchés ; messages et jetons jamais écrits ni exportés.
- **`firebase.json` sans changement** (`firebase.json:1-32` : ni `Permissions-Policy` ni CSP ; `/assets/**`
  immutable couvre le nouveau chunk). `index.html:1-48` : aucun `meta` de CSP ni de permissions : la caméra
  n'est pas interdite.
- **Service worker** : précache automatique de tout JS (`vite.config.ts:113-119`) ; modification probable
  limitée à `codeSplitting.groups` (§ 3.6) ; `manifest` et `id: '/'` intacts.
- **Aucune règle de jeu réimplémentée** : projection et aperçus du domaine ; seule l'arithmétique de
  `useCheckoutPractice` est extraite et partagée.

### Gardes

- **`reseauBoundary.test.ts`, réécrite** : inchangés `fetch(`, XHR, WebSocket, EventSource, `sendBeacon`,
  import `firebase` (`:25-35`) et adresses (`:45-48, 104-121`), zéro fichier permis ; **nouvelles familles à
  liste fermée** : `\w*RTCPeerConnection`, `RTCDataChannel`, `createDataChannel`, `iceServers` → seulement
  `infrastructure/peer/WebRtcPeerLinks.ts` ; `getUserMedia` (casse ignorée, attrape `webkitGetUserMedia`),
  `mediaDevices`, `getDisplayMedia` → seulement `infrastructure/device/CameraQrScanner.ts` ; URL `stun:` /
  `turn(s):` → zéro fichier. **Planchers qui peuvent échouer** : échantillons positifs et négatifs par
  détecteur ; chaque fichier permis **existe et contient** son API (modèle `installationBoundary.test.ts:20-42`) ;
  ≥ 40 fichiers lus ; dev montre dans `02-dev-notes` qu'un `new RTCPeerConnection()` dans `ui/` fait échouer la
  garde. ⚠️ Ces gardes lisent aussi les commentaires : ne jamais nommer ces API ailleurs (piège
  `AppInstallation.ts:1`).
- **Import de la bibliothèque** : seulement `infrastructure/qr/bibliothequeQr.ts`, seulement par `import()`.
- **Test d'absence d'action** : sans action de l'utilisateur, ni la fabrique WebRTC, ni `getUserMedia`, ni le
  chargeur de la bibliothèque ne sont appelés (rendu des écrans de partie des cinq modes, construction des
  adapters).
- **`genreBoundary`** : si le genre circule, sa liste fermée (`genreBoundary.test.ts:22-41`) **gagne
  nommément** `mirrorProtocol.ts`, `ShareMatchUseCase.ts` et `MiroirKiller.tsx` ; `INTERDITS` inchangé. **La
  lettre « genreBoundary inchangée » de la demande ne peut alors pas tenir** (question 11). Contourner la garde
  (ex. `Omit<Player,'createdAt'>`) serait une faute.
- **`lazyRoutes.test.ts`** : y ajouter routes du miroir et vues par mode (`:32-54`).
- **`themeBoundary`** : nouvelle famille de jetons réservés (QR), garde d'égalité entre les deux thèmes ;
  `rules/theme-colors.md` passe de 4 à 5 entrées.
- **Smoke** : chunk QR précaché et absent du démarrage.

### Étapes ordonnées pour `dev`

0. **Porte bibliothèque V1-V7**, puis installation (`package.json`, surface gravée « stack »). Pas d'autre
   fichier de `src/`.
1. **Spike de mesure jetable, hors `src/`** (ex. `docs/maquettes/ecran-miroir/spike/`, ignoré par git, servi
   par `npm run dev:mobile`) : capturer les SDP, mesurer jeton et QR, scanner en lumière faible, partage de
   connexion dans les deux sens, mode avion + Wi-Fi. **Porte utilisateur** : un échec arrête le lot (STUN ou
   repli sans caméra à rouvrir).
2. **Application** : ports, null-objects, `mirrorProtocol`, sessions, Biome. Tests : protocole (version
   inconnue, malformé, trop gros, `__proto__`, joueurs, genre au Killer seulement), jumelage de bout en bout
   entre deux `fakeServices`, instantané à l'ouverture, ordre et fusion, annulation qui retire la fléchette du
   miroir, rejeu à froid, perte puis nouveau jumelage, saisie sourde aux messages, zéro écriture côté miroir.
3. **Infrastructure** : trois adapters et modules purs, testés avec fabriques et `mediaDevices` factices ;
   aller-retour réel de la bibliothèque si V5 passe.
4. **Composition et fakes**, puis gardes et smoke.
5. *(planche validée)* **UI** : effet de `useVoleeEnCours`, hooks, `CodeQr`, `Viseur`, routes, aiguillage
   `never`, 5 vues, voyant, entrées, Wake Lock du miroir, `labels.ts`. Tests par rôle ; `it.each(GAME_MODE_IDS)`
   sur le miroir via `lancerPartie.ts`, typé `satisfies Record<GameModeId,…>`.
6. **Politique et date ; jetons QR et `themeBoundary` ; mesure de poids** (démarrage et précache).
7. **Docs à regraver**, puis `/refresh-architecture`.
8. **Preuve sur deux téléphones** (critère 2), consignée dans le lot.

## Décisions de `CLAUDE.md` concernées

À graver à la livraison :
- **DS « PAS de réseau »** : texte exact de la demande (lien WebRTC local seul, caméra au scan seul, ni
  serveur, ni compte, ni STUN/TURN, règle `firebase` inchangée) + **filtre des candidats locaux** et « un
  fichier par capacité ».
- **Sous-puce politique** (« Seul le réseau a un fil-piège ») : WebRTC et caméra ont désormais leur garde.
- **« Stack figée »** : plus une bibliothèque QR, nommée.
- **Nouvelle entrée DS « Écran miroir »** : frontière du jeton, protocole v1 jamais persisté, miroir sans
  dépôt et muet par construction, sessions dans `Services`.
- **CONVENTIONS** : § 5 et § 4 (session driving à état et abonnement ; `QrScanner` générique), § 7
  (`Services`), § 13 (piège n° 5 : « un mode apporte sa vue miroir »), § 14 (arbre).
- **`rules/persistence.md:50-51` et `agents/sec.md:61-66, 84-86`** : « l'import JSON est la seule entrée non
  fiable » devient **faux** ; on y ajoute les deux jetons scannés et les messages reçus par le miroir ; la
  caméra devient une permission.
- **Autres docs** : DEPLOIEMENT (§ Service worker, R5, liste du fil-piège), CHARTE (miroir, jetons QR,
  voyant), glossaire, PROJECT_PLAN. Puis `/refresh-architecture`.

## Baseline sécurité

- **Trois entrées non fiables nouvelles** : jeton d'offre (miroir), jeton de réponse (saisie), messages du
  canal (miroir). Parades : analyseurs stricts, plafonds de taille, versions, objets reconstruits, pseudos
  rendus en texte React, échec sans plantage.
- **La saisie ignore tout message entrant** (testé) : un miroir hostile ne peut rien écrire. Le miroir n'a
  aucun dépôt.
- **Qui peut se connecter** : il faut que l'utilisateur de la saisie scanne la réponse ; un seul lien à la
  fois. QR d'offre photographié : risque faible, documenté dans la politique. DTLS obligatoire en WebRTC
  (savoir général), empreinte épinglée par le jeton.
- **Localité** : filtre des candidats (§ 3.5) et `iceServers: []` (test de l'adapter avec fabrique factice).
  **Résiduel** : un téléphone ayant aussi les données mobiles peut émettre des vérifications ICE vers une
  adresse privée par l'interface cellulaire ; inoffensif, non vérifié. Owner : sec, puis l'utilisateur à la
  preuve.
- **Caméra** : ouverte dans un gestionnaire de clic (le plus sûr pour iOS, savoir général) ; aucune image
  stockée ni envoyée ; images transmises au seul décodeur, en mémoire.
- **Dépendance** : porte V1-V7, `npm audit`, chunk séparé.
- **Politique** : « Il n'utilise jamais la caméra » (`labels.ts:363`) devient faux ; « Deux cas techniques »
  (`:339`) devient trois ; « fonctionne sans réseau » (`:371`) à préciser ; date (`:323`) mise à jour. Texte
  rédigé par dev, validé par l'utilisateur.
- **Résiduels sur appareils** (mDNS, isolation des clients, veille iOS, Wake Lock iOS en mode installé) :
  owner l'utilisateur, via le critère 2.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | La planche validée doit précéder Dev (étapes 5+). Les étapes 0 et 1 (porte bibliothèque + mesure sur appareils) passent-elles **avant** la planche, puisque leur échec arrête le lot ? | Utilisateur |
| 2 | Où sont les entrées (groupe des Réglages, endroit de l'écran de partie) ? Libellés et mots du glossaire (« miroir », « jumeler », « QR ») ? | Utilisateur, planche |
| 3 | Jumelage côté saisie : écran plein (route, retour annule) ou boîte par-dessus la partie ? | Utilisateur, planche |
| 4 | Caméra ouverte sur un bouton « Scanner » (recommandé techniquement) ou dès l'arrivée sur l'étape ? | Utilisateur, planche |
| 5 | Le miroir suit-il la partie affichée sur la saisie (« On remet ça », Rejouer, autre partie ouverte) ou reste-t-il sur la partie partagée ? | Utilisateur, planche |
| 6 | Jumelage lancé depuis les Réglages sans partie affichée : que montre le miroir ? | Utilisateur, planche |
| 7 | Mise en page du miroir par mode (paysage, portrait toléré, Killer à 6, nom de la partie affiché ou non) ? | Utilisateur, planche |
| 8 | La fléchette de sortie en attente est-elle visible sur le miroir, avec un reste à « 0 » ? (rien célébré avant validation : à confirmer) | Utilisateur, planche |
| 9 | Fin de partie sur le miroir : quel écran (vainqueur, classement), et après ? | Utilisateur, planche |
| 10 | Les moments (bust, 180, manche gagnée, « Partie ! ») apparaissent-ils sur le miroir (faisable en rejouant la dernière volée) ? | Utilisateur, planche |
| 11 | **Genre** : le Killer du miroir accorde-t-il « éliminée » ? Si oui, `genreBoundary` gagne 3 fichiers nommés (contre « inchangée » dans la demande) ; sinon accord au masculin. | Utilisateur |
| 12 | Libellés de « Connexion perdue ». Coupure brève qui se rétablit seule : le miroir reprend-il seul ? | Utilisateur, planche |
| 13 | Après rechargement de la saisie, un indicateur « miroir perdu » ? Exigerait un marqueur en `sessionStorage` (donnée nouvelle, donc politique). Défaut technique : rien. | Utilisateur |
| 14 | Teintes, taille et consigne du QR (ex. « montez la luminosité »), modules sombres sur fond clair. | Utilisateur, planche |
| 15 | Libellés d'erreur : QR illisible, caméra refusée/absente, versions incompatibles, navigateur sans WebRTC, échec de connexion. | Utilisateur, planche |
| 16 | Défauts : un seul miroir, muet, Wake Lock actif, rien de stocké ? Bouton « Arrêter le partage » côté saisie, « arrêté » distinct de « perdu » ? | Utilisateur, planche |
| 17 | Texte exact de la politique et sa date. | Utilisateur |
| 18 | Pas de port de signalisation (§ 3.1) : confirmé ? | Utilisateur |
| 19 | Dev : comportement de Rolldown face à un `import()` de `node_modules` sous le groupe `vendor` ; `lib` de `tsconfig` ; délai de collecte ICE ; taille des trames ; méthodes de `PlayerRepository` (non lus). | Dev |
| 20 | Test : matrice du critère 2 ; délai réel avant « perdu » ; angles morts (lisibilité QR et miroir à 2-3 m, contraste). | Test |
| 21 | Sec : trois entrées non fiables, filtre de localité, porte de la bibliothèque, cycle de vie de la caméra, politique. | Sécurité |

### Résolutions (arrêt Archi → Dev, utilisateur, 2026-10-22)

| # | Résolution |
|---|---|
| 1 | **Mesure d'abord, planche ensuite.** Dev fait les étapes 0 et 1 (porte bibliothèque, spike jetable) ; l'utilisateur passe le spike sur ses deux téléphones ; la planche suit si la mesure passe ; les étapes 2 à 8 attendent les deux. Un échec de la mesure arrête le lot. |
| 11 | **Oui, accorder « éliminée ».** Le genre circule dans le protocole (joueurs, `gender` seulement si l'ouverture est `KillerStarted`). `genreBoundary` gagne nommément `mirrorProtocol.ts`, `ShareMatchUseCase.ts` et `MiroirKiller.tsx` ; `INTERDITS` inchangé. Écart assumé à la demande (« genreBoundary inchangée »). `CLAUDE.md` (décision « genre ») et la politique `/confidentialite` le disent à la livraison. |
| 13 | **Non** : aucun indicateur « miroir perdu » après rechargement de la saisie, aucun `sessionStorage`. |
| 18 | **Confirmé** : pas de port de signalisation dans ce lot ; jeton de jumelage opaque dans `PeerLinks`. |

Q2-Q10, Q12, Q14-Q17 : restent à trancher **à la planche** (ou, pour Q17, à la relecture de la politique).

### Résolutions à la planche (utilisateur, 2026-10-24)

Planche : `docs/maquettes/ecran-miroir/planche.html` (ignorée par git). L'utilisateur a accepté **toutes les
propositions** de la planche, sans modification (« OK avec tes propositions »). La planche fait foi pour le
visuel ; les décisions sont :

| # | Résolution |
|---|---|
| 2 | Groupe « Écran miroir » dans les Réglages (« Partager la partie », « Servir de miroir ») + bouton de 48 px à côté du livre des règles, voyant vert (connecté) / rouge (perdu) / rien. « Jumeler » évité à l'écran : « Scanner le code ». |
| 3 | Écran plein (route, le retour annule), pas une boîte. |
| 4 | Caméra ouverte sur le bouton « Scanner », jamais à l'arrivée sur l'étape. |
| 5 | Le miroir suit tout seul la nouvelle partie lancée sur la saisie. |
| 6 | Sans partie : « Connecté · En attente d'une partie sur l'autre téléphone » (aussi entre deux parties). |
| 7 | Mise en page dédiée paysage, chiffres géants, nom de partie discret en bandeau, portrait toléré, ni suggestion de checkout, ni statistiques, ni livre des règles. |
| 8 | Variante A : la fléchette de sortie apparaît en pointillé laiton dans la volée, le reste ne bouge pas, rien de célébré. |
| 9 | Fin de partie seulement quand le journal la contient : vainqueur + classement ; l'écran reste affiché. |
| 10 | Bandeaux muets d'environ 2,5 s : bust, 180, manche gagnée, « Partie ! » ; pas à l'entraînement. |
| 12 | Coupure de moins de 5 s : rien d'affiché. Au-delà : bandeau rouge « Connexion perdue » sur la dernière image figée, bouton « Refaire le code ». Reprise seule si le lien revient (instantané renvoyé). « Partage arrêté » distinct de « perdu ». |
| 14 | QR toujours sombre sur fond clair avec zone de silence, dans les deux thèmes ; 311 px ; consigne « montez la luminosité ». |
| 15 | Six libellés d'erreur de la planche, jamais une boîte. |
| 16 | Un seul miroir, muet, Wake Lock actif sur le miroir, rien de stocké ; « Arrêter le partage » côté saisie. |
| 6 bis | (2026-10-24, après le passage 2 de Dev) Quand la saisie quitte l'écran de partie, le miroir **garde la dernière partie** jusqu'à la suivante ; « En attente d'une partie » seulement avant la toute première. Aucun message de retrait ajouté. |
| 17 | **Reste ouverte** : texte exact de la politique et sa date, à relire avec l'utilisateur avant l'étape 6. |

## Lu sur disque, et ce qui ne l'est pas

**Lu** : index, demande, orchestration, brief, sections citées de `CLAUDE.md`, CONVENTIONS § 1-14, `rules/*`,
`agents/sec.md`, `container.ts`, `main.tsx`, `App.tsx`, `PartieEcran.tsx`, `useVoleeEnCours.ts`, `useX01.ts`,
`useKiller.ts`, `useCheckoutPractice.ts`, `KillerEcran.tsx`, `BandeauMatch.tsx`, `DispositionPartie.tsx`,
`games/index.ts`, `MatchEvent.ts`, `backupSchema.ts`, `ManageVisitDraft*`, `Player.ts`, `PlayerColor.ts`,
`AppInstallation`, `BrowserAppInstallation`, gardes `reseau`, `hexagonal`, `genre`, `installation`,
`lazyRoutes`, `vite.config.ts`, `firebase.json`, `index.html`, `smoke-build.mjs`, `biome.json`,
`package.json`, `labels.ts:300-374`, CHARTE (Planchers, Palette, Mouvement, Écran de match), DEPLOIEMENT
(En-têtes, SW, Confidentialité).

**Non vérifié (savoir général ou faute de tours)** : tout ce qui touche aux bibliothèques ; tout comportement
de navigateur (mDNS, effet de la permission caméra sur les candidats, compatibilité des SDP reconstruits entre
Chrome et Safari, limites des `RTCDataChannel`, `playsinline` et permission caméra sur iOS, Wake Lock iOS en
mode installé, détection des coupures) ; capacités QR (tables de mémoire) ; sémantique de Rolldown ;
`tsconfig`, `PlayerRepository`, `UndoLastVisitUseCase` ; les tests n'ont pas été relancés.

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.

Aucune.
