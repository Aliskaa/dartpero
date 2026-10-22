import { type ReactNode, useId } from 'react'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { type NomPictogramme, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { LIBELLE_TOUT_VOIR, nomBascule, nomToutVoir } from '@/ui/labels'

/** Cartes du podium : une par thème, le premier en grand puis les N premiers en barres. */

type PropsCarte = {
  readonly titre: string
  /** Nom accessible quand le titre visible est abrégé ; il contient le visible. */
  readonly nom?: string
  readonly pictogramme: NomPictogramme
  /** À droite du titre : les bascules. */
  readonly action?: ReactNode
  readonly children: ReactNode
}

/** Une carte : région nommée par son `<h2>`. ⚠️ Titre en `laiton` : 4,40:1 en thème clair, écart connu de la charte. */
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

/** Bascules d'une carte (même API que `ChoixSegmente`). ⚠️ Zone d'appui de 48 px par pseudo-élément, puce visible plus petite. */
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

/** Le premier en grand : avatar, nom, chiffre ; `laiton-clair` seulement s'il y a un vrai premier. */
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

/** ⚠️ Colonnes de largeur fixe : des pistes égales, sinon une barre courte mentirait sur l'écart. */
const GRILLES = {
  simple: 'grid-cols-[24px_54px_1fr_44px]',
  avecComplement: 'grid-cols-[24px_54px_1fr_72px]',
} as const

/** L'écart entre deux joueurs : serré dans une carte, aéré dans la liste complète du modal. */
export type Espacement = 'carte' | 'liste'
const ECARTS: Record<Espacement, string> = { carte: 'gap-2', liste: 'gap-3.5' }

/** Tout le monde en barres, ou les seuls visibles d'une carte coupée ; reçoit des lignes prêtes. */
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

/** « Tout voir » : ouvre un dialogue (`aria-haspopup`), son nom dit lequel. */
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
