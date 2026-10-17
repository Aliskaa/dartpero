---
paths:
  - "tests/**"
  - "vite.config.ts"
---

# Tests

**Quand :** tests, helpers de test, config Vitest. Détail :
`CONVENTIONS` § 11.

- **Vitest**, environnement **jsdom**, fichiers
  `tests/**/*.test.{ts,tsx}`. Pas de second runner.
- **Fakes, jamais de mocks** — `tests/fakes/index.ts`. Pas de Dexie dans
  un test unitaire ; les adapters Dexie se testent à part sur
  `fake-indexeddb`.
- Déterminisme : `Clock`, `IdGenerator`, `RandomSource` fakes. Un test
  daté construit ses bornes en heure **locale**, dans le fuseau fixé
  des tests (`test.env.TZ = 'Europe/Paris'`, `vite.config.ts`). Un test
  qui franchit un changement d'heure vérifie d'abord la durée du jour
  (23 h / 25 h) : sous UTC, il serait vert sans rien prouver
  (`CONVENTIONS` § 11).
- Une règle commune aux modes : `it.each(GAME_MODE_IDS)`, jamais une
  liste de modes recopiée.
- `fakeServices()` enveloppe le **vrai** `createServices` : ne jamais
  réimplémenter le composition root dans un test.
- Intitulés `describe` / `it` en français, au plus près de la règle de
  `CLAUDE.md` qu'ils vérifient.
- UI : requêtes par rôle accessible, gestes via `tests/ui/gestes.ts`,
  rendu via `renderWithServices`.
- ⚠️ **Un test qui vérifie une absence doit pouvoir échouer.** Plancher
  de fichiers / imports trouvés dans les gardes d'architecture ;
  vérifier qu'un nouveau test casse si on casse ce qu'il protège.
- Cas de bord attendus par défaut : bust (reste < 0, = 1, = 0 sans
  double), bogey numbers, annulation puis rejeu à froid du journal (ce
  qui est tiré au sort doit survivre), égalité / match nul, joueur
  supprimé, base vide, vieille sauvegarde importée.
- ⚠️ **Ce qui ne se voit qu'à l'écran ne se voit pas en test** : glyphe
  rogné, texte tronqué, contraste. Le dire comme angle mort.
