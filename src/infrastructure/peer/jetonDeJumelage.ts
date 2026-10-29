// Jeton de jumelage v1 : le strict nécessaire d'une description de session, en base45 (RFC 9285).
// Module pur, sans API du navigateur : seul `WebRtcPeerLinks` le lit et l'écrit.
export const FORMAT_JETON = 0x01
export const VERSION_JETON = 1
/** Au-delà, le texte scanné n'est même pas analysé. */
export const JETON_MAX = 400
const MAX_CANDIDATS = 4
const SETUPS = ['actpass', 'active', 'passive'] as const
const TYPE_IPV4 = 1
const TYPE_IPV6 = 2
const TYPE_MDNS_UUID = 3
const TYPE_NOM_LOCAL = 4

export type Role = 'offre' | 'reponse'
export type Setup = (typeof SETUPS)[number]
export type Famille = 'IPv4' | 'IPv6' | 'mDNS'

export type Candidat = {
  readonly adresse: string
  readonly port: number
  readonly famille: Famille
}

export type Jeton = {
  readonly role: Role
  readonly setup: Setup
  readonly ufrag: string
  readonly pwd: string
  /** Empreinte sha-256, octets en hexadécimal majuscule séparés par `:`. */
  readonly empreinte: string
  readonly candidats: readonly Candidat[]
}

export type JetonEncode = {
  readonly jeton: string
  readonly octets: number
  readonly gardes: readonly Candidat[]
  readonly ecartes: readonly { readonly adresse: string; readonly raison: string }[]
  /** Écarts du SDP au gabarit reconstruit à l'arrivée (`mid`, `sctp-port`, ligne `m=`). */
  readonly alertes: readonly string[]
}

export type LectureJeton =
  | { readonly ok: true; readonly jeton: Jeton }
  | { readonly ok: false; readonly raison: 'illisible' | 'incompatible' }

class JetonInvalide extends Error {
  constructor(
    message: string,
    readonly raison: 'illisible' | 'incompatible' = 'illisible',
  ) {
    super(message)
  }
}

const B45 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'

const caractere = (index: number): string => B45.charAt(index)

export const base45Encode = (octets: Uint8Array): string => {
  let s = ''
  for (let i = 0; i + 1 < octets.length; i += 2) {
    const n = (octets[i] ?? 0) * 256 + (octets[i + 1] ?? 0)
    s += caractere(n % 45) + caractere(Math.floor(n / 45) % 45) + caractere(Math.floor(n / 2025))
  }
  if (octets.length % 2 === 1) {
    const n = octets[octets.length - 1] ?? 0
    s += caractere(n % 45) + caractere(Math.floor(n / 45))
  }
  return s
}

export const base45Decode = (texte: string): Uint8Array => {
  if (texte.length % 3 === 1) throw new JetonInvalide('base45 : longueur invalide')
  const v: number[] = []
  for (const c of texte) {
    const i = B45.indexOf(c)
    if (i < 0) throw new JetonInvalide('base45 : caractère hors alphabet')
    v.push(i)
  }
  const sortie: number[] = []
  for (let i = 0; i < v.length; i += 3) {
    const a = v[i] ?? 0
    const b = v[i + 1] ?? 0
    if (i + 2 < v.length) {
      const n = a + b * 45 + (v[i + 2] ?? 0) * 2025
      if (n > 0xffff) throw new JetonInvalide('base45 : triplet hors plage')
      sortie.push(n >> 8, n & 0xff)
    } else {
      const n = a + b * 45
      if (n > 0xff) throw new JetonInvalide('base45 : paire hors plage')
      sortie.push(n)
    }
  }
  return Uint8Array.from(sortie)
}

const ipv4Octets = (a: string): number[] | null => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(a)
  if (!m) return null
  const o = m.slice(1).map(Number)
  return o.every((x) => x <= 255) ? o : null
}

const ipv6Octets = (a: string): number[] | null => {
  if (a.includes('%') || a.includes('.')) return null
  const parts = a.split('::')
  if (parts.length > 2) return null
  const tete = parts[0] ? parts[0].split(':') : []
  const queue = parts.length === 2 && parts[1] ? parts[1].split(':') : []
  const manque = 8 - tete.length - queue.length
  if (parts.length === 1 ? manque !== 0 : manque < 1) return null
  const groupes = [...tete, ...Array<string>(parts.length === 2 ? manque : 0).fill('0'), ...queue]
  const sortie: number[] = []
  for (const g of groupes) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null
    const n = Number.parseInt(g, 16)
    sortie.push(n >> 8, n & 0xff)
  }
  return sortie
}

const ipv6Texte = (o: Uint8Array): string => {
  const g: number[] = []
  for (let i = 0; i < 16; i += 2) g.push(((o[i] ?? 0) << 8) | (o[i + 1] ?? 0))
  let debut = -1
  let long = 0
  for (let i = 0; i < 8; ) {
    if (g[i] !== 0) {
      i++
      continue
    }
    let j = i
    while (j < 8 && g[j] === 0) j++
    if (j - i > long && j - i >= 2) {
      debut = i
      long = j - i
    }
    i = j
  }
  const hex = g.map((x) => x.toString(16))
  if (debut < 0) return hex.join(':')
  return `${hex.slice(0, debut).join(':')}::${hex.slice(debut + long).join(':')}`
}

const UUID_LOCAL = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\.local$/
const NOM_LOCAL = /^[A-Za-z0-9-]{1,63}(\.[A-Za-z0-9-]{1,63})*\.local$/

type Classement =
  | { readonly type: number; readonly octets: readonly number[]; readonly famille: Famille }
  | { readonly rejet: string }

/** Réseau local seulement : IPv4 privées (RFC 1918), IPv6 ULA ou de lien, noms `.local`. */
export const classer = (adresse: string): Classement => {
  const v4 = ipv4Octets(adresse)
  if (v4) {
    const [a, b = 0] = v4
    const prive = a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
    return prive ? { type: TYPE_IPV4, octets: v4, famille: 'IPv4' } : { rejet: 'IPv4 non privée' }
  }
  const v6 = ipv6Octets(adresse)
  if (v6) {
    const [a = 0, b = 0] = v6
    const ula = (a & 0xfe) === 0xfc
    const lien = a === 0xfe && (b & 0xc0) === 0x80
    return ula || lien
      ? { type: TYPE_IPV6, octets: v6, famille: 'IPv6' }
      : { rejet: 'IPv6 ni ULA ni lien local' }
  }
  const u = UUID_LOCAL.exec(adresse)
  if (u) {
    const hex = u.slice(1).join('')
    const octets: number[] = []
    for (let i = 0; i < 32; i += 2) octets.push(Number.parseInt(hex.slice(i, i + 2), 16))
    return { type: TYPE_MDNS_UUID, octets, famille: 'mDNS' }
  }
  if (NOM_LOCAL.test(adresse) && adresse.length <= 255) {
    return {
      type: TYPE_NOM_LOCAL,
      octets: [...adresse].map((c) => c.charCodeAt(0)),
      famille: 'mDNS',
    }
  }
  return { rejet: 'adresse non reconnue' }
}

type CandidatSdp = {
  readonly composant: string | undefined
  readonly transport: string
  readonly adresse: string
  readonly port: number
  readonly type: string
}

const analyserSdp = (sdp: string) => {
  const lignes = sdp.split(/\r?\n/)
  const val = (p: string) =>
    lignes
      .find((l) => l.startsWith(p))
      ?.slice(p.length)
      .trim()
  const candidats = lignes
    .filter((l) => l.startsWith('a=candidate:'))
    .map((l): CandidatSdp => {
      const c = l.slice('a=candidate:'.length).split(/\s+/)
      const typ = c.indexOf('typ')
      return {
        composant: c[1],
        transport: (c[2] ?? '').toLowerCase(),
        adresse: c[4] ?? '',
        port: Number(c[5]),
        type: typ >= 0 ? (c[typ + 1] ?? '?') : '?',
      }
    })
  return {
    ufrag: val('a=ice-ufrag:'),
    pwd: val('a=ice-pwd:'),
    empreinte: val('a=fingerprint:'),
    setup: val('a=setup:'),
    mid: val('a=mid:'),
    sctpPort: val('a=sctp-port:'),
    mLigne: lignes.find((l) => l.startsWith('m=')),
    candidats,
  }
}

const raisonEcart = (c: CandidatSdp): string | null => {
  if (c.composant !== '1') return 'composant ≠ 1'
  if (c.transport !== 'udp') return `transport ${c.transport}`
  if (c.type !== 'host') return `type ${c.type}`
  return null
}

/** Lève si le SDP n'a pas de quoi faire un jeton. L'ordre des candidats du navigateur est gardé. */
export const encoderJeton = (sdp: string, role: Role): JetonEncode => {
  const s = analyserSdp(sdp)
  const alertes: string[] = []
  if (!s.ufrag || !s.pwd) throw new JetonInvalide('SDP sans ice-ufrag / ice-pwd')
  if (s.ufrag.length > 255 || s.pwd.length > 255) throw new JetonInvalide('ufrag/pwd trop longs')
  if (!s.empreinte?.toLowerCase().startsWith('sha-256 ')) {
    throw new JetonInvalide('empreinte non sha-256')
  }
  const fp = s.empreinte
    .slice(8)
    .trim()
    .split(':')
    .map((h) => (/^[0-9a-fA-F]{2}$/.test(h) ? Number.parseInt(h, 16) : Number.NaN))
  if (fp.length !== 32 || fp.some((n) => Number.isNaN(n))) {
    throw new JetonInvalide('empreinte sha-256 illisible')
  }
  const setup = SETUPS.indexOf(s.setup as Setup)
  if (setup < 0) throw new JetonInvalide('setup inattendu')
  if (s.mid !== '0') alertes.push(`mid = « ${s.mid} »`)
  if (s.sctpPort !== '5000') alertes.push(`sctp-port = ${s.sctpPort}`)
  if (!/^m=application \d+ UDP\/DTLS\/SCTP webrtc-datachannel$/.test(s.mLigne ?? '')) {
    alertes.push(`ligne m= inattendue : ${s.mLigne}`)
  }

  const gardes: { type: number; octets: readonly number[]; candidat: Candidat }[] = []
  const ecartes: { adresse: string; raison: string }[] = []
  const vus = new Set<string>()
  for (const c of s.candidats) {
    const raison = raisonEcart(c)
    if (raison) {
      ecartes.push({ adresse: c.adresse, raison })
      continue
    }
    const k = classer(c.adresse)
    if ('rejet' in k) {
      ecartes.push({ adresse: c.adresse, raison: k.rejet })
      continue
    }
    const cle = `${c.adresse}|${c.port}`
    if (vus.has(cle)) continue
    vus.add(cle)
    if (!(Number.isInteger(c.port) && c.port > 0 && c.port < 65536)) {
      ecartes.push({ adresse: c.adresse, raison: 'port invalide' })
      continue
    }
    if (gardes.length >= MAX_CANDIDATS) {
      ecartes.push({ adresse: c.adresse, raison: `au-delà de ${MAX_CANDIDATS}` })
      continue
    }
    gardes.push({
      type: k.type,
      octets: k.octets,
      candidat: { adresse: c.adresse, port: c.port, famille: k.famille },
    })
  }

  const octets: number[] = [
    FORMAT_JETON,
    VERSION_JETON,
    (role === 'reponse' ? 1 : 0) | (setup << 1) | (gardes.length << 4),
  ]
  for (const t of [s.ufrag, s.pwd]) {
    octets.push(t.length, ...[...t].map((ch) => ch.charCodeAt(0) & 0xff))
  }
  octets.push(...fp)
  for (const g of gardes) {
    octets.push(g.type)
    if (g.type === TYPE_NOM_LOCAL) octets.push(g.octets.length)
    octets.push(...g.octets, g.candidat.port >> 8, g.candidat.port & 0xff)
  }
  const tableau = Uint8Array.from(octets)
  return {
    jeton: base45Encode(tableau),
    octets: tableau.length,
    gardes: gardes.map((g) => g.candidat),
    ecartes,
    alertes,
  }
}

const decoder = (texte: string): Jeton => {
  if (texte.length === 0 || texte.length > JETON_MAX) {
    throw new JetonInvalide('jeton vide ou trop long')
  }
  const b = base45Decode(texte)
  let i = 0
  const lire = (n: number): Uint8Array => {
    if (i + n > b.length) throw new JetonInvalide('jeton tronqué')
    const r = b.slice(i, i + n)
    i += n
    return r
  }
  const octet = (): number => lire(1)[0] ?? 0
  const format = octet()
  if (format !== FORMAT_JETON) throw new JetonInvalide('format inconnu')
  if (octet() !== VERSION_JETON) throw new JetonInvalide('version incompatible', 'incompatible')
  const drapeaux = octet()
  const role: Role = drapeaux & 1 ? 'reponse' : 'offre'
  const setup = SETUPS[(drapeaux >> 1) & 3]
  if (!setup) throw new JetonInvalide('setup inconnu')
  if (drapeaux & 0x08) throw new JetonInvalide('bit réservé non nul')
  const n = drapeaux >> 4
  if (n > MAX_CANDIDATS) throw new JetonInvalide('trop de candidats')
  const chaine = (min: number): string => {
    const l = octet()
    const t = String.fromCharCode(...lire(l))
    if (l < min || !/^[A-Za-z0-9+/]+$/.test(t)) throw new JetonInvalide('ufrag/pwd invalide')
    return t
  }
  const ufrag = chaine(4)
  const pwd = chaine(22)
  const empreinte = [...lire(32)]
    .map((x) => x.toString(16).toUpperCase().padStart(2, '0'))
    .join(':')
  const candidats: Candidat[] = []
  for (let k = 0; k < n; k++) {
    const type = octet()
    let adresse: string
    if (type === TYPE_IPV4) adresse = [...lire(4)].join('.')
    else if (type === TYPE_IPV6) adresse = ipv6Texte(lire(16))
    else if (type === TYPE_MDNS_UUID) {
      const h = [...lire(16)].map((x) => x.toString(16).padStart(2, '0')).join('')
      adresse = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}.local`
    } else if (type === TYPE_NOM_LOCAL) {
      adresse = String.fromCharCode(...lire(octet()))
    } else throw new JetonInvalide('type de candidat inconnu')
    const [p1 = 0, p2 = 0] = lire(2)
    const port = (p1 << 8) | p2
    if (port === 0) throw new JetonInvalide('port nul')
    const k2 = classer(adresse)
    if ('rejet' in k2) throw new JetonInvalide(`candidat non local : ${k2.rejet}`)
    candidats.push({ adresse, port, famille: k2.famille })
  }
  if (i !== b.length) throw new JetonInvalide('octets en trop')
  return { role, setup, ufrag, pwd, empreinte, candidats }
}

/** Ne lève jamais : `incompatible` pour une autre version, `illisible` pour tout le reste. */
export const lireJeton = (texte: unknown): LectureJeton => {
  if (typeof texte !== 'string') return { ok: false, raison: 'illisible' }
  try {
    return { ok: true, jeton: decoder(texte) }
  } catch (erreur) {
    return {
      ok: false,
      raison: erreur instanceof JetonInvalide ? erreur.raison : 'illisible',
    }
  }
}

/** SDP reconstruit par gabarit : `mid`, `sctp-port` et `max-message-size` sont fixés. */
export const sdpDepuisJeton = (j: Jeton): string => {
  const l = [
    'v=0',
    'o=- 1 2 IN IP4 127.0.0.1',
    's=-',
    't=0 0',
    'a=group:BUNDLE 0',
    'a=msid-semantic: WMS',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 0.0.0.0',
  ]
  j.candidats.forEach((c, k) => {
    const priorite = (126 << 24) + ((65535 - k) << 8) + 255
    l.push(
      `a=candidate:${k + 1} 1 udp ${priorite >>> 0} ${c.adresse} ${c.port} typ host generation 0`,
    )
  })
  l.push(
    `a=ice-ufrag:${j.ufrag}`,
    `a=ice-pwd:${j.pwd}`,
    `a=fingerprint:sha-256 ${j.empreinte}`,
    `a=setup:${j.setup}`,
    'a=mid:0',
    'a=sctp-port:5000',
    'a=max-message-size:262144',
  )
  return `${l.join('\r\n')}\r\n`
}
