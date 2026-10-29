import type { MirrorView } from '@/core/application/ports/driving/WatchMatch'
import { GameModes } from '@/core/domain/games'
import type { X01State } from '@/core/domain/games/x01/rules'
import type { MomentMiroir } from '@/ui/composants/commun/Miroir'
import {
  LIBELLE_MATCH_NUL,
  resteA,
  TITRE_MOMENT_180,
  TITRE_MOMENT_BUST,
  TITRE_MOMENT_MANCHE,
  TITRE_MOMENT_PARTIE,
} from '@/ui/labels'
import { nomMiroir } from './vueMiroir'

const manchesGagnees = (state: X01State): number =>
  state.milestones.filter((jalon) => jalon.type === 'LegWon').length

/** Le moment de la dernière volée du journal, seulement quand le journal vient de gagner une volée (jamais à l'entraînement). */
export const momentMiroir = (
  avant: MirrorView | null,
  apres: MirrorView | null,
): MomentMiroir | null => {
  if (avant === null || apres === null || avant.record.id !== apres.record.id) return null
  const volees = GameModes.visitCount(apres.state)
  if (volees !== GameModes.visitCount(avant.state) + 1) return null
  const cle = `${apres.record.id}-${volees}`
  const etat = apres.state

  switch (etat.mode) {
    case 'CHECKOUT_PRACTICE':
      return null
    case 'X01': {
      const volee = etat.history.at(-1)
      if (!volee || avant.state.mode !== 'X01') return null
      if (etat.winnerId !== null) {
        return {
          cle,
          titre: TITRE_MOMENT_PARTIE,
          detail: nomMiroir(apres, etat.winnerId),
          ton: 'laiton',
        }
      }
      const nom = nomMiroir(apres, volee.playerId)
      if (manchesGagnees(etat) > manchesGagnees(avant.state)) {
        return { cle, titre: TITRE_MOMENT_MANCHE, detail: nom, ton: 'laiton' }
      }
      if (volee.outcome === 'BUSTED') {
        return {
          cle,
          titre: TITRE_MOMENT_BUST,
          detail: resteA(nom, volee.remainingAfter),
          ton: 'bust',
        }
      }
      if (volee.scored === 180) return { cle, titre: TITRE_MOMENT_180, detail: nom, ton: 'laiton' }
      return null
    }
    case 'CRICKET':
    case 'TOUR_DU_MONDE':
    case 'KILLER': {
      if (!etat.finished) return null
      const detail = etat.winnerId === null ? LIBELLE_MATCH_NUL : nomMiroir(apres, etat.winnerId)
      return { cle, titre: TITRE_MOMENT_PARTIE, detail, ton: 'laiton' }
    }
    default: {
      const jamais: never = etat
      return jamais
    }
  }
}
