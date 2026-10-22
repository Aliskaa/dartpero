/** Invariant ou règle violée. Pas le canal des issues de jeu : bust et checkout sont des `VisitOutcome`. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
