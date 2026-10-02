# Déploiement — Firebase Hosting

> Ce fichier est le **manuel** du déploiement. La décision, elle, est gravée dans
> [`CLAUDE.md`](../CLAUDE.md) § Décisions structurantes (pas de Firebase **dans** l'app, Hosting
> n'est qu'un serveur de fichiers statiques) ; ce fichier ne la contredit jamais. Les deux pièges
> de cache vitaux restent aussi résumés dans `CLAUDE.md` § Déploiement.

---

## Mettre en ligne

L'app est en ligne sur **https://dartpero.web.app** (projet Firebase `dartpero`, même compte
que Pokegypte). Une seule commande : `npm run firebase:deploy` (= `build` + `smoke` + `firebase
deploy --only hosting`, `package.json` l. 19 ; `smoke` = `node scripts/smoke-build.mjs`).

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
    donc vue au premier rechargement.
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
l'état dans Réglages → Sauvegarde. Le navigateur tranche seul, et **un refus est attendu, pas un
défaut** :

| Navigateur | Comportement attendu (à vérifier sur appareil) |
| --- | --- |
| Chrome / Android | Accorde ou refuse selon l'engagement (installée, ajoutée aux favoris, notifications…) ; un onglet simple peut être refusé. Vérifier avec la PWA installée. |
| Safari iOS | Sans installation, la base peut être effacée après ~7 jours sans ouverture ; le support de `persist()` hors installation n'est pas garanti. |
| Firefox | Peut afficher sa propre demande à l'utilisateur ; l'app ne l'anticipe pas. |
| API absente | État « indisponible » : pas de bouton, simple rappel d'exporter. |

« Redemander » (état non protégé) rappelle `persist()` ; si le navigateur refuse encore, l'écran
le dit (« Le navigateur a refusé… installé sur l'écran d'accueil ») plutôt que de rester muet.
Le refus du démarrage, lui, n'affiche rien.
Depuis le lot `installation-guidee`, ce refus propose aussi d'installer quand c'est possible
(bouton « Installer Dartpéro », ou lien vers le guide iOS).

⚠️ Protégé ne veut pas dire sauvegardé : désinstaller l'app ou vider les données du site efface
toujours la base. L'export JSON reste le filet.

## Installation et manifeste

L'app invite à s'installer (lot `installation-guidee`) : port `AppInstallation`, seul l'adapter
`BrowserAppInstallation` lit `beforeinstallprompt`, `appinstalled`, `(display-mode: standalone)`
et `navigator.standalone`. Il écoute **dès sa construction** : les services naissent donc dans
`src/main.tsx`, avant `createRoot` — l'invite de Chromium peut partir avant le montage de React.

| Navigateur | Ce que voit l'utilisateur |
| --- | --- |
| Chrome / Edge Android, Chromium de bureau | `beforeinstallprompt` capté : ligne « Installer Dartpéro » sur l'Accueil, bouton dans Réglages → À propos ; « Installer » ouvre la fenêtre native (avec les captures). Ne part que si Chrome juge l'app installable, et parfois tard (heuristique d'engagement). |
| Safari iOS / iPadOS | Pas d'API : guide en trois gestes dans Réglages → À propos (Partager, « Sur l'écran d'accueil », « Ajouter ») ; la ligne d'Accueil y mène (`/reglages#installer`). |
| Chrome, Firefox, Edge… sur iOS, navigateurs intégrés aux apps | « Ouvrez ce lien dans Safari pour installer Dartpéro. » |
| Firefox Android, Safari macOS, autres | État « indisponible » : rien sur l'Accueil, phrase générique (menu du navigateur) dans les Réglages. |
| App installée (`standalone`) | Rien sur l'Accueil ; « Dartpéro est installé sur cet appareil. » |

- **« Plus tard »** masque la ligne de l'Accueil pour de bon sur cet appareil (préférence
  `installation:ecartee`, à ne jamais renommer) ; les Réglages gardent toujours leur entrée.
  Jamais d'invitation sur un écran de partie, jamais d'invite ouverte sans un geste.
- Détection iOS par user agent (`detectIosBrowser`) : un iPad en « site pour ordinateur » se
  présente comme un Mac, reconnu à ses points de contact. Brave iOS passe pour Safari.
- **Installée mais ouverte dans un onglet** : après rechargement, aucune API ne le dit — état
  « indisponible », Accueil muet, phrase générique. Accepté.

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

**Contrôles de `npm run smoke`** (en tête de `scripts/smoke-build.mjs`, avant Chromium, donc
aussi dans `firebase:deploy`) : `id`, `start_url`, `scope` = `/` ; `categories` contient
`games` ; un raccourci vers `/nouvelle-partie` dont l'icône existe dans `dist/` (≥ 96 px) ;
exactement 3 captures (2 `narrow`, 1 `wide`), présentes, aux dimensions annoncées (en-tête PNG) ;
précache de `dist/sw.js` avec au moins 10 URL dont `index.html`, `manifest.webmanifest`,
`icons/icon-192.png`, et **aucune** sous `screenshots/`. Vérifié par mutation : sans
`globIgnores`, le smoke échoue.

## Icônes

- **Icônes** : `npm run icons` (sharp) génère `public/icons/*` + `apple-touch-icon.png` +
`favicon.svg` depuis `scripts/icon.svg`. `sharp` est une **devDependency**, hors bundle client.
