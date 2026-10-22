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

/** Conteneur secondaire : ardoise + filet ; le veinage bois est réservé au bandeau de match et à la nav. */
export const Panneau = ({
  titre,
  enTete,
  action,
  children,
  className = '',
  contenuClassName = 'p-4',
  ...reste
}: Props) => (
  <section {...reste} className={`ardoise-craie overflow-hidden ${className}`}>
    {(titre || enTete) && (
      <header className="flex items-center justify-between gap-3 border-b-2 border-craie/35 bg-craie/[0.06] px-4 py-2.5">
        {titre ? <h2 className="entete-colonne text-laiton">{titre}</h2> : enTete}
        {action}
      </header>
    )}
    <div className={contenuClassName}>{children}</div>
  </section>
)
