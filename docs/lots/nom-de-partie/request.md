# Demande — nom-de-partie

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-12
- **Niveau** : high
- **Commande manuelle** : `/orchestrate nom-de-partie high`

> `high` imposé : le lot touche un format persisté (événements d'ouverture, `backupSchema`) et
> le domaine (`src/core/domain/`) — surfaces gravées, `light` interdit.

## Objectif

Donner un nom à chaque partie. Le nom proposé dépend du moment de la journée
(« Dimanche soir »), on peut le remplacer à la création, et il s'affiche dans l'historique,
sur le résumé de fin et pendant la partie. Source : étude
[`docs/prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md`](../prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md)
(« Retenu par l'utilisateur », lot n° 2).

## Périmètre

- **Un champ « Nom de la partie »** en haut de l'étape 1 de Nouvelle partie, au-dessus des
  cartes de jeu, pour les quatre jeux (entraînement compris), pré-rempli avec le nom par
  défaut.
- **Le nom par défaut** se calcule à partir de la date de création, à l'heure locale, sous la
  forme « Jour tranche » :
  - matin : de 5 h à 12 h ;
  - après-midi : de 12 h à 18 h ;
  - soir : de 18 h à minuit ;
  - nuit : de minuit à 5 h, **rattachée à la veille** (samedi 1 h → « Samedi nuit »).
- **Seul un nom tapé est enregistré**, espaces de début et de fin retirés. Un champ vide, fait
  d'espaces, ou laissé sur le nom proposé n'enregistre rien : le nom est alors recalculé à
  l'affichage. Les anciennes parties ont donc un nom, sans migration.
- **Le nom tapé est enregistré dans le journal**, comme champ **facultatif** de l'événement
  d'ouverture de chaque mode (sous réserve de la question non bloquante n° 1). Une partie
  sans ce champ reste valide et rejouable.
- **`backupSchema`** lit ce champ facultatif : une vieille sauvegarde sans nom s'importe
  toujours ; l'export emporte le nom.
- **« Rejouer »** garde un nom tapé ; sinon, la nouvelle partie prend le nom calculé d'après
  sa propre date.
- **Le nom s'affiche** :
  - en titre de chaque partie dans l'Historique ;
  - en tête du résumé de fin, pour les quatre jeux ;
  - en petit, dans le bandeau du haut pendant la partie, pour les quatre jeux, en portrait et
    en paysage.

## Hors périmètre

- Renommer une partie après sa création.
- L'Accueil en parties récentes (lot `accueil-parties-recentes`), donc le nom sur la carte
  « Reprendre ».
- La recherche ou le tri par nom.
- Le nom dans les statistiques.
- Tout changement de règle de jeu.

## Comportement visible

- **Étape 1** (tapée à 30 cm) : un champ d'une ligne, au moins 48 px de haut, libellé
  « Nom de la partie ». On l'édite, puis on touche une carte. Le nom suit aux étapes 2 et 3 et
  se retrouve si l'on revient en arrière avec le bouton retour.
- **Nouvelle partie suivante** : on repart du nom par défaut ; un nom tapé n'est pas mémorisé
  d'une partie à l'autre.
- **Historique** : le nom en titre, puis la ligne actuelle (jeu, réglages, joueurs).
- **Résumé de fin** : le nom en tête.
- **Pendant la partie** : le nom en texte discret dans le bandeau du haut. Il ne prend pas de
  place sur la zone des chiffres géants (lue à 2-3 m) ni sur la zone de saisie. Un nom long
  est tronqué avec « … ». Portrait et paysage.

## Critères d'acceptation

1. À 21 h un dimanche, le champ propose « Dimanche soir ».
2. Bornes des tranches, à l'heure locale : 4 h 59 → nuit de la veille ; 5 h → matin ;
   11 h 59 → matin ; 12 h → après-midi ; 17 h 59 → après-midi ; 18 h → soir ; 23 h 59 → soir ;
   0 h → nuit de la veille.
3. Une partie lancée sans toucher au champ, ou avec un champ vide ou fait d'espaces,
   n'enregistre aucun nom dans son journal et affiche le nom calculé d'après sa date de
   création.
4. Une partie lancée avec « Finale des potes » (espaces autour compris) l'enregistre sans les
   espaces et l'affiche dans l'historique, sur le résumé et pendant la partie.
5. Les critères 3 et 4 valent pour les quatre jeux : X01, Tour du monde, Cricket,
   entraînement.
6. Un nom de plus de 30 caractères ne peut pas être saisi, et le domaine le refuse.
7. Une partie enregistrée avant le lot, sans nom, s'affiche avec le nom calculé d'après sa
   date et se rejoue sans erreur.
8. Une sauvegarde d'avant le lot s'importe ; un export puis un import restituent le nom tapé ;
   un nom invalide dans un fichier importé (pas du texte, ou trop long) est refusé.
9. « Rejouer » garde un nom tapé et recalcule un nom par défaut.
10. Étape 1 → étape 2 → retour du téléphone → le nom tapé est toujours là.
11. Pendant la partie, le nom ne déborde pas et ne décale pas la zone de lecture, en portrait
    comme en paysage (relecture à l'écran).

## Contraintes

- Le domaine reste sans `Date`. Le calcul du nom par défaut est du **libellé** : il vit dans
  `src/ui/labels.ts`.
- Une valeur persistée ne se renomme pas (`rules/persistence.md`) : aucun type d'événement ne
  change de nom, on **ajoute** un champ facultatif.
- Tout le texte affiché dans `labels.ts` ; champ ≥ 48 px ; couleurs par les tokens.
- Jours et tranches tirés d'une table du code, pas de `toLocaleString`, pour un résultat
  exact et testable.

## Dépendances

- Lot `nouvelle-partie-en-etapes`, fusionné (`0893aa2`) : étape 1 (`EtapeJeu`) et
  `useNouvellePartie`.

## Risques

- Fuseau horaire et heure d'été : calcul à l'heure locale de l'appareil ; les tests
  construisent leurs bornes en heure locale (`rules/testing.md`).
- Bandeau de partie déjà chargé, surtout en X01 avec sets et en paysage.
- Politique de confidentialité : si son texte énumère ce qui est stocké, l'enrichir et changer
  sa date (`CLAUDE.md` § DS).

## Zones impactées

- Domaine : événements d'ouverture (`MatchEvent.ts`) et une fabrique validante du nom.
- Application : démarrage des quatre modes, `RestartMatchUseCase`, `summarize` /
  `MatchSummary`, `backupSchema`.
- UI : `useNouvellePartie`, `EtapeJeu`, écrans de partie et résumés des quatre modes,
  `HistoriqueEcran`, `ApercuPartie`, `labels.ts`.
- Tests.

## Attentes de validation

- Tests unitaires du nom par défaut, toutes les bornes, en heure locale.
- Tests de la fabrique du domaine (vide, espaces, 30 / 31 caractères).
- Tests de `backupSchema` : vieille sauvegarde, aller-retour export / import, nom invalide.
- Tests de `RestartMatch`, avec et sans nom tapé.
- Tests d'interface : étape 1, retour arrière, historique, résumé et partie pour les quatre
  jeux.
- Relecture à l'écran : bandeau de partie en portrait et en paysage avec un nom de 30
  caractères, thèmes sombre et clair.

## Questions bloquantes

Aucune.

## Questions non bloquantes

| # | Question | Owner |
|---|---|---|
| 1 | Où vit le nom : dans l'événement d'ouverture (préférence de l'intake) ou à côté du journal, dans `MatchRecord` ? | archi-authority |
| 2 | L'heure courante de l'étape 1 vient-elle du port `Clock` exposé à l'UI, ou de `Date` dans l'UI ? | archi-authority |
| 3 | Le texte de la politique de confidentialité doit-il changer ? | sec, à la lecture de `SECTIONS_CONFIDENTIALITE` |
| 4 | Forme exacte du nom dans le bandeau de chaque mode | dev, puis relecture à l'écran par l'utilisateur |

## Décisions prises pendant l'intake

- Nom par défaut « Jour tranche » : matin 5-12 h, après-midi 12-18 h, soir 18 h-minuit,
  nuit 0-5 h rattachée à la veille (utilisateur).
- Seul un nom tapé est enregistré ; le nom par défaut est recalculé à l'affichage
  (utilisateur).
- Pas de renommage après la création (utilisateur).
- Affichage : Historique, résumé de fin, pendant la partie (utilisateur).
- L'entraînement a aussi un nom (utilisateur).
- « Rejouer » garde un nom tapé, sinon recalcule (utilisateur).
- Limite de 30 caractères, espaces autour retirés ; nom tapé non mémorisé d'une partie à
  l'autre (proposés par l'intake, acceptés par l'utilisateur).
