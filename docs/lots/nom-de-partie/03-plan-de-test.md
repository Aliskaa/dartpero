# Lot `nom-de-partie` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (lancé en `model: opus`,
> effort `high` du frontmatter), 2026-10-12.
> ⚠️ L'agent `test` n'a disposé que de Read / Grep / Glob dans cette session : il **n'a exécuté
> aucune commande**. Les résultats ci-dessous ont été produits par l'**Orchestrator**, sur la
> branche `lot/nom-de-partie`, le 2026-10-12 à 20 h 41. Les contre-épreuves de `test` sont des
> raisonnements sur le code, sans modification de fichier.

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Oui | `tests/domain/matchName.test.ts` : fabrique (trim ; vide, espaces, `\t\n` → `null` ; 30 / 31 ; jamais tronqué), `nameOf` (4 ouvertures avec / sans nom, journal vide, premier événement non-ouverture), projection identique avec / sans nom, 4 modes |
| Use cases | Oui | `nomDePartie.test.ts`, `restartMatch.test.ts`, `backup.test.ts` : 4 lancements, historique, `getMatchName`, journal d'avant le lot, annulation (X01, entraînement avec `RoundStarted`), relance, sauvegarde |
| Infrastructure | Mince, suffisant | `dexieRepositories.test.ts` : un nom traverse `fake-indexeddb`. Le volet « sans clé » ne protège presque rien (P4) ; le vrai risque (`name: undefined` écrit) est couvert par les use cases, car `InMemoryMatchRepository` stocke par référence |
| UI | Oui | `nomDePartie.test.ts` (libellés, bornes en heure locale) ; `nomDePartieEcrans.test.tsx` (requêtes par rôle, `retourTelephone`, `renderWithServices`, `SettableClock`) |
| Architecture (gardes) | Oui, avec trous | `horlogeBoundary.test.ts` (Q7) : plancher de 40 fichiers par dossier, échantillons fautifs / permis (P2) |

**Hors périmètre :** le rendu (critère 11) — jsdom ne mesure ni troncature, ni débordement,
ni glyphe rogné, ni contraste.
**Angles morts assumés :** tout ce qui précède, plus la limite `maxlength` réelle de Safari
(D4 / T1) et le comportement réel du retour matériel Android. Voir la check-list de relecture.

## Cas de test

| # | Crit. | Cas | Type | Résultat |
|---|---|---|---|---|
| 1 | 1 | Dimanche 11/10/2026 21 h → « Dimanche soir » (libellé et champ) | heureux | Couvert |
| 2 | 2 | 4 h 59, 5 h, 11 h 59, 12 h, 17 h 59, 18 h, 23 h 59, 0 h, heure locale | bord | Couvert |
| 3 | 2 / Q6 | Dimanche 1 h → « Samedi nuit » ; lundi 0 h → « Dimanche nuit » | bord | Couvert, conforme à Q6 |
| 4 | 2 | Pas de « − 5 h » : 29/03 et 25/10/2026 | bord | Couvert **seulement sur une machine à heure d'été** (P1) |
| 5 | 3 | Champ intact, vidé, espaces → pas de clé `name`, 4 jeux | bord | Couvert (12 cas UI + use cases) |
| 6 | 3 | Affichage du nom calculé | heureux | Bandeau (4 modes) et historique couverts ; résumé par défaut non testé (P5) |
| 7 | 4 | « ␣␣Finale des potes␣␣ » → journal propre, historique, résumé, bandeau | heureux | Couvert, 4 modes |
| 8 | 5 | Critères 3 et 4 dans les 4 jeux | — | Couvert (`it.each(MODES)`) |
| 9 | 6 | `maxLength` 30 ; domaine refuse 31, rien écrit | bord | Couvert (voir D4) |
| 10 | 7 | Journal d'avant le lot : `name: null`, projeté, relancé ; historique « Samedi après-midi » | rejeu à froid | Couvert |
| 11 | 8 | Vieille sauvegarde ; aller-retour 4 modes ; `42`, `null`, `true`, `{}`, `[]`, 31 → écartée ; trim ; espaces ; `version: 1` | entrée non fiable | Couvert ; refus testés sur `MatchStarted` seulement (P5) |
| 12 | 9 | Relance avec nom (4 modes) ; sans nom → pas de clé, `createdAt` du lendemain ; « On remet ça » de bout en bout | heureux / bord | Couvert |
| 13 | 10 | Étape 1 → 2 → `retourTelephone()` → nom présent ; idem « Étape précédente » ; sortie / retour → proposition, aucune préférence | parcours | Couvert |
| 14 | 11 | Bandeau sans débordement, zone de lecture immobile | rendu | **Non testable** : relecture à l'écran |
| 15 | — | Annulation d'une volée garde le nom (X01, entraînement) | annulation | Couvert |
| 16 | — | Id inconnu → `DomainError` ; base vide | bord | Couvert |
| 17 | — | Joueur supprimé puis relance | bord | Couvert (nom validé avant les profils) |

**Ces tests peuvent-ils échouer ?** (raisonnement de `test`) — « pas de clé `name` » : oui
(`{ name: undefined }` survivrait dans le repo en mémoire) ; critère 10 : oui (un état dans
`EtapeJeu` serait démonté) ; « champ intact » : oui (passer toujours `saisieNom` écrirait
« Dimanche soir ») ; refus à l'import : oui (`matchesSkipped` vaudrait 0) ; 31 caractères rien
écrit : oui (validation après `save`) ; `horlogeBoundary` : oui (contre-épreuve de Dev
cohérente) ; « − 5 h » : seulement dans un fuseau à heure d'été (P1).

**Vérification statique** : aucun écart entre le code et `01-architecture.md` /
`02-dev-notes.md` (validation avant tirage et `save`, spread conditionnel, `nameOf`
exhaustif, `useNomDePartie` avant tout retour anticipé dans les 8 écrans, même instance
`clock`, initialiseur paresseux, pas d'`autoFocus`, nom absent de l'URL / `localStorage` /
annonce vocale, tokens seulement, rien sous `craie/60`, aucun `rounded-*`).

## Résultats

Exécutés par l'Orchestrator, 2026-10-12 :

| Commande | Résultat |
|---|---|
| `npm run lint` | `biome check .` — Checked 240 files in 118ms. No fixes applied. |
| `npm run typecheck` | `tsc --noEmit` — aucune sortie, 0 erreur |
| `npm test` | Vitest 4.1.10 — Test Files 48 passed (48), Tests **650 passed (650)**, 14,80 s |

## Bugs trouvés

**Aucun bug d'implémentation.** Constats, tous classés *Problème de test* par `test` :

| # | Constat | Gravité | Classement | Renvoi |
|---|---|---|---|---|
| P1 | Tests du 29/03 et du 25/10 dépendants du fuseau : verts à vide en UTC ou sans heure d'été ; aucun `TZ` fixé | moyenne | Problème de test | Test (correctif : précondition `expect(le(30,0,0,2) - le(29,0,0,2)).toBe(23 * 3_600_000)` ou fuseau fixé) |
| P2 | `horlogeBoundary` laisse passer `Date.now` en référence (`useState(Date.now)`), `new Date` sans parenthèses, ne lit pas `src/App.tsx` / `src/main.tsx` ; une chaîne contenant `/*` ferait avaler du code par `sansCommentaires` (aucun cas aujourd'hui) | basse | Problème de test | Test (regex élargies + échantillons ; lecture de `src/*.tsx`) |
| P3 | « Ne lit que l'ouverture » (`matchName.test.ts`) vert à vide | basse | Problème de test | Test (renommer ou retirer) |
| P4 | Volet « sans clé » du test Dexie ne peut pas échouer | basse | Problème de test | Test (optionnel : vrai `StartMatchUseCase` sur `DexieMatchRepository`) |
| P5 | Couverture mince : résumé avec nom par défaut (4 modes) ; refus à l'import sur `MatchStarted` seulement ; `name` sur un `VisitRecorded` importé ; ligne du bandeau pendant le chargement | basse | Problème de test | Test (`it.each(MODES)` résumé par défaut ; cas `CricketStarted` `name: 42`) |

### D4 (nom > 30 depuis l'UI → `ERREUR_DEMARRAGE`) — close par Test : acceptable, avec réserve

Le critère 6 est tenu (`maxLength` + refus du domaine avant écriture) ; ni corruption ni partie
fantôme ; aucun message dédié promis. **Réserve (confiance basse, non vérifiée)** : WebKit
pourrait compter `maxlength` en graphèmes et non en unités UTF-16 ; 16 à 30 emoji passeraient
alors le champ et finiraient en « Impossible de démarrer la partie. » à l'étape 2 ou 3, sans
explication. → T1.

## Check-list de relecture à l'écran (utilisateur)

1. **Bandeau, 4 modes × portrait / paysage × sombre / clair**, nom
   `MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM` : une ligne, « … » visible, alignement `pl-12` sous le
   texte, zone des chiffres géants immobile au chargement.
2. **X01 en sets avec DI et DO, en paysage, téléphone bas (~360 px)** : +14-16 px ; touches
   ≥ 48 px, rien ne défile.
3. **Glyphes** : « Échauffement Ÿgjpq » — rien de rogné en haut ni en bas (`h-4 leading-4
   truncate`).
4. **Étape 1** : champ ≥ 48 px, filigrane lisible en clair et en sombre, pas de clavier à
   l'ouverture, cartes visibles clavier ouvert, **pas de zoom iOS au focus** (police ≥ 16 px).
5. **iPhone, D4** : coller / taper plus de 16 emoji ; combien le champ en accepte ; le
   lancement échoue-t-il ?
6. **Historique** : 30 caractères larges, retour à la ligne, clair et sombre.
7. **Résumés des 4 modes** : nom au-dessus de « Partie terminée », contraste `craie-vive` en
   clair, 30 caractères passés à la ligne.
8. **Retour matériel Android** : étape 1 → 2 → retour → nom présent.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| T1 | Message dédié pour un nom trop long (D4), selon le point 5 de la check-list | Utilisateur, puis Dev |
| T2 | Fixer le fuseau des tests, ou ajouter la précondition d'heure d'été (P1) | Dev / Orchestrator |
| T3 | Élargir `horlogeBoundary` (P2) | Dev |
| T4 | « Changer les règles » depuis un résumé repart de la proposition (le nom tapé ne suit pas), alors que « On remet ça » le garde. Conforme à `01-architecture.md` ; à confirmer comme voulu | Utilisateur |
| — | D1 à D3 (politique, caractères de contrôle / bidi, `BACKUP_VERSION`) restent chez Sécurité | Sécurité |

## Rejeu après tour 1 (2026-10-12)

> Rapport du sous-agent `test` relancé (`model: opus`, Read / Grep / Glob seulement). Commandes
> exécutées par l'Orchestrator à 20 h 56 : `npm run lint` « Checked 240 files in 115ms. No fixes
> applied. » ; `npm run typecheck` sans sortie ; `npm test` « Test Files 48 passed (48), Tests
> **686 passed (686)** ». Le +36 de Dev recompté juste (garde +20, Dexie +4, sauvegarde +7,
> écrans +5).

**Aucun bug d'implémentation.**

| # | Statut | Vérification |
|---|---|---|
| P1 / T2 | Levé | `test.env.TZ = 'Europe/Paris'` (bloc `test` seul) + précondition 23 h / 25 h (`nomDePartie.test.ts:73`). Contre-épreuve cohérente (à New York, le 29/03 dure 24 h) |
| P2 / T3 | Levé | `Date.now` appelé ou en référence, `new Date` sans argument, `Date(…)` ; `src/*.ts(x)` racine lu, présence d'`App.tsx` / `main.tsx` contrôlée ; `App.tsx:71` recopié comme chaîne |
| P3 | Levé | Volée « Intrus » + seconde ouverture nommée ; « premier nom » / « dernier nom » échouent |
| P4 | Levé | Vrais use cases sur `DexieMatchRepository` ; le clone structuré conserve `name: undefined` |
| P5 | Levé | Résumé par défaut (4 modes), refus hors X01, `VisitRecorded` nommé ignoré, ligne `h-4` à `null` |

**`sansCommentaires` et `HORLOGE`** : lecteur sain (commentaires avant regex, échappements,
classes, chaînes non fermées arrêtées à la ligne, commentaires JSX retirés ; une erreur de
lecture ne fait que recopier du texte). Regex juste, dense mais documentée.
**Effet de bord de `TZ`** : aucun trouvé (dates de test en heure locale ; horloge des fakes
`Date.UTC(2026, 7, 26, 12)` = 14 h à Paris, même jour ; aucune date formatée affirmée).
Conséquence à documenter : un futur test écrit en UTC sera vert partout sans erreur visible.

### Constats nouveaux

| # | Constat | Gravité | Classement | Décision de l'Orchestrator |
|---|---|---|---|---|
| N1 | Les tests bandeau / résumé « nom par défaut » ouvrent l'écran à l'heure de création : ils ne distinguent pas `createdAt` de `clock.now()` | très basse | Problème de test | **Non corrigé, assumé** : le risque est couvert par le test de l'historique (partie du samedi ouverte le dimanche) et par le use case `getMatchName` ; ne justifie pas un tour de boucle |
| N2 | Faux négatifs résiduels de `horlogeBoundary`, absents de `src/` : `//` ou `/*` dans du texte JSX lu comme commentaire ; `new globalThis.Date()`, `Date?.now()`, `const { now } = Date`, `Intl.DateTimeFormat().format()` sans argument | basse | Problème de test | **Non corrigé, assumé** : aucune occurrence aujourd'hui ; consigné ici comme limite connue de la garde, à reprendre avec Q-D1 si l'un de ces usages apparaît |

### État des questions

| # | État |
|---|---|
| T1 | Ouverte → relecture iPhone (point 5), puis décision utilisateur ; non bloquante pour Sécurité |
| T2, T3 | Closes (P1, P2 levés ; résidus en N2) |
| T4 | Close (utilisateur) |
| D4 | Close (acceptable ; réserve WebKit reportée en T1) |
| Q-D1 | Tranchée, sans objection de Test ; `Intl.DateTimeFormat().format()` sans argument rejoint la même famille (N2) |
| Q-D2 | Tranchée ; doc de fin de lot : `rules/testing.md` et `CONVENTIONS` § 11 / 12 — fuseau fixé, bornes toujours en heure locale, précondition d'heure d'été comme modèle |
| D1-D3 | Chez Sécurité |

## Rejeu après tour 2 (2026-10-12)

> Rapport du sous-agent `test` relancé (`model: opus`, Read / Grep / Glob seulement), périmètre
> limité au tour 2. Commandes exécutées par l'Orchestrator à 21 h 08 : lint 240 fichiers, 0
> correction ; typecheck 0 erreur ; `npm test` 48 fichiers, **688 / 688**.

| Point | Verdict |
|---|---|
| Texte `labels.ts:295` et date `:273` | Conformes mot pour mot à `04-revue-securite.md` § D1 (apostrophe `’`) ; date présente seulement dans la constante et `confidentialite.test.tsx:85`, affichée une fois (`ConfidentialiteEcran.tsx:48`) |
| Rien d'autre changé dans la politique | **Confirmé par l'Orchestrator** : `git diff -U0 -- src/ui/labels.ts` ne retire que les lignes 273 et 295 ; le reste du diff est un ajout pur (l. 373-438, libellés du nom) |
| Nouveau cas `confidentialite.test.tsx` (l. 88-96) | Peut échouer : mention retirée, déplacée hors de la section (`within(section)`), titre absent. Limite acceptée : mention déplacée dans un autre paragraphe de la même section |
| Cas de date (l. 81-86) | Toujours « une seule fois » (chaîne en dur, `toHaveLength(1)`) |
| Test `__proto__` (`backup.test.ts:406-441`) | Vraie chaîne passée à `JSON.parse` ; auto-vérification juste (`Object.hasOwn`, `event.name === undefined`, fixture valide sinon « partie introuvable ») ; contre-épreuve `Object.assign` cohérente ; ne peut pas passer à vide. L'assertion sur le prototype est redondante mais sans danger |

**Constats** : aucun bug d'implémentation, aucun problème de test.
**Question** : vérification `git diff` de `labels.ts` — **close** (ci-dessus).
**Angle mort** : paragraphe « Sur votre appareil » allongé, à relire sur `/confidentialite`
(portrait / paysage, sombre / clair).

## Rejeu après tour 3 (2026-10-12)

> Rapport du sous-agent `test` relancé (`model: opus`, Read / Grep / Glob seulement), périmètre
> limité au tour 3. Commandes exécutées par l'Orchestrator à 21 h 37 : lint 240 fichiers, 0
> correction ; typecheck 0 erreur ; `npm test` 48 fichiers, **689 / 689** (+1 :
> `tests/ui/nomDePartie.test.ts` passe de 21 à 22 cas).

**Aucun bug d'implémentation. N1 levé.**

| Point | Verdict |
|---|---|
| `nomParDefaut` et l'amendement (Révision 1) | Conforme (`labels.ts:423-428`) : `JOURS[date.getDay()]` pour toutes les tranches, sans décalage ni millisecondes ; bornes justes ; jours de changement d'heure sans particularité (`getDay` / `getHours` locaux) ; JSDoc cohérentes ; plus de « veille » dans `src/` |
| Les tests de l'amendement peuvent échouer | Oui : critère 2 amendé (8 bornes), samedi 1 h / dimanche 1 h / lundi 0 h, sept nuits, changements d'heure avec précondition. Contre-épreuve « veille » 6 / 22 recomptée ; un calcul en millisecondes ou en UTC échouerait aussi |
| Constat 3 (`GAME_MODE_IDS`) | Levé pour les fichiers du tour : `switch` de `lancer` (TS2366) et `CARTE` (TS2741) refusent un 5e mode ; `it.each(GAME_MODE_IDS)` partout ailleurs. Reste une liste recopiée hors du tour (R1) |
| Constat 4 / N1 | Levé : partie lancée dimanche 21 h, horloge réglée à mardi 9 h avant l'ouverture, « Dimanche soir » attendu et « Mardi matin » absent (bandeau `:205-214`, résumé `:229-238`, 4 modes). Contre-épreuve 8 / 41 recomptée |
| Régressions | Aucune visible (tri Biome, `it.each` reformatés sans changer les cas) |

### Mise à jour du tableau des cas

- Cas 2 : 0 h et 4 h 59 → nuit du jour même.
- Cas 3 : samedi 1 h → « Samedi nuit » ; dimanche 1 h → « Dimanche nuit » ; lundi 0 h →
  « Lundi nuit » ; les sept nuits — couvert, conforme à la Révision 1.
- Cas 4 : couvert quel que soit le fuseau de la machine.

### Constats résiduels (non bloquants)

| # | Constat | Gravité | Classement |
|---|---|---|---|
| R1 | `tests/domain/matchName.test.ts:18-64` garde une liste `OUVERTURES` recopiée des 4 modes (fichier hors du tour 3) : les tests « projection identique » ne couvriraient pas un 5e mode. Correctif : `Record<GameModeId, readonly MatchEvent[]>` | basse | Problème de test |
| R2 | Rien ne distingue `createdAt` de `updatedAt` dans les tests de nom par défaut (aucune volée après le changement d'horloge). Code actuel juste (`GetMatchNameUseCase.ts:12`). Correctif d'une ligne dans le test `getMatchName` (`tests/use-cases/nomDePartie.test.ts:52-66`) | très basse | Problème de test |
| R3 | `joueurs(mode)` teste `=== 'CHECKOUT_PRACTICE'` en dur dans 5 fichiers de test au lieu de `GameModes.isSolo(mode)` | info | Problème de test |
| R4 | Antérieur au lot : `hexagonalBoundary.test.ts:94,113` ne contrôle que `x01` et `tour-du-monde` pour l'interdiction d'import entre modes | basse | Problème de test (antérieur) |

**Questions** : aucune nouvelle. N1 close ; N2 toujours assumé. Angle mort inchangé (le tour 3
ne touche pas au rendu).
