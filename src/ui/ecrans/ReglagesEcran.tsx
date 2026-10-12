import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  CircleCheck,
  Download,
  Share,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  SquarePlus,
  TriangleAlert,
  Upload,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import type { ImportReport } from '@/core/application/ports/driving/ManageBackup'
import { Button, classesBouton } from '@/ui/composants/commun/Button'
import { ChoixSegmente } from '@/ui/composants/commun/ChoixSegmente'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { MessageErreur } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { CLE_VOIX, usePreference } from '@/ui/hooks/useAppareil'
import { installationPossible, useInstallation } from '@/ui/hooks/useInstallation'
import { useProtectionStockage } from '@/ui/hooks/useStockagePersistant'
import {
  ETAPES_INSTALLATION_IOS,
  ETAT_INSTALLATION,
  ETIQUETTE_INSTALLATION,
  ETIQUETTE_PROTECTION_STOCKAGE,
  LIBELLE_INSTALLER_DARTPERO,
  LIBELLE_PROTECTION_STOCKAGE,
  LIBELLE_REDEMANDER_PROTECTION,
  LIBELLE_THEME,
  LIEN_CONFIDENTIALITE,
  LIEN_GERER_JOUEURS,
  LIEN_GUIDE_INSTALLATION,
  PRESENTATION_DARTPERO,
  pluriel,
  RAPPEL_EXPORT_STOCKAGE,
  REFUS_REDEMANDE_STOCKAGE,
  SOUS_TITRE_REGLAGES,
  TEXTE_PANNEAU_JOUEURS,
  TITRE_PANNEAU_JOUEURS,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import { appliquerTheme, CLE_THEME, THEME_DEFAUT, THEMES, type Theme } from '@/ui/theme'

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
      className="border border-vert-cible/60 bg-vert-cible/12 px-4 py-3 text-sm text-craie"
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

const ICONE_PROTECTION = {
  persisted: ShieldCheck,
  'not-persisted': ShieldAlert,
  unavailable: ShieldOff,
} as const

/**
 * L'état de la protection du stockage. Rien n'est rendu tant que `status()`
 * n'a pas répondu : la réponse est locale et quasi instantanée, un texte
 * provisoire ne ferait que clignoter.
 */
const EtatProtection = () => {
  const { etat, redemander, refusee } = useProtectionStockage()
  const { etat: installation, installer } = useInstallation()
  if (etat === null) return null

  // Le refus prolongé vers l'installation, quand elle est possible. Hors de
  // l'`<output>` : aucun contrôle dans une région live.
  const versInstallation = refusee && etat === 'not-persisted' && installationPossible(installation)

  const Icone = ICONE_PROTECTION[etat]

  return (
    <div className="flex flex-col gap-3">
      <output
        aria-label={ETIQUETTE_PROTECTION_STOCKAGE}
        className={`flex items-start gap-2 border px-3 py-2 text-sm ${
          etat === 'persisted'
            ? 'border-vert-cible/60 bg-vert-cible/12 text-craie'
            : 'border-craie/25 text-craie/75'
        }`}
      >
        <Icone
          aria-hidden="true"
          className={`mt-0.5 size-4 shrink-0 ${etat === 'persisted' ? 'text-vert-cible' : ''}`}
        />
        <span>
          {LIBELLE_PROTECTION_STOCKAGE[etat]}{' '}
          <span className="block text-craie/75">{RAPPEL_EXPORT_STOCKAGE[etat]}</span>
          {refusee && etat === 'not-persisted' && (
            <span className="mt-1 block text-craie">{REFUS_REDEMANDE_STOCKAGE}</span>
          )}
        </span>
      </output>
      {versInstallation &&
        (installation === 'installable' ? (
          <Button variante="secondaire" onClick={installer}>
            <Download aria-hidden="true" className="size-4" />
            {LIBELLE_INSTALLER_DARTPERO}
          </Button>
        ) : (
          <Link to={{ hash: '#installer' }} className={classesBouton('secondaire')}>
            {LIEN_GUIDE_INSTALLATION}
          </Link>
        ))}
      {etat === 'not-persisted' && (
        <Button variante="secondaire" onClick={() => void redemander()}>
          {LIBELLE_REDEMANDER_PROTECTION}
        </Button>
      )}
    </div>
  )
}

/** Les icônes des gestes iOS, dans l'ordre des étapes ; la dernière n'en a pas. */
const ICONES_ETAPES_IOS = [Share, SquarePlus, null] as const

/**
 * Réglages → À propos : l'installation selon l'état, rendue dès le premier
 * rendu (l'état est synchrone). « Plus tard » n'est jamais consulté ici.
 *
 * Ancre `#installer` : l'Accueil (iOS) et le refus de « Redemander » y mènent.
 * Le défilement est relancé à chaque navigation (`key`), même vers la même ancre.
 */
const EntreeInstallation = () => {
  const { etat, installer } = useInstallation()
  const { hash, key } = useLocation()
  const ancre = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` change à chaque navigation vers l'ancre, même répétée.
  useEffect(() => {
    // Appel optionnel : jsdom n'implémente pas `scrollIntoView`.
    if (hash === '#installer') ancre.current?.scrollIntoView?.({ block: 'start' })
  }, [hash, key])

  const installee = etat === 'installed'
  const Icone = installee ? CircleCheck : Smartphone

  return (
    <div
      id="installer"
      ref={ancre}
      className="flex scroll-mt-[max(1rem,env(safe-area-inset-top))] flex-col gap-3"
    >
      <output
        aria-label={ETIQUETTE_INSTALLATION}
        className={`flex items-start gap-2 border px-3 py-2 text-sm ${
          installee
            ? 'border-vert-cible/60 bg-vert-cible/12 text-craie'
            : 'border-craie/25 text-craie/75'
        }`}
      >
        <Icone
          aria-hidden="true"
          className={`mt-0.5 size-4 shrink-0 ${installee ? 'text-vert-cible' : ''}`}
        />
        <span>{ETAT_INSTALLATION[etat]}</span>
      </output>

      {etat === 'installable' && (
        <Button variante="secondaire" onClick={installer}>
          <Download aria-hidden="true" className="size-4" />
          {LIBELLE_INSTALLER_DARTPERO}
        </Button>
      )}

      {etat === 'ios-manual' && (
        <ol className="flex flex-col">
          {ETAPES_INSTALLATION_IOS.map((etape, rang) => {
            const IconeEtape = ICONES_ETAPES_IOS[rang]
            return (
              <li
                key={etape}
                className="ligne-tableau flex min-h-12 items-center gap-3 px-1 py-2 text-sm text-craie last:border-b-0"
              >
                <span className="chiffres w-4 shrink-0 text-xs font-bold text-craie/60">
                  {rang + 1}
                </span>
                <span className="min-w-0 flex-1">{etape}</span>
                {IconeEtape && (
                  <IconeEtape aria-hidden="true" className="size-5 shrink-0 text-laiton" />
                )}
              </li>
            )
          })}
        </ol>
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
  const [theme, setTheme] = usePreference<Theme>(CLE_THEME, THEME_DEFAUT)

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
      <EnTeteEcran titre="Réglages" sousTitre={SOUS_TITRE_REGLAGES} />

      <div className="flex flex-col gap-3 px-4">
        {/* L'onglet Joueurs a quitté la barre du bas : on y ajoute ses potes
            en créant une partie, on ne gère les profils qu'occasionnellement. */}
        <Panneau titre={TITRE_PANNEAU_JOUEURS} contenuClassName="flex flex-col gap-3 p-4">
          <p className="text-sm text-craie/75">{TEXTE_PANNEAU_JOUEURS}</p>
          <Link
            to="/joueurs"
            className="flex min-h-12 w-full items-center justify-between gap-3 border-t border-craie/25 pt-3 text-sm text-craie active:text-craie-vive"
          >
            {LIEN_GERER_JOUEURS}
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-laiton" />
          </Link>
        </Panneau>

        <Panneau titre="Sauvegarde" contenuClassName="flex flex-col gap-3 p-4">
          <p className="text-sm text-craie/75">
            Tout vit sur ce téléphone : pas de compte, pas de serveur. Le fichier JSON est donc la
            <strong className="text-craie"> seule façon</strong> de changer d’appareil sans repartir
            de zéro.
          </p>

          <EtatProtection />

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
            profils et parties du fichier s’ajoutent, et ceux déjà présents (même identifiant) sont
            remplacés par la version du fichier. Le reste n’est pas touché.
          </p>

          {erreur && <MessageErreur>{erreur}</MessageErreur>}
          {rapport && <Resume rapport={rapport} />}
        </Panneau>

        <Panneau titre="Thème" contenuClassName="flex flex-col gap-3 p-4">
          <ChoixSegmente
            legende="Affichage"
            valeurs={THEMES}
            valeur={theme}
            taille="sm"
            libelle={(choix) => LIBELLE_THEME[choix]}
            aide="« Système » suit le réglage du téléphone. Le sombre est fait pour un garage mal éclairé, le clair pour une pièce en plein jour."
            onChange={(choix) => {
              setTheme(choix)
              // Posé tout de suite : la préférence seule ne repeint rien, et un
              // thème qui n'arriverait qu'au rechargement passerait pour un bug.
              appliquerTheme(choix)
            }}
          />
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
              'flex min-h-14 items-center justify-between gap-3 border px-4 text-left',
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
              className={`relative h-7 w-12 shrink-0 border transition-colors duration-200 ${
                voix ? 'border-laiton/60 bg-laiton/25' : 'border-craie/20 bg-feutre-nuit/70'
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 transition-all duration-200 ${
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

        <Panneau titre="À propos" contenuClassName="flex flex-col gap-3 p-4">
          <p className="flex items-center gap-2 text-sm text-craie/75">
            <WifiOff aria-hidden="true" className="size-4 shrink-0" />
            100 % local, hors ligne, sans compte.
          </p>
          <p className="text-xs text-craie/60">{PRESENTATION_DARTPERO}</p>
          <EntreeInstallation />
          {/* Hors de toute liste : l'entrée d'installation en rend une sur iOS. */}
          <Link
            to="/confidentialite"
            className="flex min-h-12 w-full items-center justify-between gap-3 border-t border-craie/25 pt-3 text-sm text-craie active:text-craie-vive"
          >
            {LIEN_CONFIDENTIALITE}
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-laiton" />
          </Link>
        </Panneau>
      </div>
    </main>
  )
}
