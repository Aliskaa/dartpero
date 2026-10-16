import { X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef } from 'react'
import { type NomPictogramme, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { LIBELLE_FERMER } from '@/ui/labels'

type Props = {
  readonly ouvert: boolean
  /**
   * Toutes les fermetures passent par lui : ✕, Échap, retour du téléphone
   * relayé par le navigateur. Avec `useModaleAuRetour`, il recule d'une entrée
   * d'historique — **jamais** un état local remis à faux, sinon l'entrée
   * empilée à l'ouverture resterait orpheline.
   */
  readonly onFermer: () => void
  readonly titre: string
  /** Le nom accessible du dialogue quand le titre visible est abrégé (il le contient). */
  readonly nom?: string
  readonly pictogramme?: NomPictogramme
  /** Sous le titre, hors défilement : les bascules partagées avec la carte. */
  readonly action?: ReactNode
  readonly children: ReactNode
}

/**
 * Une boîte modale : un `<dialog>` natif ouvert par `showModal()` — couche
 * supérieure, fond inerte, `::backdrop` et Échap viennent du navigateur.
 *
 * ⚠️ Pièges tenus ici (lot `statistiques-podium`, Révision 1) :
 * - le `<dialog>` est **monté en permanence**, son contenu seulement quand il
 *   est ouvert (pas de doublon des cartes dans le DOM) ;
 * - **un seul effet, sans nettoyage qui ferme** : sous `StrictMode`, un
 *   nettoyage refermerait la boîte rouverte après un rechargement ;
 * - **jamais `flex` ni `grid` sur le `<dialog>`** : `display: flex` l'afficherait
 *   même fermé ; la mise en page vit dans un conteneur intérieur ;
 * - `cancel` (Échap, retour sur Chrome Android) est annulé puis relayé à
 *   `onFermer` ; un `close` du navigateur pendant qu'on est encore ouvert
 *   aussi. Un `close` provoqué par nous (prop passée à faux) ne relaie rien.
 * - focus : sur ✕ à l'ouverture (explicite : le polyfill jsdom ne le fait
 *   pas), rendu à l'élément d'origine à la fermeture.
 *
 * Fermée par ✕, Échap, le retour — **et un appui à côté**, sur le voile
 * (décision de l'utilisateur, renverse R1-Q5 sur ce point). Un appui sur le
 * voile arrive au `<dialog>` lui-même : on ne ferme que si l'appui **commence
 * et finit** hors de sa boîte (`pointerdown` puis `click`, coordonnées contre
 * `getBoundingClientRect()`). Un appui sur la bordure de la boîte (cible :
 * le `<dialog>` aussi) ou un glisser parti de la liste ne ferme pas.
 */

/** Le point est-il hors de la boîte du `<dialog>` — donc sur le voile ? */
const surLeVoile = (dialogue: HTMLDialogElement, x: number, y: number): boolean => {
  const boite = dialogue.getBoundingClientRect()
  return x < boite.left || x > boite.right || y < boite.top || y > boite.bottom
}
export const Modale = ({ ouvert, onFermer, titre, nom, pictogramme, action, children }: Props) => {
  const boite = useRef<HTMLDialogElement>(null)
  const croix = useRef<HTMLButtonElement>(null)
  const origine = useRef<HTMLElement | null>(null)
  /** L'appui en cours a-t-il commencé sur le voile ? */
  const appuiSurVoile = useRef(false)
  const idTitre = useId()

  useEffect(() => {
    const dialogue = boite.current
    if (!dialogue) return
    if (ouvert && !dialogue.open) {
      const actif = document.activeElement
      origine.current = actif instanceof HTMLElement && actif !== document.body ? actif : null
      dialogue.showModal()
      croix.current?.focus()
      return
    }
    if (!ouvert) {
      if (dialogue.open) dialogue.close()
      const retour = origine.current
      origine.current = null
      if (retour?.isConnected) retour.focus({ preventScroll: true })
    }
  }, [ouvert])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: l'appui sur le voile n'est qu'un raccourci au doigt ; au clavier, Échap (`cancel`) et ✕ ferment déjà
    <dialog
      ref={boite}
      aria-labelledby={idTitre}
      onCancel={(evenement) => {
        evenement.preventDefault()
        onFermer()
      }}
      onClose={() => {
        if (ouvert) onFermer()
      }}
      onPointerDown={(evenement) => {
        const dialogue = evenement.currentTarget
        appuiSurVoile.current =
          evenement.target === dialogue &&
          surLeVoile(dialogue, evenement.clientX, evenement.clientY)
      }}
      onClick={(evenement) => {
        const dialogue = evenement.currentTarget
        const commenceSurVoile = appuiSurVoile.current
        appuiSurVoile.current = false
        if (
          ouvert &&
          commenceSurVoile &&
          evenement.target === dialogue &&
          surLeVoile(dialogue, evenement.clientX, evenement.clientY)
        ) {
          onFermer()
        }
      }}
      className={[
        // Plus large et plus haute que « Nouveau joueur » (R1-Q5 précisé) : la
        // largeur de l'écran moins la gouttière de 16 px de chaque côté, bornée
        // à `max-w-lg` ; au plus 90 % de la hauteur visible (`dvh` : la barre
        // d'adresse mobile compte).
        'm-auto w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-hidden border-2 border-craie/35 bg-ardoise p-0 text-craie',
        'backdrop:bg-feutre-nuit/80',
      ].join(' ')}
    >
      {ouvert && (
        // La hauteur bornée vit ici, sur un conteneur en colonne : tête fixe,
        // liste qui défile. 4 px de bordure retirés du plafond du `<dialog>`.
        <div className="flex max-h-[calc(90dvh-4px)] flex-col">
          <div className="flex shrink-0 flex-col gap-2 border-b border-craie/18 py-2 pr-1 pl-3.5">
            <div className="flex items-center gap-2">
              {pictogramme && (
                <Pictogramme nom={pictogramme} taille={20} className="shrink-0 text-laiton" />
              )}
              <h2
                id={idTitre}
                {...(nom && nom !== titre ? { 'aria-label': nom } : {})}
                className="entete-colonne min-w-0 flex-1 truncate font-bold text-laiton"
              >
                {titre}
              </h2>
              <button
                ref={croix}
                type="button"
                aria-label={LIBELLE_FERMER}
                onClick={onFermer}
                className="flex size-12 shrink-0 items-center justify-center text-craie-2"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            {action && <div className="flex pb-1.5">{action}</div>}
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-3.5 py-3">{children}</div>
        </div>
      )}
    </dialog>
  )
}
