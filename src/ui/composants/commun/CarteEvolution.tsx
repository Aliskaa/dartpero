import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { PlayerProgress } from '@/core/domain/games/x01/progress'
import { BasculesPodium } from '@/ui/composants/commun/CartePodium'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'
import {
  abscisse,
  axeVertical,
  datesSousLaCourbe,
  defilementPourPoint,
  franchitUneAnnee,
  geometrieCourbe,
  indexDepuisPosition,
  LARGEUR_GOUTTIERE,
  MARGE_GAUCHE,
  MESURE_EVOLUTION,
  ordonnee,
  PARTIES_POUR_TENDANCE,
  PLANCHE,
  pourcentageLargeur,
  referenceDe,
  SEUIL_GLISSE_PX,
  type Vue,
  valeursTracees,
  vueDepuisDefilement,
} from '@/ui/evolution'
import {
  BASCULE_MOYENNE,
  dateEvolution,
  ENCORE_UNE_PARTIE,
  ecartEvolution,
  LEGENDE_BASCULE_EVOLUTION,
  LEGENDE_TENDANCE,
  LEGENDE_UNE_PARTIE,
  LIBELLE_CURSEUR_EVOLUTION,
  LIGNES_ECART_EVOLUTION,
  MESURES_MOYENNE,
  type MesureMoyenne,
  moyenne,
  nombre,
  nomCourbe,
  partieSurTotal,
  REFERENCE_EVOLUTION,
  TENDANCE_A_VENIR,
  TITRE_CARTE_EVOLUTION,
  valeurCurseurEvolution,
  valeurEvolution,
} from '@/ui/labels'

/** Carte Évolution : courbe du joueur du sélecteur sur la période, tendance sur 3 parties en laiton. */
// ⚠️ Texte des axes ≈ 10 px, sous le plancher de 0,75 rem : écart connu de la charte.

type Props = {
  /** Le nom affiché du joueur (`nomJoueur`). */
  readonly nom: string
  /** Au moins un point : sans partie, la carte n'existe pas. */
  readonly progression: PlayerProgress
  readonly mesure: MesureMoyenne
  readonly onMesure: (mesure: MesureMoyenne) => void
}

/** Les tailles du texte d'axe et des carrés, en unités de la planche. */
const TEXTE_AXE = 10.5
const DEMI_POINT = 3
const DEMI_POINT_CHOISI = 4.5

const enPolyligne = (sommets: readonly (readonly [number, number])[]): string =>
  sommets.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

export const CarteEvolution = ({ nom, progression, mesure: mesureChoisie, onMesure }: Props) => {
  const idTitre = useId()
  const points = progression.points
  const parties = points.length
  // Une ou deux parties : la planche C, Moyenne seule, rien à choisir (U6 a).
  const peuDeParties = parties < PARTIES_POUR_TENDANCE
  const mesure: MesureMoyenne = peuDeParties ? 'MOYENNE' : mesureChoisie
  const geometrie = geometrieCourbe(parties)

  const [selection, setSelection] = useState(parties - 1)
  const [vue, setVue] = useState<Vue | null>(null)
  const fenetre = useRef<HTMLDivElement>(null)
  const appui = useRef<{ readonly id: number; readonly x: number; readonly y: number } | null>(null)

  const lireVue = () => {
    const conteneur = fenetre.current
    setVue(
      conteneur
        ? vueDepuisDefilement({
            defilement: conteneur.scrollLeft,
            largeurVisible: conteneur.clientWidth,
          })
        : null,
    )
  }

  // À l'ouverture et à chaque mesure : fin de la courbe, sans animation. Idempotent sous StrictMode.
  const defile = geometrie.defile
  // biome-ignore lint/correctness/useExhaustiveDependencies: la mesure est le déclencheur voulu ; le corps relit le DOM
  useLayoutEffect(() => {
    const conteneur = fenetre.current
    if (!conteneur || !defile) return
    conteneur.scrollLeft = conteneur.scrollWidth - conteneur.clientWidth
    setVue(
      vueDepuisDefilement({
        defilement: conteneur.scrollLeft,
        largeurVisible: conteneur.clientWidth,
      }),
    )
  }, [mesure, defile])

  // Une rotation change la largeur visible : les dates de la vue suivent.
  useEffect(() => {
    const relire = () => {
      const conteneur = fenetre.current
      if (!conteneur) return
      setVue(
        vueDepuisDefilement({
          defilement: conteneur.scrollLeft,
          largeurVisible: conteneur.clientWidth,
        }),
      )
    }
    window.addEventListener('resize', relire)
    return () => window.removeEventListener('resize', relire)
  }, [])

  const index = peuDeParties ? parties - 1 : Math.min(Math.max(0, selection), parties - 1)
  const point = points[index]
  if (!point) return null

  const { valeur, decimales } = MESURE_EVOLUTION[mesure]
  const avecAnnee = franchitUneAnnee(points)
  const dateDe = (rang: number): string => {
    const partie = points[rang]
    return partie ? dateEvolution(partie.createdAt, avecAnnee) : ''
  }
  const reference = referenceDe(progression, mesure)
  const axe = axeVertical(mesure, valeursTracees(progression, mesure))
  const y = (v: number) => ordonnee(axe, v)
  const finTrace = geometrie.largeurContenu - PLANCHE.droite

  const tendance = points.flatMap((partie, rang) =>
    partie.trend === null ? [] : [[abscisse(geometrie, rang), y(valeur(partie.trend))] as const],
  )
  const valeurLue = valeurEvolution(valeur(point.value), decimales)
  const quand = partieSurTotal(point.number, parties, dateDe(index))

  const changerMesure = (nouvelle: MesureMoyenne) => {
    // La bascule déjà active ne change rien : ni la sélection, ni la vue.
    if (nouvelle === mesure) return
    setSelection(parties - 1)
    onMesure(nouvelle)
  }

  const choisirAuClavier = (rang: number) => {
    setSelection(rang)
    const conteneur = fenetre.current
    if (!conteneur) return
    const cible = defilementPourPoint(geometrie, rang, {
      defilement: conteneur.scrollLeft,
      largeurVisible: conteneur.clientWidth,
    })
    if (cible === null) return
    conteneur.scrollLeft = cible
    lireVue()
  }

  /** Touches du curseur tenues ici : ← ↓ avant, → ↑ après, Début / Fin ; `preventDefault` pour un seul pas. */
  const TOUCHES: Record<string, (rang: number) => number> = {
    ArrowLeft: (rang) => rang - 1,
    ArrowDown: (rang) => rang - 1,
    ArrowRight: (rang) => rang + 1,
    ArrowUp: (rang) => rang + 1,
    Home: () => 0,
    End: () => parties - 1,
  }
  const toucher = (evenement: KeyboardEvent<HTMLInputElement>) => {
    const pas = TOUCHES[evenement.key]
    if (!pas) return
    evenement.preventDefault()
    const rang = Math.min(parties - 1, Math.max(0, pas(index)))
    if (rang !== index) choisirAuClavier(rang)
  }

  const appuyer = (evenement: PointerEvent<HTMLDivElement>) => {
    appui.current =
      evenement.button === 0
        ? { id: evenement.pointerId, x: evenement.clientX, y: evenement.clientY }
        : null
  }

  const relacher = (evenement: PointerEvent<HTMLDivElement>) => {
    const debut = appui.current
    appui.current = null
    const conteneur = fenetre.current
    if (!debut || !conteneur || debut.id !== evenement.pointerId) return
    // Un glissé n'est jamais un appui, même quand rien ne défile.
    if (
      Math.abs(evenement.clientX - debut.x) > SEUIL_GLISSE_PX ||
      Math.abs(evenement.clientY - debut.y) > SEUIL_GLISSE_PX
    ) {
      return
    }
    setSelection(
      indexDepuisPosition(geometrie, {
        position: evenement.clientX - conteneur.getBoundingClientRect().left,
        defilement: conteneur.scrollLeft,
        largeurVisible: conteneur.clientWidth,
      }),
    )
  }

  // Le navigateur a pris le geste (défilement) : rien n'est sélectionné.
  const annuler = () => {
    appui.current = null
  }

  return (
    <section
      aria-labelledby={idTitre}
      className="mx-auto w-full max-w-sm min-w-0 border-t-3 border-laiton bg-ardoise px-3.5 pt-3.5 pb-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id={idTitre}
          className="flex min-w-0 items-center gap-1.75 font-score text-sm font-bold uppercase tracking-[0.1em] text-craie-vive"
        >
          <Pictogramme nom="evolution" taille={20} className="shrink-0 text-laiton" />
          {TITRE_CARTE_EVOLUTION}
        </h2>
        {!peuDeParties && (
          <BasculesPodium
            disposition="jointives"
            legende={LEGENDE_BASCULE_EVOLUTION}
            valeurs={MESURES_MOYENNE}
            valeur={mesure}
            onChange={changerMesure}
            libelle={(option) => BASCULE_MOYENNE[option]}
          />
        )}
      </div>

      <output className="mt-3 mb-1 flex items-end justify-between gap-2.5">
        <span className="block">
          <span className="sr-only">{BASCULE_MOYENNE[mesure].complet} : </span>
          <b className="chiffres text-5xl leading-[0.9] font-bold text-laiton-clair">{valeurLue}</b>{' '}
          <span className="mt-1.5 block font-score text-etiquette uppercase tracking-[0.1em] text-craie-3">
            {quand}
          </span>
        </span>
        {!peuDeParties &&
          (point.trendDelta === null ? (
            <span className="block text-right text-xs leading-[1.3] text-craie-2">
              {' '}
              <span className="block">{TENDANCE_A_VENIR.debut}</span>{' '}
              <span className="block">
                {TENDANCE_A_VENIR.suite}
                {TENDANCE_A_VENIR.rang}
                <sup>{TENDANCE_A_VENIR.exposant}</sup>
                {TENDANCE_A_VENIR.fin}
              </span>
            </span>
          ) : (
            <span className="block text-right text-xs leading-[1.3] text-craie-2">
              {' '}
              <b className="chiffres block text-lg font-bold text-laiton-clair">
                {ecartEvolution(valeur(point.trendDelta), decimales)}
              </b>{' '}
              <span className="block">{LIGNES_ECART_EVOLUTION[0]}</span>{' '}
              <span className="block">{LIGNES_ECART_EVOLUTION[1]}</span>
            </span>
          ))}
      </output>

      {/* `relative` : le curseur masqué (`sr-only`, absolu) reste dans la carte, hors de la fenêtre. */}
      <div className="relative grid grid-cols-[25fr_minmax(0,295fr)] items-start focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-laiton">
        <svg
          viewBox={`0 0 ${LARGEUR_GOUTTIERE} ${PLANCHE.hauteur}`}
          aria-hidden="true"
          focusable="false"
          className="block h-auto w-full font-score"
        >
          {axe.graduations.map((graduation) => (
            <text
              key={graduation}
              x={LARGEUR_GOUTTIERE}
              y={y(graduation) + 3.5}
              textAnchor="end"
              fontSize={TEXTE_AXE}
              className="fill-craie-3 tracking-[0.04em]"
            >
              {nombre(graduation)}
            </text>
          ))}
        </svg>

        <div
          ref={fenetre}
          className={geometrie.defile ? 'min-w-0 overflow-x-auto overscroll-x-contain' : 'min-w-0'}
          {...(peuDeParties
            ? {}
            : {
                onPointerDown: appuyer,
                onPointerUp: relacher,
                onPointerCancel: annuler,
                onScroll: geometrie.defile ? lireVue : undefined,
              })}
        >
          <svg
            viewBox={`0 0 ${geometrie.largeurContenu} ${PLANCHE.hauteur}`}
            role="img"
            aria-label={nomCourbe(nom, parties)}
            className="block h-auto font-score"
            style={{ width: `${pourcentageLargeur(geometrie)}%` }}
          >
            {axe.graduations.map((graduation) => (
              <line
                key={graduation}
                x1={MARGE_GAUCHE}
                x2={finTrace}
                y1={y(graduation)}
                y2={y(graduation)}
                strokeWidth={1}
                className="stroke-craie/12"
              />
            ))}
            {reference !== null && (
              <line
                x1={MARGE_GAUCHE}
                x2={finTrace}
                y1={y(reference)}
                y2={y(reference)}
                strokeWidth={1}
                strokeDasharray="4 4"
                className="stroke-craie-3"
              />
            )}
            {parties > 1 && (
              <polyline
                points={enPolyligne(
                  points.map((partie, rang) => [
                    abscisse(geometrie, rang),
                    y(valeur(partie.value)),
                  ]),
                )}
                fill="none"
                strokeWidth={1}
                className="stroke-craie-3"
              />
            )}
            {tendance.length > 0 && (
              <polyline
                points={enPolyligne(tendance)}
                fill="none"
                strokeWidth={3}
                strokeLinejoin="miter"
                strokeLinecap="butt"
                className="stroke-laiton"
              />
            )}
            {points.map((partie, rang) => {
              const demi = rang === index ? DEMI_POINT_CHOISI : DEMI_POINT
              return (
                <rect
                  key={partie.matchId}
                  x={abscisse(geometrie, rang) - demi}
                  y={y(valeur(partie.value)) - demi}
                  width={2 * demi}
                  height={2 * demi}
                  className={rang === index ? 'fill-laiton-clair' : 'fill-craie'}
                />
              )
            })}
            {!peuDeParties && (
              <line
                x1={abscisse(geometrie, index)}
                x2={abscisse(geometrie, index)}
                y1={PLANCHE.haut}
                y2={PLANCHE.hauteur - PLANCHE.bas}
                strokeWidth={1}
                className="stroke-laiton-clair"
              />
            )}
            {datesSousLaCourbe(geometrie, vue).map(({ index: rang, ancre }) => (
              <text
                key={ancre}
                x={abscisse(geometrie, rang)}
                y={PLANCHE.hauteur - 7}
                textAnchor={ancre}
                fontSize={TEXTE_AXE}
                className="fill-craie-3 tracking-[0.04em]"
              >
                {dateDe(rang)}
              </text>
            ))}
          </svg>
        </div>

        {!peuDeParties && (
          <input
            type="range"
            className="sr-only"
            min={0}
            max={parties - 1}
            step={1}
            value={index}
            onChange={(evenement) => choisirAuClavier(Number(evenement.target.value))}
            onKeyDown={toucher}
            aria-label={LIBELLE_CURSEUR_EVOLUTION}
            aria-valuetext={valeurCurseurEvolution(point.number, parties, dateDe(index), valeurLue)}
          />
        )}
      </div>

      {peuDeParties ? (
        <p className="mt-2 text-xs text-craie-2">
          <b className="font-semibold text-craie-vive">
            {TENDANCE_A_VENIR.debut} {TENDANCE_A_VENIR.suite}
            {TENDANCE_A_VENIR.rang}
            <sup>{TENDANCE_A_VENIR.exposant}</sup>
            {TENDANCE_A_VENIR.fin}.
          </b>
          {parties === 2 && ` ${ENCORE_UNE_PARTIE}`}
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-etiquette text-craie-3">
          <span>
            <span
              aria-hidden="true"
              className="mr-1.25 inline-block size-2 bg-craie align-middle"
            />
            {LEGENDE_UNE_PARTIE}
          </span>
          <span>
            <span
              aria-hidden="true"
              className="mr-1.25 inline-block h-0.75 w-4 bg-laiton align-middle"
            />
            {LEGENDE_TENDANCE}
          </span>
          {mesure !== 'VOLEE' && reference !== null && (
            <span>
              <span
                aria-hidden="true"
                className="mr-1.25 inline-block w-4 border-t border-dashed border-craie-3 align-middle"
              />
              {REFERENCE_EVOLUTION[mesure]} {moyenne(reference)}
            </span>
          )}
        </div>
      )}
    </section>
  )
}
