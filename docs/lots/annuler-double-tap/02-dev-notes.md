# Lot `annuler-double-tap` — notes de dev

> Écrit par l'Orchestrator à partir du rapport du sous-agent `dev` (sonnet / medium, maxTurns
> 100, frontmatter). Rien de commité.

## Ce qui a été implémenté

Couche `ui/` seulement.

- **Créé** `src/ui/hooks/usePauseAnnulation.ts` : `PAUSE_ANNULATION_MS = 1000` exportée ; le hook
  renvoie `{ enPause, armer, ecoulee }`.
  - `armer()` note `clock.now()` dans une ref, passe `enPause` à `true` et lance un
    `setTimeout(1000)` qui repasse `enPause` à `false` (affichage seulement).
  - `ecoulee()` vaut `ref === null || clock.now() - ref >= PAUSE_ANNULATION_MS` : la garde fait
    autorité sans dépendre du minuteur.
  - Minuteur nettoyé au démontage et à chaque ré-armement. Heure lue par `useServices().clock`.
- **Modifiés**, même changement dans les quatre (`useX01`, `useCricket`, `useTourDuMonde`,
  `useCheckoutPractice`) :
  - `if (occupe) return` en tête de `annuler` ;
  - après `slice(0, -1)`, `if (dartsEnCours.length === 1) armer()` ;
  - `if (!ecoulee()) return` avant l'annulation de la volée enregistrée ;
  - `peutAnnuler = dartsEnCours.length > 0 || (!enPause && history / roundsPlayed > 0)` ;
  - `occupe`, `armer`, `ecoulee` dans les dépendances du `useCallback`.
- **Créé** `tests/ui/annulationDoubleTap.test.tsx` : 25 tests, `SettableClock`, aucun
  `vi.fn` / `vi.mock` / `vi.spyOn`.
  - Écran, `describe.each` sur les 4 modes : critères 1, 2, 3, 4 (16 tests).
  - X01 : volée qui avait gagné une manche (départ 40, `legsToWin: 2`, D20) — intacte pendant la
    pause, défaite après.
  - Hook (`renderHook`, 4 modes) : critère 1 par appels directs (la garde lit l'horloge, pas
    `disabled`) ; critère 5 avec `DepotSuspendu`, sous-classe de `InMemoryMatchRepository` qui
    compte les `save` et suspend l'écriture par une promesse.

Aucun composant, écran, `labels.ts`, `src/core`, `src/infrastructure`, `src/composition` ni skill
touché.

## Écarts par rapport à `01-architecture.md`

| Écart | Classement | Justification |
|---|---|---|
| Un seul fichier de test en `describe.each` sur les 4 modes, au lieu de 4 fichiers par mode | Ajustement | Un mode oublié se voit dans la table ; les fichiers existants restent intacts ; déplacement mécanique si Test le demande |
| Les hooks destructurent `{ enPause, armer, ecoulee }` | Ajustement | L'objet change à chaque rendu et recréerait les callbacks |
| Pas de `vi.useFakeTimers` : minuteur d'affichage en temps réel, `clock.regler(+1000)` puis `waitFor(..., { timeout: 3000 })` | Ajustement | Compatibilité des faux minuteurs avec TanStack Query non vérifiée ; ~1 s par test concerné, timeout porté à 10 s |
| À l'entraînement, le bouton reste « Annuler » (l'écran ne passe pas `annulation` au pavé) ; tests sur `/^Annuler/` | Constat | Comportement existant, hors périmètre |

## Contrôles

| Commande | Résultat (Dev) | Revérifié par l'Orchestrator |
|---|---|---|
| `npx biome check --write src tests` | 237 fichiers, 1 reformaté au premier passage | — |
| `npm run lint` | OK, 248 fichiers | OK, 248 fichiers, aucun correctif |
| `npm run typecheck` | OK | OK |
| `npx vitest run` | 52 fichiers, 803 tests verts | 52 fichiers, **803 verts** (778 avant le lot) |
| Accents cassés (`Ã`, `Â`, `�`) | aucun | aucun (hooks et nouveau test) |
| `vi.fn` / `vi.mock` / `vi.spyOn` dans le nouveau test | aucun | aucun |
| `git diff --stat` | — | 4 hooks modifiés (+36 / −8), 2 fichiers créés, rien d'autre |

**Contre-épreuves (Dev, code restauré par Edit ensuite)** :

- (a) `PAUSE_ANNULATION_MS = 0` : 17 tests sur 25 rouges — critère 1 (écran et hook) dans les
  4 modes, critères 2 et 3 (écran) dans les 4 modes, test X01 « manche gagnée ». Les critères 2
  et 3 rougissent parce qu'une pause nulle ne les distingue plus, pas par erreur de logique.
- (b) garde `occupe` retirée des 4 hooks : exactement 4 rouges, le critère 5 dans les 4 modes.
- Suite complète verte après restauration (803).

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Fichier unique en `describe.each` ou répartition en 4 fichiers par mode (prévue par l'architecture) ? | Test |
| 2 | Tests d'écran du critère 2 en temps réel (~1 s chacun, 5 tests) : acceptable, ou faux minuteurs ? | Test |

## Limites connues et TODO assumés

- Angle mort : bouton grisé puis réactivé, et double appui réel sur Chrome Android — relecture à
  l'écran.
- En test seulement : le bouton se réactive à l'expiration du minuteur réel même si l'horloge
  injectée n'a pas bougé ; le clic est alors sans effet (la garde fait autorité).
- Deux `annuler()` dans le même rendu avec une fléchette : la pause se ré-arme deux fois ; sans
  conséquence (instant rafraîchi).
- La pause n'est pas remise à zéro à l'enregistrement d'une nouvelle volée ; elle expire seule en
  1 s.
