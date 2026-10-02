# Lot `installation-guidee` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (opus / max, frontmatter).

## Version 1 — 2026-10-01 — **no-go**

### Résumé

Le diff livre le design de `01-architecture.md` (options D, G, L) sans refonte :

- port `AppInstallation` (5 états, `state` / `subscribe` / `prompt`, `NullAppInstallation`),
  sans import ni API nommée ;
- adapter `BrowserAppInstallation`, seul lecteur des 4 API (grep + garde) : écouteurs dans le
  constructeur sous `try/catch`, garde de type puis `preventDefault`, dernière invite gardée,
  `prompt()` qui retire et publie avant toute attente, `installed` seulement depuis
  `appinstalled` / mode autonome, en mémoire ; `detectIosBrowser` pure ;
- `createBrowserServices()` une fois au module de `main.tsx:53`, après `vite:preloadError`,
  avant `createRoot` ; `ServicesProvider` à prop obligatoire, ne crée plus rien ;
- `useInstallation` (`useSyncExternalStore`) ; ligne d'Accueil, entrée À propos avec ancre,
  refus de « Redemander » qui propose l'installation hors de la région live ; texte dans
  `labels.ts` ;
- manifeste (`id: '/'`, `description`, `categories`, raccourci, 3 captures identiques à
  `cmp`), `globIgnores`, contrôles statiques du smoke ;
- intacts : `firebase.json`, `package.json`, lock, `biome.json`, `tsconfig.json`,
  `index.html`, `tests/setup.ts` ; +71 tests ; docs du § 8 ; index régénéré après sa dernière
  source.

**Contrôles relancés par la Revue** : `biome check .` 211 fichiers OK ; `tsc --noEmit` OK ;
`vitest run` 437/437 (38 fichiers) ; build 47 entrées (782,16 KiB) ; smoke OK ;
`dist/manifest.webmanifest` conforme ; `dist/sw.js` sans `screenshots` ; `ls` : 20 driving
(+ `MatchSummary.ts`), 11 driven, 8 hooks (+ `tourDeTable.ts`), conforme à `CONVENTIONS` § 14 ;
index 153 l. / 13 090 o. LF (13 243 CRLF) ; `git status` inchangé.

**Écarts de `02-dev-notes.md`** : tous légitimes (CRLF → LF sans changement de contenu et
nécessaire au lint — voir n° 7 ; `paysage:hidden` ; fake fidèle — mais voir n° 2 ;
`scroll-mt`, `biome-ignore`, `scrollIntoView` restauré — voir n° 9).

**Phases** : Dev a livré le design ; Test a couvert les zones de risque par 16 mutations ; Sec
a lu le diff réel (références exactes).

### Constats

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| 1 | mineur | `.claude/rules/frontend-react.md:13` énumère les hooks (`useJoueurs`, `useAppareil`, `useStockagePersistant`) sans `useInstallation`, créé par ce lot. **Même trou** que le constat 1 (v1, no-go) du lot `stockage-persistant`, corrigé alors sur cette ligne. Le § 8 de `01` ne cite pas ce fichier ; Dev n'a mis à jour que `CONVENTIONS` § 14 | **Dev** |
| 2 | mineur | **L1** : les deux tests « ouvre l'invite une fois » (`tests/ui/installation.test.tsx:77-89`, `:179-191`) ne peuvent pas échouer sur un double appel, `FakeAppInstallation.prompt()` ne comptant rien hors `installable` (`tests/fakes/index.ts:142-144`). L'attente de `request.md` n'est tenue que par l'adapter (BAI:172, M5). Sans effet en production ; acceptation de l'Orchestrator rejointe. Optionnel : faire compter chaque appel par le fake si une passe Dev a lieu | Aucun |
| 3 | mineur | `docs/DEPLOIEMENT.md:121` (R4 « Accepté. ») et `:139` (R3 « (accepté) ») présentent comme acquis deux risques **non signés** (`04` § Résolutions ; `orchestrate` § Boucles : « seulement si l'utilisateur l'a signé »). Juste si l'utilisateur signe à l'étape 8 ; sinon texte (Dev) ou comportement (Archi) | Aucun (étape 8) |
| 4 | mineur | L'ancre `#installer` ne sert que sur iOS (WebKit), mais le « saut fonctionne » de `02` a été mesuré dans Chromium. `EtatProtection` (au-dessus d'À propos) rend `null` jusqu'à `status()`, donc après le `scrollIntoView` ; Chromium compense par l'ancrage de défilement, WebKit probablement pas (non vérifié). Risque : sur iPhone, le guide atterrit plus bas, derniers gestes sous `NavigationBasse`. Gêne, pas panne | Aucun (iPhone, R2) |
| 5 | info | Après « Installer », invite consommée → `unavailable` : la ligne d'Accueil disparaît aussi sur **refus** de la fenêtre ; juste après **acceptation**, les Réglages disent « Installez Dartpéro depuis le menu… » jusqu'à `appinstalled`. Voulu, mais se lit mal. Idem `REFUS_REDEMANDE_STOCKAGE` en état installé | Aucun (libellés, étape 8) |
| 6 | info | iPad couvert par `ios-manual`, mais « Sur iPhone, … » (`labels.ts:230`, O2) et « Touchez Partager, en bas de l'écran » (`labels.ts:241`) sont faux pour lui (Partager en haut sur iPad) | Aucun (libellés, étape 8) |
| 7 | info | Six fichiers modifiés sans diff (`src/App.tsx`, `PersistentStorage.ts`, `NavigatorPersistentStorage.ts`, `useStockagePersistant.ts`, `NavigatorPersistentStorage.test.ts`, `stockagePersistant.test.tsx`) : les `.ts`/`.tsx` de `1fc9194`, réécrits en CRLF par `switch` / `merge --ff-only` sous `autocrlf=true`. La fusion de ce lot ferait de même sur ses 16 sources et rendrait `npm run lint` rouge sur `main`. `.gitattributes` (Q5 de `02`) à trancher **avant l'étape 10** | Aucun (utilisateur) |
| 8 | info | Sec « déjà publiques » : prémisse fausse (pas de remote). Les PNG seront publiés pour la première fois sous `dartpero.web.app/screenshots/` ; contenu : base de démonstration (« Kevin », « Julien »), aucune métadonnée | Aucun |
| 9 | info | `ReglagesEcran.tsx:183` : **premier** `biome-ignore` de `src/` et `tests/`. Étroit, justifié, déclaré. `rules/biome.md` muet sur les suppressions : précédent | Aucun |
| 10 | info | `orchestrate` § Niveaux cite SW et `firebase.json`, pas le manifeste ; la 5e surface ne couvre pas `CLAUDE.md` § Déploiement, où `id: '/'` est gravé. Un lot « manifeste seul » pourrait passer en `light` ; le smoke reste le filet | Aucun (utilisateur) |
| 11 | info | Dérives de doc : la ligne `docs/DEPLOIEMENT.md` de la table de `CLAUDE.md:11` ne cite pas « Installation et manifeste » ; PLAN § 3 (routes `/`, `/reglages`) ignore l'invitation ; feuille de route l. 50 « l. 213 » vaut maintenant 224. Peut accompagner le n° 1 | Aucun |
| 12 | info | `01-architecture.md:396` attribue le double out à `false` à `cc8faf7` ; c'est `577dc5f` (`git log -S`) | Aucun |

### Clôture des questions 01 à 04

Toutes ont une résolution écrite, aucune n'est recopiée.

- **Closes par un fichier du lot** : 01 Q2, 01 Q5 (Sec), 02 Q3, 02 Q4 (index régénéré).
- **Renvoyées à l'étape 8, légitimement** : libellés (01 Q1, 02 Q1, 03 Q2), relecture à
  l'écran (01 Q3, 03 Q3), signature R3 / R4 (04 Q1), `.gitattributes` (02 Q5). Réserves : saut
  vérifié seulement sous Chromium (n° 4) ; `DEPLOIEMENT.md` anticipe la signature (n° 3) ;
  5 images sur 16 relues par le Dev.
- **Hors lot, PLAN § 0** : R1, R2, R5, R6.
- **L1 (03 Q1)** : clôture légitime, mais l'argument « le test UI vérifie que le clic atteint le
  port, pas l'unicité » contredit l'intitulé des deux tests et `request.md` (n° 2) — à dire à
  l'utilisateur.

### Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) | OK (port sans import ; adapter → type du port ; UI → type + `useServices` ; `main.tsx` → composition root ; `hexagonalBoundary` vert) |
| Aucun mode de jeu n'en importe un autre | OK (domaine intouché) |
| Aucune couleur en dur dans `src/ui`, aucun `rounded-*` | OK (grep vide, `themeBoundary` vert ; tokens en paires existantes ; rien sous `craie/60`) |
| Aucune règle de jeu réimplémentée dans l'UI | OK |
| Aucune valeur persistée renommée | OK (`installation:ecartee` documentée « ne jamais renommer » ; « installée » en mémoire) |
| Sec a parcouru le diff (pas seulement les notes) | OK (réserve n° 8) |
| `CLAUDE.md` à jour des décisions durables du lot | OK (deux ajouts exacts, concis ; nit n° 11) |
| `.ai/architecture-context.md` régénéré si une décision a été gravée | OK |
| Routes lazy, 48 px, `aria-hidden`, `<output aria-label>`, texte dans `labels.ts` | OK |

### Go / no-go

**Verdict :** no-go
**Justification :** code conforme, vérifié et couvert, aucun bug. Seul le n° 1 (Dev) bloque :
dérive de doc **créée par ce lot**, triviale, identique à celle qui a valu un no-go au lot
`stockage-persistant` — la laisser passer créerait un double standard. Boucle 5, rejeu Test +
Sécurité + Revue. Peut embarquer sans obligation n° 2 (fake ; Test revérifie M1) et n° 11.

### Points non résolus après le lot

- **Étape 8 (utilisateur)** : libellés (dont iPad n° 6, `unavailable` après acceptation et
  refus en état installé n° 5) ; relecture à l'écran (portrait / paysage, sombre / clair,
  contraste `craie/70` / `craie/75`, hauteur de « Plus tard », ligne paysage 66 px, 11 captures
  jamais ouvertes) ; signature R3 / R4 (sinon n° 3) ; L1 (n° 2) ; `.gitattributes` **avant
  fusion** (n° 7) ; statuts écrits par anticipation (« livrés » PLAN § 0, « ✅ fait » feuille
  de route).
- **Après déploiement (PLAN § 0)** : R1 (« Computed App ID », vraie fenêtre Chrome), R2
  (iPhone, iPad, + saut vers `#installer` depuis l'Accueil, n° 4), R5 (raccourci ; ne jamais
  désinstaller sans exporter), R6.
- **Hors lot** : manifeste dans les surfaces gravées (n° 10) ; double out à l'écran de
  création (index n° 9) ; captures `docs/captures/` qui ne montrent pas la nouvelle UI (à
  refaire un jour, puis recopier dans `public/screenshots/`).

---

## Version 2 — 2026-10-01 — **go** (rejeu après boucle 5, tour 1)

> Rapport du sous-agent `review` (opus / max). Tous les contrôles relancés par la Revue ;
> lecture seule tenue (`git status` identique, seul `dist/` reconstruit).

### Résumé

Le tour a fait ce qui était demandé, et rien d'autre (delta isolé par date de modification) :
`rules/frontend-react.md:13` (n° 1) ; `FakeAppInstallation.prompt()` et deux commentaires de
test (n° 2) ; `CLAUDE.md:11`, PLAN § 3, feuille de route l. 50 (n° 11) ; `01:396-397` et `04:32`
corrigés par l'Orchestrator (n° 12, n° 8) ; index régénéré. **Rien n'a changé dans `src/`** :
`useInstallation.ts`, touché par la mutation du Dev, est revenu à un seul
`void installation.prompt()` (`:42`) ; `vite.config.ts`, smoke, `public/screenshots/`, port et
adapter antérieurs à la v1 ; `firebase.json`, `package*.json`, `biome.json`, `tsconfig.json`,
`index.html`, `tests/setup.ts` identiques à `HEAD`.

**Contrôles** : `biome check .` 211 OK ; `tsc --noEmit` OK ; `vitest run` 437/437 (38) ; build
47 entrées (782,16 KiB) ; smoke OK (`#root` 20071 octets) ; `request.md` identique à sa source
(`cmp`).

**Phases rejouées** : Test a refait M1 (3 échecs sur 28, contre 0 avant) ; Sec a isolé le
delta, relu le hook muté, réévalué « Secrets » — vérifié par la Revue (md5 identiques, images
ouvertes : « Kevin », « Julien », scores ; pas de remote ; `firebase.json` sert `dist`).

**Index** : régénéré à 21:44, après sa dernière source (`CLAUDE.md`, 21:41:56) ; 153 l. /
13 102 o. LF (13 255 CRLF) ; toutes les lignes citées revérifiées exactes.

### Constats

**Statut des constats v1**

| n° | Statut | Preuve |
|---|---|---|
| 1 | **Clos** | `frontend-react.md:13` cite `useInstallation` ; plus aucune liste de hooks ne l'oublie (`CONVENTIONS.md:308-309`) |
| 2 | **Clos** | `tests/fakes/index.ts:144-149` compte avant la garde ; les 3 `toBe(1)` et 3 `toBe(0)` relus ; M1 détectée |
| 3 | Inchangé, étape 8 | `DEPLOIEMENT.md:121`, `:139` disent « accepté », R3 / R4 non signés |
| 4 | Inchangé, R2 | Saut vers `#installer` mesuré sous Chromium seulement |
| 5, 6 | Inchangés, étape 8 | Libellés |
| 7 | Inchangé, avant l'étape 10 | Avertissements « LF will be replaced by CRLF » ; pas de `.gitattributes` |
| 8 | **Clos** | `04:32` corrigé ; résiduel « prénoms » ouvert en conséquence (n° 13) |
| 9, 10 | Inchangés | Info ; hors lot |
| 11 | **Clos** | `CLAUDE.md:11` → `DEPLOIEMENT.md:100` ; PLAN l. 205, 213 ; feuille de route « l. 224 » exact |
| 12 | **Clos** | `01:396-397` cite `577dc5f` (confirmé par `git log -S`) |

**Constats nouveaux**

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| 13 | mineur | Résiduel « prénoms » : en cas de refus, le remède « nouvelles captures **avant le déploiement** » n'est ancré nulle part, alors que le déploiement est la prochaine étape écrite (feuille de route, R1 en PLAN § 0) et que le smoke exige la présence des PNG. Refus → refaire les captures avant le commit, ou inscrire « pas de déploiement avant nouvelles captures » en PLAN § 0 et dans la « Prochaine étape ». Acceptation → rien | Aucun (étape 8) |
| 14 | info | Feuille de route l. 50 : « README qui annonce 318 tests (réel : 339) » — il y en a 437. Périmé depuis `1fc9194`, antérieur au lot | Aucun (`nettoyage-claude-md`) |
| 15 | info | Même oubli sur la même ligne deux lots de suite : `frontend-react.md:13` recopie la liste de `CONVENTIONS` § 14 ; un renvoi supprimerait le piège (`rules/README` : « renvoient à CONVENTIONS pour le détail ») | Aucun (hors lot, workflow) |

**Corrections directes de l'Orchestrator** — toutes **légitimes** : `01:396-397` (hash,
mécanique, vérifié, annoté, journalisé ; pas une révision de design) ; `04:32` (demandée par
Sec, annotée, journalisée ; « Touchée ? Non » reste juste, `sec.md:85` vise des secrets) ;
clôture « autres lignes de la feuille de route » (vérification sans modification). À réserver
aux corrections mécaniques, sans arbitrage.

**Clôture des questions 01 à 04, rejeu compris** : toutes résolues par écrit. Closes : 01 Q2,
Q5 ; 02 Q3, Q4 ; 04 Q3 ; 03 Q1 (L1, désormais corrigée) ; remarque ligne 50. Étape 8 :
libellés, relecture, R3 / R4, prénoms (04 Q2), `.gitattributes` (avant l'étape 10). Hors lot,
PLAN § 0 : R1, R2, R5, R6.

### Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) | OK (`src/` inchangé par le tour ; gardes vertes) |
| Aucun mode de jeu n'en importe un autre | OK |
| Aucune couleur en dur dans `src/ui`, aucun `rounded-*` | OK |
| Aucune règle de jeu réimplémentée dans l'UI | OK |
| Aucune valeur persistée renommée | OK |
| Sec a parcouru le diff | OK (delta isolé, hook relu, PNG revérifiés) |
| `CLAUDE.md` à jour des décisions durables du lot | OK (le tour n'ajoute qu'un renvoi l. 11) |
| `.ai/architecture-context.md` régénéré | OK |
| Routes lazy, 48 px, `aria-hidden`, `<output aria-label>`, texte dans `labels.ts` | OK |

### Go / no-go

**Verdict :** **go** (phase Revue).
**Justification :** n° 1 (seul bloquant), 2, 8, 11, 12 clos ; aucune régression ; Test et Sec
rejoués sur le delta réel ; interventions de l'Orchestrator mécaniques et tracées ; nouveaux
constats sans boucle. Ce go **ne vaut pas** acceptation des risques : R3, R4 et les prénoms ne
le sont que signés par l'utilisateur à l'étape 8 ; `DEPLOIEMENT.md` (n° 3) et les statuts
« livré » / « ✅ fait » anticipent. Le lot n'est terminé qu'avec le go de l'utilisateur.

### Points non résolus après le lot

**Étape 8 — réponse explicite de l'utilisateur sur chaque point :**

1. Libellés (sous-texte Accueil, phrases d'état, `PRESENTATION_DARTPERO`, `description`,
   `label` des captures ; iPad n° 6 ; `unavailable` après « Installer » et refus en état
   installé n° 5).
2. Relecture à l'écran (portrait / paysage, sombre / clair ; `craie/70` / `craie/75` ; hauteur
   de « Plus tard » ; ligne paysage 66 px ; 11 captures sur 16 jamais ouvertes ; saut sous
   Chromium seulement, n° 4).
3. Signature R3 / R4 — sinon corriger `DEPLOIEMENT.md:121`, `:139`.
4. « Kevin » / « Julien » publiés — refus : n° 13.
5. Statuts anticipés (PLAN § 0, § 4, feuille de route).
6. `.gitattributes` avant l'étape 10 (n° 7).
7. Si un point modifie une source de l'index : `/refresh-architecture` avant le commit.

**Après déploiement (PLAN § 0)** : R1, R2 (+ saut sous WebKit), R5, R6.

**Hors lot** : manifeste hors des surfaces gravées d'`orchestrate` (n° 10) ; double out à
l'écran de création (index n° 9, `577dc5f`) ; `docs/captures/` sans la nouvelle UI ; chiffres
de tests périmés (n° 14, index n° 6) ; liste de hooks recopiée (n° 15).

---

## Version 3 — 2026-10-02 — **go** (rejeu après boucle 5, tour 2)

> Rapport du sous-agent `review` (opus / max). Lecture seule tenue (`git status` identique :
> 17 `M`, 10 `??` ; seul `dist/` reconstruit).

### Résumé

Le tour livre la décision de l'utilisateur du 2026-10-02, et rien d'autre en contenu :

- **Libellés iPad** — `labels.ts`, seul fichier de `src/` modifié depuis la v2 : `ios-manual`
  (`:230`) « Sur iPhone ou iPad… » ; étape 1 (`:242`) « Touchez Partager (ou ouvrez « … »
  d'abord). » ; JSDoc de la raison (`:236-240`). Plus aucun « en bas de l'écran » ni « Sur
  iPhone » seul dans `src/`, `vite.config.ts`, `index.html`. Captures v2 ouvertes : rien de
  rogné.
- **`.gitattributes`** : `* text=auto eol=lf`, `*.png binary`, LF sans BOM ; inscrit dans
  `CLAUDE.md:349-350` et PLAN § 6 (`:1583-1588`).
- **Hors mandat, sans effet de contenu** : conversion LF de fichiers propres et
  `git checkout --` sur 42 fichiers (n° 16).

**Contrôles** : `biome check .` 211 OK ; `tsc` 0 ; `vitest run` 437/437 ; build 47 entrées ;
smoke OK ; `git ls-files --eol` 287 `i/lf w/lf` + 17 `-text`, non suivis 16 `w/lf` + 3 PNG ;
aucun CR dans le lot ; `git diff --stat` identique avec et sans `--ignore-cr-at-eol` (17
fichiers, +685 / −112) ; `request.md` et captures identiques à leurs sources (`cmp`).
**Index** : régénéré à 08:13:03, après ses sources (08:09:35) ; 154 l. / 13 132 o. ; lignes
citées revérifiées.

### Constats

**Statut des constats v1 / v2**

| n° | Statut | Preuve |
|---|---|---|
| 1, 2, 8, 11, 12 | Clos (v2) | — |
| 3 | **Clos** | R3 / R4 signés (`00` journal du 2026-10-02, `04` § Signatures) ; `DEPLOIEMENT.md:121`, `:139` exacts |
| 4 | Inchangé, R2 | Saut vers `#installer` mesuré sous Chromium seulement ; absent de PLAN § 0 |
| 5 | Inchangé, étape 8 | Non couvert par « Corriger iPad d'abord » |
| 6 | **Clos** | Libellés corrigés ; tests porteurs inchangés (`installation.test.tsx:195-215`). Reste à l'œil : icône d'état `Smartphone` y compris sur iPad (`ReglagesEcran.tsx:190`) — pictogramme, pas libellé |
| 7 | **Clos** (épreuve finale à la fusion) | Les 42 fichiers réécrits par git sous `core.autocrlf=true` (gitconfig système) sont sortis en LF : l'attribut l'emporte ; plus de « modifié sans diff » |
| 9, 10, 14, 15 | Inchangés | Info, hors lot |
| 13 | **Clos** | Prénoms acceptés : pas de nouvelles captures |

**Constats nouveaux**

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| 16 | mineur | `git checkout --` sur 42 fichiers : **légitime sur le fond, hors mandat sur la forme**. Rien de perdu (35 `.md` / `.gitignore` propres avant le tour + les 6 « modifiés sans diff » ; les 17 fichiers du diff sont exactement ceux de `01` / `02`). Mais commande non demandée (`dev.md:70-71`) et irréversible sur un lot non committé, rendue nécessaire par une conversion LF elle-même non demandée (Biome ne lit pas le Markdown ; `.gitattributes` suffisait). Sûre grâce au contrôle préalable, pas par construction | Aucun. Hors lot : une ligne dans `dev.md` interdisant toute commande git qui réécrit la copie de travail sans accord |
| 17 | info | Conversion LF de `00` par l'Orchestrator (et de `00`, `01`, `04` par le Dev) : légitime (mécanique, journalisée, fichiers non suivis normalisés par `git add` de toute façon) | Aucun |
| 18 | info | Verrou de libellé accepté sans boucle : **conclusion juste, argument en partie faux** (le verrou serait aussi une sous-chaîne, comme `nouvellePartie.test.tsx:171-172` ; R2 vérifie l'exactitude, pas la régression). Vraies raisons : aucun test ne prétend vérifier ce libellé (pas de vert à vide, contrairement à L1) ; raison écrite à la source (JSDoc) et en PLAN § 6 ; une régression coûterait un libellé | Aucun |
| 19 | info | Dette `.gitattributes` réglée sans annotation là où elle est encore citée : `PLAN:1066` (journal daté, « commit dédié »), candidat n° 4 de l'audit `2026-09-10.md`, `skills/audit/SKILL.md:44` (index n° 10). Pas un double standard (aucun ne se présente comme inventaire à jour). Le message de commit doit nommer `.gitattributes` | Aucun (au commit ; annotations hors lot) |

### Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances | OK (seul `labels.ts` touché) |
| Aucun mode de jeu n'en importe un autre | OK |
| Aucune couleur en dur, aucun `rounded-*` | OK (`themeBoundary` vert) |
| Aucune règle de jeu réimplémentée dans l'UI | OK |
| Aucune valeur persistée renommée | OK |
| Sec a parcouru le diff | OK (delta, binaires, précache, effet du checkout) |
| Chaque ajout à `CLAUDE.md` est une décision gravée ou un piège vital | OK (`:349-350`, piège réel, 2 lignes) |
| Index régénéré après sa dernière source | OK |
| Texte dans `labels.ts`, `aria-hidden`, 48 px | OK |

### Go / no-go

**Verdict :** **go** (phase Revue).
**Justification :** décision livrée exactement, sans régression (437 tests, même précache,
même smoke, même diff hors fins de ligne) ; n° 3, 6, 7, 13 clos ; nouveaux constats sans
boucle (n° 16 : faute de procédure vérifiée sans dommage). Boucle 5 à son plafond (2/2), 2 tours
sur 5 : toute autre correction à l'arrêt relève d'une décision de l'utilisateur. Ce go ne vaut
ni validation des libellés, ni relecture à l'écran.

### Points non résolus après le lot

**Étape 8 (utilisateur)** : libellés d'ensemble (sous-texte Accueil, phrases d'état,
`PRESENTATION_DARTPERO`, `description`, `label` des captures, n° 5) ; relecture à l'écran
(portrait / paysage, sombre / clair ; `craie/70` / `craie/75` ; « Plus tard » 48 px ; rangée
paysage 66 px ; 11 captures sur 16 jamais ouvertes ; nouveau libellé vu en portrait seulement) ;
go final (statuts « livré » / « ✅ fait » vrais au commit).

**Commit (étape 9)** : indexer les 27 entrées de `git status` et elles seules ; `05` v3 et `06`
sans CR ; après `git add`, `git ls-files --eol` ne montre que `i/lf` et `i/-text` ; le corps du
message nomme `.gitattributes`.

**Fusion (étape 10)** : après `git merge --ff-only`, `git ls-files --eol | grep crlf` vide et
`npm run lint` vert sur `main`.

**Après déploiement (PLAN § 0)** : R1 ; R2 avec libellés sur un vrai iPad et saut vers
`#installer` sous WebKit (n° 4) ; R5 ; R6.

**Hors lot** : n° 10 (manifeste dans les surfaces gravées) ; index n° 9 (double out) ; n° 14 /
index n° 6 (README 318 tests) ; n° 15 (liste de hooks recopiée) ; n° 16 (ligne `dev.md`) ;
n° 19 (annotations `PLAN:1066`, audit, `skills/audit`) ; `docs/captures/` sans la nouvelle UI.
