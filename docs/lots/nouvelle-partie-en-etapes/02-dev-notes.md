# Lot `nouvelle-partie-en-etapes` — notes de dev

> Écrit par l'Orchestrator à partir du rapport de `dev` (opus, effort medium du frontmatter,
> `maxTurns` 100 — non atteint). Rien de committé ni d'indexé ; aucune documentation touchée
> (réservée à l'Orchestrator après les revues).

## Vérifications

| Commande | Résultat |
|---|---|
| `npm run lint` | OK, 229 fichiers (un `lint:fix` de formatage seulement) |
| `npm run typecheck` | OK |
| `npm test` | 43 fichiers, **489 tests** verts |
| `npm run build` | OK — chunk `NouvellePartieEcran` 20,11 kB (6,70 kB gzip), précache 47 entrées |
| `npm run smoke` | OK (manifeste, précache, assetlinks, garde `REMPLIR`) |

Le test d'absence de « leg » a été vérifié capable d'échouer : `TITRE_MOMENT_MANCHE` remis à
`'Leg !'` fait tomber `manches.test.tsx` (puis remis en état).

## Ce qui a été implémenté

**Créés**
- `src/ui/chemins.ts` — `SLUG_MODE`, `cheminNouvellePartie(mode?)`, `cheminOrdre`,
  `cheminJoueursExistants`, `modeDuSlug`, `ETAT_PARCOURS`, `vientDuParcours` ; n'importe que le
  type `GameModeId`.
- `src/ui/hooks/useNouvellePartie.ts` — clés conservées, nouvelles (`partie:sets`,
  `entrainement:joueur`, `entrainement:sorties`), `partie:mode` abandonnée ; valeurs hors liste
  → défaut ; sélection filtrée sur les profils existants ; `max` 1 / 4 ; `demarrer` exhaustif
  sur les quatre use cases, `shuffle = ordreAleatoire && n > 1`, invalidation de
  `['matchEnCours']`, navigation.
- `src/ui/ecrans/nouvelle-partie/` — `NouvellePartieEcran` (routes descendantes, gardes,
  défilement en haut), `EnTeteEtape` (`useRetour`, 48 px), `EtapeJeu` (quatre `Link`, liseré
  `ACCENTS_MODE`, 41 / 170 lus sur `DEFAUT`), `EtapeJoueurs`, `RangeeJoueurs` (× 48 px, +
  en divulgation, Échap, + masqué à plein), `DialogueNouveauJoueur` (`<dialog>` + `showModal()`),
  `ChoixJoueursExistants` (cache `['statistiquesJoueurs','ALL_TIME']`, « N manches » si
  `legsPlayed > 0`, `disabled` à plein), `ReglagesJeu` (exhaustif, garde `never`),
  `EtapeOrdre`, `ListeOrdonnable` (poignée, ↑ / ↓, focus rendu, annonce `<output sr-only>`,
  Pointer Events `translateY` + relâcher), `ordre.ts`, `Bascule` (déplacée telle quelle).
- Tests : `tests/ui/ordre.test.ts` ; `tests/ui/manches.test.tsx` (critère 10 : témoin positif
  puis absence de `/\blegs?\b/i` dans texte, `aria-label`, `title` — étape 2 X01, partie à sets
  après une manche, Accueil, historique, résumé, stats ; voix : au moins une phrase, aucune
  avec « leg »).

**Supprimés** — `src/ui/ecrans/NouvellePartieEcran.tsx`,
`src/ui/ecrans/games/checkout-practice/LancerEntrainementEcran.tsx`.

**Modifiés** — `App.tsx` (`/nouvelle-partie/*`, un seul `lazy()`, redirection
`/entrainement`), `AccueilEcran` (bouton d'entraînement et `Target` retirés,
`state={ETAT_PARCOURS}`), `NavigationBasse` (quatre onglets), `ReglagesEcran` (panneau
« Joueurs » en tête, « Gérer les joueurs », sous-titre), `ActionsFinDePartie` (`versReglages`
obligatoire ; quatre résumés → étape 2 de leur mode), `labels.ts` (« manche », `libelleFormat`,
nouveaux libellés, paragraphes en `Segment[]`), `ApercuPartie`, `Tableau`, `LigneJoueur`
(`3.75rem_2.75rem`, `aria-label`, commentaire), `Batons` (commentaire), `momentVolee`
(« Manche ! »), `X01Ecran` (« Manche N », `flex-wrap`, `whitespace-nowrap`),
`StatistiquesEcran`, `ResumeX01Ecran`, `src/core/domain/games/x01/config.ts` (**commentaires
seulement**, aucune ligne de code). Tests : `tests/setup.ts` (faux `showModal` / `close`,
capture de pointeur, posés s'ils manquent), `tests/ui/gestes.ts` (`SondeHistorique`,
`retourTelephone()`), `renderWithServices.tsx` (sonde montée), `lazyRoutes.test.ts`
(`LancerEntrainementEcran` retiré, plancher 9 → 8), `nouvellePartie.test.tsx` réécrit
(25 tests : critères 1-9, 11, 13, gardes), adaptés : `parcours`, `entrainement`,
`tourDuMonde`, `cricket`, `lot4` (critère 12), `resumeX01`.

## Écarts — tous des **Ajustements**

| # | Écart | Résolution |
|---|---|---|
| 1 | « Sélectionner un joueur existant » reste accessible à l'entraînement (seule l'étape 3 redirige). Sinon, après un ×, on ne pourrait plus reprendre un profil existant pour s'entraîner. Max 1 appliqué | **Clos par l'Orchestrator** : conforme à l'intention de la demande (étape 2 solo avec choix du joueur) ; la lecture « sélection → étape 2 » du § 1 l'aurait rendue inutilisable. Documenté au journal |
| 2 | `maxLength={20}` en dur (`LONGUEUR_MAX_PSEUDO`) : `LONGUEUR_MAX` n'est pas exporté par `Player.ts`, l'exporter aurait touché du code de `src/core` | Accepté : la validation reste celle du domaine ; le confort UI peut diverger sans risque |
| 3 | Paragraphes de règles en segments dans `labels.ts` (gras conservé) ; l'italique de « bogey numbers » disparaît | Accepté |
| 4 | `ChoixJoueursExistants` embarque aussi la boîte « Nouveau joueur » (bouton de l'`EmptyState`, base vide) | Accepté |
| 5 | Textes nouveaux rédigés par Dev : deux lignes de chaque carte (`reglesCarteJeu`), « Choisissez le jeu », « Cochez ceux qui jouent », « Étape précédente », `aideManches` / `aideSets`, « Aucun joueur pour l'instant : touchez + pour en ajouter. » | À valider par l'utilisateur à la relecture |
| 6 | L'entraînement invalide désormais `['matchEnCours']` au démarrage (comme les autres modes) | Conforme au § 2 |

## Questions ouvertes

| # | Question | Résolution |
|---|---|---|
| D1 | Écart 1 — sélection à l'entraînement | Close (voir ci-dessus) |
| D2 | Le panneau du menu « + » reste dans le DOM avec `hidden` (pour `aria-controls`), masqué par le preflight Tailwind v4 | Vérification à l'écran, assignée à Test (relecture) |

## Tours de correction

- **Tour 1 (boucle 1, Test → Dev)** : B1 (transition seulement pendant le geste), O1 (erreur
  effacée au changement de `pathname`), O2 (`libelleSetsGagnes`, `libelleManchesDuSet`), tests
  T1-T6 ; 503 verts. Détail : `03-plan-de-test.md` § Rejeu après correction n° 1.
- **Tour 2 (boucle 5, Revue → Dev)** : constat n° 1 de la Revue — `rangVise` (`ordre.ts`) place
  le seuil **à mi-chemin** entre deux milieux (place la plus proche) ; la borne du geste ne
  change pas. Écarté : `>=` / `<=` (égalité de flottants fragile), borne élargie (la ligne
  dépasserait). 4 tests purs à la borne, 2 anciens réécrits, 9 tests de composant (fausse mise
  en page, geste jusqu'au bout), T8, T9 ; **517 verts** ; contre-épreuve : 13 échecs sur l'ancien
  seuil. Détail : `03-plan-de-test.md` § Rejeu après correction n° 2.
- **Tour 3 (boucle 5, Revue → Dev, demandé par l'utilisateur)** : tests seulement — commentaire
  des faux de capture de pointeur dans `tests/setup.ts` (n° 10) ; titre de l'`it.each` du glisser
  numéroté depuis n°1, corps qui passe `numero - 1` (n° 11, vérification inchangée). 517 verts.

## Limites connues (angles morts jsdom)

> ⚠️ Mise à jour après le tour 2 : le glisser est désormais testé en jsdom jusqu'au geste, sur
> mise en page simulée. La première puce ci-dessous ne vaut plus que pour la vraie mesure, les
> vrais Pointer Events et le rendu.

- Glisser au doigt (mesure, `translateY`, décalage, relâcher) vérifié seulement en logique pure
  et au clavier → Android réel (R1), iPhone pour `<dialog>` et Pointer Events (R2).
- Retour Android avec la boîte ouverte (R3) non testé.
- Rendu non relu : colonne « MANCHES » (44 px) et « VOLÉE » (60 px) portrait et paysage ;
  bandeau « MANCHE N · SET N » qui passe à la ligne ; × de 48 px débordant de l'avatar
  (`-right-5 -top-5`) avec 4 joueurs + le + ; contrastes en thème clair (ombre de la ligne tenue
  en `feutre-nuit`, quasi invisible en clair) ; boîte de dialogue clavier ouvert.
- Captures du README et `public/screenshots/partie-x01.png` encore en « LEG ».
- « Manche N » de l'entraînement (`Cartouche`) inchangée : homonyme assumé.
