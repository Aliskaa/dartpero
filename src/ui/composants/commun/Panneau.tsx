import type { ReactNode } from 'react'

type Props = {
  /** Titre court, rendu en `<h2>`. Exclusif avec `enTete`. */
  readonly titre?: string
  /** Bandeau libre, quand le titre ne doit pas être un intitulé de section. */
  readonly enTete?: ReactNode
  readonly action?: ReactNode
  readonly children: ReactNode
  readonly className?: string
  readonly contenuClassName?: string
  readonly 'aria-label'?: string
}

/**
 * Conteneur secondaire : ardoise + filet, sans bandeau de bois systématique.
 * Le veinage bois reste réservé au bandeau de match et à la nav — là où il
 * ancre « on est en partie », pas sur chaque carte de réglages.
 */
export const Panneau = ({
  titre,
  enTete,
  action,
  children,
  className = '',
  contenuClassName = 'p-4',
  ...reste
}: Props) => (
  <section
    {...reste}
    className={`overflow-hidden rounded-2xl border border-chene/40 bg-ardoise ${className}`}
  >
    {(titre || enTete) && (
      <header className="flex items-center justify-between gap-3 border-b border-chene/35 px-4 py-2.5">
        {titre ? (
          <h2 className="font-score text-xs uppercase tracking-[0.28em] text-laiton">{titre}</h2>
        ) : (
          enTete
        )}
        {action}
      </header>
    )}
    <div className={contenuClassName}>{children}</div>
  </section>
)
