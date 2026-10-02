# Demande — installation-guidee

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-01
- **Niveau** : high
- **Commande manuelle** : `/orchestrate installation-guidee high`

## Objectif

Aujourd'hui, un pote qui ouvre `dartpero.web.app` reste dans un onglet sans savoir que l'app
s'installe. Il perd le plein écran, l'icône sur l'écran d'accueil et, surtout, la protection
du stockage : Chrome l'accorde en général une fois l'app installée (lot `stockage-persistant`).
Ce lot ajoute une invitation à installer : un vrai bouton là où le navigateur le permet, un
guide pas à pas sur iPhone. Il enrichit aussi le manifeste (`id`, `categories`, `screenshots`,
`shortcuts`). C'est le lot 2 de
[la feuille de route](../prospective/2026-10-01-NEW-feuille-de-route-play-store.md), utile
même sans store.

## Périmètre

- **Un port driven pour l'installation**, exposé via `Services.devices` (même exception que
  `screenLock` et `persistentStorage`). Il couvre :
  - l'état d'installation : `installée` / `installable` (invite du navigateur disponible) /
    `manuelle-ios` (Safari iOS) / `ios-autre-navigateur` (Chrome ou Firefox sur iOS : il faut
    passer par Safari) / `indisponible` ;
  - le déclenchement de l'invite native ;
  - la notification d'un changement d'état (`appinstalled`, invite devenue disponible) ;
  - un objet nul quand l'API manque.
- **Un adapter navigateur** dans `src/infrastructure/device/`. Il capte `beforeinstallprompt`
  assez tôt pour ne pas rater l'événement, qui peut partir avant le montage de React. Il
  détecte « installée » via `display-mode: standalone` ou `navigator.standalone`. Il est câblé
  uniquement dans `src/composition/container.ts`.
- **Accueil** : une ligne discrète « Installer Dartpéro ». Elle s'affiche seulement si l'app
  n'est pas installée et que l'état vaut `installable`, `manuelle-ios` ou
  `ios-autre-navigateur`.
  - Avec `installable`, elle porte le bouton qui ouvre l'invite native.
  - Avec un état iOS, elle mène au guide des Réglages.
  - Un bouton « Plus tard » la masque pour de bon sur cet appareil, via une préférence locale
    (port `Preferences`, `localStorage`).
- **Réglages → À propos** : il remplace la phrase actuelle « Installez-le depuis le menu de
  votre navigateur… ». Le contenu dépend de l'état :
  - `installable` : bouton « Installer Dartpéro » ;
  - `manuelle-ios` : 3 étapes en ligne. Toucher l'icône Partager (`Share` de lucide), puis
    « Sur l'écran d'accueil », puis « Ajouter » ;
  - `ios-autre-navigateur` : « Ouvrez ce lien dans Safari pour installer Dartpéro. » ;
  - `installée` : « Dartpéro est installé sur cet appareil. » ;
  - `indisponible` : la phrase générique (menu du navigateur → « Ajouter à l'écran
    d'accueil »).
  - « Plus tard » ne masque jamais cette entrée.
- **Le refus de « Redemander »** (`REFUS_REDEMANDE_STOCKAGE`) renvoie vers l'installation
  quand elle est possible. C'est la suite annoncée par le lot `stockage-persistant`.
- **Manifeste** (`vite.config.ts`) :
  - `id: '/'` : identité inchangée pour les PWA déjà installées ;
  - `categories` : `["games", "sports", "entertainment"]` ;
  - `shortcuts` : « Nouvelle partie » → `/nouvelle-partie`, avec une icône (au moins 96 px) ;
  - `screenshots` : deux étroites (`accueil`, `partie-x01`, 780×1688,
    `form_factor: "narrow"`) et une large (`paysage`, 1000×462, `form_factor: "wide"`), avec
    un `label` en français. Elles sont copiées dans `public/screenshots/`.
- **Service worker** : `public/screenshots/` est exclu du précache Workbox (`globIgnores`).
- Tout le texte affiché est dans `src/ui/labels.ts`.

## Hors périmètre

- La fiche Play Store, la TWA et `assetlinks.json` (lots 3 et 4).
- La politique de confidentialité.
- Un écran d'aide ou un premier lancement guidé (lot `aide-regles`).
- Toute invitation pendant une partie ou sur les écrans de partie.
- Le guide d'installation pour un navigateur de bureau, au-delà de ce que
  `beforeinstallprompt` fournit.
- Des captures refaites : on réutilise celles de `docs/captures/` telles quelles.
- Aucun changement de `MatchEvent`, du schéma Dexie ni de `backupSchema`.

## Comportement visible

- Lu à 30 cm, hors écran de partie : aucun impact sur la lisibilité à 2-3 m.
- **Accueil, onglet Chrome Android non installé** : une ligne sobre, sans dégradé ni rayon,
  avec deux actions de 48 px ou plus, « Installer » et « Plus tard ». Toucher « Installer »
  ouvre la fenêtre native de Chrome, avec les captures. Après acceptation, la ligne disparaît
  sans recharger la page.
- **Accueil, Safari iPhone** : la même ligne. « Installer » mène au guide des Réglages.
- **Accueil, PWA installée ou invitation écartée** : rien.
- **Réglages → À propos** : le contenu selon l'état, décrit au Périmètre.
- **Écran d'accueil Android, appui long sur l'icône** : raccourci « Nouvelle partie ».
- À relire en portrait et en paysage, thème sombre et clair.

## Critères d'acceptation

1. Si `beforeinstallprompt` est capté, l'état vaut `installable`. « Installer » appelle
   `prompt()` **une fois**, et l'invite consommée n'est plus réutilisée.
2. `appinstalled`, ou un lancement en `standalone`, donne `installée`. L'invitation disparaît
   de l'Accueil, et les Réglages affichent l'état « installé ».
3. Sur Safari iOS, l'état vaut `manuelle-ios` et le guide s'affiche. Sur Chrome ou Firefox
   iOS, l'état vaut `ios-autre-navigateur` et le message « Ouvrez dans Safari » s'affiche.
4. « Plus tard » masque l'invitation de l'Accueil après un rechargement, et seulement sur
   l'Accueil.
5. Une API absente ou une erreur ne casse ni l'Accueil ni les Réglages. L'état retombe alors
   sur `indisponible`.
6. Le manifeste construit contient `id: "/"`, `categories`, un raccourci vers
   `/nouvelle-partie` et 3 captures. Aucune capture ne figure dans le précache du service
   worker (vérifié sur le `sw.js` construit).
7. Aucun appel à `beforeinstallprompt`, `matchMedia('(display-mode…')` ou
   `navigator.standalone` hors de l'adapter.
8. Tests verts, Biome propre, gardes d'architecture verts (`hexagonalBoundary`,
   `themeBoundary`, `lazyRoutes`). `npm run smoke` passe.

## Contraintes

- Hexagonal : le port vit dans `src/core/application/ports/driven/`, et le cœur n'importe
  aucune API navigateur.
- Zéro friction : l'invitation ne bloque rien, ne s'ouvre jamais d'elle-même et ne revient
  pas une fois écartée.
- Tokens de couleur seulement, angle vif, icônes `aria-hidden`, l'état qui change dans un
  `<output aria-label>` (`.claude/rules/frontend-react.md`, `.claude/rules/theme-colors.md`).
- `firebase.json` : aucun changement attendu (les captures relèvent du fourre-tout
  `no-cache`). Si l'archi en propose un, la règle « la dernière qui matche gagne »
  s'applique (`CLAUDE.md` § Déploiement).

## Dépendances

- `stockage-persistant` (livré) : son message de refus est prolongé ici.

## Risques

- **`id` du manifeste** : toute autre valeur que l'identité actuelle dédoublerait les
  installations existantes. Vérifier sur l'appareil Android déjà installé qu'il n'y a pas de
  seconde icône après la mise à jour.
- **`beforeinstallprompt` est propre à Chromium** et ne part que si les critères
  d'installabilité de Chrome sont remplis. Il est non standard, absent sur Safari et Firefox,
  et invérifiable en test. C'est un angle mort à signaler.
- **Détection iOS par user agent** : elle est fragile, en particulier sur un iPad qui se
  présente comme un Mac. Le repli `indisponible` doit rester correct.
- **Poids des captures** (≈ 425 ko) : sans `globIgnores`, elles gonfleraient le précache
  hors ligne.
- Le raccourci ouvre `/nouvelle-partie` directement. Si une partie est en cours, le
  comportement est le même qu'en y naviguant depuis l'Accueil.

## Zones impactées

- `src/core/application/ports/driven/` (nouveau port), `src/infrastructure/device/`
  (adapter), `src/composition/container.ts`
- `src/ui/ecrans/AccueilEcran.tsx`, `src/ui/ecrans/ReglagesEcran.tsx`, `src/ui/labels.ts`,
  un nouveau hook (`useInstallation`), le port `Preferences` (nouvelle clé)
- `vite.config.ts` (manifeste, `globIgnores`), `public/screenshots/`, l'icône du raccourci
  (`npm run icons` si besoin)
- `tests/fakes/`
- Docs : `docs/DEPLOIEMENT.md` (manifeste, captures, comportement par navigateur),
  `docs/PROJECT_PLAN.md`, `CLAUDE.md` (si une décision est gravée, par exemple `id: '/'`),
  la feuille de route (statut), `.claude/CONVENTIONS.md` § 5 (nouveau port d'appareil)

## Attentes de validation

- Tests de l'adapter sur de faux `window` et `navigator` (fakes, pas de mocks) : invite
  captée, invite consommée, `appinstalled`, `standalone`, Safari iOS, Chrome iOS, API
  absente.
- Tests UI de l'Accueil et des Réglages pour chaque état, de « Plus tard » mémorisé, et du
  bouton qui appelle l'invite une seule fois.
- Test ou contrôle du build : le manifeste contient `id`, `shortcuts` et `screenshots`, et le
  précache ne contient aucune capture.
- **Relecture à l'écran** : Accueil et Réglages, en portrait et en paysage, thème sombre et
  clair.
- Sur un vrai Android : invite native avec captures, pas de doublon d'installation, raccourci
  par appui long. Sur iPhone si possible : le guide.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Le moment exact de capture de `beforeinstallprompt` (dans l'adapter dès sa création, ou
  dans `src/main.tsx`). Owner : archi.
- La forme exacte du port : état et abonnement. Owner : archi.
- Le libellé définitif des étapes iOS (« Sur l'écran d'accueil » selon la version d'iOS).
  Owner : dev, validé par l'utilisateur à la relecture.
- L'icône dédiée du raccourci, ou la réutilisation de `icon-192`. Owner : dev.

## Décisions prises pendant l'intake

- Invitation **discrète sur l'Accueil**, et entrée complète dans **Réglages → À propos**.
- « Plus tard » est **mémorisé** sur l'appareil, et ne masque que l'Accueil.
- Guide iPhone en **étapes en ligne** avec icônes, sans fenêtre modale. Chrome iOS renvoie
  vers Safari.
- Captures **réutilisées** depuis `docs/captures/` et **exclues du précache**.
- `id: '/'` pour ne pas changer l'identité des installations existantes.
- Niveau **high**, forcé : le lot touche le service worker (`globIgnores`) et le manifeste
  PWA.
