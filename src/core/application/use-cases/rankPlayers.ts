import type {
  CricketSummary,
  KillerSummary,
  MatchSummary,
  TourDuMondeSummary,
  X01Summary,
} from '../ports/driving/MatchSummary'

// Classement calculé ici seulement. Égalité parfaite : l'ordre de jeu reste (tri stable), aucun départage inventé.

type Comparateur<P> = (a: P, b: P) => number

const vainqueurDabord = (
  winnerId: unknown,
  a: { readonly playerId: unknown },
  b: { readonly playerId: unknown },
): number => {
  if (winnerId === null) return 0
  const aGagne = a.playerId === winnerId
  const bGagne = b.playerId === winnerId
  if (aGagne === bGagne) return 0
  return aGagne ? -1 : 1
}

const comparateurX01 =
  (partie: X01Summary): Comparateur<X01Summary['players'][number]> =>
  (a, b) =>
    vainqueurDabord(partie.winnerId, a, b) ||
    b.setsWon - a.setsWon ||
    b.legsWonInSet - a.legsWonInSet ||
    a.remaining - b.remaining

const comparateurCricket =
  (partie: CricketSummary): Comparateur<CricketSummary['players'][number]> =>
  (a, b) => {
    // Cut-throat : les points sont une punition distribuée, le plus petit gagne.
    const sens = partie.config.variant === 'CUT_THROAT' ? -1 : 1
    return (
      vainqueurDabord(partie.winnerId, a, b) ||
      sens * (b.score - a.score) ||
      b.closedTargets - a.closedTargets
    )
  }

const comparateurTourDuMonde: Comparateur<TourDuMondeSummary['players'][number]> = (a, b) => {
  const aBoucle = a.finishedInDarts !== null
  const bBoucle = b.finishedInDarts !== null
  if (aBoucle !== bBoucle) return aBoucle ? -1 : 1
  if (a.finishedInDarts !== null && b.finishedInDarts !== null) {
    const ecart = a.finishedInDarts - b.finishedInDarts
    if (ecart !== 0) return ecart
  }
  return b.targetIndex - a.targetIndex
}

// Killer : le rang vient du domaine ; deux vivants à vies égales partagent leur rang.
const comparateurKiller: Comparateur<KillerSummary['players'][number]> = (a, b) => a.rank - b.rank

const comparateurDe = (partie: MatchSummary): Comparateur<unknown> | null => {
  switch (partie.mode) {
    case 'X01':
      return comparateurX01(partie) as Comparateur<unknown>
    case 'CRICKET':
      return comparateurCricket(partie) as Comparateur<unknown>
    case 'TOUR_DU_MONDE':
      return comparateurTourDuMonde as Comparateur<unknown>
    case 'KILLER':
      return comparateurKiller as Comparateur<unknown>
    case 'CHECKOUT_PRACTICE':
      return null
    default: {
      const jamais: never = partie
      return jamais
    }
  }
}

export const rankPlayers = <S extends MatchSummary>(partie: S): S['players'] => {
  const comparateur = comparateurDe(partie)
  const joueurs: unknown[] = [...partie.players]
  if (comparateur) joueurs.sort(comparateur)
  return joueurs as S['players']
}

/** Les joueurs à égalité avec le premier sur toutes les clés du classement. */
export const leadingPlayers = <S extends MatchSummary>(partie: S): S['players'] => {
  const classement: readonly unknown[] = rankPlayers(partie)
  const [premier] = classement
  if (premier === undefined) return [] as unknown as S['players']
  const comparateur = comparateurDe(partie)
  const tete = comparateur
    ? classement.filter((joueur) => comparateur(joueur, premier) === 0)
    : [premier]
  return tete as S['players']
}
