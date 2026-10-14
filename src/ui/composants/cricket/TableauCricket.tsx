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

/**
 * Les marques d'une cible, dessinées comme sur une ardoise : une barre, une
 * croix, puis la croix cerclée qui dit « fermé ». C'est la notation que tout
 * le monde reconnaît, et elle se lit de loin bien mieux qu'un « 2/3 ».
 *
 * En SVG plutôt qu'en caractères : net à toutes les tailles, et rien à
 * précharger. Traits épais : lisibles à 3 mètres. 28 px (`size-7`), comme la
 * planche : au-delà, sept colonnes ne tiennent plus à quatre joueurs.
 *
 * Couleurs : fermée en laiton, en cours en craie vive, morte (fermée
 * par tout le monde) en `craie-decor` — la colonne entière est déjà à 30 %.
 */
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

/**
 * Les colonnes : JOUEUR, une par cible (le nombre vient de la config, donc de
 * `--nb-cibles`), PTS. La planche donne 5,75 rem / 4 rem en portrait ; JOUEUR est
 * 6,25 rem pour le carré de 12 px et « MAXENCE » en entier (nom serré, 15 px), ce
 * que les marques de 26-28 px permettent encore à quatre joueurs.
 * ⚠️ Littéral complet : Tailwind ne scanne que le texte écrit.
 */
const GRILLE_CRICKET =
  'grid grid-cols-[6.25rem_repeat(var(--nb-cibles),minmax(0,1fr))_4rem] paysage:grid-cols-[7.5rem_repeat(var(--nb-cibles),minmax(0,1fr))_4.5rem]'

/**
 * Hauteur minimale de CHAQUE ligne (la même pour toutes : le repère glisse par
 * `translateY(index * 100%)`) — planche : 88 px à 2 joueurs, 62 à 3, 54 à 4, 50
 * en paysage.
 */
const HAUTEUR = [
  'min-h-22 paysage:min-h-12.5',
  'min-h-22 paysage:min-h-12.5',
  'min-h-15.5 paysage:min-h-12.5',
  'min-h-13.5 paysage:min-h-12.5',
] as const

/**
 * ZONE LECTURE du Cricket — le tableau du pub, sur la feuille commune aux trois
 * jeux : les cibles en colonnes, un joueur par ligne, et la volée en cours écrite
 * sur une dernière ligne.
 *
 * C'est le seul mode où la disposition en tableau s'impose : ce qu'on compare
 * du regard, ce n'est pas un score entre voisins mais **une colonne** — qui a
 * fermé le 20, qui reste à découvert. Aligner les marques verticalement est
 * donc la lecture utile. Un filet de colonne seulement avant la première cible
 * et avant PTS : entre les cibles, il ferait un quadrillage.
 *
 * Échelle « tableau de pub » : marques et points lisibles à 3 m ; une colonne
 * morte s'éteint entièrement, pas seulement son en-tête (barré).
 */
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
