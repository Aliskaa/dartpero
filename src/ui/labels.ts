import type { InstallState } from '@/core/application/ports/driven/AppInstallation'
import type { StorageProtection } from '@/core/application/ports/driven/PersistentStorage'
import type { StatsPeriod } from '@/core/application/ports/driving/GetPlayerStats'
import type { VisitOutcome } from '@/core/domain/entities/Visit'
import type { GameModeId } from '@/core/domain/games'
import type { Theme } from '@/ui/theme'

/** Le cœur reste en anglais ; tout le français de l'app vit ici. */
export const LIBELLE_ISSUE: Record<VisitOutcome, string> = {
  SCORED: 'Volée enregistrée',
  BUSTED: 'Bust !',
  CHECKOUT: 'Sortie !',
}

/**
 * Ce que la voix annonce à la fin d'une volée.
 *
 * ⚠️ Les nombres partent **en chiffres** (« 140 »), pas en lettres : la
 * synthèse vocale française les prononce correctement toute seule, et écrire
 * « cent quarante » ferait buter les voix qui lisent lettre à lettre.
 *
 * C'est ici, et nulle part ailleurs, que se décide ce qui est dit — le port
 * `Announcer` ne reçoit que du texte déjà écrit.
 */
export const annonceVolee = (scored: number, outcome: VisitOutcome): string => {
  if (outcome === 'BUSTED') return 'Bust'
  if (outcome === 'CHECKOUT') return 'Sortie !'
  return String(scored)
}

export const annonceIssue = (outcome: VisitOutcome): string =>
  outcome === 'CHECKOUT' ? 'Sortie !' : outcome === 'BUSTED' ? 'Bust' : 'Raté'

/** « À toi, Julien » — ce qu'on dit vraiment autour d'une cible. */
export const annonceTour = (nom: string): string => `À toi, ${nom}`

export const annonceCible = (libelle: string): string => `Cible : ${libelle}`

/**
 * Ce que la voix dit à la fin d'une volée : le résultat, **puis à qui c'est le
 * tour**. C'est le seul canal qui porte jusqu'à l'oche — le téléphone est posé
 * à deux mètres et personne ne va lire l'écran entre deux volées.
 *
 * ⚠️ Une **seule** phrase, jamais deux appels successifs : l'adapter coupe
 * l'énoncé en cours à chaque `say` (une annonce en retard vaut moins que le
 * silence), donc annoncer le score puis le tour ferait taire le score.
 *
 * `resultat` peut être `null` — une volée blanche au Cricket ne se commente
 * pas, mais elle passe quand même la main, et ça, il faut le dire.
 * `prochain` est `null` en solo et en fin de partie : on ne rappelle pas à un
 * joueur seul que c'est encore à lui, et on n'enchaîne pas sur la victoire.
 */
export const annonceFinDeVolee = (resultat: string | null, prochain: string | null): string => {
  if (prochain === null) return resultat ?? ''
  if (resultat === null) return annonceTour(prochain)
  return `${resultat}. ${annonceTour(prochain)}`
}

/**
 * Ce que le bouton d'annulation va **vraiment** défaire.
 *
 * ⚠️ Deux formes, et c'est volontaire. Une touche de pavé fait une demi-largeur
 * d'écran : « Annuler la volée de Julien » n'y tient pas. Le `court` s'affiche,
 * le `complet` sert de nom accessible — et comme le court est contenu mot pour
 * mot dans le complet, la règle « label in name » (WCAG 2.5.3) est respectée.
 */
export type Annulation = {
  /** Ce qui est écrit sur la touche. */
  readonly court: string
  /** Le nom accessible, qui peut nommer le joueur. */
  readonly complet: string
}

/** Le libellé neutre, quand il n'y a rien à annuler (la touche est désactivée). */
export const ANNULATION_NEUTRE: Annulation = { court: 'Annuler', complet: 'Annuler' }

/**
 * Un seul bouton, deux comportements (la fléchette en cours, ou la dernière
 * volée enregistrée) : c'est la bonne ergonomie, mais une étiquette unique
 * laissait deviner lequel s'appliquerait. À trois autour d'un téléphone, dans
 * un garage, on ne devine pas — surtout quand le second cas peut dé-gagner un
 * leg sans prévenir.
 */
export const libelleAnnulation = (
  flechette: string | null,
  auteurDerniereVolee: string | null,
): Annulation => {
  // Une fléchette est plantée : c'est elle qu'on retire, et son nom tient sur
  // la touche. C'est ce changement visible d'étiquette qui lève l'ambiguïté —
  // « Annuler » tout court veut désormais dire « la dernière volée ».
  if (flechette !== null) {
    const libelle = `Annuler ${flechette}`
    return { court: libelle, complet: libelle }
  }
  if (auteurDerniereVolee !== null) {
    return { court: 'Annuler', complet: `Annuler la volée de ${auteurDerniereVolee}` }
  }
  return ANNULATION_NEUTRE
}

/**
 * Ce que la voix dit d'une volée de Cricket — court, comme au X01.
 *
 * On annonce en priorité les points, parce que c'est ce qui change le
 * classement ; à défaut, la fermeture, qui est l'autre chose qu'on attend. Une
 * volée blanche ne dit rien : la voix n'est pas là pour commenter les ratés.
 * En cut-throat on précise « pour les autres », sinon le joueur croit avoir
 * marqué alors qu'il vient d'offrir des points.
 */
export const annonceCricket = ({
  points,
  fermees,
  gagnee,
  cutThroat,
}: {
  readonly points: number
  readonly fermees: number
  readonly gagnee: boolean
  readonly cutThroat: boolean
}): string | null => {
  if (gagnee) return 'Partie gagnée !'
  if (points > 0) return cutThroat ? `${points} pour les autres` : String(points)
  if (fermees > 0) return fermees > 1 ? `${fermees} cibles fermées` : 'Cible fermée'
  return null
}

/** Le nom de la variante, à l'écran. Le domaine ne connaît que `CUT_THROAT`. */
export const LIBELLE_VARIANTE_CRICKET: Record<'STANDARD' | 'CUT_THROAT', string> = {
  STANDARD: 'Standard',
  CUT_THROAT: 'Cut-throat',
}

/** Le nom d'un mode, au fil du texte. */
export const LIBELLE_MODE: Record<GameModeId, string> = {
  X01: 'X01',
  TOUR_DU_MONDE: 'Tour du monde',
  CRICKET: 'Cricket',
  CHECKOUT_PRACTICE: 'Entraînement',
}

/**
 * Le même, pour un rail de filtre.
 *
 * ⚠️ Cinq cases sur 350 px, c'est **70 px chacune** : « Tour du monde » et
 * « Entraînement » n'y entrent pas. La légende du rail (« Mode ») porte le
 * contexte, les cases n'ont qu'à être distinctes.
 */
export const LIBELLE_MODE_COURT: Record<GameModeId, string> = {
  X01: 'X01',
  TOUR_DU_MONDE: 'Monde',
  CRICKET: 'Cricket',
  CHECKOUT_PRACTICE: 'Solo',
}

/**
 * Les fenêtres de statistiques, côté français.
 *
 * ⚠️ Libellés **courts** : les quatre tiennent sur un rail de 358 px en
 * portrait, et « Depuis toujours » n'y entrerait pas. « Tout » suffit — c'est
 * la légende du rail (« Période ») qui donne le sens.
 */
export const LIBELLE_PERIODE: Record<StatsPeriod, string> = {
  TODAY: "Aujourd'hui",
  LAST_7_DAYS: '7 jours',
  LAST_30_DAYS: '30 jours',
  ALL_TIME: 'Tout',
}

/** La même chose au fil du texte, où la place ne manque pas. */
export const PERIODE_EN_TOUTES_LETTRES: Record<StatsPeriod, string> = {
  TODAY: "aujourd'hui",
  LAST_7_DAYS: 'ces 7 derniers jours',
  LAST_30_DAYS: 'ces 30 derniers jours',
  ALL_TIME: 'toutes parties confondues',
}

/**
 * Les trois thèmes, côté français. « Système » se dit tel quel : c'est le mot
 * qu'emploient iOS et Android dans leurs propres réglages, et l'utilisateur
 * cherche le sien.
 */
export const LIBELLE_THEME: Record<Theme, string> = {
  sombre: 'Sombre',
  clair: 'Clair',
  systeme: 'Système',
}

/** Ce que dit la ligne d'état de la protection du stockage, dans les Réglages. */
export const LIBELLE_PROTECTION_STOCKAGE: Record<StorageProtection, string> = {
  persisted: 'Données protégées : le navigateur ne les effacera pas de lui-même.',
  'not-persisted': 'Le navigateur peut effacer les données si l’espace manque.',
  unavailable: 'Protection non prise en charge par ce navigateur.',
}

/**
 * Le rappel d'exporter, présent dans chaque état : même protégée, la base
 * disparaît avec la désinstallation de la PWA, l'effacement des données du
 * site ou la perte du téléphone. Ce n'est jamais une sauvegarde.
 */
export const RAPPEL_EXPORT_STOCKAGE: Record<StorageProtection, string> = {
  persisted: 'Ce n’est pas une sauvegarde : exportez pour garder une copie.',
  'not-persisted': 'Exportez régulièrement.',
  unavailable: 'Exportez régulièrement : le fichier JSON est votre seule copie.',
}

/** Retour d'une redemande faite par l'utilisateur et refusée (jamais au démarrage). */
export const REFUS_REDEMANDE_STOCKAGE =
  'Le navigateur a refusé. Il accepte en général une fois Dartpéro installé sur l’écran d’accueil.'

export const ETIQUETTE_PROTECTION_STOCKAGE = 'Protection des données'
export const LIBELLE_REDEMANDER_PROTECTION = 'Redemander'

/** La ligne discrète de l'Accueil. Jamais sur un écran de partie. */
export const TITRE_INVITATION_INSTALLATION = 'Installer Dartpéro'
export const TEXTE_INVITATION_INSTALLATION =
  'Plein écran, une icône sur l’écran d’accueil, et des données mieux protégées.'
export const LIBELLE_INSTALLER = 'Installer'
export const LIBELLE_PLUS_TARD = 'Plus tard'

/** Réglages → À propos. */
export const LIBELLE_INSTALLER_DARTPERO = 'Installer Dartpéro'
export const ETIQUETTE_INSTALLATION = 'Installation'
export const PRESENTATION_DARTPERO =
  'Dartpéro — compteur de fléchettes : X01, Tour du monde, Cricket et entraînement au checkout.'

/** La phrase d'état de l'installation, une par état. */
export const ETAT_INSTALLATION: Record<InstallState, string> = {
  installed: 'Dartpéro est installé sur cet appareil.',
  installable: 'Installez Dartpéro pour l’ouvrir en plein écran, comme une application.',
  'ios-manual': 'Sur iPhone ou iPad, l’installation se fait depuis Safari, en trois gestes :',
  'ios-other-browser': 'Ouvrez ce lien dans Safari pour installer Dartpéro.',
  unavailable:
    'Installez Dartpéro depuis le menu de votre navigateur (« Ajouter à l’écran d’accueil ») pour l’ouvrir comme une application.',
}

/**
 * Les trois gestes sur Safari iOS et iPadOS. Partager est en bas sur iPhone,
 * en haut sur iPad : le libellé ne dit pas où. Selon la version, il peut se
 * cacher sous le bouton « … » de la barre d'adresse.
 */
export const ETAPES_INSTALLATION_IOS = [
  'Touchez Partager (ou ouvrez « … » d’abord).',
  'Choisissez « Sur l’écran d’accueil ».',
  'Touchez « Ajouter ».',
] as const

/** Après un refus de « Redemander » : le chemin vers l'installation sur iOS. */
export const LIEN_GUIDE_INSTALLATION = 'Voir comment installer'

/*
 * Politique de confidentialité et mentions légales (`/confidentialite`).
 *
 * ⚠️ Chaque phrase est un ENGAGEMENT PUBLIC, donné à la Play Console : elle
 * doit rester vraie au regard du code. Une capacité réseau, une nouvelle clé
 * de stockage ou une nouvelle fonction du téléphone se livre AVEC la mise à
 * jour de ce texte et de sa date. Seul le réseau a un garde automatique
 * (`tests/architecture/reseauBoundary`) ; le stockage et les fonctions du
 * téléphone ne reposent que sur la relecture.
 * Projet sincère, pas un avis juridique.
 *
 * ⚠️ La garde de publication de `npm run smoke` reste en place : le moindre
 * marqueur REMPLIR revenu dans `dist/` rebloquerait tout déploiement. Ce
 * commentaire le cite sans risque : la minification le retire du bundle.
 */

/** La ligne-lien de Réglages → À propos. */
export const LIEN_CONFIDENTIALITE = 'Confidentialité et mentions légales'

export const TITRE_CONFIDENTIALITE = 'Confidentialité'
export const SOUS_TITRE_CONFIDENTIALITE = 'Politique et mentions légales'

/** Chaîne française littérale : jamais recalculée depuis une date ISO. */
export const DATE_MISE_A_JOUR_CONFIDENTIALITE = 'Mise à jour le 12 octobre 2026'

export const RETOUR_REGLAGES = 'Retour aux réglages'

/** Une section de la politique : un titre `<h2>`, puis ses paragraphes. */
export type SectionPolitique = {
  readonly titre: string
  readonly paragraphes: readonly string[]
}

export const SECTIONS_CONFIDENTIALITE: readonly SectionPolitique[] = [
  {
    titre: 'Politique de confidentialité',
    paragraphes: [
      'Dartpéro est un compteur de fléchettes qui fonctionne entièrement sur votre téléphone. Il n’y a pas de compte à créer : les joueurs sont de simples profils locaux.',
      'L’éditeur ne collecte aucune donnée : Dartpéro n’a ni serveur ni compte, et ne lui transmet rien. Aucune mesure d’audience, aucune publicité, aucun cookie.',
      'Deux cas techniques, qui ne dépendent pas de l’éditeur, font sortir quelque chose du téléphone ; ils sont décrits plus bas : l’hébergeur, qui reçoit les requêtes quand il sert les fichiers de l’application, et la voix de l’annonce vocale qui, selon votre navigateur, peut être synthétisée en ligne. Le fichier d’export, lui, n’est envoyé nulle part par Dartpéro.',
    ],
  },
  {
    titre: 'Sur votre appareil',
    paragraphes: [
      'Vos profils (pseudo, couleur, date de création) et vos parties (le nom que vous leur avez donné, s’il y en a un, et chaque fléchette saisie, avec ses dates) sont enregistrés dans la base de données du navigateur (IndexedDB), sur ce téléphone seulement.',
      'Les préférences de l’appareil vont dans le stockage local du navigateur (localStorage) : le thème, l’annonce vocale, les réglages de la dernière partie, les derniers joueurs choisis (leurs identifiants internes) et le « Plus tard » de l’invitation à installer. Au démarrage, une valeur de test y est écrite puis effacée aussitôt.',
      'Si une mise à jour de l’application ne parvient pas à se charger, un marqueur technique est posé dans le stockage de session (sessionStorage), pour ne recharger la page qu’une seule fois.',
      'Une copie des fichiers de l’application est gardée en cache par le navigateur, pour qu’elle fonctionne hors ligne.',
      'Au démarrage, Dartpéro demande au navigateur de protéger ce stockage, pour qu’il ne l’efface pas de lui-même quand la place vient à manquer. Cette protection n’est pas une sauvegarde.',
    ],
  },
  {
    titre: 'Garder la main',
    paragraphes: [
      'Exporter : Réglages → Sauvegarde crée un fichier JSON qui contient vos profils (pseudos, couleurs) et vos parties. Ce que vous faites ensuite de ce fichier ne passe pas par Dartpéro.',
      'Importer : le fichier choisi est lu sur le téléphone et vérifié, puis ses profils et ses parties s’ajoutent à la base. Ceux qui y figurent déjà (même identifiant) sont remplacés par la version du fichier ; le reste de la base n’est pas touché.',
      'Effacer : vous pouvez supprimer un profil (ses parties passées restent dans l’historique, sous « Joueur supprimé ») ou supprimer une partie. Pour tout effacer, effacez les données de ce site dans les réglages de votre navigateur.',
    ],
  },
  {
    titre: 'Fonctions du téléphone',
    paragraphes: [
      'Pendant une partie, Dartpéro garde l’écran allumé et peut faire vibrer le téléphone (pas sur iPhone). Il n’utilise jamais la caméra, le micro, la localisation, les contacts ni les notifications.',
      'L’annonce vocale lit les scores et le pseudo du joueur suivant avec une voix fournie par le navigateur. Selon le navigateur, cette voix peut être synthétisée en ligne par son fournisseur, qui reçoit alors le texte annoncé, pseudos compris. Pour l’éviter, coupez « Annoncer les volées » dans Réglages → Annonce vocale.',
    ],
  },
  {
    titre: 'Hébergement',
    paragraphes: [
      'Les fichiers de l’application sont servis par Firebase Hosting (Google). Comme tout hébergeur, il reçoit l’adresse IP et les informations techniques de chaque requête, et peut les journaliser selon ses propres règles. L’éditeur ne les exploite pas.',
      'Une fois l’application en cache, elle fonctionne sans réseau.',
    ],
  },
]

export const TITRE_MENTIONS_LEGALES = 'Mentions légales'

export const TERME_EDITEUR = 'Éditeur'
export const TERME_CONTACT = 'Contact'
export const TERME_HEBERGEUR = 'Hébergeur'

export const MENTION_EDITEUR = 'Dartpéro, particulier non professionnel'
export const MENTION_CONTACT = 'roulandzanellakevin@gmail.com'
export const MENTION_HEBERGEUR_SERVICE = 'Firebase Hosting (Google)'
export const MENTION_HEBERGEUR_ENTITE = 'Google Ireland Limited'
export const MENTION_HEBERGEUR_ADRESSE = 'Gordon House, Barrow Street, Dublin 4, Irlande'

export const JOUEUR_SUPPRIME = 'Joueur supprimé'

export const nomJoueur = (nom: string | null): string => nom ?? JOUEUR_SUPPRIME

/** Les moyennes s'affichent avec une décimale, à la française. */
export const moyenne = (valeur: number): string =>
  valeur.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * ⚠️ Un tiret plutôt que « 0 % » quand rien n'a été joué ou tenté : zéro pour
 * cent, ça veut dire « il a tout perdu ». Rien du tout, ça veut dire « on ne
 * sait pas encore » — une manche en cours n'est ni gagnée ni perdue, et un
 * joueur qui n'a jamais eu de double à jouer n'a pas raté ses sorties, il n'en
 * a simplement pas eu. Sert aux trois pourcentages de l'app : matchs, manches,
 * doubles.
 */
export const pourcent = (valeur: number, occasions: number): string =>
  occasions === 0 ? '—' : `${Math.round(valeur)} %`

export const dateCourte = (horodatage: number): string =>
  new Date(horodatage).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

/** Une partie se repère à sa soirée : la date seule ne suffit pas à distinguer. */
export const dateHeure = (horodatage: number): string =>
  new Date(horodatage).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/* ------------------------------------------------------------------------
 * Le nom d'une partie (lot `nom-de-partie`).
 * ---------------------------------------------------------------------- */

/** Le libellé visible du champ de l'étape 1. */
export const LIBELLE_NOM_PARTIE = 'Nom de la partie'

/**
 * Les jours, indexés par `Date.prototype.getDay()` : 0 = dimanche.
 * ⚠️ Une table, pas `toLocaleString` : le résultat doit être exact et
 * identique sur tous les téléphones, quelle que soit la langue du système.
 */
export const JOURS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const

/** Les tranches de la journée, par heure de **début** (heure locale), de la plus tardive à la plus tôt. */
export const TRANCHES = [
  { debut: 18, libelle: 'soir' },
  { debut: 12, libelle: 'après-midi' },
  { debut: 5, libelle: 'matin' },
] as const

/** De minuit à 5 h : la nuit, au nom du jour du calendrier. */
export const TRANCHE_NUIT = 'nuit'

/**
 * Le nom par défaut d'une partie : « Dimanche soir ».
 *
 * Matin de 5 h à 12 h, après-midi de 12 h à 18 h, soir de 18 h à minuit ; de
 * minuit à 5 h, c'est la nuit — et elle porte le nom du **jour du calendrier**,
 * comme les autres tranches : dimanche 1 h donne « Dimanche nuit ». Aucun
 * rattachement au jour d'avant (choix de l'utilisateur).
 *
 * ⚠️ Le jour se lit sur le **calendrier local** (`getDay()`), jamais en
 * décalant l'horodatage d'un nombre d'heures : les jours de changement
 * d'heure durent 23 ou 25 h.
 *
 * `Date` sert ici de **calendrier** pour un horodatage donné, jamais
 * d'horloge : l'heure courante vient de `services.clock`.
 *
 * Ce nom est un **libellé** : il n'est jamais écrit dans le journal, il se
 * recalcule à chaque affichage depuis la date de création.
 */
export const nomParDefaut = (horodatage: number): string => {
  const date = new Date(horodatage)
  const heure = date.getHours()
  const tranche = TRANCHES.find(({ debut }) => heure >= debut)
  return `${JOURS[date.getDay()]} ${tranche ? tranche.libelle : TRANCHE_NUIT}`
}

/** Le nom à afficher : le nom tapé s'il y en a un, sinon celui de sa date de création. */
export const nomDePartie = ({
  name,
  createdAt,
}: {
  readonly name: string | null
  readonly createdAt: number
}): string => name ?? nomParDefaut(createdAt)

/* ------------------------------------------------------------------------
 * L'Accueil en parties récentes et la carte de partie (lot `accueil-parties-recentes`).
 * ---------------------------------------------------------------------- */

export const TITRE_AUJOURDHUI = 'Aujourd’hui'
export const TITRE_CETTE_SEMAINE = 'Cette semaine'
export const TITRE_PARTIES_RECENTES = 'Parties récentes'
export const LIBELLE_REPRENDRE = 'Reprendre'
export const LIBELLE_EN_COURS = 'En cours'
/** Non terminée, et pas la plus récente des non terminées : reprenable d'un tap. */
export const LIBELLE_ABANDONNEE = 'Abandonnée'
export const LIBELLE_MATCH_NUL = 'Match nul'
/**
 * Lu par les lecteurs d'écran à côté de la couronne (décorative) d'une ligne de
 * score. Posée après le nom, elle se lit « Kevin, vainqueur » : c'est la virgule
 * de tête (`, {LIBELLE_VAINQUEUR}`) qui fait le nom accessible, d'où la minuscule
 * d'une fin de phrase. « Vainqueur » capitalisé reste le libellé du tableau
 * d'honneur du résumé, un autre élément.
 */
export const LIBELLE_VAINQUEUR = 'vainqueur'
export const LIBELLE_TERMINEE = 'Terminée'
export const LIBELLE_AUCUNE_PARTIE_SEMAINE = 'Pas de partie cette semaine'
export const LIBELLE_CREER_JOUEUR = 'Créer un joueur'

/* Robustesse de l'Accueil (lot `accueil-robustesse`). */

/** Aucune partie dans toute la base : l'appli n'a jamais servi (≠ semaine calme). */
export const LIBELLE_AUCUNE_PARTIE_ENCORE = 'Aucune partie jouée pour l’instant'
export const LIBELLE_TOUTES_LES_PARTIES = 'Toutes les parties'
/** Une lecture a échoué : on ne promet pas que les données sont intactes, on n'affiche pas l'erreur brute. */
export const LIBELLE_ERREUR_ACCUEIL =
  'Impossible de lire les parties pour le moment. Rouvrez l’application ; si le problème persiste, vos données sont peut-être inaccessibles sur cet appareil.'
export const LIBELLE_CHARGEMENT_PARTIES = 'Chargement des parties…'

/* La barre du bas et l'enseigne : libellés d'écran sortis des composants. */

export const LIBELLE_NAVIGATION_PRINCIPALE = 'Navigation principale'
export const LIBELLE_ONGLET_DEBUT = 'Début'
export const LIBELLE_ONGLET_STATS = 'Stats'
export const LIBELLE_ONGLET_PARTIES = 'Parties'
export const LIBELLE_ONGLET_REGLAGES = 'Réglages'
export const LIBELLE_COMPTEUR_FLECHETTES = 'Compteur de fléchettes'

/** Titre invisible au-dessus de la carte épinglée : la hiérarchie `h1` → `h2` → `h3` reste continue. */
export const TITRE_PARTIE_EN_COURS = 'Partie en cours'

export const libelleGagne = (nom: string): string => `${nom} gagne`

/* Les règles d'une carte de partie, par mode : des primitives, jamais un `MatchSummary`. */

export const reglesTourDuMonde = (premiereCible: number | string): string =>
  `Tour du monde · ${premiereCible} → bulle`

export const reglesCricket = (variante: 'STANDARD' | 'CUT_THROAT', cibles: number): string =>
  `Cricket ${LIBELLE_VARIANTE_CRICKET[variante]} · ${cibles} cibles`

export const reglesEntrainement = (sorties: number, min: number, max: number): string =>
  `Entraînement · ${sorties} sorties · ${min} à ${max}`

export const reglesX01 = (options: {
  readonly score: number
  readonly legsToWin: number
  readonly setsToWin: number
  readonly doubleOut: boolean
  readonly doubleIn: boolean
}): string =>
  [
    `X01 · ${options.score}`,
    libelleFormat(options.legsToWin, options.setsToWin),
    ...(options.doubleOut ? ['double out'] : []),
    ...(options.doubleIn ? ['double in'] : []),
  ].join(' · ')

/** X01 : tous sets confondus. « 0 manche jouée » au départ. */
export const libelleManchesDePartie = (nombre: number): string =>
  pluriel(nombre, 'manche jouée', 'manches jouées')

/** X01 terminé : le vainqueur, puis les manches jouées (« Julien gagne · 5 manches »). */
export const libelleGagneEnManches = (nom: string, manches: number): string =>
  `${libelleGagne(nom)} · ${pluriel(manches, 'manche', 'manches')}`

export const libelleSorties = (reussies: number, jouees: number): string =>
  `${reussies} / ${jouees} sorties`

/** « 21 h 04 » — l'heure **locale**, deux chiffres aux minutes. */
export const heureCourte = (horodatage: number): string => {
  const date = new Date(horodatage)
  return `${date.getHours()} h ${String(date.getMinutes()).padStart(2, '0')}`
}

/** « 21 h 04 » aujourd'hui, « mardi 21 h 10 » dans la semaine. */
export const libelleQuand = (horodatage: number, aujourdhui: boolean): string =>
  aujourdhui
    ? heureCourte(horodatage)
    : `${(JOURS[new Date(horodatage).getDay()] ?? '').toLowerCase()} ${heureCourte(horodatage)}`

/** « 3 parties », « 1 partie » — l'accord au singulier revient partout. */
export const pluriel = (nombre: number, singulier: string, pluriel = `${singulier}s`): string =>
  `${nombre} ${nombre > 1 ? pluriel : singulier}`

/**
 * Le format du match, en français — et **plus jamais en « best of »**.
 *
 * ⚠️ « Best of 3 » est une convention à **deux** joueurs : elle compte les legs
 * *joués*, et n'a de sens que parce qu'à deux, « premier à 2 » ne peut pas
 * dépasser 3 legs. À trois ou quatre, la même partie peut en durer six sans
 * que personne ne triche — le libellé mentait donc dès qu'on était plus de
 * deux. Le domaine, lui, a toujours stocké `legsToWin` (« premier à N ») :
 * c'est ce qu'on affiche désormais, tel quel.
 */
export const libelleLegs = (legsToWin: number): string =>
  legsToWin === 1 ? '1 manche' : `premier à ${legsToWin} manches`

/**
 * La même chose pour le bandeau de match, où chaque caractère compte : le mot
 * « manche » y est déjà posé juste avant par le numéro de la manche en cours.
 *
 * ⚠️ À l'écran on dit « manche », jamais « leg » (lot
 * `nouvelle-partie-en-etapes`). Le code garde `legsToWin`, `Leg`, `LegWon` :
 * seul ce qui s'affiche — ou se prononce — change.
 */
export const libelleLegsCourt = (legsToWin: number): string =>
  legsToWin === 1 ? '1 manche' : `premier à ${legsToWin}`

/**
 * Le format complet d'une partie X01 : les manches seules, ou les sets puis les
 * manches de chaque set. « Set » reste « set ».
 */
export const libelleFormat = (legsToWin: number, setsToWin: number): string =>
  setsToWin <= 1
    ? libelleLegs(legsToWin)
    : `premier à ${setsToWin} sets · ${libelleLegs(legsToWin)} par set`

/** Le bandeau de match : « Manche 3 ». Numérotée sur la partie. */
export const libelleMancheEnCours = (numero: number): string => `Manche ${numero}`

/** Le bandeau de match, sous « Manche 3 » quand la partie se joue en sets. */
export const libelleSetEnCours = (numero: number): string => `Set ${numero}`

/** Le titre du bandeau X01 : le jeu se dit par son nom, en grand. */
export const TITRE_BANDEAU_X01 = 'X01'

/**
 * Le sous-titre du bandeau X01 : « 501 · premier à 2 manches ». Le numéro de la
 * manche n'est plus juste avant (il est passé à droite du bandeau), donc le mot
 * « manches » reprend sa place ici.
 */
export const sousTitreBandeauX01 = (scoreDepart: number, legsToWin: number): string =>
  `${scoreDepart} · ${libelleLegs(legsToWin)}`

/* ------------------------------------------------------------------------
   La FEUILLE COMMUNE aux trois jeux (lot `feuille-commune`) : bandeau, en-têtes
   de colonnes, ligne de volée. Le titre dit le jeu, le sous-titre ses règles,
   la droite « où l'on en est ».
   ------------------------------------------------------------------------ */

/** Le nom accessible de la feuille de match, quel que soit le jeu. */
export const LIBELLE_TABLEAU_SCORES = 'Tableau des scores'

/** Les en-têtes de colonnes (en inversion, `aria-hidden`). */
export const LIBELLE_JOUEUR = 'Joueur'
export const LIBELLE_VOLEE = 'Volée'
export const LIBELLE_RESTE = 'Reste'
export const LIBELLE_PTS = 'Pts'
/** En cut-throat l'en-tête garde la flèche : le plus petit total gagne. */
export const LIBELLE_PTS_CUT_THROAT = 'Pts ↓'
export const LIBELLE_PARCOURS = 'Parcours'
export const LIBELLE_CIBLE = 'Cible'
/** La bulle comme cible du Tour du monde, sous son glyphe (majuscules par style). */
export const LIBELLE_BULLE = 'Bulle'

export const TITRE_BANDEAU_CRICKET = 'Cricket'

/** « Standard · 7 cibles », « Cut-throat · 7 cibles ». */
export const sousTitreBandeauCricket = (
  variante: 'STANDARD' | 'CUT_THROAT',
  cibles: number,
): string => `${LIBELLE_VARIANTE_CRICKET[variante]} · ${pluriel(cibles, 'cible')}`

/**
 * Le rappel de la condition de victoire, à droite du bandeau Cricket. Une liste
 * de lignes : le cut-throat s'empile (« Le plus bas » / « gagne »), comme
 * « Manche » / « Set » au X01 ; une rangée en paysage.
 */
export const LIBELLE_CONDITION_CRICKET: Record<'STANDARD' | 'CUT_THROAT', readonly string[]> = {
  STANDARD: ['Ferme + mène'],
  CUT_THROAT: ['Le plus bas', 'gagne'],
}

export const TITRE_BANDEAU_TOUR_DU_MONDE = 'Tour du monde'

/** « 21 cibles ». */
export const sousTitreBandeauTourDuMonde = (cibles: number): string => pluriel(cibles, 'cible')

/** Le dernier tour de table : tout le monde a droit au même nombre de volées. */
export const LIBELLE_DERNIER_TOUR = 'Dernier tour'

export const TITRE_BANDEAU_ENTRAINEMENT = 'Entraînement'

/** « Manche 3/10 » : l'avancement de l'entraînement, à droite du bandeau. */
export const libelleMancheSurTotal = (numero: number, total: number): string =>
  `Manche ${numero}/${total}`

/** Le mot, accordé : « 1 fléchette », « 4 fléchettes » (le nombre se met à part). */
export const motFlechettes = (nombre: number): string => (nombre > 1 ? 'fléchettes' : 'fléchette')

/** Le nom accessible de la volée écrite sur la dernière ligne du Cricket. */
export const etiquetteVoleeDe = (nom: string): string => `Volée de ${nom}`

/** Le nom accessible de la volée d'une ligne de feuille en cours de saisie. */
export const ETIQUETTE_VOLEE_EN_COURS = 'Volée en cours'

/** Celui de la dernière volée enregistrée d'un joueur qui ne lance pas. */
export const etiquetteDerniereVoleeDe = (nom: string): string => `Dernière volée de ${nom}`

/** Le nom accessible de la volée d'une ligne : en cours de saisie, ou la dernière du joueur. */
export const etiquetteVoleeLigne = (enSaisie: boolean, nom: string): string =>
  enSaisie ? ETIQUETTE_VOLEE_EN_COURS : etiquetteDerniereVoleeDe(nom)

/** Le moment célébré quand une manche tombe (le checkout qui la gagne). */
export const TITRE_MOMENT_MANCHE = 'Manche !'

/** Les en-têtes et lignes de statistiques qui parlaient de « legs ». */
export const LIBELLE_MANCHES = 'Manches'
export const LIBELLE_MEILLEURE_MANCHE = 'Meilleure manche'
export const LIBELLE_MANCHES_GAGNEES = 'Gagnées'
export const LIBELLE_MANCHES_JOUEES = 'Jouées'

/** Le nom accessible de la colonne des bâtons, sur la ligne d'un joueur. */
export const etiquetteManchesGagnees = (nom: string, gagnees: number, requises: number): string =>
  `Manches gagnées par ${nom} : ${gagnees} sur ${requises}`

/* ------------------------------------------------------------------------
 * Nouvelle partie, en étapes : le jeu, puis joueurs et réglages, puis l'ordre.
 * ---------------------------------------------------------------------- */

export const TITRE_NOUVELLE_PARTIE = 'Nouvelle partie'
export const SOUS_TITRE_ETAPE_JEU = 'Choisissez le jeu'
export const TITRE_ETAPE_ORDRE = 'Ordre de jeu'
export const TITRE_JOUEURS_EXISTANTS = 'Joueurs existants'
export const SOUS_TITRE_JOUEURS_EXISTANTS = 'Cochez ceux qui jouent'

export const RETOUR_ACCUEIL = 'Retour à l’accueil'
export const RETOUR_ETAPE_PRECEDENTE = 'Étape précédente'

/**
 * Les deux lignes de règles de chaque carte de l'étape 1 — fidèles à
 * `CLAUDE.md` § Règles du jeu. Les bornes de l'entraînement sont passées par
 * l'appelant (lues sur `DEFAUT` du domaine), jamais recopiées ici.
 */
export const reglesCarteJeu = (
  mode: GameModeId,
  entrainement: { readonly min: number; readonly max: number },
): readonly [string, string] => {
  switch (mode) {
    case 'X01':
      return [
        'Décompter 301, 501 ou 701 jusqu’à zéro pile.',
        'En manches, éventuellement en sets ; double out au choix.',
      ]
    case 'CRICKET':
      return [
        'Fermer le 20 au 15 et la bulle, trois marques chacun.',
        'Le surplus marque tant qu’un adversaire n’a pas fermé.',
      ]
    case 'TOUR_DU_MONDE':
      return [
        'Du 20 au 1, puis la bulle : toucher le secteur suffit.',
        'On finit le tour de table ; le moins de fléchettes gagne.',
      ]
    case 'CHECKOUT_PRACTICE':
      return [
        `Seul : un reste tiré entre ${entrainement.min} et ${entrainement.max}.`,
        'Trois fléchettes pour le sortir sur un double.',
      ]
    default: {
      const jamais: never = mode
      return jamais
    }
  }
}

export const LEGENDE_JOUEURS_PARTIE = 'Joueurs de la partie'
export const TITRE_PANNEAU_JOUEURS = 'Joueurs'
export const TITRE_PANNEAU_REGLAGES = 'Réglages'
export const AUCUN_JOUEUR_PARTIE = 'Aucun joueur pour l’instant : touchez + pour en ajouter.'
export const LIBELLE_AJOUTER_JOUEUR = 'Ajouter un joueur'
export const LIBELLE_NOUVEAU_JOUEUR = 'Nouveau joueur'
export const LIBELLE_SELECTIONNER_EXISTANT = 'Sélectionner un joueur existant'
export const retirerDeLaPartie = (nom: string): string => `Retirer ${nom} de la partie`

export const LIBELLE_PSEUDO = 'Pseudo'
export const LIBELLE_ANNULER = 'Annuler'
export const LIBELLE_TERMINE = 'Terminé'
export const LIBELLE_CONTINUER = 'Continuer'
export const LIBELLE_COMMENCER = 'Commencer'
export const CHARGEMENT_PROFILS = 'Chargement des profils…'

/** L'erreur de création d'un profil, à l'écran. Le domaine ne parle qu'anglais. */
export const erreurPseudo = (cause: unknown): string =>
  cause instanceof Error && cause.message === 'Player name already taken'
    ? 'Ce pseudo est déjà pris.'
    : 'Ce pseudo n’est pas valide.'

export const ERREUR_DEMARRAGE = 'Impossible de démarrer la partie.'

export const TITRE_AUCUN_PROFIL = 'Aucun profil'
export const DESCRIPTION_AUCUN_PROFIL =
  'Personne n’est encore inscrit sur ce téléphone : créez un premier joueur.'

/** Sous un joueur existant : ses manches X01 jouées, jamais « 0 manche ». */
export const libelleManchesJouees = (manches: number): string => pluriel(manches, 'manche')

/* Réglages par jeu. */
export const LEGENDE_SCORE_DEPART = 'Score de départ'
export const LEGENDE_MANCHES_A_GAGNER = 'Manches à gagner'
export const LEGENDE_SETS_A_GAGNER = 'Sets à gagner'
export const LEGENDE_COMPTAGE = 'Comptage'
export const LEGENDE_NOMBRE_SORTIES = 'Nombre de sorties'
export const LIBELLE_DOUBLE_OUT = 'Double out'
export const AIDE_DOUBLE_OUT = 'Finir obligatoirement sur un double'
export const LIBELLE_DOUBLE_IN = 'Double in'
export const AIDE_DOUBLE_IN = 'Ne décompter qu’après un premier double'
export const LIBELLE_ORDRE_ALEATOIRE = 'Ordre aléatoire'
export const AIDE_ORDRE_ALEATOIRE = 'Le sort décide qui commence'

/**
 * Ce que « premier à N manches » veut dire ce soir-là, en clair.
 *
 * À trois ou quatre, le nombre de manches jouées n'est plus borné par le
 * format, il dépend de qui gagne quoi : autant le dire au moment où on choisit.
 * Avec des sets, les manches se comptent **par set**.
 */
export const aideManches = (legs: number, sets: number, joueurs: number): string => {
  const parSet = sets > 1
  if (legs === 1) {
    return parSet
      ? 'Une seule manche par set : le premier qui sort gagne le set.'
      : 'Une seule manche : le premier qui sort gagne la partie.'
  }
  const base = parSet
    ? `Par set : le premier à ${legs} manches gagne le set`
    : `Le premier à ${legs} manches gagne la partie`
  return joueurs > 2
    ? `${base} — à ${joueurs} joueurs, ${parSet ? 'un set' : 'la partie'} peut en durer davantage.`
    : `${base}.`
}

/** Un set se gagne au premier à N manches, la partie au premier à S sets. */
export const aideSets = (sets: number, legs: number): string =>
  sets <= 1
    ? 'Sans sets : la partie se joue en manches.'
    : `Un set se gagne ${legs === 1 ? 'à la première manche' : `au premier à ${legs} manches`}, la partie au premier à ${sets} sets.`

/**
 * Un paragraphe de règles, avec ses mots en gras. Le texte reste ici ; l'écran
 * ne fait que le poser.
 */
export type Segment = string | { readonly fort: string }

export const PARAGRAPHE_TOUR_DU_MONDE: readonly Segment[] = [
  'On part du ',
  { fort: '20' },
  ' et on descend jusqu’au 1, puis on finit sur la ',
  { fort: 'bulle' },
  '. Simple, double ou triple : peu importe, il suffit de toucher le secteur. Quand quelqu’un boucle, le tour de table se termine — c’est le nombre de fléchettes qui départage.',
]

export const paragrapheCricket = (cutThroat: boolean): readonly Segment[] => [
  'Sept cibles à fermer en trois touches : ',
  { fort: '20' },
  ' à ',
  { fort: '15' },
  ' et la ',
  { fort: 'bulle' },
  '. Une cible fermée chez soi mais pas chez les autres rapporte des points ; ',
  cutThroat
    ? 'en cut-throat ils sont infligés aux adversaires, et le plus PETIT score gagne.'
    : 'gagne celui qui ferme tout sans être derrière au score.',
]

export const paragrapheEntrainement = (min: number, max: number): readonly Segment[] => [
  'Un reste est tiré au sort entre ',
  { fort: `${min} et ${max}` },
  ', et vous avez trois fléchettes pour le sortir sur un double. Jamais de reste impossible : les bogey numbers sont écartés du tirage.',
]

/** La ligne récapitulative au-dessus du bouton de l'étape 2. */
export const recapX01 = ({
  score,
  legs,
  sets,
  doubleOut,
  doubleIn,
}: {
  readonly score: number
  readonly legs: number
  readonly sets: number
  readonly doubleOut: boolean
  readonly doubleIn: boolean
}): string =>
  [
    String(score),
    libelleFormat(legs, sets),
    doubleOut ? 'double out' : 'sortie libre',
    ...(doubleIn ? ['double in'] : []),
  ].join(' · ')

export const recapCricket = (variante: 'STANDARD' | 'CUT_THROAT'): string =>
  `Cricket ${LIBELLE_VARIANTE_CRICKET[variante]} · 20 → 15 · bulle`

export const RECAP_TOUR_DU_MONDE = 'Tour du monde · 20 → bulle'

export const recapEntrainement = (sorties: number, min: number, max: number): string =>
  `${pluriel(sorties, 'sortie')} · ${min} à ${max}`

/* Étape 3 — l'ordre de jeu. */
export const LEGENDE_ORDRE = 'Ordre de passage'
export const AIDE_POIGNEE = 'Glissez, ou flèches haut et bas'
export const deplacerJoueur = (nom: string): string => `Déplacer ${nom}`
export const rangOrdre = (rang: number): string => `n°${rang}`
export const annonceOrdre = (nom: string, position: number, total: number): string =>
  `${nom} : position ${position} sur ${total}`
export const quiCommence = (nom: string): string => `${nom} commence`
export const ORDRE_TIRE_AU_SORT = 'Tiré au sort au lancement'

/* Réglages → Joueurs. */
export const SOUS_TITRE_REGLAGES = 'Joueurs, affichage, sauvegarde et informations'
export const TEXTE_PANNEAU_JOUEURS = 'Renommer, changer la couleur, supprimer un profil.'
export const LIEN_GERER_JOUEURS = 'Gérer les joueurs'

/** Phrases d'ambiance pour les résumés — le côté apéro, hors saisie. */
export const PHRASE_VICTOIRE = [
  'Ça se fête autour de la cible.',
  'Une tournée pour le vainqueur.',
  'Le tableau a parlé.',
  'Bien joué — on remet ça ?',
] as const

export const phraseVictoire = (graine: string): string => {
  let hash = 0
  for (let i = 0; i < graine.length; i += 1) hash = (hash * 31 + graine.charCodeAt(i)) | 0
  const index = Math.abs(hash) % PHRASE_VICTOIRE.length
  return PHRASE_VICTOIRE[index] ?? PHRASE_VICTOIRE[0]
}
