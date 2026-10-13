# Lot `charte-typo-mouvement` — plan de test

> Écrit par l'Orchestrator à partir du rapport du sous-agent `test` (sonnet / high, frontmatter).

## Passe 2 — GO (après boucle 1, tour 1)

Sans shell : relecture sur disque. Revérifié par l'Orchestrator : lint OK, typecheck OK, 815 verts
(805 + 10 de la garde), build OK, encodage UTF-8 sain.

| Point | Statut | Preuve (Test) |
|---|---|---|
| B1 | Corrigé | Charte l. 140-144 : variables du thème clair toutes présentes dans `index.css` (l. 200-206) ; plus de `--tapis-image` |
| E1 | Corrigé | `TableauHonneur.tsx:56` `border-vert-cible` ; charte l. 337, `PROJECT_PLAN` l. 1894, commentaire l. 39 alignés |
| E2 | Corrigé | `Cartouche.tsx:48` porte `trace-craie`, `ResumeEntrainementEcran.tsx:66` non ; 4 occurrences dans `src/ui` (3 lignes actives + `Cartouche`) ; charte l. 27-30 et journal concordants |
| G2 | Corrigé | `DEGRADE` attrape les six cas synthétiques, laisse passer les aplats ; aucun faux positif sur les classes du projet (`bg-laiton`, `bg-feutre`…) ; « bg-radiale » non attrapé ; seul faux positif plausible : le mot « gradient » dans un futur commentaire de `src/ui` (0 aujourd'hui) |
| D1 | Corrigé | Charte l. 22-26 cite `ListeOrdonnable` |
| D2 | Corrigé | `PROJECT_PLAN` l. 1876-1902 : « quatre » halos, seule `--duration-lent` consommée, « 805 → 815 (+10) » |
| C1 | Corrigé | `DispositionPartie.tsx:6` exact (accent posé sur titres et filet `.au-lancer`, restes en `craie-vive`) ; `MomentCelebratif.tsx:20` exact |
| Tokens dans la charte | Corrigé | l. 199-206 et 378-379, valeurs identiques à `index.css` l. 72-76 |

### Observations

| # | Constat | Suite |
|---|---|---|
| P2-1 | `02-dev-notes.md` et `01-architecture.md` décrivaient l'état de la passe 1 (E1, E2, G2, nombre de tests) | **Close (Orchestrator)** : encart « Révisé en boucle 1 » ajouté en tête de `02-dev-notes.md` ; `01-architecture.md` garde son texte (référence d'origine), l'encart de `02` signale les deux paragraphes périmés |
| P2-2 | `PROJECT_PLAN` l. 1888 : phrase coupée par un retour à la ligne | Sans action (cosmétique) |
| P2-3 | Au Cricket, glyphe de marque fermée et exposant du pavé teintés par l'accent | Sans action (marques, pas des scores) |

G1, G3, G4 : observations, sans action (décision de la passe 1).

### Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Relecture à l'écran (colonne « Manches », barre du bas police maximale, `Avatar` xs, `LigneCible`, badges, filet vert, tour du logo, enseigne en clair, tapis uni, bust, `pop-score`, `.entete-colonne` à 0.18em hors tableau X01) | Utilisateur, arrêt de fin de lot |

---

## Passe 1 — GO sous réserve, renvoi Dev

Sans shell : code relu sur disque, greps indépendants. Chiffres de l'Orchestrator : lint OK,
typecheck OK, 814 verts, build OK ; 0 `text-[…rem]`, 0 `shadow-[0_0_`, un seul `gradient`
(`index.css:507`). Greps de Test : 0 `text-[`, `bg-gradient`, `eclat`, `respirer`,
`tourner-lent` dans `src/ui` ; aucun test existant touché par les suppressions.

### Stratégie

Gardes de source et relecture de code. Ni domaine, ni use case, ni infrastructure ; `src/core` et
`CLAUDE.md` intacts. Aucun test Testing Library ne vise `MomentCelebratif`, `TableauHonneur`,
`trace-craie` ni les animations ; aucun attendu inventé. Le rendu, cœur du lot, est un angle mort.

### Couverture par critère

| # | Vérifié par | Protégé par un test ? |
|---|---|---|
| 1 | Garde (a) + grep ; `index.css` n'a qu'un `font-size` (`var(--text-etiquette)`) | Oui, partiel (G1) |
| 2 | Lecture du CSS | Non (grep seulement) |
| 3 | Garde (c) + grep | Halos oui ; emplacement de `trace-craie` non (G4) |
| 4 | Garde (b) + grep | Oui, faille Tailwind v4 (G2) |
| 5 | Relecture | Non — **B1 trouvé** |
| 6 | Résultats de l'Orchestrator ; bloc `@media` antérieur intact | — |

Les trois gardes peuvent échouer : (a) 72 fichiers pour un plancher à 40, chaînes synthétiques,
préfixes de variante ; (b) plancher sur `.chargement-balai`, `sansBloc` sûr par défaut, pas de
faux positif sur les commentaires (« dégradé »), `bg-[linear-gradient(…)]` attrapé ; (c) plancher
sur un souffle, détecteur testé sur ses deux versants, pas de faux positif sur `.grave` ni sur les
`drop-shadow` légitimes.

### Fidélité

Tapis uni, enseigne en laiton plein avec ombre de plaque, aucun halo, `trace-craie` conditionnel
sur les trois lignes, interlettrage ≤ 0,06 em là où il a été resserré (« Manches » à 0),
`Avatar` xs conforme à Q2. Mouvement : `--ease-sec` dans [0,1], aucun autre `cubic-bezier` ;
valeurs conformes ; `eclat`, `respirer`, `tourner-lent` absents ; filet `aria-hidden`, sans
dégradé ni halo, état final visible sous `prefers-reduced-motion` ; logo revenu à sa position
après 360°.

### Réponses aux questions de `02-dev-notes.md`

1. **`.entete-colonne` hors tableau X01** : fidèle à la maquette (`A-affiner.css` § 3) ; titres
   sur une ligne ; `StatTile` inutilisé. Ne rien changer ; à voir à l'écran.
2. **« 4.25rem / 3.25rem » dans la charte** : exact, mais à exprimer en tokens `text-score-*`
   (une seule source, le lot 5 les agrandira) — joint au renvoi.

### Bugs et observations

| # | Constat | Classement | Suite |
|---|---|---|---|
| B1 | Charte l. 139 : `--tapis-image` cité parmi les variables du thème clair, alors qu'il est supprimé | Bug d'implémentation (doc) | Renvoi Dev |
| E1 | `TableauHonneur` trace son filet en `accent-mode`, la demande dit « vert » | Écart à la demande | **Utilisateur : vert partout** → renvoi Dev |
| E2 | Souffle retiré de `Cartouche` (reste du joueur seul, qui lance toujours) | Écart possible à la demande | **Utilisateur : le garder** (le résumé d'entraînement reste sans) → renvoi Dev |
| G2 | Garde (b) ne voit pas `bg-linear-to-*`, `bg-radial`, `bg-conic` (Tailwind v4) | Problème de test | Joint au renvoi (une alternative dans la regex) |
| G1 | Garde (a) ne voit pas `text-[length:…]`, `calc()`, `pt`, `vw`, `fontSize` inline | Observation | Sans action (0 occurrence) |
| G3 | Garde (c) ne voit pas `shadow-[0px_0px_`, `inset`, `ring-`, `blur-`, `box-shadow` à flou en CSS | Observation | Sans action |
| G4 | Pas de test sur l'emplacement de `trace-craie` | Observation | Sans action (test fragile ; relecture) |
| M1 | `--duration-vif` / `-normal` sans consommateur ; transitions Tailwind et keyframes en durées littérales | Observation | Sans action ; formulation du journal corrigée (D2) |
| D1 | Charte : liste des ombres portées sans `ListeOrdonnable.tsx:164` | Observation | Joint au renvoi (une ligne) |
| D2 | `PROJECT_PLAN` : « quatre » vs « cinq » halos annoncés, pas de décompte de tests, « durées en tokens » surestimé | Observation | Joint au renvoi |
| C1 | Commentaires périmés : `MomentCelebratif.tsx:20`, `TableauHonneur.tsx:39`, `DispositionPartie.tsx:6` | Observation | Joint au renvoi |

### Angles morts (écran)

Colonne « Manches » (44 px, 0,75 rem) ; barre du bas avec police maximale ; `Avatar` xs, `LigneCible`,
badges, exposants du pavé ; filet vert (rendu et révélation) ; tour du logo ; enseigne en laiton
plein en clair ; bust, `pop-score`, tapis uni dans les deux thèmes.

### Questions ouvertes

| # | Question | Résolution |
|---|---|---|
| 1 | E1 : filet du résumé vert ou à la couleur du jeu ? | **Close (utilisateur)** : vert partout |
| 2 | E2 : souffle sous le grand chiffre de l'entraînement ? | **Close (utilisateur)** : gardé sur `Cartouche` ; le résumé d'entraînement reste sans |
| 3 | Durcir les gardes (G1, G3, G4) ? | **Close (Orchestrator)** : seul G2 (Tailwind v4, réaliste) est joint ; les autres restent des observations |
| 4 | Relecture à l'écran | Utilisateur, arrêt de fin de lot |
