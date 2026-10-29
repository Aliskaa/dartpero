import type { X01Summary } from '@/core/application/ports/driving/MatchSummary'
import type { VisitPreview } from '@/core/application/ports/driving/PreviewVisit'
import { rankPlayers } from '@/core/application/use-cases/rankPlayers'
import { summarize } from '@/core/application/use-cases/summarize'
import type { X01State } from '@/core/domain/games/x01/rules'
import { computeX01Stats } from '@/core/domain/games/x01/stats'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import {
  ALaLigne,
  CadreMiroir,
  CLASSES_JOUEUR_MIROIR,
  PodiumMiroir,
  styleJoueurMiroir,
  VoleeMiroir,
} from '@/ui/composants/commun/Miroir'
import {
  bandeauTermine,
  etiquetteResteDe,
  etiquetteVoleeDe,
  LIBELLE_MANCHES,
  LIBELLE_MOYENNE,
  LIBELLE_SETS,
  LIBELLE_VOLEE,
  libelleMancheEnCours,
  libelleSetEnCours,
  moyenne,
  pluriel,
  sousTitreBandeauX01,
  TITRE_BANDEAU_X01,
  TITRE_MOMENT_PARTIE,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import {
  joueurMiroir,
  nomMiroir,
  nomPartieMiroir,
  noms,
  type PropsMiroir,
} from '../../miroir/vueMiroir'

const GRILLE: Record<number, string> = {
  1: 'grid-rows-1',
  2: 'grid-rows-2 landscape:grid-rows-1 landscape:grid-cols-2',
  3: 'grid-rows-3 landscape:grid-rows-1 landscape:grid-cols-3',
  4: 'grid-rows-4 landscape:grid-rows-1 landscape:grid-cols-4',
}

const TAILLE_RESTE = (joueurs: number): string =>
  joueurs <= 2
    ? 'text-score-xl-portrait landscape:text-miroir-xl'
    : 'text-score-xl-portrait landscape:text-miroir-l'

/**
 * Le score d'un joueur en manches (et en sets si la partie en compte), pour le classement final.
 * ⚠️ `legsWon` (tout le match), jamais `legsWonInSet` : il retombe à 0 quand le dernier set est gagné.
 */
const libelleManches = (
  joueur: X01Summary['players'][number],
  manchesGagnees: ReadonlyMap<PlayerId, number>,
  sets: boolean,
): string =>
  sets
    ? pluriel(joueur.setsWon, 'set')
    : pluriel(manchesGagnees.get(joueur.playerId) ?? 0, 'manche')

/** Le X01 sur le miroir : restes géants, joueur à la ligne cerclé, volée en direct, moyenne. Sans suggestion. */
export const MiroirX01 = ({ vue }: PropsMiroir<X01State>) => {
  const services = useServices()
  const { state } = vue
  const { config } = state
  const sets = config.setsToWin > 1
  const titre = `${TITRE_BANDEAU_X01} · ${sousTitreBandeauX01(config.startingScore, config.legsToWin)}`
  const nom = nomPartieMiroir(vue)

  if (state.winnerId !== null) {
    const resume = summarize(vue.record, noms(vue))
    const classement = resume.mode === 'X01' ? rankPlayers(resume) : []
    const vainqueur = classement.find((joueur) => joueur.playerId === state.winnerId)
    const manchesGagnees = new Map(
      computeX01Stats(state).players.map((stats) => [stats.playerId, stats.legsWon]),
    )
    return (
      <CadreMiroir gauche={bandeauTermine(titre)} nom={nom}>
        <PodiumMiroir
          etiquette={TITRE_MOMENT_PARTIE}
          vainqueur={nomMiroir(vue, state.winnerId)}
          {...(vainqueur && { detail: libelleManches(vainqueur, manchesGagnees, sets) })}
          lignes={classement.map((joueur, rang) => ({
            cle: joueur.playerId,
            rang: rang + 1,
            nom: nomMiroir(vue, joueur.playerId),
            valeur: libelleManches(joueur, manchesGagnees, sets),
          }))}
        />
      </CadreMiroir>
    )
  }

  const courant = state.players[state.currentPlayerIndex]
  const apercu = (darts: readonly Dart[]): VisitPreview | null => {
    if (!courant || darts.length === 0) return null
    try {
      return services.previewVisit.execute({
        config,
        remaining: courant.remaining,
        hasOpened: courant.hasOpened,
        darts,
      })
    } catch {
      return null
    }
  }
  // Variante A : la fléchette de sortie attend « Valider la sortie » ; le reste ne bouge pas, rien de célébré.
  const complet = apercu(vue.darts)
  const enAttente =
    complet?.complete === true &&
    complet.outcome === 'CHECKOUT' &&
    complet.dartsUsed === vue.darts.length
  const comptees = enAttente ? vue.darts.slice(0, -1) : vue.darts
  const affiche = apercu(comptees)
  const resteCourant =
    affiche && affiche.outcome !== 'BUSTED' ? affiche.remainingAfter : (courant?.remaining ?? 0)
  const nomCourant = courant ? nomMiroir(vue, courant.playerId) : ''
  // La moyenne ne compte que les volées enregistrées : la volée en cours ne la fait pas bouger.
  const moyennes = new Map(
    computeX01Stats(state).players.map((stats) => [
      stats.playerId,
      stats.dartsThrown === 0 ? '—' : moyenne(stats.average3),
    ]),
  )

  return (
    <CadreMiroir
      gauche={titre}
      nom={nom}
      droite={
        sets
          ? `${libelleSetEnCours(state.setNumber + 1)} · ${libelleMancheEnCours(state.legNumber + 1)}`
          : libelleMancheEnCours(state.legNumber + 1)
      }
      volee={
        <VoleeMiroir
          libelle={courant ? etiquetteVoleeDe(nomCourant) : LIBELLE_VOLEE}
          cases={vue.darts.map((dart, rang) => ({
            libelle: DartVO.label(dart),
            enAttente: enAttente && rang === vue.darts.length - 1,
          }))}
          {...(affiche && !enAttente && { total: String(affiche.scored) })}
        />
      }
    >
      <div className={`grid min-h-0 flex-1 gap-1.5 ${GRILLE[state.players.length] ?? ''}`}>
        {state.players.map((joueur, index) => {
          const actif = index === state.currentPlayerIndex
          const profil = joueurMiroir(vue, joueur.playerId)
          const nomJoueur = nomMiroir(vue, joueur.playerId)
          return (
            <section
              key={joueur.playerId}
              aria-label={nomJoueur}
              aria-current={actif ? 'true' : undefined}
              style={styleJoueurMiroir(profil?.color ?? null, actif)}
              className={`flex min-h-0 min-w-0 flex-col justify-between px-3.5 py-2 ${CLASSES_JOUEUR_MIROIR}`}
            >
              <div className="flex items-center gap-2.5">
                <Avatar nom={nomJoueur} couleur={profil?.color ?? null} taille="ms" />
                <p className="min-w-0 flex-1 truncate font-score text-3xl uppercase leading-none tracking-[0.06em] text-craie-vive">
                  {nomJoueur}
                </p>
                {actif && <ALaLigne couleur={profil?.color ?? null} />}
              </div>
              <output
                aria-label={etiquetteResteDe(nomJoueur)}
                className={`chiffres text-center font-bold leading-none text-craie-vive ${TAILLE_RESTE(state.players.length)}`}
              >
                {actif ? resteCourant : joueur.remaining}
              </output>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 font-score text-lg uppercase tracking-[0.12em] text-craie-3">
                <span>
                  {LIBELLE_MANCHES}
                  <b className="chiffres ml-2 text-3xl text-craie-vive">{joueur.legsWonInSet}</b>
                </span>
                <span>
                  {LIBELLE_MOYENNE}
                  <b className="chiffres ml-2 text-3xl text-craie-vive">
                    {moyennes.get(joueur.playerId) ?? '—'}
                  </b>
                </span>
                {sets && (
                  <span>
                    {LIBELLE_SETS}
                    <b className="chiffres ml-2 text-3xl text-craie-vive">{joueur.setsWon}</b>
                  </span>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </CadreMiroir>
  )
}
