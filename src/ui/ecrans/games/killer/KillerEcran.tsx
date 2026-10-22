import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { KILLER_NUMBERS } from '@/core/domain/games/killer/config'
import {
  type KillerDartEffect,
  KillerRules,
  type KillerVisit,
} from '@/core/domain/games/killer/rules'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { BandeauMatch } from '@/ui/composants/commun/BandeauMatch'
import { BoiteConfirmation } from '@/ui/composants/commun/BoiteConfirmation'
import { DispositionPartie } from '@/ui/composants/commun/DispositionPartie'
import { EcranErreur, MessageErreur, Spinner } from '@/ui/composants/commun/Etats'
import { MomentCelebratif } from '@/ui/composants/commun/MomentCelebratif'
import { PaveSaisie } from '@/ui/composants/commun/PaveSaisie'
import {
  type CaseVoleeKiller,
  FeuilleKiller,
  type TonEffet,
} from '@/ui/composants/killer/FeuilleKiller'
import { useWakeLock } from '@/ui/hooks/useAppareil'
import { useConfirmationSortie } from '@/ui/hooks/useConfirmationSortie'
import { useProfils } from '@/ui/hooks/useJoueurs'
import { useKiller } from '@/ui/hooks/useKiller'
import { useNomDePartie } from '@/ui/hooks/useNomDePartie'
import {
  EFFET_AUCUN,
  EFFET_KILLER,
  effetElimination,
  effetPerte,
  LIBELLE_EN_VIE,
  LIBELLE_JOUEURS_EN_VIE,
  LIBELLE_SAISIE_FLECHETTE,
  nomJoueur,
  RETOUR_ACCUEIL,
  sousTitreBandeauKiller,
  TITRE_BANDEAU_KILLER,
} from '@/ui/labels'
import { reglesDeLaConfigKiller } from '@/ui/reglesDuJeu'

export const KillerEcran = () => {
  const { matchId } = useParams()
  const identifiant = (matchId ?? '') as MatchId
  const nomPartie = useNomDePartie(identifiant)
  const navigate = useNavigate()
  const profils = useProfils()

  const partie = useKiller(identifiant)
  const { state, termine } = partie

  useWakeLock(state !== null && !termine)

  // La boîte « Kevin gagne sur D8 ? » : au-dessus du chargement, comme toute boîte au retour.
  const confirmation = useConfirmationSortie({
    pret: partie.pret,
    enAttente: partie.sortieEnAttente,
    corriger: partie.corrigerSortie,
    valider: partie.validerSortie,
  })
  const onFlechette = (dart: Dart) => {
    // Juste après la fermeture de la boîte, l'appui fantôme d'un double tap est ignoré.
    if (!confirmation.pavePret()) return
    // Synchrone, dans le gestionnaire de l'appui : jamais depuis un effet.
    if (partie.ajouterFlechette(dart)) confirmation.demander()
  }

  // Le résumé attend que l'entrée de la boîte soit dépilée.
  const auRepos = confirmation.auRepos
  useEffect(() => {
    if (termine && auRepos) navigate(`/partie/${identifiant}/resume`, { replace: true })
  }, [termine, auRepos, identifiant, navigate])

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
            {RETOUR_ACCUEIL}
          </Link>
        }
      />
    )
  }

  const affiche = partie.affiche ?? state
  const nomDe = (id: PlayerId) => nomJoueur(profils.get(id)?.name ?? null)

  // Dernière ligne : la volée en cours, sinon la dernière enregistrée, sinon les cases vides du lanceur.
  const visite: KillerVisit | null = partie.voleeEnCours ?? state.history.at(-1) ?? null
  const proprietaire = visite?.playerId ?? partie.joueurCourant.playerId

  const effet = (dart: Dart, effetDomaine: KillerDartEffect): CaseVoleeKiller => {
    const flechette = DartVO.label(dart)
    const avec = (texte: string, ton: TonEffet) => ({ flechette, effet: texte, ton })
    switch (effetDomaine.type) {
      case 'NONE':
        return avec(EFFET_AUCUN, 'aucun')
      case 'BECAME_KILLER':
        return avec(EFFET_KILLER, 'killer')
      case 'HIT':
        return effetDomaine.eliminated
          ? avec(
              effetElimination(
                nomDe(effetDomaine.targetId),
                profils.get(effetDomaine.targetId)?.gender,
              ),
              'elimine',
            )
          : avec(effetPerte(nomDe(effetDomaine.targetId), effetDomaine.livesLost), 'perte')
      default: {
        const jamais: never = effetDomaine
        return jamais
      }
    }
  }

  const cases =
    visite === null
      ? []
      : visite.darts.flatMap((dart, rang) => {
          const effetDomaine = visite.effects[rang]
          return effetDomaine ? [effet(dart, effetDomaine)] : []
        })

  const partieGagnee = partie.derniereVolee?.milestones.find((m) => m.type === 'MatchFinished')
  const moment =
    partieGagnee && partieGagnee.type === 'MatchFinished'
      ? {
          cle: `partie-${partie.derniereVolee?.state.history.length}`,
          titre: 'Partie !',
          detail: nomDe(partieGagnee.winnerId),
        }
      : null

  const vivants = KillerRules.aliveCount(affiche)

  return (
    <DispositionPartie
      nomPartie={nomPartie}
      enTete={
        <BandeauMatch
          pictogramme="killer"
          titre={TITRE_BANDEAU_KILLER}
          sousTitre={sousTitreBandeauKiller(state.config.startingLives, state.players.length)}
          regles={reglesDeLaConfigKiller(state.config)}
          droite={
            <output
              aria-label={LIBELLE_JOUEURS_EN_VIE}
              className="flex flex-col items-end paysage:flex-row paysage:items-baseline paysage:gap-x-1.5"
            >
              <span className="chiffres text-lg leading-none tracking-normal text-craie-vive">
                {vivants}
              </span>{' '}
              {LIBELLE_EN_VIE}
            </output>
          }
        />
      }
      saisie={
        <PaveSaisie
          libelleSection={LIBELLE_SAISIE_FLECHETTE}
          cibles={KILLER_NUMBERS}
          colonnes={5}
          multiplicateur={partie.multiplicateur}
          onMultiplicateur={partie.setMultiplicateur}
          onFlechette={onFlechette}
          onAnnuler={() => void partie.annuler()}
          peutAnnuler={partie.peutAnnuler}
          annulation={partie.annulation}
        />
      }
    >
      <div className="relative">
        <FeuilleKiller
          viesDeDepart={state.config.startingLives}
          volee={{ nom: nomDe(proprietaire), cases }}
          joueurs={affiche.players.map((joueur, index) => {
            const profil = profils.get(joueur.playerId)
            return {
              playerId: joueur.playerId,
              nom: nomJoueur(profil?.name ?? null),
              couleur: profil?.color ?? null,
              genre: profil?.gender,
              numero: joueur.number,
              vies: joueur.lives,
              perdues: visite === null ? 0 : KillerRules.livesLostIn(visite, joueur.playerId),
              killer: joueur.killer,
              elimine: joueur.eliminated,
              actif: index === state.currentPlayerIndex && !state.finished,
              vainqueur: state.winnerId === joueur.playerId,
            }
          })}
        />

        <MomentCelebratif moment={moment} />
      </div>
      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}
      <BoiteConfirmation
        ouvert={confirmation.ouverte}
        titre={partie.confirmation?.titre ?? ''}
        texte={partie.confirmation?.texte ?? ''}
        onCorriger={confirmation.surCorriger}
        onValider={confirmation.surValider}
        occupe={partie.occupe}
      />
    </DispositionPartie>
  )
}
