import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MARKS_TO_CLOSE } from '@/core/domain/games/cricket/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { MomentCelebratif } from '@/ui/composants/commun/MomentCelebratif'
import { PaveCricket } from '@/ui/composants/cricket/PaveCricket'
import { TableauCricket } from '@/ui/composants/cricket/TableauCricket'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useCricket } from '@/ui/hooks/useCricket'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { LIBELLE_VARIANTE_CRICKET, nomJoueur } from '@/ui/labels'

/** Les trois encoches de la volée, collées au pavé — « t’as mis quoi, là ? ». */
const VoleeEnCours = ({ darts }: { readonly darts: readonly Dart[] }) => (
  <output aria-label="Volée en cours" className="mb-2 flex items-center justify-center gap-1.5">
    {[0, 1, 2].map((rang) => {
      const dart = darts[rang]
      return (
        <span
          key={rang}
          className={[
            'chiffres flex h-9 min-w-14 items-center justify-center rounded-md text-sm font-bold',
            dart
              ? 'border border-accent-mode/60 bg-accent-mode/20 text-craie-vive'
              : 'border border-dashed border-craie/25 text-craie/25',
          ].join(' ')}
        >
          {dart ? Dart.label(dart) : '·'}
        </span>
      )
    })}
  </output>
)

export const CricketEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
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

  return (
    <DispositionPartie
      mode="CRICKET"
      enTete={
        <>
          <Link
            to="/"
            aria-label="Retour à l’accueil"
            className="grave -ml-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-craie/80 active:bg-black/25"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>

          <p className="grave flex min-w-0 flex-1 items-center gap-2 font-score text-xs uppercase tracking-[0.2em] text-craie/75">
            <span className="font-bold text-accent-mode-clair">Cricket</span>
            <span aria-hidden="true" className="text-craie/25">
              |
            </span>
            <span>{LIBELLE_VARIANTE_CRICKET[state.config.variant]}</span>
          </p>

          {/* Rappel de la condition de victoire — standard vs cut-throat. */}
          <span
            className={[
              'grave shrink-0 rounded border px-2 py-0.5 font-score text-[0.6rem] uppercase tracking-wider',
              cutThroat
                ? 'border-rouge-cible/60 bg-rouge-cible/15 text-craie'
                : 'border-accent-mode/50 bg-accent-mode/10 text-accent-mode-clair',
            ].join(' ')}
          >
            {cutThroat ? 'Le plus bas gagne' : 'Ferme + mène'}
          </span>
        </>
      }
      saisie={
        <>
          <VoleeEnCours darts={partie.dartsEnCours} />
          <PaveCricket
            cibles={state.config.targets}
            multiplicateur={partie.multiplicateur}
            onMultiplicateur={partie.setMultiplicateur}
            onFlechette={partie.ajouterFlechette}
            onAnnuler={() => void partie.annuler()}
            peutAnnuler={partie.peutAnnuler}
            desactive={partie.occupe}
          />
        </>
      }
    >
      <section
        aria-label="Tableau des scores"
        className="flex min-h-0 flex-1 flex-col justify-center"
      >
        <TableauCricket
          cibles={state.config.targets}
          mortes={mortes}
          cutThroat={cutThroat}
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
      </section>

      <MomentCelebratif moment={moment} />

      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}
    </DispositionPartie>
  )
}
