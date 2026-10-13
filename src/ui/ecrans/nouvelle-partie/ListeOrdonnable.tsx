import { GripVertical } from 'lucide-react'
import {
  type KeyboardEvent,
  type PointerEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { AIDE_POIGNEE, annonceOrdre, deplacerJoueur, LEGENDE_ORDRE, rangOrdre } from '@/ui/labels'
import { decalage, rangVise } from './ordre'

type Props = {
  readonly joueurs: readonly Player[]
  /** Sous tirage au sort : ni poignée ni rang, ils annonceraient un ordre faux. */
  readonly tirage: boolean
  readonly onDeplacer: (de: number, vers: number) => void
}

/** Ce qu'on mesure une seule fois, au début du geste. */
type Mesure = {
  readonly pointeur: number
  readonly de: number
  readonly debutY: number
  readonly milieux: readonly number[]
  readonly hauteur: number
  readonly min: number
  readonly max: number
}

type Geste = { readonly de: number; readonly dy: number; readonly vers: number }

/**
 * L'ordre de passage, réglé par glisser-déposer **à la poignée**, ou au
 * clavier (↑ / ↓) sur cette même poignée.
 *
 * Pendant le geste, le DOM ne bouge pas : la ligne tenue suit le doigt en
 * `translateY`, les autres se décalent d'un pas pour lui faire place. Le vrai
 * réordonnancement n'a lieu qu'au relâcher, par le même `deplacer` que le
 * clavier. Un tap sans mouvement ne fait rien.
 */
export const ListeOrdonnable = ({ joueurs, tirage, onDeplacer }: Props) => {
  const idAide = useId()
  const lignes = useRef<(HTMLLIElement | null)[]>([])
  const poignees = useRef(new Map<PlayerId, HTMLButtonElement>())
  const mesure = useRef<Mesure | null>(null)
  const aFocaliser = useRef<PlayerId | null>(null)
  const rangCourant = useRef<number | null>(null)
  const [geste, setGeste] = useState<Geste | null>(null)
  const [annonce, setAnnonce] = useState('')

  // Après un déplacement, le focus revient à la poignée déplacée : sa ligne a
  // changé de place dans le DOM, et le navigateur l'a peut-être perdu en route.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on refocalise à chaque nouvel ordre.
  useLayoutEffect(() => {
    const id = aFocaliser.current
    if (id === null) return
    aFocaliser.current = null
    poignees.current.get(id)?.focus()
  }, [joueurs])

  const deplacerVers = (de: number, vers: number) => {
    const joueur = joueurs[de]
    if (!joueur || vers < 0 || vers >= joueurs.length || vers === de) return
    aFocaliser.current = joueur.id
    onDeplacer(de, vers)
    setAnnonce(annonceOrdre(joueur.name, vers + 1, joueurs.length))
  }

  const auClavier = (evenement: KeyboardEvent, rang: number) => {
    if (evenement.key === 'ArrowUp') {
      evenement.preventDefault()
      deplacerVers(rang, rang - 1)
    } else if (evenement.key === 'ArrowDown') {
      evenement.preventDefault()
      deplacerVers(rang, rang + 1)
    }
  }

  const saisir = (evenement: PointerEvent<HTMLButtonElement>, rang: number) => {
    if (!evenement.isPrimary || evenement.button !== 0) return
    evenement.currentTarget.setPointerCapture(evenement.pointerId)
    const boites = lignes.current
      .slice(0, joueurs.length)
      .map((ligne) => ligne?.getBoundingClientRect())
    const tenue = boites[rang]
    if (!tenue) return
    const premiere = boites[0] ?? tenue
    const derniere = boites[boites.length - 1] ?? tenue
    const seconde = boites[1]
    mesure.current = {
      pointeur: evenement.pointerId,
      de: rang,
      debutY: evenement.clientY,
      milieux: boites.map((boite) => (boite ? boite.top + boite.height / 2 : 0)),
      // Le pas entre deux lignes, filet compris.
      hauteur: seconde ? seconde.top - premiere.top : tenue.height,
      // La borne arrête le centre pile sur le milieu de la première / dernière
      // ligne : `rangVise` place donc ses seuils à mi-chemin, jamais sur un milieu.
      min: premiere.top - tenue.top,
      max: derniere.top - tenue.top,
    }
    setGeste({ de: rang, dy: 0, vers: rang })
  }

  const suivre = (evenement: PointerEvent<HTMLButtonElement>) => {
    const m = mesure.current
    if (!m || evenement.pointerId !== m.pointeur) return
    const dy = Math.min(Math.max(evenement.clientY - m.debutY, m.min), m.max)
    const centre = (m.milieux[m.de] ?? 0) + dy
    const vers = rangVise(m.milieux, m.de, centre)
    // Gardé aussi hors de l'état : le relâcher peut arriver avant le rendu
    // qui aurait rafraîchi la fermeture.
    rangCourant.current = vers
    setGeste({ de: m.de, dy, vers })
  }

  const relacher = (evenement: PointerEvent<HTMLButtonElement>) => {
    const m = mesure.current
    if (!m || evenement.pointerId !== m.pointeur) return
    mesure.current = null
    const vers = rangCourant.current ?? m.de
    rangCourant.current = null
    setGeste(null)
    if (evenement.currentTarget.hasPointerCapture(evenement.pointerId)) {
      evenement.currentTarget.releasePointerCapture(evenement.pointerId)
    }
    deplacerVers(m.de, vers)
  }

  const abandonner = () => {
    mesure.current = null
    rangCourant.current = null
    setGeste(null)
  }

  const transformation = (rang: number): string | undefined => {
    if (!geste) return undefined
    if (rang === geste.de) return `translateY(${geste.dy}px)`
    const pas = mesure.current?.hauteur ?? 0
    const decale = decalage(rang, geste.de, geste.vers, pas)
    return decale === 0 ? undefined : `translateY(${decale}px)`
  }

  return (
    <>
      <ol aria-label={LEGENDE_ORDRE} className="flex flex-col gap-2">
        {joueurs.map((joueur, rang) => {
          const tenue = geste?.de === rang
          return (
            <li
              key={joueur.id}
              ref={(ligne) => {
                lignes.current[rang] = ligne
              }}
              style={{ transform: transformation(rang) }}
              className={[
                'relative flex min-h-14 items-center gap-3 border bg-feutre/80 pl-3',
                tirage ? 'pr-3' : '',
                tenue
                  ? 'z-10 border-laiton/60 shadow-[0_8px_24px_-8px_var(--color-feutre-nuit)]'
                  : 'border-chene/55',
                // ⚠️ La transition seulement **pendant** le geste : au relâcher, les
                // lignes enjambées changent de place dans le DOM et perdent leur
                // décalage dans le même rendu — animé, ce retour les ferait sauter.
                geste !== null && !tenue
                  ? 'motion-safe:transition-transform motion-safe:duration-150'
                  : '',
              ].join(' ')}
            >
              {!tirage && (
                <span className="chiffres w-8 shrink-0 text-sm font-bold text-laiton-clair">
                  {rangOrdre(rang + 1)}
                </span>
              )}
              <Avatar nom={joueur.name} couleur={joueur.color} />
              <span className="min-w-0 flex-1 truncate font-score text-base uppercase tracking-wide text-craie-vive">
                {joueur.name}
              </span>
              {!tirage && (
                <button
                  type="button"
                  ref={(poignee) => {
                    if (poignee) poignees.current.set(joueur.id, poignee)
                    else poignees.current.delete(joueur.id)
                  }}
                  aria-label={deplacerJoueur(joueur.name)}
                  aria-describedby={idAide}
                  onKeyDown={(evenement) => auClavier(evenement, rang)}
                  onPointerDown={(evenement) => saisir(evenement, rang)}
                  onPointerMove={suivre}
                  onPointerUp={relacher}
                  onPointerCancel={abandonner}
                  className={[
                    'flex size-12 shrink-0 cursor-grab items-center justify-center text-craie-2',
                    'touch-none select-none [-webkit-touch-callout:none] active:cursor-grabbing',
                  ].join(' ')}
                >
                  <GripVertical aria-hidden="true" className="size-5" />
                </button>
              )}
            </li>
          )
        })}
      </ol>
      <p id={idAide} className="sr-only">
        {AIDE_POIGNEE}
      </p>
      <output className="sr-only">{annonce}</output>
    </>
  )
}
