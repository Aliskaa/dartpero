import { useQuery } from '@tanstack/react-query'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  type PlayerCareer,
  STATS_PERIODS,
  type StatsPeriod,
} from '@/core/application/ports/driving/GetPlayerStats'
import { DartboardHits } from '@/core/domain/services/dartboardHits'
import type { PlayerId } from '@/core/domain/value-objects/ids'
import { Avatar } from '@/ui/composants/commun/Avatar'
import { PlateauImpacts } from '@/ui/composants/commun/CarteImpacts'
import {
  BarresPodium,
  BasculesPodium,
  BoutonToutVoir,
  CartePodium,
  ClassementPodium,
  type Espacement,
  type LigneClassement,
} from '@/ui/composants/commun/CartePodium'
import { ChoixSegmente } from '@/ui/composants/commun/ChoixSegmente'
import { CompteBatons, type TeinteBatons } from '@/ui/composants/commun/CompteBatons'
import { EnTeteEcran } from '@/ui/composants/commun/EnTeteEcran'
import { EmptyState, SpinnerLigne } from '@/ui/composants/commun/Etats'
import { Modale } from '@/ui/composants/commun/Modale'
import type { NomPictogramme } from '@/ui/composants/commun/Pictogramme'
import { usePreference } from '@/ui/hooks/useAppareil'
import { useModaleAuRetour } from '@/ui/hooks/useModaleAuRetour'
import {
  BASCULE_FINITIONS,
  BASCULE_GROSSES_VOLEES,
  BASCULE_MOYENNE,
  CHARGEMENT_STATISTIQUES,
  COMPLEMENT_MANCHE,
  complementVictoires,
  DESCRIPTION_STATS_VIDES,
  descriptionPeriodeVide,
  flechettesLancees,
  foisTouchee,
  LEGENDE_BASCULE_FINITIONS,
  LEGENDE_BASCULE_GROSSES_VOLEES,
  LEGENDE_BASCULE_MOYENNE,
  LEGENDE_JOUEUR_CIBLE,
  LEGENDE_PERIODE,
  LIBELLE_HORS,
  LIBELLE_HORS_CIBLE,
  LIBELLE_PERIODE,
  libelleZone,
  MESURES_FINITIONS,
  MESURES_MOYENNE,
  type MesureFinitions,
  type MesureMoyenne,
  NOM_CARTE_MOYENNE,
  nombre,
  nomJoueur,
  PERIODE_EN_TOUTES_LETTRES,
  SEUILS_GROSSES_VOLEES,
  type SeuilGrossesVolees,
  TITRE_CARTE_FINITIONS,
  TITRE_CARTE_GROSSES_VOLEES,
  TITRE_CARTE_MOYENNE,
  TITRE_CARTE_VICTOIRES,
  TITRE_PERIODE_VIDE,
  TITRE_STATISTIQUES,
  TITRE_STATS_VIDES,
} from '@/ui/labels'
import {
  APERCU_PODIUM,
  apercuPodium,
  CARTES_PODIUM,
  type CartePodiumId,
  type ChoixCible,
  classerPodium,
  defilementPourMontrer,
  joueurDeLaCible,
  type LignePodium,
  MESURE_FINITIONS,
  MESURE_GROSSES_VOLEES,
  MESURE_MOYENNE,
  MESURE_VICTOIRES,
} from '@/ui/podium'
import { useServices } from '@/ui/providers/ServicesProvider'

/**
 * ⚠️ Le dernier joueur consulté, mémorisé sur l'appareil (stocké
 * `dartpero:statistiques:joueur`). **Citée par la politique de
 * confidentialité** (`SECTIONS_CONFIDENTIALITE`) : elle ne se renomme pas, et
 * toute nouvelle clé se livre avec le texte de la politique et sa date.
 */
const CLE_JOUEUR_CONSULTE = 'statistiques:joueur'

/**
 * La marque de la modale « Tout voir » dans `location.state` : une entrée
 * d'historique sur la même URL, que le retour du téléphone dépile.
 */
const CLE_LISTE = 'liste'

/** Une ligne de podium, prête pour les barres (qui ne connaissent pas `PlayerCareer`). */
const enLigne = (ligne: LignePodium, complement?: string): LigneClassement => ({
  id: ligne.joueur.playerId,
  nom: nomJoueur(ligne.joueur.name),
  couleur: ligne.joueur.color,
  texte: ligne.texte,
  largeur: ligne.largeur,
  enTete: ligne.enTete,
  absente: ligne.valeur === null,
  ...(complement === undefined ? {} : { complement }),
})

/** Les bascules courantes des cartes : elles vivent dans l'écran, au-dessus du chargement. */
type Mesures = {
  readonly moyenne: MesureMoyenne
  readonly grossesVolees: SeuilGrossesVolees
  readonly finitions: MesureFinitions
}

type Reglages = Mesures & {
  readonly onMoyenne: (mesure: MesureMoyenne) => void
  readonly onGrossesVolees: (seuil: SeuilGrossesVolees) => void
  readonly onFinitions: (mesure: MesureFinitions) => void
}

/** Le classement complet d'une carte : la carte en montre un aperçu, le modal tout. */
const classementDe = (
  carte: CartePodiumId,
  joueurs: readonly PlayerCareer[],
  mesures: Mesures,
): readonly LignePodium[] => {
  switch (carte) {
    case 'MOYENNE':
      return classerPodium(joueurs, MESURE_MOYENNE[mesures.moyenne])
    case 'VICTOIRES':
      return classerPodium(joueurs, MESURE_VICTOIRES)
    case 'GROSSES_VOLEES':
      return classerPodium(joueurs, MESURE_GROSSES_VOLEES[mesures.grossesVolees])
    case 'FINITIONS':
      return classerPodium(joueurs, MESURE_FINITIONS[mesures.finitions])
    default: {
      const jamais: never = carte
      return jamais
    }
  }
}

/** Les barres d'une carte : Victoires porte « / j » sur chaque ligne (R1-Q7). */
const lignesDe = (carte: CartePodiumId, classement: readonly LignePodium[]) =>
  classement.map((ligne) =>
    enLigne(
      ligne,
      carte === 'VICTOIRES' ? complementVictoires(ligne.joueur.matchesPlayed) : undefined,
    ),
  )

/** La tête d'une carte — reprise telle quelle par son modal : titre, pictogramme, bascules. */
const teteDe = (
  carte: CartePodiumId,
  reglages: Reglages,
): {
  readonly titre: string
  /** Le nom accessible, quand le titre visible est abrégé (QO-1). */
  readonly nom?: string
  readonly pictogramme: NomPictogramme
  readonly bascules?: ReactNode
} => {
  switch (carte) {
    case 'MOYENNE':
      return {
        titre: TITRE_CARTE_MOYENNE[reglages.moyenne],
        nom: NOM_CARTE_MOYENNE[reglages.moyenne],
        pictogramme: 'moyenne',
        bascules: (
          <BasculesPodium
            legende={LEGENDE_BASCULE_MOYENNE}
            valeurs={MESURES_MOYENNE}
            valeur={reglages.moyenne}
            onChange={reglages.onMoyenne}
            libelle={(mesure) => BASCULE_MOYENNE[mesure]}
          />
        ),
      }
    case 'VICTOIRES':
      return { titre: TITRE_CARTE_VICTOIRES, pictogramme: 'victoire' }
    case 'GROSSES_VOLEES':
      return {
        titre: TITRE_CARTE_GROSSES_VOLEES,
        pictogramme: 'grosses-volees',
        bascules: (
          <BasculesPodium
            legende={LEGENDE_BASCULE_GROSSES_VOLEES}
            valeurs={SEUILS_GROSSES_VOLEES}
            valeur={reglages.grossesVolees}
            onChange={reglages.onGrossesVolees}
            libelle={(seuil) => BASCULE_GROSSES_VOLEES[seuil]}
          />
        ),
      }
    case 'FINITIONS':
      return {
        titre: TITRE_CARTE_FINITIONS,
        pictogramme: 'sortie',
        bascules: (
          <BasculesPodium
            legende={LEGENDE_BASCULE_FINITIONS}
            valeurs={MESURES_FINITIONS}
            valeur={reglages.finitions}
            onChange={reglages.onFinitions}
            libelle={(mesure) => BASCULE_FINITIONS[mesure]}
          />
        ),
      }
    default: {
      const jamais: never = carte
      return jamais
    }
  }
}

/**
 * Le sélecteur de joueurs : des onglets avatar + nom, l'actif souligné de
 * laiton. Il ne pilote **que la cible** — les cartes restent identiques.
 *
 * Largeurs égales quand ça tient (`flex-1`), défilement horizontal du seul
 * ruban au-delà (`min-w-max`). ⚠️ Le filet du bas est un élément à part, sous
 * le ruban : un `-mb-px` serait rogné par `overflow-x-auto`.
 *
 * L'onglet actif est **ramené dans la vue** du ruban (constats 3 et 11 de la
 * revue), à trois moments : à l'ouverture (joueur mémorisé en fin de ruban) ;
 * à l'appui sur un onglet ; au changement de période — que le joueur affiché
 * change, ou qu'il reste le même dans une liste réordonnée (d'où `joueurs`
 * dans les dépendances). On règle le seul `scrollLeft` du ruban —
 * jamais `scrollIntoView`, qui pourrait faire défiler la page — et sans
 * animation, donc rien à faire pour `prefers-reduced-motion`.
 */
const OngletsJoueurs = ({
  joueurs,
  actif,
  onChoisir,
}: {
  readonly joueurs: readonly PlayerCareer[]
  readonly actif: PlayerId
  readonly onChoisir: (id: PlayerId) => void
}) => {
  const ruban = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: on recadre quand l'actif change ou quand la liste (la période) change ; le corps relit le DOM
  useEffect(() => {
    const conteneur = ruban.current
    const onglet = conteneur?.querySelector<HTMLElement>('button[aria-pressed="true"]')
    if (!conteneur || !onglet) return
    const cible = defilementPourMontrer({
      debut: onglet.offsetLeft,
      fin: onglet.offsetLeft + onglet.offsetWidth,
      defilement: conteneur.scrollLeft,
      largeur: conteneur.clientWidth,
    })
    if (cible !== null) conteneur.scrollLeft = cible
  }, [actif, joueurs])

  return (
    // `min-w-0` : un `fieldset` vaut `min-width: min-content` par défaut, et
    // pousserait la page au lieu de laisser défiler le seul ruban.
    <fieldset aria-label={LEGENDE_JOUEUR_CIBLE} className="relative min-w-0">
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-craie/25" />
      {/* `relative` : l'`offsetLeft` des onglets se mesure depuis le ruban. */}
      <div ref={ruban} className="relative flex overflow-x-auto">
        {joueurs.map((joueur) => {
          const nom = nomJoueur(joueur.name)
          const choisi = joueur.playerId === actif
          return (
            <button
              key={joueur.playerId}
              type="button"
              aria-pressed={choisi}
              onClick={() => onChoisir(joueur.playerId)}
              className={`flex min-h-12 min-w-max flex-1 flex-col items-center gap-1 border-b-3 px-3 pt-2.5 pb-2 font-score text-etiquette uppercase tracking-[0.08em] ${
                choisi ? 'border-laiton text-craie-vive' : 'border-transparent text-craie-3'
              }`}
            >
              <Avatar nom={nom} couleur={joueur.color} taille="ms" />
              {nom}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** La cible d'un joueur en grand, puis ses trois cases favorites et ses fléchettes hors cible. */
const BlocCible = ({ joueur }: { readonly joueur: PlayerCareer }) => {
  const nom = nomJoueur(joueur.name)
  const sommet = DartboardHits.top(joueur.hits, 3)

  return (
    <figure className="mx-auto flex w-full max-w-sm flex-col gap-2">
      <PlateauImpacts nom={nom} hits={joueur.hits} />
      <figcaption>
        <ul
          className="grid border-y border-craie/20"
          style={{ gridTemplateColumns: `repeat(${sommet.length + 1}, minmax(0, 1fr))` }}
        >
          {sommet.map((zone, rang) => (
            <li
              key={libelleZone(zone)}
              className={`flex flex-col items-center px-1 py-2 text-center ${
                rang > 0 ? 'border-l border-craie/18' : ''
              }`}
            >
              <span className="chiffres text-xl leading-tight font-bold text-laiton-clair">
                {libelleZone(zone)}
              </span>
              <span className="text-etiquette text-craie-3">{foisTouchee(zone.hits)}</span>
            </li>
          ))}
          <li
            className={`flex flex-col items-center px-1 py-2 text-center ${
              sommet.length > 0 ? 'border-l border-craie/18' : ''
            }`}
          >
            <span className="chiffres text-xl leading-tight font-bold text-craie">
              {joueur.hits.missed === 0 ? LIBELLE_HORS : nombre(joueur.hits.missed)}
            </span>
            <span className="text-etiquette text-craie-3">{LIBELLE_HORS_CIBLE}</span>
          </li>
        </ul>
      </figcaption>
    </figure>
  )
}

const TEINTES_SEUILS: Record<SeuilGrossesVolees, TeinteBatons> = {
  '180': 'text-laiton',
  '140+': 'text-craie',
  '100+': 'text-craie-2',
}

const compteDuSeuil = (joueur: PlayerCareer, seuil: SeuilGrossesVolees): number =>
  seuil === '180' ? joueur.count180 : seuil === '140+' ? joueur.count140plus : joueur.count100plus

/**
 * Grosses volées : une rangée de bâtons par seuil et par joueur, les joueurs
 * dans l'ordre reçu — classés sur le seuil de la bascule (Révision 1).
 */
const GrossesVolees = ({
  joueurs,
  espacement = 'carte',
}: {
  readonly joueurs: readonly PlayerCareer[]
  /** `liste` : le modal, plus aéré — 18 px au lieu de 10, dans la proportion des barres (14 / 8). */
  readonly espacement?: Espacement
}) => (
  <ul className={`flex flex-col ${espacement === 'liste' ? 'gap-4.5' : 'mt-3 gap-2.5'}`}>
    {joueurs.map((joueur) => {
      const nom = nomJoueur(joueur.name)
      return (
        <li key={joueur.playerId} className="grid grid-cols-[24px_1fr] items-start gap-2">
          <Avatar nom={nom} couleur={joueur.color} taille="xs" />
          <div>
            {/* La planche n'a que l'avatar : le nom reste dit au lecteur d'écran. */}
            <span className="sr-only">{nom}</span>
            <dl className="flex flex-col gap-0.75">
              {SEUILS_GROSSES_VOLEES.map((seuil) => (
                <div key={seuil} className="flex items-center gap-1.5">
                  <dt className="w-7.5 shrink-0 font-score text-etiquette font-medium text-craie-3">
                    {seuil}
                  </dt>
                  <dd>
                    <CompteBatons
                      nombre={compteDuSeuil(joueur, seuil)}
                      teinte={TEINTES_SEUILS[seuil]}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </li>
      )
    })}
  </ul>
)

/**
 * Une carte du podium : sa tête, puis l'aperçu de son classement (N premiers,
 * `apercuPodium`) et « Tout voir » s'il en reste.
 */
const CarteDuPodium = ({
  carte,
  joueurs,
  reglages,
  onToutVoir,
}: {
  readonly carte: CartePodiumId
  readonly joueurs: readonly PlayerCareer[]
  readonly reglages: Reglages
  readonly onToutVoir: (carte: CartePodiumId) => void
}) => {
  const { titre, nom, pictogramme, bascules } = teteDe(carte, reglages)
  const classement = classementDe(carte, joueurs, reglages)
  const { visibles, toutVoir } = apercuPodium(
    classement,
    APERCU_PODIUM[carte],
    (ligne) => ligne.valeur,
  )
  // Le nom du bouton suit celui de la carte : « Tout voir, Moyenne 3 fl., Moyenne 3 fléchettes ».
  const bouton = toutVoir ? { titre: nom ?? titre, onClick: () => onToutVoir(carte) } : undefined

  return (
    <CartePodium
      titre={titre}
      {...(nom ? { nom } : {})}
      pictogramme={pictogramme}
      action={bascules}
    >
      {carte === 'GROSSES_VOLEES' ? (
        <>
          <GrossesVolees joueurs={visibles.map((ligne) => ligne.joueur)} />
          {bouton && <BoutonToutVoir titre={bouton.titre} onClick={bouton.onClick} />}
        </>
      ) : (
        <ClassementPodium
          lignes={lignesDe(carte, classement)}
          visibles={lignesDe(carte, visibles)}
          complement={
            carte === 'FINITIONS' && reglages.finitions === 'MANCHE' ? COMPLEMENT_MANCHE : undefined
          }
          toutVoir={bouton}
        />
      )}
    </CartePodium>
  )
}

/** Le contenu du modal : tous les joueurs, au même dessin que la carte, sans grande ligne (R1-Q4). */
const ListeComplete = ({
  carte,
  joueurs,
  reglages,
}: {
  readonly carte: CartePodiumId
  readonly joueurs: readonly PlayerCareer[]
  readonly reglages: Reglages
}) => {
  const classement = classementDe(carte, joueurs, reglages)
  return carte === 'GROSSES_VOLEES' ? (
    <GrossesVolees joueurs={classement.map((ligne) => ligne.joueur)} espacement="liste" />
  ) : (
    <BarresPodium lignes={lignesDe(carte, classement)} espacement="liste" />
  )
}

export const StatistiquesEcran = () => {
  const services = useServices()

  /**
   * ⚠️ « Tout » par défaut, jamais « Aujourd'hui » : un jour sans partie
   * ouvrirait l'écran sur du vide, et l'app aurait l'air d'avoir tout perdu.
   * Le filtre est là, à portée de pouce, pour celui qui veut la soirée.
   */
  const [periode, setPeriode] = useState<StatsPeriod>('ALL_TIME')

  // Appelé **une** fois : deux `usePreference` sur la même clé divergeraient.
  // Écrit à l'appui sur un onglet seulement, jamais sur un repli (U7).
  const [memorise, setMemorise] = usePreference<PlayerId | null>(CLE_JOUEUR_CONSULTE, null)
  const [choix, setChoix] = useState<ChoixCible | null>(null)

  // Les bascules vivent ici, au-dessus du chargement : `SpinnerLigne` démonte
  // les cartes à chaque changement de période. Pas mémorisées : retour au
  // premier choix à chaque ouverture. Partagées par la carte et son modal.
  const [mesureMoyenne, setMesureMoyenne] = useState<MesureMoyenne>('MOYENNE')
  const [mesureGrossesVolees, setMesureGrossesVolees] = useState<SeuilGrossesVolees>('180')
  const [mesureFinitions, setMesureFinitions] = useState<MesureFinitions>('DOUBLES')

  // ⚠️ Au-dessus du chargement, et la modale hors des branches : démontée
  // pendant un chargement, elle laisserait son entrée d'historique orpheline.
  const liste = useModaleAuRetour(CLE_LISTE, CARTES_PODIUM)

  const stats = useQuery({
    // La période fait partie de la clé : chaque fenêtre garde son cache, donc
    // revenir sur « Tout » est instantané.
    queryKey: ['statistiquesJoueurs', periode],
    queryFn: () => services.getPlayerStats.execute(periode),
  })

  const joueurs = stats.data ?? []
  const flechettes = joueurs.reduce((total, joueur) => total + joueur.dartsThrown, 0)
  const cible = joueurDeLaCible(joueurs, periode, memorise, choix)

  const reglages: Reglages = {
    moyenne: mesureMoyenne,
    grossesVolees: mesureGrossesVolees,
    finitions: mesureFinitions,
    onMoyenne: setMesureMoyenne,
    onGrossesVolees: setMesureGrossesVolees,
    onFinitions: setMesureFinitions,
  }
  const teteListe = liste.ouverte === null ? null : teteDe(liste.ouverte, reglages)

  const choisir = (id: PlayerId) => {
    setChoix({ periode, id })
    setMemorise(id)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      <EnTeteEcran
        titre={TITRE_STATISTIQUES}
        sousTitre={
          joueurs.length === 0
            ? PERIODE_EN_TOUTES_LETTRES[periode]
            : `${flechettesLancees(flechettes)} · ${PERIODE_EN_TOUTES_LETTRES[periode]}`
        }
      />

      <div className="flex flex-col gap-3.5 px-4">
        <ChoixSegmente
          legende={LEGENDE_PERIODE}
          taille="sm"
          valeurs={STATS_PERIODS}
          valeur={periode}
          onChange={setPeriode}
          libelle={(option) => LIBELLE_PERIODE[option]}
        />

        {stats.isPending ? (
          <SpinnerLigne label={CHARGEMENT_STATISTIQUES} />
        ) : joueurs.length === 0 || !cible ? (
          // ⚠️ Deux vides très différents : « je n'ai jamais joué » appelle une
          // invitation, « rien ce soir » appelle un élargissement de la fenêtre.
          // Les confondre ferait croire à une base effacée.
          periode === 'ALL_TIME' ? (
            <EmptyState titre={TITRE_STATS_VIDES} description={DESCRIPTION_STATS_VIDES} />
          ) : (
            <EmptyState
              titre={TITRE_PERIODE_VIDE}
              description={descriptionPeriodeVide(PERIODE_EN_TOUTES_LETTRES[periode])}
            />
          )
        ) : (
          <>
            {/* Un seul joueur : rien à choisir, pas de sélecteur (U8f). */}
            {joueurs.length > 1 && (
              <OngletsJoueurs joueurs={joueurs} actif={cible.playerId} onChoisir={choisir} />
            )}
            <BlocCible joueur={cible} />
            {/* Les cartes ne dépendent que des joueurs et des bascules, jamais de la cible. */}
            {CARTES_PODIUM.map((carte) => (
              <CarteDuPodium
                key={carte}
                carte={carte}
                joueurs={joueurs}
                reglages={reglages}
                onToutVoir={liste.ouvrir}
              />
            ))}
          </>
        )}
      </div>

      <Modale
        ouvert={liste.ouverte !== null}
        onFermer={liste.fermer}
        titre={teteListe?.titre ?? ''}
        {...(teteListe
          ? {
              pictogramme: teteListe.pictogramme,
              action: teteListe.bascules,
              ...(teteListe.nom ? { nom: teteListe.nom } : {}),
            }
          : {})}
      >
        {liste.ouverte !== null &&
          (stats.isPending ? (
            <SpinnerLigne label={CHARGEMENT_STATISTIQUES} />
          ) : (
            <ListeComplete carte={liste.ouverte} joueurs={joueurs} reglages={reglages} />
          ))}
      </Modale>
    </main>
  )
}
