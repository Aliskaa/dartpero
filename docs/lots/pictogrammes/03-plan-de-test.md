# Lot `pictogrammes` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high, frontmatter).

## Passe 3 — GO (après boucle 1, tour 2)

Sans shell. Revérifié par l'Orchestrator : lint OK, typecheck OK, 870 verts, build OK, encodage
sain.

| Point | Statut | Constat (Test) |
|---|---|---|
| P2-1 | Corrigé | `vainqueurLecteurEcran.test.tsx`, `it.each([true, false])` sur `LigneJoueur`, `LigneCible`, `TableauCricket` : retirer le `sr-only` rougit le cas vrai, le rendre inconditionnel rougit le cas faux ; `TableauJoueurs` couvert dans les deux sens par `resumeX01.test.tsx` |
| P2-2 | Corrigé | Couronne et nul du résumé identifiés par leur tracé (`TRACES_ATTENDUS`) ; un `svg` lucide de même taille ne passe plus |
| P2-3 | Corrigé | Racine `fill="none"` et `stroke-width="2"` assertées |
| P2-4 | Corrigé | Deux commentaires exacts |

Nouveaux tests sans mock et déterministes (`fakeServices`, vrais use cases du Tour du monde,
`cleanup` après chaque test). `tracesPictogrammes.ts` n'est pas pris pour un test (motif
`tests/**/*.test.{ts,tsx}`), même statut que `gestes.ts`.

### Observations

| # | Constat | Suite |
|---|---|---|
| P3-1 | Étape 1 : la comparaison triée prouve les 4 tracés, une fois chacun, mais pas l'association carte ↔ mode (échanger deux entrées d'`ICONES` resterait vert) | **Close (Orchestrator)** : sans nouveau tour. Non exigé par les critères ; un échange serait immédiatement visible à la relecture de l'étape 1 ; dette notée pour le lot 9 (`nouvelle-partie-parcours`), qui refait ces cartes |
| P3-2 | Le test exige exactement 4 liens (P2-5) | Sans action |

### Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Relecture à l'écran (angles morts de la passe 1 ; un `sr-only` ne se juge qu'au lecteur d'écran) | Utilisateur, arrêt de fin de lot |

---

## Passe 2 — GO, observations jointes à un tour 2 (après boucle 1, tour 1)

Sans shell : lecture des sources et des tests. Revérifié par l'Orchestrator : lint OK, typecheck
OK, 864 verts, build OK.

| Point | Statut | Constat (Test) |
|---|---|---|
| Q2 | Corrigé | `sr-only` « , vainqueur » sur les 4 couronnes (`LigneJoueur` l. 150, `LigneCible` l. 94, `TableauCricket` l. 158, `TableauJoueurs` l. 90), texte dans `labels.ts` |
| O-Q1 | Corrigé | `TRACES_ATTENDUS` typé ; `innerHTML` comparé exactement : échoue sur `d` modifié, attribut perdu, échange de deux pictogrammes |
| O1 | Corrigé | Étape 1, résumé avec vainqueur, résumé ex æquo ; sans mock, déterministes, vrais use cases, règles du Tour du monde respectées (tour de table, nul à égalité parfaite) |
| `resumeX01.test.tsx` | Adaptation légitime | Correspondance exacte « Kevin, vainqueur » ; « Julien » reste exact : pas d'affaiblissement |
| Minuscule + virgule | Cohérent | Nom accessible « Kevin, vainqueur » ; le commentaire de `labels.ts` sur-justifie la minuscule (les `findByText` sont exacts), sans effet |
| Charte | Vraie désormais | Sens porté par un texte aux 13 emplacements |

### Observations

| # | Constat | Suite |
|---|---|---|
| P2-1 | Q2 protégée sur 1 couronne sur 4 (`TableauJoueurs`, via `resumeX01`) | **Close (Orchestrator)** : boucle 1, tour 2 — tests de `LigneJoueur`, `LigneCible`, `TableauCricket` (« , vainqueur » présent si vainqueur, absent sinon) |
| P2-2 | Tests d'emplacement identifiés par la seule taille (un `svg` lucide de même taille passerait) | **Close (Orchestrator)** : tour 2 — vérifier aussi le tracé (`innerHTML` de `victoire`, `nul`, et des 4 modes à l'étape 1) |
| P2-3 | Racine du `<svg>` : `fill="none"` et `stroke-width="2"` non assertés | **Close (Orchestrator)** : tour 2 — ajoutés aux assertions |
| P2-4 | Commentaires imprécis (`labels.ts` : justification de la minuscule ; `TableauJoueurs` l. 89 : « Kevin vainqueur » sans virgule) | Joints au tour 2 |
| P2-5 | Le test de l'étape 1 exige exactement 4 liens | Sans action (à revoir si l'en-tête gagne un lien) |

Angles morts écran inchangés (passe 1).

---

## Passe 1 — GO, renvoi Dev non bloquant

Sans shell (ni vitest, ni `git diff`) : lecture intégrale des sources du lot et comparaison
manuelle des tracés à `request.md`, avec recalcul trigonométrique. Chiffres de l'Orchestrator :
lint OK, typecheck OK, 849 verts, build OK.

### Couverture par critère

| # | Vérifié par | Protégé par un test ? |
|---|---|---|
| 1 | Lecture de `Pictogramme.tsx` contre `request.md` ; `TRACES: Record<NomPictogramme, ReactNode>` exhaustif | Structure : oui (`it.each(PICTOGRAMMES)` : `aria-hidden`, `focusable`, `viewBox`, `stroke`, `square` / `miter`, au moins un tracé). Géométrie : non (ni `d`, ni `strokeWidth` 1.6, ni `fillOpacity` 0.9) |
| 2 | Grep sur `src` : plus aucune icône remplacée ; seuls `ChevronRight`, `CircleOff`, `Flag` restent de `lucide` | Oui : `pictogrammesBoundary` (plancher 40 fichiers, multi-lignes, alias, `type` ; négatifs `TargetClosed`, autre module) |
| 3 | Tailles lues : 40 / 20 / 32 / 64 | Type `TaillePictogramme` (le `@ts-expect-error` sur `taille={16}` est consommé par `typecheck`) ; rien au rendu ; un `className="size-4"` pourrait contourner |
| 4 | Voir Q2 | Non |
| 5 | Ni couleur en dur, ni « gradient », ni `text-[…]` dans le composant | Gardes existantes (non relancées par Test) |
| 6 | Orchestrator | — |
| 7 | Couleurs lues : modes `accent.clair`, victoire `text-laiton-clair` ×5, nul `text-craie`, sortie `text-vert-cible` ×3 | Non |

### Fidélité à la planche

Conforme, attributs compris : style commun du `<svg>`, cercles et tracés recopiés, « 180 » par
`map`, secteurs recalculés (X01, entraînement, sortie), arc du Tour du monde (290° horaire), tête
de flèche à 0,01 près, aplats en `fill="currentColor" stroke="none"`, croix d'entraînement à 1.6,
secteur X01 à `fillOpacity` 0.9.

### Les 13 remplacements

Conformes : étape 1 en 40 px ; 4 couronnes de ligne en 20 px `text-laiton-clair` ; couronne du
résumé en 32 px sans `fill-*` ; nul en 64 px `text-craie` ; 3 sorties en 20 px `text-vert-cible`.
Plus aucun `fill-accent-mode` dans `src`. `aria-hidden` partout (via le composant).

### Réponses aux questions de `02-dev-notes.md`

1. **Contrôle visuel des tracés** : impossible sous jsdom (angle mort écran) ; la comparaison de
   coordonnées est valide aujourd'hui mais non protégée. Recommandé : figer les 12 tracés par un
   test à valeurs attendues (`outerHTML` ou `toMatchInlineSnapshot`).
2. **Couronnes de ligne sans « vainqueur »** : **état antérieur, pas une régression** (les `Crown`
   d'avant étaient `aria-hidden` — confirmé par l'Orchestrator : grep d'avant le Dev,
   `<Crown aria-hidden="true" …>` dans les 4 fichiers). Critère 4 tenu à la lettre. Mais la
   nouvelle phrase de la charte (« un texte voisin ou réservé aux lecteurs d'écran porte
   **toujours** le sens ») est fausse pour ces 4 usages.

### Bugs et observations

| # | Constat | Classement | Suite |
|---|---|---|---|
| — | Aucun bug d'implémentation | — | — |
| Q2 | Charte vs code : 4 couronnes de ligne sans texte « vainqueur » | Écart charte / code | **Renvoi Dev** : `sr-only` « vainqueur » (texte dans `labels.ts`) dans `LigneJoueur`, `LigneCible`, `TableauCricket`, `TableauJoueurs` |
| O-Q1 | Tracés non figés par un test | Problème de test (recommandé) | **Renvoi Dev** : test à valeurs attendues des 12 tracés |
| O1 | Aucun test de rendu des emplacements (40 px à l'étape 1 ; couronne et nul du résumé) | Problème de test (recommandé) | **Renvoi Dev** : test `EtapeJeu` (4 `svg` `width="40"`) et test du résumé (couronne 32, nul 64) |
| O2 | `className` peut contourner le plancher de 20 px | Observation | Sans action (convention documentée) |
| O3 | Garde aveugle aux imports profonds de `lucide-react` | Observation | Sans action (théorique) |

### Angles morts (écran)

Lignes de score avec la couronne à 20 px (nom rogné, compteur décalé) ; `TableauJoueurs` en
paysage ; contours au lieu des pleins (nul à 64 px, couronne à 32 px) ; laiton clair sur papier ;
tête de flèche du Tour du monde et secteur X01 ; hauteurs de rangée (`Cartouche`, `Tableau`,
résumé d'entraînement) ; couleur du mode sur les 4 cartes de l'étape 1.

### Questions ouvertes

| # | Question | Résolution |
|---|---|---|
| 1 | Figer les tracés et ajouter les tests de rendu dans ce lot ? | **Close (Orchestrator)** : oui, peu coûteux et protège la fidélité à la planche pour les lots suivants. Boucle 1, tour 1 |
| 2 | Charte adoucie ou `sr-only` pour les 4 couronnes de ligne ? | **Close (Orchestrator)** : `sr-only` — la règle de la charte reste vraie et l'accessibilité y gagne ; texte dans `labels.ts` |
| 3 | Relecture à l'écran | Utilisateur, arrêt de fin de lot |
