# Lot `rejouer` — plan de test

> Écrit par l'Orchestrator à partir du rapport de `test` (sonnet / high, passe 1, 2026-10-17).

## Passe 1

### Commandes

L'agent `test` n'a pas eu d'outil d'exécution ; l'Orchestrator a relancé les commandes le
2026-10-17 :

| Commande | Résultat |
|---|---|
| `npm run lint` | OK — 303 fichiers, aucune correction |
| `npm run typecheck` | OK |
| `npx vitest run` | **77 fichiers, 1389 tests verts** |
| `npm run build` | OK (`dist/sw.js` généré) |

### Stratégie

- Use case : `tests/use-cases/rejouer.test.ts`, `fakeServices` + `SettableClock`, vrais use
  cases, aucun mock.
- Module pur UI : `tests/ui/rejouerFiltre.test.ts` (filtre, coupe à 3, libellés).
- Écran : `tests/ui/rejouer.test.tsx`, `<App />` sur `/nouvelle-partie` via `renderWithServices`.
- Déterminisme : horloge fake, bornes locales, changement d'heure du 25/10/2026 (jour de 25 h)
  testé (`rejouerFiltre.test.ts:106-111`).
- Sans objet : domaine, événements, Dexie, `backupSchema`, rejeu à froid (rien de tiré au sort).
- Gardes vérifiées à la lecture : jetons de couleur, pas de `rounded-*` ni `text-craie*/NN`,
  `services.clock` seul, français dans `labels.ts`, câblage `container.ts:127,193`.

### Matrice de couverture

| Exigence | Test | Statut |
|---|---|---|
| 1. 4 / 1 / 2 fois, ordre, « N fois » | `rejouer.test.tsx:102-124` ; `rejouer.test.ts:45-54` | Couvert |
| 2. Ordre, nom, score, variante, sorties | `rejouer.test.ts:56-116` | Couvert |
| 3. Profil supprimé écarté, la 4e remplace | `rejouer.test.tsx:126-140` ; `rejouer.test.ts:157-167` ; `rejouerFiltre.test.ts:70-85` | Couvert |
| 4. ▶ ≥ 2 → Ordre, ordre repris, sans `name` | `rejouer.test.tsx:166-238` ; `rejouer.test.ts:65-71` | Couvert (X01 ; Cricket / Tour du monde : F4) |
| 5. ▶ solo lance directement | `rejouer.test.tsx:254-296` | Partiel (F4) |
| 6. Étape 2 montre les réglages repris | `rejouer.test.tsx:298-311` | Couvert |
| 7. Historique vide | `rejouer.test.tsx:68-100` | Couvert |
| 8. La liste suit lancement / fin | `rejouer.test.tsx:331-348` | Partiel : invalidation manuelle ; chemins existants relus OK |
| 9. Non reproductible écartée | `rejouerFiltre.test.ts:24-68` ; `rejouer.test.tsx:142-152` | Partiel (F2, F3) |
| U1 libellés | `rejouerFiltre.test.ts:168-179` ; `rejouer.test.tsx:183,261,285` | Couvert |
| U2 masqué à 1 | `rejouerFiltre.test.ts:132-137` ; `rejouer.test.tsx:120` | Couvert |
| U3 dates | `rejouerFiltre.test.ts:94-115` | Couvert |
| U4 titres / résumés | `rejouerFiltre.test.ts:117-166` | Couvert |
| U5 phrase d'aide retirée | — | Non couvert (absence, gravité nulle) |
| U6 / D1 chargement | `rejouer.test.tsx:80-100` | Couvert |
| U6 échec solo | `rejouer.test.tsx:313-329` | Couvert |
| D2 rien à rejouer → tuiles | — | Non couvert (F3) |
| T1 fenêtre 50 | `rejouer.test.ts:187-195` | Couvert |
| T4 `ETAT_PARCOURS` | `rejouer.test.tsx:240-252` | Couvert |
| T5 clé React | — | Non couvert (risque faible) |
| T6 4 modes, ordre de `summarize` | `rejouer.test.ts:118-138` | Partiel (ordre multi-joueurs en X01 seul) |

### Relecture du code

Aucun bug d'implémentation : fermeture de `lancer`, nom jamais transmis, ordre repris, compteur
après écart, filtrer puis couper, `ETAT_PARCOURS`, horloge, libellés, 48 px, `aria-label`,
invalidation — OK.

### Constats

| # | Sév. | Constat | Classe |
|---|---|---|---|
| F1 | Moyenne | **Test vert à vide** `rejouer.test.ts:140-155` : la partie dite « terminée » ne l'est pas (301 − 180 = 121) ; exclure les terminées du compteur le laisserait vert | Problème de test |
| F2 | Basse | Clé de groupe élargie (cibles, plage) testée nulle part | Problème de test |
| F3 | Basse | D2 sans test UI ; chemin `existe` (profil supprimé après lecture du cache) testé en unitaire seul | Problème de test |
| F4 | Basse | ▶ ≥ 2 en Cricket / Tour du monde, X01 à 1 joueur, Tour du monde solo non testés | Problème de test |
| F5 | Info | `lignes.length > 0 &&` toujours vrai (`EtapeJeu.tsx:175`) | Dev, cosmétique |
| F6 | Info | Charte § Rejouer : « confirmé vide » au lieu de « aucune configuration rejouable » | Dev, doc |
| F7 | Info | ▶ solo remplace `partie:joueurs` par le seul joueur — conforme à la demande | Aucune action |
| F8 | Info | « N fois » limité à la fenêtre de 50 — risque accepté (T1) | Aucune action |

### Contre-épreuves (par raisonnement)

Casseraient : `courants(mode)` à la place de `valeurs` ; sans `setSaisieNom(proposition)` ; sans
`ETAT_PARCOURS` ; `CLE_REJOUER` hors `['historique']` ; sans filtre `name !== null` ; `playerIds`
non triés ; autre `FENETRE_REJOUER` ; couper avant filtrer ; « 1 fois » affiché. Ne casseraient
pas : F1, F2.

### Angles morts (écran)

Rangée compacte à 360 px (« ENTRAÎNEMENT » ~77 px, **risque principal**) ; pastilles à 4
joueurs, titres longs, alignement de ▶ ; contraste `craie-3` / `laiton-clair` sur `ardoise` dans
les deux thèmes ; ressenti du vide au chargement ; appui involontaire en solo.

### Décision de l'Orchestrator

F1-F6 renvoyés au Dev (boucle 1, tour 1) : l'agent `test` ne modifie pas les sources, et F1 est
un test vert à vide. Test à rejouer ensuite.

## Passe 2 (2026-10-17, après boucle 1 tour 1)

> `test` (sonnet / high), relecture seule ; commandes relancées par l'Orchestrator : lint OK
> (303 fichiers), typecheck OK, `npx vitest run` **77 fichiers / 1397 tests verts**, build OK ;
> `src/core` = les deux fichiers nouveaux du lot, sans résidu de contre-épreuve.

| # | Statut | Preuve |
|---|---|---|
| F1 | Clos | `tests/use-cases/rejouer.test.ts:141-164` : 301 sans double out réellement fini, `finished` vérifié `true` / `false` / `false`, `count === 3` |
| F2 | Clos | `rejouer.test.ts:166-192` (Cricket `[20,19,18]`, entraînement `minTarget: 60`) |
| F3 | Clos | `tests/ui/rejouer.test.tsx:360-389` (D2, chemin `existe`) |
| F4 | Clos | `rejouer.test.tsx:391-485` (Cricket cut-throat ≥ 2, Tour du monde ≥ 2, X01 701 solo, Tour du monde solo) |
| F5 | Clos | `EtapeJeu.tsx:174-190` |
| F6 | Clos | `docs/CHARTE_GRAPHIQUE.md:386-391` |

Contre-épreuves (raisonnement) : F1 (exclure les terminées → 2 ≠ 3), F2 (cibles ou `minTarget`
hors clé → 1 groupe), D2, `existe`, ordre repris en Tour du monde, nom absent — casseraient.

Matrice mise à jour : critères 4, 5, 9, D2, T6 et « toutes comptées » **Couverts**. Restent
partiels / non couverts, risque nul à faible : 8 (invalidation manuelle dans le test, chemins
relus OK), U5 (absence), T5 (clé React).

Nouveaux constats : aucun. F7, F8 : aucune action. Angles morts écran inchangés (passe 1).

**Verdict : Faite.**

## Passe 3 (2026-10-17, après boucle 2 tour 2 — correctifs Sécurité S1, S2)

> `test` (sonnet / high), relecture seule ; Orchestrator : lint, typecheck, build OK,
> **1403 tests** verts.

- **S1** couvert : `rejouerFiltre.test.ts:38-50` (`'oui'`, `'false'`, `doubleIn: 'oui'`,
  absent) ; bout en bout `rejouer.test.tsx:373-392`.
- **S2** couvert : `rejouerFiltre.test.ts:52-58` (4 gardé, 5 écarté).
- **Régression** : aucune partie X01 légitime écartée — `backupSchema` passe par
  `X01Config.create` (`doubleIn ?? false`, `doubleOut ?? true`) ; `doubleIn` existe dans le
  domaine depuis le lot 1 (`8469f55`, vérifié par l'Orchestrator avec `git log -S`).
- Constats : **C1** entraînement importé à 2-4 joueurs passe le filtre ; **C2** pas de bout en
  bout à 5 joueurs ; **nit** `rejouer.ts` importait `MAX_JOUEURS` depuis le hook. → boucle 1,
  tour 3 (`00-orchestration.md`).

## Passe 4 (2026-10-17, après boucle 1 tour 3)

> `test` (sonnet / high), relecture seule ; Orchestrator : lint, typecheck, build OK,
> **1405 tests** verts, `src/core` inchangé.

| # | Statut | Preuve |
|---|---|---|
| C1 | Clos | `src/ui/rejouer.ts:41-45` (`=== JOUEURS_ENTRAINEMENT`) ; `rejouerFiltre.test.ts:93-102` |
| C2 | Clos | `rejouer.test.tsx:394-417` (journal à 5 joueurs → tuiles) |
| Nit | Clos | `rejouer.ts:6` importe de `reglagesPossibles.ts:15-16` |

Hook : `max(mode)` = `JOUEURS_ENTRAINEMENT` (1) en entraînement, `MAX_JOUEURS` (4) sinon
(`useNouvellePartie.ts:181-182`), consommateurs inchangés. Les nouveaux tests casseraient sans le
correctif (raisonnement). Nouveaux constats : aucun.

**Verdict : Faite.**

## Passe 5 (2026-10-17, delta du tour 4, Revue → Dev)

> `test` (sonnet / high), relecture seule ; Orchestrator : lint, typecheck, build OK,
> **1408 tests** verts, aucun résidu de mutation (`Date.UTC` à `labels.ts:1018`, tri `createdAt`
> à `GetReplayableConfigurationsUseCase.ts:63`).

| # | Statut | Preuve |
|---|---|---|
| R1 | Clos | `ReplayableConfiguration`, `REPLAY_WINDOW` (port `:19,35` ; use case `:5,14,51,53,65,80` ; `tests/use-cases/rejouer.test.ts:3,257-263`) ; aucun ancien nom dans `src/` ni `tests/` |
| R5 | Clos | `tests/ui/rejouerFiltre.test.ts:162` |
| R6 | Clos | `rejouerFiltre.test.ts:141-160`, précondition de durée `:149` ; 25 oct. (25 h) et 29 mars (23 h) ; échouerait sous UTC |
| R9 | Clos | `rejouer.test.ts:224-254` (tri et date sur `createdAt`, ordre des joueurs de la partie lancée en dernier) |
| Q3 | Clos | « Solo » dans la rangée seule (`EtapeJeu.tsx:79`, `labels.ts:155`) ; tuiles et lignes gardent « Entraînement » (`rejouer.test.tsx:73-74,167-173` ; `rejouerFiltre.test.ts:213,227`) |
| R12 | Clos | `EtapeJeu.tsx:127` |

Anciens noms restants dans les archives de phase (`01`, `02`, `03`, `06`) : historique, laissé
tel quel (l'Orchestrator régénère `06-echanges.md`). Réserve non bloquante : `lastPlayedAt` porte
la date de lancement (décision Q2) ; la fenêtre de 50 se prend sur `updatedAt` (`listRecent`).
Angles morts : rangée à 360 px (« Solo » réduit le risque), ombre de ▶ désactivé.

**Verdict : Faite.**
