import { useQueryClient } from '@tanstack/react-query'
import { House, RotateCcw, Settings } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { CLE_HISTORIQUE, CLE_MATCH_EN_COURS } from '@/ui/clesRequetes'
import { useServices } from '@/ui/providers/ServicesProvider'
import { Button } from './Button'
import { MessageErreur } from './Etats'

type Props = {
  readonly matchId: MatchId
  /** Étape 2 de « Nouvelle partie » du mode qu'on vient de jouer. Obligatoire : un défaut ramènerait au choix du jeu. */
  readonly versReglages: string
  readonly libelleReglages?: string
}

/** Les trois sorties d'un résumé ; « On remet ça » en tête, c'est le geste réel d'une soirée. */
export const ActionsFinDePartie = ({
  matchId,
  versReglages,
  libelleReglages = 'Changer les règles',
}: Props) => {
  const services = useServices()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const remettre = async () => {
    setErreur(null)
    setOccupe(true)
    try {
      const nouvelle = await services.restartMatch.execute(matchId)
      // L'accueil propose de reprendre, l'historique liste : les deux changent.
      await queryClient.invalidateQueries({ queryKey: CLE_MATCH_EN_COURS })
      await queryClient.invalidateQueries({ queryKey: CLE_HISTORIQUE })
      navigate(`/partie/${nouvelle}`)
    } catch {
      // Le cas réel : un profil supprimé depuis. On ne relance pas en silence.
      setErreur('Impossible de relancer : un joueur de cette partie n’existe plus.')
      setOccupe(false)
    }
  }

  return (
    <div className="mt-auto grid gap-2 pt-1">
      {erreur && <MessageErreur>{erreur}</MessageErreur>}

      <Button taille="lg" disabled={occupe} onClick={() => void remettre()}>
        <RotateCcw aria-hidden="true" className="size-5" />
        On remet ça
      </Button>

      <Button variante="secondaire" onClick={() => navigate(versReglages)}>
        <Settings aria-hidden="true" className="size-4" />
        {libelleReglages}
      </Button>

      <Button variante="discret" onClick={() => navigate('/')}>
        <House aria-hidden="true" className="size-4" />
        Accueil
      </Button>
    </div>
  )
}
