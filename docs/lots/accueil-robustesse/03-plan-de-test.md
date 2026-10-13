# Lot `accueil-robustesse` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test`.

## Passe 2 — GO (après boucle 1, tour 1)

Dev n'a modifié que `tests/ui/accueilPartiesRecentes.test.tsx` (aucun changement de `src/` ni
de `tests/fakes/`).

| # | Statut | Justification (Test) |
|---|---|---|
| T1 | Corrigé | « une partie en cours seule, vieille de plus de 7 jours » : exige « Reprendre », ni libellé vide ni lien. Contre-épreuve Dev : retrait de `(enCours ? 1 : 0)` → 12 tests rouges dont T1. |
| T2 | Corrigé | Trois tests « seule la lecture de la partie en cours / de l’historique / des joueurs échoue », isolés par `clientAmorce([...])` (`setQueryData` + `staleTime` infini) sur `CLE_MATCH_EN_COURS`, `[...CLE_HISTORIQUE, 'accueil']`, `CLE_JOUEURS` — clés et types amorcés conformes à `AccueilEcran.tsx`. Contre-épreuve Dev : chaque clause retirée ne rougit que son test. |
| T3 | Corrigé | « seuls les joueurs sont en chargement » (`DepotJoueursLent`) ; contre-épreuve Dev : retrait de `joueurs.isPending` → ce test seul rouge. Pas de fuite (promesse sans minuterie, `QueryClient` neuf par test). |
| O1 | Corrigé | Intitulé « 31 parties dans la journée (30 ou plus) ». |

Aucun mock (`vi.fn`, `vi.mock`, `vi.spyOn` absents). Nouvelle observation non bloquante :
**O7** — l'isolation de T2/T3 dépend d'une copie en dur de la clé `['historique', 'accueil']` ;
si l'écran change cette clé, les tests resteraient verts sans être isolés (le commentaire du test
annonce ce couplage). O2, O3, O4, O6 restent des observations sans action.

### Résultats (vérifiés par l'Orchestrator)

| Commande | Résultat |
|---|---|
| `npm run lint` | OK, 246 fichiers, aucun correctif |
| `npm run typecheck` | OK |
| `npx vitest run` | 51 fichiers, 778 tests verts (61 dans `accueilPartiesRecentes.test.tsx`) |

Le sous-agent `test` n'avait pas de shell : il n'a pas relancé la suite ni rejoué les
contre-épreuves de Dev ; il juge sur relecture.

### Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Relecture à l'écran (`01-architecture.md` Q3) | Utilisateur, arrêt de fin de lot |

---

## Passe 1 — renvoi Dev (tests seulement)

### Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Non | Le lot ne touche pas le domaine. |
| Use cases | Non | Aucun use case ni port modifié. |
| Infrastructure | Non | Aucun format persisté, aucun `backupSchema`. |
| UI | Oui | `tests/ui/accueilPartiesRecentes.test.tsx`, fakes injectés par `fakeServices` ; pannes par sous-classes de fakes, sans mock. |
| Architecture (gardes) | Non | Pas de nouvelle garde : seule classe de couleur ajoutée, `text-laiton`, déjà employée. |

**Hors périmètre :** domaine, use cases, infrastructure — rien n'y bouge.
**Angles morts assumés :** rendu de `MessageErreur` et du libellé d'erreur (long) en portrait /
paysage, thèmes sombre / clair, empilement « semaine calme » (libellé, lien, « Créer un
joueur »), hauteur 48 px du lien, absence de saut entre `Skeleton` et liste ; annonce réelle du
`<output>` par un lecteur d'écran (O6). À relire par l'utilisateur en fin de lot.

### Couverture du plan de `01-architecture.md`

| # | Cas | Test | Jugement |
|---|---|---|---|
| 1 | Panne du dépôt des parties | l. 589-604 | Vérifie la règle |
| 1 bis | Panne des joueurs « seuls » | l. 606-617 | **Faible (T2)** : fait aussi échouer `historique` |
| 2 | Jamais joué, pas de lien | l. 633-641 | Vérifie la règle, garde d'absence falsifiable |
| 3 | Semaine calme + lien `/historique` | l. 643-655 | Vérifie la règle |
| 4 | Récente + ancienne, lien | l. 657-670 | Vérifie la règle |
| 5 | Plafond ; tout visible sans lien | l. 672-692 | Vérifie la règle ; exactement 30 couvert de fait (O1) |
| 6 | Chargement annoncé (`status`) | l. 619-631 | Vérifie la règle |
| 7 | « Créer un joueur » sans « → » | l. 694-701 | Vérifie la règle, falsifiable |

### Résolution des questions de `02-dev-notes.md`

- **Q1 (contre-épreuves)** — close, par raisonnement sur le code : les gardes d'absence (tout
  visible ; jamais joué) et le test de la flèche échoueraient si l'on cassait ce qu'ils
  protègent ; l'échec observé par Dev sur « Créer un joueur » venait de son script.
- **Q2 (combinaisons d'erreur)** — close côté code : `enErreur` est testé avant `chargement`,
  une seule alerte ; test manquant → T2.
- **Q3 (`<output className="block">`)** — close côté code : item flex blockifié, hauteur du
  `Skeleton`, `sr-only` absolu hors `gap` ; impact probable nul. Écran à l'utilisateur.

### Bugs trouvés

| # | Bug | Classement | Renvoi |
|---|---|---|---|
| T1 | Le terme `(enCours ? 1 : 0)` de `affichees` (`AccueilEcran.tsx:160`) n'est protégé par aucun test : une partie en cours seule et vieille de plus de 7 jours tomberait en « semaine calme » sans que rien ne rougisse. Code correct. | Problème de test (manquant) | Dev |
| T2 | Les clauses de `enErreur` ne sont pas isolées : `DepotPartiesEnPanne` fait échouer `encours` et `historique` ; la panne « joueurs seuls » fait aussi échouer `historique` (`GetMatchHistory` → `players.listAll()`). Supprimer une clause laisse tout vert ; intitulé « seule » faux. | Problème de test (faible) | Dev |
| T3 | La clause `joueurs.isPending` de `chargement` n'est pas testée seule. | Problème de test (faible, bas) | Dev |

Observations non bloquantes : O1 intitulé « 31 parties » (l'écran en reçoit 30) ; O2 semaine
calme sans profil → deux liens, non testé ; O3 partie datée du futur comptée dans `total` ;
O4 `refetch` en échec remplace la liste par l'alerte ; O5 libellés conformes au glossaire,
apostrophes typographiques, aucun accent cassé ; O6 `<output>` rempli au montage.

### Résultats

Le sous-agent `test` n'avait pas de shell dans cette passe : commandes non exécutées par lui.
Chiffres de Dev (`02-dev-notes.md`), à revérifier en passe 2.

| Commande | Résultat |
|---|---|
| `npx vitest run` | 774 verts (d'après Dev) |

### Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Relecture à l'écran (`01-architecture.md` Q3) | Utilisateur, fin de lot |
