import type { Announcer } from '@/core/application/ports/driven/Announcer'
import type { Clock } from '@/core/application/ports/driven/Clock'
import type { Haptics } from '@/core/application/ports/driven/Haptics'
import type { IdGenerator } from '@/core/application/ports/driven/IdGenerator'
import type { MatchRepository } from '@/core/application/ports/driven/MatchRepository'
import type { PlayerRepository } from '@/core/application/ports/driven/PlayerRepository'
import type { Preferences } from '@/core/application/ports/driven/Preferences'
import type { RandomSource } from '@/core/application/ports/driven/RandomSource'
import type { ScreenLock } from '@/core/application/ports/driven/ScreenLock'
import type { DeleteMatch } from '@/core/application/ports/driving/DeleteMatch'
import type { GetCheckoutSuggestion } from '@/core/application/ports/driving/GetCheckoutSuggestion'
import type { GetMatchHistory } from '@/core/application/ports/driving/GetMatchHistory'
import type { GetMatchMode } from '@/core/application/ports/driving/GetMatchMode'
import type { GetMatchState } from '@/core/application/ports/driving/GetMatchState'
import type { GetMatchStats } from '@/core/application/ports/driving/GetMatchStats'
import type { GetOngoingMatch } from '@/core/application/ports/driving/GetOngoingMatch'
import type { GetPlayerStats } from '@/core/application/ports/driving/GetPlayerStats'
import type { ManageBackup } from '@/core/application/ports/driving/ManageBackup'
import type { ManagePlayers } from '@/core/application/ports/driving/ManagePlayers'
import type { PlayCheckoutPractice } from '@/core/application/ports/driving/PlayCheckoutPractice'
import type { PlayCricket } from '@/core/application/ports/driving/PlayCricket'
import type { PlayTourDuMonde } from '@/core/application/ports/driving/PlayTourDuMonde'
import type { PreviewCricketVisit } from '@/core/application/ports/driving/PreviewCricketVisit'
import type { PreviewVisit } from '@/core/application/ports/driving/PreviewVisit'
import type { RecordVisit } from '@/core/application/ports/driving/RecordVisit'
import type { RestartMatch } from '@/core/application/ports/driving/RestartMatch'
import type { StartMatch } from '@/core/application/ports/driving/StartMatch'
import type { UndoLastVisit } from '@/core/application/ports/driving/UndoLastVisit'
import { DeleteMatchUseCase } from '@/core/application/use-cases/DeleteMatchUseCase'
import { GetCheckoutSuggestionUseCase } from '@/core/application/use-cases/GetCheckoutSuggestionUseCase'
import { GetMatchHistoryUseCase } from '@/core/application/use-cases/GetMatchHistoryUseCase'
import { GetMatchModeUseCase } from '@/core/application/use-cases/GetMatchModeUseCase'
import { GetMatchStateUseCase } from '@/core/application/use-cases/GetMatchStateUseCase'
import { GetMatchStatsUseCase } from '@/core/application/use-cases/GetMatchStatsUseCase'
import { GetOngoingMatchUseCase } from '@/core/application/use-cases/GetOngoingMatchUseCase'
import { GetPlayerStatsUseCase } from '@/core/application/use-cases/GetPlayerStatsUseCase'
import { ManageBackupUseCase } from '@/core/application/use-cases/ManageBackupUseCase'
import { ManagePlayersUseCase } from '@/core/application/use-cases/ManagePlayersUseCase'
import { PlayCheckoutPracticeUseCase } from '@/core/application/use-cases/PlayCheckoutPracticeUseCase'
import { PlayCricketUseCase } from '@/core/application/use-cases/PlayCricketUseCase'
import { PlayTourDuMondeUseCase } from '@/core/application/use-cases/PlayTourDuMondeUseCase'
import { PreviewCricketVisitUseCase } from '@/core/application/use-cases/PreviewCricketVisitUseCase'
import { PreviewVisitUseCase } from '@/core/application/use-cases/PreviewVisitUseCase'
import { RecordVisitUseCase } from '@/core/application/use-cases/RecordVisitUseCase'
import { RestartMatchUseCase } from '@/core/application/use-cases/RestartMatchUseCase'
import { StartMatchUseCase } from '@/core/application/use-cases/StartMatchUseCase'
import { UndoLastVisitUseCase } from '@/core/application/use-cases/UndoLastVisitUseCase'
import { createLocalStoragePreferences } from '@/infrastructure/device/LocalStoragePreferences'
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
 * ce sont des ports **driven** (écran, vibreur, préférences locales) consommés
 * directement par la coquille UI. Ils ne portent aucune règle métier, donc les
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
  readonly getMatchStats: GetMatchStats
  readonly getMatchHistory: GetMatchHistory
  readonly getMatchMode: GetMatchMode
  readonly getOngoingMatch: GetOngoingMatch
  readonly getPlayerStats: GetPlayerStats
  readonly deleteMatch: DeleteMatch
  readonly managePlayers: ManagePlayers
  readonly manageBackup: ManageBackup
  /** Le second mode de jeu. Voir la couture `GameModes` côté domaine. */
  readonly playTourDuMonde: PlayTourDuMonde
  /** Le Cricket, standard ou cut-throat selon la configuration de la partie. */
  readonly playCricket: PlayCricket
  /** L'entraînement solo au checkout (lot 5b). */
  readonly playCheckoutPractice: PlayCheckoutPractice
  readonly previewVisit: PreviewVisit
  readonly previewCricketVisit: PreviewCricketVisit
  readonly devices: Devices
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
    getMatchStats: new GetMatchStatsUseCase(matches),
    getMatchHistory: new GetMatchHistoryUseCase(matches, players),
    getMatchMode: new GetMatchModeUseCase(matches),
    getOngoingMatch: new GetOngoingMatchUseCase(matches, players),
    getPlayerStats: new GetPlayerStatsUseCase(matches, players, clock),
    deleteMatch: new DeleteMatchUseCase(matches),
    managePlayers: new ManagePlayersUseCase(players, ids, clock),
    manageBackup: new ManageBackupUseCase(matches, players, clock),
    playTourDuMonde,
    playCricket,
    playCheckoutPractice,
    previewVisit: new PreviewVisitUseCase(),
    previewCricketVisit: new PreviewCricketVisitUseCase(),
    devices,
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
    },
  }
}

export const createBrowserServices = (): Services => createServices(createBrowserDependencies())
