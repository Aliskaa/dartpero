# Lot `accueil-parties-recentes` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (opus / max,
> frontmatter ; Read / Grep / Glob : fichiers finaux lus en entier, pas le `git diff`).
> Compléments exécutés par l'Orchestrator (2026-10-13) :
> - `git diff -- src/index.css` : seul le bloc `--hauteur-nav-basse` et son commentaire ;
> - `git show HEAD:…/ApercuPartie.tsx` : `libelleRegles` y existait déjà, avec le français en
>   dur. La dette R1 est donc héritée, mais installée par le lot dans un composant commun neuf ;
> - `git status` : `.claude/skills/emil-design-eng/`, `.claude/skills/impeccable/` et
>   `skills-lock.json` sont **hors du lot** (skills installés entre-temps). À ne pas indexer.

## Verdict initial : NO-GO

Aucun constat bloquant ni majeur. Cinq constats mineurs renvoyés vers Dev (R1 à R5), par une
seule passe courte (boucle 5, tour 3 / 5), puis une Revue limitée au delta.

## Tenue des phases

- **Dev** a livré le design d'Archi. Ses écarts sont justifiés : `clesRequetes.ts`, la variable
  CSS, les props `quand` et `niveauTitre`, la hauteur fixe de la barre.
- **Test** a couvert les vraies zones de risque : fenêtre, minuit et changement d'heure avec
  préconditions, « Abandonnée » sous filtre de mode, limite des 20, invalidation avec un client
  partagé, mutations, identité des `calc`.
- **Sécurité** a lu le code réel ; l'Orchestrator a exécuté les contrôles.
- **Ce qu'aucune phase n'a vu** :
  - une surface exportée du cœur en français ;
  - le code mort laissé par la suppression d'`ApercuPartie` ;
  - le français hors de `labels.ts` dans un fichier créé par le lot.

## Constats

| # | Sév. | Constat | Preuve | Renvoi |
|---|---|---|---|---|
| R1 | mineur | **C9 b.** `libelleRegles` écrit du français en dur hors de `labels.ts`, dans un composant commun **créé par le lot**, et il est exporté sans appelant. Il a déjà des quasi-doublons divergents (`recapX01` dit « sortie libre », `recapEntrainement` accorde « sortie »). Correction : les fragments vont dans `labels.ts` (constructeurs par mode, sur des primitives), le `switch` reste dans la carte, l'`export` disparaît, le texte visible ne change pas | `CartePartie.tsx:26-55` ; `request.md:93` ; `rules/frontend-react.md` ; `labels.ts:693-719` | **Dev** |
| R2 | mineur | Code mort : `libelleSetsGagnes` et `libelleManchesDuSet` n'ont plus d'appelant | `labels.ts:529-531` | **Dev** |
| R3 | mineur | **Surface exportée du cœur en français** : `StatutDePartie` (`'TERMINEE' \| 'EN_COURS' \| 'ABANDONNEE'`) et `statutDePartie`. Contraire à `CLAUDE.md` § Conventions de code, `CONVENTIONS` § 1 et `rules/typescript.md`. Correction : `MatchStatus = 'FINISHED' \| 'ONGOING' \| 'ABANDONED'` et `matchStatus(summary, ongoingId)`. Seule l'étiquette change : pas de boucle Archi | `summarize.ts:17,33` ; `CONVENTIONS.md:43-48` ; à comparer avec `GetPlayerStats.ts:11`, `PersistentStorage.ts:8`, `AppInstallation.ts:13,25` | **Dev** |
| R4 | mineur | **D2.** `ActionsFinDePartie` écrit les clés en dur alors que `clesRequetes.ts` en est la source unique | `ActionsFinDePartie.tsx:51-52` | **Dev** |
| R5 | mineur | **C9 c.** Saut de niveau de titre à l'Accueil : `h1`, puis la carte épinglée en `h3`. Option conseillée : un `h2` `sr-only` avant la carte épinglée, avec un libellé dans `labels.ts`. L'option `niveauTitre={2}` casserait le test :663-666. Ajouter une assertion de hiérarchie | `Logo.tsx:36` ; `AccueilEcran.tsx:139,175` | **Dev** |
| R6 | info | Deux commentaires inexacts : `MatchSummary.ts:90-92` (aucun fichier de `src/ui` ne lit `updatedAt` ; ligne de plus de 100 colonnes) et `GetOngoingMatch.ts:3-6` (le port sert aussi de référence à « Abandonnée ») | — | Dev, facultatif |
| R7 | info | **C9 a.** Précédent acceptable : fonction pure, bon sens de dépendance. Mais c'est le **premier import de `use-cases/` hors du composition root** | `container.ts:33-53` ; `StatistiquesEcran.tsx:3-7` | À documenter ; garde facultative au prochain audit |
| R8 | info | **C9 d.** Une erreur de lecture s'affiche comme « Pas de partie cette semaine ». Défaut antérieur, partagé par Parties et Stats, et aucun `ErrorBoundary` | `AccueilEcran.tsx:149-172` ; `main.tsx:44` | Laisser ; PLAN § 0 |
| R9 | info | **C9 e.** La doc cite encore `ApercuPartie` | Charte :236 ; `CONVENTIONS` :266, :357 ; PLAN :432, :1491 ; index :147 | Gravure |
| R10 | info | Scénario de bout en bout non testé : reprendre une partie « Abandonnée » et y jouer inverse les statuts | `GetOngoingMatchUseCase.ts:18-23` | Dev, facultatif |
| R11 | info | « Jusqu'à 31 cartes » (plan de test) est **inexact** : la partie en cours fait partie des 30 lues, le maximum est donc 30 | `03-plan-de-test.md:59` | Ne pas le recopier |
| R12 | info | `git status` contient des fichiers hors du lot (skills) ; `docs/request/accueil-parties-recentes.md`, lui, est à indexer | — | Commit |
| R13 | info | À la relecture : avec 15 cartes, l'invitation à installer n'arrive qu'en fin de défilement ; « Reprendre » refait un bouton primaire à la main au lieu de `classesBouton('primaire')` ; l'Accueil relit 20 + 30 journaux à chaque ouverture, temps à mesurer sur un vrai téléphone | `AccueilEcran.tsx:188` ; `CartePartie.tsx:167-171` | Relecture (utilisateur) |

**Invariants** : sens des dépendances OK ; aucun import entre modes ; ni couleur en dur ni
`rounded-*` (les trois exceptions seulement) ; aucune règle de jeu réimplémentée ; aucune
valeur persistée renommée. `CLAUDE.md` et l'index restent à graver.

## Réponses aux points posés

- **Amendement C7** : classé à juste titre comme un amendement, sans révision d'architecture.
  Aucune couche, aucun port ni aucune donnée ne s'ajoute. **Réserve** : `request.md` fait foi,
  donc l'amendement doit s'écrire là où il prime, en PLAN § 6 (⚠️) et sur la ligne `CartePartie`
  de la charte.
- **Clôture des questions** : aucune question n'est ouverte sans acceptation de l'utilisateur.
  - Closes : intake 1 (30), archi Q1, Q2, Q4, Q6 (par l'utilisateur), dev D1 et D2 (ici, R4),
    test C1 à C8 et N1 à N7, C9 (ici).
  - Assignées à la relecture : intake 2 / archi Q3 et Q5, ainsi que le rognage, l'anneau et le
    bouton.
  - Rattaché au constat #11 : S1.
- **C9 et D2** :
  - a → documenter (R7) ;
  - b → corriger (R1) ;
  - c → corriger (R5) ;
  - d → laisser et documenter (R8) ;
  - e → gravure (R9) ;
  - D2 → corriger (R4).
- **Compromis C2 / N1 : accepté sous conditions.**
  - Pour : une seule source du décalage, gardée par N7 ; un anneau entier ; 53 px d'onglet.
  - Contre :
    - rognage possible si un réglage agrandit le texte sans agrandir les `rem` ;
    - la barre passe de 59 à 56 px sur tous les écrans ;
    - `overflow-hidden` masque en silence ;
    - l'anneau est proche du trait.
  - Repli, si la relecture montre un rognage : un conteneur `sticky` unique dans
    `LayoutPrincipal` (changement de design, donc Archi).
  - **Conditions** :
    - voir la barre avec la police système au maximum sur l'Android de test **avant tout
      `firebase:deploy`** ;
    - documenter le compromis dans la charte.

## Points assumés après le lot

1. **Relecture à l'écran** :
   - la checklist de `03-plan-de-test.md`, ses ajouts et R13 ;
   - sur un vrai téléphone : le bouton fixé et la safe-area d'iPhone ;
   - la barre avec la police au maximum (Android : taille système et zoom de Chrome ; iPhone :
     taille du texte de Safari) ;
   - l'anneau sur l'onglet actif ;
   - la forme de « Abandonnée ».
2. R8 : les états d'erreur des listes, et l'absence d'`ErrorBoundary`.
3. S1 et constat #11 : un `createdAt` importé absurde.
4. C6 : les champs du port gardés.
5. La branche « Terminée » du Cricket, inatteignable.
6. Les captures du README à refaire : `accueil.png`, `accueil-clair.png`, `historique.png`.
7. Au prochain audit : une garde `*UseCase` (R7), les exports en français de `backupSchema.ts`
   (antérieurs au lot), la double lecture 20 + 30.
8. Q4 : pas de minuteur à minuit.

## Documentation à graver (liste de la Revue)

À faire après la passe Dev, avec le **compte de tests final**. ⚠️ Tailwind scanne les `.md` :
n'y citer que des classes déjà présentes dans `src/`.

1. **`CLAUDE.md` § DS** : une puce « Accueil en parties récentes ». ⚠️ **« Abandonnée » est
   dérivée, jamais enregistrée**, calculée en un seul endroit (`matchStatus`) contre la partie
   en cours **globale**. Conséquence : l'Accueil devient une **surface gravée**. Ce choix
   revient à l'utilisateur ; s'il refuse, rien dans `CLAUDE.md`.
2. **`CONVENTIONS`** :
   - § 8 / § 9 : les imports du cœur par l'UI (types, constantes, fonctions pures dont
     `matchStatus` ; jamais une classe `*UseCase`) ;
   - § 9 : une carte, une seule cible (`actions` hors du lien, `niveauTitre`) ;
   - § 10 : `clesRequetes.ts`, ses deux clés, qui les invalide, et le piège du chargement à la
     demande ;
   - § 11 : prouver une invalidation avec un client partagé en `staleTime: Infinity`, plus le
     test structurel N7 ;
   - § 13 : `CartePartie` remplace `ApercuPartie`, et ce qu'elle doit au mode suivant ;
   - § 14 : l'arbre (`CartePartie`, `matchStatus`, `clesRequetes.ts`, `jourCalendaire.ts`).
3. **Glossaire** : abandonnée (`'ABANDONED'` / `matchStatus`), partie en cours
   (`GetOngoingMatch`, 20 dernières), manches jouées (`legsPlayed`).
4. **`frontend-react.md`** : une fonction pure d'`application` s'importe comme le domaine,
   jamais un use case hors de `useServices()`.
5. **Charte** :
   - ligne `CartePartie` (avec l'amendement C7) à la place d'`ApercuPartie` ;
   - barre en hauteur fixe et même `calc` que le bouton ; le compromis du rognage ;
   - le liseré des cartes dans § Accent ;
   - § Focus : −2 px sur les onglets ;
   - facultatif : « ne pas redonner une `min-height` à la barre ».
6. **`PROJECT_PLAN`** :
   - § 0 : le compte de tests et les vérifications restantes ;
   - § 2 : `legsPlayed`, `matchStatus`, et le rôle de `GetOngoingMatch` ;
   - § 3 : `/` et `/historique`, la barre à quatre entrées ;
   - § 4 : l'entrée « Fait » ;
   - § 6 : le journal du lot, ⚠️ l'amendement C7, le compromis C2 / N1 et son repli ;
   - :432 et :1491 : `ApercuPartie`. Ne pas recopier « 31 cartes ».
7. **README** : le compte de tests (l. 144 et l. 274), une puce « L'accueil en parties
   récentes », les captures (renvoi à PLAN § 0).
8. **Index** : `/refresh-architecture` en dernier.

## Rejeu après tour 3 (2026-10-13) : **GO**

> `review` opus / max, lecture seule. Vérification finale de l'Orchestrator sur l'arbre final :
> lint vert (246 fichiers), typecheck 0, **765 / 765**, build vert.

- **R1, R2, R3, R4, R5, R6 et R10 : levés**, vérifiés dans le code, sans régression dans le
  delta. Contre-épreuves M4, S1, N3 et R5 rouges. T1 : dette acceptée par l'utilisateur.
- **`biome.json`** : changement légitime dans ce lot (décision écrite de l'utilisateur, une
  ligne, override du cœur intact). Il est à noter en PLAN § 6, dans `rules/biome.md` et dans le
  message de commit, pas dans `CLAUDE.md`. Réserve : l'exclusion couvre aussi **nos** skills
  (aujourd'hui du Markdown seulement), il faut l'écrire.
- **V1 (vérification) : levé.** La Revue soupçonnait que le « lint vert » datait d'avant la
  réinstallation d'`impeccable` et que `.agents/` échappait à l'exclusion. Constats de
  l'Orchestrator :
  - `biome.json` exclut maintenant aussi `"!**/.agents"`, ligne ajoutée hors de la session de
    l'Orchestrator, gardée telle quelle ;
  - `.agents/skills` est vide (0 fichier) ;
  - `impeccable` est réinstallé dans `.claude/skills/impeccable` (16 h 44), donc exclu ;
  - lint vert sur l'arbre final.
- **Infos** :
  - N1 : le commentaire de `GetOngoingMatch.ts:5` dit « Reprendre la partie » ; à corriger au
    prochain passage ;
  - N2 : PLAN § 3 est périmé (ancien Accueil, cinq onglets) ;
  - N3 : la portée de « jamais `invalidateQueries` » dans `CONVENTIONS` § 10 est à préciser ;
  - T2 : antérieur au lot.

**Indexation au commit** :
- **à indexer** : `biome.json`, `docs/request/accueil-parties-recentes.md`,
  `docs/lots/accueil-parties-recentes/` ;
- **jamais** : `.claude/skills/emil-design-eng/`, `.claude/skills/impeccable/`, `.agents/`,
  `skills-lock.json`.

### Documentation à graver (liste finale, remplace la précédente)

1. **`CLAUDE.md` § DS** : selon la réponse de l'utilisateur (puce « Accueil en parties
   récentes » portant sur la **règle** « Abandonnée », pas sur la mise en page ; recommandée).
2. **`CONVENTIONS`** :
   - § 8 : imports du cœur par l'UI (types, constantes, fonctions pures dont `matchStatus` ;
     jamais une classe `*UseCase`) ;
   - § 9 : une carte, une seule cible ; `actions` hors du lien ; `niveauTitre` ; les règles en
     constructeurs sur primitives dans `labels.ts`, le `switch` dans le composant ; pas de saut
     de titre (`h2` `sr-only`) ;
   - § 10 : `clesRequetes.ts`, qui invalide quoi, le piège du chargement à la demande, la portée
     de N3 ;
   - § 11 : invalidation sur client partagé en `staleTime: Infinity`, comportement réel sur le
     client par défaut (R10), test structurel N7 ;
   - § 13 et § 14 : `CartePartie`, l'arbre, les lignes :266 et :357.
3. **Glossaire** : abandonnée, partie en cours, manches jouées.
4. **`rules/frontend-react.md`** : fonction pure d'`application` ; use case par
   `useServices()` ; `clesRequetes.ts`.
5. **`rules/biome.md`** : les exclusions `.claude/skills` (qui couvre aussi nos skills) et
   `.agents` ; la leçon de l'incident : `lint:fix` sur les chemins du lot, jamais sur tout le
   dépôt.
6. **Charte** :
   - la ligne `CartePartie` (avec C7) ;
   - la barre en hauteur fixe et le même `calc`, le compromis et son repli ;
   - le liseré dans § Accent ;
   - § Focus : −2 px.
7. **PLAN** :
   - § 0 : **765 tests, dont 76 du lot** ; vérifications restantes, dont la police au maximum
     **avant tout `firebase:deploy`** et trois captures ; prochain audit : T1, R7,
     `backupSchema`, double lecture 20 + 30, R8, T2 ; S1 rejoint le constat #11 ;
   - § 2 ;
   - § 3 : N2 et :264-266 ;
   - § 4 ;
   - § 6 : ⚠️ C7, C2 / N1 et son repli, Q4, 30 cartes (pas 31), `clesRequetes.ts`, l'incident
     `lint:fix` et `biome.json` ;
   - :432 et :1491.
8. **README** : 689 → 765 (l. 144 et l. 274), la légende de la l. 75, une puce « L'accueil en
   parties récentes », les captures.
9. **Index** : `/refresh-architecture` en dernier.

## Commandes de contrôle demandées après la passe

- `npm run lint`, `typecheck`, `test`, `build`.
- Recherches qui doivent ne rien rendre :
  - `StatutDePartie|statutDePartie|'ABANDONNEE'|'EN_COURS'|'TERMINEE'` ;
  - `libelleSetsGagnes|libelleManchesDuSet` ;
  - `export const libelleRegles` ;
  - le français de règles dans `CartePartie.tsx`.
- `'historique'|'matchEnCours'` : seulement dans `clesRequetes.ts`.
- Mutations : M4 ; S1 (motif `'ABANDONED'`) ; N3 ; retrait du `h2` de R5.
