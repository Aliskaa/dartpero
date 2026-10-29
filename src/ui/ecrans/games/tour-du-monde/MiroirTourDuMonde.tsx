import { rankPlayers } from '@/core/application/use-cases/rankPlayers'
import { summarize } from '@/core/application/use-cases/summarize'
import { TourDuMondeRules, type TourDuMondeState } from '@/core/domain/games/tour-du-monde/rules'
import type { Dart } from '@/core/domain/value-objects/Dart'
import { Avatar } from '@/ui/composants/commun/Avatar'
import {
  ALaLigne,
  CadreMiroir,
  CLASSES_JOUEUR_MIROIR,
  PodiumMiroir,
  styleJoueurMiroir,
  VoleeMiroir,
} from '@/ui/composants/commun/Miroir'
import { libelleCible } from '@/ui/composants/tour-du-monde/LigneCible'
import { couleurJoueur } from '@/ui/couleurs'
import {
  bandeauTermine,
  etiquetteCibleDe,
  etiquetteVoleeDe,
  LIBELLE_CIBLE,
  LIBELLE_DERNIER_TOUR,
  LIBELLE_FLECHETTES,
  LIBELLE_MATCH_NUL,
  libelleFlechetteTourDuMonde,
  libelleVoleeNumero,
  pluriel,
  plusCibles,
  sousTitreBandeauTourDuMonde,
  TITRE_BANDEAU_TOUR_DU_MONDE,
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

const flechettes = (nombre: number): string => pluriel(nombre, 'fléchette')

/** Le Tour du monde sur le miroir : une ligne par joueur, sa cible en grand et sa piste de 21 cases. */
export const MiroirTourDuMonde = ({ vue }: PropsMiroir<TourDuMondeState>) => {
  const services = useServices()
  const { state } = vue
  const cibles = state.config.targets
  const titre = `${TITRE_BANDEAU_TOUR_DU_MONDE} · ${sousTitreBandeauTourDuMonde(cibles.length)}`
  const nom = nomPartieMiroir(vue)

  if (state.finished) {
    const resume = summarize(vue.record, noms(vue))
    const classement = resume.mode === 'TOUR_DU_MONDE' ? rankPlayers(resume) : []
    const vainqueur = classement.find((joueur) => joueur.playerId === state.winnerId)
    return (
      <CadreMiroir gauche={bandeauTermine(titre)} nom={nom}>
        <PodiumMiroir
          etiquette={TITRE_MOMENT_PARTIE}
          vainqueur={state.winnerId === null ? LIBELLE_MATCH_NUL : nomMiroir(vue, state.winnerId)}
          {...(vainqueur?.finishedInDarts != null && {
            detail: flechettes(vainqueur.finishedInDarts),
          })}
          lignes={classement.map((joueur, rang) => ({
            cle: joueur.playerId,
            rang: rang + 1,
            nom: nomMiroir(vue, joueur.playerId),
            valeur:
              joueur.finishedInDarts === null
                ? `${joueur.targetIndex} / ${cibles.length}`
                : flechettes(joueur.finishedInDarts),
          }))}
        />
      </CadreMiroir>
    )
  }

  const apercu = (darts: readonly Dart[]) => {
    try {
      return services.previewTourDuMondeVisit.execute({ state, darts })
    } catch {
      return { state, complete: false, completesTour: false }
    }
  }
  // La fléchette qui boucle attend « Valider la sortie » : montrée en pointillé, sans être comptée.
  const enAttente = vue.darts.length > 0 && apercu(vue.darts).completesTour
  const comptees = enAttente ? vue.darts.slice(0, -1) : vue.darts
  const affiche = apercu(comptees).state
  const volee = comptees.length > 0 ? affiche.history.at(-1) : undefined
  const courant = state.players[state.currentPlayerIndex]
  const nomCourant = courant ? nomMiroir(vue, courant.playerId) : ''

  return (
    <CadreMiroir
      gauche={titre}
      nom={nom}
      droite={state.lastRound ? LIBELLE_DERNIER_TOUR : libelleVoleeNumero(state.history.length + 1)}
      volee={
        <VoleeMiroir
          libelle={etiquetteVoleeDe(nomCourant)}
          cases={vue.darts.map((dart, rang) => ({
            libelle: libelleFlechetteTourDuMonde(dart),
            enAttente: enAttente && rang === vue.darts.length - 1,
          }))}
          {...(volee && { total: plusCibles(volee.hits) })}
        />
      }
    >
      <div
        className="grid min-h-0 flex-1 gap-1.5"
        style={{ gridTemplateRows: `repeat(${affiche.players.length}, minmax(0, 1fr))` }}
      >
        {affiche.players.map((joueur, index) => {
          const profil = joueurMiroir(vue, joueur.playerId)
          const nomJoueur = nomMiroir(vue, joueur.playerId)
          const actif = index === state.currentPlayerIndex
          return (
            <section
              key={joueur.playerId}
              aria-label={nomJoueur}
              aria-current={actif ? 'true' : undefined}
              style={styleJoueurMiroir(profil?.color ?? null, actif)}
              className={`grid min-h-0 grid-cols-[2.25rem_minmax(0,1fr)_6rem] items-center gap-x-3.5 px-3.5 landscape:grid-cols-[2.25rem_11rem_7rem_minmax(0,1fr)_6rem] ${CLASSES_JOUEUR_MIROIR}`}
            >
              <Avatar nom={nomJoueur} couleur={profil?.color ?? null} taille="ms" />
              <div className="flex min-w-0 flex-col items-start gap-1">
                <p className="w-full min-w-0 truncate font-score text-2xl uppercase text-craie-vive">
                  {nomJoueur}
                </p>
                {actif && <ALaLigne couleur={profil?.color ?? null} />}
              </div>
              <p className="text-center font-score text-sm uppercase tracking-[0.14em] text-craie-3">
                {LIBELLE_CIBLE}
                <output
                  aria-label={etiquetteCibleDe(nomJoueur)}
                  className="chiffres block text-score-l font-bold leading-none tracking-normal text-craie-vive"
                >
                  {libelleCible(TourDuMondeRules.currentTarget(affiche, joueur))}
                </output>
              </p>
              <div
                aria-hidden="true"
                className="col-span-2 hidden gap-0.5 landscape:col-span-1 landscape:grid landscape:grid-cols-21"
              >
                {cibles.map((cible, rang) => (
                  <i
                    key={String(cible)}
                    style={
                      rang === joueur.targetIndex
                        ? { backgroundColor: couleurJoueur(profil?.color ?? null).bord }
                        : undefined
                    }
                    className={[
                      'h-5.5',
                      rang < joueur.targetIndex
                        ? 'bg-vert-cible'
                        : rang === joueur.targetIndex
                          ? ''
                          : 'bg-craie/25',
                    ].join(' ')}
                  />
                ))}
              </div>
              <p className="hidden text-right font-score text-lg uppercase tracking-[0.12em] text-craie-3 landscape:block">
                {LIBELLE_FLECHETTES}
                <b className="chiffres block text-3xl tracking-normal text-craie-vive">
                  {joueur.dartsThrown}
                </b>
              </p>
            </section>
          )
        })}
      </div>
    </CadreMiroir>
  )
}
