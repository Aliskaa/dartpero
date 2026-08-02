import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { useServices } from '../providers/ServicesProvider'

export const CLE_JOUEURS = ['joueurs'] as const

export const useJoueurs = () => {
  const services = useServices()
  return useQuery({
    queryKey: CLE_JOUEURS,
    queryFn: () => services.managePlayers.listAll(),
  })
}

/**
 * Profil complet par identifiant, pour habiller un état de match qui ne connaît
 * que des `PlayerId` — le pseudo pour l'écrire, la couleur pour la pastille.
 */
export const useProfils = (): ReadonlyMap<PlayerId, Player> => {
  const { data } = useJoueurs()
  return new Map((data ?? []).map((joueur) => [joueur.id, joueur]))
}

/** Invalide la liste des profils : à appeler après toute création ou édition. */
export const useRafraichirJoueurs = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: CLE_JOUEURS })
}
