# Demande — rejouer

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-16
- **Niveau** : light
- **Commande manuelle** : `/orchestrate rejouer light`

## Objectif

Entre potes, on rejoue presque toujours la même partie. L'étape 1 de Nouvelle partie s'ouvre
sur les dernières configurations jouées : ▶ puis « Commencer », la partie démarre en **deux
touches** au lieu de six ou sept. Lot 10 de l'étude de refonte
(`docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, § Nouvelle partie — « Rejouer
d'abord », piste validée le 2026-10-13).

## Périmètre

- Section **« Rejouer »** en tête de l'étape 1 (`EtapeJeu`), sous la barre d'étapes : les
  **3 configurations distinctes les plus récentes**, la dernière jouée en tête.
- **Configuration** = mode + réglages + même **ensemble** de joueurs ; l'ordre et le nom n'en
  font pas partie. Réglages comparés = ceux que le parcours sait régler : X01 (score, manches,
  sets, sortie, entrée), Cricket (variante), Tour du monde (aucun), entraînement (sorties).
- Parties identiques **fusionnées** en une ligne « N fois ». N compte **toutes les parties
  lancées** : terminées, abandonnées ou en cours.
- Configuration dont un profil a été supprimé : **écartée** (la suivante prend sa place).
- Calcul hors de l'UI : un use case d'`application` lit l'historique (`GetMatchHistory` /
  `MatchSummary`), rien de stocké en plus.
- **▶ à 2 joueurs ou plus** (hors entraînement) : préremplit le parcours (mode, réglages,
  joueurs **dans l'ordre de la dernière fois**) et mène à l'étape **Ordre** (`cheminOrdre(mode)`),
  avec « Tirer au sort » et « Commencer ».
- **▶ en solo** (entraînement, ou mode à 1 joueur) : **lance directement** la partie.
- Les réglages préremplis **deviennent les réglages mémorisés** (`partie:*`, `entrainement:*`),
  comme s'ils avaient été choisis à la main. Retour depuis l'Ordre → étape 1.
- Sous la section, **« Ou un autre jeu »** : les 4 jeux en **rangée compacte** (pictogramme +
  nom), vers l'étape 2 comme aujourd'hui. **Sans aucune partie** dans l'historique : pas de
  section Rejouer, les tuiles 2 × 2 du lot 9 restent telles quelles.

## Hors périmètre

- Modifier ou supprimer une configuration depuis l'étape 1.
- Proposer une configuration « sans le joueur supprimé ».
- « On remet ça » des résumés (inchangé).
- Le nom de partie : ▶ ne le reprend pas ; la nouvelle partie prend le nom par défaut, le champ
  de l'étape 2 reste accessible par le retour.
- Le flag `shuffle` et la clé `partie:ordre-aleatoire` (dette du lot 9).
- Toute règle de jeu, tout événement, tout format persisté.

## Comportement visible

Tapé à 30 cm, pas un écran de partie. Planche :
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\derniers\derniers.html` (piste 2, capture
`verif-np2.png`) — visuel <https://claude.ai/artifact/7sCiB2f4JSbVKUCdpjZH16>, **avec ce que les
lots suivants ont tranché** : barre d'étapes du lot 9 en tête, **laiton unique** (lot 6b, pas de
couleur par mode), pictogrammes en `currentColor`.

Ligne : pictogramme du mode · titre « X01 · 501 » · résumé des réglages dans le vocabulaire de
`labels.ts` (« premier à 2 manches · sortie libre ») · date de la dernière fois (« hier »,
« mardi ») · « 4 fois » · pastilles des joueurs · bouton ▶ laiton ≥ 48 px avec un `aria-label`
qui dit le jeu et les joueurs.

Relecture en portrait et en paysage, 360 px, thèmes sombre et clair.

## Critères d'acceptation

1. Un historique de trois configurations distinctes jouées 4, 1 et 2 fois s'affiche en trois
   lignes, la plus récente en tête, avec le bon « N fois ».
2. Même ensemble de joueurs dans un autre ordre = **même** configuration ; nom différent = même
   configuration ; score, variante ou nombre de sorties différent = configuration **différente**.
3. Une configuration dont un joueur a été supprimé n'apparaît pas ; la quatrième la remplace.
4. ▶ (≥ 2 joueurs) ouvre l'Ordre avec les joueurs dans l'ordre de la partie la plus récente de
   cette configuration et les mêmes réglages ; « Commencer » lance une partie dont l'événement
   d'ouverture porte ces réglages, **sans** `name`.
5. ▶ en solo lance la partie directement, avec les mêmes réglages.
6. Après ▶, l'étape 2 (par le retour ou à la prochaine Nouvelle partie) montre les réglages
   repris.
7. Historique vide : l'étape 1 actuelle, sans section Rejouer.
8. La liste suit la partie qui vient d'être lancée ou terminée (clé de requête sous
   `['historique']`).
9. Une configuration non reproductible par le parcours (valeur hors des listes de
   `reglagesPossibles.ts`, cibles différentes du défaut) est écartée, jamais rejouée faussement.

## Contraintes

- UI → use cases (`useServices()`), aucune règle réimplémentée ; calcul testé avec des fakes.
- Français dans `labels.ts` ; jetons de couleur seulement ; angle vif ; pictogrammes
  `aria-hidden` ; cibles ≥ 48 px ; routes inchangées (une route par étape).
- **Lot en parallèle** : worktree `C:\Users\kevin\Documents\Flechettes-rejouer`, **port 5202**
  pour les captures du Dev ; `labels.ts`, charte, CONVENTIONS partagés avec le lot
  `reglages-par-usage` (conflits au rebase, `orchestrate` § Lots en parallèle).

## Dépendances

Lots 9 (`nouvelle-partie-parcours`), 4 (pictogrammes), 6b (laiton unique) : sur `main`.

## Risques

- **Fenêtre de lecture** : seules les N dernières parties sont lues ; « 4 fois » compte dans
  cette fenêtre, pas sur toute la base.
- **Lancement solo en un appui** : un appui involontaire démarre une partie. Assumé ; la partie
  reste abandonnable.
- Conflits au rebase sur `labels.ts` et la charte avec l'autre lot.

## Zones impactées

- `src/core/application/` : nouveau port driving + use case ; câblage dans
  `src/composition/container.ts`.
- `src/ui/ecrans/nouvelle-partie/EtapeJeu.tsx`, `NouvellePartieEcran.tsx`.
- `src/ui/hooks/useNouvellePartie.ts` : préremplissage (exposer `setJoueurEntrainement`).
- `src/ui/labels.ts`, `src/ui/clesRequetes.ts`.
- `docs/CHARTE_GRAPHIQUE.md` § Parcours ; `CLAUDE.md` § Décisions structurantes (une ligne
  « Rejouer »).

## Attentes de validation

- Tests unitaires du calcul : fusion et compteur, ordre indifférent, nom ignoré, profil
  supprimé, plus de 3 configurations, historique vide, abandonnées et en cours comptées,
  configuration non reproductible.
- Tests UI : ▶ vers l'Ordre (ordre repris), ▶ solo qui lance, réglages mémorisés, absence sans
  historique.
- Lint, typecheck, `npx vitest run`, build.
- **Relecture à l'écran** : portrait et paysage, 360 px, sombre et clair.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Taille de la fenêtre d'historique lue (proposé : 50, comme Parties). Owner : Archi.
- Format de la date relative : reprendre les libellés existants de l'Accueil si possible.
  Owner : Archi, puis l'utilisateur à la relecture.

## Décisions prises pendant l'intake

- Rangée compacte des 4 jeux sous Rejouer ; tuiles 2 × 2 sans historique (utilisateur).
- Solo : ▶ lance directement (utilisateur).
- Rejouer réécrit les réglages mémorisés (utilisateur).
- « N fois » compte toutes les parties lancées (utilisateur).
- Nom non repris ; configuration non reproductible écartée ; retour depuis l'Ordre → étape 1
  (intake, d'après la planche et le code).
- Niveau **`light`** : aucune surface gravée — ni domaine, ni événement, ni Dexie /
  `backupSchema` ; routes et trois étapes inchangées (même raisonnement qu'au lot 9).
