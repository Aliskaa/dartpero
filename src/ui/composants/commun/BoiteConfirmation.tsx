import { useId } from 'react'
import { useDialogueNatif } from '@/ui/hooks/useDialogueNatif'
import { LIBELLE_CORRIGER, LIBELLE_VALIDER_SORTIE } from '@/ui/labels'

type Props = {
  readonly ouvert: boolean
  /** « Kevin sort sur D10 ? » : nom et fléchette, lus à 2-3 m. */
  readonly titre: string
  /** « 40 → 0. La manche est gagnée dès que vous validez. » */
  readonly texte: string
  /** *Corriger* — et toute fermeture sans choix : Échap, appui sur le voile. */
  readonly onCorriger: () => void
  readonly onValider: () => void
  /** Une volée part au journal : les deux boutons attendent. */
  readonly occupe: boolean
}

/** Confirmation de la sortie : `<dialog>` natif, fermer sans choisir vaut *Corriger*. ⚠️ Jamais `flex`/`grid` sur le `<dialog>`. */
export const BoiteConfirmation = ({
  ouvert,
  titre,
  texte,
  onCorriger,
  onValider,
  occupe,
}: Props) => {
  const { boite, croix, surAnnulation, surFermeture, surAppui, surClic } = useDialogueNatif(
    ouvert,
    onCorriger,
  )
  const idTitre = useId()
  const idTexte = useId()

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: l'appui sur le voile n'est qu'un raccourci au doigt ; au clavier, Échap (`cancel`) et Corriger ferment déjà
    <dialog
      ref={boite}
      aria-labelledby={idTitre}
      aria-describedby={idTexte}
      onCancel={surAnnulation}
      onClose={surFermeture}
      onPointerDown={surAppui}
      onClick={surClic}
      className={[
        // Centrée, la largeur de l'écran moins la gouttière de 16 px de chaque
        // côté, bornée à 32 rem comme en paysage (U10). Filet haut de craie.
        'm-auto w-[calc(100%-2rem)] max-w-[32rem] border-0 border-t-[3px] border-craie bg-ardoise p-0 text-craie',
        // Le voile de la feuille de règles : en clair, un feutre-nuit beige sur beige
        // n'atténuait presque rien (relecture à l'écran, boucle 3).
        'backdrop:bg-voile',
      ].join(' ')}
    >
      {ouvert && (
        <div className="flex flex-col gap-2.5 p-4">
          <h2
            id={idTitre}
            className="font-score text-xl font-bold uppercase leading-tight tracking-[0.06em] text-craie-vive"
          >
            {titre}
          </h2>
          <p id={idTexte} className="text-sm text-craie-2">
            {texte}
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <button
              ref={croix}
              type="button"
              onClick={onCorriger}
              disabled={occupe}
              className="flex min-h-[52px] items-center justify-center border border-craie/45 px-1.5 text-center font-score text-xs font-bold uppercase tracking-[0.1em] text-craie disabled:opacity-40"
            >
              {LIBELLE_CORRIGER}
            </button>
            <button
              type="button"
              onClick={onValider}
              disabled={occupe}
              className="flex min-h-[52px] items-center justify-center border border-laiton bg-laiton px-1.5 text-center font-score text-xs font-bold uppercase tracking-[0.1em] text-sur-laiton disabled:opacity-40"
            >
              {LIBELLE_VALIDER_SORTIE}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
