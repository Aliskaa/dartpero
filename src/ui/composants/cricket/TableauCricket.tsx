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
 * précharger.
 */
const Marques = ({ marques, morte }: { readonly marques: number; readonly morte: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={[
      'mx-auto size-full',
      morte ? 'text-craie/20' : marques >= 3 ? 'text-laiton' : 'text-craie-vive',
    ].join(' ')}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
  >
    {marques >= 1 && <line x1="6" y1="18" x2="18" y2="6" />}
    {marques >= 2 && <line x1="6" y1="6" x2="18" y2="18" />}
    {marques >= 3 && <circle cx="12" cy="12" r="10.5" strokeWidth={1.75} />}
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
 */
export const TableauCricket = ({ cibles, joueurs, mortes, cutThroat }: Props) => {
  const compact = joueurs.length > 2

  return (
    <table className="w-full table-fixed border-collapse">
      <caption className="sr-only">
        Tableau du Cricket — marques par cible et points de chaque joueur
      </caption>
      <thead>
        <tr>
          <th scope="col" className="w-[26%] text-left">
            <span className="sr-only">Joueur</span>
          </th>
          {cibles.map((cible, index) => (
            <th
              key={String(cible)}
              scope="col"
              className={[
                'grave pb-1 text-center font-score text-xs font-bold tracking-wider',
                mortes[index] ? 'text-craie/25 line-through' : 'text-craie/70',
              ].join(' ')}
            >
              {libelleColonne(cible)}
            </th>
          ))}
          <th
            scope="col"
            className="grave w-[18%] pb-1 text-right font-score text-[0.6rem] uppercase tracking-wider text-craie/60"
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
              className={[
                'cadre-bois transition-opacity duration-300',
                joueur.actif ? 'animate-halo' : 'opacity-75',
              ].join(' ')}
            >
              <th scope="row" className="relative py-2 pl-3 pr-1 text-left">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: teinte.fond }}
                  className="absolute inset-y-1 left-0 w-1.5 rounded-full"
                />
                <span className="flex min-w-0 items-center gap-1.5">
                  <Avatar nom={joueur.nom} couleur={joueur.couleur} taille="xs" />
                  <span
                    className={`truncate font-score text-xs font-bold uppercase tracking-wider ${
                      joueur.actif ? 'text-laiton' : 'text-craie/70'
                    }`}
                  >
                    {joueur.nom}
                  </span>
                  {joueur.vainqueur && (
                    <Crown aria-hidden="true" className="size-3.5 shrink-0 text-laiton" />
                  )}
                </span>
              </th>

              {cibles.map((cible, index) => (
                <td key={String(cible)} className={compact ? 'h-9 px-0.5' : 'h-11 px-0.5'}>
                  <Marques marques={joueur.marks[index] ?? 0} morte={mortes[index] ?? false} />
                  <span className="sr-only">
                    {libelleColonne(cible)} :{' '}
                    {etatLisible(joueur.marks[index] ?? 0, mortes[index] ?? false)}
                  </span>
                </td>
              ))}

              <td className="pr-3 text-right">
                <output
                  aria-label={`Points de ${joueur.nom}`}
                  className={[
                    'chiffres trace-craie block font-bold leading-none text-craie-vive',
                    compact ? 'text-2xl' : 'text-3xl',
                  ].join(' ')}
                >
                  {joueur.score}
                </output>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
