import { describe, expect, it } from 'vitest'
import { base45Decode, base45Encode, lireJeton } from '@/infrastructure/peer/jetonDeJumelage'
import {
  type CanalPair,
  type ConnexionPair,
  type FabriqueConnexion,
  WebRtcPeerLinks,
} from '@/infrastructure/peer/WebRtcPeerLinks'

const FP = Array.from({ length: 32 }, (_, i) => (i + 16).toString(16).toUpperCase()).join(':')

const sdp = (candidats: readonly string[], setup: string) =>
  [
    'v=0',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    ...candidats.map(
      (adresse, i) =>
        `a=candidate:${i} 1 udp 2113937151 ${adresse} ${50000 + i} typ host generation 0`,
    ),
    `a=ice-ufrag:${setup === 'actpass' ? 'AbCd' : 'WxYz'}`,
    'a=ice-pwd:abcdefghijklmnopqrstuvwx',
    `a=fingerprint:sha-256 ${FP}`,
    `a=setup:${setup}`,
    'a=mid:0',
    'a=sctp-port:5000',
    '',
  ].join('\r\n')

class FauxCanal extends EventTarget implements CanalPair {
  readyState = 'connecting'
  readonly envoyes: string[] = []
  fermetures = 0

  send(texte: string): void {
    if (this.readyState !== 'open') throw new Error('canal fermé')
    this.envoyes.push(texte)
  }

  close(): void {
    this.fermetures += 1
    this.readyState = 'closed'
  }

  regler(etat: string): void {
    this.readyState = etat
    this.dispatchEvent(new Event(etat === 'open' ? 'open' : 'close'))
  }

  recevoir(trame: string): void {
    this.dispatchEvent(new MessageEvent('message', { data: trame }))
  }
}

class FausseConnexion extends EventTarget implements ConnexionPair {
  localDescription: { sdp: string } | null = null
  iceGatheringState = 'new'
  connectionState = 'new'
  readonly distantes: { type: string; sdp: string }[] = []
  canal: FauxCanal | null = null
  fermetures = 0

  constructor(
    private readonly candidats: readonly string[],
    private readonly collecteFinie = true,
  ) {
    super()
  }

  createDataChannel(): CanalPair {
    this.canal = new FauxCanal()
    return this.canal
  }

  async createOffer() {
    return { type: 'offer', sdp: sdp(this.candidats, 'actpass') }
  }

  async createAnswer() {
    return { type: 'answer', sdp: sdp(this.candidats, 'active') }
  }

  async setLocalDescription(description: { readonly sdp?: string }): Promise<void> {
    this.localDescription = { sdp: description.sdp ?? '' }
    if (!this.collecteFinie) return
    queueMicrotask(() => {
      this.iceGatheringState = 'complete'
      this.dispatchEvent(new Event('icegatheringstatechange'))
    })
  }

  async setRemoteDescription(description: { type: 'offer' | 'answer'; sdp: string }) {
    this.distantes.push(description)
  }

  close(): void {
    this.fermetures += 1
  }

  connexion(etat: string): void {
    this.connectionState = etat
    this.dispatchEvent(new Event('connectionstatechange'))
  }

  /** Côté miroir : le canal arrive de l'autre téléphone. */
  canalRecu(): FauxCanal {
    const canal = new FauxCanal()
    this.canal = canal
    this.dispatchEvent(Object.assign(new Event('datachannel'), { channel: canal }))
    return canal
  }
}

const banc = (candidats: readonly string[] = ['192.168.1.20'], collecteFinie = true) => {
  const connexions: FausseConnexion[] = []
  const configurations: unknown[] = []
  const fabrique: FabriqueConnexion = (configuration) => {
    configurations.push(configuration)
    const connexion = new FausseConnexion(candidats, collecteFinie)
    connexions.push(connexion)
    return connexion
  }
  return { liens: new WebRtcPeerLinks(fabrique, 20), connexions, configurations }
}

const offreValide = async (candidats: readonly string[] = ['10.0.0.9']) => {
  const { liens } = banc(candidats)
  const resultat = await liens.offer()
  if (!resultat.ok) throw new Error(resultat.reason)
  return resultat.offer.token
}

describe('Adapter WebRTC du lien', () => {
  it('rien n’est créé à la construction ; sans le navigateur, tout est indisponible', async () => {
    const { connexions } = banc()
    expect(connexions).toHaveLength(0)

    const sans = new WebRtcPeerLinks(undefined)
    expect(await sans.offer()).toEqual({ ok: false, reason: 'unavailable' })
    expect(await sans.answer('x')).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('offre : aucun serveur ICE, un canal ordonné, un jeton d’offre lisible', async () => {
    const { liens, connexions, configurations } = banc(['192.168.1.20', '8.8.8.8'])
    const resultat = await liens.offer()

    expect(configurations).toEqual([{ iceServers: [] }])
    expect(connexions[0]?.canal).not.toBeNull()
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    const lu = lireJeton(resultat.offer.token)
    expect(lu.ok && lu.jeton.role).toBe('offre')
    // L'adresse publique ne passe pas le filtre.
    expect(lu.ok && lu.jeton.candidats.map((c) => c.adresse)).toEqual(['192.168.1.20'])
    expect(resultat.offer.link.state()).toBe('connecting')
  })

  it('réponse : refuse une réponse en guise d’offre, une autre version, un texte illisible', async () => {
    const { liens } = banc()
    const offre = await offreValide()
    const reponse = await liens.answer(offre)
    if (!reponse.ok) throw new Error(reponse.reason)

    expect(await liens.answer(reponse.token)).toEqual({ ok: false, reason: 'unreadable' })
    expect(await liens.answer('pas un jeton')).toEqual({ ok: false, reason: 'unreadable' })
    const v2 = base45Decode(offre)
    v2[1] = 2
    expect(await liens.answer(base45Encode(v2))).toEqual({ ok: false, reason: 'incompatible' })
  })

  it('accepter la réponse pose la description distante reconstruite', async () => {
    const saisie = banc(['192.168.1.20'])
    const miroir = banc(['192.168.1.30'])
    const offre = await saisie.liens.offer()
    if (!offre.ok) throw new Error(offre.reason)
    const reponse = await miroir.liens.answer(offre.offer.token)
    if (!reponse.ok) throw new Error(reponse.reason)

    expect(miroir.connexions[0]?.distantes[0]?.type).toBe('offer')
    expect(miroir.connexions[0]?.distantes[0]?.sdp).toContain('192.168.1.20 50000 typ host')
    expect(await offre.offer.accept(offre.offer.token)).toBe('unreadable')
    expect(await offre.offer.accept(reponse.token)).toBeNull()
    expect(saisie.connexions[0]?.distantes[0]?.sdp).toContain('192.168.1.30 50000 typ host')
  })

  it('aucun candidat local d’un côté ni de l’autre : échec typé', async () => {
    const offre = await offreValide([])
    const { liens, connexions } = banc([])
    expect(await liens.answer(offre)).toEqual({ ok: false, reason: 'no-local-candidate' })
    expect(connexions[0]?.fermetures).toBe(1)
    // Il suffit qu'un côté soit joignable.
    expect((await banc(['10.0.0.3']).liens.answer(offre)).ok).toBe(true)
  })

  it('collecte ICE sans fin : on part avec ce qu’on a après le délai', async () => {
    const { liens } = banc(['192.168.1.20'], false)
    const resultat = await liens.offer()
    expect(resultat.ok).toBe(true)
  })

  it('états du lien : ouvert, perdu, rétabli sans nouveau QR, fermé', async () => {
    const { liens, connexions } = banc()
    const reponse = await liens.answer(await offreValide())
    if (!reponse.ok) throw new Error(reponse.reason)
    const lien = reponse.link
    const connexion = connexions[0] as FausseConnexion
    const changements: string[] = []
    lien.subscribe(() => changements.push(lien.state()))

    // Avant la première ouverture, un `disconnected` n'est qu'un passage.
    connexion.connexion('disconnected')
    expect(lien.state()).toBe('connecting')
    const canal = connexion.canalRecu()
    connexion.connexion('connected')
    canal.regler('open')
    expect(lien.state()).toBe('open')
    connexion.connexion('disconnected')
    expect(lien.state()).toBe('lost')
    connexion.connexion('connected')
    expect(lien.state()).toBe('open')
    lien.close()
    expect(lien.state()).toBe('closed')
    expect(connexion.fermetures).toBe(1)
    expect(canal.fermetures).toBe(1)
    expect(changements).toEqual(['open', 'lost', 'open', 'closed'])
  })

  it('avant ouverture, un échec ICE rend le lien perdu', async () => {
    const { liens, connexions } = banc()
    const reponse = await liens.answer(await offreValide())
    if (!reponse.ok) throw new Error(reponse.reason)
    connexions[0]?.connexion('failed')
    expect(reponse.link.state()).toBe('lost')
  })

  it('messages : découpés à l’envoi, réassemblés à la réception, rien avant l’ouverture', async () => {
    const { liens, connexions } = banc()
    const reponse = await liens.answer(await offreValide())
    if (!reponse.ok) throw new Error(reponse.reason)
    const lien = reponse.link
    const connexion = connexions[0] as FausseConnexion
    const canal = connexion.canalRecu()
    const recus: string[] = []
    lien.onMessage((texte) => recus.push(texte))

    lien.send('trop tôt')
    expect(canal.envoyes).toEqual([])

    connexion.connexion('connected')
    canal.regler('open')
    const long = `Léa 🎯 ${'x'.repeat(12_000)}`
    lien.send(long)
    expect(canal.envoyes.length).toBe(3)

    for (const trame of canal.envoyes) canal.recevoir(trame)
    expect(recus).toEqual([long])

    lien.close()
    canal.recevoir('Faprès fermeture')
    expect(recus).toEqual([long])
  })
})
