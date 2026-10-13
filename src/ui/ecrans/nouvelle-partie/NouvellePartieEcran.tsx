import { type ReactNode, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router'
import type { GameModeId } from '@/core/domain/games'
import { cheminNouvellePartie, modeDuSlug } from '@/ui/chemins'
import { SpinnerLigne } from '@/ui/composants/commun/Etats'
import { type NouvellePartie, useNouvellePartie } from '@/ui/hooks/useNouvellePartie'
import { CHARGEMENT_PROFILS } from '@/ui/labels'
import { ChoixJoueursExistants } from './ChoixJoueursExistants'
import { EtapeJeu } from './EtapeJeu'
import { EtapeJoueurs } from './EtapeJoueurs'
import { EtapeOrdre } from './EtapeOrdre'

/**
 * Lit le jeu dans l'URL. Un slug inconnu renvoie à l'étape 1, en **remplaçant**
 * l'entrée : le retour ne doit pas y ramener.
 */
const AvecJeu = ({ children }: { readonly children: (mode: GameModeId) => ReactNode }) => {
  const { jeu } = useParams()
  const mode = modeDuSlug(jeu)
  if (mode === null) return <Navigate to={cheminNouvellePartie()} replace />
  return <>{children(mode)}</>
}

/**
 * L'étape 3 n'existe qu'à partir de deux joueurs, et jamais à l'entraînement.
 *
 * ⚠️ La garde attend les profils : tant qu'ils chargent, la sélection dérivée
 * vaut `[]`, et rediriger à ce moment renverrait à l'étape 2 quelqu'un qui a
 * bien deux joueurs.
 */
const GardeOrdre = ({
  mode,
  partie,
}: {
  readonly mode: GameModeId
  readonly partie: NouvellePartie
}) => {
  if (mode === 'CHECKOUT_PRACTICE') return <Navigate to={cheminNouvellePartie(mode)} replace />
  if (partie.chargement) return <SpinnerLigne label={CHARGEMENT_PROFILS} />
  if (partie.selection(mode).length < 2) {
    return <Navigate to={cheminNouvellePartie(mode)} replace />
  }
  return <EtapeOrdre mode={mode} partie={partie} />
}

/**
 * « Nouvelle partie » en trois étapes : le jeu, puis joueurs et réglages, puis
 * l'ordre de jeu.
 *
 * ⚠️ **Chaque étape est une route** descendante de `/nouvelle-partie/*`, jamais
 * un état interne : c'est ce qui fait que le retour du téléphone ramène à
 * l'étape précédente. Ce composant reste monté d'une étape à l'autre, et c'est
 * lui seul qui appelle `useNouvellePartie` : les choix survivent au retour —
 * le nom tapé à l'étape 1 compris.
 */
export const NouvellePartieEcran = () => {
  const partie = useNouvellePartie()
  const { pathname } = useLocation()

  // Chaque étape s'ouvre en haut de page. Appel optionnel : jsdom n'implémente
  // pas `scrollTo`.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on remonte à chaque changement d'étape.
  useEffect(() => {
    document.scrollingElement?.scrollTo?.({ top: 0 })
  }, [pathname])

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <Routes>
        <Route index element={<EtapeJeu nom={partie.nom} />} />
        <Route
          path=":jeu"
          element={<AvecJeu>{(mode) => <EtapeJoueurs mode={mode} partie={partie} />}</AvecJeu>}
        />
        <Route
          path=":jeu/ordre"
          element={<AvecJeu>{(mode) => <GardeOrdre mode={mode} partie={partie} />}</AvecJeu>}
        />
        <Route
          path=":jeu/joueurs"
          element={
            <AvecJeu>
              {(mode) => (
                <ChoixJoueursExistants
                  mode={mode}
                  profils={partie.profils}
                  chargement={partie.chargement}
                  selection={partie.selection(mode)}
                  max={partie.max(mode)}
                  onBasculer={(id) => partie.basculer(mode, id)}
                  onCreer={(nom) => partie.creerJoueur(mode, nom)}
                />
              )}
            </AvecJeu>
          }
        />
        <Route path="*" element={<Navigate to={cheminNouvellePartie()} replace />} />
      </Routes>
    </main>
  )
}
