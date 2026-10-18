# Lot `hors-statistique` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet, effort medium).

## Ce qui a été implémenté

- **Jeton** `--color-rouge-touche` dans `@theme` (sombre `#ff8a8f`) et sous
  `html[data-theme="clair"]` (`#a81f25`, valeur de la planche), `src/index.css`.
- **Bordure** : classe `.touche-hors` en couche `components`, sur le modèle de `.touche-bulle` ;
  elle ne pose que `border-color: var(--color-rouge-touche)`, le fond reste transparent.
- **Touche « Hors »** (`PaveSaisie.tsx`) : `touche touche-hors …
  [--texte-touche:var(--color-rouge-touche)]`, aucun utilitaire `text-*` (garde `appuiBoundary`).
- **`labels.ts`** : `moyenneParPartie(total, parties)` (virgule `fr-FR`, une décimale, « 0,0 » si
  `parties <= 0`) et `horsCibleParPartie(missed, parties)` → `{ libelle, moyenne, base }`.
- **Statistiques** (`BlocCible`) : ligne `<p>` `flex justify-between` sous le `<ul>`, dans le
  `<figcaption>` (libellés `text-etiquette text-craie-3`, valeur `chiffres font-bold text-craie`) ;
  la colonne affiche `nombre(missed)`, donc « 0 » à zéro ; import `LIBELLE_HORS` retiré de l'écran.
- **Dénominateur** : `joueur.matchesPlayed`, aucun changement de domaine (`src/core` intact).
- **Docs** : `theme-colors.md` (section `rouge-touche`), `CHARTE_GRAPHIQUE.md` § Palette.
- **Tests** : `tests/ui/horsCibleParPartie.test.ts` (nouveau) ; `statistiquesPodium.test.tsx`
  (attentes `Horshors cible` → `0hors cible`, ligne de moyenne, période) ; `themeBoundary.test.ts`
  (jeton, usage dans `PaveSaisie`, `.touche-hors`).

**Contrastes mesurés** (WCAG, valeurs de `src/index.css`) — fond réel du pavé = `feutre`
(`DispositionPartie` pose `feutre-tapis`) :

| Thème | `feutre` (pavé) | `feutre-nuit` | `ardoise` |
|---|---|---|---|
| Sombre `#ff8a8f` | **7,90** | 8,48 | 7,13 |
| Clair `#a81f25` | **5,18** | 4,17 | 6,51 |

`#a81f25` tient 4,5:1 sur le fond réel : **la valeur de la planche est gardée, aucun écart**.
Le jeton ne se pose pas sur `feutre-nuit` en clair (4,17:1), consigné dans la charte et
`theme-colors.md`.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Aucun | — | Choix laissés au Dev : bordure par `.touche-hors` (Q3), `nombre()` gardé pour le « 16 » (Q4), « 0 partie » documenté en test (Q5) |

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npx vitest run` | 85 fichiers, 1583 tests, verts (les « Not implemented: navigation » de jsdom préexistent) |

`biome check --write` lancé sur `src` et `tests` : 2 fichiers du lot reformatés.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Question produit « rouge clair plus foncé » : **close**, `#a81f25` tient 5,18:1 sur `feutre` | — |
| 2 | À voir à l'écran seulement : bordure rouge sur fond `craie` inversé à l'appui ; ligne de moyenne à 390 px (trois morceaux en `justify-between`) ; lisibilité à distance | Test / Utilisateur |

## Limites connues et TODO assumés

- Rien n'a été vu à l'écran : relecture portrait, paysage, sombre et clair à faire.
- Le résumé de partie garde « Hors cible ×N » (hors périmètre).
- `fichier tests/ui/statistiquesPodium.test.tsx` : BOM retiré après un `Set-Content` ; le diff ne
  montre que les lignes voulues.
