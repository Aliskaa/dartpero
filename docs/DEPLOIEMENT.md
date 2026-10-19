# Déploiement — Firebase Hosting

> Ce fichier est le **manuel** du déploiement. La décision, elle, est gravée dans
> [`CLAUDE.md`](../CLAUDE.md) § Décisions structurantes (pas de Firebase **dans** l'app, Hosting
> n'est qu'un serveur de fichiers statiques) ; ce fichier ne la contredit jamais. Les pièges
> vitaux (cache, `id: '/'`, `ignore` sans `!`, garde `REMPLIR`) restent aussi résumés dans
> `CLAUDE.md` § Déploiement.

---

## Mettre en ligne

L'app est en ligne sur **https://dartpero.web.app** (projet Firebase `dartpero`, même compte
que Pokegypte). Une seule commande : `npm run firebase:deploy` (= `build` + `smoke` + `firebase
deploy --only hosting`, `package.json` l. 19 ; `smoke` = `node scripts/smoke-build.mjs`).

- ⚠️ **C'est la seule commande documentée, et la seule qui passe par le smoke.** Un `firebase
  deploy` lancé à la main, ou `firebase hosting:channel:deploy`, saute tout le smoke — garde
  `REMPLIR` comprise (§ Confidentialité). Pas de `hosting.predeploy` : décision de l'utilisateur
  au lot `confidentialite-assetlinks` (risque R-a accepté et documenté ici).

- **Hosting et rien d'autre.** `firebase.json` ne déclare **que** le bloc `hosting` : ni
  Firestore, ni Storage, ni Functions, ni règles de sécurité — il n'y a pas de données côté
  serveur, elles vivent dans l'IndexedDB du téléphone. La CLI (`firebase-tools`) est
  **globale**, volontairement absente du `package.json` : c'est un outil de poste de travail,
  pas une dépendance du projet.

## Réécriture SPA

- **Le `rewrite ** → /index.html` est obligatoire** : sans lui, ouvrir directement
  `/historique` ou `/partie/<id>` renverrait un 404 Firebase au lieu de laisser React Router
  faire son travail. Les vrais fichiers gagnent toujours sur la réécriture, donc `sw.js` reste
  bien servi comme du JavaScript.
- Revers : un fichier **absent** de `dist/` est servi comme `index.html` en 200. Pour
  `/.well-known/assetlinks.json`, il recevrait en plus l'en-tête `application/json` (R-f) : le
  smoke vérifie sa présence, le `curl` après déploiement l'observe.

## En-têtes de cache

- ⚠️ **Les en-têtes de cache ne sont PAS un détail.** Firebase pose `max-age=3600` sur *tout*
  par défaut, `index.html` et `sw.js` compris — donc une PWA en `registerType: 'autoUpdate'`
  peut servir l'ancienne version **pendant une heure** après un déploiement, y compris à
  quelqu'un qui recharge en boucle. Le bloc `headers` corrige ça :
  - `/assets/**` et `/workbox-*.js` → `max-age=31536000, immutable` (noms hachés par Vite,
    ils ne changent jamais de contenu) ;
  - `/icons/**` → 7 jours (noms **non** hachés, une semaine est le compromis) ;
  - tout le reste → `no-cache`, c'est-à-dire « revalide avant de servir » : `index.html`,
    `sw.js`, `registerSW.js`, `manifest.webmanifest` et les routes SPA. La mise à jour est
    donc vue au premier rechargement ;
  - `/.well-known/assetlinks.json` → `Content-Type: application/json` + `no-cache`, **en
    dernier** (§ Confidentialité et Digital Asset Links).
- **La dernière règle `headers` qui matche l'emporte** (vérifié en vrai avec `curl -I` après
  déploiement, pas déduit de la doc) : c'est pourquoi le fourre-tout `**` est écrit **en
  premier** et les règles précises après. Inverser l'ordre casserait le cache long des assets.
- **Les en-têtes s'appliquent au chemin DEMANDÉ, pas à la cible de la réécriture** : `/partie/x`
  ne matche pas `/index.html`. C'est la deuxième raison d'avoir un `**` fourre-tout.

## Service worker et bundle

- **Le bundle est découpé par route** (lot « bundle-par-route », post-audit 2026-09-10) :
  `React.lazy()` sur les écrans de `src/App.tsx` (sauf `AccueilEcran`, volontairement statique)
  et sur les quatre modes de `src/ui/ecrans/games/PartieEcran.tsx`. Les chunks lazy restent des
  noms **hachés par Vite** : ils tombent sous la même règle `immutable` que le reste de
  `/assets/**`, aucun changement de `firebase.json`. ⚠️ **Un écran ne se réimporte jamais
  statiquement dans `App.tsx` ou `PartieEcran.tsx`** — `tests/architecture/lazyRoutes.test.ts`
  le vérifie. Le service worker (`globPatterns`) précache tous les chunks automatiquement,
  y compris ceux jamais ouverts — c'est ce qui permet à un mode jamais visité de fonctionner
  hors ligne dès la première visite (vérifié en conditions réelles à ce lot).
- ⚠️ **Vite 8 tourne sur Rolldown : `manualChunks`/`advancedChunks` y sont dépréciés.** Pour
grouper des chunks (le vendor React/React Router/TanStack Query/Dexie du lot « bundle-par-route »
par exemple), l'option est `build.rollupOptions.output.codeSplitting.groups`. Un `import()`
dynamique reste servi sous un service worker `autoUpdate` qui peut purger l'ancien précache
sous un onglet resté ouvert après déploiement — d'où l'écouteur `vite:preloadError` dans
`src/main.tsx` (rechargement unique, garde-fou `sessionStorage`).
- **Repli de navigation** : `generateSW` répond `index.html` à toute navigation ;
  `navigateFallbackDenylist: [/^\/\.well-known\//]` en exclut `/.well-known/`, qui n'est pas non
  plus précaché (`json` hors `globPatterns`, glob sans `dot`). Hors ligne, `assetlinks.json`
  donne donc une erreur réseau, pas l'app : c'est voulu.

## Contexte sécurisé (dev, téléphone, iOS)

- **Deux modes de dev** :
`npm run dev` → `http://localhost:5173` (localhost **est** un contexte sécurisé : Wake Lock,
vibration et PWA y marchent déjà, sans avertissement de certificat) ;
`npm run dev:mobile` → `vite --mode mobile`, active `@vitejs/plugin-basic-ssl` +
`server.host` → `https://<IP-PC>:5173` pour tester depuis le téléphone sur le même WiFi
(accepter l'avertissement de certificat auto-signé).
- **iOS** : l'installation passe par Safari → « Sur l'écran d'accueil » (voir § Installation et
  manifeste). Le HTTPS de Firebase règle en revanche la question du contexte sécurisé — Wake
  Lock, vibration et service worker fonctionnent sur le domaine, sans le certificat auto-signé
  de `dev:mobile`.

## Stockage persistant

L'app demande `navigator.storage.persist()` au démarrage (port `PersistentStorage`) et affiche
l'état dans Réglages, groupe Sauvegarde, en une phrase sous Exporter / Restaurer. Le navigateur tranche seul, et **un refus est attendu, pas un
défaut** :

| Navigateur | Comportement attendu (à vérifier sur appareil) |
| --- | --- |
| Chrome / Android | Accorde ou refuse selon l'engagement (installée, ajoutée aux favoris, notifications…) ; un onglet simple peut être refusé. Vérifier avec la PWA installée. |
| Safari iOS | Sans installation, la base peut être effacée après ~7 jours sans ouverture ; le support de `persist()` hors installation n'est pas garanti. |
| Firefox | Peut afficher sa propre demande à l'utilisateur ; l'app ne l'anticipe pas. `persist()` étant demandé sur toutes les routes, cela vaut aussi pour un visiteur de `/confidentialite` (R-e, accepté). |
| API absente | État « indisponible » : pas de lien, simple rappel d'exporter. |

« Demander la protection » (lien de la phrase, état non protégé ; « Redemander » avant le lot
`reglages-par-usage`) rappelle `persist()` ; si le navigateur refuse encore, l'écran le dit
(« Le navigateur a refusé. Il accepte en général une fois Dartpéro installé (voir Application, en
haut). », réduit à « Le navigateur a refusé. » si l'app est déjà installée) plutôt que de rester
muet. Le refus du démarrage, lui, n'affiche rien. L'installation n'est plus proposée sous la
phrase : c'est le voyant Application, en tête des Réglages, qui porte l'action.

⚠️ Protégé ne veut pas dire sauvegardé : désinstaller l'app ou vider les données du site efface
toujours la base. L'export JSON reste le filet.

### Mise à jour du schéma Dexie avec un onglet resté ouvert

Le lot `volee-partielle` a porté la base en **v3** (table `visitDrafts`, sans `upgrade`). Un onglet
ou une PWA restée ouverte sur l'ancien bundle (v2) **n'échoue pas** : Dexie 4.4.4 ferme sa connexion
au `versionchange` sans bloquer l'ouverture en v3, l'ancien code rouvre la base à sa prochaine
opération, et la vérification de schéma ignore une table en trop (vérifié dans
`node_modules/dexie`, lot `volee-partielle`). Seule conséquence : ce vieil onglet ne connaît pas
`visitDrafts`, donc une partie qu'il supprime laisse un brouillon orphelin (jamais relu) et un
import fait depuis lui laisse un brouillon périmé (rendu seulement si `visitCount` coïncide). Le
rechargement de l'onglet règle tout.

## Installation et manifeste

L'app invite à s'installer (lot `installation-guidee`) : port `AppInstallation`, seul l'adapter
`BrowserAppInstallation` lit `beforeinstallprompt`, `appinstalled`, `(display-mode: standalone)`
et `navigator.standalone`. Il écoute **dès sa construction** : les services naissent donc dans
`src/main.tsx`, avant `createRoot` — l'invite de Chromium peut partir avant le montage de React.

| Navigateur | Ce que voit l'utilisateur |
| --- | --- |
| Chrome / Edge Android, Chromium de bureau | `beforeinstallprompt` capté : ligne « Installer Dartpéro » sur l'Accueil, action « Installer » du voyant Application des Réglages ; « Installer » ouvre la fenêtre native (avec les captures). Ne part que si Chrome juge l'app installable, et parfois tard (heuristique d'engagement). |
| Safari iOS / iPadOS | Pas d'API : voyant « Pas installée » + « Comment ? », qui mène au guide en trois gestes sous la ligne de contenu des Réglages (Partager, « Sur l'écran d'accueil », « Ajouter ») ; la ligne d'Accueil y mène (`/reglages#installer`). |
| Chrome, Firefox, Edge… sur iOS, navigateurs intégrés aux apps | « Comment ? » ; le guide dit « Ouvrez ce lien dans Safari pour installer Dartpéro. » |
| Firefox Android, Safari macOS, autres | État « indisponible » : rien sur l'Accueil ; « Comment ? » et phrase générique (menu du navigateur) dans les Réglages. |
| App installée (`standalone`) | Rien sur l'Accueil ; voyant Application « Installée », en vert, sans action. |

- **« Plus tard »** masque la ligne de l'Accueil pour de bon sur cet appareil (préférence
  `installation:ecartee`, à ne jamais renommer) ; les Réglages gardent toujours leur entrée.
  Jamais d'invitation sur un écran de partie, jamais d'invite ouverte sans un geste.
- Détection iOS par user agent (`detectIosBrowser`) : un iPad en « site pour ordinateur » se
  présente comme un Mac, reconnu à ses points de contact. Brave iOS passe pour Safari.
- **Installée mais ouverte dans un onglet** : après rechargement, aucune API ne le dit — état
  « indisponible », Accueil muet ; dans les Réglages, voyant « Pas installée » + « Comment ? »
  et phrase générique du guide. Accepté (aucune API pour le savoir).

**Manifeste** (`vite.config.ts`) :

- ⚠️ **`id: '/'` ne se change jamais.** Sans `id`, l'identité était calculée depuis `start_url`
  résolu (`https://dartpero.web.app/`) ; `'/'` la reproduit. Une autre valeur ferait une seconde
  icône chez tous ceux qui ont déjà installé l'app. Vérification : DevTools → Application →
  Manifest → « Computed App ID », identique avant et après.
- `categories` : `games`, `sports`, `entertainment`.
- `shortcuts` : « Nouvelle partie » → `/nouvelle-partie` (appui long sur l'icône Android),
  icône `icons/icon-192.png` réutilisée. Sur une installation existante, le raccourci n'arrive
  qu'à la mise à jour de la WebAPK par Chrome — délai non garanti. ⚠️ Ne jamais désinstaller
  pour « tester plus vite » sans exporter d'abord : la base partirait avec.
- `screenshots` : copies **à l'identique** de `docs/captures/{accueil,partie-x01,paysage}.png`
  dans `public/screenshots/`, `sizes` = dimensions réelles (780×1688, 780×1688, 1000×462). Si les
  captures sont refaites, **les recopier** et corriger `sizes` — le smoke le vérifie.
- `globIgnores: ['**/node_modules/**/*', 'screenshots/**']` : les captures (≈ 425 ko) ne servent
  qu'à la fenêtre d'installation, en ligne ; hors précache. Hors ligne, cette fenêtre s'affiche
  donc sans captures (accepté). `firebase.json` n'a pas bougé : `/screenshots/*.png` tombe sous
  le fourre-tout `no-cache`.

**Contrôles de `npm run smoke`** (`scripts/smoke-build.mjs`, donc aussi dans `firebase:deploy`) :

1. **Statiques, avant Chromium** (code 1 immédiat) :
   - manifeste : `id`, `start_url`, `scope` = `/` ; `categories` contient `games` ; un raccourci
     vers `/nouvelle-partie` dont l'icône existe (≥ 96 px) ; exactement 3 captures (2 `narrow`,
     1 `wide`), présentes, aux dimensions annoncées (en-tête PNG) ;
   - précache de `dist/sw.js` : au moins 10 URL dont `index.html`, `manifest.webmanifest`,
     `icons/icon-192.png` ; **aucune** sous `screenshots/` ni `.well-known` ;
   - `dist/.well-known/assetlinks.json` présent, JSON lisible, **tableau** (le type, pas `[]` : le
     lot 4 le remplira) ;
   - liste blanche des entrées cachées de `dist/` : `.well-known` et `.well-known/assetlinks.json`
     seulement ;
   - `denylist` de la `NavigationRoute` lu dans `sw.js` : couvre `/.well-known/assetlinks.json`,
     ne couvre ni `/`, ni `/confidentialite`, ni `/reglages`, ni `/partie/x` ; absent ou illisible
     = faute (échec fermé).
2. **Chromium**, un contexte vierge par page : `/` puis `/confidentialite` en accès direct (`h1`
   « Confidentialité ») ; aucune erreur JS, **aucune requête hors `127.0.0.1:4179`** (sauf
   `data:` / `blob:`).
3. **Garde de publication**, après Chromium : aucun `REMPLIR` (ASCII, pour ne pas rater un « À »
   échappé ou décomposé) dans les fichiers texte de `dist/` (sans octet nul, dossiers à point
   compris) ; plancher de 10 fichiers dont `index.html` et un `assets/*.js` ; témoin « Mentions
   légales », sinon « scanner aveugle ». ⚠️ **Aucun contournement, à dessein** : ni variable
   d'environnement, ni argument.

Chaque contrôle a été cassé par mutation au moment de son écriture (lots `installation-guidee`
et `confidentialite-assetlinks`, `docs/lots/*/02-dev-notes.md`).

## Confidentialité et Digital Asset Links

Lot `confidentialite-assetlinks` (feuille de route Play Store, lot 3).

**La politique** vit dans l'app : `/confidentialite` (`ConfidentialiteEcran`, route `lazy`, lien
depuis Réglages, groupe Joueurs et appli), texte dans `src/ui/labels.ts` (`SECTIONS_CONFIDENTIALITE`,
`MENTION_*`, `DATE_MISE_A_JOUR_CONFIDENTIALITE`).

- **URL à donner à la Play Console** : `https://dartpero.web.app/confidentialite`. Page rendue
  en JS ; si un robot de Google ne l'exécute pas (R-g / R1), plan B = une page statique, dans un
  lot à part.
- **Mentions** (fournies par l'utilisateur le 2026-10-10) : éditeur « Dartpéro, particulier non
  professionnel », contact `roulandzanellakevin@gmail.com` (public, donc exposé au spam),
  hébergeur Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande (entité choisie par l'utilisateur ; à revérifier
  dans les conditions Firebase / Google Cloud du projet). Ces valeurs sont recopiées ici : si une
  constante `MENTION_*` change, mettre cette ligne à jour. Pas de
  téléphone de l'hébergeur (aucun numéro vérifié). Ce n'est pas un avis juridique.
- **Marqueurs `À REMPLIR`** : une mention inconnue s'écrit `'À REMPLIR : …'` en littéral dans
  sa constante (jamais une constante partagée). La garde du smoke bloque alors tout déploiement,
  même un correctif (R4, voulu).
- ⚠️ **R5 — le texte devient faux** le jour où arrive une capacité réseau (lot 6, `deblocage-pro`,
  mesure d'audience), une permission (micro, caméra, localisation, notifications), un cookie ou
  une donnée stockée nouvelle. Ce lot-là met `SECTIONS_CONFIDENTIALITE` **et** sa date à jour.
  Seul le réseau a un fil-piège automatique : `tests/architecture/reseauBoundary.test.ts`
  (`fetch`, XHR, WebSocket, EventSource, `sendBeacon`, import `firebase`, et toute URL
  `https?://` écrite en dur dans `src/` et `index.html` hors les deux URI d'espace de noms
  w3.org). Il ne voit ni une URL sans schéma (`//cdn…`) ni une URL assemblée à l'exécution, et
  le smoke n'ouvre que deux pages (R-c). Cookies, permissions, stockage : relecture seulement.
- **Annonce vocale (R-d, accepté)** : `SpeechAnnouncer` prend la première voix `fr` sans
  regarder `localService` ; selon le navigateur, le texte annoncé (pseudo compris) peut être
  synthétisé en ligne. La politique le dit et renvoie à « Annoncer les volées » dans
  Réglages → Affichage (lot `reglages-par-usage`) : **si ces libellés changent, mettre la phrase de la politique à jour**.
- **Import** : la politique dit que les éléments de même identifiant sont **remplacés** par la
  version du fichier (`ManageBackupUseCase.importFrom`). Si l'import change de comportement, le
  texte suit.

**`/.well-known/assetlinks.json`** : `public/.well-known/assetlinks.json` vaut `[]` (JSON valide,
sans effet).

- **`ignore` de `firebase.json`** : `["firebase.json", "**/.!(well-known)",
  "**/.!(well-known)/**", "**/node_modules/**"]`. ⚠️ **Jamais de motif commençant par `!`** :
  firebase-tools 15 utilise glob 10, dont `ignore` est construit en `nonegate` — un `!` y est un
  no-op silencieux ; sous glob 7, il aurait inversé le filtre et n'aurait plus envoyé que ce
  fichier (déduit du code, non observé).
  Garde : `tests/architecture/firebaseHosting.test.ts` (ordre des en-têtes, aucun `!`,
  extglobs présents, `**/.*` absent, réécriture SPA intacte).
- **Pourquoi plus `**/.*`** : sous glob 10, ce motif écarte les entrées à point mais pas les
  fichiers rangés **dans** un dossier à point. **V4** (vraie `listFiles` de firebase-tools 15.20.0
  sur `dist/`) : avec l'ancien motif, `.cache/x.txt`, `sub/.git/config`, `.well-known-evil/a`
  partaient ; avec les extglobs, seul `.well-known/assetlinks.json` part. Le lot a fermé une
  fuite existante.
- ⚠️ **V4 à refaire à chaque version majeure de firebase-tools** (R-b, CLI globale non épinglée) :
  copier `dist/` dans un dossier temporaire, y créer `.secret-test`, `.cache/x.txt`,
  `.well-known/.x`, puis appeler `listFiles(<copie>, <ignore de firebase.json>)` depuis
  `<npm root -g>/firebase-tools/lib/listFiles.js` (`node -e "…require(…).listFiles(…)"`) : seul
  `.well-known/assetlinks.json` doit apparaître parmi les entrées cachées.
- **Ce que le lot 4 (`play-store-twa`) remplira** : `package_name` et
  `sha256_cert_fingerprints` (avec Play App Signing, l'empreinte de la clé de Google — peut-être
  aussi la clé d'envoi, à confirmer au lot 4). Données publiques par nature. Relire aussi la
  politique dans le contexte TWA (installation depuis le store, effacement des données).
- **Vérification après déploiement** (sous Windows PowerShell 5.1, `curl` est un alias
  d'`Invoke-WebRequest` : utiliser `curl.exe`) :
  - `curl.exe -I https://dartpero.web.app/.well-known/assetlinks.json` → `200`,
    `content-type: application/json`, `cache-control: no-cache`, pas de `set-cookie` ;
  - `curl.exe -s https://dartpero.web.app/.well-known/assetlinks.json` → `[]` (pas du HTML) ;
  - ouvrir `https://dartpero.web.app/confidentialite` en navigation privée.

## Icônes

- **Icônes** : `npm run icons` (sharp) génère `public/icons/*` + `apple-touch-icon.png` +
`favicon.svg` depuis `scripts/icon.svg`. `sharp` est une **devDependency**, hors bundle client.
