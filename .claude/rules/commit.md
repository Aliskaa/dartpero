# Commits

**Quand :** création d'un commit.

- **Demander l'accord de l'utilisateur avant de committer.** Le lot se
  prépare et se vérifie seul ; l'appui sur le bouton, c'est lui.
- **Un commit par lot** `/orchestrate`, jamais deux lots mélangés.
- **Une branche par lot** : `lot/<id-du-lot>`, partie de `main`. On
  committe **sur la branche du lot**, jamais directement sur `main` ;
  la fusion (`git merge --ff-only`) est une seconde demande d'accord.
  Vérifier `git branch --show-current` avant de committer.
- Lire `git status` avant d'indexer et signaler tout fichier qui n'est
  pas le fruit du lot. Jamais de `git add -A` à l'aveugle
  (`docs/exemples/` est hors dépôt pour une raison).
- Conventional Commits : `type(scope): sujet`, sujet **en français**,
  court, minuscules, < 72 caractères, sans point final.
- Types usuels : `feat`, `fix`, `docs`, `refactor`, `test`, `chore`,
  `build`, `perf`.
- Scopes vus dans l'historique : `ui`, `ux`, `stats`, `players`,
  `resume`, `theme`, `build`, `docs`, un mode de jeu (`tour-du-monde`,
  `cricket`, `x01`), ou `lot N` pour un lot du plan.
- Pas de push : le repo n'a pas de remote, le déploiement passe par
  `npm run firebase:deploy`.
