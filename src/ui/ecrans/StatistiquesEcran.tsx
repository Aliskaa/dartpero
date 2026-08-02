import { useQuery } from '@tanstack/react-query'
import type { PlayerCareer } from '@/core/application/ports/driving/GetPlayerStats'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { EmptyState, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { moyenne, nomJoueur, pluriel } from '@/ui/labels'
import { useServices } from '@/ui/providers/ServicesProvider'

type Colonne = {
  readonly libelle: string
  /** La valeur affichée. */
  readonly valeur: (joueur: PlayerCareer) => string | number
  /** Le nombre qui sert au classement, quand l'affichage n'est pas comparable. */
  readonly tri: (joueur: PlayerCareer) => number
}

/**
 * Un tableau comparatif, classé sur sa **première** colonne.
 *
 * C'est ce qui rend l'écran utile entre potes : on ne consulte pas ses stats,
 * on regarde qui est devant. Chaque thème a donc son propre podium plutôt qu'un
 * classement général unique.
 */
const TableauComparatif = ({
  titre,
  colonnes,
  joueurs,
}: {
  readonly titre: string
  readonly colonnes: readonly Colonne[]
  readonly joueurs: readonly PlayerCareer[]
}) => {
  const premiere = colonnes[0]
  const classes = premiere
    ? [...joueurs].sort((a, b) => premiere.tri(b) - premiere.tri(a))
    : joueurs

  return (
    <Panneau titre={titre} contenuClassName="overflow-x-auto p-0">
      {/* Chaque tableau porte son propre nom : à la voix comme au test, on ne
          distingue pas quatre tableaux anonymes. */}
      <table aria-label={titre} className="w-full min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-chene/40">
            <th className="px-3 py-2 text-left font-score text-[0.6rem] uppercase tracking-widest text-craie/55">
              Joueur
            </th>
            {colonnes.map((colonne) => (
              <th
                key={colonne.libelle}
                className="px-2 py-2 text-right font-score text-[0.6rem] uppercase tracking-widest text-craie/55"
              >
                {colonne.libelle}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classes.map((joueur, rang) => (
            <tr
              key={joueur.playerId}
              className="border-b border-chene/20 last:border-0 odd:bg-feutre/40"
            >
              <td className="px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`chiffres w-3 shrink-0 text-xs ${
                      rang === 0 ? 'font-bold text-laiton' : 'text-craie/40'
                    }`}
                  >
                    {rang + 1}
                  </span>
                  <Avatar nom={nomJoueur(joueur.name)} couleur={joueur.color} taille="xs" />
                  <span className="truncate text-craie">{nomJoueur(joueur.name)}</span>
                </span>
              </td>
              {colonnes.map((colonne) => (
                <td
                  key={colonne.libelle}
                  className={`chiffres px-2 py-2 text-right font-bold ${
                    rang === 0 ? 'text-laiton-clair' : 'text-craie-vive'
                  }`}
                >
                  {colonne.valeur(joueur)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Panneau>
  )
}

const TABLEAUX: readonly { readonly titre: string; readonly colonnes: readonly Colonne[] }[] = [
  {
    titre: 'Moyennes',
    colonnes: [
      { libelle: 'Moyenne', valeur: (j) => moyenne(j.average3), tri: (j) => j.average3 },
      { libelle: 'First 9', valeur: (j) => moyenne(j.first9Average), tri: (j) => j.first9Average },
      {
        libelle: 'Meilleure volée',
        valeur: (j) => j.highestVisit,
        tri: (j) => j.highestVisit,
      },
    ],
  },
  {
    titre: 'Palmarès',
    colonnes: [
      { libelle: 'Gagnées', valeur: (j) => j.matchesWon, tri: (j) => j.matchesWon },
      { libelle: 'Jouées', valeur: (j) => j.matchesPlayed, tri: (j) => j.matchesPlayed },
      { libelle: 'Legs', valeur: (j) => j.legsWon, tri: (j) => j.legsWon },
    ],
  },
  {
    titre: 'Grosses volées',
    colonnes: [
      { libelle: '180', valeur: (j) => j.count180, tri: (j) => j.count180 },
      { libelle: '140+', valeur: (j) => j.count140plus, tri: (j) => j.count140plus },
      { libelle: '100+', valeur: (j) => j.count100plus, tri: (j) => j.count100plus },
    ],
  },
  {
    titre: 'Finitions',
    colonnes: [
      {
        libelle: '% doubles',
        valeur: (j) => `${Math.round(j.checkoutPercent)} %`,
        tri: (j) => j.checkoutPercent,
      },
      {
        libelle: 'Plus haut',
        valeur: (j) => j.highestCheckout || '—',
        tri: (j) => j.highestCheckout,
      },
      {
        // Le meilleur leg est le seul classement où **petit** vaut mieux que grand.
        libelle: 'Meilleur leg',
        valeur: (j) => j.bestLegDarts ?? '—',
        tri: (j) => (j.bestLegDarts === null ? Number.NEGATIVE_INFINITY : -j.bestLegDarts),
      },
    ],
  },
]

export const StatistiquesEcran = () => {
  const services = useServices()

  const stats = useQuery({
    queryKey: ['statistiquesJoueurs'],
    queryFn: () => services.getPlayerStats.execute(),
  })

  const joueurs = stats.data ?? []
  const flechettes = joueurs.reduce((total, joueur) => total + joueur.dartsThrown, 0)

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      <EnTeteEcran
        titre="Statistiques"
        sousTitre={
          joueurs.length === 0
            ? 'Toutes parties confondues'
            : `${pluriel(flechettes, 'fléchette lancée', 'fléchettes lancées')}`
        }
      />

      <div className="flex flex-col gap-3 px-4">
        {stats.isPending ? (
          <SpinnerLigne label="Calcul des statistiques…" />
        ) : joueurs.length === 0 ? (
          <EmptyState
            titre="Aucune partie au compteur"
            description="Jouez une première partie : moyennes, 180 et checkouts se cumuleront ici, partie après partie."
          />
        ) : (
          TABLEAUX.map((tableau) => (
            <TableauComparatif
              key={tableau.titre}
              titre={tableau.titre}
              colonnes={tableau.colonnes}
              joueurs={joueurs}
            />
          ))
        )}
      </div>
    </main>
  )
}
