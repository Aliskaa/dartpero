# Lot `charte-contraste` — architecture

> Écrit par l'Orchestrator depuis le rapport `PASS` d'`archi-scout` (sonnet / low), tentative 1.

Architecture result: PASS

## Problème

Le texte secondaire est écrit en alpha (121 `text-craie/NN`, 45 fichiers) : en clair, l'encre
transparente tombe sous 4,5:1. Les lignes des joueurs inactifs sont en plus grisées par
`opacity-70`. L'onglet actif de la barre du bas est trop pâle en clair.

## Approche retenue

Tokens pleins déclarés dans `@theme`, redéfinis sous `html[data-theme="clair"]` ; aucune classe ne
connaît le thème. Changement mécanique, protégé par un garde de test ; rendu jugé à l'écran.

### 1. Tokens (`src/index.css`)

`--color-craie-2`, `--color-craie-3`, `--color-craie-decor` dans `@theme`, valeurs claires sous
`html[data-theme="clair"]` (le garde existant « le thème clair redéfinit tous les tokens » le
vérifie ; sa regex accepte ces noms). Tailwind v4 génère `text-craie-2`, `text-craie-3`,
`text-craie-decor`.

| Token | Sombre | Clair |
|---|---|---|
| `craie-2` | `#bcb8a8` (≈ 75 % de `#f2e8d5` sur `feutre`, légèrement éclairci) | `#354137` (imposé) |
| `craie-3` | `#9b9b8a` (≈ 62 % ; le 60 % exact ne laisse que 4,61:1 sur `ardoise-claire`) | `#485249` (imposé) |
| `craie-decor` | `#52584d` (≈ 30 %) | `#a8a592` (encre à ≈ 30 % sur `feutre`) |

`craie-decor` n'a pas de contrainte WCAG : glyphes `aria-hidden` seulement.

**Contrastes WCAG** (méthode : canaux sRGB linéarisés — `c ≤ 0,03928 ? c/12,92 :
((c+0,055)/1,055)^2,4` —, `L = 0,2126 R + 0,7152 G + 0,0722 B`, rapport `(L1+0,05)/(L2+0,05)`).
Recalculés par l'Orchestrator sur ces valeurs :

| Token | Thème | `feutre` | `feutre-nuit` | `ardoise` | `ardoise-claire` |
|---|---|---|---|---|---|
| `craie` | sombre | 14,70 | 15,79 | 13,27 | 11,33 |
| `craie-2` | sombre | 8,98 | 9,65 | 8,11 | 6,92 |
| `craie-3` | sombre | 6,34 | 6,81 | 5,72 | **4,88** |
| `craie` | clair | 10,25 | 8,26 | 12,88 | 14,14 |
| `craie-2` | clair | 7,62 | 6,14 | 9,58 | 10,51 |
| `craie-3` | clair | 5,80 | **4,67** | 7,29 | 8,00 |

Tout ≥ 4,5:1 (critère 1). Dev reconsigne ce tableau dans la charte.

### 2. Correspondance des 121 occurrences

- 75 à 85 % → `text-craie-2` ; 55 à 70 % → `text-craie-3`.
- Sous 55 % : `text-craie-3` si c'est du texte lu ; `text-craie-decor` seulement pour un élément
  purement décoratif, qui porte `aria-hidden` (déjà, ou ajouté s'il s'agit d'un séparateur « · »,
  « / »).
- Aucune occurrence `text-craie-vive/NN` aujourd'hui ; le garde les interdit quand même.
- Cas sous 55 % à relire un par un :
  - `/50` : `LigneCible:100`, `ReglagesEcran:403`, `ResumeX01Ecran:149` ;
  - `/40` : `StatistiquesEcran:87`, `JoueursEcran:230`, `ResumeTourDuMondeEcran:101,116`,
    `ResumeCricketEcran:95,105`, `Cartouche:111` ;
  - `/25` ou `/20` : `LigneJoueur:176,199`, `TableauCricket:40,102`, `X01Ecran:46`,
    `ResumeX01Ecran:142`, `EntrainementEcran:75`, `TourDuMondeEcran:29,102`,
    `CricketEcran:30,114`, `Cartouche:71`.
- Dev consigne dans `02-dev-notes.md` un tableau `fichier:ligne | alpha | choix | raison` ; la
  liste du token décor (critère 5) en est extraite.
- Édition fichier par fichier, sans script qui réécrit les fichiers (accents).

### 3. Lignes inactives

- `LigneJoueur.tsx` : l. 124 `actif ? 'au-lancer' : ''` (plus d'`opacity-70` ;
  `transition-opacity duration-300` sans objet) ; l. 138 nom inactif en `text-craie-2` ; l. 226
  `trace-craie` seulement si `actif`.
- `LigneCible.tsx` : l. 56 sans `opacity-70` ; l. 85 nom inactif `text-craie-2` ; l. 70
  `trace-craie` seulement si `actif`.
- `TableauCricket.tsx` : l. 127 sans `opacity-70` ; l. 149 nom inactif `text-craie-2` ; l. 188
  `trace-craie` seulement si `joueur.actif`.
- `opacity-30` des cibles mortes inchangé (hors périmètre) ; `Cartouche.tsx` garde son
  `trace-craie` (pas une ligne de joueur). Vérifier qu'aucun test ne cherche `opacity-70`.

### 4. Onglet actif (`NavigationBasse.tsx:51`)

- `text-laiton-clair` ne suffit pas : 4,25:1 sur `feutre-nuit` clair (recalculé). Le laiton
  actuel : 2,82:1.
- Retenu (sous réserve de l'utilisateur, question 1) : actif `text-craie-vive` (19,19:1 sombre,
  10,65:1 clair sur `feutre-nuit`), inactif `text-craie-3`. L'identité laiton reste portée par
  le trait `bg-laiton` de 3 px sous l'onglet (l. 62). Visible en sombre : le texte actif passe
  du laiton clair au blanc.
- Écarté : assombrir la valeur claire de `laiton-clair` (touche tous les `text-laiton-clair`, dont
  les accents de mode du lot 6).
- Dette signalée : d'autres textes laiton sur `feutre-nuit` clair, hors lot.

### 5. Garde `themeBoundary`

- `const ALPHA_TEXTE = /\btext-craie(?:-vive)?\/(?:\d+|\[)/g` appliqué à `fichiers(UI)`, sans
  exception ; n'attrape ni `border-craie/25` ni `bg-craie/…`.
- Plancher : `expect(tous.length).toBeGreaterThan(40)`.
- Contre-épreuve dans le fichier : chaînes synthétiques — doivent correspondre `text-craie/60`,
  `text-craie-vive/80`, `hover:text-craie/5`, `text-craie/[.6]` ; ne doivent pas correspondre
  `text-craie-2`, `text-craie`, `border-craie/25`, `text-craie-decor`.
- Contre-épreuve manuelle consignée : un `text-craie/60` réintroduit fait échouer le test.

### 6. Documentation

- `docs/CHARTE_GRAPHIQUE.md` : § Les trois planchers l. 35 (« Aucun texte sous `craie-3` »,
  ≥ 4,5:1 sur les 4 surfaces et les 2 thèmes, méthode) ; § Palette (`craie-2`, `craie-3`,
  `craie-decor`, hex sombre / clair, tableau des contrastes) ; l. 385 ; l. 336 (exemple
  `text-craie/70` → `text-craie-3`) ; l'onglet actif.
- `.claude/rules/theme-colors.md` : règle des tokens au lieu de « craie/60 » ; `text-craie/NN`
  et `text-craie-vive/NN` interdits ; `craie-decor` réservé à l'`aria-hidden`.
- `src/index.css` : commentaire faux l. 168-169 remplacé ; `.entete-colonne` (l. 390,
  `color-mix(… craie 62%)`) → `var(--color-craie-3)` (texte secondaire, dans le périmètre). Les
  autres `color-mix` (bordures, fonds) restent hors périmètre.

## Décisions du contexte concernées

Thème = redéfinition de valeurs sous `html[data-theme="clair"]`, paires de rôle
(`rules/theme-colors.md`) ; garde `themeBoundary` étendu ; rien du domaine, de `GameMode`, de la
persistance, du service worker ni de `firebase.json` ; politique de confidentialité inchangée.

## Baseline sécu

Aucune frontière nouvelle (pas d'import, pas de réseau, pas de rendu HTML brut). Aucun risque
sécurité.

## Tests et risques

- Garde étendu ; suite complète, `lint`, `typecheck` verts ; `npx biome check --write src tests`
  seulement.
- Relecture à l'écran obligatoire (portrait / paysage, sombre / clair ; Accueil, Nouvelle partie,
  4 jeux, résumés, Stats, Parties, Réglages ; téléphone en luminosité basse), avec comparaison
  avant / après en sombre.
- Risques : glyphe mal classé texte / décor (tableau consigné) ; `craie-2` et `craie-3` proches
  en clair ; diff de ~45 fichiers à la main (accents) ; le sombre peut bouger d'une nuance.

## Questions ouvertes

| # | Question (scout) | Résolution |
|---|---|---|
| 1 | Onglet actif en `craie-vive` (blanc en sombre), identité laiton portée par le trait sous l'onglet ? | **Close (utilisateur, 2026-10-13)** : validé — onglet actif en `craie-vive`, souligné du trait laiton |
| 2 | Valeurs sombres `#bcb8a8` / `#9b9b8a` à confirmer par le calcul | **Close (Orchestrator)** : tableau recalculé ci-dessus, tout ≥ 4,5:1 (minimum 4,88) |
| 3 | Les « — » à 20-25 % sans `aria-hidden` : texte ou décor ? | **Close (Orchestrator)** : un « — » qui tient la place d'une valeur absente est une information (`frontend-react.md` : « un ratio sans occasion s'affiche — ») → `craie-3`. Seuls les séparateurs purement visuels (« · », « / ») passent en `craie-decor` avec `aria-hidden`. Dev applique et consigne chaque cas |
