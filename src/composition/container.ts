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
import type { VisitDraftRepository } from '@/core/application/ports/driven/VisitDraftRepository'
import type { DeleteMatch } from '@/core/application/ports/driving/DeleteMatch'
import type { DrawKillerNumbers } from '@/core/application/ports/driving/DrawKillerNumbers'
import type { GetCheckoutRange } from '@/core/application/ports/driving/GetCheckoutRange'
import type { GetCheckoutSuggestion } from '@/core/application/ports/driving/GetCheckoutSuggestion'
import type { GetDeviceContents } from '@/core/application/ports/driving/GetDeviceContents'
import type { GetMatchHistory } from '@/core/application/ports/driving/GetMatchHistory'
import type { GetMatchMode } from '@/core/application/ports/driving/GetMatchMode'
import type { GetMatchName } from '@/core/application/ports/driving/GetMatchName'
import type { GetMatchState } from '@/core/application/ports/driving/GetMatchState'
import type { GetMatchStats } from '@/core/application/ports/driving/GetMatchStats'
import type { GetOngoingMatch } from '@/core/application/ports/driving/GetOngoingMatch'
import type { GetPlayerProgress } from '@/core/application/ports/driving/GetPlayerProgress'
import type { GetPlayerStats } from '@/core/application/ports/driving/GetPlayerStats'
import type { GetReplayableConfigurations } from '@/core/application/ports/driving/GetReplayableConfigurations'
import type { ManageBackup } from '@/core/application/ports/driving/ManageBackup'
import type { ManagePlayers } from '@/core/application/ports/driving/ManagePlayers'
import type { ManageVisitDraft } from '@/core/application/ports/driving/ManageVisitDraft'
import type { PlayCheckoutPractice } from '@/core/application/ports/driving/PlayCheckoutPractice'
import type { PlayCricket } from '@/core/application/ports/driving/PlayCricket'
import type { PlayKiller } from '@/core/application/ports/driving/PlayKiller'
import type { PlayTourDuMonde } from '@/core/application/ports/driving/PlayTourDuMonde'
import type { PreviewCricketVisit } from '@/core/application/ports/driving/PreviewCricketVisit'
import type { PreviewKillerVisit } from '@/core/application/ports/driving/PreviewKillerVisit'
import type { PreviewTourDuMondeVisit } from '@/core/application/ports/driving/PreviewTourDuMondeVisit'
import type { PreviewVisit } from '@/core/application/ports/driving/PreviewVisit'
import type { RecordVisit } from '@/core/application/ports/driving/RecordVisit'
import type { RestartMatch } from '@/core/application/ports/driving/RestartMatch'
import type { ShuffleOrder } from '@/core/application/ports/driving/ShuffleOrder'
import type { StartMatch } from '@/core/application/ports/driving/StartMatch'
import type { UndoLastVisit } from '@/core/application/ports/driving/UndoLastVisit'
import { DeleteMatchUseCase } from '@/core/application/use-cases/DeleteMatchUseCase'
import { DrawKillerNumbersUseCase } from '@/core/application/use-cases/DrawKillerNumbersUseCase'
import { GetCheckoutRangeUseCase } from '@/core/application/use-cases/GetCheckoutRangeUseCase'
import { GetCheckoutSuggestionUseCase } from '@/core/application/use-cases/GetCheckoutSuggestionUseCase'
import { GetDeviceContentsUseCase } from '@/core/application/use-cases/GetDeviceContentsUseCase'
import { GetMatchHistoryUseCase } from '@/core/application/use-cases/GetMatchHistoryUseCase'
import { GetMatchModeUseCase } from '@/core/application/use-cases/GetMatchModeUseCase'
import { GetMatchNameUseCase } from '@/core/application/use-cases/GetMatchNameUseCase'
import { GetMatchStateUseCase } from '@/core/application/use-cases/GetMatchStateUseCase'
import { GetMatchStatsUseCase } from '@/core/application/use-cases/GetMatchStatsUseCase'
import { GetOngoingMatchUseCase } from '@/core/application/use-cases/GetOngoingMatchUseCase'
import { GetPlayerProgressUseCase } from '@/core/application/use-cases/GetPlayerProgressUseCase'
import { GetPlayerStatsUseCase } from '@/core/application/use-cases/GetPlayerStatsUseCase'
import { GetReplayableConfigurationsUseCase } from '@/core/application/use-cases/GetReplayableConfigurationsUseCase'
import { ManageBackupUseCase } from '@/core/application/use-cases/ManageBackupUseCase'
import { ManagePlayersUseCase } from '@/core/application/use-cases/ManagePlayersUseCase'
import { ManageVisitDraftUseCase } from '@/core/application/use-cases/ManageVisitDraftUseCase'
import { PlayCheckoutPracticeUseCase } from '@/core/application/use-cases/PlayCheckoutPracticeUseCase'
import { PlayCricketUseCase } from '@/core/application/use-cases/PlayCricketUseCase'
import { PlayKillerUseCase } from '@/core/application/use-cases/PlayKillerUseCase'
import { PlayTourDuMondeUseCase } from '@/core/application/use-cases/PlayTourDuMondeUseCase'
import { PreviewCricketVisitUseCase } from '@/core/application/use-cases/PreviewCricketVisitUseCase'
import { PreviewKillerVisitUseCase } from '@/core/application/use-cases/PreviewKillerVisitUseCase'
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
import { DexieVisitDraftRepository } from '@/infrastructure/dexie/DexieVisitDraftRepository'
import { createDatabase } from '@/infrastructure/dexie/database'
import { CryptoIdGenerator } from '@/infrastructure/system/CryptoIdGenerator'
import { CryptoRandomSource } from '@/infrastructure/system/CryptoRandomSource'
import { SystemClock } from '@/infrastructure/system/SystemClock'

// Composition root : le seul endroit où un port rencontre son adapter.
/** Les capacités de l'appareil, derrière des ports. Muettes si le matériel manque. */
export type Devices = {
  readonly screenLock: ScreenLock
  readonly haptics: Haptics
  readonly preferences: Preferences
  readonly announcer: Announcer
  readonly persistentStorage: PersistentStorage
  /** ⚠️ L'adapter écoute dès sa construction : services créés une fois, dans `main.tsx`, avant `createRoot`. */
  readonly appInstallation: AppInstallation
}

export type Dependencies = {
  readonly matches: MatchRepository
  readonly players: PlayerRepository
  readonly visitDrafts: VisitDraftRepository
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly random: RandomSource
  readonly devices: Devices
}

/** Tout ce que l'UI peut appeler. `devices` (ports driven sans règle métier) est une exception assumée. */
export type Services = {
  readonly startMatch: StartMatch
  readonly restartMatch: RestartMatch
  readonly recordVisit: RecordVisit
  readonly undoLastVisit: UndoLastVisit
  readonly getMatchState: GetMatchState
  readonly getCheckoutSuggestion: GetCheckoutSuggestion
  readonly getCheckoutRange: GetCheckoutRange
  readonly getMatchStats: GetMatchStats
  readonly getMatchHistory: GetMatchHistory
  readonly getReplayableConfigurations: GetReplayableConfigurations
  readonly getMatchMode: GetMatchMode
  readonly getMatchName: GetMatchName
  readonly getOngoingMatch: GetOngoingMatch
  readonly getPlayerStats: GetPlayerStats
  readonly getPlayerProgress: GetPlayerProgress
  readonly getDeviceContents: GetDeviceContents
  readonly deleteMatch: DeleteMatch
  readonly managePlayers: ManagePlayers
  readonly manageBackup: ManageBackup
  readonly manageVisitDraft: ManageVisitDraft
  readonly playTourDuMonde: PlayTourDuMonde
  readonly playCricket: PlayCricket
  readonly playCheckoutPractice: PlayCheckoutPractice
  readonly playKiller: PlayKiller
  readonly shuffleOrder: ShuffleOrder
  readonly drawKillerNumbers: DrawKillerNumbers
  readonly previewVisit: PreviewVisit
  readonly previewTourDuMondeVisit: PreviewTourDuMondeVisit
  readonly previewCricketVisit: PreviewCricketVisit
  readonly previewKillerVisit: PreviewKillerVisit
  readonly devices: Devices
  /** Même instance que celle des use cases : l'UI propose un nom d'après l'heure sans `Date.now()`. */
  readonly clock: Clock
}

export const createServices = ({
  matches,
  players,
  visitDrafts,
  clock,
  ids,
  random,
  devices,
}: Dependencies): Services => {
  // « On remet ça » rappelle ces lancements tels quels. ⚠️ Une relance ne rebat pas l'ordre de passage.
  const startMatch = new StartMatchUseCase(matches, players, clock, ids, random)
  const playTourDuMonde = new PlayTourDuMondeUseCase(matches, players, clock, ids, random)
  const playCricket = new PlayCricketUseCase(matches, players, clock, ids, random)
  const playCheckoutPractice = new PlayCheckoutPracticeUseCase(matches, players, clock, ids, random)
  const playKiller = new PlayKillerUseCase(matches, players, clock, ids, random)

  return {
    startMatch,
    restartMatch: new RestartMatchUseCase(
      matches,
      startMatch,
      playTourDuMonde,
      playCricket,
      playCheckoutPractice,
      playKiller,
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
    getPlayerProgress: new GetPlayerProgressUseCase(matches, clock),
    getDeviceContents: new GetDeviceContentsUseCase(matches, players),
    deleteMatch: new DeleteMatchUseCase(matches, visitDrafts),
    managePlayers: new ManagePlayersUseCase(players, ids, clock),
    manageBackup: new ManageBackupUseCase(matches, players, visitDrafts, clock),
    manageVisitDraft: new ManageVisitDraftUseCase(matches, visitDrafts),
    playTourDuMonde,
    playCricket,
    playCheckoutPractice,
    playKiller,
    shuffleOrder: new ShuffleOrderUseCase(random),
    drawKillerNumbers: new DrawKillerNumbersUseCase(random),
    previewVisit: new PreviewVisitUseCase(),
    previewTourDuMondeVisit: new PreviewTourDuMondeVisitUseCase(),
    previewCricketVisit: new PreviewCricketVisitUseCase(),
    previewKillerVisit: new PreviewKillerVisitUseCase(),
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
    visitDrafts: new DexieVisitDraftRepository(db),
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

/** Appelé une seule fois, par `src/main.tsx`, avant le premier rendu. */
export const createBrowserServices = (): Services => createServices(createBrowserDependencies())
