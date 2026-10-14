import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { BadgeBandeau, BandeauMatch } from '@/ui/composants/commun/BandeauMatch'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { FeuilleMatch } from '@/ui/composants/commun/FeuilleMatch'
import { MomentCelebratif } from '@/ui/composants/commun/MomentCelebratif'
import { GRILLE_TOUR_DU_MONDE, LigneCible } from '@/ui/composants/tour-du-monde/LigneCible'
import { PaveCibles } from '@/ui/composants/tour-du-monde/PaveCibles'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
import { useTourDuMonde } from '@/ui/hooks/useTourDuMonde'
import {
  etiquetteVoleeLigne,
  LIBELLE_CIBLE,
  LIBELLE_DERNIER_TOUR,
  LIBELLE_JOUEUR,
  LIBELLE_PARCOURS,
  nomJoueur,
  pluriel,
  sousTitreBandeauTourDuMonde,
  TITRE_BANDEAU_TOUR_DU_MONDE,
} from '@/ui/labels'

export const TourDuMondeEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const nomPartie = useNomDePartie(identifiant)
  const navigate = useNavigate()
  const profils = useProfils()

  const partie = useTourDuMonde(identifiant)
  const { state, affiche, termine } = partie

  useWakeLock(state !== null && !termine)

  useEffect(() => {
    if (termine) navigate(`/partie/${identifiant}/resume`, { replace: true })
  }, [termine, identifiant, navigate])

  if (partie.chargement) return <Spinner label="Chargement de la partie…" />

  if (partie.erreurChargement || !state || !affiche || !partie.joueurCourant) {
    return (
      <EcranErreur
        message="Cette partie est introuvable."
        action={
          <Link
            to="/"
            className="font-score text-sm uppercase tracking-widest text-laiton underline"
          >
            Retour à l’accueil
          </Link>
        }
      />
    )
  }

  const total = state.config.targets.length
  // La dernière volée de chaque joueur : ce qu'il a écrit la dernière fois qu'il a lancé.
  const dernieres = state.history.reduce(
    (acc, volee) => acc.set(volee.playerId, volee.darts),
    new Map<PlayerId, readonly Dart[]>(),
  )

  const tour = partie.derniereVolee?.milestones.find((m) => m.type === 'TourCompleted')
  const moment =
    tour && tour.type === 'TourCompleted'
      ? {
          cle: `tour-${tour.playerId}-${tour.darts}`,
          titre: 'Bouclé !',
          detail: `${nomJoueur(profils.get(tour.playerId)?.name ?? null)} · ${pluriel(tour.darts, 'fléchette', 'fléchettes')}`,
        }
      : null

  return (
    <DispositionPartie
      nomPartie={nomPartie}
      enTete={
        <BandeauMatch
          pictogramme="tour-du-monde"
          titre={TITRE_BANDEAU_TOUR_DU_MONDE}
          sousTitre={sousTitreBandeauTourDuMonde(total)}
          droite={state.lastRound && <BadgeBandeau>{LIBELLE_DERNIER_TOUR}</BadgeBandeau>}
        />
      }
      saisie={
        <PaveCibles
          onFlechette={partie.ajouterFlechette}
          onAnnuler={() => void partie.annuler()}
          peutAnnuler={partie.peutAnnuler}
          annulation={partie.annulation}
        />
      }
    >
      {/* Le moment est superposé au bas de la feuille, hors du flux. */}
      <div className="relative">
        <FeuilleMatch
          grille={GRILLE_TOUR_DU_MONDE}
          nbLignes={affiche.players.length}
          indexActif={state.finished ? null : state.currentPlayerIndex}
          entetes={
            <>
              <span className="entete-colonne px-3 text-feutre/70">{LIBELLE_JOUEUR}</span>
              <span className="entete-colonne filet-colonne-entete px-1 text-center text-feutre/70">
                {LIBELLE_PARCOURS}
              </span>
              <span className="entete-colonne filet-colonne-entete px-1 text-center text-feutre/70">
                {LIBELLE_CIBLE}
              </span>
            </>
          }
        >
          {affiche.players.map((joueur, index) => {
            // Le tableau affiché intègre la volée en cours ; la main, elle, se lit
            // sur l'état réel — c'est encore au même joueur de jouer.
            const actif = index === state.currentPlayerIndex && !state.finished
            const profil = profils.get(joueur.playerId)
            const nom = nomJoueur(profil?.name ?? null)
            const enSaisie = actif && partie.dartsEnCours.length > 0

            return (
              <LigneCible
                key={joueur.playerId}
                nom={nom}
                couleur={profil?.color ?? null}
                cible={state.config.targets[joueur.targetIndex] ?? null}
                validees={joueur.targetIndex}
                total={total}
                flechettes={joueur.dartsThrown}
                actif={actif}
                vainqueur={state.winnerId === joueur.playerId}
                nbJoueurs={affiche.players.length}
                volee={enSaisie ? partie.dartsEnCours : (dernieres.get(joueur.playerId) ?? [])}
                etiquetteVolee={etiquetteVoleeLigne(enSaisie, nom)}
              />
            )
          })}
        </FeuilleMatch>

        {/* Sous la feuille en portrait : 44 px sur la dernière ligne en masqueraient
            la cible et la volée (mesuré à quatre joueurs : 41 px sur 80). */}
        <MomentCelebratif moment={moment} ancrage="sous" />
      </div>
      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}{' '}
    </DispositionPartie>
  )
}
