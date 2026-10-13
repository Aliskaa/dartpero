# Lot `charte-contraste` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium, maxTurns
> 100, frontmatter). Rien de commité.

## Ce qui a été implémenté

49 fichiers modifiés, aucun créé.

- **`src/index.css`** : `--color-craie-2` / `-3` / `-decor` dans `@theme` (`#bcb8a8`, `#9b9b8a`,
  `#52584d`) et sous `html[data-theme="clair"]` (`#354137`, `#485249`, `#a8a592`) ; commentaire
  faux des l. 168-169 remplacé ; `.entete-colonne` en `var(--color-craie-3)`.
- **44 fichiers `.tsx` de `src/ui`** : remplacements faits à la main (outil d'édition, aucun
  script).

  | Classe | Occurrences après le lot |
  |---|---|
  | `text-craie-2` | 43 |
  | `text-craie-3` | 72 |
  | `text-craie-decor` | 9 |

  124 au total pour 121 alphas d'origine : trois noms de joueurs inactifs passent aussi de
  `text-craie` à `craie-2` (§ 3).
- **Lignes inactives** (`LigneJoueur`, `LigneCible`, `TableauCricket`) : `opacity-70` et
  `transition-opacity` retirés ; nom inactif en `craie-2` ; `trace-craie` seulement sur la ligne
  active.
- **`NavigationBasse`** : actif `text-craie-vive`, inactif `text-craie-3 active:text-craie` ; trait
  `bg-laiton` conservé.
- **Garde** `tests/architecture/themeBoundary.test.ts` : `ALPHA_TEXTE`, plancher de 40 fichiers,
  test de chaînes synthétiques (+2 tests).
- **Docs** : `docs/CHARTE_GRAPHIQUE.md` (§ Palette, § Les trois planchers, l. 336, l. 385, onglet
  actif) et `.claude/rules/theme-colors.md`.

### Cas sous 55 % (critère 5)

| fichier:ligne | alpha | choix | raison |
|---|---|---|---|
| `LigneCible:100` | 50 | craie-3 | « /{total} » : information |
| `ReglagesEcran:403` | 50 | craie-3 | icône `VolumeX` (voix coupée), porteuse de sens |
| `ResumeX01Ecran:149` | 50 | craie-3 | score de l'adversaire battu |
| `StatistiquesEcran:87` | 40 | craie-3 | numéro de rang |
| `JoueursEcran:230` | 40 | craie-3 | `placeholder:` du champ |
| `ResumeTourDuMondeEcran:101` | 40 | craie-3 | numéro de rang |
| `ResumeTourDuMondeEcran:116` | 40 | craie-3 | « /{total} » |
| `ResumeCricketEcran:95` | 40 | craie-3 | numéro de rang |
| `ResumeCricketEcran:105` | 40 | craie-3 | « /{total} » |
| `Cartouche:111` | 40 | craie-3 | « /{total} » |
| `LigneJoueur:176` | 20 | craie-3 | « — » d'une fléchette absente (Q3) |
| `LigneJoueur:199` | 20 | craie-3 | « — » d'un total absent (Q3) |
| `TableauCricket:40` | 20 | craie-decor | `<svg aria-hidden>` d'une cible morte ; l'information est dans le `sr-only` |
| `TableauCricket:102` | 25 | craie-3 | en-tête de colonne morte, texte lu ; la mort portée par `line-through` |
| `X01Ecran:46` | 25 | craie-decor | séparateur « \| » déjà `aria-hidden` |
| `EntrainementEcran:75` | 25 | craie-decor | séparateur « \| » déjà `aria-hidden` |
| `TourDuMondeEcran:102` | 25 | craie-decor | séparateur « \| » déjà `aria-hidden` |
| `CricketEcran:114` | 25 | craie-decor | séparateur « \| » déjà `aria-hidden` |
| `ResumeX01Ecran:142` | 25 | craie-decor | séparateur « – » déjà `aria-hidden` |
| `CricketEcran:30` | 25 | craie-decor | case de fléchette vide « · », enveloppée dans `<span aria-hidden>` |
| `TourDuMondeEcran:29` | 25 | craie-decor | idem |
| `Cartouche:71` | 20 | craie-decor | idem |

**Usages de `craie-decor`** (9) : `Cartouche.tsx:71`, `TableauCricket.tsx:40`,
`EntrainementEcran.tsx:75`, `CricketEcran.tsx:30` et `:114`, `TourDuMondeEcran.tsx:29` et `:102`,
`ResumeX01Ecran.tsx:142`, `X01Ecran.tsx:46` — tous `aria-hidden`.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| `<span aria-hidden>` ajouté autour des « · » des cases de volée vides | Ajustement | § 2 : un décor porte `aria-hidden` ; le glyphe était porté par la case elle-même |
| Icônes `VolumeX` (Réglages) et `CircleOff` (`Tableau.tsx`, 55 %) en `craie-3` | Ajustement | § 2 muet sur les icônes ; resté du côté « information » |
| Nom inactif de `ChoixJoueursExistants` en `craie-2` | Ajustement | Même rôle que les noms inactifs du § 3 |

## Contrôles

| Commande | Résultat (Dev) | Revérifié par l'Orchestrator |
|---|---|---|
| `npx biome check --write src tests` | 3 fichiers reformatés (mise en forme seule) | — |
| `npm run lint` | OK, 248 fichiers | OK, 248 fichiers, aucun correctif |
| `npm run typecheck` | OK | OK |
| `npx vitest run` | 52 fichiers, 805 verts | **805 verts** (803 avant le lot ; +2 du garde) |
| `text-craie(-vive)?/N` dans `src/ui` | 0 | 0 |
| Accents cassés dans le diff | aucun | aucun (lignes ajoutées du `git diff`) |
| Périmètre | — | `git diff --stat` : 49 fichiers (+230 / −148), tous dans `src/ui`, `src/index.css`, le garde, la charte, `theme-colors.md` |
| Tests cherchant `opacity-70` | aucun | — |

**Contre-épreuve (Dev)** : `text-craie/60` réintroduit dans `StatTile.tsx` → le garde échoue
(`composants/commun/StatTile.tsx → text-craie/60`) ; restauré par édition, suite verte.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Le `<span aria-hidden>` des cases vides ne décale-t-il pas le « · » ? | Test (code) / utilisateur (écran) |
| 2 | `VolumeX` et `CircleOff` en `craie-3` plutôt qu'en `craie-decor` : trop présents ? | Test / utilisateur (écran) |
| 3 | En-tête de colonne morte du Cricket en `craie-3 line-through`, sans `opacity-30` : assez distinct ? | Test / utilisateur (écran) |

## Limites connues

- Rien n'a été vu à l'écran : relecture portrait / paysage, sombre / clair, avant / après
  obligatoire.
- Le sombre bouge d'une nuance (≈ 62 % et ≈ 75 % à plat).
- `craie-2` et `craie-3` proches en clair.
- Les « — » de `LigneJoueur` (fléchette ou total absents) passent de 20 % à `craie-3` : bien plus
  visibles en sombre, conséquence voulue de Q3, à juger à l'écran.
