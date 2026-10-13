import { ArrowRight, Check, Play } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { GameModeId } from '@/core/domain/games'
import { DEFAUT as DEFAUT_ENTRAINEMENT } from '@/core/domain/games/checkout-practice/config'
import {
  cheminJoueursExistants,
  cheminNouvellePartie,
  cheminOrdre,
  ETAT_PARCOURS,
} from '@/ui/chemins'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import type { NouvellePartie } from '@/ui/hooks/useNouvellePartie'
import {
  CHARGEMENT_PROFILS,
  LIBELLE_COMMENCER,
  LIBELLE_CONTINUER,
  LIBELLE_MODE,
  RECAP_TOUR_DU_MONDE,
  RETOUR_ETAPE_PRECEDENTE,
  recapCricket,
  recapEntrainement,
  recapX01,
  TITRE_PANNEAU_JOUEURS,
  TITRE_PANNEAU_REGLAGES,
} from '@/ui/labels'
import { DialogueNouveauJoueur } from './DialogueNouveauJoueur'
import { EnTeteEtape } from './EnTeteEtape'
import { RangeeJoueurs } from './RangeeJoueurs'
import { ReglagesJeu } from './ReglagesJeu'

const recapitulatif = (mode: GameModeId, partie: NouvellePartie): string => {
  const { reglages } = partie
  switch (mode) {
    case 'X01':
      return recapX01(reglages)
    case 'CRICKET':
      return recapCricket(reglages.variante)
    case 'TOUR_DU_MONDE':
      return RECAP_TOUR_DU_MONDE
    case 'CHECKOUT_PRACTICE':
      return recapEntrainement(
        reglages.sorties,
        DEFAUT_ENTRAINEMENT.minTarget,
        DEFAUT_ENTRAINEMENT.maxTarget,
      )
    default: {
      const jamais: never = mode
      return jamais
    }
  }
}

/**
 * Étape 2 — les joueurs, puis les réglages du jeu choisi.
 *
 * Seul en piste (ou à l'entraînement), on commence d'ici : il n'y a pas
 * d'ordre à régler. À deux et plus, « Continuer » mène à l'ordre de jeu.
 */
export const EtapeJoueurs = ({
  mode,
  partie,
}: {
  readonly mode: GameModeId
  readonly partie: NouvellePartie
}) => {
  const navigate = useNavigate()
  const [dialogue, setDialogue] = useState(false)
  const retenus = partie.joueursRetenus(mode)
  const n = retenus.length
  const versOrdre = mode !== 'CHECKOUT_PRACTICE' && n >= 2

  return (
    <>
      <EnTeteEtape
        titre={LIBELLE_MODE[mode]}
        cheminPrecedent={cheminNouvellePartie()}
        libelleRetour={RETOUR_ETAPE_PRECEDENTE}
      />

      <Panneau
        aria-label={TITRE_PANNEAU_JOUEURS}
        titre={TITRE_PANNEAU_JOUEURS}
        action={
          <span className="chiffres text-xs text-craie-3">
            {n}/{partie.max(mode)}
          </span>
        }
        contenuClassName="p-4 pt-5"
      >
        {partie.chargement ? (
          <SpinnerLigne label={CHARGEMENT_PROFILS} />
        ) : (
          <RangeeJoueurs
            joueurs={retenus}
            max={partie.max(mode)}
            onRetirer={(id) => partie.retirer(mode, id)}
            onNouveau={() => setDialogue(true)}
            versExistants={cheminJoueursExistants(mode)}
          />
        )}
      </Panneau>

      <Panneau
        aria-label={TITRE_PANNEAU_REGLAGES}
        titre={TITRE_PANNEAU_REGLAGES}
        contenuClassName="flex flex-col gap-4 p-3"
      >
        <ReglagesJeu mode={mode} reglages={partie.reglages} joueurs={n} />
      </Panneau>

      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}

      <div className="mt-auto flex flex-col gap-2 pt-1">
        <p className="flex items-center justify-center gap-2 text-center font-score text-[0.65rem] uppercase tracking-[0.2em] text-craie-3">
          <Check aria-hidden="true" className="size-3.5 shrink-0" />
          {recapitulatif(mode, partie)}
        </p>

        {versOrdre ? (
          <Button
            taille="lg"
            className="w-full"
            disabled={partie.chargement}
            onClick={() => navigate(cheminOrdre(mode), { state: ETAT_PARCOURS })}
          >
            {LIBELLE_CONTINUER}
            <ArrowRight aria-hidden="true" className="size-5" />
          </Button>
        ) : (
          <Button
            taille="lg"
            className="w-full"
            disabled={n === 0 || partie.chargement || partie.occupe}
            onClick={() => void partie.demarrer(mode)}
          >
            <Play aria-hidden="true" className="size-5 fill-current" />
            {LIBELLE_COMMENCER}
          </Button>
        )}
      </div>

      <DialogueNouveauJoueur
        ouvert={dialogue}
        onFermer={() => setDialogue(false)}
        onCreer={(nom) => partie.creerJoueur(mode, nom)}
      />
    </>
  )
}
