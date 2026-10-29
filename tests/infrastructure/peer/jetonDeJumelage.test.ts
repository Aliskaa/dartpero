import { Alphanumeric, Encoder } from '@nuintun/qrcode'
import { describe, expect, it } from 'vitest'
import {
  base45Decode,
  base45Encode,
  classer,
  encoderJeton,
  JETON_MAX,
  lireJeton,
  sdpDepuisJeton,
} from '@/infrastructure/peer/jetonDeJumelage'

// ⚠️ SDP synthétiques, à la forme de ceux du spike (Chrome Android, Safari iOS) : les SDP réels capturés n'ont pas été versés au dépôt.
const FP = Array.from({ length: 32 }, (_, i) =>
  ((i * 37 + 11) & 0xff).toString(16).toUpperCase().padStart(2, '0'),
).join(':')

const sdp = (candidats: string[], setup = 'actpass') =>
  [
    'v=0',
    'o=- 4611731400430051336 2 IN IP4 127.0.0.1',
    's=-',
    't=0 0',
    'a=group:BUNDLE 0',
    'a=extmap-allow-mixed',
    'a=msid-semantic: WMS',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 0.0.0.0',
    ...candidats,
    'a=ice-ufrag:Xy3+',
    'a=ice-pwd:abcdefghijklmnopqrstuv/+12',
    'a=ice-options:trickle',
    `a=fingerprint:sha-256 ${FP}`,
    `a=setup:${setup}`,
    'a=mid:0',
    'a=sctp-port:5000',
    'a=max-message-size:262144',
    '',
  ].join('\r\n')

const C = (adresse: string, port: number, typ = 'host', transport = 'udp', cout = 999) =>
  `a=candidate:123 1 ${transport} 2113937151 ${adresse} ${port} typ ${typ} generation 0 network-cost ${cout}`

const lire = (texte: string) => {
  const lu = lireJeton(texte)
  if (!lu.ok) throw new Error(`jeton refusé : ${lu.raison}`)
  return lu.jeton
}

describe('Jeton de jumelage v1', () => {
  it('base45 : vecteurs de la RFC 9285', () => {
    const t = new TextEncoder()
    expect(base45Encode(t.encode('AB'))).toBe('BB8')
    expect(base45Encode(t.encode('Hello!!'))).toBe('%69 VD92EX0')
    expect(base45Encode(t.encode('ietf!'))).toBe('QED8WEX0')
    expect(new TextDecoder().decode(base45Decode('QED8WEX0'))).toBe('ietf!')
    expect(() => base45Decode('GGW')).toThrow(/hors plage/)
  })

  it('filtre « réseau local » : privées, ULA, lien et .local passent ; le reste est écarté', () => {
    const locales = [
      '10.0.0.1',
      '172.16.5.4',
      '172.31.255.1',
      '192.168.1.20',
      'fd12::1',
      'fe80::1:2',
      '0a1b2c3d-1111-2222-3333-444455556666.local',
      'iphone.local',
    ]
    for (const a of locales) expect('rejet' in classer(a), a).toBe(false)
    const publiques = [
      '8.8.8.8',
      '172.32.0.1',
      '100.64.0.1',
      '2a01:e0a::1',
      'example.com',
      '169.254.1.1',
    ]
    for (const a of publiques) expect('rejet' in classer(a), a).toBe(true)
  })

  it('aller-retour d’une offre mDNS ×2', () => {
    const e = encoderJeton(
      sdp([
        C('0a1b2c3d-1111-2222-3333-444455556666.local', 54321),
        C('9f8e7d6c-aaaa-bbbb-cccc-ddddeeeeffff.local', 54322),
      ]),
      'offre',
    )
    const j = lire(e.jeton)
    expect(j).toMatchObject({ role: 'offre', setup: 'actpass', ufrag: 'Xy3+', empreinte: FP })
    expect(j.pwd).toBe('abcdefghijklmnopqrstuv/+12')
    expect(j.candidats.map((c) => c.adresse)).toEqual([
      '0a1b2c3d-1111-2222-3333-444455556666.local',
      '9f8e7d6c-aaaa-bbbb-cccc-ddddeeeeffff.local',
    ])
    expect(e.alertes).toEqual([])
  })

  it('réponse : publiques, tcp, srflx écartés ; 4 candidats au plus, dans l’ordre du navigateur', () => {
    const e = encoderJeton(
      sdp(
        [
          C('192.168.1.20', 50000),
          // Interface mobile (network-cost 900) : gardée à sa place, comme mesuré sur Android.
          C('10.0.0.2', 50004, 'host', 'udp', 900),
          C('2a01:e0a::1', 50002),
          C('192.168.1.20', 9, 'host', 'tcp'),
          C('81.2.3.4', 50003, 'srflx'),
          C('fe80::1c2b:3aff:fe4d:5e6f', 50001),
          C('fd00::2', 50005),
          C('172.20.10.2', 50006),
        ],
        'active',
      ),
      'reponse',
    )
    expect(e.gardes).toHaveLength(4)
    expect(e.ecartes.some((x) => x.raison.includes('au-delà'))).toBe(true)
    const j = lire(e.jeton)
    expect(j.role).toBe('reponse')
    expect(j.setup).toBe('active')
    expect(j.candidats.map((c) => `${c.adresse}:${c.port}`)).toEqual([
      '192.168.1.20:50000',
      '10.0.0.2:50004',
      'fe80::1c2b:3aff:fe4d:5e6f:50001',
      'fd00::2:50005',
    ])
  })

  it('SDP reconstruit par gabarit, qui se ré-encode en un jeton identique', () => {
    const e = encoderJeton(sdp([C('192.168.1.20', 50000)]), 'offre')
    const r = sdpDepuisJeton(lire(e.jeton))
    expect(r).toMatch(/^v=0\r\n/)
    expect(r).toMatch(/m=application 9 UDP\/DTLS\/SCTP webrtc-datachannel/)
    expect(r).toMatch(/a=candidate:1 1 udp \d+ 192\.168\.1\.20 50000 typ host/)
    expect(r).toContain(`a=fingerprint:sha-256 ${FP}`)
    expect(encoderJeton(r, 'offre').jeton).toBe(e.jeton)
  })

  it('un SDP qui s’écarte du gabarit est signalé dans les alertes', () => {
    const e = encoderJeton(sdp([C('10.0.0.2', 5)]).replace('a=mid:0', 'a=mid:data'), 'offre')
    expect(e.alertes).toEqual(['mid = « data »'])
  })

  it('refus : sha-1 à l’encodage ; version, troncature, candidat public forgé, texte trop long', () => {
    expect(() => encoderJeton(sdp([]).replace('sha-256', 'sha-1'), 'offre')).toThrow(/sha-256/)
    const e = encoderJeton(sdp([C('10.0.0.2', 5)]), 'offre')
    const b = base45Decode(e.jeton)

    const v2 = Uint8Array.from(b)
    v2[1] = 2
    expect(lireJeton(base45Encode(v2))).toEqual({ ok: false, raison: 'incompatible' })
    expect(lireJeton(base45Encode(b.slice(0, b.length - 1)))).toEqual({
      ok: false,
      raison: 'illisible',
    })
    const publique = Uint8Array.from(b)
    publique.set([8, 8, 8, 8], b.length - 6)
    expect(lireJeton(base45Encode(publique))).toEqual({ ok: false, raison: 'illisible' })
    expect(lireJeton('A'.repeat(JETON_MAX + 1))).toEqual({ ok: false, raison: 'illisible' })
    expect(lireJeton('abc')).toEqual({ ok: false, raison: 'illisible' })
    expect(lireJeton(42)).toEqual({ ok: false, raison: 'illisible' })
  })

  it('quatre candidats tiennent dans un QR version ≤ 10 en correction M', () => {
    const e = encoderJeton(
      sdp([
        C('0a1b2c3d-1111-2222-3333-444455556666.local', 54321),
        C('192.168.1.20', 50000),
        C('fd00::2', 50005),
        C('10.0.0.2', 50004),
      ]),
      'offre',
    )
    const qr = new Encoder({ level: 'M' }).encode(new Alphanumeric(e.jeton))
    expect(qr.version).toBeLessThanOrEqual(10)
  })
})
