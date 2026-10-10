# Lot `confidentialite-assetlinks` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (opus, effort high),
> 2026-10-03. **Verdict : PASS**, rien à renvoyer à Dev. Toutes les mutations annulées
> (empreintes md5 identiques, `git diff --stat` inchangé : 7 fichiers, +370 / −36), `dist/`
> reconstruit propre, aucun commit.

## Commandes rejouées

| Commande | Résultat |
|---|---|
| `npm run lint` | OK — 215 fichiers, aucune correction |
| `npm run typecheck` | OK |
| `npx vitest run` | OK — 41 fichiers, 454 tests |
| `npm run build` | OK — précache 48 entrées (788,05 Kio), `sw.js` porte `denylist:[/^\/\.well-known\//]` |
| `npm run smoke` | Code 1 **uniquement** sur la garde de publication (4 `REMPLIR` dans `assets/index-*.js`) ; statique, `/`, `/confidentialite` OK, aucune requête externe |

## Critères d'acceptation

| # | Critère | Résultat |
|---|---|---|
| 1 | `/confidentialite` par URL directe et depuis À propos, deux thèmes, portrait / paysage | OK (tests UI + captures) |
| 2 | Texte vrai ; export, import, effacement décrits | OK contre le tableau « Contenu factuel » ; nuance C1 sur l'import → Sécurité |
| 3 | `assetlinks.json` = `[]`, hors précache, vérifié par smoke | OK (3 octets ; cache workbox réel : 43 URL, aucune `.well-known`) |
| 4 | Garde `REMPLIR` qui casse | OK, et sens inverse rejoué : code 0 (« aucun REMPLIR dans 37 fichiers texte ») |
| 5 | `ignore` et ordre des `headers` | OK (`firebaseHosting` + V4 rejouée) |
| 6 | curl en production | **Tâche utilisateur** après déploiement |
| 7 | lint, tests, build, smoke | OK (smoke : échec voulu seul) |

## Cas joués

**Déploiement**
- V4 rejouée (firebase-tools 15.20.0, `dist/.secret-test`, `dist/.cache/x.txt`, `dist/assets/.y`) :
  D1 → `54 [ '.well-known/assetlinks.json' ]` ; ancien `**/.*` → `55 [ …, '.cache/x.txt' ]`.
- Mutation `denylist` `[/./]` : code 1, « couvre une route de l'app : /, /confidentialite,
  /reglages, /partie/x ».
- Le commentaire de `labels.ts` contenant « À REMPLIR » n'arrive pas dans `dist/` (minifié).

**Gardes Vitest** (mutations en plus de celles de Dev)
- `firebaseHosting` : `**` en fin → 3 échecs ; `"!**/.well-known/**"` → 1 ; `"**/.*"` → 1 ;
  `Content-Type` retiré → 1.
- `confidentialite.test.tsx` : route retirée → 8 / 9 échouent (le restant ne teste que le lien).
- `reseauBoundary`, `lazyRoutes` : relus (auto-test positif / négatif, plancher 40).

**Relecture des tests** : fakes (`fakeServices`, `renderWithServices`), requêtes par rôle,
`userEvent`, aucune assertion sur `À REMPLIR`, chaque test attend le `h1` avant d'affirmer.

**Hors ligne** (Playwright, SW installé et contrôlant)
- En ligne, `/.well-known/assetlinks.json` : 200, `application/json`, `[]`,
  `fromServiceWorker=false`.
- Hors ligne (serveur arrêté + `setOffline`) : `/confidentialite` et `/reglages` servis par le
  SW ; route inconnue → repli de l'app (témoin positif) ; `/.well-known/assetlinks.json` →
  `net::ERR_INTERNET_DISCONNECTED` (pas servi par le SW). OK.

## Relecture à l'écran

390 × 844 et 844 × 390, sombre et clair, `deviceScaleFactor` 2, thème via `dartpero:theme`.
Captures (hors dépôt) : `scratchpad/captures/` de la session —
`confidentialite-{sombre,clair}-{portrait,paysage}-{full,bas}.png`,
`reglages-…`, `reglages-ios-…-bas.png`, `horsligne-confidentialite.png`.

- Cibles : lien À propos 48 px (324 / 778 px de large) ; « Retour aux réglages » 48 px,
  atteignable au-dessus de la barre de navigation dans les 4 configurations.
- Contrastes : clair — corps 8,28:1, `dt` 5,96:1, `dd` 12,88:1, date 5,21:1 ; sombre — 9,87 /
  8 / 13,27 / 8,59. Tous ≥ 4,5.
- `<h2>` en capitales sur une ligne à 390 px. Aucun débordement (`scrollWidth` = largeur).
- Colonne `max-w-prose` alignée à gauche en paysage (588 / 844 px).
- Filet du lien 12 px sous la liste iOS, distinct (chevron, pas de numéro).

## Constats classés

| # | Constat | Classement |
|---|---|---|
| C1 | « Import : il complète la base. Rien de ce qui s'y trouvait n'est effacé. » — or `ManageBackupUseCase.ts:43` : un identifiant connu est **écrasé** | Pas un bug d'implémentation : formulation d'un engagement public → **Sécurité** |
| C2 | `<h2>` de `Panneau` en clair : laiton ≈ 9,9 px, 3,94:1 | **Préexistant, hors lot** (même composant dans Réglages) → Orchestrator |
| C3 | Guillemet ouvrant orphelin en fin de ligne (« coupez « ») | **Préexistant**, convention de `labels.ts` → Orchestrator |
| C4 | Filet du lien proche des séparateurs iOS | OK, cosmétique |
| C5 | Tiers droit vide en paysage | OK ; jugement de charte → utilisateur |

**Angles morts**
- **AM1** : `reseauBoundary` ne lit que le JS / TS de `src/` ; ni `index.html`, ni CSS, ni
  `new Image().src`, `import('https://…')`. Le smoke ne couvre que `/` et `/confidentialite` →
  **Sécurité**.
- **AM2** : la sémantique réelle d'`ignore` ne tient que par V4, manuelle (résiduel nommé).
- **AM3** : Chromium headless ≠ Safari iOS ni robot Google (R1).
- **AM4** : hors-ligne vérifié sous Playwright seulement.

## Questions ouvertes

| # | Question | Owner | Résolution (Orchestrator, gate Test → Sécurité) |
|---|---|---|---|
| 1 | 4 `MENTION_*` + date | Utilisateur | Différée par décision d'intake (garde bloquante) |
| 2 | curl critère 6 | Utilisateur | Après déploiement |
| 3 | C1 formulation de l'import ; Q3 de Dev (« ne collecte aucune donnée ») | Sécurité | Transmise à la phase Sécurité, qui la tranche |
| 4 | AM1 portée du détecteur réseau | Sécurité | Transmise à la phase Sécurité |
| 5 | C2, C3 | Orchestrator | **Tranché** : préexistants, hors périmètre, notés pour un futur audit charte |
| 6 | C5 tiers droit vide en paysage | Utilisateur | À juger à la relecture finale ; pas bloquant |

## Rejeu après boucle 2, tour 1 — 2026-10-03 (test, opus)

**Verdict : PASS**, aucun bug d'implémentation. Arbre de travail identique au départ.

| Commande | Résultat |
|---|---|
| `npm run lint` | OK — 215 fichiers |
| `npm run typecheck` | OK |
| `npx vitest run` | OK — 41 fichiers, **456 tests** |
| `npm run build` | OK — 48 entrées (788,43 Kio) |
| `npm run smoke` | Code 1 sur la seule garde `REMPLIR` (`assets/index-BH703Hz3.js : 4`) |

- **S1** : mot pour mot la revue ; conforme à `importFrom` (`put` Dexie, `DexiePlayerRepository.ts:19`, `DexieMatchRepository.ts:15`), comportement couvert par `tests/use-cases/backup.test.ts`.
- **S2** : mot pour mot la revue ; « n'envoie rien » absent de `src/`.
- **Réglages → Sauvegarde** (`ReglagesEcran.tsx:343-344`) : même sens que S1.
- **`reseauBoundary`** : planchers (≥ 40 scripts, ≥ 1 `.css`, `index.html` lu) ; mutation `@font-face … url(https://fonts.example.com/x.woff2)` dans `src/index.css` → échec avec message de politique, restauré. Bords : `w3.org.evil.test`, `w3.org@evil.test`, `HTTPS://EVIL.TEST`, `w3.org:443` signalés ; `//cdn…` et URL assemblée non vus (limite écrite dans le garde).
- **Écran** (390 × 844, sombre et clair, captures `scratchpad/captures/boucle2/`) : aucun débordement, cibles ≥ 48 px, contrastes 9,87 / 8,28 (confidentialité), 8 / 5,96 (réglages) ; débordements signalés sur `/reglages` identiques au passage précédent (préexistants).

| # | Constat | Classement | Résolution (Orchestrator) |
|---|---|---|---|
| T1-T3 | Textes, garde, commandes conformes | OK | — |
| T4 | Guillemet ouvrant orphelin (espace normale après « ) | Cosmétique, préexistant (= C3) | **Tranché** : convention de tout `labels.ts`, hors périmètre ; noté pour un audit charte |
| T5 | Aucun test n'affirme les libellés S1 / S2 / Réglages | Angle mort non bloquant | **Tranché** : accepté ; le comportement est testé côté use case, et figer un texte juridique en test n'apporte rien |
| T6 | URL sans schéma / assemblée, `public/` non lus par le garde | Angle mort documenté | Filets : smoke + relecture |
| T7 | Rendu sur vrai Android / iPhone non vérifié | Angle mort | Utilisateur, relecture finale |
| — | Commentaire « Fusion, jamais remplacement » de `importFrom` | Rappel | Déjà tranché hors périmètre (`02-dev-notes.md`) |

## Rejeu ciblé après boucle 2, tour 2 — 2026-10-03 (test, opus)

**Verdict : PASS.** lint OK (215), typecheck OK, **456 tests** OK, build OK (48 entrées), smoke
code 1 sur la seule garde `REMPLIR` (`assets/index-lumkIy0j.js : 4`).

- S3 (`labels.ts:288`) conforme ; s'affiche sur deux lignes sans débordement (capture
  `scratchpad/captures/boucle2-tour2/z-confidentialite-sombre-premiere-section.png` ; mesures
  sombre / clair, portrait / paysage sans débordement).
- `reseauBoundary` : `ESPACES_DE_NOMS` exacts (l. 64-67), planchers inchangés ; mutation
  `url(https://www.w3.org/Icons/x)` dans `src/index.css` → échec, restauré (`git diff` vide).
- T4-T7 identiques au tour 1, déjà tranchés (cosmétique préexistant, couverture de libellés
  acceptée, limites documentées, appareil réel → utilisateur).

## Rejeu après intégration des mentions — 2026-10-10 (test, opus)

**Verdict : PASS.** lint OK (215), typecheck OK, **456 tests** OK, build OK (48 entrées),
**smoke code 0** (« Garde de publication OK — aucun « REMPLIR » dans 37 fichiers texte »),
`grep -rl REMPLIR dist` vide.

- Sens direct de la garde : `MENTION_HEBERGEUR_ENTITE = 'À REMPLIR : …'` remis temporairement →
  smoke code 1 (`assets/index-*.js : 1 « REMPLIR »`) ; restauré, empreintes de `git diff` et
  `git diff --cached` identiques, smoke revenu à 0.
- Captures 390 × 844 sombre et clair du panneau « Mentions légales »
  (`scratchpad/captures/mentions/`) : e-mail ≈ 195 / 325 px sur une ligne, adresse de
  l'hébergeur sur une ligne, aucun débordement en portrait ni en paysage ; `<dd>` 13,27:1
  (sombre), 12,88:1 (clair).

| # | Constat | Classement | Résolution (Orchestrator) |
|---|---|---|---|
| T1-T2 | Garde et rendu des mentions conformes | OK | — |
| T3 | Écran 320 px non vérifié ; pas de `break-words` sur le `<dd>` | Angle mort | Accepté : ≈ 130 px de marge pour l'e-mail ; à reprendre si une valeur plus longue arrive |
| T4 | Éditeur = nom de l'appli, pas une personne | Hors Test | Valeur fournie telle quelle par l'utilisateur ; rappelée à l'arrêt final |
| T5 | Guillemets, couverture des libellés, appareil réel | Angles morts | Déjà tranchés (passages précédents) |
