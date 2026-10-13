/**
 * Le jour calendaire **local** d'une partie, relativement à « maintenant ».
 *
 * `maintenant` vient de `services.clock.now()` : jamais `Date.now()` ici.
 * `Date` ne sert que de **calendrier** pour des horodatages donnés.
 *
 * ⚠️ Les bornes de minuit se construisent par **composantes** locales
 * (`new Date(a, m, j - 6)`), jamais en retranchant `86 400 000 × N` : les jours
 * de changement d'heure durent 23 ou 25 h, et le résultat tomberait à 23 h ou
 * à 1 h du mauvais jour.
 */
export type GroupeDeJour = 'AUJOURDHUI' | 'CETTE_SEMAINE'

/** Le nombre de jours de la fenêtre : aujourd'hui + les 6 jours précédents. */
const JOURS_PRECEDENTS = 6

/**
 * - `AUJOURDHUI` : de minuit local à minuit local suivant ;
 * - `CETTE_SEMAINE` : les 6 jours calendaires précédents (J-1 à J-6) ;
 * - `null` : plus ancien (J-7 et avant) **ou dans le futur**.
 *
 * Le futur (un `createdAt` importé absurde, une horloge d'appareil déréglée)
 * est écarté de l'Accueil plutôt que rangé sous « Aujourd'hui » : un horodatage
 * de l'an 2100 collé en tête de l'écran le plus ouvert, pour toujours, serait
 * pire qu'une carte absente — la partie reste visible dans l'onglet Parties.
 * Sans effet sur la partie en cours, qui est épinglée à part.
 */
export const groupeDeJour = (createdAt: number, maintenant: number): GroupeDeJour | null => {
  const ref = new Date(maintenant)
  const annee = ref.getFullYear()
  const mois = ref.getMonth()
  const jour = ref.getDate()

  const debutDemain = new Date(annee, mois, jour + 1).getTime()
  if (createdAt >= debutDemain) return null

  if (createdAt >= new Date(annee, mois, jour).getTime()) return 'AUJOURDHUI'
  if (createdAt >= new Date(annee, mois, jour - JOURS_PRECEDENTS).getTime()) return 'CETTE_SEMAINE'
  return null
}
