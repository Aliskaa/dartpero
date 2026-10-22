/**
 * ⚠️ Le défaut reste **sombre**, pas « système ». Le cadrage du projet est un garage mal éclairé, téléphone
 * en luminosité basse : le sombre est l'app, le clair est une option.
 */
export type Theme = 'sombre' | 'clair' | 'systeme'

/** Ce que le thème vaut une fois « système » résolu — ce qui part dans le DOM. */
export type ThemeResolu = 'sombre' | 'clair'

export const THEMES: readonly Theme[] = ['sombre', 'clair', 'systeme']

export const THEME_DEFAUT: Theme = 'sombre'

export const CLE_THEME = 'theme'

const REQUETE_SOMBRE = '(prefers-color-scheme: dark)'

/**
 * ⚠️ Le `theme_color` du **manifeste** PWA, lui, est figé : une app installée garde sa barre sombre. C'est
 * une limite du format, pas un oubli.
 */
const TEINTE_BARRE: Record<ThemeResolu, string> = {
  sombre: '#0E1A13',
  clair: '#E3D9C1',
}

/**
 * `matchMedia` manque en jsdom et sur de très vieux navigateurs : on retombe alors sur le sombre, qui est
 * le défaut de l'app.
 */
const prefereSombre = (): boolean =>
  typeof window === 'undefined' || !window.matchMedia || window.matchMedia(REQUETE_SOMBRE).matches

export const resoudreTheme = (theme: Theme): ThemeResolu =>
  theme === 'systeme' ? (prefereSombre() ? 'sombre' : 'clair') : theme

/**
 * Pose le thème sur `<html>`. **Le seul endroit** qui écrit `data-theme` : deux écrivains finiraient par se
 * contredire au retour d'un écran.
 */
export const appliquerTheme = (theme: Theme): ThemeResolu => {
  const resolu = resoudreTheme(theme)
  document.documentElement.dataset.theme = resolu
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', TEINTE_BARRE[resolu])
  return resolu
}

/** S'abonne au réglage système. Rend la fonction de désabonnement. */
export const ecouterThemeSysteme = (rappel: () => void): (() => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const requete = window.matchMedia(REQUETE_SOMBRE)
  requete.addEventListener('change', rappel)
  return () => requete.removeEventListener('change', rappel)
}
