import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { couleurJoueur, initiales } from '@/ui/couleurs'

type Taille = 'xs' | 'sm' | 'ms' | 'md' | 'lg' | 'xl'

const TAILLES: Record<Taille, string> = {
  // xs : deux capitales à 0,75 rem dans 24 px ne tiennent qu'au interlettrage normal.
  xs: 'size-6 border text-etiquette tracking-normal',
  sm: 'size-7 text-etiquette tracking-wide',
  // ms : 34 px, entre sm et md — les onglets et la grande ligne du podium (Statistiques).
  ms: 'size-8.5 text-etiquette tracking-wide',
  md: 'size-10 text-sm tracking-wide',
  lg: 'size-14 text-lg tracking-wide',
  xl: 'size-24 text-3xl tracking-wide',
}

type Props = {
  readonly nom: string
  /** `null` quand le profil a été supprimé : la pastille passe en teinte de bois. */
  readonly couleur: PlayerColor | null | undefined
  readonly taille?: Taille
  readonly className?: string
}

/** Pastille + initiales. ⚠️ Toujours décorative : le nom est écrit à côté, la répéter casserait le nom accessible des boutons. */
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
        'font-score font-bold uppercase',
        TAILLES[taille],
        className,
      ].join(' ')}
    >
      {initiales(nom)}
    </span>
  )
}
