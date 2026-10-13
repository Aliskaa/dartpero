# Lot `accueil-parties-recentes` — orchestration

## Objectif

L'Accueil montre les parties récentes en cartes, façon DartsOn : « Aujourd'hui », puis « Cette
semaine » (les 6 jours précédents). La partie en cours est la première carte, même si elle date
de plus de 7 jours, et c'est la seule à porter un bouton « Reprendre ». Chaque carte a le nom en
titre, le jeu et l'heure dessous, les avatars et un statut selon le mode. Un tap ouvre le résumé
ou reprend la partie. « Abandonnée » vaut à l'Accueil et dans l'onglet Parties. Le X01 gagne un
champ dérivé, « manches jouées ». « Nouvelle partie » est fixé en bas. Détail et critères :
[`request.md`](request.md), qui fait foi.

Source amont : étude `docs/prospective/2026-10-11-NEW-nouvelle-partie-en-etapes.md`, lot n° 3 du
découpage.

**Hors périmètre :** la barre du bas, la suppression depuis l'Accueil, « rejouer la même »,
`/historique/:id` et `/joueurs/:id`, tout format persisté.

## Niveau

`high`, choisi par l'utilisateur à l'intake. `light` aurait été permis : la demande n'annonce
aucune surface gravée.

high

## Branche

`lot/accueil-parties-recentes` — créée depuis `main` (`cedc4a4`) avant l'Architecture, fusionnée
en `--ff-only` après accord.

## Provenance

Intake validé : `docs/request/accueil-parties-recentes.md`, statut `Validé`, 2026-10-13, niveau
`high` identique, commande exacte, toutes les sections, « Questions bloquantes : Aucune ».
Snapshot copié octet pour octet vers `request.md` le 2026-10-13 (`Get-FileHash` identique).

## Architecture — chaîne

| Tentative | Agent | Résultat | Raison |
|---|---|---|---|
| 1 | `archi-scout` | PASS | Rapport complet, sections exigées présentes |
| 2 | `archi-designer` | non lancé | Scout en PASS |
| 3 | `archi-authority` | non lancé | Scout en PASS |

Agent retenu : scout

## Statut

| Phase | Statut | Sous-agent | Fichier |
|---|---|---|---|
| Architecture | Faite | chaîne scout → designer → authority | `01-architecture.md` |
| Dev | Faite | `dev` | `02-dev-notes.md` |
| Test | Faite | `test` | `03-plan-de-test.md` |
| Sécurité | Faite | `sec` | `04-revue-securite.md` |
| Revue | Faite | `review` | `05-revue.md` |
| Échanges | Faite | Orchestrator | `06-echanges.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite* · *Hors niveau* (`light` :
Sécurité et Revue). Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| — | — | — | — |

## Journal des décisions

> Inclure le modèle et l'effort réellement lancés pour chaque phase.

| Date | Décision | Raison |
|---|---|---|
| 2026-10-13 | Index `.ai/architecture-context.md` jugé à jour : aucune source plus récente (`git log -1 --format=%ct`, toutes au commit `cedc4a4`), aucune modifiée dans l'arbre | Prérequis |
| 2026-10-13 | Chaîne d'architecture démarrée au **scout** | L'intake n'annonce aucune surface gravée (rien de persisté, pas de domaine) |
| 2026-10-13 | `archi-scout` (sonnet / low, frontmatter) : **PASS** au 1er essai ; aucune surface gravée confirmée. Affirmations clés vérifiées dans le code (`milestones` / `LegWon`, `PROFONDEUR = 20`, usages d'`ApercuPartie`) | Chaîne d'architecture |
| 2026-10-13 | Gate Architecture : Q3 → relecture (intake) ; Q5 → Dev (délégué par l'architecture). Q1, Q2, Q4, Q6 tranchées par l'utilisateur : 30 au plus ; Historique en carte commune ; pas de bascule à minuit ; on garde les 20 de `GetOngoingMatch` | Réponses utilisateur du 2026-10-13 (`01-architecture.md` § Résolutions) |
| 2026-10-13 | Gate Architecture passé ; **arrêt obligatoire avant Dev** | Séquence, étape 2 |
| 2026-10-13 | Dev lancé sur confirmation de l'utilisateur (« oui, lance la phase Dev ») : `dev` sonnet / medium (frontmatter) | Pas de surface gravée : pas de montée en gamme |
| 2026-10-13 | Dev rendu ; contrôles relancés par l'Orchestrator : lint 245, typecheck 0, 744 / 744 (+55), build vert | `02-dev-notes.md` |
| 2026-10-13 | Gate Dev : D1 → gravure en fin de lot (Orchestrator) ; D2 laissée (comportement identique, la Revue peut demander l'alignement) ; Q3, Q5 → relecture à l'écran ; Q4 notée | Toutes les questions ont une résolution écrite |
| 2026-10-13 | Test lancé : `test` sonnet / high (frontmatter). Consigne particulière : juger les **assertions retirées** des 5 tests existants adaptés | Un test affaibli ne se voit pas dans un compteur vert |
| 2026-10-13 | Test rendu : aucun bug bloquant ; C1 (moyenne), C2 à C9. Contre-épreuves de l'Orchestrator : M1, M2, M4, M7 rouges ; S1, S2 survivent (C5 confirmé) ; C1 confirmé par lecture | `03-plan-de-test.md` |
| 2026-10-13 | Gate Test, réponses de l'utilisateur : renforcer C1, C3, C4, C5, C8 maintenant ; corriger C2 ; C6 garder et documenter ; **C7 : vainqueur ajouté au X01 terminé** (« Julien gagne · 5 manches »), amendement de la demande, `request.md` inchangé ; C9 → Revue | Questions closes par écrit (`03-plan-de-test.md` § Résolutions) |
| 2026-10-13 | **Tour 1** (boucle 1, Test → Dev) : `dev` sonnet / medium. Ensuite, Test rejoué | Bug C2, amendement C7, tests C1 à C8 |
| 2026-10-13 | Tour 1 rendu ; vérifié par l'Orchestrator : lint, typecheck, 761 / 761, build ; M1-M7 rouges, S1 et S2 rouges. Rejeu de Test lancé (`test` sonnet / high) | `02-dev-notes.md` § Correction — tour 1 |
| 2026-10-13 | Rejeu de Test : C1 à C8 levés ; **N1, bug d'implémentation** (focus rogné, vérifié dans le code) → boucle 1, **tour 2**, automatique. N2 à N5 joints à la passe (courts, mêmes fichiers) ; N6 corrigé par l'Orchestrator (`02-dev-notes.md`) ; N7 facultatif ; rognage des libellés → relecture | `03-plan-de-test.md` § Rejeu après tour 1 |
| 2026-10-13 | Tour 2 rendu (`dev` sonnet / medium) ; vérifié par l'Orchestrator : lint, typecheck, 763 / 763, build ; mutation N3 : 1 échec. Rejeu de Test lancé (`test` sonnet / high) | `02-dev-notes.md` § Correction — tour 2 |
| 2026-10-13 | Rejeu de Test : N1 à N7 levés, **Test passe à Sécurité**. Gate Test : C1 à C8 et N1 à N7 levés ; C6, C7 tranchées ; C9 et D2 → Revue ; rognage de la barre, anneau sur l'onglet actif, bouton contigu → relecture à l'écran (utilisateur). Toutes ont une résolution écrite | `03-plan-de-test.md` § Rejeu après tour 2 |
| 2026-10-13 | Sécurité lancée : `sec` sonnet / high (frontmatter) | Pas de surface gravée |
| 2026-10-13 | Sécurité rendue : aucun constat bloquant ; S1, information antérieure au lot (constat #11). Vérifications exécutées par l'Orchestrator : `npm audit --omit=dev` 0, `package*.json`, domaine, infrastructure et `backupSchema` inchangés, aucun rendu HTML brut ni réseau. Gate Sécurité : aucune question ouverte | `04-revue-securite.md` |
| 2026-10-13 | Revue lancée : `review` opus / max (frontmatter) | Séquence `high` |
| 2026-10-13 | Revue rendue : **NO-GO**, sans bloquant ni majeur ; R1 à R5 (mineurs) renvoyés vers Dev, R6 et R10 facultatifs. Compléments de l'Orchestrator : diff d'`index.css` conforme, `libelleRegles` hérité d'`ApercuPartie` ; skills tiers hors du lot repérés dans `git status` | `05-revue.md` |
| 2026-10-13 | **Tour 3** (boucle 5, Revue → Dev, automatique) : `dev` sonnet / medium. R3 renomme `statutDePartie` en `matchStatus` : étiquette seulement, pas de boucle Archi (avis de la Revue) | R1 à R5, R6, R10 |
| 2026-10-13 | Tour 3 rendu. Vérifié : `biome check src tests` 0, typecheck 0, 765 / 765, build. ⚠️ `npm run lint` rouge (193 erreurs, toutes dans `.claude/skills/impeccable/`, hors du lot) ; ⚠️ **incident** : le `lint:fix` global du Dev a reformaté 7 scripts du skill `impeccable` (13 h 59), non restaurables par git. Deux décisions demandées à l'utilisateur. Rejeu de Test lancé en parallèle (`test` sonnet / high) | `02-dev-notes.md` § Correction — tour 3 |
| 2026-10-13 | Décisions de l'utilisateur : (1) il **réinstalle lui-même** le skill `impeccable` pour récupérer les 7 scripts reformatés ; (2) **`.claude/skills` est exclu de Biome dans ce lot**. L'Orchestrator applique la ligne `"!**/.claude/skills"` dans `biome.json` (configuration décidée par l'utilisateur, aucune conception) ; `npm run lint` vert sur 246 fichiers | Réponses utilisateur |
| 2026-10-13 | Rejeu de Test : **passe**. R3, R5 et R10 jugés sains ; texte des règles vérifié identique par l'Orchestrator (`git show`) ; contre-épreuves M4, S1, N3 et R5 rouges ; **T1 confirmé** (mutation survivante). L'utilisateur choisit **T1 → dette pour le prochain audit** (PLAN § 0), pour garder le dernier tour de marge. T2 : antérieur au lot | `03-plan-de-test.md` § Rejeu après tour 3 |
| 2026-10-13 | Rejeu de Sécurité lancé (`sec` sonnet / high) : delta du tour 3, plus `biome.json` | Boucle 5 : rejouer Test, Sécurité et Revue |
| 2026-10-13 | Rejeu de Sécurité : **RAS**. Une affirmation factuelle de l'agent corrigée par l'Orchestrator (des `.js` existent bien sous `.claude/skills`), sans effet sur la conclusion. Rejeu de la Revue lancé (`review` opus / max) | `04-revue-securite.md` § Rejeu après tour 3 |
| 2026-10-13 | Rejeu de la Revue : **GO** (3 / 5 tours), sous condition V1 : vérifier l'arbre final. Vérifié par l'Orchestrator : lint vert (246), typecheck 0, 765 / 765, build ; `biome.json` exclut aussi `"!**/.agents"` (ligne ajoutée hors de la session de l'Orchestrator, gardée) ; `.agents/skills` vide ; `impeccable` réinstallé dans `.claude/skills/` (16 h 44). Liste finale de documentation dans `05-revue.md` | `05-revue.md` § Rejeu après tour 3 |
| 2026-10-13 | Échanges écrits (`06-echanges.md`). **Arrêt pour le go final** (étape 8) : question `CLAUDE.md` § DS posée avec le go ; gravure de la doc et `/refresh-architecture` après le go, avant le commit | Séquence |
| 2026-10-13 | **Go final de l'utilisateur** ; **`CLAUDE.md` § DS : oui**, puce « Accueil en parties récentes » portant sur la règle « Abandonnée », pas sur la mise en page. La relecture à l'écran reste à faire par l'utilisateur (PLAN § 0) | Réponses utilisateur |
| 2026-10-13 | Doc gravée par l'Orchestrator selon la liste finale de `05-revue.md` : `CLAUDE.md` § DS ; `CONVENTIONS` § 8, 9, 10, 11, 13, 14 ; règles `glossary`, `frontend-react`, `biome` ; charte (accent, `CartePartie`, barre, focus) ; PLAN § 0, 2, 3 (dont N2 : barre à quatre entrées), 4, 6, :432, :1491 ; README (765, légende, puce) | Liste finale de la Revue |
| 2026-10-13 | `/refresh-architecture` : brief sur disque (inchangé depuis le 2026-10-01) passé à `architecture-context` (sonnet / high) ; index à **145 lignes, 13 266 octets** (mesuré par l'Orchestrator) ; 2 constats nouveaux (#14 garde `*UseCase`, #15 T1), moitié `ApercuPartie.tsx:108` de l'ancien constat retirée (fichier supprimé) | Liste finale, point 9 |
| 2026-10-13 | Contrôles avant commit : lint 246 fichiers sans correction, typecheck 0, 765 / 765, build vert (taille inchangée : aucune règle CSS née des `.md`) | Étape 9 |

## Historique des corrections

> Boucles 1, 2, 5, 6 (Test / Sécurité / Revue → Dev, ou Revue → Test / Sécurité). Les boucles
> 3, 4, 7 (→ Archi) se journalisent en ajoutant une Révision à `01-architecture.md`.

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| 1 | 1 | Test → Dev | C2 (décalage du bouton fixé), C7 (vainqueur au X01 terminé, demandé par l'utilisateur), tests C1, C3, C4, C5, C8, commentaire de port C6 | Fait : 761 / 761 ; S1, S2 tombent ; Test rejoué |
| 2 | 1 | Test → Dev | N1 : anneau de focus des onglets rogné par l'`overflow-hidden` introduit par C2 ; joints : N2, N3, N4 (tests), N5 (commentaire) | Fait : 763 / 763 ; mutation N3 rouge ; Test rejoué |
| 3 | 5 | Revue → Dev | R1 (français de `libelleRegles` dans `labels.ts`), R2 (code mort), R3 (`matchStatus` en anglais), R4 (clés de `ActionsFinDePartie`), R5 (hiérarchie des titres) ; facultatifs R6, R10 | Fait : 765 / 765 ; Test, Sécurité et Revue rejoués ; **GO** |

Plafond global : 5 tours tous types confondus, puis escalade. Jamais remis à zéro à la reprise.
