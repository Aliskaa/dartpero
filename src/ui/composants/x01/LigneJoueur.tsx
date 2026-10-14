import type { VisitOutcome } from '@/core/domain/entities/Visit'
import type { Dart } from '@/core/domain/value-objects/Dart'
import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import { Batons } from '@/ui/composants/commun/Batons'
import { CasesVolee } from '@/ui/composants/commun/CasesVolee'
import { NomJoueurFeuille } from '@/ui/composants/commun/NomJoueurFeuille'
import {
  etiquetteManchesGagnees,
  etiquetteVoleeLigne,
  moyenne as formatMoyenne,
  LIBELLE_MANCHES,
} from '@/ui/labels'

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

/**
 * Le reste est plus grand en portrait (lecture à 3 m) qu'en paysage, où la
 * hauteur manque : les tailles d'avant restent celles du paysage.
 */
const RESTE: Record<Echelle, string> = {
  large: 'text-score-xl-portrait paysage:text-score-xl leading-[0.84]',
  moyen: 'text-score-l-portrait paysage:text-score-l leading-[0.88]',
  compact: 'text-score-m-portrait paysage:text-score-m leading-[0.9]',
}

const HAUTEUR: Record<Echelle, string> = {
  large: 'py-5 paysage:py-2',
  moyen: 'py-3.5 paysage:py-2',
  // Quatre joueurs en paysage : 408 px de page pour 390 avec `py-2` (mesuré), donc
  // un cran de moins ici — jamais sur les touches, au plancher de 48 px.
  compact: 'py-2.5 paysage:py-1',
}

/**
 * Les quatre colonnes de la feuille — joueur, volée, manches, reste — à
 * largeur FIXE pour les trois dernières : c'est en alignant les chiffres d'une
 * ligne à l'autre qu'on les compare, donc les colonnes doivent exister vraiment.
 *
 * ⚠️ **La largeur est la contrainte la plus serrée de l'écran, et une colonne
 * de plus ne rentre pas.** En portrait 390 px il ne reste que 360 px une fois
 * retirés le `p-3` de la disposition et le filet de 3 px de la feuille.
 * RESTE y prend 8,25 rem (132 px) : un reste de trois chiffres larges
 * (« 600 », « 688 ») à 4,5 rem doit avoir de l'air des deux côtés, sans toucher
 * les filets (ce que l'utilisateur ne trouvait « vraiment pas joli »). VOLÉE
 * (60 px) et MANCHES (44 px) ne bougent pas ; JOUEUR cède la différence.
 * Pour que trois cases de fléchettes à `text-sm` y tiennent encore, « BULL »
 * compris, l'écart entre cases est de `gap-1` (il n'est pas lu à 3 m).
 * En paysage la feuille est plus large : JOUEUR vit sur ~262 px (mesuré), il
 * n'a rien à céder. RESTE garde 6,75 rem (variante `paysage:`) parce que le
 * reste y garde la taille d'avant le lot.
 * Une cinquième colonne a été essayée puis retirée : elle ramenait JOUEUR à
 * 108 px en portrait et à **81 px en paysage**, où les pseudos se tronquaient
 * en « MAÏ… ». Ce qu'on gagne en colonnes se paie sur ces trois cases-là.
 * ⚠️ Littéral complet : Tailwind ne scanne que le texte écrit.
 */
export const GRILLE_LIGNE =
  'grid grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_8.25rem] paysage:grid-cols-[minmax(0,1fr)_3.75rem_2.75rem_6.75rem]'

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
        bust ? 'animate-secousse' : '',
      ].join(' ')}
    >
      {/* COLONNE 1 — qui joue, et ce qu'il vient d'écrire. */}
      <div className="flex min-w-0 flex-col justify-center gap-2 px-3 paysage:px-2">
        {/* La couleur du profil : un carré de repère (le même dans les trois jeux). */}
        <NomJoueurFeuille
          nom={nom}
          couleur={couleur}
          actif={actif}
          vainqueur={vainqueur}
          alerte={bust}
        />

        {/* Les trois fléchettes, écrites sur leur ligne comme au stylo. */}
        <CasesVolee
          aria-label={etiquetteVoleeLigne(enSaisie, nom)}
          darts={volee?.darts ?? []}
          bust={bust}
        />
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
              volee && volee.darts.length > 0 ? 'text-craie' : 'text-craie-3'
            }`}
          >
            {volee && volee.darts.length > 0 ? volee.total : '—'}
          </span>
        )}

        <span className="entete-colonne normal-case tracking-normal">
          moy <span className="chiffres font-semibold text-craie-2">{formatMoyenne(moyenne)}</span>
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
          depuis l'oche : il n'a plus à porter deux notes de bas de page.
          Seul celui du joueur qui LANCE est en craie vive (et souffle) ; les
          autres sont en craie : l'œil va au repère, pas à toute la colonne.
          Le vainqueur garde la craie vive : sa ligne perd son repère à la fin. */}
      <div className="filet-colonne flex flex-col items-center justify-center px-1">
        <output
          aria-label={`Score restant de ${nom}`}
          className={`chiffres block font-bold ${
            actif ? 'trace-craie text-craie-vive' : vainqueur ? 'text-craie-vive' : 'text-craie'
          } ${RESTE[echelle]}`}
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
