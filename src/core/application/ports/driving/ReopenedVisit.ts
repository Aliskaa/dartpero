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
 * ⚠️ Aucun événement nouveau : la volée rouverte reste hors du journal,
 * exactement comme une volée en cours. Depuis le lot `volee-partielle`, ses
 * fléchettes vivent dans le brouillon de volée (`ManageVisitDraft`), estampillé
 * avec l'état rouvert : elles survivent à un rechargement, et le journal reste
 * cohérent.
 */
export type ReopenedVisit<S> = {
  readonly state: S
  readonly darts: readonly Dart[]
}
