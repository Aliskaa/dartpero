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
 * Le panneau du pub : une ardoise dans un cadre de bois, coiffée d'un bandeau
 * de chêne veiné dès qu'elle porte un intitulé. C'est le conteneur par défaut
 * de tout ce qui n'est pas le tableau des scores.
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
  <section {...reste} className={`cadre-bois overflow-hidden rounded-2xl ${className}`}>
    {(titre || enTete) && (
      <header className="bois-veine flex items-center justify-between gap-3 px-4 py-2.5">
        {titre ? (
          <h2 className="grave font-score text-xs uppercase tracking-[0.28em] text-laiton-clair">
            {titre}
          </h2>
        ) : (
          enTete
        )}
        {action}
      </header>
    )}
    <div className={contenuClassName}>{children}</div>
  </section>
)
