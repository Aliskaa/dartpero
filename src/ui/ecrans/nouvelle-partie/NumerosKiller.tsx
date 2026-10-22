import { useEffect, useState } from 'react'
import type { Player } from '@/core/domain/entities/Player'
import { KILLER_NUMBERS } from '@/core/domain/games/killer/config'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { couleurJoueur, initiales } from '@/ui/couleurs'
import type { NouvellePartie } from '@/ui/hooks/useNouvellePartie'
import {
  ARIA_TIRER_NUMEROS,
  ariaNumeroPris,
  ariaTuileNumero,
  etatNumeros,
  LIBELLE_NUMERO_ACTUEL,
  LIBELLE_TIRER_NUMEROS,
  NOTE_NUMEROS,
  TITRE_NUMEROS,
  titreGrilleNumero,
} from '@/ui/labels'

/** La grille 1-20 d'un joueur : les numéros libres se choisissent, les autres montrent leur propriétaire. */
const GrilleNumeros = ({
  joueur,
  retenus,
  partie,
  onChoisi,
}: {
  readonly joueur: Player
  readonly retenus: readonly Player[]
  readonly partie: NouvellePartie
  readonly onChoisi: () => void
}) => {
  const actuel = partie.numeros.numeroDe(joueur.id)
  const proprietaire = (numero: number): Player | undefined =>
    retenus.find((autre) => autre.id !== joueur.id && partie.numeros.numeroDe(autre.id) === numero)

  return (
    <div className="border-t border-craie/25 bg-ardoise-claire px-3 pb-3 pt-2.5">
      <span className="font-score text-etiquette uppercase tracking-[0.18em] text-craie-3">
        {titreGrilleNumero(joueur.name)}
      </span>
      <ul aria-label={titreGrilleNumero(joueur.name)} className="mt-2 grid grid-cols-5 gap-1.5">
        {KILLER_NUMBERS.map((numero) => {
          const autre = proprietaire(numero)
          if (autre) {
            const teinte = couleurJoueur(autre.color)
            return (
              <li key={numero}>
                <span
                  role="img"
                  aria-label={ariaNumeroPris(numero, autre.name)}
                  className="flex min-h-13 flex-col items-center justify-center gap-0.5 border border-dashed border-craie-3 font-score text-xl font-bold leading-none text-craie-3"
                >
                  {numero}
                  <small className="flex items-center gap-1 text-etiquette font-bold tracking-wide">
                    <i
                      aria-hidden="true"
                      className="size-2"
                      style={{ backgroundColor: teinte.fond }}
                    />
                    {initiales(autre.name)}
                  </small>
                </span>
              </li>
            )
          }
          const choisi = numero === actuel
          return (
            <li key={numero}>
              <button
                type="button"
                aria-pressed={choisi}
                onClick={() => {
                  partie.numeros.choisir(joueur.id, numero)
                  onChoisi()
                }}
                className={[
                  'flex min-h-13 w-full flex-col items-center justify-center gap-0.5 border font-score text-xl font-bold leading-none',
                  choisi
                    ? 'border-laiton bg-laiton text-sur-laiton'
                    : 'border-craie/45 bg-feutre-nuit text-craie-vive active:bg-craie/10',
                ].join(' ')}
              >
                {numero}
                {choisi && (
                  <small className="text-etiquette font-bold tracking-wide">
                    {LIBELLE_NUMERO_ACTUEL}
                  </small>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Le bloc « Numéros » de l'étape 2 du Killer. ⚠️ La grille ouverte est un état local, jamais une entrée d'historique. */
export const NumerosKiller = ({
  partie,
  retenus,
}: {
  readonly partie: NouvellePartie
  readonly retenus: readonly Player[]
}) => {
  const [ouvert, setOuvert] = useState<PlayerId | null>(null)

  // Complétion idempotente : chaque joueur retenu reçoit un numéro libre.
  const cle = retenus
    .map((joueur) => `${joueur.id}:${partie.numeros.numeroDe(joueur.id) ?? ''}`)
    .join('|')
  // biome-ignore lint/correctness/useExhaustiveDependencies: la clé résume la sélection et ses numéros.
  useEffect(() => {
    partie.numeros.completer()
  }, [cle])

  const attribues = retenus.filter((joueur) => partie.numeros.numeroDe(joueur.id) !== undefined)

  return (
    <section aria-label={TITRE_NUMEROS} className="border-t-[3px] border-craie bg-ardoise">
      <div className="flex items-center justify-between gap-2 border-b border-craie/25 px-3 py-2.5">
        <div className="min-w-0">
          <h2 className="font-score text-base font-bold uppercase tracking-[0.08em] text-craie-vive">
            {TITRE_NUMEROS}
          </h2>
          <output className="block text-xs text-craie-3">
            {etatNumeros(attribues.length, retenus.length)}
          </output>
        </div>
        <button
          type="button"
          aria-label={ARIA_TIRER_NUMEROS}
          onClick={() => {
            partie.numeros.tirer()
            setOuvert(null)
          }}
          className="inline-flex min-h-12 shrink-0 items-center justify-center border border-craie/45 px-4 font-score text-sm font-bold uppercase tracking-[0.12em] text-craie active:bg-craie/10"
        >
          {LIBELLE_TIRER_NUMEROS}
        </button>
      </div>
      <ul>
        {retenus.map((joueur) => {
          const numero = partie.numeros.numeroDe(joueur.id)
          const estOuvert = ouvert === joueur.id
          return (
            <li key={joueur.id} className="border-t border-craie/10 first:border-t-0">
              <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-1">
                <span className="flex min-w-0 items-center gap-2.5 font-score text-base font-bold uppercase text-craie-vive">
                  <Avatar nom={joueur.name} couleur={joueur.color} taille="sm" />
                  <span className="truncate">{joueur.name}</span>
                </span>
                <button
                  type="button"
                  aria-expanded={estOuvert}
                  aria-label={ariaTuileNumero(joueur.name, numero)}
                  onClick={() => setOuvert(estOuvert ? null : joueur.id)}
                  className={[
                    'flex h-12 w-18 items-center justify-center gap-1.5 border bg-feutre-nuit font-score text-2xl font-bold text-craie-vive',
                    estOuvert ? 'border-laiton ring-1 ring-inset ring-laiton' : 'border-craie/45',
                  ].join(' ')}
                >
                  {numero ?? '—'}
                  <em aria-hidden="true" className="text-xs not-italic text-laiton-clair">
                    ▾
                  </em>
                </button>
              </div>
              {estOuvert && (
                <GrilleNumeros
                  joueur={joueur}
                  retenus={retenus}
                  partie={partie}
                  onChoisi={() => setOuvert(null)}
                />
              )}
            </li>
          )
        })}
      </ul>
      <p className="border-t border-craie/10 px-3 py-2.5 text-xs text-craie-3">{NOTE_NUMEROS}</p>
    </section>
  )
}
