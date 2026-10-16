# Lot `regles-du-jeu` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu : `archi-authority`
> (opus / max, 2026-10-15). Le rapport source commence par `Architecture result: PASS`.
> Scout et designer sautés : surface gravée annoncée par l'intake. Entrées lues : l'index,
> `request.md`, la planche `regles-rubriques.html` (script `JEUX` compris) et `regles.html`.

## Problème

Ouvrir les règles **par-dessus** l'étape 2 et le match sans changer l'URL, pour que la volée en
cours (un `useState` du hook de mode) survive. On ferme à la croix ou par le retour du téléphone,
via une entrée d'historique gérée par React Router 8.3 (`BrowserRouter` déclaratif), sans
« retour fantôme » après la croix. Le texte dit ce que l'app applique et suit les réglages. Deux
défauts du domaine et de l'écran sont corrigés pour que l'écran et `CLAUDE.md` disent vrai :
`suggestCheckout` rend `null` à 1 en sortie libre (`checkout.ts:83`) ; « Pas de finish » est borné
en dur à 170 (`Tableau.tsx:136`), alors que la borne 180 n'existe qu'en ligne (`checkout.ts:84`).
Ferme les constats #3, #12 et #25 de l'index.

## Options considérées

| Sujet | Option | Pour | Contre |
|---|---|---|---|
| Fermeture par le retour | Route ou `?regles` | Historique natif | Interdit : URL changée, nouvelle route, volée perdue |
| | État local seul | Simple | Sans CloseWatcher (Safari iOS, Firefox…), le retour quitte l'écran et perd la volée |
| | `history.pushState` à la main + `popstate` | Indépendant du routeur | Désynchronise l'index d'historique de React Router (`idx` dans `history.state`) |
| | **Retenue** : état de navigation sur la **même** location (`navigate(location, { state: {...state, regles: true} })`), ouverture **dérivée** de `location.state`, croix = `navigate(-1)` | Natif au routeur, une seule source de vérité, ni effet ni course | Un second chemin de fermeture à couvrir (§ 3) |
| Boîte | `<dialog>` natif + `showModal()` (comme `DialogueNouveauJoueur`) | Couche supérieure, fond inerte, focus | Chrome Android : le retour peut fermer la boîte sans reculer (CloseWatcher) — traité |
| | `div role=dialog` + `inert` à la main | Un seul chemin | Réécrit focus et inertie ; contraire au précédent du projet |
| Bornes et listes | L'UI importe des constantes du domaine | Aucun port | Contredit l'intention du port `GetCheckoutSuggestion` |
| | **Retenue** : port synchrone `GetCheckoutRange` | Toute la connaissance des sorties passe par l'application | Un port, un use case, une ligne de câblage |
| | Listes recalculées à chaque appel | Juste par construction | Coût inutile ; la demande veut des références testées |
| Texte | Chaînes HTML de la planche | Copie directe | Exige `dangerouslySetInnerHTML` : refusé |
| | **Retenue** : constructeurs sur primitives dans `labels.ts` + un seul `switch` (`reglesDuJeu.ts`), segments typés | Patron existant (CONVENTIONS § 9, `vueCarte`) | Un type de contenu à écrire |

## Approche retenue

### 1. Domaine — `src/core/domain/services/checkout.ts`

- Garder `MAX_CHECKOUT = 170` ; ajouter `MAX_CHECKOUT_FREE_OUT = 180` et
  `FREE_OUT_NO_FINISH = [179, 178, 176, 175, 173, 172, 169, 166, 163]` — **référence de test**,
  comme `BOGEY_NUMBERS`, jamais consultée par l'algorithme.
- `type CheckoutRange = { readonly max: number; readonly noFinish: readonly number[] }` et
  fonction pure `checkoutRange(config: SortieRules)` : double → `{ 170, BOGEY_NUMBERS }` ; libre
  → `{ 180, FREE_OUT_NO_FINISH }`. JSDoc de `BOGEY_NUMBERS` : désormais affichée, le test garantit
  l'accord avec l'algorithme.
- `suggestCheckout`, seule ligne de règle qui change :
  ```ts
  if (remaining < (config.doubleOut ? 2 : 1)) return null
  if (remaining > checkoutRange(config).max) return null
  ```
  À 1 en sortie libre, `SETUP_DARTS` contient S1 → `[S1]` pour 1 à 3 fléchettes. Double : inchangé.
  La boucle à 3 fléchettes (`reste <= 1 → continue`) reste correcte.
- Entraînement inchangé : `playableTargets` appelle `{ doubleOut: true }`
  (`checkout-practice/config.ts:61-62`), `minTarget ≥ 2` (`:44`) ; `EntrainementEcran.tsx:51-58`
  passe `{ doubleOut: true }`.

### 2. Application

- Port `ports/driving/GetCheckoutRange.ts` : `execute(config: SortieRules): CheckoutRange`,
  synchrone. Premiers consommateurs : `useX01` (borne) et la feuille (« Les sorties »).
- Use case `use-cases/GetCheckoutRangeUseCase.ts` → `checkoutRange`.
- Câblage : `Services.getCheckoutRange` dans `container.ts`.

### 3. UI — livre, feuille, historique

- **`ui/hooks/useFeuilleRegles.ts`** → `{ ouverte, ouvrir, fermer }`.
  - `ouverte = location.state?.regles === true`.
  - `ouvrir()` : `navigate({ pathname, search, hash }, { state: { ...stateObjet, regles: true } })`
    — chemin **absolu** (sous le splat `/nouvelle-partie/*`, un `to` relatif empilerait,
    `chemins.ts:6-10`) ; état existant **conservé** (`parcours`, `ETAT_PARCOURS`, `useRetour`).
  - Push **dans le gestionnaire de clic seulement** : `navigate` pousse sauf `replace`
    (`react-router/.../hooks.js:294`) ; ⚠️ **jamais `<Link>`**, qui remplace sur le même chemin
    (`dom/lib.js:628`) ; un push dans un effet serait doublé par `StrictMode` ; Chrome saute au
    retour les entrées créées sans geste. `ouvrir()` idempotent.
  - `fermer()` = `navigate(-1)` : dépile, pas de fantôme.
- **`composants/commun/LivreRegles.tsx`**, toujours monté : bouton (`BookOpen` `aria-hidden`,
  48 px, « Règles du <jeu> », `aria-haspopup="dialog"`, état actif) ; monte la feuille quand
  ouverte ; rend le focus au livre au passage ouverte → fermée. Prop `hauteur: 'pleine' | 'moitie'`.
- **`composants/commun/FeuilleRegles.tsx`** : `<dialog>` modal, `aria-labelledby`.
  - `showModal()` au montage si pas déjà ouverte, focus sur « Fermer ».
  - **Aucun `dialog.close()` en nettoyage d'effet** (faux de `tests/setup.ts:27-33`, `StrictMode`).
  - Deux chemins de fermeture : (1) retour sans CloseWatcher → POP → démontage ; (2) fermeture
    native (Échap, retour Android par CloseWatcher) → `close` déclenche `navigate(-1)` **seulement
    si** la dernière location porte le drapeau (référence dans `LivreRegles`) ; une référence « en
    fermeture » posée par `fermer()` évite un double recul.
  - Montée seulement ouverte → rubriques repliées à chaque ouverture, plusieurs ouvertes à la fois.
  - Accessibilité : bouton `aria-expanded`/`aria-controls` sous un `h3`, numéros `aria-hidden`.
  - Disposition : portrait étape 2 pleine ; portrait match décalage de la planche (210/740), voile
    `::backdrop` ; `paysage:` (`index.css:7`) côté droit, `border-l-[3px]`, voile transparent ;
    largeur paysage et haut de feuille selon Q3/Q4 ; zones de sécurité ; `overscroll-contain`.
  - Mouvement : `animate-monter`, chevrons `motion-safe:` 150 ms comme `Depliant`.

### 4. UI — le texte

- **`labels.ts`** : types `ContenuRegles = { titre, ceSoir, enBref: Segment[], rubriques }` ;
  blocs liste, paragraphe, pastilles, exemple, questions, réglages ; chaque ligne peut porter
  `autre` (gris), chaque option `ceSoir` (laiton). Libellés : `TITRE_REGLES: Record<GameModeId,…>`
  (« Règles de l'entraînement »), « Telles que Dartpéro les applique », « Ce soir », « En bref »,
  « Fermer », titres des rubriques. Constructeurs sur primitives : `reglesX01({ score, legs, sets,
  doubleOut, doubleIn, sorties: { surUnDouble, libre } })`, `reglesCricket({ variante, cibles })`,
  `reglesTourDuMonde({ cibles })`, `reglesEntrainement({ sorties, min, max })`. « Pas de finish »
  devient une constante unique (quitte `Tableau.tsx:81`). Retraits : `LIBELLE_REGLES_EN_ENTIER`,
  `PARAGRAPHE_X01`, `paragrapheCricket`, `paragrapheEntrainement`, `PARAGRAPHE_TOUR_DU_MONDE`
  (vérifier par grep `tests/`) ; `LEGENDE_CIBLES_CRICKET`, `LEGENDE_PARCOURS` selon Q9/Q10.
- **`ui/reglesDuJeu.ts`** (nouveau) : union `ReglesDeLaPartie` par mode et
  `contenuRegles(regles, sorties)`, seul `switch` sur l'union pour la feuille.
- X01 et Cricket **mot pour mot** depuis `JEUX` (`regles-rubriques.html:186-255`), apostrophes ’
  comprises ; `<b>` → `{ fort }`, `class="autre"` → `autre`. « Ce soir » X01 = récapitulatif de
  la fiche ; « Ce soir » Cricket = celui de la planche (« Standard · 7 cibles · 20 à 15 et la
  bulle »), la fiche garde « Cricket standard ».
- Bascule mécanique sans question : même phrase et même ordre, ligne de ce soir pleine, l'autre en
  gris ; nombres substitués (départ, N manches, 180 / 170) ; liste de ce soir rouge, l'autre grise
  (via le port) ; valeurs de ce soir en laiton dans « Les réglages possibles ». Le non dessiné :
  Q2.

### 5. UI — écrans

- `EtapeJoueurs.tsx` : `action={<LivreRegles hauteur="pleine" …/>}` dans `EnTeteEtape`, depuis
  `partie.reglages` ; entraînement : bornes depuis `DEFAUT`.
- `ReglagesJeu.tsx` : retirer le dépliant (`:350-358`) et les paragraphes ; la ligne de règles
  reste ; `CasesCibles` selon Q9/Q10.
- `BandeauMatch.tsx` : prop **obligatoire** `regles` ; `LivreRegles hauteur="moitie"` à
  l'extrême droite, hors des conteneurs `.grave` et en capitales (`:67-71`).
- Les quatre écrans de match construisent `regles` depuis `state.config`.
- `useX01` : borne par `services.getCheckoutRange.execute(state.config)` (mémorisée sur
  `doubleOut`) ; `Tableau.tsx:136` reçoit `sortieMax`.

### 6. Plan du texte Tour du monde et entraînement

Aucune règle hors des sources ; écrit pendant le lot, relu par l'utilisateur.

| Rubrique | Tour du monde (CLAUDE.md, `tour-du-monde/rules.ts`) | Entraînement (`checkout-practice/config.ts`, `rules.ts`, `PlayCheckoutPracticeUseCase.ts`) |
|---|---|---|
| Ce soir | « 20 → 1, puis la bulle · 21 cibles · rien à régler » | « N sorties · restes tirés entre 41 et 170 » |
| 1 En bref | 20 → 1 puis la bulle ; bouclé avec le moins de fléchettes | Reste tiré, trois fléchettes pour le sortir sur un double |
| Marquer | Toucher le secteur suffit (`:62`) ; bulle 25 ou 50 ; hors cible jamais ; jusqu'à 3 cibles par volée (`:126-138`) | Mêmes fléchettes qu'au X01 ; une volée par reste (`rules.ts:114-124`) |
| Gagner | On finit le tour de table (`:163-165`) ; moins de fléchettes ; égalité parfaite = nul (`:103-110`) | Manche réussie = sortie ; taux = réussies ÷ jouées (`rules.ts:69,80`) |
| Cas particuliers | Volée arrêtée sur la fléchette qui boucle ; ni bust, ni manche, ni set ; « Dernier tour » | Toujours sur un double (`rules.ts:10`) ; bust < 0, = 1, = 0 sans double ; bogey jamais tirés ; annuler redonne le même reste |
| Un exemple | Volée chiffrée, rejouée par les vraies règles en test | Idem (ex. 81 : T19, D12) |
| Questions fréquentes | Le double avance-t-il de 2 ? Égalité ? Quand la partie s'arrête-t-elle ? | Reste impossible ? Seconde chance ? Annuler ? |
| Ce que l'app compte | Cibles validées, fléchettes ; hors statistiques ; classement au résumé | Taux de réussite, sorties et fléchettes ; route conseillée ; hors statistiques |
| Les réglages possibles | Parcours fixe, rien à régler | 5 · 10 · 20 sorties ; plage 41 à 170 non réglable |

### 7. Points de la planche vérifiés dans le code

- Cricket dans n'importe quel ordre : **exact** (`cricket/rules.ts:155`, `config.ts:10-12`).
- Cricket hors des statistiques : **exact** (`GetPlayerStatsUseCase.ts:62`) ; classement au
  résumé (`ResumeCricketEcran.tsx:58-61`).
- Autres phrases vérifiées vraies : bust « au suivant » (`x01/rules.ts:111`), départ qui tourne
  (`:171`), grosses volées (`stats.ts:128-131`), % doubles seulement sur un double (`:145`),
  marques de la bulle (`cricket/rules.ts:57-58`), surplus et cut-throat (`:174-185`), égalité qui
  suffit (`:70-82`). Écarts : Q1.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | `services/checkout.ts` | Constantes, `CheckoutRange`, `checkoutRange`, correctif S1 |
| `core/application/` | `ports/driving/GetCheckoutRange.ts`, `use-cases/GetCheckoutRangeUseCase.ts` (nouveaux) | Port synchrone et use case |
| `infrastructure/` | — | Rien |
| `ui/` | Nouveaux : `hooks/useFeuilleRegles.ts`, `composants/commun/LivreRegles.tsx`, `FeuilleRegles.tsx`, `reglesDuJeu.ts`. Modifiés : `labels.ts`, `BandeauMatch.tsx`, `EtapeJoueurs.tsx`, `ReglagesJeu.tsx`, `X01Ecran.tsx`, `CricketEcran.tsx`, `TourDuMondeEcran.tsx`, `EntrainementEcran.tsx`, `useX01.ts`, `x01/Tableau.tsx` ; `index.css` selon Q5/Q6 | Livre, feuille, texte, borne |
| `composition/` | `container.ts` | `getCheckoutRange` |
| `tests/` | `domain/checkout.test.ts`, test du use case, `nouvellePartie.test.tsx`, `manches.test.tsx`, `x01.test.tsx`, nouveau `ui/reglesDuJeu.test.tsx` ; peut-être `renderWithServices.tsx`, `gestes.ts` | Critères 1 à 10 |

Docs : `CLAUDE.md` ; charte § Parcours (`:338`), § Écran de match (`:401-419`, `:457-466`),
§ Composants, § Mouvement, palette si Q5/Q6 ; `PROJECT_PLAN.md` § 0, 4, 6 ; CONVENTIONS § 4, 9,
11, 13 (un mode doit sa branche de `contenuRegles`), 14 ; `rules/glossary.md` (« sortie ≤ 170 »
faux en sortie libre ; bogey) ; `rules/frontend-react.md` (le hook) ; index régénéré.

**Sens des dépendances vérifié :** UI → `useServices().getCheckoutRange` → fonction pure du
domaine ; `core/domain` sans import externe ; `checkout.ts` transverse ; câblage dans
`container.ts` seul ; feuille ni route ni `lazy()`, importée par des chunks déjà différés.
**Nouveau port ?** `GetCheckoutRange` — premiers consommateurs `useX01` et la feuille.

## Décisions de `CLAUDE.md` concernées

**Concernées :** hexagonal et UI → use cases ; journal (rien de persisté ne bouge) ; « manche »,
« premier à N » ; double out décoché à l'écran / vrai dans le domaine (la feuille lit la config,
ne pas aligner) ; chaque étape est une route — la feuille n'en est pas une, le premier retour la
ferme, le second revient à l'étape précédente ; thème par jetons, angle vif, zones lecture /
saisie ; § Règles du jeu.

**À graver dans ce lot :**
1. § Checkouts (`CLAUDE.md:260-265`) : double — 170, bogey numbers, suggestion dès 2 ; libre —
   180, liste des restes sans finish, suggestion dès 1 (S1) ; « Pas de finish » suit la sortie ;
   les deux listes sont des références vérifiées par test.
2. Nouveau § **Règles de l'entraînement** : N manches (5, 10, 20) ; reste tiré parmi les restes
   jouables de 41 à 170 (non réglable ; bogey exclus, calculés) ; **reste écrit dans le journal** ;
   une volée par manche ; toujours sur un double (`resolveVisit` partagé) ; taux de réussite ;
   hors statistiques ; « On remet ça » tire une nouvelle série.
3. Décision structurante **« Règles au livre ouvert »** : livre à l'étape 2 et au bandeau ;
   feuille par-dessus, jamais une route ; entrée d'historique sur la même URL, poussée par
   `navigate` (jamais `<Link>`), dépilée à la croix ; texte = règles appliquées, dans `labels.ts`,
   qui suit les réglages ; un lot qui change une règle met à jour sa rubrique.

## Baseline sécurité

- Import JSON, Dexie, `backupSchema` intacts : `persistence.md` sans objet.
- `history.state` ne porte qu'un booléen, état de session du navigateur, aucune donnée de joueur.
- Zéro réseau ; aucune dépendance nouvelle (`BookOpen` présent dans `lucide-react` 0.511).
- Service worker et en-têtes inchangés.
- Texte en segments typés, **jamais de `dangerouslySetInnerHTML`** ; aucun pseudo dans la feuille.
- `/confidentialite` inchangée (à confirmer par `sec`).

Résiduels :
- **R1** — retour Android par CloseWatcher : boîte fermée sans recul → fantôme possible.
  Atténuation : chemin de fermeture native (§ 3). Test : `dialog.close()` simulé. Owner :
  utilisateur, sur l'appareil Android.
- **R2** — entrée sautée par Chrome si poussée sans geste. Atténuation : push au clic seulement.
  Owner : `sec` et appareil.

## Conformité à la planche

| Élément | Où |
|---|---|
| Livre 48 px (bordure `laiton-sombre`, icône `laiton-clair` ; actif fond `laiton`, icône `sur-laiton`) | `LivreRegles` |
| Livre à droite du titre de l'étape 2 | `EnTeteEtape` `action` |
| Livre à droite du bandeau (Q4) | `BandeauMatch`, après `droite` ; le bandeau simplifié de la planche n'est pas repris, seul le livre s'ajoute |
| Feuille pleine (étape 2), mi-hauteur (match, 210/740), côté droit en paysage (Q3, Q4) | `FeuilleRegles` |
| Voile en portrait, aucun voile sur la lecture en paysage | `::backdrop` |
| En-tête : pictogramme (Q7), titre, « Telles que Dartpéro les applique », croix | `FeuilleRegles` |
| Corps qui défile, sans bande « Défiler pour la suite » | `FeuilleRegles` |
| « Ce soir » cadre `laiton-sombre`, texte `laiton-clair` ; « 1 En bref » ouvert | `FeuilleRegles` |
| Rubriques 48 px numérotées dès 2, chevron, `aria-expanded`, repliées, plusieurs ouvertes | `FeuilleRegles` |
| Listes, lignes grises, pastilles rouges / grises, tableau d'exemple, questions, `dl` des réglages | Blocs de `ContenuRegles` |
| Texte X01 et Cricket complet | `labels.ts`, mot pour mot |
| Chevron qui tourne, coupé sous `prefers-reduced-motion` | `motion-safe:` |

Les cas 2 à 4 de la planche montrent une rubrique dépliée pour l'illustration ; à l'ouverture,
tout est replié (demande). Écarts posés en questions : Q3 à Q8 ; Q9 et Q10 précisent la demande.

## Questions ouvertes

### Pour l'utilisateur (à poser à l'arrêt Archi → Dev)

| # | Question |
|---|---|
| Q1 | Trois phrases X01 de la planche ne collent pas exactement au code : (a) « Pour la moyenne, oui : **trois** fléchettes, 0 point » — le code compte les fléchettes lancées jusqu'au bust, 1 à 3 (`x01/rules.ts:89`, `PreviewVisitUseCase.ts:13`, `stats.ts:121`) ; (b) « First 9 : 9 premières fléchettes » — conforme à `CLAUDE.md:279`, le code prend les 3 premières volées (`stats.ts:133-139`, #5) ; (c) « Une volée, c'est 3 fléchettes » — `CLAUDE.md` dit « 3 au plus ». Garder ou corriger ? |
| Q2 | Textes de réglages non dessinés : X01 sur un double (ligne grise « sortie libre » de « Les sorties » ; fin de l'exemple fausse sur un double) ; entrée sur un double (ligne grise « entrée libre » ?) ; sets (« premier à 2 manches gagne la partie » devient faux) ; premier à 1 manche (« plus de 1 » ; 2N − 1 ?) ; Cricket cut-throat (« En bref », exemple « +60 pour Kevin », questions 1 à 3). (A) le Dev écrit d'après `CLAUDE.md` et le code, relu à l'écran ; (B) l'utilisateur valide le texte avant le Dev. |
| Q3 | Largeur en paysage sur le match : (a) 52 % de la planche (recouvre ~80 des 108 px de la colonne RESTE / PTS sur 844 × 390) ; (b) largeur de la colonne du pavé (46 %, ≤ 21 rem, ~336 px), toute la lecture visible. |
| Q4 | Le livre dans le vrai bandeau : (a) paysage, feuille pleine hauteur qui cache le livre actif et « Manche N », ou feuille sous le bandeau ; (b) portrait, ~60 px pris, sous-titres tronqués sur 360-390 px ; (c) rangée +8 px, risque de défilement en paysage à 4 joueurs. Proposé : non bloquant, tranché à la relecture après mesure. |
| Q5 | Rouge et vert en texte (pastilles de ce soir, « bust », « +60 ») : `rouge-cible` / `vert-cible` en texte sur ardoise sombre = 2,8:1 et 3,2:1. (a) deux jetons de texte (sombre : valeurs de la planche, 7,1 et 6,2:1 ; clair : valeurs claires de `rouge-cible` / `vert-cible`, 6,5 et 5,8:1) ; (b) jetons existants, sous le plancher. |
| Q6 | Petits libellés en laiton (« CE SOIR », « EN BREF », numéros) : `laiton` = 4,4:1 sur ardoise en clair (#21). (a) garder `laiton` ; (b) `laiton-clair` ; (c) un jeton de texte (sombre #c9a227, clair #614a08). |
| Q7 | Pictogramme de l'en-tête : 28 px sur la planche ; tailles permises 20, 24, 32, 40, 64. 24 ou 32 ? |
| Q8 | Traduction par l'échelle et les jetons : < 0,75 rem → `text-etiquette` ; 0,82-0,86 → `text-sm` ; 1,15 → `text-lg` ; `filet` → `craie/25`, `filet-doux` → `craie/10`, `chene-doux` → `chene/45` ; voile `feutre-nuit` 62 % ; `craie-2` / `craie-3` du code ; focus de la charte ; `animate-monter`. À confirmer. |
| Q9 | Cricket : sept cibles en texte seul (planche), ou aussi les pastilles (demande § 2) ? |
| Q10 | Tour du monde : la grille « parcours en 21 cases » dans « Marquer », ou texte seul ? |

### Techniques

| # | Question | Pour qui |
|---|---|---|
| D1 | Deux chemins de fermeture ; vérifier sur Android | Dev |
| D2 | `<button>` + `navigate`, jamais `<Link>` ; push au clic ; `ouvrir` idempotent | Dev |
| D3 | Cible absolue, état existant conservé | Dev |
| D4 | Pas de `close()` en nettoyage ; `close` ignoré si le drapeau a disparu ; référence « en fermeture » | Dev |
| D5 | Livre hors `.grave` et capitales ; typographie remise à zéro sur la boîte | Dev |
| D6 | Mesurer le bandeau (Q4) ; marges négatives si la rangée grandit, cible 48 px gardée | Dev |
| D7 | Texte dans `labels.ts` → chunk principal : mesurer `dist` avant / après | Dev |
| D8 | `SCORES`, `LEGS`, `SETS`, `SORTIES` dans un module neutre | Dev |
| D9 | Parcours et nombre de cibles lus dans `state.config` | Dev |
| D10 | Vieilles parties hors listes : aucune valeur en laiton, « Ce soir » exact | Dev |
| T1 | `renderWithServices` à plusieurs entrées d'historique + sonde de location (`renderWithServices.tsx:30`) | Test |
| T2 | Fermeture native simulée par `dialog.close()` | Test |
| T3 | Lignes grises vérifiées par classe ; aucun texte audible nouveau sans accord | Test |
| T4 | Textes attendus recopiés de la planche (hors git) | Test |
| T5 | Exemples rejoués par les vraies règles | Test |
| T6 | Angles morts : contraste, défilement, hauteurs paysage, retour Android, iOS | Test |
| S1 | Pas de HTML brut, état d'historique booléen, aucune dépendance, `/confidentialite` inchangée | Sécurité |

### Tests attendus par critère

1. Livre à l'étape 2 et sur les quatre matchs (`it.each(GAME_MODE_IDS)`) ; « Les règles en entier » absent.
2. URL inchangée ; volée X01 de 1 puis 2 fléchettes intacte, après croix et après retour.
3. Plusieurs entrées : retour ferme sans quitter, second retour quitte ; après la croix, un seul
   retour quitte ; fermeture native sans fantôme.
4. Tout replié à chaque ouverture, `aria-expanded` à jour, plusieurs rubriques ouvertes.
5. Chaque réglage, à l'étape 2 (changer, rouvrir) et sur un match : X01 sortie / entrée / sets ;
   Cricket variante ; entraînement 5 / 10 / 20.
6. Texte X01 et Cricket de la planche ; traçabilité dans `03-plan-de-test`.
7. `suggestCheckout(1, 1..3, libre) = [S1]`, `null` sur un double ; > 180 libre → `null` ;
   `playableTargets` inchangé.
8. Liste libre sur 1-180 contre l'algorithme ; « Pas de finish » aux restes sans finish de
   172-179 en libre, route à 174 et 177, rien au-dessus de 170 sur un double.
9. Boîte nommée ; focus sur « Fermer » puis retour au livre.
10. Lint, typecheck, build, gardes verts ; ni « leg » ni « best of » dans les rubriques.

## Réponses de l'utilisateur (arrêt Archi → Dev, 2026-10-15)

Ces réponses closent Q1 à Q10 ; elles s'imposent au Dev au même titre que la planche.

| # | Réponse |
|---|---|
| Q1 | **Corriger d'après le code** : (a) « les fléchettes lancées comptent, avec 0 point » (pas « trois ») ; (b) First 9 = « les 3 premières volées de chaque manche » ; (c) « 3 fléchettes au plus ». Écart volontaire au mot pour mot de la planche, sur ces trois phrases seulement. |
| Q2 | **(A)** Le Dev écrit les textes non dessinés (X01 sur un double, entrée sur un double, sets, premier à 1 manche, Cricket cut-throat) d'après `CLAUDE.md` et le code, sur le modèle de la planche ; relecture par l'utilisateur à l'écran. Aucune règle hors des sources. |
| Q3 | **(b)** En paysage sur le match, la feuille prend la largeur de la colonne du pavé (≈ 46 %, ≤ 21 rem) : toute la lecture reste visible. |
| Q4 | **Tranché à la relecture, après mesure.** Défaut : en paysage, la feuille passe **sous** le bandeau (livre actif et « Manche N » visibles). Le Dev mesure le bandeau portrait (troncature des sous-titres) et paysage (hauteur de rangée) et fournit des captures. |
| Q5 | **(a)** Deux jetons de texte rouge et vert : en sombre, valeurs de la planche (#ff8a8f, #5bb27e) ; en clair, valeurs claires de `rouge-cible` / `vert-cible`. Ajoutés à `index.css` et à la charte. |
| Q6 | **(c)** Un jeton de texte laiton : sombre #c9a227, clair #614a08, pour les petits libellés de la feuille. |
| Q7 | Pictogramme de l'en-tête à **24 px**. |
| Q8 | **Fidélité au pixel, sauf le plancher** : les couleurs exactes de la planche (filets #3a4a3f / #24332a, `chene-doux` #4a3825, `craie-2` #d6ccb9, `craie-3` #aaa292, voile #040805 à 62 %…) deviennent des **jetons** avec leur valeur claire (vérifier le contraste dans les deux thèmes ; réutiliser un jeton existant si sa valeur est identique) ; espacements, bordures, hauteurs, largeurs au pixel. Seules les **tailles de texte** sous 0,75 rem montent à `text-etiquette` ; les autres prennent le palier de l'échelle le plus proche. Aucune taille arbitraire (`typographieBoundary`), aucune couleur en dur (`themeBoundary`). |
| Q9 | Cricket : **texte seul**, comme la planche ; les pastilles quittent la fiche sans revenir dans la feuille. |
| Q10 | Tour du monde : la grille du parcours en 21 cases va dans **« Marquer »**, sous la phrase. |

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.

### Révision 1 — boucle 7, Revue → Archi (2026-10-16)

**Déclencheur** : `05-revue.md`, constat 1 (majeur). `main` (`26a39fb`, lot
`statistiques-podium`) apporte `Modale` + `useModaleAuRetour`, le même patron que
`useFeuilleRegles`. L'utilisateur a choisi de **converger** sur `useModaleAuRetour` et la
discipline de `Modale`. La branche est rebasée sur `main` (commit temporaire `wip`, `9dff1a4`) ;
typecheck rouge attendu (`LIBELLE_FERMER` deux fois). Les constats mineurs 2-8 de la Revue, dont
C9 (« En bref » du Tour du monde lu dans `cibles`, choix de l'utilisateur), sont traités dans le
même tour. La planche, la demande et les réponses Q1-Q10, DV1-DV4 restent en vigueur.

Le plan révisé (rapport `PASS` de la chaîne relancée) est ajouté ci-dessous par l'Orchestrator.

#### Rapport retenu : `archi-authority` (opus / max) — `Architecture result: PASS`

Sans shell. A lu l'index, `request.md`, `01` à `05`, `00`, la planche en entier, le code de `main`
(`useModaleAuRetour.ts`, `Modale.tsx`, `StatistiquesEcran.tsx:95,473-577`, Révision 1 de
`statistiques-podium`), le code et les tests du lot, CONVENTIONS § 9-14, `frontend-react`,
`theme-colors`, `glossary`, la charte, PROJECT_PLAN, `CLAUDE.md`.

**Options**

| # | Option | Décision |
|---|---|---|
| 1 | La feuille rendue par `Modale` telle quelle | Écartée : habillage de la planche différent, voile qui fermerait d'office (point produit) |
| 2 | `Modale` à options | Écartée : API gonflée, voile devenu réglage produit, risque sur Statistiques |
| 3 | Recopier la discipline de `Modale` dans `FeuilleRegles` | Écartée : deux copies des pièges, la dérive du constat 1 |
| 4 | **État par `useModaleAuRetour` ; discipline du `<dialog>` sortie de `Modale` dans `useDialogueNatif`, partagé ; deux habillages** | **Retenue** |
| 5 | `useFeuilleRegles` en fin adaptateur | Écartée : fichier supprimé |
| 6 | `<dialog>` monté seulement ouvert (lot) | Écartée : au POP, retiré du DOM ouvert sans `close()` ; contraire à `main` |
| 6' | **`<dialog>` monté en permanence, contenu rendu seulement ouvert** (`main`) | **Retenue** : le démontage du contenu replie les rubriques à chaque ouverture |
| 7 | Mesure paysage par `closest('header')` | Remplacée par `closest('.bandeau-match')` (+ commentaire miroir dans `DispositionPartie`) |

**Approche**

1. **`useDialogueNatif(ouvert, onFermer, retour?)`** (nouveau, `src/ui/hooks/useDialogueNatif.ts`,
   extrait à l'identique de `Modale.tsx:62-91`) → `{ boite, croix, surAnnulation, surFermeture }`.
   Un seul effet sur `ouvert`, sans nettoyage qui ferme : ouverture → mémoriser le focus (sauf
   `body`), `showModal()`, focus sur ✕ ; fermeture → `close()` si encore ouverte, focus à
   `retour` (s'il est donné et connecté) sinon à l'élément mémorisé, **seulement après une
   ouverture faite par le hook** (drapeau `useRef` ; sinon le livre prendrait le focus à chaque
   montage). `surAnnulation` : `preventDefault()` puis `onFermer()` ; `surFermeture` :
   `onFermer()` seulement si `ouvert`. `retour` existe pour Safari, qui ne donne pas le focus à
   un bouton touché.
2. **`Modale.tsx`** passe par le hook, sans `retour`, comportement inchangé ; critère :
   `modale.test.tsx`, `modaleAuRetour.test.tsx`, `statistiquesPodium.test.tsx` verts **sans
   modification**.
3. **`FeuilleRegles.tsx`** : `<dialog>` toujours rendu (par `LivreRegles`), contenu et
   `contenuRegles` seulement ouverts ; `useDialogueNatif(ouverte, onFermer, retour)` remplace
   l'effet `[]` et `onClose` sans condition ; disposition, voile, typographie, zones de sécurité
   et `animate-monter` restent sur le `<dialog>` (l'animation rejoue à chaque ouverture) ;
   `open:flex` / `flex-col` passent sur un conteneur intérieur (aucune classe de `display` sur le
   `<dialog>`) ; tête `<header>` → `<div>` (constat 3) ; `LIBELLE_FERMER` de `main`.
4. **`LivreRegles.tsx`** : `useModaleAuRetour(CLE_REGLES, FEUILLE_REGLES)` (`'regles'`,
   `['ouverte'] as const`) ; `ouverte = feuille.ouverte !== null` ; ouverture par
   `feuille.ouvrir('ouverte')` (gagne la garde « en vol ») ; effet de focus retiré, `retour={bouton}` ;
   mesure par `closest('.bandeau-match')`.
5. **Retraits** : `useFeuilleRegles.ts` (zéro occurrence, docs comprises) ; `LIBELLE_FERMER` du lot
   (`labels.ts:1165`) ; marques « À FUSIONNER ».
6. Critères tenus : rubriques repliées (contenu démonté), focus au livre (`retour`), pas de
   fantôme (recul systématique, `close` relayé seulement ouvert, garde remise à zéro par entrée —
   C1 tenu par le hook de `main`), volée et URL (même URL, état conservé). Limite partagée avec
   `Modale` (Q3 de `sec`, lot 8) : entrée `regles` sans entrée dessous → croix sans effet.
7. **Constats mineurs** : 2 → `pl-11`, commentaire, charte (bandeau `gap-2` portrait / `gap-3`
   paysage, livre `-my-1 -mr-1 paysage:-mb-0.5`, 73 / 51 px) ; 4 (C9) → « En bref » lu dans
   `cibles` comme `parcoursEnMots`, même phrase pour le parcours du domaine, repli sans verbe de
   direction pour un parcours importé arbitraire (écrit sous Q2-A, à relire), aucune erreur sur
   une cible unique ; 5 → `CLAUDE.md:248` : « N manches (`rounds`) … à l'écran, ce nombre se
   choisit et se résume en **sorties** (étape 2, cartes, « Ce soir », « Sortie 8 » à l'Accueil) ;
   la séance en cours compte en **manches** (« Manche 3/10 », cartouche « Manche ») » ; 6 →
   section « Jetons réservés : la feuille de règles » dans `rules/theme-colors.md` et **garde
   recommandée** dans `themeBoundary.test.ts` (préfixe d'utilitaire + l'un des neuf jetons, borné ;
   fichiers permis `FeuilleRegles.tsx`, `LivreRegles.tsx` ; témoin) ; 7 et 8 → docs et tests
   ci-dessous.
8. **Constat 12** : maintenant — `Phrase` commune (`composants/commun/Phrase.tsx`), CONVENTIONS
   § 14 (« 13 hooks », `usePauseAnnulation`), `it.each(GAME_MODE_IDS)` dans
   `nouvellePartie.test.tsx:1077` ; dette — `labels.ts` au démarrage (+5,2 kB gzip, PROJECT_PLAN
   § 6), entrée sans entrée dessous (partagée avec `Modale`).

**Couches** : domaine, application, infrastructure, composition intouchés. UI nouveaux
`useDialogueNatif.ts`, `Phrase.tsx` ; modifiés `Modale.tsx`, `FeuilleRegles.tsx`,
`LivreRegles.tsx`, `DispositionPartie.tsx`, `ReglagesJeu.tsx`, `labels.ts`,
`useModaleAuRetour.ts` (JSDoc) ; supprimé `useFeuilleRegles.ts`. Tests : nouveau
`dialogueNatif.test.tsx` ; modifiés `reglesDuJeu.test.tsx`, `nouvellePartie.test.tsx`,
`themeBoundary.test.ts`. Dépendances : `useDialogueNatif` n'importe que React ; `lazyRoutes`,
`hexagonalBoundary` inchangés.

**Tests** — à adapter : `reglesDuJeu.test.tsx:599-611` (dialogue permanent : `queryByRole('dialog')`
nul, `dialog[open]` nul, livre `aria-expanded="false"`, titre « rien ne reste ouvert ») ;
`nouvellePartie.test.tsx:1077-1081`. À ajouter : (1) `dialogueNatif.test.tsx` (pas de focus au
montage fermé, focus ✕, focus à `retour` même si `body`, sans `retour` → origine, `cancel`
relayé une fois, `close` relayé seulement ouvert, StrictMode) ; (2) dialogue permanent, aucune
classe de `display` ; (3) Échap ; (4) focus au livre sans focus préalable (Safari) ; (5) pas de
`header` dans la feuille, `--haut-feuille` posé ; (6) constat 8 : match 301 / 3 manches / 2 sets
/ double out → « 301 · premier à 3 manches · sortie sur un double · entrée libre · premier à 2
sets », étape 2 701 / 3 / 2 ; (7) C9 : parcours par défaut mot pour mot, `[5, 4, 'BULL']`,
`[1, 2, 3]`, `['BULL']`, intégration ; (8) garde des jetons ; (9) facultatif : double appui = une
entrée. Contre-épreuves à lancer par l'Orchestrator : `fermer` en `replace`, `ouvrir` en
`replace`, `surAnnulation` sans `preventDefault`, `retour` ignoré, garde « après une ouverture »
retirée, `surFermeture` sans condition, `<header>` remis / `closest` inexistant, sets / départ
→ constantes, « En bref » en dur, `text-rouge-texte` hors feuille, `open:flex` sur le `<dialog>`.

**Docs** : `CLAUDE.md` « Règles au livre ouvert » (mécanique : « même mécanisme que la `Modale`
des Statistiques, et lui seul : `useModaleAuRetour` (clé `regles`) et `useDialogueNatif` ;
pièges : CONVENTIONS § 9 ») et § Entraînement (constat 5) ; CONVENTIONS § 9 (une seule puce,
texte prêt dans le rapport : état dans l'historique, `<dialog>` monté en permanence, contenu
seulement ouvert, jamais `flex` / `grid` sur le `<dialog>`, tête en `<div>`, clés en usage
`parcours`, `liste`, `regles`), § 11 (Échap par `cancel` annulable), § 14 ;
`rules/frontend-react.md` (une ligne) ; `rules/theme-colors.md` ; charte § Composants, § Écran de
match, § Palette ; PROJECT_PLAN § 0, § 4, § 6, note « à valider » close. Orchestrator :
`02-dev-notes.md` (boucle 1, écouteur `resize`), étude, index.

**Baseline sécu** : `history.state` porte `regles: 'ouverte'` (liste fermée validée) au lieu de
`true` ; rendu par segments (`Phrase`) ; réseau, dépendances, SW, Dexie, `backupSchema`
intouchés. Résiduel préexistant : l'import accepte tout parcours non vide, `MISS` compris (owner :
prochain audit, #11). R1, R2, iPhone : relecture (acceptée).

**Conformité à la planche** : aucun écart ; tête en `<div>` comme le `div` de la planche ;
`pl-11` hors planche (correction DV1). Ajout possible hors planche : U1.

**Questions pour l'utilisateur** : **U1** — un appui à côté de la feuille (voile en portrait sur le
match, partie gauche en paysage) la ferme-t-il, comme la `Modale` des Statistiques ? (a) non,
comme la planche ; (b) oui (en paysage, un appui sur les scores fermerait la feuille). **U2** —
après un rechargement feuille ouverte : (a) elle se rouvre, rubriques repliées, le retour la ferme
(comportement actuel et celui des Statistiques) ; (b) la rouvrir fermée (entrée fantôme juste
après le rechargement).

**Questions techniques** : R1-D0 (ordre : `LIBELLE_FERMER`, `useDialogueNatif` + `Modale`,
feuille et livre, constats, docs), R1-D1 à R1-D7 (Dev), R1-T1, R1-T2 (Test), R1-S1, R1-S2
(Sécurité) — détail dans le rapport, repris dans le brief du Dev.

#### Réponses de l'utilisateur (Révision 1, 2026-10-16)

| # | Réponse |
|---|---|
| U1 | **(b) Oui, comme les Statistiques** : un appui à côté ferme la feuille — voile en portrait sur le match, partie gauche en paysage (étape 2 et match). Ajout hors planche, voulu. La logique du voile passe de `Modale` dans `useDialogueNatif`, partagée (R1-D6 : `biome-ignore` justifié comme `Modale.tsx:81`, tests de géométrie comme `modale.test.tsx:80-122`). `CLAUDE.md` : « Fermée par la croix, Échap, le retour ou un appui à côté. » |
| U2 | **(a)** Après un rechargement feuille ouverte, la feuille se rouvre, rubriques repliées, le retour la ferme (comportement actuel, comme les Statistiques). |
| Garde des jetons (constat 6) | Recommandée par l'Archi, retenue par l'Orchestrator (choix technique, sans effet à l'écran). |
