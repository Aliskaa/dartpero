import { CalendarDays, ChartColumn, House, Settings, Users } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router'

type Onglet = {
  readonly to: string
  readonly libelle: string
  readonly Icone: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
}

const ONGLETS: readonly Onglet[] = [
  { to: '/', libelle: 'Début', Icone: House },
  { to: '/joueurs', libelle: 'Joueurs', Icone: Users },
  { to: '/statistiques', libelle: 'Stats', Icone: ChartColumn },
  { to: '/historique', libelle: 'Parties', Icone: CalendarDays },
  { to: '/reglages', libelle: 'Réglages', Icone: Settings },
]

/**
 * La barre de comptoir : cinq destinations, toujours au même endroit, en bas.
 *
 * Elle n'apparaît **pas** pendant une partie ni sur l'écran de configuration :
 * là, chaque pixel sert à jouer, et un onglet mal visé en pleine volée ferait
 * perdre la saisie en cours.
 */
export const NavigationBasse = () => (
  <nav
    aria-label="Navigation principale"
    className="bandeau-bas sticky bottom-0 z-20 flex shrink-0 pb-[env(safe-area-inset-bottom)]"
  >
    {ONGLETS.map(({ to, libelle, Icone }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          [
            'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-1.5',
            'font-score text-[0.6rem] uppercase tracking-wider transition-colors duration-150',
            isActive ? 'text-laiton-clair' : 'text-craie/60 active:text-craie',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            <Icone aria-hidden="true" className="size-5" />
            <span className="grave">{libelle}</span>
            {/* Le trait de laiton sous l'onglet actif : lisible même de biais. */}
            <span
              aria-hidden="true"
              className={`h-[3px] w-8 ${isActive ? 'bg-laiton' : 'bg-transparent'}`}
            />
          </>
        )}
      </NavLink>
    ))}
  </nav>
)
