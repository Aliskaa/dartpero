import { useCallback, useEffect, useRef } from 'react'
import { useServices } from '../providers/ServicesProvider'
import { useModaleAuRetour } from './useModaleAuRetour'

/** La clé d'historique de la boîte, et sa seule valeur (liste fermée). */
const CLE_CONFIRMATION = 'confirmation'
const CONFIRMATIONS = ['sortie'] as const

/** Le pavé ignore les appuis 500 ms après la fermeture de la boîte : le second appui d'un double tap posait une fléchette fantôme. */
export const GARDE_APRES_FERMETURE_MS = 500

type Entrees = {
  /** La volée en cours est relue du brouillon : avant, on ignore si une sortie attend. */
  readonly pret: boolean
  /** Une sortie attend sa confirmation (dérivé de l'aperçu par le hook du mode). */
  readonly enAttente: boolean
  /** Retire la fléchette de sortie : *Corriger*, et toute fermeture sans choix. */
  readonly corriger: () => void
  /** Enregistre la volée : *Valider la sortie*. */
  readonly valider: () => void
}

/**
 * La boîte « Kevin sort sur D10 ? ». ⚠️ `demander()` s'appelle dans le gestionnaire de fléchette, sauf
 * la réconciliation unique après relecture du brouillon ; fermer sans choisir vaut *Corriger*.
 */
export const useConfirmationSortie = ({ pret, enAttente, corriger, valider }: Entrees) => {
  const { ouverte, ouvrir, fermer } = useModaleAuRetour(CLE_CONFIRMATION, CONFIRMATIONS)
  const validee = useRef(false)
  const precedente = useRef(ouverte)
  const { clock } = useServices()
  const fermeeA = useRef<number | null>(null)
  /** Garde contre le double effet de `StrictMode`. */
  const reconciliee = useRef(false)

  const demander = useCallback(() => {
    validee.current = false
    ouvrir('sortie')
  }, [ouvrir])

  // Une fois, volée relue : l'entrée d'historique et la sortie en attente doivent se correspondre.
  // ⚠️ Sans la ref, `StrictMode` rejouerait l'effet : deux reculs ou deux entrées empilées.
  // biome-ignore lint/correctness/useExhaustiveDependencies: une seule fois, au premier rendu où `pret` est vrai (voir plus haut)
  useEffect(() => {
    if (!pret || reconciliee.current) return
    reconciliee.current = true
    if (ouverte !== null && !enAttente) fermer()
    else if (ouverte === null && enAttente) demander()
  }, [pret])

  useEffect(() => {
    const avant = precedente.current
    precedente.current = ouverte
    if (avant !== 'sortie' || ouverte !== null) return
    if (validee.current) {
      validee.current = false
      return
    }
    // Retour du téléphone : comme *Corriger*.
    if (enAttente) {
      corriger()
      fermeeA.current = clock.now()
    }
  }, [ouverte, enAttente, corriger, clock])

  /** *Corriger*, Échap et voile : la fléchette part, la boîte se ferme. */
  const surCorriger = useCallback(() => {
    corriger()
    fermeeA.current = clock.now()
    fermer()
  }, [corriger, fermer, clock])

  const surValider = useCallback(() => {
    validee.current = true
    valider()
    // Garde aussi après *Valider* : sinon un double appui poserait une fléchette au joueur suivant.
    fermeeA.current = clock.now()
    fermer()
  }, [valider, fermer, clock])

  return {
    ouverte: ouverte === 'sortie' && enAttente,
    /** Aucune entrée `confirmation` dans l'historique : l'écran attend ce repos avant d'aller au résumé. */
    auRepos: ouverte === null,
    demander,
    surCorriger,
    surValider,
    /** Faux pendant `GARDE_APRES_FERMETURE_MS` après une fermeture ; seul `onFlechette` l'interroge. */
    pavePret: () =>
      fermeeA.current === null || clock.now() - fermeeA.current >= GARDE_APRES_FERMETURE_MS,
  }
}
