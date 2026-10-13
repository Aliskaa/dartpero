# Lot `nom-de-partie` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu, `archi-authority`
> (opus / max, 2026-10-12). Le rapport source commence par `Architecture result: PASS`.
> Scout et designer sautés : surface gravée annoncée par l'intake.

## Problème

Une partie n'a pas d'identité lisible : l'historique la repère à sa date et à ses règles, le
résumé et le bandeau au jeu seulement. Le lot lui donne un nom, dans les quatre modes. Ce nom
recouvre deux objets de nature différente :

- **Le nom tapé** (≤ 30 caractères, espaces autour retirés) est une **donnée persistée** : il
  vit dans le journal sans renommer aucune valeur, survit à l'annulation, au rejeu à froid, à
  l'export / import et à « On remet ça », et reste facultatif — aucune migration.
- **Le nom par défaut** (« Jour tranche », nuit 0-5 h rattachée à la veille) est un
  **libellé** : jamais écrit, recalculé à l'affichage depuis `createdAt`, à l'heure locale. Le
  domaine n'a pas besoin de `Date`.

Deux contraintes font la conception : l'étape 1 doit connaître « maintenant » avant que la
partie existe (l'UI a besoin d'une horloge) ; les écrans de partie et de résumé ne lisent
aujourd'hui que des projections d'état, qui ne portent ni le nom ni `createdAt`.

Aucune règle de jeu ne change.

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| **Q1-A — `name?` facultatif sur les 4 événements d'ouverture (retenue)** | Le journal reste la seule source de vérité ; la doc du port le dit (« seules les dates ne sont pas déductibles du journal », `MatchRepository.ts:5-10`). Export sans code (`exportAll` recopie `events`). Dexie stocke `events` tel quel : ni mapping ni `db.version(3)`. L'annulation ne touche jamais l'ouverture. `RestartMatch` lit déjà l'ouverture. `backupSchema` : un seul point, `versOuverture`. Prévu par l'étude prospective (l. 55, 170). | Champ déclaré quatre fois ; un cinquième mode doit y penser — atténué par `nameOf` exhaustif, `CONVENTIONS` § 13, tests des 4 modes. |
| Q1-B — `name` dans `MatchRecord` | Un seul champ. | Contredit la doc du port ; six points de mapping (`StoredMatch`, `save`, `versRecord`, `exportAll`, `BackupMatch`, `versMatchRecord`), chacun peut perdre le nom en silence. |
| Q1-C — événement `MatchNamed` séparé | Ouvertures intactes ; extensible à un renommage. | Les 4 `project` rejettent tout événement non-volée après l'ouverture (`x01/rules.ts:194-196`) → 4 règles touchées ; la garde d'annulation `events.length <= 1` laisserait annuler le nom ; une vieille app refuserait la partie à l'import. **Rejetée.** |
| **Q2-b — `Services.clock` exposé à l'UI, même instance que les use cases (retenue)** | Le temps reste un port ; test UI déterministe via `fakeServices({ clock: new SettableClock(...) })` ; proposition et `createdAt` viennent de la même horloge ; deux lignes de câblage ; demandé par l'étude (l. 173). | Une exception de plus à « UI → use cases », de même nature que `devices`, à documenter. |
| Q2-a — `Date.now()` dans l'UI | Aucun câblage. | Contredit `container.ts:68` ; tests seulement via `vi.setSystemTime` (mock de global, contraire à `rules/testing`). |
| Q2-b' — `Services.devices.clock` | Rangée avec l'appareil. | Deux horloges dans `Dependencies` ; proposition et `createdAt` incohérentes en test. |
| Q2-c — port driving « proposer un nom » | Aucune exception. | Le cœur ne produit pas de français ; sortirait le calcul de `labels.ts`, contre l'intake. |
| **L-1 — nouveau port driving `GetMatchName` → `{ name, createdAt }` (retenue)** | Petit port (ISP), 8 consommateurs (4 bandeaux, 4 résumés), cache `staleTime: Infinity` sûr (pas de renommage) ; l'import invalide déjà toutes les requêtes (`ReglagesEcran.tsx:285`). | Une lecture IndexedDB par écran, négligeable. |
| L-2 — élargir `GetMatchMode` | Une lecture, déjà faite par l'aiguillage. | Change le contrat d'un port d'aiguillage ; il faudrait un contexte React. |
| L-3 — projeter le nom dans l'état de chaque mode | Pas de port. | `createdAt` hors journal : nom par défaut incalculable ; 4 règles touchées pour rien. |

## Approche retenue

### Q1 (intake) — tranchée : le nom vit dans l'événement d'ouverture

- `readonly name?: MatchName` sur `X01Started`, `TourDuMondeStarted`, `CricketStarted`,
  `CheckoutPracticeStarted`. Discriminants inchangés (`'MatchStarted'` reste).
- ⚠️ Rien de tapé → **clé absente**, jamais `name: undefined` ni le nom par défaut (IndexedDB
  conserverait la clé ; `exactOptionalPropertyTypes` n'est pas activé). Spread conditionnel, et
  un test vérifie `'name' in ouverture === false`.
- **Lecture** : `nameOf(events): MatchName | null`, pure, dans
  `src/core/domain/events/MatchEvent.ts`. `switch` sur le type du premier événement : les 4
  ouvertures rendent `name ?? null` ; `RoundStarted`, `VisitRecorded`, journal vide → `null` ;
  `default` typé `never`.
- Aucune règle touchée : les `start` ne lisent que `config`, `playerIds`,
  `startingPlayerIndex`.

### Q2 (intake) — tranchée : l'UI lit l'heure par `Clock`, jamais par `Date.now()`

- `Services.clock: Clock` = l'instance passée aux use cases ; JSDoc de `Services` : exception
  de même nature que `devices`.
- `Date` reste permis dans l'UI **comme calendrier** d'un horodatage donné
  (`new Date(h).getDay()` / `getHours()`, comme `dateCourte`, `dateHeure`, `nomFichier`),
  jamais comme horloge.
- L'horloge est lue **une seule fois** par passage dans le parcours (initialiseur paresseux de
  `useState`) : un `clock.now()` par rendu ferait avancer `TickingClock` et décalerait les dates
  attendues par les tests existants.

### Fabrique validante

`src/core/domain/value-objects/MatchName.ts` :

- `export const MATCH_NAME_MAX_LENGTH = 30` ;
- `export type MatchName = Branded<string, 'MatchName'>` (réutilise `Branded` de `ids.ts`) ;
- `export const MatchName = { of(raw: string): MatchName | null }`.

Règles, dans l'ordre : (1) `trim()` JavaScript ; (2) vide après trim → `null` (absence, pas
erreur) ; (3) > 30 → `DomainError` avec la longueur, **jamais tronqué** (`CONVENTIONS` § 1).
Longueur en unités UTF-16 (`.length`), comme `maxLength` et `Player.cleanName`. **Aucune autre
normalisation** (espaces intérieurs conservés) — volontairement différent de
`Player.cleanName`, à dire en JSDoc.

### Nom par défaut

Dans `src/ui/labels.ts` : table `JOURS` indexée par `getDay()` (0 = « Dimanche ») ; table des
tranches (5 h matin, 12 h après-midi, 18 h soir, < 5 h nuit) ; `nomParDefaut(horodatage)` ;
`nomDePartie({ name, createdAt })` = `name ?? nomParDefaut(createdAt)`. Ni `toLocaleString`
ni `Intl`.

- Nuit : si `getHours() < 5`, jour = `JOURS[(getDay() + 6) % 7]`. ⚠️ Jamais
  `horodatage − 5 h` (jours de 23 / 25 h au changement d'heure — même leçon que
  `GetPlayerStatsUseCase.ts:20-26`).
- Format : « Jour tranche », jour capitalisé, tranche en minuscules.
- Date utilisée : à l'étape 1, `services.clock.now()` lu une fois (la **proposition**) ; après
  création, `createdAt` du `MatchRecord` (historique via `MatchSummary.createdAt`, bandeau et
  résumé via `GetMatchName`).
- **Comportement assumé** : un champ resté sur la proposition n'écrit rien ; si la tranche
  change entre l'ouverture du parcours et le lancement, la partie affiche la tranche de sa
  création. Conforme à l'intake ; aucun test ne doit attendre l'inverse.

### Transit étape 1 → étapes 2 / 3, retour du téléphone

- L'état vit dans `useNouvellePartie`, appelé une seule fois par `NouvellePartieEcran`, qui
  **reste monté** sur toutes les routes `/nouvelle-partie/*` (`App.tsx:71`) : `proposition`
  (initialiseur paresseux) et `saisieNom` (initialisée à la proposition). `NouvellePartieEcran`
  passe valeur, setter et proposition à `EtapeJeu`.
- Retour du téléphone ou bouton retour (`useRetour`) : le parent n'est pas démonté, la valeur
  reste (critère 10). Sortie du parcours (lancement, Accueil, entrée directe à l'étape 2 par
  « Changer les règles ») : la valeur disparaît, la partie suivante repart de la proposition.
- Jamais `usePreference`, `localStorage`, l'URL ni `location.state`. Limite acceptée : un
  rechargement en plein parcours perd le nom tapé.
- Étapes 2 et 3 inchangées ; seul chemin de lancement : `demarrer` puis `lancer`
  (`EtapeJoueurs.tsx:137`, `EtapeOrdre.tsx:87`).
- **Le champ** : `<input type="text">` au-dessus des cartes, libellé visible
  `LIBELLE_NOM_PARTIE` (« Nom de la partie ») relié, `maxLength={MATCH_NAME_MAX_LENGTH}`,
  ≥ 48 px, tokens, texte ≥ `craie/60`, aucun `rounded-*`, **pas d'`autoFocus`**, rien
  d'obligatoire ; placeholder = proposition quand le champ est vidé (recommandé). Mettre à jour
  le commentaire « Une question par écran » d'`EtapeJeu`.

### Lancement

- Les 4 commandes gagnent `readonly name?: string` (texte tapé, brut ; absent si rien de tapé),
  comme `ManagePlayers.create(nom)`.
- L'UI décide « tapé ou non » dans `lancer` (ou une petite fonction pure testable) :
  `propre = saisieNom.trim()` ; vide ou égal à `proposition` → pas de `name` ; sinon
  `name: propre`.
- Les 4 use cases (`StartMatchUseCase`, `PlayTourDuMondeUseCase`, `PlayCricketUseCase`,
  `PlayCheckoutPracticeUseCase`) appellent `MatchName.of` **avant toute écriture** (avant tirage
  et `save`) : > 30 → `DomainError`, rien de sauvé ; `null` → pas de clé.

### RestartMatch

Chaque branche passe `name: ouverture.name` à la commande de son mode ; le nom repasse par
`MatchName.of` (même contrôle qu'un premier départ). Sans nom, rien d'écrit ; `createdAt` vient
de l'horloge, d'où un nom par défaut d'après la nouvelle date (critère 9). JSDoc mise à jour ;
`ActionsFinDePartie` inchangé.

### Lecture et affichage

- `MatchSummary` : `BaseSummary.name: MatchName | null` ; `summarize` ajoute
  `name: nameOf(record.events)`. `null` = aucun nom tapé. L'Accueil reçoit le champ sans
  l'afficher.
- Port `src/core/application/ports/driving/GetMatchName.ts` :
  `type MatchNaming = { readonly name: MatchName | null; readonly createdAt: number }`,
  `interface GetMatchName { execute(matchId: MatchId): Promise<MatchNaming> }` ;
  `GetMatchNameUseCase(matches)` : `loadMatch` → `{ name: nameOf(events), createdAt }` ;
  identifiant inconnu → `DomainError` (comme `GetMatchMode`).
- Hook `src/ui/hooks/useNomDePartie.ts` : `useQuery({ queryKey: ['matchNom', matchId],
  staleTime: Infinity })` → `nomDePartie(data)`, ou `null` pendant le chargement.
- **Bandeau** : `DispositionPartie` (4 écrans de jeu, eux seuls) gagne une prop **obligatoire**
  `nomPartie: string | null` (TypeScript signale l'écran oublié). Rendu dans `.bandeau-match`,
  une ligne, `min-w-0 truncate`, ≥ `craie/60`. **Hauteur réservée même à `null`**, ou nom logé
  dans la rangée existante : la zone de lecture ne bouge pas (critère 11).
- **Résumé** : `TableauHonneur` (tête des 4 résumés) gagne la même prop obligatoire ; nom en
  tête, **sans second `<h1>`**.
- **Historique** : `CartePartie` affiche `nomDePartie(partie)` en titre, puis la ligne de
  règles et `ApercuPartie`. `ApercuPartie` **ne change pas** (sert aussi l'Accueil).
- Le nom n'apparaît **jamais** dans l'annonce vocale, le nom du fichier d'export ni l'URL.

### backupSchema

Point unique : `versOuverture`.

- **Accepté** : pas de clé `name` (toute sauvegarde d'avant le lot) → pas de nom ; une chaîne →
  `MatchName.of` (vide / espaces → clé absente ; 1-30 → gardée normalisée).
- **Refusé** (partie écartée, comptée dans `matchesSkipped`, le reste s'importe) : `name` non
  chaîne (`null`, nombre, booléen, objet, tableau), via `texte(...)` ; chaîne > 30 après trim.
- **Ignoré** : un `name` sur un autre événement (déjà perdu par la reconstruction champ par
  champ).
- **Export** : rien à faire.
- **`BACKUP_VERSION` reste à 1** : ajout rétrocompatible ; une vieille app perdrait le nom
  (cosmétique) au lieu de refuser tout le fichier ; précédent des trois modes ajoutés sans
  incrément. Le préciser dans le commentaire de `BACKUP_VERSION` (`ManageBackup.ts:3`).

### Ce qui ne change pas

Règles de jeu, `games/index.ts`, projections ; `MatchRecord`, schéma Dexie, migrations, tous
les adapters ; `ManageBackupUseCase` ; `chemins.ts`, `App.tsx`, `PartieEcran.tsx` ;
`ApercuPartie`, l'Accueil, les statistiques.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | **Créer** `value-objects/MatchName.ts`. **Modifier** `events/MatchEvent.ts`. | VO `MatchName`, `MATCH_NAME_MAX_LENGTH` ; `name?: MatchName` sur les 4 ouvertures ; `nameOf` exhaustif. Aucune règle. |
| `core/application/` | **Modifier** `ports/driving/StartMatch.ts`, `PlayTourDuMonde.ts`, `PlayCricket.ts`, `PlayCheckoutPractice.ts`, `MatchSummary.ts`, `ManageBackup.ts` (commentaire) ; `use-cases/StartMatchUseCase.ts`, `PlayTourDuMondeUseCase.ts`, `PlayCricketUseCase.ts`, `PlayCheckoutPracticeUseCase.ts`, `RestartMatchUseCase.ts`, `summarize.ts`, `backupSchema.ts`. **Créer** `ports/driving/GetMatchName.ts`, `use-cases/GetMatchNameUseCase.ts`. | `name?: string` dans les commandes ; validation avant écriture ; propagation à la relance ; `MatchSummary.name` ; lecture validée à l'import ; port de lecture. |
| `infrastructure/` | Aucun. | Dexie stocke `events` tel quel ; pas de migration. |
| `ui/` | **Modifier** `labels.ts`, `hooks/useNouvellePartie.ts`, `ecrans/nouvelle-partie/NouvellePartieEcran.tsx`, `EtapeJeu.tsx`, `composants/commun/DispositionPartie.tsx`, `TableauHonneur.tsx`, les 4 écrans de jeu (`X01Ecran`, `TourDuMondeEcran`, `CricketEcran`, `EntrainementEcran`), les 4 résumés (`ResumeX01Ecran`, `ResumeTourDuMondeEcran`, `ResumeCricketEcran`, `ResumeEntrainementEcran`), `ecrans/HistoriqueEcran.tsx`. **Créer** `hooks/useNomDePartie.ts`. | Libellés, tables, `nomParDefaut`, `nomDePartie`, politique (sous réserve de sec) ; champ et état du parcours ; nom dans bandeau, résumé, historique. |
| `composition/` | **Modifier** `container.ts`. | `Services.getMatchName`, `Services.clock` (exception documentée). |
| `tests/` | Voir ci-dessous. | Domaine, use cases, sauvegarde, Dexie, libellés, parcours, écrans, garde recommandée. |
| docs (fin de lot) | `CLAUDE.md`, `CONVENTIONS` § 7 / 13 / 14, charte (maquette du bandeau), `rules/glossary.md`, `PROJECT_PLAN` § 4 / 6, `.ai/architecture-context.md` (régénéré). | Voir § Décisions. |

**Sens des dépendances vérifié :** `ui`/`infrastructure` → `application` → `domain`.
`MatchName.ts` n'importe que `../DomainError` et le type `Branded` ; l'application n'importe que
le domaine ; l'UI consomme ports et types du domaine (plus `MATCH_NAME_MAX_LENGTH`, comme
`DEFAUT_ENTRAINEMENT`) ; câblage dans `container.ts` seul ; aucun mode n'importe un autre mode.

**Nouveau port ?** Driving `GetMatchName` — premiers consommateurs : 4 écrans de jeu et
4 résumés via `useNomDePartie`. Aucun port driven nouveau : `Clock` est seulement exposé à l'UI
(`Services.clock`), premier consommateur `useNouvellePartie`.

## Tests attendus par couche

| Couche | Fichier suggéré | Cas |
|---|---|---|
| Domaine | `tests/domain/matchName.test.ts` | Trim ; vide, espaces, `'\t\n'` → `null` ; 30 accepté, 31 refusé (`DomainError`), 30 + espaces autour accepté ; jamais tronqué. `nameOf` : 4 ouvertures avec / sans nom, journal vide, premier événement non-ouverture. Ouverture nommée projetée à l'identique, 4 modes. |
| Use cases | `tests/use-cases/nomDePartie.test.ts` | 4 lancements : « ␣␣Finale des potes␣␣ » → `'Finale des potes'` ; sans nom, `''`, `'   '` → **pas de clé** ; 31 → `DomainError` et base vide. `getMatchHistory` rend `name`. `getMatchName` → `{ name, createdAt }`, `DomainError` sur id inconnu. Journal d'avant le lot → `name: null`, projeté et relancé (critère 7). Annuler une volée garde le nom (X01, entraînement avec `RoundStarted`). |
| Relance | `tests/use-cases/restartMatch.test.ts` | 4 modes avec nom : même nom. 4 modes sans : pas de clé, `createdAt` = nouvelle heure d'un `SettableClock` avancé d'un jour (critère 9). |
| Sauvegarde | `tests/use-cases/backup.test.ts` | Sauvegarde littérale d'avant le lot importée, `name: null`. Aller-retour export → JSON → import vierge : nom restitué, 4 modes ; sans nom → sans clé. `name` = `42`, `null`, `true`, `{}`, `[]`, 31 caractères → partie écartée, `matchesSkipped` + 1, reste importé. `'  Finale  '` → `'Finale'` ; `'   '` → pas de nom. Export toujours `version: 1` (critère 8). |
| Infrastructure | `tests/infrastructure/dexieRepositories.test.ts` | Ouverture nommée traverse `save` / `findById` (`fake-indexeddb`) ; sans nom → sans clé. |
| UI, libellés | `tests/ui/nomDePartie.test.ts` | Bornes en heure **locale** (`new Date(a, m, j, h, min)`). Critère 1 : dimanche 11/10/2026 21 h → « Dimanche soir ». Critère 2 : toutes les bornes. Bouclage : dimanche 1 h → « Samedi nuit », lundi 0 h → « Dimanche nuit ». Les 7 jours. Changements d'heure 29/03 et 25/10/2026 à 4 h 59 / 5 h. `nomDePartie` : tapé prioritaire, `null` → défaut. |
| UI, parcours | `tests/ui/nouvellePartie.test.tsx` avec `SettableClock(dimanche 21 h)` | Champ prérempli « Dimanche soir » ; `maxLength` 30 ; nom tapé → carte → étape 2 → `retourTelephone()` → nom présent (critère 10), idem bouton retour ; lancement avec espaces → `name` ; non touché / vidé / espaces → pas de clé ; **4 jeux** (critères 3, 4, 5) ; sortie puis retour → proposition, aucune préférence nouvelle. |
| UI, écrans | `tests/ui/*.test.tsx` | Historique : nom tapé en titre, défaut pour sans nom / avant le lot. 4 résumés : nom en tête. 4 bandeaux : nom présent. « On remet ça » garde le nom tapé. |
| Architecture (recommandé) | `tests/architecture/horlogeBoundary.test.ts` | Aucun `Date.now(` ni `new Date()` sans argument dans `src/ui` et `src/core` ; plancher de fichiers ; échantillon fautif qui fait échouer la regex. |
| Politique | `tests/ui/confidentialite.test.tsx` | Date figée (l. 85) ; mention du nom si sec la confirme. |
| Relecture à l'écran | Utilisateur | 4 bandeaux portrait / paysage, sombre / clair, nom de 30 caractères larges (« MMMM… »), dont X01 en sets avec DO et DI ; champ ≥ 48 px ; carte d'historique ; tête des résumés. |

## Décisions de `CLAUDE.md` concernées

**Appliquées et respectées** : § DS « liste d'événements » (nom tapé = fait de l'ouverture, nom
par défaut dérivé) ; § DS « pas de réseau » et règle de la politique (texte et date à mettre à
jour) ; § DS « export / import JSON » ; § DS « Nouvelle partie en étapes, chaque étape est une
route » (le nom est une valeur de formulaire portée par la racine du parcours) ; § DS « TanStack
Query n'orchestre pas le match » (`useNomDePartie` = lecture en cache d'une donnée immuable) ;
§ Règle d'architecture ; § Conventions « UI → use cases » (+ exception `clock` documentée) ;
§ Charte (zones intactes, angle vif, 48 px) ; `rules/persistence`.

**À graver en fin de lot** — dans `CLAUDE.md` § DS :

> **Nom de partie** (lot `nom-de-partie`) : seul un nom **tapé** s'écrit — champ facultatif
> `name` de l'événement d'ouverture des quatre modes, 30 caractères au plus, espaces autour
> retirés (`MatchName.of`). ⚠️ Le nom par défaut (« Dimanche soir », nuit de 0 h à 5 h
> rattachée à la veille) est un **libellé recalculé à l'affichage** depuis `createdAt`
> (`labels.ts`) : ne jamais l'écrire, ni « compléter » les anciennes parties. L'UI lit l'heure
> par `services.clock` (même exception que `devices`), jamais par `Date.now()`.

Ailleurs : `CONVENTIONS` § 7 (exception `clock`), § 13 (un nouveau mode porte `name?` ; TS ne
signale pas l'oubli dans `lancer` ni `RestartMatch`, il signale `nameOf` et `nomPartie`), § 14
(arbre) ; charte (bandeau) ; glossaire (« nom de partie | `MatchName` ») ; `PROJECT_PLAN` § 4,
§ 6 ; régénérer `.ai/architecture-context.md`.

## Baseline sécurité

| Frontière | Risque | Mitigation | Résiduel / owner |
|---|---|---|---|
| Import JSON (`versOuverture`) | Nom non texte, trop long ou piégé, persisté ; champ inconnu persisté. | `texte()` puis `MatchName.of` avant le `save` ; entrée invalide écartée et comptée ; reconstruction champ par champ ; `__proto__` sans effet. | Constat n° 11 préexistant (validation par entrée dans la boucle d'écriture, écrasement d'un id sans confirmation). Sec : vérifier l'absence de régression. |
| Format persisté | Renommage, migration, perte, clé `undefined`. | Ajout facultatif ; discriminants intacts ; pas de migration ; l'annulation ne touche pas l'ouverture ; clé absente testée. | Une vieille app perd les noms (cosmétique). Sec : confirmer `BACKUP_VERSION = 1`. |
| Rendu d'une saisie | Injection HTML ; nom envoyé hors du téléphone. | Texte React seulement. Interdits : `dangerouslySetInnerHTML`, `innerHTML`, `href`/`src`/`style`, annonce vocale, nom de fichier d'export, URL, `location.state`, `localStorage`. | Caractères de contrôle / bidi venus d'un fichier importé (affichage local trompeur, sans injection). Sec (question 4). |
| Politique `/confidentialite` | Donnée stockée nouvelle non déclarée. | Avis : mettre à jour texte et date dans ce lot. | Clôture : sec. |
| Réseau, dépendances, SW, en-têtes, permissions | — | Rien touché ; `reseauBoundary` inchangé. | — |
| `localStorage` | Donnée de partie hors IndexedDB. | Le nom tapé n'est qu'un `useState` du parcours. | — |

**Question n° 3 de l'intake (politique) — avis préliminaire : oui.** Le paragraphe « Sur votre
appareil » de `SECTIONS_CONFIDENTIALITE` (`labels.ts:295`) énumère ce qui est stocké (« Vos
profils (pseudo, couleur, date de création) et vos parties (chaque fléchette saisie, avec ses
dates) … ») ; un texte libre tapé, potentiellement personnel, est une donnée stockée nouvelle.
Piste : « vos parties (leur nom, si vous en avez tapé un, et chaque fléchette saisie, avec ses
dates) ». `DATE_MISE_A_JOUR_CONFIDENTIALITE` (l. 273) et `confidentialite.test.tsx:85` suivent.
Clôture : sec.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Forme exacte du nom dans le bandeau des 4 modes (= Q4 de l'intake) : ligne réservée au-dessus de la rangée actuelle, ou logée dans la rangée en paysage ? Casse ? Cas le plus chargé : X01 en sets. | Dev, puis relecture utilisateur |
| 2 | Tête du résumé et carte d'historique : élément exact (pas de second `<h1>` dans le résumé ; `<h2>` envisageable dans la carte) ? Troncature ou retour à la ligne à 30 caractères ? | Dev |
| 3 | Politique : libellé exact et date (= Q3 de l'intake). Avis préliminaire : oui. | Sécurité |
| 4 | `MatchName.of` doit-il refuser caractères de contrôle (C0/C1) et marques bidi venus d'un import ? Avis archi : non requis, résiduel bas. | Sécurité |
| 5 | Confirmer `BACKUP_VERSION = 1`. | Sécurité |
| 6 | Lecture de l'exemple « samedi 1 h → Samedi nuit » : les tests suivent le critère 2 (dimanche 1 h calendaire → « Samedi nuit »). | Test |
| 7 | Écrire la garde « pas de `Date.now()` dans `src/ui` ni `src/core` » ? Recommandé. | Test |
| 8 | Tests existants comparant un `MatchSummary` entier gagnent `name: null` ; `confidentialite.test.tsx:85` fige la date : ajustements attendus, pas des régressions. | Test |
| 9 | Vigilance : `clock.now()` lu une seule fois ; jamais la proposition dans le journal ; pas d'`autoFocus`. | Dev |

### Résolutions de l'Orchestrator au gate Architecture (2026-10-12)

- **Q1 et Q2 de l'intake** : tranchées ci-dessus (événement d'ouverture ; `Services.clock`).
- **Q6** : close. Le critère 2 de l'intake (« 0 h → nuit de la veille ») et « rattachée à la
  veille » sont explicites : la nuit est nommée d'après le jour calendaire **précédent**
  (dimanche 1 h → « Samedi nuit »). L'exemple « samedi 1 h » de l'intake se lit « la nuit de
  samedi, à 1 h ». Les tests suivent le critère 2.
- **Q7** : recommandation retenue — Test écrit (ou fait écrire) la garde `horlogeBoundary` ;
  à défaut, Test le justifie dans `03-plan-de-test.md`.
- **Q8** : close — ajustements attendus, pas des régressions.
- **Q1, Q2, Q9** : assignées à Dev, closes dans `02-dev-notes.md` (Q1 aussi à la relecture
  utilisateur). **Q3, Q4, Q5** : assignées à Sécurité, closes dans `04-revue-securite.md`.

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.

### Révision 1 — 2026-10-12 — amendement utilisateur du nom de la nuit

**Origine** : question Q6 remontée par la Revue (§ 9), tranchée par l'utilisateur (deux
confirmations, la seconde sur un exemple concret). Ce n'est pas une boucle 3 / 4 / 7 (aucune
faille de design ni refonte) : c'est un changement de spécification d'un libellé. La chaîne
d'architecture n'est pas relancée : aucune couche, aucun port, aucun format persisté ne bouge.

**Ce qui change** (remplace § Nom par défaut, puce « Nuit », et Q6) :

- La nuit (0 h-5 h) prend le nom du **jour du calendrier** : samedi 1 h → « Samedi nuit »,
  dimanche 1 h → « Dimanche nuit », lundi 0 h → « Lundi nuit ». Plus de rattachement à la
  veille : `JOURS[getDay()]` pour toutes les tranches, sans `(getDay() + 6) % 7`.
- Critère 2 amendé : 4 h 59 → nuit **du jour même** ; 0 h → nuit **du jour même** ; les autres
  bornes sont inchangées.
- Le ⚠️ « jamais `horodatage − 5 h` » devient sans objet pour le jour, mais la règle
  « `getDay()` / `getHours()` de l'horodatage local, sans arithmétique en millisecondes »
  demeure ; les tests de changement d'heure restent (bornes 4 h 59 / 5 h ces jours-là).

**Ce qui ne change pas** : tables dans `labels.ts`, ni `Intl` ni `toLocaleString`, nom par
défaut jamais écrit, calculé depuis `createdAt` (ou la proposition à l'étape 1).

**Texte à graver** (`CLAUDE.md` § DS) : « nuit de 0 h à 5 h, au nom du jour du calendrier » au
lieu de « rattachée à la veille ».
