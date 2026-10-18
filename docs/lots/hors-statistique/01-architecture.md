# Lot `hors-statistique` — architecture

> Écrit par l'Orchestrator à partir du rapport du sous-agent retenu (`archi-scout`). Le rapport
> source commence par `Architecture result: PASS`.

## Problème

1. La touche « Hors » (`PaveSaisie.tsx:157`, `--texte-touche: craie-3`) est grise, donc peu
   visible : elle doit passer en rouge, texte et bordure (piste 1 de la planche).
2. Statistiques n'affiche qu'un compte brut de fléchettes hors cible : il faut une ligne de
   moyenne par partie, et le total à zéro doit s'écrire « 0 ».

Planche suivie : `C:\Users\kevin\Documents\Flechettes\docs\maquettes\hors\hors.html`
(<https://claude.ai/artifact/3NiEtCXcC6xaFmEFd1qFkB>), lue en entier par le scout.

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| Jeton général nouveau `rouge-touche` (retenu) | Valeur claire propre, plus foncée si besoin ; `rouge-texte` reste réservé | Un jeton de plus à documenter et à garder |
| Élargir la garde de `rouge-texte` | Aucune couleur nouvelle | `rouge-texte` tombe à 4,2:1 sur `feutre-nuit` en clair ; il faut revérifier le contraste et élargir la garde |
| Division dans le domaine (`CareerStats`) | Cohérent avec `matchWinPercent` | Surface gravée, `high` : écarté par l'utilisateur (option A) |

## Approche retenue

### Touche « Hors »

- `src/index.css` : jeton `--color-rouge-touche` dans `@theme` (sombre, `#ff8a8f`, valeur de la
  planche) **et** sous `html[data-theme="clair"]` (valeur à mesurer, ≥ 4,5:1 sur le vrai fond du
  pavé ; `#a81f25` de la planche si elle tient, sinon plus foncée, p. ex. `#9a1b21`).
- `PaveSaisie.tsx:157` : `[--texte-touche:var(--color-rouge-touche)]` (jamais un `text-*`, garde
  `appuiBoundary`). Bordure : modificateur `.touche-hors` en couche `components` de `index.css`
  (modèle `.touche-bulle`) ou variable `--bordure-touche` — au choix du Dev. À l'appui, la bordure
  rouge sur le fond inversé `craie` est à vérifier à l'écran.
- `rouge-cible` reste le fond translucide de la Bulle ; `rouge-touche` ne colore que texte et
  bordure.
- Garde : `themeBoundary.test.ts` vérifie `rouge-touche` défini dans `@theme` et dans le bloc
  clair. Documenter dans `theme-colors.md` § Nouvelle couleur et `docs/CHARTE_GRAPHIQUE.md`
  § Palette (jeton, valeurs, contrastes mesurés). `rouge-texte` inchangé et réservé.

### Moyenne par partie

- `src/ui/labels.ts`, à côté de `pourcent`, `nombre`, `complementVictoires` :
  `moyenneParPartie(total, parties): string` (`toLocaleString('fr-FR')`, une décimale fixe ;
  `parties <= 0` → « 0,0 », jamais de division par zéro) et un constructeur de libellé
  `horsCibleParPartie(missed, parties)` qui rend les trois morceaux de la planche : « Hors cible
  par partie », « 2,6 », « sur 16 parties » (`pluriel` pour « 1 partie »).
- `StatistiquesEcran.tsx` (`BlocCible`) : ligne dédiée sous le `<ul>`, dans le `<figcaption>`,
  `flex justify-between` ; libellés `text-etiquette text-craie-3`, valeur `chiffres font-bold
  text-craie`. La colonne passe de `missed === 0 ? LIBELLE_HORS : nombre(missed)` à
  `nombre(missed)` (retrait de l'import `LIBELLE_HORS` si devenu inutile).
- Calcul `hits.missed ÷ matchesPlayed` (deux champs de `PlayerCareer`) ; accumulés dans la même
  boucle de `career.ts`, donc la période filtre numérateur et dénominateur ensemble — à confirmer
  par un test.

## Couches impactées

| Couche | Fichiers à créer / modifier | Nature du changement |
|---|---|---|
| `core/domain/` | — | Aucun |
| `core/application/` | — | Aucun |
| `infrastructure/` | — | Aucun |
| `ui/` | `src/index.css`, `src/ui/composants/commun/PaveSaisie.tsx`, `src/ui/labels.ts`, `src/ui/ecrans/StatistiquesEcran.tsx` | Jeton et bordure rouges ; helper et libellé ; ligne de moyenne ; colonne à « 0 » |
| `composition/` | — | Aucun |
| `tests/` | `tests/architecture/themeBoundary.test.ts`, test du helper, test de rendu Statistiques, test de période | Garde du jeton ; helper ; rendu ; dénominateur |
| Docs | `.claude/rules/theme-colors.md`, `docs/CHARTE_GRAPHIQUE.md` § Palette | Jeton nouveau et contrastes |

**Sens des dépendances vérifié :** `ui` seule touchée ; le helper est pur, sans service.
**Nouveau port ?** Non.

## Décisions de `CLAUDE.md` concernées

- UI → use cases uniquement : respecté. Textes dans `labels.ts`. Couleurs en paires de rôle,
  valeur claire livrée avec le jeton, plancher 4,5:1.
- Aucune décision gravée touchée ; rien à graver à la fin du lot (jeton nouveau : charte et
  `theme-colors.md`).

## Baseline sécurité

Aucune entrée non fiable touchée : la moyenne porte sur des nombres issus du domaine. Aucun
réseau, aucun HTML brut, aucune clé `localStorage` nouvelle, `/confidentialite` inchangée. Seul
risque : `NaN` / `Infinity` si `matchesPlayed` valait 0 ; le helper garde le zéro explicite.

## Conformité à la planche

- Touche « Hors », piste 1 : texte et bordure rouges, fond inchangé ; ordre Bulle · Hors · Annuler
  inchangé ; Bulle garde son fond.
- Statistiques, disposition 3 : colonne inchangée (chiffre `craie`), ligne dédiée dessous.
- Total à zéro : colonne « 0 », ligne « 0,0 par partie ». Résumé de partie inchangé.
- **Écart technique unique** : la planche dessine le rouge clair à `#a81f25` ; le scout estime
  ~4,2:1 sur `feutre-nuit` (fond possible du pavé). Si la mesure du Dev tient ≥ 4,5:1 avec
  `#a81f25`, l'écart disparaît. Sinon : rouge clair plus foncé (question 1).

## Questions ouvertes

| # | Question | Pour qui |
|---|---|---|
| 1 | **Produit** : acceptez-vous, en thème clair, un rouge de touche légèrement plus foncé que celui dessiné (`#a81f25`), si la mesure sur le vrai fond du pavé ne tient pas 4,5:1 ? | Utilisateur (arrêt Archi → Dev) |
| 2 | Mesurer le fond réel du pavé dans les deux thèmes et fixer la valeur claire de `rouge-touche` ; consigner les ratios dans `theme-colors.md` | Dev |
| 3 | Bordure : `.touche-hors` ou `--bordure-touche` ; vérifier l'inversion à l'appui à l'écran | Dev |
| 4 | `nombre()` pour le « 16 » (« 1 000 » à l'espace insécable) : cohérent avec l'écran, à garder ou non | Dev |
| 5 | `pluriel(0, 'partie')` rend « 0 partie » : cas non atteint, à documenter dans un test | Dev / Test |
| 6 | Tests : helper (41/16 → « 2,6 », 0/16 → « 0,0 », arrondi, virgule, 1 partie), rendu (colonne « 0 », ligne « 0,0 », singulier), dénominateur suivant la période, garde du jeton ; angles morts : contraste, bordure à l'appui, lisibilité à distance (écran seulement) | Test |

## Révisions

> Ajoutées par les boucles 3, 4 et 7 (Sécurité, Dev ou Revue → Archi). Chaque révision relance
> la chaîne d'architecture. Ne jamais effacer la version précédente.
