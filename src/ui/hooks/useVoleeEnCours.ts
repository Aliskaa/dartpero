import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnyMatchState } from '@/core/domain/games'
import type { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId } from '@/core/domain/value-objects/ids'
import { useServices } from '../providers/ServicesProvider'

/** Où en est une volée : `ouverte`, `en-attente` (sortie à valider) ou `close` (part au journal). */
export type EtatVolee = 'ouverte' | 'en-attente' | 'close'

/** Une seule référence pour « aucune fléchette » : les `useMemo` des hooks ne se recalculent pas pour rien. */
const AUCUNE: readonly Dart[] = []

/** Une volée relue n'est rendue que si elle est encore ouverte : une volée close aurait dû partir au journal. */
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
 * La volée en cours des cinq hooks de mode, doublée d'un brouillon hors journal. ⚠️ Reprise silencieuse, lue une fois ;
 * écritures en file (échec avalé) ; estampille = état affiché au geste ; `poser` hors de tout updater de `setState`.
 */
export const useVoleeEnCours = <S extends AnyMatchState>(
  matchId: MatchId,
  state: S | null,
  evaluer: (state: S, darts: readonly Dart[]) => EtatVolee,
) => {
  const { manageVisitDraft, shareMatch } = useServices()
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
        // Une volée qu'on ne sait pas juger est traitée comme refusée, sinon `pret` resterait faux.
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

  const darts = saisie.matchId === matchId ? saisie.darts : AUCUNE
  const pret = pretPour === matchId

  // Le miroir suit l'état affiché ; inactive, la session ne fait que retenir le dernier appel.
  useEffect(() => {
    if (!pret || state === null) return
    shareMatch.publish({ matchId, base: state, darts })
  }, [shareMatch, matchId, state, darts, pret])

  return {
    darts,
    poser,
    /** Le brouillon de cette partie a été relu (ou écarté) : la saisie peut commencer. */
    pret,
  }
}
