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

/** Lit le jeu dans l'URL ; un slug inconnu renvoie à l'étape 1 en remplaçant l'entrée. */
const AvecJeu = ({ children }: { readonly children: (mode: GameModeId) => ReactNode }) => {
  const { jeu } = useParams()
  const mode = modeDuSlug(jeu)
  if (mode === null) return <Navigate to={cheminNouvellePartie()} replace />
  return <>{children(mode)}</>
}

/** L'étape 3 n'existe qu'à partir de deux joueurs. ⚠️ La garde attend les profils : sélection vide pendant le chargement. */
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

/** « Nouvelle partie » en trois étapes. ⚠️ Chaque étape est une route ; ce composant reste monté et seul appelle `useNouvellePartie`. */
export const NouvellePartieEcran = () => {
  const partie = useNouvellePartie()
  const { pathname } = useLocation()

  // Chaque étape s'ouvre en haut de page (appel optionnel : jsdom sans `scrollTo`).
  // biome-ignore lint/correctness/useExhaustiveDependencies: on remonte à chaque changement d'étape.
  useEffect(() => {
    document.scrollingElement?.scrollTo?.({ top: 0 })
  }, [pathname])

  return (
    <main className="feutre-tapis flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <Routes>
        <Route index element={<EtapeJeu partie={partie} />} />
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
                  onCreer={(nom, genre) => partie.creerJoueur(mode, nom, genre)}
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
