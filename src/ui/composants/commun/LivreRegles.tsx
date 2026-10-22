import { BookOpen } from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { FeuilleRegles } from '@/ui/composants/commun/FeuilleRegles'
import { useModaleAuRetour } from '@/ui/hooks/useModaleAuRetour'
import { TITRE_REGLES } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import { contenuRegles, type ReglesDeLaPartie } from '@/ui/reglesDuJeu'

/** La clé d'historique de la feuille, et sa seule valeur (liste fermée). */
const CLE_REGLES = 'regles'
const FEUILLE_REGLES = ['ouverte'] as const

type Props = {
  /** Les règles de ce soir : la fiche de l'étape 2, ou la configuration de la partie. */
  readonly regles: ReglesDeLaPartie
  /** Pleine hauteur à l'étape 2 ; par-dessus le bas de l'écran sur le match. */
  readonly hauteur: 'pleine' | 'moitie'
}

/** Le livre ouvert : ouvre la feuille de règles par-dessus l'écran (`useModaleAuRetour`, clé `regles`). ⚠️ Hors de tout conteneur `.grave` ou en capitales : la feuille en hériterait. */
export const LivreRegles = ({ regles, hauteur }: Props) => {
  const services = useServices()
  const feuille = useModaleAuRetour(CLE_REGLES, FEUILLE_REGLES)
  const ouverte = feuille.ouverte !== null
  const bouton = useRef<HTMLButtonElement>(null)
  const idFeuille = useId()
  const [hautPaysage, setHautPaysage] = useState<number | null>(null)

  // En paysage sur le match, la feuille se pose sous le bandeau (`bandeau-match`) : on mesure son bas à l'ouverture et au redimensionnement.
  useLayoutEffect(() => {
    if (!ouverte || hauteur !== 'moitie') return
    const mesurer = () => {
      const bandeau = bouton.current?.closest('.bandeau-match')
      setHautPaysage(bandeau ? Math.round(bandeau.getBoundingClientRect().bottom) : null)
    }
    mesurer()
    window.addEventListener('resize', mesurer)
    return () => window.removeEventListener('resize', mesurer)
  }, [ouverte, hauteur])

  const titre = TITRE_REGLES[regles.mode]

  return (
    <>
      <button
        ref={bouton}
        type="button"
        aria-label={titre}
        aria-haspopup="dialog"
        aria-expanded={ouverte}
        aria-controls={ouverte ? idFeuille : undefined}
        onClick={() => feuille.ouvrir('ouverte')}
        className={[
          'flex size-12 shrink-0 items-center justify-center border',
          ouverte
            ? 'border-laiton bg-laiton text-sur-laiton'
            : 'border-laiton-sombre text-laiton-clair',
        ].join(' ')}
      >
        <BookOpen aria-hidden="true" className="size-5.5" />
      </button>

      <FeuilleRegles
        id={idFeuille}
        mode={regles.mode}
        contenu={
          ouverte
            ? contenuRegles(regles, {
                surUnDouble: services.getCheckoutRange.execute({ doubleOut: true }),
                libre: services.getCheckoutRange.execute({ doubleOut: false }),
              })
            : null
        }
        hauteur={hauteur}
        hautPaysage={hautPaysage}
        onFermer={feuille.fermer}
        retour={bouton}
      />
    </>
  )
}
