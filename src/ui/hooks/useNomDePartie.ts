import { useQuery } from '@tanstack/react-query'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { nomDePartie } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/** Le nom à afficher : tapé, ou celui de la date de création ; `null` au chargement. `staleTime` infini (une partie ne se renomme pas). */
export const useNomDePartie = (matchId: MatchId): string | null => {
  const services = useServices()
  const requete = useQuery({
    queryKey: ['matchNom', matchId],
    queryFn: () => services.getMatchName.execute(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })
  return requete.data ? nomDePartie(requete.data) : null
}
