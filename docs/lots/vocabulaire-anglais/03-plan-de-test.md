# Lot `vocabulaire-anglais` — plan de test

Test : `test` (sonnet, effort high), lecture statique seule (l'agent n'avait ni shell ni git).
Exécutions **faites par l'Orchestrator**, 2026-10-17.

## Exécutions (Orchestrator)

| Contrôle | Résultat |
| --- | --- |
| `npx biome check src tests` | propre (303 fichiers) |
| `npm run typecheck` | OK |
| `npm run build` | OK |
| `npx vitest run` | 1515 / 1516 ; seul échec `tests/ui/parcours.test.tsx` « crée une partie… », délai de 5 s |
| `parcours.test.tsx` seul, ×3 | 2 / 2 à chaque fois (≈ 3,5 s) |
| Suite complète sur `HEAD` (worktree jetable, `27c57e0`), ×2 | **le même test échoue** (5,27 s) : lenteur **préexistante**, pas une régression du lot |
| `git diff --stat -- src/core` | un seul fichier : `ports/driven/Announcer.ts` |
| BOM / mojibake / CRLF dans `src`, `tests` | aucun |

Worktree jetable retiré après usage (`git worktree list` propre).

## Verdict par critère (lecture statique du Test, recoupée)

| Critère | Verdict |
| --- | --- |
| Bust / Checkout en `en-US`, reste `fr-FR` | OK (`annonces.test.ts`, `x01.test.tsx`, `entrainement.test.tsx`) |
| Ordre, un seul `cancel`, nouvelle annonce coupe l'ancienne | OK (`SpeechAnnouncer.test.ts`, journal exact) |
| Repli sans voix `en-US` ; `getVoices()` vide au 1er appel ; `en_GB` d'Android | OK |
| Segments vides ignorés ; annonce vide sans coupure ; API absente ; exception | OK |
| Plus de « Sortie » affiché dans `src/ui` | OK : restes = identifiants, clés, commentaires, mots courants |
| « Hors » à la place de 0 (`BlocCible`) | OK (0 → « Hors », non nul inchangé) |
| « Checkout libre / sur un double » ; Entrée intacte | OK |
| aria-label « Reste pour le checkout » | OK |
| Domaine et clés persistées inchangés | OK (`git diff`) |

## Bugs d'implémentation

Aucun. Aucune boucle Test → Dev.

## Questions ouvertes

- **Q4 (utilisateur, produit)** : `labels.ts` ~1273-1274 (`aideManches`) dit « le premier qui **sort**
  gagne le set / la partie ». Verbe « sortir » conservé comme mot courant, ou « le premier qui fait le
  checkout » (« checkout partout ») ?
- Hors CI, à l'oreille (Android, iPhone) : accent `en-US`, `rate = 1.1`, choix de voix par `lang`
  (ignoré sur iPhone ?), pause entre énoncés, segment `. À toi, X` (un moteur peut lire « point »),
  repli français qui prononce « Checkout » à la française.
- À l'écran (agent `ecran`, port 5201) : « Checkout » en `uppercase tracking-[0.14em]` dans
  `LigneJoueur`, le ruban de `Tableau`, `Cartouche`, l'Accueil ; boutons « Checkout libre / sur un double »
  sur deux lignes à 360 px ; rubriques de règles réécrites ; « Hors » à côté de chiffres dans `BlocCible`.

## Lacunes de tests (non bloquantes, assumées)

1. `entrainement.test.tsx:111` s'intitule « annonce le score, le bust et la sortie » mais n'asserte que
   Bust ; `Checkout` n'est testé qu'en unitaire ; pas de bust X01 multijoueur de bout en bout.
2. Aucune garde automatique « pas de Sortie affichée » (liste blanche + plancher vert à vide possible).
3. Cache de voix : liste d'abord partielle puis complète non testée (schéma d'avant le lot).
4. Titres et commentaires de test disant encore « sortie » (cosmétique).
5. `parcours.test.tsx` : lent sous charge, **préexistant** sur `HEAD` ; timeout explicite possible sur ce
   test, hors lot.

## Q4 close (2026-10-17)

Décision : « le premier qui fait le checkout ». Correctif Dev (`labels.ts`, `aideManches`, deux phrases) ;
aucune autre occurrence affichée du verbe « sortir » dans `src/ui`. Re-contrôles : biome propre,
typecheck OK, build OK, vitest 1515 / 1516 (même `parcours.test.tsx` lent, préexistant).
