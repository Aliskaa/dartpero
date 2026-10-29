import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'

/** Le reste affiché de l'entraînement, qui suit chaque fléchette : une seule fonction pour la saisie et le miroir. */
export const resteEntrainement = (cible: number | null, darts: readonly Dart[]): number =>
  cible === null ? 0 : darts.reduce((reste, dart) => reste - DartVO.points(dart), cible)
