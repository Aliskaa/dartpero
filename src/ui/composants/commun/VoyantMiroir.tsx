import { MonitorSmartphone } from 'lucide-react'
import { Link } from 'react-router'
import { CHEMIN_PARTAGE, ETAT_DEPUIS_PARTIE } from '@/ui/chemins'
import { usePartage } from '@/ui/hooks/usePartage'
import { etiquetteBoutonMiroir } from '@/ui/labels'

/** Le bouton miroir du bandeau de partie, à gauche du livre : voyant vert (connecté), rouge (perdu), rien sinon. */
export const VoyantMiroir = () => {
  const { voyant } = usePartage()

  return (
    <Link
      to={CHEMIN_PARTAGE}
      state={ETAT_DEPUIS_PARTIE}
      aria-label={etiquetteBoutonMiroir(voyant)}
      className="relative flex size-12 shrink-0 items-center justify-center border border-chene text-craie-2 transition-[background-color] duration-90 ease-out active:bg-craie/15"
    >
      <MonitorSmartphone aria-hidden="true" className="size-5.5" />
      {voyant && (
        <span
          aria-hidden="true"
          data-voyant={voyant}
          className={`absolute right-2 top-2 size-2.5 ${
            voyant === 'connecte' ? 'bg-vert-cible' : 'bg-rouge-cible'
          }`}
        />
      )}
    </Link>
  )
}
