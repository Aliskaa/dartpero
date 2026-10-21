import { DomainError } from '../DomainError'

/**
 * Le genre d'un profil, **facultatif** (lot `killer`).
 *
 * Il ne sert qu'à une chose : accorder « éliminé / éliminée » dans les textes
 * du Killer. Aucune statistique, aucun classement, aucun autre jeu ne le lit
 * (garde `tests/architecture/genreBoundary.test.ts`).
 *
 * ⚠️ Liste **fermée** de deux valeurs, **persistées** (IndexedDB, sauvegardes
 * JSON) : elles ne se renomment jamais. « Non précisé » n'est **pas** une
 * valeur : c'est l'absence de la clé — la forme de tout profil existant, sans
 * migration — et elle s'accorde au masculin.
 */
export const PLAYER_GENDERS = ['MASCULINE', 'FEMININE'] as const

export type PlayerGender = (typeof PLAYER_GENDERS)[number]

export const PlayerGender = {
  of(valeur: string): PlayerGender {
    const genre = PLAYER_GENDERS.find((connu) => connu === valeur)
    if (!genre) throw new DomainError(`Unknown player gender: ${valeur}`)
    return genre
  },
}
