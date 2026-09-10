# Lot `tour-du-monde-cloture-volee` — orchestration

## Objectif

Corriger `src/ui/hooks/useTourDuMonde.ts:98` : la volée du Tour du monde n'est aujourd'hui
enregistrée qu'à la 3ᵉ fléchette (`if (suite.length >= 3)`), alors que le domaine
(`src/core/domain/games/tour-du-monde/rules.ts:112-138`, `applyVisit`) tronque déjà la volée
sur la fléchette qui boucle le tour — exactement comme le X01 (`PreviewVisit`) et le Cricket
(`PreviewCricketVisit`) le font pour le bust/la sortie et la victoire anticipée. Sans port de
prévisualisation côté Tour du monde, un joueur qui boucle à la 1ʳᵉ ou 2ᵉ fléchette doit taper
1 à 2 fléchettes fantômes avant que la partie n'avance.

Trois effets à corriger ensemble (un seul et même défaut, vu à trois endroits) :

1. **La volée doit se clore dès la fléchette qui boucle**, pas seulement à la 3ᵉ — même
   mécanique que `PreviewVisit`/`PreviewCricketVisit` : un port de prévisualisation synchrone
   et pur, consulté à chaque fléchette saisie.
2. **Le compteur de fléchettes affiché est faux pendant ce délai**
   (`src/ui/ecrans/games/tour-du-monde/TourDuMondeEcran.tsx:149`,
   `joueur.dartsThrown + (actif ? partie.dartsEnCours.length : 0)`) : il ajoute toutes les
   fléchettes saisies, y compris celles qui n'auraient jamais dû être jouées après le
   bouclage. C'est le chiffre qui sert au départage du mode — il doit être exact.
3. **Le pavé (`PaveCibles`) doit se désactiver au bon moment**, conséquence naturelle du point
   1 une fois le port de prévisualisation branché (même gate `occupe` qu'au X01/Cricket).

**Référence directe à suivre** : `src/core/application/ports/driving/PreviewCricketVisit.ts`
+ `src/core/application/use-cases/PreviewCricketVisitUseCase.ts` + leur consommation dans
`src/ui/hooks/useCricket.ts` (`apercu`, `affiche`, et le test de complétude avant
`enregistrer`). C'est le mode le plus proche : ni bust ni sortie, une volée de 3 fléchettes
sauf celle qui conclut — la même charpente doit s'appliquer au Tour du monde, à ceci près que
la clôture anticipée n'est pas liée à `state.finished` (fin de partie) mais à ce que **ce
joueur précis** vienne de boucler son propre tour (`targetIndexAfter >= config.targets.length`
sur la dernière entrée de `history` produite par l'aperçu) — la partie, elle, ne se termine
que quand tout le tour de table a joué (`CLAUDE.md`, § Tour du monde, « on finit le tour de
table »). Ne pas confondre les deux.

**Non-régression explicite à couvrir en test** : le cas déjà testé où le bouclage tombe pile
sur la 3ᵉ fléchette (`tests/ui/tourDuMonde.test.tsx:87-116`) doit continuer de passer sans
modification de ses assertions.

**Hors périmètre :** les trois autres modes (X01, Cricket, entraînement) n'ont aucun défaut
similaire connu — ne pas toucher à leurs hooks ni à leurs ports. Pas de changement de règle du
Tour du monde lui-même (parcours, départage, dernier tour de table) : c'est un défaut
d'implémentation UI/application, pas une révision de `CLAUDE.md`.

**Source :** `docs/audits/2026-09-10.md`, lot candidat 1 (« Le Tour du monde ferme sa volée au
bon moment »), sévérité moyenne, coût de l'inaction classé le plus élevé de l'audit.

## Statut

| Phase | Statut | Fichier |
|---|---|---|
| Architecture | Faite | `01-architecture.md` |
| Dev | Faite | `02-dev-notes.md` |
| Test | Faite | `03-plan-de-test.md` |
| Revue | Faite | `04-revue.md` |

Valeurs : *Pas commencée* · *En cours* · *Bloquée* · *Faite*.
Une phase ne passe à *Faite* qu'après le gate check.

## Blocages ouverts

| Question | Origine | Qui doit la clore | État |
|---|---|---|---|
| — | — | — | — |

## Journal des décisions

| Date | Décision | Raison |
|---|---|---|
| 2026-09-10 | Lot choisi parmi les 7 candidats de l'audit 2026-09-10 : « Le Tour du monde ferme sa volée au bon moment » (candidat 1, coût de l'inaction le plus élevé). | Décision de l'utilisateur, via AskUserQuestion en tête d'orchestration. |
| 2026-09-10 | Architecture (`archi`, opus/max, défaut) : nouveau port `PreviewTourDuMondeVisit`, miroir de `PreviewCricketVisit`, mais `complete` dérivé de `targetIndexAfter` (la volée du joueur) et non de `state.finished` (la fin du tour de table) — différence vérifiée explicitement, à ne pas effacer par copier-coller. | Le Cricket clôt sa volée en même temps que la partie ; le Tour du monde « finit le tour de table », les deux événements sont disjoints. |
| 2026-09-10 | Les 11 questions ouvertes d'Architecture sont résolues au gate check plutôt que reportées : les 7 côté Test deviennent des cas obligatoires (ou optionnels, explicitement marqués) dans `03-plan-de-test.md` ; les 4 côté Dev sont tranchées (dont une extension mineure du périmètre : corriger un commentaire devenu faux dans `useCricket.ts`, seul octroi hors du fichier Tour du monde). | Toutes évidentes au vu du rapport `archi` — aucune ne justifiait de solliciter l'utilisateur. |
| 2026-09-10 | Arrêt n°1 (Archi → Dev) validé par l'utilisateur : « Go ». Phase Dev lancée avec `model: opus` (au lieu du sonnet/medium par défaut). | Le lot touche une règle de jeu gravée dans `CLAUDE.md` (§ Règles du Tour du monde, clôture de volée) — critère de la section « Monter en gamme » de la skill, même si `core/domain/` lui-même n'est pas modifié. |
| 2026-09-10 | Dev livré sans blocage : lint/typecheck/318 tests verts, un seul écart classé Ajustement (garde `!affiche` dans `TourDuMondeEcran.tsx`, pour satisfaire TypeScript sans reproduire la scorie `?? state` du Cricket). Gate check → Dev Faite, phase Test lancée avec `model: opus` (même critère que Dev : règle de jeu `CLAUDE.md`). | Écart mineur et déjà justifié par `dev` — aucune remise en cause de la conception, boucle 2 non déclenchée. |
| 2026-09-10 | Test a livré 11 cas sans bug trouvé, avec deux vérifications par mutation prouvant que les cas décisifs ne sont pas verts à vide. Un point signalé (pas un bug) : couverture d'annulation + rejeu à froid après clôture anticipée manquante. Repris au gate check via `SendMessage` sur le même sous-agent plutôt qu'un nouvel appel — 2 cas de plus livrés, aucune ambiguïté trouvée (le bouton Annuler suit une branche déjà spécifiée au lot 3). 330 tests verts au total. Gate check → Test Faite, aucun retour Dev/Archi déclenché. | La fiche `test` qualifie explicitement l'annulation/rejeu de « classe de bug la plus coûteuse du projet » — jugé suffisamment important pour compléter avant de considérer la phase close, sans pour autant redémarrer tout le sous-agent. |
| 2026-09-10 | Revue : **GO**, sans rouvrir Dev/Test/Archi. Revue a rejoué (pas seulement cru) les deux mutations de Test, et découvert que l'enjeu réel était plus grave que documenté : un copier-coller de la formule du Cricket aurait fait perdre deux fléchettes au dernier tour de table (8 tests rouges, dont un pré-existant), pas seulement laissé survivre le bug d'origine. Trois constats mineurs, tous « Renvoi : Aucun » : une erreur de décompte dans `03-plan-de-test.md` (corrigée dans `04-revue.md`), et surtout la découverte que le working tree porte une restructuration documentaire de `CLAUDE.md`/`docs/PROJECT_PLAN.md`/`docs/CHARTE_GRAPHIQUE.md` **antérieure à ce lot et sans rapport avec lui** (déjà visible dans le statut git au tout début de la session) — la cible du « à graver » a donc bougé, et le commit du lot doit rester strictly scopé aux 8 fichiers du lot. | Vérifié directement (`git status`, `git diff --stat`) plutôt que pris sur la foi du rapport `review` — la mémoire « un commit par lot, jamais deux mélangés » l'exige. |
| 2026-09-10 | Gravage : une ligne ajoutée à la liste `ports/driving/` de `CLAUDE.md` § Arborescence (`PreviewTourDuMondeVisit`), et une sous-section ajoutée en fin de `docs/PROJECT_PLAN.md` § 6 (« Décisions du lot « tour-du-monde-cloture-volee » »). **Ensuite découvert** : `.claude/CONVENTIONS.md` (horodaté pendant l'exécution de la phase Test) mentionne déjà `PreviewTourDuMondeVisit`, et une session pair `flechettes-c0` était active sur la machine à ce moment — signe probable d'une **session concurrente en train de restructurer ces mêmes fichiers de documentation en parallèle** de cette orchestration. Vérifié via `git diff` que mon ajout à `docs/PROJECT_PLAN.md` n'est **pas isolable** en un hunk séparé (noyé dans le même bloc d'insertion que la restructuration préexistante, 782 lignes) — celui de `CLAUDE.md`, lui, l'est. **Décision : ni l'un ni l'autre n'entre dans le commit de ce lot.** Les deux fichiers restent modifiés dans l'arbre de travail, non commités, à fusionner par l'utilisateur avec le travail de restructuration en cours. Le commit du lot reste scopé aux 8 fichiers de code/tests. | Risque de collision avec une édition concurrente active sur les mêmes fichiers ; le contenu documentaire n'est ni destructif ni urgent à committer immédiatement — la sécurité prime sur l'exhaustivité du gravage. |
| 2026-09-10 | **Commit `ba12824`** — exactement les 8 fichiers du lot stagés (`git add` explicite par chemin, jamais `-A`), rien d'autre. `CLAUDE.md`, `docs/PROJECT_PLAN.md`, `docs/CHARTE_GRAPHIQUE.md` et les chemins non suivis (`.claude/`, `README.md`, `docs/audits/`, `docs/captures/`, `docs/lots/`) laissés intacts dans l'arbre de travail. Lot considéré **terminé**. | Accord explicite de l'utilisateur au second arrêt (« Oui, committer maintenant »), après l'avoir informé de la situation de restructuration concurrente. |

## Historique des corrections

| Tour | Boucle | De → vers | Motif | Résultat |
|---|---|---|---|---|
| — | — | — | — | — |

Plafond global : 5 tours tous types confondus, puis escalade.
