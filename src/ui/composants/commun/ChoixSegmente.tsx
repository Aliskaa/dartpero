/** Sélecteur segmenté : un rail d'ardoise, un curseur de laiton plat qui glisse. */

/** `md` : rail de configuration ; `sm` : filtre au-dessus d'un tableau. ⚠️ Jamais sous `min-h-12`. */
export type TailleChoix = 'md' | 'sm'

const TEXTE: Record<TailleChoix, string> = {
  md: 'chiffres text-lg font-bold',
  sm: 'font-score text-xs font-bold uppercase tracking-[0.08em]',
}

export const ChoixSegmente = <T extends string | number>({
  legende,
  valeurs,
  valeur,
  onChange,
  aide,
  taille = 'md',
  libelle = (option) => String(option),
}: {
  readonly legende: string
  readonly valeurs: readonly T[]
  readonly valeur: T
  readonly onChange: (valeur: T) => void
  /** Une ligne sous le rail, quand le chiffre seul ne dit pas ce qu'il fait. */
  readonly aide?: string
  readonly taille?: TailleChoix
  /** Par défaut la valeur elle-même : les scores et les legs se lisent tels quels. */
  readonly libelle?: (valeur: T) => string
}) => {
  const rang = Math.max(valeurs.indexOf(valeur), 0)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-score text-etiquette uppercase tracking-[0.25em] text-craie-3">
        {legende}
      </legend>
      <div
        className="relative grid border border-chene/45 bg-feutre/70 p-1"
        style={{ gridTemplateColumns: `repeat(${valeurs.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden="true"
          style={{
            width: `calc((100% - 0.5rem) / ${valeurs.length})`,
            transform: `translateX(${rang * 100}%)`,
          }}
          className="laiton-plat absolute inset-y-1 left-1 transition-transform duration-200 ease-out"
        />
        {valeurs.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === valeur}
            onClick={() => onChange(option)}
            className={`relative z-10 min-h-12 px-1 transition-colors duration-150 ${TEXTE[taille]} ${
              option === valeur ? 'text-sur-laiton' : 'text-craie-2'
            }`}
          >
            {libelle(option)}
          </button>
        ))}
      </div>
      {aide && <p className="text-xs leading-snug text-craie-3">{aide}</p>}
    </fieldset>
  )
}
