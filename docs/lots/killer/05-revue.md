# Lot `killer` — revue

> Écrit par l'Orchestrator à partir du rapport du sous-agent `review` (opus, effort xhigh d'après son
> frontmatter, 1 lancement, rapport rendu dans le plafond, sans shell : fichiers lus sur disque, les fichiers
> neufs étant non suivis par git).

## Résumé

Le diff livre les règles 1 à 14 de la demande révisée et la Révision 1 : Killer par la couture `GameMode`,
numéros dans `KillerStarted.numbers` hors config, genre du profil en clé absente, « Éliminé par … » déduit du
journal, politique mise à jour au 21 octobre 2026. **Règles du jeu : aucun écart** entre `rules.ts` et la demande
(R1 à R9, R12, R14 relues une à une). **Les 25 décisions de l'utilisateur** des 20 et 21 octobre sont vérifiées
dans le code, toutes conformes (numéros hors config, nouveau tirage de « On remet ça » et Rejouer, sélection
coupée **écrite**, tuile Killer seule avec « 2 à 6 joueurs » et étape 1 option B, cartes « 3 vies », mini
tableau de la planche, « −N » en vies réellement perdues en `rouge-touche`, voix sans « À toi » à la victoire,
vies restantes au résumé, grille qui se referme et retour sans effet, Ordre grisé sous 2 joueurs, filtre avec
Killer avant Solo, variante sur la ligne Rejouer, genre à trois valeurs et clé absente, ligne repliée piste B,
`ChoixGenre` dessiné à part, pas de genre à la création par le champ en ligne, accord partout sauf « dernier en
vie », profil supprimé au masculin, politique, genre invalide = profil ignoré). Textes des planches repris mot
pour mot ; écarts planche / code tous listés dans `02-dev-notes.md`, aucun autre trouvé ; rendu non vérifié.

## Constats

| # | Sévérité | Constat | Renvoi vers |
|---|---|---|---|
| 1 | Majeur (empêche le go de la Revue) | Des points restent ouverts **sans acceptation explicite de l'utilisateur** (liste ci-dessous) ; la relecture sur téléphone, obligatoire d'après la demande (critère 17), n'est pas faite | Aucun : signature de l'utilisateur |
| 2 | Mineur | `CLAUDE.md` périmé : « quatre modes » (nom de partie, livre de règles), décision Annulation sans le Killer, parenthèse « 5 jeux » sur la mauvaise étape | **Corrigé** par l'Orchestrator |
| 3 | Mineur | « retirent les numéros » lisible comme « enlèvent » (`CLAUDE.md`, `PROJECT_PLAN`, index) | **Corrigé** : « tirent de nouveaux numéros » |
| 4 | Mineur | `PROJECT_PLAN.md:154` cite le Killer parmi les jeux restants | **Corrigé** |
| 5 | Mineur | `00-orchestration.md` en retard (Éliminé par hors périmètre, politique « inchangée », `rouge-touche` ouverte, historique des corrections vide) | **Corrigé** |
| 6 | Info | Textes en dur hors `labels.ts` (« Classement », « Partie ! », « Cette partie est introuvable. »), comme les modes existants (index #20) | Aucun |
| 7 | Info | Le « −N » de la dernière volée reste affiché pendant le tour suivant (`KillerEcran.tsx:99, 196`), cohérent avec la planche, à confirmer sur téléphone | Aucun |
| 8 | Info | Intitulé de test « NaN vie(s) » (cosmétique, antérieur au lot) ; index #36 « PLAN § 0 sans `killer` » : corrigé depuis | Aucun |

## Clôture des questions (00 à 04)

**Closes par un fichier du lot** : brouillon de volée, clés de préférence, forme de l'événement et
`BACKUP_VERSION`, classement (`01`) ; questions 1 à 15 et R1.1 à R1.10 (`01` § Réponses) ; précisions des règles
(critères 4, 5, 7) ; Rejouer (planche et réponse 3) ; `rouge-touche` (réponse 14) ; politique (Révision 1,
R1.7) ; problèmes de test 1 à 5 et C1 (`03` § Comblement). **Close par la Revue** : Q2 de `03` (aucun mode ne
vérifie les `playerIds` à l'import, `backupSchema.ts:253-272` : le Killer se comporte comme les autres, « Joueur
supprimé »).

**Encore ouvertes, NON signées par l'utilisateur** (recommandation de la Revue entre parenthèses) : (1) texte de
`reglesKiller` (critère 16) : relu face aux règles 1 à 14, exact, la variante grisée du bon côté
(`labels.ts:2659-2766`), reste la relecture de l'utilisateur ; (2) consigne à 0 joueur « Ajoutez au moins un
joueur » (`labels.ts:2522-2523`) : inexacte à 0, mais c'est le texte de la planche et la réponse 13 demandait la
même consigne ; (3) libellés `aria` écrits par `dev` (`labels.ts:2513-2518`) ; (4) **Q1** : une volée importée non
tronquée est acceptée, le rejeu la tronque (`rules.ts:210`) (accepter) ; (5) **R1** : un genre corrompu dans
IndexedDB fait échouer la lecture des profils, même précédent que la couleur (accepter, ou une ligne de lecture
tolérante) ; (6) **R2** : coût quadratique d'un journal très long à l'import (`rules.ts:224`), local (accepter) ;
(7) **R3** : un journal ancien qui ne se rejoue pas est refusé à l'import, l'affichage utilise la même projection
(`summarize.ts:54`) (accepter) ; (8) **R4** : une version antérieure de l'app perd le genre (accepter) ;
(9) constat **#11** (atomicité de l'import) inchangé ; (10) comportement ouvert de la ligne Genre et écarts
planche / code de `02` ; (11) **relecture sur téléphone** : numéro à 38 / 32 px, 6 lignes en paysage, 5 colonnes à
360 px, « Non précisé » sur deux lignes, classes `min-h-10.75` / `min-h-22.5`, contraste sur `--repere`.

## Invariants vérifiés

| Invariant | OK ? |
|---|---|
| Sens des dépendances ; `killer/` n'importe que des objets valeur ; `default` typé `never` dans `games/index.ts`, `PartieEcran.tsx`, `rejouer`, `max` ; `hexagonalBoundary` lit les vrais dossiers | Oui |
| Aucun mode de jeu n'en importe un autre | Oui |
| Aucune couleur en dur, aucun `rounded-*`, aucun `text-craie*/NN` ; `rouge-touche` reste général ; cibles ≥ 48 px | Oui |
| Aucune règle de jeu réimplémentée dans l'UI (`KillerEcran` lit les effets du domaine) | Oui |
| `useKiller` passe par `useVoleeEnCours`, `sortieEnAttente` dérivé, rien d'écrit, dit ni célébré avant *Valider* (`useKiller.ts:146, 222-225`) | Oui |
| Aucune valeur persistée renommée | Oui |
| `sec` a parcouru le diff (pas seulement les notes) | Oui |
| `CLAUDE.md` à jour des décisions durables du lot | Oui (après les retouches 2 et 3) |
| Index régénéré | Oui (22e passe : 133 lignes, 13 289 octets) |

## Conséquences visibles pour l'utilisateur

Sélection coupée : les 5e et 6e joueurs d'un Killer à 6 sont perdus en passant au X01 (voulu, R1.4). Import : un
fichier produit par l'app actuelle s'importe pour tous les modes (`backup.test.ts:89`), seuls les journaux qui
ne se rejouent pas sont écartés et comptés. Un ancien export sans genre lit les profils « non précisé » ;
importer un ancien fichier remet à « non précisé » un profil qui avait un genre (règle « l'import remplace »,
dite par la politique). Accord cohérent partout ; les cartes disent « 0 vie », jamais « éliminé ».

## Go / no-go

**Verdict de la Revue :** NO-GO pour la fusion en l'état ; GO sans nouvelle Revue dès que l'utilisateur a signé
(ou fait corriger) les points ouverts et fait la relecture sur téléphone, les retouches de docs 2 à 5 étant
faites. Aucun renvoi Dev, Test, Sécurité ou Archi n'est bloquant (aucune règle mal lue, toutes les décisions
dans le code, 18 mutations sur 19 rouges, le mutant vert étant équivalent).

**Décision de l'utilisateur (2026-10-21, après la Revue)** : « OK tu peux commit et fusionner dans main ». Le go
de fusion est donné. **L'Orchestrator n'en déduit aucune signature** des points ci-dessus : ils restent non
signés et sont reportés comme tels dans `PROJECT_PLAN` ; la relecture sur téléphone reste à faire après la
fusion.

## Points non résolus après le lot

Q1, R1 à R4, constat #11, constats #20 et #35 de l'index (textes en dur, « Valider la sortie »), clé
`partie:ordre-aleatoire` orpheline, lisibilité réelle à 2-3 m, relecture sur téléphone (voir ci-dessus).
