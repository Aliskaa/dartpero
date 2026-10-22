type Props = {
  readonly libelle: string
  readonly valeur: string | number
  readonly accent?: boolean
  readonly suffixe?: string
}

/** Une statistique ; `accent` la met en laiton. ⚠️ Libellé sur deux lignes réservées : les chiffres d'une rangée restent alignés. */
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
