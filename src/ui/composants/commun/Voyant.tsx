import { Link, type To } from 'react-router'
import type { TonVoyant } from '@/ui/voyants'

/** L'encre de la valeur : neutre, en alerte (laiton), ou bonne nouvelle (vert). */
export type TeinteVoyant = 'neutre' | 'laiton' | 'vert'

/** L'action d'un voyant : un bouton (export, invite native) ou un lien (ancre). */
export type ActionVoyant =
  | {
      readonly type: 'bouton'
      readonly libelle: string
      /** Le nom accessible, qui contient le texte visible (WCAG 2.5.3). */
      readonly nom: string
      readonly onClick: () => void
      readonly desactivee?: boolean
    }
  | {
      readonly type: 'lien'
      readonly libelle: string
      readonly nom: string
      readonly vers: To
    }

type Props = {
  readonly etiquette: string
  readonly valeur: string
  readonly ton: TonVoyant
  readonly teinte: TeinteVoyant
  readonly action?: ActionVoyant
}

const FILET: Record<TonVoyant, string> = {
  ok: 'border-vert-cible',
  attention: 'border-laiton',
}

/** `vert-etat` est réservé ici : contraste vérifié sur l'ardoise seulement. */
const ENCRE: Record<TeinteVoyant, string> = {
  neutre: 'text-craie-vive',
  laiton: 'text-laiton-clair',
  vert: 'text-vert-etat',
}

/**
 * L'action est soulignée en laiton, mais c'est le voyant ENTIER qui est la
 * cible : un pseudo-élément de l'action le recouvre (`after:inset-0`). La
 * valeur reste hors du contrôle — un `<output>` ne se met pas dans un bouton —
 * et l'anneau de focus suit la zone d'appui, pas le mot.
 */
const CLASSES_ACTION = [
  'self-start font-score text-etiquette uppercase tracking-widest text-laiton-clair',
  'underline underline-offset-3',
  'after:absolute after:inset-0',
  'focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-laiton',
  'disabled:opacity-40',
].join(' ')

/**
 * Un voyant des Réglages (planche `#rg4`) : une étiquette en capitales, une
 * valeur en Oswald, une action facultative. Lu à 30 cm, pas à 3 m.
 */
export const Voyant = ({ etiquette, valeur, ton, teinte, action }: Props) => (
  <div className={`relative flex flex-col gap-1 border-t-3 bg-ardoise px-2 py-2.5 ${FILET[ton]}`}>
    <span className="font-score text-etiquette uppercase tracking-widest text-craie-3">
      {etiquette}
    </span>
    <output
      aria-label={etiquette}
      className={`font-score text-base font-bold leading-[1.1] ${ENCRE[teinte]}`}
    >
      {valeur}
    </output>
    {action?.type === 'bouton' && (
      <button
        type="button"
        aria-label={action.nom}
        disabled={action.desactivee}
        onClick={action.onClick}
        className={CLASSES_ACTION}
      >
        {action.libelle}
      </button>
    )}
    {action?.type === 'lien' && (
      <Link to={action.vers} aria-label={action.nom} className={CLASSES_ACTION}>
        {action.libelle}
      </Link>
    )}
  </div>
)
