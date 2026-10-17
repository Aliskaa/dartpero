/**
 * Ce que contient ce téléphone : toutes les parties enregistrées (en cours,
 * abandonnées et entraînements compris) et tous les profils. Rien de projeté :
 * un compte, pas un historique.
 */
export type DeviceContents = {
  readonly matches: number
  readonly players: number
}

/** La ligne « N parties · M joueurs sur ce téléphone » des Réglages. */
export interface GetDeviceContents {
  execute(): Promise<DeviceContents>
}
