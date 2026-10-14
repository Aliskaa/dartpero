import { ChevronRight } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'react-router'
import type { GameModeId } from '@/core/domain/games'
import { DEFAUT as DEFAUT_ENTRAINEMENT } from '@/core/domain/games/checkout-practice/config'
import { MATCH_NAME_MAX_LENGTH } from '@/core/domain/value-objects/MatchName'
import { ACCENTS_MODE } from '@/ui/accents'
import { cheminNouvellePartie, ETAT_PARCOURS } from '@/ui/chemins'
import { type NomPictogramme, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import type { NomPartieSaisi } from '@/ui/hooks/useNouvellePartie'
import {
  LIBELLE_MODE,
  LIBELLE_NOM_PARTIE,
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

const ICONES: Record<GameModeId, NomPictogramme> = {
  X01: 'x01',
  CRICKET: 'cricket',
  TOUR_DU_MONDE: 'tour-du-monde',
  CHECKOUT_PRACTICE: 'entrainement',
}

const CarteJeu = ({ mode }: { readonly mode: GameModeId }) => {
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
        <span className="shrink-0" style={{ color: accent.clair }}>
          <Pictogramme nom={ICONES[mode]} taille={40} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-score text-lg font-bold uppercase tracking-wide text-craie-vive">
            {LIBELLE_MODE[mode]}
          </span>
          <span className="text-sm leading-snug text-craie-2">{premiere}</span>
          <span className="text-sm leading-snug text-craie-2">{seconde}</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-laiton" />
      </Link>
    </li>
  )
}

/**
 * Le nom de la partie : prérempli avec la proposition (« Dimanche soir »),
 * modifiable, jamais obligatoire.
 *
 * ⚠️ Pas d'`autoFocus` : le clavier masquerait les cartes, alors que la plupart
 * des parties gardent le nom proposé. Vidé, le champ montre la proposition en
 * filigrane — c'est elle que la partie portera.
 */
const ChampNom = ({ nom }: { readonly nom: NomPartieSaisi }) => {
  const idChamp = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={idChamp}
        className="font-score text-etiquette uppercase tracking-[0.25em] text-craie-3"
      >
        {LIBELLE_NOM_PARTIE}
      </label>
      <input
        id={idChamp}
        type="text"
        value={nom.saisie}
        placeholder={nom.proposition}
        maxLength={MATCH_NAME_MAX_LENGTH}
        autoComplete="off"
        enterKeyHint="done"
        onChange={(evenement) => nom.setSaisie(evenement.target.value)}
        className="min-h-12 border border-chene/60 bg-feutre/70 px-4 text-craie placeholder:text-craie-3"
      />
    </div>
  )
}

/**
 * Étape 1 — le jeu, et le nom de la partie au-dessus des cartes. Le nom est la
 * seule autre question de l'écran, et elle n'en est pas vraiment une : il est
 * déjà proposé, toucher une carte suffit pour avancer.
 */
export const EtapeJeu = ({ nom }: { readonly nom: NomPartieSaisi }) => (
  <>
    <EnTeteEtape
      titre={TITRE_NOUVELLE_PARTIE}
      sousTitre={SOUS_TITRE_ETAPE_JEU}
      cheminPrecedent="/"
      libelleRetour={RETOUR_ACCUEIL}
    />
    <ChampNom nom={nom} />
    <ul className="flex flex-col gap-3">
      {JEUX.map((mode) => (
        <CarteJeu key={mode} mode={mode} />
      ))}
    </ul>
  </>
)
