import type { Announcer } from '@/core/application/ports/driven/Announcer'

/**
 * Annonce vocale par la Web Speech API.
 *
 * Trois pièges du monde réel traités ici :
 * - l'API manque sur certains navigateurs → on se tait plutôt que de planter ;
 * - la liste des voix arrive **de façon asynchrone** sur Chrome : au premier
 *   appel elle est souvent vide, d'où l'écoute de `voiceschanged` ;
 * - une annonce en retard vaut moins que le silence — on coupe la précédente
 *   avant d'en lancer une nouvelle, sinon les volées s'empilent et la voix
 *   commente encore le coup d'avant.
 */
export class SpeechAnnouncer implements Announcer {
  private voix: SpeechSynthesisVoice | null = null
  private ecouteInstallee = false

  private get disponible(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  private choisirVoix(): SpeechSynthesisVoice | null {
    if (!this.disponible) return null
    if (this.voix) return this.voix

    const voix = window.speechSynthesis.getVoices()
    this.voix =
      voix.find((candidate) => candidate.lang.toLowerCase().startsWith('fr')) ?? voix[0] ?? null

    if (!this.voix && !this.ecouteInstallee) {
      // Chrome peuple la liste après coup : on retentera au prochain appel.
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        this.voix = null
      })
      this.ecouteInstallee = true
    }

    return this.voix
  }

  say(texte: string): void {
    if (!this.disponible || texte.trim() === '') return

    try {
      window.speechSynthesis.cancel()

      const annonce = new SpeechSynthesisUtterance(texte)
      annonce.lang = 'fr-FR'
      // Un peu plus rapide que la normale : on annonce entre deux volées, pas
      // un journal télévisé.
      annonce.rate = 1.1
      const voix = this.choisirVoix()
      if (voix) annonce.voice = voix

      window.speechSynthesis.speak(annonce)
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
