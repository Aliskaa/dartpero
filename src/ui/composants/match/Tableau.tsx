import { CircleOff, Target } from 'lucide-react'
import type { Visit } from '@/core/domain/entities/Visit'
import type { MatchState } from '@/core/domain/services/x01Rules'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { nomJoueur } from '@/ui/labels'
import { type Echelle, LigneJoueur, type VoleeAffichee } from './LigneJoueur'

type Props = {
  readonly state: MatchState
  readonly resteAffiche: number
  readonly dartsEnCours: readonly Dart[]
  readonly suggestion: readonly Dart[] | null
  readonly noms: ReadonlyMap<PlayerId, string>
  readonly moyennes: ReadonlyMap<PlayerId, number>
}

const ECHELLES: readonly Echelle[] = ['large', 'large', 'moyen', 'compact']

/**
 * La dernière volée de chaque joueur **dans le leg en cours**, avec le rang de
 * cette volée dans l'historique.
 *
 * Le rang sert de clé de rendu : il ne change que lorsque ce joueur-là rejoue,
 * ce qui rejoue les animations (le « pop » du score, la secousse d'un bust) au
 * bon moment — et seulement pour lui, pas à chaque volée des adversaires.
 */
const dernieresVolees = (
  state: MatchState,
): ReadonlyMap<PlayerId, { visit: Visit; rang: number }> =>
  state.history.reduce((acc, visit, rang) => {
    if (visit.legNumber === state.legNumber) acc.set(visit.playerId, { visit, rang })
    return acc
  }, new Map<PlayerId, { visit: Visit; rang: number }>())

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
 * Une ligne par joueur, toujours : la disposition ne change pas avec le nombre
 * de joueurs, seule l'échelle du score suit.
 *
 * Il n'y a **pas** de bandeau « ce qui vient de se passer » : chaque ligne porte
 * déjà sa dernière volée et son total. Seul le bust garde un signal fort — sa
 * ligne passe au rouge, ses fléchettes sont barrées et elle encaisse la
 * secousse — parce que c'est le seul cas où l'app doit annoncer que des points
 * viennent d'être retirés.
 */
export const Tableau = ({
  state,
  resteAffiche,
  dartsEnCours,
  suggestion,
  noms,
  moyennes,
}: Props) => {
  const echelle = ECHELLES[Math.min(state.players.length, ECHELLES.length) - 1] ?? 'compact'
  const volees = dernieresVolees(state)

  return (
    <section aria-label="Tableau des scores" className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {state.players.map((joueur, index) => {
          const actif = index === state.currentPlayerIndex && state.winnerId === null
          const nom = nomJoueur(noms.get(joueur.playerId) ?? null)
          const derniere = volees.get(joueur.playerId)

          // Tant que le joueur actif n'a pas planté sa première fléchette, sa
          // ligne continue d'afficher sa volée précédente — sans quoi un bust
          // en solo ne serait jamais annoncé, la main ne passant à personne.
          // Le total de la volée en cours se déduit du reste projeté : aucune
          // règle de calcul n'est réimplémentée ici.
          const volee: VoleeAffichee | null =
            actif && dartsEnCours.length > 0
              ? { darts: dartsEnCours, total: joueur.remaining - resteAffiche, outcome: null }
              : derniere
                ? {
                    darts: derniere.visit.darts,
                    total: derniere.visit.scored,
                    outcome: derniere.visit.outcome,
                  }
                : null

          return (
            <LigneJoueur
              key={`${joueur.playerId}-${derniere?.rang ?? 'debut'}`}
              id={joueur.playerId}
              nom={nom}
              reste={actif ? resteAffiche : joueur.remaining}
              actif={actif}
              vainqueur={state.winnerId === joueur.playerId}
              volee={volee}
              legsGagnes={joueur.legsWonInSet}
              legsRequis={state.config.legsToWin}
              setsGagnes={joueur.setsWon}
              setsRequis={state.config.setsToWin}
              moyenne={moyennes.get(joueur.playerId) ?? 0}
              flechettes={joueur.dartsThrownInLeg}
              echelle={echelle}
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
    </section>
  )
}
