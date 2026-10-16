# Lot `statistiques-podium` — notes de dev

> Agent `dev` (opus, effort du frontmatter : medium), 2026-10-15. Rapport recopié par
> l'Orchestrator. Rien de committé.

## Contrôles (relancés après la dernière modification)

| Commande | Résultat |
|---|---|
| `npm run lint` | `Checked 277 files … No fixes applied.` — 0 erreur |
| `npm run typecheck` | `tsc --noEmit` — 0 erreur |
| `npx vitest run` | 67 fichiers, **1116 tests**, 0 échec |
| `npm run build` | `✓ built in 371ms`, SW généré |

Gardes `themeBoundary`, `typographieBoundary`, `pictogrammesBoundary`, `lazyRoutes`,
`horlogeBoundary`, `appuiBoundary` vertes ; `resumeX01.test.tsx` vert.

## Implémenté

Tout dans `src/ui/` ; cœur, infrastructure, composition intacts ; aucun port, aucun format
persisté.

**Nouveaux**
- `src/ui/podium.ts` (pur) : `MesurePodium`, `LignePodium`, `classerPodium` ; mesures
  `MESURE_MOYENNE` (Moyenne / First 9 / Meilleure volée), `MESURE_VICTOIRES`, `MESURE_FINITIONS`
  (% doubles / Plus haut / Manche) ; `ChoixCible`, `joueurDeLaCible`.
- `composants/commun/CartePodium.tsx` : `CartePodium` (`section aria-labelledby`, `<h2>`,
  pictogramme 20 px à gauche, titre et pictogramme en `laiton`) ; `BasculesPodium` (`fieldset
  aria-label`, boutons `aria-pressed`, libellé visible court, nom accessible complet, zone d'appui
  48 px par `after:-inset-y-3.5`) ; `ClassementPodium` (grande ligne, `<ol>` de barres, pied
  facultatif).
- `composants/commun/CompteBatons.tsx` : `PLAFOND_GROUPES_BATONS = 10`, `decompteBatons`, groupes
  SVG `aria-hidden` (géométrie de la planche), nombre écrit dès 1, « — » `craie-3` à 0.

**Modifiés**
- `StatistiquesEcran.tsx` réécrit : `OngletsJoueurs` (`fieldset`, absent à un joueur) ;
  `BlocCible` (`PlateauImpacts` `max-w-sm` + cases) ; `Podium` (quatre cartes). Préférence
  `statistiques:joueur` par **un seul** `usePreference`, écrite à l'appui seulement. Bascules dans
  l'écran, au-dessus du chargement, non mémorisées.
- `CarteImpacts.tsx` : extraction de `PlateauImpacts` ; `CarteImpacts` = plateau + légende, rendu
  inchangé pour le résumé.
- `PanneauImpacts.tsx` : commentaire nuancé (côte à côte : résumé de partie seulement).
- `Avatar.tsx` : taille `ms` (34 px, `size-8.5`).
- `labels.ts` : français de l'écran (titres, bascules `court` / `complet`, `libelleZone`,
  `detailVictoires`, segments du pied de Finitions, `nombre`, `flechettesLancees`, états vides
  déplacés) ; retrait de `LIBELLE_MANCHES_GAGNEES` / `LIBELLE_MANCHES_JOUEES` ; **politique** :
  « le dernier joueur consulté dans Statistiques (son identifiant interne) » ; **date** :
  `'Mise à jour le 15 octobre 2026'`.

**Docs**
- Charte : § Identité (pictogrammes des cartes du podium en `laiton`, couleur du titre, U3) ;
  § Composants (`CompteBatons` distingué de `Batons`, `CartePodium` / `BasculesPodium` /
  `ClassementPodium`, `PlateauImpacts`) ; écart connu U4 (4,40:1 en clair, risque accepté) ;
  § La carte des impacts (deux emplois).
- CONVENTIONS § 9 (`pourcent` : un seul appelant) ; § 14 (`podium.ts`).

**Tests**
- Nouveaux : `tests/ui/podium.test.ts` (deux sens, `null` en dernier, largeurs, aucune NaN, ex
  aequo sur le chiffre affiché, tous égaux sans teinte, `decompteBatons` 0/4/5/49/50/51/312,
  `joueurDeLaCible` 8 cas) ; `tests/ui/compteBatons.test.tsx` (dessin 49/50/51/312/3/0) ;
  `tests/ui/statistiquesPodium.test.tsx` (préférence semée en dur, deux replis, retour au
  changement de période ; appui → cible et cases changent, cartes non, préférence écrite ; trois
  bascules par carte, Manche croissante ; libellés courts / noms complets ; pied de Finitions
  présent / absent ; bascules remises à zéro ; détail de Victoires ; Grosses volées ; un joueur →
  pas de sélecteur).
- Adaptés : `lot4.test.tsx` (tables → régions ; manches « 0 manche sur 0 » / « 1 manche sur 1 » ;
  % doubles « 33 % » / « 0 % » / « — ») ; `manches.test.tsx` ; `confidentialite.test.tsx` (date,
  clause) ; `pictogrammesEmplacements.test.tsx` (4 pictogrammes 20 px, un par carte).

## Questions techniques closes

- **T1** : classes vérifiées dans le CSS construit (`bg-craie/72`, `bg-craie/8`, `border-t-3`,
  `size-8.5`, `w-7.5`, `px-1.75`, `gap-0.75`, `after:-inset-y-3.5`, `border-b-3`, `leading-[0.9]`).
- **T2** : filet bas des onglets = `span` absolu `h-px bg-craie/25` sous le ruban ; boutons en
  `border-b-3` (transparent ou `laiton`) qui le recouvrent ; `fieldset` en `min-w-0`.
- **T3** : `nombre()` = `toLocaleString('fr-FR')` (U+202F) ; aucun nombre groupé en dur dans les
  tests.
- **T4** : commentaire de `pourcent` et CONVENTIONS § 9 à jour.
- **T5** : `resume()` et `Dart.label` intacts ; « Bulle 25 / 50 » par `libelleZone`.

## Écarts (tous des ajustements, aucune refonte)

| Écart | Justification |
|---|---|
| Groupes en `<fieldset aria-label>` plutôt que `role="group"` | Biome `useSemanticElements` ; même rôle exposé |
| Zone d'appui des bascules : 48 px en hauteur seulement (« F9 » ≈ 29 px de large) | Étendre la largeur ferait chevaucher les puces (4 px d'écart) ; mesuré à l'écran |
| Ex aequo : clé = valeur arrondie à la précision affichée (`Math.round`) | Comparaison de chaînes non transitive ; même clé pour les largeurs ; cas de demi pile très rare |
| Un seul joueur : barre non dorée | Application de U8b (« tous à égalité → aucune teinte ») ; grand chiffre en `laiton-clair` |
| Chiffres des bâtons en `craie` quel que soit le seuil | Comme la planche ; évite du texte `laiton` sous le plancher en clair |
| « 180 · 140+ · 100+ » `aria-hidden` | Chaque rangée porte son libellé dans un `<dt>` |
| États vides et titres déplacés dans `labels.ts` | Règle du français dans `labels.ts` ; textes inchangés |

## Textes pour lecteurs d'écran (à relire par l'utilisateur)

- Groupes : « Joueur de la cible » ; « Classer la moyenne par » ; « Classer les finitions par ».
- Bascules : « Moyenne », « First 9 », « Meilleure volée » ; « % doubles », « Plus haut finish »,
  « Manche la plus courte ».
- Onglets : nom du joueur (avatar `aria-hidden`), `aria-pressed`.
- Régions : « Moyenne 3 fléchettes » / « First 9 » / « Meilleure volée » ; « Victoires » ;
  « Grosses volées » ; « Finitions ».
- Cible : `role="img"` nommé par `resume()` ; cases « T20 / 115 fois », … « 36 / hors cible ».
- Grande ligne lue en texte (« Kevin 22 / 26 », « Sarah 1 fl. »), répète le premier de la liste.
- Grosses volées : nom en `sr-only`, puis `dl` (« 180 » « 4 », « 140+ » « 32 »…), « — » à zéro.
- Pieds : séparateurs « · » `aria-hidden`.

## Relecture à l'écran

Vite sur le port 5201, Chrome par `playwright-core` ; bases semées par les vrais use cases
(`startMatch`, `recordVisit`, double out). Portrait 390×844, paysage 844×390, sombre / clair,
1, 3, 6 joueurs.

- **U2** : libellés courts tiennent à 390 px, titre « Meilleure volée » compris, sur une ligne,
  ni tronqué ni débordant (bascules 128 px Moyenne, 168 px Finitions).
- Aucun défilement horizontal de page.
- Onglets 77 px de haut ; à 6 joueurs aux noms de 20 caractères, seul le ruban défile en
  portrait ; tout tient en paysage.
- Bâtons : 63 → 10 groupes sur deux lignes puis « 63 ». Étiquette « 100+ » centrée verticalement
  sur les deux lignes (cas absent de la planche, cosmétique).
- Noms longs tronqués dans la colonne de 54 px ; grande ligne tient 20 caractères.
- Clair : barres `craie/72` lisibles ; contraste du titre `laiton` non mesuré (U4).
- Paysage : cible ≤ 384 px, l'écran défile.
- Aucune valeur de barre ne déborde (« 100 % » compris).
- Barre de navigation au milieu des pleines pages : artefact de `fullPage`.

Captures et script (hors dépôt) :
`C:\Users\kevin\AppData\Local\Temp\claude\C--Users-kevin-Documents-Flechettes-statistiques-podium\89ce977b-e51b-411b-9851-32effd6ef2a6\scratchpad\captures\`
(`relecture.mjs`, `trois-sombre-portrait.png`, `six-sombre-portrait.png`,
`trois-clair-portrait.png`, `trois-sombre-portrait-carte-volee.png`…).

## Questions ouvertes (posées par le Dev)

1. Noms accessibles complets des bascules vs libellé visible (WCAG 2.5.3, CONVENTIONS § 9) :
   « Moy. », « F9 », « % dbl » ne sont pas contenus dans le nom. Alternative : « First 9 (F9) ».
2. Un seul joueur : dorer quand même sa barre ?
3. Meilleure volée quand tous ont 180 : aucune teinte, barres pleines — carte « morte ».

### Résolutions de l'utilisateur (gate Dev, 2026-10-15)

1. **Nom accessible = court + complet** (« F9, First 9 »), pour TalkBack / VoiceOver et le
   contrôle vocal. Précision de l'utilisateur : l'**annonce vocale de l'app** ne parle que sur les
   écrans de jeu — l'écran Statistiques n'en a pas et n'en aura pas.
2. **Un seul joueur : sa barre est dorée** (un joueur seul est premier, pas « à égalité »).
3. **Égalité complète à une valeur non nulle : tous en laiton** ; « aucune teinte » ne vaut que
   pour une égalité complète à zéro (ou sans occasion). Précise U8b.

→ Reprise du Dev dans la même phase (pas une boucle). Résultat :

- Noms accessibles par `nomBascule` (`labels.ts`) : « Moy., Moyenne », « F9, First 9 »,
  « Volée, Meilleure volée » ; « % dbl, % doubles », « Haut, Plus haut finish », « Manche, Manche
  la plus courte ». Libellé visible inchangé ; rien côté annonce vocale.
- `classerPodium` : en tête = à égalité avec le meilleur ; tous égaux à une valeur non nulle →
  tous en tête (tous à 180, joueur seul) ; aucune teinte si tous à 0 ou tous sans occasion.
- **Joueur seul à 0** (ex. 0 victoire) : non doré. Lecture de l'Orchestrator : la réponse 3
  (« égalité à zéro → aucune teinte ») est la plus spécifique et l'emporte sur la réponse 2 ;
  signalé à l'utilisateur à la fin du lot.
- Fichiers : `src/ui/podium.ts`, `src/ui/labels.ts`, `CartePodium.tsx`, `tests/ui/podium.test.ts`
  (+2 tests), `tests/ui/statistiquesPodium.test.tsx`, `docs/CHARTE_GRAPHIQUE.md`.
- `npm run lint` : « Checked 277 files … No fixes applied. » ; typecheck sans erreur ;
  `npx vitest run` : 67 fichiers, **1118 tests** ; build « ✓ built in 387ms ».

## Boucle 1, tour 1 (Test → Dev, 2026-10-15)

- **Q1** (`podium.ts`) : en tête = égale le meilleur **et** meilleur ≠ 0 ; les « — » ne comptent
  plus. Un « 0 % » devant des « — » et un joueur seul à 0 ne sont pas dorés ; égalité non nulle →
  tous dorés.
- **Q2** (`CartePodium.tsx`) : grand chiffre `laiton-clair` seulement si le premier est doré,
  sinon `craie-vive` ; « — » toujours `craie-3`.
- **Q3** : écart d'appui consigné dans la charte, sous l'écart U4.
- **N1** corrigé : `detailVictoires` passe tous les nombres par `nombre()`, accord à la main.
- Tests : T-M1 (pur dans `tests/ui/classementPodium.test.tsx`, nouveau, et à l'écran sur trois
  cartes, avec témoin) ; T-M2 (`bg-laiton`, `laiton-clair`, largeurs 100 / 100 / 50 / 0 %, « — »
  `craie-3`, grand chiffre `craie-vive` sans premier, pas de complément sans valeur) ; T-M3 (U9
  discriminé : Kevin premier à la moyenne, Julien premier aux victoires, « / 2 ») ; T-M4 (F9
  survit à « 7 jours » puis « Tout ») ; T-M5 (teintes des bâtons) ; T-M6 (ordre Grosses volées,
  sous-titre, 4 préférences corrompues, appui sur supprimé / sans fléchette) ; Q1 pur et écran.
- Contre-épreuve T-M1 (Dev) : sans l'`aria-hidden` de la piste, 3 échecs ; restauré.
- Fichiers : `src/ui/podium.ts`, `CartePodium.tsx`, `labels.ts`, `docs/CHARTE_GRAPHIQUE.md`,
  `tests/ui/podium.test.ts`, `statistiquesPodium.test.tsx`, `classementPodium.test.tsx`.
- Résultats (Dev, puis rejoués par l'Orchestrator) : lint `Checked 278 files … No fixes applied.` ;
  typecheck sans erreur ; **68 fichiers, 1136 tests** ; build `✓ built in 447ms`.
- Restent : N2, N3 (non bloquants) ; **pas de nouvelle relecture à l'écran après Q1 / Q2**.

## Limites connues

- Zone d'appui des bascules en hauteur seulement.
- Titre `laiton` à 4,40:1 en clair (écart connu, charte).
- Pas de vrai iPhone : `fieldset` en flex et défilement du ruban à vérifier sur Safari iOS.
- PROJECT_PLAN, étude, index non touchés (fin de lot). T9 au rebase.
- Date de la politique à corriger si le lot se clôt un autre jour que le 2026-10-15.

---

## Révision 1 — « N premiers, puis Tout voir » (Dev, 2026-10-15)

> Même agent `dev` (opus), repris par message après le go de l'utilisateur. Rapport recopié.

**Fichiers**
- `src/ui/podium.ts` : `CARTES_PODIUM`, `CartePodiumId`, `APERCU_PODIUM` (5 / 5 / 3 / 5) ;
  `apercuPodium` (≤ N + 1 → tout ; sinon N ; exactement 2 ex aequo à la coupure → N + 1 ; plus de
  2 → N ; deux « — » égaux) ; `MESURE_GROSSES_VOLEES` (0 = valeur).
- `src/ui/labels.ts` : `SeuilGrossesVolees`, `BASCULE_GROSSES_VOLEES`,
  `LEGENDE_BASCULE_GROSSES_VOLEES`, `LIBELLE_TOUT_VOIR`, `nomToutVoir`, `LIBELLE_FERMER` ;
  `nomBascule` rend le court seul si court = complet ; retraits `detailVictoires`,
  `segmentPlusHautFinish`, `segmentMancheLaPlusCourte` ; commentaire de `pourcent`.
- `CartePodium.tsx` : `GrandeLignePodium`, `BarresPodium`, `BoutonToutVoir` ;
  `LigneClassement.complement` ; prop `pied` retirée ; commentaires corrigés (« 14 px », Q3).
- `composants/commun/Modale.tsx` (nouveau) : `<dialog>` monté en permanence, contenu seulement
  ouvert ; un effet sans nettoyage qui ferme ; `onCancel` → `preventDefault` + `onFermer` ;
  `onClose` relayé seulement si ouvert ; focus sur ✕ puis rendu ; jamais `flex` sur le dialog.
- `hooks/useModaleAuRetour.ts` (nouveau) : PUSH d'état sur la même URL au clic seulement ;
  fermeture par `navigate(-1)` ; garde « en vol » `useRef`, remise sur `location.key`
  (`biome-ignore` justifié) ; état relu validé contre la liste fermée.
- `StatistiquesEcran.tsx` : `classementDe`, `lignesDe`, `teteDe`, `CarteDuPodium`,
  `ListeComplete` ; `mesureGrossesVolees` (« 180 ») au-dessus du chargement ;
  `useModaleAuRetour('liste', CARTES_PODIUM)` ; `<Modale>` en fin de `<main>`, hors branches
  chargement / vide, `SpinnerLigne` sans données ; retraits `Segments`, détail Victoires, pied
  Finitions, mention « 180 · 140+ · 100+ ».
- Tests : nouveaux `tests/ui/modale.test.tsx` (6), `tests/ui/modaleAuRetour.test.tsx` (11, dont
  2 sous StrictMode tout en haut) ; adaptés `podium.test.ts`, `classementPodium.test.tsx`,
  `statistiquesPodium.test.tsx` (7 / 6 / 4 joueurs, ex aequo à 2 et 3, dialogue, bascules
  partagées, retour, Accueil → Stats → ✕ / Échap → retour, focus, Grosses volées discriminées et
  bascule qui survit, Victoires « v / j » sans manches, Finitions sans pied), `lot4.test.tsx`,
  `manches.test.tsx`.
- Docs : charte (podium, `Modale`, écart Q3 étendu) ; CONVENTIONS § 9 (`pourcent` ; « une modale
  se ferme au retour du téléphone » ; dette `DialogueNouveauJoueur`), § 14 ;
  `.claude/rules/frontend-react.md` (hooks).
- `src/ui/ecrans/nouvelle-partie/` non touché.

**Taille du modal (précision R1-Q5)** : largeur `w-[calc(100%-2rem)]` `max-w-lg` (358 px à 390,
512 px à 844) ; hauteur `max-h-[90dvh]` sur le dialog, `max-h-[calc(90dvh-4px)]` sur le
conteneur (tête fixe, liste qui défile) ; mesuré 760 / 844 (12 joueurs, défile), 351 / 390 en
paysage (tête visible). Pas de repli `vh` (une valeur par propriété) : hors Chrome 108+ / Safari
15.4+, plafond natif du `<dialog>`.

**T10-T14**
- T10 : sources non lues ; constaté (`MemoryRouter`, Chrome `BrowserRouter`) que `navigate` vers
  l'emplacement courant avec `state` empile ; transitions couvertes par la garde.
- T11 : `display: block` mesuré ; tête fixe ; hauteur bornée en paysage.
- T12 : colonnes fixes (`24px 54px 1fr 72px` pour Victoires, 44 px ailleurs) ; test « une seule
  grille par carte » ; relu avec « 2 / 4 ».
- T13 : focus sur ✕ à l'ouverture, rendu à « Tout voir, Victoires » après Échap (Chrome et jsdom).
- T14 : Grosses volées ni tronquée ni débordante à 390 / 360 px ; **« Moyenne 3 fléchettes »
  tronqué (ellipse) à 360 px** — préexistant (U2 vérifié à 390) → Q-A.

**Contre-épreuves** (exécutées par le Dev ; SHA-256 identique après chaque restauration, 12/12 ;
script `…\scratchpad\contre-epreuves.ps1`)

| # | Mutation | Échecs |
|---|---|---|
| CE-1 | `=== 2` → `>= 2` | 6 |
| CE-2 | `<= n + 1` → `<= n` | 4 |
| CE-3 | fermer par `replace` | 3 |
| CE-4 | garde de `ouvrir` retirée | 1 |
| CE-5 | garde de `fermer` retirée | 1 |
| CE-6 | état local au lieu de l'historique | 6 |
| CE-7 | Grosses volées sur la moyenne | 1 |
| CE-8 | `cancel` sans `preventDefault` | 1 |
| CE-9 | `close` toujours relayé | 1 |
| CE-10 | piste sans `aria-hidden` | 3 |
| CE-11 | focus non rendu | 3 |
| CE-12 | « / j » absent des lignes | 4 |

Non faite : « empiler depuis un effet » sous StrictMode (aucun chemin du hook n'empile depuis un
effet ; harnais dédié nécessaire) → Q-B.

**Commandes** : lint `Checked 282 files in 153ms. No fixes applied.` ; typecheck sans erreur ;
`Test Files 70 passed (70) · Tests 1176 passed (1176)` ; build `✓ built in 395ms`.

**Relecture à l'écran** (Chrome, vite 5201 ; captures `…\scratchpad\captures\r1-*.png`, script
`revision1.mjs`) : 7 et 12 joueurs → 5 / 5 / 3 / 5 + « Tout voir » ; Victoires à 12 : 7 ex aequo
à 2 → coupe à 5, tous dorés ; Finitions : 6 lignes (ex aequo rangs 5-6) ; modal portrait /
paysage, sombre / clair : centré, voile, tête visible, liste qui défile, dorure identique ; Échap
et retour navigateur ferment en restant sur `/statistiques`, focus rendu ; Q1 / Q2 vérifiés
(sombre / clair) ; en clair, barre du bas visible sous le voile, assombrie. T19 (vrai téléphone)
non vérifiable.

**Textes lecteurs d'écran** : « Tout voir, Moyenne 3 fléchettes » / « … First 9 » / « …
Meilleure volée » / « … Victoires » / « … Grosses volées » / « … Finitions »
(`aria-haspopup="dialog"`) ; dialogue nommé par son titre ; ✕ « Fermer » ; groupe « Classer les
grosses volées par » ; « 180 », « 140+ », « 100+ ».

**Questions** : Q-A titre tronqué à 360 px (utilisateur) ; Q-B contre-épreuve StrictMode
(technique) ; dette `DialogueNouveauJoueur` (T18 au rebase).

**Q-B close par l'Orchestrator (technique)** : non exigée. Le hook n'a aucun chemin d'empilement
depuis un effet (empilement dans `ouvrir`, appelé par un gestionnaire de clic) ; les deux tests
StrictMode prouvent qu'un rendu doublé n'empile ni ne referme ; une mutation « empiler depuis un
effet » ajouterait du code absent, pas casserait du code présent.
### Compléments pendant le Dev de la Révision 1 (Q-A, voile, espacement)

- **Q-A** : `TITRE_CARTE_MOYENNE.MOYENNE` = « Moyenne 3 fl. » (carte, tête du modal, « Tout voir,
  Moyenne 3 fl. ») ; First 9 / Meilleure volée inchangés. Noms accessibles = titre visible
  (un nom « Moyenne 3 fléchettes » ne contiendrait pas « fl. », WCAG 2.5.3). Mesuré dans Chrome :
  aucun titre tronqué ni débordant à 360 et 390 px.
- **Voile** (`Modale.tsx`) : `pointerdown` et `click` tous deux sur le voile (cible = `<dialog>`
  et point hors de son `getBoundingClientRect()`) → même chemin que ✕ ; bordure, contenu et
  glisser parti de la liste ne ferment pas ; `biome-ignore` justifié (`useKeyWithClickEvents` :
  Échap et ✕ au clavier).
- **Espacement** : prop `espacement` (`'carte' | 'liste'`) ; modal 14 px entre barres, 18 px entre
  joueurs de Grosses volées ; cartes inchangées (8 / 10 px).
- Tests : `modale.test.tsx` +3 (voile ferme une fois ; appui dans la boîte — contenu, contenu
  hors rectangle, bordure — reste ouvert ; glisser reste ouvert) ; `statistiquesPodium` +1
  (liste → ouvert ; voile → fermé sur `/statistiques` ; retour suivant quitte : un seul recul) ;
  titres remplacés (`statistiquesPodium`, `lot4`, `pictogrammesEmplacements`).
- Contre-épreuves : CE-13 cible non vérifiée → 1 échec (après ajout d'un cas « contenu hors
  rectangle ») ; CE-14 `pointerdown` non exigé → 1 ; CE-15 coordonnées désactivées → 1.
- Docs : charte (`Modale` : voile, espacements ; podium : titre abrégé), CONVENTIONS § 9.
- Commandes : lint `Checked 282 files … No fixes applied.` ; typecheck sans erreur ; **70
  fichiers, 1180 tests** ; build `✓ built in 372ms`.
- Écran (Chrome, 360 / 390 px, sombre) : liste → ouvert, voile → fermé sur `/statistiques` ;
  capture `…\scratchpad\captures\qa-390-modal.png`.
### Boucle 1, tour 3 (Test → Dev, Révision 1, 2026-10-15)

- **QO-1** : `aria-label` sur le `<h2>` (table `NOM_CARTE_MOYENNE`, `labels.ts`) ; région et dialogue
  nommés par `aria-labelledby` « Moyenne 3 fl., Moyenne 3 fléchettes » ; bouton « Tout voir,
  Moyenne 3 fl., Moyenne 3 fléchettes » ; autres titres : nom = titre visible. Props `nom` sur
  `CartePodium` et `Modale` ; `teteDe` renvoie `nom`.
- Tests : TM-1, TM-3, TM-4 (`modaleAuRetour.test.tsx`, 15 tests désormais — le « 11 » antérieur
  était faux) ; TM-2 (`modale.test.tsx`, `open:flex` permis) ; QO-1, TM-5, TM-6 (cinq joueurs à
  l'ordre 100+ inverse de la moyenne), TM-d (`statistiquesPodium.test.tsx`) ; noms mis à jour
  (`lot4`, `pictogrammesEmplacements`). Charte : nom « court puis complet » du titre de Moyenne.
- Contre-épreuves (Dev, script `…\scratchpad\contre-epreuves-tour3.ps1`) : CE-16 à CE-21 → 1 échec
  chacune ; CE-22 → 3.
- Commandes : lint `Checked 282 files … No fixes applied.` ; typecheck sans erreur ; **70
  fichiers, 1187 tests** ; build `✓ built in 393ms`. Pas de capture (nom accessible seulement).
### Boucle 5, tour 4 (Revue → Dev, 2026-10-15)

- **Constat 3** : fonction pure `defilementPourMontrer` (`podium.ts`) → `scrollLeft` minimal ou
  `null` (bord qui dépasse aligné ; onglet plus large que le ruban : début visible). Effet dans
  `OngletsJoueurs` (onglet actif, liste des joueurs) qui mesure l'onglet `aria-pressed` et règle le
  seul `scrollLeft` du ruban ; jamais `scrollIntoView` ; sans animation ; `biome-ignore` justifié.
- Tests : 4 purs (`podium.test.ts`) ; 2 écran (`statistiquesPodium.test.tsx`, mise en page simulée
  100 px / 300 px, espion `scrollLeft`) : ouverture J7 mémorisé → 400 ; J1 visible → rien ; appui
  J5 → 200.
- Contre-épreuves : écriture `scrollLeft` supprimée → 2 échecs ; aligner le début → 3 échecs.
- Écran (Chrome 390 × 844, 7 joueurs, dernier mémorisé) : `scrollLeft` 244, onglet visible,
  `scrollY` = `scrollX` = 0 ; appui Kevin → 0. Capture `…\scratchpad\captures\ruban-390-ouverture.png`.
- Constat 6 : note U4 de la charte étendue au titre de la `Modale`. Constat 7 : commentaire
  `CarteImpacts.tsx` corrigé.
- Commandes : lint `Checked 282 files … No fixes applied.` ; typecheck ; **70 fichiers, 1193
  tests** ; build `✓ built in 360ms`.
### Tour 5 (Revue → Dev, 2026-10-16)

- Constat 11 : test « au changement de période, même joueur actif mais liste réordonnée : le
  ruban recadre » (J7 premier sur « Tout », dernier sur « 7 jours » ; Tout → 7 jours (400) → Tout
  en cache (0) ; même ruban, J7 actif) ; mise en page simulée qui retient `scrollLeft` ;
  commentaire d'`OngletsJoueurs` (trois déclencheurs).
- Date de la politique : « Mise à jour le 16 octobre 2026 » (`labels.ts:274`,
  `confidentialite.test.tsx:85`).
- Constat 13 : CONVENTIONS § 14 (`apercuPodium`, `defilementPourMontrer`).
- Contre-épreuve `[actif, joueurs]` → `[actif]` : 1 échec (le nouveau test).
- Commandes : lint `Checked 282 files in 154ms. No fixes applied.` ; typecheck ; **70 fichiers,
  1194 tests** ; build `✓ built in 390ms`.