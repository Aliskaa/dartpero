---
name: audit
description: Audite Dartpéro en lecture seule sur six dimensions en parallèle, et rend un backlog de lots candidats classés, prêts à passer à /orchestrate. Ne modifie jamais le projet. À utiliser quand l'utilisateur tape /audit.
disable-model-invocation: true
---

# Rôle : Orchestrator d'audit

Tu pilotes un audit du projet. ⚠️ **Tu ne fais pas les audits toi-même** : tu délègues via
l'outil `Agent` au sous-agent `audit` (`.claude/agents/audit.md`), **une instance par
dimension**. Cette skill t'y autorise explicitement.

**Argument optionnel** : le nom d'une dimension (`archi`, `domaine`, `tests`, `ui`, `perf`,
`dette`) ou un chemin. Sans argument, les six dimensions.

⚠️ **Rien n'est modifié par cet audit, pas une ligne.** La sortie est un document. Si tu te
surprends à corriger quelque chose « au passage », tu es sorti de ton rôle : ça devient un lot
candidat, que l'utilisateur décidera de lancer ou non.

## 1 · Cadrer

Lis `CLAUDE.md`, `.claude/CONVENTIONS.md` et `docs/PROJECT_PLAN.md`. Tu en as besoin pour trois
choses : savoir ce que le projet **prétend** être, connaître la forme que son code prend
d'habitude, et connaître les **exceptions documentées**, pour ne pas relayer un faux positif
qu'un auditeur t'aurait renvoyé.

## 2 · Lancer les six en parallèle

**Un seul message, six appels `Agent`**, pour qu'ils tournent concurremment. Attends que tous
aient rendu avant de consolider.

| Dimension | Brief |
|---|---|
| `archi` | Sens des dépendances (`ui`/`infrastructure` → `application` → `domain`). Import externe dans `src/core/domain/`. `Date.now()` / `Math.random()` hors des ports `Clock` / `IdGenerator` / `RandomSource`. Port sans consommateur, ou consommateur qui contourne son port. Câblage hors `src/composition/container.ts`. Un mode de jeu qui en importe un autre. Les gardes de `tests/architecture/` couvrent-elles encore ce qu'elles prétendent ? |
| `domaine` | Écart entre les règles écrites dans `CLAUDE.md` (X01, Tour du monde, Cricket, entraînement) et `src/core/domain/games/`. Règle énoncée mais non couverte par un test. Bust, double in/out, bogey numbers, cut-throat, fin de tour de table, départage. Ce qui est tiré au sort est-il bien **écrit** dans le journal et jamais rejoué ? Lance cette dimension avec `model: "opus"`. |
| `tests` | Test vert à vide (il passerait même si on cassait ce qu'il protège). Zone de risque non couverte. Fakes utilisés là où il faut, Dexie absent des tests unitaires. Le garde-fou du test d'architecture compte-t-il toujours des fichiers ? Écart entre le nombre de tests annoncé dans `CLAUDE.md` et le réel. |
| `ui` | Couleur en dur dans `src/ui` hors des trois exceptions documentées. `rounded-*` réapparu. Cible tactile sous 48 px. Texte sous `craie/60`. Icône `lucide-react` sans `aria-hidden`. Composant dupliqué au lieu de réutiliser `commun/`. Règle de jeu réimplémentée dans un écran au lieu d'un port de prévisualisation. |
| `perf` | Taille du précache et du bundle (`npm run build`). Requêtes Dexie coûteuses, dont le `listAll()` du filtre d'historique. Re-rendus évitables dans le match en cours. Animations qui repeignent en continu. `npm audit`. |
| `dette` | **Ne découvre rien, relis.** `CLAUDE.md` note déjà des choses « à corriger si » : le défaut latent de `Cible` (`fontSize` 4,6 à 48,6), l'absence de `.gitattributes`, le `nanoid` de `npm audit`, l'asymétrie des ports X01 (`StartMatch` face à `PlayTourDuMonde`), le cumul des impacts resté au X01. Lesquelles mordent aujourd'hui ? Lesquelles sont devenues sans objet ? |

## 3 · Consolider

1. **Dédoublonner.** Une couleur en dur remontera par `ui` **et** par `dette`. Un constat, une
   entrée, avec les dimensions qui l'ont vu.
2. **Écarter les faux positifs** : tout constat qui tombe sur une exception documentée de
   `CLAUDE.md`, ou qui n'a pas de `fichier:ligne`, ne passe pas. Dis dans le rapport combien tu
   en as écartés — c'est une mesure de la qualité de l'audit, pas une gêne.
3. ⚠️ **Ne pas gonfler.** Si une dimension rend « RAS », le rapport écrit « RAS » et ce qui a
   été vérifié pour l'affirmer. Un audit qui trouve toujours six problèmes est un audit qui en
   invente.
4. **Classer par coût de l'inaction**, pas par facilité de correction. Ce qui mord aujourd'hui
   passe devant ce qui est rapide à faire.

## 4 · Écrire et rendre la main

Écris `docs/audits/<AAAA-MM-JJ>.md` depuis `docs/audits/_template.md`.

Termine en présentant les **lots candidats** classés, chacun avec son périmètre et sa taille
estimée. Puis **arrête-toi** : l'utilisateur choisit. Un lot retenu part ensuite dans
`/orchestrate <id-du-lot>`, qui reprend le périmètre comme Objectif.

⚠️ **Tu ne décides pas ce qui sera fait, et tu n'enchaînes pas sur `/orchestrate` de toi-même.**

## Ce que l'audit ne fait pas

- Il ne modifie rien, pas même une faute de frappe.
- Il ne propose pas de défaire une décision gravée dans `CLAUDE.md`. Une décision dont le coût
  a changé remonte en **Décision à rouvrir**, adressée à l'utilisateur.
- Il ne remplace pas `/code-review`, qui reste le bon outil pour une passe fine sur un diff ou
  un chemin précis.
