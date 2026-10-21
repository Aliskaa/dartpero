import { useId } from 'react'
import type { PlayerGender } from '@/core/domain/value-objects/PlayerGender'
import { AIDE_GENRE, LEGENDE_GENRE, LIBELLE_GENRE } from '@/ui/labels'

/** Les trois valeurs de l'écran. « Non précisé » n'est jamais écrit : il devient `undefined`. */
const CHOIX = ['MASCULINE', 'FEMININE', 'NON_PRECISE'] as const
type ChoixGenreUi = (typeof CHOIX)[number]

const versUi = (genre: PlayerGender | undefined): ChoixGenreUi => genre ?? 'NON_PRECISE'
const depuisUi = (choix: ChoixGenreUi): PlayerGender | undefined =>
  choix === 'NON_PRECISE' ? undefined : choix

type Props = {
  readonly valeur: PlayerGender | undefined
  readonly onChange: (genre: PlayerGender | undefined) => void
  /**
   * L'étiquette « Genre » au-dessus des cases. Masquée à l'œil (gardée pour le
   * lecteur d'écran) quand elle est déjà écrite juste au-dessus — la ligne
   * repliée de la boîte « Nouveau joueur ».
   */
  readonly legendeVisible?: boolean
}

/**
 * Le choix du genre d'un profil (planche `genre-profil`, dessin exact) : trois
 * cases **jointives** de 48 px, texte `craie-vive`, la valeur choisie en laiton
 * plein, puis l'aide en `craie-2`. Un composant à part, pas `ChoixSegmente` :
 * décision de l'utilisateur (dessin de la planche, réponse R1.5).
 */
export const ChoixGenre = ({ valeur, onChange, legendeVisible = true }: Props) => {
  const idAide = useId()
  const choisi = versUi(valeur)
  return (
    <fieldset aria-describedby={idAide} className="flex min-w-0 flex-col gap-1.5">
      <legend
        className={
          legendeVisible
            ? 'mb-1.5 font-score text-etiquette uppercase tracking-[0.25em] text-craie-3'
            : 'sr-only'
        }
      >
        {LEGENDE_GENRE}
      </legend>
      <div className="grid grid-cols-3">
        {CHOIX.map((choix) => {
          const actif = choix === choisi
          return (
            <button
              key={choix}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(depuisUi(choix))}
              className={[
                '-ml-px flex min-h-12 items-center justify-center border px-1.5 text-center first:ml-0',
                'font-score text-sm font-bold uppercase leading-tight tracking-[0.06em]',
                'transition-colors duration-150',
                actif
                  ? 'relative border-laiton bg-laiton text-sur-laiton'
                  : 'border-craie/30 bg-ardoise text-craie-vive active:bg-craie/10',
              ].join(' ')}
            >
              {LIBELLE_GENRE[choix]}
            </button>
          )
        })}
      </div>
      <p id={idAide} className="text-xs leading-snug text-craie-2">
        {AIDE_GENRE}
      </p>
    </fieldset>
  )
}

/** Le libellé de la valeur, pour la ligne repliée (« Non précisé »). */
export const libelleGenre = (genre: PlayerGender | undefined): string =>
  LIBELLE_GENRE[versUi(genre)]
