import type { VisitOutcome } from '../entities/Visit'
import { Dart } from '../value-objects/Dart'
import type { SortieRules } from './checkout'

/**
 * Comment une volée se résout face à un reste — **la** règle centrale des
 * fléchettes, et la plus facile à se tromper.
 *
 * Ce module est **transverse** : le X01 s'en sert pour décompter un 501,
 * l'entraînement au checkout pour juger une manche. Une seule implémentation,
 * donc aucune chance que les deux divergent — c'est précisément le genre
 * d'écart qu'un joueur ne remarquerait qu'après avoir perdu une partie.
 *
 * Il ne dépend volontairement d'aucune configuration de mode, seulement des
 * deux options qui changent le résultat.
 */
export type OuvertureRules = SortieRules & {
  readonly doubleIn: boolean
}

export type VisitResolution = {
  readonly outcome: VisitOutcome
  readonly scored: number
  readonly remainingAfter: number
  readonly hasOpenedAfter: boolean
  readonly dartsUsed: number
}

/**
 * Bust : la volée entière est annulée et le score revient à sa valeur d'avant
 * la visite. L'ouverture (`double in`) est annulée elle aussi — la visite n'a
 * pas eu lieu, donc le double d'ouverture non plus.
 */
const bust = (remainingBefore: number, hasOpened: boolean, dartsUsed: number): VisitResolution => ({
  outcome: 'BUSTED',
  scored: 0,
  remainingAfter: remainingBefore,
  hasOpenedAfter: hasOpened,
  dartsUsed,
})

/**
 * Voir la spécification dans CLAUDE.md.
 *
 * Bust si : reste < 0, reste == 1 (infinissable sur un double), ou reste == 0
 * sans que la dernière fléchette soit un double.
 */
export const resolveVisit = (
  config: OuvertureRules,
  remainingBefore: number,
  hasOpened: boolean,
  darts: readonly Dart[],
): VisitResolution => {
  let current = remainingBefore
  let opened = hasOpened
  let dartsUsed = 0

  for (const dart of darts) {
    dartsUsed += 1

    // Double in : tant qu'aucun double n'a été touché, la fléchette est perdue.
    if (config.doubleIn && !opened) {
      if (!Dart.isDouble(dart)) continue
      opened = true
    }

    const next = current - Dart.points(dart)

    if (next < 0) return bust(remainingBefore, hasOpened, dartsUsed)

    if (next === 0) {
      if (!config.doubleOut || Dart.isDouble(dart)) {
        return {
          outcome: 'CHECKOUT',
          scored: remainingBefore,
          remainingAfter: 0,
          hasOpenedAfter: opened,
          dartsUsed,
        }
      }
      return bust(remainingBefore, hasOpened, dartsUsed)
    }

    if (next === 1 && config.doubleOut) return bust(remainingBefore, hasOpened, dartsUsed)

    current = next
  }

  return {
    outcome: 'SCORED',
    scored: remainingBefore - current,
    remainingAfter: current,
    hasOpenedAfter: opened,
    dartsUsed,
  }
}
