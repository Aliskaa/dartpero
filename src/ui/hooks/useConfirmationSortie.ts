import { useCallback, useEffect, useRef } from 'react'
import { useServices } from '../providers/ServicesProvider'
import { useModaleAuRetour } from './useModaleAuRetour'

/** La clé d'historique de la boîte, et sa seule valeur (liste fermée). */
const CLE_CONFIRMATION = 'confirmation'
const CONFIRMATIONS = ['sortie'] as const

/**
 * Après toute fermeture de la boîte — *Corriger*, *Valider la sortie*, ou une
 * fermeture sans choix — le pavé ignore les appuis pendant ce délai (relecture
 * à l'écran, boucles 3 et 4 : appui fantôme). Les deux boutons recouvrent le
 * pavé, quelle que soit l'orientation (en paysage, *Valider* est même le seul
 * bouton au-dessus) : le second appui d'un double tap tombait sur le pavé que
 * la boîte venait de découvrir et y posait une fléchette — au joueur en cours
 * après *Corriger*, au joueur suivant après *Valider* ; reproduit de 0 à 400 ms
 * d'écart. 500 ms couvre un double appui (≈ 300 ms d'intervalle sur mobile,
 * 400 ms mesurés au pire) avec un peu de marge, et reste plus court que le geste
 * réel qui suit : relever les yeux, viser, toucher — le joueur suivant n'a pas
 * lancé sa première fléchette en 500 ms. `PAUSE_ANNULATION_MS` (1 s) protège
 * autre chose et ne bouge pas.
 */
export const GARDE_APRES_FERMETURE_MS = 500

type Entrees = {
  /** Une sortie attend sa confirmation (dérivé de l'aperçu par le hook du mode). */
  readonly enAttente: boolean
  /** Retire la fléchette de sortie : *Corriger*, et toute fermeture sans choix. */
  readonly corriger: () => void
  /** Enregistre la volée : *Valider la sortie*. */
  readonly valider: () => void
}

/**
 * La boîte « Kevin sort sur D10 ? » (lot `annulation-volee`, forme B), au-dessus
 * du hook du mode. Même mécanisme que la `Modale` et la feuille de règles
 * (CONVENTIONS § 9) : `useModaleAuRetour` pour l'état, une entrée d'historique
 * sur la même URL, que l'on dépile pour fermer.
 *
 * ⚠️ Ce qu'il faut tenir :
 * - `demander()` est appelé **dans le gestionnaire de la fléchette**, jamais
 *   depuis un effet (piège 3 de `useModaleAuRetour`) ;
 * - fermer sans choisir — retour du téléphone, Échap, appui sur le voile —
 *   vaut *Corriger* (U3) : la fléchette de sortie est retirée. Le retour ne
 *   passe par aucun gestionnaire, on le détecte au passage `'sortie'` → `null`
 *   tant qu'une sortie attend et que *Valider* n'a pas été choisi ;
 * - une entrée `confirmation` héritée d'un rechargement (la fléchette en
 *   attente, elle, n'a pas survécu) est dépilée **au montage seulement** : un
 *   rendu peut voir la nouvelle entrée avant la nouvelle fléchette ;
 * - `auRepos` : aucune entrée `confirmation` dans l'historique. L'écran attend
 *   ce repos avant de remplacer la route par le résumé, sinon il remplacerait
 *   l'entrée de la boîte et laisserait la partie derrière elle.
 */
export const useConfirmationSortie = ({ enAttente, corriger, valider }: Entrees) => {
  const { ouverte, ouvrir, fermer } = useModaleAuRetour(CLE_CONFIRMATION, CONFIRMATIONS)
  /** *Valider* a été choisi : la fermeture qui suit n'est pas une correction. */
  const validee = useRef(false)
  const precedente = useRef(ouverte)
  const { clock } = useServices()
  /** L'instant de la dernière fermeture de la boîte, lu sur `services.clock` (jamais `Date.now()`). */
  const fermeeA = useRef<number | null>(null)

  /** Le dépilage au montage a déjà eu lieu (garde contre le double effet de `StrictMode`). */
  const depilee = useRef(false)

  // Au montage seulement : une entrée héritée d'un rechargement n'a plus de
  // fléchette derrière elle. ⚠️ Sous `StrictMode`, l'effet est rejoué alors que
  // `ouverte` vaut encore 'sortie' (le routeur du navigateur met la location à
  // jour en asynchrone) et que la garde « en vol » de `useModaleAuRetour` a été
  // remise à zéro : sans cette ref, deux reculs feraient quitter la partie.
  // biome-ignore lint/correctness/useExhaustiveDependencies: dépilage au montage seulement (voir plus haut)
  useEffect(() => {
    if (depilee.current) return
    depilee.current = true
    if (ouverte !== null && !enAttente) fermer()
  }, [])

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

  const demander = useCallback(() => {
    validee.current = false
    ouvrir('sortie')
  }, [ouvrir])

  /** *Corriger*, Échap et voile : la fléchette part, la boîte se ferme. */
  const surCorriger = useCallback(() => {
    corriger()
    fermeeA.current = clock.now()
    fermer()
  }, [corriger, fermer, clock])

  const surValider = useCallback(() => {
    validee.current = true
    valider()
    // Garde aussi après *Valider* : un double appui poserait sinon une fléchette
    // fantôme au joueur suivant. Si l'écriture échoue (N-1), 500 ms d'appuis
    // ignorés, sans conséquence : la sortie attend toujours.
    fermeeA.current = clock.now()
    fermer()
  }, [valider, fermer, clock])

  return {
    /** La boîte s'affiche : son entrée est dans l'historique ET une sortie attend. */
    ouverte: ouverte === 'sortie' && enAttente,
    auRepos: ouverte === null,
    demander,
    surCorriger,
    surValider,
    /**
     * Le pavé peut-il prendre une fléchette ? Faux pendant `GARDE_APRES_FERMETURE_MS`
     * après toute fermeture de la boîte (*Corriger*, *Valider*, retour, Échap, voile) :
     * l'appui est ignoré sans bruit (ni fléchette, ni haptique). Seul `onFlechette`
     * l'interroge : bascule S/D/T et Annuler ne sont pas concernés.
     */
    pavePret: () =>
      fermeeA.current === null || clock.now() - fermeeA.current >= GARDE_APRES_FERMETURE_MS,
  }
}
