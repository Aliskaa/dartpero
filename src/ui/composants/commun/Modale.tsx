import { X } from 'lucide-react'
import { type ReactNode, useId } from 'react'
import { type NomPictogramme, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { useDialogueNatif } from '@/ui/hooks/useDialogueNatif'
import { LIBELLE_FERMER } from '@/ui/labels'

type Props = {
  readonly ouvert: boolean
  /** Toutes les fermetures reculent d'une entrée d'historique, jamais un état local remis à faux. */
  readonly onFermer: () => void
  readonly titre: string
  /** Le nom accessible du dialogue quand le titre visible est abrégé (il le contient). */
  readonly nom?: string
  readonly pictogramme?: NomPictogramme
  /** Sous le titre, hors défilement : les bascules partagées avec la carte. */
  readonly action?: ReactNode
  readonly children: ReactNode
}

/** Boîte modale : `<dialog>` natif (`showModal()`), pièges tenus par `useDialogueNatif`. ⚠️ Jamais `flex`/`grid` sur le `<dialog>` ; un appui sur le voile ferme. */
export const Modale = ({ ouvert, onFermer, titre, nom, pictogramme, action, children }: Props) => {
  const { boite, croix, surAnnulation, surFermeture, surAppui, surClic } = useDialogueNatif(
    ouvert,
    onFermer,
  )
  const idTitre = useId()

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: l'appui sur le voile n'est qu'un raccourci au doigt ; au clavier, Échap (`cancel`) et ✕ ferment déjà
    <dialog
      ref={boite}
      aria-labelledby={idTitre}
      onCancel={surAnnulation}
      onClose={surFermeture}
      onPointerDown={surAppui}
      onClick={surClic}
      className={[
        // Largeur de l'écran moins 16 px de gouttière, bornée à `max-w-lg` ; au plus 90 % de la hauteur visible (`dvh`).
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
