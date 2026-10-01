# Demande — stockage-persistant

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-01
- **Niveau** : high
- **Commande manuelle** : `/orchestrate stockage-persistant high`

## Objectif

Demander au navigateur de ne **jamais effacer** la base IndexedDB de Dartpéro, via
`navigator.storage.persist()`. Sans cette demande, les données peuvent disparaître sans
prévenir : Chrome les supprime quand l'espace disque manque, et Safari les efface après
environ 7 jours sans ouverture quand l'app n'est pas installée. Joueurs, historique et stats
partiraient alors. Le lot est utile même sans Play Store
(voir [la feuille de route](../prospective/2026-10-01-NEW-feuille-de-route-play-store.md), lot 1).

## Périmètre

- Un **port driven** pour le stockage persistant, avec trois opérations :
  - lire l'état : `protégé` / `non protégé` / `indisponible` ;
  - demander la protection ;
  - un null-object quand l'API manque, sur le modèle de `ScreenLock` / `NullScreenLock`.
- Un **adapter navigateur** dans `src/infrastructure/device/`, câblé **uniquement** dans
  `src/composition/container.ts` et exposé via `Services.devices`. C'est l'exception assumée,
  comme `screenLock`.
- **Demande automatique au démarrage** de l'app :
  - si `persisted()` vaut déjà `true`, on ne fait rien ;
  - sinon, un seul appel à `persist()`, sans bloquer le rendu.
- **Réglages, panneau « Sauvegarde » existant** : une ligne d'état.
  - Si la protection n'est pas accordée : un bouton « Redemander » et un rappel d'exporter
    régulièrement.
  - Si l'API est indisponible : l'état seul, sans bouton.
- Tout le texte affiché est dans `src/ui/labels.ts`.

## Hors périmètre

- Aucune alerte hors des Réglages : ni bandeau sur l'accueil, ni rien pendant une partie.
- Pas d'affichage de la place occupée (`storage.estimate()`).
- Pas de changement du schéma Dexie, de `MatchEvent` ou de `backupSchema`.
- Pas de sauvegarde automatique ni de sync.
- L'installation guidée est un autre lot (`installation-guidee`).

## Comportement visible

- **Démarrage** : rien de visible. Chrome et Safari tranchent en silence. Firefox peut
  afficher sa propre demande : on l'accepte, et l'app ne l'anticipe pas.
- **Réglages → Sauvegarde**, en portrait et en paysage, thème sombre et clair, lu à 30 cm :
  - Protégé : « Données protégées : le navigateur ne les effacera pas. »
  - Non protégé : « Le navigateur peut effacer les données si l'espace manque. » + bouton
    « Redemander » (≥ 48 px) + « Exportez régulièrement. »
  - Indisponible : « Protection non prise en charge par ce navigateur. » + rappel d'exporter.
  - Le libellé exact se tranche à l'implémentation, avec ce sens.
- Ce n'est pas un écran de partie : aucun impact sur la lisibilité à 2-3 m.

## Critères d'acceptation

1. Au démarrage, `persist()` est appelé **une fois** si l'état n'est pas déjà « protégé », et
   jamais s'il l'est.
2. Une API absente, ou un `persist()` qui rejette ou lève une erreur, ne casse ni le démarrage
   ni les Réglages. L'état devient alors « indisponible » ou « non protégé ».
3. Les Réglages affichent le bon état pour chacun des trois cas.
4. « Redemander » rappelle `persist()` et met l'état à jour à l'écran sans recharger la page.
5. Aucun appel à `navigator.storage` hors de l'adapter : le cœur et l'UI passent par le port.
6. Tests verts, Biome propre, gardes d'architecture verts (`hexagonalBoundary`,
   `themeBoundary`, `lazyRoutes`).

## Contraintes

- Architecture hexagonale : le port vit dans `src/core/application/ports/driven/`, et le cœur
  n'importe aucune API navigateur.
- Zéro friction : la demande au démarrage ne bloque jamais le premier rendu.
- Tokens de couleur seulement, angle vif, `<output aria-label>` pour l'état qui change,
  icônes `aria-hidden` (`.claude/rules/frontend-react.md`, `.claude/rules/theme-colors.md`).

## Dépendances

Aucune. C'est le premier lot de la feuille de route Play Store.

## Risques

- **Comportement des navigateurs hétérogène, et non vérifiable en test** :
  - Chrome n'accorde la protection que selon ses propres critères (app installée,
    engagement), donc il peut refuser sur un onglet simple ;
  - le support réel de Safari iOS reste à confirmer sur un **vrai iPhone**.
  - C'est un angle mort à signaler.
- Firefox peut afficher une demande au démarrage : c'est une petite friction, acceptée.
- Ne pas laisser croire que « protégé » remplace l'export : la désinstallation ou
  l'effacement manuel des données détruisent tout quand même.

## Zones impactées

- `src/core/application/ports/driven/` (nouveau port)
- `src/infrastructure/device/` (nouvel adapter)
- `src/composition/container.ts`
- Le démarrage de l'app (`src/main.tsx` ou la coquille UI, choix laissé à l'archi)
- `src/ui/ecrans/ReglagesEcran.tsx`, `src/ui/labels.ts`
- `tests/fakes/`
- Docs : `CLAUDE.md` (si une décision est gravée), `docs/PROJECT_PLAN.md`,
  `docs/DEPLOIEMENT.md` (comportement par navigateur), la feuille de route (statut).

## Attentes de validation

- Tests unitaires de l'adapter sur un faux `navigator.storage` (fake, pas de mock) :
  accordé, refusé, absent, rejet.
- Test du démarrage avec un fake du port : appel unique, ou aucun appel si déjà protégé.
- Tests UI des Réglages (Testing Library) pour les trois états et le bouton « Redemander ».
- **Relecture à l'écran** des Réglages, en portrait et en paysage, thème sombre et clair.
- Vérification sur un vrai appareil Android, PWA installée (état attendu : « protégé ») ;
  iPhone si possible.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Point d'appel au démarrage (`src/main.tsx` ou un hook de la coquille). Owner : archi.
- Libellés définitifs. Owner : dev, validé par l'utilisateur à la relecture.
- Support réel sur Safari iOS. Owner : utilisateur, sur un vrai iPhone.

## Décisions prises pendant l'intake

- Demande **automatique au démarrage**, et pas seulement via un bouton.
- Affichage limité aux **Réglages** (panneau Sauvegarde) : l'état, plus le bouton
  « Redemander » quand la protection n'est pas accordée. Pas de volume affiché.
- Aucune alerte hors des Réglages.
- Niveau **high**. Ce n'est pas une surface gravée à la lettre (aucun format persisté ne
  change), mais le lot touche la survie des données et la feuille de route l'a classé `high`.
