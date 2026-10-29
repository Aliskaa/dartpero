# Lot `ecran-miroir` — texte proposé pour `/confidentialite` (Q17)

> **Proposition, pas encore écrite dans `src/ui/labels.ts`.** À relire et valider par l'utilisateur avant l'étape 6.
> Chaque phrase est un engagement public (Play Console) : elle doit rester vraie au regard du code. Repères de
> vérification entre crochets, hors texte publié.

Date proposée : **« Mise à jour le 24 octobre 2026 »** (à ajuster au jour de la livraison).

## Section « Politique de confidentialité » — 3ᵉ paragraphe remplacé

> Trois cas font sortir quelque chose du téléphone ; ils sont décrits plus bas. Deux ne dépendent pas de l’éditeur :
> l’hébergeur, qui reçoit les requêtes quand il sert les fichiers de l’application, et la voix de l’annonce vocale
> qui, selon votre navigateur, peut être synthétisée en ligne. Le troisième ne dépend que de vous : l’écran miroir,
> qui relie deux téléphones, et seulement si vous l’ouvrez. Le fichier d’export, lui, n’est envoyé nulle part par
> Dartpéro.

(Le 2ᵉ paragraphe, « l’éditeur ne collecte aucune donnée… ni serveur ni compte… », reste vrai : le miroir n'a pas de serveur.)

## Section « Sur votre appareil » — paragraphe ajouté

> L’écran miroir n’ajoute rien à ce stockage : ni la partie reçue, ni le jumelage ne sont enregistrés sur l’appareil
> qui sert de miroir.

[Vérifié par la conception : `WatchMatch` n'a aucun repository ; aucune clé de préférence ; pas de `sessionStorage`.]

## Section « Fonctions du téléphone » — 1ᵉʳ paragraphe remplacé

> Pendant une partie, Dartpéro garde l’écran allumé et peut faire vibrer le téléphone (pas sur iPhone). Un téléphone
> qui sert de miroir garde aussi son écran allumé, sans voix ni vibration. La caméra ne s’ouvre que lorsque vous
> touchez « Scanner le code » ou « Scanner la réponse » dans l’écran miroir, pour lire un code QR : l’image n’est ni
> enregistrée, ni envoyée, et la caméra se referme dès que le code est lu ou que vous quittez l’écran. Dartpéro
> n’utilise jamais le micro, la localisation, les contacts ni les notifications.

## Nouvelle section « Écran miroir » (entre « Fonctions du téléphone » et « Hébergement »)

> L’écran miroir montre la partie en cours en grand sur un second téléphone. Il ne s’ouvre jamais de lui-même : il
> faut choisir « Partager la partie » sur un téléphone et « Servir de miroir » sur l’autre, puis scanner deux codes QR.
>
> Les deux téléphones se parlent directement, sur le même réseau local (Wi-Fi ou partage de connexion), par une
> liaison chiffrée de type WebRTC. Aucun serveur n’y participe, pas même celui de l’éditeur : Dartpéro n’utilise ni
> serveur de signalisation ni serveur de relais, et rien ne passe par Internet.
>
> Chaque code QR contient les identifiants temporaires de cette liaison et les adresses réseau locales du téléphone
> qui l’affiche (celles de votre Wi-Fi ou de votre partage de connexion, jamais une adresse publique). Il ne sert
> qu’à ce jumelage : ne le montrez qu’à l’appareil que vous voulez relier.
>
> Le miroir reçoit la partie partagée : son nom s’il y en a un, les pseudos et les couleurs des joueurs, chaque
> fléchette saisie et la volée en cours. Au Killer, il reçoit aussi le genre choisi pour chaque profil, qui sert
> seulement à accorder « éliminé / éliminée ». Rien de tout cela n’est enregistré par le miroir : si vous le
> rechargez, vous refaites le jumelage. Ces messages ne sont ni exportés, ni envoyés à l’éditeur.
>
> Le partage s’arrête quand vous touchez « Arrêter le partage », quand vous fermez l’application ou quand le réseau
> est coupé.

[Vérifications : `iceServers: []` (aucun STUN/TURN, `reseauBoundary`) ; filtre de localité du jeton (RFC 1918, ULA,
lien local, `.local` ; les IPv6 globales sont écartées, mesuré) ; `MirrorPlayer` = `id`, `name`, `color`, `gender`
seulement pour une ouverture `KillerStarted` (`mirrorProtocol.ts:95-98`) ; message `arret` à `stop()`.]

## Section « Hébergement » — ligne ajoutée à la fin

> L’écran miroir, lui, n’a besoin que du réseau local.

## Points à contrôler en dehors du dépôt

- **Formulaire « Sécurité des données » de la Play Console** : la caméra y est probablement à déclarer comme
  utilisée sans collecte ; à vérifier par l'utilisateur au prochain dépôt de l'application.
- `CLAUDE.md` (décision « pas de réseau ») est regravé à l'étape 7 : la politique et lui doivent dire la même chose.
