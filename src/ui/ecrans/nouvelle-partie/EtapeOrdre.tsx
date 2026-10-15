import { Play, Shuffle } from 'lucide-react'
import { useState } from 'react'
import type { GameModeId } from '@/core/domain/games'
import { cheminNouvellePartie } from '@/ui/chemins'
import { Button } from '@/ui/composants/commun/Button'
import { MessageErreur } from '@/ui/composants/commun/Etats'
import type { NouvellePartie } from '@/ui/hooks/useNouvellePartie'
import {
  annonceTirage,
  ETAPE_JEU,
  ETAPE_JOUEURS,
  ETAPE_ORDRE,
  LIBELLE_COMMENCER,
  LIBELLE_TIRER_AU_SORT,
  RETOUR_ETAPE_PRECEDENTE,
  sousTitreOrdre,
  TITRE_ETAPE_ORDRE,
} from '@/ui/labels'
import { BarreEtapes } from './BarreEtapes'
import { EnTeteEtape } from './EnTeteEtape'
import { ListeOrdonnable } from './ListeOrdonnable'
import { deplacer } from './ordre'

/**
 * Étape 3 — l'ordre de jeu, à partir de deux joueurs : une feuille numérotée,
 * le premier en laiton. « Tirer au sort » rebat la feuille **tout de suite** : on
 * voit qui commence, et on peut encore réordonner à la poignée.
 *
 * ⚠️ Le tirage part d'un geste (`onClick`), jamais d'un effet : le `StrictMode`
 * le jouerait deux fois. C'est un vrai tirage — il peut redonner l'ordre
 * d'avant — d'où le bref mouvement de la feuille, qui dit qu'il a eu lieu.
 */
export const EtapeOrdre = ({
  mode,
  partie,
}: {
  readonly mode: GameModeId
  readonly partie: NouvellePartie
}) => {
  const retenus = partie.joueursRetenus(mode)
  const [tirages, setTirages] = useState(0)
  const [annonce, setAnnonce] = useState('')

  const tirer = () => {
    const ordre = partie.tirerAuSort(mode)
    const noms = ordre
      .flatMap((id) => retenus.filter((joueur) => joueur.id === id))
      .map((j) => j.name)
    setTirages(tirages + 1)
    setAnnonce(annonceTirage(noms))
  }

  return (
    <>
      <EnTeteEtape
        titre={TITRE_ETAPE_ORDRE}
        sousTitre={sousTitreOrdre(mode, partie.reglages)}
        cheminPrecedent={cheminNouvellePartie(mode)}
        libelleRetour={RETOUR_ETAPE_PRECEDENTE}
        barre={<BarreEtapes etapes={[ETAPE_JEU, ETAPE_JOUEURS, ETAPE_ORDRE]} courante={2} />}
      />

      <ListeOrdonnable
        joueurs={retenus}
        tirages={tirages}
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
      <output className="sr-only">{annonce}</output>

      {partie.erreur && <MessageErreur>{partie.erreur}</MessageErreur>}

      <div className="mt-auto flex flex-col gap-3">
        <Button variante="secondaire" className="w-full" onClick={tirer}>
          <Shuffle aria-hidden="true" className="size-5" />
          {LIBELLE_TIRER_AU_SORT}
        </Button>
        <Button
          taille="lg"
          className="w-full"
          disabled={partie.occupe}
          onClick={() => void partie.demarrer(mode)}
        >
          <Play aria-hidden="true" className="size-5 fill-current" />
          {LIBELLE_COMMENCER}
        </Button>
      </div>
    </>
  )
}
