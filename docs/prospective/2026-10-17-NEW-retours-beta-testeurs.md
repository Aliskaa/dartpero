# Retours des beta-testeurs — premières parties en conditions réelles

Statut : **NEW**. Étude seule, aucun code touché. Chaque lot ci-dessous passe par
`/intake` puis `/orchestrate` ; c'est le lot qui grave une décision, pas ce fichier.

Source : premiers retours des beta-testeurs, collés par l'utilisateur le 2026-10-17.
Réponses de l'utilisateur du même jour intégrées ci-dessous.

## Les huit retours, tels que reçus

1. « Bust » avec l'accent anglais.
2. « Hors » d'une autre couleur.
3. Confirmer le checkout en cas de mauvaise manipulation.
4. Moyenne de « Hors » sur le nombre de parties : 27 fois « 0 » ne veut rien dire.
5. Statistiques : remplacer « 0 » par « Hors ».
6. Ne pas dire « Sortie » mais « Checkout », avec l'accent anglais.
7. Quand une personne gagne, dire une phrase rigolote.
8. Retour arrière sur la volée complète d'un joueur : ne pas effacer toute la volée,
   au risque de ne plus se souvenir de ce qu'il y avait.

## Décisions de l'utilisateur (2026-10-17)

| Point | Décision |
| --- | --- |
| « Bust » (1) | Le mot reste affiché tel quel ; c'est la **prononciation anglaise** à la voix qui est visée. |
| Moyenne de « Hors » (4) | **Par partie** (pas par volée). |
| Annulation (8) | **Une fléchette à la fois**, « comme le joueur actif » : retirer la dernière fléchette, pas la volée entière. |
| Phrase de victoire (7) | **Dite à voix haute.** Une phrase tirée dans `PHRASE_VICTOIRE` à chaque victoire. **5 phrases de plus** à ajouter. |

### Compléments du 2026-10-17 (seconde réponse)

| Point | Décision |
| --- | --- |
| Moment de la phrase (7) | **À la victoire** (dernière fléchette saisie). |
| Les cinq phrases | **Validées telles que proposées**, à ajouter aux quatre existantes (9 au total). Elles s'écrivent dans le lot E, pas en dehors d'un lot. |
| « Checkout » (6) | **Partout** (suggestion, boutons, statistiques, règles, annonces). |
| Moyenne de « Hors » (4) | Dans **Statistiques**, à côté du nombre de « Hors » (0) déjà affiché par joueur. |
| Annulation (8) | **Planche à faire** avant l'intake. |

### Planche d'annulation (2026-10-17, à valider)

`C:\Users\kevin\Documents\Flechettes\docs\maquettes\annulation\annulation.html`, publiée :
<https://claude.ai/artifact/6kxertheaGd44qgbRidnsv>. Elle montre, sur l'écran X01 :
- l'annulation fléchette par fléchette sur la volée du joueur d'avant (T20·T19·S5 → 384 → 441 → 501) ;
- le bust (la volée perdue se rouvre), la manche gagnée (la manche n'est plus gagnée), Julien déjà en train de jouer ;
- la confirmation de la sortie, en deux formes à choisir : **A** une touche « Valider la sortie » (la fléchette gagnante reste posée), **B** une boîte de confirmation.

Constat sur le code : la volée est enregistrée toute seule à la 3ᵉ fléchette (ou au bust / à la sortie) ; la fléchette en cours se retire déjà une à une, c'est « Annuler » après enregistrement qui retire la volée entière (`UndoLastVisitUseCase`). La pause anti-réflexe (`PAUSE_ANNULATION_MS`, 1 s) reste.

**Validé par l'utilisateur le 2026-10-17 :**
1. Libellé de la touche « Annuler S5 », le joueur seulement dans le nom accessible : **OK**.
2. Confirmation de la sortie : **forme B** (boîte « Kevin sort sur D10 ? », Corriger / Valider la sortie).
3. La confirmation vaut pour **tous les jeux** (victoire X01, Cricket, Tour du monde).
4. Le bust **n'est pas** confirmé.

La planche montre la forme A en plus de la B : seule la **B** est retenue.

## Lots proposés

| Lot | Retours | Niveau pressenti | Point d'attention |
| --- | --- | --- | --- |
| A `vocabulaire-anglais` | 1, 5, 6 | light | « Checkout » partout ou seulement là où l'écran dit « Sortie » ? Mettre à jour `rules/glossary.md` (« checkout / sortie »). |
| B `hors-statistique` | 2, 4 | à confirmer (high si un calcul de stats nouveau) | Où afficher la moyenne : stats du joueur, résumé de partie, ou les deux ? La couleur de « Hors » reste dans les paires de rôle de `theme-colors.md`. |
| C `annulation-volee` | 8 (et 3) | **high** | Touche `UndoLastVisit` et le journal d'événements : surface gravée. **Planche exigée** avant l'intake (règle « les architectes suivent la planche »). |
| D `confirmation-checkout` | 3 | à voir avec C | Une mauvaise manipulation à la dernière fléchette termine la manche à tort. Quelle confirmation, et pour quels cas ? |
| E `phrases-victoire` | 7 | light | Voir « Phrases de victoire » ci-dessous. |

Ordre conseillé : A, puis C avec D (même sujet : l'erreur de saisie en pleine volée), puis
B et E. A et E touchent tous deux `labels.ts` : les grouper ou ne pas les lancer en
parallèle. B touche les statistiques que `statistiques-podium` vient de refaire.

## Phrases de victoire — ce qui est vérifié

- `PHRASE_VICTOIRE` (`src/ui/labels.ts:2316`) : **4 phrases** (« Ça se fête autour de la
  cible. », « Une tournée pour le vainqueur. », « Le tableau a parlé. », « Bien joué — on
  remet ça ? »).
- `phraseVictoire(graine)` choisit par hachage de l'identifiant de la partie : toujours la
  même phrase pour une partie donnée.
- Utilisée **uniquement** par les trois écrans de résumé (`ResumeX01Ecran`,
  `ResumeCricketEcran`, `ResumeTourDuMondeEcran`), en texte affiché.
- **Jamais dite à voix haute** : `SpeechAnnouncer` (`src/infrastructure/device/`) n'est pas
  branché dessus. La demande est donc une fonctionnalité nouvelle, pas un réglage.

### Moment de la phrase — tranché : à la victoire

Dite à la victoire, elle ne doit pas différer de celle que le résumé affichera. Piste
sans stockage (donc sans toucher un format persisté, lot `light` possible) : tirer comme
aujourd'hui par `phraseVictoire(identifiant de la partie)`, pour que la voix et l'écran
disent la même. À confirmer par l'architecte du lot E ; si une phrase devait être rangée
dans le journal, le lot passe en `high` (`MatchEvent`, `backupSchema`).

### Cinq phrases — validées, à écrire dans le lot E

1. « Le vainqueur offre la prochaine tournée. »
2. « La cible a rendu son verdict. »
3. « Une victoire qui mérite un petit verre. »
4. « Pas mal pour un soir de semaine. »
5. « Les fléchettes ont encore frappé. »

## Questions encore ouvertes

- E : aucune question produit ouverte ; reste le choix technique du tirage (ci-dessus).
- A : aucune question produit ouverte.
- B : aucune question produit ouverte (Statistiques, à côté du compte de « Hors »).
- C : à quoi ressemble l'écran après le retrait d'**une** fléchette d'un joueur précédent
  (la volée rouvre-t-elle ce joueur ? le tour revient-il à lui ?). **Planche à faire.**
- D : forme de la confirmation du checkout.

## Ne pas perdre de vue

- Le retour 8 contredit en apparence « l'annulation est triviale » : le journal reste une
  liste d'événements, et retirer une fléchette d'une volée terminée doit rejouer
  correctement la projection (volée, tour, bust, leg gagné). Cas de bord à écrire : bust
  défait, manche gagnée défaite, annulation à cheval sur deux joueurs.
- Aucun de ces retours ne touche une règle de jeu : ne rien improviser côté règles.
