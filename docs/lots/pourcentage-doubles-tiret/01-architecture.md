# Lot `pourcentage-doubles-tiret` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent `archi`.

## Problème

Le projet a déjà tranché, au lot « les trois finitions », qu'un ratio sans dénominateur ne
s'écrit pas `0 %` : ça se confond avec « il a tout raté », alors que l'absence d'occasion veut
dire « on ne sait pas encore ». La règle a été codée une fois —
`pourcent(valeur, joues)` dans `StatistiquesEcran.tsx:28-29` — mais appliquée seulement à deux
des trois pourcentages de l'app (`matchWinPercent`, `legWinPercent`). Le troisième,
`checkoutPercent`, l'a manquée aux **deux** endroits où il s'affiche
(`StatistiquesEcran.tsx:171-172` et `ResumeX01Ecran.tsx:46-47`), qui restent en
`` `${Math.round(j.checkoutPercent)} %` `` brut.

Ce n'est pas un cas particulier à ajouter, c'est **finir d'appliquer une règle existante**.
L'obstacle structurel qui a laissé passer le défaut : la règle vit dans une fonction **privée
d'un fichier d'écran**, invisible depuis le second écran qui en avait besoin. Tant qu'elle y
reste, un quatrième pourcentage la manquera pareil.

**Cas vérifié par `archi`, plus grave que le Goal ne le disait** : `tests/ui/resumeX01.test.tsx:119`
configure la partie de référence en `doubleOut: false`. Or `isOnACheckoutDouble`
(`src/core/domain/services/checkout.ts:112-116`) renvoie `false` dès que `doubleOut` est
désactivé — `doubleAttempts` vaut donc 0 pour tout le monde. Aujourd'hui, dans cette fixture,
**Kevin sort le leg sur un D12** et sa feuille de match affiche `0 %` de doubles. Le défaut ne
touche pas que « celui qui n'a rien tenté » : il ment aussi au vainqueur.

## Options considérées

| # | Option | Pour | Contre | Verdict |
|---|---|---|---|---|
| A | Monter `pourcent()` dans `src/ui/labels.ts`, exportée | `labels.ts:6` héberge déjà « tout le français » de l'app, dont des formateurs purement numériques (`moyenne`, l. 190-192) — précédent exact. Les deux écrans importent déjà `@/ui/labels` : zéro import de fichier nouveau. | Aucun identifié. | **Retenue** |
| B | Dupliquer la fonction dans les deux écrans | Diff minimal | Duplique **la règle**, pas trois lignes — le mécanisme même qui a produit le bug. `ResumeX01Ecran.tsx` porte déjà deux glyphes de tiret différents (cadratin l. 52/57, demi-cadratin séparateur de legs l. 133) : retaper le bon à la main est une occasion de se tromper. | Rejetée |
| C | Nouveau fichier `src/ui/formats.ts` | Sépare formatage et libellés | Entre en concurrence avec `labels.ts`, qui héberge déjà `moyenne`/`pluriel`/`dateCourte` — artillerie disproportionnée pour une fonction de deux lignes. | Rejetée |
| D | La mettre dans `TableauJoueurs.tsx` | Un des deux appelants y est | `StatistiquesEcran` n'utilise pas ce composant ; ce n'est pas une préoccupation de tableau. | Rejetée |
| E | Faire remonter la distinction du domaine (`checkoutPercent: number \| null`) | Un seul point de vérité côté cœur | Hors périmètre et injustifié : `doubleAttempts` porte déjà l'information, et le port `GetPlayerStats.ts:8-9` dit explicitement « le cœur ne fabrique aucun texte affichable ». Changerait la **donnée** pour encoder une décision d'**affichage**. | Rejetée |

## Approche retenue

**`pourcent()` monte dans `src/ui/labels.ts`, exportée**, entre `moyenne` (l. 190-192) et
`dateCourte` (l. 194) — dans le groupe des formateurs numériques, pas des libellés de mode.

```ts
export const pourcent = (valeur: number, occasions: number): string =>
  occasions === 0 ? '—' : `${Math.round(valeur)} %`
```

Deux points non négociables pour Dev :

- **Glyphe** : le tiret cadratin U+2014 (`—`), celui déjà employé
  `StatistiquesEcran.tsx:176,183` et `ResumeX01Ecran.tsx:52,57` — à copier depuis l'existant,
  pas à retaper (le demi-cadratin de `ResumeX01Ecran.tsx:133` est un autre caractère).
- **JSDoc** : il migre avec la fonction et se généralise aux trois appelants (matchs, legs,
  doubles) au lieu de ne parler que des legs. Conforme à CONVENTIONS.md §3 (le commentaire
  porte le « pourquoi ») — ne pas l'élaguer.

**Renommage `joues` → `occasions`** : tranché par `archi`, **non bloquant**. Les trois appels
seront `matchesPlayed`, `legsPlayed`, `doubleAttempts` — `joues` deviendrait faux au troisième
(une tentative de double n'est pas une partie jouée), et un nom faux dans un helper partagé
décourage le prochain appelant. Dev peut garder `joues` si le JSDoc lève l'ambiguïté ; zéro
effet sur les appelants dans les deux cas.

### Ce qui change, fichier par fichier

**`src/ui/labels.ts`** — ajout de la fonction exportée + JSDoc généralisé. Aucun import
nouveau.

**`src/ui/ecrans/StatistiquesEcran.tsx`**
- l. 23-29 : suppression du JSDoc et de la définition locale de `pourcent` (partent dans
  `labels.ts`).
- l. 14-20 : ajout de `pourcent` à l'import existant (`organizeImports` de Biome le classera).
- l. 171-172 : `valeur: (j) => pourcent(j.checkoutPercent, j.doubleAttempts)` ; **`tri` ne
  bouge pas** (`(j) => j.checkoutPercent`, voir Vérifications).
- l. 137, 153 : aucun changement, appels existants identiques.

**`src/ui/ecrans/games/x01/ResumeX01Ecran.tsx`**
- l. 13 : ajout de `pourcent` à l'import `@/ui/labels`.
- l. 46 : `valeur: (j) => pourcent(j.checkoutPercent, j.doubleAttempts)`.
- l. 47 : **`meilleur` ne bouge pas** (`(j) => j.checkoutPercent`).

Trois fichiers `src/` touchés, aucun créé, ~10 lignes nettes.

### Vérifications de non-régression du tri/classement

- `TableauJoueurs.tsx:34` (`valeur: (joueur: T) => string | number`) accepte déjà un `string`
  formaté (précédent : `bestLegDarts ?? '—'`, `highestCheckout || '—'`) — aucune adaptation de
  type. `meilleur` (l. 40) reste un `number` distinct, lu **uniquement** par `rangDuMeneur`
  (l. 59-64) : le classement du résumé X01 est donc rigoureusement inchangé, seul le texte de
  cellule change.
- `StatistiquesEcran.tsx`, type `Colonne` local (l. 34/36) : même séparation `valeur`/`tri`.
  Point vérifié spécifiquement : « % doubles » est la **première colonne** du tableau
  « Finitions » (l. 166-186), donc celle qui classe tout le tableau (`TableauComparatif`,
  tri décroissant sur `colonnes[0].tri`, l. 56-58). `tri` restant `j.checkoutPercent` brut, le
  classement et la numérotation des rangs sont inchangés.
- Cas limite identifié et écarté comme pré-existant : en partie **solo**, `rangDuMeneur`
  renvoie 0 pour le joueur unique (`tests/ui/resumeX01.test.tsx:36-38`) — un joueur à 0
  tentative y affichera un tiret **doré**. C'est déjà le comportement actuel des lignes
  « Meilleur leg » / « Plus haut checkout » : cohérent, pré-existant, **hors périmètre**
  (§ Questions ouvertes n°3).

### Couches impactées

| Couche | Fichiers | Nature |
|---|---|---|
| `core/domain/` | Aucun | `checkoutPercent`/`doubleAttempts` déjà corrects (`stats.ts:141-147,189`, `career.ts:122,171`) |
| `core/application/` | Aucun | Aucun port créé ni modifié |
| `infrastructure/` | Aucun | — |
| `composition/` | Aucun | Rien à câbler : fonction pure sans dépendance |
| `ui/` | `labels.ts` (+fonction), `StatistiquesEcran.tsx`, `games/x01/ResumeX01Ecran.tsx` | Le lot entier |
| `tests/` | `tests/ui/resumeX01.test.tsx`, `tests/ui/lot4.test.tsx` (cas ajoutés) | Aucune assertion existante modifiée |

**Sens des dépendances** : `labels.ts` n'importe que des types, `ui → application → domain`
inchangé, `src/core/**` non touché (hors d'atteinte de `hexagonalBoundary.test.ts`).
`themeBoundary.test.ts` scanne les couleurs littérales — un `'—'` et un ` %` ne le déclenchent
pas, plancher de fichiers inchangé (aucun fichier créé/supprimé). Pas de nouveau port : aucune
capacité externe en jeu, la règle « un port n'est créé qu'avec son premier consommateur »
n'a rien à accueillir ici.

## Décisions de `CLAUDE.md` concernées

**Invoquées, non modifiées** : *labels.ts (tout le français, annonces comprises)* dans
l'arborescence cible ; *« le cœur ne fabrique aucun texte affichable »* (décision du lot 2,
rappelée dans `GetPlayerStats.ts:8-9`) — c'est l'argument qui écarte l'option E.
CONVENTIONS.md §3 (commentaire = le pourquoi) et §9 (composants UI).

**Aucune décision structurante nouvelle à graver dans `CLAUDE.md`** : ce lot applique une règle
déjà prise, il n'en crée pas.

**Suggestion pour `.claude/CONVENTIONS.md` §9**, à l'appréciation de l'Orchestrator en fin de
lot (hors périmètre code) : une ligne du type « un ratio s'affiche via
`pourcent(valeur, occasions)` de `labels.ts` ; sans occasion, un tiret cadratin, jamais `0 %` »
— pour éviter qu'un quatrième pourcentage refasse le même trajet.

## Questions ouvertes — résolues au gate check

| # | Question | Origine | Résolution |
|---|---|---|---|
| 1 | `joues` → `occasions` : renommer le second paramètre de `pourcent()` ? | Archi | **Tranché par Archi, non bloquant.** Renommage recommandé (nom faux au 3ᵉ appelant sinon), mais Dev peut garder `joues` avec un JSDoc qui couvre les trois usages. Ne bloque pas Dev. |
| 2 | Le mode entraînement (`successPercent`) a le même défaut à deux endroits (`ResumeEntrainementEcran.tsx:47`, `ApercuPartie.tsx:101`) — à corriger ici ? | Archi | **Confirmé hors périmètre**, comme posé dans `00-orchestration.md`. Écran et question ergonomique différents (pas de tableau, un gros chiffre collé au `%`, sens du tiret à définir sur un écran de fin d'entraînement). **Versé au vivier d'audit comme candidat distinct** — ne pas le traiter dans ce lot, et la Revue ne doit pas le lever comme un oubli. |
| 3 | Tiret doré en partie solo (`rangDuMeneur` renvoie 0 pour un joueur unique) | Archi | **Pré-existant, cohérent avec les lignes voisines (Meilleur leg, Plus haut checkout) — à ne pas toucher.** Si la relecture à l'écran le trouve gênant, c'est un lot séparé sur `rangDuMeneur`, pas celui-ci. |
| 4 | Relecture à l'écran nécessaire malgré la petite taille du lot | Archi | **Actée.** Deux vues à ouvrir avant la Revue finale : un résumé X01 joué **sans double out** (le cas du vainqueur à `0 %`, aujourd'hui trompeur) et l'écran Statistiques avec un joueur neuf au compteur. À faire par l'Orchestrator (ou délégué à Revue) avant le second arrêt. |

Toutes les questions produites par cette phase ont une résolution écrite ci-dessus : statut
Architecture → **Faite**, aucun blocage ouvert.

## Révisions

> Ajoutées par les boucles 2 et 5. Ne jamais effacer la version précédente.

Aucune à ce stade.
