import type { RecordVisitResult } from '@/core/application/ports/driving/RecordVisit'
import type { MomentCelebratifData } from '@/ui/composants/commun/MomentCelebratif'
import { pluriel, TITRE_MOMENT_MANCHE } from '@/ui/labels'

/**
 * Déduit le bandeau de récompense d'une volée X01.
 * Priorité : partie > set > manche (un checkout est déjà une manche).
 */
export const momentDepuisVoleeX01 = (
  resultat: RecordVisitResult | null,
  nomVainqueur?: string,
): MomentCelebratifData | null => {
  if (!resultat) return null

  const { visit, milestones } = resultat
  const match = milestones.find((m) => m.type === 'MatchFinished')
  if (match && match.type === 'MatchFinished') {
    return {
      cle: `match-${resultat.state.history.length}`,
      titre: 'Partie !',
      detail: nomVainqueur,
    }
  }

  const set = milestones.find((m) => m.type === 'SetWon')
  if (set && set.type === 'SetWon') {
    return {
      cle: `set-${set.setNumber}-${resultat.state.history.length}`,
      titre: 'Set !',
      detail: nomVainqueur ? `${nomVainqueur} · set ${set.setNumber + 1}` : undefined,
    }
  }

  const leg = milestones.find((m) => m.type === 'LegWon')
  if (leg && leg.type === 'LegWon') {
    return {
      cle: `leg-${leg.legNumber}-${resultat.state.history.length}`,
      titre: TITRE_MOMENT_MANCHE,
      detail: nomVainqueur
        ? `${nomVainqueur} · ${pluriel(leg.dartsUsed, 'fléchette', 'fléchettes')}`
        : pluriel(leg.dartsUsed, 'fléchette', 'fléchettes'),
    }
  }

  if (visit.outcome === 'CHECKOUT') {
    return {
      cle: `sortie-${resultat.state.history.length}`,
      titre: 'Checkout !',
      detail: String(visit.scored),
    }
  }

  return null
}
