# Lot `cartes-partie` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high, lecture
> seule, sans shell) ; contrôles relancés par l'Orchestrator.

## Tentative 3 (après boucle 2) — PASS

Corbeille de Parties sans « Sûr ? » (`w-12 min-w-12 min-h-12` dans les deux états, fond
`bg-rouge-cible/30`, noms accessibles et deux temps inchangés), « Kevin, aucune sortie jouée »,
partie à un joueur sans teinte, `CONVENTIONS.md:298-300` corrigé : conformes aux décisions de
l'utilisateur ; tests capables d'échouer (solo `cartesPartie:646`, confirmation
`accueilPartiesRecentes:1124`) ; aucune régression ; aucune nouvelle décision produit. Capture
`parties-sur-clair-v3.png` : noms entiers, corbeille de même largeur partout.

| # | Constat | Classement |
|---|---|---|
| N1 | `accueilPartiesRecentes:1141` : `toHaveTextContent('')` ne prouve rien ; l'absence de texte reste gardée par `queryByText('Sûr ?')` et `w-12` | Non bloquant, dette (`toBeEmptyDOMElement()`) |
| N2 | `docs/request/cartes-partie.md:50` mentionne encore « Sûr ? » | Trace historique de l'intake, remplacée par la décision de l'utilisateur |
| N3 | Bouton sans texte dans les deux états : l'état passe par la couleur et le nom accessible | Décision de l'utilisateur |

Angles morts : rouge de confirmation en thème sombre non vu ; titre X01 à sets tronqué (toléré).
Résultats : 64 fichiers / **1065 tests** verts, lint, typecheck, build (Orchestrator).

## Tentative 2 (après boucle 1) — PASS

Q-A (pas de teinte si tous égaux, R7 intact) et Q-B (« — ») conformes et testés dans les deux
sens ; NB1, NB4, NB7 clos (NB1 trivial dans `cricket` et `manches`, une seule partie).
Questions posées à l'utilisateur et tranchées : phrase « Kevin aucune sortie jouée » → **« Kevin,
aucune sortie jouée »** ; partie à un seul joueur sans teinte → **voulu** ; titre X01 à sets
tronqué dans le mini tableau → **toléré** ; « Sûr ? » qui coupe les noms à 4 joueurs → **icône
seule à 48 px**. Toutes les phrases des lecteurs d'écran (R11, Q-C) → **validées** par
l'utilisateur. Doc : `CONVENTIONS.md:298-300` à corriger (fait en boucle 2).
Résultats : **1063 tests** verts.

## Tentative 1 — PASS

### Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Non | Intact : seul `rankPlayers.ts` ajouté dans `core/application` ; `MatchSummary`, `summarize.ts`, formats persistés inchangés |
| Use cases | Oui | `tests/use-cases/rankPlayers.test.ts` : 19 cas (`rankPlayers`, `leadingPlayers`), résumés écrits à la main |
| Infrastructure | Non | Aucun changement, aucun port |
| UI | Oui | `cartesPartie.test.tsx` (vue pure, ligne, mini tableau), `jourCalendaire.test.ts`, écrans `accueilPartiesRecentes`, `lot4`, `nomDePartieEcrans`, `cricket`, `tourDuMonde`, `manches`, `parcours` |
| Architecture (gardes) | Oui | Gardes existantes vertes |

**Angles morts assumés :** troncature (titre X01 à sets sur la ligne et dans le mini tableau),
plusieurs lignes teintées, corbeille « Sûr ? » en clair sur 390 px, noms longs à 4 joueurs,
contraste du petit texte `laiton-clair` et `craie-3`, marge de la jauge Cricket (68 px dans 72),
paysage et clair peu relus ; captures antérieures aux corrections D1.

### Classement contre `CLAUDE.md` § Règles du jeu

Code conforme (X01 : vainqueur, sets, manches, reste ; Cricket standard et **cut-throat** inversé,
cohérent avec `cricket/rules.ts:80` ; Tour du monde : bouclés, fléchettes, cible ; égalité = ordre
de jeu ; ex æquo par `leadingPlayers`). Tests adossés aux règles (ordres de noms attendus) et
capables d'échouer : mutations raisonnées (retirer le `-1` du cut-throat, `vainqueurDabord`,
réduire `leadingPlayers`, inverser `closedTargets`, oublier « bouclé ») cassent chacune un test.

### Matrice

| Réf. | Exigence | Couverture |
|---|---|---|
| C1 | Mini tableau / lignes / une feuille par groupe | `accueilPartiesRecentes:159-223`, `cartesPartie` ; Chrome |
| C2 | Colonne mode, laiton unique | `cartesPartie:13-78,414`, `accueil…:310`, `accentBoundary` |
| C3 | Titre tapé, sinon règles | `cartesPartie:400-412`, `nomDePartieEcrans:263` |
| C4 | Classement, cut-throat, 2 × 2, premier « ✓ » | `rankPlayers.test.ts`, `cartesPartie:421-496` |
| C5 | Jauges et chiffres, sets | `cartesPartie:206-272,620-680` |
| C6 | Une cible, corbeille deux temps, « Reprendre » unique | Testé ; **48 px non testé** (NB4) |
| C7 | « Abandonnée » identique | `accueil…:226-252,1082-1105` |
| C8 | Libellés, tokens, ni arrondi ni dégradé | Grep ; gardes |
| A, B, E | Jour seul, sets, statut retiré | `jourCalendaire:117`, `cartesPartie:207-243,620,274-376,528` |
| C | Entraînement abandonné | Partiel (« 4/7 » et étiquette testés séparément) |
| D | Profil supprimé | Nom testé ; **avatar neutre non testé** (NB4) |
| R1-R10 | Réponses de l'utilisateur | `cartesPartie:188,192,170-204,177,228,637,126,488,141,474,60,14`, `jourCalendaire:108`, `accueil…:368` |
| R11 | Phrases des lecteurs d'écran | `cartesPartie:274-376` ; **relecture utilisateur** |
| D1 | Titre X01 à sets, « gagne en 3 manches », ex æquo du mini tableau | `labels.ts:489-495`, `cartesPartie:38,289,303,594`, `accueil…:350` |

### Constats

**Bugs d'implémentation : aucun.**

| # | Constat | Classement | Suite |
|---|---|---|---|
| NB1 | Statut par ligne vérifié par `some()` (`tourDuMonde:356-364`, `cricket:188-194`, `manches:100-107`) | Non bloquant (test) | Boucle 1 : par ligne |
| NB2 | `toHaveTextContent('Kevin gagne')` lit la phrase `sr-only` ; le « ✓ » est prouvé ailleurs | Non bloquant | Noté |
| NB3 | États du mini tableau lus dans le `textContent` du lien | Non bloquant | Noté |
| NB4 | Corbeille ≥ 48 px et avatar neutre non testés | Non bloquant | Boucle 1 : tests |
| NB5 | Cut-throat non couvert au niveau carte ; pas de test `summarize` → `rankPlayers` sur un vrai journal | Non bloquant | Noté |
| NB6 | « Terminée » du Cricket inatteignable (`rules.ts:224` : fin avec vainqueur) | Non bloquant | Noté |
| NB7 | Docs obsolètes : `CONVENTIONS.md:174-176,317-321`, `CHARTE:177,311` | Doc | Boucle 1 |

### Questions

| # | Question | Résolution |
|---|---|---|
| Q-A | Ex æquo teintés : au départ tout le monde l'est | **Utilisateur** : dans le mini tableau, rien n'est teinté si tous sont à égalité ; les ex æquo en tête ne sont teintés que s'il reste un joueur derrière. R7 (lignes finies) inchangé |
| Q-B | Entraînement sans sortie jouée : « 0/0 » | **Utilisateur** : afficher « — », ligne et mini tableau |
| Q-C | Relecture des phrases des lecteurs d'écran | À l'arrêt de fin de lot |

Résultats : lint, typecheck, 64 fichiers / **1059 tests**, build verts (Orchestrator).
