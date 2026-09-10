# Lot `pourcentage-doubles-tiret` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (modèle `opus`, défaut).

## Résumé

Le lot fait exactement ce qu'il annonce, et rien d'autre. `pourcent(valeur, occasions)` monte de
fonction privée d'écran (`StatistiquesEcran.tsx`) à export de `src/ui/labels.ts:202-203`, avec un
JSDoc généralisé aux trois appelants ; les deux seuls endroits de `src/ui` qui affichaient
`checkoutPercent` brut passent désormais par elle. Diff réel : 3 fichiers `src/` (+11/−11 nets),
2 fichiers de test en **ajout pur** (`52 0` et `97 0` au `--numstat` : aucune assertion
existante touchée). Aucune ligne de `core/`, aucun port, aucun événement, aucun schéma Dexie,
aucune classe Tailwind.

Contrôles **rejoués par Revue**, pas pris sur la foi des rapports : `npm test` → 32 fichiers /
**334 tests verts** · `npm run lint` → 198 fichiers, 0 correctif · `npm run typecheck` →
0 erreur · `npx vitest run tests/architecture` → 2 fichiers / 8 tests verts.

**Trois mutations** jouées (une reproduite depuis `03-plan-de-test.md`, **deux inventées par
Revue**), chaque fois sauvegardées/restaurées et vérifiées par hash que l'arbre est revenu
identique. Revérifié une troisième fois par l'Orchestrator (`git status`/`git diff --stat`
après la revue) : les 5 fichiers du lot, rien de plus.

## Conformité au design d'Archi

Livré **à la lettre**, y compris les deux points « non négociables » et le point de vigilance
central :

- `tri: (j) => j.checkoutPercent` — brut, `StatistiquesEcran.tsx:165` ✅
- `meilleur: (j) => j.checkoutPercent` — brut, `ResumeX01Ecran.tsx:47` ✅ — classement et dorage
  rigoureusement inchangés (vérifié en lisant les deux seuls consommateurs, `rangDuMeneur` et le
  tri de `TableauComparatif`, pas déduit du vert des tests).
- Glyphe vérifié **par code point** : `labels.ts:203`, `StatistiquesEcran.tsx:169,175`,
  `ResumeX01Ecran.tsx:52,57` sont tous U+2014 — pas confondu avec le U+2013 de
  `ResumeX01Ecran.tsx:132` (séparateur de legs).
- Renommage `joues` → `occasions` appliqué, comme recommandé.

Aucun écart déclaré par Dev, aucun écart trouvé par Revue.

## Constats

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| M1 | mineur | `04-revue.md` (ce fichier) restait le gabarit vide au moment de la revue. **Corrigé par cet écrit.** | Aucun (Orchestrator) |
| M2 | mineur | Aucune entrée dans `docs/PROJECT_PLAN.md` § 6 pour ce lot, alors que le lot post-audit précédent en a une. Texte proposé ci-dessous, à ajouter avant le commit. | Aucun (Orchestrator) |
| M3 | mineur | La règle « un ratio sans occasion → tiret, jamais 0 % » n'est aujourd'hui gravée dans aucun document, seulement dans un JSDoc. Ligne proposée pour `.claude/CONVENTIONS.md` § 9 ci-dessous. | Aucun (Orchestrator) |

**Aucun constat bloquant. Aucun renvoi Dev / Test / Archi.**

**Informations, sans renvoi :**

- **I1** — mutation du plan de test reproduite : `ResumeX01Ecran.tsx:46` remis au code brut →
  `3 failed | 9 passed (12)`, exactement l'annonce de `03-plan-de-test.md`.
- **I2** — lacune de méthode refermée par Revue plutôt que renvoyée : `test` n'avait muté que le
  résumé X01, pas l'écran Statistiques. Revue a muté `StatistiquesEcran.tsx:164` → `1 failed |
  16 passed (17)`, le cas neuf de `lot4.test.tsx` tombe bien. Couverture réelle, mais non
  démontrée avant cette revue.
- **I3** — mutation du helper lui-même (inventée par Revue) : `pourcent` rendu naïf
  (`occasions === 0 || valeur === 0 ? '—' : …`) → 3 tests rouges, **dont un pré-existant** (les
  legs). Preuve double : le cas « 0 % réel » n'est pas vert à vide, et le déplacement du helper
  reste gardé par les tests historiques.
- **I4** — pas de `NaN` possible : `checkoutPercent` vaut `0`, jamais `NaN`, quand
  `doubleAttempts === 0` (`stats.ts:189`, `career.ts:171`) — garder `tri`/`meilleur` bruts ne
  peut pas empoisonner un tri.
- **I5** — le cas `doubleOut: false` (deux `—`) ne dore personne : `rangDuMeneur` renvoie `-1`
  sur une égalité, donc aucun faux meneur. Seul un joueur **solo** produirait un tiret doré —
  pré-existant, partagé avec deux lignes voisines, explicitement écarté par Archi (Q3).
- **I6** — périmètre complet : `checkoutPercent` n'apparaît qu'à 4 endroits de `src/ui` (2
  affichages corrigés, 2 tris bruts). Le seul autre `Math.round` de pourcentage restant
  (`LigneCible.tsx:47`, progression du Tour du monde) est correctement **pas** un candidat :
  `0` y est un vrai zéro, pas une absence.
- **I7** — style d'assertion (`toHaveTextContent`, sous-chaîne) cohérent avec le reste de la
  suite ; la discrimination réelle est portée par le `not.toHaveTextContent('—')` voisin,
  confirmé par I3.
- **I8** — homonymie douce, sans collision : `pourcentage(reussis, total): number` côté domaine
  (`career.ts:99`) vs `pourcent(valeur, occasions): string` côté UI — couches et types de
  retour différents, cohérent avec « le cœur ne fabrique aucun texte affichable ».

## Relecture à l'écran — tranchée par Revue : non nécessaire

Question 4 d'Archi (laissée ouverte). Revue tranche **contre**, au même niveau d'exigence que la
revue du lot précédent, en examinant un par un les mécanismes par lesquels des pixels
pourraient apprendre quelque chose :

1. **Glyphe** : U+2014 est déjà à l'écran aujourd'hui, dans les **mêmes** `<td>`, avec la
   **même** chaîne de classes (`highestCheckout || '—'`, `bestLegDarts ?? '—'`). La ligne
   « % doubles » n'a pas `accent: true` : même taille, graisse, couleur que ses voisines.
2. **Largeur** : le changement ne peut que raccourcir la chaîne. `TableauJoueurs` est
   `table-fixed`, `TableauComparatif` en `overflow-x-auto` — débordement impossible dans les
   deux sens.
3. **Couleur/dorage** : décidé uniquement par `tri`/`meilleur`, restés bruts — rendu identique
   bit pour bit à avant le lot.
4. **Composition neuve** : une ligne « Finitions » d'un joueur neuf lira `— — —` au lieu de
   `0 % — —` — tous les ingrédients déjà validés à l'écran individuellement.

À comparer aux lots où la relecture a rattrapé des défauts (thème clair, carte des impacts) :
ceux-là introduisaient couleurs, composants, mises en page. Ici : zéro classe, zéro token, zéro
balise nouvelle. Coût de l'alternative non négligeable : aucun script de capture n'est
versionné, il faudrait réécrire l'amorçage IndexedDB au schéma v2 pour un lot de 10 lignes.
**Si un coup d'œil reste souhaité malgré tout** : `npm run dev` → `/statistiques` avec un joueur
neuf, 2 minutes — mais le GO n'y est pas conditionné.

## Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) | ✅ `labels.ts` reste `ui/`, aucun import ajouté ; `core/**` non touché |
| `tests/architecture/*` verts | ✅ 2 fichiers / 8 tests |
| Aucun mode de jeu n'en importe un autre | ✅ diff hors de `games/` |
| Aucune couleur en dur, aucun `rounded-*` introduit | ✅ aucune classe Tailwind ni littéral couleur dans les lignes ajoutées |
| Aucune règle de jeu réimplémentée dans l'UI | ✅ calcul intact dans `stats.ts`/`career.ts`, l'UI ne fait que mettre en texte |
| Aucune valeur persistée renommée | ✅ aucun événement, schéma Dexie ou champ `MatchSummary` touché |
| Non-régression des tests existants | ✅ ajouts purs (`52 0`, `97 0`) |
| `CLAUDE.md` à jour des décisions durables | ✅ rien à graver — le lot finit d'appliquer une règle déjà prise, il n'en crée pas |
| Propreté du commit | ✅ `git status` : 5 fichiers `src`/`tests` + `docs/lots/pourcentage-doubles-tiret/` non suivi. Aucun risque de mélange (la restructuration documentaire du lot précédent est déjà committée dans `ae9f933`) |

## Question 2 d'Archi (`successPercent`, entraînement)

**Confirmé intact et intouché.** `ApercuPartie.tsx:101` et
`ResumeEntrainementEcran.tsx:47` sont hors du diff et affichent toujours
`Math.round(state.successPercent)`. Candidat d'audit distinct, pas un oubli de ce lot : l'écran
n'a pas de tableau, et `appreciation(pourcentage)` délivre une phrase à partir de la même
valeur — un tiret y demande une décision ergonomique que ce lot n'avait pas mandat de prendre.

## Gravage documentaire

**`CLAUDE.md`** : rien à ajouter — confirmé, le lot n'a renversé ni créé aucune décision
structurante.

**`.claude/CONVENTIONS.md` § 9** — ligne à ajouter (avant le dernier point, celui sur
`rounded-*`) :

> Un ratio dont le dénominateur peut valoir zéro s'affiche via `pourcent(valeur, occasions)`
> (`src/ui/labels.ts`) : sans occasion, un tiret **cadratin** `—` (U+2014), jamais « 0 % » — qui
> se lit « il a tout raté ». Trois appelants : matchs, legs, doubles. ⚠️ Un pourcentage de
> **progression** (`LigneCible.tsx`) garde son `0` : là, zéro est un vrai zéro, pas une absence.

**`docs/PROJECT_PLAN.md` § 6** — entrée à ajouter, dans la forme du lot précédent (texte fourni
par Revue, repris tel quel par l'Orchestrator au moment du gravage).

## Go / no-go

**Verdict : GO.**

1. Le design d'Archi est livré sans dérive, y compris le seul point où une erreur aurait été
   invisible au vert des tests (`tri`/`meilleur` bruts) — vérifié dans le code.
2. Le plan de Test attaque la vraie zone de risque, et Revue a prouvé par deux mutations
   supplémentaires (non faites par Test) que la couverture tient sur les deux écrans et sur le
   helper lui-même.
3. Aucune question ouverte sans arbitrage : les quatre questions d'Archi ont une résolution
   écrite ; l'arrêt qui engageait la conception (Archi → Dev) porte un Go utilisateur explicite ;
   la question 4 (relecture à l'écran) est tranchée ci-dessus avec sa justification.
4. Invariants invisibles au vert tous vérifiés sur le diff réel.
5. Les trois constats sont des actions documentaires de l'Orchestrator avant commit — aucun ne
   rouvre Dev, Test ni Archi.

## Points non résolus, assumés après le lot

1. **`successPercent` (entraînement)** garde le même défaut à deux endroits — hors périmètre
   assumé, à verser au vivier d'audit avec sa question ergonomique propre.
2. **Tiret doré en solo** (`rangDuMeneur` renvoie 0 pour un joueur unique) — pré-existant,
   partagé avec deux lignes voisines ; lot séparé s'il gêne un jour.
3. **« Jamais tenté » et « tout raté » sont classés à égalité** (les deux à `checkoutPercent = 0`
   côté `tri`) — choix délibéré de non-régression, cohérent avec `highestCheckout`.
4. **Aucune relecture à l'écran** — assumée, justifiée mécanisme par mécanisme ci-dessus.
5. **CRLF** sur les 5 fichiers du lot (avertissement Git) — candidat 4 de l'audit, toujours
   ouvert, sans effet sur ce commit.
