# Demande — confidentialite-assetlinks

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-03
- **Niveau** : high
- **Commande manuelle** : `/orchestrate confidentialite-assetlinks high`

## Objectif

Lot 3 de [la feuille de route](../prospective/2026-10-01-NEW-feuille-de-route-play-store.md).
Il pose deux prérequis du Play Store, qui servent aussi sans store :

1. une **politique de confidentialité et des mentions légales**, accessibles à une URL
   publique, celle que l'on donnera à la Play Console ;
2. la **tuyauterie** de `/.well-known/assetlinks.json` sur Firebase Hosting. Le fichier
   contient `[]` : l'empreinte SHA-256 de la clé de signature et le nom de package Android
   n'existent pas avant le lot 4 (`play-store-twa`), qui remplira le contenu.

`high` imposé : le lot touche `firebase.json` et le service worker, deux surfaces gravées.

## Périmètre

- **Nouvel écran `/confidentialite`**, route `lazy`, sous la même enveloppe que les Réglages
  (barre de navigation visible ou non : à trancher par l'architecte). Il contient :
  - **Confidentialité** : aucune donnée collectée ni transmise, aucun compte, aucun cookie,
    aucune mesure d'audience, aucune publicité. Tout reste sur l'appareil (IndexedDB), et
    l'utilisateur garde la main avec l'export / import JSON et l'effacement des données du
    site. L'hébergeur (Firebase Hosting, Google) voit l'adresse IP le temps de servir les
    fichiers. Les préférences d'appareil vont dans `localStorage`. La protection du stockage
    est demandée au navigateur. Aucune permission sensible.
  - **Mentions légales** : éditeur et contact, hébergeur (raison sociale et adresse de Google
    pour Firebase Hosting).
  - **Date de mise à jour**.
- Tout le texte vit dans `src/ui/labels.ts`, comme le reste du français affiché.
- **Éditeur et contact = valeurs marquées `À REMPLIR`**. `npm run smoke` échoue tant qu'il en
  reste une dans `dist/`, ce qui bloque `npm run firebase:deploy`.
- **Réglages → À propos** : un lien « Confidentialité et mentions légales ».
- **`public/.well-known/assetlinks.json`** contient `[]`.
- **`firebase.json`** : une exception explicite pour qu'il ne soit plus ignoré par `**/.*`,
  tout en continuant d'ignorer les autres fichiers cachés. Il est servi en
  `application/json`, jamais réécrit vers `index.html`.
- **Service worker** (`vite.config.ts`, workbox) : `/.well-known/` est exclu du repli de
  navigation, et le fichier n'est pas précaché.
- **`scripts/smoke-build.mjs`** vérifie trois choses : `dist/.well-known/assetlinks.json`
  existe et contient un tableau JSON valide ; il n'est pas dans le précache ; aucun
  `À REMPLIR` ne reste dans `dist/`.
- **`docs/DEPLOIEMENT.md`** : nouvelle section « Confidentialité et Digital Asset Links ». Elle
  dit ce que le lot 4 devra remplir, et donne la vérification `curl -I` à faire après
  déploiement.

## Hors périmètre

- Le contenu réel d'`assetlinks.json` (nom de package, empreinte), la clé de signature,
  Bubblewrap : lot 4 `play-store-twa`.
- Le formulaire « Sécurité des données » de la Play Console : lot 4 ou démarche de
  l'utilisateur.
- Toute page HTML statique hors de l'app.
- Une bannière de consentement : sans cookie ni traceur, il n'y a rien à consentir.
- Une traduction anglaise (décision ouverte n° 5).

## Comportement visible

- **Réglages → À propos** : une ligne-lien de plus, avec une cible ≥ 48 px.
- **`/confidentialite`** : page de lecture à 30 cm, pas à 2-3 m, et ce n'est pas un écran de
  partie. Elle suit la charte : angle vif, tokens, thèmes sombre et clair, portrait et
  paysage. Elle se lit hors ligne une fois l'app en cache. Retour vers les Réglages.
- Ouverte directement à son URL dans un navigateur vierge, la page s'affiche (réécriture SPA).

## Critères d'acceptation

1. `/confidentialite` s'affiche depuis l'URL directe et depuis Réglages → À propos, dans les
   deux thèmes, en portrait comme en paysage.
2. Le texte ne dit rien de faux sur l'app : aucune requête externe, aucun cookie. L'export,
   l'import et l'effacement y sont décrits.
3. `dist/.well-known/assetlinks.json` vaut `[]` et n'est pas précaché ; `smoke` le vérifie.
4. `smoke` échoue s'il reste un `À REMPLIR` dans `dist/`. On vérifie que ce contrôle casse
   bien (`rules/testing.md` : un test d'absence doit pouvoir échouer).
5. `firebase.json` continue d'ignorer les autres fichiers cachés, et l'ordre des règles
   `headers` n'est pas cassé (la dernière règle qui correspond l'emporte).
6. Après déploiement, tâche manuelle de l'utilisateur :
   `curl -I https://dartpero.web.app/.well-known/assetlinks.json` répond `200` en
   `application/json`, et le corps vaut `[]`, pas le HTML de l'app.
7. `npm run lint`, les tests, `npm run build` et `npm run smoke` passent au vert (hors
   l'échec voulu du critère 4 tant que les `À REMPLIR` restent).

## Contraintes

- Aucun `import` de `firebase` dans `src/`. Aucune requête réseau ajoutée.
- Routes `lazy` : `tests/architecture/lazyRoutes.test.ts`. Couleurs :
  `tests/architecture/themeBoundary.test.ts`.
- `id: '/'` du manifeste inchangé.
- Le texte de la politique est un projet sincère, **pas un avis juridique**.

## Dépendances

- `installation-guidee` (✅ fait).
- C'est le lot 4 `play-store-twa` qui consommera `assetlinks.json` et l'URL de la politique.

## Risques

- **R1** : le robot de Google n'exécute pas le JS de la page. Probabilité faible (les pages
  SPA sont acceptées en pratique). Plan B : une page statique, dans un lot à part.
- **R2** : une exception `firebase.json` trop large publierait d'autres fichiers cachés.
- **R3** : une erreur d'ordre dans `headers` casserait le cache long des assets.
- **R4** : tant que les `À REMPLIR` restent, **aucun déploiement ne passe**, même un
  correctif. C'est un choix assumé.
- **R5** : le texte devient faux le jour où une capacité réseau arrive (lot 6, monétisation).
  À signaler dans `docs/DEPLOIEMENT.md`.

## Zones impactées

`firebase.json`, `vite.config.ts` (workbox), `public/.well-known/`,
`scripts/smoke-build.mjs`, `src/App.tsx`, `src/ui/ecrans/` (nouvel écran),
`src/ui/ecrans/ReglagesEcran.tsx`, `src/ui/labels.ts`, `tests/ui/`, `docs/DEPLOIEMENT.md`,
`CLAUDE.md` (§ Déploiement), le suivi de la feuille de route.

## Attentes de validation

- Test UI (Testing Library) : le lien dans À propos mène à la page, et la page affiche ses
  sections.
- Contrôles `smoke` (fichier, précache, `À REMPLIR`), dont on vérifie qu'ils cassent.
- Relecture à l'écran : thèmes sombre et clair, portrait et paysage.
- `curl` après déploiement (critère 6), par l'utilisateur.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- **Identité de l'éditeur et e-mail de contact** à mettre à la place des `À REMPLIR` :
  owner = utilisateur, avant le premier déploiement.
- **Barre de navigation** visible ou non sur `/confidentialite` : owner = architecte.

## Décisions prises pendant l'intake

- `assetlinks.json` = la tuyauterie plus `[]` ; le contenu réel va au lot 4.
- La politique est une route de l'app, pas une page statique.
- Éditeur et contact restent en `À REMPLIR`, avec un `smoke` bloquant.
