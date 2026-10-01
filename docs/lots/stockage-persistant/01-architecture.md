# Lot `stockage-persistant` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu : **`archi-scout`**
> (tentative 1). Le rapport source commence par `Architecture result: PASS`.

## Problème

Sans `navigator.storage.persist()`, le navigateur peut effacer l'IndexedDB sans prévenir :
Chrome quand le disque manque, Safari après environ 7 jours sans ouverture si l'app n'est pas
installée. Il faut demander la protection au démarrage sans bloquer le rendu, afficher l'état
dans les Réglages (panneau « Sauvegarde ») et permettre de redemander. Aucune surface gravée
n'est touchée.

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| Appel dans `src/main.tsx` | Le plus tôt possible | Les services sont créés dans `ServicesProvider` (`createBrowserServices()` dans un `useMemo`), auxquels `main.tsx` n'a pas accès. Il faudrait une seconde instance ou casser l'injection, et le fake deviendrait inutilisable. **Rejetée.** |
| Use case dédié | Respecte « UI → use cases » à la lettre | Deux lignes, aucune règle métier ; `Services.devices` est déjà l'exception assumée pour les ports driven (`screenLock`). Cérémonie pure. **Rejetée.** |
| Hook UI monté dans la coquille (`App.tsx`) | Reçoit les services injectés, testable avec un fake, hors routes donc compatible `lazyRoutes` | — **Retenue.** |

## Approche retenue

**Port** `src/core/application/ports/driven/PersistentStorage.ts` :

```ts
export type StorageProtection = 'persisted' | 'not-persisted' | 'unavailable'
export interface PersistentStorage {
  status(): Promise<StorageProtection>   // ne rejette jamais
  request(): Promise<StorageProtection>  // ne rejette jamais ; renvoie l'état APRÈS la demande
}
export const NullPersistentStorage: PersistentStorage = {
  async status() { return 'unavailable' },
  async request() { return 'unavailable' },
}
```

**Adapter** `src/infrastructure/device/NavigatorPersistentStorage.ts`, sur le modèle de
`WakeLockScreenLock` :

- `navigator.storage?.persist` ou `persisted` absent : `'unavailable'`.
- `status()` : `persisted()` donne `'persisted'` ou `'not-persisted'`. Un rejet ou une
  exception donne `'not-persisted'`.
- `request()` : `persist()` à `true` donne `'persisted'`, sinon `'not-persisted'`. Un rejet
  donne `'not-persisted'`, une API absente `'unavailable'`.
- Tout est enveloppé dans un `try/catch`.
- Le constructeur accepte un `StorageManager | undefined` (`navigator.storage` par défaut), ce
  qui permet de tester sans toucher le global.

**Composition** : `container.ts` ajoute `persistentStorage: PersistentStorage` dans `Devices`,
et instancie `NavigatorPersistentStorage` dans `createBrowserDependencies`.

**Démarrage** : le hook `src/ui/hooks/useStockagePersistant.ts` exporte deux hooks.

- `useDemandeStockageAuDemarrage()`, monté une fois dans `App.tsx`, hors routes :
  - un `useEffect` lance `void (async () => { if ((await s.status()) !== 'persisted') await s.request() })()` ;
  - le rendu n'attend rien et rien ne s'affiche ;
  - un `useRef` garantit un seul appel, y compris sous `StrictMode`.
- `useProtectionStockage()`, pour `ReglagesEcran`. Il renvoie `{ etat: StorageProtection | null, redemander }` :
  - `status()` est appelé au montage, et `etat` vaut `null` pendant le chargement ;
  - `redemander` applique **la valeur de retour** de `request()` à un `useState` local. Pas de
    rechargement de page, pas de TanStack Query : c'est une capacité d'appareil, pas une
    lecture de données.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | Aucun |
| `core/application/` | `ports/driven/PersistentStorage.ts` (créé) | Port + type d'état + `NullPersistentStorage` |
| `infrastructure/` | `device/NavigatorPersistentStorage.ts` (créé) | Seul lecteur de `navigator.storage` |
| `ui/` | `hooks/useStockagePersistant.ts` (créé), `App.tsx`, `ecrans/ReglagesEcran.tsx`, `labels.ts` | Demande au démarrage. Dans Réglages : ligne d'état dans un `<output aria-label>`, bouton « Redemander » ≥ 48 px (composants communs) absent si `'unavailable'`, rappel d'exporter. Tout le texte dans `labels.ts` |
| `composition/` | `container.ts` | `Devices.persistentStorage` + câblage de l'adapter |
| `tests/` | `fakes/index.ts` (modifié) ; `infrastructure/device/NavigatorPersistentStorage.test.ts`, `ui/stockagePersistant.test.tsx` (créés) | `FakePersistentStorage` : état initial réglable, compteurs `statusCalls` / `requestCalls`, branché dans `fakeDependencies().devices`. `fakeServices()` reste un wrapper du vrai `createServices` |
| docs | `docs/DEPLOIEMENT.md`, `docs/PROJECT_PLAN.md`, `.claude/CONVENTIONS.md` § 5, feuille de route (statut) | Comportement par navigateur, journal du lot, port d'appareil |

Les tests existants `x01.test.tsx:33` et `entrainement.test.tsx:28` font un
`{ ...dependencies.devices }` : ils héritent du nouveau champ sans modification.

**Sens des dépendances vérifié :** `ui`/`infrastructure` → `application` → `domain`. Le
domaine n'est pas touché, seul `container.ts` instancie l'adapter, et `navigator.storage`
n'apparaît que dans l'adapter.

**Nouveau port ?** `PersistentStorage`. Son premier consommateur est
`useStockagePersistant.ts`, qui sert au démarrage et aux Réglages.

## Testabilité et démarrage non bloquant

- Avec `FakePersistentStorage` et `renderWithServices` :
  - état initial `'persisted'` → `requestCalls === 0` ;
  - autrement → `requestCalls === 1`, y compris sous `StrictMode`. Ce test doit pouvoir échouer.
- Un fake dont `request()` ne se résout jamais prouve que le rendu n'attend pas.
- L'adapter se teste seul sur un faux `StorageManager` (accordé, refusé, absent, rejet), sans
  mock.

## Décisions de `CLAUDE.md` concernées

- **Respectées** :
  - architecture hexagonale : une capacité externe devient un adapter derrière un port ;
  - pas de réseau : `persist()` n'en est pas un ;
  - l'export JSON reste le filet ;
  - l'exception `Services.devices` déjà documentée, au même titre que `screenLock`.
- **Surfaces gravées** : aucune (domaine, `GameMode`, `MatchEvent`, Dexie, `backupSchema`, SW,
  `firebase.json`).
- **À graver en fin de lot** : une ligne dans `CLAUDE.md` § Décisions structurantes, « Le
  stockage persistant est demandé au démarrage via le port `PersistentStorage` ; l'état se lit
  dans Réglages ; la protection ne remplace pas l'export. » Puis lancer
  `/refresh-architecture` pour que l'exception `Services.devices` de l'index cite aussi
  `persistentStorage`.

## Baseline sécurité

- **Frontières** : aucune entrée non fiable ajoutée. `navigator.storage` est local et sans
  réseau, et l'import JSON n'est pas touché.
- **Risques et mitigations** :
  - Une API qui lève ou qui rejette ne doit casser ni le démarrage ni les Réglages. Mitigation :
    `try/catch` dans l'adapter et promesse non attendue au démarrage.
  - Aucun HTML brut : les libellés sont des chaînes statiques de `labels.ts`.
  - « Protégé » ne remplace pas une sauvegarde. Mitigation : un rappel d'exporter pour les états
    non protégé et indisponible, et un libellé « protégé » qui ne promet rien contre la
    désinstallation.
- **Résiduel** : le comportement réel de Safari iOS et de Chrome sur un onglet simple. Owner :
  l'utilisateur, sur appareil.
- Ce relevé ne remplace pas `04-revue-securite.md`.

## Questions ouvertes

| # | Question | Pour qui | Résolution |
|---|---|---|---|
| 1 | Libellés définitifs | Dev, validés par l'utilisateur | **Close** : le dev les fixe dans `labels.ts` avec le sens de `request.md` § Comportement visible. L'utilisateur les valide à la relecture de fin de lot. |
| 2 | Support réel de `persist()` sur Safari iOS hors installation | Utilisateur | **Close comme risque connu** : déjà relevé comme angle mort par l'intake (`request.md` § Risques), non vérifiable en test. Vérification manuelle sur un vrai iPhone, hors lot. Le code se comporte correctement dans les trois états quoi qu'il arrive. |
| 3 | Chrome qui refuse sur un onglet simple | Utilisateur | **Close** : un refus est attendu, pas un défaut. Vérification sur Android avec la PWA installée, lors de l'arrêt de fin de lot. |
| 4 | Relecture à l'écran (portrait, paysage, sombre, clair, ≥ 48 px) | Dev, puis utilisateur | **Close** : prévue à l'arrêt de fin de lot (`request.md` § Attentes de validation). Le dev signale l'angle mort dans `02-dev-notes.md`. |
| 5 | Rendu pendant le chargement (`etat === null`) | Orchestrator | **Close (tranchée par l'Orchestrator)** : rien n'est rendu à la place de la ligne d'état tant que `status()` n'a pas répondu, pour éviter un clignotement. La réponse est locale et quasi instantanée. |

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
