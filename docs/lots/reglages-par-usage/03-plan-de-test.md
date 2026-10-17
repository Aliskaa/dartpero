# Lot `reglages-par-usage` — plan de test

## Passe 1 (2026-10-17)

> Agent `test` (opus, effort high du frontmatter). ⚠️ **Sans shell** dans sa session (outil `Bash`
> déclaré, absent sous Windows / PowerShell — même cas que les lots précédents) : lecture
> statique ; aucune commande ni contre-épreuve exécutée par lui. Arbre non touché. Les commandes
> et contre-épreuves seront rejouées par l'Orchestrator après la boucle.

### Stratégie

| Niveau | Couvert | Pourquoi |
|---|---|---|
| Domaine | Non | `src/core/domain` non touché |
| Use cases | Oui | `tests/use-cases/contenuAppareil.test.ts` (6 cas, `it.each(GAME_MODE_IDS)`) |
| Infrastructure | Non | Aucun adapter modifié |
| UI pure | Oui | `tests/ui/voyants.test.ts` (seuils, minuit, changements d'heure, futur, 5 états) |
| UI écran | Oui | `reglagesParUsage.test.tsx` + tests adaptés (`installation`, `stockagePersistant`, `confidentialite`, `theme`, `entrainement`) |
| Architecture | Oui | `themeBoundary.test.ts` (réservation par famille avec témoin, égalité des aperçus, motif) |

Hors périmètre : format de sauvegarde (inchangé ; couvert par `lot4`, `backupSchema`).

### Couverture critère par critère (request)

| Critère | Test(s) | État |
|---|---|---|
| 1. Ordre, deux voyants | `reglagesParUsage.test.tsx:64-111` | Couvert ; position du guide (U5) et ordre U8f non vérifiés (T6) |
| 2. Jamais / Aujourd'hui / échec / restauration | `:115-201` (dont téléchargement qui jette `:147`, `listAll` rejette `:162`) | Couvert |
| 3. Seuils | UI `:203-219` ; pur `voyants.test.ts:20-63` (minuit, 25 h / 23 h avec précondition, futur) ; illisible UI `:221-231` | Couvert ; réserve T4, bug B1 |
| 4. Application, `#installer`, Accueil | `installation.test.tsx:55-68,154-162,187-354` ; pur `voyants.test.ts:66-86` | Couvert ; filet / teinte non vérifiés (T2) |
| 5. Rappel 3 états, lien seulement `not-persisted` | `stockagePersistant.test.tsx:91-250` | Couvert |
| 6. Comptes, base vide, singulier | `reglagesParUsage.test.tsx:238-284` ; use case `:13-71` | Couvert sauf échec / chargement (T1) |
| 7. Politique | `confidentialite.test.tsx:80-107` | Couvert |
| 8. 48 px, gardes | `reglagesParUsage.test.tsx:320-338` | Partiel ; intitulé promet les vignettes (T3) ; voyants et lien : écran |
| 9. Commandes vertes | — | Non vérifié par l'agent (rejoué par l'Orchestrator) |

U1 partiel (laiton seulement, pas `craie-vive` ni filet) ; U2 par les gardes seulement ; U3, U4,
U6, U10 couverts ; U5 position non vérifiée ; U7 écran ; U8 (a)(c) couverts, (b) faible, (d)(e)
partiels, (f) non testé ; U9 accepté sans test. TT1-TT4 couverts ; TT5 : gardes présentes,
contre-épreuves à exécuter.

### Contre-épreuves raisonnées (non exécutées)

| Mutation | Test qui doit échouer |
|---|---|
| `bg-apercu-clair-fond` dans `ReglagesEcran.tsx` | `themeBoundary` « aperçus de thème » (`:159-178`) |
| `--color-feutre` clair modifié sans l'aperçu, ou aperçu retiré du bloc clair | `themeBoundary:203-233` (+ `:265-282`) |
| `noterExport` avant `telecharger` | `reglagesParUsage:147-160` |
| `noterExport` dans `finally` ou retiré | `:147`, `:162` / `:123`, `:135` |
| `importer()` écrit la date | `:179-201` (prouve d'abord l'import réussi) |
| `nonProtegee` toujours vrai / `!== 'persisted'` | `stockagePersistant:98` / `:118` |
| Afficher « 0 » quand `isError` (Q-c) | `:271-284` — **indéterminé** (T1) |

### Constats classés

**Bugs d'implémentation (boucle 1 → Dev)**

- **B1** — Horodatage fini hors plage de `Date` (`1e20`) → « Il y a NaN mois », filet **vert**.
  `useDernierExport` ne valide que `Number.isFinite` (`useAppareil.ts:49-50`) ; `NaN` traverse
  `vueVoyantSauvegarde` (`voyants.ts:49-55`). Contredit la baseline (« sinon Jamais ») et U3.
  Correctif : valider `Number.isFinite(new Date(v).getTime())` ou `NaN` → `jamais` ; ajouter
  `[1e20]` à l'`it.each` de `reglagesParUsage.test.tsx:221`.
- **B2** (trivial) — JSDoc de `groupeDeJour` déplacé au-dessus d'`etiquetteDeJour`
  (`jourCalendaire.ts:17-27`) ; `groupeDeJour` (`:47`) sans doc.

**Trous de test (boucle 1 → Dev)**

- **T1** (réponse à Q-c) — `:271-284` ne distingue pas chargement et échec. Durcir : option
  `queryClient` à `ouvrir()` (`renderWithServices.tsx:20,35`) ; `waitFor` sur
  `getQueryState(CLE_CONTENU_APPAREIL)?.status === 'error'` ; laisser peindre (`act` +
  `setTimeout 0`) ; assertions d'absence. Plus un test « en chargement » avec `listAll` différé
  (modèle `stockagePersistant.test.tsx:233-250`). Contre-épreuve : « 0 » si `isError` → rouge.
- **T2** — Aucun test UI du filet (`border-vert-cible` / `border-laiton`) ni de `text-vert-etat`,
  ni de `text-craie-vive` à ≤ 30 jours (U1) : câblage `ton` → `FILET` / teinte inversable sans
  échec (`Voyant.tsx:32-42`, `ReglagesEcran.tsx:332-346`).
- **T3** — `:320-338` s'intitule « chaque ligne et chaque vignette… 48 px » sans vérifier de
  vignette : étendre ou renommer.
- **T4** — Heure d'hiver : une implémentation naïve `floor(écart / 24 h)` resterait verte. Ajouter
  `voyant(le(25, 0, 10), le(25, 23, 50)).texte === 'Aujourd’hui'`.
- **T5** — Rien ne vérifie que l'aperçu n'emploie **que** des `apercu-*` (un `bg-feutre` passerait).
  Garde source sur `VignetteTheme.tsx` avec contre-exemple (cadre `border-laiton` /
  `border-craie/25` permis).
- **T6** — Position du guide (U5) et ordre U8f absents du test d'ordre.
- **T7** — Ligne « N parties · M joueurs » non vérifiée après restauration (invalidation).

**Angles morts (écran seulement)** : contraste réel des vignettes ; troncature à 360 px et police
système max ; 48 px réels des pseudo-éléments ; anneau de focus sur `::after` ; duo xs / sm
inégal (U7) ; bloc Système à 40 % ; erreur d'un export lancé du voyant affichée loin (U8d) ;
iPhone réel (U9). Couverts par les captures du Dev seulement. Rebase : date de la politique
(TO1).

**Question**

- **Q1** — `localStorage` plein : `write` avale l'erreur, `usePreference` met l'état à jour ; le
  voyant dit « Aujourd'hui » mais la date n'est pas gardée au lancement suivant. Même contrat que
  toutes les préférences. **Close par l'Orchestrator (technique, évident)** : contrat du port
  `Preferences` inchangé et partagé par toutes les préférences ; le modifier sortirait du
  périmètre. Accepté tel quel, signalé à l'utilisateur au bilan.

### Verdict passe 1

**Renvoi au Dev (boucle 1, tour 1/5)** : B1, T1, T2, T3 à corriger ; T4-T7 et B2 conseillés,
demandés dans le même tour. Puis passe Test, commandes et contre-épreuves rejouées par
l'Orchestrator. Sécurité après B1 (baseline TS1).

## Passe 2 (2026-10-17, après boucle 1)

> Agent `test` (opus, effort high), lecture seule. Commandes exécutées par l'Orchestrator :
> `npm run lint` 306 fichiers / 0 erreur ; `npm run typecheck` OK ; `npx vitest run` 77 fichiers /
> **1428 verts** ; `npm run build` OK. Contre-épreuves Orchestrator : `noterExport` avant
> `telecharger` → 1 échec (`reglagesParUsage.test.tsx`) ; `importer()` qui écrit la date → 1
> échec ; fichier restauré (empreinte SHA-256 identique). Contre-épreuves du Dev (rouges) : T1 ×2,
> B1 (`voyants.ts`), T2 ×2, T4, T5.

### Clôture des constats de la passe 1

| # | Où | Clos | Peut échouer |
|---|---|---|---|
| B1 | `useAppareil.ts:52-53` ; `voyants.ts:48-51` ; tests `voyants.test.ts:67-70`, `reglagesParUsage.test.tsx:277-290` (encre et filet laiton) | Oui | Oui |
| B2 | `jourCalendaire.ts:17-28` | Oui | — |
| T1 | `renderWithServices.tsx:20,35` ; `reglagesParUsage.test.tsx:366-384` (échec), `:386-404` (chargement) | Oui | Oui (rouges à la contre-épreuve) |
| T2 | `reglagesParUsage.test.tsx:293-327` | Oui | Oui |
| T3 | `:465-490` (vignettes par classe `h-13.5`, intitulé honnête) | Oui | Classes seulement ; mesure réelle à l'écran |
| T4 | `voyants.test.ts:61-65` (précondition 25 h) | Oui | Oui |
| T5 | `themeBoundary.test.ts:197-235` (témoin ≥ 6, contre-exemple) | Oui | Oui |
| T6 | `reglagesParUsage.test.tsx:103-114`, `:116-138` | Oui | Oui |
| T7 | `:406-429` | Oui | Oui |

Aucun ancien test affaibli (illisible et échec durcis, 48 px étendu ; 1414 → 1428).

Mutation verte « hook seul revenu à `Number.isFinite(valeur)` » : **acceptable** — un seul
consommateur (`vueVoyantSauvegarde`), qui traite `NaN` et le teste ; défense en profondeur.

### Nouveaux constats (non bloquants) et résolution

| # | Constat | Classement | Résolution (Orchestrator, technique) |
|---|---|---|---|
| D1 | JSDoc de `useDernierExport` promet une valeur « validée » sans test du hook isolé | Trou de test mineur | Dette notée : test `renderHook` à ajouter si un second lecteur apparaît |
| N1 | Garde T5 en liste noire : un `text-white`, `bg-stone-900` ou `bg-[var(--color-feutre)]` dans `Apercu` passerait (palette Tailwind par défaut active) | Trou de test mineur | Dette notée (peu probable) ; durcissement possible : toute couleur d'`Apercu` commence par `-apercu-` |
| N2 | `reglagesParUsage.test.tsx:117-125` réécrit le bouchon d'`URL` au lieu de `telechargementImpossible()` (`:51`) | Style | Accepté tel quel |

Aucun bug d'implémentation, aucune question nouvelle ; Q1 reste close.

Angles morts inchangés (écran seulement, couverts par les captures du Dev) : contraste réel des
vignettes et de `vert-etat`, troncature à 360 px et police max, 48 px réels des pseudo-éléments,
focus sur `::after`, duo xs / sm, bloc Système 40 % en paysage, erreur d'export loin du voyant
(U8d), iPhone réel ; date de la politique au rebase (TO1).

### Verdict passe 2

**Prêt pour Sécurité.**
## Passe 3 (2026-10-17, delta de la boucle 5)

> Agent `test` (opus, effort high), lecture seule ; commandes de l'Orchestrator (lint 306 / 0,
> typecheck, **1429 verts**, build, smoke OK).

| Point | Résultat |
|---|---|
| Duo `xs` / `sm` → `min-h-14` sans effet ailleurs | Confirmé : seuls `ReglagesEcran.tsx:402,408` utilisent ces tailles de `Button` ; `classesBouton` appelé sans taille ailleurs ; charte `:337,415` à 56 px |
| Gras des voyants testé ? | Non — classé angle mort écran (A1), le projet n'assert pas la typo |
| Nouveau test (7) peut échouer | Oui, dans les deux sens (`reglagesParUsage.test.tsx:203-226`) |
| Aucun test affaibli | Confirmé (1428 → 1429 ; 48 px plus strict) |
| Renommage `vueSauvegarde` complet | Oui (`ReglagesEcran.tsx:303,331-333`) |
| Commentaires `useInstallation.ts:13-17`, `jourCalendaire.ts:1-4` | Justes |

Constats : **A1** (angle mort) — mesure T2 à 360 px faite avant le gras : revérifier « Il y a 59
jours », « Pas installée » à 360 px et police agrandie → demandé au `dev` (mesure d'écran, sans
code) ; **A2** (angle mort) — hauteur réelle du duo : mesurée 176 × 56 à 390 px, redemandée à
360 px ; **I1** (docs) — `02-dev-notes.md` citait encore 48 px : section « Boucle 5 » ajoutée par
l'Orchestrator. Aucun bug, aucun trou de test, aucune question.

### Verdict passe 3

**Prêt pour la Revue.**