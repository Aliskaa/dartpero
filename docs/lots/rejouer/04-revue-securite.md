# Lot `rejouer` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport de `sec` (opus, effort du frontmatter, passe 1,
> 2026-10-17). Phase ajoutée quand le lot est passé de `light` à `high`.

## Passe 1 — verdict : PASS

`sec` n'avait que Read / Grep / Glob : diff établi depuis `git status`, chaque fichier de code lu.
L'Orchestrator a confirmé par `git diff --stat main` que `package.json`, `package-lock.json`,
`firebase.json` et `vite.config.ts` sont **hors diff** (10 fichiers suivis modifiés au total).

### Menaces considérées

Fichier de sauvegarde reçu ou édité à la main (seule menace réelle : ses configurations et pseudos
deviennent de l'historique, donc de « Rejouer ») ; joueur qui tape (solo en un appui) ;
dépendance (aucune) ; déploiement (non touché).

### Surfaces vérifiées

| Surface | Touchée ? | Résultat |
|---|---|---|
| Zéro réseau / `firebase` | Non | Aucun `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `firebase` dans le lot |
| Import JSON / `backupSchema` | Non (lu en aval) | Hors diff ; le lot lit des parties déjà stockées (constat 1) |
| Rendu d'un pseudo | Oui | Texte React ; `Avatar` initiales `aria-hidden` ; `ariaRejouer` concaténation simple ; aucun `innerHTML` |
| Format persisté | Non | Aucun événement, schéma ni migration ; `CLE_REJOUER` = clé de cache ; use case en lecture seule |
| Stockage local | Clés existantes | 9 clés `partie:*` / `entrainement:*`, identiques à `main` ; écriture protégée contre le quota |
| `/confidentialite` | Non touchée | Texte et date identiques à `main` ; « les réglages de la dernière partie, les derniers joueurs choisis » couvre ce qu'écrit ▶ |
| SW / `firebase.json` / `vite.config.ts` | Non | Hors diff |
| Dépendances, secrets, permissions | Non | — |
| Architecture | — | `src/core` : imports relatifs ; câblage dans `container.ts:127,193` ; `services.clock` |

### Constats

| # | Sév. | Fichier | Constat | Classe |
|---|---|---|---|---|
| S1 | Basse | `src/ui/rejouer.ts:24-27` (amont antérieur : `backupSchema.ts:132-133`, `x01/config.ts:67-68`) | `doubleOut` / `doubleIn` non booléens venus d'un import (`"oui"`, `"false"`) passent le filtre. ≥ 2 joueurs : la chaîne est écrite dans `partie:double-out`, relue `false` → partie **rejouée en sortie libre** (contre le critère 9). Solo : la valeur malformée part dans un nouveau `MatchStarted`. Ni perte de données ni exécution de code ; seule une sauvegarde éditée à la main le déclenche. Correctif local : `typeof … === 'boolean'` dans `estReproductible` + test | **Bug d'implémentation → Dev** |
| S2 | Info | `src/ui/rejouer.ts:22-41`, `NouvellePartieEcran.tsx:40` | Configuration importée à 5 joueurs ou plus : rejouée fidèlement, mais non reproductible par le parcours (`MAX_JOUEURS = 4`) | Question utilisateur |

**Hors lot (observation, pas un constat)** : une partie importée dont le journal ne se projette
pas (même joueur deux fois, `x01/rules.ts:45`) fait échouer `summarize` ; préexistant
(`GetMatchHistoryUseCase.ts:28`). Ici la dégradation est propre : `retry: false`,
`historique.data ?? []` → tuiles 2 × 2.

### Mitigations confirmées

Filtre `estReproductible` (score, manches, sets, sorties, cibles ; variante Cricket déjà refusée à
l'import) ; profil supprimé écarté deux fois ; nom jamais repris ; double appui neutralisé
(`disabled={partie.occupe}`).

### Risques acceptés (signés par l'utilisateur)

- Lancement solo en un appui (`request.md`, § Risques et § Décisions).
- « N fois » limité à la fenêtre de 50 parties (`request.md` ; T1).

### Résolution des questions (Orchestrator, 2026-10-17)

| # | Résolution |
|---|---|
| S1 | **Boucle 2, tour 2** → Dev : filtre local. Le contrôle de type manquant dans `backupSchema` (antérieur, surface gravée) **reste hors lot** : à proposer comme lot à part |
| S2 | **Utilisateur** : une configuration à plus de `MAX_JOUEURS` joueurs est **écartée** (non reproductible par le parcours). Joint au même tour Dev |
| `npm audit` / `git diff` | `git diff --stat main` relancé par l'Orchestrator : fichiers sensibles hors diff ; `package.json` inchangé, donc `npm audit` sans objet pour le lot |

## Passe 2 (2026-10-17, après boucle 2 tour 2) — verdict : PASS

> `sec` (opus), relecture seule ; commandes de l'Orchestrator : lint, typecheck, 1403 tests,
> build OK ; fichiers sensibles hors diff.

| # | Statut | Preuve |
|---|---|---|
| S1 | Clos | `src/ui/rejouer.ts:34-35` (`typeof … === 'boolean'`), filtre avant la coupe (`:61-65`) ; tests `rejouerFiltre.test.ts:38-50`, `rejouer.test.tsx:373-388` (journal persisté `doubleOut: 'oui'` → tuiles) |
| S2 | Clos | `src/ui/rejouer.ts:25` (`> MAX_JOUEURS`, constante de `useNouvellePartie.ts:55`) ; test `rejouerFiltre.test.ts:52-58` |

- Le solo ne peut plus propager de valeur malformée : seul appel de `rejouer` sur une ligne déjà
  filtrée (`EtapeJeu.tsx:124,153`) ; entraînement et Tour du monde ne reprennent que des valeurs
  contrôlées ou rien.
- Aucune nouvelle surface : un import interne (`MAX_JOUEURS`), aucun réseau, stockage ni
  dépendance.
- Puce « Rejouer » de `CLAUDE.md:156-165` : aucune contradiction avec les décisions gravées.
- Nouveaux constats : aucun. Risques acceptés inchangés. **Hors lot** : contrôle de type de
  `doubleOut` / `doubleIn` dans `backupSchema.ts:132-133` à proposer comme lot à part.

## Passe 3 (2026-10-17, delta de la boucle 1 tour 3) — verdict : PASS

> `sec` (opus), relecture seule ; Orchestrator : 1405 tests, lint, typecheck, build OK.

- S1 (`rejouer.ts:33-34`) et S2 (`rejouer.ts:24`, constante dans `reglagesPossibles.ts:15`)
  toujours clos.
- Filtre de l'entraînement (`rejouer.ts:44`) : ne fait que retirer des lignes ; un entraînement
  importé à plusieurs ne peut plus être relancé en solo avec un seul de ses joueurs.
- Constantes déplacées dans un module neutre (sans React, sans effet de bord) ; hook au même sens.
- Aucune nouvelle surface ; rien de gravé contredit (cohérent avec « Un joueur, seul » de
  l'entraînement).
- Hors sécurité : virgule manquante dans la puce Rejouer de `CLAUDE.md:161` — corrigée par
  l'Orchestrator (typographie seule).

## Passe 4 (2026-10-17, delta du tour 4, Revue → Dev) — verdict : PASS

> `sec` (opus), relecture seule ; Orchestrator : 1408 tests, lint, typecheck, build OK.

- S1 (`rejouer.ts:33-34`) et S2 (`rejouer.ts:24`) toujours clos.
- Renommages `ReplayableConfiguration` / `REPLAY_WINDOW` : noms seuls, use case toujours en
  lecture seule ; aucun ancien nom restant hors `docs/lots`.
- « Solo » : chaîne en texte React (`labels.ts:155`, `EtapeJeu.tsx:79`) ; `disabled:shadow-none`
  purement visuel, `disabled={partie.occupe}` inchangé (`EtapeJeu.tsx:125-127`).
- Aucune nouvelle surface.
- Docs : puce Rejouer (`CLAUDE.md:157-164`) cohérente avec le code ; `/confidentialite` couvre
  toujours `partie:*` / `entrainement:*` (`labels.ts:299`), date inchangée et non due ; puce
  Parcours (`:145-146`) descriptive ; glossaire (`glossary.md:26`) conforme au code de
  « On remet ça » (garde le nom).
- Nouveaux constats : aucun.
