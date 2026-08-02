import type { PlayerId } from '@/core/domain/value-objects/ids'

/**
 * Couleur de joueur — provisoire et **purement UI**.
 *
 * La charte prévoit une pastille de couleur par profil, mais `Player` ne porte
 * pas encore de couleur (elle arrive au lot 4, avec l'écran Joueurs). En
 * attendant, on la dérive de l'identifiant : c'est stable d'une session à
 * l'autre, ça ne touche pas au domaine, et le jour où le profil porte vraiment
 * une couleur choisie, il n'y a qu'à préférer celle-là ici.
 */
export type CouleurJoueur = {
  readonly fond: string
  readonly bord: string
  readonly texte: string
}

/** Des teintes qui tiennent sur du feutre sombre, sans concurrencer le laiton. */
const PALETTE: readonly CouleurJoueur[] = [
  { fond: '#C1272D', bord: '#E4585E', texte: '#FFF1F1' },
  { fond: '#2E7D4F', bord: '#5BB27E', texte: '#EFFBF3' },
  { fond: '#2C6E9B', bord: '#5FA6D1', texte: '#EFF7FD' },
  { fond: '#8A4FA8', bord: '#B683CE', texte: '#F8F0FD' },
  { fond: '#C1720F', bord: '#E7A248', texte: '#FFF6EA' },
  { fond: '#1F8B8B', bord: '#4FBFBF', texte: '#EEFBFB' },
  { fond: '#A32B63', bord: '#D4699B', texte: '#FDEFF6' },
  { fond: '#5A6E23', bord: '#93AB4E', texte: '#F5FAE8' },
]

/** Hash déterministe et sans dépendance : même identifiant, même pastille. */
const empreinte = (valeur: string): number => {
  let total = 0
  for (let index = 0; index < valeur.length; index += 1) {
    total = (total * 31 + valeur.charCodeAt(index)) % 100_003
  }
  return total
}

export const couleurJoueur = (id: PlayerId): CouleurJoueur => {
  const couleur = PALETTE[empreinte(id) % PALETTE.length]
  // PALETTE n'est jamais vide : le fallback ne sert qu'à satisfaire le typage.
  return couleur ?? { fond: '#5A3E24', bord: '#8B6238', texte: '#F2E8D5' }
}

/**
 * Deux lettres maximum : « Jean-Michel » → « JM », « Kevin » → « KE ».
 * Lues à 3 mètres dans une pastille de 40 px, trois lettres ne passent pas.
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
