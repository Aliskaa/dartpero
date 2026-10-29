import type { CheckoutPracticeState } from '@/core/domain/games/checkout-practice/rules'
import { Dart as DartVO } from '@/core/domain/value-objects/Dart'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { CadreMiroir, styleJoueurMiroir, VoleeMiroir } from '@/ui/composants/commun/Miroir'
import { resteEntrainement } from '@/ui/hooks/resteEntrainement'
import {
  bandeauTermine,
  ETIQUETTE_RESTE_ENTRAINEMENT,
  LIBELLE_RESTE,
  LIBELLE_REUSSIS,
  LIBELLE_TAUX,
  LIBELLE_VOLEE,
  libelleEntrainementMiroir,
  libelleMancheSurTotal,
  pourcent,
  reussisSur,
} from '@/ui/labels'
import { joueurMiroir, nomMiroir, nomPartieMiroir, type PropsMiroir } from '../../miroir/vueMiroir'

/** L'entraînement sur le miroir : le reste tiré en très grand, le compte des checkouts réussis. Jamais de bandeau. */
export const MiroirEntrainement = ({ vue }: PropsMiroir<CheckoutPracticeState>) => {
  const { state } = vue
  const titre = libelleEntrainementMiroir(state.config.rounds)
  const profil = joueurMiroir(vue, state.playerId)
  const nomJoueur = nomMiroir(vue, state.playerId)
  const cible = state.current?.target ?? null
  const reste = resteEntrainement(cible, vue.darts)
  const numero = Math.min(state.roundsPlayed + 1, state.config.rounds)

  return (
    <CadreMiroir
      gauche={state.finished ? bandeauTermine(titre) : titre}
      nom={nomPartieMiroir(vue)}
      droite={libelleMancheSurTotal(numero, state.config.rounds)}
      {...(!state.finished && {
        volee: (
          <VoleeMiroir
            libelle={LIBELLE_VOLEE}
            cases={vue.darts.map((dart) => ({ libelle: DartVO.label(dart) }))}
            {...(vue.darts.length > 0 && {
              total: String(vue.darts.reduce((total, dart) => total + DartVO.points(dart), 0)),
            })}
          />
        ),
      })}
    >
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-1.5 landscape:grid-cols-2 landscape:grid-rows-1">
        <section className="flex min-h-0 flex-col items-center justify-center border-t-5 border-laiton bg-ardoise">
          <span className="font-score text-sm font-bold uppercase tracking-[0.2em] text-laiton-clair">
            {LIBELLE_RESTE}
          </span>
          <output
            aria-label={ETIQUETTE_RESTE_ENTRAINEMENT}
            className="chiffres text-score-xl-portrait font-bold leading-none text-craie-vive landscape:text-miroir-solo"
          >
            {cible === null ? '—' : reste}
          </output>
        </section>
        <section
          aria-label={nomJoueur}
          style={styleJoueurMiroir(profil?.color ?? null, false)}
          className="flex min-h-0 flex-col justify-between border-t-5 bg-ardoise px-3.5 py-2"
        >
          <div className="flex items-center gap-2.5">
            <Avatar nom={nomJoueur} couleur={profil?.color ?? null} taille="ms" />
            <p className="min-w-0 truncate font-score text-3xl uppercase text-craie-vive">
              {nomJoueur}
            </p>
          </div>
          <p className="chiffres text-center text-score-xl-portrait font-bold leading-none text-craie-vive">
            {reussisSur(state.roundsWon, state.roundsPlayed)}
          </p>
          <div className="flex justify-between font-score text-sm uppercase tracking-[0.12em] text-craie-3">
            <span>{LIBELLE_REUSSIS}</span>
            <span>
              {LIBELLE_TAUX}
              <b className="ml-1 text-lg text-craie-vive">
                {pourcent(state.successPercent, state.roundsPlayed)}
              </b>
            </span>
          </div>
        </section>
      </div>
    </CadreMiroir>
  )
}
