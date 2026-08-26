import type { StatsPeriod } from '@/core/application/ports/driving/GetPlayerStats'
import type { VisitOutcome } from '@/core/domain/entities/Visit'

/** Le cœur reste en anglais ; tout le français de l'app vit ici. */
export const LIBELLE_ISSUE: Record<VisitOutcome, string> = {
  SCORED: 'Volée enregistrée',
  BUSTED: 'Bust !',
  CHECKOUT: 'Sortie !',
}

/**
 * Ce que la voix annonce à la fin d'une volée.
 *
 * ⚠️ Les nombres partent **en chiffres** (« 140 »), pas en lettres : la
 * synthèse vocale française les prononce correctement toute seule, et écrire
 * « cent quarante » ferait buter les voix qui lisent lettre à lettre.
 *
 * C'est ici, et nulle part ailleurs, que se décide ce qui est dit — le port
 * `Announcer` ne reçoit que du texte déjà écrit.
 */
export const annonceVolee = (scored: number, outcome: VisitOutcome): string => {
  if (outcome === 'BUSTED') return 'Bust'
  if (outcome === 'CHECKOUT') return 'Sortie !'
  return String(scored)
}

export const annonceIssue = (outcome: VisitOutcome): string =>
  outcome === 'CHECKOUT' ? 'Sortie !' : outcome === 'BUSTED' ? 'Bust' : 'Raté'

/** « À toi, Julien » — ce qu'on dit vraiment autour d'une cible. */
export const annonceTour = (nom: string): string => `À toi, ${nom}`

export const annonceCible = (libelle: string): string => `Cible : ${libelle}`

/**
 * Ce que la voix dit à la fin d'une volée : le résultat, **puis à qui c'est le
 * tour**. C'est le seul canal qui porte jusqu'à l'oche — le téléphone est posé
 * à deux mètres et personne ne va lire l'écran entre deux volées.
 *
 * ⚠️ Une **seule** phrase, jamais deux appels successifs : l'adapter coupe
 * l'énoncé en cours à chaque `say` (une annonce en retard vaut moins que le
 * silence), donc annoncer le score puis le tour ferait taire le score.
 *
 * `resultat` peut être `null` — une volée blanche au Cricket ne se commente
 * pas, mais elle passe quand même la main, et ça, il faut le dire.
 * `prochain` est `null` en solo et en fin de partie : on ne rappelle pas à un
 * joueur seul que c'est encore à lui, et on n'enchaîne pas sur la victoire.
 */
export const annonceFinDeVolee = (resultat: string | null, prochain: string | null): string => {
  if (prochain === null) return resultat ?? ''
  if (resultat === null) return annonceTour(prochain)
  return `${resultat}. ${annonceTour(prochain)}`
}

/**
 * Ce que le bouton d'annulation va **vraiment** défaire.
 *
 * ⚠️ Deux formes, et c'est volontaire. Une touche de pavé fait une demi-largeur
 * d'écran : « Annuler la volée de Julien » n'y tient pas. Le `court` s'affiche,
 * le `complet` sert de nom accessible — et comme le court est contenu mot pour
 * mot dans le complet, la règle « label in name » (WCAG 2.5.3) est respectée.
 */
export type Annulation = {
  /** Ce qui est écrit sur la touche. */
  readonly court: string
  /** Le nom accessible, qui peut nommer le joueur. */
  readonly complet: string
}

/** Le libellé neutre, quand il n'y a rien à annuler (la touche est désactivée). */
export const ANNULATION_NEUTRE: Annulation = { court: 'Annuler', complet: 'Annuler' }

/**
 * Un seul bouton, deux comportements (la fléchette en cours, ou la dernière
 * volée enregistrée) : c'est la bonne ergonomie, mais une étiquette unique
 * laissait deviner lequel s'appliquerait. À trois autour d'un téléphone, dans
 * un garage, on ne devine pas — surtout quand le second cas peut dé-gagner un
 * leg sans prévenir.
 */
export const libelleAnnulation = (
  flechette: string | null,
  auteurDerniereVolee: string | null,
): Annulation => {
  // Une fléchette est plantée : c'est elle qu'on retire, et son nom tient sur
  // la touche. C'est ce changement visible d'étiquette qui lève l'ambiguïté —
  // « Annuler » tout court veut désormais dire « la dernière volée ».
  if (flechette !== null) {
    const libelle = `Annuler ${flechette}`
    return { court: libelle, complet: libelle }
  }
  if (auteurDerniereVolee !== null) {
    return { court: 'Annuler', complet: `Annuler la volée de ${auteurDerniereVolee}` }
  }
  return ANNULATION_NEUTRE
}

/**
 * Ce que la voix dit d'une volée de Cricket — court, comme au X01.
 *
 * On annonce en priorité les points, parce que c'est ce qui change le
 * classement ; à défaut, la fermeture, qui est l'autre chose qu'on attend. Une
 * volée blanche ne dit rien : la voix n'est pas là pour commenter les ratés.
 * En cut-throat on précise « pour les autres », sinon le joueur croit avoir
 * marqué alors qu'il vient d'offrir des points.
 */
export const annonceCricket = ({
  points,
  fermees,
  gagnee,
  cutThroat,
}: {
  readonly points: number
  readonly fermees: number
  readonly gagnee: boolean
  readonly cutThroat: boolean
}): string | null => {
  if (gagnee) return 'Partie gagnée !'
  if (points > 0) return cutThroat ? `${points} pour les autres` : String(points)
  if (fermees > 0) return fermees > 1 ? `${fermees} cibles fermées` : 'Cible fermée'
  return null
}

/** Le nom de la variante, à l'écran. Le domaine ne connaît que `CUT_THROAT`. */
export const LIBELLE_VARIANTE_CRICKET: Record<'STANDARD' | 'CUT_THROAT', string> = {
  STANDARD: 'Standard',
  CUT_THROAT: 'Cut-throat',
}

/**
 * Les fenêtres de statistiques, côté français.
 *
 * ⚠️ Libellés **courts** : les quatre tiennent sur un rail de 358 px en
 * portrait, et « Depuis toujours » n'y entrerait pas. « Tout » suffit — c'est
 * la légende du rail (« Période ») qui donne le sens.
 */
export const LIBELLE_PERIODE: Record<StatsPeriod, string> = {
  TODAY: "Aujourd'hui",
  LAST_7_DAYS: '7 jours',
  LAST_30_DAYS: '30 jours',
  ALL_TIME: 'Tout',
}

/** La même chose au fil du texte, où la place ne manque pas. */
export const PERIODE_EN_TOUTES_LETTRES: Record<StatsPeriod, string> = {
  TODAY: "aujourd'hui",
  LAST_7_DAYS: 'ces 7 derniers jours',
  LAST_30_DAYS: 'ces 30 derniers jours',
  ALL_TIME: 'toutes parties confondues',
}

export const JOUEUR_SUPPRIME = 'Joueur supprimé'

export const nomJoueur = (nom: string | null): string => nom ?? JOUEUR_SUPPRIME

/** Les moyennes s'affichent avec une décimale, à la française. */
export const moyenne = (valeur: number): string =>
  valeur.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const dateCourte = (horodatage: number): string =>
  new Date(horodatage).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

/** Une partie se repère à sa soirée : la date seule ne suffit pas à distinguer. */
export const dateHeure = (horodatage: number): string =>
  new Date(horodatage).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/** « 3 parties », « 1 partie » — l'accord au singulier revient partout. */
export const pluriel = (nombre: number, singulier: string, pluriel = `${singulier}s`): string =>
  `${nombre} ${nombre > 1 ? pluriel : singulier}`

/**
 * Le format du match, en français — et **plus jamais en « best of »**.
 *
 * ⚠️ « Best of 3 » est une convention à **deux** joueurs : elle compte les legs
 * *joués*, et n'a de sens que parce qu'à deux, « premier à 2 » ne peut pas
 * dépasser 3 legs. À trois ou quatre, la même partie peut en durer six sans
 * que personne ne triche — le libellé mentait donc dès qu'on était plus de
 * deux. Le domaine, lui, a toujours stocké `legsToWin` (« premier à N ») :
 * c'est ce qu'on affiche désormais, tel quel.
 */
export const libelleLegs = (legsToWin: number): string =>
  legsToWin === 1 ? '1 leg' : `premier à ${legsToWin} legs`

/**
 * La même chose pour le bandeau de match, où chaque caractère compte : le mot
 * « leg » y est déjà posé juste avant par le numéro de leg en cours.
 */
export const libelleLegsCourt = (legsToWin: number): string =>
  legsToWin === 1 ? '1 leg' : `premier à ${legsToWin}`

/** Phrases d'ambiance pour les résumés — le côté apéro, hors saisie. */
export const PHRASE_VICTOIRE = [
  'Ça se fête autour de la cible.',
  'Une tournée pour le vainqueur.',
  'Le tableau a parlé.',
  'Bien joué — on remet ça ?',
] as const

export const phraseVictoire = (graine: string): string => {
  let hash = 0
  for (let i = 0; i < graine.length; i += 1) hash = (hash * 31 + graine.charCodeAt(i)) | 0
  const index = Math.abs(hash) % PHRASE_VICTOIRE.length
  return PHRASE_VICTOIRE[index] ?? PHRASE_VICTOIRE[0]
}
