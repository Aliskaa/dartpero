// ⚠️ Segments déjà écrits et étiquetés par langue (compose l'UI) ; l'adapter se replie sur la voix actuelle ou se tait, jamais d'échec.
export type Langue = 'fr-FR' | 'en-US'

export type SegmentAnnonce = {
  readonly texte: string
  readonly langue: Langue
}

export type Annonce = readonly SegmentAnnonce[]

export interface Announcer {
  /** Coupe l'annonce précédente. */
  say(annonce: Annonce): void
  cancel(): void
}

export const NullAnnouncer: Announcer = {
  say() {},
  cancel() {},
}
