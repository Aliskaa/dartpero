// Découpage d'un message en trames ordonnées : `C` = la suite vient, `F` = dernière trame.
/** 5 000 unités UTF-16 font au plus 15 000 octets UTF-8 : sous les 16 Kio d'une trame. */
export const TRAME_UNITES = 5000
export const MESSAGE_MAX = 4 * 1024 * 1024

const SUITE = 'C'
const FIN = 'F'

const estDemiHaut = (code: number): boolean => code >= 0xd800 && code <= 0xdbff

/** ⚠️ Ne coupe jamais une paire de substitution (pseudo avec emoji). */
export const decouper = (message: string, unites = TRAME_UNITES): string[] => {
  const trames: string[] = []
  let debut = 0
  while (message.length - debut > unites) {
    let fin = debut + unites
    if (estDemiHaut(message.charCodeAt(fin - 1))) fin -= 1
    trames.push(SUITE + message.slice(debut, fin))
    debut = fin
  }
  trames.push(FIN + message.slice(debut))
  return trames
}

/** Réassemble les trames reçues ; un message trop gros ou une trame inconnue est jeté entier. */
export class Reassembleur {
  private morceaux: string[] = []
  private taille = 0
  private jete = false

  constructor(private readonly maximum = MESSAGE_MAX) {}

  /** Le message complet à la dernière trame, sinon `null`. */
  recevoir(trame: unknown): string | null {
    if (typeof trame !== 'string' || (trame[0] !== SUITE && trame[0] !== FIN)) {
      // Le message en cours est perdu : on jette jusqu'à la prochaine dernière trame.
      this.vider()
      this.jete = true
      return null
    }
    const corps = trame.slice(1)
    this.taille += corps.length
    if (this.taille > this.maximum) this.jete = true
    if (!this.jete) this.morceaux.push(corps)
    if (trame[0] === SUITE) return null

    const complet = this.jete ? null : this.morceaux.join('')
    this.vider()
    return complet
  }

  private vider(): void {
    this.morceaux = []
    this.taille = 0
    this.jete = false
  }
}
