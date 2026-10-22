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

/** Zone saisie du Cricket : seulement les sept cibles dans `PaveSaisie` ; le reste se saisit avec « Hors ». */
// L'exposant annonce les marques, pas les points.
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
