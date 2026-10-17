/**
 * L'annonce vocale — « 140 », « bust », « à toi Julien ».
 *
 * ⚠️ Le port reçoit des **segments déjà écrits et étiquetés par langue**. Le
 * cœur ne fabrique jamais de libellé (décision du lot 2) : c'est l'UI qui
 * compose la phrase, depuis `labels.ts`, et qui dit dans quelle langue chaque
 * morceau se prononce (« bust » et « checkout » à l'anglaise, au milieu d'une
 * phrase française). L'adapter se contente de les enchaîner, dans l'ordre.
 *
 * La synthèse vocale manque sur certains navigateurs, et la voix de la langue
 * demandée n'est pas installée partout : l'adapter doit alors se replier sur la
 * voix actuelle, ou se taire, jamais échouer.
 */
export type Langue = 'fr-FR' | 'en-US'

export type SegmentAnnonce = {
  readonly texte: string
  readonly langue: Langue
}

/** Une annonce = des segments dits à la suite, sans se couper entre eux. */
export type Annonce = readonly SegmentAnnonce[]

export interface Announcer {
  /** Coupe l'annonce précédente, puis dit celle-ci segment par segment. */
  say(annonce: Annonce): void
  /** Coupe ce qui est en cours — une annonce périmée vaut moins que le silence. */
  cancel(): void
}

export const NullAnnouncer: Announcer = {
  say() {},
  cancel() {},
}
