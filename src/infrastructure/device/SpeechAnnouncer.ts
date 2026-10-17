import type { Annonce, Announcer, Langue } from '@/core/application/ports/driven/Announcer'

/**
 * Annonce vocale par la Web Speech API.
 *
 * Quatre pièges du monde réel traités ici :
 * - l'API manque sur certains navigateurs → on se tait plutôt que de planter ;
 * - la liste des voix arrive **de façon asynchrone** sur Chrome : au premier
 *   appel elle est souvent vide, d'où l'écoute de `voiceschanged` — et on ne
 *   fige jamais un « aucune voix » tant que la liste est vide ;
 * - une annonce en retard vaut moins que le silence — on coupe la précédente
 *   **une fois**, en tête de l'annonce, puis on empile les segments : la file
 *   native les enchaîne sans qu'ils se coupent entre eux ;
 * - la voix de la langue d'un segment (en-US pour « checkout ») peut manquer :
 *   on se replie sur la voix française, puis sur la première voix, et le
 *   segment se dit quand même.
 */
export class SpeechAnnouncer implements Announcer {
  private readonly voix = new Map<Langue, SpeechSynthesisVoice | null>()
  private ecouteInstallee = false

  private get disponible(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  private choisirVoix(langue: Langue): SpeechSynthesisVoice | null {
    if (!this.disponible) return null
    const memorisee = this.voix.get(langue)
    if (memorisee) return memorisee

    const voix = window.speechSynthesis.getVoices()
    // Chrome peuple la liste après coup : tant qu'elle est vide, rien n'est mémorisé.
    if (voix.length === 0) {
      this.ecouterChangement()
      return null
    }

    const exacte = langue.toLowerCase()
    const prefixe = exacte.split('-')[0] ?? exacte
    const choisie =
      voix.find((candidate) => candidate.lang.toLowerCase().replace('_', '-') === exacte) ??
      voix.find((candidate) => candidate.lang.toLowerCase().startsWith(prefixe)) ??
      voix.find((candidate) => candidate.lang.toLowerCase().startsWith('fr')) ??
      voix[0] ??
      null

    this.voix.set(langue, choisie)
    return choisie
  }

  private ecouterChangement(): void {
    if (this.ecouteInstallee) return
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      this.voix.clear()
    })
    this.ecouteInstallee = true
  }

  say(annonce: Annonce): void {
    if (!this.disponible) return
    const segments = annonce.filter((segment) => segment.texte.trim() !== '')
    // Rien à dire : on ne coupe pas non plus l'annonce en cours.
    if (segments.length === 0) return

    try {
      window.speechSynthesis.cancel()

      for (const segment of segments) {
        const enonce = new SpeechSynthesisUtterance(segment.texte)
        enonce.lang = segment.langue
        // Un peu plus rapide que la normale : on annonce entre deux volées, pas
        // un journal télévisé.
        enonce.rate = 1.1
        const voix = this.choisirVoix(segment.langue)
        if (voix) enonce.voice = voix

        window.speechSynthesis.speak(enonce)
      }
    } catch {
      // Voix absente, onglet en arrière-plan, permission refusée : sans gravité.
    }
  }

  cancel(): void {
    if (!this.disponible) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      // Rien à annuler.
    }
  }
}
