import { useQuery } from '@tanstack/react-query'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { nomDePartie } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/**
 * Le nom à afficher d'une partie : le nom tapé, ou celui de sa date de
 * création (« Dimanche soir »). `null` tant qu'il charge.
 *
 * Une lecture en cache d'une donnée **immuable** — une partie ne se renomme
 * pas —, pas l'orchestration du match en cours : `staleTime` infini. L'import
 * d'une sauvegarde invalide déjà tout le cache.
 */
export const useNomDePartie = (matchId: MatchId): string | null => {
  const services = useServices()
  const requete = useQuery({
    queryKey: ['matchNom', matchId],
    queryFn: () => services.getMatchName.execute(matchId),
    staleTime: Number.POSITIVE_INFINITY,
  })
  return requete.data ? nomDePartie(requete.data) : null
}
