# Lot `rejouer` — notes de Dev

> Écrit par l'Orchestrator à partir du rapport de `dev` (sonnet / medium, 2026-10-16).

## Résultats annoncés

- `npm run lint` : OK (303 fichiers, aucune correction).
- `npm run typecheck` : OK.
- `npx vitest run` : 77 fichiers, **1388 tests** verts (1340 avant le lot, + 48).
- `npm run build` : OK (PWA générée).
- Aucune capture, aucun serveur lancé sur le port 5202 : **rendu non vérifié à l'écran**.

## Fichiers

**Créés**

- `src/core/application/ports/driving/GetReplayableConfigurations.ts` — `ConfigurationRejouable`
  (union par mode : `key`, `playerIds`, `count`, `lastPlayedAt`) et le port.
- `src/core/application/use-cases/GetReplayableConfigurationsUseCase.ts` — use case
  (`matches`, `players`), `FENETRE_REJOUER = 50`.
- `src/ui/rejouer.ts` — filtre `estReproductible`, `configurationsAffichees` (filtrer puis
  `slice(0, 3)`).
- Tests : `tests/use-cases/rejouer.test.ts` (13), `tests/ui/rejouerFiltre.test.ts` (20 : filtre,
  `libelleDateRelative`, résumés, `aria-label`), `tests/ui/rejouer.test.tsx` (14).

**Modifiés**

- Code : `src/composition/container.ts`, `src/ui/clesRequetes.ts` (`CLE_REJOUER`),
  `src/ui/hooks/useNouvellePartie.ts`, `src/ui/ecrans/nouvelle-partie/EtapeJeu.tsx`,
  `NouvellePartieEcran.tsx`, `src/ui/labels.ts`.
- Docs : `CLAUDE.md` (puce « Rejouer »), `docs/CHARTE_GRAPHIQUE.md` (§ Parcours, « Rejouer »),
  `docs/PROJECT_PLAN.md` (§ 4, § 6).
- Tests existants (requêtes seules) : `accueilPartiesRecentes`, `cricket`, `entrainement`,
  `manches`, `nomDePartieEcrans`, `nouvellePartie`, `parcours`, `pictogrammesEmplacements`,
  `tourDuMonde`.

## Choix techniques

- **T2** : port `GetReplayableConfigurations` ; le use case lit `matches` et `players` avec
  `summarize`, comme `GetMatchHistoryUseCase`, au lieu d'appeler un autre use case. Liste non
  coupée.
- **T3** : filtre dans `src/ui/rejouer.ts`, voisin de `reglagesPossibles.ts`. Il prend aussi un
  prédicat `existe(id)` (profils absents de la liste chargée), avant la coupe à 3.
- **T5** : clé React = `key` de groupe rendue par le use case (stable).
- **Clé de groupe élargie** aux cibles (Cricket, Tour du monde) et à la plage min / max de
  l'entraînement : sans cela, une partie non standard plus récente masquait le groupe standard.
  Les groupes non standard restent écartés par le filtre (critère 9).
- **Piège de fermeture** : `lancer(mode, valeurs = courants(mode))` reste le seul chemin de
  lancement ; `rejouer` écrit les préférences et passe les valeurs de la configuration en
  argument.
- **Nom** : `name` jamais passé par ▶ ; `rejouer` remet la saisie à la proposition, sinon un nom
  tapé à l'étape 2 avant un retour fuirait par l'Ordre (testé).
- **Ordre** : `navigate(cheminOrdre(mode), { state: ETAT_PARCOURS })`, retour → étape 1 (testé).
- **Solo** : lancement direct (entraînement ou 1 joueur), erreur existante sous la section
  (testé).
- **Heure** : `services.clock.now()` ; `libelleDateRelative` compte les jours du calendrier local
  (testé autour du changement d'heure).
- **Pastilles** : `Avatar xs`, couleurs de `partie.profils`.

## Écarts au cahier des charges

- `setJoueurEntrainement` non exposé : `rejouer` vit dans le hook, inutile.
- Port branché sur `matches` / `players` plutôt que sur `GetMatchHistory`.
- Clé de groupe élargie (ci-dessus).

Aucune refonte d'architecture.

## Points soulevés par le Dev

- **D1 — saut de mise en page sur base vide** : au chargement, la rangée compacte s'affiche, puis
  les tuiles 2 × 2 une fois l'historique confirmé vide. Un appui pendant ce changement part sur un
  lien démonté ; 31 tests existants échouaient, réglés en changeant leurs requêtes
  (`findByRole('link', { name: /^X01./ })`, `findByText(/zéro pile/)`). Conséquence directe de U6,
  à arbitrer.
- **D2 — interprétation de U6** : « historique confirmé vide » lu comme « aucune configuration
  affichable après filtrage » ; un historique de parties non rejouables (profil supprimé, hors
  listes) affiche donc les tuiles, sans section Rejouer.

## Arbitrage utilisateur (2026-10-17)

- **D1** : pendant le chargement de l'historique, **rien sous la barre d'étapes** (ni rangée ni
  tuiles) ; corrige U6 (« rangée visible tout de suite »). Renvoyé au Dev, même phase.
- **D2** : interprétation du Dev **confirmée** : aucune configuration rejouable → tuiles 2 × 2,
  sans section Rejouer.

### Second passage du Dev (D1)

- `EtapeJeu.tsx` : rien sous la barre tant que l'historique ou les profils chargent ; puis Rejouer
  + rangée, ou tuiles 2 × 2. Plus de bascule.
- `tests/ui/rejouer.test.tsx` : test de chargement réécrit, test « base vide » ajouté.
- Les 9 tests existants **ramenés à l'état du dépôt** (`git checkout --`, aucun diff) : leurs
  contournements ne servaient qu'à éviter la bascule.
- Charte § Rejouer et PLAN § 4 / § 6 mis à jour.
- Lint, typecheck, build OK ; `npx vitest run` : **1389 tests** verts (+ 49 sur le lot).

### Tours de boucle suivants (résumé ; détail dans `00-orchestration.md` et les phases)

- **Tour 1** (Test → Dev) : F1-F6 — test « terminée » réellement fini, clé de groupe élargie
  testée, D2 et chemin `existe` en UI, ▶ des 4 modes, condition morte retirée → 1397 tests.
- **Tour 2** (Sécurité → Dev) : S1 booléens importés mal typés écartés ; S2 > `MAX_JOUEURS`
  écartés → 1403 tests.
- **Tour 3** (Test → Dev) : entraînement ≠ 1 joueur écarté (branche défensive, R7) ;
  `MAX_JOUEURS` / `JOUEURS_ENTRAINEMENT` déplacés dans `reglagesPossibles.ts` ; bout en bout à 5
  joueurs → 1405 tests.
- **Tour 4** (Revue → Dev) : identifiants du cœur en anglais (`ReplayableConfiguration`,
  `REPLAY_WINDOW`) ; tests R5, R6 (précondition 23 h / 25 h), R9 (date de lancement) ; « Solo »
  dans la rangée compacte ; `disabled:shadow-none` ; docs `CLAUDE.md`, charte, CONVENTIONS, PLAN,
  glossaire → 1408 tests. Écart à la planche noté : pictogramme de la rangée à 24 px (décision
  utilisateur Q1).

## À relire à l'écran

360 px (quatre noms de jeu à ~80 px, « Entraînement », pastilles à la ligne, pseudos longs),
paysage, sombre et clair, saut de mise en page au chargement sur base vide.
