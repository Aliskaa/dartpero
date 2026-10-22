import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Share, SquarePlus, TriangleAlert, Upload } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import type { InstallState } from '@/core/application/ports/driven/AppInstallation'
import type { ImportReport } from '@/core/application/ports/driving/ManageBackup'
import { CLE_CONTENU_APPAREIL } from '@/ui/clesRequetes'
import { Button } from '@/ui/composants/commun/Button'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { MessageErreur } from '@/ui/composants/commun/Etats'
import { LigneReglage, ListeReglages } from '@/ui/composants/commun/LigneReglage'
import { Phrase } from '@/ui/composants/commun/Phrase'
import { VignetteTheme } from '@/ui/composants/commun/VignetteTheme'
import { type ActionVoyant, Voyant } from '@/ui/composants/commun/Voyant'
import { CLE_VOIX, useDernierExport, usePreference } from '@/ui/hooks/useAppareil'
import { useInstallation } from '@/ui/hooks/useInstallation'
import { useProtectionStockage } from '@/ui/hooks/useStockagePersistant'
import {
  ACTION_COMMENT_INSTALLER,
  ACTION_EXPORTER,
  AIDE_ANNONCER_VOLEES,
  AIDE_GERER_JOUEURS,
  contenuAppareil,
  ERREUR_EXPORT,
  ERREUR_JSON_ILLISIBLE,
  ERREUR_RESTAURATION,
  ETAPES_INSTALLATION_IOS,
  ETAT_INSTALLATION,
  ETIQUETTE_CHOIX_THEME,
  ETIQUETTE_CONTENU_APPAREIL,
  ETIQUETTE_FICHIER_SAUVEGARDE,
  ETIQUETTE_INSTALLATION,
  ETIQUETTE_PROTECTION_STOCKAGE,
  ETIQUETTE_VOYANT_APPLICATION,
  ETIQUETTE_VOYANT_SAUVEGARDE,
  EXPLICATION_RESTAURATION,
  entreesIgnorees,
  fr,
  LIBELLE_DEMANDER_PROTECTION,
  LIBELLE_EXPORTER,
  LIBELLE_INSTALLER,
  LIBELLE_INSTALLER_DARTPERO,
  LIBELLE_RESTAURER,
  LIEN_CONFIDENTIALITE,
  LIEN_GERER_JOUEURS,
  libelleDureeSauvegarde,
  NOM_ACTION_COMMENT_INSTALLER,
  NOM_ACTION_EXPORTER,
  PHRASE_ESSAI_VOIX,
  PHRASE_PROTECTION_STOCKAGE,
  PIED_REGLAGES,
  PRESENTATION_DARTPERO,
  REFUS_PROTECTION_STOCKAGE,
  REFUS_PROTECTION_STOCKAGE_INSTALLEE,
  resumeImport,
  TITRE_ANNONCER_VOLEES,
  TITRE_ESSAYER_VOIX,
  TITRE_GROUPE_AFFICHAGE,
  TITRE_GROUPE_JOUEURS_APPLI,
  TITRE_GROUPE_SAUVEGARDE,
  TITRE_REGLAGES,
  TITRE_RESUME_IMPORT,
  VALEUR_INSTALLEE,
  VALEUR_PAS_INSTALLEE,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import { appliquerTheme, CLE_THEME, THEME_DEFAUT, type Theme } from '@/ui/theme'
import {
  type EtatGuideInstallation,
  guideInstallationVisible,
  vueVoyantApplication,
  vueVoyantSauvegarde,
} from '@/ui/voyants'

/** Le nom du fichier porte la date. */
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

/** Déclenche un téléchargement depuis un objet en mémoire (DOM pur : le use case ne connaît pas les fichiers). */
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
        {TITRE_RESUME_IMPORT}
      </p>
      <p className="mt-1">{resumeImport(rapport.playersImported, rapport.matchesImported)}</p>
      {ignores > 0 && (
        <p className="mt-1 flex items-start gap-1.5 text-craie-3">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {entreesIgnorees(ignores)}
        </p>
      )}
    </div>
  )
}

/** Le titre d'un groupe : capitales espacées, sans cadre (planche `#rg4`). */
const TitreGroupe = ({ id, children }: { readonly id: string; readonly children: string }) => (
  <h2
    id={id}
    className="mt-1.5 font-score text-etiquette font-bold uppercase tracking-[0.2em] text-craie-3"
  >
    {children}
  </h2>
)

/** La phrase de protection du stockage ; rien tant que `status()` n'a pas répondu. ⚠️ Aucun contrôle dans l'`<output>` live. */
const PhraseProtection = ({ installation }: { readonly installation: InstallState }) => {
  const { etat, redemander, refusee } = useProtectionStockage()
  if (etat === null) return null

  const nonProtegee = etat === 'not-persisted'
  const refus =
    refusee && nonProtegee
      ? installation === 'installed'
        ? REFUS_PROTECTION_STOCKAGE_INSTALLEE
        : REFUS_PROTECTION_STOCKAGE
      : null

  return (
    <p className="text-xs text-craie-3">
      <output aria-label={ETIQUETTE_PROTECTION_STOCKAGE}>
        {PHRASE_PROTECTION_STOCKAGE[etat]}
        {refus && <span className="block text-craie-2">{refus}</span>}
      </output>
      {nonProtegee && (
        <>
          {' '}
          <button
            type="button"
            onClick={() => void redemander()}
            className="relative font-score text-etiquette uppercase tracking-widest text-laiton-clair underline underline-offset-3 after:absolute after:inset-x-0 after:-inset-y-4"
          >
            {LIBELLE_DEMANDER_PROTECTION}
          </button>
        </>
      )}
    </p>
  )
}

/** Les icônes des gestes iOS, dans l'ordre des étapes ; la dernière n'en a pas. */
const ICONES_ETAPES_IOS = [Share, SquarePlus, null] as const

/** Le guide `#installer`, rendu seulement là où « Comment ? » y mène ; défilement relancé à chaque navigation (`key`). */
const GuideInstallation = ({ etat }: { readonly etat: EtatGuideInstallation }) => {
  const { hash, key } = useLocation()
  const ancre = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` change à chaque navigation vers l'ancre, même répétée.
  useEffect(() => {
    // Appel optionnel : jsdom n'implémente pas `scrollIntoView`.
    if (hash === '#installer') ancre.current?.scrollIntoView?.({ block: 'start' })
  }, [hash, key])

  return (
    <div
      id="installer"
      ref={ancre}
      className="flex scroll-mt-[max(1rem,env(safe-area-inset-top))] flex-col gap-2"
    >
      <output aria-label={ETIQUETTE_INSTALLATION} className="text-sm text-craie-2">
        {ETAT_INSTALLATION[etat]}
      </output>

      {etat === 'ios-manual' && (
        <ol className="flex flex-col">
          {ETAPES_INSTALLATION_IOS.map((etape, rang) => {
            const IconeEtape = ICONES_ETAPES_IOS[rang]
            return (
              <li
                key={etape}
                className="ligne-tableau flex min-h-12 items-center gap-3 px-1 py-2 text-sm text-craie last:border-b-0"
              >
                <span className="chiffres w-4 shrink-0 text-xs font-bold text-craie-3">
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
  const idAffichage = useId()
  const idSauvegarde = useId()
  const idJoueurs = useId()
  const [voix, setVoix] = usePreference(CLE_VOIX, true)
  const [theme, setTheme] = usePreference<Theme>(CLE_THEME, THEME_DEFAUT)
  const [dernierExport, noterExport] = useDernierExport()
  const { etat: installation, installer } = useInstallation()

  // Rien d'affiché tant que le compte n'est pas là, ni en échec : jamais un faux « 0 ».
  const contenu = useQuery({
    queryKey: CLE_CONTENU_APPAREIL,
    queryFn: () => services.getDeviceContents.execute(),
  })

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
      // Après le téléchargement, jamais avant : un export qui échoue n'écrit rien.
      noterExport(sauvegarde.exportedAt)
    } catch {
      setErreur(ERREUR_EXPORT)
    } finally {
      setOccupe(false)
    }
  }

  const importer = async (fichier: File) => {
    setErreur(null)
    setRapport(null)
    setOccupe(true)
    try {
      const contenuFichier: unknown = JSON.parse(await fichier.text())
      const resultat = await services.manageBackup.importFrom(contenuFichier)
      // Tout le cache est invalidé : joueurs, historique, stats et compte ont changé.
      await queryClient.invalidateQueries()
      setRapport(resultat)
    } catch (cause) {
      setErreur(
        cause instanceof SyntaxError
          ? ERREUR_JSON_ILLISIBLE
          : cause instanceof Error
            ? cause.message
            : ERREUR_RESTAURATION,
      )
    } finally {
      setOccupe(false)
      // Sans ça, réimporter deux fois le même fichier ne déclencherait rien.
      if (champFichier.current) champFichier.current.value = ''
    }
  }

  // L'heure du rendu, par l'horloge des use cases (comme l'Accueil) : aucun minuteur.
  const vueSauvegarde = vueVoyantSauvegarde(dernierExport, services.clock.now())
  const application = vueVoyantApplication(installation)
  const actionApplication: ActionVoyant | null =
    application.action === 'installer'
      ? // Appelée directement dans le clic : l'invite native l'exige.
        {
          type: 'bouton',
          libelle: LIBELLE_INSTALLER,
          nom: LIBELLE_INSTALLER_DARTPERO,
          onClick: installer,
        }
      : application.action === 'comment'
        ? {
            type: 'lien',
            libelle: ACTION_COMMENT_INSTALLER,
            nom: NOM_ACTION_COMMENT_INSTALLER,
            vers: { hash: '#installer' },
          }
        : null

  return (
    <main className="flex flex-1 flex-col gap-3 pb-4">
      <EnTeteEcran titre={TITRE_REGLAGES} />

      <div className="flex flex-col gap-3 px-4">
        <div className="grid grid-cols-2 gap-1.5">
          <Voyant
            etiquette={ETIQUETTE_VOYANT_SAUVEGARDE}
            valeur={libelleDureeSauvegarde(vueSauvegarde.duree)}
            ton={vueSauvegarde.ton}
            teinte={vueSauvegarde.ton === 'ok' ? 'neutre' : 'laiton'}
            action={{
              type: 'bouton',
              libelle: ACTION_EXPORTER,
              nom: NOM_ACTION_EXPORTER,
              onClick: () => void exporter(),
              desactivee: occupe,
            }}
          />
          <Voyant
            etiquette={ETIQUETTE_VOYANT_APPLICATION}
            valeur={application.installee ? VALEUR_INSTALLEE : VALEUR_PAS_INSTALLEE}
            ton={application.ton}
            teinte={application.installee ? 'vert' : 'neutre'}
            {...(actionApplication && { action: actionApplication })}
          />
        </div>

        {contenu.data && (
          <p className="text-xs text-craie-3">
            <output aria-label={ETIQUETTE_CONTENU_APPAREIL}>
              {contenuAppareil(contenu.data.matches, contenu.data.players)}
            </output>
          </p>
        )}

        {guideInstallationVisible(installation) && <GuideInstallation etat={installation} />}

        <section aria-labelledby={idAffichage} className="flex flex-col gap-3">
          <TitreGroupe id={idAffichage}>{TITRE_GROUPE_AFFICHAGE}</TitreGroupe>
          <VignetteTheme
            legende={ETIQUETTE_CHOIX_THEME}
            valeur={theme}
            onChange={(choix) => {
              setTheme(choix)
              // Posé tout de suite : la préférence seule ne repeint rien.
              appliquerTheme(choix)
            }}
          />
          <ListeReglages>
            <LigneReglage
              titre={TITRE_ANNONCER_VOLEES}
              aide={AIDE_ANNONCER_VOLEES}
              action={{
                type: 'bascule',
                active: voix,
                onClick: () => {
                  setVoix(!voix)
                  if (voix) services.devices.announcer.cancel()
                },
              }}
            />
            {/* Toutes les voix françaises ne sont pas installées partout : mieux
                vaut l'entendre ici que de découvrir le silence en pleine partie. */}
            <LigneReglage
              titre={TITRE_ESSAYER_VOIX}
              action={{
                type: 'bouton',
                desactivee: !voix,
                onClick: () => services.devices.announcer.say([fr(PHRASE_ESSAI_VOIX)]),
              }}
            />
          </ListeReglages>
        </section>

        <section aria-labelledby={idSauvegarde} className="flex flex-col gap-3">
          <TitreGroupe id={idSauvegarde}>{TITRE_GROUPE_SAUVEGARDE}</TitreGroupe>
          <div className="grid grid-cols-2 gap-1.5">
            <Button taille="xs" onClick={() => void exporter()} disabled={occupe}>
              <Download aria-hidden="true" className="size-4 shrink-0" />
              {LIBELLE_EXPORTER}
            </Button>
            <Button
              variante="secondaire"
              taille="sm"
              disabled={occupe}
              onClick={() => champFichier.current?.click()}
            >
              <Upload aria-hidden="true" className="size-4 shrink-0" />
              {LIBELLE_RESTAURER}
            </Button>
          </div>
          <input
            id={idChamp}
            ref={champFichier}
            type="file"
            accept="application/json,.json"
            aria-label={ETIQUETTE_FICHIER_SAUVEGARDE}
            className="sr-only"
            onChange={(evenement) => {
              const fichier = evenement.target.files?.[0]
              if (fichier) void importer(fichier)
            }}
          />

          <PhraseProtection installation={installation} />

          <p className="text-xs text-craie-3">
            <Phrase segments={EXPLICATION_RESTAURATION} classeFort="text-craie-2" />
          </p>

          {erreur && <MessageErreur>{erreur}</MessageErreur>}
          {rapport && <Resume rapport={rapport} />}
        </section>

        <section aria-labelledby={idJoueurs} className="flex flex-col gap-3">
          <TitreGroupe id={idJoueurs}>{TITRE_GROUPE_JOUEURS_APPLI}</TitreGroupe>
          <ListeReglages>
            {/* L'onglet Joueurs a quitté la barre du bas : on y ajoute ses potes
                en créant une partie, on ne gère les profils qu'occasionnellement. */}
            <LigneReglage
              titre={LIEN_GERER_JOUEURS}
              aide={AIDE_GERER_JOUEURS}
              {...(contenu.data && { valeur: String(contenu.data.players) })}
              action={{ type: 'lien', vers: '/joueurs' }}
            />
            <LigneReglage
              titre={LIEN_CONFIDENTIALITE}
              action={{ type: 'lien', vers: '/confidentialite' }}
            />
          </ListeReglages>
        </section>

        <footer className="flex flex-col gap-1.5">
          <p className="text-xs text-craie-3">{PIED_REGLAGES}</p>
          <p className="text-xs text-craie-3">{PRESENTATION_DARTPERO}</p>
        </footer>
      </div>
    </main>
  )
}
