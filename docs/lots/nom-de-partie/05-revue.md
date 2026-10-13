# Lot `nom-de-partie` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (opus / max du
> frontmatter), 2026-10-12. `review` n'avait que Read / Grep / Glob : il n'a rien exécuté ;
> dernière exécution rapportée par l'Orchestrator (21 h 08) : lint 240 fichiers 0 correction,
> typecheck 0 erreur, 688 / 688, build vert, `npm audit --omit=dev` 0. Lignes supprimées
> vérifiées seulement pour `labels.ts` et `backupSchema.ts` (`git diff -U0` de l'Orchestrator).
> Aucun fichier temporaire de contre-épreuve ne traîne (`src/**/tmp*`, `src/**/sonde*`).

## Résumé

Le code livre le design d'`01-architecture.md` sans écart caché ; les trois écarts déclarés
(`nameField`, test `=== undefined`, ligne séparée en paysage) sont classés *Ajustement* et
justifiés.

- **Domaine** : `MatchName` (trim, vide → `null`, > 30 → `DomainError`, jamais tronqué) ;
  `name?` facultatif sur les 4 ouvertures, discriminants intacts ; `nameOf` exhaustif.
- **Application** : nom validé en première ligne des 4 lancements (avant tirage, profils,
  `save`) ; `RestartMatch` repasse le nom ; `MatchSummary.name` ; port `GetMatchName` ;
  `backupSchema.versOuverture` ; `BACKUP_VERSION` à 1, commenté.
- **UI** : heure par `Services.clock`, lue une fois ; champ ≥ 48 px, tokens, sans focus ;
  `nomTape` n'écrit ni vide, ni espaces, ni la proposition ; nom dans le bandeau (ligne réservée,
  tronquée), en tête des 4 résumés (`<p>`), en `<h2>` des cartes d'historique ; politique
  `/confidentialite` mise à jour (texte et date).
- **Tests** : +171 (517 → 688), garde `horlogeBoundary`, fuseau `Europe/Paris` fixé.

Test a couvert les vraies zones de risque ; Sec a lu les fichiers eux-mêmes, numéros de ligne
justes.

## Constats

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| 1 | majeur (condition du GO, pas une boucle) | Décision durable pas encore gravée : `CLAUDE.md` § DS muet sur le nom et `Services.clock` ; `.ai/architecture-context.md` non régénéré | Aucun — action de l'Orchestrator avant le commit |
| 2 | mineur | Liste « à graver » d'01 / 02 / 03 incomplète (cinq sources, deux fichiers d'agents) — liste corrigée ci-dessous | Aucun |
| 3 | mineur | `tests/use-cases/lancerPartie.ts:10-11` redéclare `Mode` / `MODES` au lieu de `GameModeId` / `GAME_MODE_IDS` (`games/index.ts:22-24`) : un 5e mode ne serait pas vérifié par les tests censés attraper les oublis que TypeScript ne signale pas. Aucun trou aujourd'hui ; correctif de deux lignes ; l'aide serait mieux dans `tests/fakes/` | Aucun — option : micro-passe de tests (boucle 6) si l'utilisateur la veut, sinon à écrire dans `CONVENTIONS` § 13 |
| 4 | info | N1 accepté par l'Orchestrator seul, justification en partie inexacte : ni le test d'historique ni celui du use case ne vérifient que `useNomDePartie` utilise `createdAt`. Risque très bas. Correctif d'une ligne (`clock.regler(<lendemain>)` avant `ouvrir`, `nomDePartieEcrans.test.tsx:197-204`, `:219-226`) | Aucun — à présenter à l'utilisateur, ou joint à la micro-passe du constat 3 |
| 5 | info | T1 ouverte (relecture iPhone) ; le commentaire de `MatchName.ts:26-27` (« comme `maxLength` du champ ») n'est sûr que pour Chromium et Firefox | Aucun — relecture |
| 6 | mineur (UX) | Le champ prérempli « Dimanche soir » impose d'effacer avant de taper (`EtapeJeu.tsx:86-96`), rien ne sélectionne le texte au toucher | Aucun — question de relecture ; micro-lot si retenu |
| 7 | info | Qualité : (a) `nom` dans `useNouvellePartie` (l. 285) désigne le nom de partie alors que `creerJoueur(mode, nom)` (l. 195) l'emploie pour un pseudo — `nomPartie` serait plus clair ; (b) le couple libellé + champ en est à sa troisième copie (`DialogueNouveauJoueur`, `JoueursEcran`, `EtapeJeu`) — composant `ChampTexte` à prévoir ; (c) `base()` du test d'écrans construit deux `fakeServices` | Aucun |
| 8 | info | « undefined nuit » si `createdAt` importé > 8,64e15 (pas de borne haute dans `horodatage`, `backupSchema.ts:33-38`, antérieur au lot ; `dateHeure` affiche déjà « Invalid Date ») | Aucun — à rattacher au constat 11 de l'index (lot import) |

## Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) | Oui |
| Aucun mode de jeu n'en importe un autre | Oui |
| Aucune couleur en dur dans `src/ui`, aucun `rounded-*` | Oui (3 exceptions documentées seulement) |
| Aucune règle de jeu réimplémentée dans l'UI | Oui (le nom par défaut est un libellé ; `maxLength` seul côté UI) |
| Aucune valeur persistée renommée | Oui (pas de version Dexie, pas de préférence, pas de `localStorage`) |
| UI → use cases, exception `clock` | Oui (seul `useNouvellePartie.ts:131` lit `services.clock`, exception documentée) |
| Charte | Oui (tokens, `min-h-12`, ≥ `craie/60`, angle vif ; nom dans `.bandeau-match`, ~12-14 px, D5) |
| Sec a parcouru le diff (pas seulement les notes) | Oui |
| `CLAUDE.md` à jour des décisions durables du lot | **Non — avant le commit** (constat 1) |
| `.ai/architecture-context.md` régénéré si une décision a été gravée | **Non — après `CLAUDE.md`** (constat 1) |

## Critères d'acceptation

| # | Couverture |
|---|---|
| 1, 2, 3, 4, 5, 7, 8, 9 | Test (réserve N1 sur le 3) |
| 6 | Test, sauf iPhone (T1) |
| 10 | Test, sauf retour physique Android (relecture, point 8) |
| 11 | Relecture (le test ne voit que la ligne `h-4` réservée) |

## Questions des phases

Toutes closes ou explicitement assignées : intake Q1-Q4, archi Q1-Q9, dev D1-D5 et Q-D1 / Q-D2,
test T2-T4, sec S1 / S2 closes ou tranchées ; **T1** et **D5** assignées à la relecture
utilisateur ; **N1 / N2** et le **résiduel D2** acceptés par l'Orchestrator seul, à présenter au
go final.

## Documentation à graver — liste corrigée par la revue

1. `CLAUDE.md` § DS : paragraphe d'`01-architecture.md`, **plus le nom de la garde**
   `tests/architecture/horlogeBoundary.test.ts`.
2. `.claude/CONVENTIONS.md` : § 7 (`Services` : ports driving + `devices` **et `clock`**) ;
   § 11 (fuseau `Europe/Paris`, bornes en heure locale, précondition de durée du jour — modèle
   `tests/ui/nomDePartie.test.ts:68-78` ; garde `horlogeBoundary` et ses limites N2 ; aide
   `lancerPartie.ts`) ; § 12 (`test.env.TZ`) ; § 13 (un nouveau mode : `name?: MatchName` sur
   l'ouverture et `case` dans `nameOf` ; `name?: string` dans la commande et `nameField` en tête
   de `start` — non signalé ; `...name` dans `lancer` — non signalé ; `name: ouverture.name` dans
   `RestartMatchUseCase` — non signalé ; `...versOuverture(...)` ; `nomPartie` via
   `useNomDePartie` — signalé ; étendre `MODES` de `lancerPartie.ts` — non signalé) ; § 14
   (`MatchName`, `nameOf`, `GetMatchName` 20 → 21 ports, `useNomDePartie` 9 → 10 hooks,
   `nameField`).
3. `.claude/rules/testing.md` : fuseau fixé, bornes en heure locale, précondition ; un test
   écrit en UTC sera vert partout sans être juste.
4. `.claude/rules/frontend-react.md:16` : `useNomDePartie` ; « l'heure courante passe par
   `services.clock`, jamais `Date.now()` (garde `horlogeBoundary`) ».
5. `.claude/rules/persistence.md` : champ facultatif d'événement = clé **absente**, jamais
   `undefined` (IndexedDB la conserve) ; un ajout facultatif n'incrémente pas `BACKUP_VERSION`.
6. `.claude/rules/glossary.md` : ligne « nom de partie | `MatchName` ».
7. `docs/CHARTE_GRAPHIQUE.md` : maquette du bandeau (l. 295) ; `TableauHonneur` (l. 211) : nom
   en tête, `<p>`, jamais un second `<h1>`.
8. `docs/PROJECT_PLAN.md` : § 0 (688 tests, +171 ; relecture, T1, captures) ; § 1.1
   (`MatchName`) ; § 1.3 (`name?`) ; § 2 (`GetMatchName`, horloge exposée) ; § 3 (champ, tête
   des résumés, titre de l'historique) ; § 4 (« Fait — 688 tests verts (+171) ») ; § 6 (journal).
9. `README.md` : « 517 tests » (l. 142, 272) → 688 ; option : une ligne de fonctionnalité.
10. `.claude/agents/dev.md:47-48`, `.claude/agents/audit.md:32` (recommandé) : citer
    `Services.clock` à côté de `Services.devices`.
11. `.ai/architecture-context.md` : régénérer **après** `CLAUDE.md` (`Services.clock` parmi les
    exceptions ; constat 2 `Date` en partie couvert par `horlogeBoundary` ; T1, relecture,
    captures parmi les décisions ouvertes).
12. Option, à la demande de l'utilisateur seulement : renommer
    `docs/prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md` en `PARTIAL`.

## Go / no-go

**Verdict :** GO.
**Justification :** design livré tel quel, écarts justifiés ; les 10 critères testables le sont
par des tests capables d'échouer (plusieurs cassés exprès) ; le critère 11 et les angles morts
sont renvoyés à la relecture ; aucun invariant de code violé ; aucune question ouverte sans
assignation. Conditions de fin de lot : graver la documentation (liste ci-dessus) et régénérer
l'index avant le commit ; relancer les contrôles et lire `git status` ; faire acter par
l'utilisateur T1, D5, D2, N1 / N2 et la relecture. Aucune boucle : compteur à 2 / 5.

## Points non résolus après le lot

- **T1** — Safari et la limite de 30 : ouverte ; micro-lot si confirmé.
- **D5** — forme du bandeau : à décider à la relecture.
- **Résiduel D2** (bidi, bas) : non signé, formulation de `sec` prête.
- **N1 / N2** : acceptés par l'Orchestrator seul ; option de micro-passe (constats 3 et 4).
- **Q6** à confirmer d'un mot : une partie lancée un **samedi à 1 h** s'appelle
  « Vendredi nuit » (critère 2 : nuit rattachée à la veille) ; l'exemple littéral de l'intake
  « samedi 1 h → Samedi nuit » dit le contraire et a été lu « la nuit de samedi ».
- **Captures** du README et `public/screenshots/partie-x01.png`, `paysage.png` : déjà
  périmées, le lot change encore bandeau, historique, résumés, étape 1.
- **`npm audit`** : 8 vulnérabilités dev préexistantes — lot de maintenance candidat.
- **Rechargement** en plein parcours : perd le nom tapé (limite acceptée).

## Rejeu après tour 3 (2026-10-12)

> Rapport du sous-agent `review` relancé (opus / max du frontmatter, Read / Grep / Glob
> seulement), appuyé sur les contrôles de l'Orchestrator (21 h 37 : lint 0 correction,
> typecheck 0 erreur, 689 / 689). Aucun fichier de contre-épreuve ne traîne.

**Verdict : GO.** Aucune boucle : compteur à 3 / 5.

### Le tour 3

- **Révision 1 : conforme** (`labels.ts:423-428`, `JOURS[date.getDay()]` pour toutes les
  tranches ; JSDoc `:402`, `:405-422` ; tests `nomDePartie.test.ts:27-38`, `:40-47`, `:49-61`,
  `:88-98` ; contre-épreuve 6 / 22 recomptée).
- **Constat 3 : levé** (`lancer` sur `GameModeId`, TS2366 ; `CARTE`, TS2741 ;
  `it.each(GAME_MODE_IDS)` dans cinq fichiers). Reste R1, laissé sur décision utilisateur.
  Placement de `lancerPartie.ts` hors de `tests/fakes/` défendable (aide de scénario), à écrire
  dans `CONVENTIONS` § 11.
- **Constat 4 (N1) : levé** (`nomDePartieEcrans.test.tsx:36-52`, `:205-214`, `:229-238`).
  Reste R2, laissé sur décision utilisateur.
- **Classement de la Révision 1 : juste, pas un blocage.** Pas une boucle 7 (aucun design
  fautif : la spécification a été changée par son propriétaire, confirmé deux fois) ; rien
  d'architectural ne bouge ; Dev, Test, Sécurité et Revue ont tous été rejoués ; seule la
  relance d'`archi-authority` a été évitée. `request.md` inchangé : juste. Boucle 5 plutôt
  que 6 : juste (le tour touchait `src/`).

### Questions et décisions

Toutes closes par écrit ou assignées avec l'accord de l'utilisateur : Q6 (amendement) ;
constats 3, 4 levés ; T1, D5, constat 6 → relecture ; R1, R2 documentés ; R3, R4 → audit
(porteur : PLAN § 0) ; N2 limite connue, à citer au go final ; D2 signé ; Q-D1, Q-D2 tranchées.

### Constats du rejeu

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| 9 | info | La Révision 1 est rangée sous « Révisions » (dont l'en-tête dit « relance la chaîne ») ; elle dit pourquoi ce n'est pas le cas ; la Revue confirme le classement | Aucun |
| 10 | mineur | Fichiers du lot en retard : Objectif de `00-orchestration.md` (« rattachée à la veille ») à annoter ; table Statut à recompter (dev ×4, test ×4, sec ×3, review ×2) ; `06-echanges.md` à régénérer | Orchestrator, avant le commit |
| 11 | info (processus) | Au gate Architecture, l'Orchestrator a clos Q6 comme « évidente » sur un intake qui se contredisait (exemple contre critère 2) ; l'utilisateur a tranché à l'inverse. Leçon pour PLAN § 6 ; option : une ligne dans le brief `intake` (recouper chaque exemple avec les critères) | Aucun |
| 12 | info | « R3, R4 → audit » sans porteur : `/audit` ne lit pas `docs/lots/` ; idem pour l'état de R2. Les inscrire en PLAN § 0 | Intégré à la liste finale |

Constats 1 à 8 : 1 ouvert (condition du commit) ; 2 remplacé par la liste finale ; 3, 4 levés ;
5, 6 → relecture ; 7, 8 inchangés (info).

### Documentation à graver — liste finale (remplace la liste corrigée)

1. **`CLAUDE.md` § DS** — un paragraphe :
   > **Nom de partie** (lot `nom-de-partie`) : seul un nom **tapé** s'écrit — champ facultatif
   > `name` de l'événement d'ouverture des quatre modes, 30 caractères au plus, espaces autour
   > retirés (`MatchName.of`). Le nom par défaut (« Dimanche soir » ; nuit de 0 h à 5 h, au nom
   > du jour du calendrier : dimanche 1 h → « Dimanche nuit ») est un **libellé recalculé à
   > l'affichage** depuis `createdAt` (`labels.ts`) : ne jamais l'écrire, ni « compléter » les
   > anciennes parties. L'UI lit l'heure par `services.clock` (même exception que `devices`),
   > jamais par `Date.now()` — garde `tests/architecture/horlogeBoundary.test.ts`.

   Rien d'autre dans `CLAUDE.md` ; la trace de l'amendement va en PLAN § 6.
2. **`.claude/CONVENTIONS.md`** — § 7 (`Services` = ports driving + `devices` + `clock`) ;
   § 11 (fuseau fixé, bornes locales, précondition de durée du jour — modèle
   `nomDePartie.test.ts:88-98` —, un test UTC serait vert sans être juste ; garde
   `horlogeBoundary`, ce qu'elle lit et ses limites N2, ni `performance.now()` ni `Temporal.Now`
   (Q-D1) ; `it.each(GAME_MODE_IDS)`, jamais de liste recopiée, `lancerPartie.ts` aide de
   scénario hors `tests/fakes/` ; R2 : avancer l'horloge **et** enregistrer un événement pour
   prouver `createdAt`, renvoi `tests/use-cases/nomDePartie.test.ts:52-66`) ; § 12
   (`test.env.TZ`) ; § 13 (ce que TypeScript signale : `nameOf`, `nomPartie`, `lancer`,
   `CARTE` ; ce qu'il ne signale pas : `name?` + `nameField`, `...name` dans `lancer` de
   `useNouvellePartie`, `name: ouverture.name`, `...versOuverture(...)` — attrapés par
   `it.each(GAME_MODE_IDS)` ; R1 : `OUVERTURES` de `matchName.test.ts` ni signalée ni
   attrapée) ; § 14 (`MatchName`, `nameOf`, `nameField`, 21 ports driving, 10 hooks — recompter
   contre `src/`).
3. **`.claude/rules/testing.md`** — fuseau fixé, bornes locales, précondition, avertissement
   UTC (Q-D2).
4. **`.claude/rules/frontend-react.md`** — `useNomDePartie` (l. 16) ; « l'heure courante passe
   par `services.clock`, jamais `Date.now()` (garde `horlogeBoundary`) ; `Date` ne sert que de
   calendrier ».
5. **`.claude/rules/persistence.md`** — champ facultatif = clé absente, jamais `undefined` ; un
   ajout facultatif n'incrémente pas `BACKUP_VERSION`.
6. **`.claude/rules/glossary.md`** — ligne « nom de partie | `MatchName` | nom tapé (≤ 30,
   espaces autour retirés), seul écrit, dans l'ouverture ; à défaut « Jour tranche » recalculé
   depuis la date de création, jamais écrit — la nuit (0-5 h) au nom du jour du calendrier ».
7. **`docs/CHARTE_GRAPHIQUE.md`** — bandeau (l. 295) : ligne du nom, sous réserve de D5 ;
   `TableauHonneur` (l. 211) : nom en tête, `<p>`, jamais un second `<h1>`.
8. **`docs/PROJECT_PLAN.md`** — § 0 (689 tests, dont 172 du lot ; vérifications restantes :
   relecture, T1, D5, constat 6, captures ; prochain audit : R2, R3, R4, N2 ; `npm audit` dev ;
   constat 8 → constat 11 de l'index) ; § 1.1 (`MatchName`) ; § 1.3 (`name?`, `nameOf`) ; § 2
   (`GetMatchName`, horloge exposée) ; § 3 (champ, tête des résumés, titre d'historique, ligne
   du bandeau) ; § 4 (« Fait — 689 tests verts (+172) ») ; § 6 (journal : ouverture contre
   `MatchRecord` / `MatchNamed`, `Services.clock`, clé absente, `BACKUP_VERSION` 1, `TZ` et
   précondition, `sansCommentaires` qui abîmait `App.tsx`, **amendement de la nuit** — l'intake
   disait « veille », `docs/request/` et le snapshot gardent cette formulation, `CLAUDE.md` fait
   foi —, leçon du constat 11).
9. **`README.md`** — « 517 tests » → 689 (l. 142, 272) ; option : ligne « nom de partie ».
10. **`.claude/agents/dev.md:47-48`, `.claude/agents/audit.md:32`** (recommandé) : citer
    `Services.clock` à côté de `Services.devices` ; option : `architecture-context.md:61`.
11. **`.ai/architecture-context.md`** — régénérer **après** `CLAUDE.md` (`Services.clock`, nom
    de partie, constat 2 en partie couvert, décisions ouvertes T1 / D5 / constat 6 /
    critère 11 / captures, `TZ` des tests parmi les pièges).
12. **À ne pas modifier** : `docs/request/nom-de-partie.md`, `docs/lots/nom-de-partie/request.md`.
13. **Fichiers du lot** : constat 10.
14. **Options, à la seule demande de l'utilisateur** : étude prospective en `PARTIAL` ; ligne
    dans le brief `intake` (constat 11).

### Conditions avant le commit

Graver la liste finale puis `/refresh-architecture` ; traiter le constat 10 ; relancer lint,
typecheck, tests (689) et build, lire `git status` ; go final avec relecture, T1, D5, constat 6,
N2 cité.
