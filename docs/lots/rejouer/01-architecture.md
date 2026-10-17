# Lot `rejouer` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu (`archi-scout`, sonnet / low,
> 2026-10-16). Le rapport source commence par `Architecture result: PASS`.

## Problème

L'étape 1 de Nouvelle partie ne propose que les quatre jeux : rejouer la partie d'hier coûte six
ou sept touches. Il faut y lire, depuis l'historique existant, les 3 configurations distinctes
les plus récentes (mode + réglages + ensemble de joueurs), fusionnées avec « N fois », et
permettre de les relancer en deux touches (▶ puis « Commencer »), ou une en solo.

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| Calcul dans l'UI sur `getMatchHistory` | Aucun port | Regroupement métier dans un composant (UI → use cases) |
| **Use case d'`application` sur l'historique** | Testable aux fakes, UI → use cases | Un port de plus |
| Stocker les configurations | Lecture directe | Donnée persistée nouvelle (surface gravée, politique) — exclu par la demande |

## Approche retenue

Un use case pur d'`application` lu sur l'historique, une section UI, rien de stocké en plus.

1. **Port driving** `src/core/application/ports/driving/GetReplayableConfigurations.ts` (nom
   arrêté par le Dev) : type `ConfigurationRejouable` = `mode`, `config` typée par mode (union
   discriminée comme `MatchSummary`), `playerIds` **dans l'ordre de la partie la plus récente** du
   groupe, `count`, `lastPlayedAt` (`createdAt` de la plus récente).
2. **Use case** `GetReplayableConfigurationsUseCase.ts` : lit `execute(50)` de l'historique
   (plafond en constante nommée, comme Parties — réponse à la question non bloquante n° 1 de la
   demande) ;
   - écarte toute partie dont un `players[].name === null` (profil supprimé) **avant** fusion :
     le compteur ne compte que les parties gardées ;
   - clé de groupe = mode + réglages + `playerIds` **triés** ; X01 : `startingScore`,
     `legsToWin`, `setsToWin`, `doubleOut`, `doubleIn` ; Cricket : `variant` ; Tour du monde :
     aucun ; entraînement : `rounds` ; ordre et nom exclus ;
   - compte toutes les parties (sans filtre sur `finished`) ;
   - rend les groupes triés par `lastPlayedAt` décroissant, **sans couper à 3**.
3. **Filtre « reproductible »** côté UI (module neutre de `src/ui/` ou hook) : `application` ne
   peut pas importer `reglagesPossibles.ts`. Écarte une valeur hors `SCORES` / `LEGS` / `SETS` /
   `SORTIES`, ou des `targets` (Cricket, Tour du monde) / `minTarget`, `maxTarget`
   (entraînement) différents du défaut `create()`. Puis `slice(0, 3)` : critères 3 et 9 par la
   même règle « filtrer, puis couper ».
4. **`useNouvellePartie.ts`** :
   - exposer `setJoueurEntrainement` ; ajouter `rejouer(configuration)` qui écrit les
     préférences existantes (`partie:score`, `partie:legs`, `partie:sets`, `partie:double-out`,
     `partie:double-in`, `partie:variante-cricket`, `entrainement:sorties`, et `partie:joueurs`
     ordonné ou `entrainement:joueur`) ;
   - ⚠️ **piège de fermeture** : `lancer` lit les valeurs du rendu courant ; après un `setX` de
     `usePreference`, la lecture immédiate est périmée. Factoriser `lancer` pour prendre réglages
     et `playerIds` en argument (défaut : valeurs courantes) — pas un nouveau chemin de lancement ;
   - **solo** (entraînement, ou configuration à 1 joueur, X01 / Cricket / Tour du monde compris) :
     appel direct de `lancer` avec les valeurs de la configuration ;
   - **≥ 2 joueurs** : préférences écrites puis `navigate(cheminOrdre(mode), { state:
     ETAT_PARCOURS })` ; l'Ordre relit les préférences au rendu suivant ;
   - **nom** : passer `{}` explicitement (jamais `nomTape(saisieNom, …)`) — sinon un nom saisi
     avant un retour fuirait (critère 4).
5. **`EtapeJeu.tsx`** reçoit `partie` en props (hook toujours appelé une seule fois par
   `NouvellePartieEcran`) ; section « Rejouer » en `<ul>`, une seule cible par ligne (▶,
   `<button>` ≥ 48 px, pas `<Link>` : le solo est asynchrone) ; `occupe` / `erreur` de `demarrer`
   réutilisés ; « Ou un autre jeu » : 4 `<Link>` compacts, `Pictogramme` 28 px ; sans parties :
   tuiles 2 × 2 intactes.
6. **`clesRequetes.ts`** : `CLE_REJOUER = [...CLE_HISTORIQUE, 'rejouer']` ; l'invalidation de
   `CLE_HISTORIQUE` au lancement et en fin de partie couvre le critère 8 (à tester).
7. **`labels.ts`** : libellés de section, « N fois », `aria-label` de ▶, résumé des réglages
   (réutiliser `libelleLegs` / `libelleLegsCourt`, les vocabulaires de sortie et de variante,
   `pluriel`, et les libellés de date existants si possible).
8. **Docs** : charte § Parcours ; une ligne « Rejouer » dans `CLAUDE.md` § Décisions
   structurantes.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | Aucun |
| `core/application/` | `ports/driving/GetReplayableConfigurations.ts`, `use-cases/GetReplayableConfigurationsUseCase.ts` | Nouveau port + use case |
| `infrastructure/` | — | Aucun |
| `ui/` | `ecrans/nouvelle-partie/EtapeJeu.tsx`, `NouvellePartieEcran.tsx`, `hooks/useNouvellePartie.ts`, `clesRequetes.ts`, `labels.ts`, filtre « reproductible » | Section Rejouer, préremplissage, lancement factorisé |
| `composition/` | `container.ts` | Champ `Services` + instanciation |
| `tests/` | use case, filtre, UI de l'étape 1 et du hook | Nouveaux tests |

**Sens des dépendances vérifié :** `ui`/`infrastructure` → `application` → `domain`.
**Nouveau port ?** `GetReplayableConfigurations` ; premier consommateur : `EtapeJeu` via
`useServices()`.

## Décisions de `CLAUDE.md` concernées

Respectées : UI → use cases ; une route par étape, `BarreEtapes` non interactive ; nom jamais
écrit ; « Tirer au sort » inchangé ; laiton unique, angle vif, cibles ≥ 48 px, tokens seuls ;
aucune règle de jeu réimplémentée. À graver en fin de lot : une ligne « Rejouer » en § Décisions
structurantes. Gardes concernées : `accentBoundary`, `pictogrammesBoundary`, `appuiBoundary`.

## Baseline sécurité

- Aucune entrée non fiable nouvelle ; l'import JSON n'est pas touché.
- Aucun réseau, aucun HTML brut (pseudos rendus en texte par React).
- Aucune donnée ni clé persistée nouvelle (clés `partie:*` existantes réécrites) :
  `/confidentialite` reste vraie.
- Risque assumé (demande) : lancement solo en un appui ; la partie reste abandonnable.
- Le filtre « non reproductible » empêche de rejouer faussement une partie importée hors listes.

## Conformité à la planche

Planche : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\derniers\derniers.html`, piste 2
(`np2`).

| Élément de la planche | Où le plan l'implémente |
|---|---|
| En-tête « Nouvelle partie » + étiquette « Rejouer » | `EtapeJeu`, avec `BarreEtapes` du lot 9 en tête (décidé) |
| Ligne : pictogramme 40, titre « X01 · 501 », réglages en petites capitales, pastilles, ▶ 48 px laiton | Ligne de `EtapeJeu` ; `Pictogramme` `currentColor` ; ▶ `bg-laiton` |
| « N fois » dans la ligne de réglages | `labels.ts` |
| 3 lignes, la plus récente en tête | Filtre puis `slice(0, 3)` |
| « Ou un autre jeu » : rangée de 4, pictogramme + nom | 4 `<Link>` vers `cheminNouvellePartie(mode)` |
| Phrase d'aide « ▶ ouvre l'ordre de jeu… » | Question utilisateur |
| Couleur par mode | Écart déjà tranché (laiton unique, lot 6b) |

Écarts : aucun hors ceux déjà décidés par la demande.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| U1 | Libellés exacts : « Rejouer », « Ou un autre jeu », « N fois », `aria-label` de ▶ | Utilisateur |
| U2 | « N fois » quand N = 1 : masqué (lecture de la planche) ou « 1 fois » ? | Utilisateur |
| U3 | Date de la dernière fois : règle pour aujourd'hui, hier, la semaine, au-delà ; heure ou non ; libellés existants acceptables ? | Utilisateur |
| U4 | Titre et résumé par mode (X01 sets / sortie / entrée double ; Cricket cut-throat ; Tour du monde ; entraînement) | Utilisateur |
| U5 | Phrase d'aide de la planche : gardée (fausse en solo), adaptée, ou retirée ? | Utilisateur |
| U6 | Cas non dessinés : 4 pastilles à 360 px et pseudos longs ; état de chargement de l'historique ; échec du lancement solo | Utilisateur |
| T1 | « N fois » partiel au-delà de 50 parties (risque accepté par la demande) | Test (à documenter) |
| T2 | Nom du port (`GetReplayableConfigurations` ou autre) | Dev |
| T3 | Rangement du filtre « reproductible » (module `src/ui/` neutre ou hook) | Dev |
| T4 | `ETAT_PARCOURS` passé sur la navigation ▶ → Ordre (garde de retour) | Dev / Test |
| T5 | Clé React stable des lignes (= clé de groupe) | Dev |
| T6 | Fixtures de `fakeServices` semant des parties des 4 modes ; `summarize` rend bien les joueurs dans l'ordre du journal pour les 4 modes | Test |

## Réponses (arrêt Archi → Dev, 2026-10-16)

| # | Résolution | Par |
|---|---|---|
| U1 | Section « Rejouer », puis « Ou un autre jeu » ; « 4 fois » ; `aria-label` de ▶ : « Rejouer X01 501 avec Kevin, Julien et Sarah » (≥ 2 joueurs), « Lancer Entraînement 10 sorties avec Kevin » (solo) | Utilisateur |
| U2 | « N fois » **masqué à 1** : affiché dès 2 | Utilisateur |
| U3 | Date relative courte, **sans heure** : « aujourd'hui », « hier », puis le jour (« mardi ») jusqu'à 6 jours, puis « 3 oct. » (avec l'année si elle diffère) ; nouvelle fonction dans `labels.ts`, heure courante par `services.clock` | Utilisateur |
| U4 | Vocabulaire de l'étape 2. Titres : « X01 · 501 », « Cricket · Standard » / « Cricket · Cut-throat », « Tour du monde », « Entraînement ». Résumé X01 : `libelleFormat` (manches, sets s'il y en a), « sortie libre » / « sortie sur un double », « entrée sur un double » **seulement si activée** ; Cricket : « 7 cibles » ; Tour du monde : « 20 → 1, puis la bulle » ; entraînement : « 10 sorties » ; puis date, puis « N fois » | Utilisateur |
| U5 | Phrase d'aide de la planche **retirée** | Utilisateur |
| U6 | Pastilles à initiales, retour à la ligne si la place manque à 360 px, pseudo complet dans l'`aria-label` seul ; pendant le chargement : rien de la section Rejouer, rangée des 4 jeux visible, tuiles 2 × 2 seulement si l'historique est **confirmé vide** ; échec du lancement solo : message d'erreur existant de « Commencer », sous la section | Utilisateur |
| T1 | Documenté comme risque accepté (demande) ; Test le note | Orchestrator |
| T2, T3, T5 | Laissés au Dev (choix techniques), à justifier dans `02-dev-notes.md` | Orchestrator |
| T4, T6 | À couvrir par Dev (tests) puis vérifier par Test | Orchestrator |

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
