# Lot `reglages-par-usage` — architecture

> Rapport retenu : `archi-authority` (opus / max), 2026-10-16. Recopié depuis le rapport `PASS`,
> sans fusion d'extraits. Scout et designer sautés (surface gravée annoncée par l'intake).

Architecture result: PASS

**Lu** : `.ai/architecture-context.md` (index), puis aux sources : `CLAUDE.md` § Décisions
structurantes (politique l. 54-57, thème l. 104-108, stockage l. 122-126, installation l. 127-132) ;
`rules/` (frontend-react, theme-colors, persistence, testing, typescript) ; CONVENTIONS § 4-11, 14 ;
charte (§ Planchers, Deux thèmes, Palette l. 33-217 ; Typographie et Composants l. 214-388 ; Ne pas
faire l. 646-660) ; `docs/DEPLOIEMENT.md` l. 93-128, 184-218 ; l'étude (§ Découpage, § Réglages) ;
`request.md`, `00-orchestration.md` ; **la planche entière**
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\derniers\derniers.html` (CSS l. 11-131,
`vignettes` l. 383, `#rg4` l. 396-411) et son `LISEZMOI.md` ; le précédent
`docs/lots/statistiques-podium/01-architecture.md` ; le code et les tests du brief, plus les ports
`MatchRepository`, `PlayerRepository`, `Preferences`, `ManageBackup`, `GetMatchHistory`,
`GetOngoingMatch`, les adapters mémoire / Dexie / `LocalStoragePreferences`, `AccueilEcran`,
`HistoriqueEcran`, `EtapeOrdre`, `jourCalendaire.ts`, `clesRequetes.ts`, `Button`, `EnTeteEcran`,
`ChoixSegmente`, `Phrase`, `CartePodium`, les fakes, les neuf gardes d'architecture.
**Non lu / non lancé** : l'artifact claude.ai (la demande désigne le fichier local), `verif-rg4.png`
(périmée), aucun test lancé (lecture seule).

## Problème

Réglages empile cinq panneaux (`ReglagesEcran.tsx:302-463`) ; il faut une page unique dans l'ordre
de la planche `#rg4`, deux voyants en tête. Quatre points techniques : (1) les **vignettes** doivent
montrer le rendu de leur thème quel que soit le thème courant, alors que tout le thème repose sur
des valeurs de jetons redéfinies sous `html[data-theme="clair"]` (`index.css:180-245`) — une
vignette « Clair » peinte en `bg-feutre` serait sombre sous le sombre ; (2) la **date du dernier
export** n'existe nulle part : l'écrire au seul export réussi, la lire par `services.clock`, en
faire une durée (jours / mois, seuils 30 / 59 / 60) ; (3) le **compte** « N parties · M joueurs » :
aucun port ne le donne (`GetOngoingMatch` lit 20 parties, `GetOngoingMatchUseCase.ts:9,18` ;
`GetMatchHistory` projette chaque journal) ; (4) les **surfaces gravées** : politique publique (une
donnée stockée de plus, texte et date), décisions « stockage persistant » et « installation » à
reformuler. Ni cœur, ni `GameMode`, ni format persisté, ni Dexie, ni service worker.

## Options considérées

**Vignettes**

| Option | Pour | Contre | Décision |
|---|---|---|---|
| A. Thème local sur la vignette (`[data-apercu="clair"]` ajouté au bloc clair + bloc `[data-apercu="sombre"]`) | Vraies classes de rôle ; le clair suit la palette sans copie | Le sombre doit quand même être recopié (ses valeurs ne vivent qu'au `:root`, écrasé par `html[data-theme="clair"]`) ; touche le sélecteur d'une décision gravée et casse `themeBoundary.test.ts:193` (qui cherche `'html[data-theme="clair"] {'`) ; un bloc sombre partiel piège le jeton suivant | Écartée |
| **B. Six jetons d'aperçu constants**, réservés à la vignette, redéfinis à l'identique sous le clair, + garde d'égalité | Mécanisme du thème intact ; ajout pur ; précédent des jetons réservés de la feuille ; garde qui rend la copie sûre | Six valeurs recopiées ; une famille qui ne suit pas le thème, à documenter | **Retenue** |
| C. Couleurs en dur (exception de garde, comme `theme.ts`) | Le plus court | Interdit par la demande et la charte (§ Ne pas faire, 2) | Écartée |
| D. Palette brute + jetons de rôle par référence | Une seule source | Refonte de `index.css` pour une vignette | Écartée |

**Compte**

| Option | Pour | Contre | Décision |
|---|---|---|---|
| A. `getMatchHistory.execute(∞).length` + `useJoueurs()` | Aucun port | Projette chaque journal pour compter ; deux sources | Écartée |
| **B. Port driving `GetDeviceContents`**, use case qui compte les `listAll()` des deux dépôts | Petit, testable en mémoire, aucun adapter touché ; une source pour la ligne et « Gérer les joueurs » | Lit toute la base à l'ouverture (Statistiques le fait déjà) | **Retenue** |
| C. B + `count()` dans les dépôts | Lecture la plus sobre | Ports driven, Dexie, mémoire, tests : hors zones ; gain invisible | Repli si lenteur mesurée |
| D. Greffer sur `GetOngoingMatch` / `ManagePlayers` | — | Mélange de responsabilités (ISP) | Écartée |

**Date du dernier export**

| Option | Pour | Contre | Décision |
|---|---|---|---|
| **A. Préférence d'appareil** par `usePreference` (port `Preferences`, `Services.devices`), écrite par l'écran après le téléchargement | Conforme à la demande ; « réussi » inclut l'étape DOM que seul l'écran voit ; précédent `statistiques:joueur` | Valeur relue non typée : à valider | **Retenue** |
| B. Port driven écrit par `ManageBackup.exportAll()` | Logique dans le cœur | Export hors périmètre ; le cœur daterait un export raté | Écartée |

**Composants** : **dans `commun/`** (`Voyant`, `VignetteTheme`, `ListeReglages` / `LigneReglage`) —
charte § Ne pas faire, 5 ; garde des jetons d'aperçu sur un fichier dédié ; la demande les nomme
pour la charte. Local à l'écran écarté (jetons réservés permis dans tout l'écran).

**Durée** : fonctions pures dans `src/ui/` (précédents `podium.ts`, `jourCalendaire.ts`), français
dans `labels.ts`.

## Approche retenue

### 1. Vignettes : jetons d'aperçu (`src/index.css`)

Dans `@theme`, six jetons commentés (rôle, réservation) :

| Jeton | Valeur | Copie de |
|---|---|---|
| `--color-apercu-sombre-fond` | `#0e1a13` | `feutre` sombre |
| `--color-apercu-sombre-encre` | `#f2e8d5` | `craie` sombre |
| `--color-apercu-sombre-accent` | `#c9a227` | `laiton` sombre |
| `--color-apercu-clair-fond` | `#e3d9c1` | `feutre` clair |
| `--color-apercu-clair-encre` | `#1f2d24` | `craie` clair |
| `--color-apercu-clair-accent` | `#8a6d12` | `laiton` clair |

(Exactement les couleurs de la planche, l. 383, qui sont celles des jetons.) Les mêmes six lignes,
**mêmes valeurs**, sous `html[data-theme="clair"]`, commentaire « identiques à dessein » : la garde
« le clair redéfinit tous les jetons » (`themeBoundary.test.ts:180-197`) reste vraie, charte § Ne
pas faire, 10 tenue.

`src/ui/composants/commun/VignetteTheme.tsx`, **seul consommateur** : trois `<button aria-pressed>`
dans un groupe nommé, ordre de `THEMES` ; aperçu `aria-hidden` de 54 px + libellé `LIBELLE_THEME`.
Aperçu Sombre / Clair : fond, barre encre 70 %, barre accent 40 %, barre encre 55 % en `bg-…/60`
(alpha permis sur un fond). Système : fond sombre, bloc clair de 40 px à droite, deux barres sombres
40 % / 25 % — bloc structurel, **ni dégradé ni ombre `0_0`** (garde `typographieBoundary`). Clic :
`setTheme` puis `appliquerTheme` (`ReglagesEcran.tsx:376-381`).

Gardes ajoutées (`themeBoundary.test.ts`) : (1) utilitaires `apercu-*` seulement dans
`VignetteTheme.tsx`, avec témoin ; (2) chaque jeton d'aperçu égal au jeton qu'il montre, et même
valeur dans les deux blocs.

Charte : § Palette (table « Aperçus de thème », constants, réservés) ; § Les deux thèmes (l. 70-72)
« aucune classe de `src/ui` ne connaît le thème, sauf les aperçus constants de la vignette » ;
`rules/theme-colors.md` § Jetons réservés (seconde famille).

### 2. Compte des parties et des joueurs

- `src/core/application/ports/driving/GetDeviceContents.ts` :
  `type DeviceContents = { readonly matches: number; readonly players: number }`,
  `interface GetDeviceContents { execute(): Promise<DeviceContents> }`.
- `src/core/application/use-cases/GetDeviceContentsUseCase.ts` : `(matches: MatchRepository,
  players: PlayerRepository)`, `Promise.all` des deux `listAll()`, longueurs. Imports relatifs.
- `container.ts` : `Services.getDeviceContents` (commenté) ;
  `getDeviceContents: new GetDeviceContentsUseCase(matches, players)` (l. 173-205).
- UI : `useQuery({ queryKey: CLE_CONTENU_APPAREIL, … })`, clé dans `src/ui/clesRequetes.ts` ;
  rechargement au montage et invalidation globale après import (`ReglagesEcran.tsx:285`) suffisent.
- Le même résultat sert la ligne « N parties · M joueurs sur ce téléphone. » et la valeur de
  « Gérer les joueurs ». « N parties » = toutes les parties enregistrées (intake) ; entraînements
  compris : U10.

### 3. Voyant « Dernière sauvegarde »

- `src/ui/hooks/useAppareil.ts` : `CLE_DERNIER_EXPORT = 'sauvegarde:dernier-export'` (⚠️ citée par
  la politique, ne se renomme jamais) ; `useDernierExport()` enveloppe
  `usePreference<unknown>(…, null)` et valide `typeof === 'number' && Number.isFinite`, sinon `null`
  (« Jamais »). Appelé **une fois**, dans l'écran.
- `exporter()` écrit `sauvegarde.exportedAt` **après** `telecharger(…)`, dans le `try`
  (`ReglagesEcran.tsx:267-269`) — même instant que le nom du fichier, même horloge que
  `services.clock` (`container.ts:144-151`). Jamais dans `importer()` ; un `catch` n'écrit rien ;
  le setter rafraîchit le voyant sans rechargement.
- `src/ui/jourCalendaire.ts` : `joursCalendairesEntre(avant, maintenant)` (différence de
  `Date.UTC(année, mois, jour)` sur les composantes locales : exact aux changements d'heure, accepté
  par `horlogeBoundary`).
- `src/ui/voyants.ts` (nouveau, pur) : `SEUIL_SAUVEGARDE_ANCIENNE = 30`, `SEUIL_EN_MOIS = 60` ;
  `vueVoyantSauvegarde(date | null, maintenant)` → état discriminé (`jamais` | `aujourdhui` |
  `hier` | `jours n` | `mois n`) + ton (`ok` jusqu'à 30 jours ; `attention` au-delà et « Jamais »).
  Règles fines (calendrier ou 24 h, nombre de mois, date future) : U3.
- `labels.ts` : « Jamais », « Aujourd'hui », « Hier », « Il y a N jours », « Il y a N mois » (N ≥ 2
  dans les deux formes). Heure par `services.clock.now()` au rendu (comme `AccueilEcran.tsx:118`).

### 4. Voyant « Application » et bloc `#installer`

- `vueVoyantApplication(etat)` : `installed` → « Installée », vert (U2), sans action ;
  `installable` → « Pas installée » + « Installer » (`installer()` dans le clic) ; `ios-manual`,
  `ios-other-browser`, `unavailable` → « Pas installée » + « Comment ? » (`<Link to={{ hash:
  '#installer' }}>`).
- `guideInstallationVisible(etat)` vrai pour ces trois états — **différent** de
  `installationPossible` (`useInstallation.ts:14-15`), que l'Accueil garde.
- Le bloc garde `id="installer"`, `scroll-mt`, l'effet `hash` + `key`
  (`ReglagesEcran.tsx:186-193`) ; textes inchangés (`ETAT_INSTALLATION` pour ces trois états,
  `ETAPES_INSTALLATION_IOS`). L'Accueil n'affiche son lien qu'en `ios-*`
  (`AccueilEcran.tsx:84-89`), où le bloc est rendu. Position et aspect : U5.

### 5. Groupe Sauvegarde

- Duo : « Exporter » (`Button` primaire, `Download`) ; « Restaurer » (secondaire, `Upload`, ouvre
  l'`<input>` caché, nom « Fichier de sauvegarde » inchangé).
- Phrase par état de `PersistentStorage`, `text-xs text-craie-3`, dans `<output aria-label="Protection
  des données">` ; texte « protégé » = planche ; les deux autres : U4.
- **« Demander la protection »** : `<button>` stylé en lien, **après** l'`<output>` dans le même
  `<p>` (aucun contrôle dans une région live, décision `installation-guidee`) ; seulement en
  `not-persisted` ; zone d'appui 48 px par pseudo-élément (`CartePodium.tsx:69-72,98`) ;
  `useProtectionStockage` inchangé. Après refus : phrase de refus (U4) ; bouton et lien
  d'installation actuels (`ReglagesEcran.tsx:154-164`) disparaissent, le voyant porte l'action.
- Puis l'explication de la restauration (texte actuel, mot fort par `Phrase`), `MessageErreur`,
  `Resume`.

### 6. Composants communs

- **`Voyant.tsx`** : étiquette, valeur dans un `<output>` nommé, filet haut 3 px selon le ton
  (`vert-cible` / `laiton`), teinte de valeur, action facultative (bouton ou lien) **étirée sur tout
  le voyant** (`relative` + `after:absolute after:inset-0`) : le voyant entier est la cible,
  l'`<output>` reste hors du contrôle ; anneau de focus ; action désactivée pendant `occupe`.
- **`LigneReglage.tsx`** : `ListeReglages` (`<ul>`, filet haut 3 px `craie`, fond `ardoise`) ;
  `LigneReglage` (titre, aide, valeur, action discriminée `lien` | `bouton` | `bascule`,
  `min-h-14`, filet bas `craie/25`) ; bascule 46 × 26 px, curseur 18 px, `aria-hidden`. Les deux
  lignes d'Affichage restent des `button` nommés « Annoncer les volées » / « Essayer la voix »
  (`entrainement.test.tsx:166,185` verts).
- **`VignetteTheme.tsx`** : § 1. **`Button.tsx`** : une taille pour le duo (T1).

### 7. Libellés et politique (`labels.ts`)

- Tout le français de l'écran passe dans `labels.ts`, y compris `'Cent quatre-vingts'`
  (`ReglagesEcran.tsx:438`), les erreurs (`:271,290-293`), `Resume` (`:92-104`).
- Ajouts : textes de la planche, durées, « Installée », « Pas installée », « Comment ? »,
  « Demander la protection », `contenuAppareil(n, m)` avec `pluriel` (0 et 1 au singulier,
  `labels.ts:624-625`).
- Retraits de libellés morts : `SOUS_TITRE_REGLAGES`, `TEXTE_PANNEAU_JOUEURS`,
  `LIBELLE_REDEMANDER_PROTECTION`, `LIEN_GUIDE_INSTALLATION`, états `installed` / `installable` de
  `ETAT_INSTALLATION`, anciennes phrases de protection. `TITRE_PANNEAU_JOUEURS` reste
  (`EtapeJoueurs`).
- Politique (U6) : « la date du dernier export » au paragraphe localStorage (`labels.ts:298`) ;
  `DATE_MISE_A_JOUR_CONFIDENTIALITE` (`:275`) ; phrase « Réglages → Annonce vocale » (`:316`) à
  trancher.

## Couches et chemins

| Couche | Fichiers | Nature |
|---|---|---|
| `core/domain/` | — | Aucun changement |
| `core/application/` | `ports/driving/GetDeviceContents.ts`, `use-cases/GetDeviceContentsUseCase.ts` (nouveaux) | Port et use case de comptage |
| `infrastructure/` | — | Aucun changement |
| `composition/` | `container.ts` | `Services.getDeviceContents` + câblage |
| `ui/` | `ecrans/ReglagesEcran.tsx` (réécrit) | Page unique |
| `ui/` | `composants/commun/Voyant.tsx`, `VignetteTheme.tsx`, `LigneReglage.tsx` (nouveaux) ; `Button.tsx` (taille du duo) | Composants communs |
| `ui/` | `voyants.ts` (nouveau, pur) ; `jourCalendaire.ts` | Calculs |
| `ui/` | `hooks/useAppareil.ts` ; `clesRequetes.ts` | Date d'export ; clé de requête |
| `ui/` | `labels.ts` | Libellés, politique, date |
| `ui/` | `src/index.css` | Jetons d'aperçu (et jeton vert si U2a) |
| `tests/` | Nouveaux : `use-cases/contenuAppareil.test.ts`, `ui/voyants.test.ts`, `ui/reglagesParUsage.test.tsx` | — |
| `tests/` | Adaptés : `ui/installation.test.tsx:131-160,173-340`, `ui/stockagePersistant.test.tsx:84-219`, `ui/theme.test.tsx:39-42`, `ui/confidentialite.test.tsx:23-32,81-99`, `architecture/themeBoundary.test.ts` | — |
| `tests/` | Verts sans changement : `ui/lot4.test.tsx:46-53,414-449`, `ui/entrainement.test.tsx:154-188` | — |

Docs en fin de lot : charte (§ Palette, Deux thèmes, Composants) ; `rules/theme-colors.md` ;
CONVENTIONS § 10 (clé), § 14 (24 ports driving, composants, `voyants.ts`) ; `CLAUDE.md` ;
`docs/DEPLOIEMENT.md` l. 96, 106-110, 124-128, 189, 214 (« À propos », « Redemander », « Annonce
vocale ») ; PLAN § 0, § 2 (l. 319-321), § 4, § 6 ; l'étude (lot 12 fait) ; l'index (régénéré) ;
`docs/captures/reglages.png` du README (à refaire, hors demande).

## Sens des dépendances

UI → `services.getDeviceContents` → use case → ports driven → adapters câblés dans `container.ts`.
L'UI n'importe que des **types** d'`application` (`DeviceContents`, `InstallState`,
`StorageProtection`, `ImportReport`), aucun `*UseCase` ni adapter ; elle passe par les exceptions
documentées `Services.devices` et `Services.clock`. Le use case n'importe que des ports, en relatif.
Ni `Date.now()` ni API navigateur dans `src/core`.

## Décisions de `CLAUDE.md` concernées

- **Touchées (surface gravée 5)** : politique (l. 54-57, texte et date) ; stockage persistant
  (l. 122-126) ; installation (l. 127-132).
- **Appliquées sans changement** : thème (l. 104-108 ; précision dans la charte), `Services.clock`,
  hexagonal, localStorage réservé aux préférences d'appareil, angle vif, zéro dégradé.
- **Non touchées** : surfaces 1 à 4.
- **Reformulations proposées (fond inchangé)** :
  - *Stockage* : « L'état se lit dans Réglages, groupe Sauvegarde, en une phrase sous Exporter /
    Restaurer (« Demander la protection » en non protégée), jamais ailleurs (zéro friction) —
    **jamais en voyant** : en vert à côté d'une sauvegarde ancienne, il rassurait à tort (lot
    `reglages-par-usage`). »
  - *Installation* : « … Ligne discrète sur l'Accueil (« Plus tard » mémorisé, Accueil seulement) ;
    entrée complète dans les Réglages : voyant Application en tête (« Installer » ouvre l'invite
    native ; « Comment ? » mène au guide `#installer`, rendu sur iOS, autre navigateur iOS et
    navigateur sans invite — là où mène la ligne de l'Accueil). »
- **À graver (proposé, à confirmer)** : « Date du dernier export : préférence d'appareil
  `sauvegarde:dernier-export` (citée par la politique, ne se renomme jamais), écrite au seul export
  réussi, jamais par une restauration ni dans le fichier ; le voyant la lit par `services.clock`. »

## Baseline sécurité

| Frontière | Constat | Mitigation | Résiduel / owner |
|---|---|---|---|
| Nouvelle clé `dartpero:sauvegarde:dernier-export` | Horodatage, préférence d'appareil, jamais exporté | Politique (texte et date) au même lot ; écrite au seul export réussi | `sec` relit la phrase contre le code |
| Valeur relue | `JSON.parse` sans schéma (`LocalStoragePreferences.ts:27-34`), éditable à la main | Validée (nombre fini), sinon « Jamais » ; jamais affichée brute ; date future : U3 | — |
| Import JSON | `ManageBackup`, `backupSchema` inchangés ; l'import n'écrit pas la clé | Test « restaurer ne touche pas la date » | — |
| Export | Fichier inchangé, sans la date | — | U9 : utilisateur |
| Politique | « Réglages → Annonce vocale » devient faux (`labels.ts:316` ; DEPLOIEMENT l. 212-215) | U6a | Utilisateur, avant le Dev |
| Réseau, dépendances, SW, en-têtes, Dexie, `MatchEvent` | Non touchés | Gardes `reseauBoundary`, `installationBoundary` | — |
| Rendu | Aucun pseudo affiché ; texte React seulement | — | — |
| Lecture de toute la base à l'ouverture | Disponibilité, pas de fuite | Rien d'affiché en échec (U8b) ; repli `count()` | Dev mesure |

## Conformité à la planche (`#rg4`)

| Élément de la planche | Implémentation |
|---|---|
| « Réglages », capitales, `craie-vive`, sans sous-titre ni retour | `EnTeteEcran` sans `sousTitre` (taille : U7) |
| Deux voyants, grille 1fr 1fr, écart 6 px | `grid grid-cols-2 gap-1.5`, deux `Voyant` |
| Voyant : `ardoise`, filet 3 px, marges 10/8, écart 4 | `Voyant` |
| « DERNIÈRE SAUVEGARDE » / « Il y a 34 jours » `laiton-clair` / « EXPORTER » souligné | `vueVoyantSauvegarde`, action étirée |
| « APPLICATION » / « Pas installée » `craie-vive` / « INSTALLER » | `vueVoyantApplication` |
| « 48 parties · 4 joueurs sur ce téléphone. » | `contenuAppareil`, `text-xs text-craie-3`, `<output>` |
| « AFFICHAGE », « SAUVEGARDE », « JOUEURS ET APPLI » | `<h2>` `font-score font-bold uppercase tracking-[0.2em] text-craie-3` |
| Trois vignettes, active cerclée de laiton | `VignetteTheme`, jetons d'aperçu |
| « Annoncer les volées » + aide + bascule ; « Essayer la voix » + chevron | `LigneReglage` bascule / bouton ; titre `craie-vive` |
| Duo « ⤓ Exporter » / « ⤒ Restaurer » | `Button` primaire / secondaire |
| Phrase « Tout vit sur ce téléphone : exportez… de lui-même. » | Phrase de l'état `persisted` |
| « Gérer les joueurs » + aide + « 4 » + chevron ; « Confidentialité et mentions légales » + chevron | `LigneReglage` lien, valeur `laiton-clair` |
| « 100 % local, hors ligne, sans compte. » | `<p>` `text-xs text-craie-3` |

**Ajouts décidés par la demande** (non dessinés) : « Comment ? » et bloc `#installer` (U5) ;
« Demander la protection » et refus (U4) ; explication de la restauration, résumé d'import,
erreurs ; présentation de Dartpéro.
**Retraits imposés par la planche** : sous-titre, cinq panneaux encadrés, aide du thème (`:375`),
paragraphe « pas de compte, pas de serveur… », icônes bouclier / haut-parleur / wifi, libellés longs
(« Exporter la base », « Restaurer une sauvegarde », « Le score, les bust… », « Renommer, changer la
couleur… »), entrée « À propos ».
**Écarts** : U2 (le vert, faute de jeton) et U7 (paliers typographiques). Aucun autre.

## Questions pour l'utilisateur (défaut proposé)

- **U1 — Voyant « Dernière sauvegarde » à jour** (≤ 30 jours, non dessiné). Couleur de la valeur :
  (a) **défaut** `craie-vive` comme « Pas installée » ; (b) vert comme « Installée ». Action
  « Exporter » gardée même à jour : **défaut oui**.
- **U2 — Vert de « Installée »**. Planche : `#6FCF97` (`.ok`, l. 13, 116), pas un jeton ;
  `vert-cible` fait 3,2:1 en texte sur ardoise sombre. (a) **défaut** : nouveau jeton `vert-etat`
  (`#6FCF97` sombre, 8,5:1 ; `#1F6B41` clair, 5,8:1 sur ardoise), réservé à `Voyant` ; (b) élargir
  `vert-texte` (`#5BB27E` / `#1F6B41`). Filet vert = `vert-cible`.
- **U3 — Durée**. (a) **défaut** jours du calendrier local (« Hier » = la veille) ; (b) tranches de
  24 h. Mois = jours ÷ 30 arrondi en dessous (60-89 → « Il y a 2 mois »), sans plafond. Date future
  → « Aujourd'hui », pas laiton ; illisible → « Jamais ». Aucun minuteur à minuit.
- **U4 — Phrase de protection hors « protégé »**. Défauts : non protégée « Tout vit sur ce
  téléphone : exportez pour garder une copie. Le navigateur peut effacer les données si l'espace
  manque. » + lien « Demander la protection » ; indisponible « … Ce navigateur ne sait pas protéger
  les données. » ; refus « Le navigateur a refusé. Il accepte en général une fois Dartpéro installé
  (voir Application, en haut). » (réduit à « Le navigateur a refusé. » si installée) ; plus de bouton
  ni lien d'installation sous la phrase ; lien au style d'une action de voyant (capitales,
  `laiton-clair`, souligné).
- **U5 — Bloc `#installer`**. Position : (a) **défaut** après la ligne de contenu, avant Affichage ;
  (b) juste sous les voyants. Aspect : comme aujourd'hui, sans cadre (phrase + trois gestes iOS
  numérotés, icônes laiton ; phrase seule sinon).
- **U6 — Politique publique**. (a) « Réglages → Annonce vocale » (`labels.ts:316`) devient faux ;
  **défaut** « … dans Réglages → Affichage », dans ce lot. (b) Ajout à `:298` : « …, le « Plus tard »
  de l'invitation à installer et la date du dernier export. » (c) Date déjà « 16 octobre 2026 » :
  **défaut** date du jour de livraison.
- **U7 — Paliers** (plancher 0,75 rem). Étiquette de voyant 0,58 → 0,75 rem ; action 0,62 → 0,75 ;
  titre de groupe 0,64 → 0,75 ; libellé de vignette 0,66 → 0,75 ; phrases et ligne de contenu
  0,78 → 0,75 ; valeur de voyant 1,05 → 1 ; titre de ligne 0,9 → 0,875 ; valeur de ligne
  0,82 → 0,875 ; duo 0,78 / 0,82 → 0,75 / 0,875 ; titre d'écran 2 → 1,875 (`EnTeteEcran` inchangé).
  Duo par `Button` (tranche 4 px, cadre `craie/55`, texte `craie`). « DERNIÈRE SAUVEGARDE » tient de
  justesse à 360 px.
- **U8 — Cas non dessinés**. (a) « Gérer les joueurs » sans profil : « 0 » ; (b) compte en lecture ou
  en échec : ligne et valeur absentes, jamais un faux « 0 » ; (c) « Essayer la voix » voix coupée :
  grisé ; (d) erreur d'export lancé du voyant : à sa place actuelle ; (e) appli neuve : « Jamais » en
  laiton (deux voyants laiton) ; (f) ordre : phrase, explication, erreurs et résumé ; présentation
  sous « 100 % local… ».
- **U9 — « Export réussi »** = fichier remis au navigateur sans erreur ; le voyant peut dire
  « Aujourd'hui » sans fichier enregistré (aperçu iOS refermé). **Défaut** : accepter.
- **U10 — « N parties »** inclut les entraînements (comme Parties en « Tous ») : à confirmer.
  Hors périmètre : l'en-tête de Parties plafonne à 50 (`HistoriqueEcran.tsx:73,107`).

Textes pour lecteurs d'écran à relire : groupe « Thème » ; sorties « Dernière sauvegarde »,
« Application », « Contenu de ce téléphone », « Protection des données » ; « Comment ? » dont le nom
contient le texte visible (WCAG 2.5.3), p. ex. « Comment ? Installer Dartpéro ».

## Questions ouvertes techniques

| # | Question | Pour |
|---|---|---|
| T1 | Duo à 360 px : une taille dans `TAILLES` de `Button.tsx:20-33`, sans classe concurrente par `className` ; `tracking-widest` dans les tailles | Dev |
| T2 | Étiquettes et valeurs de voyant à 360 / 390 px : retour à la ligne ou troncature remonte à l'utilisateur | Dev |
| T3 | Action étirée, focus sur tout le voyant, `<output>` hors du contrôle, `disabled` pendant `occupe` | Dev |
| T4 | Jetons d'aperçu identiques au caractère près ; garde par blocs `@theme` et clair ; si U2a, garde de réservation généralisée en table jetons → fichiers | Dev / Test |
| T5 | Relecture port 5201 : portrait / paysage, sombre / clair, 360 / 390 px ; Jamais, 12 j, 34 j, 2 mois ; cinq états d'installation ; trois états de protection ; base vide, 1, 48 parties ; comparaison à la planche | Dev |
| TT1 | Export réussi : `vi.stubGlobal` de `URL.createObjectURL` / `revokeObjectURL` (`theme.test.tsx:20-37`). Échec : jsdom sans stub, **et** dépôt dont `listAll` rejette (`accueilPartiesRecentes.test.tsx:570-580`) | Test |
| TT2 | Seuils 0, 1, 30, 31, 59, 60 (`SettableClock`, heure locale) ; passage d'heure avec précondition 23 h / 25 h | Test |
| TT3 | Plusieurs `status` et listes : `within(…)` ; `screen.getByRole('list')` de `installation.test.tsx:199` casse | Test |
| TT4 | Réécriture sans perte : Accueil → bloc, une invite par clic, désabonnement, refus jamais au montage, StrictMode (`stockagePersistant.test.tsx:41-62`) | Test |
| TT5 | Gardes avec témoins et contre-épreuves : jeton hors vignette, aperçu ≠ source, aperçu qui change avec le thème | Test |
| TS1 | Clé validée, absente de l'export, jamais écrite par l'import ; phrase de politique relue contre le code ; U6a | Sécurité |
| TO1 | Rebase avec `rejouer` : `labels.ts`, `clesRequetes.ts`, `container.ts` / `Services`, compte de ports CONVENTIONS § 14, charte, étude, date de la politique | Orchestrator |

## Plan de tests

- Pures (`voyants.test.ts`) : seuils, passage d'heure, date future, valeur illisible ; cinq états
  d'installation (`it.each`) ; `guideInstallationVisible`.
- Use case : base vide (0 / 0), singulier, `it.each(GAME_MODE_IDS)` (entraînement compté), parties
  inachevées et abandonnées, profil supprimé (ses parties restent).
- Écran : ordre des groupes et deux voyants exactement ; « Jamais », « Aujourd'hui » après export sans
  rechargement, échec n'écrit rien, restauration ne touche pas la date ; voyant Application dans ses
  cinq états, « Installer » une seule invite, « Comment ? » vers `#installer` ; rappel d'exporter dans
  les trois états, « Demander la protection » seulement en non protégée et hors `<output>` ; comptes,
  base vide comprise ; vignettes `aria-pressed` ; 48 px ; politique (clause, modèle
  `confidentialite.test.tsx:88-99`, et date).
- Verts : les neuf gardes, `lot4`, `entrainement`.

## Risques

1. Textes et états non dessinés (U1, U4, U5, U8) : à trancher au portail Archi → Dev.
2. Largeur à 360 px (étiquettes, duo) : visible seulement à l'écran.
3. Dérive des jetons d'aperçu : garde d'égalité.
4. Politique fausse si U6a n'est pas tranché.
5. Sens d'« export réussi » sur iPhone (U9).
6. Conflits de rebase avec `rejouer`.
7. Lenteur sur très grosse base : faible ; repli `count()`.

## Échecs des agents précédents

Aucun : scout et designer sautés (surface gravée annoncée par l'intake).

## Réponses de l'utilisateur (arrêt Archi → Dev, 2026-10-17)

Toutes les questions U sont closes, chaque fois sur le défaut proposé :

| # | Réponse |
|---|---|
| U1 | Valeur `craie-vive` (neutre) à ≤ 30 jours ; filet vert ; « Exporter » toujours présent |
| U2 | Nouveau jeton `vert-etat` (`#6FCF97` sombre, `#1F6B41` clair), réservé à `Voyant` ; filet vert = `vert-cible` |
| U3 | Jours du calendrier local ; mois = jours ÷ 30 arrondi en dessous, sans plafond ; date future → « Aujourd'hui » (pas laiton) ; illisible → « Jamais » ; pas de minuteur |
| U4 | Phrases proposées (non protégée, indisponible, refus réduit si installée) ; lien « Demander la protection » au style d'action de voyant ; plus de bouton ni lien d'installation sous la phrase |
| U5 | Bloc `#installer` après la ligne de contenu, avant Affichage ; aspect actuel sans cadre |
| U6 | (a) « Réglages → Affichage » dans ce lot ; (b) ajout « et la date du dernier export » ; (c) date de mise à jour = jour de livraison |
| U7 | Paliers proposés (plancher 0,75 rem), `EnTeteEcran` inchangé, duo par `Button` |
| U8 | (a) « 0 » ; (b) rien d'affiché en lecture / échec ; (c) grisé ; (d) erreur à sa place ; (e) deux voyants laiton ; (f) ordre proposé |
| U9 | Accepté : « export réussi » = fichier remis au navigateur sans erreur |
| U10 | Les entraînements comptent dans « N parties » |
| Gravure | Accepté : graver la règle « date du dernier export » dans `CLAUDE.md` (formulation du § Décisions de `CLAUDE.md` concernées), avec les deux reformulations stockage / installation |

Questions techniques T1-T5, TT1-TT5, TS1, TO1 : assignées à Dev, Test, Sécurité, Orchestrator ;
elles ne bloquent pas le départ du Dev.
