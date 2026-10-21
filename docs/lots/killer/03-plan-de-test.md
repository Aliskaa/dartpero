# Lot `killer` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (opus, effort high d'après son frontmatter,
> 1 lancement, sans shell, rapport rendu dans le plafond). Lint, typecheck, `npx vitest run` (101 fichiers,
> 1912 tests), build et contrôle d'accents relancés par l'Orchestrator. **Verdict : GO avec réserves.**

## Stratégie

| Niveau | Fichiers | Ce qui est vérifié |
|---|---|---|
| Domaine | `tests/domain/killer/{rules,ranking,config}.test.ts`, `playerGender.test.ts` | Règles 4 à 12 des deux côtés ; validations de `start` ; projection et annulation ; propriété de préfixe (9³ × 2 départs) ; couture `modeOf` / `GameModes` |
| Use cases (fakes, `fakeServices`, `CyclingRandomSource`) | `playKiller`, `previewKillerVisit`, `drawKillerNumbers`, `backup`, `managePlayers`, `rejouer`, suites `it.each(GAME_MODE_IDS)` | Lancement, tirage écrit, annulation, relance, sauvegarde |
| Infrastructure | `dexieRepositories.test.ts` (`fake-indexeddb`) | Ligne brute sans `gender`, écriture, retour à « non précisé » qui retire la clé |
| UI | `killerEcran`, `killerParcours`, `genreProfil`, `accordKiller`, `killerCartes`, `voleePartielle`, `confidentialite` | `DepotCompteur` (rien d'écrit avant validation), `Announcer` enregistreur, rechargement |
| Architecture | `genreBoundary`, `lazyRoutes`, `pictogrammesBoundary`, `hexagonalBoundary` | Voir le problème de test n° 1 |

**Angles morts assumés (rendu, relecture sur téléphone obligatoire)** : numéro à 38 / 32 px lu à 2-3 m, 6 lignes en
paysage, 5 carrés de vie dans la colonne VIES, classes fractionnaires `min-h-10.75` / `min-h-22.5` non prouvées
générées, troncature des effets, « Non précisé » sur deux lignes à 360 px, contraste de `rouge-touche` sur
`--repere` (calcul, pas écran), rangée à 5 colonnes.

## Règles du jeu : le code face à la spécification

`test` a relu `request.md` (règles 1 à 14), puis `rules.ts`, puis les tests. **Toutes les règles sont
conformes** (R1 : 2 à 6 joueurs ; R2 : numéros 1-20 distincts, bulle exclue ; R3 : 3 ou 5 vies ; R4 : double
seulement, fléchettes suivantes comptées tout de suite ; R5 : barème 1 / 2 / 3, plancher à 0, non-killer sans
effet ; R7 : `MISS`, bulle, non attribué, éliminé inertes, éliminé sauté ; R6 / R12 : propre numéro,
variante, auto-élimination qui arrête la volée, adversaire gagnant sans nul ; R8 : victoire, volée arrêtée ;
R9 : classement par ordre d'élimination ; R14 : « Éliminé par »), chacune testée des deux côtés avec renvois
`rules.test.ts:NN` (voir le rapport de `test` pour les lignes).

**Cas limites non testés** (aucun ne cache un bug à la lecture) : variante désactivée avec le **triple** de son
numéro (seuls S et D testés, `rules.test.ts:231`) ; variante activée : plancher sur soi (T8 avec 1 ou 2 vies) et
auto-élimination par un simple ou un double ; deux éliminations dans la même volée suivies d'une annulation
(use case, UI) ; annulation à travers une **auto-élimination** (use case et UI) ; `startingPlayerIndex ≠ 0`
combiné à une élimination.

## Critères d'acceptation 1 à 24

Couverts : 1 à 15 et 18 à 24 (avec les réserves ci-dessous). **Non couverts par nature** : 16 (texte de
`reglesKiller` : relecture de l'utilisateur) et 17 (rendu : angle mort). Réserves : critère 12 sans
l'auto-élimination ; critère 13 sans le T « off » ni le plancher sur soi ; **critère 14** : aucun test ne
vérifie que « Corriger » et « Annuler » ne disent rien (`dites` non vérifié à `killerEcran.test.tsx:181` et
`:348`) ; critère 2 : le refus d'un numéro pris par `choisirNumero` n'est testé que par l'absence du bouton ;
critère 24 : la date reste une relecture.

Fakes et préconditions : aucun mock ; préconditions positives présentes (`killerEcran:104`, `rules.test:466`,
`genreBoundary:68,74,83`).

## Cas de bord de `01-architecture.md`

Testés : annulation à travers killer, élimination et fléchette gagnante (domaine, use case, UI) ; aperçu =
préfixe de la volée enregistrée (propriété exhaustive, `previewKillerVisit:50`) ; brouillon et rechargement avec
killer, sortie en attente au rechargement ; unicité des numéros (ajout, retrait, réordre, 6 parmi 20, « Tirer au
sort » ×3) ; coupe écrite de la sélection ; Rejouer (nouveau tirage, variante, Ordre, nom non repris) ; genre
(clé absente sur lignes brutes, export / import, valeur invalide ignorée et comptée) ; politique (date et
mentions) ; import d'un journal Killer incohérent (12 ouvertures invalides, volée après la fin, `RoundStarted`).
**Non testés** : annulation à travers une auto-élimination ; retrait puis ré-ajout d'un joueur dont l'ancien
numéro a été pris entre-temps (collision de `completer`, `useNouvellePartie.ts:302-321`, correct à la lecture) ;
profil supprimé dans un Killer de bout en bout (seulement au niveau `labels`, `accordKiller:41,47`) ; les
cartes disent « 0 vie » (`genreBoundary` interdit le genre dans `cartesPartie`), cohérent avec R1.2.

## Mutations à faire à la main (passage `dev`)

Chaque ligne : mutation puis test qui doit passer au rouge. `rules.ts:247` `=== 'DOUBLE'` → `!== 'SINGLE'`
(`rules.test:37`) ; `:189` statut killer après la boucle (`rules.test:52`, propriété de préfixe,
`killerEcran:108`) ; `:261` `Math.min` retiré (`rules.test:102`) ; `:242` `|| proprietaire.eliminated` retiré
(`rules.test:175`) ; `:255` garde non-killer retirée (`rules.test:75`, `killerEcran:117`) ; `:251` condition
`selfHitCostsLives` inversée (`rules.test:231`, `:239`) ; `:205` arrêt sur éliminé retiré (`rules.test:255`) ;
`:202` `break` du vainqueur retiré (`rules.test:192`, `playKiller:102`) ; `:220` `nextAlive` → `(index+1) % n`
(`rules.test:167,313`) ; `:344` `.reverse()` retiré (`ranking.test:10`) ; `:178` `by: cible.playerId`
(`rules.test:154`, `killerEcran:177`) ; `backupSchema.ts:264` `GameModes.project` retiré (`backup:327`) ; `:242`
genre invalide converti en `undefined` (`backup:394`) ; `RestartMatchUseCase` `numbers: ouverture.numbers`
(`playKiller:187`) ; `useNouvellePartie.ts:237` écriture de `couperSelection` retirée (`killerParcours:262`) ;
`useKiller.ts:132` `prochainJoueur` toujours passé (`killerEcran:172,239`) ; `labels.accordElimine` toujours
masculin (`accordKiller`, `killerEcran:227,244`) ; **témoin du trou de garde** : un `import` de `../x01/...`
dans `killer/rules.ts` doit faire échouer `hexagonalBoundary` (aujourd'hui il reste vert).

## Comblement des trous et mutations (passage `dev` après Test, 2026-10-21)

`dev` (opus, 134 appels d'outils, rapport rendu, **rien refusé par le harnais**). Orchestrator : lint, typecheck
propres, **101 fichiers, 1929 tests verts** (1912 avant), build OK, accents RAS.

- **Problème de test 1** : `hexagonalBoundary.test.ts` lit maintenant les vrais dossiers (`readdirSync`) avec
  plancher de 5 modes et présence de `killer`. **Second trou découvert** : l'ancienne garde comparait des chaînes
  (`specifier.includes('games/x01')`), donc un import relatif `../x01/rules` ne contenant pas `games/x01` passait
  même avec `killer` dans la liste ; corrigé par `cibleDe` / `dansDossier` (résolution du chemin réel).
  Témoin : un `import type {} from '../x01/rules'` ajouté dans `killer/rules.ts` fait échouer la garde (retiré
  ensuite). Aucune violation préexistante dans les autres modes.
- **Problème 2** : `rejouer.test.ts` : `ECARTES`, table `LANCER: Record<GameModeId, …>`, `it.each(GAME_MODE_IDS)`
  (« rejouable, ou écarté explicitement ») ; `src/ui/rejouer.ts` `maxJoueurs` : `default` typé `never`.
- **Problème 3** : commentaire de `playKiller.test.ts` corrigé. **Problème 4** : critère 14 : `dites` vide après
  Corriger et après Annuler (avec témoin : la volée suivante est dite une fois). **Problème 5** : triple de son
  numéro sans variante, plancher sur soi (`it.each([1, 2])`), auto-élimination par un simple ou un double, deux
  éliminations dans la même volée puis annulation, `startingPlayerIndex: 2` avec une élimination, annulation à
  travers une auto-élimination (use case et UI), collision de `completer` au ré-ajout, profil supprimé de bout
  en bout (« Éliminé » masculin, « Éliminé par Joueur supprimé »).
- **Constat C1 de Sécurité** : `labels.ts` : « vos profils (pseudos, couleurs, dates de création et genres
  choisis) et vos parties » ; `confidentialite.test.tsx` suit ; la date reste « 21 octobre 2026 ».
- **Mutations** (Edit, test, Edit inverse, hash comparés à des copies : aucun résidu) : **18 sur 19 rouges** comme
  attendu (règles, `backupSchema`, `RestartMatchUseCase`, `couperSelection`, `accordElimine`, témoin
  `hexagonalBoundary`, et `completer` sans `!pris.has`). **Une reste verte : `useKiller.ts:132`**
  (`prochainJoueur` toujours passé) : **mutant équivalent** (`tourDeTable.ts:31` renvoie déjà `null` quand
  `state.finished`, la branche `gagnee ? null : …` est redondante). Pour information : l'intitulé
  « un killer retire au %s %i vie(s) » s'affiche « NaN vie(s) » (cosmétique, antérieur, non touché).

## Résultats

| Commande | Résultat |
|---|---|
| `npm run lint` | 359 fichiers, propre (Orchestrator) |
| `npm run typecheck` | propre (Orchestrator) |
| `npx vitest run` | 101 fichiers, **1912 tests verts** (Orchestrator) |
| `npm run build` | passe (Orchestrator) |
| Grep `Ã|Â|�` | RAS (« BÂTONS » légitime) |

## Bugs trouvés

| # | Bug | Classement | Renvoi |
|---|---|---|---|
| — | **Aucun bug d'implémentation.** Failles de design : aucune | — | — |
| 1 | **La garde « un mode n'importe jamais un autre mode » est verte à vide pour le Killer** : `hexagonalBoundary.test.ts:94` et `:113` ont `const MODES = ['x01', 'tour-du-monde']` en dur (ni `killer`, ni `cricket`, ni `checkout-practice`) ; trou antérieur au lot, noté « non vérifié » par l'architecte ; vérifié à la main : aucune violation aujourd'hui. Correctif recommandé dans ce lot : lire `readdirSync(core/domain/games)` et `ui/composants` (hors `commun`), plancher ≥ 5 modes | Problème de test | Test (dev, tests seuls) |
| 2 | `tests/use-cases/rejouer.test.ts` sans garde `it.each(GAME_MODE_IDS)` (constat #31) ; la demande disait de l'ajouter | Problème de test | Test |
| 3 | `playKiller.test.ts:205` : commentaire « jamais les numéros d'avant » faux (un tirage peut retomber sur les mêmes numéros, l'assertion ne vaut que pour `CyclingRandomSource`) | Problème de test | Test |
| 4 | Critère 14 : aucun test que « Corriger » et « Annuler » ne disent rien | Problème de test | Test |
| 5 | Cas limites et de bord non testés listés ci-dessus | Problème de test | Test |

Résiduels : `src/ui/rejouer.ts:25-34` `maxJoueurs` a un `default → MAX_JOUEURS` au lieu d'un `never` (un sixième
mode à 5 joueurs ou plus serait écarté en silence ; mineur, owner Dev) ; projection de tous les modes à l'import
(constat #11) : pas vérifié s'il existe d'anciens exports du « mode rapide » que `X01Rules.project` ne
rejouerait plus (`sec`, Revue) ; le « −N » de la dernière volée enregistrée reste affiché sur les lignes pendant
le tour suivant (`KillerEcran.tsx:99,196`), probablement voulu par la planche, à confirmer à l'écran.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| Q1 | **Import d'une volée non tronquée** : un journal contenant des fléchettes après la fléchette gagnante ou après l'auto-élimination est accepté en silence, le rejeu tronque (`sec` : observation sans risque). Faut-il la refuser comme incohérente ? La spécification ne dit rien | Utilisateur ou `sec` |
| Q2 | **Import d'un Killer dont les `playerIds` ne sont pas des profils du fichier** : accepté, affiché « Joueur supprimé » ; même comportement que les autres modes ? Non vérifié | Revue |
| Q3 | Texte de `reglesKiller`, consigne à 0 joueur, libellés `aria` écrits par `dev` | Utilisateur (critère 16) |
