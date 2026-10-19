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
- L'import JSON est la **seule entrée non fiable** de l'appli : validé
  entièrement avant la moindre écriture.
- `localStorage` : préférences d'appareil seulement
  (`LocalStoragePreferences`, amorçage du thème). Jamais une donnée de
  partie ou de joueur.
