import { Crown, Handshake } from 'lucide-react'
import type { ReactNode } from 'react'
import type { GameModeId } from '@/core/domain/games'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { variablesAccent } from '@/ui/accents'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Cible } from '@/ui/composants/commun/Cible'

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
 * Accent du mode + éclat vert — célébration hors saisie, jamais pendant une volée.
 */
export const TableauHonneur = ({ mode, surtitre, vainqueur, exAequo, children, phrase }: Props) => (
  <section
    style={variablesAccent(mode)}
    className="feuille relative animate-monter overflow-hidden px-6 py-7 text-center"
  >
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-accent-mode/35 to-transparent animate-eclat"
    />
    <Cible
      className="pointer-events-none absolute -right-16 -top-16 size-56 opacity-[0.09]"
      avecNumeros
    />

    <div className="relative flex flex-col items-center">
      <p className="font-score text-[0.65rem] uppercase tracking-[0.35em] text-craie/60">
        {surtitre}
      </p>

      {vainqueur ? (
        <>
          <span className="relative mt-4 inline-flex">
            <Avatar
              nom={vainqueur.nom}
              couleur={vainqueur.couleur}
              taille="xl"
              className="shadow-[0_0_40px_-8px_var(--color-accent-mode)]"
            />
            <Crown
              aria-hidden="true"
              className="absolute -top-4 left-1/2 size-8 -translate-x-1/2 -rotate-12 fill-accent-mode text-accent-mode drop-shadow-[0_2px_2px_var(--ombre-plaque)]"
            />
          </span>

          <h1 className="mt-4 font-display text-4xl text-craie-vive drop-shadow-[0_3px_0_var(--ombre-plaque)]">
            {vainqueur.nom}
          </h1>
          <p className="mt-1 font-score text-sm font-bold uppercase tracking-[0.3em] text-vert-cible">
            Vainqueur
          </p>
          {vainqueur.detail && (
            <p className="chiffres mt-2 text-sm text-craie/70">{vainqueur.detail}</p>
          )}
        </>
      ) : exAequo ? (
        <>
          <Handshake aria-hidden="true" className="mt-4 size-16 text-accent-mode" />
          <h1 className="mt-3 font-display text-4xl text-craie-vive drop-shadow-[0_3px_0_var(--ombre-plaque)]">
            {exAequo.titre}
          </h1>
          <p className="mt-1 max-w-xs text-sm text-craie/70">{exAequo.detail}</p>
        </>
      ) : children ? null : (
        <h1 className="mt-4 font-display text-3xl text-accent-mode">Partie en cours</h1>
      )}

      {children}

      {phrase && (
        <p className="mt-4 max-w-xs animate-craie text-sm italic text-craie/75">{phrase}</p>
      )}
    </div>
  </section>
)
