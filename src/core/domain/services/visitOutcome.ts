import type { VisitOutcome } from '../entities/Visit'
import { Dart } from '../value-objects/Dart'
import type { SortieRules } from './checkout'

// Module transverse partagé par le X01 et l'entraînement : une seule implémentation du bust/checkout.
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

// Bust : volée annulée, y compris l'ouverture `double in`.
const bust = (remainingBefore: number, hasOpened: boolean, dartsUsed: number): VisitResolution => ({
  outcome: 'BUSTED',
  scored: 0,
  remainingAfter: remainingBefore,
  hasOpenedAfter: hasOpened,
  dartsUsed,
})

/** Bust si reste < 0, reste == 1 (double out) ou reste == 0 sans double (double out). */
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

    // Double in : tant qu'aucun double n'est touché, la fléchette est perdue.
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
