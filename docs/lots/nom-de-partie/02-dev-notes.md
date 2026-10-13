# Lot `nom-de-partie` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (lancé en `model: opus`,
> effort `medium` du frontmatter, `maxTurns` 100 non atteint), 2026-10-12. Branche
> `lot/nom-de-partie`, rien de committé. Politique de confidentialité, `CLAUDE.md`,
> `CONVENTIONS`, charte, glossaire et `PROJECT_PLAN` non modifiés.

## Ce qui a été implémenté

**Domaine**
- Créé `src/core/domain/value-objects/MatchName.ts` : `MATCH_NAME_MAX_LENGTH = 30`, branded
  `MatchName`, `MatchName.of` (trim ; vide → `null` ; > 30 → `DomainError` citant la
  longueur, jamais tronqué ; aucune autre normalisation, JSDoc sur la différence avec
  `Player.cleanName`).
- `src/core/domain/events/MatchEvent.ts` : `readonly name?: MatchName` sur les 4 ouvertures
  (discriminants inchangés) ; `nameOf(events)`, `switch` exhaustif, `default` typé `never`.

**Application**
- `readonly name?: string` dans les 4 commandes (`StartMatch`, `PlayTourDuMonde`,
  `PlayCricket`, `PlayCheckoutPractice`).
- Créé `use-cases/nameField.ts` : helper commun aux 4 lancements, appelle `MatchName.of` et
  rend `{}` ou `{ name }` à étaler ; appelé **en premier** dans chaque use case (avant tirage,
  vérification des profils, `save`).
- `RestartMatchUseCase` (`name: ouverture.name` par branche, JSDoc), `summarize` et
  `MatchSummary` (`BaseSummary.name: MatchName | null`), `backupSchema.versOuverture` (clé
  absente → pas de nom ; présente → `texte()` puis `MatchName.of` ; non-chaîne ou > 30 →
  partie écartée ; vide / espaces → clé absente), `ManageBackup.ts` (commentaire de
  `BACKUP_VERSION`, qui reste à 1).
- Créés `ports/driving/GetMatchName.ts` (`MatchNaming = { name, createdAt }`) et
  `use-cases/GetMatchNameUseCase.ts` (`DomainError` sur id inconnu, via `loadMatch`).

**Composition** — `container.ts` : `Services.getMatchName`, `Services.clock` (même instance
que les use cases, JSDoc : exception de même nature que `devices`).

**Infrastructure** — aucun changement.

**UI**
- `labels.ts` : `LIBELLE_NOM_PARTIE`, `JOURS`, `TRANCHES`, `TRANCHE_NUIT`, `nomParDefaut`,
  `nomDePartie` ; tables, sans `Intl` ; nuit = `(getDay() + 6) % 7`, jamais `− 5 h`.
- `useNouvellePartie.ts` : `proposition` (initialiseur paresseux sur `services.clock.now()`),
  `saisieNom` ; fonction pure exportée `nomTape(saisie, proposition)` ; les 4 lancements
  reçoivent `...name` ; expose `nom: { saisie, setSaisie, proposition }` et le type
  `NomPartieSaisi`.
- `NouvellePartieEcran.tsx` passe `nom` à `EtapeJeu.tsx`, qui gagne `ChampNom` au-dessus des
  cartes : `<label>` visible relié par `useId`, `type="text"`,
  `maxLength={MATCH_NAME_MAX_LENGTH}`, `min-h-12`, tokens, placeholder = proposition en
  `text-craie/60`, pas d'`autoFocus`, `autoComplete="off"`, `enterKeyHint="done"` ;
  commentaire « Une question par écran » mis à jour.
- Créé `hooks/useNomDePartie.ts` : `useQuery(['matchNom', id], staleTime: Infinity)` →
  `nomDePartie(data)` ou `null` pendant le chargement.
- `DispositionPartie.tsx`, `TableauHonneur.tsx` : prop **obligatoire**
  `nomPartie: string | null` (TypeScript a bien signalé les 4 résumés avant branchement).
- 4 écrans de jeu et 4 résumés appellent `useNomDePartie` avant tout retour anticipé.
- `HistoriqueEcran.tsx` : `<h2>{nomDePartie(partie)}</h2>` en tête de carte ; `ApercuPartie`
  inchangé.

### Décisions sur les questions assignées à Dev

- **Q1 (bandeau) — close côté Dev, reste à la relecture utilisateur.** Le nom a **sa propre
  ligne sous la rangée existante**, dans `<header class="bandeau-match">`, pour les 4 modes,
  portrait et paysage : aligné après la flèche de retour (`pl-12`), `font-score text-[0.7rem]
  tracking-wide text-craie/70`, casse telle que tapée, une ligne `truncate`. Hauteur réservée
  `h-4` même à `null` (la zone de lecture ne saute pas). Raison : en X01 avec sets, DI et DO,
  la rangée passe déjà à la ligne. Coût : ~14 px de bandeau, partiellement compensés
  (`pb-2` → `pb-1.5`, `pb-0.5` en paysage).
- **Q2 (résumé et historique) — close.** Résumé : `<p>` en tête de `TableauHonneur`, au-dessus
  du surtitre (`text-base font-bold text-craie-vive`), `break-words`, `min-h-6` réservé ; pas
  de second `<h1>` (le vainqueur reste le titre). Historique : `<h2>` en tête de carte, retour
  à la ligne plutôt que troncature.
- **Q9 (vigilance) — close.** `clock.now()` lu une fois (initialiseur paresseux ; appelé deux
  fois sous `<StrictMode>`, sans effet avec `SystemClock`) ; la proposition n'est jamais écrite
  (`nomTape` rend `{}` pour vide, espaces ou égal à la proposition) ; pas d'`autoFocus`,
  vérifié par un test.
- **Comportement assumé** : retaper exactement la proposition n'écrit rien ; la partie affiche
  alors le nom de sa date de création (conforme à l'intake).

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Helper `nameField.ts`, non nommé par l'architecture | Ajustement | Factorise la validation identique des 4 lancements ; design inchangé |
| `backupSchema` teste `valeur.name === undefined` plutôt que la présence de la clé | Ajustement | Une clé `undefined` ne peut pas exister dans un JSON : même résultat |
| Nom sur une ligne séparée aussi en paysage | Ajustement | L'architecture laissait le choix (ligne réservée ou rangée) |

Aucune refonte nécessaire.

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | `biome check .` : 240 fichiers, 0 correction, 0 avertissement |
| `npm run typecheck` | `tsc --noEmit` : 0 erreur |
| `npm test` | 48 fichiers, **650 tests, 650 verts** (avant le lot : 43 fichiers, 517 tests → +133) |

Aucun test existant n'a dû être ajusté (les `MatchSummary` sont comparés par `toMatchObject` ou
champ par champ) : la Q8 d'Archi n'a rien coûté.

### Tests ajoutés

- `tests/domain/matchName.test.ts` (24) : fabrique, `nameOf`, projection identique avec / sans
  nom pour les 4 modes.
- `tests/use-cases/nomDePartie.test.ts` (18) : 4 lancements (nom propre, pas de clé sans nom,
  31 → `DomainError` et base vide), `getMatchHistory`, `getMatchName`, journal d'avant le lot,
  annulation qui garde le nom (X01, entraînement). Helper `tests/use-cases/lancerPartie.ts`.
- `tests/use-cases/restartMatch.test.ts` (+8) : avec nom → même nom, 4 modes ; sans nom → pas
  de clé, `createdAt` du lendemain (`SettableClock`).
- `tests/use-cases/backup.test.ts` (+13) : vieille sauvegarde, aller-retour 4 modes, `42`,
  `null`, `true`, `{}`, `[]`, 31 caractères → écartée (`matchesSkipped` = 1), trim, espaces,
  `version: 1`.
- `tests/infrastructure/dexieRepositories.test.ts` (+1) : ouverture nommée / sans nom sur
  `fake-indexeddb`.
- `tests/ui/nomDePartie.test.ts` (21) : critères 1 et 2, bouclage de semaine, 7 jours,
  changements d'heure 29/03 et 25/10/2026, `nomDePartie`, `nomTape` (`toStrictEqual({})`).
- `tests/ui/nomDePartieEcrans.test.tsx` (36) : étape 1 (prérempli, sans focus, non requis,
  `maxLength` 30, placeholder), critère 10 (retour téléphone et bouton « Étape précédente »),
  sortie puis retour (proposition, aucune préférence écrite), critères 3-5 (16 cas, 4 jeux),
  bandeau et résumé des 4 modes, historique (tapé, défaut, avant le lot), « On remet ça » de
  bout en bout.
- `tests/architecture/horlogeBoundary.test.ts` (12) : `Date.now(`, `new Date()`, `Date()` dans
  `src/ui` et `src/core` hors commentaires, plancher de 40 fichiers par dossier, échantillons
  fautifs et permis. Contre-épreuve manuelle : un `src/ui/sondeTemporaire.ts` avec
  `Date.now()` fait tomber la garde (fichier supprimé). Le premier jet ratait
  `Date . now ()`, révélé par l'échantillon et corrigé.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| D1 | Politique de confidentialité (Q3 archi) : rien n'a été touché ; si le texte change, `SECTIONS_CONFIDENTIALITE`, `DATE_MISE_A_JOUR_CONFIDENTIALITE` et `confidentialite.test.tsx` suivent dans ce lot | Sécurité |
| D2 | `MatchName.of` n'écarte ni caractères de contrôle ni marques bidi (Q4 archi) | Sécurité |
| D3 | `BACKUP_VERSION` reste 1, commentaire posé (Q5 archi) | Sécurité |
| D4 | Un nom > 30 caractères qui arriverait malgré tout au lancement depuis l'UI (improbable : `maxLength` limite aussi le collage) affiche le message générique `ERREUR_DEMARRAGE`, pas un message dédié | Test |
| D5 | Forme du bandeau (Q1 archi) : ligne séparée, ~14 px de plus, surtout en paysage | Utilisateur (relecture à l'écran) |

## Correction — tour 1 (Test → Dev, problèmes de test P1-P5), 2026-10-12

`dev` relancé (`model: opus`), périmètre limité aux tests et à la config de test ; aucune source
de `src/` modifiée (contre-épreuves faites sur `src/` puis restaurées, SHA-256 identiques ;
fichiers temporaires supprimés). Fichiers : `vite.config.ts` (bloc `test` seul),
`tests/ui/nomDePartie.test.ts`, `tests/architecture/horlogeBoundary.test.ts`,
`tests/domain/matchName.test.ts`, `tests/infrastructure/dexieRepositories.test.ts`,
`tests/use-cases/backup.test.ts`, `tests/ui/nomDePartieEcrans.test.tsx`.

| Constat | Correction | Contre-épreuve |
|---|---|---|
| P1 / T2 | `test.env.TZ = 'Europe/Paris'` dans `vite.config.ts` **et** précondition dans le test (minuit J+1 − minuit J = 23 h le 29/03, 25 h le 25/10) | Shell `TZ=UTC` + config : 21/21 verts ; `env` retiré + UTC : 2 échecs explicites ; « − 5 h » injecté dans `nomParDefaut` : 29/03 échoue. Suite complète verte aussi en shell `America/New_York` et `UTC` |
| P2 / T3 | Garde élargie : `Date.now` appelé **ou en référence**, `new Date` sans argument (avec / sans parenthèses), `Date(...)` appelé ; lit aussi `src/*.ts(x)` racine (hors `.d.ts`) ; `sansCommentaires` réécrit en lecteur caractère par caractère (chaînes, gabarits, regex préservés) ; 15 échantillons fautifs, 13 permis. L'ancien `sansCommentaires` mutilait réellement `src/App.tsx` (`"/nouvelle-partie/*"`), sans conséquence car non lu | `src/ui/tmpHorloge.ts` (`useState(Date.now)` après `'/nouvelle-partie/*'`) et `src/tmpRacine.tsx` (`new Date`) : 2 échecs ; supprimés |
| P3 | « Ne lit que l'ouverture » rendu significatif (volée avec `name: 'Intrus'`, seconde ouverture nommée) | `nameOf` lisant le dernier nom : échec |
| P4 | Volet « sans clé » via les vrais use cases sur `DexieMatchRepository` / `fake-indexeddb`, `it.each(MODES)` | `nameField` rendant `{ name: undefined }` : 4 échecs (IndexedDB conserve bien la clé) |
| P5 | Résumé avec nom par défaut (4 modes) ; nom invalide à l'import hors X01 (3 modes × `42` / 31 caractères) ; `name` sur un `VisitRecorded` importé ignoré ; ligne du bandeau `h-4` présente à `nomPartie = null` | Chaque cas échoue sur l'implémentation fautive correspondante |

Contrôles (rapport `dev`, revérifiés par l'Orchestrator à 20 h 56) : `npm run lint` 240 fichiers,
0 correction ; `npm run typecheck` 0 erreur ; `npm test` 48 fichiers, **686 / 686** (+36 :
garde +20, Dexie +4, sauvegarde +7, écrans +5).

Questions nouvelles :

| # | Question | Pour qui |
|---|---|---|
| Q-D1 | Ajouter `performance.now()` et `Temporal.Now` à la garde ? Aucune occurrence dans `src/` | Orchestrator |
| Q-D2 | Fuseau `Europe/Paris` fixé pour toute la suite : convention de test nouvelle, `rules/testing.md` à mettre à jour ? | Orchestrator |

## Correction — tour 2 (Sécurité → Dev, constat n° 1 + S1), 2026-10-12

`dev` relancé (`model: opus`).

- `src/ui/labels.ts:273` : `DATE_MISE_A_JOUR_CONFIDENTIALITE = 'Mise à jour le 12 octobre 2026'`
  (était le 10 octobre).
- `src/ui/labels.ts:295` (« Sur votre appareil ») : phrase exacte de `04-revue-securite.md` § D1,
  apostrophe `’` comprise ; structure `{ titre, paragraphes }` inchangée.
- `tests/ui/confidentialite.test.tsx` : date attendue mise à jour ; nouveau cas « dit que le nom
  donné à une partie est enregistré sur l’appareil » (`closest('section')` puis
  `within(section).getByText(/le nom que vous leur avez donné/)`).
- `tests/use-cases/backup.test.ts` (S1) : « ne lit pas un nom glissé par `__proto__` dans le
  fichier » — vraie chaîne passée à `JSON.parse`, `"__proto__": { "name": "Pirate" }` sur la
  partie et sur l'ouverture ; auto-vérification (`Object.hasOwn(event, '__proto__')`,
  `event.name === undefined`). Comportement réel : import réussi (`matchesImported` 1,
  `matchesSkipped` 0), ouverture sans `name`, prototype `Object.prototype`, historique
  `name: null`. Aucun code de production changé pour S1.

Contre-épreuves (restaurées exactement) : mention retirée de `labels.ts` → le nouveau cas
échoue ; `Object.assign({}, valeur)` dans `versOuverture` → `'name' in importee` vaut `true`,
échec (`Tests 2 failed | 39 passed (41)`).

Contrôles revérifiés par l'Orchestrator (21 h 08) : lint 240 fichiers, 0 correction ;
typecheck 0 erreur ; `npm test` 48 fichiers, **688 / 688**. `backupSchema.ts` : diff identique à
celui vu en S2, aucune trace de la contre-épreuve.

Limite : rendu de la page `/confidentialite` (paragraphe allongé) à relire en portrait.

## Correction — tour 3 (boucle 5, Revue → Dev), 2026-10-12

`dev` relancé (`model: opus`). Fichiers : `src/ui/labels.ts`, `tests/ui/nomDePartie.test.ts`,
`tests/ui/nomDePartieEcrans.test.tsx`, `tests/use-cases/lancerPartie.ts`,
`tests/use-cases/nomDePartie.test.ts`, `tests/use-cases/restartMatch.test.ts`,
`tests/use-cases/backup.test.ts`, `tests/infrastructure/dexieRepositories.test.ts` (Biome a trié
des imports et reformaté deux `it.each`).

1. **Amendement utilisateur, nuit au jour du calendrier** (`01-architecture.md` Révision 1) :
   `nomParDefaut` → `` `${JOURS[date.getDay()]} ${tranche ? tranche.libelle : TRANCHE_NUIT}` ``,
   décalage `(getDay() + 6) % 7` supprimé ; JSDoc de `TRANCHE_NUIT` et `nomParDefaut` sans
   « veille » (le jour se lit sur le calendrier local, jamais par décalage d'heures). Plus aucun
   « veille » dans `src/` (vérifié par l'Orchestrator). Tests : critère 2 amendé (0 h 00 et
   4 h 59 → « Dimanche nuit ») ; samedi 1 h → « Samedi nuit », dimanche 1 h → « Dimanche
   nuit », lundi 0 h → « Lundi nuit » ; les sept nuits à 2 h (12-18/10/2026) ; changements
   d'heure gardés (précondition incluse), 4 h 59 → « Dimanche nuit ».
2. **Constat de revue 3** : `Mode` / `MODES` supprimés de `lancerPartie.ts`, `lancer` prend un
   `GameModeId` ; cinq fichiers de test alignés sur `GAME_MODE_IDS` / `GameModeId` (`CARTE`
   devient `Record<GameModeId, RegExp>`). `MODES` local de `hexagonalBoundary.test.ts` laissé
   (noms de dossiers, antérieur au lot). Aide non déplacée vers `tests/fakes/` : elle pilote les
   vrais use cases, ce ne sont pas des doublures de ports.
3. **Constat de revue 4 (N1)** : `base()` rend aussi `clock` ; partie lancée dimanche 21 h, puis
   `clock.regler(MARDI_MATIN)` avant d'ouvrir l'écran ; « Dimanche soir » attendu et
   « Mardi matin » absent (bandeau et résumé, 4 modes).

Contre-épreuves (restaurées, empreintes identiques) : décalage vers la veille remis → 6 / 22
échecs ; `useNomDePartie` sur `services.clock.now()` → 8 / 41 échecs ; `'KILLER'` ajouté à
`GAME_MODE_IDS` → `tsc` refuse `CARTE` (TS2741) et le `switch` de `lancer` (TS2366).

Contrôles revérifiés par l'Orchestrator (21 h 37) : lint 240 fichiers, 0 correction ;
typecheck 0 erreur ; `npm test` 48 fichiers, **689 / 689**.

Note : `request.md` et `docs/request/nom-de-partie.md` décrivent encore la nuit « de la
veille » ; ils restent tels que validés (snapshot de provenance), l'amendement est consigné dans
`00-orchestration.md` et `01-architecture.md` Révision 1.

## Limites connues et TODO assumés

- Recharger la page en plein parcours perd le nom tapé (limite acceptée par l'architecture).
- **À relire à l'écran** (invisible en test) : les 4 bandeaux portrait / paysage, sombre /
  clair, nom de 30 caractères larges (« MMMM… »), dont X01 en sets avec DI et DO (troncature,
  alignement `pl-12`, zone de lecture immobile) ; le champ de l'étape 1 (48 px, filigrane
  lisible, clavier mobile, cartes visibles) ; la carte d'historique avec 30 caractères ; la
  tête des 4 résumés (contraste en clair).
- **Documentation à graver en fin de lot** (non faite, rôle de l'Orchestrator) : `CLAUDE.md`
  § DS, `CONVENTIONS` § 7 / 13 / 14, charte (bandeau), glossaire, `PROJECT_PLAN` § 4 / 6,
  régénération de `.ai/architecture-context.md`.
