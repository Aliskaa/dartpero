import { type ReactNode, useId } from 'react'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { type NomPictogramme, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { LIBELLE_TOUT_VOIR, nomBascule, nomToutVoir } from '@/ui/labels'

/**
 * LES CARTES DU PODIUM (lot `statistiques-podium`) — une carte par thème :
 * le premier en grand avec son chiffre, les N premiers en barres
 * proportionnelles, puis « Tout voir » qui ouvre la liste complète dans une
 * `Modale` (Révision 1). On n'y lit pas une grille, on y lit « qui mène, et de
 * combien ».
 */

type PropsCarte = {
  readonly titre: string
  /**
   * Le nom accessible, quand le titre visible est abrégé (« Moyenne 3 fl.,
   * Moyenne 3 fléchettes ») : il contient le visible, et nomme le `<h2>`, donc
   * la région.
   */
  readonly nom?: string
  readonly pictogramme: NomPictogramme
  /** À droite du titre : les bascules. */
  readonly action?: ReactNode
  readonly children: ReactNode
}

/**
 * Une carte : une région nommée par son `<h2>`.
 *
 * ⚠️ Titre et pictogramme en `laiton`, comme la planche (U4) : en thème clair,
 * 4,40:1 sur `ardoise`, sous le plancher de 4,5:1. Risque accepté par
 * l'utilisateur, consigné dans la charte comme écart connu.
 */
export const CartePodium = ({ titre, nom, pictogramme, action, children }: PropsCarte) => {
  const idTitre = useId()

  return (
    <section
      aria-labelledby={idTitre}
      className="border-t-3 border-craie bg-ardoise px-3.5 pt-3.5 pb-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Pictogramme nom={pictogramme} taille={20} className="shrink-0 text-laiton" />
          <h2
            id={idTitre}
            {...(nom && nom !== titre ? { 'aria-label': nom } : {})}
            className="entete-colonne truncate font-bold text-laiton"
          >
            {titre}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/**
 * Les bascules d'une carte : des puces, pas un rail — elles réordonnent la
 * carte, elles ne la dominent pas.
 *
 * Même API que `ChoixSegmente`. Le libellé visible est court (« F9 ») ; le
 * nom accessible dit le court puis le complet (« F9, First 9 », `nomBascule`).
 *
 * ⚠️ Visuel de la planche (une puce de 22 px de haut), mais **zone d'appui de
 * 48 px** : un pseudo-élément déborde de 14 px au-dessus et au-dessous. En
 * largeur, la puce garde la sienne (« F9 » ≈ 29 px) : écart connu, accepté
 * (charte, Q3).
 *
 * Deux dessins (`disposition`) : `espacees`, les puces du podium ; `jointives`,
 * celles de la carte Évolution (lot `courbe`, planche) — collées, bordures
 * confondues (`-ml-px`), 32 px visibles et toujours 48 px d'appui (8 px de
 * débord dessus et dessous). L'active passe au-dessus de ses voisines pour
 * que sa bordure laiton se voie en entier.
 */
const DISPOSITIONS_BASCULES = {
  espacees: {
    groupe: 'flex shrink-0 gap-1',
    puce: 'px-1.75 py-1 tracking-[0.08em] after:-inset-y-3.5',
    active: '',
  },
  jointives: {
    groupe: 'flex shrink-0',
    puce: 'min-h-8 px-2 tracking-[0.06em] [&:not(:first-child)]:-ml-px after:-inset-y-2',
    active: 'z-10',
  },
} as const

export type DispositionBascules = keyof typeof DISPOSITIONS_BASCULES

export const BasculesPodium = <T extends string>({
  legende,
  valeurs,
  valeur,
  onChange,
  libelle,
  disposition = 'espacees',
}: {
  readonly legende: string
  readonly valeurs: readonly T[]
  readonly valeur: T
  readonly onChange: (valeur: T) => void
  readonly libelle: (valeur: T) => { readonly court: string; readonly complet: string }
  readonly disposition?: DispositionBascules
}) => {
  const dessin = DISPOSITIONS_BASCULES[disposition]
  return (
    <fieldset aria-label={legende} className={dessin.groupe}>
      {valeurs.map((option) => {
        const libelles = libelle(option)
        const active = option === valeur
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            aria-label={nomBascule(libelles)}
            onClick={() => onChange(option)}
            className={`relative border font-score text-etiquette uppercase leading-none whitespace-nowrap after:absolute after:inset-x-0 ${dessin.puce} ${
              active
                ? `border-laiton text-laiton-clair ${dessin.active}`
                : 'border-craie/25 text-craie-2'
            }`}
          >
            {libelles.court}
          </button>
        )
      })}
    </fieldset>
  )
}

/** Une ligne prête à dessiner : le classement est déjà fait (`podium.ts`). */
export type LigneClassement = {
  readonly id: string
  readonly nom: string
  readonly couleur: PlayerColor | null
  readonly texte: string
  /** De 0 à 1. */
  readonly largeur: number
  readonly enTete: boolean
  /** Sans occasion : « — » en `craie-3`. */
  readonly absente: boolean
  /** Après la valeur, sur la barre : « / 16 » (Victoires, R1-Q7). Jamais si absente. */
  readonly complement?: string
}

/**
 * Le premier en grand : avatar 34 px, nom, chiffre `text-5xl`.
 *
 * Le chiffre est en `laiton-clair` seulement s'il y a un vrai premier ; sans
 * personne en tête, `craie-vive` (Q2) ; sans occasion, « — » en `craie-3`.
 */
export const GrandeLignePodium = ({
  premier,
  complement = premier.complement,
}: {
  readonly premier: LigneClassement
  /** Le petit texte après le grand chiffre : « / 16 », « fl. ». */
  readonly complement?: string
}) => (
  <p className="mt-3 mb-2.5 flex items-center gap-2.5">
    <Avatar nom={premier.nom} couleur={premier.couleur} taille="ms" />
    <span className="min-w-0 truncate font-score text-base font-bold uppercase tracking-[0.08em] text-craie-vive">
      {premier.nom}
    </span>
    <span className="ml-auto shrink-0 whitespace-nowrap">
      <span
        className={`chiffres text-5xl font-bold leading-[0.9] ${
          premier.absente
            ? 'text-craie-3'
            : premier.enTete
              ? 'text-laiton-clair'
              : 'text-craie-vive'
        }`}
      >
        {premier.texte}
      </span>
      {complement && !premier.absente && (
        <span className="chiffres ml-1 text-sm text-craie-3">{complement}</span>
      )}
    </span>
  </p>
)

/**
 * ⚠️ Des colonnes de **largeur fixe** : les pistes de toutes les barres d'une
 * carte ont la même longueur, sinon une barre plus courte mentirait sur
 * l'écart (T12). La colonne des valeurs s'élargit quand une ligne porte un
 * complément (« 100 / 120 »).
 */
const GRILLES = {
  simple: 'grid-cols-[24px_54px_1fr_44px]',
  avecComplement: 'grid-cols-[24px_54px_1fr_72px]',
} as const

/** L'écart entre deux joueurs : serré dans une carte, aéré dans la liste complète du modal. */
export type Espacement = 'carte' | 'liste'
const ECARTS: Record<Espacement, string> = { carte: 'gap-2', liste: 'gap-3.5' }

/**
 * Tout le monde en barres — ou les seuls visibles d'une carte coupée.
 *
 * Ne connaît pas `PlayerCareer` : il reçoit des lignes prêtes. Barres et
 * avatars sont `aria-hidden` ; chaque valeur se lit en texte.
 */
export const BarresPodium = ({
  lignes,
  espacement = 'carte',
}: {
  readonly lignes: readonly LigneClassement[]
  /** `liste` : la liste complète du modal, plus aérée (14 px entre joueurs au lieu de 8). */
  readonly espacement?: Espacement
}) => {
  const grille = lignes.some((ligne) => ligne.complement) ? GRILLES.avecComplement : GRILLES.simple

  return (
    <ol className={`flex flex-col ${ECARTS[espacement]}`}>
      {lignes.map((ligne) => (
        <li key={ligne.id} className={`grid items-center gap-2 ${grille}`}>
          <Avatar nom={ligne.nom} couleur={ligne.couleur} taille="xs" />
          <span className="truncate font-score text-etiquette uppercase tracking-[0.05em] text-craie">
            {ligne.nom}
          </span>
          <span aria-hidden="true" className="block h-2.5 bg-craie/8">
            <span
              className={`block h-full ${ligne.enTete ? 'bg-laiton' : 'bg-craie/72'}`}
              style={{ width: `${ligne.largeur * 100}%` }}
            />
          </span>
          <span className="text-right whitespace-nowrap">
            <span
              className={`chiffres text-nom-serre font-bold ${
                ligne.absente ? 'text-craie-3' : ligne.enTete ? 'text-laiton-clair' : 'text-craie'
              }`}
            >
              {ligne.texte}
            </span>
            {ligne.complement && !ligne.absente && (
              <span className="chiffres ml-1 text-etiquette text-craie-3">{ligne.complement}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}

/**
 * « Tout voir » : sous une carte coupée à ses N premiers. Discret (`craie-3`,
 * majuscules), pleine largeur, 48 px. Il ouvre un dialogue : `aria-haspopup`,
 * et un nom qui dit lequel (« Tout voir, Victoires »).
 */
export const BoutonToutVoir = ({
  titre,
  onClick,
}: {
  readonly titre: string
  readonly onClick: () => void
}) => (
  <button
    type="button"
    aria-haspopup="dialog"
    aria-label={nomToutVoir(titre)}
    onClick={onClick}
    className="mt-2.5 min-h-12 w-full border border-craie/25 font-score text-etiquette uppercase tracking-[0.18em] text-craie-3"
  >
    {LIBELLE_TOUT_VOIR}
  </button>
)

type PropsClassement = {
  /** Le classement complet : la grande ligne est `lignes[0]`. */
  readonly lignes: readonly LigneClassement[]
  /** Les barres montrées dans la carte (`apercuPodium`). */
  readonly visibles: readonly LigneClassement[]
  /** Le complément de la grande ligne, quand ce n'est pas celui du premier (« fl. »). */
  readonly complement?: string
  /** Présent quand la carte est coupée. */
  readonly toutVoir?: { readonly titre: string; readonly onClick: () => void }
}

/** Le premier en grand, puis les barres visibles, puis « Tout voir » s'il le faut. */
export const ClassementPodium = ({ lignes, visibles, complement, toutVoir }: PropsClassement) => {
  const premier = lignes[0]
  if (!premier) return null

  return (
    <>
      <GrandeLignePodium premier={premier} complement={complement ?? premier.complement} />
      <BarresPodium lignes={visibles} />
      {toutVoir && <BoutonToutVoir titre={toutVoir.titre} onClick={toutVoir.onClick} />}
    </>
  )
}
