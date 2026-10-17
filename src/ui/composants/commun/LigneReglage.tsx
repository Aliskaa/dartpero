import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, type To } from 'react-router'

/**
 * Une liste de réglages (planche `#rg4`) : une fiche d'ardoise sous un filet de
 * craie de 3 px, des lignes séparées d'un filet fin. Chaque ligne est entière
 * une cible de 56 px.
 */
export const ListeReglages = ({ children }: { readonly children: ReactNode }) => (
  <ul className="border-t-3 border-craie bg-ardoise">{children}</ul>
)

/** Ce que fait la ligne : mener ailleurs, agir, ou basculer un réglage. */
export type ActionLigne =
  | { readonly type: 'lien'; readonly vers: To }
  | { readonly type: 'bouton'; readonly onClick: () => void; readonly desactivee?: boolean }
  | { readonly type: 'bascule'; readonly active: boolean; readonly onClick: () => void }

type Props = {
  readonly titre: string
  readonly aide?: string
  /** Une valeur courte à droite (« 4 » profils), en laiton. */
  readonly valeur?: string
  readonly action: ActionLigne
}

const CLASSES_LIGNE = [
  'flex min-h-14 w-full items-center gap-2.5 px-3 py-2 text-left',
  'active:bg-craie/10 disabled:opacity-40',
].join(' ')

/**
 * L'interrupteur : 46 × 26 px, curseur de 18 px. Purement visuel — l'état
 * est porté par `aria-pressed` sur la ligne.
 */
const Bascule = ({ active }: { readonly active: boolean }) => (
  <span
    aria-hidden="true"
    className={`relative h-6.5 w-11.5 shrink-0 border transition-colors duration-150 ${
      active ? 'border-laiton bg-laiton/25' : 'border-craie/25 bg-feutre-nuit'
    }`}
  >
    <span
      className={`absolute top-0.75 size-4.5 transition-[left] duration-150 ${
        active ? 'left-5.75 bg-laiton' : 'left-0.75 bg-craie/70'
      }`}
    />
  </span>
)

const Chevron = () => <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-laiton" />

export const LigneReglage = ({ titre, aide, valeur, action }: Props) => {
  const contenu = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block font-score text-sm font-bold uppercase tracking-[0.06em] text-craie-vive">
          {titre}
        </span>
        {aide && <span className="block text-xs text-craie-3">{aide}</span>}
      </span>
      {valeur !== undefined && (
        <span className="shrink-0 text-right font-score text-sm text-laiton-clair">{valeur}</span>
      )}
      {action.type === 'bascule' ? <Bascule active={action.active} /> : <Chevron />}
    </>
  )

  return (
    <li className="border-b border-craie/25 last:border-b-0">
      {action.type === 'lien' ? (
        <Link to={action.vers} className={CLASSES_LIGNE}>
          {contenu}
        </Link>
      ) : (
        <button
          type="button"
          aria-pressed={action.type === 'bascule' ? action.active : undefined}
          disabled={action.type === 'bouton' ? action.desactivee : undefined}
          onClick={action.onClick}
          className={CLASSES_LIGNE}
        >
          {contenu}
        </button>
      )}
    </li>
  )
}
