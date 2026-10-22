import { ChevronRight, X } from 'lucide-react'
import { type CSSProperties, type RefObject, useId, useState } from 'react'
import type { GameModeId } from '@/core/domain/games'
import { Phrase } from '@/ui/composants/commun/Phrase'
import { PICTOGRAMME_PAR_MODE, Pictogramme } from '@/ui/composants/commun/Pictogramme'
import { useDialogueNatif } from '@/ui/hooks/useDialogueNatif'
import {
  type BlocRegles,
  type CelluleExemple,
  type ContenuRegles,
  LIBELLE_BULLE,
  LIBELLE_CE_SOIR,
  LIBELLE_EN_BREF,
  LIBELLE_FERMER,
  type RubriqueRegles,
  type Segment,
  SOUS_TITRE_REGLES,
} from '@/ui/labels'

/** Un mot fort se lit en `craie-vive` ; sur une ligne grise (l'autre réglage), en `craie-2-regles`. */
const PhraseRegles = ({
  segments,
  gris = false,
}: {
  readonly segments: readonly Segment[]
  readonly gris?: boolean
}) => (
  <Phrase
    segments={segments}
    classeFort={gris ? 'font-semibold text-craie-2-regles' : 'font-semibold text-craie-vive'}
  />
)

/** Le numéro carré d'une rubrique : décoratif, la position se lit déjà dans la liste. */
const Numero = ({ n }: { readonly n: number }) => (
  <span
    aria-hidden="true"
    className="inline-flex size-4.5 flex-none items-center justify-center border border-laiton text-etiquette tracking-normal"
  >
    {n}
  </span>
)

const TON_CELLULE: Record<NonNullable<CelluleExemple['ton']> | 'texte', string> = {
  chiffre: 'chiffres whitespace-nowrap font-bold text-craie-vive',
  bust: 'text-rouge-texte',
  ok: 'text-vert-texte',
  texte: '',
}

/** Un bloc de rubrique. Un `switch` exhaustif : un bloc oublié ne compile pas. */
const Bloc = ({ bloc }: { readonly bloc: BlocRegles }) => {
  switch (bloc.type) {
    case 'liste':
      return (
        <ul className="flex list-disc flex-col gap-1 pl-3.5">
          {bloc.lignes.map((ligne, rang) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: liste figée, jamais réordonnée.
            <li key={rang} className={ligne.autre ? 'text-craie-3-regles' : undefined}>
              <PhraseRegles segments={ligne.segments} gris={ligne.autre} />
            </li>
          ))}
        </ul>
      )
    case 'paragraphe':
      return (
        <p className={bloc.autre ? 'text-craie-3-regles' : undefined}>
          <PhraseRegles segments={bloc.segments} gris={bloc.autre} />
        </p>
      )
    case 'pastilles':
      return (
        <ul className="flex flex-wrap gap-1">
          {bloc.nombres.map((nombre) => (
            <li
              key={nombre}
              className={[
                'chiffres border px-1.5 py-0.5 text-sm font-bold',
                bloc.autre
                  ? 'border-filet text-craie-3-regles'
                  : 'border-rouge-texte text-rouge-texte',
              ].join(' ')}
            >
              {nombre}
            </li>
          ))}
        </ul>
      )
    case 'exemple':
      return (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {bloc.colonnes.map((colonne) => (
                <th
                  key={colonne}
                  scope="col"
                  className="border-b border-filet px-1 py-[3px] text-left font-score text-etiquette font-medium uppercase tracking-[0.12em] text-craie-3-regles"
                >
                  {colonne}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bloc.lignes.map((cellules, rang) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: exemple figé, jamais réordonné.
              <tr key={rang}>
                {cellules.map((cellule, colonne) => (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: colonnes fixes.
                    key={colonne}
                    className={`border-b border-filet-doux p-1 align-top ${TON_CELLULE[cellule.ton ?? 'texte']}`}
                  >
                    <PhraseRegles segments={cellule.segments} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'questions':
      return (
        <>
          {bloc.questions.map((qr, rang) => (
            <div
              key={qr.question}
              className={`flex flex-col gap-0.5 ${
                rang > 0 ? 'border-t border-dashed border-filet-doux pt-1.5' : ''
              }`}
            >
              <p className="font-semibold text-craie-vive">{qr.question}</p>
              <p>
                <PhraseRegles segments={qr.reponse} />
              </p>
            </div>
          ))}
        </>
      )
    case 'reglages':
      return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1">
          {bloc.reglages.map((reglage) => (
            <div key={reglage.terme} className="contents">
              <dt className="pt-[3px] font-score text-etiquette uppercase tracking-[0.12em] text-craie-3-regles">
                {reglage.terme}
              </dt>
              <dd>
                {reglage.options.map((option, rang) => (
                  <span key={option.libelle}>
                    {rang > 0 && ' · '}
                    {option.ceSoir ? (
                      <span className="font-semibold text-laiton-clair">{option.libelle}</span>
                    ) : (
                      option.libelle
                    )}
                    {option.suite}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      )
    case 'parcours':
      return (
        <ol aria-label={bloc.legende} className="grid grid-cols-7 gap-1">
          {bloc.cibles.map((cible, rang) => {
            const premiere = rang === 0
            const derniere = rang === bloc.cibles.length - 1
            return (
              <li
                key={String(cible)}
                className={[
                  'chiffres flex h-9 min-w-9 items-center justify-center border px-1 text-sm font-bold',
                  derniere
                    ? 'border-laiton bg-laiton text-sur-laiton'
                    : premiere
                      ? 'border-laiton text-laiton-clair'
                      : 'border-craie/25 text-craie',
                ].join(' ')}
              >
                {cible === 'BULL' ? LIBELLE_BULLE : cible}
              </li>
            )
          })}
        </ol>
      )
    default: {
      const jamais: never = bloc
      return jamais
    }
  }
}

/** Rubrique repliable : repliée au montage, plusieurs peuvent être ouvertes. */
const Rubrique = ({
  rubrique,
  numero,
}: {
  readonly rubrique: RubriqueRegles
  readonly numero: number
}) => {
  const [ouverte, setOuverte] = useState(false)
  const id = useId()
  return (
    <div className="border-t border-filet last:border-b">
      <h3>
        <button
          type="button"
          aria-expanded={ouverte}
          aria-controls={id}
          onClick={() => setOuverte(!ouverte)}
          className="flex min-h-12 w-full items-center gap-2 px-0.5 text-left font-score text-etiquette uppercase tracking-[0.16em] text-laiton-texte"
        >
          <Numero n={numero} />
          <span className={`flex-1 ${ouverte ? 'text-laiton-clair' : 'text-craie'}`}>
            {rubrique.titre}
          </span>
          <ChevronRight
            aria-hidden="true"
            className={`size-4.5 shrink-0 motion-safe:transition-transform motion-safe:duration-150 ${
              ouverte ? 'rotate-90 text-laiton-clair' : 'text-craie-3-regles'
            }`}
          />
        </button>
      </h3>
      <div
        id={id}
        hidden={!ouverte}
        className="flex flex-col gap-1.5 pb-3 pl-7 pr-0.5 text-sm text-craie-2-regles"
      >
        {rubrique.blocs.map((bloc, rang) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: blocs figés, jamais réordonnés.
          <Bloc key={rang} bloc={bloc} />
        ))}
      </div>
    </div>
  )
}

type Props = {
  readonly id: string
  readonly mode: GameModeId
  /** Le texte de ce soir, `null` tant que la feuille est fermée (rien n'est calculé). */
  readonly contenu: ContenuRegles | null
  /** Pleine hauteur (étape 2), ou par-dessus le bas de l'écran (match). */
  readonly hauteur: 'pleine' | 'moitie'
  /** En paysage sur le match : le bas du bandeau, en px ; la feuille se pose dessous. */
  readonly hautPaysage: number | null
  /** La croix, Échap, le retour capté par le navigateur ou un appui à côté. */
  readonly onFermer: () => void
  /** Reçoit le focus à la fermeture : le livre (Safari ne donne pas le focus à un bouton touché). */
  readonly retour: RefObject<HTMLElement | null>
}

const DISPOSITION: Record<Props['hauteur'], string> = {
  // Étape 2 : toute la hauteur en portrait ; le côté droit en paysage (planche, 52 %).
  pleine: [
    'top-0',
    'paysage:left-auto paysage:w-[52%] paysage:border-l-[3px] paysage:border-craie',
  ].join(' '),
  // Match : décalée de 210 px sous le bandeau ; paysage : largeur de la colonne du pavé.
  moitie: [
    'top-[210px] border-t-[3px] border-craie',
    'paysage:top-[var(--haut-feuille,0px)] paysage:left-auto paysage:border-t-0',
    'paysage:w-[46%] paysage:max-w-[calc(21rem+max(0.5rem,env(safe-area-inset-right)))]',
    'paysage:border-l-[3px]',
  ].join(' '),
}

/** Feuille de règles : `<dialog>` natif (`showModal()`), pièges tenus par `useDialogueNatif`. ⚠️ Jamais de classe `display` sur le `<dialog>`. */
export const FeuilleRegles = ({
  id,
  mode,
  contenu,
  hauteur,
  hautPaysage,
  onFermer,
  retour,
}: Props) => {
  const ouverte = contenu !== null
  const { boite, croix, surAnnulation, surFermeture, surAppui, surClic } = useDialogueNatif(
    ouverte,
    onFermer,
    retour,
  )
  const idTitre = useId()

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: l'appui à côté n'est qu'un raccourci au doigt ; au clavier, Échap (`cancel`) et ✕ ferment déjà
    <dialog
      ref={boite}
      id={id}
      aria-labelledby={idTitre}
      onCancel={surAnnulation}
      onClose={surFermeture}
      onPointerDown={surAppui}
      onClick={surClic}
      style={
        hautPaysage === null
          ? undefined
          : ({ '--haut-feuille': `${hautPaysage}px` } as CSSProperties)
      }
      className={[
        'fixed inset-x-0 bottom-0 m-0 h-auto max-h-none w-full max-w-none overflow-hidden p-0',
        'bg-ardoise font-sans normal-case tracking-normal text-craie [text-shadow:none]',
        'animate-monter backdrop:bg-voile paysage:backdrop:bg-transparent',
        'paysage:pr-[env(safe-area-inset-right)]',
        DISPOSITION[hauteur],
      ].join(' ')}
    >
      {contenu !== null && (
        <div className="flex h-full flex-col">
          <div
            className={[
              'flex flex-none items-center gap-2.5 border-b border-filet bg-feutre-nuit px-3 py-2.5',
              hauteur === 'pleine' ? 'pt-[max(0.625rem,env(safe-area-inset-top))]' : '',
            ].join(' ')}
          >
            <Pictogramme
              nom={PICTOGRAMME_PAR_MODE[mode]}
              taille={24}
              className="shrink-0 text-laiton-clair"
            />
            <div className="min-w-0 flex-1">
              <h2
                id={idTitre}
                className="font-score text-lg font-bold uppercase leading-[1.1] tracking-[0.06em] text-craie-vive"
              >
                {contenu.titre}
              </h2>
              <p className="font-score text-etiquette uppercase tracking-[0.16em] text-craie-3-regles">
                {SOUS_TITRE_REGLES}
              </p>
            </div>
            <button
              ref={croix}
              type="button"
              aria-label={LIBELLE_FERMER}
              onClick={onFermer}
              className="flex size-12 shrink-0 items-center justify-center border border-chene-doux text-craie-2-regles"
            >
              <X aria-hidden="true" className="size-5.5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3.5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="border border-laiton-sombre px-3 py-[9px]">
              <p className="font-score text-etiquette uppercase tracking-[0.18em] text-laiton-texte">
                {LIBELLE_CE_SOIR}
              </p>
              <p className="mt-0.5 font-score text-base text-laiton-clair">{contenu.ceSoir}</p>
            </div>

            <section>
              <h3 className="mb-1 flex items-center gap-2 font-score text-etiquette uppercase tracking-[0.16em] text-laiton-texte">
                <Numero n={1} />
                {LIBELLE_EN_BREF}
              </h3>
              <p className="text-base text-craie">
                <PhraseRegles segments={contenu.enBref} />
              </p>
            </section>

            <div className="flex flex-col">
              {contenu.rubriques.map((rubrique, rang) => (
                <Rubrique key={rubrique.titre} rubrique={rubrique} numero={rang + 2} />
              ))}
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
