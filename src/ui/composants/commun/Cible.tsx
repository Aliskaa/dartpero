/**
 * Une vraie cible de fléchettes, dessinée en SVG — zéro image à charger, donc
 * zéro octet de plus dans le précache de la PWA, et net à toutes les tailles.
 *
 * Toujours décorative (`aria-hidden`) : elle n'est jamais cliquable et ne porte
 * aucune information que le tableau ne donne déjà.
 */

/** L'ordre officiel des secteurs, en partant du 20 et dans le sens horaire. */
const ORDRE = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5] as const

const SECTEUR = 360 / ORDRE.length

/** Rayons sur une viewBox de 100, centre (50, 50) — proportions d'un plateau réel. */
const R = {
  bordExterieur: 50,
  numeros: 48.6,
  doubleExterieur: 47,
  doubleInterieur: 43.5,
  tripleExterieur: 29.5,
  tripleInterieur: 26,
  anneau25: 8,
  bullseye: 3.4,
} as const

const TEINTES = {
  creme: '#E8DCC0',
  noir: '#141414',
  rouge: '#C1272D',
  vert: '#2E7D4F',
} as const

const point = (rayon: number, angle: number): readonly [number, number] => {
  const radians = ((angle - 90) * Math.PI) / 180
  return [50 + rayon * Math.cos(radians), 50 + rayon * Math.sin(radians)]
}

/** Un secteur annulaire : l'unité de base d'un plateau. */
const trace = (interieur: number, exterieur: number, debut: number, fin: number): string => {
  const [x1, y1] = point(exterieur, debut)
  const [x2, y2] = point(exterieur, fin)
  const [x3, y3] = point(interieur, fin)
  const [x4, y4] = point(interieur, debut)
  return [
    `M${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A${exterieur} ${exterieur} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A${interieur} ${interieur} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join('')
}

const SECTEURS = ORDRE.map((numero, index) => {
  const debut = index * SECTEUR - SECTEUR / 2
  const fin = debut + SECTEUR
  const sombre = index % 2 === 0
  const [xNumero, yNumero] = point(R.numeros, index * SECTEUR)

  return {
    numero,
    debut,
    fin,
    simple: sombre ? TEINTES.noir : TEINTES.creme,
    multiple: sombre ? TEINTES.rouge : TEINTES.vert,
    xNumero,
    yNumero,
  }
})

type Props = {
  readonly className?: string
  readonly avecNumeros?: boolean
}

export const Cible = ({ className = '', avecNumeros = false }: Props) => (
  <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={className}>
    {/* Le fond du plateau et son cadre de bois. */}
    <circle cx="50" cy="50" r={R.bordExterieur} fill="#0B0B0B" />
    <circle
      cx="50"
      cy="50"
      r={R.bordExterieur - 0.6}
      fill="none"
      stroke="#3A2718"
      strokeWidth="1.2"
    />

    {SECTEURS.map((secteur) => (
      <g key={secteur.numero}>
        <path
          d={trace(R.doubleInterieur, R.doubleExterieur, secteur.debut, secteur.fin)}
          fill={secteur.multiple}
        />
        <path
          d={trace(R.tripleExterieur, R.doubleInterieur, secteur.debut, secteur.fin)}
          fill={secteur.simple}
        />
        <path
          d={trace(R.tripleInterieur, R.tripleExterieur, secteur.debut, secteur.fin)}
          fill={secteur.multiple}
        />
        <path
          d={trace(R.anneau25, R.tripleInterieur, secteur.debut, secteur.fin)}
          fill={secteur.simple}
        />
      </g>
    ))}

    {/* Le centre : anneau à 25, bullseye à 50. */}
    <circle cx="50" cy="50" r={R.anneau25} fill={TEINTES.vert} />
    <circle cx="50" cy="50" r={R.bullseye} fill={TEINTES.rouge} />

    {/* Les fils métalliques qui séparent les secteurs. */}
    <g stroke="#B9B3A4" strokeOpacity="0.55" strokeWidth="0.35" fill="none">
      {SECTEURS.map((secteur) => {
        const [x1, y1] = point(R.anneau25, secteur.debut)
        const [x2, y2] = point(R.doubleExterieur, secteur.debut)
        return <line key={secteur.numero} x1={x1} y1={y1} x2={x2} y2={y2} />
      })}
      <circle cx="50" cy="50" r={R.doubleInterieur} />
      <circle cx="50" cy="50" r={R.tripleExterieur} />
      <circle cx="50" cy="50" r={R.tripleInterieur} />
      <circle cx="50" cy="50" r={R.anneau25} />
    </g>

    {avecNumeros && (
      <g
        fill="#F2E8D5"
        fontSize="4.6"
        fontFamily="Oswald, sans-serif"
        fontWeight="700"
        textAnchor="middle"
      >
        {SECTEURS.map((secteur) => (
          <text key={secteur.numero} x={secteur.xNumero} y={secteur.yNumero + 1.7}>
            {secteur.numero}
          </text>
        ))}
      </g>
    )}
  </svg>
)
