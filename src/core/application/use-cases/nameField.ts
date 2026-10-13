import { MatchName } from '../../domain/value-objects/MatchName'

/**
 * Le champ `name` d'un événement d'ouverture, prêt à être étalé (`...`).
 *
 * Partagé par les quatre lancements, pour qu'ils valident le nom de la même
 * façon : `MatchName.of` refuse un nom trop long (`DomainError`), et sans nom
 * tapé — absent, vide ou fait d'espaces — le résultat est `{}`.
 *
 * ⚠️ `{}` et non `{ name: undefined }` : IndexedDB et l'export JSON
 * conserveraient la clé. Une ouverture sans nom n'a **pas** de clé `name`.
 */
export const nameField = (raw: string | undefined): { readonly name?: MatchName } => {
  const name = raw === undefined ? null : MatchName.of(raw)
  return name === null ? {} : { name }
}
