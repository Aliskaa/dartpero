import type { VisitOutcome } from '@/core/domain/entities/Visit'

/** Le cœur reste en anglais ; tout le français de l'app vit ici. */
export const LIBELLE_ISSUE: Record<VisitOutcome, string> = {
  SCORED: 'Volée enregistrée',
  BUSTED: 'Bust !',
  CHECKOUT: 'Sortie !',
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
