import { describe, expect, it } from 'vitest'
import { annonceCricket, annonceFinDeVolee, annonceIssue, annonceVolee, en, fr } from '@/ui/labels'

describe('Annonces vocales — segments typés par langue', () => {
  it('un score se dit en français, en chiffres', () => {
    expect(annonceVolee(140, 'SCORED')).toEqual([{ texte: '140', langue: 'fr-FR' }])
  })

  it('« Bust » et « Checkout » se disent en en-US, seuls dans leur segment', () => {
    expect(annonceVolee(0, 'BUSTED')).toEqual([{ texte: 'Bust', langue: 'en-US' }])
    expect(annonceVolee(60, 'CHECKOUT')).toEqual([{ texte: 'Checkout', langue: 'en-US' }])
    expect(annonceIssue('BUSTED')).toEqual([{ texte: 'Bust', langue: 'en-US' }])
    expect(annonceIssue('CHECKOUT')).toEqual([{ texte: 'Checkout', langue: 'en-US' }])
    expect(annonceIssue('SCORED')).toEqual([{ texte: 'Raté', langue: 'fr-FR' }])
  })

  it('le tour suit le résultat : le point reste dans le segment français', () => {
    expect(annonceFinDeVolee(annonceVolee(0, 'BUSTED'), 'Julien')).toEqual([
      { texte: 'Bust', langue: 'en-US' },
      { texte: '. À toi, Julien', langue: 'fr-FR' },
    ])
    expect(annonceFinDeVolee(annonceVolee(180, 'SCORED'), 'Julien')).toEqual([
      { texte: '180', langue: 'fr-FR' },
      { texte: '. À toi, Julien', langue: 'fr-FR' },
    ])
  })

  it('sans résultat, seul le tour est dit ; sans prochain joueur, seul le résultat', () => {
    expect(annonceFinDeVolee(null, 'Sarah')).toEqual([fr('À toi, Sarah')])
    expect(annonceFinDeVolee(annonceVolee(0, 'BUSTED'), null)).toEqual([en('Bust')])
    expect(annonceFinDeVolee(null, null)).toEqual([])
  })

  it('le Cricket reste en français, et une volée blanche ne dit rien', () => {
    expect(annonceCricket({ points: 40, fermees: 0, gagnee: false, cutThroat: false })).toEqual([
      fr('40'),
    ])
    expect(annonceCricket({ points: 0, fermees: 0, gagnee: false, cutThroat: false })).toBeNull()
  })
})
