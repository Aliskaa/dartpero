import { Plus, UserPlus, Users, X } from 'lucide-react'
import { type KeyboardEvent, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { ETAT_PARCOURS } from '@/ui/chemins'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button, classesBouton } from '@/ui/composants/commun/Button'
import {
  AUCUN_JOUEUR_PARTIE,
  LEGENDE_JOUEURS_PARTIE,
  LIBELLE_AJOUTER_COURT,
  LIBELLE_AJOUTER_JOUEUR,
  LIBELLE_NOUVEAU_JOUEUR,
  LIBELLE_SELECTIONNER_EXISTANT,
  retirerDeLaPartie,
} from '@/ui/labels'

type Props = {
  readonly joueurs: readonly Player[]
  readonly max: number
  readonly onRetirer: (id: PlayerId) => void
  readonly onNouveau: () => void
  /** L'écran plein « Sélectionner un joueur existant ». */
  readonly versExistants: string
}

/**
 * Les joueurs de la partie, en rangée d'avatars carrés.
 *
 * Le × retire **de la partie**, jamais de la base. Le + ouvre un panneau de
 * divulgation en ligne à deux entrées — pas un `role="menu"` : deux boutons
 * n'ont pas besoin d'un focus itinérant, et le panneau ne flotte au-dessus de
 * rien. Il disparaît quand la partie est pleine.
 */
export const RangeeJoueurs = ({ joueurs, max, onRetirer, onNouveau, versExistants }: Props) => {
  const idMenu = useId()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const bouton = useRef<HTMLButtonElement>(null)
  const plein = joueurs.length >= max

  const fermerAuClavier = (evenement: KeyboardEvent) => {
    if (evenement.key !== 'Escape') return
    evenement.preventDefault()
    setMenuOuvert(false)
    bouton.current?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      <ul aria-label={LEGENDE_JOUEURS_PARTIE} className="flex flex-wrap gap-x-3 gap-y-3 pt-3">
        {joueurs.map((joueur) => (
          <li key={joueur.id} className="flex w-16 flex-col items-center gap-1">
            {/* Rangée compacte : une pastille de 40 px, le pseudo dessous sur une
                seule ligne. Tronqué « … » à la largeur de la pastille ; le nom
                complet est dans le libellé du ×. */}
            <span className="relative">
              <Avatar nom={joueur.name} couleur={joueur.color} taille="md" />
              {/* Une cible de 48 px autour d'une pastille visible plus petite :
                  le doigt n'a pas à viser le dessin. Le × est à cheval sur le coin. */}
              <button
                type="button"
                aria-label={retirerDeLaPartie(joueur.name)}
                onClick={() => onRetirer(joueur.id)}
                className="group absolute -right-6 -top-6 flex size-12 items-center justify-center"
              >
                <span className="flex size-6 items-center justify-center border border-craie/55 bg-ardoise text-craie group-active:bg-craie group-active:text-feutre">
                  <X aria-hidden="true" className="size-3.5" />
                </span>
              </button>
            </span>
            <span className="block h-4 w-full truncate text-center font-score text-etiquette uppercase leading-4 tracking-wide text-craie">
              {joueur.name}
            </span>
          </li>
        ))}

        {!plein && (
          <li className="flex w-16 flex-col items-center gap-1">
            <button
              ref={bouton}
              type="button"
              aria-label={LIBELLE_AJOUTER_JOUEUR}
              aria-expanded={menuOuvert}
              aria-controls={idMenu}
              onClick={() => setMenuOuvert(!menuOuvert)}
              onKeyDown={fermerAuClavier}
              className="flex w-full flex-col items-center gap-1"
            >
              <span
                className={[
                  'flex size-10 items-center justify-center border border-dashed',
                  menuOuvert
                    ? 'border-laiton bg-laiton/10 text-laiton-clair'
                    : 'border-craie/55 text-craie',
                ].join(' ')}
              >
                <Plus aria-hidden="true" className="size-5" />
              </span>
              <span
                aria-hidden="true"
                className="block h-4 truncate font-score text-etiquette uppercase leading-4 tracking-wide text-craie"
              >
                {LIBELLE_AJOUTER_COURT}
              </span>
            </button>
          </li>
        )}
      </ul>

      {joueurs.length === 0 && <p className="text-sm text-craie-3">{AUCUN_JOUEUR_PARTIE}</p>}

      {!plein && (
        // biome-ignore lint/a11y/noStaticElementInteractions: Échap referme le panneau depuis n'importe lequel de ses deux boutons.
        <div
          id={idMenu}
          hidden={!menuOuvert}
          className="flex flex-col gap-2"
          onKeyDown={fermerAuClavier}
        >
          <Button
            variante="secondaire"
            className="w-full"
            onClick={() => {
              setMenuOuvert(false)
              onNouveau()
            }}
          >
            <UserPlus aria-hidden="true" className="size-4" />
            {LIBELLE_NOUVEAU_JOUEUR}
          </Button>
          <Link
            to={versExistants}
            state={ETAT_PARCOURS}
            className={`${classesBouton('secondaire')} w-full`}
          >
            <Users aria-hidden="true" className="size-4" />
            {LIBELLE_SELECTIONNER_EXISTANT}
          </Link>
        </div>
      )}
    </div>
  )
}
