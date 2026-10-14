import { Check, Play } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { MatchSummary } from '@/core/application/ports/driving/MatchSummary'
import type { MatchStatus } from '@/core/application/use-cases/summarize'
import type { Player } from '@/core/domain/entities/Player'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import {
  LIBELLE_ABANDONNEE,
  LIBELLE_EN_COURS,
  LIBELLE_MATCH_NUL,
  LIBELLE_REPRENDRE,
  LIBELLE_TERMINEE,
  libelleGagne,
  libelleGagneEnManches,
  libelleManchesDePartie,
  libelleSorties,
  nomDePartie,
  nomJoueur,
  reglesCricket,
  reglesEntrainement,
  reglesTourDuMonde,
  reglesX01,
} from '@/ui/labels'

/** Les règles d'une carte : le `switch` ouvre l'union, le français vit dans `labels.ts`. */
const regles = (partie: MatchSummary): string => {
  switch (partie.mode) {
    case 'TOUR_DU_MONDE': {
      const [premiere] = partie.config.targets
      return reglesTourDuMonde(premiere ?? 20)
    }
    case 'CRICKET':
      return reglesCricket(partie.config.variant, partie.targetsTotal)
    case 'CHECKOUT_PRACTICE': {
      const { rounds, minTarget, maxTarget } = partie.config
      return reglesEntrainement(rounds, minTarget, maxTarget)
    }
    case 'X01':
      return reglesX01({
        score: partie.config.startingScore,
        legsToWin: partie.config.legsToWin,
        setsToWin: partie.config.setsToWin,
        doubleOut: partie.config.doubleOut,
        doubleIn: partie.config.doubleIn,
      })
    default: {
      const jamais: never = partie
      return String(jamais)
    }
  }
}

/**
 * Ce que la carte dit de l'avancement, par mode — `null` quand le badge
 * « Abandonnée » parle déjà à sa place (on n'écrit pas « En cours » à côté).
 *
 * C'est, avec `regles`, **le seul endroit de l'UI** où l'on ouvre
 * l'union `MatchSummary` pour une carte : un cinquième mode fait échouer la
 * compilation ici.
 */
const texteDeStatut = (partie: MatchSummary, statut: MatchStatus): string | null => {
  const nomDuVainqueur = (): string => {
    const gagnant = partie.players.find((joueur) => joueur.playerId === partie.winnerId)
    return nomJoueur(gagnant?.name ?? null)
  }
  const sansVainqueur = statut === 'ABANDONED' ? null : LIBELLE_EN_COURS

  switch (partie.mode) {
    case 'X01':
      return partie.finished
        ? libelleGagneEnManches(nomDuVainqueur(), partie.legsPlayed)
        : libelleManchesDePartie(partie.legsPlayed)
    case 'TOUR_DU_MONDE':
      if (!partie.finished) return sansVainqueur
      return partie.winnerId === null ? LIBELLE_MATCH_NUL : libelleGagne(nomDuVainqueur())
    case 'CRICKET':
      if (!partie.finished) return sansVainqueur
      return partie.winnerId === null ? LIBELLE_TERMINEE : libelleGagne(nomDuVainqueur())
    case 'CHECKOUT_PRACTICE':
      return partie.finished ? libelleSorties(partie.roundsWon, partie.roundsPlayed) : sansVainqueur
    default: {
      const jamais: never = partie
      return String(jamais)
    }
  }
}

type Props = {
  readonly partie: MatchSummary
  readonly statut: MatchStatus
  readonly profils: ReadonlyMap<PlayerId, Player>
  /** « 21 h 04 », « mardi 21 h 10 » ou une date : calculé par l'appelant, la carte ne lit aucune horloge. */
  readonly quand: string
  /** Niveau du titre : 2 par défaut ; l'Accueil, dont les groupes sont des `h2`, passe 3. */
  readonly niveauTitre?: 2 | 3
  /** Le bouton laiton « Reprendre » : la partie en cours seulement, jamais une abandonnée. */
  readonly reprise?: boolean
  /** Hors de la cible principale (suppression à l'Historique) : sa propre cible. */
  readonly actions?: ReactNode
}

/**
 * La carte d'une partie : liseré de laiton, nom en titre, règles et
 * heure dessous, avatars, statut. **Toute la carte est une seule cible** (un
 * lien, ≥ 48 px) : le résumé d'une partie terminée, la reprise sinon. Le
 * « Reprendre » de la partie en cours en est le visuel, pas un second élément
 * focalisable.
 */
export const CartePartie = ({
  partie,
  statut,
  profils,
  quand,
  niveauTitre = 2,
  reprise = false,
  actions,
}: Props) => {
  const Titre = niveauTitre === 3 ? 'h3' : 'h2'
  const texte = texteDeStatut(partie, statut)

  return (
    <li className="flex border border-chene/40 bg-ardoise">
      <Link
        to={partie.finished ? `/partie/${partie.id}/resume` : `/partie/${partie.id}`}
        className="flex min-h-16 min-w-0 flex-1 flex-col gap-2 border-l-4 border-laiton p-3 text-left"
      >
        <Titre className="break-words font-score text-base font-bold tracking-wide text-craie-vive">
          {nomDePartie(partie)}
        </Titre>
        <p className="font-score text-etiquette uppercase tracking-[0.2em] text-craie-3">
          {regles(partie)} · {quand}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-1">
            {partie.players.map((joueur) => (
              <Avatar
                key={joueur.playerId}
                nom={nomJoueur(joueur.name)}
                couleur={profils.get(joueur.playerId)?.color ?? null}
                taille="sm"
              />
            ))}
            <span className="sr-only">
              {partie.players.map((joueur) => nomJoueur(joueur.name)).join(', ')}
            </span>
          </span>

          {statut === 'ABANDONED' && (
            <span className="border border-craie/40 px-2 py-0.5 font-score text-etiquette uppercase tracking-wider text-craie-2">
              {LIBELLE_ABANDONNEE}
            </span>
          )}
          {texte && (
            <span className="font-score text-sm font-bold tracking-wide text-craie">{texte}</span>
          )}
          {partie.finished && <Check aria-hidden="true" className="size-4 shrink-0 text-laiton" />}
        </div>

        {reprise && (
          <span
            className={[
              'laiton-poli mt-1 inline-flex min-h-12 items-center justify-center gap-2 px-4',
              'font-score text-sm font-bold uppercase tracking-widest',
            ].join(' ')}
          >
            <Play aria-hidden="true" className="size-4 fill-current" />
            {LIBELLE_REPRENDRE}
          </span>
        )}
      </Link>
      {actions}
    </li>
  )
}
