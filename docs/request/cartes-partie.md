# Demande — cartes-partie

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-15
- **Niveau** : light
- **Commande manuelle** : `/orchestrate cartes-partie light`

## Objectif

Rendre les cartes de partie lisibles d'un coup d'œil, à l'Accueil comme dans Parties.
Aujourd'hui, toutes les cartes d'une soirée se ressemblent et portent le même nom par défaut
(« Mardi soir », qui répète l'en-tête de groupe), le résultat est petit et en bas, et l'on ne
voit le score de personne. Retenu : le **mélange 1 + 2**. La partie en cours devient un **mini
tableau** (on reprend en connaissant le reste de chacun), toutes les autres deviennent des
**lignes de feuille** (une soirée tient sur un écran).

Origine : `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, lot 7 du § Découpage en
lots et § Cartes de partie. Références visuelles (privées) :
- **planche du lot, à jour, validée le 2026-10-15** :
  <https://claude.ai/artifact/XH8i1UvuqNNSgC4cexEGMd> (Accueil à 3 et à 4, thème clair, mini
  tableau par jeu, Parties, « À trancher » A-E tranché ci-dessous) ;
- planche d'origine (validée le 2026-10-13) : <https://claude.ai/artifact/DmZstoMHekLChPqW8X5wm3>,
  section « Retenue, à 4 joueurs ».

En cas d'écart, la planche à jour l'emporte sur celle d'origine.

## Périmètre

**1. Ligne de feuille** (toutes les parties sauf la partie en cours de l'Accueil, et **toutes**
les parties de Parties)

- Les lignes d'une même période forment **une seule feuille** : filet de 3 px en tête, filets
  fins entre les lignes, fond `ardoise`.
- **Colonne de gauche (56 px)** : le **pictogramme du mode** (`Pictogramme`, 20 px,
  `laiton-clair`), dessous le **détail** (501, STD, CT, 20→B, 41-170…) puis l'**unité** du jeu
  (« reste », « pts », « fl. », « sorties »).
- **Haut de ligne** : le **nom tapé** en titre s'il existe ; sinon les **règles en petites
  capitales, sans le nom du jeu** (déjà dans la colonne). L'heure à droite.
- **Joueurs**, **classés** (voir 3) :
  - à 1, 2 ou 3 joueurs : avatar (22 px) et chiffre, sur une rangée ;
  - à 4 joueurs : **grille 2 × 2**, avatar, nom et chiffre, premier en haut à gauche ;
  - partie finie : le premier en `laiton-clair`, avec « ✓ » ;
  - le chiffre ne répète pas l'unité. X01 : le vainqueur « ✓ », les autres leur reste ; Cricket :
    les points ; Tour du monde : les fléchettes de ceux qui ont bouclé, « 19/21 » pour les
    autres ; entraînement : « réussies / jouées ».
- **États** : « Abandonnée » (étiquette cerclée) et, dans Parties, « En cours » (étiquette
  laiton) pour la partie en cours, sans « Reprendre ».
- **Toute la ligne reste une seule cible** (≥ 64 px) : le résumé d'une partie finie, la reprise
  sinon.
- **Parties** : la corbeille reste à droite, sa propre cible de 48 px, en deux temps (« Sûr ? »),
  comme aujourd'hui. La date courte (« mar. 21 h 40 ») remplace l'heure ; le filtre par jeu ne
  change pas.

**2. Mini tableau** (la partie en cours, épinglée en tête de l'Accueil, seule)

- **Tête** : pictogramme (24 px), titre (nom tapé, sinon le nom du jeu), règles, heure, et
  l'état (« Manche 3 », « Set 2 · manche 4 », « Dernier tour »…).
- **Une ligne par joueur, classée**, toutes gardées à 4 joueurs (un peu resserrées) : avatar
  (28 px), nom, **jauge de son jeu**, chiffre ; le premier sur un fond teinté laiton.

  | Jeu | Jauge | Chiffre |
  | --- | --- | --- |
  | X01 | Carrés des manches du set (`legsWonInSet` sur `legsToWin`) ; avec des sets, traits des sets gagnés (`setsWon` sur `setsToWin`) | Le reste |
  | Cricket | Une case par cible fermée (`closedTargets` sur `targetsTotal`) | Les points |
  | Tour du monde | Barre d'avancée (`targetIndex` sur `targetsTotal`), en `vert-cible` une fois bouclé | « 14/21 », ou les fléchettes une fois bouclé |
  | Entraînement | Barre des sorties réussies sur le nombre prévu | « réussies / jouées » |

- « **Reprendre** » en laiton (48 px) en pied, visuel de la cible unique comme aujourd'hui.

**3. Classement des joueurs** — d'après `CLAUDE.md` § Règles du jeu, **calculé hors de l'UI**
(fonction pure de `src/core/application`, à côté de `matchStatus`) ; l'écran ne fait qu'afficher.

| Jeu | Devant | Puis |
| --- | --- | --- |
| X01 | Le vainqueur, sinon le plus de sets, puis de manches | Le plus petit reste |
| Cricket | Le vainqueur, sinon le plus gros score (**le plus petit en cut-throat**) | Le plus de cibles fermées |
| Tour du monde | Ceux qui ont bouclé, le moins de fléchettes d'abord | La cible la plus avancée |
| Entraînement | Un seul joueur | — |

Égalité parfaite : l'ordre de jeu, sans rien marquer (aucun départage inventé). Les résumés de fin
de partie trient déjà ainsi : l'Architecture dit s'ils réemploient la même fonction.

**4. Libellés** dans `src/ui/labels.ts` : unités, règles sans le nom du jeu, états, phrase complète
pour les lecteurs d'écran (« Sarah gagne, 86 points ; Kevin 61 ; Julien 22 »).

**5. Charte** : § Composants (`CartePartie` en ses deux formes), mise à jour dans le lot.

## Hors périmètre

- **Badges de moments** (180, victoire…) sur les lignes : reportés, faute de maquette et parce
  qu'ils demandent d'étendre `MatchSummary` (choix de l'intake).
- Tout nouveau champ de `MatchSummary`, toute règle de jeu, tout format persisté, le domaine.
- Le contraste du petit texte en `text-laiton` préexistant ailleurs (#21 de l'index, liens
  « Retour… », « Toutes les parties ») : lot à part. Les libellés **de ce lot** utilisent
  `laiton-clair`.
- Le groupement de Parties (liste non groupée, inchangée), le plafond de l'Accueil (30), la
  logique « Abandonnée » (`matchStatus`).

## Comportement visible

- Écrans **lus de près** (Accueil, Parties), portrait d'abord ; en paysage, la même liste dans la
  colonne existante, sans nouvelle disposition.
- **Accueil** : enseigne ; le mini tableau de la partie en cours ; « Aujourd'hui · mardi » (le
  **jour seul**, A) puis sa feuille ; « Cette semaine » puis sa feuille ; « Nouvelle partie ».
- **X01 avec sets** (B) : carrés des manches du set en cours, traits des sets gagnés dessous.
- **Entraînement abandonné** (C) : « 4/7 » et « Abandonnée », sans phrase.
- **Profil supprimé** (D) : avatar neutre et « Joueur supprimé » (`nomJoueur`), classé comme les
  autres.
- **Texte de statut** (E) : « Sarah gagne », « 3 manches » disparaissent de l'écran ; le premier
  en laiton et le « ✓ » le disent. Les lecteurs d'écran gardent une phrase complète.
- **Thème clair** : mêmes classes, valeurs des tokens ; petit texte en `laiton-clair`, jamais
  `laiton` nu.

## Critères d'acceptation

1. La partie en cours de l'Accueil est un mini tableau ; toute autre partie, à l'Accueil et dans
   Parties, est une ligne de feuille ; les lignes d'un groupe sont une seule feuille.
2. La colonne de gauche porte le pictogramme du mode, le détail et l'unité ; aucune couleur par
   jeu (laiton unique, garde `accentBoundary` verte).
3. Titre = nom tapé seulement ; sinon les règles sans le nom du jeu ; jamais « Mardi soir » sur
   une ligne.
4. Joueurs classés selon le § 3, testé par jeu, **cut-throat compris** (le plus petit score
   devant) ; grille 2 × 2 à 4 joueurs ; premier en `laiton-clair` avec « ✓ » sur une partie
   finie.
5. Jauges et chiffres du mini tableau conformes au tableau du § 2, pour les quatre jeux, sets du
   X01 compris.
6. Une seule cible par ligne / carte (≥ 64 px), corbeille de Parties à 48 px et en deux temps ;
   « Reprendre » seulement sur le mini tableau.
7. « Abandonnée » identique à l'Accueil et dans Parties (`matchStatus`, inchangé).
8. Tout le français dans `labels.ts` ; tokens seulement, aucune couleur en dur hors teintes de
   profil ; ni halo, ni dégradé, ni arrondi ; tous les gardes verts.

## Contraintes

- Aucun nouveau champ dans `MatchSummary`, aucune modification du domaine ni d'un format
  persisté : tout ce qui s'affiche y est déjà (`remaining`, `legsWonInSet`, `setsWon`,
  `closedTargets`, `score`, `targetIndex`, `finishedInDarts`, `roundsWon`, `roundsPlayed`).
- Le classement ne se réimplémente pas dans l'UI (`rules/frontend-react.md`).
- ⚠️ Si l'Architecture juge que le classement doit vivre dans `src/core/domain/` : **arrêt**, retour
  à l'utilisateur, le lot passe en `high`.
- `Pictogramme` aux tailles permises (20, 24) ; avatars ≥ 22 px.
- Relecture contre la planche à jour (liste conforme / oublié / écarts) à l'arrêt Archi → Dev.

## Dépendances

- Lot 4 `pictogrammes` (fait, `2d35d28`) ; lot 6b `pave-unifie` (fait, `e206bc9` : laiton unique,
  `laiton-clair` clair à #614a08).

## Risques

- Lignes trop hautes à 4 joueurs ou noms longs : troncature à vérifier à l'écran.
- Un classement mal dérivé ne se voit pas dans un test qui l'écrit sur la même lecture : tests
  par jeu, adossés aux règles de `CLAUDE.md`, cut-throat des deux côtés.
- Contraste en clair du petit texte laiton (déjà corrigé une fois au 6b).
- `CartePartie` est aussi lue par les tests de l'Accueil (`accueilPartiesRecentes`) et de Parties :
  les adapter sans les affaiblir.

## Zones impactées

- `src/ui/composants/commun/CartePartie.tsx` (en deux formes, ou deux composants) ;
- `src/ui/ecrans/AccueilEcran.tsx`, `src/ui/ecrans/HistoriqueEcran.tsx` ;
- `src/core/application/` : fonction pure de classement (et ses tests) ;
- `src/ui/labels.ts` ; `docs/CHARTE_GRAPHIQUE.md` ;
- tests : `tests/ui/accueilPartiesRecentes.test.tsx`, ceux de Parties, nouveaux tests du classement
  et des deux formes.

## Attentes de validation

- Tests : classement par jeu (dont cut-throat, Tour du monde non bouclé, égalité, profil
  supprimé) ; mini tableau des quatre jeux (sets du X01) ; ligne à 1, 2, 3 et 4 joueurs ; titre
  tapé vs règles ; états Abandonnée / En cours ; une seule cible ; corbeille ; phrase des lecteurs
  d'écran.
- **Relecture à l'écran** : Accueil et Parties, portrait et paysage, sombre et clair, à 2, 3 et 4
  joueurs, les quatre jeux en cours dans le mini tableau ; captures dans le scratchpad.

## Questions bloquantes

Aucune.

## Questions non bloquantes

| # | Question | Owner |
| --- | --- | --- |
| 1 | Un composant `CartePartie` à deux formes, ou deux composants (mini tableau, ligne) ? | Architecture |
| 2 | Les résumés de fin de partie réemploient-ils la fonction de classement ? | Architecture |
| 3 | Code court du détail au Cricket cut-throat (« CT ») et à un Tour du monde au parcours modifié. | Architecture, d'après `config` |

## Décisions prises pendant l'intake

- Badges de moments : **plus tard** (pas de maquette, `MatchSummary` à étendre).
- Ordre des joueurs : **classement complet**, calculé hors de l'UI selon les règles de `CLAUDE.md`.
- Colonne du mode : **pictogramme + détail + unité** (écart volontaire avec le code texte de la
  planche d'origine, dessinée avant les pictogrammes).
- Maquette : **planche à jour d'abord**, faite et validée le 2026-10-15.
- « À trancher » de la planche : **A** jour seul dans l'en-tête de groupe ; **B** carrés des
  manches et traits des sets au X01 ; **C** entraînement abandonné en « 4/7 » + « Abandonnée » ;
  **D** profil supprimé comme aujourd'hui ; **E** texte de statut retiré de l'écran, phrase
  complète gardée pour les lecteurs d'écran.
- Niveau `light` : ni domaine, ni couture `GameMode`, ni format persisté.
