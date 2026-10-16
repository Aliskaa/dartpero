import { describe, expect, it } from 'vitest'
import { BOGEY_NUMBERS, FREE_OUT_NO_FINISH } from '@/core/domain/services/checkout'
import { fakeServices } from '../fakes'

describe('GetCheckoutRange', () => {
  it('sur un double : 170 et les bogey numbers', () => {
    const { services } = fakeServices()
    expect(services.getCheckoutRange.execute({ doubleOut: true })).toEqual({
      max: 170,
      noFinish: BOGEY_NUMBERS,
    })
  })

  it('en sortie libre : 180 et les restes sans finish en 3 fléchettes', () => {
    const { services } = fakeServices()
    expect(services.getCheckoutRange.execute({ doubleOut: false })).toEqual({
      max: 180,
      noFinish: FREE_OUT_NO_FINISH,
    })
  })

  it('l’entraînement, toujours sur un double, ne propose jamais S1', () => {
    const { services } = fakeServices()
    expect(
      services.getCheckoutSuggestion.execute({
        remaining: 1,
        dartsLeft: 3,
        config: { doubleOut: true },
      }),
    ).toBeNull()
  })
})
