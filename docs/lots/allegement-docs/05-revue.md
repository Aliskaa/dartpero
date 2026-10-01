# Lot `allegement-docs` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (opus / max), 2026-10-01.
> Tout lu sur disque ; référence `main` = `a00e9a8`.

## Résumé

23 fichiers `.md` modifiés + `docs/DEPLOIEMENT.md` créé + dossier du lot ; aucun fichier hors
Markdown. `CLAUDE.md` **530 l. / 34 092 o. → 338 l. / 20 315 o.** : 15 titres `##` et 15
séparateurs conservés, les 8 blocs intacts identiques octet pour octet (script indépendant de la
Revue). Contenu déplacé vers `docs/DEPLOIEMENT.md` (mot pour mot, commande corrigée d'après
`package.json:19`), `CONVENTIONS` § 11 / § 12 / § 14 (arbre mot pour mot, décomptes 20 / 9 / 6 /
4 / 4 exacts contre `src/`), charte l. 150, PLAN § 0 / § 4 / § 6. `.ai` **519 l. / 42 270 o. →
146 l. / 12 279 o.**, plus aucune règle de jeu énoncée.

Contrôles indépendants de la Revue : chaque ligne non vide retirée de `CLAUDE.md` retrouvée mot
pour mot ou déjà présente sous une autre forme (doublons ouverts à la ligne) — seule perte réelle,
les exemples Biome / TS 7 (constat 8) ; 33 liens relatifs, 0 cassé ; lint (200 fichiers),
typecheck, **339 tests** verts.

**Design livré (P1-P6)** : oui. P1 confirmé par les dates de modification (destinations 07:56,
`CLAUDE.md` 08:00, `rules/` puis briefs 08:00-08:01). **Test** couvre les trois zones de risque
(non-perte, renvois, index), angles morts honnêtes ; seul trou, pas de rejeu après le relèvement
du plafond — couvert par la Revue (constat 1). **Sec** a parcouru le diff réel, après le
relèvement du plafond. **`.ai` à jour** : toutes les sources du critère de péremption lui sont
antérieures ; les fichiers modifiés après (brief, `refresh-architecture`, `.ai/README.md`, PLAN
l. 1458) ne le rendent pas faux — toutes les lignes qu'il cite ont été rouvertes et sont exactes.
Le critère « modifié dans l'arbre de travail » le déclare périmé à la lettre avant commit : effet
de bord attendu, disparu une fois commités ensemble.

## Constats

| # | Sévérité | Constat | Renvoi vers | Suite |
|---|---|---|---|---|
| 1 | mineur | PLAN l. 1458 : « la première génération ne laissant que 9 octets de marge » inexact (le générateur avait tenu à 42 o. ; la boucle 1 a ramené à 9) ; omet 150 → 160 lignes | Aucun (Orchestrator) | **Corrigé** avant commit, formulation de la Revue |
| 2 | mineur | `00` : justification des budgets fausse — la colonne de l'archi compte le titre ; Conventions (10 l.) et Déploiement (11 l.) dépassent d'une ligne | Aucun (Orchestrator) | **Corrigé** : « dépassement d'une ligne dans deux sections, accepté ; plafond 340 tenu à 338 ». Signalé à l'utilisateur |
| 3 | info | En boucle 1, `dev` a retouché `.ai` à la main (contre 01 § 4) ; `02` gardait des valeurs dépassées ; « Hors périmètre » n'est pas dans « jamais sacrifiés » du brief | Aucun | **Note ajoutée en tête de `02`** ; durcissement du brief → prochaine régénération |
| 4 | info | PLAN l. 1458 ≈ 190 caractères | Aucun | Re-coupé avec le constat 1 |
| 5 | info | `CLAUDE.md:275` « Lot 6 » : reste d'état, répète Décisions ouvertes n° 4 | Aucun | Au prochain lot qui touche `CLAUDE.md` |
| 6 | info | `review.md:55-57` n'admet qu'« une décision gravée ou un piège vital », alors que `CLAUDE.md` l. 19-20 garde aussi le résumé opérationnel → faux constat possible | Aucun | Au prochain lot qui touche les briefs |
| 7 | info | PLAN § 6 ne disait pas pourquoi il n'y a pas de test automatique de taille | Aucun | **Puce ajoutée** à PLAN § 6 |
| 8 | info | Exemples Biome / TS 7 **supprimés, pas déplacés** (littéral `"paths": { "@/*": ["./src/*"] }`, `resolve.alias`, `!**/dist` vs `!**/dist/**`, `(@theme, @layer)`, « sinon Biome refuse de parser ») ; contraintes gardées dans `rules/biome.md` l. 11-13, `rules/typescript.md` l. 5-7 | Aucun | **Présenté à l'utilisateur** (restaurable en 3 lignes dans `CONVENTIONS` § 12) |
| 9 | info | **Confirmé** : les définitions d'agents sont chargées au démarrage de session — les nouveaux briefs ne joueront qu'à la prochaine session ; les prompts ont compensé pendant ce lot | Aucun | Signalé à l'utilisateur |
| 10 | info | Le critère de péremption ne compte ni `PROJECT_PLAN.md` ni `orchestrate`, que l'index cite par ligne : un pointeur peut glisser de quelques lignes | Aucun | Assumé |
| 11 | info | PLAN l. 331 (et l. 300) : le fragment « Routage React Router… câblés » est collé à « Reste à valider sur un vrai téléphone » | Aucun | — |

## Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances (`ui` → `application` → `domain`) | Sans objet (aucun code) ; gardes `tests/architecture/` vertes |
| Aucun mode de jeu n'en importe un autre | Sans objet |
| Aucune couleur en dur dans `src/ui`, aucun `rounded-*` | Sans objet ; `themeBoundary` vert |
| Aucune règle de jeu réimplémentée dans l'UI | Sans objet ; l'index n'énonce plus aucune règle |
| Aucune valeur persistée renommée | Sans objet ; `MatchStarted` reste cité comme exception (`.ai` l. 104) |
| Sec a parcouru le diff (pas seulement les notes) | Oui |
| `CLAUDE.md` à jour des décisions durables du lot | Oui (l. 11, 14, 19-20) ; le plafond de l'index est un réglage de workflow (brief, skill, `.ai/README.md`, PLAN § 6) ; 338 ≤ 340 |
| `.ai/architecture-context.md` régénéré si une décision a été gravée | Oui (08:21 > 08:00), retouché en boucle 1, à jour |

## Go / no-go

**Verdict :** **GO**
**Justification :** aucune règle de jeu, décision structurante ni règle d'architecture touchée ;
aucune règle perdue (contrôle indépendant) ; renvois et liens valides ; index frais, sous
plafond, sans énoncé de règle, avec surfaces gravées, exceptions et constats ; Sec sur le diff
réel ; toutes les questions ont une réponse écrite, celles de l'utilisateur sont signées.

## Points non résolus après le lot

1. Contradictions anciennes de `CLAUDE.md`, sur surface gravée (lot `high` + décision
   utilisateur) : « Best-of N legs (défaut 3) » (l. 213) vs l. 74-81 ; `useMatch.ts` (l. 93) →
   `useX01.ts` ; « bannir … les API navigateur » (l. 95-97) alors que Biome ne bannit que 7
   paquets.
2. Constats anciens de l'index : entraînement non gravé (41-170), First 9, PLAN § 2 sans
   `PreviewTourDuMondeVisit`, PLAN § 6 lot 1, README 318 tests (réel 339), charte 2 exceptions de
   couleur sur 3, sets non exposés.
3. Effet réel sur les agents : visible au prochain lot, dans une nouvelle session ; Cursor non
   vérifié.
4. Doublon iOS de `DEPLOIEMENT.md` l. 73-77 ; exemples Biome / TS supprimés (constat 8).
5. Pointeurs de lignes de PLAN dans l'index, hors critère de péremption (constat 10).
6. Ligne « Lot 6 » (constat 5) et formulation de `review.md` (constat 6).
