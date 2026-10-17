# Lot `reglages-par-usage` — revue sécurité

> Agent `sec` (opus, effort high du frontmatter), 2026-10-17. Sans shell : lecture sur disque et
> comparaison avec `main` (`C:\Users\kevin\Documents\Flechettes`, `2fa21d5`). Les six commandes
> demandées ont été exécutées ensuite par l'Orchestrator (§ Commandes).

**Verdict : PASS — aucun bug d'implémentation, aucune faille de design.**

## Menaces considérées

- Joueur ou tiers qui a le téléphone en main : édition de `localStorage` (nouvelle clé
  `dartpero:sauvegarde:dernier-export`) ; voyant qui rassure à tort et perte de données faute
  d'export.
- Fichier de sauvegarde reçu d'un pote : ne doit écrire ni la date ni rien hors de la base.
- Dépendance ou déploiement : réseau nouveau, service worker, en-têtes.
- Politique publique `/confidentialite` : ne doit pas devenir fausse.

## Checklist

| Surface | Touchée | Vérifié |
|---|---|---|
| Zéro réseau | Non | Aucun `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, `firebase`, `https?://` dans `src/` ; `index.css` sans `url(` ; `reseauBoundary` et `installationBoundary` inchangées (seul `themeBoundary.test.ts` modifié sous `tests/architecture`) |
| Import JSON / `backupSchema` | Non | `ManageBackupUseCase.ts`, `backupSchema.ts`, `ManageBackup.ts` inchangés ; `importer()` (`ReglagesEcran.tsx:277-299`) identique à `main`, même `invalidateQueries()` (l. 285, couvre `CLE_CONTENU_APPAREIL`) ; aucune écriture de préférence |
| Rendu d'une saisie | Non | Aucun `dangerouslySetInnerHTML` / `innerHTML` ; `Voyant`, `LigneReglage`, `VignetteTheme` : texte React de `labels.ts` ou nombres ; aucun pseudo affiché |
| Format persisté (Dexie, `MatchEvent`) | Non | `src/infrastructure`, `src/core/domain` inchangés |
| SW / `firebase.json` / `vite.config.ts` / `index.html` | Non | Inchangés |
| Permissions navigateur | Non | « Demander la protection » rappelle `redemander()` existant, au clic seulement (`ReglagesEcran.tsx:165-176`) |
| Stockage local | **Oui** | TS1 ci-dessous |
| Dépendances | Non | `package.json` / lockfile inchangés (commande 1) ; `npm audit` identique à `main` (commande 5) |
| Secrets | Non | Rien de nouveau |

## TS1 — clé `sauvegarde:dernier-export` : conforme

- Définie `useAppareil.ts:46`, préfixée `dartpero:` par `LocalStoragePreferences.ts:6,29,37` ;
  référencée nulle part ailleurs.
- Validée à la lecture (`useAppareil.ts:52-53`) : nombre et date valide, sinon `null` →
  « Jamais » ; seconde défense `voyants.ts:48-51` (`NaN` → « Jamais »).
- Jamais affichée brute : `libelleDureeSauvegarde(duree)` seul (`ReglagesEcran.tsx:331`).
- Écrite au seul export réussi : `noterExport` l. 269, après `telecharger()`, dans le `try` ;
  `catch` sans écriture ; seul appel.
- Jamais écrite par l'import ; `ManageBackupUseCase.importFrom` n'a pas accès aux `Preferences`.
- Absente du fichier exporté : `exportAll()` (`ManageBackupUseCase.ts:20-40`) ne lit que les
  dépôts et l'horloge.
- Tests : `reglagesParUsage.test.tsx:203-233`, `:235-257`, `:277-290` ; contre-épreuves de
  l'Orchestrator rouges (`03-plan-de-test.md`, passe 2).

## Politique publique : conforme

- Toutes les clés réellement écrites sont citées (`labels.ts:385`) : thème, annonce vocale,
  réglages de la dernière partie (`partie:*`, `entrainement:sorties`), derniers joueurs
  (`partie:joueurs`, `entrainement:joueur`), dernier joueur consulté (`statistiques:joueur`),
  « Plus tard » (`installation:ecartee`), **date du dernier export** (nouveau), sonde `__test`.
  `regles` / `liste` vivent dans `location.state`, pas dans `localStorage`.
- « Réglages → Affichage » (`labels.ts:403`) : vrai (« Annoncer les volées » dans la section
  Affichage, `ReglagesEcran.tsx:361-385`). L'ancienne phrase « Réglages → Annonce vocale » serait
  devenue fausse.
- « Exporter : Réglages → Sauvegarde » (`labels.ts:394`) : vrai (`ReglagesEcran.tsx:399-405`).
- Date « Mise à jour le 17 octobre 2026 » (`labels.ts:362`, 16 sur `main`) : U6c ; testée
  (`confidentialite.test.tsx:80-107`). Au rebase avec `rejouer` : garder la plus récente (TO1).
- `docs/DEPLOIEMENT.md` suivi (l. 95-111, 125-129, 213-216).

## Port `GetDeviceContents` : conforme

Ne renvoie que deux longueurs (`GetDeviceContentsUseCase.ts:16-19`) ; câblé seulement dans
`container.ts:132,197` ; rien d'affiché en chargement / échec (`ReglagesEcran.tsx:351-357,447`,
U8b), testé `reglagesParUsage.test.tsx:366-404`. Lecture complète de la base à l'ouverture, comme
`exportAll` et Statistiques : risque faible, repli `count()` documenté. Pas un constat.

## Q1 (localStorage plein) : d'accord avec la clôture

Défaut dans le sens sûr : l'export a eu lieu, seule sa trace se perd ; au lancement suivant, le
voyant montre l'ancienne date ou « Jamais » (une alerte de plus, jamais une fausse assurance).
Idem en navigation privée (repli mémoire, `LocalStoragePreferences.ts:24`). **Conforme**, rien à
signer.

## Constats classés

- Bug d'implémentation : **aucun**.
- Faille de design : **aucune**.
- Risques **déjà signés** par l'utilisateur (`01-architecture.md` § Réponses, 2026-10-17) :
  U9 (sur iPhone, « Aujourd'hui » possible sans fichier enregistré) ; U3 (date future →
  « Aujourd'hui » sans alerte jusqu'au prochain export).
- Remarque cosmétique (pas un constat) : un horodatage négatif valide tapé à la main (`-8e15`)
  afficherait « Il y a ≈ 3 000 000 mois » en laiton — calculé, jamais brut, provoqué par
  l'utilisateur lui-même.

## Commandes (exécutées par l'Orchestrator, 2026-10-17)

| # | Commande | Attendu | Obtenu |
|---|---|---|---|
| 1 | `git status --porcelain -- package.json package-lock.json vite.config.ts firebase.json index.html public scripts src/main.tsx src/infrastructure src/core/domain …backupSchema.ts …ManageBackupUseCase.ts …ManageBackup.ts tests/architecture` | Seulement ` M tests/architecture/themeBoundary.test.ts` | Conforme |
| 2 | Recherche réseau / `innerHTML` / `localStorage.` / `sessionStorage.` dans `src` | Seulement `main.tsx` et `LocalStoragePreferences.ts` | Conforme (`main.tsx:31,32` ; `LocalStoragePreferences.ts:16,17,29,37`) |
| 3 | Recherche `CLE_DERNIER_EXPORT|noterExport|dernier-export` dans `src` | `useAppareil.ts:46,60`, `ReglagesEcran.tsx:15,247,269` | `useAppareil.ts:46,60`, `ReglagesEcran.tsx:247,269` — l'import l. 15 ne porte pas ces noms : moins d'occurrences, aucune en plus. Conforme |
| 4 | `npx vitest run tests/architecture tests/ui/confidentialite.test.tsx tests/ui/reglagesParUsage.test.tsx tests/ui/lot4.test.tsx tests/use-cases/contenuAppareil.test.ts` | Vert | 15 fichiers, 163 tests verts |
| 5 | `npm audit --omit=dev` | Identique à `main` | 0 vulnérabilité (lot et `main`) |
| 6 | `npm run build` puis `npm run smoke` | Vert, aucune requête externe, aucun `REMPLIR` | Build OK ; smoke OK (contrôles statiques, `/` et `/confidentialite` sans requête externe, aucun `REMPLIR` dans 40 fichiers) |

## Questions ouvertes

Aucune.

## Passe 2 (2026-10-17, delta de la boucle 5)

> Agent `sec` (opus, effort high), lecture seule ; commandes de l'Orchestrator (lint, typecheck,
> 1429 verts, build, smoke OK).

**Verdict : PASS** — rien de la passe 1 remis en cause.

- TS1 conforme : clé aux mêmes endroits (`useAppareil.ts:46,59-60`, `ReglagesEcran.tsx:15,247,269`),
  lecture validée, écrite après `telecharger()` seulement, `importer()` inchangé ; renommage
  `vueSauvegarde` local ; nouveau test de l'action désactivée pendant l'export (`:203`).
- Politique : `labels.ts` inchangé dans ce delta ; date, stockage, export, « Réglages → Affichage »
  toujours vrais.
- `DEPLOIEMENT.md:136-138` (installée en onglet) conforme au code (`voyants.ts:84-85,98-99`,
  `ReglagesEcran.tsx:208-210`) ; reste du document inchangé et exact.
- Aucun réseau, dépendance, SW ni `firebase.json` touché ; `Voyant.tsx:69`, `Button.tsx:27-28`
  (`min-h-14`, plancher tenu), commentaires : aucune surface.

Constats : aucun bug, aucune faille ; U9, U3 déjà signés ; Q1 à annoncer à l'utilisateur (fait au
bilan). Rappel : redater la politique si la livraison glisse ; date la plus récente au rebase (TO1).