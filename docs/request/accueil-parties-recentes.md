# Demande — accueil-parties-recentes

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-13
- **Niveau** : high
- **Commande manuelle** : `/orchestrate accueil-parties-recentes high`

> `high` choisi par l'utilisateur (`light` serait permis : a priori aucune surface gravée, rien
> de persisté, pas de domaine). Raison : un champ dérivé s'ajoute au `MatchSummary` lu par
> l'historique, et l'écran le plus ouvert de l'app est refait.

## Objectif

L'Accueil montre les parties récentes en cartes, façon DartsOn, avec un seul appel :
« Nouvelle partie ». Source : étude
[`docs/prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md`](../prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md)
(§ Accueil, « Tranché par l'utilisateur (2026-10-11) », et lot n° 3 du découpage).

## Périmètre

- **Liste** groupée en « Aujourd'hui » (jour calendaire local) et « Cette semaine » (les
  6 jours calendaires précédents, fenêtre glissante), les plus récentes d'abord. L'heure
  courante se lit par `services.clock`. Au-delà de 7 jours, les parties ne sont que dans
  l'onglet Parties.
- **Partie en cours** (la plus récente non terminée) : **première carte**, même si elle a plus
  de 7 jours ; c'est la seule carte qui porte un bouton laiton « Reprendre ».
- **Carte** :
  - un liseré à l'accent du mode (`ACCENTS_MODE`) ;
  - en titre, le nom : tapé, sinon le nom par défaut recalculé (`nomDePartie`) ;
  - dessous, le jeu et ses règles courtes, puis l'heure : « 21 h 04 » aujourd'hui,
    « mardi 21 h 10 » dans la semaine ;
  - les avatars des joueurs ; un joueur supprimé a un avatar neutre ;
  - le statut :
    - X01 : « N manches jouées », tous sets confondus ;
    - Tour du monde et Cricket : « En cours » ou « X gagne » (« Match nul » au Tour du monde) ;
    - entraînement : « N / M sorties » (`roundsWon` / `roundsPlayed`), ou « En cours » ;
  - un ✓ si la partie est terminée, avec une icône en token, pas en vert DartsOn.
- **Tap sur une carte** : une partie terminée ouvre son résumé ; une partie non terminée la
  reprend (`/partie/:id`).
- **« Abandonnée »** : une partie non terminée qui n'est **pas** la plus récente des non
  terminées. Elle reste reprenable d'un tap. La règle est **la même à l'Accueil et dans l'onglet
  Parties** (Historique) : calculée à un seul endroit, jamais enregistrée.
- **« N manches jouées »** devient un **champ dérivé** de `X01Summary` ; rien n'est enregistré.
- **Bouton « Nouvelle partie »** fixé en bas, au-dessus de la barre de navigation ; la liste
  défile.
- **État vide** (aucune partie dans la fenêtre et pas de partie en cours) : une ligne « Pas de
  partie cette semaine », plus l'invitation « Créer un joueur » si aucun profil n'existe.
- **Ce qui part** : le bloc « Partie en cours » et la feuille « Ce soir à l'oche ».
- **Ce qui reste** : l'invitation à installer (Accueil seulement, inchangée).

## Hors périmètre

- La barre du bas : faut-il passer à trois onglets, comme DartsOn ? À rediscuter dans un lot à
  part.
- La suppression d'une partie depuis l'Accueil : elle reste dans l'onglet Parties.
- Le raccourci « rejouer la même » : c'est le lot n° 4 de l'étude.
- Les écrans `/historique/:id` et `/joueurs/:id`.
- Tout changement de format enregistré : événements, schéma Dexie, `backupSchema`.

## Comportement visible

- Écran hors partie, lu et tapé à 30 cm, en portrait d'abord.
- En paysage (téléphone peu haut, variante `paysage`) : le bouton fixé ne masque pas la liste,
  et les cibles font toujours au moins 48 px.
- Thème sombre et thème clair, tokens seuls, aucun texte sous `craie/60`.
- Le bouton fixé tient compte de la barre du bas et de `env(safe-area-inset-bottom)`.

## Critères d'acceptation

1. Une partie d'aujourd'hui est sous « Aujourd'hui ». Une partie de J-6 est sous « Cette
   semaine ». Une partie de J-7 est absente, sauf si c'est la partie en cours, qui est alors la
   première carte.
2. Une partie lancée à 23 h 50 n'est plus sous « Aujourd'hui » à 0 h 10. Les tests datés ont un
   fuseau fixé, des bornes locales, et une précondition de durée du jour avant tout changement
   d'heure (`CONVENTIONS` § 11).
3. X01 : « N manches jouées » vaut 0 au départ et reste juste avec des sets (tous sets
   confondus), sur une partie en cours comme sur une partie terminée.
4. Les statuts « En cours », « Abandonnée », « X gagne », « Match nul » et « N / M sorties » sont
   justes, et identiques à l'Accueil et dans l'onglet Parties, y compris quand l'onglet Parties
   est filtré par mode.
5. Un tap ouvre le résumé d'une partie terminée ; il reprend une partie non terminée, en cours
   ou abandonnée.
6. « Nouvelle partie » est visible sans défiler, même avec 15 cartes.
7. L'état vide s'affiche avec et sans profil, et « Créer un joueur » n'apparaît que sans profil.
8. Une règle commune aux quatre modes est testée par `it.each(GAME_MODE_IDS)`, jamais par une
   liste recopiée.
9. Après une partie terminée, un import ou une suppression, l'Accueil se met à jour sans
   rechargement.

## Contraintes

- UI → use cases seulement (`useServices()`) ; jamais Dexie dans l'UI.
- Tout le français dans `labels.ts` ; « manche » à l'écran, jamais « leg ».
- Tokens de couleur seuls ; angle vif ; icônes `aria-hidden`.
- `AccueilEcran` reste importé statiquement (exception de `lazyRoutes`).
- Pas de `Date.now()` dans l'UI : l'heure passe par `services.clock` (garde `horlogeBoundary`).
- Réutiliser les composants communs (`Avatar`, `Panneau`, `Button`…), sans variante ad hoc.
- Rien n'est persisté : « Abandonnée » et « manches jouées » sont dérivés.

## Dépendances

- Lot `nom-de-partie`, livré (`cedc4a4`) : `MatchSummary.name`, `createdAt`, `nomDePartie`,
  `Services.clock`.

## Risques

- Lire toutes les parties sur l'écran le plus ouvert : l'Architecture choisit comment filtrer
  par date (port existant `GetMatchHistory` ou nouveau port).
- L'invalidation des requêtes de l'Accueil (fin de partie, import, suppression, relance).
- Le bouton fixé, combiné à la barre du bas et à la safe-area d'iPhone : un rendu qui ne se voit
  qu'à l'écran.
- La frontière de minuit et les changements d'heure dans le groupement par jour.
- La règle « Abandonnée » calculée à deux endroits divergerait : elle doit n'en avoir qu'un.

## Zones impactées

`src/ui/ecrans/AccueilEcran.tsx`, `ApercuPartie` ou une nouvelle carte commune,
`src/ui/ecrans/HistoriqueEcran.tsx`, `src/ui/labels.ts`, `MatchSummary.ts` et `summarize.ts`,
éventuellement `GetMatchHistory` ou un nouveau port driving, `docs/CHARTE_GRAPHIQUE.md`, et les
tests UI et use cases.

## Attentes de validation

- Tests Vitest et Testing Library : groupement et fenêtre (bornes locales, minuit, changement
  d'heure), statuts par mode, « Abandonnée » sur les deux écrans, manches jouées avec et sans
  sets, état vide, tap, mise à jour après les mutations.
- `lint`, `typecheck`, `test` et `build` verts.
- **Relecture à l'écran** : portrait et paysage, thème sombre et clair, avec 0, 1 et 15 parties.
  Sur un vrai téléphone : le bouton fixé et la safe-area.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Faut-il un nombre maximal de cartes avant de renvoyer à l'onglet Parties ? Owner :
  Architecture.
- La forme de « Abandonnée » (texte ou icône) et sa lisibilité. Owner : l'utilisateur, à la
  relecture à l'écran.

## Décisions prises pendant l'intake

Toutes prises par l'utilisateur le 2026-10-13, en plus de celles de l'étude du 2026-10-11 :

- La fenêtre est de 7 jours glissants : « Aujourd'hui », puis « Cette semaine » pour les
  6 jours précédents. Pas de groupe « Hier », pas de semaine calendaire.
- « Nouvelle partie » est fixé en bas et la liste défile.
- La carte d'entraînement affiche « N / M sorties ».
- L'état vide est une ligne, plus « Créer un joueur » s'il n'y a aucun profil.
- La carte porte le nom en titre, le jeu et l'heure dessous.
- « Reprendre » apparaît sur la carte en cours seulement.
- « Abandonnée » vaut aussi dans l'onglet Parties.
- Le niveau est `high`.
- La partie en cours de plus de 7 jours reste la première carte. Proposé dans le brouillon
  et validé avec lui.
