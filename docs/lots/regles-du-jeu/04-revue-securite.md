# Lot `regles-du-jeu` — revue sécurité

## Passe 1 (2026-10-16)

Sous-agent `sec` lancé en **opus** (effort `high` du frontmatter), après la boucle 1 (C1 corrigé).
Sans shell dans sa session : `git diff`, `npm audit` et le build ont été lancés ensuite par
l'Orchestrator (résultats plus bas).

**Verdict : PASS, RAS sécu.** Aucun constat renvoyé au Dev ni à l'Archi. Aucun risque accepté
signé par la phase.

### Menaces considérées

Le joueur qui tape (ouvre, ferme, retour du téléphone, volée en cours) ; un fichier de sauvegarde
reçu d'un pote (la feuille lit `state.config` après import) ; une dépendance ; un déploiement
(précache, chunks, en-têtes).

### Surfaces

| Surface | Touchée | Vérification |
|---|---|---|
| Zéro réseau | Non | Aucun `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `from 'firebase`, `pushState`, `replaceState` dans `src/` ; aucun `http(s)://` ni `@import` distant (seul `@import "tailwindcss"`) ; garde `reseauBoundary` intacte |
| Import JSON / `backupSchema` | Non | `backupSchema.ts` inchangé ; la feuille lit la config déjà projetée (`reglesDuJeu.ts:122-147`) ; pas de nouvelle entrée non fiable |
| Rendu de texte | Oui (statique) | Aucun `dangerouslySetInnerHTML` / `innerHTML` / `outerHTML` / `insertAdjacentHTML` ; segments typés rendus en enfants React (`FeuilleRegles.tsx:23-45`, `Bloc` `:65-208`, `switch` exhaustif) ; aucun pseudo ni saisie dans la feuille (`LivreRegles.tsx:9-14`, `reglesDuJeu.ts:32-52`) ; prénoms d'exemple constants ; seule valeur injectée en style `--haut-feuille`, nombre arrondi (`LivreRegles.tsx:45`, `FeuilleRegles.tsx:319-323`) |
| Format persisté | Non | Ni `dexie/` ni `events/` touchés ; clés `localStorage` inchangées ; `SCORES`, `LEGS`, `SETS`, `SORTIES` déplacés dans `reglagesPossibles.ts:9-13`, mêmes valeurs, toujours filtrées (`dansLaListe`) ; aucune écriture `sessionStorage` nouvelle |
| `history.state` | Oui | Seul `regles: true` s'ajoute à l'état existant (`useFeuilleRegles.ts:54-55`), lu en `=== true` (`:5-8`) ; `ETAT_PARCOURS` conservé ; push au clic seulement (`LivreRegles.tsx:63`), `ouvrir` idempotent (`:52`), `fermer` = `navigate(-1)` unique, verrou remis à zéro à chaque entrée (`:46-48`, C1) |
| Service worker / `firebase.json` / manifeste | Non | `vite.config.ts:114` précache les nouveaux chunks d'office ; `navigateFallbackDenylist` (`:125`) et `globIgnores` (`:119`) intacts ; `vite:preloadError` de `main.tsx` inchangé |
| Permissions | Non | `<dialog>` / `showModal()` ne sont pas des permissions |
| Dépendances | Non | `package.json`, `package-lock.json` inchangés ; icônes de `lucide-react` déjà installé |
| Secrets | Non | Rien de nouveau |
| `/confidentialite` | Non | `SECTIONS_CONFIDENTIALITE` et la date inchangées dans ce lot ; aucune capacité, permission, cookie ni donnée stockée nouvelle : pas de mise à jour obligatoire |
| Domaine `checkout.ts` | Oui | Boucles sur listes constantes ; aucune exception nouvelle (seule `DomainError` sur `dartsLeft`, préexistante) ; `remaining` hors bornes ou `NaN` → `null` ; constantes jamais modifiées en place |

Remarque (pas un constat) : `history.state` n'est pas cité par la politique, pas plus que le
précédent `ETAT_PARCOURS` ; deux booléens techniques, aucune donnée personnelle.

### Vérifications lancées par l'Orchestrator

| Commande | Résultat |
|---|---|
| `git diff --stat -- package.json package-lock.json vite.config.ts firebase.json public src/main.tsx` | **Vide** : rien de sensible ne bouge |
| `git diff -U0 -- src/ui/labels.ts` (bornes des blocs) | Premiers changements à `:7`, puis `:874` et au-delà ; **aucun** dans `:252-326` (`SECTIONS_CONFIDENTIALITE`) |
| `npm audit` | 8 vulnérabilités (2 modérées, 6 hautes) : `@vitest/mocker`, `brace-expansion`, `sharp` (libheif)… — **préexistantes** (lockfile inchangé par le lot), outillage de dev et de captures |
| `npm run build` | OK (passe 2 du Test : précache 49 entrées, 855,87 KiB) |

### Résiduels et owners

- **R1** — retour Android par CloseWatcher. Les deux chemins de fermeture sont dans le code
  (`FeuilleRegles.tsx:318`, `useFeuilleRegles.ts:58-62`), mais les tests tournent sur
  `MemoryRouter` avec un `<dialog>` simulé. **Owner : utilisateur, sur l'appareil Android** —
  retour feuille ouverte puis second retour ; croix puis retour ; Échap.
- **R2** — entrée sautée par Chrome sans geste : push au clic seulement, vérifié dans le code ;
  comportement réel sur appareil. **Owner : utilisateur**, même session que R1.
- **Audit npm** — 8 vulnérabilités préexistantes, hors périmètre du lot. **Owner : utilisateur**
  (un lot d'outillage à part, ou `npm audit fix` après relecture).

### Questions ouvertes

1. Utilisateur, facultatif : mentionner l'état de session (`history.state` : `parcours`,
   `regles`) dans `/confidentialite` ?
2. Revue : iPhone sans CloseWatcher, glissé retour = retour d'historique ; à inclure dans la
   relecture à l'écran avec une volée en cours.

### Gate

- Question 1 : **tranchée par l'utilisateur** — rien à ajouter à `/confidentialite`.
- Question 2 : transmise à la Revue et à la relecture à l'écran (R1, R2 y sont aussi).

Sécurité **Faite**.

## Passe 2 — après la Révision 1, boucle 7 (2026-10-16)

Sous-agent `sec` (opus, effort `high`), sans shell ; comparaison avec le checkout `main`.

**Verdict : PASS, RAS sécu.** Aucun constat renvoyé ; aucun risque accepté signé.

| Surface | Vérification |
|---|---|
| `history.state` | `regles: 'ouverte'` (`LivreRegles.tsx:10-11`, `:35`, `:66`), validée contre une liste fermée (`useModaleAuRetour.ts:42-44`) ; ancien `regles: true` ignoré ; jamais affichée ; état existant conservé (`:57`) ; push au clic ; `enVol` remis à zéro par `location.key` ; fermeture par `navigate(-1)` ; aucun `window.history` / `pushState` / `replaceState` dans `src/` |
| Rendu | Aucun `dangerouslySetInnerHTML` / `innerHTML` / `outerHTML` / `insertAdjacentHTML` / `document.write` / `eval(` / `new Function` ; `Phrase.tsx:14-27` rend chaînes et `<strong>{fort}</strong>` en enfants React ; `switch` exhaustif dans `FeuilleRegles` ; `--haut-feuille` nombre arrondi |
| Parcours importé (C9 / P3-7) | Borné à l'import (`backupSchema.ts:64-70`, `:143` : `BULL`, `MISS`, 1-20 ; non vide `tour-du-monde/config.ts:29`) ; constructeurs de texte n'en tirent que des chaînes (`labels.ts:1763-1830`) ; `['MISS']` → grille vide sans crash. Aucun chemin d'affichage hors texte React, aucun plantage |
| `useDialogueNatif` / `Modale` | N'importe que React ; logique identique à `Modale` de `main` (`:62-110`), seul ajout `ouvertParNous`, sans effet pour `Modale` ; Statistiques inchangées côté sécurité ; appui à côté : fond inerte sous `showModal()`, aucune saisie parasite |
| Réseau, dépendances, SW, persistance, permissions, secrets | Intouchés (`package.json` identique à `main`) |
| `/confidentialite` | `SECTIONS_CONFIDENTIALITE` et date identiques à `main` ; chaque phrase reste juste |

Remarque hors sécurité (pour la Revue) : un parcours importé avec doublons (`[5, 5]`) produit deux
`<li key="5">` dans la grille (`FeuilleRegles.tsx:174`) — avertissement React, ni crash ni rendu
brut ; même chantier que l'audit #11.

### Vérifications lancées par l'Orchestrator

| Commande | Résultat |
|---|---|
| `git diff --stat main -- package.json package-lock.json vite.config.ts firebase.json public src/main.tsx src/infrastructure` | **Vide** |
| `git diff --stat main -- src/core` | `checkout.ts`, `GetCheckoutRange.ts`, `GetCheckoutRangeUseCase.ts` seulement (domaine du lot, passe 1) ; aucun événement ni format persisté |
| `git diff main -U0 -- src/ui/labels.ts` | Premier bloc à `:7`, puis `:918` et au-delà ; **aucun** dans `:275-326` |
| `npm audit` | 8 vulnérabilités (2 modérées, 6 hautes), **identiques** à la passe 1, préexistantes |

### Résiduels

R1, R2 (+ appui à côté en paysage sur le match, P3-9) : utilisateur, à la relecture. Entrée
`regles` sans entrée dessous : dette partagée avec `Modale`. Import qui accepte tout parcours non
vide (`MISS`, doublons) : prochain audit (#11). Audit npm : utilisateur.

### Gate

Aucune question nouvelle. Sécurité **Faite** (passe 2).
