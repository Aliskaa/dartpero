import type { VisitOutcome } from '@/core/domain/entities/Visit'
import type { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Batons } from '@/ui/composants/commun/Batons'
import { CasesVolee } from '@/ui/composants/commun/CasesVolee'
import { NomJoueurFeuille } from '@/ui/composants/commun/NomJoueurFeuille'
import {
  etiquetteManchesGagnees,
  etiquetteVoleeLigne,
  moyenne as formatMoyenne,
  LIBELLE_MANCHES,
} from '@/ui/labels'

/** Volée en cours pour le joueur actif, dernière enregistrée pour les autres. */
export type VoleeAffichee = {
  readonly darts: readonly Dart[]
  readonly total: number
  /** `null` tant que la volée est en cours de saisie. */
  readonly outcome: VisitOutcome | null
}

/** Plus il y a de joueurs, moins chaque ligne a de hauteur — le chiffre suit. */
export type Echelle = 'large' | 'moyen' | 'compact'

/** Reste plus grand en portrait (lecture à 3 m) ; en paysage la hauteur manque. */
const RESTE: Record<Echelle, string> = {
  large: 'text-score-xl-portrait paysage:text-score-xl leading-[0.84]',
  moyen: 'text-score-l-portrait paysage:text-score-l leading-[0.88]',
  compact: 'text-score-m-portrait paysage:text-score-m leading-[0.9]',
}

const HAUTEUR: Record<Echelle, string> = {
  large: 'py-5 paysage:py-2',
  moyen: 'py-3.5 paysage:py-2',
  // Quatre joueurs en paysage : 408 px de page pour 390 avec `py-2` (mesuré), donc
  // un cran de moins ici — jamais sur les touches, au plancher de 48 px.
  compact: 'py-2.5 paysage:py-1',
}

/** Colonnes joueur, volée, manches, reste (les trois dernières à largeur fixe), en littéral complet pour Tailwind. */
// ⚠️ La largeur est la contrainte la plus serrée : une colonne de plus ne rentre pas (JOUEUR se tronque).
export const GRILLE_LIGNE =
  'grid grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_8.25rem] paysage:grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_6.75rem]'

type Props = {
  readonly nom: string
  readonly couleur: PlayerColor | null
  readonly reste: number
  readonly actif: boolean
  readonly vainqueur: boolean
  readonly volee: VoleeAffichee | null
  readonly legsGagnes: number
  readonly legsRequis: number
  readonly setsGagnes: number
  readonly setsRequis: number
  readonly moyenne: number
  readonly echelle: Echelle
}

/** Ligne de feuille de match, une par joueur. ⚠️ Le nombre de fléchettes lancées ne s'affiche PAS en partie : il vit au résumé et dans les stats de carrière. */
export const LigneJoueur = ({
  nom,
  couleur,
  reste,
  actif,
  vainqueur,
  volee,
  legsGagnes,
  legsRequis,
  setsGagnes,
  setsRequis,
  moyenne,
  echelle,
}: Props) => {
  const bust = volee?.outcome === 'BUSTED'
  const sortie = volee?.outcome === 'CHECKOUT'
  /** Une issue absente signe une volée encore en train d'être saisie. */
  const enSaisie = volee !== null && volee.outcome === null

  return (
    <article
      aria-current={actif ? 'true' : undefined}
      className={[
        'ligne-tableau relative',
        GRILLE_LIGNE,
        HAUTEUR[echelle],
        bust ? 'animate-secousse' : '',
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-col justify-center gap-2 px-3 paysage:px-2">
        <NomJoueurFeuille
          nom={nom}
          couleur={couleur}
          actif={actif}
          vainqueur={vainqueur}
          alerte={bust}
        />

        <CasesVolee
          aria-label={etiquetteVoleeLigne(enSaisie, nom)}
          darts={volee?.darts ?? []}
          bust={bust}
        />
      </div>

      <div className="filet-colonne flex flex-col items-center justify-center gap-1 px-1">
        {bust ? (
          <span className="font-score text-xs font-bold uppercase tracking-[0.14em] text-rouge-cible">
            Bust
          </span>
        ) : sortie ? (
          <span className="font-score text-xs font-bold uppercase tracking-tight text-vert-cible">
            Checkout
          </span>
        ) : (
          <span
            className={`chiffres text-2xl font-bold leading-none ${
              volee && volee.darts.length > 0 ? 'text-craie' : 'text-craie-3'
            }`}
          >
            {volee && volee.darts.length > 0 ? volee.total : '—'}
          </span>
        )}

        <span className="entete-colonne normal-case tracking-normal">
          moy <span className="chiffres font-semibold text-craie-2">{formatMoyenne(moyenne)}</span>
        </span>
      </div>

      <output
        aria-label={etiquetteManchesGagnees(nom, legsGagnes, legsRequis)}
        className="filet-colonne flex flex-col items-center justify-center gap-1 px-1"
      >
        <Batons gagnes={legsGagnes} requis={legsRequis} libelle={LIBELLE_MANCHES} />
        {setsRequis > 1 && <Batons gagnes={setsGagnes} requis={setsRequis} libelle="Sets" />}
      </output>

      <div className="filet-colonne flex flex-col items-center justify-center px-1">
        <output
          aria-label={`Score restant de ${nom}`}
          className={`chiffres block font-bold ${
            actif ? 'trace-craie text-craie-vive' : vainqueur ? 'text-craie-vive' : 'text-craie'
          } ${RESTE[echelle]}`}
        >
          <span key={reste} className="inline-block animate-pop-score">
            {reste}
          </span>
        </output>
      </div>
    </article>
  )
}
