import { Play } from 'lucide-react'
import { Link } from 'react-router'
import type { MatchSummary } from '@/core/application/ports/driving/MatchSummary'
import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { type JaugeCarte, vueCarte } from '@/ui/cartesPartie'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { LIBELLE_MODE, LIBELLE_REPRENDRE, libelleFraction } from '@/ui/labels'

type Props = {
  readonly partie: MatchSummary
  readonly profils: ReadonlyMap<PlayerId, Player>
  /** « 21 h 40 », « dim. 18 h 10 » ou une date : calculé par l'appelant. */
  readonly quand: string
  /** Niveau du titre : 3 à l'Accueil, sous le `h2` invisible « Partie en cours ». */
  readonly niveauTitre?: 2 | 3
}

const FRACTION_TEXTE = 'chiffres text-etiquette text-craie-2'

/** Des carrés pleins sur vides, ou « 3/10 » quand le total ne tient plus en carrés. */
const Carres = ({
  pleins,
  total,
  carres,
  classe,
}: {
  readonly pleins: number
  readonly total: number
  readonly carres: boolean
  readonly classe: string
}) =>
  carres ? (
    <span className="flex flex-wrap gap-[3px]">
      {Array.from({ length: total }, (_, rang) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: une rangée de cases identiques, sans identité
          key={rang}
          className={[
            'block border',
            classe,
            rang < pleins ? 'border-laiton bg-laiton' : 'border-craie-3',
          ].join(' ')}
        />
      ))}
    </span>
  ) : (
    <span className={FRACTION_TEXTE}>{libelleFraction(pleins, total)}</span>
  )

/** La jauge du jeu : tout est décoratif, le chiffre et la phrase `sr-only` portent le sens. */
const Jauge = ({ jauge }: { readonly jauge: JaugeCarte }) => {
  switch (jauge.type) {
    case 'x01':
      return (
        <span className="flex flex-col gap-[3px]">
          <Carres {...jauge.manches} classe="size-[9px]" />
          {jauge.sets && <Carres {...jauge.sets} classe="h-1 w-[9px]" />}
        </span>
      )
    case 'cricket':
      return (
        <span className="flex gap-0.5">
          {Array.from({ length: jauge.total }, (_, rang) => (
            <i
              // biome-ignore lint/suspicious/noArrayIndexKey: une rangée de cases identiques, sans identité
              key={rang}
              className={[
                'block h-3 w-2 border',
                rang < jauge.fermees ? 'border-craie bg-craie' : 'border-craie/35',
              ].join(' ')}
            />
          ))}
        </span>
      )
    case 'barre':
      return (
        <span className="block h-2 bg-craie/14">
          <i
            className={['block h-full', jauge.bouclee ? 'bg-vert-cible' : 'bg-laiton'].join(' ')}
            style={{ width: `${jauge.total === 0 ? 0 : (jauge.rempli / jauge.total) * 100}%` }}
          />
        </span>
      )
    case 'vies':
      // Killer (planche) : carrés de 12 px, pleins pour les vies restantes, en tirets pour les perdues.
      return (
        <span className="flex gap-[3px]">
          {Array.from({ length: jauge.total }, (_, rang) => (
            <i
              // biome-ignore lint/suspicious/noArrayIndexKey: une rangée de cases identiques, sans identité
              key={rang}
              className={[
                'block size-3 border-2',
                rang < jauge.restantes
                  ? 'border-craie-vive bg-craie-vive'
                  : 'border-dashed border-craie-3',
              ].join(' ')}
            />
          ))}
        </span>
      )
    default: {
      const jamais: never = jauge
      return jamais
    }
  }
}

/** Partie en cours de l'Accueil : mini tableau classé, toute la carte est une seule cible ; lignes `aria-hidden` doublées par une phrase `sr-only`. */
export const MiniTableauPartie = ({ partie, profils, quand, niveauTitre = 3 }: Props) => {
  const Titre = niveauTitre === 3 ? 'h3' : 'h2'
  const vue = vueCarte(partie)
  const serre = vue.joueurs.length >= 4

  return (
    <li className="border border-laiton bg-ardoise">
      <Link to={`/partie/${partie.id}`} className="flex flex-col text-left">
        <div className="flex items-center gap-2.5 border-b border-craie/22 px-2.5 py-2">
          <Pictogramme nom={vue.pictogramme} taille={24} className="shrink-0 text-laiton-clair" />
          <div className="min-w-0 flex-1">
            <Titre className="block truncate font-score text-base font-bold text-craie-vive">
              {partie.name ?? LIBELLE_MODE[partie.mode]}
            </Titre>
            <span className="block truncate font-score text-etiquette font-medium uppercase tracking-[0.1em] text-craie-3">
              {vue.regles}
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-[3px]">
            <span className="whitespace-nowrap font-score text-etiquette font-medium text-craie-3">
              {quand}
            </span>
            <span className="whitespace-nowrap border border-laiton px-1.5 py-px font-score text-etiquette font-medium uppercase tracking-[0.1em] text-laiton-clair">
              {vue.etat}
            </span>
          </div>
        </div>

        <div aria-hidden="true" className="py-1">
          {vue.joueurs.map((joueur) => (
            <div
              key={joueur.playerId}
              className={[
                'grid grid-cols-[28px_minmax(0,1fr)_72px_48px] items-center gap-2 px-2.5',
                serre ? 'py-[3px]' : 'py-[5px]',
                joueur.enTeteDuClassement ? 'bg-laiton/12' : '',
              ].join(' ')}
            >
              <Avatar
                nom={joueur.nom}
                couleur={profils.get(joueur.playerId)?.color ?? null}
                taille="sm"
              />
              <span
                className={[
                  'truncate font-score text-sm font-medium uppercase tracking-[0.06em]',
                  joueur.elimine ? 'text-craie-3 line-through' : 'text-craie-vive',
                ].join(' ')}
              >
                {joueur.nom}
              </span>
              <Jauge jauge={joueur.jauge} />
              <span
                className={[
                  'chiffres text-right text-xl font-bold',
                  joueur.elimine
                    ? 'text-craie-3'
                    : joueur.enTeteDuClassement
                      ? 'text-laiton-clair'
                      : 'text-craie-vive',
                ].join(' ')}
              >
                {joueur.chiffre.valeur}
                {joueur.chiffre.petit && (
                  <small className="text-etiquette font-medium text-craie-3">
                    {joueur.chiffre.petit}
                  </small>
                )}
              </span>
            </div>
          ))}
        </div>
        <span className="sr-only">{vue.phrase}</span>

        <span className="laiton-poli mx-2.5 mt-1 mb-2.5 flex min-h-12 items-center justify-center gap-2 font-score text-sm font-bold uppercase tracking-[0.14em]">
          <Play aria-hidden="true" className="size-4 fill-current" />
          {LIBELLE_REPRENDRE}
        </span>
      </Link>
    </li>
  )
}
