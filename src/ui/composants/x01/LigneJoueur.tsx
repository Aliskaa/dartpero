import { Crown } from 'lucide-react'
import type { VisitOutcome } from '@/core/domain/entities/Visit'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Batons } from '@/ui/composants/commun/Batons'
import { couleurJoueur } from '@/ui/couleurs'
import { moyenne as formatMoyenne } from '@/ui/labels'

/**
 * La volée montrée sur la ligne : celle **en cours** pour le joueur actif,
 * la dernière enregistrée pour les autres. C'est la question qui revient le
 * plus souvent autour d'une cible — « t'as mis quoi, là ? ».
 */
export type VoleeAffichee = {
  readonly darts: readonly Dart[]
  readonly total: number
  /** `null` tant que la volée est en cours de saisie. */
  readonly outcome: VisitOutcome | null
}

/** Plus il y a de joueurs, moins chaque ligne a de hauteur — le chiffre suit. */
export type Echelle = 'large' | 'moyen' | 'compact'

const RESTE: Record<Echelle, string> = {
  large: 'text-[4.25rem] leading-[0.84]',
  moyen: 'text-[3.25rem] leading-[0.88]',
  compact: 'text-[2.5rem] leading-[0.9]',
}

const HAUTEUR: Record<Echelle, string> = {
  large: 'py-5',
  moyen: 'py-3.5',
  compact: 'py-2.5',
}

/**
 * Les trois colonnes de la feuille, à largeur FIXE pour les deux dernières :
 * c'est en alignant les chiffres d'une ligne à l'autre qu'on les compare.
 */
export const GRILLE_LIGNE = 'grid grid-cols-[minmax(0,1fr)_4.5rem_6.75rem]'

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
  readonly flechettes: number
  readonly echelle: Echelle
}

/**
 * ZONE LECTURE — une LIGNE DE FEUILLE DE MATCH, une par joueur.
 *
 * Piste E : ce qui structure la lecture, ce sont les colonnes et les filets,
 * pas le relief. Trois cases — qui joue, ce qu'il vient de faire, ce qui lui
 * reste — sous les en-têtes portés par `Tableau`. Les chiffres s'alignent
 * parce que les colonnes existent vraiment, pas parce qu'on a bricolé des
 * largeurs au jugé.
 *
 * Hiérarchie visuelle :
 * 1. à 3 m — le reste, et le filet de laiton qui dit qui lance ;
 * 2. à 1 m — les fléchettes écrites sur leur ligne, et le total ;
 * 3. à 30 cm — moyenne, fléchettes lancées, bâtons de legs.
 */
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
  flechettes,
  echelle,
}: Props) => {
  const teinte = couleurJoueur(couleur)
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
        'transition-opacity duration-300',
        bust ? 'animate-secousse' : '',
        actif ? 'au-lancer' : 'opacity-70',
      ].join(' ')}
    >
      {/* COLONNE 1 — qui joue, et ce qu'il vient d'écrire. */}
      <div className="flex min-w-0 flex-col justify-center gap-2 px-3">
        <p className="flex min-w-0 items-center gap-2">
          {/* La couleur du profil : un carré de repère, pas une pastille. */}
          <span
            aria-hidden="true"
            style={{ backgroundColor: bust ? undefined : teinte.fond }}
            className={`size-3 shrink-0 ${bust ? 'bg-rouge-cible' : ''}`}
          />
          <span
            className={`truncate font-score text-base font-bold uppercase tracking-[0.08em] ${
              actif ? 'text-craie-vive' : 'text-craie/75'
            }`}
          >
            {nom}
          </span>
          {vainqueur && <Crown aria-hidden="true" className="size-4 shrink-0 text-accent-mode" />}
        </p>

        {/* Les trois fléchettes, écrites sur leur ligne comme au stylo. */}
        <output
          aria-label={enSaisie ? 'Volée en cours' : `Dernière volée de ${nom}`}
          className="flex items-end gap-2"
        >
          {[0, 1, 2].map((rang) => {
            const dart = volee?.darts[rang]
            return (
              <span
                key={rang}
                className={[
                  'ligne-saisie chiffres min-w-[2.75rem] pb-0.5 text-center',
                  'text-sm font-bold leading-none',
                  dart
                    ? bust
                      ? 'text-rouge-cible line-through'
                      : 'text-craie-vive'
                    : 'text-craie/20',
                ].join(' ')}
              >
                {dart ? DartVO.label(dart) : '—'}
              </span>
            )
          })}
        </output>
      </div>

      {/* COLONNE 2 — la volée : son total, ou ce qui l'a annulée. */}
      <div className="filet-colonne flex flex-col items-center justify-center gap-1 px-1">
        {bust ? (
          <span className="font-score text-xs font-bold uppercase tracking-[0.14em] text-rouge-cible">
            Bust
          </span>
        ) : sortie ? (
          <span className="font-score text-xs font-bold uppercase tracking-[0.14em] text-vert-cible">
            Sortie
          </span>
        ) : (
          <span
            className={`chiffres text-2xl font-bold leading-none ${
              volee && volee.darts.length > 0 ? 'text-craie' : 'text-craie/20'
            }`}
          >
            {volee && volee.darts.length > 0 ? volee.total : '—'}
          </span>
        )}

        <span className="entete-colonne text-[0.55rem] normal-case tracking-normal">
          moy <span className="chiffres font-semibold text-craie/80">{formatMoyenne(moyenne)}</span>
        </span>
      </div>

      {/* COLONNE 3 — le reste. C'est LE chiffre qu'on lit depuis l'oche. */}
      <div className="filet-colonne flex flex-col items-center justify-center gap-1.5 px-1">
        <output
          aria-label={`Score restant de ${nom}`}
          className={`chiffres trace-craie block font-bold text-craie-vive ${RESTE[echelle]}`}
        >
          {/* La `key` fait rejouer le « pop » à chaque changement de valeur. */}
          <span key={reste} className="inline-block animate-pop-score">
            {reste}
          </span>
        </output>

        <span className="flex items-center gap-2">
          <Batons gagnes={legsGagnes} requis={legsRequis} libelle="Legs" />
          {setsRequis > 1 && <Batons gagnes={setsGagnes} requis={setsRequis} libelle="Sets" />}
          <span className="chiffres text-[0.6rem] font-semibold text-craie/55">{flechettes} f</span>
        </span>
      </div>
    </article>
  )
}
