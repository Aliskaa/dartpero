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
- Sur **iOS**, l'installation PWA passe **uniquement par Safari « Ajouter à l'écran
d'accueil »** (Chrome iOS ne peut pas installer de PWA).
- **iOS** : l'installation passe toujours par Safari → « Ajouter à l'écran d'accueil ». Le HTTPS
  de Firebase règle en revanche la question du contexte sécurisé — Wake Lock, vibration et
  service worker fonctionnent sur le domaine, sans le certificat auto-signé de `dev:mobile`.

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

⚠️ Protégé ne veut pas dire sauvegardé : désinstaller l'app ou vider les données du site efface
toujours la base. L'export JSON reste le filet.

## Icônes

- **Icônes** : `npm run icons` (sharp) génère `public/icons/*` + `apple-touch-icon.png` +
`favicon.svg` depuis `scripts/icon.svg`. `sharp` est une **devDependency**, hors bundle client.
