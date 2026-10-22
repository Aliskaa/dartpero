// ⚠️ Ne pas nommer les API du navigateur ici : la garde `installationBoundary` lit aussi les commentaires.
export type InstallState =
  | 'installed'
  | 'installable'
  | 'ios-manual'
  | 'ios-other-browser'
  | 'unavailable'

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

export interface AppInstallation {
  /** Synchrone, ne lève jamais, même valeur tant que rien ne change (source externe de React). */
  state(): InstallState
  subscribe(onChange: () => void): () => void
  /** À n'appeler que sur un geste de l'utilisateur ; une invite ne sert qu'une fois. Ne rejette jamais. */
  prompt(): Promise<InstallOutcome>
}

export const NullAppInstallation: AppInstallation = {
  state: () => 'unavailable',
  subscribe: () => () => {},
  prompt: async () => 'unavailable',
}
