# Lot `nouvelle-partie-en-etapes` — plan de test

> Écrit par l'Orchestrator à partir du rapport de `test` (opus, effort high). Le sous-agent
> n'avait pas de shell : **les commandes ont été lancées par l'Orchestrator** (section
> Résultats), ainsi que la contre-épreuve n° 2.

## Stratégie

| Niveau | Couvert ? | Pourquoi |
|---|---|---|
| Domaine | Rien à tester | Seul `x01/config.ts` change, en commentaire (prouvé par `git diff`, ci-dessous) |
| Use cases | Indirectement | Les tests d'écran relisent `getMatchHistory()` / `listAll()` ; aucun use case nouveau |
| Infrastructure | Non | Ni Dexie, ni schéma, ni `backupSchema` |
| UI (Testing Library) | **Cœur du lot** | `nouvellePartie.test.tsx` (25), `manches.test.tsx`, `ordre.test.ts`, `lot4`, `entrainement`, `cricket`, `tourDuMonde`, `parcours`, `resumeX01` |
| Architecture | Oui | `lazyRoutes` (plancher 9 → 8, exactement 8 `lazy()` dans `App.tsx`) ; `themeBoundary`, `hexagonalBoundary`, `reseauBoundary` inchangés |

**Angles morts jsdom (le lot touche au rendu)** : glisser au doigt, modalité réelle de
`<dialog>`, retour Android boîte ouverte (R3), débordements / troncatures / contraste / 48 px,
colonnes « MANCHES » et VOLÉE, bandeau « MANCHE N · SET N ». **Relecture à l'écran
obligatoire** (§ Plan de relecture).

## Cas de test — critère par critère

| # | Critère | Test | Peut échouer ? |
|---|---|---|---|
| 1 | X01 à 2, trois étapes | « démarre un X01 à deux… » (301 / 3 / DI, ordre `['Julien','Kevin']` au journal) | Oui |
| 2 | Entraînement solo, sans étape 3 | « se règle en solo… », « n'a pas d'étape 3 », `entrainement.test` | Oui ; réserve T2 |
| 3 | Tour du monde / Cricket à 3 | `it.each` (↑↑ sur Paul, ordre au journal) | Oui (au clavier ; pointeur : R1) |
| 4 | Ordre aléatoire | « masque poignées et rangs… » | Oui |
| 5 | Poignée clavier, nom, focus | « répond au clavier… » | Oui ; le focus est peut-être rendu par React lui-même (T7) |
| 6 | × hors base | « retire un joueur… » (`listAll()`) | Oui |
| 7 | Nouveau joueur, doublon | « crée un joueur depuis la boîte… » | Oui |
| 8 | Max 4 | « respecte le maximum de quatre… » | Oui ; max 1 à l'entraînement non testé (T6) |
| 9 | Sets | « fait arriver les sets… » (`setsToWin: 3`) | Oui |
| 10 | Aucun « leg » | `manches.test.tsx` (mutation `'Leg !'` faite par Dev) + grep statique | Oui |
| 11 | Double out décoché | « décoche le double out… » (`doubleOut: false` au journal) | Oui |
| 12 | Barre à 4 onglets, Réglages → Joueurs | `lot4` | Oui |
| 13 | Retour du téléphone | « remonte les étapes au retour du téléphone… » (`retourTelephone()` ×3), lien profond | Oui |
| 14 | Routes lazy, gardes | gardes d'architecture | Oui (exécutées, vertes) |

Gardes de redirection : slug inconnu, `/entrainement`, étape 3 à moins de 2 joueurs, **pas
pendant le chargement** — prouvé par la contre-épreuve n° 2.

Greps : aucun « leg » dans une chaîne affichée de `src/ui` (seulement identifiants,
commentaires, clé React `leg-…`, clé persistée `partie:legs`) ; aucune couleur en dur hors
exceptions ; aucun `rounded-*` ; cibles 48 px conformes dans le code ; D2 (panneau `hidden`) :
réglé par le preflight Tailwind v4 (`display: none !important`), à confirmer à l'écran.

## Résultats (lancés par l'Orchestrator)

```
npm test        → Test Files 43 passed (43) · Tests 489 passed (489)
npm run lint    → Checked 229 files in 112ms. No fixes applied.
npm run typecheck → tsc --noEmit (aucune erreur)
npm run build   → precache 47 entries (801.74 KiB), dist/sw.js
npm run smoke   → Contrôles statiques OK ; / et /confidentialite OK, aucune requête externe ;
                  aucun « REMPLIR » dans 36 fichiers
git diff -- src/core/domain/games/x01/config.ts → commentaires seulement (deux blocs de doc)
git diff --stat → 31 fichiers suivis modifiés (+998 / −1031), plus les fichiers nouveaux
```

**Contre-épreuve n° 2** (garde de chargement) : `if (partie.chargement) return <SpinnerLigne…/>`
retiré de `NouvellePartieEcran.tsx` → **5 tests sur 25 tombent** (cricket et tour du monde à
trois, poignée au clavier, ordre aléatoire, lien profond). Source remise en état (vérifiée).
**Contre-épreuve n° 1** (effet de focus) : non faite ; T7 reste informatif.

## Bugs et lacunes, classés

| # | Constat | Classement | Renvoi |
|---|---|---|---|
| B1 | Saut visuel probable au relâcher d'un glisser vers le bas : les lignes enjambées gardent `motion-safe:transition-transform` et partent de `±h` vers `none` après le réordonnancement. Correctif : la classe de transition seulement pendant le geste | Bug d'implémentation (présumé, par raisonnement) | Dev — boucle 1 |
| O1 | `partie.erreur` vit dans le hook parent : « Impossible de démarrer la partie. » persiste si l'on revient choisir un autre jeu | Bug d'implémentation, mineur | Dev — boucle 1 |
| O2 | `ApercuPartie` : `pluriel(…, 'set')` et `pluriel(…, 'manche')` en dur hors `labels.ts` | Bug d'implémentation, mineur | Dev — boucle 1 |
| T1 | La variante Cricket n'est jamais vérifiée au démarrage (`config.variant`) | Problème de test | Dev écrit le test (Test n'édite pas) |
| T2 | `/entrainement/ordre` : poser 2 joueurs dans `partie:joueurs` pour isoler la garde propre à l'entraînement | Problème de test | idem |
| T3 | Pas de barre du bas pendant les étapes : aucun test | Problème de test | idem |
| T4 | « Changer les règles » / « Changer l'exercice » des quatre résumés → étape 2 du bon mode : aucun test | Problème de test | idem |
| T5 | Mémoire des réglages : ni double out, ni double in, ni variante, ni ordre aléatoire, ni `entrainement:sorties` | Problème de test | idem |
| T6 | Max 1 de la sélection à l'entraînement non testé | Problème de test | idem |
| T7 | Le test de focus protège le comportement, pas forcément l'effet `useLayoutEffect` | Informatif | — |

## Plan de relecture à l'écran (pour l'utilisateur)

**Préparation** : `npm run build` puis `npm run preview`, Chrome DevTools en émulation :
**390 × 844 portrait sombre**, **portrait clair**, **844 × 390 paysage sombre**, **paysage
clair**, plus une passe à **360 px** pour la rangée d'avatars. Semer 5 profils (dont un pseudo
de 20 caractères) et une partie X01 terminée.

**A. Étape 1** — quatre cartes dans l'ordre X01, Cricket, Tour du monde, Entraînement ; liseré
de la bonne teinte dans les deux thèmes ; deux lignes sans troncature ; aucune carte mise en
avant ; pas de barre du bas ; pas de défilement horizontal en paysage. **Textes rédigés par Dev
à valider** :
- X01 : « Décompter 301, 501 ou 701 jusqu'à zéro pile. » / « En manches, éventuellement en
  sets ; double out au choix. »
- Cricket : « Fermer le 20 au 15 et la bulle, trois marques chacun. » / « Le surplus marque
  tant qu'un adversaire n'a pas fermé. » (rien sur le cut-throat)
- Tour du monde : « Du 20 au 1, puis la bulle : toucher le secteur suffit. » / « On finit le
  tour de table ; le moins de fléchettes gagne. » (simplifie « parmi ceux qui ont bouclé » et le
  match nul)
- Entraînement : « Seul : un reste tiré entre 41 et 170. » / « Trois fléchettes pour le sortir
  sur un double. »
- « Choisissez le jeu », « Cochez ceux qui jouent », « Étape précédente », « Aucun joueur pour
  l'instant : touchez + pour en ajouter. », aides des manches et des sets.

**B. Étape 2 (quatre modes)** — titre = jeu, retour 48 px, compteur `n/4` (`n/1` à
l'entraînement) ; rangée de 0, 1, 3, 4 joueurs : le × (débordant `-right-5 -top-5`) ne couvre
rien, à **360 px avec 4 joueurs** ; pseudo long tronqué ; + absent à plein. **Menu « + »**
fermé = vraiment invisible, sans espace vide (D2) ; ouvert = deux boutons pleine largeur.
**Boîte « Nouveau joueur »** : centrée, fond voilé lisible, focus sur le champ, **clavier
virtuel ouvert** (Android) sans rien masquer, alerte de doublon dans la boîte. Rails X01 sans
retour à la ligne ; ligne récapitulative longue (« 501 · premier à 2 sets · premier à 2 manches
par set · sortie libre · double in ») qui tient ou passe proprement à la ligne. « Continuer » à
2 joueurs et plus, « Commencer » sinon.

**C. Sélection** — titre « Joueurs existants » non tronqué à côté de « Terminé » ; « N
manches » ou rien ; coche visible dans les deux thèmes ; désactivés à plein ; base vide :
`EmptyState`.

**D. Étape 3** — rang, avatar, nom, poignée 48 px, « Kevin commence » ; sous « Ordre
aléatoire », ni rang ni poignée. **Pendant un glisser** : la ligne suit, bornée, ombre visible
**en clair**, les autres s'écartent. **Au relâcher (B1)** : première ligne vers la dernière
place, puis l'inverse — les lignes enjambées sautent-elles puis reglissent-elles ? Tap sans
mouvement : rien. Pas de défilement ni de menu contextuel pendant le geste.

**E. Match X01** — 2 joueurs, sets 3, DO et DI : bandeau « MANCHE 1 · SET 1 | 501 · PREMIER À
2 », retour à la ligne entre les morceaux, portrait et paysage ; en-tête « MANCHES » non rogné ;
BUST puis SORTIE dans la colonne VOLÉE de 60 px, « moy 100,0 » tient ; bâtons Manches et Sets
côte à côte ; « Manche ! » puis « MANCHE 2 » ; **4 joueurs en paysage** : « BULL » non rogné.

**F. Autres écrans** — résumé X01 (« Meilleure manche », « Manches ») ; Statistiques
(« Manches » Gagnées / Jouées, « Meilleure manche ») ; Accueil avec partie à sets en cours
(troncature de l'en-tête, « 0 set · 1 manche », plus de bouton d'entraînement) ; Réglages
(sous-titre, panneau Joueurs en tête, « Gérer les joueurs ») ; barre du bas à 4 onglets.

**G. Android réel (obligatoire)** — glisser au doigt à 3 et 4 joueurs, haut et bas, plus B1 ;
retour matériel 3 → 2 → 1 → Accueil, choix conservés, et sélection → étape 2 ; retour avec la
boîte ouverte (R3) ; retour avec le menu « + » ouvert ; retour depuis un match lancé (revient à
l'étape 3, comportement existant).

**H. iPhone (R2)** — `<dialog>` et clavier, glisser au doigt, pas de menu contextuel à l'appui
long sur la poignée.

## Questions ouvertes

| # | Question | Pour qui | Résolution |
|---|---|---|---|
| Q1 | B1 confirmé ou non à l'écran | Utilisateur | Corrigé préventivement par la boucle 1 (correctif sans risque) ; à revoir au point D |
| Q2 | Textes des cartes (Tour du monde simplifié, Cricket muet sur le cut-throat) | Utilisateur | Relecture, point A |
| Q3 | « set » en dur dans `ApercuPartie` | Revue | Traité en O2 (boucle 1) |
| Q4 | O1 corrigé dans ce lot ? | Orchestrator | Oui, boucle 1 |
| Q5 | Résultats réels des commandes et `git diff` de `config.ts` | Orchestrator | Fait (section Résultats) |

## Rejeu après correction n° 1 (boucle 1)

> Rapport de `test` (opus), relecture seule ; commandes lancées par l'Orchestrator sur l'état
> final : `npm test` **43 fichiers / 503 tests verts**, lint « Checked 229 files … No fixes
> applied », typecheck sans erreur, build OK (precache 47), smoke OK.

**Correctifs** — tous conformes :
- **B1** (`ListeOrdonnable.tsx:167`, transition seulement si `geste !== null && !tenue`) : au
  relâcher, `setGeste(null)` et le réordonnancement (`usePreference`, `setState` synchrone)
  tombent dans le même rendu, sans état intermédiaire.
- **O1** (`useNouvellePartie.ts:117-121`, effet sur `pathname`) : n'efface rien au mauvais
  moment — après un succès l'écran se démonte ; après un échec l'erreur reste sur l'étape où
  elle a eu lieu ; au montage, `null` sur `null`.
- **O2** (`libelleSetsGagnes`, `libelleManchesDuSet` dans `labels.ts:423-424`) : couvert par
  `manches.test.tsx:96`.

**Les 14 tests** (B1, T1, T2, T3 ×4 + témoin, T4 ×4, T5, T6) : fidèles, aucun vert à vide.
T2 : la garde propre à l'entraînement est une redondance défensive (la garde « moins de deux
joueurs » suffit déjà) ; le test protège le comportement contre une fuite de la sélection de
groupe — acceptable.

| # | Constat | Classement | Résolution |
|---|---|---|---|
| T8 | O1 sans test (recette sans mock fournie : supprimer un joueur sans invalider le cache, « Commencer » rejette, « Étape précédente » efface le message) | Problème de test, non bloquant | **Accepté comme dette** par l'Orchestrator : correctif de deux lignes relu et jugé conforme, aucun critère d'acceptation en jeu ; à noter au PLAN |
| T9 | Commentaire de T2 (l. 221-224) : prétend isoler la garde propre à l'entraînement | Problème de test, cosmétique | Accepté tel quel (dette mineure, même note) |
| I1 | `pointercancel` : retour sans animation ; la ligne tenue saute de moins d'une demi-ligne au relâcher (préexistant) | Informatif | Relecture point D |
| I2 | Une image où l'ancienne erreur reste visible ; course théorique retour + échec | Informatif | — |

| # | Question | Résolution |
|---|---|---|
| Q-R1 | Français en dur de `libelleRegles` ajouté par le lot ? | **Close** : `git diff -U0` de `ApercuPartie.tsx` ne montre que l'import, `libelleFormat` et les deux lignes set / manche — le reste est antérieur au lot |
| Q-R2 | T8 dans ce lot ou dette ? | **Close** : dette (voir T8) |
| Q-R3 | B1 et I1 à l'écran | Assignée à l'utilisateur, point D de la relecture |

Aucun nouveau bug d'implémentation.

## Rejeu après correction n° 2 (boucle 5, Revue → Dev)

> Rapport de `test` (opus), relecture seule. Mesures de l'Orchestrator sur l'état final :
> `npm test` 43 fichiers / **517 verts** ; lint, typecheck, build (precache 47), smoke OK.
> **Contre-épreuve (Orchestrator)** : `rangVise` remis à l'ancien seuil strict sur les milieux
> → **13 échecs** (5 dans `ordre.test.ts`, 8 dans `nouvellePartie.test.tsx`) ; source remise en
> état et vérifiée. Le compte correspond aux tests attendus (le test tap / ±31 px reste vert, à
> dessein : il garde l'effet inverse).

**(a) `rangVise` (seuil à mi-chemin, place la plus proche) : correct.** Borne réelle à hauteurs
égales (56 + 8 px) : marge d'un demi-pas des deux côtés, à 2, 3 et 4 lignes, dans les deux sens.
Hauteurs inégales : il faudrait un écart d'environ une demi-ligne pour casser une extrémité —
impossible par construction (`min-h-14`, poignée `size-12`, nom `truncate`). Aucun effet
inverse (tap : `vers = de` ; micro-geste : plus de 32 px exigés, strict). `decalage` cohérent
avec l'atterrissage.

**(b) Tests** : fidèles, aucun vert à vide ; les 9 tests de composant passent par le vrai
`ListeOrdonnable` (borne, `rangVise`, `decalage`, relâcher, `partie:joueurs`).

**(c) T8 et T9** : conformes (T8 peut échouer : `EtapeJoueurs.tsx:114` affiche `partie.erreur`).

**(d) R1 réécrit** (constat n° 2 de la Revue) : le glisser est désormais testé en jsdom
**jusqu'au geste**, sur mise en page simulée. *Prouvé* : logique pure à la borne ; composant de
la poignée à `partie:joueurs` à 2, 3, 4 joueurs vers les deux extrémités ; transformations =
atterrissage ; tap / ±31 px sans effet ; contre-épreuve 13 échecs. *Non prouvé (relecture D,
G, H)* : vraie mesure (zoom, défilement), vrais Pointer Events (capture, `touch-none`,
`pointercancel`, appui long iOS), rendu (ombre en clair, fluidité, B1) ; dépôt sur une place
intermédiaire couvert en logique pure seulement. Owner : l'utilisateur.

| # | Constat | Classement | Résolution |
|---|---|---|---|
| T10 | `tests/setup.ts:15-16` dit encore « le glisser au doigt ne se teste pas en jsdom » | Problème de test, commentaire cosmétique | D'abord laissé par l'Orchestrator ; **corrigé au tour 3 à la demande de l'utilisateur** (Revue v2 n° 10) |
| T11 | Titre de l'`it.each` (l. 447) : « n°%i » à partir de 0 | Problème de test, cosmétique | Idem (Revue v2 n° 11) |
| I3 | `02-dev-notes.md` § Limites et `01-architecture.md` R1 périmés | Informatif | Annotés par l'Orchestrator |
| I4 | `noms()` lit par la classe `.truncate` (casserait bruyamment) | Informatif | — |

Questions ouvertes : aucune.
