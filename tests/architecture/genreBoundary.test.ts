import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// ⚠️ Le genre ne sert qu'à accorder « éliminé / éliminée » au Killer : tout autre lecteur doit être ajouté ici en connaissance de cause.
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SRC = resolve(RACINE, 'src')

const fichiers = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name)
    if (entree.isDirectory()) return fichiers(chemin)
    return /\.tsx?$/.test(entree.name) ? [chemin] : []
  })

const enSrc = (chemin: string) => relative(SRC, chemin).replaceAll('\\', '/')

/** Le mot cherché, casse ignorée (`gender`, `PlayerGender`…), commentaires compris. */
const GENRE = /gender/i

const AUTORISES = new Set([
  'core/domain/value-objects/PlayerGender.ts',
  'core/domain/entities/Player.ts',
  'core/application/ports/driving/ManagePlayers.ts',
  'core/application/use-cases/ManagePlayersUseCase.ts',
  'core/application/ports/driving/ManageBackup.ts',
  'core/application/use-cases/ManageBackupUseCase.ts',
  'core/application/use-cases/backupSchema.ts',
  'infrastructure/dexie/database.ts',
  'infrastructure/dexie/DexiePlayerRepository.ts',
  'ui/labels.ts',
  'ui/hooks/useKiller.ts',
  'ui/composants/killer/FeuilleKiller.tsx',
  'ui/ecrans/games/killer/KillerEcran.tsx',
  'ui/ecrans/games/killer/ResumeKillerEcran.tsx',
  'ui/composants/commun/ChoixGenre.tsx',
  'ui/ecrans/nouvelle-partie/DialogueNouveauJoueur.tsx',
  'ui/ecrans/JoueursEcran.tsx',
  'ui/hooks/useNouvellePartie.ts',
])

/** Ceux qui ne doivent **jamais** le lire, vérifiés nommément. */
const INTERDITS = [
  /^core\/domain\/games\//,
  /GetPlayerStatsUseCase\.ts$/,
  /rankPlayers\.ts$/,
  /summarize\.ts$/,
  /cartesPartie\.ts$/,
  /StatistiquesEcran\.tsx$/,
]

describe('Frontière du genre', () => {
  const tous = fichiers(SRC)
  const lecteurs = tous.filter((fichier) => GENRE.test(readFileSync(fichier, 'utf8')))

  it('seule une liste fermée de fichiers cite le genre', () => {
    expect(tous.length).toBeGreaterThan(40)
    expect(lecteurs.length).toBeGreaterThanOrEqual(18)

    const fautes = lecteurs.map(enSrc).filter((chemin) => !AUTORISES.has(chemin))
    expect(fautes).toEqual([])
  })

  it('ni les règles de jeu, ni les statistiques, ni le classement, ni les cartes ne le lisent', () => {
    for (const motif of INTERDITS) {
      expect(
        tous.some((fichier) => motif.test(enSrc(fichier))),
        String(motif),
      ).toBe(true)
    }

    const fautes = lecteurs
      .map(enSrc)
      .filter((chemin) => INTERDITS.some((motif) => motif.test(chemin)))
    expect(fautes).toEqual([])
  })
})
