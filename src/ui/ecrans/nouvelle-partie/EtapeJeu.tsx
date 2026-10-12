import { ChevronRight, ChevronsDown, Globe2, Grid3x3, Target } from 'lucide-react'
import { Link } from 'react-router'
import type { GameModeId } from '@/core/domain/games'
import { DEFAUT as DEFAUT_ENTRAINEMENT } from '@/core/domain/games/checkout-practice/config'
import { ACCENTS_MODE } from '@/ui/accents'
import { cheminNouvellePartie, ETAT_PARCOURS } from '@/ui/chemins'
import {
  LIBELLE_MODE,
  RETOUR_ACCUEIL,
  reglesCarteJeu,
  SOUS_TITRE_ETAPE_JEU,
  TITRE_NOUVELLE_PARTIE,
} from '@/ui/labels'
import { EnTeteEtape } from './EnTeteEtape'

/**
 * L'ordre est fixe, X01 en tête : aucune carte n'est mise en avant. Une carte
 * présélectionnée se lirait comme un choix en attente, alors qu'ici toucher
 * une carte, c'est avancer.
 */
const JEUX: readonly GameModeId[] = ['X01', 'CRICKET', 'TOUR_DU_MONDE', 'CHECKOUT_PRACTICE']

const ICONES: Record<GameModeId, typeof Target> = {
  X01: ChevronsDown,
  CRICKET: Grid3x3,
  TOUR_DU_MONDE: Globe2,
  CHECKOUT_PRACTICE: Target,
}

const CarteJeu = ({ mode }: { readonly mode: GameModeId }) => {
  const Icone = ICONES[mode]
  const accent = ACCENTS_MODE[mode]
  const [premiere, seconde] = reglesCarteJeu(mode, {
    min: DEFAUT_ENTRAINEMENT.minTarget,
    max: DEFAUT_ENTRAINEMENT.maxTarget,
  })

  return (
    <li>
      <Link
        to={cheminNouvellePartie(mode)}
        state={ETAT_PARCOURS}
        // Le liseré du mode : une teinte par jeu, résolue dans le bon thème.
        style={{ borderLeftColor: accent.fond }}
        className={[
          'flex min-h-20 items-center gap-4 border border-l-4 border-chene/45 bg-feutre/60 px-4 py-3',
          'transition-colors duration-150 active:bg-chene/30',
        ].join(' ')}
      >
        <Icone aria-hidden="true" className="size-6 shrink-0" style={{ color: accent.clair }} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-score text-lg font-bold uppercase tracking-wide text-craie-vive">
            {LIBELLE_MODE[mode]}
          </span>
          <span className="text-sm leading-snug text-craie/75">{premiere}</span>
          <span className="text-sm leading-snug text-craie/75">{seconde}</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-laiton" />
      </Link>
    </li>
  )
}

/** Étape 1 — le jeu. Une question par écran : on choisit à quoi on joue, rien d'autre. */
export const EtapeJeu = () => (
  <>
    <EnTeteEtape
      titre={TITRE_NOUVELLE_PARTIE}
      sousTitre={SOUS_TITRE_ETAPE_JEU}
      cheminPrecedent="/"
      libelleRetour={RETOUR_ACCUEIL}
    />
    <ul className="flex flex-col gap-3">
      {JEUX.map((mode) => (
        <CarteJeu key={mode} mode={mode} />
      ))}
    </ul>
  </>
)
