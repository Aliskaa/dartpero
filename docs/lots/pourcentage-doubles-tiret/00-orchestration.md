# Lot `pourcentage-doubles-tiret` — orchestration

## Objectif

Appliquer le helper `pourcent(valeur, joues)` — déjà défini et utilisé pour
`matchWinPercent`/`legWinPercent` dans `src/ui/ecrans/StatistiquesEcran.tsx:28-29` — au
`checkoutPercent`, sur les **deux** écrans qui l'affichent brut aujourd'hui :

- `src/ui/ecrans/StatistiquesEcran.tsx:171-172` (colonne « % doubles » du tableau comparatif
  de carrière, `PlayerCareer`) ;
- `src/ui/ecrans/games/x01/ResumeX01Ecran.tsx:46-47` (ligne « % doubles » de la feuille de
  match, `X01PlayerStats`).

Les deux types portent déjà `doubleAttempts` (`src/core/domain/games/x01/career.ts:36` côté
carrière, `src/core/domain/games/x01/stats.ts:28` côté match) : aucune donnée à faire remonter,
seulement l'affichage à corriger.

**Le défaut** : `checkoutPercent` s'affiche `${Math.round(j.checkoutPercent)} %` sans passer
par `pourcent()`. Un joueur qui n'a jamais eu de double à tenter affiche « 0 % », identique à
« il a tout raté » — exactement la confusion que le projet a déjà tranchée pour les legs et les
matchs (lot « les trois finitions »), jamais étendue au checkout.

**Question de conception pour Archi** : `pourcent()` est aujourd'hui une fonction privée, non
exportée, locale à `StatistiquesEcran.tsx`. Elle doit servir dans un second fichier
(`ResumeX01Ecran.tsx`) — la déplacer vers `src/ui/labels.ts` (aux côtés de `moyenne`,
`nomJoueur`, `pluriel`, qui portent déjà « tout le français » du projet) semble le bon
mouvement plutôt que de la dupliquer, mais c'est à trancher en Architecture, pas ici.

**Hors périmètre :** aucune autre statistique, aucun autre écran. Pas de changement de calcul
de `checkoutPercent`/`doubleAttempts` côté domaine — c'est un défaut d'affichage, la donnée
sous-jacente est déjà correcte.

**Source :** `docs/audits/2026-09-10.md`, lot candidat 2 (« Le % de doubles affiche un tiret
sans tentative »), sévérité moyenne, taille petite.

## Statut

| Phase | Statut | Fichier |
|---|---|---|
| Architecture | Faite | `01-architecture.md` |
| Dev | Faite | `02-dev-notes.md` |
| Test | Faite | `03-plan-de-test.md` |
| Revue | Faite | `04-revue.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite*.
Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| — | — | — | — |

## Journal des décisions

| Date | Décision | Raison |
|---|---|---|
| 2026-09-10 | Lot choisi : candidat 2 de `docs/audits/2026-09-10.md` (« Le % de doubles affiche un tiret sans tentative »), désigné explicitement en argument de `/orchestrate`. Identifiant retenu : `pourcentage-doubles-tiret`. | Demande explicite de l'utilisateur (`/orchestrate @docs/audits/2026-09-10.md 2`) — pas de choix à arbitrer parmi les 7 candidats. |
| 2026-09-10 | Architecture (`archi`, opus/max, défaut) : `pourcent()` déplacée de `StatistiquesEcran.tsx` (privée) vers `src/ui/labels.ts` (exportée), pour servir aux deux écrans. Cas vérifié plus grave que prévu : en `doubleOut: false`, `doubleAttempts` vaut 0 pour tout le monde — la fixture de test existante fait aujourd'hui afficher `0 %` à un joueur qui **a gagné** son leg sur un double. | `labels.ts` porte déjà « tout le français » de l'app (précédent exact : `moyenne`) ; dupliquer la fonction aurait dupliqué la règle, pas juste trois lignes. |
| 2026-09-10 | Gate check Architecture : 4 questions, aucune bloquante. Renommage `joues`→`occasions` laissé à la discrétion de Dev ; le même défaut sur `successPercent` (mode entraînement) confirmé hors périmètre et versé au vivier d'audit ; le tiret doré en partie solo confirmé pré-existant, à ne pas toucher ; relecture à l'écran actée avant le second arrêt (résumé X01 sans double out + écran Statistiques). Statut Architecture → Faite. | Toutes évidentes au vu du rapport `archi` — aucune ne justifiait de solliciter l'utilisateur. |
| 2026-09-10 | Arrêt n°1 (Archi → Dev) validé par l'utilisateur : « Go — lancer Dev ». Phase Dev lancée avec les réglages par défaut (sonnet/medium). | Lot petit, sans règle de jeu ni `core/domain/` touchés — aucun critère de la section « Monter en gamme » de la skill. |
| 2026-09-10 | Dev livré sans écart ni blocage : diff conforme trait pour trait à l'architecture (3 fichiers `src/`, ~10 lignes), lint/typecheck/330 tests verts — revérifié directement par l'Orchestrator, pas seulement pris sur la foi du rapport. Gate check → Dev Faite, phase Test lancée avec les réglages par défaut (sonnet/high). | Aucune question ouverte produite par cette phase. |
| 2026-09-10 | Test a livré 4 cas (tiret / pourcentage / zéro réel, sur les deux écrans) + 1 mutation ciblée sur le cas décisif (« 0 % » vs tiret), qui échoue correctement avant restauration. 334/334 tests verts, aucune régression sur les tests historiques. Revérifié directement par l'Orchestrator : `git diff` (seuls les 2 fichiers de test attendus modifiés), `npm test` relancé indépendamment. Gate check → Test Faite, aucun retour Dev/Archi déclenché. Phase Revue lancée avec les réglages par défaut (opus/max). | Aucune question ouverte produite par cette phase. |
| 2026-09-10 | Revue : **GO**, sans rouvrir Dev/Test/Archi. Revue a rejoué 3 mutations (dont 2 non prévues par le plan de test, une par écran manquant + une sur le helper lui-même), toutes confirmées, arbre restauré et revérifié par hash puis par l'Orchestrator (`git status` après coup). Question 4 d'Architecture (relecture à l'écran) tranchée par Revue elle-même, avec justification mécanisme par mécanisme : jugée non nécessaire (glyphe déjà à l'écran ailleurs dans les mêmes cellules, largeur ne pouvant que se réduire, dorage décidé par des valeurs restées brutes). Trois constats mineurs, tous « Renvoi : Aucun » : `04-revue.md` encore au gabarit au moment de la revue (corrigé par son écriture), et deux ajouts documentaires proposés (`.claude/CONVENTIONS.md` § 9, `docs/PROJECT_PLAN.md` § 6). | Vérifié directement plutôt que pris sur la foi du rapport `review` — la mémoire « un commit par lot, jamais deux mélangés » l'exige. |
| 2026-09-10 | Gravage : ligne ajoutée à `.claude/CONVENTIONS.md` § 9 (le pattern `pourcent(valeur, occasions)`, avec la mise en garde sur les pourcentages de progression qui gardent leur zéro réel) et sous-section ajoutée en fin de `docs/PROJECT_PLAN.md` § 6 (« Décisions du lot « pourcentage-doubles-tiret » »). Rien à graver dans `CLAUDE.md` : confirmé par Archi et par Revue, le lot finit d'appliquer une règle déjà prise, il n'en crée aucune. | Textes proposés par Revue, repris tels quels par l'Orchestrator. |

## Historique des corrections

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| — | — | — | — | — |

Plafond global : 5 tours tous types confondus, puis escalade.
