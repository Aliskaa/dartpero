import { ArrowLeft, Play, Target } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CheckoutPracticeConfig } from '@/core/domain/games/checkout-practice/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { Button } from '@/ui/composants/commun/Button'
import { EmptyState, MessageErreur, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { useJoueurs } from '@/ui/hooks/useJoueurs'
import { useServices } from '@/ui/providers/ServicesProvider'

const SERIES = [5, 10, 20] as const

export const LancerEntrainementEcran = () => {
  const services = useServices()
  const navigate = useNavigate()
  const joueurs = useJoueurs()

  const [choisi, setChoisi] = useState<PlayerId | null>(null)
  const [rounds, setRounds] = useState<(typeof SERIES)[number]>(10)
  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  const liste = joueurs.data ?? []
  const joueur = choisi ?? liste[0]?.id ?? null

  const commencer = async () => {
    if (!joueur) return
    setErreur(null)
    setOccupe(true)
    try {
      const matchId = await services.playCheckoutPractice.start({
        playerId: joueur,
        config: CheckoutPracticeConfig.create({ rounds }),
      })
      navigate(`/partie/${matchId}`)
    } catch {
      setErreur('Impossible de démarrer la séance.')
      setOccupe(false)
    }
  }

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Retour à l’accueil"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-chene/60 bg-ardoise text-craie/80 active:bg-chene/30"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <div className="min-w-0">
          <p className="font-score text-[0.6rem] uppercase tracking-[0.3em] text-craie/60">
            Entraînement
          </p>
          <h1 className="font-display text-2xl text-laiton">Checkout</h1>
        </div>
      </header>

      <Panneau contenuClassName="flex items-start gap-3 p-4">
        <Target aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-vert-cible" />
        <p className="text-sm text-craie/75">
          Un reste est tiré au sort entre <strong className="text-craie">41 et 170</strong>, et vous
          avez trois fléchettes pour le sortir sur un double. Jamais de reste impossible : les{' '}
          <em>bogey numbers</em> sont écartés du tirage.
        </p>
      </Panneau>

      <Panneau aria-label="Joueur" titre="Qui s’entraîne ?" contenuClassName="p-3">
        {joueurs.isPending ? (
          <SpinnerLigne label="Chargement des profils…" />
        ) : liste.length === 0 ? (
          <EmptyState
            titre="Aucun profil"
            description="Créez d’abord un joueur : c’est lui qui portera les séances dans l’historique."
            action={
              <Button variante="secondaire" onClick={() => navigate('/joueurs')}>
                Créer un profil
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {liste.map((profil) => {
              const actif = profil.id === joueur
              return (
                <li key={profil.id}>
                  <button
                    type="button"
                    aria-pressed={actif}
                    onClick={() => setChoisi(profil.id)}
                    className={[
                      'flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 text-left',
                      'transition-colors duration-150',
                      actif
                        ? 'border-laiton/60 bg-laiton/10 shadow-[0_0_20px_-10px_var(--color-laiton)]'
                        : 'border-chene/55 bg-feutre/60',
                    ].join(' ')}
                  >
                    <Avatar nom={profil.name} couleur={profil.color} />
                    <span
                      className={`min-w-0 flex-1 truncate font-score text-base uppercase tracking-wide ${
                        actif ? 'text-craie-vive' : 'text-craie/75'
                      }`}
                    >
                      {profil.name}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Panneau>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-score text-[0.65rem] uppercase tracking-[0.25em] text-craie/65">
          Nombre de sorties
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {SERIES.map((serie) => (
            <button
              key={serie}
              type="button"
              aria-pressed={serie === rounds}
              onClick={() => setRounds(serie)}
              className={`chiffres min-h-12 rounded-xl text-lg font-bold ${
                serie === rounds ? 'laiton-poli' : 'touche text-craie/75'
              }`}
            >
              {serie}
            </button>
          ))}
        </div>
      </fieldset>

      {erreur && <MessageErreur>{erreur}</MessageErreur>}

      <Button
        taille="lg"
        className="mt-auto w-full"
        disabled={!joueur || occupe}
        onClick={() => void commencer()}
      >
        <Play aria-hidden="true" className="size-5 fill-current" />
        Commencer
      </Button>
    </main>
  )
}
