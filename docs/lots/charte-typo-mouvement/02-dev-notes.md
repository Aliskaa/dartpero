# Lot `charte-typo-mouvement` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium, maxTurns
> 100, frontmatter). Rien de commité.

> **Révisé en boucle 1, tour 1** (voir `00-orchestration.md` § Historique et `03-plan-de-test.md`).
> Ce qui suit décrit la passe initiale ; l'état final diffère sur ces points :
> - filet du résumé (`TableauHonneur`) en **`border-vert-cible`**, plus en `accent-mode` (E1,
>   décision de l'utilisateur) — `01-architecture.md` § 2 est périmé sur ce point ;
> - **`trace-craie` remis sur `Cartouche`** (reste du joueur seul qui lance) ; le résumé
>   d'entraînement reste sans (E2, décision de l'utilisateur) — l'écart A7 et
>   `01-architecture.md` § 3 sont périmés sur ce point ;
> - garde (b) : `DEGRADE = /gradient|\bbg-(?:linear|radial|conic)\b/g` (G2) ;
> - garde : **10** tests (non 9) ; suite : **815** verts (non 814).

## Ce qui a été implémenté

- **Créé** : `tests/architecture/typographieBoundary.test.ts` (9 tests).
- **Modifiés** : `src/index.css` ; 31 fichiers de `src/ui` ; `docs/CHARTE_GRAPHIQUE.md`,
  `.claude/rules/theme-colors.md`, `docs/PROJECT_PLAN.md` (§ 6, entrée du lot en fin de
  journal). `CLAUDE.md`, `src/core`, `src/infrastructure`, `src/composition`, `.claude/skills/`
  intacts. (`.ai/architecture-context.md` a été régénéré par l'Orchestrator avant la phase.)
- **Tokens** : `--text-etiquette` (0,75 rem), `--text-score-xl` / `-l` / `-m` / `-solo`
  (4,25 / 3,25 / 2,5 / 4,5 rem) ; `--duration-vif` / `-normal` / `-lent` (100 / 180 / 240 ms),
  `--ease-sec: cubic-bezier(0.2, 0, 0, 1)`.
- **Animations** : `pop-score` 200 ms, `scale(1.06) → 1` ; `secousse` 260 ms, trois allers-retours
  de 4 px ; `monter` 240 ms ; `craie` 240 ms `ease-out` ; `tour-logo` 1,2 s, `1 forwards` ;
  `trace-filet` 360 ms `both`. **Supprimées** : `eclat`, `respirer`, `tourner-lent`.
- **Filet vert** : `<span aria-hidden="true" className="absolute inset-0 animate-trace-filet
  border-2 border-vert-cible">` ; `clip-path: inset(0 100% 0 0) → inset(0)`, révélé de gauche à
  droite. `TableauHonneur` : même forme en `border-accent-mode`, `pointer-events-none`. Parents
  déjà `relative overflow-hidden`.
- **Halos retirés** : `shadow-[0_0_…]` d'`Etats` (MessageErreur), `MomentCelebratif`,
  `ChoixJoueursExistants`, avatar de `TableauHonneur`. **`trace-craie` retiré** de `Cartouche` et
  `ResumeEntrainementEcran` ; gardé (conditionnel) sur `LigneJoueur`, `LigneCible`,
  `TableauCricket`.
- **Dégradés retirés** : `--tapis-image` (deux thèmes) et `background-image` /
  `background-attachment` de `.feutre-tapis` ; les `<div>` / `<span>` à dégradé de
  `MomentCelebratif` et `TableauHonneur` ; enseigne de `Logo.tsx` en `font-display text-laiton`
  plein. Seul `gradient` restant : `.chargement-balai` (`src/index.css:507`).
- **Gardés comme décidé** : ombre dure `drop-shadow-[0_3px_0_…]` de l'enseigne et du vainqueur
  (Q1), `drop-shadow` de la médaille et du `Check` (Q3), `--voile-cible`, `--voile-trace`,
  `--eclat-balai` (teinte de `chargement-balai`), `defiler`, `animate-spin` d'`Etats`.

### Tailles (chemins relatifs à `src/ui` ; tracking avant → après)

| Fichier | Avant | Après | Tracking |
|---|---|---|---|
| `ecrans/StatistiquesEcran` (2 `th`) | 0.6rem | etiquette | widest → wider |
| `composants/x01/LigneJoueur` reste (l. 25-27) | 4.25 / 3.25 / 2.5rem | score-xl / -l / -m | inchangé |
| `composants/x01/LigneJoueur` « moy » | 0.55rem | via `.entete-colonne` | normal gardé |
| `composants/x01/Tableau` (« Manches ») | 0.55rem | via `.entete-colonne` | normal gardé |
| `composants/x01/PaveFlechettes` (2 exposants) | 0.6rem | etiquette | aucun |
| `composants/checkout-practice/Cartouche` (4 étiquettes) | 0.6 / 0.65rem | etiquette | 0.3 / 0.28 / 0.2em inchangés |
| `composants/checkout-practice/Cartouche` reste | 4.5rem | score-solo | inchangé |
| `ecrans/games/checkout-practice/ResumeEntrainementEcran` | 4.5rem | score-solo | inchangé |
| `ecrans/games/x01/X01Ecran` (2 badges) | 0.6rem | etiquette | wider inchangé |
| `ecrans/games/cricket/CricketEcran` (badge) | 0.6rem | etiquette | wider inchangé |
| `ecrans/games/x01/ResumeX01Ecran` | 0.6rem | etiquette | 0.28em inchangé |
| `composants/tour-du-monde/LigneCible` (2) | 0.65rem | etiquette | 0.2em / wider inchangés |
| `ecrans/games/tour-du-monde/TourDuMondeEcran` (badge) | 0.6rem | etiquette | wider inchangé |
| `composants/commun/Avatar` xs | 0.5rem | etiquette, `size-6` | wide → normal |
| `composants/commun/Avatar` sm | 0.65rem | etiquette | wide inchangé |
| `composants/commun/EnTeteEcran` | 0.65rem | etiquette | 0.2em inchangé |
| `composants/commun/CartePartie` (2) | 0.65rem | etiquette | 0.2em / wider inchangés |
| `composants/commun/ChoixSegmente` | 0.65rem | etiquette | 0.25em inchangé |
| `composants/commun/DispositionPartie` | 0.7rem | etiquette | wide inchangé |
| `composants/commun/CarteImpacts` (3) | 0.7rem | etiquette | aucun |
| `composants/commun/Logo` (sous-titre) | 0.65rem | etiquette | 0.42em inchangé |
| `ecrans/nouvelle-partie/EnTeteEtape`, `DialogueNouveauJoueur`, `EtapeOrdre`, `EtapeJeu`, `EtapeJoueurs` | 0.6 / 0.65rem | etiquette | 0.2 à 0.25em inchangés |
| `composants/commun/NavigationBasse` (l. 50) | 0.6rem | etiquette | wider → normal |
| `composants/cricket/PaveCricket` | 0.65rem | etiquette | aucun |
| `composants/cricket/TableauCricket` (en-têtes) | 0.65rem | etiquette | wider → normal |
| `composants/commun/TableauHonneur` | 0.65rem | etiquette | 0.35em inchangé |
| `composants/commun/TableauJoueurs` (nom / en-tête) | 0.6rem | etiquette | wide inchangé / widest → wider |

`.entete-colonne` : `font-size: var(--text-etiquette)`, 0.18em gardé ; règle ajoutée
`.bandeau-feuille .entete-colonne { letter-spacing: 0.06em }` (tableau X01, comme la maquette).

### Garde `typographieBoundary.test.ts`

- (a) `/\btext-\[[0-9.]+(?:rem|px|em)\]/`, plancher > 40 fichiers, chaînes synthétiques.
- (b) `/gradient/` sur `src/ui` et `index.css`, bloc `.chargement-balai` retiré avant recherche,
  plancher (au moins un `gradient` dans ce bloc), test synthétique.
- (c) `/shadow-\[0_0_/` sur `src/ui` ; `text-shadow` à flou non nul de `index.css` autorisé pour
  `.trace-craie` seulement (plancher : au moins un) ; chaînes synthétiques (ombres dures
  acceptées).

## Écarts par rapport à `01-architecture.md`

| # | Écart | Classement | Justification |
|---|---|---|---|
| A1 | `.entete-colonne` garde 0.18em ; seul `.bandeau-feuille .entete-colonne` passe à 0.06em | Ajustement | Comme la maquette (tableau X01 seulement) |
| A2 | L'interlettrage d'`Avatar` est porté par chaque taille (plus dans la classe de base) | Ajustement | Permet `tracking-normal` en xs, rendu inchangé ailleurs |
| A3 | `TableauJoueurs` en-tête : widest → wider | Ajustement | 0,1 em à 0,75 rem débordait probablement |
| A4 | `StatistiquesEcran` : widest → wider | Ajustement | Idem |
| A5 | `NavigationBasse` et `TableauCricket` : wider → normal (plutôt que 0,06 em) | Ajustement | Plus sûr, dans la limite |
| A6 | « moy » de `LigneJoueur` : la taille vient de `.entete-colonne` | Ajustement | Classe en double retirée |
| A7 | `Cartouche` : `text-score-solo`, sans `trace-craie` | Conforme | § 3 |

## Contrôles

| Commande | Résultat (Dev) | Revérifié par l'Orchestrator |
|---|---|---|
| `npx biome check --write src tests` | 238 fichiers, aucun correctif restant | — |
| `npm run lint` | OK, 249 fichiers | OK, 249 fichiers |
| `npm run typecheck` | OK | OK |
| `npx vitest run` | 53 fichiers, 814 verts | **814 verts** (805 avant ; +9 de la garde) |
| `npm run build` | OK, précache 48 entrées (807,58 KiB) | OK (`dist/sw.js` généré) |
| `text-\[…rem\]` dans `src/ui` | 0 | 0 |
| `shadow-\[0_0_` dans `src/ui` | 0 | 0 |
| `gradient` | seul `index.css:507` | seul `index.css:507` (`.chargement-balai`) |
| Accents cassés | aucun | 2 alertes sur la sortie console de `git diff` : **faux positifs** (fichiers relus en UTF-8 : 0) |
| Tests existants touchés par `eclat`, `respirer`, `tourner-lent`, `animate-`, `text-[` | 0 occurrence, aucun test adapté | — |
| Périmètre | — | 36 fichiers modifiés (+281 / −247) + garde créée ; tous dans la zone prévue |

**Contre-épreuves réelles (Dev, cassé puis restauré par l'outil d'édition)** :
(a) `Avatar` xs en `text-[0.6rem]` → rouge ; (b) `bg-gradient-to-b` dans `Logo.tsx` → rouge,
`radial-gradient` dans `.chiffres` → rouge ; (c) `shadow-[0_0_20px_…]` dans `Etats.tsx` → rouge,
`text-shadow` de `.grave` à `0 0 6px` → rouge. Tout revenu au vert (814).

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | `.entete-colonne` hors tableau X01 (Accueil « Aujourd'hui », titre de `Panneau`, `StatTile`) passe de 0,62 à 0,75 rem en gardant 0.18em : plus large que la maquette ne le montrait | Test / utilisateur (écran) |
| 2 | La charte (~l. 350) cite encore « 4.25rem / 3.25rem » en valeurs brutes : exact, mais à exprimer en tokens ? | Test |

## Limites connues

Rien vu à l'écran. À vérifier : colonne « Manches » (44 px, 0,75 rem, tracking 0) ; barre du bas
avec police système agrandie ; `Avatar` xs en 24 px à deux initiales ; `LigneCible` et badges de
bandeau ; en-têtes à 0.18em hors tableau X01 ; rendu du filet `trace-filet` en fin de manche et
de partie ; logo après son tour (position d'origine).
