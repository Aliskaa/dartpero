import { Play, Shuffle } from 'lucide-react'
import type { GameModeId } from '@/core/domain/games'
import { cheminNouvellePartie } from '@/ui/chemins'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur } from '@/ui/composants/commun/Etats'
import type { NouvellePartie } from '@/ui/hooks/useNouvellePartie'
import {
  AIDE_ORDRE_ALEATOIRE,
  LIBELLE_COMMENCER,
  LIBELLE_MODE,
  LIBELLE_ORDRE_ALEATOIRE,
  ORDRE_TIRE_AU_SORT,
  quiCommence,
  RETOUR_ETAPE_PRECEDENTE,
  TITRE_ETAPE_ORDRE,
} from '@/ui/labels'
import { Bascule } from './Bascule'
import { EnTeteEtape } from './EnTeteEtape'
import { ListeOrdonnable } from './ListeOrdonnable'
import { deplacer } from './ordre'

/**
 * Étape 3 — l'ordre de jeu, à partir de deux joueurs.
 *
 * ⚠️ Sous « Ordre aléatoire », ni poignée ni rang : réordonner une liste qui
 * sera rebattue au lancement n'est pas un réglage, c'est un piège. Et on ne
 * nomme pas celui qui commence, le sort n'étant pas encore tombé.
 */
export const EtapeOrdre = ({
  mode,
  partie,
}: {
  readonly mode: GameModeId
  readonly partie: NouvellePartie
}) => {
  const retenus = partie.joueursRetenus(mode)
  const tirage = partie.tirageActif(mode)
  const [premier] = retenus

  return (
    <>
      <EnTeteEtape
        titre={TITRE_ETAPE_ORDRE}
        sousTitre={LIBELLE_MODE[mode]}
        cheminPrecedent={cheminNouvellePartie(mode)}
        libelleRetour={RETOUR_ETAPE_PRECEDENTE}
      />

      <ListeOrdonnable
        joueurs={retenus}
        tirage={tirage}
        onDeplacer={(de, vers) =>
          partie.reordonner(
            deplacer(
              retenus.map((joueur) => joueur.id),
              de,
              vers,
            ),
          )
        }
      />

      <p className="flex items-center gap-2 font-score text-[0.65rem] uppercase tracking-[0.2em] text-laiton-clair">
        {tirage ? (
          <>
            <Shuffle aria-hidden="true" className="size-3.5 shrink-0" />
            {ORDRE_TIRE_AU_SORT}
          </>
        ) : (
          premier && quiCommence(premier.name)
        )}
      </p>

      <Bascule
        libelle={LIBELLE_ORDRE_ALEATOIRE}
        aide={AIDE_ORDRE_ALEATOIRE}
        actif={partie.reglages.ordreAleatoire}
        onChange={partie.reglages.setOrdreAleatoire}
      />

      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}

      <Button
        taille="lg"
        className="mt-auto w-full"
        disabled={partie.occupe}
        onClick={() => void partie.demarrer(mode)}
      >
        <Play aria-hidden="true" className="size-5 fill-current" />
        {LIBELLE_COMMENCER}
      </Button>
    </>
  )
}
