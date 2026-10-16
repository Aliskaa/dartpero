# Demande — regles-du-jeu

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-15
- **Niveau** : high
- **Commande manuelle** : `/orchestrate regles-du-jeu high`

## Objectif

Mettre les règles de chaque jeu à portée d'un appui : un **livre ouvert** à l'étape 2 et dans le
bandeau du match ouvre une feuille **par-dessus** l'écran, rangée en **rubriques repliables** sur
le plan des pages DartsOn, dont le texte décrit **les règles que Dartpéro applique aujourd'hui**,
selon les réglages de la partie. Le lot rend vrais l'écran et `CLAUDE.md` sur la sortie libre et
grave les règles de l'entraînement (constats #3, #12, #25 de `.ai/architecture-context.md`).

**Planche validée** (2026-10-15), à suivre **à l'identique** :
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\regles\regles-rubriques.html` —
<https://claude.ai/artifact/86bxSsA98uZQpkp6GWZ7pb>. Elle remplace, pour les rubriques,
`regles.html` du même dossier (<https://claude.ai/artifact/EJfhq2GeRgk2zkziXCRM2N>, validée le
2026-10-13), dont le reste est repris (livre, feuille par-dessus, fermeture, paysage).
Contexte : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md` § Les règles de chaque
jeu et lot 11 du découpage.

## Périmètre

1. **Livre ouvert** (`BookOpen` de `lucide-react`, `aria-hidden`, bouton ≥ 48 px, nom accessible
   « Règles du <jeu> ») :
   - à droite de l'en-tête de l'**étape 2** (`EnTeteEtape`), pour les quatre jeux ;
   - à droite du **bandeau de match** des quatre modes (X01, Cricket, Tour du monde, entraînement) ;
   - état actif (fond laiton) tant que la feuille est ouverte.
2. **Retrait de « Les règles en entier »** dans la fiche de réglages ; la ligne de règles de
   chaque fiche reste. Les sept cibles du Cricket et le parcours en 21 cases passent dans la feuille.
3. **Feuille de règles** (composant commun) :
   - en-tête : pictogramme du jeu, « Règles du <jeu> », « Telles que Dartpéro les applique », croix ;
   - **toujours ouverts** : l'encadré « Ce soir » (même texte que le récapitulatif de la fiche) et
     la rubrique 1 « En bref » ;
   - **rubriques repliables** (48 px, `aria-expanded`, toutes repliées à chaque ouverture,
     plusieurs ouvrables à la fois), numérotées dans cet ordre : Marquer, Gagner, Cas particuliers,
     Les sorties (X01 seulement), Un exemple, Questions fréquentes, Ce que l'app compte, Les
     réglages possibles ;
   - la feuille défile ; pas de bande « Défiler pour la suite » ;
   - ouverte **par-dessus** l'écran, jamais par un changement de route : la volée en cours est
     conservée.
4. **Fermeture** : croix, ou **retour du téléphone** (entrée d'historique ajoutée à l'ouverture,
   sans changer de route).
5. **Disposition** : portrait — pleine hauteur à l'étape 2, mi-hauteur sur le match, voile sur le
   reste ; paysage — la feuille prend le **côté droit**, la zone de lecture reste visible à gauche.
6. **Texte des quatre jeux**, dans `labels.ts` :
   - X01 et Cricket : **mot pour mot celui de la planche** (section « Le texte complet, à relire ») ;
   - entraînement et Tour du monde : même plan, écrits d'après `CLAUDE.md` (Tour du monde : 20 → 1
     puis la bulle, toucher le secteur suffit, trois cibles possibles par volée, on finit le tour
     de table, départage au moins de fléchettes, match nul ; entraînement : plage, une volée par
     reste, toujours sur un double, aucun reste impossible) ;
   - le texte **suit les réglages** : la règle de ce soir en entier, l'autre réglage en gris
     (sortie et entrée au X01, variante au Cricket) ; « Les réglages possibles » met ceux de ce
     soir en laiton ;
   - X01, « Les sorties » : la liste de ce soir en rouge, l'autre en gris. Sortie libre : sortie
     proposée dès **180 ou moins**, pas de finish à **179, 178, 176, 175, 173, 172, 169, 166,
     163**. Sur un double : **170** au plus, bogey numbers **169, 168, 166, 165, 163, 162, 159**.
7. **Domaine** : en sortie libre, `suggestCheckout` propose **S1** à un reste de 1
   (`checkout.ts:83`). Sur un double, inchangé.
8. **Écran X01** : « Pas de finish » suit la sortie de la partie (170 sur un double, 180 en sortie
   libre), au lieu du 170 en dur de `src/ui/composants/x01/Tableau.tsx:136`.
9. **Documentation** :
   - `CLAUDE.md` § Checkouts précisé : 170 et bogey numbers sur un double ; 180, la liste des
     restes sans finish et la suggestion dès 1 en sortie libre ;
   - nouveau § **Règles de l'entraînement**, écrit d'après `checkout-practice/config.ts` et
     `rules.ts` ;
   - décision « règles au livre ouvert, par-dessus, texte = règles appliquées » dans les
     Décisions structurantes ;
   - charte (§ Parcours, § Écran de match) et `PROJECT_PLAN.md` mis à jour.

## Hors périmètre

- **Les règles façon DartsOn retenues par l'utilisateur** — une étude dédiée
  (`docs/prospective/`), puis un lot `high` par changement, chacun mettant à jour la rubrique de
  son jeu :
  - Tour du monde : sens au choix, tour de table en option ;
  - entraînement : plages prédéfinies, sortie au choix ;
  - X01 : master in / out, départ libre (1001, score libre), limite de tours, handicaps ;
  - Cricket : plusieurs manches, No Score, overkill, Random et Hidden.
- Le texte de DartsOn lui-même (droit d'auteur) : seul le plan est repris.
- Les règles sur les résumés, l'Accueil, l'étape 1 ou l'étape Ordre.
- Le lot 13 `volee-partielle`.
- Le reste de l'audit (#11, #21…).

## Comportement visible

- **Étape 2** : le livre à droite du titre ; un appui ouvre la feuille repliée, « Ce soir » en
  tête. Changer un réglage puis rouvrir change « Ce soir », le texte et les listes.
- **Match, portrait** : le livre à droite du bandeau ; la feuille monte à mi-hauteur, le haut du
  tableau reste visible sous le voile. Fermer rend la volée en cours intacte.
- **Match, paysage** : la feuille occupe la moitié droite.
- **Lecture** : la feuille se lit à 30 cm par celui qui tient le téléphone ; plancher `craie-3`,
  cibles de 48 px, tokens en paires de rôle, dans les **deux thèmes** (la planche n'est dessinée
  qu'en sombre : le clair se dérive des tokens, sans couleur en dur).

## Critères d'acceptation

1. Le livre est présent à l'étape 2 des quatre jeux et sur l'écran de match des quatre modes.
   « Les règles en entier » n'existe plus.
2. Ouvrir ou fermer la feuille ne change jamais l'URL. Sur le match, une volée de 1 ou 2
   fléchettes saisies est intacte après la fermeture.
3. Feuille ouverte, le retour du téléphone la ferme sans quitter l'écran ; un second retour se
   comporte comme aujourd'hui. Fermer à la croix ne laisse pas de « retour fantôme ».
4. Les rubriques sont toutes repliées à chaque ouverture ; chacune se déplie et se replie,
   `aria-expanded` à jour.
5. « Ce soir » et le texte suivent les réglages : sortie, entrée, sets (X01), variante (Cricket),
   nombre de restes (entraînement). Chaque cas est testé.
6. Le texte X01 et Cricket est celui de la planche. Chaque phrase des quatre jeux se rattache à
   `CLAUDE.md` ou au code. Les deux points signalés par la planche sont vérifiés dans le code
   (cibles du Cricket fermées dans n'importe quel ordre ; Cricket hors des statistiques,
   `GetPlayerStatsUseCase.ts:62`), et le texte est corrigé s'il le faut.
7. `suggestCheckout(1, n, { doubleOut: false })` renvoie `[S1]` ; `suggestCheckout(1, n, {
   doubleOut: true })` renvoie toujours `null`.
8. La liste des restes sans finish en sortie libre est vérifiée par un test contre l'algorithme,
   comme `BOGEY_NUMBERS`. Sur l'écran X01, « Pas de finish » s'affiche à 172-179 en sortie libre
   et jamais au-dessus de 170 sur un double.
9. La feuille est un dialogue nommé ; le focus y entre à l'ouverture et revient au livre à la
   fermeture.
10. `npm test`, `npm run lint`, `npm run build` verts, gardes comprises (`themeBoundary`,
    `typographieBoundary`, `lazyRoutes`, `hexagonalBoundary`).

## Contraintes

- Planche suivie à l'identique ; un écart se signale, il ne se tranche pas en lot.
- Tout le français dans `labels.ts` ; « manche » à l'écran, jamais « leg » ni « best of N ».
- Double out décoché à l'écran, `true` dans le domaine : ne pas aligner.
- Aucune route nouvelle ; la feuille n'est pas un écran lazy de plus.
- `prefers-reduced-motion` respecté (montée de la feuille, chevrons).
- `CLAUDE.md` mis à jour dans le même lot que le texte qui s'y rattache.

## Dépendances

- Lot 4 `pictogrammes` et lot 9 `nouvelle-partie-parcours` (faits, `main` à `5644892`).

## Risques

- **Entrée d'historique** de la feuille : retour fantôme si elle n'est pas dépilée à la croix ;
  cohabitation avec React Router et le parcours en routes — à concevoir par l'architecte.
- **`checkout.ts`** : l'entraînement (toujours sur un double) et le tirage de ses restes
  (`checkout-practice/config.ts:61-62`) ne doivent pas bouger.
- **Paysage** sur les petites hauteurs.
- **Texte long** : troncature, contraste en thème clair.
- Angles morts des tests : contraste, défilement réel, lisibilité.

## Zones impactées

- `src/core/domain/services/checkout.ts` et ses tests.
- `src/ui/labels.ts` (textes des quatre jeux ; retrait de `LIBELLE_REGLES_EN_ENTIER` et des
  paragraphes devenus inutiles, dont `PARAGRAPHE_X01` « à valider »).
- `src/ui/composants/commun/` (feuille de règles, `BandeauMatch`).
- `src/ui/ecrans/nouvelle-partie/EnTeteEtape.tsx`, `ReglagesJeu.tsx`.
- `src/ui/composants/x01/Tableau.tsx`.
- Écrans de match des quatre modes, si le bandeau ne suffit pas.
- `tests/ui/nouvellePartie.test.tsx`, `tests/ui/manches.test.tsx` (« Les règles en entier »).
- `CLAUDE.md`, `docs/CHARTE_GRAPHIQUE.md`, `docs/PROJECT_PLAN.md`, glossaire si besoin,
  `.ai/architecture-context.md` régénéré.

## Attentes de validation

- Tests Vitest + Testing Library pour les critères 1 à 9.
- **Relecture à l'écran** : étape 2 et match, portrait et paysage, sombre et clair ; relecture
  par l'utilisateur du texte de l'entraînement et du Tour du monde (non dessinés sur la planche).

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Hauteur de la feuille sur le match, sur un petit téléphone : à ajuster à la relecture à
  l'écran. Owner : utilisateur.
- Texte de l'entraînement et du Tour du monde, écrit pendant le lot sur le plan validé : à
  relire à l'écran. Owner : utilisateur.

## Décisions prises pendant l'intake

- **Niveau `high` imposé** : le lot touche `src/core/domain/` et des règles gravées de
  `CLAUDE.md` (§ Checkouts, nouveau § Entraînement) ; l'étude suggérait `light`.
- **Entraînement** : ses règles se gravent dans `CLAUDE.md`, d'après le code (ferme #3).
- **Reste de 1 en sortie libre** : corrigé dans le domaine dans ce lot (S1).
- **Cricket** : la variante de ce soir en entier, l'autre en une ligne grise.
- **Retour du téléphone** : il ferme la feuille, par une entrée d'historique sans changement de
  route.
- **Sortie libre** : la liste des restes sans finish est gravée et écrite, et « Pas de finish »
  suit la sortie sur l'écran X01 (ferme #12).
- **Plan de DartsOn** : rubriques repliables, avec un exemple, des questions fréquentes, ce que
  l'app compte et les réglages possibles. Planche `regles-rubriques.html` validée (« C'est
  parfait »).
- **Les changements de règles façon DartsOn** sont voulus par l'utilisateur, qui rouvre en
  connaissance de cause des décisions gravées (sens du Tour du monde, tour de table, une volée par
  reste à l'entraînement). Ils restent **hors de ce lot** : une étude, puis un lot `high` chacun.
  Ce lot décrit les règles actuelles.
