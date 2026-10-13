# Lot `nom-de-partie` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport du sous-agent `sec` (lancé en `model: opus`,
> effort `high` du frontmatter), 2026-10-12. `sec` n'avait que Read / Grep / Glob : les
> commandes (S2) ont été exécutées par l'Orchestrator.

## Périmètre examiné

Fichiers modifiés ou créés qui comptent pour la sécurité, lus en entier : `MatchName.ts`,
`MatchEvent.ts`, `backupSchema.ts`, `ManageBackup.ts`, `ManageBackupUseCase.ts` (inchangé),
`nameField.ts`, `StartMatchUseCase.ts`, `PlayCheckoutPracticeUseCase.ts`,
`RestartMatchUseCase.ts`, `GetMatchNameUseCase.ts`, `container.ts`, `useNouvellePartie.ts`,
`useNomDePartie.ts`, `EtapeJeu.tsx`, `DispositionPartie.tsx`, `TableauHonneur.tsx`,
`HistoriqueEcran.tsx`, `ReglagesEcran.tsx`, `labels.ts`, `vite.config.ts`,
`confidentialite.test.tsx`, `backup.test.ts`. `PlayTourDuMondeUseCase` et `PlayCricketUseCase`
vérifiés par recherche (`nameField` appelé en premier). Non touchés : `package.json`,
`package-lock.json`, `firebase.json`, `public/`, `index.html`, `src/main.tsx`,
`reseauBoundary.test.ts`, l'infrastructure Dexie.

**Menaces considérées** : fichier de sauvegarde reçu d'un pote (seule entrée non fiable) ;
saisie du joueur (rendu, longueur, fuite hors du téléphone) ; format persisté (renommage, clé
`undefined`, compatibilité, `BACKUP_VERSION`) ; engagement public `/confidentialite` ;
dépendances, déploiement, service worker.

## Checklist

| Point | Verdict |
|---|---|
| Zéro réseau | OK — aucun `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `from 'firebase` dans `src/` |
| Politique `/confidentialite` | **KO — constat n° 1** |
| Import JSON | OK — `texte()` puis `MatchName.of` dans `versOuverture` (`backupSchema.ts:95`), appelé avant `save` (`ManageBackupUseCase.ts:68`) ; reconstruction champ par champ ; `name` sur une volée perdu (`backupSchema.ts:186`, testé `backup.test.ts:366`) ; `__proto__` sans effet (propriété propre après `JSON.parse`, rien recopié en bloc) ; types invalides et 31 caractères testés sur les 4 modes |
| Rendu de la saisie | OK — aucun `dangerouslySetInnerHTML` / `innerHTML` / `outerHTML` / `insertAdjacentHTML` / `document.write` ; nom en enfant texte seul : `DispositionPartie.tsx:60-62` (`<p>`), `TableauHonneur.tsx:67-69` (`<p>`), `HistoriqueEcran.tsx:66-68` (`<h2>`) ; aucun attribut |
| Nom hors de l'écran | OK — voix (`SpeechAnnouncer.ts:47`) : scores et joueurs seulement ; fichier d'export : `exportedAt` seul ; URL `/partie/${matchId}` ; seul `state:` de navigation `ETAT_PARCOURS` |
| Format persisté | OK — `name?` facultatif, discriminant inchangé ; `nameField` rend `{}` ; validation avant tirage et `save` ; pas de migration ; relance repasse par `MatchName.of` |
| Export | OK — `exportAll` recopie `record.events` |
| Service worker, `firebase.json`, en-têtes | Non touchés ; `vite.config.ts` : bloc `test` seul |
| `test.env.TZ` | Sans effet sur le build (clé `test`, lue par Vitest seul ; ni `define` ni `import.meta.env`) |
| Permissions, secrets | Aucune nouvelle permission, aucun secret |
| Stockage local | OK — le nom n'est qu'un `useState` (`useNouvellePartie.ts:131-132`) |
| Dépendances | Inchangées (`git diff --stat` vide sur `package.json` / `package-lock.json`). Voir S2 |
| Constat préexistant n° 11 | Pas de régression : `ManageBackupUseCase` inchangé ; un nom invalide écarte la partie avant `save` ; l'écrasement remplace aussi le nom, comportement déjà décrit par la politique (`labels.ts:306`) |

## Constats

| # | Sévérité | `fichier:ligne` | Scénario | Classement | Renvoi |
|---|---|---|---|---|---|
| 1 | Moyenne | `src/ui/labels.ts:295`, `:273` | Le lot stocke un texte libre, souvent personnel, dans IndexedDB et dans l'export ; le paragraphe « Sur votre appareil » ne le cite pas : l'engagement public (Play Console) devient incomplet. `CLAUDE.md` § DS impose texte et date dans le même lot. Aucune exposition technique | **Bug d'implémentation** | Dev (boucle 2), puis Test + Sécurité rejoués |

## Résolution des questions assignées

- **D1 / Q3 archi — politique : oui, elle change dans ce lot.**
  - `labels.ts:295`, phrase exacte : « Vos profils (pseudo, couleur, date de création) et vos
    parties (le nom que vous leur avez donné, s’il y en a un, et chaque fléchette saisie, avec
    ses dates) sont enregistrés dans la base de données du navigateur (IndexedDB), sur ce
    téléphone seulement. » (apostrophe typographique `’`).
  - `labels.ts:273` : `DATE_MISE_A_JOUR_CONFIDENTIALITE = 'Mise à jour le 12 octobre 2026'`.
  - Autres phrases relues contre le code, inchangées (export, voix, import, hébergement,
    cookies).
  - `confidentialite.test.tsx` : date à la ligne 85 ; nouveau cas — dans la section « Sur
    votre appareil », `getByText(/le nom que vous leur avez donné/)`.
- **D2 / Q4 archi — caractères de contrôle et bidi : non, pas de refus.** Rendu en texte React
  seul, dans un bloc qui ne contient que le nom (une marque bidi ne déborde pas de son
  paragraphe) ; même règle que le pseudo (`Player.cleanName`, plus exposé : voix, plus
  d'écrans) ; refuser écarterait toute la partie à l'import, retirer en silence contredirait
  « jamais tronqué » ; un fichier piégé peut déjà écrire n'importe quel texte trompeur.
- **D3 / Q5 archi — `BACKUP_VERSION = 1` confirmé.** L'import ne refuse que
  `version > BACKUP_VERSION` (`backupSchema.ts:234-237`) ; passer à 2 ferait refuser tout le
  fichier par une app plus ancienne, qui ne perd aujourd'hui que le nom. Réserve de `sec`
  levée par l'Orchestrator : `git diff -U0` de `backupSchema.ts` ne montre que l'import de
  `MatchName`, la JSDoc de `versOuverture`, son type de retour et le traitement de `name`.

## Mitigations

- Constat n° 1 : appliquer le texte, la date et le test de D1.
- **S1** (recommandation à Test, pas un constat) : un test bâti sur
  `JSON.parse('{… "__proto__": {"name": "Pirate"} …}')` vérifiant l'absence de `name` sur
  l'ouverture importée. **Décision de l'Orchestrator : intégré à la boucle 2** (coût nul,
  verrouille une garantie déjà tenue).

## Risques acceptés

Aucun. `sec` ne s'en attribue aucun.

## Risques résiduels

| Risque | Niveau | Owner |
|---|---|---|
| Nom importé avec marques bidi, caractères de contrôle ou diacritiques empilés (≤ 30 unités UTF-16) : affichage local trompeur ou débordant dans son élément ; sans exécution, après un import choisi. Le bandeau rogne (`truncate`) ; résumé et historique non | Bas | Utilisateur, pour information. Formulation proposée à la signature si l'utilisateur veut le formaliser : « Un nom de partie importé n'est pas filtré des caractères invisibles ou bidi, comme le pseudo ; affichage local seulement. » |
| `npm audit` : 8 vulnérabilités (2 moderate, 6 high), **toutes dans des dépendances de développement** (`npm audit --omit=dev` : 0) — `vitest` et `sharp` en direct ; `@vitest/mocker`, `brace-expansion`, `fast-uri`, `nanoid`, `source-map-js`, `undici` en transitif. Préexistantes : le lot ne touche ni `package.json` ni le lockfile | Information | Utilisateur — hors périmètre du lot, candidat à un lot de maintenance |

## Questions ouvertes

| # | Question | Pour qui | État |
|---|---|---|---|
| S1 | Test `JSON.parse` + `__proto__` | Test / Orchestrator | Tranchée : intégrée à la boucle 2 |
| S2 | `git diff` de `backupSchema.ts`, `npm audit`, `npm run build` | Orchestrator | **Close** : diff conforme (ci-dessus) ; audit 0 en production, 8 en dev préexistantes ; `npm run build` vert (PWA v1.3.0, `generateSW`, precache 48 entrées, 805,59 KiB) |

## Rejeu après tour 2 (2026-10-12)

> Rapport du sous-agent `sec` relancé (`model: opus`, Read / Grep / Glob seulement), périmètre
> limité au tour 2, appuyé sur les commandes de l'Orchestrator (lint, typecheck, 688 / 688,
> `git diff -U0 -- src/ui/labels.ts`).

**Constat n° 1 : levé.** `labels.ts:273` (date) et `:295` (phrase D1 mot pour mot). Politique
relue en entier (l. 283-324) contre le code : IndexedDB annonce le nom (« s’il y en a un » juste,
le nom par défaut n'est jamais écrit) ; export couvert par « vos parties » ; `localStorage`
exact (le nom n'est pas une préférence, aucun stockage dans `useNomDePartie`, `MatchName`,
`nameField`, `GetMatchNameUseCase`) ; annonce vocale exacte (`SpeechAnnouncer.ts` sans `name` /
`nom`) ; autres sections inchangées et sans raison de changer.

**Tests** : `confidentialite.test.tsx:88-96` et `backup.test.ts:406-441` verrouillent ce
qu'ils doivent (cf. Test) ; `'name' in importee` remonte la chaîne de prototypes ; la
contre-épreuve `Object.assign` prouve que le test peut échouer.

**Nouveaux constats** : aucun. Aucune nouvelle surface (réseau, rendu HTML, stockage,
dépendance). Résiduel hors sécurité : paragraphe allongé à relire sur `/confidentialite`.

**Verdict : aucun constat ouvert.**

| # | État |
|---|---|
| D1 | Close (texte, date, test livrés) |
| D2 | Inchangée : pas de refus ; résiduel bas pour information, **pas un risque accepté** |
| D3 | Inchangée : `BACKUP_VERSION = 1` confirmé |
| S1 | Close |
| S2 | Close (audit : 0 en prod, 8 en dev préexistantes → lot de maintenance candidat) |

Risques acceptés : aucun.

## Risque accepté — signé par l'utilisateur (2026-10-12)

« Un nom de partie importé n'est pas filtré des caractères invisibles ou bidi, comme le pseudo ;
affichage local seulement. » — résiduel D2, niveau bas, **accepté par l'utilisateur** en réponse
à l'Orchestrator au go final. `sec` ne se l'est pas attribué.

## Rejeu après tour 3 (2026-10-12)

> Rapport du sous-agent `sec` relancé (`model: opus`, Read / Grep / Glob seulement), périmètre
> limité au tour 3, appuyé sur les faits de l'Orchestrator (lint, typecheck, 689 / 689, aucun
> « veille » dans `src/`, même ensemble de fichiers source modifiés).

- **`nomParDefaut` (`labels.ts:423-428`) : aucune surface nouvelle.** Calcul pur sur
  `new Date(horodatage)` et deux tables `as const` ; l'heure vient de `services.clock.now()`
  (`useNouvellePartie.ts:131`) ; aucun `Date.now`, `fetch(`, `innerHTML`,
  `dangerouslySetInnerHTML`, `localStorage` / `sessionStorage` dans le code de `src/ui`. Le nom
  par défaut reste un libellé jamais écrit (`nomTape` rend `{}` pour vide ou proposition ;
  `nomDePartie` recalcule à l'affichage).
- **Politique** : toujours exacte (« s’il y en a un ») ; la date n'a pas à bouger (ni réseau,
  ni permission, ni cookie, ni donnée stockée nouvelle).
- **`backup.test.ts`** : aucun test de sécurité affaibli. `it.each(GAME_MODE_IDS)` (4 modes,
  jamais vide) élargit la couverture ; types invalides et 31 caractères (l. 311-318),
  `__proto__` (l. 410-445), `name` sur une volée (l. 370-400), vieille sauvegarde (l. 280-289),
  `version: 1` (l. 447-453) intacts.

**Constats nouveaux : aucun. Verdict : aucun constat ouvert.** D1, S1, S2 closes ; D2 risque
accepté signé par l'utilisateur ; D3 inchangée. Risques acceptés par `sec` : aucun.
