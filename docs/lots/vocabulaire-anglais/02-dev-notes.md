# Lot `vocabulaire-anglais` — notes du Dev

Dev : `dev` (sonnet, effort medium), 2026-10-17. Rapport rédigé par l'Orchestrator. Pas de commit.

## Contrôles lancés par le Dev

- `npx biome check src tests` : propre. `npm run typecheck` : OK. `npm run build` : OK.
- `npx vitest run` : 82 fichiers, **1516 tests verts** (1497 avant le lot). `tests/ui/parcours.test.tsx`
  a échoué une fois sur un délai de 5 s sous charge ; il passe seul et dans le run final.
- Grep d'encodage : un seul hit, `CompteBatons.tsx` (« BÂTONS », déjà dans `HEAD`, légitime).
- **Relecture à l'écran : non faite.** Aucun port ouvert.

## Implémenté

**Voix en segments typés par langue**
- `Announcer.ts` : types `Langue` (`'fr-FR' | 'en-US'`), `SegmentAnnonce`, `Annonce` ; `say(annonce)`.
- `SpeechAnnouncer.ts` réécrit : un seul `cancel()`, un `SpeechSynthesisUtterance` par segment dans
  l'ordre, `rate = 1.1`, voix par `lang` exact (le `_` d'Android normalisé) puis préfixe puis voix `fr`
  puis `voices[0]` ; cache `Map<Langue, voix>` vidé sur `voiceschanged`, liste vide jamais figée ;
  segments vides ignorés, annonce vide sans coupure ; `try/catch` global.
- `labels.ts` : `LANGUE_DE_BASE`, `fr()` / `en()` ; `annonceVolee`, `annonceIssue`, `annonceFinDeVolee`,
  `annonceCricket` renvoient une `Annonce` ; le tour est un segment `fr('. À toi, X')` (point dans le
  segment français) ; `annonceOrdre` / `annonceTirage` (aria-live) restent des `string`.
- Appelants : `useVoix` (`useAppareil.ts`), `useTourDuMonde.ts`, `ReglagesEcran.tsx`
  (`say([fr(PHRASE_ESSAI_VOIX)])`, phrase inchangée).

**« Sortie » → « Checkout »** : `labels.ts` (issue, aide des Réglages, entraînement, réglages, récaps,
ligne Rejouer, `reglesX01`, `reglesEntrainement`, accords réécrits à la main) ; `momentVolee.ts`,
`Tableau.tsx`, `LigneJoueur.tsx`, `Cartouche.tsx`, `ResumeEntrainementEcran.tsx`.

**Statistiques** : `BlocCible` affiche `LIBELLE_HORS` quand `joueur.hits.missed === 0`, le nombre
sinon ; étiquette « hors cible » conservée.

**Docs (vocabulaire d'écran)** : `CLAUDE.md`, `README.md`, `rules/glossary.md`, `CHARTE_GRAPHIQUE.md`.
`SECTIONS_CONFIDENTIALITE` inchangé (texte et date). Hors lot, volontairement : `PROJECT_PLAN.md`,
`.ai/architecture-context.md` (à régénérer par `/refresh-architecture`, son inventaire dit
« deux sorties »).

**Tests** : `FakeAnnouncer` partagé (`tests/fakes/index.ts`) ; assertions de langue (Bust `en-US`,
score et tour `fr-FR`) ; `tests/infrastructure/device/SpeechAnnouncer.test.ts` (13 tests, fausse
`speechSynthesis`) ; `tests/ui/annonces.test.ts` ; `statistiquesPodium.test.tsx` (« Hors » à 0, nombre
non nul conservé) ; libellés mis à jour dans dix autres fichiers de `tests/ui`.

## Écarts (tous des **ajustements**, aucune refonte)

1. **Verbe « sortir le reste »** reformulé : « faire le checkout du reste », « N checkouts à faire »,
   « la fléchette qui fait le checkout »… et l'aria-label de `Cartouche` « Reste à sortir » devient
   « **Reste à finir** » (formulation du Dev, sans « checkout »).
2. **Boutons des réglages X01** : « Libre » / « Sur un double » **restent** sous la légende
   « Checkout » (`LIBELLE_CHOIX_ENTREE_SORTIE` est partagé avec la légende « Entrée »). « Checkout
   libre / sur un double » est appliqué aux récaps, à « Ce soir », à la ligne Rejouer et aux règles.
3. **Annonce vocale** : « Checkout » sans point d'exclamation (segment anglais d'un mot seul) ; à
   l'écran « Checkout ! » garde son point.
4. **Ajout à `CLAUDE.md`** : une puce « À l'écran, on dit « checkout », jamais « sortie » » (§ Décisions
   structurantes), au-delà de la simple substitution.

## Questions ouvertes (à clore avant Test)

- **Q1 (utilisateur)** : l'aria-label « Reste à finir » convient-il, ou une formulation avec « checkout » ?
- **Q2 (utilisateur)** : écart 2 — les boutons restent « Libre / Sur un double » sous la légende
  « Checkout », ou « Checkout libre / Checkout sur un double » partout, y compris les boutons ?
- **Q3 (utilisateur)** : valider l'ajout de la puce dans `CLAUDE.md` (écart 4).
- Hors CI : écoute de l'accent sur vrai téléphone (Android, iPhone ; `rate = 1.1`, choix de voix par
  `lang` éventuellement ignoré sur iPhone).

## Limites

- Aucun test ne détecte un texte tronqué : « Checkout » (8 lettres, `uppercase tracking-[0.14em]`) dans
  `LigneJoueur`, le ruban de `Tableau`, « Checkout demandé » de `Cartouche`, « Checkout 8 » de l'Accueil,
  boutons de la feuille de règles : à regarder en portrait / paysage, sombre / clair (agent `ecran`).
- Le test d'adapter utilise une fausse `speechSynthesis`.

## Mots « sortie » laissés dans `src`

- **Identifiants et clés** : `SORTIES`, `setSorties`, `sortieMax`, `RubanSortie`, `LEGENDE_SORTIE`,
  `AIDE_SORTIE`, `ChoixEntreeSortie`, `parleSorties`, `parleAucuneSortie`, `RUBRIQUE_SORTIES`,
  `'entrainement:sorties'` (persistée), clé React `sortie-…`, pictogramme `'sortie'`, `src/core/**`.
- **Commentaires** non affichés (`Tableau.tsx`, `useX01.ts`, `useCricket.ts`, `useCheckoutPractice.ts`,
  `Cartouche.tsx`, `EntrainementEcran.tsx`, …).
- **Mots courants** : `ActionsFinDePartie.tsx` (« trois sorties d'un écran de résumé »), « font sortir
  quelque chose du téléphone » (confidentialité).
- Docs : nom du pictogramme `sortie` (charte) ; verbes « sortable », « si le joueur sort » (`CLAUDE.md`).

## Tour de correction (2026-10-17) — Q1-Q3 closes par l'utilisateur

Dev : `dev` (sonnet, effort medium), second lancement.
- **Q1** : aria-label de `Cartouche` = « Reste pour le checkout ».
- **Q2** : boutons du rail « Checkout » = « Checkout libre » / « Checkout sur un double »
  (`LIBELLE_CHOIX_SORTIE`, nouveau ; `LIBELLE_CHOIX_ENTREE_SORTIE` reste pour l'Entrée seule, qui garde
  « Libre » / « Sur un double »). `ReglagesJeu.tsx`, `Cartouche.tsx`, `labels.ts` ; tests
  `entrainement`, `nouvellePartie`, `parcours`, `reglesDuJeu` mis à jour (ils cliquent les boutons par
  leur nom exact). Boutons `min-h-12`, texte sur deux lignes possible : **à vérifier à l'écran**.
- **Q3** : puce de `CLAUDE.md` validée.
- Incident : un remplacement PowerShell 5.1 avait corrompu l'encodage de quatre fichiers de test ; le
  Dev les a ré-encodés. Contre-vérifié par l'Orchestrator : aucun BOM, aucun mojibake, aucun CRLF dans
  `src` ni `tests`.
- Contrôles : biome propre, typecheck OK, build OK, vitest 1515 / 1516 — seul échec
  `parcours.test.tsx` (« crée une partie… », délai de 5 s sous charge de la suite complète), qui passe
  seul (2 / 2) ; même lenteur que lors du premier tour.

## Correctifs ultérieurs (2026-10-17)

- **Q4** : `aideManches` (`labels.ts`) dit « le premier qui fait le checkout gagne le set / la partie ».
- **Relecture à l'écran** : deux débordements, corrigés par réduction du tracking (option A de l'utilisateur) :
  `LigneJoueur.tsx` (« Checkout » : `tracking-[0.14em]` → `tracking-tight`) et `CartePartie.tsx` (unité de
  la vignette : `tracking-[0.06em]` → `tracking-tighter` si l'unité fait plus de 8 caractères). Police
  inchangée (plancher 0,75 rem). Mesures DOM après correctif : 49,8 px dans 60 px et 50,5 px dans 56 px.
- Contrôles : biome propre, typecheck OK, build OK, vitest 1515 / 1516 (`parcours.test.tsx` lent,
  préexistant sur `HEAD`).
