import type { Dart } from '@/core/domain/value-objects/Dart'
import { Dart as DartVO } from '@/core/domain/value-objects/Dart'
import { Pictogramme } from '@/ui/composants/commun/Pictogramme'

type Props = {
  readonly cible: number | null
  readonly resteAffiche: number
  readonly suggestion: readonly Dart[] | null
  readonly dartsEnCours: readonly Dart[]
  readonly manche: number
  readonly total: number
  readonly reussies: number
}

/**
 * ZONE LECTURE de l'entraînement.
 *
 * Le chiffre géant est le **reste à sortir** : c'est le seul nombre qui compte,
 * et il descend à chaque fléchette. La cible tirée reste affichée à côté pour
 * qu'on sache d'où l'on partait — sans quoi, après deux fléchettes, on ne sait
 * plus si on a bien joué.
 */
export const Cartouche = ({
  cible,
  resteAffiche,
  suggestion,
  dartsEnCours,
  manche,
  total,
  reussies,
}: Props) => {
  // Une route peut répéter la même cible : la clé porte le rang, mais elle est
  // calculée ici pour rester une donnée stable.
  const cibles = suggestion?.map((dart, rang) => ({
    cle: `${rang}-${DartVO.label(dart)}`,
    libelle: DartVO.label(dart),
  }))

  return (
    <section aria-label="Manche en cours" className="flex flex-col gap-2.5">
      <div className="feuille flex flex-col items-center gap-1 px-4 py-5">
        <p className="font-score text-etiquette uppercase tracking-[0.3em] text-craie-3">
          Sortie demandée
        </p>

        <output
          aria-label="Reste à sortir"
          className="chiffres trace-craie block text-score-solo font-bold leading-none text-craie-vive"
        >
          <span key={resteAffiche} className="inline-block animate-pop-score">
            {resteAffiche}
          </span>
        </output>

        {cible !== null && resteAffiche !== cible && (
          <p className="chiffres text-xs text-craie-3">
            manche partie de <span className="font-bold text-craie-2">{cible}</span>
          </p>
        )}

        <output aria-label="Volée en cours" className="mt-2 flex items-center gap-1.5">
          {[0, 1, 2].map((rang) => {
            const dart = dartsEnCours[rang]
            return (
              <span
                key={rang}
                className={[
                  'chiffres flex h-7 min-w-12 items-center justify-center text-xs font-bold',
                  dart
                    ? 'border border-laiton/60 bg-laiton/20 text-craie-vive'
                    : 'border border-dashed border-craie/20 text-craie-decor',
                ].join(' ')}
              >
                {dart ? DartVO.label(dart) : <span aria-hidden="true">·</span>}
              </span>
            )
          })}
        </output>
      </div>

      {/* La route conseillée : on s'entraîne à sortir, autant apprendre le chemin. */}
      <div className="min-h-11">
        {cibles && (
          <div
            className={[
              'flex animate-monter items-center justify-center gap-2.5 px-3 py-2',
              'border border-vert-cible/60 bg-vert-cible/12',
            ].join(' ')}
          >
            <Pictogramme nom="sortie" taille={20} className="shrink-0 text-vert-cible" />
            <span className="font-score text-etiquette uppercase tracking-[0.28em] text-vert-cible">
              Route
            </span>
            <span className="flex items-center gap-1.5">
              {cibles.map((cible) => (
                <span
                  key={cible.cle}
                  className="chiffres border border-vert-cible/45 bg-feutre/70 px-2 py-0.5 text-base font-bold text-craie-vive"
                >
                  {cible.libelle}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <span className="font-score text-etiquette uppercase tracking-[0.2em] text-craie-3">
          Manche<span className="chiffres font-bold text-craie">{manche}</span>
          <span className="text-craie-3">/{total}</span>
        </span>
        <span className="font-score text-etiquette uppercase tracking-[0.2em] text-craie-3">
          Réussies<span className="chiffres font-bold text-vert-cible">{reussies}</span>
        </span>
      </div>
    </section>
  )
}
