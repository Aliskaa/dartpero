import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PeerLinkFailure } from '@/core/application/ports/driven/PeerLinks'
import type { QrScanState } from '@/core/application/ports/driven/QrScanner'
import { BarreEtapes } from '@/ui/ecrans/nouvelle-partie/BarreEtapes'
import { ERREURS_MIROIR, type ErreurMiroir, LIBELLE_RETOUR } from '@/ui/labels'

/** La raison d'un échec du lien, traduite : jamais un message brut du cœur. */
export const erreurDuLien = (raison: PeerLinkFailure): ErreurMiroir => {
  switch (raison) {
    case 'unavailable':
      return 'navigateur'
    case 'unreadable':
      return 'code-illisible'
    case 'incompatible':
      return 'versions'
    case 'no-local-candidate':
    case 'failed':
      return 'connexion'
    default: {
      const jamais: never = raison
      return jamais
    }
  }
}

/** Une caméra refusée, absente ou en panne ; `null` tant que tout va bien. */
export const erreurDeCamera = (etat: QrScanState): ErreurMiroir | null => {
  switch (etat.status) {
    case 'denied':
    case 'failed':
      return 'camera-refusee'
    case 'absent':
      return 'sans-camera'
    default:
      return null
  }
}

/** L'écran plein du jumelage : retour (qui annule), titre et sous-titre, étapes. */
export const PageJumelage = ({
  titre,
  sousTitre,
  onRetour,
  etapes,
  courante,
  children,
}: {
  readonly titre: string
  readonly sousTitre: string
  readonly onRetour: () => void
  readonly etapes?: readonly string[]
  readonly courante?: number
  readonly children: ReactNode
}) => (
  <main className="feutre-tapis flex min-h-dvh flex-col gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
    <header className="flex items-center gap-3">
      <button
        type="button"
        aria-label={LIBELLE_RETOUR}
        onClick={onRetour}
        className="flex size-12 shrink-0 items-center justify-center border border-chene text-craie-2 transition-[background-color] duration-90 ease-out active:bg-craie/15"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </button>
      <div className="min-w-0">
        <h1 className="font-score text-2xl font-bold uppercase leading-none text-craie-vive">
          {titre}
        </h1>
        <p className="mt-1 font-score text-etiquette uppercase tracking-[0.18em] text-craie-3">
          {sousTitre}
        </p>
      </div>
    </header>
    {etapes && courante !== undefined && <BarreEtapes etapes={etapes} courante={courante} />}
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">{children}</div>
  </main>
)

/** Un message d'erreur dans l'écran, jamais une boîte ; une action au plus. */
export const ErreurJumelage = ({
  erreur,
  texte,
  action,
}: {
  readonly erreur: ErreurMiroir
  /** Le texte, quand le rôle le change (« Pas de caméra » vu de la saisie). */
  readonly texte?: string
  readonly action?: ReactNode
}) => (
  <div role="alert" className="flex flex-col gap-2 border-l-4 border-rouge-cible bg-ardoise p-3.5">
    <p className="font-score text-lg font-bold uppercase tracking-[0.06em] text-craie-vive">
      {ERREURS_MIROIR[erreur].titre}
    </p>
    <p className="text-sm text-craie-2">{texte ?? ERREURS_MIROIR[erreur].texte}</p>
    {action}
  </div>
)

/** Un état du lien, filet vert (connecté) ou rouge (perdu). */
export const EtatLien = ({
  titre,
  texte,
  perdu = false,
}: {
  readonly titre: string
  readonly texte: string
  readonly perdu?: boolean
}) => (
  <output
    className={`flex flex-col gap-1 border-l-4 bg-ardoise p-3 ${perdu ? 'border-rouge-cible' : 'border-vert-cible'}`}
  >
    <span className="font-score font-bold uppercase tracking-[0.06em] text-craie-vive">
      {titre}
    </span>
    <span className="text-sm text-craie-2">{texte}</span>
  </output>
)

/** « En attente de la connexion… », un carré de laiton qui clignote (immobile si moins d'animations). */
export const Attente = ({ texte }: { readonly texte: string }) => (
  <p className="flex items-center gap-2.5 self-center text-craie-2">
    <i aria-hidden="true" className="size-2.5 animate-pulse bg-laiton motion-reduce:animate-none" />
    {texte}
  </p>
)
