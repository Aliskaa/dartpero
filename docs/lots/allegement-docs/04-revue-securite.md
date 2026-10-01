# Lot `allegement-docs` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport du sous-agent `sec` (opus, effort high),
> 2026-10-01. Tout lu sur disque, comparé à `main` (`a00e9a8`) par `git diff main` et
> `git show main:…` ; `docs/DEPLOIEMENT.md` (non suivi) lu directement.

**Verdict : RAS sécu.** Aucun constat, aucun retour Dev ni Archi.

## Menaces considérées

- **Déploiement** : une règle de cache ou de service worker perdue en route — un futur lot
  réordonne les `headers` de `firebase.json` ou casse le garde-fou `vite:preloadError`, et
  l'appli reste figée chez tout le monde.
- **Décision « zéro réseau / pas de SDK Firebase »** affaiblie par la réécriture, laissant passer
  un `import` de `firebase` dans `src/`.
- **Import JSON, seule entrée non fiable** : sa consigne disparaît d'une source lue par un agent.
- **Briefs** : un brief modifié affaiblit la checklist sécu, la baseline d'architecture, les
  surfaces gravées ou « jamais de `git add -A` ».
- **Régénérations futures de `.ai`** : le plafond pousse le générateur à sacrifier `### Sécurité`.
- **Secrets / configuration** : secret glissé dans la doc, `.claude/settings*.json` modifié.
- Le joueur qui tape les scores et le fichier de sauvegarde reçu d'un pote : **pas touchés**
  (aucun fichier de code dans le diff).

## Surfaces vérifiées sur le diff

| Surface | Touchée par le lot ? | Vérifié |
|---|---|---|
| Zéro réseau (`fetch`, SDK `firebase`) | Non (doc seule) | Bloc Décisions structurantes identique à `main` l. 39-98 (`diff` vide) |
| Import JSON / `backupSchema` | Non | `rules/persistence.md` non modifié ; renvoi présent `.ai` l. 56-58, 62 |
| Rendu d'une saisie (pseudo, fichier) | Non | Aucun `src/` dans le diff |
| Format persisté (Dexie, `MatchEvent`) | Non | Idem |
| Service worker / `firebase.json` | Non (code) ; doc déplacée | R1 ci-dessous |
| Permissions navigateur | Non | — |
| Dépendances (`npm audit`) | Non | `package.json`, `package-lock.json` hors diff ; `npm audit` sans objet |
| Secrets | Non | Recherche `api_key\|secret\|token\|password\|AIza\|PRIVATE` sur le diff et `DEPLOIEMENT.md` : seulement « aucun secret » et des tokens de design ; projet `dartpero` et compte partagé déjà versionnés à `main` |

`git diff main --name-only | grep -v '\.md$'` : vide. Aucune modification de
`.claude/settings*.json`, `.firebaserc`, `firebase.json`, `package.json`.

### R1 — aucune règle de sécurité perdue

Chaque ligne non vide de `main:CLAUDE.md` l. 407-446 et 476-517 cherchée mot pour mot
(`grep -F`) dans les destinations :

- **Toutes les lignes sécurité / déploiement sont retrouvées mot pour mot dans
  `docs/DEPLOIEMENT.md`** : Hosting et rien d'autre + `firebase-tools` globale ; rewrite
  `** → /index.html` ; `max-age=3600` par défaut ; `immutable` sur `/assets/**` et
  `/workbox-*.js` ; `/icons/**` 7 jours ; `no-cache` pour le reste ; « la dernière règle
  `headers` qui matche l'emporte » ; en-têtes sur le chemin DEMANDÉ ; routes lazy et
  `lazyRoutes.test.ts` ; Rolldown, `vite:preloadError` et garde-fou `sessionStorage` ; deux modes
  de dev, `dev:mobile` auto-signé, HTTPS Firebase, iOS ; `sharp` en devDependency.
- **Une seule ligne non retrouvée mot pour mot : la commande, corrigée volontairement** —
  `build` + `smoke` + `firebase deploy --only hosting`, conforme à `package.json:11`
  (`"smoke": "node scripts/smoke-build.mjs"`) et `:19` ; `scripts/smoke-build.mjs` existe.
- Les autres lignes non retrouvées mot pour mot ne touchent pas la sécurité (TS 7, Biome, jsdom,
  polices, Wake Lock) — doublons jugés par Test (T4). La frontière hexagonale reste dans
  `rules/biome.md` l. 14-19, chargé d'office.
- **`CLAUDE.md` garde les deux pièges de cache vitaux** (§ Déploiement, l. 315-327).
- **Le manuel confirme le code** : `DEPLOIEMENT.md` § En-têtes de cache = `firebase.json`
  (`**` → `no-cache` en premier ; `/assets/**`, `/workbox-*.js` → `max-age=31536000,
  immutable` ; `/icons/**` → `604800`).
- Le bandeau de `DEPLOIEMENT.md` (l. 3-6) renvoie à la décision gravée et dit ne jamais la
  contredire.

### R2 — `.claude/agents/sec.md`

Un seul bloc (`@@ -13,8 +13,11 @@`) : l. 16-17 remplacées par la phrase canonique et « Ouvre
`CLAUDE.md` à la section indiquée… ». Checklist Dartpéro, classement et sortie **intacts**.
Élargissement de la lecture, pas affaiblissement.

### R3 — index et briefs

`.ai` § Sécurité (l. 59-64) renvoie aux quatre bonnes sources (`CLAUDE.md` § Décisions
structurantes, `rules/persistence` + `backupSchema`, `docs/DEPLOIEMENT`, `sec.md` § Checklist).

| Élément de l'ancien § Sécurité | Où il est maintenant |
|---|---|
| Frontière hexagonale (Biome + `hexagonalBoundary.test.ts`) | Constat n° 2 (moyenne), `.ai` l. 124 — plus exact qu'avant |
| `nanoid` de `npm audit` | `.ai` l. 137 → PLAN § 6 lot UX ; `PROJECT_PLAN.md:1047-1050` |
| `firebase-tools` globale | `DEPLOIEMENT.md` § Mettre en ligne |
| « La baseline sécu des archi ne remplace pas `sec` » | Retirée de l'index ; toujours `orchestrate/SKILL.md:346-347`, qui fait foi |

Briefs : seuls les paragraphes de lecture changent (+ la ligne de croissance de `CLAUDE.md` dans
`review`). Baseline sécu d'`archi-authority` hors diff ; surfaces gravées d'`orchestrate` (dont
service worker / `firebase.json`) et « jamais de `git add -A` » (l. 190) inchangées ;
`rules/commit.md:13` inchangé ; `.ai` l. 87-93 garde les 5 surfaces avec « `orchestrate` fait
foi ».

### Plafond ≤ 160 l. / ≤ 13 312 o. et « jamais sacrifiés »

Protection suffisante : le brief rend `### Sécurité` obligatoire avec ses quatre renvois
(`.claude/agents/architecture-context.md:89-92`), et **aucune règle de sécurité ne vit seulement
dans l'index** — elles sont dans `sec.md`, `rules/persistence.md` (injecté), `CLAUDE.md`
(injecté) et `DEPLOIEMENT.md`. Une coupe future ferait perdre un pointeur, pas une règle.
Mesure : 146 l. / 12 279 o.

## Constats

| # | Sévérité | `fichier:ligne` | Scénario | Classement |
|---|---|---|---|---|
| — | — | — | Aucun | — |

## Mitigations

Aucune nécessaire : aucune ligne de code touchée (T1), règles de sécurité déplacées retrouvées
mot pour mot, `sec.md` modifié aux seules l. 16-17.

## Risques acceptés

Aucun.

## Questions ouvertes

Aucune bloquante. Précision : le contrôle mot pour mot des règles de sécurité vaut pour ce lot ;
lors des régénérations futures de `.ai`, seule la relecture `sec` du lot concerné le refera (pas
de test automatique — choix de l'archi § 5).
