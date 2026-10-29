import { lazy, type ReactNode, Suspense, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { QrScanState } from '@/core/application/ports/driven/QrScanner'
import type { MirrorView } from '@/core/application/ports/driving/WatchMatch'
import type { CheckoutPracticeState } from '@/core/domain/games/checkout-practice/rules'
import type { CricketState } from '@/core/domain/games/cricket/rules'
import type { KillerState } from '@/core/domain/games/killer/rules'
import type { TourDuMondeState } from '@/core/domain/games/tour-du-monde/rules'
import type { X01State } from '@/core/domain/games/x01/rules'
import { Button } from '@/ui/composants/commun/Button'
import { CodeQr } from '@/ui/composants/commun/CodeQr'
import { SpinnerLigne } from '@/ui/composants/commun/Etats'
import {
  BandeauMomentMiroir,
  BandeauPerduMiroir,
  CadreMiroir,
  type MomentMiroir,
  VoileMiroir,
} from '@/ui/composants/commun/Miroir'
import { Viseur } from '@/ui/composants/commun/Viseur'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useMiroir } from '@/ui/hooks/useMiroir'
import { useScannerQr } from '@/ui/hooks/useScannerQr'
import {
  ATTENTE_CONNEXION,
  ATTENTE_PARTIE,
  CONSIGNE_MONTRER_REPONSE,
  CONSIGNE_SCANNER_SAISIE,
  CONSIGNE_VISER,
  ETAPES_MIROIR,
  LIBELLE_CONNECTE,
  LIBELLE_RECOMMENCER,
  LIBELLE_REESSAYER,
  LIBELLE_REFAIRE_CODE,
  LIBELLE_RETOUR,
  LIBELLE_SCANNER_A_NOUVEAU,
  LIBELLE_SCANNER_CODE,
  LIEN_SERVIR_DE_MIROIR,
  PRESENTATION_MIROIR,
  RIEN_ENREGISTRE,
  SOUS_TITRE_SERVIR_DE_MIROIR,
  TEXTE_IMAGE_FIGEE,
  TEXTE_PARTAGE_ARRETE,
  TITRE_CONNEXION_PERDUE,
  TITRE_ECRAN_MIROIR,
  TITRE_PARTAGE_ARRETE,
} from '@/ui/labels'
import { Attente, ErreurJumelage, erreurDeCamera, erreurDuLien, PageJumelage } from './Jumelage'
import { momentMiroir } from './momentMiroir'
import type { VueMiroir } from './vueMiroir'

// Un chunk par mode, comme `PartieEcran` : un mode ajouté doit apporter sa vue miroir ici.
const MiroirX01 = lazy(() =>
  import('../games/x01/MiroirX01').then((m) => ({ default: m.MiroirX01 })),
)
const MiroirTourDuMonde = lazy(() =>
  import('../games/tour-du-monde/MiroirTourDuMonde').then((m) => ({
    default: m.MiroirTourDuMonde,
  })),
)
const MiroirCricket = lazy(() =>
  import('../games/cricket/MiroirCricket').then((m) => ({ default: m.MiroirCricket })),
)
const MiroirKiller = lazy(() =>
  import('../games/killer/MiroirKiller').then((m) => ({ default: m.MiroirKiller })),
)
const MiroirEntrainement = lazy(() =>
  import('../games/checkout-practice/MiroirEntrainement').then((m) => ({
    default: m.MiroirEntrainement,
  })),
)

/** Durée des bandeaux muets (bust, 180, manche, « Partie ! »), fondu de sortie compris. */
const DUREE_MOMENT_MS = 2500
const DUREE_FONDU_MS = 150

const enLecture = (etat: QrScanState): boolean =>
  etat.status === 'starting' || etat.status === 'scanning'

/** ⚠️ Un `case` par mode et un `default` typé `never` : un mode sans vue miroir ne compile pas. */
const VueDuMode = ({ vue }: { readonly vue: MirrorView }) => {
  const { state } = vue
  switch (state.mode) {
    case 'X01':
      return <MiroirX01 vue={vue as VueMiroir<X01State>} />
    case 'TOUR_DU_MONDE':
      return <MiroirTourDuMonde vue={vue as VueMiroir<TourDuMondeState>} />
    case 'CRICKET':
      return <MiroirCricket vue={vue as VueMiroir<CricketState>} />
    case 'KILLER':
      return <MiroirKiller vue={vue as VueMiroir<KillerState>} />
    case 'CHECKOUT_PRACTICE':
      return <MiroirEntrainement vue={vue as VueMiroir<CheckoutPracticeState>} />
    default: {
      const jamais: never = state
      return jamais
    }
  }
}

/** Le bandeau du moment, rejoué depuis la dernière volée du journal ; jamais au premier instantané. */
const useMoment = (vue: MirrorView | null): { moment: MomentMiroir | null; sortant: boolean } => {
  const [moment, setMoment] = useState<MomentMiroir | null>(null)
  const [sortant, setSortant] = useState(false)
  const precedente = useRef<MirrorView | null>(null)
  // Les minuteurs vivent hors de l'effet : une volée en cours qui arrive ne doit pas figer le bandeau.
  const minuteurs = useRef<number[]>([])

  useEffect(() => {
    const avant = precedente.current
    precedente.current = vue
    const nouveau = momentMiroir(avant, vue)
    if (nouveau === null) return
    setMoment(nouveau)
    setSortant(false)
    for (const minuteur of minuteurs.current) window.clearTimeout(minuteur)
    minuteurs.current = [
      window.setTimeout(() => setSortant(true), DUREE_MOMENT_MS - DUREE_FONDU_MS),
      window.setTimeout(() => setMoment(null), DUREE_MOMENT_MS),
    ]
  }, [vue])

  useEffect(
    () => () => {
      for (const minuteur of minuteurs.current) window.clearTimeout(minuteur)
    },
    [],
  )

  return { moment, sortant }
}

/** Le miroir : jumelage puis affichage, lecture seule et muet. Écran plein ; le retour coupe le miroir. */
export const MiroirEcran = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { etat, vue, perduAffiche, session } = useMiroir()
  const scanner = useScannerQr()
  const video = useRef<HTMLVideoElement>(null)
  const { moment, sortant } = useMoment(vue)

  const affiche = etat.status === 'connected' || etat.status === 'lost'
  // L'écran ne s'éteint pas tant qu'il montre une partie. Ni voix, ni vibration ici.
  useWakeLock(affiche)

  // Rien n'est gardé : quitter l'écran coupe le lien.
  useEffect(() => () => session.stop(), [session])

  const lue = useRef<QrScanState | null>(null)
  useEffect(() => {
    if (scanner.etat.status !== 'read' || lue.current === scanner.etat) return
    lue.current = scanner.etat
    void session.answer(scanner.etat.text)
  }, [scanner.etat, session])

  const revenir = () => {
    if (location.key === 'default') navigate('/', { replace: true })
    else navigate(-1)
  }
  const lancerScan = () => scanner.demarrer(video.current)
  const refaire = () => {
    lue.current = null
    session.stop()
  }

  if (affiche || etat.status === 'stopped') {
    return (
      <main className="relative h-dvh overflow-hidden bg-feutre pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
        {etat.status === 'stopped' ? (
          <CadreMiroir gauche={TITRE_ECRAN_MIROIR} nom="">
            <VoileMiroir
              titre={TITRE_PARTAGE_ARRETE}
              texte={TEXTE_PARTAGE_ARRETE}
              action={
                <div className="flex gap-3">
                  <Button taille="lg" onClick={refaire}>
                    {LIBELLE_SCANNER_A_NOUVEAU}
                  </Button>
                  <Button taille="lg" variante="secondaire" onClick={revenir}>
                    {LIBELLE_RETOUR}
                  </Button>
                </div>
              }
            />
          </CadreMiroir>
        ) : vue === null ? (
          <CadreMiroir gauche={TITRE_ECRAN_MIROIR} nom="">
            <VoileMiroir titre={LIBELLE_CONNECTE} texte={ATTENTE_PARTIE} coche />
          </CadreMiroir>
        ) : (
          <Suspense fallback={<SpinnerLigne />}>
            <VueDuMode vue={vue} />
          </Suspense>
        )}
        {moment && etat.status === 'connected' && (
          <BandeauMomentMiroir key={moment.cle} moment={moment} sortant={sortant} />
        )}
        {etat.status === 'lost' && perduAffiche && (
          <BandeauPerduMiroir
            titre={TITRE_CONNEXION_PERDUE}
            texte={TEXTE_IMAGE_FIGEE}
            action={
              <button
                type="button"
                onClick={refaire}
                className="min-h-12 shrink-0 border-2 border-sur-rouge px-3 font-score text-base font-bold uppercase tracking-[0.14em]"
              >
                {LIBELLE_REFAIRE_CODE}
              </button>
            }
          />
        )}
      </main>
    )
  }

  const page = (contenu: ReactNode, courante: number) => (
    <PageJumelage
      titre={LIEN_SERVIR_DE_MIROIR}
      sousTitre={SOUS_TITRE_SERVIR_DE_MIROIR}
      onRetour={revenir}
      etapes={ETAPES_MIROIR}
      courante={courante}
    >
      {contenu}
    </PageJumelage>
  )

  if (etat.status === 'answering') {
    return page(
      <>
        <CodeQr texte={etat.token} />
        <p className="text-base text-craie-vive">{CONSIGNE_MONTRER_REPONSE}</p>
        <Attente texte={ATTENTE_CONNEXION} />
      </>,
      1,
    )
  }

  if (etat.status === 'preparing') return page(<Attente texte={ATTENTE_CONNEXION} />, 1)

  const camera = erreurDeCamera(scanner.etat)
  const lecture = enLecture(scanner.etat)
  const lien = etat.status === 'failed' ? erreurDuLien(etat.reason) : null

  return page(
    <>
      {lecture ? (
        <p className="text-base text-craie-vive">{CONSIGNE_VISER}</p>
      ) : (
        <>
          <p className="border border-dashed border-craie/25 px-5 py-10 text-center text-sm text-craie-2">
            {PRESENTATION_MIROIR}
            <br />
            {RIEN_ENREGISTRE}
          </p>
          <p className="text-base text-craie-vive">{CONSIGNE_SCANNER_SAISIE}</p>
        </>
      )}
      <Viseur ref={video} visible={lecture} />
      {camera && (
        <ErreurJumelage
          erreur={camera}
          {...(camera === 'camera-refusee' && {
            action: (
              <Button variante="secondaire" onClick={lancerScan}>
                {LIBELLE_REESSAYER}
              </Button>
            ),
          })}
        />
      )}
      {!lecture && camera === null && lien && (
        <ErreurJumelage
          erreur={lien}
          {...(lien === 'connexion' && {
            action: (
              <Button variante="secondaire" onClick={lancerScan}>
                {LIBELLE_RECOMMENCER}
              </Button>
            ),
          })}
        />
      )}
      {!lecture && camera === null && lien !== 'connexion' && lien !== 'navigateur' && (
        <Button taille="lg" onClick={lancerScan}>
          {LIBELLE_SCANNER_CODE}
        </Button>
      )}
    </>,
    0,
  )
}
