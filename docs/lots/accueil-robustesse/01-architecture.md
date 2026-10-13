# Lot `accueil-robustesse` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu (`archi-scout`). Le rapport
> source commence par `Architecture result: PASS`.

## Problème

`AccueilEcran.tsx:150` ne teste que `isPending`. Si une lecture échoue (`encours`, `historique`,
`joueurs`), `data` reste `undefined`, `vide` (l. 151) devient vrai et l'écran affiche « Pas de
partie cette semaine » : une panne se lit comme une perte de données. L'état vide ne distingue
pas « jamais joué » de « semaine calme », et rien ne mène aux parties plus anciennes. Trois
libellés vivent hors de `labels.ts` (« Début », « Navigation principale », « Compteur de
fléchettes ») et la flèche « → » (l. 170) entre dans le nom accessible du lien.

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| Déduire les cas depuis `historique.data` déjà lu (`getMatchHistory(PLAFOND_CARTES)`) | Aucun nouveau port ni use case ; tout reste dans l'écran | Faux positif possible du lien à exactement 30 parties toutes visibles |
| Lire `limit + 1` parties pour savoir s'il y a une suite | Supprime le faux positif à 30 | Une requête plus large pour un lien inoffensif ; écarté |
| Compte via un port existant | — | `GetMatchHistory` ne rend qu'une liste, aucun port de compte : écarté |
| Chargement : `<output>` + `sr-only` autour du `Skeleton` | Garde la mise en page livrée ; suit le précédent `<output>` du projet | — |
| Chargement : remplacer le `Skeleton` par `SpinnerLigne` | Plus simple | Change la mise en page livrée ; écarté |
| Chargement : `aria-busy` | — | Aucun précédent dans `src/ui` ; écarté par cohérence |
| Route du lien via une constante de `chemins.ts` | — | `/historique` est codé en dur ailleurs (`NavigationBasse.tsx:14`) ; hors lot |

## Approche retenue

Tout reste dans `AccueilEcran.tsx` et `labels.ts`, sans nouveau port ni use case.

1. **Cas** — à partir de `historique.data` (toutes les parties récentes, en cours comprise) :
   - `total = historique.data.length` ;
   - `affichees = (enCours ? 1 : 0) + somme des groupes` (la partie en cours est exclue des
     groupes par le `continue` l. 121 mais comptée ici) ;
   - **jamais joué** : `total === 0 && !enCours` ;
   - **semaine calme** : `affichees === 0 && total > 0` (`groupeDeJour` rend `null` hors fenêtre,
     l. 122-123) ;
   - **lien « Toutes les parties »** : `total > affichees || total >= PLAFOND_CARTES` — présent
     aussi en semaine calme, jamais en « jamais joué ».
2. **Erreur** — `encours.isError || historique.isError || joueurs.isError` (`useJoueurs` rend un
   `useQuery`). Priorité : erreur → chargement → vide (deux variantes) → liste. Rendu :
   `<MessageErreur>{LIBELLE_ERREUR_ACCUEIL}</MessageErreur>` (`Etats.tsx:42`, `role="alert"`)
   dans la `section` existante. Libellé fixe, jamais `error.message`, et qui ne promet pas que les
   données sont intactes. Le bouton « Nouvelle partie » reste visible.
3. **Chargement annoncé** — envelopper le `Skeleton` (`aria-hidden`) d'un `<output>` portant un
   `<span className="sr-only">{LIBELLE_CHARGEMENT_PARTIES}</span>` (précédent :
   `HistoriqueEcran.tsx:119-120`, `SpinnerLigne`). Pas d'`aria-busy`.
4. **Lien** — `to="/historique"` comme `to="/joueurs"` (l. 167), mêmes classes que « Créer un
   joueur » (l. 168), libellé `LIBELLE_TOUTES_LES_PARTIES`, flèche décorative
   `<span aria-hidden="true">→</span>`. Même correction pour « Créer un joueur ».
5. **Libellés** — nouveaux dans `labels.ts` : `LIBELLE_AUCUNE_PARTIE_ENCORE`,
   `LIBELLE_TOUTES_LES_PARTIES`, `LIBELLE_ERREUR_ACCUEIL`, `LIBELLE_CHARGEMENT_PARTIES`,
   `LIBELLE_NAVIGATION_PRINCIPALE`, libellés des quatre onglets (`LIBELLE_ONGLET_*`),
   `LIBELLE_COMPTEUR_FLECHETTES`. `LIBELLE_AUCUNE_PARTIE_SEMAINE` (l. 452) reste pour la semaine
   calme. Noms à vérifier contre l'existant de `labels.ts`. Les valeurs déplacées ne changent pas :
   les tests qui les cherchent par texte (`lot4.test.tsx`, `nouvellePartie.test.tsx`,
   `confidentialite.test.tsx`, `accueilPartiesRecentes.test.tsx`) gardent leurs chaînes littérales.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | — |
| `core/application/` | — | — |
| `infrastructure/` | — | — |
| `ui/` | `src/ui/ecrans/AccueilEcran.tsx`, `src/ui/labels.ts`, `src/ui/composants/commun/NavigationBasse.tsx`, `src/ui/composants/commun/Logo.tsx` | Branche d'erreur, états vides, lien, annonce du chargement, libellés |
| `composition/` | — | — |
| `tests/` | `tests/ui/accueilPartiesRecentes.test.tsx`, éventuellement `tests/fakes/index.ts` | Nouveaux cas ; dépôts fakes qui lèvent |

**Sens des dépendances vérifié :** `ui`/`infrastructure` → `application` → `domain`.
**Nouveau port ?** Aucun.

### Plan de tests (pour Dev et Test)

Dans `tests/ui/accueilPartiesRecentes.test.tsx` (`fakeServices`, `SettableClock`,
`renderWithServices` avec `retry: false`). Échec provoqué **sans mock** : sous-classe de fake
(`InMemoryMatchRepository` dont `listRecent` / `listAll` lèvent ; idem
`InMemoryPlayerRepository.listAll`), injectée par `fakeServices({ matches, clock })`. Vérifier
d'abord par quelle méthode passe `getOngoingMatch`.

1. Erreur du dépôt des parties : `alert` avec le libellé, libellé « semaine » absent ; idem pour
   l'échec des joueurs seuls.
2. Jamais joué : libellé dédié, pas de lien « Toutes les parties ».
3. Semaine calme : partie de plus de sept jours, libellé « Pas de partie cette semaine » + lien
   vers `/historique`.
4. Partie récente + partie ancienne : liste visible, lien présent.
5. Plafond : 31 parties, lien présent ; contre-épreuve : peu de parties toutes visibles, lien
   absent (la garde d'absence doit pouvoir échouer).
6. Chargement : `getByRole('status')` avant la résolution.
7. `getByRole('link', { name: 'Créer un joueur' })`, nom exact sans « → ».

## Décisions de `CLAUDE.md` concernées

- Aucune surface gravée : pas de domaine, de `GameMode`, de format persisté, de `backupSchema`, de
  service worker ni de `firebase.json`. « Abandonnée » et le nom de partie ne bougent pas ;
  `matchStatus(partie, enCoursId)` (l. 137) reste calculé contre la partie en cours globale.
- Appliquées : UI → use cases (aucun nouvel import), `services.clock`, tout le français dans
  `labels.ts`, tokens de couleur, cibles ≥ 48 px, angle vif.
- Politique `/confidentialite` : non touchée (aucun réseau, aucune permission, aucune donnée).
- Rien à graver en fin de lot.

## Baseline sécurité

Aucune nouvelle entrée ni frontière : libellés statiques, aucun appel réseau, pseudos déjà rendus
sans HTML brut par `CartePartie`. Le message d'erreur n'affiche pas `error.message`.

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | Bouton « Réessayer » sur l'erreur ? Le scout ne le recommande pas (cohérence avec `HistoriqueEcran`, qui n'en a pas). **Close : non** (utilisateur, 2026-10-13). | Utilisateur |
| 2 | Lien « Toutes les parties » affiché à exactement 30 parties toutes visibles (faux positif inoffensif) : accepté ? **Close : accepté** (utilisateur, 2026-10-13). | Utilisateur |
| 3 | Relecture à l'écran de l'état d'erreur et des états vides, portrait / paysage, sombre / clair. | Utilisateur, fin de lot |

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
