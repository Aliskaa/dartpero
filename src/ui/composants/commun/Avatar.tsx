import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { couleurJoueur, initiales } from '@/ui/couleurs'

type Taille = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const TAILLES: Record<Taille, string> = {
  xs: 'size-5 border text-[0.5rem]',
  sm: 'size-7 text-[0.65rem]',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-24 text-3xl',
}

type Props = {
  readonly nom: string
  /** `null` quand le profil a été supprimé : la pastille passe en teinte de bois. */
  readonly couleur: PlayerColor | null | undefined
  readonly taille?: Taille
  readonly className?: string
}

/**
 * Pastille de couleur + initiales. **Toujours décorative** : le nom du joueur
 * est écrit juste à côté, la répéter au lecteur d'écran ne ferait que doubler
 * l'annonce — et casserait le nom accessible des boutons qui la contiennent.
 */
export const Avatar = ({ nom, couleur, taille = 'md', className = '' }: Props) => {
  const teinte = couleurJoueur(couleur)

  return (
    <span
      aria-hidden="true"
      style={{
        backgroundColor: teinte.fond,
        color: teinte.texte,
        borderColor: teinte.bord,
      }}
      className={[
        'inline-flex shrink-0 items-center justify-center border',
        'font-score font-bold uppercase tracking-wide',
        TAILLES[taille],
        className,
      ].join(' ')}
    >
      {initiales(nom)}
    </span>
  )
}
