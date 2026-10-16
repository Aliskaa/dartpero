import type { ReactNode } from 'react'

type Props = {
  /** Le bandeau de chêne : où on en est, et par quelles règles on joue. */
  readonly enTete: ReactNode
  /**
   * Le nom de la partie (« Finale des potes », « Dimanche soir »), en petit sous
   * la rangée du bandeau ; `null` tant qu'il charge. Obligatoire : un écran de
   * partie qui l'oublierait ne compilerait pas.
   */
  readonly nomPartie: string | null
  /** La ZONE LECTURE — ce qui se lit à 3 mètres. */
  readonly children: ReactNode
  /** La ZONE SAISIE — le pavé, qu'on tape à 30 cm. */
  readonly saisie: ReactNode
}

/**
 * L'ossature commune aux quatre écrans de partie : bandeau, zone lecture, zone
 * saisie. Elle vivait recopiée dans chaque mode ; c'est le mode paysage qui a
 * imposé de la remonter ici — quatre copies d'une disposition, c'est trois
 * occasions de l'oublier.
 *
 * **Portrait** : lecture en haut, saisie collée en bas, comme le veut le
 * cadrage — le pouce ne remonte pas.
 *
 * **Paysage** (téléphone couché) : deux colonnes, lecture à gauche et pavé à
 * droite. Empiler en paysage écraserait les deux : le tableau deviendrait
 * illisible à 3 mètres et les touches passeraient sous le seuil des 48 px.
 *
 * ⚠️ La bascule ne dépend pas que de l'orientation, mais de la **hauteur**
 * (variante `paysage`, définie dans `index.css`) : ce qui manque au téléphone
 * couché, c'est la hauteur. Une tablette en paysage a la place de garder la
 * disposition normale, et un navigateur de bureau aussi.
 *
 * En paysage l'encoche passe sur le côté : les marges de sécurité horizontales
 * ne sont pas décoratives, sans elles une touche finit sous l'arrondi de
 * l'écran.
 *
 * **Le pavé est calé en bas** en paysage (`self-end`) : Annuler garde sa place
 * d'un jeu à l'autre, que la feuille soit haute (X01) ou basse (Cricket).
 *
 * **La zone de lecture est collée en haut** (plus de `justify-center`) : la
 * feuille commence sous le bandeau, et le vide éventuel tombe entre elle et le
 * pavé, pas au-dessus.
 *
 * **Le nom de la partie** a sa propre ligne, sous la rangée du bandeau, en
 * portrait : le loger dans la rangée la ferait passer à la ligne en X01 avec
 * sets, DI et DO. Sa hauteur est **réservée** (`h-4`) même pendant le
 * chargement, pour que la zone de lecture ne saute pas quand le nom arrive ; un
 * nom long est tronqué (« … »), jamais renvoyé à la ligne. **En paysage elle
 * disparaît** (`paysage:hidden`) : la hauteur est ce qui manque, et le pavé est
 * déjà au plancher de 48 px.
 */
export const DispositionPartie = ({ enTete, nomPartie, children, saisie }: Props) => (
  <div className="feutre-tapis flex min-h-dvh flex-col">
    {/* ⚠️ `bandeau-match` est aussi un repère : `LivreRegles` mesure le bas de ce
        bandeau par `closest('.bandeau-match')` pour poser la feuille dessous en
        paysage. Renommer la classe, c'est renommer la mesure. */}
    <header
      className={[
        'bandeau-match flex flex-col px-3 pb-1.5 pt-[max(0.5rem,env(safe-area-inset-top))]',
        'paysage:pb-0.5 paysage:pt-[max(0.25rem,env(safe-area-inset-top))]',
      ].join(' ')}
    >
      {/* gap-2 en portrait : avec le livre des règles, la rangée compte quatre
          éléments, et 12 px de plus tronquaient le sous-titre X01 à 390 px. */}
      <div className="flex items-center gap-2 paysage:gap-3">{enTete}</div>
      {/* Aligné sur la rangée, après la flèche de retour : 40 px tirés de 4 px
          vers la gauche (`-ml-1`), plus l'écart portrait (gap-2, 8 px) = 44 px,
          `pl-11`. Changer l'un des trois, c'est décaler le nom. */}
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
