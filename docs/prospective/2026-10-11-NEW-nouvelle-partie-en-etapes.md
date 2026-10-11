# Nouvelle partie en étapes — ce qu'on peut reprendre de DartsOn

> Étude, pas un lot. Rien n'est décidé ici : ce qui sera retenu passera par `/intake`.
> Source : captures de DartsOn (RSApps) fournies par l'utilisateur le 2026-10-11.
> Le site dartson.app n'a pas pu être consulté directement.

## Le parcours DartsOn

| Étape | Écran | Ce qu'il contient |
| --- | --- | --- |
| 0 | Accueil | Les parties de la semaine, en cartes (mode, nom, avatars, manches jouées, ✓ si terminée). Un seul gros bouton « Nouvelle partie ». |
| 1 | **Choisir le jeu** | Un nom de partie prérempli (« Dimanche Fléchettes »), puis **une carte par jeu** : liseré coloré, titre, deux lignes de règles. On touche une carte, on passe à la suite. |
| 2 | **Joueurs + paramètres du jeu** | Le jeu choisi est rappelé en titre. Les joueurs forment une **rangée d'avatars** (× pour retirer, + pour ajouter). Les réglages sont des **lignes « libellé → valeur ▾ »** : score de départ, règle de départ / de fin, manches à gagner, **sets à gagner**, finir le tour, tours max. Bouton « Créer une partie ». |
| 3 | **Ordre de jeu** | Un écran **dédié** : glisser-déposer, **ou** « Lancer vers la bulle », **ou** « Tourner la roue ». Bouton « Confirmer ». |
| 4 | Partie | — |

## Dartpéro aujourd'hui

`NouvellePartieEcran.tsx` est **une seule page** : joueurs (avec ordre par flèches ↑↓ et
bascule « Ordre aléatoire ») → règles (3 cartes de mode + réglages) → « Commencer ».
Tous les réglages sont mémorisés (`usePreference`).

## Pourquoi le découpage DartsOn est meilleur

1. **Le jeu d'abord.** Chez nous, on choisit les joueurs avant de savoir à quoi on joue, et
   le bas de la page change de forme selon le mode. Chez DartsOn, l'écran 2 ne montre que ce
   qui concerne le jeu choisi.
2. **Chaque écran pose une seule question.** Le nôtre en pose quatre (qui ? dans quel
   ordre ? quel jeu ? quelles règles ?) sur une page qui défile.
3. **L'ordre de jeu devient un moment à part.** Chez nous c'est une bascule et des flèches
   coincées dans la liste des joueurs.
4. **Les cartes de jeu expliquent les règles** avant qu'on choisisse. Les nôtres ont une
   accroche de deux mots, et l'explication n'apparaît qu'après.
5. **Il passe à l'échelle** : six jeux en liste verticale, sans tasser. Notre grille de
   trois cartes ne tiendra pas Shanghai et Count Up.

## Ce que notre cadrage impose d'adapter

- ⚠️ **Zéro friction au démarrage** (CLAUDE.md) : trois écrans, c'est plus de taps que notre
  page unique. Contrepartie : chaque étape **préremplie** avec la dernière partie (déjà le
  cas), et un raccourci **« Rejouer la même »** (mêmes joueurs, même jeu, mêmes règles) qui
  saute tout le parcours.
- **Charte « pub anglais »** : on reprend la **structure**, pas l'habillage (voir plus bas).
- **Cibles ≥ 48 px**, partout.
- **Entraînement** : il a déjà son propre écran de lancement ; il devient une carte de
  l'étape 1.

## Ce qui demande une décision (règle de jeu ou format persisté)

À **ne pas improviser** (`response-policy.md`) :

| Idée DartsOn | Ce qu'elle touche | Décision |
| --- | --- | --- |
| **Sets à gagner** | UI seulement : `X01Config.setsToWin` existe déjà dans le domaine | **Retenu**, exposé à l'étape 2. |
| **Nom de partie** | Un champ de plus dans l'événement d'ouverture → `backupSchema` | **Retenu** : prérempli d'après le jour, modifiable, affiché dans l'historique. |
| **Count Up, Shanghai, Round the World** | Nouveaux modes (couture `GameMode`) | Un lot par mode, règles à écrire dans `CLAUDE.md` d'abord. |

## Écarté par l'utilisateur (2026-10-11)

- **« Tourner la roue »** : le tirage au sort actuel (bascule « Ordre aléatoire ») convient.
  L'étape 3 garde ce tirage tel quel, sans animation de roue.
- **« Permettre de finir le tour » (X01)** : non voulu. La partie X01 s'arrête au checkout
  du vainqueur, comme aujourd'hui.
- **« Lancer vers la bulle »** (bull-off) : non voulu. L'ordre reste « dans l'ordre choisi »
  ou « aléatoire ».
- **« Nombre maximal de tours »** : non voulu. Aucune limite de tours.
- **Bots** : pas pour le moment (voir § Étape 2).

## Retenu par l'utilisateur (2026-10-11)

**Sets à gagner**, **nom de partie** (prérempli d'après le jour, p. ex. « Dimanche
fléchettes », modifiable, affiché dans l'historique), et les jeux vus chez DartsOn — dont les
règles restent à écrire dans `CLAUDE.md` avant tout code.

**Charte : on garde la nôtre.** DartsOn fournit le **parcours** (une question par écran), pas
l'habillage : coins arrondis, avatars ronds en dégradé et bouton rouge contredisent la charte
« pub anglais » (angle vif, tokens, lisibilité à 3 m). Ce qui se transpose sans la trahir :

| DartsOn | Traduction Dartpéro |
| --- | --- |
| Cartes de jeu à liseré coloré | Liseré tiré d'`ACCENTS_MODE`, angle vif, texte en tokens |
| Lignes « libellé → valeur ▾ » | Nos `ChoixSegmente` et `Bascule` (cibles ≥ 48 px, sans menu déroulant à ouvrir) |
| Rangée d'avatars ronds | Nos `Avatar` carrés, dans la même rangée |
| Poignées de glisser-déposer | **Glisser-déposer repris** (décision utilisateur : les flèches ↑↓ disparaissent). Poignée ≥ 48 px, en Pointer Events natifs, sans nouvelle dépendance. La poignée reste un bouton focalisable qui répond aux touches ↑ / ↓ du clavier (accessibilité, et c'est ce qui se teste en jsdom). Le glisser au doigt se vérifie à l'écran, sur vrai téléphone. Masquée sous « Ordre aléatoire », comme les flèches aujourd'hui. |
| Accueil en cartes de parties récentes | Voir § Accueil |

## Étape 2 : l'ajout de joueurs à la DartsOn (retenu 2026-10-11)

La rangée d'avatars se termine par un **+** qui ouvre un petit menu :

| Entrée | Ce qu'elle ouvre chez DartsOn | Chez nous |
| --- | --- | --- |
| **Nouveau joueur** | Une boîte de dialogue : un champ, « Annuler » / « Terminé ». Le joueur créé rejoint la partie. | `managePlayers.create` puis sélection, comme aujourd'hui. Couleur attribuée d'office, modifiable dans Réglages → Joueurs. |
| **Sélectionner un joueur existant** | Un écran plein : liste cochable, nombre de manches jouées sous chaque nom, loupe de recherche, validation en haut. | La liste des profils, cochable, plafonnée à `MAX_JOUEURS`. « N manches » vient des stats de carrière (lecture TanStack Query). Pas de recherche : utile seulement au-delà d'une dizaine de profils. |
| **Ajouter un bot** | Liste de 12+ niveaux, chacun avec sa moyenne (15,5 → 88,2). | **Écarté pour le moment** : le menu n'a que deux entrées. |

Chaque avatar porte un **×** pour retirer le joueur de la partie (pas de la base).
Contrainte charte : avatars **carrés**, × et + d'au moins 48 px de zone tactile, menu et
dialogue à angle vif, en tokens.

Les **bots**, si l'envie revient, seront une fonctionnalité à part entière : un joueur dont
les fléchettes sont tirées au sort selon un niveau, tirage par le port `RandomSource`,
fléchettes **écrites dans le journal** (jamais recalculées au rejeu), statistiques à exclure
ou non des carrières, comportement dans chaque mode → un lot `bots` à part.

## Navigation : l'onglet « Joueurs » disparaît (retenu 2026-10-11)

Raison donnée : il ne sert pas à grand-chose — on crée déjà un joueur depuis Nouvelle partie.
Mais `JoueursEcran` est aujourd'hui le **seul** endroit où l'on **renomme**, **change la
couleur** et **supprime** un profil (`managePlayers.update` / `remove`). Ces gestes ne doivent
pas disparaître avec l'onglet :

- l'écran reste, à la route `/joueurs`, atteint depuis **Réglages → Joueurs** — c'est aussi
  ce que fait DartsOn (Paramètres → Parties → Joueurs) ;
- les deux liens existants vers `/joueurs` (Accueil « Créer un joueur », lancement de
  l'entraînement) sont à revoir : le premier disparaît avec la refonte de l'Accueil, le second
  peut renvoyer vers l'ajout de joueur de Nouvelle partie.

Barre du bas résultante : **Début · Stats · Parties · Réglages** (quatre onglets). DartsOn n'en
a que trois (pas d'onglet Historique) : à rediscuter une fois l'Accueil en parties récentes
livré.

## Accueil : les mêmes données que DartsOn (retenu 2026-10-11)

DartsOn liste les parties récentes, groupées **« Aujourd'hui »** puis **« Cette semaine »**,
une carte par partie :

| Donnée DartsOn | Source chez nous | Écart |
| --- | --- | --- |
| Liseré coloré par jeu | `ACCENTS_MODE` | Aucun |
| Titre : le jeu (« 301 », « Round the World ») | `MatchSummary.mode` + `config` | Aucun |
| Nom de partie (« Jeudi Fléchettes ») | — | Dépend du lot `nom-de-partie` |
| Heure (aujourd'hui) ou jour + heure (cette semaine) | `createdAt` | Formatage seulement (`labels.ts`) |
| Avatars des joueurs | `players` + profils (`Avatar`) | Aucun ; joueur supprimé → avatar neutre |
| « N manches jouées » | — | **Champ dérivé à ajouter** à `X01Summary` (manches jouées, tous sets confondus) |
| ✓ partie terminée | `finished` | Icône en token, pas en vert DartsOn |
| Tap sur la carte | — | Terminée → résumé ; en cours → reprise |

**Tranché par l'utilisateur (2026-10-11)** :

1. **« Manche » à l'écran**, pas « leg » — « leg » reviendra avec l'i18n (anglais). ⚠️ Cela
   renverse le glossaire (`.claude/rules/glossary.md`) et touche tout l'écran, pas seulement
   l'Accueil : « Legs à gagner » → « Manches à gagner », `libelleLegs` / `libelleLegsCourt`,
   résumés, annonces vocales. Le **code** garde `legsToWin` / `Leg`. À graver dans
   `CLAUDE.md` et le glossaire par le lot qui l'applique.
2. Tour du monde et Cricket : **« En cours »** ou **le nom du vainqueur** à la place du
   nombre de manches (« Match nul » au Tour du monde).
3. Parties non terminées plus anciennes : marquées **« Abandonnée »**, mais **toujours
   reprenables** d'un tap. Seule la plus récente non terminée reste « En cours ».
   (`GetOngoingMatch` ne renvoie aujourd'hui que la plus récente non terminée.)
4. **Entraînement** : devient une carte de l'étape 1 de Nouvelle partie. Le bouton
   « S'entraîner au checkout » quitte l'Accueil, qui n'a plus qu'un appel : « Nouvelle
   partie ».

Ce que ça change : l'Accueil n'a plus un bloc « Partie en cours » à part, ni la feuille
« Ce soir à l'oche » ; la partie en cours devient la première carte.

Recouvrement avec l'onglet Historique : l'Accueil montre la semaine, l'Historique garde tout et
ses filtres.

## Découpage proposé en lots

1. **`nouvelle-partie-en-etapes`** (UI seule, aucun changement de domaine ni de format) :
   étape 1 jeu (cartes avec règles) → étape 2 joueurs (rangée d'avatars, menu « + ») +
   réglages du jeu → étape 3 ordre de jeu (glisser-déposer par poignée + tirage au sort
   existant ; les flèches ↑↓ sont retirées). Sets à gagner exposés. Réglages toujours
   mémorisés. L'entraînement devient une carte de l'étape 1. « Legs » → « manches » dans tous
   les libellés. L'onglet « Joueurs » quitte la barre du bas ; l'écran reste, atteint depuis
   Réglages.
2. **`nom-de-partie`** : champ prérempli à l'étape 1, persisté dans l'événement d'ouverture
   de **chaque** mode, `backupSchema` mis à jour (une vieille sauvegarde sans nom doit
   toujours s'importer), affiché dans l'historique et le résumé. Touche le format persisté →
   niveau `high`. Le jour vient du port `Clock`, pas de `Date`.
3. **`accueil-parties-recentes`** : la liste groupée par jour, après `nom-de-partie`.
   Ajoute un champ dérivé (manches jouées) au `MatchSummary` — dérivé, rien de persisté.
4. **`rejouer-la-meme`** : le raccourci qui compense les étapes.
5. Les jeux de DartsOn (Count Up, Shanghai), chacun son lot.

## Écart repéré en passant

`NouvellePartieEcran.tsx` met **le double out désactivé par défaut**
(`usePreference(CLE_DOUBLE_OUT, false)`), alors que `CLAUDE.md` impose « double out activé ».
À corriger dans le premier lot qui touche cet écran.
