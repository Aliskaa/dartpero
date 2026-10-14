# Lot `pictogrammes` — architecture

> Écrit par l'Orchestrator depuis le rapport `PASS` d'`archi-scout` (sonnet / low), tentative 1.
> Non relus par le scout : `geometrieCible.ts`, `Cible.tsx`, `CarteImpacts.tsx`, gardes
> `lazyRoutes` / `hexagonalBoundary`, charte § Typographie, l'index.

Architecture result: PASS

## Problème

Remplacer 13 icônes `lucide-react` (`Crown` ×5, `Handshake`, `Target` ×3, 4 icônes de mode à
l'étape 1) par les pictogrammes maison en SVG, `currentColor`, `aria-hidden`, minimum 20 px. Tout
est dans `src/ui` : aucune surface gravée.

## Approche retenue

### 1. API : un seul composant `Pictogramme`

- Fichier `src/ui/composants/commun/Pictogramme.tsx`.
- `PICTOGRAMMES = ['x01', 'cricket', 'tour-du-monde', 'entrainement', '180', 'bust', 'sortie',
  'victoire', 'moyenne', 'grosses-volees', 'meilleure-manche', 'nul'] as const`, type
  `NomPictogramme` dérivé. Les 12 sont créés ; ce lot en emploie 7 (4 modes, victoire, nul,
  sortie).
- Tracés dans un `Record<NomPictogramme, ReactNode>` : exhaustivité vérifiée à la compilation.
- **Taille** : prop obligatoire `taille: 20 | 24 | 32 | 40 | 64`, posée en `width` / `height`.
  C'est ce qui impose le plancher de 20 px ; `className` ne sert qu'à la couleur et au
  `shrink-0`. La liste s'élargit au besoin d'un lot futur.
- Props : `nom`, `taille`, `className?`. Fixés : `aria-hidden="true"`, `focusable="false"`,
  `viewBox="0 0 24 24"`.
- Écarté : un composant par pictogramme (12 fichiers pour un `switch`).

### 2. Géométrie : tracés fixes en grille 24

- Les `d` de `request.md` recopiés ; les `secteur()`, la flèche du Tour du monde et les angles
  calculés une fois, puis écrits en constantes avec un commentaire de provenance. Pas de
  `geometrieCible.ts` (grille 100 : l'adapter coûte plus que 12 tracés).
- Style commun sur le `<svg>` : `fill="none"`, `stroke="currentColor"`, `strokeWidth={2}`,
  `strokeLinecap="square"`, `strokeLinejoin="miter"`. Aplats (secteurs, point central, tête de
  flèche) : `fill="currentColor"`, `stroke="none"`. Croix d'`entrainement` : `strokeWidth={1.6}`.
- Secteur du X01 : `fillOpacity={0.9}` (non visé par `themeBoundary`).

### 3. Les 13 remplacements

| Fichier | Avant | Après |
|---|---|---|
| `EtapeJeu` | `ICONES` (`ChevronsDown`, `Grid3x3`, `Globe2`, `Target`), `size-6` | `ICONES: Record<GameModeId, NomPictogramme>` (X01 → `x01`, CRICKET → `cricket`, TOUR_DU_MONDE → `tour-du-monde`, CHECKOUT_PRACTICE → `entrainement`), `taille={40}`, `style={{ color: accent.clair }}` conservé ; `ChevronRight` reste ; sens porté par le libellé du mode |
| `LigneJoueur:142`, `LigneCible:89`, `TableauCricket:151`, `TableauJoueurs:79` | `Crown` 14-16 px `text-accent-mode` | `victoire`, 20, `text-laiton-clair` ; `LigneCible` garde `Flag` |
| `TableauHonneur:78` | `Crown` `size-8` `fill-accent-mode` | `victoire`, 32, `text-laiton-clair`, sans `fill-*` (contour) ; rotation, translation et ombre portée gardées ; texte voisin « Vainqueur » + `h1` |
| `TableauHonneur:96` | `Handshake` `size-16` `text-accent-mode` | `nul`, 64, `text-craie` ; texte voisin : titre ex æquo dans le `h1` |
| `x01/Tableau:53` | `Target` `size-4` | `sortie`, 20, `text-vert-cible` ; texte « Sortie » ; `CircleOff` reste |
| `checkout-practice/Cartouche:90` | `Target` `size-4` | `sortie`, 20, `text-vert-cible` ; texte « Route » |
| `ResumeEntrainementEcran:89` | `Target` `size-3.5` | `sortie`, 20, `text-vert-cible` ; texte : cible + « en N fl. » |

Critère 4 : Dev vérifie que chaque couronne de ligne garde un texte voisin (rien à ajouter :
« ce qui l'est aujourd'hui le reste ») et signale dans `02-dev-notes.md` toute ligne sans texte.
Imports `lucide` nettoyés fichier par fichier.

### 4. Gardes existantes

`themeBoundary` vert (`currentColor` seul). `typographieBoundary` : ni `text-[…]`, ni le mot
« gradient » (même en commentaire), ni `shadow-[0_0_`. `opacity` / `fillOpacity` en attribut SVG
non visés.

### 5. Tests

- Nouveau `tests/ui/Pictogramme.test.tsx` : `it.each(PICTOGRAMMES)` rend le `<svg>`,
  `aria-hidden="true"`, `viewBox`, `width` / `height` = taille ; aucun `fill` / `stroke` autre que
  `none` / `currentColor`, ni `#hex` ni `rgb` ; `@ts-expect-error` sur un nom inconnu et sur
  `taille={16}` ; plancher `PICTOGRAMMES.length === 12`.
- Tests existants : seul accès à un `svg` lucide = `accueilPartiesRecentes.test.tsx:289`
  (`svg.lucide-check`, coche non touchée) ; aucun test ne cherche `Crown`, `Target`,
  `Handshake`. Suite complète relancée pour d'éventuels `querySelector('svg')`.
- Nouvelle garde `tests/architecture/pictogrammesBoundary.test.ts` : plus de `Crown`,
  `Handshake`, `Target`, `ChevronsDown`, `Grid3x3`, `Globe2` importés de `lucide-react` dans
  `src/ui` ; plancher de fichiers (> 40) ; cas positif / négatif du motif.

### 6. Charte § Identité

La ligne « Icônes UI » devient deux lignes : (a) **Pictogrammes maison** — liste des 12, dessin
(grille 24, trait 2 px, extrémités et jonctions vives, `currentColor`, jamais de couleur en dur),
couleurs d'emploi (modes = couleur de leur jeu, victoire `laiton-clair`, sortie `vert-cible`, nul
`craie`), règle « un pictogramme dit quelque chose » (sens toujours dans un texte voisin), tailles
autorisées, minimum 20 px ; (b) **Icônes d'action** — `lucide-react`, `aria-hidden`, réservées
aux actions et aux cas sans équivalent (`CircleOff`, `Flag`). `Pictogramme.tsx` ajouté aux
fichiers de référence. `CLAUDE.md` inchangé.

## Couches et chemins

`src/ui/composants/commun/Pictogramme.tsx` (nouveau) ; les 9 fichiers du § 3 ;
`docs/CHARTE_GRAPHIQUE.md` ; `tests/ui/Pictogramme.test.tsx` ;
`tests/architecture/pictogrammesBoundary.test.ts`. Aucun port, use case ni domaine.

## Décisions du contexte concernées

Charte (angle vif, ni dégradé ni halo, tokens seulement) ; `rules/frontend-react.md` (icônes
`aria-hidden`, lisibilité à distance) ; `rules/theme-colors.md` (aucune exception de couleur
nouvelle) ; `rules/typescript.md` (`as const`, type dérivé).

## Baseline sécu

Aucune frontière nouvelle : nom typé, tracés constants, pas de `dangerouslySetInnerHTML`, pas de
réseau, pas d'entrée utilisateur.

## Risques et relecture écran

- Couronnes de 14-16 px à 20 px : nom tronqué ou compteur de manches décalé (`LigneJoueur`,
  `LigneCible`, `TableauCricket`, rangée d'avatars de `TableauJoueurs`). Si ça déborde : ajuster
  le `gap`, jamais la taille.
- Contour plutôt que plein : la grande couronne et le « nul » étaient lourds ; un trait de 2 px en
  grille 24 fait ≈ 5,3 px à 64 px. À juger à l'écran.
- Relecture : étape 1, victoire dans les 4 modes, match nul, suggestion de sortie (`Tableau`,
  `Cartouche`, résumé d'entraînement) ; portrait / paysage, sombre / clair. Angles morts : tracé
  rogné, contraste du laiton sur papier, légèreté du trait.

## Questions ouvertes

| # | Question (scout) | Résolution (Orchestrator) |
|---|---|---|
| 1 | `fillOpacity` 0,9 du secteur X01 : conservé ou supprimé selon le rendu ? | **Close** : conservé, c'est la géométrie de la planche validée (`request.md`). Ajustable seulement à la relecture écran, par une décision de l'utilisateur |
