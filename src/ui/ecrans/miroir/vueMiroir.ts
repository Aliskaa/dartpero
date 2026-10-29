import type { MirrorPlayer, MirrorView } from '@/core/application/ports/driving/WatchMatch'
import { nameOf } from '@/core/domain/events/MatchEvent'
import { type AnyMatchState, GameModes } from '@/core/domain/games'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { nomDePartie, nomJoueur } from '@/ui/labels'

/** La vue reçue, l'état resserré sur un mode : ce que chaque `Miroir<Mode>` reçoit. */
export type VueMiroir<S extends AnyMatchState> = Omit<MirrorView, 'state'> & { readonly state: S }

export type PropsMiroir<S extends AnyMatchState> = { readonly vue: VueMiroir<S> }

/** Noms et couleurs viennent du message, jamais des profils du miroir ; profil supprimé = absent. */
export const joueurMiroir = (vue: MirrorView, id: PlayerId): MirrorPlayer | null =>
  vue.players.find((joueur) => joueur.id === id) ?? null

export const nomMiroir = (vue: MirrorView, id: PlayerId): string =>
  nomJoueur(joueurMiroir(vue, id)?.name ?? null)

export const nomPartieMiroir = (vue: MirrorView): string =>
  nomDePartie({ name: nameOf(vue.record.events), createdAt: vue.record.createdAt })

export const noms = (vue: MirrorView): ReadonlyMap<PlayerId, string> =>
  new Map(vue.players.map((joueur) => [joueur.id, joueur.name]))

export const termine = (vue: MirrorView): boolean => GameModes.isFinished(vue.state)
