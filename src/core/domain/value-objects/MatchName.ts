import { DomainError } from '../DomainError'
import type { Branded } from './ids'

export const MATCH_NAME_MAX_LENGTH = 30

/** ⚠️ Seul un nom tapé existe ici : le nom par défaut est un libellé calculé, jamais écrit. */
export type MatchName = Branded<string, 'MatchName'>

export const MatchName = {
  /** Vide après `trim()` → `null`. ⚠️ Trop long → erreur, jamais tronqué ; espaces intérieurs gardés. */
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
