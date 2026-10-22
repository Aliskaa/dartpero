import { DomainError } from '../../domain/DomainError'
import { KILLER_NUMBERS } from '../../domain/games/killer/config'
import type { SegmentNumber } from '../../domain/value-objects/Dart'
import type { RandomSource } from '../ports/driven/RandomSource'

// ⚠️ Le résultat est écrit dans l'ouverture de la partie, jamais retiré au rejeu.
export const drawKillerNumbers = (
  count: number,
  excluded: readonly SegmentNumber[],
  random: RandomSource,
): readonly SegmentNumber[] => {
  if (!Number.isInteger(count) || count < 0) {
    throw new DomainError(`Cannot draw ${count} Killer numbers`)
  }
  const libres = KILLER_NUMBERS.filter((numero) => !excluded.includes(numero))
  if (count > libres.length) {
    throw new DomainError(`Only ${libres.length} Killer numbers left, ${count} needed`)
  }

  const tires: SegmentNumber[] = []
  for (let rang = 0; rang < count; rang += 1) {
    const [tire] = libres.splice(random.nextInt(libres.length), 1)
    if (tire === undefined) throw new DomainError('Random source out of range')
    tires.push(tire)
  }
  return tires
}
