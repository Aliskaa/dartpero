import { Crown } from 'lucide-react'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { couleurJoueur } from '@/ui/couleurs'
import { moyenne as formatMoyenne } from '@/ui/labels'

/** Les legs gagnés, en jetons : à 3 mètres on compte des pastilles, pas des mots. */
const Jetons = ({
  gagnes,
  requis,
  libelle,
}: {
  readonly gagnes: number
  readonly requis: number
  readonly libelle: string
}) => {
  const jetons = Array.from({ length: Math.max(requis, gagnes) }, (_, rang) => ({
    cle: `${libelle}-${rang}`,
    acquis: rang < gagnes,
  }))

  return (
    <span className="flex items-center gap-1" title={`${libelle} : ${gagnes} sur ${requis}`}>
      {jetons.map((jeton) => (
        <span
          key={jeton.cle}
          className={`size-2 rotate-45 rounded-[2px] ${
            jeton.acquis ? 'bg-laiton shadow-[0_0_6px_-1px_var(--color-laiton)]' : 'bg-craie/20'
          }`}
        />
      ))}
    </span>
  )
}

/** Les trois fléchettes de la volée en cours, dans leurs encoches. */
const TraceVolee = ({ darts }: { readonly darts: readonly Dart[] }) => (
  <output className="mt-3 flex items-center justify-center gap-1.5" aria-label="Volée en cours">
    {[0, 1, 2].map((rang) => {
      const dart = darts[rang]
      return (
        <span
          key={rang}
          className={[
            'chiffres flex h-7 min-w-12 items-center justify-center rounded-md text-xs font-bold',
            'transition-colors duration-150',
            dart
              ? 'border border-laiton/70 bg-laiton/25 text-craie-vive shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
              : 'border border-dashed border-craie/20 text-craie/25',
          ].join(' ')}
        >
          {dart ? DartVO.label(dart) : '·'}
        </span>
      )
    })}
  </output>
)

type Props = {
  readonly id: PlayerId
  readonly nom: string
  readonly reste: number
  readonly actif: boolean
  readonly vainqueur: boolean
  readonly legsGagnes: number
  readonly legsRequis: number
  readonly setsGagnes: number
  readonly setsRequis: number
  readonly moyenne: number
  readonly dartsEnCours: readonly Dart[]
  readonly compact: boolean
}

/**
 * ZONE LECTURE — une carte se lit depuis la ligne de lancer, à 2-3 mètres.
 *
 * Règle de la charte : le chiffre du score est en craie quasi-blanche sur
 * feutre sombre. Le bois, le laiton et la couleur du joueur restent sur le
 * cadre — jamais derrière un score.
 */
export const CarteJoueur = ({
  id,
  nom,
  reste,
  actif,
  vainqueur,
  legsGagnes,
  legsRequis,
  setsGagnes,
  setsRequis,
  moyenne,
  dartsEnCours,
  compact,
}: Props) => {
  const couleur = couleurJoueur(id)

  return (
    <article
      aria-current={actif ? 'true' : undefined}
      className={[
        'relative flex flex-col overflow-hidden rounded-2xl px-3 pb-3 pt-2.5 text-center',
        'cadre-bois transition-opacity duration-300',
        actif ? 'animate-halo' : 'opacity-70',
      ].join(' ')}
    >
      {/* Le liseré de couleur du profil : la seule couleur libre de la carte. */}
      <span
        aria-hidden="true"
        style={{ backgroundColor: couleur.fond }}
        className="absolute inset-x-0 top-0 h-1"
      />

      <header className="flex min-w-0 items-center justify-center gap-2">
        <Avatar id={id} nom={nom} taille="sm" />
        <p
          className={`truncate font-score text-sm font-bold uppercase tracking-widest ${
            actif ? 'text-laiton' : 'text-craie/70'
          }`}
        >
          {nom}
        </p>
        {vainqueur && <Crown aria-hidden="true" className="size-4 shrink-0 text-laiton" />}
      </header>

      <output
        aria-label={`Score restant de ${nom}`}
        className={`chiffres trace-craie mt-1 block font-bold leading-none text-craie-vive ${
          compact ? 'text-5xl' : 'text-[4.25rem]'
        }`}
      >
        {/* La `key` fait rejouer le « pop » à chaque changement de valeur : le
            score qui bouge doit se voir depuis l'oche, pas seulement de près. */}
        <span key={reste} className="inline-block animate-pop-score">
          {reste}
        </span>
      </output>

      <div className="mt-2 flex items-center justify-center gap-2.5 text-craie/70">
        <Jetons gagnes={legsGagnes} requis={legsRequis} libelle="Legs" />
        {setsRequis > 1 && (
          <>
            <span aria-hidden="true" className="h-3 w-px bg-craie/20" />
            <Jetons gagnes={setsGagnes} requis={setsRequis} libelle="Sets" />
          </>
        )}
        <span aria-hidden="true" className="h-3 w-px bg-craie/20" />
        <span className="chiffres text-xs uppercase tracking-wider">
          moy <span className="font-bold text-craie">{formatMoyenne(moyenne)}</span>
        </span>
      </div>

      {actif && <TraceVolee darts={dartsEnCours} />}
    </article>
  )
}
