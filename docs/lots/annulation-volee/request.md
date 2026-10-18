# Demande — annulation-volee

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-17
- **Niveau** : high
- **Commande manuelle** : `/orchestrate annulation-volee high`

## Objectif

Deux retours de beta-testeurs sur l'erreur de saisie en pleine volée
(`docs/prospective/2026-10-17-NEW-retours-beta-testeurs.md`, lots C et D
fondus) :

- **Retour 8** : annuler une volée enregistrée ne l'efface plus en entier,
  au risque de ne plus se souvenir de ce qu'il y avait ; on retire **une
  fléchette à la fois**, la dernière.
- **Retour 3** : la fléchette qui gagne demande une **confirmation** avant
  de terminer quoi que ce soit.

## Périmètre

1. **Annulation d'une fléchette à la fois**, dans les quatre modes (X01,
   Cricket, Tour du monde, entraînement).
   - Un appui retire la dernière fléchette jouée, quel que soit le joueur :
     celui qui est en train de jouer ou celui dont la volée vient d'être
     enregistrée.
   - La volée enregistrée se rouvre : le joueur redevient actif, garde ses
     fléchettes restantes, son reste suit les fléchettes encore posées.
   - Libellé de la touche : « Annuler S5 ». Le joueur n'est que dans le nom
     accessible (« Annuler S5 de Kevin »).
   - La touche est grisée quand il n'y a plus rien à retirer.
   - La pause anti-réflexe (`PAUSE_ANNULATION_MS`, 1 s) est conservée.
2. **Cas de bord rejoués correctement par la projection** : un bust défait
   (la volée perdue se rouvre), une manche gagnée défaite (elle n'est plus
   gagnée), une annulation à cheval sur deux joueurs dont le suivant a déjà
   commencé à jouer.
3. **Confirmation de la sortie, forme B** : une boîte « Kevin sort sur
   D10 ? » avec deux boutons, *Corriger* et *Valider la sortie*.
   - **X01** : à **chaque manche** gagnée.
   - **Cricket** : à la fléchette qui gagne la partie.
   - **Tour du monde** : à la fléchette qui **boucle le parcours**. La
     victoire se joue ensuite à la fin du tour de table, sans autre boîte.
   - **Entraînement** : **pas** de confirmation, seulement l'annulation
     fléchette par fléchette.
   - *Corriger* retire la fléchette de sortie, qui n'est pas enregistrée.
     *Valider la sortie* enregistre la volée ; la voix et la célébration
     n'arrivent qu'après.
   - Le **bust** n'est jamais confirmé.

## Hors périmètre

- Aucune règle de jeu ne change (`CLAUDE.md` § Règles du jeu).
- Pas de phrase de victoire (lot E), pas de vocabulaire « Checkout » (lot A),
  pas de statistiques « Hors » (lot B).
- Pas de forme A (touche « Valider la sortie ») : seule la B est retenue.
- Aucun nouveau format persisté n'est visé ; à l'architecte de le confirmer
  (le lot est de toute façon `high`).

## Comportement visible

Planche validée, suivie **à l'identique** :
`C:\Users\kevin\Documents\Flechettes\docs\maquettes\annulation\annulation.html`
(<https://claude.ai/artifact/6kxertheaGd44qgbRidnsv>).

- Écran de partie en portrait et en paysage : même disposition ; seuls
  changent le contenu des cases et le libellé de la touche.
- Exemple de la planche : Kevin a joué T20·T19·S5 (384), c'est à Julien.
  Trois appuis de suite : 441, puis 501, la ligne de Kevin redevient active
  à chaque fois.
- La boîte de confirmation s'ouvre par-dessus l'écran (`<dialog>` natif,
  `useModaleAuRetour` + `useDialogueNatif`) ; lue à 2-3 m (nom du joueur et
  fléchette en grand), boutons tapés à 30 cm (≥ 48 px).
- Thème clair : mêmes classes, valeurs de tokens redéfinies.

## Critères d'acceptation

- Trois appuis sur « Annuler » après T20·T19·S5 : 384, 441, 501, avec Kevin
  actif et le tour revenu à lui.
- Un bust défait rouvre la volée ; une manche gagnée défaite n'est plus
  gagnée ; la projection reste correcte avec un joueur suivant déjà
  commencé.
- Aucune confirmation sur un bust ni à l'entraînement ; *Corriger* revient
  à la volée en cours, *Valider la sortie* l'enregistre.
- Un second appui dans la seconde qui suit le retrait de la dernière
  fléchette d'un joueur ne défait pas la volée du joueur d'avant.
- Les journaux existants se rejouent sans migration ; l'export / import
  JSON reste valide.
- La voix n'annonce la victoire qu'après *Valider la sortie*.

## Contraintes

- Le journal reste une liste d'événements, l'état affiché une projection.
- UI → use cases uniquement (`useServices()`) ; tout le français dans
  `labels.ts`, « manche » et jamais « leg » à l'écran.
- Tokens de couleur en paires de rôle ; angle vif ; cibles ≥ 48 px.
- Pas de réseau, pas de nouvelle donnée stockée (politique
  `/confidentialite` inchangée).

## Dépendances

Aucune. Le lot partage `labels.ts`, la charte et `CONVENTIONS` avec les
lots A et E : conflits attendus au rebase, à résoudre en gardant les deux
apports. Lot mené en parallèle (worktree, port de capture 5202).

## Risques

- Rouvrir une volée enregistrée sans produire un état incohérent
  (`VisitRecorded` ne porte pas de `playerId`, le tour se déduit du journal).
- La fléchette de sortie en attente n'est pas dans le journal : si l'app se
  ferme sur la boîte, elle est perdue, comme les fléchettes en cours
  aujourd'hui.
- La voix annonce aujourd'hui la victoire dès la dernière fléchette ; elle
  doit désormais attendre la validation.
- Le Tour du monde finit le tour de table : la confirmation ne doit pas
  laisser croire que la partie s'arrête.

## Zones impactées

`UndoLastVisit` et son use case, `UndoLastVisitUseCase`, les use cases
d'annulation des trois autres modes, `useX01`, `useCricket`,
`useTourDuMonde`, `useCheckoutPractice`, `usePauseAnnulation`, les pavés de
saisie, `labels.ts` (touche d'annulation, boîte), une nouvelle boîte de
confirmation, `docs/CHARTE_GRAPHIQUE.md` et `.claude/CONVENTIONS.md`.

## Attentes de validation

- Tests de domaine / use cases : retrait d'une fléchette d'une volée
  enregistrée, bust défait, manche gagnée défaite, deux joueurs.
- Tests Testing Library : la touche (libellé, nom accessible, grisée, pause)
  et la boîte (Corriger, Valider, aucun bust, aucun entraînement).
- Lint, typecheck, `npx vitest run`, build.
- **Relecture à l'écran** (port 5202) : portrait et paysage, thèmes sombre
  et clair, quatre modes.

## Questions bloquantes

Aucune.

## Questions non bloquantes

Aucune.

## Décisions prises pendant l'intake

- Étude du 2026-10-17 : annulation fléchette par fléchette ; touche
  « Annuler S5 », joueur dans le nom accessible seulement ; confirmation de
  la sortie en **forme B** ; confirmation pour tous les jeux ; bust non
  confirmé ; planche validée.
- Intake du 2026-10-17 : X01 confirme **chaque manche** gagnée ; Tour du
  monde confirme la fléchette qui **boucle le parcours** ; l'entraînement
  **n'a pas** de confirmation ; le lot D est fondu dans ce lot.
- Niveau `high` : surfaces gravées (`UndoLastVisit`, journal d'événements,
  règles de fin de partie).
