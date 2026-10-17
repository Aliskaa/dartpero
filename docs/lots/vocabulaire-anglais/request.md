# Demande — vocabulaire-anglais

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-17
- **Niveau** : light
- **Commande manuelle** : `/orchestrate vocabulaire-anglais light`

## Objectif

Les beta-testeurs veulent des mots de darts à l'anglaise : « bust » et « checkout » dits avec
l'accent anglais à la voix, « Checkout » à la place de « Sortie » à l'écran, et « Hors » à la
place de « 0 » dans les statistiques. Lot A de
`docs/prospective/2026-10-17-NEW-retours-beta-testeurs.md` (retours 1, 5 et 6).

## Périmètre

1. **Voix : « bust » et « checkout » dits en `en-US`.**
   - L'affichage de « Bust » ne change pas.
   - Une annonce devient une suite de **segments** `{ texte, langue }`. `Announcer.say` les
     accepte ; `SpeechAnnouncer` les enchaîne en `SpeechSynthesisUtterance` successifs
     (`fr-FR` pour le français, `en-US` pour ces deux mots) et ne coupe que l'annonce précédente,
     jamais les segments entre eux.
   - Une voix de la langue du segment est choisie, avec repli sur la voix actuelle.
   - La langue de chaque segment vient de `labels.ts` (`annonceVolee`, `annonceIssue`,
     `annonceFinDeVolee`…), jamais écrite en dur dans l'adapter : l'i18n est annoncée pour
     bientôt, le jour venu on change la langue de base sans refaire le mécanisme.
2. **« Sortie » devient « Checkout » partout à l'écran** : suggestion, boutons, statistiques,
   règles (`reglesDuJeu.ts`, `reglesX01`…), annonces, libellés des réglages, cartes, entraînement
   (« Sortie 8 », choix de 5, 10 ou 20 sorties). « Manche » reste « manche ». Identifiants de code
   et clés persistées inchangés.
3. **Statistiques : « 0 » devient « Hors »** (`LIBELLE_HORS`), à l'affichage seulement.
4. Documentation : ligne « checkout / sortie » de `rules/glossary.md`, mentions de `CLAUDE.md`,
   vérification que `SECTIONS_CONFIDENTIALITE` ne cite pas ces mots (sinon texte et date au même lot).

## Hors périmètre

- La traduction elle-même, le choix de langue, tout i18n.
- La moyenne de « Hors » par partie et la couleur de « Hors » (lot B `hors-statistique`).
- Le tirage et le contenu des phrases de victoire (lot E).
- Toute règle de jeu, tout événement, tout format persisté, tout identifiant de code.

## Comportement visible

Écran de match lu à 2-3 m : « Checkout » remplace « Sortie ! » dans le bandeau d'issue de
volée et la suggestion. Statistiques lues à 30 cm : « Hors » où l'on lisait « 0 ». À la voix :
« Bust » et « Checkout » prononcés à l'anglaise au milieu d'une phrase française.

## Critères d'acceptation

- Plus aucun « Sortie » / « sortie(s) » affiché dans `src/ui` au sens de la règle (hors mots
  courants sans rapport, listés dans les notes du Dev).
- L'annonce d'un bust et d'un checkout contient un segment `en-US` pour ce mot seul ; le reste
  reste `fr-FR`.
- Les segments d'une même annonce se disent dans l'ordre, sans se couper ; une nouvelle annonce
  coupe l'ancienne.
- Sans voix `en-US` installée, l'annonce se dit quand même (repli).
- Les statistiques affichent « Hors » là où la valeur « 0 » désignait les fléchettes hors cible.

## Contraintes

- Hexagonal : le port `Announcer` évolue côté application ; seul l'adapter touche
  `speechSynthesis`. Textes dans `labels.ts`.
- Aucune surface gravée touchée (domaine, `GameMode`, format persisté, service worker).
- Vocabulaire : respecter `rules/glossary.md` une fois mis à jour.

## Dépendances

Aucune. Ne pas lancer en parallèle du lot E (`phrases-victoire`) : `labels.ts` partagé.

## Risques

- Le rendu de l'accent dépend des voix installées sur chaque téléphone (Android / iPhone).
- Remplacement en masse : phrases à retoucher à la main (« la sortie libre » → accord, début de
  phrase, majuscules).
- Un `say` appelé avec une chaîne ailleurs dans l'app : tous les appelants à migrer.

## Zones impactées

`src/core/application/ports/driven/Announcer.ts`, `src/infrastructure/device/SpeechAnnouncer.ts`,
`src/ui/labels.ts`, `src/ui/reglesDuJeu.ts`, `StatistiquesEcran.tsx`, hooks de partie
(`useX01`, `useCricket`, `useCheckoutPractice`…), `rules/glossary.md`, `CLAUDE.md`, tests associés.

## Attentes de validation

- Tests : annonce segmentée (langue, ordre, pas de coupure entre segments), repli sans voix
  `en-US`, libellés, adapter avec une fausse `speechSynthesis`.
- Lint, typecheck, `npx vitest run`, build, Grep d'encodage.
- Relecture à l'écran (port 5201) : match X01 portrait et paysage, Statistiques, feuille de règles,
  sombre et clair.
- Écoute sur un vrai téléphone de l'accent (hors CI).

## Questions bloquantes

Aucune.

## Questions non bloquantes

- « Checkout libre » / « sortie libre » : formulation exacte du réglage — owner : Dev, à signaler
  dans les notes si la lecture est bancale.

## Décisions prises pendant l'intake

- 2026-10-17 : annonces en segments typés par langue (anticipation i18n), plutôt qu'une
  écriture phonétique ou une voix anglaise pour toute l'annonce.
- 2026-10-17 : « checkout » dit en `en-US` comme « bust ».
- 2026-10-17 : retour 5 limité au remplacement d'affichage ; la moyenne reste au lot B.
- 2026-10-17 : « Checkout » aussi dans l'entraînement.
