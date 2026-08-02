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
 */
export const StatTile = ({ libelle, valeur, accent = false, suffixe }: Props) => (
  <div
    className={[
      'flex flex-col justify-between rounded-xl px-3 py-2.5',
      accent
        ? 'border border-laiton/45 bg-laiton/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
        : 'border border-chene/50 bg-feutre/60',
    ].join(' ')}
  >
    <dt className="font-score text-[0.6rem] uppercase tracking-[0.2em] text-craie/65">{libelle}</dt>
    <dd
      className={`chiffres mt-1 text-2xl font-bold leading-none ${
        accent ? 'text-laiton-clair' : 'text-craie-vive'
      }`}
    >
      {valeur}
      {suffixe && <span className="ml-0.5 text-sm font-normal text-craie/60">{suffixe}</span>}
    </dd>
  </div>
)
