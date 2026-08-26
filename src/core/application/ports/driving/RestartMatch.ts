import type { MatchId } from '../../../domain/value-objects/ids'

/**
 * « On remet ça » : relancer une partie **à l'identique** — mêmes joueurs, même
 * ordre de passage, mêmes règles — dans un journal tout neuf.
 *
 * C'est le geste le plus fréquent d'une soirée : on enchaîne quatre ou cinq
 * parties avec les mêmes potes et les mêmes réglages. Sans ce port, l'écran de
 * résumé n'avait à offrir qu'un formulaire de configuration remis à zéro.
 *
 * Le port ne prend que l'identifiant : tout le reste se lit dans l'événement
 * d'ouverture du journal, qui porte déjà la configuration et la composition.
 */
export interface RestartMatch {
  execute(matchId: MatchId): Promise<MatchId>
}
