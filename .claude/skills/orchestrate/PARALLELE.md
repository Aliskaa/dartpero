# Lots en parallèle (worktrees)

Référence de `SKILL.md` : à lire **seulement** si l'utilisateur demande de mener deux lots en parallèle.

Mode **expérimental**, ouvert à la demande de l'utilisateur (2026-10-15).
Un lot = un worktree = une session Claude. Le dépôt principal
(`c:\Users\kevin\Documents\Flechettes`) reste sur `main` et sert à la
fusion.

1. **Création** (depuis le dépôt principal, `main` propre) :
   `git worktree add ..\Flechettes-<id> -b lot/<id> main`. Puis, dans le
   worktree : `npm install`, et copier `.claude/settings.local.json`
   (ignoré par git, donc absent) avec `Copy-Item`. Les skills tiers non
   suivis (`.claude/skills/impeccable/`, `emil-design-eng/`) y manquent :
   ne pas les recréer.
2. **Session** : l'utilisateur ouvre Claude **dans le worktree**, puis
   `/intake <id>` et `/orchestrate <id> <niveau>`. La branche `lot/<id>`
   y est déjà active : ne pas faire `git switch` ; vérifier
   `git branch --show-current`. Noter dans `00-orchestration.md` le
   chemin du worktree et le **port** réservé aux captures du Dev.
3. **Ports** : chaque lot réserve un port de serveur temporaire distinct
   (5201, 5202…), passé au `dev` dans son brief.
4. **Fichiers partagés**, conflits attendus : `src/ui/labels.ts`,
   `docs/CHARTE_GRAPHIQUE.md`, l'étude de `docs/prospective/`,
   `.claude/CONVENTIONS.md`, `.ai/architecture-context.md`. Ne pas les
   « devancer » : chaque lot les modifie comme s'il était seul.
5. **Fusion** : depuis le worktree, `git switch main` est impossible
   (`main` est actif dans le dépôt principal). La fusion se fait dans le
   dépôt principal : `git -C <dépôt principal> merge --ff-only lot/<id>`,
   après avoir vérifié que son arbre est propre.
6. **Second lot à fusionner** (`main` a bougé, `--ff-only` refuse) :
   **stop**, puis, avec l'accord de l'utilisateur, dans le worktree :
   `git rebase main`. Résolution :
   - `labels.ts`, charte, CONVENTIONS, étude : **garder les deux
     apports** ; jamais en jeter un sans le dire ;
   - `.ai/architecture-context.md` : prendre la version de `main`, puis
     **régénérer** l'index (brief `architecture-context`) ;
   - un conflit de **code** qui demande un choix produit ou technique non
     évident : stop, demander.

   Puis relancer lint, typecheck, `npx vitest run`, build et le Grep
   d'encodage ; intégrer la régénération dans le commit du lot
   (`git commit --amend`, **après accord**), puis fusion `--ff-only`.
7. **Fin** : après fusion et sur accord, `git worktree remove
   ..\Flechettes-<id>` ; la branche est gardée.
8. **Planches** : le scratchpad est propre à chaque session. Les planches
   validées vivent dans `docs/maquettes/` du **dépôt principal** (ignoré
   par git, donc absent des worktrees ; voir son `LISEZMOI.md`) : une
   demande ou un brief cite le chemin absolu
   `C:\Users\kevin\Documents\Flechettes\docs\maquettes\<dossier>\`,
   jamais le scratchpad d'une session. Une nouvelle planche y est copiée
   dès sa validation, même depuis un worktree ; deux lots en parallèle
   écrivent chacun dans **son** dossier.
9. **Mémoire** : la mémoire de Claude est rangée par dossier ; une
   session dans un worktree ne voit pas celle du dépôt principal. Les
   règles vitales sont dans les fichiers versionnés (`CLAUDE.md`,
   `.claude/`), pas en mémoire.

Dans `06-echanges.md`, dire que le lot a tourné en parallèle, avec quel
autre lot, et les conflits résolus au rebase.
