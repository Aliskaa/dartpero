import { DomainError } from '../DomainError'

// Ne sert qu'à accorder « éliminé / éliminée » au Killer (garde `genreBoundary.test.ts`).
// ⚠️ Valeurs persistées, jamais renommées ; « non précisé » = clé absente, accord masculin.
export const PLAYER_GENDERS = ['MASCULINE', 'FEMININE'] as const

export type PlayerGender = (typeof PLAYER_GENDERS)[number]

export const PlayerGender = {
  of(valeur: string): PlayerGender {
    const genre = PLAYER_GENDERS.find((connu) => connu === valeur)
    if (!genre) throw new DomainError(`Unknown player gender: ${valeur}`)
    return genre
  },
}
