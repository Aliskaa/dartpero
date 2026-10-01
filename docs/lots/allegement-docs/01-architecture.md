# Lot `allegement-docs` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu (`archi-authority`, opus /
> max, 2026-09-30). Le rapport source commence par `Architecture result: PASS`. Scout et
> designer sautés (surface gravée) : aucun `FAIL` antérieur à traiter.

## Problème

`CLAUDE.md` (530 l., 34 Ko) n'est pas seulement chargé en tête de la session principale : il est
**injecté dans le contexte système de chaque sous-agent**, avec les 12 `.claude/rules/*.md`.
Puis chaque agent de phase lit en premier `.ai/architecture-context.md` (519 l., 42 Ko), qui
**recopie** `CLAUDE.md`, règles de jeu comprises. Un agent paie donc deux fois les mêmes règles,
≈ 7 fois par lot. Il faut ramener `CLAUDE.md` à ses décisions, ses pièges vitaux et des renvois,
et faire de `.ai` un **index plafonné** — sans perdre une ligne, sans retoucher une règle de jeu,
une décision structurante ni la règle d'architecture.

### Ce que l'inspection change au plan de l'Objectif

1. **« ≈ 200 lignes » est impossible avec les blocs intacts.** Décisions structurantes
   (l. 39-98) + règle d'architecture (104-120) + trois blocs de règles (126-226) = **172 lignes**,
   205 avec l'en-tête ; avec les autres sections sans raison de réduction (projet, charte —
   surface gravée —, journal, décisions ouvertes, environnement) : **246 lignes conservées**.
   Fichier réaliste : **≈ 335 lignes** (≈ 305 sans les `---`), ≈ 20-23 Ko (estimé). → Q1.
2. **Déplacer vers `.claude/rules/` n'allège rien** : ces fichiers sont chargés d'office.
   Règle : **rien de nouveau n'entre dans `rules/`** pendant ce lot ; destinations lues à la
   demande (`CONVENTIONS.md`, `docs/`).
3. **La copie injectée d'un fichier peut être périmée** (celle de l'archi ignorait la règle de
   branche de `a00e9a8`). Test, Sécurité, Revue et le générateur **relisent sur disque**.
4. **Les définitions d'agents sont probablement lues au démarrage de session** (à vérifier) :
   passer au générateur le brief **lu sur disque** dans le prompt.
5. **`CLAUDE.md` § Déploiement est périmé** : `npm run firebase:deploy` exécute
   `npm run build && npm run smoke && firebase deploy --only hosting` (`package.json` l. 19), pas
   `build` + `deploy`. Le code fait foi : corrigé à destination, signalé.
6. **La charte ne se réduit pas** (bloc « ce qui ne s'y discute pas » = surface gravée).

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| **A. Déplacer vers les sources existantes + nouveau `docs/DEPLOIEMENT.md`, titres gardés comme ancres, `.ai` = index plafonné** (retenue) | Aucune décision retouchée ; aucun renvoi pendant ; fichiers lus à la demande | ≈ 20 fichiers `.md` touchés ; ≈ 335 lignes et non 200 |
| B. Imports `@fichier` dans `CLAUDE.md` | Rangement | Un import est chargé quand même : aucun gain |
| C. Règles de jeu dans `docs/REGLES.md` | Approcherait 200 | Contredit l'Objectif ; risque de non-lecture |
| D. `rules/` chargées par chemin (`paths:`) | Allège le permanent | Nouveau mécanisme non vérifié : plus tard |
| E. `.ai` compact avec règles recopiées | Pas de déformation | ≈ 95 lignes de règles : 150 inatteignable ; deux copies qui divergent |
| F. `.ai` qui résume les règles | Tient le plafond | Le risque de déformation |
| G. Supprimer `.ai` | Pas de duplication | Workflow et Cursor s'y appuient ; perte de la synthèse transverse |

## Approche retenue

- **P1** Destinations écrites d'abord, suppressions ensuite. Déplacement **par coupe, jamais par
  reformulation**. Seule exception : ce que le code contredit, corrigé avec `fichier:ligne`.
- **P2** Les **15 titres `##` de `CLAUDE.md` sont conservés**, dans l'ordre. Chaque section
  réduite finit par « → détail : fichier § section ». Aucune référence « `CLAUDE.md` § X » ne
  pend, journaux figés compris.
- **P3** Rien de nouveau dans `rules/`.
- **P4** Blocs intacts **octet pour octet** : projet, décisions structurantes, règle
  d'architecture, trois blocs de règles, charte, journal, décisions ouvertes, environnement.
- **P5** `.ai` = **index** : il renvoie, sans recopier ni résumer une règle de jeu. Plafond
  **≤ 150 lignes et ≤ 12 288 octets**.
- **P6** Preuve de non-perte = table de correspondance + contrôle mécanique.

### 1. Section par section (lignes de `CLAUDE.md` à `a00e9a8`)

| § | Sort | Destination | Preuve | Reste dans `CLAUDE.md` |
|---|---|---|---|---|
| En-tête (1-17) | Modifié | — | — | Tout + ligne `docs/DEPLOIEMENT.md` ; ligne `.ai` dit « index » ; phrase ajoutée à la note l. 16-17 (§ 6) |
| Le projet (21-33) | Intact | — | Doublon volontaire charte § Contexte | Tout (13) |
| Décisions structurantes (39-98) | **Intact** | — | « voir § Déploiement » (l. 50) tient par le titre ; « incident `61b60ac` plus bas » (l. 65-66) tient par l'ancre gardée en § Notes techniques | Tout (60) |
| Règle d'architecture (104-120) | Intact | — | — | Tout (17) |
| Règles TdM / Cricket / X01 (126-226) | Intact | — | — | Tout (95) |
| Charte (232-247) | Intact | — | Doublons charte l. 13-21, 39-42, 288-336 | Tout (16) |
| Arborescence (252-301) | Réduite | **Nouveau `CONVENTIONS` § 14 « Arborescence »**, en fin (aucune renumérotation), arbre mot pour mot, glyphe cassé l. 273 réparé | Unique : seule liste complète des 20 ports driving (PLAN § 2 l. 147-153 oublie `PreviewTourDuMondeVisit`). Vérifiée contre `src/` : 20 driving, 9 driven, 6 hooks, 4 modes, 4 services | **≤ 12 l.** : arbre de 6 l. + renvoi, gardant 4 invariants : `games/<mode>/` + `games/index.ts` couture ; `services/` ⚠️ TRANSVERSES « un mode n'importe jamais un autre mode » (**seule occurrence** dans `CLAUDE.md`) ; `container.ts` seul câblage ; `ecrans/games/` même découpage |
| Conventions de code (307-323) | Réduite | Renvoi `CONVENTIONS` § 1, 4, 5, 7, 11, `rules/typescript`, `rules/testing`, charte § Les trois planchers | Doublons prouvés : VO/`readonly` `CONVENTIONS` l. 33-36 + `rules/typescript` l. 10-11 ; `Dart.of`/`Score.of` PLAN l. 53-54 ; branded `rules/typescript` l. 12-13 ; use cases `CONVENTIONS` l. 74-78, 109 ; fakes `rules/testing` l. 8-10 ; `Date`/`Math.random` `CLAUDE.md` l. 112-113 ; 48 px charte l. 36 | **≤ 9 l.**, trois puces gardées : **langue** (l. 318-319, citée comme source par `CONVENTIONS` l. 44-45, `rules/documentation-language` l. 11, PLAN l. 845) ; **UI → use cases** (l. 320-322, dont `Services.devices` est l'exception) ; **ports ISP** (l. 314, aucune autre source) |
| État d'avancement (329-401) | Réduite | `PROJECT_PLAN` § 4 (+ § 0) | Chaque lot a son « Fait — N tests » en § 4. Fragments uniques à déplacer : Débrief + Lot D (331-332) ; statut Lot 0 (333-336, pas de « Fait » en § 4) ; Lot 3 bis (349-352, absent de § 4, « avatars » absent de § 6) ; « 9 use cases » (341), « `QueryClient` + `ServicesProvider` câblés » (347). **Ne pas statuer** sur le 5b (`[x]` ici vs 🟡 PLAN l. 354) : PLAN reste seul | **≤ 5 l.** : renvoi § 0 / § 4 / § 6 + « Lot 6 optionnel — un adapter, zéro refonte » (l. 401) |
| Notes techniques (407-446) | Réduite | Table ci-dessous | Table ci-dessous | **≤ 8 l.** : renvois + **ancre `61b60ac`** (compose l. 411 et PLAN l. 449-450 : passage react-router 7.18 → 8.x **et** retrait accidentel du mode rapide, restauré depuis `cc8faf7`) |
| Journal des décisions (450-456) | Intact | — | Déjà un renvoi | Tout (7) |
| Décisions ouvertes (461-472) | Intact | — | N° 3 cité par `CONVENTIONS` l. 225-226 | Tout (12) |
| Déploiement (476-517) | Réduite | **`docs/DEPLOIEMENT.md`** (nouveau), mot pour mot, commande corrigée (`package.json` l. 19) | Unique ; PLAN § 6 l. 1361-1408 n'est qu'un journal | **≤ 10 l.** : URL + commande + renvoi ; ⚠️ `max-age=3600` par défaut (l. 491-494, par coupe) ; ⚠️ la dernière règle `headers` qui matche gagne, `**` en premier (l. 501-503, mot pour mot) |
| Environnement (521-529) | Intact | — | Porte la règle de branche | Tout (9) |

**Notes techniques, puce par puce**

| Puce | Destination | Nature |
|---|---|---|
| Versions (409-412), une seule copie de vite | `PROJECT_PLAN` § 4, Lot 0, nouvelle ligne « Fait » | Unique |
| TS 7 / `baseUrl` (414-415) | `rules/typescript` l. 5-7 | Doublon |
| `vitest/config` (416) | `CONVENTIONS` § 12 (vérifié `vite.config.ts` l. 6) | Unique |
| Biome 2.5 (417-420) | `rules/biome` l. 11-13 | Doublon |
| Frontière hexagonale vérifiée (421-423) | `rules/biome` l. 14-19 ; « testé au lot 0 puis retiré » → Lot 0 | Doublon + historique |
| jsdom, `setup.ts` (424-425) | jsdom + motif : `rules/testing` l. 6-7 ; `setup.ts` → `CONVENTIONS` § 11 (+ `fake-indexeddb/auto`, `tests/setup.ts` l. 2) | Doublon + unique |
| Polices `latin` (426-428) | Règle déjà charte § Typographie l. 148-149 ; motif `@fontsource/<police>/latin-<poids>.css` + 542 → 406 Kio au même § (+1 l.) | Doublon + unique |
| Deux modes de dev, iOS (429-436) | `DEPLOIEMENT.md` § Contexte sécurisé | Partiel README l. 113, 126-138 |
| Wake Lock null-object (437-438) | `CONVENTIONS` § 5 l. 91-93, PLAN § 2 l. 179 | Doublon |
| Icônes, `sharp` devDependency (439-440) | `DEPLOIEMENT.md` § Icônes | Partiel charte l. 52 |
| Rolldown, `vite:preloadError` (441-446) | `DEPLOIEMENT.md` § Service worker et bundle | Partiel PLAN l. 1372-1388 (journal) |

**Aucun contenu orphelin.** `docs/DEPLOIEMENT.md` : bandeau « décision gravée dans `CLAUDE.md`
§ Décisions structurantes ; ne la contredit jamais » ; Mettre en ligne ; Réécriture SPA ; En-têtes
de cache ; Service worker et bundle ; Contexte sécurisé (dev, téléphone, iOS) ; Icônes.

### 2. Références entrantes

**A. À corriger (cassent ou deviennent fausses)**

- `rules/biome.md` l. 13, `rules/typescript.md` l. 6-7 citent « `CLAUDE.md` § Notes
  techniques » → renvoi circulaire : citer `biome.json`, `tsconfig.json`, `vite.config.ts`.
- `skills/audit/SKILL.md` l. 41 « nombre de tests annoncé dans `CLAUDE.md` » → `PROJECT_PLAN`
  § 0 / § 4.
- `orchestrate/SKILL.md` l. 78-80, `archi-scout.md` l. 21, 25-28, `dev.md` l. 14-15, 23,
  `test.md` l. 15-18 disent que `.ai` porte les règles de jeu compactées (`test.md` : « sont la
  référence ») → faux après régénération.
- `agents/architecture-context.md` l. 19-20 : liste des sources.
- `.ai/README.md` l. 3-6, `CLAUDE.md` l. 13 : description de `.ai`.
- `.ai/architecture-context.md` : régénéré.

**B. Cohérence (phrase canonique, § 3)** : `archi-designer.md` l. 20, 25-27,
`archi-authority.md` l. 19-24, `sec.md` l. 16-17, `review.md` l. 16-19, `intake.md` l. 18-19,
`refresh-architecture/SKILL.md` l. 9-10 ; « compactage » de `.claude/README.md` l. 31, 40
(facultatif).

**C. Déjà faux avant ce lot (recommandé)** : `skills/audit/SKILL.md` l. 44 (« `CLAUDE.md` note
déjà des choses à corriger » : elles vivent en PLAN l. 166, 807, 1005, 1009, 1033 et charte
l. 397-399) ; `PROJECT_PLAN.md` l. 287 (« la maquette dans `CLAUDE.md` » → charte § Écran de
match).

**D. Rien à faire (résolues par le titre)** : PLAN l. 1306, 1378 (journal) ; `CONVENTIONS`
l. 44-45, 226 ; `rules/documentation-language` l. 11, `glossary`, `response-policy`,
`rules/testing` l. 16 ; listes de surfaces gravées ; commentaires de `src/` (`index.css` l. 10,
`main.tsx` l. 7, `visitOutcome.ts` l. 43, `tests/ui/x01.test.tsx` l. 178,
`scripts/generate-icons.mjs` l. 22) — hors périmètre et valides. **Journaux figés à ne pas
modifier** : `docs/lots/{bundle-par-route,tour-du-monde-cloture-volee,pourcentage-doubles-tiret}/*`,
`docs/audits/2026-09-10.md`.

**E.** Aucun test ne lit de Markdown ; aucun hook dans `.claude/settings.json`.

### 3. Tension du brief : tranchée

`.ai` **ne recopie ni ne résume aucune règle de jeu**. Par mode : la section source + le **nom**
des points délicats, sans les énoncer (bust, bogey numbers, départage, cut-throat, fin du tour de
table ; entraînement pointé « non gravé », PLAN § 4 / § 6 lot 5b). Une règle absente de l'index
force à lire la source ; une règle résumée incite à s'en passer.

**Brief `agents/architecture-context.md`** : retirer « mieux vaut plus long que faux » ;
obligation de pointer (une puce = consigne courte + « fichier § section ») ; **plafond ≤ 150
lignes et ≤ 12 288 octets**, mesurés avant de rendre la main et écrits dans le rapport ; budgets
indicatifs (inventaire ≈ 22, guidage ≈ 45 dont table « Où lire quoi » ≈ 14, surfaces gravées ≈ 8,
préséance/exceptions ≈ 18, constats ≈ 10) ; **jamais sacrifiés** : surfaces gravées, exceptions
délibérées, décisions renversées/tranchées/ouvertes, constats ≥ moyen — si ça ne tient pas, le
dire en § Questions et limites, l'Orchestrator tranche ; sources lues **sur disque** ; report des
constats encore valides ; garder la sous-section `### Sécurité` (citée par `sec.md` l. 16) ;
ajouter `docs/DEPLOIEMENT.md` et `CONVENTIONS` § 14 aux sources ; les 10 sections restent.

**Phrase canonique** (archi-scout, archi-designer, archi-authority, dev, test, sec, review,
intake ; reprise dans `orchestrate` § Prérequis et `.ai/README.md`) :

> `.ai/architecture-context.md` est un **index** : il dit où lire, pas ce que disent les sources.
> Une règle de jeu, une décision gravée ou une convention que le lot touche se lit **à sa source,
> sur disque**, à la section qu'il indique.

`test.md` ajoute : lire la règle dans `CLAUDE.md` § Règles du … avant d'écrire ou de juger une
assertion de bord.

`orchestrate` § Prérequis, **critère de péremption** : une source a un commit plus récent que le
dernier commit de `.ai` (`git log -1 --format=%ct -- …`), ou est modifiée dans l'arbre de
travail. Sources : `CLAUDE.md`, `CONVENTIONS`, `rules/`, charte, `DEPLOIEMENT.md`.

### 4. Régénération de `.ai`, dans ce lot

- **Quand** : après `dev`, **avant Test** (livrable testé et relu).
- **Qui** : l'Orchestrator lance `architecture-context` (sonnet / high) **en lui passant le brief
  lu sur disque** et en exigeant la lecture des sources sur disque. `dev` ne l'écrit pas à la
  main (sinon le brief n'est pas éprouvé).
- `02-dev-notes.md` consigne les deux temps et si le plafond a tenu du premier coup.
- Plafond dépassé → boucle 1 (Test → Dev) : `dev` resserre le brief, on relance.
- Vérification : `wc -l -c` par Test.

### 5. Vérifier que rien ne s'est perdu

**Table de correspondance** dans `02-dev-notes.md` — une ligne par puce / paragraphe / ligne de
tableau / ligne d'arbre des cinq sections réduites :

| Origine (§, lignes à `main`) | Destination (fichier §) | Nature | Preuve | Phrase-clé exacte |
|---|---|---|---|---|

Nature ∈ { déplacé mot pour mot · doublon existant · resté dans `CLAUDE.md` · corrigé d'après le
code } ; Preuve = `fichier:ligne`.

**Protocole de Test**

- **T1** `git diff --stat main` : que des `.md`. Rien sous `src/`, `tests/`, `scripts/`, ni
  `firebase.json`, `vite.config.ts`, `package.json`, `biome.json`, `tsconfig.json`.
- **T2** `git diff -U0 main -- CLAUDE.md` : aucun bloc modifié ne recoupe 21-33, 39-98, 104-120,
  126-226, 232-247, 450-456, 461-472, 521-529 (numérotation `main`).
- **T3** Les 15 titres `##` présents, même ordre.
- **T4** Chaque ligne supprimée couverte par la table ; chaque phrase-clé retrouvée par `rg -F`
  dans sa destination ; chaque « doublon » ouvert à la ligne citée.
- **T5** Chaque renvoi ajouté/modifié mène à un fichier et un titre existants ; liens relatifs
  valides.
- **T6** Zéro résultat : « `CLAUDE.md` § Notes techniques » dans `rules/` ; « annoncé dans
  `CLAUDE.md` » dans la skill audit ; « compactée(s) » dans `agents/` et `orchestrate` ;
  « suffit pour les décisions gravées, les règles » dans `archi-scout`.
- **T7** Phrase canonique dans les 8 briefs ; brief du générateur porte plafond, pointage,
  interdiction de recopier une règle, lecture sur disque, report des constats ; checklist de
  `sec.md` inchangée hors l. 16-17.
- **T8** `.ai` ≤ 150 lignes et ≤ 12 288 octets ; 10 sections + `### Sécurité` ; **aucun** énoncé
  de règle (« `== 1` », « 169, 168, 166 », « supérieur ou égal », « inférieur ou égal », « moins
  de fléchettes ») ; garde les 5 surfaces gravées d'orchestrate, les 13 exceptions (ou la
  justification d'un retrait), les constats encore valides.
- **T9** `CLAUDE.md` ≤ **340 lignes** (ou le plafond fixé par Q1), octets mesurés ; chaque
  section réduite dans son budget.
- **T10** `lint`, `typecheck`, `npm test` verts ; nombre de tests = celui de `PROJECT_PLAN` § 0.

Tout se lit sur disque. `git show`, `wc`, `Get-Item` hors liste d'autorisation : prévoir un
accord, ou `git diff -U0` (autorisé).

**Pas de test automatique de taille** : l'Objectif interdit `tests/`, et un test de taille
pousserait à supprimer du contenu pour passer au vert. À la place : auto-contrôle du plafond dans
le brief du générateur ; une ligne dans `review.md` (si un lot allonge `CLAUDE.md`, chaque ajout
doit être une décision gravée ou un piège vital, sinon constat **Dev**) ; la note d'en-tête de
`CLAUDE.md`.

### 6. En fin de lot

- **`PROJECT_PLAN` § 4** : Débrief + Lot D ; ligne « Fait » du Lot 0 avec les versions (sans
  corriger le « Vitest v3 » du Contenu, plan tel qu'écrit) ; entrée Lot 3 bis ; fragments lots 2
  et 3.
- **`PROJECT_PLAN` § 0** (recommandé) : les 3 lots post-audit + nombre réel de tests (339 selon
  PLAN l. 1394, à confirmer par `npm test`).
- **`PROJECT_PLAN` § 6** : entrée « Décisions du lot « allegement-docs » » — principe (décisions
  et pièges vitaux dans `CLAUDE.md`, manuel dans `CONVENTIONS` / `docs/`, `.ai` = index plafonné),
  constat « `rules/` chargé d'office », pourquoi 200 était impossible (tailles avant/après),
  correction `smoke`, leçon des copies injectées périmées, renvoi vers la table de
  `02-dev-notes.md`.
- **À graver dans `CLAUDE.md`** (une phrase, note l. 16-17) : il ne garde que le résumé
  opérationnel, les décisions gravées et les pièges vitaux ; état, journal et manuel vivent dans
  les fichiers de la table, on y renvoie.
- Régénérer `.ai` (§ 4) ; revérifier sa fraîcheur avant commit si une boucle a retouché une
  source.

## Couches impactées

Aucune couche de code : `core/domain`, `core/application`, `infrastructure`, `ui`,
`composition`, `tests` → —. **Nouveau port ?** Aucun.

| Fichier | Nature du changement |
|---|---|
| `CLAUDE.md` | 5 sections réduites ; en-tête (+1 l., ligne `.ai`, note) ; blocs intacts |
| `docs/DEPLOIEMENT.md` | Création |
| `.claude/CONVENTIONS.md` | § 14 Arborescence ; +1 l. en § 11 et § 12 |
| `docs/PROJECT_PLAN.md` | § 0, § 4, § 6 ; l. 287 (recommandé) |
| `docs/CHARTE_GRAPHIQUE.md` | § Typographie +1 l. |
| `.claude/rules/biome.md`, `rules/typescript.md` | Citation seulement |
| `.claude/agents/architecture-context.md` | Réécriture (§ 3) |
| `.claude/agents/{archi-scout,archi-designer,archi-authority,dev,test,sec,review,intake}.md` | Phrase canonique ; `review.md` + ligne sur la croissance de `CLAUDE.md` |
| `.claude/skills/{orchestrate,refresh-architecture,audit}/SKILL.md` | Prérequis / formulation + plafond / l. 41 (+ l. 44) |
| `.ai/README.md`, `.claude/README.md` | Formulation « index » |
| `.ai/architecture-context.md` | Régénéré par le générateur après Dev |

Si `dev` approche son `maxTurns` : deux passes (destinations, puis briefs).

**Sens des dépendances vérifié :** code inchangé (T1). Doc : les décisions restent en haut
(`CLAUDE.md`), le détail descend (`CONVENTIONS`, `docs/`) ; les destinations ne renvoient à
`CLAUDE.md` que pour les décisions ; les deux renvois circulaires `rules/` ↔ § Notes techniques
sont cassés ; aucune source ne cite `.ai` comme autorité.

## Décisions de `CLAUDE.md` concernées

- **Aucune retouchée** : décisions structurantes, trois blocs de règles, règle d'architecture,
  charte « ce qui ne s'y discute pas » — octet pour octet.
- Renvois internes valides grâce aux titres conservés (P2) et à l'ancre `61b60ac`.
- **À graver** : la note d'en-tête (§ 6). `/refresh-architecture` : oui, pendant le lot.

## Baseline sécurité

Surfaces techniques : **aucune touchée** (import JSON, format persisté, service worker,
`firebase.json`, dépendances, `src/` hors diff — T1).

| # | Risque | Mitigation | Owner |
|---|---|---|---|
| R1 | Perdre une règle de sécurité en la déplaçant (pas de SDK Firebase dans `src/`, en-têtes de cache, réécriture SPA, `vite:preloadError`, `sharp` en devDependency) | Firebase reste dans le bloc intact ; les deux pièges de cache restent dans `CLAUDE.md` et vont en entier dans `DEPLOIEMENT.md` ; checklist `sec.md` ; T4 | Test (mécanique), Sécurité (relecture) |
| R2 | Un brief modifié affaiblit la checklist sécu | Diff de `sec.md` limité aux l. 16-17 (T7) | Sécurité |
| R3 | Le nouvel `.ai` perd sa section Sécurité ou ses renvois (`rules/persistence`, checklist `sec.md`, `DEPLOIEMENT.md`, décisions structurantes) | T8 | Test puis Sécurité |
| R4 | Valider contre une copie injectée périmée | Lecture sur disque et `git diff` imposées | Orchestrator |

Données : `DEPLOIEMENT.md` cite le projet `dartpero` et le compte partagé — déjà versionné,
identifiant public. Pas un constat.

**Résiduels** : taille de `CLAUDE.md` au-dessus de la cible (Q1) ; comportement de Cursor face aux
fichiers injectés non vérifié (sans effet grâce à la lecture sur disque).

### Constats préexistants, hors périmètre (à reporter dans `.ai` § Constats)

- X01 « Best-of N legs (défaut 3) » (l. 216) vs « premier à N » des décisions structurantes.
- `src/ui/hooks/useMatch.ts` cité l. 92 n'existe plus (`useX01.ts`).
- l. 95-96 : `noRestrictedImports` « bannit les API navigateur » — ni `biome.json` ni
  `hexagonalBoundary.test.ts` ne bannissent d'API navigateur, `Date.now` ou `Math.random` ; la
  règle tient par relecture.
- PLAN § 2 oublie `PreviewTourDuMondeVisit`.
- README annonce 318 tests (l. 142, 270).
- De l'ancien `.ai` : « First 9 » (9 fléchettes ou 3 volées) ; entraînement non gravé ; PLAN § 6
  lot 1 périmé ; la charte ne donne que 2 exceptions de couleurs en dur sur 3 ; exposition des
  sets non vérifiée.

## Questions ouvertes

| # | Question | Pour qui | Résolution |
|---|---|---|---|
| 1 | **Bloquante.** « ≈ 200 lignes » impossible sans toucher aux blocs intacts. Accepter **≈ 335 l. / ≈ 20-23 Ko** (plafond Test 340), ou ≈ 305 sans les `---` ? Troisième voie (non recommandée) : déplacer les paragraphes ⚠️ historiques des Décisions structurantes vers PLAN § 6 (≈ −25 l.). Le vrai gain : `.ai` 42 → ≤ 12 Ko, contexte d'un agent de phase ≈ 90 → ≈ 47 Ko (estimé). | Utilisateur | **Tranchée 2026-10-01** : ≈ 335 l., plafond Test **340**, séparateurs conservés |
| 2 | Vérifier `61b60ac` par `git show --stat` avant d'écrire l'ancre ; n'écrire que ce que disent les deux sources. | Dev | — |
| 3 | Chaque « doublon » cité en `fichier:ligne`, jamais sur la foi d'une paraphrase. | Dev | — |
| 4 | Consigner si le générateur a reçu le brief lu sur disque et si le plafond a tenu du premier coup. | Dev / Orchestrator | — |
| 5 | Exécuter T1-T10 ; rapporter les tailles mesurées (lignes, octets) de `CLAUDE.md` et `.ai`. | Test | — |
| 6 | Relire R1 dans ses destinations ; confirmer T1 et le diff `sec.md` limité aux l. 16-17 ; confirmer que `.ai` § Sécurité renvoie aux bonnes sources. | Sécurité | — |

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
