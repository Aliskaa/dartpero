import { CalendarDays, ChartColumn, House, Settings } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router'
import {
  LIBELLE_NAVIGATION_PRINCIPALE,
  LIBELLE_ONGLET_DEBUT,
  LIBELLE_ONGLET_PARTIES,
  LIBELLE_ONGLET_REGLAGES,
  LIBELLE_ONGLET_STATS,
} from '@/ui/labels'

type Onglet = {
  readonly to: string
  readonly libelle: string
  readonly Icone: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
}

const ONGLETS: readonly Onglet[] = [
  { to: '/', libelle: LIBELLE_ONGLET_DEBUT, Icone: House },
  { to: '/statistiques', libelle: LIBELLE_ONGLET_STATS, Icone: ChartColumn },
  { to: '/historique', libelle: LIBELLE_ONGLET_PARTIES, Icone: CalendarDays },
  { to: '/reglages', libelle: LIBELLE_ONGLET_REGLAGES, Icone: Settings },
]

/** Barre de comptoir : quatre destinations, absente pendant une partie et sur l'écran de configuration. */
export const NavigationBasse = () => (
  <nav
    aria-label={LIBELLE_NAVIGATION_PRINCIPALE}
    className="bandeau-bas sticky bottom-0 z-20 flex h-[calc(var(--hauteur-nav-basse)+env(safe-area-inset-bottom))] shrink-0 overflow-hidden pb-[env(safe-area-inset-bottom)]"
  >
    {ONGLETS.map(({ to, libelle, Icone }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          [
            'flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-1.5',
            // Anneau de focus tracé À L'INTÉRIEUR de l'onglet : le <nav> est en
            // overflow-hidden (hauteur fixe), un contour décalé vers l'extérieur serait rogné.
            'focus-visible:outline-offset-[-2px]',
            'font-score text-etiquette uppercase tracking-normal transition-colors duration-150',
            isActive ? 'text-craie-vive' : 'text-craie-3 active:text-craie',
          ].join(' ')
        }
      >
        {({ isActive }) => (
          <>
            <Icone aria-hidden="true" className="size-5" />
            <span className="grave">{libelle}</span>
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
