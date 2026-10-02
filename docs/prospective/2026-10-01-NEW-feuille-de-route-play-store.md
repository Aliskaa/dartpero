# Feuille de route — vers le Play Store

> Fichier de suivi des lots évoqués avec l'utilisateur les 30 septembre et 1er octobre 2026.
> **Prospective** : rien n'est décidé ici. Chaque lot passe par `/intake <id>` puis
> `/orchestrate <id> <niveau>`, sur sa branche `lot/<id>`. C'est le lot qui grave ses décisions
> dans `CLAUDE.md`, pas ce fichier.

## Objectif

Rendre Dartpéro téléchargeable comme une application du **Google Play Store**, sans compte et
sans réseau, et rendre la PWA actuelle vraiment fiable et facile à installer. La **monétisation
est mise de côté** pour le moment.

## Suivi

Statut : ⬜ à faire · 🟡 en cours · ✅ fait · ⏸ mis de côté

### Préalable

| Lot | Statut | Contenu | Niveau |
|---|---|---|---|
| `allegement-docs` | ✅ `eed75e0` | `CLAUDE.md` 530 → 338 lignes, `.ai` devient un index plafonné (≤ 160 l. / ≤ 13 312 o.), `docs/DEPLOIEMENT.md` créé | `high` |

### Vers le Play Store (dans cet ordre)

| # | Lot | Statut | Contenu | Niveau | Pourquoi |
|---|---|---|---|---|---|
| 1 | `stockage-persistant` | ✅ fait (vérif. appareil restante) | `navigator.storage.persist()` derrière un port, état affiché dans les Réglages | `high` (persistance) | Sans lui, le navigateur peut effacer l'IndexedDB (Chrome si l'espace manque, Safari après ~7 jours sans ouverture si non installée). Aucun appel aujourd'hui dans `src/`. Utile **même sans store** |
| 2 | `installation-guidee` | ✅ fait (vérif. appareil restante) | Bouton « Installer Dartpéro » (capte `beforeinstallprompt`), guide iPhone (Partager → Sur l'écran d'accueil), manifeste enrichi : `id`, `categories`, `screenshots` (étroit + large), `shortcuts` (« Nouvelle partie ») | `high` (manifeste / service worker) | Aujourd'hui un pote qui ouvre le lien reste dans un onglet sans le savoir. Utile **même sans store** |
| 3 | `confidentialite-assetlinks` | ⬜ | Page de politique de confidentialité + mentions légales ; `/.well-known/assetlinks.json` sur Firebase Hosting | `high` (`firebase.json`) | ⚠️ `firebase.json` ignore `**/.*` : il exclurait `/.well-known/`. Exception explicite + vérification `curl` après déploiement |
| 4 | `play-store-twa` | ⬜ | Emballage TWA par **Bubblewrap** (AAB signé, clé à sauvegarder), fiche du store (icône 512, bannière 1024×500, captures depuis `docs/captures/`, descriptions), numérotation des versions (`package.json` 0.1.0 ↔ `versionCode`), comportement du bouton retour Android en partie | `high` (renverse une décision gravée) | Renverse « PWA, pas de passage par les stores » — en connaissance de cause. La TWA reste la même PWA : chaque `npm run firebase:deploy` met l'app du store à jour |
| 5 | `aide-regles` | ⬜ | Écran d'aide / règles par mode, premier lancement guidé (deux joueurs → une partie en < 30 s) | selon périmètre | Les potes connaissent le Tour du monde et le cut-throat, un inconnu du store non |
| 5 bis | `i18n-anglais` | ⬜ (optionnel) | Traduction anglaise | `high` (tranche la décision ouverte n° 5) | Le marché des fléchettes est surtout anglophone |

### Démarches hors code (utilisateur)

| Étape | Statut | Durée |
|---|---|---|
| Compte développeur Google Play (25 $, une fois) + vérification d'identité | ⬜ | quelques jours |
| **Test fermé : ≥ 12 testeurs pendant 14 jours d'affilée** (obligatoire pour un compte personnel récent) — à démarrer dès que la TWA existe | ⬜ | **2 semaines minimum** |
| Demande d'accès à la production + revue Google | ⬜ | quelques jours à une semaine |
| Vérifier le nom « Dartpéro » (INPI, Play Store) | ⬜ | — |

Compter **≈ 3 à 4 semaines** entre la fin du lot 4 et une app trouvable dans le Play Store.

### Nettoyage (relevé par la Revue d'`allegement-docs`)

| Lot | Statut | Contenu | Niveau |
|---|---|---|---|
| `nettoyage-claude-md` | ⬜ | Incohérences anciennes de `CLAUDE.md` : « Best-of N legs (défaut 3) » (l. 224) contre « premier à N » (l. 74-81) ; `useMatch.ts` cité (l. 93) → `useX01.ts` ; « bannir … les API navigateur » (l. 95-97) alors que Biome ne bannit que 7 paquets ; ligne « Lot 6 » restée dans § État d'avancement ; formulation de `review.md` l. 55-57. Éventuellement : README qui annonce 318 tests (réel : 339), exemples Biome / TS à remettre dans `CONVENTIONS` § 12 | `high` (surface gravée) |

Autres constats de l'index (`.ai/architecture-context.md` § Constats) à trancher un jour :
entraînement non gravé dans `CLAUDE.md` (plage 41-170), First 9 (9 fléchettes ou 3 volées),
`PROJECT_PLAN` § 2 sans `PreviewTourDuMondeVisit`, `PROJECT_PLAN` § 6 lot 1 périmé, charte qui ne
cite que 2 des 3 exceptions de couleur, sets non exposés à la création de partie.

### Plus tard

| Lot | Statut | Contenu |
|---|---|---|
| `app-store-capacitor` | ⏸ | Emballage **Capacitor** pour l'App Store d'Apple : un Mac (ou une compilation cloud), compte Apple Developer 99 $/an, risque de refus au titre de la règle 4.2. En attendant, les iPhone installent la PWA depuis Safari (lot 2) |
| `deblocage-pro` | ⏸ monétisation | Freemium à déblocage unique via **Google Play Billing** (port `Entitlements`). Touche « pas de réseau » (vérification d'achat). Recommandé plutôt que la pub (AdMob : bannière illisible à 2-3 m, Capacitor, RGPD) |

## Prochaine étape

Vérifier `installation-guidee` sur appareil après déploiement (R1, R2, R5, R6 : `PROJECT_PLAN` § 0),
puis `/intake confidentialite-assetlinks` (lot 3).
