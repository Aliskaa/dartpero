import { type Dart, type Multiplier, SEGMENT_NUMBERS } from '@/core/domain/value-objects/Dart'
import { PaveSaisie } from '@/ui/composants/commun/PaveSaisie'
import { ANNULATION_NEUTRE, type Annulation, LIBELLE_SAISIE_FLECHETTE } from '@/ui/labels'

type Props = {
  readonly multiplicateur: Multiplier
  readonly onMultiplicateur: (valeur: Multiplier) => void
  readonly onFlechette: (dart: Dart) => void
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
  /** Ce que l'annulation va défaire, écrit sur la touche. Voir `libelleAnnulation`. */
  readonly annulation?: Annulation
}

/** Zone saisie du X01 et de l'entraînement : `PaveSaisie` sur 5 colonnes, les vingt secteurs, avec son rail. */
export const PaveFlechettes = ({
  multiplicateur,
  onMultiplicateur,
  onFlechette,
  onAnnuler,
  peutAnnuler,
  annulation = ANNULATION_NEUTRE,
}: Props) => (
  <PaveSaisie
    libelleSection={LIBELLE_SAISIE_FLECHETTE}
    cibles={SEGMENT_NUMBERS}
    colonnes={5}
    multiplicateur={multiplicateur}
    onMultiplicateur={onMultiplicateur}
    exposant="points"
    onFlechette={onFlechette}
    onAnnuler={onAnnuler}
    peutAnnuler={peutAnnuler}
    annulation={annulation}
  />
)
