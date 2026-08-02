import { CircleOff, Target } from 'lucide-react'
import type { VisitOutcome } from '@/core/domain/entities/Visit'
import type { MatchState } from '@/core/domain/services/x01Rules'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { nomJoueur } from '@/ui/labels'
import { CarteJoueur } from './CarteJoueur'

export type DerniereVolee = {
  readonly nom: string
  readonly outcome: VisitOutcome
  readonly scored: number
}

type Props = {
  readonly state: MatchState
  readonly resteAffiche: number
  readonly dartsEnCours: readonly Dart[]
  readonly suggestion: readonly Dart[] | null
  readonly derniere: DerniereVolee | null
  readonly noms: ReadonlyMap<PlayerId, string>
  readonly moyennes: ReadonlyMap<PlayerId, number>
}

const RESUME_ISSUE: Record<VisitOutcome, (scored: number) => string> = {
  SCORED: (scored) => `${scored} point${scored > 1 ? 's' : ''}`,
  BUSTED: () => 'Bust — volée annulée',
  CHECKOUT: () => 'Sortie !',
}

const TON_ISSUE: Record<VisitOutcome, string> = {
  SCORED: 'border-chene/60 bg-ardoise/70 text-craie/80',
  BUSTED: 'animate-secousse border-rouge-cible/70 bg-rouge-cible/20 text-craie-vive',
  CHECKOUT: 'border-vert-cible/70 bg-vert-cible/20 text-craie-vive',
}

/** La sortie conseillée, en ruban : trois cibles qu'on lit de loin. */
const RubanSortie = ({
  suggestion,
  aucunFinish,
}: {
  readonly suggestion: readonly Dart[] | null
  readonly aucunFinish: boolean
}) => {
  // Une route peut répéter la même cible (T20 · T20 · D20) : la clé porte donc
  // aussi le rang, mais elle est calculée ici pour rester une donnée stable.
  const cibles = suggestion?.map((dart, rang) => ({
    cle: `${rang}-${DartVO.label(dart)}`,
    libelle: DartVO.label(dart),
  }))

  if (cibles) {
    return (
      <div
        className={[
          'flex animate-monter items-center justify-center gap-2.5 rounded-xl px-3 py-2',
          'border border-vert-cible/60 bg-vert-cible/12',
          'shadow-[0_0_24px_-10px_var(--color-vert-cible)]',
        ].join(' ')}
      >
        <Target aria-hidden="true" className="size-4 shrink-0 text-vert-cible" />
        <span className="font-score text-[0.6rem] uppercase tracking-[0.28em] text-vert-cible">
          Sortie
        </span>
        <span className="flex items-center gap-1.5">
          {cibles.map((cible) => (
            <span
              key={cible.cle}
              className={[
                'chiffres rounded-md border border-vert-cible/45 bg-feutre/70 px-2 py-0.5',
                'text-base font-bold text-craie-vive',
              ].join(' ')}
            >
              {cible.libelle}
            </span>
          ))}
        </span>
      </div>
    )
  }

  if (aucunFinish) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-chene/50 bg-ardoise/60 px-3 py-2">
        <CircleOff aria-hidden="true" className="size-4 shrink-0 text-craie/60" />
        <span className="font-score text-sm uppercase tracking-widest text-craie/65">
          Pas de finish
        </span>
      </div>
    )
  }

  return null
}

/**
 * ZONE LECTURE — elle se lit depuis la ligne de lancer, à 2-3 mètres.
 *
 * Trois étages, du plus important au plus accessoire : les scores, la sortie
 * conseillée, puis ce qui vient de se passer.
 */
export const Tableau = ({
  state,
  resteAffiche,
  dartsEnCours,
  suggestion,
  derniere,
  noms,
  moyennes,
}: Props) => {
  const compact = state.players.length > 2

  return (
    <section aria-label="Tableau des scores" className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        {state.players.map((joueur, index) => {
          const actif = index === state.currentPlayerIndex && state.winnerId === null
          const nom = nomJoueur(noms.get(joueur.playerId) ?? null)

          return (
            <CarteJoueur
              key={joueur.playerId}
              id={joueur.playerId}
              nom={nom}
              reste={actif ? resteAffiche : joueur.remaining}
              actif={actif}
              vainqueur={state.winnerId === joueur.playerId}
              legsGagnes={joueur.legsWonInSet}
              legsRequis={state.config.legsToWin}
              setsGagnes={joueur.setsWon}
              setsRequis={state.config.setsToWin}
              moyenne={moyennes.get(joueur.playerId) ?? 0}
              dartsEnCours={dartsEnCours}
              compact={compact}
            />
          )
        })}
      </div>

      <div className="min-h-11">
        <RubanSortie
          suggestion={suggestion}
          aucunFinish={state.winnerId === null && resteAffiche > 1 && resteAffiche <= 170}
        />
      </div>

      {/* Ce qui vient de se passer — lisible par tout le monde, pas seulement
          par celui qui tape. La `key` rejoue l'animation à chaque volée. */}
      <div className="min-h-9">
        {derniere && (
          <p
            key={state.history.length}
            className={[
              'flex items-center justify-center gap-2 rounded-xl border px-3 py-1.5',
              'font-score text-sm uppercase tracking-widest',
              TON_ISSUE[derniere.outcome],
            ].join(' ')}
          >
            <span className="truncate text-craie/70">{derniere.nom}</span>
            <span aria-hidden="true" className="text-craie/30">
              ·
            </span>
            <span className="font-bold">{RESUME_ISSUE[derniere.outcome](derniere.scored)}</span>
          </p>
        )}
      </div>
    </section>
  )
}
