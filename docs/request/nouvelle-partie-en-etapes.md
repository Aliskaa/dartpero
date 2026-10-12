# Demande — nouvelle-partie-en-etapes

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-11
- **Niveau** : high
- **Commande manuelle** : `/orchestrate nouvelle-partie-en-etapes high`

## Objectif

Remplacer la page unique « Nouvelle partie » par un parcours en **trois étapes**, une question
par écran, sur le modèle de DartsOn — en gardant la charte « pub anglais ». Étude source :
[2026-10-11-NEW-nouvelle-partie-en-etapes.md](../prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md).

## Périmètre

1. **Étape 1 — Le jeu** : une carte par jeu (X01, Cricket, Tour du monde, **Entraînement**),
   en liste verticale. Liseré `ACCENTS_MODE`, titre, deux lignes de règles. Toucher une carte
   mène à l'étape 2.
2. **Étape 2 — Joueurs et réglages** : le jeu choisi est rappelé en titre.
   - Joueurs en **rangée d'avatars carrés** ; un **×** sur chacun le retire de la partie (pas
     de la base).
   - Le **+** ouvre un menu à deux entrées :
     - **Nouveau joueur** : boîte de dialogue à un champ, « Annuler » / « Terminé » ; le joueur
       créé rejoint la partie ;
     - **Sélectionner un joueur existant** : écran plein, liste cochable ; sous chaque nom
       « N manches » (manches X01 jouées), **rien** si le joueur n'a jamais joué au X01.
   - Réglages du jeu choisi :
     - X01 : score de départ, manches à gagner, **sets à gagner** (nouveau), double out,
       double in ;
     - Cricket : variante ;
     - Tour du monde : rien à régler ;
     - Entraînement : **un seul** joueur + nombre de sorties (5 / 10 / 20).
3. **Étape 3 — Ordre de jeu** (seulement à partir de 2 joueurs) : **glisser-déposer** par
   poignée, les flèches ↑↓ disparaissent ; bascule « Ordre aléatoire » conservée (poignées
   masquées quand elle est active) ; bouton « Commencer ». Entraînement ou partie à un joueur :
   « Commencer » directement à l'étape 2.
4. **« Manche » remplace « leg » partout à l'écran** : `labels.ts`, `libelleLegs` /
   `libelleLegsCourt`, tableau, résumés, stats, annonces vocales. Le code garde `legsToWin` /
   `Leg`. « Set » reste « set ».
5. **Double out désactivé à la création** (comportement actuel conservé) ; `CLAUDE.md` mis en
   cohérence.
6. **Navigation** : l'onglet « Joueurs » quitte la barre du bas (**Début · Stats · Parties ·
   Réglages**). Réglages gagne une entrée **Joueurs** qui mène à l'écran `/joueurs` actuel
   (renommer, couleur, supprimer).
7. **Entraînement** : l'écran `/entrainement` et le bouton « S'entraîner au checkout » de
   l'Accueil disparaissent ; le lien « Créer un profil » de l'entraînement part avec son écran.
8. Tous les réglages restent mémorisés (`usePreference`).

## Hors périmètre

- Nom de partie (lot `nom-de-partie`), Accueil en parties récentes, « Rejouer la même »,
  nouveaux jeux.
- Bots, lancer vers la bulle, roue, finir le tour, nombre maximal de tours : écartés.
- Recherche dans la liste des joueurs.
- Tout changement de règle de jeu, d'événement persisté ou de `backupSchema`.

## Comportement visible

- Portrait d'abord ; le paysage reste utilisable, sans défilement horizontal. Ce n'est pas un
  écran de partie : il se tape à 30 cm.
- Cibles ≥ 48 px (cartes, ×, +, poignées, entrées de menu), angles vifs, tokens, thèmes sombre
  et clair.
- Pas de barre du bas pendant les étapes, comme aujourd'hui.
- Le bouton retour (de l'écran **et** du téléphone) ramène à l'**étape précédente** sans perdre
  les choix ; depuis l'étape 1, à l'Accueil.

## Critères d'acceptation

1. Accueil → X01 à 2 joueurs : trois étapes ; la partie démarre avec le bon jeu, les bons
   réglages et le bon ordre.
2. Entraînement : étape 2 en solo, pas d'étape 3, puis une séance d'entraînement démarre.
3. Tour du monde ou Cricket à 3 joueurs : ordre réglé par glisser-déposer, partie démarrée dans
   cet ordre.
4. « Ordre aléatoire » actif : poignées masquées, tirage fait par le use case (`shuffle`).
5. La poignée répond au clavier (↑ / ↓) et porte un nom accessible.
6. Le × retire un joueur de la partie, pas de la base.
7. « Nouveau joueur » crée le profil et l'ajoute à la partie ; un pseudo déjà pris affiche
   l'erreur actuelle.
8. « Sélectionner un joueur existant » respecte le maximum de 4 joueurs.
9. Les sets se règlent et arrivent dans `X01Config.setsToWin`.
10. Aucun « leg » dans le texte affiché ni dans les annonces vocales ; « premier à N manches »
    partout où l'on voyait « legs ».
11. Double out décoché par défaut quand aucune préférence n'est mémorisée.
12. Barre du bas sans onglet Joueurs ; Réglages → Joueurs ouvre l'écran de gestion.
13. Le bouton retour du téléphone ramène à l'étape précédente.
14. Routes toujours lazy ; gardes (thème, architecture, routes lazy) verts.

## Contraintes

- UI → use cases uniquement, aucune règle de jeu dans l'interface.
- Aucune nouvelle dépendance : glisser-déposer en Pointer Events natifs.
- Charte : tokens, angle vif, rien sous `craie/60`, `prefers-reduced-motion` respecté.
- Tout le français affiché dans `labels.ts`.
- Les clés de préférence existantes ne se renomment pas (`partie:legs` compris).

## Dépendances

Aucun lot préalable. Les sets existent déjà dans le domaine (`X01Config.setsToWin`).

## Risques

- Le glisser au doigt n'est pas testable en jsdom : relecture sur un vrai téléphone
  obligatoire.
- « Leg » → « manche » touche de nombreux libellés : risque d'oubli, ou de débordement dans le
  tableau de match lu à 3 m.
- Retirer `/entrainement` casse un éventuel lien profond vers cette adresse.
- Le défaut du double out diffère entre l'écran (`false`) et le domaine (`X01Config` : `true`).

## Zones impactées

- `src/ui/ecrans/NouvellePartieEcran.tsx` (probablement découpé en sous-composants).
- `src/ui/ecrans/games/checkout-practice/LancerEntrainementEcran.tsx` (retiré ou absorbé).
- `src/ui/composants/commun/NavigationBasse.tsx`, `src/ui/ecrans/ReglagesEcran.tsx`,
  `src/ui/ecrans/AccueilEcran.tsx` (bouton d'entraînement), `src/App.tsx` (routes).
- `src/ui/labels.ts` et les composants qui affichent les legs (`Tableau`, `LigneJoueur`,
  `ApercuPartie`, résumés, statistiques).
- Les tests UI concernés.
- Documentation : `CLAUDE.md` (défauts X01, « manche »), `.claude/rules/glossary.md`,
  `docs/CHARTE_GRAPHIQUE.md` si un composant commun naît, `docs/PROJECT_PLAN.md`.

## Attentes de validation

- Tests Testing Library :
  - parcours complet par mode ;
  - entraînement en solo ;
  - le × ;
  - les deux entrées du menu « + » ;
  - limite de 4 joueurs ;
  - sets ;
  - double out décoché par défaut ;
  - poignée au clavier ;
  - poignées masquées sous tirage ;
  - retour à l'étape précédente ;
  - aucun « leg » à l'écran ;
  - onglet Joueurs absent ;
  - entrée Joueurs dans les Réglages.
- `lint`, `typecheck`, `build`, `smoke` verts.
- Relecture à l'écran en 390 × 844, portrait et paysage, thèmes sombre et clair : les trois
  étapes, le menu, la boîte de dialogue, le match avec « manches ».
- Glisser au doigt sur un vrai Android.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- `X01Config` passe-t-il aussi son défaut à `doubleOut: false` dans le domaine (surface
  gravée) ? — owner : archi du lot.
- L'étape 1 met-elle en avant le dernier jeu joué ? — owner : archi du lot, puis l'utilisateur
  à la relecture.
- Une redirection `/entrainement` → `/nouvelle-partie` est-elle gardée ? — owner : archi du
  lot.

## Décisions prises pendant l'intake

- **Double out désactivé à la création** : on garde le comportement actuel (inversé en
  `577dc5f` sans être documenté) et `CLAUDE.md` est mis à jour — la règle gravée change à la
  demande de l'utilisateur.
- **Entraînement** : une carte de l'étape 1, étape 2 en solo, pas d'étape 3 ; l'écran
  `/entrainement` et le bouton de l'Accueil sont supprimés.
- **Bouton retour du téléphone** : étape précédente.
- **Sous un joueur existant** : « N manches » X01, sinon rien.
- **Reprises de l'étude** : « manche » à l'écran, glisser-déposer à la place des flèches, menu
  « + » à deux entrées, onglet Joueurs déplacé dans Réglages, charte conservée.
- **Niveau `high` imposé** : le lot modifie des décisions gravées de `CLAUDE.md` (défauts X01,
  vocabulaire des legs).
