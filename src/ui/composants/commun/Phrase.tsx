import type { Segment } from '@/ui/labels'

type Props = {
  readonly segments: readonly Segment[]
  /** Les classes d'un mot fort : c'est l'appelant qui choisit son encre. */
  readonly classeFort: string
}

/** Phrase de `labels.ts` en segments typés ; un mot fort devient un `<strong>`, jamais de HTML brut. */
export const Phrase = ({ segments, classeFort }: Props) => (
  <>
    {segments.map((segment, rang) =>
      typeof segment === 'string' ? (
        segment
      ) : (
        // biome-ignore lint/suspicious/noArrayIndexKey: phrase figée, jamais réordonnée.
        <strong key={rang} className={classeFort}>
          {segment.fort}
        </strong>
      ),
    )}
  </>
)
