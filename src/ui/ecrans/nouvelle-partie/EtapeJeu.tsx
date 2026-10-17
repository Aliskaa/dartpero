import { useQuery } from '@tanstack/react-query'
import { Play } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { ReplayableConfiguration } from '@/core/application/ports/driving/GetReplayableConfigurations'
import type { GameModeId } from '@/core/domain/games'
import { cheminNouvellePartie, ETAT_PARCOURS } from '@/ui/chemins'
import { CLE_REJOUER } from '@/ui/clesRequetes'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { MessageErreur } from '@/ui/composants/commun/Etats'
import { PICTOGRAMME_PAR_MODE, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import type { NouvellePartie } from '@/ui/hooks/useNouvellePartie'
import {
  ariaRejouer,
  ETAPE_JEU,
  ETAPE_JOUEURS,
  ETAPE_ORDRE,
  LEGENDE_REJOUER,
  LIBELLE_MODE,
  LIBELLE_MODE_COURT,
  PHRASE_TUILE,
  RETOUR_ACCUEIL,
  resumeRejouer,
  TITRE_AUTRE_JEU,
  TITRE_NOUVELLE_PARTIE,
  TITRE_REJOUER,
  titreRejouer,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import { configurationsAffichees } from '@/ui/rejouer'
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

/** « Ou un autre jeu » : le même lien que la tuile, en rangée compacte (pictogramme + nom). */
const JeuCompact = ({ mode }: { readonly mode: GameModeId }) => (
  <li>
    <Link
      to={cheminNouvellePartie(mode)}
      state={ETAT_PARCOURS}
      className={[
        'flex h-full min-h-12 flex-col items-center gap-1.5 border-t-[3px] border-laiton bg-ardoise px-0.5 pb-2.5 pt-3',
        'text-center font-score text-etiquette font-bold uppercase leading-tight text-craie-vive',
        'transition-colors duration-150 active:bg-chene/30',
      ].join(' ')}
    >
      <span className="text-laiton-clair">
        <Pictogramme nom={PICTOGRAMME_PAR_MODE[mode]} taille={24} />
      </span>
      {/* Quatre cases serrées : l'entraînement s'y dit « Solo », comme au filtre de Parties. */}
      {mode === 'CHECKOUT_PRACTICE' ? LIBELLE_MODE_COURT[mode] : LIBELLE_MODE[mode]}
    </Link>
  </li>
)

/**
 * Une ligne de « Rejouer » : le mode, ses réglages, les joueurs, et **une seule
 * cible** — ▶ (48 px). Les pastilles n'ont que des initiales : les pseudos
 * entiers vivent dans le nom accessible de ▶.
 */
const LigneRejouer = ({
  configuration,
  partie,
  maintenant,
}: {
  readonly configuration: ReplayableConfiguration
  readonly partie: NouvellePartie
  readonly maintenant: number
}) => {
  const joueurs = configuration.playerIds.flatMap((id) =>
    partie.profils.filter((profil) => profil.id === id),
  )
  return (
    <li className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border border-laiton/55 bg-ardoise p-3">
      <span className="text-laiton-clair">
        <Pictogramme nom={PICTOGRAMME_PAR_MODE[configuration.mode]} taille={40} />
      </span>
      <div className="min-w-0">
        <span className="block font-score font-bold uppercase leading-tight tracking-wide text-craie-vive">
          {titreRejouer(configuration)}
        </span>
        <span className="mb-1.5 mt-0.5 block font-score text-etiquette uppercase tracking-[0.12em] text-craie-3">
          {resumeRejouer(configuration, maintenant)}
        </span>
        <span className="flex flex-wrap gap-[3px]">
          {joueurs.map((joueur) => (
            <Avatar key={joueur.id} nom={joueur.name} couleur={joueur.color} taille="xs" />
          ))}
        </span>
      </div>
      <button
        type="button"
        aria-label={ariaRejouer(
          configuration,
          joueurs.map((joueur) => joueur.name),
        )}
        disabled={partie.occupe}
        onClick={() => partie.rejouer(configuration)}
        className="laiton-poli flex size-12 items-center justify-center disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
      >
        <Play aria-hidden="true" className="size-5 fill-current" />
      </button>
    </li>
  )
}

/**
 * Étape 1 — le jeu. Avec un historique : « Rejouer » (les trois configurations
 * récentes) puis « Ou un autre jeu » en rangée compacte. Sans aucune
 * configuration à rejouer : les quatre tuiles 2 × 2. Tant que l'historique ou
 * les profils chargent : **rien** sous la barre d'étapes — ni rangée ni tuiles,
 * sans quoi la mise en page basculerait sous le doigt et un appui serait perdu.
 *
 * Le nom de la partie n'est plus ici (il descend à l'étape 2, facultatif).
 */
export const EtapeJeu = ({ partie }: { readonly partie: NouvellePartie }) => {
  const services = useServices()
  // Lue **une fois** par passage : le libellé de date ne bouge pas sous les doigts.
  const [maintenant] = useState(() => services.clock.now())
  const historique = useQuery({
    queryKey: CLE_REJOUER,
    queryFn: () => services.getReplayableConfigurations.execute(),
  })

  const charge = !historique.isPending && !partie.chargement
  const lignes = charge
    ? configurationsAffichees(historique.data ?? [], (id) =>
        partie.profils.some((profil) => profil.id === id),
      )
    : []
  const tuiles = charge && lignes.length === 0

  return (
    <>
      <EnTeteEtape
        titre={TITRE_NOUVELLE_PARTIE}
        cheminPrecedent="/"
        libelleRetour={RETOUR_ACCUEIL}
        barre={<BarreEtapes etapes={[ETAPE_JEU, ETAPE_JOUEURS, ETAPE_ORDRE]} courante={0} />}
      />
      {!charge ? null : tuiles ? (
        <ul className="grid grid-cols-2 gap-2">
          {JEUX.map((mode) => (
            <TuileJeu key={mode} mode={mode} />
          ))}
        </ul>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-score text-etiquette font-bold uppercase tracking-[0.2em] text-laiton-clair">
              {TITRE_REJOUER}
            </h2>
            <ul aria-label={LEGENDE_REJOUER} className="flex flex-col gap-3">
              {lignes.map((configuration) => (
                <LigneRejouer
                  key={configuration.key}
                  configuration={configuration}
                  partie={partie}
                  maintenant={maintenant}
                />
              ))}
            </ul>
            {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="font-score text-etiquette font-bold uppercase tracking-[0.2em] text-laiton-clair">
              {TITRE_AUTRE_JEU}
            </h2>
            <ul className="grid grid-cols-4 gap-1.5">
              {JEUX.map((mode) => (
                <JeuCompact key={mode} mode={mode} />
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  )
}
