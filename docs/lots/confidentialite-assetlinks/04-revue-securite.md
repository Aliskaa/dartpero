# Lot `confidentialite-assetlinks` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport du sous-agent `sec` (opus, effort high).

## Version 1 — 2026-10-03

**Verdict : PASS sous condition d'un retour Dev sur le texte** (boucle 2). Tuyauterie de
déploiement vérifiée saine. Aucun risque accepté par `sec`.

### Vérifié

- `git diff` (7 fichiers) et les 5 fichiers non suivis lus en entier ; `ManageBackupUseCase.ts`,
  repositories Dexie, `useAppareil.ts`, `LocalStoragePreferences.ts`, `main.tsx`, `index.html`,
  `index.css`, `dist/sw.js`.
- `npm audit --omit=dev` : 0 vulnérabilité ; `package.json` et lockfile inchangés.
- Tests du lot : 22 OK.
- V4 rejouée sur une **copie** de `dist/` (scratchpad), cas ajoutés : `.env`, `.secret-test`,
  `.cache/x.txt`, `.well-known-evil/a`, `sub/.git/config`, `.well-known/.x`,
  `.well-known/sub/y.json`, `.well-known/sub/.z`. Avec D1 : seuls `.well-known/assetlinks.json`
  et `.well-known/sub/y.json` partent (le second refusé par la liste blanche du smoke,
  `smoke-build.mjs:197-202`). Avec l'ancien `**/.*` : `sub/.git/config`, `.cache/x.txt`,
  `.well-known-evil/a` partaient aussi — **le lot ferme une fuite existante**.

### Menaces considérées

Lecteur de `/confidentialite` (engagement public) ; déploiement (fichier caché publié, ordre des
`headers`, `assetlinks.json` remplacé par `index.html`, `À REMPLIR` en ligne, SW qui fige
l'app) ; joueur (aucune surface nouvelle) ; dépendance (aucune) ; sauvegarde reçue (non touchée,
vue seulement par sa description, S1).

### Constats

| # | Constat | Sévérité | Classement | Owner |
|---|---|---|---|---|
| S1 | `labels.ts:305` : l'import « complète la base. Rien de ce qui s'y trouvait n'est effacé » ; or `ManageBackupUseCase.ts:43` écrase un identifiant connu (`put` Dexie). Une vieille sauvegarde ramène une partie à un journal plus court, un profil à son ancien pseudo | Basse | **Bug d'implémentation (texte) → Dev** | Dev |
| S2 | `labels.ts:290` : « L'application ne collecte aucune donnée et n'envoie rien » est absolu, démenti deux lignes plus bas ; la voix est **active par défaut** (`useAppareil.ts:53`) et prononce le pseudo | Basse | **Bug d'implémentation (texte) → Dev** | Dev |
| P2 | `firebase.json` : aucun `!`, extglobs corrects (`.well-known-evil` exclu), ordre des `headers` intact, règle assetlinks en dernier, réécriture SPA inchangée, garde `firebaseHosting` | — | OK | — |
| P3 | SW : `denylist:[/^\/\.well-known\//]`, aucune route de l'app concernée, pas de `json` précaché, `id: '/'` inchangé | — | OK | — |
| P4 | Garde `REMPLIR` incontournable via `npm run firebase:deploy` (ni `env` ni `argv`, aucun chemin vers code 0, plancher et témoin échouent fermé) ; contournable par `firebase deploy` direct (R-a) | — | OK + résiduel | Utilisateur |
| P5 | `reseauBoundary` : fil-piège suffisant ; aujourd'hui aucun littéral `http(s)://` dans `src/` ni `index.html` hors `w3.org`. Durcissement recommandé : littéral `https?://` hors `w3.org`, étendu au CSS et à `index.html` | — | OK + durcissement optionnel | Orchestrator |
| P6 | Aucun `dangerouslySetInnerHTML` / `innerHTML`, aucune dépendance, aucun import `firebase` | — | OK | — |
| P7 | `assetlinks.json` (3 octets) n'expose rien ; ce que publiera le lot 4 est public par nature | — | OK | — |

Formulations exactes proposées :

- **S1** : `'Importer : le fichier choisi est lu sur le téléphone et vérifié, puis ses profils
  et ses parties s’ajoutent à la base. Ceux qui y figurent déjà (même identifiant) sont
  remplacés par la version du fichier ; le reste de la base n’est pas touché.'`
- **S2**, à la place des paragraphes 2 et 3 de la première section :
  `'L’éditeur ne collecte aucune donnée : Dartpéro n’a ni serveur ni compte, et ne lui
  transmet rien. Aucune mesure d’audience, aucune publicité, aucun cookie.'` puis `'Deux cas
  techniques, qui ne dépendent pas de l’éditeur, font sortir quelque chose du téléphone ; ils
  sont décrits plus bas : l’hébergeur, qui reçoit les requêtes quand il sert les fichiers de
  l’application, et la voix de l’annonce vocale qui, selon votre navigateur, peut être
  synthétisée en ligne. Le fichier d’export, lui, ne quitte le téléphone que si vous le
  partagez.'`

Hors lot signalé : `ReglagesEcran.tsx:343-345` porte la même inexactitude sur l'import.

### Résiduels à faire signer par l'utilisateur

| # | Résiduel |
|---|---|
| R-a | `firebase deploy` direct (ou canal de prévisualisation) contourne le smoke et la garde `REMPLIR`. Option : `hosting.predeploy` (Archi + utilisateur) |
| R-b | Sémantique d'`ignore` liée à firebase-tools global non épinglé : refaire V4 à chaque majeure |
| R-c | `reseauBoundary` ne voit pas les littéraux d'URL, `index.html`, le CSS, `import('https://…')` ; smoke limité à 2 pages (sauf durcissement P5) |
| R-d | Voix active par défaut, pseudo possiblement envoyé à un synthétiseur en ligne ; dit dans le texte ; restriction `localService` = lot à part (Q5) |
| R-e | `persist()` sous Firefox peut solliciter le visiteur de `/confidentialite` (Q6) — **pas de signature utilisateur trouvée** |
| R-f | `assetlinks.json` manquant au déploiement → `index.html` en 200 avec `Content-Type: application/json` ; filets : smoke + curl |
| R-g | Robot Google sans JS (R1) |
| R-h | Canal de prévisualisation (même cause que R-a) |

R4 (aucun déploiement tant que `À REMPLIR` reste) est déjà signé dans la demande validée.

### Questions ouvertes et résolution (Orchestrator, 2026-10-03)

| # | Question | Résolution |
|---|---|---|
| 1 | Renvoyer S1, S2 à Dev ? | **Oui** : boucle 2, texte seul, puis rejouer Test + Sécurité |
| 2 | Durcissement `reseauBoundary` (P5) dans le même passage ? | **Oui** : garde de test, sans changement de design, ferme R-c côté code source |
| 3 | `hosting.predeploy` contre R-a ? | Touche `firebase.json` (surface gravée) : **posé à l'utilisateur** à l'arrêt de fin de lot, avec les résiduels ; hors de ce passage Dev |
| 4 | `DEPLOIEMENT.md`, `CLAUDE.md` | Prévu : écrits par l'Orchestrator après la Revue, avant le commit |
| 5 | `ReglagesEcran.tsx:343-345` | **Inclus** dans le passage Dev : même engagement factuel sur un écran que le lot touche ; laisser deux textes contradictoires serait pire |

## Version 2 — rejeu après boucle 2, tour 1 (2026-10-03)

**Verdict : bug d'implémentation (texte) → Dev** (boucle 2, tour 2). Aucune faille de design,
aucun risque accepté par `sec`.

- **S1** : vrai, **clos** (`importFrom` → `put` Dexie, rien supprimé ; entrées illisibles
  ignorées une à une, nuance tolérable).
- **Réglages → Sauvegarde** : vrai, **clos**.
- **S2** : vrai, **clos**, sauf sa dernière phrase (S3).
- **S3** (nouveau, basse) : « Le fichier d’export, lui, ne quitte le téléphone que si vous le
  partagez. » — l'export est un téléchargement ordinaire (`ReglagesEcran.tsx:72-75`) ; sur
  iPhone le dossier Téléchargements peut être synchronisé par iCloud Drive sans partage
  explicite (réglage iOS non vérifié sur appareil). Formulation : `Le fichier d’export, lui,
  n’est envoyé nulle part par Dartpéro.` → **Dev**.
- Relecture complète : aucune autre phrase absolue (« fonctionne entièrement sur votre
  téléphone », « sur ce téléphone seulement », « n’utilise jamais la caméra… », « fonctionne
  sans réseau » vérifiées).
- **`reseauBoundary`** : planchers solides ; exception `w3.org` non détournable vers un autre
  hôte (`w3.org@evil`, `w3.org.evil`, majuscules détectés ; `w3.org\@evil` → hôte réel
  `www.w3.org`). Limite : l'exception couvre tout l'hôte `w3.org`. Durcissement facultatif :
  URI exactes `http://www.w3.org/2000/svg`, `http://www.w3.org/1999/xlink`.
- Hors garde : `public/favicon.svg` (espace de noms seul), URL de `vite.config.ts:48` en
  commentaire, absente de `dist/`.

### Résiduels à faire signer (à jour)

| # | Résiduel | État |
|---|---|---|
| R-a | `firebase deploy` direct / `hosting:channel:deploy` saute le smoke et la garde ; option `hosting.predeploy` | Inchangé (R-h fusionné) |
| R-b | Sémantique d'`ignore` liée à firebase-tools global ; refaire V4 à chaque majeure | Inchangé |
| R-c | `reseauBoundary` fil-piège | **Réduit** : restent URL sans schéma, assemblées, hôte `w3.org` entier (sauf durcissement), smoke sur 2 pages |
| R-d | Voix active par défaut, pseudo possiblement envoyé ; dit dans le texte ; Q5 lot à part | Inchangé |
| R-e | `persist()` Firefox sur `/confidentialite` (Q6), sans signature | Inchangé |
| R-f | `assetlinks.json` manquant → `index.html` en `application/json` ; filets smoke + curl | Inchangé |
| R-g | Robot Google sans JS (R1) | Inchangé |

### Résolution (Orchestrator)

| # | Question | Résolution |
|---|---|---|
| 1 | S3 → Dev | **Oui**, boucle 2 tour 2 ; rejeu Test (ciblé) + Sécurité (ciblé) |
| 2 | Exception `w3.org` restreinte aux URI exactes | **Oui**, même passage (coût nul, ferme une part de R-c) |
| 3 | `hosting.predeploy` (R-a) | Posé à l'utilisateur à l'arrêt de fin de lot |
| 4 | `DEPLOIEMENT.md`, `CLAUDE.md` | Après la Revue, avant le commit |
| 5 | Commentaire `ManageBackupUseCase.ts:43` | Déjà tranché hors périmètre |

## Version 3 — rejeu ciblé après boucle 2, tour 2 (2026-10-03)

**Verdict final : PASS.** Rien vers Dev ni Archi. Aucun risque accepté par `sec`.

- **S3** : appliqué mot pour mot (`labels.ts:288`), vrai (export = téléchargement local,
  `ReglagesEcran.tsx:72-75`) ; **clos**. Plus aucune phrase absolue démentie par le code.
- **`reseauBoundary`** : égalité exacte sur deux URI (`reseauBoundary.test.ts:64-72`) ; la regex
  ne s'arrête ni sur `@`, `\`, `/` — toute variante accrochée est signalée ; casse sensible
  (faux positif sans danger) ; seule URI du code : `2000/svg` ×2 dans `src/index.css`. 13 tests
  relancés verts. Trou `w3.org` **fermé**.

### Résiduels à faire signer par l'utilisateur (liste définitive)

| # | Résiduel | Filet actuel |
|---|---|---|
| R-a | `firebase deploy` direct ou `hosting:channel:deploy` saute le smoke et la garde `REMPLIR` ; option `hosting.predeploy` (effet sur les canaux non vérifié) | `npm run firebase:deploy`, seule commande documentée |
| R-b | `ignore` dépend de firebase-tools global non épinglé | V4 sur 15.20.0 ; à refaire à chaque majeure |
| R-c | `reseauBoundary` fil-piège : URL sans schéma ou assemblées non vues ; smoke sur `/` et `/confidentialite` seulement | Garde, smoke, relecture |
| R-d | Voix active par défaut, pseudo possiblement envoyé à un synthétiseur en ligne ; `localService` = lot à part (Q5) | Dit dans la politique, avec la manière de la couper |
| R-e | `persist()` sous Firefox peut solliciter le visiteur de `/confidentialite` (Q6) | — |
| R-f | `assetlinks.json` manquant → `index.html` en 200 avec `application/json` | Smoke, puis curl du critère 6 |
| R-g | Robot Google sans JS (R1) ; plan B page statique, lot à part | — |

R4 déjà signé dans la demande validée.

### Questions ouvertes et résolution (Orchestrator)

| # | Question | Résolution |
|---|---|---|
| 1 | `hosting.predeploy` contre R-a | Posé à l'utilisateur à l'arrêt de fin de lot (touche `firebase.json` : s'il dit oui, nouveau passage Dev + rejeux) |
| 2 | `DEPLOIEMENT.md`, `CLAUDE.md` (R5, remplissage des mentions) | Écrits par l'Orchestrator après la Revue, avant le commit |
| 3 | `MENTION_*`, date, curl | Utilisateur, avant / après le premier déploiement |

## Version 4 — rejeu ciblé après intégration des mentions (2026-10-10)

**Verdict : PASS.** Rien vers Dev.

- E-mail de contact : constante rendue en texte React dans un `<dd>`, ni `href`, ni `mailto:`,
  ni `dangerouslySetInnerHTML` ; toutes les mentions sont des constantes.
- Aucune autre donnée personnelle publiée : seule adresse e-mail dans `dist/`, `src/`,
  `public/`, `index.html` = le contact ; aucun téléphone ; aucun chemin local ni sourcemap dans
  `dist/` ; le « Kevin » de `src/ui/couleurs.ts:49` est un commentaire, retiré à la minification.
- Garde `REMPLIR` inchangée (`smoke-build.mjs:369-398`), sans `process.env` ni `argv`, plancher
  et témoin intacts : elle passe parce qu'il n'y a plus de marqueur, pas parce qu'elle serait
  affaiblie.
- Résiduels R-a à R-g : signés par l'utilisateur le 2026-10-10 ; inchangés, aucun ajouté.

**Notes pour l'utilisateur (non bloquantes)** : l'adresse de contact sera publique en clair
(page et fiche Play Store) → spam attendu, une adresse dédiée ou un alias limite l'exposition ;
l'éditeur désigne l'appli, pas une personne (choix de rédaction, pas un avis juridique).
