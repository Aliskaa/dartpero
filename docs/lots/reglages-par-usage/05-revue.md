# Lot `reglages-par-usage` — revue

## Passe 1 (2026-10-17)

> Agent `review` (opus / max, frontmatter), sans shell : comparaison sur disque de chaque fichier
> modifié avec `main` (`2fa21d5`), lecture de 01-04, de la planche `#rg4` et des captures du Dev.
> S'appuie sur les commandes exécutées par l'Orchestrator.

**Verdict : NO-GO** — deux écarts mineurs à la planche non tranchés (1, 2 → Dev, sauf
acceptation explicite de l'utilisateur) ; 3 et 4 à faire avant commit dans tous les cas.

### Constats

| # | Sévérité | Constat | Preuve | Renvoi |
|---|---|---|---|---|
| 1 | mineur | Valeur des voyants **pas en gras** : planche `<b>` (Oswald 700, interligne 1,1) ; code `font-score text-base leading-tight` sans `font-bold` (Oswald 500, 1,25). U7 ne change que la taille | `derniers.html:129,399-400` ; `Voyant.tsx:67-72` ; charte `:338` | Dev (boucle 5) sauf acceptation |
| 2 | mineur | Duo Exporter / Restaurer à **48 px** au lieu de 56 (`.cta` `min-height: 56px`, `.duo` étire Restaurer). U7 ne parlait pas de hauteur. Si changé : test `reglagesParUsage.test.tsx:484-489`, charte (ligne `Button`, § Les Réglages) | `derniers.html:63-64,126,407` ; `Button.tsx:26-27` ; charte `:337` | Dev (boucle 5) sauf acceptation (alors « Écart connu » dans la charte) |
| 3 | bloquant avant commit | `.ai/architecture-context.md` non régénéré malgré la gravure (`sauvegarde:dernier-export`, « jamais en voyant », trois familles de jetons réservés, `GetDeviceContents`) | index `:6-8,87-91,99` | Orchestrator (`/refresh-architecture`) |
| 4 | bloquant avant commit | PLAN et étude restés à « Fait (phase Dev), 1414 » / « Reste : Test, Sécurité, Revue » ; PLAN § 0 sans vérifications sur appareil ni dettes D1, N1, mesure de 01 | `PROJECT_PLAN.md:21-22,776-782,2106-2132` ; étude `:169` | Orchestrator (ou Dev si boucle) |
| 5 | mineur (docs) | (a) `DEPLOIEMENT.md:136-137` : installée mais ouverte dans un onglet → voyant « Pas installée » + « Comment ? », pas « phrase générique » ; (b) `PROJECT_PLAN.md:323` « Réglages → Joueurs et appli → Gérer les joueurs » ; (c) `rules/theme-colors.md:56-57` ligne vide manquante ; (d) `CONVENTIONS.md:472` préfixe `│  │` perdu | fichiers cités | Dev dans la boucle, sinon Orchestrator |
| 6 | info | (a) commentaire d'`installationPossible` faux (`useInstallation.ts:13`) ; (b) en-tête de `jourCalendaire.ts:1-2` (« d'une partie ») ; (c) `sauvegarde` désigne le fichier et la vue (`ReglagesEcran.tsx:265,303`) | — | Dev si boucle |
| 7 | info | Action du voyant désactivée pendant `occupe` non testée ; intitulé « terminées ou non » (`contenuAppareil.test.ts:35`) sans partie terminée | — | Aucun |
| 8 | info | Mesure « Dev mesure » de la lecture de toute la base (01, Baseline) non rapportée ; risque faible, repli `count()` documenté | — | Aucun (audit) |

### Invariants vérifiés

Sens des dépendances, aucun import entre modes, aucune couleur en dur ni `rounded-*`, aucune règle
de jeu réimplémentée, aucune valeur persistée renommée, jetons réservés tenus, tokens en paires,
plancher `craie-3`, icônes `aria-hidden`, `<output aria-label>`, 48 px (classes + mesures du Dev),
Sec a parcouru le diff, `CLAUDE.md` à jour : **oui**. Index régénéré : **non** (3). Planche à
l'identique hors écarts tranchés : **non** (1, 2).

### Clôture des questions 01-04

01 : U1-U10 et gravure closes par l'utilisateur ; T1-T5 (Dev), TT1-TT5 (Test), TS1 (Sec) traitées ;
TO1 à faire à la fusion (`rejouer` ajoute `getReplayableConfigurations` : CONVENTIONS § 14 → 25
ports, conflits `Services` et `labels`). 02 : Q-a, Q-b closes (utilisateur), Q-c → T1. 03 : B1, B2,
T1-T7 closes ; Q1 close par l'Orchestrator, **à annoncer à l'utilisateur** ; D1, N1 en dette, N2
accepté. 04 : aucune.

### Points assumés après le lot

U9 (iPhone : « Aujourd'hui » sans fichier enregistré), U3 (date future), Q1 (`localStorage` plein),
appli installée mais ouverte dans un onglet → « Pas installée » (aucune API), dettes D1 / N1,
lecture de toute la base, `docs/captures/reglages.png` du README (ancienne page, hors demande).

### Reste à faire par l'utilisateur

Relecture à l'écran (portrait / paysage, sombre / clair, 360 px, police max) ; contraste réel des
vignettes et de `vert-etat`, focus du voyant, sur appareil ; duo « RESTAURER » plus gros
qu'« EXPORTER » (U7, accepté mais visible) ; vrai iPhone (« Comment ? », guide, grille du
`<fieldset>`). Si la livraison glisse après le 17 octobre : redater la politique et son test.

## Passe 2 (2026-10-17, après la boucle 5)

> Agent `review` (opus / max), sans shell ; lecture sur disque du worktree et de `main`, de 00, 02
> (§ Boucle 5, § Mesure à 360 px, Session 7), 03 passe 3, 04 passe 2, l'étude, la charte, le PLAN,
> `CLAUDE.md` ; captures `ref-*-390`, `v59-360`, `v59-360-racine20`, `vjamais-360`. Commandes de
> l'Orchestrator : lint 306 / 0, typecheck OK, 1429 verts, build OK, smoke OK.

**Verdict : GO.**

### Clôture de la passe 1

| # | Clos | Preuve |
|---|---|---|
| 1 gras | Oui | `Voyant.tsx:69` `font-bold leading-[1.1]` ; Oswald 700 chargée (`main.tsx:13`) ; charte l. 338, 420 ; captures. Pas de test : angle mort accepté |
| 2 duo 56 px | Oui | `Button.tsx:26-28` ; seuls appels `ReglagesEcran.tsx:402,408` ; test `:509-515` ; charte l. 337, 415 ; 56 / 56 à 390 et 360 px, 70 / 70 à 125 % |
| 3 index | Non | Repris en constat 1 |
| 4 PLAN / étude | Oui | PLAN § 0 l. 21-32, § 4 l. 786-792, § 6 l. 2116-2146 ; étude l. 169, 452-455 |
| 5 docs | Oui | `DEPLOIEMENT.md:136-138` ; `PROJECT_PLAN.md:333` ; `theme-colors.md:57` ; `CONVENTIONS.md:472` |
| 6 commentaires / nom | Oui | `useInstallation.ts:13-17` ; `jourCalendaire.ts:1-13` ; `vueSauvegarde` (`ReglagesEcran.tsx:303,331-333`) |
| 7 tests | Oui | `reglagesParUsage.test.tsx:203-226` ; `contenuAppareil.test.ts:35` |
| 8 mesure | Consigné | PLAN § 0 l. 28-29 |

### Étiquette « Dernier export » (Q-d)

Décision de l'utilisateur, cohérente : `labels.ts:197` (nomme aussi l'`<output>`, `Voyant.tsx:68`) ;
identifiant et clé persistée inchangés (`useAppareil.ts:46`) ; politique inchangée ; tests
`reglagesParUsage.test.tsx:63,170,239,279` ; `CLAUDE.md:132`, charte l. 408, PLAN l. 335, 2118 ;
une ligne à 125 % (`v59-360-racine20`). Archives (`request.md`, 01, Objectif de 00) laissées
telles quelles. Note à ajouter dans l'étude (« → Fait au lot 12 »), l. 438 / 444 inchangées.

### Constats

| # | Sévérité | Constat | Renvoi |
|---|---|---|---|
| 1 | bloquant avant commit | Index non régénéré (clé `sauvegarde:dernier-export`, « jamais en voyant », voyant Application et `#installer`, trois familles de jetons, `GetDeviceContents`, `CLAUDE.md:130-133`) | Orchestrator |
| 2 | mineur | (a) `voyants.test.ts:15` garde « Dernière sauvegarde » ; (b) `labels.ts:197` sans commentaire d'abréviation (modèles l. 160, 910) | Dev (texte) |
| 3 | mineur | Journal de 00 arrêté à « Revue lancée » (Q-d, relances, modèles / effort manquants ; tour 2 « En cours » ; blocage « Revue 3 et 4 » ouvert alors que 4 est fait) ; 02 l. 17 sans renvoi à la session 7 | Orchestrator |
| 4 | mineur | Charte l. 408 sans « décision de l'utilisateur » ; note de l'étude à ajouter | Dev (texte) |
| 5 | info | Test passe 3 et Sécurité passe 2 antérieurs à la session 7 ; relue par la Revue : une constante hors politique, aucun test affaibli, le PASS de Sécurité tient | — |
| 6 | info | PLAN § 0 / § 4 à passer à « GO en passe 2 », doublon § 4 l. 791-792, § 0 sans police max / 360 px ; `06-echanges.md` encore le modèle | Orchestrator |
| 7 | info | Captures `ref-*-390*`, `vjamais-360` antérieures à la session 7 (ancienne étiquette) ; hors dépôt | — |

Invariants tenus sur les sessions 5-7 (aucun import, couleur en dur, `rounded-*`, règle de jeu,
valeur persistée renommée ; paires de jetons ; ≥ 48 px). Aucune question de 01-05 sans réponse
écrite.

### Reste à faire

Orchestrator : index, journal de 00, PLAN / étude / 06 ; retouches 2 et 4. Utilisateur, sur
appareil : relecture portrait / paysage, sombre / clair, 360 px, police max ; contraste réel des
vignettes et de `vert-etat`, focus ; duo (U7) ; iPhone (« Comment ? », guide, `<fieldset>`, export,
U9) ; référence : captures `v59-360*`.
