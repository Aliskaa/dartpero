# Prospective

**Quand :** l'utilisateur demande une étude, une comparaison, une analyse
ou une exploration — sans demander de l'implémenter.

- Ne modifier **aucun** fichier hors `docs/prospective/`.
- Créer ou mettre à jour du Markdown dans ce dossier.
- Pas de changement de code, de règles actives, ni de `CLAUDE.md`, sauf
  demande explicite.
- Une exploration qui débouche sur une décision ne la grave pas
  elle-même : elle devient un `/intake` ou un `/orchestrate`, et c'est le
  lot qui met `CLAUDE.md` à jour.

## Nommage

```
YYYY-MM-DD-{NEW|PARTIAL|DONE}-titre-en-kebab-case.md
```

Exemple : `2026-10-02-NEW-killer-et-shanghai.md`.

- Date = jour de **création** du fichier (ISO).
- Statut obligatoire : `NEW` · `PARTIAL` · `DONE`.
- Titre : minuscules, tirets seuls (pas d'espaces, pas de `_`).
- Renommer un fichier existant seulement si la convention change ou si
  l'utilisateur le demande.
