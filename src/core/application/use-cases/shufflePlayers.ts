import type { PlayerId } from '../../domain/value-objects/ids'
import type { RandomSource } from '../ports/driven/RandomSource'

/**
 * Rebat l'ordre de passage, une fois, au lancement.
 *
 * ⚠️ Le tirage a lieu **avant** l'écriture du journal, et son résultat y est
 * inscrit tel quel. C'est la même règle qu'au lot 5b pour les cibles
 * d'entraînement : ce qui est tiré est écrit, jamais rejoué. Sans ça, annuler
 * une volée redistribuerait l'ordre des joueurs en pleine partie — et rejouer
 * une partie ancienne ne donnerait pas la partie qu'on a jouée.
 *
 * Fisher-Yates : chacune des n! permutations est également probable. Un tri sur
 * une clé aléatoire, la version qu'on écrit d'instinct, ne l'est pas.
 */
export const shufflePlayers = (
  playerIds: readonly PlayerId[],
  random: RandomSource,
): readonly PlayerId[] => {
  const melange = [...playerIds]

  for (let rang = melange.length - 1; rang > 0; rang -= 1) {
    const tire = random.nextInt(rang + 1)
    const courant = melange[rang]
    const echange = melange[tire]
    // Le garde ne sert qu'à TypeScript : les deux index sont dans les bornes.
    if (courant === undefined || echange === undefined) continue
    melange[rang] = echange
    melange[tire] = courant
  }

  return melange
}
