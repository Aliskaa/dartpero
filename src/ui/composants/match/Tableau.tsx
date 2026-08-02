import type { VisitOutcome } from '@/core/domain/entities/Visit'
import type { MatchState } from '@/core/domain/services/x01Rules'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { moyenne, nomJoueur } from '@/ui/labels'

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

/**
 * ZONE LECTURE — elle se lit depuis la ligne de lancer, à 2-3 mètres.
 *
 * Règle de la charte : les chiffres du tableau sont en craie quasi-blanche sur
 * feutre sombre. Le bois et le laiton restent sur le cadre, jamais derrière un
 * score.
 */
export const Tableau = ({
  state,
  resteAffiche,
  dartsEnCours,
  suggestion,
  derniere,
  noms,
  moyennes,
}: Props) => (
  <section aria-label="Tableau des scores" className="flex flex-col gap-3">
    <div className="grid grid-cols-2 gap-3">
      {state.players.map((joueur, index) => {
        const actif = index === state.currentPlayerIndex && state.winnerId === null
        const nom = nomJoueur(noms.get(joueur.playerId) ?? null)

        return (
          <div
            key={joueur.playerId}
            aria-current={actif ? 'true' : undefined}
            className={[
              'ardoise-craie rounded-2xl px-3 py-4 text-center transition',
              actif
                ? 'ring-2 ring-laiton shadow-[0_0_24px_-6px_var(--color-laiton)]'
                : 'opacity-80',
            ].join(' ')}
          >
            <p
              className={`truncate font-score text-sm uppercase tracking-widest ${
                actif ? 'text-laiton' : 'text-craie/70'
              }`}
            >
              {nom}
            </p>

            <output
              aria-label={`Score restant de ${nom}`}
              className="chiffres mt-1 block text-6xl font-bold leading-none text-craie-vive"
            >
              {actif ? resteAffiche : joueur.remaining}
            </output>

            <p className="mt-2 font-score text-xs uppercase tracking-widest text-craie/70">
              {joueur.legsWonInSet} leg{joueur.legsWonInSet > 1 ? 's' : ''}
              {state.config.setsToWin > 1 ? ` · ${joueur.setsWon} set` : ''}
              {` · moy ${moyenne(moyennes.get(joueur.playerId) ?? 0)}`}
            </p>

            {actif && (
              <output
                className="mt-2 flex items-center justify-center gap-1.5"
                aria-label="Volée en cours"
              >
                {[0, 1, 2].map((rang) => {
                  const dart = dartsEnCours[rang]
                  return (
                    <span
                      key={rang}
                      className={`chiffres min-w-10 rounded-md px-1 py-0.5 text-xs ${
                        dart
                          ? 'bg-laiton/25 text-craie-vive'
                          : 'border border-craie/25 text-craie/25'
                      }`}
                    >
                      {dart ? DartVO.label(dart) : '·'}
                    </span>
                  )
                })}
              </output>
            )}
          </div>
        )
      })}
    </div>

    {/* Sortie conseillée du joueur en cours. */}
    <div className="min-h-8 text-center">
      {suggestion ? (
        <p className="font-score text-lg tracking-wide text-vert-cible">
          → {suggestion.map(DartVO.label).join(' · ')}
        </p>
      ) : state.winnerId === null && resteAffiche > 1 && resteAffiche <= 170 ? (
        <p className="font-score text-sm uppercase tracking-widest text-craie/60">Pas de finish</p>
      ) : null}
    </div>

    {/* Ce qui vient de se passer — lisible par tout le monde, pas seulement par celui qui tape. */}
    <div className="min-h-6 text-center">
      {derniere && (
        <p
          className={`font-score text-sm uppercase tracking-widest ${
            derniere.outcome === 'BUSTED' ? 'text-rouge-cible' : 'text-craie/70'
          }`}
        >
          {derniere.nom} · {RESUME_ISSUE[derniere.outcome](derniere.scored)}
        </p>
      )}
    </div>
  </section>
)
