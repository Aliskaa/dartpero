# Faut-il revoir la charte graphique ?

> Étude, pas un lot. Rien n'est décidé ici : ce qui sera retenu passera par `/intake`, et c'est
> ce lot-là qui réécrira `docs/CHARTE_GRAPHIQUE.md` et `CLAUDE.md`.
> Sources, le 2026-10-13 : trois évaluations isolées en lecture seule — revue de design
> (méthode `impeccable critique`, écran X01 + charte), preuves déterministes (`impeccable detect`
> sur `src/ui`, contrastes WCAG calculés sur les tokens de `src/index.css`), regard « design
> engineering » (grille `emil-design-eng`) — sur **29 captures fraîches** prises dans Chrome
> (390 × 844 et 844 × 390, sombre et clair), base remplie **par l'interface** (3 joueurs, X01
> terminée et en cours, Cricket, Tour du monde, entraînement). `docs/captures/` est obsolète et
> n'a pas servi.

## Réponse courte

**Garder la charte, en corriger l'exécution, et la préciser sur trois points.** Les trois
évaluations convergent : la doctrine « structure, pas matière » (la fiche de ligue punaisée) est
la meilleure décision du projet — la feuille X01 se lit d'un coup d'œil à distance. Ce qui
freine n'est pas l'identité mais **l'écart entre la charte et son application** : un thème clair
qui ne tient pas son propre plancher, des micro-tailles sans échelle, un vocabulaire appliqué
rigoureusement au seul X01, et un mouvement plus « généreux » que la fiche ne le supporte.

## Contraintes d'usage et choix de style

Ce qu'une charte, quelle qu'elle soit, doit garder — et ce qui se rediscute sans risque.

| Contraintes d'usage (à garder) | Choix de style (rediscutables) |
| --- | --- |
| Lisibilité à 2-3 m : `craie-vive`, chiffres condensés `tabular-nums` | Angle vif partout (neutre pour l'usage, gratuit, identitaire) |
| Plancher de contraste du texte (`craie/60` en sombre) | Palette feutre / laiton / craie / chêne |
| Cibles ≥ 48 px, pavé au pouce, rangées utiles en bas | Alfa Slab (enseigne, vainqueur) |
| Zones lecture et saisie séparées, jamais empilées en paysage | Texture du tapis (`--tapis-image`) |
| Sombre par défaut (garage) | Ton « généreux » du mouvement, éclats, halos |
| S/D/T momentané et visible | Filets de 3 px, bandeau inversé |
| Retour d'appui très fort (pas d'haptique sur iOS) | « Laiton tamponné » de `laiton-poli` |
| Bust lisible sans mouvement ; `prefers-reduced-motion` | Accents de couleur par mode |

## Ce qui marche

- **La feuille X01** : colonnes fixes partagées (`LigneJoueur.tsx:53`), reste seul dans sa
  colonne, volée écrite sur trois emplacements, sortie en dernière ligne de feuille.
  Nielsen 2 (correspondance au monde réel) : 4/4.
- **Les gestes d'appui** : `.touche` s'inverse à l'appui (`index.css:466-471`) — seul retour sur
  iPhone, où `navigator.vibrate` n'existe pas ; `laiton-poli` descend de 4 px comme un tampon.
- **Le point de contrôle unique de l'angle vif** (`--radius-*: 0`) et son garde : exemplaire.
- **Le sombre est sain** : tout texte au-dessus de `craie/60` dépasse 4,5:1.
- **Le bust** : rouge, barré, « Bust », secousse, voix — lisible même sans animation.

## Ce qui freine — par nature

### 1. Le thème clair ne tient pas le plancher (défaut, quelle que soit la charte)

`index.css:168-169` affirme qu'« à 60 %, l'encre garde 5:1 sur le papier ». Calcul WCAG sur les
tokens réels : **3,53** sur `feutre`, **3,86** sur `ardoise`, **3,23** sur `feutre-nuit` (seuil
4,5). `text-craie/60` a 28 occurrences. Aussi en clair : `craie/70` = 4,10 sur `feutre-nuit`
(nom de partie, `DispositionPartie.tsx:60`), laiton texte = 2,82 sur `feutre-nuit` (onglet actif
de la barre du bas). Cause : le texte secondaire est écrit en **alpha**, et une encre
transparente sur papier perd plus qu'une craie transparente sur feutre.

### 2. Les joueurs inactifs passent sous le plancher (défaut)

`opacity-70` sur toute la ligne inactive (`LigneJoueur.tsx:124`, `LigneCible.tsx:56`,
`TableauCricket.tsx:127`) se multiplie avec les alphas du texte : nom inactif ≈ 3,1:1 en clair,
« moy » ≈ 2,6:1 sur 8,8 px. Surtout, **le reste du joueur suivant** est grisé — or c'est lui qui
lit son score depuis l'oche pendant que l'autre lance.

### 3. Pas d'échelle typographique (charte à préciser)

44 tailles arbitraires `text-[…]` dans 28 fichiers, dont **5 micro-tailles** de 0,5 à 0,7 rem,
souvent cumulées avec majuscules, interlettrage large et alpha (`.entete-colonne` cumule les
trois). Textes sous `craie/60` : `ResumeX01Ecran.tsx:135,149`, `StatistiquesEcran.tsx:64,70,87`,
`Cartouche.tsx:56,111`, `LigneCible.tsx:100`, résumés Cricket et Tour du monde.

### 4. Le vocabulaire n'est tenu qu'au X01 (le frein principal)

- **Conteneur** : `.feuille` au X01 et à l'entraînement ; Cricket et Tour du monde sans feuille,
  lignes flottantes, ~40 % de l'écran vide en portrait (captures Cricket).
- **Volée en cours** : écrite sur la ligne au X01, en cases pointillées ailleurs.
- **Pavé** : bulle « 25 » / « Bulle » / « BULLE » ; manqué « 0 » / « HORS » ; Annuler à trois
  places différentes — la mémoire musculaire change à chaque mode.
- **Noms tronqués** « KE… » / « JU… » au Cricket en portrait, avec deux joueurs.
- Le panneau du résumé s'appelle « La feuille » mais n'en est pas une ; `cadre-bois` est défini
  et jamais utilisé ; `StatistiquesEcran.tsx:64,70` refait un en-tête de colonne à la main.

### 5. Écarts à la doctrine « zéro dégradé, une fiche ne rayonne pas » (charte à trancher)

- Enseigne en dégradé clippé (`Logo.tsx:11`, signalée par le détecteur) ;
- halos `shadow-[0_0_…]` : `MomentCelebratif.tsx:62`, `TableauHonneur.tsx:81` (brun boueux en
  clair) ; balayage `animate-eclat` ;
- `--tapis-image` : deux `radial-gradient` + bruit, invisibles sur les captures, et
  `background-attachment: fixed` coûteux au défilement mobile (ignoré par iOS).

### 6. Le mouvement contredit l'esprit de la fiche (charte à préciser)

- La charte se dit « généreuse » et chiffre 360, 440, 900 ms. `pop-score` (à **chaque**
  fléchette, des centaines de fois par soirée) : 360 ms, `scale 1,14`, courbe à dépassement — un
  tampon ne rebondit pas.
- Aucun token de transition : 24 transitions à 100 / 150 / 200 / 300 ms, courbes par défaut.
- Appui **symétrique** de `.touche` (90 ms) et `laiton-poli` : sur un tap bref, l'inversion
  n'atteint jamais le plein. Appui à 0 ms, relâcher adouci serait plus juste.

### 7. Couleurs qui se télescopent (charte à trancher)

Les accents de mode sont « alignés sur la palette joueurs » (`index.css:131`) : le Lagon du Tour
du monde est la couleur d'un profil, le Brique est le rouge du bust (un bust ne se voit pas sur
le carré de Kevin). Liserés Tour du monde et entraînement sur ardoise ≈ 2,9:1 (seuil 3).

### 8. Mise en page de l'écran de match (défaut)

- **Paysage coupé** (844 × 390) : filet bas de la feuille et rail S/D/T rognés (~404 px de
  contenu pour 390) — le nom de partie garde sa propre ligne en paysage.
- **Place perdue** en portrait : ~100 px vides autour de la feuille X01 (`justify-center`,
  `DispositionPartie.tsx:73`) alors qu'à 3 joueurs le reste descend à 3,25 rem.
- **Multiplicateur armé** trop discret : exposant de 0,6 rem en laiton, touches inchangées en
  DOUBLE / TRIPLE — première source de faux score selon la charte elle-même.
- **Bâtons à zéro manche** lus « || » à 3 m (`Batons.tsx:45` : traits pleins, la charte dit
  pointillé).

## Constats hors charte (relevés en route)

Pas des questions de style, mais à ne pas perdre :

- ⚠️ **Volée partielle perdue au rechargement** : `dartsEnCours` est un `useState` dans les
  quatre hooks de mode (`useX01.ts:45`…). Une ou deux fléchettes saisies disparaissent sans
  message si Android tue la PWA ou si iOS la recharge. Correction = décision d'architecture
  (`persistence.md` interdit `localStorage` pour une donnée de partie ; un événement de journal
  touche une surface gravée) → **lot `high`**.
- ⚠️ **Double tap sur « Annuler T20 »** (`useX01.ts:143-147`) : retire la fléchette, puis la volée
  précédente d'un autre joueur — et peut « dé-gagner » une manche.
- Clignotement probable du pavé à chaque 3ᵉ fléchette (`desactive={match.occupe}` → opacité 0,3
  pendant l'écriture Dexie) ; `MomentCelebratif` inséré dans le flux décale le tableau lu à 3 m.

## Trois directions

| | **A. Garder et affiner** | **B. Une feuille pour les quatre modes** | **C. Tableau d'affichage** |
| --- | --- | --- | --- |
| Garde | Identité entière, échange de tokens, sombre par défaut | A, plus palette et typo | Colonnes, filets, angle vif, Oswald |
| Change | Texte secondaire en **tokens pleins** par thème (`craie-2`, `craie-3`) au lieu d'alphas ; **échelle typo** tokenisée, minimum 0,7 rem ; **tokens de mouvement** (≈ 100 / 180 / 240 ms, une courbe sans dépassement pour ce qui se répète) ; retrait du dégradé d'enseigne, des halos, des voiles du tapis, de `cadre-bois` ; pas d'`opacity` sur les lignes inactives ; paysage réparé | Composants communs `FeuilleDeMatch` + pavé unique (même Annuler, même « 25 » / « 0 », volée toujours écrite sur la ligne) ; accents de mode **désalignés** des couleurs de profil ; bust distingué par un motif, pas seulement le rouge | Zone de lecture à contraste maximal **identique dans les deux thèmes** ; seul le chrome suit clair / sombre ; clair repensé « plein jour » ; reste dimensionné sur la hauteur disponible |
| Gain | Le plancher tient en clair, le joueur suivant lit son score, micro-textes lisibles | Une seule mémoire musculaire, fin des noms tronqués et des écrans à moitié vides | Lecture maximale à 3 m quelle que soit la lumière |
| Risque | Faible | Refonte des écrans Cricket et Tour du monde ; régressions de layout invisibles en test | Rompt la décision gravée « même feuille, aucune classe ne connaît le thème » ; le côté pub s'atténue |
| Coût | `index.css` + ~28 fichiers pour les tailles ; gardes inchangés (+ garde possible contre `text-[0.5x-0.6x rem]` et les alphas sous 60 % sur du texte) | Composants communs + 4 écrans de jeu ; relecture écran obligatoire | Tokens + `DispositionPartie` + `LigneJoueur` ; `CLAUDE.md`, charte, probablement `themeBoundary` |
| Surface gravée ? | Non (précise la charte sans contredire « ce qui ne s'y discute pas ») | Non | **Oui** |

**Recommandation des trois évaluations : A**, puis B en second temps. C seulement si, en
conditions réelles, la lecture à 3 m reste insuffisante après A.

## Découpage en lots

Découpage **après** les choix validés ci-dessous (§ Validé par l'utilisateur). Chaque lot passe
par `/intake` puis `/orchestrate`, sur sa branche `lot/<id>`, un commit par lot. Les identifiants
sont des propositions. Niveau suggéré : `light`, sauf surface gravée (`.claude/README.md`).
Tous les lots d'écran exigent la relecture à l'écran (portrait / paysage, sombre / clair).

Ordre : un correctif rapide, puis les fondations communes, puis les écrans, du plus lu au moins
lu ; le lot `high` à part.

| # | Lot | Contenu | Dépend de | Niveau |
| --- | --- | --- | --- | --- |
| 1 | `annuler-double-tap` | Un double appui sur « Annuler » ne retire qu'une fléchette, jamais la volée d'un autre joueur ni une manche gagnée (`useX01.ts:143-147` et les autres hooks de mode). Correctif `fix`. | — | light |
| 2 | `charte-contraste` | Tokens de texte pleins par thème (`craie-2`, `craie-3`) au lieu d'alphas ; plancher tenu en clair ; plus d'`opacity` sur les lignes inactives ; commentaire de `index.css:168` corrigé. Charte § Palette et § Les trois planchers. | — | light |
| 3 | `charte-typo-mouvement` | Échelle typographique en tokens (minimum 0,7 rem) ; tokens de mouvement ; le tableau du mouvement validé (`pop-score` court sans rebond, `eclat` retiré, logo un seul tour, badge fixe…). Trancher au cadrage : halos, dégradé d'enseigne, texture du tapis. Charte § Typographie et § Mouvement. | 2 | light |
| 4 | `pictogrammes` | Composant commun des pictogrammes validés (4 modes, 8 moments) en `currentColor`, `aria-hidden` ; remplace les icônes génériques de l'étape 1 et la couronne. Charte § Identité. | 3 | light |
| 5 | `match-x01` | Écran de match X01 : paysage réparé, place rendue au reste, multiplicateur armé gradué (Double : filet ; Triple : filet + fond), bâtons en pointillé, `MomentCelebratif` hors du flux, plus de clignotement `occupe`, pictogramme au bandeau. | 3, 4 | light |
| 6 | `feuille-commune` | Cricket et Tour du monde sur la feuille du X01, pavé unifié, accents de mode désalignés des couleurs de profil. **Coupé en deux le 2026-10-14** (voir § Validé, « Lot 6 ») : 6a `feuille-commune` (la feuille), 6b `pave-unifie` (pavé et accents). | 5 | light (gros lot, relecture écran lourde) |
| 7 | `cartes-partie` | Mélange 1 + 2 : partie en cours en mini tableau, autres parties en lignes de feuille, grille 2 × 2 à 4 joueurs, unité dans la colonne du mode, badges de moments. Accueil et Parties. | 4, 6 | light |
| 8 | `statistiques-podium` | Cible en tête (dernier joueur consulté, mémorisé ; le sélecteur ne change que la cible), cartes du podium en barres, bâtons de craie, pictogrammes en tête de carte. **Fait le 2026-10-16**, élargi en cours de lot (N premiers et « Tout voir » en modale ; voir § Écran Statistiques). | 4 | **high** (politique publique) |
| 9 | `nouvelle-partie-parcours` | Barre d'étapes, tuiles 2 × 2, nom de partie à l'étape 2, fiche de réglages par jeu (X01 « Plus de réglages », Cricket en deux cartes, Tour du monde résumé, entraînement), ordre en feuille numérotée, bouton « Tirer au sort ». Les routes restent les mêmes. | 4 | light |
| 10 | `rejouer` | « Rejouer » en tête de l'étape 1 : 3 configurations distinctes les plus récentes, fusionnées avec leur nombre, profil supprimé écarté, ordre de la dernière fois. Lu depuis l'historique par les use cases. | 9 | light |
| 11 | `regles-du-jeu` | Livre ouvert en haut à droite (étape 2 et bandeau de match), feuille **par-dessus** l'écran, texte par jeu qui suit les réglages de la partie. Précise `CLAUDE.md` § Checkouts (180 en sortie libre). ✅ **Fait** (2026-10-16), passé en **`high`** à l'intake (domaine `checkout.ts`, règles gravées) ; rubriques repliables sur le plan de DartsOn, S1 à un reste de 1 corrigé, même mécanisme que la `Modale` des Statistiques. | 4, 9 | ~~light~~ high |
| 12 | `reglages-par-usage` | Page unique rangée par usage, thème en vignettes, deux voyants (dernière sauvegarde, application), date du dernier export gardée sur l'appareil, état de protection en une phrase. | 4 | light |
| 13 | `volee-partielle` | La volée en cours survit à un rechargement (journal ou brouillon). Hors charte, décision d'architecture. | — | **high** (format persisté) |

Notes :

- Le lot 1 peut partir tout de suite : il ne dépend d'aucun choix de style.
- Le lot 13 n'a pas de rang imposé ; tant qu'il n'est pas fait, le lot 11 protège déjà la volée
  en ouvrant les règles par-dessus.
- ~~Après le lot 13, l'anomalie de suggestion à un reste de 1 en sortie libre (§ Les règles de
  chaque jeu) est à vérifier à l'écran, puis à corriger si elle se confirme.~~ **Corrigée au lot
  11** (choix de l'utilisateur à l'intake) : S1 proposé à un reste de 1 en sortie libre.

**Plus tard, hors de ce découpage** : la plage réglable de l'entraînement (décidée « un jour ») ;
les **nouveaux jeux** de DartsOn (11 jeux : variantes, jeux à plusieurs, entraînements solo),
mis en attente par l'utilisateur le 2026-10-13. Ils demanderont une étude à part, un lot par jeu
(`high`), la levée de « Killer et Shanghai hors périmètre v1 » dans `CLAUDE.md`, et un choix de
jeux par familles à l'étape 1.

## Validé par l'utilisateur (2026-10-13)

Choix faits sur maquettes, pas encore des décisions gravées : chacun passera par `/intake`, et
c'est le lot qui mettra à jour la charte et `CLAUDE.md`.

Visuels de référence (privés) : écrans de jeu
<https://claude.ai/artifact/12w6D81HCF2AM834RX6zSi>, statistiques
<https://claude.ai/artifact/UcmyFeC4SdDRnrFASvuGEP>.

### Écrans de jeu — direction B

A (affiner) appliqué au X01, puis Cricket et Tour du monde ramenés sur la même feuille.

**Multiplicateur armé** : le Triple ne reçoit **pas** le même traitement que le Double. Le signal
gradue avec le multiplicateur, et il passe par la forme, pas seulement par la couleur.

| Armé | Touches du pavé | Coin de la touche (existant) |
| --- | --- | --- |
| Simple | Normales | Rien |
| Double | Filet laiton 2 px | Valeur réelle (40) |
| Triple | Filet laiton **et** fond teinté laiton | Valeur réelle (60) |

La bulle reste barrée en Triple (pas de triple bull).

**Mouvement** : un mouvement ne se garde que s'il annonce quelque chose à 2-3 m.

| Moment | Aujourd'hui | Retenu |
| --- | --- | --- |
| Le reste change | `pop-score` 360 ms, zoom 114 % avec rebond | ≈ 200 ms, sans rebond |
| Changement de joueur | Opacité des lignes, 300 ms | Le repère laiton **glisse** vers le joueur suivant |
| Retour à Simple | Curseur qui glisse, 200 ms | Curseur gardé, filet Double / Triple qui s'efface en fondu |
| Bust | `secousse` 440 ms | Plus courte et plus sèche ; le mot BUST reste écrit |
| Sortie / victoire | `eclat` (dégradé, contraire à la charte) | Retiré ; un filet vert se trace autour de la ligne gagnante |
| Logo de l'Accueil | `tourner-lent` en continu | Un seul tour à l'ouverture |
| Badge Tour du monde | `respirer` en continu | Fixe |
| Appui sur une touche | Enfoncement 100 ms | Inchangé |

`prefers-reduced-motion` reste respecté (`index.css:527`).

### Écran Statistiques — podium, cible en tête

L'utilisateur trouve les tableaux actuels trop stricts. Retenu : la piste « podium » des
maquettes, avec la cible de la piste « fiche de joueur » en ouverture. **La carte des impacts
reste**, c'est une exigence.

1. Période (inchangée).
2. Sélecteur de joueurs, puis **la cible du joueur choisi en grand** (`CarteImpacts`, échelle
   propre au joueur), et dessous ses trois zones favorites et ses fléchettes hors cible.
3. Cartes du podium, une par thème : le premier en grand avec son chiffre, tous les joueurs en
   **barres** proportionnelles.
   - Moyenne 3 fléchettes, avec bascule Moyenne / First 9.
   - Victoires (parties), manches en ligne de détail.
   - Grosses volées (180, 140+, 100+) en **bâtons de craie** groupés par cinq.
   - Finitions : % doubles, avec bascule Plus haut / Meilleure manche (le seul classement où
     petit vaut mieux).

Aucune nouvelle statistique : tout vient déjà de `PlayerCareer`. Écartés : la fiche joueur
complète et la cible partagée à points colorés (position des points dans une case non
mesurée).

Tranché ensuite par l'utilisateur :

- **À l'ouverture, la cible montre le dernier joueur consulté**, mémorisé sur l'appareil
  (`usePreference`, comme le thème). Repli sur le premier de la moyenne si ce joueur n'a aucune
  fléchette sur la période choisie, ou si son profil a été supprimé.
- **Le sélecteur ne change que la cible.** Les cartes du podium restent identiques quel que soit
  le joueur choisi.

**Livré au lot 8 (`statistiques-podium`, 2026-10-16)**, avec des choix pris en cours de lot qui
remplacent le détail ci-dessus là où il diffère (`docs/lots/statistiques-podium/`) : Moyenne à
trois bascules (Moyenne · First 9 · Meilleure volée) ; Victoires en « victoires / parties » sur
chaque ligne, **manches retirées** de l'écran ; Grosses volées classées par seuil ; Finitions à
trois bascules, sans ligne de bas ; les N premiers par carte (5 / 5 / 3 / 5) puis « Tout voir »
dans une modale refermée par le retour du téléphone.

### Cartes de partie (`CartePartie`) — mélange 1 + 2 retenu

**Validé** : la partie en cours (épinglée en tête de l'Accueil) en **mini tableau**, une ligne
par joueur avec la jauge de son mode, puis « Reprendre » ; toutes les autres parties, à l'Accueil
comme dans Parties, en **lignes de feuille**. Le détail des pistes suit.

**À 4 joueurs** (le plafond, `MAX_JOUEURS` dans `useNouvellePartie.ts`), **validé** sur
maquette :

- Mini tableau : les 4 lignes restent (on reprend en connaissant le reste de chacun), un peu
  resserrées.
- Ligne de feuille : joueurs en **grille 2 × 2, classés par résultat** (premier en haut à gauche,
  en laiton). La ligne a toujours au plus deux rangées alignées, au lieu d'un retour à la ligne
  au hasard.
- L'**unité** (« pts », « fl. », « reste ») monte dans la colonne du mode, sous son code ; les
  scores ne la répètent plus. Au Tour du monde, un joueur qui n'a pas bouclé garde « 19/21 ».
- Écarté : « gagnant +3 » (perd les scores) et des avatars de moins de 22 px.

Visuels : <https://claude.ai/artifact/DmZstoMHekLChPqW8X5wm3>. Défaut relevé : toutes les cartes
d'une soirée portent le même nom par défaut (« Mardi soir »), qui répète l'en-tête de groupe, et le
résultat est petit et en bas.

- **Écartée par l'utilisateur** : piste 3, « le résultat d'abord » (gagnant en titre, mode en
  tampon).
- **Hésitation** entre la piste 1, « ligne de feuille » (une feuille par période, une ligne par
  partie, mode en colonne, score de chaque joueur), et la piste 2, « mini tableau » (une carte par
  partie, une jauge par mode).
- **Proposé pour départager** : la partie en cours en mini tableau, toutes les autres en lignes de
  feuille.
- **Commun aux pistes restantes** : titre seulement pour un nom tapé ; scores de chaque joueur
  tirés de `MatchSummary` (`remaining`, `closedTargets` / `score`, `targetIndex` /
  `finishedInDarts`, `roundsWon`), sans toucher au cœur.

**Cadrage du lot 7 `cartes-partie` (2026-10-15)** — planche à jour validée :
<https://claude.ai/artifact/XH8i1UvuqNNSgC4cexEGMd>. Choix de l'utilisateur :
- badges de moments **reportés** (pas de maquette, `MatchSummary` à étendre) ;
- joueurs en **classement complet**, calculé hors de l'UI selon `CLAUDE.md` (cut-throat : le plus
  petit score devant) ;
- colonne du mode en **pictogramme + détail + unité** (au lieu du code texte) ;
- laiton unique (lot 6b) ; en-tête de groupe au jour seul ; X01 à sets en carrés de manches et
  traits de sets ; entraînement abandonné en « 4/7 » + « Abandonnée » ; texte de statut retiré de
  l'écran, phrase complète gardée pour les lecteurs d'écran.

### Pictogrammes — validés

Validés tels que dessinés sur la planche (« j'aime beaucoup ») ; trait et proportions
s'ajusteront pendant le lot, sur un vrai téléphone.

L'utilisateur trouve l'app pauvre en icônes. Constat : une vingtaine d'icônes `lucide-react`,
toutes d'**action** (navigation, retour, annuler, corbeille, couronne) ; aucune ne dit ce qu'on
regarde, et le mode n'a de forme qu'à l'étape 1 de Nouvelle partie (icônes génériques).

Proposé, sur planche (<https://claude.ai/artifact/CgN3pTwCt6GddUWETHde2S>) : des **pictogrammes
maison** en SVG, trait de 2 px, angles vifs, `currentColor` (donc thème clair sans exception de
couleur), toujours `aria-hidden`, dans `composants/commun/` ; `lucide` reste pour les actions.

- **Modes** : X01 (cible, triple 20 allumé), Cricket (la marque à la craie Ⓧ qui ferme une
  cible), Tour du monde (flèche qui fait le tour, bulle au centre), Entraînement (double de
  sortie allumé). Colonne de mode des lignes de feuille, étape 1, bandeau de match, filtres de
  Parties. Le mode se reconnaît à sa forme, plus seulement à sa couleur.
- **Moments et statistiques** : 180, bust, sortie, victoire, moyenne, grosses volées, meilleure
  manche, match nul. Têtes des cartes du podium, badges sur les lignes de feuille et le résumé.
- **Écran vide** : une cible et une fléchette à la place du texte seul.
- Règle : un pictogramme dit quelque chose ; jamais devant un libellé ou dans un bouton déjà
  clairs ; 20 px au minimum.

### Nouvelle partie — « Rejouer d'abord »

Visuels : <https://claude.ai/artifact/7sCiB2f4JSbVKUCdpjZH16>. **Retenu** par l'utilisateur : la
piste « Rejouer d'abord ». L'étape 1 s'ouvre sur les dernières configurations jouées ; ▶ mène à
l'ordre de jeu avec les mêmes joueurs et réglages, puis « Commencer » (deux touches). Les quatre
jeux restent dessous en rangée compacte, avec les pictogrammes.

Pour le cas de plusieurs parties différentes (**validé**) :

- **Configuration** = le mode, ses réglages et le même **ensemble** de joueurs ; l'ordre et le
  nom n'en font pas partie.
- Les parties identiques sont **fusionnées** en une ligne qui dit combien de fois elle a été
  jouée.
- On montre les **3 configurations distinctes les plus récentes**, la dernière en tête.
- Une configuration dont un profil a été supprimé est écartée.
- Source : l'historique déjà lu par l'Accueil (UI → use cases), rien de stocké en plus.

**Validé aussi** : à la reprise, l'ordre de jeu proposé est **celui de la dernière fois**, avec
« Tirer au sort » pour en changer ; le reste du parcours suit la piste « Trois étapes, au propre »
(barre d'étapes, tuiles 2 × 2, nom de partie à l'étape 2, ordre en feuille numérotée, bouton
« Tirer au sort » au lieu de l'interrupteur). Écartée : « Joueurs et ordre
ensemble », qui touchait la décision gravée des trois étapes.

### Nouvelle partie — réglages de chaque jeu (étape 2), proposés

Visuels : <https://claude.ai/artifact/SA1SE4NJMvh7o4y6pPg9wW>. Aucune option ni règle nouvelle : seule la
présentation change (`ReglagesJeu.tsx`).

- **Principe commun** : une « fiche de réglages » avec en tête le pictogramme du jeu et le
  **récapitulatif en grand**, mis à jour à chaque appui (aujourd'hui en petit au-dessus du
  bouton) ; les réglages en choix segmentés, leur effet en une ligne dessous ; les règles en une
  ligne, « Les règles en entier » déplie le paragraphe actuel.
- **X01** (validé) : score de départ et manches en évidence ; **sortie, entrée et sets** sous
  « Plus de réglages », replié. Sortie et entrée y deviennent « Libre | Sur un double » au lieu
  d'interrupteurs. Le récapitulatif en tête affiche **toujours** sortie, entrée et sets : un
  réglage replié (et mémorisé d'une partie à l'autre) ne peut pas passer inaperçu.
- **Cricket** (validé) : « Comptage » devient deux cartes, Standard (« les points sont pour soi ;
  tout fermer, sans être derrière ») et Cut-throat (« les points vont aux adversaires ; tout
  fermer, le plus petit score »). Les sept cibles passent dans « Les règles en entier » ; le
  récapitulatif « 7 cibles · 20 à 15 et la bulle » suffit à l'écran.
- **Tour du monde** (validé) : rien à régler ; la fiche se réduit au récapitulatif (« 20 → 1,
  puis la bulle ») et à la ligne de règles. Le parcours en 21 cases passe dans « Les règles en
  entier ».
- **Entraînement** : nombre de sorties 5 / 10 / 20 ; la plage 41 à 170 affichée en barre, « non
  réglable » ; barre d'étapes à deux étapes (pas d'ordre en solo). **Décidé** : la plage
  reste fixe pour l'instant ; l'utilisateur veut **pouvoir la régler un jour**. La fiche doit donc
  prévoir la place d'un futur réglage « Plage des restes » (aujourd'hui affiché « non
  réglable »). Ce sera un lot à part, plus léger que prévu : le domaine sait déjà le
  faire (`CheckoutPracticeConfig.create` accepte `minTarget` / `maxTarget`, validés, et la config
  est écrite dans le journal). Il manque surtout l'écran et la mémorisation du choix ; à vérifier
  au cadrage : `backupSchema` et les bornes acceptables (le domaine n'impose que `2 ≤ min ≤ max`).

### Les règles de chaque jeu — validé (« j'adore »)

Idée de l'utilisateur : une **icône livre ouvert en haut à droite** de la barre de titre pour
afficher les règles. Elle remplace le lien « Les règles en entier » ; la ligne de résumé reste
dans la fiche.

- **Source** : les règles telles que l'app les applique, c'est-à-dire `CLAUDE.md` § Règles du jeu
  (X01, Cricket, Tour du monde) et le glossaire. Pas de règles « officielles » rédigées de
  mémoire : le Tour du monde est le jeu du groupe de l'utilisateur, et la sortie libre est un
  choix de la maison. Le texte vit dans `labels.ts`, comme les paragraphes actuels.
- **Plan par jeu** : en bref (trois lignes) ; comment on marque ; comment on gagne ; les cas
  particuliers (bust, bogey numbers, cut-throat, tour de table, égalité) ; **les réglages de
  cette partie** (sortie libre, premier à 2 manches…).
- **Où** : étape 2 de Nouvelle partie, et aussi le bandeau de l'écran de match.
  ⚠️ Sur l'écran de match, les règles s'ouvrent **par-dessus** (feuille ou dialogue), jamais en
  changeant de route : la volée partielle vit dans un `useState` du hook de mode et serait perdue
  (constat hors charte ci-dessus).
- Icône `lucide-react` (`BookOpen`) : c'est une action, comme retour ou annuler.
- Maquette X01 : <https://claude.ai/artifact/EJfhq2GeRgk2zkziXCRM2N>.
- ⚠️ **Le texte dépend des réglages de la partie.** Vérifié dans `checkout.ts:84` : en sortie
  libre, la suggestion de sortie va jusqu'à **180**, pas 170 ; la limite de 170 et les bogey
  numbers ne valent qu'en sortie sur un double. `CLAUDE.md` § Checkouts (« dès que le reste est
  ≤ 170 ») ne décrit que le cas double out : à préciser par le lot qui écrira les règles.
  → **Fait au lot 11** : `CLAUDE.md` § Checkouts décrit les deux sorties (170 et bogey numbers ;
  180 et 179, 178, 176, 175, 173, 172, 169, 166, 163), « Pas de finish » suit la sortie.
- ~~Observation non vérifiée à l'écran : `suggestCheckout` renvoie `null` dès que le reste est
  inférieur à 2, y compris en sortie libre où un reste de 1 se finit d'un simple 1.~~ Confirmée
  et **corrigée au lot 11** (S1).
- Planche validée au lot 11 : `regles-rubriques.html` (<https://claude.ai/artifact/86bxSsA98uZQpkp6GWZ7pb>),
  rubriques repliables sur le plan de DartsOn. Les changements de règles « façon DartsOn »
  retenus par l'utilisateur à l'intake (sens du Tour du monde, tour de table en option, plages
  et sortie de l'entraînement, master in / out, départ libre, limite de tours, handicaps, manches
  et variantes au Cricket) attendent **une étude à part**, puis un lot `high` chacun.

#### Référence externe proposée par l'utilisateur : DartsOn

<https://dartson.app/rules/> (consulté le 2026-10-13 : pages X01, Cricket, Cut Throat Cricket,
Round the World, Checkout Trainer). Sert de **référence de comparaison et de plan**, pas de texte
à recopier (droit d'auteur) : le texte de Dartpéro reste écrit par nous, depuis `CLAUDE.md`, et
**le code fait foi** en cas d'écart.

| Jeu | Accord avec Dartpéro | Écart |
| --- | --- | --- |
| X01 | Bust (sous zéro ; à 1 ou zéro sans double en double out), max 170 en double out et 180 en sortie libre (comme `checkout.ts`), double in, 3 fléchettes, bulle 25 / 50 | DartsOn ajoute *master in / master out*, limite de tours, handicaps ; ne dit pas qui commence chaque manche (Dartpéro : alterne) |
| Cricket | 7 cibles, marques (bulle 1, centre 2), surplus seulement si une cible reste ouverte chez un adversaire, victoire à égalité de points | — |
| Cut-throat | Points à **chaque adversaire qui n'a pas fermé** la cible (comme `cricket/rules.ts:181`), victoire au plus petit score, égalité suffit | — |
| Tour du monde | Toute zone du secteur fait avancer d'une cible, bulle 25 ou 50 en dernier | DartsOn « Round the World » : **1 → 20** par défaut, tour de table **non** terminé par défaut. Dartpéro : **20 → 1** et l'on finit le tour de table (jeu du groupe, gravé) |
| Entraînement | Restes tirés dans une plage, bogey numbers exclus en double out | DartsOn : on recommence le même reste après un bust, plusieurs tentatives ; Dartpéro : **une volée par reste**. Plages prédéfinies (2-40, 41-100, 101-170) : bonne piste pour la future plage réglable |

Plan de page à retenir : bases, marquer, gagner, réglages et variantes, questions fréquentes —
proche de celui de la maquette.

### Réglages — une page rangée par usage, l'état en tête

**Retenu** par l'utilisateur : la piste « une page, rangée par usage » (affichage d'abord, thème
en trois vignettes, voix, sauvegarde resserrée, joueurs et À propos en lignes), avec les
**voyants d'état** de la piste « l'état d'abord ». Aucune route nouvelle.

**Deux voyants, validés** (Dernière sauvegarde, Application). Le voyant « Données protégées »
gênait l'utilisateur en tant que voyant, pas l'information elle-même :

- **Données** : n'est plus un voyant. En vert à côté d'une sauvegarde ancienne, il rassure à
  tort. L'état reste lisible dans Réglages → Sauvegarde (décision gravée), en une phrase sous
  Exporter / Restaurer (`PersistentStorage`).
- **Dernière sauvegarde** : « il y a 12 jours », en laiton au-delà de 30 jours, « jamais » sinon,
  avec « Exporter ». **Nouveau** : la date du dernier export n'est stockée nulle part ; elle le
  serait sur l'appareil, comme une préférence. Heure lue par `services.clock`.
- **Application** : installée, ou « Installer » — existe (`AppInstallation`).
- Sous les voyants : « 48 parties · 4 joueurs sur ce téléphone », et le rappel que « protégées »
  n'est pas une sauvegarde (obligatoire dans les trois états, décision gravée).
- Écartés : « Hors ligne prêt » (toujours vrai après la première ouverture, un port de plus),
  voix disponible, écran maintenu allumé.

### Lot 6 — découpage et pavé (2026-10-14, cadrage de `feuille-commune`)

Tranché par l'utilisateur :

- **Maquettes d'abord** : le Tour du monde sur la feuille, le pavé unifié et les accents n'avaient
  jamais été dessinés ; la demande s'écrit d'après la planche retenue.
- **Deux lots** : 6a `feuille-commune` (Cricket et Tour du monde sur la feuille du X01, avec les
  acquis du lot 5 : repère qui glisse, bandeau, moment superposé), puis 6b `pave-unifie` (pavé
  commun aux quatre jeux, accents désalignés des couleurs de profil).
- **Pavé unifié : « Bulle » et « Hors » partout**, X01 compris (le X01 perd « 25 » / « 0 » sur
  ses touches). Contraire à la proposition de l'étude (« 25 » / « 0 ») : choix de l'utilisateur.
- **L'inversion à l'appui inopérante** (relevée au lot 5 : `text-craie-vive`, couche
  `utilities`, bat `.touche:active`, chiffre ≈ 1,2:1 tant que la touche est enfoncée,
  préexistant) **se corrige avec le pavé**, au lot 6b.

Planche du lot 6a (privée) : <https://claude.ai/artifact/2vma9boCLRDEjzdJMNu4fZ>. Sa section
« À trancher », tranchée par l'utilisateur (demande `docs/request/feuille-commune.md`) :

- **Couleur du joueur : le carré de 12 px du X01**, pas le liseré de la maquette Cricket validée
  (écart volontaire, cohérence des trois jeux).
- **Volée du Cricket sur une dernière ligne « VOLÉE · NOM »** de la feuille, à la place des
  encoches au-dessus du pavé.
- **Moment célébré sur une seule rangée de 44 px**, X01 compris, pour ne plus masquer la ligne du
  joueur qui lance.
- Le reste comme proposé : Tour du monde en JOUEUR · PARCOURS (« N fléchettes ») · CIBLE géante
  à droite (4,5 / 4,05 / 3,25 rem), bulle en glyphe + « BULLE », fléchettes perdues non grisées ;
  bandeau Cricket « Ferme + mène » / « Le plus bas gagne » sans cadre ; Tour du monde « Dernier
  tour » seulement.

Reporté au lot 6b par l'utilisateur (fin du lot 6a) : au Tour du monde, les cases de volée
écrivent « S2 » quand la planche montrait « 2 » — le multiplicateur n'y compte pas, le « S » est à
retirer avec les libellés du pavé unifié.

Planche du lot 6b (privée) : <https://claude.ai/artifact/PcAQwsEnY122TUjp9GCqgu>. Tranché par
l'utilisateur (cadrage de `pave-unifie`, 2026-10-14) :

- **Placement b, celui de la maquette X01 validée** : Bulle · Hors · Annuler en fin de grille,
  rail Simple / Double / Triple en pleine largeur dessous. Au Tour du monde (sans rail), la même
  rangée est la dernière : Annuler y est 64 px plus bas — accepté.
- **Accents : piste A, laiton unique** pour les quatre jeux ; le jeu se dit par son pictogramme et
  son titre. La recherche d'une teinte par jeu loin des 8 profils n'a trouvé qu'une pervenche
  (ΔE 13 du Lagon) et un anis faible.
- **Cricket comme la planche** : six cibles en 3 × 2 dans l'ordre de la feuille, Bulle et Hors
  sortis de la grille comme ailleurs, 20 px, multiplicateur gradué du X01 (exposant « ×2 » /
  « ×3 » des marques, en laiton). Écart volontaire avec la maquette Cricket B (4 colonnes, 24 px).
- Le reste comme proposé : pavé calé en bas en paysage ; Bulle 2 colonnes, Hors 1, Annuler 2 ;
  ordre Bulle · Hors · Annuler ; « 25 » en craie-3 sur la Bulle en Simple ; Bulle grisée (pas
  barrée) en Triple ; un manqué reste « 0 » sur la feuille ; « Annuler 16 » au Tour du monde.

## Questions pour l'utilisateur

1. ~~Direction A seule, A puis B, ou envisager C ?~~ **B** (voir § Validé).
2. Halos et éclats : l'éclat (`eclat`) est **retiré** (tableau du mouvement validé). Reste à
   trancher au lot 3 : les halos, partout ou au seul résumé de fin de partie ?
3. Le dégradé de l'enseigne et la texture du tapis : on les garde (exception écrite) ou on les
   retire ?
4. La perte de la volée partielle : la corriger (lot 13, `high`) ou l'assumer par écrit ?

## Angles morts

Non vérifié : le rendu animé réel (oscillation de `pop-score`, désynchronisation S/D/T,
clignotement `occupe`, saut de `MomentCelebratif`), la sensation au toucher sur Chrome Android et
Safari iOS, la lisibilité réelle à 2-3 m sous faible lumière, et si la coupure du paysage se
rattrape par un défilement. Quelques contrastes (nom inactif, « moy ») sont estimés par mélange
d'alpha, pas mesurés à l'écran.
