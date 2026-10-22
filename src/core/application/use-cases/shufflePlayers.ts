import type { PlayerId } from '../../domain/value-objects/ids'
import type { RandomSource } from '../ports/driven/RandomSource'

// Fisher-Yates : un tri sur clé aléatoire ne rendrait pas les n! permutations équiprobables.
export const shufflePlayers = (
  playerIds: readonly PlayerId[],
  random: RandomSource,
): readonly PlayerId[] => {
  const melange = [...playerIds]

  for (let rang = melange.length - 1; rang > 0; rang -= 1) {
    const tire = random.nextInt(rang + 1)
    const courant = melange[rang]
    const echange = melange[tire]
    if (courant === undefined || echange === undefined) continue
    melange[rang] = echange
    melange[tire] = courant
  }

  return melange
}
