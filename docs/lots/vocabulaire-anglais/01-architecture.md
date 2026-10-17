# Lot `vocabulaire-anglais` — architecture

Source : rapport `archi-scout` (sonnet, effort bas), `Architecture result: PASS`, 2026-10-17.
Niveau `light` confirmé : aucune surface gravée touchée. Pas de planche.

## Problème

Dire « bust » et « checkout » en en-US au milieu d'une annonce française ; « Sortie » devient
« Checkout » à l'écran ; « Hors » remplace « 0 » dans les statistiques. Aucun changement de règle,
d'événement ni de format persisté.

## Approche retenue

Plus petit changement : élargir ce que reçoit `Announcer.say`, ajouter de petits constructeurs dans
`labels.ts`, faire enchaîner les segments par l'adapter. Pas de nouveau port ni use case.

## Chemins concrets

### 1. Voix

**Port** `src/core/application/ports/driven/Announcer.ts` : `type Langue = 'fr-FR' | 'en-US'`,
`type SegmentAnnonce = { readonly texte; readonly langue }`, `type Annonce = readonly SegmentAnnonce[]`.
`say(annonce: Annonce)` ; `cancel()` et `NullAnnouncer` inchangés ; commentaire d'en-tête à jour.

**Adapter** `src/infrastructure/device/SpeechAnnouncer.ts` :
- un seul `speechSynthesis.cancel()` en tête de `say`, puis un `SpeechSynthesisUtterance` par segment,
  dans l'ordre (la file native les enchaîne) ; `utterance.lang = segment.langue` ; `rate = 1.1` conservé ;
- voix par langue : `lang` exact, sinon préfixe (`en`, `fr`), sinon voix actuelle (`fr`, sinon `voices[0]`) ;
  sans voix en-US, le segment se dit quand même avec la voix de repli ;
- cache `Map<Langue, voix | null>` remis à zéro sur `voiceschanged` ; ne pas figer un `null` quand
  `getVoices()` est vide (piège Chrome) ;
- segments vides ignorés ; annonce entièrement vide : ne rien dire et ne pas couper ;
- `try/catch` global conservé.

**`labels.ts`** : helpers `fr(texte)` / `en(texte)` (ou constante de langue de base, un seul endroit à
changer pour l'i18n). `annonceVolee`, `annonceIssue`, `annonceFinDeVolee`, `annonceCricket` renvoient
une `Annonce`. `annonceFinDeVolee` accepte `Annonce | null` ; le point reste dans le segment français
suivant (« . À toi, X »), jamais dans le segment anglais. `annonceOrdre` / `annonceTirage` (aria-live)
restent des `string`.

**Appelants de `say`** : `useAppareil.ts:73-83` (`useVoix`, point de passage unique, type
`(annonce: Annonce) => void`), `useX01.ts:108`, `useTourDuMonde.ts:89`, `useCricket.ts:82-90`,
`useCheckoutPractice.ts:57`, `ReglagesEcran.tsx:393` (`[fr(PHRASE_ESSAI_VOIX)]`, appel direct voulu).

**Tests** : trois fakes à adapter (`tests/ui/x01.test.tsx:35`, `manches.test.tsx:45`,
`entrainement.test.tsx:21`) ; option d'un `FakeAnnouncer` partagé dans `tests/fakes/index.ts` (au Dev) ;
assertions de langue pour bust et checkout ; nouveau test d'adapter avec fausse `speechSynthesis`
(un seul `cancel`, `speak` dans l'ordre, `lang`, voix en-US si présente, repli, vide ignoré,
`getVoices()` vide au premier appel).

### 2. « Sortie » → « Checkout »

Libellés affichés, presque tous dans `labels.ts` : `LIBELLE_ISSUE.CHECKOUT`, `annonceVolee`,
`annonceIssue`, `AIDE_ANNONCER_VOLEES`, entraînement (`reglesCarteEntrainement`,
`libelleEtatEntrainement`, `parleAucuneSortie` / `parleSorties`, `LEGENDE_*`, `AIDE_SORTIE`,
`aideSorties`, `recap*`, `RUBRIQUE_SORTIES`, `terme: 'Sorties'`), réglages (« sortie libre / sur un
double », `LIBELLE_CHOIX_ENTREE_SORTIE`), textes de règles (`reglesX01`, `reglesEntrainement`, lignes
~1562-1675 et ~2190-2343, accords à la main). Hors `labels.ts` : `momentVolee.ts:48`, `Tableau.tsx:65`,
`LigneJoueur.tsx:168`, `Cartouche.tsx:43`, `ResumeEntrainementEcran.tsx:72,76`.

**Ne pas toucher** : tout `src/core/**` (`SortieRules`, `checkoutRange`, commentaires compris),
clé persistée `entrainement:sorties`, `SORTIES` de `reglagesPossibles`, `setSorties`, `sortieMax`,
`RubanSortie`, pictogramme `'sortie'`, clé React `sortie-…` de `momentVolee.ts:47`, mots courants
(« sortir quelque chose du téléphone », etc.).

`SECTIONS_CONFIDENTIALITE` ne cite pas la règle (seul le verbe « sortir », l. 380) : texte et date
inchangés.

**Docs (vocabulaire d'écran seulement, aucune règle changée)** : `.claude/rules/glossary.md`
(lignes 17 et 24), `CLAUDE.md` (82, 267-268, 275, 296, 314-320), `docs/CHARTE_GRAPHIQUE.md`
(420, 424, 534, 596), `README.md` à la discrétion du Dev. Ce lot édite des phrases de
`CLAUDE.md` § Règles du jeu : vocabulaire seulement.

### 3. Statistiques

`LIBELLE_HORS` existe (`labels.ts:787`). Site : `StatistiquesEcran.tsx:319-322` (`BlocCible`,
`nombre(joueur.hits.missed)` au-dessus de `LIBELLE_HORS_CIBLE`). `CarteImpacts.tsx:219` n'affiche
jamais 0.

## Décisions du contexte d'architecture concernées

Aucune décision gravée modifiée : port côté application, libellés dans `labels.ts`, ni
`MatchEvent`, Dexie, `backupSchema`, domaine, `GameMode` ni service worker.

## Baseline sécu

Aucun réseau ajouté, `speechSynthesis` reste dans l'adapter, pseudos lus en texte brut. Une voix
en-US en ligne selon l'appareil : déjà couvert par la politique.

## Conformité à la planche

Aucune planche.

## Questions pour l'utilisateur (produit, à clore avant Dev)

1. Formulation de « sortie libre / sur un double » : « Checkout libre / Checkout sur un double », ou
   « Libre / Sur un double » sous une légende « Checkout » ? Et le verbe « sortir le reste » (entraînement) :
   on garde le français ou on reformule ?
2. Pluriel / accord : « 8 checkouts » (avec s) ? « Sortie 8 » de l'Accueil → « Checkout 8 » ?
3. Statistiques `BlocCible` : remplacer le nombre `0` seul par « Hors » (étiquette « hors cible »
   conservée, soit « Hors / hors cible »), remplacer l'étiquette, ou autre ?
4. Phrase d'essai de la voix (« Cent quatre-vingts ») : faire aussi entendre « Bust » / « Checkout » ?
   (Non demandé ; non retenu par défaut.)
5. `AIDE_ANNONCER_VOLEES` : « Score, bust et checkouts, à voix haute » ?

## Questions ouvertes techniques (Dev / Test)

- `getVoices()` vide au premier appel sans figer un `null` en cache.
- `rate = 1.1` à confirmer à l'oreille pour un mot en-US.
- iPhone : le choix par `lang` peut ignorer `utterance.voice` ; écoute sur vrai téléphone (hors CI).
- `FakeAnnouncer` partagé ou fakes locaux.
- Grep d'encodage final : aucun « Sortie / sortie » d'écran restant hors mots courants, consigné
  dans `02-dev-notes.md`.

## Réponses de l'utilisateur (2026-10-17) — questions produit closes

1. **« Checkout » partout** : « Checkout libre » / « Checkout sur un double » ; le nom « sortie » devient
   « checkout » dans toute phrase. Le verbe « sortir le reste » suit (« faire le checkout », formulation
   exacte au Dev, signalée dans `02-dev-notes.md`).
2. **Pluriel et accord** : oui — « 8 checkouts » (avec s), « Sortie 8 » devient « Checkout 8 ».
3. **Statistiques `BlocCible`** : le nombre `0` est remplacé par le mot « Hors » (`LIBELLE_HORS`) ;
   l'étiquette « hors cible » reste ; un nombre non nul reste affiché.
4. **Phrase d'essai de la voix** : inchangée (« Cent quatre-vingts »), en français seul.
5. **`AIDE_ANNONCER_VOLEES`** : « Score, bust et checkouts, à voix haute ».
