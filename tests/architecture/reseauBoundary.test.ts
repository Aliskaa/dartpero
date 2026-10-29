import { readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// ⚠️ Fil-piège : la politique `/confidentialite` affirme « pas de réseau » ; tout appel réseau doit faire relire ce texte public avant livraison.
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SRC = resolve(RACINE, 'src')

const INDEX_HTML = resolve(RACINE, 'index.html')

const SCRIPTS = /\.(?:[cm]?[jt]sx?)$/
const SCRIPTS_ET_STYLES = /\.(?:[cm]?[jt]sx?|css)$/

const fichiers = (dossier: string, extensions: RegExp = SCRIPTS): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name)
    if (entree.isDirectory()) return fichiers(chemin, extensions)
    return extensions.test(entree.name) ? [chemin] : []
  })

const enRacine = (chemin: string) => relative(RACINE, chemin).replaceAll('\\', '/')

/** Les capacités réseau du navigateur, et le SDK Firebase (Hosting n'en a pas besoin). */
const DETECTEURS: readonly { readonly nom: string; readonly motif: RegExp }[] = [
  { nom: 'fetch(', motif: /\bfetch\s*\(/ },
  { nom: 'XMLHttpRequest', motif: /\bXMLHttpRequest\b/ },
  { nom: 'WebSocket', motif: /\bWebSocket\b/ },
  { nom: 'EventSource', motif: /\bEventSource\b/ },
  { nom: 'sendBeacon', motif: /\bsendBeacon\b/ },
  {
    nom: 'import firebase',
    motif: /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]@?firebase(?:\/[^'"]*)?['"]/,
  },
]

const detecter = (source: string): string[] =>
  DETECTEURS.filter(({ motif }) => motif.test(source)).map(({ nom }) => nom)

const ESPACES_DE_NOMS: readonly string[] = [
  'http://www.w3.org/2000/svg',
  'http://www.w3.org/1999/xlink',
]

const detecterAdresses = (source: string): string[] =>
  [...source.matchAll(/https?:\/\/[^\s'"`()<>]*/gi)]
    .filter(([adresse]) => !ESPACES_DE_NOMS.includes(adresse))
    .map(([adresse]) => adresse)

/** Lien direct et caméra : chaque famille n'a droit qu'à son adapter, nommé ici, et à lui seul. */
const FAMILLES: readonly {
  readonly nom: string
  readonly permis: readonly string[]
  readonly detecteurs: readonly { readonly nom: string; readonly motif: RegExp }[]
  /** Ce que le fichier permis doit contenir : la preuve qu'il est bien l'adapter. */
  readonly attendus: readonly string[]
}[] = [
  {
    nom: 'lien WebRTC',
    permis: ['src/infrastructure/peer/WebRtcPeerLinks.ts'],
    detecteurs: [
      { nom: 'RTCPeerConnection', motif: /\w*RTCPeerConnection\b/ },
      { nom: 'RTCDataChannel', motif: /\bRTCDataChannel\b/ },
      { nom: 'createDataChannel', motif: /\bcreateDataChannel\b/ },
      { nom: 'iceServers', motif: /\biceServers\b/ },
    ],
    attendus: ['RTCPeerConnection', 'createDataChannel', 'iceServers'],
  },
  {
    nom: 'caméra',
    permis: ['src/infrastructure/device/CameraQrScanner.ts'],
    detecteurs: [
      { nom: 'getUserMedia', motif: /getUserMedia/i },
      { nom: 'mediaDevices', motif: /\bmediaDevices\b/ },
      { nom: 'getDisplayMedia', motif: /getDisplayMedia/i },
    ],
    attendus: ['getUserMedia', 'mediaDevices'],
  },
  {
    nom: 'serveur STUN / TURN',
    permis: [],
    detecteurs: [{ nom: 'stun: / turn:', motif: /\b(?:stuns?|turns?):[^\s'"`]/i }],
    attendus: [],
  },
]

const detecterFamille = (famille: (typeof FAMILLES)[number], source: string): string[] =>
  famille.detecteurs.filter(({ motif }) => motif.test(source)).map(({ nom }) => nom)

const famille = (nom: string) => {
  const trouvee = FAMILLES.find((f) => f.nom === nom)
  if (!trouvee) throw new Error(nom)
  return trouvee
}

const MESSAGE_POLITIQUE =
  'la politique publiée à /confidentialite (src/ui/labels.ts, SECTIONS_CONFIDENTIALITE) ' +
  'affirme que rien n’est envoyé. Mettre le texte et sa date à jour DANS LE MÊME LOT, ' +
  'puis adapter ce garde.'

describe('Frontière réseau (la politique de confidentialité le promet)', () => {
  it('le détecteur reconnaît chaque capacité réseau, et pas ses faux amis', () => {
    expect(detecter("const r = await fetch('/x')")).toEqual(['fetch('])
    expect(detecter('window.fetch (url)')).toEqual(['fetch('])
    expect(detecter('new XMLHttpRequest()')).toEqual(['XMLHttpRequest'])
    expect(detecter("new WebSocket('wss://x')")).toEqual(['WebSocket'])
    expect(detecter("new EventSource('/flux')")).toEqual(['EventSource'])
    expect(detecter('navigator.sendBeacon(url, corps)')).toEqual(['sendBeacon'])
    expect(detecter("import { getAuth } from 'firebase/auth'")).toEqual(['import firebase'])
    expect(detecter("import { initializeApp } from '@firebase/app'")).toEqual(['import firebase'])
    expect(detecter("await import('firebase/firestore')")).toEqual(['import firebase'])

    // Négatifs : TanStack Query et le nom de l'hébergeur dans un libellé.
    expect(detecter('void query.refetch()')).toEqual([])
    expect(detecter("const HEBERGEUR = 'Firebase Hosting (Google)'")).toEqual([])
  })

  it('aucun fichier de src/ n’ouvre de connexion réseau', () => {
    const tous = fichiers(SRC)
    // Garde-fou : un test vert à vide ne vérifie rien.
    expect(tous.length).toBeGreaterThanOrEqual(40)

    const fautes = tous.flatMap((fichier) =>
      detecter(readFileSync(fichier, 'utf8')).map((nom) => `${enRacine(fichier)} → ${nom}`),
    )

    expect(fautes, `Capacité réseau dans src/ : ${MESSAGE_POLITIQUE}`).toEqual([])
  })

  it('les détecteurs du lien direct et de la caméra reconnaissent leur API, et pas ses faux amis', () => {
    const webrtc = famille('lien WebRTC')
    expect(detecterFamille(webrtc, 'new RTCPeerConnection({})')).toEqual(['RTCPeerConnection'])
    expect(detecterFamille(webrtc, 'new webkitRTCPeerConnection()')).toEqual(['RTCPeerConnection'])
    expect(detecterFamille(webrtc, 'const c: RTCDataChannel = x')).toEqual(['RTCDataChannel'])
    expect(detecterFamille(webrtc, "pc.createDataChannel('x')")).toEqual(['createDataChannel'])
    expect(detecterFamille(webrtc, '{ iceServers: [] }')).toEqual(['iceServers'])
    // Le protocole SDP nomme le canal en minuscules : ce n'est pas l'API.
    expect(detecterFamille(webrtc, "'m=application 9 UDP/DTLS/SCTP webrtc-datachannel'")).toEqual(
      [],
    )

    const camera = famille('caméra')
    expect(detecterFamille(camera, 'navigator.mediaDevices.getUserMedia(c)')).toEqual([
      'getUserMedia',
      'mediaDevices',
    ])
    expect(detecterFamille(camera, 'navigator.webkitGetUserMedia(c)')).toEqual(['getUserMedia'])
    expect(detecterFamille(camera, 'navigator.getDisplayMedia()')).toEqual(['getDisplayMedia'])
    expect(detecterFamille(camera, "const media = 'caméra'")).toEqual([])

    const serveurs = famille('serveur STUN / TURN')
    expect(detecterFamille(serveurs, "{ urls: 'stun:stun.example.org:19302' }")).toEqual([
      'stun: / turn:',
    ])
    expect(detecterFamille(serveurs, "'turns:relais.example.org'")).toEqual(['stun: / turn:'])
    expect(detecterFamille(serveurs, '{ turns: 3 }')).toEqual([])
  })

  it.each(FAMILLES.map((f) => [f.nom, f] as const))(
    '%s : seule la liste fermée de fichiers y touche',
    (_, { permis, attendus, ...f }) => {
      const tous = fichiers(SRC)
      expect(tous.length).toBeGreaterThanOrEqual(40)

      // Chaque fichier permis existe et contient son API : sinon la liste est périmée.
      for (const chemin of permis) {
        const fichier = tous.find((candidat) => enRacine(candidat) === chemin)
        expect(fichier, `${chemin} introuvable`).toBeDefined()
        const source = readFileSync(fichier as string, 'utf8')
        for (const api of attendus) expect(source, `${chemin} → ${api}`).toContain(api)
      }

      const fautes = tous
        .filter((fichier) => !permis.includes(enRacine(fichier)))
        .flatMap((fichier) =>
          detecterFamille({ permis, attendus, ...f }, readFileSync(fichier, 'utf8')).map(
            (nom) => `${enRacine(fichier)} → ${nom}`,
          ),
        )
      expect(fautes, `Capacité hors de son adapter : ${MESSAGE_POLITIQUE}`).toEqual([])
    },
  )

  it('le détecteur d’adresses reconnaît une URL externe, et laisse passer l’espace de noms SVG', () => {
    expect(detecterAdresses("img.src = 'https://example.com/x'")).toEqual(['https://example.com/x'])
    expect(detecterAdresses('src: url(https://cdn/x.woff2);')).toEqual(['https://cdn/x.woff2'])
    expect(detecterAdresses("await import('https://x')")).toEqual(['https://x'])
    expect(detecterAdresses('<script src="http://evil.test/a.js"></script>')).toEqual([
      'http://evil.test/a.js',
    ])

    // Le reste de w3.org n'est pas exempté : seule l'URI d'espace de noms exacte l'est.
    expect(detecterAdresses('<img src="https://www.w3.org/Icons/valid-xhtml10">')).toEqual([
      'https://www.w3.org/Icons/valid-xhtml10',
    ])

    // Négatifs : les espaces de noms SVG et XLink, TanStack Query, un chemin relatif.
    expect(detecterAdresses("xmlns='http://www.w3.org/2000/svg'")).toEqual([])
    expect(detecterAdresses('xmlns:xlink="http://www.w3.org/1999/xlink"')).toEqual([])
    expect(detecterAdresses('void query.refetch()')).toEqual([])
    expect(detecterAdresses("navigate('/confidentialite')")).toEqual([])
  })

  it('aucune adresse externe écrite en dur dans src/ (scripts et CSS) ni dans index.html', () => {
    const sources = fichiers(SRC, SCRIPTS_ET_STYLES)
    // Garde-fou : un test vert à vide ne vérifie rien.
    expect(sources.length).toBeGreaterThanOrEqual(40)
    expect(sources.some((fichier) => fichier.endsWith('.css'))).toBe(true)

    const tous = [...sources, INDEX_HTML]
    const lus = tous.map((fichier) => ({ fichier, source: readFileSync(fichier, 'utf8') }))
    // index.html est effectivement lu, et c'est bien la page d'entrée.
    const index = lus.find(({ fichier }) => fichier === INDEX_HTML)
    expect(index?.source).toMatch(/<div id="root">/)

    const fautes = lus.flatMap(({ fichier, source }) =>
      detecterAdresses(source).map((adresse) => `${enRacine(fichier)} → ${adresse}`),
    )

    expect(fautes, `Adresse externe dans le code livré : ${MESSAGE_POLITIQUE}`).toEqual([])
  })
})
