import { angles, ORDRE, point, R, trace } from './geometrieCible'

/** Cible de fléchettes en SVG, toujours décorative (`aria-hidden`) ; celle qui porte une information est `CarteImpacts`. */

const TEINTES = {
  creme: '#E8DCC0',
  noir: '#141414',
  rouge: '#C1272D',
  vert: '#2E7D4F',
} as const

const SECTEURS = ORDRE.map((numero, index) => {
  const [debut, fin] = angles(index)
  const sombre = index % 2 === 0
  const [xNumero, yNumero] = point(R.numeros, index * (360 / ORDRE.length))

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

    <circle cx="50" cy="50" r={R.anneau25} fill={TEINTES.vert} />
    <circle cx="50" cy="50" r={R.bullseye} fill={TEINTES.rouge} />

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
