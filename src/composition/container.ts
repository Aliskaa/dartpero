import type { Announcer } from '@/core/application/ports/driven/Announcer'
import type { AppInstallation } from '@/core/application/ports/driven/AppInstallation'
import type { Clock } from '@/core/application/ports/driven/Clock'
import type { Haptics } from '@/core/application/ports/driven/Haptics'
import type { IdGenerator } from '@/core/application/ports/driven/IdGenerator'
import type { MatchRepository } from '@/core/application/ports/driven/MatchRepository'
import type { PersistentStorage } from '@/core/application/ports/driven/PersistentStorage'
import type { PlayerRepository } from '@/core/application/ports/driven/PlayerRepository'
import type { Preferences } from '@/core/application/ports/driven/Preferences'
import type { RandomSource } from '@/core/application/ports/driven/RandomSource'
import type { ScreenLock } from '@/core/application/ports/driven/ScreenLock'
import type { DeleteMatch } from '@/core/application/ports/driving/DeleteMatch'
import type { GetCheckoutRange } from '@/core/application/ports/driving/GetCheckoutRange'
import type { GetCheckoutSuggestion } from '@/core/application/ports/driving/GetCheckoutSuggestion'
import type { GetDeviceContents } from '@/core/application/ports/driving/GetDeviceContents'
import type { GetMatchHistory } from '@/core/application/ports/driving/GetMatchHistory'
import type { GetMatchMode } from '@/core/application/ports/driving/GetMatchMode'
import type { GetMatchName } from '@/core/application/ports/driving/GetMatchName'
import type { GetMatchState } from '@/core/application/ports/driving/GetMatchState'
import type { GetMatchStats } from '@/core/application/ports/driving/GetMatchStats'
import type { GetOngoingMatch } from '@/core/application/ports/driving/GetOngoingMatch'
import type { GetPlayerStats } from '@/core/application/ports/driving/GetPlayerStats'
import type { GetReplayableConfigurations } from '@/core/application/ports/driving/GetReplayableConfigurations'
import type { ManageBackup } from '@/core/application/ports/driving/ManageBackup'
import type { ManagePlayers } from '@/core/application/ports/driving/ManagePlayers'
import type { PlayCheckoutPractice } from '@/core/application/ports/driving/PlayCheckoutPractice'
import type { PlayCricket } from '@/core/application/ports/driving/PlayCricket'
import type { PlayTourDuMonde } from '@/core/application/ports/driving/PlayTourDuMonde'
import type { PreviewCricketVisit } from '@/core/application/ports/driving/PreviewCricketVisit'
import type { PreviewTourDuMondeVisit } from '@/core/application/ports/driving/PreviewTourDuMondeVisit'
import type { PreviewVisit } from '@/core/application/ports/driving/PreviewVisit'
import type { RecordVisit } from '@/core/application/ports/driving/RecordVisit'
import type { RestartMatch } from '@/core/application/ports/driving/RestartMatch'
import type { ShuffleOrder } from '@/core/application/ports/driving/ShuffleOrder'
import type { StartMatch } from '@/core/application/ports/driving/StartMatch'
import type { UndoLastVisit } from '@/core/application/ports/driving/UndoLastVisit'
import { DeleteMatchUseCase } from '@/core/application/use-cases/DeleteMatchUseCase'
import { GetCheckoutRangeUseCase } from '@/core/application/use-cases/GetCheckoutRangeUseCase'
import { GetCheckoutSuggestionUseCase } from '@/core/application/use-cases/GetCheckoutSuggestionUseCase'
import { GetDeviceContentsUseCase } from '@/core/application/use-cases/GetDeviceContentsUseCase'
import { GetMatchHistoryUseCase } from '@/core/application/use-cases/GetMatchHistoryUseCase'
import { GetMatchModeUseCase } from '@/core/application/use-cases/GetMatchModeUseCase'
import { GetMatchNameUseCase } from '@/core/application/use-cases/GetMatchNameUseCase'
import { GetMatchStateUseCase } from '@/core/application/use-cases/GetMatchStateUseCase'
import { GetMatchStatsUseCase } from '@/core/application/use-cases/GetMatchStatsUseCase'
import { GetOngoingMatchUseCase } from '@/core/application/use-cases/GetOngoingMatchUseCase'
import { GetPlayerStatsUseCase } from '@/core/application/use-cases/GetPlayerStatsUseCase'
import { GetReplayableConfigurationsUseCase } from '@/core/application/use-cases/GetReplayableConfigurationsUseCase'
import { ManageBackupUseCase } from '@/core/application/use-cases/ManageBackupUseCase'
import { ManagePlayersUseCase } from '@/core/application/use-cases/ManagePlayersUseCase'
import { PlayCheckoutPracticeUseCase } from '@/core/application/use-cases/PlayCheckoutPracticeUseCase'
import { PlayCricketUseCase } from '@/core/application/use-cases/PlayCricketUseCase'
import { PlayTourDuMondeUseCase } from '@/core/application/use-cases/PlayTourDuMondeUseCase'
import { PreviewCricketVisitUseCase } from '@/core/application/use-cases/PreviewCricketVisitUseCase'
import { PreviewTourDuMondeVisitUseCase } from '@/core/application/use-cases/PreviewTourDuMondeVisitUseCase'
import { PreviewVisitUseCase } from '@/core/application/use-cases/PreviewVisitUseCase'
import { RecordVisitUseCase } from '@/core/application/use-cases/RecordVisitUseCase'
import { RestartMatchUseCase } from '@/core/application/use-cases/RestartMatchUseCase'
import { ShuffleOrderUseCase } from '@/core/application/use-cases/ShuffleOrderUseCase'
import { StartMatchUseCase } from '@/core/application/use-cases/StartMatchUseCase'
import { UndoLastVisitUseCase } from '@/core/application/use-cases/UndoLastVisitUseCase'
import { BrowserAppInstallation } from '@/infrastructure/device/BrowserAppInstallation'
import { createLocalStoragePreferences } from '@/infrastructure/device/LocalStoragePreferences'
import { NavigatorPersistentStorage } from '@/infrastructure/device/NavigatorPersistentStorage'
import { SpeechAnnouncer } from '@/infrastructure/device/SpeechAnnouncer'
import { VibrationHaptics } from '@/infrastructure/device/VibrationHaptics'
import { WakeLockScreenLock } from '@/infrastructure/device/WakeLockScreenLock'
import { DexieMatchRepository } from '@/infrastructure/dexie/DexieMatchRepository'
import { DexiePlayerRepository } from '@/infrastructure/dexie/DexiePlayerRepository'
import { createDatabase } from '@/infrastructure/dexie/database'
import { CryptoIdGenerator } from '@/infrastructure/system/CryptoIdGenerator'
import { CryptoRandomSource } from '@/infrastructure/system/CryptoRandomSource'
import { SystemClock } from '@/infrastructure/system/SystemClock'

/**
 * COMPOSITION ROOT — le seul endroit du projet où un port rencontre son adapter.
 *
 * Nulle part ailleurs on ne doit voir `new Dexie…` ni `Date.now()`. C'est ce qui
 * permet de rejouer toute l'application en mémoire dans les tests, et d'ajouter
 * un jour une synchro distante en changeant une seule ligne ici.
 */
/** Les capacités de l'appareil, derrière des ports. Muettes si le matériel manque. */
export type Devices = {
  readonly screenLock: ScreenLock
  readonly haptics: Haptics
  readonly preferences: Preferences
  readonly announcer: Announcer
  /** Protection de la base contre l'effacement par le navigateur. */
  readonly persistentStorage: PersistentStorage
  /**
   * L'installation sur l'écran d'accueil : état synchrone, abonnement, invite.
   * ⚠️ L'adapter navigateur écoute dès sa construction : les services naissent
   * donc une seule fois, dans `src/main.tsx`, avant `createRoot`.
   */
  readonly appInstallation: AppInstallation
}

export type Dependencies = {
  readonly matches: MatchRepository
  readonly players: PlayerRepository
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly random: RandomSource
  readonly devices: Devices
}

/**
 * Tout ce que l'UI a le droit d'appeler. Rien d'autre ne lui est exposé.
 *
 * `devices` est une exception assumée à la règle « UI → use cases uniquement » :
 * ce sont des ports **driven** (écran, vibreur, préférences locales, protection du stockage,
 * installation) consommés directement par la coquille UI. Ils ne portent aucune règle métier, donc les
 * emballer dans des use cases serait de la cérémonie pure. Ils restent des
 * ports : injectables, remplaçables, muets quand le matériel ne suit pas.
 */
export type Services = {
  readonly startMatch: StartMatch
  /** « On remet ça » : relance une partie terminée à l'identique. */
  readonly restartMatch: RestartMatch
  readonly recordVisit: RecordVisit
  readonly undoLastVisit: UndoLastVisit
  readonly getMatchState: GetMatchState
  readonly getCheckoutSuggestion: GetCheckoutSuggestion
  /** 170 ou 180 selon la sortie, et les restes sans finish : « Pas de finish », feuille de règles. */
  readonly getCheckoutRange: GetCheckoutRange
  readonly getMatchStats: GetMatchStats
  readonly getMatchHistory: GetMatchHistory
  /** Les configurations récentes distinctes, pour « Rejouer » (étape 1 de Nouvelle partie). */
  readonly getReplayableConfigurations: GetReplayableConfigurations
  readonly getMatchMode: GetMatchMode
  /** Le nom tapé d'une partie et sa date de création, pour son bandeau et son résumé. */
  readonly getMatchName: GetMatchName
  readonly getOngoingMatch: GetOngoingMatch
  readonly getPlayerStats: GetPlayerStats
  /** Le compte des parties et des profils de ce téléphone, pour les Réglages. */
  readonly getDeviceContents: GetDeviceContents
  readonly deleteMatch: DeleteMatch
  readonly managePlayers: ManagePlayers
  readonly manageBackup: ManageBackup
  /** Le second mode de jeu. Voir la couture `GameModes` côté domaine. */
  readonly playTourDuMonde: PlayTourDuMonde
  /** Le Cricket, standard ou cut-throat selon la configuration de la partie. */
  readonly playCricket: PlayCricket
  /** L'entraînement solo au checkout (lot 5b). */
  readonly playCheckoutPractice: PlayCheckoutPractice
  /** « Tirer au sort » (étape Ordre) : mélange visible, avant le lancement. */
  readonly shuffleOrder: ShuffleOrder
  readonly previewVisit: PreviewVisit
  readonly previewTourDuMondeVisit: PreviewTourDuMondeVisit
  readonly previewCricketVisit: PreviewCricketVisit
  readonly devices: Devices
  /**
   * L'horloge des use cases, la **même instance**. Seconde exception de même
   * nature que `devices` : l'étape 1 de Nouvelle partie propose un nom d'après
   * l'heure (« Dimanche soir ») avant que la partie n'existe. Lire `Date.now()`
   * dans l'UI rendrait ce calcul intestable ; passer par ce port garde la
   * proposition et le `createdAt` de la partie sur la même horloge.
   */
  readonly clock: Clock
}

export const createServices = ({
  matches,
  players,
  clock,
  ids,
  random,
  devices,
}: Dependencies): Services => {
  // Les quatre lancements sont gardés sous la main : « on remet ça » les
  // rappelle tels quels plutôt que de recopier un journal, pour qu'une relance
  // passe par exactement les mêmes contrôles qu'un premier départ.
  // ⚠️ Corollaire : une relance NE rebat PAS l'ordre de passage. Le journal ne
  // dit pas s'il avait été tiré au sort ou choisi à la main — le redistribuer
  // serait deviner, et l'ordre qui vient de jouer est un ordre accepté.
  const startMatch = new StartMatchUseCase(matches, players, clock, ids, random)
  const playTourDuMonde = new PlayTourDuMondeUseCase(matches, players, clock, ids, random)
  const playCricket = new PlayCricketUseCase(matches, players, clock, ids, random)
  const playCheckoutPractice = new PlayCheckoutPracticeUseCase(matches, players, clock, ids, random)

  return {
    startMatch,
    restartMatch: new RestartMatchUseCase(
      matches,
      startMatch,
      playTourDuMonde,
      playCricket,
      playCheckoutPractice,
    ),
    recordVisit: new RecordVisitUseCase(matches, clock),
    undoLastVisit: new UndoLastVisitUseCase(matches, clock),
    getMatchState: new GetMatchStateUseCase(matches),
    getCheckoutSuggestion: new GetCheckoutSuggestionUseCase(),
    getCheckoutRange: new GetCheckoutRangeUseCase(),
    getMatchStats: new GetMatchStatsUseCase(matches),
    getMatchHistory: new GetMatchHistoryUseCase(matches, players),
    getReplayableConfigurations: new GetReplayableConfigurationsUseCase(matches, players),
    getMatchMode: new GetMatchModeUseCase(matches),
    getMatchName: new GetMatchNameUseCase(matches),
    getOngoingMatch: new GetOngoingMatchUseCase(matches, players),
    getPlayerStats: new GetPlayerStatsUseCase(matches, players, clock),
    getDeviceContents: new GetDeviceContentsUseCase(matches, players),
    deleteMatch: new DeleteMatchUseCase(matches),
    managePlayers: new ManagePlayersUseCase(players, ids, clock),
    manageBackup: new ManageBackupUseCase(matches, players, clock),
    playTourDuMonde,
    playCricket,
    playCheckoutPractice,
    shuffleOrder: new ShuffleOrderUseCase(random),
    previewVisit: new PreviewVisitUseCase(),
    previewTourDuMondeVisit: new PreviewTourDuMondeVisitUseCase(),
    previewCricketVisit: new PreviewCricketVisitUseCase(),
    devices,
    clock,
  }
}

/** Câblage réel : IndexedDB, horloge système, identifiants cryptographiques. */
export const createBrowserDependencies = (): Dependencies => {
  const db = createDatabase()
  return {
    matches: new DexieMatchRepository(db),
    players: new DexiePlayerRepository(db),
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
    random: new CryptoRandomSource(),
    devices: {
      screenLock: new WakeLockScreenLock(),
      haptics: new VibrationHaptics(),
      preferences: createLocalStoragePreferences(),
      announcer: new SpeechAnnouncer(),
      persistentStorage: new NavigatorPersistentStorage(),
      appInstallation: new BrowserAppInstallation(),
    },
  }
}

/**
 * Appelé **une seule fois**, par `src/main.tsx`, avant le premier rendu : un
 * jeu de services par page, et des écouteurs d'appareil posés au plus tôt.
 */
export const createBrowserServices = (): Services => createServices(createBrowserDependencies())
