import type { CSSProperties, ReactNode } from 'react'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { couleurJoueur } from '@/ui/couleurs'
import { LIBELLE_A_LA_LIGNE } from '@/ui/labels'

// Les briques de l'écran miroir : lecture seule, aucun bouton de saisie, lues à 2-3 m.

type PropsCadre = {
  /** Le bandeau du haut : les règles, le nom de la partie (discret), où l'on en est. */
  readonly gauche: string
  readonly nom: string
  readonly droite?: string
  readonly children: ReactNode
  /** La barre de la volée en cours, en bas ; absente en fin de partie. */
  readonly volee?: ReactNode
}

export const CadreMiroir = ({ gauche, nom, droite, children, volee }: PropsCadre) => (
  <div className="flex h-full min-h-0 flex-col">
    <div className="flex h-9 shrink-0 items-center justify-between gap-3 bg-feutre-nuit px-3 font-score text-sm uppercase tracking-[0.14em]">
      <span className="min-w-0 truncate text-laiton-clair">{gauche}</span>
      <span className="min-w-0 truncate text-craie-3">{nom}</span>
      <span className="shrink-0 text-lg font-bold text-laiton-clair">{droite}</span>
    </div>
    <div className="flex min-h-0 flex-1 flex-col p-1.5">{children}</div>
    {volee}
  </div>
)

export type CaseMiroir = {
  readonly libelle: string
  /** La fléchette de sortie, en attente de « Valider la sortie » : en pointillé, rien de célébré. */
  readonly enAttente?: boolean
}

export const VoleeMiroir = ({
  libelle,
  cases,
  total,
}: {
  readonly libelle: string
  readonly cases: readonly CaseMiroir[]
  readonly total?: string
}) => (
  <div className="flex min-h-16 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 bg-feutre-nuit px-3.5 py-2">
    <span className="w-full truncate font-score text-xl uppercase tracking-[0.12em] text-laiton-clair landscape:w-56">
      {libelle}
    </span>
    <output aria-label={libelle} className="flex gap-3">
      {[0, 1, 2].map((rang) => {
        const flechette = cases[rang]
        return (
          <span
            key={rang}
            data-attente={flechette?.enAttente ? 'oui' : undefined}
            className={[
              'chiffres flex h-11 min-w-18 items-center justify-center border-2 px-2 text-3xl font-bold transition-[border-color,color] duration-(--duration-vif) ease-(--ease-sec)',
              flechette
                ? flechette.enAttente
                  ? 'border-dashed border-laiton text-laiton-clair'
                  : 'border-craie text-craie-vive'
                : 'border-craie/25 text-craie-3',
            ].join(' ')}
          >
            {flechette ? flechette.libelle : '—'}
          </span>
        )
      })}
    </output>
    {total && (
      <span className="chiffres ml-auto text-3xl font-bold text-laiton-clair">{total}</span>
    )}
  </div>
)

/** Le fond d'un joueur : filet haut à sa couleur ; à la ligne, cerclé et teinté de sa couleur. */
export const styleJoueurMiroir = (couleur: PlayerColor | null, actif: boolean): CSSProperties => {
  const { bord } = couleurJoueur(couleur)
  return actif
    ? {
        borderTopColor: bord,
        boxShadow: `inset 0 0 0 3px ${bord}`,
        backgroundColor: `color-mix(in srgb, ${bord} 14%, var(--color-ardoise))`,
      }
    : { borderTopColor: bord }
}

/** Les classes d'un joueur du miroir : le passage de tour glisse d'un fond à l'autre au lieu de clignoter. */
export const CLASSES_JOUEUR_MIROIR =
  'border-t-5 bg-ardoise transition-[background-color,box-shadow] duration-(--duration-normal) ease-(--ease-sec)'

/**
 * L'étiquette « À la ligne » à la couleur du joueur (paire fond / texte du profil).
 * `barre` : une barre pleine sans texte, quand la colonne est trop étroite pour le dire (Cricket).
 */
export const ALaLigne = ({
  couleur,
  barre = false,
}: {
  readonly couleur: PlayerColor | null
  readonly barre?: boolean
}) => {
  const teinte = couleurJoueur(couleur)
  return (
    <span
      style={{ backgroundColor: teinte.fond, color: teinte.texte }}
      className={
        barre
          ? 'block h-6 w-full'
          : 'shrink-0 px-2 py-0.5 font-score text-sm uppercase tracking-[0.16em]'
      }
    >
      {barre ? <span className="sr-only">{LIBELLE_A_LA_LIGNE}</span> : LIBELLE_A_LA_LIGNE}
    </span>
  )
}

export type LignePodiumMiroir = {
  readonly cle: string
  readonly rang: number
  readonly nom: string
  readonly sous?: string
  readonly valeur?: string
}

/** La fin de partie : le vainqueur en grand, le classement à côté. Seulement quand le journal la contient. */
export const PodiumMiroir = ({
  etiquette,
  vainqueur,
  detail,
  lignes,
}: {
  readonly etiquette: string
  readonly vainqueur: string
  readonly detail?: string
  readonly lignes: readonly LignePodiumMiroir[]
}) => (
  <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 landscape:grid-cols-[1.3fr_1fr]">
    <section className="flex flex-col items-center justify-center gap-2 border-t-5 border-laiton bg-ardoise p-3 text-center">
      <span className="font-score text-sm font-bold uppercase tracking-[0.2em] text-laiton-clair">
        {etiquette}
      </span>
      <p className="font-display text-6xl leading-none text-laiton-clair">{vainqueur}</p>
      {detail && <p className="font-score uppercase tracking-[0.14em] text-craie-2">{detail}</p>}
    </section>
    <ol className="flex flex-col border-t-5 border-craie bg-ardoise">
      {lignes.map((ligne) => (
        <li
          key={ligne.cle}
          className="grid min-h-12 flex-1 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-craie/12 px-3.5 last:border-b-0"
        >
          <span className="chiffres text-2xl font-bold text-craie-3">{ligne.rang}</span>
          <span className="min-w-0">
            <span className="block truncate font-score text-xl uppercase text-craie-vive">
              {ligne.nom}
            </span>
            {ligne.sous && <span className="block text-sm text-craie-3">{ligne.sous}</span>}
          </span>
          {ligne.valeur && (
            <span className="font-score text-lg text-laiton-clair">{ligne.valeur}</span>
          )}
        </li>
      ))}
    </ol>
  </div>
)

/** Un écran plein sans partie : « ✓ Connecté », « Partage arrêté ». */
export const VoileMiroir = ({
  titre,
  texte,
  coche = false,
  action,
}: {
  readonly titre: string
  readonly texte: string
  readonly coche?: boolean
  /** Une sortie, seulement quand la partie n'est plus là (« Partage arrêté ») ; jamais pendant la partie. */
  readonly action?: ReactNode
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-4 text-center">
    <p className="font-display text-5xl leading-none text-craie-vive">
      {coche && (
        <span aria-hidden="true" className="mr-3 text-vert-cible">
          ✓
        </span>
      )}
      {titre}
    </p>
    <p className="font-score text-xl uppercase tracking-[0.14em] text-craie-2">{texte}</p>
    {action}
  </div>
)

export type MomentMiroir = {
  /** Change → le bandeau se rejoue ; même clé = déjà montré. */
  readonly cle: string
  readonly titre: string
  readonly detail?: string
  readonly ton: 'laiton' | 'bust'
}

/**
 * Le bandeau muet d'un moment (bust, 180, manche, « Partie ! »), posé par-dessus le tableau, en bas :
 * le centre, c'est le reste géant qu'on veut lire à cet instant. `sortant` le fond en 150 ms (opacité
 * seule) ; la couche extérieure porte le fondu, l'intérieure l'entrée, que son `both` ne laisserait pas défaire.
 */
export const BandeauMomentMiroir = ({
  moment,
  sortant = false,
}: {
  readonly moment: MomentMiroir
  readonly sortant?: boolean
}) => (
  <div
    role="status"
    className={[
      'pointer-events-none absolute bottom-24 left-[max(0.375rem,env(safe-area-inset-left))] right-[max(0.375rem,env(safe-area-inset-right))] z-10 transition-opacity duration-150 ease-(--ease-sec)',
      sortant ? 'opacity-0' : 'opacity-100',
    ].join(' ')}
  >
    <div
      className={[
        'animate-monter py-2.5 text-center',
        moment.ton === 'bust' ? 'bg-rouge-cible text-sur-rouge' : 'bg-laiton text-sur-laiton',
      ].join(' ')}
    >
      <p className="font-display text-7xl leading-none">{moment.titre}</p>
      {moment.detail && (
        <p className="mt-1.5 font-score text-lg uppercase tracking-[0.2em]">{moment.detail}</p>
      )}
    </div>
  </div>
)

/** « Connexion perdue » sur la dernière image figée, après 5 s de coupure, en bas : les noms restent lisibles. */
export const BandeauPerduMiroir = ({
  titre,
  texte,
  action,
}: {
  readonly titre: string
  readonly texte: string
  readonly action: ReactNode
}) => (
  <div
    role="alert"
    className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3.5 bg-rouge-cible pl-[max(0.875rem,env(safe-area-inset-left))] pr-[max(0.875rem,env(safe-area-inset-right))] pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 font-score uppercase tracking-[0.14em] text-sur-rouge"
  >
    <div>
      <p className="text-3xl font-bold leading-tight">{titre}</p>
      <p className="text-base">{texte}</p>
    </div>
    {action}
  </div>
)
