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
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
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
              : 'border border-dashed border-craie/25 text-craie-decor',
          ].join(' ')}
        >
          {dart ? libelleCible(dart.segment) : <span aria-hidden="true">·</span>}
        </span>
      )
    })}
  </output>
)

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
      nomPartie={nomPartie}
      mode="TOUR_DU_MONDE"
      enTete={
        <>
          <Link
            to="/"
            aria-label="Retour à l’accueil"
            className="grave -ml-1 flex size-10 shrink-0 items-center justify-center text-craie-2 active:bg-craie/15"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>

          <p className="grave flex min-w-0 flex-1 items-center gap-2 font-score text-xs uppercase tracking-[0.2em] text-craie-2">
            <span className="font-bold text-accent-mode-clair">Tour du monde</span>
            <span aria-hidden="true" className="text-craie-decor">
              |
            </span>
            <span className="chiffres">{total} cibles</span>
          </p>

          {/* Le dernier tour de table : tout le monde a droit au même nombre de volées. */}
          {state.lastRound && (
            <span className="grave shrink-0 border border-accent-mode/60 bg-accent-mode/15 px-2 py-0.5 font-score text-etiquette uppercase tracking-wider text-accent-mode-clair">
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
          />
        </>
      }
    >
      {/* Le moment est superposé au bas du tableau, hors du flux. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <section aria-label="Tableau des scores" className="flex min-h-0 flex-col gap-2">
          {affiche.players.map((joueur, index) => {
            // Le tableau affiché intègre la volée en cours ; la main, elle, se lit
            // sur l'état réel — c'est encore au même joueur de jouer.
            const actif = index === state.currentPlayerIndex && !state.finished
            const profil = profils.get(joueur.playerId)
            const nom = nomJoueur(profil?.name ?? null)

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
                compact={compact}
              />
            )
          })}
        </section>

        <MomentCelebratif moment={moment} />
      </div>

      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}
    </DispositionPartie>
  )
}
