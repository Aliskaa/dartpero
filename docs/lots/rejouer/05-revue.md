# Lot `rejouer` — revue finale

> Écrit par l'Orchestrator à partir du rapport de `review` (opus / max, passe 1, 2026-10-17).
> `review` n'avait pas Bash : diff reconstitué contre le dépôt principal (`main` = `2fa21d5`),
> commandes reprises de l'Orchestrator (lint, typecheck, 1405 tests, build).

## Passe 1 — verdict : NO-GO en l'état (aucun défaut fonctionnel)

Le design tient et le code est correct ; bloquent des écarts de conformité, d'exactitude des docs
et d'hygiène de test.

### Constats

| # | Sév. | Constat | Preuve | Renvoi |
|---|---|---|---|---|
| R1 | Mineur | Le cœur exporte des identifiants français : `ConfigurationRejouable`, `FENETRE_REJOUER` | `ports/driving/GetReplayableConfigurations.ts:19` ; `use-cases/GetReplayableConfigurationsUseCase.ts:14` ; `CONVENTIONS.md:43-48` | Dev |
| R2 | Mineur | `CLAUDE.md` : (a) « entraînement à plusieurs » est un chemin impossible (R7) ; (b) détails non gravables (« masqué à 1 », « booléen mal typé ») déjà dans la charte ; (c) indentation à 2 espaces et ligne de ~170 caractères ; (d) la puce « Parcours… habillage » grave « étape 1 en tuiles 2 × 2 » sans condition | `CLAUDE.md:145`, `:156-165` ; charte `:390` | Dev |
| R3 | Mineur | `CONVENTIONS.md` périmé (#29) : § 14 (23 ports, `GetReplayableConfigurations`, `ui/rejouer.ts`, `EtapeJeu`, `reglagesPossibles.ts`), § 10 (`CLE_REJOUER`), § 9 | `.claude/CONVENTIONS.md:202-203,215-220,399-402,424-431,455,481` | Dev |
| R4 | Mineur | `PROJECT_PLAN.md` : § 6 dit `light`, ne journalise ni S1, ni S2, ni les suites hors lot ; § 2 sans le port ; § 0 sans le lot ; « finir une partie rafraîchit la liste » inexact (rechargement au montage) | `docs/PROJECT_PLAN.md:12-60,255-260,2104-2130` | Dev |
| R5 | Mineur | Titre de test contraire à son assertion (date en avance, pas l'horloge) | `tests/ui/rejouerFiltre.test.ts:147-149` | Dev |
| R6 | Mineur | Test du changement d'heure sans précondition « le jour dure 25 h » (CONVENTIONS § 11) : vert à vide sous UTC | `rejouerFiltre.test.ts:140-145` ; `CONVENTIONS.md:265-269` | Test (écrit par Dev) |
| R7 | Info | C1 était impossible : le domaine refuse un entraînement à plusieurs (`start` lève), `summarize` rend un seul joueur ; la branche `rejouer.ts:44` est défensive et inoffensive. Un tel import fait échouer toute la lecture → tuiles | `checkout-practice/rules.ts:43-45` ; `summarize.ts:66-71` | Aucun (docs : R2) |
| R8 | Info | Pictogramme de la rangée compacte à 24 px au lieu de 28 (planche) ; taille 28 absente de `TaillePictogramme` ; écart non noté | `EtapeJeu.tsx:75` ; `Pictogramme.tsx:38` | Question utilisateur Q1 |
| R9 | Info | « Dernière fois » = date de lancement (`createdAt`), fenêtre sur `updatedAt` ; interprétation jamais posée, non épinglée par un test | `GetReplayableConfigurationsUseCase.ts:63` | Question utilisateur Q2 |
| R10 | Info | Index `.ai` périmé (dit `light`, #30 « à trancher ») | `.ai/architecture-context.md:6,124` | Orchestrator, après R2 |
| R11 | Info | Journal : entrée du relèvement en `high` mal rangée ; « Dev / Test non rejoués » inexact (deux tours Dev et deux passes Test après, en sonnet ; seul `sec` en opus) ; `06-echanges.md` dit `light` | `00-orchestration.md:88-94` | Orchestrator |
| R12 | Info | ▶ en classes ad hoc sans `disabled:shadow-none` ; cast `as ConfigurationRejouable` sans risque ; « Rejouer » absent du glossaire alors que le PLAN appelle encore « Rejouer » l'ancien « On remet ça » | `EtapeJeu.tsx:125` ; PLAN `:730,1881` | Aucun |

### Invariants

Sens des dépendances, aucun import entre modes, jetons seuls, aucune règle de jeu réimplémentée,
aucune valeur persistée renommée, une route par étape, nom jamais repris, `services.clock`, 48 px,
`aria-hidden` : **tenus**. Cœur en anglais sur sa surface exportée : **non** (R1). `CLAUDE.md` à
jour : en partie (R2). Index : périmé (R10).

### Phases

- Dev a livré le design d'Archi ; écarts justifiés, sauf le pictogramme à 24 px (R8). Rendu jamais
  vu à l'écran.
- Test couvre les zones de risque (fermeture, nom, ordre, filtrer puis couper, cache, S1 / S2 de
  bout en bout, chargement, `ETAT_PARCOURS`) ; trous : R6, R7, R9.
- Sécurité : vraie revue, un vrai bug trouvé (S1) ; seule erreur, la prémisse de C1 acceptée.
- **Toutes les questions de phase sont closes par écrit.**
- Ne pas rejouer Architecture au passage en `high` : **défendable** (seule surface gravée = ajout
  d'une puce ; aucun code de surface gravée) ; la montée en gamme n'a touché que `sec` (Q4).

### Dettes

- #29 : non acceptable, corrigée par R3.
- `backupSchema` sans contrôle de type de `doubleOut` / `doubleIn` : hors lot, acceptable ; à
  inscrire au PLAN et faire acquitter (Q5). « On remet ça » recopie la config telle quelle
  (`RestartMatchUseCase.ts:46-52`).

### Conditions avant commit

1. Boucle 5 (Revue → Dev, tour 4 / 5) sur R1-R5 et la précondition R6 ; puis Test et Sécurité au
   delta, puis Revue au delta.
2. Index régénéré après R2 ; `06-echanges.md` régénéré.
3. Relecture à l'écran par l'utilisateur (« ENTRAÎNEMENT » à ~73 px utiles à 360 px en priorité).

### Questions pour l'utilisateur

Q1 pictogramme 24 ou 28 px ; Q2 date de lancement ou de dernière partie jouée ; Q3 repli si
« ENTRAÎNEMENT » déborde ; Q4 acceptation de la montée en gamme partielle ; Q5 lot `high` pour
`backupSchema` et les journaux importés non projetables.

**Réponses (utilisateur, 2026-10-17)** : Q1 24 px gardé ; Q2 date de lancement ; Q3 « Solo »
dans la rangée compacte ; Q4 acceptée et signée ; Q5 à proposer en fin de lot.

## Passe 2 (delta du tour 4) — verdict : GO

> `review` (opus / max) ; diff reconstitué contre `main` (`2fa21d5`) ; commandes reprises de
> l'Orchestrator (1408 tests = 1340 + 68, compte vérifié). Rendu jamais vu à l'écran.

### Constats de la passe 1

R1, R2, R3, R4, R5, R6, R8, R9, R11, R12 et Q3 : **clos**, preuves sur disque (`CLAUDE.md:145-146,
157-164` ; CONVENTIONS § 9, 10, 14 — 24 ports driving exact ; PLAN § 0, 2, 4, 6 ;
`rejouerFiltre.test.ts:141-162` ; `rejouer.test.ts:224-254` ; `EtapeJeu.tsx:79,127` ;
`glossary.md:26` ; charte `:416-418`). Invariants tenus, cœur en anglais sur sa surface exportée.

### Constats restants

| # | Sév. | Constat | Renvoi |
|---|---|---|---|
| N1 | Mineur | Rejouer non protégé contre un 5e mode : `rejouer.test.ts:119-139` recopie les 4 modes au lieu de `GAME_MODE_IDS` ; `switch` sans `default` `never` (`useNouvellePartie.ts:327-362`, `labels.ts:1079-1090`) ; cast `as ReplayableConfiguration` ; CONVENTIONS § 13 sans paragraphe « rejouer ». Effet nul aujourd'hui | Aucun dans ce lot : dette assumée (le dernier tour de boucle n'est pas justifié ; un futur mode passe en `high` par `archi-authority`) |
| N2 | Info | Imprécisions de docs : `CLAUDE.md:160` « use case » au lieu de « port » ; charte « les trois » (au plus trois) ; CONVENTIONS `:220` « les deux » pour trois clés ; ordre au PLAN § 0 ; PLAN § 6 `:2137` attribuait l'entraînement à plusieurs à S2 (c'est C1) ; lignes longues ; `│` manquant au § 14 ; JSDoc de `LIBELLE_MODE_COURT` ; nom `lastPlayedAt` | Aucun |
| N3 | Info | PLAN `:737`, `:1888` : « Rejouer » y désigne l'ancien « On remet ça » ; le glossaire lève l'ambiguïté | Aucun |

**Corrigés par l'Orchestrator après la passe 2** (documentation seule) : `CLAUDE.md:160`
« use case » → « port » ; PLAN § 6 : l'entraînement à plusieurs rattaché à C1 (branche
défensive), plus à S2.

### Conditions avant commit

1. Index `.ai` régénéré (dit `high`, ferme #29 / #30) ; `06-echanges.md` régénéré ;
   `00-orchestration.md` à jour.
2. Relecture à l'écran par l'utilisateur, ou report **accepté** et écrit au PLAN § 0.
3. Proposer Q5 et N1 (lot `high` à part, ou prochain audit).
4. Commit après accord sur `lot/rejouer`, fichiers non suivis indexés nommément ; fusion
   `--ff-only` = second accord ; rebase du second lot à fusionner avec accord.
