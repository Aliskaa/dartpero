# Lot `accueil-parties-recentes` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium,
> frontmatter ; pas de montée en gamme : aucune surface gravée). Contrôles relancés par
> l'Orchestrator le 2026-10-13 : lint 245 fichiers, 0 correction ; typecheck 0 erreur ;
> `npm test` 51 fichiers, **744 / 744** (+55) ; build vert (precache 48 entrées) ; `git status`
> : rien hors du lot.

## Ce qui a été fait

**Application**
- `MatchSummary.ts` : `X01Summary.legsPlayed`.
- `summarize.ts` :
  - `legsPlayed` = nombre de `LegWon` dans `milestones` ;
  - `type StatutDePartie` et `statutDePartie(partie, enCoursId)`, une fonction pure. La limite
    des 20 parties de `GetOngoingMatch` est documentée dans le code.

**UI**
- **Créé** `src/ui/composants/commun/CartePartie.tsx`, la carte commune. Elle remplace
  `ApercuPartie.tsx`, **supprimé**.
  - Un seul lien (`min-h-16`), liseré `ACCENTS_MODE`, titre `nomDePartie`, règles et heure,
    avatars, badge « Abandonnée », texte de statut et ✓ (`Check`, `text-laiton`).
  - « Reprendre » (`reprise`) est le visuel de la même cible, jamais un second élément
    focalisable.
  - `switch` exhaustif (`never`) pour les règles et le statut ; `libelleRegles` y a déménagé.
  - Elle ne lit aucune horloge : l'appelant lui passe `quand`.
  - Props `niveauTitre` (`h2` par défaut, `h3` à l'Accueil) et `actions`, placées hors de la
    cible principale.
- **Créé** `src/ui/jourCalendaire.ts` : `groupeDeJour(createdAt, maintenant)`, avec des bornes
  construites par composantes locales.
- **Créé** `src/ui/clesRequetes.ts` (`CLE_HISTORIQUE`, `CLE_MATCH_EN_COURS`). La clé est sortie
  de `HistoriqueEcran`, qui est chargé à la demande : sans cela, l'Accueil, chargé d'emblée,
  aurait importé un écran à la demande.
- `AccueilEcran.tsx` réécrit :
  - une section « Parties récentes », groupes « Aujourd'hui » et « Cette semaine » ;
  - la partie en cours épinglée en tête, hors groupe, sans doublon ;
  - un état vide d'une ligne, plus « Créer un joueur » seulement sans profil ;
  - `SignalAccueil` et le panneau « Partie en cours » sont retirés ; `InvitationInstallation`
    ne change pas.
- `HistoriqueEcran.tsx` :
  - passe à `CartePartie` et `statutDePartie` ;
  - ajoute la requête `CLE_MATCH_EN_COURS`, globale, jamais filtrée par mode ;
  - `BoutonSupprimer` est hors de la cible de la carte ;
  - après une suppression, il invalide `['historique']` et `['matchEnCours']` au lieu de
    `refetch()`.
- `useNouvellePartie.ts` : un lancement invalide aussi `['historique']`.
- `labels.ts` : les libellés du lot (statuts, groupes, `heureCourte`, `libelleQuand`,
  `libelleManchesDePartie`…).
- `index.css` et `NavigationBasse.tsx` :
  - la variable `--hauteur-nav-basse: 3.5rem` dans `:root` ;
  - une hauteur minimale des onglets lue sur cette variable, même valeur que l'ancien
    `min-h-14` (classe non recopiée ici : Tailwind scanne les `.md` et en générerait une
    règle morte, constat N6 du rejeu de Test).

**Tests**
- **Créés** `tests/use-cases/statutDePartie.test.ts` (11), `tests/ui/jourCalendaire.test.ts` (14)
  et `tests/ui/accueilPartiesRecentes.test.tsx` (30).
- **Adaptés** `parcours`, `manches`, `lot4`, `cricket` et `tourDuMonde` :
  - « Reprendre » est désormais un lien, cherché par `role=link` ;
  - les scores par joueur (`321`, `1/3`) ne sont plus attendus, retirés avec `ApercuPartie`
    (résolution 2 du gate).
- Contre-épreuve du Dev : sans `invalidateQueries(CLE_HISTORIQUE)` dans `useNouvellePartie`, le
  test « un lancement invalide l'historique de l'Accueil » échoue.

## Choix faits

- **Bouton fixé (Q5) : `sticky` avec décalage.**
  - Classes : `sticky bottom-[calc(var(--hauteur-nav-basse)+env(safe-area-inset-bottom))] z-10
    -mx-5 mt-auto border-t bg-feutre`.
  - Le bouton reste dans le flux, juste après la dernière carte : aucun padding à deviner, rien de
    masqué en paysage.
  - Une hauteur bornée aurait contraint `LayoutPrincipal` (`min-h-dvh`), dont `dvh` est instable
    sous la barre d'adresse mobile.
  - La safe-area est ajoutée au décalage, pas redoublée.
- **Date future.**
  - `groupeDeJour` rend `null` à partir de demain minuit : la carte quitte l'Accueil et reste dans
    l'onglet Parties.
  - Plus tard dans la même journée, elle est rangée sous « Aujourd'hui ».
  - Testé jusqu'à l'an 2100 et `MAX_SAFE_INTEGER`.
- **Partie en cours** : toujours en tête, même si elle tombe dans un groupe, et retirée de ce
  groupe.
- **Ordre dans un groupe** : `createdAt` décroissant, cohérent avec l'heure affichée. Le port,
  lui, trie par `updatedAt`.
- **Clé de l'Accueil** : `[...CLE_HISTORIQUE, 'accueil']`.
- **Chargement** : le squelette attend aussi les profils, pour que « Créer un joueur » ne
  clignote pas.
- **Statuts.**
  - X01 : toujours « N manche(s) jouée(s) », « 0 manche jouée » au départ.
  - Tour du monde, Cricket et entraînement non terminés : « En cours », ou rien quand le badge
    « Abandonnée » est déjà là.
  - Cricket terminé sans vainqueur : « Terminée », un cas qui ne devrait pas arriver.
- **Historique** : l'heure reste `dateHeure(createdAt)`.
- **Noms des joueurs** : `sr-only` sur la carte ; seuls les avatars se voient.
- **Minuit (Q4, accepté par l'utilisateur)** : pas de minuteur. Un Accueil laissé ouvert à
  travers minuit se recalcule à la navigation suivante.

## Écarts à l'architecture

Aucun écart de fond. Deux fichiers non cités par l'architecture :
- `clesRequetes.ts`, justifié ci-dessus ;
- `index.css` (`--hauteur-nav-basse`), une variable sans couleur dont dépend `NavigationBasse`.

## Questions ouvertes

| # | Question | Owner | Résolution |
|---|---|---|---|
| D1 | Gravure : `CLAUDE.md` § DS, charte, `CONVENTIONS` § 13 et 14, glossaire, `PROJECT_PLAN` | Orchestrator | En fin de lot, après le go (liste à confirmer par la Revue) |
| D2 | `ActionsFinDePartie.tsx` écrit encore `['matchEnCours']` / `['historique']` en littéraux au lieu de `clesRequetes.ts` | Orchestrator | **Laissée** : comportement identique, hors du périmètre fonctionnel ; la Revue peut demander l'alignement |
| Q3 | Forme de « Abandonnée » : un badge texte bordé `craie/40` | Utilisateur | Relecture à l'écran |
| Q5 | Bouton fixé en `sticky` | Utilisateur | Relecture sur appareil réel |

## Correction — tour 1 (boucle 1, Test → Dev, 2026-10-13)

> `dev` sonnet / medium. Contrôles relancés par l'Orchestrator : lint 245 ; typecheck 0 ;
> **761 / 761** (+17) ; build vert. Contre-épreuves rejouées par l'Orchestrator : M1 (2 échecs),
> M2 (4), M4 (1), M7 (21), **S1 (3), S2 (1)** : les deux survivants du Test tombent maintenant.

- **C2.** `--hauteur-nav-basse` (3,5 rem) est désormais la hauteur **totale** du `<nav>`, filet
  de 3 px compris : `h-[calc(var(--hauteur-nav-basse)+env(safe-area-inset-bottom))]`
  `overflow-hidden`. C'est la seule source du décalage du bouton fixé. `AccueilEcran` ne change
  pas.
  - Les onglets s'étirent dans cette hauteur (`min-h-0`) et gardent 53 px sous le filet.
  - ⚠️ **Compromis** : avec une police système très agrandie, le libellé d'un onglet est
    **rogné** au lieu de faire grandir la barre.
  - Les autres écrans qui ont la barre peuvent bouger d'un ou deux pixels.
- **C7.** Un X01 terminé affiche « Kevin gagne · 3 manches » (`libelleGagneEnManches`, « 1
  manche » au singulier). En cours, il reste « N manche(s) jouée(s) ». Un vainqueur supprimé
  prend le repli de `nomJoueur`.
- **C6.** Le commentaire de `MatchSummary.ts` est corrigé : les champs servent aux use cases, aux
  tests et à un éventuel écran de détail. Rien n'est retiré.
- **Tests** : 14 ajoutés, 5 modifiés.
  - `renderWithServices` gagne une option `queryClient?`, non cassante.
  - **C1** : 3 tests avec un seul `QueryClient` partagé en `staleTime` infini (fin de partie par
    « On remet ça », suppression à l'Historique, import dans les Réglages). Le test :510 est
    renommé « Accueil rouvert à neuf (autre client) ».
  - **C3** : 2 tests à 21 parties (non terminée ancienne dans la fenêtre : « Abandonnée »,
    personne d'épinglé ; au-delà de 7 jours : absente).
  - **C4** : 3 tests (annulation de la volée gagnante, sets compris ; deux joueurs à une manche
    chacun).
  - **C5** : pas de « En cours » à côté de « Abandonnée » ; « En cours » en entraînement et au
    Cricket ; ✓ présent ou absent ; liseré par l'attribut `style` (`var(--accent-…)`) ;
    vainqueur X01 avec pluriel et joueur supprimé.
  - **C8** : quatre titres renommés.
- **Mutations du Dev** :
  - sans l'invalidation de l'Historique, 3 échecs ;
  - sans celle des Réglages, 1 échec ;
  - sans les deux de `ActionsFinDePartie`, 1 échec.
  - ⚠️ Retirer **seulement** `['historique']` de `ActionsFinDePartie` laisse tout vert :
    l'invalidation de `['matchEnCours']` suffit au test, puisque la nouvelle partie est épinglée.
- Branche « Terminée » du Cricket : non testée, jugée inatteignable.

## Correction — tour 2 (boucle 1, Test → Dev, 2026-10-13)

> `dev` sonnet / medium. Contrôles relancés par l'Orchestrator : lint 245 ; typecheck 0 ;
> **763 / 763** (+2) ; build vert. Mutation N3 rejouée par l'Orchestrator : sans
> `invalidateQueries(['historique'])` dans `ActionsFinDePartie`, **1 échec** (le nouveau test) ;
> fichier restauré à l'identique (`Get-FileHash`).

- **N1.** `focus-visible:outline-offset-[-2px]` sur les `NavLink`, avec un commentaire.
  - L'anneau est tracé **à l'intérieur** de l'onglet. Le `<nav>` garde `overflow-hidden` et sa
    hauteur fixe, donc C2 ne bouge pas.
  - L'utilitaire suit la règle de base dans le CSS construit.
  - Le bas de l'anneau reste au-dessus de la safe-area. Aucune couleur nouvelle.
  - Retirer `overflow-hidden` a été écarté, car il tient la hauteur fixe.
- **N2.** Le test du lancement vérifie aussi que `CLE_MATCH_EN_COURS` est invalidée.
- **N3.** Nouveau test, « On remet ça » depuis l'onglet Parties : cache chaud, `staleTime`
  infini, on attend 2 parties.
- **N4.** L'assertion négative du test de suppression passe sous `waitFor`.
- **N5.** Le commentaire de `MatchSummary` est complété (`targetsTotal`, `id`, `createdAt`,
  `updatedAt`).
- **N7.** Nouveau test : le `calc` du `bottom-[…]` du bouton fixé doit être identique à celui du
  `h-[…]` de la barre.
- **À voir à l'écran** : l'anneau intérieur de 2 px sur un onglet **actif** ne doit pas se
  confondre avec son trait laiton de 3 px.

## Correction — tour 3 (boucle 5, Revue → Dev, 2026-10-13)

> `dev` sonnet / medium. Contrôles relancés par l'Orchestrator : `biome check src tests`
> 235 fichiers, 0 diagnostic ; typecheck 0 ; **765 / 765** (+2) ; build vert.
> ⚠️ `npm run lint` est **rouge** (193 erreurs), mais **toutes hors du lot**, dans
> `.claude/skills/impeccable/scripts/` (skill installé par l'utilisateur à 13 h 37 et lu par
> Biome, dont les `includes` couvrent `**`).
> ⚠️ **Incident** : le Dev a lancé `npm run lint:fix` sur tout le dépôt (« Fixed 7 files »). Les
> 7 fichiers réécrits sont des scripts de ce skill (horodatés 13 h 59, contre 13 h 37 pour le
> reste). Ils ne sont pas suivis par git, donc l'Orchestrator ne peut pas les restaurer.
> Signalé à l'utilisateur.

- **R1.** Le français des règles courtes passe dans `labels.ts` : `reglesTourDuMonde`,
  `reglesCricket`, `reglesEntrainement` et `reglesX01`, qui prennent des primitives.
  - Le `switch` exhaustif reste dans `CartePartie`, dans une fonction privée `regles` : plus
    d'export.
  - `recap*` n'est pas réutilisé, car son texte diffère. Le texte visible ne change pas.
- **R2.** `libelleSetsGagnes` et `libelleManchesDuSet` sont supprimés.
- **R3.** `MatchStatus = 'FINISHED' | 'ONGOING' | 'ABANDONED'` et `matchStatus(summary,
  ongoingId)` sont dans `summarize.ts`. Le test s'appelle désormais
  `tests/use-cases/matchStatus.test.ts`. Les noms locaux de l'UI restent en français.
- **R4.** `ActionsFinDePartie` utilise `CLE_MATCH_EN_COURS` et `CLE_HISTORIQUE`.
- **R5.** Un `<h2 className="sr-only">` (`TITRE_PARTIE_EN_COURS`) précède la carte épinglée.
  Un nouveau test de hiérarchie échoue sans lui (mutation du Dev).
- **R6.** Les commentaires de `MatchSummary.ts` et `GetOngoingMatch.ts` sont corrigés.
- **R10.** Nouveau test de bout en bout : reprendre une partie « Abandonnée », y jouer une
  volée, revenir ; les statuts s'inversent. Il tourne sur le client par défaut, comme en
  production.
- Recherches du Dev, toutes conformes :
  - aucun `StatutDePartie`, `'ABANDONNEE'` et apparentés ;
  - plus de libellés morts ;
  - plus d'export de `libelleRegles` ;
  - les clés littérales ne restent que dans `clesRequetes.ts`, plus deux commentaires.
- À l'écran, seul change un `h2` invisible.

## Ce qui ne se voit qu'à l'écran

- Le `sticky` au-dessus de la barre du bas : iPhone avec safe-area, paysage peu haut (environ
  120 px pris par la barre et le bouton).
- Le fond uni `bg-feutre` du bouton contre le tapis, dans les deux thèmes.
- La lisibilité du badge « Abandonnée », du ✓ `text-laiton` et du texte `craie/70` en clair.
- Les noms de partie longs (`break-words`) et la hauteur d'une carte avec « Reprendre ».
- Le rendu avec 0, 1 et 15 parties : « visible sans défiler » n'est prouvé que par la
  structure.
- L'Historique sans scores par joueur (résolution 2) : à voir.
