/**
 * L'annonce vocale — « cent quarante », « bust », « à toi Julien ».
 *
 * ⚠️ Le port reçoit du **texte déjà écrit en français**. Le cœur ne fabrique
 * jamais de libellé (décision du lot 2) : c'est l'UI qui compose la phrase,
 * depuis `labels.ts`, et l'adapter se contente de la prononcer.
 *
 * La synthèse vocale manque sur certains navigateurs, et la voix française
 * n'est pas installée partout : l'adapter doit alors se taire, jamais échouer.
 */
export interface Announcer {
  say(texte: string): void
  /** Coupe ce qui est en cours — une annonce périmée vaut moins que le silence. */
  cancel(): void
}

export const NullAnnouncer: Announcer = {
  say() {},
  cancel() {},
}
