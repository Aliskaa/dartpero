import type { Clock } from '@/core/application/ports/driven/Clock'
import type { IdGenerator } from '@/core/application/ports/driven/IdGenerator'
import type { MatchRepository } from '@/core/application/ports/driven/MatchRepository'
import type { PlayerRepository } from '@/core/application/ports/driven/PlayerRepository'
import type { GetCheckoutSuggestion } from '@/core/application/ports/driving/GetCheckoutSuggestion'
import type { GetMatchHistory } from '@/core/application/ports/driving/GetMatchHistory'
import type { GetMatchState } from '@/core/application/ports/driving/GetMatchState'
import type { GetMatchStats } from '@/core/application/ports/driving/GetMatchStats'
import type { GetOngoingMatch } from '@/core/application/ports/driving/GetOngoingMatch'
import type { ManagePlayers } from '@/core/application/ports/driving/ManagePlayers'
import type { RecordVisit } from '@/core/application/ports/driving/RecordVisit'
import type { StartMatch } from '@/core/application/ports/driving/StartMatch'
import type { UndoLastVisit } from '@/core/application/ports/driving/UndoLastVisit'
import { GetCheckoutSuggestionUseCase } from '@/core/application/use-cases/GetCheckoutSuggestionUseCase'
import { GetMatchHistoryUseCase } from '@/core/application/use-cases/GetMatchHistoryUseCase'
import { GetMatchStateUseCase } from '@/core/application/use-cases/GetMatchStateUseCase'
import { GetMatchStatsUseCase } from '@/core/application/use-cases/GetMatchStatsUseCase'
import { GetOngoingMatchUseCase } from '@/core/application/use-cases/GetOngoingMatchUseCase'
import { ManagePlayersUseCase } from '@/core/application/use-cases/ManagePlayersUseCase'
import { RecordVisitUseCase } from '@/core/application/use-cases/RecordVisitUseCase'
import { StartMatchUseCase } from '@/core/application/use-cases/StartMatchUseCase'
import { UndoLastVisitUseCase } from '@/core/application/use-cases/UndoLastVisitUseCase'
import { DexieMatchRepository } from '@/infrastructure/dexie/DexieMatchRepository'
import { DexiePlayerRepository } from '@/infrastructure/dexie/DexiePlayerRepository'
import { createDatabase } from '@/infrastructure/dexie/database'
import { CryptoIdGenerator } from '@/infrastructure/system/CryptoIdGenerator'
import { SystemClock } from '@/infrastructure/system/SystemClock'

/**
 * COMPOSITION ROOT — le seul endroit du projet où un port rencontre son adapter.
 *
 * Nulle part ailleurs on ne doit voir `new Dexie…` ni `Date.now()`. C'est ce qui
 * permet de rejouer toute l'application en mémoire dans les tests, et d'ajouter
 * un jour une synchro distante en changeant une seule ligne ici.
 */
export type Dependencies = {
  readonly matches: MatchRepository
  readonly players: PlayerRepository
  readonly clock: Clock
  readonly ids: IdGenerator
}

/** Tout ce que l'UI a le droit d'appeler. Rien d'autre ne lui est exposé. */
export type Services = {
  readonly startMatch: StartMatch
  readonly recordVisit: RecordVisit
  readonly undoLastVisit: UndoLastVisit
  readonly getMatchState: GetMatchState
  readonly getCheckoutSuggestion: GetCheckoutSuggestion
  readonly getMatchStats: GetMatchStats
  readonly getMatchHistory: GetMatchHistory
  readonly getOngoingMatch: GetOngoingMatch
  readonly managePlayers: ManagePlayers
}

export const createServices = ({ matches, players, clock, ids }: Dependencies): Services => ({
  startMatch: new StartMatchUseCase(matches, players, clock, ids),
  recordVisit: new RecordVisitUseCase(matches, clock),
  undoLastVisit: new UndoLastVisitUseCase(matches, clock),
  getMatchState: new GetMatchStateUseCase(matches),
  getCheckoutSuggestion: new GetCheckoutSuggestionUseCase(),
  getMatchStats: new GetMatchStatsUseCase(matches),
  getMatchHistory: new GetMatchHistoryUseCase(matches, players),
  getOngoingMatch: new GetOngoingMatchUseCase(matches, players),
  managePlayers: new ManagePlayersUseCase(players, ids),
})

/** Câblage réel : IndexedDB, horloge système, identifiants cryptographiques. */
export const createBrowserDependencies = (): Dependencies => {
  const db = createDatabase()
  return {
    matches: new DexieMatchRepository(db),
    players: new DexiePlayerRepository(db),
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
  }
}

export const createBrowserServices = (): Services => createServices(createBrowserDependencies())
