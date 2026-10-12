import { Crown } from 'lucide-react'
import type { VisitOutcome } from '@/core/domain/entities/Visit'
import { type Dart, Dart as DartVO } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Batons } from '@/ui/composants/commun/Batons'
import { couleurJoueur } from '@/ui/couleurs'
import { etiquetteManchesGagnees, moyenne as formatMoyenne, LIBELLE_MANCHES } from '@/ui/labels'

/**
 * La volée montrée sur la ligne : celle **en cours** pour le joueur actif,
 * la dernière enregistrée pour les autres. C'est la question qui revient le
 * plus souvent autour d'une cible — « t'as mis quoi, là ? ».
 */
export type VoleeAffichee = {
  readonly darts: readonly Dart[]
  readonly total: number
  /** `null` tant que la volée est en cours de saisie. */
  readonly outcome: VisitOutcome | null
}

/** Plus il y a de joueurs, moins chaque ligne a de hauteur — le chiffre suit. */
export type Echelle = 'large' | 'moyen' | 'compact'

const RESTE: Record<Echelle, string> = {
  large: 'text-[4.25rem] leading-[0.84]',
  moyen: 'text-[3.25rem] leading-[0.88]',
  compact: 'text-[2.5rem] leading-[0.9]',
}

const HAUTEUR: Record<Echelle, string> = {
  large: 'py-5',
  moyen: 'py-3.5',
  compact: 'py-2.5',
}

/**
 * Les quatre colonnes de la feuille — joueur, volée, manches, reste — à
 * largeur FIXE pour les trois dernières : c'est en alignant les chiffres d'une
 * ligne à l'autre qu'on les compare, donc les colonnes doivent exister vraiment.
 *
 * ⚠️ **La largeur est la contrainte la plus serrée de l'écran, et une colonne
 * de plus ne rentre pas.** En portrait 390 px il ne reste que 360 px une fois
 * retirés le `p-3` de la disposition et le filet de 3 px de la feuille ; les
 * trois colonnes fixes en prennent 212, donc JOUEUR vit sur ~148 px — juste ce
 * qu'il faut pour trois cases de fléchettes à `text-sm`, « BULL » compris.
 * Quand « Legs » est devenu « Manches », les 12 px qu'il fallait à l'en-tête
 * ont été pris sur VOLÉE (72 → 60 px, MANCHES 32 → 44 px) : la somme reste
 * 212 px et JOUEUR ne perd rien.
 * Une cinquième colonne a été essayée puis retirée : elle ramenait JOUEUR à
 * 108 px en portrait et à **81 px en paysage**, où les pseudos se tronquaient
 * en « MAÏ… ». Ce qu'on gagne en colonnes se paie sur ces trois cases-là.
 */
export const GRILLE_LIGNE = 'grid grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_6.75rem]'

type Props = {
  readonly nom: string
  readonly couleur: PlayerColor | null
  readonly reste: number
  readonly actif: boolean
  readonly vainqueur: boolean
  readonly volee: VoleeAffichee | null
  readonly legsGagnes: number
  readonly legsRequis: number
  readonly setsGagnes: number
  readonly setsRequis: number
  readonly moyenne: number
  readonly echelle: Echelle
}

/**
 * ZONE LECTURE — une LIGNE DE FEUILLE DE MATCH, une par joueur.
 *
 * Piste E : ce qui structure la lecture, ce sont les colonnes et les filets,
 * pas le relief. Quatre cases — qui joue, ce qu'il vient de faire, où il en est
 * dans le match, ce qui lui reste — sous les en-têtes portés par `Tableau`. Les
 * chiffres s'alignent parce que les colonnes existent vraiment, pas parce qu'on
 * a bricolé des largeurs au jugé.
 *
 * ⚠️ Une donnée sans en-tête est un hiéroglyphe : les bâtons de legs vivaient
 * empilés sous le score, sous un en-tête qui n'annonçait que le reste. Ils ont
 * donc leur colonne, et RESTE ne porte plus que le reste.
 *
 * ⚠️ **Le nombre de fléchettes lancées ne s'affiche PAS pendant la partie.**
 * Il a eu sa colonne le temps d'un essai : à l'usage il ne sert à rien une
 * fléchette à la main — on veut savoir ce qu'il reste, pas ce qu'on a lancé.
 * Il n'est pas perdu pour autant, il vit là où on le consulte vraiment, après
 * coup : en en-tête de chaque joueur dans le résumé de partie, et dans les
 * stats de carrière, où il est le dénominateur de la moyenne 3 fléchettes.
 *
 * Hiérarchie visuelle :
 * 1. à 3 m — le reste, et le filet de laiton qui dit qui lance ;
 * 2. à 1 m — les fléchettes écrites sur leur ligne, le total, les bâtons ;
 * 3. à 30 cm — la moyenne.
 */
export const LigneJoueur = ({
  nom,
  couleur,
  reste,
  actif,
  vainqueur,
  volee,
  legsGagnes,
  legsRequis,
  setsGagnes,
  setsRequis,
  moyenne,
  echelle,
}: Props) => {
  const teinte = couleurJoueur(couleur)
  const bust = volee?.outcome === 'BUSTED'
  const sortie = volee?.outcome === 'CHECKOUT'
  /** Une issue absente signe une volée encore en train d'être saisie. */
  const enSaisie = volee !== null && volee.outcome === null

  return (
    <article
      aria-current={actif ? 'true' : undefined}
      className={[
        'ligne-tableau relative',
        GRILLE_LIGNE,
        HAUTEUR[echelle],
        'transition-opacity duration-300',
        bust ? 'animate-secousse' : '',
        actif ? 'au-lancer' : 'opacity-70',
      ].join(' ')}
    >
      {/* COLONNE 1 — qui joue, et ce qu'il vient d'écrire. */}
      <div className="flex min-w-0 flex-col justify-center gap-2 px-3 paysage:px-2">
        <p className="flex min-w-0 items-center gap-2">
          {/* La couleur du profil : un carré de repère, pas une pastille. */}
          <span
            aria-hidden="true"
            style={{ backgroundColor: bust ? undefined : teinte.fond }}
            className={`size-3 shrink-0 ${bust ? 'bg-rouge-cible' : ''}`}
          />
          <span
            className={`truncate font-score text-base font-bold uppercase tracking-[0.08em] ${
              actif ? 'text-craie-vive' : 'text-craie/75'
            }`}
          >
            {nom}
          </span>
          {vainqueur && <Crown aria-hidden="true" className="size-4 shrink-0 text-accent-mode" />}
        </p>

        {/* Les trois fléchettes, écrites sur leur ligne comme au stylo.
            Trois cases de grille `minmax(0, 2.75rem)` : une largeur de case à
            fléchette, PLAFONNÉE — et qui se resserre d'elle-même si la colonne
            maigrit. Les deux bornes comptent autant l'une que l'autre :
            - sans le plafond, les cases se partagent toute la colonne, et sur
              un écran large « S2 » s'étale sous un filet de 400 px ;
            - sans le plancher à 0 (les `min-w-[2.75rem]` d'avant), elles
              refusent de rétrécir et débordent sur la colonne d'à côté dès que
              la place manque — ce qu'elles faisaient en paysage.
            ⚠️ En paysage la colonne perd 26 px : sans le resserrage ci-dessous,
            « BULL » (29,4 px) se faisait rogner par une case de 29,0 px. */}
        <output
          aria-label={enSaisie ? 'Volée en cours' : `Dernière volée de ${nom}`}
          className={[
            'grid grid-cols-[repeat(3,minmax(0,2.75rem))] justify-start',
            'items-end gap-1.5 paysage:gap-1',
          ].join(' ')}
        >
          {[0, 1, 2].map((rang) => {
            const dart = volee?.darts[rang]
            return (
              <span
                key={rang}
                className={[
                  'ligne-saisie chiffres min-w-0 overflow-hidden pb-0.5 text-center',
                  'text-sm font-bold leading-none',
                  dart
                    ? bust
                      ? 'text-rouge-cible line-through'
                      : 'text-craie-vive'
                    : 'text-craie/20',
                ].join(' ')}
              >
                {dart ? DartVO.label(dart) : '—'}
              </span>
            )
          })}
        </output>
      </div>

      {/* COLONNE 2 — la volée : son total, ou ce qui l'a annulée. */}
      <div className="filet-colonne flex flex-col items-center justify-center gap-1 px-1">
        {bust ? (
          <span className="font-score text-xs font-bold uppercase tracking-[0.14em] text-rouge-cible">
            Bust
          </span>
        ) : sortie ? (
          <span className="font-score text-xs font-bold uppercase tracking-[0.14em] text-vert-cible">
            Sortie
          </span>
        ) : (
          <span
            className={`chiffres text-2xl font-bold leading-none ${
              volee && volee.darts.length > 0 ? 'text-craie' : 'text-craie/20'
            }`}
          >
            {volee && volee.darts.length > 0 ? volee.total : '—'}
          </span>
        )}

        <span className="entete-colonne text-[0.55rem] normal-case tracking-normal">
          moy <span className="chiffres font-semibold text-craie/80">{formatMoyenne(moyenne)}</span>
        </span>
      </div>

      {/* COLONNE 3 — les manches, en bâtons. Une colonne, donc un en-tête : le
          paquet de traits cesse d'être un hiéroglyphe sous le score. */}
      <output
        aria-label={etiquetteManchesGagnees(nom, legsGagnes, legsRequis)}
        className="filet-colonne flex flex-col items-center justify-center gap-1 px-1"
      >
        <Batons gagnes={legsGagnes} requis={legsRequis} libelle={LIBELLE_MANCHES} />
        {setsRequis > 1 && <Batons gagnes={setsGagnes} requis={setsRequis} libelle="Sets" />}
      </output>

      {/* COLONNE 4 — le reste, et RIEN d'autre. C'est LE chiffre qu'on lit
          depuis l'oche : il n'a plus à porter deux notes de bas de page. */}
      <div className="filet-colonne flex flex-col items-center justify-center px-1">
        <output
          aria-label={`Score restant de ${nom}`}
          className={`chiffres trace-craie block font-bold text-craie-vive ${RESTE[echelle]}`}
        >
          {/* La `key` fait rejouer le « pop » à chaque changement de valeur. */}
          <span key={reste} className="inline-block animate-pop-score">
            {reste}
          </span>
        </output>
      </div>
    </article>
  )
}
