import type { CSSProperties } from 'react'
import type { GameModeId } from '@/core/domain/games'

/**
 * Accent secondaire par mode — purement UI.
 *
 * Le laiton reste la couleur de l'app (CTA, enseigne). Chaque mode pose une
 * teinte discrète sur le halo du joueur actif, le titre du bandeau et les
 * pastilles de sélection — jamais derrière un chiffre de score.
 *
 * Teintes alignées sur la palette joueurs (lagon / cuivre / prune) pour ne
 * pas inventer une deuxième charte.
 */
export type AccentMode = {
  readonly fond: string
  readonly clair: string
}

export const ACCENTS_MODE: Record<GameModeId, AccentMode> = {
  X01: { fond: '#C9A227', clair: '#F2DD93' },
  TOUR_DU_MONDE: { fond: '#2C6E9B', clair: '#5FA6D1' },
  CRICKET: { fond: '#C1720F', clair: '#E7A248' },
  CHECKOUT_PRACTICE: { fond: '#8A4FA8', clair: '#B683CE' },
}

/** Variables CSS consommées par `text-accent-mode`, le halo, etc. */
export const variablesAccent = (mode: GameModeId): CSSProperties => {
  const accent = ACCENTS_MODE[mode]
  return {
    '--color-accent-mode': accent.fond,
    '--color-accent-mode-clair': accent.clair,
  } as CSSProperties
}
