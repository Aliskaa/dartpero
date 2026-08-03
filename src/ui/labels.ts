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
