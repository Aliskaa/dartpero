import { useQuery } from '@tanstack/react-query'
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

/** Pseudo par identifiant, pour habiller un état de match qui ne connaît que des ids. */
export const useNomsJoueurs = (): ReadonlyMap<PlayerId, string> => {
  const { data } = useJoueurs()
  return new Map((data ?? []).map((joueur) => [joueur.id, joueur.name]))
}
