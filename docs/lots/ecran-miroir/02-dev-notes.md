# Lot `ecran-miroir` — notes de Dev

> Écrit par l'Orchestrator depuis le rapport du sous-agent `dev` (opus, effort medium d'après son frontmatter).
> **Passage 1 : étapes 0 et 1 seulement** (porte bibliothèque + spike de mesure). Les étapes 2 à 8 attendent la
> mesure sur deux vrais téléphones, puis la planche. Aucun fichier de `src/` ni de `tests/` n'est touché.

## Passage 1 — étapes 0 et 1 (2026-10-22)

### Étape 0 : porte bibliothèque QR, `@nuintun/qrcode@5.0.3` retenue (candidat 2 non nécessaire)

| Porte | Résultat (mesuré par dev) |
|---|---|
| V1 licence | MIT (`npm view` + fichier LICENSE du paquet) |
| V2 maintenance | 5.0.3 publiée le 2026-02-06, précédente 2025-04-07 ; une dépendance d'exécution, `tslib ^2.8.1` |
| V3 contenu du `dist` | Aucune occurrence de `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, `getUserMedia`, `mediaDevices`, `eval`, `new Function`, `.wasm`, `WebAssembly` dans `esm/` et `cjs/` ; ni `import()`, `navigator`, `document.`, `window.`, `globalThis`. Seules APIs de plateforme : `TextEncoder`, `TextDecoder` |
| V4 ESM | `"type":"module"`, `exports["."].import = ./esm/index.js` |
| V5 aller-retour Node | 150 car. M : v6 ; 225 car. M : v9 (53 modules) ; 225 car. L à 3 px/module : v8 ; 225 car. M faible contraste : réussis |
| V6 mode / niveau | `new Encoder({ level })` + segment `Alphanumeric` ; à contenu égal Alphanumeric = v9, Byte = v11 ; `Alphanumeric("abc")` refusé |
| V7 poids | Chunk QR : **49 804 octets minifiés, 17 350 octets gzip** (build Vite 8.2 / Rolldown 1.2.1) |

Installation : `npm install @nuintun/qrcode` (`^5.0.3`) ; `package.json` + `package-lock.json` seuls modifiés,
`tslib` passe de dépendance de dev optionnelle à dépendance de production. `npm audit` : 9 vulnérabilités
préexistantes (sharp, vite, vitest, undici, nanoid…), aucune ne vient de la bibliothèque.

### Q19 (partielle) : la règle `vendor` actuelle aspire la bibliothèque — **mesuré**

Avec `codeSplitting.groups [{ name:'vendor', test:/node_modules/ }]`, un `import()` de la bibliothèque finit
dans `vendor`, importé statiquement par l'entrée et présent dans les `modulepreload` : chargée au démarrage.
Avec un groupe dédié `{ name:'qr', test:/@nuintun[\\/]qrcode/, priority: 2 }` et `vendor` en `priority: 1`, on
obtient un chunk séparé, absent de l'entrée et des preloads. **À faire aux étapes 4/6**, avec le contrôle du
smoke. Reste ouvert dans Q19 : `lib` du tsconfig (rien n'a bloqué), taille des trames, `PlayerRepository`.

### Étape 1 : spike jetable

Dossier `docs/maquettes/ecran-miroir/spike/` — **ignoré par git** (`.gitignore:19 docs/maquettes/`, confirmé
par `git check-ignore`), donc hors commit : `jeton.js` (codec v1 pur : base45 RFC 9285, filtre de localité à
l'encodage et au décodage, sha-256 seul, ≤ 4 candidats UDP host, plafond 400 car., SDP par gabarit),
`jeton.test.mjs` (7 vérifications Node, passent), `index.html` + `spike.js` (page de mesure : offre, scan
caméra sans BarcodeDetector, réponse, scan de la réponse, ping/pong, 16 Kio ; collage de secours ; options de
repli sans IPv6 / 2 candidats / correction L / garder la caméra ; rapport JSON copiable ; journal des essais
dans le `localStorage` de la page de spike), `LISEZMOI.md`.

**Lancer** : `npm run dev:mobile`, puis `https://<IP-PC>:5173/docs/maquettes/ecran-miroir/spike/` sur les deux
téléphones (HTTPS sur l'IP du réseau local vérifié : 200, bibliothèque résolue).

**Vérifié sur le PC uniquement** (Chrome 155 de bureau, deux navigateurs pilotés par playwright, scan de B via
fausse caméra filmant le QR réel de A) :
- A, offre sans caméra : 2 candidats mDNS `.local`, collecte ICE 144 ms, jeton 103 octets / 155 car., **QR v7**
  (45 modules, M).
- B, scan : lu à la première image, 89 ms (décodage ≈ 14 ms, vidéo 640×480).
- B, réponse (permission caméra accordée) : 4 adresses en clair (2 IPv4 privées, 2 IPv6 globales écartées par
  le filtre), jeton 79 octets / 119 car., QR v5.
- Lien : A `connected` ≈ 200 ms après la réponse, paire host → prflx ; ping/pong, messages et 16 Kio dans les
  deux sens.
- Cohérent avec l'hypothèse du § 3.5 *sur ce bureau* (mDNS sans permission caméra, IP en clair avec) : **ce
  n'est pas une preuve pour les téléphones**.
- Dépôt : `npm run lint`, `typecheck`, `npm test` passent (105 fichiers, 2007 tests).

**Non mesuré, testable seulement sur appareils** : Safari iOS (SDP, mDNS, permission caméra, `playsinline`),
Chrome Android, scan écran à écran et en lumière faible, partage de connexion dans les deux sens, isolation
des clients, mode avion + Wi-Fi, délai réel de collecte ICE, délai avant « perdu ».

### Écarts (ajustements, aucune refonte)

- Le jeton n'encode ni `mid`, ni `sctp-port`, ni `max-message-size` : fixés dans le gabarit (`0`, `5000`,
  `262144`). Le spike signale dans `alertes` tout SDP réel qui s'en écarte ; si Safari diffère, il faudra les
  ajouter au jeton.
- Octet de drapeaux : rôle (bit 0), `setup` (bits 1-2), bit 3 réservé (refusé si non nul), nombre de candidats
  (bits 4-7). Un nom `.local` non UUID porte sa longueur sur un octet.
- Jeton de mesure : base45 de 155 à 179 car. ⇒ QR v5 à v8 avec 2 à 4 candidats, sous la cible v10.

### Pour les phases suivantes

- **Sec (Q21)** : le filtre de localité ne s'applique pas à un nom mDNS (adresse résolue par le navigateur) ;
  les IPv6 globales (fréquentes sur les box) sont écartées, point de mesure ; CGNAT 100.64/10 et lien local
  169.254 écartés conformément au § 3.5.
- **Test (Q20)** : délai avant « perdu » non mesuré ; le spike horodate les états ICE et a un bouton « Fermer le
  lien ».
- Partage de connexion : la page vient du PC, qui doit rejoindre le même réseau, ou bien la page doit être
  ouverte avant de changer de réseau puis ne plus être rechargée (voir `LISEZMOI.md`). Pare-feu Windows : peut
  bloquer le port 5173, non vérifié.
- `.ai/architecture-context.md` apparaît modifié dans `git status` : c'est la régénération faite par
  l'Orchestrator au début du lot, pas un effet de dev.

## Passage 2 — étapes 2 à 4 (2026-10-24)

Dev (opus, effort d'après son frontmatter, 103 appels d'outils, ~21 min). Planche acceptée le 2026-10-24 : voir
01 § Résolutions à la planche. **Pas d'UI** à ce passage. Branche `lot/ecran-miroir`, rien de commité, `src/core/domain`
intact. Relancé et revérifié par l'Orchestrator : `typecheck` vert, `biome check` vert (391 fichiers), `npm test`
**113 fichiers, 2087 tests** (2007 avant, +80). `build` et `smoke` (aucun `REMPLIR`) rapportés verts par dev.

**Application (étape 2)** : `ports/driven/PeerLinks.ts` (échecs typés `unavailable | unreadable | incompatible |
no-local-candidate | failed`, `NullPeerLinks`), `QrScanner.ts` (générique sur le viseur), `QrEncoder.ts` ;
`ports/driving/ShareMatch.ts`, `WatchMatch.ts` (porte aussi `MirrorView`, `MirrorPlayer`) ; use cases
`mirrorProtocol.ts` (réutilise `versMatchRecord` / `versDart`), `ShareMatchUseCase.ts`, `WatchMatchUseCase.ts`.

**Infrastructure (étape 3)** : `peer/jetonDeJumelage.ts` (portage du codec du spike), `peer/trames.ts`,
`peer/WebRtcPeerLinks.ts` (`iceServers: []`, fabrique injectée, collecte ICE 3 s), `device/CameraQrScanner.ts`,
`qr/bibliothequeQr.ts` (seul `import()` de la bibliothèque), `qr/LibraryQrEncoder.ts`.

**Composition, fakes, gardes (étape 4)** : `container.ts` (`peerLinks`, `devices.qrScanner`, `devices.qrEncoder`,
`Services.shareMatch`, `watchMatch`) ; `tests/fakes/index.ts` (`ReseauFactice`, `FakePeerLink(s)`, `FakeQrScanner`,
`FakeQrEncoder`) ; `biome.json` (bibliothèque QR interdite dans `src/core/**`) ; `vite.config.ts` (groupe `qr`
priorité 2, `vendor` priorité 1) ; `smoke-build.mjs` (bibliothèque QR hors démarrage).

**Tests ajoutés (80)** : `mirrorProtocol` 12, `partageMiroir` 22, `jetonDeJumelage` 8, `trames` 5, `WebRtcPeerLinks` 9,
`CameraQrScanner` 11, `bibliothequeQr` 4, `miroirBoundary` 5, `reseauBoundary` +4.

**Contre-épreuves** (toutes retirées) : `new RTCPeerConnection()` dans `src/ui/contrepreuveReseau.ts` fait échouer
`reseauBoundary` (`× lien WebRTC : seule la liste fermée de fichiers y touche`) ; un commentaire citant l'API
caméra dans `ui/` fait échouer la famille caméra ; un import de la bibliothèque dans `src/core` est refusé par
Biome ; sans le groupe `qr`, le smoke échoue (« 0 chunk(s) assets/qr-*.js précaché(s) »).

**Poids** : chunk `qr-*.js` séparé 50,12 kB (17,65 kB gzip), précaché, absent d'`index.html` et des
`modulepreload`. Entrée `index` 111,26 kB (32,90 kB gzip), précache 57 entrées (1020,22 KiB). **Référence avant lot
non mesurée** : l'écart se chiffre à l'étape 6.

### Écarts (ajustements, aucune refonte)

1. **Troisième message `arret`** au protocole v1 (envoyé par `stop()` et à un nouveau jumelage) : sans lui le miroir
   ne distingue pas « Partage arrêté » de « Connexion perdue » (décision Q12 / Q16). La fermeture du canal vaut « perdu ».
   Le protocole passe de deux à trois messages (`partie`, `volee`, `arret`) ; à graver dans les docs.
2. États de session ajoutés : `preparing` (collecte ICE), `offering` porte `rejected` ; version incompatible côté
   miroir = `failed{reason:'incompatible'}`.
3. `genreBoundary` : `WatchMatch.ts` remplace `ShareMatchUseCase.ts` dans la liste (le type `MirrorPlayer` vit
   dans le port) ; plancher 18 → 20 ; `MiroirKiller.tsx` s'ajoutera au passage 3.
4. `no-local-candidate` rendu seulement si aucun des deux côtés n'a de candidat local (l'autre s'apprend en route).
5. Avant la première ouverture, seul l'échec ICE `failed` fait passer le lien à `lost` (pas `disconnected`).
6. Trames de 5 000 unités UTF-16, préfixe `C` / `F`, sans couper une paire de substitution ; chaque trame < 16 Kio.
7. Le miroir revérifie la volée en cours par rejeu du journal (`try/catch`) : l'UI ne reçoit jamais de fléchettes
   illégales.
8. Candidats : ordre du navigateur gardé, ≤ 4 ; l'adresse de l'interface mobile prend sa place (constaté sur
   Android), noté dans un test, rien réordonné.

### Questions ouvertes nouvelles

- **« En attente d'une partie » entre deux parties** : le miroir garde la dernière partie jusqu'à la suivante ; il
  n'affiche « en attente » qu'avant la première. Retirer la partie en quittant l'écran de jeu exigerait un
  `publish(null)` / `withdraw` et un message de plus : **point produit, à l'utilisateur** (la planche dit seulement
  « aussi entre deux parties »).
- **SDP réels** : les tests du codec utilisent des SDP synthétiques à la forme du spike ; verser les SDP réels
  Android/iPhone (rapports du spike) serait un plus, à décider (technique, faible enjeu).
- **Coupure < 5 s** : les sessions passent à `lost` tout de suite ; le délai de 5 s revient au hook UI.
- **Collecte ICE 3 s** vs ≈ 130 ms mesurés : à confirmer sur le partage de connexion.

## Passage 3a — étape 5, UI (2026-10-24)

Dev (opus, 107 appels d'outils, ~22 min). Branche `lot/ecran-miroir`, rien de commité, `src/core/domain` intact.
Revérifié par l'Orchestrator : `typecheck` vert, `biome check` vert (410 fichiers), `npm test` **114 fichiers,
2112 tests** (+25). `build` et `smoke` rapportés verts par dev (chunk `qr-*.js` séparé 50,12 kB / 17,65 gzip ; entrée
`index` 96,43 kB ; précache 77 entrées, 1064,97 KiB). **Rien n'a été vu à l'écran** : relecture `ecran` à faire.

**Créés** : hooks `usePartage` (avec `useApresDelai`, délai de 5 s), `useMiroir`, `useScannerQr`,
`resteEntrainement` ; composants `CodeQr`, `Viseur`, `VoyantMiroir`, `Miroir` (cadre, barre de volée, podium,
bandeaux) ; écrans `PartageEcran`, `MiroirEcran` (aiguillage typé `never`, un `lazy` par mode), `Jumelage`,
`vueMiroir`, `momentMiroir` ; vues `MiroirX01`, `MiroirTourDuMonde`, `MiroirCricket`, `MiroirKiller`,
`MiroirEntrainement`. **Modifiés** : `useVoleeEnCours` (effet `publish`), `useCheckoutPractice`, `BandeauMatch`
(voyant à gauche du livre), `TableauCricket` (`Marques`, `etatLisible` exportés, taille `grande`), `ReglagesEcran`
(groupe « Écran miroir »), `App.tsx` (routes `/miroir/partager`, `/miroir`), `chemins.ts`, `labels.ts`, `couleurs.ts`,
`index.css` (3 paliers `--text-miroir-xl`, `-l`, `-solo`). **Tests** : `tests/ui/miroir.test.tsx` (24),
`genreBoundary` (+ `MiroirKiller.tsx`, plancher 21), `lazyRoutes` (+1), `reglagesParUsage` (4 groupes).
Contre-épreuves (retirées) : sans `publish` dans `useVoleeEnCours`, le test « la saisie le pilote » échoue ; avec un
délai de perte à 0, les tests de coupure échouent.

### Écarts à la planche / décisions (ajustements)

1. Teintes du QR **provisoires** (`TEINTES_QR`, `TEXTE_SUR_ROUGE` dans `couleurs.ts`) : migrées en jetons à l'étape 6.
2. Trois paliers typographiques ajoutés à `@theme` (8,5 / 6 / 10 rem) : l'échelle existante ne permet pas les chiffres
   de la planche.
3. **Pas de moyenne sur le miroir** : la planche en montrait une, mais Q7 dit « ni statistiques » ; la décision gagne.
4. **Genre limité à « éliminé(e) »** : « Dernière en vie » / « Survivante » de la planche ne sont pas accordés
   (`CLAUDE.md` limite le genre à « éliminé / éliminée ») ; le miroir dit « Dernier en vie · N vies ».
5. Couleurs adaptées aux jetons existants (vies en `rouge-cible`, éliminé en `craie-3` barré plutôt qu'en opacité,
   voyant en `vert-cible` / `rouge-cible`).
6. Délai de 5 s aussi sur le voyant de la saisie.
7. Réutilisation : `BarreEtapes`, `summarize` / `rankPlayers`, `KillerRules.ranking` ; aucune règle recopiée.
8. Bandeaux de moment seulement quand le journal gagne exactement une volée ; priorité X01 « Partie ! » > « Manche ! »
   > Bust > 180 ; aux autres jeux, seulement « Partie ! ».

### Questions ouvertes (produit, à l'utilisateur)

- Libellés hors planche : « Retour », « Le code n'a pas pu s'afficher. Recommencez. », « Pas de caméra » vu de la
  saisie (« …partager la partie : il faut une caméra pour lire la réponse. »).
- Retour automatique après 2 s aussi quand on est arrivé par les Réglages (retour aux Réglages).
- Caméra en panne (`failed`) traitée comme « Caméra refusée » avec « Réessayer ».
- « Volée N » du bandeau = volées au journal + 1, pas un numéro de tour de table.
- Angles morts à voir sur appareil : lisibilité à 2-3 m, Killer à 6 en paysage, Cricket à 4, portrait, thème clair,
  contraste du `laiton-clair` sur `feutre-nuit`, cases de volée tronquées.

### Reste pour le passage 3b

Étape 6 (politique et date, Q17 ouverte ; jetons QR et blanc sur rouge dans `index.css` + `themeBoundary`, 4 → 5
entrées de `rules/theme-colors.md`, retrait de `TEINTES_QR` / `TEXTE_SUR_ROUGE` ; mesure de poids avec référence
avant lot) ; étape 7 (docs : `CLAUDE.md`, CONVENTIONS § 4, 5, 7, 13, 14, charte, `rules/persistence`, `agents/sec`,
DEPLOIEMENT, glossaire, PROJECT_PLAN, 3e message `arret`, paliers typographiques, export de `Marques`, puis
`/refresh-architecture`) ; étape 8 (preuve sur deux téléphones, agent `ecran`).

### Reste pour le passage 3 (ancienne rédaction, étape 5 faite)

Étape 5 (UI : effet de `useVoleeEnCours`, `usePartage`, `useMiroir`, `CodeQr`, `Viseur`, `VoyantMiroir`, routes,
`MiroirEcran` et ses 5 vues avec bandeaux de la planche, Wake Lock, entrées, `labels.ts`, extraction du reste de
l'entraînement, `MiroirKiller.tsx` dans `genreBoundary` et `lazyRoutes`, tests « aucune action » et
`it.each(GAME_MODE_IDS)`) ; étape 6 (politique et date, Q17 ouverte ; jetons QR et `themeBoundary` 4 → 5 ; poids) ;
étapes 7-8.

## Passage 3b — étapes 6 et 7 (2026-10-24)

Dev (opus). Branche `lot/ecran-miroir`, rien de commité, `src/core/domain` intact, `/refresh-architecture` **non**
lancé (Orchestrator), preuve sur appareils et relecture `ecran` **non** faites (étape 8).

### Étape 6

**Politique** (Q17 close) : texte de `politique-proposee.md` écrit **tel quel** dans `SECTIONS_CONFIDENTIALITE`
(`src/ui/labels.ts`) : 3e paragraphe de « Politique de confidentialité » remplacé, paragraphe ajouté à « Sur votre
appareil », 1er paragraphe de « Fonctions du téléphone » remplacé, section « Écran miroir » (5 paragraphes) entre
« Fonctions du téléphone » et « Hébergement », ligne ajoutée à « Hébergement ». Repères entre crochets non copiés.
`DATE_MISE_A_JOUR_CONFIDENTIALITE = 'Mise à jour le 24 octobre 2026'`. `tests/ui/confidentialite.test.tsx` : date,
titre « Écran miroir » dans la liste des sections, un test nouveau (serveurs, adresse publique, genre au Killer,
« Trois cas », caméra sur le bouton, plus de « n’utilise jamais la caméra », rien d'enregistré, réseau local).

**Jetons** : `--color-qr-modules` `#14110a`, `--color-qr-fond` `#ffffff`, `--color-sur-rouge` `#ffffff` dans `@theme`
**et** sous `html[data-theme="clair"]`, identiques (QR sombre sur clair dans les deux thèmes, Q14). `CodeQr` peint
avec `fill-qr-fond` / `fill-qr-modules` ; `Miroir.tsx` (`text-sur-rouge`, bandeau bust et « Connexion perdue ») et
`MiroirEcran.tsx` (`border-sur-rouge`, bouton « Refaire le code ») n'ont plus de `style` en ligne. `TEINTES_QR` et
`TEXTE_SUR_ROUGE` retirés de `couleurs.ts`. Classes présentes dans le CSS construit (vérifié). `themeBoundary` :
deux entrées réservées de plus (« code QR » → `CodeQr.tsx`, témoin 2 ; « blanc sur rouge du miroir » →
`Miroir.tsx` + `MiroirEcran.tsx`, témoin 2) et un test d'égalité des trois valeurs dans les deux blocs.
Contre-épreuve (retirée) : `fill-qr-fond text-sur-rouge` dans `src/ui/contrepreuveQr.ts` fait échouer les deux
entrées. `.claude/rules/theme-colors.md` mis à jour.

**Poids** — référence : `main` (`cc8e1ec`) construit dans un worktree temporaire du scratchpad
(`git worktree add --detach`, `node_modules` en jonction, puis `git worktree remove`) : aucun fichier du working tree
touché. Démarrage = scripts, `modulepreload` et feuilles de style d'`index.html`, gzip niveau 9 par Node.

| | `main` | lot | Écart |
|---|---|---|---|
| Démarrage, brut | 579 543 o (6 fichiers) | 612 575 o (10 fichiers) | +33 032 o (+5,7 %) |
| Démarrage, gzip | 171 809 o | 183 955 o | +12 146 o (+7,1 %) |
| Entrée `index-*.js` | 89,49 kB | 96,36 kB | +6,87 kB |
| `labels-*.js` | 46,1 kB | 51,9 kB | +5,8 kB |
| CSS `index-*.css` | 80,37 kB | 84,05 kB | +3,7 kB |
| Précache | 56 entrées, 949,85 KiB | 77 entrées, 1 067,43 KiB | +21 entrées, +117,58 KiB (+12,4 %) |
| Chunk `qr-*.js` | — | 50,12 kB (17,65 kB gzip) | hors démarrage, précaché |

⚠️ Quatre chunks du domaine (`MatchEvent` 11,5 kB, `rules` 4 kB, `config`, `Score`) apparaissent désormais dans les
`modulepreload` (≈ 16,3 kB brut). **Cause non analysée** : hypothèse, les sessions du miroir câblées statiquement
dans `container.ts` (→ `mirrorProtocol` → `backupSchema` / `GameModes`), ou un simple redécoupage de Rolldown d'un
code déjà chargé. À regarder si le démarrage compte ; je n'ai rien changé (hors du périmètre de ce passage).

### Étape 7 — docs regravées

- `CLAUDE.md` : décision « PAS de réseau » → « PAS de serveur » + bloc ⚠️ « rouvert puis regravé » (WebRTC local
  sans serveur, deux QR, filtre de localité, caméra sur bouton, un fichier par capacité, trois messages, genre au
  Killer seul, rien stocké sur le miroir, `firebase` toujours interdit) ; sous-puce politique (date, fil-piège
  WebRTC et caméra) ; décision « genre » (le miroir le transporte au Killer seulement ; références de lignes
  `438, 448, 457` remplacées par `SECTIONS_CONFIDENTIALITE`, devenues fausses) ; stack figée + `@nuintun/qrcode` ;
  nouvelle entrée DS « Écran miroir » ; arborescence (`peer/`, `qr/`).
- `CONVENTIONS` : § 4 (exception des sessions), § 5 (trois ports driven, null-objects, `QrScanner` générique,
  piège des commentaires), § 7 (câblage du miroir), § 13 (un mode apporte sa vue miroir), § 14 (compte et arbre).
- `CHARTE` : paliers `text-miroir-*`, jetons QR et `sur-rouge` dans la palette, section « L'écran miroir ».
- `rules/persistence.md` (le miroir ne persiste rien ; l'import n'est plus la seule entrée non fiable),
  `rules/theme-colors.md`, `rules/glossary.md` (« écran miroir / miroir », « partager », « jumeler / jumelage »),
  `agents/sec.md` (lien local, entrées non fiables, caméra), `DEPLOIEMENT` (chunk QR précaché hors démarrage, R5
  arrivé, familles du fil-piège, Play Console), `PROJECT_PLAN` § 6 (décisions du lot).

### Écarts (ajustements, aucune refonte)

1. **`themeBoundary` passe de 4 à 6 entrées**, pas 5 : le blanc sur rouge sert deux fichiers que le QR ne sert pas ;
   une entrée commune aurait laissé un jeton QR passer dans `Miroir.tsx` sans échouer. Quatre familles de sens.
2. Le jeton s'appelle `sur-rouge` (sur le modèle de `sur-laiton`), pas `texte-sur-rouge` : il sert aussi une bordure.
3. `export` de `Marques` / `etatLisible` (`TableauCricket`), cité dans « reste pour 3b » : non documenté dans la
   charte (détail d'implémentation, aucune règle nouvelle).

### Tests

`npm test` : **114 fichiers, 2116 tests** verts (2112 avant, +4 : 1 `confidentialite`, 3 `themeBoundary`).

### Questions ouvertes

- Hausse du démarrage par les chunks du domaine préchargés (ci-dessus) : à accepter ou à faire analyser.
- **Play Console** : déclaration de la caméra au formulaire « Sécurité des données » (hors dépôt, utilisateur).
- Libellés hors planche du passage 3a : inchangés, toujours à l'utilisateur.

### Ce qui reste

`/refresh-architecture` (Orchestrator) ; étape 8 : preuve sur deux téléphones (partage de connexion, mode avion,
lumière faible, caméra refusée) et relecture `ecran` (portrait / paysage, deux thèmes, lisibilité à 2-3 m) ; puis
Test, Sécurité, Revue.
