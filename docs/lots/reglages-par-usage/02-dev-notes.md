# Lot `reglages-par-usage` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (opus, effort medium,
> 2026-10-17). Session 1 arrêtée à `maxTurns` 100 sans rapport ; reprise par message, même
> contexte (session 2), qui a fini les vérifications et rendu ce rapport. Rien de committé.

## Ce qui a été implémenté

**Application** — port driving `GetDeviceContents` + `GetDeviceContentsUseCase` (deux `listAll()`),
câblé dans `container.ts` (`Services.getDeviceContents`).

**UI**
- `ReglagesEcran.tsx` réécrit : titre sans sous-titre ; deux voyants en grille ; `<output>`
  « N parties · M joueurs sur ce téléphone. » ; guide `#installer` (U5) ; trois `<section
  aria-labelledby>` (Affichage, Sauvegarde, Joueurs et appli) ; pied « 100 % local… » +
  présentation.
- Voyant **Dernière sauvegarde** : `vueVoyantSauvegarde` + `libelleDureeSauvegarde` (jours du
  calendrier local ; 0 « Aujourd'hui », 1 « Hier », 2-59 « Il y a N jours », ≥ 60 « Il y a N mois »
  = jours ÷ 30 arrondi en dessous) ; laiton > 30 jours et « Jamais » ; date future → « Aujourd'hui »
  sans alerte ; illisible → « Jamais » ; heure par `services.clock.now()`. Date écrite **après**
  `telecharger()` avec `sauvegarde.exportedAt`, jamais dans le `catch` ni par l'import. Clé
  `sauvegarde:dernier-export`, lue et validée par `useDernierExport` (nombre fini, sinon `null`).
- Voyant **Application** (`vueVoyantApplication`, `guideInstallationVisible` en type guard) :
  « Installée » en `vert-etat` sans action ; « Installer » (nom « Installer Dartpéro ») ;
  « Comment ? » lien `#installer` (nom « Comment ? Installer Dartpéro »). Le guide garde
  `id="installer"`, `scroll-mt` et l'effet hash + key ; le lien de l'Accueil y aboutit (test gardé).
- **Protection** : une phrase par état dans `<output aria-label="Protection des données">`,
  ouverte par le rappel d'exporter ; « Demander la protection » bouton-lien hors de l'`<output>`,
  seulement en `not-persisted` ; refus « … (voir Application, en haut). », réduit si installée ;
  ancien bouton et lien d'installation retirés.
- **Compte** : `useQuery` + `CLE_CONTENU_APPAREIL` ; rien d'affiché en chargement / échec (jamais
  de faux « 0 ») ; même donnée pour la valeur de « Gérer les joueurs ».
- Composants communs nouveaux : `Voyant.tsx`, `VignetteTheme.tsx`, `LigneReglage.tsx` ;
  `Button.tsx` : tailles `xs` / `sm` ; `voyants.ts` (pur) ; `jourCalendaire.ts`
  (`joursCalendairesEntre`) ; `useAppareil.ts` (`useDernierExport`) ; `clesRequetes.ts`.
- `index.css` : six jetons `apercu-*` (identiques dans `@theme` et le bloc clair) + `vert-etat`
  (8,48:1 ardoise sombre, 5,81:1 ardoise claire, 4,62:1 feutre clair).
- `labels.ts` : tout le français de l'écran ; libellés morts retirés (`SOUS_TITRE_REGLAGES`,
  `TEXTE_PANNEAU_JOUEURS`, `LIBELLE_REDEMANDER_PROTECTION`, `LIEN_GUIDE_INSTALLATION`, états
  `installed` / `installable` de `ETAT_INSTALLATION`, anciennes phrases) ; `TITRE_PANNEAU_JOUEURS`
  gardé. **Politique** (U6) : « … et la date du dernier export » ; « Réglages → Affichage » ;
  `'Mise à jour le 17 octobre 2026'`.

**Tests** — nouveaux : `tests/use-cases/contenuAppareil.test.ts`, `tests/ui/voyants.test.ts`,
`tests/ui/reglagesParUsage.test.tsx` ; adaptés : `themeBoundary`, `confidentialite`,
`installation` (13 tests de l'ancien comportement remplacés par leurs équivalents), 
`stockagePersistant`, `theme`.

**Docs** — `CLAUDE.md` (reformulations stockage / installation, gravure « Date du dernier
export ») ; charte (§ Deux thèmes, Palette, Composants, sous-section « Les Réglages ») ;
`rules/theme-colors.md` (trois familles de jetons réservés) ; CONVENTIONS § 10, § 14 ;
`DEPLOIEMENT.md` ; PLAN § 0, 2, 3, 4, 6 ; l'étude (lot 12 fait, `high`). Non touchés :
`.ai/architecture-context.md` (Orchestrator), `docs/captures/reglages.png`.

## Choix sur les questions techniques

- **T1** : deux tailles dans `TAILLES` — `xs` (`min-h-12 px-3 text-xs tracking-[0.12em]`,
  Exporter) et `sm` (`… text-sm tracking-[0.14em]`, Restaurer) ; l'interlettrage quitte
  `classesBouton` pour chaque taille (`md` / `lg` gardent `tracking-widest`).
- **T2** : mesuré à 360 px, aucune troncature ni retour à la ligne (voyant de 161 px).
- **T3** : `after:absolute after:inset-0` sur l'action, voyant `relative`, focus par
  `focus-visible:after:outline-2 outline-laiton`, `<output>` frère de l'action, `disabled` pendant
  `occupe` ; zone d'appui 84 px.
- **T4** : égalité au caractère près dans les deux blocs ; garde « chaque aperçu vaut le jeton
  qu'il montre » (contre-épreuve faite) ; garde de réservation généralisée en table jetons →
  fichiers (feuille, `vert-etat` → `Voyant.tsx`, `apercu-*` → `VignetteTheme.tsx`), un témoin par
  famille ; test de motif avec contre-exemples.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| `VignetteTheme` en `<fieldset aria-label>` au lieu de `div role="group"` | Ajustement | Règle Biome `useSemanticElements` ; même rôle `group` |
| Noms accessibles « Exporter une sauvegarde » et « Installer Dartpéro » pour les actions de voyant | Ajustement | Contiennent le texte visible (WCAG 2.5.3) ; distincts du bouton « Exporter » du duo ; dans `labels.ts` |
| Pseudo-élément de « Demander la protection » à `-inset-y-4` (pas `-3.5`) | Ajustement | Mesuré 44 px → corrigé à 48 px |
| Deux tailles de bouton au lieu d'une (T1) | Ajustement | Paliers U7 (0,75 / 0,875 rem) |
| 13 tests d'`installation.test.tsx` remplacés | Ajustement | Prévu par 01 (tests adaptés) |

Aucune *refonte nécessaire*.

## Contrôles

| Commande | Résultat |
|---|---|
| `npx biome check --write src tests` | Aucune correction |
| `npm run lint` | 306 fichiers, 0 erreur |
| `npm run typecheck` | OK |
| `npx vitest run` | 77 fichiers, **1414 tests verts** (1340 avant) |
| `npm run build` | OK, SW généré |
| Grep d'encodage (`Ã`, `â€`, `Â `) sur les fichiers touchés | Aucun résultat |

**Relecture à l'écran (T5, faite)** : `vite preview` port 5201 (arrêté), Chrome par
`playwright-core`, base semée par la vraie restauration. 23 scénarios × 2 captures (écran / page
entière) dans `C:\Users\kevin\Documents\Flechettes\docs\maquettes\reglages-par-usage\` (script
`shoot.cjs`) : planche de référence sombre / clair, 390 / 360 px, paysage ; Jamais, 12 j, 34 j,
2 mois ; cinq états d'installation ; trois états de protection + refus (installée ou non) ; base
vide, 1, 48 parties. Aucun défilement horizontal, aucun débordement, aucune erreur console. Cibles
mesurées : lignes 56 px, duo 48 px, vignettes 92 px, actions de voyant 84 px, « Demander la
protection » 48 px. Conforme à la planche ; différences : paliers U7 (« RESTAURER » 0,875 paraît
plus gros qu'« EXPORTER » 0,75), titre 1,875 rem, vert U2, vignette du thème courant de même fond
que la page (inhérent aux aperçus de la planche), bloc « Système » fixe à 40 px en paysage.
Angles morts : contraste réel sur appareil, iPhone réel.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| Q-a | Après un refus, la phrase passe en bloc et « Demander la protection » se pose dessous ; sans refus, le lien suit la phrase. Non dessiné | Utilisateur (produit) |
| Q-b | Paysage : bloc clair de la vignette « Système » fixe à 40 px, paraît étroit. La planche n'a pas de paysage | Utilisateur (produit) |
| — | **Réponses utilisateur (2026-10-17)** : Q-a **gardé tel quel** ; Q-b **bloc clair à 40 % de la largeur** de l'aperçu (demandé au `dev`, même session) | Close |
| Q-c | Test faible « en échec de lecture : ni ligne ni valeur » : attend `setTimeout(0)` au lieu de l'état d'erreur — ne distingue pas chargement et échec | Test |

## Suite Q-b (session 3 du `dev`, 2026-10-17)

`VignetteTheme.tsx` : aperçu Système `w-10` → `w-[40%]` ; charte, ligne `VignetteTheme` mise à jour
(seule mention des 40 px). Biome sans correction, lint 0 erreur (306), typecheck OK,
`npx vitest run` 77 fichiers / **1414 verts**, build OK. Recaptures `ref-sombre-390` (inchangé,
conforme), `ref-sombre-paysage`, `ref-clair-paysage` (bloc ≈ 40 %) ; port 5201 libéré.

## Boucle 1 (Test → Dev, session 4, 2026-10-17)

B1 (`useAppareil.ts:53`, `voyants.ts:51`), B2, T1-T7 corrigés ; contre-épreuves rouges puis
restaurées ; 1428 verts. Détail : `03-plan-de-test.md` passe 2.

## Boucle 5 (Revue → Dev, session 5, 2026-10-17)

> ⚠️ Remplace les valeurs de la passe 1 ci-dessus : le duo n'est plus en `min-h-12` / 48 px.

- Revue 1 : valeur des voyants `font-bold leading-[1.1]` (`Voyant.tsx`) ; charte.
- Revue 2 : tailles `xs` / `sm` de `Button` en `min-h-14` (seul le duo les utilise) → duo
  **176 × 56** mesuré ; test et charte mis à jour.
- Revue 4-6 : PLAN § 0 / 4 / 6, étude, `DEPLOIEMENT.md:136-138`, `PROJECT_PLAN.md:323`,
  `theme-colors.md`, `CONVENTIONS.md:472`, commentaires `useInstallation.ts` / `jourCalendaire.ts`,
  vue renommée `vueSauvegarde`.
- Revue 7 : test « action du voyant désactivée pendant l'export » (contre-épreuve rouge) ;
  intitulé de `contenuAppareil.test.ts:35`.
- Commandes (Dev, puis rejouées par l'Orchestrator) : lint 0 erreur, typecheck OK, **1429 verts**,
  build OK, smoke OK. Captures `ref-sombre-390`, `ref-clair-390` : gras et duo conformes ; voyants
  82 px (au lieu de 84, interligne 1,1).

## Mesure à 360 px après le gras (session 6, 2026-10-17)

Aucun code changé. Scénarios `v59-360`, `v59-360-racine20`, `v2mois-360`, `vjamais-360` ajoutés à
`shoot.cjs`. À police normale : étiquettes et valeurs sur une ligne, voyants 85 / 85, duo 56 / 56
aligné, aucun débordement ; interligne de la valeur 17,6 px (1,1). À police racine 20 px (125 %) :
« DERNIÈRE SAUVEGARDE » sur **deux lignes** (45 px), voyants 128 / 128, duo 70 / 70 ; l'aide
« Score, bust et sorties, à voix haute » passe aussi sur deux lignes (indépendant du gras).

**Q-d** (produit) → utilisateur : **raccourcir l'étiquette en « Dernier export »** (2026-10-17).
Demandé au `dev` (session 7).

**Session 7** : `ETIQUETTE_VOYANT_SAUVEGARDE = 'Dernier export'` (`labels.ts`, nom accessible de
l'`<output>` compris) ; 3 requêtes de test et un `describe` ; `CLAUDE.md` (gravure), charte
§ Les Réglages, PLAN § 3 et § 6. Non touchés : `request.md`, `01` (archives), l'étude l. 438, 444
(récit du choix sur maquette). Mesure 360 px à 125 % : étiquette **23 px, une ligne** (avant
45 px, deux lignes), voyants 105 / 105, duo 70 / 70 aligné. Commandes rejouées par
l'Orchestrator : lint 0, typecheck OK, **1429 verts**, build OK, smoke OK.

## Limites connues et TODO assumés

- `docs/captures/reglages.png` (README) montre l'ancienne page : hors demande, non refaite.
- `.ai/architecture-context.md` à régénérer par l'Orchestrator avant commit.
- Rebase attendu avec `rejouer` (TO1) : `labels.ts`, `container.ts` / `Services`,
  `clesRequetes.ts`, CONVENTIONS § 14 (compte de ports), charte, étude, PLAN § 0 / 4 / 6.
