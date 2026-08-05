import { useQueryClient } from '@tanstack/react-query'
import { Download, TriangleAlert, Upload, Volume2, VolumeX, WifiOff } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import type { ImportReport } from '@/core/application/ports/driving/ManageBackup'
import { Button } from '@/ui/composants/commun/Button'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { MessageErreur } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { CLE_VOIX, usePreference } from '@/ui/hooks/useAppareil'
import { pluriel } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/**
 * Le nom du fichier porte la date : on finit toujours par en avoir plusieurs
 * dans son dossier de téléchargements.
 */
const nomFichier = (horodatage: number): string => {
  const date = new Date(horodatage)
  const deuxChiffres = (valeur: number) => String(valeur).padStart(2, '0')
  return [
    'dartpero',
    date.getFullYear(),
    deuxChiffres(date.getMonth() + 1),
    deuxChiffres(date.getDate()),
  ].join('-')
}

/**
 * Déclenche un téléchargement depuis un objet en mémoire.
 *
 * C'est du DOM pur, pas une capacité métier : le use case `ManageBackup` ne
 * connaît que des objets JavaScript, et reste donc testable sans navigateur.
 * Seule la coquille UI sait ce qu'est un fichier.
 */
const telecharger = (contenu: unknown, nom: string): void => {
  const blob = new Blob([JSON.stringify(contenu, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = `${nom}.json`
  lien.click()
  URL.revokeObjectURL(url)
}

const Resume = ({ rapport }: { readonly rapport: ImportReport }) => {
  const ignores = rapport.playersSkipped + rapport.matchesSkipped

  return (
    <div
      role="status"
      className="rounded-xl border border-vert-cible/60 bg-vert-cible/12 px-4 py-3 text-sm text-craie"
    >
      <p className="font-score text-xs uppercase tracking-widest text-vert-cible">
        Sauvegarde restaurée
      </p>
      <p className="mt-1">
        {pluriel(rapport.playersImported, 'joueur')} et{' '}
        {pluriel(rapport.matchesImported, 'partie', 'parties')} importés.
      </p>
      {ignores > 0 && (
        <p className="mt-1 flex items-start gap-1.5 text-craie/70">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {pluriel(ignores, 'entrée illisible', 'entrées illisibles')} — ignorée
          {ignores > 1 ? 's' : ''}.
        </p>
      )}
    </div>
  )
}

export const ReglagesEcran = () => {
  const services = useServices()
  const queryClient = useQueryClient()
  const champFichier = useRef<HTMLInputElement>(null)
  const idChamp = useId()
  const [voix, setVoix] = usePreference(CLE_VOIX, true)

  const [rapport, setRapport] = useState<ImportReport | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  const exporter = async () => {
    setErreur(null)
    setRapport(null)
    setOccupe(true)
    try {
      const sauvegarde = await services.manageBackup.exportAll()
      telecharger(sauvegarde, nomFichier(sauvegarde.exportedAt))
    } catch {
      setErreur('La sauvegarde n’a pas pu être créée.')
    } finally {
      setOccupe(false)
    }
  }

  const importer = async (fichier: File) => {
    setErreur(null)
    setRapport(null)
    setOccupe(true)
    try {
      const contenu: unknown = JSON.parse(await fichier.text())
      const resultat = await services.manageBackup.importFrom(contenu)
      // Tout le cache est invalidé : joueurs, historique et stats ont changé.
      await queryClient.invalidateQueries()
      setRapport(resultat)
    } catch (cause) {
      setErreur(
        cause instanceof SyntaxError
          ? 'Ce fichier n’est pas un JSON lisible.'
          : cause instanceof Error
            ? cause.message
            : 'Cette sauvegarde n’a pas pu être restaurée.',
      )
    } finally {
      setOccupe(false)
      // Sans ça, réimporter deux fois le même fichier ne déclencherait rien.
      if (champFichier.current) champFichier.current.value = ''
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      <EnTeteEcran titre="Réglages" sousTitre="Sauvegarde et informations" />

      <div className="flex flex-col gap-3 px-4">
        <Panneau titre="Sauvegarde" contenuClassName="flex flex-col gap-3 p-4">
          <p className="text-sm text-craie/75">
            Tout vit sur ce téléphone : pas de compte, pas de serveur. Le fichier JSON est donc la
            <strong className="text-craie"> seule façon</strong> de changer d’appareil sans repartir
            de zéro.
          </p>

          <Button onClick={() => void exporter()} disabled={occupe}>
            <Download aria-hidden="true" className="size-4" />
            Exporter la base
          </Button>

          <div>
            <Button
              variante="secondaire"
              className="w-full"
              disabled={occupe}
              onClick={() => champFichier.current?.click()}
            >
              <Upload aria-hidden="true" className="size-4" />
              Restaurer une sauvegarde
            </Button>
            <input
              id={idChamp}
              ref={champFichier}
              type="file"
              accept="application/json,.json"
              aria-label="Fichier de sauvegarde"
              className="sr-only"
              onChange={(evenement) => {
                const fichier = evenement.target.files?.[0]
                if (fichier) void importer(fichier)
              }}
            />
          </div>

          <p className="text-xs text-craie/60">
            La restauration <strong className="text-craie/80">complète</strong> la base : les
            parties déjà présentes sont conservées, celles du fichier sont ajoutées ou mises à jour.
            Rien n’est effacé.
          </p>

          {erreur && <MessageErreur>{erreur}</MessageErreur>}
          {rapport && <Resume rapport={rapport} />}
        </Panneau>

        <Panneau titre="Annonce vocale" contenuClassName="flex flex-col gap-3 p-4">
          <button
            type="button"
            aria-pressed={voix}
            onClick={() => {
              setVoix(!voix)
              if (voix) services.devices.announcer.cancel()
            }}
            className={[
              'flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 text-left',
              'transition-colors duration-150',
              voix ? 'border-laiton/50 bg-laiton/10' : 'border-chene/55 bg-feutre/60',
            ].join(' ')}
          >
            <span className="flex min-w-0 items-center gap-3">
              {voix ? (
                <Volume2 aria-hidden="true" className="size-5 shrink-0 text-laiton-clair" />
              ) : (
                <VolumeX aria-hidden="true" className="size-5 shrink-0 text-craie/50" />
              )}
              <span className="min-w-0">
                <span
                  className={`block font-score text-sm font-bold uppercase tracking-widest ${
                    voix ? 'text-laiton-clair' : 'text-craie/75'
                  }`}
                >
                  Annoncer les volées
                </span>
                <span className="block truncate text-xs text-craie/60">
                  Le score, les bust et les sorties, à voix haute
                </span>
              </span>
            </span>

            <span
              aria-hidden="true"
              className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 ${
                voix ? 'border-laiton/60 bg-laiton/25' : 'border-craie/20 bg-black/40'
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full transition-all duration-200 ${
                  voix ? 'laiton-plat left-[1.6rem]' : 'left-0.5 bg-craie/45'
                }`}
              />
            </span>
          </button>

          {/* Toutes les voix françaises ne sont pas installées partout : mieux
              vaut l'entendre ici que de découvrir le silence en pleine partie. */}
          <Button
            variante="secondaire"
            disabled={!voix}
            onClick={() => services.devices.announcer.say('Cent quatre-vingts')}
          >
            <Volume2 aria-hidden="true" className="size-4" />
            Essayer la voix
          </Button>
        </Panneau>

        <Panneau titre="À propos" contenuClassName="flex flex-col gap-2 p-4">
          <p className="flex items-center gap-2 text-sm text-craie/75">
            <WifiOff aria-hidden="true" className="size-4 shrink-0" />
            100 % local, hors ligne, sans compte.
          </p>
          <p className="text-xs text-craie/60">
            Dartpéro — compteur de fléchettes X01. Installez-le depuis le menu de votre navigateur
            (« Ajouter à l’écran d’accueil ») pour l’ouvrir comme une application.
          </p>
        </Panneau>
      </div>
    </main>
  )
}
