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
export const DATE_MISE_A_JOUR_CONFIDENTIALITE = 'Mise à jour le 10 octobre 2026'

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
      'Vos profils (pseudo, couleur, date de création) et vos parties (chaque fléchette saisie, avec ses dates) sont enregistrés dans la base de données du navigateur (IndexedDB), sur ce téléphone seulement.',
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
 * sait pas encore » — un leg en cours n'est ni gagné ni perdu, et un joueur
 * qui n'a jamais eu de double à jouer n'a pas raté ses sorties, il n'en a
 * simplement pas eu. Sert aux trois pourcentages de l'app : matchs, legs,
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
  legsToWin === 1 ? '1 leg' : `premier à ${legsToWin} legs`

/**
 * La même chose pour le bandeau de match, où chaque caractère compte : le mot
 * « leg » y est déjà posé juste avant par le numéro de leg en cours.
 */
export const libelleLegsCourt = (legsToWin: number): string =>
  legsToWin === 1 ? '1 leg' : `premier à ${legsToWin}`

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
