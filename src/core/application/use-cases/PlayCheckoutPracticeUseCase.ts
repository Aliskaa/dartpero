import { DomainError } from '../../domain/DomainError'
import type { CheckoutPracticeStarted, MatchEvent } from '../../domain/events/MatchEvent'
import {
  type CheckoutPracticeConfig,
  playableTargets,
} from '../../domain/games/checkout-practice/config'
import {
  CheckoutPracticeRules,
  type CheckoutPracticeState,
} from '../../domain/games/checkout-practice/rules'
import type { Dart } from '../../domain/value-objects/Dart'
import { MatchId } from '../../domain/value-objects/ids'
import type { Clock } from '../ports/driven/Clock'
import type { IdGenerator } from '../ports/driven/IdGenerator'
import type { MatchRepository } from '../ports/driven/MatchRepository'
import type { PlayerRepository } from '../ports/driven/PlayerRepository'
import type { RandomSource } from '../ports/driven/RandomSource'
import type {
  CheckoutPracticeResult,
  PlayCheckoutPractice,
  StartCheckoutPracticeCommand,
} from '../ports/driving/PlayCheckoutPractice'
import { loadMatch } from './loadMatch'

export class PlayCheckoutPracticeUseCase implements PlayCheckoutPractice {
  constructor(
    private readonly matches: MatchRepository,
    private readonly players: PlayerRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly random: RandomSource,
  ) {}

  /**
   * Tire une cible parmi celles réellement finissables.
   *
   * Le résultat part dans le journal : l'aléa n'est consulté **qu'une fois**,
   * au moment où la manche s'ouvre. Annuler une volée ne redistribue donc pas
   * les cartes — sinon l'annulation deviendrait un moyen de changer de cible.
   */
  private tirer(config: CheckoutPracticeConfig): number {
    const cibles = playableTargets(config)
    if (cibles.length === 0) throw new DomainError('No playable checkout in the configured range')

    const cible = cibles[this.random.nextInt(cibles.length)]
    if (cible === undefined) throw new DomainError('Random source returned an out-of-range index')
    return cible
  }

  async start({ playerId, config }: StartCheckoutPracticeCommand): Promise<MatchId> {
    if (!(await this.players.findById(playerId))) {
      throw new DomainError(`Unknown player: ${playerId}`)
    }

    const started: CheckoutPracticeStarted = {
      type: 'CheckoutPracticeStarted',
      config,
      playerIds: [playerId],
      startingPlayerIndex: 0,
    }
    // Valide avant de persister, puis ouvre déjà la première manche : une
    // session commence toujours avec une cible à viser.
    CheckoutPracticeRules.start(started)

    const events: readonly MatchEvent[] = [
      started,
      { type: 'RoundStarted', target: this.tirer(config) },
    ]

    const id = MatchId.of(this.ids.newId())
    const now = this.clock.now()
    await this.matches.save({ id, createdAt: now, updatedAt: now, events })

    return id
  }

  async getState(matchId: MatchId): Promise<CheckoutPracticeState> {
    return CheckoutPracticeRules.project((await loadMatch(this.matches, matchId)).events)
  }

  async recordVisit(matchId: MatchId, darts: readonly Dart[]): Promise<CheckoutPracticeResult> {
    const record = await loadMatch(this.matches, matchId)

    const avant = CheckoutPracticeRules.project(record.events)
    // Les règles d'abord : une volée illégale ne laisse aucune trace.
    const apres = CheckoutPracticeRules.applyVisit(avant, darts)

    const events: MatchEvent[] = [...record.events, { type: 'VisitRecorded', darts }]
    // La manche est close : on tire la suivante tant qu'il en reste.
    if (CheckoutPracticeRules.needsRound(apres)) {
      events.push({ type: 'RoundStarted', target: this.tirer(apres.config) })
    }

    await this.matches.save({ ...record, events, updatedAt: this.clock.now() })

    // L'issue de la manche qu'on vient de jouer : la dernière close.
    const outcome = apres.rounds.filter((round) => round.outcome !== null).at(-1)?.outcome
    if (!outcome) throw new DomainError('The round was not resolved')

    return { state: CheckoutPracticeRules.project(events), outcome }
  }

  async undoLastVisit(matchId: MatchId): Promise<CheckoutPracticeState> {
    const record = await loadMatch(this.matches, matchId)

    // On retire la volée ET la manche qu'elle a ouverte : sans ça, annuler
    // laisserait une cible orpheline et la session avancerait toute seule.
    const events = [...record.events]
    if (events.at(-1)?.type === 'RoundStarted') events.pop()
    if (events.at(-1)?.type !== 'VisitRecorded') throw new DomainError('No visit to undo')
    events.pop()

    await this.matches.save({ ...record, events, updatedAt: this.clock.now() })

    return CheckoutPracticeRules.project(events)
  }
}
