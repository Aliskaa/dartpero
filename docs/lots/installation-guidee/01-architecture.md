# Lot `installation-guidee` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu : **`archi-authority`**
> (opus / max), seule tentative (surface gravée n° 4 annoncée par l'intake). Le rapport source
> commence par `Architecture result: PASS`.

## Problème

L'installation n'existe aujourd'hui que comme une phrase figée des Réglages. Le lot doit :

1. connaître un **état d'installation qui change en cours de session** — l'invite native de
   Chromium (`beforeinstallprompt`) peut arriver très tôt (avant le montage de React) ou tard
   (heuristique d'engagement), `appinstalled` arrive après acceptation, et iOS n'a aucune API
   (guide manuel, Safari seulement) ;
2. l'exposer à l'UI **derrière un port**, sans qu'aucune API navigateur ne sorte de l'adapter
   (AC 7) et sans rien casser quand elle manque (AC 5) ;
3. enrichir le manifeste **sans changer l'identité** des PWA déjà installées et **sans faire
   entrer les captures** (≈ 425 ko) dans le précache — deux propriétés qui ne se vérifient que
   sur le build.

Surface gravée n° 4 (service worker / manifeste). Ni domaine, ni journal, ni Dexie, ni
`backupSchema`.

## Options considérées

| # | Option | Pour | Contre | Verdict |
|---|---|---|---|---|
| A | Script inline dans `index.html` qui range l'invite dans une globale | Écoute la plus précoce | Globale `window.__…`, logique hors bundle et non testée, état écrit hors de l'adapter (contraire à AC 7) | Rejetée |
| B | Écouteur dans un `useEffect` monté dans `App.tsx` (modèle `useDemandeStockageAuDemarrage`) | Suit le lot précédent | Posé après le premier commit React : une invite partie avant est perdue pour la session | Rejetée |
| C | Écouteurs dans le constructeur de l'adapter, services toujours créés dans le `useMemo` de `ServicesProvider` | Rien ne change au démarrage | Création pendant le premier rendu ; en dev, `StrictMode` rejoue le `useMemo` : deux adapters, deux `preventDefault`, une instance fantôme qui garde l'invite | Rejetée |
| **D** | **C + services créés une fois dans `src/main.tsx`, avant `createRoot`, injectés dans `ServicesProvider` (prop obligatoire)** | Écoute posée à l'évaluation du module d'entrée, avant tout rendu ; un seul jeu de services par page ; câblage inchangé dans `container.ts` | Invalide la raison « `main.tsx` n'a pas accès aux services » du lot `stockage-persistant` (PLAN § 6) — à journaliser ; deux fichiers de plus | **Retenue** |
| E | Singleton créé à l'import de `container.ts` | Tôt | Effet de bord à l'import, y compris dans les tests | Rejetée |
| F | Port asynchrone `status(): Promise<…>` comme `PersistentStorage` | Symétrie | L'état change par événements ; `useState` + `useEffect` raterait un changement entre rendu et abonnement | Rejetée |
| **G** | **Port synchrone `state()` + `subscribe()` + `prompt()`, consommé par `useSyncExternalStore`** | Contrat exact de React pour une source externe, sans déchirement | — | **Retenue** |
| H | Deux ports (lecture/abonnement ↔ déclenchement) | ISP à la lettre | Les deux consommateurs utilisent les trois opérations | Rejetée |
| I | Use case `InstallApp` | « UI → use cases » à la lettre | Aucune règle métier ; exception `Services.devices` déjà assumée | Rejetée |
| J | Détection iOS dans l'UI | — | Viole AC 7 | Rejetée |
| K | Vérifier le précache par un test Vitest sur `dist/` | Dans `npm test` | Dépend d'un build préalable : faux vert / faux rouge | Rejetée |
| **L** | **Contrôles statiques en tête de `scripts/smoke-build.mjs`** | Lit le vrai `sw.js` et le vrai manifeste ; déjà dans `firebase:deploy` | — | **Retenue** |

## Approche retenue

### 1. Capter `beforeinstallprompt` sans le rater

- L'adapter `BrowserAppInstallation` pose ses écouteurs **dans son constructeur**
  (`beforeinstallprompt`, `appinstalled`, `change` sur `(display-mode: standalone)`). Seul
  `createBrowserDependencies()` l'instancie, dans `container.ts`.
- `src/main.tsx` appelle `createBrowserServices()` **une seule fois, au niveau du module, avant
  `createRoot`**, et passe `<ServicesProvider services={services}>`. Le module d'entrée
  (`type="module"`, différé) s'exécute avant tout rendu.
- `ServicesProvider` : `services` devient **obligatoire** ; plus de
  `useMemo(() => services ?? createBrowserServices())` ; il n'importe plus que le **type**
  `Services`. Les appelants actuels (`renderWithServices`, `stockagePersistant.test.tsx`)
  passent déjà `services`.
- `useDemandeStockageAuDemarrage` reste tel quel.
- Si l'invite partait quand même avant le module : état `unavailable` (phrase générique), rien
  ne casse ; Chrome la renvoie en général au chargement suivant (à confirmer sur appareil).

### 2. Le port

`src/core/application/ports/driven/AppInstallation.ts`, sans import. Identifiants anglais ; la
correspondance avec `request.md` est en commentaire.

```ts
export type InstallState =
  | 'installed'         // « installée »
  | 'installable'       // « installable » : une invite native est tenue
  | 'ios-manual'        // « manuelle-ios » : Safari iOS / iPadOS
  | 'ios-other-browser' // « ios-autre-navigateur » : passer par Safari
  | 'unavailable'       // « indisponible » : API absente, invite consommée, erreur

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

export interface AppInstallation {
  /** Synchrone, ne lève jamais, même valeur tant que rien n'a changé (contrat de useSyncExternalStore). */
  state(): InstallState
  /** Appelé après chaque changement d'état ; rend le désabonnement. */
  subscribe(onChange: () => void): () => void
  /** Ouvre l'invite native, depuis un geste de l'utilisateur. Une invite ne sert qu'une fois. Ne rejette jamais. */
  prompt(): Promise<InstallOutcome>
}

export const NullAppInstallation: AppInstallation = {
  state: () => 'unavailable',
  subscribe: () => () => {},
  prompt: async () => 'unavailable',
}
```

⚠️ Les commentaires du port décrivent les API sans les nommer : le garde de l'AC 7 lit aussi
les commentaires.

### 3. L'adapter et la détection iOS

`src/infrastructure/device/BrowserAppInstallation.ts`, sur le modèle de
`NavigatorPersistentStorage` (objet navigateur injecté).

```ts
export type InstallWindow = EventTarget & {
  readonly matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'> & EventTarget
  readonly navigator: {
    readonly userAgent: string
    readonly maxTouchPoints?: number
    readonly standalone?: boolean // Safari iOS, absent de lib.dom
  }
}
export const detectIosBrowser = (userAgent: string, maxTouchPoints = 0): 'safari' | 'other' | null
export class BrowserAppInstallation implements AppInstallation {
  constructor(win: InstallWindow | undefined = typeof window === 'undefined' ? undefined : window)
}
```

- **Constructeur entièrement sous `try/catch`** : `win` absent ou API qui lève → `unavailable`,
  `subscribe` muet, `prompt()` → `'unavailable'` (AC 5).
- `beforeinstallprompt` : garde de type locale (`typeof e.prompt === 'function'`), puis
  `preventDefault()` (c'est l'app qui propose, ou se tait après « Plus tard ») ; on garde **la
  dernière** invite et on publie.
- `appinstalled` : drapeau « installée » **en mémoire seulement** (persisté, une
  désinstallation le rendrait faux pour toujours), invite oubliée, publication.
- `(display-mode: standalone)` lu à la construction et suivi par `change` ;
  `navigator.standalone === true` lu à la construction.
- État mis en cache, recalculé à chaque événement, publié **après** mise à jour. Priorité :
  installée > invite tenue > iOS Safari > iOS autre navigateur > `unavailable`.
- `prompt()` : sans invite → `'unavailable'` sans rien appeler. Sinon l'invite est retirée et
  l'état publié **avant toute attente**, `invite.prompt()` est appelé **sans `await` préalable**
  (activation utilisateur), `userChoice` → `accepted` / `dismissed`, tout rejet →
  `'unavailable'`. Un second appel concurrent → `'unavailable'` sans rappeler `prompt()`
  (AC 1). `installed` ne vient que d'`appinstalled` (AC 2), jamais d'`accepted`.
- Pas de `dispose` : une instance par page grâce à `main.tsx`.

**Détection iOS** — fonction pure exportée, testée sur des UA réels :

- appareil iOS : `iPhone|iPad|iPod`, **ou** `Macintosh` avec `maxTouchPoints > 1` (iPadOS en
  « site pour ordinateur » ; un Mac a 0) ;
- Safari : `Version/` et `Safari/` présents, aucun jeton tiers connu (`CriOS`, `FxiOS`,
  `EdgiOS`, `OPiOS`, `OPT/`, `GSA/`, `DuckDuckGo`, `FBAN`/`FBAV`, `Instagram`, `Line/`) ;
- navigateurs intégrés aux apps (sans `Version/`) → « autre navigateur » : « Ouvrez dans
  Safari » est le bon conseil ;
- limites assumées : Brave iOS se présente comme Safari ; un futur Mac tactile passerait pour
  un iPad. Le repli reste lisible.

### 4. « Plus tard » et le port `Preferences`

Contrat réel vérifié : `read<T>(key, fallback)` / `write<T>(key, value)` synchrones, JSON sous
le préfixe `dartpero:`, repli mémoire si `localStorage` lève, `write` avale le quota.

**Aucune modification du port** : une clé nouvelle `CLE_INSTALLATION_ECARTEE =
'installation:ecartee'` (booléen, `false` par défaut), lue par `usePreference`
(`useAppareil.ts`), exportée par `useInstallation.ts`. ⚠️ Elle ne se renomme jamais (précédent
`partie:legs`). Préférence d'appareil, hors sauvegarde JSON.

### 5. L'UI

**Hook** `src/ui/hooks/useInstallation.ts` :

```ts
export const CLE_INSTALLATION_ECARTEE = 'installation:ecartee'
export const installationPossible = (etat: InstallState): boolean =>
  etat === 'installable' || etat === 'ios-manual' || etat === 'ios-other-browser'
export const useInstallation = (): { readonly etat: InstallState; readonly installer: () => void }
```

`useSyncExternalStore(abonner, lire)` sur `devices.appInstallation` (`useCallback` stables) ;
`installer = () => void installation.prompt()`, appelé directement dans le gestionnaire de clic.
Ni TanStack Query, ni `useState` + `useEffect`.

**Accueil** (`AccueilEcran.tsx`) : composant local `InvitationInstallation`, rendu seulement si
`installationPossible(etat) && !ecartee`, dans une `<section aria-label=…>`, par défaut entre
l'aperçu et le groupe de boutons d'action, sans peser plus que « Nouvelle partie » :

- `installable` : `<Button variante="secondaire">` « Installer » → `installer` ;
- iOS : `<Link to={{ pathname: '/reglages', hash: '#installer' }} className={classesBouton('secondaire')}>` ;
- « Plus tard » : `<Button variante="discret">`, écrit la préférence.

Deux cibles ≥ 48 px, tokens seulement, aucun `rounded-*`, icône `Download` `aria-hidden`.

**Réglages → À propos** (`ReglagesEcran.tsx`) : composant local `EntreeInstallation`, rendu dès
le premier rendu (état synchrone). `<output aria-label="Installation">` porte la phrase d'état
(`Record<InstallState, string>`) ; selon l'état : bouton « Installer Dartpéro », `<ol>` de 3
étapes iOS (`Share`, `SquarePlus` de lucide), phrase Safari, « Dartpéro est installé sur cet
appareil. », ou phrase générique (déplacée dans `labels.ts`). Conteneur `id="installer"` ; si
`location.hash === '#installer'`, `scrollIntoView` via une ref (dépendance `location.key`,
appel optionnel `?.()` pour jsdom). « Plus tard » n'est jamais consulté ici.

**`labels.ts`** : titre / sous-texte Accueil, « Installer », « Plus tard »,
`ETIQUETTE_INSTALLATION`, `ETAT_INSTALLATION: Record<InstallState, string>`,
`ETAPES_INSTALLATION_IOS`, `LIEN_GUIDE_INSTALLATION`. `InstallState` importé du port, comme
`StorageProtection`.

### 6. Refus de « Redemander »

Dans `EtatProtection`, quand `refusee && etat === 'not-persisted' &&
installationPossible(installation)`, une action s'ajoute **après** l'`<output>` (aucun
contrôle dans une région live) :

- `installable` : `<Button variante="secondaire">Installer Dartpéro</Button>` (même invite) ;
- iOS : `<Link to={{ hash: '#installer' }}>Voir comment installer</Link>` ;
- `installed` / `unavailable` : rien.

`REFUS_REDEMANDE_STOCKAGE` ne change pas ; `stockagePersistant.test.tsx` reste vert (fake par
défaut `NullAppInstallation`).

### 7. Manifeste, précache et vérification du build

```ts
manifest: {
  id: '/', // ⚠️ identité des installations existantes (= start_url résolu) : ne jamais changer
  // … champs actuels inchangés …
  categories: ['games', 'sports', 'entertainment'],
  shortcuts: [{ name: 'Nouvelle partie', url: '/nouvelle-partie',
    icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }] }],
  screenshots: [
    { src: 'screenshots/accueil.png',    sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: '…' },
    { src: 'screenshots/partie-x01.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: '…' },
    { src: 'screenshots/paysage.png',    sizes: '1000x462', type: 'image/png', form_factor: 'wide',   label: '…' },
  ],
},
workbox: {
  globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
  // Les captures ne servent qu'à la fenêtre d'installation, en ligne : hors précache.
  globIgnores: ['**/node_modules/**/*', 'screenshots/**'],
},
```

- **`id: '/'`** : le `dist/manifest.webmanifest` actuel n'a pas d'`id`, avec `start_url` et
  `scope` à `/` ; l'identité calculée est `https://dartpero.web.app/`, que `id: '/'` reproduit.
- **Icône du raccourci** : `icons/icon-192.png` réutilisée (≥ 96 px, déjà précachée). Pas de
  changement de `npm run icons`.
- **Captures** : copies à l'identique de `docs/captures/{accueil,partie-x01,paysage}.png` dans
  `public/screenshots/` ; `sizes` = dimensions réelles. À recopier si les captures sont refaites
  (à écrire dans `DEPLOIEMENT.md`).
- **`globIgnores`** nécessaire (`**/*.png` les précacherait). Vérifié dans les sources :
  vite-plugin-pwa ne pose aucun `globIgnores` par défaut ; workbox-build ignore lui-même
  `sw.js` / `workbox-*.js` ; `includeManifestIcons` prend `icons` et `shortcuts[].icons`, jamais
  `screenshots`.
- **Contrôle du build** en tête de `scripts/smoke-build.mjs`, avant Chromium (`npm run smoke`
  et `firebase:deploy` inchangés) :
  - `dist/manifest.webmanifest` : `id`, `start_url`, `scope` = `'/'` ; `categories` contient
    `games` ; un raccourci vers `/nouvelle-partie` dont l'icône existe dans `dist/` (≥ 96 px) ;
    exactement 3 captures (2 `narrow`, 1 `wide`), chaque fichier présent et de dimensions
    réelles = `sizes` (IHDR du PNG, octets 16-23 big-endian, sans dépendance) ;
  - `dist/sw.js` : URL du précache extraites par `url:"…"` ; **plancher** ≥ 10 URL dont
    `index.html`, `manifest.webmanifest`, `icons/icon-192.png` ; **aucune** URL commençant par
    `screenshots/` ;
  - **mutation à faire une fois** : retirer `globIgnores` doit faire échouer le smoke.
- **`firebase.json`** : aucun changement (`/screenshots/*.png` sous `**`, donc `no-cache` ; un
  fichier manquant reviendrait en `index.html` 200 — le smoke contrôle la présence).

### 8. À graver en fin de lot

- **`CLAUDE.md` § Décisions structurantes** : « **Invitation à installer** (lot
  `installation-guidee`) : port driven `AppInstallation` (`Services.devices`, même exception
  que `screenLock`) ; seul l'adapter lit `beforeinstallprompt`, `appinstalled`, `display-mode`
  et `navigator.standalone`. ⚠️ Les services naissent dans `src/main.tsx`, **avant**
  `createRoot`. Ligne discrète sur l'Accueil (« Plus tard » mémorisé, Accueil seulement), entrée
  complète dans Réglages → À propos. Jamais sur un écran de partie, jamais ouverte d'elle-même. »
- **`CLAUDE.md` § Déploiement** : « ⚠️ **`id: '/'` ne se change jamais** — c'est l'identité
  déjà calculée des installations existantes. Captures du manifeste exclues du précache
  (`globIgnores`). `npm run smoke` vérifie les deux sur `dist/`. »
- **`docs/DEPLOIEMENT.md`** : section « Installation et manifeste » (comportement par
  navigateur ; `id`, `categories`, `shortcuts`, `screenshots` et règle de recopie ; contrôles du
  smoke ; délai de mise à jour de la WebAPK ; limites) ; fusionner le doublon iOS (l. 73-77).
- **`.claude/CONVENTIONS.md`** : § 5 (port d'appareil synchrone avec abonnement pour
  `useSyncExternalStore`), § 7 (`createBrowserServices()` une fois dans `main.tsx`, `services`
  obligatoire dans `ServicesProvider`), § 14 (11 ports driven, 8 hooks).
- **`docs/PROJECT_PLAN.md`** § 0, § 4, § 6 (noter que la *création* des services quitte le
  provider) ; feuille de route : lot 2 fait.
- Puis `/refresh-architecture` (l'exception `Services.devices` doit citer `appInstallation`).

## Testabilité

- **Adapter** (`tests/infrastructure/device/BrowserAppInstallation.test.ts`), sans mock : faux
  `window` = `Object.assign(new EventTarget(), { matchMedia, navigator })` ; fausse invite =
  sous-classe de `Event('beforeinstallprompt', { cancelable: true })` qui compte `prompt()` et
  expose `userChoice`. Cas : invite captée (`installable`, `defaultPrevented`, abonné prévenu) ;
  `prompt()` une fois, second appel `unavailable` sans rappel ; `accepted` / `dismissed` ;
  `appinstalled` → `installed` ; `standalone` au démarrage puis via `change` ;
  `navigator.standalone` ; table d'UA (iPhone Safari, iPad Mac tactile, Mac Safari, CriOS,
  FxiOS, EdgiOS, navigateur intégré, Chrome Android) ; priorités ; pas de `window`,
  `addEventListener` qui lève, `matchMedia` absent, `prompt()` / `userChoice` qui rejette :
  jamais d'exception ; désabonnement ; **l'adapter n'appelle jamais `prompt()` de lui-même**.
- **UI** (`tests/ui/installation.test.tsx`), `FakeAppInstallation` dans `tests/fakes/index.ts`
  (état réglable par `regler()` qui prévient les abonnés, compteur `promptCalls`, issue
  configurable) : Accueil pour chaque état ; « Installer » → `promptCalls === 1` puis ligne
  disparue une fois `installed` ; « Plus tard » (disparition, toujours masquée après remontage
  avec les mêmes `preferences`, Réglages toujours visibles) ; `regler('installable')` après
  montage fait apparaître la ligne ; `App` monté en `installable` → `promptCalls === 0` (doit
  pouvoir échouer) ; Réglages pour chaque état (`getByRole('status', { name: 'Installation' })`,
  3 `listitem` pour iOS) ; refus × chaque état ; `/reglages#installer` ne casse rien en jsdom.
- **Fakes** : `fakeDependencies().devices.appInstallation = NullAppInstallation` par défaut.
- **Garde** `tests/architecture/installationBoundary.test.ts` : (a) `beforeinstallprompt`,
  `appinstalled`, `display-mode`, `.standalone` absents de tout `.ts`/`.tsx` de `src/`
  (commentaires compris) sauf l'adapter — plancher : l'adapter contient les quatre ; (b)
  `src/main.tsx` appelle `createBrowserServices()` avant `createRoot(` — plancher : les deux
  trouvés.
- **Relecture à l'écran** (playwright-core) : `beforeinstallprompt` synthétique pour
  `installable`, UA iPhone tactile pour iOS ; portrait / paysage, sombre / clair.
- **Angles morts** (appareil seulement) : vraie fenêtre Chrome, vrai `appinstalled`, vraie
  interface iOS.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | Aucun |
| `core/application/` | `ports/driven/AppInstallation.ts` (créé) | `InstallState`, `InstallOutcome`, `AppInstallation`, `NullAppInstallation` |
| `infrastructure/` | `device/BrowserAppInstallation.ts` (créé) | Seul lecteur des API d'installation et de l'UA ; `detectIosBrowser` pure |
| `composition/` | `container.ts` | `Devices.appInstallation` + `new BrowserAppInstallation()`, docblock de `Services.devices` |
| entrée | `src/main.tsx` | `const services = createBrowserServices()` avant `createRoot`, injecté |
| `ui/` | `providers/ServicesProvider.tsx` | `services` obligatoire, import de type seul, plus de `useMemo` |
| `ui/` | `hooks/useInstallation.ts` (créé), `ecrans/AccueilEcran.tsx`, `ecrans/ReglagesEcran.tsx`, `labels.ts` | Hook, ligne d'Accueil, entrée À propos + ancre, action après refus, libellés |
| build | `vite.config.ts`, `public/screenshots/*.png` (3 copies), `scripts/smoke-build.mjs` | Manifeste, `globIgnores`, contrôles statiques de `dist/` |
| `tests/` | `fakes/index.ts` ; `infrastructure/device/BrowserAppInstallation.test.ts`, `ui/installation.test.tsx`, `architecture/installationBoundary.test.ts` (créés) | Voir § Testabilité |
| docs | `CLAUDE.md`, `docs/DEPLOIEMENT.md`, `.claude/CONVENTIONS.md`, `docs/PROJECT_PLAN.md`, feuille de route | Voir point 8 |

Ajouts par rapport aux zones de l'intake : `src/main.tsx`, `ServicesProvider.tsx`,
`scripts/smoke-build.mjs` (points 1 et 7).

**Sens des dépendances vérifié :** `ui`/`infrastructure` → `application` → `domain`. Le port
n'a aucun import ; l'adapter n'importe que le type du port ; l'UI n'importe que le type
`InstallState` et `useServices` ; `main.tsx` (hors `src/ui`) appelle le composition root, seul
à instancier un adapter.
**Nouveau port ?** `AppInstallation` ; premier consommateur : `useInstallation` (Accueil et
Réglages).

## Décisions de `CLAUDE.md` concernées

- **Respectées** : PWA installable via « Ajouter à l'écran d'accueil », sans store ;
  hexagonal (adapter derrière un port, câblage dans `container.ts`) ; zéro réseau, zéro
  Firebase dans l'app ; exception `Services.devices` ; `localStorage` = préférences d'appareil ;
  stockage persistant (refus prolongé vers l'installation) ; charte (tokens, angle vif, 48 px) ;
  zéro friction ; en-têtes de cache (`firebase.json` inchangé).
- **Surface gravée touchée** : n° 4 (service worker / manifeste), traitée au point 7 et par le
  smoke.
- **À graver** : point 8, puis `/refresh-architecture`.

## Baseline sécurité

**Frontières** : aucune entrée non fiable nouvelle (UA lu localement et jamais rendu ;
événements derrière une garde de type) ; import JSON, format persisté, Dexie, `backupSchema`
intouchés ; aucun rendu de saisie ; aucune dépendance runtime nouvelle ; **zéro `fetch`** (le
navigateur charge lui-même les captures, même origine) ; aucune permission nouvelle (la fenêtre
d'installation ne s'ouvre que sur un geste) ; `globIgnores` ne fait que réduire le précache.

**Risques et mitigations**

1. Identité changée → doublon d'installation : `id: '/'` = identité calculée aujourd'hui
   (vérifié sur `dist/`), smoke sur `id` / `start_url` / `scope`.
2. Glob trop large → icônes ou `index.html` hors précache : plancher du smoke, interdiction de
   `screenshots/`, mutation vérifiée.
3. Plantage au démarrage (adapter créé au niveau du module) : constructeur sous `try/catch`,
   test avec un faux qui lève, `pageerror` dans le smoke.
4. Invite ouverte sans geste : `prompt()` seulement depuis un clic ; test `promptCalls === 0`
   au montage.
5. Capture absente → HTML servi à la place : le smoke contrôle présence et dimensions.

**Résiduels**

| # | Résiduel | Owner |
|---|---|---|
| R1 | Fenêtre réelle de Chrome, heuristiques Chromium, absence de seconde icône (DevTools → Manifest → « Computed App ID » identique avant / après) | Utilisateur, après déploiement en production |
| R2 | Heuristique UA (iPad, Brave, navigateurs intégrés) | Utilisateur, sur iPhone (iPad si possible) |
| R3 | Hors ligne, la fenêtre d'installation s'affiche sans captures | Accepté par conception |
| R4 | App installée mais ouverte dans un onglet, après rechargement : `unavailable`, Accueil muet, phrase générique | Accepté, documenté dans `DEPLOIEMENT` |
| R5 | Sur une installation existante, le raccourci n'apparaît qu'après mise à jour de la WebAPK (délai non garanti) | Utilisateur. ⚠️ Ne jamais désinstaller pour tester sans exporter d'abord |
| R6 | Depuis iOS 16.4, des navigateurs tiers peuvent proposer « Sur l'écran d'accueil » (non vérifié) ; « Ouvrez dans Safari » reste vrai (décision d'intake) | Utilisateur, sur iPhone ; un changement de libellé suffirait |

Ne remplace pas `04-revue-securite.md`.

## Questions ouvertes

| # | Question | Pour qui | Clôture |
|---|---|---|---|
| 1 | Libellés définitifs : sous-texte de l'Accueil ; étapes iOS selon la version (Partager parfois sous « … », non vérifié) ; variante du refus si déjà installée ; `description` du manifeste (désormais visible dans la fenêtre Chrome, dit encore « X01, checkouts et stats ») ; première phrase d'À propos | Dev, puis utilisateur | Le Dev rédige dans `labels.ts` / `vite.config.ts` ; l'utilisateur valide à la relecture de fin de lot |
| 2 | Dimensions réelles des 3 PNG | Dev | Mesurées avant d'écrire `sizes` ; le smoke ferme |
| 3 | Place de la ligne d'Accueil et hauteur en paysage ; décalage du saut vers `#installer` sur iPhone | Dev, puis utilisateur | Le Dev propose ; la relecture (portrait / paysage, sombre / clair) ferme |
| 4 | Vérifications sur appareil (R1, R2, R5, R6) | Utilisateur | Après déploiement, non bloquant, reporté dans PLAN § 0 |
| 5 | Sur le diff : aucun `prompt()` hors clic, `globIgnores` limité à `screenshots/`, `firebase.json` intact, aucun `fetch` | Sécurité | Revue `04` |

### Résolutions de l'Orchestrator (gate Architecture)

- **Q1** : renvoyée au Dev (rédaction), validation des libellés rattachée à l'arrêt de fin de
  lot. La `description` du manifeste est dans le périmètre du Dev (elle couvre aujourd'hui 4
  modes).
- **Q2** : **close**. Mesurées par l'Orchestrator pendant l'intake (`sharp`, 2026-10-01) :
  `accueil.png` et `partie-x01.png` 780×1688, `paysage.png` 1000×462. Le smoke les revérifiera.
- **Q3** : renvoyée au Dev (proposition), close par la relecture à l'écran de fin de lot.
- **Q4** : hors lot, non bloquante, à reporter dans `PROJECT_PLAN` § 0 par le Dev.
- **Q5** : rattachée à la phase Sécurité, qui y répondra dans `04-revue-securite.md`.

## Constat hors périmètre (ne bloque pas ce lot)

`src/ui/ecrans/NouvellePartieEcran.tsx:204` : `usePreference(CLE_DOUBLE_OUT, false)` — un
premier lancement crée une partie **sans** double out, alors que `CLAUDE.md` § Décisions
structurantes dit « double out activé » par défaut et que le domaine (`x01/config.ts:60`) est
d'accord avec `CLAUDE.md` (`?? true`). Introduit par `577dc5f` (« ce que l'usage a
tranché », `git log -S`) — corrigé par l'Orchestrator sur constat n° 12 de la Revue v1. À soumettre à l'utilisateur ; ce lot n'y touche pas.

## Vérifications faites pendant l'architecture

- `dist/manifest.webmanifest` : pas d'`id`, `start_url` et `scope` = `/`.
- `dist/sw.js` : icônes listées deux fois (glob + `includeManifestIcons`, même révision) ;
  aucune capture.
- vite-plugin-pwa 1.x : aucun `globIgnores` ni `id` par défaut ; `includeManifestIcons` ne
  prend pas `screenshots`. workbox-build ignore `sw.js` et `workbox-*.js`.
- Types de vite-plugin-pwa : `id`, `categories`, `shortcuts`, `screenshots.form_factor`
  acceptés. lucide-react : `Share`, `SquarePlus`, `Download` existent.
- `createBrowserServices` : appelé uniquement par `ServicesProvider` aujourd'hui.

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
