import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { nomJoueur } from '@/ui/labels'

/**
 * Le minimum qu'un état de partie doit exposer pour savoir qui prend la main (structurel, partagé par les modes de groupe).
 * `finished` manque au X01 (`winnerId`) ; le Tour du monde a les deux (nul possible) : champs optionnels lus ensemble.
 */
type TourDeTable = {
  readonly players: readonly { readonly playerId: PlayerId }[]
  readonly currentPlayerIndex: number
  readonly finished?: boolean
  readonly winnerId?: PlayerId | null
}

/** Le nom de celui qui prend la main, ou `null` (partie terminée ou solo). */
export const prochainJoueur = (
  state: TourDeTable,
  profils: ReadonlyMap<PlayerId, Player>,
): string | null => {
  if (state.finished === true || (state.winnerId ?? null) !== null) return null
  if (state.players.length < 2) return null

  const suivant = state.players[state.currentPlayerIndex]
  return suivant ? nomJoueur(profils.get(suivant.playerId)?.name ?? null) : null
}
