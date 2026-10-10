# Lot `confidentialite-assetlinks` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (opus / max), 2026-10-03.

## Verdict : **GO (phase Revue)**

Aucun renvoi vers Dev, Test, Sécurité ni Archi. Le GO **ne vaut pas acceptation des risques** et
ne couvre pas la documentation durable, encore à écrire. Conditions avant le commit :

- **C1** : documentation écrite selon la checklist ci-dessous, puis `/refresh-architecture`.
- **C2** : réponse explicite de l'utilisateur à chaque point de l'arrêt final.
- **C3** : si l'utilisateur accepte `hosting.predeploy`, ce GO tombe pour la partie concernée
  (révision Archi, constat 8).

## Contrôles rejoués

| Contrôle | Résultat |
|---|---|
| `biome check .` | OK, 215 fichiers |
| `tsc --noEmit` | OK |
| `vitest run` | OK, 41 fichiers, **456 tests** (+19 : UI 9, `firebaseHosting` 6, `reseauBoundary` 4) |
| `npm run build` | OK, 48 entrées (788,43 Kio) ; `ConfidentialiteEcran-*.js` précaché, aucune URL `.well-known` |
| `npm run smoke` | Code 1 sur la seule garde `REMPLIR` (`assets/index-lumkIy0j.js : 4`) |
| `git diff --check`, fins de ligne | OK, nouveaux fichiers en LF |
| `request.md` | Identique à `docs/request/…` (`cmp`) |
| `git status` | 7 modifiés + 7 non suivis, tous du lot |

## Tenue du design

D1 à D6 livrés tels quels (D1 confirmé par V4 rejouée trois fois). Les écarts de `02-dev-notes.md`
(4 au premier passage, 2 en boucle 2) sont justifiés.

## Critères d'acceptation

| # | Résultat |
|---|---|
| 1 | OK — tests UI, captures 4 configurations, accès direct par le smoke |
| 2 | OK — revérifié contre le code (clés `localStorage` et `sessionStorage`, suppressions, Wake Lock / vibration en partie seulement, aucun `navigator.share`, libellés « Annonce vocale » / « Annoncer les volées ») |
| 3 | OK — le smoke vérifie le type tableau, à dessein pour le lot 4 |
| 4 | OK dans les deux sens |
| 5 | OK — `firebaseHosting` + V4 |
| 6 | Tâche utilisateur, après remplissage et déploiement |
| 7 | OK — seul l'échec voulu du critère 4 subsiste |

## Constats

| # | Sév. | Constat | Renvoi | Résolution (Orchestrator) |
|---|---|---|---|---|
| 1 | mineur | Documentation durable non écrite ; la modification de `CLAUDE.md` § DS (surface gravée) ne sera vue par aucune revue | Aucun | Écrite avant le commit ; le diff de doc est montré à l'utilisateur |
| 2 | mineur | Q2 close sur une prémisse inexacte : l'intake ne différait que l'éditeur et le contact ; **4 valeurs** restent à remplir (dont l'entité et l'adresse de l'hébergeur), pas 2 | Aucun | **Posé à l'utilisateur** à l'arrêt final ; résolution de `01-architecture.md` corrigée par cette ligne |
| 3 | mineur | Q5 (« hors périmètre ») et Q6 (« acceptée ») tranchées par l'Orchestrator, sans signature utilisateur | Aucun | **Reconnu** : ce sont R-d et R-e, posés à l'utilisateur |
| 4 | mineur | `lazyRoutes.test.ts:8` « 16 écrans » était exact avant le lot, faux après (9 + 8 = 17) — la résolution de `02` Q4 reposait sur une prémisse fausse ; `labels.ts:256` attribue à `reseauBoundary` plus qu'il ne couvre | Aucun (commentaires) | **Corrigé** dans un court passage Dev avant le commit |
| 5 | mineur | Engagements sans fil-piège : « aucun cookie », « jamais la caméra, le micro, la localisation… », liste des données stockées | Aucun | Mitigation documentaire (checklist sec, `CLAUDE.md`, DEPLOIEMENT) ; durcissement facultatif proposé à l'utilisateur |
| 6 | info | La phrase de R-d recopie deux littéraux JSX de Réglages ; un renommage casserait la mitigation en silence | Aucun | Signalé dans DEPLOIEMENT ; facultatif |
| 7 | info | « Dartpéro n'a ni serveur ni compte », « sur ce téléphone seulement » (sauvegarde système non vérifiée) | Aucun | À juger par l'utilisateur |
| 8 | info | `hosting.predeploy` = changement de design sur `firebase.json` → **révision Archi**, pas un passage Dev direct (corrige la résolution de `04` v3) | Aucun | Posé à l'utilisateur |
| 9 | info | `00-orchestration.md` § Blocages ouverts vide alors que des décisions attendent l'arrêt final | Aucun | **Corrigé** : décisions listées |
| 10 | info | Ligne-lien d'À propos écrite en ligne (variante ad hoc justifiée par D6) | Aucun | À extraire dans `commun/` au deuxième usage |

**Hors lot** : H1 l'import écrase sans confirmation (dit désormais publiquement ; contraire à
l'esprit de `sec.md`) ; H2 `<h2>` laiton ≈ 3,94:1 en clair ; H3 guillemets orphelins, libellés
de Réglages dans le JSX ; commentaire « Fusion, jamais remplacement » de `ManageBackupUseCase`.

## Invariants

Dépendances, couleurs (aucune en dur, aucun `rounded-*`, rien sous `craie/60`), aucune règle de
jeu, aucune valeur persistée renommée : OK. `CLAUDE.md` et `.ai` : à faire avant le commit (C1).

## Checklist de la documentation (résumé)

1. **`CLAUDE.md`** (≤ 8 lignes) — § Déploiement : `ignore` jamais de `!` (no-op glob ≥ 9, inverse
   en glob 7), exception extglob, garde `firebaseHosting`, règle `headers` assetlinks après le
   fourre-tout, `/.well-known/` hors repli et précache, smoke rouge tant que `REMPLIR` sans aucun
   contournement, renvoi DEPLOIEMENT. § DS sous « pas de réseau » : la politique l'affirme ; toute
   capacité réseau, permission ou donnée stockée nouvelle se livre avec la mise à jour de
   `SECTIONS_CONFIDENTIALITE` et de sa date.
2. **`docs/DEPLOIEMENT.md`** — nouvelle section « Confidentialité et Digital Asset Links » (URL
   Play Console, R1, remplissage des 4 `MENTION_*` et de la date, R4, R5 élargi, R-d, `ignore` et
   V4 avec procédure, en-têtes et R-f, SW, ce que remplira le lot 4, `curl.exe`, R-a, R-e) ; mises
   à jour de § Mettre en ligne, En-têtes de cache, Service worker, Réécriture SPA, « Contrôles de
   `npm run smoke` », en-tête du fichier.
3. **`docs/PROJECT_PLAN.md`** — § 0, § 3, § 4 (« ✅ Fait — 456 tests verts (+19) »), § 6, § 5
   facultatif.
4. **Feuille de route** — ligne 3 faite, prémisse `**/.*` corrigée, ligne 4 enrichie, démarches
   hors code, `deblocage-pro` / lot 6, prochaine étape.
5. **`.claude/CONVENTIONS.md` § 14** ; **`.claude/agents/sec.md`** (checklist : politique à
   jour, `ignore` sans `!`, `/.well-known/` hors repli).
6. **`/refresh-architecture`** en dernier (plafond 160 lignes / 13 312 octets ; index à 154 / 13 132).
7. **Commit** : fichiers ajoutés explicitement, jamais `dist/`.

## Version 2 — revue ciblée (2026-10-10, `review`, opus / max)

**Verdict : NO-GO de forme pour le commit en l'état ; GO sans nouvelle revue une fois les
corrections faites**, sauf si la réponse de l'utilisateur change un texte ou la mise en page.
Aucun renvoi vers Dev, Test, Sécurité ni Archi.

Contrôles rejoués : `biome` OK (215), `tsc` OK, **456 tests**, build OK (48 entrées), **smoke code
0**, `grep -rl REMPLIR dist` vide, contact présent une fois dans le bundle, `git diff --check`
OK, doc en LF, `request.md` identique.

- **Mentions et constat 4** : diff limité à `labels.ts`, `lazyRoutes.test.ts`,
  `confidentialite.test.tsx`, conforme à `02-dev-notes.md` ; constat 4 clos (« 17 écrans »).
- **Doc** : `CLAUDE.md` OK (+12 lignes, uniquement décisions et pièges) ; DEPLOIEMENT complet ;
  PLAN, feuille de route, `sec.md`, index `.ai` (147 / 13 297, constat #11 juste) OK.

| # | Correction demandée | Résolution (Orchestrator) |
|---|---|---|
| 1 | CONVENTIONS § 14 : la liste des écrans transverses omet Confidentialité | **Fait** (l. 261 et 303-305) |
| 2 | Réponse utilisateur : (a) formulations du constat 7, (b) C5, (c) éditeur et contact public | Posée à l'arrêt final |
| 3 | Tenue de `00-orchestration.md` (Q2 close, doc close, statut, journal avec modèles) | **Fait** |
| 4 | Version 2 de `05-revue.md` | **Fait** (ce paragraphe) |
| 5 | `06-echanges.md` au déroulé réel | **Fait** |
| 6 | Index git périmé (5 fichiers indexés dans une version ancienne) | Au commit : `git add` explicite des 28 chemins, `git diff` vide, jamais `dist/` |
| 7 | `git stash drop stash@{0}` après le commit, jamais `pop` | Proposé à l'utilisateur après le commit |

Notes : **N1** valeurs des mentions recopiées dans DEPLOIEMENT, source de l'entité non notée →
**fait** (renvoi + « à revérifier ») ; **N2** « l'affirme » ambigu dans `CLAUDE.md` → **fait** ;
**N3** l'index a perdu le renvoi LF / `.gitattributes` (toujours dans `CLAUDE.md` § Environnement)
→ accepté, plus de marge ; **N4** « inversait » présenté comme observé → **fait** (« aurait
inversé, déduit du code »).
