import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnyMatchState } from '@/core/domain/games'
import type { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { useServices } from '../providers/ServicesProvider'

/**
 * Où en est une volée, d'après les règles du mode (lues sur son port de
 * prévisualisation, jamais recopiées) :
 * - `ouverte` : elle attend une fléchette de plus ;
 * - `en-attente` : la fléchette qui sort, gagne ou boucle attend *Valider* ;
 * - `close` : elle part au journal (trois fléchettes, bust, fin de manche
 *   d'entraînement).
 */
export type EtatVolee = 'ouverte' | 'en-attente' | 'close'

/** Une seule référence pour « aucune fléchette » : les `useMemo` des hooks ne se recalculent pas pour rien. */
const AUCUNE: readonly Dart[] = []

/**
 * Une volée relue du disque n'est rendue que si chaque fléchette avant la
 * dernière la laissait ouverte, et si la dernière ne la clôt pas : une volée
 * close aurait dû partir au journal, elle n'a rien à faire en saisie.
 */
const legale = <S>(
  base: S,
  darts: readonly Dart[],
  evaluer: (state: S, darts: readonly Dart[]) => EtatVolee,
): boolean => {
  for (let longueur = 1; longueur < darts.length; longueur += 1) {
    if (evaluer(base, darts.slice(0, longueur)) !== 'ouverte') return false
  }
  return evaluer(base, darts) !== 'close'
}

/**
 * La volée en cours, commune aux quatre hooks de mode (lot `volee-partielle`) :
 * l'état local de la saisie, doublé d'un **brouillon** hors du journal qui la
 * fait survivre à un rechargement ou à un aller-retour par l'Accueil.
 *
 * ⚠️ Ce qu'il faut tenir :
 * - **Lecture une fois par ouverture** de la partie, dès que son état est là.
 *   Une volée acceptée est posée **sans écriture, sans haptique, sans voix** :
 *   rien n'est dit ni célébré à la reprise. Refusée, elle est effacée. Tant que
 *   la lecture n'a pas répondu, `pret` est faux (l'écran garde son spinner).
 *   Sous `StrictMode`, la même lecture est partagée par les deux effets : un
 *   seul appel au dépôt, un seul résultat appliqué (drapeau `actif`).
 * - **Les écritures passent par une file** : chacune attend la précédente, dans
 *   l'ordre des appels. La fléchette qui clôt la volée est écrite, puis effacée
 *   après l'enregistrement, jamais l'inverse. Un échec est avalé : ni erreur
 *   affichée, ni pavé grisé — seule la reprise manquera.
 * - **L'estampille** est l'état affiché au moment du geste (`base`), jamais
 *   relu à l'écriture : voir `ManageVisitDraftUseCase.save`.
 * - `poser` hors de tout updater de `setState` (`StrictMode` le rejouerait, et
 *   l'écriture avec).
 */
export const useVoleeEnCours = <S extends AnyMatchState>(
  matchId: MatchId,
  state: S | null,
  evaluer: (state: S, darts: readonly Dart[]) => EtatVolee,
) => {
  const { manageVisitDraft } = useServices()
  /** La partie de la volée : celle d'une autre partie n'est jamais rendue. */
  const [saisie, setSaisie] = useState<{
    readonly matchId: MatchId
    readonly darts: readonly Dart[]
  }>({ matchId, darts: [] })
  const [pretPour, setPretPour] = useState<MatchId | null>(null)

  const file = useRef<Promise<void>>(Promise.resolve())
  const lecture = useRef<{
    readonly matchId: MatchId
    readonly resultat: Promise<readonly Dart[]>
  } | null>(null)
  // Les règles du mode, sans réarmer l'effet de lecture à chaque rendu.
  const evaluerRef = useRef(evaluer)
  evaluerRef.current = evaluer

  const ecrire = useCallback(
    (darts: readonly Dart[], base: AnyMatchState) => {
      file.current = file.current
        .then(() => manageVisitDraft.save({ matchId, base, darts }))
        .catch(() => {
          // Le brouillon manquera à la reprise, rien de plus : la saisie continue.
        })
    },
    [manageVisitDraft, matchId],
  )

  useEffect(() => {
    if (state === null || pretPour === matchId) return
    const base = state
    if (lecture.current?.matchId !== matchId) {
      lecture.current = { matchId, resultat: manageVisitDraft.restore({ matchId, base }) }
    }
    let actif = true
    lecture.current.resultat.then(
      (darts) => {
        if (!actif) return
        // Les règles du mode jugent la volée relue : si elles levaient, `pret`
        // resterait faux et l'écran garderait son spinner à chaque ouverture.
        // Une volée qu'on ne sait pas juger est traitée comme refusée : effacée
        // au mieux, et la partie s'ouvre sans elle.
        try {
          if (darts.length > 0) {
            if (legale(base, darts, evaluerRef.current)) setSaisie({ matchId, darts })
            else ecrire([], base)
          }
        } catch {
          ecrire([], base)
        } finally {
          setPretPour(matchId)
        }
      },
      () => {
        // Brouillon illisible : la partie s'ouvre sans volée en cours.
        if (actif) setPretPour(matchId)
      },
    )
    return () => {
      actif = false
    }
  }, [state, pretPour, matchId, manageVisitDraft, ecrire])

  /** Pose la volée en saisie et l'écrit au brouillon, estampillée avec `base`. */
  const poser = useCallback(
    (darts: readonly Dart[], base: AnyMatchState) => {
      setSaisie({ matchId, darts })
      ecrire(darts, base)
    },
    [matchId, ecrire],
  )

  return {
    darts: saisie.matchId === matchId ? saisie.darts : AUCUNE,
    poser,
    /** Le brouillon de cette partie a été relu (ou écarté) : la saisie peut commencer. */
    pret: pretPour === matchId,
  }
}
