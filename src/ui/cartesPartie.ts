import type { MatchSummary } from '@/core/application/ports/driving/MatchSummary'
import { leadingPlayers, rankPlayers } from '@/core/application/use-cases/rankPlayers'
import type { GameModeId } from '@/core/domain/games'
import type { Segment } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import type { NomPictogramme } from '@/ui/composants/commun/Pictogramme'
import { groupeDeJour } from '@/ui/jourCalendaire'
import {
  DETAIL_CARTE_CRICKET,
  detailCarteEntrainement,
  detailCarteTourDuMonde,
  detailCarteX01,
  heureCourte,
  LIBELLE_EN_COURS,
  LIBELLE_ETAT_DERNIER_TOUR,
  libelleDateDeCarte,
  libelleEnVie,
  libelleEtatEntrainement,
  libelleEtatX01,
  libelleFraction,
  libelleJourEtHeure,
  libelleVies,
  nomJoueur,
  parleAucuneSortie,
  parleCibles,
  parleFlechettes,
  parleGagne,
  parleGagneEnManches,
  parleJoueur,
  parlePhrase,
  parlePoints,
  parleReste,
  parleSansVainqueur,
  parleSorties,
  parleVies,
  reglesCarteEntrainement,
  reglesCarteTourDuMonde,
  reglesCarteX01,
  SEUIL_CARRES_JAUGE,
  SUFFIXE_FLECHETTES,
  sousTitreBandeauCricket,
  UNITE_CARTE,
  VALEUR_ABSENTE,
} from '@/ui/labels'

/**
 * Ce que les deux cartes de partie (ligne de feuille, mini tableau) affichent, calculé hors des composants
 * : un `switch` exhaustif sur `MatchSummary`, le français dans `labels.ts`.
 */

export const PICTOGRAMME_DU_MODE: Record<GameModeId, NomPictogramme> = {
  X01: 'x01',
  CRICKET: 'cricket',
  TOUR_DU_MONDE: 'tour-du-monde',
  KILLER: 'killer',
  CHECKOUT_PRACTICE: 'entrainement',
}

/** `pleins` sur `total` ; `carres` quand le total tient en carrés, sinon « 3/10 ». */
export type FractionJauge = {
  readonly pleins: number
  readonly total: number
  readonly carres: boolean
}

export type JaugeCarte =
  | { readonly type: 'x01'; readonly manches: FractionJauge; readonly sets: FractionJauge | null }
  | { readonly type: 'cricket'; readonly fermees: number; readonly total: number }
  | {
      readonly type: 'barre'
      readonly rempli: number
      readonly total: number
      readonly bouclee: boolean
    }
  /** Killer : les vies en carrés, pleins (restantes) puis en tirets (perdues). */
  | { readonly type: 'vies'; readonly restantes: number; readonly total: number }

export type JoueurCarte = {
  readonly elimine?: boolean
  readonly playerId: PlayerId
  readonly nom: string
  readonly premier: boolean
  readonly enTeteDuClassement: boolean
  readonly valeur: string
  readonly chiffre: { readonly valeur: string; readonly petit: string | null }
  readonly jauge: JaugeCarte
}

export type VueCarte = {
  readonly mode: GameModeId
  readonly pictogramme: NomPictogramme
  readonly detail: string
  readonly unite: string
  readonly regles: string
  readonly joueurs: readonly JoueurCarte[]
  readonly etat: string
  readonly phrase: string
}

const fraction = (pleins: number, total: number): FractionJauge => ({
  pleins,
  total,
  carres: total <= SEUIL_CARRES_JAUGE,
})

/** Une cible de parcours : un secteur, ou la bulle. */
const cible = (segment: Segment): number | 'BULL' =>
  typeof segment === 'number' ? segment : 'BULL'

/** Ce qu'un joueur dit à voix haute : sa valeur, son unité (dite une fois par suite), et s'il gagne. */
type Parole = {
  readonly nom: string
  readonly gagne: boolean
  readonly unite: string
  readonly parle: ((avecUnite: boolean) => string) | null
  readonly enManches?: number
}

const construirePhrase = (tete: string | null, paroles: readonly Parole[]): string => {
  let uniteDite: string | null = null
  const segments = paroles.map((parole) => {
    const avecUnite = parole.unite !== uniteDite
    const valeur = parole.parle ? parole.parle(avecUnite) : null
    if (parole.parle) uniteDite = parole.unite
    if (parole.gagne && parole.enManches !== undefined)
      return parleGagneEnManches(parole.nom, parole.enManches)
    if (parole.gagne) return parleGagne(parole.nom, valeur)
    return parleJoueur(parole.nom, valeur ?? '')
  })
  return parlePhrase(tete, segments)
}

/** La vue d'une partie. */
export const vueCarte = (partie: MatchSummary): VueCarte => {
  const tete = new Set<PlayerId>(leadingPlayers(partie).map((joueur) => joueur.playerId))
  const sansVainqueur = partie.finished && partie.winnerId === null
  const enTete = (playerId: PlayerId): boolean => partie.finished && tete.has(playerId)
  // Le mini tableau ne teinte les ex æquo en tête que s'il reste quelqu'un derrière eux :
  // au départ (tous égaux), aucune ligne n'est teintée.
  const teinte = (playerId: PlayerId): boolean =>
    tete.has(playerId) && tete.size < partie.players.length
  const teteDePhrase = sansVainqueur && partie.mode !== 'CHECKOUT_PRACTICE'
  const phraseTete = teteDePhrase ? parleSansVainqueur(partie.mode) : null
  const gagne = (playerId: PlayerId): boolean => partie.finished && partie.winnerId === playerId

  switch (partie.mode) {
    case 'X01': {
      const { legsToWin, setsToWin, startingScore } = partie.config
      const classement = rankPlayers(partie)
      const avecSets = setsToWin > 1
      const setsGagnes = partie.players.reduce((somme, joueur) => somme + joueur.setsWon, 0)
      const joueurs = classement.map((joueur): JoueurCarte => {
        const vainqueur = gagne(joueur.playerId)
        return {
          playerId: joueur.playerId,
          nom: nomJoueur(joueur.name),
          premier: enTete(joueur.playerId),
          enTeteDuClassement: teinte(joueur.playerId),
          valeur: vainqueur ? '' : String(joueur.remaining),
          chiffre: { valeur: String(joueur.remaining), petit: null },
          jauge: {
            type: 'x01',
            manches: fraction(joueur.legsWonInSet, legsToWin),
            sets: avecSets ? fraction(joueur.setsWon, setsToWin) : null,
          },
        }
      })
      return {
        mode: 'X01',
        pictogramme: PICTOGRAMME_DU_MODE.X01,
        detail: detailCarteX01(startingScore),
        unite: UNITE_CARTE.X01,
        regles: reglesCarteX01(startingScore, legsToWin, setsToWin),
        joueurs,
        etat: libelleEtatX01(partie.legsPlayed + 1, avecSets ? setsGagnes + 1 : null),
        phrase: construirePhrase(
          phraseTete,
          classement.map((joueur) => ({
            nom: nomJoueur(joueur.name),
            gagne: gagne(joueur.playerId),
            unite: 'remaining',
            enManches: partie.legsPlayed,
            parle: gagne(joueur.playerId)
              ? null
              : (avecUnite) => parleReste(joueur.remaining, avecUnite),
          })),
        ),
      }
    }

    case 'CRICKET': {
      const classement = rankPlayers(partie)
      return {
        mode: 'CRICKET',
        pictogramme: PICTOGRAMME_DU_MODE.CRICKET,
        detail: DETAIL_CARTE_CRICKET[partie.config.variant],
        unite: UNITE_CARTE.CRICKET,
        regles: sousTitreBandeauCricket(partie.config.variant, partie.targetsTotal),
        joueurs: classement.map((joueur) => ({
          playerId: joueur.playerId,
          nom: nomJoueur(joueur.name),
          premier: enTete(joueur.playerId),
          enTeteDuClassement: teinte(joueur.playerId),
          valeur: String(joueur.score),
          chiffre: { valeur: String(joueur.score), petit: null },
          jauge: { type: 'cricket', fermees: joueur.closedTargets, total: partie.targetsTotal },
        })),
        etat: LIBELLE_EN_COURS,
        phrase: construirePhrase(
          phraseTete,
          classement.map((joueur) => ({
            nom: nomJoueur(joueur.name),
            gagne: gagne(joueur.playerId),
            unite: 'points',
            parle: (avecUnite) => parlePoints(joueur.score, avecUnite),
          })),
        ),
      }
    }

    case 'TOUR_DU_MONDE': {
      const { targets } = partie.config
      const premiere = cible(targets[0] ?? 20)
      const derniere = cible(targets[targets.length - 1] ?? 'BULL')
      const classement = rankPlayers(partie)
      const dernierTour = !partie.finished && classement.some((j) => j.finishedInDarts !== null)
      return {
        mode: 'TOUR_DU_MONDE',
        pictogramme: PICTOGRAMME_DU_MODE.TOUR_DU_MONDE,
        detail: detailCarteTourDuMonde(premiere, derniere),
        unite: UNITE_CARTE.TOUR_DU_MONDE,
        regles: reglesCarteTourDuMonde(premiere, derniere),
        joueurs: classement.map((joueur) => {
          const bouclee = joueur.finishedInDarts !== null
          return {
            playerId: joueur.playerId,
            nom: nomJoueur(joueur.name),
            premier: enTete(joueur.playerId),
            enTeteDuClassement: teinte(joueur.playerId),
            valeur: bouclee
              ? String(joueur.finishedInDarts)
              : libelleFraction(joueur.targetIndex, partie.targetsTotal),
            chiffre: bouclee
              ? { valeur: String(joueur.finishedInDarts), petit: SUFFIXE_FLECHETTES }
              : { valeur: String(joueur.targetIndex), petit: `/${partie.targetsTotal}` },
            jauge: {
              type: 'barre',
              rempli: bouclee ? partie.targetsTotal : joueur.targetIndex,
              total: partie.targetsTotal,
              bouclee,
            },
          }
        }),
        etat: dernierTour ? LIBELLE_ETAT_DERNIER_TOUR : LIBELLE_EN_COURS,
        phrase: construirePhrase(
          phraseTete,
          classement.map((joueur) => ({
            nom: nomJoueur(joueur.name),
            gagne: gagne(joueur.playerId),
            unite: joueur.finishedInDarts !== null ? 'darts' : 'targets',
            parle: (avecUnite) =>
              joueur.finishedInDarts !== null
                ? parleFlechettes(joueur.finishedInDarts, avecUnite)
                : parleCibles(joueur.targetIndex, partie.targetsTotal, avecUnite),
          })),
        ),
      }
    }

    // Le mini tableau de la planche : classé par `rank` (vies décroissantes, ex æquo dans l'ordre de jeu,
    // éliminés en bas), vies en carrés, « N en vie ».
    case 'KILLER': {
      const { startingLives } = partie.config
      const classement = rankPlayers(partie)
      const vivants = partie.players.filter((joueur) => !joueur.eliminated).length
      return {
        mode: 'KILLER',
        pictogramme: PICTOGRAMME_DU_MODE.KILLER,
        detail: libelleVies(startingLives),
        unite: UNITE_CARTE.KILLER,
        // « 3 vies » seulement : ni le tirage, ni la variante.
        regles: libelleVies(startingLives),
        joueurs: classement.map((joueur) => ({
          playerId: joueur.playerId,
          nom: nomJoueur(joueur.name),
          premier: enTete(joueur.playerId),
          // Pas de teinte de la ligne de tête en cours de partie.
          enTeteDuClassement: false,
          // Le rang une fois la partie finie, les vies en cours.
          valeur: partie.finished ? String(joueur.rank) : String(joueur.lives),
          chiffre: {
            valeur: partie.finished ? String(joueur.rank) : String(joueur.lives),
            petit: null,
          },
          jauge: { type: 'vies', restantes: joueur.lives, total: startingLives },
          elimine: joueur.eliminated,
        })),
        etat: libelleEnVie(vivants),
        phrase: construirePhrase(
          phraseTete,
          classement.map((joueur) => ({
            nom: nomJoueur(joueur.name),
            gagne: gagne(joueur.playerId),
            unite: 'lives',
            parle: (avecUnite) => parleVies(joueur.lives, avecUnite),
          })),
        ),
      }
    }

    case 'CHECKOUT_PRACTICE': {
      const { rounds, minTarget, maxTarget } = partie.config
      const reussies = partie.roundsWon
      const jouees = partie.roundsPlayed
      // Un seul joueur et rien à classer : ni laiton ni « ✓ ».
      const joueurs = partie.players.map((joueur) => ({
        playerId: joueur.playerId,
        nom: nomJoueur(joueur.name),
        premier: false,
        enTeteDuClassement: teinte(joueur.playerId),
        // Rien joué : « — », jamais « 0/0 » (comme `pourcent`).
        valeur: jouees === 0 ? VALEUR_ABSENTE : libelleFraction(reussies, jouees),
        chiffre:
          jouees === 0
            ? { valeur: VALEUR_ABSENTE, petit: null }
            : { valeur: String(reussies), petit: `/${jouees}` },
        jauge: { type: 'barre', rempli: reussies, total: rounds, bouclee: false } as const,
      }))
      return {
        mode: 'CHECKOUT_PRACTICE',
        pictogramme: PICTOGRAMME_DU_MODE.CHECKOUT_PRACTICE,
        detail: detailCarteEntrainement(minTarget, maxTarget),
        unite: UNITE_CARTE.CHECKOUT_PRACTICE,
        regles: reglesCarteEntrainement(rounds, minTarget, maxTarget),
        joueurs,
        etat: libelleEtatEntrainement(jouees + 1),
        phrase: construirePhrase(
          null,
          partie.players.map((joueur) => ({
            nom: nomJoueur(joueur.name),
            gagne: false,
            unite: 'rounds',
            parle: () => (jouees === 0 ? parleAucuneSortie() : parleSorties(reussies, jouees)),
          })),
        ),
      }
    }

    default: {
      const jamais: never = partie
      return jamais
    }
  }
}

/**
 * Le « quand » d'une carte : l'heure seule aujourd'hui à l'Accueil, « dim. 18 h 10 » dans la semaine (et, à
 * Parties, dès aujourd'hui), « 3 oct. 22 h 15 » au-delà, « 3 oct. 2025 » d'une autre année.
 */
export const quandCarte = (
  createdAt: number,
  maintenant: number,
  ecran: 'accueil' | 'parties',
): string => {
  const groupe = groupeDeJour(createdAt, maintenant)
  if (groupe === null) return libelleDateDeCarte(createdAt, maintenant)
  if (ecran === 'accueil' && groupe === 'AUJOURDHUI') return heureCourte(createdAt)
  return libelleJourEtHeure(createdAt)
}
