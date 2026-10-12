type Props = {
  readonly gagnes: number
  readonly requis: number
  /** Sert au titre : « Manches : 2 sur 3 ». */
  readonly libelle: string
}

/**
 * Le comptage en bâtons — quatre traits barrés par un cinquième.
 *
 * C'est le geste du pub, celui dont on compte les tournées, et il se lit mieux
 * à trois mètres qu'une rangée de losanges : l'œil reconnaît un paquet de cinq
 * sans compter. Les traits acquis sont en craie pleine, ceux qui restent à
 * gagner en pointillé — on voit d'un coup ce qu'il manque.
 */
export const Batons = ({ gagnes, requis, libelle }: Props) => {
  const total = Math.max(requis, gagnes)
  const traits = Array.from({ length: total }, (_, rang) => ({
    cle: `${libelle}-${rang}`,
    acquis: rang < gagnes,
    /** Le cinquième de chaque paquet barre les quatre précédents. */
    barre: rang % 5 === 4,
  }))

  return (
    <span
      title={`${libelle} : ${gagnes} sur ${requis}`}
      className="flex h-4 items-end gap-[3px]"
      aria-hidden="true"
    >
      {traits.map((trait) =>
        trait.barre ? (
          // Le trait barré déborde volontairement sur les quatre d'avant : il
          // n'occupe donc aucune largeur propre.
          <span key={trait.cle} className="relative w-0">
            <span
              className={`absolute bottom-0 right-0 h-[2px] w-[26px] origin-right -rotate-[24deg] ${
                trait.acquis ? 'bg-craie' : 'bg-craie/25'
              }`}
            />
          </span>
        ) : (
          <span
            key={trait.cle}
            className={`h-4 w-[2px] ${trait.acquis ? 'bg-craie' : 'bg-craie/25'}`}
          />
        ),
      )}
    </span>
  )
}
