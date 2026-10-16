# Demande — statistiques-podium

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-15
- **Niveau** : high
- **Commande manuelle** : `/orchestrate statistiques-podium high`

## Objectif

Rendre l'écran Statistiques moins strict sans ajouter de statistique : il s'ouvre sur la cible
d'un joueur en grand, puis des cartes de podium disent qui mène et de combien. Lot 8 de l'étude
[`docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`](../prospective/2026-10-13-NEW-revision-charte-graphique.md)
§ Écran Statistiques.

## Périmètre

1. **Période** inchangée (Aujourd'hui · 7 jours · 30 jours · Tout, « Tout » par défaut).
2. **Sélecteur de joueurs** : onglets avatar + nom, actif souligné laiton. Il ne pilote **que la
   cible** : les cartes du podium restent identiques quel que soit le joueur choisi.
3. **Cible en grand** (`CarteImpacts`, échelle propre au joueur), puis une rangée de 4 cases :
   ses 3 zones favorites (« S20 / 160 fois ») et ses fléchettes hors cible.
4. **Joueur mémorisé** : à l'ouverture, la cible montre le dernier joueur consulté
   (`usePreference`, identifiant du joueur). Repli sur le premier de la moyenne si ce joueur n'a
   aucune fléchette sur la période choisie ou si son profil a été supprimé.
5. **Cartes du podium**, dans l'ordre de la planche — le premier en grand avec son chiffre, tous
   les joueurs en barres proportionnelles, barre du premier en laiton :
   - **Moyenne**, bascule à trois positions **Moyenne · First 9 · Meilleure volée**
     (`highestVisit`) ; le titre de la carte suit la bascule.
   - **Victoires** : classées sur les parties gagnées ; le premier en « 9 / 16 » (gagnées / jouées
     par lui) ; ligne de détail **pour chaque joueur** : parties gagnées sur jouées, manches
     gagnées sur jouées.
   - **Grosses volées** : 180 / 140+ / 100+ en bâtons de craie groupés par cinq, une rangée par
     seuil et par joueur, nombre écrit après. **Au plus 10 groupes (50 bâtons)** ; au-delà,
     10 groupes pleins puis le nombre exact.
   - **Finitions**, planche à l'identique : trois bascules **% doubles · Plus haut · Manche**, et
     la ligne de bas de carte « Plus haut finish : X, 121 · Manche la plus courte : Y,
     15 fléchettes ». Manche : petit vaut mieux (classement inversé, largeur = min ÷ valeur).
6. **Pictogrammes en tête de carte** (20 px, `aria-hidden`) : `moyenne`, `victoire`,
   `grosses-volees`, `sortie`.
7. **Politique de confidentialité** (`SECTIONS_CONFIDENTIALITE`, `src/ui/labels.ts`) : la liste du
   localStorage gagne « le dernier joueur consulté dans Statistiques (son identifiant interne) »,
   et la date de la politique est mise à jour.
8. **Charte** (§ Composants) : cartes du podium et bâtons de craie documentés. Le commentaire de
   `PanneauImpacts` est nuancé : « jamais une carte isolée derrière un sélecteur » ne vaut plus
   que pour le résumé de partie.

## Hors périmètre

- Aucune statistique nouvelle : `GetPlayerStats`, `CareerStats`, le domaine, inchangés.
- Le résumé de fin de partie (garde `PanneauImpacts` côte à côte).
- Fiche joueur complète, cible partagée à points colorés (écartées le 2026-10-13).
- Statistiques Cricket / Tour du monde / entraînement (l'écran reste X01).

## Comportement visible

- Écran de consultation, lu à 30 cm, pas à 2-3 m. Portrait de référence ; en paysage
  (844 × 390), l'écran défile, aucun défilement horizontal de page, cible bornée en largeur.
- **Bascules** : retour au premier choix à chaque ouverture (seul le joueur est mémorisé).
- **Sélecteur** : au-delà de la largeur, défilement horizontal ; chaque onglet ≥ 48 px.
- **Sans occasion** : « — », jamais « 0 % » (`pourcent`) ; plus haut finish à 0 ou meilleure
  manche absente → « — », barre vide, dernier rang ; un seuil sans volée → « — » en `craie-3`.
- **Ex aequo en tête** : le premier dans l'ordre renvoyé par `GetPlayerStats` (moyenne
  décroissante) prend la grande ligne ; toutes les barres à égalité avec lui sont en laiton.
- **Couleurs des bâtons** : 180 laiton, 140+ `craie`, 100+ `craie-2` — jamais d'alpha (la
  planche utilisait `craie` à 70 %).
- États vides (« Aucune partie au compteur » / « Rien sur cette période ») inchangés.

## Critères d'acceptation

1. L'ouverture montre la cible du dernier joueur consulté ; repli sur le premier de la moyenne
   si ce joueur n'a aucune fléchette sur la période, ou si son profil a été supprimé.
2. Changer de joueur change la cible et ses 4 cases, sans toucher aux cartes.
3. Chaque bascule reclasse sa carte et recalcule ses barres ; Manche classe en ordre croissant.
4. Bâtons exacts jusqu'à 50, plafonnés à 10 groupes au-delà, nombre toujours écrit.
5. Chaque carte a un nom accessible ; chaque valeur se lit en texte (bâtons et barres
   `aria-hidden`).
6. La politique cite la nouvelle clé et sa date a changé.
7. Gardes verts : `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `lazyRoutes`,
   `horlogeBoundary`.

## Contraintes

- UI seulement (`src/ui/`) ; tokens en paires de rôle, angle vif, plancher `craie-3` ; tout le
  français dans `labels.ts` (« manche », jamais « leg »).
- Préférence par `usePreference` (`LocalStoragePreferences`), jamais une donnée de partie.
- Planche suivie **à l'identique**, hors écarts listés ici :
  `C:\Users\kevin\Documents\Flechettes\docs\maquettes\stats\stats.html` (écran « Retenue ·
  13 octobre », rendu `verif-ecran4.png`), et <https://claude.ai/artifact/UcmyFeC4SdDRnrFASvuGEP>.

## Dépendances

Lot 4 `pictogrammes` (fait).

## Risques

- Une donnée locale de plus, à tenir vraie dans la politique publique — raison du niveau `high`
  (surface gravée : décision « politique » de `CLAUDE.md` § Décisions structurantes).
- Rendu des bâtons et barres en thème clair (contraste de `craie-2` sur papier) : visible à
  l'écran seulement.
- `PanneauImpacts` / `CarteImpacts` partagés avec le résumé de partie : pas de régression.

## Zones impactées

`src/ui/ecrans/StatistiquesEcran.tsx` ; nouveaux composants (carte de podium, bâtons ; dans
`composants/commun/` s'ils sont réutilisables) ; `CarteImpacts` (grand format sans légende) ;
`src/ui/labels.ts` (libellés, politique) ; `docs/CHARTE_GRAPHIQUE.md` ; tests UI.

## Attentes de validation

- Tests Testing Library : mémorisation et ses deux replis ; sélecteur qui ne pilote que la
  cible ; trois bascules de chaque carte (ordre inversé de Manche) ; plafond des bâtons (49, 50,
  51, 312) ; « — » ; ex aequo ; texte de la politique.
- Relecture à l'écran : portrait et paysage, sombre et clair, avec 1, 3 et 6 joueurs.

## Questions bloquantes

Aucune.

## Questions non bloquantes

| # | Question | Owner |
| - | --- | --- |
| 1 | Nom de la clé de préférence (p. ex. `statistiques:joueur`) | architecte |
| 2 | Découpage des composants (`commun/` ou local à l'écran) | architecte |

## Révision 1 — 2026-10-15, en cours de lot (après Test)

Ajout de périmètre demandé par l'utilisateur, à intégrer **dans ce lot** (choix explicite, contre
la recommandation d'un lot à part). Le snapshot `docs/lots/statistiques-podium/request.md` reste
la version initiale ; cette révision fait foi pour la suite.

1. **N premiers, puis « tout voir »** : Moyenne (les trois bascules) **5**, Victoires **5**,
   Grosses volées **3**, Finitions **5**. Le bouton n'apparaît que si la liste dépasse **N + 1**
   (jusqu'à N + 1 joueurs, tout s'affiche).
2. **Ex aequo à la coupure** : si exactement **deux** joueurs sont à égalité au rang de coupure,
   on montre les deux ; s'ils sont **plus de deux**, on coupe net à N.
3. **Liste complète dans un modal** (par-dessus l'écran), qui se ferme avec le **bouton retour du
   téléphone** sans quitter Statistiques.
4. **Grosses volées classées** par une bascule **180 · 140+ · 100+** (180 par défaut), comme les
   autres cartes ; les 3 premiers sont ceux du seuil choisi.
5. **Victoires** : la ligne de détail disparaît. Chaque ligne affiche en petit, à droite du nombre
   de victoires, « victoires / parties jouées » (ex. « 17 / 32 »), comme la grande ligne. Les
   manches ne s'affichent plus nulle part.
6. **Finitions** : la ligne de bas de carte disparaît.

Inchangés : politique et clé de préférence, cible et sélecteur, règles de teinte (Q1, Q2, gate
Dev).

## Décisions prises pendant l'intake

- **Joueur mémorisé** : oui, avec mise à jour de la politique → niveau `high`.
- **Finitions** : planche à l'identique (trois bascules et ligne de bas de carte).
- **Meilleure volée** : troisième bascule de la carte Moyenne, titre de carte qui suit la bascule.
- **Bâtons** : 10 groupes au plus, puis le nombre exact.
- **Défauts validés** : détail des manches pour chaque joueur (Victoires), pictogrammes
  `moyenne` / `victoire` / `grosses-volees` / `sortie`, règle d'ex aequo, couleurs des bâtons
  en tokens pleins, bascules non mémorisées.
