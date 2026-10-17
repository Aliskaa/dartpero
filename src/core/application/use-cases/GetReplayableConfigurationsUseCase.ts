import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type {
  GetReplayableConfigurations,
  ReplayableConfiguration,
} from '../ports/driving/GetReplayableConfigurations'
import type { MatchSummary } from '../ports/driving/MatchSummary'
import { nameIndex, summarize } from './summarize'

/**
 * La fenêtre d'historique lue, comme la liste de Parties : « N fois » compte
 * dans cette fenêtre, pas sur toute la base (risque accepté).
 */
export const REPLAY_WINDOW = 50

/**
 * La clé d'un groupe : le mode, ses réglages, les joueurs **triés**. L'ordre de
 * passage et le nom n'y sont pas. Les cibles (Cricket, Tour du monde) et la plage
 * des restes y sont : deux parties aux cibles différentes ne sont pas la même
 * configuration, et l'UI écarte celles qu'elle ne sait pas reproduire.
 */
const groupKey = (summary: MatchSummary): string => {
  const players = summary.players
    .map((player) => String(player.playerId))
    .sort()
    .join(',')
  switch (summary.mode) {
    case 'X01': {
      const { startingScore, legsToWin, setsToWin, doubleOut, doubleIn } = summary.config
      return ['X01', startingScore, legsToWin, setsToWin, doubleOut, doubleIn, players].join('|')
    }
    case 'CRICKET':
      return ['CRICKET', summary.config.variant, summary.config.targets.join(','), players].join(
        '|',
      )
    case 'TOUR_DU_MONDE':
      return ['TOUR_DU_MONDE', summary.config.targets.join(','), players].join('|')
    case 'CHECKOUT_PRACTICE': {
      const { rounds, minTarget, maxTarget } = summary.config
      return ['CHECKOUT_PRACTICE', rounds, minTarget, maxTarget, players].join('|')
    }
  }
}

export class GetReplayableConfigurationsUseCase implements GetReplayableConfigurations {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
  ) {}

  async execute(): Promise<readonly ReplayableConfiguration[]> {
    const [records, names] = await Promise.all([
      this.matches.listRecent(REPLAY_WINDOW),
      nameIndex(this.players),
    ])

    const summaries = records
      .map((record) => summarize(record, names))
      // Un profil supprimé : la configuration ne se rejouerait pas, elle est écartée
      // avant la fusion — le compteur ne compte que les parties gardées.
      .filter((summary) => summary.players.every((player) => player.name !== null))
      // Tri stable, le plus récent d'abord : le premier de chaque groupe en est le représentant.
      .sort((a, b) => b.createdAt - a.createdAt)

    const groups = new Map<string, ReplayableConfiguration>()
    for (const summary of summaries) {
      const key = groupKey(summary)
      const existing = groups.get(key)
      if (existing) {
        groups.set(key, { ...existing, count: existing.count + 1 })
        continue
      }
      groups.set(key, {
        key,
        playerIds: summary.players.map((player) => player.playerId),
        count: 1,
        lastPlayedAt: summary.createdAt,
        mode: summary.mode,
        config: summary.config,
      } as ReplayableConfiguration)
    }
    return [...groups.values()]
  }
}
