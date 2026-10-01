# Lot `allegement-docs` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (opus, effort high),
> 2026-10-01. Tout lu sur disque — la copie injectée de `CLAUDE.md` était bien l'ancienne (R4
> confirmé). Référence « avant » : `main` = `a00e9a8`.

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Non | T1 : aucun fichier de code touché |
| Use cases | Non | Idem |
| Infrastructure | Non | Idem |
| UI | Non | Idem |
| Architecture (gardes) | Oui, par `npm test` | Les gardes ne lisent que `src/` ; aucun test ne lit de Markdown (archi § 2-E) |
| **Documentation** | **Oui** | Contrôle mécanique : diff contre `main`, recherche ligne à ligne de chaque ligne supprimée, comparaison des blocs intacts par script Python ; lecture humaine des doublons à la ligne citée |

**Hors périmètre :** pas de test automatique de taille (archi § 5 : il pousserait à supprimer du
contenu pour passer au vert).

**Les scripts peuvent échouer :** le script T4 a bien rendu « XX » sur les lignes reformulées
(statuts `[x]` → `✅`, puces en doublon) — il détecte un texte absent ; le script T2 compare des
sous-chaînes exactes, un seul caractère modifié le fait échouer.

**Angles morts assumés :**

1. Que les agents lisent vraiment sur disque et que l'index suffise à trouver la source :
   comportement, pas propriété du fichier — visible au prochain lot.
2. L'équivalence de sens d'un doublon : jugée à la lecture, non prouvée mécaniquement.
3. Le rendu Markdown n'est pas vu (ex. `CLAUDE.md` l. 318-319 : liste après un paragraphe sans
   ligne vide, accepté par CommonMark).
4. Le comportement de Cursor face aux fichiers injectés.

## Cas de test

| # | Cas | Type | Résultat |
|---|---|---|---|
| T1 | `git diff --stat main` : 23 fichiers, tous `.md` ; non suivis : `docs/DEPLOIEMENT.md`, `docs/lots/allegement-docs/`. Rien sur `README.md src tests scripts firebase.json vite.config.ts package.json package-lock.json biome.json tsconfig.json .claude/settings.json` | périmètre | **PASS** |
| T2 | Blocs `main` 21-33, 39-98, 104-120, 126-226, 232-247, 450-456, 461-472, 521-529 tous **intacts** (sous-chaîne exacte). Blocs modifiés : en-tête 10-17, lignes vides 37-38, 102-103, 124-125, 230-231, 251, 305-306, 327-328, 405-406, 460, et les 5 sections réduites | bord (non-perte) | **PASS** |
| T3 | 15 titres `##` identiques, même ordre (`diff` vide) | ancres | **PASS** |
| T4 | Chaque ligne non vide supprimée (255-300, 309-313, 315-317, 323, 331-400, 409-446, 478-490, 493-500, 504-517) couverte par la table ; aucune sans destination. Arbre : 45/46 lignes mot pour mot en `CONVENTIONS` l. 247-294, la 46ᵉ (l. 273) au glyphe réparé. Coupe littérale retrouvée (409-412, 416, 422-423, 429-436, 439-446, 478, 482-490, 493-500, 504-517). Correction l. 479 (`+ smoke`) conforme à `package.json` l. 11, 19. **17 doublons ouverts à la ligne**, tous corrects sur le fond (sécurité/déploiement, `61b60ac`, langue, ISP, UI → use cases, 48 px, patterns, outillage, lots). Arborescence revérifiée contre `src/` : 20 ports driving, 9 driven, 6 hooks, 4 modes, 4 services | bord (non-perte) | **PASS** |
| T5 | 33 liens relatifs, 0 cassé ; tous les renvois textuels (`CONVENTIONS` § 1/4/5/7/11/12/13/14, CHARTE, PLAN § 0/1.3/4/6, 6 titres de `DEPLOIEMENT`, `sec.md` § Checklist, `rules/theme-colors` § Exceptions, `orchestrate` § Niveaux / Monter en gamme) existent ; renvois « `CLAUDE.md` § <titre> » dans `.claude/`, `docs/`, `README.md`, `.ai/` (journaux figés compris) → titre existant | renvois | **PASS** |
| T6 | Zéro résultat pour les 4 motifs ; `compact*` seulement en sens ordinaire | renvois | **PASS** |
| T7 | Phrase canonique 1 fois dans chacun des 8 briefs + `architecture-context.md`, `orchestrate`, `refresh-architecture`, `.ai/README.md` ; brief du générateur complet, « mieux vaut plus long que faux » retiré ; `sec.md` : un seul bloc `@@ -16,2 +16,5 @@`, checklist intacte ; `rules/` : citations / vocabulaire seulement | briefs | **PASS** |
| T8 | `.ai` **146 l. / 12 246 o.** (LF) ; 10 sections ; `### Sécurité` (l. 59) ; « Où lire quoi » ; 0 énoncé de règle (`== 1`, `169, 168, 166`, `supérieur ou égal`, `inférieur ou égal`, `moins de fléchettes`, `< 0`, `Trois marques`, `exactement 0`, `MISS`) — `170` une fois, dans un constat ; 5 surfaces gravées (formulation condensée, D2) ; **13 exceptions** toutes présentes (fusionnées en 8 lignes) ; constats : 6 reportés + README 318, 2 retirés avec justification, 2 nouveaux ; citations vérifiées | index | **PASS** |
| T9 | `CLAUDE.md` 530 l. / 34 092 o. → **338 l. / 20 315 o.** (≤ 340). Budgets : Arborescence 11/12, Conventions 9 sous titre /9, État 4/5, Notes 7/8, Déploiement 10 sous titre /10. `DEPLOIEMENT.md` 82 l. / 5 273 o. | taille | **PASS** |
| T10 | lint, typecheck, test verts ; 339 tests = PLAN § 0 l. 19 | non-régression | **PASS** |
| J | Journaux figés (`docs/lots/{bundle-par-route,tour-du-monde-cloture-volee,pourcentage-doubles-tiret}`, `docs/audits/2026-09-10.md`) : aucun changement | bord | **PASS** |
| Q-dev 1 | Statut du 5b : plus rien ne le dit « fait » hors journaux figés (`CLAUDE.md` l. 70 ne cite que le mode ; PLAN l. 28-29, 391 : 🟡 ; `.ai` l. 117, 140-141 cohérents). Nuance préexistante : PLAN § 0 l. 14 « Lots 0 à 5c livrés », qualifié dès l. 28 | bord | **PASS** |

## Résultats

| Commande | Résultat |
|---|---|
| `npm run lint` | « Checked 200 files in 69ms. No fixes applied. », exit 0 |
| `npm run typecheck` | exit 0 |
| `npm test` | « Test Files 33 passed (33) / Tests 339 passed (339) », exit 0 |

Environnement : avertissements git « LF will be replaced by CRLF » sans effet (fichiers en LF
sur disque, 0 `\r`). `git show` et `wc` autorisés.

## Bugs trouvés

| # | Bug | Classement | Renvoi |
|---|---|---|---|
| D1 | `.ai` l. 126 cite `PROJECT_PLAN.md:601` (« QUE `MatchStarted` et `VisitRecorded` ») ; ligne réelle **602**. Sév. basse | Bug d'implémentation | Dev (boucle 1) |
| D2 | `.ai` l. 87 « Liste identique à celle d'`orchestrate` » alors que la liste est condensée (« `backupSchema` (export / import JSON) » → « `backupSchema` », « schéma Dexie et ses migrations » → « et migrations »). Fond identique, « identique » trop fort. Sév. info | Bug d'implémentation | Dev (boucle 1) |
| D3 | La limite « statistiques de carrière limitées au X01 » de l'ancien `.ai` a disparu de « Hors périmètre » (l. 112) ; hors « jamais sacrifiés », reste à la source (PLAN l. 397). Sév. info | Bug d'implémentation | Dev (boucle 1) |
| D4 | `02-dev-notes.md` : citations imprécises — en-tête « `CLAUDE.md:1-12` » (l. 11 est nouvelle) ; Lot 3 bis « PLAN:333-339 » → **335-341** ; Lot 4 « PLAN:196 » → **198-201**. Contenu présent aux bonnes lignes. Sév. basse | Bug d'implémentation (doc du lot) | Orchestrator |

Aucun problème de test.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Marge de `.ai` = 42 octets : une régénération future débordera probablement. Relever le plafond ? | Revue / Utilisateur |
| 2 | Les budgets de l'archi (« ≤ 9 l. », « ≤ 10 l. ») comptent-ils le titre ? Conventions 10 et Déploiement 11 titre compris, tenus sous le titre | Revue / Orchestrator |
| 3 | Les doublons Biome et TS 7 perdent leurs exemples concrets (`!**/dist` vs `!**/dist/**`, « sinon Biome refuse de parser », littéral `"paths": { "@/*": ["./src/*"] }`) ; la vérité reste dans `biome.json` / `tsconfig.json`. Acceptable ? | Revue |
| 4 | `DEPLOIEMENT.md` l. 73-77 : deux puces iOS redondantes (dev-notes Q3). Fusionner ? | Revue |
| 5 | Info : PLAN l. 1344 (journal) dit « Ajouté à la liste `ports/driving/` de `CLAUDE.md` § Arborescence » — vrai historiquement, le titre renvoie à `CONVENTIONS` § 14. Rien à faire sous P2 | Revue |

## Rejeu — boucle 1, tour 1 (2026-10-01)

> `test` (opus / high), ciblé. HEAD = `main` = `a00e9a8`, rien modifié.

| # | Cas | Résultat |
|---|---|---|
| D1 | `.ai` l. 126 → `PROJECT_PLAN.md:150-151,602` ; PLAN l. 602 = « **Le journal ne stocke QUE `MatchStarted` et `VisitRecorded`.** » | **PASS** |
| D2 | `.ai` l. 87 « Liste condensée ; `orchestrate` fait foi : » ; mêmes 5 surfaces que `orchestrate/SKILL.md` l. 38-47 | **PASS** |
| D3 | `.ai` l. 112 « carrière hors X01 (PLAN:397) » ; PLAN l. 397 « les statistiques de carrière restent volontairement au X01 » | **PASS** |
| D4 | `02-dev-notes.md` : `CLAUDE.md:1-10,12-13,15-18`, PLAN 335-341 (texte identique à `main` l. 349-352, indentation près), PLAN 198-201 | **PASS** |
| T8 | **146 l. / 12 279 o.** (+33 o. = D2 +1, D3 +32) ; 9 titres `##` + le `#` = 10 sections du brief ; `### Sécurité` l. 59-64 (4 renvois attendus) ; « Où lire quoi » l. 73-83 ; 5 surfaces (l. 88-93) ; 13 exceptions (l. 102-109) ; 0 énoncé de règle ; 8 constats, citations revérifiées | **PASS** |
| NR | `git diff --stat main` : mêmes 23 fichiers, tous `.md` ; non suivis inchangés ; rien de modifié sous `src`, `tests`, `scripts`, `public`, ni config. `npm test` : 33 fichiers / **339 tests** verts | **PASS** |

Aucun nouveau défaut.

**Questions du rejeu**

| # | Question | Pour qui | Résolution |
|---|---|---|---|
| R1 | Marge de `.ai` tombée à **9 octets** | Utilisateur | **Tranchée 2026-10-01 : plafond relevé à ≤ 160 lignes / ≤ 13 312 octets** (brief du générateur l. 3 et 71, `refresh-architecture` l. 14, `.ai/README.md` l. 10, PLAN § 6 l. 1458). Marge actuelle ≈ 1 Ko |
| R2 | `.ai` l. 112 ≈ 124 caractères (coupe ≈ 100 ailleurs) | Revue | Forme seule, sans effet de rendu |
| R3 | `04`, `05`, `06` datés d'avant `01` | Orchestrator | **Close** : gabarits copiés à la mise en place, non encore remplis — normal |
