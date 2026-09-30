# Demandes de lot — contrat d'intake

`/intake <id>` écrit ici `docs/request/<id>.md`. `/orchestrate`
revalide le fichier, le copie octet pour octet vers
`docs/lots/<id>/request.md`, et n'en fait pas une session de lot
tout seul.

Une demande n'existe que si l'humain a confirmé explicitement.
Statut `Validé`, zéro question bloquante, sinon le fichier ne
s'écrit pas.

## Sections obligatoires

```markdown
# Demande — <id-du-lot>

- **Statut de validation** : Validé
- **Date de validation** : AAAA-MM-JJ
- **Niveau** : high | light
- **Commande manuelle** : `/orchestrate <id-du-lot> <niveau>`

## Objectif
## Périmètre
## Hors périmètre
## Comportement visible
<!-- À l'écran : portrait, et paysage si c'est un écran de partie.
     Lu à 2-3 m ? Tapé à 30 cm ? -->
## Critères d'acceptation
## Contraintes
## Dépendances
## Risques
## Zones impactées
## Attentes de validation
<!-- Tests attendus, et relecture à l'écran si le rendu change. -->
## Questions bloquantes
<!-- Doit être « aucune ». -->
## Questions non bloquantes
<!-- Owner pour chacune. -->
## Décisions prises pendant l'intake
```

## Règles

- Identifiant = `^[A-Za-z0-9][A-Za-z0-9._-]*$`, pas `_template`.
- `light` interdit si le lot touche `src/core/domain/`, la couture
  `GameMode`, un format persisté (`MatchEvent`, schéma Dexie,
  `backupSchema`), le service worker ou `firebase.json`, ou une règle
  gravée de `CLAUDE.md`.
- Une révision conserve l'historique dans le même fichier.
- Ce dossier n'est **pas** `docs/lots/` : pas de `00-orchestration.md`
  ici.
