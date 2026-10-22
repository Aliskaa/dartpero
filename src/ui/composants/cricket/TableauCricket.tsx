import type { CSSProperties } from 'react'
import type { Dart, Segment } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { CasesVolee } from '@/ui/composants/commun/CasesVolee'
import { FeuilleMatch } from '@/ui/composants/commun/FeuilleMatch'
import { NomJoueurFeuille } from '@/ui/composants/commun/NomJoueurFeuille'
import {
  etiquetteVoleeDe,
  LIBELLE_JOUEUR,
  LIBELLE_PTS,
  LIBELLE_PTS_CUT_THROAT,
  LIBELLE_VOLEE,
} from '@/ui/labels'

/** Sur un tableau de pub, la bulle s'écrit « B » : la colonne doit rester étroite. */
export const libelleColonne = (cible: Segment): string => (cible === 'BULL' ? 'B' : String(cible))

const etatLisible = (marques: number, morte: boolean): string => {
  if (morte) return 'cible morte'
  if (marques >= 3) return 'fermée'
  if (marques === 0) return 'rien'
  return `${marques} marque${marques > 1 ? 's' : ''}`
}

/** Marques d'une cible à l'ardoise : barre, croix, croix cerclée (fermé) ; fermée en laiton, morte en `craie-decor`. */
const Marques = ({
  marques,
  morte,
  petite,
}: {
  readonly marques: number
  readonly morte: boolean
  /** À quatre joueurs : 26 px (planche), les colonnes sont plus étroites que 28. */
  readonly petite: boolean
}) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={[
      petite ? 'size-6.5' : 'size-7',
      morte ? 'text-craie-decor' : marques >= 3 ? 'text-laiton' : 'text-craie-vive',
    ].join(' ')}
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
  >
    {marques >= 1 && <line x1="6" y1="18" x2="18" y2="6" />}
    {marques >= 2 && <line x1="6" y1="6" x2="18" y2="18" />}
    {marques >= 3 && <circle cx="12" cy="12" r="10" strokeWidth={2.25} />}
  </svg>
)

export type LigneJoueur = {
  readonly playerId: string
  readonly nom: string
  readonly couleur: PlayerColor | null
  readonly marks: readonly number[]
  readonly score: number
  readonly actif: boolean
  readonly vainqueur: boolean
}

/** La volée montrée sur la dernière ligne, avec le joueur à qui elle appartient. */
export type VoleeCricket = {
  readonly nom: string
  readonly darts: readonly Dart[]
}

type Props = {
  readonly cibles: readonly Segment[]
  readonly joueurs: readonly LigneJoueur[]
  /** Une cible fermée par **tout le monde** ne rapporte plus rien : elle s'éteint. */
  readonly mortes: readonly boolean[]
  readonly cutThroat: boolean
  readonly volee: VoleeCricket
}

/** Colonnes JOUEUR, une par cible (`--nb-cibles`), PTS. ⚠️ Littéral complet : Tailwind ne scanne que le texte écrit. */
const GRILLE_CRICKET =
  'grid grid-cols-[6.25rem_repeat(var(--nb-cibles),minmax(0,1fr))_4rem] paysage:grid-cols-[7.5rem_repeat(var(--nb-cibles),minmax(0,1fr))_4.5rem]'

/** Hauteur minimale de CHAQUE ligne, la même pour toutes (le repère glisse par `translateY(index * 100%)`). */
const HAUTEUR = [
  'min-h-22 paysage:min-h-12.5',
  'min-h-22 paysage:min-h-12.5',
  'min-h-15.5 paysage:min-h-12.5',
  'min-h-13.5 paysage:min-h-12.5',
] as const

/** Zone lecture du Cricket : cibles en colonnes, un joueur par ligne, volée en cours sur la dernière ligne. */
export const TableauCricket = ({ cibles, joueurs, mortes, cutThroat, volee }: Props) => {
  // PTS : 36 px, 30 px à quatre joueurs (et en paysage) comme la marque (26 px).
  const quatre = joueurs.length > 3
  const hauteur = HAUTEUR[Math.min(joueurs.length, HAUTEUR.length) - 1] ?? HAUTEUR[3]
  const indexActif = joueurs.findIndex((joueur) => joueur.actif)

  return (
    <FeuilleMatch
      grille={GRILLE_CRICKET}
      style={{ '--nb-cibles': cibles.length } as CSSProperties}
      nbLignes={joueurs.length}
      indexActif={indexActif === -1 ? null : indexActif}
      entetes={
        <>
          <span className="entete-colonne px-3 text-feutre/70">{LIBELLE_JOUEUR}</span>
          {cibles.map((cible, index) => (
            <span
              key={String(cible)}
              className={[
                'text-center font-score text-base font-bold tracking-normal',
                index === 0 ? 'filet-colonne-entete' : '',
                mortes[index] ? 'text-feutre/45 line-through decoration-2' : 'text-feutre',
              ].join(' ')}
            >
              {libelleColonne(cible)}
            </span>
          ))}
          <span className="entete-colonne filet-colonne-entete px-1 text-center text-feutre/70">
            {cutThroat ? LIBELLE_PTS_CUT_THROAT : LIBELLE_PTS}
          </span>
        </>
      }
      pied={
        <div className="flex min-h-11 items-center gap-2.5 border-t border-craie/25 px-3 py-2 paysage:min-h-10 paysage:py-1.5">
          <span className="entete-colonne shrink-0">{LIBELLE_VOLEE}</span>
          <span className="min-w-0 truncate font-score text-etiquette font-bold uppercase tracking-[0.08em] text-craie-2">
            {volee.nom}
          </span>
          <CasesVolee
            variante="ruban"
            aria-label={etiquetteVoleeDe(volee.nom)}
            darts={volee.darts}
          />
        </div>
      }
    >
      {joueurs.map((joueur) => (
        <article
          key={joueur.playerId}
          aria-current={joueur.actif ? 'true' : undefined}
          className={['ligne-tableau relative', GRILLE_CRICKET, hauteur].join(' ')}
        >
          <div className="flex min-w-0 items-center py-2 pl-2.5 pr-1.5 paysage:py-1">
            <NomJoueurFeuille
              nom={joueur.nom}
              couleur={joueur.couleur}
              actif={joueur.actif}
              vainqueur={joueur.vainqueur}
              serre
            />
          </div>

          {cibles.map((cible, index) => {
            const morte = mortes[index] ?? false
            const marques = joueur.marks[index] ?? 0
            return (
              <div
                key={String(cible)}
                className={[
                  'flex min-w-0 items-center justify-center',
                  index === 0 ? 'filet-colonne' : '',
                  morte ? 'opacity-30' : '',
                ].join(' ')}
              >
                <span
                  key={`${joueur.playerId}-${String(cible)}-${marques}`}
                  className="block animate-pop-score"
                >
                  <Marques marques={marques} morte={morte} petite={quatre} />
                </span>
                <span className="sr-only">
                  {libelleColonne(cible)} : {etatLisible(marques, morte)}
                </span>
              </div>
            )
          })}

          <div className="filet-colonne flex min-w-0 items-center justify-center">
            <output
              aria-label={`Points de ${joueur.nom}`}
              className={[
                'chiffres block font-bold leading-none',
                joueur.actif ? 'trace-craie text-craie-vive' : 'text-craie',
                quatre ? 'text-3xl' : 'text-4xl',
                'paysage:text-3xl',
              ].join(' ')}
            >
              <span key={joueur.score} className="inline-block animate-pop-score">
                {joueur.score}
              </span>
            </output>
          </div>
        </article>
      ))}
    </FeuilleMatch>
  )
}
