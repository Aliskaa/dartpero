import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { MomentCelebratif } from '@/ui/composants/commun/MomentCelebratif'
import { LigneCible, libelleCible } from '@/ui/composants/tour-du-monde/LigneCible'
import { PaveCibles } from '@/ui/composants/tour-du-monde/PaveCibles'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useTourDuMonde } from '@/ui/hooks/useTourDuMonde'
import { nomJoueur, pluriel } from '@/ui/labels'

/** Les trois encoches de la volée, collées au pavé — « t’as mis quoi, là ? ». */
const VoleeEnCours = ({ darts }: { readonly darts: readonly Dart[] }) => (
  <output aria-label="Volée en cours" className="mb-2 flex items-center justify-center gap-1.5">
    {[0, 1, 2].map((rang) => {
      const dart = darts[rang]
      return (
        <span
          key={rang}
          className={[
            'chiffres flex h-9 min-w-14 items-center justify-center text-sm font-bold',
            dart
              ? 'border border-accent-mode/60 bg-accent-mode/20 text-craie-vive'
              : 'border border-dashed border-craie/25 text-craie/25',
          ].join(' ')}
        >
          {dart ? libelleCible(dart.segment) : '·'}
        </span>
      )
    })}
  </output>
)

export const TourDuMondeEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const navigate = useNavigate()
  const profils = useProfils()

  const partie = useTourDuMonde(identifiant)
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

  const total = state.config.targets.length
  const compact = state.players.length > 2

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
      mode="TOUR_DU_MONDE"
      enTete={
        <>
          <Link
            to="/"
            aria-label="Retour à l’accueil"
            className="grave -ml-1 flex size-10 shrink-0 items-center justify-center text-craie/80 active:bg-craie/15"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>

          <p className="grave flex min-w-0 flex-1 items-center gap-2 font-score text-xs uppercase tracking-[0.2em] text-craie/75">
            <span className="font-bold text-accent-mode-clair">Tour du monde</span>
            <span aria-hidden="true" className="text-craie/25">
              |
            </span>
            <span className="chiffres">{total} cibles</span>
          </p>

          {/* Le dernier tour de table : tout le monde a droit au même nombre de volées. */}
          {state.lastRound && (
            <span className="grave shrink-0 animate-respirer border border-accent-mode/60 bg-accent-mode/15 px-2 py-0.5 font-score text-[0.6rem] uppercase tracking-wider text-accent-mode-clair">
              Dernier tour
            </span>
          )}
        </>
      }
      saisie={
        <>
          <VoleeEnCours darts={partie.dartsEnCours} />
          <PaveCibles
            onFlechette={partie.ajouterFlechette}
            onAnnuler={() => void partie.annuler()}
            peutAnnuler={partie.peutAnnuler}
            annulation={partie.annulation}
            desactive={partie.occupe}
          />
        </>
      }
    >
      <section
        aria-label="Tableau des scores"
        className="flex min-h-0 flex-1 flex-col justify-center gap-2"
      >
        {state.players.map((joueur, index) => {
          const actif = index === state.currentPlayerIndex && !state.finished
          const profil = profils.get(joueur.playerId)
          const nom = nomJoueur(profil?.name ?? null)

          // Le joueur qui tape voit sa progression suivre chaque fléchette.
          const validees = actif ? partie.apercu.validees : joueur.targetIndex
          const cible = actif
            ? partie.apercu.cible
            : (state.config.targets[joueur.targetIndex] ?? null)

          return (
            <LigneCible
              key={joueur.playerId}
              nom={nom}
              couleur={profil?.color ?? null}
              cible={cible}
              validees={validees}
              total={total}
              flechettes={joueur.dartsThrown + (actif ? partie.dartsEnCours.length : 0)}
              actif={actif}
              vainqueur={state.winnerId === joueur.playerId}
              compact={compact}
            />
          )
        })}
      </section>

      <MomentCelebratif moment={moment} />

      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}
    </DispositionPartie>
  )
}
