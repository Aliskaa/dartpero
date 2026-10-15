# Lot `nouvelle-partie-parcours` — notes de dev

> Source : rapport de l'agent `dev` (sonnet / medium, 1 lancement, 2026-10-15), retranscrit par
> l'Orchestrator. Liste des fichiers recoupée avec `git status`.

## Résultat

Implémenté sans refonte d'architecture. `npm run lint`, `npm run typecheck`, `npx vitest run`
(65 fichiers, **1091 tests**, 1065 avant) et `npm run build` : verts d'après le Dev (Test les
relance). Rien de committé ; serveur 5202 arrêté.

## Fichiers

**Créés** : `src/core/application/ports/driving/ShuffleOrder.ts`,
`src/core/application/use-cases/ShuffleOrderUseCase.ts`,
`src/ui/ecrans/nouvelle-partie/BarreEtapes.tsx`, `src/ui/ecrans/nouvelle-partie/ChampNom.tsx`
(déplacé d'`EtapeJeu`), `tests/use-cases/shuffleOrder.test.ts`.

**Supprimé** : `src/ui/ecrans/nouvelle-partie/Bascule.tsx` (T2 : plus aucun import).

**Modifiés (src)** : `src/composition/container.ts` (`Services.shuffleOrder`, même `random`) ;
`src/ui/hooks/useNouvellePartie.ts` (interrupteur retiré, `tirerAuSort(mode)`) ;
`src/ui/labels.ts` ; `src/ui/ecrans/nouvelle-partie/` : `EnTeteEtape` (prop `barre`), `EtapeJeu`,
`EtapeJoueurs`, `EtapeOrdre`, `ListeOrdonnable`, `RangeeJoueurs`, `ReglagesJeu`,
`NouvellePartieEcran`.

**Modifiés (tests)** : `nouvellePartie.test.tsx`, `nomDePartieEcrans.test.tsx`,
`cricket.test.tsx`, `tourDuMonde.test.tsx`, `parcours.test.tsx`,
`pictogrammesEmplacements.test.tsx`.

**Modifiés (docs)** : `CLAUDE.md` (§ Décisions structurantes : nom à l'étape 2, « Parcours
Nouvelle partie, habillage »), `.claude/CONVENTIONS.md` § 14, `docs/CHARTE_GRAPHIQUE.md` (« Le
parcours Nouvelle partie » sous § Composants), `docs/PROJECT_PLAN.md` (routes, § 4, § 6 et les
deux dettes). `.ai/architecture-context.md` non touché.

## Choix dans le cadre de l'architecture

- **Tirage (Q1)** : `tirerAuSort` appelle `services.shuffleOrder.execute(selection)` depuis un
  `onClick` (T5), écrit `partie:joueurs`, aucune relance. Mouvement : la `key` du `<ol>` de
  `ListeOrdonnable` change à chaque tirage (`tirages`), la feuille rejoue `animate-monter` (token
  existant, 240 ms, sans rebond), coupé par le `prefers-reduced-motion` global ; il rejoue même si
  l'ordre ne change pas. Annonce : `<output className="sr-only">` « Ordre tiré au sort : A, B, C.
  A commence. » (nouveau libellé `annonceTirage`, `annonceOrdre` étant par joueur).
- **Barre d'étapes** : prop `barre` d'`EnTeteEtape` (T3). Ordre grisé à un joueur : trait un cran
  plus pâle (`data-etat="grise"`), texte à `craie-3` (plancher).
- **Fiche** : récap en `<output aria-label="Réglages choisis">`, `principal` / `secondaire` (T7) ;
  Sortie / Entrée en `ChoixSegmente` Libre / Sur un double ; Sets Sans / 2 / 3 ; cartes Cricket en
  `aria-pressed` ; « Plus de réglages » état local, replié à chaque montage, retour d'Ordre
  compris (T4, testé) ; fiche en `<section aria-label="Réglages du jeu">`.
- **Dépliant** : les 7 cibles du Cricket et les 21 cases du Tour du monde (grille 7 colonnes,
  20 et bulle en laiton), depuis `CRICKET_TARGETS` / `TOUR_DU_MONDE_TARGETS`, seulement déplié
  (critère 7 ; la planche n'en a que le CSS).
- **Rangée de joueurs** : pastille 40 px, pseudo tronqué (Q4), « Ajouter » sous le « + » ; ×
  `size-12` à cheval sur le coin (décalé de `-5` à `-6` après captures : il rognait les
  initiales) ; libellé « Retirer X de la partie ». Compteur « n / max ».
- **Association des pictogrammes** : test écrit en dur d'après la planche (P3-1 levée).
- **Libellés retirés** : `reglesCarteJeu`, `aideSets`, `LIBELLE_DOUBLE_*`, `AIDE_DOUBLE_*`,
  `*ORDRE_ALEATOIRE`, `ORDRE_TIRE_AU_SORT`, `quiCommence`, `rangOrdre`, `SOUS_TITRE_ETAPE_JEU`,
  `TITRE_PANNEAU_REGLAGES`. `recapEntrainement` gardé (importé par `EntrainementEcran`).

## Écarts à la planche signalés par le Dev

- Tranchés par la demande : laiton unique, × conservé, barre à un joueur Ordre grisé ; bouton de
  l'étape 2 « Continuer → » ou « Commencer » seul en piste.
- **Non tranchés** : « Commencer » de l'étape Ordre calé en bas d'écran (`mt-auto`), alors que
  la planche le colle sous la liste (grand vide au milieu en portrait) ; chevron des dépliants
  `ChevronRight` pivotant au lieu du « › » de la planche.

## Questions ouvertes du Dev

- D1. Paragraphe « Les règles en entier » du X01 : aucun n'existait ; `PARAGRAPHE_X01` écrit
  d'après `CLAUDE.md` § Règles X01 (bust, sortie / entrée sur un double, bulle à 50).
- D2. Ligne de règles du Cricket en cut-throat (planche : standard seul) : « Gagne celui qui a
  tout fermé avec le plus petit score. »
- D3. « Sans » dans le segment Sets ; récap « Premier à N sets » au-delà de 1.
- D4. Capitales par CSS (`uppercase`) : libellés en minuscules dans `labels.ts`.

## Captures

56 PNG dans `C:\Users\kevin\Documents\Flechettes\docs\maquettes\nouvelle-partie-parcours\`
(`{sombre|clair}-{portrait|paysage}-NN-….png`, 390 × 844 et 844 × 390) : étape 1, étape 2 X01 à
1 / 2 / 4 joueurs et déplié, Cricket standard et cut-throat, Tour du monde, Entraînement, Ordre
à 4 joueurs avant / après tirage et à 2. Relues à l'œil par le Dev : sombre portrait, clair
portrait (X01 à 4), clair paysage (Ordre tiré) ; les autres paysages non relues une à une.

Angles morts : barre et pseudos à police max sur 360 px, contraste réel, rendu du mouvement (le
test vérifie la classe, pas l'animation).

## Résolution des questions (Orchestrator, 2026-10-15)

- **D4** — Close (technique) : capitales par `uppercase`, pattern existant des étiquettes ; les
  lecteurs d'écran lisent la casse du texte source.
- **D3** — Close : « Sans » est le libellé de la demande (« Sans | 2 | 3 ») ; « premier à N
  sets » suit la convention gravée « premier à N » et `libelleFormat`.
- Tranchées par l'utilisateur (2026-10-15), **sans changement de code** :
  - **D1** — `PARAGRAPHE_X01` gardé tel quel (le lot 11 le réécrira).
  - **D2** — « Gagne celui qui a tout fermé avec le plus petit score. » validé.
  - **« Commencer » de l'étape Ordre** — reste **en bas d'écran** (écart à la planche, voulu).
  - **Chevron** — l'icône de l'app qui pivote d'un quart de tour, validée.

## Boucle 1, tour 1 (Test → Dev, 2026-10-15)

> Source : rapport de l'agent `dev` (sonnet / medium, 2e lancement). Commandes relancées par
> l'Orchestrator : lint (275 fichiers), typecheck, **65 fichiers / 1104 tests**, build — verts ;
> absence de mutation résiduelle vérifiée dans `useNouvellePartie.ts:230`, `EtapeJoueurs.tsx:119`,
> `BarreEtapes.tsx:29-37`.

- **Q-A** : `PICTOGRAMME_PAR_MODE` déplacé dans `src/ui/composants/commun/Pictogramme.tsx` ;
  imports de `EtapeJeu`, `ReglagesJeu`, `pictogrammesEmplacements.test.tsx` mis à jour.
- **T1** : lancement X01 avec Sortie « Sur un double » → `doubleOut: true` (et `doubleIn: true`)
  dans `partie.config` et dans l'événement d'ouverture.
- **T2** : dépliant X01 (« Avec la sortie sur un double ») et entraînement (« écartés du
  tirage ») absents replié, présents déplié.
- **T3** : `aria-current` à « 2 · Réglages » et « 3 · Ordre » ; `data-etat="fait"` des étapes
  passées.
- **T4** : sous-titres de l'Ordre (X01 · 501, Cricket · Standard / Cut-throat, Tour du monde) ;
  nom tapé à l'étape 2 lancé depuis l'Ordre → `name` dans l'ouverture.
- **T5** : `sansLeg(temoin)` (témoin positif, « best of » aussi) étendu à l'étape 1, aux quatre
  étapes 2 tout déplié et à l'Ordre. Défaut du helper corrigé : `texteAffiche` collait les nœuds
  voisins (`body.textContent` → « legCommencer ») ; il parcourt désormais les nœuds texte
  (`TreeWalker`), séparés par une espace.
- **T6** : `tourDuMonde.test.tsx` — l'assertion vide remplacée par trois qui peuvent échouer
  (pas de « Plus de réglages », pas de « sur un double », pas de groupe « Sortie »).
- **T7** : « Commencer » grisé à 0 joueur (message vide, `0 / 4`), rallumé à l'ajout.
- Contre-épreuves par mutation temporaire de `src/`, restaurée : T1, T2 (X01), T3, T4, T5 (trois
  cas, le dernier seulement après le correctif du helper), T6, T7 échouent comme attendu. Non
  muté : le cas entraînement de T2.
- Aucune question ouverte.