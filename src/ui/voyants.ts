import type { InstallState } from '@/core/application/ports/driven/AppInstallation'
import { joursCalendairesEntre } from './jourCalendaire'

/**
 * Les deux voyants en tête des Réglages, en fonctions pures : ce qu'ils disent et sur quel ton, sans React
 * ni français (le texte vit dans `labels.ts`).
 */
export type TonVoyant = 'ok' | 'attention'

export const SEUIL_SAUVEGARDE_ANCIENNE = 30

export const SEUIL_EN_MOIS = 60

/** Un mois, pour le voyant : 30 jours, arrondi en dessous (60-89 → 2 mois). */
const JOURS_PAR_MOIS = 30

export type DureeSauvegarde =
  | { readonly type: 'jamais' }
  | { readonly type: 'aujourdhui' }
  | { readonly type: 'hier' }
  | { readonly type: 'jours'; readonly nombre: number }
  | { readonly type: 'mois'; readonly nombre: number }

export type VueVoyantSauvegarde = {
  readonly duree: DureeSauvegarde
  readonly ton: TonVoyant
}

/**
 * Depuis quand le dernier export a eu lieu, en jours du **calendrier local** : « Hier » est la veille, même
 * à quelques minutes d'écart de part et d'autre de minuit.
 */
export const vueVoyantSauvegarde = (
  dernierExport: number | null,
  maintenant: number,
): VueVoyantSauvegarde => {
  const jours =
    dernierExport === null ? Number.NaN : joursCalendairesEntre(dernierExport, maintenant)
  // Hors plage de `Date` (`1e20`) : aucun jour calculable, donc « Jamais ».
  if (Number.isNaN(jours)) return { duree: { type: 'jamais' }, ton: 'attention' }

  const ton: TonVoyant = jours > SEUIL_SAUVEGARDE_ANCIENNE ? 'attention' : 'ok'

  if (jours <= 0) return { duree: { type: 'aujourdhui' }, ton }
  if (jours === 1) return { duree: { type: 'hier' }, ton }
  if (jours < SEUIL_EN_MOIS) return { duree: { type: 'jours', nombre: jours }, ton }
  return { duree: { type: 'mois', nombre: Math.floor(jours / JOURS_PAR_MOIS) }, ton }
}

/** Ce que propose le voyant Application, selon l'état de l'installation. */
export type ActionApplication = 'aucune' | 'installer' | 'comment'

export type VueVoyantApplication = {
  readonly installee: boolean
  readonly ton: TonVoyant
  readonly action: ActionApplication
}

/**
 * - `installed` : « Installée », sans action ; - `installable` : « Installer » ouvre l'invite native ; -
 * iOS, autre navigateur iOS, navigateur sans invite.
 */
export const vueVoyantApplication = (etat: InstallState): VueVoyantApplication => {
  switch (etat) {
    case 'installed':
      return { installee: true, ton: 'ok', action: 'aucune' }
    case 'installable':
      return { installee: false, ton: 'attention', action: 'installer' }
    case 'ios-manual':
    case 'ios-other-browser':
    case 'unavailable':
      return { installee: false, ton: 'attention', action: 'comment' }
    default: {
      const jamais: never = etat
      return jamais
    }
  }
}

/** Le guide `#installer` est rendu là où « Comment ? » y mène — et où mène la ligne de l'Accueil (iOS). */
export const guideInstallationVisible = (etat: InstallState): etat is EtatGuideInstallation =>
  vueVoyantApplication(etat).action === 'comment'

/** Les trois états où le guide `#installer` est rendu. */
export type EtatGuideInstallation = Exclude<InstallState, 'installed' | 'installable'>
