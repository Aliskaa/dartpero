import type { CSSProperties } from 'react'
import type { GameModeId } from '@/core/domain/games'

/**
 * Accent secondaire par mode — purement UI.
 *
 * Le laiton reste la couleur de l'app (CTA, enseigne). Chaque mode pose une
 * teinte discrète sur la ligne du joueur actif, le titre du bandeau et les
 * pastilles de sélection — jamais derrière un chiffre de score.
 *
 * ⚠️ Les teintes ne sont plus écrites ici mais dans `src/index.css`, en
 * `--accent-*`, **parce qu'elles doivent suivre le thème**. Ces valeurs
 * partent dans un `style=` inline, qu'aucune règle CSS ne peut retourner :
 * codées en dur, le jaune du X01 (1,84:1 sur du papier) rendrait le filet
 * « c'est ton tour » invisible en thème clair. Un `var()` s'y résout au
 * moment du rendu, donc dans le bon thème.
 */
export type AccentMode = {
  readonly fond: string
  readonly clair: string
}

export const ACCENTS_MODE: Record<GameModeId, AccentMode> = {
  X01: { fond: 'var(--accent-x01)', clair: 'var(--accent-x01-clair)' },
  TOUR_DU_MONDE: {
    fond: 'var(--accent-tour-du-monde)',
    clair: 'var(--accent-tour-du-monde-clair)',
  },
  CRICKET: { fond: 'var(--accent-cricket)', clair: 'var(--accent-cricket-clair)' },
  CHECKOUT_PRACTICE: {
    fond: 'var(--accent-checkout-practice)',
    clair: 'var(--accent-checkout-practice-clair)',
  },
}

/** Variables CSS consommées par `text-accent-mode`, la ligne au lancer, etc. */
export const variablesAccent = (mode: GameModeId): CSSProperties => {
  const accent = ACCENTS_MODE[mode]
  return {
    '--color-accent-mode': accent.fond,
    '--color-accent-mode-clair': accent.clair,
  } as CSSProperties
}
