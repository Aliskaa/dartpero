import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { useNomsJoueurs } from '@/ui/hooks/useJoueurs'
import { moyenne, nomJoueur } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

export const ResumeEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const services = useServices()
  const navigate = useNavigate()
  const noms = useNomsJoueurs()

  const stats = useQuery({
    queryKey: ['matchResume', identifiant],
    queryFn: () => services.getMatchStats.execute(identifiant),
  })

  if (stats.isPending) return <Spinner label="Calcul des statistiques…" />
  if (stats.error || !stats.data) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <MessageErreur>Cette partie est introuvable.</MessageErreur>
        <Link to="/" className="text-center text-laiton underline">
          Retour à l’accueil
        </Link>
      </div>
    )
  }

  const vainqueur = stats.data.players.find((joueur) => joueur.playerId === stats.data.winnerId)

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-6 px-5 py-8">
      <header className="text-center">
        <p className="font-score text-xs uppercase tracking-[0.3em] text-craie/60">
          Partie terminée
        </p>
        <h1 className="mt-2 font-display text-4xl text-laiton">
          {vainqueur ? nomJoueur(noms.get(vainqueur.playerId) ?? null) : 'Partie en cours'}
        </h1>
        {vainqueur && (
          <p className="mt-1 font-score text-sm uppercase tracking-widest text-vert-cible">
            Vainqueur
          </p>
        )}
      </header>

      <section aria-label="Statistiques" className="flex flex-col gap-3">
        {stats.data.players.map((joueur) => (
          <div key={joueur.playerId} className="ardoise-craie rounded-2xl p-4">
            <p className="font-score text-sm uppercase tracking-widest text-laiton">
              {nomJoueur(noms.get(joueur.playerId) ?? null)}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-craie/70">Moyenne</dt>
                <dd className="chiffres text-craie-vive">{moyenne(joueur.average3)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-craie/70">First 9</dt>
                <dd className="chiffres text-craie-vive">{moyenne(joueur.first9Average)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-craie/70">180</dt>
                <dd className="chiffres text-craie-vive">{joueur.count180}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-craie/70">100+</dt>
                <dd className="chiffres text-craie-vive">{joueur.count100plus}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-craie/70">% doubles</dt>
                <dd className="chiffres text-craie-vive">{Math.round(joueur.checkoutPercent)} %</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-craie/70">Meilleur leg</dt>
                <dd className="chiffres text-craie-vive">{joueur.bestLegDarts ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-craie/70">Plus haut checkout</dt>
                <dd className="chiffres text-craie-vive">{joueur.highestCheckout || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-craie/70">Legs</dt>
                <dd className="chiffres text-craie-vive">{joueur.legsWonInSet}</dd>
              </div>
            </dl>
          </div>
        ))}
      </section>

      <div className="mt-auto grid gap-2">
        <Button onClick={() => navigate('/nouvelle-partie')}>Nouvelle partie</Button>
        <Button variante="secondaire" onClick={() => navigate('/')}>
          Accueil
        </Button>
      </div>
    </main>
  )
}
