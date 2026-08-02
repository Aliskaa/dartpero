import type { PlayerId } from '@/core/domain/value-objects/ids'
import { couleurJoueur, initiales } from '@/ui/couleurs'

type Taille = 'sm' | 'md' | 'lg' | 'xl'

const TAILLES: Record<Taille, string> = {
  sm: 'size-7 text-[0.65rem]',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-24 text-3xl',
}

type Props = {
  readonly id: PlayerId
  readonly nom: string
  readonly taille?: Taille
  readonly className?: string
}

/**
 * Pastille de couleur + initiales. **Toujours décorative** : le nom du joueur
 * est écrit juste à côté, la répéter au lecteur d'écran ne ferait que doubler
 * l'annonce — et casserait le nom accessible des boutons qui la contiennent.
 */
export const Avatar = ({ id, nom, taille = 'md', className = '' }: Props) => {
  const couleur = couleurJoueur(id)

  return (
    <span
      aria-hidden="true"
      style={{
        backgroundColor: couleur.fond,
        color: couleur.texte,
        borderColor: couleur.bord,
      }}
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-full border-2',
        'font-score font-bold uppercase tracking-wide',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_6px_-2px_rgba(0,0,0,0.8)]',
        TAILLES[taille],
        className,
      ].join(' ')}
    >
      {initiales(nom)}
    </span>
  )
}
