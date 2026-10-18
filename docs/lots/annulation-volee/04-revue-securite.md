# Lot `annulation-volee` — revue sécurité

> Rapport de `sec` (opus, 1 lancement, **sans shell** ; premier passage arrêté à `maxTurns` sans rapport,
> relancé par message). Les commandes qu'il n'a pas pu lancer l'ont été par l'Orchestrator.

**Verdict : RAS sécu.** Aucun constat bloquant (ni bug d'implémentation ni faille de design).

## Menaces considérées

- Le joueur qui tape les scores : double appui sur *Valider*, appui fantôme, retour du téléphone, Échap,
  rechargement avec la boîte ouverte, perte d'historique en annulant.
- Un pseudo saisi (profil ou sauvegarde importée) rendu dans la boîte, le nom accessible de la touche et
  la voix.
- Un fichier de sauvegarde reçu d'un pote : l'import n'est pas touché par le lot.
- Une dépendance, un déploiement : service worker, `firebase.json`, en-têtes.

## Surfaces vérifiées

| Surface | Touchée ? | Vérifié |
|---|---|---|
| Zéro réseau | Non | Aucun `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, import `firebase` dans `src/` ; les nouveaux fichiers n'importent que React, hooks maison et libellés. RAS sécu |
| `/confidentialite` | Non | `DATE_MISE_A_JOUR_CONFIDENTIALITE` identique à `main` ; aucune clé `localStorage` / `sessionStorage` nouvelle ; une volée en cours n'a jamais été persistée. RAS sécu |
| Import JSON / `backupSchema` | Non | Absents du diff. RAS sécu |
| Format persisté | Commentaire seulement | `MatchEvent.ts` : seul le commentaire change (confirmé par `git diff`, 6 ajouts / 3 retraits, tous des lignes de commentaire) ; union, types, `'MatchStarted'`, schéma Dexie, migrations inchangés. RAS sécu |
| Rendu d'une saisie | Oui | Titre et texte en JSX (`BoiteConfirmation.tsx:70,73`), aucun `dangerouslySetInnerHTML` / `innerHTML` ; voix : texte simple, sans SSML, seulement dans `enregistrer`, donc après *Valider*. RAS sécu |
| Clé d'historique `confirmation` | Oui | Liste fermée `['sortie']` (`useConfirmationSortie.ts:5-6`), validée par `useModaleAuRetour.ts:42-44`, jamais affichée. RAS sécu |
| Service worker, `firebase.json`, `vite.config.ts` | Non | Absents du diff (confirmé par `git diff --stat`). RAS sécu |
| Permissions | Non | Haptique et Wake Lock existants seulement |
| Dépendances | Non | `package.json` / `package-lock.json` sans diff ; `npm audit --omit=dev` : **0 vulnérabilité** (Orchestrator) |
| Secrets | Non | Rien dans les fichiers lus. Dans `dist/` : aucun `REMPLIR` ; le seul `fetch(` est la bibliothèque générée `workbox-*.js` du service worker, pas du code de l'app |

## Scénarios d'intégrité (vérifiés à la lecture)

- **Annulation = une seule écriture atomique sur un préfixe valide du journal** :
  `UndoLastVisitUseCase.ts:25-28`, `PlayCricketUseCase.ts:89-92`, `PlayTourDuMondeUseCase.ts:89-92`,
  `PlayCheckoutPracticeUseCase.ts:120-129` ; projection **avant** `save` ; `DexieMatchRepository.save` =
  un seul `put` (`:16`) ; l'événement d'ouverture est protégé (`events.length <= 1` → `DomainError`).
- **La fléchette de sortie n'est jamais écrite avant *Valider*** : `ajouterFlechette` rend `true` avant
  tout `enregistrer` (`useX01.ts:190`, `useCricket.ts:158`, `useTourDuMonde.ts:151`) ; test du journal en
  profondeur `annulationVolee.test.tsx:522-533`.
- **Pas de double écriture sur double appui** : `validerSortie` exige `sortieEnAttente && !occupe`
  (`useX01.ts:205-208`) ; boutons `disabled={occupe}` (`BoiteConfirmation.tsx:80,88`) ; test `:535-541`.
- **Fermeture parasite pendant l'écriture** : `corrigerSortie` refuse si `occupe` (`useX01.ts:200`) ;
  ref `validee` (`useConfirmationSortie.ts:62-65`).
- **R4** (navigate(-1) vs replace vers le résumé) : le résumé n'est remplacé que sur
  `termine && auRepos` (`X01Ecran.tsx:102-104`, idem Cricket / Tour du monde) ; test `:283`.
- **`StrictMode`** : ref `depilee` (`useConfirmationSortie.ts:44-56`) ; test `:450` avec contre-épreuve.
- **Une volée rouverte ne peut pas s'auto-enregistrer** : préfixe d'une volée conclusive jamais conclusif
  (invariant `describe.each(GAME_MODE_IDS)`).

## Constats

Aucun constat de sécurité.

**Information N-1 (pas un constat).** Si l'écriture échoue après *Valider* (quota plein, transaction
annulée) : le journal reste intact (`put` atomique), la fléchette de sortie reste en attente en mémoire,
la boîte ne se rouvre pas (entrée d'historique dépilée), les nouvelles fléchettes sont refusées ;
« Annuler » la retire et la retaper rouvre la boîte. Aucune perte, corruption ni double écriture.
Sévérité faible (gêne d'interface). Cas non spécifié, **à trancher par l'utilisateur** ; pas un risque
accepté.

Remarque hors sécurité (R3) : un appui fantôme juste après la fermeture peut tomber sur le pavé ; il ne
peut écrire qu'une volée complète sans sortie ou rouvrir la boîte, et se défait fléchette par fléchette.

## Mitigations

En place et suffisantes : projection avant écriture, `put` unique, gardes `occupe` / `sortieEnAttente`,
refs `validee` et `depilee`, garde `auRepos`, liste fermée pour l'historique.

## Risques acceptés (signés par l'utilisateur)

- **R1** : fléchette de sortie en attente perdue si l'app se ferme (`request.md` § Risques).
- **U9** : volée rouverte perdue si l'app se ferme (2026-10-17) ; le journal reste cohérent.
- U8 / R2 (reste de l'entraînement re-tiré) : comportement inchangé confirmé, pas une surface sécu.

## Addendum (2026-10-18) — après les boucles 5 et 3

- **N-1 tranché par l'utilisateur : accepté tel quel** (« risque accepté » signé). Aucune perte ni
  corruption de données ; état d'attente seulement.
- **Delta des boucles 5 et 3** relu par la Revue (pas par `sec`) : documentation et commentaires ; une
  garde de 500 ms lue sur `services.clock` (aucune donnée persistée, aucune API navigateur nouvelle) ; le
  jeton CSS existant `voile` pour le `::backdrop`. Aucune surface de la checklist n'est ouverte :
  réseau, import JSON, format persisté, rendu d'une saisie, dépendances, service worker inchangés.
- **Boucle 4 (garde étendue à *Valider*)** : même nature (état local, horloge des services) ; aucune
  surface nouvelle.
