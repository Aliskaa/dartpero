type Props = {
  readonly libelle: string
  readonly valeur: string | number
  readonly accent?: boolean
  readonly suffixe?: string
}

/**
 * Une statistique, lisible d'un coup d'œil : le libellé s'efface, le chiffre
 * reste. `accent` met la tuile en laiton pour les deux ou trois chiffres qui
 * font la fierté du joueur (moyenne, plus haut checkout).
 *
 * ⚠️ Le libellé occupe **deux lignes réservées**, qu'il en remplisse une ou
 * deux : sans cette hauteur fixe, « Plus haut checkout » repoussait son
 * chiffre bien plus bas que celui de « 180 », et la rangée cessait d'être
 * comparable — or c'est précisément pour comparer qu'on la lit.
 */
export const StatTile = ({ libelle, valeur, accent = false, suffixe }: Props) => (
  <div
    className={[
      'flex flex-col justify-between px-2.5 py-2',
      accent ? 'border border-laiton/50 bg-laiton/10' : 'border border-craie/25',
    ].join(' ')}
  >
    <dt className="entete-colonne flex h-[2.1rem] items-start leading-[1.05]">{libelle}</dt>
    <dd
      className={`chiffres text-2xl font-bold leading-none ${
        accent ? 'text-laiton-clair' : 'text-craie-vive'
      }`}
    >
      {valeur}
      {suffixe && <span className="ml-0.5 text-sm font-normal text-craie-3">{suffixe}</span>}
    </dd>
  </div>
)
