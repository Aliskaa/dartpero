import { CircleOff } from 'lucide-react'
import type { Player } from '@/core/domain/entities/Player'
import type { Visit } from '@/core/domain/entities/Visit'
import type { X01State } from '@/core/domain/games/x01/rules'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { FeuilleMatch } from '@/ui/composants/commun/FeuilleMatch'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'
import {
  LIBELLE_JOUEUR,
  LIBELLE_MANCHES,
  LIBELLE_PAS_DE_FINISH,
  LIBELLE_RESTE,
  LIBELLE_VOLEE,
  nomJoueur,
} from '@/ui/labels'
import { type Echelle, GRILLE_LIGNE, LigneJoueur, type VoleeAffichee } from './LigneJoueur'

type Props = {
  readonly state: X01State
  readonly resteAffiche: number
  readonly dartsEnCours: readonly Dart[]
  readonly suggestion: readonly Dart[] | null
  /** Le plus haut reste qui a une sortie ce soir (170 sur un double, 180 en sortie libre). */
  readonly sortieMax: number
  readonly profils: ReadonlyMap<PlayerId, Player>
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
const dernieresVolees = (state: X01State): ReadonlyMap<PlayerId, { visit: Visit; rang: number }> =>
  state.history.reduce((acc, visit, rang) => {
    if (visit.legNumber === state.legNumber) acc.set(visit.playerId, { visit, rang })
    return acc
  }, new Map<PlayerId, { visit: Visit; rang: number }>())

/** Le checkout conseillé, en ruban : trois cibles qu'on lit de loin. */
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
      <div className="flex animate-monter items-center gap-3 border-t-2 border-vert-cible bg-vert-cible/12 px-3 py-2">
        <Pictogramme nom="sortie" taille={20} className="shrink-0 text-vert-cible" />
        <span className="entete-colonne text-vert-cible">Checkout</span>
        <span className="flex flex-1 items-center justify-end gap-2">
          {cibles.map((cible) => (
            <span
              key={cible.cle}
              className="ligne-saisie chiffres min-w-[3rem] pb-0.5 text-center text-base font-bold text-craie-vive"
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
      <div className="flex items-center gap-3 border-t border-craie/25 px-3 py-2">
        <CircleOff aria-hidden="true" className="size-4 shrink-0 text-craie-3" />
        <span className="entete-colonne">{LIBELLE_PAS_DE_FINISH}</span>
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
 * Le moment célébré n'est PAS rendu ici : l'écran le superpose au bas de
 * ce tableau, hors du flux (`MomentCelebratif`).
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
  sortieMax,
  profils,
  moyennes,
}: Props) => {
  const echelle = ECHELLES[Math.min(state.players.length, ECHELLES.length) - 1] ?? 'compact'
  const volees = dernieresVolees(state)

  return (
    <FeuilleMatch
      grille={GRILLE_LIGNE}
      nbLignes={state.players.length}
      indexActif={state.winnerId === null ? state.currentPlayerIndex : null}
      entetes={
        <>
          <span className="entete-colonne px-3 text-feutre/70">{LIBELLE_JOUEUR}</span>
          <span className="entete-colonne px-1 text-center text-feutre/70">{LIBELLE_VOLEE}</span>
          {/* « Manches » tient dans ses 44 px à 0,75 rem à condition de relâcher
              tout son interlettrage : la colonne la plus étroite. */}
          <span className="entete-colonne px-0.5 text-center tracking-normal text-feutre/70">
            {LIBELLE_MANCHES}
          </span>
          <span className="entete-colonne px-1 text-center text-feutre/70">{LIBELLE_RESTE}</span>
        </>
      }
      pied={
        <div className="min-h-11">
          <RubanSortie
            suggestion={suggestion}
            aucunFinish={state.winnerId === null && resteAffiche > 1 && resteAffiche <= sortieMax}
          />
        </div>
      }
    >
      {state.players.map((joueur, index) => {
        const actif = index === state.currentPlayerIndex && state.winnerId === null
        const profil = profils.get(joueur.playerId)
        const nom = nomJoueur(profil?.name ?? null)
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
            nom={nom}
            couleur={profil?.color ?? null}
            reste={actif ? resteAffiche : joueur.remaining}
            actif={actif}
            vainqueur={state.winnerId === joueur.playerId}
            volee={volee}
            legsGagnes={joueur.legsWonInSet}
            legsRequis={state.config.legsToWin}
            setsGagnes={joueur.setsWon}
            setsRequis={state.config.setsToWin}
            moyenne={moyennes.get(joueur.playerId) ?? 0}
            echelle={echelle}
          />
        )
      })}
    </FeuilleMatch>
  )
}
