import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { QrScanState } from '@/core/application/ports/driven/QrScanner'
import { vientDeLaPartie } from '@/ui/chemins'
import { Button } from '@/ui/composants/commun/Button'
import { CodeQr } from '@/ui/composants/commun/CodeQr'
import { SpinnerLigne } from '@/ui/composants/commun/Etats'
import { Viseur } from '@/ui/composants/commun/Viseur'
import { usePartage } from '@/ui/hooks/usePartage'
import { useScannerQr } from '@/ui/hooks/useScannerQr'
import {
  AIDE_LUMINOSITE,
  ATTENTE_CONNEXION,
  CONSIGNE_MONTRER_OFFRE,
  CONSIGNE_VISER,
  ETAPES_PARTAGE,
  LIBELLE_ARRETER_PARTAGE,
  LIBELLE_RECOMMENCER,
  LIBELLE_REESSAYER,
  LIBELLE_REFAIRE_CODE,
  LIBELLE_RETOUR,
  LIBELLE_RETOUR_PARTIE,
  LIBELLE_SCANNER_REPONSE,
  LIEN_PARTAGER_PARTIE,
  LIEN_REVOIR_CODE,
  TEXTE_MIROIR_CONNECTE,
  TEXTE_MIROIR_PERDU,
  TEXTE_SANS_CAMERA_PARTAGE,
  TITRE_ECRAN_MIROIR,
  TITRE_MIROIR_CONNECTE,
  TITRE_MIROIR_PERDU,
} from '@/ui/labels'
import {
  Attente,
  ErreurJumelage,
  EtatLien,
  erreurDeCamera,
  erreurDuLien,
  PageJumelage,
} from './Jumelage'

/** Le « Connecté » revient seul à la partie après ce délai, ou au toucher. */
const RETOUR_AUTO_MS = 2000

const enLecture = (etat: QrScanState): boolean =>
  etat.status === 'starting' || etat.status === 'scanning'

/** Le partage, côté saisie : montrer le code, scanner la réponse. Écran plein ; le retour annule un jumelage en cours. */
export const PartageEcran = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { etat, voyant, session } = usePartage()
  const scanner = useScannerQr()
  const video = useRef<HTMLVideoElement>(null)
  const [etape, setEtape] = useState<'montrer' | 'scanner'>('montrer')
  const depuisPartie = vientDeLaPartie(location.state)

  const revenir = useCallback(() => {
    if (location.key === 'default') navigate('/', { replace: true })
    else navigate(-1)
  }, [location.key, navigate])

  // À l'arrivée, une offre se prépare si rien n'est en cours ; au départ, un jumelage inachevé est annulé.
  useEffect(() => {
    const statut = session.state().status
    if (statut === 'idle' || statut === 'failed') void session.start()
    return () => {
      const fin = session.state().status
      if (fin === 'preparing' || fin === 'offering') session.stop()
    }
  }, [session])

  // La réponse lue part à la session une fois ; la caméra s'est déjà arrêtée sur la lecture.
  const lue = useRef<QrScanState | null>(null)
  useEffect(() => {
    if (scanner.etat.status !== 'read' || lue.current === scanner.etat) return
    lue.current = scanner.etat
    void session.acceptAnswer(scanner.etat.text)
  }, [scanner.etat, session])

  // Connecté sous nos yeux : retour seul à la partie après 2 s.
  const avant = useRef(etat.status)
  useEffect(() => {
    const precedent = avant.current
    avant.current = etat.status
    if (etat.status !== 'connected' || precedent === 'connected' || precedent === 'lost') return
    const minuteur = window.setTimeout(revenir, RETOUR_AUTO_MS)
    return () => window.clearTimeout(minuteur)
  }, [etat.status, revenir])

  const lancerScan = () => {
    setEtape('scanner')
    // Dans le clic : iOS n'ouvre la caméra que dans un geste de l'utilisateur.
    scanner.demarrer(video.current)
  }
  const refaire = () => {
    setEtape('montrer')
    scanner.arreter()
    void session.start()
  }
  const arreter = () => {
    session.stop()
    revenir()
  }

  const page = (contenu: ReactNode, courante?: number) => (
    <PageJumelage
      titre={TITRE_ECRAN_MIROIR}
      sousTitre={LIEN_PARTAGER_PARTIE}
      onRetour={revenir}
      {...(courante !== undefined && { etapes: ETAPES_PARTAGE, courante })}
    >
      {contenu}
    </PageJumelage>
  )

  if (etat.status === 'connected' || (etat.status === 'lost' && voyant === 'connecte')) {
    return page(
      <>
        <p aria-hidden="true" className="mt-5 text-center font-display text-5xl text-vert-cible">
          ✓
        </p>
        <EtatLien titre={TITRE_MIROIR_CONNECTE} texte={TEXTE_MIROIR_CONNECTE} />
        <Button taille="lg" onClick={revenir}>
          {depuisPartie ? LIBELLE_RETOUR_PARTIE : LIBELLE_RETOUR}
        </Button>
        <Button variante="secondaire" onClick={arreter}>
          {LIBELLE_ARRETER_PARTAGE}
        </Button>
      </>,
    )
  }

  if (etat.status === 'lost') {
    return page(
      <>
        <EtatLien titre={TITRE_MIROIR_PERDU} texte={TEXTE_MIROIR_PERDU} perdu />
        <Button taille="lg" onClick={refaire}>
          {LIBELLE_REFAIRE_CODE}
        </Button>
        <Button variante="secondaire" onClick={arreter}>
          {LIBELLE_ARRETER_PARTAGE}
        </Button>
      </>,
    )
  }

  if (etat.status === 'failed') {
    return page(
      <ErreurJumelage
        erreur={erreurDuLien(etat.reason)}
        action={
          <Button variante="secondaire" onClick={refaire}>
            {LIBELLE_RECOMMENCER}
          </Button>
        }
      />,
    )
  }

  if (etat.status === 'connecting') return page(<Attente texte={ATTENTE_CONNEXION} />, 1)

  if (etat.status !== 'offering') return page(<SpinnerLigne />, 0)

  const camera = erreurDeCamera(scanner.etat)
  const lecture = enLecture(scanner.etat)
  const rejet = etat.rejected === null ? null : erreurDuLien(etat.rejected)

  return page(
    <>
      {etape === 'montrer' ? (
        <>
          <CodeQr texte={etat.token} />
          <p className="text-base text-craie-vive">{CONSIGNE_MONTRER_OFFRE}</p>
          <p className="text-sm text-craie-2">{AIDE_LUMINOSITE}</p>
        </>
      ) : (
        lecture && <p className="text-base text-craie-vive">{CONSIGNE_VISER}</p>
      )}
      <Viseur ref={video} visible={etape === 'scanner' && lecture} />
      {etape === 'scanner' && camera && (
        <ErreurJumelage
          erreur={camera}
          {...(camera === 'sans-camera' && { texte: TEXTE_SANS_CAMERA_PARTAGE })}
          {...(camera === 'camera-refusee' && {
            action: (
              <Button variante="secondaire" onClick={lancerScan}>
                {LIBELLE_REESSAYER}
              </Button>
            ),
          })}
        />
      )}
      {etape === 'scanner' && !lecture && rejet && <ErreurJumelage erreur={rejet} />}
      {!lecture && camera === null && (
        <Button taille="lg" onClick={lancerScan}>
          {LIBELLE_SCANNER_REPONSE}
        </Button>
      )}
      {etape === 'scanner' && (
        <button
          type="button"
          onClick={() => {
            scanner.arreter()
            setEtape('montrer')
          }}
          className="min-h-12 self-center border-b border-laiton font-score text-sm uppercase tracking-[0.12em] text-laiton-clair"
        >
          {LIEN_REVOIR_CODE}
        </button>
      )}
    </>,
    etape === 'montrer' ? 0 : 1,
  )
}
