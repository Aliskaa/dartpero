import { Fragment, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MARKS_TO_CLOSE } from '@/core/domain/games/cricket/config'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { BandeauMatch } from '@/ui/composants/commun/BandeauMatch'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { MomentCelebratif } from '@/ui/composants/commun/MomentCelebratif'
import { PaveCricket } from '@/ui/composants/cricket/PaveCricket'
import { TableauCricket } from '@/ui/composants/cricket/TableauCricket'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useCricket } from '@/ui/hooks/useCricket'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
import {
  LIBELLE_CONDITION_CRICKET,
  nomJoueur,
  sousTitreBandeauCricket,
  TITRE_BANDEAU_CRICKET,
} from '@/ui/labels'

export const CricketEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const nomPartie = useNomDePartie(identifiant)
  const navigate = useNavigate()
  const profils = useProfils()

  const partie = useCricket(identifiant)
  const { state, termine } = partie

  useWakeLock(state !== null && !termine)

  useEffect(() => {
    if (termine) navigate(`/partie/${identifiant}/resume`, { replace: true })
  }, [termine, identifiant, navigate])

  if (partie.chargement) return <Spinner label="Chargement de la partie…" />

  if (partie.erreurChargement || !state || !partie.joueurCourant) {
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

  const cutThroat = state.config.variant === 'CUT_THROAT'
  // Le tableau affiché intègre la volée en cours ; la main, elle, se lit sur
  // l'état réel — c'est encore au même joueur de jouer tant qu'il n'a pas fini.
  const affiche = partie.affiche ?? state
  const mortes = state.config.targets.map((_, index) =>
    affiche.players.every((joueur) => (joueur.marks[index] ?? 0) >= MARKS_TO_CLOSE),
  )

  const fermeture = partie.derniereVolee?.milestones.find((m) => m.type === 'TargetClosed')
  const partieGagnee = partie.derniereVolee?.milestones.find((m) => m.type === 'MatchFinished')
  const moment = partieGagnee
    ? {
        cle: `partie-${partie.derniereVolee?.state.history.length}`,
        titre: 'Partie !',
        detail: nomJoueur(profils.get(partieGagnee.winnerId)?.name ?? null),
      }
    : fermeture && fermeture.type === 'TargetClosed'
      ? {
          cle: `ferme-${fermeture.target}-${partie.derniereVolee?.state.history.length}`,
          titre: 'Fermée !',
          detail: fermeture.target === 'BULL' ? 'Bulle' : String(fermeture.target),
        }
      : null

  // La volée écrite sur la dernière ligne : celle en cours si une fléchette est
  // déjà plantée, sinon celle du joueur précédent (avec son nom), sinon — au
  // tout début — les cases vides du joueur qui va lancer. Aucune règle ici : on
  // lit la liste des fléchettes et l'historique, rien d'autre.
  const derniere = state.history.at(-1)
  const proprietaire =
    partie.dartsEnCours.length === 0 && derniere ? derniere.playerId : partie.joueurCourant.playerId
  const volee = {
    nom: nomJoueur(profils.get(proprietaire)?.name ?? null),
    darts: partie.dartsEnCours.length === 0 && derniere ? derniere.darts : partie.dartsEnCours,
  }
  return (
    <DispositionPartie
      nomPartie={nomPartie}
      enTete={
        <BandeauMatch
          pictogramme="cricket"
          titre={TITRE_BANDEAU_CRICKET}
          sousTitre={sousTitreBandeauCricket(state.config.variant, state.config.targets.length)}
          droite={LIBELLE_CONDITION_CRICKET[state.config.variant].map((ligne, rang) => (
            <Fragment key={ligne}>
              {/* Un espace entre les lignes : invisible (flex), mais le texte se lit
                  « Le plus bas gagne » d'une traite. */}
              {rang > 0 && ' '}
              <span className="whitespace-nowrap">{ligne}</span>
            </Fragment>
          ))}
        />
      }
      saisie={
        <PaveCricket
          cibles={state.config.targets}
          multiplicateur={partie.multiplicateur}
          onMultiplicateur={partie.setMultiplicateur}
          onFlechette={partie.ajouterFlechette}
          onAnnuler={() => void partie.annuler()}
          peutAnnuler={partie.peutAnnuler}
          annulation={partie.annulation}
        />
      }
    >
      {/* Le moment est superposé au bas de la feuille (la ligne de volée), hors du
          flux : il ne décale rien et ne touche jamais le pavé. */}
      <div className="relative">
        <TableauCricket
          cibles={state.config.targets}
          mortes={mortes}
          cutThroat={cutThroat}
          volee={volee}
          joueurs={affiche.players.map((joueur, index) => {
            const profil = profils.get(joueur.playerId)
            return {
              playerId: joueur.playerId,
              nom: nomJoueur(profil?.name ?? null),
              couleur: profil?.color ?? null,
              marks: joueur.marks,
              score: joueur.score,
              actif: index === state.currentPlayerIndex && !state.finished,
              vainqueur: state.winnerId === joueur.playerId,
            }
          })}
        />

        <MomentCelebratif moment={moment} />
      </div>
      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}
    </DispositionPartie>
  )
}
