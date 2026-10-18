# Demande — phrases-victoire

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-18
- **Niveau** : light
- **Commande manuelle** : `/orchestrate phrases-victoire light`

## Objectif

Retour 7 des beta-testeurs (`docs/prospective/2026-10-17-NEW-retours-beta-testeurs.md`,
lot E) : quand quelqu'un gagne, l'app **dit une phrase rigolote à voix haute**.
Aujourd'hui `phraseVictoire` n'est qu'un texte affiché sur les trois résumés ;
`SpeechAnnouncer` n'y est pas branché.

## Périmètre

1. **Cinq phrases ajoutées** à `PHRASE_VICTOIRE` (9 au total), déjà validées :
   - « Le vainqueur offre la prochaine tournée. »
   - « La cible a rendu son verdict. »
   - « Une victoire qui mérite un petit verre. »
   - « Pas mal pour un soir de semaine. »
   - « Les fléchettes ont encore frappé. »
2. **La voix dit la phrase à la victoire, après *Valider la sortie*.** Elle est
   composée avec l'annonce existante, dans **un seul `say`** (un second appel
   couperait le premier).
   - **X01** : à la victoire du **match** seulement. Une manche intermédiaire
     garde « Checkout » puis le tour suivant, sans phrase.
   - **Cricket** : à la fléchette qui gagne, cut-throat compris.
   - **Tour du monde** : à la **fin de la partie**, une fois le tour de table
     fini. La fléchette qui boucle le parcours garde « Tour bouclé ! ». Pas de
     phrase en cas de match nul.
   - **Entraînement** : aucune phrase (pas de vainqueur).
3. **Même phrase à la voix et à l'écran** : le tirage reste
   `phraseVictoire(identifiant de la partie)`. Rien n'est stocké.
4. **Voix coupée dans les Réglages** : rien n'est dit ; le résumé affiche
   toujours sa phrase.

## Hors périmètre

- Aucune règle de jeu, aucun format persisté, aucune nouvelle préférence.
- Pas de nom du vainqueur dans la phrase, pas de phrases en anglais.
- Pas de phrase à l'entraînement ni à chaque manche X01.

## Comportement visible

Pas de nouvel écran. Un résumé peut afficher une autre phrase qu'avant pour une
même partie, le tirage passant de 4 à 9 choix : sans conséquence, rien n'étant
stocké. Rendu inchangé, donc pas de relecture visuelle.

## Critères d'acceptation

- Les 9 phrases existent ; le tirage est stable pour un même identifiant.
- La voix et le résumé disent la même phrase pour une même partie.
- Rien n'est dit avant la validation, ni sur un bust, ni à l'entraînement.
- Annuler la fléchette de sortie ne dit aucune phrase.
- Au Tour du monde, la phrase suit la fin de partie, pas la fléchette qui boucle.

## Contraintes

- Tout le français dans `labels.ts` ; voix en `fr-FR`.
- Un seul `say` par fin de volée (`annonceFinDeVolee`).
- UI → use cases uniquement ; aucune règle de jeu réimplémentée.
- Pas de réseau ni de donnée stockée : `/confidentialite` inchangée.

## Dépendances

`annulation-volee` et `vocabulaire-anglais` sont déjà dans la branche. Rebase
sur `main` seulement avec l'accord de l'utilisateur.

## Risques

- Une phrase longue après « Checkout » ou le score retarde la main au joueur
  suivant.
- Certaines synthèses vocales lisent mal le tiret long et le « ? » de « Bien
  joué — on remet ça ? » : jamais entendu sur appareil.
- Le moment de la phrase au Tour du monde doit suivre la fin de partie.

## Zones impactées

`labels.ts` (phrases, composition de l'annonce de victoire), `useX01`,
`useCricket`, `useTourDuMonde`, leurs tests, `CLAUDE.md` et
`.claude/CONVENTIONS.md` § 5 (la voix dit désormais une phrase de victoire).

## Attentes de validation

- Tests Vitest : tirage stable sur 9 phrases, composition de l'annonce par mode.
- Tests Testing Library : phrase dite après validation, jamais avant, jamais sur
  un bust, jamais à l'entraînement, jamais en match nul.
- Lint, typecheck, `npx vitest run`, build.
- Pas de relecture à l'écran (rendu inchangé) ; l'écoute sur un vrai téléphone
  reste à faire par l'utilisateur.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Lecture du « — » et du « ? » par la synthèse vocale : à écouter sur appareil
  (owner : utilisateur, après le lot).

## Décisions prises pendant l'intake

- Étude du 2026-10-17 : phrase dite à voix haute, à la victoire ; cinq phrases
  validées telles que proposées ; tirage sans stockage.
- Intake du 2026-10-18 : X01 = victoire du **match** seulement ; Tour du monde
  = **fin de partie** ; niveau `light` (ni domaine, ni couture `GameMode`, ni
  format persisté).
