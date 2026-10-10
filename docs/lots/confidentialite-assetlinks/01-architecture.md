# Lot `confidentialite-assetlinks` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu : **`archi-authority`**
> (opus / max), 2026-10-03. Le rapport source commence par `Architecture result: PASS`. Scout
> et designer sautés : surface gravée (`firebase.json`, service worker).

## Problème

Le lot 4 (TWA, Play Store) a besoin de deux choses publiques, sans affaiblir les garanties de
déploiement actuelles.

1. **Une politique de confidentialité et des mentions légales** à une URL stable :
   `https://dartpero.web.app/confidentialite`. Chaque phrase devient un engagement public et
   doit être vraie au regard du code. Les identités encore inconnues doivent bloquer la
   publication.
2. **`/.well-known/assetlinks.json`** servi tel quel (200, JSON). Quatre mécanismes peuvent s'y
   opposer : le filtre `ignore` de Firebase (fichiers cachés), la réécriture SPA, l'ordre des
   règles `headers`, le repli de navigation du service worker (`index.html`).

Le cœur hexagonal n'est pas touché : aucun port, aucun use case, aucun format persisté, aucune
clé `localStorage` nouvelle.

## Constats vérifiés sur disque

1. **CLI qui déploie** : `firebase-tools` 15.20.0 en global. Le déploiement Hosting appelle
   `listFiles(publicDir, ignore)` = `glob.sync("**/*", { dot: true, … ignore })`, glob 10.5.0,
   minimatch 9.0.9 (`firebase-tools/lib/listFiles.js:5-13`, `lib/deploy/hosting/deploy.js:41`).
2. **`ignore` sous glob 10** :
   - **jamais de négation** : `Ignore` construit ses motifs avec `nonegate: true`
     (`glob/dist/commonjs/ignore.js:31-41`). `!**/.well-known/**` est un no-op silencieux ;
     sous glob 7 il aurait **inversé** le filtre. → **Jamais de `!` dans `ignore`.**
   - les enfants d'un dossier ne sont exclus que si le motif finit par `/**` ;
   - les extglobs `!(…)` sont pris en charge.
3. **Conséquence** : `**/.*` exclut les *entrées* à point, pas les fichiers rangés *dans* un
   dossier à point. Avec cette CLI, `dist/.well-known/assetlinks.json` partirait déjà — et le
   contenu de tout autre dossier caché aussi (trou existant). La prémisse de la feuille de
   route n'est vraie que pour une sémantique qui élague les dossiers. L'exception reste voulue,
   sous une forme qui tient **sous les deux sémantiques** ; à confirmer par **V4**.
4. **Service worker** : vite-plugin-pwa pose `navigateFallback: "index.html"` sans `denylist`
   (fusion `Object.assign`) ; le `dist/sw.js` actuel enregistre une `NavigationRoute` sans
   exclusion. workbox-build 7.4.1 émet `denylist:[…]` si `navigateFallbackDenylist` est fourni.
5. **Précache** : `assetlinks.json` n'y entre pas (`json` absent de `globPatterns` ; glob de
   workbox-build sans `dot`).
6. **`public/`** : Vite copie les fichiers à point.
7. **Encodage** : accents littéraux UTF-8 dans le bundle ; aucune occurrence de `REMPLIR`
   aujourd'hui dans `src/` ni `dist/`.

## Options considérées

| Décision | Option | Pour | Contre | Verdict |
|---|---|---|---|---|
| D1 · `ignore` | `!**/.well-known/**` | Intuitive | No-op en glob ≥ 9, inversion en glob 7 | **Proscrite**, gardée par un test |
| D1 | Garder `**/.*` | Rien à changer | Implicite, dépend de la bibliothèque, laisse passer les dossiers cachés | Rejetée |
| D1 | Réécrire vers `/assetlinks.json` | Plus de dossier à point | Contredit le périmètre et la convention TWA | Rejetée |
| D1 | **`**/.!(well-known)` + `**/.!(well-known)/**`** | Exception explicite sans négation, ferme le trou, tient sous les deux sémantiques | Extglob à expliquer (pas de commentaire en JSON) | **Retenue** |
| D2 · en-têtes | Type MIME par défaut + fourre-tout | Rien à écrire | Implicite | Rejetée |
| D2 | **Règle exacte, en dernier, `Content-Type` + `Cache-Control`** | Résultat sûr quelle que soit la fusion | `no-cache` redondant | **Retenue** |
| D3 · SW | **`navigateFallbackDenylist` ; commentaire pour le précache** | Option exacte de workbox | — | **Retenue** |
| D3 | `.well-known/**` dans `globIgnores` | Intention visible | Redondant ; le smoke vérifie | Rejetée |
| D4 · enveloppe | **Dans `LayoutPrincipal`, barre de navigation visible** | Écran de navigation ; un visiteur du store peut entrer dans l'app | Aucun onglet surligné | **Retenue** |
| D4 | Plein écran | Allure de document | Recopie l'enveloppe | Rejetée |
| D5 · garde `À REMPLIR` | **Dans le smoke, après Chromium, indépendant de l'encodage** | Le reste du smoke s'exécute | Smoke en code 1 tant que les marqueurs restent (voulu) | **Retenue** |
| D5 | Test Vitest | — | Suite rouge, contraire au critère 7 | Rejetée |
| D5 | Contournement par variable d'environnement | — | Porte dérobée | Rejetée |
| D6 · lien | `classesBouton('secondaire')` | Existant | 35 caractères en Oswald capitales : deux lignes | Rejetée |
| D6 | **Ligne-lien Barlow + chevron, `min-h-12`** | Idiome des réglages | — | **Retenue** |

## Approche retenue

### 1. `public/.well-known/assetlinks.json`

Contenu `[]` + saut de ligne LF.

### 2. `firebase.json`

Les quatre règles `headers` existantes restent intactes et dans le même ordre ; la réécriture
SPA ne bouge pas (un fichier présent gagne sur elle).

```json
"ignore": ["firebase.json", "**/.!(well-known)", "**/.!(well-known)/**", "**/node_modules/**"],
```

Nouvelle règle ajoutée **en dernier** :

```json
{
  "source": "/.well-known/assetlinks.json",
  "headers": [
    { "key": "Content-Type", "value": "application/json" },
    { "key": "Cache-Control", "value": "no-cache" }
  ]
}
```

### 3. `vite.config.ts` (workbox)

- `navigateFallbackDenylist: [/^\/\.well-known\//]`.
- Commentaire : jamais précaché (`json` hors `globPatterns`, glob sans `dot`), `smoke` le vérifie.
- `globPatterns`, `globIgnores`, `id: '/'` inchangés.

### 4. `scripts/smoke-build.mjs`

En-tête mis à jour.

**a) Contrôles statiques** (code 1 avant Chromium, comme aujourd'hui) :
- **assetlinks** : présent, `JSON.parse` réussit, `Array.isArray` (le type, pas `[]` : le lot 4
  remplira).
- **Entrées cachées** : liste blanche ; seules `.well-known` et `.well-known/assetlinks.json`
  dans `dist/` (récursif).
- **Précache** : aucune URL de `sw.js` ne contient `.well-known` ; plancher existant conservé.
- **Repli de navigation** : extraire `denylist:[…]` de `sw.js`, parser ses littéraux ; au moins
  un capte `/.well-known/assetlinks.json` ; aucun ne capte `/`, `/confidentialite`,
  `/reglages`, `/partie/x` ; `denylist` absent ou illisible = faute (échec fermé).

**b) Chromium** :
- contrôle existant sur `/` conservé ;
- ouverture **directe** de `/confidentialite` : `h1` contient « Confidentialité », aucune
  erreur JS ;
- sur les deux pages, `page.on('request')` : toute requête hors `http://127.0.0.1:4179` (sauf
  `data:` / `blob:`) est une faute.

**c) Garde de publication** (après Chromium, `process.exitCode = 1`) :
- chercher `REMPLIR` (ASCII, sensible à la casse) dans tous les fichiers non binaires de
  `dist/`, dossiers à point compris — pas « À REMPLIR », pour ne pas rater un « À » échappé ou
  décomposé ;
- plancher : ≥ 10 fichiers lus, dont `index.html` et au moins un `assets/*.js` ;
- témoin : retrouver « Mentions légales », sinon faute « scanner aveugle » ;
- message : chaque fichier, son nombre d'occurrences, renvoi à `src/ui/labels.ts` ;
- optionnel : `.json` dans la table MIME.

### 5. Interface

**`src/ui/ecrans/ConfidentialiteEcran.tsx`** (nouveau, exporte `ConfidentialiteEcran`) :
- aucun service, aucun hook ; `EnTeteEcran`, `Panneau`, `Link`, `classesBouton`, icônes lucide
  `aria-hidden`, libellés ;
- `h1` « Confidentialité », sous-titre « Politique et mentions légales » ;
- un `Panneau` par section, `<h2>` qui ne répète pas le `h1` : « Politique de
  confidentialité », « Sur votre appareil », « Garder la main », « Fonctions du téléphone »,
  « Hébergement », « Mentions légales » (en `<dl>` : Éditeur, Contact, Hébergeur) ;
- date de mise à jour une seule fois ;
- « Retour aux réglages » : `Link to="/reglages"` + `classesBouton('secondaire')`, 48 px ;
- corps `text-sm`, `craie/75` ou plus ; mesure de lecture (`max-w-prose`) en paysage ;
- ne pas recopier les liens retour `size-11` (44 px) de `LancerEntrainementEcran.tsx:50` et
  `NouvellePartieEcran.tsx:344`.

**`src/App.tsx`** : import `lazy`, `<Route path="/confidentialite">` **dans** `LayoutPrincipal`,
après `/reglages`.

**`src/ui/ecrans/ReglagesEcran.tsx`** : dernière ligne du panneau À propos — `Link
to="/confidentialite"` pleine largeur, `min-h-12`, Barlow, `ChevronRight` `aria-hidden`, filet
en tokens, **hors de toute liste** (`tests/ui/installation.test.tsx:199, 213` interroge
`getByRole('list')` / `queryByRole('list')`).

**`src/ui/labels.ts`** :
- `LIEN_CONFIDENTIALITE = 'Confidentialité et mentions légales'`, titre, sous-titre, sections,
  termes des mentions, date, libellé de retour ;
- date = chaîne française littérale (« 3 octobre 2026 »), jamais `new Date` sur une ISO ;
- **`'À REMPLIR'` en littéral dans chaque valeur** (éditeur, contact, entité et adresse de
  l'hébergeur), jamais via une constante partagée ;
- ni `display-mode`, `.standalone`, `beforeinstallprompt`, `appinstalled` (garde
  `installationBoundary`), ni couleur hexadécimale (`themeBoundary`).

### 6. Contenu factuel de la politique (pas un avis juridique)

| Affirmation | État | Preuve ou nuance obligatoire |
|---|---|---|
| Aucun compte, aucune collecte ni transmission, aucune mesure d'audience, aucune publicité | Vrai | Aucun `fetch` / XHR / WebSocket / beacon dans `src/` ; polices `@fontsource` locales (`src/main.tsx:11-15`) |
| Aucun cookie | Vrai | Le curl vérifiera l'absence de `set-cookie` |
| Base sur l'appareil | Vrai | IndexedDB `dartpero` : profils (pseudo, couleur, date de création), parties (journal, dates) |
| `localStorage` = préférences | Vrai, **pas seulement le thème** | Clés `dartpero:*` : thème, annonce vocale, réglages de la dernière partie, **derniers joueurs choisis (identifiants internes)**, « Plus tard » de l'installation ; clé de test écrite puis effacée |
| `sessionStorage` | À mentionner | Marqueur technique après une mise à jour ratée (`src/main.tsx:28-39`) |
| Copie des fichiers de l'app | À mentionner | Cache du service worker, pour le hors-ligne |
| Protection du stockage demandée | Vrai | `persist()` au démarrage, toutes routes |
| Export et import | Vrai | Export : fichier JSON (pseudos, parties), ce qu'on en fait ensuite ne passe pas par Dartpéro ; import lu localement, validé, **complète** la base |
| Effacement | Vrai | Supprimer un profil (ses parties restent, « Joueur supprimé ») ; supprimer une partie ; tout effacer = effacer les données du site. Ne rien promettre de propre à un système |
| Fonctions du téléphone | Vrai | Écran gardé allumé en partie, vibration (pas sur iPhone). **Jamais** caméra, micro, localisation, contacts, notifications |
| Annonce vocale | **Nuance obligatoire** | `SpeechAnnouncer.ts:26-28` prend la première voix `fr` sans regarder `localService` : selon le navigateur, la voix peut être synthétisée en ligne par son fournisseur, qui reçoit le texte annoncé, **pseudo compris**. Le dire, et dire comment la couper |
| Hébergeur | **À reformuler** | Il reçoit l'adresse IP et les informations techniques de chaque requête, peut les journaliser selon ses propres règles ; l'éditeur ne les exploite pas |
| Raison sociale et adresse de l'hébergeur | **Inconnues** | `À REMPLIR` ; seul « Firebase Hosting (Google) » est certain |

## Couches et chemins

| Couche | Fichiers | Changement |
|---|---|---|
| `core`, `infrastructure`, `composition` | — | Aucun, **pas de nouveau port** |
| `ui` | `ecrans/ConfidentialiteEcran.tsx` (nouveau), `ecrans/ReglagesEcran.tsx`, `labels.ts`, `src/App.tsx` | Écran, lien, textes, route lazy |
| Déploiement | `firebase.json`, `vite.config.ts`, `public/.well-known/assetlinks.json` (nouveau), `scripts/smoke-build.mjs` | `ignore`, en-têtes, `denylist`, contrôles |
| Tests | `tests/ui/confidentialite.test.tsx` (nouveau) | Lien depuis les Réglages (`href`, clic jusqu'au `h1` à travers `<App />`) ; URL directe (`h1`, `h2` « Politique de confidentialité » et « Mentions légales », termes Éditeur / Contact / Hébergeur, date, retour `/reglages`) ; barre de navigation présente. **Aucune assertion sur les valeurs `À REMPLIR`** |
| Tests | `tests/architecture/lazyRoutes.test.ts` | + `ConfidentialiteEcran` : 9 routes, ≥ 9 `lazy` |
| Tests | `tests/architecture/firebaseHosting.test.ts` (nouveau) | `**` en index 0 ; `immutable` et assetlinks après lui ; assetlinks porte `application/json` et `no-cache` ; **aucun motif `ignore` commençant par `!`** ; les deux extglobs présents, `**/.*` absent ; réécriture SPA intacte |
| Tests | `tests/architecture/reseauBoundary.test.ts` (nouveau) | Aucun `\bfetch\s*\(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, import `firebase` dans `src/**` ; plancher 40 fichiers ; auto-test du détecteur (positifs, négatif `refetch()`) ; message qui renvoie à la politique (garde de R5) |

## Preuve que chaque contrôle peut échouer

Mutations temporaires, puis `npm run build && npm run smoke`, résultat consigné.

| Contrôle | Mutation | Faute attendue |
|---|---|---|
| assetlinks présent | Supprimer le fichier de `public/` | Fichier absent |
| assetlinks tableau | `{}`, puis `[` | « pas un tableau » / « JSON illisible » |
| Entrées cachées | `public/.test-cache`, `public/.well-known/.x` | Les deux listées |
| Hors précache | `additionalManifestEntries: [{ url: '.well-known/assetlinks.json', revision: '1' }]` | Faute précache |
| `denylist` présent | Retirer `navigateFallbackDenylist` | « aucun denylist » |
| `denylist` correct | `[/^\.well-known\//]`, puis `[/./]` | « ne couvre pas » / « couvre une route de l'app » |
| Route `/confidentialite` | Retirer la route | `h1` absent |
| Requêtes externes | `<img src="https://example.invalid/p.png">` dans `index.html` | L'URL nommée |
| `À REMPLIR` | État de fin de lot | **Échec voulu** |
| `À REMPLIR` (inverse) | Remplir temporairement | Smoke vert |
| Scanner | Témoin introuvable | « scanner aveugle » |

Gardes Vitest : `**` déplacé en fin ou `"!**/.well-known/**"` ajouté → `firebaseHosting`
échoue ; `fetch('/x')` dans `src/` → `reseauBoundary` échoue ; import statique de l'écran →
`lazyRoutes` échoue.

### Vérification V4 (Dev, obligatoire)

Appeler la vraie `listFiles` de la CLI installée (`<npm root -g>/firebase-tools/lib/listFiles.js`)
sur `dist/` avec l'`ignore` de `firebase.json`, après avoir créé `dist/.secret-test` et
`dist/.cache/x.txt`. **Avec D1** : `.well-known/assetlinks.json` présent, aucun des deux
fichiers de test. **Avec l'ancien `**/.*`** : consigner le résultat (doit montrer
`.cache/x.txt` envoyé).

## Sens des dépendances

L'écran n'importe que `react-router`, `lucide-react`, `@/ui/composants/commun/*`, `@/ui/labels`.
Rien de `@/infrastructure`, aucun service. `labels.ts` n'importe que des **types** du cœur.
`ui` → `application` → `domain` inchangé.

## Décisions de `CLAUDE.md` concernées

Respectées : § DS « pas de Firebase dans l'app, pas de réseau » ; Hosting reste statique ;
§ Déploiement (ordre des en-têtes, `max-age`, `id: '/'`) ; stockage persistant demandé au
démarrage (aussi sur `/confidentialite`) ; charte (angle vif, tokens, 48 px).

**À graver en fin de lot**, puis `/refresh-architecture` :
1. **§ Déploiement** : `ignore` en `**/.!(well-known)` + `**/.!(well-known)/**`, **jamais de
   `!` dans `ignore`** ; règle `headers` dédiée après le fourre-tout ; `/.well-known/` hors
   repli de navigation et hors précache ; `smoke` refuse tout `dist/` contenant `REMPLIR`.
2. **§ DS, sous « pas de réseau »** : la politique `/confidentialite` l'affirme ; toute capacité
   réseau se livre **avec** sa mise à jour (garde `reseauBoundary`).
3. `docs/DEPLOIEMENT.md` (section « Confidentialité et Digital Asset Links » : URL Play
   Console, remplissage et date, R4, R5, exception et en-têtes, V4 à refaire après montée
   majeure de firebase-tools, ce que le lot 4 remplira — nom de package et empreintes SHA-256,
   clé de Google avec Play App Signing, à confirmer au lot 4 —, vérification en `curl.exe`,
   paragraphe « Contrôles de `npm run smoke` ») ; `docs/PROJECT_PLAN.md` § 0, 3, 4, 6 ; feuille
   de route ; `.claude/CONVENTIONS.md` § 14 (mineur).

## Baseline sécurité

- **Frontières** : surface de publication plus étroite ; une règle d'en-tête en fin de liste ;
  `denylist` du SW (une `denylist` fausse casserait le hors-ligne : vérifiée par le smoke) ;
  texte public = engagement.
- **Inchangé** : pas d'entrée non fiable nouvelle, pas de rendu de saisie
  (`dangerouslySetInnerHTML` absent), pas de dépendance, pas de réseau, pas de secret.
- **Mitigations** : D1-D3, liste blanche des entrées cachées, contrôles précache / `denylist`,
  observation des requêtes externes, garde `À REMPLIR` sans contournement, gardes
  `firebaseHosting` et `reseauBoundary`, V4, curl.

| Résiduel | Owner |
|---|---|
| Sémantique d'`ignore` liée à firebase-tools global non épinglé : refaire V4 à chaque majeure | Utilisateur |
| Fichier manquant au déploiement → `200 text/html` (réécriture SPA) ; smoke + curl | Utilisateur |
| R1 : robot sans JS ; plan B page statique, lot à part | Utilisateur |
| R5 : texte qui devient faux ; garde réseau = fil-piège, pas preuve | Orchestrator et Sécurité |
| Voix synthétisée en ligne : dite dans le texte | Utilisateur (Q5) |
| Canal de prévisualisation qui contourne le smoke | Utilisateur |

## Questions ouvertes

Aucune bloquante pour Dev.

**Conditions d'arrêt (retour Archi)** : **S1** V4 contredit D1 ; **S2** `sw.js` construit sans
`denylist`.

- **Q1** (utilisateur) : éditeur, e-mail de contact, date, avant le premier déploiement.
- **Q2** (utilisateur) : entité Google qui fournit Firebase Hosting au projet `dartpero`
  (raison sociale, adresse), à lire à la source — pistes à vérifier : Google LLC (Mountain
  View), ou Google Ireland Limited / Google Cloud EMEA Limited pour l'EEE.
- **Q3** (utilisateur) : curl après déploiement — `curl.exe -I …/.well-known/assetlinks.json`
  (200, `application/json`, `no-cache`, pas de `set-cookie`) et `curl.exe -s` → `[]`.
- **Q4** (utilisateur, R4) : si `installation-guidee` n'est pas encore en ligne, le déployer
  **avant** de fusionner ce lot.
- **Q5** (utilisateur) : restreindre `SpeechAnnouncer` aux voix `localService` — lot à part.
- **Q6** (utilisateur) : `persist()` sous Firefox peut solliciter le visiteur de
  `/confidentialite` ; recommandation : accepter.
- **Dev** : formulation du texte dans les contraintes ci-dessus ; mesure en paysage ;
  `npm run lint` après `firebase.json` ; consigner V4 et les mutations.
- **Test** : mutations ; relecture 390 × 844 et paysage, sombre et clair ; hors ligne à la
  main ; smoke de fin de lot en code 1 sur la seule garde `À REMPLIR`.
- **Sécurité** : politique contre le code ; motifs `ignore` sans `!` ; garde `À REMPLIR`
  incontournable ; couverture du détecteur réseau.
- **Orchestrator** : graver dans `CLAUDE.md`, `/refresh-architecture` ; optionnel : une ligne
  dans `.claude/agents/sec.md`.

## Résolution des questions (gate Architecture → Dev, Orchestrator, 2026-10-03)

| Question | Résolution |
|---|---|
| Barre de navigation (intake) | Tranchée par l'architecte : visible (D4) |
| Q1, Q2 | Différées par décision d'intake : `À REMPLIR` + smoke bloquant ; à remplir par l'utilisateur avant le premier déploiement. Ne bloquent pas Dev |
| Q3 | = critère d'acceptation 6, tâche utilisateur après déploiement |
| Q4 | Close : l'utilisateur confirme `installation-guidee` déjà déployé (2026-10-03) |
| Q5 | Hors périmètre : lot à part ; le texte dit la nuance |
| Q6 | Acceptée : exclure `/confidentialite` de `persist()` toucherait une décision gravée |
| Dev / Test / Sécurité / Orchestrator | Consignes de phase, portées par chaque phase |
