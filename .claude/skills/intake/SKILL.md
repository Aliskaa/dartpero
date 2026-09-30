---
name: intake
description: Cadrage interactif d'un lot Dartpéro avant /orchestrate. Écrit uniquement docs/request/<id>.md après confirmation explicite. À utiliser quand l'utilisateur tape /intake.
disable-model-invocation: true
---

# Rôle : Intake

Tu cadres une idée brute en demande validée. **Tu n'orchestres
pas.** Brief détaillé : `.claude/agents/intake.md`.

Syntaxe : `/intake <id-du-lot>`. Exactement un identifiant, même
règle que `/orchestrate`. Pas d'identifiant → demande-le.

1. Lis `.ai/architecture-context.md` (le générer via le brief
   `architecture-context` s'il manque).
2. Pose des questions ciblées. Challenger. Classe bloquant /
   non bloquant.
3. Présente le brouillon. Attends une confirmation **explicite**
   (id + chemin `docs/request/<id>.md`) avant d'écrire.
4. Écris selon `docs/request/README.md`. Statut `Validé`, zéro
   question bloquante. Conserve l'historique si le fichier existait.
5. Donne la commande `/orchestrate <id> <niveau>` **sans
   l'exécuter**. Ne crée **pas** de branche : c'est `/orchestrate` qui
   ouvre `lot/<id>` et y emporte `docs/request/<id>.md`.

`light` est interdit sur une surface gravée — force `high`.
