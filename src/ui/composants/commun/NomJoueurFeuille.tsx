import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { couleurJoueur } from '@/ui/couleurs'
import { LIBELLE_VAINQUEUR } from '@/ui/labels'

type Props = {
  readonly nom: string
  readonly couleur: PlayerColor | null
  readonly actif: boolean
  readonly vainqueur: boolean
  /** Le carré passe au rouge (bust du X01) : l'alerte remplace la couleur du profil. */
  readonly alerte?: boolean
  /** Dès trois joueurs : 15 px et interlettrage resserré, pour tenir dans la colonne. */
  readonly serre?: boolean
  /**
   * Éliminé (Killer) : nom en `craie-3` barré, carré de profil en niveaux de
   * gris — un effet, pas une couleur (planche `killer`).
   */
  readonly elimine?: boolean
}

/**
 * Le nom d'un joueur sur la feuille, devant son carré de couleur de 12 px — le
 * même dans les trois jeux. Un carré de repère, pas une pastille, pas un liseré.
 * Le nom est tronqué en dernier recours (« … »), et la couronne du vainqueur a
 * son texte pour les lecteurs d'écran.
 *
 * Craie atténuée au repos, craie vive pour celui qui lance.
 */
export const NomJoueurFeuille = ({
  nom,
  couleur,
  actif,
  vainqueur,
  alerte,
  serre,
  elimine = false,
}: Props) => {
  const teinte = couleurJoueur(couleur)

  return (
    <p className={`flex min-w-0 items-center ${serre ? 'gap-1.5' : 'gap-2'}`}>
      <span
        aria-hidden="true"
        style={{ backgroundColor: alerte ? undefined : teinte.fond }}
        className={`size-3 shrink-0 ${alerte ? 'bg-rouge-cible' : ''} ${elimine ? 'grayscale' : ''}`}
      />
      <span
        className={`truncate font-score font-bold uppercase ${
          serre ? 'text-nom-serre tracking-[0.02em]' : 'text-base tracking-[0.08em]'
        } ${
          elimine
            ? 'text-craie-3 line-through decoration-2'
            : actif
              ? 'text-craie-vive'
              : 'text-craie-2'
        }`}
      >
        {nom}
      </span>
      {vainqueur && (
        <>
          <Pictogramme nom="victoire" taille={20} className="shrink-0 text-laiton-clair" />
          <span className="sr-only">, {LIBELLE_VAINQUEUR}</span>
        </>
      )}
    </p>
  )
}
