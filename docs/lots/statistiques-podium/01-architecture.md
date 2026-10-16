# Lot `statistiques-podium` — architecture

> Rapport retenu : `archi-authority` (opus / max), 2026-10-15, départ direct (surface gravée
> annoncée par l'intake : la politique publique). Recopié depuis le rapport `PASS`, sans ajout.

Architecture result: PASS

**Lu** : index puis sources pointées (`CLAUDE.md` § Décisions structurantes — politique — et
§ Statistiques X01 ; rules frontend-react, theme-colors, testing, persistence ; CONVENTIONS
§ 8-11, 14 ; charte § Planchers, Identité, Palette, Typographie, Composants, Carte des impacts) ;
`request.md`, `00-orchestration.md` ; **la planche** entière
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\stats\stats.html` (`ecran4` et ses fonctions)
et son rendu `verif-ecran4.png` ; l'étude § Écran Statistiques ; le code et les tests du brief,
plus `GetPlayerStatsUseCase`, `stats.ts`, `Dart.ts`, `Batons.tsx`, `LocalStoragePreferences`,
`container.ts`, les gardes, le précédent du lot 7.
**Non lu** : l'artifact claude.ai de la demande (pas d'outil) — voir U0.

## Problème

L'écran Statistiques empile cinq tableaux identiques puis des petites cibles côte à côte : on y
lit une grille, pas « qui mène et de combien ». Il faut le refaire selon l'écran « Retenue » de
la planche — cible d'un joueur en grand avec ses 4 cases, sélecteur qui ne pilote que la cible,
quatre cartes de podium (barres, bascules, bâtons plafonnés) — sans toucher au cœur. Le joueur
consulté est mémorisé sur l'appareil : nouvelle donnée en localStorage, que la politique publique
doit citer et redater dans le même lot.

## Options considérées (techniques)

| Option | Pour | Contre | Décision |
|---|---|---|---|
| Classement dans `application` (fonction pure, comme `rankPlayers`) | Classement hors UI | Pas une règle de jeu : un tri sur une statistique affichée ; « petit vaut mieux » de la manche déjà dans l'UI (`StatistiquesEcran.tsx:180`) ; la demande dit « UI seulement » | Écartée |
| Fonctions pures dans `src/ui/podium.ts` (précédent `ui/cartesPartie.ts`) | Testable sans React ; cœur intact | Un second consommateur devrait la déplacer | **Retenue** |
| `CarteImpacts` avec prop booléenne `legende` | Diff minimal | Prop drapeau | Écartée |
| Extraire `PlateauImpacts` (SVG seul) de `CarteImpacts.tsx` | Une responsabilité ; résumé de partie inchangé | Un export de plus | **Retenue** |
| Étendre `Batons` (manches gagnées / requises) | Un composant | Autre sens, autre dessin (spans CSS), ni plafond ni couleurs | Écartée |
| Nouveau `CompteBatons` | Géométrie SVG de la planche, plafond, couleur par seuil | Deux composants « bâtons » | **Retenue**, distingués dans la charte |
| Joueur affiché dérivé de la seule préférence | Le plus simple | Un appui sur un joueur sans fléchette ou supprimé retomberait sur le repli : critère 2 cassé | Écartée |
| Préférence + choix de la visite (scopé à la période) | Critères 1 et 2 | Un petit état de plus | **Retenue** |
| États des bascules dans chaque carte | Local | `SpinnerLigne` démonte les cartes à chaque changement de période | Écartée |
| États des bascules dans l'écran | Survivent à la période ; remis au premier choix à chaque ouverture | — | **Retenue** |
| Sélecteur en onglets ARIA (`tablist`) | Vocabulaire « onglets » | Navigation aux flèches obligatoire | Écartée |
| Sélecteur en `<button aria-pressed>` dans un groupe nommé | Modèle de `ChoixSegmente` ; tests par rôle | — | **Retenue** |

## Approche retenue

**Tout dans `src/ui/`, aucun nouveau port.** `GetPlayerStats`, `CareerStats`, domaine,
infrastructure, composition : inchangés.

Questions non bloquantes de la demande (à l'architecte) :

1. **Clé** : `statistiques:joueur` (stockée `dartpero:statistiques:joueur`), même forme que
   `entrainement:joueur` et `partie:joueurs` (`useNouvellePartie.ts:44-47`).
2. **Découpage** : briques réutilisables dans `composants/commun/` (`CartePodium.tsx`,
   `CompteBatons.tsx`, `PlateauImpacts` dans `CarteImpacts.tsx`, une taille d'`Avatar`) ; propre
   à l'écran dans `StatistiquesEcran.tsx` (`OngletsJoueurs`, bloc cible, assemblage des quatre
   cartes) ; logique pure dans `src/ui/podium.ts`.

### Données et calculs dérivés côté UI (`src/ui/podium.ts`, pur, sans React)

```ts
export type MesurePodium = {
  readonly valeur: (j: PlayerCareer) => number | null   // null = sans occasion
  readonly sens: 'decroissant' | 'croissant'
}
export type LignePodium = { joueur: PlayerCareer; valeur: number | null; largeur: number; enTete: boolean }
export const classerPodium = (joueurs: readonly PlayerCareer[], mesure: MesurePodium): readonly LignePodium[]
```

**Classement** : tri stable ; `null` (« — », barre vide) en dernier ; à égalité, l'ordre de
`GetPlayerStats` est conservé (moyenne décroissante, puis parties décroissantes) — règle d'ex
aequo de la demande : le premier de cet ordre prend la grande ligne (`lignes[0]`).

**Ex aequo** : `enTete = valeur !== null && égale à la meilleure` → barre `laiton`, chiffre
`laiton-clair`. Un seul comparateur, dans ce module ; précision selon U5.

**Largeur des barres** (fraction 0-1, `style={{ width }}` comme `MiniTableauPartie.tsx:82`) :
`null` → 0 ; décroissant → `max > 0 ? v / max : 0` ; croissant → `v > 0 ? min / v : 0`. `min` /
`max` sur les valeurs non nulles. Jamais de NaN.

**Mesures**

| Carte | Bascule | `valeur` | Sens | Affichage (`labels.ts`) |
|---|---|---|---|---|
| Moyenne | Moyenne | `average3` | ↓ | `moyenne()` « 64,2 » |
| Moyenne | First 9 | `first9Average` | ↓ | `moyenne()` |
| Moyenne | Meilleure volée | `highestVisit` | ↓ | entier |
| Victoires | — | `matchesWon` | ↓ | entier ; grande ligne « 9 » + « / {parties jouées du premier} » |
| Finitions | % doubles | `doubleAttempts === 0 ? null : checkoutPercent` | ↓ | `pourcent()` |
| Finitions | Plus haut | `highestCheckout === 0 ? null : highestCheckout` | ↓ | entier ou « — » |
| Finitions | Manche | `bestLegDarts` | ↑ | format U6 ; « — » si absente |

- Moyenne, First 9, Meilleure volée à 0 gardent « 0,0 » / « 0 » (pas « sans occasion » dans la
  demande).
- **Ligne de bas de Finitions** : premier de « Plus haut » et premier de « Manche », même
  classement et ex aequo. Personne : U8c.
- **Détail de Victoires** : un segment par joueur, `detailVictoires(nom, gagnées, jouées,
  manchesGagnées, manchesJouées)` → « Kevin : 9 sur 16 parties, 21 manches sur 38 », accordé par
  `pluriel`. Ordre : U9.

**Plafond des bâtons** (`CompteBatons.tsx`, fonction pure exportée) :

```ts
export const PLAFOND_GROUPES_BATONS = 10
export const decompteBatons = (n: number) =>
  ({ groupes: Math.min(Math.floor(n / 5), 10), reste: n > 50 ? 0 : n % 5 })
```

49 → 9 + 4 ; 50 → 10 + 0 ; 51 et 312 → 10 + 0 puis le nombre exact. 0 → « — » en `craie-3`,
sans bâton. Nombre toujours écrit dès 1. Ordre des joueurs : celui de `GetPlayerStats`
(`JOUEURS.map` de la planche). Couleurs : 180 `text-laiton`, 140+ `text-craie`, 100+
`text-craie-2`, par `stroke="currentColor"`. Géométrie de la planche : groupe de k traits =
5k + 4 de large, 16 de haut ; traits à x = 2 + 5i, y 1 → 15, épaisseur 1,8 ; barre (0, 13) →
(5k + 4, 3).

**Repli du joueur mémorisé**

```ts
export type ChoixCible = { readonly periode: StatsPeriod; readonly id: PlayerId }
export const joueurDeLaCible = (joueurs, periode, memorise: unknown, choix: ChoixCible | null): PlayerCareer | undefined
```

1. Joueur touché pendant la visite, sur la même période, présent dans la liste → lui, même sans
   fléchette ou supprimé (critère 2).
2. Sinon le mémorisé, s'il est une chaîne, a un profil (`name !== null`) et au moins une fléchette
   (`dartsThrown > 0` ≡ `hits.total > 0`, vérifié `stats.ts:121-124,193`).
3. Sinon `joueurs[0]` (premier de la moyenne). Liste vide → `undefined` (états vides inchangés).

Préférence écrite **à l'appui sur un onglet seulement** ; règle réévaluée à chaque changement de
période. À confirmer : U7.

**Écran** : `usePreference<PlayerId | null>('statistiques:joueur', null)` appelé **une** fois
(deux appels divergeraient, `useNouvellePartie.ts:79-82`), relu validé par `typeof`
(`useNouvellePartie.ts:90`) ; clé déclarée une fois avec un ⚠️ (citée par la politique, ne se
renomme pas). `periode`, `choix`, `mesureMoyenne`, `mesureFinitions` dans `StatistiquesEcran`,
au-dessus de la branche de chargement.

### Design des composants

**`CartePodium`** (commun) : `<section aria-labelledby>` en `bg-ardoise border-t-3 border-craie
px-3.5 pt-3.5 pb-3`. Tête : `Pictogramme` 20 px (position, couleur : U3), `<h2>` d'étiquette
(`entete-colonne font-bold`, couleur : U4), à droite un `action` (bascules ou mention discrète).
Mise en ligne : U2.

**`BasculesPodium<T>`** (commun) : API de `ChoixSegmente` (`legende` → `aria-label` du groupe) ;
`<button aria-pressed>` en puce, bordure `craie/25` texte `craie-2`, active bordure `laiton` texte
`laiton-clair` ; `text-etiquette`, `tracking-[0.08em]` ; **zone d'appui étendue à 48 px** par
pseudo-élément, visuel de la planche inchangé.

**`ClassementPodium`** (commun), reçoit des lignes prêtes, ne connaît pas `PlayerCareer` :
- grande ligne : avatar 34 px ; nom `text-base font-bold` majuscules `craie-vive` tronqué ; valeur
  `chiffres text-5xl font-bold leading-[0.9] text-laiton-clair`, complément `text-sm text-craie-3` ;
- liste `<ol>` `grid-cols-[24px_54px_1fr_44px] gap-2` : avatar `xs` ; nom `text-etiquette`
  majuscules `text-craie` tronqué ; piste `aria-hidden` `h-2.5 bg-craie/8`, remplie `bg-craie/72`
  (en tête `bg-laiton`) ; valeur `chiffres text-nom-serre font-bold text-right whitespace-nowrap` ;
- pied optionnel `text-etiquette text-craie-3`.

**`CompteBatons`** (commun) : groupes SVG `aria-hidden`, puis le nombre en texte, ou « — ».

**`PlateauImpacts`** : le SVG actuel de `CarteImpacts`, même `role="img"` et `aria-label`.
`CarteImpacts` = `figure(PlateauImpacts + figcaption)`, rendu inchangé.

**`Avatar`** : taille 34 px de plus (`size-8.5 text-etiquette tracking-wide`), nom au choix du Dev.

**Dans l'écran**
- `OngletsJoueurs` : groupe nommé, `<button aria-pressed>` avatar 34 px + nom ; `flex-1 min-w-max`
  (largeurs égales quand ça tient, défilement horizontal du seul ruban au-delà) ; actif souligné
  3 px `laiton`, texte `craie-vive` ; inactifs `craie-3` ; filet bas `craie/25` ; ≥ 48 px.
- Bloc cible : `<figure>` avec `PlateauImpacts` et `<figcaption>` = rangée de 4 cases (`<ul>`
  4 colonnes, filets `craie/20` haut et bas, séparateurs `craie/18` ; chiffre `text-xl`
  `laiton-clair` — hors cible `text-craie` — légende `text-etiquette` `craie-3` ; « Bulle 25 » /
  « Bulle 50 » par `libelleZone`, sinon `Dart.label`) ; `mx-auto w-full max-w-sm`.

### Accessibilité

- Chaque carte = région nommée par son `<h2>` (critère 5) ; la carte Moyenne suit son titre.
- Valeurs en texte ; barres, bâtons, avatars, pictogrammes `aria-hidden` ; « — » en texte
  `craie-3`.
- Grosses volées : nom de chaque joueur en `sr-only` (la planche n'a que l'avatar).
- Ligne de détail : séparateurs « · » `aria-hidden`, même couleur que le texte.
- Cible : `role="img"` existant avec son `aria-label`. Aucune animation nouvelle ; focus global.
- Textes pour lecteurs d'écran à lister dans `02-dev-notes` pour relecture (comme lot 7, R11).

### Politique et date (`src/ui/labels.ts`)

- `:297` → « Les préférences de l’appareil vont dans le stockage local du navigateur
  (localStorage) : le thème, l’annonce vocale, les réglages de la dernière partie, les derniers
  joueurs choisis (leurs identifiants internes), le dernier joueur consulté dans Statistiques (son
  identifiant interne) et le « Plus tard » de l’invitation à installer. Au démarrage, une valeur
  de test y est écrite puis effacée aussitôt. »
- `:274` → `'Mise à jour le 15 octobre 2026'` (à corriger si le lot se clôt un autre jour).
- Aucune autre copie de ce texte (Grep sur le dépôt).

## Couches / chemins concrets

| Couche | Fichiers | Nature |
|---|---|---|
| `core/`, `infrastructure/`, `composition/` | — | Rien |
| `ui/` | `src/ui/podium.ts` (nouveau) ; `composants/commun/CartePodium.tsx`, `CompteBatons.tsx` (nouveaux) ; `CarteImpacts.tsx` (extraction), `PanneauImpacts.tsx` (commentaire), `Avatar.tsx` (+34 px) ; `ecrans/StatistiquesEcran.tsx` (réécrit) ; `labels.ts` | Libellés, politique, date ; retrait de `LIBELLE_MANCHES_GAGNEES` / `LIBELLE_MANCHES_JOUEES` devenus morts |
| `tests/` | Nouveaux : `tests/ui/podium.test.ts`, `tests/ui/compteBatons.test.tsx`, `tests/ui/statistiquesPodium.test.tsx`. Adaptés : `lot4.test.tsx:194-411`, `manches.test.tsx:112-134`, `confidentialite.test.tsx:81-96`, `pictogrammesEmplacements.test.tsx` | — |
| Docs | Charte § Composants (cartes du podium, `CompteBatons` à côté de `Batons`, `PlateauImpacts`), § La carte des impacts, § Identité (quatre pictogrammes) ; CONVENTIONS § 9 (`pourcent`) et § 14 (`podium.ts`) | Fin de lot (Orchestrator) : PROJECT_PLAN, étude, index |

Sens des dépendances : l'UI importe de `application` des types et constantes (`PlayerCareer`,
`StatsPeriod`, `STATS_PERIODS`), du domaine des types et fonctions pures (`DartboardHits.top`,
`Dart.label`, `PlayerId`) ; préférence par `Services.devices.preferences` (`usePreference`).

## Décisions de `CLAUDE.md` concernées

- Politique `/confidentialite` : nouvelle donnée livrée avec texte et date, même lot.
- localStorage : préférence d'appareil (`rules/persistence`), comme `entrainement:joueur`.
- Hexagonal : UI → use cases ; `devices` exception documentée. Query pour les stats ; routes lazy.
- `labels.ts`, « manche » ; charte : angle vif, zéro dégradé, tokens en paires.
- Règles X01 § Statistiques lues, inchangées (100+ / 140+ cumulatifs ; meilleure manche = plus
  petit nombre de fléchettes).
- **Rien à graver dans `CLAUDE.md`.**

## Baseline sécurité

| Point | Constat | Mitigation | Résiduel / owner |
|---|---|---|---|
| Nouvelle clé localStorage | `PlayerId` opaque | Politique et date au même lot ; écrite à l'appui seulement | — |
| Valeur relue | `JSON.parse` sans validation (`LocalStoragePreferences.ts:30`) | `typeof` ; ne sert qu'à une égalité contre la liste ; jamais affichée | — |
| Profil supprimé | Identifiant resté jusqu'à la prochaine sélection, comme `partie:joueurs` | Repli ; « effacez les données de ce site » couvre le cas | `sec` confirme la formulation |
| Autres frontières | Ni réseau, dépendance, SW, format persisté, Dexie, `backupSchema` ; préférences non exportées ; pseudos en texte React | — | — |

## Conformité à la planche (écran « Retenue »)

| Élément de la planche | Implémentation |
|---|---|
| En-tête et sous-titre | `EnTeteEcran` inchangé ; sous-titre groupé fr « 2 846 » comme la planche (l'écran écrit « 2846 ») |
| Période, 4 choix, « Tout » | `ChoixSegmente sm` inchangé, légende « Période » conservée (« Période inchangée ») |
| Onglets joueurs | `OngletsJoueurs` |
| Cible en grand | `PlateauImpacts`, sans titre ni aide (comme `ecran4`) |
| Rangée de 4 cases | Bloc cible ; « Bulle 25 / 50 » |
| Moyenne, Victoires, Grosses volées, Finitions, dans cet ordre | `CartePodium` + `ClassementPodium` / `CompteBatons` ; « 180 · 140+ · 100+ » en `craie-3` à droite de Grosses volées |
| Ligne de détail et ligne de bas | Pied de `ClassementPodium` |

Écarts actés par la demande : 3e bascule et titre qui suit (U1, U2) ; détail des manches pour
chaque joueur ; pictogrammes (U3) ; bâtons en tokens pleins plafonnés ; aucun alpha sur le texte
(charte : 75-85 % → `craie-2`, 55-70 % → `craie-3`).
Retraits imposés par la planche : les cinq tableaux, les % de parties et de manches, l'aide de la
carte des impacts, le titre « Où tapent les fléchettes », les cibles côte à côte.
Autres écarts : aucun, hors U2, U4, U10.

## Questions pour l'utilisateur

- **U0** : artifact `UcmyFeC4…` non ouvert ; confirmer que la référence est `stats.html`, écran
  « Retenue · 13 octobre ».
- **U1** : titres de la carte Moyenne en bascule First 9 et Meilleure volée.
- **U2** : tête de carte à trois bascules : ≈ 438 px pour 330 à 390 px ; Finitions ne tient plus
  sous 375 px ; le titre change de longueur. (a) bascules toujours sur une seconde ligne ;
  (b) retour à la ligne si besoin (hauteur qui change) ; (c) libellés raccourcis.
- **U3** : pictogrammes — position (à gauche du titre ?) et couleur : (a) celle du titre ;
  (b) couleurs d'emploi de la charte (`victoire` `laiton-clair`, `sortie` `vert-cible`, à choisir
  pour `moyenne` et `grosses-volees`).
- **U4** : couleur du titre de carte : (a) `laiton` (planche) : 4,40:1 sur `ardoise` en clair,
  sous le plancher (constat n° 21) ; (b) `laiton-clair` : plancher tenu, or pâle en sombre.
- **U5** : ex aequo sur le chiffre affiché ou la valeur exacte (40,6 % et 41,4 % → « 41 % ») ?
- **U6** : format en bascule Manche : « 15 », « 15 fl. » ou « 15 fléchettes » ?
- **U7** : (a) préférence écrite seulement à l'appui, ou aussi sur le repli affiché ? (b) au
  changement de période, réappliquer le repli au mémorisé ?
- **U8** : cas non dessinés — (a) personne n'a d'occasion : grande ligne au premier avec « — » ;
  (b) tous à égalité (0 victoire) : tout en laiton ? (lot 7 : « aucune teinte si tous égaux ») ;
  (c) ligne de bas de Finitions sans checkout ni manche ; (d) moins de 3 zones touchées / aucune
  fléchette ; (e) aucune manche : « 0 manche sur 0 » ? (f) un seul joueur : sélecteur affiché ?
  (g) repli sur un profil supprimé / sans fléchette : affiché quand même ?
- **U9** : ordre des joueurs dans le détail de Victoires : classement (victoires) ou moyenne ?
- **U10** : paliers et tailles comme au lot 7 — textes 0,6-0,72 rem → 0,75 ; grand chiffre
  2,9 → 3 rem ; valeurs des barres 0,95 → 0,9375 ; « / 16 » 0,9 → 0,875 ; avatars 22 → 24 px,
  34 px par une nouvelle taille ; bascules visuel inchangé, appui 48 px.

## Questions ouvertes techniques

| # | Question | Pour |
|---|---|---|
| T1 | Classes générées : `bg-craie/72`, `bg-craie/8`, `border-t-3`, `size-8.5`, `w-7.5` | Dev |
| T2 | `overflow-x-auto` rogne un `-mb-px` : filet bas sur les onglets, ou `shadow-[inset_0_-1px_0_…]` | Dev |
| T3 | Groupement fr-FR (U+202F) : tests en regex | Dev / Test |
| T4 | Commentaire de `pourcent` (`labels.ts:347-354`) et CONVENTIONS § 9 | Dev |
| T5 | `resume()` dit « 25 » / « BULL », les cases « Bulle 25 / 50 » : ne pas changer `resume()` (résumé de partie, `resumeX01.test.tsx`) | Dev |
| T6 | Dessins `aria-hidden` vérifiés par `querySelectorAll` limité à la carte ; test d'absence qui peut échouer | Test |
| T7 | Migrer `lot4` et `manches` sans perdre : tri par moyenne, dénominateur des manches, « — » / « 0 % » doubles, « Aujourd'hui », deux états vides, aucun « leg » | Test |
| T8 | Identifiant après suppression d'un profil ; phrase de la politique contre le code | Sécurité |
| T9 | `labels.ts` et charte partagés avec `nouvelle-partie-parcours` : au rebase, garder les deux apports et la date la plus récente | Orchestrator |

## Plan de tests

- Pures : `classerPodium` (deux sens, `null` en dernier, largeurs, aucune NaN, ex aequo selon
  U5) ; `decompteBatons` (0, 4, 5, 49, 50, 51, 312) ; `joueurDeLaCible` (mémorisé valide, absent,
  sans fléchette, supprimé, valeur corrompue, choix de la visite même / autre période, liste vide).
- Écran (préférence semée par `dependencies.devices.preferences.write('statistiques:joueur', id)`,
  clé en dur) : ouverture et deux replis ; appui → cible et 4 cases changent, cartes non, préférence
  écrite ; trois bascules de chaque carte, Manche croissante ; « — » et ex aequo ; une région
  nommée et un pictogramme 20 px `aria-hidden` par carte ; politique (clause et date).
- Restent verts : `resumeX01.test.tsx`, gardes `themeBoundary`, `typographieBoundary`,
  `pictogrammesBoundary`, `lazyRoutes`, `horlogeBoundary`, `appuiBoundary`.
- Relecture à l'écran (Dev, port 5201) : portrait / paysage, sombre / clair, 1, 3, 6 joueurs ;
  noms de 20 caractères ; 10 groupes de bâtons et retour à la ligne ; têtes de carte (U2) ;
  contraste du titre en clair (U4) ; `craie-2` sur papier ; aucun défilement horizontal de page.

## Risques

1. Débordements visibles à l'écran seulement : têtes de carte, ruban d'onglets, bâtons.
2. Régression du résumé de partie après l'extraction de `PlateauImpacts` (test + écran).
3. Date de la politique décalée si le lot glisse d'un jour.
4. Conflits au rebase sur les fichiers partagés.

## Échecs des agents précédents

Aucun : scout et designer sautés (surface gravée annoncée par l'intake).

---

## Résolutions (arrêt Archi → Dev, 2026-10-15)

Réponses de l'utilisateur, consignées par l'Orchestrator. Elles priment sur le rapport ci-dessus
là où il ouvrait une question.

| # | Résolution |
|---|---|
| U0 | **Close par l'Orchestrator** : l'artifact `UcmyFeC4SdDRnrFASvuGEP`, lu via l'outil Artifact, a le même contenu que `stats.html` (même `ecran4`, mêmes données). La référence est bien l'écran « Retenue · 13 octobre ». |
| U1 | Titres de la carte Moyenne : « Moyenne 3 fléchettes » / « First 9 » / « Meilleure volée ». |
| U2 | **Libellés de bascule raccourcis**, titre et bascules sur une seule ligne : Moyenne « Moy. · F9 · Volée » ; Finitions « % dbl · Haut · Manche ». Le nom complet reste dans le titre et pour les lecteurs d'écran (nom accessible de chaque bascule). Le Dev vérifie à l'écran à 390 px, avec le titre le plus long (« Meilleure volée ») ; si ça ne tient pas → question à l'utilisateur, pas de choix silencieux. |
| U3 | Pictogrammes **à gauche du titre**, sur sa ligne, **couleur du titre** pour les quatre. |
| U4 | Titre de carte en **`laiton`, comme la planche**. **Risque accepté par l'utilisateur** : en thème clair, 4,40:1 sur `ardoise`, sous le plancher de 4,5:1 (même défaut connu que les titres de `Panneau`, constat n° 21 de l'index). À consigner dans la charte comme écart connu. |
| U5 | Ex aequo comparés sur le **chiffre affiché** (deux « 41 % » sont ex aequo). |
| U6 | Manche : « **15 fl.** » — « fl. » en petit après le grand chiffre, comme « / 16 » de Victoires ; lecture de l'Orchestrator, signalée à l'utilisateur : comme pour Victoires, le complément ne figure que sur la grande ligne, les barres écrivent « 15 ». |
| U7 | Préférence écrite **à l'appui seulement** ; à chaque changement de période, la règle de repli est réévaluée **sans effacer** la préférence (le joueur revient dès qu'une période le contient). Conforme au design. |
| U8 | Tous les défauts proposés : (a) personne n'a d'occasion → grande ligne au premier avec « — », aucune barre en laiton ; (b) **tous à égalité → aucune teinte** (comme au lot 7 ; précise la règle d'ex aequo de la demande, qui s'applique dès qu'au moins un joueur n'est pas à égalité) ; (c) ligne de bas de Finitions : segment sans valeur omis, ligne entière omise si les deux manquent ; (d) moins de 3 zones → moins de cases, « hors cible » toujours là ; (e) aucune manche → « 0 manche sur 0 » ; (f) un seul joueur → **pas de sélecteur** ; (g) repli sur un profil supprimé ou sans fléchette → affiché quand même (« Joueur supprimé », cible vide). |
| U9 | Ligne de détail de Victoires dans l'ordre du **classement de la carte** (victoires). |
| U10 | Ajustements acceptés : textes 0,6-0,72 rem → 0,75 ; grand chiffre 3 rem ; valeurs des barres 0,9375 rem ; « / 16 » 0,875 rem ; petits avatars 24 px ; bascules au visuel de la planche avec zone d'appui de 48 px. |

**Questions techniques T1-T9** : transmises aux phases désignées dans la table ci-dessus
(T1-T5 au Dev, à clore dans `02-dev-notes.md` ; T6-T7 au Test ; T8 à la Sécurité ; T9 à
l'Orchestrator au rebase).

---

## Révision 1 — « N premiers, puis Tout voir » (2026-10-15)

> Rapport `archi-authority` (opus / max), départ direct (surface gravée déjà établie), lecture
> seule. Déclencheur : Révision 1 de `docs/request/statistiques-podium.md` (ajout de périmètre de
> l'utilisateur, dans ce lot). Recopié depuis le rapport `PASS`, sans ajout.

Architecture result: PASS

**Lu** : index ; demande § Révision 1 ; `00` à `06` du lot ; planche entière ; code
(`podium.ts`, `CartePodium.tsx`, `CompteBatons.tsx`, `StatistiquesEcran.tsx`, `labels.ts`,
`DialogueNouveauJoueur.tsx`, `ChoixJoueursExistants.tsx`, `EtapeJoueurs.tsx`, `EnTeteEtape.tsx`,
`chemins.ts`, `NouvellePartieEcran.tsx`, `App.tsx`, `main.tsx` — `BrowserRouter` sous
`StrictMode` —, `LayoutPrincipal.tsx`, `NavigationBasse.tsx`, `Button.tsx`, `package.json` :
react-router 8.3, jsdom 29) ; tests (`podium`, `classementPodium`, `statistiquesPodium`, `lot4`,
`manches`, `nouvellePartie`, `accueilPartiesRecentes`, `stockagePersistant`,
`renderWithServices.tsx`, `gestes.ts` — `SondeHistorique`, `retourTelephone` —, `tests/setup.ts`
— polyfill `<dialog>` —, gardes `appui`, `pictogrammes`, `typographie`) ; charte § Composants,
Mouvement, Focus ; CONVENTIONS § 8-9, 14 ; PLAN § 6 ; `orchestrate` § Boucles, § Planche validée.
**Non vérifiable** : sources de React Router 8.3 (T10) ; bouton retour réel sur Chrome Android et
iPhone (T19).

### Problème

Cinq changements : N premiers par carte (5 / 5 / 3 / 5) ; « Tout voir » au-delà de N + 1, liste
complète dans un modal refermé par le retour du téléphone sans quitter Statistiques ; Grosses
volées classée par bascule 180 · 140+ · 100+ ; Victoires en « v / j » par ligne sans détail ;
Finitions sans ligne de bas. Cœur inchangé, aucune donnée stockée. Difficulté réelle : le retour
du téléphone (pas forcément par l'historique sur Android ; doubles reculs).

### Ce qui change, ce qui devient obsolète

| Élément | Après R1 |
|---|---|
| Ordre de Grosses volées = `GetPlayerStats` (`StatistiquesEcran.tsx:203-234`) | **Remplacé** : classées sur le seuil de la bascule |
| Mention `aria-hidden` « 180 · 140+ · 100+ » (`:326-329`) | **Remplacée** par `BasculesPodium` |
| Détail de Victoires (`detailVictoires`, `labels.ts:879-888` ; `Segments`, `StatistiquesEcran.tsx:89-103,305-317`) | **Retiré** ; sans objet : U9, U8e, N1, TM-c, CE-6 |
| Pied de Finitions (`piedFinitions` `:256-277,351` ; `segmentPlusHautFinish`, `segmentMancheLaPlusCourte` `labels.ts:890-895`) | **Retiré** ; U8c sans objet |
| Prop `pied` de `ClassementPodium` (`CartePodium.tsx:114-115,178`) | **Retirée** |
| Complément sur la grande ligne seule (U6) | Victoires : **aussi sur chaque ligne** ; Manche (« fl. ») inchangé |
| T-M3 (`statistiquesPodium.test.tsx:389-417`) | Classement sur les victoires et « / 2 » restent ; ordre du détail sans objet |
| TM-a | **Remplacé** par un test de bascule qui discrimine |
| Commentaire de `pourcent` (`labels.ts:347-356`), CONVENTIONS § 9 (`:165-169`), charte (« pied `craie-3` »), textes lecteurs d'écran des notes Dev | À mettre à jour |
| U1-U7, U8a/b/d/f/g, U10, gate Dev 1-3, Q1-Q3, T1-T9, clé, politique, cible, sélecteur | **Inchangés** |

### Options considérées

| Option | Pour | Contre | Décision |
|---|---|---|---|
| Entrée d'historique (`location.state`, même URL) + `<dialog>` natif | Retour du téléphone partout ; testable (`retourTelephone()`) ; précédent `ETAT_PARCOURS` ; écran jamais remonté ; pas de lien profond | Gardes à tenir ; rouvert après rechargement | **Retenue** |
| `<dialog>` seul (CloseWatcher) | Pas d'historique | Chrome Android seulement (à vérifier) ; ailleurs le retour quitte ; non testable en jsdom | Écartée |
| Paramètre `?liste=` | Visible | Lien profond / rechargement sans entrée dessous : `navigate(-1)` quitterait l'app | Écartée |
| Route `/statistiques/liste/:carte` | « Une étape = une route » | La demande dit modal ; état de l'écran à faire passer ; lien profond | Écartée |
| `useBlocker` | — | Routeurs de données en v7 (v8 non vérifié) ; app en `BrowserRouter` ; un POP ne se bloque pas | Écartée |
| `pushState` / `popstate` à la main | — | Désynchronise l'index de React Router dans `history.state` | Écartée |
| Attribut `popover` | Léger | Pas modal | Écartée |
| Extraire une brique de `DialogueNouveauJoueur` | Une seule modale | Fichiers de `nouvelle-partie-parcours`, conflit au rebase | Écartée ; convergence ultérieure |
| Déplier sur place | Le plus simple | Contraire à la demande | Rappel |
| Couper dans `classerPodium` | Un appel | Mélange classement et présentation | Écartée |
| `apercuPodium` pur, après `classerPodium` | Testable ; même clé d'égalité (U5) ; teinte et largeurs identiques carte / modal | — | **Retenue** |
| Grosses volées par `classerPodium`, une mesure par seuil | Un comparateur, une règle d'ex aequo | `largeur`, `enTete` inutilisés | **Retenue** |
| Colonne de valeur `auto` par ligne de Victoires | Simple | Pistes de largeurs différentes | Écartée |

### Approche retenue

**1. Coupure** (`src/ui/podium.ts`, pur)

```ts
export const CARTES_PODIUM = ['MOYENNE', 'VICTOIRES', 'GROSSES_VOLEES', 'FINITIONS'] as const
export type CartePodiumId = (typeof CARTES_PODIUM)[number]
export const APERCU_PODIUM: Record<CartePodiumId, number> =
  { MOYENNE: 5, VICTOIRES: 5, GROSSES_VOLEES: 3, FINITIONS: 5 }
export const apercuPodium = <L>(lignes: readonly L[], n: number, cle: (l: L) => number | null)
  : { readonly visibles: readonly L[]; readonly toutVoir: boolean }
```

1. ≤ N + 1 lignes : tout, sans bouton.
2. Sinon, `v` = clé de la N-ième ; si la N + 1-ième n'a pas `v` : N lignes.
3. Sinon, groupe entier de clé `v` (contigu, liste triée) : exactement 2 → N + 1 ; plus de 2 →
   coupe net à N (lecture littérale, R1-Q1).
4. Bouton dans les cas 2 et 3 ; au plus N + 1 lignes visibles.

Clé d'égalité = `LignePodium.valeur` (chiffre affiché, U5) ; deux « — » égaux (défaut R1-Q2).
Classer sur la liste complète, couper ensuite : `enTete` et `largeur` identiques carte / modal ;
premier toujours visible (Q2 intact) ; Q1 et gate Dev intacts (sept joueurs à égalité non nulle :
tous dorés, carte coupée à 5).

**2. Grosses volées classées** : `MESURE_GROSSES_VOLEES: Record<Seuil, MesurePodium>`
(`count180`, `count140plus`, `count100plus`, décroissant ; 0 est une valeur). `classerPodium` →
`apercuPodium(…, 3, l => l.valeur)` → `GrossesVolees` avec les visibles. Ex aequo : ordre de la
moyenne (tri stable). État `mesureGrossesVolees` (`'180'` par défaut) dans l'écran au-dessus du
chargement, survit à la période, non mémorisé. `BasculesPodium` remplace la mention. Aucune
teinte nouvelle par défaut (R1-Q6).

**3. Victoires « v / j »** : `LigneClassement.complement?: string` ; `enLigne` y met
`complementVictoires(matchesPlayed)` pour Victoires seulement ; rendu après la valeur en
`text-etiquette` `text-craie-3`, jamais si valeur absente. Invariant : pistes de même largeur
dans une carte (sous-grille `minmax(44px, max-content)` ou largeur fixe, T12). Autres cartes :
44 px.

**4. Finitions** : pied, deux segments et `Segments` retirés.

**5. `ClassementPodium`** découpé en `GrandeLignePodium` et `BarresPodium` (exportés) ; reçoit
`lignes` (grande ligne = `lignes[0]`) et `visibles` ; bouton « Tout voir » sous la liste
(R1-Q3), `aria-haspopup="dialog"`, nom `nomToutVoir(titre)`, `min-h-12`.

**6. `src/ui/composants/commun/Modale.tsx`** (nouveau) : `<dialog aria-labelledby>` natif
**monté en permanence**, contenu rendu seulement ouvert (pas de doublons ;
`pictogrammesEmplacements` juste). Un seul effet : ouvert et pas encore → `showModal()` puis
`focus()` explicite sur ✕ (polyfill jsdom) ; fermé et encore ouvert → `close()`. À chaque passage
ouvert → fermé, focus rendu à l'élément mémorisé (`isConnected`, `preventScroll`). **Aucun
nettoyage d'effet qui ferme.** `onCancel={(e) => { e.preventDefault(); onFermer() }}`,
`onClose={() => { if (ouvert) onFermer() }}`. Tête (pictogramme, `<h2>`, ✕ 48 px, `X`
`aria-hidden`, nom `LIBELLE_FERMER`) hors défilement ; corps `overflow-y-auto
overscroll-contain` ; hauteur bornée. **Jamais `flex` sur `<dialog>`** (`open:flex` ou conteneur
intérieur, T11). Aspect « Nouveau joueur » (`bg-ardoise`, `border-2 border-craie/35`,
`backdrop:bg-feutre-nuit/80`) sous réserve de R1-Q5 ; aucune animation.

**7. `src/ui/hooks/useModaleAuRetour.ts`** (nouveau, générique)

```ts
useModaleAuRetour<T extends string>(cle: string, valeurs: readonly T[])
  : { ouverte: T | null; ouvrir: (v: T) => void; fermer: () => void }
```

`ouverte` = `location.state[cle]` validé contre la liste fermée. `ouvrir(v)` **seulement dans un
gestionnaire de clic** : si rien d'ouvert ni « en vol », `navigate({ pathname, search, hash },
{ state: { [cle]: v } })` (PUSH, même URL). `fermer()` : si ouvert et rien en vol,
`navigate(-1)`. « En vol » = `useRef`, remis à `false` par un effet sur `location.key`. Écran :
`useModaleAuRetour('liste', CARTES_PODIUM)` au-dessus du chargement ; `<Modale>` en fin de
`<main>`, **hors** des branches chargement et vide ; contenu selon la carte ouverte, les bascules
courantes et les joueurs, `SpinnerLigne` tant que les données manquent.

**8. Geste par geste**

| Geste | Chemin | Historique |
|---|---|---|
| « Tout voir » | clic → `ouvrir` → PUSH → `showModal` | +1 ; écran monté (période, bascules, cible intactes) |
| ✕ | `fermer` → `navigate(-1)` → POP → `close()` | Entrée consommée |
| Échap | `cancel` → `preventDefault` → `fermer` | Idem |
| Retour, Chrome Android (CloseWatcher, **à vérifier**) | demande au `<dialog>` → `cancel` → `fermer` ; `close` éventuel absorbé par la garde | Un recul |
| Retour ailleurs | POP direct → plus de marque → `close()` ; le `close` suivant ne fait rien | Idem |
| Rechargement / mise à jour | `history.state` survit : rouvert ; `navigate(-1)` reste sûr | R1-Q9 |

**Pièges** : (1) double recul → garde `useRef` (pas `location`, différable par transition) ;
(2) entrée orpheline → fermer **toujours** par `navigate(-1)` ; (3) empiler depuis un effet
(doublé sous StrictMode, sauté par Chrome sans geste) → clic seulement ; (4) `<Link>` / `NavLink`
vers l'emplacement courant **remplacent** → `navigate` ; (5) jamais `window.history` ;
(6) StrictMode : un nettoyage qui ferme refermerait le modal rouvert après rechargement ;
(7) polyfill `close` synchrone, navigateur différé : rien ne dépend de cet ordre ; (8) modale
démontée pendant le chargement → entrée orpheline ; (9) accessibilité : « Tout voir, <titre> »
(WCAG 2.5.3), focus initial en haut, contenu identique à la carte, 48 px (écart Q3 valable aussi
pour les nouvelles puces).

**9. Libellés** : ajouter `LIBELLE_TOUT_VOIR` « Tout voir », `nomToutVoir(titre)` « Tout voir,
Victoires », `LIBELLE_FERMER` « Fermer », `LEGENDE_BASCULE_GROSSES_VOLEES` « Classer les grosses
volées par », `BASCULE_GROSSES_VOLEES` « 180 », « 140+ », « 100+ » (`nomBascule` rend le court
seul si court = complet) ; réutiliser `complementVictoires`, `TITRE_CARTE_*` ; retirer
`detailVictoires`, `segmentPlusHautFinish`, `segmentMancheLaPlusCourte`.

### Couches et chemins

| Couche | Fichiers |
|---|---|
| core, infrastructure, composition | Rien |
| ui | `podium.ts` ; `hooks/useModaleAuRetour.ts`, `composants/commun/Modale.tsx` (nouveaux) ; `CartePodium.tsx` ; `StatistiquesEcran.tsx` ; `labels.ts` |
| tests | Nouveaux : `modale.test.tsx`, `modaleAuRetour.test.tsx` ; adaptés : `podium`, `classementPodium`, `statistiquesPodium`, `lot4`, `manches` |
| docs | Charte § Composants (`Modale`, podium) ; CONVENTIONS § 9 (`pourcent` ; « une modale se ferme au retour ») et § 14 ; `rules/frontend-react.md` (liste des hooks) |

Dépendances : UI → react-router (déjà), types / constantes d'`application`, fonctions pures du
domaine. Aucun port, `Date`, aléa, ni accès direct à l'historique.

### Décisions de `CLAUDE.md` concernées

Politique inchangée (aucune donnée) ; aucune route nouvelle ; principe « le retour du téléphone
passe par l'historique » appliqué à une modale sans URL. **Rien à graver.** Convention à ajouter
dans CONVENTIONS ; dette : `DialogueNouveauJoueur` ne passe pas par l'historique.

### Baseline sécurité

| Point | Mitigation | Résiduel |
|---|---|---|
| `location.state` relu, survit au rechargement | Validé contre la liste fermée ; choisit une carte, jamais affiché | — |
| Pseudos dans le modal | Texte React | — |
| Politique | Ni localStorage, sessionStorage, IndexedDB nouveaux ; état dans l'historique de session (comme React Router, `ETAT_PARCOURS`) ; texte et date inchangés | `sec` confirme (T17) |
| Réseau, dépendances, SW, format persisté, Dexie, `backupSchema` | Non touchés (`<dialog>` natif ; `X` de `lucide-react`) | — |

### Conformité à la planche

Écarts actés par R1 : N premiers et « Tout voir » ; bascule à la place de la mention ; Grosses
volées classées ; « v / j » par ligne ; détail et pied retirés ; le modal (non dessiné). Reste
inchangé. **Écarts non actés : aucun.**

### Questions pour l'utilisateur (défaut proposé)

- **R1-Q1** ex aequo commencé avant le rang N (rangs 4, 5, 6 égaux, N = 5) : (a) **défaut**,
  lecture littérale, trois à égalité → coupe à 5 ; (b) seuls ceux qui se disputent la dernière
  place → 6.
- **R1-Q2** deux « — » à cheval sur la coupure : (a) **défaut**, égaux → les deux ; (b) jamais
  d'extension pour des « — ».
- **R1-Q3** bouton : **défaut** « Tout voir », sous la liste, pleine largeur, 48 px, discret
  (`craie-3`, majuscules) ; variante « Tout voir (7) ».
- **R1-Q4** contenu du modal : **défaut** tête (pictogramme, titre qui suit la bascule, `laiton`,
  ✕), bascules partagées avec la carte, tous les joueurs au même dessin, sans grande ligne ni
  rang ; (b) sans bascules, mesure en sous-titre ; (c) avec la grande ligne.
- **R1-Q5** forme : **défaut** boîte centrée comme « Nouveau joueur », hauteur bornée, liste qui
  défile, fermée par retour / Échap / ✕, pas par un appui à côté ; alternatives : plein écran ;
  appui à côté qui ferme.
- **R1-Q6** Grosses volées : **défaut** puces « 180 », « 140+ », « 100+ », « 180 » active ; titre
  fixe ; trois rangées par joueur ; aucune teinte nouvelle ; option : nombre du seuil en
  `laiton-clair` pour les premiers, jamais à 0.
- **R1-Q7** (confirmation) Victoires : nombre suivi de « / 32 » en `text-etiquette` `craie-3` ;
  colonne des valeurs plus large dans cette carte seulement.
- **R1-Q8** (confirmation) les manches quittent Statistiques ; la bascule « Manche » de Finitions
  reste ; « N manches » de « Joueurs existants » (autre lot) non touchée.
- **R1-Q9** modal ouvert puis rechargement : **défaut** il se rouvre, bascules au premier choix,
  le retour le ferme.

Textes lecteurs d'écran à relire : « Tout voir, Victoires » ; « Fermer » ; « Classer les grosses
volées par » ; « 180 », « 140+ », « 100+ ».

### Questions ouvertes techniques

| # | Question | Pour |
|---|---|---|
| T10 | React Router 8.3 : `navigate` vers l'emplacement courant avec `state` empile-t-il ? Transitions ? (la garde couvre les deux) | Dev |
| T11 | Ni `flex` ni `grid` sur `<dialog>` ; tête fixe, corps qui défile, hauteur en paysage | Dev |
| T12 | Pistes de même largeur dans Victoires ; relire avec « 100 / 120 » | Dev |
| T13 | Focus à l'ouverture et retour ; effet sur `location.key` avec `biome-ignore` justifié (`ReglagesEcran.tsx:189`) | Dev |
| T14 | Tête de Grosses volées à 390 et 360 px ; titre tronqué → question à l'utilisateur | Dev |
| T15 | Gardes prouvées par un harnais (double appel dans un gestionnaire) ; StrictMode tout en haut (`stockagePersistant.test.tsx:41-62`) | Test |
| T16 | Migrer `lot4`, `manches`, `statistiquesPodium` sans perte ; retraits prouvés par absence avec témoin | Test |
| T17 | Aucun impact sur la politique | Sécurité |
| T18 | Au rebase : `nouvelle-partie-parcours` a-t-il sa propre modale ? Si oui, une seule brique dans `commun/` | Orchestrator |
| T19 | Appareil : Chrome Android (`cancel`), Firefox / Samsung Internet (`popstate`), iPhone en onglet (glisser du bord), PWA iPhone (✕ seul) | Dev, utilisateur |

### Plan de tests et contre-épreuves

- `podium.test.ts` : N + 1 lignes → tout (6 pour N = 5, 4 pour N = 3) ; N + 2 sans égalité → N +
  bouton ; deux égaux aux rangs N, N + 1 → N + 1 ; trois à partir du rang N → N ; groupe commencé
  avant N → selon R1-Q1 ; égalité qui s'arrête au rang N → N ; 41,4 % vs 40,6 % ex aequo ; « — »
  à cheval → R1-Q2 ; objets de `classerPodium` intacts ; classement par seuil, 0 valeur.
  Contre-épreuves : `=== 2` → `>= 2` ; `<= n + 1` → `<= n`.
- `classementPodium.test.tsx` : complément par ligne en `craie-3`, absent sans valeur.
- `modale.test.tsx` : fermée sans `dialog` ni contenu (témoin ouvert) ; nommée ; focus sur ✕ ; ✕
  → un `onFermer` ; `cancel` → `defaultPrevented` + un `onFermer` ; `close` navigateur ouvert →
  `onFermer`, fermé → rien ; focus rendu.
- `modaleAuRetour.test.tsx` (`MemoryRouter` `/avant` puis `/ici`, `SondeHistorique`) : ouvrir +
  `retourTelephone()` → fermé, `/ici`, état intact ; ouvrir, fermer, retour → `/avant`
  (contre-épreuve : fermer en `replace`) ; `ouvrir(); ouvrir()` → une entrée (contre-épreuve :
  garde retirée) ; `fermer(); fermer()` → un recul (contre-épreuve : garde retirée → `/avant`) ;
  états invalides ignorés ; StrictMode en haut (contre-épreuve : empiler depuis un effet).
- `statistiquesPodium.test.tsx` : 7 joueurs (5 lignes + bouton ×3, 3 lignes Grosses volées), 6
  (bouton Grosses volées seulement), 4 (aucun) ; ex aequo à deux, à trois ; « Tout voir » de
  Victoires (`dialog` nommé, ordre, `bg-laiton`, `aria-haspopup`) ; retour → fermé, « First 9 »,
  cible et période intactes (contre-épreuve : état interne) ; Accueil → Stats → ouvrir → ✕ →
  retour → Accueil (idem Échap) ; focus rendu ; Grosses volées discriminant (contre-épreuve :
  ordre de la moyenne), bascule qui survit à la période ; Victoires « 2 » « / 2 », « 0 » « / 3 »,
  ni « manche » ni « % » (témoin) ; Finitions sans pied (témoin : « Haut » montre 60).
- Adaptés : `lot4.test.tsx:224-269` (plus de manches ; « 0 / 1 ») ; `:301,307` (« / 2 », « / 1 ») ;
  `manches.test.tsx:131-137` (bascule « Manche », témoin « Manche »).
- Gardes vertes : theme, typographie, pictogrammes (`X` permis), lazyRoutes, horloge, appui,
  accent, hexagonal, réseau.
- Relecture à l'écran (5201) : 7 et 12 joueurs, ex aequo à la coupure ; modal portrait / paysage,
  sombre / clair, liste longue, voile en clair ; T12, T14 ; focus clavier ; pas de défilement sous
  le modal ; T19 sur appareil.

### Risques

1. Double recul → gardes, tests, contre-épreuves. 2. Entrée orpheline → une seule voie de
fermeture, test qui retombe sur l'Accueil. 3. CloseWatcher, geste iOS : angle mort (T19).
4. Débordements, `flex` sur `<dialog>` : écran seulement. 5. Perte d'un invariant à la réécriture
des tests (leçon de T7). 6. Rebase : `labels.ts`, charte, CONVENTIONS, deux modales possibles.
7. Date de la politique si le lot glisse. 8. Deux mécanismes de dialogue : dette documentée.

### Échecs des agents précédents

Aucun ; rapport initial et résolutions valides hors points marqués obsolètes.
### Résolutions de la Révision 1 (arrêt Archi → Dev, 2026-10-15)

| # | Résolution de l'utilisateur |
|---|---|
| R1-Q1 | Lecture littérale : tout le groupe d'égalité compte ; rangs 4-5-6 égaux (N = 5) → coupe net à 5 |
| R1-Q2 | Deux « — » à cheval sur la coupure = deux ex aequo → les deux affichés |
| R1-Q3 | Bouton « Tout voir », sous la liste, pleine largeur, 48 px, discret (`craie-3`, majuscules) |
| R1-Q4 | Modal : tête (pictogramme, titre qui suit la bascule, ✕), **bascules partagées avec la carte**, tous les joueurs au même dessin, sans grande ligne ni rang |
| R1-Q5 | Boîte centrée comme « Nouveau joueur », hauteur bornée, liste qui défile ; fermée par retour, Échap, ✕ — pas par un appui à côté |
| R1-Q6 | Grosses volées : puces « 180 · 140+ · 100+ », « 180 » au départ, titre fixe, trois rangées par joueur, aucune teinte nouvelle |
| R1-Q7 | Victoires : « / 32 » en `text-etiquette` `craie-3` après le nombre, sur chaque ligne ; colonne plus large dans cette carte |
| R1-Q8 | Close par la réponse antérieure de l'utilisateur (« Oui, plus de manches ») : les manches quittent Statistiques ; la bascule « Manche » de Finitions reste |
| R1-Q9 | Modal ouvert puis rechargement : il se rouvre (bascules au premier choix), le retour le ferme |

T10-T14 au Dev ; T15-T16 au Test ; T17 à la Sécurité ; T18 à l'Orchestrator (rebase) ; T19 au
Dev et à l'utilisateur (appareil réel).
**Précision de l'utilisateur sur R1-Q5 (2026-10-15, pendant le Dev)** : le modal est **plus large
et plus long en vertical** que « Nouveau joueur ». Valeurs transmises au Dev par l'Orchestrator :
largeur = écran moins 16 px de chaque côté, bornée à `max-w-lg` ; hauteur maximale ≈ 90 % de la
hauteur visible (`90dvh`), liste qui défile dedans ; toujours centré.
**Demandes de l'utilisateur pendant le Dev de la Révision 1 (2026-10-15)**
- **Q-A** : titre de la carte Moyenne abrégé en **« Moyenne 3 fl. »** (tient à 360 px).
- **R1-Q5 modifiée** : un **appui à côté du modal le ferme** (même chemin que ✕, `navigate(-1)` ;
  un appui dans la boîte ou un glisser parti de la boîte ne ferme pas).
- **Espacement** : plus d'espace entre les joueurs **dans la liste du modal** (≈ 14 px au lieu de
  8) ; les cartes de l'écran ne changent pas.