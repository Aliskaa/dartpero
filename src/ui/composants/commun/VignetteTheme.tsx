import { LIBELLE_THEME } from '@/ui/labels'
import { THEMES, type Theme } from '@/ui/theme'

/** Aperçu d'un thème. ⚠️ Les jetons `apercu-*` sont constants sous les deux thèmes ; ils ne servent qu'ici (garde `themeBoundary`). */
const Apercu = ({ theme }: { readonly theme: Theme }) => {
  const barre = 'block h-1.25'
  switch (theme) {
    case 'sombre':
      return (
        <span
          aria-hidden="true"
          className="flex h-13.5 flex-col justify-center gap-1 bg-apercu-sombre-fond p-1.5"
        >
          <span className={`${barre} w-[70%] bg-apercu-sombre-encre`} />
          <span className={`${barre} w-[40%] bg-apercu-sombre-accent`} />
          <span className={`${barre} w-[55%] bg-apercu-sombre-encre/60`} />
        </span>
      )
    case 'clair':
      return (
        <span
          aria-hidden="true"
          className="flex h-13.5 flex-col justify-center gap-1 bg-apercu-clair-fond p-1.5"
        >
          <span className={`${barre} w-[70%] bg-apercu-clair-encre`} />
          <span className={`${barre} w-[40%] bg-apercu-clair-accent`} />
          <span className={`${barre} w-[55%] bg-apercu-clair-encre/60`} />
        </span>
      )
    case 'systeme':
      return (
        <span
          aria-hidden="true"
          className="relative flex h-13.5 flex-col justify-center gap-1 bg-apercu-sombre-fond p-1.5"
        >
          <span className="absolute inset-y-0 right-0 w-[40%] bg-apercu-clair-fond" />
          <span className={`${barre} w-[40%] bg-apercu-sombre-encre`} />
          <span className={`${barre} w-[25%] bg-apercu-sombre-accent`} />
        </span>
      )
    default: {
      const jamais: never = theme
      return jamais
    }
  }
}

type Props = {
  readonly legende: string
  readonly valeur: Theme
  readonly onChange: (theme: Theme) => void
}

/** Choix du thème en trois vignettes `aria-pressed`, dans l'ordre de `THEMES`. */
export const VignetteTheme = ({ legende, valeur, onChange }: Props) => (
  <fieldset aria-label={legende} className="grid min-w-0 grid-cols-3 gap-1.5">
    {THEMES.map((theme) => {
      const active = theme === valeur
      return (
        <button
          key={theme}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(theme)}
          className={`flex flex-col items-stretch gap-1.5 ${
            active ? 'border-2 border-laiton p-1.25' : 'border border-craie/25 p-1.5'
          }`}
        >
          <Apercu theme={theme} />
          <span className="text-center font-score text-etiquette uppercase tracking-widest text-craie-vive">
            {LIBELLE_THEME[theme]}
          </span>
        </button>
      )
    })}
  </fieldset>
)
