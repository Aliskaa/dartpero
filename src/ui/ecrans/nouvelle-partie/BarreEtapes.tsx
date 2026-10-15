import { LEGENDE_ETAPES, libelleEtape } from '@/ui/labels'

type Props = {
  /** Les noms des étapes, dans l'ordre : « Jeu », « Joueurs », « Ordre ». */
  readonly etapes: readonly string[]
  /** L'étape courante, comptée depuis 0. */
  readonly courante: number
  /**
   * Les dernières étapes qui n'auront pas lieu (l'ordre, seul en piste) : elles
   * restent écrites mais s'effacent d'un cran. Un `grise` de plus, jamais un
   * texte sous `craie-3`.
   */
  readonly grisees?: number
}

/**
 * Où l'on en est dans « Nouvelle partie » : un trait par étape, faite en craie,
 * courante en laiton, à venir en retrait. **Non interactive** — on revient par
 * le retour, jamais en touchant la barre.
 */
export const BarreEtapes = ({ etapes, courante, grisees = 0 }: Props) => (
  <ol
    aria-label={LEGENDE_ETAPES}
    className="grid gap-1"
    style={{ gridTemplateColumns: `repeat(${etapes.length}, minmax(0, 1fr))` }}
  >
    {etapes.map((nom, rang) => {
      const grise = rang >= etapes.length - grisees
      const etat = rang < courante ? 'fait' : rang === courante ? 'courant' : 'avenir'
      return (
        <li
          key={nom}
          aria-current={etat === 'courant' ? 'step' : undefined}
          data-etat={grise && etat === 'avenir' ? 'grise' : etat}
          className={[
            'truncate border-t-[3px] pt-1.5 font-score text-etiquette uppercase tracking-[0.12em]',
            etat === 'fait' ? 'border-craie text-craie' : '',
            etat === 'courant' ? 'border-laiton text-laiton-clair' : '',
            etat === 'avenir'
              ? `text-craie-3 ${grise ? 'border-craie/10' : 'border-craie/25'}`
              : '',
          ].join(' ')}
        >
          {libelleEtape(rang + 1, nom)}
        </li>
      )
    })}
  </ol>
)
