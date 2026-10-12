# Lot `nouvelle-partie-en-etapes` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport de `sec` (opus, effort high). Le sous-agent
> n'avait pas de shell : il a lu chaque fichier nouveau ou modifié pertinent. Les deux
> contrôles qu'il demandait ont été lancés par l'Orchestrator (fin de document).

**Verdict : RAS sécu.** Aucun constat.

## Menaces considérées

- Le joueur qui tape un pseudo (rangée d'avatars, sélection, liste ordonnable, `aria-label`,
  annonce `<output>`, voix).
- Le stockage local abîmé ou ancien (valeurs relues par `useNouvellePartie`, clé `partie:mode`
  abandonnée).
- L'URL tapée ou reçue en lien profond (slug `:jeu`, redirection `/entrainement`,
  `location.state`).
- Un fichier de sauvegarde reçu d'un pote : surface non touchée.
- Une dépendance, un déploiement : service worker, `firebase.json`, manifeste, bundle.

## Surfaces vérifiées

| Surface | Touchée ? | Vérifié |
|---|---|---|
| Zéro réseau | Non | Aucun `fetch(`, XHR, WebSocket, `sendBeacon`, EventSource, `firebase`, URL `https?://` introduit dans `src/` (seuls : `xmlns` SVG de `index.css`, non modifié ; `historique.refetch()`). `reseauBoundary` parcourt tout `src/` (plancher 40 fichiers) |
| Rendu d'un pseudo | Oui | Texte React ou attributs uniquement : `RangeeJoueurs.tsx:59,69`, `ListeOrdonnable.tsx:179,188`, `ChoixJoueursExistants.tsx:119`, `EtapeOrdre.tsx:70`, gabarits `labels.ts:487, 617-621`. Aucun `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function`, `javascript:` |
| Boîte « Nouveau joueur » | Oui | Champ contrôlé ; message d'erreur = deux phrases fixes (`erreurPseudo`, `labels.ts:497-500`), jamais `cause.message` ; validation dans le domaine (`managePlayers.create`) |
| Voix | Non | `annonceTour` inchangée ; l'annonce d'ordre va dans un `<output sr-only>`, pas à la synthèse |
| Politique `/confidentialite` | Relue | Toujours vraie : `labels.ts:296` couvre `partie:sets`, `entrainement:sorties` (réglages de la dernière partie) et `entrainement:joueur` (identifiant interne) ; `partie:mode` reste un réglage de la dernière partie ; « Réglages → Sauvegarde » et « Annonce vocale » existent toujours. **Ni texte ni date à changer** |
| Stockage local | Oui (3 clés) | Préférences seulement (nombres, booléens, variante fermée, `PlayerId`) via `usePreference` → `LocalStoragePreferences` ; `JSON.parse` sous `try` ; valeurs ramenées à leur liste fermée ; sélection filtrée par égalité stricte sur les profils existants |
| Routage | Oui | `/entrainement` → constante interne (pas de redirection ouverte, `App.tsx:74-77`) ; `modeDuSlug` compare aux quatre slugs (`chemins.ts:33-38`), inconnu → étape 1 ; `vientDuParcours` = test booléen strict, choisit seulement entre `navigate(-1)` et `replace` ; toutes les cibles construites dans `chemins.ts` |
| Import JSON / `backupSchema` | Non | Aucun fichier d'`application/`, `infrastructure/`, `backupSchema.ts` modifié |
| Format persisté | Non | `x01/config.ts` : commentaires seulement ; `doubleOut ?? true`, `setsToWin ?? 1`, `legsForBestOf(3)` inchangés — l'interprétation d'une vieille sauvegarde ne bouge pas |
| SW, `firebase.json`, manifeste, `vite.config.ts` | Non | Non modifiés ; `navigateFallbackDenylist` ne vise que `/.well-known/` → les URL imbriquées reçoivent le repli ; `firebase.json` réécrit `**` ; raccourci `/nouvelle-partie` et son contrôle smoke inchangés |
| Permissions navigateur | Non | `<dialog>`, `showModal()`, Pointer Events, `setPointerCapture` n'en demandent aucune |
| Dépendances | Non | `package.json` / lockfile inchangés |
| Faux de test | Non | `tests/setup.ts` jamais importé depuis `src/` ; `SondeHistorique` / `retourTelephone` absents de `src/` |
| Secrets | Non | Aucun |

## Constats

Aucun.

## Mitigations

Aucune à apporter : `reseauBoundary`, préférences contre listes fermées, sélection filtrée,
pseudo validé par le domaine, slug contre liste fermée.

## Risques acceptés

Aucun. R1, R2, R3 (`01-architecture.md` § Baseline) sont des vérifications fonctionnelles sur
appareil, pas des risques de sécurité.

## Contrôles complémentaires (lancés par l'Orchestrator)

```
git diff --stat -- package.json package-lock.json   → (vide)
npm audit --omit=dev                                → found 0 vulnerabilities
```

## Questions ouvertes

Aucune.

## Rejeu après les tours de correction n° 1 et n° 2 — RAS sécu

> Rapport de `sec` (opus), relecture des cinq fichiers de `src/` modifiés depuis :
> `ListeOrdonnable.tsx`, `ordre.ts`, `useNouvellePartie.ts`, `labels.ts`, `ApercuPartie.tsx`.

- **Réseau** : aucun `fetch(`, XHR, WebSocket, `sendBeacon`, EventSource, `firebase`, `eval(`,
  `new Function` dans `src/ui` ; aucune URL ni ressource externe ajoutée.
- **Rendu** : pseudo en texte React (`ListeOrdonnable.tsx:181`) et en `aria-label` échappé
  (l. 190) ; annonce en texte dans `<output>` (l. 212) ; seul style inline : `transform`,
  construit de nombres (`dy` borné l. 112, `decalage`). Aucun `dangerouslySetInnerHTML` /
  `innerHTML`.
- **`rangVise`** (`ordre.ts:33-46`) : arithmétique pure ; résultat revalidé par `deplacerVers`
  (`ListeOrdonnable.tsx:67`) et `deplacer` (`ordre.ts:13`).
- **Routage** : l'effet sur `pathname` (`useNouvellePartie.ts:117-121`) ne navigue pas, ne
  recopie rien, ne boucle pas ; seule navigation : `/partie/${matchId}` (l. 236), inchangée.
- **Stockage local** : aucune clé nouvelle ; politique toujours vraie.
- **Format persisté, dépendances, permissions** : non touchés.

Constats : aucun. Risques acceptés : aucun. Questions ouvertes : aucune.
