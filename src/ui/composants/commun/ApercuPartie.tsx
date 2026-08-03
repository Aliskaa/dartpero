import { Crown } from 'lucide-react'
import type { ReactNode } from 'react'
import type { MatchSummary } from '@/core/application/ports/driving/MatchSummary'
import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { nomJoueur, pluriel } from '@/ui/labels'

/** Le libellé des règles, en français — le cœur n'en fabrique jamais. */
export const libelleRegles = (partie: MatchSummary): string => {
  if (partie.mode === 'TOUR_DU_MONDE') {
    const [premiere] = partie.config.targets
    return `Tour du monde · ${premiere ?? 20} → bulle`
  }

  if (partie.mode === 'CHECKOUT_PRACTICE') {
    const { rounds, minTarget, maxTarget } = partie.config
    return `Entraînement · ${rounds} sorties · ${minTarget} à ${maxTarget}`
  }

  const options = [
    partie.config.doubleOut ? 'double out' : null,
    partie.config.doubleIn ? 'double in' : null,
  ].filter(Boolean)

  return [
    `X01 · ${partie.config.startingScore}`,
    `BO${partie.config.legsToWin * 2 - 1}`,
    ...options,
  ].join(' · ')
}

/** La partie commune d'une ligne : pastille, pseudo, couronne du vainqueur. */
const Ligne = ({
  nom,
  couleur,
  gagnant,
  children,
}: {
  readonly nom: string
  readonly couleur: Player['color'] | null
  readonly gagnant: boolean
  readonly children: ReactNode
}) => (
  <li className="flex items-center gap-2">
    <Avatar nom={nom} couleur={couleur} taille="xs" />
    <span
      className={`min-w-0 flex-1 truncate text-sm ${
        gagnant ? 'font-semibold text-craie-vive' : 'text-craie/75'
      }`}
    >
      {nom}
    </span>
    {gagnant && <Crown aria-hidden="true" className="size-3.5 shrink-0 text-laiton" />}
    {children}
  </li>
)

type Props = {
  readonly partie: MatchSummary
  readonly profils: ReadonlyMap<PlayerId, Player>
  /** Classe le vainqueur en tête. L'accueil garde l'ordre de jeu. */
  readonly classe?: boolean
}

/**
 * Les joueurs d'une partie, résumés — pour l'accueil comme pour l'historique.
 *
 * Chaque mode montre ce qui le caractérise : le score restant au X01, le chemin
 * parcouru au Tour du monde. C'est **le seul endroit de l'UI** où l'on ouvre
 * l'union `MatchSummary`, plutôt que de la disperser dans deux écrans.
 */
export const ApercuPartie = ({ partie, profils, classe = false }: Props) => {
  const enTete = <T extends { playerId: PlayerId }>(joueurs: readonly T[]): readonly T[] =>
    classe
      ? [...joueurs].sort(
          (a, b) =>
            (a.playerId === partie.winnerId ? -1 : 0) - (b.playerId === partie.winnerId ? -1 : 0),
        )
      : joueurs

  if (partie.mode === 'CHECKOUT_PRACTICE') {
    // Solo : une seule ligne, et c'est la réussite qui parle, pas un score.
    return (
      <ul className="flex flex-col gap-1.5">
        {partie.players.map((joueur) => (
          <Ligne
            key={joueur.playerId}
            nom={nomJoueur(joueur.name)}
            couleur={profils.get(joueur.playerId)?.color ?? null}
            gagnant={false}
          >
            <span className="chiffres text-xs text-craie/60">
              {partie.roundsWon}/{partie.roundsPlayed}
            </span>
            <span className="chiffres w-14 text-right text-base font-bold text-craie-vive">
              {Math.round(partie.successPercent)}
              <span className="text-xs font-normal text-craie/50"> %</span>
            </span>
          </Ligne>
        ))}
      </ul>
    )
  }

  if (partie.mode === 'TOUR_DU_MONDE') {
    return (
      <ul className="flex flex-col gap-1.5">
        {enTete(partie.players).map((joueur) => (
          <Ligne
            key={joueur.playerId}
            nom={nomJoueur(joueur.name)}
            couleur={profils.get(joueur.playerId)?.color ?? null}
            gagnant={joueur.playerId === partie.winnerId}
          >
            {joueur.finishedInDarts !== null && (
              <span className="chiffres text-xs text-craie/60">
                {pluriel(joueur.finishedInDarts, 'fléchette', 'fléchettes')}
              </span>
            )}
            <span className="chiffres w-14 text-right text-base font-bold text-craie-vive">
              {joueur.targetIndex}
              <span className="text-xs font-normal text-craie/50">/{partie.targetsTotal}</span>
            </span>
          </Ligne>
        ))}
      </ul>
    )
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {enTete(partie.players).map((joueur) => (
        <Ligne
          key={joueur.playerId}
          nom={nomJoueur(joueur.name)}
          couleur={profils.get(joueur.playerId)?.color ?? null}
          gagnant={joueur.playerId === partie.winnerId}
        >
          <span className="chiffres text-xs text-craie/60">
            {pluriel(joueur.legsWonInSet, 'leg')}
          </span>
          <span className="chiffres w-10 text-right text-base font-bold text-craie-vive">
            {joueur.remaining}
          </span>
        </Ligne>
      ))}
    </ul>
  )
}
