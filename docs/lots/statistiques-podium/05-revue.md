# Lot `statistiques-podium` — revue

> Agent `review` (opus, effort du frontmatter : max), 2026-10-15. Sans shell : lecture de chaque
> fichier du `git status`, comparaison avec `main` pour les fichiers que le lot parallèle ne touche
> pas ; commandes reprises du dernier passage de l'Orchestrator (lint 282 fichiers, typecheck,
> 70 fichiers / 1187 tests, build).

**Verdict : GO sous réserve.** Aucun bug d'implémentation ni défaut de design. Réserve : T19 et la
question 3 de `sec` ouvertes sans acceptation écrite de l'utilisateur — sans elle, **NO-GO**.

## Résumé

Écran Statistiques en « podium, cible en tête » (onglets, `PlateauImpacts` + 4 cases, 4 cartes :
`CartePodium`, `BasculesPodium`, `ClassementPodium`, `CompteBatons`) ; logique pure
`ui/podium.ts` ; clé `statistiques:joueur` écrite à l'appui ; Révision 1 (N premiers, « Tout
voir », `Modale` `<dialog>` fermée au retour par `useModaleAuRetour`) ; politique (clause, date
15 octobre 2026) ; charte, CONVENTIONS § 9 / § 14, `rules/frontend-react.md`. Design et Révision 1
tenus ; planche suivie aux arrondis U10 près ; seul écart non documenté : « 100+ » centré quand
les bâtons passent sur deux lignes (signalé par le Dev).

## Constats

| # | Sévérité | Constat | Renvoi |
|---|---|---|---|
| 1 | **Bloquant tant que non accepté** | T19 (retour réel Chrome Android, Firefox / Samsung, iPhone en onglet, PWA iPhone) et Q3 de `sec` ouvertes sans acceptation écrite | Utilisateur |
| 2 | Mineur | Q3 de `sec` analysée : `history.state` restauré sans entrée dessous → `navigate(-1)` sans effet, `enVol` reste `true` (`useModaleAuRetour.ts:63-67`) ; ✕, Échap, voile sans effet jusqu'à relance. Peu probable (historique d'onglet restauré en entier ; PWA relancée sur `start_url`) ; repli à prévoir si T19 le reproduit | T19 ; Dev si reproduit |
| 3 | Mineur | Ruban d'onglets qui défile (6-7 joueurs en portrait) : l'onglet actif n'est pas ramené dans la vue (`StatistiquesEcran.tsx:224-258`) ; joueur mémorisé en fin de ruban → nom invisible | Utilisateur (choix produit) |
| 4 | Mineur | Justification d'U6 périmée : Victoires a « / j » sur chaque ligne (R1-Q7), Manche garde « fl. » sur la grande ligne seule — reconduit par R1 (« inchangé ») sans choix explicite | Signaler |
| 5 | Mineur | Consignes qualitatives traduites en chiffres par un agent : taille du modal (16 px, `max-w-lg`, `90dvh`, Orchestrator) ; 18 px entre joueurs de Grosses volées dans le modal (Dev) ; bordure `craie/25` de « Tout voir » ; « 100+ » centré | Relecture à l'écran |
| 6 | Mineur (doc) | Note d'écart U4 de la charte (`CHARTE_GRAPHIQUE.md:329-333`) omet le titre `laiton` de la `Modale` | Docs fin de lot |
| 7 | Info | Commentaire périmé `CarteImpacts.tsx:16-18` (« tableau des moyennes ») | — |
| 8 | Info | `00-orchestration.md` : lignes vides dans l'historique des corrections, tour 2 « En cours » ; QO-1 consignée dans `00` seulement | Orchestrator |
| 9 | Info | Lignes très longues `rules/frontend-react.md:16`, `CONVENTIONS.md:183` | — |
| 10 | Info | Ouverts non bloquants : N2 ; TM-7, TM-8 ; TM-b ; T12 relu avec « 2 / 4 », pas « 100 / 120 » | — |

## Clôture des questions

| Questions | Closes par | Où |
|---|---|---|
| Non bloquantes 1-2 de la demande | Archi | `01` |
| U0 | Orchestrator | `01` |
| U1-U10, gate Dev 1-3 | Utilisateur | `01`, `02` |
| « Joueur seul à 0 » | Orchestrator, puis Q1 de l'utilisateur | `00`, `03` |
| T1-T5, T10-T14 | Dev | `02` |
| T6-T7, T15-T16 | Test | `03` |
| T8, T17, Q1 de `sec` | Sec, Orchestrator | `04` |
| Q1-Q3, R1-Q1 à Q9, Q-A, précisions R1-Q5 | Utilisateur | `03`, `01` |
| Q-B, QO-2 | Orchestrator | `02`, `03` |
| QO-1 | Utilisateur | `00` |
| **T9, T18, Q2 de `sec`** | Orchestrator au rebase | ouvertes par construction |
| **T19, Q3 de `sec`** | Utilisateur (appareil) | **ouvertes, sans acceptation** |

Aucun point produit tranché contre l'utilisateur ; traductions d'agents listées aux constats 4, 5.

## Invariants

| Invariant | OK ? |
|---|---|
| Sens des dépendances | OK (types / constantes d'`application`, fonctions pures du domaine ; core / infra / composition intacts) |
| Couleur en dur, `rounded-*`, `text-craie*/NN`, halo, dégradé | OK (Grep vide) |
| Règle de jeu réimplémentée | OK |
| Valeur persistée renommée | OK (aucune ; nouvelle clé commentée ⚠️) |
| Politique | OK (clause et date testées) |
| `labels.ts`, plancher, lazy, 48 px | OK hors écarts acceptés U4, Q3 |
| Sec a parcouru le diff | OK |
| `CLAUDE.md` | OK, rien à graver (convention dans CONVENTIONS § 9) |
| Index régénéré | À faire après le rebase |

## Points non résolus après le lot

T19 et Q3 de `sec` ; angles morts d'appareil (`::backdrop` et propriétés personnalisées avant
Chrome 122 / Safari 17.4 / Firefox 120 ; iOS : `fieldset` flex, ruban, défilement sous le modal,
`dvh`) ; relecture à l'écran (U4 en clair, cartes et modal ; constats 3-5 ; T12 « 100 / 120 » ;
police au maximum) ; dette `DialogueNouveauJoueur` (aucun autre `<dialog>` sur `main`) ;
constat 10.

## À faire par l'Orchestrator avant commit

1. Décision de l'utilisateur sur la réserve ; lui signaler les constats 3, 4, 5.
2. Date de la politique le jour du commit.
3. Commit sur la branche (accord), `git rebase main` (accord) : deux apports gardés dans
   `labels.ts`, charte, CONVENTIONS, étude ; T9 date la plus récente et phrase relue contre T8 ;
   T18 ; index de `main` puis `/refresh-architecture` ; lint, typecheck, vitest, build, Grep
   d'encodage ; `--amend` puis `--ff-only`, chacun avec accord.
4. Pour l'index : clé `statistiques:joueur` ; constat n° 21 étendu aux titres du podium et du
   modal ; T19 et relecture du lot 8 en décisions ouvertes ; dette `DialogueNouveauJoueur` ;
   CONVENTIONS § 9 ; `ui/podium.ts`.
5. Docs : PROJECT_PLAN § 0, § 4 (« Fait — 1187 tests »), § 6 ; étude (lot 8 donné `light`,
   `:165` ; « manches en ligne de détail », `:237`) ; constats 6 et 8 ; `06-echanges.md`.
6. `CLAUDE.md` : rien.

## Décision de l'utilisateur sur la réserve

2026-10-15, réponses de l'utilisateur :
- **Réserve** : T19 et Q3 de `sec` **acceptées comme vérification après le lot**, sur son
  téléphone (au plus tard au prochain déploiement) ; consignées en décision ouverte dans
  PROJECT_PLAN § 0 ; un correctif suivra si le modal coince.
- **Constat 3** : **corrigé dans ce lot** (onglet actif ramené dans la vue) → boucle 5 (Revue →
  Dev), tour 4.
- **Constat 4** : « fl. » **reste sur la grande ligne seule** (choix explicite).
- **Constat 5** : valeurs **validées**, sous réserve de la relecture à l'écran.
- Constats 6 et 7 (docs, commentaire) traités avec le tour 4 ; constat 8 corrigé par
  l'Orchestrator.

## Revue rejouée après le tour 4 (2026-10-15) et clôture

> Agent `review` (opus / max), delta seulement, sans shell.

**GO sous réserve** : constat 3 corrigé comme choisi (ruban seul, ouverture / appui testés,
Chrome : page immobile) ; constats 6, 7, 8 corrigés ; nouveau **constat 11** (mineur) :
recadrage au changement de période sans test — mutation `[actif, joueurs]` → `[actif]` confirmée
par l'Orchestrator (88 tests verts). Infos : 12 (`relative` sur le ruban : soulignement `laiton`
au-dessus du filet, à voir à l'écran), 13 (CONVENTIONS § 14), 14 (pas de recadrage à la rotation
ou police agrandie, à observer en T19).

**Utilisateur** : fermer le constat 11 par un dernier tour (tour 5). Fait : test ajouté,
contre-épreuve 1 échec (rejouée par l'Orchestrator), constat 13 traité, date de la politique au
16 octobre 2026.

**Verdict final : GO** — plus aucune question ouverte sans résolution écrite (T19 et Q3 de `sec`
acceptées après le lot ; T9, T18, Q2 de `sec` au rebase).