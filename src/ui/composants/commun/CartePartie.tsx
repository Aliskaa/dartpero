import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { MatchSummary } from '@/core/application/ports/driving/MatchSummary'
import type { MatchStatus } from '@/core/application/use-cases/summarize'
import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { vueCarte } from '@/ui/cartesPartie'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { LIBELLE_ABANDONNEE, LIBELLE_EN_COURS } from '@/ui/labels'

type Props = {
  readonly partie: MatchSummary
  readonly statut: MatchStatus
  readonly profils: ReadonlyMap<PlayerId, Player>
  /** « 21 h 04 », « dim. 18 h 10 » ou une date : calculé par l'appelant, la ligne ne lit aucune horloge. */
  readonly quand: string
  /** Niveau du titre : 2 par défaut ; l'Accueil, dont les groupes sont des `h2`, passe 3. */
  readonly niveauTitre?: 2 | 3
  /** Parties : la partie en cours y est une ligne comme les autres, marquée « En cours ». */
  readonly marquerEnCours?: boolean
  /** Hors de la cible principale (suppression à l'Historique) : sa propre cible. */
  readonly actions?: ReactNode
}

/**
 * Une ligne de feuille : le mode à gauche (pictogramme, détail, unité), le nom
 * tapé ou les règles en haut, les joueurs classés dessous. **Toute la ligne est
 * une seule cible** (un lien, ≥ 64 px) : le résumé d'une partie terminée, la
 * reprise sinon ; les actions (corbeille) sont ses sœurs, pas ses enfants.
 *
 * Le visuel est `aria-hidden` : une phrase `sr-only` dit la même chose aux
 * lecteurs d'écran (« Sarah gagne, 86 points ; Kevin 61 ; Julien 22 »).
 * Le classement vient de `rankPlayers` via `vueCarte`, jamais recalculé ici.
 */
export const CartePartie = ({
  partie,
  statut,
  profils,
  quand,
  niveauTitre = 2,
  marquerEnCours = false,
  actions,
}: Props) => {
  const Titre = niveauTitre === 3 ? 'h3' : 'h2'
  const vue = vueCarte(partie)
  const quatre = vue.joueurs.length === 4
  const nomTape = partie.name

  return (
    <li className="flex border-b border-craie/22 last:border-b-0">
      <Link
        to={partie.finished ? `/partie/${partie.id}/resume` : `/partie/${partie.id}`}
        className="grid min-h-16 min-w-0 flex-1 grid-cols-[56px_minmax(0,1fr)] text-left"
      >
        <span
          aria-hidden="true"
          className="flex flex-col items-center justify-center gap-[3px] border-r border-craie/22 px-0.5 py-2"
        >
          <Pictogramme nom={vue.pictogramme} taille={20} className="shrink-0 text-laiton-clair" />
          <span className="whitespace-nowrap font-score text-etiquette font-bold tracking-[0.04em] text-craie-2">
            {vue.detail}
          </span>
          <span className="font-score text-etiquette font-medium uppercase tracking-[0.06em] text-craie-3">
            {vue.unite}
          </span>
        </span>

        <div className="flex min-w-0 flex-col gap-1.5 pt-[9px] pr-2.5 pb-2.5 pl-3">
          <div className="flex items-baseline justify-between gap-2">
            <Titre
              className={[
                'min-w-0 truncate font-score',
                nomTape
                  ? 'text-base font-bold text-craie-vive'
                  : 'text-etiquette font-medium uppercase tracking-[0.1em] text-craie-3',
              ].join(' ')}
            >
              {nomTape ?? vue.regles}
            </Titre>
            <span className="shrink-0 whitespace-nowrap font-score text-etiquette font-medium text-craie-3">
              {quand}
            </span>
          </div>

          <div
            className={
              quatre
                ? 'grid grid-cols-2 gap-x-2.5 gap-y-1.5'
                : 'flex flex-wrap items-center gap-x-3.5 gap-y-1'
            }
          >
            {vue.joueurs.map((joueur) => (
              <span
                key={joueur.playerId}
                aria-hidden="true"
                className={[
                  'inline-flex min-w-0 items-center gap-1.5 font-score',
                  joueur.premier ? 'text-laiton-clair' : 'text-craie',
                ].join(' ')}
              >
                <Avatar
                  nom={joueur.nom}
                  couleur={profils.get(joueur.playerId)?.color ?? null}
                  taille="xs"
                />
                {quatre && (
                  <span
                    className={[
                      'min-w-0 truncate text-etiquette uppercase tracking-[0.06em]',
                      joueur.premier ? 'text-laiton-clair' : 'text-craie-2',
                    ].join(' ')}
                  >
                    {joueur.nom}
                  </span>
                )}
                <span
                  className={[
                    'chiffres inline-flex items-center gap-0.5 text-nom-serre',
                    quatre ? 'ml-auto' : '',
                  ].join(' ')}
                >
                  {joueur.valeur}
                  {joueur.premier && <Check aria-hidden="true" className="size-4 shrink-0" />}
                </span>
              </span>
            ))}
            {statut === 'ABANDONED' && (
              <span className="justify-self-start whitespace-nowrap border border-craie/40 px-1.5 py-px font-score text-etiquette font-medium uppercase tracking-[0.1em] text-craie-2">
                {LIBELLE_ABANDONNEE}
              </span>
            )}
            {marquerEnCours && statut === 'ONGOING' && (
              <span className="justify-self-start whitespace-nowrap border border-laiton px-1.5 py-px font-score text-etiquette font-medium uppercase tracking-[0.1em] text-laiton-clair">
                {LIBELLE_EN_COURS}
              </span>
            )}
          </div>
          <span className="sr-only">{vue.phrase}</span>
        </div>
      </Link>
      {actions}
    </li>
  )
}
