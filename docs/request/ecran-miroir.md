# Demande — ecran-miroir

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-22
- **Niveau** : high
- **Commande manuelle** : `/orchestrate ecran-miroir high`

> `high` forcé : le lot rouvre la décision gravée « PAS de réseau » de `CLAUDE.md`, ajoute un format de
> protocole entre appareils, une capacité caméra, touche la politique publique `/confidentialite` et
> probablement le service worker. Départ `archi-authority`.

> **Décisions prises en connaissance de cause** (intake du 2026-10-22) : l'utilisateur rouvre « pas de réseau »
> pour **un seul usage** : un lien WebRTC direct entre deux téléphones du même réseau local, jumelé par QR. Il
> a refusé toute dépendance à Internet (« il faut tenir sans Internet »). Il a scindé le chantier : **ce lot
> (1) = QR seul** ; Firebase est un **lot suivant**, esquissé plus bas et **non écrit**. La décision gravée
> « aucun import de `firebase` dans `src/`, jamais » **reste en vigueur**.

## Objectif

Permettre qu'**un second téléphone affiche la partie en grand, en lecture seule**, pendant que le premier sert
à saisir. Le téléphone de saisie fonctionne comme aujourd'hui ; le second (« miroir ») est posé loin, lu à
2-3 mètres, dans une mise en page pensée pour lui. Le journal d'événements et la volée en cours passent **en
direct d'un téléphone à l'autre** (WebRTC, `RTCDataChannel`), jamais par un serveur.

Le **jumelage** (échange d'offre et de réponse WebRTC) se fait **par QR et scan** : hors ligne, sans serveur,
sans compte. Le jeu hors ligne doit pouvoir être jumelé **sans Internet**.

## Périmètre

**Jumelage par QR**
- Le téléphone de saisie affiche l'offre en QR ; le miroir la scanne, puis affiche la réponse en QR ; le
  téléphone de saisie la scanne. **Les deux téléphones ont une caméra**, utilisée **uniquement au scan**
  (parcours à deux scans conservé, confirmé par l'utilisateur).
- Génération et lecture de QR par une bibliothèque embarquée (pas de CDN), qui ne s'appuie pas sur
  `BarcodeDetector` (absent d'iOS Safari). Le SDP est réduit à l'essentiel pour tenir dans un QR.
- Aucune requête réseau vers l'extérieur sur ce chemin.

**Ports**
- Un port driven étroit de **signalisation**, avec **un seul adapter (QR)** dans ce lot. Sa forme doit pouvoir
  accueillir un second adapter sans refonte (le chemin QR est un échange interactif des deux côtés) ; si
  l'architecte juge cette anticipation trop spéculative pour un seul adapter, il le dit.
- Un port driven pour le **lien pair à pair** ; un adapter WebRTC (`RTCPeerConnection` / `RTCDataChannel`),
  sans STUN ni TURN : candidats locaux seulement, les deux téléphones sur le même réseau local (typiquement le
  partage de connexion de l'un d'eux).
- Un port driven pour la **caméra de scan**, avec null-object (caméra refusée, absente).

**Lien direct**
- Ce qui circule : un **instantané des joueurs de la partie** (pseudo, couleur, et le genre uniquement si le
  Killer le requiert, `genreBoundary` inchangée), le **journal** (`MatchEvent[]`) et la **volée en cours** (le
  contenu du brouillon, hors journal), dans un message **versionné**.
- Côté miroir, la projection est **rejouée avec le code de domaine existant** (aucune règle réimplémentée) ; la
  volée en cours est projetée par les mêmes prévisualisations que le téléphone de saisie.

**Jeux reflétés** : les **cinq livrés** (X01, Tour du monde, Cricket, Killer, entraînement). Shanghai
(`lot/shanghai`, non fusionné) viendra plus tard ; le miroir aiguille par mode avec un `default` typé `never`,
pour qu'un mode oublié casse la compilation.

**Miroir** : une route dédiée, **lecture seule**, en **mise en page dédiée** (très grand, pensée paysage,
portrait toléré) ; rien n'est stocké ; muet ; écran maintenu allumé (Wake Lock).

**Connexion perdue** : le miroir **fige la dernière image** avec « Connexion perdue » ; le téléphone de saisie
affiche un **indicateur discret** (jamais bloquant, jamais une boîte) et continue de fonctionner comme avant.
**Reprise : toujours refaire l'échange de QR** (limite connue, assumée et affichée). À la reprise, l'instantané
complet est renvoyé.

**Sécurité et vérité de la politique**
- Gardes réseau, `RTCPeerConnection` et caméra : voir Zones impactées.
- `/confidentialite` réécrite avec sa date.
- `CLAUDE.md` regravé (« pas de réseau » précisé), `docs/DEPLOIEMENT.md` si besoin, charte, glossaire,
  `docs/PROJECT_PLAN.md`.

## Hors périmètre

*(Proposé par l'architecte d'intake. La liste est présentée à l'utilisateur et reste à confirmer à la relecture
de la planche.)*
- **Lot suivant, Firebase (esquisse seulement, non écrit, demande à part)** : second adapter derrière le même
  port de signalisation ; Auth anonyme + code court affiché par le téléphone de saisie et tapé sur le miroir ;
  règles de sécurité limitées à la salle du code, avec expiration ; signalisation seule (offre / réponse
  effacées après jumelage), journal et volée toujours en direct par `RTCDataChannel` ; SDK `firebase` chargé à
  la demande ; reconnexion automatique par le même code quand il y a Internet ; regravure « un seul adapter
  importe `firebase` » ; réécriture de la politique côté Google. **Rien de cela n'entre dans ce lot** : aucun
  SDK `firebase`, aucune règle de base, aucun code court, aucune Auth anonyme.
- **Repli sans caméra** (copier-coller, saisie d'un code, ou autre) : à rouvrir avec l'utilisateur **si la
  preuve sur appareils échoue**.
- STUN ou TURN : idem, à rouvrir si la preuve échoue.
- Saisie à deux appareils.
- Synchronisation de données entre appareils : historique, profils, export / import.
- Plusieurs miroirs en même temps.
- Enregistrement ou rejeu de la partie côté miroir ; statistiques sur le miroir.
- Enregistrement ou envoi d'une image de la caméra : elle ne sert qu'à lire le QR.
- Cloud Functions, comptes, Analytics.
- Shanghai (lot ultérieur) et tout jeu hors des cinq livrés.
- Écran de login.

## Comportement visible

*(Une planche est proposée avant le lot, comme pour `killer`. Les points « à confirmer à la planche » sont des
défauts de l'architecte d'intake.)*

- **Entrée côté saisie** : un endroit discret des Réglages (comme l'installation) et, une fois la partie
  lancée, un accès discret depuis l'écran de partie. **Jamais ouvert d'elle-même, jamais d'invite.** Position
  exacte : à la planche.
- **Écran de saisie, jumelage** : un QR **le plus grand possible** (scanné à 30 cm, sur un écran parfois à
  luminosité basse), une consigne en une phrase, puis l'ouverture du scan de la réponse. Cibles ≥ 48 px.
- **Écran de saisie, partie en cours** : un indicateur discret quand le miroir est connecté ou perdu ; il
  n'altère ni la lecture ni la saisie. Le Wake Lock est inchangé.
- **Miroir, jumelage** : scan du QR du téléphone de saisie, puis QR de la réponse à montrer à celui-ci. Erreurs
  lisibles : QR illisible, **caméra refusée ou absente = message clair, miroir indisponible** (aucun repli).
- **Miroir, partie** (lu à 2-3 m, posé, **lecture seule**) : les joueurs, leurs scores ou leurs états, le joueur
  à la ligne de lancer repéré, **la volée en cours en direct**, dans une **mise en page dédiée** très grande,
  pensée pour le paysage (portrait toléré). Aucun bouton de saisie, d'annulation ni de validation. Détail par
  mode : à la planche.
- **Rien n'est célébré avant la fin validée** (règle `annulation-volee`) : la fléchette de sortie en attente
  peut se voir comme les autres fléchettes de la volée, mais le miroir n'annonce ni vainqueur ni fin de partie
  tant que le journal n'est pas validé. *À confirmer à la planche.*
- **Fin de partie** : le miroir montre la fin (vainqueur, classement) quand le journal la contient. *À
  confirmer à la planche.*
- **Connexion perdue** : la dernière image reste affichée avec « Connexion perdue », lisible à distance, et
  propose de refaire le QR (aucune boîte bloquante). Libellé : à la planche.
- **Muet** : aucune voix, aucune vibration sur le miroir. *À confirmer à la planche.*
- **Un seul miroir** par partie partagée. *À confirmer à la planche.*
- **Rien de stocké** côté miroir (ni Dexie, ni `localStorage`) : s'il est rechargé, on rejumelle. *À confirmer
  à la planche.*

## Critères d'acceptation

1. **Sans Internet, le jumelage par QR fonctionne de bout en bout** (deux appareils hors ligne, même réseau
   local). Aucune requête vers l'extérieur.
2. **Preuve sur deux vrais téléphones : critère obligatoire.** Un Android et un iPhone, partage de connexion
   **dans les deux sens**, jumelage **en mode avion + Wi-Fi local**, scan en lumière faible, partie complète de
   chaque mode, coupure puis reprise, rechargement de chaque côté. **En cas d'échec (QR trop dense, mDNS,
   isolation de clients, scan raté), le lot n'est pas livrable** : on rouvre avec l'utilisateur STUN et le repli
   sans caméra, on ne livre pas un miroir à moitié.
3. **Aucune ouverture de la caméra et aucune connexion WebRTC** tant que l'utilisateur n'a pas ouvert le partage
   ou le miroir ; la bibliothèque QR est chargée **à la demande** (import dynamique, route paresseuse). Une
   partie se joue exactement comme aujourd'hui.
4. Journal et volée en cours passent **uniquement** par le `RTCDataChannel`. Vérifié par un test sur un lien
   factice et par relecture de l'adapter.
5. Chacun des cinq modes s'affiche sur le miroir par la **projection existante** ; aucun test de règle de jeu
   n'est dupliqué. Un mode ajouté plus tard sans écran miroir **ne compile pas**.
6. La volée en cours est visible en direct sur le miroir ; annuler une fléchette sur le téléphone de saisie la
   retire du miroir.
7. Le lien tombe : le miroir affiche « Connexion perdue » sur la dernière image et propose de refaire le QR ; le
   téléphone de saisie affiche l'indicateur discret et continue de fonctionner.
8. Rechargement du téléphone de saisie : la partie reprend (brouillon de volée inchangé) ; le partage se refait
   par QR, sans écran bloquant.
9. **Scan de QR sur iOS Safari et sur Android Chrome**, sans `BarcodeDetector` obligatoire. Caméra refusée ou
   absente : message clair, miroir indisponible, aucun repli.
10. `core/` n'importe rien de WebRTC ni de caméra (Biome `noRestrictedImports` et `hexagonalBoundary`
    étendus si besoin). **Un seul fichier de `src/` instancie `RTCPeerConnection`, un seul lit la caméra.**
11. `reseauBoundary.test.ts` est **réécrite** : elle détecte `RTCPeerConnection`, `RTCDataChannel` et
    `getUserMedia`, avec une **liste fermée** de fichiers autorisés et un plancher « le test peut échouer ».
    Les gardes `fetch(` / `XMLHttpRequest` / `WebSocket` / `EventSource` / `sendBeacon`, d'adresses
    `http(s)://` et d'import `firebase` **restent telles quelles**.
12. `SECTIONS_CONFIDENTIALITE` et `DATE_MISE_A_JOUR_CONFIDENTIALITE` sont mis à jour : voir Contraintes.
13. `npm run smoke` reste vert ; en-têtes de `firebase.json` et service worker vérifiés, aucune régression du
    cache, aucune interdiction de la caméra par un `Permissions-Policy`.
14. **Poids du bundle** : la bibliothèque QR n'entre ni dans le bundle de démarrage ni dans le précache, sauf
    décision explicite de l'architecte ; l'écart est mesuré et noté. *Corollaire : le chemin QR doit marcher hors
    ligne, donc la bibliothèque doit être disponible hors ligne une fois l'application installée (précache ou
    chargement depuis le cache). Décision de l'architecte.*
15. Aucun texte nouveau hors `labels.ts` ; vocabulaire « checkout » / « manche » inchangé.

## Contraintes

- **Hexagonal** : ports `driven` étroits (signalisation, lien pair à pair, caméra de scan) ; adapters dans
  `src/infrastructure/` ; null-objects ; l'UI consomme par `Services.devices` (même exception que `screenLock`
  et `AppInstallation`) ; câblage **uniquement** dans `container.ts`, services créés avant `createRoot` ; état
  synchrone avec abonnement lu par `useSyncExternalStore` (CONVENTIONS § 5).
- **Aucun serveur, aucun compte, aucun STUN / TURN.** Le seul réseau est le lien WebRTC local entre les deux
  téléphones.
- **Caméra** : utilisée **uniquement** au scan du QR, flux jamais enregistré ni envoyé, arrêtée à la fermeture
  du scan, jamais ouverte d'elle-même. Le flux ne sort pas de l'adapter.
- **Données** : rien ne quitte le réseau local. Le QR contient des adresses réseau locales et l'empreinte du
  téléphone : à dire dans la politique.
- **`/confidentialite` réécrite** :
  - « Il n'utilise jamais la caméra » devient **faux** : texte sur la caméra (scan du QR seulement, aucune
    image enregistrée ni envoyée) ; micro, localisation, contacts et notifications restent inutilisés.
  - Texte sur le lien direct entre téléphones et sur le QR. Les affirmations « n'a ni serveur » et « ne lui
    transmet rien » restent vraies et sont relues ; « sans réseau » est précisé.
  - **Aucune section sur Firebase** (hors périmètre).
  - Texte et date dans le même lot.
- **Décision `CLAUDE.md` regravée**, écrite précisément : « le réseau ne sert qu'au lien WebRTC local entre deux
  téléphones, jumelé par QR ; la caméra ne sert qu'au scan ; toujours aucun serveur, aucun compte, aucun STUN
  ni TURN ; la règle `firebase` est inchangée ». **`.ai/architecture-context.md`** est régénéré après
  (`/refresh-architecture`), pas édité à la main.
- **Zéro friction au démarrage** et **jeu hors ligne intact** : voir critère 3. Le Wake Lock, le brouillon de
  volée, l'annulation fléchette par fléchette, le « rien avant Valider la sortie » et la voix du téléphone de
  saisie ne changent pas.
- **Aucun format persisté ne change** : `MatchEvent`, schéma Dexie, `backupSchema`, `visitDrafts` inchangés. Le
  message du lien est un **format de protocole**, versionné, jamais écrit en base ni exporté. *L'architecte doit
  le confirmer.*
- **Charte** : tokens uniquement, angle vif, cibles ≥ 48 px, texte sous `craie-3` interdit ;
  `prefers-reduced-motion` respecté. Le QR se pose sur un fond contrasté dans les deux thèmes ; sans nouvelle
  couleur en dur hors exception documentée dans `themeBoundary` (décision de l'architecte).
- **Dépendance ajoutée** à une stack « figée » (décision de l'utilisateur, gravée par ce lot) : **une**
  bibliothèque QR (génération et lecture). Pas de CDN.

## Dépendances

- Bibliothèque QR (génération, décodage d'image) à choisir par l'architecte ; elle doit fonctionner sur iOS
  Safari sans `BarcodeDetector`.
- Deux appareils réels (Android + iPhone) pour la preuve.
- `lot/shanghai` n'est **pas** une dépendance : s'il fusionne avant, il sera ajouté au miroir plus tard ; s'il
  fusionne après, il devra apporter son écran miroir (le `default` typé `never` le garantit).

## Risques

- **ICE sans STUN** : candidats locaux seulement. Les navigateurs masquent souvent l'adresse locale par un nom
  mDNS (`xxxx.local`), dont la résolution peut échouer sur un partage de connexion ; la permission caméra,
  accordée pour le scan, pourrait changer ce comportement. **Hypothèses non vérifiées.** Isolation de clients
  du réseau possible. À prouver sur appareils (critère 2).
- **Taille du SDP en QR** : un SDP complet est gros. Réduit aux champs nécessaires (ufrag, pwd, empreinte DTLS,
  candidats locaux), il devrait tenir dans un QR de taille raisonnable, mais ce n'est **pas mesuré**. Un QR trop
  dense est illisible depuis un écran de téléphone. Si un seul QR ne suffit pas (plusieurs candidats, IPv6),
  prévoir un enchaînement de QR ou une réduction : décision de l'architecte.
- **Garage mal éclairé** : scan d'un écran à luminosité basse, reflets, caméra qui peine à faire le point ; le
  scan est l'étape la plus fragile du parcours dans le contexte d'usage. D'où : QR le plus grand possible, et
  pas de repli (décision de l'utilisateur) : un scan raté bloque le lot (critère 2).
- **Lecture de QR sur iOS Safari** : pas de `BarcodeDetector`, décodage en JavaScript sur le flux caméra, plus
  lourd et plus sensible à la lumière ; permission caméra refusée, ou mémorisée refusée pour un autre contexte
  (navigateur vs application installée).
- **Reconnexion limitée** : un lien tombé impose de refaire les deux scans. Assumé et affiché.
- **QR photographiable** : le QR d'offre contient des adresses locales et l'empreinte du téléphone ; toute
  personne qui le photographie pendant l'échange peut tenter de répondre. Risque faible, à documenter.
- **Poids** de la bibliothèque QR, chargée à la demande ; risque de régression de démarrage et de précache.
- **En-têtes `firebase.json`, service worker** : à vérifier, pas déduit (non lus pendant l'intake).
- **Garde réseau affaiblie** : une liste d'exceptions mal bornée rendrait `reseauBoundary` inutile. D'où la
  liste fermée et le plancher du critère 11.
- **iOS** : veille, Wake Lock sur le miroir, fiabilité du `RTCDataChannel` en arrière-plan : non établis.
- **Brouillon de volée** : la volée en cours circule mais **ne devient jamais un événement** ; ne pas confondre
  le miroir avec le journal.
- **Port de signalisation anticipé** : une seule implémentation aujourd'hui ; risque de forme trop
  spéculative. L'architecte arbitre.

## Zones impactées

- **Domaine** : aucune règle de jeu changée ; aucun fichier de `src/core/domain/` attendu (l'architecte le
  confirme).
- **Application** : ports driven (signalisation, lien pair à pair, caméra de scan) et driving éventuel
  (démarrer / arrêter le partage, état), use case(s) ; message de protocole versionné ; projection côté miroir
  réutilisant l'existant.
- **Infrastructure** : adapter de signalisation QR ; adapter WebRTC (seul `RTCPeerConnection`) ; adapter caméra
  (seul accès à la caméra) ; mémoire / null-objects.
- **Composition** : `src/composition/container.ts` (`Dependencies`, `Services.devices`).
- **UI** : route lazy du miroir ; écrans de jumelage (saisie et miroir) ; indicateur discret sur les cinq
  écrans de partie ; hooks de mode via `useVoleeEnCours` (point unique) pour pousser la volée ; aiguillage par
  mode côté miroir ; `labels.ts` (tous les textes, y compris la politique).
- **Tests et gardes** : `reseauBoundary.test.ts` (réécrit), `hexagonalBoundary.test.ts`, `lazyRoutes.test.ts`,
  garde de frontière des adapters (WebRTC, caméra), Biome `noRestrictedImports`, fakes de signalisation, de
  lien et de caméra.
- **Déploiement** : service worker (`vite-plugin-pwa`, précache de la bibliothèque QR), `package.json` (une
  dépendance), `npm run smoke`. `firebase.json` : aucun changement attendu (à vérifier).
- **Docs** : `CLAUDE.md`, `docs/CHARTE_GRAPHIQUE.md`, `docs/PROJECT_PLAN.md`, `.claude/CONVENTIONS.md` (port
  d'appareil réseau), `.claude/rules/glossary.md`, `.claude/agents/sec.md` si la checklist cite « pas de
  réseau ». `.ai/architecture-context.md` régénéré après.
- **Politique** : `SECTIONS_CONFIDENTIALITE` et sa date.

## Attentes de validation

- **Tests (Vitest, fakes, jamais de mocks)** : jumelage de bout en bout sur fakes (signalisation QR, lien et
  caméra factices) ; QR illisible ou tronqué ; caméra refusée ; perte puis reprise par nouveau jumelage ; envoi
  du journal et de la volée ; **annulation puis rejeu à froid** ; version de protocole inconnue refusée
  proprement ; gardes avec leurs planchers ; test que, sans action de l'utilisateur, ni la caméra ni WebRTC ne
  sont touchés.
- **Relecture à l'écran** : planche validée **avant** le lot (jumelage côté saisie, jumelage côté miroir, miroir
  en partie pour les cinq modes en paysage, « Connexion perdue »), copiée dans
  `C:\Users\kevin\Documents\Flechettes\docs\maquettes\ecran-miroir\`. Après le lot : `ecran` en portrait et
  paysage, thèmes sombre et clair ; lisibilité à 2-3 m sur un téléphone réel.
- **Preuve sur appareils réels (obligatoire, voir critère 2).** Les échecs sont documentés et rouvrent STUN et
  le repli sans caméra avec l'utilisateur.
- `npm run lint`, tests, `npm run build`, `npm run smoke` verts. Ce qui ne se voit qu'à l'écran (QR lisible,
  taille à 2-3 m, contraste) est dit comme **angle mort des tests**.
- Revue `sec` obligatoire (caméra, lien direct, politique, service worker, bibliothèque).

## Questions bloquantes

Aucune.

## Questions non bloquantes

| # | Question | Owner |
| --- | --- | --- |
| 1 | Planche à produire et valider avant le lot, comme `killer` (proposition : oui) | Utilisateur |
| 2 | Hors périmètre : saisie à deux, synchro de données, plusieurs miroirs, enregistrement / rejeu, statistiques, Cloud Functions (proposition : tous confirmés) | Utilisateur |
| 3 | Défauts à confirmer à la planche : miroir muet, Wake Lock actif, un seul miroir, rien de stocké, fin de partie affichée seulement une fois validée | Utilisateur, à la planche |
| 4 | Libellés, glossaire (« miroir », « jumeler », « QR »), place exacte de l'entrée | Utilisateur, à la planche |
| 5 | Nouvelle partie lancée sur le téléphone de saisie (« On remet ça », Rejouer) : le miroir suit-il tout seul le nouveau match ? (proposition : oui) | Utilisateur, à la planche |
| 6 | Bibliothèque QR ; disponibilité hors ligne (précache ou chargement depuis le cache) | Architecte |
| 7 | Forme du port de signalisation : pensée pour un 2e adapter, ou limitée au besoin du lot 1 | Architecte |
| 8 | STUN public en secours si la preuve sur appareils échoue (envoie des adresses à un tiers) | Utilisateur, après la preuve |
| 9 | Repli sans caméra à rouvrir si la preuve sur appareils échoue | Utilisateur, après la preuve |
| 10 | Lot suivant Firebase : à cadrer par un `/intake` séparé après livraison de ce lot | Utilisateur |

## Décisions prises pendant l'intake

1. **2026-10-22** : but = écran miroir ; un téléphone saisit, un second affiche en grand, lecture seule.
2. Transport = WebRTC `RTCDataChannel`, réseau local (typiquement partage de connexion d'un téléphone), sans
   STUN ni TURN.
3. **Jumelage = QR + scan, hors ligne, sans serveur** (chemin garanti). *Historique : QR seul, puis Firebase
   seul, puis deux adapters ; l'utilisateur a refusé toute dépendance exclusive à Internet (« il faut tenir sans
   Internet »), puis tranché : **QR d'abord, Firebase en second lot**.*
4. **Firebase sort de ce lot** : pas de SDK, de code court, d'Auth anonyme ni de règles de base. La décision
   gravée « jamais d'import `firebase` dans `src/` » **reste en vigueur**. Lot 2 : esquisse seulement (Hors
   périmètre).
5. Le port de signalisation est posé avec un seul adapter (QR), forme à l'architecte.
6. « Pas de réseau » regravé précisément : seul le lien WebRTC local et la caméra pour le scan ; toujours aucun
   serveur. Un seul fichier instancie `RTCPeerConnection`, un seul lit la caméra.
7. **Les deux téléphones ont une caméra correcte** : parcours à deux scans conservé.
8. **Pas de repli si le scan rate** (ni copier-coller ni autre). Caméra refusée ou absente : message clair, miroir
   indisponible. Repli sans caméra et STUN : à rouvrir si la preuve échoue.
9. **La preuve sur deux vrais téléphones est un critère d'acceptation obligatoire** : un échec rend le lot non
   livrable.
10. Reconnexion : toujours refaire les QR (limite connue). Le code court n'existe pas dans ce lot.
11. Politique `/confidentialite` : caméra au scan seul, lien local entre téléphones, pas de section Firebase.
12. Jeux = les **cinq livrés** ; Shanghai plus tard.
13. **Volée en cours en direct** (le brouillon circule, hors journal).
14. Miroir **lecture seule**, **mise en page dédiée**, très grand, pensée paysage.
15. Niveau `high` (forcé).
16. Défauts proposés, **à confirmer à la planche** : muet, Wake Lock actif, un seul miroir, rien de stocké.
17. Proposés et **à confirmer** : planche avant le lot (oui), hors périmètre (liste ci-dessus).
