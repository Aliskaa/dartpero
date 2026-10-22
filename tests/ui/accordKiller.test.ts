import { describe, expect, it } from 'vitest'
import {
  accordElimine,
  annonceFinDeVolee,
  annonceKiller,
  effetElimination,
  JOUEUR_SUPPRIME,
  pastilleElimine,
  sousLigneDernierEnVie,
  sousLigneElimination,
  texteConfirmationKiller,
  texteConfirmationKillerVariante,
} from '@/ui/labels'

const texte = (annonce: ReturnType<typeof annonceKiller>) =>
  (annonce ?? []).map((segment) => segment.texte).join('')

describe('Killer — l’accord d’« éliminé »', () => {
  it('accordElimine : féminin pour FEMININE seulement', () => {
    expect(accordElimine('FEMININE')).toBe('éliminée')
    expect(accordElimine('MASCULINE')).toBe('éliminé')
    expect(accordElimine(undefined)).toBe('éliminé')
  })

  it('la pastille de la feuille', () => {
    expect(pastilleElimine('FEMININE')).toBe('Éliminée')
    expect(pastilleElimine('MASCULINE')).toBe('Éliminé')
    expect(pastilleElimine(undefined)).toBe('Éliminé')
  })

  it('la case de la ligne de volée', () => {
    expect(effetElimination('Sarah', 'FEMININE')).toBe('Sarah éliminée')
    expect(effetElimination('Julien', 'MASCULINE')).toBe('Julien éliminé')
    expect(effetElimination(JOUEUR_SUPPRIME, undefined)).toBe('Joueur supprimé éliminé')
  })

  it('le résumé : « Éliminée par Julien », jamais le genre de Julien', () => {
    expect(sousLigneElimination('FEMININE', 'Julien')).toBe('Éliminée par Julien')
    expect(sousLigneElimination('MASCULINE', 'Sarah')).toBe('Éliminé par Sarah')
    expect(sousLigneElimination(undefined, JOUEUR_SUPPRIME)).toBe('Éliminé par Joueur supprimé')
  })

  it('le résumé : une auto-élimination se lit « Éliminé(e) » seul', () => {
    expect(sousLigneElimination('FEMININE', null)).toBe('Éliminée')
    expect(sousLigneElimination(undefined, null)).toBe('Éliminé')
  })

  it('« Dernier en vie » ne s’accorde pas, et compte les vies restantes', () => {
    expect(sousLigneDernierEnVie(1)).toBe('Dernier en vie · 1 vie')
    expect(sousLigneDernierEnVie(3)).toBe('Dernier en vie · 3 vies')
  })

  it('la boîte de sortie, forme ordinaire', () => {
    expect(texteConfirmationKiller('Sarah', 'FEMININE', 'Kevin')).toBe(
      'Sarah est éliminée. Kevin est le dernier en vie : la partie est gagnée dès que vous validez.',
    )
    expect(texteConfirmationKiller('Julien', undefined, 'Léa')).toBe(
      'Julien est éliminé. Léa est le dernier en vie : la partie est gagnée dès que vous validez.',
    )
  })

  it('la boîte de sortie, forme variante', () => {
    expect(texteConfirmationKillerVariante('Julien', 'MASCULINE', 'S8', 'Kevin')).toBe(
      'Julien touche son propre numéro (S8) et est éliminé. Kevin est le dernier en vie : la partie est gagnée dès que vous validez.',
    )
    expect(texteConfirmationKillerVariante('Sarah', 'FEMININE', 'D12', 'Kevin')).toContain(
      'et est éliminée.',
    )
  })

  it('la voix : « devient killer », « est éliminée », et rien sans jalon', () => {
    expect(annonceKiller([])).toBeNull()
    expect(
      texte(
        annonceKiller([
          { type: 'KILLER', nom: 'Kevin' },
          { type: 'ELIMINE', nom: 'Sarah', genre: 'FEMININE' },
        ]),
      ),
    ).toBe('Kevin devient killer. Sarah est éliminée')
    expect(texte(annonceKiller([{ type: 'ELIMINE', nom: 'Julien', genre: undefined }]))).toBe(
      'Julien est éliminé',
    )
  })

  it('la voix à la victoire : l’élimination puis la phrase, sans « À toi »', () => {
    const annonce = annonceFinDeVolee(
      annonceKiller([{ type: 'ELIMINE', nom: 'Julien', genre: 'MASCULINE' }]),
      null,
      'Le tableau a parlé.',
    )
    expect(annonce.map((segment) => segment.texte).join('')).toBe(
      'Julien est éliminé. Le tableau a parlé.',
    )
  })
})
