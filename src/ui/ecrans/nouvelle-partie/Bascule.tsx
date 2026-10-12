/**
 * Interrupteur de comptoir : la pastille de laiton glisse dans son rail.
 *
 * Déplacé tel quel depuis l'ancien écran de création de partie : il sert aux
 * réglages X01 (étape 2) et à l'ordre aléatoire (étape 3).
 */
export const Bascule = ({
  libelle,
  aide,
  actif,
  onChange,
}: {
  readonly libelle: string
  readonly aide: string
  readonly actif: boolean
  readonly onChange: (actif: boolean) => void
}) => (
  <button
    type="button"
    aria-pressed={actif}
    onClick={() => onChange(!actif)}
    className={[
      'flex min-h-14 items-center justify-between gap-3 border px-4 text-left',
      'transition-colors duration-150',
      actif ? 'border-laiton/50 bg-laiton/10' : 'border-chene/55 bg-feutre/60',
    ].join(' ')}
  >
    <span className="min-w-0">
      <span
        className={`block font-score text-sm font-bold uppercase tracking-widest ${
          actif ? 'text-laiton-clair' : 'text-craie/75'
        }`}
      >
        {libelle}
      </span>
      <span className="block truncate text-xs text-craie/60">{aide}</span>
    </span>

    <span
      aria-hidden="true"
      className={`relative h-7 w-12 shrink-0 border transition-colors duration-200 ${
        actif ? 'border-laiton/60 bg-laiton/25' : 'border-craie/20 bg-feutre-nuit/70'
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 transition-all duration-200 ${
          actif ? 'laiton-plat left-[1.6rem]' : 'left-0.5 bg-craie/45'
        }`}
      />
    </span>
  </button>
)
