# Lot `pourcentage-doubles-tiret` — notes de dev

> Écrit par l'Orchestrator à partir du compte-rendu du sous-agent `dev`, vérifié directement
> (`git diff`, `npm run lint`, `npm run typecheck`, `npm test`).

## Fichiers modifiés

**`src/ui/labels.ts`** — ajout de la fonction exportée `pourcent(valeur, occasions)`, entre
`moyenne` et `dateCourte`, avec JSDoc généralisé aux trois usages (matchs, legs, doubles) :

```ts
/**
 * ⚠️ Un tiret plutôt que « 0 % » quand rien n'a été joué ou tenté : zéro pour
 * cent, ça veut dire « il a tout perdu ». Rien du tout, ça veut dire « on ne
 * sait pas encore » — un leg en cours n'est ni gagné ni perdu, et un joueur
 * qui n'a jamais eu de double à jouer n'a pas raté ses sorties, il n'en a
 * simplement pas eu. Sert aux trois pourcentages de l'app : matchs, legs,
 * doubles.
 */
export const pourcent = (valeur: number, occasions: number): string =>
  occasions === 0 ? '—' : `${Math.round(valeur)} %`
```

Le glyphe est bien le tiret cadratin U+2014, copié depuis l'existant (pas retapé). Le second
paramètre a été renommé `joues` → `occasions`, comme recommandé (non bloquant) par
`01-architecture.md`.

**`src/ui/ecrans/StatistiquesEcran.tsx`** — suppression du JSDoc et de la définition locale de
`pourcent` (6 lignes) ; ajout de `pourcent` à l'import `@/ui/labels` ; colonne « % doubles » du
tableau « Finitions » :
```diff
- valeur: (j) => `${Math.round(j.checkoutPercent)} %`,
+ valeur: (j) => pourcent(j.checkoutPercent, j.doubleAttempts),
  tri: (j) => j.checkoutPercent,
```
`tri` intact (brut, sert au classement). Les deux appels existants
(`pourcent(matchWinPercent, matchesPlayed)`, `pourcent(legWinPercent, legsPlayed)`, lignes
~137/153) n'ont pas bougé.

**`src/ui/ecrans/games/x01/ResumeX01Ecran.tsx`** — ajout de `pourcent` à l'import
`@/ui/labels` ; ligne « % doubles » de la feuille de match :
```diff
  libelle: '% doubles',
- valeur: (j) => `${Math.round(j.checkoutPercent)} %`,
+ valeur: (j) => pourcent(j.checkoutPercent, j.doubleAttempts),
  meilleur: (j) => j.checkoutPercent,
```
`meilleur` intact (brut, sert à `rangDuMeneur`).

Diff vérifié fichier par fichier (`git diff`) : conforme trait pour trait à
`01-architecture.md` § *Ce qui change, fichier par fichier*. Trois fichiers `src/` modifiés,
aucun créé, aucun test touché par Dev.

## Vérifications (rejouées par l'Orchestrator, pas seulement prises sur la foi de `dev`)

| Commande | Résultat |
|---|---|
| `npm run lint` | Vert — « Checked 198 files in 75ms. No fixes applied. » |
| `npm run typecheck` | Vert — aucune erreur |
| `npm test` | Vert — **330/330 tests**, 32 fichiers |

Aucune régression : `tests/ui/lot4.test.tsx` et `tests/ui/resumeX01.test.tsx` (25 tests à eux
deux) verts sans modification d'assertion — preuve que le déplacement de `pourcent()` vers
`labels.ts` est neutre.

## Écarts par rapport à l'architecture

Aucun.

## Note sur le compteur de tests

Le prompt de Dev citait « 318 » comme chiffre de référence (dernier « État d'avancement » écrit
dans `CLAUDE.md` au moment de la rédaction de l'objectif). Le HEAD réel du dépôt en porte 330
depuis le lot `tour-du-monde-cloture-volee` (déjà mergé, cf. son propre journal). Écart de
référence documentaire, sans rapport avec ce lot — `dev` l'a signalé plutôt que de le corriger
en silence, comme demandé. Aucune action requise.

## Questions ouvertes

Aucune.
