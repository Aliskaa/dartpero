import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LivreRegles } from '@/ui/composants/commun/LivreRegles'
import { type NomPictogramme, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import type { ReglesDeLaPartie } from '@/ui/reglesDuJeu'

/** Étiquette cerclée du bandeau (DI, DO, « Dernier tour »). */
export const BadgeBandeau = ({ children }: { readonly children: ReactNode }) => (
  <span className="grave border border-laiton/50 px-1.5 font-score text-etiquette uppercase leading-4 tracking-wider text-laiton-clair">
    {children}
  </span>
)

type Props = {
  readonly pictogramme: NomPictogramme
  readonly titre: string
  readonly sousTitre: string
  /** Sous le sous-titre en portrait, à sa suite en paysage (DI / DO du X01). */
  readonly complement?: ReactNode
  /** Où l'on en est, à droite (« Manche 2 » / « Set 1 »). Absent : rien. */
  readonly droite?: ReactNode
  /** Les règles de la partie, pour le livre ouvert. Obligatoire. */
  readonly regles: ReglesDeLaPartie
}

/** Bandeau de chêne des écrans de partie ; se pose dans l'emplacement `enTete` de `DispositionPartie`. */
export const BandeauMatch = ({
  pictogramme,
  titre,
  sousTitre,
  complement,
  droite,
  regles,
}: Props) => (
  <>
    <Link
      to="/"
      aria-label="Retour à l’accueil"
      className="grave -ml-1 flex size-10 shrink-0 items-center justify-center text-craie-2 active:bg-craie/15"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
    </Link>

    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Pictogramme nom={pictogramme} taille={24} className="shrink-0 text-laiton-clair" />

      <div className="flex min-w-0 flex-col paysage:flex-row paysage:items-center paysage:gap-x-3">
        <p className="grave font-score text-lg font-bold uppercase leading-none tracking-[0.12em] text-laiton-clair">
          {titre}
        </p>

        <p className="grave chiffres truncate text-etiquette font-semibold uppercase leading-4 tracking-[0.08em] text-craie-2">
          {sousTitre}
        </p>

        {complement && <span className="mt-0.5 flex gap-1 paysage:mt-0">{complement}</span>}
      </div>
    </div>

    {droite && (
      <div className="grave flex shrink-0 flex-col items-end font-score text-etiquette font-semibold uppercase leading-4 tracking-[0.14em] text-craie-2 paysage:flex-row paysage:gap-x-3">
        {droite}
      </div>
    )}

    <div className="-my-1 -mr-1 shrink-0 paysage:-mb-0.5">
      <LivreRegles regles={regles} hauteur="moitie" />
    </div>
  </>
)
