import type { ReactNode } from 'react'

type Props = {
  /** Le bandeau de chêne : où on en est, et par quelles règles on joue. */
  readonly enTete: ReactNode
  /** Nom de la partie, sous le bandeau ; `null` tant qu'il charge. Obligatoire. */
  readonly nomPartie: string | null
  /** La ZONE LECTURE — ce qui se lit à 3 mètres. */
  readonly children: ReactNode
  /** La ZONE SAISIE — le pavé, qu'on tape à 30 cm. */
  readonly saisie: ReactNode
}

/** Ossature commune des écrans de partie : bandeau, lecture, saisie. ⚠️ Paysage en deux colonnes, bascule sur la hauteur (variante `paysage`), pas sur la seule orientation. */
export const DispositionPartie = ({ enTete, nomPartie, children, saisie }: Props) => (
  <div className="feutre-tapis flex min-h-dvh flex-col">
    {/* ⚠️ `bandeau-match` est aussi le repère que `LivreRegles` mesure (`closest`) : ne pas renommer la classe. */}
    <header
      className={[
        'bandeau-match flex flex-col px-3 pb-1.5 pt-[max(0.5rem,env(safe-area-inset-top))]',
        'paysage:pb-0.5 paysage:pt-[max(0.25rem,env(safe-area-inset-top))]',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 paysage:gap-3">{enTete}</div>
      {/* ⚠️ `pl-11` = flèche de retour (40 px) − `-ml-1` + `gap-2` : changer l'un décale le nom. */}
      <p className="grave h-4 truncate pl-11 font-score text-etiquette leading-4 tracking-wide text-craie-3 paysage:hidden">
        {nomPartie}
      </p>
    </header>

    <div
      className={[
        'flex flex-1 flex-col gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        'paysage:flex-row paysage:items-stretch paysage:gap-3 paysage:p-2',
        'paysage:pl-[max(0.5rem,env(safe-area-inset-left))]',
        'paysage:pr-[max(0.5rem,env(safe-area-inset-right))]',
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>

      <div
        className={[
          'mt-auto pt-2',
          'paysage:mt-0 paysage:w-[46%] paysage:max-w-[21rem] paysage:shrink-0',
          'paysage:self-end paysage:pt-0',
        ].join(' ')}
      >
        {saisie}
      </div>
    </div>
  </div>
)
