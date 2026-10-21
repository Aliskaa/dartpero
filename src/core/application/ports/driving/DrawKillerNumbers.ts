import type { SegmentNumber } from '../../../domain/value-objects/Dart'

/**
 * Tire au sort des numéros de Killer, tous différents, de 1 à 20 (jamais la
 * bulle), à l'étape 2 de Nouvelle partie : le tirage est déjà fait à
 * l'arrivée, et « Tirer au sort » le refait. Synchrone : un geste sans I/O.
 *
 * `excluded` : les numéros déjà pris (un joueur ajouté reçoit un numéro libre).
 * `DomainError` s'il ne reste pas assez de numéros libres.
 */
export interface DrawKillerNumbers {
  execute(input: {
    readonly count: number
    readonly excluded?: readonly SegmentNumber[]
  }): readonly SegmentNumber[]
}
