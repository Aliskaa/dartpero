/**
 * Lot 0 — page de validation du scaffold.
 *
 * Son seul rôle : vérifier à l'œil que la charte « pub anglais / oche » est bien
 * câblée (palette, polices, matières) et que la chaîne Vite + Tailwind + PWA tourne.
 * Elle sera remplacée par le vrai écran d'accueil au lot 3.
 */

const PALETTE = [
  { nom: 'feutre', classe: 'bg-feutre', role: 'Fond (tapis)' },
  { nom: 'ardoise', classe: 'bg-ardoise', role: 'Surfaces' },
  { nom: 'chene', classe: 'bg-chene', role: 'Bois, bordures' },
  { nom: 'laiton', classe: 'bg-laiton', role: 'Accent principal' },
  { nom: 'craie', classe: 'bg-craie', role: 'Texte' },
  { nom: 'rouge-cible', classe: 'bg-rouge-cible', role: 'Bust' },
  { nom: 'vert-cible', classe: 'bg-vert-cible', role: 'Checkout' },
] as const

export default function App() {
  return (
    <main className="feutre-tapis min-h-dvh px-5 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <header className="text-center">
          <p className="font-score text-xs uppercase tracking-[0.35em] text-craie/60">
            Compteur de fléchettes
          </p>
          <h1 className="mt-2 font-display text-5xl text-laiton drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
            Dartpéro
          </h1>
          <p className="mt-3 text-sm text-craie/70">
            501, checkouts et stats — hors ligne, sans compte.
          </p>
        </header>

        {/* Aperçu de la zone LECTURE : c'est elle qui doit se lire à 3 mètres. */}
        <section aria-label="Aperçu du tableau" className="ardoise-craie rounded-2xl px-5 py-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-xl ring-2 ring-laiton px-3 py-4">
              <p className="font-score text-sm uppercase tracking-widest text-laiton">Kevin</p>
              <p className="chiffres mt-1 text-6xl font-bold text-craie-vive">141</p>
              <p className="mt-2 text-xs text-vert-cible">T20 · T11 · D24</p>
            </div>
            <div className="rounded-xl px-3 py-4">
              <p className="font-score text-sm uppercase tracking-widest text-craie/70">Julien</p>
              <p className="chiffres mt-1 text-6xl font-bold text-craie/80">286</p>
              <p className="mt-2 text-xs text-craie/60">moy. 58,4</p>
            </div>
          </div>
        </section>

        <section aria-label="Palette" className="flex flex-col gap-3">
          <h2 className="font-score text-xs uppercase tracking-[0.25em] text-craie/60">Palette</h2>
          <ul className="flex flex-col gap-2">
            {PALETTE.map((couleur) => (
              <li key={couleur.nom} className="flex items-center gap-3 text-sm">
                <span
                  className={`${couleur.classe} size-7 shrink-0 rounded-md ring-1 ring-craie/25`}
                />
                <span className="font-score text-craie">{couleur.nom}</span>
                <span className="ml-auto text-craie/60">{couleur.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Typographie" className="flex flex-col gap-2">
          <h2 className="font-score text-xs uppercase tracking-[0.25em] text-craie/60">
            Typographie
          </h2>
          <p className="font-display text-2xl text-craie">Alfa Slab One — l'enseigne</p>
          <p className="chiffres text-2xl font-bold text-craie">Oswald — 0123456789</p>
          <p className="font-sans text-base text-craie">Barlow — le corps de texte.</p>
        </section>

        <button
          type="button"
          className="laiton-poli min-h-12 rounded-full px-6 font-score text-base font-bold uppercase tracking-widest"
        >
          Bouton primaire
        </button>

        <footer className="text-center text-xs text-craie/60">
          Lot 0 — scaffold. Écran remplacé au lot 3.
        </footer>
      </div>
    </main>
  )
}
