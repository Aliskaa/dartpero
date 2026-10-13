import { Crown } from 'lucide-react'
import type { Segment } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { couleurJoueur } from '@/ui/couleurs'

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
 * précharger. Traits épais : lisibles à 3 mètres.
 */
const Marques = ({
  marques,
  morte,
  grande,
}: {
  readonly marques: number
  readonly morte: boolean
  readonly grande: boolean
}) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={[
      'mx-auto',
      grande ? 'size-10' : 'size-8',
      morte ? 'text-craie-decor' : marques >= 3 ? 'text-accent-mode' : 'text-craie-vive',
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

type Props = {
  readonly cibles: readonly Segment[]
  readonly joueurs: readonly LigneJoueur[]
  /** Une cible fermée par **tout le monde** ne rapporte plus rien : elle s'éteint. */
  readonly mortes: readonly boolean[]
  readonly cutThroat: boolean
}

/**
 * ZONE LECTURE du Cricket — le tableau du pub, tel qu'il est accroché au mur :
 * les cibles en colonnes, un joueur par ligne.
 *
 * C'est le seul mode où la disposition en tableau s'impose : ce qu'on compare
 * du regard, ce n'est pas un score entre voisins mais **une colonne** — qui a
 * fermé le 20, qui reste à découvert. Aligner les marques verticalement est
 * donc la lecture utile.
 *
 * Échelle « tableau de pub » : marques et points lisibles à 3 m ; une colonne
 * morte s'éteint entièrement, pas seulement son en-tête.
 */
export const TableauCricket = ({ cibles, joueurs, mortes, cutThroat }: Props) => {
  const compact = joueurs.length > 2

  return (
    <table className="w-full table-fixed border-separate border-spacing-y-2">
      <caption className="sr-only">
        Tableau du Cricket — marques par cible et points de chaque joueur
      </caption>
      <thead>
        <tr>
          <th scope="col" className="w-[22%] text-left">
            <span className="sr-only">Joueur</span>
          </th>
          {cibles.map((cible, index) => (
            <th
              key={String(cible)}
              scope="col"
              className={[
                'grave pb-1 text-center font-score text-sm font-bold tracking-wider',
                mortes[index] ? 'text-craie-3 line-through' : 'text-craie-2',
              ].join(' ')}
            >
              {libelleColonne(cible)}
            </th>
          ))}
          <th
            scope="col"
            className="grave w-[16%] pb-1 text-right font-score text-[0.65rem] uppercase tracking-wider text-craie-3"
          >
            {cutThroat ? 'Pts ↓' : 'Pts'}
          </th>
        </tr>
      </thead>

      <tbody>
        {joueurs.map((joueur) => {
          const teinte = couleurJoueur(joueur.couleur)

          return (
            <tr
              key={joueur.playerId}
              aria-current={joueur.actif ? 'true' : undefined}
              className={['ligne-tableau', joueur.actif ? 'au-lancer' : ''].join(' ')}
            >
              <th
                scope="row"
                className={`relative pl-3 pr-1 text-left ${compact ? 'py-2.5' : 'py-3.5'}`}
              >
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: teinte.fond }}
                  className="absolute inset-y-1.5 left-0 w-1.5"
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Avatar
                      nom={joueur.nom}
                      couleur={joueur.couleur}
                      taille={compact ? 'xs' : 'sm'}
                    />
                    <span
                      className={`truncate font-score font-bold uppercase tracking-wider ${
                        compact ? 'text-xs' : 'text-sm'
                      } ${joueur.actif ? 'text-accent-mode-clair' : 'text-craie-2'}`}
                    >
                      {joueur.nom}
                    </span>
                    {joueur.vainqueur && (
                      <Crown aria-hidden="true" className="size-3.5 shrink-0 text-accent-mode" />
                    )}
                  </span>
                </span>
              </th>

              {cibles.map((cible, index) => {
                const morte = mortes[index] ?? false
                const marques = joueur.marks[index] ?? 0
                return (
                  <td
                    key={String(cible)}
                    className={[
                      compact ? 'h-12 px-0.5' : 'h-14 px-0.5',
                      morte ? 'opacity-30' : '',
                    ].join(' ')}
                  >
                    <span
                      key={`${joueur.playerId}-${String(cible)}-${marques}`}
                      className="block animate-pop-score"
                    >
                      <Marques marques={marques} morte={morte} grande={!compact} />
                    </span>
                    <span className="sr-only">
                      {libelleColonne(cible)} : {etatLisible(marques, morte)}
                    </span>
                  </td>
                )
              })}

              <td className={`pr-3 text-right ${compact ? 'py-2' : 'py-3'}`}>
                <output
                  aria-label={`Points de ${joueur.nom}`}
                  className={[
                    'chiffres block font-bold leading-none text-craie-vive',
                    joueur.actif ? 'trace-craie' : '',
                    compact ? 'text-3xl' : 'text-4xl',
                  ].join(' ')}
                >
                  <span key={joueur.score} className="inline-block animate-pop-score">
                    {joueur.score}
                  </span>
                </output>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
