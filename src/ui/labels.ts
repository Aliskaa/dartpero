import type { Annonce, Langue, SegmentAnnonce } from '@/core/application/ports/driven/Announcer'
import type { StorageProtection } from '@/core/application/ports/driven/PersistentStorage'
import type { StatsPeriod } from '@/core/application/ports/driving/GetPlayerStats'
import type { ReplayableConfiguration } from '@/core/application/ports/driving/GetReplayableConfigurations'
import type { VisitOutcome } from '@/core/domain/entities/Visit'
import type { GameModeId } from '@/core/domain/games'
import { Dart } from '@/core/domain/value-objects/Dart'
import { LEGS, SCORES, SETS, SORTIES } from '@/ui/reglagesPossibles'
import type { Theme } from '@/ui/theme'
import type { DureeSauvegarde, EtatGuideInstallation } from '@/ui/voyants'

/** Le cœur reste en anglais ; tout le français de l'app vit ici. */
export const LIBELLE_ISSUE: Record<VisitOutcome, string> = {
  SCORED: 'Volée enregistrée',
  BUSTED: 'Bust !',
  CHECKOUT: 'Checkout !',
}

/**
 * La langue de base de la voix : un seul endroit à changer le jour de l'i18n.
 * Les mots de darts (« bust », « checkout ») se disent en en-US quelle que soit
 * la langue de base.
 */
export const LANGUE_DE_BASE: Langue = 'fr-FR'

/** Un segment de la langue de base. */
export const fr = (texte: string): SegmentAnnonce => ({ texte, langue: LANGUE_DE_BASE })

/** Un segment dit en en-US (vocabulaire de darts). */
export const en = (texte: string): SegmentAnnonce => ({ texte, langue: 'en-US' })

/**
 * Ce que la voix annonce à la fin d'une volée.
 *
 * ⚠️ Les nombres partent **en chiffres** (« 140 »), pas en lettres : la
 * synthèse vocale française les prononce correctement toute seule, et écrire
 * « cent quarante » ferait buter les voix qui lisent lettre à lettre.
 *
 * C'est ici, et nulle part ailleurs, que se décide ce qui est dit et dans
 * quelle langue — le port `Announcer` ne reçoit que des segments déjà écrits.
 */
export const annonceVolee = (scored: number, outcome: VisitOutcome): Annonce => {
  if (outcome === 'BUSTED') return [en('Bust')]
  if (outcome === 'CHECKOUT') return [en('Checkout')]
  return [fr(String(scored))]
}

export const annonceIssue = (outcome: VisitOutcome): Annonce =>
  outcome === 'CHECKOUT' ? [en('Checkout')] : outcome === 'BUSTED' ? [en('Bust')] : [fr('Raté')]

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
 *
 * `phrase` (lot `phrases-victoire`) : la phrase de victoire, dite **après** le
 * résultat dans le même énoncé (« Checkout. Le tableau a parlé. »). Facultative,
 * donc les appels existants ne changent pas.
 */
export const annonceFinDeVolee = (
  resultat: Annonce | null,
  prochain: string | null,
  phrase?: string,
): Annonce => {
  let annonce: Annonce = resultat ?? []
  // Le point reste dans le segment de la langue de base, jamais dans l'anglais.
  if (prochain !== null) {
    annonce =
      resultat === null
        ? [fr(annonceTour(prochain))]
        : [...resultat, fr(`. ${annonceTour(prochain)}`)]
  }
  if (phrase === undefined) return annonce
  return annonce.length === 0 ? [fr(phrase)] : [...annonce, fr(`. ${phrase}`)]
}

/**
 * Ce que le bouton d'annulation va **vraiment** défaire.
 *
 * ⚠️ Deux formes, et c'est volontaire. Une touche de pavé fait une demi-largeur
 * d'écran : « Annuler T20 de Julien » n'y tient pas toujours. Le `court` s'affiche,
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
 * Un appui, une fléchette (lot `annulation-volee`) : la touche nomme toujours
 * la fléchette qu'elle va retirer — celle du joueur en train de jouer, ou la
 * dernière de la volée enregistrée juste avant, qui se rouvre.
 *
 * Le court (« Annuler S5 ») tient sur la touche ; le complet ajoute le joueur
 * (« Annuler S5 de Kevin ») : à trois autour d'un téléphone, le lecteur
 * d'écran doit savoir à qui l'on reprend la fléchette. Le joueur absent (ou
 * rien à retirer) : le libellé neutre, touche grisée.
 */
export const libelleAnnulation = (flechette: string | null, joueur: string | null): Annulation => {
  if (flechette === null) return ANNULATION_NEUTRE
  const court = `Annuler ${flechette}`
  return { court, complet: joueur === null ? court : `${court} de ${joueur}` }
}

/** Les deux boutons de la boîte de confirmation de la sortie (forme B). */
export const LIBELLE_CORRIGER = 'Corriger'
export const LIBELLE_VALIDER_SORTIE = 'Valider la sortie'

/** X01, à chaque manche : « Kevin sort sur D10 ? » (planche `annulation`). */
export const titreConfirmationX01 = (joueur: string, flechette: string): string =>
  `${joueur} sort sur ${flechette} ?`

/** « 40 → 0. La manche est gagnée dès que vous validez. » — le reste d'avant la volée. */
export const texteConfirmationX01 = (resteAvant: number): string =>
  `${resteAvant} → 0. La manche est gagnée dès que vous validez.`

/**
 * Cricket, à la fléchette qui gagne la partie : « Kevin gagne sur T20 ? ». En
 * cut-throat, le nom est celui du **gagnant**, qui n'est pas toujours le lanceur.
 */
export const titreConfirmationCricket = (gagnant: string, flechette: string): string =>
  `${gagnant} gagne sur ${flechette} ?`

export const TEXTE_CONFIRMATION_CRICKET = 'La partie est gagnée dès que vous validez.'

/** Tour du monde, à la fléchette qui boucle : la partie, elle, continue. */
export const titreConfirmationTourDuMonde = (joueur: string, flechette: string): string =>
  `${joueur} boucle le parcours sur ${flechette} ?`

export const TEXTE_CONFIRMATION_TOUR_DU_MONDE =
  'La partie continue jusqu’à la fin du tour de table.'

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
}): Annonce | null => {
  if (gagnee) return [fr('Partie gagnée !')]
  if (points > 0) return [fr(cutThroat ? `${points} pour les autres` : String(points))]
  if (fermees > 0) return [fr(fermees > 1 ? `${fermees} cibles fermées` : 'Cible fermée')]
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

/*
 * Les Réglages (lot `reglages-par-usage`, planche `derniers.html` `#rg4`) : une
 * page rangée par usage, deux voyants en tête.
 */
export const TITRE_REGLAGES = 'Réglages'

/** Les deux voyants. L'étiquette nomme aussi la valeur (`<output aria-label>`). */
/** Abrégé (Q-d, choix de l'utilisateur) : « Dernière sauvegarde » (planche) passait sur deux lignes à 125 % de police à 360 px. */
export const ETIQUETTE_VOYANT_SAUVEGARDE = 'Dernier export'
export const ETIQUETTE_VOYANT_APPLICATION = 'Application'
export const ACTION_EXPORTER = 'Exporter'
/** Nom accessible de l'action « Exporter » du voyant : il contient le texte visible. */
export const NOM_ACTION_EXPORTER = 'Exporter une sauvegarde'
export const VALEUR_INSTALLEE = 'Installée'
export const VALEUR_PAS_INSTALLEE = 'Pas installée'
export const ACTION_COMMENT_INSTALLER = 'Comment ?'
/** Nom accessible de « Comment ? » : le texte visible, puis ce qu'il explique (WCAG 2.5.3). */
export const NOM_ACTION_COMMENT_INSTALLER = 'Comment ? Installer Dartpéro'

/**
 * Depuis quand le dernier export a eu lieu (`vueVoyantSauvegarde`, `voyants.ts`).
 * « Il y a N jours » de 2 à 59, puis « Il y a N mois » (N ≥ 2).
 */
export const libelleDureeSauvegarde = (duree: DureeSauvegarde): string => {
  switch (duree.type) {
    case 'jamais':
      return 'Jamais'
    case 'aujourdhui':
      return 'Aujourd’hui'
    case 'hier':
      return 'Hier'
    case 'jours':
      return `Il y a ${duree.nombre} jours`
    case 'mois':
      return `Il y a ${duree.nombre} mois`
    default: {
      const jamais: never = duree
      return jamais
    }
  }
}

/** La ligne sous les voyants : toutes les parties enregistrées, entraînements compris. */
export const ETIQUETTE_CONTENU_APPAREIL = 'Contenu de ce téléphone'
export const contenuAppareil = (parties: number, joueurs: number): string =>
  `${pluriel(parties, 'partie')} · ${pluriel(joueurs, 'joueur')} sur ce téléphone.`

/** Les trois groupes de la page. */
export const TITRE_GROUPE_AFFICHAGE = 'Affichage'
export const TITRE_GROUPE_SAUVEGARDE = 'Sauvegarde'
export const TITRE_GROUPE_JOUEURS_APPLI = 'Joueurs et appli'

/** Le nom du groupe des trois vignettes. */
export const ETIQUETTE_CHOIX_THEME = 'Thème'

export const TITRE_ANNONCER_VOLEES = 'Annoncer les volées'
export const AIDE_ANNONCER_VOLEES = 'Score, bust et checkouts, à voix haute'
export const TITRE_ESSAYER_VOIX = 'Essayer la voix'
/** Ce que dit la voix à l'essai : le score que tout le monde reconnaît. */
export const PHRASE_ESSAI_VOIX = 'Cent quatre-vingts'

/** Le duo du groupe Sauvegarde. */
export const LIBELLE_EXPORTER = 'Exporter'
export const LIBELLE_RESTAURER = 'Restaurer'
export const ETIQUETTE_FICHIER_SAUVEGARDE = 'Fichier de sauvegarde'

/**
 * La phrase d'état de la protection du stockage, sous Exporter / Restaurer.
 * Le rappel d'exporter ouvre chaque état : même protégée, la base disparaît
 * avec la désinstallation de la PWA, l'effacement des données du site ou la
 * perte du téléphone. Ce n'est jamais une sauvegarde.
 */
const RAPPEL_EXPORT = 'Tout vit sur ce téléphone : exportez pour garder une copie.'
export const PHRASE_PROTECTION_STOCKAGE: Record<StorageProtection, string> = {
  persisted: `${RAPPEL_EXPORT} Le navigateur s’est engagé à ne pas effacer les données de lui-même.`,
  'not-persisted': `${RAPPEL_EXPORT} Le navigateur peut effacer les données si l’espace manque.`,
  unavailable: `${RAPPEL_EXPORT} Ce navigateur ne sait pas protéger les données.`,
}

/** Retour d'une demande faite par l'utilisateur et refusée (jamais au démarrage). */
export const REFUS_PROTECTION_STOCKAGE =
  'Le navigateur a refusé. Il accepte en général une fois Dartpéro installé (voir Application, en haut).'
/** Le même refus, Dartpéro déjà installé : le renvoi n'aurait plus de sens. */
export const REFUS_PROTECTION_STOCKAGE_INSTALLEE = 'Le navigateur a refusé.'

export const ETIQUETTE_PROTECTION_STOCKAGE = 'Protection des données'
export const LIBELLE_DEMANDER_PROTECTION = 'Demander la protection'

/** L'explication de la restauration, en petit, sous la phrase de protection. */
export const EXPLICATION_RESTAURATION: readonly Segment[] = [
  'La restauration ',
  { fort: 'complète' },
  ' la base : les profils et parties du fichier s’ajoutent, et ceux déjà présents (même identifiant) sont remplacés par la version du fichier. Le reste n’est pas touché.',
]

export const ERREUR_EXPORT = 'La sauvegarde n’a pas pu être créée.'
export const ERREUR_JSON_ILLISIBLE = 'Ce fichier n’est pas un JSON lisible.'
export const ERREUR_RESTAURATION = 'Cette sauvegarde n’a pas pu être restaurée.'

/** Le résumé d'une restauration réussie. */
export const TITRE_RESUME_IMPORT = 'Sauvegarde restaurée'
export const resumeImport = (joueurs: number, parties: number): string =>
  `${pluriel(joueurs, 'joueur')} et ${pluriel(parties, 'partie')} importés.`
export const entreesIgnorees = (nombre: number): string =>
  `${pluriel(nombre, 'entrée illisible', 'entrées illisibles')} — ignorée${nombre > 1 ? 's' : ''}.`

/** Les lignes du groupe Joueurs et appli. */
export const LIEN_GERER_JOUEURS = 'Gérer les joueurs'
export const AIDE_GERER_JOUEURS = 'Renommer, couleur, supprimer'

/** Le pied de page. */
export const PIED_REGLAGES = '100 % local, hors ligne, sans compte.'

/** La ligne discrète de l'Accueil. Jamais sur un écran de partie. */
export const TITRE_INVITATION_INSTALLATION = 'Installer Dartpéro'
export const TEXTE_INVITATION_INSTALLATION =
  'Plein écran, une icône sur l’écran d’accueil, et des données mieux protégées.'
export const LIBELLE_INSTALLER = 'Installer'
export const LIBELLE_PLUS_TARD = 'Plus tard'

/** Nom accessible de l'action « Installer » du voyant : il contient le texte visible. */
export const LIBELLE_INSTALLER_DARTPERO = 'Installer Dartpéro'
/** Le guide `#installer`, sous la ligne de contenu des Réglages. */
export const ETIQUETTE_INSTALLATION = 'Installation'
export const PRESENTATION_DARTPERO =
  'Dartpéro — compteur de fléchettes : X01, Tour du monde, Cricket et entraînement au checkout.'

/**
 * La phrase du guide `#installer`, dans les trois états où il est rendu
 * (`guideInstallationVisible`) : « Installée » et « Installer » sont portés par
 * le voyant Application.
 */
export const ETAT_INSTALLATION: Record<EtatGuideInstallation, string> = {
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

/** La ligne-lien de Réglages → Joueurs et appli. */
export const LIEN_CONFIDENTIALITE = 'Confidentialité et mentions légales'

export const TITRE_CONFIDENTIALITE = 'Confidentialité'
export const SOUS_TITRE_CONFIDENTIALITE = 'Politique et mentions légales'

/** Chaîne française littérale : jamais recalculée depuis une date ISO. */
export const DATE_MISE_A_JOUR_CONFIDENTIALITE = 'Mise à jour le 17 octobre 2026'

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
      'Les préférences de l’appareil vont dans le stockage local du navigateur (localStorage) : le thème, l’annonce vocale, les réglages de la dernière partie, les derniers joueurs choisis (leurs identifiants internes), le dernier joueur consulté dans Statistiques (son identifiant interne), le « Plus tard » de l’invitation à installer et la date du dernier export. Au démarrage, une valeur de test y est écrite puis effacée aussitôt.',
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
      'L’annonce vocale lit les scores et le pseudo du joueur suivant avec une voix fournie par le navigateur. Selon le navigateur, cette voix peut être synthétisée en ligne par son fournisseur, qui reçoit alors le texte annoncé, pseudos compris. Pour l’éviter, coupez « Annoncer les volées » dans Réglages → Affichage.',
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
 * joueur qui n'a jamais eu de double à jouer n'a pas raté ses checkouts, il n'en
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
  `${pluriel(sorties, 'checkout')} · ${min} à ${max}`

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
  CHECKOUT_PRACTICE: 'checkouts',
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

export const libelleEtatEntrainement = (sortieEnCours: number): string =>
  `Checkout ${sortieEnCours}`

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

/** Entraînement sans checkout joué : « Kevin, aucun checkout joué ». */
export const parleAucuneSortie = (): string => ', aucun checkout joué'

export const parleSorties = (reussies: number, jouees: number): string =>
  `${pluriel(reussies, 'checkout réussi', 'checkouts réussis')} sur ${jouees}`

/** Une partie finie sans vainqueur, dite en tête de phrase (« Match nul, Julien 48 fléchettes ; … »). */
export const parleSansVainqueur = (mode: GameModeId): string =>
  mode === 'TOUR_DU_MONDE' ? LIBELLE_MATCH_NUL : LIBELLE_TERMINEE

export const parleGagne = (nom: string, valeur: string | null): string =>
  valeur === null ? libelleGagne(nom) : `${libelleGagne(nom)}, ${valeur}`

/** Une valeur qui s'ouvre sur une virgule (« , aucun checkout joué ») se colle au nom. */
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

/**
 * Une moyenne par partie, à une décimale fixe et à la virgule : « 2,6 », « 0,0 ».
 * ⚠️ Aucune partie jouée : « 0,0 », jamais une division par zéro (`NaN`, `Infinity`).
 */
export const moyenneParPartie = (total: number, parties: number): string =>
  (parties > 0 ? total / parties : 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

/**
 * La ligne « Hors cible par partie » de la cible d'un joueur, en trois morceaux
 * (planche `hors`) : le libellé, la moyenne, la base (« sur 16 parties »).
 */
export const horsCibleParPartie = (
  missed: number,
  parties: number,
): { readonly libelle: string; readonly moyenne: string; readonly base: string } => ({
  libelle: 'Hors cible par partie',
  moyenne: moyenneParPartie(missed, parties),
  base: `sur ${nombre(parties)} ${parties > 1 ? 'parties' : 'partie'}`,
})

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

/** Le ✕ d'une modale ou de la feuille de règles. */
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
  CHECKOUT_PRACTICE: 'Seul : faire le checkout d’un reste tiré au sort.',
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

/* ------------------------------------------------------------------------
 * Rejouer : la section de l'étape 1 (lot `rejouer`).
 * ---------------------------------------------------------------------- */

export const TITRE_REJOUER = 'Rejouer'
export const TITRE_AUTRE_JEU = 'Ou un autre jeu'
/** Le nom accessible de la liste des configurations. */
export const LEGENDE_REJOUER = 'Rejouer une partie récente'

/** « Kevin », « Kevin et Julien », « Kevin, Julien et Sarah ». */
const listeDeNoms = (noms: readonly string[]): string =>
  noms.length <= 1 ? (noms[0] ?? '') : `${noms.slice(0, -1).join(', ')} et ${noms.at(-1)}`

/** Le titre d'une ligne : « X01 · 501 », « Cricket · Cut-throat », « Tour du monde », « Entraînement ». */
export const titreRejouer = (configuration: ReplayableConfiguration): string => {
  switch (configuration.mode) {
    case 'X01':
      return `${LIBELLE_MODE.X01} · ${configuration.config.startingScore}`
    case 'CRICKET':
      return `${LIBELLE_MODE.CRICKET} · ${LIBELLE_VARIANTE_CRICKET[configuration.config.variant]}`
    case 'TOUR_DU_MONDE':
      return LIBELLE_MODE.TOUR_DU_MONDE
    case 'CHECKOUT_PRACTICE':
      return LIBELLE_MODE.CHECKOUT_PRACTICE
  }
}

/**
 * La date de la dernière fois, courte et **sans heure** : « aujourd'hui », « hier »,
 * le jour (« mardi ») jusqu'à 6 jours, puis « 3 oct. » (« 3 oct. 2025 » si l'année
 * diffère de celle de `maintenant`). Les jours se comptent sur le **calendrier
 * local**, jamais en divisant des heures : un jour de changement d'heure dure 23
 * ou 25 h. `Date` ne sert que de calendrier : l'heure courante vient de `services.clock`.
 */
export const libelleDateRelative = (horodatage: number, maintenant: number): string => {
  const jour = (instant: number): number => {
    const date = new Date(instant)
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  }
  const ecart = Math.round((jour(maintenant) - jour(horodatage)) / 86_400_000)
  if (ecart <= 0) return 'aujourd’hui'
  if (ecart === 1) return 'hier'
  if (ecart <= 6) return (JOURS[new Date(horodatage).getDay()] ?? '').toLowerCase()
  if (new Date(horodatage).getFullYear() !== new Date(maintenant).getFullYear()) {
    return dateCourte(horodatage)
  }
  return new Date(horodatage).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** « 4 fois » : masqué à 1 (la ligne n'a alors rien à compter). */
export const libelleNFois = (nombre: number): string | null =>
  nombre > 1 ? `${nombre} fois` : null

/**
 * La ligne de réglages : le vocabulaire de l'étape 2, puis la date, puis « N fois ».
 * « premier à 2 manches · checkout libre · hier · 4 fois ».
 */
export const resumeRejouer = (
  configuration: ReplayableConfiguration,
  maintenant: number,
): string => {
  const reglages: readonly (string | null)[] = (() => {
    switch (configuration.mode) {
      case 'X01': {
        const { legsToWin, setsToWin, doubleOut, doubleIn } = configuration.config
        return [
          libelleFormat(legsToWin, setsToWin),
          doubleOut ? 'checkout sur un double' : 'checkout libre',
          doubleIn ? 'entrée sur un double' : null,
        ]
      }
      case 'CRICKET':
        return [pluriel(configuration.config.targets.length, 'cible')]
      case 'TOUR_DU_MONDE':
        return ['20 → 1, puis la bulle']
      case 'CHECKOUT_PRACTICE':
        return [pluriel(configuration.config.rounds, 'checkout')]
    }
  })()
  return [
    ...reglages,
    libelleDateRelative(configuration.lastPlayedAt, maintenant),
    libelleNFois(configuration.count),
  ]
    .filter((morceau): morceau is string => morceau !== null)
    .join(' · ')
}

/**
 * Le nom accessible de ▶ : le jeu et **tous** les pseudos en entier (les pastilles
 * n'ont que des initiales). « Rejouer X01 501 avec Kevin, Julien et Sarah » à deux
 * joueurs ou plus (▶ mène à l'ordre) ; « Lancer Entraînement 10 checkouts avec Kevin »
 * en solo (▶ lance la partie).
 */
export const ariaRejouer = (
  configuration: ReplayableConfiguration,
  noms: readonly string[],
): string => {
  const jeu = (() => {
    switch (configuration.mode) {
      case 'X01':
        return `${LIBELLE_MODE.X01} ${configuration.config.startingScore}`
      case 'CRICKET':
        return `${LIBELLE_MODE.CRICKET} ${LIBELLE_VARIANTE_CRICKET[configuration.config.variant]}`
      case 'TOUR_DU_MONDE':
        return LIBELLE_MODE.TOUR_DU_MONDE
      case 'CHECKOUT_PRACTICE':
        return `${LIBELLE_MODE.CHECKOUT_PRACTICE} ${pluriel(configuration.config.rounds, 'checkout')}`
    }
  })()
  const verbe = configuration.playerIds.length === 1 ? 'Lancer' : 'Rejouer'
  return `${verbe} ${jeu} avec ${listeDeNoms(noms)}`
}

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
export const LEGENDE_NOMBRE_SORTIES = 'Nombre de checkouts'
export const LEGENDE_PLAGE_RESTES = 'Plage des restes'
export const LIBELLE_NON_REGLABLE = 'non réglable'
export const LEGENDE_SORTIE = 'Checkout'
export const LEGENDE_ENTREE = 'Entrée'

/** Checkout et entrée X01 : « Libre » ou « Sur un double » (double out / double in du code). */
export type ChoixEntreeSortie = 'LIBRE' | 'DOUBLE'
export const CHOIX_ENTREE_SORTIE: readonly ChoixEntreeSortie[] = ['LIBRE', 'DOUBLE']
export const LIBELLE_CHOIX_ENTREE_SORTIE: Record<ChoixEntreeSortie, string> = {
  LIBRE: 'Libre',
  DOUBLE: 'Sur un double',
}
/** Les boutons de la légende « Checkout » se nomment en entier (lecteur d'écran compris). */
export const LIBELLE_CHOIX_SORTIE: Record<ChoixEntreeSortie, string> = {
  LIBRE: 'Checkout libre',
  DOUBLE: 'Checkout sur un double',
}
export const LIBELLE_SANS_SETS = 'Sans'

/** L'effet du checkout choisi, en une ligne (planche, puis l'aide actuelle du double out). */
export const AIDE_SORTIE: Record<ChoixEntreeSortie, string> = {
  LIBRE: 'Toute fléchette qui amène pile à zéro gagne la manche.',
  DOUBLE: 'Finir obligatoirement sur un double',
}

/** L'effet du nombre de checkouts, à l'entraînement. */
export const aideSorties = (sorties: number): string =>
  `${sorties} checkouts à faire, une volée chacun.`

/* La fiche de réglages : le pli « Plus de réglages ». Les règles complètes vivent
   dans la feuille de règles (lot `regles-du-jeu`), plus dans la fiche. */
export const LIBELLE_PLUS_DE_REGLAGES = 'Plus de réglages · checkout, entrée, sets'
export const LEGENDE_RECAP_REGLAGES = 'Réglages choisis'
export const TITRE_FICHE_REGLAGES = 'Réglages du jeu'

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
      ? 'Une seule manche par set : le premier qui fait le checkout gagne le set.'
      : 'Une seule manche : le premier qui fait le checkout gagne la partie.'
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
  'Trois fléchettes pour faire le checkout du reste ',
  { fort: 'sur un double' },
  ' ; jamais de reste impossible.',
]

/**
 * L'en-tête de la fiche : le réglage principal en grand, le reste en dessous.
 * Mis à jour à chaque appui ; le X01 dit **toujours** checkout, entrée et sets.
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
    doubleOut ? 'Checkout sur un double' : 'Checkout libre',
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
  principal: pluriel(sorties, 'checkout'),
  secondaire: `Restes tirés entre ${min} et ${max}`,
})

export const recapEntrainement = (sorties: number, min: number, max: number): string =>
  `${pluriel(sorties, 'checkout')} · ${min} à ${max}`

/* ------------------------------------------------------------------------
 * La feuille de règles (lot `regles-du-jeu`) : le livre ouvert de l'étape 2 et
 * du bandeau de match.
 *
 * Le texte dit les règles **que Dartpéro applique**, et suit les réglages de
 * la partie : la règle de ce soir en entier, l'autre réglage en gris.
 * X01 et Cricket : mot pour mot la planche `regles-rubriques.html`, sauf trois
 * phrases X01 corrigées d'après le code (bust compté en fléchettes lancées,
 * First 9 sur trois volées, volée de 3 fléchettes « au plus »). Tour du monde,
 * entraînement, et les variantes non dessinées (checkout et entrée sur un double,
 * sets, premier à 1 manche, cut-throat) : même plan, écrits d'après
 * `CLAUDE.md` et le code.
 *
 * ⚠️ Un lot qui change une règle met à jour sa rubrique ici, dans le même lot.
 * Des primitives seulement : `reglesDuJeu.ts` ouvre la configuration.
 * ---------------------------------------------------------------------- */

export const TITRE_REGLES: Record<GameModeId, string> = {
  X01: 'Règles du X01',
  CRICKET: 'Règles du Cricket',
  TOUR_DU_MONDE: 'Règles du Tour du monde',
  CHECKOUT_PRACTICE: 'Règles de l’entraînement',
}
export const SOUS_TITRE_REGLES = 'Telles que Dartpéro les applique'
export const LIBELLE_CE_SOIR = 'Ce soir'
export const LIBELLE_EN_BREF = 'En bref'
/** Le reste sans checkout en 3 fléchettes : l'écran X01 et la feuille de règles disent le même mot. */
export const LIBELLE_PAS_DE_FINISH = 'Pas de finish'

export const RUBRIQUE_MARQUER = 'Marquer'
export const RUBRIQUE_GAGNER = 'Gagner'
export const RUBRIQUE_CAS_PARTICULIERS = 'Cas particuliers'
export const RUBRIQUE_SORTIES = 'Les checkouts'
export const RUBRIQUE_EXEMPLE = 'Un exemple'
export const RUBRIQUE_QUESTIONS = 'Questions fréquentes'
export const RUBRIQUE_COMPTE = 'Ce que l’app compte'
export const RUBRIQUE_REGLAGES = 'Les réglages possibles'
/** Le nom accessible de la grille du parcours, dans « Marquer » du Tour du monde. */
export const legendeParcours = (cibles: number): string =>
  `Le parcours en ${pluriel(cibles, 'case')}`

/** Une ligne de liste ; `autre` = la règle d'un autre réglage, en gris. */
export type LigneRegle = { readonly segments: readonly Segment[]; readonly autre?: boolean }

/** Une case du tableau d'exemple : un chiffre, un bust (rouge), un succès (vert), ou du texte. */
export type CelluleExemple = {
  readonly segments: readonly Segment[]
  readonly ton?: 'chiffre' | 'bust' | 'ok'
}

export type QuestionRegle = { readonly question: string; readonly reponse: readonly Segment[] }

/** Une valeur proposée à l'étape 2 ; `ceSoir` la met en laiton. `suite` ne l'est jamais. */
export type OptionReglage = {
  readonly libelle: string
  readonly ceSoir: boolean
  readonly suite?: string
}

export type ReglagePossible = { readonly terme: string; readonly options: readonly OptionReglage[] }

export type BlocRegles =
  | { readonly type: 'liste'; readonly lignes: readonly LigneRegle[] }
  | { readonly type: 'paragraphe'; readonly segments: readonly Segment[]; readonly autre?: boolean }
  | { readonly type: 'pastilles'; readonly nombres: readonly number[]; readonly autre?: boolean }
  | {
      readonly type: 'exemple'
      readonly colonnes: readonly string[]
      readonly lignes: readonly (readonly CelluleExemple[])[]
    }
  | { readonly type: 'questions'; readonly questions: readonly QuestionRegle[] }
  | { readonly type: 'reglages'; readonly reglages: readonly ReglagePossible[] }
  | {
      readonly type: 'parcours'
      readonly legende: string
      readonly cibles: readonly (number | 'BULL')[]
    }

export type RubriqueRegles = { readonly titre: string; readonly blocs: readonly BlocRegles[] }

export type ContenuRegles = {
  readonly titre: string
  /** Le même texte que le récapitulatif de la fiche, sur une ligne. */
  readonly ceSoir: string
  readonly enBref: readonly Segment[]
  /** Numérotées à partir de 2 : « En bref » est la 1. */
  readonly rubriques: readonly RubriqueRegles[]
}

/** Jusqu'où l'app propose un checkout, et les restes sans finish en dessous. */
export type PlageSorties = { readonly max: number; readonly sansFinish: readonly number[] }

const fort = (texte: string): Segment => ({ fort: texte })
const ligne = (...segments: Segment[]): LigneRegle => ({ segments })
const ligneSi = (autre: boolean, ...segments: Segment[]): LigneRegle => ({ segments, autre })
const liste = (...lignes: LigneRegle[]): BlocRegles => ({ type: 'liste', lignes })
const paragraphe = (...segments: Segment[]): BlocRegles => ({ type: 'paragraphe', segments })
const paragrapheGris = (...segments: Segment[]): BlocRegles => ({
  type: 'paragraphe',
  segments,
  autre: true,
})
const question = (q: string, ...reponse: Segment[]): QuestionRegle => ({ question: q, reponse })
const chiffre = (texte: string): CelluleExemple => ({ segments: [texte], ton: 'chiffre' })
const texte = (...segments: Segment[]): CelluleExemple => ({ segments })
/**
 * Les valeurs d'un réglage, celle de ce soir marquée. Comparée par égalité
 * stricte : une vieille partie hors de la liste n'en marque aucune.
 */
const options = <T>(
  valeurs: readonly T[],
  courante: unknown,
  libelle: (valeur: T, rang: number) => string,
): readonly OptionReglage[] =>
  valeurs.map((valeur, rang) => ({ libelle: libelle(valeur, rang), ceSoir: valeur === courante }))

const REGLAGES_FIGES =
  'Ce soir en laiton. Les réglages se choisissent à l’étape 2 et ne changent plus en cours de partie.'

const manches = (n: number): string => pluriel(n, 'manche')

export const reglesX01 = ({
  score,
  legs,
  sets,
  doubleOut,
  doubleIn,
  sorties,
}: {
  readonly score: number
  readonly legs: number
  readonly sets: number
  readonly doubleOut: boolean
  readonly doubleIn: boolean
  readonly sorties: { readonly surUnDouble: PlageSorties; readonly libre: PlageSorties }
}): ContenuRegles => {
  const recap = recapX01({ score, legs, sets, doubleOut, doubleIn })
  const avecSets = sets > 1
  const deCeSoir = doubleOut ? sorties.surUnDouble : sorties.libre
  const autre = doubleOut ? sorties.libre : sorties.surUnDouble

  return {
    titre: TITRE_REGLES.X01,
    ceSoir: `${recap.principal} · ${recap.secondaire.toLowerCase()}`,
    enBref: doubleOut
      ? [
          'Chacun part de ',
          fort(String(score)),
          ' et retire ses points. Le premier qui arrive ',
          fort('pile à zéro'),
          ' sur un ',
          fort('double'),
          ' gagne la manche.',
        ]
      : [
          'Chacun part de ',
          fort(String(score)),
          ' et retire ses points. Le premier qui arrive ',
          fort('pile à zéro'),
          ' gagne la manche.',
        ],
    rubriques: [
      {
        titre: RUBRIQUE_MARQUER,
        blocs: [
          liste(
            ligne('Une volée, c’est ', fort('3 fléchettes'), ' au plus.'),
            ligne(
              'Simple, double ou triple du secteur touché. La bulle vaut ',
              fort('25'),
              ', le centre ',
              fort('50'),
              '.',
            ),
            ligne(fort('Pas de triple sur la bulle.'), ' Une fléchette hors cible vaut 0.'),
          ),
        ],
      },
      {
        titre: RUBRIQUE_GAGNER,
        blocs: [
          liste(
            avecSets
              ? ligne(
                  'Le premier à ',
                  fort(manches(legs)),
                  ' gagne le set, et le premier à ',
                  fort(`${sets} sets`),
                  ' gagne la partie.',
                )
              : ligne('Le premier à ', fort(manches(legs)), ' gagne la partie.'),
            ligne('Celui qui commence ', fort('change à chaque manche'), '.'),
            ...(legs > 1
              ? [
                  ligne(
                    `À 3 ou 4 joueurs, on joue jusqu’à ce que quelqu’un ait gagné ${legs} manches : ${
                      avecSets ? 'un set' : 'la partie'
                    } peut en durer plus de ${2 * legs - 1}.`,
                  ),
                ]
              : []),
            avecSets
              ? ligneSi(true, `Sans sets, la partie se gagne au premier à ${manches(legs)}.`)
              : ligneSi(
                  true,
                  'Avec des sets, un set se gagne au premier à N manches, et la partie au premier à S sets.',
                ),
          ),
        ],
      },
      {
        titre: RUBRIQUE_CAS_PARTICULIERS,
        blocs: [
          liste(
            ligne(
              fort('Bust'),
              ' : si la volée fait passer sous zéro, elle est annulée et le score revient à sa valeur d’avant la volée. C’est au suivant.',
            ),
            ligneSi(
              doubleOut,
              'Checkout libre : n’importe quelle fléchette qui amène ',
              fort('pile à zéro'),
              ' gagne.',
            ),
            ligneSi(
              !doubleOut,
              'Checkout sur un double : il faut finir sur un ',
              fort('double'),
              ' (le centre à 50 compte). Un reste de 1, ou un zéro sans double, est aussi un bust.',
            ),
            ligneSi(
              !doubleIn,
              'Entrée sur un double : le score ne décompte qu’à partir du premier ',
              fort('double'),
              '.',
            ),
          ),
        ],
      },
      {
        titre: RUBRIQUE_SORTIES,
        blocs: [
          paragraphe(
            'Ce soir, l’app propose un checkout dès qu’il reste ',
            fort(`${deCeSoir.max} ou moins`),
            doubleOut ? ' (T20 · T20 · centre)' : '',
            `. Ces restes n’ont pas de checkout en 3 fléchettes, l’app affiche « ${LIBELLE_PAS_DE_FINISH} » :`,
          ),
          { type: 'pastilles', nombres: deCeSoir.sansFinish },
          doubleOut
            ? paragrapheGris(
                'Checkout libre : ',
                fort(String(autre.max)),
                ' au plus (T20 · T20 · T20), et pas de checkout pour :',
              )
            : paragrapheGris(
                'Checkout sur un double : ',
                fort(String(autre.max)),
                ' au plus (T20 · T20 · centre), et pas de checkout pour :',
              ),
          { type: 'pastilles', nombres: autre.sansFinish, autre: true },
        ],
      },
      {
        titre: RUBRIQUE_EXEMPLE,
        blocs: [
          paragraphe('Il reste ', fort('40'), ' à Kevin.'),
          {
            type: 'exemple',
            colonnes: ['Fléchette', 'Touche', 'Reste'],
            lignes: [
              [texte('1'), chiffre('20'), chiffre('20')],
              [texte('2'), chiffre('15'), chiffre('5')],
              [
                texte('3'),
                chiffre('10'),
                { segments: ['Sous zéro : ', fort('bust'), ', retour à 40'], ton: 'bust' },
              ],
            ],
          },
          doubleOut
            ? paragraphe(
                'Kevin repart de 40 à sa prochaine volée. Sur un double, même une troisième fléchette à 5 aurait fait bust : le zéro doit tomber sur un double.',
              )
            : paragraphe(
                'Kevin repart de 40 à sa prochaine volée. Avec une troisième fléchette à 5, il aurait gagné la manche.',
              ),
        ],
      },
      {
        titre: RUBRIQUE_QUESTIONS,
        blocs: [
          {
            type: 'questions',
            questions: [
              question(
                'Les fléchettes d’un bust comptent-elles ?',
                'Pour le score, non : toute la volée est annulée. Pour la moyenne, oui : les fléchettes lancées comptent, avec 0 point.',
              ),
              question(
                'Peut-on finir sur la bulle ?',
                'Oui. En checkout sur un double, seul le centre à 50 finit : il compte comme un double.',
              ),
              question(
                'Pourquoi l’app ne propose rien à 169 ?',
                `Aucune volée de 3 fléchettes ne fait 169 avec les règles de ce soir. Plutôt qu’une suggestion fausse, l’app affiche « ${LIBELLE_PAS_DE_FINISH} ».`,
              ),
              question(
                'Le checkout proposé est-il celui des pros ?',
                'C’est toujours une route qui marche, mais elle peut différer des tables professionnelles.',
              ),
              question(
                'Qui commence la manche suivante ?',
                'Le joueur suivant dans l’ordre : celui qui commence change à chaque manche.',
              ),
            ],
          },
        ],
      },
      {
        titre: RUBRIQUE_COMPTE,
        blocs: [
          liste(
            ligne(
              fort('Moyenne 3 fléchettes'),
              ' : points marqués ÷ fléchettes lancées × 3. Un bust marque 0 point, mais ses fléchettes comptent.',
            ),
            ligne(
              fort('First 9'),
              ' : la même moyenne, sur les 3 premières volées de chaque manche.',
            ),
            ligne(
              fort('% doubles'),
              ' : doubles de checkout réussis ÷ tentatives. Compté seulement en checkout sur un double.',
            ),
            ligne(fort('Grosses volées'), ' : 180, 140 et plus, 100 et plus, 60 et plus.'),
            ligne(
              fort('Meilleure manche'),
              ' : le moins de fléchettes pour finir une manche. ',
              fort('Plus haut checkout'),
              ' : la plus grosse volée qui a fini une manche.',
            ),
          ),
        ],
      },
      {
        titre: RUBRIQUE_REGLAGES,
        blocs: [
          {
            type: 'reglages',
            reglages: [
              { terme: 'Départ', options: options(SCORES, score, String) },
              {
                terme: 'Manches',
                options: options(LEGS, legs, (n, rang) => (rang === 0 ? `Premier à ${n}` : `${n}`)),
              },
              {
                terme: 'Sets',
                options: options(SETS, sets, (n, rang) =>
                  n === 1 ? LIBELLE_SANS_SETS : rang === 1 ? `premier à ${n}` : `${n}`,
                ),
              },
              {
                terme: LEGENDE_SORTIE,
                options: options([false, true], doubleOut, (d) => (d ? 'sur un double' : 'Libre')),
              },
              {
                terme: LEGENDE_ENTREE,
                options: options([false, true], doubleIn, (d) => (d ? 'sur un double' : 'Libre')),
              },
            ],
          },
          paragrapheGris(REGLAGES_FIGES),
        ],
      },
    ],
  }
}

type CibleRegle = number | 'BULL' | 'MISS'

/** « 20, 19, 18, 17, 16, 15 et la bulle ». */
const listeDesCibles = (cibles: readonly CibleRegle[]): string => {
  const mots = cibles.map((cible) => (cible === 'BULL' ? 'la bulle' : String(cible)))
  return mots.length <= 1
    ? (mots[0] ?? '')
    : `${mots.slice(0, -1).join(', ')} et ${mots.at(-1) ?? ''}`
}

/** « 20 à 15 et la bulle » quand les cibles se suivent, sinon la liste entière. */
const plageDesCibles = (cibles: readonly CibleRegle[]): string => {
  const nombres = cibles.filter((cible): cible is number => typeof cible === 'number')
  const finitSurLaBulle = cibles.at(-1) === 'BULL' && nombres.length === cibles.length - 1
  const suivies = nombres.every((n, rang) => rang === 0 || n === (nombres[rang - 1] ?? 0) - 1)
  return finitSurLaBulle && suivies && nombres.length > 1
    ? `${nombres[0]} à ${nombres.at(-1)} et la bulle`
    : listeDesCibles(cibles)
}

const enLettres = (n: number): string => (n === 7 ? 'sept' : String(n))

export const reglesCricket = ({
  variante,
  cibles,
}: {
  readonly variante: 'STANDARD' | 'CUT_THROAT'
  readonly cibles: readonly CibleRegle[]
}): ContenuRegles => {
  const ct = variante === 'CUT_THROAT'
  const n = enLettres(cibles.length)

  return {
    titre: TITRE_REGLES.CRICKET,
    ceSoir: `${sousTitreBandeauCricket(variante, cibles.length)} · ${plageDesCibles(cibles)}`,
    enBref: ct
      ? [
          'Fermez les ',
          fort(`${n} cibles`),
          ' avant les autres, ',
          fort('sans être devant'),
          ' au score : le ',
          fort('plus petit'),
          ' score gagne.',
        ]
      : [
          'Fermez les ',
          fort(`${n} cibles`),
          ' avant les autres, ',
          fort('sans être derrière'),
          ' au score.',
        ],
    rubriques: [
      {
        titre: RUBRIQUE_MARQUER,
        blocs: [
          liste(
            ligne('Les cibles : ', fort(listeDesCibles(cibles)), '.'),
            ligne(
              'Simple = ',
              fort('1 marque'),
              ', double = 2, triple = 3. La bulle à 25 vaut 1 marque, le centre à 50 en vaut 2.',
            ),
            ligne(
              fort('Trois marques ferment'),
              ' une cible. Elles peuvent venir de plusieurs volées.',
            ),
            ct
              ? ligne(
                  'Au-delà, chaque marque donne la valeur de la cible (25 pour la bulle) à ',
                  fort('chaque adversaire'),
                  ' qui ne l’a pas fermée.',
                )
              : ligne(
                  'Au-delà, chaque marque rapporte la valeur de la cible (25 pour la bulle), ',
                  fort('seulement si un adversaire au moins'),
                  ' ne l’a pas fermée.',
                ),
            ligne(`Une fléchette hors des ${n} cibles ne vaut `, fort('rien'), '.'),
          ),
        ],
      },
      {
        titre: RUBRIQUE_GAGNER,
        blocs: [
          liste(
            ligneSi(
              ct,
              'Gagne le premier qui a ',
              fort('tout fermé'),
              ' avec un score ',
              fort('au moins égal'),
              ' à celui de chaque adversaire.',
            ),
            ligne(
              'Une seule partie, sans manches. Dès qu’un joueur gagne, la partie s’arrête : on ne finit pas le tour de table.',
            ),
            ct
              ? ligne(
                  'En cut-throat, les points vont ',
                  fort('aux adversaires'),
                  ' qui n’ont pas fermé la cible : gagne le premier qui a ',
                  fort('tout fermé'),
                  ' avec un score ',
                  fort('au plus égal'),
                  ' à celui de chaque adversaire.',
                )
              : ligneSi(
                  true,
                  'En cut-throat, les points vont ',
                  fort('aux adversaires'),
                  ' qui n’ont pas fermé la cible, et le ',
                  fort('plus petit'),
                  ' score gagne.',
                ),
          ),
        ],
      },
      {
        titre: RUBRIQUE_CAS_PARTICULIERS,
        blocs: [
          liste(
            ligne('Une cible fermée par ', fort('tout le monde'), ' ne rapporte plus rien.'),
            ligne(
              fort('Pas de bust'),
              ' : une volée ne fait jamais reculer. Elle fait toujours 3 fléchettes, sauf celle qui gagne.',
            ),
          ),
        ],
      },
      {
        titre: RUBRIQUE_EXEMPLE,
        blocs: [
          paragraphe('À deux joueurs. Kevin a fermé le 20, Julien a 1 marque dessus.'),
          {
            type: 'exemple',
            colonnes: ['Qui', 'Touche', 'Effet'],
            lignes: [
              [
                texte('Kevin'),
                chiffre('T20'),
                {
                  segments: [
                    '3 marques en trop : ',
                    fort('+60'),
                    ct ? ' pour Julien' : ' pour Kevin',
                  ],
                  // En cut-throat, les points punissent l'adversaire : en rouge (DV4).
                  ton: ct ? 'bust' : 'ok',
                },
              ],
              [texte('Julien'), chiffre('D20'), texte('1 + 2 = 3 marques : Julien ferme le 20')],
              [texte('Kevin'), chiffre('20'), texte('Le 20 est fermé partout : 0 point')],
            ],
          },
        ],
      },
      {
        titre: RUBRIQUE_QUESTIONS,
        blocs: [
          {
            type: 'questions',
            questions: [
              question(
                'Une fléchette peut-elle fermer et marquer ?',
                ct
                  ? 'Oui. Avec 2 marques sur le 19, un triple 19 ferme (1 marque) et les 2 autres donnent 38 points à chaque adversaire qui n’a pas fermé le 19.'
                  : 'Oui. Avec 2 marques sur le 19, un triple 19 ferme (1 marque) et les 2 autres rapportent 38 points, si un adversaire n’a pas fermé le 19.',
              ),
              ct
                ? question(
                    'J’ai tout fermé mais j’ai plus de points : j’ai gagné ?',
                    'Non. Continuez à marquer sur les cibles encore ouvertes chez les adversaires : les points vont chez eux, jusqu’à ce qu’ils vous rattrapent.',
                  )
                : question(
                    'J’ai tout fermé mais je suis mené : j’ai gagné ?',
                    'Non. Continuez à marquer sur les cibles encore ouvertes chez l’adversaire, jusqu’à le rattraper.',
                  ),
              question(
                'Et à égalité de points ?',
                ct
                  ? 'Celui qui ferme tout à égalité gagne : il suffit de ne pas être devant.'
                  : 'Celui qui ferme tout à égalité gagne : il suffit de ne pas être derrière.',
              ),
              question('Le 12 compte ?', `Non. Hors des ${n} cibles, une fléchette ne vaut rien.`),
              question(
                'Peut-on fermer la bulle d’une fléchette ?',
                'Non : le centre vaut 2 marques au plus, et il n’y a pas de triple sur la bulle.',
              ),
            ],
          },
        ],
      },
      {
        titre: RUBRIQUE_COMPTE,
        blocs: [
          liste(
            ligne(
              'Le Cricket ',
              fort('n’entre pas'),
              ' dans les statistiques : moyennes, doubles et grosses volées ne valent qu’au X01.',
            ),
            ligne('La partie reste dans l’historique, avec son classement de fin de partie.'),
          ),
        ],
      },
      {
        titre: RUBRIQUE_REGLAGES,
        blocs: [
          {
            type: 'reglages',
            reglages: [
              {
                terme: LEGENDE_COMPTAGE,
                options: [
                  {
                    libelle: LIBELLE_VARIANTE_CRICKET.STANDARD,
                    ceSoir: !ct,
                    suite: ' : les points sont pour soi',
                  },
                  {
                    libelle: LIBELLE_VARIANTE_CRICKET.CUT_THROAT,
                    ceSoir: ct,
                    suite: ' : les points vont aux adversaires',
                  },
                ],
              },
              {
                terme: 'Cibles',
                options: [
                  { libelle: `Les ${n}, toujours : elles ne se règlent pas`, ceSoir: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  }
}

const sansMiss = (cibles: readonly CibleRegle[]): readonly (number | 'BULL')[] =>
  cibles.filter((cible): cible is number | 'BULL' => cible !== 'MISS')

/** Une cible du parcours en mots : « 20 », « la bulle », « hors cible ». */
const motCible = (cible: CibleRegle): string =>
  cible === 'BULL' ? 'la bulle' : cible === 'MISS' ? LIBELLE_HORS_CIBLE : String(cible)

/**
 * Le parcours descend-il de 1 en 1, sur deux nombres au moins, en finissant
 * peut-être sur la bulle (la forme du parcours du domaine) ? Sinon `null` :
 * un parcours importé arbitraire, qu'on ne décrit qu'en liste.
 */
const parcoursDescendant = (
  cibles: readonly CibleRegle[],
): { readonly premier: number; readonly dernier: number; readonly bulle: boolean } | null => {
  const bulle = cibles.at(-1) === 'BULL'
  const nombres = bulle ? cibles.slice(0, -1) : cibles
  const descend =
    nombres.length >= 2 &&
    nombres.every(
      (cible, rang) =>
        typeof cible === 'number' && (rang === 0 || cible === Number(nombres[rang - 1]) - 1),
    )
  if (!descend) return null
  return { premier: Number(nombres[0]), dernier: Number(nombres.at(-1)), bulle }
}

/**
 * « 20 → 1, puis la bulle » pour la forme du domaine ; sinon la première et la
 * dernière cible (« 20 → 19 »), ou la cible seule (« la bulle »).
 */
const parcoursEnMots = (cibles: readonly CibleRegle[]): string => {
  const descendant = parcoursDescendant(cibles)
  if (descendant) {
    const { premier, dernier, bulle } = descendant
    return bulle ? `${premier} → ${dernier}, puis la bulle` : `${premier} → ${dernier}`
  }
  const premiere = cibles[0]
  const derniere = cibles.at(-1)
  if (premiere === undefined || derniere === undefined) return ''
  return cibles.length === 1 ? motCible(premiere) : `${motCible(premiere)} → ${motCible(derniere)}`
}

/**
 * « En bref » du Tour du monde, lu dans le parcours de la partie (constat C9) :
 * le parcours du domaine donne la phrase de la planche mot pour mot. Tout autre
 * parcours (sauvegarde importée) se dit en liste neutre, sans verbe de
 * direction, cibles « hors cible » comprises — jamais une phrase fausse,
 * jamais une erreur (P3-7, tranché par l'utilisateur).
 */
const enBrefTourDuMonde = (cibles: readonly CibleRegle[]): readonly Segment[] => {
  const fin: readonly Segment[] = [
    '. Celui qui boucle le tour avec le ',
    fort('moins de fléchettes'),
    ' gagne.',
  ]
  const descendant = parcoursDescendant(cibles)
  if (descendant) {
    return [
      'On part du ',
      fort(String(descendant.premier)),
      ', on descend jusqu’au ',
      fort(String(descendant.dernier)),
      ...(descendant.bulle ? [', puis on finit sur la ', fort('bulle')] : []),
      ...fin,
    ]
  }
  const mots = cibles.map(motCible)
  const liste =
    mots.length <= 1 ? (mots[0] ?? '') : `${mots.slice(0, -1).join(', ')} et ${mots.at(-1) ?? ''}`
  return ['Le parcours de cette partie : ', fort(liste), ...fin]
}

export const reglesTourDuMonde = ({
  cibles,
}: {
  readonly cibles: readonly CibleRegle[]
}): ContenuRegles => ({
  titre: TITRE_REGLES.TOUR_DU_MONDE,
  ceSoir: `${parcoursEnMots(cibles)} · ${pluriel(cibles.length, 'cible')} · rien à régler`,
  enBref: enBrefTourDuMonde(cibles),
  rubriques: [
    {
      titre: RUBRIQUE_MARQUER,
      blocs: [
        liste(
          ligne('Toucher le secteur suffit : simple, double ou triple, ', fort('peu importe'), '.'),
          ligne(
            'La bulle se valide aussi bien à ',
            fort('25'),
            ' qu’au centre à ',
            fort('50'),
            '. Une fléchette hors cible ne vaut jamais.',
          ),
          ligne(
            'Une volée, c’est ',
            fort('3 fléchettes'),
            ' au plus, et l’on avance à ',
            fort('chaque touche'),
            ' : on peut valider trois cibles dans la même volée.',
          ),
        ),
        {
          type: 'parcours',
          legende: legendeParcours(sansMiss(cibles).length),
          cibles: sansMiss(cibles),
        },
      ],
    },
    {
      titre: RUBRIQUE_GAGNER,
      blocs: [
        liste(
          ligne(
            'Quand un joueur boucle, ',
            fort('on finit le tour de table'),
            ' : les autres jouent leur volée, pour que tout le monde ait joué le même nombre de volées.',
          ),
          ligne(
            'Parmi ceux qui ont bouclé, gagne celui qui y a mis le ',
            fort('moins de fléchettes'),
            '.',
          ),
          ligne(
            'À égalité parfaite, ',
            fort('match nul'),
            ' : on ne départage ni au hasard ni à l’ordre de passage.',
          ),
        ),
      ],
    },
    {
      titre: RUBRIQUE_CAS_PARTICULIERS,
      blocs: [
        liste(
          ligne(
            'La volée s’arrête sur la fléchette qui ',
            fort('boucle le tour'),
            ' : les suivantes ne comptent pas.',
          ),
          ligne('Ni bust, ni manche, ni set : la partie tient en ', fort('un seul parcours'), '.'),
          ligne(
            `Dès que quelqu’un a bouclé, le bandeau affiche « ${LIBELLE_DERNIER_TOUR} » jusqu’à la fin du tour de table.`,
          ),
        ),
      ],
    },
    {
      titre: RUBRIQUE_EXEMPLE,
      blocs: [
        paragraphe('Sarah vise le ', fort('18'), '.'),
        {
          type: 'exemple',
          colonnes: ['Fléchette', 'Touche', 'Ensuite'],
          lignes: [
            [texte('1'), chiffre('D18'), { segments: ['18 validé : au ', fort('17')], ton: 'ok' }],
            [texte('2'), chiffre('3'), texte('Raté : toujours le 17')],
            [texte('3'), chiffre('T17'), { segments: ['17 validé : au ', fort('16')], ton: 'ok' }],
          ],
        },
        paragraphe('Deux cibles validées dans la volée : Sarah repart du 16 à la prochaine.'),
      ],
    },
    {
      titre: RUBRIQUE_QUESTIONS,
      blocs: [
        {
          type: 'questions',
          questions: [
            question(
              'Un double fait-il avancer de deux cibles ?',
              'Non. Simple, double ou triple : une touche valide une cible, et une seule.',
            ),
            question(
              'Et à égalité ?',
              'Si les meilleurs ont bouclé avec le même nombre de fléchettes, la partie est un match nul.',
            ),
            question(
              'Quand la partie s’arrête-t-elle ?',
              'À la fin du tour de table où quelqu’un a bouclé : chacun a alors joué le même nombre de volées.',
            ),
          ],
        },
      ],
    },
    {
      titre: RUBRIQUE_COMPTE,
      blocs: [
        liste(
          ligne(
            'Les ',
            fort('cibles validées'),
            ' et les ',
            fort('fléchettes lancées'),
            ' de chaque joueur.',
          ),
          ligne(
            'Le Tour du monde ',
            fort('n’entre pas'),
            ' dans les statistiques : moyennes, doubles et grosses volées ne valent qu’au X01.',
          ),
          ligne('La partie reste dans l’historique, avec son classement de fin de partie.'),
        ),
      ],
    },
    {
      titre: RUBRIQUE_REGLAGES,
      blocs: [
        {
          type: 'reglages',
          reglages: [
            {
              terme: LIBELLE_PARCOURS,
              options: [
                {
                  libelle: `${parcoursEnMots(cibles)}, toujours : il ne se règle pas`,
                  ceSoir: false,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})

export const reglesEntrainement = ({
  sorties,
  min,
  max,
}: {
  readonly sorties: number
  readonly min: number
  readonly max: number
}): ContenuRegles => {
  const recap = recapEntrainementFiche(sorties, min, max)
  return {
    titre: TITRE_REGLES.CHECKOUT_PRACTICE,
    ceSoir: `${recap.principal} · ${recap.secondaire.toLowerCase()}`,
    enBref: [
      'Un reste est tiré au sort entre ',
      fort(`${min} et ${max}`),
      '. Vous avez une volée de ',
      fort('3 fléchettes'),
      ' pour faire le checkout, sur un ',
      fort('double'),
      '.',
    ],
    rubriques: [
      {
        titre: RUBRIQUE_MARQUER,
        blocs: [
          liste(
            ligne(
              'Les fléchettes comptent comme au X01 : simple, double ou triple du secteur. La bulle vaut ',
              fort('25'),
              ', le centre ',
              fort('50'),
              ', et il n’y a pas de triple sur la bulle.',
            ),
            ligne(
              'Chaque reste se joue en ',
              fort('une seule volée'),
              ', de 3 fléchettes au plus.',
            ),
          ),
        ],
      },
      {
        titre: RUBRIQUE_GAGNER,
        blocs: [
          liste(
            ligne(
              'Un checkout est ',
              fort('réussi'),
              ' quand la volée amène le reste ',
              fort('pile à zéro'),
              ', sur un double.',
            ),
            ligne(
              `La séance compte ${pluriel(sorties, 'checkout')} à faire ; elle se termine après le dernier.`,
            ),
            ligne(
              'Le résultat : le ',
              fort('taux de réussite'),
              ', checkouts réussis ÷ checkouts joués.',
            ),
          ),
        ],
      },
      {
        titre: RUBRIQUE_CAS_PARTICULIERS,
        blocs: [
          liste(
            ligne(
              fort('Toujours sur un double'),
              ' : le checkout libre ne s’applique pas à l’entraînement.',
            ),
            ligne(
              fort('Bust'),
              ' : passer sous zéro, laisser 1, ou arriver à zéro sans double rate le checkout.',
            ),
            ligne('Trois fléchettes sans finir : le checkout est raté, on passe au reste suivant.'),
            ligne(
              'Les restes ',
              fort('sans checkout possible'),
              ' en 3 fléchettes (les bogey numbers) ne sont jamais tirés.',
            ),
          ),
        ],
      },
      {
        titre: RUBRIQUE_EXEMPLE,
        blocs: [
          paragraphe('Il reste ', fort('81'), '.'),
          {
            type: 'exemple',
            colonnes: ['Fléchette', 'Touche', 'Reste'],
            lignes: [
              [texte('1'), chiffre('T19'), chiffre('24')],
              [
                texte('2'),
                chiffre('D12'),
                { segments: ['Zéro sur un double : ', fort('checkout réussi')], ton: 'ok' },
              ],
            ],
          },
          paragraphe('La volée s’arrête sur la fléchette qui fait le checkout.'),
        ],
      },
      {
        titre: RUBRIQUE_QUESTIONS,
        blocs: [
          {
            type: 'questions',
            questions: [
              question(
                'Peut-on tomber sur un reste impossible ?',
                'Non : seuls les restes qui se finissent en 3 fléchettes sur un double sont tirés.',
              ),
              question(
                'A-t-on une seconde chance sur un reste raté ?',
                'Non : une volée par reste. Réussi ou raté, on passe au suivant.',
              ),
              question(
                'Annuler change-t-il le reste ?',
                'Non : le reste tiré est écrit dans la partie. Annuler une volée redonne le même reste.',
              ),
            ],
          },
        ],
      },
      {
        titre: RUBRIQUE_COMPTE,
        blocs: [
          liste(
            ligne(
              'Le ',
              fort('taux de réussite'),
              ', et les checkouts réussis sur les checkouts joués.',
            ),
            ligne(
              'Pendant la volée, une ',
              fort('route conseillée'),
              ', recalculée à chaque fléchette.',
            ),
            ligne(
              'L’entraînement ',
              fort('n’entre pas'),
              ' dans les statistiques : moyennes, doubles et grosses volées ne valent qu’au X01.',
            ),
          ),
        ],
      },
      {
        titre: RUBRIQUE_REGLAGES,
        blocs: [
          {
            type: 'reglages',
            reglages: [
              { terme: 'Checkouts', options: options(SORTIES, sorties, String) },
              {
                terme: 'Restes',
                options: [
                  {
                    libelle: `Entre ${min} et ${max}, toujours : la plage ne se règle pas`,
                    ceSoir: false,
                  },
                ],
              },
              {
                terme: LEGENDE_SORTIE,
                options: [{ libelle: 'Sur un double, toujours', ceSoir: false }],
              },
            ],
          },
          paragrapheGris(REGLAGES_FIGES),
        ],
      },
    ],
  }
}

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

/**
 * Phrases d'ambiance de la victoire — le côté apéro. Affichée sur les résumés
 * **et** dite par la voix après *Valider la sortie* (lot `phrases-victoire`) :
 * les deux tirent par `phraseVictoire(identifiant de la partie)`, donc la même.
 */
export const PHRASE_VICTOIRE = [
  'Ça se fête autour de la cible.',
  'Une tournée pour le vainqueur.',
  'Le tableau a parlé.',
  'Bien joué — on remet ça ?',
  'Le vainqueur offre la prochaine tournée.',
  'La cible a rendu son verdict.',
  'Une victoire qui mérite un petit verre.',
  'Pas mal pour un soir de semaine.',
  'Les fléchettes ont encore frappé.',
] as const

export const phraseVictoire = (graine: string): string => {
  let hash = 0
  for (let i = 0; i < graine.length; i += 1) hash = (hash * 31 + graine.charCodeAt(i)) | 0
  const index = Math.abs(hash) % PHRASE_VICTOIRE.length
  return PHRASE_VICTOIRE[index] ?? PHRASE_VICTOIRE[0]
}
