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
| leg / set | `legsToWin` | Manche X01 gagnée en atteignant exactement 0. On dit « premier à N legs », **jamais** « best of N ». |
| bust | `VisitOutcome` | Volée annulée, le score revient à sa valeur d'avant la volée. Une donnée, pas une erreur. |
| checkout / sortie | `checkout` | Finir un leg ; la suggestion s'affiche dès que le reste est ≤ 170. |
| bogey | — | Reste sans finish possible en 3 fléchettes : 169, 168, 166, 165, 163, 162, 159. |
| bulle | `BULL_SIMPLE` (25) / `BULL_DOUBLE` (50) | Le centre. Le 50 compte comme un double. |
| marque | — | Cricket : simple = 1, double = 2, triple = 3 ; trois ferment une cible. |
| cut-throat | variante Cricket | Les points vont aux adversaires ; le plus petit score gagne. |
| Tour du monde | `tour-du-monde` | 20 → 1 puis bulle ; on finit le tour de table. |
| entraînement | `checkout-practice` | Mode solo d'entraînement à la sortie. |
| joueur / profil | `Player` | Profil **local** (pseudo + couleur), pas un compte. |
| oche | — | La ligne de lancer. Contexte d'usage, pas un objet du code. |

Prose en français. Symboles et types TypeScript déjà en anglais : les
laisser en anglais.
