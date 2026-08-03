import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MARKS_TO_CLOSE } from '@/core/domain/games/cricket/config'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { PaveCricket } from '@/ui/composants/cricket/PaveCricket'
import { TableauCricket } from '@/ui/composants/cricket/TableauCricket'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useCricket } from '@/ui/hooks/useCricket'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { LIBELLE_VARIANTE_CRICKET, nomJoueur } from '@/ui/labels'

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

  return (
    <DispositionPartie
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
            <span className="font-bold text-laiton-clair">Cricket</span>
            <span aria-hidden="true" className="text-craie/25">
              |
            </span>
            <span>{LIBELLE_VARIANTE_CRICKET[state.config.variant]}</span>
          </p>

          {/* En cut-throat, marquer est un cadeau empoisonné : le rappel reste affiché. */}
          {cutThroat && (
            <span className="grave shrink-0 rounded border border-rouge-cible/60 bg-rouge-cible/15 px-2 py-0.5 font-score text-[0.6rem] uppercase tracking-wider text-craie">
              Le plus bas gagne
            </span>
          )}
        </>
      }
      saisie={
        <PaveCricket
          cibles={state.config.targets}
          multiplicateur={partie.multiplicateur}
          onMultiplicateur={partie.setMultiplicateur}
          onFlechette={partie.ajouterFlechette}
          onAnnuler={() => void partie.annuler()}
          peutAnnuler={partie.peutAnnuler}
          desactive={partie.occupe}
        />
      }
    >
      <section aria-label="Tableau des scores">
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

      {/* Les fléchettes de la volée en cours, dans leurs encoches. */}
      <output aria-label="Volée en cours" className="flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((rang) => {
          const dart = partie.dartsEnCours[rang]
          return (
            <span
              key={rang}
              className={[
                'chiffres flex h-8 min-w-14 items-center justify-center rounded-md text-sm font-bold',
                dart
                  ? 'border border-laiton/60 bg-laiton/20 text-craie-vive'
                  : 'border border-dashed border-craie/20 text-craie/20',
              ].join(' ')}
            >
              {dart ? Dart.label(dart) : '·'}
            </span>
          )
        })}
      </output>

      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}
    </DispositionPartie>
  )
}
