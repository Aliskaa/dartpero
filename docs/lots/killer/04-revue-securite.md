# Lot `killer` — revue sécurité

> Écrit par l'Orchestrator à partir du rapport du sous-agent `sec` (opus, effort high d'après son frontmatter,
> 1 lancement, rapport rendu dans le plafond). `sec` n'avait pas de shell : l'Orchestrator a relancé
> `git diff --stat` sur les fichiers de déploiement et `npm audit --omit=dev`. **Verdict : GO.**

## Menaces considérées

- Un fichier de sauvegarde reçu d'un pote ou édité à la main : `KillerStarted` hostile, profil avec un genre
  invalide ou piégé (`__proto__`), journal qui ne se rejoue pas ou très long.
- Le joueur qui tape : numéros du Killer, sélection coupée, brouillon de volée rechargé, boîte de sortie rouverte.
- Une donnée personnelle nouvelle (le genre) : stockage, export, sortie par la voix synthétisée en ligne,
  lecture hors des fichiers prévus.
- Format persisté : profil Dexie sans `db.version`, valeurs `MASCULINE` / `FEMININE`, `BACKUP_VERSION` à 1.
- Dépendances et déploiement.

## Surfaces vérifiées sur le diff

| Surface | Touchée par le lot ? | Vérifié |
|---|---|---|
| Zéro réseau (`fetch`, SDK `firebase`) | Non | Aucun `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource`, import `firebase`, `dangerouslySetInnerHTML`, `innerHTML`, URL `http` dans `src` ; `navigator.` seulement dans les quatre adapters existants |
| Import JSON / `backupSchema` | Oui | `KillerStarted` (`backupSchema.ts:196-211`) : `KillerConfig.create` (3 ou 5 vies, booléen typé, `killer/config.ts:52-61`), `versNumeroKiller` (entiers 1-20, bulle et `MISS` refusés, l.87-92), `versOuverture`, `KillerRules.start` (`rules.ts:91-121` : < 2, > 6, doublon, longueurs, config) ; vies ≤ 5 et joueurs ≤ 6 : rendu borné ; état illégal impossible (au moins un joueur vivant, `nextAlive` lève au lieu de boucler, `rules.ts:198-203, 271-277`) ; 12 cas de refus testés (`backup.test.ts:306-325`). `versPlayer` (`:238-251`) : `null`, `42`, `'feminine'`, `'UNSPECIFIED'`, `'__proto__'` refusés, profil ignoré et compté dans `playersSkipped` (`backup.test.ts:394`) ; ancienne sauvegarde en « non précisé » (`:384`) ; un profil remplacé par un fichier sans genre perd son genre (`:412`, règle « l'import remplace », `labels.ts:449`). **Projection du journal à l'import pour tous les modes** (`backupSchema.ts:264`) : avant toute écriture et avant `drafts.delete`, erreur rattrapée et comptée (`ManageBackupUseCase.ts:77-86`), pas de boucle infinie, aucune régression sur un journal produit par l'app actuelle (`backup.test.ts:89`) |
| Rendu d'une saisie (pseudo, fichier, genre) | Oui | Texte React seulement (`NumerosKiller.tsx:160,172`, `ChoixGenre.tsx` à libellés constants) |
| Format persisté (Dexie, `MatchEvent`, profil) | Oui | `Player.create` (`Player.ts:44`), `DexiePlayerRepository` (`:16, :29`) et export (`ManageBackupUseCase.ts:36`) : étalement conditionnel, jamais `gender: undefined` ; retour à « non précisé » retire la clé (`put` complet) ; ligne brute sans `gender` relue sans clé (`dexieRepositories.test.ts:145,165,172`) ; **pas de `db.version`** (champ non indexé, précédent de `color` / `createdAt`) ; `BACKUP_VERSION` 1 ; aucune valeur persistée renommée |
| Service worker / `firebase.json` / manifeste | Non | `git diff --stat -- package.json package-lock.json vite.config.ts firebase.json index.html public` (Orchestrator) : vide |
| Permissions navigateur | Non | Rien de nouveau |
| Dépendances (`npm audit`) | Non | `package.json` et lockfile inchangés ; `npm audit --omit=dev` (Orchestrator) : **0 vulnérabilité** |
| Secrets | Non | Rien vu |
| `localStorage` | Oui (deux préférences) | `partie:killer-vies` et `partie:killer-variante` (`useNouvellePartie.ts:67-68`), relues sous garde (`dansLaListe`, `booleen`, l.147-148) ; couvertes par « les réglages de la dernière partie » (`labels.ts:439`) ; les numéros vivent dans un `useState` (l.178), jamais stockés |

**Donnée personnelle (genre)** : lu seulement par les fichiers de la liste fermée de
`tests/architecture/genreBoundary.test.ts:29-50` (plancher 18) ; toutes les lectures UI servent à accorder
« éliminé / éliminée » (`labels.ts:2568-2654`, `useKiller.ts:45,163`, `KillerEcran.tsx:115,193`,
`ResumeKillerEcran.tsx:89`) ou à le choisir (`useNouvellePartie.ts:272-278`, `JoueursEcran.tsx:70-127`) ;
la phrase « sert seulement à accorder… » (`labels.ts:438`) est vraie ; la ligne 457 (voix en ligne) dit que le
mot accordé part au fournisseur : exact (`annonceKiller`) et validé par l'utilisateur (R1.7), l'option
« Annoncer les volées » coupe la voix ; date « Mise à jour le 21 octobre 2026 » (`labels.ts:416`) juste si la
livraison a lieu le jour même ; la suppression d'un profil efface son genre avec la ligne.

**Intégrité côté UI** : unicité et plage des numéros (`choisirNumero` ignore un numéro pris,
`useNouvellePartie.ts:346-352`, tirage par le port, `KillerRules.start` revalide avant d'écrire,
`PlayKillerUseCase.ts:47`) ; coupe écrite de `partie:joueurs` (`useNouvellePartie.ts:235-238`, appelée à
`EtapeJoueurs.tsx:67-69`) : n'écrit qu'au-delà du maximum du jeu et une fois les profils chargés, ne perd que
les 5e et 6e joueurs comme décidé ; brouillon de volée (`useVoleeEnCours.ts:30-33,105-109`) : un brouillon
dont un préfixe est clos est jeté, sous `try` ; un brouillon gagnant rouvre la boîte, rien n'est écrit avant
*Valider* (`useKiller.ts:146,222-225`).

## Constats

| # | Sévérité | `fichier:ligne` | Scénario | Classement |
|---|---|---|---|---|
| C1 | Faible | `src/ui/labels.ts:448` | La phrase d'export « contient vos profils (pseudos, couleurs et genres choisis) » omet `createdAt`, exporté aussi (`ManageBackupUseCase.ts:34`) alors que la ligne 438 cite la « date de création » : incomplète, pas fausse ; antérieure au lot mais touchée par lui. Correction proposée : « (pseudos, couleurs, dates de création et genres choisis) » + test de `confidentialite.test.tsx` si la phrase y est citée | Bug d'implémentation (texte), non bloquant : à corriger avec les correctifs de Test |

Observation sans risque : un `VisitRecorded` importé contenant des fléchettes après celle qui arrête la volée
est accepté, le rejeu les ignore (`killer/rules.ts:210`), déterministe, aucun état illégal.

## Résiduels (aucun signé par l'utilisateur, aucun accepté par `sec`)

- **R1 — genre corrompu dans IndexedDB.** `DexiePlayerRepository.ts:16` appelle `PlayerGender.of` à la
  lecture : une valeur inconnue fait échouer `listAll` et `findById` en entier (Joueurs, Nouvelle partie, noms
  au Killer). Aucun chemin de l'app ne peut l'écrire (création et modification typées, import validé) ; il faut
  DevTools ou un bug futur ; même précédent que la couleur (`:13`). Mitigation peu coûteuse : une lecture
  tolérante qui ignore un genre inconnu au lieu de lever. Owner : **utilisateur** (signer) ou Dev (une ligne).
- **R2 — import coûteux d'un journal très long (DoS local).** Chaque `applyVisit` recopie l'historique
  (`killer/rules.ts:224-225`, comme `x01/rules.ts:104`, `cricket/rules.ts:210`, `tour-du-monde/rules.ts:150`) :
  coût quadratique ; un fichier forgé d'environ 10⁵ volées `MISS` figerait l'onglet à l'import, qui projette
  désormais. Auto-infligé et local ; le même coût était déjà payé à l'affichage ; n'aggrave pas l'atomicité du
  constat #11. Owner : Revue ou utilisateur.
- **R3 — journaux écrits sous des règles plus anciennes.** L'import refuse maintenant un journal qui ne se
  rejoue pas, là où il l'importait avant puis l'affichait cassé ; aucune régression sur un journal de l'app
  actuelle ; pour un journal écrit avant une correction de règle, non vérifié. Owner : Revue.
- **R4 — version antérieure de l'app.** Elle perd le genre en silence et écarte les parties Killer (comptées) ;
  une ancienne version qui renomme un profil efface le genre ; peu probable avec `autoUpdate`. Owner : Revue.
- **Hérités, inchangés** : ABA de `visitCount` (Killer : `visitCount` = `history.length`, brouillon vidé à chaque
  enregistrement), deux onglets, contraste `rouge-touche` (5,81 / 5,63:1 mesurés, pas sur écran réel).

## Mitigations

Validation fermée à l'import (vies, joueurs, numéros, genre), projection du journal avant écriture, genre en
liste fermée à clé absente, garde `genreBoundary`, politique mise à jour. Aucune mitigation supplémentaire
requise ; C1 (texte) et R1 (lecture tolérante) sont des corrections peu coûteuses.

## Risques acceptés

Aucun, signé par l'utilisateur ou non : `sec` n'en accepte aucun lui-même. **R1 à R4 et le constat #11 inchangé
attendent la signature de l'utilisateur** à l'arrêt de fin de lot.

## Non vérifié

`git diff --stat` et `npm audit` (faits ensuite par l'Orchestrator) ; `vite.config.ts` et le manifeste au-delà de
l'instantané (couverts par le `git diff --stat` de l'Orchestrator : vide) ; le contenu de
`DialogueNouveauJoueur.tsx`, `PreviewKillerVisitUseCase.ts` et `drawKillerNumbers.ts` ; la lecture complète de
`useVoleeEnCours.ts`.
