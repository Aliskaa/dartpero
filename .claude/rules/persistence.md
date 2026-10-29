---
paths:
  - "src/infrastructure/dexie/**"
  - "src/core/domain/events/**"
  - "src/core/application/backupSchema.ts"
  - "src/core/application/use-cases/ManageBackupUseCase.ts"
---

# Persistance — Dexie, journal, sauvegarde

**Quand :** `src/infrastructure/dexie/`, un type d'événement
(`src/core/domain/events/`), `backupSchema.ts`, `ManageBackupUseCase`.
**Surface gravée** : un lot qui touche ici est en niveau `high`.

- Dexie derrière les ports `MatchRepository` / `PlayerRepository` /
  `VisitDraftRepository`, et nulle part ailleurs. Jamais d'adapter instancié hors de
  `src/composition/container.ts`, jamais de Dexie dans l'UI.
- **Le match est une liste d'événements.** On ajoute un événement, on ne
  réécrit pas le passé. Ce qui est tiré au sort est **écrit** dans le
  journal, jamais recalculé au rejeu.
- ⚠️ **Une valeur persistée ne se renomme pas** (`MatchStarted` reste
  `MatchStarted`, même si le nom paraît mal choisi aujourd'hui). Le mode
  se lit sur l'événement d'ouverture — `CONVENTIONS` § 13.
- Un changement de schéma = une nouvelle `db.version(N)` dans `database.ts`
  — avec son `upgrade` quand des données changent de forme (une table neuve,
  comme `visitDrafts` en v3, n'en a pas besoin) — et un test de migration
  (v1 → v2, v2 → v3 comme modèles). Une migration ne jette pas de données
  sans filet.
- **Un champ facultatif d'un profil** (`Player.gender`, lot `killer`) : clé **absente** quand « non précisé »
  (étalement conditionnel à l'écriture, à la lecture et à l'export, jamais `gender: undefined`) ; un champ
  **non indexé** ne demande ni `db.version` ni `upgrade` (preuve : `color` et `createdAt`, la v2 sans
  `.stores()`) ; `BACKUP_VERSION` ne change pas ; une valeur invalide dans un fichier fait **ignorer le profil**
  (compté dans `playersSkipped`), jamais planter. Les valeurs persistées (`MASCULINE`, `FEMININE`) ne se
  renomment pas.
- **Une donnée par joueur d'une partie** (les numéros du Killer, `KillerStarted.numbers`) se range dans
  l'événement d'ouverture, indexée comme `playerIds`, **hors de la config** ; l'import **projette** le journal de
  tout mode avant d'écrire (un journal qui ne se rejoue pas est refusé et compté).
- **Le brouillon de volée** (`visitDrafts`, lot `volee-partielle`) vit hors
  du journal : jamais exporté, jamais dans `backupSchema`, effacé à
  l'enregistrement de la volée, à la suppression de la partie et à l'import
  qui la remplace. Ses noms persistés ne se renomment pas non plus.
- Un changement de format d'événement ou de profil = `backupSchema` mis à
  jour **dans le même lot**. Une sauvegarde d'une version antérieure doit
  toujours s'importer (le lot 5c l'a appris : `backupSchema` ne
  connaissait que le X01).
- Un champ **facultatif** absent = **clé absente**, jamais
  `name: undefined` (le clonage d'IndexedDB garderait la clé). Un ajout
  facultatif n'incrémente pas `BACKUP_VERSION` : l'ancienne sauvegarde
  reste valide telle quelle (lot `nom-de-partie`).
- L'import JSON est une **entrée non fiable** : validé entièrement avant la
  moindre écriture. Depuis le lot `ecran-miroir`, il n'est plus la seule :
  s'y ajoutent les deux **jetons scannés** (offre lue par le miroir,
  réponse lue par la saisie) et les **messages reçus par le miroir**,
  validés par `mirrorProtocol.ts` (qui réutilise `versMatchRecord` /
  `versDart` de `backupSchema` **sans les modifier**).
- ⚠️ **L'écran miroir ne persiste rien.** Le protocole (`partie`, `volee`,
  `arret`) et le jeton de jumelage ne sont **jamais** écrits, ni exportés,
  ni dans `backupSchema` ; `WatchMatchUseCase` n'a **aucun dépôt** ;
  aucune clé de préférence, aucun `sessionStorage`. Rechargé, le miroir
  refait le jumelage.
- `localStorage` : préférences d'appareil seulement
  (`LocalStoragePreferences`, amorçage du thème). Jamais une donnée de
  partie ou de joueur.
