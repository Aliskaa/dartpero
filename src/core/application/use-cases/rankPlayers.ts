import type {
  CricketSummary,
  KillerSummary,
  MatchSummary,
  TourDuMondeSummary,
  X01Summary,
} from '../ports/driving/MatchSummary'

/**
 * Le classement des joueurs d'une partie, **calculé ici et nulle part ailleurs** :
 * l'Accueil et l'Historique l'affichent, ils ne le recalculent pas. Fonction
 * pure d'`application`, comme `matchStatus` : elle ne lit qu'un `MatchSummary`.
 *
 * Les clés suivent `CLAUDE.md` § Règles du jeu :
 * - X01 : le vainqueur, sinon le plus de sets, puis de manches du set en cours,
 *   puis le plus petit reste ;
 * - Cricket : le vainqueur, sinon le plus gros score — **le plus petit en
 *   cut-throat**, la seule comparaison du projet qui s'inverse —, puis le plus
 *   de cibles fermées ;
 * - Tour du monde : ceux qui ont bouclé, le moins de fléchettes d'abord, puis la
 *   cible la plus avancée ;
 * - Killer : le rang du domaine (gagnant, vivants par vies, éliminés dans
 *   l'ordre inverse d'élimination) ;
 * - entraînement : un seul joueur, l'ordre tel quel.
 *
 * Égalité parfaite : l'ordre de jeu reste (tri stable), aucun départage inventé.
 * Rien n'est muté : la liste d'origine est copiée.
 */

type Comparateur<P> = (a: P, b: P) => number

/** Le vainqueur d'abord : `-1` quand `a` l'est, `1` quand `b` l'est, `0` sinon. */
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

/**
 * Killer : le rang est déjà calculé par le domaine (`KillerRules.ranking`,
 * porté par le résumé) — il n'est pas recalculé ici. Deux vivants à vies
 * égales partagent leur rang : le tri stable les garde dans l'ordre de jeu.
 */
const comparateurKiller: Comparateur<KillerSummary['players'][number]> = (a, b) => a.rank - b.rank

/** Le comparateur du mode, ou `null` quand l'ordre de jeu fait foi (entraînement). */
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

/**
 * Les joueurs **à égalité avec le premier sur toutes les clés** du classement :
 * un seul quand il y a un vainqueur ou un meilleur score, plusieurs sur un
 * match nul (Tour du monde) ou une partie sans vainqueur. L'entraînement, qui
 * n'a qu'un joueur et rien à comparer, rend ce joueur.
 */
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
