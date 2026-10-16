# Lot `statistiques-podium` — revue sécurité

> Agent `sec` (opus, effort du frontmatter : high), 2026-10-15, Révision 1 comprise. Sans outil
> Bash dans cette exécution : lecture des fichiers. Vérifications shell faites ensuite par
> l'Orchestrator (§ Vérifications de l'Orchestrator).

**Verdict : RAS sécu bloquant.** Aucun bug d'implémentation, aucune faille de design. T8 et T17
clos.

## Menaces considérées

Pseudo tapé, rendu dans onglets / barres / modal ; sauvegarde reçue (non touchée, mais pseudos et
couleurs importés rendus par les nouveaux composants) ; valeur relue du stockage local
(`dartpero:statistiques:joueur`) ; valeur relue de l'historique de session
(`location.state.liste`, survit au rechargement) ; dépendance / déploiement ; politique
`/confidentialite` tenue vraie.

## Checklist

| Surface | Touchée ? | Vérifié |
|---|---|---|
| Zéro réseau | Non | Grep `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `firebase`, `innerHTML`, `window.history`, `pushState`, `document.cookie` sur `src/` : une occurrence, en commentaire (`useModaleAuRetour.ts:24`). Nouveaux fichiers : `react`, `react-router`, `lucide-react` (`X`), modules internes. `reseauBoundary.test.ts` (plancher 40 fichiers) non modifié |
| Import JSON / `backupSchema` | Non | `src/core`, `src/infrastructure`, `src/composition` non touchés |
| Rendu d'une saisie | Oui, lecture | Pseudos et titre de `Modale` en texte React (`CartePodium.tsx:141,199`, `StatistiquesEcran.tsx:252,331`, `Modale.tsx:134`) ; aucun `dangerouslySetInnerHTML` ; styles dynamiques numériques seulement (`width`, `gridTemplateColumns`) ; `Avatar` par `couleurJoueur` existant ; pas de synthèse vocale |
| Format persisté | Non | — |
| Stockage local | Oui, une clé | T8 |
| SW / `firebase.json` / `vite.config.ts` | Non | `<dialog>` natif |
| Permissions navigateur | Non | Aucun `wakeLock`, `vibrate`, `speechSynthesis`, `getUserMedia`, `geolocation`, `Notification` dans `src/ui/` |
| Dépendances | Non | `package.json`, lockfile inchangés |
| Secrets | Non | Grep `AIza|apiKey|secret|password|Bearer` : rien ; captures et scripts du Dev hors dépôt |

## Vérifications demandées

- **`statistiques:joueur`** : déclarée une fois avec ⚠️ (`StatistiquesEcran.tsx:88`), lue par un
  seul `usePreference` (`:435`), écrite à l'appui seulement (`:470-473`). Relue par `JSON.parse`
  sans validation (`LocalStoragePreferences.ts:30`), reçue `unknown` (`podium.ts:232`), prise
  seulement si chaîne (`:239`), sert à une égalité (`:240`), jamais affichée ni passée à un
  attribut / URL / style. Corrompue → `joueurs[0]` ; supprimé ou sans fléchette écarté (`:241`).
- **`location.state`** : objet non nul (`useModaleAuRetour.ts:4-5`), chaîne de la liste fermée
  `CARTES_PODIUM` (`:43-44`), choisit une carte, jamais affichée ; écrite par `navigate` dans un
  clic, valeur constante ; spread de l'état (`:57`) sans prototype ; `history.state` même origine.
- **Politique** : date `'Mise à jour le 15 octobre 2026'` (`labels.ts:274`, contre « 12 octobre
  2026 » sur `main` avant ce lot), testée (`confidentialite.test.tsx:81-86`) ; seul ajout de la
  phrase `:297` : « le dernier joueur consulté dans Statistiques (son identifiant interne) »,
  testé (`:88-99`).

## T8 — clos

| Clé (`dartpero:` + …) | Source | Couverte par |
|---|---|---|
| `theme` | `theme.ts:24`, amorçage `index.html:28` | « le thème » |
| `annonce-vocale` | `useAppareil.ts:38` | « l'annonce vocale » |
| `partie:variante-cricket`, `partie:score`, `partie:legs`, `partie:sets`, `partie:double-out`, `partie:double-in`, `partie:ordre-aleatoire` | `useNouvellePartie.ts:33-45` | « les réglages de la dernière partie » |
| `entrainement:sorties` | `useNouvellePartie.ts:48` | idem |
| `partie:joueurs`, `entrainement:joueur` | `useNouvellePartie.ts:44,47` | « les derniers joueurs choisis (leurs identifiants internes) » |
| `statistiques:joueur` | `StatistiquesEcran.tsx:88` | **nouvelle** : « le dernier joueur consulté dans Statistiques (son identifiant interne) » |
| `installation:ecartee` | `useInstallation.ts:11` | « le "Plus tard" de l'invitation à installer » |
| `__test` (sonde) | `LocalStoragePreferences.ts:15-17` | « une valeur de test … effacée aussitôt » |

Aucune autre écriture `localStorage` ; seul `sessionStorage` : `main.tsx:31-32`, déjà décrit
(`labels.ts:298`). Identifiant gardé après suppression d'un profil (pas de `remove` dans le port),
comme `partie:joueurs` : UUID opaque, sans pseudo une fois le profil supprimé, le journal le garde
de toute façon (`labels.ts:308`) ; le texte ne promet pas d'effacement ; « effacez les données de
ce site » couvre le cas. Sans effet à l'écran (`name !== null` exigé).

## T17 — clos, aucune mention nécessaire

État neutre (constante parmi quatre, clé `liste`), sans donnée personnelle ; mécanisme existant
(React Router, `ETAT_PARCOURS`) ; l'historique de session n'est pas un stockage que la politique
énumère ; `sessionStorage`, IndexedDB, cookies non touchés. Texte et date inchangés au titre de la
Révision 1.

## Constats

Aucun constat de sécurité.

**Non bloquant** : N-S1 — `JSON.parse(brut) as T` sans validation (`LocalStoragePreferences.ts:30`),
préexistant ; la nouvelle lecture est protégée par `typeof`.

## Risques acceptés

Aucun au titre de la sécurité. (U4, signé par l'utilisateur, est un risque d'accessibilité, hors
périmètre.)

## Questions ouvertes (de `sec`)

1. Confirmer par `git diff` que `package.json`, lockfile, `vite.config.ts`, `firebase.json`,
   `src/core`, `src/infrastructure`, `src/composition` ne bougent pas, et lancer `npm audit`.
2. T9 au rebase : garder les deux ajouts à `labels.ts:297` et la date la plus récente ; relire la
   phrase fusionnée contre le tableau T8.
3. Hors sécurité (T19) : une PWA relancée qui restaurerait le modal ouvert sans entrée d'historique
   dessous — ✕ ne fermerait plus (`navigate(-1)` sans effet). À vérifier sur téléphone.

## Vérifications de l'Orchestrator (2026-10-15)

- `git diff --stat HEAD -- package.json package-lock.json vite.config.ts firebase.json index.html
  src/core src/infrastructure src/composition` : **vide** (rien de ces surfaces n'a bougé depuis la
  base du lot `6109013`).
- ⚠️ `main` a avancé pendant le lot : `5644892 feat(ui): parcours nouvelle partie en étapes et
  fiche de réglages` (lot parallèle `nouvelle-partie-parcours`, fusionné). Un `git diff main`
  montre donc `ShuffleOrder` et `container.ts` « supprimés » : ce sont les **ajouts de l'autre
  lot**, absents de cette branche, pas des retraits de ce lot. Rebase nécessaire avant fusion
  (§ Lots en parallèle, point 6), avec accord de l'utilisateur.
- `npm audit --omit=dev` : `found 0 vulnerabilities`.
- Q1 close ; Q2 renvoyée au rebase (T9) ; Q3 renvoyée à T19 (relecture sur appareil) et à la Revue.

## Rejeu après la boucle 5, tour 4 (Orchestrator, 2026-10-15)

Delta : calcul pur de défilement et un effet qui écrit `scrollLeft` du ruban. Vérifié : aucune
écriture de stockage, aucun réseau, aucun `scrollIntoView` ni `window.history` (Grep sur
`StatistiquesEcran.tsx` et `podium.ts` : seule occurrence, un commentaire) ; `git diff --stat HEAD`
de `package.json`, lockfile, `src/core`, `src/infrastructure`, `src/composition` : vide. Politique
inchangée. **RAS.**