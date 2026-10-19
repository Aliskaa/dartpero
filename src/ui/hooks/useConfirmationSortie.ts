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
  /**
   * La volée en cours a été relue du brouillon (lot `volee-partielle`) : tant
   * qu'elle ne l'est pas, on ne sait pas encore si une sortie attend.
   */
  readonly pret: boolean
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
 *   depuis un effet (piège 3 de `useModaleAuRetour`) — avec **une** exception,
 *   ci-dessous ;
 * - fermer sans choisir — retour du téléphone, Échap, appui sur le voile —
 *   vaut *Corriger* (U3) : la fléchette de sortie est retirée. Le retour ne
 *   passe par aucun gestionnaire, on le détecte au passage `'sortie'` → `null`
 *   tant qu'une sortie attend et que *Valider* n'a pas été choisi ;
 * - **réconciliation, une seule fois, quand `pret`** (lot `volee-partielle`) :
 *   la volée en cours se relit en asynchrone, on ne juge donc l'entrée
 *   `confirmation` qu'une fois le brouillon relu, jamais au montage. Entrée
 *   héritée sans sortie en attente : dépilée. Entrée héritée avec sortie en
 *   attente : rien, la boîte s'affiche. **Pas d'entrée mais une sortie en
 *   attente** (la fléchette a survécu au rechargement, pas l'entrée) :
 *   `demander()` depuis l'effet — l'exception au piège 3, gardée par une ref
 *   (une seule fois, même sous `StrictMode`) et par la garde « en vol » de
 *   `useModaleAuRetour`. Résiduel R2 : sans geste préalable, Chrome peut sauter
 *   cette entrée au retour ; rien n'est écrit, la boîte revient à la réouverture.
 *   Un rendu peut voir la nouvelle entrée avant la nouvelle fléchette : d'où
 *   « une seule fois » ;
 * - `auRepos` : aucune entrée `confirmation` dans l'historique. L'écran attend
 *   ce repos avant de remplacer la route par le résumé, sinon il remplacerait
 *   l'entrée de la boîte et laisserait la partie derrière elle.
 */
export const useConfirmationSortie = ({ pret, enAttente, corriger, valider }: Entrees) => {
  const { ouverte, ouvrir, fermer } = useModaleAuRetour(CLE_CONFIRMATION, CONFIRMATIONS)
  /** *Valider* a été choisi : la fermeture qui suit n'est pas une correction. */
  const validee = useRef(false)
  const precedente = useRef(ouverte)
  const { clock } = useServices()
  /** L'instant de la dernière fermeture de la boîte, lu sur `services.clock` (jamais `Date.now()`). */
  const fermeeA = useRef<number | null>(null)

  /** La réconciliation a déjà eu lieu (garde contre le double effet de `StrictMode`). */
  const reconciliee = useRef(false)

  const demander = useCallback(() => {
    validee.current = false
    ouvrir('sortie')
  }, [ouvrir])

  // Une fois, quand la volée en cours est relue : l'entrée d'historique et la
  // sortie en attente doivent se correspondre. ⚠️ Sous `StrictMode`, l'effet est
  // rejoué alors que `ouverte` n'a pas encore suivi (le routeur du navigateur met
  // la location à jour en asynchrone) et que la garde « en vol » de
  // `useModaleAuRetour` a été remise à zéro : sans cette ref, deux reculs
  // feraient quitter la partie, ou deux entrées seraient empilées.
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
