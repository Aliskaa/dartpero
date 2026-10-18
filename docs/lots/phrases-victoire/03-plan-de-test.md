# Lot `phrases-victoire` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet, effort high —
> frontmatter). ⚠️ Le sous-agent n'avait **aucun outil d'exécution** (Read, Grep, Glob seulement) :
> sa passe est une relecture statique. Les commandes ont été lancées par l'Orchestrator.

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Non | Lot 100 % `src/ui` ; jalons lus, jamais modifiés |
| Use cases | Non | Idem (`milestones` déjà exposé par `recordVisit`) |
| Infrastructure | Non | `SpeechAnnouncer` inchangé |
| UI | Oui | `tests/ui/phrasesVictoire.test.tsx` (18 tests) + 1 cas dans `tests/ui/annonces.test.ts` |
| Architecture (gardes) | Oui, par la suite complète | Aucun import nouveau ; suite verte |

**Hors périmètre :** écoute réelle de la synthèse vocale (pas de test possible).
**Angles morts assumés :** rendu vocal du « — » et du « ? » de « Bien joué — on remet ça ? », du
« . » joint en tête de segment `fr` après un segment `en` (`SpeechAnnouncer` crée un énoncé par
segment), et durée de la phrase après « Checkout » : à écouter sur appareil. Rendu inchangé, donc
pas de relecture visuelle.

## Cas de test

| # | Cas | Type | Résultat |
|---|---|---|---|
| 1 | 9 phrases distinctes, tirage stable, les 9 atteignables | heureux | Vert |
| 2 | X01 victoire du match : rien avant *Valider*, puis `Checkout. <phrase>` en un seul énoncé ; le résumé affiche la même | heureux | Vert |
| 3 | X01 manche intermédiaire : pas de phrase | bord | Vert |
| 4 | X01 set intermédiaire : pas de phrase | bord | Vert |
| 5 | X01 bust : pas de phrase | bord | Vert |
| 6 | Cricket victoire : `Partie gagnée !. <phrase>`, résumé identique | heureux | Vert |
| 7 | Cricket cut-throat à 3 joueurs | bord | Vert |
| 8 | Cricket volée non gagnante : pas de phrase | bord | Vert |
| 9 | Tour du monde : bouclage sans phrase, phrase seule à la fin du tour de table | heureux | Vert |
| 10 | Tour du monde : dernier du tour qui boucle et gagne : `Tour bouclé !. <phrase>` | bord | Vert |
| 11 | Tour du monde : nul, pas de phrase | bord | Vert |
| 12 | Entraînement : seul « Checkout » est dit (T3 corrigé) | bord | Vert |
| 13 | Voix coupée : rien dit à la victoire en X01, Cricket, Tour du monde ; le résumé garde sa phrase (T1) | bord | Vert |
| 14 | Tour du monde : le résumé affiche la phrase de la voix (T2) | heureux | Vert |
| 15 | *Corriger* après la fléchette de sortie : rien dit (T4) | bord | Vert |

Mutation réelle faite par Dev sur T1 (garde de `useVoix` retirée → 3 tests rouges, rétablie).
T2 à T4 : validés par raisonnement seulement.

## Résultats

| Commande | Résultat |
|---|---|
| `npm run lint` | Vert (320 fichiers), relancé par l'Orchestrator |
| `npm run typecheck` | Vert, relancé par l'Orchestrator |
| `npx vitest run` | 85 fichiers, **1590 tests verts**, relancé par l'Orchestrator après la correction (1585 avant) |
| `npm run build` | Vert (PWA, 51 entrées précachées), lancé par l'Orchestrator avant la correction (tests seuls modifiés depuis) |

Le bruit « Not implemented: navigation to another Document » est un message jsdom, sans échec.

## Bugs trouvés

| # | Bug | Classement | Renvoi |
|---|---|---|---|
| T1 | Voix coupée à la victoire non testée | Problème de test (couverture) | Dev, corrigé (boucle 1) |
| T2 | Égalité voix-résumé non assertée au Tour du monde | Problème de test | Dev, corrigé |
| T3 | Cas entraînement vert à vide | Problème de test | Dev, corrigé |
| T4 | *Corriger* : `dites` vide non assertée | Problème de test | Dev, corrigé |
| T5 | Passe Test sans shell | Environnement | Orchestrator, commandes relancées |

Aucun bug d'implémentation. Ponctuation « !. » : limite signalée, pas un défaut (un énoncé par
segment, motif déjà en production pour `. À toi, …`).

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Écoute sur appareil : « — » et « ? » de « Bien joué — on remet ça ? », « . » en tête d'énoncé, durée après « Checkout » | Utilisateur |
