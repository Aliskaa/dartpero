import { DomainError } from '../DomainError'
import { SEGMENT_NUMBERS, type Segment } from '../value-objects/Dart'

/**
 * Le **Tour du monde** : on part du 20, on descend jusqu'au 1, on finit sur la
 * bulle. Aucune distinction simple / double / triple — toucher le secteur
 * suffit, c'est ce qui en fait un jeu de précision pure plutôt que d'arithmétique.
 */
export const TOUR_DU_MONDE_TARGETS: readonly Segment[] = [...[...SEGMENT_NUMBERS].reverse(), 'BULL']

/**
 * La liste des cibles est **dans la configuration**, donc dans le journal.
 *
 * Verbeux ? Un peu. Mais une partie jouée aujourd'hui restera rejouable à
 * l'identique même si l'on change un jour le parcours par défaut — et ça ouvre
 * la porte à des variantes (tour rapide, ordre croissant) sans toucher aux
 * règles.
 */
export type TourDuMondeConfig = {
  readonly targets: readonly Segment[]
}

export type TourDuMondeConfigInput = {
  readonly targets?: readonly Segment[]
}

export const TourDuMondeConfig = {
  create({ targets = TOUR_DU_MONDE_TARGETS }: TourDuMondeConfigInput = {}): TourDuMondeConfig {
    if (targets.length === 0) throw new DomainError('A Tour du monde needs at least one target')
    return { targets: [...targets] }
  },
}
