import { KillerRules, type KillerState } from '@/core/domain/games/killer/rules'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
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
  etiquetteNumeroDe,
  etiquetteViesDe,
  etiquetteVoleeDe,
  LIBELLE_BADGE_KILLER,
  libelleVoleeNumero,
  lisibleVies,
  sousLigneDernierEnVie,
  sousLigneElimination,
  surtitreResumeKiller,
  TITRE_MOMENT_PARTIE,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'
import { joueurMiroir, nomMiroir, nomPartieMiroir, type PropsMiroir } from '../../miroir/vueMiroir'

const GRILLE: Record<number, string> = {
  2: 'grid-cols-1 grid-rows-2 landscape:grid-cols-2 landscape:grid-rows-1',
  3: 'grid-cols-1 grid-rows-3 landscape:grid-cols-3 landscape:grid-rows-1',
  4: 'grid-cols-2 grid-rows-2',
  5: 'grid-cols-2 grid-rows-3 landscape:grid-cols-3 landscape:grid-rows-2',
  6: 'grid-cols-2 grid-rows-3 landscape:grid-cols-3 landscape:grid-rows-2',
}

/** Le Killer sur le miroir : numéro en grand, vies en carrés ; « Éliminée par X » accordé, comme au résumé. */
export const MiroirKiller = ({ vue }: PropsMiroir<KillerState>) => {
  const services = useServices()
  const { state } = vue
  const vies = state.config.startingLives
  const titre = surtitreResumeKiller(vies)
  const nom = nomPartieMiroir(vue)

  // L'accord d'« éliminé » suit le genre de l'éliminé, envoyé par la saisie pour le seul Killer.
  const sousLigne = (etat: KillerState, id: PlayerId): string | undefined => {
    const elimination = etat.eliminations.find((e) => e.playerId === id)
    if (!elimination) return undefined
    const genre = joueurMiroir(vue, id)?.gender
    return sousLigneElimination(
      genre,
      elimination.by === id ? null : nomMiroir(vue, elimination.by),
    )
  }

  if (state.finished) {
    const gagnant = state.players.find((joueur) => joueur.playerId === state.winnerId)
    return (
      <CadreMiroir gauche={bandeauTermine(titre)} nom={nom}>
        <PodiumMiroir
          etiquette={TITRE_MOMENT_PARTIE}
          vainqueur={state.winnerId === null ? '' : nomMiroir(vue, state.winnerId)}
          {...(gagnant && { detail: sousLigneDernierEnVie(gagnant.lives) })}
          lignes={KillerRules.ranking(state).map((rang) => {
            const sous = sousLigne(state, rang.playerId)
            return {
              cle: rang.playerId,
              rang: rang.rank,
              nom: nomMiroir(vue, rang.playerId),
              ...(sous && { sous }),
            }
          })}
        />
      </CadreMiroir>
    )
  }

  const apercu = (darts: readonly Dart[]) => {
    try {
      return services.previewKillerVisit.execute({ state, darts })
    } catch {
      return { state, complete: false, visit: null }
    }
  }
  // La fléchette qui élimine le dernier adversaire attend « Valider la sortie » : rien n'est compté ni célébré.
  const enAttente = vue.darts.length > 0 && apercu(vue.darts).state.finished
  const comptees = enAttente ? vue.darts.slice(0, -1) : vue.darts
  const { state: affiche, visit } = apercu(comptees)
  const devientKiller =
    comptees.length > 0 && (visit?.effects.some((effet) => effet.type === 'BECAME_KILLER') ?? false)
  const courant = state.players[state.currentPlayerIndex]
  const nomCourant = courant ? nomMiroir(vue, courant.playerId) : ''

  return (
    <CadreMiroir
      gauche={titre}
      nom={nom}
      droite={libelleVoleeNumero(state.history.length + 1)}
      volee={
        <VoleeMiroir
          libelle={etiquetteVoleeDe(nomCourant)}
          cases={vue.darts.map((dart, rang) => ({
            libelle: DartVO.label(dart),
            enAttente: enAttente && rang === vue.darts.length - 1,
          }))}
          {...(devientKiller && { total: LIBELLE_BADGE_KILLER })}
        />
      }
    >
      <div className={`grid min-h-0 flex-1 gap-1.5 ${GRILLE[affiche.players.length] ?? ''}`}>
        {affiche.players.map((joueur, index) => {
          const profil = joueurMiroir(vue, joueur.playerId)
          const nomJoueur = nomMiroir(vue, joueur.playerId)
          const motif = joueur.eliminated ? sousLigne(affiche, joueur.playerId) : undefined
          const actif = index === state.currentPlayerIndex && !joueur.eliminated
          return (
            <section
              key={joueur.playerId}
              aria-label={nomJoueur}
              aria-current={actif ? 'true' : undefined}
              style={styleJoueurMiroir(profil?.color ?? null, index === state.currentPlayerIndex)}
              className={`flex min-h-0 min-w-0 flex-col justify-between px-3 py-2 ${CLASSES_JOUEUR_MIROIR}`}
            >
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <p className="min-w-0 truncate font-score text-2xl uppercase text-craie-vive">
                  {nomJoueur}
                </p>
                {joueur.killer && !joueur.eliminated && (
                  <span className="shrink-0 bg-laiton px-2 py-0.5 font-score text-base font-bold uppercase tracking-[0.14em] text-sur-laiton">
                    {LIBELLE_BADGE_KILLER}
                  </span>
                )}
                {actif && <ALaLigne couleur={profil?.color ?? null} />}
              </div>
              <output
                aria-label={etiquetteNumeroDe(nomJoueur)}
                className={[
                  'chiffres text-score-solo font-bold leading-none',
                  joueur.eliminated ? 'text-craie-3 line-through decoration-4' : 'text-craie-vive',
                ].join(' ')}
              >
                {joueur.number}
              </output>
              {motif ? (
                <p className="font-score text-lg uppercase tracking-widest text-rouge-touche">
                  {motif}
                </p>
              ) : (
                <span
                  role="img"
                  aria-label={`${etiquetteViesDe(nomJoueur)} : ${lisibleVies(joueur.lives, vies - joueur.lives)}`}
                  className="flex gap-1.5"
                >
                  {Array.from({ length: vies }, (_, rang) => (
                    <i
                      // biome-ignore lint/suspicious/noArrayIndexKey: une rangée de carrés identiques, sans identité
                      key={rang}
                      className={`size-6 transition-colors duration-(--duration-vif) ease-(--ease-sec) ${
                        rang < joueur.lives ? 'bg-rouge-cible' : 'border-2 border-craie/25'
                      }`}
                    />
                  ))}
                </span>
              )}
            </section>
          )
        })}
      </div>
    </CadreMiroir>
  )
}
