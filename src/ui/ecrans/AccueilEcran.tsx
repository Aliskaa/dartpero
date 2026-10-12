import { useQuery } from '@tanstack/react-query'
import { Download, Play, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import type { Player } from '@/core/domain/entities/Player'
import { cheminNouvellePartie, ETAT_PARCOURS } from '@/ui/chemins'
import { ApercuPartie, libelleRegles } from '@/ui/composants/commun/ApercuPartie'
import { Button, classesBouton } from '@/ui/composants/commun/Button'
import { Skeleton } from '@/ui/composants/commun/Etats'
import { LogoHero } from '@/ui/composants/commun/Logo'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { couleurJoueur } from '@/ui/couleurs'
import { usePreference } from '@/ui/hooks/useAppareil'
import {
  CLE_INSTALLATION_ECARTEE,
  installationPossible,
  useInstallation,
} from '@/ui/hooks/useInstallation'
import { useProfils } from '@/ui/hooks/useJoueurs'
import {
  LIBELLE_INSTALLER,
  LIBELLE_PLUS_TARD,
  TEXTE_INVITATION_INSTALLATION,
  TITRE_INVITATION_INSTALLATION,
  TITRE_NOUVELLE_PARTIE,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/** Signal vivant entre l'enseigne et le CTA — plus de trou au milieu. */
const SignalAccueil = ({ joueurs }: { readonly joueurs: readonly Player[] }) => {
  if (joueurs.length === 0) {
    return (
      <Panneau aria-label="Premiers pas" className="animate-monter">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center border border-chene/40 bg-feutre/80 text-laiton">
            <Users aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-score text-sm font-bold uppercase tracking-wide text-craie">
              Qui joue ce soir ?
            </p>
            <p className="mt-1 text-sm text-craie/70">
              Ajoutez vos potes — un pseudo, une couleur, c’est parti.
            </p>
            <Link
              to="/joueurs"
              className="mt-3 inline-flex min-h-11 items-center font-score text-sm font-bold uppercase tracking-wider text-laiton"
            >
              Créer un joueur →
            </Link>
          </div>
        </div>
      </Panneau>
    )
  }

  const apercu = joueurs.slice(0, 5)

  // La feuille du soir : une liste numérotée plutôt que des pastilles
  // superposées. On y lit qui est là, dans l'ordre où on les a inscrits.
  return (
    <section aria-label="Joueurs inscrits" className="feuille animate-monter flex flex-col">
      <div className="bandeau-feuille flex items-baseline justify-between px-3 py-1">
        <span className="entete-colonne text-feutre/70">Ce soir à l’oche</span>
        <span className="chiffres text-xs font-bold text-feutre/70">{joueurs.length}</span>
      </div>

      <ul className="flex flex-col">
        {apercu.map((joueur, rang) => (
          <li
            key={joueur.id}
            className="ligne-tableau flex items-center gap-3 px-3 py-2 last:border-b-0"
          >
            <span className="chiffres w-4 shrink-0 text-xs font-bold text-craie/45">
              {rang + 1}
            </span>
            <span
              aria-hidden="true"
              style={{ backgroundColor: couleurJoueur(joueur.color).fond }}
              className="size-3 shrink-0"
            />
            <span className="min-w-0 flex-1 truncate font-score text-sm uppercase tracking-[0.08em] text-craie">
              {joueur.name}
            </span>
          </li>
        ))}
        {joueurs.length > apercu.length && (
          <li className="px-3 py-2 font-score text-[0.65rem] uppercase tracking-[0.2em] text-craie/50">
            + {joueurs.length - apercu.length} autre{joueurs.length - apercu.length > 1 ? 's' : ''}
          </li>
        )}
      </ul>
    </section>
  )
}

/**
 * L'invitation à installer : une ligne discrète, jamais au-dessus de
 * « Nouvelle partie » en poids visuel. Un bouton qui ouvre l'invite native là
 * où le navigateur la fournit, un lien vers le guide des Réglages sur iOS.
 * « Plus tard » la masque pour de bon sur cet appareil — ici seulement : les
 * Réglages gardent toujours leur entrée.
 */
const InvitationInstallation = () => {
  const { etat, installer } = useInstallation()
  const [ecartee, setEcartee] = usePreference(CLE_INSTALLATION_ECARTEE, false)
  if (ecartee || !installationPossible(etat)) return null

  return (
    <section
      aria-label={TITRE_INVITATION_INSTALLATION}
      className="animate-monter flex flex-col gap-2 border-y border-craie/25 py-3 paysage:flex-row paysage:items-center paysage:gap-4 paysage:py-2"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 paysage:items-center">
        <Download aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-laiton" />
        <div className="min-w-0">
          <p className="font-score text-sm font-bold uppercase tracking-wide text-craie">
            {TITRE_INVITATION_INSTALLATION}
          </p>
          <p className="mt-0.5 text-sm text-craie/70 paysage:hidden">
            {TEXTE_INVITATION_INSTALLATION}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {etat === 'installable' ? (
          // Appelée directement dans le clic : l'invite exige un geste.
          <Button variante="secondaire" className="flex-1 paysage:flex-none" onClick={installer}>
            {LIBELLE_INSTALLER}
          </Button>
        ) : (
          <Link
            to={{ pathname: '/reglages', hash: '#installer' }}
            className={`${classesBouton('secondaire')} flex-1 paysage:flex-none`}
          >
            {LIBELLE_INSTALLER}
          </Link>
        )}
        <Button variante="discret" onClick={() => setEcartee(true)}>
          {LIBELLE_PLUS_TARD}
        </Button>
      </div>
    </section>
  )
}

export const AccueilEcran = () => {
  const services = useServices()
  const navigate = useNavigate()
  const profils = useProfils()
  const joueurs = [...profils.values()]

  const encours = useQuery({
    queryKey: ['matchEnCours'],
    queryFn: () => services.getOngoingMatch.execute(),
  })

  return (
    // Le tapis et la barre du bas viennent du layout : l'écran ne pose que son
    // propre rythme vertical.
    <main className="flex flex-1 flex-col gap-6 px-5 pb-4 pt-[max(2rem,env(safe-area-inset-top))]">
      <LogoHero />

      {encours.isPending ? (
        <Skeleton className="h-36" />
      ) : encours.data ? (
        <Panneau
          aria-label="Partie en cours"
          titre="Partie en cours"
          action={
            <span className="text-[0.65rem] uppercase tracking-widest text-craie/60">
              {libelleRegles(encours.data)}
            </span>
          }
          className="animate-monter"
        >
          <ApercuPartie partie={encours.data} profils={profils} />

          <Button className="mt-4 w-full" onClick={() => navigate(`/partie/${encours.data?.id}`)}>
            <Play aria-hidden="true" className="size-4 fill-current" />
            Reprendre
          </Button>
        </Panneau>
      ) : (
        <SignalAccueil joueurs={joueurs} />
      )}

      <InvitationInstallation />

      <div className="mt-auto flex flex-col gap-2">
        {/* L'entraînement est une carte de l'étape 1 : un seul point d'entrée.
            L'état de parcours laisse le retour de l'étape 1 revenir ici. */}
        <Link
          to={cheminNouvellePartie()}
          state={ETAT_PARCOURS}
          className={[
            'laiton-poli inline-flex min-h-16 items-center justify-center gap-3 px-6',
            'font-score text-xl font-bold uppercase tracking-[0.15em]',
          ].join(' ')}
        >
          {TITRE_NOUVELLE_PARTIE}
        </Link>
      </div>
    </main>
  )
}
