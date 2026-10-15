import { useId } from 'react'
import { MATCH_NAME_MAX_LENGTH } from '@/core/domain/value-objects/MatchName'
import type { NomPartieSaisi } from '@/ui/hooks/useNouvellePartie'
import { LIBELLE_NOM_PARTIE } from '@/ui/labels'

/**
 * Le nom de la partie : prérempli avec la proposition (« Dimanche soir »),
 * modifiable, jamais obligatoire. Il vit à l'étape 2, sous les réglages.
 *
 * ⚠️ Pas d'`autoFocus` : le clavier masquerait la fiche de réglages, alors que
 * la plupart des parties gardent le nom proposé. Vidé, le champ montre la
 * proposition en filigrane — c'est elle que la partie portera.
 */
export const ChampNom = ({ nom }: { readonly nom: NomPartieSaisi }) => {
  const idChamp = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={idChamp}
        className="font-score text-etiquette uppercase tracking-[0.25em] text-craie-3"
      >
        {LIBELLE_NOM_PARTIE}
      </label>
      <input
        id={idChamp}
        type="text"
        value={nom.saisie}
        placeholder={nom.proposition}
        maxLength={MATCH_NAME_MAX_LENGTH}
        autoComplete="off"
        enterKeyHint="done"
        onChange={(evenement) => nom.setSaisie(evenement.target.value)}
        className="min-h-12 border border-chene/60 bg-feutre/70 px-4 text-craie placeholder:text-craie-3"
      />
    </div>
  )
}
