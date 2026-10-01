# Lot `stockage-persistant` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (opus / max, réglages du
> frontmatter).

## Version 1 — passage initial

### Résumé

Le diff livre le design de `01-architecture.md`, et chaque écart y est justifié.

- **Port** `PersistentStorage`, sans aucun import, avec `NullPersistentStorage`.
- **Adapter** `NavigatorPersistentStorage` : c'est le seul lecteur de `navigator.storage`. Il
  reçoit un `StorageManager` injectable et place chaque appel sous `try/catch`.
- **Câblage** : `Devices.persistentStorage`, dans `container.ts` seulement.
- **Démarrage** : le hook de démarrage est monté dans `App.tsx:52`. La promesse n'est pas
  attendue et un `useRef` garantit un appel unique.
- **Réglages** : un `<output aria-label>` affiche l'état. « Redemander » apparaît seulement
  en `not-persisted`, et le rappel d'exporter dans les trois états.
- **Tests** : 24 nouveaux.
- **Docs** : mises à jour, puce ajoutée dans `CLAUDE.md`, index régénéré.

La Revue a relancé elle-même les contrôles : `biome check` passe sur 205 fichiers,
`tsc --noEmit` passe, et `vitest` donne **363** tests verts. Les phases ont tenu leur rôle :
- Dev a justifié ses 3 écarts.
- Test a couvert les zones de risque (12 mutations tuées sur 13).
- Sec a lu le diff réel : ses `fichier:ligne` sont conformes, et son constat était juste.

### Constats

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| 1 | mineur | Le lot laisse faux l'arbre de référence. `CONVENTIONS.md:277-278` (`ports/driven/`) ne liste pas `PersistentStorage`, `:291-293` (`hooks/`) ne liste pas `useStockagePersistant`, et `rules/frontend-react.md:13` a le même trou. C'est le constat n° 8 de l'index régénéré. À corriger dans ce lot, puis `/refresh-architecture`. | **Dev** |
| 2 | info | `PROJECT_PLAN.md` § 6 : l'entrée « stockage-persistant » (l. 1450) est placée **avant** « allegement-docs » (l. 1482), alors que le journal est chronologique. | Aucun (même tour doc que le n° 1) |
| 3 | info | `NullPersistentStorage` n'a aucun consommateur, ni dans `src/` ni dans `tests/`. Ce n'est pas un écart de Dev : l'intake et Archi l'ont demandé. | Aucun |
| 4 | info | `RAPPEL_EXPORT_STOCKAGE: Record<StorageProtection, string \| null>` permet encore de violer la décision gravée « rappel dans les trois états ». Avec `Record<…, string>`, TypeScript la ferait respecter. | Aucun |
| 5 | info | `.claude/agents/sec.md:77-79` dit encore « Permissions navigateur : Wake Lock et vibration seulement ». Or `persist()` correspond à la permission `persistent-storage`, que Firefox affiche en invite. La mise à jour revient à l'utilisateur. | Aucun |
| 6 | info | Sous Firefox, `persist()` attend la réponse à l'invite. Les justifications « quasi instantanée » et « quelques ms » (01 Q5, 03 Q1, 03 B3) sont donc fausses. Les décisions tiennent quand même : on sous-promet, au pire une seconde invite. | Aucun |
| 7 | info | `00-orchestration.md` ne trace pas l'arrêt obligatoire Architecture → Dev. | Aucun |
| 8 | info | « Aucune surface gravée » n'est vrai que pour les surfaces 1 à 4 : le lot **ajoute** une décision à `CLAUDE.md` (5e surface). Partir du scout reste défendable, puisque la raison de la montée en gamme ne s'applique pas ici. | Aucun |
| 9 | info | L'index fait 13 265 octets mesuré en LF. Avec `core.autocrlf=true` et sans `.gitattributes`, le checkout l'écrit en CRLF : environ 13 419 octets, au-dessus du plafond. À traiter au prochain `/refresh-architecture`. | Aucun |

### Clôture des questions 01 à 04

- Toutes les questions ont une résolution écrite.
- Les clôtures de l'Orchestrator sont légitimes (`orchestrate` § Gate check, point 3) : aucune
  ne contredit la demande validée ni une décision gravée. Il y a deux réserves :
  - la raison invoquée pour Firefox (n° 6) ;
  - l'argument « lecteur d'écran » du rejeu Test, une généralisation non vérifiée, alors qu'un
    `{' '}` ne coûtait rien.
- Libellés, rendu et appareil sont rattachés à l'arrêt de fin de lot, comme le prévoit
  `request.md`.

### Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) | OK |
| Aucun mode de jeu n'en importe un autre | OK (domaine non touché) |
| Aucune couleur en dur dans `src/ui`, aucun `rounded-*` | OK : `themeBoundary` vert, tokens dans des paires existantes, rien sous `craie/60` |
| Aucune règle de jeu réimplémentée dans l'UI | OK |
| Aucune valeur persistée renommée | OK |
| Sec a parcouru le diff (pas seulement les notes) | OK (réserve n° 5) |
| `CLAUDE.md` à jour des décisions durables du lot | OK : la puce est juste et concise, chaque affirmation vérifiée contre le code |
| `.ai/architecture-context.md` régénéré si une décision a été gravée | OK, **à régénérer de nouveau après le n° 1** |

### Go / no-go

**Verdict :** **no-go**, pour le seul constat n° 1.

**Justification :** le code est conforme et vérifié. Mais le n° 1 est une dérive créée par ce
lot, triviale à corriger. Committer en l'état figerait un arbre de référence faux et un index
qui porte un constat né du lot. La correction passe par la boucle 5 (Revue → Dev, de la doc
seulement), puis `/refresh-architecture` (qui traite aussi le n° 9), puis un rejeu de Test,
Sécurité et Revue.

### Points non résolus après le lot

- **Relecture à l'écran** : portrait et paysage, sombre et clair, contrastes, retour à la ligne
  du rappel, hauteur du bouton, et « Redemander » placé près de « Restaurer ».
- **Validation des libellés par l'utilisateur**, y compris la règle « rappel dans les trois
  états ». Elle vient de la boucle sécu et non de l'utilisateur, alors qu'elle est maintenant
  gravée.
- **Vérification sur appareil** :
  - Android, PWA installée : « protégé » attendu ;
  - Chrome dans un onglet : refus attendu ;
  - iPhone.
- **Un « Redemander » refusé ne donne aucun retour visible.** Le remède naturel relève du lot
  `installation-guidee`.
- **Invariant gravé sans garde** : « seul l'adapter lit `navigator.storage` ».
- **Faiblesses de test assumées** : G2, G3, B4.
- **Statuts à mettre à jour au commit** : `PROJECT_PLAN.md` l. 20 et la feuille de route.
- **`.claude/agents/sec.md`** (n° 5) : la mise à jour est à décider par l'utilisateur.
- **Nettoyages optionnels** : n° 3, n° 4.

## Version 2 — rejeu après boucle 5, tour 2

> Rapport du sous-agent `review` (opus / max). La Revue a relancé elle-même lint, typecheck et
> `npm test` (**363** tests verts).

### Clôture des constats v1

| n° | État | Preuve |
|---|---|---|
| 1 | **Clos** | `CONVENTIONS.md:277-279` et `:292-295` ; `rules/frontend-react.md:13`. L'en-tête `:248-249` (20 / 10 / 7 / 4 / 4) a été recompté par `ls`. |
| 2 | **Clos** | PLAN § 6 : « allegement-docs » l. 1450, puis « stockage-persistant » l. 1485 |
| 4 | **Clos** | `Record<StorageProtection, string>` avec `strict: true`, rendu sans condition, trois tests |
| 7 | **Clos** | Journal `00-orchestration.md`. La trace de session confirme que « oui lance Dev » est arrivé après l'écriture de `01` et avant le lancement de `dev`. |
| 9 | **Clos** | Index : 150 l., 13 045 o. en LF et 13 195 o. en CRLF, sous le plafond. Il est plus récent que toutes ses sources. |
| 3, 5, 6, 8 | Inchangés | Info, sans renvoi |

### Jugement sur les points soumis

**Correction du compteur de CONVENTIONS § 14 par l'Orchestrator** : acceptée, sans boucle.
- Sur le fond, c'est légitime : un chiffre exact, sans choix à faire, vérifié avant et après,
  journalisé et contrôlé par ce rejeu.
- Sur la forme, c'est hors de la lettre de la skill : CONVENTIONS revient à Dev par la
  boucle 5.
- Limite : à réserver à une correction mécanique, sans choix à faire.

**Deux `/refresh-architecture`** : légitimes. Le second est justifié par la correction du
compteur.

**Désaccord Sec / Revue sur Firefox** : clos, sans boucle 6.
- Le RAS de Sec est étayé.
- Sa phrase « pas d'invite Firefox » est fausse, mais ne porte aucune conclusion.
- L'arbitrage de l'Orchestrator, consigné dans `04` et au journal, retient la bonne version.

### Constats nouveaux

| # | Sévérité | Constat | Renvoi |
|---|---|---|---|
| 10 | info | L'en-tête de § 14 dit « Vérifié au lot stockage-persistant », mais l'arbre omet toujours `ui/providers/` et `hooks/tourDeTable.ts` (omissions antérieures au lot) | Aucun |
| 11 | info | La phrase de Sec v3 sur Firefox est fausse et sans effet. Cause probable : `sec.md:77` ne connaît pas `persistent-storage` (voir le n° 5) | Aucun |
| 12 | info | Le premier refresh de l'index et le rejeu de Test sont partis en parallèle, alors que Test reçoit l'index en entrée. Sans effet ici, puisque S1-S5 portent sur le code | Aucun |
| 13 | info | `docs/captures/reglages.png` (`README.md:100`) ne montre pas la nouvelle ligne d'état | Aucun : à décider à l'arrêt de fin de lot |
| 14 | info | Aucun test ne couvre le `{' '}` (normalisation des espaces). L'épingler serait fragile | Aucun |
| 15 | info | `useStockagePersistant.ts:3` fait un import relatif, contraire à CONVENTIONS § 8, mais comme les six autres hooks. C'est la doc qui est en retard, et ce retard précède le lot | Aucun |

### Invariants revérifiés

Tous sont OK : sens des dépendances, seul l'adapter lit `navigator.storage` (par `grep`),
domaine non touché, aucune couleur en dur ni `rounded-*`, aucun format persisté touché, routes
lazy, décision « rappel dans les trois états » imposée par le compilateur et par trois tests,
`CLAUDE.md` à jour, index régénéré après sa dernière source. Aucun fichier hors lot, et
`request.md` est identique à sa source (`cmp`).

### Go / no-go

**Verdict :** **GO** (phase Revue).

**Justification :**
- n° 1 est clos, ainsi que n° 2, 4, 7 et 9 ;
- aucune régression ni dérive nouvelle ;
- contrôles verts ;
- Sec a lu le delta réel ;
- les nouveaux constats sont tous de l'information.

Le go de fin de lot (étape 8) reste à l'utilisateur.

### Points non résolus après le lot (mis à jour)

- **Libellés validés par l'utilisateur**, et **explicitement** la règle gravée « rappel dans
  les trois états » : l'intake ne prévoyait pas de rappel pour l'état « protégé ».
- **Relecture à l'écran** : portrait et paysage, sombre et clair, contraste `craie/75` sur
  `vert-cible/12`, retour à la ligne, hauteur du bouton, « Redemander » à côté des boutons
  d'export et de restauration.
- **Appareil** :
  - Android, PWA installée : « protégé » attendu ;
  - onglet Chrome : refus attendu ;
  - iPhone.
- **Capture `reglages.png`** : à refaire, ou dérive assumée (n° 13).
- **« Redemander » refusé** : aucun retour visible. Le remède relève du lot
  `installation-guidee`.
- **Invariant gravé sans garde automatique** : « seul l'adapter lit `navigator.storage` ».
- **Faiblesses de test assumées** : G2, G3, B4, et le n° 14.
- **`.claude/agents/sec.md:77`** : ajouter `persistent-storage`. Décision de l'utilisateur
  (n° 5, 11).
- **Nettoyage optionnel** : n° 3.
- **Dette doc antérieure au lot** : n° 10, n° 15.

## Version 3 — rejeu après boucle 5, tour 3 (retour après un refus de « Redemander »)

> Rapport du sous-agent `review` (opus / max). La Revue a relancé elle-même lint, typecheck et
> `npm test` (**366** tests verts). Elle a relu les traces de session du tour 3 et exécuté deux
> mutations sur une copie hors dépôt.

### Résumé du rejeu

Le delta est petit et respecte le design.
- **Hook** : `refusee` est un état local d'UI, écrit seulement par `redemander`. Ni nouveau
  port, ni changement de contrat ou de câblage.
- **Écran** : le message apparaît dans le même `<output>`, sous le rappel d'exporter.
- **Reste du delta** : 3 tests, et la doc.

Les traces confirment les contrôles déclarés par Dev, Test et Sec, et un enchaînement
séquentiel (le n° 12 ne s'est pas reproduit).

### Jugement sur les points soumis

**Delta conforme au design.** Aucune Révision de `01` n'est due.

**Clôture de Q1 : légitime.** La phrase est prudente et cohérente avec `DEPLOIEMENT` pour
Chrome. Trois réserves :
- l'argument iOS prouve qu'installer protège, pas que Safari accepte `persist()` ;
- la phrase vise à côté pour une app déjà installée mais refusée, ou sous Firefox, sans pour
  autant tromper sur la sauvegarde ;
- la validation par l'utilisateur **reste à obtenir** (n° 18).

**Compteurs mis à jour à la main par l'Orchestrator : acceptés.** C'est la deuxième correction
de doc à la main dans ce lot ; la cause est dans le brief `dev` (n° 19).

**`CLAUDE.md` : la puce dit toujours vrai**, point par point. Il ne fallait pas l'allonger.

### Constats nouveaux

| # | Sévérité | Constat | Renvoi |
|---|---|---|---|
| 16 | info | `ReglagesEcran.tsx:125-126` : pas de `{' '}` entre le rappel et le message de refus, d'où un `textContent` concaténé, sans effet visible. Aligner tient en un caractère, mais ce serait un changement de code après le plafond de la boucle 5 : la décision revient à l'utilisateur | Aucun |
| 17 | info | Le message est masqué après un accord par deux mécanismes redondants (remise à `false` et garde `etat`). Ce sont des mutants équivalents, et le cas `unavailable` après `not-persisted` est inatteignable. Comportement protégé | Aucun |
| 18 | info | `00-orchestration.md` disait « validée par l'utilisateur à la relecture », ce qui se lit comme déjà acquis. La phrase livrée n'a jamais été montrée à l'utilisateur : l'exemple de l'option A était différent. À écrire « à valider » | Aucun (Orchestrator) |
| 19 | info | Workflow : (a) l'étape 8 d'`orchestrate` ne dit pas où router une modification demandée à l'arrêt de fin de lot, et l'utilisateur n'a pas su que ce tour épuisait le plafond de la boucle 5 ; (b) `dev.md` ne parle pas des compteurs de tests de PLAN | Aucun (utilisateur) |

Les constats antérieurs restent inchangés : n° 3, 5, 6, 8, 10, 11, 13, 14 et 15, tous de
l'information.

### Invariants revérifiés

Tous sont OK :
- sens des dépendances ;
- seul l'adapter lit `navigator.storage` ;
- surfaces gravées non touchées ;
- aucune couleur en dur ni `rounded-*` ;
- `labels.ts`, `<output aria-label>` et `aria-hidden` respectés ;
- « rappel dans les trois états » ;
- « rien au démarrage » ;
- routes lazy ;
- `CLAUDE.md` à jour ;
- index régénéré après sa dernière source (13 256 o. en CRLF) ;
- aucun fichier hors lot.

**Plafonds** : boucle 5 à 2/2, total à 3/5.

### Go / no-go

**Verdict :** **GO** (phase Revue).

**Justification :** delta conforme, contrôles verts, couverture des zones de risque, Sec sur
le diff réel, aucune question ouverte sans résolution. Toute nouvelle modification de code
demandée à l'arrêt serait une **escalade**, pas une boucle automatique.

### Points non résolus après le lot

- **Validation par l'utilisateur** :
  - la phrase livrée ;
  - les autres libellés ;
  - la règle gravée « rappel dans les trois états ».
- **Relecture à l'écran** :
  - la nouvelle ligne en `text-craie`, plus vive que le `craie/75` ;
  - les contrastes ;
  - la hauteur et le voisinage du bouton ;
  - un second refus ne change rien à l'écran.
- **Appareil** :
  - Android, PWA installée ;
  - onglet Chrome : refus, puis message ;
  - iPhone.
- **Choix encore ouverts** : capture `reglages.png` (n° 13), `sec.md:77` (n° 5, 11), statuts
  au commit, workflow (n° 19), nettoyages (n° 3, 16).
- **Dette doc antérieure au lot** : n° 10, 15.
