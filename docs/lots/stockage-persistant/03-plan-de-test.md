# Lot `stockage-persistant` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high, réglages du
> frontmatter). Verdict : **PASS, aucun bug d'implémentation.**

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Non | Non touché. |
| Use cases / port | Indirectement | `NullPersistentStorage` (deux lignes) n'a pas de test direct. L'état `unavailable` est exercé via le fake. |
| Infrastructure | Oui | `NavigatorPersistentStorage.test.ts` : 13 tests sur un faux `StorageManager` à compteurs, sans mock. |
| UI | Oui | `stockagePersistant.test.tsx` : 11 tests (`renderWithServices`, requêtes par rôle, `FakePersistentStorage`, `userEvent`). |
| Architecture (gardes) | Oui | `hexagonalBoundary`, `themeBoundary`, `lazyRoutes` : 13 tests verts. |

**Hors périmètre :**
- Le comportement réel de Chrome, Safari iOS et Firefox : il ne se vérifie pas sous jsdom
  (`request.md` § Risques).
- Les migrations, le journal et les sauvegardes : le lot ne touche ni Dexie, ni `MatchEvent`,
  ni `backupSchema`, donc les cas bust, rejeu, égalité et vieille sauvegarde sont sans objet.

**Angles morts assumés :**
- La relecture à l'écran : portrait, paysage, thèmes sombre et clair.
- Le contraste de `craie/75` sur `ardoise`, et celui de `vert-cible` en clair.
- Le retour à la ligne du rappel d'exporter.
- La hauteur réelle du bouton : `min-h-12` est lu dans le code, pas mesuré.
- Le comportement réel sur appareil.

**Méthode** : les mutations et les tests exploratoires ont tourné sur une copie du dépôt dans
le scratchpad. Aucun fichier du dépôt n'a été modifié.

## Cas de test

| # | Cas | Type | Résultat |
|---|---|---|---|
| 1a | Critère 1 : pas de demande quand la base est déjà protégée (`requestCalls` = 0) | chemin heureux | PASS |
| 1b | Critère 1 : une seule demande quand elle ne l'est pas | chemin heureux | PASS |
| 1c | Critère 1 : une seule demande sous StrictMode (monté au-dessus des providers) | bord | PASS |
| 2a | Critère 2 : `persisted()` rejette ou lève → `not-persisted` | bord | PASS |
| 2b | Critère 2 : `persist()` rejette ou lève → `not-persisted` | bord | PASS |
| 2c | Critère 2 : API absente sous 4 formes → `unavailable` | bord | PASS |
| 2d | Critère 2 : le rendu n'attend pas une `request()` qui ne répond jamais | bord | PASS (test faible, G2) |
| 3 | Critère 3 : Réglages, un test par état (libellé, rappel, bouton présent ou absent) | chemin heureux | PASS |
| 4a | Critère 4 : « Redemander » met l'état à jour sans recharger | chemin heureux | PASS |
| 4b | Critère 4 : un refus à la redemande garde « non protégé » et le bouton | bord | PASS |
| 5 | Critère 5 : `navigator.storage` absent de `src/` hors de l'adapter | garde | Vérifié par `grep`, sans garde automatique (G1) |
| 6 | Critère 6 : lint, typecheck, tests, build, gardes | — | PASS |
| 7 | Rien n'est rendu tant que `status()` n'a pas répondu | bord | PASS |
| 8 | Aucune ligne d'état hors des Réglages au démarrage | bord (absence) | PASS |
| 9 | `status()` ne déclenche jamais `persist()` | bord | PASS |

**Exploratoires, hors dépôt, tous verts :**
- Adapter par défaut sous jsdom → `unavailable`, ce qui laisse sans effet les autres tests
  qui passent par `createBrowserServices`.
- Intégration de `App` avec le vrai adapter défaillant : l'app s'affiche, `persist()` est
  appelé une fois, et l'état « non protégé » s'affiche avec son bouton.
- Intégration avec l'API absente : « non prise en charge », sans bouton.
- Démontage pendant le chargement : aucun `console.error`.

**Mutations :** 12 mutations sur 13 font échouer au moins un test (hook retiré ou doublé,
demande inconditionnelle, `useRef` supprimé, `catch` ou garde de l'adapter altéré, retour de
`redemander` ignoré, bouton ou rappel déplacé, garde `null`). La seule qui survit est la
suppression du drapeau `actif` (B4).

## Résultats

| Commande | Résultat |
|---|---|
| `npm test` | 35 fichiers, **363 tests** verts |
| `npm run lint` | 205 fichiers, aucune correction |
| `npm run typecheck` | OK |
| `npm run build` | OK : SW, 47 entrées de précache |

## Bugs trouvés

Aucun bug d'implémentation. Il reste des constats non bloquants :

| # | Constat | Classement | Renvoi |
|---|---|---|---|
| B1 | Un double clic sur « Redemander » appelle `persist()` deux fois : le bouton n'est pas désactivé pendant la demande. | Observation : aucun critère ne l'exige, et l'appel est idempotent côté navigateur | Aucun (voir Q1) |
| B2 | Au démarrage, `request()` est appelé aussi quand l'état est `unavailable`. | Observation : sans effet (aucun appel navigateur), conforme à `!== 'persisted'` | Aucun |
| B3 | Si l'on ouvre les Réglages pendant la demande du démarrage, la ligne affiche « non protégé » sans se mettre à jour ensuite. | Observation : fenêtre de quelques ms, et « Redemander » règle le cas | Aucun |
| B4 | Aucun test ne couvre le drapeau `actif` (la mutation survit). | Problème de test mineur : React 19 ne signale plus un `setState` après démontage | Aucun |
| B5 | Un port qui violerait son contrat (rejet) laisserait une promesse non gérée. | Observation : l'adapter réel ne rejette jamais, et c'est couvert | Aucun |

Lacunes de couverture optionnelles :
- **G1** : aucune garde automatique pour le critère 5 (voir Q2).
- **G2** : le test « n'attend pas » est faible par nature.
- **G3** : pas de test d'intégration avec l'adapter réel dans le dépôt. Les deux niveaux le
  couvrent ensemble.

## Questions ouvertes

| # | Question | Pour qui | Résolution |
|---|---|---|---|
| 1 | Désactiver « Redemander » pendant la demande (B1) ? | Utilisateur / Dev | **Close (tranchée par l'Orchestrator)** : non. `persist()` est idempotent, aucun critère ne l'exige, et la réponse est locale et quasi instantanée. Ce serait de l'état en plus pour rien. |
| 2 | Ajouter une garde d'architecture « `navigator.storage` seulement dans l'adapter » (G1) ? | Orchestrator | **Close (tranchée par l'Orchestrator)** : non, dans ce lot. La garde du projet porte sur les **imports** (`hexagonalBoundary`), et une garde par motif d'API navigateur serait une nouvelle famille de garde, hors périmètre. Le critère 5 est vérifié par `grep` dans ce plan. Si le besoin devient général (`navigator.*` dans l'UI), ce sera un lot à part. |
| 3 | Libellés, relecture à l'écran, vérification sur Android (PWA installée) et iPhone | Utilisateur | **Close pour le pipeline** : rattachée à l'arrêt de fin de lot (`01-architecture.md` Q1-Q4). |

## Rejeu — boucle 2, tour 1

> Rapport du sous-agent `test` (sonnet / high). Il vérifie la correction du constat sécurité 1.

| # | Cas | Résultat |
|---|---|---|
| R1 | Le libellé `persisted` est assorti d'une réserve (« …ne les effacera pas de lui-même. ») | OK |
| R2 | Le rappel `persisted` n'est plus nul (« Ce n’est pas une sauvegarde : exportez pour garder une copie. ») : il y a désormais un rappel dans les trois états | OK |
| R3 | Le rappel est rendu dans l'`<output aria-label="Protection des données">`, et « Redemander » reste réservé à `not-persisted` | OK |
| R4 | Le test de l'état protégé exige la présence de la réserve et l'absence de bouton. Il peut échouer : la mutation `persisted: null` fait échouer 1 test sur 11 (mutation faite par Dev, assertion relue ici) | OK |
| R5 | Les 10 autres tests du fichier sont intacts, et « redemande accordée » reste compatible avec le nouveau libellé | OK |
| R6 | États `not-persisted` / `unavailable` inchangés | OK |

| Commande | Résultat |
|---|---|
| `npm test` | 35 fichiers, **363 tests** verts |
| `npm run lint` | 205 fichiers, aucune correction |
| `npm run typecheck` | OK |

**Bugs** : aucun.

**Observations :**
- Le rappel ajoute une ligne en état `persisted`. Le retour à la ligne et le contraste sont à
  voir à l'écran : cet angle mort est rattaché à l'arrêt de fin de lot.
- Le `<span className="block">` du rappel n'est précédé d'aucune espace textuelle, si bien que
  le `textContent` se lit « …lui-même.Ce n’est… ». L'écran n'en montre rien. La même
  construction existait déjà pour les deux autres états avant la boucle. **Close (tranchée par
  l'Orchestrator)** : ce n'est pas un défaut dans ce lot, car un élément en `display: block`
  est annoncé séparément par les lecteurs d'écran. À revoir seulement si une relecture avec
  lecteur d'écran montre le contraire.

## Rejeu — boucle 5, tour 2

> Rapport du sous-agent `test` (sonnet / high). Il vérifie les corrections des constats n° 1,
> 2 et 4 de `05-revue.md` v1.

| # | Cas | Résultat |
|---|---|---|
| S1 | Les trois états affichent le libellé **et** le rappel dans l'`<output>`, rendus sans condition (tests l. 88-96, 99-105, 108-114) | OK |
| S2 | « Redemander » reste réservé à `not-persisted`, y compris après un refus. Rien n'est rendu avant la réponse de `status()` | OK |
| S3 | Le texte accessible n'est plus collé : `{' '}` entre le libellé et le `<span className="block">` | OK |
| S4 | `Record<StorageProtection, string>` : un `null` ou une clé manquante échoue à la compilation, et typecheck est vert (raisonnement sur le type) | OK |
| S5 | Aucune régression | OK |

| Commande | Résultat |
|---|---|
| `npm test` | 35 fichiers, **363 tests** verts |
| `npm run lint` | 205 fichiers, aucune correction |
| `npm run typecheck` | OK |

**Bugs** : aucun.

**Angle mort (non bloquant)** : aucun test ne vérifie l'espace entre le libellé et le rappel,
car `toHaveTextContent` normalise les espaces. Retirer le `{' '}` laisserait la suite verte.
Cela reste chez Test, sans correctif demandé. Le rendu visuel est à vérifier à l'écran.

**Questions ouvertes** : aucune.

## Rejeu — boucle 5, tour 3 (retour après un refus de « Redemander »)

> Rapport du sous-agent `test` (sonnet / high).

| # | Cas | Résultat |
|---|---|---|
| V1 | Pas de message sans action de l'utilisateur, même après un refus au démarrage (test 1 : échouerait si `refusee` partait à `true`) | OK |
| V2 | Message présent après un refus, dans l'`<output>` de rôle `status`, avec le rappel d'exporter toujours là (test 2) | OK |
| V3 | Message conservé au second refus, bouton toujours présent (test 2) | OK |
| V4 | Message retiré quand la redemande est accordée (test 3) | OK |
| V5 | Pas de régression : 3 états, rappel dans chacun, Q5 (rien rendu pendant le chargement), démarrage unique y compris sous StrictMode | OK |
| V6 | Refus, puis départ et retour sur Réglages : le message est absent par construction (état local perdu au démontage). Couvert indirectement seulement | OK |

| Commande | Résultat |
|---|---|
| `npm test` | 35 fichiers, **366 tests** verts |
| `npm run lint` | 205 fichiers, aucune correction |
| `npm run typecheck` | OK |

**Bugs** : 0 bug d'implémentation, 0 problème de test.

**Qualité des tests** :
- Le test 3 remplace `stockage.request` à chaud. C'est acceptable : le même procédé sert déjà
  pour `status`, et `accorde` est `private readonly` dans le fake.
- La condition `etat === 'not-persisted'` du JSX n'a pas de test dédié (cas `request()` →
  `unavailable`). Aucune spécification ne le demande.

**Angle mort** : la mise en page du message (contraste de `text-craie`, retour à la ligne,
thèmes, orientations) et l'annonce réelle par un lecteur d'écran ne se vérifient pas sous
jsdom.

**Questions ouvertes :**

| # | Question | Pour qui | Résolution |
|---|---|---|---|
| 1 | La phrase « Il accepte en général une fois Dartpéro installé sur l'écran d'accueil » est-elle vraie ? | Orchestrator / Utilisateur | **Close (tranchée par l'Orchestrator)** : la formule est volontairement prudente (« en général »). Elle s'appuie sur ce que `docs/DEPLOIEMENT.md` § Stockage persistant documente déjà : Chrome accorde selon l'engagement, dont l'installation, et une PWA installée sur iOS échappe à la purge des 7 jours. Le comportement sur iPhone reste à vérifier sur appareil, comme déjà prévu. L'utilisateur valide le libellé à la relecture de fin de lot. |
