import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'

/** La traduction des couleurs de profil en pixels. */
export type CouleurJoueur = {
  readonly fond: string
  readonly bord: string
  readonly texte: string
}

export const COULEURS: Record<PlayerColor, CouleurJoueur> = {
  brique: { fond: '#C1272D', bord: '#E4585E', texte: '#FFF1F1' },
  sapin: { fond: '#2E7D4F', bord: '#5BB27E', texte: '#EFFBF3' },
  lagon: { fond: '#2C6E9B', bord: '#5FA6D1', texte: '#EFF7FD' },
  prune: { fond: '#8A4FA8', bord: '#B683CE', texte: '#F8F0FD' },
  cuivre: { fond: '#C1720F', bord: '#E7A248', texte: '#FFF6EA' },
  turquoise: { fond: '#1F8B8B', bord: '#4FBFBF', texte: '#EEFBFB' },
  grenat: { fond: '#A32B63', bord: '#D4699B', texte: '#FDEFF6' },
  olive: { fond: '#5A6E23', bord: '#93AB4E', texte: '#F5FAE8' },
}

/** Le profil a été supprimé, mais ses parties sont toujours là : teinte de bois. */
const EFFACE: CouleurJoueur = { fond: '#5A3E24', bord: '#8B6238', texte: '#F2E8D5' }

export const couleurJoueur = (couleur: PlayerColor | null | undefined): CouleurJoueur =>
  couleur ? COULEURS[couleur] : EFFACE

export const NOM_COULEUR: Record<PlayerColor, string> = {
  brique: 'Brique',
  sapin: 'Sapin',
  lagon: 'Lagon',
  prune: 'Prune',
  cuivre: 'Cuivre',
  turquoise: 'Turquoise',
  grenat: 'Grenat',
  olive: 'Olive',
}

/**
 * Deux lettres maximum : « Jean-Michel » → « JM », « Kevin » → « KE ». Lues à 3 mètres dans une pastille de
 * 40 px, trois lettres ne passent pas.
 */
export const initiales = (nom: string): string => {
  const mots = nom
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
  if (mots.length === 0) return '?'
  if (mots.length === 1) return (mots[0] ?? '').slice(0, 2).toUpperCase()
  return `${(mots[0] ?? '').charAt(0)}${(mots[1] ?? '').charAt(0)}`.toUpperCase()
}
