# Demande — hors-statistique

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-18
- **Niveau** : light
- **Commande manuelle** : `/orchestrate hors-statistique light`

## Objectif

Deux retours des beta-testeurs (lot B de
`docs/prospective/2026-10-17-NEW-retours-beta-testeurs.md`, retours 2 et 4) :
la touche « Hors » du pavé prend une autre couleur, et Statistiques affiche la
moyenne de fléchettes « hors cible » par partie (« 27 fois 0 ne veut rien
dire »).

## Périmètre

1. **Touche « Hors »** (`PaveSaisie.tsx`, commune aux quatre jeux) : texte et
   bordure **rouges** (piste 1 de la planche
   `C:\Users\kevin\Documents\Flechettes\docs\maquettes\hors\hors.html`,
   <https://claude.ai/artifact/3NiEtCXcC6xaFmEFd1qFkB>). La couleur de repos passe
   par `--texte-touche` (garde `appuiBoundary`), jamais par un utilitaire `text-*`.
2. **Moyenne par partie** dans `BlocCible` (`StatistiquesEcran.tsx`) : la colonne
   « hors cible » ne change pas ; une **ligne dédiée dessous** dit
   « Hors cible par partie 2,6 sur 16 parties » (disposition 3 de la planche).
   Calcul : `hits.missed ÷ matchesPlayed`, deux champs déjà exposés par
   `PlayerCareer`.
3. **Total à zéro** : la colonne écrit « 0 » (le mot « Hors » du lot A lisait mal
   le retour 5) et la ligne dit « 0,0 par partie ».
4. Libellés dans `labels.ts` : virgule décimale française, un chiffre après la
   virgule, « 1 partie » au singulier. Jeton rouge et sa garde mis à jour dans le
   même lot (`theme-colors.md`).

## Hors périmètre

- Le résumé de partie (`CarteImpacts`, « Hors cible ×N »).
- Toute autre statistique, le tri des joueurs, tout format persisté.
- `src/core/` : aucun champ ajouté à `CareerStats`.
- Les phrases de victoire (lot E).

## Comportement visible

- **Pavé de saisie** (tapé à 30 cm, portrait et paysage) : « Hors » en rouge entre
  la Bulle et Annuler, reconnaissable d'un coup d'œil, cible ≥ 48 px inchangée.
  Distincte de la Bulle, qui a un fond rouge plein à 25 %.
- **Statistiques** (lues à 30 cm) : sous la rangée des trois cases favorites et du
  compte « hors cible », une ligne discrète « Hors cible par partie 2,6 sur
  16 parties ».

## Critères d'acceptation

- La touche « Hors » est rouge dans les quatre jeux, sombre et clair, sans casser
  l'inversion à l'appui.
- Contraste du texte ≥ 4,5:1 sur le fond de la touche dans les deux thèmes.
- La ligne affiche `missed ÷ matchesPlayed` à une décimale, virgule française.
- Total à zéro : colonne « 0 », ligne « 0,0 par partie ».
- « 1 partie » au singulier ; pas de division par zéro (un joueur listé a au moins
  une partie).
- Le dénominateur suit le même filtre de période que le numérateur (X01 seul,
  parties en cours comprises).

## Contraintes

- Division dans un **helper pur de `src/ui`**, testé ; pas dans le domaine.
- Couleur par tokens en paires de rôle ; `rouge-texte` est réservé à
  `FeuilleRegles` / `LivreRegles` : soit un jeton général avec sa valeur claire,
  soit élargir la garde `themeBoundary` (`rules/theme-colors.md`).
- Textes dans `labels.ts`. Angle vif, aucun dégradé.

## Dépendances

Lot A `vocabulaire-anglais` livré (« Hors » en colonne). À ne pas lancer en
parallèle du lot E (`phrases-victoire`) : `labels.ts` partagé.

## Risques

- Rouge de la touche confondu avec la Bulle ou avec un état d'erreur.
- Contraste du rouge sur le fond de touche en thème clair.
- Une garde de jeton qui ne voit pas un usage détourné.

## Zones impactées

`src/ui/composants/commun/PaveSaisie.tsx`, `src/ui/ecrans/StatistiquesEcran.tsx`,
`src/ui/labels.ts`, `src/index.css`, `tests/architecture/themeBoundary.test.ts`
(si la garde change), `rules/theme-colors.md` (si jeton), tests associés.

## Attentes de validation

- Tests : helper (arrondi, virgule, zéro, singulier), rendu de la ligne, garde de
  thème.
- Lint, typecheck, `npx vitest run`, build.
- Relecture à l'écran : pavé des quatre jeux et Statistiques, portrait et paysage,
  sombre et clair.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Jeton rouge nouveau ou élargissement de la garde de `rouge-texte` — owner : Dev,
  à signaler dans ses notes.

## Décisions prises pendant l'intake

- 2026-10-18 : touche « Hors » en rouge (piste 1), moyenne en ligne dédiée
  (disposition 3), total à zéro écrit « 0 » (validé sur planche).
- 2026-10-18 : calcul de la moyenne dans l'UI (option A), donc `light` ; aucune
  surface gravée touchée.
