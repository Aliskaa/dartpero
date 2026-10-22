import type { Annonce, Announcer, Langue } from '@/core/application/ports/driven/Announcer'

/** Web Speech API ; muette si elle manque, repli sur la voix française puis la première voix. */
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
    // Chrome peuple la liste après coup : rien n'est mémorisé tant qu'elle est vide.
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
    if (segments.length === 0) return

    try {
      // Une annonce en retard vaut moins que le silence : on coupe la précédente une fois.
      window.speechSynthesis.cancel()

      for (const segment of segments) {
        const enonce = new SpeechSynthesisUtterance(segment.texte)
        enonce.lang = segment.langue
        enonce.rate = 1.1
        const voix = this.choisirVoix(segment.langue)
        if (voix) enonce.voice = voix

        window.speechSynthesis.speak(enonce)
      }
    } catch {}
  }

  cancel(): void {
    if (!this.disponible) return
    try {
      window.speechSynthesis.cancel()
    } catch {}
  }
}
