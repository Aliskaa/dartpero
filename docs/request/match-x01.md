# Demande — match-x01

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-14
- **Niveau** : light
- **Commande manuelle** : `/orchestrate match-x01 light`

## Objectif

Appliquer à l'écran de match X01 ce qui a été validé sur maquettes : un paysage qui ne coupe plus
rien, un reste plus grand, un multiplicateur armé qu'on ne peut plus rater, des bâtons lisibles à
3 m, un bandeau qui dit le jeu par sa forme, et un écran qui ne bouge plus quand on célèbre ou
qu'on enregistre.

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 5 du § Découpage en
lots (direction B, § Validé par l'utilisateur : multiplicateur armé gradué, tableau du
mouvement). Références visuelles (privées) :

- écrans de jeu, colonne « A · Affiner » : <https://claude.ai/artifact/12w6D81HCF2AM834RX6zSi>
  (X01 sombre et clair, Double armé, paysage) ;
- planche des pictogrammes, situation « Bandeau de match » :
  <https://claude.ai/artifact/CgN3pTwCt6GddUWETHde2S>.

La maquette A a été obtenue en injectant ce CSS dans la page (aperçu, pas une implémentation ;
l'implémentation passe par les tokens et les composants) :

```css
/* Lecture collée en haut, reste agrandi d'environ 25 % (portrait) */
div:has(> section[aria-label="Tableau des scores"]) { justify-content: flex-start; }
output.trace-craie.text-\[4\.25rem\] { font-size: 5.1rem; }
output.trace-craie.text-\[3\.25rem\] { font-size: 4.05rem; }
output.trace-craie.text-\[2\.5rem\]  { font-size: 3.1rem; }

/* Multiplicateur armé (Double ou Triple pressé) */
section[aria-label^="Saisie"]:has(… Double/Triple [aria-pressed="true"]) .touche:not(:disabled) {
  border: 2px solid var(--color-laiton);
  box-shadow: 0 2px 0 var(--color-laiton-sombre);
}
section[aria-label^="Saisie"] .touche > span[aria-hidden="true"] { font-size: 0.8rem; }

/* Bâtons des manches restantes en tirets */
trait vertical restant : border-left: 2px dashed color-mix(in srgb, var(--color-craie) 55%, transparent);
trait barré restant    : border-top:  2px dashed color-mix(in srgb, var(--color-craie) 55%, transparent);

/* Paysage (orientation: landscape) and (max-height: 34rem) */
nom de partie masqué ; gaps du pavé 0.25rem ; rail S/D/T padding 0.125rem ;
reste aux tailles d'origine (4.25 / 3.25 rem) ; lignes du tableau padding vertical 0.5rem.
```

Bandeau de la planche des pictogrammes : pictogramme du jeu (26 px sur la planche, couleur du
jeu), titre « X01 » en Oswald 700 majuscules, sous-titre « 501 · premier à 2 manches » en petit,
« Manche 3 » à droite.

## Périmètre

**Commun aux quatre jeux** (`DispositionPartie`, `MomentCelebratif`, `Batons`, hooks de mode) :

1. **Zone de lecture collée en haut** : plus de `justify-center` ; le pavé reste collé en bas.
2. **Paysage réparé** (variante `paysage`) : nom de partie masqué, espacements du pavé et du rail
   S/D/T resserrés, lignes resserrées ; plus rien de rogné (bas de la feuille, rail
   Simple / Double / Triple).
3. **`MomentCelebratif` hors du flux** : superposé au bas du tableau (au X01, par-dessus le ruban
   de sortie), le temps de son affichage. Il ne décale rien et ne recouvre jamais le pavé.
4. **Fin du clignotement** : le pavé ne passe plus à l'opacité 0,3 pendant l'écriture de la volée
   (`desactive={…occupe}`). La garde `occupe` des hooks reste : un appui pendant l'écriture
   n'enregistre toujours rien.
5. **Bâtons des manches restantes en tirets** de craie à 55 % (`Batons.tsx`, partout où il sert) ;
   les bâtons acquis restent pleins.

**X01 seulement** :

6. **Reste agrandi d'environ 25 % en portrait** : 5,1 / 4,05 / 3,1 rem au lieu de
   4,25 / 3,25 / 2,5 (tokens `--text-score-*`, qui ne servent qu'au X01). En paysage, les tailles
   actuelles restent.
7. **Multiplicateur armé gradué**, sur les touches **1 à 20 et 25 seulement** :

   | Armé | Touches | Coin de la touche |
   | --- | --- | --- |
   | Simple | Normales | Rien |
   | Double | Filet laiton 2 px + liseré laiton foncé de 2 px dessous | Valeur réelle, agrandie (≈ 0,8 rem) |
   | Triple | Filet laiton **et** fond teinté laiton (+ liseré) | Valeur réelle, agrandie |

   « 0 » et « Annuler » ne changent jamais. Le 25 reste désactivé en Triple (pas de triple bull).
   Au retour à Simple, le filet s'efface en **fondu** ; le curseur du rail garde son glissement.
8. **Repère laiton qui glisse** vers le joueur suivant au changement de joueur, au lieu
   d'apparaître d'un coup.
9. **Bandeau de la planche** :

   ```
   [←]  [picto x01 24 px]  X01                         MANCHE 1
                           501 · PREMIER À 2 MANCHES   SET 2 (si sets)
                           [DI] [DO]
   ```

   - Flèche de retour en tête (absente de la planche, obligatoire).
   - Pictogramme `x01` en **24 px** (26 px n'est pas une taille permise de `Pictogramme`),
     couleur du jeu, `aria-hidden`.
   - Titre « X01 » ; sous-titre : score de départ et manches à gagner ; DI / DO gardent leurs
     pastilles actuelles.
   - « Manche N » à droite, « Set M » dessous quand il y a des sets.
   - Nom de partie : sa ligne en portrait, masqué en paysage (point 2).
   - Tout libellé nouveau dans `labels.ts`.
10. **Charte** : § Écran de match (bandeau, multiplicateur gradué, moment superposé, paysage) et
    § Mouvement (repère qui glisse, fondu du filet).

## Hors périmètre

- Feuille, pavé, bandeau et accents de Cricket et du Tour du monde (lot 6 `feuille-commune`).
- Les règles au bandeau, livre ouvert (lot 11 `regles-du-jeu`).
- La volée perdue au rechargement (lot 13 `volee-partielle`).
- La suggestion de sortie à un reste de 1 en sortie libre.
- Toute règle de jeu, tout format persisté, `CLAUDE.md`.

## Comportement visible

- **Portrait, lu à 3 m** : la feuille commence sous le bandeau ; le reste est plus grand ; au
  changement de joueur, le filet laiton glisse d'une ligne à l'autre ; à une sortie, le bandeau
  vert apparaît sur le bas de la feuille, le tableau ne bouge pas. Le bandeau dit « X01 » par son
  pictogramme et son titre, la manche à droite.
- **Tapé à 30 cm** : en Double, les 21 touches de score prennent un filet laiton et un liseré
  foncé ; en Triple, filet et fond laiton ; après la fléchette, le filet s'efface en fondu ; le
  pavé ne clignote plus à la 3ᵉ fléchette.
- **Paysage (844 × 390)** : tout tient sans défilement, rail S/D/T entier, touches ≥ 48 px.
- **Cricket, Tour du monde, entraînement** : lecture en haut, paysage réparé, moment superposé,
  fin du clignotement, bâtons en tirets là où ils servent. Rien d'autre ne change.

## Critères d'acceptation

1. En portrait, la zone de lecture des quatre écrans de partie n'est plus centrée verticalement.
2. En paysage 844 × 390 : aucun contenu coupé dans les quatre écrans, toutes les cibles ≥ 48 px,
   nom de partie masqué.
3. `MomentCelebratif` ne change ni la hauteur ni la position du tableau ; il reste
   `pointer-events-none`, `role="status"`, `aria-live="polite"`.
4. Pendant l'écriture d'une volée, aucune touche du pavé n'est désactivée visuellement ; un appui
   pendant l'écriture n'enregistre aucune fléchette (test).
5. X01 : en Double, filet sur 1 à 20 et 25 ; en Triple, filet et fond, 25 désactivé ; en Simple,
   ni l'un ni l'autre ; « 0 » et « Annuler » jamais. Testé par l'état (classe ou attribut), pas
   par la couleur.
6. Bâtons restants en tirets, acquis pleins, dans tous leurs emplacements.
7. Reste X01 aux nouvelles tailles en portrait, inchangé en paysage. **Aucun chiffre rogné** dans
   la colonne de 108 px, « 501 » et « 701 » compris à deux joueurs ; sinon, la plus grande taille
   qui tient, et l'écart noté.
8. Repère et fondu en tokens de mouvement, sans rebond, neutralisés par
   `prefers-reduced-motion`.
9. Bandeau conforme à la planche, pictogramme `x01` en 24 px ; en portrait 390 px avec Set, DI et
   DO, aucun texte rogné ni retour à la ligne imprévu ; en paysage, la hauteur du bandeau ne fait
   rien déborder (critère 2).
10. Gardes vertes (`themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`), lint,
    typecheck, tests, build.

## Contraintes

- Tokens seulement, ni dégradé ni halo, angle vif ; texte français dans `labels.ts`.
- Zones lecture / saisie jamais empilées en paysage (`DispositionPartie`).
- Aucune règle de jeu touchée ; l'UI ne réimplémente aucun calcul.
- Fakes, jamais de mocks ; `lint:fix` limité à `src tests`.

## Dépendances

Lots 3 `charte-typo-mouvement` (tokens de mouvement, `trace-filet`) et 4 `pictogrammes`
(`Pictogramme`), fusionnés dans `main`.

## Risques

- Reste à 5,1 rem dans 108 px à deux joueurs : rognage possible (critère 7).
- Le bandeau change de structure : la hauteur gagnée par la feuille peut être en partie reperdue.
- Le moment superposé masque la suggestion de sortie pendant son affichage (voulu).
- Paysage : régressions de mise en page invisibles en test.
- Quatre écrans changent par la disposition commune : relecture plus lourde.
- Fond laiton en Triple : contraste du chiffre `craie-vive` à vérifier en clair et en sombre.

## Zones impactées

`src/ui/composants/commun/DispositionPartie.tsx`, `MomentCelebratif.tsx`, `Batons.tsx` ;
`src/index.css` ; `src/ui/composants/x01/PaveFlechettes.tsx`, `LigneJoueur.tsx`, `Tableau.tsx` ;
`src/ui/ecrans/games/x01/X01Ecran.tsx` ; écrans Cricket, Tour du monde et entraînement
(désactivation `occupe`, emplacement du moment) ; `src/ui/labels.ts` ;
`docs/CHARTE_GRAPHIQUE.md`.

## Attentes de validation

- Tests : multiplicateur selon Simple / Double / Triple, « 0 » et « Annuler » exclus ; pavé non
  désactivé pendant `occupe` et garde toujours effective ; `MomentCelebratif` hors du flux ;
  bâtons en tirets ; bandeau (pictogramme, titre, manche).
- **Relecture à l'écran obligatoire** : quatre écrans de partie, portrait et paysage
  (844 × 390), sombre et clair ; Double et Triple armés ; une sortie (moment superposé) ; un
  changement de joueur (repère qui glisse).

## Questions bloquantes

Aucune.

## Questions non bloquantes

| Question | Owner |
| --- | --- |
| Taille finale du reste si 5,1 rem rogne | Architecture / Dev, puis relecture utilisateur |
| Teinte exacte du fond Triple (alpha du laiton), contraste vérifié dans les deux thèmes | Architecture |
| Place de DI / DO avec des sets, en portrait étroit | Architecture, confirmé à la relecture |

## Décisions prises pendant l'intake

- Les corrections de disposition, paysage, moment, clignotement et bâtons valent pour les quatre
  jeux (utilisateur).
- Filet armé sur les numéros et le 25 seulement — **écart volontaire** avec la maquette, qui
  l'appliquait aussi à « 0 » et « Annuler » (utilisateur).
- Moment de victoire superposé au bas du tableau (utilisateur).
- Bandeau de la planche des pictogrammes, pictogramme en 24 px, plutôt qu'un pictogramme de 20 px
  ajouté au bandeau actuel (utilisateur, après relecture contre la planche).
- Repère qui glisse, fondu du filet et bandeau : X01 seulement ; les autres jeux au lot 6.
- Fond teinté du Triple, repère qui glisse, fondu du filet, place du moment : issus du texte
  validé de l'étude, aucune maquette ne les dessine.
- Niveau `light` : aucune surface gravée (UI seule, aucune règle ni format persisté).
