import type { PlayerColor } from '@/core/domain/value-objects/PlayerColor'
import type { PlayerGender } from '@/core/domain/value-objects/PlayerGender'
import { FeuilleMatch } from '@/ui/composants/commun/FeuilleMatch'
import { NomJoueurFeuille } from '@/ui/composants/commun/NomJoueurFeuille'
import {
  etiquetteNumeroDe,
  etiquetteViesDe,
  etiquetteVoleeDe,
  LIBELLE_BADGE_KILLER,
  LIBELLE_JOUEUR,
  LIBELLE_NUMERO_COURT,
  LIBELLE_STATUT,
  LIBELLE_VIES,
  LIBELLE_VISE,
  LIBELLE_VOLEE,
  libelleDoubleVise,
  lisibleVies,
  pastilleElimine,
  perteDeVies,
} from '@/ui/labels'

export type LigneKiller = {
  readonly playerId: string
  readonly nom: string
  readonly couleur: PlayerColor | null
  /** Le genre du profil : il n'accorde que la pastille « Éliminé / Éliminée ». */
  readonly genre: PlayerGender | undefined
  readonly numero: number
  readonly vies: number
  /** Les vies **réellement** perdues pendant la volée affichée : le « −N » rouge. */
  readonly perdues: number
  readonly killer: boolean
  readonly elimine: boolean
  readonly actif: boolean
  readonly vainqueur: boolean
}

/** Le ton d'un effet sous sa fléchette : neutre, laiton, craie, rouge. */
export type TonEffet = 'aucun' | 'killer' | 'perte' | 'elimine'

export type CaseVoleeKiller = {
  readonly flechette: string
  readonly effet: string
  readonly ton: TonEffet
}

/** La volée montrée sur la dernière ligne, avec le joueur à qui elle appartient. */
export type VoleeKiller = {
  readonly nom: string
  readonly cases: readonly CaseVoleeKiller[]
}

type Effectif = 2 | 3 | 4 | 5 | 6

/** Colonnes JOUEUR · N° · VIES · STATUT. ⚠️ Littéral complet : Tailwind ne scanne que le texte écrit. */
const GRILLE_KILLER =
  'grid grid-cols-[6.5rem_5.25rem_minmax(0,1fr)_5rem] paysage:grid-cols-[8rem_5.25rem_minmax(0,1fr)_5.75rem]'

/** Hauteur de CHAQUE ligne (planche) : portrait 108/84/70/56/50, paysage 90/70/58/50/43 px. */
const HAUTEUR: Record<Effectif, string> = {
  2: 'min-h-27 paysage:min-h-22.5',
  3: 'min-h-21 paysage:min-h-17.5',
  4: 'min-h-17.5 paysage:min-h-14.5',
  5: 'min-h-14 paysage:min-h-12.5',
  6: 'min-h-12.5 paysage:min-h-10.75',
}

/** Le numéro, ce qu'on lit de loin pour savoir qui viser. */
const TAILLE_NUMERO: Record<Effectif, string> = {
  2: 'text-score-solo paysage:text-score-xl',
  3: 'text-score-l-portrait paysage:text-score-l',
  4: 'text-score-m-portrait paysage:text-numero-m',
  5: 'text-numero-m paysage:text-4xl',
  6: 'text-numero-s paysage:text-numero-xs',
}

const effectif = (n: number): Effectif => (n <= 2 ? 2 : n >= 6 ? 6 : (n as Effectif))

const TON: Record<TonEffet, string> = {
  aucun: 'text-craie-3',
  killer: 'text-laiton-clair',
  perte: 'text-craie-2',
  elimine: 'text-rouge-touche',
}

/** Les vies en carrés : pleins (restantes), en tirets (perdues). Décoratif. */
const CarresVies = ({ vies, total }: { readonly vies: number; readonly total: number }) => (
  <span aria-hidden="true" className="flex gap-1">
    {Array.from({ length: total }, (_, rang) => (
      <i
        // biome-ignore lint/suspicious/noArrayIndexKey: une rangée de carrés identiques, sans identité
        key={rang}
        className={[
          'block size-[0.9375rem] border-2',
          rang < vies ? 'border-craie-vive bg-craie-vive' : 'border-dashed border-craie-3',
        ].join(' ')}
      />
    ))}
  </span>
)

const Statut = ({ joueur }: { readonly joueur: LigneKiller }) => {
  if (joueur.elimine) {
    return (
      <span className="font-score text-etiquette font-bold uppercase tracking-[0.08em] text-craie-3">
        {pastilleElimine(joueur.genre)}
      </span>
    )
  }
  if (joueur.killer) {
    return (
      <span className="bg-laiton px-[0.4375rem] py-1.5 font-score text-etiquette font-bold uppercase leading-none tracking-widest text-sur-laiton">
        {LIBELLE_BADGE_KILLER}
      </span>
    )
  }
  return (
    <span className="flex min-w-14 flex-col items-center gap-[3px] border border-dashed border-craie-3 px-[0.4375rem] py-[3px] leading-none">
      <small className="font-score text-etiquette uppercase tracking-[0.12em] text-craie-3">
        {LIBELLE_VISE}
      </small>
      <b className="font-score text-lg text-craie-2">{libelleDoubleVise(joueur.numero)}</b>
    </span>
  )
}

type Props = {
  readonly joueurs: readonly LigneKiller[]
  readonly viesDeDepart: number
  readonly volee: VoleeKiller
}

/** Zone lecture du Killer : une ligne par joueur, volée en cours sur la dernière ligne avec l'effet de chaque fléchette. */
export const FeuilleKiller = ({ joueurs, viesDeDepart, volee }: Props) => {
  const n = effectif(joueurs.length)
  const indexActif = joueurs.findIndex((joueur) => joueur.actif)

  return (
    <FeuilleMatch
      grille={GRILLE_KILLER}
      nbLignes={joueurs.length}
      indexActif={indexActif === -1 ? null : indexActif}
      entetes={
        <>
          <span className="entete-colonne px-3 text-feutre">{LIBELLE_JOUEUR}</span>
          <span className="entete-colonne text-center text-feutre">{LIBELLE_NUMERO_COURT}</span>
          <span className="entete-colonne text-center text-feutre">{LIBELLE_VIES}</span>
          <span className="entete-colonne text-center text-feutre">{LIBELLE_STATUT}</span>
        </>
      }
      pied={
        <div className="grid min-h-14 grid-cols-[4.625rem_minmax(0,1fr)] items-stretch border-t-3 border-craie paysage:min-h-11.5">
          <p className="flex min-w-0 flex-col justify-center pl-2.5 font-score text-etiquette uppercase leading-tight tracking-widest text-craie-3">
            {LIBELLE_VOLEE}
            <b className="truncate text-nom-serre tracking-[0.04em] text-craie-vive">{volee.nom}</b>
          </p>
          <output
            aria-label={etiquetteVoleeDe(volee.nom)}
            className="grid grid-cols-3 gap-1.5 py-1 pr-2"
          >
            {[0, 1, 2].map((rang) => {
              const une = volee.cases[rang]
              if (!une) {
                return (
                  <span
                    key={rang}
                    className="flex items-center justify-center border-b-2 border-dashed border-craie-3 font-score font-bold text-craie-3"
                  >
                    <span aria-hidden="true">·</span>
                  </span>
                )
              }
              return (
                <span
                  key={rang}
                  className="flex min-w-0 flex-col items-center justify-end gap-0.5 border-b-2 border-craie pb-[3px]"
                >
                  <b className="chiffres text-xl leading-none text-craie-vive">{une.flechette}</b>{' '}
                  <small
                    className={`max-w-full truncate text-center text-etiquette font-semibold leading-tight ${TON[une.ton]}`}
                  >
                    {une.effet}
                  </small>
                </span>
              )
            })}
          </output>
        </div>
      }
    >
      {joueurs.map((joueur) => (
        <article
          key={joueur.playerId}
          aria-current={joueur.actif ? 'true' : undefined}
          className={[
            'ligne-tableau relative items-center',
            GRILLE_KILLER,
            HAUTEUR[n],
            joueur.elimine ? 'bg-feutre' : '',
          ].join(' ')}
        >
          <div className="flex min-w-0 items-center pl-2.5 pr-1.5">
            <NomJoueurFeuille
              nom={joueur.nom}
              couleur={joueur.couleur}
              actif={joueur.actif}
              vainqueur={joueur.vainqueur}
              elimine={joueur.elimine}
              serre={joueurs.length >= 3}
            />
          </div>

          <output
            aria-label={etiquetteNumeroDe(joueur.nom)}
            className={[
              'chiffres block text-center font-bold leading-none',
              TAILLE_NUMERO[n],
              joueur.elimine
                ? 'text-craie-3 line-through decoration-3'
                : joueur.actif
                  ? 'trace-craie text-craie-vive'
                  : 'text-craie',
            ].join(' ')}
          >
            {joueur.numero}
          </output>

          <div className="flex min-w-0 flex-col items-center gap-[3px]">
            <output aria-label={etiquetteViesDe(joueur.nom)} className="block">
              <span key={joueur.vies} className="block animate-pop-score">
                <CarresVies vies={joueur.vies} total={viesDeDepart} />
              </span>
              <span className="sr-only">{lisibleVies(joueur.vies, joueur.perdues)}</span>
            </output>
            <span
              aria-hidden="true"
              className={`font-score text-etiquette font-bold leading-none tracking-[0.04em] text-rouge-touche ${
                joueur.perdues > 0 ? '' : 'invisible'
              }`}
            >
              {perteDeVies(joueur.perdues)}
            </span>
          </div>

          <div className="flex min-w-0 justify-center">
            <Statut joueur={joueur} />
          </div>
        </article>
      ))}
    </FeuilleMatch>
  )
}
