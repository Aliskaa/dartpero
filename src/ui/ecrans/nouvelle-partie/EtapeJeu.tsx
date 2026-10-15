import { Link } from 'react-router'
import type { GameModeId } from '@/core/domain/games'
import { cheminNouvellePartie, ETAT_PARCOURS } from '@/ui/chemins'
import { PICTOGRAMME_PAR_MODE, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import {
  ETAPE_JEU,
  ETAPE_JOUEURS,
  ETAPE_ORDRE,
  LIBELLE_MODE,
  PHRASE_TUILE,
  RETOUR_ACCUEIL,
  TITRE_NOUVELLE_PARTIE,
} from '@/ui/labels'
import { BarreEtapes } from './BarreEtapes'
import { EnTeteEtape } from './EnTeteEtape'

/**
 * L'ordre est fixe, X01 en tête : aucune tuile n'est mise en avant. Une tuile
 * présélectionnée se lirait comme un choix en attente, alors qu'ici toucher
 * une tuile, c'est avancer.
 */
const JEUX: readonly GameModeId[] = ['X01', 'CRICKET', 'TOUR_DU_MONDE', 'CHECKOUT_PRACTICE']

const TuileJeu = ({ mode }: { readonly mode: GameModeId }) => (
  <li>
    <Link
      to={cheminNouvellePartie(mode)}
      state={ETAT_PARCOURS}
      // Le liseré : le laiton, pour tous les jeux (le jeu se dit par son pictogramme).
      className={[
        'flex h-full min-h-[150px] flex-col gap-2 border-t-4 border-laiton bg-ardoise px-3 pb-3 pt-3.5',
        'transition-colors duration-150 active:bg-chene/30',
      ].join(' ')}
    >
      <span className="text-laiton-clair">
        <Pictogramme nom={PICTOGRAMME_PAR_MODE[mode]} taille={40} />
      </span>
      <span className="font-score text-lg font-bold uppercase leading-tight text-craie-vive">
        {LIBELLE_MODE[mode]}
      </span>
      <span className="text-sm leading-snug text-craie-2">{PHRASE_TUILE[mode]}</span>
    </Link>
  </li>
)

/**
 * Étape 1 — le jeu : quatre tuiles 2 × 2, chacune un seul lien. Le nom de la
 * partie n'est plus ici (il descend à l'étape 2, facultatif).
 */
export const EtapeJeu = () => (
  <>
    <EnTeteEtape
      titre={TITRE_NOUVELLE_PARTIE}
      cheminPrecedent="/"
      libelleRetour={RETOUR_ACCUEIL}
      barre={<BarreEtapes etapes={[ETAPE_JEU, ETAPE_JOUEURS, ETAPE_ORDRE]} courante={0} />}
    />
    <ul className="grid grid-cols-2 gap-2">
      {JEUX.map((mode) => (
        <TuileJeu key={mode} mode={mode} />
      ))}
    </ul>
  </>
)
