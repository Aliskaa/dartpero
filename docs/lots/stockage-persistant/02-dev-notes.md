# Lot `stockage-persistant` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium, réglages
> du frontmatter).

## Ce qui a été implémenté

**`core/application`**
- `ports/driven/PersistentStorage.ts` (créé). Il contient le type `StorageProtection`,
  l'interface `PersistentStorage` (`status()` et `request()`, qui ne rejettent jamais) et
  `NullPersistentStorage`.

**`infrastructure`**
- `device/NavigatorPersistentStorage.ts` (créé). C'est le seul lecteur de `navigator.storage`.
  - Le constructeur accepte un `StorageManager | undefined` (`navigator.storage` par défaut).
  - API absente → `unavailable`.
  - Rejet ou exception → `not-persisted`.
  - Tout passe par un `try/catch`.

**`composition`**
- `container.ts` : ajout de `Devices.persistentStorage`, et `createBrowserDependencies`
  instancie l'adapter.

**`ui`**
- `hooks/useStockagePersistant.ts` (créé) :
  - `useDemandeStockageAuDemarrage` lance `status()`, puis `request()` si l'état n'est pas
    `persisted`. La promesse n'est pas attendue, et un `useRef` garantit un appel unique.
  - `useProtectionStockage` renvoie `{ etat, redemander }`. `etat` vaut `null` tant que
    `status()` n'a pas répondu.
- `App.tsx` monte le hook de démarrage, hors routes.
- `ecrans/ReglagesEcran.tsx` : `EtatProtection` dans le panneau « Sauvegarde », au-dessus du
  bouton d'export.
  - Rien n'est rendu tant que `etat` vaut `null`.
  - Sinon, un `<output aria-label="Protection des données">` affiche une icône `aria-hidden`,
    le libellé et le rappel d'exporter.
  - Le bouton « Redemander » (`Button` commun, `min-h-12`) n'apparaît que pour
    `not-persisted`.
  - Seuls des tokens existants sont utilisés, et aucun `rounded-*`.
- `labels.ts` : libellés par état, rappel d'exporter, étiquette et bouton.

**`tests`**
- `fakes/index.ts` : `FakePersistentStorage` (état initial réglable, compteurs `statusCalls`
  et `requestCalls`, options `accorde` et `requestBloquee`), branché dans
  `fakeDependencies().devices`.
- `infrastructure/device/NavigatorPersistentStorage.test.ts` : 13 tests, sur un faux
  `StorageManager`.
- `ui/stockagePersistant.test.tsx` : 11 tests, sur le démarrage (dont StrictMode et une
  `request()` qui ne répond jamais) et sur les Réglages (3 états, redemande accordée ou
  refusée, chargement).

**Docs**
- `docs/DEPLOIEMENT.md` : section « Stockage persistant ».
- `docs/PROJECT_PLAN.md` : § 0 (363 tests), table des ports, § 6 décisions du lot.
- `.claude/CONVENTIONS.md` : § 5.
- Feuille de route : lot passé en 🟡.
- `CLAUDE.md` et `.ai/` ne sont pas touchés : c'est le travail de l'Orchestrator en fin de lot.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| `useProtectionStockage` : drapeau `actif` dans le `useEffect` | Ajustement | Évite d'écrire dans l'état après un démontage. |
| `FakePersistentStorage` : options `accorde` / `requestBloquee`, `etat` public | Ajustement | Nécessaire pour tester une redemande refusée et une `request()` qui ne répond jamais. |
| Test StrictMode monté à la main (`StrictMode > QueryClientProvider > ServicesProvider > MemoryRouter > App`), sans `renderWithServices` | Ajustement | Un `StrictMode` placé sous les providers de `renderWithServices` ne rejoue pas les effets : sans le garde `useRef`, le test passait quand même (vérifié). Le piège est consigné dans `PROJECT_PLAN` § 6. |

Aucune refonte nécessaire.

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | OK : 205 fichiers, aucune correction |
| `npm run typecheck` | OK |
| `npm test` | OK : 35 fichiers, **363 tests** (339 → +24) |
| `npm run build` | OK : SW généré, 47 entrées de précache |
| Mutation `!== 'persisted'` → `=== 'persisted'` | 4 tests échouent (puis restauré) |
| Suppression du garde `useRef` | Le test StrictMode échoue (puis restauré) |

## Questions ouvertes

| # | Question | Pour qui | Résolution |
|---|---|---|---|
| 1 | Valider les libellés de `labels.ts` | Utilisateur | **Close** pour la suite du pipeline : déjà rattachée à la relecture de fin de lot (`01-architecture.md` Q1). |
| 2 | Vérifier les trois états sur un vrai appareil (Android, PWA installée ; iPhone) | Utilisateur | **Close** : risque connu, rattaché à l'arrêt de fin de lot et hors test (`01-architecture.md` Q2-Q3). |
| 3 | Graver la ligne dans `CLAUDE.md`, puis `/refresh-architecture` | Orchestrator | **Close** : prévu en fin de lot (`01-architecture.md` § Décisions). |

## Limites connues et TODO assumés

- **Angle mort de rendu** : aucune relecture à l'écran n'a été faite (portrait, paysage,
  sombre, clair, contraste de `craie/75` sur `ardoise`, retour à la ligne du rappel, taille
  réelle du bouton). Elle reste à faire à l'arrêt de fin de lot.
- Le test « le rendu n'attend pas la demande » est faible par nature : il prouve que l'app
  s'affiche avec une `request()` qui ne répond jamais, rien de plus.
- La bannière de Firefox n'est pas traitée, ce qui a été accepté dans `request.md`.
- Avertissements LF → CRLF : habituels dans ce dépôt (pas de `.gitattributes`), sans effet.

## Boucle 2, tour 1 — correction du constat sécurité 1

> Rapport du sous-agent `dev` (sonnet / medium). Motif : `04-revue-securite.md` constat 1
> (fausse assurance en état `persisted`).

- `src/ui/labels.ts` :
  - `LIBELLE_PROTECTION_STOCKAGE.persisted` devient « Données protégées : le navigateur ne les
    effacera pas de lui-même. »
  - `RAPPEL_EXPORT_STOCKAGE.persisted` devient « Ce n’est pas une sauvegarde : exportez pour
    garder une copie. » La valeur était `null`.
  - Le commentaire indique désormais que le rappel est présent dans chacun des trois états.
- `tests/ui/stockagePersistant.test.tsx` : le test de l'état protégé vérifie maintenant la
  **présence** de la réserve, et non plus l'absence de « Exportez ». La mutation qui remet
  `persisted: null` fait échouer 1 test sur 11, précisément celui-ci.
- `docs/PROJECT_PLAN.md` § 6 : la phrase « rappel pour les deux autres états » devient « dans
  les trois états ». `docs/DEPLOIEMENT.md` n'est pas concerné.
- Rendu : aucun changement de structure. `EtatProtection` affichait déjà un rappel non nul.
- Contrôles : lint propre (format corrigé par `biome check --write` sur les deux fichiers
  touchés), typecheck OK, **363 tests** verts.
- Écart : aucun.

## Boucle 5, tour 2 — corrections de la Revue (constats n° 1, 2, 4)

> Rapport du sous-agent `dev` (sonnet / medium). Motif : `05-revue.md` v1.

- **N° 1** :
  - `.claude/CONVENTIONS.md` § 14 : `PersistentStorage` ajouté sous `ports/driven/`, et
    `useStockagePersistant` sous `hooks/`.
  - `.claude/rules/frontend-react.md:13` : le hook est ajouté à la ligne `hooks/`.
- **N° 2** : dans `docs/PROJECT_PLAN.md` § 6, l'entrée « stockage-persistant » est déplacée
  après « allegement-docs », contenu inchangé.
- **N° 4** :
  - `src/ui/labels.ts` : `RAPPEL_EXPORT_STOCKAGE` est maintenant un
    `Record<StorageProtection, string>`, ce qui fait respecter par TypeScript la décision
    gravée « rappel dans les trois états ».
  - `src/ui/ecrans/ReglagesEcran.tsx` : le rappel est rendu sans condition, et un `{' '}`
    sépare le libellé du rappel, si bien que le `textContent` ne colle plus. Le rendu visuel
    est inchangé.
- **Contrôles** : lint propre (format corrigé par `biome check --write` sur
  `ReglagesEcran.tsx`), typecheck OK, **363 tests** verts.
- **Écart** : aucun.

## Boucle 5, tour 3 — retour visible après un refus de « Redemander » (décision utilisateur)

> Rapport du sous-agent `dev` (sonnet / medium). Motif : à l'arrêt de fin de lot, l'utilisateur
> constate que « Redemander » ne fait rien de visible quand Chrome refuse en silence, et choisit
> l'option A.

- `src/ui/hooks/useStockagePersistant.ts` : `useProtectionStockage` renvoie aussi
  `refusee: boolean`.
  - Il vaut `true` quand `redemander()` n'obtient pas `'persisted'`, `false` sinon.
  - Il vaut `false` au montage : le refus silencieux du démarrage n'affiche rien.
- `src/ui/ecrans/ReglagesEcran.tsx` : dans le **même** `<output>` (rôle `status`, donc annoncé
  par les lecteurs d'écran), un `<span className="block text-craie">` apparaît si
  `refusee && etat === 'not-persisted'`. Il se place sous le rappel d'exporter.
  - Le bouton reste.
  - Aucune nouvelle couleur, aucune animation.
- `src/ui/labels.ts` : `REFUS_REDEMANDE_STOCKAGE` = « Le navigateur a refusé. Il accepte en
  général une fois Dartpéro installé sur l’écran d’accueil. »
- `tests/ui/stockagePersistant.test.tsx`, trois tests :
  - message absent avant tout clic, même après un refus au démarrage ;
  - message présent après un refus, et toujours là au second refus ;
  - message qui disparaît quand la redemande est enfin accordée.
- Mutation de l'affichage : 2 tests échouent. Le test d'absence passe, ce qui est attendu.
- `docs/PROJECT_PLAN.md` § 6 et `docs/DEPLOIEMENT.md` § Stockage persistant : un paragraphe
  chacun.
- Contrôles : lint OK, typecheck OK, **366 tests** verts (363 + 3).
- Écart : aucun.
