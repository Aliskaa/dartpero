# Demande — volee-partielle

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-19
- **Niveau** : high
- **Commande manuelle** : `/orchestrate volee-partielle high`

## Objectif

Les fléchettes déjà saisies dans la volée en cours survivent à un rechargement. Si Android tue la
PWA ou si iOS la recharge, la partie rouvre avec elles, sans message. Aujourd'hui elles disparaissent :
`dartsEnCours` est un `useState` des quatre hooks de mode (constat relevé dans
`docs/prospective/2026-10-13-NEW-revision-charte-graphique.md`, « Constats hors charte »).

## Périmètre

- Un **brouillon de volée**, une ligne par partie, dans une table Dexie dédiée : nouvelle
  `db.version(3)`, migration et test de migration.
- Un port driven et un use case : le brouillon s'écrit à chaque fléchette, se lit à l'ouverture de la
  partie et s'efface à l'enregistrement de la volée.
- Les **quatre modes** : X01, Cricket, Tour du monde, entraînement. Un seul mécanisme, le même dans
  les quatre hooks.
- La volée rouverte par « Annuler » (lot `annulation-volee`) devient durable : ses fléchettes
  restantes survivent à un rechargement. Cela lève la limite acceptée « perdue si l'app se ferme ».
- Un brouillon incohérent avec le journal est **écarté**, jamais appliqué.
- Le brouillon est effacé quand sa partie est supprimée, ou quand une restauration remplace la base.

## Hors périmètre

- Le journal et `MatchEvent` ne changent pas : aucun événement par fléchette.
- Aucun `backupSchema`, aucun export ni import du brouillon ; `BACKUP_VERSION` ne bouge pas.
- Aucun `localStorage` (`rules/persistence.md`).
- Aucun bandeau ni message à la reprise, donc pas de planche.
- Un seul brouillon par partie.
- Aucune synchronisation.

## Comportement visible

- Après le rechargement, l'écran de match est identique à celui d'avant : les fléchettes posées sont
  dans la volée et le pavé est prêt, en portrait comme en paysage.
- Si la fléchette de sortie était en attente, la boîte « Valider la sortie » se rouvre : elle est
  dérivée (`sortieEnAttente`), jamais stockée.
- Rien n'est dit ni célébré à la reprise : la voix et la célébration restent derrière « Valider la
  sortie ».

## Critères d'acceptation

1. Une ou deux fléchettes saisies, app rechargée : elles sont restituées à l'identique, dans les
   quatre modes.
2. Après un « Annuler » sur une volée enregistrée, la volée rouverte et ses fléchettes restantes
   survivent à un rechargement.
3. À l'enregistrement de la volée (3 fléchettes, bust, sortie validée), le brouillon est effacé.
4. Un brouillon périmé ou incohérent avec le journal est écarté sans erreur.
5. Une sauvegarde exportée ne contient aucun brouillon ; une ancienne sauvegarde s'importe toujours.
6. La saisie ne ralentit pas : l'écriture du brouillon ne grise pas le pavé.
7. Les tests de migration v2 → v3 et d'import passent, avec des fakes et sans mocks.

## Contraintes

- `rules/persistence.md` : Dexie derrière un port, une migration qui ne jette rien, pas de
  `localStorage` pour une donnée de partie.
- Architecture hexagonale : port driven + use case, câblé dans `src/composition/container.ts` ; l'UI
  ne touche jamais Dexie.
- Aucune nouvelle règle de jeu.
- Un échec d'écriture du brouillon ne bloque jamais la saisie.

## Dépendances

- Le lot `annulation-volee` est fusionné (`ReopenedVisit`, `sortieEnAttente` dérivé).

## Risques

- Échec d'écriture du brouillon : la saisie continue, seul le brouillon manque.
- Brouillon orphelin si la partie est supprimée ou la base restaurée.
- Course entre l'écriture du brouillon et l'enregistrement de la volée.
- `CLAUDE.md` grave que la volée rouverte est « non persistée » (lot `annulation-volee`) : ce lot la
  renverse en connaissance de cause. `CLAUDE.md`, `CONVENTIONS` § 10, `PROJECT_PLAN` et l'index
  d'architecture sont à mettre à jour dans le lot.
- Une table Dexie de plus touche la politique `/confidentialite` : relire `SECTIONS_CONFIDENTIALITE` et
  sa date, les mettre à jour si le texte devient faux.

## Zones impactées

- `src/infrastructure/dexie/` (schéma, migration), ports et use cases de
  `src/core/application/`, les quatre hooks de mode (`useX01`, `useCricket`, `useTourDuMonde`,
  `useCheckoutPractice`), `src/composition/container.ts`, `tests/`.
- Documentation : `CLAUDE.md`, `.claude/CONVENTIONS.md`, `docs/PROJECT_PLAN.md`, index d'architecture.

## Attentes de validation

- Tests de migration (v2 → v3), d'import, du brouillon (écriture, lecture, effacement, incohérence)
  et des quatre hooks, avec des fakes.
- Relecture à l'écran, sur téléphone : saisir 1 à 2 fléchettes, tuer l'onglet ou la PWA, rouvrir ;
  refaire avec une volée rouverte par « Annuler », puis avec la sortie en attente.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Clé de cohérence du brouillon (longueur du journal ou dernier événement) : architecte du lot.
- Texte et date de la politique de confidentialité à mettre à jour : architecte, puis Revue.

## Décisions prises pendant l'intake

Le 2026-10-19, l'utilisateur a tranché :

- Brouillon à part (table Dexie dédiée), pas d'événement de journal par fléchette.
- Les quatre modes.
- Brouillon jamais exporté : `backupSchema` et `BACKUP_VERSION` inchangés.
- Reprise silencieuse, sans bandeau.
- Niveau `high` : format persisté et décision gravée du lot `annulation-volee`.
