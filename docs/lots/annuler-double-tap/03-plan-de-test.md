# Lot `annuler-double-tap` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high, frontmatter).

## Passe 2 — GO (après boucle 1, tour 1)

Dev n'a modifié que `tests/ui/annulationDoubleTap.test.tsx`. Le sous-agent `test` n'avait pas de
shell : jugement sur relecture. Revérifié par l'Orchestrator : lint OK (248 fichiers), typecheck
OK, 52 fichiers / **803 tests verts**.

| # | Statut | Justification (Test) |
|---|---|---|
| T1 | Corrigé | `MODES` est un `Record<GameModeId, Mode>` (l. 56) ; blocs écran (l. 141) et hook (l. 276) en `describe.each(GAME_MODE_IDS)`. Un 5ᵉ mode échouerait deux fois : clé manquante au typecheck (`tests` dans `tsconfig.json`), et `MODES[nouveau]` indéfini à l'exécution. Contre-épreuve Dev : clé renommée → TS2353 |
| O1 | Corrigé | État lu par `services.getMatchState` : pendant la pause `history` 1, `legNumber` 1, `legsWonInSet` 1 ; après l'annulation `history` 0, `remaining` 40, `legsWonInSet` 0, `legNumber` 0 — cohérent avec `x01/rules.ts` (l. 69, 127, 132-136, 162). Rouge si la garde cédait. `remaining` seul ne prouverait rien (40 aussi en début de manche suivante) : la preuve vient de `legsWonInSet` et `legNumber` |

Autres tests intacts (critères 1 à 4 écran, 1 et 5 hook ; `DepotSuspendu`, `SettableClock`), toujours
sans `vi.fn` / `vi.mock` / `vi.spyOn`. O2 à O6 inchangées, sans action.

### Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Relecture à l'écran : bouton grisé puis réactivé (portrait / paysage, sombre / clair), vrai double appui sur Chrome Android | Utilisateur, arrêt de fin de lot |

---

## Passe 1 — GO avec renvoi Dev (problème de test, non bloquant)

Le sous-agent `test` n'avait pas de shell : rien relancé, jugement sur relecture. Chiffres
revérifiés par l'Orchestrator (`02-dev-notes.md` § Contrôles) : lint OK, typecheck OK, 803 verts.

### Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine, use cases, infrastructure | Non | Inchangés : `undoLastVisit` et le journal ne bougent pas |
| UI — écran | Oui | `App` + `renderWithServices`, clics réels, 4 modes en `describe.each` |
| UI — hook | Oui | `renderHook` : prouve la garde par l'horloge, que le bouton désactivé masque à l'écran |

Horloge `SettableClock` (jamais `TickingClock`, qui annulerait la pause). Aucun `vi.fn`,
`vi.mock`, `vi.spyOn`.

### Couverture par critère

| Critère | Écran | Hook | Peut-il passer à vide ? |
|---|---|---|---|
| 1 — une fléchette, deux appuis | journal intact, bouton désactivé | 2e `annuler()` au même instant, journal intact | Non ; écran (désactivé) et hook (garde) se complètent |
| 2 — après 1 s, annulation | `regler(+1000)`, réactivation, clic, journal vide | `regler(+1000)` puis `annuler()` | Faible à l'écran (minuteur réel) ; le hook prouve que l'horloge tranche |
| 2 — X01, manche gagnée | intacte pendant la pause, défaite après | — | Correct ; assertion sur `history.length` seulement (O1) |
| 3 — deux fléchettes, sans pause | bouton actif entre les deux appuis | — | Non : rouge avec une pause nulle (contre-épreuve a) |
| 4 — aucune fléchette, un appui | oui | — | Passerait sans armement ; garde le chemin sans pause |
| 5 — écriture en cours | — | `DepotSuspendu` (sous-classe d'`InMemoryMatchRepository`, compteur de `save`, écriture suspendue) | Non : contre-épreuve b, 4 rouges sans la garde. Vrai fake, pas un mock |
| 6 — quatre modes | `describe.each` | `describe.each` | Voir T1 |

### Conformité à l'architecture (relecture)

Heure par `useServices().clock.now()` seulement (`setTimeout` pour l'affichage, garde
`horlogeBoundary` non déclenchée) ; minuteur nettoyé au démontage et au ré-armement ; `ecoulee()`
fait autorité ; `if (occupe) return` en tête des 4 hooks ; armement au seul passage 1 → 0 ;
`peutAnnuler` conforme (`roundsPlayed` à l'entraînement). Aucun fichier hors périmètre touché.

### Réponses aux questions de `02-dev-notes.md`

1. **Fichier unique en `describe.each`** : à garder (un mode oublié se voit dans la table, pas de
   quatre copies du scénario). Réserve : T1.
2. **Critère 2 en temps réel (~1 s)** : à garder. Les faux minuteurs avec user-event et TanStack
   Query sont un risque de fragilité pour ~5 s gagnées ; marges `waitFor` 3 s, `it` 10 s ;
   l'autorité de l'horloge est prouvée sans attente au niveau hook.

### Bugs et observations

| # | Constat | Classement | Suite |
|---|---|---|---|
| — | Aucun bug d'implémentation | — | — |
| T1 | `MODES` est une liste de 4 modes recopiée à la main ; `rules/testing.md` exige `it.each(GAME_MODE_IDS)`. Un 5ᵉ mode ne ferait pas échouer le fichier. Motif existant : `tests/ui/nomDePartieEcrans.test.tsx` (`Record<GameModeId, …>` + `GAME_MODE_IDS`) | Problème de test | Renvoi Dev (boucle 1) |
| O1 | Test X01 « manche gagnée » : n'asserte que `history.length`, pas le retour du reste ni des manches | Observation | Joint au renvoi (peu coûteux) |
| O2 | Critère 5 : le retrait de fléchette pendant l'écriture n'est pas testé | Observation | Sans action |
| O3 | Pas de test de bord à 999 ms, ni du nettoyage du minuteur au démontage | Observation | Sans action |
| O4 | Pause non remise à zéro à l'enregistrement d'une nouvelle volée | Observation | Sans action (irréaliste) |
| O5 | Horloge système qui recule : `ecoulee()` refuse jusqu'au rattrapage | Observation | Sans action (improbable) |
| O6 | À l'entraînement, le bouton reste « Annuler » | Observation | Hors périmètre (existant) |

### Angles morts

Bouton grisé puis réactivé (contraste à 30 cm, portrait / paysage, sombre / clair), vrai double
appui sur Chrome Android, ressenti de la seconde en jeu : relecture à l'écran.

### Questions ouvertes

| # | Question | Résolution |
|---|---|---|
| 1 | T1 dans ce lot ou reporté ? | **Close (Orchestrator)** : dans ce lot — c'est une règle du projet, et la correction est mécanique. Boucle 1, tour 1 |
| 2 | Relecture à l'écran sur Chrome Android | Utilisateur, arrêt de fin de lot |
