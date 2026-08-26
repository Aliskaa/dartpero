import { ALL_SCORING_DARTS, Dart, type Multiplier, type Segment } from '../value-objects/Dart'

/**
 * OÙ LES FLÉCHETTES SE PLANTENT — le comptage des impacts, case par case.
 *
 * Ce module est **transverse**, au même titre que `visitOutcome` et `checkout` :
 * une fléchette dans le triple 20 est le même geste qu'on décompte un 501 ou
 * qu'on ferme une cible au Cricket. Il ne connaît donc aucun mode, seulement
 * des fléchettes — c'est ce qui lui permet de vivre ici sans qu'un mode ait à
 * en importer un autre.
 *
 * ⚠️ C'est la **seule** statistique du projet qui mesure le bras plutôt que le
 * jeu. Toutes les autres (moyenne, first 9, % de doubles) répondent « est-ce
 * qu'il gagne » ; celle-ci répond « où est-ce qu'il tape », donc « où est-ce
 * qu'il dérive ». D'où sa place à part.
 */

/**
 * Une case du plateau : un secteur ET l'anneau touché.
 *
 * Le découpage par anneau n'est pas un luxe : « 14 fois dans le 20 » ne dit pas
 * si c'étaient des triples ou des simples, et c'est précisément l'écart qu'on
 * cherche à voir.
 */
export type DartboardZone = {
  readonly segment: Segment
  readonly multiplier: Multiplier
  readonly hits: number
}

export type DartboardHits = {
  /** Toutes les fléchettes comptées, **les manquées comprises**. */
  readonly total: number
  /** Hors cible. Une fléchette manquée n'a pas de case, mais elle a été lancée. */
  readonly missed: number
  /**
   * Le plus grand nombre de touches sur une seule case.
   * C'est l'échelle de la carte de chaleur : sans elle, l'UI devrait
   * reparcourir les zones pour normaliser ses teintes.
   */
  readonly busiest: number
  /** Les 62 cases marquantes du plateau, dans l'ordre de `ALL_SCORING_DARTS`. */
  readonly zones: readonly DartboardZone[]
}

const cle = (segment: Segment, multiplier: Multiplier): string => `${segment}:${multiplier}`

/** L'index d'une case dans le tableau de comptage, calculé une fois pour toutes. */
const INDEX: ReadonlyMap<string, number> = new Map(
  ALL_SCORING_DARTS.map((dart, rang) => [cle(dart.segment, dart.multiplier), rang]),
)

const assembler = (compteurs: readonly number[], missed: number): DartboardHits => {
  const zones = ALL_SCORING_DARTS.map((dart, rang) => ({
    segment: dart.segment,
    multiplier: dart.multiplier,
    hits: compteurs[rang] ?? 0,
  }))

  return {
    total: compteurs.reduce((somme, valeur) => somme + valeur, 0) + missed,
    missed,
    busiest: zones.reduce((maximum, zone) => Math.max(maximum, zone.hits), 0),
    zones,
  }
}

export const DartboardHits = {
  empty: (): DartboardHits =>
    assembler(
      ALL_SCORING_DARTS.map(() => 0),
      0,
    ),

  /**
   * Compte une volée de fléchettes, ou dix mille : le comptage est en O(n) et
   * ne dépend pas de la manière dont elles ont été regroupées.
   */
  of: (darts: Iterable<Dart>): DartboardHits => {
    const compteurs = ALL_SCORING_DARTS.map(() => 0)
    let missed = 0

    for (const dart of darts) {
      const rang = INDEX.get(cle(dart.segment, dart.multiplier))
      // Une fléchette hors cible est la seule à n'avoir aucune case : elle est
      // comptée à part plutôt que silencieusement perdue.
      if (rang === undefined) missed += 1
      else compteurs[rang] = (compteurs[rang] ?? 0) + 1
    }

    return assembler(compteurs, missed)
  },

  merge: (a: DartboardHits, b: DartboardHits): DartboardHits =>
    assembler(
      a.zones.map((zone, rang) => zone.hits + (b.zones[rang]?.hits ?? 0)),
      a.missed + b.missed,
    ),

  /**
   * Les cases les plus touchées, de la plus chaude à la plus froide.
   *
   * Une carte de chaleur seule ne donne pas de nombre : on voit *où*, pas
   * *combien*. C'est ce classement qui répond à « combien de T20 ce soir ».
   * Les cases jamais touchées sont exclues — elles ne sont pas un résultat.
   *
   * ⚠️ À égalité, la case qui **vaut le plus** passe devant. Sans ce
   * départage l'ordre retombait sur celui du plateau, et trois cases à trois
   * touches s'annonçaient « S2, S3, S7 » — l'ordre de rangement, pas un
   * résultat. Un T20 et un S1 à égalité, c'est le T20 qu'on veut lire.
   */
  top: (hits: DartboardHits, limite: number): readonly DartboardZone[] =>
    hits.zones
      .filter((zone) => zone.hits > 0)
      .sort((a, b) => b.hits - a.hits || Dart.points(b) - Dart.points(a))
      .slice(0, limite),
}
