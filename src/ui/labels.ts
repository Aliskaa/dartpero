import type { InstallState } from '@/core/application/ports/driven/AppInstallation'
import type { StorageProtection } from '@/core/application/ports/driven/PersistentStorage'
import type { StatsPeriod } from '@/core/application/ports/driving/GetPlayerStats'
import type { VisitOutcome } from '@/core/domain/entities/Visit'
import type { GameModeId } from '@/core/domain/games'
import { Dart } from '@/core/domain/value-objects/Dart'
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
export const DATE_MISE_A_JOUR_CONFIDENTIALITE = 'Mise à jour le 16 octobre 2026'

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
      'Les préférences de l’appareil vont dans le stockage local du navigateur (localStorage) : le thème, l’annonce vocale, les réglages de la dernière partie, les derniers joueurs choisis (leurs identifiants internes), le dernier joueur consulté dans Statistiques (son identifiant interne) et le « Plus tard » de l’invitation à installer. Au démarrage, une valeur de test y est écrite puis effacée aussitôt.',
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
 * a simplement pas eu. Ne sert plus qu'au pourcentage de doubles : résumé X01
 * et carte Finitions des statistiques. Les pourcentages de matchs et de
 * manches ont quitté l'écran Statistiques (lot `statistiques-podium`) : chaque
 * ligne de Victoires dit « 9 / 16 », et les manches n'y figurent plus.
 */
export const pourcent = (valeur: number, occasions: number): string =>
  occasions === 0 ? '—' : `${Math.round(valeur)} %`

export const dateCourte = (horodatage: number): string =>
  new Date(horodatage).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

/* ------------------------------------------------------------------------
 * Le nom d'une partie (lot `nom-de-partie`).
 * ---------------------------------------------------------------------- */

/** Le libellé visible du champ de l'étape 1. */
export const LIBELLE_NOM_PARTIE = 'Nom de la partie · facultatif'

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

/* ------------------------------------------------------------------------
 * Les cartes de partie (lot `cartes-partie`) : la ligne de feuille et le mini
 * tableau. Des primitives, jamais un `MatchSummary` : c'est `cartesPartie.ts`
 * qui ouvre l'union et appelle ces fonctions.
 * ---------------------------------------------------------------------- */

/**
 * Les règles d'une carte, **sans le nom du jeu** (la colonne de gauche le dit
 * déjà par son pictogramme). Ni double out ni double in : le titre reste court.
 */
export const reglesCarteX01 = (score: number, legsToWin: number, setsToWin: number): string =>
  setsToWin > 1
    ? `${score} · ${setsToWin} sets · ${libelleLegs(legsToWin)}`
    : `${score} · ${libelleLegs(legsToWin)}`

/** X01 fini : « Kevin gagne en 3 manches » (« en 1 manche » au singulier). */
export const parleGagneEnManches = (nom: string, manches: number): string =>
  `${libelleGagne(nom)} en ${pluriel(manches, 'manche')}`

export const reglesCarteTourDuMonde = (
  premiere: number | 'BULL',
  derniere: number | 'BULL',
): string =>
  `${premiere === 'BULL' ? 'bulle' : premiere} → ${derniere === 'BULL' ? 'bulle' : derniere}`

export const reglesCarteEntrainement = (sorties: number, min: number, max: number): string =>
  `${pluriel(sorties, 'sortie')} · ${min} à ${max}`

/** Le détail de la colonne de gauche : « 501 », « STD » / « CT », « 20→B », « 41-170 ». */
export const detailCarteX01 = (score: number): string => String(score)

export const DETAIL_CARTE_CRICKET: Record<'STANDARD' | 'CUT_THROAT', string> = {
  STANDARD: 'STD',
  CUT_THROAT: 'CT',
}

export const detailCarteTourDuMonde = (
  premiere: number | 'BULL',
  derniere: number | 'BULL',
): string => `${premiere === 'BULL' ? 'B' : premiere}→${derniere === 'BULL' ? 'B' : derniere}`

export const detailCarteEntrainement = (min: number, max: number): string => `${min}-${max}`

/** L'unité du jeu, sous le détail : les chiffres de la ligne ne la répètent pas. */
export const UNITE_CARTE: Record<GameModeId, string> = {
  X01: 'reste',
  CRICKET: 'pts',
  TOUR_DU_MONDE: 'fl.',
  CHECKOUT_PRACTICE: 'sorties',
}

/** Le petit suffixe du chiffre d'un mini tableau, au Tour du monde une fois bouclé. */
export const SUFFIXE_FLECHETTES = ' fl.'

/** « Manche 3 », « Set 2 · manche 4 » : toujours sur toute la partie, tous sets confondus. */
export const libelleEtatX01 = (mancheEnCours: number, setEnCours: number | null): string =>
  setEnCours === null
    ? libelleMancheEnCours(mancheEnCours)
    : `${libelleSetEnCours(setEnCours)} · ${libelleMancheEnCours(mancheEnCours).toLowerCase()}`

/** Tour du monde : quelqu'un a bouclé, les autres jouent leur dernière volée. */
export const LIBELLE_ETAT_DERNIER_TOUR = 'Dernier tour'

export const libelleEtatEntrainement = (sortieEnCours: number): string => `Sortie ${sortieEnCours}`

/** Au-delà de ce nombre, les carrés de manches (ou de sets) laissent place à « 3/10 ». */
export const SEUIL_CARRES_JAUGE = 5

/** « 3/10 » : la jauge en chiffres quand les carrés ne tiennent plus. */
export const libelleFraction = (numerateur: number, denominateur: number): string =>
  `${numerateur}/${denominateur}`

/* Les phrases des lecteurs d'écran : « Sarah gagne, 86 points ; Kevin 61 ; Julien 22 ». */

/** L'unité n'est dite qu'à la première occurrence d'une suite de même unité. */
export const parleReste = (reste: number, avecUnite: boolean): string =>
  avecUnite ? `reste ${reste}` : String(reste)

export const parlePoints = (points: number, avecUnite: boolean): string =>
  avecUnite ? pluriel(points, 'point') : String(points)

export const parleFlechettes = (flechettes: number, avecUnite: boolean): string =>
  avecUnite ? pluriel(flechettes, 'fléchette') : String(flechettes)

export const parleCibles = (validees: number, total: number, avecUnite: boolean): string =>
  avecUnite ? `${pluriel(validees, 'cible')} sur ${total}` : `${validees} sur ${total}`

/** Un ratio sans occasion s'affiche « — », jamais « 0/0 ». */
export const VALEUR_ABSENTE = '—'

/** Entraînement sans sortie jouée : « Kevin, aucune sortie jouée ». */
export const parleAucuneSortie = (): string => ', aucune sortie jouée'

export const parleSorties = (reussies: number, jouees: number): string =>
  `${pluriel(reussies, 'sortie réussie', 'sorties réussies')} sur ${jouees}`

/** Une partie finie sans vainqueur, dite en tête de phrase (« Match nul, Julien 48 fléchettes ; … »). */
export const parleSansVainqueur = (mode: GameModeId): string =>
  mode === 'TOUR_DU_MONDE' ? LIBELLE_MATCH_NUL : LIBELLE_TERMINEE

export const parleGagne = (nom: string, valeur: string | null): string =>
  valeur === null ? libelleGagne(nom) : `${libelleGagne(nom)}, ${valeur}`

/** Une valeur qui s'ouvre sur une virgule (« , aucune sortie jouée ») se colle au nom. */
export const parleJoueur = (nom: string, valeur: string): string =>
  valeur.startsWith(',') ? `${nom}${valeur}` : `${nom} ${valeur}`

export const parlePhrase = (tete: string | null, joueurs: readonly string[]): string => {
  const liste = joueurs.join(' ; ')
  return tete === null ? liste : `${tete}, ${liste}`
}

/** « 21 h 04 » — l'heure **locale**, deux chiffres aux minutes. */
export const heureCourte = (horodatage: number): string => {
  const date = new Date(horodatage)
  return `${date.getHours()} h ${String(date.getMinutes()).padStart(2, '0')}`
}

/** Les jours abrégés, indexés par `getDay()` : 0 = dim. */
export const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'] as const

/** « dim. 18 h 10 » : le jour de la semaine, puis l'heure. */
export const libelleJourEtHeure = (horodatage: number): string =>
  `${JOURS_COURTS[new Date(horodatage).getDay()] ?? ''} ${heureCourte(horodatage)}`

/** « · mardi » : le jour seul, à côté de « Aujourd'hui » (une journée peut mêler après-midi et soir). */
export const libelleJourDuGroupe = (maintenant: number): string =>
  `· ${(JOURS[new Date(maintenant).getDay()] ?? '').toLowerCase()}`

/**
 * « 3 oct. 22 h 15 » ; quand l'année diffère de celle de `maintenant`,
 * « 3 oct. 2025 » (l'heure tombe). `Date` ne sert que de calendrier sur un
 * horodatage donné : l'heure courante vient de `services.clock`.
 */
export const libelleDateDeCarte = (horodatage: number, maintenant: number): string => {
  const date = new Date(horodatage)
  if (date.getFullYear() !== new Date(maintenant).getFullYear()) return dateCourte(horodatage)
  const jourMois = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${jourMois} ${heureCourte(horodatage)}`
}

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
/** Le mot de la touche « manqué » du pavé (la fléchette enregistrée est `MISS`). */
export const LIBELLE_HORS = 'Hors'

/** Les noms accessibles de la section du pavé de saisie. */
export const LIBELLE_SAISIE_FLECHETTE = 'Saisie fléchette par fléchette'
export const LIBELLE_SAISIE_CIBLES = 'Saisie des cibles touchées'
/** Pourquoi la Bulle est grisée en Triple. */
export const LIBELLE_PAS_DE_TRIPLE_BULLE = 'Il n’existe pas de triple bull'

/** Les trois positions de la bascule du pavé. */
export const LIBELLE_MULTIPLICATEUR: Record<'SIMPLE' | 'DOUBLE' | 'TRIPLE', string> = {
  SIMPLE: 'Simple',
  DOUBLE: 'Double',
  TRIPLE: 'Triple',
}

/**
 * Une fléchette du Tour du monde, sans le « S » : seul le secteur compte (un
 * simple 17 s'écrit « 17 », pas « S17 »). Un libellé d'AFFICHAGE propre à ce
 * mode : `Dart.label` reste intact (« S17 »), les autres jeux l'utilisent
 * toujours. Un manqué reste « 0 », la bulle son libellé habituel.
 */
export const libelleFlechetteTourDuMonde = (dart: Dart): string =>
  dart.multiplier === 'SIMPLE' && typeof dart.segment === 'number'
    ? String(dart.segment)
    : Dart.label(dart)

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

/* ------------------------------------------------------------------------
 * L'écran Statistiques en podium (lot `statistiques-podium`) : la cible d'un
 * joueur en grand, puis quatre cartes qui disent qui mène et de combien.
 * ---------------------------------------------------------------------- */

export const TITRE_STATISTIQUES = 'Statistiques'
export const LEGENDE_PERIODE = 'Période'
export const CHARGEMENT_STATISTIQUES = 'Calcul des statistiques…'
export const TITRE_STATS_VIDES = 'Aucune partie au compteur'
export const DESCRIPTION_STATS_VIDES =
  'Jouez une première partie : moyennes, 180 et checkouts se cumuleront ici, partie après partie.'
export const TITRE_PERIODE_VIDE = 'Rien sur cette période'
export const descriptionPeriodeVide = (periode: string): string =>
  `Aucune partie de X01 ${periode}. Élargissez la fenêtre pour retrouver les précédentes.`

/** Un nombre entier, groupé à la française : « 2 846 » (espace fine insécable U+202F). */
export const nombre = (valeur: number): string => valeur.toLocaleString('fr-FR')

/** Le sous-titre : « 2 846 fléchettes lancées », « 1 fléchette lancée ». */
export const flechettesLancees = (total: number): string =>
  `${nombre(total)} ${total > 1 ? 'fléchettes lancées' : 'fléchette lancée'}`

/** Le nom accessible du sélecteur de joueurs : il ne pilote que la cible. */
export const LEGENDE_JOUEUR_CIBLE = 'Joueur de la cible'

/**
 * Une case du plateau, dans la rangée sous la cible : « S20 », « T19 », et la
 * bulle en toutes lettres (« Bulle 25 », « Bulle 50 »). `Dart.label` reste
 * intact (« 25 », « BULL ») : le résumé de partie l'emploie toujours.
 */
export const libelleZone = (dart: Dart): string =>
  dart.segment === 'BULL'
    ? `${LIBELLE_BULLE} ${dart.multiplier === 'DOUBLE' ? 50 : 25}`
    : Dart.label(dart)

/** « 160 fois » sous une case de la rangée. */
export const foisTouchee = (fois: number): string => `${nombre(fois)} fois`
export const LIBELLE_HORS_CIBLE = 'hors cible'

/** Les trois mesures de la carte Moyenne : le titre de la carte suit la bascule. */
export const MESURES_MOYENNE = ['MOYENNE', 'FIRST_9', 'VOLEE'] as const
export type MesureMoyenne = (typeof MESURES_MOYENNE)[number]

export const TITRE_CARTE_MOYENNE: Record<MesureMoyenne, string> = {
  // Abrégé (Q-A) : « Moyenne 3 fléchettes » était tronqué à 360 px à côté des bascules.
  MOYENNE: 'Moyenne 3 fl.',
  FIRST_9: 'First 9',
  VOLEE: 'Meilleure volée',
}

/**
 * Le nom accessible de la carte Moyenne et de son dialogue (QO-1) : le titre
 * visible **puis** le complet quand il est abrégé — « Moyenne 3 fl., Moyenne
 * 3 fléchettes », la même règle que les bascules (`nomBascule`).
 */
export const NOM_CARTE_MOYENNE: Record<MesureMoyenne, string> = {
  MOYENNE: 'Moyenne 3 fl., Moyenne 3 fléchettes',
  FIRST_9: 'First 9',
  VOLEE: 'Meilleure volée',
}

/**
 * ⚠️ Libellés de bascule **raccourcis** (arrêt Archi → Dev, U2) : titre et trois
 * bascules tiennent ainsi sur une seule ligne à 390 px. Le nom complet reste
 * dans le titre et dans le nom accessible de chaque bascule.
 */
export const BASCULE_MOYENNE: Record<
  MesureMoyenne,
  { readonly court: string; readonly complet: string }
> = {
  MOYENNE: { court: 'Moy.', complet: 'Moyenne' },
  FIRST_9: { court: 'F9', complet: 'First 9' },
  VOLEE: { court: 'Volée', complet: 'Meilleure volée' },
}

/**
 * Le nom accessible d'une bascule : le libellé court **puis** le complet
 * (« F9, First 9 »). Le court y figure mot pour mot (WCAG 2.5.3, « label in
 * name ») : la commande vocale « F9 » le trouve, le lecteur d'écran dit le sens.
 * Quand les deux se confondent (« 180 »), le court seul.
 */
export const nomBascule = (libelle: {
  readonly court: string
  readonly complet: string
}): string =>
  libelle.court === libelle.complet ? libelle.court : `${libelle.court}, ${libelle.complet}`

export const LEGENDE_BASCULE_MOYENNE = 'Classer la moyenne par'

export const TITRE_CARTE_VICTOIRES = 'Victoires'
export const TITRE_CARTE_GROSSES_VOLEES = 'Grosses volées'
export const TITRE_CARTE_FINITIONS = 'Finitions'

/** Les trois mesures de la carte Finitions. Le titre, lui, reste « Finitions ». */
export const MESURES_FINITIONS = ['DOUBLES', 'PLUS_HAUT', 'MANCHE'] as const
export type MesureFinitions = (typeof MESURES_FINITIONS)[number]

export const BASCULE_FINITIONS: Record<
  MesureFinitions,
  { readonly court: string; readonly complet: string }
> = {
  DOUBLES: { court: '% dbl', complet: '% doubles' },
  PLUS_HAUT: { court: 'Haut', complet: 'Plus haut finish' },
  MANCHE: { court: 'Manche', complet: 'Manche la plus courte' },
}

export const LEGENDE_BASCULE_FINITIONS = 'Classer les finitions par'

/** Les trois seuils des grosses volées : les rangées de chaque joueur, et la bascule. */
export const SEUILS_GROSSES_VOLEES = ['180', '140+', '100+'] as const
export type SeuilGrossesVolees = (typeof SEUILS_GROSSES_VOLEES)[number]

/** La bascule de Grosses volées (Révision 1) : le court et le complet se confondent. */
export const BASCULE_GROSSES_VOLEES: Record<
  SeuilGrossesVolees,
  { readonly court: string; readonly complet: string }
> = {
  '180': { court: '180', complet: '180' },
  '140+': { court: '140+', complet: '140+' },
  '100+': { court: '100+', complet: '100+' },
}

export const LEGENDE_BASCULE_GROSSES_VOLEES = 'Classer les grosses volées par'

/**
 * Le complément de Victoires : « / 16 », les parties jouées par **ce** joueur,
 * sur la grande ligne et sur chaque barre (Révision 1, R1-Q7).
 */
export const complementVictoires = (jouees: number): string => `/ ${nombre(jouees)}`

/** Le complément du grand chiffre de la bascule Manche : « 15 fl. » (U6). */
export const COMPLEMENT_MANCHE = 'fl.'

/** Le bouton sous une carte coupée à ses N premiers (Révision 1). */
export const LIBELLE_TOUT_VOIR = 'Tout voir'

/** Son nom accessible : « Tout voir, Victoires » — le libellé visible en tête (WCAG 2.5.3). */
export const nomToutVoir = (titre: string): string => `${LIBELLE_TOUT_VOIR}, ${titre}`

/** Le ✕ d'une modale. */
export const LIBELLE_FERMER = 'Fermer'

/** Le nom accessible de la colonne des bâtons, sur la ligne d'un joueur. */
export const etiquetteManchesGagnees = (nom: string, gagnees: number, requises: number): string =>
  `Manches gagnées par ${nom} : ${gagnees} sur ${requises}`

/* ------------------------------------------------------------------------
 * Nouvelle partie, en étapes : le jeu, puis joueurs et réglages, puis l'ordre.
 * ---------------------------------------------------------------------- */

export const TITRE_NOUVELLE_PARTIE = 'Nouvelle partie'
export const TITRE_ETAPE_ORDRE = 'Ordre de jeu'

/** La barre d'étapes : « 1 · JEU » (la capitale vient du style, pas du texte). */
export const LEGENDE_ETAPES = 'Étapes de la partie'
export const ETAPE_JEU = 'Jeu'
export const ETAPE_JOUEURS = 'Joueurs'
export const ETAPE_ORDRE = 'Ordre'
export const ETAPE_REGLAGES = 'Réglages'
export const libelleEtape = (numero: number, nom: string): string => `${numero} · ${nom}`
export const TITRE_JOUEURS_EXISTANTS = 'Joueurs existants'
export const SOUS_TITRE_JOUEURS_EXISTANTS = 'Cochez ceux qui jouent'

export const RETOUR_ACCUEIL = 'Retour à l’accueil'
export const RETOUR_ETAPE_PRECEDENTE = 'Étape précédente'

/** La phrase unique de chaque tuile de l'étape 1 (planche `np1`, mot pour mot). */
export const PHRASE_TUILE: Record<GameModeId, string> = {
  X01: 'Décompter 301, 501 ou 701 jusqu’à zéro pile.',
  CRICKET: 'Fermer du 20 au 15 et la bulle avant les autres.',
  TOUR_DU_MONDE: 'Du 20 au 1, puis la bulle.',
  CHECKOUT_PRACTICE: 'Seul : sortir un reste tiré au sort.',
}

export const LEGENDE_JOUEURS_PARTIE = 'Joueurs de la partie'
export const TITRE_PANNEAU_JOUEURS = 'Joueurs'
export const TITRE_QUI_S_ENTRAINE = 'Qui s’entraîne'
/** Le compteur de la rangée : « 2 / 4 ». */
export const compteurJoueurs = (n: number, max: number): string => `${n} / ${max}`
export const LIBELLE_AJOUTER_COURT = 'Ajouter'
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
export const LEGENDE_PLAGE_RESTES = 'Plage des restes'
export const LIBELLE_NON_REGLABLE = 'non réglable'
export const LEGENDE_SORTIE = 'Sortie'
export const LEGENDE_ENTREE = 'Entrée'

/** Sortie et entrée X01 : « Libre » ou « Sur un double » (double out / double in du code). */
export type ChoixEntreeSortie = 'LIBRE' | 'DOUBLE'
export const CHOIX_ENTREE_SORTIE: readonly ChoixEntreeSortie[] = ['LIBRE', 'DOUBLE']
export const LIBELLE_CHOIX_ENTREE_SORTIE: Record<ChoixEntreeSortie, string> = {
  LIBRE: 'Libre',
  DOUBLE: 'Sur un double',
}
export const LIBELLE_SANS_SETS = 'Sans'

/** L'effet de la sortie choisie, en une ligne (planche, puis l'aide actuelle du double out). */
export const AIDE_SORTIE: Record<ChoixEntreeSortie, string> = {
  LIBRE: 'Toute fléchette qui amène pile à zéro gagne la manche.',
  DOUBLE: 'Finir obligatoirement sur un double',
}

/** L'effet du nombre de sorties, à l'entraînement. */
export const aideSorties = (sorties: number): string =>
  `${sorties} restes à sortir, une volée chacun.`

/* La fiche de réglages : le pli « Plus de réglages » et « Les règles en entier ». */
export const LIBELLE_PLUS_DE_REGLAGES = 'Plus de réglages · sortie, entrée, sets'
export const LIBELLE_REGLES_EN_ENTIER = 'Les règles en entier'
export const LEGENDE_RECAP_REGLAGES = 'Réglages choisis'
export const TITRE_FICHE_REGLAGES = 'Réglages du jeu'
export const LEGENDE_CIBLES_CRICKET = 'Les sept cibles'
export const LEGENDE_PARCOURS = 'Le parcours en 21 cases'

/** Cricket : les deux cartes de comptage (planche `reglages-jeux`, mot pour mot). */
export const CARTES_CRICKET: Record<
  'STANDARD' | 'CUT_THROAT',
  { readonly points: readonly Segment[]; readonly gagne: string }
> = {
  STANDARD: {
    points: ['Les points sont pour ', { fort: 'soi' }, '.'],
    gagne: 'Tout fermer, sans être derrière',
  },
  CUT_THROAT: {
    points: ['Les points vont aux ', { fort: 'adversaires' }, '.'],
    gagne: 'Tout fermer, le plus petit score',
  },
}

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

/**
 * Les règles X01 « en entier » de la fiche, tirées de `CLAUDE.md` § Règles du
 * jeu X01. ⚠️ Aucun paragraphe X01 n'existait avant ce lot : le texte reste à
 * valider (lot `regles-du-jeu` pour la version complète).
 */
export const PARAGRAPHE_X01: readonly Segment[] = [
  'On décompte le score de départ jusqu’à ',
  { fort: 'zéro pile' },
  '. Une volée qui passe sous zéro est annulée (bust) : le score revient à sa valeur d’avant la volée. ',
  'Avec la sortie sur un double, il faut finir sur un ',
  { fort: 'double' },
  ' (la bulle à 50 compte) et un reste de 1 est impossible ; avec l’entrée sur un double, le score ne décompte qu’à partir du premier double.',
]

/** La ligne de règles de chaque fiche (planche `reglages-jeux`, mot pour mot). */
export const REGLE_X01: readonly Segment[] = [
  'Décompter jusqu’à ',
  { fort: 'zéro pile' },
  ' ; trop haut, la volée est annulée (bust).',
]
export const regleCricket = (cutThroat: boolean): readonly Segment[] => [
  'Gagne celui qui a ',
  { fort: 'tout fermé' },
  cutThroat ? ' avec le plus petit score.' : ' sans être derrière au score.',
]
export const REGLE_TOUR_DU_MONDE: readonly Segment[] = [
  'Simple, double ou triple : ',
  { fort: 'peu importe' },
  '. Quand quelqu’un boucle, ',
  { fort: 'on finit le tour de table' },
  ' ; le moins de fléchettes gagne.',
]
export const REGLE_ENTRAINEMENT: readonly Segment[] = [
  'Trois fléchettes pour sortir le reste ',
  { fort: 'sur un double' },
  ' ; jamais de reste impossible.',
]

/**
 * L'en-tête de la fiche : le réglage principal en grand, le reste en dessous.
 * Mis à jour à chaque appui ; le X01 dit **toujours** sortie, entrée et sets.
 */
export type RecapReglages = { readonly principal: string; readonly secondaire: string }

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
}): RecapReglages => ({
  principal: `${score} · ${libelleLegs(legs)}`,
  secondaire: [
    doubleOut ? 'Sortie sur un double' : 'Sortie libre',
    doubleIn ? 'Entrée sur un double' : 'Entrée libre',
    sets <= 1 ? 'Sans sets' : `Premier à ${sets} sets`,
  ].join(' · '),
})

export const recapCricket = (variante: 'STANDARD' | 'CUT_THROAT'): RecapReglages => ({
  principal: `Cricket ${LIBELLE_VARIANTE_CRICKET[variante].toLowerCase()}`,
  secondaire: '7 cibles · 20 à 15 et la bulle',
})

export const RECAP_TOUR_DU_MONDE: RecapReglages = {
  principal: '20 → 1, puis la bulle',
  secondaire: '21 cibles · rien à régler',
}

export const recapEntrainementFiche = (
  sorties: number,
  min: number,
  max: number,
): RecapReglages => ({
  principal: pluriel(sorties, 'sortie'),
  secondaire: `Restes tirés entre ${min} et ${max}`,
})

export const recapEntrainement = (sorties: number, min: number, max: number): string =>
  `${pluriel(sorties, 'sortie')} · ${min} à ${max}`

/* Étape 3 — l'ordre de jeu. */
export const LEGENDE_ORDRE = 'Ordre de passage'
export const AIDE_POIGNEE = 'Glissez, ou flèches haut et bas'
export const deplacerJoueur = (nom: string): string => `Déplacer ${nom}`
export const annonceOrdre = (nom: string, position: number, total: number): string =>
  `${nom} : position ${position} sur ${total}`
export const LIBELLE_COMMENCE = 'Commence'
export const LIBELLE_TIRER_AU_SORT = 'Tirer au sort'
/** Dite à voix haute après un tirage : le nouvel ordre, et qui commence. */
export const annonceTirage = (noms: readonly string[]): string =>
  `Ordre tiré au sort : ${noms.join(', ')}. ${noms[0] ?? ''} commence.`

/** Le sous-titre de l'étape Ordre : le jeu et son réglage principal. */
export const sousTitreOrdre = (
  mode: GameModeId,
  reglages: { readonly score: number; readonly variante: 'STANDARD' | 'CUT_THROAT' },
): string => {
  switch (mode) {
    case 'X01':
      return `${LIBELLE_MODE.X01} · ${reglages.score}`
    case 'CRICKET':
      return `${LIBELLE_MODE.CRICKET} · ${LIBELLE_VARIANTE_CRICKET[reglages.variante]}`
    case 'TOUR_DU_MONDE':
    case 'CHECKOUT_PRACTICE':
      return LIBELLE_MODE[mode]
    default: {
      const jamais: never = mode
      return jamais
    }
  }
}

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
