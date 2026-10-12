import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  type PlayerCareer,
  STATS_PERIODS,
  type StatsPeriod,
} from '@/core/application/ports/driving/GetPlayerStats'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { ChoixSegmente } from '@/ui/composants/commun/ChoixSegmente'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { EmptyState, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { Panneau } from '@/ui/composants/commun/Panneau'
import { PanneauImpacts } from '@/ui/composants/commun/PanneauImpacts'
import {
  LIBELLE_MANCHES,
  LIBELLE_MANCHES_GAGNEES,
  LIBELLE_MANCHES_JOUEES,
  LIBELLE_MEILLEURE_MANCHE,
  LIBELLE_PERIODE,
  moyenne,
  nomJoueur,
  PERIODE_EN_TOUTES_LETTRES,
  pluriel,
  pourcent,
} from '@/ui/labels'
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
      {
        libelle: '%',
        valeur: (j) => pourcent(j.matchWinPercent, j.matchesPlayed),
        tri: (j) => j.matchWinPercent,
      },
    ],
  },
  {
    // ⚠️ Les manches ont leur propre tableau depuis qu'elles ont un
    // dénominateur : « 12 gagnées » ne veut rien dire sans savoir sur combien.
    // Les entasser dans « Palmarès » aurait fait cinq colonnes chiffrées sur
    // 358 px, donc un tableau qui défile — or on ne le lit que pour comparer.
    titre: LIBELLE_MANCHES,
    colonnes: [
      { libelle: LIBELLE_MANCHES_GAGNEES, valeur: (j) => j.legsWon, tri: (j) => j.legsWon },
      { libelle: LIBELLE_MANCHES_JOUEES, valeur: (j) => j.legsPlayed, tri: (j) => j.legsPlayed },
      {
        libelle: '%',
        valeur: (j) => pourcent(j.legWinPercent, j.legsPlayed),
        tri: (j) => j.legWinPercent,
      },
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
        valeur: (j) => pourcent(j.checkoutPercent, j.doubleAttempts),
        tri: (j) => j.checkoutPercent,
      },
      {
        libelle: 'Plus haut',
        valeur: (j) => j.highestCheckout || '—',
        tri: (j) => j.highestCheckout,
      },
      {
        // La meilleure manche est le seul classement où **petit** vaut mieux que grand.
        libelle: LIBELLE_MEILLEURE_MANCHE,
        valeur: (j) => j.bestLegDarts ?? '—',
        tri: (j) => (j.bestLegDarts === null ? Number.NEGATIVE_INFINITY : -j.bestLegDarts),
      },
    ],
  },
]

export const StatistiquesEcran = () => {
  const services = useServices()

  /**
   * ⚠️ « Tout » par défaut, jamais « Aujourd'hui » : un jour sans partie
   * ouvrirait l'écran sur du vide, et l'app aurait l'air d'avoir tout perdu.
   * Le filtre est là, à portée de pouce, pour celui qui veut la soirée.
   */
  const [periode, setPeriode] = useState<StatsPeriod>('ALL_TIME')

  const stats = useQuery({
    // La période fait partie de la clé : chaque fenêtre garde son cache, donc
    // revenir sur « Tout » est instantané.
    queryKey: ['statistiquesJoueurs', periode],
    queryFn: () => services.getPlayerStats.execute(periode),
  })

  const joueurs = stats.data ?? []
  const flechettes = joueurs.reduce((total, joueur) => total + joueur.dartsThrown, 0)

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      <EnTeteEcran
        titre="Statistiques"
        sousTitre={
          joueurs.length === 0
            ? PERIODE_EN_TOUTES_LETTRES[periode]
            : `${pluriel(flechettes, 'fléchette lancée', 'fléchettes lancées')} · ${PERIODE_EN_TOUTES_LETTRES[periode]}`
        }
      />

      <div className="flex flex-col gap-3 px-4">
        <ChoixSegmente
          legende="Période"
          taille="sm"
          valeurs={STATS_PERIODS}
          valeur={periode}
          onChange={setPeriode}
          libelle={(option) => LIBELLE_PERIODE[option]}
        />

        {stats.isPending ? (
          <SpinnerLigne label="Calcul des statistiques…" />
        ) : joueurs.length === 0 ? (
          // ⚠️ Deux vides très différents : « je n'ai jamais joué » appelle une
          // invitation, « rien ce soir » appelle un élargissement de la fenêtre.
          // Les confondre ferait croire à une base effacée.
          periode === 'ALL_TIME' ? (
            <EmptyState
              titre="Aucune partie au compteur"
              description="Jouez une première partie : moyennes, 180 et checkouts se cumuleront ici, partie après partie."
            />
          ) : (
            <EmptyState
              titre="Rien sur cette période"
              description={`Aucune partie de X01 ${PERIODE_EN_TOUTES_LETTRES[periode]}. Élargissez la fenêtre pour retrouver les précédentes.`}
            />
          )
        ) : (
          <>
            {TABLEAUX.map((tableau) => (
              <TableauComparatif
                key={tableau.titre}
                titre={tableau.titre}
                colonnes={tableau.colonnes}
                joueurs={joueurs}
              />
            ))}
            <PanneauImpacts
              joueurs={joueurs.map((joueur) => ({
                id: joueur.playerId,
                nom: nomJoueur(joueur.name),
                hits: joueur.hits,
              }))}
              aide="Plus une case est dorée, plus elle a été touchée — l'échelle est propre à chaque joueur. Une dérive se voit là bien avant de se sentir au bras."
            />
          </>
        )}
      </div>
    </main>
  )
}
