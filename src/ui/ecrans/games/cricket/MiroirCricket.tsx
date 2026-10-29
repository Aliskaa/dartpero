import { rankPlayers } from '@/core/application/use-cases/rankPlayers'
import { summarize } from '@/core/application/use-cases/summarize'
import { CricketRules, type CricketState } from '@/core/domain/games/cricket/rules'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import {
  ALaLigne,
  CadreMiroir,
  CLASSES_JOUEUR_MIROIR,
  PodiumMiroir,
  styleJoueurMiroir,
  VoleeMiroir,
} from '@/ui/composants/commun/Miroir'
import { etatLisible, libelleColonne, Marques } from '@/ui/composants/cricket/TableauCricket'
import {
  bandeauTermine,
  etiquettePointsDe,
  etiquetteVoleeDe,
  LIBELLE_CIBLES,
  LIBELLE_PTS,
  libelleCricketMiroir,
  libelleVoleeNumero,
  plusMarques,
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

// Portrait : le nom au-dessus du score (une colonne fait 60 à 120 px) ; paysage : côte à côte.
const ENTETE_JOUEUR =
  'flex h-20 shrink-0 flex-col items-start justify-center gap-0.5 border-b border-craie/25 px-3 landscape:h-14 landscape:flex-row landscape:items-center landscape:justify-between landscape:gap-2'

/** Le Cricket sur le miroir : les joueurs de part et d'autre de la colonne des cibles, marques et points en direct. */
export const MiroirCricket = ({ vue }: PropsMiroir<CricketState>) => {
  const services = useServices()
  const { state } = vue
  const titre = libelleCricketMiroir(state.config.variant)
  const nom = nomPartieMiroir(vue)

  if (state.finished) {
    const resume = summarize(vue.record, noms(vue))
    const classement = resume.mode === 'CRICKET' ? rankPlayers(resume) : []
    const vainqueur = classement.find((joueur) => joueur.playerId === state.winnerId)
    return (
      <CadreMiroir gauche={bandeauTermine(titre)} nom={nom}>
        <PodiumMiroir
          etiquette={TITRE_MOMENT_PARTIE}
          vainqueur={state.winnerId === null ? '' : nomMiroir(vue, state.winnerId)}
          {...(vainqueur && { detail: `${vainqueur.score} ${LIBELLE_PTS}` })}
          lignes={classement.map((joueur, rang) => ({
            cle: joueur.playerId,
            rang: rang + 1,
            nom: nomMiroir(vue, joueur.playerId),
            valeur: `${joueur.score} ${LIBELLE_PTS}`,
          }))}
        />
      </CadreMiroir>
    )
  }

  const apercu = (darts: readonly Dart[]) => {
    try {
      return services.previewCricketVisit.execute({ state, darts })
    } catch {
      return { state, complete: false }
    }
  }
  // La fléchette qui gagne attend « Valider la sortie » : montrée en pointillé, sans être comptée.
  const enAttente = vue.darts.length > 0 && apercu(vue.darts).state.finished
  const comptees = enAttente ? vue.darts.slice(0, -1) : vue.darts
  const affiche = apercu(comptees).state
  const volee = comptees.length > 0 ? affiche.history.at(-1) : undefined
  const courant = state.players[state.currentPlayerIndex]
  const nomCourant = courant ? nomMiroir(vue, courant.playerId) : ''

  const moitie = Math.ceil(affiche.players.length / 2)
  const colonnes = `repeat(${moitie}, minmax(0, 1fr)) 7.5rem repeat(${affiche.players.length - moitie}, minmax(0, 1fr))`
  const cibles = state.config.targets
  // À 3 ou 4 joueurs, une colonne est trop étroite pour « À la ligne » : une barre pleine à la couleur du joueur.
  const colonnesEtroites = affiche.players.length > 2

  const colonneJoueur = (index: number) => {
    const joueur = affiche.players[index]
    if (!joueur) return null
    const profil = joueurMiroir(vue, joueur.playerId)
    const nomJoueur = nomMiroir(vue, joueur.playerId)
    const actif = index === state.currentPlayerIndex
    return (
      <section
        key={joueur.playerId}
        aria-label={nomJoueur}
        aria-current={actif ? 'true' : undefined}
        style={styleJoueurMiroir(profil?.color ?? null, actif)}
        className={`flex min-h-0 min-w-0 flex-col ${CLASSES_JOUEUR_MIROIR}`}
      >
        <div className="h-6 shrink-0">
          {actif && <ALaLigne couleur={profil?.color ?? null} barre={colonnesEtroites} />}
        </div>
        <div className={ENTETE_JOUEUR}>
          <p className="w-full min-w-0 truncate font-score text-lg uppercase text-craie-vive landscape:w-auto landscape:text-2xl">
            {nomJoueur}
          </p>
          <output
            aria-label={etiquettePointsDe(nomJoueur)}
            className="chiffres text-score-m font-bold leading-none text-craie-vive"
          >
            {joueur.score}
          </output>
        </div>
        {cibles.map((cible, rang) => {
          const marques = joueur.marks[rang] ?? 0
          const morte = CricketRules.isDead(affiche, rang)
          return (
            <span
              key={String(cible)}
              role="img"
              aria-label={`${libelleColonne(cible)} : ${etatLisible(marques, morte)}`}
              className="flex min-h-0 flex-1 items-center justify-center border-b border-craie/12 last:border-b-0"
            >
              <Marques marques={marques} morte={morte} petite={false} grande />
            </span>
          )
        })}
      </section>
    )
  }

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
          {...(volee && { total: plusMarques(volee.marks) })}
        />
      }
    >
      <div className="grid min-h-0 flex-1 gap-1.5" style={{ gridTemplateColumns: colonnes }}>
        {affiche.players.slice(0, moitie).map((_, index) => colonneJoueur(index))}
        <div className="flex min-h-0 flex-col bg-feutre-nuit">
          <div className="h-6 shrink-0" />
          <p className="flex h-20 shrink-0 items-center justify-center font-score text-sm uppercase tracking-[0.14em] text-laiton-clair landscape:h-14">
            {LIBELLE_CIBLES}
          </p>
          {cibles.map((cible) => (
            <p
              key={String(cible)}
              className="chiffres flex min-h-0 flex-1 items-center justify-center text-2xl font-bold text-laiton-clair"
            >
              {libelleColonne(cible)}
            </p>
          ))}
        </div>
        {affiche.players.slice(moitie).map((_, index) => colonneJoueur(moitie + index))}
      </div>
    </CadreMiroir>
  )
}
