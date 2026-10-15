# Lot `cartes-partie` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu, `archi-scout`
> (sonnet / low), **tentative 2**, dont le rapport commence par `Architecture result: PASS`. Le
> scout a lu la planche validée en entier (`scratchpad/cartes/cartes.html`) et n'a tranché que le
> technique. Les points produit qu'il a posés ont été **tranchés par l'utilisateur** (§ Réponses
> de l'utilisateur), pas par l'Orchestrator.
>
> La tentative 1 (même agent, avant la mise à jour des briefs d'architecte) et les arbitrages
> que l'Orchestrator y avait ajoutés sont **remplacés** : ils prenaient des décisions produit
> sans l'utilisateur (voir `00-orchestration.md`, journal du 2026-10-15).

## Problème

Les cartes se ressemblent : le titre répète l'en-tête de groupe, le résultat est petit, on ne voit
le score de personne. Il faut deux formes — un **mini tableau** classé pour la partie en cours de
l'Accueil, des **lignes de feuille** pour les autres (Accueil et Parties) — et un **classement**
calculé hors de l'UI.

## Options considérées (techniques)

| Option | Pour | Contre |
|---|---|---|
| Classement dans `src/core/domain/` | Proche des règles | Ne lit que `MatchSummary` (application) ; surface gravée (`high`) sans bénéfice — **écartée** |
| Classement : fonction pure dans `src/core/application/use-cases/`, à côté de `matchStatus` | Comme prévu par la demande ; l'UI affiche seulement | Étend l'exception « fonction pure de `use-cases/` importée par l'UI » — **retenue** |
| `CartePartie` à deux formes | Un fichier | Deux mises en page sans rien de commun — **écartée** |
| Deux composants | Chacun simple | — **retenue** : `CartePartie` devient la ligne (nom et fichier gardés, importés par `HistoriqueEcran` et `lot4.test.tsx`), `MiniTableauPartie` est nouveau |
| Résumés de fin de partie sur `rankPlayers` | Une seule logique | Ils trient l'état complet (`CricketState`, `TourDuMondeState`, stats X01), pas un `MatchSummary` — **non**, dette dans `06-echanges.md` |
| Objet « vue de carte » calculé hors de l'UI | Tout pur | Trop lourd ; patron actuel = `switch` exhaustif par mode — **écartée** |

## Approche retenue (technique)

1. **`src/core/application/use-cases/rankPlayers.ts`** :
   `rankPlayers<S extends MatchSummary>(partie: S): S['players']`. Fonction pure, sans mutation,
   imports relatifs, types de `ports/driving` seulement. Tri stable : à égalité parfaite, l'ordre
   de jeu reste. Clés, d'après le § 3 de la demande :
   - X01 : `winnerId` d'abord, puis `setsWon` ↓, `legsWonInSet` ↓, `remaining` ↑ ;
   - Cricket : le vainqueur, puis `score` ↓ (↑ en cut-throat ; valeur exacte de la variante à
     relire dans `cricket/config.ts`), puis `closedTargets` ↓ ;
   - Tour du monde : `finishedInDarts !== null` d'abord, par fléchettes ↑, puis `targetIndex` ↓ ;
   - entraînement : ordre tel quel.

   Pour la réponse R7 (ex æquo), le module expose aussi de quoi savoir quels joueurs sont **à
   égalité avec le premier sur toutes les clés** (même comparateur) — choix de forme au Dev.
2. **UI** :
   - `composants/commun/CartePartie.tsx` : réécrit en ligne de feuille ;
   - `composants/commun/MiniTableauPartie.tsx` : nouveau ;
   - `composants/commun/FeuillePartie.tsx` : nouveau (`<ul>`, filet 3 px, fond `ardoise`), une
     feuille par période ;
   - `src/ui/cartesPartie.ts` : fonctions pures d'affichage par mode (détail, unité, valeur,
     jauge), `switch` exhaustif sur `MatchSummary` ; le français reste dans `labels.ts`.
3. **Ligne** : un seul `<Link>` ≥ 64 px ; corbeille en colonne de 48 px, sœur du lien
   (`actions`), `BoutonSupprimer` inchangé. `matchStatus` inchangé, `enCoursId` global. Titres
   `h3` à l'Accueil (sous les `h2` de groupe), `h2` dans Parties.
4. **Imports** : l'UI importe `rankPlayers` comme `matchStatus`. Le Dev met à jour
   `.claude/CONVENTIONS.md` § 8 (l. 145-147) et § 14 (l. 391-392) : « `matchStatus` et
   `rankPlayers`, seules fonctions de `use-cases/` importées par l'UI ».
5. **Jour seul** (décision A) : `AccueilEcran` a déjà `services.clock.now()` ; helper dans
   `labels.ts` sur `new Date(horodatage)` (calendrier d'un horodatage donné, conforme à
   `horlogeBoundary`).

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | Aucun |
| `core/application/` | `use-cases/rankPlayers.ts` | Nouveau ; `MatchSummary.ts`, `summarize.ts` inchangés |
| `infrastructure/`, `composition/` | — | Aucun, pas de nouveau port |
| `ui/` | `CartePartie.tsx` (réécrit), `MiniTableauPartie.tsx`, `FeuillePartie.tsx`, `cartesPartie.ts`, `AccueilEcran.tsx`, `HistoriqueEcran.tsx`, `labels.ts` | Deux formes, classement affiché, libellés |
| `tests/` | `rankPlayers`, `cartesPartie`, ligne, mini tableau, `accueilPartiesRecentes`, `lot4` | Nouveaux et adaptés |
| docs | `docs/CHARTE_GRAPHIQUE.md` § Composants, `.claude/CONVENTIONS.md` § 8 et § 14 | Mis à jour dans le lot |

**Sens des dépendances vérifié :** `ui` → `application` (fonction pure) → `domain` (types).
**Nouveau port ?** Non.

## Décisions de `CLAUDE.md` concernées

- Hexagonale, UI → use cases : classement dans l'application, l'UI affiche ; l'exception
  fonction pure est étendue, pas contournée.
- « Abandonnée » dérivée : `matchStatus` inchangé, contre la partie en cours globale.
- Nom de partie : seul le nom tapé s'écrit ; le défaut n'apparaît plus sur une ligne. Horloge
  par `services.clock`. « Manche », jamais « leg ».
- Règles X01, Tour du monde, Cricket (cut-throat inversé) : lues, non modifiées.
- Charte : laiton unique, angle vif, ni dégradé ni halo, tokens en paires, plancher `craie-3` ;
  petit texte en `laiton-clair`, jamais `text-laiton`.

Rien à graver dans `CLAUDE.md`.

## Baseline sécurité

Aucune entrée non fiable nouvelle (import JSON intact). Noms rendus en JSX, jamais en HTML
brut, tronqués en CSS. Aucun réseau, permission, cookie ni stockage nouveau ;
`SECTIONS_CONFIDENTIALITE` inchangé.

## Étapes (pour `dev`)

1. `rankPlayers.ts` et ses tests (`tests/use-cases/`) : X01 (sets, manches, reste, vainqueur en
   tête) ; Cricket standard et cut-throat des deux côtés ; Tour du monde (bouclé d'abord, puis
   `targetIndex`, nul) ; égalité parfaite = ordre de jeu ; ex æquo en tête (R7) ; entraînement ;
   un seul joueur ; `name: null`. Puis `npx biome check --write src tests`.
2. `labels.ts` et `src/ui/cartesPartie.ts` (libellés et réponses R1-R10), tests purs.
3. `CartePartie.tsx` et `FeuillePartie.tsx`. Tests : 1, 2, 3, 4 joueurs (2 × 2), titre tapé /
   règles, Abandonnée / En cours, sans vainqueur (R7), solo fini (R6), un seul lien, corbeille
   hors du lien.
4. `MiniTableauPartie.tsx`. Tests : les quatre jeux et leurs états (R1-R4), X01 à sets, seuil de
   5 (R5), Tour du monde bouclé en `vert-cible`, 4 joueurs resserrés, « Reprendre » ici seulement.
5. Brancher `AccueilEcran` et `HistoriqueEcran`. Adapter `accueilPartiesRecentes.test.tsx` et
   `lot4.test.tsx` sans perdre l'information vérifiée (« Kevin gagne · 3 manches » →
   phrase `sr-only`). Garder « Reprendre » unique, « Abandonnée » unique, les groupes.
6. Charte (§ Composants), CONVENTIONS, lint, typecheck, tests, build.

## Conformité à la planche

Chaque élément est implémenté tel que dessiné. **Écarts : aucun.**

**Feuille et ligne**
- `FeuillePartie` : filet 3 px `craie` en tête, fond `ardoise`, filets 1 px `craie/22` entre
  lignes, aucun sous la dernière ; une feuille par période à l'Accueil, une seule dans Parties.
- Ligne : grille `56px minmax(0,1fr)` (+ `48px` avec corbeille), `min-h` 64 px.
- Colonne mode : `Pictogramme` 20 px `laiton-clair`, détail Oswald 700 0,75 rem `craie-2`
  `nowrap`, unité 500 0,75 rem majuscules `craie-3`, filet droit, `gap` 3.
- Contenu : padding 9/10/10/12, `gap` 6. Titre 700 1 rem `craie-vive` ellipse ; heure à droite
  0,75 rem `craie-3` ; titre « règles » 500 0,75 rem majuscules `craie-3`, seulement sans nom
  tapé.
- Joueurs : 1 à 3 en rangée (avatar 22 px, chiffre 0,95 rem, `gap` 4/14) ; 4 en grille 2 × 2
  (avatar, nom 0,75 rem majuscules `craie-2` ellipse, chiffre à droite, `gap` 6/10). Ordre =
  `rankPlayers`.
- Partie finie : premier en `laiton-clair` avec « ✓ » (voir R6, R7). X01 « ✓ » au vainqueur et
  le reste aux autres ; Cricket « 86 ✓ » ; Tour du monde fléchettes (+ « ✓ ») ou « 19/21 » ;
  entraînement « réussies/jouées ».
- Étiquettes « Abandonnée » (bordure `craie/40`) et, dans Parties, « En cours » (bordure
  `laiton`, texte `laiton-clair`).
- Corbeille : 48 px, bordure gauche 2 px `rouge-cible/50`, fond `rouge-cible/10`, icône 16 px
  `craie-2`, « Sûr ? » inchangé. Filtre inchangé.
- Accueil : enseigne, mini tableau, « Aujourd'hui · mardi » et sa feuille, « Cette semaine » et
  sa feuille, « Nouvelle partie » 64 px. En-tête de groupe 700 0,75 rem majuscules tracking
  0,2 em `craie-3`, jour 500 tracking 0,1 em.

**Mini tableau**
- Bordure 1 px `laiton`, fond `ardoise`. Tête : padding 8/10, `gap` 10, filet bas,
  `Pictogramme` 24 px, titre 700 1 rem `craie-vive` (nom tapé, sinon nom du jeu — dessiné),
  règles 0,75 rem majuscules `craie-3`, heure et étiquette d'état laiton à droite.
- Lignes : grille `28px 1fr 72px 48px`, `gap` 8, padding 5/10 (3 px à 4 joueurs). Avatar 28 px,
  nom 500 0,8 rem majuscules `craie-vive`, chiffre 1,2 rem à droite. Premier : fond `laiton/12`,
  chiffre `laiton-clair`.
- Jauges : X01 carrés 9 × 9 (`legsWonInSet` / `legsToWin`) et traits de sets 9 × 4 (`setsWon` /
  `setsToWin`), pleins en `laiton` ; Cricket cases 8 × 12 (`closedTargets` / `targetsTotal`),
  pleines en `craie` ; Tour du monde barre 8 px (`targetIndex` / `targetsTotal`), `vert-cible`
  une fois bouclé ; entraînement barre (`roundsWon` / `config.rounds`).
- Chiffres : X01 reste ; Cricket points ; Tour du monde « 14/21 » ou « 52 fl. » ; entraînement
  « 4/7 » (unité 0,7 rem `craie-3`).
- « Reprendre » 48 px, 0,875 rem, majuscules, marge 4/10/10, seul de la page.

**Transversal** : tokens seulement, thème clair par les valeurs, ni arrondi ni dégradé ni halo,
pictogrammes 20 et 24, icônes lucide `aria-hidden`, avatars par `Avatar`.

## Réponses de l'utilisateur (2026-10-15)

Questions Q1-Q14 du scout, tranchées par l'utilisateur à l'arrêt Archi → Dev (Q7 n'était pas
une question : le titre du mini tableau sans nom tapé est dessiné dans la planche).

| # | Question du scout | Réponse de l'utilisateur |
|---|---|---|
| R1 (Q1) | Numéro « Volée N » au Cricket | **Pas de numéro** : l'étiquette du Cricket dit « En cours » |
| R2 (Q2) | Tour du monde avant que quelqu'un boucle | « **En cours** » ; « Dernier tour » dès qu'un joueur a bouclé et que la partie continue |
| R3 (Q3) | Contenu de l'étiquette d'état | **État seul**, comme dessiné : « Manche 3 », « Set 2 · manche 4 », « Dernier tour », « Sortie 8 », « En cours » |
| R4 (Q4) | Compte des manches au X01 | **Sur toute la partie** : manche N = manches jouées + 1, tous sets confondus ; set S = sets gagnés + 1 |
| R5 (Q8, Q8 bis) | Jauge X01 au-delà du dessiné | Carrés de manches **jusqu'à 5**, au-delà un chiffre « 3/10 » ; **même règle** pour les traits de sets (« 2/7 » au-delà de 5) |
| R6 (Q9) | Entraînement terminé | **Ni laiton ni « ✓ »** : un seul joueur, « 7/10 » en craie |
| R7 (Q10, Q11) | Partie finie sans vainqueur (nul au Tour du monde, Cricket sans vainqueur) | **Tous les ex æquo** en tête sont en laiton avec « ✓ » (à égalité avec le premier sur toutes les clés de classement) |
| R8 (Q5) | Détail d'un Tour du monde au parcours modifié | **Première → dernière cible**, la bulle écrite « B » (« 1→20 », « 20→B ») |
| R9 (Q6) | Double out / double in dans le titre X01 | **Jamais** : le titre reste court (« 501 · premier à 2 manches ») |
| R10 (Q14) | Date d'une partie d'une autre année | **Ajouter l'année** (« 3 oct. 2025 », l'heure tombe) dès que l'année diffère |
| R11 (Q12, Q13) | Phrases des lecteurs d'écran | **Même forme partout** que l'exemple de la demande, déclinée par le Dev pour chaque jeu et le mini tableau ; **l'utilisateur relit toutes les phrases à l'arrêt de fin de lot**, avant le commit |

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| T1 | Valeur exacte de la variante cut-throat et type `Segment` pour écrire « B » (`cricket/config.ts`, `Dart.ts`) | Dev |
| T2 | Dette hors lot : tris des résumés Cricket / Tour du monde dupliquant `rankPlayers` | Orchestrator, `06-echanges.md` |
| T3 | Troncatures (4 joueurs, noms longs, clair, paysage) invisibles en test | Relecture à l'écran |

Aucune question pour l'utilisateur ne reste ouverte.

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
