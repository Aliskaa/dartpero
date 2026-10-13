# Lot `accueil-robustesse` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev`.

## Ce qui a été implémenté

Couche `ui/` seulement ; aucun fichier créé. Rien commité.

- `src/ui/ecrans/AccueilEcran.tsx`
  1. **Erreur** : `encours.isError || historique.isError || joueurs.isError` rend
     `<MessageErreur>{LIBELLE_ERREUR_ACCUEIL}</MessageErreur>` (`role="alert"`) dans la section
     existante. Priorité erreur → chargement → jamais joué → semaine calme → liste. Libellé fixe,
     sans `error.message`. « Nouvelle partie » reste visible. Pas de « Réessayer » (Q1).
  2. **États vides** : `total`, `affichees` (partie en cours comptée à part),
     `jamaisJoue = total === 0 && !enCours`, `semaineCalme = affichees === 0 && total > 0`.
     « Jamais joué » → `LIBELLE_AUCUNE_PARTIE_ENCORE` ; semaine calme →
     `LIBELLE_AUCUNE_PARTIE_SEMAINE`. « Créer un joueur » toujours affiché sans profil, dans les
     deux états vides.
  3. **Lien « Toutes les parties »** vers `/historique`, mêmes classes que « Créer un joueur »,
     affiché si `total > affichees || total >= PLAFOND_CARTES` (liste et semaine calme, jamais en
     « jamais joué ») — Q2.
  4. **Chargement** : `<output className="block">` autour du `Skeleton` (`aria-hidden`) avec un
     `sr-only` `LIBELLE_CHARGEMENT_PARTIES`. Flèches « → » en `<span aria-hidden="true">`.
- `src/ui/labels.ts` : `LIBELLE_AUCUNE_PARTIE_ENCORE`, `LIBELLE_TOUTES_LES_PARTIES`,
  `LIBELLE_ERREUR_ACCUEIL`, `LIBELLE_CHARGEMENT_PARTIES`, `LIBELLE_NAVIGATION_PRINCIPALE`,
  `LIBELLE_ONGLET_DEBUT` / `_STATS` / `_PARTIES` / `_REGLAGES`, `LIBELLE_COMPTEUR_FLECHETTES`
  (aucun n'existait).
- `NavigationBasse.tsx`, `Logo.tsx` : consomment ces libellés, valeurs inchangées.
- `tests/ui/accueilPartiesRecentes.test.tsx` : 9 cas ajoutés (fakes par sous-classe injectés via
  `fakeServices`, sans mock) — panne du dépôt des parties, panne du dépôt des joueurs seul,
  chargement (`status`), jamais joué sans lien, semaine calme avec lien, récente + ancienne avec
  lien, 31 parties → 30 cartes + lien, une partie visible → pas de lien, nom exact de « Créer un
  joueur » sans « → ». Tests existants mis à jour : base vide → « Aucune partie jouée pour
  l'instant » (5 occurrences + absence après import) ; « Début » et « Navigation principale »
  gardés en littéraux.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Aucun | — | — |

## Contrôles

| Commande | Résultat |
|---|---|
| `npm run lint` | OK, 246 fichiers (`npx biome check --write src tests` lancé une fois : 1 fichier reformaté) |
| `npm run typecheck` | OK |
| `npx vitest run` | 51 fichiers, 774 tests verts (765 avant le lot) |
| Vérification Orchestrator | `git diff --stat` : les 5 fichiers prévus seulement ; aucune trace d'encodage cassé (`Ã`, `Â`, `�`) dans le diff de `src/` |

**Contre-épreuves (dev)** : lien final et branche d'erreur neutralisés → 5 tests rouges (deux
d'erreur, récente + ancienne, plafond 30, « Créer un joueur »). L'échec de « Créer un joueur »
venait d'un effet de bord du script : il ne prouve rien sur la flèche. Les gardes d'absence
(lien absent si tout est visible, jamais joué sans lien) ne sont vérifiées qu'en positif. Le
script de restauration avait cassé l'encodage des accents ; réparé, puis lint / typecheck / suite
relancés au vert.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Contre-épreuves non faites : gardes d'absence du lien (tout visible ; jamais joué) et flèche hors du nom accessible. | Test |
| 2 | Combinaisons non testées : les trois lectures en erreur à la fois, ou une en erreur pendant que les autres chargent. | Test |
| 3 | Le `<output className="block">` laisse-t-il le `Skeleton` `h-36` sans changer la mise en page ? | Test (code) / Utilisateur (écran) |

## Limites connues et TODO assumés

- Relecture à l'écran (erreur, états vides, lien, portrait / paysage, sombre / clair) : angle
  mort de jsdom, à faire par l'utilisateur en fin de lot (`01-architecture.md` Q3).
- Le test de chargement repose sur `DepotPartiesLent`, une promesse jamais résolue qui vit
  jusqu'à la fin du test ; sans effet observé.
