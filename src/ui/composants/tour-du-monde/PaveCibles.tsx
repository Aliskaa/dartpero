import { type Dart, SEGMENT_NUMBERS } from '@/core/domain/value-objects/Dart'
import { PaveSaisie } from '@/ui/composants/commun/PaveSaisie'
import { ANNULATION_NEUTRE, type Annulation, LIBELLE_SAISIE_CIBLES } from '@/ui/labels'

type Props = {
  readonly onFlechette: (dart: Dart) => void
  readonly onAnnuler: () => void
  readonly peutAnnuler: boolean
  /** Ce que l'annulation va défaire, écrit sur la touche. Voir `libelleAnnulation`. */
  readonly annulation?: Annulation
}

/**
 * ZONE SAISIE du Tour du monde — le pavé commun (`PaveSaisie`), **sans bascule
 * S/D/T** : pas de rail, pas de touche armée.
 *
 * Au Tour du monde, seul le secteur compte : un triple 20 vaut exactement ce
 * que vaut un simple 20, c'est-à-dire « touché ». Afficher un sélecteur de
 * multiplicateur qui ne changerait rien induirait en erreur. Les fléchettes
 * enregistrées sont donc des simples (la Bulle : `Dart.bull()`).
 *
 * La rangée Bulle · Hors · Annuler est la dernière : Annuler y est un rail
 * (64 px) plus bas qu'aux autres jeux, ce qui est accepté.
 */
export const PaveCibles = ({
  onFlechette,
  onAnnuler,
  peutAnnuler,
  annulation = ANNULATION_NEUTRE,
}: Props) => (
  <PaveSaisie
    libelleSection={LIBELLE_SAISIE_CIBLES}
    cibles={SEGMENT_NUMBERS}
    colonnes={5}
    onFlechette={onFlechette}
    onAnnuler={onAnnuler}
    peutAnnuler={peutAnnuler}
    annulation={annulation}
  />
)
