import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { nomJoueur } from '@/ui/labels'

/**
 * Le minimum qu'un état de partie doit exposer pour qu'on sache qui prend la
 * main. Volontairement **structurel** : ce module est partagé par les trois
 * modes de groupe, et importer leurs types ferait de lui un endroit qui les
 * connaît tous — rôle réservé à la couture `GameModes`.
 *
 * `finished` manque au X01, qui signale la fin par `winnerId` ; le Tour du
 * monde a les deux, parce qu'une partie finie peut n'avoir aucun vainqueur
 * (match nul). Les deux champs sont donc optionnels et lus ensemble.
 */
type TourDeTable = {
  readonly players: readonly { readonly playerId: PlayerId }[]
  readonly currentPlayerIndex: number
  readonly finished?: boolean
  readonly winnerId?: PlayerId | null
}

/**
 * Le nom de celui qui prend la main, ou `null` quand il n'y a personne à
 * appeler : partie terminée — on n'enchaîne pas sur la victoire — ou partie en
 * solo, où rappeler que c'est encore à soi n'apprendrait rien.
 */
export const prochainJoueur = (
  state: TourDeTable,
  profils: ReadonlyMap<PlayerId, Player>,
): string | null => {
  if (state.finished === true || (state.winnerId ?? null) !== null) return null
  if (state.players.length < 2) return null

  const suivant = state.players[state.currentPlayerIndex]
  return suivant ? nomJoueur(profils.get(suivant.playerId)?.name ?? null) : null
}
