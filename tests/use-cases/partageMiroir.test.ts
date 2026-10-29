import { describe, expect, it } from 'vitest'
import type { Dependencies, Services } from '@/composition/container'
import type { MirrorView } from '@/core/application/ports/driving/WatchMatch'
import { MirrorProtocol } from '@/core/application/use-cases/mirrorProtocol'
import { type AnyMatchState, GAME_MODE_IDS, type GameModeId, GameModes } from '@/core/domain/games'
import { Dart } from '@/core/domain/value-objects/Dart'
import type { MatchId, PlayerId } from '@/core/domain/value-objects/ids'
import { InMemoryPlayerRepository } from '@/infrastructure/memory/InMemoryPlayerRepository'
import { DepotCompteur, FakePeerLinks, fakeServices, ReseauFactice } from '../fakes'
import { lancer } from './lancerPartie'

const S1 = Dart.single(1)
const S20 = Dart.single(20)
const T20 = Dart.of(20, 'TRIPLE')

const laisser = () => new Promise((resoudre) => setTimeout(resoudre, 0))

/** Deux téléphones sur le même réseau en mémoire : la saisie a la base, le miroir n'a rien. */
const deuxTelephones = (surcharges: Partial<Dependencies> = {}) => {
  const reseau = new ReseauFactice()
  const saisie = fakeServices({ peerLinks: new FakePeerLinks(reseau), ...surcharges })
  const miroir = fakeServices({ peerLinks: new FakePeerLinks(reseau) })
  return { reseau, saisie, miroir }
}

const jumeler = async (saisie: Services, miroir: Services): Promise<void> => {
  await saisie.shareMatch.start()
  const offre = saisie.shareMatch.state()
  if (offre.status !== 'offering') throw new Error(`offre attendue, ${offre.status}`)
  await miroir.watchMatch.answer(offre.token)
  const reponse = miroir.watchMatch.state()
  if (reponse.status !== 'answering') throw new Error(`réponse attendue, ${reponse.status}`)
  await saisie.shareMatch.acceptAnswer(reponse.token)
  await laisser()
}

/** Le nombre de volées au journal projeté du miroir. */
const volees = (miroir: Services): number | null => {
  const v = vue(miroir)
  return v === null ? null : GameModes.visitCount(v.state)
}

function vue(miroir: Services): MirrorView | null {
  const etat = miroir.watchMatch.state()
  return 'view' in etat ? etat.view : null
}

const joueurs = async (services: Services, mode: GameModeId): Promise<readonly PlayerId[]> => {
  const lea = await services.managePlayers.create('Léa', 'lagon', 'FEMININE')
  const tom = await services.managePlayers.create('Tom', 'brique')
  return mode === 'CHECKOUT_PRACTICE' ? [lea.id] : [lea.id, tom.id]
}

const etat = async (dependencies: Dependencies, id: MatchId): Promise<AnyMatchState> => {
  const record = await dependencies.matches.findById(id)
  if (!record) throw new Error('partie introuvable')
  return GameModes.project(record.events)
}

const jouer = async (services: Services, mode: GameModeId, id: MatchId, darts: Dart[]) => {
  switch (mode) {
    case 'X01':
      return services.recordVisit.execute({ matchId: id, darts })
    case 'TOUR_DU_MONDE':
      return services.playTourDuMonde.recordVisit(id, darts)
    case 'CRICKET':
      return services.playCricket.recordVisit(id, darts)
    case 'KILLER':
      return services.playKiller.recordVisit(id, darts)
    case 'CHECKOUT_PRACTICE':
      return services.playCheckoutPractice.recordVisit(id, darts)
  }
}

/** Ce que ferait `useVoleeEnCours` : publier l'état affiché et les fléchettes en cours. */
const publier = async (
  telephone: { services: Services; dependencies: Dependencies },
  id: MatchId,
  darts: Dart[] = [],
) => {
  telephone.services.shareMatch.publish({
    matchId: id,
    base: await etat(telephone.dependencies, id),
    darts,
  })
  await laisser()
}

describe('Écran miroir : jumelage et partage', () => {
  it('jumelage de bout en bout : offre, réponse, connexion des deux côtés', async () => {
    const { saisie, miroir } = deuxTelephones()
    expect(saisie.services.shareMatch.state()).toEqual({ status: 'idle' })
    expect(miroir.services.watchMatch.state()).toEqual({ status: 'idle' })

    await jumeler(saisie.services, miroir.services)

    expect(saisie.services.shareMatch.state()).toEqual({ status: 'connected' })
    // Sans partie publiée : « En attente d'une partie ».
    expect(miroir.services.watchMatch.state()).toEqual({ status: 'connected', view: null })
  })

  it('inactive, la session retient seulement : aucune lecture de la base, aucun lien', async () => {
    const matches = new DepotCompteur()
    const reseau = new ReseauFactice()
    const liens = new FakePeerLinks(reseau)
    const saisie = fakeServices({ matches, peerLinks: liens })
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    const base = await etat(saisie.dependencies, id)
    const lecturesAvant = matches.lectures

    for (let i = 0; i < 5; i++)
      saisie.services.shareMatch.publish({ matchId: id, base, darts: [S20] })
    await laisser()

    expect(matches.lectures).toBe(lecturesAvant)
    expect(liens.offresFaites).toBe(0)
  })

  it.each(GAME_MODE_IDS)(
    '%s : instantané complet à l’ouverture, puis chaque volée suit',
    async (mode) => {
      const { saisie, miroir } = deuxTelephones()
      const id = await lancer(saisie.services, mode, await joueurs(saisie.services, mode))
      // Publiée avant le jumelage : envoyée dès l'ouverture.
      await publier(saisie, id, [S1])
      await jumeler(saisie.services, miroir.services)

      const premiere = vue(miroir.services)
      expect(premiere?.record.id).toBe(id)
      expect(premiere?.state.mode).toBe(mode)
      expect(premiere?.darts).toEqual([S1])
      expect(premiere?.players.map((j) => j.name)).toContain('Léa')

      await jouer(saisie.services, mode, id, [S1, S1, S1])
      await publier(saisie, id)
      const apres = vue(miroir.services)
      expect(apres && GameModes.visitCount(apres.state)).toBe(
        GameModes.visitCount(await etat(saisie.dependencies, id)),
      )
      expect(apres?.darts).toEqual([])
    },
  )

  it('annuler une fléchette sur la saisie la retire du miroir', async () => {
    const { saisie, miroir } = deuxTelephones()
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    await jumeler(saisie.services, miroir.services)

    await publier(saisie, id, [T20, T20])
    expect(vue(miroir.services)?.darts).toEqual([T20, T20])
    await publier(saisie, id, [T20])
    expect(vue(miroir.services)?.darts).toEqual([T20])
  })

  it('annuler une volée enregistrée : le miroir suit le journal rouvert, la volée revient en cours', async () => {
    const { saisie, miroir } = deuxTelephones()
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    await jumeler(saisie.services, miroir.services)
    await saisie.services.recordVisit.execute({ matchId: id, darts: [T20, T20, T20] })
    await publier(saisie, id)
    expect(volees(miroir.services)).toBe(1)

    const rouverte = await saisie.services.undoLastVisit.execute(id)
    saisie.services.shareMatch.publish({ matchId: id, base: rouverte.state, darts: rouverte.darts })
    await laisser()

    expect(volees(miroir.services)).toBe(0)
    expect(vue(miroir.services)?.darts).toEqual([T20, T20])
  })

  it('une volée incohérente avec le journal n’est jamais montrée', async () => {
    const { saisie, miroir, reseau } = deuxTelephones()
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    await jumeler(saisie.services, miroir.services)
    await publier(saisie, id)
    const lien = reseau.derniere.saisie

    lien.send(MirrorProtocol.encodeVisit(id, 7, [S20]))
    expect(vue(miroir.services)?.darts).toEqual([])
    lien.send(MirrorProtocol.encodeVisit('autre' as MatchId, 0, [S20]))
    expect(vue(miroir.services)?.darts).toEqual([])
    lien.send(MirrorProtocol.encodeVisit(id, 0, [S20]))
    expect(vue(miroir.services)?.darts).toEqual([S20])
  })

  it('un message invalide est ignoré : la dernière image reste', async () => {
    const { saisie, miroir, reseau } = deuxTelephones()
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    await jumeler(saisie.services, miroir.services)
    await publier(saisie, id, [S20])
    const avant = miroir.services.watchMatch.state()

    reseau.derniere.saisie.send('{"app":"dartpero-miroir","v":1,"type":"partie"}')
    reseau.derniere.saisie.send('n’importe quoi')

    expect(miroir.services.watchMatch.state()).toBe(avant)
  })

  it('une autre version de protocole : refus propre, lien fermé', async () => {
    const { saisie, miroir, reseau } = deuxTelephones()
    await jumeler(saisie.services, miroir.services)

    reseau.derniere.saisie.send(MirrorProtocol.encodeStop().replace('"v":1', '"v":2'))

    expect(miroir.services.watchMatch.state()).toEqual({ status: 'failed', reason: 'incompatible' })
    expect(reseau.derniere.miroir.state()).toBe('closed')
  })

  it('fusion « le dernier gagne » : partie avant volée, jamais d’état intermédiaire en retard', async () => {
    // Les profils se lisent lentement : la partie suivante s'enregistre pendant l'envoi.
    class ProfilsLents extends InMemoryPlayerRepository {
      porte: Promise<void> | null = null
      ouvrir = () => {}
      override async findById(id: Parameters<InMemoryPlayerRepository['findById']>[0]) {
        if (this.porte) await this.porte
        return super.findById(id)
      }
    }
    const lents = new ProfilsLents()
    const { saisie, miroir, reseau } = deuxTelephones({ players: lents })
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    await jumeler(saisie.services, miroir.services)
    await publier(saisie, id)

    lents.porte = new Promise((resoudre) => {
      lents.ouvrir = resoudre
    })
    const envoisAvant = reseau.derniere.saisie.envois.length
    for (const darts of [
      [S1, S1, S1],
      [S20, S20, S20],
      [T20, T20, T20],
    ]) {
      await saisie.services.recordVisit.execute({ matchId: id, darts })
      saisie.services.shareMatch.publish({
        matchId: id,
        base: await etat(saisie.dependencies, id),
        darts: [],
      })
    }
    saisie.services.shareMatch.publish({
      matchId: id,
      base: await etat(saisie.dependencies, id),
      darts: [T20],
    })
    lents.porte = null
    lents.ouvrir()
    await laisser()
    await laisser()

    const types = reseau.derniere.saisie.envois
      .slice(envoisAvant)
      .map((message) => JSON.parse(message).type as string)
    expect(types.filter((type) => type === 'partie').length).toBeLessThanOrEqual(2)
    expect(types.at(-1)).toBe('volee')
    expect(types.indexOf('partie')).toBeLessThan(types.lastIndexOf('volee'))
    expect(volees(miroir.services)).toBe(3)
    expect(vue(miroir.services)?.darts).toEqual([T20])
  })

  it('coupure puis retour du lien : dernière image figée, puis instantané renvoyé', async () => {
    const { saisie, miroir, reseau } = deuxTelephones()
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    await jumeler(saisie.services, miroir.services)
    await publier(saisie, id, [S20])
    const figee = vue(miroir.services)

    reseau.couper()
    expect(saisie.services.shareMatch.state()).toEqual({ status: 'lost' })
    expect(miroir.services.watchMatch.state()).toEqual({ status: 'lost', view: figee })

    // La saisie continue pendant la coupure.
    await saisie.services.recordVisit.execute({ matchId: id, darts: [T20, T20, T20] })
    await publier(saisie, id, [S1])
    expect(vue(miroir.services)).toBe(figee)

    reseau.retablir()
    await laisser()
    expect(saisie.services.shareMatch.state()).toEqual({ status: 'connected' })
    expect(volees(miroir.services)).toBe(1)
    expect(vue(miroir.services)?.darts).toEqual([S1])
  })

  it('miroir rechargé (rejeu à froid) : nouveau jumelage, instantané complet', async () => {
    const reseau = new ReseauFactice()
    const saisie = fakeServices({ peerLinks: new FakePeerLinks(reseau) })
    const id = await lancer(saisie.services, 'CRICKET', await joueurs(saisie.services, 'CRICKET'))
    await saisie.services.playCricket.recordVisit(id, [T20, S20, S1])
    await publier(saisie, id, [S20])
    const ancien = fakeServices({ peerLinks: new FakePeerLinks(reseau) })
    await jumeler(saisie.services, ancien.services)

    // Rechargé : de nouveaux services, rien de mémorisé ; la saisie voit le lien perdu.
    reseau.derniere.miroir.close()
    expect(saisie.services.shareMatch.state()).toEqual({ status: 'lost' })
    const neuf = fakeServices({ peerLinks: new FakePeerLinks(reseau) })
    await jumeler(saisie.services, neuf.services)

    const rejouee = vue(neuf.services)
    expect(rejouee?.state).toEqual(await etat(saisie.dependencies, id))
    expect(rejouee?.darts).toEqual([S20])
  })

  it('nouveau jumelage côté saisie : l’ancien lien est fermé, l’ancien miroir voit « arrêté »', async () => {
    const { saisie, miroir, reseau } = deuxTelephones()
    await jumeler(saisie.services, miroir.services)
    const ancien = reseau.derniere

    await saisie.services.shareMatch.start()

    expect(ancien.saisie.state()).toBe('closed')
    expect(miroir.services.watchMatch.state().status).toBe('stopped')
  })

  it('« Arrêter le partage » : la saisie revient au repos, le miroir distingue arrêté de perdu', async () => {
    const { saisie, miroir } = deuxTelephones()
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    await jumeler(saisie.services, miroir.services)
    await publier(saisie, id)
    const derniere = vue(miroir.services)

    saisie.services.shareMatch.stop()

    expect(saisie.services.shareMatch.state()).toEqual({ status: 'idle' })
    expect(miroir.services.watchMatch.state()).toEqual({ status: 'stopped', view: derniere })
  })

  it('le miroir suit tout seul une nouvelle partie lancée sur la saisie', async () => {
    const { saisie, miroir } = deuxTelephones()
    const ids = await joueurs(saisie.services, 'X01')
    const premiere = await lancer(saisie.services, 'X01', ids)
    await jumeler(saisie.services, miroir.services)
    await publier(saisie, premiere)

    const seconde = await lancer(saisie.services, 'KILLER', ids)
    await publier(saisie, seconde)

    expect(vue(miroir.services)?.record.id).toBe(seconde)
    expect(vue(miroir.services)?.players.find((j) => j.name === 'Léa')?.gender).toBe('FEMININE')
  })

  it('fin de partie : lue au journal seulement ; une volée en cours n’y est plus appliquée', async () => {
    const { saisie, miroir, reseau } = deuxTelephones()
    const id = await lancer(
      saisie.services,
      'CHECKOUT_PRACTICE',
      await joueurs(saisie.services, 'CHECKOUT_PRACTICE'),
    )
    await jumeler(saisie.services, miroir.services)
    for (let i = 0; i < 3; i++)
      await saisie.services.playCheckoutPractice.recordVisit(id, [S1, S1, S1])
    await publier(saisie, id)
    const fin = vue(miroir.services)
    expect(fin && GameModes.isFinished(fin.state)).toBe(true)

    reseau.derniere.saisie.send(
      MirrorProtocol.encodeVisit(id, GameModes.visitCount(fin?.state as AnyMatchState), [S1]),
    )
    expect(vue(miroir.services)?.darts).toEqual([])
  })

  it('la saisie est sourde : aucun écouteur de messages, rien d’écrit chez elle', async () => {
    const { saisie, miroir, reseau } = deuxTelephones()
    const id = await lancer(saisie.services, 'X01', await joueurs(saisie.services, 'X01'))
    await jumeler(saisie.services, miroir.services)
    await publier(saisie, id)
    const avant = await saisie.dependencies.matches.findById(id)

    expect(reseau.derniere.saisie.ecoutes).toBe(0)
    reseau.derniere.miroir.send(
      MirrorProtocol.encodeMatch({ ...(avant as NonNullable<typeof avant>), events: [] }, []),
    )
    reseau.derniere.miroir.send(MirrorProtocol.encodeStop())
    await laisser()

    expect(await saisie.dependencies.matches.findById(id)).toEqual(avant)
    expect(saisie.services.shareMatch.state()).toEqual({ status: 'connected' })
  })

  it('le miroir n’écrit rien : ni partie, ni profil, ni brouillon', async () => {
    const { saisie, miroir } = deuxTelephones()
    const id = await lancer(saisie.services, 'KILLER', await joueurs(saisie.services, 'KILLER'))
    await jumeler(saisie.services, miroir.services)
    await publier(saisie, id, [S20])
    // Précondition : le miroir a bien reçu la partie.
    expect(vue(miroir.services)?.record.id).toBe(id)

    expect(await miroir.dependencies.matches.listAll()).toEqual([])
    expect(await miroir.dependencies.players.listAll()).toEqual([])
    expect(await miroir.dependencies.visitDrafts.findById(id)).toBeNull()
  })

  it('échecs typés : jeton illisible, incompatible, réponse refusée, appareil sans lien', async () => {
    const { saisie, miroir } = deuxTelephones()
    await miroir.services.watchMatch.answer('n’importe quoi')
    expect(miroir.services.watchMatch.state()).toEqual({ status: 'failed', reason: 'unreadable' })
    await miroir.services.watchMatch.answer('INCOMPATIBLE')
    expect(miroir.services.watchMatch.state()).toEqual({ status: 'failed', reason: 'incompatible' })

    await saisie.services.shareMatch.start()
    const offre = saisie.services.shareMatch.state()
    await saisie.services.shareMatch.acceptAnswer('mauvais')
    expect(saisie.services.shareMatch.state()).toEqual({
      status: 'offering',
      token: offre.status === 'offering' ? offre.token : '',
      rejected: 'unreadable',
    })

    const seul = fakeServices({ peerLinks: new FakePeerLinks(undefined, { indisponible: true }) })
    await seul.services.shareMatch.start()
    expect(seul.services.shareMatch.state()).toEqual({ status: 'failed', reason: 'unavailable' })
    await seul.services.watchMatch.answer('x')
    expect(seul.services.watchMatch.state()).toEqual({ status: 'failed', reason: 'unavailable' })
  })
})
