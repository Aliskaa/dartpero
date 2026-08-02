# Dartpéro — Plan détaillé

Plan de construction, lot par lot. Le résumé opérationnel et les décisions gravées vivent
dans [../CLAUDE.md](../CLAUDE.md) — **ce document ne le contredit jamais**.

Principe de travail : **un lot à la fois**, chacun se termine par un livrable vérifiable
(tests verts ou écran utilisable). On ne démarre pas le lot N+1 tant que le lot N n'est pas
validé.

---

## 1. Modèle de domaine

Tout ce qui suit est **pur** : aucun import de React, Dexie, ni API navigateur. Pas de
`Date.now()` ni de `Math.random()` (→ ports `Clock` / `IdGenerator`).

### 1.1 Value objects

| Type | Contenu | Invariants (factory validante) |
| --- | --- | --- |
| `Segment` | `1..20 \| 'BULL'` | Rien d'autre n'existe sur une cible. |
| `Multiplier` | `SIMPLE \| DOUBLE \| TRIPLE` | — |
| `Dart` | `{ segment, multiplier }` → `points` | **Triple sur BULL interdit.** `SIMPLE BULL` = 25, `DOUBLE BULL` = 50. `isDouble` vrai pour tout double **y compris** le bull 50. |
| `Score` | entier ≥ 0 | Rejette les négatifs. |
| `MatchId` / `PlayerId` / `LegId` | branded types | Générés par `IdGenerator`. |

Cas particulier : la **fléchette hors cible** (« manqué ») est un `Dart` à 0 point —
modélisée explicitement, car elle compte dans la moyenne et dans les tentatives de double.

### 1.2 Entités

- **`Visit`** — 1 à 3 `Dart`, l'identité du lanceur, un statut (`SCORED` | `BUSTED` |
  `CHECKOUT`). Une visite s'arrête avant 3 fléchettes si checkout ou bust.
- **`Leg`** — la suite des visites, le score de départ, l'ordre des joueurs, le vainqueur.
- **`Set`** — un groupe de legs (optionnel selon la config).
- **`Match`** — la configuration + la liste d'événements + les joueurs.
- **`Player`** — profil **local** : pseudo, couleur, date de création.

### 1.3 Événements (le cœur du choix d'architecture)

Le match **est** une liste d'événements ; l'état affiché en est la **projection**.

**Le journal ne contient que des faits bruts** — décision prise au lot 1 :

```
MatchStarted   { config, playerIds[], startingPlayerIndex }
VisitRecorded  { darts[] }
```

Tout le reste est **déduit** et exposé en `MatchMilestone`, jamais persisté :

```
LegWon         { playerId, legNumber, dartsUsed }
SetWon         { playerId, setNumber }
MatchFinished  { winnerId }
```

Deux conséquences volontaires :
- annuler, c'est `project(events.slice(0, -1))` — rien d'autre. Si le journal contenait
  aussi les conséquences, il faudrait retirer « la dernière volée **et** ce qu'elle a
  déclenché », soit précisément la classe de bug qu'on cherche à éliminer ;
- `VisitRecorded` **ne porte pas de `playerId`** : à qui est le tour se déduit de la
  projection, donc le journal ne peut pas contredire les règles.

Bénéfices directs :
- **Undo** = retirer le dernier `VisitRecorded` et rejouer la projection. Aucun état à
  « défaire » à la main, donc aucun bug de restauration de score.
- **Reprise** d'une partie interrompue : on persiste les événements, on rejoue.
- **Rejouabilité** pour les tests : un scénario = un tableau d'événements.

### 1.4 Services purs

| Service | Rôle |
| --- | --- |
| `x01Rules.applyVisit(state, darts)` | Applique une volée : décompte, détecte **bust** (reste < 0, reste == 1, reste == 0 sans double) et **checkout**. |
| `x01Rules.projectMatch(events)` | Rejoue les événements → état courant (scores restants, joueur actif, legs/sets gagnés). |
| `checkout.suggest(reste, dartsRestantes)` | Chemin conseillé. Retourne **« pas de finish »** sur les bogey numbers **169, 168, 166, 165, 163, 162, 159** et au-dessus de 170. |
| `matchStats.compute(events)` | Moyenne 3 fléchettes, first 9, % doubles, 180/140+/100+/60+, meilleur leg, plus haut checkout. |
| `gameModes/` | Couture *Strategy* — **pas encore créée** : X01 est le seul mode de la v1, on ne généralise qu'avec un 2ᵉ mode réel (lot 5). |

⚠️ Rappel de spécification : dans la moyenne, une volée *busted* marque **0 point** mais ses
fléchettes **sont comptées**.

---

## 2. Ports

### Driving (ce que l'UI peut demander)

`StartMatch` · `RecordVisit` · `UndoLastVisit` · `GetMatchState` · `GetCheckoutSuggestion` ·
`GetMatchHistory` · `GetPlayerStats` · `ManagePlayers` · `ExportData` / `ImportData`

### Driven (ce dont le cœur a besoin)

Un port n'est créé **qu'avec son premier consommateur** — pas avant. Écrire un port sans
use case ni écran qui l'appelle, c'est du code non testé qui vieillit en attendant.

| Port | Adapter | Doublure de test | Créé au |
| --- | --- | --- | --- |
| `MatchRepository` | Dexie | in-memory | **lot 2** ✅ |
| `PlayerRepository` | Dexie | in-memory | **lot 2** ✅ |
| `Clock` | horloge système | horloge qui avance d'un pas | **lot 2** ✅ |
| `IdGenerator` | `crypto.randomUUID` | séquentiel (`id-1`, `id-2`…) | **lot 2** ✅ |
| `ScreenLock` | Wake Lock API | null-object (API absente ailleurs) | lot 3 |
| `Haptics` | Vibration API | null-object | lot 3 |
| `Preferences` | localStorage | in-memory | lot 3 |
| `Announcer` | Web Speech API | null-object | lot 5 |

---

## 3. Écrans & routes

| Route | Écran | Lot |
| --- | --- | --- |
| `/` | Accueil — *Reprendre la partie* (si une partie est en cours), *Nouvelle partie*, accès rapide | 3 |
| `/nouvelle-partie` | Configuration : jeu (301/501/701), joueurs, best-of legs/sets, double in/out | 3 |
| `/partie/:id` | **Écran match** — le cœur de l'app | 3 |
| `/partie/:id/resume` | Résumé de fin : vainqueur, stats du match, rejouer | 3 |
| `/historique` | Liste des parties jouées | 4 |
| `/historique/:id` | Détail d'une partie | 4 |
| `/joueurs` | Profils locaux (créer, renommer, couleur, supprimer) | 4 |
| `/joueurs/:id` | Stats cumulées d'un joueur | 4 |
| `/entrainement` | Exercices solo | 5 |
| `/reglages` | Préférences, export / import JSON, à propos | 4 |

Navigation basse : **Jouer · Historique · Joueurs · Réglages** (4 entrées, icônes lucide,
cibles ≥ 48 px, safe-area iOS).

---

## 4. Les lots

### Lot 0 — Scaffold

**Contenu** : Vite + React 19 + TS · Tailwind v4 (`@theme` avec les tokens de la charte) ·
Biome (avec l'`override` qui interdit les imports externes dans `src/core/**`) · Vitest v3 +
Testing Library + jsdom · `vite-plugin-pwa` (manifest « Dartpéro ») ·
`@vitejs/plugin-basic-ssl` + `server.host: true` pour le test sur téléphone ·
`@fontsource` (Alfa Slab One, Oswald, Barlow) · scripts npm.

**Fini quand** : `npm run dev`, `npm test`, `npm run lint` et `npm run typecheck` passent,
et une page « Dartpéro » s'affiche aux couleurs de la charte.

---

### Lot 1 — Domaine X01 (le vrai morceau)

**Contenu** : tous les value objects, entités, événements et services purs de la section 1.
**Zéro UI, zéro persistance.**

**Tests à écrire** (la liste fait office de spécification) :
- `Dart` : points corrects sur les 3 multiplicateurs ; triple bull **rejeté** ; bull 50 =
  double ; fléchette manquée = 0.
- Bust : reste `< 0` · reste `== 1` · reste `== 0` sans double → **le score revient exactement
  à sa valeur d'avant la visite**.
- Double out : un leg ne se gagne que sur un double (bull 50 inclus).
- Double in : tant qu'aucun double n'a été touché, rien ne décompte.
- Checkout : 170 = T20·T20·Bull · les **7 bogey numbers** renvoient « pas de finish » ·
  suggestion cohérente avec les fléchettes restantes (ex. 40 avec 1 fléchette → D20).
- Legs/sets : alternance du joueur qui commence à chaque leg · best-of 3 s'arrête à 2 legs.
- Undo : rejouer `events.slice(0, -1)` restaure **exactement** l'état précédent.
- Stats : moyenne 3 fléchettes avec une volée *busted* dans le lot · first 9 · % doubles ·
  meilleur leg.

**Fini quand** : ~40 tests verts, `src/core/domain/` sans le moindre import externe.

✅ **Fait — 60 tests verts.** Le test le plus utile du lot balaie **tous les restes de 2 à
170** : il vérifie que chaque route proposée fait exactement le compte, tient en ≤ 3
fléchettes, finit sur un double, et que la liste des restes sans solution est **exactement**
les 7 bogey numbers. La suggestion reste une heuristique (route valide la plus courte,
double usuel), pas la table PDC — voir les décisions du domaine dans `CLAUDE.md`.

---

### Lot 2 — Application & persistance

**Contenu** : les ports (section 2), les use cases correspondants, les adapters **Dexie** et
**in-memory**, le composition root `src/composition/container.ts`, le `ServicesProvider`
React (injectable, pour les tests UI).

**Fini quand** : un test d'intégration joue **une partie complète de 501 en BO3** de bout en
bout via les use cases, avec le repository Dexie fake — sans une ligne d'UI.

✅ **Fait — 86 tests verts.** La partie complète est jouée à travers le vrai composition root,
seuls les adapters changent. S'y ajoutent : un test d'architecture qui lit les imports réels
de `src/` (le cœur ne peut rien importer d'autre que lui-même, l'UI ne touche pas un adapter,
un adapter ne remonte pas vers l'UI), et un test des adapters Dexie sur une vraie IndexedDB
via `fake-indexeddb`.

---

### Lot 3 — Écran match ⭐

Le lot qui rend l'app réellement utilisable.

**Contenu** :
- Accueil + configuration de partie.
- **Écran match** : zone lecture (chiffres géants, joueur actif en halo laiton, moyenne en
  direct) + zone saisie (grille S/D/T) — voir la maquette dans `CLAUDE.md`.
- **Mode rapide** basculable (pavé 0-180 + raccourcis 26/41/45/60/100/140/180).
- **Suggestion de checkout** dès reste ≤ 170, écran de sortie dédié sous 100.
- **Annulation** (bouton visible en permanence, pas caché dans un menu).
- **Wake Lock** + **vibration** à la validation.
- Écran de résumé de fin de partie.

**Fini quand** : une vraie partie à 2 joueurs se joue du début à la fin sur un téléphone
Android, écran allumé, hors ligne. **C'est le jalon « utilisable ».**

✅ **Construit — 100 tests verts**, dont un parcours de bout en bout dans l'UI : création d'un
joueur, configuration, leg de 501 gagné en 9 fléchettes, arrivée automatique sur le résumé.
Deux ports driving ont été ajoutés pour que l'UI ne réimplémente jamais les règles :
`PreviewVisit` (évalue la volée en cours de saisie) et `BuildVisitFromScore` (traduit un score
de volée en fléchettes pour le mode rapide).
⚠️ **Reste à valider sur un vrai téléphone** — c'est le seul critère que les tests ne couvrent
pas : lisibilité à 3 m, confort des cibles au pouce, tenue du wake lock en conditions réelles.

---

### Lot 4 — Profils, historique, stats

**Contenu** : profils locaux (pseudo, couleur, avatar à initiales) · historique des parties ·
stats cumulées par joueur · **export / import JSON** de toute la base · réglages · finition
graphique complète (matières `.feutre-tapis`, `.cadre-bois`, `.laiton-poli`) · états vides et
skeletons.

**Fini quand** : on retrouve ses parties passées, ses moyennes progressent dans le temps, et
la base peut être sauvegardée puis restaurée sur un autre téléphone.

---

### Lot 5 — Entraînement solo & voix

**Contenu** : `GameMode` d'entraînement — short-list à arbitrer à ce moment-là :
*Round the Doubles* (D1→D20 + bull), *Checkout Practice* (reste tiré au sort entre 41 et 170),
*Scoring Drill* (10 volées, maximiser), *Bob's 27*. Plus l'**annonce vocale** (Web Speech API,
port `Announcer`, désactivable) : « One hundred and eighty ! ».

**Fini quand** : au moins deux exercices sont jouables et leur progression est suivie dans le
temps.

---

### Lot 6 — *(optionnel, si un jour)* Sync & classement

Un adapter `MatchRepository` distant + une identité de joueur. **Zéro refonte** du cœur —
c'est précisément ce que l'architecture hexagonale achète ici.

---

## 5. Risques identifiés

| Risque | Parade |
| --- | --- |
| La saisie 3-taps ralentit la partie et agace | Mode rapide dès le lot 3, bascule S/D/T **persistante** (pas à re-sélectionner à chaque fléchette), raccourcis de score fréquents |
| Erreur de saisie en pleine partie | Undo illimité **et fiable** grâce à la projection d'événements — bouton toujours visible |
| Écran qui s'éteint pendant une partie | Wake Lock dès le lot 3, avec null-object si l'API manque |
| Perte du téléphone = perte de tout l'historique | Export / import JSON au lot 4 |
| Sur-ingénierie des modes de jeu | Couture `GameMode` **légère** : X01 seul en v1, on ne généralise pas avant d'avoir un 2ᵉ mode réel (lot 5) |
| Règles X01 mal implémentées (bust, doubles) | La section 1 de ce plan **est** la suite de tests du lot 1 |
