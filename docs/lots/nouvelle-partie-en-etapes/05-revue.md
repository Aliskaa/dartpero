# Lot `nouvelle-partie-en-etapes` — revue

> Écrit par l'Orchestrator à partir des rapports de `review` (opus, effort max, frontmatter).
> Le sous-agent n'avait pas de shell : fichiers lus sur disque ; résultats de commandes repris
> de l'Orchestrator. Version la plus récente en tête.

## Version 3 — GO, sous réserve de la relecture A à F (rejeu limité après le tour 3)

Périmètre (établi par dates de modification, pas de shell) : `tests/setup.ts`,
`tests/ui/nouvellePartie.test.tsx`, `CONVENTIONS.md`, `PROJECT_PLAN.md`, `README.md`, l'index,
les fichiers du lot ; aucun fichier de `src/`. Mesures de l'Orchestrator : 517 verts, lint,
typecheck.

- **n° 10 levé** (`tests/setup.ts:15-18`, cohérent avec `CONVENTIONS.md`, R1 et jsdom 29).
- **n° 11 levé** : pour les six lignes, `numero − 1` est l'index d'avant ; mêmes `attendu`, sens
  et assertions — vérification strictement identique.
- **n° 4 reporté** (accord de l'utilisateur, PLAN § 0 n° 4 exact) ; **n° 12, 13 levés** ; **n° 9
  levé** pour le texte (captures : utilisateur) ; n° 8 → relecture A.

| # | Sévérité | Constat | Renvoi vers | Suite |
|---|---|---|---|---|
| 14 | Mineur | README § Les règles présentait le bust à 1 et à 0 sans double comme inconditionnels, alors que l'écran part en sortie libre | Orchestrator | **Fait** : bust conditionné au double out, sortie libre par défaut mentionnée ; l. 260 remise à la ligne |
| 15 | Info | PLAN § 0 n° 4 ne citait pas le README (suggestion « sous 170 », bogeys) | Orchestrator | **Fait** |
| 16 | Info | CONVENTIONS § 13 : `ajouter` / `retirer` testent aussi `CHECKOUT_PRACTICE` en dur | Orchestrator | **Fait** |
| 17 | Info | L'index fait 160 lignes physiques (149 non vides) : conforme, mais au plafond sur les deux mesures | Aucun | Mesurer avec `(Get-Content …).Count` à la prochaine passe |
| 18 | Info | Traçabilité du tour 3 incomplète (02, 03, PLAN « deux tours », 06, journal du 00 ; puce collée au PLAN) | Orchestrator | **Fait** |

**Verdict : GO**, sous réserve de la relecture A à F en cours chez l'utilisateur. Un défaut
trouvé là se corrige avant le commit (lint, typecheck, tests, plus build et smoke si `src/`
bouge, puis une Revue limitée à ce diff). Commit sur `lot/nouvelle-partie-en-etapes`, puis
fusion `--ff-only` : chacun sur accord de l'utilisateur. G et H (Android, iPhone réels) après
le commit, comme l'utilisateur l'a retenu.

---

## Version 2 — GO conditionnel (rejeu après la boucle 5)

### Résumé

Le bloquant de la v1 est levé : `rangVise` (`ordre.ts:33-46`) vise la place la plus proche
(seuil strict à mi-chemin) ; borne du geste inchangée (`ListeOrdonnable.tsx:103-104`,
commentée). Recalculé : au bout du geste, le centre dépasse le dernier seuil d'un demi-pas, à
2, 3 et 4 lignes, dans les deux sens. Tests à la borne réelle (4 purs, 9 de composant) ; la
contre-épreuve (13 échecs sur l'ancien seuil) correspond exactement à l'ensemble attendu. T8
écrit et capable d'échouer, T9 exact. 503 + 14 = 517. Aucun constat bloquant ni majeur.

### Suivi des constats de la v1

| v1 | État | Vérifié |
|---|---|---|
| n° 1 (bloquant) | **Levé** | `ordre.ts:33-46` ; `ordre.test.ts:50-74` ; `nouvellePartie.test.tsx:378-483` |
| n° 2 | **Levé** | 03 § Rejeu n° 2 (d) ; 01 § Révisions |
| n° 3 | **Levé** | T8 (`nouvellePartie.test.tsx:645-658`), T9 (l. 221-228) ; plus de « dette acceptée » au PLAN |
| n° 4 | **Ouvert**, décision utilisateur | ci-dessous |
| n° 5, 6, 7 | **Levés** | 01 § Révisions ; `CONVENTIONS.md` ; PLAN |
| n° 8 | Ouvert, assumé (info) | inchangé |
| n° 9 | **Partiel** | charte l. 337-338 corrigée ; README et `<dialog>` dans la charte restent |

### Constats restants

| # | Sévérité | Constat | Preuve | Renvoi vers |
|---|---|---|---|---|
| 4 (v1) | Mineur, décision utilisateur | La sortie libre est le défaut de l'écran, mais `CLAUDE.md` § Checkouts et `glossary.md:17` ne décrivent que le cas double out ; sans double out, `checkout.ts:84` suggère jusqu'à 180 et « % doubles » vaut « — » aux réglages par défaut. Non inscrit au PLAN § 0 | `CLAUDE.md:237-242` ; `glossary.md:17` ; `checkout.ts:84, 112-113` ; `README.md:48` ; `PROJECT_PLAN.md:1693` | Utilisateur : (a) report à un lot de règles inscrit au PLAN § 0, ou (b) ligne de renvoi dans § Checkouts et au glossaire puis `/refresh-architecture` |
| 10 (T10) | Mineur | `tests/setup.ts:15-16` dit « le glisser au doigt ne se teste pas en jsdom » — faux depuis le tour 2 (dix tests passent par `setPointerCapture`) ; contredit `CONVENTIONS.md:199-203` et R1 | `tests/setup.ts:15-16` ; `ListeOrdonnable.tsx:85, 128` | Utilisateur : accepter, ou tour Dev de deux lignes (recommandé) |
| 11 (T11) | Info | Titre d'`it.each` « (n°%i) » compté depuis 0 | `nouvellePartie.test.tsx:447` | Même décision que n° 10 |
| 12 | Info | `CONVENTIONS.md:269-270` incomplet : `GardeOrdre` (`NouvellePartieEcran.tsx:38`) et `versOrdre` (`EtapeJoueurs.tsx:73`) testent aussi `CHECKOUT_PRACTICE` en dur — un nouveau mode solo y serait traité en jeu de groupe | `NouvellePartieEcran.tsx:38` ; `EtapeJoueurs.tsx:73` ; `useNouvellePartie.ts:140, 142` | Orchestrator — **fait** (voir plus bas) |
| 13 | Info | L'index situe le piège `<StrictMode>` sous `renderWithServices` au lot `nouvelle-partie-en-etapes` ; il est au lot `stockage-persistant` | `.ai/architecture-context.md:69-71` ; `PROJECT_PLAN.md:1560-1563` | Prochain `/refresh-architecture` |
| 9 (reste) | Info | README : « premier à N legs » (l. 38), « gagné un leg » (l. 51), « meilleur leg » (l. 59-60) ; captures d'écrans disparus (l. 80, 85) | `README.md` | Texte : Orchestrator si l'utilisateur le veut ; captures : utilisateur |
| 8 (v1) | Info | Défauts recopiés dans des libellés | `labels.ts:455-466, 606-609` | Relecture utilisateur, point A |

### Invariants revérifiés sur la boucle

`ordre.ts` sans import ; aucun fichier de `src/` créé ; seul appelant de `rangVise` :
`ListeOrdonnable.tsx:114` ; ni couleur en dur ni `rounded-*` ; aucune valeur persistée
touchée ; `CLAUDE.md` sans ajout depuis la v1 ; index régénéré après les retouches. Critère 3
tenu en jsdom par composition (pointeur → `partie:joueurs` ; `partie:joueurs` → journal).

### Verdict

**GO conditionnel** : aucune question ouverte ne reste à une phase ; le GO ne vaut qu'une fois
obtenus, **avant le commit**, les accords explicites de l'utilisateur :

1. **n° 4** : (a) ou (b) — chacune demande une retouche avant le commit.
2. **n° 10 / n° 11** : accepter, ou correction (recommandée pour le n° 10).
3. **Relecture après le commit** : accepter de committer avant la relecture A à H, qui porte des
   validations de l'utilisateur (textes de Dev, aucune carte mise en avant, D2, B1, I1, Android,
   iPhone). Recommandation : A à F en émulation DevTools **avant** le commit.
4. **README** : laisser le texte périmé jusqu'aux captures, ou le faire corriger maintenant.

Un refus ne rouvre pas tout le lot (n° 10 / 11 : tour Dev de deux lignes + lint + tests + Revue
sur ce seul diff ; n° 4 (b) ou README : retouche de doc, `/refresh-architecture` si `CLAUDE.md`
bouge).

### Points non résolus après le lot (assumés)

Relecture A à H ; Android réel (glisser à 2, 3, 4 joueurs, dépôt intermédiaire, retour
matériel, R3) ; iPhone (R2) ; captures ; n° 4 si (a) ; n° 8 ; `<dialog>` à décrire dans la charte
au deuxième usage ; hors lot existants (« Manche N » sur la partie, résumé X01 sans sets,
retour `size-10` de `X01Ecran.tsx:33`, `successPercent` sans « — », import qui écrase, constats
de l'index #2, 3, 5, 6, 7, 10, 11). Étude prospective : `NEW` conservé (renommage sur demande
seulement), `PARTIAL` lui irait.

---

## Version 1 — NO-GO

### Résumé

Le design d'Archi est livré presque à l'identique (routes descendantes sous un seul `lazy()`,
gardes, `ETAT_PARCOURS`, hook dans le parent, `<dialog>` natif, menu en divulgation, max 4 / 1,
sets, « manche » à l'écran et à la voix, onglet Joueurs dans Réglages, `/entrainement`
redirigé, `config.ts` en commentaire seulement). Les invariants tiennent ; 13 critères sur 14
sont couverts. **Mais le glisser au doigt ne peut jamais déposer un joueur en première ni en
dernière place — et à deux joueurs il ne réordonne rien.**

### Constats

| # | Sévérité | Constat | Preuve | Renvoi vers |
|---|---|---|---|---|
| 1 | **Bloquant** | Borne du geste `dy ∈ [premiere.top − tenue.top, derniere.top − tenue.top]` : à hauteurs égales, `centre = milieux[de] + dy` plafonne exactement à `milieux[dernier]` (plancher `milieux[0]`) ; `rangVise` compare en strict (`>` / `<`), donc la dernière / première place n'est jamais franchie. À 2 lignes (milieux 28 et 92) : `92 > 92` faux, rien ne bouge. À 3, la ligne du milieu ne bouge pas. Retour visuel trompeur (affichée en dernier, atterrit une place plus haut). **Critère 3 non tenu au doigt ; régression par rapport aux flèches.** **Confirmé par l'Orchestrator à la lecture du code** | `ListeOrdonnable.tsx:101-102, 110-112` ; `ordre.ts:30, 33` | **Dev** — correctif + tests de non-régression capables d'échouer : `rangVise(milieux, 0, milieux[dernier]) === dernier`, cas à 2 lignes, idéalement un test de composant avec fausse mise en page (`getBoundingClientRect` par ligne, `pointerdown` / `pointermove` jusqu'au bout / `pointerup`, ordre relu dans `partie:joueurs`) |
| 2 | Majeur | La mitigation de R1 (« logique de rang pure et testée ») est creuse : `ordre.test.ts:35-40` teste `rangVise(…, 0, 126)` avec milieux `[25, 75, 125]`, valeur que la borne rend inatteignable ; aucun test ne relie borne et seuil | `tests/ui/ordre.test.ts:35-40` ; 01 § Baseline R1 ; 03 § Rejeu | **Test** — après Dev : contre-épreuve montrant que les nouveaux tests tombent sur l'ancien code ; corriger R1 dans 03 |
| 3 | Mineur | T8 / T9 acceptés comme dette par l'Orchestrator, pas par l'utilisateur ; PLAN § 6 écrit déjà « Dette acceptée » | 00 § Journal ; `PROJECT_PLAN.md:1686-1687` ; `nouvellePartie.test.tsx:221-224` | **Dev**, dans la même boucle (T8 : recette sans mock de 03 ; T9 : reformuler le commentaire) |
| 4 | Mineur (décision utilisateur) | Constat n° 12 de l'index : le lot grave la sortie libre comme défaut, mais `CLAUDE.md` § Checkouts (170, bogeys) et `glossary.md:17` (« ≤ 170 ») ne décrivent que le cas double out ; sans double out, `checkout.ts:84` suggère jusqu'à 180 et `isOnACheckoutDouble` renvoie `false` → « % doubles » vaut « — » pour toute partie aux réglages par défaut. Choix : (a) reporter à un lot de règles inscrit au PLAN § 0, (b) une ligne de renvoi dans § Checkouts (« vaut sous double out ; sans double out, non gravé ») | `CLAUDE.md:239-242` ; `glossary.md:17` ; `checkout.ts:84, 112-113` | Aucun (utilisateur) |
| 5 | Mineur | D1 clos à juste titre, mais `01-architecture.md` § 1 « Gardes » renvoie encore la sélection de l'entraînement vers l'étape 2 | `01-architecture.md:69-71` vs `NouvellePartieEcran.tsx:31-44, 78-95` | Aucun (annotation Orchestrator en § Révisions) |
| 6 | Info | CONVENTIONS § 13 : « la carte et le slug, non » est inexact (`SLUG_MODE`, `ICONES`, `LIBELLE_MODE` sont des `Record<GameModeId,…>`, `reglesCarteJeu` / `recapitulatif` des `switch` exhaustifs ; seuls `JEUX` et les défauts de `max` / `selection` échappent à TypeScript). § 14 : « 8 hooks », il y en a 9 (constat n° 13 de l'index) | `CONVENTIONS.md:264-268, 273-274` ; `chemins.ts:14` ; `EtapeJeu.tsx:21-28` | Aucun (Orchestrator) |
| 7 | Info | Le PLAN annonce « livré » / « ✅ Fait — 503 tests » avant la Revue et le commit ; à recaler après la boucle | `PROJECT_PLAN.md:19-25, 616, 1691` | Aucun (Orchestrator) |
| 8 | Info | Défauts recopiés en texte dans des libellés (« 20 → 15 · bulle », « 20 → bulle », « 301, 501 ou 701 », « Fermer le 20 au 15 ») : pas une règle réimplémentée, mais mentirait si un défaut changeait | `labels.ts:455-466, 606-609` | Aucun |
| 9 | Info | README : « premier à N legs » et capture d'un écran de lancement d'entraînement disparu ; charte l. 337 « l'écran de configuration » ; premier `<dialog>` de l'app non décrit dans la charte | `README.md:38, 80, 85` ; `CHARTE_GRAPHIQUE.md:337` | Aucun |

### Invariants vérifiés

Sens des dépendances ; aucun mode n'en importe un autre ; aucune couleur en dur ni
`rounded-*` ; aucune règle de jeu dans l'UI (tirage dans le use case) ; aucune valeur
persistée renommée ; Sec a lu le code (références exactes) ; `CLAUDE.md` reprend le texte de
01 et colle au code ; index régénéré cohérent — **tous OK**.

### Jugement sur les phases

Dev : design livré, écarts justifiés ; n° 1 est un bug d'intégration borne / seuil. Test :
bonnes zones de risque, mais le geste lui-même manqué (n° 1, n° 2). Sec : RAS étayé. Commandes
de l'Orchestrator : suffisantes comme seuils, mais vertes sur un code qui porte le n° 1 — tout
relancer après la boucle, plus la nouvelle contre-épreuve.

### Verdict

**NO-GO** : n° 1 bloquant (critère 3 non tenu au doigt ; à 2 joueurs, plus aucun moyen tactile
de choisir qui commence), et T8 / T9 sans accord de l'utilisateur.

Suite : boucle 5 (Revue → Dev) pour n° 1 et n° 3 → Test rejoué (n° 2, contre-épreuve) →
Sécurité rejouée → Revue.

### Ce qui demandera l'utilisateur, explicitement

1. T8 / T9, s'ils ne sont pas réglés dans la boucle.
2. Les textes rédigés par Dev (cartes, sous-titres, aides) — relecture point A.
3. Aucune carte mise en avant à l'étape 1 (01 § 8, réversible).
4. À l'écran : B1, I1 (point D), n° 1 une fois corrigé, D2 (point B).
5. Le constat n° 4 : report ou ligne de renvoi.

### Points non résolus après le lot

Relecture A à H de `03-plan-de-test.md` ; Android réel (glisser à 2, 3, 4 joueurs dans les deux
sens, retour matériel, R3) ; iPhone (R2) ; captures et texte du README ; hors lot existants
(« Manche N » sur la partie, résumé X01 sans sets, boutons retour sous 48 px — `X01Ecran.tsx:33`
en `size-10`, 40 px —, `successPercent` sans « — », import qui écrase sans confirmation).
