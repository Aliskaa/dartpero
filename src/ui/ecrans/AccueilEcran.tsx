import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { Link } from 'react-router'
import type { MatchSummary } from '@/core/application/ports/driving/MatchSummary'
import { matchStatus } from '@/core/application/use-cases/summarize'
import { cheminNouvellePartie, ETAT_PARCOURS } from '@/ui/chemins'
import { CLE_HISTORIQUE, CLE_MATCH_EN_COURS } from '@/ui/clesRequetes'
import { Button, classesBouton } from '@/ui/composants/commun/Button'
import { CartePartie } from '@/ui/composants/commun/CartePartie'
import { MessageErreur, Skeleton } from '@/ui/composants/commun/Etats'
import { LogoHero } from '@/ui/composants/commun/Logo'
import { usePreference } from '@/ui/hooks/useAppareil'
import {
  CLE_INSTALLATION_ECARTEE,
  installationPossible,
  useInstallation,
} from '@/ui/hooks/useInstallation'
import { useJoueurs, useProfils } from '@/ui/hooks/useJoueurs'
import { groupeDeJour } from '@/ui/jourCalendaire'
import {
  dateHeure,
  LIBELLE_AUCUNE_PARTIE_ENCORE,
  LIBELLE_AUCUNE_PARTIE_SEMAINE,
  LIBELLE_CHARGEMENT_PARTIES,
  LIBELLE_CREER_JOUEUR,
  LIBELLE_ERREUR_ACCUEIL,
  LIBELLE_INSTALLER,
  LIBELLE_PLUS_TARD,
  LIBELLE_TOUTES_LES_PARTIES,
  libelleQuand,
  TEXTE_INVITATION_INSTALLATION,
  TITRE_AUJOURDHUI,
  TITRE_CETTE_SEMAINE,
  TITRE_INVITATION_INSTALLATION,
  TITRE_NOUVELLE_PARTIE,
  TITRE_PARTIE_EN_COURS,
  TITRE_PARTIES_RECENTES,
} from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

/**
 * Le plafond de cartes de l'Accueil : au-delà, c'est l'onglet Parties.
 * `GetMatchHistory` rend les N plus récentes sans désérialiser toute la base.
 */
const PLAFOND_CARTES = 30

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
          <p className="mt-0.5 text-sm text-craie-3 paysage:hidden">
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
  const joueurs = useJoueurs()
  const profils = useProfils()

  const encours = useQuery({
    queryKey: CLE_MATCH_EN_COURS,
    queryFn: () => services.getOngoingMatch.execute(),
  })
  const historique = useQuery({
    // Sous le préfixe `['historique']` : tout ce qui l'invalide (fin de partie,
    // suppression, lancement) rafraîchit aussi l'Accueil.
    queryKey: [...CLE_HISTORIQUE, 'accueil'],
    queryFn: () => services.getMatchHistory.execute(PLAFOND_CARTES),
  })

  // L'heure par l'horloge injectée, jamais `Date.now()`. Lue à chaque rendu :
  // pas de minuteur à minuit, le groupement se recalcule à la navigation
  // suivante (décision de l'utilisateur).
  const maintenant = services.clock.now()

  const enCours = encours.data ?? null
  const enCoursId = enCours?.id ?? null

  // Les plus récentes d'abord ; la partie en cours est épinglée à part, une
  // seule fois, même quand sa date la ferait entrer dans un groupe.
  const parGroupe = { AUJOURDHUI: [] as MatchSummary[], CETTE_SEMAINE: [] as MatchSummary[] }
  for (const partie of [...(historique.data ?? [])].sort((a, b) => b.createdAt - a.createdAt)) {
    if (partie.id === enCoursId) continue
    const groupe = groupeDeJour(partie.createdAt, maintenant)
    if (groupe) parGroupe[groupe].push(partie)
  }

  const quand = (partie: MatchSummary): string => {
    const groupe = groupeDeJour(partie.createdAt, maintenant)
    return groupe
      ? libelleQuand(partie.createdAt, groupe === 'AUJOURDHUI')
      : dateHeure(partie.createdAt)
  }

  const carte = (partie: MatchSummary, reprise = false) => (
    <CartePartie
      key={partie.id}
      partie={partie}
      statut={matchStatus(partie, enCoursId)}
      profils={profils}
      quand={quand(partie)}
      niveauTitre={3}
      reprise={reprise}
    />
  )

  const groupes = [
    { cle: 'AUJOURDHUI', titre: TITRE_AUJOURDHUI, parties: parGroupe.AUJOURDHUI },
    { cle: 'CETTE_SEMAINE', titre: TITRE_CETTE_SEMAINE, parties: parGroupe.CETTE_SEMAINE },
  ].filter(({ parties }) => parties.length > 0)

  // Une lecture en échec ne se lit jamais comme « rien à montrer ».
  const enErreur = encours.isError || historique.isError || joueurs.isError
  const chargement = encours.isPending || historique.isPending || joueurs.isPending

  // Les cas, déduits de l'historique déjà lu (aucun compte en base).
  const total = historique.data?.length ?? 0
  const affichees = (enCours ? 1 : 0) + groupes.reduce((n, { parties }) => n + parties.length, 0)
  const jamaisJoue = total === 0 && !enCours
  const semaineCalme = affichees === 0 && total > 0
  // Des parties hors de l'Accueil (trop anciennes), ou le plafond atteint : la suite est à l'onglet Parties.
  const lienToutesLesParties = total > affichees || total >= PLAFOND_CARTES

  const lienCreerJoueur = (
    <Link
      to="/joueurs"
      className="inline-flex min-h-12 items-center font-score text-sm font-bold uppercase tracking-wider text-laiton"
    >
      {LIBELLE_CREER_JOUEUR} <span aria-hidden="true">→</span>
    </Link>
  )
  const lienParties = (
    <Link
      to="/historique"
      className="inline-flex min-h-12 items-center font-score text-sm font-bold uppercase tracking-wider text-laiton"
    >
      {LIBELLE_TOUTES_LES_PARTIES} <span aria-hidden="true">→</span>
    </Link>
  )

  return (
    // Le tapis et la barre du bas viennent du layout : l'écran ne pose que son
    // propre rythme vertical. Pas de padding bas : le bouton fixé clôt l'écran.
    <main className="flex flex-1 flex-col gap-6 px-5 pt-[max(2rem,env(safe-area-inset-top))]">
      <LogoHero />

      <section aria-label={TITRE_PARTIES_RECENTES} className="flex flex-col gap-6">
        {enErreur ? (
          <MessageErreur>{LIBELLE_ERREUR_ACCUEIL}</MessageErreur>
        ) : chargement ? (
          // Le Skeleton est décoratif : le statut vocal vit à côté, dans un `<output>`.
          <output className="block">
            <Skeleton className="h-36" />
            <span className="sr-only">{LIBELLE_CHARGEMENT_PARTIES}</span>
          </output>
        ) : jamaisJoue ? (
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm text-craie-3">{LIBELLE_AUCUNE_PARTIE_ENCORE}</p>
            {profils.size === 0 && lienCreerJoueur}
          </div>
        ) : semaineCalme ? (
          <div className="flex flex-col items-start gap-1">
            <p className="text-sm text-craie-3">{LIBELLE_AUCUNE_PARTIE_SEMAINE}</p>
            {lienParties}
            {profils.size === 0 && lienCreerJoueur}
          </div>
        ) : (
          <>
            {enCours && (
              <>
                {/* Les cartes sont des `h3` : sans ce titre, la page sauterait de `h1` à `h3`. */}
                <h2 className="sr-only">{TITRE_PARTIE_EN_COURS}</h2>
                <ul className="flex flex-col gap-3">{carte(enCours, true)}</ul>
              </>
            )}
            {groupes.map(({ cle, titre, parties }) => (
              <section key={cle} aria-labelledby={`accueil-${cle}`} className="flex flex-col gap-3">
                <h2 id={`accueil-${cle}`} className="entete-colonne text-craie-3">
                  {titre}
                </h2>
                <ul className="flex flex-col gap-3">{parties.map((partie) => carte(partie))}</ul>
              </section>
            ))}
            {lienToutesLesParties && <div>{lienParties}</div>}
          </>
        )}
      </section>

      <InvitationInstallation />

      {/*
        Le bouton fixé : `sticky` plutôt qu'une hauteur bornée du `main`. Il est
        dans le flux, juste après la dernière carte (rien à masquer, pas de
        padding à deviner), et ne se « colle » qu'une fois la liste plus haute
        que l'écran — calé au-dessus de la barre du bas, dont la hauteur est la
        variable partagée `--hauteur-nav-basse` (la zone de sécurité est portée
        par la barre elle-même, on l'ajoute ici sans la redoubler). Une hauteur
        bornée aurait dû contraindre `LayoutPrincipal` (`min-h-dvh`, qui grandit
        avec le contenu) et dépendre de `dvh`, instable sous la barre d'adresse.
        L'entraînement est une carte de l'étape 1 : un seul point d'entrée.
        L'état de parcours laisse le retour de l'étape 1 revenir ici.
      */}
      <div className="sticky bottom-[calc(var(--hauteur-nav-basse)+env(safe-area-inset-bottom))] z-10 -mx-5 mt-auto border-t border-chene/40 bg-feutre px-5 py-3">
        <Link
          to={cheminNouvellePartie()}
          state={ETAT_PARCOURS}
          className={[
            'laiton-poli flex min-h-16 items-center justify-center gap-3 px-6',
            'font-score text-xl font-bold uppercase tracking-[0.15em]',
          ].join(' ')}
        >
          {TITRE_NOUVELLE_PARTIE}
        </Link>
      </div>
    </main>
  )
}
