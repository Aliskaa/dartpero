# Lot `installation-guidee` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (opus, effort medium du
> frontmatter, `maxTurns` 100 non atteint). Rien de committé.

## Ce qui a été implémenté

- **Application** : `src/core/application/ports/driven/AppInstallation.ts` — `InstallState`
  (5 états, chacun commenté avec son nom d'intake), `InstallOutcome`, `AppInstallation`,
  `NullAppInstallation`. Aucun import, aucun commentaire ne nomme les API.
- **Infrastructure** : `src/infrastructure/device/BrowserAppInstallation.ts` — `InstallWindow`
  injecté, constructeur entièrement sous `try/catch` ; garde de type puis `preventDefault` sur
  l'invite, dernière invite gardée ; `appinstalled` mémorisé en mémoire seulement ;
  `display-mode: standalone` lu puis suivi par `change` ; `navigator.standalone` lu au
  démarrage ; priorité installed > installable > ios-manual > ios-other-browser > unavailable ;
  `prompt()` retire l'invite et publie avant toute attente, appelle `invite.prompt()` sans
  `await` préalable, second appel et tout rejet → `unavailable` ; un abonné qui lève ne prive
  pas les autres. `detectIosBrowser` pure, exportée.
- **Composition** : `Devices.appInstallation` + `new BrowserAppInstallation()` dans
  `container.ts` ; docblocks de `Devices`, `Services`, `createBrowserServices` mis à jour.
- **Entrée** : `src/main.tsx` — `const services = createBrowserServices()` au niveau du module,
  avant `createRoot`, injecté dans `<ServicesProvider services={services}>`.
- **Provider** : `ServicesProvider.tsx` — `services` obligatoire, plus de `useMemo`, import de
  type seul.
- **Hook** : `src/ui/hooks/useInstallation.ts` — `CLE_INSTALLATION_ECARTEE =
  'installation:ecartee'`, `installationPossible`, `useInstallation` (`useSyncExternalStore`,
  `useCallback` stables).
- **Accueil** : `InvitationInstallation` dans une `<section aria-label="Installer Dartpéro">` ;
  `Button secondaire` « Installer » (installable) ou `Link` stylé `classesBouton('secondaire')`
  vers `/reglages#installer` (iOS) ; `Button discret` « Plus tard » qui écrit la préférence.
- **Réglages → À propos** : `EntreeInstallation` — `<output aria-label="Installation">` ;
  bouton « Installer Dartpéro », `<ol>` de 3 étapes (`Share`, `SquarePlus` ; la 3ᵉ sans icône),
  phrase Safari, phrase « installé » (style vert de la protection) ou phrase générique ;
  conteneur `id="installer"`, `scrollIntoView` relancé à chaque `location.key`. « compteur de
  fléchettes X01 » remplacé par `PRESENTATION_DARTPERO`.
- **Refus de « Redemander »** : dans `EtatProtection`, action après l'`<output>` quand
  `refusee && not-persisted && installationPossible` — bouton « Installer Dartpéro » ou lien
  « Voir comment installer » vers `#installer`.
- **`labels.ts`** : `TITRE_` / `TEXTE_INVITATION_INSTALLATION`, `LIBELLE_INSTALLER`,
  `LIBELLE_PLUS_TARD`, `LIBELLE_INSTALLER_DARTPERO`, `ETIQUETTE_INSTALLATION`,
  `PRESENTATION_DARTPERO`, `ETAT_INSTALLATION`, `ETAPES_INSTALLATION_IOS`,
  `LIEN_GUIDE_INSTALLATION`.
- **Build** : `vite.config.ts` — `id: '/'` (commentaire ⚠️), nouvelle `description` (4 modes,
  hors ligne, sans compte), `categories`, `shortcuts` (icône 192 réutilisée), 3 `screenshots`
  avec `label` français, `globIgnores: ['**/node_modules/**/*', 'screenshots/**']`.
  `public/screenshots/` : 3 copies identiques (`cmp`). `scripts/smoke-build.mjs` :
  `controlerBuild()` en tête (`id` / `start_url` / `scope`, `games`, icône du raccourci
  présente et ≥ 96 px, 3 captures 2 narrow + 1 wide présentes et aux dimensions lues dans
  l'IHDR ; `sw.js` : ≥ 10 URL, 3 essentielles, aucune `screenshots/`).
- **Tests** : `FakeAppInstallation` dans `tests/fakes/index.ts` (`regler()`, `promptCalls`,
  `issue`, `abonnements` ; défaut `NullAppInstallation`) ;
  `tests/infrastructure/device/BrowserAppInstallation.test.ts` (40),
  `tests/ui/installation.test.tsx` (28), `tests/architecture/installationBoundary.test.ts` (3 :
  API absentes hors adapter avec plancher ; services créés avant `createRoot` et injectés ;
  provider qui ne crée plus rien). `renderWithServices` : commentaire seul.
- **Docs (§ 8 de l'architecture)** : `CLAUDE.md` (les deux lignes, + « manifeste » dans le
  renvoi vers `DEPLOIEMENT`) ; `docs/DEPLOIEMENT.md` (section « Installation et manifeste »,
  doublon iOS fusionné, une phrase au refus) ; `.claude/CONVENTIONS.md` § 5, § 7, § 14 (comptes
  par `ls` : 20 driving hors `MatchSummary`, 11 driven, 8 hooks, 4 modes, 4 services) ;
  `docs/PROJECT_PLAN.md` § 0 (437 tests ; R1, R2, R5, R6 — Q4), table des ports driven, § 4,
  § 6 (la création des services quitte le provider, ce qui invalide la phrase du lot
  `stockage-persistant`) ; feuille de route (lot 2 « ✅ fait (vérif. appareil restante) »,
  prochaine étape, doublon iOS retiré de `nettoyage-claude-md`). `/refresh-architecture` non
  lancé (Orchestrator).

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| 7 fichiers en CRLF dans la copie de travail (`src/App.tsx`, `PersistentStorage.ts`, `NavigatorPersistentStorage.ts`, `useStockagePersistant.ts`, `tests/fakes/index.ts`, `NavigatorPersistentStorage.test.ts`, `stockagePersistant.test.tsx`) repassés en LF | Ajustement | `biome check .` échouait dès le départ (`autocrlf=true` sans `.gitattributes`). Aucune différence de contenu pour git (présents dans `git status`, absents de `git diff --stat`). Noté en PLAN § 6 |
| `paysage:hidden` sur le sous-texte de la ligne d'Accueil | Ajustement | Réponse à Q3 : une seule rangée de 66 px en paysage |
| `FakeAppInstallation.prompt()` imite l'adapter (hors `installable` → `unavailable` sans compter ; invite consommée → `unavailable`) ; compteur `abonnements` | Ajustement | Fidélité du fake, test du désabonnement |
| `scroll-mt-[max(1rem,env(safe-area-inset-top))]` sur l'ancre ; dépendance `key` sous `biome-ignore` commenté ; test de défilement qui remplace `HTMLElement.prototype.scrollIntoView` par une fonction enregistreuse restaurée en `afterEach` | Ajustement | Q3 (encoche iPhone) ; jsdom n'implémente pas `scrollIntoView` (pas un mock de bibliothèque) |

Aucune refonte nécessaire.

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | 211 fichiers, aucune erreur |
| `npm run typecheck` | OK |
| `npm test` | **437 verts**, 38 fichiers (366 → 437 : +40 adapter, +28 UI, +3 garde) |
| `npm run build` | OK — précache 47 entrées (782 KiB), aucune capture |
| `npm run smoke` | « Contrôles statiques OK » puis « Smoke test OK — #root 20071 octets » |
| Mutation `globIgnores` retiré | Précache 50 entrées (1198 KiB) ; smoke **échoue** (« captures présentes (globIgnores ?) : … ») ; remis, rebuild, smoke vert |
| Mutation hook qui appelle `prompt()` au montage | 10 tests UI échouent, dont « l'App montée en installable n'ouvre jamais l'invite d'elle-même » ; annulée |
| Mutation `beforeinstallprompt` écrit dans `labels.ts` | La garde `installationBoundary` échoue ; annulée |

`firebase.json` inchangé ; aucun `fetch`, `firebase`, `dangerouslySetInnerHTML` ni `rounded-*`
dans les fichiers touchés.

## Relecture à l'écran (Q3)

- **Place** : entre l'aperçu et le groupe d'actions (toujours poussé en bas par `mt-auto`) ;
  filets `craie/25` en haut et en bas, un bouton secondaire et un discret — visiblement moins
  lourde que « Nouvelle partie ».
- **Paysage** : une rangée de 66 px (titre à gauche, deux boutons de 48 px à droite) ; Accueil
  paysage 550 → 640 px de haut (il défilait déjà).
- **Saut vers `#installer`** : fonctionne (portrait `scrollY` 560, encart À propos visible ;
  paysage 880).
- **Méthode** : playwright-core sur `vite preview` (port 4180), service worker bloqué,
  `beforeinstallprompt` synthétique, UA iPhone Safari et CriOS ; 390×844 et 844×390, sombre et
  clair ; aucune `pageerror`. 16 PNG dans le scratchpad de session
  (`…\scratchpad\installation-guidee\`), hors dépôt.
- **Limite** : 5 images seulement ouvertes à l'œil par le Dev ; les `fullPage` paysage
  montrent la barre de navigation collante par-dessus le contenu (artefact de capture, les vues
  viewport sont propres). La relecture de l'utilisateur reste à faire.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Q1 de l'architecture — libellés rédigés : sous-texte Accueil « Plein écran, une icône sur l'écran d'accueil, et des données mieux protégées. », phrases d'état, étape 1 iOS « Touchez Partager, en bas de l'écran (ou sous « … ») » (place exacte selon la version d'iOS non vérifiée), `PRESENTATION_DARTPERO`, `description` du manifeste et `label` des captures. Pas de variante du refus en état installé (rien n'est ajouté, conforme à l'architecture) | Utilisateur, à l'arrêt de fin de lot |
| 2 | Q4 — R1, R2, R5, R6 notées dans PLAN § 0 | Utilisateur, après déploiement |
| 3 | Q5 — diff prêt pour la Sécurité (aucun `prompt()` hors clic, `globIgnores`, `firebase.json` intact, aucun `fetch`) | Sécurité |
| 4 | `/refresh-architecture` (exception `Services.devices` doit citer `appInstallation`, compteurs) | Orchestrator |
| 5 | Ajouter un `.gitattributes` (`eol=lf`) pour que les CRLF ne reviennent pas au checkout — hors lot | Utilisateur |

## Limites connues et TODO assumés

- Invérifiables hors appareil : vraie fenêtre Chrome, vrai `appinstalled`, vraie interface
  iOS, mise à jour de la WebAPK.
- Les tests ne voient pas le rendu (glyphe rogné, contraste) : seule la relecture partielle
  ci-dessus le couvre.
- Chromium headless ne lance pas `beforeinstallprompt` : le smoke prouve seulement que le
  démarrage ne plante pas.
- Constat hors périmètre (double out, `NouvellePartieEcran.tsx`) non touché.

## Résolutions de l'Orchestrator (gate Dev)

- **Q1** : rattachée à l'arrêt de fin de lot (validation des libellés par l'utilisateur).
- **Q2** : hors lot, reportée dans PLAN § 0 — close pour le lot.
- **Q3** : rattachée à la phase Sécurité, qui y répond dans `04-revue-securite.md`.
- **Q4** : l'Orchestrator lance `/refresh-architecture` avant la Revue (comme au lot
  `stockage-persistant`), pour que la Revue le vérifie.
- **Q5** : hors lot, remontée à l'utilisateur à l'arrêt de fin de lot ; aucun effet sur le
  contenu committé (git normalise en LF à l'index).

## Boucle 5, tour 1 (Revue v1 → Dev) — 2026-10-01

> `dev` relancé (opus, effort medium du frontmatter) sur les constats n° 1, 2 et 11 de
> `05-revue.md` v1, et eux seuls.

| Constat | Fichier | Changement |
|---|---|---|
| n° 1 | `.claude/rules/frontend-react.md:13` | La liste des hooks se termine par « `useStockagePersistant`, `useInstallation`. » |
| n° 2 | `tests/fakes/index.ts` (`FakeAppInstallation.prompt()`) | `promptCalls += 1` avant la garde `etat !== 'installable'` : chaque appel compte ; issue toujours fidèle à l'adapter ; JSDoc mise à jour |
| n° 2 | `tests/ui/installation.test.tsx` | Assertions `promptCalls === 1` inchangées (elles échouent désormais sur un double appel) ; un commentaire d'une ligne le dit. Le `promptCalls` de `BrowserAppInstallation.test.ts` (fake local) n'est pas touché |
| n° 11 a | `CLAUDE.md:11` | La ligne `docs/DEPLOIEMENT.md` cite « installation (§ Installation et manifeste) » |
| n° 11 b | `docs/PROJECT_PLAN.md` § 3 | `/` : « invitation à installer, écartable (*Plus tard*) » ; `/reglages` : « à propos (entrée d'installation, ancre `#installer`) » |
| n° 11 c | feuille de route l. 50 | « l. 213 » → « l. 224 » (vérifié : `CLAUDE.md:224` = « Best-of N legs (défaut 3)… ») |

**Mutation** : `void installation.prompt()` doublé dans `installer()` → 3 tests échouent (les
deux « ouvre l'invite une fois » et « installable : un second bouton « Installer Dartpéro »,
hors de la région live »). Annulée, l. 40-45 relues.

**Contrôles** : `npm run lint` 211 fichiers OK ; `npm run typecheck` OK ; `npm test` 38
fichiers, **437** verts (inchangé, compteurs du PLAN inchangés).

**Écarts** : aucun. **Remarque du Dev** : la même ligne 50 de la feuille de route cite d'autres
lignes de `CLAUDE.md` (74-81, 93, 95-97) non revérifiées (hors périmètre du tour).

## Boucle 5, tour 2 (décision utilisateur à l'arrêt de fin de lot → Dev) — 2026-10-02

> `dev` relancé (opus, effort medium du frontmatter) : libellés iPad (constat n° 6) et
> `.gitattributes` (constat n° 7), et eux seuls.

| Fichier | Changement |
|---|---|
| `src/ui/labels.ts` | `ETAT_INSTALLATION['ios-manual']` = « Sur iPhone ou iPad, l’installation se fait depuis Safari, en trois gestes : » ; `ETAPES_INSTALLATION_IOS[0]` = « Touchez Partager (ou ouvrez « … » d’abord). » ; étapes 2 et 3 inchangées ; JSDoc : Partager en bas sur iPhone, en haut sur iPad. Aucune autre mention « iPhone » dans les libellés du lot. Tests inchangés (sous-chaînes « Safari », « Partager » toujours présentes) |
| `.gitattributes` (créé) | `* text=auto eol=lf`, `*.png binary` (seuls binaires suivis : 17 `.png`), commentaire de raison |
| `CLAUDE.md` § Environnement | « Fins de ligne **LF** imposées par `.gitattributes` (`autocrlf=true` réécrivait les sources en CRLF au `switch` / `merge` et cassait `biome check`). » |
| `docs/PROJECT_PLAN.md` § 6 | Phrase `.gitattributes` au point « Fins de ligne » ; point « Libellés iOS valables sur iPad » |

**Fins de ligne** : `git ls-files --eol` — index 287 `i/lf` + 17 `i/-text`, aucun contenu CRLF
(avant comme après). Copie de travail : 40 fichiers suivis en CRLF (`.md` de `.ai/`, `.claude/`,
`docs/`, lots `allegement-docs` / `stockage-persistant`, prospective, `docs/request/…`), 1 mixte
(`.gitignore`), 3 non suivis du lot (`00`, `01`, `04`) repassés en LF. Le faux état « modifié »
(42 fichiers, `git diff --quiet` et hash identiques) a été effacé par `git checkout -- <fichier>`
sur ces seuls fichiers ; les 6 fichiers « modifiés sans diff » du début de session n'apparaissent
plus. `git diff --stat` inchangé (17 fichiers). État final : 287 `w/lf`, 17 `w/-text`.
Vérifié par l'Orchestrator (`git status`, `git ls-files --eol`).

**Contrôles** : lint 211 OK ; typecheck OK ; `npm test` 38 fichiers, **437** verts ; build 47
entrées ; smoke OK. Captures `reglages-ios-ancre-portrait-{sombre,clair}-v2.png` (scratchpad)
ouvertes : libellés tiennent, étape 1 sur deux lignes, icône alignée, rien de rogné.

**Écarts (ajustements)** : `.woff` / `.woff2` / `.ico` non listés (aucun suivi) ; `git checkout --`
sur 42 fichiers au contenu identique, non demandé, sans effet sur le contenu git. **Angle mort** :
interface réelle de Safari iPad non vue.
