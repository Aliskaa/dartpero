# Lot `ecran-miroir` — orchestration

## Objectif

Un second téléphone (« miroir ») affiche la partie en grand, en **lecture seule**, pendant que le premier
sert à saisir. Journal d'événements et volée en cours passent en direct d'un téléphone à l'autre par un
`RTCDataChannel` WebRTC, **jumelé par QR et scan**, hors ligne, sans serveur ni compte. Cinq jeux reflétés
(X01, Tour du monde, Cricket, Killer, entraînement). Détail complet : [`request.md`](request.md).

Lot **1** d'un chantier scindé : **QR seul**. Firebase (code court, Auth anonyme) est un lot suivant,
esquissé et non écrit dans la demande ; la décision gravée « aucun import de `firebase` dans `src/` » reste
en vigueur.

**Hors périmètre :** Firebase, STUN / TURN, repli sans caméra (à rouvrir si la preuve sur appareils échoue),
saisie à deux appareils, synchro de données, plusieurs miroirs, enregistrement / rejeu, statistiques sur le
miroir, Shanghai, login.

## Niveau

high — forcé par la demande : rouvre la décision gravée « pas de réseau » de `CLAUDE.md`, nouveau format de
protocole entre appareils, capacité caméra, politique publique `/confidentialite`, probablement le service
worker. Surfaces gravées annoncées par l'intake : la chaîne d'architecture démarre à `archi-authority`
(scout et designer sautés).

## Branche

`lot/ecran-miroir` — créée depuis `main` avant l'Architecture, fusionnée en `--ff-only` après accord.

## Provenance

Intake validé : source `docs/request/ecran-miroir.md` (statut Validé, 2026-10-22, niveau `high`, commande
manuelle conforme, zéro question bloquante), snapshot `docs/lots/ecran-miroir/request.md` copié octet pour
octet le 2026-10-22 (SHA-256 identique, `04F36D00…C481D`).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | Sauté | Surface gravée annoncée par l'intake (décision « pas de réseau », format de protocole, politique) |
| 2 | `archi-designer` | Sauté | Idem |
| 3 | `archi-authority` | PASS (second passage) | Premier passage arrêté à `maxTurns` (40) sans rapport, relancé par SendMessage ; PASS conditionnel (bibliothèque + mesure, planche, questions) |

Agent retenu : `archi-authority`

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | En cours (passages 1, 2, 3a, 3b faits, étapes 0-7 ; reste l'étape 8 : preuve sur appareils, relecture `ecran`) | `dev` | `02-dev-notes.md` |
| Test | Pas commencée | `test` | `03-plan-de-test.md` |
| Sécurité | Pas commencée | `sec` | `04-revue-securite.md` |
| Revue | Pas commencée | `review` | `05-revue.md` |
| Échanges | Pas commencée | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| Q1-Q18 produit / décision (01-architecture.md § Questions ouvertes), dont : planche avant les étapes UI, genre au Killer (Q11, écart à la demande), pas de port de signalisation (Q18) | `archi-authority` | Utilisateur (arrêt Archi → Dev) | Q1, Q11, Q13, Q18 closes le 2026-10-22 ; Q2-Q10, Q12, Q14-Q16 closes le 2026-10-24 (01 § Résolutions à la planche). **Q17 close le 2026-10-24** : texte de `politique-proposee.md` validé tel quel, date « Mise à jour le 24 octobre 2026 » |
| Critère 2 : preuve sur appareils (matrice complète) | demande | Utilisateur | Wi-Fi local Android + iPhone confirmé ; partage de connexion, mode avion, lumière faible, caméra refusée à passer. Ne bloque pas Dev, **bloque la livraison** |
| Q19-Q21 techniques | `archi-authority` | Dev / Test / Sécurité | Ouverte, ne bloque que leur phase |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-22 | Branche `lot/ecran-miroir` créée depuis `main` ; seul `docs/request/ecran-miroir.md` traînait (non suivi), il voyage avec la branche | Mise en place |
| 2026-10-22 | `.ai/architecture-context.md` périmé (`CLAUDE.md` et `CONVENTIONS.md` plus récents) : régénéré par l'agent `architecture-context` (sonnet, effort medium d'après son frontmatter), brief lu sur disque | Prérequis § contexte d'architecture |
| 2026-10-22 | `archi-authority` : 1er passage arrêté à maxTurns 40 sans rapport (755 s, 87 appels d'outils), non retenu ; relancé, 2e passage PASS (~19 min cumulées). Signal : le lot est gros, à garder en tête pour `dev` | Pas de succès synthétique |
| 2026-10-22 | Écart assumé à la demande : pas de port de signalisation, jeton de jumelage opaque dans `PeerLinks` (§ 3.1) | La demande déléguait l'arbitrage à l'architecte ; Q18 posée à l'utilisateur |
| 2026-10-23 | Mesure partielle : Wi-Fi local Android (Chrome 155, Android 10) + iPhone, jumelage par deux QR OK dans les deux rôles (journal Android : jeton 147 car., QR v6, collecte ICE 127-144 ms, rtt 27-73 ms, 16 Kio OK, coupure ICE de 2,6 s rétablie seule). Non couverts à ce jour : partage de connexion, mode avion, lumière faible, caméra refusée, iPhone en point d'accès, journal iPhone. Critère 2 **pas encore clos** | Résultats collés par l'utilisateur, confirmés oralement |
| 2026-10-24 | Q17 close : l'utilisateur valide (« oui ») le texte de `politique-proposee.md` tel que présenté, date du 24 octobre 2026. Dev passage 3b lancé (étapes 6-8 sauf preuve sur appareils) | Décision de l'utilisateur |
| 2026-10-24 | Dev passage 3b (opus, 122 appels d'outils) : lint, typecheck, build, smoke verts ; `npm test` 2116 verts, mais un échec isolé non identifié sur une première exécution, 3 relances vertes (test instable à chercher en phase Test). Poids : démarrage +7,1 % gzip, précache +12,4 % ; l'utilisateur répond « C'est tout bon » (lu comme : hausse acceptée, on poursuit). Index d'architecture régénéré (137 lignes). Relecture `ecran` lancée | Étapes 6-7 faites ; reste la preuve sur appareils (critère 2) |
| 2026-10-24 | Dev passage 3a (étape 5 UI, opus, 107 appels d'outils) : lint, typecheck, 2112 tests (+25) revérifiés ; écarts à la planche : pas de moyenne (Q7), genre limité à « éliminé(e) » ; libellés hors planche listés dans 02 pour l'utilisateur | Rien vu à l'écran : relecture `ecran` à l'étape 8 |
| 2026-10-24 | Dev passage 2 (étapes 2-4, opus, 103 appels d'outils) : lint, typecheck, 2087 tests (+80) revérifiés par l'Orchestrator ; écart : 3e message `arret` au protocole ; question produit ouverte « en attente entre deux parties » posée à l'utilisateur | Pas de passage 3 avant sa réponse |
| 2026-10-24 | Planche acceptée en bloc par l'utilisateur (« OK avec tes propositions ») : Q2-Q10, Q12, Q14-Q16 closes, voir 01 § Résolutions à la planche. Dev passage 2 découpé : étapes 2-4 (sans UI) d'abord, puis 5-8, vu l'avertissement de taille du lot (archi-authority arrêté à maxTurns) | Décision de l'utilisateur ; découpage pour éviter un `maxTurns` atteint |
| 2026-10-23 | Planche écrite par l'Orchestrator : `docs/maquettes/ecran-miroir/planche.html` (ignoré par git), propositions pour Q2-Q10, Q12, Q14-Q16 ; **aucune n'est tranchée tant que l'utilisateur n'a pas répondu** | Q2-Q10, Q12, Q14-Q16 bloquent les étapes UI |
| 2026-10-22 | Dev passage 1 (étapes 0-1, opus, effort medium d'après frontmatter, 50 appels d'outils) : `@nuintun/qrcode@5.0.3` retenue (V1-V7 passées), spike dans `docs/maquettes/ecran-miroir/spike/` (ignoré par git) ; Q19 partielle : la règle `vendor` aspire la lib (mesuré), groupe dédié à faire. Passages suivants bloqués jusqu'à la mesure de l'utilisateur | Porte utilisateur du critère 2 |
| 2026-10-22 | Arrêt Archi → Dev passé : mesure d'abord (étapes 0-1), planche ensuite ; Dev lancé sur les étapes 0-1 seulement, `model: opus` (surface gravée) ; genre accordé au Killer (Q11, écart à la demande) ; pas de port de signalisation (Q18) ; pas d'indicateur après rechargement (Q13) | Décisions de l'utilisateur, voir 01 § Résolutions |
| 2026-10-22 | Chaîne d'architecture démarrée à `archi-authority` (opus, effort max d'après son frontmatter) ; `dev`, `test`, `sec` en `model: opus` | Surface gravée annoncée (§ Monter en gamme) |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| — | — | — | — | — |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
