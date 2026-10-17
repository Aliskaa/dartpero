import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpeechAnnouncer } from '@/infrastructure/device/SpeechAnnouncer'

/** Un énoncé qui garde ce qu'on lui a réglé, comme `SpeechSynthesisUtterance`. */
class FauxEnonce {
  lang = ''
  rate = 1
  voice: SpeechSynthesisVoice | null = null
  constructor(readonly text: string) {}
}

const voix = (name: string, lang: string) => ({ name, lang }) as SpeechSynthesisVoice

/**
 * Une vraie petite synthèse, pas un mock : elle garde l'ordre des appels
 * (`journal`) et une liste de voix que le test fait évoluer.
 */
const fausseSynthese = (voixInstallees: SpeechSynthesisVoice[] = []) => {
  const journal: string[] = []
  const enonces: FauxEnonce[] = []
  const ecouteurs: Array<() => void> = []
  const synthese = {
    voix: voixInstallees,
    cancel: () => {
      journal.push('cancel')
    },
    speak: (enonce: FauxEnonce) => {
      journal.push(`speak:${enonce.text}`)
      enonces.push(enonce)
    },
    getVoices: () => synthese.voix,
    addEventListener: (_type: string, ecouteur: () => void) => {
      ecouteurs.push(ecouteur)
    },
  }
  return { synthese, journal, enonces, ecouteurs }
}

const installer = (synthese: unknown) => {
  Object.defineProperty(window, 'speechSynthesis', { value: synthese, configurable: true })
  vi.stubGlobal('SpeechSynthesisUtterance', FauxEnonce)
}

describe('SpeechAnnouncer', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'speechSynthesis')
    vi.unstubAllGlobals()
  })

  it('coupe l’annonce précédente une seule fois, puis dit les segments dans l’ordre', () => {
    const { synthese, journal } = fausseSynthese([voix('Thomas', 'fr-FR')])
    installer(synthese)

    new SpeechAnnouncer().say([
      { texte: '60', langue: 'fr-FR' },
      { texte: 'Checkout', langue: 'en-US' },
      { texte: '. À toi, Julien', langue: 'fr-FR' },
    ])

    expect(journal).toEqual(['cancel', 'speak:60', 'speak:Checkout', 'speak:. À toi, Julien'])
  })

  it('règle la langue de chaque segment et garde le débit', () => {
    const { synthese, enonces } = fausseSynthese([voix('Thomas', 'fr-FR')])
    installer(synthese)

    new SpeechAnnouncer().say([
      { texte: 'Bust', langue: 'en-US' },
      { texte: '. À toi, Kevin', langue: 'fr-FR' },
    ])

    expect(enonces.map((e) => e.lang)).toEqual(['en-US', 'fr-FR'])
    expect(enonces.map((e) => e.rate)).toEqual([1.1, 1.1])
  })

  it('choisit la voix de la langue du segment quand elle est installée', () => {
    const francaise = voix('Thomas', 'fr-FR')
    const americaine = voix('Samantha', 'en-US')
    const { synthese, enonces } = fausseSynthese([francaise, americaine])
    installer(synthese)

    new SpeechAnnouncer().say([
      { texte: 'Checkout', langue: 'en-US' },
      { texte: '. À toi, Julien', langue: 'fr-FR' },
    ])

    expect(enonces[0]?.voice).toBe(americaine)
    expect(enonces[1]?.voice).toBe(francaise)
  })

  it('accepte une voix de la même langue par le préfixe (en-GB pour en-US) et les « _ » d’Android', () => {
    const britannique = voix('Daniel', 'en_GB')
    const { synthese, enonces } = fausseSynthese([voix('Thomas', 'fr-FR'), britannique])
    installer(synthese)

    new SpeechAnnouncer().say([{ texte: 'Bust', langue: 'en-US' }])

    expect(enonces[0]?.voice).toBe(britannique)
  })

  it('sans voix en-US, le segment se dit quand même avec la voix française', () => {
    const francaise = voix('Thomas', 'fr-FR')
    const { synthese, journal, enonces } = fausseSynthese([francaise])
    installer(synthese)

    new SpeechAnnouncer().say([{ texte: 'Checkout', langue: 'en-US' }])

    expect(journal).toContain('speak:Checkout')
    expect(enonces[0]?.voice).toBe(francaise)
    expect(enonces[0]?.lang).toBe('en-US')
  })

  it('sans aucune voix française, se replie sur la première voix installée', () => {
    const autre = voix('Anna', 'de-DE')
    const { synthese, enonces } = fausseSynthese([autre])
    installer(synthese)

    new SpeechAnnouncer().say([{ texte: 'Bust', langue: 'en-US' }])

    expect(enonces[0]?.voice).toBe(autre)
  })

  it('ignore les segments vides, sans couper les autres', () => {
    const { synthese, journal } = fausseSynthese([voix('Thomas', 'fr-FR')])
    installer(synthese)

    new SpeechAnnouncer().say([
      { texte: '', langue: 'fr-FR' },
      { texte: '  ', langue: 'fr-FR' },
      { texte: 'Bust', langue: 'en-US' },
    ])

    expect(journal).toEqual(['cancel', 'speak:Bust'])
  })

  it('une annonce entièrement vide ne dit rien et ne coupe pas l’annonce en cours', () => {
    const { synthese, journal } = fausseSynthese([voix('Thomas', 'fr-FR')])
    installer(synthese)
    const annonceur = new SpeechAnnouncer()

    annonceur.say([])
    annonceur.say([{ texte: ' ', langue: 'fr-FR' }])

    expect(journal).toEqual([])
  })

  it('une nouvelle annonce coupe l’ancienne', () => {
    const { synthese, journal } = fausseSynthese([voix('Thomas', 'fr-FR')])
    installer(synthese)
    const annonceur = new SpeechAnnouncer()

    annonceur.say([{ texte: '100', langue: 'fr-FR' }])
    annonceur.say([{ texte: 'Bust', langue: 'en-US' }])

    expect(journal).toEqual(['cancel', 'speak:100', 'cancel', 'speak:Bust'])
  })

  it('liste de voix vide au premier appel : on dit quand même, sans figer « aucune voix »', () => {
    const { synthese, enonces, ecouteurs } = fausseSynthese([])
    installer(synthese)
    const annonceur = new SpeechAnnouncer()

    annonceur.say([{ texte: 'Checkout', langue: 'en-US' }])
    expect(enonces[0]?.voice).toBeNull()
    expect(ecouteurs).toHaveLength(1)

    // Chrome peuple la liste après coup : la voix en-US est trouvée au prochain appel.
    const americaine = voix('Samantha', 'en-US')
    synthese.voix = [voix('Thomas', 'fr-FR'), americaine]
    annonceur.say([{ texte: 'Checkout', langue: 'en-US' }])

    expect(enonces[1]?.voice).toBe(americaine)
    // L'écoute de « voiceschanged » n'est installée qu'une fois.
    expect(ecouteurs).toHaveLength(1)
  })

  it('« voiceschanged » vide le cache : une voix installée ensuite est reprise', () => {
    const francaise = voix('Thomas', 'fr-FR')
    const { synthese, enonces, ecouteurs } = fausseSynthese([])
    installer(synthese)
    const annonceur = new SpeechAnnouncer()

    // L'écouteur n'existe qu'après un premier appel sans voix.
    annonceur.say([{ texte: '1', langue: 'fr-FR' }])
    synthese.voix = [francaise]
    annonceur.say([{ texte: '2', langue: 'fr-FR' }])
    expect(enonces[1]?.voice).toBe(francaise)

    // Une voix en-US arrive : l'événement oublie le choix mémorisé.
    const americaine = voix('Samantha', 'en-US')
    synthese.voix = [francaise, americaine]
    for (const ecouteur of ecouteurs) ecouteur()
    annonceur.say([{ texte: 'Bust', langue: 'en-US' }])

    expect(enonces[2]?.voice).toBe(americaine)
  })

  it('se tait sans planter quand l’API manque', () => {
    expect(() => new SpeechAnnouncer().say([{ texte: 'Bust', langue: 'en-US' }])).not.toThrow()
    expect(() => new SpeechAnnouncer().cancel()).not.toThrow()
  })

  it('se tait sans planter quand la synthèse lève une erreur', () => {
    const { synthese } = fausseSynthese([voix('Thomas', 'fr-FR')])
    synthese.speak = () => {
      throw new Error('refusé')
    }
    installer(synthese)

    expect(() => new SpeechAnnouncer().say([{ texte: 'Bust', langue: 'en-US' }])).not.toThrow()
  })
})
