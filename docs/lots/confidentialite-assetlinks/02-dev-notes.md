# Lot `confidentialite-assetlinks` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (opus, effort medium),
> 2026-10-03. Branche `lot/confidentialite-assetlinks`, aucun commit.

## Ce qui a été implémenté

**Déploiement**
- `public/.well-known/assetlinks.json` : `[]` + LF (3 octets).
- `firebase.json` : `ignore` = D1 exactement ; règle `/.well-known/assetlinks.json`
  (`application/json`, `no-cache`) ajoutée **en dernier** ; 4 règles existantes et réécriture SPA
  inchangées.
- `vite.config.ts` : `navigateFallbackDenylist: [/^\/\.well-known\//]` + commentaire
  repli / précache ; `globPatterns`, `globIgnores`, `id` inchangés.
- `scripts/smoke-build.mjs` : en-tête ; contrôles statiques (assetlinks tableau JSON, liste
  blanche des entrées cachées, `.well-known` hors précache, `denylist` lu après
  `NavigationRoute(` par un petit analyseur de littéraux regex, échec fermé) ; Chromium dans un
  **contexte vierge par page** (`/` puis `/confidentialite` en accès direct, aucune requête
  externe) ; garde `REMPLIR` après Chromium (fichiers « sans octet nul », dossiers à point
  compris, plancher 10 fichiers dont `index.html` et un `assets/*.js`, témoin « Mentions
  légales ») ; `.json` dans la table MIME.

**UI**
- `src/ui/ecrans/ConfidentialiteEcran.tsx` : `EnTeteEcran` (h1 « Confidentialité », sous-titre
  « Politique et mentions légales »), date une fois, 5 `Panneau` de paragraphes, `Panneau`
  « Mentions légales » en `<dl>` (Éditeur, Contact, Hébergeur en 3 `<dd>`), retour
  `Link` + `classesBouton('secondaire')` + `ArrowLeft`, `min-h-12`. Corps `text-sm
  text-craie/85`, `<dt>` et date `craie/75`, colonne `w-full max-w-prose` alignée à gauche.
  Aucun service, aucun hook.
- `src/App.tsx` : `lazy`, route `/confidentialite` dans `LayoutPrincipal` après `/reglages`.
- `src/ui/ecrans/ReglagesEcran.tsx` : dernière ligne d'À propos, `Link` pleine largeur
  `min-h-12`, filet `border-t border-craie/25`, `text-sm text-craie`, `ChevronRight` laiton,
  hors de toute liste.
- `src/ui/labels.ts` : `SECTIONS_CONFIDENTIALITE` (`{titre, paragraphes}`, type
  `SectionPolitique`), `MENTION_EDITEUR`, `MENTION_CONTACT`, `MENTION_HEBERGEUR_ENTITE`,
  `MENTION_HEBERGEUR_ADRESSE` — chacune `'À REMPLIR'` en littéral —,
  `MENTION_HEBERGEUR_SERVICE = 'Firebase Hosting (Google)'`, date `'Mise à jour le 3 octobre
  2026'`.

**Contenu vérifié contre le code** : clés `localStorage` (`NouvellePartieEcran.tsx:42-55` dont
`partie:joueurs`, `useAppareil.ts:38`, `useInstallation.ts:11`, `theme.ts:24`, sonde `__test`
`LocalStoragePreferences.ts:16-18`) ; `sessionStorage` `main.tsx:28-39` ; export
`ManageBackupUseCase.ts:20-40` ; « Joueur supprimé » `JoueursEcran.tsx:146` ; pseudo annoncé
(`annonceTour` : « À toi, ${nom} ») ; voix sans `localService` `SpeechAnnouncer.ts:26-28`. Deux
exceptions dites explicitement : l'hébergeur et la voix. Effacement : « effacez les données de
ce site dans les réglages de votre navigateur », rien de propre à un système.

**Tests**
- `tests/ui/confidentialite.test.tsx` (9), `tests/architecture/firebaseHosting.test.ts` (6),
  `tests/architecture/reseauBoundary.test.ts` (2 ; détecteur `firebase` limité aux **imports**,
  auto-test positif et négatifs `refetch()` et « Firebase Hosting (Google) »),
  `lazyRoutes.test.ts` (9 routes, ≥ 9 `lazy`).

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Contexte Chromium vierge par page | Ajustement | Vrai accès direct, sans service worker hérité de `/` |
| Détecteur `firebase` de `reseauBoundary` limité aux imports | Ajustement | Le libellé « Firebase Hosting (Google) » est légitime dans `labels.ts` |
| « Non binaire » = sans octet nul | Ajustement | Plus robuste qu'une liste d'extensions |
| En-tête d'échec de la garde générique | Ajustement | Couvre aussi « scanner aveugle » ; chaque ligne renvoie à `labels.ts` |

Aucune refonte. **S1 et S2 non déclenchées.**

## V4 — vraie `listFiles` de firebase-tools 15.20.0

`C:\Users\kevin\AppData\Roaming\npm\node_modules\firebase-tools\lib\listFiles.js` sur `dist/`,
avec `dist/.secret-test` et `dist/.cache/x.txt` créés.

| `ignore` | Fichiers envoyés | Entrées cachées envoyées |
|---|---|---|
| D1 | 54 | `.well-known/assetlinks.json` seulement |
| Ancien `**/.*` | 55 | `.well-known/assetlinks.json` **et `.cache/x.txt`** (trou confirmé) |

`dist/.well-known/.x` et `dist/assets/.y` exclus sous les deux. Fichiers de test supprimés.

## Mutations (chaque contrôle peut échouer)

Toutes annulées (vérifié par `cmp` contre des sauvegardes, `git status`, `index.html` sans
diff). Construites avec `npx vite build` (sans `tsc`), build complet refait à la fin.

| Contrôle | Mutation | Résultat |
|---|---|---|
| assetlinks présent | supprimé | « absent », code 1 |
| assetlinks tableau | `{}` | « pas un tableau JSON », code 1 |
| assetlinks lisible | `[` | « JSON illisible », code 1 |
| Entrées cachées | `.test-cache`, `.well-known/.x` | les deux listées, code 1 |
| Hors précache | `additionalManifestEntries` | « .well-known présent », code 1 |
| `denylist` présent | retiré | « aucun denylist lisible », code 1 |
| `denylist` correct | `[/^\.well-known\//]` | « ne couvre pas … », code 1 |
| `denylist` correct | `[/./]` | « couvre une route de l'app : /, /confidentialite, /reglages, /partie/x », code 1 |
| Route | retirée | `h1Confidentialite: false`, code 1 |
| Requêtes externes | `<img src="https://example.invalid/p.png">` | URL nommée sur les deux pages, code 1 |
| `REMPLIR` | fin de lot | échec voulu, code 1 |
| `REMPLIR` inverse | remplacé par « Rempli » | **smoke vert, code 0** (37 fichiers texte) |
| Scanner | « Mentions legales » | « scanner aveugle », code 1 |
| `firebaseHosting` | `**` en fin | 3 tests échouent |
| `firebaseHosting` | `"!**/.well-known/**"` | test « aucun motif `!` » échoue |
| `reseauBoundary` | `fetch('/x')` dans `src/ui/sondeReseau.ts` | échoue, fichier nommé |
| `lazyRoutes` | import statique | échoue |

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | OK — 215 fichiers, aucune correction |
| `npm run typecheck` | OK — code 0 |
| `npx vitest run` | OK — 41 fichiers, **454 tests** (+17) |
| `npm run build` | OK — précache 48 entrées (788,05 Kio) ; `sw.js` porte `denylist:[/^\/\.well-known\//]` |
| `npm run smoke` | **Code 1 sur la seule garde `REMPLIR`** (4 occurrences dans `assets/index-*.js`) ; statique, `/` et `/confidentialite` OK, aucune requête externe |

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Éditeur, contact, raison sociale et adresse de l'hébergeur (4 constantes `MENTION_*`), date à revoir au remplissage (Q1/Q2 d'Archi) | Utilisateur |
| 2 | Relecture visuelle 390 × 844 et paysage, sombre et clair : paragraphes `craie/85` en clair, `<h2>` capitales sur ligne étroite, colonne alignée à gauche en paysage, filet du lien sous la liste iOS, valeurs longues dans le `<dl>` ; hors-ligne de `/confidentialite` à la main | Test |
| 3 | « L'application ne collecte aucune donnée et n'envoie rien », suivi des deux exceptions : assez nuancé pour un engagement public ? | Sécurité |
| 4 | Commentaire d'en-tête de `lazyRoutes.test.ts` (« 16 écrans ») déjà inexact avant le lot, non modifié | Orchestrator — **tranché** : hors périmètre, laissé tel quel (constat préexistant, pas de refactor opportuniste) |

## Boucle 2, tour 1 — 2026-10-03 (Sécurité → Dev, opus)

| Correction | Fichier | Texte final / changement |
|---|---|---|
| S1 | `src/ui/labels.ts` | « Importer : le fichier choisi est lu sur le téléphone et vérifié, puis ses profils et ses parties s’ajoutent à la base. Ceux qui y figurent déjà (même identifiant) sont remplacés par la version du fichier ; le reste de la base n’est pas touché. » — vérifié contre `ManageBackupUseCase.importFrom` (`put` Dexie) |
| S2 | `src/ui/labels.ts` | Paragraphes 2 et 3 de la première section repris mot pour mot de `04-revue-securite.md` ; sections suivantes cohérentes, non retouchées |
| Réglages → Sauvegarde | `src/ui/ecrans/ReglagesEcran.tsx` (JSX, pas dans `labels.ts`) | « La restauration **complète** la base : les profils et parties du fichier s’ajoutent, et ceux déjà présents (même identifiant) sont remplacés par la version du fichier. Le reste n’est pas touché. » Aucun test n'assertait l'ancien texte |
| P5 | `tests/architecture/reseauBoundary.test.ts` | Règle « littéral `https?://` hors `w3.org` » sur JS / TS / CSS de `src/` **et** `index.html` ; planchers : ≥ 40 fichiers, ≥ 1 `.css`, `index.html` lu (`<div id="root">`) ; auto-test positifs / négatifs ; message de renvoi à `/confidentialite` ; limite écrite (URL sans schéma ou assemblée à l'exécution) |

**Mutation** : `<img src="https://example.com/pixel.gif">` dans `index.html` + `url(https://cdn.example/x.woff2)` dans `src/index.css` → échec listant les deux ; restaurés (`git diff` vide), test vert.

**Contrôles** : lint OK (215 fichiers) ; typecheck OK ; vitest **456 tests** OK ; build OK (48 entrées, 788,43 Kio) ; smoke code 1 sur la seule garde `REMPLIR` (`assets/index-BH703Hz3.js : 4`).

**Écart** : ajustement — texte Réglages corrigé dans le JSX où il vit.

**Point ouvert** : le commentaire de `ManageBackupUseCase.importFrom` commence par « Fusion, jamais remplacement » alors qu'un identifiant connu est écrasé. Non affiché. → Orchestrator : **tranché**, hors périmètre (cœur non touché par ce lot), noté pour `nettoyage-claude-md` ou un audit.

## Boucle 2, tour 2 — 2026-10-03 (Sécurité → Dev, opus)

- **S3** (`src/ui/labels.ts`) : dernière phrase du paragraphe 3 de « Politique de
  confidentialité » = « Le fichier d’export, lui, n’est envoyé nulle part par Dartpéro. »
- **`reseauBoundary`** : exception restreinte à `ESPACES_DE_NOMS` (`http://www.w3.org/2000/svg`,
  `http://www.w3.org/1999/xlink`, égalité exacte) ; regex simplifiée
  `/https?:\/\/[^\s'"`()<>]*/gi` ; seule URI w3.org présente : `2000/svg` ×2 dans `src/index.css`
  ; auto-test : `https://www.w3.org/Icons/valid-xhtml10` désormais signalée.
- **Mutation** : `<img src="https://www.w3.org/Icons/valid-xhtml10">` dans `index.html` → échec
  nommant l'URL ; restauré (`git diff` vide).
- **Contrôles** : lint OK, typecheck OK, **456 tests** OK, build OK (48 entrées), smoke code 1 sur
  la seule garde `REMPLIR` (`assets/index-lumkIy0j.js : 4`). Aucun écart.

## Intégration des mentions — 2026-10-10 (demande utilisateur, opus)

- `src/ui/labels.ts` : `MENTION_EDITEUR` « Dartpéro, particulier non professionnel »,
  `MENTION_CONTACT` « roulandzanellakevin@gmail.com » (texte simple, pas de `mailto:`),
  `MENTION_HEBERGEUR_ENTITE` « Google Ireland Limited », `MENTION_HEBERGEUR_ADRESSE` « Gordon
  House, Barrow Street, Dublin 4, Irlande », date « Mise à jour le 10 octobre 2026 » ; pas de
  ligne téléphone. JSDoc périmée de `MENTION_HEBERGEUR_SERVICE` retirée. Commentaire de tête :
  seul le réseau a un garde automatique (stockage et fonctions du téléphone : relecture) ; la
  garde `REMPLIR` du smoke reste en place.
- Constat 4 de Revue : `lazyRoutes.test.ts:8` → « 17 écrans passés en `lazy()` (9 dans
  `App.tsx`, 8 dans `PartieEcran.tsx`) » ; commentaire de `labels.ts` corrigé (ci-dessus).
- `tests/ui/confidentialite.test.tsx` : littéral de date mis à jour (assertion d'architecture,
  pas une mention) ; commentaire d'en-tête mis à jour. Pas de test UI sur l'absence de `REMPLIR`
  (la garde du smoke couvre tout `dist/`).
- `grep -rl REMPLIR dist` : vide. Seule occurrence dans `src/` : le commentaire de `labels.ts`.
- **Contrôles** : lint OK (215), typecheck OK, **456 tests** OK, build OK (48 entrées), **smoke
  code 0** : « Garde de publication OK — aucun « REMPLIR » dans 37 fichiers texte ».
- Point à relire (utilisateur) : l'éditeur désigne l'appli plutôt qu'une personne ; valeur écrite
  telle que fournie.
