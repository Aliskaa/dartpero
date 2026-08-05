import { Crown } from 'lucide-react'
import type { VisitOutcome } from '@/core/domain/entities/Visit'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { couleurJoueur } from '@/ui/couleurs'
import { moyenne as formatMoyenne } from '@/ui/labels'

/**
 * La volée montrée sur la ligne : celle **en cours** pour le joueur actif,
 * la dernière enregistrée pour les autres. C'est la question qui revient le
 * plus souvent autour d'une cible — « t'as mis quoi, là ? ».
 */
export type VoleeAffichee = {
  readonly darts: readonly Dart[]
  readonly total: number
  /** `null` tant que la volée est en cours de saisie. */
  readonly outcome: VisitOutcome | null
}

/** Plus il y a de joueurs, moins chaque ligne a de hauteur — le chiffre suit. */
export type Echelle = 'large' | 'moyen' | 'compact'

const SCORE: Record<Echelle, string> = {
  large: 'text-[4rem] leading-[0.9]',
  moyen: 'text-5xl leading-none',
  compact: 'text-[2.5rem] leading-none',
}

const COLONNE_SCORE: Record<Echelle, string> = {
  large: 'w-[5.2rem]',
  moyen: 'w-[4.2rem]',
  compact: 'w-[3.6rem]',
}

const HAUTEUR: Record<Echelle, string> = {
  large: 'py-4',
  moyen: 'py-3',
  compact: 'py-2',
}

/** Une fléchette plantée : le compteur de fléchettes lancées dans le leg. */
const IconeFlechette = ({ className = '' }: { readonly className?: string }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className}>
    <path d="M3.4 12.6 10.8 5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 4.4 13.8 2.2 11.6 6 Z" fill="currentColor" />
    <path d="M2 14 L4.8 13.5 L2.5 11.2 Z" fill="currentColor" />
  </svg>
)

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

type Props = {
  readonly nom: string
  readonly couleur: PlayerColor | null
  readonly reste: number
  readonly actif: boolean
  readonly vainqueur: boolean
  readonly volee: VoleeAffichee | null
  readonly legsGagnes: number
  readonly legsRequis: number
  readonly setsGagnes: number
  readonly setsRequis: number
  readonly moyenne: number
  readonly flechettes: number
  readonly echelle: Echelle
}

/**
 * ZONE LECTURE — une ligne par joueur, quel que soit leur nombre.
 *
 * Hiérarchie visuelle (refonte « tableau de score ») :
 * 1. à 3 m — reste + qui joue (craie-vive, actif net / inactif atténué) ;
 * 2. à 1 m — volée + total ;
 * 3. à 30 cm — moyenne / fléchettes / jetons, jamais concurrents du score.
 *
 * Pas de cadre bois ici : le chrome mangeait le contraste du chiffre.
 */
export const LigneJoueur = ({
  nom,
  couleur,
  reste,
  actif,
  vainqueur,
  volee,
  legsGagnes,
  legsRequis,
  setsGagnes,
  setsRequis,
  moyenne,
  flechettes,
  echelle,
}: Props) => {
  const teinte = couleurJoueur(couleur)
  const bust = volee?.outcome === 'BUSTED'
  const sortie = volee?.outcome === 'CHECKOUT'
  /** Une issue absente signe une volée encore en train d'être saisie. */
  const enSaisie = volee !== null && volee.outcome === null

  return (
    <article
      aria-current={actif ? 'true' : undefined}
      className={[
        'ligne-tableau relative flex items-center gap-3 overflow-hidden rounded-2xl pl-4 pr-3',
        HAUTEUR[echelle],
        'transition-opacity duration-300',
        bust ? 'animate-secousse' : '',
        actif ? 'animate-halo' : 'opacity-75',
      ].join(' ')}
    >
      {/* Le liseré du profil : la seule couleur libre de la ligne. */}
      <span
        aria-hidden="true"
        style={{ backgroundColor: bust ? undefined : teinte.fond }}
        className={`absolute inset-y-0 left-0 w-1.5 ${bust ? 'bg-rouge-cible' : ''}`}
      />

      {/* Niveau 1 — le score, colonne fixe pour l'aligner d'une ligne à l'autre. */}
      <div className={`flex shrink-0 flex-col items-start ${COLONNE_SCORE[echelle]}`}>
        <output
          aria-label={`Score restant de ${nom}`}
          className={`chiffres trace-craie block font-bold text-craie-vive ${SCORE[echelle]}`}
        >
          {/* La `key` fait rejouer le « pop » à chaque changement de valeur. */}
          <span key={reste} className="inline-block animate-pop-score">
            {reste}
          </span>
        </output>

        <p className="mt-1 flex min-w-0 max-w-full items-center gap-1.5">
          <Avatar nom={nom} couleur={couleur} taille="xs" />
          <span
            className={`truncate font-score text-xs font-bold uppercase tracking-wider ${
              actif ? 'text-laiton' : 'text-craie/70'
            }`}
          >
            {nom}
          </span>
          {vainqueur && <Crown aria-hidden="true" className="size-3.5 shrink-0 text-laiton" />}
        </p>
      </div>

      {/* Niveau 2 — la volée : trois encoches toujours, pour garder l'alignement. */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        <output
          aria-label={enSaisie ? 'Volée en cours' : `Dernière volée de ${nom}`}
          className="flex items-center gap-1.5"
        >
          {[0, 1, 2].map((rang) => {
            const dart = volee?.darts[rang]
            return (
              <span
                key={rang}
                className={[
                  'chiffres flex h-8 min-w-12 items-center justify-center rounded-md',
                  'text-sm font-bold transition-colors duration-150',
                  dart
                    ? bust
                      ? 'border border-rouge-cible/60 bg-rouge-cible/20 text-craie-vive line-through'
                      : 'border border-laiton/50 bg-laiton/15 text-craie-vive'
                    : 'border border-dashed border-craie/20 text-craie/25',
                ].join(' ')}
              >
                {dart ? DartVO.label(dart) : '·'}
              </span>
            )
          })}
        </output>

        {bust ? (
          <span className="font-score text-xs font-bold uppercase tracking-widest text-rouge-cible">
            Bust — annulée
          </span>
        ) : sortie ? (
          <span className="font-score text-xs font-bold uppercase tracking-widest text-vert-cible">
            Sortie !
          </span>
        ) : (
          <span
            className={`chiffres text-xl font-bold leading-none ${
              volee && volee.darts.length > 0 ? 'text-craie' : 'text-craie/25'
            }`}
          >
            {volee && volee.darts.length > 0 ? volee.total : '—'}
          </span>
        )}
      </div>

      {/* Niveau 3 — détail de près : jamais au même poids que le reste. */}
      <div className="flex shrink-0 flex-col items-end gap-1 text-craie/65">
        <Jetons gagnes={legsGagnes} requis={legsRequis} libelle="Legs" />
        {setsRequis > 1 && <Jetons gagnes={setsGagnes} requis={setsRequis} libelle="Sets" />}

        <span className="flex items-center gap-1 font-score text-[0.65rem] uppercase tracking-wider">
          <IconeFlechette className="size-3 opacity-80" />
          <span className="chiffres font-semibold text-craie/80">{flechettes}</span>
        </span>
        <span className="flex items-center gap-1 font-score text-[0.65rem] uppercase tracking-wider">
          moy
          <span className="chiffres font-semibold text-craie/80">{formatMoyenne(moyenne)}</span>
        </span>
      </div>
    </article>
  )
}
