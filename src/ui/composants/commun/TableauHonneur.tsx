import type { ReactNode } from 'react'
import type { GameModeId } from '@/core/domain/games'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { variablesAccent } from '@/ui/accents'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Cible } from '@/ui/composants/commun/Cible'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'

type Vainqueur = {
  readonly nom: string
  readonly couleur: PlayerColor | null
  readonly detail?: string
}

type ExAequo = {
  readonly titre: string
  readonly detail: string
}

type Props = {
  readonly mode: GameModeId
  /**
   * Le nom de la partie, en tête (« Finale des potes », « Dimanche soir ») ;
   * `null` tant qu'il charge. Obligatoire : un résumé qui l'oublierait ne
   * compilerait pas.
   */
  readonly nomPartie: string | null
  readonly surtitre: string
  readonly vainqueur?: Vainqueur
  readonly exAequo?: ExAequo
  /** Contenu libre sous le titre (score de legs, % d'entraînement…). */
  readonly children?: ReactNode
  /** Phrase d'ambiance sous le podium — le côté « apéro ». */
  readonly phrase?: string
}

/**
 * Le tableau d'honneur commun aux résumés : on lit le vainqueur avant tout.
 * Accent du mode + filet vert qui se trace — célébration hors saisie, jamais pendant une volée.
 */
export const TableauHonneur = ({
  mode,
  nomPartie,
  surtitre,
  vainqueur,
  exAequo,
  children,
  phrase,
}: Props) => (
  <section
    style={variablesAccent(mode)}
    className="feuille relative animate-monter overflow-hidden px-6 py-7 text-center"
  >
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 animate-trace-filet border-2 border-vert-cible"
    />
    <Cible
      className="pointer-events-none absolute -right-16 -top-16 size-56 opacity-[0.09]"
      avecNumeros
    />

    <div className="relative flex flex-col items-center">
      {/* Le nom, au-dessus du surtitre. Un paragraphe et non un titre : le
          seul `<h1>` du résumé reste le vainqueur. Hauteur réservée pendant le
          chargement ; un nom long passe à la ligne, il y a la place. */}
      <p className="grave mb-1 min-h-6 max-w-full break-words font-score text-base font-bold tracking-wide text-craie-vive">
        {nomPartie}
      </p>
      <p className="font-score text-etiquette uppercase tracking-[0.35em] text-craie-3">
        {surtitre}
      </p>

      {vainqueur ? (
        <>
          <span className="relative mt-4 inline-flex">
            <Avatar nom={vainqueur.nom} couleur={vainqueur.couleur} taille="xl" />
            <Pictogramme
              nom="victoire"
              taille={32}
              className="absolute -top-4 left-1/2 -translate-x-1/2 -rotate-12 text-laiton-clair drop-shadow-[0_2px_2px_var(--ombre-plaque)]"
            />
          </span>

          <h1 className="mt-4 font-display text-4xl text-craie-vive drop-shadow-[0_3px_0_var(--ombre-plaque)]">
            {vainqueur.nom}
          </h1>
          <p className="mt-1 font-score text-sm font-bold uppercase tracking-[0.3em] text-vert-cible">
            Vainqueur
          </p>
          {vainqueur.detail && (
            <p className="chiffres mt-2 text-sm text-craie-3">{vainqueur.detail}</p>
          )}
        </>
      ) : exAequo ? (
        <>
          <Pictogramme nom="nul" taille={64} className="mt-4 text-craie" />
          <h1 className="mt-3 font-display text-4xl text-craie-vive drop-shadow-[0_3px_0_var(--ombre-plaque)]">
            {exAequo.titre}
          </h1>
          <p className="mt-1 max-w-xs text-sm text-craie-3">{exAequo.detail}</p>
        </>
      ) : children ? null : (
        <h1 className="mt-4 font-display text-3xl text-accent-mode">Partie en cours</h1>
      )}

      {children}

      {phrase && (
        <p className="mt-4 max-w-xs animate-craie text-sm italic text-craie-2">{phrase}</p>
      )}
    </div>
  </section>
)
