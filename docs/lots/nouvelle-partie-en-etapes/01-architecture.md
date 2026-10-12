# Lot `nouvelle-partie-en-etapes` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu (`archi-authority`, opus,
> effort max ; scout et designer sautés, surface gravée). Le rapport source commence par
> `Architecture result: PASS`.

## Problème

Remplacer la page unique `NouvellePartieEcran` par un parcours en trois étapes (le jeu, puis
joueurs et réglages, puis ordre de jeu), absorber `/entrainement`, passer « leg » → « manche »
à l'écran (annonces vocales comprises), exposer les sets, documenter le double out décoché à
la création, déplacer l'onglet Joueurs vers Réglages.

Contraintes : UI seule (aucune règle, aucun événement, ni schéma Dexie ni `backupSchema`),
routes lazy, retour du téléphone = étape précédente, aucune dépendance nouvelle, tout le
français dans `labels.ts`.

Surfaces gravées touchées : `CLAUDE.md` § DS (défauts X01, vocabulaire) et § Règles X01
(« Options », « Legs & sets ») — **documentation seulement**. Le seul fichier de `src/core/`
modifié l'est **en commentaire seulement** (§ 5).

## Options considérées

| Sujet | Option | Pour | Contre | Retenue |
|---|---|---|---|---|
| Étapes | État interne (`useState`) | Simple | Le retour du téléphone quitte l'écran : critère 13 échoue | Non |
| Étapes | Paramètres d'URL (`?jeu=…&etape=…`) | Une seule `<Route>` | URL opaque, deux paramètres à valider | Non |
| Étapes | `location.state` | — | Invisible, pas de lien profond, non testable par route | Non |
| Étapes | Routes imbriquées dans `App.tsx` (`<Outlet>`) | Idiomatique | `App.tsx` importerait chaque étape (statique interdit, ou lazy de plus) | Non |
| Étapes | **Routes descendantes sous `/nouvelle-partie/*`** | Une entrée d'historique par étape (retour natif) ; jeu dans l'URL ; un seul `lazy()` ; parent monté → état partagé sans contexte | Slug à valider, gardes, chemins absolus obligatoires | **Oui** |
| Défaut `doubleOut` du domaine | Passer à `false` | Un seul défaut | Change `X01Config.create()` dans les tests de règles (`tests/use-cases/playMatch.test.ts:37`…) et l'interprétation d'une sauvegarde sans `doubleOut` (`backupSchema.ts:113-119`) — hors périmètre | Non |
| Défaut `doubleOut` du domaine | **Garder `true`, documenter les deux défauts** | Aucun changement de comportement ; l'écran passe toujours la valeur | Deux défauts à expliquer | **Oui** |
| Glisser-déposer | Bibliothèque | — | Interdit | Non |
| Glisser-déposer | **Pointer Events natifs + clavier, `transform` pendant le geste, validation au relâcher** | DOM stable pendant le geste ; même `deplacer` pour doigt et clavier | Geste au doigt vérifiable sur appareil seulement | **Oui** |
| Boîte de dialogue | `role="dialog"` maison | — | Piège à focus, Échap, fond inerte à réécrire | Non |
| Boîte de dialogue | **`<dialog>` natif + `showModal()`** | Couche supérieure, fond inerte, Échap, `::backdrop` | jsdom 29 ne l'implémente pas (faux de test, § 2) | **Oui** |
| Menu « + » | Motif ARIA `menu` | — | Focus itinérant pour deux entrées | Non |
| Menu « + » | **Divulgation (`aria-expanded`) en ligne** | Accessible, testable, sans positionnement | — | **Oui** |
| Colonne « Manches » du tableau | Abréviation (« Man. ») | Grille inchangée | Illisible | Non |
| Colonne « Manches » du tableau | Élargir aux dépens de JOUEUR | — | « BULL » rogné en paysage (`LigneJoueur.tsx:41-48`) | Non |
| Colonne « Manches » du tableau | **Prendre la largeur sur VOLÉE** | JOUEUR intact | Relecture à l'écran obligatoire | **Oui** |
| Emplacement des composants | `composants/commun/` | — | Un seul consommateur | Non |
| Emplacement des composants | **Locaux au dossier du parcours** | Précédent `ChoixSegmente` (remonté au 2e consommateur) | — | **Oui** |

## Approche retenue

### 1. Chaque étape est une route

| URL | Écran | Composant |
|---|---|---|
| `/nouvelle-partie` | Étape 1, le jeu | `EtapeJeu` |
| `/nouvelle-partie/:jeu` | Étape 2, joueurs et réglages | `EtapeJoueurs` |
| `/nouvelle-partie/:jeu/ordre` | Étape 3, ordre de jeu | `EtapeOrdre` |
| `/nouvelle-partie/:jeu/joueurs` | « Sélectionner un joueur existant » (écran plein) | `ChoixJoueursExistants` |

- `:jeu` ∈ `x01`, `cricket`, `tour-du-monde`, `entrainement`. Nouveau `src/ui/chemins.ts` :
  `SLUG_MODE: Record<GameModeId, string>`, `cheminNouvellePartie(mode?)`, `cheminOrdre(mode)`,
  `cheminJoueursExistants(mode)`, `modeDuSlug(slug): GameModeId | null`,
  `ETAT_PARCOURS = { parcours: true }`, garde `vientDuParcours(state: unknown): boolean`.
- **`App.tsx`** : `<Route path="/nouvelle-partie/*" element={<NouvellePartieEcran />} />`, un seul
  `lazy()` vers `@/ui/ecrans/nouvelle-partie/NouvellePartieEcran` ; retirer
  `LancerEntrainementEcran` (lazy et route) ; ajouter
  `<Route path="/entrainement" element={<Navigate to={cheminNouvellePartie('CHECKOUT_PRACTICE')} replace />} />`.
- **`NouvellePartieEcran`** appelle `useNouvellePartie()` **une seule fois** et rend des
  `<Routes>` descendantes : `index`, `:jeu`, `:jeu/ordre`, `:jeu/joueurs`, `*` → étape 1
  (`<Navigate replace>`). Le parent reste monté entre étapes : les choix survivent au retour.
  ⚠️ Deux `usePreference` sur une même clé dans deux composants montés en même temps
  divergeraient : le hook vit dans le parent, les étapes reçoivent ses valeurs en props.
- **Gardes** : slug inconnu → étape 1 (`replace`) ; étape 3 ou sélection pour l'entraînement,
  ou étape 3 avec moins de 2 joueurs **une fois les profils chargés** → étape 2 (`replace`).
  ⚠️ Jamais tant que `joueurs.isPending` (sélection dérivée `[]` au chargement).
- **Avancer** : `navigate(chemin, { state: ETAT_PARCOURS })` (push). Le lien « Nouvelle partie »
  de l'Accueil porte aussi `state={ETAT_PARCOURS}`.
- **Bouton retour de l'écran** : `<button>` 48 px (`size-12`), qui fait
  `vientDuParcours(location.state) ? navigate(-1) : navigate(cheminPrecedent, { replace: true })`.
  Prédécesseurs : étape 1 → `/`, étape 2 → étape 1, étape 3 et sélection → étape 2. Le repli
  `replace` couvre les entrées profondes sans empiler de doublons.
- **Chemins absolus partout** via `chemins.ts` ; aucun `to` relatif sous le splat.
- **Défilement remis en haut** à chaque changement de `pathname` :
  `document.scrollingElement?.scrollTo?.({ top: 0 })` (pas `window.scrollTo`, non implémenté
  en jsdom 29).
- Démarrage : `navigate('/partie/:id')` en push, comme aujourd'hui.
- Inchangés : raccourci du manifeste `/nouvelle-partie` (`vite.config.ts:83`) et son contrôle
  `smoke` ; `NavigationRoute` du SW et réécriture `**` de `firebase.json` ; hors
  `LayoutPrincipal` (pas de barre du bas).

### 2. Composants (dans `src/ui/ecrans/nouvelle-partie/`)

Réutilisent `Avatar`, `Button`, `ChoixSegmente`, `Panneau`, `Etats`. Découpage en fichiers
indicatif, responsabilités obligatoires.

- **`EnTeteEtape`** (avec `useRetour`) : retour 48 px, `h1`, sous-titre. Étape 1 « Nouvelle
  partie » ; étape 2 `LIBELLE_MODE[mode]` ; étape 3 « Ordre de jeu » (jeu en sous-titre) ;
  sélection « Joueurs existants ». Pas de compteur « étape n sur N ».
- **`EtapeJeu` / `CarteJeu`** : quatre `Link` dans l'ordre X01, Cricket, Tour du monde,
  Entraînement ; liseré `border-l-4` coloré par `ACCENTS_MODE[mode].fond` (`var()` inline) ;
  icône lucide `aria-hidden`, titre, deux lignes de règles tirées de `labels.ts`, fidèles à
  `CLAUDE.md` § Règles et aux textes actuels. Entraînement : 41 et 170 lus sur `DEFAUT`
  (`checkout-practice/config.ts`), jamais recopiés.
- **`RangeeJoueurs`** : `<ul aria-label>` d'`Avatar` carrés (taille `lg`), nom tronqué, **×**
  ≥ 48×48 `aria-label="Retirer {nom} de la partie"` (retire de la sélection, jamais de la
  base) ; compteur `{n}/{max}` ; **+** `aria-label="Ajouter un joueur"`, `aria-expanded`,
  `aria-controls`, **masqué quand n = max** ; panneau de divulgation en ligne : « Nouveau
  joueur » (boîte de dialogue) et « Sélectionner un joueur existant » (→ `…/joueurs`), boutons
  pleine largeur ≥ 48 px, Échap referme, pas de `role="menu"`. Pas de défilement horizontal.
- **`DialogueNouveauJoueur`** : `<dialog>` natif, `showModal()` ; `onClose` resynchronise
  l'état ; focus sur le champ à l'ouverture ; `<form>` ordinaire (pas `method="dialog"`) ;
  libellé visible « Pseudo » ; `maxLength={20}` (`LONGUEUR_MAX` de `Player.ts`) ; « Annuler » /
  « Terminé » (désactivé si vide). Succès : `managePlayers.create` → `await
  invalidateQueries(CLE_JOUEURS)` → ajout à la sélection si n < max → fermeture. Erreur :
  `MessageErreur` (`role="alert"`) dans la boîte, messages actuels (« Ce pseudo est déjà
  pris. » pour `'Player name already taken'`, sinon « Ce pseudo n'est pas valide. »), passés
  dans `labels.ts`. Tokens seulement, aucun `rounded-*`.
- **`ChoixJoueursExistants`** : tous les profils en boutons bascule (`aria-pressed`) ; `Avatar`,
  nom, ligne « N manches » (`pluriel(legsPlayed, 'manche')`) **seulement si `legsPlayed > 0`** ;
  données de `services.getPlayerStats.execute('ALL_TIME')` sous la clé
  `['statistiquesJoueurs', 'ALL_TIME']` (cache partagé avec `StatistiquesEcran`) ; la liste
  n'attend jamais les stats ; un joueur coché s'ajoute en fin de sélection ; non cochés
  `disabled` quand n = max ; en-tête : retour et « Terminé » (même effet) ; base vide :
  `EmptyState` renvoyant à « Nouveau joueur ».
- **`ReglagesJeu`** : `switch` **exhaustif** sur `GameModeId` (garde `never`). X01 : Score de
  départ, Manches à gagner, Sets à gagner, `Bascule` Double out, `Bascule` Double in, aides.
  Cricket : « Comptage » + paragraphe actuel. Tour du monde : paragraphe actuel. Entraînement :
  explication + `ChoixSegmente` « Nombre de sorties » 5 / 10 / 20.
- **`EtapeJoueurs`** : rangée, réglages, ligne récapitulative, bouton principal :
  « Commencer » (entraînement ou n = 1), « Continuer » (n ≥ 2) ; désactivé si n = 0 ou en
  chargement ; erreur « Impossible de démarrer la partie. ».
- **`EtapeOrdre` / `ListeOrdonnable`** : `<ol aria-label="Ordre de passage">` ; par ligne rang
  « n°k », `Avatar`, nom, **poignée** `<button>` ≥ 48×48, `aria-label="Déplacer {nom}"`,
  `aria-describedby` vers « Glissez, ou flèches haut et bas », `GripVertical` `aria-hidden`,
  `touch-none select-none`, `[-webkit-touch-callout:none]`. Sous « Ordre aléatoire » : **ni
  poignée ni rang**, ligne « tiré au sort au lancement » ; sinon « {premier} commence ». Puis
  `Bascule` « Ordre aléatoire » et « Commencer ».
  - **Clavier** : ↑ / ↓ (`preventDefault`) → `deplacer(i, i∓1)`, rien aux bornes ; **focus
    rendu à la poignée déplacée** (refs par `PlayerId` + effet de mise en page) ; annonce dans
    un `<output className="sr-only">` : « {nom} : position k sur n ».
  - **Pointeur** : `pointerdown` (pointeur principal, bouton 0) → `setPointerCapture`, mesure
    des lignes **une fois** ; `pointermove` → la ligne suit en `translateY(dy)` bornée,
    `vers = rangVise(milieux, de, centre)`, les autres se décalent via `decalage(i, de, vers,
    h)`, aucun réordonnancement du DOM ; `pointerup` → `deplacer(de, vers)` ;
    `pointercancel` → abandon ; un tap sans mouvement ne fait rien ; pas de défilement auto.
- **`ordre.ts`** (pur, testé) : `deplacer(liste, de, vers)`, `rangVise(milieux, de, centre)`,
  `decalage(i, de, vers, hauteur)`.
- **`Bascule`** : déplacée telle quelle depuis l'ancien écran (étapes 2 et 3).
- **Hook `src/ui/hooks/useNouvellePartie.ts`** :
  - Clés conservées : `partie:variante-cricket`, `partie:score`, `partie:legs`,
    `partie:double-out` (défaut `false`), `partie:double-in`, `partie:joueurs`,
    `partie:ordre-aleatoire`.
  - Clés nouvelles : `partie:sets` (défaut 1) ; `entrainement:joueur` (`PlayerId | null`,
    défaut à la première lecture `partie:joueurs[0] ?? null`, repli seulement si la clé est
    absente — un × écrit `null`) ; `entrainement:sorties` (défaut `DEFAUT.rounds`, 10).
  - Clé abandonnée : `partie:mode` (plus lue ni écrite, jamais réutilisée).
  - Valeur mémorisée hors liste (`SCORES` 301/501/701, `LEGS` 1-4, `SETS` 1-3, `SORTIES`
    5/10/20, `CRICKET_VARIANTS`) → défaut.
  - Sélections dérivées et filtrées sur les profils existants ; entraînement : `[joueur]`
    restreint aux profils existants ; `max` = 1 (entraînement) ou 4 (`MAX_JOUEURS`).
  - `demarrer(mode)` : `switch` exhaustif — `startMatch.execute({ playerIds, config:
    X01Config.create({ startingScore, legsToWin, setsToWin, doubleOut, doubleIn }), shuffle })`,
    `playCricket.start`, `playTourDuMonde.start`, `playCheckoutPractice.start({ playerId,
    config: CheckoutPracticeConfig.create({ rounds }) })`. `shuffle = ordreAleatoire && n > 1`
    (le tirage reste dans le use case). Puis invalider `['matchEnCours']` (quatre modes) et
    naviguer.
- **Faux de test** dans `tests/setup.ts`, posés seulement s'ils manquent :
  `HTMLDialogElement.prototype.showModal` (pose `open`) / `close` (retire `open`, émet
  `close`) ; `Element.prototype.setPointerCapture` / `releasePointerCapture` /
  `hasPointerCapture` (no-op / `false`). Preuve : jsdom 29.1.1 a un `HTMLDialogElement-impl`
  vide et aucune capture de pointeur ; sa feuille UA masque `dialog:not([open])`.

**Testable en jsdom** : navigation entre étapes ; retour écran et téléphone (POP) ; ×, +,
menu, boîte de dialogue ; sélection (max, « N manches ») ; réglages (rails ciblés par
`group`) ; commandes de démarrage ; ordre au clavier, focus, annonce ; poignées masquées sous
tirage ; fonctions pures, libellés, absence de « leg », redirections, gardes.
**Hors jsdom** : glisser réel ; modalité de `<dialog>` ; retour Android sur une boîte ouverte ;
débordements, contrastes, 48 px.

### 3. Entraînement

- Carte de l'étape 1 ; étape 2 solo (max 1) avec « Nombre de sorties » puis « Commencer » ; pas
  d'étape 3.
- Supprimés : `LancerEntrainementEcran.tsx`, le bouton « S'entraîner au checkout » de l'Accueil
  (et l'import `Target`), le lien « Créer un profil ».
- **Redirection `/entrainement` gardée** → `/nouvelle-partie/entrainement` (`replace`).
- « Changer l'exercice » (`ResumeEntrainementEcran`) → `cheminNouvellePartie('CHECKOUT_PRACTICE')`.
- « Changer les règles » des résumés X01, Cricket, Tour du monde → étape 2 de leur mode ;
  `versReglages` devient **obligatoire** dans `ActionsFinDePartie`.

### 4. « Leg » → « manche » (liste exhaustive, relevée par grep)

Toute chaîne affichée créée ou modifiée vit dans `labels.ts` (`aria-label` et `title`
compris). Identifiants (`legsToWin`, `Leg`, `LegWon`, `libelleLegs`, `legsGagnes`…),
commentaires et clés persistées ne bougent pas. « Manche » est féminin : accorder.

| Fichier | Avant | Après |
|---|---|---|
| `labels.ts:387-395` | `'1 leg'`, `` `premier à ${n} legs` `` ; court `'1 leg'` | `'1 manche'`, `` `premier à ${n} manches` `` ; court `'1 manche'` / `` `premier à ${n}` `` |
| `labels.ts` (nouveau) | — | `libelleFormat(legs, sets)` : sets = 1 → `libelleLegs(legs)` ; sinon `` `premier à ${sets} sets · ${libelleLegs(legs)} par set` `` |
| `ApercuPartie.tsx:32` | `libelleLegs(legsToWin)` | `libelleFormat(legsToWin, setsToWin)` |
| `ApercuPartie.tsx:167` | `pluriel(legsWonInSet, 'leg')` | `pluriel(…, 'manche')`, précédé de `pluriel(setsWon, 'set') · ` si `setsToWin > 1` |
| `Tableau.tsx:114` | en-tête « Legs » | « Manches », `px-0.5 text-[0.55rem] tracking-normal` |
| `LigneJoueur.tsx:50` | `grid-cols-[minmax(0,1fr)_4.5rem_2rem_6.75rem]` | `grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_6.75rem]` (somme fixe 212 px, JOUEUR intact) ; commentaire des largeurs à jour |
| `LigneJoueur.tsx:211,214` | `Legs gagnés par …`, `libelle="Legs"` | `Manches gagnées par {nom} : x sur y`, `libelle="Manches"` |
| `X01Ecran.tsx:39` | `Leg {n}` | `Manche {n}` ; `<p>` en `flex-wrap gap-x-2 gap-y-0.5`, chaque `<span>` `whitespace-nowrap` |
| `momentVolee.ts:38` | `'Leg !'` | `'Manche !'` |
| `ResumeX01Ecran.tsx:51,125` | « Meilleur leg », « Legs » | « Meilleure manche », « Manches » |
| `StatistiquesEcran.tsx:140-147,174` | « Legs » (Gagnés / Joués), « Meilleur leg » | « Manches » (Gagnées / Jouées), « Meilleure manche » |
| Nouvelle partie | « Legs à gagner », aides | « Manches à gagner », aides en « manches » |
| Annonces vocales | aucune ne contient « leg » | inchangées ; un test le garantit |
| `Batons.tsx` | commentaire | commentaire seulement |

La « Manche N » de l'entraînement (`Cartouche`) reste : homonyme assumé, noté au glossaire.

### 5. Double out

**Le domaine garde `doubleOut: true`.** L'écran reste décoché par défaut
(`partie:double-out`, `false`) et passe toujours la valeur. Le commentaire de
`src/core/domain/games/x01/config.ts` (lignes 7-10 et 39) est réécrit, **aucune ligne de code
modifiée** :

> Défauts du domaine = la règle standard (501, premier à 2, 1 set, double out). L'écran de
> création propose double out désactivé et passe toujours la valeur. Ne pas aligner l'un sur
> l'autre.

### 6. Sets

Rail `ChoixSegmente` « Sets à gagner », valeurs `[1, 2, 3]`, défaut 1, clé `partie:sets`, vers
`X01Config.setsToWin`. Aide : 1 → « Sans sets : la partie se joue en manches. » ; au-delà, un
set se gagne au premier à N manches, la partie au premier à S sets (fidèle à `rules.ts`).
« Manches à gagner » garde sa légende ; son aide dit « par set » quand S > 1.

### 7. Navigation

- `NavigationBasse` : retirer `/joueurs` (et `Users`) ; quatre onglets ; commentaire « cinq »
  → « quatre ».
- `ReglagesEcran` : **premier** panneau « Joueurs », ligne « Renommer, changer la couleur,
  supprimer un profil. », `Link` « Gérer les joueurs » → `/joueurs` (48 px, chevron) ;
  sous-titre « Joueurs, affichage, sauvegarde et informations ».
- `JoueursEcran` **inchangé** (reste sous `LayoutPrincipal`). Pas de « Retour aux réglages ».
- Lien « Créer un joueur → » de l'Accueil inchangé (lot `accueil-parties-recentes`).

### 8. Questions non bloquantes de l'intake — tranchées

- **Dernier jeu mis en avant : non.** Les cartes sont à toucher pour avancer ; une carte
  présélectionnée se lirait comme un choix en attente. Ordre fixe, X01 en tête. Réversible à la
  relecture.
- **Redirection `/entrainement` : gardée** (§ 3).
- **Défaut `doubleOut` du domaine : `true` conservé** (§ 5).
- Cas limite « N manches » : une partie X01 sans manche terminée n'affiche **rien**.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | `games/x01/config.ts` | **Commentaire seulement** (§ 5) — la revue vérifie que le diff n'est que du commentaire |
| `core/application/` | — | — |
| `infrastructure/` | — | — |
| `ui/` | Créés : `chemins.ts`, `hooks/useNouvellePartie.ts`, `ecrans/nouvelle-partie/` (`NouvellePartieEcran`, `EnTeteEtape`, `EtapeJeu`, `EtapeJoueurs`, `RangeeJoueurs`, `DialogueNouveauJoueur`, `ChoixJoueursExistants`, `ReglagesJeu`, `EtapeOrdre`, `ListeOrdonnable`, `ordre.ts`, `Bascule`). Supprimés : `ecrans/NouvellePartieEcran.tsx`, `ecrans/games/checkout-practice/LancerEntrainementEcran.tsx`. Modifiés : `App.tsx`, `AccueilEcran`, `NavigationBasse`, `ReglagesEcran`, `ActionsFinDePartie`, les quatre résumés, `labels.ts`, `ApercuPartie`, `Tableau`, `LigneJoueur`, `Batons` (commentaire), `momentVolee.ts`, `X01Ecran`, `StatistiquesEcran` | Parcours en étapes, vocabulaire, navigation |
| `composition/` | — | — |
| `tests/` | `setup.ts` (faux § 2) ; `ui/gestes.ts` (`SondeHistorique` à côté de `<App />` dans `renderWithServices`, `retourTelephone()` = `navigate(-1)`) ; `architecture/lazyRoutes.test.ts` (retirer `'LancerEntrainementEcran'`, plancher 9 → 8, intitulés « 9 » → « 8 », commentaire « 17 » → « 16 ») ; réécrire / adapter `nouvellePartie.test.tsx`, `parcours.test.tsx`, `entrainement.test.tsx`, `tourDuMonde.test.tsx`, `cricket.test.tsx`, `lot4.test.tsx`, `resumeX01.test.tsx` ; nouveaux : `ordre.ts`, libellés | Voir § Attentes |

**Sens des dépendances vérifié :** l'UI n'appelle que des ports driving via `useServices()`
(`managePlayers`, `getPlayerStats`, `startMatch`, `playCricket`, `playTourDuMonde`,
`playCheckoutPractice`) et importe des fabriques / types de config du domaine (pratique en
place). `chemins.ts` n'importe que le type `GameModeId`. Aucun import d'UI dans `src/core/`,
câblage inchangé, override Biome et `hexagonalBoundary` inchangés. Les aiguillages par mode
(`ReglagesJeu`, `demarrer`) sont côté UI, comme `PartieEcran`. Aucune règle réimplémentée.
**Nouveau port ?** Aucun.

**Correspondance tests ↔ critères** :
1. Parcours X01 à 2 : `getMatchHistory()[0]` (mode, config complète, ordre).
2. Entraînement solo : pas de « Continuer » ; `…/entrainement/ordre` → étape 2.
3. Tour du monde ou Cricket à 3 : ordre à la poignée au clavier, puis démarrage.
4. Tirage : ni poignée ni rang, ordre rebattu par le use case.
5. Poignée : nom accessible, ↑ / ↓, focus conservé, annonce.
6. × : `listAll()` inchangé.
7. Création puis doublon : alerte, boîte toujours ouverte.
8. Max 4 : 5e désactivé, + absent ; « N manches » présent ou absent.
9. `setsToWin`.
10. Aucun « leg » : témoin positif (/manche/i présent), puis absence de `/\blegs?\b/i` dans
    `textContent`, `aria-label`, `title` — étape 2 X01, partie X01 sets 2 après une manche
    gagnée, résumé, statistiques, Accueil en cours, historique ; voix : annonceur factice, au
    moins une phrase, aucune avec « leg ».
11. Double out décoché sur préférences vierges, `doubleOut: false` au démarrage.
12. Quatre liens dans la barre, aucun « Joueurs » ; Réglages → « Gérer les joueurs » → `h1`
    « Joueurs » (`level: 1`).
13. Retour écran (`navigate(-1)` et `replace`) et `retourTelephone()` : 3 → 2 → 1 → Accueil,
    choix conservés.
14. Gardes, puis `lint`, `typecheck`, `build`, `smoke`.

Pièges : « 1 », « 2 », « 3 » dans deux rails → `within(getByRole('group', { name: 'Sets à
gagner' }))` ; le champ de la boîte s'appelle « Pseudo ».

## Décisions de `CLAUDE.md` concernées

Concernées : § DS « Réglages X01 par défaut », « best of N », « Modes de jeu » ; § Règles X01
« Bust », « Options », « Legs & sets », « Statistiques ».

**À graver dans le lot** (texte proposé par l'architecture) :

- **§ DS, lignes 78-79**, remplacées par :
  > - **Réglages X01 proposés à la création** (étape 2 de Nouvelle partie, mémorisés par
  > `usePreference`) : **501**, **2 manches à gagner**, **1 set** (pas de sets), **double out
  > désactivé**, **double in** désactivé.
  > ⚠️ **Double out : décoché à l'écran, activé dans le domaine, à dessein.** L'utilisateur a
  > choisi la sortie libre par défaut (`577dc5f`, entériné au lot `nouvelle-partie-en-etapes`) ;
  > l'écran passe **toujours** `doubleOut` à `X01Config.create`. Le défaut du domaine reste
  > `doubleOut: true` : c'est la règle standard, les tests de règles s'y adossent, et
  > `backupSchema` en complète une sauvegarde qui n'aurait pas le champ. Ne pas « aligner » l'un
  > sur l'autre.
- **§ DS, lignes 80-85** : « c'est désormais ce que l'UI affiche, via » → « c'est ce que l'UI
  affiche (« premier à N manches »), via ».
- **§ DS, deux puces ajoutées** :
  - « **À l'écran, on dit « manche », jamais « leg »** (lot `nouvelle-partie-en-etapes`) ;
    « leg » reviendra avec une éventuelle version anglaise. Le code garde `Leg`, `legsToWin`,
    `LegWon`, `libelleLegs`… et les clés persistées ne se renomment pas (`partie:legs`). « Set »
    reste « set ». Ce vocabulaire vit dans `src/ui/labels.ts`, annonces vocales comprises. »
  - « **Nouvelle partie en étapes** : le jeu, puis les joueurs et réglages, puis l'ordre de jeu
    (dès 2 joueurs). ⚠️ **Chaque étape est une route** (`/nouvelle-partie`,
    `/nouvelle-partie/:jeu`, `…/ordre`, `…/joueurs`), jamais un état interne : c'est ce qui
    fait que le retour du téléphone ramène à l'étape précédente. L'entraînement est une carte
    de l'étape 1 (`/entrainement` ne fait plus que rediriger) ; l'onglet Joueurs a quitté la
    barre du bas (Réglages, puis Joueurs). »
- **§ Règles X01, ligne 208** : « reste `== 1` (impossible à finir sur un double, quand `double
  out` est actif), **ou** » — précision alignée sur `visitOutcome.ts:84`, pas une règle
  nouvelle.
- **§ Règles X01 « Options », ligne 213** : « `double out` : quand il est actif, finir un leg
  exige un double. **Défaut du domaine : activé** ; **proposé désactivé à la création** (voir
  § Décisions structurantes). Sans double out, toute fléchette qui amène à 0 pile gagne le
  leg. » — conforme à `visitOutcome.ts:71-80`. Ligne 214 inchangée.
- **§ Legs & sets** : ligne 226 → « Un leg (« manche » à l'écran) est gagné par le joueur qui
  atteint **exactement 0**, sur un double si `double out` est actif. » ; ligne 228 → « Premier
  à N legs (`legsToWin`, défaut 2), éventuellement groupés en sets : premier à S sets
  (`setsToWin`, défaut 1, soit pas de sets) ; un set se gagne au premier à N legs. » (conforme
  à `rules.ts:132-145`, clôt le constat n° 1 de l'index).
- **§ Statistiques, ligne 237** : ajouter « (« meilleure manche » à l'écran) ».

**`.claude/rules/glossary.md`** :
- ligne 15 → `| manche / set | \`Leg\`, \`legsToWin\` / \`setsToWin\` | Manche X01 (*leg* dans le code) : gagnée en atteignant exactement 0, sur un double si double out. Un set se gagne au premier à N manches. On dit « premier à N manches », **jamais** « best of N » ni « leg » à l'écran. |` ;
- ligne 17 : « Finir un leg » → « Finir une manche » ;
- ajouter `| manche (entraînement) | \`rounds\` | Une tentative de l'entraînement : un reste tiré, une volée pour le sortir. Même mot que la manche X01, autre objet. |`.

**Autres documents du lot** : `CONVENTIONS.md` § 9 (« matchs, legs, doubles » → « matchs,
manches, doubles »), § 11 (faux de `setup.ts`, `retourTelephone`), § 13 (un mode n'a plus
d'écran de lancement : carte, réglages et branche `demarrer` dans `ecrans/nouvelle-partie/`,
slug dans `chemins.ts`), § 14 (arborescence) ; `rules/frontend-react.md` (structure, hooks) ;
`CHARTE_GRAPHIQUE.md` lignes 87, 209, 229, 295 (« LEG 2 » → « MANCHE 2 »), 322, 337 ;
`PROJECT_PLAN.md` § 3 (routes), § 0, § 4, § 6 (journal, clés nouvelles, `partie:mode`
abandonnée). Puis `/refresh-architecture` (clôt les constats n° 1, 8, 9 de l'index).

## Baseline sécurité

- **Réseau** : aucun `fetch`, SDK, CDN ; `reseauBoundary` vert.
- **Dépendance d'exécution** : aucune (Pointer Events et `<dialog>` natifs).
- **Permission** : aucune.
- **Import JSON** : non touché ; garder le défaut du domaine évite précisément de changer
  l'interprétation d'une sauvegarde.
- **Rendu des pseudos** : texte React uniquement (`title`, `aria-label` en attributs) ; aucun
  `dangerouslySetInnerHTML` / `innerHTML`.
- **Validation** : pseudo validé par le domaine (`Player.cleanName`, 20), `maxLength` = confort ;
  `:jeu` = clé dans une liste fermée, inconnu → redirection ; redirection `/entrainement` vers
  une constante interne (pas de redirection ouverte) ; `location.state` = booléen (choisit
  entre `navigate(-1)` et `replace`).
- **Stockage local** : trois clés nouvelles (`partie:sets`, `entrainement:joueur`,
  `entrainement:sorties`), dans les catégories que la politique déclare déjà (« les réglages
  de la dernière partie, les derniers joueurs choisis (leurs identifiants internes) »,
  `labels.ts:296`) ; ni texte ni date à changer — **à valider par `sec`**. Aucune donnée de
  partie dans `localStorage`.
- **Service worker et en-têtes** : aucun changement.
- **Résiduels** :
  - R1 — glisser au doigt non testable en jsdom. Mitigation : logique de rang pure et testée,
    clavier partageant `deplacer`. Owner : Test planifie, l'utilisateur valide sur Android.
  - R2 — `<dialog>` et Pointer Events sur iPhone (Safari ≥ 15.4). Owner : l'utilisateur, au
    test iPhone déjà en attente.
  - R3 — retour Android avec la boîte ouverte (CloseWatcher, dépend du navigateur) ; non
    exigé ; au pire retour à l'étape 1, choix conservés. Owner : Test le note.

## Questions ouvertes

Aucune question de conception. Restent des **vérifications** :

| # | Vérification | Pour qui |
|---|---|---|
| 1 | Relecture à l'écran 390 × 844 portrait et 844 × 390 paysage, thèmes sombre et clair : trois étapes de chaque mode, menu, boîte de dialogue clavier ouvert, sélection, étape 3 pendant un glisser ; X01 à 2 et 4 joueurs avec sets 3, DO et DI (bandeau, « MANCHES », « SORTIE », « BUST ») ; résumé X01 ; Statistiques « Finitions » ; Accueil avec partie à sets en cours ; Réglages. Android réel : glisser au doigt, retour à chaque étape. Textes des cartes et absence de mise en avant validés par l'utilisateur | Test (plan) → utilisateur |
| 2 | La politique reste vraie avec les nouvelles clés ; absence d'`innerHTML` ; redirection vers une constante | Sécurité |
| 3 | Appliquer les décisions telles quelles ; un débordement → revenir à l'architecture, pas d'abréviation improvisée | Dev |

**Constats annexes, hors lot et non bloquants** : § Checkouts de `CLAUDE.md` décrit le cas
double out (sans double out, `checkout.ts:84` suggère jusqu'à 180) — futur lot de règles ;
« Manche N » du bandeau numérotée sur la partie, pas dans le set (existant) ; le résumé X01
n'affiche pas les sets ; captures du README et `public/screenshots/partie-x01.png` montrent
« LEG » et l'ancien écran — à refaire à la main (utilisateur), à noter au PLAN § 0 ; des
boutons retour de 44 px subsistent ailleurs (préexistant).

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.

### Annotation de l'Orchestrator (2026-10-11) — pas une révision d'architecture

Pas de boucle 3, 4 ou 7 : une précision, signalée par la Revue (constat n° 5), sur un point déjà
clos au gate Dev (écart n° 1 / D1).

- **§ 1 « Gardes »** : seule l'**étape 3** de l'entraînement redirige vers l'étape 2.
  L'écran **« Sélectionner un joueur existant » reste accessible à l'entraînement**, avec
  `max` = 1. Lire « étape 3 ou sélection pour l'entraînement → étape 2 » l'aurait rendu
  impossible de reprendre un profil existant après un × — contraire à la demande validée (menu
  « + » pour chaque jeu). Le code (`NouvellePartieEcran.tsx:31-44, 78-95`) fait foi.
- **§ 2 `ordre.ts` / § Baseline R1** (Revue, constats n° 1 et n° 2 ; boucle 5, tour Dev) :
  `rangVise` vise la place **la plus proche** (seuil à mi-chemin de deux milieux, strict), pas
  « la dernière dont le milieu est franchi » — sinon la borne du geste, qui arrête le centre pile
  sur le milieu extrême, rendait la première et la dernière place inatteignables. Ajustement
  d'implémentation, le design (logique pure, borne, `decalage`) tient. R1 est désormais mitigé
  par des tests de composant jusqu'au geste (mise en page simulée) ; reste à l'écran : vraie
  mesure, vrais Pointer Events, rendu.
