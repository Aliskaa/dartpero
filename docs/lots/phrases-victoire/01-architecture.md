# Lot `phrases-victoire` — architecture

> Écrit par l'Orchestrator à partir du rapport de `archi-scout` (sonnet, effort bas), qui a rendu
> `Architecture result: PASS` à la première tentative.

## Problème

`phraseVictoire` n'est aujourd'hui qu'un texte de résumé. La voix doit la dire à la victoire,
après *Valider la sortie*, avec la **même phrase** que le résumé, dans un seul `say`. Le tirage
passe de 4 à 9 phrases.

## Options considérées

| Option | Pour | Contre |
| --- | --- | --- |
| A. Tout en UI : segment `fr` ajouté par `labels.ts`, déclenché par les hooks de mode | Local, aucune surface gravée, rien de stocké | — |
| B. Ranger la phrase dans le journal (`MatchEvent`) | Phrase figée | Format persisté, `backupSchema`, niveau `high` : hors demande |

## Approche retenue

**A.** Tout reste dans `src/ui` : `labels.ts` et les trois hooks de mode.

- **Détection de la victoire** : par `resultat.milestones` de `recordVisit`, déjà exposé.
  - X01 : jalon `MatchFinished` (`x01/rules.ts:142`), distinct de `LegWon` / `SetWon` (manches).
  - Cricket : `gagnee` existe déjà dans `useCricket`.
  - Tour du monde : `MatchFinished` avec `winnerId !== null` (`tour-du-monde/rules.ts:31,176`),
    poussé seulement après le tour de table ; la fléchette qui boucle émet `TourCompleted`.
    Nul = `winnerId` à `null` → pas de phrase.
- **Graine** : le `matchId` du hook, le même `MatchId` que celui du résumé (`ResumeX01Ecran` etc.).
- **Composition** : `annonceFinDeVolee(resultat, prochain, phrase?)`, paramètre optionnel donc
  rétrocompatible. Phrase donnée : `[...(resultat ?? []), fr('. ' + phrase)]`, ou `[fr(phrase)]` si
  `resultat` est `null`. Le point et l'espace restent dans le segment `fr`, jamais dans le `en`.
  Éventuellement une fonction pure `annonceVictoire(graine)` dans `labels.ts`.
- **Sortie annulée / bust / entraînement** : rien à ajouter. `enregistrer` n'est appelé qu'après
  *Valider la sortie* ; *Corriger* ne passe jamais par `dire` ; un bust n'émet pas
  `MatchFinished` ; `useCheckoutPractice` n'est pas touché.
- **Voix coupée** : `useVoix` relit déjà la préférence, rien à changer.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
| --- | --- | --- |
| `core/domain/` | — | Aucun (jalons lus, jamais modifiés) |
| `core/application/` | — | Aucun |
| `infrastructure/` | — | Aucun |
| `ui/` | `src/ui/labels.ts` ; `src/ui/hooks/useX01.ts`, `useCricket.ts`, `useTourDuMonde.ts` | 5 phrases ; commentaire de `PHRASE_VICTOIRE` (n'est plus « hors saisie ») ; extension d'`annonceFinDeVolee` ; phrase dite dans `enregistrer` |
| `composition/` | — | Aucun |
| `tests/` | `tests/ui/annonces.test.ts`, `x01.test.tsx`, `matchX01.test.tsx`, `cricket.test.tsx`, `tourDuMonde.test.tsx`, `resumeX01.test.tsx`, `annulationVolee.test.tsx`, `entrainement.test.tsx` | Composition par mode, tirage stable à 9, jamais avant validation / sur bust / en nul / à l'entraînement |
| Docs | `CLAUDE.md`, `.claude/CONVENTIONS.md` § 5 | Phrase de victoire dite en un seul `say`, même graine que le résumé |

**Sens des dépendances vérifié :** `ui` → `application` → `domain`, aucun import nouveau.
**Nouveau port ?** Non.

## Décisions de `CLAUDE.md` concernées

- Annulation fléchette par fléchette : « rien n'est écrit, dit ni célébré avant *Valider la
  sortie* » — **respectée**, à compléter par la phrase de victoire.
- `Announcer` : segments par langue construits dans `labels.ts`, un seul `say` par fin de volée.
- Tout le français dans `labels.ts`. À graver en fin de lot : la voix dit une phrase de victoire,
  même graine que le résumé (`CLAUDE.md` + `CONVENTIONS` § 5).

## Baseline sécurité

Aucune entrée non fiable, aucun réseau, aucun HTML brut ; phrases constantes sans pseudo ;
`/confidentialite` inchangée (aucune donnée nouvelle). Aucune surface gravée touchée. Ne remplace
pas une revue sécurité (hors niveau en `light`).

## Questions ouvertes

| # | Question | Pour qui | Résolution |
| --- | --- | --- | --- |
| 1 | Tour du monde, dernier du tour de table qui boucle ET termine la partie (`boucle` et `MatchFinished` ensemble) : ordre | Dev / Test | **Tranchée (technique)** : « Tour bouclé ! » puis la phrase, comme « Checkout » puis la phrase ailleurs. À tester. |
| 2 | X01 à deux sets : `MatchFinished` émis une seule fois, à la victoire finale ; `MatchFinished` bien dans `X01Milestone` | Dev / Test | Dev contrôle le type ; Test couvre manche intermédiaire et fin de match |
| 3 | Tests existants qui comparent exactement les annonces (`annonces.test.ts`) | Dev | Signature rétrocompatible (paramètre optionnel) ; Dev relance la suite |
| 4 | Lecture du « — » et du « ? » de « Bien joué — on remet ça ? » par la synthèse vocale | Utilisateur | Hors lot : à écouter sur appareil (déjà dans `request.md`) |

Questions pour l'utilisateur : aucune.

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.

Aucune.
