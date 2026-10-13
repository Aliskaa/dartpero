# Demande — annuler-double-tap

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-13
- **Niveau** : light
- **Commande manuelle** : `/orchestrate annuler-double-tap light`

## Objectif

Qu'un double appui réflexe sur « Annuler » ne défasse jamais la volée d'un autre joueur, ni une
manche gagnée, alors qu'on voulait seulement retirer une fléchette.

Origine : étude `docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, § Constats hors
charte (double tap sur « Annuler T20 », `useX01.ts:143-147`), lot 1 du découpage.

## Périmètre

- Les quatre hooks de mode : `useX01`, `useCricket`, `useTourDuMonde`, `useCheckoutPractice`.
- **Pause de 1 seconde** : quand un appui retire la **dernière** fléchette de la volée en cours
  (la volée devient vide), le bouton refuse d'annuler une volée enregistrée pendant 1 s.
- **Garde dans le hook** : `annuler` ne fait rien pendant une écriture en cours (`occupe`), en
  plus de la désactivation du bouton à l'écran.

## Hors périmètre

- Retirer une fléchette quand il en reste d'autres : aucune pause, deux appuis retirent deux
  fléchettes.
- Une confirmation avant d'annuler une volée enregistrée : écartée, un appui suffit toujours après
  la pause.
- Remettre en saisie les fléchettes d'une volée annulée pour n'en corriger qu'une : idée notée,
  pas ce lot.
- Le domaine et le journal : `undoLastVisit` est inchangé.

## Comportement visible

- Pendant la pause, le bouton « Annuler » est désactivé (même aspect que pendant une écriture),
  puis redevient actif. Lu à 30 cm, sur le pavé de saisie.
- L'étiquette passe de « Annuler T20 » à « Annuler » comme aujourd'hui ; le nom accessible reste
  « Annuler la volée de Julien ».
- Identique en portrait et en paysage.

## Critères d'acceptation

1. Une fléchette en cours : deux appuis rapides retirent la fléchette, et la volée enregistrée
   précédente reste intacte.
2. Après 1 s, un appui annule la dernière volée enregistrée, même si elle avait gagné une manche
   (comportement actuel).
3. Deux fléchettes en cours : deux appuis rapides retirent les deux, sans pause entre elles.
4. Aucune fléchette en cours : un seul appui annule la volée précédente, sans pause.
5. Pendant une écriture en cours, `annuler` ne lance aucune annulation.
6. Les critères 1 à 5 tiennent dans les quatre modes. À l'entraînement, la « volée enregistrée »
   est la dernière manche jouée.

## Contraintes

- Aucune lecture de l'heure par `Date.now()` (garde `tests/architecture/horlogeBoundary.test.ts`) :
  l'instant de la pause se lit par `services.clock`, remplacée par une horloge factice en test. Un
  minuteur ne sert qu'à réactiver le bouton à l'écran.
- Fakes, jamais de mocks (`.claude/rules/testing.md`) ; rendu par `renderWithServices`, gestes
  par `tests/ui/gestes.ts`.
- Tout texte éventuel dans `src/ui/labels.ts`.

## Dépendances

Aucune.

## Risques

- Quelqu'un qui veut vraiment enchaîner « retirer la fléchette » puis « annuler la volée
  précédente » attend 1 s. Assumé.
- Quatre hooks presque identiques : en oublier un. D'où le critère 6, testé mode par mode.

## Zones impactées

- `src/ui/hooks/useX01.ts`, `useCricket.ts`, `useTourDuMonde.ts`, `useCheckoutPractice.ts`.
- Éventuellement un petit utilitaire partagé par les quatre hooks (choix d'architecture).
- Tests UI : `tests/ui/x01.test.tsx`, `cricket.test.tsx`, `tourDuMonde.test.tsx`, et le test de
  l'entraînement.

## Attentes de validation

- Tests Testing Library pour chaque critère, dans les quatre modes ; le temps avance par
  l'horloge factice.
- Contre-épreuve : retirer la pause fait échouer le test du critère 1.
- Relecture à l'écran : bouton grisé puis réactivé, et double appui sur un vrai téléphone
  (Chrome Android).

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Logique partagée entre les quatre hooks (utilitaire commun) ou recopiée — owner :
  architecture (`archi-scout`).

## Décisions prises pendant l'intake

- Courte pause plutôt que confirmation : annuler la volée précédente est fréquent, car la
  3ᵉ fléchette s'enregistre aussitôt. Choix de l'utilisateur.
- Durée : 1 seconde. Choix de l'utilisateur.
- La pause ne vaut qu'au passage « dernière fléchette retirée → volée enregistrée ».
- Le garde sur l'écriture en cours est une défense en profondeur, pas un bug constaté : le bouton
  est déjà désactivé pendant l'écriture, et React redessine entre deux appuis.
- Niveau `light` : seuls des hooks de l'UI changent, aucune surface gravée.
