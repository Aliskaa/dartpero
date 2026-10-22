import { nombre, VALEUR_ABSENTE } from '@/ui/labels'

/** Bâtons de craie : un total groupé par cinq, en SVG. ⚠️ Pas `Batons`, qui montre des manches gagnées sur requises. */

/** Au-delà de 10 groupes (50 bâtons), la rangée ne s'allonge plus : le nombre dit le reste. */
export const PLAFOND_GROUPES_BATONS = 10

/** Le dessin d'un compte : des groupes de cinq, puis le reste. */
export const decompteBatons = (
  n: number,
): { readonly groupes: number; readonly reste: number } => ({
  groupes: Math.min(Math.floor(n / 5), PLAFOND_GROUPES_BATONS),
  reste: n > PLAFOND_GROUPES_BATONS * 5 ? 0 : n % 5,
})

/** Un groupe de `k` traits (1 à 4), barré s'il est complet. Géométrie de la planche. */
const Groupe = ({ traits, barre }: { readonly traits: number; readonly barre: boolean }) => {
  const largeur = traits * 5 + 4
  return (
    <svg
      viewBox={`0 0 ${largeur} 16`}
      width={largeur}
      height={16}
      aria-hidden="true"
      focusable="false"
      stroke="currentColor"
      strokeWidth={1.8}
      className="block shrink-0"
    >
      {Array.from({ length: traits }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: des traits identiques, sans identité propre
        <line key={i} x1={2 + i * 5} y1={1} x2={2 + i * 5} y2={15} />
      ))}
      {barre && <line x1={0} y1={13} x2={largeur} y2={3} />}
    </svg>
  )
}

/** Couleur d'une rangée par seuil (180 laiton, 140+ craie, 100+ `craie-2`) : tokens pleins, jamais d'alpha. */
export type TeinteBatons = 'text-laiton' | 'text-craie' | 'text-craie-2'

type Props = {
  readonly nombre: number
  readonly teinte: TeinteBatons
}

/** Les bâtons d'un compte, puis le nombre en texte ; « — » quand il est nul. */
export const CompteBatons = ({ nombre: n, teinte }: Props) => {
  if (n === 0) {
    return <span className="chiffres text-etiquette text-craie-3">{VALEUR_ABSENTE}</span>
  }

  const { groupes, reste } = decompteBatons(n)

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: groupes }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: des groupes identiques, sans identité propre
        <span key={i} className={teinte}>
          <Groupe traits={4} barre />
        </span>
      ))}
      {reste > 0 && (
        <span className={teinte}>
          <Groupe traits={reste} barre={false} />
        </span>
      )}
      <span className="chiffres ml-0.5 text-etiquette text-craie">{nombre(n)}</span>
    </span>
  )
}
