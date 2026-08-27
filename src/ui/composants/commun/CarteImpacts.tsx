import { DartboardHits, type DartboardZone } from '@/core/domain/services/dartboardHits'
import { Dart } from '@/core/domain/value-objects/Dart'
import { angles, ORDRE, point, R, rangDuSecteur, trace } from './geometrieCible'

/**
 * LA CARTE DES IMPACTS — où les fléchettes d'un joueur se sont plantées.
 *
 * ⚠️ Ce n'est **pas** la `Cible` décorative avec un calque par-dessus, et c'est
 * délibéré : sur un plateau déjà rouge, vert, crème et noir, une couche de
 * chaleur ne se lit pas — on ne sait plus si le rouge est la cible ou la
 * donnée. Ici le plateau est réduit à sa **structure** (des cases, des fils,
 * vingt numéros) et la seule couleur de l'image est la donnée. Exactement le
 * principe de la feuille de match, appliqué à un graphique.
 *
 * L'échelle est relative au joueur : la case la plus touchée est toujours à
 * fond. On compare des formes, pas des volumes — « je dérive vers le 5 » se lit
 * du premier coup d'œil, « j'ai lancé plus que Julien » se lit dans le tableau
 * des moyennes, à sa place.
 */

/** Les 20 quartiers, en très faible contraste : ils situent, ils ne parlent pas. */
const QUARTIERS = ORDRE.map((numero, rang) => {
  const [debut, fin] = angles(rang)
  const [x, y] = point(R.numeros, rang * (360 / ORDRE.length))
  return { numero, debut, fin, x, y, sombre: rang % 2 === 0 }
})

/**
 * Une case froide reste visible : une seule fléchette dans le 5, c'est
 * précisément l'information qu'on cherche, et à 12 % d'opacité elle
 * disparaîtrait. D'où le plancher.
 */
const opacite = (hits: number, busiest: number): number =>
  busiest === 0 ? 0 : 0.22 + 0.78 * (hits / busiest)

/** Le ou les anneaux qu'occupe une case sur le plateau. */
const anneaux = (zone: DartboardZone): readonly string[] => {
  if (zone.segment === 'BULL' || zone.segment === 'MISS') return []

  const rang = rangDuSecteur(zone.segment)
  if (rang < 0) return []
  const [debut, fin] = angles(rang)

  switch (zone.multiplier) {
    case 'DOUBLE':
      return [trace(R.doubleInterieur, R.doubleExterieur, debut, fin)]
    case 'TRIPLE':
      return [trace(R.tripleInterieur, R.tripleExterieur, debut, fin)]
    default:
      // Un simple, c'est **deux** bandes sur un vrai plateau : celle du dedans
      // et celle du dehors. N'en allumer qu'une mentirait sur la surface visée.
      return [
        trace(R.anneau25, R.tripleInterieur, debut, fin),
        trace(R.tripleExterieur, R.doubleInterieur, debut, fin),
      ]
  }
}

/** « 14 fois dans le T20, 9 dans le S20 » — le nombre que la couleur ne dit pas. */
const resume = (nom: string, hits: DartboardHits): string => {
  if (hits.total === 0) return `${nom} : aucune fléchette sur la période`

  const sommet = DartboardHits.top(hits, 3).map((zone) => `${Dart.label(zone)} ${zone.hits} fois`)
  return `${nom} : ${sommet.join(', ')}, sur ${hits.total} fléchettes`
}

type Props = {
  readonly nom: string
  readonly hits: DartboardHits
  readonly className?: string
}

export const CarteImpacts = ({ nom, hits, className = '' }: Props) => {
  const chaudes = hits.zones.filter((zone) => zone.hits > 0)
  const sommet = DartboardHits.top(hits, 3)

  return (
    <figure className={`flex flex-col gap-2 ${className}`}>
      {/* ⚠️ La `viewBox` déborde du plateau de 4 unités : les numéros vivent à
          48,6 du centre, donc le haut du « 20 » sort d'un cadre calé à 100 et
          se fait rogner. Vu à l'écran, invisible en test — aucune requête par
          rôle ne dit qu'un glyphe est coupé. */}
      <svg
        viewBox="-4 -4 108 108"
        role="img"
        aria-label={resume(nom, hits)}
        focusable="false"
        className="w-full"
      >
        {/* Le plateau réduit à sa structure. */}
        <circle cx="50" cy="50" r={R.bordExterieur} fill="var(--color-feutre-nuit)" />
        {QUARTIERS.map((quartier) => (
          <path
            key={quartier.numero}
            d={trace(R.anneau25, R.doubleExterieur, quartier.debut, quartier.fin)}
            fill="var(--color-craie)"
            fillOpacity={quartier.sombre ? 0.05 : 0.09}
          />
        ))}

        {/* La donnée, et elle seule, porte de la couleur.
            ⚠️ Chaque case allumée est **cernée du fond**, et pas seulement
            remplie : chez un joueur qui arrose, quinze secteurs voisins à la
            même intensité fusionnaient en un disque doré où l'on ne
            distinguait plus ni les secteurs ni les anneaux. Les fils de craie
            ne suffisent pas — ils s'effacent sous le laiton. */}
        {chaudes.map((zone) =>
          anneaux(zone).map((d) => (
            <path
              key={`${Dart.label(zone)}-${d}`}
              d={d}
              fill="var(--color-laiton)"
              fillOpacity={opacite(zone.hits, hits.busiest)}
              stroke="var(--color-feutre-nuit)"
              strokeOpacity="0.65"
              strokeWidth="0.5"
            />
          )),
        )}

        {/* Le centre a son propre fond : les quartiers s'arrêtent à l'anneau
            à 25, sinon vingt bandes traverseraient la bulle. */}
        <circle cx="50" cy="50" r={R.anneau25} fill="var(--color-craie)" fillOpacity="0.07" />
        <circle
          cx="50"
          cy="50"
          r={(R.anneau25 + R.bullseye) / 2}
          fill="none"
          stroke="var(--color-laiton)"
          strokeWidth={R.anneau25 - R.bullseye}
          strokeOpacity={opacite(
            chaudes.find((zone) => zone.segment === 'BULL' && zone.multiplier === 'SIMPLE')?.hits ??
              0,
            hits.busiest,
          )}
        />
        <circle
          cx="50"
          cy="50"
          r={R.bullseye}
          fill="var(--color-laiton)"
          stroke="var(--color-feutre-nuit)"
          strokeOpacity="0.65"
          strokeWidth="0.5"
          fillOpacity={opacite(
            chaudes.find((zone) => zone.segment === 'BULL' && zone.multiplier === 'DOUBLE')?.hits ??
              0,
            hits.busiest,
          )}
        />

        {/* Les fils : ce sont eux qui font lire un plateau plutôt qu'un camembert. */}
        <g stroke="var(--color-craie)" strokeOpacity="0.22" strokeWidth="0.3" fill="none">
          {QUARTIERS.map((quartier) => {
            const [x1, y1] = point(R.anneau25, quartier.debut)
            const [x2, y2] = point(R.doubleExterieur, quartier.debut)
            return <line key={quartier.numero} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
          <circle cx="50" cy="50" r={R.doubleExterieur} />
          <circle cx="50" cy="50" r={R.doubleInterieur} />
          <circle cx="50" cy="50" r={R.tripleExterieur} />
          <circle cx="50" cy="50" r={R.tripleInterieur} />
          <circle cx="50" cy="50" r={R.anneau25} />
        </g>

        {/* Sans les numéros, une carte de chaleur ne dit pas OÙ. */}
        <g
          fill="var(--color-craie)"
          fillOpacity="0.55"
          fontSize="5"
          fontFamily="Oswald, sans-serif"
          fontWeight="700"
          textAnchor="middle"
        >
          {QUARTIERS.map((quartier) => (
            <text key={quartier.numero} x={quartier.x} y={quartier.y + 1.8}>
              {quartier.numero}
            </text>
          ))}
        </g>
      </svg>

      <figcaption className="flex flex-col gap-1">
        <span className="truncate font-score text-xs font-bold uppercase tracking-[0.1em] text-craie-vive">
          {nom}
        </span>
        {sommet.length === 0 ? (
          <span className="text-[0.7rem] text-craie/60">Aucune fléchette</span>
        ) : (
          <span className="flex flex-wrap gap-x-2 gap-y-0.5">
            {sommet.map((zone) => (
              <span key={Dart.label(zone)} className="chiffres text-[0.7rem] text-craie/75">
                <span className="text-laiton-clair">{Dart.label(zone)}</span> ×{zone.hits}
              </span>
            ))}
          </span>
        )}
        {hits.missed > 0 && (
          <span className="chiffres text-[0.7rem] text-craie/60">Hors cible ×{hits.missed}</span>
        )}
      </figcaption>
    </figure>
  )
}
