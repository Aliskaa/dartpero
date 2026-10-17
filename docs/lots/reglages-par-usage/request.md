# Demande — reglages-par-usage

- **Statut de validation** : Validé
- **Date de validation** : 2026-10-16
- **Niveau** : high
- **Commande manuelle** : `/orchestrate reglages-par-usage high`

## Objectif

Réglages rangés par usage, l'état en tête : deux voyants (Dernière sauvegarde, Application)
coiffent une page unique — affichage (thème en trois vignettes, voix), sauvegarde resserrée,
joueurs et appli en lignes de liste. Lot 12 de l'étude
[`2026-10-13-NEW-revision-charte-graphique.md`](../prospective/2026-10-13-NEW-revision-charte-graphique.md)
(§ Réglages — une page rangée par usage, l'état en tête).

## Périmètre

- `ReglagesEcran` réarrangé en une seule page ; **aucune route nouvelle**.
- Voyant **Dernière sauvegarde** : durée depuis le dernier export + lien « Exporter ». La date
  du dernier export est **gardée sur l'appareil** (nouvelle clé `localStorage`, préférence
  d'appareil) ; heure lue par `services.clock`.
- Voyant **Application** : « Installée », ou « Pas installée » + « Installer » (invite native)
  ou « Comment ? » quand le navigateur ne sait pas installer d'un appui.
- Ligne de contenu sous les voyants : « N parties · M joueurs sur ce téléphone ».
- **Affichage** : thème en trois vignettes (Sombre, Clair, Système) qui montrent le rendu ;
  « Annoncer les volées » en ligne à bascule ; « Essayer la voix » en ligne.
- **Sauvegarde** : « Exporter » et « Restaurer » côte à côte ; une phrase d'état de la
  protection (rappel d'exporter dans les trois états) ; lien « Demander la protection » si non
  protégée ; l'explication de la restauration en petit ; résumé d'import et erreurs comme
  aujourd'hui.
- **Joueurs et appli** en lignes de liste : « Gérer les joueurs » (avec le nombre de profils),
  « Confidentialité et mentions légales ».
- Pied de page : « 100 % local, hors ligne, sans compte. » + la présentation de Dartpéro.
- Politique `/confidentialite` : `SECTIONS_CONFIDENTIALITE` cite la date du dernier export ;
  `DATE_MISE_A_JOUR_CONFIDENTIALITE` mise à jour.
- Docs : charte (§ Composants : voyant, vignette de thème, ligne de réglage), `CLAUDE.md`
  (décisions « stockage persistant » et « installation » reformulées : « Réglages → Sauvegarde »
  et « entrée complète dans Réglages → À propos » ne correspondent plus aux noms de l'écran),
  PLAN, étude (lot 12 fait).

## Hors périmètre

- Voyant « Données protégées », « Hors ligne prêt », voix disponible, écran maintenu allumé
  (écartés à l'étude).
- Les pages par sujet (piste 1) et toute nouvelle route.
- Le contenu de `/joueurs` et de `/confidentialite` hors du paragraphe sur le stockage local.
- La logique d'export / import (`ManageBackup`) et le format de sauvegarde : la date du dernier
  export **n'est pas** dans le fichier exporté.
- L'Accueil (ligne d'installation), sauf que son lien `#installer` doit toujours aboutir.

## Comportement visible

- Portrait d'abord ; en paysage, la page défile, les voyants restent côte à côte en tête. Pas un
  écran de partie : lu à 30 cm, cibles ≥ 48 px partout (voyant entier, lignes, vignettes,
  boutons).
- En tête : titre « Réglages », sans sous-titre ; deux voyants côte à côte (étiquette en
  capitales, valeur en Oswald, action soulignée en laiton). Filet du haut **vert** si tout va
  bien, **laiton** si une action est attendue.
- **Dernière sauvegarde** : « Aujourd'hui », « Hier », « Il y a N jours » (jusqu'à 59), puis
  « Il y a N mois » ; laiton au-delà de 30 jours ; « Jamais » en laiton. L'action « Exporter »
  lance l'export comme le bouton.
- **Application** : « Installée » en vert, sans action ; sinon « Pas installée » avec
  « Installer » (invite native) ou « Comment ? » (iOS, autre navigateur iOS, navigateur sans
  invite) qui fait défiler vers le bloc `#installer` placé sous les voyants, rendu seulement dans
  ces états (trois gestes iOS, ou la phrase du menu). L'Accueil y mène toujours.
- Thème : vignette active cerclée de laiton ; changement appliqué tout de suite, comme
  aujourd'hui. Les vignettes montrent **toujours** le rendu de leur thème, quel que soit le
  thème courant.
- Après un export réussi, le voyant passe à « Aujourd'hui » sans rechargement.
- « Demander la protection » n'apparaît qu'en non protégée ; en cas de refus, la phrase oriente
  vers l'installation (voyant Application).
- Relu en sombre et en clair.

## Critères d'acceptation

1. Ordre : voyants, ligne de contenu, Affichage, Sauvegarde, Joueurs et appli, pied de page ;
   exactement deux voyants.
2. Voyant de sauvegarde : « Jamais » sans export ; « Aujourd'hui » juste après un export
   réussi ; un export qui échoue n'écrit pas la date ; une restauration ne la touche pas.
3. Seuils vérifiés à l'horloge fake : 0 j, 1 j, 30 j (pas laiton), 31 j (laiton), 59 j (jours),
   60 j (mois).
4. Voyant Application juste dans les cinq états d'`AppInstallation` ; « Comment ? » mène à
   `#installer` ; le lien de l'Accueil y aboutit.
5. Rappel d'exporter présent dans les trois états de `PersistentStorage` ; « Demander la
   protection » seulement en `not-persisted`.
6. « N parties · M joueurs » exact, base vide comprise, accords au singulier.
7. `/confidentialite` cite la date du dernier export ; sa date de mise à jour a changé.
8. Cibles ≥ 48 px ; gardes vertes (`themeBoundary`, `typographieBoundary`, `horlogeBoundary`,
   `appuiBoundary`, `pictogrammesBoundary`).
9. Lint, typecheck, `npx vitest run`, build verts.

## Contraintes

- Couleurs en tokens seulement, vignettes comprises (aucune couleur en dur pour montrer l'autre
  thème).
- Tout le français dans `labels.ts`.
- Heure par `services.clock`, jamais `Date.now()`.
- Date du dernier export : préférence d'appareil (`localStorage`), jamais une donnée de partie
  ou de joueur.
- Comptes par des use cases ; aucun Dexie dans l'UI.
- Angle vif, zéro dégradé, plancher `craie-3`, icônes `aria-hidden`, valeurs changeantes dans un
  `<output aria-label>`.
- Planche suivie **à l'identique**, hors écarts tranchés ci-dessous.

## Dépendances

- Lot 4 `pictogrammes` (fait).
- Lot parallèle `rejouer` (worktree `..\Flechettes-rejouer`) : aucun recouvrement fonctionnel ;
  conflits attendus sur `labels.ts`, la charte, l'étude, `CONVENTIONS`
  (`orchestrate` § Lots en parallèle).

## Risques

- Vignettes : montrer le rendu clair sous le thème sombre avec des tokens définis sous
  `html[data-theme]` (portée locale du thème ou tokens d'aperçu — à trancher en architecture).
- Compte des parties : `GetOngoingMatch` ne lit que les 20 dernières ; un port de lecture de
  plus peut être nécessaire.
- Ancre `#installer` déplacée : ne pas casser le défilement depuis l'Accueil (test existant à
  garder).
- Politique publique oubliée = politique mensongère.

## Zones impactées

`src/ui/ecrans/ReglagesEcran.tsx` ; nouveaux composants de `composants/commun/` si réutilisables
(voyant, vignette de thème, ligne de réglage) ; `src/ui/labels.ts` ; hook ou préférence de la
date d'export ; éventuellement un port et un use case de comptage, et `container.ts` ;
`src/index.css` si tokens d'aperçu ; tests UI Réglages / installation / stockage ; docs (charte,
`CLAUDE.md`, PLAN, étude).

## Attentes de validation

- Testing Library : deux voyants dans tous leurs états ; seuils de durée (horloge fake) ; date
  écrite à l'export réussi seulement ; rappel d'exporter dans les trois états ; lien de
  protection ; ancre `#installer` ; comptes, base vide comprise.
- Un test que la politique mentionne la nouvelle clé, s'il existe un modèle à suivre.
- Relecture à l'écran : portrait et paysage, sombre et clair, captures comparées à la planche.
  Angles morts déclarés : contraste réel des vignettes, troncature des valeurs de voyant à 360 px.

## Questions bloquantes

Aucune.

## Questions non bloquantes

- Mécanisme des vignettes (portée locale du thème ou tokens d'aperçu) — owner : architecture
  (`archi-authority`).
- Source du compte des parties (port existant ou nouveau port de comptage) — owner :
  architecture.

## Décisions prises pendant l'intake

- **Niveau `high` imposé** : politique publique + nouvelle clé `localStorage`, décisions gravées
  « stockage persistant » et « installation ».
- **Planche retenue** : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\derniers\derniers.html`,
  piste « Retenue · 2 + états de 3 » (`#rg4`), version à **deux** voyants. La capture
  `verif-rg4.png` (trois voyants) est périmée. Lien publié de l'étude (correspondance non
  garantie, voir `LISEZMOI.md`) : <https://claude.ai/artifact/SA1SE4NJMvh7o4y6pPg9wW>.
- Voyant Application hors invite : « Comment ? » + bloc guide `#installer` sous les voyants
  (utilisateur).
- Protection non accordée : lien « Demander la protection » dans la phrase (renommé depuis
  « Redemander ») ; le refus renvoie au voyant Application (utilisateur).
- Textes gardés contre la planche : explication de la restauration, présentation de Dartpéro
  (utilisateur).
- Sous-titre d'en-tête retiré, comme sur la planche (non gardé par l'utilisateur).
- Date d'export : écrite à l'export réussi seulement ; « Aujourd'hui / Hier / Il y a N jours
  (≤ 59) / Il y a N mois », laiton au-delà de 30 jours et pour « Jamais » (utilisateur).
- Filet du voyant vert si tout va bien (installée, export ≤ 30 jours), laiton sinon — proposé
  par défaut, validé avec le brouillon.
- « N parties » compte toutes les parties enregistrées, en cours et abandonnées comprises —
  proposé par défaut, validé avec le brouillon.
- « Essayer la voix » garde le chevron de la planche — proposé par défaut, validé avec le
  brouillon.
