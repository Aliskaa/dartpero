# Lot `tour-du-monde-cloture-volee` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (modèle `opus`, défaut).

## Résumé

Le lot fait ce qu'il annonce, de la façon dont le projet fait déjà ce genre de chose. Deux
fichiers créés (`PreviewTourDuMondeVisit.ts` + son use case), 4 lignes de câblage dans
`container.ts`, un hook aligné sur `useCricket.ts`, un écran qui lit `affiche.players` au lieu
de recalculer. Aucune ligne de domaine touchée, aucun événement persisté renommé, aucune
classe Tailwind modifiée.

Le design d'Archi est livré **à la lettre**, y compris la formule `complete` et le commentaire
qui la grave. Le seul écart déclaré (`!affiche` dans la garde d'écran) est un vrai détail de
typage, correctement classé et justifié.

Les deux mutations revendiquées par `03-plan-de-test.md` ont été **rejouées indépendamment**
par Revue (fichier sauvegardé, muté, testé, restauré, `git status` inchangé) plutôt que
crues sur parole — résultat : leur portée était **sous-estimée**, pas gonflée (voir I1).

Contrôles rejoués par Revue : `npm test` → 32 fichiers / 330 tests verts · `npm run lint` →
198 fichiers, 0 erreur · `npm run typecheck` → 0 erreur · `npx vitest run tests/architecture`
→ 2 fichiers / 8 tests. Conformes aux chiffres annoncés dans `03-plan-de-test.md`.

## Constats

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| M1 | mineur | `03-plan-de-test.md` § Résultats affiche « +12 : 7 UI + 5 use-case » ; le compte réel est **6 + 6** (la phrase compte à tort la ligne de non-régression comme un cas ajouté). Les tableaux détaillés, eux, sont justes. **Corrigé dans ce document, § ci-dessous.** | Aucun |
| M2 | mineur | La cible du « à graver dans `CLAUDE.md` » a bougé : le working tree contient une restructuration documentaire **non liée à ce lot et déjà en cours avant son démarrage** (`CLAUDE.md` −916 lignes, `docs/PROJECT_PLAN.md` +890, `docs/CHARTE_GRAPHIQUE.md` remanié — tous trois déjà modifiés dans le statut git initial de la session, donc antérieurs à ce lot). Le bloc que Archi proposait pour `CLAUDE.md` relèverait maintenant de `docs/PROJECT_PLAN.md` § 6. Par ailleurs `.claude/CONVENTIONS.md` (fichier non suivi, horodaté du jour même) liste déjà `PreviewTourDuMondeVisit` dans ses ports de prévisualisation — donc une partie du gravage attendu existe déjà, écrite par ailleurs. **Traité au second arrêt utilisateur, voir `00-orchestration.md`.** | Aucun |
| M3 | mineur | Risque de commit mélangé : le working tree porte, en plus du lot, la restructuration ci-dessus **et** des fichiers non suivis sans rapport (`.claude/`, `README.md`, `docs/audits/`, `docs/captures/`). Un `git add -A` violerait la règle permanente de l'utilisateur (« un commit par lot, jamais deux mélangés »). Les 8 chemins du lot, et eux seuls, à stager : `src/core/application/ports/driving/PreviewTourDuMondeVisit.ts`, `src/core/application/use-cases/PreviewTourDuMondeVisitUseCase.ts`, `src/composition/container.ts`, `src/ui/hooks/useTourDuMonde.ts`, `src/ui/hooks/useCricket.ts`, `src/ui/ecrans/games/tour-du-monde/TourDuMondeEcran.tsx`, `tests/ui/tourDuMonde.test.tsx`, `tests/use-cases/tourDuMonde.test.ts`. | Aucun |

**Information, sans renvoi :**

- **I1 — la vérification par mutation tient, et elle tient mieux que documenté.** Mutation
  n°1 (formule du Cricket, `apres.finished || darts.length >= 3`) : **8 tests rouges**, pas
  seulement les cas neufs — dont un test **pré-existant** (« annonce le dernier tour quand
  quelqu'un boucle, puis conclut »). Mécanisme : après le bouclage de Kevin, la 1ʳᵉ fléchette
  de Julien porte `history.length` à 2 → `2 % 2 = 0` et `quelquUnABoucle` vrai →
  `apres.finished` devient vrai → la volée de Julien se serait close **à sa première
  fléchette**, la partie se serait terminée sur place. Le copier-coller du Cricket n'aurait
  donc pas seulement « ne rien corriger » : il aurait **volé deux fléchettes au dernier tour
  de table** — exactement ce que `CLAUDE.md` protège. La distinction gravée dans le use case
  porte une règle, ce n'est pas de la prudence rédactionnelle.
  Mutation n°2 (comportement pré-lot, `darts.length >= 3`) : 7 tests rouges (les 6 neufs UI +
  le cas décisif use case), et les 6 `it` pré-existants restent tous verts — confirme
  l'affirmation de l'audit (« aucun test ne peut l'attraper aujourd'hui »).
- **I2 — non-régression mécaniquement prouvée.** `git diff --numstat tests/ui/tourDuMonde.test.tsx`
  → `192 0`, deux hunks, tous deux en ajout pur. Les 6 `it` d'origine identiques au caractère
  près.
- **I3 — invariants transverses tous vérifiés, tous verts** : sens des dépendances (imports
  relatifs, `hexagonalBoundary` balaie réellement les fichiers neufs) ; aucun mode n'en
  importe un autre (`MODES` toujours à 2/4, pré-existant, candidat 5 de l'audit, non touché) ;
  aucune couleur en dur ni `rounded-*` (le diff de `TourDuMondeEcran.tsx` ne modifie aucune
  chaîne de classes) ; règle de jeu recopiée bien **supprimée**, pas déplacée
  (`grep ".apercu" src/` ne rend plus rien) ; aucune valeur persistée renommée — et la
  **forme** des événements change légitimement (`VisitRecorded` peut désormais porter 1 ou 2
  fléchettes), `backupSchema.ts` l'acceptait déjà (`1 to 3 darts`), testé dans les deux sens.
- **I4 — l'écart Dev (`!affiche`) est bien mineur.** Branche morte par construction, comme le
  `?? state` de `CricketEcran.tsx` qu'elle évite. Rien à faire.
- **I5 — un latent hérité, à ne pas imputer à ce lot plus tard.** `ajouterFlechette` appelle
  désormais le port de façon synchrone dans le gestionnaire de clic : si `dartsEnCours`
  atteignait 4 (uniquement possible après un `recordVisit` en échec laissant `occupe: false`),
  `applyVisit` lèverait une `DomainError`. `useCricket.ts` a exactement le même comportement
  depuis le lot 5c — pré-existant, symétrique, hors périmètre.
- **I6 — Q8 (`useCricket.ts`) correctement traité.** Diff de 4 lignes, strictement dans le
  JSDoc d'en-tête, zéro changement de comportement. Seul fichier touché hors du périmètre
  Tour du monde strict ; arbitrage tracé aux trois endroits utiles (Q8, tableau des écarts,
  journal). Pas compté comme une extension de périmètre qui méritait l'utilisateur.
- **I7 — aucune question ouverte sans arbitrage.** Les 11 résolutions d'Archi relisées une à
  une : Q1-Q7 et Q9-Q11 relèvent du périmètre déjà tranché ailleurs dans le projet, Q8 est de
  niveau commentaire. Le seul arrêt qui engageait la conception (Archi → Dev) porte un « Go »
  utilisateur explicite.

## Correction du décompte (M1)

Le compte exact de cas ajoutés par la phase Test, vérifié sur le diff réel :

- `tests/ui/tourDuMonde.test.tsx` : **6 cas ajoutés** (cas 2 à 7 de `03-plan-de-test.md`),
  0 suppression.
- `tests/use-cases/tourDuMonde.test.ts` : **6 cas** (nouveau fichier, cas 8 à 13).
- Total : 318 → **330 tests** (+12, soit 6 + 6 — pas « 7 + 5 » comme écrit par erreur dans
  `03-plan-de-test.md`).

## Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) | ✅ |
| Aucun mode de jeu n'en importe un autre | ✅ (pré-existant : `MODES` du garde-fou reste à 2/4, hors périmètre — candidat 5 de l'audit) |
| Aucune couleur en dur dans `src/ui`, aucun `rounded-*` | ✅ |
| Aucune règle de jeu réimplémentée dans l'UI | ✅ (l'ancien calcul recopié dans `apercu` est supprimé, pas déplacé) |
| Aucune valeur persistée renommée | ✅ |
| `CLAUDE.md` à jour des décisions durables du lot | ⚠️ **Pas encore** — voir M2. Traité au second arrêt utilisateur, pas un bloquant de Revue (le design lui-même n'est pas en cause). |

## Go / no-go

**Verdict : GO.**

**Justification :**
1. Le design d'Archi est livré sans dérive — la formule `complete` et son ⚠️ documenté sont
   dans le code, exactement où un copier-coller du Cricket aurait dû être évité.
2. Le plan de Test attaque la zone de risque, confirmé par mutation indépendante (I1) — et
   cette vérification a révélé que l'enjeu réel du lot était plus grave que documenté (un
   copier-coller naïf aurait volé des fléchettes au dernier tour de table, pas seulement
   laissé le bug survivre).
3. Aucune question ouverte sans acceptation ; l'unique arrêt qui engageait la conception porte
   un « Go » utilisateur explicite.
4. Les invariants invisibles au vert des tests sont tous vérifiés sur le diff réel.
5. Les trois constats (M1-M3) sont des actions Orchestrator (registre à corriger, gravage à
   replacer, périmètre de commit à respecter) — aucun ne rouvre Dev, Test ou Archi.

## Points non résolus après le lot

1. **Aucune relecture à l'écran** — jugée raisonnable pour ce lot précis par Revue : le diff
   ne touche aucune classe Tailwind, aucun token, aucune structure de balisage ; seul le
   **moment** des transitions change, et il est asserté par rôle/nom. Résidu à nommer : trois
   signaux visuels (drapeau + `animate-pop-score`, perte de `.au-lancer`, bandeau « Bouclé ! »
   de `MomentCelebratif`) qui atterrissaient auparavant sur jusqu'à 3 taps distincts se
   produisent désormais sur **le même tap** — probablement plus cohérent, mais non vérifié à
   l'écran. C'est le seul endroit où une capture 390 × 844 apprendrait quelque chose.
2. **L'annonce vocale après clôture anticipée** n'est vérifiée par rien (chemin de code
   inchangé, seulement atteint plus tôt) — l'audit citait pourtant ce symptôme explicitement.
3. **La micro-fenêtre tap → re-rendu du pavé** reste ouverte, identique au X01 et au Cricket.
4. **`MODES` de `hexagonalBoundary.test.ts` couvre 2 modes sur 4** — candidat 5 de l'audit,
   correctement laissé de côté par ce lot.
5. **Le gravage documentaire (M2)** reste à faire, et pas nécessairement dans `CLAUDE.md` tel
   qu'imaginé par `01-architecture.md` — la restructuration documentaire en cours (non liée à
   ce lot) a changé la cible. À trancher avec l'utilisateur avant de proposer le commit.
6. **CRLF** sur les fichiers suivis du lot (avertissement Git pendant la revue) — candidat 4
   de l'audit, toujours ouvert, sans effet sur ce commit.
