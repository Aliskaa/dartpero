/**
 * Génération d'identifiants. Même raison d'être que `Clock` : pas de
 * `crypto.randomUUID()` dans le cœur, et des identifiants prévisibles en test.
 */
export interface IdGenerator {
  newId(): string
}
