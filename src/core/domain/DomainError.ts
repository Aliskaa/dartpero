/**
 * Erreur de règle ou d'invariant du domaine.
 *
 * Signale une utilisation impossible (fléchette inexistante, volée de 4 fléchettes,
 * match déjà terminé…). Ce n'est PAS le canal des issues de jeu : un bust ou un
 * checkout sont des résultats normaux, portés par `VisitOutcome`.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
