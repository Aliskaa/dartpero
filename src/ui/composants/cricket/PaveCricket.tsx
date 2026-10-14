import type { Dart, Multiplier, Segment, SegmentNumber } from '@/core/domain/value-objects/Dart'
import { PaveSaisie } from '@/ui/composants/commun/PaveSaisie'
import { ANNULATION_NEUTRE, type Annulation, LIBELLE_SAISIE_CIBLES } from '@/ui/labels'

type Props = {
  readonly cibles: readonly Segment[]
  readonly multiplicateur: Multiplier
  readonly onMultiplicateur: (valeur: Multiplier) => void
  readonly onFlechette: (dart: Dart) => void
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
  /** Ce que l'annulation va défaire, écrit sur la touche. Voir `libelleAnnulation`. */
  readonly annulation?: Annulation
}

const estNumerote = (cible: Segment): cible is SegmentNumber => typeof cible === 'number'

/**
 * ZONE SAISIE du Cricket — **seulement les sept cibles**, dans le pavé commun
 * (`PaveSaisie`) sur 3 colonnes : les six numéros en 3 × 2 (20 19 18 / 17 16 15,
 * l'ordre de la feuille), puis la Bulle dans la rangée Bulle · Hors · Annuler.
 *
 * Le pavé du X01 aligne les vingt secteurs ; ici dix-neuf d'entre eux ne font
 * strictement rien. Les proposer inviterait à saisir des fléchettes sans effet.
 * Tout ce qui tombe hors des sept cibles se saisit avec « Hors », qui dit
 * exactement ce qui s'est passé au jeu : rien.
 *
 * La bascule S/D/T est momentanée (remise à Simple dans `useCricket`), graduée
 * comme au X01 ; l'exposant annonce les **marques** (« ×2 », « ×3 »), pas les
 * points. Le filtrage de la bulle (elle n'est pas dans la grille) ne change
 * aucune règle : elle part en `Dart.of('BULL', multiplicateur)`.
 */
export const PaveCricket = ({
  cibles,
  multiplicateur,
  onMultiplicateur,
  onFlechette,
  onAnnuler,
  peutAnnuler,
  annulation = ANNULATION_NEUTRE,
}: Props) => (
  <PaveSaisie
    libelleSection={LIBELLE_SAISIE_CIBLES}
    cibles={cibles.filter(estNumerote)}
    colonnes={3}
    multiplicateur={multiplicateur}
    onMultiplicateur={onMultiplicateur}
    exposant="marques"
    onFlechette={onFlechette}
    onAnnuler={onAnnuler}
    peutAnnuler={peutAnnuler}
    annulation={annulation}
  />
)
