# Lot `stockage-persistant` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport du sous-agent `sec` (sonnet / high, réglages du
> frontmatter). Niveau `high` seulement.

## Version 1 — passage initial

### Menaces considérées

- **Le joueur qui lit les Réglages** et croit ses données à l'abri parce que l'écran dit
  « protégées ». C'est la seule menace réelle du lot : la perte d'historique est l'incident le
  plus grave de l'appli.
- **Le navigateur** : une API `navigator.storage` absente, qui rejette ou qui lève, ne doit
  casser ni le démarrage ni les Réglages.
- **Une dépendance ou du réseau** : le lot n'en ajoute pas.
- **Un fichier de sauvegarde reçu d'un pote** : non concerné, l'import n'est pas touché.

### Surfaces vérifiées sur le diff

| Surface | Touchée par le lot ? | Vérifié |
|---|---|---|
| Zéro réseau (`fetch`, SDK `firebase`) | Non | `rg` de `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource` et `from 'firebase` : rien dans le diff (seul `historique.refetch()`, préexistant, appartient à TanStack Query) |
| Import JSON / `backupSchema` | Non | `backupSchema.ts` et `src/infrastructure/dexie/` sont inchangés |
| Rendu d'une saisie (pseudo, fichier) | Non | Aucun `dangerouslySetInnerHTML` ni `innerHTML`. Les libellés sont des constantes statiques rendues en texte React |
| Format persisté (Dexie, `MatchEvent`) | Non | Ni événement ni schéma touché. `persist()` ne change que la politique d'éviction |
| Service worker / `firebase.json` | Non | Absents de `git status`, comme `vite.config.ts` |
| Permissions navigateur | Oui | `persist()` / `persisted()` sont lus seulement dans `NavigatorPersistentStorage.ts:20,32,41`. Ce n'est pas une permission produit (caméra, micro…) : Chrome tranche en silence, Safari selon l'installation, et seul Firefox peut demander, friction déjà acceptée (`request.md`) |
| Dépendances (`npm audit`) | Non | `package.json` et le lock sont inchangés. `npm audit --omit=dev` : 0 vulnérabilité |
| Secrets | Non | Aucun |

**Robustesse** :
- **Adapter** : `try/catch` autour des deux appels, ce qui correspond au contrat « ne rejette
  jamais » du port.
- **Démarrage** : la promesse n'est pas attendue, et le garde `useRef` limite à un seul appel.
  Il n'y a pas de boucle.
- **Réglages** : `redemander` applique la valeur de retour, sans boucle non plus.

### Constats

| # | Sévérité | `fichier:ligne` | Scénario | Classement |
|---|---|---|---|---|
| 1 | Basse | `src/ui/labels.ts:189` et `:197` (`RAPPEL_EXPORT_STOCKAGE.persisted: null`) | **Fausse assurance.** L'état `persisted` affiche « le navigateur ne les effacera pas » avec une pastille verte, et aucun rappel d'exporter. Le joueur peut en conclure qu'il n'a pas besoin d'exporter. Or une désinstallation de la PWA, un effacement des données du site, un changement ou une perte de téléphone effacent tout malgré `persisted`. La mitigation promise par `01-architecture.md` § Baseline sécurité (« un libellé "protégé" qui ne promet rien contre la désinstallation ») n'est donc pas tenue. Atténuant : le panneau dit déjà que le JSON est la seule façon de changer d'appareil, et le bouton d'export est juste dessous. | **Bug d'implémentation** (une constante de `labels.ts`) |

Il n'y a pas de faille de design : le port et l'architecture sont sains.

Observation non classée : la fenêtre B3 de `03-plan-de-test.md` se trompe dans le sens
prudent (elle sous-promet), donc rien à faire.

### Mitigations

- Zéro réseau, zéro dépendance, zéro SDK `firebase`, aucune surface gravée touchée.
- Une API défaillante est absorbée : pas de rejet, pas de boucle, un seul appel.
- Les libellés sont statiques.
- Un rappel d'exporter est présent pour `not-persisted` et `unavailable`. Il manque pour
  `persisted` : c'est le constat 1.

### Risques acceptés

Aucun. `sec` ne s'en attribue aucun. La friction de la bannière Firefox est une décision de
l'intake (`request.md` § Risques), pas un risque accepté ici.

### Questions ouvertes

| # | Question | Pour qui | Résolution |
|---|---|---|---|
| 1 | Ajouter une réserve « pas une sauvegarde » dans l'état `persisted` ? | Utilisateur / Dev | **Close** : le constat 1 est classé bug d'implémentation, donc **boucle 2 automatique** (Sécurité → Dev). Ajouter une réserve dans l'état `persisted`, puis rejouer Test et Sécurité. Le libellé final reste validé par l'utilisateur à la relecture. |
| 2 | Comportement réel sur Android (PWA installée) et sur iPhone | Utilisateur | **Close pour le pipeline** : rattachée à l'arrêt de fin de lot (`01-architecture.md` Q2-Q3). |
| 3 | Rendu : contraste, retour à la ligne, taille du bouton | Utilisateur | **Close pour le pipeline** : relecture à l'écran à l'arrêt de fin de lot. |

## Version 2 — rejeu après boucle 2, tour 1

> Rapport du sous-agent `sec` (sonnet / high).

**Constat 1 : CLOS.**
- Le libellé est désormais borné à l'éviction par le navigateur : « …ne les effacera pas de
  lui-même » (`labels.ts:189`).
- Le rappel « Ce n’est pas une sauvegarde : exportez pour garder une copie. » est rendu dans
  le même `<output>` (`labels.ts:200` ; `ReglagesEcran.tsx:107,125`).
- La raison est écrite en commentaire : désinstallation, effacement des données du site, perte
  du téléphone (`labels.ts:195-198`).
- Le test `stockagePersistant.test.tsx:88-96` exige la présence de la réserve.

**Surfaces revérifiées** (`rg` sur tous les fichiers du lot, `git status`) :
- pas de réseau ni de `firebase` ;
- pas de `innerHTML` ;
- pas de `localStorage` ni de `sessionStorage` ;
- aucune dépendance ;
- `dexie/`, `use-cases/` (`backupSchema`, `ManageBackup`), `vite.config.ts` et `firebase.json`
  sont absents du diff ;
- les permissions sont inchangées.

**Nouveaux constats** : aucun. **Risques acceptés** : aucun.

**Questions ouvertes** : aucune nouvelle. Le comportement sur appareil, le rendu et les
libellés finaux restent rattachés à l'arrêt de fin de lot (questions closes pour le pipeline
en version 1).

## Version 3 — rejeu après boucle 5, tour 2

> Rapport du sous-agent `sec` (sonnet / high). **RAS sécu**, aucun nouveau constat.

**Surfaces revérifiées sur le diff réel :**
- Réseau : aucun appel ajouté. Seules nouvelles importations, trois icônes `lucide-react`,
  une dépendance déjà présente.
- Rendu : constantes statiques rendues en texte React. L'état vient d'une union fermée.
- Persistance et `backupSchema` : non touchés.
- `package*.json`, `vite.config.ts`, `firebase.json` : inchangés.
- Aucun secret, aucun `localStorage` ajouté.

**La mitigation « fausse assurance » tient**, et elle est plus solide qu'en version 2 :
- `Record<StorageProtection, string>` oblige TypeScript à fournir un rappel par état ;
- le rappel est rendu sans condition dans l'`<output>`.

Le seul moment sans rappel est `etat === null`, le temps de la réponse locale, avec le bouton
d'export juste dessous. Ce n'est pas un défaut.

**Remarque n° 5 de la Revue** (`.claude/agents/sec.md:77-79`) : elle ne change pas le verdict,
et le fichier n'est pas modifié.

> **Note de l'Orchestrator** : `sec` affirme ici que `persist()` « ne déclenche pas d'invite
> sur Chrome ni Firefox ». Cela contredit `request.md` § Risques et `05-revue.md` n° 6, qui
> s'appuient sur la doc MDN : Firefox affiche une invite. Le désaccord porte sur un fait
> secondaire, **pas sur une conclusion** : les deux phases jugent que le verdict n'en dépend pas.
> On retient la version de l'intake et de la Revue (Firefox peut demander). Ce n'est pas un
> blocage.

**Risques acceptés** : aucun. **Questions ouvertes** : aucune.

## Version 4 — rejeu après boucle 5, tour 3 (retour après refus)

> Rapport du sous-agent `sec` (sonnet / high). **RAS sécu.**

- **Surfaces** :
  - pas de réseau ni de `firebase` ;
  - le rendu se limite à un booléen et à une constante rendue en texte React, sans `innerHTML` ;
  - les permissions sont inchangées (`persisted()` / `persist()` sous `try/catch`) ;
  - ni stockage local, ni dépendance, ni configuration, ni format persisté touchés ;
  - le démarrage ne passe jamais par `redemander`, donc `refusee` ne s'allume pas au montage.
- **Fausse assurance** : la mitigation tient. Le message de refus ne parle ni de sauvegarde ni
  de désinstallation, et le rappel d'exporter reste dans le même `<output>`, dans les trois
  états. Le message n'apparaît qu'en `not-persisted` et disparaît quand la protection est
  accordée.
- Firefox peut afficher une invite (MDN). Ce fait n'est pas contredit, donc pas de désaccord
  cette fois.
- **Remarque produit, non sécuritaire** : sous Firefox, le refus vient d'un utilisateur qui a
  décliné l'invite, et le conseil « une fois installé » y est peu pertinent. La formule « en
  général » ne trompe pas : ce n'est pas retenu comme constat.
- **Nouveaux constats** : aucun. **Risques acceptés** : aucun. **Questions ouvertes** : aucune.
