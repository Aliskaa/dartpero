# Lot `courbe` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport de `sec` (opus, lecture seule, sans shell : lecture des
> fichiers et recherches). Les deux preuves qui manquaient ont été obtenues par l'Orchestrator.

## Verdict : PASS (aucun constat bloquant)

Le lot ne fait que lire la base et calculer : ni réseau, ni stockage, ni format persisté, ni service
worker, ni dépendance.

## Preuves complémentaires (Orchestrator)

| Commande | Résultat |
|---|---|
| `git diff --stat -- package.json package-lock.json firebase.json vite.config.ts src/infrastructure src/core/application/use-cases/backupSchema.ts` | vide : inchangés |
| `npm audit --omit=dev` | `found 0 vulnerabilities` |

## Surfaces vérifiées

| Surface | Touchée ? | Vérification |
|---|---|---|
| Zéro réseau | Non | Aucun `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `firebase`, `eval`, `new Function` dans `src/` ; garde `reseauBoundary` |
| Import JSON / `backupSchema` / `MatchEvent` / Dexie | Non | Lecture seule (`listAll()`), rien d'écrit, rien ajouté à l'export |
| Rendu d'un pseudo | En lecture | Attribut React seulement (`aria-label` du tracé, `CarteEvolution.tsx:348`) ; aucun `<title>` SVG, aucun `innerHTML` / `dangerouslySetInnerHTML` ; exposant en `<sup>` par segments ; regex d'élision ancrée, sans ReDoS |
| Stockage local / politique `/confidentialite` | Non | Mesure = `useState` non mémorisé ; seule `usePreference` de l'écran : `statistiques:joueur`, existante et citée par la politique ; `SECTIONS_CONFIDENTIALITE` et sa date inchangées |
| Service worker / `firebase.json` / `vite.config.ts` | Non | Inchangés |
| Dépendances | Non | `package.json` inchangé ; SVG écrit à la main |
| Horloge | Non | Pas de `Date.now()` ni `new Date()` sans argument dans `src/ui` |
| Frontière hexagonale | Oui | `progress.ts` n'importe que du domaine en relatif ; câblage dans `container.ts` seul |
| Écouteurs DOM | Oui | `resize` ajouté puis retiré au démontage avec la même référence ; `scroll` et pointeurs = props React ; `onScroll` ne réécrit jamais `scrollLeft` |

## Robustesse

Pas de division par zéro (point seulement si `dartsThrown > 0`, fenêtre de tendance toujours de 3) ;
journal vide / partie sans volée / joueur sans point : carte non rendue ; pas de boucle infinie
(`axeVertical` filtre les non-finis, doublements bornés à 40) ; `createdAt` validé fini ≥ 0 à l'import.

## Constats

Aucun bug d'implémentation, aucune faille de design.

## Risques résiduels (non signés par l'utilisateur : ce ne sont **pas** des risques acceptés)

| # | Sévérité | Scénario | Mitigation / owner |
|---|---|---|---|
| R1 | Faible (performance locale) | Deux `listAll()` complets par période ; ~16 ms pour 500 parties sur poste de bureau ; chaque événement `scroll` relance un rendu complet du SVG, ce qui peut peser sur la fluidité au-delà de quelques centaines de points | Cache TanStack par période ; mesure sur téléphone (300-500 parties) puis décision de l'utilisateur |
| O1 | Très faible | (a) `Math.min(...)` / `Math.max(...)` par décomposition dans `axeVertical` (`evolution.ts:218-219`) : `RangeError` possible vers ~50 000 parties pour un même joueur, via un fichier fabriqué ; (b) `createdAt` fini > 8,64e15 → « NaN undefined » en date (faiblesse antérieure du lot, `backupSchema.ts:34`) | Rien d'exigé pour ce lot. Durcissement possible : `reduce` dans `axeVertical` (Dev, lot futur) ; borne haute d'horodatage dans `backupSchema` (surface gravée, hors lot) |

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | R1 : accepter, ou demander une lecture unique, après mesure sur téléphone | Utilisateur |
| 2 | O1 (a) : remplacer la décomposition par un `reduce` dans ce lot (trois lignes) ou le laisser ? | Revue / Utilisateur |
