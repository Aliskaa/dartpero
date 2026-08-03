import { DomainError } from '../../DomainError'
import type { Segment } from '../../value-objects/Dart'

/**
 * Le **Cricket** : sept cibles à fermer en trois touches chacune — 20, 19, 18,
 * 17, 16, 15 et la bulle. Tout le sel du jeu tient dans l'écart entre fermer
 * une cible et la garder ouverte chez l'adversaire : une cible fermée par tout
 * le monde est morte, elle ne rapporte plus rien à personne.
 *
 * L'ordre décroissant n'a aucune conséquence sur les règles ; il correspond à
 * la façon dont les tableaux de pub sont écrits, donc à ce qu'un joueur cherche
 * des yeux.
 */
export const CRICKET_TARGETS: readonly Segment[] = [20, 19, 18, 17, 16, 15, 'BULL']

/**
 * Les deux façons de compter, tranchées avec l'utilisateur :
 *
 * - `STANDARD` — les points marqués s'ajoutent à **celui qui les marque**, et
 *   le plus grand score gagne. C'est le Cricket que tout le monde connaît.
 * - `CUT_THROAT` — les points s'ajoutent à **chaque adversaire** qui n'a pas
 *   fermé la cible, et le **plus petit** score gagne. Marquer devient un cadeau
 *   empoisonné : à trois ou quatre, ça oblige à choisir sa victime.
 */
export const CRICKET_VARIANTS = ['STANDARD', 'CUT_THROAT'] as const

export type CricketVariant = (typeof CRICKET_VARIANTS)[number]

/**
 * Comme au Tour du monde, la liste des cibles vit **dans la configuration**,
 * donc dans le journal : une partie jouée aujourd'hui restera rejouable à
 * l'identique même si l'on change un jour les cibles par défaut. La variante
 * suit le même chemin, pour la même raison — elle change le vainqueur.
 */
export type CricketConfig = {
  readonly targets: readonly Segment[]
  readonly variant: CricketVariant
}

export type CricketConfigInput = {
  readonly targets?: readonly Segment[]
  readonly variant?: CricketVariant
}

/** La valeur d'une cible en points. La bulle vaut 25 **par marque** : un
 * bullseye compte donc deux marques et 50 points, sans cas particulier. */
export const targetValue = (target: Segment): number => (target === 'BULL' ? 25 : Number(target))

export const CricketConfig = {
  create({
    targets = CRICKET_TARGETS,
    variant = 'STANDARD',
  }: CricketConfigInput = {}): CricketConfig {
    if (targets.length === 0) throw new DomainError('A Cricket match needs at least one target')
    if (new Set(targets).size !== targets.length) {
      throw new DomainError('A Cricket target cannot appear twice')
    }
    if (targets.includes('MISS')) throw new DomainError('MISS cannot be a Cricket target')
    if (!CRICKET_VARIANTS.includes(variant)) {
      throw new DomainError(`Unknown Cricket variant: ${variant}`)
    }
    return { targets: [...targets], variant }
  },
}

/** Trois touches ferment une cible. Le chiffre est ici plutôt qu'en dur dans
 * les règles : c'est une constante de jeu, pas un détail d'implémentation. */
export const MARKS_TO_CLOSE = 3
