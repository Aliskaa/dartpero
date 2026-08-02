import { DomainError } from '../DomainError'
import type { X01Config } from '../entities/Match'
import { Dart } from '../value-objects/Dart'
import { suggestCheckout } from './checkout'
import { findExactScore } from './dartSearch'

/**
 * Traduit un **score de volée** en fléchettes, pour le mode de saisie rapide.
 *
 * ⚠️ Les fléchettes produites sont **synthétiques** : le total et le nombre de
 * fléchettes lancées sont exacts (donc les scores, les legs et les moyennes le
 * sont aussi), mais le détail « quelle fléchette a touché quoi » est inventé.
 * C'est le marché du mode rapide : on échange la finesse des statistiques
 * contre la vitesse de saisie.
 *
 * Renvoie `null` si le total est hors d'atteinte — ce qui couvre gratuitement
 * les scores impossibles en 3 fléchettes (179, 178, 176, 175, 173, 172, 169,
 * 166, 163).
 */
export const composeVisit = (
  total: number,
  dartsUsed: number,
  finishOnDouble: boolean,
  config: X01Config,
): readonly Dart[] | null => {
  if (!Number.isInteger(dartsUsed) || dartsUsed < 1 || dartsUsed > 3) {
    throw new DomainError(`dartsUsed must be between 1 and 3, got ${dartsUsed}`)
  }
  if (!Number.isInteger(total) || total < 0) return null

  // Volée blanche : le joueur a bien lancé ses fléchettes, elles n'ont rien fait.
  if (total === 0) {
    return finishOnDouble ? null : Array.from({ length: dartsUsed }, () => Dart.miss())
  }

  const combinaison = finishOnDouble
    ? suggestCheckout(total, dartsUsed, config)
    : findExactScore(total, dartsUsed)

  if (!combinaison) return null

  // On complète par des fléchettes manquées EN TÊTE : le compte de fléchettes
  // reste juste, et la sortie reste bien la dernière fléchette de la volée.
  const manquees = Array.from({ length: dartsUsed - combinaison.length }, () => Dart.miss())
  return [...manquees, ...combinaison]
}
