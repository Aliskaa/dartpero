import type { PlayerId } from '../../domain/value-objects/ids'
import type { RandomSource } from '../ports/driven/RandomSource'
import type { ShuffleOrder } from '../ports/driving/ShuffleOrder'
import { shufflePlayers } from './shufflePlayers'

export class ShuffleOrderUseCase implements ShuffleOrder {
  constructor(private readonly random: RandomSource) {}

  execute(playerIds: readonly PlayerId[]): readonly PlayerId[] {
    return shufflePlayers(playerIds, this.random)
  }
}
