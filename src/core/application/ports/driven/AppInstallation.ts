/**
 * L'installation de Dartpéro sur l'écran d'accueil.
 *
 * Un état qui change en cours de session : l'invite du navigateur peut
 * arriver tôt ou tard, l'installation peut aboutir pendant que la page est
 * ouverte. D'où un port **synchrone** avec abonnement, lu par l'UI comme une
 * source externe, plutôt qu'une promesse lue une fois.
 *
 * ⚠️ Ces commentaires décrivent les API sans les nommer : la garde
 * `installationBoundary` lit aussi les commentaires, et seul l'adapter a le
 * droit de les citer.
 */
export type InstallState =
  /** « installée » : l'app tourne en fenêtre autonome, ou vient d'être installée. */
  | 'installed'
  /** « installable » : une invite native est tenue, prête à s'ouvrir sur un geste. */
  | 'installable'
  /** « manuelle-ios » : Safari sur iPhone ou iPad, l'ajout se fait à la main. */
  | 'ios-manual'
  /** « ios-autre-navigateur » : un autre navigateur sur iOS, il faut passer par Safari. */
  | 'ios-other-browser'
  /** « indisponible » : API absente, invite déjà consommée, ou erreur. */
  | 'unavailable'

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

export interface AppInstallation {
  /**
   * L'état actuel. Synchrone, ne lève jamais, et renvoie la même valeur tant
   * que rien n'a changé (contrat d'une source externe lue par React).
   */
  state(): InstallState
  /** Appelé après chaque changement d'état ; rend le désabonnement. */
  subscribe(onChange: () => void): () => void
  /**
   * Ouvre l'invite native. À n'appeler que depuis un geste de l'utilisateur.
   * Une invite ne sert qu'une fois. Ne rejette jamais.
   */
  prompt(): Promise<InstallOutcome>
}

/** API absente : on se comporte en null-object, jamais en erreur. */
export const NullAppInstallation: AppInstallation = {
  state: () => 'unavailable',
  subscribe: () => () => {},
  prompt: async () => 'unavailable',
}
