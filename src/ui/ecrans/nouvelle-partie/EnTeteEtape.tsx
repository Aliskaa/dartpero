import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { vientDuParcours } from '@/ui/chemins'

/**
 * Le retour de l'écran, aligné sur celui du téléphone.
 *
 * Arrivé par le parcours (`ETAT_PARCOURS`), on recule d'une entrée — le même
 * geste que le bouton du téléphone, donc les deux ne divergent jamais. Arrivé
 * par un lien profond ou un rechargement, il n'y a pas d'entrée précédente
 * fiable : on **remplace** par l'étape précédente, sans empiler de doublon.
 */
export const useRetour = (cheminPrecedent: string) => {
  const navigate = useNavigate()
  const { state } = useLocation()
  return () => {
    if (vientDuParcours(state)) navigate(-1)
    else navigate(cheminPrecedent, { replace: true })
  }
}

type Props = {
  readonly titre: string
  readonly sousTitre?: string
  readonly cheminPrecedent: string
  /** Le nom accessible du bouton retour. */
  readonly libelleRetour: string
  readonly action?: ReactNode
}

/** L'en-tête d'une étape : retour (48 px), titre, sous-titre. Pas de « étape n sur N ». */
export const EnTeteEtape = ({
  titre,
  sousTitre,
  cheminPrecedent,
  libelleRetour,
  action,
}: Props) => {
  const retour = useRetour(cheminPrecedent)

  return (
    <header className="flex items-center gap-3">
      <button
        type="button"
        aria-label={libelleRetour}
        onClick={retour}
        className="flex size-12 shrink-0 items-center justify-center border border-chene/45 bg-ardoise text-craie-2 active:bg-chene/30"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-score text-2xl font-bold uppercase tracking-wide text-craie-vive">
          {titre}
        </h1>
        {sousTitre && (
          <p className="truncate font-score text-etiquette uppercase tracking-[0.25em] text-craie-3">
            {sousTitre}
          </p>
        )}
      </div>
      {action}
    </header>
  )
}
