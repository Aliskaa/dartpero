import type { Dart } from '../../../domain/value-objects/Dart'

/**
 * Ce que rend une annulation (lot `annulation-volee`) : un appui retire **une
 * fléchette**, la dernière jouée, et la volée enregistrée se rouvre.
 *
 * - `state` : l'état rejoué **sans** la volée rouverte — elle a quitté le
 *   journal, comme toute volée en cours de saisie n'y est pas encore.
 * - `darts` : les fléchettes de cette volée qui restent posées (la dernière en
 *   moins), à rendre à la saisie locale. Vide quand la volée n'en comptait
 *   qu'une. Leur aperçu n'est **jamais** complet : privée de sa dernière
 *   fléchette, une volée ne conclut pas.
 *
 * ⚠️ Aucun format nouveau : la volée rouverte n'est pas persistée, exactement
 * comme une volée en cours. Si l'app se ferme, ces fléchettes sont perdues et
 * le journal reste cohérent.
 */
export type ReopenedVisit<S> = {
  readonly state: S
  readonly darts: readonly Dart[]
}
