import { X } from 'lucide-react'
import { type ReactNode, useId } from 'react'
import { type NomPictogramme, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { useDialogueNatif } from '@/ui/hooks/useDialogueNatif'
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
 * Les pièges du `<dialog>` (un seul effet sans nettoyage qui ferme, `cancel`
 * et `close` relayés, focus, appui à côté) sont tenus par `useDialogueNatif`,
 * partagé avec la feuille de règles. Tenu ici :
 * - le `<dialog>` est **monté en permanence**, son contenu seulement quand il
 *   est ouvert (pas de doublon des cartes dans le DOM) ;
 * - **jamais `flex` ni `grid` sur le `<dialog>`** : `display: flex` l'afficherait
 *   même fermé ; la mise en page vit dans un conteneur intérieur.
 *
 * Fermée par ✕, Échap, le retour — **et un appui à côté**, sur le voile
 * (décision de l'utilisateur, renverse R1-Q5 sur ce point).
 */
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
