import { MatchName } from '../../domain/value-objects/MatchName'

// ⚠️ `{}` et non `{ name: undefined }` : IndexedDB et l'export JSON conserveraient la clé.
export const nameField = (raw: string | undefined): { readonly name?: MatchName } => {
  const name = raw === undefined ? null : MatchName.of(raw)
  return name === null ? {} : { name }
}
