import { ArrowRight, Play } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { GameModeId } from '@/core/domain/games'
import {
  cheminJoueursExistants,
  cheminNouvellePartie,
  cheminOrdre,
  ETAT_PARCOURS,
} from '@/ui/chemins'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur, SpinnerLigne } from '@/ui/composants/commun/Etats'
import type { NouvellePartie } from '@/ui/hooks/useNouvellePartie'
import {
  CHARGEMENT_PROFILS,
  compteurJoueurs,
  ETAPE_JEU,
  ETAPE_JOUEURS,
  ETAPE_ORDRE,
  ETAPE_REGLAGES,
  LIBELLE_COMMENCER,
  LIBELLE_CONTINUER,
  LIBELLE_MODE,
  RETOUR_ETAPE_PRECEDENTE,
  TITRE_PANNEAU_JOUEURS,
  TITRE_QUI_S_ENTRAINE,
} from '@/ui/labels'
import { BarreEtapes } from './BarreEtapes'
import { ChampNom } from './ChampNom'
import { DialogueNouveauJoueur } from './DialogueNouveauJoueur'
import { EnTeteEtape } from './EnTeteEtape'
import { RangeeJoueurs } from './RangeeJoueurs'
import { ReglagesJeu } from './ReglagesJeu'

/**
 * Étape 2 — les joueurs, la fiche de réglages du jeu choisi, puis le nom de la
 * partie (facultatif).
 *
 * Seul en piste (ou à l'entraînement), on commence d'ici : il n'y a pas
 * d'ordre à régler, et la barre le grise. À deux et plus, « Continuer » mène à
 * l'ordre de jeu.
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
  const entrainement = mode === 'CHECKOUT_PRACTICE'
  const versOrdre = !entrainement && n >= 2

  return (
    <>
      <EnTeteEtape
        titre={LIBELLE_MODE[mode]}
        cheminPrecedent={cheminNouvellePartie()}
        libelleRetour={RETOUR_ETAPE_PRECEDENTE}
        barre={
          entrainement ? (
            <BarreEtapes etapes={[ETAPE_JEU, ETAPE_REGLAGES]} courante={1} />
          ) : (
            <BarreEtapes
              etapes={[ETAPE_JEU, ETAPE_JOUEURS, ETAPE_ORDRE]}
              courante={1}
              grisees={n < 2 ? 1 : 0}
            />
          )
        }
      />

      <section className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-score text-etiquette font-bold uppercase tracking-[0.2em] text-laiton-clair">
            {entrainement ? TITRE_QUI_S_ENTRAINE : TITRE_PANNEAU_JOUEURS}
          </h2>
          <span className="chiffres text-xs text-craie-3">
            {compteurJoueurs(n, partie.max(mode))}
          </span>
        </div>
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
      </section>

      <ReglagesJeu mode={mode} reglages={partie.reglages} joueurs={n} />

      <ChampNom nom={partie.nom} />

      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}

      <div className="mt-auto flex flex-col gap-2 pt-1">
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
