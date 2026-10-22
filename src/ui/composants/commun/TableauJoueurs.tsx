import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { LIBELLE_VAINQUEUR } from '@/ui/labels'

/** Feuille de match : joueurs en colonnes, statistiques en lignes (2 à 4 joueurs × neuf chiffres, sans défilement). */
// ⚠️ Un tableau transposé ne se classe pas : chaque ligne met en avant son meneur.

export type ColonneJoueur = {
  readonly id: string
  readonly nom: string
  readonly couleur: PlayerColor | null
  /** Le vainqueur du match — à ne pas confondre avec le meneur d'une ligne. */
  readonly vainqueur?: boolean
}

export type LigneStat<T> = {
  readonly libelle: string
  readonly valeur: (joueur: T) => string | number
  /** Nombre qui décide du meneur de la ligne ; plus grand = meilleur (on rend l'opposé pour « meilleure manche »). */
  readonly meilleur: (joueur: T) => number
  /** Les deux ou trois chiffres qui font la fierté du joueur. */
  readonly accent?: boolean
}

type Props<T> = {
  readonly libelle: string
  readonly colonnes: readonly ColonneJoueur[]
  readonly joueurs: readonly T[]
  readonly lignes: readonly LigneStat<T>[]
}

/** Meneur d'une ligne, s'il y en a un seul. ⚠️ À égalité, personne n'est mis en avant. */
export const rangDuMeneur = <T,>(joueurs: readonly T[], ligne: LigneStat<T>): number => {
  const scores = joueurs.map(ligne.meilleur)
  const sommet = Math.max(...scores)
  const exAequo = scores.filter((score) => score === sommet).length > 1
  return exAequo ? -1 : scores.indexOf(sommet)
}

export const TableauJoueurs = <T,>({ libelle, colonnes, joueurs, lignes }: Props<T>) => (
  <table aria-label={libelle} className="w-full table-fixed border-collapse font-score text-sm">
    <thead>
      <tr className="border-b-2 border-craie/30">
        <td className="w-[7.25rem] paysage:w-[6rem]" />
        {colonnes.map((colonne) => (
          <th key={colonne.id} scope="col" className="px-1 pb-2 align-bottom">
            <span className="flex flex-col items-center gap-1">
              <span className="flex items-center gap-1">
                <Avatar nom={colonne.nom} couleur={colonne.couleur} taille="xs" />
                {colonne.vainqueur && (
                  <Pictogramme nom="victoire" taille={20} className="shrink-0 text-laiton-clair" />
                )}
              </span>
              <span
                className={`w-full truncate text-etiquette font-bold uppercase tracking-wide ${
                  colonne.vainqueur ? 'text-laiton-clair' : 'text-craie-3'
                }`}
              >
                {colonne.nom}
                {colonne.vainqueur && <span className="sr-only">, {LIBELLE_VAINQUEUR}</span>}
              </span>
            </span>
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {lignes.map((ligne) => {
        const meneur = rangDuMeneur(joueurs, ligne)

        return (
          <tr key={ligne.libelle} className="border-b border-craie/12 last:border-0">
            <th
              scope="row"
              className="py-2 pr-2 text-left align-middle text-etiquette font-normal uppercase leading-[1.15] tracking-wider text-craie-3"
            >
              {ligne.libelle}
            </th>
            {joueurs.map((joueur, rang) => (
              <td
                key={colonnes[rang]?.id ?? rang}
                className={`chiffres px-1 py-2 text-center font-bold leading-none ${
                  ligne.accent ? 'text-lg' : 'text-base'
                } ${
                  rang === meneur
                    ? 'text-laiton-clair'
                    : ligne.accent
                      ? 'text-craie-vive'
                      : 'text-craie-2'
                }`}
              >
                {ligne.valeur(joueur)}
              </td>
            ))}
          </tr>
        )
      })}
    </tbody>
  </table>
)
