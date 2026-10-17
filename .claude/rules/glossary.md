# Glossaire

**Quand :** documentation, libellés d'écran, nommage. Les règles qui
donnent leur sens à ces mots sont dans `CLAUDE.md` § Règles du jeu — ne
pas en inventer une autre définition.

Le cœur parle anglais, l'écran parle français : la première colonne est
ce que lit le joueur, la deuxième ce qu'écrit le code.

| À l'écran | Dans le code | Sens |
| --- | --- | --- |
| fléchette | `Dart` | Un lancer : segment × multiplicateur. Pas de triple sur la bulle. |
| volée | `Visit` | 1 à 3 fléchettes d'un même joueur, d'affilée. |
| journal | `MatchEvent[]` | La partie telle qu'elle est stockée ; l'état affiché en est une **projection**. |
| manche / set | `Leg`, `legsToWin` / `setsToWin` | Manche X01 (*leg* dans le code) : gagnée en atteignant exactement 0, sur un double si double out. Un set se gagne au premier à N manches. On dit « premier à N manches », **jamais** « best of N » ni « leg » à l'écran. |
| bust | `VisitOutcome` | Volée annulée, le score revient à sa valeur d'avant la volée. Une donnée, pas une erreur. |
| checkout | `checkout` | Finir une manche. À l'écran on dit **« checkout »**, jamais « sortie » ; à la voix, « checkout » et « bust » se disent en `en-US`. La suggestion s'affiche de 2 à 170 sur un double, de 1 (S1) à 180 en checkout libre (`checkoutRange`). |
| bogey / pas de finish | `BOGEY_NUMBERS` / `FREE_OUT_NO_FINISH` | Reste sans finish possible en 3 fléchettes. Sur un double : 169, 168, 166, 165, 163, 162, 159. En checkout libre : 179, 178, 176, 175, 173, 172, 169, 166, 163. À l'écran : « Pas de finish ». |
| feuille de règles | `FeuilleRegles` / `LivreRegles` | Les règles appliquées, ouvertes par le livre, par-dessus l'écran (jamais une route) ; « Ce soir » = les réglages de la partie. |
| bulle | `BULL_SIMPLE` (25) / `BULL_DOUBLE` (50) | Le centre. Le 50 compte comme un double. |
| marque | — | Cricket : simple = 1, double = 2, triple = 3 ; trois ferment une cible. |
| cut-throat | variante Cricket | Les points vont aux adversaires ; le plus petit score gagne. |
| Tour du monde | `tour-du-monde` | 20 → 1 puis bulle ; on finit le tour de table. |
| entraînement | `checkout-practice` | Mode solo d'entraînement au checkout. |
| manche (entraînement) | `rounds` | Une tentative de l'entraînement : un reste tiré, une volée pour faire le checkout. Même mot que la manche X01, autre objet. |
| Rejouer | `GetReplayableConfigurations` | Étape 1 de Nouvelle partie : les 3 configurations récentes (mode + réglages + ensemble de joueurs, lues sur l'historique, rien de stocké). ▶ préremplit le parcours ; le **nom n'est jamais repris**. À ne pas confondre avec « On remet ça » (résumé de fin), qui relance la partie à l'identique et garde le nom. |
| nom de partie | `MatchName` | Nom **tapé** (≤ 30 caractères, espaces autour retirés), seul écrit, dans l'événement d'ouverture. À défaut, « Jour tranche » recalculé depuis la date de création, jamais écrit — la nuit (0-5 h) au nom du jour du calendrier. |
| partie en cours | `GetOngoingMatch` | La partie non terminée **modifiée le plus récemment**, parmi les 20 dernières. Épinglée en tête de l'Accueil, seule carte qui porte « Reprendre ». |
| abandonnée | `'ABANDONED'` / `matchStatus` | Partie non terminée qui n'est **pas** la partie en cours. Dérivée, jamais écrite ; toujours reprenable ; même statut à l'Accueil et dans Parties, jamais calculée contre une liste filtrée. |
| manches jouées | `legsPlayed` | X01 : manches gagnées, tous sets confondus. Dérivé du journal (`LegWon`), jamais écrit. |
| joueur / profil | `Player` | Profil **local** (pseudo + couleur), pas un compte. |
| oche | — | La ligne de lancer. Contexte d'usage, pas un objet du code. |

Prose en français. Symboles et types TypeScript déjà en anglais : les
laisser en anglais.
