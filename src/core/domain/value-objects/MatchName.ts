import { DomainError } from '../DomainError'
import type { Branded } from './ids'

/** Lu en petit dans le bandeau d'une partie : au-delà, c'est un roman. */
export const MATCH_NAME_MAX_LENGTH = 30

/**
 * Le nom **tapé** d'une partie (« Finale des potes »).
 *
 * ⚠️ Seul un nom tapé existe dans le domaine. Le nom par défaut
 * (« Dimanche soir ») est un **libellé**, recalculé à l'affichage depuis la
 * date de création : il ne passe jamais par ici et ne s'écrit jamais.
 */
export type MatchName = Branded<string, 'MatchName'>

export const MatchName = {
  /**
   * Nettoie un nom tapé.
   *
   * - espaces de début et de fin retirés (`trim()`) ;
   * - vide après nettoyage → `null` : pas de nom, ce n'est pas une erreur ;
   * - plus de `MATCH_NAME_MAX_LENGTH` caractères → `DomainError`, **jamais
   *   tronqué** : couper en silence enregistrerait autre chose que ce qui a été
   *   tapé.
   *
   * La longueur se compte en unités UTF-16 (`.length`), comme `maxLength` du
   * champ. ⚠️ Volontairement **aucune autre normalisation** : à la différence de
   * `Player.cleanName`, les espaces intérieurs sont gardés tels quels — le nom
   * n'est pas une clé de recherche, c'est ce que le joueur a écrit.
   */
  of(raw: string): MatchName | null {
    const propre = raw.trim()
    if (propre === '') return null
    if (propre.length > MATCH_NAME_MAX_LENGTH) {
      throw new DomainError(
        `Match name cannot exceed ${MATCH_NAME_MAX_LENGTH} characters, got ${propre.length}`,
      )
    }
    return propre as MatchName
  },
}
