# Lot `pictogrammes` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium, maxTurns
> 100, frontmatter). Rien de commité.

## Ce qui a été implémenté

- **Créés** : `src/ui/composants/commun/Pictogramme.tsx` ; `tests/ui/Pictogramme.test.tsx` ;
  `tests/architecture/pictogrammesBoundary.test.ts`.
- **Modifiés** : `EtapeJeu`, `LigneJoueur`, `Tableau` (x01), `LigneCible`, `TableauCricket`,
  `TableauJoueurs`, `TableauHonneur`, `Cartouche`, `ResumeEntrainementEcran` ;
  `docs/CHARTE_GRAPHIQUE.md` (§ Identité : « Pictogrammes maison » + « Icônes d'action » ;
  `Pictogramme.tsx` dans les fichiers de référence). `CLAUDE.md`, `src/core`, `infrastructure`,
  `composition`, `.claude/skills/` intacts.

### Tracés calculés (`node -e`, calcul seul, arrondis à 2 décimales, provenance en commentaire)

| Pictogramme | Tracé |
|---|---|
| X01, secteur(5,10,-20,20) | `M8.58 2.6 A10 10 0 0 1 15.42 2.6 L13.71 7.3 A5 5 0 0 0 10.29 7.3 Z` |
| Entraînement, secteur(7,10,72,108) | `M21.51 8.91 A10 10 0 0 1 21.51 15.09 L18.66 14.16 A7 7 0 0 0 18.66 9.84 Z` |
| Sortie, secteur(7,10,-24,24) | `M7.93 2.86 A10 10 0 0 1 16.07 2.86 L14.85 5.61 A7 7 0 0 0 9.15 5.61 Z` |
| Tour du monde, arc | `M16.25 4.64 A8.5 8.5 0 1 1 6.54 5.49` |
| Tour du monde, tête | `M4.61 3.19 L9.29 3.17 L8.46 7.79 Z` |

Autres tracés recopiés de `request.md` ; les trois flèches du « 180 » générées par `map` sur
x ∈ {5, 12, 19}.

**Contrôle de fidélité (Orchestrator)** : la planche recalculée avec ses propres fonctions donne
exactement les mêmes secteurs et le même arc ; la tête de flèche diffère de 0,01 sur deux
coordonnées (planche : 9.3 3.18 / 8.47 7.79), écart d'arrondi (la planche ajoute les décalages au
point déjà arrondi), invisible.

### Les 13 remplacements

| # | Fichier | Avant | Après (taille, couleur) | Texte voisin |
|---|---|---|---|---|
| 1-4 | `EtapeJeu` (4 cartes) | `ChevronsDown` / `Grid3x3` / `Globe2` / `Target`, `size-6` | `x01` / `cricket` / `tour-du-monde` / `entrainement`, 40, `accent.clair` (posée sur un `<span>` parent) | libellé du mode + règles |
| 5 | `LigneJoueur` | `Crown` `size-4` `text-accent-mode` | `victoire`, 20, `text-laiton-clair` | nom du joueur |
| 6 | `LigneCible` | `Crown` `size-3.5` | idem ; `Flag` conservé | nom |
| 7 | `TableauCricket` | `Crown` `size-3.5` | idem | nom |
| 8 | `TableauJoueurs` | `Crown` `size-3.5` | idem | nom, sous l'avatar |
| 9 | `TableauHonneur` vainqueur | `Crown` `size-8` `fill-accent-mode text-accent-mode` | `victoire`, 32, `text-laiton-clair`, contour ; rotation, translation, ombre portée gardées | « Vainqueur » + `h1` |
| 10 | `TableauHonneur` nul | `Handshake` `size-16` `text-accent-mode` | `nul`, 64, `text-craie` | `h1` (titre ex æquo) + détail |
| 11 | `x01/Tableau` | `Target` `size-4` | `sortie`, 20, `text-vert-cible` ; `CircleOff` conservé | « Sortie » |
| 12 | `Cartouche` | `Target` `size-4` | `sortie`, 20, `text-vert-cible` | « Route » |
| 13 | `ResumeEntrainementEcran` | `Target` `size-3.5` | `sortie`, 20, `text-vert-cible` | cible + « en N fl. » |

**Critère 4** : aucune ligne sans texte voisin. Les quatre couronnes de ligne (5 à 8) n'ont que le
nom du joueur : pas de mot « vainqueur », ni visible ni `sr-only` — déjà le cas avec les `Crown`
`aria-hidden` : pas de régression.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| `EtapeJeu` : couleur du jeu posée sur un `<span style>` parent | Ajustement | `Pictogramme` n'a pas de prop `style` ; rendu identique (`currentColor`) |
| Garde : lit la liste importée de `lucide-react` (multi-lignes, alias compris) plutôt qu'un mot isolé | Ajustement | `TargetClosed`, `DEFAUT.minTarget` ne la déclenchent pas |

## Contrôles

| Commande | Résultat (Dev) | Revérifié par l'Orchestrator |
|---|---|---|
| `npx biome check --write src tests` | 241 fichiers, 4 reformatés (fichiers du lot) | — |
| `npm run lint` | OK, 252 fichiers | OK, 252 fichiers |
| `npm run typecheck` | OK (les `@ts-expect-error` du test sont consommés) | OK |
| `npx vitest run` | 55 fichiers, 849 verts | **849 verts** (815 avant le lot ; +34 : test du composant et garde) |
| `npm run build` | OK, PWA, 49 entrées (809,83 KiB) | OK |
| Imports `Crown` / `Handshake` / `Target` / `ChevronsDown` / `Grid3x3` / `Globe2` de `lucide-react` dans `src/ui` | 0 | 0 |
| Encodage | aucun `Ã`, `Â`, `�` (recherche sensible à la casse) | aucun (fichiers relus en UTF-8) |
| Périmètre | — | 10 fichiers modifiés (+43 / −28) + 3 créés, tous prévus |

**Contre-épreuve (Dev)** : `Crown` réimporté dans `x01/Tableau.tsx` → garde rouge
(« composants/x01/Tableau.tsx → Crown ») ; restauré par l'outil d'édition, tout vert.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Le test vérifie les attributs, pas la fidélité visuelle des tracés à la planche : faut-il un contrôle visuel ? | Test (l'Orchestrator a comparé les coordonnées, ci-dessus) |
| 2 | Les quatre couronnes de ligne n'ont pas de mot « vainqueur » (visible ou `sr-only`) | Test |

## Limites connues

Rendu à l'écran non vu : tracé rogné, finesse du trait à 64 px (≈ 5,3 px), contraste du laiton sur
papier, contours au lieu des pleins ; couronnes à 20 px dans les lignes (nom tronqué, compteur
décalé) — ni `gap` ni taille ajustés. 5 pictogrammes sur 12 non employés (attendent leurs lots).
