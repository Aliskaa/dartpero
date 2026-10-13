# Lot `accueil-parties-recentes` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport du sous-agent `sec` (sonnet / high,
> frontmatter ; Read / Grep / Glob seulement). **Vérifications exécutées par l'Orchestrator**
> (2026-10-13) :
> - `npm audit --omit=dev` : **0 vulnérabilité** ; les vulnérabilités de dev préexistantes
>   n'ont pas changé ;
> - `git diff --stat -- package.json package-lock.json` : vide ;
> - `git diff --name-only -- src/core/domain src/infrastructure backupSchema.ts` : vide ;
> - recherche de `dangerouslySetInnerHTML`, `innerHTML`, `fetch(`, `XMLHttpRequest`,
>   `WebSocket` et `sendBeacon` dans `src/` : aucune occurrence ;
> - `npm test` : 763 / 763, `reseauBoundary` compris.

**Verdict : aucun constat bloquant.** Un seul constat d'information, antérieur au lot.

## Menaces considérées

- **Sauvegarde importée** (éditée à la main, ou venue d'un autre téléphone) : ses champs `name`,
  `players[].name`, `createdAt` et `id` atteignent maintenant la carte.
- **Horodatage absurde**, ou horloge d'appareil déréglée.
- **Donnée supprimée** qui resterait affichée (cache TanStack Query).
- **Surface neuve** : réseau, permission, stockage, dépendance, format persisté.

## Vérifications

| Domaine | Résultat | Preuve |
|---|---|---|
| Rendu des saisies non fiables | **RAS.** Nom de partie, règles, heure, pseudos (`sr-only`) et statut sont rendus en nœuds texte React. `style` ne reçoit qu'une constante `ACCENTS_MODE`. Couleur d'avatar validée à l'import (`PlayerColor.of`) ; nom de partie borné par `MatchName.of` | `CartePartie.tsx:130-161` ; `backupSchema.ts:95,198` |
| Lien de carte | Toujours `/partie/${id}…` : ni schéma `javascript:` ni URL externe. Un `id` importé contenant `/`, `?` ou `#` ne peut que viser une autre route interne. Information, aucune action | `CartePartie.tsx:129` ; `backupSchema.ts:213` |
| `createdAt` absurde | **Aucun plantage.** `horodatage` refuse ce qui n'est pas numérique, `NaN`, `±Infinity` et les négatifs. `groupeDeJour` rend `null` pour le futur (`1e300`, `MAX_SAFE_INTEGER`) comme pour `0`. `heureCourte` et `libelleQuand` ne sont appelés que sur une date groupée, donc valide | `backupSchema.ts:33-37` ; `jourCalendaire.ts:28-40` ; `AccueilEcran.tsx:120-130` |
| Réseau, permission, stockage | **Aucun ajout.** `localStorage` et `sessionStorage` restent aux mêmes endroits. **La politique `/confidentialite` ne bouge pas** | — |
| Format persisté | **Intact.** Ni événement, ni Dexie, ni `backupSchema`. `MatchSummary` est calculé au rejeu ; `statutDePartie` est pure | `summarize.ts:33-39,112` |
| Cache après suppression ou mutation | **OK.** La suppression invalide `['historique']` et `['matchEnCours']`, toujours confirmée en deux temps. Lancement, fin de partie et import sont couverts. `staleTime` vaut 0 en production. Après le renommage d'un joueur, l'ancien pseudo se voit un instant, le temps du refetch : sans portée sécurité | `HistoriqueEcran.tsx:40-44,87-88` ; `useNouvellePartie.ts:263-265` ; `ActionsFinDePartie.tsx:51-52` ; `ReglagesEcran.tsx:285` ; `main.tsx:42-46` |
| Dépendances | Aucune nouvelle | Contrôle de l'Orchestrator ci-dessus |

## Constats

| # | Sévérité | Classe | Constat | Preuve |
|---|---|---|---|---|
| S1 | Info (cosmétique) | Information ; aucun retour Dev | Un `createdAt` fini au-delà de 8,64e15, par exemple `1e300` dans un fichier édité à la main, passe `backupSchema`. À l'écran Parties, on lit alors « Invalid Date », et « undefined nuit » si la partie n'a pas de nom. Pas d'exception : la partie reste ouvrable et supprimable, et l'Accueil l'écarte. **Antérieur au lot** (lot `nom-de-partie`), déjà suivi : `PROJECT_PLAN` § 0 et constat #11 de l'index | `labels.ts:365-371,423-428` ; `backupSchema.ts:33-37` ; `HistoriqueEcran.tsx:143` |

## Risques acceptés

Aucun. `sec` ne s'en attribue aucun.

## Rejeu après tour 3 (2026-10-13)

> `sec` sonnet / high, lecture seule. Contrôles de l'Orchestrator : lint vert (246 fichiers),
> typecheck 0, 765 / 765, build vert, audit de production 0.

**RAS sécurité : aucun constat nouveau.**

- **Exclusion `"!**/.claude/skills"` (`biome.json`)** : pas d'angle mort.
  - Rien dans `src/`, `vite.config.ts`, `package.json` ni `tsconfig.json` n'y fait référence.
  - Vitest ne lit que `tests/**`, `tsc` que `src`, `tests` et `vite.config.ts`.
  - `firebase.json` ne déploie que `dist`.
  - L'override `noRestrictedImports` de `src/core/**` est intact.
  - ⚠️ **Correction de l'Orchestrator** : le rapport dit n'avoir trouvé aucun `.js` sous
    `.claude/skills`. Il y en a (les scripts d'`impeccable`) ; sa recherche a sans doute ignoré
    les dossiers cachés. La conclusion tient : aucun chemin de l'app, du build ou du
    déploiement ne lit ce dossier.
- **Règles des cartes** : les constructeurs `regles*` interpolent des primitives de `config`,
  déjà validées à l'import par les fabriques du domaine (`backupSchema.ts:129-167`). Le rendu se
  fait en nœuds texte. `matchStatus` est pure ; `TITRE_PARTIE_EN_COURS` est une constante.
- **Surfaces de la checklist** : aucun réseau, permission, stockage, format persisté ni
  dépendance. La politique ne bouge pas.
- S1 : inchangé, antérieur au lot.
- Risques acceptés : aucun.

## Questions ouvertes

Aucune. S1 n'appelle aucune décision dans ce lot : il est déjà rattaché au futur lot d'import
(constat #11).
