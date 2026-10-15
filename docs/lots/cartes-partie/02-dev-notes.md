# Lot `cartes-partie` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium, un seul
> lancement, sous le plafond de 100 tours) ; contrôles relancés par l'Orchestrator.

## Ce qui a été implémenté

1. **Classement** : `src/core/application/use-cases/rankPlayers.ts` (`rankPlayers`,
   `leadingPlayers` pour les ex æquo de R7) ; tests `tests/use-cases/rankPlayers.test.ts` ;
   résumés écrits à la main dans `tests/fakes/resumes.ts`.
2. **Libellés et vue** : `src/ui/labels.ts` (règles courtes, détails, unités, états, phrases des
   lecteurs d'écran, jours abrégés, date de carte, `libelleJourDuGroupe`) ; `src/ui/cartesPartie.ts`
   (`vueCarte`, `quandCarte`), seul endroit qui ouvre l'union pour une carte ; tests
   `tests/ui/cartesPartie.test.tsx`. Supprimés, devenus morts : `dateHeure`, `libelleQuand`,
   `libelleGagneEnManches`, `libelleManchesDePartie`, `libelleSorties`, `reglesX01`,
   `reglesCricket`, `reglesTourDuMonde`, `reglesEntrainement`.
3. **Ligne** : `CartePartie.tsx` réécrit en ligne de feuille ; `FeuillePartie.tsx` nouveau.
4. **Mini tableau** : `MiniTableauPartie.tsx` nouveau.
5. **Écrans** : `AccueilEcran.tsx`, `HistoriqueEcran.tsx`. Tests adaptés : `accueilPartiesRecentes`,
   `lot4`, `nomDePartieEcrans`, `cricket`, `tourDuMonde`, `manches`, `parcours`, `jourCalendaire`.
6. **Docs** : `docs/CHARTE_GRAPHIQUE.md` § Composants ; `.claude/CONVENTIONS.md` § 8 et § 14
   (`matchStatus` et `rankPlayers`).

`src/core/domain/`, `MatchSummary` et les formats persistés : intacts.

## Réponse aux questions techniques

| # | Réponse |
|---|---|
| T1 | Variante `'CUT_THROAT'` / `'STANDARD'` (`CricketVariant`) ; `Segment = 1..20 \| 'BULL' \| 'MISS'`, « B » tiré de `'BULL'` dans `cartesPartie.ts` |

## Écarts par rapport à `01-architecture.md` et à la planche

| Écart | Classement | Justification du Dev |
|---|---|---|
| Avatar de ligne 24 px (taille `xs`) au lieu de 22 | Ajustement — **à valider** | `Avatar` n'a pas de taille 22 |
| Paliers de texte : 0,95 → 0,9375 rem, 0,8 → 0,875, 1,2 → 1,25, 0,7 → 0,75 | Ajustement — **à valider** | `typographieBoundary` interdit `text-[…]` |
| « ✓ » en icône lucide `Check` | Ajustement — **à valider** | Rendu et tests |
| « Reprendre » en `laiton-poli` (ombre 4 px, planche 3 px) | Ajustement — **à valider** | Classe existante |
| Règles X01 à sets : « 501 · premier à 2 sets · premier à 3 manches par set » (planche : « 501 · 2 sets · premier à 3 manches »), tronqué à l'écran | Écart — **à valider** | Réemploi de `libelleFormat` |
| Phrase du X01 fini sans « · 3 manches » | Point produit — **à valider** | Forme de l'exemple R11 ; le nombre de manches n'est plus dit nulle part |
| Mini tableau : seul le premier teinté, même à égalité | Point produit — **à valider** | Non dessiné |

Aucune refonte d'architecture.

## Points produit signalés par le Dev (sa lecture, à valider)

1. Formats « quand » : Accueil « 21 h 05 » / « dim. 18 h 10 » ; Parties « mar. 21 h 40 » puis
   « 3 oct. 22 h 15 » ; autre année « 3 oct. 2025 » ; mini tableau comme les lignes.
2. Règles du Tour du monde : « 20 → bulle », parcours modifié « 1 → 20 ».
3. « Sortie N » = `roundsPlayed + 1`.
4. Parties : partie en cours = étiquette « En cours ».
5. Titre toujours présent (ligne : règles ; mini : nom du jeu).
6. Têtes de phrase « Terminée » (Cricket sans vainqueur) et « Match nul ».
7. Phrase d'une partie non finie sans « en cours » / « abandonnée » (l'étiquette visible est lue).

## Phrases des lecteurs d'écran (à relire par l'utilisateur, R11)

- Cricket fini : « Sarah gagne, 86 points ; Kevin 61 ; Julien 22 » ; 1 point : « Kevin 1 point »
- Cricket sans vainqueur : « Terminée, Kevin 40 points ; Sarah 40 »
- Cricket en cours : « Kevin 40 points ; Sarah 20 »
- X01 fini : « Kevin gagne ; Julien reste 87 ; Sarah 140 »
- X01 en cours : « Kevin reste 144 ; Sarah 238 ; Julien 355 »
- Tour du monde fini : « Julien gagne, 48 fléchettes ; Sarah 55 ; Kevin 19 cibles sur 21 »
- Tour du monde nul : « Match nul, Kevin 50 fléchettes ; Sarah 50 »
- Tour du monde en cours : « Kevin 14 cibles sur 21 ; Lucie 10 » ; bouclé : « Sarah 52 fléchettes »
- Entraînement : « Kevin 4 sorties réussies sur 7 » (« 1 sortie réussie sur 1 »)
- Profil supprimé : « Joueur supprimé 7 points »

Le mini tableau emploie les mêmes phrases ; ses lignes sont `aria-hidden`. Le « · mardi » de
l'en-tête de groupe est `aria-hidden` (nom accessible « Aujourd'hui »).

## Contrôles (relancés par l'Orchestrator)

| Commande | Résultat |
|---|---|
| `npm run lint` | 271 fichiers, aucun problème |
| `npm run typecheck` | propre |
| `npx vitest run` | 64 fichiers, **1057 tests** verts (979 avant) |
| `npm run build` | vert |
| Grep `Ã` / `Â` / `�` (`src`, `tests`, charte, CONVENTIONS) | 0 |

### Après les décisions de l'utilisateur (D1)

Corrections du même agent : `reglesCarteX01` (« 501 · 2 sets · premier à 3 manches »),
`parleGagneEnManches` (« Kevin gagne en 3 manches ; … », « en 1 manche »), champ
`enTeteDuClassement` (`leadingPlayers`) pour teinter tous les ex æquo du mini tableau. Fichiers :
`labels.ts`, `cartesPartie.ts`, `MiniTableauPartie.tsx`, `cartesPartie.test.tsx`,
`accueilPartiesRecentes.test.tsx`. Contrôles relancés par l'Orchestrator : lint, typecheck,
**1059 tests**, build verts ; encodage propre. Pas de nouvelle capture après ces changements.

## Relevé Chrome (rapport Dev)

`scratchpad\cartes-partie\` : Accueil et Parties, X01 à 3 et 4 joueurs, portrait et paysage,
sombre et clair ; Accueil seul pour X01 à sets, Cricket cut-throat, Tour du monde « Dernier
tour », entraînement. Aucun débordement horizontal ; lignes de 78 px à 3 joueurs, 97-103 px à 4 ;
corbeille 48 px ; console propre. Seule troncature : les règles du X01 à sets. Deux captures
relues en détail, les autres mesurées.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| D1 | Les écarts « à valider » et les points produit ci-dessus | **Close par l'utilisateur** (2026-10-15) : titre X01 à sets **comme la planche** ; avatar 24 px, paliers de texte, icône `Check`, ombre `laiton-poli` **acceptés** ; phrase du X01 fini **avec les manches** (« Kevin gagne en 3 manches ; … ») ; mini tableau : **tous les ex æquo** teintés ; les 7 points produit **validés**. Corrections demandées au même agent `dev` |

## Limites connues

- Corbeille « Sûr ? » en clair et noms longs à 4 joueurs : ni testés ni relus.
- Seed « x01-sets » approximatif.
- Dette T2 : tris des résumés Cricket / Tour du monde hors `rankPlayers`.
