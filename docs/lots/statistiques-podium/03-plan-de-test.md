# Lot `statistiques-podium` — plan de test

> Agent `test` (opus, effort du frontmatter : high), 2026-10-15. ⚠️ L'agent n'a disposé que de
> Read / Grep / Glob (pas de shell) : sa passe est une **lecture**. Les quatre commandes et les
> contre-épreuves (§ 4) ont été **exécutées par l'Orchestrator** le même jour, à la demande du
> rapport ; résultats ci-dessous.

## 1. Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine / use cases / infrastructure | Hors périmètre | Aucun fichier de `src/core` ni `src/infrastructure` dans `git status` |
| UI pur (`podium.ts`, `decompteBatons`) | Oui | `tests/ui/podium.test.ts` |
| UI composant | Oui | `tests/ui/compteBatons.test.tsx` |
| UI écran (Testing Library, `renderWithServices`, `fakeServices`, `SettableClock`) | Oui | `statistiquesPodium.test.tsx` ; `lot4`, `manches`, `confidentialite`, `pictogrammesEmplacements` adaptés |
| Gardes d'architecture | Lues par Test, **exécutées** par l'Orchestrator (suite complète verte) | — |

- Déterminisme : `SettableClock`, bornes en heure locale. Rejeu du journal : sans objet (seule
  écriture : une préférence d'appareil).
- **Angles morts (écran seulement)** : contraste du titre `laiton` en clair (U4, risque accepté) ;
  `craie-2` et `bg-craie/72` sur papier ; têtes de carte à 390 px (U2) ; troncature à 54 px ;
  ruban d'onglets et absence de défilement horizontal en paysage ; bâtons à 10 groupes sur deux
  lignes (« 100+ » centré) ; zone d'appui des bascules (48 px en hauteur seulement) ; position et
  couleur des pictogrammes (U3), tailles (U10) ; `fieldset` flex sur Safari iOS. Le Dev a relu à
  l'écran ; captures non revues par Test.

## 2. Matrice critère → test

**Critères d'acceptation**

| Critère | Test |
|---|---|
| CA1 ouverture sur le mémorisé | `statistiquesPodium.test.tsx:73` ; sans préférence `:62` ; pur `podium.test.ts:232` |
| CA1 repli profil supprimé | `statistiquesPodium.test.tsx:85` ; pur `podium.test.ts:244` |
| CA1 repli sans fléchette | `statistiquesPodium.test.tsx:96` ; pur `podium.test.ts:240` ; absent de la période : pur `:236` |
| CA2 appui → cible et cases, pas les cartes | `statistiquesPodium.test.tsx:128` (`:152-156`, `:161`) |
| CA3 bascules reclassent | `statistiquesPodium.test.tsx:204`, `:254` ; `lot4.test.tsx:362` ; pur `podium.test.ts:196` |
| CA3 Manche croissante | `statistiquesPodium.test.tsx:284-287` ; pur `podium.test.ts:66` |
| CA3 barres recalculées | Pur seulement (`podium.test.ts:49,66,170`) → T-M2 |
| CA4 bâtons | `compteBatons.test.tsx:21,29,36,43,47` ; pur `podium.test.ts:208-222` |
| CA5 régions nommées | `statistiquesPodium.test.tsx:190` |
| CA5 dessins `aria-hidden` | Pictogrammes `pictogrammesEmplacements.test.tsx:52` ; bâtons `compteBatons.test.tsx:53`, `statistiquesPodium.test.tsx:198-200` ; **barres : aucun** → T-M1 |
| CA6 politique | `confidentialite.test.tsx:88` (clause), `:81` (date) |
| CA7 gardes | Suite complète verte (Orchestrator) |

**Résolutions U1-U10**

| Résolution | Test |
|---|---|
| U1 titres | `statistiquesPodium.test.tsx:217,222` |
| U2 libellés courts / noms | `statistiquesPodium.test.tsx:227` |
| U3 pictogramme | Présence 20 px `pictogrammesEmplacements.test.tsx:52` ; position / couleur : écran |
| U4 titre `laiton` | Écran |
| U5 ex aequo affiché | `podium.test.ts:170,187` |
| U6 « fl. » grande ligne seule | `statistiquesPodium.test.tsx:289` |
| U7 écrite à l'appui seulement | `statistiquesPodium.test.tsx:146`, `:162` |
| U7 repli réévalué, préférence conservée | `statistiquesPodium.test.tsx:115-125` |
| U8a personne n'a d'occasion | Pur `podium.test.ts:149` ; grande ligne « — » à l'écran non testée |
| U8b tous à zéro → aucune teinte | `podium.test.ts:144` |
| U8c pied de Finitions | `statistiquesPodium.test.tsx:275` (présent), `:292` (absent) |
| U8d moins de 3 zones | `statistiquesPodium.test.tsx:175` ; aucune fléchette : non testé à l'écran |
| U8e « 0 manche sur 0 » | `lot4.test.tsx:253` |
| U8f un joueur, pas de sélecteur | `statistiquesPodium.test.tsx:165` |
| U8g choix d'un supprimé / sans fléchette | Pur `podium.test.ts:254` ; écran non testé |
| U9 ordre des victoires | **Non discriminé** → T-M3 |
| U10 tailles | Écran |

**Gate Dev** : nom court + complet `statistiquesPodium.test.tsx:236,247` ; joueur seul doré
`podium.test.ts:137-140` ; égalité non nulle dorée `podium.test.ts:129` ; joueur seul à 0 non
doré `podium.test.ts:141`.

**Autres** : `null` en dernier `podium.test.ts:82,97`, `lot4.test.tsx:362` ; largeurs sans NaN
`podium.test.ts:113` ; valeur corrompue pur `podium.test.ts:248` ; bascules remises à zéro
`statistiquesPodium.test.tsx:301` ; bascules qui survivent à la période : **non testé** → T-M4 ;
résumé de partie après extraction de `PlateauImpacts` : `resumeX01.test.tsx:164` (SVG extrait
identique).

## 3. T7 — migration de `lot4` et `manches`

Comparaison avec `C:\Users\kevin\Documents\Flechettes\tests\ui\` (`main`) : tri par moyenne
(`lot4:195`), dénominateur des manches (`:224`), aucune manche (`:253`, « 0 manche sur 0 »),
« — » / « 0 % » des doubles (`:362`, ordre en plus), « Aujourd'hui » (`:278`), deux états vides
(`:271`, `:311`), carte d'impacts (`:336`), aucun « leg » (`manches.test.tsx:112-139`, témoin
positif). **Rien de perdu** ; plusieurs points renforcés.

## 4. T6 et contre-épreuves (exécutées par l'Orchestrator)

Méthode : copie du fichier, remplacement d'une chaîne (1 occurrence vérifiée), test ciblé,
restauration de la copie, empreinte SHA-256 comparée (identique dans les 5 cas), `git status`
inchangé.

| Casse | Fichier | Résultat |
|---|---|---|
| a. `aria-hidden` retiré du `<svg>` des bâtons | `CompteBatons.tsx:36` | **2 échecs** : `compteBatons` « les bâtons sont muets », `statistiquesPodium` « chaque carte est une région nommée » |
| b. `teinte = true` | `podium.ts:83` | **2 échecs** : « un seul joueur … sauf à zéro », « tous à égalité à zéro » |
| c. `setMemorise(id)` retiré | `StatistiquesEcran.tsx:392` | **1 échec** : « un appui change la cible … mémorise le joueur » |
| d. Manche en décroissant | `podium.ts:147` | **2 échecs** : manche croissante (pur), Finitions (écran) |
| e. `aria-hidden` retiré de la piste de barre | `CartePodium.tsx:156` | **0 échec** (63 tests verts) — **confirme le trou T-M1** |

## 5. Commandes (exécutées par l'Orchestrator, 2026-10-15)

| Commande | Résultat |
|---|---|
| `npm run lint` | `Checked 277 files in 134ms. No fixes applied.` |
| `npm run typecheck` | `tsc --noEmit`, sans erreur |
| `npx vitest run` | `Test Files 67 passed (67)` · `Tests 1118 passed (1118)` |
| `npm run build` | `✓ built in 371ms` |

## 6. Constats classés

**Bug d'implémentation (boucle 1)** : aucun établi.

**Tests manquants**

| # | Trou | Proposition |
|---|---|---|
| T-M1 | `aria-hidden` des barres non vérifié (contre-épreuve e) | `querySelectorAll('ol li > span[aria-hidden]')` avec témoin |
| T-M2 | Rendu de `ClassementPodium` (ex aequo `bg-laiton` / `text-laiton-clair`, `style.width`, « — » `craie-3`) non testé à l'écran | Test de composant avec `toHaveStyle` / `toHaveClass` |
| T-M3 | U9 non discriminé (même ordre victoires / moyenne) | Base où le premier à la moyenne a moins de victoires, parties différentes |
| T-M4 | Bascules qui survivent au changement de période | F9 → « 7 jours » → « Tout » → région « First 9 » |
| T-M5 (mineur) | Teintes des bâtons par seuil | `toHaveClass('text-laiton')` sur la rangée 180 |
| T-M6 (mineur) | Ordre dans Grosses volées, sous-titre, valeur corrompue à l'écran, appui sur un supprimé (U8g) | Tests d'écran courts |

**Non bloquant** : N1 `detailVictoires` mêle `nombre()` (groupé) et `pluriel()` (non groupé) au-delà
de 999 (`labels.ts:887`) ; N2 plusieurs « Joueur supprimé » au même nom accessible ; N3 le test
`:96` ne prouve pas que Sarah est dans la liste « Aujourd'hui ».

## 7. Questions ouvertes

| # | Question | Pour |
|---|---|---|
| Q1 | % doubles : un joueur à « 0 % », les autres sans occasion → le « 0 % » est doré (un `null` compte comme « derrière »). Ignorer les `null` dans le test d'égalité ? | Utilisateur |
| Q2 | Grande ligne quand personne n'est teinté : le grand chiffre reste `laiton-clair`. Voulu ? | Utilisateur |
| Q3 | Zone d'appui des bascules 48 px en hauteur seulement : écart accepté ? | Utilisateur / Revue |

### Résolutions de l'utilisateur (2026-10-15)

- **Q1** : **jamais de dorure à zéro** — les « — » ne comptent pas comme « derrière » ; un
  meilleur à 0 n'est jamais doré (il reste premier de la liste, sans laiton).
- **Q2** : quand personne n'est en tête, le grand chiffre passe en **`craie-vive`** (laiton
  seulement s'il y a un vrai premier).
- **Q3** : écart **accepté** (zone d'appui 48 px en hauteur seulement), à consigner dans la charte
  comme écart connu.

→ Boucle 1 (Test → Dev), tour 1 : Q1, Q2 dans le code ; T-M1 à T-M6 écrits ; Q3 dans la charte.

---

## Rejeu après la boucle 1, tour 1 (2026-10-15)

> Agent `test` (opus, lecture seule, sans shell). Commandes et contre-épreuves exécutées par
> l'Orchestrator.

**Commandes** : lint `Checked 278 files in 143ms. No fixes applied.` ; typecheck sans erreur ;
`npx vitest run` **68 fichiers, 1136 tests** verts ; build `✓ built in 447ms`.

**Points rejoués** (aucun bug d'implémentation, aucune régression ; 1136 − 1118 = 18 tests
ajoutés, aucun supprimé)

| Point | Implémentation | Tests |
|---|---|---|
| Q1 jamais de dorure à zéro | `podium.ts:83` | `podium.test.ts:137-141,144,154,162` ; écran `statistiquesPodium.test.tsx:435` (témoin `:452`) |
| Q2 grand chiffre `craie-vive` sans premier | `CartePodium.tsx:137-144` | `classementPodium.test.tsx:60` ; `statistiquesPodium.test.tsx:454` |
| T-M1 pistes `aria-hidden` | `CartePodium.tsx:161` | `classementPodium.test.tsx:82` ; `statistiquesPodium.test.tsx:373` |
| T-M2 rendu `ClassementPodium` | — | `classementPodium.test.tsx:33,71` |
| T-M3 U9 discriminé | `StatistiquesEcran.tsx:299,307` | `statistiquesPodium.test.tsx:389` |
| T-M4 bascule qui survit | `StatistiquesEcran.tsx:376-377` | `statistiquesPodium.test.tsx:419` |
| T-M5 teintes des bâtons | `StatistiquesEcran.tsx:192-194` | `statistiquesPodium.test.tsx:357-361` |
| T-M6 | — | `:364` (ordre, partiel), `:459` (sous-titre), `:469` (corrompue), `:480`, `:491` (U8g) |
| N1 | `labels.ts:888` | Aucun test au-delà de 999 (TM-c) |

**Contre-épreuves** (copie, remplacement d'une occurrence, test ciblé, restauration, SHA-256
identique dans tous les cas, `git status` inchangé)

| # | Casse | Résultat |
|---|---|---|
| CE-1 | Q1 : `meilleure !== 0` retiré (`podium.ts:83`) | **4 échecs** (3 purs, 1 écran) |
| CE-2 | Q2 : `'text-craie-vive'` → `'text-laiton-clair'` (`CartePodium.tsx`) | **2 échecs** |
| CE-3 | T-M4 : la période remet la bascule à « Moyenne » | **1 échec** (T-M4 n'est pas vert à vide) |
| CE-4 / 4b | U9 : classement / détail sur la moyenne | **1 échec** chacun |
| CE-5 | T-M5 : 100+ en `text-craie` | **1 échec** |
| CE-6 | N1 : `${nombre(jouees)}` → `${jouees}` | **Non exécutée** : 2 occurrences de la chaîne ; de toute façon aucun test au-delà de 999 (TM-c) |
| CE-7 | `absente: false` (`StatistiquesEcran.tsx:86`) | **0 échec** (655 tests UI verts) — **confirme TM-d** |

**Tests manquants mineurs (non bloquants)** : TM-a ordre de Grosses volées non discriminé de
l'ordre de création ; TM-b préférence corrompue à l'écran sans discriminant (la fonction pure le
prouve) ; TM-c N1 sans test au-delà de 999 ; TM-d correspondance `valeur === null → absente`
non vérifiée à l'écran (CE-7).

**Non bloquant** : commentaire périmé `CartePodium.tsx:58-60` (« 11 px », réel 14 px) ;
`01-architecture.md:98` dit « accordé par `pluriel` », le code accorde à la main (même règle) ;
N2, N3 inchangés. **Angle mort** : pas de relecture à l'écran après Q1 / Q2.

**Questions ouvertes** : aucune.

---

## Révision 1 — rejeu Test (2026-10-15)

> Agent `test` (opus, lecture seule, sans shell). Commandes rejouées par l'Orchestrator après la
> dernière modification : lint `Checked 282 files … No fixes applied.` ; typecheck sans erreur ;
> **70 fichiers, 1180 tests** ; build `✓ built in 375ms`. Contre-épreuves CE-16 à CE-22 exécutées
> par l'Orchestrator.

**Verdict** : aucun bug d'implémentation, aucune régression ; résolutions encore valides
couvertes. Tests manquants : T15 tenu à moitié (piège 6 non protégé), contenu du modal vérifié
pour Moyenne seulement, rien contre un `flex` sur le `<dialog>`.

**Matrice Révision 1** (extraits) : N = 5 / 5 / 3 / 5 `podium.test.ts:96`, écran
`statistiquesPodium.test.tsx:575` ; seuil N + 1 pur `:25,31`, écran `:594,:606` ; ex aequo à la
coupure pur `:36,:40`, écran `:619` ; R1-Q1 pur `:44` ; R1-Q2 pur `:52` ; U5 à la coupure `:68` ;
mêmes objets carte / modal `:85`, dorure `:647` ; modal nommé, tous les joueurs, focus ✕ `:634`,
`modale.test.tsx:18,30` ; bascules partagées `:652` ; retour ferme sans quitter `:664`,
`modaleAuRetour:65` ; un seul recul `:714`, `modaleAuRetour:76` ; voile `modale:68,79,101`,
`statistiquesPodium:684` ; `cancel` / `close` `modale:46,55` ; focus rendu `modale:112`,
`statistiquesPodium:736` ; R1-Q9 harnais `modaleAuRetour:113,136` (rien à l'écran) ; état
invalide `modaleAuRetour:105` ; Grosses volées `:372`, pur `podium:102` ; Victoires « v / j »
`:324,:423`, `lot4:224`, `classementPodium:103` ; plus de manches `:340`, `lot4:255-258` ;
Finitions sans pied `:294-297` ; T12 `classementPodium:118` ; Q-A `:204,:218`,
`pictogrammesEmplacements:64`, `lot4:213` ; espacement 14 px et taille du modal : écran.

**Résolutions antérieures** : CA1-CA6, U1-U3, U5-U7, U8a/b/d/f/g, gate Dev 1-3, Q1, Q2, clé en
dur, préférence corrompue — toutes couvertes (détail dans le rapport). Obsolètes : U8c, U8e, U9
(ordre du détail), N1, TM-a, TM-c.

**T15** : gardes `enVol` prouvées (`modaleAuRetour:87,97`, CE-4 / CE-5) ; StrictMode tout en
haut (`:57`). **Trou 1** : les deux tests StrictMode ne peuvent échouer ; le piège 6 (nettoyage
d'effet qui ferme) vit dans `Modale.tsx`, que le harnais ne monte pas. **Trou 2** (mineur) : moitié
« `ouverte` » des gardes jamais exercée.

**T16** : ce qui reste vrai est conservé (tri, « Aujourd'hui », états vides, carte d'impacts,
« — » / « 0 % » / « 33 % » des doubles, aucun « leg ») ; retraits justifiés et prouvés par absence
avec témoin. Écart de documentation : `modaleAuRetour` compte 12 tests, pas 11.

**Contre-épreuves du Dev** : recomptées, aucune vide.

**Contre-épreuves proposées par Test, exécutées par l'Orchestrator** (suite `tests/ui`, 699 tests ;
SHA-256 identique après restauration)

| # | Mutation | Résultat | Conclusion |
|---|---|---|---|
| CE-16 | nettoyage d'effet `return () => dialogue.close()` (`Modale.tsx`) | 0 échec | Trou 1 confirmé → TM-1 |
| CE-17 | `flex` sur le `<dialog>` | 0 échec | → TM-2 |
| CE-18 | garde `ouvrir` sans `ouverte !== null` | 0 échec | → TM-3 |
| CE-19 | garde `fermer` sans `ouverte === null` | 0 échec | → TM-4 |
| CE-20 | modal Victoires sans « / j » | 0 échec | → TM-5 |
| CE-21 | modal Grosses volées dans l'ordre de la moyenne | 0 échec | → TM-6 |
| CE-22 | focus initial supprimé | **3 échecs** (`modale` ×2, `statistiquesPodium` ×1) | Focus non vérifié à vide |

**Tests manquants** : TM-1 piège 6 (harnais hook + `Modale` sous StrictMode, entrée
`{ state: { liste: 'A' } }`) ; TM-2 aucun `flex` / `grid` / `block` sur le `<dialog>` ; TM-3 ouvrir
déjà ouvert en deux gestes ; TM-4 fermer sans modale ; TM-5 modal Victoires « / j » par ligne ;
TM-6 modal Grosses volées sur le seuil (+ coupure à 3 qui diffère de la moyenne) ; TM-7 R1-Q9 à
l'écran (basse priorité) ; TM-8 espacement (basse priorité) ; TM-d « — » en `craie-3` à l'écran.

**Angles morts (T19)** : retour réel par appareil (Chrome Android `cancel` / `close`, Firefox et
Samsung `popstate`, glisser iPhone, PWA iPhone ✕ et voile seulement) ; polyfill `close`
synchrone ; arrière-plan non inerte en jsdom ; voile testé avec un rectangle simulé ;
`::backdrop` et propriétés personnalisées avant Chrome 122 / Safari 17.4 / Firefox 120 (voile
possiblement transparent ou du mauvais thème — même classe que `DialogueNouveauJoueur`) ;
défilement sous le modal sur iOS ; `dvh` ; rendu portrait / paysage, sombre / clair.

**Questions** : QO-1 nom accessible de « Moyenne 3 fl. » (utilisateur) ; QO-2 TM-1 exigé ?
(Orchestrator).

**QO-2 close par l'Orchestrator (technique)** : **TM-1 à TM-6 et TM-d exigés** avant Sécurité —
CE-16 à CE-21 prouvent qu'aucun test ne protège ces points ; TM-7 et TM-8 laissés en basse
priorité (relecture à l'écran). → Boucle 1 (Test → Dev), tour 3.
### Rejeu après la boucle 1, tour 3 (Orchestrator, 2026-10-15)

Rejeu mécanique par l'Orchestrator (les ajouts sont des tests et un nom accessible ; le plan de
Test les spécifiait avec leur contre-épreuve) : lint `Checked 282 files in 167ms. No fixes
applied.` ; typecheck sans erreur ; **70 fichiers, 1187 tests** ; build `✓ built in 432ms`.
CE-16 à CE-21 ré-exécutées (suite `tests/ui`, SHA-256 identique après restauration) : **1 échec
chacune**, sur le test attendu (TM-1, TM-2, TM-3, TM-4, TM-5, TM-6). Questions ouvertes : aucune.
Restent TM-7, TM-8 (basse priorité) et les angles morts T19 (appareil réel).
### Rejeu après la boucle 5, tour 4 (Orchestrator, 2026-10-15)

Lint `Checked 282 files in 141ms. No fixes applied.` ; typecheck sans erreur ; **70 fichiers, 1193
tests** ; build `✓ built in 406ms`. Ajouts : 4 tests purs et 2 tests d'écran du constat 3, chacun
prouvé par une contre-épreuve du Dev (2 et 3 échecs). Aucune question ouverte.
### Rejeu après le tour 5 (Orchestrator, 2026-10-16)

Lint `Checked 282 files in 150ms. No fixes applied.` ; typecheck ; **70 fichiers, 1194 tests** ;
build `✓ built in 397ms`. Contre-épreuve du constat 11 rejouée (`[actif]`) : **1 échec**, le test
« au changement de période … (constat 11) » ; SHA-256 identique après restauration. Avant le
tour 5, la même mutation laissait 88 tests verts.