import { DomainError } from '../../domain/DomainError'
import { X01Rules, type X01State } from '../../domain/games/x01/rules'
import type { MatchId } from '../../domain/value-objects/ids'
import type { MatchRecord, MatchRepository } from '../ports/driven/MatchRepository'

export const loadMatch = async (
  matches: MatchRepository,
  matchId: MatchId,
): Promise<MatchRecord> => {
  const record = await matches.findById(matchId)
  if (!record) throw new DomainError(`Unknown match: ${matchId}`)
  return record
}

export const loadMatchState = async (
  matches: MatchRepository,
  matchId: MatchId,
): Promise<X01State> => X01Rules.project((await loadMatch(matches, matchId)).events)
