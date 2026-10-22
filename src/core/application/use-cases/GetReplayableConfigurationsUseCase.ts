import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type {
  GetReplayableConfigurations,
  ReplayableConfiguration,
} from '../ports/driving/GetReplayableConfigurations'
import type { MatchSummary } from '../ports/driving/MatchSummary'
import { nameIndex, summarize } from './summarize'

/** Fenêtre d'historique lue : « N fois » compte dans cette fenêtre, pas sur toute la base. */
export const REPLAY_WINDOW = 50

/** Clé d'un groupe : mode, réglages (cibles comprises), joueurs triés ; ni ordre de passage ni nom. */
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
    case 'KILLER': {
      // Ni les numéros, ni l'ordre, ni le nom : « Rejouer » en tire de nouveaux.
      const { startingLives, selfHitCostsLives } = summary.config
      return ['KILLER', startingLives, selfHitCostsLives, players].join('|')
    }
    case 'CHECKOUT_PRACTICE': {
      const { rounds, minTarget, maxTarget } = summary.config
      return ['CHECKOUT_PRACTICE', rounds, minTarget, maxTarget, players].join('|')
    }
    default: {
      const jamais: never = summary
      return jamais
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
      // Profil supprimé : configuration écartée avant la fusion.
      .filter((summary) => summary.players.every((player) => player.name !== null))
      // Le plus récent d'abord : il représente son groupe.
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
